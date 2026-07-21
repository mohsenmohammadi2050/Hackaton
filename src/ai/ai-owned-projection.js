(function initializeAiOwnedProjection(root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else if (root) root.FORKED_FATES_AI_OWNED_PROJECTION = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiOwnedProjectionApi() {
  "use strict";

  const KNOWLEDGE_CONTRACT_VERSION = "1.0.0";

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; }

  function safeObservedEvent(event) {
    return {
      eventId: event.id, turn: event.turn, category: event.category, action: event.action,
      actorId: event.actorId, targetIds: (event.targetIds || []).slice(), locationId: event.locationId,
      description: event.description
    };
  }

  function previousContinuity(state, actorId) {
    const event = state.events.filter((candidate) => candidate.actorId === actorId && candidate.action && candidate.turn <= state.turn).at(-1);
    if (!event) return { previousAction: null, previousResult: null };
    return {
      previousAction: {
        eventId: event.id, turn: event.turn, action: event.action, targetIds: (event.targetIds || []).slice(),
        servedGoalId: event.goalId, rationale: event.rationale, citedMemoryIds: (event.citedMemoryIds || []).slice(),
        factIds: (event.factIds || []).slice(), claimIds: (event.claimIds || []).slice()
      },
      previousResult: {
        eventId: event.id, turn: event.turn, status: event.category === "Failed action" ? "failed" : "resolved",
        category: event.category, description: event.description, locationId: event.locationId,
        targetIds: (event.targetIds || []).slice(), resultingLocationId: state.npcs[actorId].locationId,
        resultingInventory: state.npcs[actorId].inventory.slice(),
        createdOwnedMemoryIds: state.npcs[actorId].memories.filter((memory) => memory.originEventId === event.id).map((memory) => memory.id)
      }
    };
  }

  function createAiOwnedProjection(state, actorId, baseProjection) {
    if (!state?.npcs?.[actorId] || baseProjection?.self?.id !== actorId) throw new Error(`AI projection requires authoritative owned state for ${actorId}.`);
    const projection = deepClone(baseProjection);
    const continuity = previousContinuity(state, actorId);
    const observations = state.events
      .filter((event) => (event.witnessIds || []).includes(actorId))
      .slice(-8)
      .map(safeObservedEvent);
    Object.assign(projection, {
      projectionVersion: "1.1",
      knowledgeContractVersion: KNOWLEDGE_CONTRACT_VERSION,
      scenarioKnowledge: {
        premise: "Niko is untreated and the village's only antidote is missing.",
        urgency: `A medical outcome is required by the end of turn ${state.deadline}.`,
        knownRules: [
          "Choose exactly one listed legal action from owned information.",
          "The antidote can treat Niko only at the Clinic.",
          "The authoritative World resolves all four intents together and determines consequences."
        ],
        legalActionVocabulary: ["Move", "Investigate", "Communicate", "Transfer", "Administer", "Accuse", "Wait"]
      },
      observations,
      previousAction: continuity.previousAction,
      previousResult: continuity.previousResult
    });
    return deepFreeze(projection);
  }

  return Object.freeze({ KNOWLEDGE_CONTRACT_VERSION, createAiOwnedProjection, previousContinuity });
});
