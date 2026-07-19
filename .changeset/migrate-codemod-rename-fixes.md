---
"blume": patch
---

Fix a data-loss bug in the blume-migrate Mintlify codemod: renaming a key into a parent block that appears earlier in the frontmatter (e.g. `canonical` into an existing `seo:`) deleted the wrong line and left the source key behind; icon remaps also now preserve trailing comments, and the skill references no longer document the pre-1.0.3 top-level `mcp` config
