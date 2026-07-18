# Forked Fates MVP Product Requirements Document

**Document status:** Approved direction; implementation-ready product specification  
**Version:** 1.0  
**Product type:** Causal narrative sandbox  
**MVP scenario:** The Last Antidote  
**Primary audience:** Interactive-fiction writers, tabletop game masters, and indie narrative-game designers  
**Secondary audience:** Players interested in short, replayable social simulations

---

## 1. Executive Summary

Forked Fates is a small, inspectable world in which autonomous non-player characters make consequential decisions based on their goals, personalities, relationships, and individual memories. The product demonstrates that a story was not selected from a scripted quest tree by letting the user inspect why each character acted and fork the timeline from a prior turn.

The MVP contains one handcrafted scenario, four autonomous NPCs, three locations, a twelve-turn deadline, and one pivotal player intervention. The user first watches or steps through a baseline timeline. They can then fork a completed turn, disclose one fact or rumor to one NPC, and observe how that intervention creates a different chain of decisions and outcome.

The product is not an open-ended artificial society and is not a conventional role-playing game. It is a causal narrative sandbox: a compact, directed experience designed to make emergent behavior understandable, dramatic, and comparable.

### 1.1 Product promise

> Change one belief. Watch a different story emerge.

### 1.2 MVP success statement

The MVP succeeds when a first-time user can, without explanation:

1. Understand the crisis and the four characters.
2. Watch the characters take independent, consequential actions.
3. Inspect an action and identify which goal, relationship, and memories influenced it.
4. Fork the same world state, introduce one new piece of information, and see a materially different causal chain.
5. Compare the two endings and explain why they diverged.

---

## 2. Core Vision

### 2.1 Problem

Branching narrative is expensive to author and difficult to test because every authored choice creates additional paths. Existing generative-character demonstrations often replace authored branches with dialogue, but their behavior can feel arbitrary because the user cannot see what the characters knew, why they acted, or whether an outcome was genuinely caused by prior events.

### 2.2 Product thesis

A compelling emergent narrative requires three layers:

- **Authored pressure:** a deadline, scarcity, secrets, and conflicting goals.
- **Autonomous choice:** each character decides independently from its own limited perspective.
- **Deterministic consequence:** legal actions change an explicit world state and create memories for witnesses.

The story emerges from the interaction of these layers. The scenario authors the initial conflict and the rules, but not the sequence of decisions or final outcome.

### 2.3 Product principles

1. **Author tensions, not plot.** Initial conditions may be designed for drama; character actions and outcomes are not preselected.
2. **Consequences are real.** Dialogue alone is not progress. Important actions change knowledge, trust, location, item possession, the patient state, or the public account of events.
3. **Characters know only what they could know.** Hidden facts, private conversations, and unwitnessed actions are not globally available to NPCs.
4. **Reasoning is inspectable.** Every consequential choice must be connected to current goals, relationships, and specific memories.
5. **The world remains authoritative.** A character may lie or be mistaken, but cannot invent a state change.
6. **Small is legible.** Four characters and twelve turns are a deliberate product choice, not a temporary limitation.
7. **Forking proves emergence.** The same history must be preserved before a fork, making the changed intervention the clear point of divergence.
8. **Drama must finish.** Every run reaches an explicit medical and social outcome.

### 2.4 User and use case

The primary user is a narrative creator evaluating how a cast of characters might react to a pressured situation. They use Forked Fates to explore plausible story paths, inspect character causality, and compare interventions without manually authoring every branch.

The MVP is also enjoyable as a short playable story. However, creator-oriented inspectability takes precedence over surprise preservation: the user is allowed to inspect all character memories and motivations.

---

## 3. MVP Scope

### 3.1 Included

- One scenario: **The Last Antidote**.
- Four autonomous NPCs.
- One non-agent patient represented as world state.
- Three discrete locations.
- One movable critical item: the antidote.
- Twelve turns per branch.
- Seven legal action families.
- Directed trust relationships between every pair of NPCs.
- Per-NPC goals, traits, memories, beliefs, and current intent.
- A complete event timeline with causal inspection.
- Step, run, pause, and timeline navigation controls.
- One fork per session.
- One intervention at the fork point.
- Original-versus-alternate outcome comparison.
- A clearly labeled recorded demonstration mode if live decision generation is unavailable.

### 3.2 Product invariants

- There are always exactly four decision-making NPCs.
- A branch contains no more than twelve turns.
- Every NPC selects no more than one intent per turn.
- NPCs decide from the state visible at the beginning of that turn.
- An NPC never receives another NPC's unpublished intent.
- The event history is append-only within a branch.
- A fork never changes the original branch.
- Events before the fork are identical in both branches.
- Only world rules may change authoritative state.
- The patient outcome is always resolved by the end of turn twelve.

---

## 4. Terminology

| Term | Definition |
|---|---|
| World truth | The authoritative state of locations, objects, the patient, and scenario facts, whether or not any NPC knows it. |
| Fact | A scenario proposition with a stable identity, such as “Orin ordered Sera to move the antidote.” |
| Claim | A statement by an NPC or player about a fact. A claim may be true, false, incomplete, or uncertain. |
| Belief | An NPC's current interpretation of a fact, including confidence and provenance. Belief is not guaranteed to match world truth. |
| Memory | An immutable record of something an NPC perceived, was told, did, or experienced. |
| Intent | The single legal action an NPC privately selects for the current turn. |
| Event | An authoritative record that something occurred in the world or in a character's perceived experience. |
| Turn | One complete observe-decide-resolve cycle for all four NPCs. |
| Branch | A timeline with its own state and events after a shared historical prefix. |
| Intervention | The one user-authored information event added at the fork point. |
| Pivotal event | An event identified in the outcome view as materially contributing to branch divergence or resolution. |

