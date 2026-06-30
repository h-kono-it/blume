import { existsSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";

import { basename, dirname, extname, join, relative } from "pathe";
import { glob } from "tinyglobby";

import matter from "../../core/frontmatter.ts";
import type { BlumeConfig, FolderMeta } from "../../core/schema.ts";
import { writeBlumeConfig } from "../shared.ts";
import {
  rewriteNextraCallouts,
  stripNextraImports,
  unsupportedNextraComponents,
} from "./content.ts";
import type { NextraPageOverride } from "./frontmatter.ts";
import { normalizeNextraPageMeta } from "./frontmatter.ts";
import { parseNextraMeta, toBlumeFolderMeta } from "./meta.ts";

export interface NextraMigrationResult {
  moved: number;
  warnings: string[];
}

interface Tab {
  label: string;
  path: string;
}

interface FolderIndex {
  childDirs: Map<string, Set<string>>;
  pagesByDir: Map<string, Map<string, string>>;
}

interface MetaPlan {
  consumedMetas: string[];
  folderTitleByDir: Map<string, string>;
  metaByDir: Map<string, FolderMeta>;
  pageOverrides: Map<string, NextraPageOverride>;
  tabs: Tab[];
  unparseableMetas: { abs: string; rel: string }[];
  warnings: string[];
}

interface PageMove {
  moved: number;
  removed: string[];
  skipped: string | null;
  unsupported: string[];
}

/** Nextra keeps docs under `content/` (App Router) or `pages/` (Pages Router). */
const SOURCE_DIRS = ["content", "pages"];

const PAGE_GLOB = "**/*.{md,mdx}";
const META_GLOB = "**/_meta.{js,mjs,cjs,ts,jsx,tsx,json}";
const IGNORE = ["**/node_modules/**"];

/** Normalize a `dirname` result so the content root is "" rather than ".". */
const normalizeDir = (dir: string): string => (dir === "." ? "" : dir);

const mergeOverride = (
  map: Map<string, NextraPageOverride>,
  key: string,
  patch: NextraPageOverride
): void => {
  map.set(key, { ...map.get(key), ...patch });
};

/** Index which child slugs in each folder are pages vs subdirectories. */
const indexFolders = (
  base: string,
  pageFiles: string[],
  metaFiles: string[]
): FolderIndex => {
  const pagesByDir = new Map<string, Map<string, string>>();
  const allDirs = new Set<string>([""]);
  const registerDir = (dir: string): void => {
    let current = normalizeDir(dir);
    allDirs.add(current);
    while (current !== "") {
      current = normalizeDir(dirname(current));
      allDirs.add(current);
    }
  };

  for (const abs of pageFiles) {
    const rel = relative(base, abs);
    const dir = normalizeDir(dirname(rel));
    const slug = basename(rel).replace(/\.mdx?$/u, "");
    const folder = pagesByDir.get(dir) ?? new Map<string, string>();
    folder.set(slug, abs);
    pagesByDir.set(dir, folder);
    registerDir(dir);
  }
  for (const abs of metaFiles) {
    registerDir(normalizeDir(dirname(relative(base, abs))));
  }

  const childDirs = new Map<string, Set<string>>();
  for (const dir of allDirs) {
    if (dir === "") {
      continue;
    }
    const parent = normalizeDir(dirname(dir));
    const children = childDirs.get(parent) ?? new Set<string>();
    children.add(basename(dir));
    childDirs.set(parent, children);
  }

  return { childDirs, pagesByDir };
};

interface ParsedMeta {
  abs: string;
  ext: string;
  raw: string;
  rel: string;
}

/** Parse every `_meta`, accumulating ordering, titles, and page overrides. */
const planMetas = (metas: ParsedMeta[], index: FolderIndex): MetaPlan => {
  const plan: MetaPlan = {
    consumedMetas: [],
    folderTitleByDir: new Map(),
    metaByDir: new Map(),
    pageOverrides: new Map(),
    tabs: [],
    unparseableMetas: [],
    warnings: [],
  };

  for (const meta of metas) {
    const dir = normalizeDir(dirname(meta.rel));
    const entries = parseNextraMeta(meta.raw, meta.ext);
    if (!entries) {
      plan.unparseableMetas.push({ abs: meta.abs, rel: meta.rel });
      continue;
    }

    const conversion = toBlumeFolderMeta(entries, {
      hasDir: (slug) => index.childDirs.get(dir)?.has(slug) ?? false,
      hasPage: (slug) => index.pagesByDir.get(dir)?.has(slug) ?? false,
    });

    plan.metaByDir.set(dir, conversion.folderMeta);
    plan.consumedMetas.push(meta.abs);
    for (const [slug, title] of Object.entries(conversion.folderTitles)) {
      plan.folderTitleByDir.set(normalizeDir(join(dir, slug)), title);
    }
    for (const [slug, label] of Object.entries(conversion.pageLabels)) {
      const pageAbs = index.pagesByDir.get(dir)?.get(slug);
      if (pageAbs) {
        mergeOverride(plan.pageOverrides, pageAbs, { label });
      }
    }
    for (const slug of conversion.hiddenPages) {
      const pageAbs = index.pagesByDir.get(dir)?.get(slug);
      if (pageAbs) {
        mergeOverride(plan.pageOverrides, pageAbs, { hidden: true });
      }
    }
    if (dir === "") {
      plan.tabs.push(...conversion.navPages);
    } else if (conversion.navPages.length > 0) {
      plan.warnings.push(
        `Ignored ${conversion.navPages.length} top-nav page entr(y/ies) in ${meta.rel}; type:"page" only maps at the root.`
      );
    }
    plan.warnings.push(...conversion.warnings);
  }

  return plan;
};

/** Move and rewrite a single page into `docs/`. */
const movePage = async (
  abs: string,
  options: {
    base: string;
    overrides: Map<string, NextraPageOverride>;
    root: string;
  }
): Promise<PageMove> => {
  const rel = relative(options.base, abs);
  const dest = join(options.root, "docs", rel);
  if (existsSync(dest)) {
    return { moved: 0, removed: [], skipped: rel, unsupported: [] };
  }
  const raw = await readFile(abs, "utf-8");
  const text = rewriteNextraCallouts(stripNextraImports(raw));
  const unsupported = unsupportedNextraComponents(text);
  const parsed = matter(text);
  const { data, removed } = normalizeNextraPageMeta(
    parsed.data,
    options.overrides.get(abs) ?? {}
  );
  const content =
    Object.keys(data).length > 0
      ? matter.stringify(parsed.content, data)
      : parsed.content;
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, content, "utf-8");
  await rm(abs, { force: true });
  return { moved: 1, removed, skipped: null, unsupported };
};

