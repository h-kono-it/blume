---
"blume": patch
---

Add a `CodeBlock` component and a `highlightCode` helper for themed code outside the Markdown pipeline. There was no way to highlight a string with Blume's configured Shiki theme except by writing a fenced code block, so showing code on a landing page or inside a custom component meant pulling in raw Shiki and hand-writing a `[data-theme="dark"]` swap. `CodeBlock` (usable in any MDX page, or imported from `blume/components/content/CodeBlock.astro`) renders a `code` string with the same themes, transformers, and light/dark swap as fenced code — `<CodeBlock lang="ts" code={source} />`. The underlying `highlightCode(code, lang)` is exported from `blume/markdown` for rendering to an HTML string directly. The `<Component>` source view now shares the same helper.
