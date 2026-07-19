# Phase 8 Demo-Ready Product Verification

## Result

Phase 8 delivers the complete Live product journey beside the unchanged Recorded Original. The authoritative layers and scenario/Recorded assets remain byte-for-byte identical. The browser UI reaches a validated side-by-side comparison without direct World mutation or direct policy access.

## Checkpoints

| Checkpoint | Commit message | Verified behavior |
|---|---|---|
| A | `feat: phase-8-D0-presentation-integration-boundary` | Adapter-only presentation boundary, frozen view models, pure validated comparison, deterministic demo config/search. |
| B | `feat: phase-8-D1-live-fork-intervention-journey` | Mode choice, Live workspace, playback, inspectors, fork, typed intervention, Alternate continuation, branch switching, recovery UI. |
| C | `feat: phase-8-D2-demo-ready-product` | Comparison hardening, accessibility/responsive verification, demo/architecture documentation, final regression evidence. |

## Protected artifacts

The Phase 8 test suite pins these approved SHA-256 values:

| Artifact | SHA-256 |
|---|---|
| `world-scenario.js` | `8ec05d2924a05415613f4ee4a1b22b69f3aa7ee6040f7a210f048aeb19123abd` |
| `world-engine.js` | `06122c845a42f4711ddbd997c6c399d56feadad83e062b97376a841bed6d480d` |
| `decision-layer.js` | `e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155` |
| `decision-providers.js` | `b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f` |
| `npc-agents.js` | `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704` |
| `intervention-layer.js` | `6049a340aeafb9499f58dd22235ecd798e31a7b23548e820ffd30f9ccdacd00a` |
| `timeline-fork-engine.js` | `544f5ba5f38d7d1d07e4fb01923e1b893d3565b951ee1edcf2c979262c10c96f` |
| `timeline-integrity.js` | `78d322ec63178493748c88191f2912758d8f8f1f1c578da9f8413e6b63caae72` |
| `recorded-data.js` | `365e724d551eab0e78299e70e748616f667815b34c92cb033f0e0b2b88065a62` |

## Determinism

- Approved autonomous Original replay SHA-256: `6d9dfe9b9f628bf83a4f8fda4d39452260872c978335ddf7caabb9eb44a2501f`.
- Approved completed Alternate timeline SHA-256: `73e88589d7d5fcf8554ad69a2fe64137386402143c878a859dc793251da98e5a`.
- Original is generated twice and compared deeply by Phase 8 tests.
- The approved Alternate was generated twice independently; both serializations produced the same hash above.
- `validateTimelineSession` passes before every comparison.

## Automated verification

Final declared commands:

```text
npm run check
npm test
npm run demo:search
```

The complete suite contains **107 tests**, all passing. This includes the original 97 Phase 7.1 tests plus 10 Phase 8 integration/presentation tests. Coverage added in Phase 8 includes:

- every protected hash;
- adapter-generated Original determinism and integrity;
- one-boundary-at-a-time playback and historical seeking;
- owned NPC memory/belief view models and immutability;
- approved intervention decision/outcome divergence;
- pure deterministic comparison and causal-edge labels;
- corruption rejection before comparison;
- graceful fork/intervention failures without Original mutation;
- browser load order and adapter-only presentation coupling;
- presence of playback, fork, three intervention categories, branch switching, comparison, causal navigation, and Recorded fallback controls.

## Recorded regression

All 19 Recorded tests pass unchanged in behavior: Start, Briefing, Workspace, Step, Run, Pause, historical turn inspection, NPC/event inspectors, completed outcome, and Restart. The real application harness supplies only `recorded-data.js`; it does not load any Live global, proving the Recorded journey still executes independently.

## Browser verification

The local static build was exercised in the in-app browser:

1. Start → Live Briefing → Live turn 0.
2. Step to a complete turn and inspect an event.
3. Fork turn 0 and inspect the intervention composer.
4. Apply the approved Information event and confirm the post-intervention boundary.
5. Resolve and play the Alternate to **Lost / Obscured / Fractured**.
6. Switch to and complete Original at **Lost / Exposed / Fractured**.
7. Open comparison and inspect outcome, decision, trust, antidote, and causal-support views.
8. Exercise the Recorded fallback and responsive narrow viewport.

Browser checks found and corrected two presentation-only defects before checkpointing: the first event in a noninitial boundary was omitted by an incorrect event-index comparison, and comparison attempted to sort a frozen causal-support array in place.

## Accessibility and resilience

- Semantic headings, regions, labels, tabs, dialogs, buttons, and live announcements are present.
- Every interaction has a native keyboard-focusable control and a visible `:focus-visible` treatment.
- Status announcements cover initialization, step completion, pause, fork, intervention, branch switch, comparison, completion, and error.
- Reduced-motion media rules collapse all animations and transitions.
- Layouts reflow at 1180, 900, 820, 620, and 520 pixels.
- Live startup/resolution errors preserve the last frozen boundary and offer Retry or Recorded fallback.

## Architectural decisions

1. `app.js` remains the Recorded controller and top-level mode router, preserving the existing Recorded implementation.
2. `live-presentation.js` owns Live UI state only. It calls no World/Decision/policy API.
3. `live-session-adapter.js` is the only Live domain integration boundary used by presentation.
4. `live-view-models.js` creates immutable boundary-safe display projections; historical views cannot include future events or owned memories.
5. `branch-comparison.js` is pure and refuses incomplete or integrity-invalid sessions.
6. Authoritative event-cause edges and comparison-only decision-change links are different typed records and different UI labels.
7. The complete authoritative Original/Alternate may be resolved synchronously, but presentation reveals only frozen boundaries through its independent frontier cursor.

## Intentional technical debt and scope limits

- Browser resolution is synchronous and can block briefly; acceptable for four NPCs and twelve turns, not for a real remote provider.
- Presentation templates are framework-free string rendering; suited to the MVP but increasingly large.
- The comparison is scenario-aware in its labels and antidote emphasis; no scenario-general comparison DSL was added.
- The search utility evaluates a small committed candidate set, not an unbounded intervention space.
- No persistence, external model transport, multiple alternates, nested fork, merge, undo, or natural-language explanation exists.

## Release conclusion

Phase 8 satisfies the final demo-ready MVP path. No Phase 9, submission packaging, video production, or post-MVP feature was started.
