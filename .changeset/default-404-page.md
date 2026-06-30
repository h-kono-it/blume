---
"blume": patch
---

Add a default 404 page. Blume now generates a not-found page at Astro's reserved `src/pages/404.astro` path, so static builds ship a `dist/404.html` and `blume dev` serves it for unmatched routes — previously an unknown URL fell back to Astro's unstyled default. The page renders through `PageLayout` (header + search, no sidebar), is centered and `noindex`, and its copy comes from new translatable `notFound` UI strings (`title`, `description`, `home`), overridable per locale via `i18n.ui`. Drop a `pages/404.astro` to replace it entirely: Blume skips the default when the project already owns `/404` (a custom page or a `404.md` content page), so the override never collides. The same default is written on `blume eject`.
