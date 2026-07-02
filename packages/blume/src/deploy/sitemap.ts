import type { BlumeProject } from "../core/project-graph.ts";
import { escapeXml } from "./xml.ts";

/**
 * Build a sitemap.xml from the route manifest. Returns null when the sitemap is
 * disabled or no `site` is configured (absolute URLs are required for a valid
 * sitemap). Drafts, hidden, and `noindex` pages are excluded.
 */
export const buildSitemap = (project: BlumeProject): string | null => {
  const { site } = project.config.deployment;
  if (!(site && project.config.seo.sitemap)) {
    return null;
  }

  const base = site.replace(/\/$/u, "");
  const urls = project.graph.pages
    .filter(
      (page) =>
        !(page.meta.draft || page.meta.sidebar.hidden || page.meta.seo.noindex)
    )
    // `<loc>` must be a well-formed, XML-escaped URL: percent-encode the path,
    // then escape XML metacharacters (notably `&`) so a route like
    // `/Tips & Tricks` doesn't produce invalid XML that gets the whole sitemap
    // rejected.
    .map(
      (page) =>
        `  <url><loc>${escapeXml(encodeURI(`${base}${page.route}`))}</loc></url>`
    )
    .toSorted();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
};
