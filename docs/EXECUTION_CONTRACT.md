# Forked Fates Phase 0 Execution Contract

**Status:** Locked Phase 0 deliverable  
**Authority:** `PRODUCT_SPEC.md`, then `BUILD_STRATEGY.md`  
**Recorded pair:** Original `recorded-original-v1`; Alternate `recorded-alternate-v1`  
**Fork boundary:** End of Original turn 2  
**Intervention:** Sera sighting — true observation  
**Recipient:** Mara Vale

This contract fixes the approved Recorded-mode story pair and the causal proof the implementation must make inspectable. It does not prescribe the behavior of Live-mode NPCs.

## 1. Locked causal proof

The Alternate copies the Original exactly through completed turn 2. Its first branch-specific event is a private anonymous note to Mara:

> “Dain saw Sera leave the clinic shortly before the vial was found missing.”

The proof chain is:

1. `evt-alt-i01`: Mara receives the intervention and a private memory; nobody else receives it.
2. `belief-alt-mara-sera-sighting`: Mara changes from uncertain about Sera's connection to believing the sighting is probably true. She remains uncertain whether Sera moved the antidote.
3. `evt-alt-t03-mara-question-sera`: Mara changes her turn-3 action from privately questioning Orin to publicly asking Sera to explain the sighting.
4. `belief-alt-sera-exposure`: Sera directly learns that Mara knows of the sighting and judges concealment likely to fail.
5. `evt-alt-t04-sera-move-storehouse`: Sera changes from waiting to moving to the Storehouse, serving her primary goal over her fear of punishment.
6. `evt-alt-t05-sera-find-antidote` and `evt-alt-t07-sera-administer`: Sera retrieves the real vial, reaches the Clinic, and administers it.
7. The Alternate becomes **Saved / Obscured / Uneasy** at turn 7. At the equivalent point the Original is untreated and Orin possesses the hidden vial; it ultimately becomes **Lost / Exposed / Fractured** at turn 12.

The comparison must say that the intervention contributed to the divergence by changing Mara's belief and question; Mara's, Sera's, and Orin's later decisions also contributed. It must not claim the note was the sole cause.

## 2. Stable identities and starting evidence

The implementation may add display metadata but must retain stable identities for causal links.

| Identity | Owner/type | Meaning |
|---|---|---|
| `fact-antidote-storehouse` | World truth | The usable antidote starts hidden in the Storehouse. |
| `fact-orin-ordered-sera` | World truth | Orin ordered Sera to move the vial. |
| `fact-sera-moved-antidote` | World truth | Sera moved the vial from the Clinic to the Storehouse. |
| `fact-case-spare-key` | Discoverable evidence | The empty case was opened with Orin's spare clinic key. |
| `obs-dain-sera-sighting` | True observation | Dain saw Sera leave the Clinic before the vial was reported missing. |
| `mem-start-dain-sera-sighting` | Dain memory | Dain's direct observation of Sera leaving the Clinic. |
| `mem-start-sera-orin-order` | Sera memory | Orin's private order and Sera's compliance. |
| `mem-start-orin-order` | Orin memory | Orin's personal action ordering the move. |
| `mem-start-mara-deadline` | Mara memory | Niko will not survive beyond turn 12 without treatment. |

Starting characters, trust, locations, knowledge, patient state, clock, and item state are copied verbatim from PRD sections 5.2–5.5. The Recorded data must not invent additional starting knowledge.

## 3. Identical shared prefix

All NPCs choose from the same start-of-turn boundary. Events resolve by the PRD phase order. The two branches share these exact events and consequences.

### Turn 0 — scenario boundary

- Mara is at the Clinic; Dain, Sera, and Orin are at the Village Square.
- The antidote is hidden in the Storehouse. Niko is untreated. Twelve turns remain.
- The hidden order and item location are not shown in the briefing.

### Turn 1 — evidence and guarded claims

