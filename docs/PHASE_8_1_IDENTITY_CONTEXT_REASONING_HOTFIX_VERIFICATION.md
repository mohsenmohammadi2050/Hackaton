# Phase 8.1 Identity, Context Freshness, and Reasoning Hotfix Verification

## Scope

This checkpoint combines the duplicate-event identity hotfix, turn-context freshness addendum, and reasoning/agent-knowledge audit. It changes AI Live boundary behavior only. Recorded data, the deterministic provider and NPC policies, the Decision Layer, and the World Engine remain unchanged.

## Root cause and identity correction

The exact collision source was the old AI path's trust in the model's intent `id`. Every main action event is created by the World rule `evt-world-${intent.id}`. The real model reused `world-dain-investigate-square` on consecutive turns, so Turn 2 attempted to create the already committed `evt-world-world-dain-investigate-square`.

The model never directly created an event, but its untrusted intent ID controlled the uniqueness suffix. AI Live now overwrites `id`, `actorId`, and `chosenAtTurn` from the frozen boundary before authoritative validation. The deterministic application-owned intent identity is:

```text
ai-tTT-actor-action-semantic-target
```

The established World event and branch-scoping rules then produce the final identity. No timestamp, UUID, random value, or process counter is used.

The focused consecutive-turn regression produces:

```text
evt-world-ai-t01-dain-investigate-square
evt-world-ai-t02-dain-investigate-square
```

Recorded and deterministic-authored identities are not migrated. Alternate prefix records continue to use the approved branch-specific identities with exact Original `sourceId` alignment; changing them to shared raw IDs would violate the approved Phase 7 identity contract.

## Frozen-boundary and transaction findings

`World.resolveTurn` clones the supplied frozen boundary before setting `status: resolving` or appending events. A simulated duplicate during Turn 2 left the completed Turn 1 object byte-identical. AI Live now catches post-validation World exceptions as `WORLD_RESOLUTION_ERROR`, explains that the unresolved turn was not committed, and preserves the adapter at its current completed boundary. `Retry AI Live` regenerates the unresolved batch instead of restarting at Turn 0.

## Error classification

| Category | Examples | Browser title |
|---|---|---|
| `AI_PROVIDER_ERROR` | HTTP, timeout, transport, structured-output/reasoning capability | AI provider error |
| `INTENT_VALIDATION_ERROR` | malformed JSON intent, illegal field/action/target after retries | Intent validation error |
| `WORLD_RESOLUTION_ERROR` | authoritative resolution or integrity exception | World resolution error |
| `PRESENTATION_ERROR` | unclassified render/presentation failure | Presentation error |

No browser error includes a stack trace, request header, key, or private prompt.

## Turn-context freshness audit

The request path is:

```text
latest timeline state
  -> restore latest completed boundary
  -> create Decision Layer owned projection
  -> add AI-only scenario, observations, and prior-result continuity
  -> freeze projection
  -> make a fresh four-agent provider batch
```

There is no cached projection or presentation snapshot in this path. A retry within an unresolved turn uses identical frozen state but makes a new provider call.

### Deterministic two-turn audit

| Actor | Turn 1 decision | Turn 2 decision | Turn 2 owned changes |
|---|---|---|---|
| Mara | Investigate `empty-case` | Investigate `empty-case` | New owned investigation memory, key-case belief, witnessed result, previous action/result, turn and horizon |
| Dain | Investigate `square` | Investigate `square` | New owned investigation memory, no-evidence belief, witnessed result, previous action/result, turn and horizon |
| Sera | Move to `storehouse` | Move to `square` | Current location, movement memory/observation, previous movement result, turn and horizon |
| Orin | Move to `storehouse` | Move to `square` | Current location, movement memory/observation, previous movement result, existing owned spare-key inventory, turn and horizon |

Separate authored-boundary tests prove changed directed trust (`Mara -> Orin` becomes `-25`) and changed inventory (Orin owns the antidote after Turn 5) are present in the next projection.

For the historical real-provider run, Dain is proven identical at action and subject level (`Investigate` + `square`). The old diagnostics did not preserve enough safe metadata to determine whether his rationale/evidence, or the other three actors' targets/rationales/evidence, were identical. New diagnostics include semantic target, served goal, cited-memory IDs, rationale fingerprint, prior-result summary, and projection fingerprint, so the next real run can answer that without exposing prompts.

## Agent knowledge contract audit

Each actor receives its own name, role, traits, posture, goals/status/priorities, trust, beliefs, inventory, relevant owned memories, witnessed observations, current and known locations, co-located public identities, legal actions/targets, resolution priority, scenario premise, urgency, safe rules, previous semantic action, and authoritative previous result.

Tests prove another actor's private memory and unwitnessed event do not appear. An Alternate information intervention changes Mara's branch-local projection and fingerprint while the private intervention memory remains absent from Dain's projection.

## Reasoning audit

Reasoning was previously **not enabled**: no `reasoning` parameter was sent. The model name alone did not activate it.

New optional configuration:

```env
AI_REASONING_ENABLED=true
AI_REASONING_EFFORT=medium
```

When enabled, the outgoing request contains `reasoning: { effort: "medium", exclude: true }` beside strict `response_format.type: "json_schema"`. OpenRouter continues to receive `provider.require_parameters: true`. A `400` or `422` for that combined capability produces `AI_REASONING_UNSUPPORTED`; the request is not retried without reasoning or schema enforcement.

Diagnostics truthfully report provider/model, reasoning requested state, effort, supported `true/false/unknown`, latency, and reasoning token count when supplied. Mocked `reasoning` and `reasoning_details` secrets are proven absent from output and logs. No reasoning trace enters an intent, World state, memory, audit, or browser response.

## Safe diagnostic fields

- branch ID, resolving turn, actor, application attempt, and transport attempt;
- selected action and safe semantic target IDs;
- served goal and cited owned-memory IDs;
- previous authoritative result summary;
- SHA-256 owned-projection and rationale fingerprints;
- projection-differs-from-previous-turn status;
- validation error, normalized response field names, and latency;
- model and safe reasoning metadata.

Keys, Authorization headers, secret environment values, full prompts, raw rationale text, and reasoning traces are excluded.

## Model–engine boundary

The detailed contract is in `docs/AI_AGENT_CONTRACT.md`. Models choose semantics only. The validator enforces the supplied action/ownership contract. The World Engine alone determines resolution, consequences, authoritative events, causal references, and mutations.

## Automated coverage

The new focused test file covers consecutive and non-consecutive repeats, deterministic rerun, same-turn same-action actors, multi-event uniqueness, branch scoping/source alignment, atomic duplicate failure, retry, system-owned metadata, illegal semantics, real-AI-shaped batches, current-boundary projection construction, every required owned-state field, prior action/result, privacy, fingerprints, stale-cache prevention, fresh retry batches, context-sensitive decisions, intervention isolation, reasoning enabled/disabled/unsupported/coexisting, chain-of-thought exclusion, diagnostic truthfulness, error classification, and World authority.

No test requires a provider key. Real OpenRouter Turns 1–3 and an Alternate acceptance flow remain manual acceptance work before moving or creating a release tag.

Final automated verification at this checkpoint:

- `npm.cmd run check`: passed;
- focused AI identity/context/reasoning plus compatibility/workspace suites: 57 passed;
- `npm.cmd test`: 174 passed, 0 failed;
- `npm.cmd run demo:search`: passed; the approved Turn 0 Mara intervention remains the strongest visible divergence candidate.
