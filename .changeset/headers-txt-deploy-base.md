---
"blume": patch
---

Prefix the `_headers` `.txt` charset rule with only `deployment.base` — `llms.txt`/`llms-full.txt` are served at the deploy root, so a `basePath` deployment shipped a `/docs/*.txt` rule that matched nothing and left the mojibake fix inert
