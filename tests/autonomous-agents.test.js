"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const scenario = require(path.join(root, "world-scenario.js"));
const engine = require(path.join(root, "world-engine.js"));
const decision = require(path.join(root, "decision-layer.js"));
const { createAutonomousAgents } = require(path.join(root, "npc-agents.js"));

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadRecordedData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("recorded-data.js"), context, { filename: "recorded-data.js" });
  return context.window.FORKED_FATES_PHASE1;
}

function parse(raw) {
  return JSON.parse(raw);
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

function candidate(projection, actorId, action, details = {}) {
  const goal = projection.self.goals.find((item) => item.priority === "primary").id;
  return JSON.stringify(Object.assign({
    id: `test-${actorId}-t${projection.turn + 1}-${action.toLowerCase()}`,
    actorId,
    action,
    chosenAtTurn: projection.turn,
    servedGoalId: goal,
    rationale: `A valid ${action} candidate for the resolution contract test.`,
    citedMemoryIds: []
  }, details));
}

test("Decision Layer is isolated from Recorded and Presentation while depending on the World Engine only", () => {
  const recorded = read("recorded-data.js");
  const presentation = `${read("index.html")}\n${read("app.js")}\n${read("styles.css")}`;
  const world = `${read("world-scenario.js")}\n${read("world-engine.js")}`;
  const agents = `${read("decision-layer.js")}\n${read("npc-agents.js")}`;

  assert.doesNotMatch(recorded, /decision-layer|npc-agents|FORKED_FATES_DECISION/);
  assert.doesNotMatch(presentation, /decision-layer|npc-agents|FORKED_FATES_DECISION|world-engine|world-scenario/);
  assert.doesNotMatch(world, /decision-layer|npc-agents|FORKED_FATES_DECISION/);
  assert.doesNotMatch(agents, /recorded-data|FORKED_FATES_PHASE1|innerHTML|document\.|renderWorkspace|originalIntents/);
  assert.match(read("decision-layer.js"), /require\("\.\/world-engine"\)/);
});

test("Owned-state projections expose only self state, public identities, local observations, and selected owned memories", () => {
  const state = engine.createInitialWorld(scenario);
  for (const npcId of state.npcOrder) {
    const projection = decision.createOwnedProjection(state, npcId);
    assert.ok(Object.isFrozen(projection));
    assert.equal(projection.self.id, npcId);
    assert.ok(projection.relevantMemories.length <= 6);
    assert.ok(projection.relevantMemories.every((memory) => memory.ownerId === npcId && memory.turn <= state.turn));
    for (const forbidden of ["facts", "publicRecord", "events", "boundaries", "antidote", "npcs", "outcome", "currentIntent"]) {
      assert.equal(Object.hasOwn(projection, forbidden), false, `${npcId} projection leaks ${forbidden}`);
    }
    assert.ok(projection.knownCharacters.every((character) => Object.keys(character).sort().join(",") === "id,name,role"));
    assert.ok(projection.coLocatedCharacters.every((character) => Object.keys(character).sort().join(",") === "id,name,role"));
  }

  const mara = decision.createOwnedProjection(state, "mara");
  const dain = decision.createOwnedProjection(state, "dain");
  const sera = decision.createOwnedProjection(state, "sera");
  const orin = decision.createOwnedProjection(state, "orin");
  assert.doesNotMatch(JSON.stringify(mara), /fact-orin-ordered-sera|fact-antidote-storehouse/);
  assert.doesNotMatch(JSON.stringify(dain), /fact-orin-ordered-sera|fact-antidote-storehouse/);
  assert.match(JSON.stringify(sera), /fact-orin-ordered-sera|fact-antidote-storehouse/);
  assert.match(JSON.stringify(orin), /fact-orin-ordered-sera|fact-antidote-storehouse/);
  assert.deepEqual(mara.coLocatedCharacters, []);
  assert.deepEqual(dain.coLocatedCharacters.map((character) => character.id), ["sera", "orin"]);
  assert.equal(mara.self.inventory.includes("antidote"), false);
  assert.equal(orin.self.inventory.includes("spare-clinic-key"), true);
});

test("Relevant-memory selection is deterministic, capped at six, owned, available, and smaller than full history", () => {
  const result = decision.runAutonomousOriginal(scenario, createAutonomousAgents());
  const turnEleven = engine.restoreBoundary(result.state, 11);

  for (const npcId of turnEleven.npcOrder) {
    const first = decision.createOwnedProjection(turnEleven, npcId);
    const second = decision.createOwnedProjection(turnEleven, npcId);
    assert.deepEqual(first.relevantMemories, second.relevantMemories);
    assert.ok(first.relevantMemories.length <= decision.MAX_RELEVANT_MEMORIES);
    assert.ok(first.relevantMemories.length < turnEleven.npcs[npcId].memories.length);
    assert.ok(first.relevantMemories.every((memory) => memory.ownerId === npcId && memory.turn <= 11));
  }

  for (const turn of result.turns) {
    const boundary = engine.restoreBoundary(result.state, turn.turn - 1);
    for (const intent of turn.intents) {
      const suppliedIds = new Set(decision.createOwnedProjection(boundary, intent.actorId).relevantMemories.map((memory) => memory.id));
      assert.ok(intent.citedMemoryIds.length <= 6);
      assert.ok(intent.citedMemoryIds.every((memoryId) => suppliedIds.has(memoryId)), `${intent.id} cites memory outside recall`);
    }
  }
});

test("Four autonomous NPC agents replay all twelve Original turns without predetermined intent input", () => {
  const autonomousScenario = JSON.parse(JSON.stringify(scenario));
  delete autonomousScenario.originalIntents;
  const result = decision.runAutonomousOriginal(autonomousScenario, createAutonomousAgents());
  const recorded = loadRecordedData();

  assert.equal(result.state.turn, 12);
  assert.equal(result.state.status, "completed");
  assert.equal(result.turns.length, 12);
  for (const turn of result.turns) {
    assert.equal(turn.intents.length, 4);
    assert.equal(new Set(turn.intents.map((intent) => intent.actorId)).size, 4);
    assert.ok(turn.intents.every((intent) => intent.chosenAtTurn === turn.turn - 1));
    assert.ok(turn.intents.every((intent) => intent.rationale && intent.servedGoalId));

    const recordedActions = Array.from(recorded.events)
      .filter((event) => event.turn === turn.turn && event.action)
      .map((event) => [event.actor, event.action])
      .sort();
    const autonomousActions = turn.intents.map((intent) => [intent.actorId, intent.action]).sort();
    assert.deepEqual(autonomousActions, recordedActions, `turn ${turn.turn} action families differ from the Original`);
  }
  assert.deepEqual({
    medical: result.state.outcome.medical,
    truth: result.state.outcome.truth,
    social: result.state.outcome.social
  }, { medical: "Lost", truth: "Exposed", social: "Fractured" });
});

test("Autonomous policies change decisions when supplied owned beliefs change", () => {
  const agents = createAutonomousAgents();
  const start = engine.createInitialWorld(scenario);
  const maraProjection = decision.createOwnedProjection(start, "mara");
  const originalMara = parse(agents.mara.decide(maraProjection));
  const changedMara = JSON.parse(JSON.stringify(maraProjection));
  changedMara.self.beliefs["fact-case-spare-key"] = {
    propositionId: "fact-case-spare-key",
    stance: "believes-true",
    confidence: 90,
    supportingMemoryIds: ["mem-start-mara-key"],
    updatedTurn: 0
  };

  assert.equal(originalMara.action, "Investigate");
  assert.equal(parse(agents.mara.decide(changedMara)).action, "Move");

  const seraProjection = decision.createOwnedProjection(start, "sera");
  const originalSera = parse(agents.sera.decide(seraProjection));
  const changedSera = JSON.parse(JSON.stringify(seraProjection));
  changedSera.self.beliefs["claim-sera-does-not-know-location"] = { propositionId: "claim-sera-does-not-know-location", stance: "believes-true", confidence: 100 };
  changedSera.self.beliefs["claim-mara-not-responsible"] = { propositionId: "claim-mara-not-responsible", stance: "believes-true", confidence: 70 };
  assert.equal(originalSera.action, "Communicate");
  assert.equal(parse(agents.sera.decide(changedSera)).action, "Move");
  assert.equal(parse(agents.sera.decide(changedSera)).targetLocationId, "storehouse");
});

test("Malformed agent output retries from the frozen boundary and leaves no partial history", () => {
  const base = createAutonomousAgents();
  const initial = engine.createInitialWorld(scenario);
  const completedTurnOne = decision.decideAndResolveTurn(initial, base).state;
  const normal = decision.decideAndResolveTurn(completedTurnOne, base);
  let seraCalls = 0;
  const agents = Object.assign({}, base, {
    sera: {
      decide(projection, context) {
        seraCalls += 1;
        if (context.attempt === 1) return "{not valid JSON";
        return base.sera.decide(projection, context);
      }
    }
  });
  const retried = decision.decideAndResolveTurn(completedTurnOne, agents, { maxAttempts: 2 });

  assert.equal(seraCalls, 2);
  assert.equal(retried.audit.attempts.length, 2);
  assert.equal(retried.audit.attempts[0].status, "malformed-output");
  assert.equal(retried.audit.attempts[0].boundaryTurn, 1);
  assert.equal(retried.audit.attempts[1].status, "completed");
  assert.deepEqual(retried.state, normal.state);
  assert.equal(completedTurnOne.turn, 1);
  assert.equal(completedTurnOne.events.filter((event) => event.turn === 2).length, 0);
  assert.ok(!retried.state.events.some((event) => /not valid JSON/.test(event.description)));
});

test("Rejected owned-context output is distinct from malformed output and retries safely", () => {
  const base = createAutonomousAgents();
  const initial = engine.createInitialWorld(scenario);
  const agents = Object.assign({}, base, {
    dain: {
      decide(projection, context) {
        if (context.attempt > 1) return base.dain.decide(projection, context);
        const invalid = parse(base.dain.decide(projection, context));
        invalid.citedMemoryIds = ["mem-start-sera-orin-order"];
        return JSON.stringify(invalid);
      }
    }
  });
  const result = decision.decideAndResolveTurn(initial, agents, { maxAttempts: 2 });
  assert.equal(result.audit.attempts[0].status, "rejected-output");
  assert.match(result.audit.attempts[0].error.message, /outside the supplied relevant set/);
  assert.equal(result.audit.attempts[1].status, "completed");
  assert.equal(result.state.turn, 1);
});

test("Output validation prevents an NPC from asserting hidden facts absent from its projection", () => {
  const base = createAutonomousAgents();
  const initial = engine.createInitialWorld(scenario);
  const agents = Object.assign({}, base, {
    mara: {
      decide(projection, context) {
        if (context.attempt > 1) return base.mara.decide(projection, context);
        return candidate(projection, "mara", "Communicate", {
          audience: "public",
          factIds: ["fact-orin-ordered-sera"]
        });
      }
    }
  });
  const result = decision.decideAndResolveTurn(initial, agents, { maxAttempts: 2 });
  assert.equal(result.audit.attempts[0].status, "rejected-output");
  assert.match(result.audit.attempts[0].error.message, /without an owned belief and recalled supporting memory/);
  assert.equal(result.audit.attempts[1].status, "completed");
  assert.equal(result.state.publicRecord.establishedFactIds.includes("fact-orin-ordered-sera"), false);
});

test("A legal structured intent invalidated during resolution becomes a World failed event without retry", () => {
  const initial = engine.createInitialWorld(scenario);
  const agents = {
    mara: { decide: (projection) => candidate(projection, "mara", "Wait") },
    dain: { decide: (projection) => candidate(projection, "dain", "Communicate", { audience: "private", targetId: "orin", claimIds: ["claim-test"] }) },
    sera: { decide: (projection) => candidate(projection, "sera", "Wait") },
    orin: { decide: (projection) => candidate(projection, "orin", "Move", { targetLocationId: "clinic" }) }
  };
  const result = decision.decideAndResolveTurn(initial, agents);
  const failure = result.state.events.find((event) => event.id === "evt-world-test-dain-t1-communicate-failed");

  assert.equal(result.audit.attempts.length, 1);
  assert.equal(result.audit.attempts[0].status, "completed");
  assert.deepEqual(result.audit.attempts[0].resolutionInvalid.map((entry) => entry.actorId), ["dain"]);
  assert.ok(failure);
  assert.equal(failure.category, "Failed action");
  assert.equal(result.state.publicRecord.claims.length, 0);
  assert.equal(initial.turn, 0);
});

test("Exhausted retries report failure while preserving the last completed boundary", () => {
  const initial = engine.createInitialWorld(scenario);
  const base = createAutonomousAgents();
  const agents = Object.assign({}, base, { mara: { decide: () => "[]" } });
  assert.throws(
    () => decision.decideAndResolveTurn(initial, agents, { maxAttempts: 2 }),
    (error) => {
      assert.equal(error.name, "DecisionTurnError");
      assert.equal(error.audit.attempts.length, 2);
      assert.ok(error.audit.attempts.every((attempt) => attempt.boundaryTurn === 0 && attempt.status === "malformed-output"));
      return true;
    }
  );
  assert.equal(initial.turn, 0);
  assert.equal(initial.events.length, 1);
  assert.ok(Object.isFrozen(initial));
});

test("Autonomous replay is deterministic and parity-matches Recorded observables at all boundaries", () => {
  const first = decision.runAutonomousOriginal(scenario, createAutonomousAgents());
  const second = decision.runAutonomousOriginal(scenario, createAutonomousAgents());
  const recorded = loadRecordedData();
  assert.deepEqual(first, second);

  for (let turn = 0; turn <= 12; turn += 1) {
    const state = engine.restoreBoundary(first.state, turn);
    const world = engine.observableState(state);
    const authored = recorded.snapshots[turn];
    assert.equal(world.turnsRemaining, authored.turnsRemaining, `turn ${turn} clock differs`);
    assert.equal(world.patient, authored.patient.startsWith("Lost") ? "Lost" : "Untreated", `turn ${turn} patient differs`);
    for (const locationId of ["clinic", "square", "storehouse"]) {
      assert.deepEqual(world.locations[locationId].slice().sort(), Array.from(authored.locations[locationId]).sort(), `turn ${turn} ${locationId} differs`);
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
  assert.equal(first.state.outcome.medical, recorded.originalOutcome.labels.medical.label);
  assert.equal(first.state.outcome.truth, recorded.originalOutcome.labels.truth.label);
  assert.equal(first.state.outcome.social, recorded.originalOutcome.labels.social.label);
});
