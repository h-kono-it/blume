---
"blume": patch
---

Bundle the Vercel serverless function with its chunks, virtual middleware, and dependencies. With `deployment.output: "server"` and `adapter: "vercel"`, the render function (`.vercel/output/functions/_render.func`) shipped as `entry.mjs` alone, so any server-rendered request — the Docs MCP endpoint, Ask AI — 500'd at runtime with `ERR_MODULE_NOT_FOUND`. The adapter resolves both its Build Output tree and its `@vercel/nft` dependency trace against Astro's `root`, which Blume points at the hidden `.blume` runtime; the trace's base then excluded the server bundle (which lives under `outDir`, outside `.blume`) and collapsed to a single file. The adapter is now shown the real project root, so the trace covers the function's chunks and `node_modules` and the output lands at the project root natively. Projects inside a workspace were unaffected — nft's base search climbed past `.blume` to the workspace root — so this only ever broke standalone projects.
