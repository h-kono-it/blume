---
"blume": patch
---

Give every generated OpenAPI page its own meta description. Operation and overview pages set no `description`, so all of them fell back to the site-wide default — a spec with twenty operations shipped twenty pages carrying one identical description, which search engines treat as duplicate content. Each operation page now derives a description from the spec's own prose (its description, or its summary) followed by the endpoint it documents, and the overview page uses the spec description. These land in `seo.description`, so they feed the meta tag without also printing as a visible subtitle above the body prose.
