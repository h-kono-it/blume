---
"blume": patch
---

`blume init` now ensures `.blume/` and `dist/` are git-ignored. It creates a `.gitignore` if the project doesn't have one, and appends only the missing entries (trailing-slash agnostic) when it does, so re-running is a no-op.
