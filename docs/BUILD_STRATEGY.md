# Forked Fates MVP Build Strategy

**Status:** Authoritative engineering roadmap  
**Version:** 1.0  
**Product authority:** `docs/PRODUCT_SPEC.md`  
**Team:** One developer working with Codex  
**Schedule:** 18 implementation hours plus a protected 2-hour contingency reserve

---

## 1. Purpose

This document defines the optimal implementation order for the Forked Fates MVP. It translates the accepted product specification into small end-to-end increments that maximize engineering speed, reduce integration risk, and leave a recordable product after every phase.

This strategy does not change product scope or behavior. If this document conflicts with `PRODUCT_SPEC.md`, the product specification controls.

## 2. Sequencing Strategy

### 2.1 Build the demonstration journey before the full simulation

The first useful artifact will be a navigable experience driven by approved Recorded-mode story data. This immediately establishes the product's visual language and creates a safe demo while autonomous behavior is still under development.

### 2.2 Preserve Recorded mode permanently

Recorded mode is an MVP capability, not disposable scaffolding. It remains the safety net for demo recording, regression checks, live failures, and narrative-quality comparison. Live mode is added beside it, never in place of it.

### 2.3 Prove one complete autonomous loop before scaling

One NPC must complete the entire observe, recall, decide, validate, resolve, remember, and explain cycle before all four NPCs are enabled. This isolates information-boundary and decision-quality problems.

### 2.4 Protect the differentiator

Timeline forking begins immediately after a stable live Original branch exists. Forking and causal comparison take priority over decorative polish.

### 2.5 Work only in completed vertical slices

Every phase must end with a complete user-facing path, a reproducible checkpoint, no partially resolved turn, and the last known-good Recorded demo still intact.

## 3. Non-Negotiable Build Invariants

1. `PRODUCT_SPEC.md` remains authoritative.
2. The default demo never depends exclusively on live decision generation.
3. Completed events and turn boundaries remain authoritative.
4. NPC information boundaries must be correct before behavior is judged for quality.
5. Facts, claims, beliefs, and memories remain distinct.
6. The world, not dialogue, controls state changes.
7. Fork work cannot begin until completed Original turns can be restored.
8. Visual polish may not obscure branch, turn, patient, location, event, or truth status.
9. A phase is complete only when its user-facing slice works from entry to checkpoint.
10. Every completed phase must be recordable that day.

## 4. Demo Continuity Protocol

At the end of every phase:

1. Start from a fresh session.
2. Follow the current demo script without developer-only intervention.
3. Confirm that all earlier demo behavior still works.
4. Verify the new phase-specific criteria.
5. Preserve the known-good state in version history.
6. Update the demo script to use the strongest working path.
7. Capture a short backup clip if the visible demo materially improved.
8. Begin the next phase only after the checkpoint is reproducible.

Incomplete or risky behavior stays outside the default demo path until its verification criteria pass.

### Demo maturity levels

| Level | Earliest phase | Demonstrable product |
|---|---:|---|
| D0 — Product concept | 1 | Navigable briefing, world, timeline, inspection, and outcome preview. |
| D1 — Recorded story | 2 | Complete Recorded Original branch with controls, inspection, and outcome. |
| D2 — Genuine autonomy | 4 | One real NPC decision is resolved, remembered, and explained. |
| D3 — Live baseline | 5 | Four NPCs complete a live Original branch. |
| D4 — Core promise | 6 | User forks a turn, intervenes, and runs an isolated alternate branch. |
| D5 — Submission story | 7 | Branches are compared through outcomes, beliefs, trust, and pivotal events. |
| D6 — Final candidate | 9 | Complete experience is reliable, polished, evaluated, and record-ready. |

## 5. Schedule Summary

The implementation plan uses 18 hours. A separate two-hour reserve is protected for blockers and recording problems; it is not preallocated to features.

