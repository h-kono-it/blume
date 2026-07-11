---
"blume": patch
---

Stop the search dialog showing "Search is available in the production build." on production sites while the search client is still loading. Typing before the lazy client import and index fetch resolved (seconds, on a slow connection) rendered the dev-only hint for every keystroke because the not-loaded and dev-missing states were indistinguishable. The load window now shows a neutral placeholder and re-renders with real results (or the error state) once the load settles.
