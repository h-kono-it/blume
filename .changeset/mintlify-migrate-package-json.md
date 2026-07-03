---
"blume": patch
---

`blume migrate mintlify` now scaffolds a minimal, runnable `package.json` when the project doesn't already have one. Mintlify docs are config-only (`docs.json`/`mint.json`) and ship no npm manifest, so a fresh migration previously left nothing to run `blume dev` with. The migrator now writes a stub with `blume` pinned as a dependency and `dev`/`build`/`doctor` scripts (derived name, `private: true`), so `npm install && npm run dev` works immediately; a pre-existing `package.json` is left untouched. The `package.json` template is now shared with `blume init`.
