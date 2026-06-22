import { writeFile } from "node:fs/promises";

import { build } from "astro";
import { defineCommand } from "citty";
import { join } from "pathe";

import { buildLlmsFiles } from "../../ai/llms.ts";
import { buildSearchIndex } from "../../search/build.ts";
import { logger } from "../log.ts";
import { prepareProject } from "../prepare.ts";

export const buildCommand = defineCommand({
  args: {
    strict: { description: "Fail on diagnostics.", type: "boolean" },
  },
  meta: {
    description: "Build the docs site for production.",
    name: "build",
  },
  async run({ args }) {
    const root = process.cwd();
    const project = await prepareProject({
      mode: "build",
      root,
      strict: args.strict,
    });

    logger.start(
      `Building ${project.graph.pages.length} page(s) (${project.config.deployment.output} output)`
    );

    await build({
      logLevel: "info",
      root: project.context.outDir,
    });

    const distDir = join(root, "dist");

    if (project.config.search.provider === "pagefind") {
      logger.start("Building search index");
      const indexed = await buildSearchIndex(distDir);
      logger.success(`Indexed ${indexed} page(s) for search`);
    }

    if (project.config.ai.llmsTxt) {
      const { index, full } = await buildLlmsFiles(project);
      await Promise.all([
        writeFile(join(distDir, "llms.txt"), index, "utf-8"),
        writeFile(join(distDir, "llms-full.txt"), full, "utf-8"),
      ]);
      logger.success("Generated llms.txt and llms-full.txt");
    }

    logger.success(`Built to ${distDir}`);
  },
});
