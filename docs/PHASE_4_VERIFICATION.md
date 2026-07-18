# Phase 4 Verification — Four Autonomous NPC Decision Agents

**Checkpoint:** `phase-4-D2-four-autonomous-npcs`

**Scope:** Phase 4 only

**Authority:** `PRODUCT_SPEC.md`, `BUILD_STRATEGY.md`, `EXECUTION_CONTRACT.md`, and `AGENTS.md`

## Result

Mara, Dain, Sera, and Orin now each select one intent from an isolated owned-state projection. Their deterministic autonomous policies reproduce the complete twelve-turn Original without reading the Phase 3 `originalIntents` fixture and reach the authoritative **Lost / Exposed / Fractured** outcome.

The World Engine remains the sole state resolver. The Decision Layer can propose and validate an intent but cannot mutate a location, item, patient, trust value, belief, memory, public record, clock, event history, or outcome.

The Recorded Original and its browser Presentation Layer remain unchanged and do not load the Decision or World files.

## Architecture

```text
Presentation Layer -> Recorded Layer

NPC agents -> owned projection -> Decision Layer -> World Engine

Phase 3 predetermined intents ---------------------> World Engine
```

- `npc-agents.js` contains four deterministic decision policies. It has no World, Recorded, or Presentation access.
- `decision-layer.js` creates projections, selects relevant memories, parses and validates JSON intent output, manages retries, and submits exactly four accepted intents to the World Engine.
- `world-engine.js` remains authoritative and performs resolution-time legality checks, events, consequences, and completed-boundary creation.
- `world-scenario.js` retains Phase 3 predetermined intents as a regression/reference input. The autonomous path does not read them; verification deletes `originalIntents` before running all twelve autonomous turns.
- `recorded-data.js`, `app.js`, `index.html`, and `styles.css` are unchanged.

No Fork, Intervention, alternate branch, Comparison, Director mode, Live UI, or user world-state editing was introduced.

## Owned-state projection

Each agent receives a deeply frozen projection containing only:

- scenario and Original branch identity;
- current completed turn and visible clock;
- public patient status and treatment location;
- the NPC's current location;
- public location definitions;
- public identity, name, and role for the four known characters;
- public identity fields for currently co-located NPCs;
- the NPC's own traits, posture, goals, directed trust, beliefs, and inventory;
- at most six selected memories owned by that NPC and available at the completed boundary;
- action options derivable from owned state;
- visible acting priority for the next turn.

The projection excludes canonical facts, global antidote state, public-record state from unwitnessed locations, event history, boundaries, outcomes, unpublished intents, other NPC locations, and every other NPC's inventory, goals, trust, beliefs, memories, posture, and current intent.

Known public identities may be named as targets even when not currently co-located. This does not expose their location or future action. The World Engine decides whether the target is co-located when the intent resolves, allowing a structured legal candidate to become a visible failed action after movement.

### Starting-knowledge defect fixed

The projection audit found that the Phase 3 World starting state gave Mara and Dain “uncertain” belief records whose proposition identities named hidden truths. Those records were removed. Mara's starting key memory now supports the narrower public proposition that Orin owns a spare key, not the discoverable fact that the empty case was opened with it. Recorded data was not changed.

## Relevant-memory selection

Selection considers only immutable memories owned by the deciding NPC with `memory.turn <= completedBoundary.turn`.

Each memory receives deterministic relevance from:

1. critical, important, or ordinary salience;
2. recency;
3. terms shared with the primary goal;
4. the NPC's current location;
5. currently co-located involved characters;
6. magnitude of the NPC's directed trust toward involved characters;
7. whether the memory currently supports an owned belief;
8. deadline, Niko, or antidote relevance.

Ties resolve by newest turn and then stable memory identity. Only the top six are placed in the projection. An intent may cite only identities from that supplied set. The full authoritative memory history remains in the World Layer and is never passed to the agent.

## Agent decisions

The four agents are deterministic goal/belief/memory policies, not authored turn tables:

- They receive no predetermined intent sequence.
- They examine owned goals, beliefs, trust, location, inventory, clock, co-located public identities, and relevant memories.
- They return one JSON intent with action family, target fields, served goal, concise rationale, and zero to three recalled memory citations.
- Their intent identities are deterministic `auto-*` identities separate from both Recorded and Phase 3 event identities.
- Tests mutate only supplied owned beliefs and demonstrate that Mara and Sera select different actions.

This is autonomous under the MVP contract because the agents choose actions from their permitted current perspective and change behavior when that perspective changes. No external language model or Live UI is introduced in this phase.

## Validation and retry

Validation has three intentionally distinct outcomes:

### Malformed output

Examples include invalid JSON, a non-object payload, missing required fields, wrong field types, unknown fields for the selected action, or agent execution failure. The attempt is labeled `malformed-output` and retried.

### Rejected output

The JSON is structurally valid but violates the owned decision contract—for example wrong actor, stale boundary, unknown action, unowned goal, more than six citations, citation outside the supplied recall set, unsupported fact assertion, unknown target, or illegal owned-state option. The attempt is labeled `rejected-output` and retried.

A statement presented as fact or confession is accepted only when the NPC has both a believes-true owned belief and a recalled supporting memory for that fact. Claims may still be unsupported or false because claims remain distinct from world truth.