---

## 5. The Last Antidote Scenario

### 5.1 Premise

A child named Niko has been poisoned. The village owns one antidote, but the vial is missing from the clinic. Nightfall occurs after twelve turns; if the antidote has not been administered by then, Niko is lost.

The hidden truth is that Mayor Orin Voss ordered courier Sera Quill to move the antidote from the clinic to the storehouse. Orin wanted to reserve it for a wealthy envoy expected the following morning. Sera complied but now regrets doing so. No starting character knows every other character's observations or intentions.

### 5.2 Locations

| Location | Public properties | Starting contents |
|---|---|---|
| Clinic | Niko can be treated here. Conversations are witnessed by all characters currently present unless explicitly private. | Niko; an empty antidote case; clinic records. |
| Village Square | Social center. Public statements and accusations are witnessed by everyone present. | Notice board; gathered townspeople represented as atmosphere, not agents. |
| Storehouse | Searchable location. Conversations are witnessed only by characters present. | The hidden antidote at turn zero. |

Locations are discrete. Characters are always in exactly one location. Distance and pathfinding do not exist.

### 5.3 Characters

#### Mara Vale — healer

- **Traits:** compassionate, direct, wary of authority.
- **Primary goal:** administer the antidote to Niko before nightfall.
- **Secondary goal:** preserve public trust in the clinic.
- **Starting location:** Clinic.
- **Starting knowledge:** the antidote is missing; Orin possesses a spare clinic key; Niko will not survive past turn twelve without treatment.
- **Unknown to Mara:** who moved the antidote and its current location.

#### Dain Holt — guard

- **Traits:** dutiful, suspicious, rigid.
- **Primary goal:** identify the person responsible for removing the antidote.
- **Secondary goal:** prevent panic and preserve civic order.
- **Starting location:** Village Square.
- **Starting knowledge:** he saw Sera leaving the clinic shortly before the vial was discovered missing; Orin asked him earlier to keep the storehouse undisturbed.
- **Unknown to Dain:** Sera's purpose, Orin's order, and the antidote's exact location.

#### Sera Quill — courier

- **Traits:** observant, guilt-prone, evasive.
- **Primary goal:** ensure Niko receives the antidote.
- **Secondary goal:** avoid punishment for moving it.
- **Starting location:** Village Square.
- **Starting knowledge:** Orin ordered her to move the vial; she placed it in the storehouse; Dain saw her leave the clinic.
- **Unknown to Sera:** whether Orin will protect or blame her and what the others currently suspect.

#### Orin Voss — mayor

- **Traits:** charismatic, status-conscious, calculating.
- **Primary goal:** prevent his order to move the antidote from becoming public.
- **Secondary goal:** maintain authority and prevent disorder.
- **Starting location:** Village Square.
- **Starting knowledge:** he ordered Sera to move the vial; the vial is in the storehouse; Dain was told to keep the storehouse undisturbed; he holds a spare clinic key.
- **Unknown to Orin:** whether Sera will confess and how much Dain inferred from seeing her.

### 5.4 Starting trust

Trust is directed: Mara's trust in Dain may differ from Dain's trust in Mara. It ranges from **-100** (hostile disbelief) to **+100** (strong confidence). Values from -24 through +24 are neutral, +25 or higher is trusted, and -25 or lower is distrusted.

| Observer → Subject | Mara | Dain | Sera | Orin |
|---|---:|---:|---:|---:|
| Mara | — | +20 | +10 | -10 |
| Dain | +30 | — | -20 | +40 |
| Sera | +20 | -30 | — | -10 |
| Orin | 0 | +30 | -20 | — |

Trust influences whether a character accepts a claim, cooperates with a request, discloses sensitive knowledge, or prioritizes suspicion. It never grants access to information the character did not receive.

### 5.5 Scenario clock and ending

- The scenario begins at turn zero and ends immediately when turn twelve resolves, unless Niko has already been successfully treated.
- The clock is visible at all times.
- Niko is saved only if the real antidote is administered at the Clinic by a character who possesses it.
- Moving the antidote to the Clinic is insufficient; administration is a separate action.
- If Niko is treated early, the branch may end immediately after all intents already selected for that turn resolve.
- If treatment does not occur, the branch ends after turn twelve with Niko lost.

### 5.6 Outcome dimensions

Every completed branch receives one label in each dimension:

**Medical outcome**

- **Saved:** the antidote was administered by the deadline.
- **Lost:** the antidote was not administered by the deadline.

**Truth outcome**

- **Exposed:** both Orin's order and Sera's action became part of the public record before the branch ended.
- **Partially exposed:** Sera's action became public, but Orin's order did not.
- **Obscured:** neither responsible action became public, and no false public consensus formed.
- **False consensus:** the public record assigns primary responsibility to Mara or Dain without the hidden chain being exposed.

**Social outcome**

- **Reconciled:** Niko is saved, the truth is exposed or partially exposed, and no pair ends in the hostile range below -50.
- **Uneasy:** the branch does not meet the conditions for reconciled or fractured.
- **Fractured:** at least one pair ends below -50, or a false consensus remains at the end.

There is no single score and no universal “winning” ending. The outcome view explains what happened and why.

---

## 6. User Experience

### 6.1 Intended emotional arc

