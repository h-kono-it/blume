import { describe, expect, it } from "bun:test";

import type { ResolvedConfig } from "../src/core/schema.ts";
import { buildNetlifyHeaders } from "../src/deploy/headers.ts";

const configWith = (
  overrides: Partial<{ base?: string; basePath: string }>
): ResolvedConfig =>
  ({
    basePath: overrides.basePath ?? "",
    deployment: { base: overrides.base },
  }) as ResolvedConfig;

describe("buildNetlifyHeaders", () => {
  it("pins a UTF-8 Content-Type onto each raw endpoint extension", () => {
    expect(buildNetlifyHeaders(configWith({}))).toBe(
      [
        "/*.md",
        "  Content-Type: text/markdown; charset=utf-8",
        "/*.mdx",
        "  Content-Type: text/markdown; charset=utf-8",
        "/*.txt",
        "  Content-Type: text/plain; charset=utf-8",
        "",
      ].join("\n")
    );
  });

  it("prefixes globs with the composed deployment.base + basePath stack", () => {
    const out = buildNetlifyHeaders(
      configWith({ base: "/base", basePath: "/docs" })
    );
    expect(out).toContain("/base/docs/*.md");
    expect(out).toContain("/base/docs/*.mdx");
    // llms.txt / llms-full.txt live at the dist root, not under basePath.
    expect(out).toContain("/base/*.txt");
    expect(out).not.toContain("/base/docs/*.txt");
  });

  it("normalizes a trailing slash on deployment.base", () => {
    expect(buildNetlifyHeaders(configWith({ base: "/docs/" }))).toContain(
      "/docs/*.md"
    );
  });

  it("keeps the .txt rule at the root when only basePath is set", () => {
    const out = buildNetlifyHeaders(configWith({ basePath: "/docs" }));
    expect(out).toContain("/docs/*.md");
    expect(out).toContain("/*.txt");
    expect(out).not.toContain("/docs/*.txt");
  });
});
