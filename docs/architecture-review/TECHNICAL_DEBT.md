# Forked Fates Technical Debt Register

**Snapshot:** Phase 8.1 D5 release

**Assessment basis:** current 132-test-plus Phase 8.1 AI Live architecture

> Phase 8.1 note: `timeline-integrity.js` and `branch-comparison.js` close the former reusable graph/comparison gaps. Boundary classifications are explicit. A secure local provider proxy, asynchronous four-character AI orchestration, timeouts, bounded retries, field allowlists, request-size limits, and visible failure now exist. They are a local demo boundary, not a production multi-tenant service.

## Priority definitions

- **P0 — production gate:** address before exposing the simulation to durable user data, untrusted traffic, or real external inference.
- **P1 — scale/reliability gate:** acceptable for the four-NPC/12-turn audited MVP, but risky as scenarios, branches, providers, or operators increase.
- **P2 — maintainability:** does not currently threaten correctness but raises change cost or obscures intent.

No unresolved test failure or known corruption defect exists at this checkpoint. The items below are architectural debt and risk, not claims that the approved MVP behavior is currently broken.

## P0 — production gates

### P0.1 Handwritten identity and reference remapping

**Risk:** Branch isolation depends on `world-engine.js` knowing every identity-bearing field. It currently remaps event causes, memory origins, created/cited memories, belief support, public-record event references, intents, boundaries, and outcomes by hand. A new reference field can compile and pass unrelated tests while retaining an Original identity in Alternate state.

**Impact:** Silent cross-branch reference leakage would undermine the product's central causal proof and could produce incorrect comparison results.

**Before production:** Define a versioned domain schema or central reference registry; validate every serialized graph; add migration rules; add property tests that traverse all identity/reference fields and prove branch closure.

### P0.2 No durable persistence or transactional recovery

**Risk:** Timelines exist only as in-memory frozen JavaScript graphs. There is no database, append log, checkpoint store, write-ahead record, crash recovery, import/export schema, or transaction boundary beyond process memory.

**Impact:** A process failure loses a run. Multi-process workers could not safely coordinate branch/session ownership. Stored histories cannot be migrated because no storage format is defined.

**Before production:** Choose a canonical versioned serialization, persist completed boundaries/events atomically, validate on load, define idempotency keys, and test crash/retry behavior.

### P0.3 Provider transport is local-demo grade, not production grade

**Risk:** Phase 8.1 adds server-side credentials, an OpenAI-compatible transport, timeout, bounded retry, request limits, redacted errors, response extraction, and strict browser-side intent validation. It does not add rate limiting, cancellation propagated from the UI, token/cost budgets, content moderation, provider-specific telemetry, durable model-version provenance, or a deployment secret manager.

**Impact:** The local proof is safe for one operator, but internet exposure could make availability, cost, abuse control, and auditability unacceptable.

**Before production:** Add authentication, rate/cost quotas, provider/model provenance, cancellation, bounded token/output policy, operational telemetry, and a managed secret store. Keep Decision and World contracts unchanged.

### P0.4 World-state invariants beyond timeline graph closure remain test-heavy

**Risk:** The reusable versioned Timeline Integrity validator covers reference closure, source alignment, boundary ordering, intervention placement, outcome support, and branch isolation. Broader scenario-shape and World-state invariants still rely heavily on constructors and tests, and there is no deserialization entry point yet.

**Impact:** Corrupt persisted state or a migration defect could enter resolution and fail later with misleading domain errors.

**Before production:** Promote invariant checks into a versioned validation module that runs at creation, load, fork, intervention, and optionally boundary commit.

### P0.5 No production service security or tenancy boundary

**Risk:** The local Node server binds to loopback, keeps provider secrets server-side, uses same-origin routes, validates methods/payloads, bounds request size, and sets browser security headers. It intentionally has no authentication, authorization, tenant ownership, audit identity, request quotas, CSRF token, or signed event provenance for remote deployment.