| Phase | Vertical slice | Time | Cumulative | Demo level |
|---|---|---:|---:|---|
| 0 | Lock execution contract and golden paths | 0.5 h | 0.5 h | Planning checkpoint |
| 1 | Navigable Recorded walking skeleton | 1.5 h | 2 h | D0 |
| 2 | Complete Recorded Original branch | 1.5 h | 3.5 h | D1 |
| 3 | Authoritative one-turn world loop | 2 h | 5.5 h | D1 strengthened |
| 4 | One genuine autonomous NPC loop | 1.5 h | 7 h | D2 |
| 5 | Complete live Original branch | 3 h | 10 h | D3 |
| 6 | Fork, intervention, and alternate branch | 2.5 h | 12.5 h | D4 |
| 7 | Causal branch comparison | 1.5 h | 14 h | D5 |
| 8 | Reliability and story-quality gate | 1.5 h | 15.5 h | D5 hardened |
| 9 | Presentation and release candidate | 2.5 h | 18 h | D6 |
| Reserve | Recovery and recording buffer | 2 h | 20 h | Protected |

**Day 1 target:** Complete Phase 5 and preserve both D1 and D3 paths.  
**Day 2 target:** Complete Phases 6–9, then use reserve time only for blockers or recording.

---

## 6. Implementation Phases

## Phase 0 — Lock the Execution Contract

### Goal

Define the golden Original story, golden Alternate story, current demo script, and acceptance-criteria map before implementation begins.

### Why this phase comes at this point

Emergent behavior makes “good enough” ambiguous. Locking representative stories and proof points prevents later disagreement about defects, acceptable surprises, and scope changes. It also gives Codex bounded tasks from the first implementation step.

### Expected deliverables

- One-page demo script.
- Recorded Original outline containing intended events, decisions, memories, and outcome.
- Recorded Alternate outline identifying fork turn, intervention, changed belief, changed action, and changed outcome.
- Phase-to-PRD-acceptance-criteria map.
- Non-negotiable invariants in the active engineering context.
- Known-good checkpoint naming convention.

The story outlines define Recorded-mode content; they do not prescribe live NPC behavior.

### Dependencies

- Accepted `PRODUCT_SPEC.md`.
- Recorded mode accepted as a permanent MVP capability.

### Verification criteria before moving to the next phase

- Both outlines reach valid medical, truth, and social outcomes.
- They share an identical prefix and the Alternate contains one approved intervention.
- The Alternate visibly changes at least one belief and one later action.
- The pair satisfies PRD acceptance criteria 46 and 47.
- The demo script covers crisis, autonomy, inspection, fork, and divergence in under three minutes.
- No outline adds behavior outside the PRD.

### Estimated implementation time

**0.5 hour**

### Demo checkpoint

The exact future demo story and causal proof are locked.

---

## Phase 1 — Navigable Recorded Walking Skeleton

### Goal

Create the smallest complete visible journey from Start through Briefing, Workspace, one inspected event, and an outcome preview using a short Recorded-mode segment.

### Why this phase comes at this point

This creates visible hackathon value before simulation complexity begins. It validates reading order, information hierarchy, and emotional premise while changes are cheap. Future world and agent work gains an immediate visible destination.

### Expected deliverables

- Start screen and scenario entry.
- Briefing with stakes, deadline, and cast.
- Workspace with three locations, four NPCs, turn, patient state, and mode.
- Short timeline containing at least one consequential event.
- Step and timeline navigation over the recorded segment.
- NPC inspector with traits, goals, trust, beliefs, and memories.
- Expanded event with rationale, witnesses, and consequences.
- Simple outcome preview.
- Unmistakable Recorded-mode label.

### Dependencies

- Phase 0 golden Original outline.
- Approved PRD briefing and public character descriptions.

### Verification criteria before moving to the next phase

- A first-time viewer can identify the crisis, deadline, characters, locations, current turn, patient state, and mode.
- The path from Start to Workspace needs no developer assistance.
- NPC and event selection exposes the expected information without losing context.
- Facts, claims, beliefs, and memories use distinct labels.
- Restart reproduces the visible checkpoint.
- The slice is coherent enough to record.

