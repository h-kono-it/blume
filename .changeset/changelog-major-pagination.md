---
"blume": patch
---

Redesign the generated `/changelog` timeline and paginate it by major version. The page now renders as a focused, full-width column — no sidebar or table of contents — and each release heading links to that release's own page, so an entry is both a timeline line and a shareable permalink. When the releases follow semver and span more than one major, older majors collapse behind a **Show N.x releases** button that reveals the next-oldest major one click at a time (detected automatically; tolerates scoped monorepo tags like `pkg@2.0.0`). It's progressive enhancement — every release stays in the page HTML, RSS feed, and search index, so no-JS readers and crawlers still get the full history.
