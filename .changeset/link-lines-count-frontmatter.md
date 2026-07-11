---
"blume": patch
---

Broken-link and broken-anchor diagnostics now point at the correct line of the source file. Line numbers were counted on the frontmatter-stripped body, so a link below a frontmatter block was reported several lines above where it actually sits (e.g. line 2 instead of line 6 after a 4-line block).