1. **Immediate tension:** the user understands within seconds that a child, one vial, and a deadline are involved.
2. **Curiosity:** apparently reasonable characters possess different pieces of the truth.
3. **Recognition:** the user sees a decision connect to a memory or relationship.
4. **Agency:** the user chooses one character and one piece of information to introduce at a prior moment.
5. **Surprise with explanation:** the alternate branch differs, but the product can show the causal chain.
6. **Reflection:** the comparison view makes clear that no fixed quest branch was selected.

### 6.2 First-time user journey

1. The user opens the product and sees the title, one-sentence promise, and **Begin The Last Antidote**.
2. A scenario briefing introduces the crisis, the twelve-turn deadline, and the four characters. It does not reveal the hidden truth.
3. The simulation workspace opens at turn zero in a paused state.
4. The user selects **Step** or **Run**. Events begin appearing in the timeline.
5. The user clicks an NPC or event to inspect motives, known information, and causal references.
6. The original branch reaches an outcome, or the user pauses after at least one completed turn.
7. The user selects a completed turn and chooses **Fork from here**.
8. The user chooses one intervention card and one recipient.
9. The alternate branch begins from the identical state at the selected checkpoint, records the intervention, and continues.
10. When the alternate branch ends, the comparison screen shows both outcomes and highlights pivotal differences.

### 6.3 Information visibility

The user operates in **Director View** and may inspect world truth, NPC memories, goals, and trust. Hidden truth is visually marked and is not shown in the initial briefing. It becomes available after the user starts the simulation through a clearly labeled **Reveal world truth** control, and it is automatically revealed in the final comparison.

NPC information boundaries remain intact regardless of what the user can see.

### 6.4 Interaction model

- The user does not directly control NPC movement or actions.
- The only story intervention is the fact or rumor introduced at a fork.
- The user may inspect without changing the world.
- Pausing, navigating the timeline, opening inspectors, and revealing world truth do not consume turns.
- The primary flow is fully usable without typing free-form text.

---

## 7. Gameplay Loop

### 7.1 Core loop

1. Observe the current world and deadline.
2. Advance one turn or run continuously.
3. Watch NPC intents resolve into events and consequences.
4. Inspect a surprising decision.
5. Form a hypothesis about which belief might change the story.
6. Fork from a completed turn.
7. Introduce one information intervention.
8. Run the alternate branch.
9. Compare the causal chains and outcomes.

### 7.2 Turn pacing

- **Step** advances exactly one complete turn.
- **Run** advances turns continuously until paused or the branch ends.
- **Pause** takes effect after the currently resolving turn completes; it never leaves a partially resolved turn.
- The interface visibly distinguishes “characters deciding” from “world resolving.”
- Each completed turn appears as a grouped section in the timeline.

### 7.3 Replay value

The MVP supports replay through a new session and through one alternate branch. It does not promise persistent campaigns or unlimited branch trees. Different decisions may occur across new sessions, while the event history inside a completed branch remains fixed.

---

## 8. World Rules

### 8.1 Legal action families

Each NPC may select one of the following intents per turn:

| Action | Product behavior |
|---|---|
| Move | Move to one of the other two locations. Movement consumes the NPC's action for the turn. |
| Investigate | Search or inspect something at the current location. May reveal only facts defined as discoverable there. |
| Communicate | Ask, tell, deny, warn, or persuade. The actor selects a recipient or public audience and may reference known facts or claims. |
| Transfer | Give a possessed item to a co-located recipient. Receiving the item does not consume the recipient's action. |
| Administer | Use the possessed antidote on Niko while at the Clinic. |
| Accuse | Publicly assign responsibility to a co-located NPC and state the supporting claim or evidence. |
| Wait | Take no external action while retaining a short inspectable reason. |

### 8.2 Legality rules

- Communication, transfer, and accusation require the relevant characters to be co-located when those actions resolve.
- Public communication is witnessed by every character at the location.
- Private communication is remembered only by the actor and recipient.
- A character can transfer or administer only an item they possess.
- A legal transfer completes automatically; the recipient cannot refuse within the MVP.
- Only the antidote may be transferred in the MVP.
- Investigation reveals only scenario-defined evidence at the investigator's current location.
- A character may express an unsupported claim, but the event must mark it as a claim rather than world truth.
- An illegal intent does not change the world. It becomes a visible failed-action event and the character performs no substitute action that turn.

### 8.3 Resolution order

NPCs choose their intents independently from the same start-of-turn state. Intents then resolve in these phases:

1. Movement.
2. Investigation and item actions, including transfer and administration.
3. Communication and accusation.
4. Wait and failed-action records.
5. Relationship, belief, memory, clock, and ending consequences.

Within a phase, acting priority rotates by turn so the same NPC does not always act first. The priority order must be visible in the turn detail. If an earlier resolved action makes a later intent illegal, the later action becomes a failed-action event.

### 8.4 Evidence discovery

- Investigating the Clinic may reveal that the empty case was opened with the spare key rather than forced.
- Investigating the Storehouse reveals the antidote if it is still there and gives possession to the first investigator whose action resolves.
- Investigating the Village Square reveals no hidden physical evidence in the MVP.
- Discovering the antidote establishes its current location for the investigator but does not automatically reveal who moved it.
- Clinic key evidence supports suspicion of Orin but does not alone prove his order to Sera.

### 8.5 Public record and responsibility

