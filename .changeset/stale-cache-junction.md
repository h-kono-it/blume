---
"blume": patch
---

Re-point a cache-restored `.blume/node_modules` junction that resolves a superseded Blume install. A restored build cache (e.g. Vercel's) could resurrect the junction pointing into the previous release's store directory; because releases rarely bump Astro, every astro-based health check passed straight through the stale link, and the freshly generated Astro config then imported the old package — crashing on any export added since (`blumeTwoslashTransformer is not a function`). The junction is now dropped and relinked whenever the directory behind it holds a `blume` other than the one running.
