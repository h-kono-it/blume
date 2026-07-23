---
"blume": patch
---

Strip the locale directory from a shared `.$` file's nav path with the `dir` parser. `fr/changelog.$.mdx` kept its `fr/` segment, silently routing the default locale's record inside the French URL namespace, the French copy to `/fr/fr/changelog`, and conjuring a spurious "Fr" sidebar group.
