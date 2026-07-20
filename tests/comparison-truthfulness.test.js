"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const comparisonApi = require("../branch-comparison");
const adapterApi = require("../live-session-adapter");
const guidance = require("../fork-guidance");
const demo = require("../demo-path-config");

function completeDemo() {
  const adapter = adapterApi.createLiveSession();
  adapter.forkAt(demo.forkTurn);
  adapter.applyIntervention(demo.intervention);
  adapter.completeAlternate();
  return adapter.compare();
}

test("Intent comparison distinguishes action, target, content, rationale, goal, and evidence", () => {
  const before = { action: "Move", targetLocationId: "clinic", rationale: "Before", servedGoalId: "goal-a", citedMemoryIds: ["mem-a"] };
  const after = { action: "Communicate", targetId: "mara", audience: "private", factIds: ["fact-x"], rationale: "After", servedGoalId: "goal-b", citedMemoryIds: ["mem-alt"] };
  const result = comparisonApi.classifyIntentDifference(before, after, new Map([["mem-alt", "mem-b"]]));
  assert.deepEqual(result.classifications, ["action-changed", "target-changed", "content-changed", "rationale-changed", "goal-changed"]);
});

test("Cited-memory-only changes are labeled as same action with different evidence", () => {
  const base = { action: "Wait", rationale: "Hold position", servedGoalId: "goal-a", citedMemoryIds: ["mem-a"] };
  const result = comparisonApi.classifyIntentDifference(base, { ...base, citedMemoryIds: ["mem-alt"] }, new Map([["mem-alt", "mem-b"]]));
  assert.deepEqual(result.classifications, ["evidence-changed-only"]);
  assert.equal(result.label, "Same action, different evidence considered");
  assert.deepEqual(result.evidence, { original: ["mem-a"], alternate: ["mem-b"] });
});

test("Identical decisions are not assigned a false change", () => {
  const intent = { action: "Wait", rationale: "Hold position", servedGoalId: "goal-a", citedMemoryIds: [] };
  const result = comparisonApi.classifyIntentDifference(intent, { ...intent }, new Map());
  assert.deepEqual(result.classifications, ["no-meaningful-decision-change"]);
});

test("Approved demo comparison reports visible action and resulting event divergence", () => {
  const result = completeDemo();
  assert.equal(result.meaningfulDivergence.visible, true);
  assert.ok(result.changedIntents.some((change) => change.classifications.includes("action-changed")));
  assert.ok(result.changedEvents.some((change) => change.turn > result.fork.turn));
  assert.ok(result.meaningfulDivergence.visibleCategories.includes("event-changed"));
  assert.ok(result.meaningfulDivergence.visibleCategories.includes("antidote-path-changed"));
});

test("Fork horizon exposes eligibility, reasons, remaining turns, and opportunity", () => {
  assert.deepEqual(guidance.describe(0), { turn: 0, eligible: true, reason: null, remainingTurns: 12, opportunity: "High opportunity for divergence" });
  assert.equal(guidance.describe(7).opportunity, "Moderate opportunity for divergence");
  assert.match(guidance.describe(10).opportunity, /Limited opportunity/);
  assert.equal(guidance.describe(11).eligible, false);
  assert.match(guidance.describe(11).reason, /insufficient future turns/);
  assert.match(guidance.describe(4, { hasAlternate: true }).reason, /Alternate already exists/);
  assert.match(guidance.describe(4, { branch: "alternate" }).reason, /only Original/);
});

test("Comparison classification is deterministic", () => {
  assert.deepEqual(completeDemo(), completeDemo());
});
