(function initializeLiveSessionAdapter(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) {
    module.exports = factory(
      require("../data/world-scenario"),
      require("../ai/decision-providers"),
      require("../engine/timeline-fork-engine"),
      require("../engine/timeline-integrity"),
      require("../presentation/live-view-models"),
      require("../presentation/branch-comparison")
    );
  } else if (root) {
    root.FORKED_FATES_LIVE_SESSION_ADAPTER = factory(
      root.FORKED_FATES_WORLD_SCENARIO,
      root.FORKED_FATES_DECISION_PROVIDERS,
      root.FORKED_FATES_TIMELINE_FORK_ENGINE,
      root.FORKED_FATES_TIMELINE_INTEGRITY,
      root.FORKED_FATES_LIVE_VIEW_MODELS,
      root.FORKED_FATES_BRANCH_COMPARISON
    );
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createLiveSessionAdapterApi(
  scenario,
  providers,
  timelineFork,
  integrity,
  viewModels,
  comparison
) {
  "use strict";

  const ADAPTER_VERSION = "1.0.0";
  const REQUIRED = [scenario, providers, timelineFork, integrity, viewModels, comparison];

  class LiveSessionError extends Error {
    constructor(code, message, cause) {
      super(message);
      this.name = "LiveSessionError";
      this.code = code;
      this.cause = cause || null;
    }
  }

  function assertDependencies() {
    if (REQUIRED.some((dependency) => !dependency)) {
      throw new LiveSessionError("LIVE_UNAVAILABLE", "The Live simulation modules did not load. Recorded mode remains available.");
    }
  }

  function boundaryPosition(timeline, boundaryId) {
    return timeline.boundaries.findIndex((boundary) => boundary.id === boundaryId);
  }

  function initialBoundaryId(timeline) {
    return timeline.boundaries[0].id;
  }

  function createLiveSession(configuration = {}) {
    assertDependencies();
    let provider;
    let original;
    try {
      provider = providers.createProvider(configuration.provider || { type: "deterministic" });
      original = timelineFork.createOriginalTimeline(scenario, provider, configuration.decisionOptions || {});
      integrity.validateTimelineSession(timelineFork.createTimelineSession(original));
    } catch (error) {
      throw new LiveSessionError("LIVE_START_FAILED", "The authoritative Original could not be prepared.", error);
    }

    let session = timelineFork.createTimelineSession(original);
    const cursors = { original: initialBoundaryId(original), alternate: null };

    function timelineFor(branch) {
      if (branch === "original") return session.original;
      if (branch === "alternate" && session.alternate) return session.alternate;
      throw new LiveSessionError("BRANCH_UNAVAILABLE", `The ${branch} branch is not available.`);
    }

    function currentView(branch = "original") {
      const timeline = timelineFor(branch);
      return viewModels.createTimelineView(timeline, { boundaryId: cursors[branch] || initialBoundaryId(timeline) });
    }

    function viewAt(branch, boundaryId) {
      return viewModels.createTimelineView(timelineFor(branch), { boundaryId });
    }

    function boundaryList(branch = "original") {
      return Object.freeze(timelineFor(branch).boundaries.map((boundary) => Object.freeze({
        id: boundary.id,
        turn: boundary.turn,
        classification: boundary.classification,
        eventCount: boundary.eventCount
      })));
    }

    function seekBoundary(branch, boundaryId) {
      const timeline = timelineFor(branch);
      if (boundaryPosition(timeline, boundaryId) < 0) throw new LiveSessionError("BOUNDARY_UNAVAILABLE", `Boundary ${boundaryId} is not complete in ${branch}.`);
      cursors[branch] = boundaryId;
      return currentView(branch);
    }

    function seekTurn(branch, turn, preference = "latest") {
      const timeline = timelineFor(branch);
      const matches = timeline.boundaries.filter((boundary) => boundary.turn === turn);
      if (!matches.length) throw new LiveSessionError("BOUNDARY_UNAVAILABLE", `Turn ${turn} is not complete in ${branch}.`);
      return seekBoundary(branch, (preference === "earliest" ? matches[0] : matches[matches.length - 1]).id);
    }

    function step(branch = "original") {
      const timeline = timelineFor(branch);
      const current = boundaryPosition(timeline, cursors[branch]);
      if (current < timeline.boundaries.length - 1) cursors[branch] = timeline.boundaries[current + 1].id;
      return currentView(branch);
    }

    function resetPlayback(branch = "original") {
      const timeline = timelineFor(branch);
      cursors[branch] = initialBoundaryId(timeline);
      return currentView(branch);
    }

    function forkAt(turn) {
      try {
        session = timelineFork.forkAlternate(session, { turn });
        cursors.alternate = session.alternate.boundaries[session.alternate.boundaries.length - 1].id;
        integrity.validateTimelineSession(session);
        return currentView("alternate");
      } catch (error) {
        throw new LiveSessionError("FORK_FAILED", error.message, error);
      }
    }

    function applyIntervention(request) {
      try {
        session = timelineFork.applyAlternateIntervention(session, request);
        cursors.alternate = session.alternate.boundaries[session.alternate.boundaries.length - 1].id;
        integrity.validateTimelineSession(session);
        return currentView("alternate");
      } catch (error) {
        throw new LiveSessionError("INTERVENTION_FAILED", error.message, error);
      }
    }

    function completeAlternate() {
      try {
        session = timelineFork.runAlternate(session, provider);
        integrity.validateTimelineSession(session);
        return currentView("alternate");
      } catch (error) {
        throw new LiveSessionError("ALTERNATE_FAILED", "The Alternate could not complete from its last frozen boundary.", error);
      }
    }

    function compare() {
      try {
        return comparison.compareTimelineSession(session);
      } catch (error) {
        throw new LiveSessionError("COMPARISON_FAILED", error.message, error);
      }
    }

    function getSession() { return session; }
    function validate() { return integrity.validateTimelineSession(session); }
    function capabilities() {
      return Object.freeze({
        canFork: !session.alternate,
        eligibleForkTurns: !session.alternate ? session.original.boundaries.filter((boundary) => boundary.turn >= 0 && boundary.turn <= 10 && boundary.classification !== "post-intervention").map((boundary) => boundary.turn) : [],
        hasAlternate: Boolean(session.alternate),
        alternateNeedsIntervention: session.alternate?.status === "forked",
        alternateCanRun: session.alternate?.status === "intervened",
        canCompare: session.alternate?.status === "completed"
      });
    }

    return Object.freeze({
      version: ADAPTER_VERSION,
      currentView,
      viewAt,
      boundaryList,
      seekBoundary,
      seekTurn,
      step,
      resetPlayback,
      forkAt,
      applyIntervention,
      completeAlternate,
      compare,
      getSession,
      validate,
      capabilities
    });
  }

  return Object.freeze({ ADAPTER_VERSION, LiveSessionError, createLiveSession });
});
