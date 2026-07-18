(function initializePhaseOneData() {
  "use strict";

  const data = {
    product: {
      name: "Forked Fates",
      promise: "Change one belief. Watch a different story emerge.",
      type: "Causal narrative sandbox",
      scenario: "The Last Antidote",
      premise: "A child is poisoned, the village's only antidote is missing, and four people hold different pieces of the truth."
    },
    locations: {
      clinic: {
        name: "Clinic",
        marker: "CL",
        description: "Niko waits beside an empty antidote case.",
        contents: "Niko · empty case · clinic records"
      },
      square: {
        name: "Village Square",
        marker: "VS",
        description: "Public words travel quickly here.",
        contents: "Notice board · gathered villagers"
      },
      storehouse: {
        name: "Storehouse",
        marker: "ST",
        description: "A searchable room kept under civic watch.",
        contents: "Contents unknown"
      }
    },
    characters: {
      mara: {
        name: "Mara Vale",
        shortName: "Mara",
        initials: "MV",
        role: "Healer",
        color: "ember",
        publicDescription: "The village healer responsible for Niko's care and the clinic's fragile public trust.",
        traits: ["Compassionate", "Direct", "Wary of authority"],
        goals: [
          { priority: "Primary", text: "Administer the antidote to Niko before nightfall", status: "Active" },
          { priority: "Secondary", text: "Preserve public trust in the clinic", status: "Active" }
        ],
        trust: { dain: 20, sera: 10, orin: -10 },
        posture: "Urgent",
        item: "None",
        beliefs: [
          { id: "belief-mara-antidote-missing", turn: 0, proposition: "The clinic antidote is missing", stance: "Believes true", confidence: 100, provenance: "Direct observation" },
          { id: "belief-mara-sera-role", turn: 0, proposition: "Sera moved the antidote", stance: "Uncertain", confidence: 15, provenance: "No supporting memory" },
          { id: "belief-mara-orin-role", turn: 0, proposition: "Orin is involved in the disappearance", stance: "Uncertain", confidence: 25, provenance: "Orin holds a spare clinic key" },
          { id: "belief-mara-case-key", turn: 1, proposition: "The empty case was opened with the spare key", stance: "Believes true", confidence: 90, provenance: "Direct investigation" }
        ],
        memories: [
          { id: "mem-start-mara-missing", turn: 0, text: "The antidote case is empty.", source: "Direct observation", visibility: "Self-only", salience: "Critical" },
          { id: "mem-start-mara-deadline", turn: 0, text: "Niko will not survive beyond turn twelve without treatment.", source: "Professional knowledge", visibility: "Self-only", salience: "Critical" },
          { id: "mem-start-mara-key", turn: 0, text: "Orin possesses a spare clinic key.", source: "Starting knowledge", visibility: "Self-only", salience: "Important" },
          { id: "mem-shared-mara-key", turn: 1, text: "Tool marks show the empty case was opened with the spare key rather than forced.", source: "Direct observation", visibility: "Self-only", salience: "Critical" }
        ]
      },
      dain: {
        name: "Dain Holt",
        shortName: "Dain",
        initials: "DH",
        role: "Guard",
        color: "steel",
        publicDescription: "A rigid village guard trying to identify responsibility without letting the crisis become panic.",
        traits: ["Dutiful", "Suspicious", "Rigid"],
        goals: [
          { priority: "Primary", text: "Identify who removed the antidote", status: "Active" },
          { priority: "Secondary", text: "Prevent panic and preserve civic order", status: "Active" }
        ],
        trust: { mara: 30, sera: -20, orin: 40 },
        posture: "Defensive",
        item: "None",
        beliefs: [
          { id: "belief-dain-sera-role", turn: 0, proposition: "Sera may be connected to the missing vial", stance: "Uncertain", confidence: 65, provenance: "He saw Sera leave the Clinic" },
          { id: "belief-dain-storehouse", turn: 0, proposition: "The Storehouse should remain undisturbed", stance: "Believes true", confidence: 70, provenance: "Orin's request" },
          { id: "belief-dain-sera-denial", turn: 1, proposition: "Sera does not know where the vial is", stance: "Uncertain", confidence: 35, provenance: "Sera's private claim" }
        ],
        memories: [
          { id: "mem-start-dain-sera-sighting", turn: 0, text: "Dain saw Sera leave the Clinic shortly before the vial was reported missing.", source: "Direct observation", visibility: "Self-only", salience: "Important" },
          { id: "mem-start-dain-storehouse", turn: 0, text: "Orin asked him to keep the Storehouse undisturbed.", source: "Orin", visibility: "Private", salience: "Important" },
          { id: "mem-shared-dain-question", turn: 1, text: "He privately asked Sera to explain why she left the Clinic.", source: "Personal action", visibility: "Private", salience: "Important" },
          { id: "mem-shared-dain-denial", turn: 1, text: "Sera claimed she did not know where the antidote was.", source: "Sera", visibility: "Private", salience: "Important" },
          { id: "mem-shared-dain-orin-claim", turn: 1, text: "Orin publicly said there was no proof the vial left the Clinic.", source: "Orin", visibility: "Public", salience: "Ordinary" }
        ]
      },
      sera: {
        name: "Sera Quill",
        shortName: "Sera",
        initials: "SQ",
        role: "Courier",
        color: "moss",
        publicDescription: "An observant courier whose urgency is sharpened by a fear of becoming the village's culprit.",
        traits: ["Observant", "Guilt-prone", "Evasive"],
        goals: [
          { priority: "Primary", text: "Ensure Niko receives the antidote", status: "Active" },
          { priority: "Secondary", text: "Avoid punishment for moving it", status: "Active" }
        ],
        trust: { mara: 20, dain: -30, orin: -10 },
        posture: "Afraid",
        item: "None",
        beliefs: [
          { id: "belief-sera-antidote-storehouse", turn: 0, proposition: "The antidote is hidden in the Storehouse", stance: "Believes true", confidence: 100, provenance: "Personal action" },
          { id: "belief-sera-orin-protect", turn: 0, proposition: "Orin will protect her if questioned", stance: "Uncertain", confidence: 35, provenance: "No assurance received" },
          { id: "belief-sera-dain-suspicion", turn: 1, proposition: "Dain suspects her involvement", stance: "Believes true", confidence: 85, provenance: "Dain's private question" }
        ],
        memories: [
          { id: "mem-start-sera-orin-order", turn: 0, text: "Orin ordered Sera to move the vial from the Clinic.", source: "Orin", visibility: "Private", salience: "Critical" },
          { id: "mem-start-sera-antidote", turn: 0, text: "She placed the antidote in the Storehouse.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
          { id: "mem-start-sera-dain-saw", turn: 0, text: "Dain saw her leave the Clinic.", source: "Direct observation", visibility: "Self-only", salience: "Important" },
          { id: "mem-shared-sera-questioned", turn: 1, text: "Dain privately asked why she left the Clinic.", source: "Dain", visibility: "Private", salience: "Important" },
          { id: "mem-shared-sera-denial", turn: 1, text: "She denied knowing where the antidote was.", source: "Personal action", visibility: "Private", salience: "Important" },
          { id: "mem-shared-sera-orin-claim", turn: 1, text: "Orin publicly said there was no proof the vial left the Clinic.", source: "Orin", visibility: "Public", salience: "Ordinary" }
        ]
      },
      orin: {
        name: "Orin Voss",
        shortName: "Orin",
        initials: "OV",
        role: "Mayor",
        color: "violet",
        publicDescription: "The charismatic mayor, intent on preserving authority as the village turns anxious and suspicious.",
        traits: ["Charismatic", "Status-conscious", "Calculating"],
        goals: [
          { priority: "Primary", text: "Prevent his order from becoming public", status: "Active" },
          { priority: "Secondary", text: "Maintain authority and prevent disorder", status: "Active" }
        ],
        trust: { mara: 0, dain: 30, sera: -20 },
        posture: "Calm",
        item: "Spare clinic key",
        beliefs: [
          { id: "belief-orin-antidote-storehouse", turn: 0, proposition: "The antidote is in the Storehouse", stance: "Believes true", confidence: 100, provenance: "Sera's report" },
          { id: "belief-orin-sera-silence", turn: 0, proposition: "Sera will keep his order private", stance: "Uncertain", confidence: 55, provenance: "Sera complied" },
          { id: "belief-orin-cover", turn: 1, proposition: "Public reassurance can delay scrutiny", stance: "Believes true", confidence: 65, provenance: "Declared strategy" }
        ],
        memories: [
          { id: "mem-start-orin-order", turn: 0, text: "Orin ordered Sera to move the antidote.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
          { id: "mem-start-orin-location", turn: 0, text: "Sera placed the vial in the Storehouse.", source: "Sera", visibility: "Private", salience: "Critical" },
          { id: "mem-start-orin-dain", turn: 0, text: "He asked Dain to keep the Storehouse undisturbed.", source: "Personal action", visibility: "Private", salience: "Important" },
          { id: "mem-shared-orin-claim", turn: 1, text: "He publicly claimed there was no proof the vial left the Clinic.", source: "Personal action", visibility: "Public", salience: "Important" }
        ]
      }
    },
    snapshots: {
      0: {
        patient: "Untreated · critical",
        turnsRemaining: 12,
        activity: "Paused at the starting boundary",
        locations: { clinic: ["mara"], square: ["dain", "sera", "orin"], storehouse: [] }
      },
      1: {
        patient: "Untreated · critical",
        turnsRemaining: 11,
        activity: "Turn 1 complete · paused",
        locations: { clinic: ["mara"], square: ["dain", "sera", "orin"], storehouse: [] }
      }
    },
    events: [
      {
        id: "evt-shared-t00-start",
        turn: 0,
        order: 0,
        phase: "Scenario boundary",
        category: "World fact",
        tone: "fact",
        actor: null,
        targets: ["Niko"],
        location: "Clinic",
        visibility: "Public",
        summary: "Nightfall sets a twelve-turn deadline",
        happened: "Niko is poisoned, the village antidote is missing, and the branch begins with twelve turns remaining.",
        rationale: "Scenario pressure establishes the deadline; this is not an NPC decision.",
        goal: "Resolve Niko's medical outcome by turn twelve",
        citedMemories: [],
        witnesses: ["Mara"],
        createdMemories: ["mem-start-mara-deadline"],
        changes: ["Clock: 12 turns remaining", "Patient: untreated and critical"],
        causes: []
      },
      {
        id: "evt-shared-t01-mara-key",
        turn: 1,
        order: 1,
        phase: "Investigation",
        category: "Evidence · fact",
        tone: "fact",
        actor: "mara",
        targets: ["Empty antidote case"],
        location: "Clinic",
        visibility: "Self-only",
        summary: "Mara finds spare-key marks on the empty case",
        happened: "Mara inspects the empty case and discovers it was opened with the spare clinic key rather than forced.",
        rationale: "The missing vial is Niko's only chance, so the empty case is the fastest source of physical evidence.",
        goal: "Administer the antidote to Niko before nightfall",
        citedMemories: ["mem-start-mara-missing", "mem-start-mara-deadline"],
        witnesses: ["Mara"],
        createdMemories: ["mem-shared-mara-key"],
        changes: ["Fact discovered by Mara: case opened with spare key", "Belief confidence: 90%"],
        causes: ["evt-shared-t00-start"]
      },
      {
        id: "evt-shared-t01-dain-question",
        turn: 1,
        order: 2,
        phase: "Communication",
        category: "Private communication",
        tone: "private",
        actor: "dain",
        targets: ["Sera Quill"],
        location: "Village Square",
        visibility: "Private · Dain and Sera",
        summary: "Dain privately asks Sera about leaving the Clinic",
        happened: "Dain asks Sera why she left the Clinic shortly before the vial was reported missing.",
        rationale: "His direct sighting makes Sera the strongest lead available without alarming the Square.",
        goal: "Identify who removed the antidote",
        citedMemories: ["mem-start-dain-sera-sighting"],
        witnesses: ["Dain", "Sera"],
        createdMemories: ["mem-shared-dain-question", "mem-shared-sera-questioned"],
        changes: ["Sera now knows Dain is questioning her movements"],
        causes: ["evt-shared-t00-start"]
      },
      {
        id: "evt-shared-t01-sera-denial",
        turn: 1,
        order: 3,
        phase: "Communication",
        category: "Claim · private",
        tone: "claim",
        actor: "sera",
        targets: ["Dain Holt"],
        location: "Village Square",
        visibility: "Private · Dain and Sera",
        summary: "Sera denies knowing where the antidote is",
        happened: "Sera tells Dain she does not know where the antidote was taken. The statement is recorded as a claim, not world truth.",
        rationale: "She fears punishment and believes admitting involvement before she can recover the vial would end her chance to help Niko.",
        goal: "Avoid punishment for moving the antidote",
        citedMemories: ["mem-start-sera-dain-saw", "mem-start-sera-orin-order"],
        witnesses: ["Dain", "Sera"],
        createdMemories: ["mem-shared-dain-denial", "mem-shared-sera-denial"],
        changes: ["Dain gains a claim; world truth is unchanged"],
        causes: ["evt-shared-t00-start"]
      },
      {
        id: "evt-shared-t01-orin-reassure",
        turn: 1,
        order: 4,
        phase: "Communication",
        category: "Claim · public",
        tone: "claim",
        actor: "orin",
        targets: ["Public audience"],
        location: "Village Square",
        visibility: "Public",
        summary: "Orin says there is no proof the vial left the Clinic",
        happened: "Orin publicly urges calm and says there is no proof that the vial ever left Mara's Clinic. The statement is a claim, not a state change.",
        rationale: "Directing attention back to the Clinic protects his authority and delays scrutiny of the Storehouse.",
        goal: "Prevent his order from becoming public",
        citedMemories: ["mem-start-orin-order", "mem-start-orin-location"],
        witnesses: ["Orin", "Dain", "Sera"],
        createdMemories: ["mem-shared-dain-orin-claim", "mem-shared-sera-orin-claim", "mem-shared-orin-claim"],
        changes: ["Public claim added; world truth is unchanged"],
        causes: ["evt-shared-t00-start"]
      }
    ],
    outcomePreview: {
      medical: "Unresolved",
      truth: "Unresolved",
      social: "Unresolved",
      explanation: "This Recorded preview ends after one complete turn. Outcomes resolve only after treatment or the turn-twelve deadline."
    }
  };

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  window.FORKED_FATES_PHASE1 = deepFreeze(data);
})();
