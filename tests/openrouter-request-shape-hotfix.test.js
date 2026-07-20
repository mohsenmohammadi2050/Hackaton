"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const scenario = require("../world-scenario");
const world = require("../world-engine");
const decision = require("../decision-layer");
const aiProjection = require("../ai-owned-projection");
const aiDecision = require("../ai-decision-layer");
const server = require("../server");

function request(actorId = "mara") {
  const state = world.createInitialWorld(scenario);
  return {
    protocol: decision.PROVIDER_PROTOCOL,
    actorId,
    projection: aiProjection.createAiOwnedProjection(state, actorId, decision.createOwnedProjection(state, actorId)),
    attempt: 1,
    outputContract: aiDecision.OUTPUT_CONTRACT,
    validationFeedback: null
  };
}

function config(overrides = {}) {
  return Object.assign({
    providerType: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: "OPENROUTER_TEST_KEY",
    model: "google/gemma-4-26b-a4b-it",
    timeoutMs: 100,
    maxRetries: 0,
    structuredOutputMode: "json_schema",
    reasoningEnabled: false,
    reasoningConfigurationValid: true,
    reasoningEffort: "medium",
    maxOutputTokens: 800,
    maxOutputTokensConfigurationValid: true,
    inputTokenWarning: 6000,
    inputTokenWarningConfigurationValid: true,
    diagnosticLogging: false
  }, overrides);
}

function candidate(providerRequest) {
  return {
    id: `intent-${providerRequest.actorId}-openrouter`,
    actorId: providerRequest.actorId,
    action: "Wait",
    chosenAtTurn: providerRequest.projection.turn,
    servedGoalId: providerRequest.projection.self.goals[0].id,
    rationale: "Choose a legal intent from owned state.",
    citedMemoryIds: []
  };
}

test("paid Gemma request exactly matches the successful OpenRouter Chat Completions shape", async () => {
  const providerRequest = request();
  let capture;
  const output = await server.requestModelDecision(providerRequest, config(), async (url, options) => {
    capture = { url, headers: options.headers, body: JSON.parse(options.body) };
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ choices: [{ message: { content: JSON.stringify(candidate(providerRequest)) } }] })
    };
  });

  assert.equal(capture.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(capture.headers.authorization, "Bearer OPENROUTER_TEST_KEY");
  assert.equal(capture.headers["content-type"], "application/json");
  assert.equal(capture.headers.accept, "application/json");
  assert.equal("X-Cerebras-Version-Patch" in capture.headers, false);
  assert.deepEqual(Object.keys(capture.body).sort(), ["max_tokens", "messages", "model", "provider", "response_format", "temperature"]);
  assert.equal(capture.body.model, "google/gemma-4-26b-a4b-it");
  assert.equal(capture.body.max_tokens, 800);
  assert.equal("max_completion_tokens" in capture.body, false);
  assert.equal("reasoning_effort" in capture.body, false);
  assert.equal("reasoning_format" in capture.body, false);
  assert.deepEqual(capture.body.provider, { require_parameters: true });
  assert.equal(capture.body.response_format.type, "json_schema");
  assert.equal(capture.body.response_format.json_schema.strict, true);
  assert.equal(output, JSON.stringify(candidate(providerRequest)));
});

test("OpenRouter endpoint joining cannot duplicate chat/completions and preserves optional reasoning", () => {
  assert.equal(server.resolveChatCompletionsEndpoint("https://openrouter.ai/api/v1"), "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(server.resolveChatCompletionsEndpoint("https://openrouter.ai/api/v1/"), "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(server.resolveChatCompletionsEndpoint("https://openrouter.ai/api/v1/chat/completions"), "https://openrouter.ai/api/v1/chat/completions");
  const mapped = server.mapProviderRequest(request("dain"), config({ baseUrl: "https://openrouter.ai/api/v1/chat/completions", reasoningEnabled: true }), null);
  assert.equal(mapped.endpoint, "https://openrouter.ai/api/v1/chat/completions");
  assert.deepEqual(mapped.body.reasoning, { effort: "medium", exclude: true });
  assert.deepEqual(mapped.body.provider, { require_parameters: true });
});

test("OpenRouter 404 diagnostics capture the resolved endpoint and safe error envelope only", async () => {
  const providerRequest = request("sera");
  const records = [];
  const diagnosticConfig = config({
    diagnosticLogging: true,
    logger: { info(_label, record) { records.push(record); } }
  });
  const privatePrompt = providerRequest.projection.scenarioKnowledge.premise;
  await assert.rejects(
    server.requestModelDecision(providerRequest, diagnosticConfig, async () => ({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({
        error: {
          code: 404,
          type: "provider_error",
          message: `No endpoints found. ${privatePrompt} OPENROUTER_TEST_KEY`,
          metadata: {
            error_type: "provider_unavailable",
            request: { messages: providerRequest.projection },
            authorization: "Bearer OPENROUTER_TEST_KEY"
          }
        }
      })
    })),
    (error) => error.code === "AI_HTTP_ERROR" && /OpenRouter returned HTTP 404/.test(error.message)
  );

  assert.equal(records.length, 1);
  assert.equal(records[0].endpoint, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(records[0].provider, "openrouter");
  assert.equal(records[0].httpStatus, 404);
  assert.deepEqual(records[0].providerResponse.error, {
    code: "404",
    type: "provider_error",
    message: "No endpoints found. [REDACTED_PROMPT] [REDACTED_KEY]",
    errorType: "provider_unavailable"
  });
  const serialized = JSON.stringify(records);
  for (const forbidden of ["OPENROUTER_TEST_KEY", privatePrompt, "authorization", "scenarioKnowledge", "memories", "beliefs"]) {
    assert.doesNotMatch(serialized, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
