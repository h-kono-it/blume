import type { NavNode, NavTab } from "../../core/types.ts";

/** A flat, ordered page reference used for previous/next pagination. */
export interface FlatPage {
  route: string;
  label: string;
  deprecated?: boolean;
}

/** A breadcrumb segment; `route` is absent for non-clickable group ancestors. */
export interface Crumb {
  label: string;
  route?: string;
}

/** Flatten the sidebar tree into ordered internal page links. */
export const flattenPages = (nodes: NavNode[]): FlatPage[] => {
  const out: FlatPage[] = [];
  const seen = new Set<string>();
  const add = (page: FlatPage): void => {
    if (seen.has(page.route)) {
      return;
    }
    seen.add(page.route);
    out.push(page);
  };
  const walk = (items: NavNode[]): void => {
    for (const item of items) {
      if (item.kind === "group") {
        if (item.route) {
          add({ label: item.label, route: item.route });
        }
        walk(item.children);
      } else if (item.pageId) {
        // Skip external links (no backing page).
        add(
          item.deprecated
            ? { deprecated: true, label: item.label, route: item.route }
            : { label: item.label, route: item.route }
        );
      }
    }
  };
  walk(nodes);
  return out;
};

/** Find the breadcrumb trail (group ancestors + page) for a route. */
export const findBreadcrumbs = (nodes: NavNode[], route: string): Crumb[] => {
  const search = (items: NavNode[], trail: Crumb[]): Crumb[] | null => {
    for (const item of items) {
      if (item.kind === "page") {
        if (item.route === route) {
          return [...trail, { label: item.label, route: item.route }];
        }
      } else {
        const crumb: Crumb = item.route
          ? { label: item.label, route: item.route }
          : { label: item.label };
        if (item.route === route) {
          return [...trail, crumb];
        }
        const found = search(item.children, [...trail, crumb]);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };
  return search(nodes, []) ?? [];
};

/** Whether `route` is the section root `base` or nested beneath it. */
const isUnderPath = (route: string, base: string): boolean =>
  route === base || route.startsWith(`${base}/`);

/**
 * The tab whose `path` is the longest prefix of `route`, mirroring the header's
 * active-tab highlight. The root tab (`/`) is skipped — it spans everything and
 * so never scopes the sidebar.
 */
const activeTab = (tabs: NavTab[], route: string): NavTab | null => {
  let match: NavTab | null = null;
  for (const tab of tabs) {
    if (tab.path === "/" || !isUnderPath(route, tab.path)) {
      continue;
    }
    if (!match || tab.path.length > match.path.length) {
      match = tab;
    }
  }
  return match;
};

/**
 * The children of the group whose path is `base`, searched at any depth — so a
 * content tree wrapped in a top-level container group still resolves to the
 * right section. Returns null when no group sits exactly at `base`.
 */
const sectionChildren = (nodes: NavNode[], base: string): NavNode[] | null => {
  for (const node of nodes) {
    if (node.kind !== "group") {
      continue;
    }
    if (node.path === base || node.route === base) {
      return node.children;
    }
    const deeper = sectionChildren(node.children, base);
    if (deeper) {
      return deeper;
    }
  }
  return null;
};

/**
 * Scope the sidebar to the active tab's section. With tabs configured, a route
 * under one tab shows only that tab's group — so a multi-section site (e.g.
 * Adapters / API / AI tabs) drills each tab into its own pages instead of one
 * global tree, the way Fumadocs' root folders do. Falls back to the full
 * sidebar when no tab matches (or the tab maps to no group), so a route is
 * never left with a blank sidebar.
 */
export const sidebarForRoute = (
  sidebar: NavNode[],
  tabs: NavTab[],
  route: string
): NavNode[] => {
  const tab = activeTab(tabs, route);
  if (!tab) {
    return sidebar;
  }
  return sectionChildren(sidebar, tab.path) ?? sidebar;
};

/** Resolve previous/next pages around the current route. */
export const getPagination = (
  flat: FlatPage[],
  route: string
): { prev: FlatPage | null; next: FlatPage | null } => {
  const index = flat.findIndex((page) => page.route === route);
  if (index === -1) {
    return { next: null, prev: null };
  }
  return {
    next: flat[index + 1] ?? null,
    prev: index > 0 ? (flat[index - 1] ?? null) : null,
  };
};
