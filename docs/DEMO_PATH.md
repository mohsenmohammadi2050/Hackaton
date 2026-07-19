# Phase 8 Approved Demo Path

**Configuration:** `demo-key-evidence-to-mara-t00`  
**Target duration:** 2 minutes 30 seconds; hard ceiling 3 minutes  
**Provider:** DeterministicProvider  
**External services:** none

## Why this intervention was selected

`npm run demo:search` evaluates a small, fixed list of legal information interventions in deterministic order. Invalid continuations are reported as rejected candidates rather than stopping the search. The approved candidate ranks first by the committed score function:

- fork at completed turn 0;
- give Mara true evidence for `fact-case-spare-key` at confidence 90;
- first changed autonomous decision occurs at turn 1;
- Original outcome: **Lost / Exposed / Fractured**;
- Alternate outcome: **Lost / Obscured / Fractured**;
- final antidote holder changes from Orin to Sera;
- 35 autonomous intents and four directed trust relationships differ across the completed branches.

This is a clear causal demonstration without changing NPC policies or adding story logic.

## Presenter script

### 0:00–0:20 — Frame the product

1. Open the Start screen.
2. Read the promise: “Change one belief. Watch a different story emerge.”
3. Choose **Begin The Last Antidote**.
4. On Briefing, note four people, partial truths, and twelve turns. Do not reveal the hidden causal chain.
5. Choose **Start live simulation**.

### 0:20–0:55 — Establish authoritative Live playback

1. At turn 0, point out three locations, four autonomous NPCs, patient clock, Live badge, and frozen-boundary label.
2. Choose **Step** once. Show that one click reveals one complete turn.
3. Inspect Mara and one event. Point out owned memories, beliefs as beliefs rather than truth, declared rationale, goal, witnesses, and causal predecessors.
4. Choose **Run** and let the Original reach turn 12.
5. State the Original outcome: **Lost / Exposed / Fractured**.

### 0:55–1:20 — Fork and intervene

1. In the Original timeline select the completed turn 0 boundary.
2. Choose **Fork from turn 0**.
3. State that the Original is immutable and the Alternate owns every post-fork identity.
4. In the typed-event composer choose **Use approved demo intervention**.
5. Point out the intervention event followed by its authoritative private memory/belief consequence.
6. Choose **Resolve Alternate future**.

### 1:20–1:50 — Reveal divergence

1. Choose **Step** once and inspect Mara’s turn-one decision. It differs because her owned belief is now available before she decides.
2. Choose **Run** to complete the Alternate.
3. Switch between **Original** and **Alternate** once to demonstrate branch-local timelines and outcomes.

### 1:50–2:30 — Compare conclusions

1. Choose **Compare outcomes**.
2. Show side-by-side outcomes: Truth changes from **Exposed** to **Obscured**; Medical and Social remain **Lost** and **Fractured**.
3. Show the changed autonomous intents, four trust deltas, and final antidote holder (Orin versus Sera).
4. Show the validated authoritative outcome-support path.
5. Explicitly identify the comparison-only decision link: it reports correlation after the intervention and is not presented as an authoritative event-cause edge.

## Recovery path

- **Pause** always stops on a completed frozen boundary.
- **Restart Live session** creates a fresh deterministic session.
- A Live startup or resolution failure shows Retry and **Use Recorded Original**.
- **Watch recorded demonstration** remains independently executable even if all Live scripts are unavailable.
