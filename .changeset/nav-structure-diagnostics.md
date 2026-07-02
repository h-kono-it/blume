---
"blume": patch
---

Blume now catches common navigation mistakes that used to fail silently:

- **Missing target** — a tab/selector pointing at a route no page (content,
  custom `.astro`, or generated) serves.
- **Duplicate labels** — two sidebar entries sharing a title at the same level.
- **Hidden-in-sidebar** — a page marked `sidebar.hidden` that still appears in
  the sidebar (and therefore its prev/next pagination).

Surfaced by `blume dev`, `blume build`, and `blume doctor`.
