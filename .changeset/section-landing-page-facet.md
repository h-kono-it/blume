---
"blume": patch
---

Index a config-sidebar section's landing page under its own section facet. A section declared as `sidebar: [{ label: "Guides", root: "guides/index", items: […] }]` carries its landing route on the group node, which the search crumb index skipped — so `/guides` itself indexed under the "Docs" default with an empty breadcrumb, the search dialog's "Guides" filter pill omitted the section's own landing page, and hosted-provider syncs uploaded the wrong facet for it. (Filesystem sidebars were unaffected: their index pages are page leaves, which still win over the group entry when both exist.)
