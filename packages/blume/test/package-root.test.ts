import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";

import { join } from "pathe";

import { findPackageRoot, packageRoot } from "../src/core/package-root.ts";

describe("packageRoot", () => {
  it("resolves to a directory that contains package.json", () => {
    const root = packageRoot();
    expect(existsSync(join(root, "package.json"))).toBe(true);
  });

  it("is cached across calls", () => {
    expect(packageRoot()).toBe(packageRoot());
  });
});

describe("findPackageRoot", () => {
  it("walks up from a nested directory to the nearest package.json", () => {
    const root = packageRoot();
    expect(findPackageRoot(join(root, "src", "core"))).toBe(root);
  });

  it("throws when no ancestor holds a package.json", () => {
    expect(() => findPackageRoot("/")).toThrow("locate the package root");
  });
});
