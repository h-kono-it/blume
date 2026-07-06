/**
 * The site-wide `basePath` — a mount point that prepends a segment to every
 * generated route (`/docs/getting-started`) while staying invisible to the
 * navigation tree (see `core/navigation.ts`, which builds groups from a page's
 * base-less `navPath` and takes URLs from its based `route`). This is distinct
 * from a per-source `prefix` (a namespace that *does* create a sidebar group)
 * and from `deployment.base` (Astro's host-subdirectory base); the two compose,
 * stacking as `{deployment.base}/{basePath}/page`.
 *
 * These helpers run server-side (config, route construction, the link checker,
 * redirects, the markdown link plugin). The client-side counterpart lives in
 * `components/islands/base-path.ts` and serves `deployment.base` via `BASE_URL`.
 */

/**
 * Canonicalize a configured base path to either `""` (none) or `/seg[/seg…]`
 * (leading slash, no trailing slash, collapsed inner slashes). A blank value or
 * bare `/` normalizes to `""`, so an unset/`"/"` base is a clean no-op.
 */
export const normalizeBasePath = (input?: string): string => {
  if (!input) {
    return "";
  }
  const trimmed = input
    .trim()
    .replaceAll(/^\/+|\/+$/gu, "")
    .replaceAll(/\/{2,}/gu, "/");
  return trimmed === "" ? "" : `/${trimmed}`;
};

/**
 * Whether a link target is a root-relative internal path (`/x`) — the only
 * shape a base path applies to. Protocol-relative (`//host`), absolute URLs,
 * other schemes (`mailto:`), fragments (`#x`), and relative paths are excluded.
 */
export const isInternalPath = (target: string): boolean =>
  target.startsWith("/") && !target.startsWith("//");

/**
 * Idempotently prepend `basePath` to a root-relative route. A route already
 * equal to or nested under the base is returned unchanged, so authors who write
 * the base by hand (`/docs/x`) aren't double-prefixed to `/docs/docs/x`.
 */
export const withBasePath = (basePath: string, route: string): string => {
  if (!basePath || !isInternalPath(route)) {
    return route;
  }
  if (route === basePath || route.startsWith(`${basePath}/`)) {
    return route;
  }
  return route === "/" ? basePath : `${basePath}${route}`;
};

/**
 * Remove `basePath` from the front of a route (`/docs/guide` -> `/guide`,
 * `/docs` -> `/`). A route not under the base is returned unchanged. Inverse of
 * {@link withBasePath}; used to resolve public assets, which live at the site
 * root regardless of the base.
 */
export const stripBasePath = (basePath: string, route: string): string => {
  if (!basePath) {
    return route;
  }
  if (route === basePath) {
    return "/";
  }
  return route.startsWith(`${basePath}/`)
    ? route.slice(basePath.length)
    : route;
};
