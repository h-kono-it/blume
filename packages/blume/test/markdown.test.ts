import { describe, expect, it } from "vitest";

import { codeTitleTransformer } from "../src/markdown/code-title.ts";
import { calloutTypeFor } from "../src/markdown/directives.ts";
import { toPackageCommands } from "../src/markdown/package-commands.ts";

/** Run the code-meta transformer over a fence's meta and return the <pre> attrs. */
const metaAttrs = (
  raw: string | undefined
): Record<string, boolean | number | string | undefined> => {
  const node = {
    properties: {} as Record<string, boolean | number | string | undefined>,
  };
  codeTitleTransformer().pre.call({ options: { meta: { __raw: raw } } }, node);
  return node.properties;
};

describe(calloutTypeFor, () => {
  it("passes through canonical callout types", () => {
    expect(calloutTypeFor("note")).toBe("note");
    expect(calloutTypeFor("warning")).toBe("warning");
    expect(calloutTypeFor("tip")).toBe("tip");
  });

  it("resolves aliases", () => {
    expect(calloutTypeFor("caution")).toBe("warning");
    expect(calloutTypeFor("error")).toBe("danger");
    expect(calloutTypeFor("important")).toBe("note");
  });

  it("is case-insensitive", () => {
    expect(calloutTypeFor("NOTE")).toBe("note");
  });

  it("returns null for non-callout directives", () => {
    expect(calloutTypeFor("details")).toBeNull();
  });
});

describe(toPackageCommands, () => {
  it("treats a bare package list as an install", () => {
    expect(toPackageCommands("react react-dom")).toStrictEqual({
      bun: "bun add react react-dom",
      npm: "npm install react react-dom",
      pnpm: "pnpm add react react-dom",
      yarn: "yarn add react react-dom",
    });
  });

  it("converts an explicit npm install with a dev flag", () => {
    expect(toPackageCommands("npm i -D typescript")).toStrictEqual({
      bun: "bun add -D typescript",
      npm: "npm install -D typescript",
      pnpm: "pnpm add -D typescript",
      yarn: "yarn add -D typescript",
    });
  });

  it("normalizes --save-dev to -D", () => {
    expect(toPackageCommands("npm install --save-dev vitest").pnpm).toBe(
      "pnpm add -D vitest"
    );
  });

  it("handles a bare `npm install` as install-all", () => {
    expect(toPackageCommands("npm install")).toStrictEqual({
      bun: "bun install",
      npm: "npm install",
      pnpm: "pnpm install",
      yarn: "yarn install",
    });
  });

  it("maps npx to each manager's exec command", () => {
    expect(toPackageCommands("npx astro add react")).toStrictEqual({
      bun: "bunx astro add react",
      npm: "npx astro add react",
      pnpm: "pnpm dlx astro add react",
      yarn: "yarn dlx astro add react",
    });
  });

  it("maps create/init", () => {
    expect(toPackageCommands("npm create astro@latest")).toStrictEqual({
      bun: "bun create astro@latest",
      npm: "npm create astro@latest",
      pnpm: "pnpm create astro@latest",
      yarn: "yarn create astro@latest",
    });
  });

  it("routes global installs through yarn global add", () => {
    expect(toPackageCommands("npm i -g vercel")).toStrictEqual({
      bun: "bun add -g vercel",
      npm: "npm install -g vercel",
      pnpm: "pnpm add -g vercel",
      yarn: "yarn global add vercel",
    });
  });

  it("maps uninstall to remove", () => {
    expect(toPackageCommands("npm uninstall lodash")).toStrictEqual({
      bun: "bun remove lodash",
      npm: "npm uninstall lodash",
      pnpm: "pnpm remove lodash",
      yarn: "yarn remove lodash",
    });
  });

  it("keeps run scripts on each manager", () => {
    expect(toPackageCommands("npm run build").yarn).toBe("yarn run build");
  });
});

describe(codeTitleTransformer, () => {
  it("promotes the first bare token to a title", () => {
    expect(metaAttrs("blume.config.ts").dataTitle).toBe("blume.config.ts");
  });

  it("reads an explicit title attribute", () => {
    expect(metaAttrs('title="My File"').dataTitle).toBe("My File");
  });

  it("sets data-line-numbers and keeps the title", () => {
    const attrs = metaAttrs("file.ts lineNumbers");
    expect(attrs.dataTitle).toBe("file.ts");
    expect(attrs.dataLineNumbers).toBeTruthy();
  });

  it("does not treat the lineNumbers keyword as a title", () => {
    const attrs = metaAttrs("lineNumbers");
    expect(attrs.dataTitle).toBeUndefined();
    expect(attrs.dataLineNumbers).toBeTruthy();
  });

  it("ignores line ranges and leaves plain blocks bare", () => {
    expect(metaAttrs("{1,3-5}").dataTitle).toBeUndefined();
    expect(metaAttrs().dataLineNumbers).toBeUndefined();
  });
});
