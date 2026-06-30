---
"blume": patch
---

Fix `blume dev`/`build` crashing with "Function yaml.safeLoad is removed in js-yaml 4" when a workspace resolves js-yaml 4 for gray-matter. Front-matter parsing now routes through an explicit js-yaml `load`/`dump` engine instead of gray-matter's removed `safeLoad` default.
