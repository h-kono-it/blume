---
"blume": minor
---

Declare `Content-Signal` usage preferences in the generated `robots.txt`. Blume now emits a `Content-Signal` line **on by default** with every signal set to `yes` — `search` (traditional and AI search indexing), `ai-input` (grounding / RAG at answer time), and `ai-train` (model training) — matching its stance that docs are open to humans and agents alike:

```
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /
```

Tune it with `seo.contentSignals`. Restrict individual signals — the rest stay `yes`:

```ts
export default defineConfig({
  seo: {
    contentSignals: { aiTrain: false }, // → search=yes, ai-input=yes, ai-train=no
  },
});
```

Or set `contentSignals: false` to drop the declaration entirely. Existing sites that ship their own `public/robots.txt` are unaffected — Blume never overwrites it.
