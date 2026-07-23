---
"blume": patch
---

Strip `deployment.base` before comparing canonical and sitemap URLs in `blume audit`. Canonicals and `<loc>`s are emitted as `site + base + route` while page URLs come from the base-less file tree, so on a subpath deployment every page false-fired `CANONICAL_BAD_TARGET`, `NON_CANONICAL_IN_SITEMAP`, and `INDEXABLE_PAGE_NOT_IN_SITEMAP` — and the duplicate-content checks silently skipped every page (each one looked like it canonicalized elsewhere).
