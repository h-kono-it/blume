---
"blume": patch
---

Stop `blume validate` flagging links to fallback-rendered locale routes as broken. With i18n fallback active, an untranslated page is prerendered at its localized URL (`/fr/guide` serving the fallback content) — the i18n docs promise "the link works" — but the validator only accepted routes backed by a real page, so a French page linking an untranslated sibling failed CI with `BLUME_BROKEN_LINK`. The validate command now derives the fallback-materialized routes from the route manifest and accepts them as link targets.
