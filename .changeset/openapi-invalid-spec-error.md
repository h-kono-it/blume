---
"blume": patch
---

An OpenAPI spec file that isn't a valid document (an empty file, or YAML that parses to a scalar or list) now fails with a clear "is not a valid OpenAPI document" error and a fix-the-file suggestion, instead of crashing with a raw TypeError and a misleading reachability hint.
