---
"blume": patch
---

Ask AI and search now work when `deployment.base` has no trailing slash. Astro passes the base through as-is, so `base: "/docs"` made the Ask AI island POST to `/docsapi/ask` (every question failed with a 404), page grounding send `//guide` paths, and the generated search clients request `/docsblume-search.json` / `/docsapi/search` / `/docspagefind/pagefind.js`. All island and generated-client URL joins now go through a shared helper that normalizes the trailing slash.
