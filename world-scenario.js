(function initializeWorldScenario(root, factory) {
  "use strict";

  const scenario = factory();
  if (typeof module === "object" && module.exports) module.exports = scenario;
  else if (root) root.FORKED_FATES_WORLD_SCENARIO = scenario;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorldScenario() {
  "use strict";

  const goal = {
    maraTreat: "goal-mara-treat-niko",
    maraTrust: "goal-mara-preserve-clinic-trust",
    dainIdentify: "goal-dain-identify-responsibility",
    dainOrder: "goal-dain-preserve-order",
    seraTreat: "goal-sera-treat-niko",
    seraAvoid: "goal-sera-avoid-punishment",
    orinConceal: "goal-orin-conceal-order",
    orinOrder: "goal-orin-preserve-authority"
  };

  function intent(id, actorId, action, chosenAtTurn, servedGoalId, rationale, details) {
    return Object.assign({
      id,
      actorId,
      action,
      chosenAtTurn,
      servedGoalId,
      rationale,
      citedMemoryIds: []
    }, details || {});
  }

  function memory(id, ownerId, description, source, factIds) {
    return {
      id,
      ownerId,
      originEventId: "evt-world-t00-start",
      turn: 0,
      description,
      source,
      involvedCharacterIds: [],
      locationId: null,
      visibility: "self-only",
      salience: "critical",
      valence: "neutral",
      factIds: factIds || [],
      claimIds: []
    };
  }

  const scenario = {
    id: "the-last-antidote",
    version: "1.0",
    branchId: "world-original-v1",
    deadline: 12,
    npcOrder: ["mara", "dain", "sera", "orin"],
    actingPriorityByTurn: {
      1: ["mara", "dain", "sera", "orin"],
      2: ["mara", "dain", "orin", "sera"],
      3: ["dain", "mara", "orin", "sera"],
      4: ["dain", "orin", "mara", "sera"],
      5: ["orin", "dain", "mara", "sera"],
      6: ["mara", "dain", "sera", "orin"],
      7: ["sera", "dain", "mara", "orin"],
      8: ["dain", "sera", "mara", "orin"],
      9: ["dain", "sera", "orin", "mara"],
      10: ["orin", "dain", "sera", "mara"],
      11: ["orin", "dain", "sera", "mara"],
      12: ["dain", "orin", "mara", "sera"]
    },
    locations: {
      clinic: { id: "clinic", name: "Clinic", canTreatPatient: true, discoverableEvidenceIds: ["fact-case-spare-key"] },
      square: { id: "square", name: "Village Square", canTreatPatient: false, discoverableEvidenceIds: [] },
      storehouse: { id: "storehouse", name: "Storehouse", canTreatPatient: false, discoverableEvidenceIds: ["fact-antidote-storehouse"] }
    },
    facts: {
      "fact-antidote-storehouse": { id: "fact-antidote-storehouse", truth: true, hidden: true },
      "fact-orin-ordered-sera": { id: "fact-orin-ordered-sera", truth: true, hidden: true },
      "fact-sera-moved-antidote": { id: "fact-sera-moved-antidote", truth: true, hidden: true },
      "fact-case-spare-key": { id: "fact-case-spare-key", truth: true, hidden: false },
      "obs-dain-sera-sighting": { id: "obs-dain-sera-sighting", truth: true, hidden: false }
    },
    patient: { id: "niko", status: "Untreated", locationId: "clinic", treatmentTurn: null },
    antidote: { id: "antidote", locationId: "storehouse", possessorId: null, used: false },
    npcs: {
      mara: {
        id: "mara",
        name: "Mara Vale",
        role: "Healer",
        traits: ["Compassionate", "Direct", "Wary of authority"],
        locationId: "clinic",
        inventory: [],
        posture: "Urgent",
        goals: [
          { id: goal.maraTreat, priority: "primary", description: "Administer the antidote to Niko before nightfall", status: "active" },
          { id: goal.maraTrust, priority: "secondary", description: "Preserve public trust in the Clinic", status: "active" }
        ],
        trust: { dain: 20, sera: 10, orin: -10 },
        memories: [
          memory("mem-start-mara-missing", "mara", "The antidote is missing from the Clinic.", "direct-observation"),
          memory("mem-start-mara-deadline", "mara", "Niko will not survive beyond turn twelve without treatment.", "professional-knowledge"),
          memory("mem-start-mara-key", "mara", "Orin possesses a spare Clinic key.", "starting-knowledge", ["fact-case-spare-key"])
        ],
        beliefs: {
          "fact-antidote-storehouse": { propositionId: "fact-antidote-storehouse", stance: "uncertain", confidence: 0, supportingMemoryIds: [], updatedTurn: 0 },
          "fact-orin-ordered-sera": { propositionId: "fact-orin-ordered-sera", stance: "uncertain", confidence: 0, supportingMemoryIds: [], updatedTurn: 0 },
          "fact-case-spare-key": { propositionId: "fact-case-spare-key", stance: "believes-true", confidence: 70, supportingMemoryIds: ["mem-start-mara-key"], updatedTurn: 0 }
        }
      },
      dain: {
        id: "dain",
        name: "Dain Holt",
        role: "Guard",
        traits: ["Dutiful", "Suspicious", "Rigid"],
        locationId: "square",
        inventory: [],
        posture: "Defensive",
        goals: [
          { id: goal.dainIdentify, priority: "primary", description: "Identify who removed the antidote", status: "active" },
          { id: goal.dainOrder, priority: "secondary", description: "Prevent panic and preserve civic order", status: "active" }
        ],
        trust: { mara: 30, sera: -20, orin: 40 },
        memories: [
          memory("mem-start-dain-sera-sighting", "dain", "Dain saw Sera leave the Clinic shortly before the vial was reported missing.", "direct-observation", ["obs-dain-sera-sighting"]),
          memory("mem-start-dain-storehouse", "dain", "Orin asked Dain to keep the Storehouse undisturbed.", "orin")
        ],
        beliefs: {
          "obs-dain-sera-sighting": { propositionId: "obs-dain-sera-sighting", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-dain-sera-sighting"], updatedTurn: 0 },
          "fact-orin-ordered-sera": { propositionId: "fact-orin-ordered-sera", stance: "uncertain", confidence: 0, supportingMemoryIds: [], updatedTurn: 0 }
        }
      },
      sera: {
        id: "sera",
        name: "Sera Quill",
        role: "Courier",
        traits: ["Observant", "Guilt-prone", "Evasive"],
        locationId: "square",
        inventory: [],
        posture: "Afraid",
        goals: [
          { id: goal.seraTreat, priority: "primary", description: "Ensure Niko receives the antidote", status: "active" },
          { id: goal.seraAvoid, priority: "secondary", description: "Avoid punishment for moving it", status: "active" }
        ],
        trust: { mara: 20, dain: -30, orin: -10 },
        memories: [
          memory("mem-start-sera-orin-order", "sera", "Orin ordered Sera to move the vial from the Clinic.", "orin", ["fact-orin-ordered-sera"]),
          memory("mem-start-sera-antidote", "sera", "Sera placed the antidote in the Storehouse.", "personal-action", ["fact-sera-moved-antidote", "fact-antidote-storehouse"]),
          memory("mem-start-sera-dain-saw", "sera", "Dain saw Sera leave the Clinic.", "direct-observation", ["obs-dain-sera-sighting"])
        ],
        beliefs: {
          "fact-orin-ordered-sera": { propositionId: "fact-orin-ordered-sera", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-sera-orin-order"], updatedTurn: 0 },
          "fact-antidote-storehouse": { propositionId: "fact-antidote-storehouse", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-sera-antidote"], updatedTurn: 0 },
          "obs-dain-sera-sighting": { propositionId: "obs-dain-sera-sighting", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-sera-dain-saw"], updatedTurn: 0 }
        }
      },
      orin: {
        id: "orin",
        name: "Orin Voss",
        role: "Mayor",
        traits: ["Charismatic", "Status-conscious", "Calculating"],
        locationId: "square",
        inventory: ["spare-clinic-key"],
        posture: "Calm",
        goals: [
          { id: goal.orinConceal, priority: "primary", description: "Prevent his order from becoming public", status: "active" },
          { id: goal.orinOrder, priority: "secondary", description: "Maintain authority and prevent disorder", status: "active" }
        ],
        trust: { mara: 0, dain: 30, sera: -20 },
        memories: [
          memory("mem-start-orin-order", "orin", "Orin ordered Sera to move the antidote.", "personal-action", ["fact-orin-ordered-sera"]),
          memory("mem-start-orin-location", "orin", "Sera placed the vial in the Storehouse.", "sera", ["fact-antidote-storehouse"]),
          memory("mem-start-orin-dain", "orin", "Orin asked Dain to keep the Storehouse undisturbed.", "personal-action")
        ],
        beliefs: {
          "fact-orin-ordered-sera": { propositionId: "fact-orin-ordered-sera", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-orin-order"], updatedTurn: 0 },
          "fact-antidote-storehouse": { propositionId: "fact-antidote-storehouse", stance: "believes-true", confidence: 100, supportingMemoryIds: ["mem-start-orin-location"], updatedTurn: 0 }
        }
      }
    }
  };

  scenario.originalIntents = {
    1: [
      intent("orig-t01-mara-key", "mara", "Investigate", 0, goal.maraTreat, "The empty case is the fastest source of evidence.", { subject: "empty-case", citedMemoryIds: ["mem-start-mara-missing", "mem-start-mara-deadline"] }),
      intent("orig-t01-dain-question", "dain", "Communicate", 0, goal.dainIdentify, "Dain's sighting makes Sera the strongest private lead.", { audience: "private", targetId: "sera", claimIds: ["claim-dain-asks-sera"], citedMemoryIds: ["mem-start-dain-sera-sighting"] }),
      intent("orig-t01-sera-denial", "sera", "Communicate", 0, goal.seraAvoid, "Sera fears punishment before she can recover the vial.", { audience: "private", targetId: "dain", claimIds: ["claim-sera-does-not-know-location"], citedMemoryIds: ["mem-start-sera-dain-saw", "mem-start-sera-orin-order"] }),
      intent("orig-t01-orin-reassure", "orin", "Communicate", 0, goal.orinOrder, "Redirecting attention toward the Clinic protects Orin's authority.", { audience: "public", claimIds: ["claim-antidote-never-left-clinic"], citedMemoryIds: ["mem-start-orin-order", "mem-start-orin-location"] })
    ],
    2: [
      intent("orig-t02-mara-square", "mara", "Move", 1, goal.maraTreat, "Mara needs cooperation from the people in the Square.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t01-mara-key-mara"] }),
      intent("orig-t02-dain-clinic", "dain", "Move", 1, goal.dainIdentify, "Dain needs to inspect the physical scene.", { targetLocationId: "clinic", citedMemoryIds: ["mem-world-orig-t01-sera-denial-dain"] }),
      intent("orig-t02-sera-wait", "sera", "Wait", 1, goal.seraAvoid, "Sera remains evasive while Dain watches her.", { citedMemoryIds: ["mem-start-sera-orin-order"] }),
      intent("orig-t02-orin-accuse-mara", "orin", "Accuse", 1, goal.orinConceal, "Blaming the Clinic delays scrutiny of the Storehouse.", { targetId: "mara", responsibilityTargetId: "mara", claimIds: ["claim-mara-responsible"], citedMemoryIds: ["mem-start-orin-order"] })
    ],
    3: [
      intent("orig-t03-mara-question-orin", "mara", "Communicate", 2, goal.maraTreat, "The spare-key evidence makes Orin the most direct lead.", { audience: "private", targetId: "orin", claimIds: ["claim-mara-questions-orin-key"], citedMemoryIds: ["mem-world-orig-t01-mara-key-mara"] }),
      intent("orig-t03-dain-key", "dain", "Investigate", 2, goal.dainIdentify, "Direct evidence can resolve competing claims.", { subject: "empty-case", citedMemoryIds: ["mem-start-dain-sera-sighting"] }),
      intent("orig-t03-sera-wait", "sera", "Wait", 2, goal.seraAvoid, "Sera fears confession without possessing the vial.", { citedMemoryIds: ["mem-world-orig-t02-orin-accuse-mara-sera"] }),
      intent("orig-t03-orin-accuse-mara", "orin", "Accuse", 2, goal.orinConceal, "Repeating the accusation strengthens the false frame.", { targetId: "mara", responsibilityTargetId: "mara", claimIds: ["claim-mara-responsible"], citedMemoryIds: ["mem-world-orig-t02-orin-accuse-mara-orin"] })
    ],
    4: [
      intent("orig-t04-mara-publish-key", "mara", "Communicate", 3, goal.maraTreat, "Publishing verified evidence can redirect the search.", { audience: "public", factIds: ["fact-case-spare-key"], citedMemoryIds: ["mem-world-orig-t01-mara-key-mara"] }),
      intent("orig-t04-dain-square", "dain", "Move", 3, goal.dainIdentify, "Dain must compare the clue with the Square's claims.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t03-dain-key-dain"] }),
      intent("orig-t04-sera-wait", "sera", "Wait", 3, goal.seraAvoid, "The key clue points away from Sera without a confession.", { citedMemoryIds: ["mem-world-orig-t03-orin-accuse-mara-sera"] }),
      intent("orig-t04-orin-storehouse", "orin", "Move", 3, goal.orinConceal, "Mara's private scrutiny makes securing the vial urgent.", { targetLocationId: "storehouse", citedMemoryIds: ["mem-world-orig-t03-mara-question-orin-orin", "mem-start-orin-location"] })
    ],
    5: [
      intent("orig-t05-mara-denial", "mara", "Communicate", 4, goal.maraTrust, "Rejecting the false frame protects the Clinic.", { audience: "public", claimIds: ["claim-mara-not-responsible"], citedMemoryIds: ["mem-world-orig-t01-mara-key-mara"] }),
      intent("orig-t05-dain-accuse-mara", "dain", "Accuse", 4, goal.dainIdentify, "Dain's trust in Orin outweighs the ambiguous key clue.", { targetId: "mara", responsibilityTargetId: "mara", claimIds: ["claim-mara-responsible"], citedMemoryIds: ["mem-world-orig-t01-orin-reassure-dain", "mem-world-orig-t03-dain-key-dain"] }),
      intent("orig-t05-sera-wait", "sera", "Wait", 4, goal.seraAvoid, "Sera withholds her role until she knows the vial can be recovered.", { citedMemoryIds: ["mem-world-orig-t04-mara-publish-key-sera"] }),
      intent("orig-t05-orin-find-antidote", "orin", "Investigate", 4, goal.orinConceal, "Possession keeps the vial away from Orin's accusers.", { subject: "storehouse", citedMemoryIds: ["mem-start-orin-location", "mem-world-orig-t03-mara-question-orin-orin"] })
    ],
    6: [
      intent("orig-t06-mara-clinic", "mara", "Move", 5, goal.maraTreat, "Niko needs the healer present.", { targetLocationId: "clinic", citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t06-dain-clinic", "dain", "Move", 5, goal.dainIdentify, "The Clinic remains the center of the investigation.", { targetLocationId: "clinic", citedMemoryIds: ["mem-world-orig-t03-dain-key-dain"] }),
      intent("orig-t06-sera-storehouse", "sera", "Move", 5, goal.seraTreat, "Recovering the vial can still serve Niko.", { targetLocationId: "storehouse", citedMemoryIds: ["mem-start-sera-antidote"] }),
      intent("orig-t06-orin-square", "orin", "Move", 5, goal.orinConceal, "Leaving before a search keeps possession hidden.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t05-orin-find-antidote-orin"] })
    ],
    7: [
      intent("orig-t07-mara-wait", "mara", "Wait", 6, goal.maraTreat, "Leaving an untreated patient would increase the risk.", { citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t07-dain-reassure", "dain", "Communicate", 6, goal.dainOrder, "Dain must preserve cooperation while continuing the search.", { audience: "private", targetId: "mara", claimIds: ["claim-dain-will-keep-searching"], citedMemoryIds: ["mem-world-orig-t03-dain-key-dain"] }),
      intent("orig-t07-sera-empty", "sera", "Investigate", 6, goal.seraTreat, "Sera must recover the vial from its hiding place.", { subject: "storehouse", citedMemoryIds: ["mem-start-sera-antidote", "mem-world-orig-t06-sera-storehouse-sera"] }),
      intent("orig-t07-orin-wait", "orin", "Wait", 6, goal.orinConceal, "Waiting avoids drawing attention to his possession.", { citedMemoryIds: ["mem-world-orig-t05-orin-find-antidote-orin"] })
    ],
    8: [
      intent("orig-t08-mara-wait", "mara", "Wait", 7, goal.maraTreat, "Niko's condition keeps Mara at his bedside.", { citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t08-dain-square", "dain", "Move", 7, goal.dainIdentify, "The public dispute creates leads outside the Clinic.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t07-dain-reassure-dain"] }),
      intent("orig-t08-sera-square", "sera", "Move", 7, goal.seraTreat, "Orin is Sera's strongest lead after the vial vanished.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t07-sera-empty-sera"] }),
      intent("orig-t08-orin-wait", "orin", "Wait", 7, goal.orinOrder, "The false consensus protects Orin from direct scrutiny.", { citedMemoryIds: ["mem-world-orig-t05-orin-find-antidote-orin"] })
    ],
    9: [
      intent("orig-t09-mara-wait", "mara", "Wait", 8, goal.maraTreat, "Niko's immediate care outweighs following the argument.", { citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t09-dain-square", "dain", "Investigate", 8, goal.dainIdentify, "Dain needs physical evidence to resolve the claims.", { subject: "square", citedMemoryIds: ["mem-world-orig-t08-dain-square-dain"] }),
      intent("orig-t09-sera-accuse-orin", "sera", "Accuse", 8, goal.seraTreat, "Accusing Orin may force the vial into view.", { targetId: "orin", responsibilityTargetId: "orin", claimIds: ["claim-orin-has-antidote"], citedMemoryIds: ["mem-world-orig-t07-sera-empty-sera", "mem-start-sera-orin-order"] }),
      intent("orig-t09-orin-denial", "orin", "Communicate", 8, goal.orinConceal, "A firm denial protects Orin while Sera withholds proof.", { audience: "public", claimIds: ["claim-orin-no-antidote"], citedMemoryIds: ["mem-world-orig-t05-orin-find-antidote-orin", "mem-start-orin-order"] })
    ],
    10: [
      intent("orig-t10-mara-wait", "mara", "Wait", 9, goal.maraTreat, "Mara keeps Niko stable as time runs out.", { citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t10-dain-storehouse", "dain", "Move", 9, goal.dainIdentify, "The Storehouse connects Orin to Sera's allegation.", { targetLocationId: "storehouse", citedMemoryIds: ["mem-start-dain-storehouse", "mem-world-orig-t09-sera-accuse-orin-dain"] }),
      intent("orig-t10-sera-clinic", "sera", "Move", 9, goal.seraTreat, "Mara needs the truth Sera has withheld.", { targetLocationId: "clinic", citedMemoryIds: ["mem-world-orig-t07-sera-empty-sera"] }),
      intent("orig-t10-orin-storehouse", "orin", "Move", 9, goal.orinConceal, "The Square is unsafe after Sera's accusation.", { targetLocationId: "storehouse", citedMemoryIds: ["mem-world-orig-t09-sera-accuse-orin-orin", "mem-world-orig-t05-orin-find-antidote-orin"] })
    ],
    11: [
      intent("orig-t11-mara-wait", "mara", "Wait", 10, goal.maraTreat, "Mara must remain with Niko for the final turn.", { citedMemoryIds: ["mem-start-mara-deadline"] }),
      intent("orig-t11-dain-empty", "dain", "Investigate", 10, goal.dainIdentify, "The Storehouse remains Dain's strongest place to search.", { subject: "storehouse", citedMemoryIds: ["mem-world-orig-t10-dain-storehouse-dain"] }),
      intent("orig-t11-sera-confession", "sera", "Communicate", 10, goal.seraTreat, "Protecting herself can no longer serve Niko.", { audience: "public", confessionFactIds: ["fact-sera-moved-antidote", "fact-orin-ordered-sera"], citedMemoryIds: ["mem-start-sera-orin-order", "mem-world-orig-t07-sera-empty-sera"] }),
      intent("orig-t11-orin-square", "orin", "Move", 10, goal.orinConceal, "Leaving before investigation keeps the vial hidden.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t10-orin-storehouse-orin"] })
    ],
    12: [
      intent("orig-t12-mara-wait", "mara", "Wait", 11, goal.maraTreat, "Mara cannot administer an item she does not possess.", { citedMemoryIds: ["mem-start-mara-deadline", "mem-world-orig-t11-sera-confession-mara"] }),
      intent("orig-t12-dain-square", "dain", "Move", 11, goal.dainIdentify, "The Storehouse search failed and Orin remains the strongest lead.", { targetLocationId: "square", citedMemoryIds: ["mem-world-orig-t11-dain-empty-dain"] }),
      intent("orig-t12-sera-wait", "sera", "Wait", 11, goal.seraTreat, "Sera cannot recover the vial from another location before nightfall.", { citedMemoryIds: ["mem-world-orig-t11-sera-confession-sera"] }),
      intent("orig-t12-orin-wait", "orin", "Wait", 11, goal.orinConceal, "Orin continues withholding the vial at the deadline.", { citedMemoryIds: ["mem-world-orig-t05-orin-find-antidote-orin"] })
    ]
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  return deepFreeze(scenario);
});
