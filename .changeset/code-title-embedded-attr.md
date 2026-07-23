---
"blume": patch
---

Stop promoting a `title="…"` embedded in another code-fence meta attribute's quoted value (`caption='set title="X" here' file.ts`) to the block title. Other quoted attributes are blanked before the explicit-title scan, so the bare-token title (`file.ts`) wins as intended.
