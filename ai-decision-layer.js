(function initializeAiDecisionLayer(root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory(require("./world-engine"), require("./decision-layer"));
  else if (root) root.FORKED_FATES_AI_DECISION_LAYER = factory(root.FORKED_FATES_WORLD_ENGINE, root.FORKED_FATES_DECISION_LAYER);
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiDecisionLayer(world, decision) {
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

  async function decideForActor(boundary, actorId, provider, maxAttempts, status) {
    const projection = decision.createOwnedProjection(boundary, actorId);
    const attempts = [];
    let feedback = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
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
        const candidate = decision.parseAgentOutput(raw, actorId);
        const intent = decision.validateCandidate(candidate, projection);
        attempts.push({ attempt, status: "validated", intentId: intent.id, action: intent.action });
        return { actorId, projection, intent, attempts };
      } catch (error) {
        const code = error.code || error.kind || "INVALID_MODEL_RESPONSE";
        feedback = error.message;
        attempts.push({ attempt, status: code, message: error.message });
        if (attempt >= maxAttempts) throw new AiDecisionTurnError(code, `${actorId} did not produce a valid decision after ${maxAttempts} attempts: ${error.message}`, { actorId, attempts }, error);
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
      results = await Promise.all(restored.npcOrder.map((actorId) => decideForActor(restored, actorId, provider, maxAttempts, options.onStatus)));
    } catch (error) {
      audit.error = { code: error.code || "AI_DECISION_FAILED", message: error.message };
      if (error.audit) audit.actors.push(error.audit);
      throw new AiDecisionTurnError(error.code || "AI_DECISION_FAILED", `Turn ${restored.turn + 1} stopped before World resolution. ${error.message}`, deepFreeze(deepClone(audit)), error);
    }
    audit.actors = results.map((result) => ({ actorId: result.actorId, attempts: result.attempts }));
    const intents = results.map((result) => result.intent);
    if (intents.length !== restored.npcOrder.length) throw new AiDecisionTurnError("INCOMPLETE_INTENT_SET", "World resolution requires exactly four validated intents.", audit);
    options.onStatus?.({ phase: "resolving", turn: restored.turn + 1 });
    const state = world.resolveTurn(restored, intents);
    audit.status = "completed";
    audit.acceptedIntentIds = intents.map((intent) => intent.id);
    return deepFreeze({ state, intents: deepClone(intents), audit: deepClone(audit), projections: results.map((result) => result.projection) });
  }

  return Object.freeze({ OUTPUT_CONTRACT, AiDecisionTurnError, decideAndResolveTurn });
});
