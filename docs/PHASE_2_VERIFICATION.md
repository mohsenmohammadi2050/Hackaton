# Phase 2 Verification — Complete Recorded Original

**Checkpoint:** `phase-2-D1-complete-recorded-original`

**Scope:** Phase 2 only

**Authority:** `PRODUCT_SPEC.md`, `BUILD_STRATEGY.md`, `EXECUTION_CONTRACT.md`, and `AGENTS.md`

## Architecture retained

The Phase 1 static browser architecture remains intact:

- `index.html` is the unchanged entry point and semantic shell.
- `recorded-data.js` owns immutable authored Recorded snapshots, events, NPC state histories, memories, beliefs, trust changes, and outcome identities.
- `app.js` owns only presentation state, rendering, inspection, completed-turn navigation, and boundary-safe playback controls.
- `styles.css` extends the existing responsive visual system for playback and outcome presentation.
- `tests/phase1.test.js` executes both the retained Phase 1 journeys and Phase 2 data/playback contracts against the real application script.

No framework, live generator, authoritative world resolver, branch abstraction, or speculative module split was introduced. `app.js` is 652 lines after Phase 2, so it remains manageable and the strategy's refactor stop-condition was not reached.

One minimal data helper, `recordedEvent`, supplies the same required event fields to every authored event. It removes repetitive null/default declarations without moving state derivation into presentation code or changing the immutable Recorded-data model.

## Phase 2 exit criteria

| Criterion | Verification |
|---|---|
| Complete branch runs from Start to outcome without live generation | The DOM journey executes the real app from Start through Briefing and Workspace. Run consumes the 12 authored snapshots, reaches `outcome-original-v1`, and stops. Source scans and UI assertions confirm there is no Live or decision-generation control. |
| Step advances one complete turn; Pause stops only at a boundary | Automated journeys assert that each Step increments `currentTurn` by exactly one. A queued-timer playback test pauses after a completed callback and confirms no partial-turn state is exposed. |
| Restart restores the specified starting world | Restart is tested both after timeline review and after the outcome. It restores turn 0, 12 turns remaining, Untreated patient state, initial locations, initial NPC state, and the start event selection. |
| Timeline, locations, antidote path, trust, and outcome are consistent | Contract tests assert all 13 snapshots, required location transitions, Orin's possession from turn 5 through turn 12, Mara→Orin trust ending at -65, and the exact Lost/Exposed/Fractured outcome identities. |
| Every visible state change connects to an event | Ordered event assertions cover each clock, location, item, trust, belief, patient, truth, and outcome change. The Phase 1 clock defect was fixed by adding the missing 12→11 event. |
| Every consequential action has a goal, rationale, and valid memory reference | Every action event is normalized to the inspector contract. Tests verify referenced memories exist and predate the action, created memories exist at the action's turn, and every action creates an actor-owned memory. |
| Full story fits intended video pacing | `PHASE_2_DEMO.md` defines a 2:20 path from Start through outcome and Restart, below the three-minute limit. Recorded Run cadence completes all 12 turns in approximately 6.2 seconds before narration and inspection. |

## Phase 1 regression verification

All Phase 1 acceptance paths remain executable:

- Start offers both Begin and Watch Recorded routes.
- Briefing remains hidden-truth-safe and leads to the same Workspace.
- Turn 0 and turn 1 preserve their four NPC intents, stable event IDs, goals, rationales, memories, and inspector fields.
- Step still resolves exactly one complete turn.
- Completed-turn timeline review does not advance time.
- NPC, event, belief, memory, trust, and location inspection remains available.
- Restart reproduces the Phase 1 turn-zero checkpoint.
- Responsive, self-contained static delivery remains intact.
- Phase 2 does not expose Fork, Intervention, Comparison, Director View, Live mode, or reveal-truth controls.

## Architectural decisions

1. Keep the existing full-render UI and one application state object. Phase 2 needs only deterministic boundary playback; a state-management abstraction is not justified.
2. Store all 12 turns as authored data. No view code invents decisions, events, memories, beliefs, trust, or outcomes.
3. Represent NPC state changes as time-indexed histories merged only for display at the selected completed turn. This preserves the Phase 1 base records and avoids duplicating complete NPC objects per snapshot.
4. Use one timer between completed snapshots for Run. Pause clears the next scheduled transition, so no partial turn exists.
5. Reveal pivotal-event emphasis and the outcome recap only after turn 12. Earlier timeline inspection cannot use outcome metadata to infer the authored ending.
6. Preserve the existing `FORKED_FATES_PHASE1` global name to avoid a compatibility-only rename with no Phase 2 product value.

## Intentional technical debt

- Tests remain in the Phase 1-named file because splitting them would be organizational work, not needed behavior.
- The static global data handoff remains in place; modules or bundling are deferred until a later phase actually requires them.
- Full-markup re-rendering can reset focus after an interaction. Keyboard-operable controls and semantic labels remain, but focus restoration is deferred.
- The authored story is verbose in one data file. A split is deferred until additional branches or authoritative world logic make it necessary.
- Visual QA is based on the retained responsive source contract and executable DOM journeys; a separate automated screenshot baseline is not introduced in this phase.

## Phase 3 risks

- Phase 3 must not mutate or reinterpret the Recorded arrays when adding an authoritative world loop; D1 must remain immutable and independently runnable.
- Recorded history fields are presentation-oriented authored facts, not a general-purpose world-state reducer. Phase 3 should introduce the smallest separate authoritative state boundary instead of turning Recorded playback into live resolution.
- Stable event, memory, belief, and outcome IDs are now referenced by recap and tests. Any Phase 3 event schema work must preserve these identities.
- Information-boundary correctness is explicit in the Recorded memories, but Phase 3 will need enforcement rather than authored discipline when it resolves witnesses and memory delivery.

## Automated verification command

```text
npm.cmd run check
npm.cmd test
```

Expected result: syntax checks pass and all 19 tests pass with zero failures.
