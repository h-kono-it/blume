---
"blume": patch
---

MCP server URLs now honor a subpath `deployment.site`. `search_docs`/`list_pages` result URLs and the `/.well-known/mcp.json` server address were built with `new URL(route, site)`, which drops the path of a base like `https://acme.com/docs` — pointing agents at nonexistent root-level pages while `llms.txt` linked correctly. Both now concatenate like the rest of the AI surface.