interface PageSummary {
  moved: number;
  removedKeys: string[];
  skipped: string[];
  unsupported: string[];
}

const summarizePageMoves = (results: PageMove[]): PageSummary => {
  let moved = 0;
  const removedKeys = new Set<string>();
  const unsupported = new Set<string>();
  const skipped: string[] = [];
  for (const result of results) {
    moved += result.moved;
    if (result.skipped) {
      skipped.push(result.skipped);
    }
    for (const key of result.removed) {
      removedKeys.add(key);
    }
    for (const name of result.unsupported) {
      unsupported.add(name);
    }
  }
  return {
    moved,
    removedKeys: [...removedKeys],
    skipped,
    unsupported: [...unsupported],
  };
};

/** Write a `meta.ts` per folder, merging own ordering with a parent title. */
const writeFolderMetas = async (
  root: string,
  plan: MetaPlan
): Promise<void> => {
  const dirs = new Set<string>([
    ...plan.metaByDir.keys(),
    ...plan.folderTitleByDir.keys(),
  ]);
  await Promise.all(
    [...dirs].map(async (dir) => {
      const finalMeta: FolderMeta = { ...plan.metaByDir.get(dir) };
      const title = plan.folderTitleByDir.get(dir);
      if (title !== undefined) {
        finalMeta.title = title;
      }
      if (Object.keys(finalMeta).length === 0) {
        return;
      }
      const dest = join(root, "docs", dir, "meta.ts");
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(
        dest,
        `import { defineMeta } from "blume";\n\nexport default defineMeta(${JSON.stringify(finalMeta, null, 2)});\n`,
        "utf-8"
      );
    })
  );
};

