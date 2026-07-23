---
"blume": patch
---

Leave the `.blume/node_modules` junction alone when it already points at the right target. It was deleted and re-created on every dev regeneration in the split-install layout, opening a window in which the dev server's module resolution raced a missing `node_modules` and intermittently failed with "Cannot find package".
