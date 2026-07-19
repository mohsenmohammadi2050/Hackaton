# Phase 8 Implementation Plan

## Objective

Deliver the demo-ready Live product experience without changing the approved World, Decision, Provider, NPC policy, Intervention, Fork, Integrity, Scenario, or Recorded data artifacts. Recorded playback remains an independently executable authored path; Live mode consumes authoritative World timelines only through a new presentation integration boundary.

## Preflight baseline

- Existing suite: 97/97 tests passing.
- Approved deterministic autonomous replay SHA-256: `6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f`.
- Protected runtime hashes were captured before implementation and will be asserted by Phase 8 tests.
- Presentation audit: the current `index.html`, `app.js`, and `styles.css` implement the complete Recorded Original only. They do not load or call World, Decision, Provider, Intervention, Fork, or Integrity modules.
- Repository note: preflight found one unrelated, pre-existing untracked file, `phase-7-1-validator-review.patch`. It will be preserved and excluded from all Phase 8 checkpoints.

## Integration boundary

Phase 8 adds three presentation-facing modules:

1. `live-session-adapter.js` is the only module the UI uses to create, advance, fork, intervene in, validate, and inspect a Live session. It delegates every authoritative mutation to the approved lower layers.
2. `live-view-models.js` converts immutable domain boundaries into display-safe branch, world, timeline, NPC, event, and outcome view models. It exposes no mutation surface and performs no World resolution.
3. `branch-comparison.js` is a pure, deterministic comparison function. It validates the complete session first, then derives shared-prefix, divergence, outcome, state-delta, antidote-path, and causal-support views from immutable Original and Alternate timelines.

The browser UI calls only the adapter and consumes view models. It never derives World state from Recorded data, never mutates domain objects, and never calls the World Engine or Decision Layer directly.

## Checkpoint A — Presentation integration boundary

- Add the adapter, view-model, and pure-comparison modules with CommonJS and browser exports.
- Add tests for frozen-boundary playback, projection safety, deterministic comparison, causal-support labeling, and failure handling.
- Update historical presentation-isolation tests to preserve the correct guarantee: Recorded data remains independent and Recorded mode remains usable when Live modules are unavailable.
- Preserve all protected file hashes and the approved deterministic replay hash.

Checkpoint name: `phase-8-D0-presentation-integration-boundary`.

## Checkpoint B — Live workspace and intervention journey

- Extend the Start and Briefing screens with a clear Recorded/Live mode choice.
- Add the Live workspace: three locations, animated NPC movement, boundary playback, timeline navigation, event and NPC inspectors, restart, progress, and resilient loading/error states.
- Add fork eligibility at completed turns 0–10 and a single typed intervention composer for Information, Item transfer, and Environmental event requests.
- Keep Original selectable and immutable after the Alternate is created; allow switching between Original and Alternate.
- Add a development-only deterministic search utility and commit one explicit approved demo configuration.

Checkpoint name: `phase-8-D1-live-fork-intervention-journey`.

## Checkpoint C — Comparison, accessibility, and demo hardening

- Add side-by-side branch outcomes, first divergence, changed events/intents, belief/trust/inventory/antidote deltas, and validated causal support.
- Distinguish authoritative causal edges from comparison-only decision-change links.
- Add keyboard-visible controls, ARIA status updates, reduced-motion support, responsive layout, fallback messaging, and recovery controls.
- Add `docs/DEMO_PATH.md`, Phase 8 verification evidence, and architecture-review updates.
- Run the complete automated suite, replay/hash checks, protected-file checks, and the browser demo on desktop and narrow viewports.

Checkpoint name: `phase-8-D2-demo-ready-product`.

## Verification strategy

- Unit tests: adapter, view models, comparison purity, config validation, and corrupted-session rejection.
- Regression tests: all 97 approved tests plus Phase 8 tests.
- Identity and integrity: every Live comparison requires `validateTimelineSession` success before derivation.
- Determinism: Original replay and approved alternate demo path run at least twice byte-identically.
- Immutability: protected hashes checked before and after; Original serialization checked before and after fork/intervention/alternate completion.
- Recorded independence: load the presentation without Live globals and complete the Recorded path.
- Manual browser: Start → Briefing → Live playback → fork → intervention → Alternate completion → branch comparison, plus Recorded fallback and responsive checks.

## Explicit non-goals

No World or policy changes, no direct state editing, no second or nested alternate, no merge/undo, no persistence, no external LLM transport, no hidden-truth reveal, no natural-language causal generation, and no Phase 9 work.
