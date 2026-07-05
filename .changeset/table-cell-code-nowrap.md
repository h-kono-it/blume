---
"blume": patch
---

Actually apply the table-cell inline-code nowrap rule: GFM renders `<td><code>` directly, which the descendant-only selector never matched, so inline code in table cells still wrapped.
