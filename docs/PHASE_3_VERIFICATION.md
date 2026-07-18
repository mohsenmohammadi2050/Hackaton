# Phase 3 Architecture and Verification — Authoritative World Engine

**Checkpoint:** `phase-3-D1-authoritative-original-replay`

**Scope:** Phase 3 only

**Authority:** `PRODUCT_SPEC.md`, `BUILD_STRATEGY.md`, `EXECUTION_CONTRACT.md`, and `AGENTS.md`

## Result

The project now contains two independent implementations of the Original:

- The **Recorded Original** remains the finished authored D1 artifact. Its production files and browser entry path are unchanged.
- The **World Engine** creates an authoritative turn-zero world and deterministically resolves the predetermined Original intents through all twelve turns.

Both reach the same observable Original evolution and final **Lost / Exposed / Fractured** outcome. Neither production system imports, calls, mutates, derives, or renders the other.

## Three-layer architecture

### Recorded Layer

`recorded-data.js` is immutable authored playback data. It retains the stable Recorded event, memory, belief, pivotal-event, and outcome identities approved at D1. It has no reference to the World Layer.

### World Layer

`world-scenario.js` contains only domain inputs:

- authoritative scenario facts;
- three locations and four NPC starting definitions;
- inventories, starting trust, memories, beliefs, goals, and posture;
- the one real antidote and untreated patient;
- deterministic acting priorities;
- one predetermined intent per NPC per Original turn.

`world-engine.js` contains only domain rules and state transitions. Its public API is:

- `createInitialWorld(scenario)`;
- `resolveTurn(completedBoundary, intents)`;
- `restoreBoundary(state, turn)`;
- `replayOriginal(scenario)`;
- `observableState(state)`.

The engine accepts scenario data as an argument and does not import either the Recorded or Presentation Layer. It can run in Node today and retains a browser-global fallback for a future, explicitly authorized integration.

### Presentation Layer

`index.html`, `app.js`, and `styles.css` remain the existing Recorded presentation. The entry point still loads only `recorded-data.js` and `app.js`; therefore deleting or withholding the World Layer cannot prevent D1 from launching.

The Presentation Layer performs no authoritative simulation work. Phase 3 intentionally adds no World UI, Live mode, Director controls, Fork, Intervention, Comparison, or alternate branch.

### Dependency rule

Production dependencies are intentionally disconnected:

```text
Presentation Layer -> Recorded Layer

World scenario input -> World Engine

Verification tests -> Recorded Layer + World Layer
```

Only the test suite observes both systems, where it acts as a parity oracle.

## Architectural decisions

1. **Keep D1 sealed.** No Phase 2 production file was changed. Recorded playback remains independently executable and cannot acquire a World Engine dependency accidentally through the entry point.
2. **Use a separate authoritative scenario input.** Starting state and predetermined intents are domain data, not copied presentation snapshots or display events. This allows the engine to validate and resolve intents instead of replaying rendered consequences.
3. **Use separate identity namespaces.** Recorded identities such as `evt-orig-*` remain untouched. World-derived identities use `evt-world-*` and `mem-world-*`, preventing a future adapter from treating one history as the other.
4. **Use a functional completed-boundary API.** `resolveTurn` clones a frozen completed boundary and returns a new deeply frozen boundary. Earlier state, events, memories, and snapshots cannot be mutated.
5. **Keep turns atomic.** Resolving state exists only inside `resolveTurn`; callers receive either the prior completed boundary or the next completed boundary. No partial state is exposed.
6. **Validate decisions against owned start-boundary context.** Every turn requires exactly one intent per NPC. Action family, selected boundary, goal, rationale, and cited-memory ownership are checked before resolution. Same-turn unpublished events cannot become cited decision inputs.
7. **Resolve by authoritative phase and priority.** Movement precedes investigation/item actions, which precede communication/accusation, waits/failures, then information, relationship, public-record, clock, and outcome consequences. The four-NPC priority is stored on every derived turn event.
8. **Revalidate at resolution time.** A previously selectable intent that becomes illegal after movement or an earlier item action becomes a phase-four failed-action event with no prohibited state change.
9. **Stage information consequences.** Action witnesses are determined from authoritative resolution-time locations. Memories and beliefs are applied only in phase five, with immutable memories linked back to their originating action events.
10. **Keep truth, claims, beliefs, and memories distinct.** Canonical facts live in world truth; public statements create claims; NPC beliefs are private state; perceived events create owned immutable memories.
11. **Apply trust through explicit events.** Required accusation, confession, treatment, transfer, and established-deception effects are accumulated, capped per pair per turn, clamped to -100…100, and emitted with causes.
12. **Compute outcomes from final authoritative state.** Medical outcome comes from valid administration, truth outcome from established public facts/false consensus, and social outcome from truth, treatment, and final directed trust.
13. **Restore from full completed snapshots.** Every boundary records complete authoritative state and its event count. Restore truncates later history and replaying the same intents produces byte-equivalent domain state.
14. **Keep parity outside production.** The engine never reads Recorded data. Tests compare canonical observables from both systems so semantic drift fails verification without creating runtime coupling.

