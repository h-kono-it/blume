import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";

import { dirname, join } from "pathe";
import { glob } from "tinyglobby";

import type { BlumeConfig } from "../../core/schema.ts";
import { assetSegments } from "./assets.ts";
import { loadMintlifyConfig } from "./config.ts";
import { mintlifyI18n } from "./i18n.ts";
import { transformMintlifyContent } from "./transform.ts";

export interface MintlifyMigrationResult {
  moved: number;
  warnings: string[];
}

/** Recursively drop `undefined`, empty arrays, and empty objects. */
const prune = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(prune);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      const pruned = prune(raw);
      if (pruned === undefined) {
        continue;
      }
      if (Array.isArray(pruned) && pruned.length === 0) {
        continue;
      }
      if (
        pruned &&
        typeof pruned === "object" &&
        !Array.isArray(pruned) &&
        Object.keys(pruned).length === 0
      ) {
        continue;
      }
      out[key] = pruned;
    }
    return out;
  }
  return value;
};

const writeBlumeConfig = async (
  root: string,
  config: BlumeConfig
): Promise<void> => {
  const body = `import { defineConfig } from "blume";\n\nexport default defineConfig(${JSON.stringify(prune(config), null, 2)});\n`;
  await writeFile(join(root, "blume.config.ts"), body, "utf-8");
};

interface RelocatedAssets {
  /** Top-level dirs served in place via `content.assets` (no files moved). */
  served: string[];
  /** Top-level files moved under `public/`. */
  moved: string[];
}

/**
 * Make referenced top-level assets resolvable in Blume. Directories (e.g.
 * Mintlify's `images/`) are left in place and served via `content.assets`, so
 * the migration doesn't churn every file under them; loose top-level files
 * (a root `favicon.png`, `logo.png`) are moved under `public/` since a mount
 * points at a directory.
 */
const relocateAssets = async (
  root: string,
  segments: string[]
): Promise<RelocatedAssets> => {
  const served: string[] = [];
  const moved: string[] = [];
  for (const segment of segments) {
    const source = join(root, segment);
    if (!existsSync(source) || segment === "public") {
      continue;
    }
    // oxlint-disable-next-line no-await-in-loop -- sequential fs stats
    const stats = await stat(source);
    if (stats.isDirectory()) {
      served.push(segment);
      continue;
    }
    const dest = join(root, "public", segment);
    if (existsSync(dest)) {
      continue;
    }
    // oxlint-disable-next-line no-await-in-loop -- sequential fs moves
    await mkdir(join(root, "public"), { recursive: true });
    // oxlint-disable-next-line no-await-in-loop -- sequential fs moves
    await rename(source, dest);
    moved.push(segment);
  }
  return { moved, served };
};

/**
 * Fold relocated assets into the config (served dirs become `content.assets`)
 * and record what happened. Served dirs stay in place; only loose files moved.
 */
const applyRelocatedAssets = (
  config: BlumeConfig,
  assets: RelocatedAssets,
  warnings: string[]
): void => {
  if (assets.served.length > 0) {
    config.content = {
      ...config.content,
      assets: [
        ...new Set([...(config.content?.assets ?? []), ...assets.served]),
      ],
    };
    warnings.push(
      `Kept asset dir(s) in place, served via content.assets: ${assets.served.join(", ")}.`
    );
  }
  if (assets.moved.length > 0) {
    warnings.push(`Moved assets into public/: ${assets.moved.join(", ")}.`);
  }
};

/**
 * Delete the inlined markdown snippets. Component files (e.g. `.jsx`) are kept
 * because their imports were rewritten to resolve against `/snippets`.
 */
const cleanupSnippets = async (
  root: string,
  kept: Set<string>,
  warnings: string[]
): Promise<void> => {
  const dir = join(root, "snippets");
  if (!existsSync(dir)) {
    return;
  }
  const markdown = await glob(["**/*.{md,mdx}"], { absolute: true, cwd: dir });
  for (const file of markdown) {
    // oxlint-disable-next-line no-await-in-loop -- sequential fs removes
    await rm(file, { force: true });
  }
  const remaining = await glob(["**/*"], { cwd: dir, dot: true });
  if (remaining.length === 0) {
    await rm(dir, { force: true, recursive: true });
    warnings.push("Inlined and removed the /snippets directory.");
  } else {
    warnings.push(
      `Inlined markdown snippets; kept ${remaining.length} component file(s) under /snippets.`
    );
  }
  if (kept.size > 0) {
    warnings.push(
      `Rewrote ${kept.size} component snippet import(s) to relative paths; verify they resolve.`
    );
  }
};

