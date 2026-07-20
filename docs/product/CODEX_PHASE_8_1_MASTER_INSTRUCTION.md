# Codex Master Instruction — Phase 8.1 AI Live Product Recovery

You are the technical lead responsible for completing Phase 8.1 of the Forked Fates project in the current repository.

Do not only analyze, propose, or write a plan. Inspect the existing codebase and implement the work end to end.

## Source of truth

Before changing code, read these two files completely:

1. `docs/product/FORKED_FATES_PRODUCT_ISSUES_TRACKER.md`
2. `docs/product/PHASE_8_1_PRODUCT_RECOVERY_PLAN.md`

Treat them as binding product requirements. Do not silently omit any P0 or P1 issue. When a detail in this instruction conflicts with those files, use the safer interpretation and document the decision in the final implementation report.

Also read:

- `AGENTS.md`
- `README.md`
- `ARCHITECTURE.md`
- `SYSTEM_DIAGRAM.md`
- `TECHNICAL_DEBT.md`
- `VERIFICATION_INDEX.md`
- the current `package.json`
- all current runtime, provider, fork, comparison, presentation, and test code

## Operating rules

- Do not ask the user to choose architecture or implementation details.
- Make the smallest robust decisions that fit the existing repository.
- Do not restart the project or replace the existing architecture.
- Preserve the World Engine as the sole authoritative resolver.
- Preserve Original immutability and Alternate isolation.
- Preserve the independent Recorded Demo.
- Do not implement the general scenario creator in this phase.
- Do not falsely claim that user-created scenarios already exist.
- Do not add a large framework merely for convenience.
- Prefer the existing stack and browser-native or Node-native capabilities.
- Do not expose API keys in frontend code, browser storage, logs, snapshots, or commits.
- Do not silently fall back to deterministic character policies when AI Live fails.
- Do not modify rules simply to force a dramatic Alternate result.
- Do not stop after one milestone. Continue through all stages unless a genuine technical blocker makes further implementation impossible.
- Keep all pre-existing untracked user files safe. Never delete or overwrite them without a clear necessity.
- Commit each completed checkpoint separately.

---

# Stage 0 — Baseline protection and repository hygiene

1. Inspect:
   - current branch;
   - current HEAD;
   - tags;
   - remotes;
   - tracked and untracked changes.

2. Confirm the Phase 8 baseline corresponds to:
   - tag `phase-8-D2-demo-ready-product`
   - expected checkpoint commit `736b271`, or explain any repository difference.

3. Run all current verification before editing:
   - `npm run check`
   - `npm test`
   - `npm run demo:search`
   - any additional documented verification

4. Create and switch to:
   - `phase-8.1-ai-live-ux-recovery`

5. Add or correct `.gitignore` without removing legitimate source files. At minimum ignore:
   - `.env`
   - `.env.*` except `.env.example`
   - `node_modules/`
   - logs, temporary caches, editor metadata
   - local review ZIPs, patch files, status dumps, and local screenshot review folders when they are not intentional project documentation

6. Preserve the two requirements files in the repository. Prefer moving them to a clear documentation location only if all references are updated:
   - `docs/product/FORKED_FATES_PRODUCT_ISSUES_TRACKER.md`
   - `docs/product/PHASE_8_1_PRODUCT_RECOVERY_PLAN.md`

7. Commit checkpoint:
   - `phase-8.1 D0: protect baseline and add recovery requirements`

Do not continue if the existing baseline tests are already failing. Diagnose and restore the verified baseline first.

---

# Stage 1 — Real provider-backed AI character decisions

## Required product modes

Implement and clearly separate:

1. `AI Live Simulation`
   - real model calls;
   - dynamic decisions;
   - strict validation;
   - visible failure;
   - no silent deterministic fallback.

2. `Deterministic Simulation`
   - current rule-based policies;
   - reproducible;
   - for testing, debugging, and offline use;
   - clearly labeled as deterministic, not AI Live.

3. `Recorded Demo`
   - precomputed interactive playback;
   - no new model decisions;
   - clearly labeled as recorded/precomputed, not a video.

## Secure local server

Add the smallest secure local backend compatible with the current repository.

Preferred approach:
- use Node built-in modules if the repository does not already have a backend framework;
- avoid adding Express or another framework unless the repository already uses it or built-in Node would materially harm reliability.

