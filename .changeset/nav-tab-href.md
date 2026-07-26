---
"blume": minor
---

Let a header tab declare its link target with `href`. A tab's `path` scopes its sidebar section and doubles as the link, so a section whose `path` isn't a page of its own falls back to the section's first page rather than linking to a 404. That fallback only sees the content tree, so a tab pointing at a route generated outside it — the automatic `/changelog` index, or a custom page under `pages/` — lands on the section's first entry instead of the page the reader expected. Setting `href` keeps the tab on the declared route; the field is optional and tabs that omit it resolve exactly as before. Declared hrefs are localized and rebased like any other route, so they work under i18n and a `deployment.base`.
