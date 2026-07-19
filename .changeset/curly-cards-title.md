---
"blume": patch
---

Add `seo.og.titles` to name the generated Open Graph card of a custom `.astro` page, keyed by route. A custom page has no frontmatter to read, so its card was titled by humanizing the last URL segment — turning `/cli` into "Cli" with no way to say "CLI". An entry here wins over the humanized segment; `"/"` addresses the home, whose card otherwise carries the site title.
