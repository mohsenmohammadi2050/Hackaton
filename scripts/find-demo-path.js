"use strict";

const adapterApi = require("../live-session-adapter");

const candidates = Object.freeze([
  { turn: 0, recipientId: "mara", propositionId: "fact-case-spare-key", confidence: 90 },
  { turn: 2, recipientId: "dain", propositionId: "fact-antidote-storehouse", confidence: 90 },
  { turn: 4, recipientId: "mara", propositionId: "fact-antidote-storehouse", confidence: 90 },
  { turn: 5, recipientId: "sera", propositionId: "fact-case-spare-key", confidence: 90 },
  { turn: 7, recipientId: "dain", propositionId: "fact-orin-ordered-sera", confidence: 90 },
  { turn: 9, recipientId: "orin", propositionId: "fact-sera-moved-antidote", confidence: 90 }
]);

function requestFor(candidate, index) {
  return {
    id: `demo-search-${index}-t${String(candidate.turn).padStart(2, "0")}`,
    category: "Information",
    boundaryTurn: candidate.turn,
    payload: {
      recipientId: candidate.recipientId,
      propositionId: candidate.propositionId,
      truthStatus: "true-evidence",
      beliefStance: "believes-true",
      confidence: candidate.confidence,
      description: `A deterministic demo-search message gives ${candidate.recipientId} evidence for ${candidate.propositionId}.`
    }
  };
}

function evaluate(candidate, index) {
  try {
    const adapter = adapterApi.createLiveSession();
    adapter.forkAt(candidate.turn);
    adapter.applyIntervention(requestFor(candidate, index));
    adapter.completeAlternate();
    const comparison = adapter.compare();
    const outcomeChanges = ["medical", "truth", "social"].filter((key) => comparison.outcomes.original[key] !== comparison.outcomes.alternate[key]).length;
    const antidoteChanged = JSON.stringify(comparison.deltas.antidote.original) !== JSON.stringify(comparison.deltas.antidote.alternate);
    const score = outcomeChanges * 100 + (antidoteChanged ? 40 : 0) + Math.min(comparison.changedIntents.length, 30) + Math.min(comparison.deltas.trust.length, 10);
    return {
      score,
      candidate,
      outcomeChanges,
      antidoteChanged,
      changedIntents: comparison.changedIntents.length,
      trustChanges: comparison.deltas.trust.length,
      outcomes: comparison.outcomes
    };
  } catch (error) {
    return { score: -1, candidate, rejected: true, reason: error.message };
  }
}

const ranked = candidates.map(evaluate).sort((left, right) => right.score - left.score || left.candidate.turn - right.candidate.turn);
process.stdout.write(`${JSON.stringify(ranked, null, 2)}\n`);
