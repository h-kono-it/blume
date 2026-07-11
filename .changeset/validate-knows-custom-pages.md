---
"blume": patch
---

`blume validate` no longer reports links to custom `.astro` pages or the generated `/changelog` index as broken. A docs page linking to a custom landing page (e.g. `[home](/)` with a `pages/index.astro`) previously failed validation — and CI — with BLUME_BROKEN_LINK; those routes now count as known link targets. Anchors on them are accepted unchecked, since their headings aren't indexed.
