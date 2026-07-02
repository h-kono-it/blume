---
"blume": minor
---

`blume init` gains starter and workflow flags:

- `--template docs|api|sdk|changelog` — scaffold from a starter (an OpenAPI
  reference, an SDK layout, or a changelog with a first entry) instead of the
  plain docs seed.
- `--package-manager npm|pnpm|yarn|bun` — tailor the printed next-steps.
- `--eject` — scaffold and immediately eject to a standalone Astro project, or
  (when dependencies aren't installed yet) guide you to `blume eject` after
  install.
