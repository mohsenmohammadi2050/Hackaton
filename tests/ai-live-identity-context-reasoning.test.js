"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const scenario = require("../world-scenario");
const world = require("../world-engine");
const decision = require("../decision-layer");
const providers = require("../decision-providers");
const aiOwned = require("../ai-owned-projection");
const aiDecision = require("../ai-decision-layer");
const aiSessionApi = require("../ai-live-session-adapter");
const server = require("../server");
const presentation = require("../live-presentation");
const demo = require("../demo-path-config");

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function deepFreeze(value) { if (!value || typeof value !== "object" || Object.isFrozen(value)) return value; Object.freeze(value); Object.values(value).forEach(deepFreeze); return value; }

function actionPlan(actorId, turn) {
  if (actorId === "mara") return { action: "Investigate", subject: "empty-case" };
  if (actorId === "dain") return { action: "Investigate", subject: "square" };
  if (actorId === "sera") return { action: "Move", targetLocationId: turn === 0 ? "storehouse" : "square" };
  return { action: "Move", targetLocationId: turn === 0 ? "storehouse" : "square" };
}

function candidate(request, plan = actionPlan(request.actorId, request.projection.turn), overrides = {}) {
  return Object.assign({
    id: "model-reused-id",
    actorId: request.actorId,
    action: plan.action,
    chosenAtTurn: request.projection.turn,
    servedGoalId: request.projection.self.goals[0].id,
    rationale: `${request.actorId} chooses ${plan.action} with context from completed turn ${request.projection.turn}.`,
    citedMemoryIds: []
  }, plan, overrides);
}

function provider(captures = [], planner = actionPlan) {
  return Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    async decide(request) {
      captures.push(deepClone(request));
      return JSON.stringify(candidate(request, planner(request.actorId, request.projection.turn, request)));
    }
  });
}

async function runRepeatedTwoTurns(captures = []) {
  const selectedProvider = provider(captures);
  const first = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), selectedProvider);
  const second = await aiDecision.decideAndResolveTurn(first.state, selectedProvider);
  return { first, second };
}

function aiProjection(state, actorId) {
  return aiOwned.createAiOwnedProjection(state, actorId, decision.createOwnedProjection(state, actorId));
}

function providerRequest(projection, actorId = projection.self.id, attempt = 1) {
  return { protocol: decision.PROVIDER_PROTOCOL, actorId, projection, attempt, outputContract: aiDecision.OUTPUT_CONTRACT, validationFeedback: null };
}

function providerConfig(overrides = {}) {
  return Object.assign({
    baseUrl: "https://openrouter.ai/api/v1", apiKey: "secret-key", model: "provider/reasoning-model",
    timeoutMs: 100, maxRetries: 0, structuredOutputMode: "json_schema", reasoningEnabled: false,
    reasoningConfigurationValid: true, reasoningEffort: "medium", diagnosticLogging: false
  }, overrides);
}

function responseFor(output, extras = {}) {
  return { ok: true, status: 200, text: async () => JSON.stringify(Object.assign({ choices: [{ message: { content: JSON.stringify(output) } }] }, extras)) };
}

test("consecutive repeated Investigate actions resolve with distinct queryable event identities", async () => {
  const { second } = await runRepeatedTwoTurns();
  const events = second.state.events.filter((event) => event.actorId === "dain" && event.action === "Investigate");
  assert.deepEqual(events.map((event) => event.id), [
    "evt-world-ai-t01-dain-investigate-square",
    "evt-world-ai-t02-dain-investigate-square"
  ]);
  assert.ok(events.every((event) => second.state.events.find((candidateEvent) => candidateEvent.id === event.id) === event));
});

test("identical reruns produce identical collision-safe event identities", async () => {
  const first = await runRepeatedTwoTurns();
  const second = await runRepeatedTwoTurns();
  assert.deepEqual(first.second.state.events.map((event) => event.id), second.second.state.events.map((event) => event.id));
});

