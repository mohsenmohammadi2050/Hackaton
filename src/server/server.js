"use strict";

const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const intentContract = require("../ai/provider-intent-contract");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

const MAX_REQUEST_BYTES = 128 * 1024;
const SUPPORTED_PROVIDER_TYPES = Object.freeze(["openrouter", "cerebras", "generic-openai"]);
const PROVIDER_NAMES = Object.freeze({ openrouter: "OpenRouter", cerebras: "Cerebras", "generic-openai": "OpenAI-compatible" });
const ALLOWED_PROJECTION_FIELDS = new Set([
  "projectionVersion", "scenarioId", "branchId", "turn", "turnsRemaining", "patient",
  "currentLocation", "locations", "knownCharacters", "coLocatedCharacters", "self",
  "relevantMemories", "legalOptions", "resolutionPriority", "knowledgeContractVersion",
  "scenarioKnowledge", "observations", "previousAction", "previousResult"
]);
const REASONING_EFFORTS = Object.freeze(["minimal", "low", "medium", "high", "xhigh", "max"]);
const CEREBRAS_REASONING_EFFORTS = Object.freeze(["low", "medium", "high"]);
const STATIC_TYPES = Object.freeze({
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon"
});

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(fs.readFileSync(filePath, "utf8").split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      return [key, value];
    }));
}

function providerTypeFromUrl(baseUrl) {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    if (hostname === "openrouter.ai" || hostname.endsWith(".openrouter.ai")) return "openrouter";
    if (hostname === "cerebras.ai" || hostname.endsWith(".cerebras.ai")) return "cerebras";
  } catch { /* A missing URL is reported by configurationStatus. */ }
  return "generic-openai";
}

function resolveProviderType(explicitType, baseUrl) {
  const requested = String(explicitType || "").trim().toLowerCase();
  if (!requested) return providerTypeFromUrl(baseUrl);
  if (!SUPPORTED_PROVIDER_TYPES.includes(requested)) {
    throw Object.assign(new Error(`Unsupported AI_PROVIDER_TYPE ${requested}. Supported values: ${SUPPORTED_PROVIDER_TYPES.join(", ")}.`), { code: "AI_PROVIDER_TYPE_UNSUPPORTED" });
  }
  return requested;
}

function loadConfiguration(environment = process.env, rootDir = PROJECT_ROOT) {
  const values = Object.assign({}, parseEnvFile(path.join(rootDir, ".env")), environment);
  const baseUrl = String(values.AI_PROVIDER_BASE_URL || "").replace(/\/$/, "");
  const timeoutMs = Number(values.AI_REQUEST_TIMEOUT_MS || 60000);
  const maxRetries = Number(values.AI_MAX_RETRIES || 2);
  const maxOutputTokens = Number(values.AI_MAX_OUTPUT_TOKENS || 800);
  const inputTokenWarning = Number(values.AI_INPUT_TOKEN_WARNING || 6000);
  const reasoningValue = String(values.AI_REASONING_ENABLED || "false").toLowerCase();
  return Object.freeze({
    providerType: resolveProviderType(values.AI_PROVIDER_TYPE, baseUrl),
    baseUrl,
    apiKey: String(values.AI_PROVIDER_API_KEY || ""),
    model: String(values.AI_MODEL || ""),
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 60000,
    maxRetries: Number.isInteger(maxRetries) && maxRetries >= 0 && maxRetries <= 5 ? maxRetries : 2,
    structuredOutputMode: String(values.AI_STRUCTURED_OUTPUT_MODE || "json_schema").toLowerCase(),
    reasoningEnabled: reasoningValue === "true",
    reasoningConfigurationValid: ["true", "false"].includes(reasoningValue),
    reasoningEffort: String(values.AI_REASONING_EFFORT || "medium").toLowerCase(),
    maxOutputTokens: Number.isInteger(maxOutputTokens) && maxOutputTokens > 0 ? maxOutputTokens : 800,
    maxOutputTokensConfigurationValid: Number.isInteger(maxOutputTokens) && maxOutputTokens > 0,
    inputTokenWarning: Number.isInteger(inputTokenWarning) && inputTokenWarning > 0 ? inputTokenWarning : 6000,
    inputTokenWarningConfigurationValid: Number.isInteger(inputTokenWarning) && inputTokenWarning > 0,
    diagnosticLogging: String(values.AI_DIAGNOSTIC_LOGGING || "").toLowerCase() === "true" || String(values.NODE_ENV || "").toLowerCase() === "development",
    port: Number(values.PORT || 8080)
  });
}

