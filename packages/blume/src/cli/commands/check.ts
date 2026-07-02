import { existsSync } from "node:fs";

import { check } from "@astrojs/check";
import { sync } from "astro";
import { defineCommand } from "citty";
import { join } from "pathe";

import { logger } from "../log.ts";
import { prepareProject } from "../prepare.ts";

export const checkCommand = defineCommand({
  args: {
    preview: {
      description: "Include drafts and unpublished CMS content.",
      type: "boolean",
    },
    strict: {
      description: "Fail on content diagnostics as well as type errors.",
      type: "boolean",
    },
  },
  meta: {
    description: "Type-check the docs site with astro check.",
    name: "check",
  },
  async run({ args }) {
    const root = process.cwd();
    const project = await prepareProject({
      mode: "build",
      preview: args.preview,
      root,
      strict: args.strict,
    });

    const { outDir } = project.context;

    // Generate Astro's content/collection and font types into `.blume/.astro`
    // so `astro:*` virtual modules resolve during the check.
    await sync({ logLevel: "warn", root: outDir });

    // The project-root tsconfig is what covers the authored `pages/` and config;
    // without it astro check only sees the generated `.blume` project. Falls back
    // to the generated project's own tsconfig when the project has none.
    const tsconfig = join(root, "tsconfig.json");

    logger.start(`Type-checking ${project.graph.pages.length} page(s)`);
    const failed = await check({
      minimumFailingSeverity: "error",
      minimumSeverity: "hint",
      root: outDir,
      tsconfig: existsSync(tsconfig) ? tsconfig : undefined,
      watch: false,
    });

    if (failed) {
      logger.error("Type check failed.");
      process.exit(1);
    }

    logger.success("No type errors.");
  },
});
