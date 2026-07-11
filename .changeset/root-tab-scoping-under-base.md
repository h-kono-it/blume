---
"blume": patch
---

Fix a `path: "/"` navigation tab falsely triggering tab-section scoping under `basePath` or a non-default locale. The root-tab exclusion compared the literal `"/"` after tab paths had already been localized and rebased, so with `basePath: "/docs"` (or on a `/fr` locale tree) the root tab's final path matched a root-level `(group)` folder's route path and hoisted that group's pages above its subgroups — the sidebar ordered differently with a base than without one under `display: "group"`/`"page"`. The exclusion now compares against the tree's based, localized root.
