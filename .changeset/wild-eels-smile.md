---
"blume": minor
---

Add `blume audit`, an offline site audit that replaces a hosted SEO crawler.

`blume audit` reads the built `dist/` HTML, joins each page back to the `.mdx` it came from, and reports SEO and site-health issues that name **both** the URL that is wrong and the front matter line that fixes it:

```
⚠ Meta description too long or too short   5 pages
    /docs/configuration/export    content/docs/configuration/export.mdx:3
    fix: Rewrite `description` in the frontmatter to fit the length range.
```

It runs 87 checks across content, duplicates, indexability, links, redirects, social tags, localization, assets, sitemap, robots.txt, structured data, and AI discovery. Findings are rolled up by check rather than dumped per page, and any tier that didn't run says so. The check set deliberately skips things that can't happen to an Astro-built site (missing hashed bundles, `rel=nofollow`) in favor of checks a crawler can't do — broken `#fragment` anchors, `draft: true` pages that shipped, `llms.txt` held to the sitemap's standard, and Open Graph images verified as bytes.

Flags:

- `--url <origin>` also probes a live deployment for what `dist/` can't show (bad rewrites, missing compression, `X-Robots-Tag` deindexing).
- `--external` probes outbound links.
- `--claude` / `--codex` write the JSON report and open the agent interactively to fix each finding at its source.
- `--fail-on <severity>` (default `error`) as the CI gate, plus `--only`/`--skip`, `--json`, `--verbose`, and `--list-checks`.

`blume validate` is unchanged — it remains the fast source-level link check that needs no build.
