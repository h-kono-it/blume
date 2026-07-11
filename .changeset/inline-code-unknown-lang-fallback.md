---
"blume": patch
---

Inline code with an unknown highlight language (for example a typo'd `` `foo(){:typescrpt}` ``) now strips the `{:lang}` marker and renders as plain inline code instead of shipping the literal marker in the page.
