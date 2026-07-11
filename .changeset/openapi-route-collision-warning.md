---
"blume": patch
---

Two Blume-rendered OpenAPI sources that resolve to the same route now emit a warning ("keeping the first"), matching the Scalar renderer, instead of silently dropping the second spec's pages.
