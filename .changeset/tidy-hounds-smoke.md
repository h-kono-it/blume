---
"blume": minor
---

Add a `<Changelog />` component, so a hand-written `/changelog` page can put prose above the generated release list instead of replacing it. The index page was all or nothing: it renders only while nothing else owns the route, so adding one line of introduction — or a visible link to the feed, which the page otherwise only declares in `<head>` — meant taking the route over with a custom page and rebuilding the list by hand. Place the tag in a content page at `/changelog` and Blume keeps owning the list:

```mdx
---
title: Changelog
mode: center
---

What this page is, and a link to the [RSS feed](/changelog/rss.xml).

<Changelog />
```

The generated page now renders the same component, so the two routes to an index can't drift apart, and `mode: center` gives an authored page the generated one's sidebar-less, full-width layout. The tag downlevels to the release list on every agent surface (`/changelog.md`, llms-full.txt, MCP `get_page`, search), which a custom page could not do: an unknown tag reaches those surfaces verbatim, so an authored index used to publish no releases at all to an agent.

The list is the default locale's entries wherever the tag sits, matching the generated page and the Markdown mirror — every surface that publishes this list already agreed on that, and a per-locale list would have been the one disagreeing about which releases exist. Releases from a `githubReleases()` source fold in off the route manifest rather than a generation-time flag, so an authored page lists them too; a hand-rolled index that read only the `docs` collection dropped them silently.
