(function initializeTimelineForkEngine(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./world-engine"), require("./decision-layer"), require("./intervention-layer"));
  } else if (root) {
    root.FORKED_FATES_TIMELINE_FORK_ENGINE = factory(
      root.FORKED_FATES_WORLD_ENGINE,
      root.FORKED_FATES_DECISION_LAYER,
      root.FORKED_FATES_INTERVENTION_LAYER
    );
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createTimelineForkEngine(world, decision, intervention) {
  "use strict";

  if (!world || !decision || !intervention) throw new Error("Timeline Forking requires the World, Decision, and Intervention layers.");

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function assertObject(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object.`);
  }

  function exactKeys(value, allowed, label) {
    const unexpected = Object.keys(value).find((key) => !allowed.includes(key));
    if (unexpected) throw new TypeError(`${label} contains unsupported field ${unexpected}.`);
  }

  function boundaryIndex(state) {
    const sequences = {};
    return state.boundaries.map((boundary) => {
      const sequence = (sequences[boundary.turn] || 0) + 1;
      sequences[boundary.turn] = sequence;
      return deepFreeze({
        id: boundary.id || `boundary-${state.branchId}-t${String(boundary.turn).padStart(2, "0")}-s${sequence}`,
        sourceId: boundary.sourceId || null,
        branchId: state.branchId,
        turn: boundary.turn,
        eventCount: boundary.eventCount,
        sequence
      });
    });
  }

  function createOriginalTimeline(scenario, provider, options = {}) {
    const run = decision.runAutonomousOriginal(scenario, provider, options);
    return deepFreeze({
      id: `timeline-${run.state.branchId}`,
      kind: "Original",
      branchId: run.state.branchId,
      status: run.state.status,
      forkTurn: null,
      sourceBranchId: null,
      interventionEventId: null,
      state: run.state,
      turns: run.turns,
      boundaries: boundaryIndex(run.state)
    });
  }

  function createTimelineSession(original) {
    assertObject(original, "Original timeline");
    if (!Object.isFrozen(original) || original.kind !== "Original" || !Object.isFrozen(original.state)) {
      throw new TypeError("A frozen Original timeline is required.");
    }
    return deepFreeze({
      id: `timeline-session-${original.state.scenarioId}`,
      original,
      alternate: null
    });
  }

  function generatedBranchId(original, turn) {
    return `${original.branchId}-alternate-t${String(turn).padStart(2, "0")}`;
  }

  function identityMaps(state) {
    return {
      events: new Map(state.events.filter((event) => event.sourceId).map((event) => [event.sourceId, event.id]))
    };
  }

  function scopeAudit(audit, intentMap, eventMap) {
    const mapped = deepClone(audit);
    for (const attempt of mapped.attempts) {
      for (const output of attempt.outputs) {
        if (output.intentId && intentMap.has(output.intentId)) output.intentId = intentMap.get(output.intentId);
      }
      if (attempt.acceptedIntentIds) attempt.acceptedIntentIds = attempt.acceptedIntentIds.map((id) => intentMap.get(id) || id);
      if (attempt.resolutionInvalid) {
        attempt.resolutionInvalid = attempt.resolutionInvalid.map((entry) => Object.assign({}, entry, {
          eventId: eventMap.get(entry.eventId) || entry.eventId
        }));
      }
    }
    return mapped;
  }

  function scopeTurnRecord(record, branchState) {
    const intents = record.intents.map((intent) => world.scopeIntentForState(branchState, intent));
    const intentMap = new Map(record.intents.map((intent, index) => [intent.id, intents[index].id]));
    const maps = identityMaps(branchState);
    return deepFreeze({
      turn: record.turn,
      intents,
      audit: scopeAudit(record.audit, intentMap, maps.events)
    });
  }

  function forkAlternate(session, configuration) {
    assertObject(session, "Timeline session");
    assertObject(configuration, "Fork configuration");
    exactKeys(configuration, ["turn"], "Fork configuration");
    if (!Object.isFrozen(session) || !session.original || session.original.kind !== "Original") throw new TypeError("A frozen timeline session is required.");
    if (session.alternate) throw new Error("This phase supports only one alternate branch.");
    if (!Number.isInteger(configuration.turn)) throw new TypeError("Fork turn must be an integer completed boundary.");
    if (!session.original.boundaries.some((boundary) => boundary.turn === configuration.turn)) {
      throw new Error(`Original has no completed frozen boundary at turn ${configuration.turn}.`);
    }

    const branchId = generatedBranchId(session.original, configuration.turn);
    const state = world.forkCompletedBoundary(session.original.state, configuration.turn, branchId);
    const turns = session.original.turns
      .filter((record) => record.turn <= configuration.turn)
      .map((record) => scopeTurnRecord(record, state));
    const alternate = deepFreeze({
      id: `timeline-${branchId}`,
      kind: "Alternate",
      branchId,
      status: "forked",
      forkTurn: configuration.turn,
      sourceBranchId: session.original.branchId,
      interventionEventId: null,
      state,
      turns,
      boundaries: boundaryIndex(state)
    });
    return deepFreeze({ id: session.id, original: session.original, alternate });
  }

  function applyAlternateIntervention(session, request) {
    assertObject(session, "Timeline session");
    if (!session.alternate || session.alternate.status !== "forked") throw new Error("A newly forked alternate timeline is required.");
    const previousEventCount = session.alternate.state.events.length;
    const state = intervention.applyIntervention(session.alternate.state, request);
    const interventionEvent = state.events.slice(previousEventCount).find((event) => event.eventType && event.eventType.startsWith("world.intervention."));
    const alternate = deepFreeze({
      id: session.alternate.id,
      kind: "Alternate",
      branchId: session.alternate.branchId,
      status: "intervened",
      forkTurn: session.alternate.forkTurn,
      sourceBranchId: session.alternate.sourceBranchId,
      interventionEventId: interventionEvent.id,
      state,
      turns: session.alternate.turns,
      boundaries: boundaryIndex(state)
    });
    return deepFreeze({ id: session.id, original: session.original, alternate });
  }

  function runAlternate(session, provider, options = {}) {
    assertObject(session, "Timeline session");
    if (!session.alternate || session.alternate.status !== "intervened") throw new Error("The alternate requires exactly one intervention before continuation.");
    let state = session.alternate.state;
    const turns = session.alternate.turns.slice();
    while (state.status !== "completed") {
      const result = decision.decideAndResolveTurn(state, provider, options);
      state = result.state;
      turns.push(scopeTurnRecord({ turn: state.turn, intents: result.intents, audit: result.audit }, state));
    }
    const alternate = deepFreeze({
      id: session.alternate.id,
      kind: "Alternate",
      branchId: session.alternate.branchId,
      status: state.status,
      forkTurn: session.alternate.forkTurn,
      sourceBranchId: session.alternate.sourceBranchId,
      interventionEventId: session.alternate.interventionEventId,
      state,
      turns,
      boundaries: boundaryIndex(state)
    });
    return deepFreeze({ id: session.id, original: session.original, alternate });
  }

  return Object.freeze({
    createOriginalTimeline,
    createTimelineSession,
    forkAlternate,
    applyAlternateIntervention,
    runAlternate
  });
});
