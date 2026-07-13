import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";

import { dirname, join } from "pathe";

import type { ResolvedConfig } from "../core/schema.ts";
import type { ProjectContext } from "../core/types.ts";

type Adapter = NonNullable<ResolvedConfig["deployment"]["adapter"]>;

/**
 * Server adapters whose deploy bundle lands *outside* Astro's `outDir`, at a
 * path relative to the Astro project root. Blume points the Astro root at the
 * hidden `<root>/.blume` runtime, so these adapters write their bundle to
 * `<root>/.blume/<path>` — where the deploy platform never looks. Each value is
 * the sub-path to surface up to the real project root.
 *
 * `vercel` writes a Build Output API v3 tree at `.vercel/output`; only that
 * subtree is moved, so a `vercel pull`-ed `.vercel/project.json` sitting at the
 * project root survives the relocation. `netlify` writes a Frameworks API tree
 * at `.netlify/v1` (its `.netlify/build` sibling is only the intermediate SSR
 * bundle, already traced into `v1/functions`); only `v1` is moved, so the
 * `.netlify/state.json` written by `netlify link` survives too. `node` and
 * `cloudflare` emit into `dist/` (already at the project root), so they are
 * absent here and need no relocation.
 */
export const ADAPTER_OUTPUT_PATHS: Partial<Record<Adapter, string>> = {
  netlify: ".netlify/v1",
  vercel: ".vercel/output",
};

/**
 * Directory whose contents the deploy platform serves as static files. Build
 * artifacts (robots.txt, sitemap.xml, llms.txt, …) must be written here to be
 * served. For a Vercel server build that is the adapter's
 * `.vercel/output/static`; for a Node server build it is Astro's
 * `build.client` dir (`dist/client/`), the only directory the standalone
 * server's static handler reads from. Netlify publishes `dist/` itself and
 * Cloudflare serves the `outDir` root, so every other build serves `dist/`.
 */
export const deployStaticDir = (
  config: ResolvedConfig,
  context: ProjectContext
): string => {
  const { adapter, output } = config.deployment;
  if (output === "server" && adapter === "vercel") {
    return join(context.root, ".vercel", "output", "static");
  }
  const dist = context.distDir ?? join(context.root, "dist");
  if (output === "server" && adapter === "node") {
    return join(dist, "client");
  }
  return dist;
};

/** Outcome of {@link surfaceAdapterOutput}, for logging and `.gitignore`. */
export type SurfaceResult =
  | { moved: false }
  | { from: string; ignore: string; moved: true; to: string };

/**
 * Move a server adapter's deploy bundle out of the hidden `.blume` runtime and
 * up to the project root, where the deploy platform (and `vercel deploy
 * --prebuilt`) expects it. A no-op for static builds, for adapters that emit
 * into `dist/`, and when the expected output is absent.
 */
export const surfaceAdapterOutput = async (
  config: ResolvedConfig,
  context: ProjectContext
): Promise<SurfaceResult> => {
  const { adapter, output } = config.deployment;
  if (output !== "server" || !adapter) {
    return { moved: false };
  }
  const rel = ADAPTER_OUTPUT_PATHS[adapter];
  if (!rel) {
    return { moved: false };
  }
  const from = join(context.outDir, rel);
  const to = join(context.root, rel);
  if (!existsSync(from)) {
    return { moved: false };
  }
  await mkdir(dirname(to), { recursive: true });
  await rm(to, { force: true, recursive: true });
  // `verbatimSymlinks` keeps each symlink's target text as written. Without it,
  // `cp` resolves every relative target against the *source*, rewriting it to an
  // absolute path under `.blume` — which this function then deletes. Adapters
  // that trace dependencies into their function bundle link one package to
  // another that way (under an isolated linker — Bun's `isolated` mode, pnpm —
  // that is every external dependency the function imports), so the resolved
  // links leave the deployed function dying on its first external import with
  // ERR_MODULE_NOT_FOUND. Verbatim, the links stay relative and internal to the
  // bundle, surviving both this move and the platform's own (Vercel mounts the
  // bundle at `/var/task`).
  await cp(from, to, { recursive: true, verbatimSymlinks: true });
  await rm(from, { force: true, recursive: true });
  // The `.gitignore` entry is the surfaced top-level dir (`.vercel`/`.netlify`),
  // never the moved sub-path — the platform's own state (`.vercel/project.json`,
  // `.netlify/state.json`) lives there too and must also be ignored.
  return { from, ignore: `${rel.split("/")[0]}/`, moved: true, to };
};
