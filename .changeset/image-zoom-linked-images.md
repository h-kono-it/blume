---
"blume": patch
---

Skip images that are themselves links when wiring click-to-zoom. A linked image (`[![alt](/shot.png)](https://example.com)`) navigates on click, so the zoom binding only flashed an overlay in the instant before navigation while the `cursor-zoom-in` affordance promised a zoom that never happened.
