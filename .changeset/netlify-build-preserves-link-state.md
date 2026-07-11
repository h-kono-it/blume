---
"blume": patch
---

`blume build` with the Netlify adapter now surfaces only the `.netlify/v1` deploy bundle instead of replacing the whole `.netlify` directory, so the `.netlify/state.json` written by `netlify link` survives every build.