| NPC | Intent and served goal | Authoritative result and key memory |
|---|---|---|
| Mara | **Investigate** the empty case; serve “administer the antidote.” | `evt-shared-t01-mara-key`: she discovers `fact-case-spare-key`; only Mara receives `mem-shared-mara-key`. |
| Dain | **Communicate privately** with Sera about his sighting; serve “identify the responsible person.” | `evt-shared-t01-dain-question`: Dain and Sera receive private memories. Dain cites `mem-start-dain-sera-sighting`. |
| Sera | **Communicate privately** to deny knowing where the vial is; serve “avoid punishment.” | `evt-shared-t01-sera-denial`: the denial is a claim, not world truth; only Dain and Sera remember it. |
| Orin | **Communicate publicly** that there is no proof the vial left the Clinic; serve “maintain authority.” | `evt-shared-t01-orin-reassure`: Dain and Sera witness the claim. It does not change world truth. |

### Turn 2 — the false frame begins

Movement resolves before speech.

| NPC | Intent and served goal | Authoritative result and key memory |
|---|---|---|
| Mara | **Move** to the Village Square; serve “find the antidote through cooperation.” | `evt-shared-t02-mara-square`: Mara joins Sera and Orin. |
| Dain | **Move** to the Clinic; serve “inspect the scene.” | `evt-shared-t02-dain-clinic`: Dain leaves before Orin speaks and receives no memory of that accusation. |
| Sera | **Wait**, remaining evasive; serve “avoid punishment.” | `evt-shared-t02-sera-wait`: concise reason is retained; no state changes. |
| Orin | **Accuse** Mara publicly of losing control of the vial; serve “hide his order.” | `evt-shared-t02-orin-accuse-mara`: Mara and Sera witness an unsupported claim. Mara's trust in Orin falls from -10 to -25 with an explicit trust event. |

The shared checkpoint is `boundary-original-t02`. Hashing canonical state and events through this boundary must produce the same value in both branches.

## 4. Golden Original — `recorded-original-v1`

### Turn-by-turn outline

| Turn | NPC intents and resolution highlights | Causal evidence and state |
|---:|---|---|
| 3 | Mara privately questions Orin about his spare key. Dain investigates the Clinic and directly discovers the spare-key evidence. Sera waits, afraid to confess. Orin publicly repeats his unsupported blame of Mara. | Mara cites `mem-shared-mara-key`. Dain gains `mem-orig-dain-key`. Mara's trust in Orin falls from -25 to -40. |
| 4 | Dain moves to the Square. Orin moves to the Storehouse to secure the vial. Mara publicly reports the spare-key evidence. Sera waits. | Movement resolves first, so Orin does not witness Mara's statement. Mara, Dain, and Sera put `fact-case-spare-key` into the public record. Orin cites his memory of Mara's private question. |
| 5 | Orin investigates the Storehouse first and takes possession of the antidote. Dain publicly accuses Mara at the Square. Mara publicly denies responsibility. Sera waits. | `evt-orig-t05-orin-find-antidote` moves the item by rule. Dain's accusation is an unsupported claim influenced by his +40 starting trust in Orin and Orin's witnessed turn-1 claim that the vial never left Mara's Clinic. Mara's trust in Dain falls from +20 to +5. Orin's and Dain's accusations create a false public consensus for now. |
| 6 | Mara and Dain move to the Clinic. Sera moves to the Storehouse. Orin moves to the Square while carrying the vial. | The item remains in Orin's possession. All changes are movement events; nobody learns another location's events. |
| 7 | Sera investigates the Storehouse and finds the hiding place empty. Mara cares for Niko, Dain privately reassures Mara, and Orin waits while concealing the vial. | Sera gains `mem-orig-sera-vial-gone`; this proves only that the vial is no longer where she left it. Niko remains untreated. |
| 8 | Sera and Dain move to the Square. Mara stays with Niko. Orin remains at the Square. | The next turn begins with Dain, Sera, and Orin co-located. No remote memories are created for Mara. |
| 9 | Sera publicly accuses Orin of taking the vial but withholds his order and her own role. Orin denies the allegation. Dain investigates the Square and finds no physical evidence. Mara waits at the Clinic. | The accusation remains an allegation. Orin's trust in Sera falls from -20 to -35 for the unsupported public accusation. Neither responsible role is established yet. |
| 10 | Orin moves to the Storehouse with the vial to evade scrutiny. From the same start boundary, Dain independently moves there to investigate Sera's prior allegation. Sera moves to the Clinic; Mara remains with Niko. | Movement consumes each mover's action. Dain does not know Orin's unpublished intent and cannot investigate until the following turn. |
| 11 | Orin moves back to the Square before Dain investigates; Dain finds the Storehouse empty. At the Clinic, Sera publicly confesses to Mara: “Orin ordered me to move the antidote to the Storehouse, and I did.” Mara listens and keeps Niko stable. | `evt-orig-t11-sera-confession` has Mara as its other witness, establishes Sera's action, and—combined with public spare-key evidence—establishes Orin's order. The truth becomes Exposed. Mara's trust in Sera rises from +10 to +25 for the risky confession. Orin's established deception lowers Mara's trust in Orin from -40 to -65. Memories remain local to Clinic participants. |
| 12 | Dain moves to the Square. Orin waits there while retaining the vial. Mara and Sera remain at the Clinic with Niko. The deadline resolves. | `evt-orig-t12-outcome`: Niko is lost because nobody administered the vial at the Clinic. No partial treatment or implicit item transfer occurs. |