- A public claim becomes part of the public record when at least one other NPC witnesses it.
- Sera's action is established when she publicly confesses to moving the antidote or when the antidote is found and both Dain's sighting and Sera's involvement have been publicly stated without a later retraction.
- Orin's order is established when he publicly confesses, or when Sera publicly identifies his order and the spare-key evidence has also entered the public record.
- An accusation without these conditions remains an allegation and cannot by itself produce an Exposed or Partially exposed truth outcome.
- A false public consensus exists when at least two NPCs publicly assign primary responsibility to Mara or Dain, neither responsible NPC's role has been established, and the false assignment remains unretracted at branch end.
- Retractions remain in the event history and remove the retracted claim from the final public consensus without erasing the original event.

### 8.6 Trust changes

Trust changes only after an observable social or consequential event. The timeline must state the reason for every change.

Required trust effects are:

- Fulfilling a prior public or private request increases the requester's trust in the helper by 10.
- Voluntarily transferring or administering the antidote to help Niko increases each witness's trust in the actor by 20.
- A claim later contradicted by direct evidence decreases each affected recipient's trust in the claimant by 20.
- A confession that exposes the confessor to personal risk increases each witness's trust in the confessor by 15, even while establishing responsibility.
- A public unsupported accusation decreases the accused character's trust in the accuser by 15.
- A publicly established deliberate deception decreases each affected recipient's trust in the deceiver by 25.
- Withholding information does not change trust unless another character becomes aware of the withholding.
- Trust values remain within -100 to +100.

All applicable effects may be combined, but the total change from one observer toward one subject is capped at 30 points in either direction per turn. The product must prioritize clarity of cause over fine-grained social simulation.

---

## 9. NPC Architecture

### 9.1 NPC composition

Each NPC is defined by:

- Identity, name, portrait, and role.
- Three stable personality traits.
- One primary and one secondary goal.
- Current location.
- Possessed items.
- Directed trust toward the other three NPCs.
- Episodic memories.
- Beliefs about scenario facts.
- Current emotional posture expressed as one of: calm, urgent, afraid, defensive, angry, or relieved.
- Current intent and inspectable rationale for the active turn.

### 9.2 Autonomy requirements

An NPC is considered autonomous in the MVP only when:

- It chooses its own action rather than following an authored action sequence.
- Its decision is based on its own goals, traits, trust, beliefs, and perceived events.
- It cannot inspect hidden world truth or other NPCs' private state.
- It can change its behavior after receiving new information.
- It can choose to lie, withhold, cooperate, accuse, investigate, or wait when those choices are legal and consistent with its perspective.
- Its rationale cites the factors that actually appeared in its decision context.

### 9.3 Personality behavior

Traits influence preference, tone, and willingness; they do not create special abilities or override legality. Stable traits do not change during the twelve-turn scenario.

### 9.4 Goal behavior

- Both goals remain visible throughout the branch.
- The primary goal normally has greater priority, but fear, trust, new evidence, or immediate opportunity may cause an NPC to serve the secondary goal temporarily.
- A character may pursue conflicting goals and should be allowed to make imperfect decisions.
- A completed or impossible goal remains visible with its status marked.

### 9.5 Emotional posture

Emotional posture summarizes the NPC's current stance for readability. It may change after important events but does not independently modify world state. The inspector must explain which recent event caused a posture change.

---

## 10. Memory Model

### 10.1 Memory purpose

Memory establishes information boundaries and makes decisions causally inspectable. It is not a general long-term-memory system.

### 10.2 Memory entry

Every memory contains:

- A unique identity.
- The NPC who owns the memory.
- The originating event and turn.
- A concise description of what the NPC perceived.
- The source: direct observation, another character, player intervention, or personal action.
- Involved characters and location.
- Visibility at the originating event: public, private, or self-only.
- Salience: ordinary, important, or critical.
- Emotional valence: positive, neutral, or negative.
- Related fact or claim identities, when applicable.

Memories are immutable. Later corrections create new memories and belief changes; they do not rewrite the original record.

### 10.3 Beliefs

Beliefs track what an NPC currently thinks about a scenario fact. Each belief includes:

- The fact or proposition.
- Current stance: believes true, believes false, or uncertain.
- Confidence from 0 to 100.
- The memories supporting that stance.
- The most recent turn on which it changed.

Conflicting memories may coexist. Trust in the source, direct observation, corroboration, and contradiction may change belief confidence. The UI must never label an NPC belief as objective truth.

### 10.4 Memory acquisition

An NPC receives a memory only when they:

- Directly observe a public or physical event at their location.
- Participate in or witness communication at their location.
- Receive a private communication.
- Perform an action.
- Experience a direct relationship or item consequence.
- Receive the player intervention.

NPCs do not learn from events in another location, private conversations they did not attend, hidden world facts, inspector usage, or events from another branch.

### 10.5 Decision relevance

The decision view presents no more than six memories as the active relevant set for an NPC's turn. Relevance prioritizes:

1. Memories directly related to the primary goal or imminent deadline.
2. Memories related to the intended target, item, fact, or location.
3. Critical and important memories.
4. Recent memories.
5. Memories involving highly trusted or distrusted characters.

The full memory history remains available in the inspector. Higher-order reflection, memory compression, and cross-session memory are out of scope.

---

## 11. Decision Cycle

Each turn follows the same product-visible cycle.

### 11.1 Observe

Each NPC receives only the current state and turn events they are entitled to perceive: current location, co-located characters, held items, patient and clock state if known, personal trust, goals, traits, beliefs, and memories.

### 11.2 Recall

Up to six relevant memories are selected and displayed as the active context for that decision.

