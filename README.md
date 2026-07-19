# Forked Fates

Forked Fates is a framework-free causal narrative sandbox. The included scenario, **The Last Antidote**, follows four autonomous NPCs across at most twelve deterministic turns. You can watch the immutable authored Recorded Original, run the authoritative Live Original, fork a completed boundary, add one typed intervention, and compare the resulting outcomes.

## Run locally

Serve this directory with any static HTTP server, then open `index.html` through that server. For example:

```text
python -m http.server 8080
```

Then visit `http://localhost:8080/`.

No package installation, build step, external service, API key, or network call is required.

## Verify

```text
npm run check
npm test
npm run demo:search
```

The approved demo journey is in [`docs/DEMO_PATH.md`](docs/DEMO_PATH.md). Product and implementation authority remain [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) and [`docs/BUILD_STRATEGY.md`](docs/BUILD_STRATEGY.md).

## Architecture in one sentence

Recorded playback reads immutable authored data directly; Live presentation talks only to `live-session-adapter.js`, which delegates decisions, interventions, forks, validation, and state transitions to the already approved authoritative layers.
