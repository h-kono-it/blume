---
"blume": patch
---

BreadcrumbList JSON-LD now passes Google's Rich Results validation on nested pages. Sidebar groups without an index page used to be emitted as link-less ListItems, which Google rejects on every position except the last; those crumbs are now skipped (with positions renumbered), and the list is omitted when fewer than two linked crumbs remain.
