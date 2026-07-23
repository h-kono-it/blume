---
"blume": patch
---

Apply `basePath` to configured redirects before `blume audit` resolves them. Redirects are authored as if mounted at root and gain the base at build time, but the audit compared them raw against built page URLs that carry the base — so every redirect on a `basePath` site was reported `REDIRECT_BROKEN`, while `LINK_TO_REDIRECT` and `REDIRECT_SOURCE_IS_PAGE` could never fire.
