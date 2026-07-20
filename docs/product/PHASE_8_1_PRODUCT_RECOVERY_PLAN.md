# Phase 8.1 — AI Live Product Recovery Plan

**Document status:** Binding Phase 8.1 product recovery plan.

## Purpose

Convert the current Phase 8 technical prototype into an honest, demo-ready AI-driven narrative simulation.

The current architecture, World Engine, timeline fork system, integrity validation, deterministic fallback, and recorded demo remain valuable. This phase must replace the missing live intelligence layer and redesign the user experience around a visible story rather than a debugging dashboard.

---

## Product Decision

The product will support three clearly separated modes:

1. **AI Live Simulation**
   - Real model calls.
   - Dynamic per-character reasoning.
   - New decisions generated from current owned state.
   - No silent fallback to deterministic behavior.

2. **Deterministic Simulation**
   - Existing rule-based policies.
   - Used for tests, debugging, reproducibility, and offline fallback.
   - Never presented as the primary AI experience.

3. **Recorded Demo**
   - Precomputed interactive playback.
   - Used as the reliable competition/demo fallback.
   - Clearly described as recorded data, not a video and not a live model run.

`The Last Antidote` remains the only implemented scenario in this phase.

User-created scenarios are the product vision and roadmap, not a feature that will be falsely claimed as complete.

---

## Non-Negotiable Requirements

- World Engine remains the sole authoritative state resolver.
- Each character receives only its owned state.
- Real model output must use a strict structured decision schema.
- Model output must be validated before World Engine sees it.
- Invalid output must retry or fail visibly.
- AI Live must never silently switch to deterministic decisions.
- Original and Alternate timelines remain isolated and immutable.
- The entire page must not auto-scroll during turn execution.
- The primary interface must show a visible 2D world, not only text cards.
- Comparison must distinguish meaningful changes from evidence-only changes.
- The public UI must not expose unexplained internal demo controls.

---

# Execution Order

## Stage 0 — Protect the Current Baseline

### Goal
Preserve the verified Phase 8 implementation before changing it.

### Actions
- Start from the existing `phase-8-D2-demo-ready-product` tag.
- Create a new branch:
  - `phase-8.1-ai-live-ux-recovery`
- Confirm all existing tests pass before modification.
- Preserve current protected runtime behavior unless a planned interface change is explicitly required.
- Keep the current recorded demo independently executable.

### Exit condition
The recovery work is isolated from the verified Phase 8 baseline.

---

## Stage 1 — Implement Real LLM Character Decisions

### Goal
Make `AI Live Simulation` genuinely model-driven.

### Backend
Add a minimal local backend/proxy so API keys never enter browser code.

Use provider-agnostic OpenAI-compatible configuration:

- `AI_PROVIDER_BASE_URL`
- `AI_PROVIDER_API_KEY`
- `AI_MODEL`
- `AI_REQUEST_TIMEOUT_MS`
- optional generation settings

Provide `.env.example` without secrets.

### Character request
Each character request must contain only:

- character identity and traits;
- goals;
- current location;
- owned memories;
- owned beliefs;
- directed trust values available to that character;
- owned inventory;
- current relevant observations;
- legal actions;
- scenario-level rules the character is allowed to know.

### Structured response
Require a strict response similar to:

```json
{
  "actionType": "move | speak | investigate | transfer | use | wait",
  "targetId": "string-or-null",
  "locationId": "string-or-null",
  "content": "string-or-null",
  "rationale": "short explanation",
  "goalServed": "goal id",
  "citedMemoryIds": ["memory-id"],
  "confidence": 0.0
}
```

The exact schema must match the existing World Engine intent contract.

### Validation
- Parse strict JSON.
- Reject unsupported actions.
- Reject inaccessible memories.
- Reject illegal targets and locations.
- Reject fabricated items.
- Retry a limited number of times with validation feedback.
- On final failure, stop the turn and show a visible error.
- Do not replace the failed output with a deterministic policy.

