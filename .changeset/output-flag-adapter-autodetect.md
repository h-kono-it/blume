---
"blume": patch
---

`blume build --output server` now participates in platform adapter auto-detection. On Vercel, Netlify, or Cloudflare Pages, the matching adapter is selected just as if `deployment: { output: "server" }` had been set in blume.config.ts — previously the flag produced a server build with no adapter and the Astro build failed.
