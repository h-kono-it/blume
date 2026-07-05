import { afterEach, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { join } from "pathe";

import { loadEnvFiles, parseEnv } from "../src/cli/env.ts";

const dirs: string[] = [];
const touched: string[] = [];

const tempDir = async (): Promise<string> => {
  const dir = await mkdtemp(join(tmpdir(), "blume-env-"));
  dirs.push(dir);
  return dir;
};

/** Track a key so it can be cleaned up regardless of what the test set it to. */
const track = (...keys: string[]): void => {
  touched.push(...keys);
};

afterEach(async () => {
  for (const key of touched.splice(0)) {
    Reflect.deleteProperty(process.env, key);
  }
  await Promise.all(
    dirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

describe("parseEnv", () => {
  it("parses exports, quotes, comments, and inline equals", () => {
    const parsed = parseEnv(
      [
        "# a comment",
        "",
        "export EXPORTED=yes",
        'DQ="line\\nbreak"',
        "SQ='raw\\nvalue'",
        'QUOTE="say \\"hi\\""',
        'DQESC="a\\tb\\\\c"',
        "PLAIN=hello world",
        "WITHEQ=a=b",
        "not a valid line",
      ].join("\n")
    );
    expect(parsed).toStrictEqual({
      DQ: "line\nbreak",
      DQESC: "a\tb\\c",
      EXPORTED: "yes",
      PLAIN: "hello world",
      QUOTE: 'say "hi"',
      SQ: "raw\\nvalue",
      WITHEQ: "a=b",
    });
  });

  it("strips unquoted inline comments, like dotenv and Vite", () => {
    const parsed = parseEnv(
      [
        "TOKEN=ghp_abc123 # personal token",
        "BARE=value#tail",
        'KEPT="value # not a comment"',
        "KEPT_SQ='value # not a comment'",
      ].join("\n")
    );
    expect(parsed).toStrictEqual({
      BARE: "value",
      KEPT: "value # not a comment",
      KEPT_SQ: "value # not a comment",
      TOKEN: "ghp_abc123",
    });
  });
});

describe("loadEnvFiles", () => {
  it("cascades to the repo root, letting nearer files and the shell win", async () => {
    const base = await tempDir();
    const repo = join(base, "outer", "repo");
    const app = join(repo, "app");
    await mkdir(app, { recursive: true });
    await mkdir(join(repo, ".git"), { recursive: true });
    await writeFile(join(base, "outer", ".env"), "BLUME_ENVTEST_OUTER=above\n");
    await writeFile(
      join(repo, ".env"),
      "BLUME_ENVTEST_BASE=base\nBLUME_ENVTEST_SHARED=fromenv\n"
    );
    await writeFile(
      join(repo, ".env.local"),
      "BLUME_ENVTEST_LOCAL=local\nBLUME_ENVTEST_SHARED=fromlocal\n"
    );
    await writeFile(
      join(app, ".env"),
      "BLUME_ENVTEST_APP=app\nBLUME_ENVTEST_PREEXIST=fromfile\n"
    );

    track(
      "BLUME_ENVTEST_OUTER",
      "BLUME_ENVTEST_BASE",
      "BLUME_ENVTEST_SHARED",
      "BLUME_ENVTEST_LOCAL",
      "BLUME_ENVTEST_APP",
      "BLUME_ENVTEST_PREEXIST"
    );
    process.env.BLUME_ENVTEST_PREEXIST = "shell";

    loadEnvFiles(app);

    expect(process.env.BLUME_ENVTEST_APP).toBe("app");
    expect(process.env.BLUME_ENVTEST_LOCAL).toBe("local");
    expect(process.env.BLUME_ENVTEST_BASE).toBe("base");
    // `.env.local` layers over `.env` within a dir.
    expect(process.env.BLUME_ENVTEST_SHARED).toBe("fromlocal");
    // The `.git` in repo/ stops the walk before outer/.env.
    expect(process.env.BLUME_ENVTEST_OUTER).toBeUndefined();
    // An existing (shell) value is never clobbered.
    expect(process.env.BLUME_ENVTEST_PREEXIST).toBe("shell");
  });

  it("walks to the filesystem root when there is no repo marker", async () => {
    const base = await tempDir();
    await writeFile(join(base, ".env"), "BLUME_ENVTEST_ROOTWALK=walked\n");
    track("BLUME_ENVTEST_ROOTWALK");

    loadEnvFiles(base);

    expect(process.env.BLUME_ENVTEST_ROOTWALK).toBe("walked");
  });

  it("ignores an unreadable env file without throwing", async () => {
    const base = await tempDir();
    await mkdir(join(base, ".git"), { recursive: true });
    // A directory named `.env` exists but cannot be read as a file.
    await mkdir(join(base, ".env"), { recursive: true });

    expect(() => loadEnvFiles(base)).not.toThrow();
  });
});
