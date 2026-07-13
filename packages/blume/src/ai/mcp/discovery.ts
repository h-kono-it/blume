import { withBasePath } from "../../core/base-path.ts";
import { trimEnd } from "../../core/trim.ts";
import { MCP_TOOLS } from "./tools.ts";

/** Inputs needed to describe the MCP server in discovery documents. */
export interface McpDiscoveryInput {
  /** Normalized `deployment.base` (`""` or `/seg`); the route is base-less. */
  base: string;
  name: string;
  route: string;
  site: string | null;
  version: string;
}

/** The MCP server's address — absolute when a site is configured. */
const serverUrl = (input: McpDiscoveryInput): string => {
  // The endpoint is a generated Astro page, so it's served under
  // `deployment.base` like every other route (the sitemap/llms.txt convention).
  const path = withBasePath(input.base, input.route);
  // Concatenate rather than `new URL(path, site)` — a root-absolute path
  // would drop the base path of a subpath deployment (`acme.com/docs`).
  return input.site ? `${trimEnd(input.site, "/")}${path}` : path;
};

/**
 * The `/.well-known/mcp.json` discovery document: the minimal pointer agents use
 * to find the server and its transport.
 */
export const buildMcpDiscovery = (
  input: McpDiscoveryInput
): Record<string, unknown> => ({
  servers: [
    {
      name: input.name,
      transport: "streamable-http",
      url: serverUrl(input),
    },
  ],
});

/**
 * The `/.well-known/mcp/server-card.json` document: richer metadata including
 * the advertised tool set (full input schemas are served live via `tools/list`).
 */
export const buildMcpServerCard = (
  input: McpDiscoveryInput
): Record<string, unknown> => ({
  description: `Model Context Protocol server for the ${input.name} documentation.`,
  name: input.name,
  tools: MCP_TOOLS.map((tool) => ({
    annotations: tool.annotations,
    description: tool.description,
    name: tool.name,
    title: tool.title,
  })),
  transport: "streamable-http",
  url: serverUrl(input),
  version: input.version,
});
