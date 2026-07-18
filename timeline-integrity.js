(function initializeTimelineIntegrity(root, factory) {
  "use strict";

  const integrity = factory();
  if (typeof module === "object" && module.exports) module.exports = integrity;
  else if (root) root.FORKED_FATES_TIMELINE_INTEGRITY = integrity;
})(typeof globalThis !== "undefined" ? globalThis : this, function createTimelineIntegrityApi() {
  "use strict";

  const INTEGRITY_SCHEMA_VERSION = "1.1.0";
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

  function intentEntries(turns) {
    return (turns || []).flatMap((turn) => (turn.intents || []).map((intent) => ({ intent, turn: turn.turn })));
  }

  function scopedEventId(namespace, sourceId) {
    return `evt-world-${namespace}--${sourceId.slice("evt-world-".length)}`;
  }

  function scopedMemoryId(namespace, sourceId) {
    if (sourceId.startsWith("mem-world-")) return `mem-world-${namespace}--${sourceId.slice("mem-world-".length)}`;
    if (sourceId.startsWith("mem-start-")) return `mem-start-${namespace}--${sourceId.slice("mem-start-".length)}`;
    return `mem-${namespace}--${sourceId}`;
  }

  function scopedIntentId(namespace, sourceId) {
    return `${namespace}--${sourceId}`;
  }

  function scopedBoundaryId(namespace, sourceId, sourceBranchId) {
    const prefix = `boundary-${sourceBranchId}-`;
    invariant(sourceId.startsWith(prefix), `Original boundary identity ${sourceId} does not belong to ${sourceBranchId}.`);
    return `boundary-${namespace}-${sourceId.slice(prefix.length)}`;
  }

  function scopedOutcomeId(namespace, sourceId) {
    return `outcome-${namespace}--${sourceId.replace(/^outcome-/, "")}`;
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
    const eventOrder = new Map(state.events.map((event, index) => [event.id, index]));

    for (const [eventIndex, event] of state.events.entries()) {
      invariant(event.branchId === state.branchId, `Event ${event.id} belongs to branch ${event.branchId}, not ${state.branchId}.`);
      assertLocalIdentity(state, event.id, "event");
      const causes = event.causes || [];
      invariant(new Set(causes).size === causes.length, `Event ${event.id} contains duplicate causal predecessors.`);
      for (const causeId of causes) {
        invariant(events.has(causeId), `Event ${event.id} has unresolved or cross-branch cause ${causeId}.`);
        invariant(causeId !== event.id, `Event ${event.id} cannot cause itself.`);
        invariant(eventOrder.get(causeId) < eventIndex, `Event ${event.id} has a forward causal reference to ${causeId}.`);
      }
      for (const memoryId of event.createdMemoryIds || []) invariant(memories.has(memoryId), `Event ${event.id} created unresolved memory ${memoryId}.`);
      for (const memoryId of event.citedMemoryIds || []) {
        const memory = memories.get(memoryId);
        invariant(memory, `Event ${event.id} cites unresolved memory ${memoryId}.`);
        if (event.actorId) invariant(memory.ownerId === event.actorId, `Event ${event.id} cites memory ${memoryId} not owned by actor ${event.actorId}.`);
        invariant(memory.turn <= event.turn, `Event ${event.id} cites future memory ${memoryId} from turn ${memory.turn}.`);
        invariant(eventOrder.get(memory.originEventId) < eventIndex, `Event ${event.id} cites memory ${memoryId} before it exists.`);
      }
    }

    for (const memory of memories.values()) {
      assertLocalIdentity(state, memory.id, "memory");
      invariant(events.has(memory.originEventId), `Memory ${memory.id} has unresolved or cross-branch origin ${memory.originEventId}.`);
    }
    validateWorldProjection(state, new Set(events.keys()), `Current ${state.branchId}`);

    const sequences = {};
    const classificationsByTurn = {};
    let initialCount = 0;
    let priorBoundary = null;
    for (const [boundaryIndex, boundary] of state.boundaries.entries()) {
      const sequence = (sequences[boundary.turn] || 0) + 1;
      sequences[boundary.turn] = sequence;
      const namespace = state.identityNamespace || state.branchId;
      const expectedId = `boundary-${namespace}-t${String(boundary.turn).padStart(2, "0")}-s${sequence}`;
      invariant(boundary.id === expectedId, `Boundary ${boundary.id} does not match expected identity ${expectedId}.`);
      assertLocalIdentity(state, boundary.id, "boundary");
      invariant(BOUNDARY_CLASSIFICATIONS.includes(boundary.classification), `Boundary ${boundary.id} has invalid classification ${boundary.classification}.`);
      invariant(Number.isInteger(boundary.eventCount) && boundary.eventCount >= 1 && boundary.eventCount <= state.events.length, `Boundary ${boundary.id} has invalid event count ${boundary.eventCount}.`);
      invariant(!priorBoundary || boundary.turn >= priorBoundary.turn, `Boundary ${boundary.id} moves turn order backward.`);
      invariant(!priorBoundary || boundary.eventCount > priorBoundary.eventCount, `Boundary ${boundary.id} does not advance authoritative event count.`);
      const classifications = classificationsByTurn[boundary.turn] || new Set();
      invariant(!classifications.has(boundary.classification), `Turn ${boundary.turn} contains duplicate ${boundary.classification} boundaries.`);
      classifications.add(boundary.classification);
      classificationsByTurn[boundary.turn] = classifications;
      if (boundary.classification === "initial") {
        initialCount += 1;
        invariant(boundaryIndex === 0 && boundary.turn === 0, `Initial boundary ${boundary.id} must be the first boundary at turn 0.`);
      }
      if (boundary.classification === "turn-close") invariant(boundary.turn > 0, `Turn-close boundary ${boundary.id} cannot occur at turn 0.`);
      if (boundary.classification === "post-intervention") {
        invariant(priorBoundary && priorBoundary.turn === boundary.turn
          && ["initial", "turn-close"].includes(priorBoundary.classification), `Post-intervention boundary ${boundary.id} must immediately follow its initial or turn-close boundary.`);
      }
      invariant(boundary.world && boundary.world.turn === boundary.turn, `Boundary ${boundary.id} world turn does not match its identity.`);
      invariant(boundary.world.branchId === state.branchId, `Boundary ${boundary.id} contains world state for another branch.`);
      const prefixEvents = new Set(state.events.slice(0, boundary.eventCount).map((event) => event.id));
      validateWorldProjection(boundary.world, prefixEvents, `Boundary ${boundary.id}`);
      priorBoundary = boundary;
    }
    invariant(initialCount === 1, `Branch ${state.branchId} must contain exactly one initial boundary.`);
    const latestBoundary = state.boundaries.at(-1);
    invariant(latestBoundary.eventCount === state.events.length, `Latest boundary does not include all ${state.events.length} events.`);
    invariant(latestBoundary.turn === state.turn, `Latest boundary does not match current turn ${state.turn}.`);
    for (const key of Object.keys(latestBoundary.world)) {
      invariant(JSON.stringify(latestBoundary.world[key]) === JSON.stringify(state[key]), `Latest boundary does not represent current ${key} state.`);
    }

    for (const { intent, turn } of intentEntries(turns)) {
      assertLocalIdentity(state, intent.id, "intent");
      const owned = state.npcs[intent.actorId] && new Set(state.npcs[intent.actorId].memories.map((memory) => memory.id));
      invariant(owned, `Intent ${intent.id} has unknown actor ${intent.actorId}.`);
      invariant(turn === intent.chosenAtTurn + 1, `Intent ${intent.id} does not match its recorded decision turn ${turn}.`);
      for (const memoryId of intent.citedMemoryIds || []) {
        invariant(owned.has(memoryId), `Intent ${intent.id} cites foreign or unresolved memory ${memoryId}.`);
        invariant(memories.get(memoryId).turn <= intent.chosenAtTurn, `Intent ${intent.id} cites future memory ${memoryId} from turn ${memories.get(memoryId).turn}.`);
      }
    }

    for (const event of state.events.filter((candidate) => candidate.external && candidate.eventType && candidate.eventType.startsWith("world.intervention."))) {
      invariant((event.causes || []).length === 0, `External intervention ${event.id} must be a causal root.`);
      const appliedBoundary = boundaries.get(event.appliedAtBoundaryId);
      invariant(appliedBoundary, `External intervention ${event.id} has unresolved placement boundary ${event.appliedAtBoundaryId}.`);
      invariant(appliedBoundary.world.branchId === state.branchId && appliedBoundary.turn === event.turn, `External intervention ${event.id} is placed at a boundary from another branch or turn.`);
      invariant(["initial", "turn-close"].includes(appliedBoundary.classification), `External intervention ${event.id} cannot be applied at a ${appliedBoundary.classification} boundary.`);
      invariant(appliedBoundary.eventCount === eventOrder.get(event.id), `External intervention ${event.id} is not immediately after boundary ${appliedBoundary.id}.`);
      const postBoundary = state.boundaries.find((boundary) => boundary.turn === event.turn && boundary.classification === "post-intervention");
      invariant(postBoundary && postBoundary.eventCount > eventOrder.get(event.id), `External intervention ${event.id} has no post-intervention boundary.`);

      if (event.eventType === "world.intervention.information.v1") {
        const consequences = state.events.filter((candidate) => candidate.category === "Memory and belief update"
          && (candidate.causes || []).includes(event.id));
        invariant(consequences.length === 1, `Information intervention ${event.id} requires exactly one memory/belief consequence.`);
        invariant(consequences[0].changes.memories.length > 0 && consequences[0].changes.beliefs.length > 0, `Information intervention ${event.id} has incomplete memory/belief consequences.`);
      } else if (event.eventType === "world.intervention.item-transfer.v1") {
        invariant(event.changes.items.length > 0, `Item-transfer intervention ${event.id} has no authoritative item change.`);
      } else if (event.eventType === "world.intervention.environmental-event.v1") {
        invariant(event.changes.locations.length > 0, `Environmental intervention ${event.id} has no authoritative location change.`);
      } else {
        invariant(false, `External intervention ${event.id} has unsupported event type ${event.eventType}.`);
      }
    }

    if (state.status === "completed") {
      invariant(state.outcome && state.outcome.attribution, `Completed branch ${state.branchId} has no outcome attribution.`);
      assertLocalIdentity(state, state.outcome.id, "outcome");
      const dimensions = ["medicalEventIds", "truthEventIds", "socialEventIds"];
      for (const dimension of dimensions) {
        const references = state.outcome.attribution[dimension];
        invariant(Array.isArray(references) && references.length > 0, `Outcome ${state.outcome.id} has no ${dimension} support.`);
        invariant(new Set(references).size === references.length, `Outcome ${state.outcome.id} contains duplicate ${dimension} support.`);
        for (const eventId of references) invariant(events.has(eventId), `Outcome ${state.outcome.id} has unresolved ${dimension} event ${eventId}.`);
      }
      const outcomeEvent = state.events.find((event) => event.category === "Branch outcome");
      invariant(outcomeEvent, `Completed branch ${state.branchId} has no outcome event.`);
      const attributed = new Set(Object.values(state.outcome.attribution).flat());
      for (const eventId of attributed) {
        invariant(eventId !== outcomeEvent.id, `Outcome ${state.outcome.id} cannot attribute itself.`);
        invariant(eventOrder.get(eventId) < eventOrder.get(outcomeEvent.id), `Outcome ${state.outcome.id} attributes a non-preceding event ${eventId}.`);
        invariant(outcomeEvent.causes.includes(eventId), `Outcome event ${outcomeEvent.id} omits attributed cause ${eventId}.`);
      }
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
    invariant(state.identityNamespace && Number.isInteger(state.forkTurn), `Alternate branch ${state.branchId} requires an identity namespace and fork turn.`);
    const namespace = state.identityNamespace;
    const forkTurn = state.forkTurn;
    const originalIntentEntryList = intentEntries(originalTurns);
    const originals = {
      event: recordsById(originalState.events, "Original events"),
      memory: recordsById(memoriesOf(originalState), "Original memories"),
      boundary: recordsById(originalState.boundaries, "Original boundaries"),
      intent: recordsById(originalIntentEntryList.map((entry) => entry.intent), "Original intents"),
      outcome: recordsById(originalState.outcome ? [originalState.outcome] : [], "Original outcomes")
    };
    const originalIntentEntries = new Map(originalIntentEntryList.map((entry) => [entry.intent.id, entry]));
    const originalEventOrder = new Map(originalState.events.map((event, index) => [event.id, index]));
    const alternateEventOrder = new Map(state.events.map((event, index) => [event.id, index]));
    const originalForkBoundary = originalState.boundaries.slice().reverse().find((boundary) => boundary.turn === forkTurn
      && ["initial", "turn-close"].includes(boundary.classification));
    invariant(originalForkBoundary, `Original has no copied-prefix boundary at turn ${forkTurn}.`);
    const alternateForkBoundary = state.boundaries.slice().reverse().find((boundary) => boundary.turn === forkTurn
      && ["initial", "turn-close"].includes(boundary.classification));
    invariant(alternateForkBoundary, `Alternate has no copied-prefix boundary at turn ${forkTurn}.`);
    invariant(alternateForkBoundary.eventCount === originalForkBoundary.eventCount, `Alternate copied-prefix event count differs from Original at turn ${forkTurn}.`);
    const prefixEventCount = alternateForkBoundary.eventCount;

    function sourceFor(type, record, shouldBeCopied) {
      if (!shouldBeCopied) {
        invariant(record.sourceId == null, `New post-fork ${type} ${record.id} must not have sourceId ${record.sourceId}.`);
        return null;
      }
      invariant(record.sourceId != null, `Copied-prefix ${type} ${record.id} requires an exact Original sourceId.`);
      const source = originals[type].get(record.sourceId);
      invariant(source, `${type} ${record.id} has dangling or wrong-type Original source ${record.sourceId}.`);
      return source;
    }

    for (const [index, event] of state.events.entries()) {
      const source = sourceFor("event", event, index < prefixEventCount);
      if (!source) continue;
      invariant(source.turn <= forkTurn && originalEventOrder.get(source.id) < originalForkBoundary.eventCount, `Event ${event.id} sources an Original event outside the copied prefix.`);
      invariant(event.id === scopedEventId(namespace, source.id), `Event ${event.id} is not the deterministic clone of ${source.id}.`);
      invariant(event.turn === source.turn && event.actorId === source.actorId, `Event ${event.id} does not match source turn or actor ${source.id}.`);
    }

    function validateMemorySource(memory, label) {
      const originIndex = alternateEventOrder.get(memory.originEventId);
      invariant(originIndex !== undefined, `${label} memory ${memory.id} has unresolved origin ${memory.originEventId}.`);
      const source = sourceFor("memory", memory, originIndex < prefixEventCount);
      if (!source) return;
      invariant(source.turn <= forkTurn && originalEventOrder.get(source.originEventId) < originalForkBoundary.eventCount, `Memory ${memory.id} sources an Original memory outside the copied prefix.`);
      invariant(memory.id === scopedMemoryId(namespace, source.id), `Memory ${memory.id} is not the deterministic clone of ${source.id}.`);
      invariant(memory.turn === source.turn && memory.ownerId === source.ownerId, `Memory ${memory.id} does not match source turn or owner ${source.id}.`);
    }

    for (const memory of memoriesOf(state)) validateMemorySource(memory, "Current state");
    for (const boundary of state.boundaries) {
      for (const memory of memoriesOf(boundary.world)) validateMemorySource(memory, `Boundary ${boundary.id}`);
      if (boundary.world.outcome) {
        const copied = originalState.turn <= forkTurn;
        const source = sourceFor("outcome", boundary.world.outcome, copied);
        if (source) {
          invariant(boundary.world.outcome.id === scopedOutcomeId(namespace, source.id), `Boundary ${boundary.id} outcome is not the deterministic clone of ${source.id}.`);
        }
      }
    }

    for (const { intent, turn } of intentEntries(turns)) {
      const source = sourceFor("intent", intent, turn <= forkTurn);
      if (!source) continue;
      const sourceEntry = originalIntentEntries.get(source.id);
      invariant(sourceEntry && sourceEntry.turn <= forkTurn, `Intent ${intent.id} sources an Original intent outside the copied prefix.`);
      invariant(intent.id === scopedIntentId(namespace, source.id), `Intent ${intent.id} is not the deterministic clone of ${source.id}.`);
      invariant(turn === sourceEntry.turn && intent.chosenAtTurn === source.chosenAtTurn && intent.actorId === source.actorId, `Intent ${intent.id} does not match source turn or actor ${source.id}.`);
    }

    for (const boundary of state.boundaries) {
      const copied = boundary.turn <= forkTurn && ["initial", "turn-close"].includes(boundary.classification);
      const source = sourceFor("boundary", boundary, copied);
      if (!source) continue;
      invariant(source.turn <= forkTurn, `Boundary ${boundary.id} sources an Original boundary outside the copied prefix.`);
      invariant(boundary.id === scopedBoundaryId(namespace, source.id, originalState.branchId), `Boundary ${boundary.id} is not the deterministic clone of ${source.id}.`);
      invariant(boundary.turn === source.turn && boundary.classification === source.classification && boundary.eventCount === source.eventCount, `Boundary ${boundary.id} does not match source turn, classification, or event count ${source.id}.`);
    }

    if (state.outcome) {
      const copied = originalState.turn <= forkTurn;
      const source = sourceFor("outcome", state.outcome, copied);
      if (source) {
        invariant(state.outcome.id === scopedOutcomeId(namespace, source.id), `Outcome ${state.outcome.id} is not the deterministic clone of ${source.id}.`);
        invariant(state.outcome.medical === source.medical && state.outcome.truth === source.truth && state.outcome.social === source.social, `Outcome ${state.outcome.id} does not match Original source labels ${source.id}.`);
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

  function validateTimelineBoundaryIndex(timeline) {
    invariant(Array.isArray(timeline.boundaries) && timeline.boundaries.length === timeline.state.boundaries.length, `Timeline ${timeline.id} boundary index length does not match authoritative state.`);
    for (let index = 0; index < timeline.boundaries.length; index += 1) {
      const indexed = timeline.boundaries[index];
      const authoritative = timeline.state.boundaries[index];
      invariant(indexed.id === authoritative.id
        && (indexed.sourceId || null) === (authoritative.sourceId || null)
        && indexed.branchId === timeline.state.branchId
        && indexed.turn === authoritative.turn
        && indexed.eventCount === authoritative.eventCount
        && indexed.classification === authoritative.classification, `Timeline ${timeline.id} boundary index ${indexed.id} does not match authoritative boundary ${authoritative.id}.`);
    }
  }

  function validateTimelineSession(session) {
    invariant(session && session.original && session.original.kind === "Original", "Timeline session requires an Original timeline.");
    const originalReport = validateState(session.original.state, { turns: session.original.turns });
    validateTimelineBoundaryIndex(session.original);
    let alternateReport = null;
    if (session.alternate) {
      invariant(session.alternate.forkTurn === session.alternate.state.forkTurn, `Alternate timeline fork turn does not match authoritative state.`);
      validateState(session.alternate.state, {
        turns: session.alternate.turns,
        originalState: session.original.state,
        originalTurns: session.original.turns
      });
      validateTimelineBoundaryIndex(session.alternate);
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
