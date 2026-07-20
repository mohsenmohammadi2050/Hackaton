"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("desktop workspace stays in one viewport with independent narrative, timeline, and inspector scroll regions", () => {
  const css = read("styles.css");
  assert.match(css, /@media \(min-width: 1181px\)[\s\S]*\.workspace \{[\s\S]*height: 100dvh;[\s\S]*overflow: hidden;/);
  assert.match(css, /@media \(min-width: 1181px\)[\s\S]*\.world-column \{ overflow-y: auto; overscroll-behavior: contain; \}/);
  assert.match(css, /@media \(min-width: 1181px\)[\s\S]*\.timeline[\s\S]*overflow-y: auto;[\s\S]*overscroll-behavior: contain;/);
  assert.match(css, /@media \(min-width: 1181px\)[\s\S]*\.inspector-scroll[\s\S]*overflow-y: auto;[\s\S]*overscroll-behavior: contain;/);
});

test("turn resolution never scrolls the document and follow-live scrolling is local and optional", () => {
  const source = read("live-presentation.js");
  assert.doesNotMatch(source, /window\.scrollTo|win\.scrollTo|scrollIntoView/);
  assert.match(source, /followLive: true/);
  assert.match(source, /data-action="toggle-follow"/);
  assert.match(source, /aria-pressed="\$\{ui\.followLive\}"/);
  assert.match(source, /timeline\.scrollTop = timeline\.scrollHeight/);
  assert.match(source, /if \(ui\.followLive \|\| wasFollowingFrontier\)/);
});

test("Recorded and Live playback controls use the same plain-language labels and exact tooltips", () => {
  const recorded = read("app.js");
  const live = read("live-presentation.js");
  for (const source of [recorded, live]) {
    assert.match(source, /Next Turn/);
    assert.match(source, /Run to End/);
    assert.match(source, /Resolve one decision round and stop\./);
    assert.match(source, /Continue automatically until paused or completed\./);
    assert.match(source, /Stop after the current turn finishes\./);
  }
  for (const status of ["Ready", "Auto-running", "Paused", "Complete"]) assert.match(recorded, new RegExp(status));
});

test("the normal intervention composer explains effects without exposing a canned demo shortcut", () => {
  const source = read("live-presentation.js");
  assert.match(source, /Private evidence gives only the selected recipient/);
  assert.match(source, /A real item can move only between valid co-located participants/);
  assert.match(source, /A supported condition becomes observable at one location/);
  assert.doesNotMatch(source, /Use approved demo intervention/);
  assert.match(source, /showDemoTools \? `<button[\s\S]*Load competition demo setup/);
  assert.match(source, /new URLSearchParams[\s\S]*get\("demo"\) === "1"/);
});

test("the competition helper is guarded by both explicit demo mode and the documented fork turn", () => {
  const source = read("live-presentation.js");
  assert.match(source, /action === "apply-demo-intervention" && showDemoTools && selectedView\(\)\.boundary\.turn === demoConfig\?\.forkTurn/);
  assert.match(source, /Available at turn \$\{demoConfig\?\.forkTurn\}/);
});

test("responsive workspace contains fork controls at 375px and preserves reduced-motion behavior", () => {
  const css = read("styles.css");
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.workspace-topbar \{ overflow: hidden; \}/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.button-fork,[\s\S]*\.button-resolve \{ width: 100%; min-width: 0; flex: 0 0 auto; \}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration: 0\.01ms !important/);
});

test("AI status and failure labels are branch-local and distinguish invalid model output", () => {
  const source = read("live-presentation.js");
  assert.match(source, /WORLD_RESOLUTION_ERROR[\s\S]*World resolution error/);
  assert.match(source, /INTENT_VALIDATION_ERROR[\s\S]*Intent validation error/);
  assert.match(source, /AI_PROVIDER_ERROR[\s\S]*AI provider error/);
  assert.match(source, /pausedStatus \|\| `Ready at Turn \$\{frontier\.boundary\.turn\}`/);
  assert.doesNotMatch(source, /ui\.aiStatus \|\| `Ready at Turn/);
});
