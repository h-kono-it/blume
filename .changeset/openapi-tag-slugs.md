---
"blume": patch
---

Give every distinct OpenAPI tag a unique slug. Slugging strips all non-ASCII, so two non-Latin tags (`ペット`, `注文`) both collapsed to `operations` — merging their routes and sidebar groups and dropping the second tag's overview section. Colliding slugs now gain `-2`, `-3`, … in first-seen order.
