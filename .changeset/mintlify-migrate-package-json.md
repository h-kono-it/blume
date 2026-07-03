---
"blume": patch
---

`blume migrate mintlify` now scaffolds the project files a config-only Mintlify repo lacks. Mintlify docs are driven by `docs.json`/`mint.json` and ship no npm manifest, so a fresh migration previously left nothing to run `blume dev` with. The migrator now writes a minimal, runnable `package.json` with `blume` pinned as a dependency and `dev`/`build`/`doctor` scripts (derived name, `private: true`), plus a `.gitignore` for Blume's generated `.blume/` runtime and `dist/` build output — so `npm install && npm run dev` works immediately and the generated output stays untracked. Both are idempotent: an existing `package.json` is left untouched and an existing `.gitignore` is only extended. The `package.json` template is now shared with `blume init`.
