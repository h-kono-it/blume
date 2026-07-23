---
"blume": patch
---

Dedupe repeated `<Update>` ids on a page, mirroring the accordion id dedupe. Two entries labeled "Bug fixes" produced duplicate DOM ids, so the second entry's self-anchor permalink jumped to the first one; later duplicates now gain `-2`, `-3`, … and their header anchors follow.
