"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scenario = require(path.join(root, "src/data/world-scenario.js"));
const engine = require(path.join(root, "src/engine/world-engine.js"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadRecordedData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("src/data/recorded-data.js"), context, { filename: "recorded-data.js" });
  return context.window.FORKED_FATES_PHASE1;
}

function primaryGoal(actorId) {
  return scenario.npcs[actorId].goals.find((goal) => goal.priority === "primary").id;
}

function customIntent(id, actorId, action, chosenAtTurn, details = {}) {
  return Object.assign({
    id,
    actorId,
    action,
    chosenAtTurn,
    servedGoalId: primaryGoal(actorId),
    rationale: `Deterministic ${action} test intent for ${actorId}.`,
    citedMemoryIds: []
  }, details);
}

function replayBoundaries() {
  const boundaries = [engine.createInitialWorld(scenario)];
  for (let turn = 1; turn <= scenario.deadline; turn += 1) {
    boundaries.push(engine.resolveTurn(boundaries.at(-1), scenario.originalIntents[turn]));
  }
  return boundaries;
}

function recordedNpcAt(data, npcId, turn) {
  const npc = data.characters[npcId];
  const result = { trust: Object.assign({}, npc.trust), item: npc.item };
  for (const entry of npc.history || []) {
    if (entry.turn > turn) break;
    if (entry.trust) result.trust = Object.assign({}, entry.trust);
    if (entry.item !== undefined) result.item = entry.item;
  }
  return result;
}

test("Recorded, World, and Presentation layers have one-way-free production boundaries", () => {
  const entry = read("index.html");
  const recorded = read("src/data/recorded-data.js");
  const presentation = read("src/presentation/app.js");
  const world = `${read("src/data/world-scenario.js")}\n${read("src/engine/world-engine.js")}`;

  assert.match(entry, /recorded-data\.js[\s\S]*world-scenario\.js[\s\S]*world-engine\.js[\s\S]*live-session-adapter\.js[\s\S]*app\.js/);
  assert.doesNotMatch(recorded, /FORKED_FATES_WORLD|world-engine|world-scenario/);
  assert.doesNotMatch(presentation, /FORKED_FATES_WORLD|world-engine|world-scenario/);
  assert.doesNotMatch(world, /FORKED_FATES_PHASE1|recorded-data|innerHTML|document\.|renderWorkspace/);
  assert.match(entry, /recorded-data\.js/);
  assert.match(entry, /app\.js/);
});

test("Authoritative turn zero exactly represents the PRD starting world", () => {
  const state = engine.createInitialWorld(scenario);
  const observable = engine.observableState(state);

  assert.equal(Object.keys(state.npcs).length, 4);
  assert.equal(Object.keys(state.locations).length, 3);
  assert.equal(state.turn, 0);
  assert.equal(state.turnsRemaining, 12);
  assert.equal(state.patient.status, "Untreated");
  assert.deepEqual(observable.locations, { clinic: ["mara"], square: ["dain", "sera", "orin"], storehouse: [] });
  assert.deepEqual(state.antidote, { id: "antidote", locationId: "storehouse", possessorId: null, used: false });
  assert.deepEqual(state.npcs.mara.trust, { dain: 20, sera: 10, orin: -10 });
  assert.deepEqual(state.npcs.dain.trust, { mara: 30, sera: -20, orin: 40 });
  assert.deepEqual(state.npcs.sera.trust, { mara: 20, dain: -30, orin: -10 });
  assert.deepEqual(state.npcs.orin.trust, { mara: 0, dain: 30, sera: -20 });
  assert.deepEqual(state.npcs.orin.inventory, ["spare-clinic-key"]);
  assert.equal(Object.values(state.npcs).flatMap((npc) => npc.inventory).filter((item) => item === "antidote").length, 0);

  const ownership = new Map();
  for (const [npcId, npc] of Object.entries(state.npcs)) {
    for (const memory of npc.memories) ownership.set(memory.id, npcId);
  }
  assert.equal(ownership.get("mem-start-dain-sera-sighting"), "dain");
  assert.equal(ownership.get("mem-start-sera-orin-order"), "sera");
  assert.equal(ownership.get("mem-start-orin-order"), "orin");
  assert.equal(ownership.get("mem-start-mara-deadline"), "mara");
  assert.equal(state.npcs.mara.beliefs["fact-orin-ordered-sera"], undefined);
  assert.equal(state.npcs.mara.beliefs["fact-antidote-storehouse"], undefined);
  assert.equal(state.npcs.mara.beliefs["fact-case-spare-key"], undefined);
  assert.equal(state.npcs.mara.beliefs["fact-orin-holds-spare-key"].confidence, 100);
  assert.equal(state.npcs.dain.beliefs["fact-orin-ordered-sera"], undefined);
});

