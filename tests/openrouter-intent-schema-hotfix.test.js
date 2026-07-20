"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const scenario = require("../world-scenario");
const world = require("../world-engine");
const decision = require("../decision-layer");
const intentContract = require("../provider-intent-contract");
const providers = require("../decision-providers");
const aiDecision = require("../ai-decision-layer");
const server = require("../server");

function projection(actorId = "dain") {
  return decision.createOwnedProjection(world.createInitialWorld(scenario), actorId);
}

function deterministicCandidate(actorId = "dain") {
  const owned = projection(actorId);
  const provider = providers.createProvider({ type: "deterministic" });
  return {
    owned,
    candidate: JSON.parse(provider.decide({ protocol: decision.PROVIDER_PROTOCOL, actorId, projection: owned, attempt: 1, outputContract: {} }))
  };
}

function providerRequest(actorId = "dain") {
  return { protocol: decision.PROVIDER_PROTOCOL, actorId, projection: projection(actorId), attempt: 1, outputContract: aiDecision.OUTPUT_CONTRACT, validationFeedback: null };
}

function providerConfig(overrides = {}) {
  return Object.assign({
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "test-key",
    model: "provider/model",
    timeoutMs: 100,
    maxRetries: 0,
    structuredOutputMode: "json_schema",
    diagnosticLogging: false
  }, overrides);
}

function successResponse(content) {
  return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ message: { content } }] }) };
}

test("authoritative Communicate fields validate successfully", () => {
  const { owned, candidate } = deterministicCandidate("dain");
  assert.equal(candidate.action, "Communicate");
  assert.equal(decision.validateCandidate(candidate, owned).audience, "private");
});

test("observed plural audiences field reproduces authoritative malformed-output failure", () => {
  const { owned, candidate } = deterministicCandidate("dain");
  candidate.audiences = [candidate.audience];
  delete candidate.audience;
  assert.throws(() => decision.validateCandidate(candidate, owned), (error) => error.kind === "malformed-output" && error.message === "Intent field audiences is not valid for Communicate.");
});

test("unambiguous audiences compatibility alias canonicalizes to singular audience", () => {
  const { owned, candidate } = deterministicCandidate("dain");
  for (const alias of ["private", ["private"]]) {
    const value = { ...candidate, audiences: alias };
    delete value.audience;
    const normalized = aiDecision.canonicalizeCandidate(value, "dain");
    assert.equal(normalized.candidate.audience, "private");
    assert.equal("audiences" in normalized.candidate, false);
    assert.deepEqual(normalized.aliases, ["audiences->audience"]);
    assert.equal(decision.validateCandidate(normalized.candidate, owned).audience, "private");
  }
});

test("ambiguous or multiple audiences values are rejected without information loss", () => {
  const { candidate } = deterministicCandidate("dain");
  const multiple = { ...candidate, audiences: ["private", "public"] };
  delete multiple.audience;
  assert.throws(() => aiDecision.canonicalizeCandidate(multiple, "dain"), /audiences is ambiguous/);
  assert.throws(() => aiDecision.canonicalizeCandidate({ ...candidate, audiences: ["private"] }, "dain"), /may not contain both audience and the audiences alias/);
});

test("retry feedback names exact Communicate fields and includes a minimal valid example", () => {
  const { owned, candidate } = deterministicCandidate("dain");
  const invalid = { ...candidate, audiences: ["private", "public"] };
  delete invalid.audience;
  let error;
  try { aiDecision.canonicalizeCandidate(invalid, "dain"); } catch (caught) { error = caught; }
  assert.ok(error);
  const feedback = aiDecision.buildRetryFeedback(error, invalid, owned);
  assert.match(feedback, /^Validation error: Communicate field audiences is ambiguous\./);
  assert.match(feedback, /Valid fields for Communicate: id, actorId, action, chosenAtTurn, servedGoalId, rationale, citedMemoryIds, audience, targetId, claimIds, factIds, confessionFactIds\./);
  assert.match(feedback, /Minimal valid Communicate JSON:/);
  assert.match(feedback, /"audience":"public"/);
  assert.doesNotMatch(feedback, /targetLocationId|itemId/);
  assert.match(feedback, /Do not include previous invalid extra fields\./);
});

test("every strict action schema rejects additional properties", () => {
  const schema = intentContract.createIntentJsonSchema(projection("dain"));
  assert.equal(schema.oneOf.length, 8);
  for (const variant of schema.oneOf) assert.equal(variant.additionalProperties, false);
});

test("schema action discrimination excludes fields owned by other actions", () => {
  const schema = intentContract.createIntentJsonSchema(projection("dain"));
  const wait = schema.oneOf.find((variant) => variant.properties.action.const === "Wait");
  const communicate = schema.oneOf.filter((variant) => variant.properties.action.const === "Communicate");
  assert.deepEqual(Object.keys(wait.properties).sort(), intentContract.BASE_INTENT_FIELDS.slice().sort());
  for (const variant of communicate) {
    assert.equal("targetLocationId" in variant.properties, false);
    assert.equal("itemId" in variant.properties, false);
    assert.equal(variant.properties.action.const, "Communicate");
  }
});

