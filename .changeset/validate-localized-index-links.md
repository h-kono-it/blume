---
"blume": patch
---

Fix `blume validate` resolving relative links from localized index pages one directory too high. Index detection only matched a literal `index.md(x)` basename, so a dot-parser localized index (`guides/index.fr.mdx`, route `/fr/guides`) and a shared locale-agnostic one (`guides/index.$.mdx`) weren't recognized as directory indexes — `./setup` resolved to `/fr/setup` instead of `/fr/guides/setup` and a fully correct site failed validation with `BLUME_BROKEN_LINK`. Index-ness is now derived from the locale-stripped `navPath`, matching how route mapping recognizes these files.