## Phase 3 exit criteria

| Criterion | Verification |
|---|---|
| Starting world matches the PRD | Tests assert exactly four NPCs, three locations, turn zero, twelve turns, Untreated Niko, one antidote in the Storehouse, starting locations, inventories, trust matrices, owned knowledge, and hidden-fact uncertainty. |
| Turn follows specified resolution order | Every World event carries a numeric phase, within-turn order, and acting priority. Tests assert nondecreasing movement → item/investigation → communication/accusation → wait/failure → consequence phases. |
| Legal intents produce only allowed changes | The suite exercises all seven legal action families. Movement changes only location; discovery changes custody; transfer changes inventory/custody; administration changes the real antidote and patient; speech changes claims/beliefs; waits change no external state. |
| Invalidated intents fail safely | A private communication selected while co-located is invalidated when its target moves first. It becomes a visible phase-four failed-action event, creates only the actor's failure memory, and changes no claim, item, trust, patient, or location state. |
| Witnesses receive correct memories | Tests cover private Dain/Sera communication, local public accusation after Dain leaves, self-only actions, and the Clinic confession. Remote and nonparticipant NPCs receive no memory. |
| Turn-zero and turn-one restore deterministically | Restoring turn zero and replaying turn one produces a deeply equal boundary. Restoring turn one and replaying turn two also reproduces the original boundary. Two complete twelve-turn replays are deeply equal. |
| D1 remains unchanged | The static entry point contains no World script. All 19 Phase 1/2 tests still pass, including Start, Briefing, Recorded Step/Run/Pause, Timeline, inspectors, outcome, and Restart. Git diff confirms no changes to `recorded-data.js`, `app.js`, `index.html`, or `styles.css`. |

## User-requested replay and parity proof

1. **World Engine replay:** `replayOriginal` resolves 48 predetermined NPC intents across twelve atomic turns and reaches a computed Lost / Exposed / Fractured outcome.
2. **Recorded independence:** the real application DOM journey continues to execute with only the Recorded data global. Production source-boundary tests reject any Recorded-to-World or World-to-Recorded reference.
3. **Observable parity:** at every boundary from turn 0 through turn 12, tests compare turns remaining, patient state, all four NPC locations, all directed trust values, antidote location/possessor, false-consensus state, established responsible facts, and the three final outcome labels.

## Intentional technical debt

- The World scenario repeats the Original's semantic starting conditions and predetermined intents. This duplication is required to keep the engine independent of the authored artifact; boundary-by-boundary parity tests are the drift alarm.
- `world-engine.js` is one domain module. It is large, but its public seam is small and stable. Splitting resolvers before Phase 4 reveals the real decision-cycle seam would be speculative refactoring.
- Full snapshots use JSON-compatible deep cloning. This is simple and deterministic for thirteen small boundaries but is not optimized for larger worlds or long sessions.
- Belief confidence after ordinary claims uses a deliberately simple deterministic trust mapping. It is sufficient for authoritative Original replay, not a finished autonomous deliberation model.
- Public-record and outcome rules are scenario-specific to The Last Antidote MVP rather than a general narrative rules language.
- The World Engine has no production presentation adapter. This is intentional: adding a UI surface would introduce unrequested Live or Director behavior in Phase 3.
- Runtime schema validation uses explicit invariants rather than a type system or external validation library.
- State persistence across page reloads is not implemented.

## Risks for Phase 4

- The first autonomous NPC must receive a projection of its own authoritative state—not the full world object. Passing the engine state directly would leak hidden truth and private NPC state.
- Relevant-memory selection is not implemented yet. Phase 4 must select at most six owned, pre-boundary memories without changing the immutable history.
- A decision adapter must distinguish malformed model output from a well-formed but resolution-invalid intent. Only the latter should become an in-world failed-action event.
- Retry must restore the last frozen boundary before requesting another decision; no unresolved attempt may append events or memories.
- Any future UI adapter must translate World events for display without recomputing consequences and without changing the existing Recorded path.
- The single World Engine module may need a minimal resolver/decision-context split in Phase 4. Refactor only if autonomous integration makes the present boundary materially difficult to maintain.
- Scenario-specific belief/public-record rules could be accidentally generalized too early. Phase 4 should prove one autonomous NPC against this scenario before expanding abstractions.
- Recorded/World semantic duplication can drift during later edits. The full parity suite must remain a mandatory checkpoint test.

## Verification commands

```text
npm.cmd run check
npm.cmd test
```

Expected result: syntax checks pass and all 29 tests pass with zero failures.
