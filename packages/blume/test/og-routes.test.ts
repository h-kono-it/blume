import { describe, expect, it } from "bun:test";

import { customOgRoutes } from "../src/astro/pages.ts";
import { truncate } from "../src/og/card.ts";

const page = (pattern: string) => ({
  entrypoint: `/p${pattern}.astro`,
  pattern,
});

describe("customOgRoutes", () => {
  it("titles the home with the site title", () => {
    expect(customOgRoutes([page("/")], "Acme")).toEqual([
      { slug: "index", title: "Acme" },
    ]);
  });

  it("titles a deeper page from its last segment", () => {
    expect(
      customOgRoutes([page("/pricing"), page("/getting-started")], "Acme")
    ).toEqual([
      { slug: "pricing", title: "Pricing" },
      { slug: "getting-started", title: "Getting Started" },
    ]);
  });

  it("skips dynamic routes and private (_partial / .well-known) segments", () => {
    const routes = customOgRoutes(
      [
        page("/"),
        page("/_home/Hero"),
        page("/.well-known/mcp.json"),
        page("/blog/[slug]"),
      ],
      "Acme"
    );
    expect(routes.map((route) => route.slug)).toEqual(["index"]);
  });

  it("dedupes routes that map to the same slug", () => {
    expect(
      customOgRoutes([page("/pricing"), page("/pricing")], "Acme")
    ).toHaveLength(1);
  });

  it("prefers a seo.og.titles entry over the humanized segment", () => {
    expect(
      customOgRoutes([page("/cli"), page("/pricing")], "Acme", {
        "/cli": "CLI",
      })
    ).toEqual([
      { slug: "cli", title: "CLI" },
      { slug: "pricing", title: "Pricing" },
    ]);
  });

  it("overrides the home title via the / key", () => {
    expect(customOgRoutes([page("/")], "Acme", { "/": "Acme Docs" })).toEqual([
      { slug: "index", title: "Acme Docs" },
    ]);
  });

  it("normalizes title keys missing or trailing a slash", () => {
    expect(
      customOgRoutes([page("/cli"), page("/pricing")], "Acme", {
        "/pricing/": "Plans",
        cli: "CLI",
      })
    ).toEqual([
      { slug: "cli", title: "CLI" },
      { slug: "pricing", title: "Plans" },
    ]);
  });
});

describe("truncate", () => {
  it("returns short strings unchanged", () => {
    expect(truncate("Hello", 20)).toBe("Hello");
  });

  it("cuts without leaving a lone surrogate mid-emoji", () => {
    // The cut lands right after the emoji; slicing by code point keeps it whole.
    const result = truncate("ab🎉cd", 4);
    expect(result.endsWith("…")).toBe(true);
    // No unpaired surrogate: re-encoding round-trips cleanly.
    expect([...result].every((ch) => ch.codePointAt(0) !== undefined)).toBe(
      true
    );
    expect(result).not.toContain("�");
    expect(result).toBe("ab🎉…");
  });
});
