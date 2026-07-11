import { afterAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { dirname, join } from "pathe";

import { buildMcpData } from "../src/ai/mcp/data.ts";
import type { McpData } from "../src/ai/mcp/data.ts";
import {
  buildMcpDiscovery,
  buildMcpServerCard,
} from "../src/ai/mcp/discovery.ts";
import { createMcpFetchHandler } from "../src/ai/mcp/server.ts";
import { MCP_TOOLS } from "../src/ai/mcp/tools.ts";
import { scanProject } from "../src/core/project-graph.ts";
import type { BlumeProject } from "../src/core/project-graph.ts";
import { buildOramaIndex, queryOramaIndex } from "../src/search/orama-index.ts";

const DATA: McpData = {
  base: "",
  documents: [
    {
      content:
        "Install Blume with your package manager, then run the dev server to preview the docs.",
      description: "How to install Blume",
      route: "/guides/install",
      title: "Installation",
    },
    {
      content:
        "Configure themes, navigation, and search in blume.config.ts to customize the site.",
      description: "Configuration reference",
      route: "/guides/config",
      title: "Configuration",
    },
  ],
  name: "Test Docs",
  navigation: {
    featured: [],
    selectors: [],
    sidebar: [
      {
        kind: "page",
        label: "Installation",
        pageId: "guides/install",
        route: "/guides/install",
      },
    ],
    tabs: [{ label: "Guides", path: "/guides/install" }],
  },
  pages: {
    "/guides/config":
      "---\ntitle: Configuration\n---\n# Configuration\n\nConfigure it.",
    "/guides/install":
      "---\ntitle: Installation\n---\n# Installation\n\nInstall it.",
  },
  routes: [
    {
      contentType: "doc",
      description: "How to install Blume",
      indexable: true,
      lastModified: null,
      route: "/guides/install",
      title: "Installation",
    },
    {
      contentType: "doc",
      description: "Configuration reference",
      indexable: true,
      lastModified: null,
      route: "/guides/config",
      title: "Configuration",
    },
  ],
  site: "https://docs.example.com",
  version: "0.0.0",
};

const handler = createMcpFetchHandler(DATA);

const post = (method: string, params?: unknown): Promise<Response> =>
  handler(
    new Request("https://docs.example.com/mcp", {
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      method: "POST",
    })
  );

const rpc = async (method: string, params?: unknown) => {
  const response = await post(method, params);
  return (await response.json()) as {
    error?: { message: string };
    result?: Record<string, unknown>;
  };
};

const callTool = async (name: string, args?: Record<string, unknown>) => {
  const body = await rpc("tools/call", { arguments: args, name });
  const content = body.result?.content as { text: string }[] | undefined;
  return {
    isError: body.result?.isError === true,
    text: content?.[0]?.text ?? "",
  };
};

describe("createMcpFetchHandler transport", () => {
  it("answers CORS preflight without a body", async () => {
    const response = await handler(
      new Request("https://docs.example.com/mcp", { method: "OPTIONS" })
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("rejects GET (no server-initiated streams)", async () => {
    const response = await handler(
      new Request("https://docs.example.com/mcp", { method: "GET" })
    );
    expect(response.status).toBe(405);
  });

  it("lists every registered tool", async () => {
    const body = await rpc("tools/list");
    const tools = (body.result?.tools as { name: string }[]) ?? [];
    expect(tools.map((tool) => tool.name).toSorted()).toEqual(
      MCP_TOOLS.map((tool) => tool.name).toSorted()
    );
  });
});

describe("MCP tools", () => {
  it("search_docs ranks the relevant page first with an absolute URL", async () => {
    const { text, isError } = await callTool("search_docs", {
      query: "install dev server",
    });
    expect(isError).toBe(false);
    const hits = JSON.parse(text) as { url: string }[];
    expect(hits[0]?.url).toBe("https://docs.example.com/guides/install");
  });

  it("search_docs honors the limit", async () => {
    const { text } = await callTool("search_docs", {
      limit: 1,
      query: "blume",
    });
    expect((JSON.parse(text) as unknown[]).length).toBe(1);
  });

  it("get_page returns the raw Markdown source", async () => {
    const { text, isError } = await callTool("get_page", {
      route: "/guides/install",
    });
    expect(isError).toBe(false);
    expect(text).toContain("# Installation");
  });

  it("get_page normalizes a .md suffix and trailing slash", async () => {
    const { text } = await callTool("get_page", {
      route: "/guides/install.md/",
    });
    expect(text).toContain("# Installation");
  });

  it("get_page reports an error for an unknown route", async () => {
    const { isError } = await callTool("get_page", { route: "/nope" });
    expect(isError).toBe(true);
  });

  it("list_pages returns every non-hidden route", async () => {
    const { text } = await callTool("list_pages");
    const routes = JSON.parse(text) as { route: string }[];
    expect(routes.map((route) => route.route).toSorted()).toEqual([
      "/guides/config",
      "/guides/install",
    ]);
  });

  it("get_navigation returns the navigation tree", async () => {
    const { text } = await callTool("get_navigation");
    const nav = JSON.parse(text) as { tabs: unknown[] };
    expect(nav.tabs.length).toBe(1);
  });

  it("layers deployment.base into tool URLs (routes are base-less)", async () => {
    const based = createMcpFetchHandler({ ...DATA, base: "/sub" });
    const call = async (name: string, args?: Record<string, unknown>) => {
      const response = await based(
        new Request("https://docs.example.com/sub/mcp", {
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "tools/call",
            params: { arguments: args, name },
          }),
          headers: {
            accept: "application/json, text/event-stream",
            "content-type": "application/json",
          },
          method: "POST",
        })
      );
      const body = (await response.json()) as {
        result?: { content?: { text: string }[] };
      };
      return body.result?.content?.[0]?.text ?? "";
    };

    const pages = JSON.parse(await call("list_pages")) as { url: string }[];
    expect(pages.map((page) => page.url).toSorted()).toEqual([
      "https://docs.example.com/sub/guides/config",
      "https://docs.example.com/sub/guides/install",
    ]);

    const hits = JSON.parse(
      await call("search_docs", { query: "install dev server" })
    ) as { url: string }[];
    expect(hits[0]?.url).toBe("https://docs.example.com/sub/guides/install");
  });
});

describe("search_docs fallback excerpts", () => {
  // Pages without a description fall back to a content excerpt; the ellipsis
  // must mark real truncation only.
  const excerptHandler = createMcpFetchHandler({
    ...DATA,
    documents: [
      {
        content: "Shortpage body only.",
        description: "",
        route: "/short",
        title: "Shortpage",
      },
      {
        // 11-char head + 7-char units puts a space at index 199, so the
        // 200-char slice ends in whitespace and must be trimmed.
        content: `Longstart. ${"filler ".repeat(40)}end`,
        description: "",
        route: "/long",
        title: "Longpage",
      },
      {
        content: "",
        description: "",
        route: "/empty",
        title: "Emptypage",
      },
      {
        content: "Descpage body.",
        description: "Described here.",
        route: "/desc",
        title: "Descpage",
      },
    ],
  });

  const firstExcerpt = async (query: string): Promise<string> => {
    const response = await excerptHandler(
      new Request("https://docs.example.com/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: { query }, name: "search_docs" },
        }),
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
        },
        method: "POST",
      })
    );
    const body = (await response.json()) as {
      result?: { content?: { text: string }[] };
    };
    const hits = JSON.parse(body.result?.content?.[0]?.text ?? "[]") as {
      excerpt: string;
    }[];
    return hits[0]?.excerpt ?? "missing";
  };

  it("prefers the description when one exists", async () => {
    expect(await firstExcerpt("Descpage")).toBe("Described here.");
  });

  it("returns short content whole, with no fake truncation marker", async () => {
    expect(await firstExcerpt("Shortpage")).toBe("Shortpage body only.");
  });

  it("truncates long content with a trimmed, whitespace-free ellipsis", async () => {
    const excerpt = await firstExcerpt("Longpage");
    // The 200-char cut lands on a space; it must be trimmed before the marker.
    expect(excerpt).toMatch(/\S…$/u);
    expect(excerpt.length).toBeLessThan(201);
    expect(excerpt).toContain("Longstart.");
  });

  it("leaves an empty-content page's excerpt empty, not a bare ellipsis", async () => {
    expect(await firstExcerpt("Emptypage")).toBe("");
  });
});

