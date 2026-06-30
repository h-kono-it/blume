import { existsSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { dirname, isAbsolute, join, resolve } from "pathe";

/**
 * Read the project's TypeScript path aliases (`compilerOptions.paths`) and turn
 * them into Vite `resolve.alias` entries, so `@/`-style imports in custom pages,
 * islands, and components resolve in the generated Astro build exactly as they
 * do in the user's own tooling.
 *
 * The generated `.blume/` runtime is its own Astro project with its own tsconfig
 * and never inherits the project's, so without this every shadcn-style `@/…`
 * import would have to be rewritten to a relative path. Reading the aliases here
 * lets those components port over unchanged.
 *
 * Best-effort and non-fatal: tsconfig is parsed leniently (it is JSONC —
 * comments and trailing commas), a single `extends` chain is followed to the
 * file that actually declares `paths`, and anything unparseable yields no
 * aliases (the prior behavior).
 */

/** Strip `//` line and `/* *\/` block comments that sit outside strings. */
const stripJsonComments = (text: string): string => {
  let out = "";
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      out += char;
      if (char === "\\") {
        out += text[index + 1] ?? "";
        index += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === "/" && text[index + 1] === "/") {
      const newline = text.indexOf("\n", index + 2);
      index = newline === -1 ? text.length : newline - 1;
      continue;
    }
    if (char === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 1;
      continue;
    }
    out += char;
  }
  return out;
};

const TRAILING_COMMA = /,(?<rest>\s*[}\]])/gu;

/** Parse JSONC (tsconfig) into a plain object, or null if it can't be read. */
const parseJsonc = (text: string): Record<string, unknown> | null => {
  try {
    const cleaned = stripJsonComments(text).replaceAll(
      TRAILING_COMMA,
      "$<rest>"
    );
    const value: unknown = JSON.parse(cleaned);
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const isFile = (path: string): boolean => {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
};

/** Resolve a tsconfig `extends` target (relative path, directory, or package). */
const resolveExtends = (spec: string, fromDir: string): string | null => {
  if (spec.startsWith(".") || isAbsolute(spec)) {
    const candidates = spec.endsWith(".json")
      ? [resolve(fromDir, spec)]
      : [
          resolve(fromDir, `${spec}.json`),
          resolve(fromDir, spec, "tsconfig.json"),
          resolve(fromDir, spec),
        ];
    return candidates.find(isFile) ?? null;
  }
  // A bare specifier points at a package's shared config (e.g. `@tsconfig/*`).
  try {
    const require_ = createRequire(pathToFileURL(join(fromDir, "_.js")).href);
    for (const sub of [`${spec}/tsconfig.json`, spec]) {
      try {
        return require_.resolve(sub);
      } catch {
        // try the next candidate
      }
    }
  } catch {
    // createRequire failed; fall through
  }
  return null;
};

interface LoadedPaths {
  /** Directory `paths` entries resolve against (`dirname(file)` + `baseUrl`). */
  baseDir: string;
  paths: Record<string, unknown>;
}

/** Find the nearest tsconfig in an `extends` chain that declares `paths`. */
const loadPaths = (file: string, seen: Set<string>): LoadedPaths | null => {
  if (seen.has(file) || !existsSync(file)) {
    return null;
  }
  seen.add(file);
  const json = parseJsonc(readFileSync(file, "utf-8"));
  if (!json) {
    return null;
  }
  const options = (json.compilerOptions ?? {}) as Record<string, unknown>;
  if (options.paths && typeof options.paths === "object") {
    const baseUrl = typeof options.baseUrl === "string" ? options.baseUrl : ".";
    return {
      baseDir: resolve(dirname(file), baseUrl),
      paths: options.paths as Record<string, unknown>,
    };
  }
  // `extends` is a string or, since TS 5.0, an array searched first-to-last.
  const bases = Array.isArray(json.extends)
    ? json.extends
    : [json.extends].filter(Boolean);
  for (const base of bases) {
    if (typeof base !== "string") {
      continue;
    }
    const resolved = resolveExtends(base, dirname(file));
    const found = resolved ? loadPaths(resolved, seen) : null;
    if (found) {
      return found;
    }
  }
  return null;
};

/** Convert one tsconfig `paths` mapping to a Vite alias, or null to skip. */
const toAlias = (
  key: string,
  value: unknown,
  baseDir: string
): { find: string; replacement: string } | null => {
  // tsconfig allows a fallback array; Vite aliases are 1:1, so take the first.
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") {
    return null;
  }
  const find = key.endsWith("/*") ? key.slice(0, -2) : key;
  const target = first.endsWith("/*") ? first.slice(0, -2) : first;
  // A bare `*`/`/*` catch-all would alias every import — never wire that.
  if (find === "" || find === "*") {
    return null;
  }
  return { find, replacement: resolve(baseDir, target) };
};

/**
 * Resolve the project's tsconfig/jsconfig path aliases to absolute Vite
 * `resolve.alias` entries (`find` → absolute replacement). Returns `{}` when no
 * config or no usable `paths` is found.
 */
export const resolveTsconfigAliases = (
  root: string
): Record<string, string> => {
  const entry = ["tsconfig.json", "jsconfig.json"]
    .map((name) => join(root, name))
    .find((file) => existsSync(file));
  if (!entry) {
    return {};
  }
  const loaded = loadPaths(entry, new Set());
  if (!loaded) {
    return {};
  }
  const aliases: Record<string, string> = {};
  for (const [key, value] of Object.entries(loaded.paths)) {
    const alias = toAlias(key, value, loaded.baseDir);
    if (alias) {
      aliases[alias.find] = alias.replacement;
    }
  }
  return aliases;
};
