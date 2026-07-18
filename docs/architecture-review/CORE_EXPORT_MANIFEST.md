# Core Architecture Export Manifest

**Source commit:** `0635ad1`  
**Source tag:** `phase-7-D2-isolated-timeline-fork-engine`  
**Export directory:** `docs/architecture-review/core/`  
**Integrity algorithm:** SHA-256

The files in `core/` are exact byte copies of the requested root production modules. They are audit artifacts, not alternate runtime implementations. The application and tests continue to load the root files.

| Core file | Root source SHA-256 | Export SHA-256 | Match |
|---|---|---|---|
| `world-engine.js` | `fcadf08ef3cdeb3104794d31b7bc52b73b3db9ff2bc1ac484f5fc6a5ef24bcd2` | `fcadf08ef3cdeb3104794d31b7bc52b73b3db9ff2bc1ac484f5fc6a5ef24bcd2` | Exact |
| `decision-layer.js` | `e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155` | `e03c95ed1e6deaff1e9e093e07fbc811d729758694caf915b40a1d2a40781155` | Exact |
| `decision-providers.js` | `b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f` | `b7e64fe16b3370f77fc3e39eb9513ddd402fb82fc761986608f6f2a4a69b677f` | Exact |
| `intervention-layer.js` | `6049a340aeafb9499f58dd22235ecd798e31a7b23548e820ffd30f9ccdacd00a` | `6049a340aeafb9499f58dd22235ecd798e31a7b23548e820ffd30f9ccdacd00a` | Exact |
| `timeline-fork-engine.js` | `b18efe6bd41f3ac9e0e3b852b229245fad1f85cc8cd8c9436fec8e1822f48844` | `b18efe6bd41f3ac9e0e3b852b229245fad1f85cc8cd8c9436fec8e1822f48844` | Exact |
| `npc-agents.js` | `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704` | `c85f0ec1dcca49e6139b03b44702f911a2b85698ea1e2c9093119588825d8704` | Exact |

## Audit use

- Review the copies in this directory when a stable self-contained package is preferred.
- Use the root files when line-level Git history is needed.
- Recompute SHA-256 before relying on an export outside this repository.
- Any later production change intentionally makes this manifest stale; create a new audit snapshot rather than silently replacing these files.
