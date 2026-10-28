# RichieOS — synthetic architecture showcase

**A publication candidate, not a deployed product.** Three standalone examples make an approach inspectable without publishing private repositories.

## Open it

Use a local static server from this folder:

```sh
python -m http.server --bind localhost 8000 --directory site
```

Open the localhost page on port 8000. No installation, service credentials or build step is required. A current browser with JavaScript is needed. Stop the server when finished. No hosting has been configured.

## The three examples

| Example | Demonstrates | Does not claim |
| --- | --- | --- |
| Paper Kite coordination walkthrough | Isolated worker reporting, coordinator review and separate human acceptance | Real authentication, live agents, a production control plane or autonomous approval |
| Prism Orchard | A deterministic 20 × 20 geometric mosaic, eight numbered colors, large controls and in-memory progress | A released game, photo conversion, persistence or an exact copy of a private product |
| Lantern Library | Original fictional text, CSS-only scenery and bounded page navigation | A private book collection, narration, family likeness or child/device acceptance |

All examples were written separately for this package with AI assistance. They are **educational analogues, not exported or relabeled private applications**. The role-switching walkthrough is a simulation, not a secure authorization system.

## Inspect and verify

Node.js 22 and Python 3.9+ are sufficient for the dependency-free checks:

```sh
node --test tests/core.test.cjs
python -m unittest discover -s tests -p "test_*.py"
python scripts/check_package.py
```

Read [verification and limitations](docs/VERIFICATION.md), [architecture](docs/ARCHITECTURE.md), [provenance](PROVENANCE.json), [publication checklist](docs/PUBLICATION.md), and [license status](LICENSE-STATUS.md). The privacy checker is a conservative heuristic and file allowlist, not a security certification.

## Privacy by construction

There are no connected services, uploads, photos, account records, analytics, third-party fonts, personal endpoints, secrets or private history in the intended package. Runtime state stays in memory. The site makes no external request and does not use browser storage. It intentionally does not resemble a live operational dashboard.

No screenshots are approved by default. Review candidates are distributed separately and **must not be added to this package without explicit approval of the exact image and a matching hash**. Never substitute a personal screenshot just because its filename sounds safe.

## Status

The model, package and real HTTP browser checks pass in the October 28 local verification described in docs/VERIFICATION.md. Two delivery/accessibility defects were reproduced and fixed: a missing favicon and low contrast on three palette labels. Physical mobile devices, screen readers and owner visual acceptance remain unverified. Nothing here changes a private application's release state.