The server must:

- serve the existing frontend or work cleanly with the existing local frontend workflow;
- expose a same-origin API route for character decisions;
- keep provider secrets server-side;
- reject unsupported methods and malformed payloads;
- apply request-size limits;
- return structured error responses;
- avoid logging API keys or full secret-bearing headers.

Add `.env.example` with no real secrets:

```env
AI_PROVIDER_BASE_URL=https://example-provider.invalid/v1
AI_PROVIDER_API_KEY=
AI_MODEL=
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
PORT=8080
```

Support OpenAI-compatible Chat Completions:

- endpoint: `${AI_PROVIDER_BASE_URL}/chat/completions`
- bearer authentication when a key exists
- configurable model
- timeout with `AbortController`
- limited retries for transport errors and invalid model output
- compatibility with providers that do not support `response_format`

Do not hardcode a paid provider. The user must be able to use a free OpenAI-compatible provider.

## Character privacy

For each character, construct an owned-state projection containing only information that character is allowed to know.

At minimum include only allowed:

- identity, role, and traits;
- goals;
- current location;
- owned memories;
- owned beliefs;
- directed trust values available to that character;
- owned inventory;
- current observations;
- legal actions and targets;
- scenario rules the character is allowed to know.

Never send the complete authoritative world state to every character.

Add tests proving that one character cannot receive another character’s private memories, beliefs, secrets, or hidden inventory.

## Decision contract

Reuse the existing intent schema wherever possible. Do not invent a competing action model.

The LLM response must be a single JSON object that maps cleanly into the existing intent contract. It must include the existing equivalents of:

- action type;
- target or location when relevant;
- concise content when relevant;
- short rationale;
- goal served;
- cited memory IDs;
- optional confidence.

The server and client must:

1. parse the model response;
2. extract one JSON object safely;
3. validate the shape;
4. validate cited memory ownership;
5. validate legal action, target, item, and location;
6. reject fabricated identifiers;
7. retry with concise validation feedback;
8. fail the turn visibly after retry exhaustion.

Do not replace a failed AI decision with a deterministic policy.

## Turn execution

- Request all four character decisions in parallel.
- Do not resolve the turn until all four valid intents exist.
- Resolve only through the existing World Engine.
- Keep turn boundaries atomic.
- `Pause` stops after the currently resolving turn.
- Stop automatically on terminal outcome.
- Keep 12 as the maximum number of turns, not a requirement to execute unnecessary turns after a terminal state.

## AI status UI

Show visible state:

- `Connecting to AI provider…`
- `Generating 4 character decisions…`
- `Validating decisions…`
- `Resolving Turn N…`
- `AI provider error`
- `Invalid model response`
- `Simulation complete`

When environment configuration is missing, AI Live must show a concise setup error and allow the user to return to the start screen. It may offer Deterministic or Recorded mode as explicit choices, but must not switch automatically.

## Required tests

Add deterministic automated tests using mocked provider responses for:

- successful four-character parallel generation;
- privacy of owned-state projections;
- invalid JSON and retry;
- illegal action rejection;
- inaccessible memory citation rejection;
- fabricated item/location/target rejection;
- timeout;
- HTTP failure;
- retry exhaustion;
- no silent fallback;
- world resolution only after four valid intents;
- intervention state reaching the appropriate agents after a fork.

Commit checkpoint:

- `phase-8.1 D1: add real AI live character decisions`

---

# Stage 2 — Alternate branch and comparison truthfulness

## Branch correctness

Verify with tests and runtime assertions:

- intervention applies exactly at the selected completed boundary;
- Original shared history remains unchanged;
- Alternate has a separate authoritative continuation;
- subsequent AI requests receive the changed Alternate state;
- Original is never mutated by Alternate execution;
- switching branches never changes stored snapshots.

## Difference classification

Replace the misleading generic intent-change behavior.

Classify decision differences as:

- action changed;
- target changed;
- content changed;
- rationale changed;
- goal changed;
- cited evidence changed only;
- no meaningful decision change.

Classify state/story differences as:

- event changed;
- location changed;
- trust changed;
- belief changed;
- memory changed;
- inventory changed;
- antidote path changed;
- patient/treatment state changed;
- truth outcome changed;
- social outcome changed;
- terminal outcome changed.

A cited-memory-only difference must not be presented as a changed action.

