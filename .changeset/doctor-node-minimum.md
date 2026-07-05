---
"blume": patch
---

`blume doctor` now checks Node against the package's declared `engines` minimum (>=22.12.0) instead of a stale hardcoded 20, so unsupported Node versions are actually flagged.
