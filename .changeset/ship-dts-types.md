---
"blume": patch
---

Ship compiled `.d.ts` declarations for the public API so you can type-check your own Blume project. Previously the `blume` and `blume/schema` exports pointed straight at `src/*.ts`, so the moment a consumer's `tsc`/`tsgo` touched a file importing `blume` (`blume.config.ts`, every `meta.ts`, `components.ts`) it followed into Blume's source and surfaced errors it couldn't resolve — `.ts` import extensions (TS5097), `node:fs`, and migrator internals — forcing you to exclude your own config from type-checking. The build now emits declarations to `dist/types/`, and the exports map resolves the `types` condition to them while the runtime still resolves to source. `defineConfig`/`defineMeta` now type-check and autocomplete in editors without the source leaking.
