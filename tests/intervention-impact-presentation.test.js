"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const adapterApi = require("../src/adapters/live-session-adapter");
const viewModels = require("../src/presentation/live-view-models");
const presentation = require("../src/presentation/live-presentation");

const root = path.resolve(__dirname, "..");

function interventionSummary(request) {
  const adapter = adapterApi.createLiveSession();
  adapter.forkAt(request.boundaryTurn);
  adapter.applyIntervention(request);
  return viewModels.createInterventionSummary(adapter.getSession().alternate);
}

function informationAtTurnOne() {
  return {
    id: "presentation-dain-evidence-t01",
    category: "Information",
    boundaryTurn: 1,
    payload: {
      recipientId: "dain",
      propositionId: "fact-case-spare-key",
      truthStatus: "true-evidence",
      beliefStance: "believes-true",
      confidence: 90,
      description: "A sealed Clinic record supplies Dain with exact spare-key evidence."
    }
  };
}

test("post-intervention boundary has an unambiguous human-readable heading", () => {
  assert.equal(presentation.boundaryHeading({ turn: 1, classification: "turn-close" }), "Turn 1");
  assert.equal(presentation.boundaryHeading({ turn: 1, classification: "post-intervention" }), "Intervention applied after Turn 1");
});

test("Information intervention summary names its target, exact information, memory, and applied turn", () => {
  const summary = interventionSummary(informationAtTurnOne());
  assert.equal(summary.type, "Information");
  assert.equal(summary.targetCharacter, "Dain Holt");
  assert.equal(summary.appliedDetail, "A sealed Clinic record supplies Dain with exact spare-key evidence.");
  assert.equal(summary.createdEffect, "Memory created for Dain Holt: A sealed Clinic record supplies Dain with exact spare-key evidence.");
  assert.equal(summary.appliedTurn, 1);
  assert.equal(summary.appliedTurnLabel, "After Turn 1");
});

test("Item-transfer and environmental summaries describe their authoritative state changes", () => {
  const item = interventionSummary({
    id: "presentation-antidote-transfer-t09",
    category: "ItemTransfer",
    boundaryTurn: 9,
    payload: {
      itemId: "antidote",
      fromId: "orin",
      toId: "sera",
      description: "An external counterfactual transfers Orin's antidote to co-located Sera."
    }
  });
  assert.equal(item.type, "Item transfer");
  assert.equal(item.targetCharacter, "Sera Quill");
  assert.match(item.appliedDetail, /Antidote transferred from Orin Voss to Sera Quill/);
  assert.equal(item.createdEffect, "Antidote holder became Sera Quill.");

  const environment = interventionSummary({
    id: "presentation-smoke-t00",
    category: "EnvironmentalEvent",
    boundaryTurn: 0,
    payload: {
      locationId: "clinic",
      conditionId: "condition-smoke",
      conditionState: "active",
      description: "Smoke becomes directly observable at the Clinic."
    }
  });
  assert.equal(environment.type, "Environmental event");
  assert.equal(environment.targetCharacter, "Mara Vale");
  assert.match(environment.appliedDetail, /Smoke became active at Clinic/);
  assert.equal(environment.createdEffect, "Smoke is active at Clinic.");
});

test("Comparison repeats the intervention summary and identifies the first Turn 2 observable impact", () => {
  const adapter = adapterApi.createLiveSession();
  adapter.forkAt(1);
  adapter.applyIntervention(informationAtTurnOne());
  const postIntervention = adapter.currentView("alternate");
  adapter.completeAlternate();
  const comparison = adapter.compare();

  assert.deepEqual(comparison.intervention, postIntervention.intervention);
  assert.equal(comparison.firstObservableImpact.turn, 2);
  assert.equal(comparison.firstObservableImpact.kind, "Changed decision");
  assert.match(comparison.firstObservableImpact.detail, /Dain Holt: Move .* Accuse/);
});

test("Timeline and Comparison render the same complete intervention card before impact details", () => {
  const source = fs.readFileSync(path.join(root, "src/presentation/live-presentation.js"), "utf8");
  const styles = fs.readFileSync(path.join(root, "styles.css"), "utf8");
  for (const label of ["Target character", "Applied", "Memory or state created", "Applied turn"]) assert.match(source, new RegExp(label));
  assert.match(source, /boundary\.classification === "post-intervention" \? renderInterventionCard\(frontier\.intervention\)/);
  assert.match(source, /renderInterventionCard\(result\.intervention, "comparison"\)/);
  assert.match(source, /First observable impact: Turn \$\{impact\.turn\}/);
  assert.match(styles, /\.intervention-summary-card[\s\S]*\.first-observable-impact/);
});
