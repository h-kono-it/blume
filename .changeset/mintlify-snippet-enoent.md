---
"blume": patch
---

A dangling Mintlify snippet import no longer aborts the whole migration. `blume migrate mintlify` crashed with a raw `ENOENT` when any page imported a snippet file that doesn't exist — after some pages were already rewritten in place and before `blume.config.ts` was written, with no hint which page failed. The affected page (missing snippet or circular snippet chain) is now left unconverted with a warning naming both the page and the snippet, and the rest of the migration completes.
