import { defineCommand } from "citty";
import { relative } from "pathe";

import { eject } from "../../registry/eject.ts";
import { refuseIfDevRunning } from "../dev-lock.ts";
import { updatePackageScripts } from "../eject-scripts.ts";
import { commandsFor, detectPackageManager } from "../init/scaffold.ts";
import { logger } from "../log.ts";

export const ejectCommand = defineCommand({
  args: {
    yes: { description: "Skip the confirmation prompt.", type: "boolean" },
  },
  meta: {
    description: "Promote the generated runtime into an owned Astro project.",
    name: "eject",
  },
  async run({ args }) {
    const root = process.cwd();
    refuseIfDevRunning(root, "ejecting");

    if (!args.yes) {
      logger.warn(
        "Eject is one-way: it writes astro.config.mjs, src/, and (if absent) tsconfig.json, rewrites your package.json scripts, and removes .blume. An existing tsconfig.json is left untouched."
      );
      logger.info("Re-run with --yes to proceed.");
      return;
    }

    const files = await eject(root);
    await updatePackageScripts(root);

    logger.success(`Ejected ${files.length} file(s):`);
    for (const file of files) {
      process.stdout.write(`  ${relative(root, file)}\n`);
    }
    // Print run commands matching the user's package manager, detected the
    // same way as `blume init`'s next-steps hint.
    const pm = detectPackageManager(process.env.npm_config_user_agent);
    const { dev } = commandsFor(pm);
    // `commandsFor` has no build entry; mirror its npm-needs-`run` rule.
    const build = pm === "npm" ? "npm run build" : `${pm} build`;
    logger.box(
      `Your project is now a standalone Astro app.\n\n  ${dev}\n  ${build}\n\nThe blume package remains importable.`
    );
  },
});
