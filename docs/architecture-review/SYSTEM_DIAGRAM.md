# Forked Fates System Diagram

**Snapshot:** `0635ad1`

## Runtime dependency and authority map

```mermaid
flowchart LR
  subgraph Recorded_Path["Immutable Recorded path"]
    RD["recorded-data.js<br/>authored snapshots and events"]
    APP["app.js<br/>Recorded presentation controller"]
    UI["index.html + styles.css<br/>Start / Briefing / Workspace / Inspector"]
    RD --> APP --> UI
  end

  subgraph Simulation_Path["Authoritative simulation path"]
    SC["world-scenario.js<br/>initial domain data"]
    WA["world-engine.js<br/>SOLE AUTHORITATIVE RESOLVER"]
    DL["decision-layer.js<br/>projection / validation / retry"]
    PI["decision provider protocol"]
    DP["DeterministicProvider"]
    LP["LLMProvider adapter<br/>no external transport"]
    NPC["npc-agents.js<br/>four existing policies"]
    IL["intervention-layer.js<br/>type and validate request"]
    TF["timeline-fork-engine.js<br/>immutable one-Alternate orchestration"]

    SC --> WA
    DL -->|"resolve complete intent set"| WA
    DL -->|"owned projection request"| PI
    PI --> DP --> NPC
    PI --> LP
    IL -->|"typed intervention event"| WA
    TF -->|"clone completed boundary"| WA
    TF -->|"apply Alternate intervention"| IL
    TF -->|"continue autonomous turns"| DL
  end

  Recorded_Path ~~~ Simulation_Path
```

The Recorded path has no production dependency on the simulation path.

## Autonomous turn sequence

```mermaid
sequenceDiagram
  participant B as Frozen boundary
  participant D as Decision Layer
  participant P as Provider
  participant A as NPC policy or adapter
  participant W as World Engine

  D->>W: restoreBoundary(turn)
  W-->>D: frozen completed state
  loop Four NPCs from the same boundary
    D->>D: create owned-state projection<br/>select at most six owned memories
    D->>P: decide(actor, projection, attempt, contract)
    P->>A: invoke configured implementation
    A-->>P: one JSON intent
    P-->>D: raw JSON string
    D->>D: parse and validate
  end
  D->>W: resolveTurn(four validated intents)
  W->>W: movement
  W->>W: investigation and item actions
  W->>W: communication and accusation
  W->>W: wait and failed actions
  W->>W: memory, belief, trust, clock, patient, outcome
  W-->>D: frozen next boundary and events
  Note over D,W: Malformed or rejected output restores B.<br/>A resolution-invalid legal intent becomes a failed event.
```

## Intervention and timeline fork sequence

```mermaid
sequenceDiagram
  participant O as Immutable Original
  participant T as Timeline Fork Engine
  participant W as World Engine
  participant I as Intervention Layer
  participant D as Decision Layer
  participant P as Provider

  T->>O: select completed frozen boundary
  T->>T: generate Alternate branch identity
  T->>W: forkCompletedBoundary(Original, turn, branchId)
  W->>W: deep clone prefix
  W->>W: remap boundary, event, intent,<br/>memory, outcome, and causal references
  W-->>T: isolated frozen Alternate boundary
  T->>I: apply typed intervention request
  I->>I: structural validation and event typing
  I->>W: resolveInterventionEvent
  W->>W: revalidate, emit event, apply rules,<br/>emit consequences, freeze same-turn boundary
  W-->>T: intervened Alternate
  loop Until valid World outcome
    T->>D: decideAndResolveTurn
    D->>P: four owned-state decisions
    D->>W: authoritative resolution
    W-->>T: branch-local frozen boundary
  end
  Note over O,T: Original object and hash never change.<br/>Only one Alternate is allowed.
```

## Authority legend

- Solid arrows indicate runtime calls or data dependencies.
- Only `world-engine.js` may convert intents or intervention events into authoritative state changes.
- Timeline, Intervention, Decision, Provider, and policy modules operate on immutable inputs or create requests; they do not directly mutate World state.
