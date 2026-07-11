import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { blumeConfigSchema } from "../src/core/schema.ts";
import type { ResolvedConfig } from "../src/core/schema.ts";
import type { ProjectContext } from "../src/core/types.ts";
import {
  ADAPTER_OUTPUT_PATHS,
  deployStaticDir,
  surfaceAdapterOutput,
} from "../src/deploy/adapter-output.ts";

const config = (deployment: Record<string, unknown> = {}): ResolvedConfig =>
  blumeConfigSchema.parse({ deployment });

const context = (root: string): ProjectContext => ({
  componentsFile: null,
  configFile: null,
  contentRoot: join(root, "content"),
  distDir: join(root, "dist"),
  outDir: join(root, ".blume"),
  pagesRoot: null,
  root,
  themeFile: null,
});

/** Write a fake Vercel Build Output bundle under `<root>/.blume/.vercel/output`. */
const seed = async (root: string): Promise<void> => {
  const src = join(root, ".blume", ".vercel", "output");
  await mkdir(join(src, "static"), { recursive: true });
  await writeFile(join(src, "config.json"), '{"version":3}', "utf-8");
  await writeFile(join(src, "static", "index.html"), "<h1>hi</h1>", "utf-8");
};

describe("deployStaticDir", () => {
  it("serves .vercel/output/static for a Vercel server build", () => {
    const ctx = context("/proj");
    expect(
      deployStaticDir(config({ adapter: "vercel", output: "server" }), ctx)
    ).toBe("/proj/.vercel/output/static");
  });

  it("serves dist/ for a static build", () => {
    const ctx = context("/proj");
    expect(deployStaticDir(config(), ctx)).toBe("/proj/dist");
  });

  it("serves dist/ for server adapters whose platform serves dist/", () => {
    const ctx = context("/proj");
    expect(
      deployStaticDir(config({ adapter: "netlify", output: "server" }), ctx)
    ).toBe("/proj/dist");
  });

  it("serves dist/client/ for a Node server build", () => {
    // The @astrojs/node standalone server's static handler reads only
    // Astro's `build.client` dir (`dist/client/`), never `dist/` itself.
    const ctx = context("/proj");
    expect(
      deployStaticDir(config({ adapter: "node", output: "server" }), ctx)
    ).toBe("/proj/dist/client");
  });

  it("falls back to <root>/dist when the context has no distDir", () => {
    // Exercises the "no distDir" fallback; distDir is optional (string), so
    // it must be undefined rather than null.
    // oxlint-disable-next-line sonarjs/no-undefined-assignment
    const ctx: ProjectContext = { ...context("/proj"), distDir: undefined };
    expect(deployStaticDir(config(), ctx)).toBe("/proj/dist");
  });
});

describe("surfaceAdapterOutput", () => {
  it("moves the Vercel bundle from .blume up to the project root", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    await seed(root);
    // A `vercel pull`-ed sibling must survive the move.
    await mkdir(join(root, ".vercel"), { recursive: true });
    await writeFile(join(root, ".vercel", "project.json"), "{}", "utf-8");

    const result = await surfaceAdapterOutput(
      config({ adapter: "vercel", output: "server" }),
      context(root)
    );

    expect(result).toEqual({
      from: join(root, ".blume", ".vercel", "output"),
      ignore: ".vercel/",
      moved: true,
      to: join(root, ".vercel", "output"),
    });
    expect(existsSync(join(root, ".blume", ".vercel", "output"))).toBe(false);
    expect(
      await readFile(join(root, ".vercel", "output", "config.json"), "utf-8")
    ).toBe('{"version":3}');
    // The pulled project.json is untouched — only `.vercel/output` moved.
    expect(existsSync(join(root, ".vercel", "project.json"))).toBe(true);
  });

  it("moves only .netlify/v1, preserving netlify link state", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    await mkdir(join(root, ".blume", ".netlify", "v1"), { recursive: true });
    await writeFile(
      join(root, ".blume", ".netlify", "v1", "config.json"),
      "{}",
      "utf-8"
    );
    // A `netlify link`-ed state.json must survive the move.
    await mkdir(join(root, ".netlify"), { recursive: true });
    await writeFile(
      join(root, ".netlify", "state.json"),
      '{"siteId":"abc"}',
      "utf-8"
    );

    const result = await surfaceAdapterOutput(
      config({ adapter: "netlify", output: "server" }),
      context(root)
    );

    expect(result).toEqual({
      from: join(root, ".blume", ".netlify", "v1"),
      ignore: ".netlify/",
      moved: true,
      to: join(root, ".netlify", "v1"),
    });
    expect(existsSync(join(root, ".netlify", "v1", "config.json"))).toBe(true);
    expect(existsSync(join(root, ".blume", ".netlify", "v1"))).toBe(false);
    // The linked state.json is untouched — only `.netlify/v1` moved.
    expect(await readFile(join(root, ".netlify", "state.json"), "utf-8")).toBe(
      '{"siteId":"abc"}'
    );
  });

  it("replaces a stale destination bundle", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    await seed(root);
    await mkdir(join(root, ".vercel", "output"), { recursive: true });
    await writeFile(
      join(root, ".vercel", "output", "stale.txt"),
      "old",
      "utf-8"
    );

    await surfaceAdapterOutput(
      config({ adapter: "vercel", output: "server" }),
      context(root)
    );

    expect(existsSync(join(root, ".vercel", "output", "stale.txt"))).toBe(
      false
    );
    expect(existsSync(join(root, ".vercel", "output", "config.json"))).toBe(
      true
    );
  });

  it("is a no-op for a static build", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    await seed(root);
    expect(await surfaceAdapterOutput(config(), context(root))).toEqual({
      moved: false,
    });
    expect(existsSync(join(root, ".vercel", "output"))).toBe(false);
  });

  it("is a no-op for adapters that emit into dist/", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    expect(
      await surfaceAdapterOutput(
        config({ adapter: "node", output: "server" }),
        context(root)
      )
    ).toEqual({ moved: false });
    expect(ADAPTER_OUTPUT_PATHS.node).toBeUndefined();
  });

  it("is a no-op when the expected output is absent", async () => {
    const root = await mkdtemp(join(tmpdir(), "blume-surface-"));
    expect(
      await surfaceAdapterOutput(
        config({ adapter: "vercel", output: "server" }),
        context(root)
      )
    ).toEqual({ moved: false });
  });
});
