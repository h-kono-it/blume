---
"blume": patch
---

`<AutoTypeTable>` now reads optionality from the checker's symbol instead of the declaration's question token, so mapped and utility types document correctly: `Partial<Base>` properties render as optional and `Required<Base>` properties as required.
