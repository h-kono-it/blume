---
"blume": patch
---

A search client that fails to load in production (for example a transient failure fetching the Pagefind bundle) now shows the "Something went wrong" error message in the search dialog instead of the misleading "Search is available in the production build" dev-only hint. Loading still retries the next time the dialog opens.
