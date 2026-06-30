import { describe, expect, it } from "bun:test";

import { sidebarForRoute } from "../src/components/layout/nav-utils.ts";
import type { NavNode, NavTab } from "../src/core/types.ts";

const page = (label: string, route: string): NavNode => ({
  kind: "page",
  label,
  pageId: label,
  route,
});

const group = (label: string, path: string, children: NavNode[]): NavNode => ({
  children,
  kind: "group",
  label,
  path,
});

// A multi-section site: one group per section, each at its own URL path.
const TREE: NavNode[] = [
  group("Adapters", "/adapters", [
    page("S3", "/adapters/s3"),
    page("GCS", "/adapters/gcs"),
  ]),
  group("API", "/api", [page("Files", "/api/files")]),
];

const TABS: NavTab[] = [
  { label: "Adapters", path: "/adapters" },
  { label: "API", path: "/api" },
];

const labels = (nodes: NavNode[]): string[] => nodes.map((node) => node.label);

describe("sidebarForRoute", () => {
  it("scopes to the active tab's section group", () => {
    expect(labels(sidebarForRoute(TREE, TABS, "/adapters/s3"))).toStrictEqual([
      "S3",
      "GCS",
    ]);
    expect(labels(sidebarForRoute(TREE, TABS, "/api/files"))).toStrictEqual([
      "Files",
    ]);
  });

  it("resolves the section even when wrapped in a container group", () => {
    // Content mapped under a /docs prefix nests every section beneath a single
    // top-level "Docs" group — the tab must still resolve to its own section.
    const wrapped: NavNode[] = [
      group("Docs", "/docs", [
        group("Adapters", "/docs/adapters", [page("S3", "/docs/adapters/s3")]),
        group("API", "/docs/api", [page("Files", "/docs/api/files")]),
      ]),
    ];
    const tabs: NavTab[] = [{ label: "Adapters", path: "/docs/adapters" }];
    expect(
      labels(sidebarForRoute(wrapped, tabs, "/docs/adapters/s3"))
    ).toStrictEqual(["S3"]);
  });

  it("preserves sub-groups inside the section (does not over-unwrap)", () => {
    const tree: NavNode[] = [
      group("Guides", "/docs/guides", [
        group("Getting started", "/docs/guides/start", [
          page("Intro", "/docs/guides/start/intro"),
        ]),
      ]),
    ];
    const tabs: NavTab[] = [{ label: "Guides", path: "/docs/guides" }];
    expect(
      labels(sidebarForRoute(tree, tabs, "/docs/guides/start/intro"))
    ).toStrictEqual(["Getting started"]);
  });

  it("picks the longest-prefix tab when sections nest", () => {
    const tree: NavNode[] = [
      group("Docs", "/docs", [
        group("API", "/docs/api", [page("Endpoints", "/docs/api/endpoints")]),
      ]),
    ];
    const tabs: NavTab[] = [
      { label: "Docs", path: "/docs" },
      { label: "API", path: "/docs/api" },
    ];
    expect(
      labels(sidebarForRoute(tree, tabs, "/docs/api/endpoints"))
    ).toStrictEqual(["Endpoints"]);
  });

  it("returns the full sidebar when no tabs are configured", () => {
    expect(labels(sidebarForRoute(TREE, [], "/adapters/s3"))).toStrictEqual([
      "Adapters",
      "API",
    ]);
  });

  it("returns the full sidebar on a route under no tab", () => {
    expect(labels(sidebarForRoute(TREE, TABS, "/changelog"))).toStrictEqual([
      "Adapters",
      "API",
    ]);
  });

  it("never scopes for the root tab", () => {
    const tabs: NavTab[] = [{ label: "Home", path: "/" }, ...TABS];
    expect(labels(sidebarForRoute(TREE, tabs, "/"))).toStrictEqual([
      "Adapters",
      "API",
    ]);
  });

  it("falls back to the full sidebar when the tab maps to no group", () => {
    const tabs: NavTab[] = [{ label: "AI", path: "/ai" }];
    // The route matches the tab, but no group sits at /ai — show everything
    // rather than blank the sidebar.
    expect(labels(sidebarForRoute(TREE, tabs, "/ai/embed"))).toStrictEqual([
      "Adapters",
      "API",
    ]);
  });

  it("does not treat a sibling prefix as the section (/adapters vs /adapters-x)", () => {
    const tree: NavNode[] = [
      group("Adapters", "/adapters", [page("S3", "/adapters/s3")]),
      group("AdaptersX", "/adapters-x", [page("Extra", "/adapters-x/extra")]),
    ];
    const tabs: NavTab[] = [{ label: "A", path: "/adapters" }];
    expect(labels(sidebarForRoute(tree, tabs, "/adapters/s3"))).toStrictEqual([
      "S3",
    ]);
  });
});
