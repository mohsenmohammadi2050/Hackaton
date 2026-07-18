# Engineering Assessment

## Question

> If you inherited this project today from another engineer, what would concern you the most before taking it into production?

## Answer

My primary concern would be that the project's strongest promise—**causal and branch integrity**—depends on an implicit, handwritten graph schema.

The implementation is disciplined for its current scope: state is frozen, Original replay is hash-pinned, World is authoritative, owned-state boundaries are tested, Alternate objects are deep-cloned, and 67 tests prove the known story. The weak point is not the demonstrated behavior. It is safe evolution of that behavior.

Identities and references appear in many forms: event IDs and causes, memory IDs and origin events, created and cited memories, belief support, public-record event links, intent/audit IDs, boundaries, outcomes, and `sourceId` alignment. Fork cloning remaps these fields manually. If a future engineer adds one reference-bearing field and forgets the remapper or validator, the system can still run while an Alternate silently points into Original history. That failure would directly invalidate comparison and the product's central proof.

Before production I would require:

1. A versioned machine-readable schema or centralized identity/reference registry.
2. A reusable graph validator proving every branch-local reference resolves inside its own branch or to an explicitly allowed scenario identity.
3. Property and mutation tests that add, remove, and corrupt references rather than testing only the approved story.
4. Canonical serialization plus migration/version rules for persisted timelines.
5. Atomic durable storage so a validated frozen boundary is also a recoverable production checkpoint.

Immediately after that, I would address the real-provider boundary: asynchronous execution, timeouts, actor-scoped context isolation, privacy, cost controls, and structured operational errors. I would not connect an external model to the current synchronous adapter and call it production-ready.

In short: **the current system is well verified as a compact, in-memory causal simulation, but production safety requires making its causal schema explicit and enforceable outside the known fixtures.**
