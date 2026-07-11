---
"blume": patch
---

Fix `blume eject`'s next-steps hint telling bun users to run `bun build` — that invokes Bun's bundler ("error: Missing entrypoints"), not the package.json `build` script, because unlike `dev` the script name is shadowed by a builtin subcommand. The hint now prints `bun run build` (npm already used the `run` form; pnpm/yarn are unaffected).
