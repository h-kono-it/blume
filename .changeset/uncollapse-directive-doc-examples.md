---
"blume": patch
---

Fix two doc callouts whose body text was silently dropped at render. The `:::warning` examples on the syntax page (including the fenced sample that teaches the form) and the oxfmt FAQ had their body collapsed onto the directive fence line — the exact formatter collapse the FAQ itself documents — so the directive parser kept only the label and rendered an empty callout. The body now sits on its own line after `:::warning[Title]`, so both callouts render their text again.