test("the same semantic action in non-consecutive turns does not collide", async () => {
  const planner = (actorId, turn) => actorId === "dain" && turn !== 1 ? { action: "Investigate", subject: "square" } : { action: "Wait" };
  let state = world.createInitialWorld(scenario);
  for (let turn = 0; turn < 3; turn += 1) state = (await aiDecision.decideAndResolveTurn(state, provider([], planner))).state;
  assert.deepEqual(state.events.filter((event) => event.actorId === "dain" && event.action === "Investigate").map((event) => event.id), [
    "evt-world-ai-t01-dain-investigate-square", "evt-world-ai-t03-dain-investigate-square"
  ]);
});

test("same-turn same-action actors and multi-event consequences receive deterministic unique identities", async () => {
  const first = (await runRepeatedTwoTurns()).first.state;
  const investigations = first.events.filter((event) => event.action === "Investigate");
  assert.deepEqual(investigations.map((event) => event.actorId).sort(), ["dain", "mara"]);
  assert.equal(new Set(first.events.map((event) => event.id)).size, first.events.length);
  const consequence = first.events.find((event) => event.id === "evt-world-t01-information-update");
  assert.ok(consequence.causes.includes("evt-world-ai-t01-dain-investigate-square"));
  assert.ok(consequence.causes.includes("evt-world-ai-t01-mara-investigate-empty-case"));
});

test("fork prefixes retain exact source alignment and post-fork identities cannot collide", async () => {
  const adapter = aiSessionApi.createAiLiveSession(provider());
  await adapter.resolveNext("original");
  adapter.forkAt(0);
  adapter.applyIntervention(demo.intervention);
  await adapter.resolveNext("alternate");
  const session = adapter.getSession();
  const alternateStart = session.alternate.state.events.find((event) => event.sourceId === "evt-world-t00-start");
  assert.ok(alternateStart);
  assert.notEqual(alternateStart.id, alternateStart.sourceId);
  const combined = session.original.state.events.concat(session.alternate.state.events).map((event) => event.id);
  assert.equal(new Set(combined).size, combined.length);
  assert.equal(adapter.validate().valid, true);
  assert.ok(session.alternate.state.events.every((event) => (event.causes || []).every((cause) => session.alternate.state.events.some((candidateEvent) => candidateEvent.id === cause))));
});

test("a duplicate World event failure is atomic and classified as World resolution", async () => {
  const first = (await runRepeatedTwoTurns()).first.state;
  const corrupted = deepClone(first);
  corrupted.events.push(Object.assign({}, corrupted.events[0], { id: "evt-world-t02-information-update", turn: 1, order: 999 }));
  corrupted.boundaries.at(-1).eventCount = corrupted.events.length;
  const frozen = deepFreeze(corrupted);
  const before = JSON.stringify(frozen);
  await assert.rejects(aiDecision.decideAndResolveTurn(frozen, provider()), (error) => error.code === "WORLD_RESOLUTION_ERROR" && /Duplicate event identity evt-world-t02-information-update/.test(error.message) && /Completed Turn 1 remains safe/.test(error.message));
  assert.equal(JSON.stringify(frozen), before);
  assert.equal(presentation.classifyLiveError("WORLD_RESOLUTION_ERROR").title, "World resolution error");
});

test("retrying from the intact completed boundary resolves once without duplicating prior events", async () => {
  const first = (await runRepeatedTwoTurns()).first.state;
  const beforeIds = first.events.map((event) => event.id);
  const retried = await aiDecision.decideAndResolveTurn(first, provider());
  assert.equal(retried.state.turn, 2);
  assert.deepEqual(retried.state.events.slice(0, first.events.length).map((event) => event.id), beforeIds);
  assert.equal(new Set(retried.state.events.map((event) => event.id)).size, retried.state.events.length);
  assert.equal(retried.state.boundaries.filter((boundary) => boundary.turn === 2).length, 1);
});

