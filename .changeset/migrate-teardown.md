---
"blume": patch
---

Finish the Fumadocs migration teardown so the project builds as Blume without manual cleanup. After moving content and writing the config, `blume migrate fumadocs` now repoints the `dev`/`build`/`start` scripts at the Blume CLI (`blume dev`/`build`/`preview`) and drops the `fumadocs-mdx` postinstall, adds `.blume/` and `dist/` to `.gitignore`, and prints a "safe to delete" checklist of the leftover Next/Fumadocs files it found (`next.config.*`, `source.config.*`, `mdx-components.tsx`, `app/`, …) plus a reminder to remove the `next` tsconfig plugin and the `.next`/`.source` ignore lines. It also derives a better site title for monorepos: a generic package name like `web` (from `apps/web`) now falls back to the repository's directory name. (The script-rewrite, gitignore, and leftover-checklist helpers live in the shared migration toolkit for other migrators to adopt.)
