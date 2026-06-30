import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";

import { join } from "pathe";
import { glob } from "tinyglobby";

import matter from "../../core/frontmatter.ts";
import { writeBlumeConfig } from "../shared.ts";
import { loadStarlightConfig, mapStarlightConfig } from "./config.ts";
import {
  hasAliasedAssets,
  rewriteStarlightAsides,
  rewriteStarlightComponents,
  stripStarlightImports,
  unsupportedStarlightComponents,
} from "./content.ts";
import { normalizeStarlightPageMeta } from "./frontmatter.ts";
import { starlightI18n } from "./i18n.ts";

export interface StarlightMigrationResult {
  moved: number;
  warnings: string[];
}

/** Starlight always keeps its docs collection here. */
const CONTENT_DIR = "src/content/docs";

interface PageResult {
  aliased: boolean;
  removed: string[];
  unsupported: string[];
}

/** Rewrite one Starlight page to idiomatic Blume MDX, in place. */
const transformPage = async (file: string): Promise<PageResult> => {
  const raw = await readFile(file, "utf-8");
  let text = stripStarlightImports(raw);
  text = rewriteStarlightAsides(text);
  text = rewriteStarlightComponents(text);
  const unsupported = unsupportedStarlightComponents(text);
  const aliased = hasAliasedAssets(text);

  const parsed = matter(text);
  const { data, removed } = normalizeStarlightPageMeta(parsed.data);
  const content =
    Object.keys(data).length > 0
      ? matter.stringify(parsed.content, data)
      : parsed.content;
  if (content !== raw) {
    await writeFile(file, content, "utf-8");
  }
  return { aliased, removed, unsupported };
};

/**
 * Migrate a Starlight project to Blume: translate the `starlight({...})` options
 * out of `astro.config.*` into `blume.config.ts`, then rewrite each page under
 * `src/content/docs` to idiomatic Blume MDX in place (asides → directives,
 * component renames, frontmatter mapping). Content stays put — the generated
 * config points `content.root` at `src/content/docs`.
 */
export const migrateStarlightProject = async (
  root: string
): Promise<StarlightMigrationResult> => {
  const { options, warnings } = await loadStarlightConfig(root);
  const config = mapStarlightConfig(options, warnings);

  const i18n = starlightI18n(options);
  if (i18n) {
    config.i18n = i18n;
    warnings.push(
      `Mapped ${i18n.locales.length} locale(s) to i18n (default: ${i18n.defaultLocale}); review the locale labels.`
    );
  }

  const base = join(root, CONTENT_DIR);
  if (!existsSync(base)) {
    await writeBlumeConfig(root, config);
    return {
      moved: 0,
      warnings: [
        ...warnings,
        `Content directory ${CONTENT_DIR} not found; wrote blume.config.ts only.`,
      ],
    };
  }

  const files = await glob(["**/*.{md,mdx}"], { absolute: true, cwd: base });
  const results = await Promise.all(files.map(transformPage));

  await writeBlumeConfig(root, config);

  const removedKeys = new Set<string>();
  const unsupported = new Set<string>();
  let aliasedAssets = false;
  for (const result of results) {
    for (const key of result.removed) {
      removedKeys.add(key);
    }
    for (const name of result.unsupported) {
      unsupported.add(name);
    }
    aliasedAssets ||= result.aliased;
  }

  if (removedKeys.size > 0) {
    warnings.push(
      `Dropped unsupported page frontmatter keys: ${[...removedKeys].join(", ")}.`
    );
    if (removedKeys.has("hero") || removedKeys.has("template")) {
      warnings.push(
        "Pages using `template: splash` / `hero` have no automatic equivalent — rebuild them as custom pages under `pages/`."
      );
    }
  }
  if (unsupported.size > 0) {
    warnings.push(
      `Components without a drop-in Blume equivalent need manual review: ${[...unsupported].join(", ")}.`
    );
  }
  if (aliasedAssets) {
    warnings.push(
      "Some pages reference images via `~/`/`@/` aliases; rewrite them to relative or /public paths."
    );
  }
  warnings.push(
    "Content stays under src/content/docs; the now-unused astro.config.*, src/content.config.ts, and @astrojs/starlight dependency are safe to remove."
  );

  return { moved: results.length, warnings };
};
