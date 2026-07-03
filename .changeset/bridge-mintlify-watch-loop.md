---
"blume": patch
---

`blume dev` in Mintlify bridge mode is no longer slow and noisy. Bridge mode roots content at the project directory, which contains Blume's generated `.blume/` output — and the dev server rewrites `.blume/.astro/*` (its data store and font cache) on every request. Two things fed on those writes:

- The Mintlify source's recursive `fs.watch` saw them and re-ran a full rescan + runtime regeneration, whose own writes landed back under `.blume/` and re-fired the watcher — a self-sustaining storm that stalled page renders (8–26s). The watcher now ignores events under `.blume/`, `node_modules`, and other non-content trees.
- Astro's content-layer `docs` collection was rooted at the project directory even though, in bridge mode, every page renders through the staged collection — so its glob loader watched `.blume/.astro/fonts/` and warned `No entry type found` for each `.woff2` on every rebuild. The `docs` collection now globs nothing when no filesystem source feeds it (glob-pattern negations can't exclude a subtree from Astro's watcher, so an empty pattern is the only reliable fix), which also avoids double-loading the staged bodies under `.blume/content`.

Normal (non-bridge) projects were unaffected, since their content root sits below `.blume/`.
