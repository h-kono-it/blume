---
"blume": patch
---

Config and frontmatter validation errors now point at a line and column, not just
the file. `diagnosticsFromZod` locates the offending key in the source text
(narrowing key-by-key so a nested field lands under its parent), so a bad
`blume.config.ts` field or a mistyped frontmatter value reports e.g.
`at content/docs/guide.mdx:4:3`.
