---
"blume": patch
---

Make `blume audit --claude`/`--codex` work on Windows: npm installs the agent CLIs as `.cmd` shims that Node only runs through a shell, and cmd.exe can't carry the multi-line prompt as an argument — the handoff now writes the prompt to a file and launches the shim with a one-line pointer, and a missing executable still gets the install hint instead of a raw ENOENT
