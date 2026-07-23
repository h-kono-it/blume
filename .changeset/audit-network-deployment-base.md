---
"blume": patch
---

Probe live URLs under `deployment.base` in `blume audit --url`. Page URLs come from the base-less build tree, but the deployed site serves everything (pages, robots.txt, sitemap.xml) under the base — so auditing a healthy subpath deployment produced a wall of `HTTP_4XX` findings from probing the wrong URLs.
