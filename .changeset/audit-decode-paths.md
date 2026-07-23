---
"blume": patch
---

Percent-decode pathnames before comparing them against the built file tree in `blume audit`. Sitemap `<loc>`s are `encodeURI`'d and `URL#pathname` re-encodes non-ASCII, while page URLs and file-index keys are raw on-disk names — so a non-ASCII route (e.g. a Japanese slug) false-fired `SITEMAP_BAD_URL`, and a percent-encoded href false-fired `LINK_TO_BROKEN`.
