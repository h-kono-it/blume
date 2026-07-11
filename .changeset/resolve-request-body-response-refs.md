---
"blume": patch
---

`$ref`s to `components.requestBodies` and `components.responses` are now resolved on operation pages, so a referenced request body renders its real content type, schema, and code-sample bodies (instead of an empty `application/json` section and samples with no body), and a referenced response shows its description and schema.
