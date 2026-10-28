# Architecture: authority is separate from evidence

This fictional example illustrates a pattern rather than the layout of a real installation.

```text
Human intent -> Coordinator -> bounded work item
                               |
                          Isolated worker
                               |
                          Evidence report
                               |
                       Coordinator verification
                               |
                         Human acceptance
                               |
                       Coordinator completion
```

Only a coordinator assigns work or records completion. A worker submits evidence, not an approval of its own output. Verification moves a work item into HUMAN_REQUIRED, not COMPLETE. Human acceptance is a distinct event before the coordinator records completion.

The model in `site/core.js` enforces the allowed sequence on example values and returns new state rather than mutating the previous record. Tests exercise forbidden roles, out-of-order transitions and missing acceptance. These are application-level example rules. The browser allows the visitor to simulate every role, so it cannot enforce a genuine human identity or trust boundary. A real implementation would need authenticated roles, server-side authorization, tamper-resistant records and appropriate review; those systems are not provided here.

The fictional project's state is held in memory and never synchronized anywhere. The page does not call agents, repositories, hardware or APIs. It includes no internal project names, addresses, credentials, ownership records or assignment contents.

The other two examples isolate interaction patterns from private applications: deterministic geometric color placement and fictional page navigation. They import no private source, personal media, saves or metadata. This deliberately limits their fidelity and makes them inappropriate as evidence that any original product is finished.