/** Relocate `_meta` files we couldn't parse, untouched, for manual conversion. */
const relocateUnparseableMetas = async (
  root: string,
  metas: { abs: string; rel: string }[]
): Promise<string[]> => {
  const warnings: string[] = [];
  await Promise.all(
    metas.map(async ({ abs, rel }) => {
      const dest = join(root, "docs", rel);
      if (existsSync(dest)) {
        warnings.push(`Skipped ${rel} (target already exists)`);
        return;
      }
      await mkdir(dirname(dest), { recursive: true });
      await rename(abs, dest);
      warnings.push(
        `Could not parse ${rel}; moved as-is — convert it to meta.ts by hand.`
      );
    })
  );
  return warnings;
};

const buildConfig = (tabs: Tab[]): BlumeConfig =>
  tabs.length > 0
    ? { navigation: { tabs }, title: "Documentation" }
    : { title: "Documentation" };

/**
 * Migrate a Nextra project to Blume: move every `.md`/`.mdx` page into `docs/`,
 * rewrite Nextra `<Callout>`s to directives, and convert each `_meta` file into
 * a typed `meta.ts`. Nextra declares a folder's title (and per-page sidebar
 * labels) in the *parent* `_meta`, so those are propagated into child `meta.ts`
 * titles and page frontmatter. Content lands in the default `docs/` root.
 */
export const migrateNextraProject = async (
  root: string
): Promise<NextraMigrationResult> => {
  const sourceDir = SOURCE_DIRS.find((dir) => existsSync(join(root, dir)));
  if (!sourceDir) {
    await writeBlumeConfig(root, { title: "Documentation" });
    return {
      moved: 0,
      warnings: [
        "No Nextra content directory (content/ or pages/) found; wrote a default config.",
      ],
    };
  }
  const base = join(root, sourceDir);

  const pageFiles = await glob([PAGE_GLOB], {
    absolute: true,
    cwd: base,
    ignore: IGNORE,
  });
  const metaFiles = await glob([META_GLOB], {
    absolute: true,
    cwd: base,
    ignore: IGNORE,
  });

  const index = indexFolders(base, pageFiles, metaFiles);
  const metas = await Promise.all(
    metaFiles.map(async (abs) => ({
      abs,
      ext: extname(abs),
      raw: await readFile(abs, "utf-8"),
      rel: relative(base, abs),
    }))
  );
  const plan = planMetas(metas, index);

  const moves = await Promise.all(
    pageFiles.map((abs) =>
      movePage(abs, { base, overrides: plan.pageOverrides, root })
    )
  );
  const pages = summarizePageMoves(moves);

  await writeFolderMetas(root, plan);
  await Promise.all(plan.consumedMetas.map((abs) => rm(abs, { force: true })));
  const relocateWarnings = await relocateUnparseableMetas(
    root,
    plan.unparseableMetas
  );
  await writeBlumeConfig(root, buildConfig(plan.tabs));

  const warnings = [
    ...plan.warnings,
    ...pages.skipped.map((rel) => `Skipped ${rel} (target already exists)`),
    ...relocateWarnings,
  ];
  if (pages.removedKeys.length > 0) {
    warnings.push(
      `Dropped unsupported page frontmatter keys: ${pages.removedKeys.join(", ")}.`
    );
  }
  if (pages.unsupported.length > 0) {
    warnings.push(
      `Components without a drop-in Blume equivalent need manual review: ${pages.unsupported.join(", ")}.`
    );
  }
  warnings.push("Review blume.config.ts and the generated meta.ts files.");

  return { moved: pages.moved, warnings };
};
