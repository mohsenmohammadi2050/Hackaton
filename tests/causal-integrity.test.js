"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const scenario = require(path.join(root, "src/data/world-scenario.js"));
const world = require(path.join(root, "src/engine/world-engine.js"));
const decision = require(path.join(root, "src/ai/decision-layer.js"));
const providers = require(path.join(root, "src/ai/decision-providers.js"));
const intervention = require(path.join(root, "src/engine/intervention-layer.js"));
const timeline = require(path.join(root, "src/engine/timeline-fork-engine.js"));
const integrity = require(path.join(root, "src/engine/timeline-integrity.js"));

const PREVIOUS_RUN_SHA256 = "f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7";
const PHASE_7_1_RUN_SHA256 = "6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function provider() {
  return providers.createProvider({ type: "deterministic" });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function primaryGoal(actorId) {
  return scenario.npcs[actorId].goals.find((goal) => goal.priority === "primary").id;
}

function intent(id, actorId, action, details = {}) {
  return Object.assign({
    id,
    actorId,
    action,
    chosenAtTurn: 0,
    servedGoalId: primaryGoal(actorId),
    rationale: `Phase 7.1 ${action} regression intent for ${actorId}.`,
    citedMemoryIds: []
  }, details);
}

function communicationState(details) {
  return world.resolveTurn(world.createInitialWorld(scenario), [
    intent("integrity-t01-mara-wait", "mara", "Wait"),
    intent("integrity-t01-dain-communication", "dain", "Communicate", details),
    intent("integrity-t01-sera-wait", "sera", "Wait"),
    intent("integrity-t01-orin-wait", "orin", "Wait")
  ]);
}

function informationRequest(turn, propositionId = "fact-case-spare-key") {
  return {
    id: `integrity-note-t${String(turn).padStart(2, "0")}`,
    category: "Information",
    boundaryTurn: turn,
    payload: {
      recipientId: "mara",
      propositionId,
      truthStatus: "true-evidence",
      beliefStance: "believes-true",
      confidence: 90,
      description: "An external note supplies Mara with a validated causal-integrity test fact."
    }
  };
}

function itemTransferRequest(turn = 9) {
  return {
    id: `integrity-transfer-t${String(turn).padStart(2, "0")}`,
    category: "ItemTransfer",
    boundaryTurn: turn,
    payload: {
      itemId: "antidote",
      fromId: "orin",
      toId: "sera",
      description: "An external counterfactual transfers Orin's antidote to co-located Sera."
    }
  };
}

function environmentalRequest(turn = 0) {
  return {
    id: `integrity-smoke-t${String(turn).padStart(2, "0")}`,
    category: "EnvironmentalEvent",
    boundaryTurn: turn,
    payload: {
      locationId: "clinic",
      conditionId: "condition-smoke",
      conditionState: "active",
      description: "Smoke fills the Clinic and is directly observable there."
    }
  };
}

function completedSession(forkTurn = 0) {
  let session = timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider()));
  session = timeline.forkAlternate(session, { turn: forkTurn });
  session = timeline.applyAlternateIntervention(session, informationRequest(forkTurn));
  return timeline.runAlternate(session, provider());
}

function forkedSession(turn) {
  const original = timeline.createOriginalTimeline(scenario, provider());
  return timeline.forkAlternate(timeline.createTimelineSession(original), { turn });
}

function intervenedSession(category) {
  const turn = category === "ItemTransfer" ? 9 : 0;
  const request = category === "Information"
    ? informationRequest(turn)
    : category === "ItemTransfer"
      ? itemTransferRequest(turn)
      : environmentalRequest(turn);
  return timeline.applyAlternateIntervention(forkedSession(turn), request);
}

let cachedCompletedSession;
function reviewSession() {
  if (!cachedCompletedSession) cachedCompletedSession = completedSession(0);
  return cachedCompletedSession;
}

function allMemories(state) {
  return Object.values(state.npcs).flatMap((npc) => npc.memories);
}

