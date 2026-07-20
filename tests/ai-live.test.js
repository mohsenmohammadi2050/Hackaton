"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const scenario = require("../world-scenario");
const world = require("../world-engine");
const decision = require("../decision-layer");
const providers = require("../decision-providers");
const aiDecision = require("../ai-decision-layer");
const aiSessionApi = require("../ai-live-session-adapter");
const server = require("../server");
const demo = require("../demo-path-config");

function asyncDeterministic(overrides = {}) {
  const deterministic = providers.createProvider({ type: "deterministic" });
  return Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    kind: "llm",
    async decide(request) {
      if (overrides[request.actorId]) return overrides[request.actorId](request, deterministic);
      return deterministic.decide(request);
    }
  });
}

test("AI Decision Layer requests all four character decisions in parallel before World resolution", async () => {
  const waiting = [];
  const seen = [];
  const deterministic = providers.createProvider({ type: "deterministic" });
  const provider = Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    async decide(request) {
      seen.push(request.actorId);
      await new Promise((resolve) => { waiting.push(resolve); if (waiting.length === 4) waiting.splice(0).forEach((release) => release()); });
      return deterministic.decide(request);
    }
  });
  const initial = world.createInitialWorld(scenario);
  const result = await aiDecision.decideAndResolveTurn(initial, provider);
  assert.deepEqual(seen.sort(), scenario.npcOrder.slice().sort());
  assert.equal(result.intents.length, 4);
  assert.equal(result.state.turn, 1);
  assert.equal(result.audit.parallel, true);
});

test("AI requests contain only each actor's owned projection", async () => {
  const captures = {};
  const deterministic = providers.createProvider({ type: "deterministic" });
  const provider = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) { captures[request.actorId] = request.projection; return deterministic.decide(request); } });
  await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), provider);
  for (const actorId of scenario.npcOrder) {
    const projection = captures[actorId];
    assert.equal(projection.self.id, actorId);
    assert.equal("facts" in projection, false);
    assert.equal("events" in projection, false);
    assert.equal("boundaries" in projection, false);
    assert.equal("outcome" in projection, false);
    assert.ok(projection.relevantMemories.every((memory) => memory.ownerId === actorId));
    for (const otherId of scenario.npcOrder.filter((id) => id !== actorId)) {
      assert.equal("memories" in (projection.knownCharacters.find((npc) => npc.id === otherId) || {}), false);
      assert.equal("beliefs" in (projection.knownCharacters.find((npc) => npc.id === otherId) || {}), false);
      assert.equal("inventory" in (projection.knownCharacters.find((npc) => npc.id === otherId) || {}), false);
    }
  }
});

test("Invalid JSON retries with validation feedback and never falls back", async () => {
  let calls = 0;
  let feedback = null;
  const provider = asyncDeterministic({ mara(request, deterministic) { calls += 1; feedback = request.validationFeedback; return calls === 1 ? "not json" : deterministic.decide(request); } });
  const result = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), provider, { maxAttempts: 2 });
  assert.equal(calls, 2);
  assert.match(feedback, /valid JSON/i);
  assert.equal(result.state.turn, 1);
});

test("Illegal actions, inaccessible memories, and fabricated identities are rejected", () => {
  const initial = world.createInitialWorld(scenario);
  const projection = decision.createOwnedProjection(initial, "mara");
  const base = { id: "intent-test", actorId: "mara", chosenAtTurn: 0, servedGoalId: projection.self.goals[0].id, rationale: "Test", citedMemoryIds: [] };
  assert.throws(() => decision.validateCandidate({ ...base, action: "Teleport" }, projection), /Unknown action/);
  assert.throws(() => decision.validateCandidate({ ...base, action: "Wait", citedMemoryIds: ["mem-private-orin"] }, projection), /outside the supplied relevant set/);
  assert.throws(() => decision.validateCandidate({ ...base, action: "Move", targetLocationId: "moon" }, projection), /not a legal destination/);
  assert.throws(() => decision.validateCandidate({ ...base, action: "Transfer", targetId: "ghost", itemId: "fabricated-item" }, projection), /does not own/);
  assert.throws(() => decision.validateCandidate({ ...base, action: "Accuse", targetId: "ghost", responsibilityTargetId: "ghost", claimIds: ["claim-x"] }, projection), /target is unknown/);
});

