(function initializeForkGuidance(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else if (root) root.FORKED_FATES_FORK_GUIDANCE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createForkGuidanceApi() {
  "use strict";
  function describe(turn, options = {}) {
    const deadline = options.deadline || 12;
    const remainingTurns = Math.max(0, deadline - turn);
    let eligible = Number.isInteger(turn) && turn >= 0 && turn <= 10 && !options.terminal && !options.hasAlternate && options.branch !== "alternate";
    let reason = null;
    if (options.branch === "alternate") reason = "Fork unavailable: only Original can be forked";
    else if (options.hasAlternate) reason = "Fork unavailable: Alternate already exists";
    else if (options.terminal || turn >= deadline) reason = "Fork unavailable: terminal turn";
    else if (turn > 10) reason = "Fork unavailable: insufficient future turns";
    if (reason) eligible = false;
    const opportunity = remainingTurns >= 8 ? "High opportunity for divergence" : remainingTurns >= 4 ? "Moderate opportunity for divergence" : `Limited opportunity — only ${remainingTurns} turn${remainingTurns === 1 ? "" : "s"} remain`;
    return Object.freeze({ turn, eligible, reason, remainingTurns, opportunity });
  }
  return Object.freeze({ describe });
});
