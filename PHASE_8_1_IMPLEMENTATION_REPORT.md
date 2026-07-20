# Phase 8.1 AI Live Product Recovery — Implementation Report

## Release identity

- Baseline tag: `phase-8-D2-demo-ready-product`
- Baseline checkpoint: `736b271`
- Repository difference at start: `master` was at `9abcc9a`, one hygiene-only `.gitignore` commit after the approved tag.
- Working branch: `phase-8.1-ai-live-ux-recovery`
- Final tag: `phase-8.1-D5-ai-live-demo-ready`
- Final D5 commit: the commit referenced by the final tag.

## Checkpoints and files

| Stage | Commit | Principal files |
|---|---|---|
| D0 baseline | `e4aa6a9` | `.gitignore`, `docs/product/*` recovery requirements |
| D1 AI Live | `325a0b2` | `.env.example`, `server.js`, `ai-live-provider.js`, `ai-decision-layer.js`, `ai-live-session-adapter.js`, presentation integration, `tests/ai-live.test.js` |
| D2 truthfulness | `3327e89` | `branch-comparison.js`, `fork-guidance.js`, demo search, comparison presentation, `tests/comparison-truthfulness.test.js` |
| D3 narrative world | `76c6188` | nine local SVG assets, `live-view-models.js`, narrative presentation/styles, `tests/narrative-world.test.js` |
| D4 interaction | `7aa0045` | Recorded/Live controls, stable workspace scrolling, follow mode, intervention UX, `tests/workspace-ux.test.js` |
| D5 release | final tag | responsive/browser fixes, local provider fixture, README, demo path, architecture/debt/index updates, this report |

## Requirement closure

| Product issue | Resolution |
|---|---|
| P0 real AI agents | Four actor-owned requests run concurrently through an OpenAI-compatible server transport; all four validate before unchanged World resolution; failure never invokes deterministic policy. |
| P0 whole-page scrolling | Desktop workspace is fixed to the viewport; World, Timeline, and Inspector own contained scroll regions. Browser measurements remained `scrollY=0` and document height equaled viewport height across turn execution. |
| P0/P1 visual identity | Local original portraits, Niko, antidote, and three location illustrations now drive an authoritative current-story view with four compact action summaries. |
| P0 branch credibility | Decision changes are classified field-by-field; evidence-only differences are not action changes; visible and internal-only divergence are distinguished. |
| P1 mode clarity | Start and subsequent screens identify AI Live, Deterministic, and Recorded modes explicitly. Recorded is described as precomputed playback, never a video. |
| P1 fork guidance | Every Original turn shows eligibility, reason, remaining opportunity, and qualitative divergence horizon. |
| P1 intervention clarity | Information, Item Transfer, and Environmental categories explain effects and legal constraints. The canned shortcut is hidden unless `?demo=1`. |
| P1 playback clarity | `Next Turn`, `Run to End`, `Pause`, exact tooltips, state-aware disabling, and explicit status labels are consistent across modes. |
| P1 creator vision | README truthfully limits the current product to The Last Antidote and labels scenario creation as roadmap only. |

## Architecture decisions

1. **Preserve the authority boundary.** `world-engine.js` was not changed. AI Live produces the existing intent contract and World remains the only authoritative resolver.
2. **Add, do not replace, session paths.** Recorded playback remains direct authored-data presentation. Deterministic uses the approved provider/policy stack. AI Live uses a separate asynchronous adapter and decision coordinator beside them.
3. **Keep secrets on loopback server.** The dependency-free Node server reads `.env`, serves static assets, exposes same-origin redacted configuration/decision routes, and makes the provider call. Browser code never receives the key or provider URL.
4. **Reuse Decision validation.** AI candidates are parsed with `decision.parseAgentOutput` and accepted with `decision.validateCandidate`; no competing action model was created.
5. **Atomic parallel turns.** Four independent provider calls use `Promise.all`. World resolution happens once, after exactly four valid intents. Any failure leaves the frozen completed boundary intact.
6. **Pure presentation derivation.** Story summaries, action lines, state deltas, and comparison categories derive from immutable authoritative events/state. Presentation does not infer World truth.
7. **No framework addition.** Node built-ins, existing UMD/CommonJS modules, local SVG, CSS, and browser-native APIs remain sufficient for the bounded product.

## Provider contract

Browser request protocol: `forked-fates-decision-provider-v1`.

Each request contains:

- `actorId`, attempt number, output contract, and validation feedback;
- one allowlisted owned projection: actor identity/traits/goals, current location, public character identities, co-located observations, owned beliefs/trust/inventory, legal options, and at most six available owned memories.

It excludes authoritative hidden truth, foreign beliefs/memories/inventory, remote unwitnessed events, unpublished intents, and other branch state.

The provider must return one JSON object with `id`, `actorId`, `action`, `chosenAtTurn`, `servedGoalId`, `rationale`, `citedMemoryIds`, and only action-legal fields. Validation rejects malformed JSON, wrong actor/turn, illegal action/target/location/item, fabricated identity, inaccessible memory, foreign goal, extra fields, and invalid action-specific content.

Server transport uses `${AI_PROVIDER_BASE_URL}/chat/completions`, optional bearer authentication, configured model, `AbortController` timeout, bounded transport/output retry, and automatic retry without `response_format` when a compatible provider rejects it.

## Security measures

