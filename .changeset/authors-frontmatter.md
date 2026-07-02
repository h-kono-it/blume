---
"blume": patch
---

Page frontmatter now accepts an `authors` field (a name, an array of names, or an array of author objects with a name plus optional avatar/url and any extra fields). Blume's `pageMetaBaseSchema` is `.strict()`, so a page carrying `authors` — common on blog/changelog content, including sites moved over with `blume migrate mintlify` — previously failed frontmatter validation entirely (`BLUME_FRONTMATTER_INVALID`) and dropped out of the scan. The field is preserved as-is (not yet rendered), so those pages validate and keep their author metadata.
