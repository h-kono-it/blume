---
"blume": patch
---

`blume migrate mintlify` now keeps images referenced only by page content resolvable. Asset relocation previously considered just `/images` plus paths named in the config (logo, favicon, backgrounds) — a page using `![…](/screenshots/home.png)` or `<img src="/img/logo.svg">` silently 404'd after migration, since Mintlify serves every top-level directory at the site root but Blume only serves `public/` and `content.assets` mounts. Root-absolute asset references in content are now collected during the rewrite and their directories added to `content.assets`.
