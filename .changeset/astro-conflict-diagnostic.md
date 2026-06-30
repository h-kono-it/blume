---
"blume": patch
---

Surface a clear, actionable diagnostic for the split-layout Astro conflict that a symlink can't repair. When a hoisted install pulls a second Astro to the project root (e.g. a dependency with a type-only `astro@6`) that shadows Blume's, and `@astrojs/mdx` is hoisted away from Blume's own Astro, `ensureDepsLink` can't reconcile the split with one symlink and leaves it for a root `overrides`/`resolutions` pin. Previously it did so silently, and the build later crashed deep in Astro on a missing export (e.g. `chunkToString`) with no hint at the cause. `blume dev`/`build` now warn up front — naming the conflicting versions and telling you to pin Blume's Astro with a package.json `overrides` (npm/bun/pnpm) or `resolutions` (yarn) entry — and the warning clears itself once the pin is in place.
