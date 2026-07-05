---
"blume": patch
---

Acquire the dev lock atomically (`wx` create) so two `blume dev` processes started simultaneously can no longer both claim `.blume/` and corrupt each other's runtime.
