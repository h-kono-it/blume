---
"blume": patch
---

Make the audit's double-slash check able to fire on the case it was written for: an href like `//docs/x` from a trailing-slash base is now flagged (once per target) instead of being silently skipped as a protocol-relative external link
