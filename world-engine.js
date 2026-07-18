(function initializeWorldEngine(root, factory) {
  "use strict";

  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  else if (root) root.FORKED_FATES_WORLD_ENGINE = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function createWorldEngineApi() {
  "use strict";

  const ENGINE_VERSION = "1.0.0";
  const ACTIONS = Object.freeze(["Move", "Investigate", "Communicate", "Transfer", "Administer", "Accuse", "Wait"]);
  const PHASE = Object.freeze({
    Move: 1,
    Investigate: 2,
    Transfer: 2,
    Administer: 2,
    Communicate: 3,
    Accuse: 3,
    Wait: 4
  });

  function invariant(condition, message) {
    if (!condition) throw new Error(message);
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function padTurn(turn) {
    return String(turn).padStart(2, "0");
  }

  function captureBoundary(state) {
    const world = {};
    for (const key of [
      "engineVersion", "scenarioId", "scenarioVersion", "branchId", "deadline", "npcOrder",
      "actingPriorityByTurn", "turn", "turnsRemaining", "status", "locations", "patient",
      "antidote", "facts", "publicRecord", "npcs", "outcome"
    ]) {
      world[key] = deepClone(state[key]);
    }
    return { turn: state.turn, eventCount: state.events.length, world };
  }

  function createInitialWorld(scenario) {
    invariant(scenario && scenario.id, "A domain scenario is required.");
    invariant(Object.keys(scenario.npcs || {}).length === 4, "The world requires exactly four NPCs.");
    invariant(Object.keys(scenario.locations || {}).length === 3, "The world requires exactly three locations.");

    const state = {
      engineVersion: ENGINE_VERSION,
      scenarioId: scenario.id,
      scenarioVersion: scenario.version,
      branchId: scenario.branchId,
      deadline: scenario.deadline,
      npcOrder: deepClone(scenario.npcOrder),
      actingPriorityByTurn: deepClone(scenario.actingPriorityByTurn || {}),
      turn: 0,
      turnsRemaining: scenario.deadline,
      status: "ready",
      locations: deepClone(scenario.locations),
      patient: deepClone(scenario.patient),
      antidote: deepClone(scenario.antidote),
      facts: deepClone(scenario.facts),
      publicRecord: {
        claims: [],
        evidenceIds: [],
        establishedFactIds: [],
        falseConsensus: false
      },
      npcs: deepClone(scenario.npcs),
      events: [],
      boundaries: [],
      outcome: null
    };

    for (const npc of Object.values(state.npcs)) npc.currentIntent = null;

    state.events.push({
      id: "evt-world-t00-start",
      branchId: state.branchId,
      turn: 0,
      phase: 0,
      phaseLabel: "Scenario start",
      order: 0,
      category: "Scenario start",
      action: null,
      actorId: null,
      targetIds: [state.patient.id],
      locationId: state.patient.locationId,
      visibility: "public",
      description: "The authoritative world starts with Niko untreated and twelve turns remaining.",
      goalId: null,
      rationale: "Scenario initialization is a world rule, not an NPC decision.",
      citedMemoryIds: [],
      witnessIds: ["mara"],
      createdMemoryIds: [],
      factIds: [],
      claimIds: [],
      changes: { clock: [state.deadline], patient: [state.patient.status] },
      causes: []
    });
    state.boundaries.push(captureBoundary(state));
    return deepFreeze(state);
  }

  function actorPriority(state, turn) {
    const configured = state.actingPriorityByTurn[String(turn)] || state.actingPriorityByTurn[turn];
    if (configured) return configured.slice();
    const offset = (turn - 1) % state.npcOrder.length;
    return state.npcOrder.slice(offset).concat(state.npcOrder.slice(0, offset));
  }

  function validateIntentSet(previous, intents) {
    invariant(Array.isArray(intents), "A turn requires an intent array.");
    invariant(intents.length === previous.npcOrder.length, "A turn requires exactly one intent per NPC.");
    const actors = new Set();

    for (const intent of intents) {
      invariant(intent && intent.id, "Every intent requires a stable identity.");
      invariant(previous.npcs[intent.actorId], `Unknown intent actor ${intent.actorId}.`);
      invariant(!actors.has(intent.actorId), `NPC ${intent.actorId} submitted more than one intent.`);
      invariant(ACTIONS.includes(intent.action), `Illegal action family ${intent.action}.`);
      invariant(intent.chosenAtTurn === previous.turn, `${intent.id} was not selected from turn ${previous.turn}.`);
      invariant(typeof intent.rationale === "string" && intent.rationale.length > 0, `${intent.id} requires a rationale.`);
      invariant(previous.npcs[intent.actorId].goals.some((goal) => goal.id === intent.servedGoalId), `${intent.id} cites an unknown goal.`);

      const ownedMemories = new Map(previous.npcs[intent.actorId].memories.map((memory) => [memory.id, memory]));
      for (const memoryId of intent.citedMemoryIds || []) {
        const owned = ownedMemories.get(memoryId);
        invariant(owned && owned.turn <= previous.turn, `${intent.id} cites unavailable memory ${memoryId}.`);
      }
      actors.add(intent.actorId);
    }
  }

  function occupantsAt(state, locationId) {
    return state.npcOrder.filter((npcId) => state.npcs[npcId].locationId === locationId);
  }

  function actionLegality(state, intent) {
    const actor = state.npcs[intent.actorId];
    if (intent.action === "Move") {
      if (!state.locations[intent.targetLocationId]) return "The destination does not exist.";
      if (actor.locationId === intent.targetLocationId) return "The actor is already at the destination.";
    }
    if (intent.action === "Investigate") {
      const requiredLocation = { "empty-case": "clinic", storehouse: "storehouse", square: "square" }[intent.subject];
      if (!requiredLocation) return "The investigation target is not scenario-defined.";
      if (actor.locationId !== requiredLocation) return "The investigation target is not at the actor's current location.";
    }
    if (intent.action === "Communicate") {
      if (!['public', 'private'].includes(intent.audience)) return "Communication requires a public or private audience.";
      if (intent.audience === "private") {
        if (!state.npcs[intent.targetId]) return "The private recipient does not exist.";
        if (state.npcs[intent.targetId].locationId !== actor.locationId) return "The private recipient is no longer co-located.";
      }
    }
    if (intent.action === "Accuse") {
      if (!state.npcs[intent.targetId]) return "The accused NPC does not exist.";
      if (state.npcs[intent.targetId].locationId !== actor.locationId) return "The accused NPC is no longer co-located.";
    }
    if (intent.action === "Transfer") {
      if (intent.itemId !== "antidote") return "Only the antidote may be transferred.";
      if (state.antidote.possessorId !== intent.actorId) return "The actor does not possess the antidote.";
      if (!state.npcs[intent.targetId] || state.npcs[intent.targetId].locationId !== actor.locationId) return "The recipient is not co-located.";
    }
    if (intent.action === "Administer") {
      if (state.antidote.possessorId !== intent.actorId) return "The actor does not possess the antidote.";
      if (actor.locationId !== "clinic") return "The antidote may be administered only at the Clinic.";
      if (state.patient.status !== "Untreated" || state.antidote.used) return "The patient cannot receive another treatment.";
    }
    return null;
  }

  function eventChanges() {
    return { locations: [], items: [], patient: [], publicRecord: [], memories: [], beliefs: [], trust: [], clock: [], outcome: [] };
  }

  function emit(context, draft) {
    invariant(!context.state.events.some((event) => event.id === draft.id), `Duplicate event identity ${draft.id}.`);
    context.order += 1;
    const event = Object.assign({
      branchId: context.state.branchId,
      turn: context.state.turn,
      order: context.order,
      action: null,
      actorId: null,
      targetIds: [],
      locationId: null,
      visibility: "self-only",
      goalId: null,
      rationale: null,
      citedMemoryIds: [],
      witnessIds: [],
      createdMemoryIds: [],
      actingPriority: context.priority.slice(),
      factIds: [],
      claimIds: [],
      changes: eventChanges(),
      causes: []
    }, draft);
    context.state.events.push(event);
    return event;
  }

  function memoryId(eventId, ownerId) {
    return `${eventId.replace(/^evt-world-/, "mem-world-")}-${ownerId}`;
  }

  function addMemories(context, event, witnessIds, details) {
    const state = context.state;
    for (const ownerId of witnessIds) {
      const id = memoryId(event.id, ownerId);
      invariant(!state.npcs[ownerId].memories.some((memory) => memory.id === id) && !context.pendingMemories.some((memory) => memory.id === id), `Duplicate memory identity ${id}.`);
      const memory = {
        id,
        ownerId,
        originEventId: event.id,
        turn: state.turn,
        description: event.description,
        source: ownerId === event.actorId ? "personal-action" : details.source || "direct-observation",
        involvedCharacterIds: Array.from(new Set([event.actorId, ...event.targetIds].filter(Boolean))),
        locationId: event.locationId,
        visibility: event.visibility,
        salience: details.salience || "ordinary",
        valence: details.valence || "neutral",
        factIds: event.factIds.slice(),
        claimIds: event.claimIds.slice()
      };
      if (context.consequenceMode) state.npcs[ownerId].memories.push(memory);
      else context.pendingMemories.push(memory);
      event.createdMemoryIds.push(id);
    }
  }

  function setBelief(context, event, ownerId, propositionId, stance, confidence) {
    const supportingMemoryId = memoryId(event.id, ownerId);
    context.pendingBeliefs.push({
      originEventId: event.id,
      ownerId,
      propositionId,
      stance,
      confidence,
      supportingMemoryIds: [supportingMemoryId],
      updatedTurn: context.state.turn
    });
  }

  function publicWitnesses(state, actorId) {
    return occupantsAt(state, state.npcs[actorId].locationId);
  }

  function queueTrust(context, observerId, subjectId, amount, causeId, reason) {
    const key = `${observerId}:${subjectId}`;
    const existing = context.pendingTrust[key] || { observerId, subjectId, amount: 0, causes: [], reasons: [] };
    existing.amount = clamp(existing.amount + amount, -30, 30);
    existing.causes.push(causeId);
    existing.reasons.push(reason);
    context.pendingTrust[key] = existing;
  }

  function resolveMove(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    const from = actor.locationId;
    actor.locationId = intent.targetLocationId;
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 1,
      phaseLabel: "Movement",
      category: "Movement",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [intent.targetLocationId],
      locationId: intent.targetLocationId,
      description: `${actor.name} moves from ${state.locations[from].name} to ${state.locations[intent.targetLocationId].name}.`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: [intent.actorId],
      changes: Object.assign(eventChanges(), { locations: [{ actorId: intent.actorId, from, to: intent.targetLocationId }] })
    });
    addMemories(context, event, event.witnessIds, {});
  }

  function resolveInvestigate(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    let category = "Investigation";
    let description = `${actor.name} investigates ${intent.subject}.`;
    const changes = eventChanges();
    const factIds = [];

    if (intent.subject === "empty-case") {
      category = "Evidence discovery";
      description = `${actor.name} discovers that the empty case was opened with the spare Clinic key.`;
      factIds.push("fact-case-spare-key");
    } else if (intent.subject === "storehouse" && state.antidote.locationId === "storehouse" && !state.antidote.possessorId) {
      category = "Item discovery";
      description = `${actor.name} finds the antidote in the Storehouse and takes possession.`;
      state.antidote.locationId = null;
      state.antidote.possessorId = intent.actorId;
      actor.inventory.push("antidote");
      changes.items.push({ itemId: "antidote", from: "storehouse", to: intent.actorId });
      factIds.push("fact-antidote-storehouse");
    } else if (intent.subject === "storehouse") {
      description = `${actor.name} searches the Storehouse and finds no antidote there.`;
    } else if (intent.subject === "square") {
      description = `${actor.name} searches the Village Square and finds no hidden physical evidence.`;
      factIds.push("fact-square-no-physical-evidence");
    }

    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 2,
      phaseLabel: "Investigation and item",
      category,
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [intent.subject],
      locationId: actor.locationId,
      visibility: "self-only",
      description,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: [intent.actorId],
      factIds,
      changes
    });
    addMemories(context, event, event.witnessIds, { salience: category === "Investigation" ? "important" : "critical" });

    if (intent.subject === "empty-case") setBelief(context, event, intent.actorId, "fact-case-spare-key", "believes-true", 90);
    if (intent.subject === "storehouse" && state.antidote.possessorId === intent.actorId) {
      setBelief(context, event, intent.actorId, "fact-antidote-currently-possessed", "believes-true", 100);
    } else if (intent.subject === "storehouse") {
      setBelief(context, event, intent.actorId, "fact-antidote-storehouse", "believes-false", 100);
    } else if (intent.subject === "square") {
      setBelief(context, event, intent.actorId, "fact-square-no-physical-evidence", "believes-true", 100);
    }
  }

  function recordPublicStatements(state, event, intent) {
    const hasOtherWitness = event.witnessIds.some((id) => id !== intent.actorId);
    if (!hasOtherWitness) return;

    for (const claimId of intent.claimIds || []) {
      state.publicRecord.claims.push({
        id: `${event.id}:${claimId}`,
        claimId,
        speakerId: intent.actorId,
        responsibilityTargetId: intent.responsibilityTargetId || null,
        turn: state.turn,
        eventId: event.id,
        retracted: false
      });
      event.changes.publicRecord.push({ type: "claim-added", claimId, speakerId: intent.actorId });
    }

    for (const factId of intent.factIds || []) {
      if (!state.publicRecord.evidenceIds.includes(factId)) state.publicRecord.evidenceIds.push(factId);
      event.changes.publicRecord.push({ type: "evidence-established", factId });
    }

    for (const factId of intent.confessionFactIds || []) {
      const canEstablish = factId !== "fact-orin-ordered-sera" || state.publicRecord.evidenceIds.includes("fact-case-spare-key");
      if (canEstablish && !state.publicRecord.establishedFactIds.includes(factId)) {
        state.publicRecord.establishedFactIds.push(factId);
        event.changes.publicRecord.push({ type: "fact-established", factId });
      }
    }
  }

  function resolveCommunication(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    const isPrivate = intent.audience === "private";
    const witnesses = isPrivate ? [intent.actorId, intent.targetId] : publicWitnesses(state, intent.actorId);
    const factIds = [...(intent.factIds || []), ...(intent.confessionFactIds || [])];
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 3,
      phaseLabel: "Communication and accusation",
      category: intent.confessionFactIds ? "Confession" : "Communication",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: isPrivate ? [intent.targetId] : witnesses.filter((id) => id !== intent.actorId),
      locationId: actor.locationId,
      visibility: isPrivate ? "private" : "public",
      description: intent.confessionFactIds
        ? `${actor.name} publicly confesses the responsible actions they know.`
        : `${actor.name} makes a ${isPrivate ? "private" : "public"} statement.`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: witnesses,
      factIds,
      claimIds: (intent.claimIds || []).slice()
    });
    recordPublicStatements(state, event, intent);
    addMemories(context, event, witnesses, { source: "another-character", salience: intent.confessionFactIds ? "critical" : "important" });

    for (const witnessId of witnesses) {
      for (const factId of intent.factIds || []) setBelief(context, event, witnessId, factId, "believes-true", 90);
      for (const factId of intent.confessionFactIds || []) setBelief(context, event, witnessId, factId, "believes-true", 100);
      for (const claimId of intent.claimIds || []) {
        const trust = witnessId === intent.actorId ? 100 : (state.npcs[witnessId].trust[intent.actorId] || 0);
        setBelief(context, event, witnessId, claimId, witnessId === intent.actorId ? "believes-true" : "uncertain", clamp(50 + Math.trunc(trust / 2), 0, 100));
      }
    }

    if (intent.confessionFactIds) {
      for (const witnessId of witnesses.filter((id) => id !== intent.actorId)) {
        queueTrust(context, witnessId, intent.actorId, 15, event.id, "risky confession");
        if (state.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera") && witnessId !== "orin") {
          queueTrust(context, witnessId, "orin", -25, event.id, "established deliberate deception");
        }
      }
    }
  }

  function resolveAccusation(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    const witnesses = publicWitnesses(state, intent.actorId);
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 3,
      phaseLabel: "Communication and accusation",
      category: "Accusation",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [intent.targetId],
      locationId: actor.locationId,
      visibility: "public",
      description: `${actor.name} publicly accuses ${state.npcs[intent.targetId].name}.`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: witnesses,
      claimIds: (intent.claimIds || []).slice()
    });
    recordPublicStatements(state, event, intent);
    addMemories(context, event, witnesses, { source: "another-character", salience: "important", valence: "negative" });
    for (const witnessId of witnesses) {
      for (const claimId of intent.claimIds || []) {
        const trust = witnessId === intent.actorId ? 100 : (state.npcs[witnessId].trust[intent.actorId] || 0);
        setBelief(context, event, witnessId, claimId, witnessId === intent.actorId ? "believes-true" : "uncertain", clamp(50 + Math.trunc(trust / 2), 0, 100));
      }
    }

    const responsibleFactsEstablished = state.publicRecord.establishedFactIds.includes("fact-sera-moved-antidote")
      && state.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera");
    if (!responsibleFactsEstablished) queueTrust(context, intent.targetId, intent.actorId, -15, event.id, "unsupported public accusation");
  }

  function resolveTransfer(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    actor.inventory = actor.inventory.filter((itemId) => itemId !== "antidote");
    state.npcs[intent.targetId].inventory.push("antidote");
    state.antidote.possessorId = intent.targetId;
    const witnesses = occupantsAt(state, actor.locationId);
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 2,
      phaseLabel: "Investigation and item",
      category: "Item transfer",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [intent.targetId, "antidote"],
      locationId: actor.locationId,
      visibility: "public",
      description: `${actor.name} transfers the antidote to ${state.npcs[intent.targetId].name}.`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: witnesses,
      changes: Object.assign(eventChanges(), { items: [{ itemId: "antidote", from: intent.actorId, to: intent.targetId }] })
    });
    addMemories(context, event, witnesses, { salience: "critical", valence: "positive" });
    for (const witnessId of witnesses.filter((id) => id !== intent.actorId)) queueTrust(context, witnessId, intent.actorId, 20, event.id, "voluntary antidote transfer");
  }

  function resolveAdminister(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    actor.inventory = actor.inventory.filter((itemId) => itemId !== "antidote");
    state.antidote.possessorId = null;
    state.antidote.locationId = "clinic";
    state.antidote.used = true;
    state.patient.status = "Saved";
    state.patient.treatmentTurn = state.turn;
    const witnesses = occupantsAt(state, "clinic");
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 2,
      phaseLabel: "Investigation and item",
      category: "Treatment",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [state.patient.id, "antidote"],
      locationId: "clinic",
      visibility: "public",
      description: `${actor.name} administers the real antidote to Niko.`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: witnesses,
      changes: Object.assign(eventChanges(), {
        items: [{ itemId: "antidote", from: intent.actorId, to: "used" }],
        patient: [{ from: "Untreated", to: "Saved" }]
      })
    });
    addMemories(context, event, witnesses, { salience: "critical", valence: "positive" });
    for (const witnessId of witnesses.filter((id) => id !== intent.actorId)) queueTrust(context, witnessId, intent.actorId, 20, event.id, "witnessed treatment");
  }

  function resolveWait(context, intent) {
    const state = context.state;
    const actor = state.npcs[intent.actorId];
    const event = emit(context, {
      id: `evt-world-${intent.id}`,
      phase: 4,
      phaseLabel: "Wait and failed actions",
      category: "Wait",
      action: intent.action,
      actorId: intent.actorId,
      locationId: actor.locationId,
      description: `${actor.name} waits: ${intent.rationale}`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: [intent.actorId]
    });
    addMemories(context, event, event.witnessIds, {});
  }

  function resolveFailed(context, intent, reason) {
    const state = context.state;
    const event = emit(context, {
      id: `evt-world-${intent.id}-failed`,
      phase: 4,
      phaseLabel: "Wait and failed actions",
      category: "Failed action",
      action: intent.action,
      actorId: intent.actorId,
      targetIds: [intent.targetId || intent.targetLocationId || intent.subject].filter(Boolean),
      locationId: state.npcs[intent.actorId].locationId,
      description: `${state.npcs[intent.actorId].name}'s ${intent.action} intent fails: ${reason}`,
      goalId: intent.servedGoalId,
      rationale: intent.rationale,
      citedMemoryIds: (intent.citedMemoryIds || []).slice(),
      witnessIds: [intent.actorId]
    });
    addMemories(context, event, event.witnessIds, { salience: "important", valence: "negative" });
  }

  function applyInformationConsequences(context) {
    const memoryChanges = context.pendingMemories.map((memory) => ({
      memoryId: memory.id,
      ownerId: memory.ownerId,
      originEventId: memory.originEventId
    }));
    for (const memory of context.pendingMemories) context.state.npcs[memory.ownerId].memories.push(memory);

    const beliefChanges = context.pendingBeliefs.map((belief) => ({
      ownerId: belief.ownerId,
      propositionId: belief.propositionId,
      stance: belief.stance,
      confidence: belief.confidence,
      memoryId: belief.supportingMemoryIds[0]
    }));
    for (const belief of context.pendingBeliefs) {
      context.state.npcs[belief.ownerId].beliefs[belief.propositionId] = {
        propositionId: belief.propositionId,
        stance: belief.stance,
        confidence: belief.confidence,
        supportingMemoryIds: belief.supportingMemoryIds.slice(),
        updatedTurn: belief.updatedTurn
      };
    }

    if (memoryChanges.length || beliefChanges.length) {
      emit(context, {
        id: `evt-world-t${padTurn(context.state.turn)}-information-update`,
        phase: 5,
        phaseLabel: "Consequences",
        category: "Memory and belief update",
        locationId: "world",
        visibility: "private-state",
        description: "Eligible witnesses remember resolved events and update only their own beliefs.",
        changes: Object.assign(eventChanges(), { memories: memoryChanges, beliefs: beliefChanges }),
        causes: Array.from(new Set(context.pendingMemories.map((memory) => memory.originEventId).concat(context.pendingBeliefs.map((belief) => belief.originEventId))))
      });
    }
    context.pendingMemories = [];
    context.pendingBeliefs = [];
    context.consequenceMode = true;
  }

  function applyTrustConsequences(context) {
    const entries = Object.values(context.pendingTrust).sort((left, right) => {
      const observer = context.priority.indexOf(left.observerId) - context.priority.indexOf(right.observerId);
      return observer || context.priority.indexOf(left.subjectId) - context.priority.indexOf(right.subjectId);
    });
    for (const entry of entries) {
      const oldValue = context.state.npcs[entry.observerId].trust[entry.subjectId];
      const newValue = clamp(oldValue + entry.amount, -100, 100);
      if (newValue === oldValue) continue;
      context.state.npcs[entry.observerId].trust[entry.subjectId] = newValue;
      const event = emit(context, {
        id: `evt-world-t${padTurn(context.state.turn)}-trust-${entry.observerId}-${entry.subjectId}`,
        phase: 5,
        phaseLabel: "Consequences",
        category: "Trust update",
        targetIds: [entry.observerId, entry.subjectId],
        locationId: context.state.npcs[entry.observerId].locationId,
        visibility: "private-state",
        description: `${context.state.npcs[entry.observerId].name}'s trust in ${context.state.npcs[entry.subjectId].name} changes from ${oldValue} to ${newValue}.`,
        rationale: entry.reasons.join("; "),
        witnessIds: [entry.observerId],
        changes: Object.assign(eventChanges(), { trust: [{ observerId: entry.observerId, subjectId: entry.subjectId, from: oldValue, to: newValue }] }),
        causes: Array.from(new Set(entry.causes))
      });
      addMemories(context, event, event.witnessIds, { salience: "important", valence: entry.amount > 0 ? "positive" : "negative" });
    }
  }

  function updatePublicRecordState(context) {
    const state = context.state;
    const previousValue = state.publicRecord.falseConsensus;
    const responsibleFactsEstablished = state.publicRecord.establishedFactIds.includes("fact-sera-moved-antidote")
      && state.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera");
    const falseSpeakers = new Set(state.publicRecord.claims
      .filter((claim) => !claim.retracted && ["mara", "dain"].includes(claim.responsibilityTargetId))
      .map((claim) => claim.speakerId));
    state.publicRecord.falseConsensus = !responsibleFactsEstablished && falseSpeakers.size >= 2;
    if (state.publicRecord.falseConsensus === previousValue) return;

    emit(context, {
      id: `evt-world-t${padTurn(state.turn)}-public-record`,
      phase: 5,
      phaseLabel: "Consequences",
      category: "Public record update",
      locationId: "world",
      visibility: "public",
      description: state.publicRecord.falseConsensus
        ? "Two public speakers have formed a false consensus around an innocent NPC."
        : "Established responsible facts supersede the earlier false consensus without erasing it.",
      changes: Object.assign(eventChanges(), { publicRecord: [{ falseConsensus: state.publicRecord.falseConsensus }] }),
      causes: state.publicRecord.claims.map((claim) => claim.eventId)
    });
  }

  function emitClock(context) {
    const previous = context.state.turnsRemaining;
    context.state.turnsRemaining = context.state.deadline - context.state.turn;
    emit(context, {
      id: `evt-world-t${padTurn(context.state.turn)}-clock`,
      phase: 5,
      phaseLabel: "Consequences",
      category: "Clock update",
      locationId: "world",
      visibility: "public",
      description: `Turn ${context.state.turn} closes with ${context.state.turnsRemaining} turns remaining.`,
      changes: Object.assign(eventChanges(), { clock: [{ from: previous, to: context.state.turnsRemaining }] })
    });
  }

  function computeOutcome(state) {
    const medical = state.patient.status === "Saved" ? "Saved" : "Lost";
    const seraEstablished = state.publicRecord.establishedFactIds.includes("fact-sera-moved-antidote");
    const orinEstablished = state.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera");
    const truth = seraEstablished && orinEstablished
      ? "Exposed"
      : seraEstablished
        ? "Partially exposed"
        : state.publicRecord.falseConsensus
          ? "False consensus"
          : "Obscured";
    const fracturedTrust = Object.values(state.npcs).some((npc) => Object.values(npc.trust).some((value) => value < -50));
    const social = fracturedTrust || truth === "False consensus"
      ? "Fractured"
      : medical === "Saved" && ["Exposed", "Partially exposed"].includes(truth)
        ? "Reconciled"
        : "Uneasy";
    return {
      id: "outcome-world-original-v1",
      medical,
      truth,
      social,
      treatmentTurn: state.patient.treatmentTurn,
      antidote: deepClone(state.antidote),
      finalTrust: Object.fromEntries(Object.entries(state.npcs).map(([id, npc]) => [id, deepClone(npc.trust)]))
    };
  }

  function finishIfRequired(context) {
    const state = context.state;
    if (state.patient.status !== "Saved" && state.turn < state.deadline) return;
    if (state.patient.status !== "Saved") state.patient.status = "Lost";
    state.outcome = computeOutcome(state);
    state.status = "completed";
    const witnesses = state.npcOrder.slice();
    const event = emit(context, {
      id: `evt-world-t${padTurn(state.turn)}-outcome`,
      phase: 5,
      phaseLabel: "Consequences",
      category: "Branch outcome",
      locationId: "world",
      visibility: "public",
      description: `Original outcome: ${state.outcome.medical} / ${state.outcome.truth} / ${state.outcome.social}.`,
      witnessIds: witnesses,
      changes: Object.assign(eventChanges(), {
        patient: [{ to: state.patient.status }],
        outcome: [{ medical: state.outcome.medical, truth: state.outcome.truth, social: state.outcome.social }]
      })
    });
    addMemories(context, event, witnesses, { salience: "critical", valence: state.patient.status === "Saved" ? "positive" : "negative" });
  }

  function resolveAction(context, intent) {
    if (intent.action === "Move") return resolveMove(context, intent);
    if (intent.action === "Investigate") return resolveInvestigate(context, intent);
    if (intent.action === "Communicate") return resolveCommunication(context, intent);
    if (intent.action === "Transfer") return resolveTransfer(context, intent);
    if (intent.action === "Administer") return resolveAdminister(context, intent);
    if (intent.action === "Accuse") return resolveAccusation(context, intent);
    if (intent.action === "Wait") return resolveWait(context, intent);
    throw new Error(`No resolver exists for ${intent.action}.`);
  }

  function resolveTurn(previous, intents) {
    invariant(previous && previous.engineVersion === ENGINE_VERSION, "A compatible authoritative world boundary is required.");
    invariant(previous.status === "ready", "Only a ready completed boundary can resolve another turn.");
    invariant(previous.turn < previous.deadline, "The branch has reached its deadline.");
    validateIntentSet(previous, intents);

    const state = deepClone(previous);
    state.turn = previous.turn + 1;
    state.status = "resolving";
    const priority = actorPriority(state, state.turn);
    const context = {
      state,
      priority,
      order: 0,
      pendingTrust: {},
      pendingMemories: [],
      pendingBeliefs: [],
      consequenceMode: false
    };
    for (const intent of intents) state.npcs[intent.actorId].currentIntent = deepClone(intent);

    const priorityIndex = Object.fromEntries(priority.map((id, index) => [id, index]));
    const sorted = intents.slice().sort((left, right) => {
      const phase = PHASE[left.action] - PHASE[right.action];
      return phase || priorityIndex[left.actorId] - priorityIndex[right.actorId];
    });
    const failures = [];

    for (const intent of sorted.filter((candidate) => candidate.action !== "Wait")) {
      const reason = actionLegality(state, intent);
      if (reason) failures.push({ intent, reason });
      else resolveAction(context, intent);
    }

    const terminalPhase = sorted.filter((candidate) => candidate.action === "Wait")
      .map((intent) => ({ intent, reason: null }))
      .concat(failures)
      .sort((left, right) => priorityIndex[left.intent.actorId] - priorityIndex[right.intent.actorId]);
    for (const entry of terminalPhase) {
      if (entry.reason) resolveFailed(context, entry.intent, entry.reason);
      else resolveWait(context, entry.intent);
    }

    applyInformationConsequences(context);
    applyTrustConsequences(context);
    updatePublicRecordState(context);
    emitClock(context);
    finishIfRequired(context);
    if (state.status !== "completed") state.status = "ready";
    for (const npc of Object.values(state.npcs)) npc.currentIntent = null;
    state.boundaries.push(captureBoundary(state));
    return deepFreeze(state);
  }

  function restoreBoundary(state, turn) {
    const boundary = state.boundaries.find((candidate) => candidate.turn === turn);
    invariant(boundary, `No completed boundary exists for turn ${turn}.`);
    const restored = Object.assign(deepClone(boundary.world), {
      events: deepClone(state.events.slice(0, boundary.eventCount)),
      boundaries: deepClone(state.boundaries.filter((candidate) => candidate.turn <= turn))
    });
    return deepFreeze(restored);
  }

  function replayOriginal(scenario) {
    let state = createInitialWorld(scenario);
    for (let turn = 1; turn <= scenario.deadline && state.status !== "completed"; turn += 1) {
      state = resolveTurn(state, scenario.originalIntents[turn]);
    }
    return state;
  }

  function observableState(state) {
    const locations = Object.fromEntries(Object.keys(state.locations).map((locationId) => [locationId, occupantsAt(state, locationId)]));
    return deepFreeze({
      turn: state.turn,
      turnsRemaining: state.turnsRemaining,
      status: state.status,
      patient: state.patient.status,
      locations,
      antidote: deepClone(state.antidote),
      trust: Object.fromEntries(Object.entries(state.npcs).map(([id, npc]) => [id, deepClone(npc.trust)])),
      publicRecord: deepClone(state.publicRecord),
      outcome: deepClone(state.outcome)
    });
  }

  return Object.freeze({
    ENGINE_VERSION,
    ACTIONS,
    createInitialWorld,
    resolveTurn,
    restoreBoundary,
    replayOriginal,
    observableState
  });
});
