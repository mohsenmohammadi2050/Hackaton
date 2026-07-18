# Forked Fates Acceptance Ownership Map

**Purpose:** Map every PRD acceptance criterion to the first phase that must prove it and the phases that must reverify it.  
**Rule:** “Planned in Phase 0” is not implementation evidence. A criterion passes only when the named proof exists and its behavior is verified.

| PRD criteria | First proof phase | Required evidence | Reverify through |
|---|---:|---|---:|
| 1 | 3 | Authoritative turn-zero fixture matches all NPCs, locations, clock, knowledge, trust, patient, and item state. | 9 |
| 2 | 1 | Briefing omits the hidden causal chain; visual walkthrough or UI test. | 9 |
| 3–4 | 3 | World invariants and resolution tests prove exactly one usable antidote and that only legal Clinic administration can save Niko. | 9 |
| 5 | 2 | Complete Recorded Original reaches its deadline with all three rule-valid outcome labels. | 9 |
| 6–10 | 5 | Four-NPC Live turn tests plus event/decision inspection prove intent limit, shared boundary, legal families, goals, rationales, and memory ownership. Phase 4 proves the same chain for one NPC first. | 9 |
| 11–12 | 3 | Dialogue/world-truth separation and failed-action state tests in the authoritative loop. | 9 |
| 13–17 | 3 | Witness matrix tests for remote, public, private, personal, and contradictory events; immutable memory assertions. | 9 |
| 18–19 | 1 | Inspectors cap relevant memories at six and label belief, claim, memory, and truth distinctly in the Recorded slice. | 9 |
| 20–23 | 3 | Event-backed state-diff tests, resolution-order assertions, expanded event evidence, and bounded explicit trust changes. | 9 |
| 24 | 3 | Restore/replay test proves completed-turn atomicity and stable event order. | 9 |
| 25–30 | 2 | End-to-end Recorded control tests for Step, Run, Pause, inspect-without-time, workspace comprehension, and mode labels. Phase 1 proves the reduced walking-skeleton subset. | 9 |
| 31–37 | 6 | Fork-boundary matrix, exact card/recipient validation, prefix hash, Original immutability, intervention memory scope, branch isolation, and one-fork restriction. | 9 |
| 38–41 | 7 | Completed comparison UI and tests for outcomes, recaps, shared prefix, intervention, divergence, paths, beliefs, trust, real pivotal links, and grounded language. | 9 |
| 42–43 | 8 | Injected decision failure restores the last completed boundary and never presents a partial turn. | 9 |
| 44 | 6 | Full approved Original and Alternate pair completes without external decision generation and remains labeled Recorded. | 9 |
| 45 | 7 | Fresh start-to-comparison walkthrough uses controls and fixed intervention cards only. | 9 |
| 46 | 6 | Golden pair test proves Alternate becomes Saved on turn 7, five turns after the turn-2 intervention, while Original remains untreated. | 9 |
| 47 | 7 | Comparison traversal proves intervention → Mara belief → Mara action → Sera memory/belief → Sera action → treatment using stable event and memory IDs. | 9 |

## Phase exit evidence

| Phase | Acceptance focus at exit | Checkpoint |
|---:|---|---|
| 0 | Golden pair, demo script, causal proof, invariants, ownership map, and naming convention are internally consistent. No product criteria are claimed implemented. | `phase-0-planning-golden-pair-locked` |
| 1 | Criteria 2, 18–19, 28–30 are visibly represented for the short Recorded slice; entry, inspection, restart, and one-turn Step work. | `phase-1-D0-recorded-walking-skeleton` |
| 2 | Criteria 4–5 and 25–30 pass for the complete Recorded Original; all Phase 1 proofs regress cleanly. | `phase-2-D1-complete-recorded-original` |
| 3 | Criteria 1, 3, 11–17, and 20–24 pass for the authoritative one-turn loop; D1 remains unchanged. | `phase-3-D1-authoritative-turn-loop` |
| 4 | One NPC demonstrates criteria 6–10 end to end without information leakage; failures remain recoverable. | `phase-4-D2-one-autonomous-loop` |
| 5 | Criteria 6–10 pass for all four NPCs over a complete Live Original; D1 and D2 still pass. | `phase-5-D3-live-original` |
| 6 | Criteria 31–37, 44, and 46 pass; both Recorded branches are isolated and independently inspectable. | `phase-6-D4-isolated-recorded-fork` |
| 7 | Criteria 38–41, 45, and 47 pass in a complete comparison journey. | `phase-7-D5-causal-comparison` |
| 8 | Criteria 42–43 and the PRD story-quality release gate pass; all earlier acceptance evidence is rerun. | `phase-8-D5-reliable-demo` |
| 9 | All 47 applicable criteria pass from a fresh start with accessibility, visual QA, documentation, and recording evidence. | `phase-9-D6-release-candidate` |

## Regression rule

The “reverify through” column is cumulative. A later phase cannot be checkpointed while an earlier criterion is known to fail. If Live behavior is unavailable, the product must fall back clearly to the strongest passing Recorded checkpoint without representing the missing Live criterion as complete.