### Estimated implementation time

**1.5 hours**

### Demo checkpoint

**D0:** A navigable product concept rather than a slide deck or isolated prototype.

---

## Phase 2 — Complete the Recorded Original Branch

### Goal

Extend the walking skeleton into a complete, deterministic twelve-turn Original story with controls, inspection, recap, and valid outcomes.

### Why this phase comes at this point

The project needs a complete fallback demonstration before live autonomy introduces uncertainty. A predictable full story exposes missing event types, unclear states, pacing problems, and outcome gaps early.

### Expected deliverables

- Full golden Original story as Recorded turns and events.
- Step, Run, Pause, Restart, and completed-turn navigation.
- Complete movement and visible state changes.
- Event groups for all categories used by the golden path.
- Inspectable memories, beliefs, trust changes, goals, and rationales.
- Medical, truth, and social outcomes.
- Original recap and pivotal events.
- Current sub-three-minute Recorded-mode demo script.

### Dependencies

- Phase 1 navigation and information hierarchy.
- Phase 0 golden Original outline.

### Verification criteria before moving to the next phase

- The complete branch runs from Start to outcome without live generation.
- Step advances one complete turn and Pause stops only at a boundary.
- Restart always restores the specified starting world.
- Timeline, locations, antidote path, trust, and outcome are consistent.
- Every visible state change connects to an event.
- Every consequential action has a goal, rationale, and valid memory reference.
- The full story fits the intended video pacing.

### Estimated implementation time

**1.5 hours**

### Demo checkpoint

**D1:** A complete recordable story with inspectable causality. This remains the permanent minimum demo.

---

## Phase 3 — Authoritative One-Turn World Loop

### Goal

Make one complete turn derive its state, events, memories, and consequences from PRD world rules while using predetermined valid NPC intents.

### Why this phase comes at this point

The visible destination is established. The next risk is authoritative state correctness. Predetermined intents isolate world-rule behavior from autonomous decision quality, avoiding two uncertain systems at once.

### Expected deliverables

- Complete starting world matching the PRD.
- One turn accepting one intent per NPC and resolving every applicable phase.
- Visible movement, investigation, communication, item, failure, trust, belief, memory, clock, and patient consequences required by the selected turn.
- Restorable turn-zero and turn-one boundaries.
- Timeline events derived from authoritative resolution rather than copied display content.
- Recorded mode preserved unchanged.

### Dependencies

- Phase 2 complete Recorded branch and UI.
- PRD world, state, event, trust, and information rules.

### Verification criteria before moving to the next phase

- Starting characters, locations, trust, knowledge, item, patient, and clock match the PRD.
- The turn follows the specified resolution order.
- Legal intents produce only allowed changes.
- Invalidated intents create failed-action events without prohibited changes.
- Eligible witnesses receive correct memories; absent NPCs do not.
- Restoring turn zero and replaying the same intents reproduces the same completed turn.
- D1 still works unchanged.

### Estimated implementation time

**2 hours**

### Demo checkpoint

**D1 strengthened:** The safe demo remains, and one turn now has an authoritative, restorable world loop.

---

## Phase 4 — One Genuine Autonomous NPC Loop

### Goal

Allow one NPC to make a genuine decision from its permitted perspective and carry it through validation, resolution, event creation, memory updates, and inspection.

### Why this phase comes at this point

World correctness has been proven separately. One autonomous NPC is the smallest live technical slice and isolates information leaks, invalid decisions, and weak explanations before orchestration scales.

### Expected deliverables

- One NPC receives only permitted observations, beliefs, goals, traits, trust, and memories.
- The NPC selects one intent with a goal, rationale, and memory citations.
- The intent passes through the Phase 3 world loop.
- Resulting events and memories appear in existing views.
- Other NPC intents remain predetermined for this slice.
- Visible deciding state and recoverable decision-failure state.

### Dependencies

- Phase 3 authoritative world loop.
- Phase 2 timeline and inspectors.
- PRD decision-cycle and memory-boundary definitions.