### 11.3 Deliberate

The NPC weighs:

- Primary and secondary goal progress.
- Time remaining.
- Legal actions.
- Relevant memories and belief confidence.
- Trust toward potential collaborators or targets.
- Stable traits and current emotional posture.

Deliberation is represented to the user by a short rationale, not an unrestricted hidden monologue.

### 11.4 Select intent

The NPC selects exactly one legal intent and supplies:

- Action family.
- Target, location, item, audience, or fact as required.
- Public-facing dialogue when the action involves speech.
- A one-sentence rationale.
- The goal served.
- Zero or more cited memory identities.

### 11.5 Validate and resolve

The world checks the intent against the start-of-turn state and resolution-time state. Legal intents create events and consequences. Intents invalidated by earlier actions in the same turn create failed-action events.

### 11.6 Remember and update

Eligible witnesses receive memories. Beliefs, trust, emotional posture, goal status, and the scenario clock update. These changes are visible as consequences of their originating events.

### 11.7 Decision-quality requirements

- A rationale may not cite a memory the NPC does not own.
- A rationale may cite a goal or trait without a memory when the decision is based on stable character motivation.
- Dialogue may contain lies or uncertainty, but the authoritative event distinguishes claims from truth.
- Repeated waiting without a changed reason must be flagged as low-information behavior in evaluation.
- The product must not present internal deliberation as guaranteed factual explanation; it is the character's declared reason connected to the actual provided context.

---

## 12. Event System

### 12.1 Event principles

- Events are the authoritative history of a branch.
- Events are append-only after a turn completes.
- Every state change is attributable to at least one event.
- Events distinguish what happened, who perceived it, and what characters claimed.
- Events may link to one or more preceding causes.

### 12.2 Event contents

Every event records:

- Unique event identity.
- Branch and turn.
- Resolution phase and within-phase order.
- Event category.
- Actor and targets, if applicable.
- Location.
- Public, private, or self-only visibility.
- Human-readable description.
- Referenced facts or claims.
- Item, patient, location, belief, goal, posture, or trust changes.
- Parent event identities or cited memories establishing the causal link.
- Whether the event is marked pivotal in the final comparison.

### 12.3 Event categories

- Scenario start and clock.
- Movement.
- Investigation and evidence discovery.
- Communication and claim transmission.
- Item transfer or item discovery.
- Treatment.
- Accusation.
- Failed action.
- Trust, belief, emotional posture, and goal update.
- User intervention.
- Branch outcome.

### 12.4 Timeline presentation

- Events are grouped by turn and shown in resolution order.
- Each event has a concise collapsed summary.
- Expanding an event shows its actor rationale, cited memories, witnesses, immediate state changes, and causal predecessors.
- Public claims and verified world facts use distinct visual labels.
- Pivotal events are emphasized only after a branch completes or in the comparison view.

---

## 13. Timeline Fork Mechanism

### 13.1 Purpose

Forking demonstrates that a changed belief can cause a different story while preserving a verifiable shared history.

### 13.2 Fork eligibility

- The user may fork only from the end of a completed turn.
- Turn zero through turn ten are eligible.
- A completed or ended branch may still be forked from an eligible earlier turn.
- The MVP permits one alternate branch per session.
- The alternate branch cannot be forked again.

### 13.3 Fork creation

When the user selects **Fork from here**:

1. The product identifies the complete original state at the selected turn boundary.
2. The user selects exactly one intervention card.
3. The user selects exactly one NPC recipient.
4. The alternate branch is created with an identical historical prefix.
5. The intervention becomes the first new event after the fork boundary.
6. The recipient gains a private memory of the intervention and an associated claim or evidence record.
7. Autonomous decision-making resumes with the next turn.

### 13.4 Intervention cards

The MVP offers exactly three interventions:

| Intervention | Truth status | Content |
|---|---|---|
| Spare key clue | True evidence | “The empty case was opened with Orin's spare clinic key.” |
| Sera sighting | True observation | “Dain saw Sera leave the clinic shortly before the vial was found missing.” |
| Second-dose rumor | False rumor | “Mara hid a second antidote dose for someone else.” |

The user chooses the recipient, but cannot edit the wording or create a custom intervention.

The intervention is presented in-world to the recipient as an anonymous note and is labeled **Director intervention** only in the user's timeline. Other NPCs do not know it unless the recipient communicates it. The recipient may believe, doubt, ignore, investigate, conceal, or repeat it.

### 13.5 Branch integrity

- Original events and state never change after forking.
- The alternate branch copies all events, memories, beliefs, trust values, possessions, locations, patient state, and clock state through the selected turn.
- Branch-specific events, memories, and state never leak into the other branch.
- Switching between branch tabs is read-only and does not consume turns.
- The comparison view must verify and display the shared prefix and exact point of divergence.

### 13.6 Branch comparison

When both branches are complete, the product compares:

- Medical, truth, and social outcome labels.
- Final directed trust values.
- Final beliefs about the key facts.
- Antidote path and treatment turn.
- First event that differs after the intervention.
- Up to three pivotal causal events per branch.
- A concise narrative recap of each branch.
- A concise explanation of why the alternate branch diverged, grounded in events and memories.

Comparison language must avoid claiming that the intervention was the sole cause when later autonomous decisions also contributed.

---

## 14. UI Screens and States

### 14.1 Start screen

**Purpose:** communicate the product promise and start the single scenario.

Required content:

