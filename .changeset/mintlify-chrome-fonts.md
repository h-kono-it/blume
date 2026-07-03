---
"blume": patch
---

The Mintlify migrator now maps `fonts` to `theme.fonts` and stops silently dropping site chrome it can't model. A `fonts.family` (or a `heading`/`body` split) resolves to the matching Blume Google-font slug — `Space Grotesk` → `space-grotesk`, `Geist` → `geist`, and so on — and a family outside Blume's curated set is reported rather than guessed. Header links (`navbar.links`/`navbar.primary`) and footer socials (`footer.socials`), which have no `blume.config` equivalent, are now surfaced as migration warnings (pointing at `navigation.tabs` or a Header/Footer layout override) instead of disappearing. The contextual page menu and last-updated timestamp are already covered by Blume defaults, so they're intentionally treated as no-ops.
