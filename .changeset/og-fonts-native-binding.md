---
"blume": patch
---

Fix the OG image build failing with "Cannot find native binding" on Vercel (Linux). The `googleFonts` OG-font loader is imported from `takumi-js/helpers`, but only the bare `takumi-js` was externalized for the static-prerender Vite environment — which matches by exact specifier, so the subpath (and the native `@takumi-rs/core` backend it pulls in) got bundled into the prerender chunk, relocating the `.node` binding lookup. Externalize `takumi-js/helpers` and the `@takumi-rs/*` packages so the native backend always resolves from `node_modules` at runtime.
