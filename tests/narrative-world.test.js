"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const adapterApi = require("../live-session-adapter");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Narrative view derives its story beat and four action lines from authoritative events", () => {
  const adapter = adapterApi.createLiveSession();
  const turnOne = adapter.viewAt("original", adapter.boundaryList("original").find((boundary) => boundary.turn === 1).id);
  assert.equal(turnOne.narrative.actions.length, 4);
  assert.ok(turnOne.narrative.actions.every((action) => action.eventId && turnOne.currentTurnEvents.some((event) => event.id === action.eventId)));
  const authoritativeDescriptions = turnOne.currentTurnEvents.map((event) => event.description);
  assert.ok(authoritativeDescriptions.some((description) => turnOne.narrative.summary.includes(description)));
  assert.deepEqual(turnOne.narrative.movedNpcIds, turnOne.currentTurnEvents.filter((event) => event.action === "Move").map((event) => event.actorId));
});

test("World view exposes patient, antidote, locations, and recognizable character placement", () => {
  const view = adapterApi.createLiveSession().currentView("original");
  assert.equal(Object.keys(view.locations).length, 3);
  assert.equal(Object.keys(view.npcs).length, 4);
  assert.equal(view.patient.id, "niko");
  assert.equal(view.antidote.id, "antidote");
  assert.ok(Object.values(view.locations).every((location) => Array.isArray(location.occupantIds)));
});

test("All required narrative assets are local original SVG files", () => {
  for (const name of ["mara", "dain", "sera", "orin", "niko", "clinic", "square", "storehouse", "antidote"]) {
    const source = read(`assets/${name}.svg`);
    assert.match(source, /^<svg/);
    assert.doesNotMatch(source, /(?:href|src)=["']https?:\/\//);
  }
});

test("Presentation prioritizes story summary while keeping the technical inspector", () => {
  const presentation = read("live-presentation.js");
  const css = read("styles.css");
  assert.match(presentation, /Latest authoritative story beat/);
  assert.match(presentation, /story-actions/);
  assert.match(presentation, /story-vitals/);
  assert.match(presentation, /assets\/niko\.svg/);
  assert.match(presentation, /assets\/antidote\.svg/);
  assert.match(presentation, /NPC inspector · owned perspective/);
  assert.match(presentation, /Event inspector/);
  assert.match(css, /\.story-beat/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.npc-token\.is-moving/);
});
