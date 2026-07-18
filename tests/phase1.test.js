"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function loadRecordedData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read("recorded-data.js"), context, { filename: "recorded-data.js" });
  return context.window.FORKED_FATES_PHASE1;
}

const data = loadRecordedData();

function createAppHarness() {
  let clickHandler = null;
  const appNode = {
    innerHTML: "",
    addEventListener(type, handler) {
      if (type === "click") clickHandler = handler;
    }
  };
  const announcer = { textContent: "" };
  const mainContent = { focus() {} };
  const document = {
    getElementById(id) {
      if (id === "app") return appNode;
      if (id === "announcer") return announcer;
      if (id === "main-content") return mainContent;
      return null;
    }
  };
  const window = {
    FORKED_FATES_PHASE1: data,
    setTimeout(callback) {
      callback();
    }
  };
  const context = { document, window };
  vm.createContext(context);
  vm.runInContext(read("app.js"), context, { filename: "app.js" });

  return {
    html() {
      return appNode.innerHTML;
    },
    announcement() {
      return announcer.textContent;
    },
    click(action, dataset = {}) {
      assert.ok(clickHandler, "application click handler was not registered");
      clickHandler({
        target: {
          closest() {
            return { dataset: { action, ...dataset } };
          }
        }
      });
    }
  };
}

test("Recorded slice contains the exact Phase 1 world shape", () => {
  assert.equal(Object.keys(data.characters).length, 4);
  assert.equal(Object.keys(data.locations).length, 3);
  assert.deepEqual(Object.keys(data.snapshots), ["0", "1"]);
  assert.equal(data.snapshots[0].turnsRemaining, 12);
  assert.equal(data.snapshots[1].turnsRemaining, 11);
  assert.match(data.snapshots[0].patient, /Untreated/);
  assert.equal(data.product.scenario, "The Last Antidote");
});

test("Briefing-facing content does not reveal the hidden causal chain", () => {
  const publicCopy = [
    data.product.premise,
    ...Object.values(data.characters).map((character) => character.publicDescription)
  ].join(" ");

  assert.doesNotMatch(publicCopy, /Orin ordered/i);
  assert.doesNotMatch(publicCopy, /placed (?:it|the antidote|the vial) in the Storehouse/i);
  assert.doesNotMatch(publicCopy, /reserve it for a wealthy envoy/i);
});

test("Turn 1 is one complete Recorded intent per NPC", () => {
  const turnOne = data.events.filter((event) => event.turn === 1);
  assert.equal(turnOne.length, 4);
  assert.deepEqual(Array.from(turnOne, (event) => event.actor).sort(), ["dain", "mara", "orin", "sera"]);
  assert.deepEqual(Array.from(turnOne, (event) => event.order), [1, 2, 3, 4]);
  assert.ok(turnOne.every((event) => event.rationale && event.goal));
});

test("Every cited and created memory exists at an allowed turn", () => {
  const memories = new Map();
  for (const character of Object.values(data.characters)) {
    for (const memory of character.memories) {
      assert.equal(memories.has(memory.id), false, `duplicate memory ${memory.id}`);
      memories.set(memory.id, memory);
    }
  }

  for (const event of data.events) {
    for (const citedId of event.citedMemories) {
      const memory = memories.get(citedId);
      assert.ok(memory, `missing cited memory ${citedId}`);
      assert.ok(memory.turn < event.turn, `${citedId} was not available before ${event.id}`);
    }
    for (const createdId of event.createdMemories) {
      const memory = memories.get(createdId);
      assert.ok(memory, `missing created memory ${createdId}`);
      assert.equal(memory.turn, event.turn, `${createdId} has the wrong originating turn`);
    }
  }
});

test("Consequential events expose the Phase 1 inspector contract", () => {
  const requiredFields = [
    "happened",
    "actor",
    "targets",
    "location",
    "turn",
    "visibility",
    "rationale",
    "goal",
    "citedMemories",
    "witnesses",
    "createdMemories",
    "changes",
    "causes"
  ];
  const consequential = data.events.find((event) => event.id === "evt-shared-t01-mara-key");
  assert.ok(consequential);
  for (const field of requiredFields) {
    assert.ok(Object.hasOwn(consequential, field), `missing event field ${field}`);
  }
  assert.match(consequential.category, /fact/i);
  assert.ok(consequential.changes.length > 0);
  assert.ok(consequential.citedMemories.length > 0);
});