function configurationStatus(configuration) {
  const missing = [];
  let providerType;
  try { providerType = resolveProviderType(configuration.providerType, configuration.baseUrl); }
  catch (error) { missing.push(error.message); providerType = null; }
  if (!configuration.baseUrl) missing.push("AI_PROVIDER_BASE_URL");
  if (!configuration.model) missing.push("AI_MODEL");
  if (["openrouter", "cerebras"].includes(providerType) && !configuration.apiKey) missing.push("AI_PROVIDER_API_KEY");
  if (!["json_schema", "json_object"].includes(configuration.structuredOutputMode || "json_schema")) missing.push("AI_STRUCTURED_OUTPUT_MODE (json_schema or json_object)");
  if (providerType === "cerebras" && (configuration.structuredOutputMode || "json_schema") !== "json_schema") missing.push("AI_STRUCTURED_OUTPUT_MODE=json_schema for Cerebras");
  if (configuration.reasoningConfigurationValid === false) missing.push("AI_REASONING_ENABLED (true or false)");
  if (configuration.reasoningEnabled && !REASONING_EFFORTS.includes(configuration.reasoningEffort)) missing.push(`AI_REASONING_EFFORT (${REASONING_EFFORTS.join(", ")})`);
  if (providerType === "cerebras" && configuration.reasoningEnabled && !CEREBRAS_REASONING_EFFORTS.includes(configuration.reasoningEffort)) missing.push(`AI_REASONING_EFFORT (${CEREBRAS_REASONING_EFFORTS.join(", ")}) for Cerebras`);
  if (providerType === "generic-openai" && configuration.reasoningEnabled) missing.push("AI_REASONING_ENABLED=false for generic-openai unless a provider-specific mapper is added");
  if (configuration.maxOutputTokensConfigurationValid === false) missing.push("AI_MAX_OUTPUT_TOKENS (positive integer)");
  if (configuration.inputTokenWarningConfigurationValid === false) missing.push("AI_INPUT_TOKEN_WARNING (positive integer)");
  const providerName = providerType ? PROVIDER_NAMES[providerType] : null;
  return Object.freeze({
    configured: missing.length === 0, providerType, providerName, model: configuration.model || null,
    displayName: providerName && configuration.model ? `${providerName} · ${configuration.model}` : providerName,
    structuredOutputMode: configuration.structuredOutputMode || "json_schema",
    reasoningRequested: Boolean(configuration.reasoningEnabled), reasoningEffort: configuration.reasoningEnabled ? configuration.reasoningEffort : null,
    maxOutputTokens: configuration.maxOutputTokens || 800, inputTokenWarning: configuration.inputTokenWarning || 6000,
    diagnosticLogging: Boolean(configuration.diagnosticLogging), missing
  });
}

function validateDecisionRequest(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Object.assign(new Error("A JSON decision request is required."), { code: "INVALID_REQUEST" });
  const allowed = new Set(["protocol", "actorId", "projection", "attempt", "outputContract", "validationFeedback"]);
  const unexpected = Object.keys(value).find((key) => !allowed.has(key));
  if (unexpected) throw Object.assign(new Error(`Unsupported request field ${unexpected}.`), { code: "INVALID_REQUEST" });
  if (value.protocol !== "forked-fates-decision-provider-v1" || typeof value.actorId !== "string" || !Number.isInteger(value.attempt)) {
    throw Object.assign(new Error("The provider protocol, actor identity, and attempt are required."), { code: "INVALID_REQUEST" });
  }
  const projection = value.projection;
  if (!projection || typeof projection !== "object" || Array.isArray(projection) || projection.self?.id !== value.actorId) {
    throw Object.assign(new Error("The request must contain the actor's owned projection."), { code: "INVALID_REQUEST" });
  }
  const forbidden = Object.keys(projection).find((key) => !ALLOWED_PROJECTION_FIELDS.has(key));
  if (forbidden) throw Object.assign(new Error(`Owned projection contains forbidden field ${forbidden}.`), { code: "PRIVACY_BOUNDARY" });
  for (const key of ["facts", "events", "boundaries", "outcome", "npcs", "worldTruth", "privateState"]) {
    if (Object.prototype.hasOwnProperty.call(projection, key)) throw Object.assign(new Error(`Owned projection must not expose ${key}.`), { code: "PRIVACY_BOUNDARY" });
  }
  if (!Array.isArray(projection.relevantMemories) || projection.relevantMemories.some((memory) => memory.ownerId !== value.actorId)) {
    throw Object.assign(new Error("Every supplied memory must belong to the requesting actor."), { code: "PRIVACY_BOUNDARY" });
  }
  return value;
}

