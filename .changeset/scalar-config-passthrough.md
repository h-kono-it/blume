---
"blume": patch
---

Add a `scalar` passthrough object to the `openapi` and `asyncapi` config blocks (Scalar renderer). Any [Scalar configuration](https://github.com/scalar/scalar/blob/main/documentation/configuration.md) set there is forwarded verbatim to the embedded `<ScalarComponent>` — `localization` (to translate Scalar's own UI), `agent`, `hideTestRequestButton`, `orderSchemaPropertiesBy`, and the rest. Options in the `scalar` object win over Blume's derived spec/theme config, making it a full escape hatch to Scalar's API; the dedicated `theme` field remains the ergonomic shorthand.
