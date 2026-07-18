# Phase 6 Counterfactual Intervention Engine Verification

**Checkpoint:** `phase-6-D2-counterfactual-intervention-engine`  
**Scope:** Validated intervention events only; no timeline fork, cloning, comparison, Live UI, or external LLM provider  
**Reference checkpoint:** `phase-4-D2-provider-architecture` (`c1ed469`)  

## Result

External counterfactual requests can now affect a completed authoritative World boundary only through the Intervention Layer and a versioned typed event. The Intervention Layer cannot mutate World state. It creates a `forked-fates-intervention-v1` event and delegates it to the World Engine, which independently validates legality, emits the event, applies category-specific rules, records causal consequences, captures a new frozen boundary, and returns a new immutable state.

```text
External request
      |
      v
Intervention Layer -- validate/type --> typed intervention event
                                           |
                                           v
                                   Authoritative World Engine
                                   1. revalidate legality
                                   2. emit event
                                   3. apply World rule
                                   4. emit memory/belief consequences
                                   5. freeze completed boundary
                                           |
                                           v
                                  unchanged Decision + Provider path
```

The input boundary is never modified. No-intervention execution continues through the exact approved Decision, Provider, policy, Recorded, and presentation paths.

## Supported categories

| Category | Typed payload | Authoritative legality | Consequences |
|---|---|---|---|
| `Information` | Recipient, stable proposition, truth status, belief stance, confidence, description | Recipient must exist; true information must match authoritative scenario truth; a true fact cannot be labeled a false rumor. | Private intervention event, recipient-only immutable memory, event-backed belief update. |
| `ItemTransfer` | Antidote, current source, recipient, description | Only the unused antidote; source must be its authoritative current holder; recipient must exist and be co-located. | Event-backed inventory and possession transfer; memories only for local witnesses. |
| `EnvironmentalEvent` | Location, stable condition, active/cleared state, description | Location must exist and the condition transition must change the authoritative current condition. | Event-backed location condition; memories only for occupants who perceive it. |

These are engine capabilities. The product UI remains unchanged, and the PRD's eventual user-facing intervention-card restrictions have not been implemented or expanded.

## Architectural decisions

1. **The Intervention Layer is a validator and adapter, not a state owner.** Its production source contains no inventory, belief, trust, patient, event-history, or boundary mutation. It calls only the authoritative World resolver.
2. **The World Engine validates again.** A caller cannot bypass the Intervention Layer by constructing a forged event with patch fields. Both the event envelope and category payload use allowlists, and World legality is evaluated from the frozen boundary.
3. **The event exists before its effects.** The World emits the validated intervention event first. Inventory or environmental changes are then attached to that event; memory and belief effects are emitted as a later causal consequence event.
4. **Interventions happen between turns.** They do not consume a turn or alter the clock. Their event phase is `Counterfactual intervention`, followed by consequence processing before the next autonomous decision.
5. **A same-turn frozen boundary is appended.** A completed turn may therefore have its original boundary and a later post-intervention boundary. Restoration selects the latest boundary for that turn, so malformed decision retries retain the intervention. The original input object remains independently frozen and unchanged.
6. **Exactly one external intervention is accepted per derived history.** This preserves the MVP invariant and prevents stacked counterfactual edits before Timeline Forking owns branch policy.
7. **Existing decision behavior was not taught about interventions.** The new event changes owned memories and beliefs through World rules; the unchanged policy reacts naturally to the new owned-state projection.

## Verification evidence

| Requirement | Evidence | Result |
|---|---|---|
| Validated Intervention Layer | Structural request checks, stable typed event protocol, category allowlist, and delegation-only source test. | Pass |
| Typed events are mandatory | World rejects unknown categories, mismatched turns, extra mutation fields, invalid truth, impossible transfers, invalid conditions, and repeated interventions. | Pass |
| No direct state mutation | Every resolver starts from a deep clone of the frozen input; tests hash the input before and after valid and invalid attempts. | Pass |
| Event precedes effect | Information event order precedes the causal memory/belief update; item and environment mutations are recorded on their emitted intervention events. | Pass |
| Frozen-boundary retry | A malformed first provider attempt retries from turn zero with the intervention memory intact and deep-equals a clean resolution. | Pass |
| Intervention changes later autonomy | Mara changes from `Investigate empty-case` to `Move to square` and cites `mem-world-intervention-spare-key-mara-t00-mara`. | Pass |
| No-intervention deterministic parity | Complete autonomous run SHA-256 remains `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7`. | Pass |
| Decision and Provider unchanged | Their approved file hashes remain `e03c95ed...81155` and `b7e64fe1...b677f`; `npc-agents.js` also retains its approved hash. | Pass |
| Earlier behavior | Syntax checks and 56 tests pass with zero failures, including Recorded and provider regression suites. | Pass |

## Intentional technical debt

- A post-intervention boundary shares the same `branchId` as its input because Timeline Forking is explicitly out of scope. Callers must retain the original frozen object when comparing counterfactual inputs during this phase.
- The boundary model permits two snapshots for one turn and resolves that ambiguity by selecting the latest. Phase 7 should give this relationship an explicit branch/fork identity rather than relying on object ownership.
- Environmental conditions are authoritative and event-backed, but current Decision projections and action legality do not consume them. They are supported as typed World events, not as new story mechanics.
- Item and environmental intervention categories are engine-only capabilities. The eventual MVP UI should continue exposing only the three approved information cards unless the PRD changes.
- Event and payload validation is handwritten. A shared machine-readable schema would reduce drift if more intervention producers are added.
- Interventions are synchronous and in-memory; persistence, serialization migration, audit signatures, and multi-process concurrency are not implemented.
- Event descriptions are caller-provided typed metadata. The Phase 7 card catalog must own fixed approved wording for the user-facing path.

## Readiness for Phase 7 — Timeline Forking

The World now has the primitives Timeline Forking needs:

- a frozen completed-boundary input;
- a typed, independently revalidated first counterfactual event;
- deterministic restoration of the post-intervention boundary;
- recipient-only information memory and belief propagation;
- immutable original input state;
- stable causal event and memory identities;
- unchanged autonomous continuation after intervention.

Phase 7 must still implement branch identity, exact prefix cloning, Original immutability ownership, isolated post-fork histories, eligible-turn rules, the fixed three-card catalog, recipient selection, and the one-alternate-session constraint. It must not expose the engine-only item or environmental categories in the MVP UI without a specification change.
