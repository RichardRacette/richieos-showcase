# RichieOS — synthetic architecture showcase

**Public source, approved synthetic screenshots and a live GitHub Pages website.** Three clean-room educational examples and two source-adapted demonstrations make the work inspectable while the original applications remain private.

## Open it

[Explore the live demonstrations](https://richardracette.github.io/richieos-showcase/) · [Showcase](https://richardracette.github.io/richieos-showcase/site/) · [Spectrum Study](https://richardracette.github.io/richieos-showcase/demos/puzzle/) · [Cloud Post](https://richardracette.github.io/richieos-showcase/demos/reader/)

Hosting uses free GitHub Pages for this public repository. No custom domain, paid service or backend is required. See [hosting and rollback](docs/HOSTING.md).

Use a local static server from this folder:

```sh
python -m http.server --bind localhost 8000 --directory site
```

Open the localhost page on port 8000. No installation, service credentials or build step is required. A current browser with JavaScript is needed. Stop the server when finished. GitHub Pages serves the same static files.

## The three examples

| Example | Demonstrates | Does not claim |
| --- | --- | --- |
| Paper Kite coordination walkthrough | Isolated worker reporting, coordinator review and separate human acceptance | Real authentication, live agents, a production control plane or autonomous approval |
| Prism Orchard | A deterministic 20 × 20 geometric mosaic, eight numbered colors, large controls and in-memory progress | A released game, photo conversion, persistence or an exact copy of a private product |
| Lantern Library | Original fictional text, CSS-only scenery and bounded page navigation | A private book collection, narration, family likeness or child/device acceptance |

The three examples above were written separately for this package with AI assistance. They are **educational analogues, not exported or relabeled private applications**. The role-switching walkthrough is a simulation, not a secure authorization system.

## Inspect and verify

Node.js 22 and Python 3.9+ are sufficient for the dependency-free checks:

```sh
node --test tests/core.test.cjs tests/delivery.test.cjs demos/puzzle/test.mjs demos/reader/test.mjs
python -m unittest discover -s tests -p "test_*.py"
python scripts/check_package.py
```

Read [verification and limitations](docs/VERIFICATION.md), [architecture](docs/ARCHITECTURE.md), [provenance](PROVENANCE.json), [publication checklist](docs/PUBLICATION.md), and [license status](LICENSE-STATUS.md). The privacy checker is a conservative heuristic and file allowlist, not a security certification.

## Privacy by construction

There are no connected services, uploads, photos, account records, analytics, third-party fonts, personal endpoints, secrets or private history in the intended package. Runtime state stays in memory. The site makes no external request and does not use browser storage. It intentionally does not resemble a live operational dashboard.

The owner approved the 24 final synthetic captures in the [screenshot gallery](screenshots/README.md). Exact filenames and hashes are recorded in SCREENSHOT-APPROVALS.json. Changed images require new approval; historical candidates and personal media are excluded.

## Status

The model, package and real HTTP browser checks pass in the October 28 local verification described in docs/VERIFICATION.md. Two delivery/accessibility defects were reproduced and fixed: a missing favicon and low contrast on three palette labels. Physical mobile devices, screen readers and original-product acceptance remain unverified; screenshot publication approval is recorded separately. Nothing here changes a private application's release state.

## Source-adapted synthetic demonstrations

These separate exports retain inspected first-party mechanics with fictional inputs. They are not the original applications and do not inherit their acceptance status.

- [Spectrum Study](demos/puzzle/README.md): 20x20, eight-color geometric puzzle using the inspected selection/transfer engine, with simplified rendering and no photo conversion or persistent saves.
- [Cloud Post](demos/reader/README.md): source-adapted reader, bookshelf and discoveries with an original brass-compass story and four geometric SVG scenes. Narration and music are absent; state stays in memory.

From the repository root, run `python -m http.server --bind 127.0.0.1 8080` and visit `/site/`, `/demos/puzzle/` or `/demos/reader/` on that local server. Stop with Ctrl+C. The hosted version serves these same static files through GitHub Pages; the apps have no external service integrations.

The owner authorized these exact source exports for publication. No general reuse license has been selected. See each demonstration's provenance and notices, and the [publication record](docs/RELEASE.md).
