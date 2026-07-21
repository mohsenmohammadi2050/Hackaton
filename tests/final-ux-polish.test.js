"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const presentationApi = require("../live-presentation");
const adapterApi = require("../live-session-adapter");
const demo = require("../demo-path-config");

function completedDemoAdapter() {
  const adapter = adapterApi.createLiveSession();
  adapter.forkAt(demo.forkTurn);
  adapter.applyIntervention(demo.intervention);
  adapter.completeAlternate();
  return adapter;
}

function dynamicAdapter(base, resolveNext) {
  const wrapper = {};
  for (const key of Object.keys(base)) wrapper[key] = base[key];
  wrapper.dynamic = true;
  wrapper.resolveNext = resolveNext;
  wrapper.getSession = () => ({ original: { state: { status: "active" } }, alternate: { state: { status: "active" } } });
  return wrapper;
}

function createHarness(adapter = adapterApi.createLiveSession(), options = {}) {
  const timeline = { scrollTop: 240, scrollHeight: 1200 };
  const inspector = { scrollTop: 90, scrollHeight: 800 };
  const app = { innerHTML: "", querySelector() { return null; } };
  const announcer = { textContent: "" };
  const scrollCalls = [];
  const doc = {
    querySelector(selector) {
      if (selector === ".timeline") return timeline;
      if (selector === ".inspector-scroll") return inspector;
      return null;
    },
    getElementById() { return null; }
  };
  const win = {
    location: { search: "" },
    scrollX: 18,
    scrollY: 640,
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    requestAnimationFrame(callback) { callback(); },
    scrollTo(x, y) { this.scrollX = x; this.scrollY = y; scrollCalls.push([x, y]); }
  };
  let backCount = 0;
  const presentation = presentationApi.create({
    window: win,
    document: doc,
    app,
    announcer,
    escapeHtml: (value) => String(value),
    mode: options.mode || "deterministic",
    adapterFactory: () => adapter,
    onBackStart() { backCount += 1; app.innerHTML = "START"; }
  });
  return { presentation, adapter, app, doc, win, timeline, inspector, scrollCalls, backCount: () => backCount };
}

function action(presentation, name, dataset = {}) {
  return presentation.handleAction({ dataset: { action: name, ...dataset } });
}

function boundaryAt(adapter, branch, turn, classification = "turn-close") {
  return adapter.boundaryList(branch).find((boundary) => boundary.turn === turn && boundary.classification === classification);
}

test("clicking a Turn 3 actor preserves Turn 3 instead of resetting to Turn 0", async () => {
  const harness = createHarness();
  await harness.presentation.start();
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  const selected = harness.presentation.navigationState().selections.original;
  assert.equal(selected, boundaryAt(harness.adapter, "original", 3).id);
  action(harness.presentation, "select-live-npc", { npc: "mara" });
  assert.equal(harness.presentation.navigationState().selections.original, selected);
  assert.deepEqual(harness.presentation.navigationState().inspectorSelections.original, { type: "npc", id: "mara" });
});

test("opening the inspector restores page and timeline scroll position", async () => {
  const harness = createHarness();
  await harness.presentation.start();
  harness.win.scrollY = 777;
  harness.timeline.scrollTop = 456;
  action(harness.presentation, "select-live-npc", { npc: "sera" });
  assert.deepEqual(harness.scrollCalls.at(-1), [18, 777]);
  assert.equal(harness.timeline.scrollTop, 456);
  assert.equal(harness.inspector.scrollTop, 0);
});

test("provider progress rerenders preserve the selected historical turn and actor", async () => {
  const base = adapterApi.createLiveSession();
  const observed = [];
  let presentation;
  const adapter = dynamicAdapter(base, async (_branch, report) => {
    report({ phase: "generating", turn: 4 });
    observed.push(presentation.navigationState());
    report({ phase: "validating", turn: 4 });
    observed.push(presentation.navigationState());
  });
  const harness = createHarness(adapter, { mode: "ai-live" });
  presentation = harness.presentation;
  await presentation.start();
  action(presentation, "live-step");
  await Promise.resolve();
  observed.length = 0;
  const turn3 = boundaryAt(base, "original", 3);
  action(presentation, "select-live-boundary", { boundary: turn3.id });
  action(presentation, "select-live-npc", { npc: "orin" });
  action(presentation, "live-step");
  await Promise.resolve();
  assert.ok(observed.length >= 2);
  assert.ok(observed.every((state) => state.selections.original === turn3.id));
  assert.ok(observed.every((state) => state.inspectorSelections.original.id === "orin"));
  assert.ok(observed.every((state) => state.branch === "original"));
});

test("branch switching preserves each branch selected turn and inspector selection", async () => {
  const adapter = completedDemoAdapter();
  const harness = createHarness(adapter);
  await harness.presentation.start();
  const originalTurn3 = boundaryAt(adapter, "original", 3);
  const alternateTurn1 = boundaryAt(adapter, "alternate", demo.forkTurn, "post-intervention");
  action(harness.presentation, "select-live-boundary", { boundary: originalTurn3.id });
  action(harness.presentation, "select-live-npc", { npc: "mara" });
  action(harness.presentation, "switch-branch", { branch: "alternate" });
  action(harness.presentation, "select-live-boundary", { boundary: alternateTurn1.id });
  action(harness.presentation, "select-live-npc", { npc: "dain" });
  action(harness.presentation, "switch-branch", { branch: "original" });
  let state = harness.presentation.navigationState();
  assert.equal(state.selections.original, originalTurn3.id);
  assert.equal(state.inspectorSelections.original.id, "mara");
  action(harness.presentation, "switch-branch", { branch: "alternate" });
  state = harness.presentation.navigationState();
  assert.equal(state.selections.alternate, alternateTurn1.id);
  assert.equal(state.inspectorSelections.alternate.id, "dain");
});

