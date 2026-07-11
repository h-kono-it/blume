---
"blume": patch
---

The `<Math>` component is now wired into the generated runtime whenever math can actually appear: block math (`$$…$$`) in plain `.md` files, math in staged remote-source content, and explicitly authored `<Math code="…" />` tags all count. Detection previously only scanned local `.mdx` files for a literal `$$`, so those cases rendered a raw "Expected component Math to be defined" MDX error instead of the equation.