test("model-supplied duplicate identity, wrong actor, and stale turn are overwritten by frozen-boundary metadata", async () => {
  const captures = [];
  const malicious = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) {
    captures.push(request);
    return JSON.stringify(candidate(request, actionPlan(request.actorId, request.projection.turn), { id: "same-id-every-time", actorId: "another-actor", chosenAtTurn: -100 }));
  } });
  const result = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), malicious);
  for (const intent of result.intents) {
    assert.equal(intent.actorId, intent.id.split("-")[2]);
    assert.equal(intent.chosenAtTurn, 0);
    assert.match(intent.id, /^ai-t01-/);
  }
  assert.equal(captures.length, 4);
});

test("system stamping does not weaken rejection of invented actions, targets, items, or memories", () => {
  const boundary = world.createInitialWorld(scenario);
  const projection = aiProjection(boundary, "mara");
  const base = candidate({ actorId: "mara", projection }, { action: "Wait" });
  assert.throws(() => decision.validateCandidate(aiDecision.stampSystemMetadata({ ...base, action: "Teleport" }, boundary, "mara"), projection), /Unknown action/);
  assert.throws(() => decision.validateCandidate(aiDecision.stampSystemMetadata({ ...base, action: "Move", targetLocationId: "moon" }, boundary, "mara"), projection), /not a legal destination/);
  assert.throws(() => decision.validateCandidate(aiDecision.stampSystemMetadata({ ...base, action: "Transfer", targetId: "ghost", itemId: "fabricated" }, boundary, "mara"), projection), /does not own/);
  assert.throws(() => decision.validateCandidate(aiDecision.stampSystemMetadata({ ...base, citedMemoryIds: ["another-private-memory"] }, boundary, "mara"), projection), /outside the supplied relevant set/);
});

test("real-AI-shaped repeated four-agent batches resolve through two completed turns", async () => {
  const { first, second } = await runRepeatedTwoTurns();
  assert.equal(first.intents.length, 4);
  assert.equal(second.intents.length, 4);
  assert.equal(second.state.turn, 2);
  assert.deepEqual(first.intents.map((intent) => intent.action), ["Investigate", "Investigate", "Move", "Move"]);
  assert.deepEqual(second.intents.map((intent) => intent.action), ["Investigate", "Investigate", "Move", "Move"]);
});

test("Turn 2 requests are built from the completed authoritative Turn 1 boundary for every actor", async () => {
  const captures = [];
  await runRepeatedTwoTurns(captures);
  const secondBatch = captures.filter((request) => request.projection.turn === 1);
  assert.equal(secondBatch.length, 4);
  for (const request of secondBatch) {
    assert.equal(request.projection.branchId, "world-original-v1");
    assert.equal(request.projection.turn, 1);
    assert.equal(request.projection.turnsRemaining, 11);
    assert.equal(request.projection.self.id, request.actorId);
    assert.equal(request.projection.previousAction.turn, 1);
    assert.equal(request.projection.previousResult.turn, 1);
  }
});

test("location, owned memory, belief, inventory, trust, and observations are fresh when changed", async () => {
  const { second } = await runRepeatedTwoTurns();
  const byActor = Object.fromEntries(second.projections.map((projection) => [projection.self.id, projection]));
  assert.equal(byActor.sera.currentLocation.id, "storehouse");
  assert.ok(byActor.sera.relevantMemories.some((memory) => memory.turn === 1 && memory.ownerId === "sera"));
  assert.equal(byActor.dain.self.beliefs["fact-square-no-physical-evidence"].updatedTurn, 1);
  assert.ok(byActor.dain.observations.some((observation) => observation.eventId === "evt-world-ai-t01-dain-investigate-square"));

  let authored = world.createInitialWorld(scenario);
  for (let turn = 1; turn <= 5; turn += 1) authored = world.resolveTurn(authored, scenario.originalIntents[turn]);
  assert.ok(aiProjection(authored, "orin").self.inventory.includes("antidote"));
  const turnTwo = world.restoreBoundary(authored, 2);
  assert.equal(aiProjection(turnTwo, "mara").self.trust.orin, -25);
});