### Verification criteria before moving to the next phase

- The NPC cannot access hidden facts, private state, unpublished intents, or unowned memories.
- Its action is permitted and valid, or safely becomes a failed action.
- Every cited memory exists and was previously available.
- The concise reason connects to supplied goals, relationships, traits, or memories.
- The action creates the same authoritative consequences as a predetermined intent.
- Failure can be retried from the last completed boundary without damaging D1.

### Estimated implementation time

**1.5 hours**

### Demo checkpoint

**D2:** One genuine autonomous choice can be traced into an event, consequence, and memory.

---

## Phase 5 — Complete the Live Original Branch

### Goal

Scale the proven loop to all four NPCs and complete a valid live Original branch of up to twelve turns.

### Why this phase comes at this point

The UI, Recorded story, authoritative world, and one live loop are already proven. Scaling now tests orchestration and emergence without simultaneously inventing new product surfaces. This is the final Day 1 target.

### Expected deliverables

- Four independent NPC intents per turn at most.
- Complete observe, recall, decide, resolve, remember, and update cycles.
- Correct public, private, local, and self-only information propagation.
- Trust, belief, memory, posture, goal, item, patient, and clock evolution.
- Live twelve-turn progression or valid early ending.
- Live outcomes and recap.
- Clear Live and Recorded selection.
- Preserved candidate live run for branch work and evaluation.

### Dependencies

- Phase 4 autonomous loop.
- Phase 3 completed-turn boundaries.
- Phase 2 experience and fallback.

### Verification criteria before moving to the next phase

- A live branch runs from briefing to valid outcome without manual state correction.
- NPCs share the start-of-turn boundary but not unpublished intents.
- At least one accepted run contains consequential behavior beyond dialogue.
- No NPC learns from an event it could not perceive.
- Every state change is event-backed and inspectable.
- Controls and recovery operate only at safe boundaries.
- Recorded mode remains fully usable if Live mode fails.

### Estimated implementation time

**3 hours**

### Demo checkpoint

**D3:** A complete autonomous Original story can be shown live while D1 remains the guaranteed fallback.

---

## Phase 6 — Fork, Intervention, and Alternate Branch

### Goal

Create one alternate timeline from a completed Original turn, add one approved intervention to one recipient, and run an isolated Alternate branch.

### Why this phase comes at this point

Forking depends on trustworthy turn restoration, stable events, complete NPC state, and a valid Original branch. Building it now protects the project's strongest differentiator from schedule compression.

### Expected deliverables

- Selection of eligible completed Original turns.
- Fork dialog with three interventions and four recipients.
- Alternate branch with an identical historical prefix.
- Intervention as the first branch-specific event.
- Private intervention memory for only the recipient.
- Independent branch state after the fork.
- Read-only branch switching.
- Complete Alternate branch in Live or Recorded mode.
- Basic shared-history and divergence markers.

### Dependencies

- Phase 5 complete Original branch.
- Phase 3 restoration boundaries.
- Phase 0 golden Alternate outline.

### Verification criteria before moving to the next phase

- Forking is allowed only at an eligible completed boundary.
- Original history and state never change.
- Both branches are identical through the fork boundary.
- The intervention is the first branch-specific event.
- Only its recipient initially remembers it.
- Post-fork state never leaks between branches.
- A second Alternate or nested fork cannot be created.
- Both branches remain independently inspectable.
- The Recorded alternate contains the intended changed belief and action.

### Estimated implementation time

**2.5 hours**

### Demo checkpoint

**D4:** The user changes one belief and watches a different timeline emerge from the same history.

---

## Phase 7 — Causal Branch Comparison

### Goal

Explain what changed, where it changed, and why the two completed stories diverged.

### Why this phase comes at this point

Comparison is credible only after both branches are isolated and complete. It converts the fork from an engineering feature into the product's judge-facing differentiator.

### Expected deliverables

