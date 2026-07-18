# Forked Fates Architecture Review Package

**Audit snapshot:** `0635ad1` (`phase-7-D2-isolated-timeline-fork-engine`)  
**Prepared:** 2026-07-18  
**Scope:** Architecture through Phase 7; no Phase 8 behavior

This directory is a self-contained review package for an external technical audit.

## Contents

- [ARCHITECTURE.md](ARCHITECTURE.md) — system layers, data flow, lifecycles, principles, and extension points.
- [SYSTEM_DIAGRAM.md](SYSTEM_DIAGRAM.md) — dependency, turn, and fork diagrams in Mermaid.
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) — repository tree and module ownership.
- [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md) — prioritized debt and production risks.
- [VERIFICATION_INDEX.md](VERIFICATION_INDEX.md) — completed phases, evidence, tests, and guarantees.
- [ENGINEERING_ASSESSMENT.md](ENGINEERING_ASSESSMENT.md) — answer to the production-readiness question.
- [CORE_EXPORT_MANIFEST.md](CORE_EXPORT_MANIFEST.md) — integrity manifest for the exported core source snapshot.
- `core/` — exact copies of the six requested core architecture files.

## Authorities

Product behavior is governed by [`../PRODUCT_SPEC.md`](../PRODUCT_SPEC.md). Build order and checkpoint policy are governed by [`../BUILD_STRATEGY.md`](../BUILD_STRATEGY.md). Stable story and causal identities originate in [`../EXECUTION_CONTRACT.md`](../EXECUTION_CONTRACT.md).

This package documents the approved implementation. It does not change runtime behavior or introduce a feature.
