---
"blume": patch
---

Harden the agent-facing code-fence helper against a polynomial-time regex (ReDoS). Trailing newlines are now stripped with an unambiguous pattern, so example source with many interior blank lines can't force quadratic backtracking.
