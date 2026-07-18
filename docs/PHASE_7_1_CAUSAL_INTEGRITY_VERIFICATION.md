# Phase 7.1 Causal Integrity Verification

**Checkpoint scope:** Causal correctness hardening before Phase 8

**World Engine schema:** `1.1.0`

**Timeline integrity schema:** `1.1.0`

**Status:** Complete; awaiting external review

## Scope control

This checkpoint changes correctness contracts only. It adds no UI, comparison, explanation generation, external LLM transport, persistence, multiple alternates, nested forks, merge, undo, or scenario generalization. Recorded playback remains an independently executable authored artifact.

## External review patch

The first Phase 7.1 external review correctly identified validator false negatives. Runtime state generation was already correct, but validator schema `1.0.0` could accept:

- A same-type `sourceId` that resolved to an unrelated Original record.
- Self-causes, duplicate causes, causal cycles, and forward cause references.
- Event or intent citations to memories that existed only in a later turn.
- An intervention placed at any resolving boundary identity without exact position checks.
- Invalid boundary ordering and duplicate classifications that still had syntactically valid identities.
- Outcome attribution to the Branch outcome event itself.

Validator schema `1.1.0` closes these gaps. This review patch changes only `timeline-integrity.js`, its integrity tests, and this verification document. `world-engine.js` and `timeline-fork-engine.js` remain unchanged from checkpoint `081c7a0`, so runtime serialization and story behavior are unaffected.

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

`sourceId` is assigned only while cloning an exact frozen prefix record. The normal post-fork resolution path strips candidate source alignment and produces branch-local records without a source link. Validator `1.1.0` derives the copied-prefix event count from the exact Original and Alternate fork boundaries, then checks the deterministic branch-scoping identity transformation for every event, memory, intent, boundary, and outcome source link.

Verified by tests proving:

- All copied event, memory, boundary, and intent source links resolve to the corresponding Original type.
- Copied turn 1-2 prefix intents remain aligned after a turn-2 fork.
- Every newly generated post-fork intent has no `sourceId`.
- Two complete Alternate runs produce identical source-alignment projections.
- A source link aimed at an Original record of the wrong type is rejected.
- A source link aimed at an unrelated but valid Original record of the same type is rejected.
- Source-linked records must occur inside the copied prefix and match source turn plus actor or owner.
- Prefix events, memories, intents, and boundaries require their exact source; post-fork records are forbidden from carrying one.

### 4. Reusable graph-integrity validation

`timeline-integrity.js` exposes the versioned `validateState`, `validateTimelineSession`, and `assertNoSharedMutableObjects` APIs for tests and the future comparison layer.

The validator verifies:

- Event causes resolve inside the same branch, are unique, are not self-references, and occur strictly earlier in authoritative event order.
- Memory origins resolve.
- Created and cited memory identities resolve; cited memories belong to the acting NPC and exist before the event or chosen intent boundary.
- Belief support resolves to memories owned by that NPC.
- Public-record event references resolve.
- Alternate event, memory, boundary, intent, and outcome identities are branch-local.
- Non-null source references resolve to the exact deterministic Original prefix record, not merely another record of the same type.
- Boundary turns, identities, classification cardinality, classification order, strictly increasing event counts, snapshots, and latest-current-state equivalence are valid.
- Intervention placement resolves to the immediately preceding same-branch, same-turn `initial` or `turn-close` boundary.
- Intervention consequences follow category-specific World contracts.
- Completed outcome attribution precedes and agrees with the Branch outcome event and cannot cite that event itself.
- Original and Alternate share no mutable domain object.

Corruption tests inject invalid causes, origins, created memories, cited memories, belief support, public-record event links, event counts, intervention boundary links, outcome links, wrong-type sources, unrelated same-type sources, future citations, malformed boundary sequences, and shared mutable state. Every corruption is rejected with `TimelineIntegrityError`.

### 5. Intervention causality

All three intervention categories emit authoritative external-root events with `causes: []` and `appliedAtBoundaryId`. The validator requires the placement boundary to belong to the same branch and turn, be classified `initial` or `turn-close`, and have an event count exactly equal to the intervention's zero-based event position.

Information requires exactly one later Memory and belief update event with both memory and belief changes that cites the intervention. ItemTransfer requires authoritative item changes directly on the intervention event. EnvironmentalEvent requires authoritative location-condition changes directly on the intervention event. Valid frozen sessions for all three categories pass `validateTimelineSession`.

### 6. Outcome attribution

Each completed outcome stores only structured event identities:

- `medicalEventIds`: the treatment event when saved, otherwise the terminal clock event.
- `truthEventIds`: responsible-fact establishment events or false-consensus events; the terminal clock is the deterministic unresolved fallback.
- `socialEventIds`: trust-update and false-consensus events; the terminal clock is the deterministic fallback when neither exists.