function extractJsonObject(text) {
  if (typeof text !== "string") throw new Error("Model content must be text.");
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') { inString = true; continue; }
    if (character === "{") { if (depth === 0) start = index; depth += 1; }
    else if (character === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        const candidate = text.slice(start, index + 1);
        const parsed = JSON.parse(candidate);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Model output must contain one JSON object.");
        return JSON.stringify(parsed);
      }
    }
  }
  throw new Error("Model output did not contain a complete JSON object.");
}

function systemPrompt() {
  return [
    "You decide for exactly one Forked Fates character.",
    "Use only the supplied owned projection. Never invent identities or hidden facts.",
    "Reason internally from the owned projection, but never return private chain-of-thought or step-by-step reasoning.",
    "If repeating the previous semantic action, use the concise rationale to explain why updated owned context makes repetition useful.",
    "Return exactly one JSON object and no prose.",
    "The object must use the existing intent fields: id, actorId, action, chosenAtTurn, servedGoalId, rationale, citedMemoryIds, plus only fields legal for that action.",
    "Legal actions are Move, Investigate, Communicate, Transfer, Administer, Accuse, and Wait.",
    "Use a stable kebab-case id, a concise rationale under 280 characters, one owned goal, and only supplied memory IDs."
  ].join(" ");
}

function providerMessages(request, feedback) {
  return [
    { role: "system", content: systemPrompt() },
    { role: "user", content: JSON.stringify({ actorId: request.actorId, attempt: request.attempt, ownedState: request.projection, outputContract: request.outputContract, validationFeedback: feedback || request.validationFeedback || null }) }
  ];
}

function isOpenRouter(baseUrl) {
  return providerTypeFromUrl(baseUrl) === "openrouter";
}

function responseFormatFor(request, configuration) {
  if ((configuration.structuredOutputMode || "json_schema") === "json_object") return { type: "json_object" };
  return {
    type: "json_schema",
    json_schema: {
      name: "forked_fates_intent",
      strict: true,
      schema: intentContract.createIntentJsonSchema(request.projection)
    }
  };
}

function resolveChatCompletionsEndpoint(baseUrl) {
  const normalized = String(baseUrl || "").replace(/\/+$/, "");
  return /\/chat\/completions$/i.test(normalized) ? normalized : `${normalized}/chat/completions`;
}

function mapProviderRequest(request, configuration, feedback) {
  const providerType = resolveProviderType(configuration.providerType, configuration.baseUrl);
  const messages = providerMessages(request, feedback);
  const body = {
    model: configuration.model,
    messages,
    response_format: responseFormatFor(request, configuration)
  };
  const headers = { "content-type": "application/json", accept: "application/json" };
  if (configuration.apiKey) headers.authorization = `Bearer ${configuration.apiKey}`;

  if (providerType === "openrouter") {
    body.temperature = 0.2;
    body.max_tokens = configuration.maxOutputTokens || 800;
    if (configuration.reasoningEnabled) body.reasoning = { effort: configuration.reasoningEffort, exclude: true };
    body.provider = { require_parameters: true };
  } else if (providerType === "cerebras") {
    body.max_completion_tokens = configuration.maxOutputTokens || 800;
    headers["X-Cerebras-Version-Patch"] = "2";
    if (configuration.reasoningEnabled) {
      body.reasoning_effort = configuration.reasoningEffort;
      body.reasoning_format = "hidden";
    }
  } else {
    body.max_tokens = configuration.maxOutputTokens || 800;
  }

  return Object.freeze({
    providerType,
    providerName: PROVIDER_NAMES[providerType],
    endpoint: resolveChatCompletionsEndpoint(configuration.baseUrl),
    headers: Object.freeze(headers),
    body: Object.freeze(body),
    estimatedInputTokens: Math.ceil(Buffer.byteLength(JSON.stringify(messages), "utf8") / 4)
  });
}

