import { relative } from "pathe";
import type { ZodError } from "zod";

import type { Diagnostic } from "./types.ts";

/** A recoverable error carrying a structured diagnostic. */
export class BlumeError extends Error {
  readonly diagnostic: Diagnostic;

  constructor(diagnostic: Diagnostic) {
    super(diagnostic.message);
    this.name = "BlumeError";
    this.diagnostic = diagnostic;
  }
}

export const createDiagnostic = (diagnostic: Diagnostic): Diagnostic =>
  diagnostic;

/** Docs site base; diagnostic help links resolve against it. */
const DOCS_BASE = "https://useblume.dev";

/** Diagnostic code → the docs page that explains it. */
const DOCS_PATHS: Record<string, string> = {
  BLUME_ADAPTER_REQUIRED: "/docs/deployment",
  BLUME_ASSETS_UNCHECKED: "/docs/reference/cli",
  BLUME_ASSET_FETCH_FAILED: "/docs/content/sources",
  BLUME_BROKEN_ANCHOR: "/docs/reference/cli",
  BLUME_BROKEN_ASSET: "/docs/reference/cli",
  BLUME_BROKEN_LINK: "/docs/reference/cli",
  BLUME_CONFIG_INVALID: "/docs/configuration",
  BLUME_CONFIG_LOAD_FAILED: "/docs/configuration",
  BLUME_CONTENT_ROOT_MISSING: "/docs/content/sources",
  BLUME_DEAD_LINK: "/docs/reference/cli",
  BLUME_DUPLICATE_ROUTE: "/docs/content/navigation",
  BLUME_FRONTMATTER_INVALID: "/docs/reference/frontmatter",
  BLUME_META_INVALID: "/docs/content/meta",
  BLUME_META_LOAD_FAILED: "/docs/content/meta",
  BLUME_MISSING_SECRET: "/docs/deployment",
  BLUME_NAV_DUPLICATE_LABEL: "/docs/content/navigation",
  BLUME_NAV_HIDDEN_IN_SIDEBAR: "/docs/content/navigation",
  BLUME_NAV_MISSING_PAGE: "/docs/content/navigation",
  BLUME_NODE_VERSION: "/docs/quickstart",
  BLUME_SERVER_FEATURE_REQUIRED: "/docs/deployment",
  BLUME_SOURCE_FETCH_FAILED: "/docs/content/sources",
  BLUME_SOURCE_MISCONFIGURED: "/docs/content/sources",
  BLUME_SOURCE_OFFLINE: "/docs/content/sources",
  BLUME_SOURCE_SDK_MISSING: "/docs/content/sources",
  BLUME_SOURCE_UNAVAILABLE: "/docs/content/sources",
  BLUME_UNKNOWN_ICON: "/docs/content/navigation",
};

/** The docs URL that explains a diagnostic code, if one is mapped. */
export const resolveDocsUrl = (code: string): string | undefined => {
  const path = DOCS_PATHS[code];
  return path ? `${DOCS_BASE}${path}` : undefined;
};

/** Fill in `docsUrl` from the code map where a diagnostic doesn't set its own. */
export const enrichDiagnostic = (diagnostic: Diagnostic): Diagnostic =>
  diagnostic.docsUrl
    ? diagnostic
    : { ...diagnostic, docsUrl: resolveDocsUrl(diagnostic.code) };

const REGEXP_SPECIAL = /[$()*+.?[\\\]^{|}]/gu;
const escapeRegExp = (value: string): string =>
  value.replaceAll(REGEXP_SPECIAL, String.raw`\$&`);

/**
 * Best-effort source position for a Zod issue path (e.g. `["seo", "title"]`) in
 * the raw config / frontmatter text. Narrows key-by-key — finding each string
 * segment as a `key:`/`key =` at or after the previous match — so a nested key
 * lands under its parent. Array indices are skipped. Returns 1-based line/column,
 * or undefined when nothing matches.
 */
const locatePath = (
  source: string,
  path: readonly (string | number)[]
): { column: number; line: number } | undefined => {
  let cursor = 0;
  let found = -1;
  for (const segment of path) {
    if (typeof segment !== "string") {
      continue;
    }
    const matcher = new RegExp(`${escapeRegExp(segment)}\\s*[:=]`, "gu");
    matcher.lastIndex = cursor;
    const match = matcher.exec(source);
    if (!match) {
      break;
    }
    found = match.index;
    cursor = matcher.lastIndex;
  }
  if (found < 0) {
    return;
  }
  const before = source.slice(0, found);
  const lastNewline = before.lastIndexOf("\n");
  return { column: found - lastNewline, line: before.split("\n").length };
};

/** Convert a ZodError into Blume diagnostics, anchored to a file. */
export const diagnosticsFromZod = (
  error: ZodError,
  options: { code: string; file?: string; source?: string }
): Diagnostic[] =>
  error.issues.map((issue) => {
    const schemaPath = issue.path.join(".");
    const received =
      "received" in issue
        ? ` (received: ${JSON.stringify(issue.received)})`
        : "";
    const position = options.source
      ? locatePath(options.source, issue.path)
      : undefined;
    return {
      code: options.code,
      column: position?.column,
      file: options.file,
      line: position?.line,
      message: schemaPath
        ? `${schemaPath}: ${issue.message}${received}`
        : `${issue.message}${received}`,
      schemaPath: schemaPath || undefined,
      severity: "error",
    } satisfies Diagnostic;
  });

const ESC = String.fromCodePoint(27);
const COLORS = {
  blue: `${ESC}[34m`,
  bold: `${ESC}[1m`,
  cyan: `${ESC}[36m`,
  dim: `${ESC}[2m`,
  red: `${ESC}[31m`,
  reset: `${ESC}[0m`,
  yellow: `${ESC}[33m`,
};

const severityColor = (severity: Diagnostic["severity"]): string => {
  if (severity === "error") {
    return COLORS.red;
  }
  if (severity === "warning") {
    return COLORS.yellow;
  }
  return COLORS.blue;
};

/** Format a single diagnostic for terminal output. */
export const formatDiagnostic = (
  diagnostic: Diagnostic,
  root?: string
): string => {
  const color = severityColor(diagnostic.severity);
  const lines: string[] = [
    `${color}${COLORS.bold}${diagnostic.code}${COLORS.reset} ${diagnostic.message}`,
  ];

  if (diagnostic.file) {
    const location = root ? relative(root, diagnostic.file) : diagnostic.file;
    const column =
      diagnostic.column === undefined ? "" : `:${diagnostic.column}`;
    const position =
      diagnostic.line === undefined ? "" : `:${diagnostic.line}${column}`;
    lines.push(`  ${COLORS.dim}at ${location}${position}${COLORS.reset}`);
  }

  if (diagnostic.suggestion) {
    lines.push(`  ${COLORS.cyan}fix: ${diagnostic.suggestion}${COLORS.reset}`);
  }

  if (diagnostic.docsUrl) {
    lines.push(`  ${COLORS.dim}docs: ${diagnostic.docsUrl}${COLORS.reset}`);
  }

  return lines.join("\n");
};

export const hasErrors = (diagnostics: Diagnostic[]): boolean =>
  diagnostics.some((d) => d.severity === "error");

export const countBySeverity = (
  diagnostics: Diagnostic[]
): Record<Diagnostic["severity"], number> => {
  const counts = { error: 0, info: 0, warning: 0 };
  for (const diagnostic of diagnostics) {
    counts[diagnostic.severity] += 1;
  }
  return counts;
};
