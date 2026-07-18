# Phase 7.1 Causal Integrity Verification

**Checkpoint scope:** Causal correctness hardening before Phase 8

**World Engine schema:** `1.1.0`

**Timeline integrity schema:** `1.0.0`
**Status:** Complete; awaiting external review

## Scope control

This checkpoint changes correctness contracts only. It adds no UI, comparison, explanation generation, external LLM transport, persistence, multiple alternates, nested forks, merge, undo, or scenario generalization. Recorded playback remains an independently executable authored artifact.

## Deterministic hash policy

The hash is SHA-256 over `JSON.stringify(decision.runAutonomousOriginal(scenario, deterministicProvider))`.

| Replay contract | SHA-256 |
|---|---|
| Previous approved Phase 7 replay | `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7` |
| Corrected Phase 7.1 replay | `6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f` |

Two fresh Phase 7.1 replays were serialized independently. Their complete JSON strings and SHA-256 hashes were identical. The same corrected hash is asserted in the provider, intervention, timeline-fork, and causal-integrity suites.

## Intended serialized differences

The hash change is expected and limited to the approved correctness changes:

1. The World Engine version changed from `1.0.0` to `1.1.0` because boundary and outcome schemas changed.
2. Four private communications were removed from the Original public record:
   - Dain privately questioning Sera on turn 1.
   - Sera privately denying knowledge to Dain on turn 1.
   - Mara privately questioning Orin on turn 3.
   - Dain privately reassuring Mara on turn 7.
3. Non-empty confessions now use visibility-correct descriptions. The approved public confession remains public, but its description no longer uses the old hard-coded wording.
4. Every frozen boundary now has a stable identity and one explicit classification: `initial`, `turn-close`, or `post-intervention`.
5. Completed outcomes now contain deterministic medical, truth, and social event attribution. The Branch outcome event cites the union of those authoritative events as causes.
6. Alternate prefix records retain exact Original `sourceId` links. Newly generated post-fork intents and derived records no longer receive speculative Original links.
7. Intervention events are causal roots with empty `causes`. Their temporal placement is represented by `appliedAtBoundaryId`; memory and belief consequence events continue to cite the intervention event.
8. Fork orchestration now rejects turns outside 0 through 10 and rejects non-ready or terminal boundaries before an Alternate is created.
9. Explicit boundary selection can distinguish the same-turn pre-intervention and post-intervention snapshots. Default restoration still selects the latest completed boundary.

No approved story label changed. The Original still ends:

- Medical: `Lost`
- Truth: `Exposed`
- Social: `Fractured`

The final antidote, trust, belief, location, patient, and visible Recorded parity assertions remain unchanged and pass.

## Requirement verification

### 1. Public/private communication semantics

`resolveCommunication` now invokes public-record mutation only when `audience === "public"`. Public accusation remains public and continues to use the same mutation rule. Private participants still receive memories and belief updates, and a private non-empty confession still applies its participant-local trust consequence.

Verified by tests proving:

- A private claim produces no `publicRecord.claims` entry.
- A private fact produces no `publicRecord.evidenceIds` entry.
- A private confession produces no `publicRecord.establishedFactIds` entry and no false consensus.
- Only actor and recipient receive the corresponding private memories and beliefs.
- Equivalent public claim, fact, and confession events still mutate the public record.

### 2. Confession detection

The World Engine defines confession state as:

```js
const hasConfession = Array.isArray(intent.confessionFactIds) && intent.confessionFactIds.length > 0;
```

That value controls category, description, salience, risky-confession trust, and fact establishment. A communication containing `confessionFactIds: []` remains category `Communication`, uses ordinary communication wording and salience, causes no confession trust adjustment, and establishes no fact. Private confession wording explicitly says `private confession`; public confession wording explicitly says `public confession`.

### 3. `sourceId` semantics

`sourceId` is now assigned only while cloning an exact frozen prefix record. The normal post-fork resolution path strips candidate source alignment and produces branch-local records without a source link. The integrity validator resolves every non-null source against the type-specific Original identity index.

Verified by tests proving:

- All copied event, memory, boundary, and intent source links resolve to the corresponding Original type.
- Copied turn 1-2 prefix intents remain aligned after a turn-2 fork.
- Every newly generated post-fork intent has no `sourceId`.
- Two complete Alternate runs produce identical source-alignment projections.
- A source link aimed at an Original record of the wrong type is rejected.

### 4. Reusable graph-integrity validation

`timeline-integrity.js` exposes the versioned `validateState`, `validateTimelineSession`, and `assertNoSharedMutableObjects` APIs for tests and the future comparison layer.

The validator verifies:

- Event causes resolve inside the same branch.
- Memory origins resolve.
- Created and cited memory identities resolve; cited memories belong to the acting NPC.
- Belief support resolves to memories owned by that NPC.
- Public-record event references resolve.
- Alternate event, memory, boundary, intent, and outcome identities are branch-local.
- Non-null source references resolve to exactly one Original record of the same type.
- Boundary identities, sequence, classification, event counts, snapshots, and current-state coverage are valid.
- Intervention placement and consequence references resolve.
- Completed outcome attribution and the Branch outcome event agree.
- Original and Alternate share no mutable domain object.

Corruption tests inject invalid causes, origins, created memories, cited memories, belief support, public-record event links, event counts, intervention boundary links, outcome links, wrong-type sources, and shared mutable state. Every corruption is rejected with `TimelineIntegrityError`.

### 5. Intervention causality

All three intervention categories now emit authoritative external-root events with `causes: []` and `appliedAtBoundaryId`. Information consequences continue to cite the intervention event through the Memory and belief update event. Item and environmental consequences remain changes on the intervention event itself and continue to use World validation.

### 6. Outcome attribution

Each completed outcome stores only structured event identities:

- `medicalEventIds`: the treatment event when saved, otherwise the terminal clock event.
- `truthEventIds`: responsible-fact establishment events or false-consensus events; the terminal clock is the deterministic unresolved fallback.
- `socialEventIds`: trust-update and false-consensus events; the terminal clock is the deterministic fallback when neither exists.

The Branch outcome event cites the union. Tests verify every referenced event exists in that branch and is present in the outcome event's causes. No natural-language explanation was added.

### 7. Boundary semantics

Boundary classification is stored in authoritative boundaries and exposed by timeline boundary indexes. `restoreBoundary(state, turn, classification)` selects an explicit boundary; omitting classification preserves latest-boundary restoration. Restoration now slices boundary history through the selected boundary identity rather than including every later boundary with the same turn number.

A same-turn intervention regression test proves `turn-close` restores the pre-intervention event graph and `post-intervention` restores the intervention and its consequences. Default selection equals `post-intervention`.

### 8. Fork eligibility

Timeline Fork orchestration accepts only completed Original turns 0 through 10. Before cloning it verifies that the selected boundary snapshot is `ready` and has no outcome. A test forks and successfully applies the required intervention at every eligible turn. Turns 11, 12, and 13 are rejected. One Alternate and no nested forks remain enforced.

## Protected layers

The required policy files remain byte-for-byte unchanged:

| File | SHA-256 |
|---|---|
| `decision-layer.js` | `e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155` |
| `decision-providers.js` | `b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f` |
| `npc-agents.js` | `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704` |

No change to these files was necessary. `intervention-layer.js` also remains byte-for-byte unchanged; the authoritative causal correction belongs to World resolution.

## Complete test result

- Syntax checks: all production JavaScript files pass, including `timeline-integrity.js`.
- Complete suite: **76 passed, 0 failed**.
- Existing tests preserved: **67 passed**.
- Phase 7.1 regression and corruption tests added: **9 passed**.
- Recorded observable parity: passed at every Original boundary.
- Deterministic provider and mock-provider parity: passed against the corrected hash.
- Original and Alternate deterministic replay: passed.

## Architectural decisions

1. Communication visibility is enforced inside the authoritative resolver, not in presentation or policy code.
2. Temporal placement and causality are separate fields: boundary placement is metadata, while `causes` contains only causal predecessors.
3. Outcome attribution is structured domain data rather than comparison output or prose.
4. Source alignment is opt-in only for exact prefix cloning; syntactic ID similarity is never treated as evidence of equivalence.
5. Integrity validation is a standalone, versioned read-only module so Phase 8 can consume it without moving authority out of the World Engine.
6. Boundary classification extends the existing snapshot model and keeps latest-boundary restoration backward compatible.

## Intentional technical debt and remaining risks

- The reference registry in `timeline-integrity.js` is explicit and must be updated whenever a future schema introduces another identity-bearing field. This is safer than implicit remapping but is not generated from a formal schema.
- Outcome attribution is deterministic and valid but intentionally broad for social outcomes: all trust updates and false-consensus formation events are retained. Phase 8 may select a comparison subset without changing the authoritative attribution.
- The validator is currently invoked by verification code rather than on every runtime transition. Production enforcement policy belongs to later reliability work.
- The schema still uses dynamic JavaScript objects rather than static types or generated validation.
- Persistence, migrations, transactionality, multiple alternates, nested forks, and scenario generalization remain deliberately out of scope.

## Phase boundary

Phase 8 has not begun. No branch comparison, causal explanation, comparison ranking, or new presentation behavior exists in this checkpoint.