test("One authoritative turn resolves in PRD phase order from one shared intent boundary", () => {
  const start = engine.createInitialWorld(scenario);
  const turnOne = engine.resolveTurn(start, scenario.originalIntents[1]);
  const events = turnOne.events.filter((event) => event.turn === 1);
  const phases = events.map((event) => event.phase);

  assert.deepEqual(phases, phases.slice().sort((left, right) => left - right));
  assert.deepEqual(events[0].actingPriority, ["mara", "dain", "sera", "orin"]);
  assert.equal(events.filter((event) => event.action).length, 4);
  assert.equal(new Set(events.filter((event) => event.action).map((event) => event.actorId)).size, 4);
  const informationUpdate = events.find((event) => event.category === "Memory and belief update");
  assert.ok(informationUpdate);
  assert.equal(informationUpdate.phase, 5);
  assert.ok(informationUpdate.changes.memories.length > 0);
  assert.ok(informationUpdate.changes.beliefs.length > 0);
  assert.equal(turnOne.turn, 1);
  assert.equal(turnOne.turnsRemaining, 11);
  assert.equal(turnOne.npcs.mara.beliefs["fact-case-spare-key"].confidence, 90);
  assert.equal(turnOne.patient.status, "Untreated");
  assert.equal(start.turn, 0);
  assert.equal(start.npcs.mara.beliefs["fact-case-spare-key"], undefined);
});

test("All seven legal action families resolve through authoritative state rules", () => {
  let state = engine.createInitialWorld(scenario);
  for (let turn = 1; turn <= 5; turn += 1) state = engine.resolveTurn(state, scenario.originalIntents[turn]);

  state = engine.resolveTurn(state, [
    customIntent("test-t06-mara-wait", "mara", "Wait", 5),
    customIntent("test-t06-dain-wait", "dain", "Wait", 5),
    customIntent("test-t06-sera-storehouse", "sera", "Move", 5, { targetLocationId: "storehouse" }),
    customIntent("test-t06-orin-transfer", "orin", "Transfer", 5, { targetId: "sera", itemId: "antidote" })
  ]);
  assert.equal(state.antidote.possessorId, "sera");
  assert.ok(state.events.some((event) => event.id === "evt-world-test-t06-orin-transfer" && event.category === "Item transfer"));

  state = engine.resolveTurn(state, [
    customIntent("test-t07-mara-wait", "mara", "Wait", 6),
    customIntent("test-t07-dain-wait", "dain", "Wait", 6),
    customIntent("test-t07-sera-clinic", "sera", "Move", 6, { targetLocationId: "clinic" }),
    customIntent("test-t07-orin-wait", "orin", "Wait", 6)
  ]);
  state = engine.resolveTurn(state, [
    customIntent("test-t08-mara-wait", "mara", "Wait", 7),
    customIntent("test-t08-dain-wait", "dain", "Wait", 7),
    customIntent("test-t08-sera-administer", "sera", "Administer", 7),
    customIntent("test-t08-orin-wait", "orin", "Wait", 7)
  ]);

  assert.equal(state.patient.status, "Saved");
  assert.equal(state.patient.treatmentTurn, 8);
  assert.equal(state.antidote.used, true);
  assert.equal(state.antidote.possessorId, null);
  assert.equal(state.status, "completed");
  assert.ok(state.events.some((event) => event.id === "evt-world-test-t08-sera-administer" && event.category === "Treatment"));
  assert.deepEqual(new Set(state.events.filter((event) => event.action).map((event) => event.action)), new Set(engine.ACTIONS));
});

