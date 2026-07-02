---
"blume": minor
---

Add performance-budget enforcement to `blume build`. `--budget-js <kb>` and
`--budget-css <kb>` measure the total client `_astro/*.js` / `*.css` a build
ships and fail (exit 1) when it exceeds the cap — turning a documented budget
into a real CI gate. Pairs with `--analyze` (the per-file report).