test("previous semantic action and authoritative result include target, evidence, and resulting state", async () => {
  const { second } = await runRepeatedTwoTurns();
  const dain = second.projections.find((projection) => projection.self.id === "dain");
  assert.deepEqual(dain.previousAction.targetIds, ["square"]);
  assert.equal(dain.previousAction.action, "Investigate");
  assert.equal(dain.previousAction.servedGoalId, "goal-dain-identify-responsibility");
  assert.equal(dain.previousResult.status, "resolved");
  assert.equal(dain.previousResult.resultingLocationId, "square");
  assert.deepEqual(dain.previousResult.createdOwnedMemoryIds, ["mem-world-ai-t01-dain-investigate-square-dain"]);
  assert.match(dain.previousResult.description, /finds no hidden physical evidence/);
});

test("AI knowledge projection includes identity, traits, goals, premise, rules, legal vocabulary, and owned state", () => {
  const projection = aiProjection(world.createInitialWorld(scenario), "sera");
  assert.deepEqual({ name: projection.self.name, role: projection.self.role }, { name: "Sera Quill", role: "Courier" });
  assert.deepEqual(projection.self.traits, ["Observant", "Guilt-prone", "Evasive"]);
  assert.ok(projection.self.goals.every((goal) => goal.status === "active"));
  assert.match(projection.scenarioKnowledge.premise, /only antidote is missing/);
  assert.match(projection.scenarioKnowledge.urgency, /turn 12/);
  assert.deepEqual(projection.scenarioKnowledge.legalActionVocabulary, world.ACTIONS);
  assert.ok(projection.scenarioKnowledge.knownRules.some((rule) => /World resolves all four intents/.test(rule)));
  assert.ok(projection.relevantMemories.every((memory) => memory.ownerId === "sera"));
  assert.deepEqual(projection.self.inventory, []);
});

test("private memories and unwitnessed events never leak into another actor's later projection", async () => {
  const { second } = await runRepeatedTwoTurns();
  const dain = second.projections.find((projection) => projection.self.id === "dain");
  assert.equal(dain.relevantMemories.some((memory) => memory.ownerId !== "dain"), false);
  assert.equal(dain.relevantMemories.some((memory) => /Orin ordered Sera/.test(memory.description)), false);
  assert.equal(dain.observations.some((observation) => observation.eventId === "evt-world-ai-t01-mara-investigate-empty-case"), false);
});

test("projection fingerprints are deterministic and change exactly when sanitized owned context changes", async () => {
  const initial = aiProjection(world.createInitialWorld(scenario), "dain");
  const same = deepClone(initial);
  const { second } = await runRepeatedTwoTurns();
  const changed = second.projections.find((projection) => projection.self.id === "dain");
  assert.equal(server.projectionFingerprint(initial), server.projectionFingerprint(same));
  assert.notEqual(server.projectionFingerprint(initial), server.projectionFingerprint(changed));
});

test("a stale Turn 1 projection is not reused, while unresolved retries use one frozen boundary with fresh calls", async () => {
  const captures = [];
  const { first } = await runRepeatedTwoTurns(captures);
  assert.equal(captures.filter((request) => request.actorId === "dain")[0].projection.turn, 0);
  assert.equal(captures.filter((request) => request.actorId === "dain")[1].projection.turn, 1);

  let calls = 0;
  const retryCaptures = [];
  const retrying = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) {
    retryCaptures.push(request);
    if (request.actorId === "mara" && ++calls === 1) return "not-json";
    return JSON.stringify(candidate(request));
  } });
  await aiDecision.decideAndResolveTurn(first.state, retrying, { maxAttempts: 2 });
  const mara = retryCaptures.filter((request) => request.actorId === "mara");
  assert.equal(mara.length, 2);
  assert.equal(mara[0].projection.turn, 1);
  assert.equal(server.projectionFingerprint(mara[0].projection), server.projectionFingerprint(mara[1].projection));
});