- Product name and one-sentence promise.
- Scenario title and a brief non-spoiler premise.
- **Begin The Last Antidote** primary action.
- **Watch recorded demonstration** secondary action when recorded mode is available.
- A brief label identifying the product as a causal narrative sandbox.

### 14.2 Scenario briefing

**Purpose:** establish stakes and cast without revealing hidden truth.

Required content:

- Niko's condition and twelve-turn deadline.
- Portrait, role, and public description for each NPC.
- Explanation that NPCs act independently and know different things.
- Explanation that the user can inspect decisions and later fork a turn.
- **Enter world** action.

### 14.3 Simulation workspace

The workspace is the primary screen and contains:

**Top bar**

- Scenario title.
- Current branch: Original or Alternate.
- Current turn and turns remaining.
- Patient status.
- Current mode: Live or Recorded.
- Branch switcher after a fork exists.

**World view**

- Three clearly labeled locations.
- NPC portraits positioned at their current location.
- Antidote location only when known in Director View or revealed as world truth.
- Current deciding/resolving/activity states.
- Visible movement and important state-change feedback.

**Timeline**

- Turn groups in chronological order.
- Expandable events.
- Current turn indicator.
- Selection of completed eligible turns for forking.
- Clear labels for facts, claims, private events, failed actions, and intervention.

**Controls**

- Step.
- Run.
- Pause.
- Restart session.
- Reveal or hide world truth.
- Fork from selected turn when eligible.

**Inspector region**

- Opens for an NPC, event, relationship, fact, or item.
- Does not navigate away from the current turn context.

### 14.4 NPC inspector

Required sections:

- Identity, role, location, posture, and possessed item.
- Stable traits.
- Primary and secondary goals with status.
- Trust toward each other NPC.
- Current beliefs with confidence and provenance.
- Relevant memories for the selected turn.
- Full chronological memory list.
- Current or historical action rationale with cited memories.

The inspector must clearly distinguish starting character definition, memory, belief, and world truth.

### 14.5 Event inspector

Required sections:

- What happened.
- Actor, targets, location, turn, and visibility.
- Declared rationale and goal served.
- Cited memories.
- Witnesses and memories created.
- Immediate state and trust changes.
- Preceding causal events.

### 14.6 Fork dialog

Required content:

- Selected turn and a summary of world state at that boundary.
- The three intervention cards with truth-status labels visible to the user.
- Four possible NPC recipients.
- Reminder that only the alternate timeline will change.
- **Create alternate timeline** confirmation.

### 14.7 Outcome and comparison screen

Required content:

- Side-by-side Original and Alternate columns.
- Medical, truth, and social outcome labels.
- Short recap for each branch.
- Shared-history marker and point of divergence.
- Antidote path and treatment timing.
- Pivotal events with causal links.
- Final trust differences.
- Key belief differences.
- **View timeline** action for either branch.
- **Start new session** action.

### 14.8 Loading, failure, and empty states

- While characters are deciding, the world remains inspectable and progress is visible.
- A single decision failure identifies the affected NPC and turn without erasing completed history.
- The user may retry the unresolved turn or switch to a recorded demonstration when available.
- A retry begins from the last completed turn boundary.
- The interface never displays a partially applied turn as complete.
- If no fork exists, comparison controls explain that an alternate timeline must first be created.

### 14.9 Accessibility and presentation

- Core information cannot rely on color alone.
- All controls and inspectors are keyboard reachable.
- Motion is supportive and may be reduced without hiding state changes.
- Text remains readable at common laptop widths.
- Portraits and visual polish must not obscure location, trust, fact, claim, or branch status.

---

## 15. Conceptual State Model

This section defines the product information that must exist. It does not prescribe storage technology, data structures, services, or frameworks.

### 15.1 Session

- Session identity.
- Scenario identity and version.
- Live or Recorded mode.
- Original branch identity.
- Optional alternate branch identity.
- Currently viewed branch and turn.
- Whether world truth is visible.
- Session status: briefing, active, paused, comparing, completed, or failed.

### 15.2 Branch

- Branch identity and label.
- Parent branch, if alternate.
- Fork turn and intervention event, if alternate.
- Current turn.
- Status: ready, deciding, resolving, paused, completed, or failed.
- Complete world snapshot at each completed turn boundary.
- Ordered event history.
- Final outcome, recap, and pivotal events when completed.

### 15.3 World

- Current turn and deadline.
- Location definitions and current occupants.
- Patient status.
- Antidote location or possessor and whether it has been used.
- Canonical scenario facts and truth values.
- Public record of claims, accusations, and established evidence.
- Acting priority for the next resolution phase.

### 15.4 NPC

- Identity, role, portrait, and public description.
- Traits and emotional posture.
- Primary and secondary goals with status.
- Current location and possessions.
- Directed relationships.
- Memories and beliefs.
- Current intent, rationale, and relevant memories.

### 15.5 Relationship

- Observer NPC.
- Subject NPC.
- Current trust value.
- Starting trust value.
- Most recent change and originating event.
- Threshold label: trusted, neutral, or distrusted.

### 15.6 Fact, claim, belief, and memory

- Facts represent canonical scenario propositions.
- Claims represent statements about facts and preserve speaker, audience, and truth status in Director View.
- Beliefs represent one NPC's current stance and confidence.
- Memories represent immutable perceived experiences with provenance.

These concepts must remain distinct in both state and UI.

### 15.7 Intent and event

- Intent is private until resolution and represents what an NPC selected.
- Event is authoritative history after resolution.
- A resolved intent may produce multiple events and consequence updates.
- A failed intent produces a failed-action event but no prohibited state change.

