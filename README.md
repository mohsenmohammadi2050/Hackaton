# Forked Fates

Forked Fates is a framework-free causal narrative sandbox. The included proof-of-concept scenario, **The Last Antidote**, follows four autonomous characters across at most twelve turns. You can run genuinely provider-backed AI decisions, use an offline deterministic simulation, explore the immutable precomputed Recorded Demo, fork one completed boundary, add one typed intervention, and compare the resulting causal futures.

## Run on Windows PowerShell

No npm dependencies or build step exist, so do not run `npm install`.

```powershell
Set-Location F:\Hackaton
Copy-Item .env.example .env
notepad .env
npm.cmd start
```

Create a Cerebras Inference API key in the [Cerebras Cloud console](https://cloud.cerebras.ai/), then set:

```env
AI_PROVIDER_TYPE=cerebras
AI_PROVIDER_BASE_URL=https://api.cerebras.ai/v1
AI_PROVIDER_API_KEY=your-cerebras-key
AI_MODEL=gpt-oss-120b
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

Open `http://127.0.0.1:8080/` and verify the AI Live workspace shows **Cerebras · gpt-oss-120b**. Provider secrets stay in the local Node process and are never sent to browser code or stored in timelines.

The [published Cerebras rate-limit table](https://inference-docs.cerebras.ai/support/rate-limits) currently lists the `gpt-oss-120b` free tier at 64K tokens per minute, 30 requests per minute, 1M tokens per day, and 14.4K requests per day. Limits can change; the exact organization and project limits displayed in the Cerebras console are authoritative.

OpenRouter remains available by setting `AI_PROVIDER_TYPE=openrouter` with its base URL, key, and model. Other conservative OpenAI-compatible endpoints may use `AI_PROVIDER_TYPE=generic-openai`; provider-specific reasoning parameters are intentionally not guessed for generic transports.

To use only **Deterministic Simulation** or **Recorded Demo**, provider variables may remain empty; start the same local server with `npm.cmd start` and select either mode.

## Product modes

- **AI Live Simulation** sends four independent, character-owned projections to a configured OpenAI-compatible provider. Each response is parsed and validated before the unchanged World Engine resolves the complete turn. Invalid output or transport failure is visible and never falls back silently.
- **Deterministic Simulation** uses the approved rule policies for reproducible offline testing and the competition demo.
- **Recorded Demo** is immutable authored playback, not a video. It reads `recorded-data.js` directly and remains independently executable without the World or provider layers.

Each AI request contains only that character's identity, goals, location, inventory, beliefs, trust, current observations, legal options, and at most six owned memories. It never contains hidden world truth or another character's private state.

## Cerebras final-acceptance path

1. Complete Original Turns 1–3 in AI Live.
2. Fork completed Turn 1 or Turn 2.
3. Apply an Information intervention to Mara.
4. Resolve the Alternate and switch between both branches.
5. Complete both branches and open comparison.
6. Inspect the authoritative terminal outcome and decisive event.

## Fork and intervention flow

Run an Original to a completed boundary, select an eligible turn from 0 through 10, and choose **Fork from turn N**. The Original remains immutable. The Alternate accepts exactly one validated Information, Item Transfer, or Environmental event, then continues through the same authoritative World rules. Complete both branches to open the truthful comparison view.

## Verify

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run demo:search
```

The exact demo journey is in [`docs/DEMO_PATH.md`](docs/DEMO_PATH.md). Product and implementation authority remain [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) and [`docs/BUILD_STRATEGY.md`](docs/BUILD_STRATEGY.md).

## Scope and roadmap

The product currently includes one complete scenario, one Alternate, one intervention, no persistence, and no scenario creator.

> The Last Antidote is our first playable proof of concept. Our larger vision is a creator platform where anyone can describe a scenario, generate its characters and world, and then watch, influence, and fork an AI-driven story as it unfolds.

That creator platform is a roadmap vision, not an implemented feature.
