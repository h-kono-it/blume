---
"blume": patch
---

llms.txt, llms-full.txt, and agent-readability.json now layer `deployment.base` onto their root-relative URLs when no `site` is configured, so advertised links like `/llms.txt` and page routes resolve under a subpath deployment instead of 404ing.