- Side-by-side outcome labels and recaps.
- Shared prefix and fork point.
- First divergent event.
- Antidote path and treatment timing.
- Final belief and directed-trust differences.
- Up to three event-backed pivotal events per branch.
- Grounded explanation connecting intervention, changed belief, changed action, and later events.
- Navigation back to either timeline.

### Dependencies

- Phase 6 completed branches.
- Complete event, belief, trust, item, and outcome histories.

### Verification criteria before moving to the next phase

- Both branches display all three required outcome dimensions.
- Shared history and intervention are unmistakable.
- Every difference is grounded in authoritative state or events.
- Pivotal-event links open real events.
- The explanation does not invent causes or claim the intervention was the sole cause.
- The golden pair visibly satisfies the changed-belief and changed-action chain.
- Start-to-Comparison fits within three minutes.

### Estimated implementation time

**1.5 hours**

### Demo checkpoint

**D5:** The complete submission story exists: crisis, autonomy, inspection, intervention, divergence, and explanation.

---

## Phase 8 — Reliability and Story-Quality Gate

### Goal

Make D5 dependable under live failures, repeated runs, and demo pressure, and validate that candidate stories meet the PRD quality bar.

### Why this phase comes at this point

The complete promise now exists, so reliability can be evaluated against a real end-to-end journey. This occurs before final visual work so polish is applied only to validated behavior.

### Expected deliverables

- Clear deciding, resolving, retry, failure, empty, and Recorded-fallback states.
- Recovery from the last completed boundary.
- Preserved golden Original and Alternate Recorded pair.
- Five reviewed candidate runs using the PRD rubric.
- Findings for information integrity, invalid state, repetition, causality, and completion.
- Resolution of critical demo-path failures.
- Final video intervention, recipient, and fork turn.

### Dependencies

- Phase 7 end-to-end product.
- PRD acceptance criteria and story-quality rubric.

### Verification criteria before moving to the next phase

- No accepted run contains an information-integrity failure or invalid state.
- At least four of five reviewed runs pass every story-quality dimension.
- Failed unresolved turns retry without changing prior completed history.
- No partial turn appears complete.
- Live failure can reach clearly labeled Recorded mode without confusing branch state.
- The golden pair satisfies PRD acceptance criteria 42–47.
- All earlier demo levels remain available.

### Estimated implementation time

**1.5 hours**

### Demo checkpoint

**D5 hardened:** The complete promise is reliable enough to record before final polish.

---

## Phase 9 — Demo-Ready Release Candidate

### Goal

Improve comprehension, visual coherence, accessibility, documentation, and recording readiness without changing validated behavior.

### Why this phase comes at this point

Core behavior has passed reliability gates. Presentation can now enhance the exact final journey without masking incomplete functionality or being invalidated by structural changes.

### Expected deliverables

- Final hierarchy for Start, Briefing, Workspace, inspectors, Fork, and Comparison.
- Clear emphasis on deadline, patient, branch, decision state, truth status, and divergence.
- Consistent characters, locations, typography, motion, and color.
- Keyboard-reachable controls and non-color-only status cues.
- Verified laptop-width and reduced-motion presentation.
- Final README and launch guidance.
- Concise architecture and Codex-workflow narrative.
- Current screenshots and sub-three-minute script.
- Fresh-start verification for Live and Recorded modes.
- Preserved release-candidate checkpoint.

### Dependencies

- Phase 8 validated behavior and golden pair.
- Current demo and submission narrative.

### Verification criteria before moving to submission

- The journey is understandable without developer-only explanation.
- Visual treatment never obscures state, causality, branch, or truth status.
- Primary controls are keyboard reachable and do not rely on color alone.
- The product is readable at the recording width.
- A fresh user can complete the golden Recorded path.
- A live run works or fails safely without damaging Recorded mode.
- The final script fits three minutes and includes value, autonomy, inspection, fork, divergence, and Codex's role.
- Documentation matches the actual product and makes no unverified claims.

### Estimated implementation time

**2.5 hours**

### Demo checkpoint

**D6:** Submission-ready release candidate.

---

## 7. Protected Contingency Reserve

