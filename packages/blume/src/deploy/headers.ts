import { normalizeBasePath } from "../core/base-path.ts";
import type { ResolvedConfig } from "../core/schema.ts";

/**
 * The `_headers` file for a static build (Netlify + Cloudflare Pages/Workers
 * static assets). Blume's raw AI-ready endpoints — `/<route>.md`, `/<route>.mdx`,
 * and the `.txt` files (`llms.txt`, `llms-full.txt`) — are valid UTF-8, but a
 * static host serves them from the file extension alone, and common hosts send
 * `text/markdown` / `text/plain` with **no** `charset`. Browsers then fall back
 * to Windows-1252 for non-HTML text, so any non-ASCII docs (Japanese, accented
 * Latin, …) render as mojibake when the raw URL is opened directly. HTML pages
 * escape this because they carry `<meta charset>`; the raw endpoints have only
 * the HTTP header. Pinning `charset=utf-8` here matches the Content-Type these
 * same routes already send from the dev/server runtime (see
 * `astro/templates.ts`). Hosts that don't read `_headers` (Vercel, S3) ignore
 * the file harmlessly.
 */

/**
 * One rule per served extension. `.mdx` uses `text/markdown` to match the
 * runtime endpoint, which serves both variants as `text/markdown`. The raw
 * Markdown mirrors live under the page routes (which carry `basePath`), while
 * the `.txt` files (`llms.txt`, `llms-full.txt`) are written to the dist root
 * and served at the deployment base — so only the `.md`/`.mdx` rules take the
 * `basePath` layer.
 */
const HEADER_RULES: readonly {
  contentType: string;
  ext: string;
  underBasePath: boolean;
}[] = [
  {
    contentType: "text/markdown; charset=utf-8",
    ext: "md",
    underBasePath: true,
  },
  {
    contentType: "text/markdown; charset=utf-8",
    ext: "mdx",
    underBasePath: true,
  },
  {
    contentType: "text/plain; charset=utf-8",
    ext: "txt",
    underBasePath: false,
  },
];

/**
 * `_headers` contents: a `/*.<ext>` glob per rule with an indented
 * `Content-Type` line, in the two-space format Netlify and Cloudflare read. The
 * glob carries the served prefix (`{deployment.base}{basePath}` for the
 * Markdown mirrors, `{deployment.base}` for the root `.txt` files) so the rules
 * still match once the site is mounted under a subpath (`/docs/*.md`); the
 * wildcard spans path segments, so a nested route like `/docs/ja/intro.md`
 * matches too.
 */
export const buildNetlifyHeaders = (config: ResolvedConfig): string => {
  const deployBase = normalizeBasePath(config.deployment.base);
  return `${HEADER_RULES.map((rule) => {
    const prefix = rule.underBasePath
      ? `${deployBase}${config.basePath}`
      : deployBase;
    return `${prefix}/*.${rule.ext}\n  Content-Type: ${rule.contentType}`;
  }).join("\n")}\n`;
};