test("OpenRouter transport sends strict action-discriminated JSON Schema", async () => {
  let body;
  const candidate = deterministicCandidate("dain").candidate;
  const output = await server.requestModelDecision(providerRequest("dain"), providerConfig(), async (_url, options) => {
    body = JSON.parse(options.body);
    return successResponse(JSON.stringify(candidate));
  });
  assert.equal(JSON.parse(output).audience, "private");
  assert.equal(body.response_format.type, "json_schema");
  assert.equal(body.response_format.json_schema.strict, true);
  assert.equal(body.response_format.json_schema.schema.oneOf.length, 8);
});

test("OpenRouter transport requires parameter-compatible provider routing", async () => {
  let body;
  await server.requestModelDecision(providerRequest("dain"), providerConfig(), async (_url, options) => {
    body = JSON.parse(options.body);
    return successResponse(JSON.stringify(deterministicCandidate("dain").candidate));
  });
  assert.deepEqual(body.provider, { require_parameters: true });
});

test("unsupported strict structured output produces a clear capability error", async () => {
  await assert.rejects(
    server.requestModelDecision(providerRequest("dain"), providerConfig(), async () => ({ ok: false, status: 400, text: async () => "response_format json_schema unsupported" })),
    (error) => error.code === "AI_STRUCTURED_OUTPUT_UNSUPPORTED" && error.retryable === false && /AI_STRUCTURED_OUTPUT_MODE=json_object/.test(error.message)
  );
});

test("structured-output rejection never silently falls back to unconstrained or deterministic output", async () => {
  const bodies = [];
  await assert.rejects(server.requestModelDecision(providerRequest("dain"), providerConfig({ maxRetries: 3 }), async (_url, options) => {
    bodies.push(JSON.parse(options.body));
    return { ok: false, status: 422, text: async () => "unsupported" };
  }), (error) => error.code === "AI_STRUCTURED_OUTPUT_UNSUPPORTED");
  assert.equal(bodies.length, 1);
  assert.equal(bodies[0].response_format.type, "json_schema");
});

test("retry exhaustion preserves the last frozen completed boundary", async () => {
  const initial = world.createInitialWorld(scenario);
  const before = JSON.stringify(initial);
  const provider = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) {
    const candidate = deterministicCandidate(request.actorId).candidate;
    if (candidate.action === "Communicate") { candidate.audiences = ["private", "public"]; delete candidate.audience; }
    else candidate.unexpected = "invalid";
    return JSON.stringify(candidate);
  } });
  await assert.rejects(aiDecision.decideAndResolveTurn(initial, provider, { maxAttempts: 2 }), /stopped before World resolution/);
  assert.equal(JSON.stringify(initial), before);
  assert.equal(initial.turn, 0);
  assert.equal(initial.boundaries.length, 1);
});

test("a successful corrected retry resolves the World exactly once", async () => {
  const deterministic = providers.createProvider({ type: "deterministic" });
  const expected = decision.decideAndResolveTurn(world.createInitialWorld(scenario), deterministic).state;
  let dainCalls = 0;
  const diagnostics = [];
  const provider = Object.freeze({ protocol: decision.PROVIDER_PROTOCOL, async decide(request) {
    const raw = deterministic.decide(request);
    if (request.actorId !== "dain" || ++dainCalls > 1) return raw;
    const candidate = JSON.parse(raw);
    candidate.audiences = ["private", "public"];
    delete candidate.audience;
    return JSON.stringify(candidate);
  } });
  const result = await aiDecision.decideAndResolveTurn(world.createInitialWorld(scenario), provider, { maxAttempts: 2, onDiagnostic: (record) => diagnostics.push(record) });
  assert.equal(dainCalls, 2);
  assert.equal(result.state.turn, 1);
  assert.equal(result.state.boundaries.length, 2);
  assert.equal(JSON.stringify(result.state), JSON.stringify(expected));
  assert.equal(diagnostics.filter((record) => record.actorId === "dain").length, 2);
});

test("development diagnostics never log credentials or raw secret response values", async () => {
  const logs = [];
  const logger = { info(...values) { logs.push(JSON.stringify(values)); } };
  const { candidate } = deterministicCandidate("dain");
  candidate.rationale = "RAW_RESPONSE_SECRET";
  await server.requestModelDecision(providerRequest("dain"), providerConfig({ apiKey: "AUTHORIZATION_SECRET", diagnosticLogging: true, logger }), async () => successResponse(JSON.stringify(candidate)));
  const joined = logs.join("\n");
  assert.match(joined, /dain/);
  assert.match(joined, /Communicate/);
  assert.doesNotMatch(joined, /AUTHORIZATION_SECRET|RAW_RESPONSE_SECRET|test-key|Bearer/);
});
