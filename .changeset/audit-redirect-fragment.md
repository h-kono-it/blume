---
"blume": patch
---

Strip query strings and fragments from redirect destinations before `blume audit` checks them against the build. A working redirect to `/guide#setup` or `/search?q=x` was reported `REDIRECT_BROKEN` because the suffixed path is not a file-tree member.
