import { existsSync, readFileSync } from "node:fs";

import { dirname, join, resolve } from "pathe";

// Blume's remote sources (GitHub Releases, mdx-remote, Sanity, Notion…) read
// their tokens from `process.env` during the content scan — which runs before
// Astro/Vite boots, so Vite's own `.env` loading is too late. This loader fills
// that gap: it cascades `.env`/`.env.local` from the working dir up to the repo
// root, so a monorepo can keep one `.env` at the root and every app picks it up.

const ENV_LINE =
  /^\s*(?:export\s+)?(?<key>[A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?<value>.*?)\s*$/u;
const DOUBLE_QUOTED = /^"(?<body>[\s\S]*)"$/u;
const SINGLE_QUOTED = /^'(?<body>[\s\S]*)'$/u;

/** Unquote a value, expanding `\n`/`\t`/escapes inside double quotes only. */
const unquote = (raw: string): string => {
  const double = raw.match(DOUBLE_QUOTED)?.groups?.body;
  if (double !== undefined) {
    return double
      .replaceAll("\\n", "\n")
      .replaceAll("\\t", "\t")
      .replaceAll('\\"', '"')
      .replaceAll("\\\\", "\\");
  }
  const single = raw.match(SINGLE_QUOTED)?.groups?.body;
  if (single !== undefined) {
    return single;
  }
  // dotenv/Vite treat an unquoted `#` as the start of an inline comment (a
  // value containing `#` must be quoted) — keeping the comment would hand
  // consumers a silently corrupted value.
  const hash = raw.indexOf("#");
  return (hash === -1 ? raw : raw.slice(0, hash)).trim();
};

/** Parse `.env` text into key/value pairs, skipping blanks and `#` comments. */
export const parseEnv = (content: string): Record<string, string> => {
  const env: Record<string, string> = {};
  for (const line of content.split(/\r?\n/u)) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) {
      continue;
    }
    const groups = line.match(ENV_LINE)?.groups;
    if (groups?.key !== undefined && groups.value !== undefined) {
      env[groups.key] = unquote(groups.value);
    }
  }
  return env;
};

/** Apply parsed vars without clobbering anything already in `process.env`. */
const applyEnv = (parsed: Record<string, string>): void => {
  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

const loadFile = (path: string): void => {
  try {
    if (existsSync(path)) {
      applyEnv(parseEnv(readFileSync(path, "utf-8")));
    }
  } catch {
    // Env files are best-effort; a read/parse failure must not abort a build.
  }
};

/**
 * Load `.env`/`.env.local`, cascading from `startDir` up to the repository root
 * (the first ancestor containing a `.git`) or the filesystem root. Nearer files
 * and existing `process.env` values win, so shell/CI overrides are never lost
 * and `.env.local` layers over `.env`.
 */
export const loadEnvFiles = (startDir: string): void => {
  let dir = resolve(startDir);
  let done = false;
  while (!done) {
    loadFile(join(dir, ".env.local"));
    loadFile(join(dir, ".env"));
    const parent = dirname(dir);
    // Stop at the repo root (nearest `.git`) or the filesystem root.
    done = existsSync(join(dir, ".git")) || parent === dir;
    dir = parent;
  }
};
