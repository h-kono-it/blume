import { afterAll, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { ensureGitignore } from "../src/core/gitignore.ts";

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const tempDir = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "blume-gitignore-"));
  dirs.push(dir);
  return dir;
};

describe("ensureGitignore", () => {
  it("creates .gitignore when absent", async () => {
    const root = await tempDir();
    expect(await ensureGitignore(root, [".blume/", "dist/"])).toEqual([
      ".blume/",
      "dist/",
    ]);
    expect(await readFile(join(root, ".gitignore"), "utf-8")).toBe(
      ".blume/\ndist/\n"
    );
  });

  it("appends only the missing entries (trailing slash agnostic)", async () => {
    const root = await tempDir();
    await writeFile(join(root, ".gitignore"), "node_modules\ndist/\n", "utf-8");

    expect(await ensureGitignore(root, [".blume/", "dist/"])).toEqual([
      ".blume/",
    ]);
    expect(await readFile(join(root, ".gitignore"), "utf-8")).toBe(
      "node_modules\ndist/\n.blume/\n"
    );
  });

  it("inserts a separating newline when the file lacks a trailing one", async () => {
    const root = await tempDir();
    await writeFile(join(root, ".gitignore"), "node_modules", "utf-8");

    expect(await ensureGitignore(root, [".blume/"])).toEqual([".blume/"]);
    expect(await readFile(join(root, ".gitignore"), "utf-8")).toBe(
      "node_modules\n.blume/\n"
    );
  });

  it("is a no-op when every entry is already present", async () => {
    const root = await tempDir();
    await writeFile(join(root, ".gitignore"), ".blume\ndist\n", "utf-8");

    expect(await ensureGitignore(root, [".blume/", "dist/"])).toEqual([]);
    expect(await readFile(join(root, ".gitignore"), "utf-8")).toBe(
      ".blume\ndist\n"
    );
  });
});
