"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const scenario = require("../world-scenario");
const world = require("../world-engine");
const decision = require("../decision-layer");
const providers = require("../decision-providers");
const aiProjection = require("../ai-owned-projection");
const aiDecision = require("../ai-decision-layer");
const server = require("../server");
const browserProvider = require("../ai-live-provider");

const root = path.resolve(__dirname, "..");

function projection(actorId = "mara") {
  const state = world.createInitialWorld(scenario);
  return aiProjection.createAiOwnedProjection(state, actorId, decision.createOwnedProjection(state, actorId));
}

function request(actorId = "mara") {
  return {
    protocol: decision.PROVIDER_PROTOCOL,
    actorId,
    projection: projection(actorId),
    attempt: 1,
    outputContract: aiDecision.OUTPUT_CONTRACT,
    validationFeedback: null
  };
}

function config(overrides = {}) {
  return Object.assign({
    providerType: "cerebras",
    baseUrl: "https://api.cerebras.ai/v1",
    apiKey: "CEREBRAS_TEST_KEY",
    model: "gpt-oss-120b",
    timeoutMs: 100,
    maxRetries: 0,
    structuredOutputMode: "json_schema",
    reasoningEnabled: true,
    reasoningConfigurationValid: true,
    reasoningEffort: "medium",
    maxOutputTokens: 800,
    maxOutputTokensConfigurationValid: true,
    inputTokenWarning: 6000,
    inputTokenWarningConfigurationValid: true,
    diagnosticLogging: false
  }, overrides);
}

function candidate(providerRequest, plan = { action: "Wait" }) {
  return Object.assign({
    id: `intent-${providerRequest.actorId}-cerebras`,
    actorId: providerRequest.actorId,
    action: plan.action,
    chosenAtTurn: providerRequest.projection.turn,
    servedGoalId: providerRequest.projection.self.goals[0].id,
    rationale: "Choose a legal intent from owned state.",
    citedMemoryIds: []
  }, plan.action === "Move" ? { targetLocationId: plan.targetLocationId } : {});
}

function response(output, usage = {}) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify(output) } }], usage })
  };
}

function assertStrictObjects(value) {
  if (!value || typeof value !== "object") return;
  if (value.type === "object") {
    assert.equal(value.additionalProperties, false);
    for (const required of value.required || []) assert.ok(Object.prototype.hasOwnProperty.call(value.properties || {}, required), `required ${required} has a schema property`);
    assert.deepEqual(new Set(value.required || []), new Set(Object.keys(value.properties || {})));
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) assertStrictObjects(child);
}

test("explicit Cerebras configuration is accepted and unknown provider types fail at startup", () => {
  const loaded = server.loadConfiguration({
    AI_PROVIDER_TYPE: "cerebras", AI_PROVIDER_BASE_URL: "https://api.cerebras.ai/v1", AI_PROVIDER_API_KEY: "test",
    AI_MODEL: "gpt-oss-120b", AI_STRUCTURED_OUTPUT_MODE: "json_schema", AI_REASONING_ENABLED: "true",
    AI_REASONING_EFFORT: "medium", AI_MAX_OUTPUT_TOKENS: "800", AI_INPUT_TOKEN_WARNING: "6000"
  }, root);
  const status = server.configurationStatus(loaded);
  assert.equal(status.configured, true);
  assert.equal(status.providerType, "cerebras");
  assert.equal(status.displayName, "Cerebras · gpt-oss-120b");
  assert.throws(
    () => server.loadConfiguration({ AI_PROVIDER_TYPE: "groq", AI_PROVIDER_BASE_URL: "https://api.groq.com/openai/v1" }, root),
    (error) => error.code === "AI_PROVIDER_TYPE_UNSUPPORTED" && /openrouter, cerebras, generic-openai/.test(error.message)
  );
});

test("Cerebras mapper sends the exact endpoint, version header, bearer auth, output limit, schema, and hidden reasoning", async () => {
  let capture;
  const providerRequest = request("mara");
  await server.requestModelDecision(providerRequest, config(), async (url, options) => {
    capture = { url, options, body: JSON.parse(options.body) };
    return response(candidate(providerRequest));
  });
  assert.equal(capture.url, "https://api.cerebras.ai/v1/chat/completions");
  assert.equal(capture.options.headers.authorization, "Bearer CEREBRAS_TEST_KEY");
  assert.equal(capture.options.headers["X-Cerebras-Version-Patch"], "2");
  assert.equal(capture.body.model, "gpt-oss-120b");
  assert.equal(capture.body.max_completion_tokens, 800);
  assert.equal(capture.body.response_format.type, "json_schema");
  assert.equal(capture.body.response_format.json_schema.strict, true);
  assert.equal(capture.body.reasoning_effort, "medium");
  assert.equal(capture.body.reasoning_format, "hidden");
  assert.equal("provider" in capture.body, false);
  assert.equal("reasoning" in capture.body, false);
  assertStrictObjects(capture.body.response_format.json_schema.schema);
});

