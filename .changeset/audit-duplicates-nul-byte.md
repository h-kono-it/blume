---
"blume": patch
---

Replace a raw NUL byte in the audit's duplicate-content grouping key with the `\u0000` escape, so the shipped source is valid text (git diffed it as binary and grep skipped it)
