---
"blume": patch
---

`blume eject` now resolves the installed blume package's real location for the `@source` glob in `src/generated/app.css` when it isn't in the project's own `node_modules` (hoisted npm/yarn workspace installs), so Blume's utility classes no longer silently disappear. If resolution fails, the previous default is kept and a warning explains how to adjust the glob.
