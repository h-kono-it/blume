#!/usr/bin/env bun
// Build the Node-runnable CLI into dist/.
//
// Blume ships its Astro runtime (components, theme, integration, markdown
// processors) as source: the consumer's Astro/Vite pipeline compiles those, and
// Tailwind's `@source` scans the package's component source for class names. The
// only code that runs *outside* a transpiler is the CLI entry, so that is the
// only thing that needs bundling to plain JS for Node.
//
// Bun bundles src/cli/index.ts (and its Node-side imports) into
// dist/cli/index.js and externalizes every declared dependency — those resolve
// from the consumer's install at runtime. tsgo stays the typechecker
// (`bun run typecheck`); no .d.ts is emitted because nothing imports the CLI as
// a typed module — the public API's types come from the shipped `src` exports.
import { rm } from "node:fs/promises";
import path from "node:path";

import pkg from "../package.json" with { type: "json" };

const root = path.resolve(import.meta.dirname, "..");
const dist = path.resolve(root, "dist");
const srcDir = path.resolve(root, "src");

// Dependencies, peers, and optional deps are the consumer's to resolve — never
// bundle them in. Everything else (Blume's own src) is bundled into the CLI.
const external = [
  ...Object.keys(pkg.dependencies ?? {}),
  ...Object.keys(pkg.peerDependencies ?? {}),
  ...Object.keys(pkg.optionalDependencies ?? {}),
];

await rm(dist, { force: true, recursive: true });

const result = await Bun.build({
  // Make dist/cli/index.js independently executable; harmless when the bin
  // launcher imports it (Node/Bun strip a leading shebang from loaded modules).
  banner: "#!/usr/bin/env node",
  entrypoints: [path.resolve(srcDir, "cli/index.ts")],
  external,
  format: "esm",
  outdir: dist,
  // Mirror the src/ tree so the entry lands at dist/cli/index.js.
  root: srcDir,
  sourcemap: "linked",
  target: "node",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log.message);
  }
  throw new Error("CLI bundle failed");
}

console.log(`build: dist/ ready (${result.outputs.length} file(s))`);
