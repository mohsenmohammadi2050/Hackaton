# Forked Fates Architecture

**Snapshot:** commit `0635ad1`, tag `phase-7-D2-isolated-timeline-fork-engine`  
**Runtime:** framework-free JavaScript, CommonJS for tests and UMD-style browser compatibility  
**Current product state:** immutable Recorded Original plus a demo-ready Live UI for authoritative playback, one isolated Alternate, typed intervention, and validated branch comparison

## 1. Executive summary

Forked Fates deliberately contains two independent story systems:

1. **Recorded playback** is an immutable authored demonstration rendered directly by the presentation application. It never depends on the World Engine, Decision Layer, providers, or autonomous policies.
2. **Authoritative simulation** derives state through World rules. The Decision Layer supplies each NPC with an owned-state projection, obtains one intent through a provider, validates it, and gives the complete four-intent set to the World Engine. Interventions and timeline forks enter through validated adapters but are resolved authoritatively by the World Engine.

The World Engine is the only module allowed to create authoritative state transitions. Other layers may validate, project, configure, orchestrate, or derive display-only comparisons, but they do not directly edit World state.

Phase 8 adds a strict presentation integration boundary: `app.js` routes mode selection, `live-presentation.js` owns UI state, and `live-session-adapter.js` is the only module used by the Live UI to reach simulation orchestration. `live-view-models.js` and `branch-comparison.js` are immutable derivation modules; comparison always runs Timeline Integrity validation first.

## 2. High-level architecture

The runtime is organized as one isolated Recorded path and one layered simulation path.

```text
Recorded path
recorded-data.js -> app.js -> index.html/styles.css

Authoritative simulation path
world-scenario.js -> World Engine <- Decision Layer <- Provider <- NPC policy
                           ^              ^
                           |              |
                  Intervention Layer      |
                           ^              |
                           +---- Timeline Fork Engine

Live presentation path
app.js -> live-presentation.js -> live-session-adapter.js
                                      |-> Timeline Fork Engine
                                      |-> Timeline Integrity
                                      |-> Live View Models
                                      +-> Branch Comparison
```

The dependency graph is intentionally not symmetric:

- Recorded and Presentation do not import the simulation layers.
- World Engine imports no project runtime module.
- Decision depends on World, but World never depends on Decision.
- Provider adapters depend on policies, but Decision only sees the provider protocol.
- Intervention depends on World, but cannot mutate it.
- Timeline Fork depends on World, Decision, and Intervention for orchestration; authoritative changes still occur in World.

See [SYSTEM_DIAGRAM.md](SYSTEM_DIAGRAM.md) for detailed diagrams.

## 3. Layer responsibilities

| Layer | Modules | Owns | Must not own |
|---|---|---|---|
| Recorded | `recorded-data.js` | Authored 12-turn Original snapshots, events, character histories, outcomes, and stable Recorded identities | World derivation, autonomous decisions, alternate simulation |
| Presentation | `index.html`, `styles.css`, `app.js`, `live-presentation.js` | Mode routing, Start, briefing, workspaces, frozen-boundary playback, timeline/inspectors, intervention composer, branch switching, comparison rendering, recovery | World logic, hidden-truth derivation, direct provider/World calls |
| Presentation integration | `live-session-adapter.js`, `live-view-models.js`, `branch-comparison.js`, `demo-path-config.js` | Safe orchestration facade, immutable display projections, validated pure comparison, approved demo configuration | Authoritative mutation, policy logic, Recorded derivation |
| Scenario | `world-scenario.js` | Initial World data, facts, NPC traits/goals/trust/memories/beliefs, locations, priority, approved predetermined intents | Runtime mutation or presentation |
| World | `world-engine.js` | Authoritative state, legal action resolution, events, memories, beliefs, trust, public record, clock, patient, outcomes, boundaries, intervention resolution, fork cloning, branch identity remapping | NPC choice, UI rendering, provider configuration |
| Decision | `decision-layer.js` | Owned-state projections, relevant-memory selection, output parsing, decision validation, retry orchestration, four-intent collection | Authoritative mutation, policy selection, hidden state exposure |
| Provider | `decision-providers.js` | Versioned provider protocol, deterministic adapter, API-free LLM adapter, provider factory | World resolution, output acceptance, story state |
| Autonomous policy | `npc-agents.js` | Existing deterministic rule policies that produce one JSON intent from one owned projection | World truth, other NPC private state, resolution, branch mutation |
| Intervention | `intervention-layer.js` | Structural validation and typing of Information, ItemTransfer, and EnvironmentalEvent requests | Direct World edits, branch creation, decision logic |
| Timeline Fork | `timeline-fork-engine.js` | Immutable Original/session wrappers, one-Alternate policy, fork selection, generated branch identity, lifecycle orchestration, audit/intent identity projection | World mutation, comparison, merge, undo, UI |

