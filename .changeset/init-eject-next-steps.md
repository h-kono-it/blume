---
"blume": patch
---

`blume init --eject` now rewrites the scaffolded package.json scripts to run Astro directly after a successful eject (matching `blume eject`), and its next-steps output includes the `cd <dir>` hint and package-manager-appropriate commands. When eject can't run yet because dependencies aren't installed, the fallback explains that and points at `npx blume eject --yes` (or the pnpm/yarn/bun equivalent) instead of a bare `blume eject` that isn't on PATH.
