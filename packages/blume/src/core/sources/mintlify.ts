import { existsSync, watch as fsWatch } from "node:fs";
import { readFile } from "node:fs/promises";

import { isAbsolute, join, relative, resolve } from "pathe";
import { glob } from "tinyglobby";

import { transformMintlifyContent } from "../../migrate/mintlify/transform.ts";
import { BlumeError } from "../diagnostics.ts";
import matter from "../frontmatter.ts";
import type { Diagnostic } from "../types.ts";
import type { ContentSource, SourceEntry, SourceLoadResult } from "./types.ts";

/** Options for the Mintlify bridge content source. */
export interface MintlifySourceOptions {
  /** Stable source name; namespaces ids and diagnostics. */
  name: string;
  /** Optional route prefix. */
  prefix?: string;
  /** Content root, absolute or relative to `projectRoot` (Mintlify: `.`). */
  root: string;
  include: string[];
  exclude: string[];
  /** `docs.json` variables, inlined into content (`{{name}}`) at scan time. */
  variables: Record<string, string>;
  /** Absolute path of the `docs.json`/`mint.json`, watched for changes in dev. */
  configFile?: string;
  /** Absolute project root, used to resolve a relative `root`. */
  projectRoot: string;
}

/**
 * Folders Mintlify projects keep alongside content that are never pages:
 * snippets are inlined as includes, and build/tooling dirs are noise. Merged
 * with the user's `exclude` so bridge mode behaves like the one-shot migrator.
 */
const MINTLIFY_SOURCE_IGNORES = [
  "node_modules/**",
  ".blume/**",
  "dist/**",
  "build/**",
  "public/**",
  "snippets/**",
];

/**
 * The Mintlify bridge content source. Reads an unconverted Mintlify project in
 * place and transforms each page to Blume MDX at scan time (callouts → `:::`
 * directives, snippet/variable inlining, etc.) via `transformMintlifyContent`.
 * Staged: the transformed bodies are materialized under `.blume/content` and
 * rendered through Astro's `staged` collection, so the rewrites actually reach
 * the output. Components Blume already ships (Card, Tabs, Steps, …) render as-is.
 */
export const mintlifySource = (
  options: MintlifySourceOptions
): ContentSource & { readonly contentRoot: string } => {
  const contentRoot = isAbsolute(options.root)
    ? options.root
    : join(resolve(options.projectRoot), options.root);
  const ignore = [...new Set([...options.exclude, ...MINTLIFY_SOURCE_IGNORES])];

  const transform = (
    raw: string,
    file: string
  ): ReturnType<typeof transformMintlifyContent> =>
    transformMintlifyContent(raw, {
      filePath: file,
      root: resolve(options.projectRoot),
      variables: options.variables,
    });

  const load = async (): Promise<SourceLoadResult> => {
    const files = await glob(options.include, {
      absolute: true,
      cwd: contentRoot,
      ignore,
      onlyFiles: true,
    });
    files.sort();

    const unsupported = new Set<string>();
    const entries = await Promise.all(
      files.map(async (file): Promise<SourceEntry> => {
        const result = await transform(await readFile(file, "utf-8"), file);
        for (const name of result.unsupported) {
          unsupported.add(name);
        }
        const parsed = matter(result.content);
        // Force MDX: Mintlify pages are MDX-authored and the rewrites emit `:::`
        // directives + JSX, neither of which the plain `.md` processor expands.
        return {
          body: { format: "mdx", text: parsed.content },
          data: parsed.data,
          raw: result.content,
          ref: relative(contentRoot, file),
          sourcePath: file,
        };
      })
    );

    const diagnostics: Diagnostic[] =
      unsupported.size > 0
        ? [
            {
              code: "BLUME_MINTLIFY_UNSUPPORTED",
              message: `Mintlify components without a Blume equivalent were left as-is: ${[...unsupported].toSorted().join(", ")}. Use the OpenAPI reference for API parameters.`,
              severity: "warning",
            },
          ]
        : [];

    return { diagnostics, entries };
  };

  const validate = (): void => {
    if (!existsSync(contentRoot)) {
      throw new BlumeError({
        code: "BLUME_CONTENT_ROOT_MISSING",
        file: contentRoot,
        message: `Content root not found: ${options.root}`,
        severity: "error",
        suggestion: `Run "blume dev" from the directory that contains docs.json.`,
      });
    }
  };

  const watch = (onChange: () => void): (() => void) => {
    const disposers: (() => void)[] = [];
    if (existsSync(contentRoot)) {
      const watcher = fsWatch(contentRoot, { recursive: true }, onChange);
      disposers.push(() => watcher.close());
    }
    // Watch docs.json directly: it lives at the content root but a non-recursive
    // single-file watch fires reliably on edits that recursive dir-watch can miss.
    if (options.configFile && existsSync(options.configFile)) {
      const watcher = fsWatch(options.configFile, onChange);
      disposers.push(() => watcher.close());
    }
    return () => {
      for (const dispose of disposers) {
        dispose();
      }
    };
  };

  const read = async (ref: string): Promise<string> => {
    const file = join(contentRoot, ref);
    const result = await transform(await readFile(file, "utf-8"), file);
    return result.content;
  };

  return {
    contentRoot,
    load,
    name: options.name,
    prefix: options.prefix,
    read,
    staged: true,
    validate,
    watch,
  };
};
