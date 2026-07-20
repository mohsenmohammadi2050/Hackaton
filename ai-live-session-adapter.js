(function initializeAiLiveSessionAdapter(root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./world-scenario"), require("./world-engine"), require("./ai-decision-layer"), require("./timeline-fork-engine"), require("./timeline-integrity"), require("./live-view-models"), require("./branch-comparison"));
  } else if (root) {
    root.FORKED_FATES_AI_LIVE_SESSION_ADAPTER = factory(root.FORKED_FATES_WORLD_SCENARIO, root.FORKED_FATES_WORLD_ENGINE, root.FORKED_FATES_AI_DECISION_LAYER, root.FORKED_FATES_TIMELINE_FORK_ENGINE, root.FORKED_FATES_TIMELINE_INTEGRITY, root.FORKED_FATES_LIVE_VIEW_MODELS, root.FORKED_FATES_BRANCH_COMPARISON);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createAiLiveSessionAdapterApi(scenario, world, aiDecision, timelineFork, integrity, viewModels, comparison) {
  "use strict";

  const ADAPTER_VERSION = "1.1.0";
  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; }

  class AiLiveSessionError extends Error {
    constructor(code, message, cause) { super(message); this.name = "AiLiveSessionError"; this.code = code; this.cause = cause || null; }
  }

  function presentationAttempt(value, inheritedActorId) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision attempts must contain objects.");
    }
    const actorId = value.actorId || inheritedActorId;
    if (typeof actorId !== "string" || !Number.isInteger(value.attempt) || value.attempt < 1) {
      throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision attempt objects require an actorId and positive attempt number.");
    }
    const validationError = typeof value.validationError === "string"
      ? value.validationError
      : typeof value.message === "string" ? value.message : null;
    const output = value.intentId
      ? [{ actorId, intentId: value.intentId, action: value.action || null, status: value.status || "validated" }]
      : Array.isArray(value.outputs) ? value.outputs.map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.intentId !== "string") {
          throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision attempt outputs are invalid.");
        }
        return { actorId: entry.actorId || actorId, intentId: entry.intentId, action: entry.action || null, status: entry.status || "validated" };
      }) : [];
    return {
      actorId,
      attempt: value.attempt,
      transportAttempt: Number.isInteger(value.transportAttempt) ? value.transportAttempt : null,
      validationError,
      latencyMs: Number.isFinite(value.latencyMs) && value.latencyMs >= 0 ? value.latencyMs : null,
      reasoningRequested: typeof value.reasoningRequested === "boolean" ? value.reasoningRequested : null,
      reasoningSupported: [true, false, "unknown"].includes(value.reasoningSupported) ? value.reasoningSupported : "unknown",
      outputs: output
    };
  }

  // AI decision diagnostics are actor-grouped internally. Timeline/fork consumers receive
  // one branch-local, presentation-safe array and never provider payloads or raw reasoning.
  function normalizeAuditForPresentation(audit) {
    if (!audit || typeof audit !== "object" || Array.isArray(audit)) {
      throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision audit must be an object.");
    }
    const source = deepClone(audit);
    let attempts;
    if (source.attempts === undefined) {
      attempts = [];
      if (source.actors !== undefined && !Array.isArray(source.actors)) {
        throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision actor diagnostics must be an array.");
      }
      for (const actor of source.actors || []) {
        if (!actor || typeof actor !== "object" || Array.isArray(actor) || typeof actor.actorId !== "string") {
          throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision actor diagnostics are invalid.");
        }
        const ownedAttempts = actor.attempts === undefined ? [] : actor.attempts;
        if (!Array.isArray(ownedAttempts)) {
          throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision actor attempts must be an array.");
        }
        attempts.push(...ownedAttempts.map((entry) => presentationAttempt(entry, actor.actorId)));
      }
    } else {
      const values = Array.isArray(source.attempts)
        ? source.attempts
        : source.attempts && typeof source.attempts === "object" ? [source.attempts] : null;
      if (!values) throw new AiLiveSessionError("PRESENTATION_ATTEMPTS_SHAPE_INVALID", "AI decision attempts must be an array or one valid attempt object.");
      attempts = values.map((entry) => presentationAttempt(entry));
    }
    delete source.actors;
    delete source.acceptedIntentIds;
    source.attempts = attempts;
    return deepFreeze(source);
  }

  function normalizeTurnRecord(record) {
    const copy = deepClone(record);
    copy.audit = normalizeAuditForPresentation(copy.audit);
    return copy;
  }

  function boundaryIndex(state) {
    const sequences = {};
    return state.boundaries.map((boundary) => {
      const sequence = (sequences[boundary.turn] || 0) + 1;
      sequences[boundary.turn] = sequence;
      return deepFreeze({ id: boundary.id || `boundary-${state.branchId}-t${String(boundary.turn).padStart(2, "0")}-s${sequence}`, sourceId: boundary.sourceId || null, branchId: state.branchId, turn: boundary.turn, eventCount: boundary.eventCount, classification: boundary.classification, sequence });
    });
  }

  function timeline(kind, state, turns, metadata = {}) {
    return deepFreeze({
      id: `timeline-${state.branchId}`, kind, branchId: state.branchId,
      status: metadata.status || state.status, forkTurn: metadata.forkTurn ?? null,
      sourceBranchId: metadata.sourceBranchId || null, interventionEventId: metadata.interventionEventId || null,
      state, turns: turns.map(normalizeTurnRecord), boundaries: boundaryIndex(state)
    });
  }

  function scopeAudit(audit, before, after) {
    const copy = deepClone(normalizeAuditForPresentation(audit));
    const intentMap = new Map(before.map((intent, index) => [intent.id, after[index].id]));
    for (const attempt of copy.attempts) {
      for (const output of attempt.outputs) if (output.intentId) output.intentId = intentMap.get(output.intentId) || output.intentId;
    }
    if (copy.acceptedIntentIds) copy.acceptedIntentIds = copy.acceptedIntentIds.map((id) => intentMap.get(id) || id);
    return copy;
  }

  function createAiLiveSession(provider, options = {}) {
    if (!provider || typeof provider.decide !== "function") throw new AiLiveSessionError("AI_PROVIDER_REQUIRED", "AI Live requires a configured provider.");
    const initialState = world.createInitialWorld(scenario);
    let original = timeline("Original", initialState, []);
    let session = timelineFork.createTimelineSession(original);
    const cursors = { original: original.boundaries[0].id, alternate: null };
    const diagnosticLogger = typeof options.diagnosticLogger === "function" ? options.diagnosticLogger : null;

    function timelineFor(branch) {
      if (branch === "original") return session.original;
      if (branch === "alternate" && session.alternate) return session.alternate;
      throw new AiLiveSessionError("BRANCH_UNAVAILABLE", `${branch} is not available.`);
    }
    function currentView(branch = "original") { const value = timelineFor(branch); return viewModels.createTimelineView(value, { boundaryId: cursors[branch] || value.boundaries.at(-1).id }); }
    function viewAt(branch, boundaryId) { return viewModels.createTimelineView(timelineFor(branch), { boundaryId }); }
    function boundaryList(branch = "original") { return Object.freeze(timelineFor(branch).boundaries.map((boundary) => Object.freeze({ id: boundary.id, turn: boundary.turn, classification: boundary.classification, eventCount: boundary.eventCount }))); }
    function seekBoundary(branch, boundaryId) { if (!boundaryList(branch).some((boundary) => boundary.id === boundaryId)) throw new AiLiveSessionError("BOUNDARY_UNAVAILABLE", `Boundary ${boundaryId} is unavailable.`); cursors[branch] = boundaryId; return currentView(branch); }
    function seekTurn(branch, turn, preference = "latest") { const matches = boundaryList(branch).filter((boundary) => boundary.turn === turn); if (!matches.length) throw new AiLiveSessionError("BOUNDARY_UNAVAILABLE", `Turn ${turn} is unavailable.`); return seekBoundary(branch, (preference === "earliest" ? matches[0] : matches.at(-1)).id); }

    async function resolveNext(branch = "original", status) {
      const current = timelineFor(branch);
      if (current.state.status === "completed") return currentView(branch);
      if (branch === "alternate" && current.status !== "intervened") throw new AiLiveSessionError("INTERVENTION_REQUIRED", "Alternate requires exactly one intervention before AI continuation.");
      let result;
      try { result = await aiDecision.decideAndResolveTurn(current.state, provider, { maxAttempts: options.maxAttempts || 3, onStatus: status, onDiagnostic: diagnosticLogger }); }
      catch (error) { throw new AiLiveSessionError(error.code || "AI_TURN_FAILED", error.message, error); }
      if (branch === "original") {
        const nextTurns = current.turns.concat([{ turn: result.state.turn, intents: result.intents, audit: result.audit }]);
        original = timeline("Original", result.state, nextTurns);
        session = deepFreeze({ id: session.id, original, alternate: session.alternate });
      } else {
        const scopedIntents = result.intents.map((intent) => world.scopeIntentForState(result.state, intent));
        const nextTurns = current.turns.concat([{ turn: result.state.turn, intents: scopedIntents, audit: scopeAudit(result.audit, result.intents, scopedIntents) }]);
        const alternate = timeline("Alternate", result.state, nextTurns, { status: result.state.status === "completed" ? "completed" : "intervened", forkTurn: current.forkTurn, sourceBranchId: current.sourceBranchId, interventionEventId: current.interventionEventId });
        session = deepFreeze({ id: session.id, original: session.original, alternate });
      }
      cursors[branch] = timelineFor(branch).boundaries.at(-1).id;
      return currentView(branch);
    }

    function forkAt(turn) {
      try {
        const candidateSession = timelineFork.forkAlternate(session, { turn });
        const candidateCursor = candidateSession.alternate.boundaries.at(-1).id;
        const candidateView = viewModels.createTimelineView(candidateSession.alternate, { boundaryId: candidateCursor });
        session = candidateSession;
        cursors.alternate = candidateCursor;
        return candidateView;
      } catch (error) {
        const code = error.code === "PRESENTATION_ATTEMPTS_SHAPE_INVALID" ? error.code : "FORK_FAILED";
        throw new AiLiveSessionError(code, error.message, error);
      }
    }
    function applyIntervention(request) {
      try {
        const candidateSession = timelineFork.applyAlternateIntervention(session, request);
        const candidateCursor = candidateSession.alternate.boundaries.at(-1).id;
        const candidateView = viewModels.createTimelineView(candidateSession.alternate, { boundaryId: candidateCursor });
        session = candidateSession;
        cursors.alternate = candidateCursor;
        return candidateView;
      }
      catch (error) { throw new AiLiveSessionError("INTERVENTION_FAILED", error.message, error); }
    }
    function compare() { try { return comparison.compareTimelineSession(session); } catch (error) { throw new AiLiveSessionError("COMPARISON_FAILED", error.message, error); } }
    function validate() { return integrity.validateTimelineSession(session); }
    function capabilities() {
      const originalState = session.original.state;
      return Object.freeze({
        canFork: !session.alternate, eligibleForkTurns: !session.alternate ? session.original.boundaries.filter((boundary) => boundary.turn <= 10 && boundary.classification !== "post-intervention" && boundary.turn <= originalState.turn).map((boundary) => boundary.turn) : [],
        hasAlternate: Boolean(session.alternate), alternateNeedsIntervention: session.alternate?.status === "forked",
        alternateCanRun: session.alternate?.status === "intervened" && session.alternate.state.status !== "completed",
        canCompare: session.alternate?.status === "completed" && session.original.state.status === "completed"
      });
    }

    return Object.freeze({ version: ADAPTER_VERSION, mode: "ai-live", dynamic: true, currentView, viewAt, boundaryList, seekBoundary, seekTurn, resolveNext, forkAt, applyIntervention, compare, getSession: () => session, validate, capabilities });
  }

  return Object.freeze({ ADAPTER_VERSION, AiLiveSessionError, normalizeAuditForPresentation, createAiLiveSession });
});
