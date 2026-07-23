---
"blume": patch
---

Stop reporting every `blume audit --claude`/`--codex` launch failure as "not found on PATH". Only a missing executable (`ENOENT`) gets the install hint now; any other spawn failure (`EACCES`, `EMFILE`, …) surfaces as itself instead of being masked by an irrelevant install suggestion.
