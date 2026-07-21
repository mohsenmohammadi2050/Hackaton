(function initializeBranchComparison(root, factory) {
  "use strict";

  if (typeof module === "object" && module.exports) module.exports = factory(require("../engine/timeline-integrity"), require("./live-view-models"));
  else if (root) root.FORKED_FATES_BRANCH_COMPARISON = factory(root.FORKED_FATES_TIMELINE_INTEGRITY, root.FORKED_FATES_LIVE_VIEW_MODELS);
})(typeof globalThis !== "undefined" ? globalThis : this, function createBranchComparisonApi(integrity, viewModels) {
  "use strict";

  if (!integrity || !viewModels) throw new Error("Branch Comparison requires Timeline Integrity validation and Live view models.");
  const COMPARISON_VERSION = "1.2.0";

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
  function eventStorySignature(event) {
    const copy = deepClone(event);
    ["id", "sourceId", "branchId", "order", "causes", "createdMemoryIds", "citedMemoryIds", "changes", "rationale"].forEach((key) => delete copy[key]);
    if (copy.category === "Branch outcome") copy.description = String(copy.description).replace(/^(Original|Alternate) outcome:/, "Branch outcome:");
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
  function normalizedMemoryIds(intent, memorySources) {
    return (intent?.citedMemoryIds || []).map((id) => memorySources.get(id) || id).slice().sort();
  }
  function normalizedContent(intent) {
    if (!intent) return null;
    return stable({
      audience: intent.audience || null,
      subject: intent.subject || null,
      claimIds: (intent.claimIds || []).slice().sort(),
      factIds: (intent.factIds || []).slice().sort(),
      confessionFactIds: (intent.confessionFactIds || []).slice().sort()
    });
  }
  function normalizedTarget(intent) {
    if (!intent) return null;
    return stable({ targetId: intent.targetId || null, targetLocationId: intent.targetLocationId || null, responsibilityTargetId: intent.responsibilityTargetId || null, itemId: intent.itemId || null });
  }
  function classifyIntentDifference(before, after, memorySources) {
    if (!before || !after) return { classifications: ["action-changed"], label: "Action changed", evidence: { original: normalizedMemoryIds(before, new Map()), alternate: normalizedMemoryIds(after, memorySources) } };
    const classifications = [];
    if (before.action !== after.action) classifications.push("action-changed");
    if (signature(normalizedTarget(before)) !== signature(normalizedTarget(after))) classifications.push("target-changed");
    if (signature(normalizedContent(before)) !== signature(normalizedContent(after))) classifications.push("content-changed");
    if (before.rationale !== after.rationale) classifications.push("rationale-changed");
    if (before.servedGoalId !== after.servedGoalId) classifications.push("goal-changed");
    const originalEvidence = normalizedMemoryIds(before, new Map());
    const alternateEvidence = normalizedMemoryIds(after, memorySources);
    const evidenceChanged = JSON.stringify(originalEvidence) !== JSON.stringify(alternateEvidence);
    if (!classifications.length && evidenceChanged) classifications.push("evidence-changed-only");
    if (!classifications.length) classifications.push("no-meaningful-decision-change");
    const labels = {
      "action-changed": "Action changed", "target-changed": "Target changed", "content-changed": "Content changed",
      "rationale-changed": "Rationale changed", "goal-changed": "Goal changed",
      "evidence-changed-only": "Same action, different evidence considered",
      "no-meaningful-decision-change": "No meaningful decision change"
    };
    return { classifications, label: classifications.map((value) => labels[value]).join(" · "), evidence: { original: originalEvidence, alternate: alternateEvidence } };
  }
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
          const classification = classifyIntentDifference(before, after, sourceMap);
          changes.push({ turn, actorId, original: before && deepClone(before), alternate: after && deepClone(after), classifications: classification.classifications, label: classification.label, evidence: classification.evidence });
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
        const originalEvents = originalByTurn.get(turn) || [];
        const beforeStory = originalEvents.map(eventStorySignature);
        const afterStory = afterEvents.filter((event) => !event.eventType?.startsWith("world.intervention.") && event.category !== "Memory and belief update").map(eventStorySignature);
        const comparableBefore = originalEvents.filter((event) => event.category !== "Memory and belief update").map(eventStorySignature);
        const meaningful = turn > alternate.forkTurn && JSON.stringify(comparableBefore) !== JSON.stringify(afterStory);
        changes.push({ turn, meaningful, classification: meaningful ? "event-changed" : "evidence-or-reference-changed-only", originalEventIds: originalEvents.map((event) => event.id), alternateEventIds: afterEvents.map((event) => event.id) });
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
  function locationDelta(original, alternate) {
    return Object.keys(original.state.npcs).filter((actorId) => original.state.npcs[actorId].locationId !== alternate.state.npcs[actorId].locationId)
      .map((actorId) => ({ actorId, original: original.state.npcs[actorId].locationId, alternate: alternate.state.npcs[actorId].locationId }));
  }
  function memoryDelta(original, alternate) {
    const rows = [];
    for (const actorId of Object.keys(original.state.npcs)) {
      const before = new Map(original.state.npcs[actorId].memories.map((memory) => [memory.id, memory]));
      const mapped = alternate.state.npcs[actorId].memories.map((memory) => ({ source: memory.sourceId || memory.id, memory }));
      const alternateSources = new Set(mapped.map((entry) => entry.source));
      for (const entry of mapped) if (!before.has(entry.source)) rows.push({ actorId, kind: "added", memoryId: entry.memory.id, description: entry.memory.description });
      for (const [id, memory] of before) if (!alternateSources.has(id)) rows.push({ actorId, kind: "missing", memoryId: id, description: memory.description });
    }
    return rows;
  }
  function outcomeDelta(original, alternate) {
    const before = original.state.outcome;
    const after = alternate.state.outcome;
    if (!before || !after) return { terminal: Boolean(before) !== Boolean(after), medical: false, truth: false, social: false };
    return { terminal: before.medical !== after.medical || before.truth !== after.truth || before.social !== after.social, medical: before.medical !== after.medical || before.treatmentTurn !== after.treatmentTurn, truth: before.truth !== after.truth, social: before.social !== after.social };
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

  function firstObservableImpact(original, alternate, meaningfulIntents, resultingEvents, locations, trust) {
    const candidates = [];
    const name = (id) => alternate.state.npcs[id]?.name || alternate.state.locations[id]?.name || id || "Unknown";
    for (const change of meaningfulIntents) {
      candidates.push({
        turn: change.turn,
        priority: 0,
        kind: "Changed decision",
        detail: `${name(change.actorId)}: ${change.original?.action || "No intent"} to ${change.alternate?.action || "No intent"}. ${change.label}.`,
        eventId: null
      });
    }
    const originalStoriesByTurn = new Map();
    for (const event of original.state.events) {
      if (!originalStoriesByTurn.has(event.turn)) originalStoriesByTurn.set(event.turn, new Set());
      originalStoriesByTurn.get(event.turn).add(eventStorySignature(event));
    }
    const isChangedStory = (event) => !originalStoriesByTurn.get(event.turn)?.has(eventStorySignature(event));
    for (const change of resultingEvents) {
      const event = alternate.state.events.find((candidate) => change.alternateEventIds.includes(candidate.id) && isChangedStory(candidate) && !candidate.eventType?.startsWith("world.intervention.") && candidate.category !== "Memory and belief update");
      if (event) candidates.push({ turn: event.turn, priority: 1, kind: "Changed event", detail: event.description, eventId: event.id });
    }
    for (const change of locations) {
      const event = alternate.state.events.find((candidate) => candidate.turn > alternate.forkTurn && isChangedStory(candidate) && (candidate.changes?.locations || []).some((entry) => entry.actorId === change.actorId));
      if (event) candidates.push({ turn: event.turn, priority: 2, kind: "Changed location", detail: `${name(change.actorId)}: ${name(change.original)} to ${name(change.alternate)}.`, eventId: event.id });
    }
    for (const change of trust) {
      const event = alternate.state.events.find((candidate) => candidate.turn > alternate.forkTurn && isChangedStory(candidate) && (candidate.changes?.trust || []).some((entry) => entry.observerId === change.actorId && entry.subjectId === change.targetId));
      if (event) candidates.push({ turn: event.turn, priority: 3, kind: "Changed trust", detail: `${name(change.actorId)} toward ${name(change.targetId)}: ${change.original} to ${change.alternate}.`, eventId: event.id });
    }
    candidates.sort((left, right) => left.turn - right.turn || left.priority - right.priority || left.detail.localeCompare(right.detail));
    if (!candidates.length) return null;
    const first = candidates[0];
    return { turn: first.turn, kind: first.kind, detail: first.detail, eventId: first.eventId };
  }

  function compareTimelineSession(session) {
    const report = integrity.validateTimelineSession(session);
    if (!session.alternate || session.alternate.status !== "completed") throw new Error("Comparison requires one completed Alternate timeline.");
    const original = session.original;
    const alternate = session.alternate;
    const intents = changedIntents(original, alternate);
    const events = changedEvents(original, alternate);
    const meaningfulIntents = intents.filter((item) => !item.classifications.includes("evidence-changed-only") && !item.classifications.includes("no-meaningful-decision-change"));
    const resultingEvents = events.filter((item) => item.turn > alternate.forkTurn && item.meaningful);
    const firstTurns = [meaningfulIntents[0]?.turn, resultingEvents[0]?.turn].filter(Number.isInteger);
    const firstDivergenceTurn = firstTurns.length ? Math.min(...firstTurns) : null;
    const comparisonLinks = meaningfulIntents.length && alternate.interventionEventId ? [{
      from: alternate.interventionEventId,
      to: meaningfulIntents[0].alternate?.id || `turn-${meaningfulIntents[0].turn}-${meaningfulIntents[0].actorId}`,
      kind: "comparison-only",
      label: "The decision differs after the intervention; this is not asserted as an authoritative event-cause edge."
    }] : [];
    const trust = trustDelta(original, alternate);
    const beliefs = beliefDelta(original, alternate);
    const inventories = inventoryDelta(original, alternate);
    const locations = locationDelta(original, alternate);
    const memories = memoryDelta(original, alternate);
    const outcomes = outcomeDelta(original, alternate);
    const intervention = viewModels.createInterventionSummary(alternate);
    const observableImpact = firstObservableImpact(original, alternate, meaningfulIntents, resultingEvents, locations, trust);
    const antidoteChanged = signature(original.state.antidote) !== signature(alternate.state.antidote);
    const visibleCategories = [];
    if (meaningfulIntents.length) visibleCategories.push("decision-changed");
    if (resultingEvents.length) visibleCategories.push("event-changed");
    if (locations.length) visibleCategories.push("location-changed");
    if (trust.length) visibleCategories.push("trust-changed");
    if (inventories.length) visibleCategories.push("inventory-changed");
    if (antidoteChanged) visibleCategories.push("antidote-path-changed");
    if (outcomes.medical) visibleCategories.push("patient-treatment-state-changed");
    if (outcomes.truth) visibleCategories.push("truth-outcome-changed");
    if (outcomes.social) visibleCategories.push("social-outcome-changed");
    if (outcomes.terminal) visibleCategories.push("terminal-outcome-changed");
    const internalCategories = [];
    if (beliefs.length) internalCategories.push("belief-changed");
    if (memories.length) internalCategories.push("memory-changed");
    if (intents.some((item) => item.classifications.includes("evidence-changed-only"))) internalCategories.push("evidence-changed-only");
    return deepFreeze({
      comparisonVersion: COMPARISON_VERSION,
      integritySchemaVersion: report.schemaVersion,
      sharedPrefix: { throughTurn: alternate.forkTurn, originalBranchId: original.branchId, alternateBranchId: alternate.branchId },
      fork: { turn: alternate.forkTurn, interventionEventId: alternate.interventionEventId },
      intervention,
      firstDivergenceTurn,
      firstObservableImpact: observableImpact,
      changedIntents: intents,
      changedEvents: events,
      outcomes: { original: deepClone(original.state.outcome), alternate: deepClone(alternate.state.outcome) },
      deltas: {
        trust,
        beliefs,
        memories,
        inventories,
        locations,
        antidote: { original: deepClone(original.state.antidote), alternate: deepClone(alternate.state.antidote) }
      },
      outcomeDifferences: outcomes,
      meaningfulDivergence: {
        visible: visibleCategories.length > 0,
        internalOnly: visibleCategories.length === 0 && internalCategories.length > 0,
        score: meaningfulIntents.length * 5 + resultingEvents.length * 3 + trust.length * 2 + inventories.length * 3 + locations.length * 2 + visibleCategories.length * 4,
        visibleCategories,
        internalCategories,
        message: visibleCategories.length ? `${visibleCategories.length} visible causal difference categor${visibleCategories.length === 1 ? "y" : "ies"}.` : "This intervention changed internal context but did not alter the visible story.",
        suggestion: visibleCategories.length ? null : "Try an earlier turn or a different intervention."
      },
      antidotePaths: { original: pathEvents(original), alternate: pathEvents(alternate) },
      causalSupport: { original: causalSupport(original), alternate: causalSupport(alternate), comparisonLinks }
    });
  }

  return Object.freeze({ COMPARISON_VERSION, classifyIntentDifference, compareTimelineSession });
});