### Turn execution
- Generate the four character decisions in parallel.
- Resolve the turn only after all four valid intents exist.
- Pause and Run operate only at completed turn boundaries.
- Stop early when a terminal outcome is reached.
- Keep 12 turns as the maximum, not a requirement to always execute all 12.

### Required tests
- Owned-state privacy for every character.
- Real-provider adapter with mocked HTTP responses.
- Invalid JSON retry.
- Illegal action rejection.
- Timeout and provider failure.
- No silent deterministic fallback.
- Four intents collected before resolution.
- Intervention state is visible to the correct agents after a fork.

### Exit condition
A user can run AI Live and confirm that real provider calls generate the decisions.

---

## Stage 2 — Repair Alternate Divergence and Comparison Truthfulness

### Goal
Make Alternate branches meaningful and honestly represented.

### Required changes
- Verify the intervention is applied at the selected completed boundary.
- Verify subsequent AI agents receive the modified state.
- Preserve all shared history before the fork.
- Preserve Original immutability.
- Keep Alternate isolated.

### Comparison categories
Do not use one generic `changed intent` category.

Classify differences as:

- action changed;
- target changed;
- rationale changed;
- goal changed;
- evidence or cited memory changed only;
- world event changed;
- trust changed;
- belief changed;
- inventory changed;
- treatment or antidote path changed;
- terminal outcome changed;
- no meaningful visible divergence.

### UI language
When only evidence differs, show:

- `Same action, different evidence considered`

When the visible story does not change, show:

- `This intervention changed internal context but did not alter the visible story.`

### Divergence guidance
For each forkable turn, show remaining horizon:

- `High opportunity for divergence`
- `Moderate opportunity for divergence`
- `Limited opportunity — only 2 turns remain`

Do not promise that every intervention must change the final outcome. A logically ineffective intervention is allowed, but the product must explain it honestly.

### Demo requirement
Find and verify one legal intervention path that creates a clear visible difference in:

- at least one character action;
- at least one resulting event;
- and preferably treatment, trust, antidote path, truth, social state, or terminal outcome.

Do not change World Engine rules merely to force a dramatic demo.

### Exit condition
Original and Alternate never appear as copied timelines when their only difference is hidden evidence.

---

## Stage 3 — Rebuild the Main Experience Around a 2D Story World

### Goal
Make the product feel like a narrative simulation rather than a technical dashboard.

### Visual world
Create a lightweight 2D scene containing:

- the three scenario locations;
- a distinct portrait or illustrated avatar for each character;
- Niko and patient status;
- current character placement;
- antidote/item location;
- visible environmental state;
- lightweight movement between locations.

A full game engine is not required.

Use stable local assets, SVG, or lightweight illustrated images. Do not rely on remote runtime images.

### Primary information hierarchy
The main view should answer at a glance:

1. Where is everyone?
2. What important event just happened?
3. What changed?
4. What is the patient state?
5. Where is the antidote?
6. What can the user do next?

### Turn presentation
Default presentation:

- one short narrative turn summary;
- compact one-line character actions;
- visible movement and event indicators.

Detailed reasoning is secondary and opens only after selecting a character or event.

### Inspector
Keep technical depth, but behind progressive disclosure:

- rationale;
- goals;
- beliefs;
- memories;
- trust;
- cited evidence;
- raw event details.

### Exit condition
A first-time user can follow the story without reading four full decision cards per turn.

---

## Stage 4 — Fix Layout, Scrolling, and Controls

### Stable workspace
- Whole-page automatic scrolling is forbidden during turn execution.
- Keep primary world view and playback controls visible.
- Give Timeline and Inspector independent internal scrolling.
- New events may auto-follow only inside Timeline.
- Do not steal browser focus.

### Follow control
Add:

- `Follow live events: On / Off`

When Off, preserve the user’s selected historical event while simulation continues.

### Playback controls
Use clearer labels:

- `Next Turn`
- `Run to End`
- `Pause`

Helper text:

- Next Turn: `Resolve one decision round and stop.`
- Run to End: `Continue automatically until paused or completed.`
- Pause: `Stop after the current turn finishes.`

