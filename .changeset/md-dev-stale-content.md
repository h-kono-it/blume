---
"blume": patch
---

Fix `.md` pages serving stale content in `blume dev`. The generated dev config kept Vite's watcher out of Astro's cache dir, which suppressed the `data-store.json` change events Astro relies on to invalidate content in a running dev server — so edited Markdown bodies (rendered into the data store at load time) kept serving the old HTML even after a hard reload, while `.mdx` pages (rendered through their own module) updated fine. The watcher ignore is now scoped to migrated (`content.root: "."`) projects, the only layout whose glob loader would otherwise churn on Astro's own cache writes.
