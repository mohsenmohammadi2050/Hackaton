(function initializeTimelineIntegrity(root, factory) {
  "use strict";

  const integrity = factory();
  if (typeof module === "object" && module.exports) module.exports = integrity;
  else if (root) root.FORKED_FATES_TIMELINE_INTEGRITY = integrity;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTimelineIntegrityApi() {
  "use strict";

  const INTEGRITY_SCHEMA_VERSION = "1.0.0";
  const BOUNDARY_CLASSIFICATIONS = Object.freeze(["initial", "turn-close", "post-intervention"]);

  class TimelineIntegrityError extends Error {
    constructor(message) {
      super(message);
      this.name = "TimelineIntegrityError";
    }
  }

  function invariant(condition, message) {
    if (!condition) throw new TimelineIntegrityError(message);
  }

  function recordsById(records, label) {
    const result = new Map();
    for (const record of records) {
      invariant(record && typeof record.id === "string" && record.id.length > 0, `${label} contains a record without an identity.`);
      invariant(!result.has(record.id), `${label} contains duplicate identity ${record.id}.`);
      result.set(record.id, record);
    }
    return result;
  }

  function memoriesOf(state) {
    return Object.values(state.npcs).flatMap((npc) => npc.memories);
  }

  function intentsOf(turns) {
    return (turns || []).flatMap((turn) => turn.intents || []);
  }

  function assertLocalIdentity(state, id, type) {
    if (!state.identityNamespace) return;
    const namespace = state.identityNamespace;
    const valid = type === "event"
      ? id.startsWith(`evt-world-${namespace}--`)
      : type === "memory"
        ? id.startsWith(`mem-world-${namespace}--`) || id.startsWith(`mem-start-${namespace}--`)
        : type === "boundary"
          ? id.startsWith(`boundary-${namespace}-`)
          : type === "intent"
            ? id.startsWith(`${namespace}--`)
            : type === "outcome"
              ? id.startsWith(`outcome-${namespace}--`)
              : false;
    invariant(valid, `${type} identity ${id} is not local to branch ${state.branchId}.`);
  }

  function validateWorldProjection(world, eventIds, label) {
    for (const [npcId, npc] of Object.entries(world.npcs)) {
      const ownedMemoryIds = new Set(npc.memories.map((memory) => memory.id));
      for (const memory of npc.memories) {
        invariant(memory.ownerId === npcId, `${label} memory ${memory.id} is owned by ${memory.ownerId}, not ${npcId}.`);
        invariant(eventIds.has(memory.originEventId), `${label} memory ${memory.id} has unresolved origin event ${memory.originEventId}.`);
      }
      for (const belief of Object.values(npc.beliefs)) {
        for (const memoryId of belief.supportingMemoryIds || []) {
          invariant(ownedMemoryIds.has(memoryId), `${label} belief ${belief.propositionId} for ${npcId} has foreign or missing support ${memoryId}.`);
        }
      }
    }
    for (const claim of world.publicRecord.claims) {
      invariant(eventIds.has(claim.eventId), `${label} public-record claim ${claim.id} has unresolved event ${claim.eventId}.`);
    }
  }

  function validateState(state, options = {}) {
    invariant(state && typeof state === "object", "Timeline state is required.");
    invariant(Array.isArray(state.events) && Array.isArray(state.boundaries), "Timeline state requires events and boundaries.");
    const events = recordsById(state.events, `${state.branchId} events`);
    const memories = recordsById(memoriesOf(state), `${state.branchId} memories`);
    const boundaries = recordsById(state.boundaries, `${state.branchId} boundaries`);
    const turns = options.turns || [];
    const intents = recordsById(intentsOf(turns), `${state.branchId} intents`);

    for (const event of state.events) {
      invariant(event.branchId === state.branchId, `Event ${event.id} belongs to branch ${event.branchId}, not ${state.branchId}.`);
      assertLocalIdentity(state, event.id, "event");
      for (const causeId of event.causes || []) invariant(events.has(causeId), `Event ${event.id} has unresolved or cross-branch cause ${causeId}.`);
      for (const memoryId of event.createdMemoryIds || []) invariant(memories.has(memoryId), `Event ${event.id} created unresolved memory ${memoryId}.`);
      for (const memoryId of event.citedMemoryIds || []) {
        const memory = memories.get(memoryId);
        invariant(memory, `Event ${event.id} cites unresolved memory ${memoryId}.`);
        if (event.actorId) invariant(memory.ownerId === event.actorId, `Event ${event.id} cites memory ${memoryId} not owned by actor ${event.actorId}.`);
      }
    }

    for (const memory of memories.values()) {
      assertLocalIdentity(state, memory.id, "memory");
      invariant(events.has(memory.originEventId), `Memory ${memory.id} has unresolved or cross-branch origin ${memory.originEventId}.`);
    }
    validateWorldProjection(state, new Set(events.keys()), `Current ${state.branchId}`);

    const sequences = {};
    let priorEventCount = -1;
    for (const boundary of state.boundaries) {
      const sequence = (sequences[boundary.turn] || 0) + 1;
      sequences[boundary.turn] = sequence;
      const namespace = state.identityNamespace || state.branchId;
      const expectedId = `boundary-${namespace}-t${String(boundary.turn).padStart(2, "0")}-s${sequence}`;
      invariant(boundary.id === expectedId, `Boundary ${boundary.id} does not match expected identity ${expectedId}.`);
      assertLocalIdentity(state, boundary.id, "boundary");
      invariant(BOUNDARY_CLASSIFICATIONS.includes(boundary.classification), `Boundary ${boundary.id} has invalid classification ${boundary.classification}.`);
      invariant(Number.isInteger(boundary.eventCount) && boundary.eventCount >= 1 && boundary.eventCount <= state.events.length, `Boundary ${boundary.id} has invalid event count ${boundary.eventCount}.`);
      invariant(boundary.eventCount >= priorEventCount, `Boundary ${boundary.id} moves event count backward.`);
      priorEventCount = boundary.eventCount;
      invariant(boundary.world && boundary.world.turn === boundary.turn, `Boundary ${boundary.id} world turn does not match its identity.`);
      invariant(boundary.world.branchId === state.branchId, `Boundary ${boundary.id} contains world state for another branch.`);
      const prefixEvents = new Set(state.events.slice(0, boundary.eventCount).map((event) => event.id));
      validateWorldProjection(boundary.world, prefixEvents, `Boundary ${boundary.id}`);
    }
    invariant(state.boundaries.at(-1).eventCount === state.events.length, `Latest boundary does not include all ${state.events.length} events.`);
    invariant(state.boundaries.at(-1).turn === state.turn, `Latest boundary does not match current turn ${state.turn}.`);

    for (const intent of intents.values()) {
      assertLocalIdentity(state, intent.id, "intent");
      const owned = state.npcs[intent.actorId] && new Set(state.npcs[intent.actorId].memories.map((memory) => memory.id));
      invariant(owned, `Intent ${intent.id} has unknown actor ${intent.actorId}.`);
      for (const memoryId of intent.citedMemoryIds || []) invariant(owned.has(memoryId), `Intent ${intent.id} cites foreign or unresolved memory ${memoryId}.`);
    }

    for (const event of state.events.filter((candidate) => candidate.external && candidate.eventType && candidate.eventType.startsWith("world.intervention."))) {
      invariant((event.causes || []).length === 0, `External intervention ${event.id} must be a causal root.`);
      invariant(boundaries.has(event.appliedAtBoundaryId), `External intervention ${event.id} has unresolved placement boundary ${event.appliedAtBoundaryId}.`);
      const consequence = state.events.find((candidate) => candidate.category === "Memory and belief update" && (candidate.causes || []).includes(event.id));
      invariant(consequence, `External intervention ${event.id} has no authoritative memory/belief consequence reference.`);
    }

    if (state.status === "completed") {
      invariant(state.outcome && state.outcome.attribution, `Completed branch ${state.branchId} has no outcome attribution.`);
      assertLocalIdentity(state, state.outcome.id, "outcome");
      const dimensions = ["medicalEventIds", "truthEventIds", "socialEventIds"];
      for (const dimension of dimensions) {
        const references = state.outcome.attribution[dimension];
        invariant(Array.isArray(references) && references.length > 0, `Outcome ${state.outcome.id} has no ${dimension} support.`);
        for (const eventId of references) invariant(events.has(eventId), `Outcome ${state.outcome.id} has unresolved ${dimension} event ${eventId}.`);
      }
      const outcomeEvent = state.events.find((event) => event.category === "Branch outcome");
      invariant(outcomeEvent, `Completed branch ${state.branchId} has no outcome event.`);
      const attributed = new Set(Object.values(state.outcome.attribution).flat());
      for (const eventId of attributed) invariant(outcomeEvent.causes.includes(eventId), `Outcome event ${outcomeEvent.id} omits attributed cause ${eventId}.`);
    }

    if (options.originalState) validateSourceReferences(state, turns, options.originalState, options.originalTurns || []);
    else {
      const sourceLinked = state.events.concat(Array.from(memories.values()), state.boundaries, Array.from(intents.values()), state.outcome || [])
        .some((record) => record && record.sourceId != null);
      invariant(!sourceLinked, `Branch ${state.branchId} has source references but no Original reference graph was supplied.`);
    }

    return Object.freeze({
      schemaVersion: INTEGRITY_SCHEMA_VERSION,
      valid: true,
      branchId: state.branchId,
      eventCount: state.events.length,
      boundaryCount: state.boundaries.length
    });
  }

  function validateSourceReferences(state, turns, originalState, originalTurns) {
    const originals = {
      event: recordsById(originalState.events, "Original events"),
      memory: recordsById(memoriesOf(originalState), "Original memories"),
      boundary: recordsById(originalState.boundaries, "Original boundaries"),
      intent: recordsById(intentsOf(originalTurns), "Original intents"),
      outcome: recordsById(originalState.outcome ? [originalState.outcome] : [], "Original outcomes")
    };
    const candidates = [
      ["event", state.events],
      ["memory", memoriesOf(state)],
      ["boundary", state.boundaries],
      ["intent", intentsOf(turns)],
      ["outcome", state.outcome ? [state.outcome] : []]
    ];
    for (const [type, records] of candidates) {
      for (const record of records) {
        if (record.sourceId == null) continue;
        invariant(originals[type].has(record.sourceId), `${type} ${record.id} has dangling or wrong-type Original source ${record.sourceId}.`);
      }
    }
  }

  function objectReferences(value, result = new Set()) {
    if (!value || typeof value !== "object" || result.has(value)) return result;
    result.add(value);
    for (const child of Object.values(value)) objectReferences(child, result);
    return result;
  }

  function assertNoSharedMutableObjects(original, alternate) {
    const originalReferences = objectReferences({ state: original.state, turns: original.turns, boundaries: original.boundaries });
    const alternateReferences = objectReferences({ state: alternate.state, turns: alternate.turns, boundaries: alternate.boundaries });
    for (const reference of alternateReferences) {
      if (originalReferences.has(reference) && !Object.isFrozen(reference)) {
        throw new TimelineIntegrityError("Original and Alternate share a mutable object reference.");
      }
    }
  }

  function validateTimelineSession(session) {
    invariant(session && session.original && session.original.kind === "Original", "Timeline session requires an Original timeline.");
    const originalReport = validateState(session.original.state, { turns: session.original.turns });
    let alternateReport = null;
    if (session.alternate) {
      validateState(session.alternate.state, {
        turns: session.alternate.turns,
        originalState: session.original.state,
        originalTurns: session.original.turns
      });
      assertNoSharedMutableObjects(session.original, session.alternate);
      if (session.alternate.interventionEventId) {
        invariant(session.alternate.state.events.some((event) => event.id === session.alternate.interventionEventId), `Alternate intervention reference ${session.alternate.interventionEventId} does not resolve.`);
      }
      alternateReport = Object.freeze({ branchId: session.alternate.branchId, valid: true });
    }
    return Object.freeze({
      schemaVersion: INTEGRITY_SCHEMA_VERSION,
      valid: true,
      original: originalReport,
      alternate: alternateReport
    });
  }

  return Object.freeze({
    INTEGRITY_SCHEMA_VERSION,
    TimelineIntegrityError,
    validateState,
    validateTimelineSession,
    assertNoSharedMutableObjects
  });
});