describe("orama index helpers", () => {
  it("ranks a title match above a body-only match", async () => {
    const db = await buildOramaIndex(DATA.documents);
    const hits = await queryOramaIndex(db, "configuration", 5);
    expect(hits[0]?.route).toBe("/guides/config");
  });

  it("filters results to a locale when one is given", async () => {
    const db = await buildOramaIndex([
      {
        content: "Installation guide",
        description: "",
        locale: "en",
        route: "/install",
        title: "Install",
      },
      {
        content: "Guide d'installation",
        description: "",
        locale: "fr",
        route: "/fr/install",
        title: "Installation",
      },
    ]);
    const fr = await queryOramaIndex(db, "install", 5, "fr");
    expect(fr.map((doc) => doc.route)).toEqual(["/fr/install"]);
    // No filter searches every language.
    const all = await queryOramaIndex(db, "install", 5);
    expect(all.length).toBe(2);
  });
});

describe("discovery documents", () => {
  const input = {
    base: "",
    name: "Test Docs",
    route: "/mcp",
    site: "https://docs.example.com",
    version: "0.0.0",
  };

  it("advertises the absolute server URL", () => {
    const discovery = buildMcpDiscovery(input) as {
      servers: { url: string }[];
    };
    expect(discovery.servers[0]?.url).toBe("https://docs.example.com/mcp");
  });

  it("keeps a subpath site's base path in the server URL", () => {
    // new URL("/mcp", "https://acme.com/docs") drops the base; concatenation
    // must keep it, matching how llms.txt builds page URLs.
    const discovery = buildMcpDiscovery({
      ...input,
      site: "https://acme.com/docs",
    }) as { servers: { url: string }[] };
    expect(discovery.servers[0]?.url).toBe("https://acme.com/docs/mcp");
  });

  it("lists the tool set in the server card", () => {
    const card = buildMcpServerCard(input) as { tools: { name: string }[] };
    expect(card.tools.map((tool) => tool.name).toSorted()).toEqual(
      MCP_TOOLS.map((tool) => tool.name).toSorted()
    );
  });

  it("falls back to a relative URL without a site", () => {
    const discovery = buildMcpDiscovery({ ...input, site: null }) as {
      servers: { url: string }[];
    };
    expect(discovery.servers[0]?.url).toBe("/mcp");
  });

  it("layers deployment.base under the advertised URL", () => {
    // The endpoint is a generated Astro page, served under the base.
    const discovery = buildMcpDiscovery({ ...input, base: "/sub" }) as {
      servers: { url: string }[];
    };
    expect(discovery.servers[0]?.url).toBe("https://docs.example.com/sub/mcp");

    const card = buildMcpServerCard({
      ...input,
      base: "/sub",
      site: null,
    }) as { url: string };
    expect(card.url).toBe("/sub/mcp");
  });
});

