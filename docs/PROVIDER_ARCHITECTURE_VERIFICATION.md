# Provider Architecture Verification

**Checkpoint:** `phase-4-D2-provider-architecture`  
**Scope:** Provider abstraction after approved Phase 4; no Phase 5 or branching behavior  
**Reference checkpoint:** `phase-4-D2-four-autonomous-npcs` (`fe8e799`)  

## Result

The Decision Layer now requests one intent through a versioned Provider protocol. It no longer imports, indexes, or invokes NPC policies directly. The existing rule policies are wrapped by `DeterministicProvider`; `LLMProvider` is a vendor-neutral, API-free adapter whose invocation function is supplied by configuration.

The runtime dependency direction is:

```text
Decision Layer -> Provider protocol -> configured decision implementation
       |
       +--------> unchanged Authoritative World Engine

Recorded Layer ---------------------> unchanged Presentation Layer
```

Neither provider implementation is reachable from the World Engine or Recorded playback. A provider receives an actor identity, that actor's frozen owned-state projection, the retry attempt, and the output contract. It does not receive authoritative state, another NPC's private state, or unpublished intents.

## Architectural decisions

1. **A small versioned protocol instead of a vendor SDK.** `forked-fates-decision-provider-v1` is the only Decision Layer/provider handshake. This keeps GPT, Claude, local, mock, and future implementations outside World and Decision orchestration.
2. **Configuration owns provider selection.** `createProvider({ type: "deterministic" })` selects the approved rule policies. Changing only the configuration to `{ type: "llm", vendor, model, invoke }` swaps the decision source.
3. **The deterministic adapter delegates without translation.** It calls the approved NPC policy with the same projection and `{ attempt }` context used at the Phase 4 checkpoint. It adds no story logic and does not modify policy output.
4. **The LLM adapter has no transport.** It describes the provider, model, request, and output contract, then delegates to an injected invocation function. It imports no SDK, makes no network request, and owns no credentials.
5. **Validation and retry stay in the Decision Layer.** Provider output remains an untrusted JSON string. Existing malformed-output, rejected-output, resolution-invalid, and frozen-boundary retry semantics are unchanged.
6. **Provider metadata is excluded from simulation results.** Audits, intents, events, memories, boundaries, and outcomes keep the approved Phase 4 serialized shape, allowing exact replay comparison.

## Verification evidence

| Requirement | Verification | Result |
|---|---|---|
| Decision Layer uses only Provider | Source-boundary test requires `provider.decide` and rejects policy imports, agent maps, and non-providers. | Pass |
| Deterministic behavior is byte-identical | Full 12-turn serialized run SHA-256 remains `f563c2b79ebb8466b7064671f69ef617c47eeb45ab105a5b306e39edd2ce4fb7`. | Pass |
| Existing policies contain no new story logic | `npc-agents.js` retains approved SHA-256 `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704`. | Pass |
| World is unchanged | `world-engine.js` retains approved SHA-256 `6bdd5132d95088250b79e18e376748cc7a4301ee2e94c9c0ab35f07b1e4ee025`. | Pass |
| Recorded playback is unchanged | Recorded data, app, HTML, and CSS retain their approved hashes; all Recorded navigation tests pass. | Pass |
| Provider swap is configuration-only | Factory tests instantiate deterministic, OpenAI/GPT, Anthropic/Claude, and local configurations without modifying Decision or World code. | Pass |
| Mock LLM obeys the same contract | API-free mock receives 48 frozen owned-projection requests and delegates them through the adapter; its complete result deep-equals and hash-matches deterministic replay. | Pass |
| Previous behavior remains valid | Syntax checks pass and the complete suite passes: 47 tests, 0 failures. | Pass |

## Intentionally deferred technical debt

- The provider contract is synchronous to preserve the approved simulation API and exact replay shape. Real remote inference will require an asynchronous orchestration boundary before it is enabled.
- The LLM adapter deliberately has no HTTP transport, SDK, credentials, prompt templates, timeouts, rate-limit handling, token accounting, or vendor-specific error mapping.
- The output-contract summary and the detailed Decision Layer validator are separate declarations. They must be consolidated into a shared schema before accepting external model traffic.
- Provider protocol version strings are intentionally duplicated at the two sides of the boundary so the Decision Layer does not import a concrete provider module. A future protocol package may centralize this if more consumers appear.
- The mock demonstrates contract compatibility, not model quality, nondeterminism controls, latency, or provider availability.
- A configured invocation function must remain stateless between NPC calls or enforce actor-scoped context; transport-level context isolation is not yet implemented.

## Readiness for Fork and Intervention

The abstraction is ready to support later branching work without changes to the Decision Layer or World resolver:

- the owned projection already carries the authoritative `branchId` and completed boundary turn;
- provider implementations receive only the projection created for the current actor;
- provider selection is independent of branch state and World resolution;
- intervention effects can enter a recipient's authoritative owned state before projection, rather than becoming provider-specific prompt logic;
- deterministic and mock providers can serve as reproducible branch-test fixtures.

Branch creation, intervention application, alternate histories, timeline editing, comparison, and Live UI are not implemented. Phase 6 must still prove prefix identity, branch isolation, exactly one recipient intervention, no post-fork leakage, and safe provider context isolation.
