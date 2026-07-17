---
"blume": patch
---

Fix redirects escaping the site under `deployment.base`. A redirect's `to` was only ever rewritten with `basePath`, never with the deployment base, so with `base: "/docs"` a `to: "/new"` emitted a redirect to `/new` — outside the base, 404ing on a subpath deploy (GitHub Pages project sites, most commonly) with no build-time error. Astro applies `base` when it builds the match pattern for `from`, but resolves a destination either by regenerating it from a matching route's segments (which carry no base) or by passing it through verbatim — neither prepends `base`, so Blume now applies it to `to` itself. The two bases also compose correctly: `deployment.base` and `basePath` set together stack as `{base}/{basePath}`, which the old front-prepend could not produce in that order.

The static host redirect files (`_redirects`, `vercel.json`, `blume-redirects.json`) had the mirror-image bug on the other side: they are matched against the real served URL, but `from` was written without the deployment base, so it never matched. Both sides now carry the full stack. Redirects are authored root-relative in every case, and a base already written into `to` by hand is preserved rather than doubled.
