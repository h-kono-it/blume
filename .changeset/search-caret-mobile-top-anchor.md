---
"blume": patch
---

Keep the text caret inside the search input on mobile. The search dialog was vertically centered, so when the on-screen keyboard opened and the viewport shrank, the dialog re-centered and the input moved up while the native caret stayed put — stranding the cursor below the input, over the results. The dialog is now top-anchored on small screens (like DocSearch/cmdk) so the input sits above where the keyboard appears and doesn't move, and its height is capped to the dynamic viewport so it fits above the keyboard. Desktop keeps its centered layout.
