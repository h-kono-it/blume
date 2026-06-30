---
"blume": patch
---

Wire the project's tsconfig `paths` into the generated runtime's Vite aliases, so `@/`-style imports resolve in `blume dev`/`build`. The generated `.blume/` is its own Astro project with its own tsconfig and never inherited the project's, so shadcn-style imports like `@/lib/utils` in custom pages, islands, and components failed to resolve and had to be rewritten to relative paths. Blume now reads `compilerOptions.paths` (and `baseUrl`) from the project's `tsconfig.json`/`jsconfig.json` — tolerating JSONC and following a relative `extends` to the file that declares them — and emits each mapping as a `resolve.alias` entry (longest prefix first), so those components port over unchanged. Reading is best-effort: an unparseable or alias-less config simply yields no aliases.