### Original outcome and recap

- **Medical — Lost:** Orin possesses the only antidote at the deadline; it was never administered.
- **Truth — Exposed:** Sera's witnessed confession establishes her action and Orin's order when combined with the public spare-key evidence.
- **Social — Fractured:** Mara's directed trust in Orin is -65. The earlier false consensus is superseded once both responsible roles are established; history is not erased.
- **Antidote path:** Storehouse → Orin at turn 5; still held by Orin at turn 12.
- **Recap:** Suspicion and authority outweigh rescue. Orin secures the vial, Dain follows Orin's false frame, and Sera reveals the chain only after Orin has kept the antidote out of reach until nightfall.

### Original pivotal events (maximum three)

1. `evt-orig-t04-orin-move-storehouse` — Orin acts on Mara's private scrutiny and moves to secure the vial.
2. `evt-orig-t05-orin-find-antidote` — Orin becomes the vial's possessor.
3. `evt-orig-t11-sera-confession` — the truth is established too late to change the medical result.

## 5. Golden Alternate — `recorded-alternate-v1`

### Intervention boundary

`evt-alt-i01` is the first event after `boundary-original-t02`. It is private to Mara, creates only `mem-alt-mara-intervention`, and records the note as a true observation supplied by a player intervention—not as Mara's direct observation.

Mara's belief in `obs-dain-sera-sighting` changes from **uncertain** to **believes true (75)**. Her belief that Sera moved the antidote remains **uncertain (45)**. This distinction is why she asks rather than asserts guilt.

### Turn-by-turn outline

| Turn | NPC intents and resolution highlights | Causal evidence and state |
|---:|---|---|
| 3 | Mara publicly asks Sera to explain Dain's sighting instead of privately questioning Orin. Dain investigates the Clinic and discovers the spare-key evidence. Sera waits because intents were chosen from the start boundary. Orin repeats his preselected public blame of Mara. | `evt-alt-t03-mara-question-sera` cites `mem-alt-mara-intervention` and is the first divergent NPC action. Sera and Orin witness it. Sera gains `mem-alt-sera-confronted`; Mara's trust in Orin falls to -40 as in the Original. Orin's same-turn action does not react to Mara's unpublished intent. |
| 4 | Dain moves to the Square. Sera moves to the Storehouse instead of waiting. Mara publicly reports the spare-key evidence. Orin remains at the Square and publicly dismisses the clue instead of moving to secure the vial. | Sera cites `mem-alt-sera-confronted` and serves her primary rescue goal. Orin cites his memory of Mara's public question; the claim changes no world truth. The public spare-key record is witnessed by Mara, Dain, and Orin after movement. |
| 5 | Sera investigates the Storehouse first and takes possession of the real antidote. Mara moves to the Clinic. Dain publicly accuses Orin at the Square of using his key; Orin denies it. | `evt-alt-t05-sera-find-antidote` changes possession by world rule. Dain's key evidence supports suspicion but does not prove the accusation, so it remains an allegation and produces no required trust change. |
| 6 | Sera moves to the Clinic with the vial. Dain also moves to the Clinic. Mara prepares Niko; Orin waits at the Square. | Movement consumes Sera's action. The vial is present at the Clinic but Niko remains untreated until a separate Administer action. |
| 7 | Sera administers the possessed antidote to Niko. Mara and Dain witness treatment; their other preselected intents resolve before the branch closes. | `evt-alt-t07-sera-administer` saves Niko. Mara's trust in Sera rises from +10 to +30 and Dain's from -20 to 0, each with a witnessed-help trust event. The branch ends at the completed turn boundary. |

