import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { resolveTsconfigAliases } from "../src/core/tsconfig-aliases.ts";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "blume-tsalias-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

const writeConfig = (content: string, name = "tsconfig.json"): Promise<void> =>
  writeFile(join(root, name), content, "utf-8");

describe("resolveTsconfigAliases", () => {
  it("maps @/* to an absolute src dir against baseUrl", async () => {
    await writeConfig(
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } },
      })
    );

    expect(resolveTsconfigAliases(root)).toEqual({ "@": join(root, "src") });
  });

  it("handles the shadcn `@/*` -> `./*` default (alias to the root)", async () => {
    await writeConfig(
      JSON.stringify({ compilerOptions: { paths: { "@/*": ["./*"] } } })
    );

    expect(resolveTsconfigAliases(root)).toEqual({ "@": root });
  });

  it("tolerates comments and trailing commas (JSONC)", async () => {
    await writeConfig(`{
      // the project's TypeScript config
      "compilerOptions": {
        "baseUrl": ".",
        "paths": { "@/*": ["./src/*"], }, /* shadcn style */
      },
    }`);

    expect(resolveTsconfigAliases(root)).toEqual({ "@": join(root, "src") });
  });

  it("maps multiple aliases and an exact (non-glob) key", async () => {
    await writeConfig(
      JSON.stringify({
        compilerOptions: {
          paths: {
            "@/*": ["./src/*"],
            "@ui/*": ["./src/components/ui/*"],
            config: ["./app.config.ts"],
          },
        },
      })
    );

    expect(resolveTsconfigAliases(root)).toEqual({
      "@": join(root, "src"),
      "@ui": join(root, "src", "components", "ui"),
      config: join(root, "app.config.ts"),
    });
  });

  it("follows a relative `extends` to the file that declares paths", async () => {
    await mkdir(join(root, "config"), { recursive: true });
    await writeFile(
      join(root, "config", "base.json"),
      JSON.stringify({
        compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } },
      }),
      "utf-8"
    );
    await writeConfig(JSON.stringify({ extends: "./config/base.json" }));

    // baseUrl resolves against the base file's own directory.
    expect(resolveTsconfigAliases(root)).toEqual({
      "@": join(root, "config", "src"),
    });
  });

  it("falls back to jsconfig.json", async () => {
    await writeConfig(
      JSON.stringify({ compilerOptions: { paths: { "~/*": ["./app/*"] } } }),
      "jsconfig.json"
    );

    expect(resolveTsconfigAliases(root)).toEqual({ "~": join(root, "app") });
  });

  it("skips a catch-all `*` mapping", async () => {
    await writeConfig(
      JSON.stringify({ compilerOptions: { paths: { "*": ["./types/*"] } } })
    );

    expect(resolveTsconfigAliases(root)).toEqual({});
  });

  it("returns {} when there's no config or it can't be parsed", async () => {
    expect(resolveTsconfigAliases(root)).toEqual({});

    await writeConfig("{ not valid json ");
    expect(resolveTsconfigAliases(root)).toEqual({});
  });
});
