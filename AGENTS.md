# Forked Fates Engineering Context

Work only inside this repository. Treat `docs/PRODUCT_SPEC.md` as the product authority and `docs/BUILD_STRATEGY.md` as the implementation-order authority. If they conflict, the product specification controls.

Before changing behavior:

1. Identify the current phase and its unmet verification criteria.
2. Preserve every earlier demo checkpoint.
3. Implement only the smallest complete vertical slice for that phase.
4. Keep Recorded mode available; Live mode may be added beside it, never in place of it.
5. Verify information boundaries, authoritative events, completed-turn integrity, and the current demo path.

Non-negotiable invariants:

- Exactly four decision-making NPCs, three locations, one antidote, and no more than twelve turns.
- No NPC sees hidden world truth, another NPC's private state, an unwitnessed event, or an unpublished intent.
- Facts, claims, beliefs, memories, and world truth remain distinct.
- Only world rules change authoritative state; every state change has an event.
- Completed branch history is append-only and completed turns are atomic.
- A fork preserves the Original, copies an identical prefix, adds exactly one intervention for one recipient, and never leaks post-fork state.
- Consequential decisions identify a served goal, concise declared rationale, and only memories owned before the decision.
- The patient always receives a medical outcome by the end of turn twelve.
- Do not expand MVP scope beyond the authoritative documents.

Use checkpoint names in the form `phase-N-DL-short-description`, where `N` is the completed phase and `DL` is the strongest passing demo level (`planning`, `D0` through `D6`). A checkpoint name describes verified behavior, not work in progress.

Phase 0's approved Recorded pair and proof contract are in `docs/EXECUTION_CONTRACT.md`. The current demonstration script is in `docs/DEMO_SCRIPT.md`, and acceptance ownership is in `docs/ACCEPTANCE_MAP.md`.