/**
 * Migrate a Mintlify project to Blume: translate `docs.json`/`mint.json` into
 * `blume.config.ts`, rewrite every page to idiomatic Blume MDX in place, and
 * relocate static assets. Content stays at the project root (`content.root`
 * is `"."`).
 */
export const migrateMintlifyProject = async (
  root: string
): Promise<MintlifyMigrationResult> => {
  const warnings: string[] = [];
  const configFile = existsSync(join(root, "docs.json"))
    ? join(root, "docs.json")
    : join(root, "mint.json");

  let config: BlumeConfig;
  if (existsSync(configFile)) {
    config = await loadMintlifyConfig(root, configFile);
    const spec = JSON.parse(await readFile(configFile, "utf-8")) as Record<
      string,
      unknown
    >;
    const i18n = mintlifyI18n(spec);
    if (i18n) {
      config.i18n = i18n;
      // Language switching is handled by Blume i18n, not a nav selector.
      if (config.navigation?.selectors) {
        config.navigation.selectors = config.navigation.selectors.filter(
          (selector) => selector.kind !== "language"
        );
      }
      warnings.push(
        `Mapped ${i18n.locales.length} languages to i18n.locales (default: ${i18n.defaultLocale}); review the locale labels.`
      );
    }
    const openapiSources = config.openapi?.sources ?? [];
    if (openapiSources.length > 0) {
      warnings.push(
        `Mapped ${openapiSources.length} OpenAPI spec source(s) to openapi.sources (native reference renderer); verify each spec path or URL resolves.`
      );
    }
  } else {
    warnings.push("No docs.json or mint.json found; writing a default config.");
    config = { content: { root: "." }, title: "Documentation" };
  }

  const variables = (config.variables as Record<string, string>) ?? {};
  // Globals are inlined into content below; Blume has no runtime substitution.
  config.variables = undefined;

  const files = await glob(["**/*.{md,mdx}"], {
    absolute: true,
    cwd: root,
    ignore: [
      "node_modules/**",
      ".blume/**",
      "dist/**",
      "public/**",
      "snippets/**",
    ],
  });

  let moved = 0;
  const removedKeys = new Set<string>();
  const unsupported = new Set<string>();
  const keptComponents = new Set<string>();
  for (const file of files) {
    // oxlint-disable-next-line no-await-in-loop -- sequential fs writes
    const raw = await readFile(file, "utf-8");
    // oxlint-disable-next-line no-await-in-loop -- sequential transforms
    const result = await transformMintlifyContent(raw, {
      filePath: file,
      root,
      variables,
    });
    if (result.content !== raw) {
      // oxlint-disable-next-line no-await-in-loop -- sequential fs writes
      await mkdir(dirname(file), { recursive: true });
      // oxlint-disable-next-line no-await-in-loop -- sequential fs writes
      await writeFile(file, result.content, "utf-8");
    }
    for (const key of result.removed) {
      removedKeys.add(key);
    }
    for (const name of result.unsupported) {
      unsupported.add(name);
    }
    for (const name of result.components) {
      keptComponents.add(name);
    }
    moved += 1;
  }

  const assets = await relocateAssets(root, assetSegments(config));
  await cleanupSnippets(root, keptComponents, warnings);

  if (config.content?.exclude) {
    config.content.exclude = [...new Set(config.content.exclude)];
  }
  applyRelocatedAssets(config, assets, warnings);
  await writeBlumeConfig(root, config);

  if (Object.keys(variables).length > 0) {
    warnings.push(
      `Inlined ${Object.keys(variables).length} docs.json variable(s) into content; Blume has no runtime variable substitution.`
    );
  }
  if (removedKeys.size > 0) {
    warnings.push(
      `Dropped unsupported page frontmatter keys: ${[...removedKeys].join(", ")}.`
    );
  }
  if (unsupported.size > 0) {
    warnings.push(
      `Components without a Blume equivalent need manual review (use the OpenAPI reference instead): ${[...unsupported].join(", ")}.`
    );
  }
  warnings.push(
    "Review blume.config.ts; navigation, theme, and chrome were mapped from docs.json."
  );

  return { moved, warnings };
};
