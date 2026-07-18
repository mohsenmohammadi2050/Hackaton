# Phase 7 Timeline Fork Engine Verification

**Checkpoint:** `phase-7-D2-isolated-timeline-fork-engine`  
**Scope:** Immutable Original plus one isolated autonomous Alternate; no UI, comparison, merge, undo, or external model provider  
**Reference checkpoint:** `phase-6-D2-counterfactual-intervention-engine` (`c57e4c3`)  

## Result

Forked Fates now supports an immutable timeline session containing one finished Original and, at most, one Alternate. The Timeline Fork Engine selects a completed frozen boundary and orchestrates the workflow; the World Engine alone restores, deep-clones, namespaces, resolves interventions, resolves autonomous turns, and freezes authoritative state.

```text
Immutable Original timeline
          |
          | select completed boundary
          v
Timeline Fork Engine ---------> World Engine deep clone + identity remap
                                      |
                                      v
                           isolated frozen Alternate boundary
                                      |
                           typed intervention through World
                                      |
                           unchanged Decision + Provider loop
                                      |
                                      v
                           valid completed Alternate timeline
```

The verified counterfactual forks turn zero, privately gives Mara the true spare-key evidence, and continues autonomously. Mara's first action changes from `Investigate` to `Move`. The Alternate completes as **Lost / Obscured / Fractured**, with Sera holding the unused antidote. The untouched Original remains **Lost / Exposed / Fractured**, with Orin holding it. This Alternate is accepted because it is World-valid and causally event-backed, not because it matches an authored target story.

## Architectural decisions

1. **Original is a frozen timeline artifact.** `createOriginalTimeline` wraps the approved immutable autonomous run without changing its `state` or `turns` serialization. A session retains that exact object for its lifetime.
2. **World owns the clone.** The Timeline Fork Engine never edits NPCs, beliefs, trust, inventories, events, patient state, or boundaries. It delegates to `world.forkCompletedBoundary` and subsequently to the existing Intervention and Decision paths.
3. **Branch identity is generated, not caller-authored.** With one Alternate, the deterministic identity is `<original-branch>-alternate-tNN`. This is stable, reviewable, and collision-free within the phase's one-alternate session.
4. **The complete causal prefix is remapped.** Alternate boundaries, events, intents, memories, and any copied outcome receive alternate-specific identities. Event causes, memory origins, created-memory references, cited memories, belief support, public-record event references, and consequence records are remapped together.
5. **Copied identities retain `sourceId`.** Alternate prefix boundaries, events, intents, and memories point to their Original source identity. This preserves future comparison alignment without sharing objects or implementing comparison behavior now.
6. **Scenario identities remain stable.** NPC, location, item, fact, claim, belief-proposition, and goal identities describe scenario entities rather than timeline records, so they remain stable across branches. Their owning state objects are deep-cloned and branch-local.
7. **Future alternate events are namespaced at emission.** The World scopes incoming autonomous intent IDs before resolution, then namespaces every event and derived memory. The Decision Layer, Provider Layer, and policies remain unchanged.
8. **Intervention memory is critical.** A counterfactual input must remain available within the existing six-memory decision cap long enough to influence subsequent choices. This is a World-level salience classification, not new NPC story logic.
9. **One Alternate and no nested forks.** The immutable session rejects a second Alternate, and the World rejects forking an already namespaced Alternate.
10. **Terminal boundaries are cloneable but terminal.** Every completed Original boundary from turn zero through twelve can be copied. A deadline-completed boundary remains completed and cannot accept new turns or interventions under existing World rules.

## Identity model

| Record | Original example | Alternate form |
|---|---|---|
| Branch | `world-original-v1` | `world-original-v1-alternate-t00` |
| Boundary | `boundary-world-original-v1-t00-s1` | `boundary-world-original-v1-alternate-t00-t00-s1` |
| Event | `evt-world-t00-start` | `evt-world-world-original-v1-alternate-t00--t00-start` |
| Intent | `auto-mara-t01-inspect-empty-case` | `world-original-v1-alternate-t00--auto-mara-t01-seek-square-cooperation` |
| Memory | `mem-start-mara-missing` | `mem-start-world-original-v1-alternate-t00--mara-missing` |
| Outcome | `outcome-world-original-v1` | `outcome-world-original-v1-alternate-t00--world-original-v1` |

