---
"blume": patch
---

Leading/trailing slashes in a frontmatter `slug` or a source `prefix` no longer produce malformed routes. `slug: /getting-started` mapped to `//getting-started` and `slug: guides/` to `/guides/` — routes nothing could link to, tripping false `BLUME_BROKEN_LINK`/`BLUME_NAV_MISSING_PAGE` diagnostics and diverging translation keys under i18n. Slugs and prefixes are now trimmed of surrounding slashes and empty route segments are dropped; dotted slug segments like `releases/v1.2` are preserved.
