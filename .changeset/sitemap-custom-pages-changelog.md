---
"blume": patch
---

`sitemap.xml` now includes custom `.astro` pages and the generated `/changelog` index. A site with a custom `pages/index.astro` landing page previously published a sitemap missing its own root URL, and the indexable changelog page was absent too. Dynamic (`[param]`) and private (`_partial`, `.well-known`) routes stay excluded, and the deployment base is layered onto the new URLs like every other entry.
