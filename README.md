# Forked Fates

Forked Fates is a causal narrative sandbox: change one character's information, then inspect how decisions and outcomes diverge. The included scenario, **The Last Antidote**, follows four autonomous characters, three locations, one missing antidote, and a twelve-turn deadline.

The project was built to make AI-driven stories auditable. Models choose legal character intents from private, character-owned context; validators enforce the contract; an authoritative World Engine alone decides consequences and state changes.

## What you can run

- **Start AI Live** — four provider-backed character agents receive separate owned-state projections and each return one intent per turn. The product supports Cerebras, OpenRouter, and conservative OpenAI-compatible endpoints.
- **Explore Demo** — immutable, precomputed Recorded playback. It needs no API key and remains independent of the World Engine and AI stack.
- **Advanced / Testing Modes → Deterministic Simulation** — offline autonomous agents driven by fixed policies for exact, reproducible verification and the recommended fork demo.

Both simulation modes can fork one completed, eligible boundary, apply one typed Information, Item Transfer, or Environmental intervention, run an isolated Alternate, and compare observable causal differences with the immutable Original.

## Why it matters

Most generative story demos hide the connection between context, decision, and consequence. Forked Fates keeps those concepts separate:

- facts, claims, beliefs, memories, and hidden truth are distinct;
- each NPC sees only its own private state and witnessed information;
- completed turns are atomic and frozen;
- every authoritative state transition is represented by a World event;
- the Original never changes when an Alternate is created;
- comparison distinguishes changed actions, evidence, events, locations, trust, and outcomes.

## Architecture at a glance

```text
Recorded data ───────────────────────────────> Recorded presentation

Scenario ─> World Engine <─ validated intents <─ Decision Layer <─ Provider
                ^                                      ^
                │                                      └─ owned projection per NPC
        typed intervention
                ^
         Timeline Fork Engine ─> isolated Alternate

Frozen timelines ─> view models / comparison ─> browser presentation
```

The source tree mirrors these responsibilities. The Recorded path is deliberately independent. In the simulation path, the World Engine is the sole authority for state, events, memories, beliefs, trust, inventory, patient state, and outcomes. Presentation code only derives views from frozen data.

Read the full [system architecture](docs/architecture/SYSTEM_ARCHITECTURE.md) and the [demo guide](docs/demo/DEMO_GUIDE.md).

## Requirements

- Node.js 18 or newer (Node 20+ recommended)
- A modern browser
- No npm dependencies and no build step
- An API key only for AI Live; Explore Demo and Deterministic Simulation are offline

Do **not** run `npm install`; the repository intentionally has no dependency manifest beyond its scripts.

## Setup and run

### Windows PowerShell

```powershell
git clone <repository-url>
Set-Location Forked-Fates
Copy-Item .env.example .env
notepad .env
npm.cmd start
```

### macOS or Linux

```bash
git clone <repository-url>
cd Forked-Fates
cp .env.example .env
${EDITOR:-vi} .env
npm start
```

