# Verification record — October 28, 2026

Scope: this synthetic showcase only. No original application or deployed service is certified by these results.

## Current local verification

Environment: Windows, Node.js v24.19.0, Python 3.14.7, Chromium 156.0.8078.4 using an existing Playwright runtime. No dependency or browser installation was needed for this site.

Commands from the source folder:

```sh
node --test tests/core.test.cjs
node --test tests/delivery.test.cjs
python -m unittest discover -s tests -p "test_*.py" -v
node --check site/core.js
node --check site/app.js
python scripts/check_package.py
python -m http.server --bind localhost 8000 --directory site
```

Results: 14 core tests, 2 delivery regressions and 9 package tests pass, zero failures/skips. Syntax and allowlist/privacy heuristic checks pass. The scanner is not a security certification.

The source was loaded through the actual Python HTTP server, with its HTML CSP and same-folder CSS/scripts intact. On this Windows installation `--bind localhost` resolved to IPv6 loopback; the browser used the IPv6 loopback URL on port 8000. A first IPv4 connection failed; no security policy was disabled. The temporary server was stopped after checks.

Actual browser checks passed at 360×800, 390×844, 768×1024 and 1440×1000:

- Complete coordination progression, blocked worker self-approval and reset.
- Eight palette choices, single placement, all 400 cells completed and reset.
- Reader first/last bounds and return navigation.
- Visible keyboard focus on the skip link, no horizontal document overflow, reduced-motion preference.
- All eight numbered palette labels meet 4.5:1 contrast; other text uses the existing dark-on-light design.
- Only expected same-origin resources, HTTP 200 responses, no normal-use console/page errors, and empty browser storage state.
- A separate disposable-page CSP probe confirms inline-script and connection attempts are blocked. Expected probe violations are separate from the clean normal-use console record.

Two defects were reproduced before correction: an absent favicon caused a 404 console error, and palette labels 6–8 had contrast ratios 4.31, 3.83 and 3.35. An explicit empty favicon and black labels correct those defects without changing the examples or CSP. The two delivery regressions fail against the original supplied source and pass against this revision.

Request logs, exact harnesses and original review evidence are retained in a separate owner-only pack. The owner subsequently approved the 24 final synthetic screenshot captures for publication; exact hashes are recorded in SCREENSHOT-APPROVALS.json. Physical-device and original-product acceptance remain separate.

## Historical component evidence

BROWSER-COMPONENT-RESULTS.json records the earlier editing environment's in-memory checks. That fixture omitted CSP/loaders after managed navigation was blocked. It did not establish HTTP delivery. The current real HTTP checks above supersede that delivery gap without changing the meaning of the historical record.

## Still unverified

Physical iPhone/Safari, VoiceOver, a complete accessibility audit, hosted deployment, independent security review and original-product acceptance. The examples have no narration or durable save feature. Role buttons simulate authority; they do not authenticate people. None of these results establishes acceptance of an original private product.

## Publication packaging

The approved family exports retain their six passing model tests and eight HTTP browser cases. The root package guard covers both demos and SVG assets as well as exact screenshot approval hashes. Runtime behavior and fictional asset content are unchanged; text line endings and trailing whitespace were normalized. No owner-only evidence files are included in the public tree.

Publication verification: the combined Node command runs 22 tests (16 showcase plus six source-adapted demo tests), and Python runs 16 package-guard tests. All pass with zero skips. Syntax checks, explicit allowlist, local documentation links, exact image hashes and PNG metadata checks pass. The 24 approved captures are byte-identical to the reviewed images; publication makes no behavioral or visual asset changes.
