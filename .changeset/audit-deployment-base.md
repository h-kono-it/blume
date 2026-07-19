---
"blume": patch
---

Account for `deployment.base` throughout the audit: link, sitemap, hreflang, llms.txt, asset, and og:image checks now strip the deployment base from emitted URLs before comparing them to the built file tree, instead of reporting every internal link and sitemap entry as broken on subpath deploys
