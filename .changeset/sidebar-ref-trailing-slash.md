---
"blume": patch
---

Resolve explicit sidebar refs written with a trailing slash. A hand-written `"guides/"` normalized to `/guides/`, missed the slashless `/guides` route, and the item was silently dropped from the sidebar with no diagnostic.
