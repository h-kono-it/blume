import { normalizeBasePath, withBasePath } from "../core/base-path.ts";
import matter from "../core/frontmatter.ts";
import type { BlumeProject } from "../core/project-graph.ts";
import { readEntryText } from "../core/sources/read.ts";
import type { PageRecord } from "../core/types.ts";
import { downlevelComponents } from "./component-markdown.ts";
import { applyAgentVisibility } from "./visibility.ts";

// Routes carry `basePath`; a `deployment.base` subdirectory is layered on top —
// with or without a `site` (the mcp.json convention) — so the emitted URL
// matches where the page is served. Encoded like the sitemap: a route with
// spaces or non-ASCII must still yield a valid Markdown link.
const pageUrl = (route: string, site?: string, base = ""): string => {
  const path = withBasePath(base, route);
  return encodeURI(site ? `${site.replace(/\/$/u, "")}${path}` : path);
};

// Drafts, hidden, and `noindex` pages are excluded, matching the sitemap.
const orderedPages = (project: BlumeProject): PageRecord[] =>
  [...project.graph.pages]
    .filter(
      (page) =>
        !(page.meta.draft || page.meta.sidebar.hidden || page.meta.seo.noindex)
    )
    .sort((a, b) => a.route.localeCompare(b.route));

/** Build the compact `llms.txt` index: title, summary, and links per page. */
const buildIndex = (project: BlumeProject): string => {
  const { config } = project;
  const { site } = config.deployment;
  const lines = [`# ${config.title}`];
  if (config.description) {
    lines.push("", `> ${config.description}`);
  }
  lines.push("", "## Docs", "");

  for (const page of orderedPages(project)) {
    const url = pageUrl(
      page.route,
      site,
      normalizeBasePath(config.deployment.base)
    );
    const summary = page.description ? `: ${page.description}` : "";
    lines.push(`- [${page.title}](${url})${summary}`);
  }

  return `${lines.join("\n")}\n`;
};

/** Build `llms-full.txt`: the full Markdown body of every page. */
const buildFull = async (project: BlumeProject): Promise<string> => {
  const { config } = project;
  const pages = orderedPages(project);

  const sections = await Promise.all(
    pages.map(async (page) => {
      const raw = await readEntryText(project, page);
      // Resolve `<Visibility>` audiences (web-only content omitted from the
      // agent-facing output, agents-only unwrapped), then downlevel supported
      // components to plain Markdown.
      const body = downlevelComponents(
        applyAgentVisibility(matter(raw).content),
        config.ai.markdownComponents
      ).trim();
      const url = pageUrl(
        page.route,
        config.deployment.site,
        normalizeBasePath(config.deployment.base)
      );
      return [`# ${page.title}`, `Source: ${url}`, "", body].join("\n");
    })
  );

  const header = config.description
    ? `# ${config.title}\n\n> ${config.description}\n`
    : `# ${config.title}\n`;

  return `${header}\n${sections.join("\n\n---\n\n")}\n`;
};

/** Build both LLM text artifacts for a project. */
export const buildLlmsFiles = async (
  project: BlumeProject
): Promise<{ index: string; full: string }> => ({
  full: await buildFull(project),
  index: buildIndex(project),
});
