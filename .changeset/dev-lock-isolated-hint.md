---
"blume": patch
---

The refusal printed when a command would corrupt a running `blume dev` server's `.blume` runtime now only suggests re-running with `--isolated` for commands that actually support the flag (`build` and `check`). `blume eject` now gets accurate advice instead of a flag it silently ignores.
