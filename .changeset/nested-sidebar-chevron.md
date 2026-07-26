---
"blume": patch
---

Fix a nested sidebar group's chevron pointing down while the group is collapsed. The chevron rotated on Tailwind's `group-open:` variant, which matches any descendant of an open `.group` — and since every collapsible group in the tree is a `.group`, expanding a parent rotated the chevrons of its collapsed children too, so the arrow disagreed with the items it was hiding. The rotation is now scoped to the group's own `details`, leaving each chevron to reflect only its own open state.
