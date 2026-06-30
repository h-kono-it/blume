---
"blume": patch
---

Add `PageLayout` for landing, marketing, and other full-width pages. `RootLayout` hard-codes the docs 3-column grid (sidebar + prose + TOC), so building a custom page like a landing page meant hand-rolling the entire document shell — re-importing the header/favicon/fonts, copying the theme + banner pre-paint scripts, wiring `fontCssVars`, and rebuilding the banner markup. `PageLayout` (import from `blume/components/layout/PageLayout.astro`) provides that shell — `<head>`, theme, fonts, favicon, banner, and header — then a single full-width `<slot />` for the body, plus an optional `footer` slot rendered after `<main>`. Props come straight from `blume:data`. The two layouts now share the theme/banner pre-paint scripts so they can't drift, and the bundled docs landing page is built on `PageLayout`.