### 15.8 Outcome

- Medical outcome.
- Truth outcome.
- Social outcome.
- Treatment turn, if any.
- Final antidote state.
- Final trust and belief snapshot.
- Short recap.
- Up to three pivotal events.

---

## 16. Acceptance Criteria

### 16.1 Scenario and world

1. Starting a new session always creates the four specified NPCs, three locations, twelve-turn clock, starting knowledge, starting trust, and hidden antidote state defined in this PRD.
2. The initial briefing does not reveal the hidden causal chain.
3. The world contains exactly one usable antidote.
4. Niko is saved only when that antidote is administered at the Clinic by turn twelve.
5. Every branch ends with one medical, truth, and social outcome label.

### 16.2 Autonomous decisions

6. Every active NPC selects no more than one intent per turn.
7. All four NPCs decide from the same start-of-turn world boundary and cannot observe unpublished intents.
8. Every selected intent belongs to one of the seven legal action families.
9. Every intent identifies the goal it serves and includes a concise rationale.
10. Any cited memory exists, belongs to the acting NPC, and was available before the decision.
11. NPC dialogue may lie, but dialogue alone never changes authoritative world truth.
12. An illegal or invalidated intent creates a visible failed-action event and does not corrupt state.

### 16.3 Information boundaries and memory

13. An NPC receives no memory of an unwitnessed event in another location.
14. A private communication creates memories only for its participants.
15. A public communication creates memories for all NPCs present.
16. Memories remain unchanged after creation.
17. A later contradiction creates a new memory and may update belief confidence without rewriting history.
18. The decision inspector shows no more than six relevant memories while the full memory list remains accessible.
19. Beliefs, claims, memories, and world truth are visually and semantically distinct.

### 16.4 Events and causality

20. Every location, item, patient, trust, belief, posture, or goal change is connected to an event.
21. Timeline events appear in turn and resolution order.
22. Expanding a consequential event shows its rationale, witnesses, cited memories, immediate changes, and causal predecessors.
23. Trust never changes silently and never leaves the -100 to +100 range.
24. Completed turns cannot be partially altered or reordered.

### 16.5 Controls and usability

25. Step advances exactly one complete turn.
26. Pause leaves the branch at a completed turn boundary.
27. Run stops automatically when the branch reaches its outcome.
28. Inspecting characters, facts, memories, relationships, or prior events does not advance time.
29. A first-time user can identify the current turn, patient state, three locations, four NPC locations, and current branch from the main workspace.
30. The product clearly labels Live and Recorded modes.

### 16.6 Timeline fork

31. The user can fork from the end of any completed eligible turn from zero through ten.
32. Creating a fork requires exactly one intervention card and one NPC recipient.
33. The original branch remains unchanged after the fork.
34. Both branches have identical events and state through the fork boundary.
35. The intervention is the first branch-specific event and creates a memory only for the selected recipient.
36. Events, memories, beliefs, and state created after the fork remain isolated to their branch.
37. A session cannot create a second alternate branch or fork the alternate branch.

### 16.7 Comparison

38. When both branches complete, the comparison screen shows both sets of outcome labels and recaps.
39. The comparison identifies the shared prefix, intervention, first divergent event, antidote path, final belief differences, and final trust differences.
40. Each branch displays no more than three pivotal events, each linked to real timeline events.
41. The divergence explanation is grounded in recorded events and memories and does not invent causes.

### 16.8 Reliability and demo readiness

42. Retrying a failed unresolved turn begins from the last completed turn boundary.
43. No failure path presents a partially resolved turn as completed.
44. A full recorded Original and Alternate demonstration can be completed without external decision generation and is clearly labeled Recorded.
45. The product supports a complete start-to-comparison journey without free-text input.
46. At least one approved demonstration pair produces a visible difference in either medical outcome, truth outcome, or social outcome within five turns after the intervention.
47. In the approved demonstration pair, the comparison can trace that difference through the intervention, at least one changed NPC belief, and at least one changed NPC action.

---

## 17. Story Quality Evaluation

Before release, at least five complete live or candidate runs must be reviewed using the following rubric:

| Dimension | Pass condition |
|---|---|
| Causality | Major actions can be explained by available goals, trust, beliefs, and memories. |
| Information integrity | No NPC acts on hidden or unwitnessed information. |
| Consequence | The timeline contains meaningful changes beyond dialogue. |
| Character distinction | At least three of four NPCs demonstrate behavior recognizably consistent with their different goals or traits. |
| Progression | The crisis escalates or moves toward resolution rather than remaining static. |
| Completion | The run reaches a coherent medical and social outcome. |
| Inspectability | A reviewer can trace at least one multi-event causal chain without external explanation. |

Release requires:

- No information-integrity failures in the approved demonstration pair.
- No invalid state in any accepted run.
- At least four of five reviewed runs passing all dimensions.
- A recorded Original and Alternate pair satisfying acceptance criteria 46 and 47.

---

## 18. Explicitly Out of Scope

The following are not part of the MVP and must not be treated as implied requirements:

