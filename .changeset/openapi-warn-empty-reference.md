---
"blume": patch
---

An OpenAPI spec that parses but declares no operations (say, a config file pointed at by mistake) now emits a build warning naming the spec, instead of silently shipping an empty API reference tab.
