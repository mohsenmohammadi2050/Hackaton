"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const scenario = require("../world-scenario");
const decision = require("../decision-layer");
const providers = require("../decision-providers");
const aiSessionApi = require("../ai-live-session-adapter");
const presentation = require("../live-presentation");

const root = path.resolve(__dirname, "..");

function sha(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

function intent(request, action, extra = {}) {
  return JSON.stringify(Object.assign({
    id: `model-${request.actorId}-${request.projection.turn + 1}`,
    actorId: request.actorId,
    action,
    chosenAtTurn: request.projection.turn,
    servedGoalId: request.projection.self.goals[0].id,
    rationale: `Choose ${action} from owned information.`,
    citedMemoryIds: []
  }, extra));
}

function asyncDeterministic(plan = {}, captures = []) {
  const deterministic = providers.createProvider({ type: "deterministic" });
  return Object.freeze({
    protocol: decision.PROVIDER_PROTOCOL,
    kind: "llm",
    async decide(request) {
      captures.push(request);
      const planned = plan[`${request.actorId}:${request.projection.turn}`];
      return planned ? planned(request) : deterministic.decide(request);
    }
  });
}

function informationAt(turn) {
  return {
    id: `hotfix-info-t${turn}`,
    category: "Information",
    boundaryTurn: turn,
    payload: {
      recipientId: "mara",
      propositionId: "fact-case-spare-key",
      truthStatus: "true-evidence",
      beliefStance: "believes-true",
      confidence: 90,
      description: "A sealed record gives Mara evidence about the spare Clinic key."
    }
  };
}

test("the historical AI audit reproduces the exact mapped.attempts TypeError", () => {
  const mapped = { actors: [{ actorId: "mara", attempts: [{ attempt: 1, status: "validated" }] }] };
  function legacyPrefixMapper() {
    for (const attempt of mapped.attempts) void attempt;
  }
  assert.throws(legacyPrefixMapper, (error) => error instanceof TypeError && error.message === "mapped.attempts is not iterable");
});

test("AI audits normalize actor-grouped attempts into one stable presentation array", async () => {
  const adapter = aiSessionApi.createAiLiveSession(asyncDeterministic());
  await adapter.resolveNext("original");
  const audit = adapter.getSession().original.turns[0].audit;
  assert.equal(Array.isArray(audit.attempts), true);
  assert.equal(audit.attempts.length, 4);
  assert.equal("actors" in audit, false);
  for (const attempt of audit.attempts) {
    assert.deepEqual(Object.keys(attempt), [
      "actorId", "attempt", "transportAttempt", "validationError", "latencyMs", "reasoningRequested",
      "reasoningSupported", "outputs"
    ]);
    assert.equal(attempt.outputs.length, 1);
    assert.equal(attempt.outputs[0].status, "validated");
  }
});

test("missing attempts normalize to an empty array and one valid object normalizes to one entry", () => {
  const missing = aiSessionApi.normalizeAuditForPresentation({ turn: 2, status: "completed" });
  assert.deepEqual(missing.attempts, []);
  const single = aiSessionApi.normalizeAuditForPresentation({
    turn: 2,
    attempts: { actorId: "mara", attempt: 1, status: "validated", intentId: "intent-mara", action: "Wait" }
  });
  assert.equal(single.attempts.length, 1);
  assert.equal(single.attempts[0].actorId, "mara");
  assert.equal(single.attempts[0].outputs[0].intentId, "intent-mara");
});

test("invalid attempt primitives become a controlled presentation error without a raw TypeError", () => {
  assert.throws(
    () => aiSessionApi.normalizeAuditForPresentation({ turn: 2, attempts: "invalid" }),
    (error) => error.name === "AiLiveSessionError"
      && error.code === "PRESENTATION_ATTEMPTS_SHAPE_INVALID"
      && !/not iterable|TypeError/.test(error.message)
  );
  assert.deepEqual(presentation.classifyLiveError("PRESENTATION_ATTEMPTS_SHAPE_INVALID"), {
    category: "PRESENTATION_ERROR",
    title: "Presentation error",
    recovery: "The latest completed boundary remains safe."
  });
  assert.doesNotMatch(fs.readFileSync(path.join(root, "live-presentation.js"), "utf8"), /error\.stack|stackTrace/);
});

test("forking completed Turn 1 after Original Turn 3 preserves Original and scopes diagnostics", async () => {
  const adapter = aiSessionApi.createAiLiveSession(asyncDeterministic());
  for (let turn = 0; turn < 3; turn += 1) await adapter.resolveNext("original");
  const originalBefore = sha(adapter.getSession().original);
  const originalBoundary = adapter.currentView("original").boundary.id;
  const alternateView = adapter.forkAt(1);
  assert.equal(alternateView.branch.kind, "Alternate");
  assert.equal(alternateView.boundary.turn, 1);
  assert.equal(adapter.currentView("original").boundary.id, originalBoundary);
  assert.equal(sha(adapter.getSession().original), originalBefore);

  const originalAttempt = adapter.getSession().original.turns[0].audit.attempts[0];
  const alternateAttempt = adapter.getSession().alternate.turns[0].audit.attempts[0];
  assert.equal(originalAttempt.actorId, alternateAttempt.actorId);
  assert.notEqual(originalAttempt.outputs[0].intentId, alternateAttempt.outputs[0].intentId);
  assert.match(alternateAttempt.outputs[0].intentId, new RegExp(`^${adapter.getSession().alternate.branchId}--`));
  assert.equal(originalAttempt.outputs[0].intentId.startsWith(`${adapter.getSession().alternate.branchId}--`), false);
});

test("intervention and Alternate continuation are branch-local and Original remains byte-identical", async () => {
  const adapter = aiSessionApi.createAiLiveSession(asyncDeterministic());
  for (let turn = 0; turn < 3; turn += 1) await adapter.resolveNext("original");
  const originalBefore = sha(adapter.getSession().original);
  adapter.forkAt(1);
  const post = adapter.applyIntervention(informationAt(1));
  assert.equal(post.branch.kind, "Alternate");
  assert.ok(post.events.some((event) => event.isIntervention));
  assert.equal(adapter.getSession().original.state.events.some((event) => event.eventType?.startsWith("world.intervention.")), false);
  await adapter.resolveNext("alternate");
  assert.equal(adapter.getSession().alternate.state.turn, 2);
  assert.equal(sha(adapter.getSession().original), originalBefore);
  assert.equal(adapter.validate().valid, true);
});

test("a pre-commit presentation failure leaves no partial Alternate and one retry creates exactly one", () => {
  const source = fs.readFileSync(path.join(root, "ai-live-session-adapter.js"), "utf8");
  const realViews = require("../live-view-models");
  let failOnce = true;
  const moduleRecord = { exports: {} };
  const sandbox = {
    module: moduleRecord,
    exports: moduleRecord.exports,
    require(id) {
      if (id === "./live-view-models") return {
        createTimelineView(timeline, selector) {
          if (timeline.kind === "Alternate" && failOnce) {
            failOnce = false;
            throw Object.assign(new Error("Injected presentation mapping failure."), { code: "PRESENTATION_ATTEMPTS_SHAPE_INVALID" });
          }
          return realViews.createTimelineView(timeline, selector);
        }
      };
      return require(path.join(root, id));
    },
    Object, Array, Map, Set, JSON, Error, TypeError, Number, String, Boolean, RegExp, Math
  };
  vm.runInNewContext(source, sandbox, { filename: "ai-live-session-adapter.js" });
  const adapter = moduleRecord.exports.createAiLiveSession(asyncDeterministic());
  const before = adapter.getSession();
  assert.throws(() => adapter.forkAt(0), (error) => error.code === "PRESENTATION_ATTEMPTS_SHAPE_INVALID");
  assert.strictEqual(adapter.getSession(), before);
  assert.equal(adapter.capabilities().hasAlternate, false);
  adapter.forkAt(0);
  assert.equal(adapter.capabilities().hasAlternate, true);
  assert.throws(() => adapter.forkAt(0), /only one alternate branch/);
  assert.equal(adapter.getSession().alternate.kind, "Alternate");
});

test("Mara's remote private communication is a validated intent and failed World execution", async () => {
  const captures = [];
  const provider = asyncDeterministic({
    "orin:0": (request) => intent(request, "Move", { targetLocationId: "storehouse" }),
    "mara:1": (request) => intent(request, "Communicate", {
      audience: "private", targetId: "orin", claimIds: ["claim-mara-confronts-orin"], factIds: [], confessionFactIds: []
    })
  }, captures);
  const adapter = aiSessionApi.createAiLiveSession(provider);
  await adapter.resolveNext("original");
  await adapter.resolveNext("original");
  const turn = adapter.getSession().original.turns[1];
  const maraAttempt = turn.audit.attempts.find((attempt) => attempt.actorId === "mara");
  const failed = adapter.currentView("original").events.find((event) => event.actorId === "mara" && event.category === "Failed action");
  assert.equal(maraAttempt.outputs[0].status, "validated");
  assert.equal(maraAttempt.outputs[0].action, "Communicate");
  assert.match(failed.description, /private recipient is no longer co-located/i);
  const explanation = presentation.failedActionExplanation(failed);
  assert.match(explanation.validation, /intent passed schema and owned-state validation/i);
  assert.match(explanation.memory, /created an owned memory/i);
  assert.equal(failed.createdMemoryIds.length, 1);

  await adapter.resolveNext("original");
  const nextMaraProjection = captures.findLast((request) => request.actorId === "mara" && request.projection.turn === 2).projection;
  assert.ok(nextMaraProjection.relevantMemories.some((memory) => memory.id === failed.createdMemoryIds[0]));
});

test("terminal summary uses authoritative Saved outcome and its decisive treatment event", async () => {
  const provider = asyncDeterministic({
    "orin:0": (request) => intent(request, "Move", { targetLocationId: "storehouse" }),
    "orin:1": (request) => intent(request, "Investigate", { subject: "storehouse" }),
    "orin:2": (request) => intent(request, "Move", { targetLocationId: "clinic" }),
    "orin:3": (request) => intent(request, "Administer")
  });
  const adapter = aiSessionApi.createAiLiveSession(provider);
  while (adapter.getSession().original.state.status !== "completed") await adapter.resolveNext("original");
  const view = adapter.currentView("original");
  const summary = presentation.terminalOutcomeSummary(view);
  assert.equal(summary.terminalReason, "terminal-outcome");
  assert.equal(summary.medical, "Saved");
  assert.equal(summary.completedTurns, 4);
  assert.equal(summary.administratorId, "orin");
  assert.equal(view.events.find((event) => event.id === summary.decisiveEventId).category, "Treatment");
  assert.match(summary.causalChain.map((event) => event.description).join(" "), /finds the antidote[\s\S]*Clinic[\s\S]*administers/i);
});

test("an Administer intent without an authoritative outcome cannot report Niko saved", () => {
  const summary = presentation.terminalOutcomeSummary({
    outcome: null,
    patient: { status: "Untreated" },
    turns: [{ intents: [{ actorId: "orin", action: "Administer" }] }],
    events: [{ actorId: "orin", action: "Administer", category: "Failed action" }]
  });
  assert.equal(summary, null);
});

test("deadline loss is presented distinctly as turn-limit completion", async () => {
  const adapter = aiSessionApi.createAiLiveSession(asyncDeterministic());
  while (adapter.getSession().original.state.status !== "completed") await adapter.resolveNext("original");
  const summary = presentation.terminalOutcomeSummary(adapter.currentView("original"));
  assert.equal(summary.terminalReason, "turn-limit");
  assert.equal(summary.completedTurns, scenario.deadline);
  assert.equal(summary.medical, "Lost");
  assert.match(summary.terminalReasonLabel, /deadline was reached/i);
  assert.match(summary.decisiveDescription, /0 turns remaining/i);
});

test("complete AI Live Original-to-fork-to-Alternate comparison remains presentable", async () => {
  const adapter = aiSessionApi.createAiLiveSession(asyncDeterministic());
  while (adapter.getSession().original.state.status !== "completed") await adapter.resolveNext("original");
  const originalBefore = sha(adapter.getSession().original);
  adapter.forkAt(1);
  adapter.applyIntervention(informationAt(1));
  while (adapter.getSession().alternate.state.status !== "completed") await adapter.resolveNext("alternate");
  const originalSummary = presentation.terminalOutcomeSummary(adapter.viewAt("original", adapter.boundaryList("original").at(-1).id));
  const alternateSummary = presentation.terminalOutcomeSummary(adapter.viewAt("alternate", adapter.boundaryList("alternate").at(-1).id));
  const comparison = adapter.compare();
  assert.ok(originalSummary && alternateSummary);
  assert.equal(comparison.outcomes.original.medical, originalSummary.medical);
  assert.equal(comparison.outcomes.alternate.medical, alternateSummary.medical);
  assert.equal(adapter.capabilities().canCompare, true);
  assert.equal(adapter.validate().valid, true);
  assert.equal(sha(adapter.getSession().original), originalBefore);
});

test("terminal and failed-action presentation expose all required user actions and explanations", () => {
  const source = fs.readFileSync(path.join(root, "live-presentation.js"), "utf8");
  for (const phrase of [
    "Authoritative terminal outcome", "Inspect decisive event", "Fork an earlier turn", "Compare branches",
    "Back to Start", "Start New Simulation", "Valid decision, blocked by World conditions"
  ]) assert.match(source, new RegExp(phrase));
  assert.match(source, /data-terminal-reason/);
});
