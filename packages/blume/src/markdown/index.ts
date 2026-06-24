import { satteri } from "@astrojs/markdown-satteri";

import { packageInstallPlugin } from "./package-install.ts";

export {
  PACKAGE_MANAGERS,
  type PackageManager,
  toPackageCommands,
} from "./package-commands.ts";
export { packageInstallPlugin } from "./package-install.ts";

/** Element type of Satteri's `mdastPlugins`, sourced from the (alpha) core. */
type MdastPlugin = NonNullable<
  NonNullable<Parameters<typeof satteri>[0]>["mdastPlugins"]
>[number];

/**
 * The Satteri MDX processor preconfigured with Blume's markdown plugins. Used as
 * the `processor` for `@astrojs/mdx` in the generated runtime so the transforms
 * apply to `.mdx` only (leaving plain `.md` on the default processor).
 *
 * The plugin is modeled with minimal structural types; bridge it to Satteri's
 * full `MdastPlugin` type at this single boundary.
 */
export const blumeMdxProcessor = () =>
  satteri({ mdastPlugins: [packageInstallPlugin() as unknown as MdastPlugin] });