test("Information types and the Recorded mode are visibly distinguished", () => {
  const appSource = read("app.js");
  assert.match(appSource, />World fact</);
  assert.match(appSource, />Claim</);
  assert.match(appSource, />Belief</);
  assert.match(appSource, />Memory</);
  assert.match(appSource, /Recorded preview/);
  assert.match(appSource, /mode-pill-strong/);
  assert.match(appSource, /slice\(-6\)/);
});

test("Navigation, inspection, Step, and Restart are present without Phase 2 controls", () => {
  const appSource = read("app.js");
  for (const action of [
    "open-briefing",
    "enter-world",
    "select-npc",
    "select-event",
    "select-turn",
    "step",
    "restart"
  ]) {
    assert.match(appSource, new RegExp(`data-action=\\"${action}\\"|action === \\"${action}\\"`));
  }

  assert.doesNotMatch(appSource, /data-action="run"/);
  assert.doesNotMatch(appSource, /data-action="pause"/);
  assert.doesNotMatch(appSource, /data-action="fork"/);
  assert.match(appSource, /state\.currentTurn = 0/);
  assert.match(appSource, /state\.selection = \{ type: "event", id: "evt-shared-t00-start" \}/);
});

test("The static entry point and responsive presentation are self-contained", () => {
  const html = read("index.html");
  const css = read("styles.css");
  assert.match(html, /<script src="recorded-data\.js"><\/script>/);
  assert.match(html, /<script src="app\.js"><\/script>/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(css, /@media \(max-width: 1180px\)/);
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test("The real application script completes the Phase 1 navigation journey", () => {
  const harness = createAppHarness();

  assert.match(harness.html(), /Forked Fates/);
  assert.match(harness.html(), /Begin The Last Antidote/);
  assert.match(harness.html(), /Watch recorded demonstration/);

  harness.click("open-briefing");
  assert.match(harness.html(), /Scenario briefing/);
  assert.match(harness.html(), /twelve turns away/i);
  assert.doesNotMatch(harness.html(), /Orin ordered Sera/i);

  harness.click("enter-world");
  assert.match(harness.html(), /Turn 0 boundary/);
  assert.match(harness.html(), /Original/);
  assert.match(harness.html(), /Recorded/);
  assert.match(harness.html(), /Clinic/);
  assert.match(harness.html(), /Village Square/);
  assert.match(harness.html(), /Storehouse/);

  harness.click("step");
  assert.match(harness.html(), /Turn 1 boundary/);
  assert.match(harness.html(), /Mara finds spare-key marks/);
  assert.match(harness.announcement(), /Turn one complete/);

  harness.click("select-npc", { npc: "mara" });
  assert.match(harness.html(), /NPC inspector/);
  assert.match(harness.html(), /Directed trust/);
  assert.match(harness.html(), /Beliefs/);
  assert.match(harness.html(), /Relevant memories/);

  harness.click("select-event", { event: "evt-shared-t01-sera-denial" });
  assert.match(harness.html(), /Event inspector/);
  assert.match(harness.html(), /Declared rationale/);
  assert.match(harness.html(), /Witnesses (?:&|&amp;) memories/);
  assert.match(harness.html(), /Immediate consequences/);
});

test("Timeline review does not advance time and Restart restores turn zero", () => {
  const harness = createAppHarness();
  harness.click("open-briefing");
  harness.click("enter-world");
  harness.click("step");
  harness.click("select-turn", { turn: "0" });

  assert.match(harness.html(), /Reviewing turn 0/);
  assert.match(harness.html(), /Current branch remains at turn 1/);

  harness.click("restart");
  assert.match(harness.html(), /Turn 0 boundary/);
  assert.match(harness.html(), /Ready to resolve turn 1/);
  assert.doesNotMatch(harness.html(), /Mara finds spare-key marks/);
  assert.match(harness.announcement(), /restarted at turn zero/i);
});
