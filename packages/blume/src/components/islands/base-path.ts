/**
 * Base-path helpers for client islands. Astro's default `trailingSlash:
 * "ignore"` passes `deployment.base` through as-is, so `BASE_URL` may arrive
 * with or without a trailing slash (`/docs` or `/docs/`); every consumer must
 * treat both forms the same or endpoints/grounding break under a base path.
 */

/** The base with a guaranteed trailing slash (`/docs` -> `/docs/`). */
export const withTrailingSlash = (base: string): string =>
  base.endsWith("/") ? base : `${base}/`;

/** Join a base-relative path (`api/ask`) onto the deployment base. */
export const joinBase = (base: string, path: string): string =>
  `${withTrailingSlash(base)}${path}`;

/**
 * A pathname with the deployment base stripped (`/docs/guide` -> `/guide`),
 * for page-context lookups against base-less document routes.
 */
export const stripBase = (base: string, pathname: string): string => {
  const slashed = withTrailingSlash(base);
  if (slashed === "/") {
    return pathname;
  }
  if (pathname.startsWith(slashed)) {
    return `/${pathname.slice(slashed.length)}`;
  }
  // The bare base itself ("/docs") is the base-less root.
  return `${pathname}/` === slashed ? "/" : pathname;
};