test("An intent invalidated by movement becomes a phase-four failure without prohibited changes", () => {
  const start = engine.createInitialWorld(scenario);
  const state = engine.resolveTurn(start, [
    customIntent("invalid-t01-mara-wait", "mara", "Wait", 0),
    customIntent("invalid-t01-dain-talk-orin", "dain", "Communicate", 0, { audience: "private", targetId: "orin", claimIds: ["claim-test"] }),
    customIntent("invalid-t01-sera-wait", "sera", "Wait", 0),
    customIntent("invalid-t01-orin-clinic", "orin", "Move", 0, { targetLocationId: "clinic" })
  ]);
  const failure = state.events.find((event) => event.id === "evt-world-invalid-t01-dain-talk-orin-failed");

  assert.ok(failure);
  assert.equal(failure.phase, 4);
  assert.equal(failure.category, "Failed action");
  assert.deepEqual(failure.changes, { locations: [], items: [], patient: [], publicRecord: [], memories: [], beliefs: [], trust: [], clock: [], outcome: [] });
  assert.equal(state.npcs.dain.locationId, "square");
  assert.equal(state.publicRecord.claims.length, 0);
  assert.ok(state.npcs.dain.memories.some((memory) => memory.originEventId === failure.id));
  assert.ok(!state.npcs.orin.memories.some((memory) => memory.originEventId === failure.id));
});

test("Public, private, local, remote, and self memories respect information boundaries", () => {
  const boundaries = replayBoundaries();
  const turnOne = boundaries[1];
  const turnTwo = boundaries[2];
  const turnEleven = boundaries[11];

  const privateEvent = "evt-world-orig-t01-dain-question";
  assert.ok(turnOne.npcs.dain.memories.some((memory) => memory.originEventId === privateEvent));
  assert.ok(turnOne.npcs.sera.memories.some((memory) => memory.originEventId === privateEvent));
  assert.ok(!turnOne.npcs.mara.memories.some((memory) => memory.originEventId === privateEvent));
  assert.ok(!turnOne.npcs.orin.memories.some((memory) => memory.originEventId === privateEvent));

  const accusation = "evt-world-orig-t02-orin-accuse-mara";
  assert.ok(turnTwo.npcs.mara.memories.some((memory) => memory.originEventId === accusation));
  assert.ok(turnTwo.npcs.sera.memories.some((memory) => memory.originEventId === accusation));
  assert.ok(turnTwo.npcs.orin.memories.some((memory) => memory.originEventId === accusation));
  assert.ok(!turnTwo.npcs.dain.memories.some((memory) => memory.originEventId === accusation));

  const confession = "evt-world-orig-t11-sera-confession";
  assert.ok(turnEleven.npcs.mara.memories.some((memory) => memory.originEventId === confession));
  assert.ok(turnEleven.npcs.sera.memories.some((memory) => memory.originEventId === confession));
  assert.ok(!turnEleven.npcs.dain.memories.some((memory) => memory.originEventId === confession));
  assert.ok(!turnEleven.npcs.orin.memories.some((memory) => memory.originEventId === confession));
});

test("Completed boundaries restore and replay deterministically without changing history", () => {
  const initial = engine.createInitialWorld(scenario);
  const first = engine.resolveTurn(initial, scenario.originalIntents[1]);
  const second = engine.resolveTurn(first, scenario.originalIntents[2]);
  const restoredZero = engine.restoreBoundary(second, 0);
  const restoredOne = engine.restoreBoundary(second, 1);

  assert.deepEqual(restoredZero, initial);
  assert.deepEqual(engine.resolveTurn(restoredZero, scenario.originalIntents[1]), first);
  assert.deepEqual(engine.resolveTurn(restoredOne, scenario.originalIntents[2]), second);
  assert.deepEqual(engine.replayOriginal(scenario), engine.replayOriginal(scenario));
  assert.ok(Object.isFrozen(second));
  assert.ok(Object.isFrozen(second.events[0]));
  assert.ok(Object.isFrozen(second.npcs.mara.memories[0]));
});

