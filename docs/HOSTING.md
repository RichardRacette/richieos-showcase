# Static hosting

The owner authorized free live hosting on October 28, 2026. GitHub Pages serves this dedicated public repository from the main branch, root folder, with the default project address:

https://richardracette.github.io/richieos-showcase/

Entry points: the landing page at the root, the independently written showcase under site/, and the source-adapted synthetic demonstrations under demos/puzzle/ and demos/reader/. Original applications and private repositories are not connected to this deployment. x402 PR #70 remains open.

The empty .nojekyll marker makes this a plain static deployment. No custom workflow, build dependency, paid plan, custom domain, credentials in source, server function or application database is required. Future normal pushes to main update this site through GitHub's managed Pages build/deployment. No automatic deployment is enabled for another repository.

GitHub documents Pages availability for public repositories on GitHub Free: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages

The apps include no analytics, accounts, uploads or persistent browser state. GitHub, as the hosting provider, records request IP addresses for security. Each app retains its HTML content-security policy; live verification checks real resource loading and active script/connection restrictions. GitHub Pages does not provide custom response headers here, so these are meta-delivered policies, not HTTP CSP headers.

To stop hosting without changing source or repository privacy, disable Pages in this repository's Settings > Pages. To restore the previous site version, use a normal reviewed revert of the hosting change; do not reset or force-push shared history. No original-product deployment is part of this rollback.

Screenshots in screenshots/ retain their exact previously approved bytes. The new landing page and current hosted UI do not create additional screenshot approvals. Hosting does not grant a general reuse license or establish physical-device/original-product acceptance.