## 4. Authoritative data model

An authoritative World state contains:

- scenario, version, branch, turn, deadline, and status;
- exactly three locations and four decision-making NPCs;
- patient and antidote state;
- stable scenario facts and public-record claims/evidence;
- per-NPC location, inventory, goals, trust, beliefs, memories, posture, and current intent;
- append-only events;
- completed frozen boundaries;
- a terminal outcome when complete.

The following concepts remain distinct:

- **World truth:** authoritative facts and physical state.
- **Claim:** something asserted; it may be false or unsupported.
- **Belief:** one NPC's stance, confidence, supporting memories, and update turn.
- **Memory:** immutable evidence that an NPC perceived, received, did, or experienced something.
- **Intent:** one NPC's private proposed action from a completed start-of-turn boundary.
- **Event:** the authoritative record of what resolved and what changed.

Scenario entity identities—NPCs, locations, facts, claims, goals, and the antidote—remain stable across branches. Timeline-record identities—boundaries, events, intents, memories, and outcomes—are branch-specific.

## 5. Data flow

### 5.1 Recorded playback

`recorded-data.js` is loaded by `app.js`. Presentation advances an index over authored snapshots and events. Inspection reads authored data. Restart returns to authored turn zero. No simulation module is loaded or consulted.

### 5.2 Autonomous simulation

1. `world-scenario.js` supplies immutable starting data.
2. World creates the turn-zero state and first frozen boundary.
3. Decision restores the selected completed boundary.
4. Decision creates four separate owned-state projections.
5. Provider returns one JSON intent per NPC.
6. Decision validates identity, action family, goal, memory citations, known facts, and owned legal options.
7. World resolves the complete intent set in deterministic phase order.
8. World emits events, applies consequences, captures a new boundary, and freezes the result.

### 5.3 Information boundary

The provider receives only:

- actor identity;
- the actor's frozen owned projection;
- retry attempt number;
- output contract metadata.

The projection contains self state, public character identities, co-located observations, legal options, and at most six selected owned memories. It excludes authoritative facts, event history, boundaries, other NPC private state, unpublished intents, and outcomes.

## 6. Turn lifecycle

1. **Start boundary:** a ready, completed, recursively frozen boundary is selected.
2. **Observe/project:** Decision independently projects the same start state for all four NPCs.
3. **Decide:** each provider call returns exactly one intent as a JSON string.
4. **Validate:** Decision distinguishes malformed output from structurally valid but rejected output.
5. **Resolve:** World deep-clones the boundary, marks the next turn resolving, and orders intents by action phase and rotating actor priority.
6. **Movement:** movement resolves first.
7. **Investigation/item:** investigation, transfer, and administration resolve against the state produced by movement.
8. **Communication/accusation:** statements resolve using current co-location and knowledge rules.
9. **Wait/failure:** waits and resolution-invalid legal intents become explicit events.
10. **Consequences:** World applies memory, belief, trust, public-record, clock, patient, and outcome rules.
11. **Commit:** current intents are cleared, the state becomes ready or completed, a boundary is captured, and the graph is recursively frozen.

If provider output is malformed or rejected, the attempt is discarded. Retry restores the last completed frozen boundary; no partial event or state survives. A legal intent that becomes impossible during ordered World resolution is not retried—it becomes a failed-action event.

## 7. Replay lifecycle

Three replay forms exist and must not be conflated:

### 7.1 Recorded replay

Presentation replays authored snapshots. This is the permanent demo fallback and remains independently executable.

### 7.2 Predetermined authoritative replay

`world.replayOriginal(scenario)` resolves the scenario's approved predetermined intent sets through World rules. It proves that authored observable evolution can be reproduced by the authoritative engine.

### 7.3 Autonomous authoritative replay

`decision.runAutonomousOriginal(scenario, provider)` repeatedly collects four provider intents and asks World to resolve them. With `DeterministicProvider`, the complete serialized result is deterministic and retains the approved SHA-256 `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7`.

