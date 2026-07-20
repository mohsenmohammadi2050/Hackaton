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

function createAppHarness(options = {}) {
  let clickHandler = null;
  let timerId = 0;
  const queuedTimers = [];
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
    setTimeout(callback, delay = 0) {
      timerId += 1;
      if (options.queuePlayback && delay > 20) {
        queuedTimers.push({ id: timerId, callback });
      } else {
        callback();
      }
      return timerId;
    },
    clearTimeout(id) {
      const index = queuedTimers.findIndex((timer) => timer.id === id);
      if (index >= 0) queuedTimers.splice(index, 1);
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
    flushNextPlaybackTimer() {
      const timer = queuedTimers.shift();
      assert.ok(timer, "no queued playback timer available");
      timer.callback();
    },
    pendingPlaybackTimers() {
      return queuedTimers.length;
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
  assert.deepEqual(Object.keys(data.snapshots).slice(0, 2), ["0", "1"]);
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
  const turnOne = data.events.filter((event) => event.turn === 1 && event.action);
  assert.equal(turnOne.length, 4);
  assert.deepEqual(Array.from(turnOne, (event) => event.actor).sort(), ["dain", "mara", "orin", "sera"]);
  assert.deepEqual(Array.from(turnOne, (event) => event.order), [1, 2, 3, 4]);
  assert.ok(turnOne.every((event) => event.rationale && event.goal));
});

test("Every Recorded action creates a memory for its actor", () => {
  const memoryOwners = new Map();
  for (const [characterId, character] of Object.entries(data.characters)) {
    for (const memory of character.memories) memoryOwners.set(memory.id, characterId);
  }

  for (const event of data.events.filter((candidate) => candidate.action)) {
    assert.ok(
      event.createdMemories.some((memoryId) => memoryOwners.get(memoryId) === event.actor),
      `${event.id} does not create a memory for ${event.actor}`
    );
  }
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
  assert.match(appSource, /Explore Recorded Demo/);
  assert.match(appSource, /mode-pill-strong/);
  assert.match(appSource, /slice\(-6\)/);
});

test("Phase 1 navigation and inspection remain while later-phase controls stay excluded", () => {
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

  assert.doesNotMatch(appSource, /data-action="fork"/);
  assert.doesNotMatch(appSource, /data-action="compare"/);
  assert.doesNotMatch(appSource, /data-action="reveal-truth"/);
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
  assert.match(harness.html(), /Start AI Live Simulation/);
  assert.match(harness.html(), /Explore Recorded Demo/);

  harness.click("watch-recorded");
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
  assert.match(harness.announcement(), /Turn (?:one|1) complete/);

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
  assert.match(harness.html(), /<strong>Ready<\/strong>/);
  assert.doesNotMatch(harness.html(), /Mara finds spare-key marks/);
  assert.match(harness.announcement(), /restarted at turn zero/i);
});

test("Recorded Original contains twelve complete authored turns and stable outcomes", () => {
  assert.deepEqual(Object.keys(data.snapshots), Array.from({ length: 13 }, (_, turn) => String(turn)));
  for (let turn = 0; turn <= 12; turn += 1) {
    assert.equal(data.snapshots[turn].turnsRemaining, 12 - turn);
  }

  const legalActions = new Set(["Move", "Investigate", "Communicate", "Transfer", "Administer", "Accuse", "Wait"]);
  for (let turn = 1; turn <= 12; turn += 1) {
    const intents = data.events.filter((event) => event.turn === turn && event.action !== null);
    assert.equal(intents.length, 4, `turn ${turn} must contain four NPC intents`);
    assert.equal(new Set(Array.from(intents, (event) => event.actor)).size, 4, `turn ${turn} repeats an actor`);
    assert.ok(intents.every((event) => legalActions.has(event.action)), `turn ${turn} contains an illegal action family`);
  }

  assert.equal(data.originalOutcome.id, "outcome-original-v1");
  assert.equal(data.originalOutcome.labels.medical.id, "outcome-original-medical-lost");
  assert.equal(data.originalOutcome.labels.truth.id, "outcome-original-truth-exposed");
  assert.equal(data.originalOutcome.labels.social.id, "outcome-original-social-fractured");
  assert.deepEqual(
    Array.from(data.originalOutcome.pivotalEvents),
    ["evt-orig-t04-orin-move-storehouse", "evt-orig-t05-orin-find-antidote", "evt-orig-t11-sera-confession"]
  );
});

test("Event history is append-only ordered data with unique stable identities", () => {
  const eventIds = Array.from(data.events, (event) => event.id);
  assert.equal(new Set(eventIds).size, eventIds.length);
  assert.ok(data.events.every(Object.isFrozen));

  for (let turn = 0; turn <= 12; turn += 1) {
    const events = data.events.filter((event) => event.turn === turn);
    assert.ok(events.length > 0, `turn ${turn} has no events`);
    const expectedOrder = Array.from({ length: events.length }, (_, index) => turn === 0 ? index : index + 1);
    assert.deepEqual(Array.from(events, (event) => event.order), expectedOrder);
  }

  assert.ok(data.events.find((event) => event.id === "evt-orig-t12-outcome"));
});

test("Recorded locations, possession, trust, and final outcome remain consistent", () => {
  assert.deepEqual(Array.from(data.snapshots[4].locations.storehouse), ["orin"]);
  assert.deepEqual(Array.from(data.snapshots[6].locations.storehouse), ["sera"]);
  assert.deepEqual(Array.from(data.snapshots[10].locations.storehouse).sort(), ["dain", "orin"]);
  assert.deepEqual(Array.from(data.snapshots[12].locations.square).sort(), ["dain", "orin"]);

  const orinAtFive = data.characters.orin.history.find((entry) => entry.turn === 5);
  assert.match(orinAtFive.item, /Antidote/);
  const maraAtEleven = data.characters.mara.history.find((entry) => entry.turn === 11);
  assert.equal(maraAtEleven.trust.orin, -65);
  assert.equal(maraAtEleven.trust.sera, 25);
  assert.match(data.snapshots[12].patient, /Lost/);
  assert.deepEqual(Array.from(data.originalOutcome.antidotePath), [
    "Storehouse · turns 0–4",
    "Orin takes possession · turn 5",
    "Still held by Orin · turn 12"
  ]);
});

test("Every snapshot clock, location, patient, item, and trust change is event-backed", () => {
  const locationOf = (snapshot, characterId) => Object.entries(snapshot.locations)
    .find(([, occupants]) => occupants.includes(characterId))?.[0];

  for (let turn = 1; turn <= 12; turn += 1) {
    const previous = data.snapshots[turn - 1];
    const current = data.snapshots[turn];
    const turnEvents = data.events.filter((event) => event.turn === turn);

    assert.ok(
      turnEvents.some((event) => event.category === "Clock update" && event.changes.some((change) => change.includes(String(current.turnsRemaining)))),
      `turn ${turn} clock is not event-backed`
    );

    for (const characterId of Object.keys(data.characters)) {
      if (locationOf(previous, characterId) === locationOf(current, characterId)) continue;
      assert.ok(
        turnEvents.some((event) => event.actor === characterId && event.action === "Move" && event.changes.some((change) => change.includes("location:"))),
        `turn ${turn} location change for ${characterId} is not event-backed`
      );
    }

    if (previous.patient !== current.patient) {
      assert.ok(turnEvents.some((event) => event.changes.some((change) => change.startsWith("Patient:"))));
    }
  }

  assert.ok(data.events.some((event) => event.turn === 5 && event.changes.some((change) => /Antidote.*Orin|Orin.*Antidote/i.test(change))));

  for (const [characterId, character] of Object.entries(data.characters)) {
    for (const historyEntry of character.history.filter((entry) => entry.turn > 0 && entry.trust)) {
      assert.ok(
        data.events.some((event) => event.turn === historyEntry.turn && event.category === "Trust update"),
        `turn ${historyEntry.turn} trust change for ${characterId} is not event-backed`
      );
    }
  }
});

test("Step advances exactly one complete turn through the full Recorded branch", () => {
  const harness = createAppHarness();
  harness.click("open-briefing");
  harness.click("enter-world");

  harness.click("step");
  assert.match(harness.html(), /Turn 1 boundary/);
  assert.doesNotMatch(harness.html(), /Turn 2 boundary/);
  harness.click("step");
  assert.match(harness.html(), /Turn 2 boundary/);
  assert.match(harness.html(), /Mara moves to the Village Square/);
});

test("Run reaches the complete Original outcome and stops automatically", () => {
  const harness = createAppHarness();
  harness.click("open-briefing");
  harness.click("enter-world");
  harness.click("run");

  assert.match(harness.html(), /Current turn<\/span><strong>12/);
  assert.match(harness.html(), /Branch complete/);
  assert.match(harness.html(), />Lost</);
  assert.match(harness.html(), />Exposed</);
  assert.match(harness.html(), />Fractured</);
  assert.match(harness.html(), /<strong>Complete<\/strong>/);
});

test("Pause stops playback only at a completed boundary", () => {
  const harness = createAppHarness({ queuePlayback: true });
  harness.click("open-briefing");
  harness.click("enter-world");
  harness.click("run");
  assert.equal(harness.pendingPlaybackTimers(), 1);

  harness.flushNextPlaybackTimer();
  assert.match(harness.html(), /Current turn<\/span><strong>1/);
  assert.equal(harness.pendingPlaybackTimers(), 1);
  harness.click("pause");

  assert.equal(harness.pendingPlaybackTimers(), 0);
  assert.match(harness.html(), /<strong>Paused<\/strong>/);
  assert.match(harness.announcement(), /paused at completed turn 1/i);
});

test("Restart after outcome reproduces the Phase 1 turn-zero checkpoint", () => {
  const harness = createAppHarness();
  harness.click("open-briefing");
  harness.click("enter-world");
  harness.click("run");
  harness.click("restart");

  assert.match(harness.html(), /Turn 0 boundary/);
  assert.match(harness.html(), /<strong>Ready<\/strong>/);
  assert.doesNotMatch(harness.html(), /Branch complete/);
  assert.doesNotMatch(harness.html(), /Turn 1 complete/);
});