**Impact:** Users could access or alter other sessions, exhaust provider/world resources, or inject untrusted content into future rendering/logging surfaces.

**Before production:** Define trust boundaries before adding endpoints: authenticate callers, authorize timeline ownership, isolate tenants, escape rendered content, rate-limit, sign/audit external events, and keep secrets outside timeline state.

## P1 — scale and reliability gates

### P1.1 World Engine concentration

`world-engine.js` is 1,146 lines and owns action resolution, events, consequences, outcomes, interventions, cloning, identity mapping, and restoration. This concentration protects authority, but increases regression radius and reviewer load.

**Risk at scale:** New scenarios or action families may turn the authority boundary into a monolith. Any decomposition must preserve a single public resolver and avoid moving mutation into Presentation, Decision, Intervention, or Timeline layers.

### P1.2 Full JSON cloning and snapshot amplification

State cloning uses `JSON.parse(JSON.stringify(...))`. Every completed boundary stores a full World snapshot; every fork duplicates the selected prefix and all nested memories/beliefs; immutable session updates duplicate wrapper structures.

**Current fit:** Four NPCs, twelve turns, and one Alternate are small enough for this to remain legible and fast.

**Risk at scale:** Memory and CPU grow with state size × boundaries × branches. JSON cloning also excludes non-JSON values and loses explicit type information.

**Future direction:** Profile first, then consider canonical serialization, structural sharing, or an event-sourced materializer without weakening isolation.

### P1.3 Boundary semantics are explicit but not migration-tested

`initial`, `turn-close`, and `post-intervention` are validated explicitly. No durable persistence format exists, so version migration and compatibility with future boundary kinds remain untested.

### P1.4 One-Alternate identity allocation does not generalize

Branch identity is deterministically generated from Original branch and fork turn. This is collision-free only because a session allows one Alternate and no nested fork.

**Risk:** Multiple alternates, imported sessions, distributed workers, or retries would need a durable allocator and uniqueness constraint.

### P1.5 Scenario and policy coupling

The World resolver contains scenario-specific evidence and outcome rules. `npc-agents.js` contains four scenario-specific policies with stable fact/claim IDs. This is appropriate for the single-scenario MVP but not a general narrative engine.

**Risk:** A second scenario would either add conditionals to core modules or require a formal rule/plugin boundary. Generalization should not precede a concrete second scenario.

### P1.6 Mixed asynchronous and synchronous orchestration

AI provider invocation and four-character collection are asynchronous and parallel. World resolution remains deliberately synchronous and atomic. Deterministic Original construction and full Alternate preparation still replay synchronously in the browser; larger scenarios could block the main thread.

### P1.7 Output contract duplication

The provider-facing output summary and detailed Decision validator are separately maintained. Intervention Layer and World also repeat structural checks intentionally so World remains authoritative.

**Risk:** Legitimate defense-in-depth can become schema drift. A shared declarative schema should distinguish adapter validation from authoritative legality.

### P1.8 Error and audit model is partly string-based

Decision has typed error classes and categories, but World invariant failures and several orchestration failures are ordinary `Error` instances with message contracts. Tests match text for some cases.

**Risk:** Operational handling, localization, API responses, and metrics would be fragile. Stable error codes and structured causal context are needed before service exposure.

### P1.9 No observability or performance budgets

There are no structured logs, traces, metrics, provider latency/cost records, boundary-size metrics, replay duration budgets, or alert thresholds.

**Risk:** Production operators could not distinguish invalid model output, World rejection, infrastructure delay, or data corruption quickly.

### P1.10 Canonical hash and version migration policy is incomplete

Exact replay currently hashes `JSON.stringify` output. Object construction order is deterministic in the tested runtime, but there is no declared canonical JSON format, signature, or migration policy across engine/scenario versions.

**Risk:** Harmless serialization changes can invalidate golden hashes; harmful migrations may not be distinguishable from formatting changes.

### P1.11 Provider context isolation is an adapter responsibility

