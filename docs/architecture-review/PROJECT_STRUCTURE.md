# Forked Fates Project Structure

**Snapshot:** Phase 8.1 D5 AI Live release

## Phase 8.1 additions

| Module | Purpose |
|---|---|
| `server.js` | Loopback static server and secure same-origin OpenAI-compatible provider proxy. |
| `ai-live-provider.js` | Browser provider-protocol adapter; contains no key or provider URL. |
| `ai-decision-layer.js` | Four parallel owned-state decisions, validation/retry, and atomic World handoff. |
| `ai-live-session-adapter.js` | Incremental AI Original/Alternate lifecycle behind the presentation boundary. |
| `fork-guidance.js` | Pure fork eligibility, remaining-turn, and opportunity presentation data. |
| `assets/*.svg` | Local original portraits, locations, patient, and antidote artwork. |
| `scripts/mock-openai-provider.js` | Local OpenAI-compatible verification fixture; never used as runtime fallback. |
| `tests/ai-live.test.js` | Provider, privacy, retry, failure, and atomic-resolution coverage. |
| `tests/comparison-truthfulness.test.js` | Decision/state difference and fork-horizon classification coverage. |
| `tests/narrative-world.test.js` | Authoritative summary and local visual asset coverage. |
| `tests/workspace-ux.test.js` | Scroll, playback, intervention, responsive, reduced-motion, and error-state coverage. |

## Phase 8 additions

| Module | Purpose |
|---|---|
| `live-session-adapter.js` | Sole presentation-facing orchestration facade for authoritative Original, playback views, fork, intervention, Alternate continuation, integrity, and comparison. |
| `live-view-models.js` | Immutable boundary-safe world, NPC, event, and outcome display projections. |
| `branch-comparison.js` | Pure integrity-gated Original/Alternate comparison and typed causal/comparison links. |
| `live-presentation.js` | Live workspace, timeline, inspectors, fork/intervention, branch switching, comparison, loading/error, and accessibility presentation. |
| `demo-path-config.js` | Explicit approved deterministic demo intervention and expected outcomes. |
| `scripts/find-demo-path.js` | Development-only deterministic candidate evaluator. |
| `tests/phase8-integration.test.js` | Protected hashes, adapter/view/comparison correctness, demo regression, integration boundary, and UI contract. |
| `docs/DEMO_PATH.md` | Sub-three-minute presenter path and recovery script. |
| `docs/PHASE_8_VERIFICATION.md` | Phase 8 automated, deterministic, architectural, and browser evidence. |
| `README.md` | Local run, verification, and architecture entry point. |

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

Generated dependency directories, build outputs, and databases do not exist. The only server is the dependency-free local Node proxy in `server.js`.

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
| `package.json` | Project metadata plus server, syntax-check, 134-test, demo-search, and mock-provider commands. No runtime dependency packages are declared. | Node.js runtime |
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
| `tests/causal-integrity.test.js` | 30 | Reference closure, exact source alignment, acyclic causes, temporal memory availability, intervention placement, boundaries, and outcome attribution. |
| `tests/phase8-integration.test.js` | 10 | Presentation boundary, protected hashes, immutable demo, view models, fork, and comparison. |
| `tests/ai-live.test.js` | 10 | AI transport, privacy, concurrency, retry, failure, and atomicity. |
| `tests/comparison-truthfulness.test.js` | 6 | Intent/state difference classification and fork horizon. |
| `tests/narrative-world.test.js` | 4 | Authoritative story summaries and local assets. |
| `tests/workspace-ux.test.js` | 7 | Stable scroll, control language, intervention UX, responsive layout, and error labels. |

**Total:** 134 tests.

## Architecture review export

`docs/architecture-review/core/` contains exact byte copies of:

- `world-engine.js`
- `decision-layer.js`
- `decision-providers.js`
- `intervention-layer.js`
- `timeline-fork-engine.js`
- `npc-agents.js`

Their integrity is recorded in [CORE_EXPORT_MANIFEST.md](CORE_EXPORT_MANIFEST.md).
