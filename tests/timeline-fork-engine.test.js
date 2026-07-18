"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const scenario = require(path.join(root, "world-scenario.js"));
const world = require(path.join(root, "world-engine.js"));
const providers = require(path.join(root, "decision-providers.js"));
const timeline = require(path.join(root, "timeline-fork-engine.js"));

const APPROVED_ORIGINAL_SHA256 = "6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f";
const UNCHANGED_LAYER_SHA256 = Object.freeze({
  "decision-layer.js": "e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155",
  "decision-providers.js": "b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f",
  "npc-agents.js": "c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704",
  "intervention-layer.js": "6049a340aeafb9499f58dd22235ecd798e31a7b23548e820ffd30f9ccdacd00a"
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function provider() {
  return providers.createProvider({ type: "deterministic" });
}

function originalTimeline() {
  return timeline.createOriginalTimeline(scenario, provider());
}

function informationRequest(turn = 0) {
  return {
    id: `spare-key-mara-t${String(turn).padStart(2, "0")}`,
    category: "Information",
    boundaryTurn: turn,
    payload: {
      recipientId: "mara",
      propositionId: "fact-case-spare-key",
      truthStatus: "true-evidence",
      beliefStance: "believes-true",
      confidence: 90,
      description: "An anonymous note tells Mara the empty case was opened with Orin's spare Clinic key."
    }
  };
}

function completedAlternate() {
  let session = timeline.createTimelineSession(originalTimeline());
  session = timeline.forkAlternate(session, { turn: 0 });
  session = timeline.applyAlternateIntervention(session, informationRequest(0));
  return timeline.runAlternate(session, provider());
}

function allMemories(state) {
  return Object.values(state.npcs).flatMap((npc) => npc.memories);
}

function validateWorld(state) {
  assert.equal(Object.keys(state.npcs).length, 4);
  assert.equal(Object.keys(state.locations).length, 3);
  assert.ok(state.turn <= state.deadline);
  assert.ok(Object.isFrozen(state));
  assert.equal(new Set(state.events.map((event) => event.id)).size, state.events.length);
  assert.equal(state.boundaries.at(-1).eventCount, state.events.length);
  assert.equal(state.boundaries.at(-1).turn, state.turn);

  const holders = state.npcOrder.filter((id) => state.npcs[id].inventory.includes("antidote"));
  if (state.antidote.possessorId) assert.deepEqual(holders, [state.antidote.possessorId]);
  else assert.equal(holders.length, 0);
  assert.equal(Boolean(state.antidote.locationId) + Boolean(state.antidote.possessorId) + Boolean(state.antidote.used), 1);

  const eventIds = new Set(state.events.map((event) => event.id));
  for (const memory of allMemories(state)) assert.ok(eventIds.has(memory.originEventId), `${memory.id} has a foreign origin event`);
  for (const npc of Object.values(state.npcs)) {
    const memoryIds = new Set(npc.memories.map((memory) => memory.id));
    for (const belief of Object.values(npc.beliefs)) {
      assert.ok(belief.supportingMemoryIds.every((id) => memoryIds.has(id)), `${npc.id} belief has foreign memory support`);
    }
  }
  if (state.status === "completed") {
    assert.ok(state.outcome);
    assert.ok(["Saved", "Lost"].includes(state.outcome.medical));
    assert.ok(["Exposed", "Partially exposed", "Obscured", "False consensus"].includes(state.outcome.truth));
    assert.ok(["Reconciled", "Uneasy", "Fractured"].includes(state.outcome.social));
  }
}

test("Decision, Provider, agent, and Intervention layers remain byte-for-byte unchanged", () => {
  for (const [relativePath, expected] of Object.entries(UNCHANGED_LAYER_SHA256)) {
    assert.equal(sha256(fs.readFileSync(path.join(root, relativePath))), expected, `${relativePath} changed`);
  }
});

test("Timeline Fork Engine orchestrates immutable layers and never resolves World changes itself", () => {
  const source = fs.readFileSync(path.join(root, "timeline-fork-engine.js"), "utf8");
  assert.match(source, /world\.forkCompletedBoundary\(/);
  assert.match(source, /intervention\.applyIntervention\(/);
  assert.match(source, /decision\.decideAndResolveTurn\(/);
  assert.doesNotMatch(source, /\.inventory\s*=|\.beliefs\s*\[|\.trust\s*\[|\.patient\s*=|\.events\.push|\.boundaries\.push/);
  assert.doesNotMatch(source, /document\.|innerHTML|fetch\(|https?:\/\//);
});

test("Original timeline is immutable and its replay remains byte-for-byte identical", () => {
  const original = originalTimeline();
  assert.ok(Object.isFrozen(original));
  assert.ok(Object.isFrozen(original.state));
  assert.ok(Object.isFrozen(original.turns));
  assert.ok(Object.isFrozen(original.boundaries));
  assert.equal(sha256(JSON.stringify({ state: original.state, turns: original.turns })), APPROVED_ORIGINAL_SHA256);
});

test("Every eligible completed Original boundary can be cloned with a generated alternate identity", () => {
  const original = originalTimeline();
  assert.deepEqual(original.boundaries.map((boundary) => boundary.turn), Array.from({ length: 13 }, (_, turn) => turn));

  for (const boundary of original.boundaries.filter((candidate) => candidate.turn <= 10)) {
    const session = timeline.forkAlternate(timeline.createTimelineSession(original), { turn: boundary.turn });
    assert.equal(session.alternate.state.turn, boundary.turn);
    assert.notEqual(session.alternate.branchId, original.branchId);
    assert.equal(session.alternate.branchId, `${original.branchId}-alternate-t${String(boundary.turn).padStart(2, "0")}`);
    assert.equal(session.alternate.sourceBranchId, original.branchId);
    assert.equal(session.alternate.forkTurn, boundary.turn);
    assert.ok(Object.isFrozen(session.alternate.state));
    const intervened = timeline.applyAlternateIntervention(session, informationRequest(boundary.turn));
    assert.equal(intervened.alternate.status, "intervened");
    assert.ok(intervened.alternate.interventionEventId);
  }
  assert.throws(() => timeline.forkAlternate(timeline.createTimelineSession(original), { turn: 11 }), /eligible MVP range 0 through 10/);
  assert.throws(() => timeline.forkAlternate(timeline.createTimelineSession(original), { turn: 12 }), /eligible MVP range 0 through 10/);
});

test("Cloned prefix receives branch-specific boundary, event, intent, and memory identities", () => {
  const original = originalTimeline();
  const session = timeline.forkAlternate(timeline.createTimelineSession(original), { turn: 2 });
  const alternate = session.alternate;
  const branchId = alternate.branchId;
  const originalEventIds = new Set(original.state.events.map((event) => event.id));
  const originalMemoryIds = new Set(allMemories(original.state).map((memory) => memory.id));
  const originalIntentIds = new Set(original.turns.flatMap((turn) => turn.intents.map((intent) => intent.id)));
  const originalBoundaryIds = new Set(original.boundaries.map((boundary) => boundary.id));

  assert.ok(alternate.state.events.every((event) => event.id.startsWith(`evt-world-${branchId}--`) && !originalEventIds.has(event.id)));
  assert.ok(allMemories(alternate.state).every((memory) => (memory.id.startsWith(`mem-world-${branchId}--`) || memory.id.startsWith(`mem-start-${branchId}--`)) && !originalMemoryIds.has(memory.id)));
  assert.ok(alternate.turns.flatMap((turn) => turn.intents).every((intent) => intent.id.startsWith(`${branchId}--`) && !originalIntentIds.has(intent.id)));
  assert.ok(alternate.boundaries.every((boundary) => boundary.id.startsWith(`boundary-${branchId}-`) && !originalBoundaryIds.has(boundary.id)));
  assert.ok(alternate.state.events.every((event) => event.sourceId && originalEventIds.has(event.sourceId)));
  assert.ok(allMemories(alternate.state).every((memory) => memory.sourceId && originalMemoryIds.has(memory.sourceId)));
});

test("Original and Alternate share no mutable domain objects", () => {
  const original = originalTimeline();
  const session = timeline.forkAlternate(timeline.createTimelineSession(original), { turn: 2 });
  const alternate = session.alternate;

  assert.notStrictEqual(original.state, alternate.state);
  assert.notStrictEqual(original.state.events, alternate.state.events);
  assert.notStrictEqual(original.state.boundaries, alternate.state.boundaries);
  assert.notStrictEqual(original.state.locations, alternate.state.locations);
  assert.notStrictEqual(original.state.antidote, alternate.state.antidote);
  for (const id of original.state.npcOrder) {
    assert.notStrictEqual(original.state.npcs[id], alternate.state.npcs[id]);
    assert.notStrictEqual(original.state.npcs[id].memories, alternate.state.npcs[id].memories);
    assert.notStrictEqual(original.state.npcs[id].beliefs, alternate.state.npcs[id].beliefs);
    assert.notStrictEqual(original.state.npcs[id].trust, alternate.state.npcs[id].trust);
    assert.notStrictEqual(original.state.npcs[id].inventory, alternate.state.npcs[id].inventory);
  }
  assert.ok(Object.isFrozen(original.state) && Object.isFrozen(alternate.state));
});

test("Intervention and autonomous divergence remain alternate-only while Original receives zero mutations", () => {
  const original = originalTimeline();
  const originalHash = sha256(JSON.stringify(original));
  let session = timeline.createTimelineSession(original);
  session = timeline.forkAlternate(session, { turn: 0 });
  const forkHash = sha256(JSON.stringify(session.original));
  session = timeline.applyAlternateIntervention(session, informationRequest(0));
  const interventionHash = sha256(JSON.stringify(session.original));
  session = timeline.runAlternate(session, provider());

  const alternate = session.alternate;
  const interventionEvent = alternate.state.events.find((event) => event.id === alternate.interventionEventId);
  const originalFirstMara = original.turns[0].intents.find((intent) => intent.actorId === "mara");
  const alternateFirstMara = alternate.turns[0].intents.find((intent) => intent.actorId === "mara");
  assert.equal(originalHash, forkHash);
  assert.equal(originalHash, interventionHash);
  assert.equal(originalHash, sha256(JSON.stringify(session.original)));
  assert.equal(original.state.events.some((event) => event.eventType && event.eventType.startsWith("world.intervention.")), false);
  assert.ok(interventionEvent);
  assert.equal(interventionEvent.branchId, alternate.branchId);
  assert.equal(originalFirstMara.action, "Investigate");
  assert.equal(alternateFirstMara.action, "Move");
  assert.notDeepEqual(world.observableState(alternate.state), world.observableState(original.state));
});

test("Completed Alternate identities and domain state remain branch-local", () => {
  const session = completedAlternate();
  const original = session.original;
  const alternate = session.alternate;
  const branchId = alternate.branchId;
  const originalEventIds = new Set(original.state.events.map((event) => event.id));
  const originalMemoryIds = new Set(allMemories(original.state).map((memory) => memory.id));

  assert.equal(alternate.status, "completed");
  assert.ok(alternate.state.events.every((event) => event.branchId === branchId && event.id.startsWith(`evt-world-${branchId}--`) && !originalEventIds.has(event.id)));
  assert.ok(alternate.turns.flatMap((turn) => turn.intents).every((intent) => intent.id.startsWith(`${branchId}--`)));
  assert.ok(allMemories(alternate.state).every((memory) => !originalMemoryIds.has(memory.id)));
  assert.ok(alternate.boundaries.every((boundary) => boundary.id.startsWith(`boundary-${branchId}-`)));
  assert.ok(alternate.state.outcome.id.startsWith(`outcome-${branchId}--`));
  assert.notEqual(alternate.state.outcome.id, original.state.outcome.id);
  assert.notStrictEqual(alternate.state.outcome, original.state.outcome);
  assert.notStrictEqual(alternate.state.npcs.mara.beliefs, original.state.npcs.mara.beliefs);
  assert.notStrictEqual(alternate.state.npcs.mara.trust, original.state.npcs.mara.trust);
  assert.notStrictEqual(alternate.state.npcs.mara.inventory, original.state.npcs.mara.inventory);
  assert.notDeepEqual(alternate.state.antidote, original.state.antidote);
  assert.notDeepEqual(alternate.state.outcome, original.state.outcome);
});

test("Alternate success is World validity, not parity with the authored or autonomous Original", () => {
  const session = completedAlternate();
  validateWorld(session.alternate.state);
  assert.equal(session.alternate.state.status, "completed");
  assert.equal(session.alternate.state.patient.status, "Lost");
  assert.equal(session.alternate.state.outcome.truth, "Obscured");
  assert.equal(session.alternate.state.antidote.possessorId, "sera");
  assert.notEqual(session.alternate.state.outcome.truth, session.original.state.outcome.truth);
  assert.notEqual(session.alternate.state.antidote.possessorId, session.original.state.antidote.possessorId);
});

test("Alternate replay is deterministic and a session rejects a second or nested fork", () => {
  const first = completedAlternate();
  const second = completedAlternate();
  assert.deepEqual(first.alternate, second.alternate);
  assert.throws(() => timeline.forkAlternate(first, { turn: 1 }), /only one alternate branch/);
  assert.throws(() => world.forkCompletedBoundary(first.alternate.state, 1, "nested-alternate"), /Nested alternate forks/);
});

test("Forking rejects non-boundaries, caller-supplied identities, and continuation without intervention", () => {
  const original = originalTimeline();
  const empty = timeline.createTimelineSession(original);
  assert.throws(() => timeline.forkAlternate(empty, { turn: 13 }), /eligible MVP range 0 through 10/);
  assert.throws(() => timeline.forkAlternate(empty, { turn: 2, branchId: "caller-choice" }), /unsupported field branchId/);
  const forked = timeline.forkAlternate(empty, { turn: 2 });
  assert.throws(() => timeline.runAlternate(forked, provider()), /requires exactly one intervention/);
  assert.throws(() => timeline.applyAlternateIntervention(empty, informationRequest(0)), /newly forked alternate/);
});
