---
"blume": patch
---

Example generation now honors `const` schemas (the OpenAPI 3.1 discriminator idiom), so `{ type: "string", const: "dog" }` renders `"dog"` in request/response examples instead of the `"string"` placeholder.