test("Retry exhaustion fails visibly before any World event is committed", async () => {
  const initial = world.createInitialWorld(scenario);
  const provider = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide() { return "{}"; } });
  await assert.rejects(aiDecision.decideAndResolveTurn(initial, provider, { maxAttempts: 2 }), (error) => error.code === "malformed-output" && /stopped before World resolution/.test(error.message));
  assert.equal(initial.turn, 0);
  assert.equal(initial.events.length, 1);
});

test("Server rejects projection privacy violations", () => {
  const projection = JSON.parse(JSON.stringify(decision.createOwnedProjection(world.createInitialWorld(scenario), "mara")));
  projection.events = [];
  assert.throws(() => server.validateDecisionRequest({ protocol: decision.PROVIDER_PROTOCOL, actorId: "mara", projection, attempt: 1 }), (error) => error.code === "PRIVACY_BOUNDARY");
});

test("Explicit validated JSON-object mode preserves compatible provider transport", async () => {
  const requests = [];
  const fetchImpl = async (_url, options) => {
    requests.push(JSON.parse(options.body));
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content: "```json\n{\"id\":\"intent-x\"}\n```" } }] }) };
  };
  const output = await server.requestModelDecision({ actorId: "mara", attempt: 1, projection: {}, outputContract: {} }, { baseUrl: "https://provider.test/v1", apiKey: "secret", model: "free-model", timeoutMs: 100, maxRetries: 2, structuredOutputMode: "json_object" }, fetchImpl);
  assert.equal(output, '{"id":"intent-x"}');
  assert.deepEqual(requests[0].response_format, { type: "json_object" });
  assert.equal(requests.length, 1);
});

test("Provider timeout and HTTP failures have structured error codes", async () => {
  const timeoutFetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }))));
  await assert.rejects(server.requestModelDecision({}, { baseUrl: "https://provider.test/v1", model: "m", timeoutMs: 5, maxRetries: 0, structuredOutputMode: "json_object" }, timeoutFetch), (error) => error.code === "AI_TIMEOUT");
  const httpFetch = async () => ({ ok: false, status: 401, text: async () => "unauthorized" });
  await assert.rejects(server.requestModelDecision({}, { baseUrl: "https://provider.test/v1", model: "m", timeoutMs: 100, maxRetries: 0, structuredOutputMode: "json_object" }, httpFetch), (error) => error.code === "AI_HTTP_ERROR");
});

test("Missing provider configuration produces an explicit setup error", async () => {
  await assert.rejects(server.requestModelDecision({}, { baseUrl: "", model: "", timeoutMs: 100, maxRetries: 0 }, async () => null), (error) => error.code === "AI_NOT_CONFIGURED" && /AI_PROVIDER_BASE_URL/.test(error.message));
});

test("Alternate AI projections include intervention state only for the appropriate agent", async () => {
  const captures = {};
  const deterministic = providers.createProvider({ type: "deterministic" });
  const provider = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) { captures[request.actorId] = request.projection; return deterministic.decide(request); } });
  const adapter = aiSessionApi.createAiLiveSession(provider);
  adapter.forkAt(0);
  adapter.applyIntervention(demo.intervention);
  await adapter.resolveNext("alternate");
  assert.ok(captures.mara.relevantMemories.some((memory) => /sealed Clinic ledger/i.test(memory.description)));
  for (const actorId of ["dain", "sera", "orin"]) assert.equal(captures[actorId].relevantMemories.some((memory) => /sealed Clinic ledger/i.test(memory.description)), false);
  assert.equal(adapter.getSession().original.state.events.length, 1);
  assert.equal(adapter.getSession().alternate.state.turn, 1);
});
