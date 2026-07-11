---
"blume": patch
---

Search indexes now honor `<Visibility>` audiences. Content marked `for="agents"` no longer appears in the site's search dialog excerpts or gets uploaded to hosted search providers (Algolia, Orama Cloud, Typesense, Mixedbread), and the MCP `search_docs` index and Ask AI grounding now apply the same rules as `get_page` and llms-full.txt: web-only content is removed and agents-only content is included.
