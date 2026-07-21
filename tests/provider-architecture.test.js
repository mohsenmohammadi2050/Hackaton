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

const APPROVED_PHASE_7_1_RUN_SHA256 = "6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f";
const APPROVED_ARTIFACT_SHA256 = Object.freeze({
  "src/ai/npc-agents.js": "e8c7e5efe7ab384f2993f4f0b09b7d3eb87505957ab976986d2c8f04958d1cd4",
  "src/data/world-scenario.js": "d6df48d808297172fc5208ee4afb8d048c01697f4d1c16389d2ce887ed7e99fb",
  "src/data/recorded-data.js": "c5ceb7e42de7ca9653697bf8fcad24e8f11f114dfb50cd15ebbb8a7751aabf5f"
});

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function run(provider) {
  return decision.runAutonomousOriginal(scenario, provider);
}

test("Approved policy, Recorded, and scenario artifacts remain byte-for-byte unchanged", () => {
  for (const [relativePath, approvedHash] of Object.entries(APPROVED_ARTIFACT_SHA256)) {
    assert.equal(sha256(fs.readFileSync(path.join(root, relativePath))), approvedHash, `${relativePath} changed`);
  }
});

test("Decision Layer depends on the provider protocol and never imports or addresses NPC policies", () => {
  const source = fs.readFileSync(path.join(root, "src/ai/decision-layer.js"), "utf8");
  assert.match(source, /provider\.decide\(/);
  assert.doesNotMatch(source, /require\("\.\/npc-agents"\)|createAutonomousAgents|agents\s*\[|agent\.decide\(/);
  assert.throws(
    () => decision.decideAndResolveTurn(engine.createInitialWorld(scenario), {}),
    /requires a forked-fates-decision-provider-v1 provider/
  );
});

test("DeterministicProvider matches the approved Phase 7.1 replay byte-for-byte", () => {
  const first = run(providers.createProvider({ type: "deterministic" }));
  const second = run(providers.createProvider({ type: "deterministic" }));
  assert.deepEqual(first, second);
  assert.equal(sha256(JSON.stringify(first)), APPROVED_PHASE_7_1_RUN_SHA256);
});

test("A mock LLM provider returns the same intent contract and replay without external API calls", () => {
  const deterministic = providers.createProvider({ type: "deterministic" });
  const requests = [];
  const mockConfiguration = {
    type: "llm",
    id: "mock-llm",
    vendor: "mock",
    model: "contract-fixture",
    invoke(request) {
      requests.push(request);
      return deterministic.decide(request);
    }
  };

  const deterministicResult = run(providers.createProvider({ type: "deterministic" }));
  const mockResult = run(providers.createProvider(mockConfiguration));
  assert.deepEqual(mockResult, deterministicResult);
  assert.equal(sha256(JSON.stringify(mockResult)), APPROVED_PHASE_7_1_RUN_SHA256);
  assert.equal(requests.length, 48);
  assert.ok(requests.every((request) => request.protocol === providers.PROVIDER_PROTOCOL));
  assert.ok(requests.every((request) => request.outputContract.format === "json-string" && request.outputContract.cardinality === 1));
  assert.ok(requests.every((request) => !Object.hasOwn(request, "worldState") && !Object.hasOwn(request, "otherNpcState")));
  assert.ok(requests.every((request) => Object.isFrozen(request) && Object.isFrozen(request.projection)));
});

test("GPT, Claude, and local adapters are provider configuration, not Decision or World changes", () => {
  for (const configuration of [
    { type: "llm", vendor: "openai", model: "gpt-model", invoke: () => "{}" },
    { type: "llm", vendor: "anthropic", model: "claude-model", invoke: () => "{}" },
    { type: "llm", vendor: "local", model: "local-model", invoke: () => "{}" }
  ]) {
    const provider = providers.createProvider(configuration);
    assert.ok(provider instanceof providers.LLMProvider);
    assert.equal(provider.protocol, providers.PROVIDER_PROTOCOL);
    assert.equal(provider.vendor, configuration.vendor);
    assert.equal(provider.model, configuration.model);
  }
});

test("LLMProvider is an API-free adapter and reports missing invocation through existing malformed-output retry", () => {
  const provider = providers.createProvider({ type: "llm", vendor: "unconfigured", model: "none" });
  const initial = engine.createInitialWorld(scenario);
  assert.throws(
    () => decision.decideAndResolveTurn(initial, provider, { maxAttempts: 2 }),
    (error) => {
      assert.equal(error.name, "DecisionTurnError");
      assert.equal(error.audit.attempts.length, 2);
      assert.ok(error.audit.attempts.every((attempt) => attempt.status === "malformed-output" && attempt.boundaryTurn === 0));
      assert.match(error.audit.attempts[0].error.message, /performs no external API calls/);
      return true;
    }
  );
  assert.equal(initial.turn, 0);
});

test("Provider interface is explicit and factory rejects unknown provider types", () => {
  assert.throws(() => new providers.DecisionProvider(), /cannot be instantiated directly/);
  assert.throws(() => providers.createProvider({ type: "future-unknown" }), /Unknown decision provider type/);
  assert.equal(providers.isDecisionProvider(providers.createProvider()), true);
  assert.equal(providers.isDecisionProvider({ decide() {} }), false);
});