test("updated owned memory can change a mocked model decision without forcing action diversity", async () => {
  const adaptive = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) {
    const alreadyInvestigated = request.projection.previousAction?.action === "Investigate";
    const plan = request.actorId === "dain"
      ? alreadyInvestigated ? { action: "Wait" } : { action: "Investigate", subject: "square" }
      : actionPlan(request.actorId, request.projection.turn);
    return JSON.stringify(candidate(request, plan, { rationale: alreadyInvestigated ? "Dain already searched the square and waits for new evidence." : "Dain searches the square for evidence." }));
  } });
  const first = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), adaptive);
  const second = await aiDecision.decideAndResolveTurn(first.state, adaptive);
  assert.equal(first.intents.find((intent) => intent.actorId === "dain").action, "Investigate");
  assert.equal(second.intents.find((intent) => intent.actorId === "dain").action, "Wait");

  const repeated = await runRepeatedTwoTurns();
  assert.equal(repeated.second.intents.find((intent) => intent.actorId === "dain").action, "Investigate");
  assert.match(repeated.second.intents.find((intent) => intent.actorId === "dain").rationale, /completed turn 1/);
});

test("an actor-visible Alternate intervention changes its branch-local projection fingerprint only through authoritative state", async () => {
  const adapter = aiSessionApi.createAiLiveSession(provider());
  const original = adapter.getSession().original.state;
  adapter.forkAt(0);
  adapter.applyIntervention(demo.intervention);
  const alternate = adapter.getSession().alternate.state;
  const originalMara = aiProjection(original, "mara");
  const alternateMara = aiProjection(alternate, "mara");
  assert.notEqual(server.projectionFingerprint(originalMara), server.projectionFingerprint(alternateMara));
  assert.ok(alternateMara.relevantMemories.some((memory) => /sealed Clinic ledger/.test(memory.description)));
  assert.equal(aiProjection(alternate, "dain").relevantMemories.some((memory) => /sealed Clinic ledger/.test(memory.description)), false);
  assert.equal(original.events.length, 1);
});

test("reasoning-enabled configuration emits provider-agnostic effort with private reasoning excluded", async () => {
  const projection = aiProjection(world.createInitialWorld(scenario), "dain");
  let body;
  await server.requestModelDecision(providerRequest(projection), providerConfig({ reasoningEnabled: true, reasoningEffort: "medium" }), async (_url, options) => {
    body = JSON.parse(options.body);
    return responseFor(candidate({ actorId: "dain", projection }));
  });
  assert.deepEqual(body.reasoning, { effort: "medium", exclude: true });
  assert.equal(body.response_format.type, "json_schema");
  assert.deepEqual(body.provider, { require_parameters: true });
});

test("disabled reasoning emits no reasoning request parameter", async () => {
  const projection = aiProjection(world.createInitialWorld(scenario), "dain");
  let body;
  await server.requestModelDecision(providerRequest(projection), providerConfig({ reasoningEnabled: false }), async (_url, options) => {
    body = JSON.parse(options.body);
    return responseFor(candidate({ actorId: "dain", projection }));
  });
  assert.equal("reasoning" in body, false);
});

test("unsupported reasoning and strict-output combination fails explicitly without fallback", async () => {
  const projection = aiProjection(world.createInitialWorld(scenario), "dain");
  let calls = 0;
  await assert.rejects(server.requestModelDecision(providerRequest(projection), providerConfig({ reasoningEnabled: true, maxRetries: 3 }), async () => {
    calls += 1;
    return { ok: false, status: 400, text: async () => "reasoning unsupported" };
  }), (error) => error.code === "AI_REASONING_UNSUPPORTED" && error.retryable === false);
  assert.equal(calls, 1);
});

