---
"blume": patch
---

The Mintlify migrator now maps `openapi` spec sources onto Blume's native OpenAPI reference instead of silently dropping them. Previously `loadMintlifyConfig` never read a top-level or per-group `openapi` key and skipped `GET /path` endpoint refs, so a site whose entire API reference is a remote spec declared in nav produced no `openapi:` block and no warning. It now walks the navigation tree (plus top-level `openapi` and `api.openapi`) collecting every spec — a string, an array, or a `{ source, directory }` object — dedupes by spec, maps a group's `directory` to the reference's `route`, and emits `openapi: { enabled: true, sources: [...] }`. Endpoint refs are still skipped (the native renderer generates those pages from the spec), and the migration prints a warning listing how many spec sources were mapped so you can verify each path or URL resolves.