`world.restoreBoundary(state, turn)` restores a completed snapshot and the event/boundary prefix associated with it. For a turn with a post-intervention boundary, restoration deliberately selects the latest same-turn snapshot.

## 8. Provider lifecycle

1. Configuration is passed to `createProvider`.
2. `DeterministicProvider` wraps the existing four rule policies, or `LLMProvider` wraps an injected invocation function.
3. Decision sends a `forked-fates-decision-provider-v1` request containing only owned state.
4. The provider returns one JSON string.
5. Decision parses and validates the candidate.
6. Provider execution failures are classified as malformed output and use existing frozen-boundary retry.

The LLM adapter has no SDK, HTTP transport, credentials, prompt templates, or external API calls. GPT, Claude, local, mock, or future implementations are configuration/adapter concerns; Decision and World do not change.

## 9. Intervention lifecycle

1. An external request enters `intervention-layer.js` with a stable request identity, category, target boundary turn, and typed payload.
2. Intervention Layer allowlists envelope and payload fields and creates a frozen `forked-fates-intervention-v1` event.
3. World independently validates protocol, identity, boundary, category, scenario truth, ownership, co-location, and environmental transition legality.
4. World emits the intervention event before applying any effect.
5. World applies category-specific rules:
   - Information creates recipient-only memory and belief consequences.
   - ItemTransfer updates only legal antidote ownership/inventories and local memories.
   - EnvironmentalEvent updates one legal location condition and local memories.
6. World emits causal consequence events where required.
7. World appends a frozen post-intervention boundary at the same turn.

Only one external intervention is accepted in a derived history. The current product UI exposes none of these capabilities.

## 10. Timeline Fork lifecycle

1. Timeline Fork Engine wraps a completed autonomous Original in an immutable timeline.
2. An immutable session is created with `alternate: null`.
3. A completed Original boundary is selected. Any boundary from turn zero through twelve can be cloned; terminal boundaries remain terminal.
4. Timeline Fork Engine generates `<original-branch>-alternate-tNN` and delegates cloning to World.
5. World restores the source boundary, deep-clones the full prefix, assigns the new branch identity, and remaps all branch-specific identities and references.
6. Copied prefix boundaries, events, intents, and memories receive `sourceId` links to their Original records.
7. The typed intervention is applied only to the Alternate.
8. Autonomous continuation uses the unchanged Decision and Provider lifecycle.
9. World namespaces future intents at resolution and emits branch-specific events, memories, boundaries, and outcome.
10. The completed session retains one immutable Original and one immutable Alternate. A second or nested fork is rejected.

No branch comparison, merge, undo, or timeline UI exists at this checkpoint.

## 11. Design principles

1. **Recorded-first safety:** authored playback remains available and independent.
2. **World authority:** only World rules change authoritative state.
3. **Immutable completed history:** completed events and boundaries are never edited in place.
4. **Atomic turns:** all four intents share one start boundary; partial turns are not observable.
5. **Information isolation:** NPCs receive only owned state and perceived events.
6. **Semantic separation:** truth, claims, beliefs, memories, intents, and events are different records.
7. **Event-backed consequences:** every authoritative change is connected to an event.
8. **Determinism where promised:** Recorded and deterministic-provider paths are exact replay fixtures.
9. **Provider neutrality:** decision orchestration is independent of model vendor.
10. **Branch isolation:** alternate causal records have distinct identities and object graphs.
11. **Small explicit domain:** four NPCs, three locations, one antidote, and twelve turns favor auditability over generality.
12. **Minimal phase scope:** no UI or future-phase behavior is added before its architecture is verified.

## 12. Extension points

These are architectural seams, not implemented features:

- **Provider adapters:** add transport-specific adapters behind the provider protocol without changing Decision or World.
- **Scenario data:** introduce another conforming scenario object while keeping World rules explicit; current policies remain scenario-specific.
- **Intervention producers:** map fixed UI cards or an API to the existing typed intervention protocol.
- **Comparison:** use `sourceId`, fork turn, intervention event, branch-local histories, and final state to compute grounded differences.
- **Persistence:** serialize frozen timelines behind versioned schemas and validate on load.
- **Invariant validation:** promote the current test-only World validity checks into a reusable production validator.
- **Identity schema:** replace handwritten field remapping with a centralized typed reference registry.
- **Asynchronous inference:** add an async orchestration boundary around providers while preserving start-boundary and retry semantics.

Every extension must retain Recorded independence, World authority, owned-state isolation, atomic turns, stable causal identities, and immutable completed history.
