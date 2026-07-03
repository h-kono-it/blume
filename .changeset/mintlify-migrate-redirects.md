---
"blume": patch
---

`blume migrate mintlify` now drops dynamic (wildcard/param) redirects instead of emitting ones that break the build. Mintlify's `:slug*`/`:id` redirect params were translated to Astro `[...slug]`/`[id]` segments, but Blume redirects are static path-to-path — a dynamic destination matches no route, so Astro aborted the entire build (`The destination "…/[...slug]" does not match any existing route in your project`). Such redirects are now skipped, and the migrator emits a warning that names the dropped sources and points to host-level redirect files (`_redirects`, `vercel.json`), which do support wildcards. Static redirects are unaffected, so the migrated site builds.
