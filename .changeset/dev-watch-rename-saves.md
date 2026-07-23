---
"blume": patch
---

Watch `blume.config.ts`, `theme.css`, and `components.ts` via their parent directory in `blume dev`. Watching the file path tracks the inode, so a rename-replace save (vim and most "atomic save" editors) orphaned the watcher after the first save — every later edit was silently ignored until the server restarted.
