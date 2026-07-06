import { withBasePath } from "../core/base-path.ts";
import type { ResolvedConfig } from "../core/schema.ts";

/**
 * Platform redirect files for a static build. Astro already emits redirect HTML
 * (meta-refresh) pages for `deployment.output: "static"`, but that's a soft
 * client redirect. These give the host a real HTTP 3xx: Netlify/Cloudflare read
 * `_redirects`, Vercel reads `vercel.json`, and `blume-redirects.json` is a
 * structured manifest for anything else (Apache/nginx rules, an edge worker).
 */

type Redirect = ResolvedConfig["redirects"][number];

/**
 * Prepend the site-wide `basePath` to each redirect's internal `from`/`to`
 * (both are authored as if mounted at root); external `to` URLs pass through.
 * Idempotent, so re-basing an already-based redirect is safe.
 */
export const applyBaseToRedirects = (
  redirects: Redirect[],
  basePath: string
): Redirect[] =>
  basePath
    ? redirects.map((redirect) => ({
        ...redirect,
        from: withBasePath(basePath, redirect.from),
        to: withBasePath(basePath, redirect.to),
      }))
    : redirects;

/** `_redirects` text (Netlify + Cloudflare Pages): `from to status` per line. */
export const buildNetlifyRedirects = (redirects: Redirect[]): string =>
  `${redirects
    .map((redirect) => `${redirect.from} ${redirect.to} ${redirect.status}`)
    .join("\n")}\n`;

/** `vercel.json` contents with a `redirects` array (permanent = 301/308). */
export const buildVercelConfig = (redirects: Redirect[]): string =>
  `${JSON.stringify(
    {
      redirects: redirects.map((redirect) => ({
        destination: redirect.to,
        permanent: redirect.status === 301 || redirect.status === 308,
        source: redirect.from,
      })),
    },
    null,
    2
  )}\n`;

/** Structured manifest for hosts that need manual wiring. */
export const buildRedirectManifest = (redirects: Redirect[]): string =>
  `${JSON.stringify(
    redirects.map((redirect) => ({
      from: redirect.from,
      status: redirect.status,
      to: redirect.to,
    })),
    null,
    2
  )}\n`;
