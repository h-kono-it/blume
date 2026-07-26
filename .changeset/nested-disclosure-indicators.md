---
"blume": patch
---

Fix nested `<Tree>` folder chevrons, nested `<Accordion>` chevrons, and a nested object schema's "Show properties" toggle reflecting an ancestor's open state instead of their own. All three rotated or flipped on Tailwind's `group-open:` variant, which matches any open ancestor `.group` — the same leak as the nested sidebar chevron — so a collapsed disclosure inside an expanded one showed an open indicator. Each indicator is now scoped to its own `details`.
