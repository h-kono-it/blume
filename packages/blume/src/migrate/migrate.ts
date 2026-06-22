import { existsSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

import { dirname, join, relative } from "pathe";
import { glob } from "tinyglobby";

import type { BlumeConfig } from "../core/schema.ts";

export interface MigrationResult {
  moved: number;
  warnings: string[];
}

const writeBlumeConfig = async (
  root: string,
  config: BlumeConfig
): Promise<void> => {
  const body = `import { defineConfig } from "blume";\n\nexport default defineConfig(${JSON.stringify(config, null, 2)});\n`;
  await writeFile(join(root, "blume.config.ts"), body, "utf-8");
};

/** Move files into `docs/`, returning how many moved and any skips. */
const moveIntoDocs = async (
  root: string,
  absoluteFiles: string[],
  options: { from?: string; renameMeta?: boolean } = {}
): Promise<MigrationResult> => {
  const base = options.from ? join(root, options.from) : root;
  const warnings: string[] = [];
  let moved = 0;

  for (const file of absoluteFiles) {
    const rel = relative(base, file);
    const targetName = options.renameMeta
      ? rel.replace(/(?<sep>^|\/)meta\.json$/u, "$<sep>_meta.json")
      : rel;
    const dest = join(root, "docs", targetName);
    if (existsSync(dest)) {
      warnings.push(`Skipped ${rel} (target already exists)`);
      continue;
    }
    // oxlint-disable-next-line no-await-in-loop -- sequential fs moves
    await mkdir(dirname(dest), { recursive: true });
    // oxlint-disable-next-line no-await-in-loop -- sequential fs moves
    await rename(file, dest);
    moved += 1;
  }

  return { moved, warnings };
};

/** Migrate a Mintlify project (mint.json / docs.json + MDX content). */
export const migrateMintlify = async (
  root: string
): Promise<MigrationResult> => {
  const configFile = existsSync(join(root, "docs.json"))
    ? join(root, "docs.json")
    : join(root, "mint.json");

  const warnings: string[] = [];
  let spec: Record<string, unknown> = {};
  if (existsSync(configFile)) {
    spec = JSON.parse(await readFile(configFile, "utf-8"));
  } else {
    warnings.push("No mint.json or docs.json found; using defaults.");
  }

  const files = await glob(["**/*.{md,mdx}"], {
    absolute: true,
    cwd: root,
    ignore: ["node_modules/**", "docs/**", ".blume/**", "dist/**"],
  });
  const result = await moveIntoDocs(root, files);

  const colors = spec.colors as { primary?: string } | undefined;
  const config: BlumeConfig = {
    title: (spec.name as string) ?? (spec.title as string) ?? "Documentation",
  };
  if (typeof spec.description === "string") {
    config.description = spec.description;
  }
  if (colors?.primary) {
    config.theme = { accent: colors.primary };
  }
  await writeBlumeConfig(root, config);

  warnings.push(
    "Navigation is now inferred from files; review _meta.json for custom ordering.",
    "Mintlify components (Card, Callout, Tabs, Steps, Accordion) map to Blume built-ins."
  );

  return { moved: result.moved, warnings: [...result.warnings, ...warnings] };
};

const migrateFromContentDir = async (
  root: string,
  sourceDir: string,
  options: { title: string; renameMeta?: boolean }
): Promise<MigrationResult> => {
  if (!existsSync(join(root, sourceDir))) {
    return {
      moved: 0,
      warnings: [`Content directory ${sourceDir} not found.`],
    };
  }

  const patterns = options.renameMeta
    ? ["**/*.{md,mdx}", "**/meta.json"]
    : ["**/*.{md,mdx,mdoc}"];
  const files = await glob(patterns, {
    absolute: true,
    cwd: join(root, sourceDir),
  });
  const result = await moveIntoDocs(root, files, {
    from: sourceDir,
    renameMeta: options.renameMeta,
  });

  await writeBlumeConfig(root, { title: options.title });
  return result;
};

/** Migrate a Starlight project (src/content/docs). */
export const migrateStarlight = (root: string): Promise<MigrationResult> =>
  migrateFromContentDir(root, "src/content/docs", { title: "Documentation" });

/** Migrate a Fumadocs project (content/docs + meta.json). */
export const migrateFumadocs = (root: string): Promise<MigrationResult> =>
  migrateFromContentDir(root, "content/docs", {
    renameMeta: true,
    title: "Documentation",
  });

export const migrators: Record<
  string,
  (root: string) => Promise<MigrationResult>
> = {
  fumadocs: migrateFumadocs,
  mintlify: migrateMintlify,
  starlight: migrateStarlight,
};
