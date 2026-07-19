---
"blume": patch
---

Fix two robots.txt matching gaps in the audit: `Disallow: /docs*$` now matches everything under `/docs` (the trailing wildcard absorbs the anchor), and trailing-slash rules like `Disallow: /page/` are matched against the sitemap `<loc>` as served instead of a slash-stripped copy
