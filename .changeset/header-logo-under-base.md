---
"blume": patch
---

A header logo configured as a public-dir path (e.g. `logo: "/logo.png"`) now renders correctly on sites deployed under `deployment.base` — the light and dark logo images get the base prefix like the favicon and brand link already did, instead of 404ing on every page. Remote http(s) logo URLs pass through unchanged.
