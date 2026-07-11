---
"blume": patch
---

`useSearch()` now guards against out-of-order provider responses: only the latest query may commit results or clear `loading`, so a slow response for "a" no longer clobbers the results for "ab". `loading` also flips on before the lazy client creation, so the first search's index download shows as loading instead of idle.
