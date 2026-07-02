---
"blume": patch
---

Add a dev-only hydration-mismatch hint. When React reports an island hydration
mismatch, Blume follows it with a friendly pointer explaining the usual causes
(non-serializable props, non-deterministic render) and linking to the islands
guide. It's guarded by `import.meta.env.DEV`, so it's tree-shaken out of
production builds.
