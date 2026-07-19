(function initializeDemoPathConfig(root, factory) {
  "use strict";

  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else if (root) root.FORKED_FATES_DEMO_PATH = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function createDemoPathConfig() {
  "use strict";

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  return deepFreeze({
    version: "1.0.0",
    id: "demo-key-evidence-to-mara-t00",
    title: "The ledger reaches Mara",
    forkTurn: 0,
    intervention: {
      id: "demo-key-note-t00",
      category: "Information",
      boundaryTurn: 0,
      payload: {
        recipientId: "mara",
        propositionId: "fact-case-spare-key",
        truthStatus: "true-evidence",
        beliefStance: "believes-true",
        confidence: 90,
        description: "A sealed Clinic ledger proves that Orin held the spare key used on the empty case."
      }
    },
    expected: {
      firstChangedDecisionTurn: 1,
      originalOutcome: { medical: "Lost", truth: "Exposed", social: "Fractured" },
      alternateOutcome: { medical: "Lost", truth: "Obscured", social: "Fractured" },
      originalAntidotePossessorId: "orin",
      alternateAntidotePossessorId: "sera"
    }
  });
});