State-aware behavior:

- Pause disabled unless auto-running.
- Next Turn disabled while resolving or auto-running.
- Run disabled while resolving.
- Show status:
  - `Ready at Turn 3`
  - `Resolving Turn 4…`
  - `Auto-running`
  - `Paused after Turn 4`
  - `Simulation complete`

### Exit condition
The user never needs repeated whole-page scrolling to operate or understand the simulation.

---

## Stage 5 — Clarify Start, Fork, and Intervention UX

### Start screen
Replace ambiguous labels.

Recommended:

- `Start AI Live Simulation`
- `Explore Recorded Demo`

Also expose deterministic mode separately under an advanced or developer-oriented path, not as the primary experience.

### Mode identity
Every screen must prominently show the active mode:

- AI Live
- Deterministic
- Recorded

### Fork eligibility
Show fork eligibility directly on Timeline turns.

Examples:

- `Fork available`
- `Fork unavailable: terminal turn`
- `Fork unavailable: Alternate already exists`
- `Limited opportunity — 2 turns remain`

The user must not click turns one by one to discover eligibility.

### Intervention explanation
For Information, Item Transfer, and Environmental Event, explain:

- what the category changes;
- which options come from current world state;
- why an option is disabled;
- what the selected character will newly know or observe.

### Internal demo shortcut
Remove `Use approved demo intervention` from normal product mode.

Expose it only behind a demo/developer flag, or rename it clearly:

- `Load competition demo setup`

Always show why it is unavailable.

### Exit condition
A new user understands modes, playback, fork eligibility, and interventions without external explanation.

---

## Stage 6 — Verification and Demo Readiness

### Automated verification
Run:

- syntax checks;
- all existing regression tests;
- new provider and UI behavior tests;
- branch isolation tests;
- comparison classification tests;
- viewport and scrolling tests;
- reduced-motion and keyboard tests.

### Manual verification
Test at minimum:

- desktop;
- 375px mobile viewport;
- AI provider success;
- invalid model response;
- provider timeout;
- deterministic mode;
- recorded mode;
- Original completion;
- early fork;
- late fork;
- visibly divergent Alternate;
- ineffective intervention;
- Pause during Run;
- Follow live events On and Off.

### Demo narrative
The demo must truthfully state:

#### Implemented now
- one complete scenario;
- real AI-driven character decisions;
- private per-character context;
- causal World Engine;
- interventions;
- timeline forks;
- comparison and causal explanation;
- recorded fallback.

#### Product vision
- users create their own scenario;
- AI generates or configures characters and worlds;
- users watch, play, intervene, and fork those stories.

Recommended vision sentence:

> The Last Antidote is our first playable proof of concept. Our larger vision is a creator platform where anyone can describe a scenario, generate its characters and world, and then watch, influence, and fork an AI-driven story as it unfolds.

### Exit condition
The product is technically honest, visually understandable, and has one verified compelling demo path.

---

# Explicitly Deferred

Do not implement these before the recovery phase is complete:

- full user scenario editor;
- arbitrary scenario import;
- automatic visual asset generation at runtime;
- accounts;
- cloud persistence;
- public scenario library;
- collaborative multiplayer;
- general-purpose game engine;
- multiple additional scenarios.

These remain roadmap items.

---

# Final Definition of Done

Phase 8.1 is complete only when all statements below are true:

- AI Live makes real model calls.
- No silent deterministic fallback exists in AI mode.
- Each character sees only its own allowed state.
- The world remains authoritative and validates decisions.
- The page does not jump or auto-scroll during turns.
- Characters and locations are visibly represented in 2D.
- Users can follow the story without reading every full agent rationale.
- Forkable turns are obvious.
- Playback controls explain themselves.
- Alternate comparison does not mislabel memory-only differences as changed decisions.
- At least one tested fork produces a clear visible causal divergence.
- Recorded Demo remains available as an independent fallback.
- The demo clearly distinguishes implemented functionality from long-term vision.
