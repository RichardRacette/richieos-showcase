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

Screenshots, request logs, exact harnesses and file hashes are retained in a separate owner-only review pack. They are not approved publication media. SCREENSHOT-APPROVALS.json remains empty.

## Historical component evidence

BROWSER-COMPONENT-RESULTS.json records the earlier editing environment's in-memory checks. That fixture omitted CSP/loaders after managed navigation was blocked. It did not establish HTTP delivery. The current real HTTP checks above supersede that delivery gap without changing the meaning of the historical record.

## Still unverified

Physical iPhone/Safari, VoiceOver, a complete accessibility audit, hosted deployment, independent security review, owner visual acceptance and exact screenshot approval. The examples have no narration or durable save feature. Role buttons simulate authority; they do not authenticate people. None of these results establishes acceptance of an original private product.
