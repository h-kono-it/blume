---
"blume": patch
---

Make `blume sync` regenerate with a running dev server's URL as the `site` fallback (read from `dev.lock`), instead of silently dropping `site` and OG output from the live runtime.
