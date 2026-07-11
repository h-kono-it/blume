---
"blume": patch
---

Hydrated component-override wrapper filenames are now injective: distinct override keys that only differ in punctuation (for example `"Foo.Bar"` and `"Foo_Bar"`) no longer collapse to the same generated `.astro` file, which raced two concurrent writes at one path and silently rendered one key with the other's component.