test("Cerebras reasoning is omitted when disabled and effort is restricted to low, medium, or high", () => {
  const providerRequest = request("dain");
  const mapped = server.mapProviderRequest(providerRequest, config({ reasoningEnabled: false }), null);
  assert.equal("reasoning_effort" in mapped.body, false);
  assert.equal("reasoning_format" in mapped.body, false);
  const invalid = server.configurationStatus(config({ reasoningEffort: "xhigh" }));
  assert.equal(invalid.configured, false);
  assert.ok(invalid.missing.some((entry) => /for Cerebras/.test(entry)));
});

test("explicit provider selection overrides URL fallback while URL detection remains a fallback", () => {
  assert.equal(server.resolveProviderType("cerebras", "https://openrouter.ai/api/v1"), "cerebras");
  assert.equal(server.resolveProviderType("", "https://openrouter.ai/api/v1"), "openrouter");
  assert.equal(server.resolveProviderType(undefined, "https://api.cerebras.ai/v1"), "cerebras");
  assert.equal(server.resolveProviderType(undefined, "https://provider.example/v1"), "generic-openai");
});

test("OpenRouter-specific mapping remains unchanged apart from the common output-token budget", () => {
  const providerRequest = request("dain");
  const mapped = server.mapProviderRequest(providerRequest, config({
    providerType: "openrouter", baseUrl: "https://openrouter.ai/api/v1", model: "provider/reasoning-model"
  }), null);
  assert.equal(mapped.endpoint, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(mapped.body.temperature, 0.2);
  assert.deepEqual(mapped.body.reasoning, { effort: "medium", exclude: true });
  assert.deepEqual(mapped.body.provider, { require_parameters: true });
  assert.equal(mapped.body.response_format.type, "json_schema");
  assert.equal(mapped.body.max_completion_tokens, 800);
  assert.equal("reasoning_effort" in mapped.body, false);
  assert.equal("X-Cerebras-Version-Patch" in mapped.headers, false);
});

test("generic OpenAI-compatible mapping stays conservative and refuses guessed reasoning support", () => {
  const providerRequest = request("sera");
  const generic = config({ providerType: "generic-openai", baseUrl: "https://provider.example/v1", apiKey: "", reasoningEnabled: false });
  const mapped = server.mapProviderRequest(providerRequest, generic, null);
  assert.deepEqual(Object.keys(mapped.body).sort(), ["max_completion_tokens", "messages", "model", "response_format"]);
  assert.equal("provider" in mapped.body, false);
  assert.equal("reasoning" in mapped.body, false);
  assert.equal("reasoning_effort" in mapped.body, false);
  assert.equal(server.configurationStatus(config({ providerType: "generic-openai", baseUrl: "https://provider.example/v1" })).configured, false);
});

test("a successful Cerebras response maps into the unchanged authoritative Intent contract", async () => {
  const providerRequest = request("orin");
  const output = await server.requestModelDecision(providerRequest, config(), async () => response(candidate(providerRequest, { action: "Move", targetLocationId: "storehouse" })));
  const parsed = decision.parseAgentOutput(output, "orin");
  const validated = decision.validateCandidate(parsed, providerRequest.projection);
  assert.equal(validated.action, "Move");
  assert.equal(validated.targetLocationId, "storehouse");
});

test("schema-shaped but semantically illegal Cerebras output is rejected before World resolution", async () => {
  const initial = world.createInitialWorld(scenario);
  const deterministic = providers.createProvider({ type: "deterministic" });
  const transportConfig = config();
  const provider = Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    async decide(providerRequest) {
      if (providerRequest.actorId !== "mara") return deterministic.decide(providerRequest);
      return server.requestModelDecision(providerRequest, transportConfig, async () => response(candidate(providerRequest, { action: "Move", targetLocationId: "moon" })));
    }
  });
  await assert.rejects(aiDecision.decideAndResolveTurn(initial, provider, { maxAttempts: 1 }), (error) => error.code === "rejected-output" && /stopped before World resolution/.test(error.message));
  assert.equal(initial.turn, 0);
  assert.equal(initial.events.length, 1);
});