- Additional scenarios, scenario editor, or user-authored characters.
- More than four autonomous NPCs.
- Dynamic maps, continuous movement, navigation, or pathfinding.
- Combat, health systems beyond Niko's scenario state, inventory systems, crafting, currency, or economy.
- Romance systems or relationship dimensions beyond directed trust.
- Player-controlled avatar or direct NPC control.
- Unlimited or free-text interventions.
- General chat with NPCs.
- Multiple simultaneous interventions.
- More than one alternate branch or a branch tree.
- Editing, deleting, or reordering completed events.
- Cross-session memory, campaigns, or persistent worlds.
- Higher-order reflection, dream, planning hierarchy, or memory summarization systems.
- Procedurally generated plots, locations, facts, or endings.
- Voice input, text-to-speech, lip synchronization, or generated video.
- Multiplayer, collaboration, accounts, profiles, authentication, cloud saves, or sharing.
- Mobile-specific experience.
- Localization.
- Analytics dashboards or creator exports.
- Modding, plug-ins, or external game-engine integration.
- A single numeric story-quality or player score.
- A claim that NPC rationales expose private model reasoning; only concise declared reasons are shown.

---

## 19. Risks and Product Responses

| Risk | Product impact | Required response for MVP |
|---|---|---|
| NPCs produce polite but uneventful dialogue | The experience does not demonstrate emergence | Preserve the deadline, hidden item, competing goals, physical investigation, and consequential actions; reject scope changes that weaken pressure. |
| NPC behavior appears arbitrary | Users cannot trust or understand the result | Require every consequential action to identify its served goal and available memory evidence. |
| Characters gain impossible knowledge | The simulation loses credibility | Enforce perception boundaries and include information integrity in acceptance testing. |
| False claims are mistaken for truth | The UI misrepresents the story state | Distinguish world facts, claims, beliefs, and memories everywhere they appear. |
| Forks diverge for reasons unrelated to the intervention | The central proof becomes weak | Preserve the exact historical prefix and ground comparison language in changed beliefs and events rather than claiming deterministic causation. |
| Both branches finish similarly | The demo lacks payoff | Maintain an approved recorded branch pair and choose an intervention/recipient combination that creates a traceable difference. |
| Live decisions are slow or unavailable | The live demo stalls | Keep progress visible, allow retry from the last completed turn, and provide a clearly labeled recorded demonstration. |
| Explanations become verbose | The story feed becomes unreadable | Use one-sentence rationales, collapsed event summaries, and progressive disclosure through inspectors. |
| Too much creator information spoils the story | Player surprise is reduced | Hide world truth during briefing and make later Director View disclosure explicit. Inspectability takes priority over spoiler-free play. |
| UI polish competes with causal clarity | A visually rich demo remains confusing | Prioritize state, branch, fact/claim, and causal legibility over animation or decorative assets. |
| Product is perceived as another AI NPC demo | Originality score suffers | Make fork-and-compare and causal inspection the hero experience in the UI, README, and video. |

---

## 20. Milestones

Milestones describe product-complete behavior, not implementation tasks or technology choices.

### Milestone 0 — Specification lock

**Target:** Day 1, hour 1  
**Exit criteria:**

- This PRD is accepted as the authoritative MVP contract.
- Scenario facts, characters, actions, outcomes, and out-of-scope boundaries are unchanged unless documented as a product decision.
- The approved demonstration intervention and expected causal proof are identified.

### Milestone 1 — Authoritative world

**Target:** Day 1, hour 4  
**Exit criteria:**

- The complete starting world can be represented.
- All seven action families and resolution phases follow the specified rules.
- A twelve-turn branch can reach valid medical, truth, and social outcomes without autonomous decision generation.
- Completed turn boundaries can be restored without changing prior events.

### Milestone 2 — Autonomous baseline

**Target:** Day 1, hour 7  
**Exit criteria:**

- Four NPCs complete observe-decide-resolve cycles while respecting information boundaries.
- Actions create inspectable events, memories, beliefs, and trust changes.
- One complete Original branch reaches a coherent outcome.
- Illegal and failed actions cannot corrupt the world.

### Milestone 3 — Legible playable experience

**Target:** Day 1, hour 10  
**Exit criteria:**

- A user can complete the start, briefing, workspace, inspection, and outcome journey.
- Step, run, pause, restart, and truth reveal behave as specified.
- An action can be traced from goal and memory to event and consequence.
- One successful run is preserved for Recorded mode.

### Milestone 4 — Causal fork

**Target:** Day 2, hour 3  
**Exit criteria:**

- The user can create one alternate timeline from an eligible completed turn.
- All branch-integrity acceptance criteria pass.
- The intervention changes the recipient's memory and may change later decisions.
- Original and Alternate timelines can be viewed independently.

### Milestone 5 — Comparison and quality gate

**Target:** Day 2, hour 6  
**Exit criteria:**

- Both branches receive outcome labels and recaps.
- Comparison identifies shared history, divergence, belief changes, trust changes, antidote path, and pivotal events.
- The story-quality release requirements pass.
- The approved recorded demonstration pair satisfies acceptance criteria 46 and 47.

### Milestone 6 — Demo-ready release

**Target:** Day 2, hour 9  
**Exit criteria:**

- The complete journey is understandable without developer narration.
- Loading, retry, recorded, and failure states are clear.
- Accessibility and laptop-width presentation requirements pass.
- No out-of-scope feature is required to complete the main journey.
- The product is ready to record as a sub-three-minute demonstration.

---

## 21. Final MVP Definition of Done

Forked Fates is MVP-complete only when a user can begin The Last Antidote, observe four autonomous characters complete a valid story, inspect why a consequential action occurred, fork a prior completed turn, disclose one specified fact or rumor to one NPC, complete the alternate story, and compare two outcomes through a causal chain grounded in recorded memories and events.

Anything that does not improve the clarity, reliability, or emotional impact of that journey is secondary to the MVP.
