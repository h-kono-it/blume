---
"blume": patch
---

The Algolia, Typesense, and Orama Cloud search providers now honor the search dialog's language filter on i18n sites. The locale was uploaded with every record at sync time but ignored at query time, so results always mixed every language regardless of the per-language toggle.
