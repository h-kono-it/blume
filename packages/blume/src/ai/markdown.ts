import { readFile } from "node:fs/promises";

import type { BlumeProject } from "../core/project-graph.ts";

/**
 * Map every route to its raw source Markdown. Powers the `<route>.md` and
 * `<route>.mdx` endpoints, which serve the original source so AI tools — and
 * readers — can fetch any page as plain Markdown.
 */
export const buildRawMarkdown = async (
  project: BlumeProject
): Promise<Record<string, string>> => {
  const entries = await Promise.all(
    project.manifest.routes.map(
      async (route) =>
        [route.path, await readFile(route.sourcePath, "utf-8")] as const
    )
  );
  return Object.fromEntries(entries);
};