Provider requests contain only owned projections, but an injected provider implementation can retain shared mutable conversation state across NPC calls.

**Risk:** A real adapter could leak one NPC's prior request or output to another despite the Decision projection being correct.

**Before real providers:** Require stateless calls or actor-scoped contexts and test adapters for cross-NPC leakage.

### P1.12 Deterministic initialization and Alternate preparation remain synchronous

The deterministic four-NPC, twelve-turn MVP completes quickly, but `createLiveSession()` and `completeAlternate()` resolve full timelines synchronously. A larger scenario would block the browser main thread. Move deterministic bulk replay to a worker boundary if profiling justifies it; do not make World mutation asynchronous internally.

### P2.4 Framework-free presentation concentration

`live-presentation.js` intentionally keeps Phase 8 dependency-free, but its string templates combine workspace, inspector, composer, comparison, and interaction dispatch. A later feature phase should split presentation components behind the same adapter without moving domain logic into them. This was not refactored during Phase 8 because the user journey is bounded and tested.

## P2 — maintainability debt

### P2.1 No static type system or machine-readable domain schema

The code uses UMD/CommonJS JavaScript and runtime validation. TypeScript, JSON Schema, or generated types could reduce field drift, but conversion should be scoped and behavior-preserving.

### P2.2 Repeated full-story tests

Several suites independently run the 12-turn autonomous Original or Alternate. Current runtime remains only a few seconds, but growth could make feedback slow. Shared mutable fixtures must not be introduced merely to speed tests.

### P2.3 Limited generative/property testing

The suite has strong examples and exact hashes but no fuzzing of intent payloads, random legal turn sets, graph-reference traversal, or mutation testing.

### P2.4 Environmental interventions are dormant mechanics

Environmental conditions are authoritative and event-backed, but Decision projections and action legality do not consume them. They are an engine contract requested in Phase 6, not an active story feature.

### P2.5 Recorded and World representations intentionally duplicate the Original

The Recorded artifact and authoritative World evolution are independent by design. This protects fallback availability but means story corrections may need coordinated updates and parity evidence.

### P2.6 Phase/checkpoint nomenclature is historically irregular

Provider Architecture was introduced as a post-Phase-4 checkpoint and later approved by the user as Phase 5. Its tag remains `phase-4-D2-provider-architecture`. The implementation sequence is clear in Git and the verification index, but automation must not infer phase solely from filenames or tag numbers.

### P2.7 Comparison explanations remain presentation-specific

Reusable integrity and structured comparison APIs now exist. Natural-language explanation remains deliberately small and presentation-specific; localization and explanation-schema versioning are not implemented.

## Scalability envelope

| Dimension | Current hard scope | Primary scaling concern |
|---|---:|---|
| NPCs | Exactly 4 | Projection/provider calls and pairwise trust grow; policies and tests assume four. |
| Locations | Exactly 3 | Action legality and scenario evidence are hardcoded. |
| Turns | Maximum 12 | Full boundary snapshots and repeated replay grow linearly with turns and state size. |
| Critical items | One antidote | Inventory/possession rules are item-specific. |
| Alternates | One | ID generation, storage, UI, and comparison are not multi-branch. |
| Providers | Deterministic plus one OpenAI-compatible local proxy | Multi-provider failover, cost controls, remote tenancy, and model provenance are unhandled. |
| Scenarios | One | World and policy rule extraction has not been justified or designed. |
| Persistence | None | No recovery, migration, distributed ownership, or long-term audit trail. |

## Highest architectural risk

The most important consolidated risk is the **implicit identity/reference schema**. Forked Fates' correctness claim depends on causal graph closure and branch isolation. Today that graph is thoroughly example-tested, but its schema is encoded across object construction and handwritten remapping logic. This is the first issue to address before production evolution or Phase 8 introduces more consumers of causal references.

The production-focused answer is expanded in [ENGINEERING_ASSESSMENT.md](ENGINEERING_ASSESSMENT.md).
