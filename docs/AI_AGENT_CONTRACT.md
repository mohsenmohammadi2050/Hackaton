# AI Agent Knowledge and Control Contract

**Status:** Phase 8.1 hotfix architecture contract
**Scope:** AI Live only; Recorded playback and deterministic policy replay are unchanged

## Control boundary

### Model owns

The model selects exactly one intent from the supplied legal action space. It may select the legal action, target, subject, location, served owned goal, concise declared rationale, and up to six supplied owned memories as evidence.

The model does not own actor identity, branch identity, turn identity, intent identity, event identity, consequences, or state mutation. AI Live overwrites model-supplied `id`, `actorId`, and `chosenAtTurn` from the frozen authoritative boundary before normal validation.

### Validator owns

The provider schema permits only action-specific fields. The Decision Layer then validates actor ownership, current-boundary turn, owned goals and memories, legal action families, targets, items, locations, facts, claims, and communication visibility. Malformed or illegal responses are rejected with bounded retry feedback before World resolution.

### World Engine owns

The World Engine remains the sole authoritative resolver. It owns simultaneous phase ordering, action success or failure, locations, inventory, memories, beliefs, trust, patient state, antidote state, public record, outcomes, authoritative events, causal references, and terminal state. A model intent cannot directly provide `changes`, create a World event, or mutate state.

## Owned knowledge projection

Every AI request is rebuilt from the latest completed frozen World boundary. It contains:

- scenario and branch identity, completed turn, turns remaining, patient status, known locations, and legal action vocabulary;
- the actor's name, role, traits, posture, active goals, directed trust, beliefs, inventory, and current location;
- public character identities and currently co-located characters, without their private state;
- at most six deterministically selected memories owned by the actor;
- up to eight sanitized authoritative events the actor actually witnessed;
- the actor's previous semantic action and its authoritative result, including resulting location and inventory;
- current action-specific legal options and resolution priority;
- the public premise, urgency, and safe World rules needed to understand the scenario.

It never contains another actor's private memories, beliefs, trust, invisible inventory, unwitnessed events, hidden World truth, full World state, boundaries, outcomes, or another branch's post-fork state.

## Identity and continuity

AI intent metadata is stamped deterministically as:

```text
ai-tTT-actor-action-semantic-target
```

The World Engine applies its established `evt-world-` and branch-scoping rules. Turn identity prevents repeated semantic actions from colliding. Alternate post-fork records remain branch-scoped; copied prefix records preserve exact Original alignment through validated `sourceId` links.

Retries regenerate provider calls from the same frozen boundary. Nothing is appended until all four intents validate and the World resolves the cloned boundary successfully.

## Reasoning contract

Reasoning is explicit configuration, not inferred from the model name:

```env
AI_REASONING_ENABLED=true
AI_REASONING_EFFORT=medium
```

When enabled, the compatible request includes:

```json
{
  "reasoning": {
    "effort": "medium",
    "exclude": true
  }
}
```

OpenRouter requests also require support for all requested parameters. Unsupported reasoning plus strict structured output fails explicitly; neither parameter is silently removed and deterministic policies are never substituted.

The prompt asks the model to reason internally and return only the strict intent JSON with its concise `rationale`. Raw `reasoning`, `reasoning_details`, and private chain-of-thought are not returned to the browser, stored in World state, or logged. Development diagnostics may record requested/supported status, effort, latency, reasoning-token counts, and one-way fingerprints.
