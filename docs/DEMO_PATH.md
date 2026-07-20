# Phase 8.1 Recommended Demo Path

**Configuration:** `demo-key-evidence-to-mara-t00`

**Mode:** Deterministic Simulation

**URL:** `http://127.0.0.1:8080/?demo=1`

**Target duration:** 2 minutes 30 seconds

**External services:** none for this reproducible competition path

AI Live is genuine provider-backed execution and should be shown separately with a configured provider. The exact causal demo uses Deterministic mode so the visible differences are repeatable.

## Selected fork and intervention

1. Complete the deterministic Original or leave it running while reviewing completed history.
2. Select the completed **Turn 0** boundary.
3. Choose **Fork from turn 0**.
4. In normal product mode, select:
   - category: **Information**;
   - recipient: **Mara Vale**;
   - information: **The empty case was opened with the spare Clinic key**;
   - confidence: **90**.
5. Choose **Create Alternate event**.

With `?demo=1`, **Load competition demo setup** supplies exactly the same typed event. It is hidden in normal product mode and enabled only at the documented turn.

## Verified visible causal differences

- Mara's Turn 1 action changes from **Investigate** to **Move**.
- Later authoritative events and locations diverge.
- Four directed trust relationships differ.
- The final antidote holder changes from **Orin** to **Sera**.
- Truth changes from **Exposed** to **Obscured**.
- Medical and Social remain **Lost** and **Fractured**.
- The comparison identifies authoritative event-cause edges separately from the explicitly comparison-only decision link.

## Presenter sequence

### 0:00–0:20 — Frame the product

1. On Start, point out **Start AI Live Simulation**, **Explore Recorded Demo**, and the secondary **Deterministic Simulation**.
2. State: “Change one belief. Watch a different story emerge.”
3. Briefly explain that each character sees only their own memories, beliefs, observations, inventory, and trust.

### 0:20–0:55 — Establish the authoritative Original

1. Enter Deterministic Simulation.
2. Point out the three illustrated locations, four character portraits, Niko, antidote indicator, and current story beat.
3. Choose **Next Turn** once; inspect Mara and one authoritative event.
4. Toggle **Follow live events** Off, select Turn 0, and note that the simulation can continue without moving the review position.
5. Toggle it On and choose **Run to End**. The Original concludes **Lost / Exposed / Fractured**.

### 0:55–1:25 — Fork and intervene

1. Select Original Turn 0 and fork.
2. State that the Original stays immutable and every Alternate identity is branch-local.
3. Apply the selected Information event.
4. Point out the private intervention event and its World-authored memory/belief consequence.
5. Prepare and run the Alternate.

### 1:25–2:30 — Compare futures

1. Open **Compare outcomes**.
2. Show the first changed action at Turn 1 and the evidence-only classifications that are not mislabeled as action changes.
3. Show Truth **Exposed → Obscured**, antidote holder **Orin → Sera**, and the trust deltas.
4. Show the authoritative causal support path and the separately labeled comparison-only link.

## AI Live proof before or after the exact demo

Configure `.env`, choose **Start AI Live Simulation**, and resolve one turn. The status sequence shows connection, four-character generation, validation, and World resolution. Provider failure remains visible; it never switches to deterministic policies.

## Recovery

- **Pause** stops only after the current complete turn.
- **Restart Live session** restores a new frozen Turn 0 session.
- Provider setup, timeout, HTTP, and invalid-output failures offer Retry, Return to start, and Recorded Demo.
- Recorded Demo remains independently executable even when AI Live is unavailable.
