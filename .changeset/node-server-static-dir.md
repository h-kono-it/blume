---
"blume": patch
---

Fix Node server builds (`output: "server"`, `adapter: "node"`) publishing every deploy artifact to a directory the server never serves. Astro puts served static files in `dist/client/` and `@astrojs/node`'s standalone server reads only that directory, but Blume wrote `sitemap.xml`, `robots.txt`, `llms.txt`/`llms-full.txt`, `agent-readability.json`, redirect files, and the Pagefind bundle into `dist/` — logging success while every one of those URLs 404'd in production. The same wrong directory also fed `--analyze` and the `--budget-js`/`--budget-css` gate, which read the nonexistent `dist/_astro`, reported "No client JavaScript emitted", and passed every budget against 0 bytes. Both the deploy static dir and the isolated-build static dir now point at `dist/client/` for Node server builds; Netlify (publishes `dist/`), Cloudflare (serves the `outDir` root), and Vercel (`.vercel/output/static`, already special-cased) are unchanged.
