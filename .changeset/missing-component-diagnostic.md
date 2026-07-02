---
"blume": patch
---

Catch unknown MDX components with a friendly warning before the build hits
Astro's cryptic "Expected component X to be defined" error. When an `.mdx` page
uses a `<Tag>` that isn't a built-in, an island, or a `components.ts` override,
Blume warns with the page it's on and how to fix it — `blume add <name>` when a
registry item matches, otherwise how to register or add it. Code blocks, inline
code, and quoted text are ignored to avoid false positives.
