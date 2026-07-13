---
"blume": patch
---

Render the Ask AI trigger from the shared header instead of wiring it up per page. Custom pages built on `PageLayout` (a landing page, most of all) never passed the header's `ask` slot, so the Ask AI button — and the search modal's hand-off to it — silently went missing on them while the generated docs, changelog, and reference pages had it. The header now owns the trigger and reads whether Ask AI is on from the config, so every page gets it; pass `askEnabled={false}` to opt a page out.
