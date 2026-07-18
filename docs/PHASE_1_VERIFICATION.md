# Forked Fates Phase 1 Verification Record

**Status:** Phase 1 implementation complete

**Checkpoint:** `phase-1-D0-recorded-walking-skeleton`

**Verified:** 2026-07-18

**Authority:** `PRODUCT_SPEC.md`, `BUILD_STRATEGY.md`, and `AGENTS.md`

## Implemented slice

Phase 1 is a dependency-free static browser application containing:

- Start screen with the product promise, non-spoiler premise, primary scenario entry, and clearly labeled Recorded demonstration entry.
- Scenario briefing with Niko's crisis, twelve-turn deadline, four public cast descriptions, and no hidden causal chain.
- Recorded Original workspace at turn zero and turn one.
- Three location cards with all four NPCs positioned at their recorded locations.
- One atomic Step that resolves the complete accepted shared turn 1.
- Turn-zero and turn-one timeline navigation without changing the current branch position.
- NPC inspectors with definition, posture, item, traits, goals, directed trust, beliefs, relevant memories, and full memory history.
- Event inspectors with event identity, rationale, goal, cited memories, witnesses, created memories, immediate changes, and causal predecessors.
- Distinct visual and semantic labels for world facts, claims, beliefs, memories, private events, and Recorded mode.
- Restart to the exact recorded turn-zero checkpoint.
- An unresolved outcome preview that explicitly stops before Phase 2 branch completion.

The implementation intentionally contains no turns after turn 1, Run, Pause, completed outcome, recap, Live mode, world-truth reveal, fork, intervention, alternate branch, or comparison.

## Architecture at checkpoint

| File | Responsibility |
|---|---|
| `index.html` | Semantic static entry point and script/style loading. |
| `styles.css` | Start, Briefing, Workspace, timeline, inspector, responsive, focus, and reduced-motion presentation. |
| `recorded-data.js` | Deep-frozen Recorded data for the starting boundary and accepted shared turn 1. |
| `app.js` | Minimal screen state, one-turn playback, timeline review, selection, inspection, and Restart rendering. |
| `tests/phase1.test.js` | Data invariants, information boundaries, scope exclusions, inspector contract, and executable navigation harness. |
| `package.json` | Syntax-check and test commands; no runtime or development dependencies. |

All Phase 0 files remain unchanged from commit `c19e23b`.

## Phase 1 exit criteria

### 1. Crisis, deadline, cast, locations, turn, patient, and mode are identifiable

**Pass.** Start and Briefing state Niko's poisoning, the missing single antidote, four characters, and twelve-turn deadline. Workspace status exposes Original branch, current turn, untreated patient, and Recorded mode. The world view labels Clinic, Village Square, and Storehouse and positions Mara, Dain, Sera, and Orin. Automated tests assert the exact four-character, three-location, turn-zero/turn-one shape and exercise the rendered markup.

### 2. Start-to-Workspace requires no developer assistance

**Pass.** Both Start actions lead to the non-spoiler Briefing, which has one explicit **Enter world** action. The executable DOM harness follows Start → Briefing → Workspace using the application's registered click handler and confirms each resulting screen.

### 3. NPC and event selection exposes information without losing context

**Pass.** NPC tokens and timeline events replace only the persistent inspector region while the world, timeline, current branch, and selected boundary remain visible. The harness opens Mara's NPC inspector and Sera's denial event, verifying trust, beliefs, memories, rationale, witnesses, and consequences. Timeline review preserves the current-turn value and displays a historical-context banner.

### 4. Facts, claims, beliefs, and memories are distinct

**Pass.** The world legend names all four information types. Timeline events carry Fact, Claim, and Private labels; beliefs explicitly say “Not world truth”; memory cards show source and visibility. Automated tests assert each label and the six-memory relevance cap.

### 5. Restart reproduces the visible checkpoint

**Pass.** Restart sets current turn and selected turn to zero, restores the scenario-start event selection, removes turn-one events from the visible timeline, and restores the ready-to-resolve state. The executable harness performs Step → historical review → Restart and asserts the restored turn-zero markup and announcement.

### 6. The slice is coherent enough to record

**Pass at D0 implementation level.** The experience has a complete visual hierarchy for the three-screen journey, no network or external-asset dependency, laptop and narrow-width breakpoints, visible focus styles, reduced-motion behavior, and a finished one-turn stopping state rather than a partial outcome. Syntax checks and ten interaction/data tests pass. The local-file URL could not be opened by the available automated browser because its URL security policy blocks local file navigation; no bypass was attempted. A human visual recording check remains part of checkpoint review.

## Verification commands and results

- `npm.cmd run check` — passed for `recorded-data.js` and `app.js`.
- `npm.cmd test` — 10 tests passed, 0 failed.
- `git diff --check` — no whitespace errors.
- Scope scan — no Run, Pause, fork, alternate, or comparison controls; no external URLs or project paths outside the repository.
- Phase 0 regression — authoritative documents and Phase 0 artifacts have no modifications.

## Intentional technical debt

- Recorded history stops after turn 1. Turns 2–12, Run, Pause, completed outcomes, recap, and pivotal events belong to Phase 2.
- Recorded state is declarative and hand-authored; it is not yet produced by authoritative world resolution. That is Phase 3.
- No Live decision generation, retry state, persistence, backend, or network layer exists.
- World-truth reveal, fork, intervention, alternate timeline, and comparison remain deferred to their specified phases.
- Workspace rendering replaces the full workspace markup on selection. This is adequate for the D0 slice but may need finer-grained focus restoration as interactions scale.
- Automated browser screenshots were unavailable because local-file navigation is policy-blocked. The checkpoint review should include a human laptop-width visual pass.

## Architectural concerns

1. `app.js` deliberately co-locates view rendering and the tiny UI state machine. Phase 2's twelve-turn dataset may justify separating screen rendering from playback state, but no refactor should occur until actual Phase 2 complexity requires it.
2. `recorded-data.js` transcribes the Phase 0 execution contract. Stable IDs and tests reduce drift, but the documents and data are not generated from one source. Phase 2 should extend the same data structure and add contract-level assertions rather than introduce a second Recorded format.
3. Full markup replacement can reset keyboard focus after an inspector selection. Core controls remain native and keyboard reachable; focus preservation should be improved when richer control behavior is introduced or during the Phase 9 accessibility pass.
4. The application is intentionally static and requires no build system. If later Live phases add server-side decision generation, the static Recorded path must remain independently launchable.
