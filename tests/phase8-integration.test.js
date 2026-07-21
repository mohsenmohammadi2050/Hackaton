"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const adapterApi = require(path.join(root, "src/adapters/live-session-adapter.js"));
const comparisonApi = require(path.join(root, "src/presentation/branch-comparison.js"));
const demo = require(path.join(root, "src/config/demo-path-config.js"));

const ORIGINAL_SHA256 = "6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f";
const PROTECTED = Object.freeze({
  "src/data/world-scenario.js": "d6df48d808297172fc5208ee4afb8d048c01697f4d1c16389d2ce887ed7e99fb",
  "src/engine/world-engine.js": "e8208b565a7914716957491ea67da022d684001f9a880bfdf86590b2e3d781d7",
  "src/ai/decision-layer.js": "f3e0fcfb33e83b87e39c224d45bed999024a7d49ed49ebc99facfc63fec1c835",
  "src/ai/decision-providers.js": "e6cf57f0f87b8abb414d8efc8b1f3546838ab1e8756319e051f3a71f0be040fe",
  "src/ai/npc-agents.js": "e8c7e5efe7ab384f2993f4f0b09b7d3eb87505957ab976986d2c8f04958d1cd4",
  "src/engine/intervention-layer.js": "99a37d6e4a947ad7aa1fea1ce007ab68745c8278d94f8a8a9551f7d9e1acfa43",
  "src/engine/timeline-fork-engine.js": "2f6daddca6f9075d08b49b479bff648d3e9702f0b0b37aec4b6ae70e99fb3198",
  "src/engine/timeline-integrity.js": "e86f4e54a27a5c30121b3ed0c9d57fb213f301a79b046232bf4f937a8ccfadc6",
  "src/data/recorded-data.js": "c5ceb7e42de7ca9653697bf8fcad24e8f11f114dfb50cd15ebbb8a7751aabf5f"
});

function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

function completedDemo() {
  const adapter = adapterApi.createLiveSession();
  adapter.forkAt(demo.forkTurn);
  adapter.applyIntervention(demo.intervention);
  adapter.completeAlternate();
  return adapter;
}

test("Phase 8 preserves every protected approved runtime and Recorded artifact byte-for-byte", () => {
  for (const [file, expected] of Object.entries(PROTECTED)) {
    assert.equal(sha256(fs.readFileSync(path.join(root, file))), expected, `${file} changed`);
  }
});

test("Live adapter prepares the approved deterministic Original behind one presentation boundary", () => {
  const first = adapterApi.createLiveSession();
  const second = adapterApi.createLiveSession();
  assert.equal(sha256(JSON.stringify({ state: first.getSession().original.state, turns: first.getSession().original.turns })), ORIGINAL_SHA256);
  assert.deepEqual(first.getSession().original, second.getSession().original);
  assert.equal(first.currentView().boundary.turn, 0);
  assert.equal(first.currentView().branch.kind, "Original");
  assert.equal(first.validate().valid, true);
});

test("Live playback advances only across frozen completed boundaries and supports historical seek", () => {
  const adapter = adapterApi.createLiveSession();
  const one = adapter.step();
  assert.equal(one.boundary.turn, 1);
  assert.equal(one.boundary.classification, "turn-close");
  assert.equal(one.events.length, one.boundary.eventCount);
  assert.ok(one.events.every((event) => event.turn <= one.boundary.turn));
  assert.ok(Object.isFrozen(one));
  assert.equal(adapter.seekTurn("original", 0).boundary.turn, 0);
  assert.equal(adapter.currentView().clock.turn, 0);
});

test("NPC view models expose one NPC's owned memories and beliefs without presentation mutation", () => {
  const adapter = adapterApi.createLiveSession();
  const view = adapter.seekTurn("original", 6);
  for (const [npcId, npc] of Object.entries(view.npcs)) {
    assert.ok(npc.memories.every((memory) => memory.id.includes(npcId) || memory.id.startsWith("mem-start-")));
    assert.ok(npc.memories.every((memory) => memory.turn <= 6));
    assert.ok(npc.beliefs.every((belief) => belief.updatedTurn <= 6));
  }
  assert.throws(() => { view.npcs.mara.trust.orin = 100; }, TypeError);
});

