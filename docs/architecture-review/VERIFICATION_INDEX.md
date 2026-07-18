# Forked Fates Verification Index

**Current checkpoint:** `0635ad1` (`phase-7-D2-isolated-timeline-fork-engine`)  
**Current automated result:** 67 tests passing, 0 failing  
**Approved Original replay SHA-256:** `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7`

## Phase history

### Phase 0 — Golden pair and execution contract

- **Commit/tag:** `c19e23b`, `phase-0-planning-golden-pair-locked`
- **Evidence:** [`../EXECUTION_CONTRACT.md`](../EXECUTION_CONTRACT.md), [`../ACCEPTANCE_MAP.md`](../ACCEPTANCE_MAP.md), [`../DEMO_SCRIPT.md`](../DEMO_SCRIPT.md)
- **Tests added:** none; planning and acceptance proof.
- **Guarantees introduced:**
  - Locked Original and Alternate story outlines.
  - Stable event, memory, belief, fact, and outcome identities.
  - Identical prefix through completed turn 2.
  - One approved recipient-only information intervention.
  - Required intervention → belief → action → outcome causal proof.
  - Checkpoint naming convention and acceptance ownership.

### Phase 1 — Recorded walking skeleton

- **Commit/tag:** `2f99618`, `phase-1-D0-recorded-walking-skeleton`
- **Evidence:** [`../PHASE_1_VERIFICATION.md`](../PHASE_1_VERIFICATION.md)
- **Tests added:** 11 initial tests in `tests/phase1.test.js`.
- **Current relevant coverage:** Recorded world shape, briefing secrecy, one complete turn, actor memories, memory availability, inspector contract, semantic labels, navigation, self-contained static entry point, start-to-workspace journey, and restart/timeline behavior.
- **Guarantees introduced:**
  - Complete Start → Briefing → Workspace path.
  - Recorded mode visibly labeled and independently executable.
  - Step, timeline inspection, NPC/event selection, and restart.
  - Facts, claims, beliefs, memories, truth, and private events visually distinguished.
  - Hidden causal truth absent from initial briefing.

### Phase 2 — Complete Recorded Original

- **Commit/tag:** `cb2c891`, `phase-2-D1-complete-recorded-original`
- **Evidence:** [`../PHASE_2_VERIFICATION.md`](../PHASE_2_VERIFICATION.md), [`../PHASE_2_DEMO.md`](../PHASE_2_DEMO.md)
- **Tests added:** 8 additional tests in `tests/phase1.test.js` (19 total in that suite).
- **Current relevant coverage:** 12 authored turns, stable outcomes and identities, append-only ordered events, possession/trust consistency, event-backed snapshots, Step, Run, Pause, and restart after outcome.
- **Guarantees introduced:**
  - Permanent complete Recorded fallback.
  - Deterministic 12-turn Original ending Lost / Exposed / Fractured.
  - Complete-turn playback controls only.
  - Event-backed location, item, trust, patient, and outcome changes.
  - Phase 1 navigation and inspection retained.

### Phase 3 — Authoritative World Engine

- **Commit/tag:** `27ce83e`, `phase-3-D1-authoritative-original-replay`
- **Evidence:** [`../PHASE_3_VERIFICATION.md`](../PHASE_3_VERIFICATION.md)
- **Tests added:** 10 tests in `tests/world-engine.test.js`.
- **Current relevant coverage:** production-layer independence, exact starting World, resolution order, all seven actions, failed action, witness/memory boundaries, boundary restoration, event-backed transitions, Recorded observable parity, deterministic immutable domain data.
- **Guarantees introduced:**
  - Explicit Recorded, World, and Presentation separation.
  - World as sole authoritative resolver.
  - Deterministic five-phase resolution.
  - Complete frozen boundary restoration.
  - Event, memory, belief, trust, inventory, clock, patient, and outcome evolution from World rules.
  - Authoritative replay parity with independently executable Recorded playback.

### Phase 4 — Four autonomous NPCs

- **Commit/tag:** `fe8e799`, `phase-4-D2-four-autonomous-npcs`
- **Evidence:** [`../PHASE_4_VERIFICATION.md`](../PHASE_4_VERIFICATION.md)
- **Tests added:** 11 tests in `tests/autonomous-agents.test.js`.
- **Current relevant coverage:** owned-state projection, information exclusions, maximum-six relevant memories, four intents per turn, policy reactivity, malformed/rejected/resolution-invalid distinctions, frozen-boundary retry, autonomous determinism, and Recorded parity.
- **Guarantees introduced:**
  - All four NPCs decide autonomously from owned state.
  - No hidden truth, private foreign state, remote event, or unpublished intent in projections.
  - Deterministic relevant-memory selection capped at six.
  - Exactly one validated intent per NPC per turn.
  - Retry discards partial attempts and restores the completed boundary.
  - Legal resolution-invalid intent becomes a World failed event rather than model retry.

### Phase 5 — Provider Architecture

