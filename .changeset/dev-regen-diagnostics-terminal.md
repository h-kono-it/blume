---
"blume": patch
---

Content and config errors introduced while `blume dev` is running are now printed to the terminal as well as shown in the browser error overlay. On published installs the overlay channel could be unavailable, so an edit that broke frontmatter or content previously produced no message anywhere.
