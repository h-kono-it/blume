---
"blume": patch
---

Add a `dateFormat` config option for the "last updated" stamp and the changelog timeline. Both surfaces previously hardcoded `dateStyle: "long"`; they now share a configurable pass-through to `Intl.DateTimeFormat` options, defaulting to `{ dateStyle: "long" }` so existing sites are unchanged. Set a preset (`dateFormat: { dateStyle: "medium" }`) or a numeric house style (`dateFormat: { year: "numeric", month: "2-digit", day: "2-digit" }`); dates still render in the site's locale and in UTC unless a `timeZone` is given.
