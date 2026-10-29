# Publication checklist

The source package and screenshot review pack are different artifacts. Publish only the allowlisted source folder, never the entire owner handoff or an existing private repository.

1. Read all source, tests, documentation and provenance. Confirm every claim describes this example rather than a private product.
2. Run both test suites and the package checker from a fresh copy. Inspect the complete file list, including hidden files, links and any future Git history. Do not treat a scanner pass as proof of absence of private data.
3. Test real local HTTP loading, the content-security policy, keyboard controls and mobile layouts. Check the browser console and network panel. Record what ran and what remains unverified.
4. Obtain owner visual approval. Screenshots require approval of the exact image hash and confirmation of synthetic-only contents; the empty approval manifest is intentional. Do not fill approval fields on the owner's behalf.
5. Resolve LICENSE-STATUS.md before advertising reuse rights. No private-product or upstream assets may be relicensed through this showcase.
6. Create a fresh standalone repository, preferably private for final review, from only this clean source folder. Never fork a private family repository for a public demo. A fresh history avoids unintentionally publishing earlier blobs, but does not replace content review.
7. Public visibility and any hosted deployment are explicit release actions. Do not change any existing repository's visibility, enable a hosting integration, spend money or bypass acceptance gates to finish this checklist.

No deployment workflow or automatic publishing script is included. If a private staging repository is created, its privacy does not establish anything about a separate hosting service. Review hosting separately before ever enabling it.

## Current authorization

The owner authorized publication of this dedicated staging repository and the reviewed synthetic source exports on October 28, 2026. All 24 final captures were separately approved and are recorded by exact hash. Six historical captures remain excluded. No hosted deployment or reuse license is included. See RELEASE.md.