test("manually selecting historical turn disables Follow live events", async () => {
  const harness = createHarness();
  await harness.presentation.start();
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  action(harness.presentation, "select-live-boundary", { boundary: boundaryAt(harness.adapter, "original", 1).id });
  assert.equal(harness.presentation.navigationState().followLive.original, false);
  assert.match(harness.app.innerHTML, /Jump to latest/);
});

test("Jump to latest restores the latest completed turn and Follow mode", async () => {
  const harness = createHarness();
  await harness.presentation.start();
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  action(harness.presentation, "live-step");
  const latest = boundaryAt(harness.adapter, "original", 3);
  action(harness.presentation, "select-live-boundary", { boundary: boundaryAt(harness.adapter, "original", 1).id });
  action(harness.presentation, "jump-live-latest");
  const state = harness.presentation.navigationState();
  assert.equal(state.selections.original, latest.id);
  assert.equal(state.followLive.original, true);
  assert.equal(harness.timeline.scrollTop, harness.timeline.scrollHeight);
});

test("timeline scrolling is internal and no inspector action uses scrollIntoView", () => {
  const css = read("styles.css");
  const source = `${read("app.js")}\n${read("live-presentation.js")}`;
  assert.match(css, /\.timeline[\s\S]*overflow-y: auto;[\s\S]*overscroll-behavior: contain/);
  assert.match(source, /restoreScrollState|restorePresentationScroll/);
  assert.doesNotMatch(source, /scrollIntoView/);
});

test("start page presents exactly two primary product choices", () => {
  const source = read("app.js");
  assert.match(source, /start-primary-choices/);
  assert.equal((source.match(/class="button [^"]*mode-choice"/g) || []).length, 2);
  assert.match(source, />Start AI Live</);
  assert.match(source, />Explore Demo</);
});

test("Deterministic Simulation remains available under Advanced Testing Modes", () => {
  const source = read("app.js");
  assert.match(source, /<details class="advanced-modes">[\s\S]*Advanced \/ Testing Modes[\s\S]*data-mode="deterministic"/);
  assert.match(source, /testing and reproducibility/);
});

test("Recorded Demo uses the shared portraits, locations, story, timeline, inspector, and terminal shell", () => {
  const source = read("app.js");
  for (const marker of ["portrait-image", "location-illustration", "story-beat", "world-map", "timeline", "inspector-scroll", "terminal-completion"]) {
    assert.match(source, new RegExp(marker));
  }
  for (const asset of ["clinic", "storehouse", "square"]) assert.match(source, new RegExp(`assets/\\$\\{escapeHtml\\(locationId\\)\\}\\.svg|${asset}`));
});

test("Recorded authored data remains byte-for-byte immutable", () => {
  const hash = crypto.createHash("sha256").update(read("recorded-data.js")).digest("hex");
  assert.equal(hash, "365e724d551eab0e78299e70e748616f667815b34c92cb033f0e0b2b88065a62");
});

test("Back to Start and Start New Simulation are present across all required major surfaces", () => {
  const app = read("app.js");
  const live = read("live-presentation.js");
  assert.match(app, /briefing-header[\s\S]*Back to Start/);
  assert.match(app, /brand-lockup brand-home[\s\S]*data-action="back-start"/);
  assert.doesNotMatch(app, /workspace-nav-actions"><button class="text-button"[^>]*data-action="back-start"/);
  assert.match(app, /recorded-terminal-completion[\s\S]*Start New Simulation[\s\S]*Back to Start/);
  assert.match(live, /brand-lockup brand-home[\s\S]*data-action="back-start"/);
  assert.doesNotMatch(live, /workspace-nav-actions"><button class="text-button"[^>]*data-action="back-start"/);
  assert.match(live, /live-state-back[\s\S]*Back to Start/);
  assert.match(live, /overlay-back-start[\s\S]*Back to Start/);
  assert.match(live, /Start New Simulation/);
});

test("Back to Start navigates without browser refresh and disposes only the presentation", async () => {
  const harness = createHarness();
  await harness.presentation.start();
  action(harness.presentation, "back-start");
  assert.equal(harness.backCount(), 1);
  assert.equal(harness.app.innerHTML, "START");
  assert.equal(harness.presentation.navigationState().disposed, true);
});

test("an active AI presentation safely ignores late provider completion after Back to Start", async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const adapter = dynamicAdapter(adapterApi.createLiveSession(), async (_branch, report) => {
    report({ phase: "generating", turn: 1 });
    await pending;
  });
  const harness = createHarness(adapter, { mode: "ai-live" });
  await harness.presentation.start();
  action(harness.presentation, "live-step");
  action(harness.presentation, "back-start");
  release();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(harness.app.innerHTML, "START");
  assert.equal(harness.backCount(), 1);
  assert.equal(harness.presentation.navigationState().disposed, true);
});

test("a new simulation starts with clean Original Turn 0 navigation state", async () => {
  const first = createHarness();
  await first.presentation.start();
  action(first.presentation, "live-step");
  action(first.presentation, "select-live-npc", { npc: "sera" });
  action(first.presentation, "back-start");
  const second = createHarness();
  await second.presentation.start();
  const state = second.presentation.navigationState();
  assert.equal(state.branch, "original");
  assert.equal(state.selections.original, boundaryAt(second.adapter, "original", 0, "initial").id);
  assert.equal(state.inspectorSelections.original.type, "event");
  assert.equal(state.followLive.original, true);
  assert.equal(state.disposed, false);
});
