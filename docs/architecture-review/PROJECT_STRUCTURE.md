# Forked Fates Project Structure

**Snapshot:** `0635ad1`

## Directory tree

```text
F:\Hackaton
├── AGENTS.md
├── index.html
├── styles.css
├── app.js
├── recorded-data.js
├── world-scenario.js
├── world-engine.js
├── decision-layer.js
├── decision-providers.js
├── npc-agents.js
├── intervention-layer.js
├── timeline-fork-engine.js
├── package.json
├── docs
│   ├── PRODUCT_SPEC.md
│   ├── BUILD_STRATEGY.md
│   ├── EXECUTION_CONTRACT.md
│   ├── ACCEPTANCE_MAP.md
│   ├── DEMO_SCRIPT.md
│   ├── PHASE_*_VERIFICATION.md
│   ├── PROVIDER_ARCHITECTURE_VERIFICATION.md
│   └── architecture-review
│       ├── README.md
│       ├── ARCHITECTURE.md
│       ├── SYSTEM_DIAGRAM.md
│       ├── PROJECT_STRUCTURE.md
│       ├── TECHNICAL_DEBT.md
│       ├── VERIFICATION_INDEX.md
│       ├── ENGINEERING_ASSESSMENT.md
│       ├── CORE_EXPORT_MANIFEST.md
│       └── core\
└── tests
    ├── phase1.test.js
    ├── world-engine.test.js
    ├── autonomous-agents.test.js
    ├── provider-architecture.test.js
    ├── intervention-engine.test.js
    └── timeline-fork-engine.test.js
```

Generated dependency directories, build outputs, databases, and server components do not exist at this checkpoint.

## Root production modules

| Module | Purpose | Direct project dependency |
|---|---|---|
| `index.html` | Static entry point containing Start, Briefing, and Workspace markup for Recorded playback. | `styles.css`, `recorded-data.js`, `app.js` |
| `styles.css` | Responsive visual treatment and component states for the static Recorded application. | None |
| `app.js` | Presentation controller for navigation, playback, timeline inspection, NPC inspection, pause, and restart. | Browser global from `recorded-data.js` |
| `recorded-data.js` | Immutable authored 12-turn Recorded Original, snapshots, events, memories, trust history, and outcome. | None |
| `world-scenario.js` | Domain seed for The Last Antidote: facts, locations, patient, antidote, four NPCs, goals, trust, memories, beliefs, priority, and approved predetermined intents. | None |
| `world-engine.js` | Sole authoritative resolver. Creates/restores boundaries; validates and resolves actions; emits events; applies memories, beliefs, trust, public record, clock, patient, and outcomes; resolves interventions; clones and namespaces forks. | None |
| `decision-layer.js` | Creates owned-state projections, selects at most six relevant memories, parses/validates provider output, retries from frozen boundaries, and submits complete intent sets to World. | `world-engine.js` |
| `decision-providers.js` | Defines provider protocol, deterministic policy adapter, API-free LLM adapter, provider validation, and configuration factory. | `npc-agents.js` |
| `npc-agents.js` | Four deterministic scenario-specific policies that each map an owned projection to one JSON intent. | None |
| `intervention-layer.js` | Validates external intervention requests, creates frozen typed events, and delegates authoritative resolution. | `world-engine.js` |
| `timeline-fork-engine.js` | Creates immutable Original/session wrappers, enforces one Alternate, requests authoritative cloning, applies Alternate intervention, continues autonomous turns, and presents branch-scoped intent/audit records. | `world-engine.js`, `decision-layer.js`, `intervention-layer.js` |
| `package.json` | Project metadata plus syntax-check and 67-test commands. No runtime dependency packages are declared. | Node.js runtime |
| `AGENTS.md` | Active engineering invariants, phase discipline, and checkpoint naming rules. | Authoritative docs |

## Documentation

| Document | Purpose |
|---|---|
| `docs/PRODUCT_SPEC.md` | Product authority: scope, domain, rules, information boundaries, user journey, acceptance criteria, and exclusions. |
| `docs/BUILD_STRATEGY.md` | Implementation-order authority, phase exits, demo maturity, regression ownership, and delivery constraints. |
| `docs/EXECUTION_CONTRACT.md` | Locked Recorded Original/Alternate causal proof, stable identities, outcomes, and checkpoint convention. |
| `docs/ACCEPTANCE_MAP.md` | Maps PRD acceptance criteria to implementation phases and evidence owners. |
| `docs/DEMO_SCRIPT.md` | Current recorded demonstration flow. |
| `docs/PHASE_1_VERIFICATION.md` | Recorded walking-skeleton evidence. |
| `docs/PHASE_2_VERIFICATION.md` | Complete Recorded Original evidence and Phase 1 regression. |
| `docs/PHASE_3_VERIFICATION.md` | authoritative World architecture, replay, and parity evidence. |
| `docs/PHASE_4_VERIFICATION.md` | four autonomous agents, owned projections, memory selection, validation, and retry evidence. |
| `docs/PROVIDER_ARCHITECTURE_VERIFICATION.md` | Provider-neutral decision boundary and byte-parity evidence. |
| `docs/PHASE_6_INTERVENTION_VERIFICATION.md` | Typed intervention, authoritative consequence, and frozen-boundary evidence. |
| `docs/PHASE_7_TIMELINE_FORK_VERIFICATION.md` | Immutable Original, identity-isolated Alternate, autonomous divergence, and World-validity evidence. |
| `docs/architecture-review/*` | External audit snapshot prepared after Phase 7 approval. |

## Test suites

| Suite | Current tests | Primary coverage |
|---|---:|---|
| `tests/phase1.test.js` | 19 | Recorded data contract, hidden-truth briefing, navigation, inspection, complete 12-turn playback, controls, restart, and event-backed snapshots. |
| `tests/world-engine.test.js` | 10 | Layer independence, initial state, resolution order, seven actions, failed actions, information boundaries, replay, events, immutability, and Recorded parity. |
| `tests/autonomous-agents.test.js` | 11 | Owned projection, six-memory cap, four autonomous decisions, policy reactivity, output classes, retry, deterministic replay, and parity. |
| `tests/provider-architecture.test.js` | 7 | Provider-only Decision dependency, DeterministicProvider parity, mock LLM contract, vendor-neutral configuration, and API-free failure behavior. |
| `tests/intervention-engine.test.js` | 9 | Typed intervention categories, event-before-effect, decision divergence, retry, no-intervention parity, locality, and forged-request rejection. |
| `tests/timeline-fork-engine.test.js` | 11 | Immutable Original, all-boundary cloning, generated branch identity, deep isolation, branch-specific identities, alternate-only intervention, deterministic alternate, World validity, and one-fork enforcement. |

**Total:** 67 tests.

## Architecture review export

`docs/architecture-review/core/` contains exact byte copies of:

- `world-engine.js`
- `decision-layer.js`
- `decision-providers.js`
- `intervention-layer.js`
- `timeline-fork-engine.js`
- `npc-agents.js`

Their integrity is recorded in [CORE_EXPORT_MANIFEST.md](CORE_EXPORT_MANIFEST.md).
