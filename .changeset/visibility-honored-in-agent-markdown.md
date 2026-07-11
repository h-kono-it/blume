---
"blume": patch
---

`<Visibility>` is now honored in agent-facing Markdown. Content marked `for="web"` used to leak into llms-full.txt, the `.md`/`.mdx` mirrors, and the MCP `get_page` tool, and `for="agents"` content appeared wrapped in literal `<Visibility>` tags; web-only blocks are now removed from those outputs and agents-only blocks are unwrapped. Fenced code samples that show `<Visibility>` markup are left untouched.
