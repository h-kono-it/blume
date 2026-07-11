---
"blume": patch
---

Rebase `<Card href>`, `<Tile href>`, `<Tooltip href>`, and `<Card img>` under the served URL. Markdown links are rewritten to the composed `deployment.base` + `basePath` at build, but these component props were emitted raw — so on a GitHub Pages project site (or any `deployment.base`/`basePath` deploy), `<Card href="/quickstart">` linked to a base-less path and 404'd while the adjacent `[x](/quickstart)` worked. Component hrefs now follow the same "write links as if mounted at root" contract as markdown links (idempotent per layer, inert for external URLs, fragments, relative paths, and asset links), `<Card img>` gains the deployment base like every other `public/` asset emitter, and `<Update>` — which previously applied only the deployment base — composes `basePath` too. The site-wide `basePath` is now exposed on `blume:data` as `config.basePath` for custom pages that need the same treatment.