### Resolution-invalid legal intent

The candidate passes Decision Layer validation but a prior movement or item action makes it illegal at resolution time. The World Engine emits a phase-four `Failed action` event with no prohibited change. The turn completes; this is not a malformed-output retry.

### Retry boundary

Before every attempt, the runner calls `restoreBoundary` for the last completed frozen turn. If any agent output is malformed or rejected, every candidate from that attempt is discarded and all four agents decide again from the same restored boundary. The default maximum is three attempts. Exhaustion raises `DecisionTurnError` with an audit record and leaves the completed boundary unchanged.

## Verification

| Requirement | Verification |
|---|---|
| Four autonomous NPCs replay the Original | The autonomous test removes `scenario.originalIntents`, runs all four agents for twelve turns, and compares every NPC/action family per turn to the Recorded Original. |
| Exactly one intent per NPC per turn | Every accepted turn contains four intents and four unique actor identities selected from the same prior boundary. |
| Owned-state isolation | Projection tests reject forbidden state fields and verify that Mara and Dain receive no hidden fact identities while Sera and Orin receive only the hidden facts they own. |
| Maximum six relevant owned memories | Selection is deterministic, capped at six, strictly owner-matched and boundary-available, and smaller than full history after the scenario develops. Every citation belongs to the supplied set. |
| Output validation | Tests cover malformed JSON, unowned memory citations, hidden fact assertion, and exhaustive retry failure. |
| Resolution-invalid distinction | A Dain communication becomes invalid after Orin moves. It produces one World failed-action event, no claim, and no retry. |
| Frozen-boundary retry | A malformed turn-two output retries from completed turn one. The resulting state is deeply identical to the no-failure turn-two state, and no failed attempt enters history. |
| Deterministic replay | Two complete autonomous runs, including intents, audit records, World state, events, memories, beliefs, trust, and outcome, are deeply equal. |
| Recorded parity | All thirteen boundaries match Recorded clock, patient, locations, directed trust, antidote custody, and final Lost / Exposed / Fractured labels. |
| Recorded independence | All 19 D1 tests still pass. Production source scans confirm the browser and Recorded files have no Decision or World dependencies. |

## Architectural decisions

1. Add a one-way Decision Layer rather than extending the World Engine with decision policy.
2. Keep agent policies stateless; authoritative memory and belief state remains exclusively in the World boundary.
3. Serialize agent output as JSON even for local deterministic agents so parsing and future model integration use the same contract.
4. Validate against projections before calling the World Engine, then revalidate legality inside the World Engine at resolution time.
5. Permit known but non-local communication/accusation targets as candidates without revealing location; resolution determines success after movement.
6. Retry the whole four-agent decision set so no agent can observe another attempt's unpublished intent.
7. Preserve Phase 3 predetermined intents as a separate regression route instead of deleting a passing checkpoint artifact.
8. Keep autonomous intent identities separate from Recorded and predetermined World identities.
9. Use deterministic rule policies rather than an external model to satisfy repeatability and the prohibition on Live UI in this phase.
10. Correct the World starting-knowledge leak without touching the finished Recorded artifact.

## Intentional technical debt

- The four policies are scenario-specific deterministic code. They are autonomous state-responsive policies, but not general-purpose planners or external model-backed agents.
- Agent execution is synchronous. Async provider calls, cancellation, timeouts, and concurrency are deferred.
- Relevant-memory weights are fixed heuristics and have not been tuned against varied live stories.
- Retry reruns all four agents even when only one output failed. This is safest for unpublished-intent isolation but may be expensive with external models.
- Validation is handwritten rather than generated from a formal JSON Schema.
- Decision audit records exist in the returned run result but are not persisted or rendered.
- There is no production adapter between autonomous World runs and the UI, by explicit Phase 4 scope.
- `npc-agents.js` keeps all four policies together. A split is deferred until Phase 5 proves whether provider, prompt, or per-NPC modules form the stable seam.

## Risks for Phase 5

- External or nondeterministic agents may produce valid stories that no longer match the reference Original; Recorded D1 must remain the fallback while World validity replaces story parity as the main live criterion.
- Async decisions must all use the same frozen boundary and must never expose one NPC's unpublished output to another.
- Provider payload construction must serialize the owned projection directly and never receive the full World state as an intermediate convenience.
- Timeouts, rate limits, malformed output, and individual provider failures need recoverable deciding/failure states without exposing partial turns.
- Retrying all four external calls may increase latency and cost; optimizing individual retries must not leak or reuse unpublished cross-agent state.
- The fixed six-memory scoring may omit a story-critical memory in emergent runs. Evaluation will need observability without expanding the agent context beyond owned memory.
- A future Presentation adapter must render World events and deciding/failure states without computing consequences and without modifying Recorded playback.
- Model rationales may be plausible but unsupported. The existing goal and citation validation must remain mandatory.
- Phase 5 may justify splitting the policy/provider adapter from projection and orchestration, but the World Engine should remain untouched unless a concrete authoritative-rule defect is found.

## Verification commands

```text
npm.cmd run check
npm.cmd test
```

Expected result: syntax checks pass and all 40 tests pass with zero failures.
