import {
  customStaticRoutes,
  discoverPagesSync,
  hasGeneratedChangelog,
} from "../astro/pages.ts";
import { normalizeBasePath, withBasePath } from "../core/base-path.ts";
import type { BlumeProject } from "../core/project-graph.ts";
import { escapeXml } from "./xml.ts";

/**
 * Astro's reserved error routes. A user-authored override (`pages/404.astro`,
 * `pages/500.astro`, or a `404.md` content page — see `writeNotFoundPage` in
 * `astro/generate.ts`) is neither dynamic nor private, so it would otherwise
 * be emitted — but error pages aren't crawlable destinations and must stay out
 * of the sitemap.
 */
const ERROR_ROUTES = new Set(["/404", "/500"]);

/** A `<lastmod>` element (W3C date) when the page has a valid modified date. */
const lastmodTag = (value: string | undefined): string => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : `<lastmod>${date.toISOString().slice(0, 10)}</lastmod>`;
};

/**
 * Build a sitemap.xml from the route manifest plus the routes the manifest
 * can't see: custom `.astro` pages (most importantly a custom landing `/`) and
 * the generated `/changelog` index. Returns null when the sitemap is disabled
 * or no `site` is configured (absolute URLs are required for a valid sitemap).
 * Drafts, hidden, and `noindex` pages are excluded.
 */
export const buildSitemap = (project: BlumeProject): string | null => {
  const { site } = project.config.deployment;
  if (!(site && project.config.seo.sitemap)) {
    return null;
  }

  const base = site.replace(/\/$/u, "");
  // Routes carry `basePath`; a `deployment.base` subdirectory is layered on top.
  const deployBase = normalizeBasePath(project.config.deployment.base);
  const seen = new Set<string>();
  const urls: string[] = [];
  const pushUrl = (route: string, lastModified?: string): void => {
    // `<loc>` must be a well-formed, XML-escaped URL: percent-encode the path,
    // then escape XML metacharacters (notably `&`) so a route like
    // `/Tips & Tricks` doesn't produce invalid XML that gets the whole sitemap
    // rejected.
    const loc = escapeXml(encodeURI(`${base}${route}`));
    if (seen.has(loc)) {
      return;
    }
    seen.add(loc);
    urls.push(`  <url><loc>${loc}</loc>${lastmodTag(lastModified)}</url>`);
  };
  for (const page of project.graph.pages) {
    if (
      page.meta.draft ||
      page.meta.sidebar.hidden ||
      page.meta.seo.noindex ||
      ERROR_ROUTES.has(page.route)
    ) {
      continue;
    }
    pushUrl(withBasePath(deployBase, page.route), page.lastModified);
  }
  // Custom `.astro` pages and the generated changelog index mount outside
  // `basePath` (they're injected at their pattern — see `blumeIntegration`), so
  // only the deployment base layers onto their URLs.
  const userPages = project.context.pagesRoot
    ? discoverPagesSync(project.context.pagesRoot)
    : [];
  const extraRoutes = customStaticRoutes(userPages).filter(
    (route) => !ERROR_ROUTES.has(route)
  );
  if (hasGeneratedChangelog(project, userPages)) {
    extraRoutes.push("/changelog");
  }
  for (const route of extraRoutes) {
    pushUrl(withBasePath(deployBase, route));
  }
  urls.sort();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
};
