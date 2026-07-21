"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const scenario = require(path.join(root, "src/data/world-scenario.js"));
const engine = require(path.join(root, "src/engine/world-engine.js"));
const decision = require(path.join(root, "src/ai/decision-layer.js"));
const providers = require(path.join(root, "src/ai/decision-providers.js"));
const intervention = require(path.join(root, "src/engine/intervention-layer.js"));

const APPROVED_RUN_SHA256 = "6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f";
const IMMUTABLE_LAYER_SHA256 = Object.freeze({
  "src/ai/decision-layer.js": "f3e0fcfb33e83b87e39c224d45bed999024a7d49ed49ebc99facfc63fec1c835",
  "src/ai/decision-providers.js": "e6cf57f0f87b8abb414d8efc8b1f3546838ab1e8756319e051f3a71f0be040fe",
  "src/ai/npc-agents.js": "e8c7e5efe7ab384f2993f4f0b09b7d3eb87505957ab976986d2c8f04958d1cd4"
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function provider() {
  return providers.createProvider({ type: "deterministic" });
}

function informationRequest() {
  return {
    id: "spare-key-mara-t00",
    category: "Information",
    boundaryTurn: 0,
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

test("Decision, Provider, and approved NPC policy layers remain byte-for-byte unchanged", () => {
  for (const [relativePath, approvedHash] of Object.entries(IMMUTABLE_LAYER_SHA256)) {
    assert.equal(sha256(fs.readFileSync(path.join(root, relativePath))), approvedHash, `${relativePath} changed`);
  }
});

test("Intervention Layer only types requests and delegates authoritative resolution to the World Engine", () => {
  const source = fs.readFileSync(path.join(root, "src/engine/intervention-layer.js"), "utf8");
  assert.match(source, /engine\.resolveInterventionEvent\(/);
  assert.doesNotMatch(source, /\.npcs\s*\[|\.inventory\s*=|\.beliefs\s*\[|\.trust\s*\[|\.patient\s*=|\.events\.push|\.boundaries\.push/);
  assert.deepEqual(intervention.CATEGORIES, ["Information", "ItemTransfer", "EnvironmentalEvent"]);
});

test("Information intervention becomes an authoritative event before private memory and belief consequences", () => {
  const initial = engine.createInitialWorld(scenario);
  const initialJson = JSON.stringify(initial);
  const changed = intervention.applyIntervention(initial, informationRequest());
  const added = changed.events.slice(initial.events.length);
  const event = added[0];
  const consequence = added[1];

  assert.ok(Object.isFrozen(changed));
  assert.equal(JSON.stringify(initial), initialJson);
  assert.equal(initial.npcs.mara.beliefs["fact-case-spare-key"], undefined);
  assert.equal(changed.branchId, initial.branchId);
  assert.equal(changed.turn, initial.turn);
  assert.equal(event.eventType, "world.intervention.information.v1");
  assert.equal(event.category, "User intervention");
  assert.equal(event.external, true);
  assert.deepEqual(event.witnessIds, ["mara"]);
  assert.deepEqual(event.createdMemoryIds, ["mem-world-intervention-spare-key-mara-t00-mara"]);
  assert.equal(consequence.causes[0], event.id);
  assert.deepEqual(consequence.changes.memories.map((entry) => entry.ownerId), ["mara"]);
  assert.deepEqual(consequence.changes.beliefs.map((entry) => entry.ownerId), ["mara"]);
  assert.equal(changed.npcs.mara.memories.at(-1).source, "player-intervention");
  assert.equal(changed.npcs.mara.beliefs["fact-case-spare-key"].confidence, 90);
  assert.ok(changed.npcOrder.filter((id) => id !== "mara").every((id) => !changed.npcs[id].memories.some((memory) => memory.originEventId === event.id)));
  assert.equal(engine.restoreBoundary(changed, 0).events.length, changed.events.length);
});

test("A validated information intervention changes a later autonomous decision", () => {
  const initial = engine.createInitialWorld(scenario);
  const changed = intervention.applyIntervention(initial, informationRequest());
  const originalTurn = decision.decideAndResolveTurn(initial, provider());
  const changedTurn = decision.decideAndResolveTurn(changed, provider());
  const originalMara = originalTurn.intents.find((intent) => intent.actorId === "mara");
  const changedMara = changedTurn.intents.find((intent) => intent.actorId === "mara");

  assert.equal(originalMara.action, "Investigate");
  assert.equal(originalMara.subject, "empty-case");
  assert.equal(changedMara.action, "Move");
  assert.equal(changedMara.targetLocationId, "square");
  assert.deepEqual(changedMara.citedMemoryIds, ["mem-world-intervention-spare-key-mara-t00-mara"]);
});

test("Retry restores the latest frozen boundary including its intervention", () => {
  const changed = intervention.applyIntervention(engine.createInitialWorld(scenario), informationRequest());
  const deterministic = provider();
  const flaky = providers.createProvider({
    type: "llm",
    vendor: "mock",
    model: "one-malformed-attempt",
    invoke(request) {
      if (request.actorId === "mara" && request.attempt === 1) return "{malformed";
      return deterministic.decide(request);
    }
  });
  const expected = decision.decideAndResolveTurn(changed, provider());
  const retried = decision.decideAndResolveTurn(changed, flaky, { maxAttempts: 2 });

  assert.equal(retried.audit.attempts[0].status, "malformed-output");
  assert.equal(retried.audit.attempts[1].status, "completed");
  assert.ok(retried.intents.find((intent) => intent.actorId === "mara").citedMemoryIds.includes("mem-world-intervention-spare-key-mara-t00-mara"));
  assert.deepEqual(retried.state, expected.state);
  assert.equal(changed.turn, 0);
});

test("No-intervention autonomous replay remains byte-for-byte identical", () => {
  const first = decision.runAutonomousOriginal(scenario, provider());
  const second = decision.runAutonomousOriginal(scenario, provider());
  assert.deepEqual(first, second);
  assert.equal(sha256(JSON.stringify(first)), APPROVED_RUN_SHA256);
});

test("Item-transfer intervention follows authoritative possession, co-location, event, and witness rules", () => {
  const original = decision.runAutonomousOriginal(scenario, provider());
  const boundary = engine.restoreBoundary(original.state, 9);
  const boundaryJson = JSON.stringify(boundary);
  const changed = intervention.applyIntervention(boundary, {
    id: "orin-gives-sera-antidote-t09",
    category: "ItemTransfer",
    boundaryTurn: 9,
    payload: {
      itemId: "antidote",
      fromId: "orin",
      toId: "sera",
      description: "An external counterfactual transfers Orin's antidote to co-located Sera."
    }
  });
  const event = changed.events.find((candidate) => candidate.id === "evt-world-intervention-orin-gives-sera-antidote-t09");

  assert.equal(JSON.stringify(boundary), boundaryJson);
  assert.equal(boundary.antidote.possessorId, "orin");
  assert.equal(changed.antidote.possessorId, "sera");
  assert.equal(changed.npcs.orin.inventory.includes("antidote"), false);
  assert.equal(changed.npcs.sera.inventory.includes("antidote"), true);
  assert.deepEqual(event.changes.items, [{ itemId: "antidote", from: "orin", to: "sera" }]);
  assert.deepEqual(event.witnessIds, ["dain", "sera", "orin"]);
  assert.equal(changed.npcs.mara.memories.some((memory) => memory.originEventId === event.id), false);
  assert.ok(event.witnessIds.every((id) => changed.npcs[id].memories.some((memory) => memory.originEventId === event.id)));
});

test("Environmental intervention changes only a legal location condition and local memories", () => {
  const initial = engine.createInitialWorld(scenario);
  const changed = intervention.applyIntervention(initial, {
    id: "clinic-smoke-t00",
    category: "EnvironmentalEvent",
    boundaryTurn: 0,
    payload: {
      locationId: "clinic",
      conditionId: "condition-smoke",
      conditionState: "active",
      description: "Smoke fills the Clinic and is directly observable there."
    }
  });
  const event = changed.events.find((candidate) => candidate.id === "evt-world-intervention-clinic-smoke-t00");

  assert.equal(initial.locations.clinic.environmentalConditions, undefined);
  assert.deepEqual(changed.locations.clinic.environmentalConditions, ["condition-smoke"]);
  assert.deepEqual(event.changes.locations, [{ locationId: "clinic", conditionId: "condition-smoke", from: "clear", to: "active" }]);
  assert.deepEqual(event.witnessIds, ["mara"]);
  assert.equal(changed.npcs.mara.memories.some((memory) => memory.originEventId === event.id), true);
  assert.ok(["dain", "sera", "orin"].every((id) => !changed.npcs[id].memories.some((memory) => memory.originEventId === event.id)));
});

test("Malformed, forged, impossible, and repeated interventions cannot bypass World validation", () => {
  const initial = engine.createInitialWorld(scenario);
  const initialHash = sha256(JSON.stringify(initial));

  assert.throws(() => intervention.applyIntervention(JSON.parse(JSON.stringify(initial)), informationRequest()), /frozen completed boundary/);
  assert.throws(() => intervention.applyIntervention(initial, Object.assign(informationRequest(), { statePatch: { patient: "Saved" } })), /unsupported field statePatch/);
  assert.throws(() => intervention.applyIntervention(initial, Object.assign(informationRequest(), { category: "PatientMutation" })), /Unsupported intervention category/);
  assert.throws(() => intervention.applyIntervention(initial, Object.assign(informationRequest(), { boundaryTurn: 1 })), /target completed turn 0/);
  assert.throws(() => intervention.applyIntervention(initial, {
    id: "impossible-transfer-t00",
    category: "ItemTransfer",
    boundaryTurn: 0,
    payload: { itemId: "antidote", fromId: "storehouse", toId: "mara", description: "An impossible remote transfer." }
  }), /must be co-located/);

  const forged = intervention.createInterventionEvent(initial, informationRequest());
  const forgedPayload = Object.assign({}, forged.payload, { patientState: "Saved" });
  assert.throws(() => engine.resolveInterventionEvent(initial, Object.assign({}, forged, { payload: forgedPayload })), /unsupported field patientState/);

  const changed = intervention.applyIntervention(initial, informationRequest());
  assert.throws(() => intervention.applyIntervention(changed, {
    id: "second-note-t00",
    category: "Information",
    boundaryTurn: 0,
    payload: Object.assign({}, informationRequest().payload, { recipientId: "dain" })
  }), /only one external intervention/);
  assert.equal(sha256(JSON.stringify(initial)), initialHash);
});
