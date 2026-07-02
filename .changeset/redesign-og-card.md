---
"blume": patch
---

Redesign the generated Open Graph card. It now uses a light layout with a
brand lockup (the configured `logo` SVG, painted to the foreground, or an accent
tile with the site initial as a fallback), the page title as a balanced
headline, the site description as a muted subtitle, and a footer showing the
repository slug and site host. Titles and descriptions use `text-wrap: balance`.