test("Private claims, facts, and confessions update only participant state and never the public record", () => {
  const privateClaim = communicationState({ audience: "private", targetId: "sera", claimIds: ["claim-private-test"] });
  const claimEvent = privateClaim.events.find((event) => event.id === "evt-world-integrity-t01-dain-communication");
  assert.equal(privateClaim.publicRecord.claims.length, 0);
  assert.deepEqual(claimEvent.witnessIds, ["dain", "sera"]);
  assert.ok(privateClaim.npcs.dain.beliefs["claim-private-test"]);
  assert.ok(privateClaim.npcs.sera.beliefs["claim-private-test"]);
  assert.equal(privateClaim.npcs.mara.beliefs["claim-private-test"], undefined);
  assert.equal(privateClaim.npcs.orin.beliefs["claim-private-test"], undefined);

  const privateFact = communicationState({ audience: "private", targetId: "sera", factIds: ["fact-case-spare-key"] });
  assert.deepEqual(privateFact.publicRecord.evidenceIds, []);
  assert.ok(privateFact.npcs.dain.beliefs["fact-case-spare-key"]);
  assert.ok(privateFact.npcs.sera.beliefs["fact-case-spare-key"]);

  const privateConfession = communicationState({
    audience: "private",
    targetId: "sera",
    confessionFactIds: ["fact-sera-moved-antidote"]
  });
  const confessionEvent = privateConfession.events.find((event) => event.id === "evt-world-integrity-t01-dain-communication");
  assert.deepEqual(privateConfession.publicRecord.establishedFactIds, []);
  assert.equal(privateConfession.publicRecord.falseConsensus, false);
  assert.equal(confessionEvent.category, "Confession");
  assert.equal(confessionEvent.visibility, "private");
  assert.match(confessionEvent.description, /private confession/);
  assert.doesNotMatch(confessionEvent.description, /publicly|public confession/);
  assert.equal(privateConfession.npcs.sera.trust.dain, -15);

  let privateEnding = world.createInitialWorld(scenario);
  for (let turn = 1; turn <= 10; turn += 1) privateEnding = world.resolveTurn(privateEnding, scenario.originalIntents[turn]);
  const privateTurnEleven = scenario.originalIntents[11].map((entry) => entry.actorId === "sera"
    ? Object.assign({}, entry, { audience: "private", targetId: "mara" })
    : entry);
  privateEnding = world.resolveTurn(privateEnding, privateTurnEleven);
  privateEnding = world.resolveTurn(privateEnding, scenario.originalIntents[12]);
  assert.deepEqual(privateEnding.publicRecord.establishedFactIds, []);
  assert.notEqual(privateEnding.outcome.truth, "Exposed");
});

test("Public claim, fact, and confession equivalents still mutate the public record", () => {
  const publicClaim = communicationState({ audience: "public", claimIds: ["claim-public-test"] });
  assert.equal(publicClaim.publicRecord.claims.length, 1);
  assert.equal(publicClaim.publicRecord.claims[0].claimId, "claim-public-test");

  const publicFact = communicationState({ audience: "public", factIds: ["fact-case-spare-key"] });
  assert.deepEqual(publicFact.publicRecord.evidenceIds, ["fact-case-spare-key"]);

  const publicConfession = communicationState({ audience: "public", confessionFactIds: ["fact-sera-moved-antidote"] });
  const confessionEvent = publicConfession.events.find((event) => event.id === "evt-world-integrity-t01-dain-communication");
  assert.deepEqual(publicConfession.publicRecord.establishedFactIds, ["fact-sera-moved-antidote"]);
  assert.match(confessionEvent.description, /public confession/);
});