Open [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

For **Explore Demo** or **Deterministic Simulation**, you may skip copying `.env`; start the server and choose the corresponding mode.

## AI Live configuration

The tracked `.env.example` contains placeholders only. The successful AI Live configuration used OpenRouter:

```env
AI_PROVIDER_TYPE=openrouter
AI_PROVIDER_BASE_URL=https://openrouter.ai/api/v1
AI_PROVIDER_API_KEY=
AI_MODEL=google/gemma-4-26b-a4b-it

AI_STRUCTURED_OUTPUT_MODE=json_schema
AI_REASONING_ENABLED=true
AI_REASONING_EFFORT=medium
AI_DIAGNOSTIC_LOGGING=true

AI_MAX_OUTPUT_TOKENS=800
AI_INPUT_TOKEN_WARNING=6000
AI_REQUEST_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
PORT=8080
```

Configuration variables:

| Variable | Purpose |
|---|---|
| `AI_PROVIDER_TYPE` | `cerebras`, `openrouter`, or `generic-openai` |
| `AI_PROVIDER_BASE_URL` | Provider API base URL; endpoint joining is normalized by the server |
| `AI_PROVIDER_API_KEY` | Local secret used only by the Node server |
| `AI_MODEL` | Provider model identifier |
| `AI_STRUCTURED_OUTPUT_MODE` | `json_schema` or `json_object`; the successful OpenRouter path uses strict `json_schema` |
| `AI_REASONING_ENABLED` | Enables provider-specific reasoning configuration without returning chain-of-thought |
| `AI_REASONING_EFFORT` | Requested reasoning effort; accepted values depend on provider |
| `AI_DIAGNOSTIC_LOGGING` | Emits safe metadata only—never keys, prompts, or private projections |
| `AI_MAX_OUTPUT_TOKENS` | Provider output limit |
| `AI_INPUT_TOKEN_WARNING` | Diagnostic warning threshold for estimated input usage |
| `AI_REQUEST_TIMEOUT_MS` | Per-request timeout |
| `AI_MAX_RETRIES` | Bounded transport/output retries |
| `PORT` | Local loopback server port |

Cerebras remains available as an optional compatible provider. Provider secrets stay in the local Node process and are never sent to browser code or stored in timelines.

## Quick walkthrough

### Explore Demo — no API key

1. Choose **Explore Demo**.
2. Advance the immutable Recorded Original with **Next Turn**, or use **Run to End**.
3. Select a historical turn, character, or event to inspect its authored rationale, owned memories, and observable consequences.
4. Use the Forked Fates brand control to return to Start.

The Recorded data in `src/data/recorded-data.js` is bundled sample data: authored, immutable, and independently executable. It is not generated live and is not derived from the World Engine.

### AI Live

1. Configure `.env` and choose **Start AI Live**.
2. Resolve a turn. Four independent model calls must validate before one atomic World resolution.
3. Inspect a character to see only that character's owned memories, beliefs, trust, inventory, observations, previous action, and authoritative result.
4. Fork an eligible completed turn, add one intervention, continue the Alternate, then compare completed branches.

Invalid model output or provider failure is reported visibly. The application never silently substitutes deterministic decisions.

### Deterministic fork demo

1. Expand **Advanced / Testing Modes** and choose **Deterministic Simulation**.
2. Run the Original to completion.
3. Select Turn 0 and fork.
4. Apply Information to Mara: “The empty case was opened with the spare Clinic key,” confidence 90.
5. Run the Alternate and open Comparison.

The exact repeatable presenter path is in [docs/demo/DEMO_GUIDE.md](docs/demo/DEMO_GUIDE.md).

## Verification

Run the exact submission checks from the repository root:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run demo:search
```

On macOS or Linux, use `npm run check`, `npm test`, and `npm run demo:search`.

- `check` parses every production and support JavaScript file.
- `test` runs the complete Node test suite, including privacy, provider schemas, deterministic replay, causal integrity, intervention, forking, comparison, and presentation behavior.
- `demo:search` recomputes the strongest deterministic intervention candidate and reports its observable divergence score.

Tests use local mocks and deterministic data; they do not require a paid provider call.

## Project structure

```text
.
├── index.html                 # Browser entry point
├── styles.css                 # Complete visual system
├── assets/                    # Local original SVG portraits, locations, patient, item
├── src/
│   ├── adapters/              # Deterministic and asynchronous AI session boundaries
│   ├── ai/                    # Decision validation, providers, projections, NPC policies
│   ├── config/                # Reproducible demo configuration
│   ├── data/                  # Scenario and immutable Recorded sample data
│   ├── engine/                # World, intervention, integrity, and fork authority
│   ├── presentation/          # View models, comparison, and browser controllers
│   └── server/                # Loopback static server and provider proxy
├── scripts/                   # Demo search and local mock provider
├── tests/                     # Complete behavior and architecture suite
└── docs/
    ├── architecture/          # Current system architecture
    └── demo/                  # Judge-facing walkthrough
```

## AI-assisted development

Codex, using GPT-5.6 Sol, was used for implementation, debugging, refactoring, test construction, provider compatibility, repository cleanup, and verification.

GPT-5.6 was also used for product reasoning, architecture and contract review, causal analysis, UX evaluation, debugging guidance, and submission planning. GPT-5.6 Sol was used only during development; it is not a runtime dependency and does not make in-product character decisions.

AI assistance was validated through contract tests, immutable replay hashes, owned-state privacy tests, corruption tests for causal references, deterministic reruns, full-suite regression checks, and browser smoke testing. Generated suggestions were not treated as authoritative: the checked-in source, World rules, tests, and documented verification results are the evidence.

## Security notes

- `.env` and all variants except `.env.example` are ignored.
- API keys remain server-side and are never exposed by the configuration endpoint.
- The server binds to loopback, validates request envelopes, limits request bodies, normalizes provider endpoints, and blocks path traversal and `.env` retrieval.
- Provider diagnostics exclude keys, prompts, private projections, raw responses, and private chain-of-thought.
- AI Live is a local demo service, not an authenticated or multi-tenant production deployment.

## Current limitations

- One hard-coded scenario, exactly four NPCs, three locations, one antidote, and at most twelve turns.
- One Alternate and one intervention; no nested forks, merge, undo, or multiple Alternates.
- No persistence, import/export, authentication, tenancy, managed secret store, or scenario creator.
- AI Live outcomes are nondeterministic; World validity and information boundaries are guaranteed, exact story parity is not.
- Provider limits, cost controls, cancellation propagation, and durable telemetry are not production-grade.
- The framework-free World and presentation modules are intentionally large and protected by extensive tests.

The broader creator-platform idea—authoring new worlds and characters—is a roadmap direction, not an implemented feature.
