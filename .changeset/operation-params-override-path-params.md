---
"blume": patch
---

Operation-level parameters now override path-level parameters with the same name and location, per the OpenAPI spec, so a re-declared parameter renders once in the parameters table instead of twice — and no longer duplicates itself in sample request URLs (`?limit=0&limit=0`).