test("strict structured output and reasoning coexist while raw chain-of-thought is neither returned nor logged", async () => {
  const projection = aiProjection(world.createInitialWorld(scenario), "dain");
  const logs = [];
  const output = candidate({ actorId: "dain", projection });
  const returned = await server.requestModelDecision(providerRequest(projection), providerConfig({ reasoningEnabled: true, diagnosticLogging: true, logger: { info(...values) { logs.push(JSON.stringify(values)); } } }), async () => ({
    ok: true, status: 200,
    text: async () => JSON.stringify({
      choices: [{ message: { content: JSON.stringify(output), reasoning: "PRIVATE_CHAIN_OF_THOUGHT", reasoning_details: [{ text: "PRIVATE_REASONING_DETAIL" }] } }],
      usage: { completion_tokens_details: { reasoning_tokens: 17 } }
    })
  }));
  assert.deepEqual(JSON.parse(returned), output);
  const serialized = logs.join("\n");
  assert.match(serialized, /"reasoningRequested":true/);
  assert.match(serialized, /"reasoningSupported":true/);
  assert.match(serialized, /"reasoningTokenCount":17/);
  assert.doesNotMatch(serialized, /PRIVATE_CHAIN_OF_THOUGHT|PRIVATE_REASONING_DETAIL|secret-key|Authorization|Bearer/);
});

test("safe diagnostics report freshness, semantics, previous result, validation, latency, and truthful reasoning state", async () => {
  const captures = [];
  const { first, second } = await runRepeatedTwoTurns(captures);
  const dainTurnOne = captures.find((request) => request.actorId === "dain" && request.projection.turn === 0).projection;
  const dainTurnTwo = second.projections.find((projection) => projection.self.id === "dain");
  const logs = [];
  const configuration = providerConfig({ diagnosticLogging: true, logger: { info(...values) { logs.push(values[1]); } } });
  const tracker = new Map();
  for (const projection of [dainTurnOne, dainTurnTwo]) {
    await server.requestModelDecision(providerRequest(projection), configuration, async () => responseFor(candidate({ actorId: "dain", projection })), tracker);
  }
  const latest = logs.at(-1);
  assert.equal(latest.branchId, "world-original-v1");
  assert.equal(latest.resolvingTurn, 2);
  assert.equal(latest.action, "Investigate");
  assert.equal(latest.semanticTarget, "square");
  assert.equal(latest.projectionDiffersFromPreviousTurn, true);
  assert.equal(latest.previousAuthoritativeResult.eventId, "evt-world-ai-t01-dain-investigate-square");
  assert.equal(latest.validationError, null);
  assert.equal(latest.reasoningRequested, false);
  assert.equal(latest.reasoningSupported, false);
  assert.ok(Number.isInteger(latest.latencyMs));
  assert.equal(typeof latest.projectionFingerprint, "string");
  assert.equal(typeof latest.rationaleFingerprint, "string");
  assert.equal(first.state.turn, 1);
});

test("provider, intent-validation, World-resolution, and presentation failures classify distinctly", () => {
  assert.equal(presentation.classifyLiveError("AI_TIMEOUT").category, "AI_PROVIDER_ERROR");
  assert.equal(presentation.classifyLiveError("rejected-output").category, "INTENT_VALIDATION_ERROR");
  assert.equal(presentation.classifyLiveError("WORLD_RESOLUTION_ERROR").category, "WORLD_RESOLUTION_ERROR");
  assert.equal(presentation.classifyLiveError("RENDER_FAILED").category, "PRESENTATION_ERROR");
});

test("the model selects intent semantics, validators enforce legality, and World alone determines consequences", async () => {
  const selectedProvider = provider();
  const initial = world.createInitialWorld(scenario);
  const result = await aiDecision.decideAndResolveTurn(initial, selectedProvider);
  assert.equal(initial.turn, 0);
  assert.equal(initial.events.length, 1);
  assert.equal(result.state.turn, 1);
  assert.ok(result.intents.every((intent) => world.ACTIONS.includes(intent.action)));
  assert.ok(result.state.events.some((event) => (event.changes.beliefs || []).length > 0));
  assert.ok(result.intents.every((intent) => !Object.prototype.hasOwnProperty.call(intent, "changes")));
});
