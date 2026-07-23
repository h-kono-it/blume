---
"blume": patch
---

Extract markdown link targets with balanced parentheses and image-wrapped labels intact. `[wiki](https://en.wikipedia.org/wiki/Foo_(bar))` was truncated at the inner `)` and reported as a broken link, and the outer target of `[![alt](/img.png)](/target)` was never validated at all (the nested image's own target still is).
