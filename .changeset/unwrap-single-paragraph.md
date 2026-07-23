---
"blume": patch
---

Only unwrap a _single_ rendered paragraph in `<Prompt>`, `<Frame>`, and `<Tooltip>`. The greedy unwrap matched across multiple paragraphs, injecting unbalanced `</p>`/`<p>` tags via `set:html` — a multi-paragraph description, caption, or tooltip label broke the surrounding layout when the parser re-parented the stray tags.
