---
"blume": patch
---

Fix blank UI chrome (empty search labels, aria-labels, skip link) on `ui`-less `PageLayout`/`RootLayout` pages when the consuming project resolves Zod 4. The English baseline was derived with `uiStringsObject.parse({})`, relying on each group's nested `.default({})` to deep-populate its inner field defaults — Zod 3 behavior. Zod 4's `.default()` returns the literal default without re-parsing it through the inner type, so every group collapsed to `{}` and a `ui`-less layout rendered empty strings. Derive the baseline by naming each group explicitly so field defaults apply on both Zod 3 and 4, and merge component dictionaries (`Search`, `PageFeedback`) over the baseline per key so a partial or empty strings object still falls back to defaults.