test("The approved demo intervention changes later autonomous decisions while Original stays immutable", () => {
  const adapter = adapterApi.createLiveSession();
  const before = JSON.stringify(adapter.getSession().original);
  adapter.forkAt(demo.forkTurn);
  adapter.applyIntervention(demo.intervention);
  adapter.completeAlternate();
  assert.equal(JSON.stringify(adapter.getSession().original), before);
  assert.equal(adapter.validate().valid, true);
  const result = adapter.compare();
  assert.equal(result.changedIntents[0].turn, demo.expected.firstChangedDecisionTurn);
  assert.deepEqual(
    { medical: result.outcomes.original.medical, truth: result.outcomes.original.truth, social: result.outcomes.original.social },
    demo.expected.originalOutcome
  );
  assert.deepEqual(
    { medical: result.outcomes.alternate.medical, truth: result.outcomes.alternate.truth, social: result.outcomes.alternate.social },
    demo.expected.alternateOutcome
  );
  assert.equal(result.deltas.antidote.original.possessorId, demo.expected.originalAntidotePossessorId);
  assert.equal(result.deltas.antidote.alternate.possessorId, demo.expected.alternateAntidotePossessorId);
});

test("Pure comparison is deterministic, immutable, and labels non-authoritative links", () => {
  const adapter = completedDemo();
  const first = adapter.compare();
  const second = comparisonApi.compareTimelineSession(adapter.getSession());
  assert.deepEqual(first, second);
  assert.ok(Object.isFrozen(first));
  assert.ok(first.causalSupport.alternate.edges.every((edge) => edge.kind === "authoritative-cause"));
  assert.ok(first.causalSupport.comparisonLinks.every((edge) => edge.kind === "comparison-only"));
  assert.match(first.causalSupport.comparisonLinks[0].label, /not asserted as an authoritative/);
});

test("Comparison rejects an incomplete or integrity-invalid session", () => {
  const adapter = adapterApi.createLiveSession();
  assert.throws(() => adapter.compare(), /completed Alternate/);
  const completed = completedDemo().getSession();
  const corrupted = JSON.parse(JSON.stringify(completed));
  corrupted.alternate.state.events[1].causes = ["missing-event"];
  assert.throws(() => comparisonApi.compareTimelineSession(corrupted), /unresolved or cross-branch/);
});

test("Live adapter reports fork and intervention failures without mutating the Original", () => {
  const adapter = adapterApi.createLiveSession();
  const before = JSON.stringify(adapter.getSession().original);
  assert.throws(() => adapter.forkAt(11), (error) => error.code === "FORK_FAILED");
  assert.equal(JSON.stringify(adapter.getSession().original), before);
  adapter.forkAt(0);
  assert.throws(() => adapter.applyIntervention({ category: "Information" }), (error) => error.code === "INTERVENTION_FAILED");
  assert.equal(JSON.stringify(adapter.getSession().original), before);
});

test("Browser entry loads Recorded first and places Live behind the presentation adapter", () => {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "src/presentation/app.js"), "utf8");
  const livePresentation = fs.readFileSync(path.join(root, "src/presentation/live-presentation.js"), "utf8");
  assert.match(html, /recorded-data\.js[\s\S]*world-engine\.js[\s\S]*live-session-adapter\.js[\s\S]*live-presentation\.js[\s\S]*app\.js/);
  assert.doesNotMatch(app, /FORKED_FATES_WORLD|FORKED_FATES_DECISION|resolveTurn|runAutonomousOriginal/);
  assert.doesNotMatch(livePresentation, /FORKED_FATES_WORLD|FORKED_FATES_DECISION|resolveTurn|runAutonomousOriginal/);
  assert.match(app, /FORKED_FATES_LIVE_PRESENTATION/);
  assert.match(livePresentation, /adapterApi\.createLiveSession\(\)/);
});

test("Live product surface includes complete playback, fork, intervention, branch, and comparison controls", () => {
  const source = fs.readFileSync(path.join(root, "src/presentation/live-presentation.js"), "utf8");
  for (const action of [
    "live-step", "live-run", "live-pause", "restart-live", "open-fork", "apply-intervention",
    "resolve-alternate", "switch-branch", "open-comparison", "jump-comparison-event", "use-recorded"
  ]) assert.match(source, new RegExp(`data-action=\\"${action}\\"|action === \\"${action}\\"`));
  for (const category of ["Information", "ItemTransfer", "EnvironmentalEvent"]) assert.match(source, new RegExp(category));
  assert.match(source, /owned perspective/i);
  assert.match(source, /comparison-only/i);
  assert.match(source, /Original stays immutable/i);
});
