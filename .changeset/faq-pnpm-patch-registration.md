---
"blume": patch
---

Fix the FAQ's oxfmt patch instructions for pnpm. The page told Bun and pnpm users alike to add a top-level `patchedDependencies` key to `package.json` — Bun's convention, which pnpm silently ignores, leaving the patch unapplied. The pnpm form (nested under the `pnpm` key, or in `pnpm-workspace.yaml`) is now shown separately.
