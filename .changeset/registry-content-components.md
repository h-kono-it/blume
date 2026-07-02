---
"blume": minor
---

Ship every built-in content component through `blume add`, not just the five
layout slots. `blume add callout`, `card`, `card-group`, `code-group`, `badge`,
`steps`, `step`, `tabs`, `tab`, `accordion`, `accordion-item`, `columns`,
`column`, `frame`, `expandable`, `panel`, `tooltip`, `tile`, and `prompt` copy the
component into your project as editable source (imports rewritten to `blume/*`),
then print the `defineComponents({ mdx })` snippet to wire it back. The page
`feedback` rating is also available (`blume add feedback`) via a new `Feedback`
layout slot.
