---
"blume": patch
---

Stop escaping `>` in OpenAPI descriptions rendered to MDX. It isn't MDX-special on its own, and escaping it turned a common `> **Note:** …` blockquote into a literal "&gt; Note:" paragraph.
