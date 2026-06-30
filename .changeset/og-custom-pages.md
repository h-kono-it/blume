---
"blume": patch
---

Generate Open Graph cards for custom pages, including the home. OG images were generated per content route only, so a custom landing page at `/` — the most-shared URL — got no `/og/index.png` and had to ship a static `public/og.png`. Blume now renders a card for every static, public custom page (skipping dynamic `[param]` routes and private `_partial`/`.well-known` segments): the home uses the site title with the site description as its eyebrow, and a deeper page is titled from its last path segment. `PageLayout` derives the page's `canonical` and `og:image` from `siteUrl` + `ogEnabled` automatically (explicit `ogImage`/`canonical` still override), so a custom page wired from `blume:data` gets a themed card with no extra work.