test("Every authoritative state transition is connected to a structured event", () => {
  const boundaries = replayBoundaries();
  for (let turn = 1; turn < boundaries.length; turn += 1) {
    const previous = engine.observableState(boundaries[turn - 1]);
    const current = engine.observableState(boundaries[turn]);
    const events = boundaries[turn].events.filter((event) => event.turn === turn);

    assert.ok(events.some((event) => event.category === "Clock update" && event.changes.clock.length === 1));
    for (const npcId of scenario.npcOrder) {
      const priorLocation = Object.keys(previous.locations).find((locationId) => previous.locations[locationId].includes(npcId));
      const currentLocation = Object.keys(current.locations).find((locationId) => current.locations[locationId].includes(npcId));
      if (priorLocation !== currentLocation) {
        assert.ok(events.some((event) => event.changes.locations.some((change) => change.actorId === npcId && change.from === priorLocation && change.to === currentLocation)));
      }
      for (const subjectId of Object.keys(current.trust[npcId])) {
        if (previous.trust[npcId][subjectId] !== current.trust[npcId][subjectId]) {
          assert.ok(events.some((event) => event.changes.trust.some((change) => change.observerId === npcId && change.subjectId === subjectId)));
        }
      }
    }
    if (JSON.stringify(previous.antidote) !== JSON.stringify(current.antidote)) {
      assert.ok(events.some((event) => event.changes.items.length > 0));
    }
    if (previous.patient !== current.patient) assert.ok(events.some((event) => event.changes.patient.length > 0));
  }
});

test("World replay and immutable Recorded playback have identical Original observables", () => {
  const recorded = loadRecordedData();
  const boundaries = replayBoundaries();

  for (let turn = 0; turn <= 12; turn += 1) {
    const world = engine.observableState(boundaries[turn]);
    const authored = recorded.snapshots[turn];
    assert.equal(world.turnsRemaining, authored.turnsRemaining, `turn ${turn} clock differs`);
    assert.equal(world.patient, authored.patient.startsWith("Lost") ? "Lost" : "Untreated", `turn ${turn} patient differs`);
    for (const locationId of ["clinic", "square", "storehouse"]) {
      assert.deepEqual(world.locations[locationId].slice().sort(), Array.from(authored.locations[locationId]).sort(), `turn ${turn} ${locationId} occupants differ`);
    }
    for (const npcId of scenario.npcOrder) {
      assert.deepEqual(world.trust[npcId], recordedNpcAt(recorded, npcId, turn).trust, `turn ${turn} ${npcId} trust differs`);
    }
    if (turn <= 4) {
      assert.equal(world.antidote.locationId, "storehouse");
      assert.equal(world.antidote.possessorId, null);
    } else {
      assert.equal(world.antidote.locationId, null);
      assert.equal(world.antidote.possessorId, "orin");
    }
  }

  const finalWorld = boundaries[12];
  assert.equal(finalWorld.outcome.medical, recorded.originalOutcome.labels.medical.label);
  assert.equal(finalWorld.outcome.truth, recorded.originalOutcome.labels.truth.label);
  assert.equal(finalWorld.outcome.social, recorded.originalOutcome.labels.social.label);
  assert.equal(finalWorld.publicRecord.falseConsensus, false);
  assert.ok(finalWorld.publicRecord.establishedFactIds.includes("fact-sera-moved-antidote"));
  assert.ok(finalWorld.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera"));
  assert.equal(boundaries[5].publicRecord.falseConsensus, true);
});

test("World replay events, memories, beliefs, trust, and outcome are deterministic immutable domain data", () => {
  const state = engine.replayOriginal(scenario);
  const eventIds = state.events.map((event) => event.id);
  const allMemories = Object.values(state.npcs).flatMap((npc) => npc.memories);
  const memoryIds = allMemories.map((memory) => memory.id);

  assert.equal(new Set(eventIds).size, eventIds.length);
  assert.equal(new Set(memoryIds).size, memoryIds.length);
  assert.ok(allMemories.every((memory) => eventIds.includes(memory.originEventId)));
  assert.ok(state.events.every((event) => event.turn === 0 || event.order > 0));
  assert.ok(state.events.every((event) => event.turn === 0 || event.actingPriority.length === 4));
  assert.equal(state.npcs.mara.trust.orin, -65);
  assert.equal(state.npcs.mara.trust.sera, 25);
  assert.equal(state.npcs.orin.trust.sera, -35);
  assert.equal(state.npcs.sera.beliefs["fact-antidote-storehouse"].stance, "believes-false");
  assert.equal(state.npcs.mara.beliefs["fact-orin-ordered-sera"].confidence, 100);
  assert.deepEqual({ medical: state.outcome.medical, truth: state.outcome.truth, social: state.outcome.social }, {
    medical: "Lost",
    truth: "Exposed",
    social: "Fractured"
  });
});