test("An empty confessionFactIds array behaves exactly like an ordinary communication", () => {
  const state = communicationState({ audience: "public", claimIds: ["claim-ordinary-test"], confessionFactIds: [] });
  const event = state.events.find((candidate) => candidate.id === "evt-world-integrity-t01-dain-communication");
  assert.equal(event.category, "Communication");
  assert.match(event.description, /public statement/);
  assert.doesNotMatch(event.description, /confess/i);
  assert.equal(state.npcs.sera.trust.dain, -30);
  assert.equal(state.npcs.orin.trust.dain, 30);
  assert.deepEqual(state.publicRecord.establishedFactIds, []);
  assert.equal(state.events.some((candidate) => candidate.rationale && candidate.rationale.includes("risky confession")), false);
});

test("Interventions are external causal roots with explicit boundary placement", () => {
  const initial = world.createInitialWorld(scenario);
  const changed = intervention.applyIntervention(initial, informationRequest(0));
  const event = changed.events.find((candidate) => candidate.eventType === "world.intervention.information.v1");
  const consequence = changed.events.find((candidate) => candidate.id === `${event.id}-information-update`);
  assert.deepEqual(event.causes, []);
  assert.equal(event.appliedAtBoundaryId, initial.boundaries.at(-1).id);
  assert.ok(changed.boundaries.some((boundary) => boundary.id === event.appliedAtBoundaryId));
  assert.ok(consequence.causes.includes(event.id));
});

test("Explicit same-turn boundary classifications select pre- and post-intervention state", () => {
  const turnOne = world.resolveTurn(world.createInitialWorld(scenario), scenario.originalIntents[1]);
  const changed = intervention.applyIntervention(turnOne, informationRequest(1, "fact-antidote-storehouse"));
  const before = world.restoreBoundary(changed, 1, "turn-close");
  const after = world.restoreBoundary(changed, 1, "post-intervention");
  const defaultRestoration = world.restoreBoundary(changed, 1);

  assert.equal(before.boundaries.at(-1).classification, "turn-close");
  assert.equal(after.boundaries.at(-1).classification, "post-intervention");
  assert.equal(before.events.some((event) => event.eventType === "world.intervention.information.v1"), false);
  assert.equal(after.events.some((event) => event.eventType === "world.intervention.information.v1"), true);
  assert.equal(before.npcs.mara.beliefs["fact-antidote-storehouse"], undefined);
  assert.equal(after.npcs.mara.beliefs["fact-antidote-storehouse"].confidence, 90);
  assert.deepEqual(defaultRestoration, after);
});

test("Source alignment is exact for copied prefixes and absent for divergent post-fork intents", () => {
  const original = timeline.createOriginalTimeline(scenario, provider());
  const copied = timeline.forkAlternate(timeline.createTimelineSession(original), { turn: 2 });
  const first = completedSession(0);
  const second = completedSession(0);
  const originalIntentIds = new Set(original.turns.flatMap((turn) => turn.intents.map((entry) => entry.id)));
  const originalEventIds = new Set(original.state.events.map((event) => event.id));
  const originalMemoryIds = new Set(allMemories(original.state).map((memory) => memory.id));
  const originalBoundaryIds = new Set(original.state.boundaries.map((boundary) => boundary.id));
  const prefixIntents = copied.alternate.turns.flatMap((turn) => turn.intents);
  const divergentIntents = first.alternate.turns.flatMap((turn) => turn.intents);

  assert.ok(prefixIntents.every((entry) => entry.sourceId && originalIntentIds.has(entry.sourceId)));
  assert.ok(divergentIntents.length > 0 && divergentIntents.every((entry) => entry.sourceId == null));
  assert.ok(copied.alternate.state.events.every((event) => event.sourceId && originalEventIds.has(event.sourceId)));
  assert.ok(allMemories(copied.alternate.state).every((memory) => memory.sourceId && originalMemoryIds.has(memory.sourceId)));
  assert.ok(copied.alternate.state.boundaries.every((boundary) => boundary.sourceId && originalBoundaryIds.has(boundary.sourceId)));

  const alignment = (session) => ({
    events: session.alternate.state.events.map((event) => [event.id, event.sourceId || null]),
    memories: allMemories(session.alternate.state).map((memory) => [memory.id, memory.sourceId || null]),
    boundaries: session.alternate.state.boundaries.map((boundary) => [boundary.id, boundary.sourceId || null]),
    intents: session.alternate.turns.flatMap((turn) => turn.intents.map((entry) => [entry.id, entry.sourceId || null]))
  });
  assert.deepEqual(alignment(first), alignment(second));
  assert.equal(integrity.validateTimelineSession(copied).valid, true);
  assert.equal(integrity.validateTimelineSession(first).valid, true);
});

