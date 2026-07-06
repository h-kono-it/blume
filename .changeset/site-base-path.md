---
"blume": patch
---

Add a top-level `basePath` config option — a site-wide mount point that prepends a segment to every generated route (e.g. `/docs/getting-started`) while staying invisible to the sidebar/nav tree, so no wrapper group appears. Links (write them as if mounted at root), redirects, the sitemap, canonical URLs, Open Graph image URLs, `llms.txt`/`llms-full.txt`, and the search index all flow through it; public assets stay at the site root. It's distinct from a per-source `prefix` (which namespaces one source and adds a group) and from `deployment.base` (Astro's host-subdirectory base) — the two compose, so with both set a page lands at `{deployment.base}/{basePath}/page`.
