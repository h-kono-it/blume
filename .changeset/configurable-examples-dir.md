---
"blume": patch
---

Make `<Component>`'s examples directory configurable. `<Component path>` previously only resolved live previews (and their source) from a top-level `examples/` directory, so projects whose examples live elsewhere — e.g. a registry layout like `registry/<pkg>/…`, which also doubles as the shadcn payload — couldn't adopt it. Set `examples` in `blume.config.ts` to point at any directory under the project root (default `"examples"`); a `<Component path>` key is then relative to that directory. For example, with `examples: "registry/files-sdk"`, a file at `registry/files-sdk/file-list/basic.tsx` is `<Component path="file-list/basic" />`.
