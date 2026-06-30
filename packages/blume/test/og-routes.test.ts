import { describe, expect, it } from "bun:test";

import { customOgRoutes } from "../src/astro/pages.ts";

const page = (pattern: string) => ({
  entrypoint: `/p${pattern}.astro`,
  pattern,
});

describe("customOgRoutes", () => {
  it("titles the home with the site title and the description eyebrow", () => {
    expect(customOgRoutes([page("/")], "Acme", "Fast docs")).toEqual([
      { eyebrow: "Fast docs", slug: "index", title: "Acme" },
    ]);
  });

  it("titles a deeper page from its last segment, site-title eyebrow", () => {
    expect(
      customOgRoutes([page("/pricing"), page("/getting-started")], "Acme")
    ).toEqual([
      { eyebrow: "Acme", slug: "pricing", title: "Pricing" },
      { eyebrow: "Acme", slug: "getting-started", title: "Getting Started" },
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

  it("omits the eyebrow for the home when there's no description", () => {
    const [home] = customOgRoutes([page("/")], "Acme");
    expect(home?.eyebrow).toBeUndefined();
    expect(home).toEqual({ eyebrow: undefined, slug: "index", title: "Acme" });
  });
});
