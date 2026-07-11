---
"blume": patch
---

Render the yarn tab of a `package-install` `ci` command as `yarn install --immutable`. It previously emitted `--frozen-lockfile`, which Yarn 4 removed — so there was no yarn version where both the generated `ci` command and the Berry-only `yarn dlx` (from `exec`) worked; a Yarn 4 reader copying the tab got "Unsupported option name --frozen-lockfile".
