---
"blume": minor
---

Emit `agent-readability.json` at the site root: a manifest that indexes the project's agent-facing surface so agents can discover and cite the docs without scraping HTML. It lists the raw-Markdown mirror pattern (with content negotiation), `llms.txt`/`llms-full.txt`, the MCP server and its `.well-known/mcp.json` discovery doc, the Ask AI endpoint, the sitemap, and RSS feeds — including only the ones actually enabled. It also echoes the `seo.contentSignals` usage policy and the configured source repository. URLs are absolute when `deployment.site` is set and root-relative otherwise.

On by default; disable with `seo.agentReadability: false`. As with `sitemap.xml` and `robots.txt`, a file you ship in `public/` takes precedence.
