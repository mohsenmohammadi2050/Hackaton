(function initializeAiDecisionLayer(root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory(require("./world-engine"), require("./decision-layer"), require("./provider-intent-contract"), require("./ai-owned-projection"));
  else if (root) root.FORKED_FATES_AI_DECISION_LAYER = factory(root.FORKED_FATES_WORLD_ENGINE, root.FORKED_FATES_DECISION_LAYER, root.FORKED_FATES_PROVIDER_INTENT_CONTRACT, root.FORKED_FATES_AI_OWNED_PROJECTION);
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiDecisionLayer(world, decision, intentContract, ownedProjection) {
  "use strict";

  if (!world || !decision) throw new Error("AI Decision Layer requires the World and validated Decision layers.");
  const OUTPUT_CONTRACT = Object.freeze({
    format: "json-string", cardinality: 1,
    requiredFields: Object.freeze(["id", "actorId", "action", "chosenAtTurn", "servedGoalId", "rationale", "citedMemoryIds"])
  });

  class AiDecisionTurnError extends Error {
    constructor(code, message, audit, cause) {
      super(message);
      this.name = "AiDecisionTurnError";
      this.code = code;
      this.audit = audit;
      this.cause = cause || null;
    }
  }

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value); Object.values(value).forEach(deepFreeze); return value;
  }

  function slug(value) {
    return String(value || "intent").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "intent";
  }

  function stampSystemMetadata(candidate, boundary, actorId) {
    const stamped = deepClone(candidate);
    const semanticTarget = stamped.subject || stamped.targetLocationId || stamped.targetId || stamped.itemId || stamped.audience || "action";
    stamped.id = `ai-t${String(boundary.turn + 1).padStart(2, "0")}-${slug(actorId)}-${slug(stamped.action)}-${slug(semanticTarget)}`;
    stamped.actorId = actorId;
    stamped.chosenAtTurn = boundary.turn;
    return deepFreeze(stamped);
  }

  // Accepted compatibility alias: real models sometimes copy the plural legal-option key
  // `legalOptions.Communicate.audiences` into a Communicate intent. Only a string or a
  // single-element string array is semantically identical to authoritative `audience`.
  function canonicalizeCandidate(candidate, actorId) {
    const normalized = deepClone(candidate);
    const aliases = [];
    if (normalized.action === "Communicate" && Object.prototype.hasOwnProperty.call(normalized, "audiences")) {
      if (Object.prototype.hasOwnProperty.call(normalized, "audience")) {
        throw new decision.AgentOutputError("malformed-output", actorId, "Communicate may not contain both audience and the audiences alias. Use only singular audience.");
      }
      const values = typeof normalized.audiences === "string" ? [normalized.audiences] : normalized.audiences;
      if (!Array.isArray(values) || values.length !== 1 || typeof values[0] !== "string" || values[0].length === 0) {
        throw new decision.AgentOutputError("malformed-output", actorId, "Communicate field audiences is ambiguous. Use singular audience with exactly one value: public or private.");
      }
      normalized.audience = values[0];
      delete normalized.audiences;
      aliases.push("audiences->audience");
    }
    return deepFreeze({ candidate: normalized, aliases });
  }

  function buildRetryFeedback(error, candidate, projection) {
    const action = candidate && Object.prototype.hasOwnProperty.call(intentContract.INTENT_ACTION_FIELDS, candidate.action) ? candidate.action : null;
    if (!action) return `Validation error: ${error.message} Return only one corrected JSON object using a legal action and no prose. Do not repeat invalid extra fields.`;
    const fields = intentContract.allowedIntentFields(action).join(", ");
    const example = JSON.stringify(intentContract.minimalIntentExample(action, projection, candidate));
    return `Validation error: ${error.message} Valid fields for ${action}: ${fields}. Minimal valid ${action} JSON: ${example}. Return only the corrected JSON object. Do not include previous invalid extra fields.`;
  }

  function diagnosticRecord(projection, actorId, attempt, candidate, error, aliases = []) {
    return deepFreeze({
      branchId: projection.branchId,
      resolvingTurn: projection.turn + 1,
      actorId,
      attempt,
      selectedAction: typeof candidate?.action === "string" ? candidate.action : null,
      semanticTarget: candidate?.subject || candidate?.targetLocationId || candidate?.targetId || candidate?.itemId || candidate?.audience || null,
      servedGoalId: candidate?.servedGoalId || null,
      citedMemoryIds: Array.isArray(candidate?.citedMemoryIds) ? candidate.citedMemoryIds.slice() : [],
      previousAction: projection.previousAction ? { turn: projection.previousAction.turn, action: projection.previousAction.action, eventId: projection.previousAction.eventId } : null,
      previousResult: projection.previousResult ? { status: projection.previousResult.status, category: projection.previousResult.category, eventId: projection.previousResult.eventId } : null,
      validationError: error?.message || null,
      normalizedResponse: candidate ? { fields: Object.keys(candidate).sort(), aliases: aliases.slice() } : { fields: [], aliases: [] }
    });
  }

  async function decideForActor(boundary, actorId, provider, maxAttempts, status, diagnostic) {
    const projection = ownedProjection.createAiOwnedProjection(boundary, actorId, decision.createOwnedProjection(boundary, actorId));
    const attempts = [];
    let feedback = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      let candidate = null;
      let aliases = [];
      status?.({ phase: "generating", actorId, attempt });
      try {
        const raw = await provider.decide(deepFreeze({
          protocol: decision.PROVIDER_PROTOCOL,
          actorId,
          projection,
          attempt,
          outputContract: OUTPUT_CONTRACT,
          validationFeedback: feedback
        }));
        status?.({ phase: "validating", actorId, attempt });
        candidate = decision.parseAgentOutput(raw, actorId);
        const canonical = canonicalizeCandidate(candidate, actorId);
        candidate = stampSystemMetadata(canonical.candidate, boundary, actorId);
        aliases = canonical.aliases;
        const intent = decision.validateCandidate(candidate, projection);
        diagnostic?.(diagnosticRecord(projection, actorId, attempt, candidate, null, aliases));
        attempts.push({ attempt, status: "validated", intentId: intent.id, action: intent.action, canonicalizedAliases: aliases.slice() });
        return { actorId, projection, intent, attempts };
      } catch (error) {
        const code = error.code || error.kind || "INVALID_MODEL_RESPONSE";
        diagnostic?.(diagnosticRecord(projection, actorId, attempt, candidate, error, aliases));
        feedback = buildRetryFeedback(error, candidate, projection);
        attempts.push({ attempt, status: code, message: error.message });
        if (code === "AI_STRUCTURED_OUTPUT_UNSUPPORTED" || attempt >= maxAttempts) throw new AiDecisionTurnError(code, `${actorId} did not produce a valid decision after ${attempt} attempt${attempt === 1 ? "" : "s"}: ${error.message}`, { actorId, attempts }, error);
      }
    }
    throw new AiDecisionTurnError("RETRY_EXHAUSTED", `${actorId} exhausted decision retries.`, { actorId, attempts });
  }

  async function decideAndResolveTurn(boundary, provider, options = {}) {
    if (!provider || provider.protocol !== decision.PROVIDER_PROTOCOL || typeof provider.decide !== "function") throw new TypeError("AI Decision Layer requires a compatible asynchronous provider.");
    const maxAttempts = Number.isInteger(options.maxAttempts) ? options.maxAttempts : 3;
    const restored = world.restoreBoundary(boundary, boundary.turn);
    const audit = { turn: restored.turn + 1, startingBoundary: restored.turn, parallel: true, actors: [] };
    options.onStatus?.({ phase: "generating-all", turn: restored.turn + 1, actorCount: restored.npcOrder.length });
    let results;
    try {
      results = await Promise.all(restored.npcOrder.map((actorId) => decideForActor(restored, actorId, provider, maxAttempts, options.onStatus, options.onDiagnostic)));
    } catch (error) {
      audit.error = { code: error.code || "AI_DECISION_FAILED", message: error.message };
      if (error.audit) audit.actors.push(error.audit);
      throw new AiDecisionTurnError(error.code || "AI_DECISION_FAILED", `Turn ${restored.turn + 1} stopped before World resolution. ${error.message}`, deepFreeze(deepClone(audit)), error);
    }
    audit.actors = results.map((result) => ({ actorId: result.actorId, attempts: result.attempts }));
    const intents = results.map((result) => result.intent);
    if (intents.length !== restored.npcOrder.length) throw new AiDecisionTurnError("INCOMPLETE_INTENT_SET", "World resolution requires exactly four validated intents.", audit);
    options.onStatus?.({ phase: "resolving", turn: restored.turn + 1 });
    let state;
    try { state = world.resolveTurn(restored, intents); }
    catch (error) {
      audit.error = { code: "WORLD_RESOLUTION_ERROR", message: error.message };
      throw new AiDecisionTurnError(
        "WORLD_RESOLUTION_ERROR",
        `Turn ${restored.turn + 1} was not committed because authoritative World resolution failed: ${error.message} Completed Turn ${restored.turn} remains safe.`,
        deepFreeze(deepClone(audit)),
        error
      );
    }
    audit.status = "completed";
    audit.acceptedIntentIds = intents.map((intent) => intent.id);
    return deepFreeze({ state, intents: deepClone(intents), audit: deepClone(audit), projections: results.map((result) => result.projection) });
  }

  return Object.freeze({ OUTPUT_CONTRACT, AiDecisionTurnError, canonicalizeCandidate, stampSystemMetadata, buildRetryFeedback, diagnosticRecord, decideAndResolveTurn });
});
