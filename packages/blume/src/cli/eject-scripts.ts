import { readFile, writeFile } from "node:fs/promises";

import { join } from "pathe";

/**
 * Rewrite the project's package.json scripts to run Astro directly. After an
 * eject the Blume CLI no longer manages the runtime, so scaffolded scripts like
 * `"dev": "blume dev"` would rebuild the removed `.blume` tree instead of
 * serving the ejected app. A missing or unreadable package.json is left alone.
 */
export const updatePackageScripts = async (root: string): Promise<void> => {
  const pkgPath = join(root, "package.json");
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  } catch {
    return;
  }
  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  pkg.scripts = {
    ...scripts,
    build: "astro build",
    dev: "astro dev",
    preview: "astro preview",
  };
  await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
};
