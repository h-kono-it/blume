---
"blume": patch
---

Fix the build summary's sitemap line telling users to "set deployment.site" when the sitemap was deliberately disabled. The line now distinguishes `seo.sitemap: false` from a missing `deployment.site`, so the remediation hint only appears when it's the actual fix.
