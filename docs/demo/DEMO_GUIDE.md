# Forked Fates Demo Guide

This guide provides a short judge-facing tour and a deterministic recovery path. Recorded Demo is precomputed authored playback; never describe it as live generation.

## Before presenting

From the repository root:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run demo:search
npm.cmd start
```

Open `http://127.0.0.1:8080/`.

For AI Live, configure `.env` first and confirm the Start screen reports the expected provider and model. The repeatable causal demo needs no API key.

## Product tour

The Start screen has two primary choices:

- **Start AI Live** for genuine provider-backed decisions.
- **Explore Demo** for immutable Recorded playback with no provider.

**Deterministic Simulation** is available under **Advanced / Testing Modes** for repeatable verification and forking.

The Forked Fates brand control returns to Start from every major screen without refreshing the browser.

## Recommended 2½-minute deterministic demo

### 0:00–0:25 — Frame the premise

1. Expand **Advanced / Testing Modes** and choose **Deterministic Simulation**.
2. Explain: a child has been poisoned, one antidote is missing, four people know different pieces of the truth, and night falls in twelve turns.
3. Point out the three illustrated locations, four character portraits, Niko's patient state, antidote indicator, and turn clock.
4. State the core rule: each character acts from only its own memories, beliefs, observations, inventory, goals, and trust; the World Engine—not dialogue or the UI—controls consequences.

### 0:25–0:55 — Establish the Original

1. Choose **Next Turn**.
2. Select Mara, then an event, and show the owned-memory evidence and authoritative result.
3. Turn **Follow live events** off and select a historical turn. Advance once to demonstrate that review selection and scroll position are preserved.
4. Choose **Jump to latest**, then **Run to End**.
5. Show the Original terminal outcome: **Lost / Exposed / Fractured**.

### 0:55–1:30 — Fork and intervene

1. Select completed **Turn 0**.
2. Choose **Fork from turn 0**.
3. Create this typed intervention:
   - Type: **Information**
   - Target: **Mara Vale**
   - Information: **The empty case was opened with the spare Clinic key**
   - Confidence: **90**
4. Explain that the Original remains immutable, the intervention is an external causal root, and the World creates the resulting Alternate memory and belief.
5. Point out **Intervention applied after Turn 0** and the human-readable intervention card.

When the URL includes `?demo=1`, **Load competition demo setup** fills the same event. That helper is hidden in normal product mode.

### 1:30–2:30 — Compare causal futures

1. Run the Alternate to completion.
2. Open **Compare outcomes**.
3. Show the intervention summary at the top.
4. Show **First observable impact: Turn 1**: Mara changes from **Investigate** to **Move**.
5. Show later event/location divergence and the four changed directed trust relationships.
6. Show the final antidote holder changing from **Orin** to **Sera**.
7. Show Truth changing **Exposed → Obscured** while Medical and Social remain **Lost** and **Fractured**.
8. Distinguish authoritative causal event links from comparison-only alignment links.

The alternate succeeds by remaining World-valid, not by matching a predetermined story.

## AI Live proof

With `.env` configured:

1. Return to Start and choose **Start AI Live**.
2. Resolve one turn.
3. Watch the status progress through four-character generation, validation, and one World resolution.
4. Inspect at least one character and one event.
5. Explain that four separate owned projections are requested in parallel; no character sees another character's private state.

The model selects only intent semantics. System-owned actor, turn, branch, and record identities are stamped from the latest frozen boundary; validators enforce legality; the World Engine decides success, failure, and consequences.

If the provider returns invalid output or fails, show the explicit failure and Retry controls. AI Live never switches silently to deterministic policy.

## Explore Demo proof — no API key

1. Return to Start and choose **Explore Demo**.
2. Use **Next Turn**, **Run to End**, timeline selection, character inspection, and event inspection in the same visual shell used by simulation modes.
3. Show the Recorded terminal presentation.
4. State clearly that this is immutable authored sample data from `src/data/recorded-data.js`, not a video and not a World replay.

Recorded playback remains usable even if the AI provider and simulation layers are unavailable.

## Expected deterministic divergence

The checked-in demo search currently selects the Turn 0 Mara spare-key intervention. Its visible proof points are:

- first changed decision at Turn 1;
- later authoritative event and location divergence;
- four directed trust differences;
- final antidote holder Orin → Sera;
- Truth Exposed → Obscured;
- unchanged Medical Lost and Social Fractured.

Recompute this result with `npm.cmd run demo:search` rather than relying on a screenshot.

## Recovery and safeguards

- **Pause** takes effect only after the current atomic turn finishes.
- **Restart simulation** creates a clean frozen Turn 0 session.
- **Jump to latest** restores follow mode without losing branch state.
- Provider setup, timeout, HTTP, invalid-output, and World-resolution failures remain classified separately.
- Fork only a ready, nonterminal boundary from turns 0 through 10.
- Apply exactly one intervention before continuing the Alternate.
- Never describe Recorded data or deterministic policies as provider-generated AI.
- Never claim raw chain-of-thought is displayed; only concise declared rationale and owned evidence are inspectable.