- `.env` and variants are ignored; only `.env.example` is tracked.
- Provider base URL/key stay in the Node process and are absent from browser globals, storage, snapshots, timelines, and logs.
- Server binds to `127.0.0.1` by default.
- Decision route permits POST only; configuration route permits GET only.
- JSON bodies are limited to 128 KiB.
- Request envelopes and projection top-level fields are allowlisted; forbidden private/world fields are rejected.
- Responses use structured error codes and do not echo headers, keys, or full prompts.
- Static path traversal and `.env` retrieval are rejected.
- CSP, `nosniff`, and no-referrer headers are set.
- Rendered provider/domain strings pass existing HTML escaping.

This is not a production authentication, tenancy, quota, or managed-secret boundary; see Technical Debt.

## Verification results

Final run on 2026-07-20:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run demo:search
```

- Syntax check: passed for every production, adapter, comparison, presentation, search, and mock-provider JavaScript file.
- Automated tests: **134 passed, 0 failed, 0 skipped** across 12 suites.
- Demo search: passed; the Turn 0 Mara spare-key evidence candidate ranked first with score 193, 29 meaningful intent changes, 6 evidence-only differences, 12 resulting-event changes, 8 visible causal difference categories, and 4 trust changes.
- No automated test requires a network service or external API.

Coverage added in Phase 8.1:

- 10 AI/provider/privacy/atomicity tests;
- 6 comparison/fork-guidance tests;
- 4 narrative-world/local-asset tests;
- 7 workspace/playback/intervention/responsive/error tests.

## Manual browser verification

Verified in the local product:

- desktop workspace at 1280-class width and explicit 375 × 812 responsive viewport;
- no horizontal overflow at 375px after the responsive fix;
- provider-backed AI Live with a configured local OpenAI-compatible HTTP endpoint;
- exactly four successful HTTP decisions (`mara`, `dain`, `sera`, `orin`) for Turn 1, followed by one World-resolved boundary;
- missing provider configuration with explicit return/Recorded recovery;
- invalid model output labeled `Invalid model response`, after retry exhaustion and before World mutation;
- timeout labeled `AI provider error`, with the prior boundary frozen;
- Deterministic Simulation and independent Recorded Demo;
- Next Turn, Run to End, Pause after a completed turn, and terminal auto-stop;
- Follow live events On and Off, including preserved Turn 0 selection while the frontier advanced;
- desktop turn execution with `scrollY=0`, `document.scrollHeight=720`, and `innerHeight=720`;
- Original completion, early Turn 0 fork, late Turn 9 fork, typed intervention, and Original immutability;
- visibly divergent Turn 0 Alternate and truthful late ineffective intervention messaging;
- comparison showing Exposed → Obscured, Orin → Sera antidote possession, trust differences, and authoritative versus comparison-only links;
- responsive local 2D world with three locations and four character portraits.

The configured-provider browser proof used the committed local OpenAI-compatible fixture so verification required no secret or paid call. No public third-party LLM credential was available, so no paid/public-provider inference was performed. The same production transport path and contract were exercised over HTTP; a user can point `.env` at any compatible provider.

## Immutable Original and Recorded proof

Protected files remain byte-for-byte unchanged from the approved Phase 8 checkpoint:

| File | SHA-256 |
|---|---|
| `recorded-data.js` | `365e724d551eab0e78299e70e748616f667815b34c92cb033f0e0b2b88065a62` |
| `world-engine.js` | `06122c845a42f4711ddbd997c6c399d56feadad83e062b97376a841bed6d480d` |
| `decision-layer.js` | `e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155` |
| `decision-providers.js` | `b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f` |
| `npc-agents.js` | `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704` |

The deterministic Original serialized SHA-256 remains `6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f`. Existing hash, replay, parity, branch-isolation, and Recorded tests all pass. Browser verification entered Recorded Demo and used Next Turn/Run controls without provider configuration or simulation dependencies.

## Exact run commands

```powershell
Set-Location F:\Hackaton
Copy-Item .env.example .env
notepad .env
npm.cmd start
```

Open `http://127.0.0.1:8080/`.

## Selected deterministic demo path

- Mode: Deterministic Simulation at `/?demo=1` for an exact repeatable competition path.
- Fork: completed Turn 0.
- Intervention: Information → Mara → `fact-case-spare-key` → confidence 90.
- First visible action difference: Mara Investigate → Move at Turn 1.
- Visible consequences: later events/locations diverge, four trust relationships change, antidote holder changes Orin → Sera, Truth changes Exposed → Obscured.
- Full script: `docs/DEMO_PATH.md`.

## Known limitations and intentional debt

- One hard-coded scenario, four NPCs, three locations, one antidote, at most twelve turns.
- One Alternate, one intervention, no nested forks, merge, undo, or persistence.
- No scenario creator; it remains roadmap only.
- Provider proxy is loopback/local-demo infrastructure, not authenticated multi-tenant production infrastructure.
- No provider cost/token budgets, cancellation propagation, structured telemetry, model provenance in persisted histories, or managed secret store.
- No durable storage, canonical migration format, crash recovery, or import/export.
- AI output is nondeterministic; exact outcome parity is not promised for AI Live. World validity and information boundaries remain mandatory.
- Deterministic bulk Original/Alternate preparation is synchronous; this is acceptable at current scale but not a general scaling solution.
- The World and presentation modules remain large framework-free files. They were not speculatively refactored because their current boundaries and tests are stable.
- Local mock-provider decisions intentionally choose legal `Wait` actions for transport verification only; the fixture is never a runtime fallback.

## Explicitly not completed

- A live inference call to a public third-party model was **not** performed because no credential was available.
- User-created scenario generation, persistence, authentication/tenancy, multiple Alternates, nested forks, merge, and undo are **not implemented**, by scope.
- No claim is made that this local release is production-ready for untrusted internet traffic.
