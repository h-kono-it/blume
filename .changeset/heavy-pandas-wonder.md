---
"blume": patch
---

Exclude Vite's pre-bundled dep cache (`node_modules/.vite/`) from @vitejs/plugin-react. Astro's react() replaces the plugin's default `node_modules` exclude, so Babel (carrying the React Compiler) was re-parsing every 500KB+ optimized dep chunk in dev — the source of the "[BABEL] Note: The code generator has deoptimised the styling" messages. Blume's own components stay covered by the compiler.
