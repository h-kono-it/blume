---
"blume": patch
---

sitemap.xml no longer lists user-authored error pages: a custom `pages/404.astro`/`pages/500.astro` (or a `404` content override) is excluded, since error routes aren't crawlable destinations.
