---
"blume": patch
---

Remote CMS images are now content-addressed by their query-less URL. Notion's pre-signed file URLs change their query string on every API call, so the same image was written to a new file on each refresh — triggering a full-reload loop on every dev poll tick and piling up duplicate files under `blume-assets/`. Repeated builds now reuse one stable filename per asset.