## Verification evidence

| Requirement | Evidence | Result |
|---|---|---|
| Immutable Original | Original timeline, state, turns, and boundary index are recursively frozen. Hashes before fork, intervention, and Alternate completion are identical. | Pass |
| Clone any completed boundary | Fresh one-Alternate sessions successfully clone each Original boundary from turn 0 through turn 12. | Pass |
| Generated branch identity | Branch identity is derived from Original identity and fork turn; caller-supplied identities are rejected. | Pass |
| Branch-specific causal identities | Prefix and future boundaries, events, intents, memories, and outcome IDs are disjoint from Original and carry the Alternate namespace. | Pass |
| No shared mutable objects | State, event, boundary, location, antidote, NPC, memory, belief, trust, and inventory containers have distinct references and are frozen. | Pass |
| Alternate-only intervention | The intervention event, memory, and belief exist only in Alternate. Original contains zero intervention events and retains its exact hash. | Pass |
| Unchanged decision systems | Decision Layer, Provider Layer, autonomous agents, and Intervention Layer retain their approved file hashes. | Pass |
| World-only authority | Source boundary test confirms timeline orchestration delegates cloning to World, intervention to the validated layer/World, and turns to Decision/World. | Pass |
| One Alternate | Session rejects a second Alternate; World rejects nested Alternate forks. | Pass |
| Branch-local state | Memory provenance, belief support, trust, inventory, antidote possession, event history, boundaries, and outcomes validate independently per branch. | Pass |
| Original byte parity | Original `{state, turns}` SHA-256 remains `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7`. | Pass |
| Alternate World validity | Four NPCs, three locations, one coherent antidote state, unique events, valid memory provenance, owned belief support, completed boundaries, deadline, and valid outcome labels all pass. | Pass |
| Earlier behavior | Syntax checks and 67 tests pass with zero failures, including Recorded, World, Provider, and Intervention regressions. | Pass |

## Intentional technical debt

- Prefix cloning duplicates the complete JSON graph instead of using persistent immutable data structures. This is deliberate for isolation and legibility at MVP scale but would be expensive for large worlds.
- Identity remapping is handwritten across the current domain schema. New identity-bearing fields must be added to the remapper and its reference-integrity tests.
- The deterministic branch ID generator assumes one Alternate. Phase 8 comparison can use it directly; multiple branches would require a session-owned allocator and collision policy.
- The timeline constructor reruns the autonomous Original rather than accepting a persisted signed checkpoint. Persistence and checkpoint import are not implemented.
- Same-turn pre- and post-intervention boundaries remain represented as sequential snapshots with the latest restored. The timeline records the intervention event ID, but there is no generalized boundary-kind schema.
- Terminal turn-twelve boundaries can be cloned for completeness but cannot diverge because World deadline rules correctly keep them terminal.
- `sourceId` aligns shared-prefix records, but divergence analysis, pivotal-event selection, causal traversal, and comparison language are intentionally absent.
- Alternate validation is an in-memory invariant suite rather than a reusable production validator API.

## Readiness for Phase 8 — Branch Comparison

Comparison now has two complete, immutable, isolated inputs with:

- explicit Original and Alternate identities;
- a known fork turn and alternate intervention event;
- `sourceId` alignment for every copied boundary, event, intent, and memory;
- independent post-fork event and state histories;
- branch-local final beliefs, trust, inventories, item path, and outcomes;
- a concrete first changed autonomous action;
- stable World-valid causal records.

Phase 8 still needs to compute the shared prefix, first divergent intent/event, belief and trust differences, antidote paths, outcome differences, and grounded causal explanation. It must not infer causality from text or claim the intervention was the sole cause.