When action and rationale are identical but evidence differs, show:

- `Same action, different evidence considered`

and expose the relevant memory difference on demand.

## Ineffective interventions

After Alternate completes, calculate a transparent meaningful-divergence summary.

When internal state changed but no visible story difference occurred, display:

- `This intervention changed internal context but did not alter the visible story.`
- `Try an earlier turn or a different intervention.`

Do not imply that every valid intervention must change the ending.

## Fork horizon

On every Original timeline turn, visibly show:

- forkable or not forkable;
- reason when unavailable;
- remaining future turns;
- qualitative opportunity:
  - `High opportunity for divergence`
  - `Moderate opportunity for divergence`
  - `Limited opportunity — only N turns remain`

The user must not click turns one by one to discover fork eligibility.

## Demo path search

Create a deterministic development/test utility that searches existing legal interventions and identifies candidate paths with visible divergence. This utility must not modify runtime rules.

For the final demo candidate, verify at least:

- one visible action difference;
- one resulting event difference;
- a clear causal path;
- preferably a difference in trust, inventory, antidote path, treatment, truth, social state, or terminal outcome.

If real AI outputs are nondeterministic, record one successful AI Live run as the Recorded Demo fallback after verification, while keeping AI Live genuinely live.

Commit checkpoint:

- `phase-8.1 D2: repair alternate comparison and divergence feedback`

---

# Stage 3 — 2D narrative world and progressive disclosure

The current product is too close to a debugging dashboard. Rebuild the main presentation around a lightweight visible story world.

## Visual requirements

Create local, original, lightweight 2D visuals for:

- Mara;
- Dain;
- Sera;
- Orin;
- Niko;
- the clinic;
- the storehouse;
- the square;
- the antidote and important item state.

Use local SVG, CSS illustration, or other repository-contained assets. Do not require remote image loading at runtime. Avoid copyright-dependent assets.

Each character must have:

- distinct portrait/avatar;
- name and role;
- current location;
- recognizable visual identity;
- compact state or emotion indicator where supported by actual state.

Each location must have:

- visible identity;
- label;
- current occupants;
- relevant item/event indicators;
- visible state changes.

When characters move:

- animate or trace movement lightly;
- respect reduced-motion settings;
- do not scroll the whole page;
- update placement clearly.

## Information hierarchy

The primary view must answer without reading raw logs:

1. Where is each character?
2. What important event just happened?
3. What changed this turn?
4. What is Niko’s condition?
5. Where is the antidote?
6. What action can the user take next?

For each completed turn, show by default:

- one short narrative summary;
- compact one-line action for each character;
- movement/event indicators.

Full details remain available only after selecting a character or event:

- rationale;
- goals;
- beliefs;
- memories;
- trust;
- cited evidence;
- raw technical event data.

Do not remove the technical inspector. Make it secondary.

## Text generation

Turn summaries must be derived from authoritative resolved events, not invented independently by the UI.

Keep summaries concise and factual.

Commit checkpoint:

- `phase-8.1 D3: add visual narrative world and progressive disclosure`

---

# Stage 4 — Scrolling, layout, playback, start, fork, and intervention UX

## Stable workspace

Fix the critical scrolling problem:

- the document must not auto-scroll when a turn executes;
- the world view and primary controls must remain visible on desktop;
- Timeline must scroll internally;
- Inspector must scroll internally;
- new events may follow only inside Timeline;
- event creation must not steal page focus;
- expanding details must not unexpectedly move the document;
- preserve the user’s selected historical event while the simulation continues.

Add:

- `Follow live events: On / Off`

When Off, do not move the Timeline away from the user’s selected turn.

## Playback controls

Replace or supplement labels:

- `Step` → `Next Turn`
- `Run` → `Run to End`
- `Pause` remains `Pause`

Provide helper text or accessible tooltips:

- Next Turn: `Resolve one decision round and stop.`
- Run to End: `Continue automatically until paused or completed.`
- Pause: `Stop after the current turn finishes.`

State-aware controls:

- Pause disabled unless auto-running.
- Next Turn disabled while resolving or auto-running.
- Run disabled while resolving.
- All controls clearly disabled at completion when not applicable.

Show playback state:

- `Ready at Turn N`
- `Resolving Turn N…`
- `Auto-running`
- `Paused after Turn N`
- `Simulation complete`

