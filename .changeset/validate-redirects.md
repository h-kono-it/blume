---
"blume": patch
---

`blume validate` now treats configured redirects as valid link targets. A content link to a path that only exists as a `redirects` entry (e.g. `/providers`, which redirects to `/providers/openai`) was flagged as a broken link, even though it resolves at runtime. Link validation now accepts any link whose target matches a configured `redirect.from`, removing the false positive.
