---
"blume": patch
---

Fix the Vercel (`output: "server"`) build failing in `astro:build:done` with `dist/server/entry.mjs does not exist`. Blume declared its render-time SSR externals under a user-owned `vite.environments.ssr` block, which collides with the internal environment Astro 7 builds the server under and detaches the adapter's server entrypoint from the rolldown input — so the SSR entry was emitted as `index.mjs` and the Vercel adapter couldn't find `entry.mjs`. The SSR externals now go through the legacy `vite.ssr.external` key (the `prerender` environment is Astro-only and stays under `environments`).
