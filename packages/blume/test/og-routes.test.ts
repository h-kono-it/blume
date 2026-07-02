import { describe, expect, it } from "bun:test";

import { customOgRoutes } from "../src/astro/pages.ts";

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
});