The two-hour reserve may be used only for:

- A blocker preventing either golden Recorded branch from completing.
- A blocker preventing fork or comparison.
- Information-boundary or state-integrity defects.
- Launch or environment failures affecting judges.
- Final recording failure.
- Submission packaging or repository-access problems.

It must not fund additional characters, locations, actions, scenarios, branches, creator tools, late visual concepts, general refactoring, or experimental autonomy features.

If unused, spend the reserve on clean-start verification and multiple recording takes, not scope expansion.

## 8. Schedule-Control Rules

### If a phase exceeds its estimate

1. Stop and identify the unmet verification criterion.
2. Preserve the latest passing demo checkpoint.
3. Remove unverified behavior from the default demo path.
4. Use reserve time only when the issue blocks D4, D5, or Recorded fallback.
5. Do not borrow from fork, comparison, reliability, or recording for polish.

### Priority under time pressure

1. Reproducible Recorded Original and Alternate pair.
2. Correct world state, events, and information boundaries.
3. Fork integrity and intervention.
4. Causal comparison.
5. One genuine inspectable autonomous decision.
6. Complete live Original branch.
7. Failure recovery and mode labeling.
8. Usability and accessibility.
9. Decorative polish.

This priority controls engineering triage only. Any unmet PRD criterion remains documented and may not be represented as complete.

### Stop expanding when

- D5 is reproducible in Recorded mode.
- D3 works in at least one accepted live run.
- All branch-integrity criteria pass.
- No information-integrity or invalid-state defect remains in the demo path.
- The demo fits within three minutes.

At that point, reliability, clarity, documentation, and recording have higher hackathon value than new capability.

## 9. Codex Collaboration Model

For every phase:

1. Give Codex the phase goal, relevant PRD sections, and verification criteria.
2. Ask Codex to inspect the known-good product before proposing changes.
3. Implement only the smallest slice required by the phase.
4. Verify the new behavior and all earlier demo checkpoints.
5. Ask Codex to review for PRD conflicts, information leaks, and regression risk.
6. Preserve the passing checkpoint with a concise milestone description.
7. Update the demo script and Codex-workflow record.

A Codex task should normally correspond to one phase or one failed criterion. Broad requests spanning multiple incomplete phases reduce reviewability and make recovery harder.

Evidence should be retained across product planning, acceptance translation, implementation, evaluation, debugging, review, visual QA, documentation, and release preparation. The evidence should show a disciplined lifecycle, not merely a large volume of generated output.

## 10. Regression Ownership

| Capability | First phase | Reverified through |
|---|---:|---:|
| Start and briefing comprehension | 1 | 9 |
| Recorded navigation and inspection | 1 | 9 |
| Complete Recorded Original | 2 | 9 |
| Authoritative state and events | 3 | 9 |
| One genuine autonomous decision | 4 | 9 |
| Full live Original | 5 | 9 |
| Branch isolation and intervention | 6 | 9 |
| Causal comparison | 7 | 9 |
| Retry and fallback behavior | 8 | 9 |
| Accessibility and presentation | 9 | 9 |

No capability is permanently finished after its first phase. It remains part of every later demo checkpoint.

## 11. Final Engineering Definition of Done

Engineering is complete when:

1. The D6 candidate satisfies the applicable PRD acceptance criteria.
2. The complete golden Recorded path works from Start through comparison.
3. At least one accepted Live run shows four autonomous NPCs completing an Original branch.
4. One autonomous action can be traced from permitted observation and memory through intent, event, consequence, and later memory.
5. Both branches share an identical prefix and remain isolated after intervention.
6. Comparison proves a changed intervention, belief, action, and causal chain using authoritative events.
7. Live failure cannot destroy history or Recorded fallback.
8. The complete experience can be demonstrated in under three minutes.
9. Documentation and Codex evidence describe the product that actually exists.
10. The latest known-good checkpoint launches without additional engineering work.

The central delivery test is:

> At any checkpoint, show the strongest working story. At final release, change one belief and prove why a different story emerged.