function redactDiagnosticText(value, configuration, messages) {
  let safe = String(value ?? "");
  if (configuration.apiKey) safe = safe.split(configuration.apiKey).join("[REDACTED_KEY]");
  safe = safe.replace(/Bearer\s+[^\s"']+/gi, "Bearer [REDACTED]");
  const promptValues = [];
  const collectStrings = (candidate) => {
    if (typeof candidate === "string") { if (candidate.length >= 4) promptValues.push(candidate); return; }
    if (Array.isArray(candidate)) { for (const item of candidate) collectStrings(item); return; }
    if (candidate && typeof candidate === "object") for (const item of Object.values(candidate)) collectStrings(item);
  };
  for (const message of messages || []) {
    if (typeof message?.content !== "string" || !message.content) continue;
    promptValues.push(message.content);
    try { collectStrings(JSON.parse(message.content)); }
    catch { promptValues.push(...(message.content.match(/[^.!?]+[.!?]?/g) || []).map((part) => part.trim()).filter((part) => part.length >= 12)); }
  }
  for (const promptValue of [...new Set(promptValues)].sort((left, right) => right.length - left.length)) safe = safe.split(promptValue).join("[REDACTED_PROMPT]");
  if (/(?:ownedState|owned projection|scenarioKnowledge|private projection)/i.test(safe)) return "[REDACTED_PRIVATE_CONTENT]";
  return safe.slice(0, 1000);
}

function safeProviderErrorResponse(raw, configuration, messages) {
  const text = String(raw ?? "");
  const summary = {
    format: "non-json",
    byteLength: Buffer.byteLength(text, "utf8"),
    fingerprint: crypto.createHash("sha256").update(text).digest("hex")
  };
  let envelope;
  try { envelope = JSON.parse(text); } catch { return Object.freeze(summary); }
  const error = envelope && typeof envelope === "object" && !Array.isArray(envelope)
    ? (envelope.error && typeof envelope.error === "object" && !Array.isArray(envelope.error) ? envelope.error : envelope)
    : {};
  const scalar = (value) => ["string", "number", "boolean"].includes(typeof value)
    ? redactDiagnosticText(value, configuration, messages)
    : null;
  return Object.freeze({
    ...summary,
    format: "json",
    error: Object.freeze({
      code: scalar(error.code),
      type: scalar(error.type),
      message: scalar(error.message),
      errorType: scalar(error.error_type ?? error.metadata?.error_type ?? envelope.error_type)
    })
  });
}

function stableSerialize(value) {
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
  return JSON.stringify(value) ?? "null";
}

function projectionFingerprint(projection) {
  return crypto.createHash("sha256").update(stableSerialize(projection)).digest("hex");
}

function projectionDiagnostic(request, tracker) {
  const projection = request.projection || {};
  const fingerprint = projectionFingerprint(projection);
  const key = `${projection.branchId || "unknown-branch"}:${request.actorId || "unknown-actor"}`;
  let differs = null;
  if (tracker) {
    const previous = tracker.get(key);
    if (!previous || previous.turn < projection.turn) {
      differs = previous ? previous.fingerprint !== fingerprint : null;
      tracker.set(key, { turn: projection.turn, fingerprint, differsFromPreviousTurn: differs });
    } else if (previous.turn === projection.turn) differs = previous.differsFromPreviousTurn;
  }
  return Object.freeze({
    branchId: projection.branchId || null,
    resolvingTurn: Number.isInteger(projection.turn) ? projection.turn + 1 : null,
    projectionFingerprint: fingerprint,
    projectionDiffersFromPreviousTurn: differs,
    previousAuthoritativeResult: projection.previousResult
      ? { turn: projection.previousResult.turn, eventId: projection.previousResult.eventId, status: projection.previousResult.status, category: projection.previousResult.category }
      : null
  });
}

function normalizedModelDiagnostic(content, error) {
  let parsed = null;
  try { parsed = typeof content === "string" ? JSON.parse(content) : content; } catch { parsed = null; }
  return Object.freeze({
    action: typeof parsed?.action === "string" ? parsed.action : null,
    semanticTarget: parsed?.subject || parsed?.targetLocationId || parsed?.targetId || parsed?.itemId || parsed?.audience || null,
    servedGoalId: typeof parsed?.servedGoalId === "string" ? parsed.servedGoalId : null,
    citedMemoryIds: Array.isArray(parsed?.citedMemoryIds) ? parsed.citedMemoryIds.filter((id) => typeof id === "string") : [],
    rationaleFingerprint: typeof parsed?.rationale === "string" ? crypto.createHash("sha256").update(parsed.rationale).digest("hex") : null,
    rationaleLength: typeof parsed?.rationale === "string" ? parsed.rationale.length : 0,
    fields: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? Object.keys(parsed).sort() : [],
    validationError: error?.message || null
  });
}

function writeDiagnostic(configuration, record) {
  if (!configuration.diagnosticLogging) return;
  const logger = configuration.logger || console;
  const write = typeof logger.info === "function" ? logger.info.bind(logger) : typeof logger.log === "function" ? logger.log.bind(logger) : null;
  if (write) write("[Forked Fates AI provider]", Object.freeze(record));
}

function writeInputTokenWarning(configuration, record) {
  if (!configuration.diagnosticLogging) return;
  const logger = configuration.logger || console;
  const write = typeof logger.warn === "function" ? logger.warn.bind(logger) : typeof logger.info === "function" ? logger.info.bind(logger) : null;
  if (write) write("[Forked Fates AI token warning]", Object.freeze(record));
}

function structuredOutputError(configuration) {
  const providerType = resolveProviderType(configuration.providerType, configuration.baseUrl);
  const providerName = PROVIDER_NAMES[providerType];
  if (configuration.reasoningEnabled) {
    return Object.assign(new Error(`${providerName} rejected the requested reasoning and strict structured-output parameters. Choose a compatible model or explicitly change the configuration.`), { code: "AI_REASONING_UNSUPPORTED", status: 502, retryable: false });
  }
  const mode = configuration.structuredOutputMode || "json_schema";
  if (providerType === "openrouter") {
    const openRouterMessage = mode === "json_schema"
      ? "Configured provider/model rejected strict JSON Schema output. Choose a route that supports response_format json_schema, or explicitly set AI_STRUCTURED_OUTPUT_MODE=json_object to use validated JSON mode."
      : "Configured provider/model rejected explicitly configured JSON object output.";
    return Object.assign(new Error(openRouterMessage), { code: "AI_STRUCTURED_OUTPUT_UNSUPPORTED", status: 502, retryable: false });
  }
  const message = mode === "json_schema"
    ? `${providerName} rejected strict JSON Schema output. Choose a compatible model; strict output will not be silently disabled.`
    : `${providerName} rejected explicitly configured JSON object output.`;
  return Object.assign(new Error(message), { code: "AI_STRUCTURED_OUTPUT_UNSUPPORTED", status: 502, retryable: false });
}

function usageDiagnostic(envelope) {
  const usage = envelope?.usage || {};
  const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? null;
  const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? null;
  const totalTokens = usage.total_tokens ?? (Number.isFinite(promptTokens) && Number.isFinite(completionTokens) ? promptTokens + completionTokens : null);
  const reasoningTokens = usage.completion_tokens_details?.reasoning_tokens ?? usage.reasoning_tokens ?? null;
  return {
    tokenUsage: {
      promptTokens: Number.isFinite(promptTokens) ? promptTokens : null,
      completionTokens: Number.isFinite(completionTokens) ? completionTokens : null,
      totalTokens: Number.isFinite(totalTokens) ? totalTokens : null,
      reasoningTokens: Number.isFinite(reasoningTokens) ? reasoningTokens : null
    }
  };
}

function reasoningDiagnostic(configuration, envelope, providerType) {
  const tokens = envelope?.usage?.completion_tokens_details?.reasoning_tokens ?? envelope?.usage?.reasoning_tokens ?? null;
  return {
    reasoningRequested: Boolean(configuration.reasoningEnabled),
    reasoningEffort: configuration.reasoningEnabled ? configuration.reasoningEffort : null,
    reasoningSupported: !configuration.reasoningEnabled ? false : ["openrouter", "cerebras"].includes(providerType) || Number.isFinite(tokens) ? true : "unknown",
    reasoningTokenCount: Number.isFinite(tokens) ? tokens : null
  };
}

async function requestModelDecision(request, configuration, fetchImpl = globalThis.fetch, diagnosticTracker = null) {
  const status = configurationStatus(configuration);
  if (!status.configured) throw Object.assign(new Error(`AI Live setup is incomplete: ${status.missing.join(", ")}.`), { code: "AI_NOT_CONFIGURED", status: 503 });
  if (typeof fetchImpl !== "function") throw Object.assign(new Error("This Node runtime does not provide fetch."), { code: "AI_TRANSPORT_UNAVAILABLE", status: 503 });
  let feedback = request.validationFeedback || null;
  let lastError = null;
  const projectionMeta = projectionDiagnostic(request, diagnosticTracker);
  const providerType = resolveProviderType(configuration.providerType, configuration.baseUrl);
  const providerName = PROVIDER_NAMES[providerType];
  for (let attempt = 0; attempt <= configuration.maxRetries; attempt += 1) {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), configuration.timeoutMs);
    try {
      const mapped = mapProviderRequest(request, configuration, feedback);
      if (mapped.estimatedInputTokens > (configuration.inputTokenWarning || 6000)) {
        writeInputTokenWarning(configuration, {
          code: "AI_INPUT_TOKEN_WARNING", provider: mapped.providerType, model: configuration.model,
          actorId: request.actorId, branchId: projectionMeta.branchId, resolvingTurn: projectionMeta.resolvingTurn,
          estimatedInputTokens: mapped.estimatedInputTokens, threshold: configuration.inputTokenWarning || 6000
        });
      }
      const response = await fetchImpl(mapped.endpoint, { method: "POST", headers: mapped.headers, body: JSON.stringify(mapped.body), signal: controller.signal });
      const raw = await response.text();
      if (!response.ok) {
        const providerResponse = safeProviderErrorResponse(raw, configuration, mapped.body.messages);
        if (response.status === 400 || response.status === 422) {
          const error = structuredOutputError(configuration);
          writeDiagnostic(configuration, { provider: mapped.providerType, endpoint: mapped.endpoint, actorId: request.actorId, attempt: request.attempt, transportAttempt: attempt + 1, model: configuration.model, ...projectionMeta, ...reasoningDiagnostic(configuration, null, mapped.providerType), ...usageDiagnostic(null), latencyMs: Date.now() - startedAt, httpStatus: response.status, providerErrorCode: error.code, providerResponse, action: null, validationError: error.message });
          throw error;
        }
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        const error = Object.assign(new Error(`${mapped.providerName} returned HTTP ${response.status}.`), { code: "AI_HTTP_ERROR", status: 502, retryable });
        writeDiagnostic(configuration, { provider: mapped.providerType, endpoint: mapped.endpoint, actorId: request.actorId, attempt: request.attempt, transportAttempt: attempt + 1, model: configuration.model, ...projectionMeta, ...reasoningDiagnostic(configuration, null, mapped.providerType), ...usageDiagnostic(null), latencyMs: Date.now() - startedAt, httpStatus: response.status, providerErrorCode: error.code, providerResponse, action: null, validationError: error.message });
        if (!retryable || attempt >= configuration.maxRetries) throw error;
        lastError = error;
        continue;
      }
      let envelope;
      try { envelope = JSON.parse(raw); } catch { throw Object.assign(new Error(`${providerName} returned invalid JSON.`), { code: "AI_PROVIDER_RESPONSE", status: 502, retryable: true }); }
      const content = envelope?.choices?.[0]?.message?.content;
      try {
        const output = extractJsonObject(content);
        writeDiagnostic(configuration, { provider: mapped.providerType, actorId: request.actorId, attempt: request.attempt, transportAttempt: attempt + 1, model: configuration.model, ...projectionMeta, ...reasoningDiagnostic(configuration, envelope, mapped.providerType), ...usageDiagnostic(envelope), latencyMs: Date.now() - startedAt, httpStatus: response.status, providerErrorCode: null, ...normalizedModelDiagnostic(output) });
        return output;
      }
      catch (error) {
        writeDiagnostic(configuration, { provider: mapped.providerType, actorId: request.actorId, attempt: request.attempt, transportAttempt: attempt + 1, model: configuration.model, ...projectionMeta, ...reasoningDiagnostic(configuration, envelope, mapped.providerType), ...usageDiagnostic(envelope), latencyMs: Date.now() - startedAt, httpStatus: response.status, providerErrorCode: "INVALID_MODEL_RESPONSE", ...normalizedModelDiagnostic(content, error) });
        feedback = `Return one valid JSON object. ${error.message}`;
        lastError = Object.assign(error, { code: "INVALID_MODEL_RESPONSE", status: 502, retryable: true });
        if (attempt >= configuration.maxRetries) throw lastError;
      }
    } catch (error) {
      const normalized = error.name === "AbortError"
        ? Object.assign(new Error(`${providerName} timed out after ${configuration.timeoutMs}ms.`), { code: "AI_TIMEOUT", status: 504, retryable: true })
        : error.code ? error : Object.assign(new Error(`${providerName} request failed: ${error.message}`), { code: "AI_PROVIDER_ERROR", status: 502, retryable: true });
      lastError = normalized;
      if (attempt >= configuration.maxRetries || normalized.retryable === false) throw normalized;
    } finally { clearTimeout(timer); }
  }
  throw lastError || Object.assign(new Error(`${providerName} request failed.`), { code: "AI_PROVIDER_ERROR", status: 502 });
}

