---
"blume": patch
---

Re-bake the dev runtime's `site` fallback when Vite bumps to a free port, so OG images, canonicals, and other site-gated URLs point at the port actually serving instead of the one that was busy.
