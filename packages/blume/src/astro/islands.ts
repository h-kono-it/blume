import { readFile } from "node:fs/promises";

import { basename, join } from "pathe";
import { glob } from "tinyglobby";

/** Astro hydration directives Blume applies to a convention island. */
export type IslandClientMode = "idle" | "load" | "only" | "visible";

/** A discovered `islands/` component, ready to wrap and expose to MDX. */
export interface IslandSpec {
  /** Hydration directive, from `export const client` or the default. */
  client: IslandClientMode;
  /** Absolute path to the island source file. */
  file: string;
  /** Astro client framework, needed for `client:only`. */
  framework: "react";
  /** Component name used in MDX — the file's basename without extension. */
  name: string;
}

export interface IslandDiscovery {
  islands: IslandSpec[];
  warnings: string[];
}

/** Hydration mode used when an island doesn't declare one. */
const DEFAULT_CLIENT: IslandClientMode = "visible";

const VALID_MODES = new Set<IslandClientMode>([
  "idle",
  "load",
  "only",
  "visible",
]);

// Matches `export const client = "load"` (with optional type annotation and
// either quote style). Read statically so we never execute island code in Node.
const CLIENT_EXPORT =
  /export\s+const\s+client\s*(?::[^=]+)?=\s*["'](?<mode>\w+)["']/u;

const readClientMode = (
  source: string,
  file: string,
  warnings: string[]
): IslandClientMode => {
  const mode = source.match(CLIENT_EXPORT)?.groups?.mode;
  if (!mode) {
    return DEFAULT_CLIENT;
  }
  if (!VALID_MODES.has(mode as IslandClientMode)) {
    warnings.push(
      `Island "${file}" declares an unknown client mode "${mode}"; defaulting to "${DEFAULT_CLIENT}". Use "load", "idle", "visible", or "only".`
    );
    return DEFAULT_CLIENT;
  }
  return mode as IslandClientMode;
};

/**
 * Discover convention islands under `<root>/islands`. Every `.tsx`/`.jsx` file
 * becomes a globally-available, hydrated MDX component named after the file
 * (which must be PascalCase to be usable as a JSX tag). Hydration defaults to
 * `client:visible`; a file opts out with `export const client = "load" | "idle"
 * | "only"`. Discovery is path-based (a glob), so no user code is executed.
 */
export const discoverIslands = async (
  root: string
): Promise<IslandDiscovery> => {
  const dir = join(root, "islands");
  const matches = await glob(["**/*.{tsx,jsx}"], {
    absolute: true,
    cwd: dir,
    onlyFiles: true,
  });
  const files = matches.toSorted();
  const sources = await Promise.all(
    files.map((file) => readFile(file, "utf-8"))
  );

  const islands: IslandSpec[] = [];
  const warnings: string[] = [];
  const seen = new Map<string, string>();

  for (const [index, file] of files.entries()) {
    const name = basename(file).replace(/\.[jt]sx$/u, "");
    if (!/^[A-Z]/u.test(name)) {
      warnings.push(
        `Island "${file}" must have a PascalCase filename to be used in MDX (e.g. Counter.tsx → <Counter />); skipping it.`
      );
      continue;
    }
    const existing = seen.get(name);
    if (existing) {
      warnings.push(
        `Two islands both resolve to <${name}> ("${existing}" and "${file}"); ignoring the second. Give them distinct filenames.`
      );
      continue;
    }
    seen.set(name, file);
    islands.push({
      client: readClientMode(sources[index] ?? "", file, warnings),
      file,
      framework: "react",
      name,
    });
  }

  return { islands, warnings };
};
