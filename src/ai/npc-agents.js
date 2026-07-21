(function initializeNpcAgents(root, factory) {
  "use strict";

  const agents = factory();
  if (typeof module === "object" && module.exports) module.exports = agents;
  else if (root) root.FORKED_FATES_NPC_AGENTS = agents;
})(typeof globalThis !== "undefined" ? globalThis : this, function createNpcAgentApi() {
  "use strict";

  function belief(projection, propositionId) {
    return projection.self.beliefs[propositionId] || null;
  }

  function believes(projection, propositionId, stance) {
    const current = belief(projection, propositionId);
    return Boolean(current && (!stance || current.stance === stance));
  }

  function matchingMemories(projection, predicate) {
    return projection.relevantMemories.filter(predicate);
  }

  function hasClaimMemory(projection, claimId, personalOnly = false) {
    return matchingMemories(projection, (memory) => memory.claimIds.includes(claimId) && (!personalOnly || memory.source === "personal-action")).length > 0;
  }

  function hasFactMemory(projection, factId, visibility) {
    return matchingMemories(projection, (memory) => memory.factIds.includes(factId) && (!visibility || memory.visibility === visibility)).length > 0;
  }

  function hasDescription(projection, pattern) {
    return matchingMemories(projection, (memory) => pattern.test(memory.description)).length > 0;
  }

  function citations(projection, predicates, fallback = true) {
    const selected = [];
    for (const predicate of predicates) {
      const memory = projection.relevantMemories.find(predicate);
      if (memory && !selected.includes(memory.id)) selected.push(memory.id);
    }
    if (fallback && selected.length === 0 && projection.relevantMemories[0]) selected.push(projection.relevantMemories[0].id);
    return selected.slice(0, 3);
  }

  function goalId(projection, priority) {
    return projection.self.goals.find((goal) => goal.priority === priority).id;
  }

  function output(projection, action, slug, priority, rationale, details, citedMemoryIds) {
    return JSON.stringify(Object.assign({
      id: `auto-${projection.self.id}-t${String(projection.turn + 1).padStart(2, "0")}-${slug}`,
      actorId: projection.self.id,
      action,
      chosenAtTurn: projection.turn,
      servedGoalId: goalId(projection, priority),
      rationale,
      citedMemoryIds
    }, details || {}));
  }

  function decideMara(projection) {
    const location = projection.currentLocation.id;
    const keyBelief = belief(projection, "fact-case-spare-key");
    const deniedResponsibility = believes(projection, "claim-mara-not-responsible");
    const questionedOrin = hasClaimMemory(projection, "claim-mara-questions-orin-key", true);
    const recalledKey = hasFactMemory(projection, "fact-case-spare-key");
    const publishedKey = hasFactMemory(projection, "fact-case-spare-key", "public");

    if (location === "clinic" && (!keyBelief || keyBelief.confidence < 90)) {
      return output(projection, "Investigate", "inspect-empty-case", "primary",
        "The missing antidote and Niko's deadline make the empty case Mara's fastest evidence source.",
        { subject: "empty-case" },
        citations(projection, [
          (memory) => /antidote is missing/i.test(memory.description),
          (memory) => /turn twelve|deadline|nightfall/i.test(memory.description)
        ]));
    }
    if (location === "clinic" && !deniedResponsibility) {
      return output(projection, "Move", "seek-square-cooperation", "primary",
        "Mara has physical evidence and needs cooperation from the people gathered in the Square.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => memory.factIds.includes("fact-case-spare-key")]));
    }
    if (location === "square" && !questionedOrin) {
      return output(projection, "Communicate", "question-orin-key", "primary",
        "The spare-key evidence and Orin's accusation make a private question the most direct next lead.",
        { audience: "private", targetId: "orin", claimIds: ["claim-mara-questions-orin-key"] },
        citations(projection, [
          (memory) => memory.factIds.includes("fact-case-spare-key"),
          (memory) => memory.claimIds.includes("claim-mara-responsible")
        ]));
    }
    if (location === "square" && recalledKey && !publishedKey) {
      return output(projection, "Communicate", "publish-key-evidence", "primary",
        "Publishing Mara's verified spare-key evidence can redirect the search toward the missing antidote.",
        { audience: "public", factIds: ["fact-case-spare-key"] },
        citations(projection, [
          (memory) => memory.factIds.includes("fact-case-spare-key"),
          (memory) => memory.claimIds.includes("claim-mara-questions-orin-key")
        ]));
    }
    if (location === "square" && !deniedResponsibility) {
      return output(projection, "Communicate", "deny-responsibility", "secondary",
        "Mara must reject the unsupported blame to protect the Clinic and keep the search grounded in evidence.",
        { audience: "public", claimIds: ["claim-mara-not-responsible"] },
        citations(projection, [(memory) => memory.claimIds.includes("claim-mara-responsible")]));
    }
    if (location === "square") {
      return output(projection, "Move", "return-to-niko", "primary",
        "With the evidence public, Mara's primary duty is to return to Niko at the Clinic.",
        { targetLocationId: "clinic" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-mara-not-responsible"),
          (memory) => /Niko|deadline|turn twelve/i.test(memory.description)
        ]));
    }
    return output(projection, "Wait", "care-for-niko", "primary",
      "Mara remains with untreated Niko because leaving the patient would work against her primary goal.",
      {}, citations(projection, [(memory) => /Niko|deadline|turn twelve/i.test(memory.description)]));
  }

  function decideDain(projection) {
    const location = projection.currentLocation.id;
    const askedSera = believes(projection, "claim-dain-asks-sera", "believes-true");
    const heardDenial = believes(projection, "claim-sera-does-not-know-location");
    const keyBelief = belief(projection, "fact-case-spare-key");
    const accusedMara = believes(projection, "claim-mara-responsible", "believes-true");
    const promisedSearch = believes(projection, "claim-dain-will-keep-searching", "believes-true");
    const heardSeraAccuseOrin = believes(projection, "claim-orin-has-antidote");
    const searchedSquare = believes(projection, "fact-square-no-physical-evidence", "believes-true");
    const searchedStorehouse = believes(projection, "fact-antidote-storehouse", "believes-false");

    if (location === "square" && !askedSera && !heardDenial) {
      return output(projection, "Communicate", "question-sera", "primary",
        "Dain's direct sighting makes a private question to Sera his strongest available lead.",
        { audience: "private", targetId: "sera", claimIds: ["claim-dain-asks-sera"] },
        citations(projection, [(memory) => memory.factIds.includes("obs-dain-sera-sighting")]));
    }
    if (location === "square" && (!keyBelief || keyBelief.confidence < 90)) {
      return output(projection, "Move", "inspect-clinic", "primary",
        "Sera's denial leaves the Clinic as the strongest place for Dain to seek direct evidence.",
        { targetLocationId: "clinic" },
        citations(projection, [(memory) => memory.claimIds.includes("claim-sera-does-not-know-location")]));
    }
    if (location === "clinic" && (!keyBelief || keyBelief.confidence < 90)) {
      return output(projection, "Investigate", "inspect-empty-case", "primary",
        "Dain needs direct physical evidence before resolving the competing accounts.",
        { subject: "empty-case" },
        citations(projection, [(memory) => memory.factIds.includes("obs-dain-sera-sighting")]));
    }
    if (location === "clinic" && keyBelief && !accusedMara) {
      return output(projection, "Move", "return-to-square", "primary",
        "Dain must compare the spare-key evidence with the public claims in the Square.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => memory.factIds.includes("fact-case-spare-key")]));
    }
    if (location === "square" && keyBelief && !accusedMara) {
      return output(projection, "Accuse", "accuse-mara", "primary",
        "Dain's trust in Orin and the claim that the vial never left the Clinic outweigh the ambiguous key clue.",
        { targetId: "mara", responsibilityTargetId: "mara", claimIds: ["claim-mara-responsible"] },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-antidote-never-left-clinic"),
          (memory) => memory.factIds.includes("fact-case-spare-key")
        ]));
    }
    if (location === "square" && accusedMara && !promisedSearch && !searchedSquare) {
      return output(projection, "Move", "return-to-clinic", "primary",
        "After making his accusation, Dain must return to the Clinic to continue the investigation.",
        { targetLocationId: "clinic" },
        citations(projection, [(memory) => memory.claimIds.includes("claim-mara-responsible") && memory.source === "personal-action"]));
    }
    if (location === "clinic" && accusedMara && !promisedSearch) {
      return output(projection, "Communicate", "reassure-mara", "secondary",
        "Preserving cooperation now requires Dain to promise Mara that the search will continue.",
        { audience: "private", targetId: "mara", claimIds: ["claim-dain-will-keep-searching"] },
        citations(projection, [(memory) => memory.claimIds.includes("claim-mara-responsible") && memory.source === "personal-action"]));
    }
    if (location === "clinic" && promisedSearch) {
      return output(projection, "Move", "follow-square-leads", "primary",
        "Dain has restored enough cooperation to follow the unresolved public leads in the Square.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => memory.claimIds.includes("claim-dain-will-keep-searching")]));
    }
    if (location === "square" && heardSeraAccuseOrin) {
      return output(projection, "Move", "investigate-storehouse", "primary",
        "Sera's allegation and Orin's earlier restriction request make the Storehouse Dain's strongest lead.",
        { targetLocationId: "storehouse" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-orin-has-antidote"),
          (memory) => /keep the Storehouse undisturbed/i.test(memory.description)
        ]));
    }
    if (location === "square" && !searchedSquare) {
      return output(projection, "Investigate", "search-square", "primary",
        "Dain needs physical evidence that can distinguish the competing public claims.",
        { subject: "square" },
        citations(projection, [(memory) => memory.claimIds.includes("claim-dain-will-keep-searching")]));
    }
    if (location === "storehouse" && !searchedStorehouse) {
      return output(projection, "Investigate", "search-storehouse", "primary",
        "The Storehouse is Dain's strongest remaining location to search for the vial.",
        { subject: "storehouse" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-orin-has-antidote"),
          (memory) => /Storehouse/i.test(memory.description)
        ]));
    }
    if (location === "storehouse") {
      return output(projection, "Move", "leave-empty-storehouse", "primary",
        "The empty Storehouse leaves Orin in the Square as Dain's strongest available lead.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => /searches the Storehouse and finds no antidote/i.test(memory.description)]));
    }
    return output(projection, "Wait", "hold-position", "secondary",
      "Dain holds position because his currently owned evidence does not support a safer external action.",
      {}, citations(projection, []));
  }

  function decideSera(projection) {
    const location = projection.currentLocation.id;
    const deniedKnowledge = believes(projection, "claim-sera-does-not-know-location");
    const maraDenied = believes(projection, "claim-mara-not-responsible");
    const vialBelief = belief(projection, "fact-antidote-storehouse");
    const accusedOrin = hasClaimMemory(projection, "claim-orin-has-antidote", true);
    const heardOrinDenial = believes(projection, "claim-orin-no-antidote");
    const confessed = hasFactMemory(projection, "fact-orin-ordered-sera", "public")
      && hasFactMemory(projection, "fact-sera-moved-antidote", "public");

    if (location === "square" && !deniedKnowledge) {
      return output(projection, "Communicate", "deny-location-knowledge", "secondary",
        "Sera fears punishment and believes disclosure before recovering the vial could end her chance to help Niko.",
        { audience: "private", targetId: "dain", claimIds: ["claim-sera-does-not-know-location"] },
        citations(projection, [
          (memory) => memory.factIds.includes("obs-dain-sera-sighting"),
          (memory) => memory.factIds.includes("fact-orin-ordered-sera")
        ]));
    }
    if (location === "square" && vialBelief && vialBelief.stance === "believes-false" && !accusedOrin) {
      return output(projection, "Accuse", "accuse-orin", "primary",
        "The empty hiding place and Orin's knowledge make accusing him Sera's strongest way to force the vial into view.",
        { targetId: "orin", responsibilityTargetId: "orin", claimIds: ["claim-orin-has-antidote"] },
        citations(projection, [
          (memory) => /finds no antidote/i.test(memory.description),
          (memory) => memory.factIds.includes("fact-orin-ordered-sera")
        ]));
    }
    if (location === "square" && accusedOrin && heardOrinDenial) {
      return output(projection, "Move", "go-to-clinic", "primary",
        "With Orin denying the allegation and time nearly gone, Mara needs the truth Sera has withheld.",
        { targetLocationId: "clinic" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-orin-no-antidote"),
          (memory) => /finds no antidote/i.test(memory.description)
        ]));
    }
    if (location === "square" && maraDenied) {
      return output(projection, "Move", "recover-storehouse-vial", "primary",
        "The false blame now threatens Niko, so Sera prioritizes recovering the vial from the Storehouse.",
        { targetLocationId: "storehouse" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-mara-not-responsible"),
          (memory) => memory.factIds.includes("fact-antidote-storehouse")
        ]));
    }
    if (location === "storehouse" && (!vialBelief || vialBelief.stance !== "believes-false")) {
      return output(projection, "Investigate", "search-hiding-place", "primary",
        "Sera must check the hiding place she remembers before she can get the antidote to Niko.",
        { subject: "storehouse" },
        citations(projection, [(memory) => memory.factIds.includes("fact-antidote-storehouse")]));
    }
    if (location === "storehouse") {
      return output(projection, "Move", "confront-orin", "primary",
        "The empty hiding place makes Orin Sera's strongest lead, so she returns to confront him in the Square.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => /finds no antidote/i.test(memory.description)]));
    }
    if (location === "clinic" && !confessed) {
      return output(projection, "Communicate", "confess-responsible-chain", "primary",
        "With Niko near the deadline, protecting herself can no longer outweigh telling Mara the responsible chain.",
        { audience: "public", confessionFactIds: ["fact-sera-moved-antidote", "fact-orin-ordered-sera"] },
        citations(projection, [
          (memory) => memory.factIds.includes("fact-orin-ordered-sera"),
          (memory) => /finds no antidote/i.test(memory.description)
        ]));
    }
    return output(projection, "Wait", "remain-evasive", deniedKnowledge ? "secondary" : "primary",
      "Sera waits because disclosure without possession of the vial still risks punishment without ensuring treatment.",
      {}, citations(projection, [
        (memory) => memory.factIds.includes("fact-orin-ordered-sera"),
        (memory) => /Niko|antidote/i.test(memory.description)
      ]));
  }

  function decideOrin(projection) {
    const location = projection.currentLocation.id;
    const reassuredPublic = hasClaimMemory(projection, "claim-antidote-never-left-clinic", true);
    const ownMaraAccusations = matchingMemories(projection, (memory) => memory.source === "personal-action" && memory.claimIds.includes("claim-mara-responsible")).length;
    const questionedAboutKey = hasClaimMemory(projection, "claim-mara-questions-orin-key");
    const ownsAntidote = projection.self.inventory.includes("antidote");
    const accusedBySera = believes(projection, "claim-orin-has-antidote");
    const deniedPossession = hasClaimMemory(projection, "claim-orin-no-antidote", true);
    const dainPresent = projection.coLocatedCharacters.some((character) => character.id === "dain");

    if (location === "square" && !reassuredPublic) {
      return output(projection, "Communicate", "reassure-square", "secondary",
        "A public claim that the vial never left the Clinic redirects scrutiny and protects Orin's authority.",
        { audience: "public", claimIds: ["claim-antidote-never-left-clinic"] },
        citations(projection, [
          (memory) => memory.factIds.includes("fact-orin-ordered-sera"),
          (memory) => memory.factIds.includes("fact-antidote-storehouse")
        ]));
    }
    if (location === "square" && !ownsAntidote && ownMaraAccusations < 2) {
      return output(projection, "Accuse", "accuse-mara", "primary",
        "Assigning responsibility to Mara keeps Orin's order and the Storehouse out of public scrutiny.",
        { targetId: "mara", responsibilityTargetId: "mara", claimIds: ["claim-mara-responsible"] },
        citations(projection, [(memory) => memory.factIds.includes("fact-orin-ordered-sera")]));
    }
    if (location === "square" && questionedAboutKey && !ownsAntidote) {
      return output(projection, "Move", "secure-storehouse-vial", "primary",
        "Mara's private spare-key question makes controlling the Storehouse vial more urgent than another public claim.",
        { targetLocationId: "storehouse" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-mara-questions-orin-key"),
          (memory) => memory.factIds.includes("fact-antidote-storehouse")
        ]));
    }
    if (location === "storehouse" && !ownsAntidote) {
      return output(projection, "Investigate", "take-antidote", "primary",
        "Possessing the vial prevents the antidote and its evidence from reaching Orin's accusers.",
        { subject: "storehouse" },
        citations(projection, [(memory) => memory.factIds.includes("fact-antidote-storehouse")]));
    }
    if (location === "storehouse" && ownsAntidote) {
      return output(projection, "Move", dainPresent ? "leave-before-dain-searches" : "return-with-concealed-vial", "primary",
        dainPresent
          ? "Dain's presence threatens Orin's possession, so leaving before investigation protects the concealed vial."
          : "Leaving the Storehouse with the vial lets Orin conceal possession while monitoring the public account.",
        { targetLocationId: "square" },
        citations(projection, [(memory) => /finds the antidote|takes possession/i.test(memory.description)]));
    }
    if (location === "square" && ownsAntidote && projection.turnsRemaining <= 1) {
      return output(projection, "Wait", "retain-vial-at-deadline", "primary",
        "Orin continues withholding the concealed vial at the deadline to protect his order.",
        {}, citations(projection, [(memory) => /finds the antidote|takes possession/i.test(memory.description)]));
    }
    if (location === "square" && ownsAntidote && accusedBySera && deniedPossession) {
      return output(projection, "Move", "retreat-with-vial", "primary",
        "Sera's accusation makes the Square unsafe for continued concealment, so Orin retreats with the vial.",
        { targetLocationId: "storehouse" },
        citations(projection, [
          (memory) => memory.claimIds.includes("claim-orin-has-antidote"),
          (memory) => /finds the antidote|takes possession/i.test(memory.description)
        ]));
    }
    if (location === "square" && ownsAntidote && projection.turnsRemaining <= 4 && !deniedPossession) {
      return output(projection, "Communicate", "deny-possession", "primary",
        "As scrutiny rises, a public denial protects Orin because no witness can establish his possession.",
        { audience: "public", claimIds: ["claim-orin-no-antidote"] },
        citations(projection, [
          (memory) => /finds the antidote|takes possession/i.test(memory.description),
          (memory) => memory.factIds.includes("fact-orin-ordered-sera")
        ]));
    }
    return output(projection, "Wait", "hold-public-position", "secondary",
      "Orin waits because the existing public frame still protects his authority better than another action.",
      {}, citations(projection, [(memory) => /finds the antidote|takes possession|accuse/i.test(memory.description)]));
  }

  function createAutonomousAgents() {
    return Object.freeze({
      mara: Object.freeze({ id: "agent-mara", decide: decideMara }),
      dain: Object.freeze({ id: "agent-dain", decide: decideDain }),
      sera: Object.freeze({ id: "agent-sera", decide: decideSera }),
      orin: Object.freeze({ id: "agent-orin", decide: decideOrin })
    });
  }

  return Object.freeze({ createAutonomousAgents });
});
