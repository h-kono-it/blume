import { extname, relative } from "pathe";
import { glob } from "tinyglobby";

import type { BlumePageRoute } from "./integration.ts";

/**
 * Discover user `.astro` pages and map them to route patterns. Files keep their
 * original location; only the route pattern is derived (index -> parent,
 * dynamic `[param]` segments preserved).
 */
export const discoverPages = async (
  pagesRoot: string
): Promise<BlumePageRoute[]> => {
  const files = await glob(["**/*.astro"], {
    absolute: true,
    cwd: pagesRoot,
    onlyFiles: true,
  });
  files.sort();

  return files.map((file) => {
    const rel = relative(pagesRoot, file);
    const withoutExt = rel.slice(0, rel.length - extname(rel).length);
    const parts = withoutExt.split("/");
    // Only a trailing `index` maps to its parent dir; a folder literally named
    // `index` (e.g. `index/foo.astro`) must keep its segment.
    if (parts.at(-1) === "index") {
      parts.pop();
    }
    const pattern = parts.length === 0 ? "/" : `/${parts.join("/")}`;
    return { entrypoint: file, pattern };
  });
};

/**
 * Whether the project already owns `route` — through a custom `.astro` page
 * (injected, so matched on `pattern`) or a content page (matched on `route`).
 * Used to skip a generated default page (e.g. `/404`, `/changelog`) so a
 * user-authored page overrides it without a route collision.
 */
export const routeIsTaken = (
  pages: { pattern: string }[],
  contentPages: { route: string }[],
  route: string
): boolean =>
  pages.some((page) => page.pattern === route) ||
  contentPages.some((page) => page.route === route);

/** A custom-page route that should get a generated OG card. */
export interface OgCustomRoute {
  /** `og/<slug>.png` path segment; `index` for the site root. */
  slug: string;
  /** Card headline. */
  title: string;
}

/** Skip private (`_partial`, `.well-known`) and Astro dynamic (`[param]`) parts. */
const PRIVATE_SEGMENT = /^[._]/u;

const humanizeSegment = (segment: string): string =>
  segment
    .split(/[-_]/u)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Pick the custom-page routes that should get a generated Open Graph card, with
 * the card's slug and text. OG is otherwise content-route only, so a custom page
 * — most importantly the landing `/`, the most-shared URL — would have no card.
 *
 * Dynamic (`[param]`) routes and private segments (`_partials`, `.well-known`)
 * are skipped: they aren't shareable pages. The home is titled with the site
 * title; a deeper page is titled from its last path segment. The card's brand
 * lockup, description, and footer come from the resolved config at render time.
 */
export const customOgRoutes = (
  pages: BlumePageRoute[],
  siteTitle: string
): OgCustomRoute[] => {
  const seen = new Set<string>();
  const routes: OgCustomRoute[] = [];
  for (const { pattern } of pages) {
    const segments = pattern.split("/").filter(Boolean);
    if (
      segments.some((part) => PRIVATE_SEGMENT.test(part) || part.includes("["))
    ) {
      continue;
    }
    const slug = segments.length === 0 ? "index" : segments.join("/");
    if (seen.has(slug)) {
      continue;
    }
    seen.add(slug);
    const last = segments.at(-1);
    routes.push({ slug, title: last ? humanizeSegment(last) : siteTitle });
  }
  return routes;
};
