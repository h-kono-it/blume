---
"blume": patch
---

Make the MCP tools' contract hold together: `search_docs` hits now include the `route` the tool description promises (alongside `url`), and `get_page` accepts a full URL or a base-prefixed path — an agent following "pass a route from `search_docs`" no longer gets "No page found" for a page that exists on a site with `deployment.site` or `deployment.base` configured.
