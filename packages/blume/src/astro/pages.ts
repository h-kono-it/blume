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
    const parts = withoutExt.split("/").filter((part) => part !== "index");
    const pattern = parts.length === 0 ? "/" : `/${parts.join("/")}`;
    return { entrypoint: file, pattern };
  });
};

/** A custom-page route that should get a generated OG card. */
export interface OgCustomRoute {
  /** `og/<slug>.png` path segment; `index` for the site root. */
  slug: string;
  /** Card title. */
  title: string;
  /** Small eyebrow line above the title. */
  eyebrow?: string;
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
 * title (eyebrow: the site description); a deeper page is titled from its last
 * path segment.
 */
export const customOgRoutes = (
  pages: BlumePageRoute[],
  siteTitle: string,
  siteDescription?: string
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
    routes.push(
      last
        ? { eyebrow: siteTitle, slug, title: humanizeSegment(last) }
        : { eyebrow: siteDescription, slug, title: siteTitle }
    );
  }
  return routes;
};
