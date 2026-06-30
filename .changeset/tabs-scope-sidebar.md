---
"blume": patch
---

Navigation tabs now scope the sidebar to their section. Previously `navigation.tabs` rendered as header links but every page still showed one global sidebar; the `sidebarVariants` data the model carried was never consumed at render time. Now, when the current route falls under a tab's `path`, the sidebar shows only that tab's section (the folder at that path) — so a multi-section site (e.g. Adapters / API / AI tabs) drills each tab into its own pages, the way Fumadocs' root folders do. It needs no extra config beyond the tabs: each group carries its URL path, and the renderer picks the section matching the route, falling back to the full sidebar when no tab matches. Breadcrumbs and pagination follow the scoped tree.
