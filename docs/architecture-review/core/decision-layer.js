(function initializeDecisionLayer(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("./world-engine"));
  else if (root) root.FORKED_FATES_DECISION_LAYER = factory(root.FORKED_FATES_WORLD_ENGINE);
})(typeof globalThis !== "undefined" ? globalThis : this, function createDecisionLayer(engine) {
  "use strict";

  if (!engine) throw new Error("The Decision Layer requires the authoritative World Engine.");

  const MAX_RELEVANT_MEMORIES = 6;
  const PROVIDER_PROTOCOL = "forked-fates-decision-provider-v1";
  const OUTPUT_CONTRACT = deepFreeze({
    format: "json-string",
    cardinality: 1,
    requiredFields: ["id", "actorId", "action", "chosenAtTurn", "servedGoalId", "rationale", "citedMemoryIds"]
  });

  class AgentOutputError extends Error {
    constructor(kind, actorId, message) {
      super(message);
      this.name = "AgentOutputError";
      this.kind = kind;
      this.actorId = actorId;
    }
  }

  class DecisionTurnError extends Error {
    constructor(message, audit) {
      super(message);
      this.name = "DecisionTurnError";
      this.audit = audit;
    }
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function memoryScore(memory, npc, context) {
    const salience = { critical: 60, important: 22, ordinary: 8 }[memory.salience] || 0;
    const age = Math.max(0, context.turn - memory.turn);
    const recency = Math.max(0, 24 - age * 3);
    const primaryTerms = npc.goals
      .filter((goal) => goal.priority === "primary")
      .flatMap((goal) => goal.description.toLowerCase().split(/\W+/).filter((term) => term.length >= 5));
    const description = memory.description.toLowerCase();
    const goalRelevance = primaryTerms.some((term) => description.includes(term)) ? 28 : 0;
    const locationRelevance = memory.locationId === npc.locationId ? 10 : 0;
    const participantRelevance = memory.involvedCharacterIds.some((id) => context.coLocatedIds.includes(id)) ? 10 : 0;
    const relationshipRelevance = memory.involvedCharacterIds.reduce((highest, id) => {
      const trust = npc.trust[id];
      return trust === undefined ? highest : Math.max(highest, Math.trunc(Math.abs(trust) / 5));
    }, 0);
    const beliefSupport = Object.values(npc.beliefs).some((belief) => (belief.supportingMemoryIds || []).includes(memory.id)) ? 50 : 0;
    const deadlineRelevance = /deadline|nightfall|turn twelve|niko|antidote/i.test(memory.description) ? 12 : 0;
    return salience + recency + goalRelevance + locationRelevance + participantRelevance + relationshipRelevance + beliefSupport + deadlineRelevance;
  }

  function selectRelevantMemories(npc, context, limit = MAX_RELEVANT_MEMORIES) {
    const available = npc.memories.filter((memory) => memory.ownerId === npc.id && memory.turn <= context.turn);
    return available
      .map((memory) => ({ memory, score: memoryScore(memory, npc, context) }))
      .sort((left, right) => right.score - left.score || right.memory.turn - left.memory.turn || left.memory.id.localeCompare(right.memory.id))
      .slice(0, Math.min(limit, MAX_RELEVANT_MEMORIES))
      .map(({ memory }) => deepClone(memory));
  }

  function publicCharacter(npc) {
    return { id: npc.id, name: npc.name, role: npc.role };
  }

  function legalOptions(state, actorId, knownCharacterIds) {
    const actor = state.npcs[actorId];
    const otherLocationIds = Object.keys(state.locations).filter((locationId) => locationId !== actor.locationId);
    const investigateSubject = { clinic: "empty-case", square: "square", storehouse: "storehouse" }[actor.locationId];
    const otherNpcIds = knownCharacterIds.filter((id) => id !== actorId);
    const coLocatedIds = otherNpcIds.filter((id) => state.npcs[id].locationId === actor.locationId);
    const hasAntidote = actor.inventory.includes("antidote");

    return {
      Move: { targetLocationIds: otherLocationIds },
      Investigate: { subjects: investigateSubject ? [investigateSubject] : [] },
      Communicate: { audiences: ["public", "private"], knownTargetIds: otherNpcIds, coLocatedTargetIds: coLocatedIds },
      Transfer: { itemIds: hasAntidote ? ["antidote"] : [], knownTargetIds: otherNpcIds, coLocatedTargetIds: coLocatedIds },
      Administer: { available: hasAntidote && actor.locationId === "clinic" && state.patient.status === "Untreated" },
      Accuse: { knownTargetIds: otherNpcIds, coLocatedTargetIds: coLocatedIds },
      Wait: { available: true }
    };
  }

  function createOwnedProjection(state, actorId) {
    const actor = state.npcs[actorId];
    if (!actor) throw new Error(`Unknown projection owner ${actorId}.`);
    const coLocatedIds = state.npcOrder.filter((id) => id !== actorId && state.npcs[id].locationId === actor.locationId);
    const knownCharacters = state.npcOrder.map((id) => publicCharacter(state.npcs[id]));
    const relevantMemories = selectRelevantMemories(actor, { turn: state.turn, coLocatedIds });

    return deepFreeze({
      projectionVersion: "1.0",
      scenarioId: state.scenarioId,
      branchId: state.branchId,
      turn: state.turn,
      turnsRemaining: state.turnsRemaining,
      patient: { id: state.patient.id, status: state.patient.status, treatmentLocationId: state.patient.locationId },
      currentLocation: { id: actor.locationId, name: state.locations[actor.locationId].name },
      locations: Object.values(state.locations).map((location) => ({ id: location.id, name: location.name, canTreatPatient: location.canTreatPatient })),
      knownCharacters,
      coLocatedCharacters: coLocatedIds.map((id) => publicCharacter(state.npcs[id])),
      self: {
        id: actor.id,
        name: actor.name,
        role: actor.role,
        traits: deepClone(actor.traits),
        posture: actor.posture,
        goals: deepClone(actor.goals),
        trust: deepClone(actor.trust),
        beliefs: deepClone(actor.beliefs),
        inventory: deepClone(actor.inventory)
      },
      relevantMemories,
      legalOptions: legalOptions(state, actorId, knownCharacters.map((character) => character.id)),
      resolutionPriority: (state.actingPriorityByTurn[String(state.turn + 1)] || state.actingPriorityByTurn[state.turn + 1] || state.npcOrder).slice()
    });
  }

  function parseAgentOutput(raw, actorId) {
    if (typeof raw !== "string") throw new AgentOutputError("malformed-output", actorId, "Agent output must be a JSON string.");
    let candidate;
    try {
      candidate = JSON.parse(raw);
    } catch (error) {
      throw new AgentOutputError("malformed-output", actorId, `Agent output is not valid JSON: ${error.message}`);
    }
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new AgentOutputError("malformed-output", actorId, "Agent output must decode to one intent object.");
    }
    return candidate;
  }

  function requireString(candidate, field, actorId) {
    if (typeof candidate[field] !== "string" || candidate[field].trim().length === 0) {
      throw new AgentOutputError("malformed-output", actorId, `Intent field ${field} must be a non-empty string.`);
    }
  }

  function reject(actorId, message) {
    throw new AgentOutputError("rejected-output", actorId, message);
  }

  function validateStringArray(candidate, field, actorId) {
    if (candidate[field] === undefined) return [];
    if (!Array.isArray(candidate[field]) || candidate[field].some((value) => typeof value !== "string" || value.length === 0)) {
      throw new AgentOutputError("malformed-output", actorId, `${field} must be an array of non-empty identity strings.`);
    }
    return candidate[field];
  }

  function validateCandidate(candidate, projection) {
    const actorId = projection.self.id;
    for (const field of ["id", "actorId", "action", "servedGoalId", "rationale"]) requireString(candidate, field, actorId);
    if (!Array.isArray(candidate.citedMemoryIds)) throw new AgentOutputError("malformed-output", actorId, "citedMemoryIds must be an array.");
    if (!Number.isInteger(candidate.chosenAtTurn)) throw new AgentOutputError("malformed-output", actorId, "chosenAtTurn must be an integer.");

    if (candidate.actorId !== actorId) reject(actorId, "An agent may submit an intent only for itself.");
    if (candidate.chosenAtTurn !== projection.turn) reject(actorId, "The intent was not selected from the current completed boundary.");
    if (!engine.ACTIONS.includes(candidate.action)) reject(actorId, `Unknown action family ${candidate.action}.`);
    if (!projection.self.goals.some((goal) => goal.id === candidate.servedGoalId)) reject(actorId, "The intent cites a goal the NPC does not own.");
    if (candidate.rationale.length > 280) reject(actorId, "The declared rationale exceeds the concise rationale limit.");
    if (candidate.citedMemoryIds.length > MAX_RELEVANT_MEMORIES) reject(actorId, "The intent cites more than six memories.");

    const baseFields = ["id", "actorId", "action", "chosenAtTurn", "servedGoalId", "rationale", "citedMemoryIds"];
    const actionFields = {
      Move: ["targetLocationId"],
      Investigate: ["subject"],
      Communicate: ["audience", "targetId", "claimIds", "factIds", "confessionFactIds"],
      Transfer: ["targetId", "itemId"],
      Administer: [],
      Accuse: ["targetId", "responsibilityTargetId", "claimIds"],
      Wait: []
    }[candidate.action] || [];
    const allowedFields = new Set(baseFields.concat(actionFields));
    const unknownField = Object.keys(candidate).find((field) => !allowedFields.has(field));
    if (unknownField) throw new AgentOutputError("malformed-output", actorId, `Intent field ${unknownField} is not valid for ${candidate.action}.`);

    const claimIds = validateStringArray(candidate, "claimIds", actorId);
    const factIds = validateStringArray(candidate, "factIds", actorId);
    const confessionFactIds = validateStringArray(candidate, "confessionFactIds", actorId);
    if (claimIds.length > 3 || factIds.length > 3 || confessionFactIds.length > 3) reject(actorId, "An intent references too many propositions.");

    const relevantMemoryIds = new Set(projection.relevantMemories.map((memory) => memory.id));
    for (const memoryId of candidate.citedMemoryIds) {
      if (typeof memoryId !== "string") throw new AgentOutputError("malformed-output", actorId, "Every cited memory identity must be a string.");
      if (!relevantMemoryIds.has(memoryId)) reject(actorId, `The intent cites memory ${memoryId} outside the supplied relevant set.`);
    }
    if (new Set(candidate.citedMemoryIds).size !== candidate.citedMemoryIds.length) reject(actorId, "The intent cites the same memory more than once.");

    for (const factId of factIds.concat(confessionFactIds)) {
      const ownedBelief = projection.self.beliefs[factId];
      const recalledSupport = projection.relevantMemories.some((memory) => memory.factIds.includes(factId));
      if (!ownedBelief || ownedBelief.stance !== "believes-true" || !recalledSupport) {
        reject(actorId, `The intent presents fact ${factId} without an owned belief and recalled supporting memory.`);
      }
    }

    const options = projection.legalOptions[candidate.action];
    if (candidate.action === "Move" && !options.targetLocationIds.includes(candidate.targetLocationId)) reject(actorId, "Move target is not a legal destination.");
    if (candidate.action === "Investigate" && !options.subjects.includes(candidate.subject)) reject(actorId, "Investigation subject is unavailable at the owned location.");
    if (candidate.action === "Communicate") {
      if (!options.audiences.includes(candidate.audience)) reject(actorId, "Communication audience is invalid.");
      if (candidate.audience === "private" && !options.knownTargetIds.includes(candidate.targetId)) reject(actorId, "Private communication target is unknown.");
      if (candidate.audience === "public" && candidate.targetId !== undefined) reject(actorId, "Public communication may not name a private recipient.");
      if (claimIds.length + factIds.length + confessionFactIds.length === 0) reject(actorId, "Communication must contain a claim, known fact, or confession.");
    }
    if (candidate.action === "Transfer") {
      if (!options.itemIds.includes(candidate.itemId)) reject(actorId, "The NPC does not own a transferable antidote.");
      if (!options.knownTargetIds.includes(candidate.targetId)) reject(actorId, "Transfer target is unknown.");
    }
    if (candidate.action === "Administer" && !options.available) reject(actorId, "Administration is unavailable from the owned state.");
    if (candidate.action === "Accuse") {
      if (!options.knownTargetIds.includes(candidate.targetId)) reject(actorId, "Accusation target is unknown.");
      if (candidate.responsibilityTargetId !== candidate.targetId) reject(actorId, "Accusation responsibility target must match the accused NPC.");
      if (claimIds.length === 0) reject(actorId, "Accusation requires a claim identity.");
    }
    if (candidate.action === "Wait" && !options.available) reject(actorId, "Wait is unavailable.");
    return deepFreeze(deepClone(candidate));
  }

  function decideAndResolveTurn(boundary, provider, options = {}) {
    const maxAttempts = options.maxAttempts || 3;
    const audit = { turn: boundary.turn + 1, startingBoundary: boundary.turn, attempts: [] };

    if (!provider || provider.protocol !== PROVIDER_PROTOCOL || typeof provider.decide !== "function") {
      throw new TypeError(`The Decision Layer requires a ${PROVIDER_PROTOCOL} provider.`);
    }

    for (let attemptNumber = 1; attemptNumber <= maxAttempts; attemptNumber += 1) {
      const restored = engine.restoreBoundary(boundary, boundary.turn);
      const attempt = { attempt: attemptNumber, boundaryTurn: restored.turn, outputs: [], status: "deciding" };
      audit.attempts.push(attempt);
      const intents = [];

      try {
        for (const actorId of restored.npcOrder) {
          const projection = createOwnedProjection(restored, actorId);
          let raw;
          try {
            raw = provider.decide(deepFreeze({
              protocol: PROVIDER_PROTOCOL,
              actorId,
              projection,
              attempt: attemptNumber,
              outputContract: OUTPUT_CONTRACT
            }));
          } catch (error) {
            throw new AgentOutputError("malformed-output", actorId, `Agent execution failed: ${error.message}`);
          }
          const candidate = parseAgentOutput(raw, actorId);
          const validated = validateCandidate(candidate, projection);
          intents.push(validated);
          attempt.outputs.push({ actorId, status: "validated", intentId: validated.id, action: validated.action });
        }
      } catch (error) {
        if (!(error instanceof AgentOutputError)) throw error;
        attempt.status = error.kind;
        attempt.error = { actorId: error.actorId, message: error.message };
        continue;
      }

      try {
        const nextState = engine.resolveTurn(restored, intents);
        const failedEvents = nextState.events
          .filter((event) => event.turn === nextState.turn && event.category === "Failed action")
          .map((event) => ({ actorId: event.actorId, eventId: event.id, status: "resolution-invalid" }));
        attempt.status = "completed";
        attempt.resolutionInvalid = failedEvents;
        attempt.acceptedIntentIds = intents.map((intent) => intent.id);
        return deepFreeze({ state: nextState, audit: deepClone(audit), intents: deepClone(intents) });
      } catch (error) {
        attempt.status = "rejected-output";
        attempt.error = { actorId: null, message: error.message };
      }
    }

    throw new DecisionTurnError(`Turn ${boundary.turn + 1} did not produce four valid agent intents after ${maxAttempts} attempts.`, deepFreeze(deepClone(audit)));
  }

  function runAutonomousOriginal(scenario, provider, options = {}) {
    let state = engine.createInitialWorld(scenario);
    const turns = [];
    while (state.status !== "completed") {
      const result = decideAndResolveTurn(state, provider, options);
      state = result.state;
      turns.push({ turn: state.turn, intents: result.intents, audit: result.audit });
    }
    return deepFreeze({ state, turns });
  }

  return Object.freeze({
    MAX_RELEVANT_MEMORIES,
    PROVIDER_PROTOCOL,
    AgentOutputError,
    DecisionTurnError,
    selectRelevantMemories,
    createOwnedProjection,
    parseAgentOutput,
    validateCandidate,
    decideAndResolveTurn,
    runAutonomousOriginal
  });
});
