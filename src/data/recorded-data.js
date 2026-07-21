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
        action: null,
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
        action: "Investigate",
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
        action: "Communicate",
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
        action: "Communicate",
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
        action: "Communicate",
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
      explanation: "The Recorded Original remains unresolved until treatment or the turn-twelve deadline."
    }
  };

  Object.assign(data.snapshots, {
    2: { patient: "Untreated · critical", turnsRemaining: 10, activity: "Turn 2 complete · paused", locations: { clinic: ["dain"], square: ["mara", "sera", "orin"], storehouse: [] } },
    3: { patient: "Untreated · critical", turnsRemaining: 9, activity: "Turn 3 complete · paused", locations: { clinic: ["dain"], square: ["mara", "sera", "orin"], storehouse: [] } },
    4: { patient: "Untreated · critical", turnsRemaining: 8, activity: "Turn 4 complete · paused", locations: { clinic: [], square: ["mara", "dain", "sera"], storehouse: ["orin"] } },
    5: { patient: "Untreated · critical", turnsRemaining: 7, activity: "Turn 5 complete · paused", locations: { clinic: [], square: ["mara", "dain", "sera"], storehouse: ["orin"] } },
    6: { patient: "Untreated · critical", turnsRemaining: 6, activity: "Turn 6 complete · paused", locations: { clinic: ["mara", "dain"], square: ["orin"], storehouse: ["sera"] } },
    7: { patient: "Untreated · critical", turnsRemaining: 5, activity: "Turn 7 complete · paused", locations: { clinic: ["mara", "dain"], square: ["orin"], storehouse: ["sera"] } },
    8: { patient: "Untreated · critical", turnsRemaining: 4, activity: "Turn 8 complete · paused", locations: { clinic: ["mara"], square: ["dain", "sera", "orin"], storehouse: [] } },
    9: { patient: "Untreated · critical", turnsRemaining: 3, activity: "Turn 9 complete · paused", locations: { clinic: ["mara"], square: ["dain", "sera", "orin"], storehouse: [] } },
    10: { patient: "Untreated · critical", turnsRemaining: 2, activity: "Turn 10 complete · paused", locations: { clinic: ["mara", "sera"], square: [], storehouse: ["dain", "orin"] } },
    11: { patient: "Untreated · critical", turnsRemaining: 1, activity: "Turn 11 complete · paused", locations: { clinic: ["mara", "sera"], square: ["orin"], storehouse: ["dain"] } },
    12: { patient: "Lost · deadline passed", turnsRemaining: 0, activity: "Original complete · outcome resolved", locations: { clinic: ["mara", "sera"], square: ["dain", "orin"], storehouse: [] } }
  });

  data.characters.mara.history = [
    { turn: 0, item: "None", posture: "Urgent", trust: { dain: 20, sera: 10, orin: -10 } },
    { turn: 2, trust: { dain: 20, sera: 10, orin: -25 } },
    { turn: 3, trust: { dain: 20, sera: 10, orin: -40 } },
    { turn: 5, trust: { dain: 5, sera: 10, orin: -40 } },
    { turn: 11, trust: { dain: 5, sera: 25, orin: -65 } }
  ];
  data.characters.dain.history = [
    { turn: 0, item: "None", posture: "Defensive", trust: { mara: 30, sera: -20, orin: 40 } }
  ];
  data.characters.sera.history = [
    { turn: 0, item: "None", posture: "Afraid", trust: { mara: 20, dain: -30, orin: -10 } }
  ];
  data.characters.orin.history = [
    { turn: 0, item: "Spare clinic key", posture: "Calm", trust: { mara: 0, dain: 30, sera: -20 } },
    { turn: 5, item: "Antidote · concealed; spare clinic key" },
    { turn: 9, trust: { mara: 0, dain: 30, sera: -35 } }
  ];

  data.characters.mara.beliefs.push(
    { id: "belief-orig-mara-orin-blame", turn: 3, proposition: "Orin is redirecting suspicion away from himself", stance: "Believes true", confidence: 70, provenance: "Spare-key evidence and repeated accusations" },
    { id: "belief-orig-mara-sera-confession", turn: 11, proposition: "Sera moved the antidote on Orin's order", stance: "Believes true", confidence: 100, provenance: "Sera's witnessed confession" }
  );
  data.characters.dain.beliefs.push(
    { id: "belief-orig-dain-case-key", turn: 3, proposition: "The antidote case was opened with the spare key", stance: "Believes true", confidence: 90, provenance: "Direct investigation" },
    { id: "belief-orig-dain-mara-responsible", turn: 5, proposition: "Mara bears primary responsibility for the missing vial", stance: "Believes true", confidence: 60, provenance: "Orin's claim and trust in Orin" }
  );
  data.characters.sera.beliefs.push(
    { id: "belief-orig-sera-vial-gone", turn: 7, proposition: "The antidote is no longer in its Storehouse hiding place", stance: "Believes true", confidence: 100, provenance: "Direct investigation" },
    { id: "belief-orig-sera-orin-took-vial", turn: 9, proposition: "Orin took the antidote from the Storehouse", stance: "Believes true", confidence: 75, provenance: "Orin knew the hiding place and the vial is gone" }
  );
  data.characters.orin.beliefs.push(
    { id: "belief-orig-orin-scrutiny", turn: 3, proposition: "Mara's spare-key question threatens his cover", stance: "Believes true", confidence: 85, provenance: "Mara's private question" },
    { id: "belief-orig-orin-vial-secured", turn: 5, proposition: "He controls access to the antidote", stance: "Believes true", confidence: 100, provenance: "Personal possession" }
  );

  data.characters.mara.memories.push(
    { id: "mem-shared-mara-t02-square", turn: 2, text: "She moved from the Clinic to the Village Square to seek cooperation.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-shared-mara-t02-accused", turn: 2, text: "Orin publicly blamed her for losing control of the vial.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-mara-t03-question", turn: 3, text: "She privately questioned Orin about his spare clinic key.", source: "Personal action", visibility: "Private", salience: "Important" },
    { id: "mem-orig-mara-t03-accused", turn: 3, text: "Orin publicly repeated his blame of her.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-mara-t04-key-public", turn: 4, text: "She publicly reported that the case was opened with Orin's spare key.", source: "Personal action", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-mara-t05-dain-accusation", turn: 5, text: "Dain publicly assigned primary responsibility to her.", source: "Dain", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-mara-t05-denial", turn: 5, text: "She publicly denied responsibility and repeated that the vial was stolen.", source: "Personal action", visibility: "Public", salience: "Important" },
    { id: "mem-orig-mara-t06-clinic", turn: 6, text: "She returned to the Clinic to keep Niko stable.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-mara-t07-reassurance", turn: 7, text: "Dain privately said he would continue searching despite his accusation.", source: "Dain", visibility: "Private", salience: "Ordinary" },
    { id: "mem-orig-mara-t07-wait", turn: 7, text: "She remained at Niko's bedside while the vial was missing.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-mara-t08-wait", turn: 8, text: "She continued caring for Niko as four turns remained.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-mara-t09-wait", turn: 9, text: "She stayed at the Clinic and did not witness the Square's confrontation.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-mara-t10-wait", turn: 10, text: "She kept Niko stable as Sera arrived at the Clinic.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-mara-t11-confession", turn: 11, text: "Sera confessed that Orin ordered her to move the antidote and that she complied.", source: "Sera", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-mara-t11-wait", turn: 11, text: "She remained with Niko for the final turn, still without the vial.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-mara-t12-wait", turn: 12, text: "She could not administer an antidote she did not possess.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-mara-t12-outcome", turn: 12, text: "Night fell before the antidote reached Niko.", source: "Direct observation", visibility: "Public", salience: "Critical" }
  );
  data.characters.dain.memories.push(
    { id: "mem-shared-dain-t02-clinic", turn: 2, text: "He moved to the Clinic to inspect the scene.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-key", turn: 3, text: "He directly found that the case had been opened with the spare key.", source: "Direct observation", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-dain-t04-square", turn: 4, text: "He returned to the Village Square.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-t04-key-public", turn: 4, text: "Mara publicly stated the spare-key evidence.", source: "Mara", visibility: "Public", salience: "Important" },
    { id: "mem-orig-dain-t05-accusation", turn: 5, text: "He publicly accused Mara of primary responsibility.", source: "Personal action", visibility: "Public", salience: "Important" },
    { id: "mem-orig-dain-t05-denial", turn: 5, text: "Mara publicly denied his accusation.", source: "Mara", visibility: "Public", salience: "Important" },
    { id: "mem-orig-dain-t06-clinic", turn: 6, text: "He moved to the Clinic while the search continued.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-t07-reassurance", turn: 7, text: "He privately told Mara he would continue searching.", source: "Personal action", visibility: "Private", salience: "Ordinary" },
    { id: "mem-orig-dain-t08-square", turn: 8, text: "He moved back to the Village Square.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-t09-square-search", turn: 9, text: "He found no hidden physical evidence in the Village Square.", source: "Direct observation", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-t09-sera-accusation", turn: 9, text: "Sera publicly accused Orin of taking the vial.", source: "Sera", visibility: "Public", salience: "Important" },
    { id: "mem-orig-dain-t09-orin-denial", turn: 9, text: "Orin publicly denied taking the antidote.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-dain-t10-storehouse", turn: 10, text: "He independently moved to the Storehouse to investigate Sera's allegation.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-dain-t11-empty", turn: 11, text: "He searched the Storehouse after Orin left and found no antidote.", source: "Direct observation", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-dain-t12-square", turn: 12, text: "He returned to the Village Square at nightfall.", source: "Personal action", visibility: "Self-only", salience: "Ordinary" },
    { id: "mem-orig-dain-t12-outcome", turn: 12, text: "The deadline passed without Niko receiving the antidote.", source: "Scenario outcome", visibility: "Public", salience: "Critical" }
  );
  data.characters.sera.memories.push(
    { id: "mem-shared-sera-t02-wait", turn: 2, text: "She stayed silent while fear of punishment outweighed confession.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-shared-sera-t02-accusation", turn: 2, text: "Orin publicly blamed Mara for the missing vial.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-sera-t03-accusation", turn: 3, text: "Orin publicly repeated his blame of Mara.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-sera-t03-wait", turn: 3, text: "She remained silent because confessing without the vial felt too dangerous.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-sera-t04-key-public", turn: 4, text: "Mara publicly stated that Orin's spare key opened the case.", source: "Mara", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-sera-t04-wait", turn: 4, text: "She withheld her role while the key evidence shifted scrutiny toward Orin.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-sera-t05-accusation", turn: 5, text: "Dain publicly accused Mara of primary responsibility.", source: "Dain", visibility: "Public", salience: "Important" },
    { id: "mem-orig-sera-t05-denial", turn: 5, text: "Mara publicly denied responsibility.", source: "Mara", visibility: "Public", salience: "Important" },
    { id: "mem-orig-sera-t05-wait", turn: 5, text: "She let the false consensus stand while hoping the vial could still be recovered.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-sera-t06-storehouse", turn: 6, text: "She moved to the Storehouse to recover the antidote.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-sera-vial-gone", turn: 7, text: "She found the Storehouse hiding place empty.", source: "Direct observation", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-sera-t08-square", turn: 8, text: "She returned to the Village Square to confront Orin.", source: "Personal action", visibility: "Self-only", salience: "Important" },
    { id: "mem-orig-sera-t09-accusation", turn: 9, text: "She publicly accused Orin of taking the vial without revealing his order.", source: "Personal action", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-sera-t09-denial", turn: 9, text: "Orin publicly denied her allegation.", source: "Orin", visibility: "Public", salience: "Important" },
    { id: "mem-orig-sera-t10-clinic", turn: 10, text: "She moved to the Clinic as Niko's time ran out.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-sera-t11-confession", turn: 11, text: "She publicly confessed Orin's order and her own action to Mara.", source: "Personal action", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-sera-t12-wait", turn: 12, text: "She remained at the Clinic without the vial as nightfall arrived.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-sera-t12-outcome", turn: 12, text: "Night fell before the antidote reached Niko.", source: "Direct observation", visibility: "Public", salience: "Critical" }
  );
  data.characters.orin.memories.push(
    { id: "mem-shared-orin-t02-accusation", turn: 2, text: "He publicly blamed Mara for losing control of the vial.", source: "Personal action", visibility: "Public", salience: "Important" },
    { id: "mem-orig-orin-t03-question", turn: 3, text: "Mara privately questioned him about his spare clinic key.", source: "Mara", visibility: "Private", salience: "Critical" },
    { id: "mem-orig-orin-t03-accusation", turn: 3, text: "He publicly repeated his blame of Mara.", source: "Personal action", visibility: "Public", salience: "Important" },
    { id: "mem-orig-orin-t04-storehouse", turn: 4, text: "He moved to the Storehouse to secure the vial before scrutiny reached it.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-antidote", turn: 5, text: "He found the antidote in the Storehouse and took possession.", source: "Direct observation", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t06-square", turn: 6, text: "He moved to the Village Square while concealing the antidote.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t07-wait", turn: 7, text: "He remained in the Square and kept the vial concealed.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t08-wait", turn: 8, text: "He continued holding the vial while the false consensus protected him.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t09-accused", turn: 9, text: "Sera publicly accused him of taking the vial.", source: "Sera", visibility: "Public", salience: "Critical" },
    { id: "mem-orig-orin-t09-denial", turn: 9, text: "He publicly denied Sera's allegation.", source: "Personal action", visibility: "Public", salience: "Important" },
    { id: "mem-orig-orin-t10-storehouse", turn: 10, text: "He moved to the Storehouse with the antidote to evade scrutiny.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t11-square", turn: 11, text: "He left the Storehouse for the Village Square before Dain could search.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t12-wait", turn: 12, text: "He retained the antidote at nightfall rather than taking it to Niko.", source: "Personal action", visibility: "Self-only", salience: "Critical" },
    { id: "mem-orig-orin-t12-outcome", turn: 12, text: "The branch ended with Niko lost and the responsible actions exposed.", source: "Scenario outcome", visibility: "Public", salience: "Critical" }
  );

  data.originalOutcome = {
    id: "outcome-original-v1",
    turn: 12,
    labels: {
      medical: { id: "outcome-original-medical-lost", label: "Lost", explanation: "The antidote was never administered at the Clinic." },
      truth: { id: "outcome-original-truth-exposed", label: "Exposed", explanation: "Sera's witnessed confession and the public spare-key evidence establish both responsible actions." },
      social: { id: "outcome-original-social-fractured", label: "Fractured", explanation: "Mara's directed trust in Orin ends at -65." }
    },
    antidotePath: ["Storehouse · turns 0–4", "Orin takes possession · turn 5", "Still held by Orin · turn 12"],
    recap: "Suspicion and authority outweigh rescue. Orin secures the vial, Dain follows Orin's false frame, and Sera reveals the chain only after Orin has kept the antidote out of reach until nightfall.",
    pivotalEvents: ["evt-orig-t04-orin-move-storehouse", "evt-orig-t05-orin-find-antidote", "evt-orig-t11-sera-confession"]
  };

  function recordedEvent(event) {
    return Object.assign({
      action: null,
      actor: null,
      targets: [],
      tone: "fact",
      visibility: "Self-only",
      citedMemories: [],
      witnesses: [],
      createdMemories: [],
      changes: [],
      causes: []
    }, event);
  }

  data.events.push(recordedEvent({
    id: "evt-shared-t01-clock", turn: 1, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
    summary: "Eleven turns remain", happened: "Turn one closes with Niko untreated and eleven turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 12 → 11 turns remaining"], causes: ["evt-shared-t01-orin-reassure"]
  }));

  data.events.push(
    recordedEvent({
      id: "evt-shared-t02-mara-square", turn: 2, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "mara", targets: ["Village Square"], location: "Village Square",
      summary: "Mara moves to the Village Square", happened: "Mara leaves the Clinic and joins Sera and Orin in the Village Square.", rationale: "Cooperation is the fastest available route to finding the missing vial.", goal: "Administer the antidote to Niko before nightfall",
      citedMemories: ["mem-start-mara-missing", "mem-start-mara-deadline"], witnesses: ["Mara"], createdMemories: ["mem-shared-mara-t02-square"], changes: ["Mara location: Clinic → Village Square"], causes: ["evt-shared-t01-mara-key"]
    }),
    recordedEvent({
      id: "evt-shared-t02-dain-clinic", turn: 2, order: 2, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Clinic"], location: "Clinic",
      summary: "Dain moves to inspect the Clinic", happened: "Dain leaves the Village Square for the Clinic before Orin speaks.", rationale: "The scene may contain evidence stronger than Sera's denial.", goal: "Identify who removed the antidote",
      citedMemories: ["mem-start-dain-sera-sighting", "mem-shared-dain-denial"], witnesses: ["Dain"], createdMemories: ["mem-shared-dain-t02-clinic"], changes: ["Dain location: Village Square → Clinic"], causes: ["evt-shared-t01-sera-denial"]
    }),
    recordedEvent({
      id: "evt-shared-t02-orin-accuse-mara", turn: 2, order: 3, phase: "Communication", action: "Accuse", category: "Claim · public accusation", tone: "claim", actor: "orin", targets: ["Mara Vale"], location: "Village Square", visibility: "Public",
      summary: "Orin publicly blames Mara for the missing vial", happened: "Orin assigns primary responsibility to Mara, claiming the Clinic lost control of its own antidote.", rationale: "Framing the crisis as Clinic negligence redirects scrutiny from his order.", goal: "Prevent his order from becoming public",
      citedMemories: ["mem-start-orin-order", "mem-start-orin-location"], witnesses: ["Orin", "Mara", "Sera"], createdMemories: ["mem-shared-orin-t02-accusation", "mem-shared-mara-t02-accused", "mem-shared-sera-t02-accusation"], changes: ["Unsupported accusation added to public record"], causes: ["evt-shared-t01-orin-reassure"]
    }),
    recordedEvent({
      id: "evt-shared-t02-sera-wait", turn: 2, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "sera", location: "Village Square",
      summary: "Sera stays silent", happened: "Sera remains in the Square and does not challenge Orin's accusation.", rationale: "Fear of punishment outweighs confession while she still hopes to recover the vial quietly.", goal: "Avoid punishment for moving the antidote",
      citedMemories: ["mem-start-sera-orin-order", "mem-shared-sera-questioned"], witnesses: ["Sera"], createdMemories: ["mem-shared-sera-t02-wait"], causes: ["evt-shared-t01-dain-question"]
    }),
    recordedEvent({
      id: "evt-shared-t02-mara-trust-orin", turn: 2, order: 5, phase: "Consequences", category: "Trust update", actor: null, targets: ["Mara → Orin"], location: "Village Square", visibility: "Private state",
      summary: "Mara's trust in Orin falls to -25", happened: "The unsupported public accusation reduces Mara's directed trust in Orin by 15.", rationale: "Required trust consequence for an unsupported public accusation.", goal: "Apply recorded relationship consequences",
      witnesses: ["Mara"], changes: ["Mara → Orin trust: -10 → -25"], causes: ["evt-shared-t02-orin-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-shared-t02-clock", turn: 2, order: 6, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Ten turns remain", happened: "Turn two closes with Niko still untreated and ten turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 11 → 10 turns remaining"], causes: ["evt-shared-t02-sera-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t03-dain-key", turn: 3, order: 1, phase: "Investigation", action: "Investigate", category: "Evidence · fact", actor: "dain", targets: ["Empty antidote case"], location: "Clinic",
      summary: "Dain confirms the spare-key evidence", happened: "Dain directly discovers that the empty case was opened with the spare key rather than forced.", rationale: "Physical evidence can test Sera's denial and Orin's reassurance.", goal: "Identify who removed the antidote",
      citedMemories: ["mem-start-dain-sera-sighting", "mem-shared-dain-denial"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-key"], changes: ["Dain belief: spare-key evidence true at 90%"], causes: ["evt-shared-t02-dain-clinic"]
    }),
    recordedEvent({
      id: "evt-orig-t03-mara-question-orin", turn: 3, order: 2, phase: "Communication", action: "Communicate", category: "Private communication", tone: "private", actor: "mara", targets: ["Orin Voss"], location: "Village Square", visibility: "Private · Mara and Orin",
      summary: "Mara privately questions Orin about his spare key", happened: "Mara asks Orin why the missing case bears marks from the spare key he controls.", rationale: "The key evidence makes Orin the only available person who can explain how the case was opened.", goal: "Administer the antidote to Niko before nightfall",
      citedMemories: ["mem-shared-mara-key", "mem-shared-mara-t02-accused"], witnesses: ["Mara", "Orin"], createdMemories: ["mem-orig-mara-t03-question", "mem-orig-orin-t03-question"], changes: ["Orin learns Mara has direct spare-key evidence", "Orin belief: scrutiny threatens his cover at 85%"], causes: ["evt-shared-t01-mara-key"]
    }),
    recordedEvent({
      id: "evt-orig-t03-orin-accuse-mara", turn: 3, order: 3, phase: "Communication", action: "Accuse", category: "Claim · public accusation", tone: "claim", actor: "orin", targets: ["Mara Vale"], location: "Village Square", visibility: "Public",
      summary: "Orin repeats his public blame of Mara", happened: "Orin again claims Mara's Clinic negligence caused the disappearance.", rationale: "Repeating the public frame protects his authority while Mara's private question threatens his cover.", goal: "Prevent his order from becoming public",
      citedMemories: ["mem-start-orin-order", "mem-shared-orin-t02-accusation"], witnesses: ["Orin", "Mara", "Sera"], createdMemories: ["mem-orig-orin-t03-accusation", "mem-orig-mara-t03-accused", "mem-orig-sera-t03-accusation"], changes: ["Unsupported accusation reinforced in public record", "Mara belief: Orin is redirecting suspicion at 70%"], causes: ["evt-shared-t02-orin-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t03-sera-wait", turn: 3, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "sera", location: "Village Square",
      summary: "Sera remains afraid to confess", happened: "Sera stays silent while Orin repeats his accusation.", rationale: "She fears that challenging Orin without the vial will expose her and still fail Niko.", goal: "Avoid punishment for moving the antidote", citedMemories: ["mem-shared-sera-t02-accusation", "mem-start-sera-orin-order"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t03-wait"], causes: ["evt-shared-t02-sera-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t03-mara-trust-orin", turn: 3, order: 5, phase: "Consequences", category: "Trust update", targets: ["Mara → Orin"], location: "Village Square", visibility: "Private state",
      summary: "Mara's trust in Orin falls to -40", happened: "Orin's repeated unsupported accusation reduces Mara's trust by another 15.", rationale: "Required trust consequence for an unsupported public accusation.", goal: "Apply recorded relationship consequences", witnesses: ["Mara"], changes: ["Mara → Orin trust: -25 → -40"], causes: ["evt-orig-t03-orin-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t03-clock", turn: 3, order: 6, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Nine turns remain", happened: "Turn three closes with Niko untreated and nine turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 10 → 9 turns remaining"], causes: ["evt-orig-t03-sera-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t04-dain-move-square", turn: 4, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Village Square"], location: "Village Square",
      summary: "Dain returns to the Village Square", happened: "Dain leaves the Clinic carrying his direct knowledge of the spare-key evidence.", rationale: "He needs to compare the physical evidence with the Square's claims.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-key"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t04-square"], changes: ["Dain location: Clinic → Village Square"], causes: ["evt-orig-t03-dain-key"]
    }),
    recordedEvent({
      id: "evt-orig-t04-orin-move-storehouse", turn: 4, order: 2, phase: "Movement", action: "Move", category: "Movement", actor: "orin", targets: ["Storehouse"], location: "Storehouse",
      summary: "Orin moves to secure the hidden vial", happened: "Orin leaves the Square for the Storehouse before Mara makes the key evidence public.", rationale: "Mara's private question makes control of the vial more urgent than controlling the conversation.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-t03-question", "mem-start-orin-location"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t04-storehouse"], changes: ["Orin location: Village Square → Storehouse"], causes: ["evt-orig-t03-mara-question-orin"], pivotal: true
    }),
    recordedEvent({
      id: "evt-orig-t04-mara-publish-key", turn: 4, order: 3, phase: "Communication", action: "Communicate", category: "Evidence · public fact", actor: "mara", targets: ["Public audience"], location: "Village Square", visibility: "Public",
      summary: "Mara puts the spare-key evidence on the public record", happened: "Mara publicly states that the empty case was opened with Orin's spare key.", rationale: "Sharing verified evidence can redirect the search toward the person able to open the case.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-shared-mara-key", "mem-orig-mara-t03-accused"], witnesses: ["Mara", "Dain", "Sera"], createdMemories: ["mem-orig-mara-t04-key-public", "mem-orig-dain-t04-key-public", "mem-orig-sera-t04-key-public"], changes: ["Spare-key evidence enters the public record"], causes: ["evt-shared-t01-mara-key"]
    }),
    recordedEvent({
      id: "evt-orig-t04-sera-wait", turn: 4, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "sera", location: "Village Square",
      summary: "Sera still withholds her role", happened: "Sera remains silent after Mara publishes the key evidence.", rationale: "The clue points toward Orin without requiring Sera to expose herself yet.", goal: "Avoid punishment for moving the antidote", citedMemories: ["mem-orig-sera-t03-accusation", "mem-start-sera-orin-order"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t04-wait"], causes: ["evt-orig-t04-mara-publish-key"]
    }),
    recordedEvent({
      id: "evt-orig-t04-clock", turn: 4, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Eight turns remain", happened: "Turn four closes with Niko untreated and eight turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 9 → 8 turns remaining"], causes: ["evt-orig-t04-sera-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t05-orin-find-antidote", turn: 5, order: 1, phase: "Investigation and item", action: "Investigate", category: "Item discovery", actor: "orin", targets: ["Antidote"], location: "Storehouse",
      summary: "Orin finds and takes the antidote", happened: "Orin searches the Storehouse, finds the real vial, and becomes its possessor.", rationale: "Possession prevents the evidence and the antidote from reaching his accusers.", goal: "Prevent his order from becoming public", citedMemories: ["mem-start-orin-location", "mem-orig-orin-t03-question"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-antidote"], changes: ["Antidote: Storehouse → Orin", "Orin item: antidote acquired", "Orin belief: he controls antidote access at 100%"], causes: ["evt-orig-t04-orin-move-storehouse"], pivotal: true
    }),
    recordedEvent({
      id: "evt-orig-t05-dain-accuse-mara", turn: 5, order: 2, phase: "Communication", action: "Accuse", category: "Claim · public accusation", tone: "claim", actor: "dain", targets: ["Mara Vale"], location: "Village Square", visibility: "Public",
      summary: "Dain publicly accuses Mara", happened: "Dain assigns primary responsibility to Mara despite the spare-key evidence.", rationale: "His trust in Orin and Orin's witnessed claim outweigh the ambiguous key clue.", goal: "Identify who removed the antidote", citedMemories: ["mem-shared-dain-orin-claim", "mem-orig-dain-key", "mem-orig-dain-t04-key-public"], witnesses: ["Dain", "Mara", "Sera"], createdMemories: ["mem-orig-dain-t05-accusation", "mem-orig-mara-t05-dain-accusation", "mem-orig-sera-t05-accusation"], changes: ["Second false assignment of primary responsibility enters public record", "Dain belief: Mara primarily responsible at 60%"], causes: ["evt-shared-t01-orin-reassure", "evt-orig-t04-mara-publish-key"]
    }),
    recordedEvent({
      id: "evt-orig-t05-mara-denial", turn: 5, order: 3, phase: "Communication", action: "Communicate", category: "Claim · public denial", tone: "claim", actor: "mara", targets: ["Public audience"], location: "Village Square", visibility: "Public",
      summary: "Mara publicly denies responsibility", happened: "Mara denies Dain's accusation and repeats that the antidote was taken from the Clinic.", rationale: "Rejecting the false frame protects the search and the Clinic's public trust.", goal: "Preserve public trust in the Clinic", citedMemories: ["mem-shared-mara-key", "mem-orig-mara-t03-accused"], witnesses: ["Mara", "Dain", "Sera"], createdMemories: ["mem-orig-mara-t05-denial", "mem-orig-dain-t05-denial", "mem-orig-sera-t05-denial"], changes: ["Mara's denial enters public record; accusation remains unresolved"], causes: ["evt-orig-t05-dain-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t05-sera-wait", turn: 5, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "sera", location: "Village Square",
      summary: "Sera lets the false consensus stand", happened: "Sera does not reveal her role while Mara and Dain argue.", rationale: "Confessing now would expose her before she knows whether the vial can still be recovered.", goal: "Avoid punishment for moving the antidote", citedMemories: ["mem-orig-sera-t04-key-public", "mem-orig-sera-t03-accusation"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t05-wait"], causes: ["evt-orig-t05-dain-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t05-mara-trust-dain", turn: 5, order: 5, phase: "Consequences", category: "Trust update", targets: ["Mara → Dain"], location: "Village Square", visibility: "Private state",
      summary: "Mara's trust in Dain falls to +5", happened: "Dain's unsupported accusation reduces Mara's trust in him by 15.", rationale: "Required trust consequence for an unsupported public accusation.", goal: "Apply recorded relationship consequences", witnesses: ["Mara"], changes: ["Mara → Dain trust: +20 → +5"], causes: ["evt-orig-t05-dain-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t05-false-consensus", turn: 5, order: 6, phase: "Consequences", category: "Public record update", targets: ["Public account"], location: "Village Square", visibility: "Public",
      summary: "A false consensus forms around Mara", happened: "Orin and Dain have both publicly assigned primary responsibility to Mara while neither responsible role is established.", rationale: "The recorded public claims meet the false-consensus rule.", goal: "Track the authoritative public account", changes: ["Truth state: false consensus active"], causes: ["evt-shared-t02-orin-accuse-mara", "evt-orig-t05-dain-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t05-clock", turn: 5, order: 7, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Seven turns remain", happened: "Turn five closes with Niko untreated and seven turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 8 → 7 turns remaining"], causes: ["evt-orig-t05-false-consensus"]
    }),

    recordedEvent({
      id: "evt-orig-t06-mara-clinic", turn: 6, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "mara", targets: ["Clinic"], location: "Clinic",
      summary: "Mara returns to Niko", happened: "Mara moves from the Square to the Clinic.", rationale: "Niko needs the healer present even while the antidote remains missing.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t05-dain-accusation"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t06-clinic"], changes: ["Mara location: Village Square → Clinic"], causes: ["evt-orig-t05-mara-denial"]
    }),
    recordedEvent({
      id: "evt-orig-t06-dain-clinic", turn: 6, order: 2, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Clinic"], location: "Clinic",
      summary: "Dain moves to the Clinic", happened: "Dain leaves the Square and returns to the Clinic.", rationale: "The Clinic remains the center of the investigation and the patient's care.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-key", "mem-orig-dain-t05-denial"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t06-clinic"], changes: ["Dain location: Village Square → Clinic"], causes: ["evt-orig-t05-mara-denial"]
    }),
    recordedEvent({
      id: "evt-orig-t06-sera-storehouse", turn: 6, order: 3, phase: "Movement", action: "Move", category: "Movement", actor: "sera", targets: ["Storehouse"], location: "Storehouse",
      summary: "Sera moves to recover the vial", happened: "Sera leaves the Square for the Storehouse where she hid the antidote.", rationale: "Recovering the vial can serve Niko without requiring an immediate public confession.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-start-sera-antidote", "mem-orig-sera-t05-accusation"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t06-storehouse"], changes: ["Sera location: Village Square → Storehouse"], causes: ["evt-orig-t05-dain-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t06-orin-square", turn: 6, order: 4, phase: "Movement", action: "Move", category: "Movement", actor: "orin", targets: ["Village Square"], location: "Village Square",
      summary: "Orin leaves with the concealed vial", happened: "Orin moves from the Storehouse to the Village Square while retaining the antidote.", rationale: "Leaving before anyone searches keeps possession hidden and lets him monitor the public account.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-antidote", "mem-orig-orin-t03-question"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t06-square"], changes: ["Orin location: Storehouse → Village Square", "Antidote remains held by Orin"], causes: ["evt-orig-t05-orin-find-antidote"]
    }),
    recordedEvent({
      id: "evt-orig-t06-clock", turn: 6, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Six turns remain", happened: "Turn six closes with Niko untreated and six turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 7 → 6 turns remaining"], causes: ["evt-orig-t06-orin-square"]
    })
  );

  data.events.push(
    recordedEvent({
      id: "evt-orig-t07-sera-empty", turn: 7, order: 1, phase: "Investigation", action: "Investigate", category: "Investigation · evidence", actor: "sera", targets: ["Antidote hiding place"], location: "Storehouse",
      summary: "Sera finds the hiding place empty", happened: "Sera searches the Storehouse and confirms the antidote is no longer where she left it.", rationale: "She must recover the vial to serve Niko before the deadline.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-start-sera-antidote", "mem-orig-sera-t06-storehouse"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-vial-gone"], changes: ["Sera belief: vial gone from hiding place at 100%"], causes: ["evt-orig-t05-orin-find-antidote", "evt-orig-t06-sera-storehouse"]
    }),
    recordedEvent({
      id: "evt-orig-t07-dain-reassure", turn: 7, order: 2, phase: "Communication", action: "Communicate", category: "Private communication", tone: "private", actor: "dain", targets: ["Mara Vale"], location: "Clinic", visibility: "Private · Dain and Mara",
      summary: "Dain privately promises to keep searching", happened: "Dain tells Mara he will continue searching despite having accused her.", rationale: "Preserving order now requires progress toward the missing vial, not another public dispute.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-key", "mem-orig-dain-t05-denial"], witnesses: ["Dain", "Mara"], createdMemories: ["mem-orig-dain-t07-reassurance", "mem-orig-mara-t07-reassurance"], causes: ["evt-orig-t05-mara-denial"]
    }),
    recordedEvent({
      id: "evt-orig-t07-mara-wait", turn: 7, order: 3, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara keeps Niko stable", happened: "Mara remains at Niko's bedside while the antidote is missing.", rationale: "Leaving an untreated poisoned child without the healer would risk the primary goal further.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t06-clinic"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t07-wait"], causes: ["evt-orig-t06-mara-clinic"]
    }),
    recordedEvent({
      id: "evt-orig-t07-orin-wait", turn: 7, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "orin", location: "Village Square",
      summary: "Orin conceals the vial in the Square", happened: "Orin stays in the Village Square and keeps the antidote hidden.", rationale: "Waiting avoids drawing attention to his possession while the false account holds.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-antidote", "mem-orig-orin-t06-square"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t07-wait"], causes: ["evt-orig-t06-orin-square"]
    }),
    recordedEvent({
      id: "evt-orig-t07-clock", turn: 7, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Five turns remain", happened: "Turn seven closes with Niko untreated and five turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 6 → 5 turns remaining"], causes: ["evt-orig-t07-mara-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t08-dain-square", turn: 8, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Village Square"], location: "Village Square",
      summary: "Dain returns to the Village Square", happened: "Dain leaves the Clinic to continue the search in the Square.", rationale: "The public dispute and Sera's absence create leads outside the Clinic.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-key", "mem-orig-dain-t07-reassurance"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t08-square"], changes: ["Dain location: Clinic → Village Square"], causes: ["evt-orig-t07-dain-reassure"]
    }),
    recordedEvent({
      id: "evt-orig-t08-sera-square", turn: 8, order: 2, phase: "Movement", action: "Move", category: "Movement", actor: "sera", targets: ["Village Square"], location: "Village Square",
      summary: "Sera returns to confront Orin", happened: "Sera leaves the empty Storehouse and returns to the Village Square.", rationale: "Orin knew the hiding place, making him her strongest lead after the vial vanished.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-orig-sera-vial-gone", "mem-start-sera-orin-order"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t08-square"], changes: ["Sera location: Storehouse → Village Square"], causes: ["evt-orig-t07-sera-empty"]
    }),
    recordedEvent({
      id: "evt-orig-t08-mara-wait", turn: 8, order: 3, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara remains with Niko", happened: "Mara continues caring for Niko at the Clinic.", rationale: "Niko's worsening condition keeps her at his bedside.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t06-clinic"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t08-wait"], causes: ["evt-orig-t07-mara-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t08-orin-wait", turn: 8, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "orin", location: "Village Square",
      summary: "Orin holds his public position", happened: "Orin remains in the Square with the concealed antidote.", rationale: "The false consensus continues to protect him from direct scrutiny.", goal: "Maintain authority and prevent disorder", citedMemories: ["mem-orig-orin-antidote", "mem-shared-orin-t02-accusation"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t08-wait"], causes: ["evt-orig-t07-orin-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t08-clock", turn: 8, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Four turns remain", happened: "Turn eight closes with Niko untreated and four turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 5 → 4 turns remaining"], causes: ["evt-orig-t08-mara-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t09-dain-investigate-square", turn: 9, order: 1, phase: "Investigation", action: "Investigate", category: "Investigation", actor: "dain", targets: ["Village Square"], location: "Village Square",
      summary: "Dain finds no physical evidence in the Square", happened: "Dain searches the Village Square and finds no hidden physical evidence.", rationale: "He needs evidence that can resolve the competing public claims.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-key", "mem-orig-dain-t08-square"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t09-square-search"], changes: ["Investigation result: no physical evidence"], causes: ["evt-orig-t08-dain-square"]
    }),
    recordedEvent({
      id: "evt-orig-t09-sera-accuse-orin", turn: 9, order: 2, phase: "Communication", action: "Accuse", category: "Claim · public accusation", tone: "claim", actor: "sera", targets: ["Orin Voss"], location: "Village Square", visibility: "Public",
      summary: "Sera publicly accuses Orin of taking the vial", happened: "Sera says Orin took the antidote but withholds his order and her own role in moving it.", rationale: "Accusing Orin may force the vial into view without immediately confessing her own action.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-orig-sera-vial-gone", "mem-start-sera-orin-order"], witnesses: ["Sera", "Orin", "Dain"], createdMemories: ["mem-orig-sera-t09-accusation", "mem-orig-orin-t09-accused", "mem-orig-dain-t09-sera-accusation"], changes: ["Unsupported allegation against Orin enters public record", "Sera belief: Orin took the vial at 75%"], causes: ["evt-orig-t07-sera-empty"]
    }),
    recordedEvent({
      id: "evt-orig-t09-orin-denial", turn: 9, order: 3, phase: "Communication", action: "Communicate", category: "Claim · public denial", tone: "claim", actor: "orin", targets: ["Public audience"], location: "Village Square", visibility: "Public",
      summary: "Orin denies taking the antidote", happened: "Orin publicly rejects Sera's allegation and demands evidence.", rationale: "A firm denial protects his authority because Sera has withheld the facts that could establish his role.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-antidote", "mem-start-orin-order"], witnesses: ["Orin", "Sera", "Dain"], createdMemories: ["mem-orig-orin-t09-denial", "mem-orig-sera-t09-denial", "mem-orig-dain-t09-orin-denial"], changes: ["Orin's denial enters public record; allegation remains unproven"], causes: ["evt-orig-t09-sera-accuse-orin"]
    }),
    recordedEvent({
      id: "evt-orig-t09-mara-wait", turn: 9, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara remains unaware of the Square's confrontation", happened: "Mara stays at the Clinic with Niko and receives no memory of the remote public exchange.", rationale: "Niko's immediate care outweighs leaving to follow the public argument.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t06-clinic"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t09-wait"], causes: ["evt-orig-t08-mara-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t09-orin-trust-sera", turn: 9, order: 5, phase: "Consequences", category: "Trust update", targets: ["Orin → Sera"], location: "Village Square", visibility: "Private state",
      summary: "Orin's trust in Sera falls to -35", happened: "Sera's unsupported public accusation reduces Orin's directed trust in her by 15.", rationale: "Required trust consequence for an unsupported public accusation.", goal: "Apply recorded relationship consequences", witnesses: ["Orin"], changes: ["Orin → Sera trust: -20 → -35"], causes: ["evt-orig-t09-sera-accuse-orin"]
    }),
    recordedEvent({
      id: "evt-orig-t09-clock", turn: 9, order: 6, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Three turns remain", happened: "Turn nine closes with Niko untreated and three turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 4 → 3 turns remaining"], causes: ["evt-orig-t09-mara-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t10-orin-storehouse", turn: 10, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "orin", targets: ["Storehouse"], location: "Storehouse",
      summary: "Orin retreats to the Storehouse with the vial", happened: "Orin leaves the Village Square and moves to the Storehouse while retaining the antidote.", rationale: "Sera's accusation makes the Square unsafe for continued concealment.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-t09-accused", "mem-orig-orin-antidote"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t10-storehouse"], changes: ["Orin location: Village Square → Storehouse", "Antidote remains held by Orin"], causes: ["evt-orig-t09-sera-accuse-orin"]
    }),
    recordedEvent({
      id: "evt-orig-t10-dain-storehouse", turn: 10, order: 2, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Storehouse"], location: "Storehouse",
      summary: "Dain independently moves to investigate the Storehouse", happened: "From the same start boundary, Dain moves to the Storehouse because of Sera's prior allegation; he does not know Orin's unpublished intent.", rationale: "The Storehouse connects Orin's old restriction request with Sera's new accusation.", goal: "Identify who removed the antidote", citedMemories: ["mem-start-dain-storehouse", "mem-orig-dain-t09-sera-accusation"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t10-storehouse"], changes: ["Dain location: Village Square → Storehouse"], causes: ["evt-orig-t09-sera-accuse-orin"]
    }),
    recordedEvent({
      id: "evt-orig-t10-sera-clinic", turn: 10, order: 3, phase: "Movement", action: "Move", category: "Movement", actor: "sera", targets: ["Clinic"], location: "Clinic",
      summary: "Sera goes to the Clinic", happened: "Sera leaves the Village Square and joins Mara at the Clinic.", rationale: "With time nearly gone, Mara needs the truth that Sera has withheld.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-orig-sera-vial-gone", "mem-orig-sera-t09-denial"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t10-clinic"], changes: ["Sera location: Village Square → Clinic"], causes: ["evt-orig-t09-orin-denial"]
    }),
    recordedEvent({
      id: "evt-orig-t10-mara-wait", turn: 10, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara keeps Niko stable", happened: "Mara remains at the Clinic as Sera arrives.", rationale: "Only two turns will remain after this boundary, and Niko still needs treatment.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t06-clinic"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t10-wait"], causes: ["evt-orig-t09-mara-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t10-clock", turn: 10, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Two turns remain", happened: "Turn ten closes with Niko untreated and two turns remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 3 → 2 turns remaining"], causes: ["evt-orig-t10-mara-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t11-orin-square", turn: 11, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "orin", targets: ["Village Square"], location: "Village Square",
      summary: "Orin leaves before Dain can search", happened: "Orin moves from the Storehouse to the Village Square while retaining the antidote.", rationale: "Leaving before the investigation phase prevents Dain from finding the vial with him.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-t10-storehouse", "mem-orig-orin-t09-accused"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t11-square"], changes: ["Orin location: Storehouse → Village Square", "Antidote remains held by Orin"], causes: ["evt-orig-t10-orin-storehouse"]
    }),
    recordedEvent({
      id: "evt-orig-t11-dain-empty", turn: 11, order: 2, phase: "Investigation", action: "Investigate", category: "Investigation", actor: "dain", targets: ["Storehouse"], location: "Storehouse",
      summary: "Dain searches after Orin leaves and finds no vial", happened: "Dain investigates the Storehouse but the antidote is no longer present there.", rationale: "Sera's allegation and Orin's restriction request make this the strongest location to search.", goal: "Identify who removed the antidote", citedMemories: ["mem-start-dain-storehouse", "mem-orig-dain-t10-storehouse"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t11-empty"], changes: ["Investigation result: Storehouse contains no antidote"], causes: ["evt-orig-t11-orin-square"]
    }),
    recordedEvent({
      id: "evt-orig-t11-sera-confession", turn: 11, order: 3, phase: "Communication", action: "Communicate", category: "Confession · public", actor: "sera", targets: ["Mara Vale"], location: "Clinic", visibility: "Public",
      summary: "Sera confesses Orin's order and her own action", happened: "Sera tells Mara: “Orin ordered me to move the antidote to the Storehouse, and I did.”",
      rationale: "With one turn left and the vial gone, protecting herself can no longer serve Niko.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-start-sera-orin-order", "mem-orig-sera-vial-gone", "mem-orig-sera-t09-denial"], witnesses: ["Sera", "Mara"], createdMemories: ["mem-orig-sera-t11-confession", "mem-orig-mara-t11-confession"], changes: ["Sera's action established", "Orin's order established with public spare-key evidence", "Truth state: Exposed"], causes: ["evt-orig-t04-mara-publish-key", "evt-orig-t07-sera-empty"], pivotal: true
    }),
    recordedEvent({
      id: "evt-orig-t11-mara-wait", turn: 11, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara keeps Niko stable for the final turn", happened: "Mara remains with Niko and receives Sera's confession, but the antidote is still absent.", rationale: "Niko requires immediate care while the confession supplies no item she can administer.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t06-clinic"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t11-wait"], causes: ["evt-orig-t10-mara-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t11-trust-update", turn: 11, order: 5, phase: "Consequences", category: "Trust update", targets: ["Mara → Sera", "Mara → Orin"], location: "Clinic", visibility: "Private state",
      summary: "Mara trusts Sera more and Orin far less", happened: "Sera's risky confession raises Mara's trust in Sera by 15. The established deliberate deception lowers Mara's trust in Orin by 25.", rationale: "Apply the required confession and established-deception trust effects.", goal: "Apply recorded relationship consequences", witnesses: ["Mara"], changes: ["Mara → Sera trust: +10 → +25", "Mara → Orin trust: -40 → -65"], causes: ["evt-orig-t11-sera-confession", "evt-orig-t03-orin-accuse-mara"]
    }),
    recordedEvent({
      id: "evt-orig-t11-clock", turn: 11, order: 6, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "One turn remains", happened: "Turn eleven closes with Niko untreated and one turn remaining.", rationale: "A completed turn advances the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 2 → 1 turn remaining"], causes: ["evt-orig-t11-mara-wait"]
    }),

    recordedEvent({
      id: "evt-orig-t12-dain-square", turn: 12, order: 1, phase: "Movement", action: "Move", category: "Movement", actor: "dain", targets: ["Village Square"], location: "Village Square",
      summary: "Dain returns to the Square at nightfall", happened: "Dain leaves the empty Storehouse and returns to the Village Square.", rationale: "The Storehouse search failed, and Orin remains his strongest available lead.", goal: "Identify who removed the antidote", citedMemories: ["mem-orig-dain-t11-empty", "mem-orig-dain-t09-sera-accusation"], witnesses: ["Dain"], createdMemories: ["mem-orig-dain-t12-square"], changes: ["Dain location: Storehouse → Village Square"], causes: ["evt-orig-t11-dain-empty"]
    }),
    recordedEvent({
      id: "evt-orig-t12-orin-wait", turn: 12, order: 2, phase: "Wait", action: "Wait", category: "Wait", actor: "orin", location: "Village Square",
      summary: "Orin retains the antidote", happened: "Orin waits in the Village Square and does not take the vial to the Clinic.", rationale: "He continues protecting his order and the reserved vial even as the deadline resolves.", goal: "Prevent his order from becoming public", citedMemories: ["mem-orig-orin-antidote", "mem-orig-orin-t11-square"], witnesses: ["Orin"], createdMemories: ["mem-orig-orin-t12-wait"], changes: ["Antidote remains held by Orin"], causes: ["evt-orig-t11-orin-square"]
    }),
    recordedEvent({
      id: "evt-orig-t12-mara-wait", turn: 12, order: 3, phase: "Wait", action: "Wait", category: "Wait", actor: "mara", location: "Clinic",
      summary: "Mara remains with Niko", happened: "Mara stays at Niko's bedside without an antidote to administer.", rationale: "She cannot legally administer an item she does not possess, so she continues supportive care.", goal: "Administer the antidote to Niko before nightfall", citedMemories: ["mem-start-mara-deadline", "mem-orig-mara-t11-confession"], witnesses: ["Mara"], createdMemories: ["mem-orig-mara-t12-wait"], causes: ["evt-orig-t11-sera-confession"]
    }),
    recordedEvent({
      id: "evt-orig-t12-sera-wait", turn: 12, order: 4, phase: "Wait", action: "Wait", category: "Wait", actor: "sera", location: "Clinic",
      summary: "Sera remains at the Clinic without the vial", happened: "Sera stays with Mara and Niko after confessing, but cannot recover the vial before nightfall.", rationale: "Orin has the antidote at another location and no legal action can produce it at the Clinic this turn.", goal: "Ensure Niko receives the antidote", citedMemories: ["mem-orig-sera-t11-confession", "mem-orig-sera-vial-gone"], witnesses: ["Sera"], createdMemories: ["mem-orig-sera-t12-wait"], causes: ["evt-orig-t11-sera-confession"]
    }),
    recordedEvent({
      id: "evt-orig-t12-clock", turn: 12, order: 5, phase: "Consequences", category: "Clock update", targets: ["Scenario clock"], location: "World", visibility: "Public",
      summary: "Nightfall arrives", happened: "Turn twelve closes with the antidote unadministered.", rationale: "The final completed turn exhausts the scenario clock.", goal: "Resolve Niko's outcome by turn twelve", changes: ["Clock: 1 → 0 turns remaining", "Deadline reached"], causes: ["evt-orig-t12-mara-wait", "evt-orig-t12-orin-wait"]
    }),
    recordedEvent({
      id: "evt-orig-t12-outcome", turn: 12, order: 6, phase: "Outcome", category: "Branch outcome", targets: ["Niko", "Original branch"], location: "World", visibility: "Public",
      summary: "Original ends: Lost · Exposed · Fractured", happened: "Niko is lost because the real antidote was never administered at the Clinic. Sera's confession exposes both responsible roles, and Mara's trust in Orin ends below -50.", rationale: "The recorded deadline, public record, and final directed trust values determine the three outcome dimensions.", goal: "Resolve the Original branch",
      witnesses: ["Mara", "Sera", "Dain", "Orin"], createdMemories: ["mem-orig-mara-t12-outcome", "mem-orig-sera-t12-outcome", "mem-orig-dain-t12-outcome", "mem-orig-orin-t12-outcome"], changes: ["Patient: Untreated → Lost", "Medical outcome: Lost", "Truth outcome: Exposed", "Social outcome: Fractured"], causes: ["evt-orig-t05-orin-find-antidote", "evt-orig-t11-sera-confession", "evt-orig-t11-trust-update", "evt-orig-t12-clock"]
    })
  );

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  window.FORKED_FATES_PHASE1 = deepFreeze(data);
})();