test("Exact source validation rejects an Alternate event linked to an unrelated existing Original event", () => {
  const session = clone(forkedSession(2));
  session.alternate.state.events[0].sourceId = session.original.state.events[1].id;
  assert.throws(() => integrity.validateTimelineSession(session), /not the deterministic clone/);
});

test("Exact source validation rejects an Alternate memory linked to an unrelated existing Original memory", () => {
  const session = clone(forkedSession(2));
  const memory = allMemories(session.alternate.state).find((entry) => entry.ownerId === "mara");
  const unrelated = allMemories(session.original.state).find((entry) => entry.ownerId === "mara" && entry.id !== memory.sourceId);
  memory.sourceId = unrelated.id;
  for (const boundary of session.alternate.state.boundaries) {
    const copy = boundary.world.npcs.mara.memories.find((entry) => entry.id === memory.id);
    if (copy) copy.sourceId = unrelated.id;
  }
  assert.throws(() => integrity.validateTimelineSession(session), /not the deterministic clone/);
});

test("Exact source validation rejects an Alternate intent linked to another valid Original intent", () => {
  const session = clone(forkedSession(2));
  const alternateIntent = session.alternate.turns[0].intents.find((entry) => entry.actorId === "mara");
  const unrelated = session.original.turns[1].intents.find((entry) => entry.actorId === "mara");
  alternateIntent.sourceId = unrelated.id;
  assert.throws(() => integrity.validateTimelineSession(session), /not the deterministic clone/);
});

test("Exact source validation rejects an Alternate boundary linked to a different Original boundary", () => {
  const session = clone(forkedSession(2));
  session.alternate.state.boundaries[0].sourceId = session.original.state.boundaries[1].id;
  assert.throws(() => integrity.validateTimelineSession(session), /not the deterministic clone/);
});

test("Causal validation rejects an event that causes itself", () => {
  const session = clone(reviewSession());
  const event = session.alternate.state.events.find((entry) => entry.causes.length > 0);
  event.causes = [event.id];
  assert.throws(() => integrity.validateTimelineSession(session), /cannot cause itself/);
});

test("Causal validation rejects a two-event cycle", () => {
  const session = clone(reviewSession());
  const first = session.alternate.state.events[1];
  const second = session.alternate.state.events[2];
  first.causes = [second.id];
  second.causes = [first.id];
  assert.throws(() => integrity.validateTimelineSession(session), /forward causal reference/);
});

test("Causal validation rejects a forward cause reference", () => {
  const session = clone(reviewSession());
  session.alternate.state.events[0].causes = [session.alternate.state.events[1].id];
  assert.throws(() => integrity.validateTimelineSession(session), /forward causal reference/);
});

test("Outcome validation rejects attribution to its own Branch outcome event", () => {
  const session = clone(reviewSession());
  const state = session.alternate.state;
  const outcomeEvent = state.events.find((event) => event.category === "Branch outcome");
  state.outcome.attribution.medicalEventIds[0] = outcomeEvent.id;
  state.boundaries.at(-1).world.outcome.attribution.medicalEventIds[0] = outcomeEvent.id;
  assert.throws(() => integrity.validateTimelineSession(session), /cannot attribute itself/);
});

test("Causal validation rejects duplicate cause identities", () => {
  const session = clone(reviewSession());
  const event = session.alternate.state.events.find((entry) => entry.causes.length > 0);
  event.causes.push(event.causes[0]);
  assert.throws(() => integrity.validateTimelineSession(session), /duplicate causal predecessors/);
});