test("Cerebras usage and threshold diagnostics are safe, branch-aware, and contain no private payload", async () => {
  const providerRequest = request("mara");
  const logs = [];
  const warnings = [];
  const diagnosticConfig = config({
    diagnosticLogging: true,
    inputTokenWarning: 1,
    logger: {
      info(_label, value) { logs.push(value); },
      warn(_label, value) { warnings.push(value); }
    }
  });
  await server.requestModelDecision(providerRequest, diagnosticConfig, async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      choices: [{ message: { content: JSON.stringify(candidate(providerRequest)), reasoning: "PRIVATE_REASONING_TRACE" } }],
      usage: { prompt_tokens: 3450, completion_tokens: 120, total_tokens: 3570, completion_tokens_details: { reasoning_tokens: 70 } }
    })
  }));
  assert.deepEqual(logs[0].tokenUsage, { promptTokens: 3450, completionTokens: 120, totalTokens: 3570, reasoningTokens: 70 });
  assert.equal(logs[0].provider, "cerebras");
  assert.equal(logs[0].actorId, "mara");
  assert.equal(logs[0].branchId, "world-original-v1");
  assert.equal(logs[0].resolvingTurn, 1);
  assert.equal(warnings[0].code, "AI_INPUT_TOKEN_WARNING");
  const serialized = JSON.stringify({ logs, warnings });
  for (const forbidden of ["CEREBRAS_TEST_KEY", "Authorization", "Bearer", "ownedState", "PRIVATE_REASONING_TRACE", "You decide for exactly one"]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden));
  }
});

test("Cerebras HTTP and capability errors name the configured provider without leaking response bodies", async () => {
  const providerRequest = request("mara");
  await assert.rejects(
    server.requestModelDecision(providerRequest, config(), async () => ({ ok: false, status: 401, text: async () => "SECRET_PROVIDER_BODY" })),
    (error) => error.code === "AI_HTTP_ERROR" && /Cerebras returned HTTP 401/.test(error.message) && !/SECRET_PROVIDER_BODY/.test(error.message)
  );
  await assert.rejects(
    server.requestModelDecision(providerRequest, config(), async () => ({ ok: false, status: 422, text: async () => "schema rejected" })),
    (error) => error.code === "AI_REASONING_UNSUPPORTED" && /Cerebras/.test(error.message) && error.retryable === false
  );
});

test("four independent mocked Cerebras requests resolve one complete authoritative turn", async () => {
  const calls = [];
  const deterministic = providers.createProvider({ type: "deterministic" });
  const transportConfig = config();
  const provider = Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    async decide(providerRequest) {
      calls.push({ actorId: providerRequest.actorId, branchId: providerRequest.projection.branchId, turn: providerRequest.projection.turn });
      const deterministicOutput = deterministic.decide(providerRequest);
      return server.requestModelDecision(providerRequest, transportConfig, async (_url, options) => {
        assert.equal(options.headers["X-Cerebras-Version-Patch"], "2");
        return response(JSON.parse(deterministicOutput), { prompt_tokens: 3000, completion_tokens: 100, total_tokens: 3100 });
      });
    }
  });
  const resolved = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), provider);
  assert.equal(calls.length, 4);
  assert.deepEqual(calls.map((entry) => entry.actorId).sort(), scenario.npcOrder.slice().sort());
  assert.ok(calls.every((entry) => entry.branchId === "world-original-v1" && entry.turn === 0));
  assert.equal(resolved.state.turn, 1);
  assert.equal(resolved.intents.length, 4);
});

test("browser configuration preserves safe provider identity for the AI Live UI", async () => {
  const configuration = await browserProvider.getConfiguration({
    fetch: async () => ({ ok: true, json: async () => ({
      configured: true, providerType: "cerebras", providerName: "Cerebras", model: "gpt-oss-120b",
      displayName: "Cerebras · gpt-oss-120b", reasoningRequested: true, reasoningEffort: "medium",
      maxOutputTokens: 800, inputTokenWarning: 6000, diagnosticLogging: true, missing: []
    }) })
  });
  assert.equal(configuration.displayName, "Cerebras · gpt-oss-120b");
  assert.equal(configuration.providerType, "cerebras");
  assert.equal(configuration.maxOutputTokens, 800);
  assert.match(fs.readFileSync(path.join(root, "live-presentation.js"), "utf8"), /configuration\.displayName[\s\S]*ui\.providerLabel/);
});

test("environment example and README define Cerebras as primary without a real key or Groq patch", () => {
  const example = fs.readFileSync(path.join(root, ".env.example"), "utf8");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  for (const line of [
    "AI_PROVIDER_TYPE=cerebras", "AI_PROVIDER_BASE_URL=https://api.cerebras.ai/v1", "AI_MODEL=gpt-oss-120b",
    "AI_MAX_OUTPUT_TOKENS=800", "AI_INPUT_TOKEN_WARNING=6000"
  ]) assert.match(example, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(example, /AI_PROVIDER_API_KEY=\s*(?:\r?\n)/);
  assert.doesNotMatch(example + readme, /AI_PROVIDER_TYPE=groq|api\.groq\.com|openai\/gpt-oss-20b/);
  assert.match(readme, /64K tokens per minute[\s\S]*30 requests per minute[\s\S]*console are authoritative/);
});
