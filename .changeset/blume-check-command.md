---
"blume": patch
---

Add a `blume check` command that type-checks the docs site with `astro check`.
It regenerates the `.blume` runtime, syncs Astro's content types, then runs the
checker against the project — using the project-root `tsconfig.json` when present
so authored `pages/` are covered, not just the generated project. Exits non-zero
on type errors, so it slots into CI as a `typecheck` script.