## Start screen and mode identity

Use clear primary labels:

- `Start AI Live Simulation`
- `Explore Recorded Demo`

Expose `Deterministic Simulation` as a clearly labeled secondary/advanced mode.

Each subsequent screen must prominently show the active mode:

- AI Live
- Deterministic
- Recorded

Recorded Demo must never imply that it is a video.

## Intervention UX

For each category:

- Information;
- Item Transfer;
- Environmental Event;

show a plain-language explanation:

- what it changes;
- which options are legal at the selected turn;
- why unavailable options are disabled;
- what new fact, item, or observation enters Alternate.

Keep intervention categories structured and World Engine validated. Do not permit free text to bypass world legality in this phase.

## Internal demo shortcut

Remove `Use approved demo intervention` from normal product mode.

It may exist only behind an explicit development/demo flag. If retained:

- rename to `Load competition demo setup`;
- show exact availability conditions;
- visibly disable it when unavailable;
- always provide click feedback.

Commit checkpoint:

- `phase-8.1 D4: fix workspace and interaction clarity`

---

# Stage 5 — Verification, documentation, and final demo readiness

## Tests and checks

Run and pass:

- all original 107 tests or their updated equivalent;
- every new test added in this phase;
- `npm run check`;
- `npm test`;
- `npm run demo:search`;
- any new integration/unit scripts;
- static syntax checks;
- branch isolation tests;
- comparison classification tests;
- viewport/scroll tests;
- accessibility and reduced-motion checks.

No live external API call may be required for automated tests.

## Manual browser verification

Verify at minimum:

- desktop;
- 375px viewport;
- AI Live with a configured provider;
- missing provider configuration;
- invalid model response;
- timeout/provider failure;
- Deterministic Simulation;
- Recorded Demo;
- Next Turn;
- Run to End;
- Pause during Run;
- Follow live events On and Off;
- Original completion;
- early fork;
- late fork;
- ineffective intervention;
- clearly divergent Alternate;
- Original immutability;
- responsive 2D world;
- no whole-page jump during turn execution.

## Documentation

Update README with exact Windows PowerShell instructions:

1. copy `.env.example` to `.env`;
2. enter provider base URL, key, and model;
3. install only if dependencies actually exist;
4. start the secure local server;
5. open the local URL;
6. run checks and tests;
7. use Deterministic and Recorded modes without a provider.

Provide exact commands matching the final package scripts.

Document:

- mode differences;
- AI privacy boundary;
- provider configuration;
- failure behavior;
- fork/intervention flow;
- current one-scenario scope;
- user-created scenario vision as roadmap only.

Create:

- `PHASE_8_1_IMPLEMENTATION_REPORT.md`

The report must include:

- baseline commit/tag;
- branch;
- checkpoint commits;
- files changed by stage;
- architecture decisions;
- provider request/response contract;
- security measures;
- test counts and results;
- exact run commands;
- manually verified flows;
- known limitations;
- selected demo path;
- proof that Original remained immutable;
- proof that Recorded remained independently executable.

## Demo messaging

The product must truthfully communicate:

Implemented now:

- one complete scenario;
- real AI-generated per-character decisions;
- private character context;
- authoritative causal World Engine;
- interventions and timeline forks;
- comparison and causal explanation;
- deterministic and recorded fallbacks.

Vision:

> The Last Antidote is our first playable proof of concept. Our larger vision is a creator platform where anyone can describe a scenario, generate its characters and world, and then watch, influence, and fork an AI-driven story as it unfolds.

Do not claim that the scenario creator already exists.

## Final commit and tag

After all required verification passes:

- commit: `phase-8.1 D5: complete AI live demo-ready product`
- tag: `phase-8.1-D5-ai-live-demo-ready`

Do not create the final tag while tests are failing or P0 requirements remain incomplete.

---

# Final response required from Codex

At completion, return a concise but complete report containing:

1. current branch, final commit, and tag;
2. checkpoint commit list;
3. exact commands to configure and run the app on Windows PowerShell;
4. exact commands and results for all checks/tests;
5. how to verify that AI Live is making real provider calls;
6. one exact recommended demo path:
   - mode;
   - fork turn;
   - intervention;
   - visible causal differences;
7. remaining technical debt;
8. explicit list of anything not completed.

Do not describe unfinished work as completed.
