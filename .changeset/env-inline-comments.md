---
"blume": patch
---

Strip unquoted inline `# comments` from `.env` values, matching dotenv/Vite — a line like `GITHUB_TOKEN=abc # note` no longer hands sources a token with the comment appended.
