import { describe, expect, it } from "bun:test";

import { blumeConfigSchema, pageMetaSchema } from "../src/core/schema.ts";

describe("dateSchema normalization", () => {
  it("passes a string date through unchanged", () => {
    const meta = pageMetaSchema.parse({ date: "2026-01-01" });
    expect(meta.date).toBe("2026-01-01");
  });

  it("normalizes a Date (YAML-parsed) to an ISO string", () => {
    const when = new Date("2026-01-02T03:04:05.000Z");
    const meta = pageMetaSchema.parse({ lastModified: when });
    expect(meta.lastModified).toBe("2026-01-02T03:04:05.000Z");
  });
});

describe("banner color refinement", () => {
  it("accepts a banner color with a single side set", () => {
    const config = blumeConfigSchema.parse({
      banner: { color: { light: "#fff" }, content: "Beta" },
    });
    expect(config.banner).toStrictEqual({
      color: { light: "#fff" },
      content: "Beta",
      dismissible: false,
    });
  });

  it("rejects a banner color with neither side set", () => {
    expect(
      blumeConfigSchema.safeParse({
        banner: { color: {}, content: "Beta" },
      }).success
    ).toBeFalsy();
  });
});

describe("navbar link refinements", () => {
  it("accepts links and a primary button that carry a label", () => {
    const config = blumeConfigSchema.parse({
      navbar: {
        links: [{ href: "https://x.test", label: "Docs" }],
        primary: { href: "https://x.test/start", label: "Start" },
      },
    });
    expect(config.navbar.links[0]?.label).toBe("Docs");
    expect(config.navbar.primary?.type).toBe("button");
  });

  it("rejects a bare navbar link with neither label nor type", () => {
    expect(
      blumeConfigSchema.safeParse({
        navbar: { links: [{ href: "https://x.test" }] },
      }).success
    ).toBeFalsy();
  });

  it("rejects a primary button without a label", () => {
    expect(
      blumeConfigSchema.safeParse({
        navbar: { primary: { href: "https://x.test" } },
      }).success
    ).toBeFalsy();
  });
});

describe("export config normalization", () => {
  it("expands the boolean shorthand to both formats", () => {
    expect(blumeConfigSchema.parse({ export: true }).export).toStrictEqual({
      epub: true,
      pdf: true,
    });
  });

  it("keeps an object form with per-format toggles", () => {
    expect(
      blumeConfigSchema.parse({ export: { epub: true } }).export
    ).toStrictEqual({ epub: true, pdf: false });
  });
});

describe("analytics script refinement", () => {
  it("accepts a script that sets exactly one of src or content", () => {
    const config = blumeConfigSchema.parse({
      analytics: { scripts: [{ src: "https://x.test/a.js" }] },
    });
    expect(config.analytics?.scripts?.[0]?.src).toBe("https://x.test/a.js");
  });

  it("rejects a script that sets both src and content", () => {
    expect(
      blumeConfigSchema.safeParse({
        analytics: { scripts: [{ content: "x", src: "https://x.test/a.js" }] },
      }).success
    ).toBeFalsy();
  });
});
