---
"blume": patch
---

The MCP `search_docs` fallback excerpt (used when a page has no description) now appends an ellipsis only when the content was actually truncated. Short pages no longer get a fake truncation marker, an empty page no longer yields a bare "…", and a cut that lands on whitespace is trimmed before the marker.