test("Event citation validation rejects a future memory owned by the same actor", () => {
  const session = clone(reviewSession());
  const event = session.alternate.state.events.find((entry) => entry.actorId && entry.citedMemoryIds.length > 0);
  const future = allMemories(session.alternate.state).find((memory) => memory.ownerId === event.actorId && memory.turn > event.turn);
  assert.ok(future);
  event.citedMemoryIds[0] = future.id;
  assert.throws(() => integrity.validateTimelineSession(session), /cites future memory|before it exists/);
});

test("Intent citation validation rejects a memory created after chosenAtTurn", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  const intentRecord = session.original.turns[0].intents.find((entry) => entry.actorId === "mara");
  const future = allMemories(session.original.state).find((memory) => memory.ownerId === "mara" && memory.turn > intentRecord.chosenAtTurn);
  assert.ok(future);
  intentRecord.citedMemoryIds[0] = future.id;
  assert.throws(() => integrity.validateTimelineSession(session), /cites future memory/);
});

test("Information, ItemTransfer, and EnvironmentalEvent sessions all satisfy category-aware intervention validation", () => {
  for (const category of ["Information", "ItemTransfer", "EnvironmentalEvent"]) {
    const session = intervenedSession(category);
    assert.equal(integrity.validateTimelineSession(session).valid, true, `${category} session failed validation`);
  }
});

test("Intervention placement rejects a post-intervention boundary", () => {
  const session = clone(intervenedSession("Information"));
  const event = session.alternate.state.events.find((entry) => entry.external);
  event.appliedAtBoundaryId = session.alternate.state.boundaries.find((boundary) => boundary.classification === "post-intervention").id;
  assert.throws(() => integrity.validateTimelineSession(session), /cannot be applied at a post-intervention boundary/);
});

test("Intervention placement rejects a boundary whose event count is not immediately before the intervention", () => {
  const session = clone(intervenedSession("Information"));
  const applied = session.alternate.state.boundaries.find((boundary) => boundary.classification === "initial");
  applied.eventCount += 1;
  assert.throws(() => integrity.validateTimelineSession(session), /is not immediately after boundary/);
});

test("Information intervention validation rejects a missing authoritative memory/belief consequence", () => {
  const session = clone(intervenedSession("Information"));
  const event = session.alternate.state.events.find((entry) => entry.external);
  const consequence = session.alternate.state.events.find((entry) => entry.category === "Memory and belief update" && entry.causes.includes(event.id));
  consequence.causes = [];
  assert.throws(() => integrity.validateTimelineSession(session), /requires exactly one memory\/belief consequence/);
});

test("Boundary validation rejects backward turn ordering", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  [session.original.state.boundaries[1], session.original.state.boundaries[2]] = [session.original.state.boundaries[2], session.original.state.boundaries[1]];
  assert.throws(() => integrity.validateTimelineSession(session), /moves turn order backward/);
});

test("Boundary validation requires exactly one initial boundary at turn zero", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  session.original.state.boundaries[1].classification = "initial";
  assert.throws(() => integrity.validateTimelineSession(session), /Initial boundary .* must be the first boundary at turn 0|exactly one initial boundary/);
});

test("Boundary validation rejects duplicate turn-close boundaries", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  const duplicate = session.original.state.boundaries[2];
  duplicate.turn = 1;
  duplicate.id = "boundary-world-original-v1-t01-s2";
  duplicate.world.turn = 1;
  assert.throws(() => integrity.validateTimelineSession(session), /duplicate turn-close boundaries/);
});

test("Boundary validation requires post-intervention to immediately follow its base boundary", () => {
  const session = clone(intervenedSession("Information"));
  const post = session.alternate.state.boundaries.find((boundary) => boundary.classification === "post-intervention");
  post.id = post.id.replace(/-s2$/, "-s1");
  session.alternate.state.boundaries = [post];
  assert.throws(() => integrity.validateTimelineSession(session), /must immediately follow/);
});

