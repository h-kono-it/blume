---
"blume": patch
---

Harden the pre-paint inline scripts and the route-normalizing regexes against the issues CodeQL flagged.

The theme and banner scripts in `<head>` used to be built by interpolating config values into JavaScript source with `JSON.stringify`. JSON escaping isn't a code-context escape — `</script>` and U+2028/U+2029 pass straight through it — so a crafted `banner.id` or theme value could break out of the script. Both scripts are now constants and take their values from `data-*` attributes on their own `<script>` tag, which Astro HTML-escapes. `ReferenceLayout` had drifted to its own inline copies of both scripts; it now shares the same module as `RootLayout` and `PageLayout`.

Route and slug normalization used `/^\/+|\/+$/`-style patterns to trim leading and trailing separators. Those take quadratic time on a long run of the trimmed character, and they run on values that come from outside Blume (configured routes, OpenAPI spec URLs, the site origin), so a pathological config could hang the build. They're replaced by linear trimming helpers in `core/trim.ts`; behavior is unchanged.
