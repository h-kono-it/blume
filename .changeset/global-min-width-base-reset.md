---
"blume": patch
---

Add a global `min-width: 0` base reset so flex and grid children shrink to their container instead of forcing horizontal overflow. This defuses the common case where a long or truncating child (a code snippet, a long nav label) pushes its row — and the whole page — past the viewport edge on narrow screens, and removes the need for the per-element `min-w-0` overrides the components previously carried. The base layer also now defaults interactive controls (`button`, `[role="button"]`) to `cursor: pointer` unless disabled, and enables `text-rendering: optimizeLegibility`.