test("Boundary validation rejects a non-advancing event count", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  session.original.state.boundaries[1].eventCount = session.original.state.boundaries[0].eventCount;
  assert.throws(() => integrity.validateTimelineSession(session), /does not advance authoritative event count/);
});

test("Boundary validation requires the latest boundary to represent current state", () => {
  const session = clone(timeline.createTimelineSession(timeline.createOriginalTimeline(scenario, provider())));
  session.original.state.boundaries.at(-1).world.patient.status = "Untreated";
  assert.throws(() => integrity.validateTimelineSession(session), /does not represent current patient state/);
});

test("The versioned graph validator accepts valid timelines and rejects corrupted references", () => {
  const valid = completedSession(0);
  assert.equal(integrity.INTEGRITY_SCHEMA_VERSION, "1.1.0");
  assert.equal(integrity.validateTimelineSession(valid).valid, true);

  const corruptions = [
    (session) => { session.alternate.state.events.find((event) => event.causes.length).causes[0] = "evt-world-foreign--missing"; },
    (session) => { allMemories(session.alternate.state)[0].originEventId = "evt-world-foreign--missing"; },
    (session) => { session.alternate.state.events.find((event) => event.createdMemoryIds.length).createdMemoryIds[0] = "mem-world-foreign--missing"; },
    (session) => { session.alternate.state.events.find((event) => event.citedMemoryIds.length).citedMemoryIds[0] = "mem-world-foreign--missing"; },
    (session) => { Object.values(session.alternate.state.npcs.mara.beliefs)[0].supportingMemoryIds[0] = "mem-world-foreign--missing"; },
    (session) => { session.alternate.state.publicRecord.claims[0].eventId = "evt-world-foreign--missing"; },
    (session) => { session.alternate.state.boundaries.at(-1).eventCount -= 1; },
    (session) => { session.alternate.state.events.find((event) => event.external).appliedAtBoundaryId = "boundary-foreign-t00-s1"; },
    (session) => { session.alternate.state.outcome.attribution.medicalEventIds[0] = "evt-world-foreign--missing"; },
    (session) => { session.alternate.state.events.find((event) => event.sourceId).sourceId = allMemories(session.original.state)[0].id; }
  ];
  for (const corrupt of corruptions) {
    const candidate = clone(valid);
    corrupt(candidate);
    assert.throws(() => integrity.validateTimelineSession(candidate), integrity.TimelineIntegrityError);
  }

  const shared = clone(valid);
  shared.alternate.state.npcs.mara.trust = shared.original.state.npcs.mara.trust;
  shared.alternate.state.boundaries.at(-1).world.npcs.mara.trust = shared.original.state.npcs.mara.trust;
  assert.throws(() => integrity.validateTimelineSession(shared), /share a mutable object/);
});

test("Every completed outcome has deterministic branch-local causal support", () => {
  const session = completedSession(0);
  for (const timelineRecord of [session.original, session.alternate]) {
    const state = timelineRecord.state;
    const localEvents = new Set(state.events.map((event) => event.id));
    const outcomeEvent = state.events.find((event) => event.category === "Branch outcome");
    for (const references of Object.values(state.outcome.attribution)) {
      assert.ok(references.length > 0);
      assert.ok(references.every((eventId) => localEvents.has(eventId)));
      assert.ok(references.every((eventId) => outcomeEvent.causes.includes(eventId)));
    }
  }
});

test("The corrected Original replay is byte-identical across runs and records both hash policies", () => {
  const first = decision.runAutonomousOriginal(scenario, provider());
  const second = decision.runAutonomousOriginal(scenario, provider());
  assert.notEqual(PREVIOUS_RUN_SHA256, PHASE_7_1_RUN_SHA256);
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.equal(sha256(JSON.stringify(first)), PHASE_7_1_RUN_SHA256);
  assert.deepEqual({
    medical: first.state.outcome.medical,
    truth: first.state.outcome.truth,
    social: first.state.outcome.social
  }, { medical: "Lost", truth: "Exposed", social: "Fractured" });
});
