---
"blume": patch
---

Keep `/` separators in Sanity and Notion slugs. Slugging deleted slashes along with other punctuation, so a `guides/setup` slug was mashed into `guidessetup` — and two documents whose slugs differ only by a slash silently overwrote each other. Segments are now slugged individually.
