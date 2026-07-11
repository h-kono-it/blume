---
"blume": minor
---

The `.md` raw-Markdown mirror now downlevels components to plain Markdown for agent consumers: `<TypeTable>` becomes a GFM table, `<Callout>` a labeled blockquote, `<Steps>` an ordered list, `<Tabs>` bold-labeled sections, and `<YouTube>` a link. The `.mdx` mirror keeps serving the source exactly as written, so both audiences get what the extension implies. The same conversion applies to `llms-full.txt` and the MCP server's `get_page` tool. Unknown components, props that can't be recovered statically, and component markup inside fenced code blocks are all left verbatim.

Custom components can join in via `ai.markdownComponents` in `blume.config.ts`: a map of JSX name to `ComponentMarkdown` serializer, receiving the statically-evaluated props and downleveled children. A same-name entry replaces a built-in serializer.