describe("unknown tool", () => {
  it("reports an error for an unregistered tool name", async () => {
    const { isError, text } = await callTool("bogus_tool");
    expect(isError).toBe(true);
    expect(text).toContain("Unknown tool: bogus_tool");
  });
});

const scanDirs: string[] = [];

const scanFixture = async (
  files: Record<string, string>
): Promise<BlumeProject> => {
  const root = await mkdtemp(join(tmpdir(), "blume-mcp-"));
  scanDirs.push(root);
  await Promise.all(
    Object.entries(files).map(async ([rel, content]) => {
      const abs = join(root, rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content);
    })
  );
  return await scanProject(root);
};

afterAll(async () => {
  await Promise.all(
    scanDirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

describe("buildMcpData", () => {
  it("builds a snapshot, honoring config and filtering hidden routes", async () => {
    const project = await scanFixture({
      "blume.config.ts":
        'export default { deployment: { base: "sub/", site: "https://docs.example.com" }, mcp: { enabled: true, instructions: "Be concise.", name: "Custom MCP" }, title: "Project Title" };',
      "docs/guides/install.md":
        '---\ntitle: Installation\ndescription: How to install\n---\n# Installation\n\nInstall it now.\n\n<Callout type="tip">Use bun.</Callout>\n',
      "docs/index.md":
        "---\ntitle: Home\ndescription: The home page\n---\n# Home\n\nWelcome to the docs.\n",
      "docs/secret.md":
        "---\ntitle: Secret\nsidebar:\n  hidden: true\n---\n# Secret\n\nHidden content.\n",
      "docs/vis.md":
        '---\ntitle: Vis\n---\n# Vis\n\n<Visibility for="web">\nWebonly body.\n</Visibility>\n\n<Visibility for="agents">\nAgentonly body.\n</Visibility>\n',
    });

    const data = await buildMcpData(project);

    // Config-derived metadata: explicit mcp.name/instructions/site win.
    expect(data.name).toBe("Custom MCP");
    expect(data.instructions).toBe("Be concise.");
    expect(data.site).toBe("https://docs.example.com");
    // `deployment.base` is normalized for layering onto base-less routes.
    expect(data.base).toBe("/sub");
    expect(typeof data.version).toBe("string");
    expect(data.version).toBe(project.manifest.blumeVersion);

    // Navigation is passed through from the graph verbatim.
    expect(data.navigation).toBe(project.graph.navigation);

    // Hidden routes are excluded from the route list and search documents.
    const routePaths = data.routes.map((route) => route.route).toSorted();
    expect(routePaths).toStrictEqual(["/", "/guides/install", "/vis"]);
    expect(routePaths).not.toContain("/secret");

    // Route entries carry the page description and a normalized lastModified.
    const install = data.routes.find(
      (route) => route.route === "/guides/install"
    );
    expect(install).toMatchObject({
      contentType: "doc",
      description: "How to install",
      indexable: true,
      lastModified: null,
      title: "Installation",
    });

    // Documents are mapped down to the four MCP fields and skip hidden pages.
    const doc = data.documents.find(
      (entry) => entry.route === "/guides/install"
    );
    expect(doc).toBeDefined();
    expect(Object.keys(doc ?? {}).toSorted()).toStrictEqual([
      "content",
      "description",
      "route",
      "title",
    ]);
    expect(doc?.title).toBe("Installation");
    expect(data.documents.some((entry) => entry.route === "/secret")).toBe(
      false
    );

    // `pages` maps every route (hidden included) to its raw source Markdown,
    // with components downleveled for agents.
    expect(data.pages["/guides/install"]).toContain("# Installation");
    expect(data.pages["/guides/install"]).toContain("title: Installation");
    expect(data.pages["/guides/install"]).toContain("> **Tip**\n>\n> Use bun.");
    expect(data.pages["/guides/install"]).not.toContain("<Callout");
    expect(data.pages["/secret"]).toContain("Hidden content.");

    // Documents are agent-facing: `<Visibility>` resolves like `get_page`
    // (web-only content dropped, agents-only content kept, tags unwrapped).
    const vis = data.documents.find((entry) => entry.route === "/vis");
    expect(vis?.content).toContain("Agentonly body.");
    expect(vis?.content).not.toContain("Webonly body.");
  });

  it("falls back to config.title for the name and null for the site", async () => {
    const project = await scanFixture({
      "blume.config.ts": 'export default { title: "Fallback Title" };',
      "docs/index.md": "---\ntitle: Home\n---\n# Home\n\nHi.\n",
    });

    const data = await buildMcpData(project);

    expect(data.name).toBe("Fallback Title");
    expect(data.instructions).toBeUndefined();
    expect(data.site).toBeNull();
    expect(data.base).toBe("");
  });
});