### Alternate outcome and recap

- **Medical — Saved:** Sera administers the real antidote at the Clinic on turn 7.
- **Truth — Obscured:** no witnessed confession establishes Sera's move or Orin's order, and no two-NPC false consensus remains.
- **Social — Uneasy:** no directed trust is below -50 and the requirements for Reconciled are not met because the truth remains Obscured.
- **Antidote path:** Storehouse → Sera at turn 5 → Clinic at turn 6 → administered at turn 7.
- **Recap:** Mara's anonymous clue prompts a question rather than a verdict. Knowing the sighting is now public, Sera prioritizes Niko, reaches the vial before Orin, and administers it while responsibility remains unresolved.

### Alternate pivotal events (maximum three, intervention shown separately)

1. `evt-alt-t03-mara-question-sera` — Mara's changed belief produces the first changed action.
2. `evt-alt-t05-sera-find-antidote` — Sera becomes the vial's possessor before Orin.
3. `evt-alt-t07-sera-administer` — the changed item path becomes a Saved outcome.

## 6. Pair verification contract

The pair is approved only while all statements below remain true:

- Canonical events and state are identical through `boundary-original-t02`.
- `evt-alt-i01` is the Alternate's first branch-specific event and only Mara initially remembers it.
- The first divergent NPC event is Mara's turn-3 action.
- No NPC reacts during turn 3 to an intent it could not observe at the decision boundary.
- Every movement, investigation, accusation, communication, possession, treatment, trust, belief, and outcome change has an event.
- The Alternate's medical outcome differs on turn 7, five turns after the intervention (turns 3–7).
- Comparison can traverse intervention → Mara belief → Mara action → Sera memory/belief → Sera action → item path → treatment.
- Original and Alternate each contain no more than three marked pivotal events.
- Recorded mode is unmistakably labeled and never represented as live generation.

## 7. Known-good checkpoint convention

Use `phase-N-DL-short-description` for tags, commits, backup folders, screenshots, and demo notes. Examples:

- `phase-0-planning-golden-pair-locked`
- `phase-1-D0-recorded-walking-skeleton`
- `phase-2-D1-complete-recorded-original`
- `phase-6-D4-isolated-recorded-fork`
- `phase-9-D6-release-candidate`

Only a fully verified phase receives a checkpoint name. Partial work uses ordinary descriptive branch or task names and must not be presented as a passing checkpoint.

## 8. Phase 0 exit checklist

Verified on 2026-07-18 against PRD version 1.0 and Build Strategy version 1.0:

- [x] Original reaches valid **Lost / Exposed / Fractured** outcomes.
- [x] Alternate reaches valid **Saved / Obscured / Uneasy** outcomes.
- [x] Both branches are identical through completed turn 2.
- [x] The Alternate contains exactly one approved intervention with exactly one recipient.
- [x] The intervention changes a recipient belief and a later NPC action.
- [x] The medical divergence materializes within five turns after intervention.
- [x] The causal comparison is grounded in stable event, memory, belief, and item-path identities.
- [x] The demonstration script covers crisis, decision causality, inspection, fork, and divergence in 2:40.
- [x] Every outlined intent belongs to a PRD action family and respects resolution-time co-location and possession rules.
- [x] No outlined decision reacts to hidden truth, remote events, private state, or unpublished intents.
- [x] No behavior expands the PRD's scope.
- [x] Acceptance ownership covers criteria 1–47 without claiming Phase 0 implementation.

The passing planning checkpoint name is `phase-0-planning-golden-pair-locked`.