function sendJson(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body), "cache-control": "no-store" });
  response.end(body);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_REQUEST_BYTES) { reject(Object.assign(new Error("Request body exceeds 128 KiB."), { code: "REQUEST_TOO_LARGE", status: 413 })); request.destroy(); return; }
      chunks.push(chunk);
    });
    request.on("end", () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "null")); }
      catch { reject(Object.assign(new Error("Request body must be valid JSON."), { code: "INVALID_JSON", status: 400 })); }
    });
    request.on("error", reject);
  });
}

function createAppServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || PROJECT_ROOT);
  const configuration = options.configuration || loadConfiguration(options.environment || process.env, rootDir);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const diagnosticTracker = new Map();
  return http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (url.pathname === "/api/ai/config") {
        if (request.method !== "GET") return sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use GET for provider status." } });
        return sendJson(response, 200, configurationStatus(configuration));
      }
      if (url.pathname === "/api/ai/decision") {
        if (request.method !== "POST") return sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for character decisions." } });
        const payload = validateDecisionRequest(await readJson(request));
        const output = await requestModelDecision(payload, configuration, fetchImpl, diagnosticTracker);
        return sendJson(response, 200, { protocol: payload.protocol, actorId: payload.actorId, output });
      }
      if (request.method !== "GET" && request.method !== "HEAD") return sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Unsupported method." } });
      const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
      const filePath = path.resolve(rootDir, requested);
      if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) return sendJson(response, 403, { error: { code: "FORBIDDEN", message: "Invalid path." } });
      const stat = await fs.promises.stat(filePath).catch(() => null);
      if (!stat || !stat.isFile() || path.basename(filePath) === ".env") return sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Resource not found." } });
      const headers = {
        "content-type": STATIC_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
        "content-security-policy": "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; frame-ancestors 'none'",
        "x-content-type-options": "nosniff",
        "referrer-policy": "no-referrer"
      };
      response.writeHead(200, headers);
      if (request.method === "HEAD") return response.end();
      fs.createReadStream(filePath).pipe(response);
    } catch (error) {
      const status = Number(error.status) || (error.code === "INVALID_REQUEST" || error.code === "PRIVACY_BOUNDARY" ? 400 : 502);
      return sendJson(response, status, { error: { code: error.code || "SERVER_ERROR", message: error.message || "Request failed.", retryable: Boolean(error.retryable) } });
    }
  });
}

if (require.main === module) {
  const configuration = loadConfiguration();
  const server = createAppServer({ configuration });
  server.listen(configuration.port, "127.0.0.1", () => {
    const status = configurationStatus(configuration);
    console.log(`Forked Fates listening on http://127.0.0.1:${configuration.port}`);
    console.log(status.configured ? `AI Live configured for ${status.displayName}.` : `AI Live not configured: ${status.missing.join(", ")}.`);
  });
}

module.exports = Object.freeze({
  MAX_REQUEST_BYTES, SUPPORTED_PROVIDER_TYPES, parseEnvFile, providerTypeFromUrl, resolveProviderType,
  loadConfiguration, configurationStatus, validateDecisionRequest, extractJsonObject, isOpenRouter,
  responseFormatFor, resolveChatCompletionsEndpoint, mapProviderRequest, safeProviderErrorResponse,
  stableSerialize, projectionFingerprint, requestModelDecision, createAppServer
});
