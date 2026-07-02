---
"blume": patch
---

Warn early when an enabled feature needs a runtime secret that isn't set, so it
surfaces at `blume dev`/`build` instead of failing at the first request in
production. Covers Ask AI (`AI_GATEWAY_API_KEY`, or the provider's `apiKeyEnv`)
and Mixedbread search (`MIXEDBREAD_API_KEY`). It's a warning, not a hard failure,
since the value may live only in the deploy environment.
