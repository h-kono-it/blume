---
"blume": patch
---

Rank Japanese and Chinese search results by whole compound terms rather than their parts. Dictionary segmentation cuts a term like 資金決済法 into 資金 / 決済 / 法, and because Orama scores a bag of words, a page mentioning each fragment somewhere could outrank the page the term is about — on one 65-page Japanese site every law-name query returned its index page first. Han, Hiragana and Katakana runs are now indexed as overlapping character bigrams, and queries on those indexes look for documents carrying all of a term's bigrams before falling back to the any-token default, so sentence-like queries still return their closest pages. Korean and Thai keep their segmented words, and Latin terms are still indexed whole — though on a Japanese or Chinese index a query of several Latin words now also prefers pages carrying all of them, with the same any-token fallback.
