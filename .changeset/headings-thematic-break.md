---
"blume": patch
---

Stop misreading a body-leading thematic break as front matter in heading extraction. A stripped body opening with `---` followed by a blank line lost every heading up to the next `---` line — missing TOC and search entries, and false `BLUME_BROKEN_ANCHOR` findings from `blume validate`.
