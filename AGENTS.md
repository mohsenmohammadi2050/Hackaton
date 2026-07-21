# Forked Fates Engineering Context

Work only inside this repository. Read `README.md`, `docs/architecture/SYSTEM_ARCHITECTURE.md`, and `docs/demo/DEMO_GUIDE.md` before changing behavior.

Preserve these invariants:

- Recorded Demo is immutable authored data and remains independently executable.
- World Engine is the sole authority for consequences and state mutation; every state change has an event.
- Exactly four decision-making NPCs, three locations, one antidote, and no more than twelve turns exist in the current scenario.
- No NPC sees hidden world truth, another NPC's private state, an unwitnessed event, or an unpublished intent.
- Facts, claims, beliefs, memories, and world truth remain distinct.
- Completed branch history is append-only and completed turns are atomic frozen boundaries.
- A fork preserves the Original, clones an identical prefix, creates branch-local identities and objects, accepts exactly one typed intervention, and never leaks post-fork state.
- Models choose only legal intents. Validators enforce legality and the World Engine determines outcomes.
- Consequential decisions identify a served goal, concise declared rationale, and only memories owned before the decision.
- The patient always receives a medical outcome by the end of turn twelve.

Keep changes minimal and verified. Do not add roadmap features without an explicit product request. Run `npm.cmd run check`, `npm.cmd test`, and `npm.cmd run demo:search` before committing.
