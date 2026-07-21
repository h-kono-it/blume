---
"blume": patch
---

Create the `.blume/node_modules` dependency junction when an isolated linker (Bun's `isolated` mode, pnpm) dedupes the workspace's own `astro` dependency to Blume's copy. The walk from `.blume/` found the "correct" astro through the workspace's direct-dep symlink — in a directory holding none of Blume's integrations — so the junction was skipped and the build died on `Cannot find module '@astrojs/mdx'`.