- **Commit/tag:** `c1ed469`, `phase-4-D2-provider-architecture`
- **Evidence:** [`../PROVIDER_ARCHITECTURE_VERIFICATION.md`](../PROVIDER_ARCHITECTURE_VERIFICATION.md)
- **Tests added:** 7 tests in `tests/provider-architecture.test.js`.
- **Current relevant coverage:** provider-only Decision dependency, DeterministicProvider exact parity, mock LLM contract, GPT/Claude/local configuration neutrality, API-free missing-invocation behavior, and interface/factory validation.
- **Guarantees introduced:**
  - Decision communicates with autonomous logic only through `forked-fates-decision-provider-v1`.
  - Existing rule policies are isolated behind `DeterministicProvider`.
  - Generic LLM adapter makes no external call.
  - Provider metadata does not alter simulation results.
  - Swapping provider type/vendor/model is configuration, not Decision or World code.

> Historical naming note: this architecture checkpoint was created immediately after Phase 4 and retained a Phase-4 tag. It was subsequently approved as Phase 5. Git order and this index are the authoritative sequence.

### Phase 6 — Counterfactual Intervention Engine

- **Commit/tag:** `c57e4c3`, `phase-6-D2-counterfactual-intervention-engine`
- **Evidence:** [`../PHASE_6_INTERVENTION_VERIFICATION.md`](../PHASE_6_INTERVENTION_VERIFICATION.md)
- **Tests added:** 9 tests in `tests/intervention-engine.test.js`.
- **Current relevant coverage:** protected layer hashes, delegation-only Intervention source, information event-before-effect, changed autonomous decision, retry with intervention, no-intervention exact parity, legal item transfer, local environmental event, forged/impossible/repeated rejection.
- **Guarantees introduced:**
  - External intervention requests must become typed events.
  - Intervention Layer cannot mutate World state.
  - World revalidates every typed event and remains authoritative.
  - Information, ItemTransfer, and EnvironmentalEvent categories.
  - Event emitted before memory, belief, inventory, or environmental consequences.
  - Same-turn post-intervention frozen boundary restored on retry.
  - No-intervention autonomous replay remains byte-identical.

### Phase 7 — Timeline Fork Engine

- **Commit/tag:** `0635ad1`, `phase-7-D2-isolated-timeline-fork-engine`
- **Evidence:** [`../PHASE_7_TIMELINE_FORK_VERIFICATION.md`](../PHASE_7_TIMELINE_FORK_VERIFICATION.md)
- **Tests added:** 11 tests in `tests/timeline-fork-engine.test.js`.
- **Current relevant coverage:** protected layer hashes, orchestration-only Timeline source, immutable Original hash, cloning turns 0–12, branch-specific identities, no shared domain objects, alternate-only intervention/divergence, branch-local state/outcome, World validity, deterministic Alternate, one/nested fork rejection.
- **Guarantees introduced:**
  - Immutable Original timeline retained throughout session.
  - Any completed Original boundary can be deep-cloned.
  - Generated Alternate branch identity.
  - Branch-specific boundary, event, intent, memory, and outcome identities.
  - `sourceId` alignment for copied prefix records.
  - No shared mutable object between Original and Alternate.
  - Intervention and all later consequences remain Alternate-only.
  - One Alternate per session; nested fork rejected.
  - Alternate success judged by World validity rather than authored parity.

## Test suite index

| Test suite | Count | Principal guarantee owner |
|---|---:|---|
| `tests/phase1.test.js` | 19 | Recorded Phases 1–2 |
| `tests/world-engine.test.js` | 10 | Authoritative Phase 3 |
| `tests/autonomous-agents.test.js` | 11 | Autonomous Phase 4 |
| `tests/provider-architecture.test.js` | 7 | Provider Phase 5 |
| `tests/intervention-engine.test.js` | 9 | Intervention Phase 6 |
| `tests/timeline-fork-engine.test.js` | 11 | Fork Phase 7 |
| **Total** | **67** | All completed phases |

## Cross-phase regression guarantees

| Guarantee | Current evidence |
|---|---|
| Recorded playback remains independent | Source-boundary tests plus 19 Recorded tests; production Presentation imports no World/Decision/Provider/Fork module. |
| Original replay remains exact | Multiple suites assert SHA-256 `f563c2...4fb7`; timeline tests hash Original before and after Alternate completion. |
| Decision/Provider/policies remain stable after Phase 5 | Later suites pin their file hashes. |
| No-intervention behavior remains stable | Intervention suite runs two exact autonomous replays and matches approved hash. |
| Information boundaries remain intact | Projection exclusions, witness matrices, owned memories, belief support, and branch-local provenance tests. |
| World is sole authority | Production-source dependency tests; Intervention and Timeline modules delegate resolution. |
| Completed history is immutable | Recursive freeze assertions, restore/replay tests, input hashing, and distinct Original/Alternate object references. |
| Branch isolation | Disjoint branch-specific causal IDs, deep object isolation, Alternate-only intervention, local memories/beliefs/trust/inventory/events/outcomes. |

## Verification commands

The repository's declared commands are:

```text
npm run check
npm test
```

On this Windows environment, the same checks are run directly with `node --check` for all production JavaScript files and `node --test` for the six suites listed above. The audit package itself contains documentation and byte-for-byte source exports only.
