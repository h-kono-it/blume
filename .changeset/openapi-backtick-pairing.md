---
"blume": patch
---

Pair backtick code in OpenAPI descriptions the way CommonMark does — a run only closes on an _equal-length_ run. A lone inline backtick followed by a code fence used to "close" on the fence's first backtick, leaving `{`/`<` in the surrounding prose unescaped (an MDX compile error that fails the operation page's build) and entity-escaping the fence body.
