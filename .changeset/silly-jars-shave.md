---
"blume": patch
---

Fix `ERR_MODULE_NOT_FOUND` in a deployed server function. Surfacing an adapter's deploy bundle out of `.blume` resolved every traced dependency's symlink against the source dir, so the links pointed into a directory the same step then deleted — the function died on its first external import (`Cannot find package '@orama/orama'` with Ask AI or the MCP server enabled). The bundle is now copied verbatim, leaving those links relative and internal to it.
