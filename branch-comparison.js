(function initializeBranchComparison(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("./timeline-integrity"));
  else if (root) root.FORKED_FATES_BRANCH_COMPARISON = factory(root.FORKED_FATES_TIMELINE_INTEGRITY);
})(typeof globalThis !== "undefined" ? globalThis : this, function createBranchComparisonApi(integrity) {
  "use strict";

  if (!integrity) throw new Error("Branch Comparison requires Timeline Integrity validation.");
  const COMPARISON_VERSION = "1.0.0";

  function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }
  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
    return value;
  }
  function signature(value, ignored = []) {
    if (value === null || value === undefined) return JSON.stringify(value);
    const clone = deepClone(value);
    if (clone && typeof clone === "object" && !Array.isArray(clone)) {
      for (const key of ignored) delete clone[key];
    }
    return JSON.stringify(stable(clone));
  }
  function intentSignature(intent, memorySources) {
    const copy = deepClone(intent);
    delete copy.id;
    delete copy.sourceId;
    copy.citedMemoryIds = (copy.citedMemoryIds || []).map((id) => memorySources.get(id) || id);
    return signature(copy);
  }
  function eventSignature(event, memorySources) {
    const copy = deepClone(event);
    ["id", "sourceId", "branchId", "order", "causes", "createdMemoryIds", "changes"].forEach((key) => delete copy[key]);
    copy.citedMemoryIds = (copy.citedMemoryIds || []).map((id) => memorySources.get(id) || id);
    return signature(copy);
  }
  function memorySourceMap(state) {
    const map = new Map();
    for (const npc of Object.values(state.npcs)) {
      for (const memory of npc.memories) map.set(memory.id, memory.sourceId || memory.id);
    }
    return map;
  }
  function recordsByTurn(timeline) { return new Map(timeline.turns.map((record) => [record.turn, record])); }
  function changedIntents(original, alternate) {
    const originalTurns = recordsByTurn(original);
    const alternateTurns = recordsByTurn(alternate);
    const sourceMap = memorySourceMap(alternate.state);
    const changes = [];
    for (let turn = alternate.forkTurn + 1; turn <= alternate.state.turn; turn += 1) {
      const a = originalTurns.get(turn);
      const b = alternateTurns.get(turn);
      const actorIds = new Set([...(a?.intents || []).map((item) => item.actorId), ...(b?.intents || []).map((item) => item.actorId)]);
      for (const actorId of actorIds) {
        const before = a?.intents.find((item) => item.actorId === actorId) || null;
        const after = b?.intents.find((item) => item.actorId === actorId) || null;
        if (!before || !after || intentSignature(before, new Map()) !== intentSignature(after, sourceMap)) {
          changes.push({ turn, actorId, original: before && deepClone(before), alternate: after && deepClone(after) });
        }
      }
    }
    return changes;
  }
  function changedEvents(original, alternate) {
    const sourceMap = memorySourceMap(alternate.state);
    const originalByTurn = new Map();
    const alternateByTurn = new Map();
    for (const event of original.state.events) {
      if (!originalByTurn.has(event.turn)) originalByTurn.set(event.turn, []);
      originalByTurn.get(event.turn).push(event);
    }
    for (const event of alternate.state.events) {
      if (!alternateByTurn.has(event.turn)) alternateByTurn.set(event.turn, []);
      alternateByTurn.get(event.turn).push(event);
    }
    const changes = [];
    for (let turn = alternate.forkTurn; turn <= alternate.state.turn; turn += 1) {
      const before = (originalByTurn.get(turn) || []).map((event) => eventSignature(event, new Map()));
      const afterEvents = alternateByTurn.get(turn) || [];
      const after = afterEvents.map((event) => eventSignature(event, sourceMap));
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push({ turn, originalEventIds: (originalByTurn.get(turn) || []).map((event) => event.id), alternateEventIds: afterEvents.map((event) => event.id) });
      }
    }
    return changes;
  }
  function trustDelta(original, alternate) {
    const rows = [];
    for (const [actorId, npc] of Object.entries(original.state.npcs)) {
      for (const [targetId, before] of Object.entries(npc.trust)) {
        const after = alternate.state.npcs[actorId].trust[targetId];
        if (before !== after) rows.push({ actorId, targetId, original: before, alternate: after, delta: after - before });
      }
    }
    return rows;
  }
  function beliefDelta(original, alternate) {
    const rows = [];
    for (const actorId of Object.keys(original.state.npcs)) {
      const before = original.state.npcs[actorId].beliefs;
      const after = alternate.state.npcs[actorId].beliefs;
      for (const propositionId of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const a = before[propositionId] || null;
        const b = after[propositionId] || null;
        if (signature(a, ["supportingMemoryIds"]) !== signature(b, ["supportingMemoryIds"])) rows.push({ actorId, propositionId, original: a && deepClone(a), alternate: b && deepClone(b) });
      }
    }
    return rows;
  }
  function inventoryDelta(original, alternate) {
    const rows = [];
    for (const actorId of Object.keys(original.state.npcs)) {
      const before = original.state.npcs[actorId].inventory;
      const after = alternate.state.npcs[actorId].inventory;
      if (JSON.stringify(before) !== JSON.stringify(after)) rows.push({ actorId, original: deepClone(before), alternate: deepClone(after) });
    }
    return rows;
  }
  function pathEvents(timeline) {
    return timeline.state.events.filter((event) => {
      const changes = event.changes || {};
      return event.action === "Transfer" || event.action === "Administer" || (event.eventType && event.eventType.startsWith("world.intervention.")) ||
        (changes.items || []).length > 0 || (changes.patient || []).length > 0;
    }).map((event) => ({ id: event.id, turn: event.turn, description: event.description, category: event.category }));
  }
  function causalSupport(timeline) {
    const outcome = timeline.state.outcome;
    if (!outcome) return { roots: [], events: [], edges: [] };
    const ids = [...outcome.attribution.medicalEventIds, ...outcome.attribution.truthEventIds, ...outcome.attribution.socialEventIds];
    const byId = new Map(timeline.state.events.map((event) => [event.id, event]));
    const visited = new Set();
    const edges = [];
    function visit(id) {
      if (visited.has(id)) return;
      visited.add(id);
      const event = byId.get(id);
      if (!event) return;
      for (const cause of event.causes || []) {
        edges.push({ from: cause, to: id, kind: "authoritative-cause" });
        visit(cause);
      }
    }
    ids.forEach(visit);
    return {
      roots: [...new Set(ids)],
      events: [...visited].map((id) => { const event = byId.get(id); return { id, turn: event.turn, category: event.category, description: event.description }; }),
      edges
    };
  }

  function compareTimelineSession(session) {
    const report = integrity.validateTimelineSession(session);
    if (!session.alternate || session.alternate.status !== "completed") throw new Error("Comparison requires one completed Alternate timeline.");
    const original = session.original;
    const alternate = session.alternate;
    const intents = changedIntents(original, alternate);
    const events = changedEvents(original, alternate);
    const firstTurns = [intents[0]?.turn, events[0]?.turn].filter(Number.isInteger);
    const firstDivergenceTurn = firstTurns.length ? Math.min(...firstTurns) : null;
    const comparisonLinks = intents.length && alternate.interventionEventId ? [{
      from: alternate.interventionEventId,
      to: intents[0].alternate?.id || `turn-${intents[0].turn}-${intents[0].actorId}`,
      kind: "comparison-only",
      label: "The decision differs after the intervention; this is not asserted as an authoritative event-cause edge."
    }] : [];
    return deepFreeze({
      comparisonVersion: COMPARISON_VERSION,
      integritySchemaVersion: report.schemaVersion,
      sharedPrefix: { throughTurn: alternate.forkTurn, originalBranchId: original.branchId, alternateBranchId: alternate.branchId },
      fork: { turn: alternate.forkTurn, interventionEventId: alternate.interventionEventId },
      firstDivergenceTurn,
      changedIntents: intents,
      changedEvents: events,
      outcomes: { original: deepClone(original.state.outcome), alternate: deepClone(alternate.state.outcome) },
      deltas: {
        trust: trustDelta(original, alternate),
        beliefs: beliefDelta(original, alternate),
        inventories: inventoryDelta(original, alternate),
        antidote: { original: deepClone(original.state.antidote), alternate: deepClone(alternate.state.antidote) }
      },
      antidotePaths: { original: pathEvents(original), alternate: pathEvents(alternate) },
      causalSupport: { original: causalSupport(original), alternate: causalSupport(alternate), comparisonLinks }
    });
  }

  return Object.freeze({ COMPARISON_VERSION, compareTimelineSession });
});
