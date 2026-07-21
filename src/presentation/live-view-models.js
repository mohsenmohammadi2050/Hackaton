(function initializeLiveViewModels(root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else if (root) root.FORKED_FATES_LIVE_VIEW_MODELS = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createLiveViewModelsApi() {
  "use strict";

  const VIEW_MODEL_VERSION = "1.1.0";
  const LOCATION_DESCRIPTIONS = Object.freeze({
    clinic: "Niko waits beneath the deadline clock.",
    square: "Public claims and accusations gather here.",
    storehouse: "A locked supply room at the village edge."
  });

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  function invariant(condition, message) {
    if (!condition) throw new Error(message);
  }

  function changesToLines(changes) {
    if (!changes || typeof changes !== "object") return [];
    const lines = [];
    for (const [dimension, entries] of Object.entries(changes)) {
      for (const entry of entries || []) {
        if (typeof entry === "string") lines.push(`${dimension}: ${entry}`);
        else if (entry && typeof entry === "object") {
          const identity = entry.npcId || entry.ownerId || entry.memoryId || entry.propositionId || entry.itemId || entry.eventId || "world";
          const fromTo = entry.from !== undefined || entry.to !== undefined ? ` ${entry.from ?? "none"} → ${entry.to ?? "none"}` : "";
          lines.push(`${dimension}: ${identity}${fromTo}`);
        }
      }
    }
    return lines;
  }

  function eventView(event, world) {
    const actor = event.actorId ? world.npcs[event.actorId] : null;
    const location = world.locations[event.locationId];
    return {
      id: event.id,
      sourceId: event.sourceId || null,
      branchId: event.branchId,
      turn: event.turn,
      order: event.order,
      phase: event.phase,
      phaseLabel: event.phaseLabel,
      category: event.category,
      description: event.description,
      action: event.action,
      actorId: event.actorId,
      actorName: actor ? actor.name : "World",
      targetIds: deepClone(event.targetIds || []),
      locationId: event.locationId,
      locationName: location ? location.name : event.locationId === "world" ? "World" : "Unknown",
      visibility: event.visibility,
      goalId: event.goalId,
      rationale: event.rationale,
      citedMemoryIds: deepClone(event.citedMemoryIds || []),
      witnessIds: deepClone(event.witnessIds || []),
      createdMemoryIds: deepClone(event.createdMemoryIds || []),
      causes: deepClone(event.causes || []),
      changeLines: changesToLines(event.changes),
      isIntervention: Boolean(event.eventType && event.eventType.startsWith("world.intervention.")),
      eventType: event.eventType || null
    };
  }

  function npcView(npc) {
    return {
      id: npc.id,
      name: npc.name,
      role: npc.role,
      traits: deepClone(npc.traits),
      locationId: npc.locationId,
      inventory: deepClone(npc.inventory),
      posture: npc.posture,
      goals: deepClone(npc.goals),
      trust: deepClone(npc.trust),
      memories: npc.memories.map((memory) => ({
        id: memory.id,
        sourceId: memory.sourceId || null,
        turn: memory.turn,
        description: memory.description,
        source: memory.source,
        visibility: memory.visibility,
        salience: memory.salience,
        originEventId: memory.originEventId
      })),
      beliefs: Object.values(npc.beliefs).map((belief) => deepClone(belief))
    };
  }

  function boundaryFor(timeline, selector) {
    const indexed = timeline.boundaries;
    let position = indexed.length - 1;
    if (selector && selector.boundaryId) position = indexed.findIndex((boundary) => boundary.id === selector.boundaryId);
    else if (selector && Number.isInteger(selector.turn)) {
      position = indexed.map((boundary) => boundary.turn).lastIndexOf(selector.turn);
    }
    invariant(position >= 0, `Timeline ${timeline.id} has no requested completed boundary.`);
    return { indexed: indexed[position], authoritative: timeline.state.boundaries[position], position };
  }

  function outcomeView(outcome) {
    if (!outcome) return null;
    return {
      id: outcome.id,
      medical: outcome.medical,
      truth: outcome.truth,
      social: outcome.social,
      treatmentTurn: outcome.treatmentTurn,
      antidote: deepClone(outcome.antidote),
      finalTrust: deepClone(outcome.finalTrust),
      attribution: deepClone(outcome.attribution)
    };
  }

  function displayIdentity(world, id) {
    if (id === "antidote") return "Antidote";
    return world.npcs[id]?.name || world.locations[id]?.name || id || "Unknown";
  }

  function createInterventionSummary(timeline) {
    if (!timeline?.interventionEventId || !timeline.state) return null;
    const world = timeline.state;
    const event = world.events.find((candidate) => candidate.id === timeline.interventionEventId);
    if (!event) return null;
    const eventType = event.eventType || "";
    const memory = Object.values(world.npcs).flatMap((npc) => npc.memories).find((candidate) => candidate.originEventId === event.id) || null;
    let type = "Intervention";
    let targetCharacter = "No direct character target";
    let appliedDetail = event.description;
    let createdEffect = memory ? `Memory created for ${displayIdentity(world, memory.ownerId)}: ${memory.description}` : "Authoritative event recorded.";

    if (eventType.includes(".information.")) {
      type = "Information";
      const recipientId = event.targetIds[0];
      targetCharacter = displayIdentity(world, recipientId);
      appliedDetail = event.description;
    } else if (eventType.includes(".item-transfer.")) {
      type = "Item transfer";
      const itemChange = event.changes?.items?.[0] || {};
      targetCharacter = displayIdentity(world, itemChange.to || event.targetIds[1]);
      appliedDetail = `${displayIdentity(world, itemChange.itemId || event.targetIds[2])} transferred from ${displayIdentity(world, itemChange.from || event.targetIds[0])} to ${targetCharacter}. ${event.description}`;
      createdEffect = `${displayIdentity(world, itemChange.itemId || event.targetIds[2])} holder became ${targetCharacter}.`;
    } else if (eventType.includes(".environmental-event.")) {
      type = "Environmental event";
      const locationChange = event.changes?.locations?.[0] || {};
      const locationName = displayIdentity(world, locationChange.locationId || event.locationId);
      const conditionId = locationChange.conditionId || event.targetIds[1];
      const conditionName = String(conditionId || "Environmental condition").replace(/^condition-/, "").replace(/-/g, " ").replace(/^./, (character) => character.toUpperCase());
      const witnesses = (event.witnessIds || []).filter((id) => world.npcs[id]).map((id) => displayIdentity(world, id));
      targetCharacter = witnesses.length ? witnesses.join(", ") : "No direct character target";
      appliedDetail = `${conditionName} became ${locationChange.to || "active"} at ${locationName}. ${event.description}`;
      createdEffect = `${conditionName} is ${locationChange.to || "active"} at ${locationName}.`;
    }

    return deepFreeze({
      eventId: event.id,
      type,
      targetCharacter,
      appliedDetail,
      createdEffect,
      appliedTurn: event.turn,
      appliedTurnLabel: `After Turn ${event.turn}`
    });
  }

  function createTurnNarrative(world, events) {
    const actionEvents = events.filter((event) => event.actorId && event.action);
    const actions = world.npcOrder.map((actorId) => {
      const event = actionEvents.find((candidate) => candidate.actorId === actorId);
      const npc = world.npcs[actorId];
      return { actorId, actorName: npc.name, action: event?.action || "Ready", summary: event?.description || `${npc.name} is ready to decide.`, eventId: event?.id || null };
    });
    const important = events.filter((event) => !["Memory and belief update", "Clock update", "Trust update", "Branch outcome"].includes(event.category));
    const summary = important.length
      ? important.slice(0, 2).map((event) => event.description).join(" ")
      : world.turn === 0 ? "Niko waits at the Clinic while four people begin with partial truths." : `Turn ${world.turn} closes with ${world.turnsRemaining} turns remaining.`;
    return {
      summary,
      actions,
      movedNpcIds: events.filter((event) => event.action === "Move").map((event) => event.actorId),
      changeLines: events.flatMap((event) => changesToLines(event.changes)).slice(0, 8),
      latestImportantEventId: important.at(-1)?.id || events.at(-1)?.id || null
    };
  }

  function createTimelineView(timeline, selector = {}) {
    invariant(timeline && timeline.state && Array.isArray(timeline.boundaries), "A completed-boundary timeline is required.");
    const selected = boundaryFor(timeline, selector);
    const world = selected.authoritative.world;
    const visibleEvents = timeline.state.events.slice(0, selected.indexed.eventCount);
    const npcs = Object.fromEntries(Object.entries(world.npcs).map(([id, npc]) => [id, npcView(npc)]));
    const locations = Object.fromEntries(Object.entries(world.locations).map(([id, location]) => [id, {
      id,
      name: location.name,
      description: LOCATION_DESCRIPTIONS[id] || "",
      occupantIds: Object.values(npcs).filter((npc) => npc.locationId === id).map((npc) => npc.id),
      patientPresent: world.patient.locationId === id
    }]));
    const events = visibleEvents.map((event) => eventView(event, world));
    const currentTurnEvents = events.filter((event) => event.turn === world.turn);
    const eventIds = new Set(events.map((event) => event.id));
    const turnRecords = timeline.turns.filter((record) => record.turn <= world.turn).map((record) => ({
      turn: record.turn,
      intents: record.intents.map((intent) => deepClone(intent))
    }));

    return deepFreeze({
      viewModelVersion: VIEW_MODEL_VERSION,
      branch: {
        id: timeline.branchId,
        timelineId: timeline.id,
        kind: timeline.kind,
        status: timeline.status,
        forkTurn: timeline.forkTurn,
        interventionEventId: timeline.interventionEventId || null
      },
      boundary: {
        id: selected.indexed.id,
        turn: selected.indexed.turn,
        classification: selected.indexed.classification,
        eventCount: selected.indexed.eventCount,
        position: selected.position,
        total: timeline.boundaries.length
      },
      clock: { turn: world.turn, deadline: world.deadline, turnsRemaining: world.turnsRemaining },
      patient: deepClone(world.patient),
      antidote: deepClone(world.antidote),
      locations,
      npcs,
      publicRecord: deepClone(world.publicRecord),
      events,
      currentTurnEvents,
      narrative: createTurnNarrative(world, currentTurnEvents),
      turns: turnRecords,
      outcome: outcomeView(world.outcome),
      intervention: createInterventionSummary(timeline),
      selectableBoundaryIds: timeline.boundaries.map((boundary) => boundary.id),
      integrity: {
        allCausesVisible: events.every((event) => event.causes.every((causeId) => eventIds.has(causeId)))
      }
    });
  }

  return Object.freeze({ VIEW_MODEL_VERSION, createInterventionSummary, createTimelineView });
});