The Branch outcome event cites the union. Tests verify every referenced event exists earlier in that branch, is present in the outcome event's causes, and is not the Branch outcome event itself. Duplicate attribution and causal self-cycles are rejected. No natural-language explanation was added.

### 7. Boundary semantics

Boundary classification is stored in authoritative boundaries and exposed by timeline boundary indexes. `restoreBoundary(state, turn, classification)` selects an explicit boundary; omitting classification preserves latest-boundary restoration. Restoration now slices boundary history through the selected boundary identity rather than including every later boundary with the same turn number.

A same-turn intervention regression test proves `turn-close` restores the pre-intervention event graph and `post-intervention` restores the intervention and its consequences. Default selection equals `post-intervention`.

Validator `1.1.0` additionally requires monotonically increasing turns, exactly one turn-0 `initial`, at most one `turn-close` and `post-intervention` per turn, immediate base-to-post ordering, strictly increasing event counts, and exact equivalence between the latest boundary snapshot and current authoritative state.

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
- Complete suite: **97 passed, 0 failed**.
- Provisionally approved Phase 7.1 suite preserved: **76 passed**.
- External-review regression tests added: **21 passed**.
- Total Phase 7.1 causal-integrity tests: **30 passed**.
- Recorded observable parity: passed at every Original boundary.
- Deterministic provider and mock-provider parity: passed against the corrected hash.
- Original and Alternate deterministic replay: passed.
- Valid Original, Information Alternate, ItemTransfer Alternate, and EnvironmentalEvent Alternate sessions: passed `validateTimelineSession`.
- Exact deterministic prefix-source alignment: passed.
- Strict earlier-event causal graph validation: passed.

The corrected autonomous replay hash remains `6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f`. The review patch is validator-only and produces no runtime serialization delta.

## External review artifacts

| File | Review status | SHA-256 |
|---|---|---|
| `timeline-integrity.js` | Updated to validator schema `1.1.0` | `78d322ec63178493748c88191f2912758d8f8f1f1c578da9f8413e6b63caae72` |
| `tests/causal-integrity.test.js` | Updated with 21 focused review regressions | `08b35ac046fd7ad37f66b46bb1e9bf669551e87825688e1480cbb9829a039e62` |
| `docs/PHASE_7_1_CAUSAL_INTEGRITY_VERIFICATION.md` | Updated review evidence | Recorded by the review-patch commit |
| `world-engine.js` | Reviewed; unchanged from `081c7a0` | `06122c845a42f4711ddbd997c6c399d56feadad83e062b97376a841bed6d480d` |
| `timeline-fork-engine.js` | Reviewed; unchanged from `081c7a0` | `544f5ba5f38d7d1d07e4fb01923e1b893d3565b951ee1edcf2c979262c10c96f` |

The focused Git review range begins at provisional checkpoint `081c7a0` and contains only the validator, integrity test, and verification-document changes. The final review command is:

```powershell
git -c safe.directory=F:/Hackaton diff 081c7a0..HEAD -- timeline-integrity.js tests/causal-integrity.test.js docs/PHASE_7_1_CAUSAL_INTEGRITY_VERIFICATION.md
```

## Architectural decisions

1. Communication visibility is enforced inside the authoritative resolver, not in presentation or policy code.
2. Temporal placement and causality are separate fields: boundary placement is metadata, while `causes` contains only causal predecessors.
3. Outcome attribution is structured domain data rather than comparison output or prose.
4. Source alignment is opt-in only for exact prefix cloning; syntactic ID similarity is never treated as evidence of equivalence.
5. Integrity validation is a standalone, versioned read-only module so Phase 8 can consume it without moving authority out of the World Engine.
6. Boundary classification extends the existing snapshot model and keeps latest-boundary restoration backward compatible.
7. A strict earlier-event invariant replaces a separate cycle traversal because authoritative causes are required to precede effects.
8. Exact source alignment is validated from deterministic identity transformations and prefix position, not semantic similarity or source existence alone.
9. Intervention consequence validation follows the authoritative contract for each typed category rather than applying Information requirements universally.

## Intentional technical debt and remaining risks

- The reference registry in `timeline-integrity.js` is explicit and must be updated whenever a future schema introduces another identity-bearing field. This is safer than implicit remapping but is not generated from a formal schema.
- Outcome attribution is deterministic and valid but intentionally broad for social outcomes: all trust updates and false-consensus formation events are retained. Phase 8 may select a comparison subset without changing the authoritative attribution.
- The validator is currently invoked by verification code rather than on every runtime transition. Production enforcement policy belongs to later reliability work.
- The schema still uses dynamic JavaScript objects rather than static types or generated validation.
- Persistence, migrations, transactionality, multiple alternates, nested forks, and scenario generalization remain deliberately out of scope.

## Phase boundary

Phase 8 has not begun. No branch comparison, causal explanation, comparison ranking, or new presentation behavior exists in this checkpoint.
