import { afterAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";

import { dirname, join } from "pathe";

import { discoverContent } from "../src/core/content.ts";
import { buildContentGraph } from "../src/core/graph.ts";
import { EN_UI, resolveUIStrings } from "../src/core/i18n-ui.ts";
import {
  detectLocale,
  i18nDiagnostics,
  i18nEnabled,
  localePrefix,
  localizeRoute,
  resolveFallbackLocale,
} from "../src/core/i18n.ts";
import { buildManifest } from "../src/core/manifest.ts";
import { blumeConfigSchema } from "../src/core/schema.ts";
import type {
  FolderMeta,
  ResolvedConfig,
  ResolvedI18nConfig,
} from "../src/core/schema.ts";
import type { NavNode, ProjectContext } from "../src/core/types.ts";
import { UI_PACKS } from "../src/core/ui-packs/index.ts";

const config = (i18nOver: Record<string, unknown> = {}): ResolvedConfig =>
  blumeConfigSchema.parse({
    i18n: {
      defaultLocale: "en",
      locales: [
        { code: "en", label: "English" },
        { code: "fr", label: "Français" },
      ],
      ...i18nOver,
    },
  });

const i18nOf = (over: Record<string, unknown> = {}): ResolvedI18nConfig => {
  const value = config(over).i18n;
  if (!value) {
    throw new Error("expected i18n");
  }
  return value;
};

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const FILES: Record<string, string> = {
  "docs/fr/guides/quickstart.mdx": "---\ntitle: Démarrage\n---\n# Démarrage\n",
  "docs/fr/index.mdx": "---\ntitle: Accueil\n---\n# Accueil\n",
  "docs/guides/only-en.mdx": "---\ntitle: Only EN\n---\n# Only EN\n",
  "docs/guides/quickstart.mdx": "---\ntitle: Quickstart\n---\n# Quickstart\n",
  "docs/index.mdx": "---\ntitle: Home\n---\n# Home\n",
};

const buildProject = async (resolved: ResolvedConfig) => {
  const root = await mkdtemp(join(tmpdir(), "blume-i18n-"));
  dirs.push(root);
  const contentRoot = join(root, "docs");
  await Promise.all(
    Object.entries(FILES).map(async ([rel, content]) => {
      const abs = join(root, rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content);
    })
  );

  const { pages } = await discoverContent({
    contentRoot,
    defaultType: resolved.content.defaultType,
    exclude: resolved.content.exclude,
    i18n: resolved.i18n,
    include: resolved.content.include,
  });
  const graph = buildContentGraph(pages, {
    folderMeta: new Map<string, FolderMeta>(),
    i18n: resolved.i18n,
    navigation: resolved.navigation,
  });
  const context = { contentRoot, root } as ProjectContext;
  const manifest = buildManifest({ config: resolved, context, graph });
  return { graph, manifest, pages };
};

const labelsOf = (nodes: NavNode[]): string[] =>
  nodes.map((node) => node.label);

describe("i18n helpers", () => {
  it("detects a leading non-default locale dir and strips it", () => {
    const i18n = i18nOf();
    expect(detectLocale(["fr", "guides", "x.mdx"], i18n)).toEqual({
      locale: "fr",
      rest: ["guides", "x.mdx"],
    });
    expect(detectLocale(["guides", "x.mdx"], i18n)).toEqual({
      locale: "en",
      rest: ["guides", "x.mdx"],
    });
  });

  it("hides the default-locale prefix unless opted out", () => {
    expect(localePrefix("en", i18nOf())).toBe("");
    expect(localePrefix("fr", i18nOf())).toBe("/fr");
    expect(localePrefix("en", i18nOf({ hideDefaultLocalePrefix: false }))).toBe(
      "/en"
    );
  });

  it("localizes routes, mapping the home route correctly", () => {
    const i18n = i18nOf();
    expect(localizeRoute("/guides/x", "fr", i18n)).toBe("/fr/guides/x");
    expect(localizeRoute("/", "fr", i18n)).toBe("/fr");
    expect(localizeRoute("/guides/x", "en", i18n)).toBe("/guides/x");
  });

  it("resolves the fallback locale (default, explicit, disabled)", () => {
    expect(resolveFallbackLocale(i18nOf())).toBe("en");
    expect(resolveFallbackLocale(i18nOf({ fallbackLocale: "fr" }))).toBe("fr");
    expect(resolveFallbackLocale(i18nOf({ fallbackLocale: null }))).toBeNull();
  });

  it("reports whether i18n is enabled", () => {
    expect(i18nEnabled(config())).toBe(true);
    expect(i18nEnabled(blumeConfigSchema.parse({}))).toBe(false);
  });
});

describe("i18n content discovery", () => {
  it("records locale, prefixed route, translationKey and navPath", async () => {
    const { pages } = await buildProject(config());
    const byId = new Map(pages.map((page) => [page.id, page]));

    const en = byId.get("guides/quickstart.mdx");
    expect(en?.locale).toBe("en");
    expect(en?.route).toBe("/guides/quickstart");
    expect(en?.translationKey).toBe("/guides/quickstart");
    expect(en?.navPath).toBe("guides/quickstart.mdx");

    const fr = byId.get("fr/guides/quickstart.mdx");
    expect(fr?.locale).toBe("fr");
    expect(fr?.route).toBe("/fr/guides/quickstart");
    expect(fr?.translationKey).toBe("/guides/quickstart");
    expect(fr?.navPath).toBe("guides/quickstart.mdx");

    const frHome = byId.get("fr/index.mdx");
    expect(frHome?.route).toBe("/fr");
    expect(frHome?.translationKey).toBe("/");
  });
});

describe("per-locale navigation", () => {
  it("builds a tree per locale without surfacing the locale dir as a group", async () => {
    const { graph } = await buildProject(config());
    expect(Object.keys(graph.navigationByLocale).toSorted()).toEqual([
      "en",
      "fr",
    ]);

    const fr = graph.navigationByLocale.fr?.sidebar ?? [];
    // The locale dir ("fr") must not appear as a top-level nav group.
    expect(labelsOf(fr)).not.toContain("Fr");
    expect(labelsOf(fr)).toContain("Guides");
  });

  it("localizes header tab paths per locale", async () => {
    const resolved = blumeConfigSchema.parse({
      i18n: {
        defaultLocale: "en",
        locales: [
          { code: "en", label: "English" },
          { code: "fr", label: "Français" },
        ],
      },
      navigation: {
        tabs: [
          { label: "Docs", path: "/docs" },
          { label: "Home", path: "/" },
        ],
      },
    });
    const { graph } = await buildProject(resolved);

    expect(
      (graph.navigationByLocale.fr?.tabs ?? []).map((tab) => tab.path)
    ).toEqual(["/fr/docs", "/fr"]);
    // The hidden default locale keeps unprefixed tab paths.
    expect(
      (graph.navigationByLocale.en?.tabs ?? []).map((tab) => tab.path)
    ).toEqual(["/docs", "/"]);
  });
});

describe("i18n diagnostics", () => {
  it("warns about a locale-looking folder that isn't configured", async () => {
    // Project locales are en + fr; the `de/` folder below is not configured.
    const resolved = config();
    const root = await mkdtemp(join(tmpdir(), "blume-i18n-diag-"));
    dirs.push(root);
    const contentRoot = join(root, "docs");
    await mkdir(join(contentRoot, "de"), { recursive: true });
    await writeFile(join(contentRoot, "index.mdx"), "# Home\n");
    await writeFile(join(contentRoot, "de", "page.mdx"), "# DE\n");

    const { pages } = await discoverContent({
      contentRoot,
      defaultType: resolved.content.defaultType,
      exclude: resolved.content.exclude,
      i18n: resolved.i18n,
      include: resolved.content.include,
    });
    const diagnostics = i18nDiagnostics(pages, i18nOf());
    expect(diagnostics.map((d) => d.code)).toContain(
      "BLUME_I18N_UNCONFIGURED_LOCALE"
    );
    expect(diagnostics.some((d) => d.message.includes('"de"'))).toBe(true);
  });

  it("stays quiet when every locale folder is configured", async () => {
    const { pages } = await buildProject(config());
    // FILES ships an `fr/` folder, and `fr` is a configured locale.
    expect(i18nDiagnostics(pages, i18nOf())).toEqual([]);
  });
});

describe("manifest alternates and fallback", () => {
  it("links translations and materializes a fallback for missing ones", async () => {
    const { manifest } = await buildProject(config());
    const byPath = new Map(manifest.routes.map((route) => [route.path, route]));

    const en = byPath.get("/guides/quickstart");
    expect(en?.alternates.map((alt) => alt.locale).toSorted()).toEqual([
      "en",
      "fr",
    ]);

    // `only-en` has no French translation, so a fallback route is rendered at
    // the localized URL, pointing at the English entry, not indexed.
    const fallback = byPath.get("/fr/guides/only-en");
    expect(fallback?.fallback).toBe(true);
    expect(fallback?.locale).toBe("fr");
    expect(fallback?.id).toBe("guides/only-en.mdx");
    expect(fallback?.indexable).toBe(false);
  });

  it("emits no fallback routes when fallback is disabled", async () => {
    const { manifest } = await buildProject(config({ fallbackLocale: null }));
    expect(manifest.routes.some((route) => route.fallback)).toBe(false);
    expect(
      manifest.routes.some((route) => route.path === "/fr/guides/only-en")
    ).toBe(false);
  });
});

describe("UI dictionaries", () => {
  it("uses the English baseline for the default locale", () => {
    const dict = resolveUIStrings("en", { defaultLocale: "en" });
    expect(dict.search.button).toBe(EN_UI.search.button);
    expect(dict.page.previous).toBe("Previous");
  });

  it("applies a shipped pack for a translated locale", () => {
    const dict = resolveUIStrings("fr", { defaultLocale: "en" });
    expect(dict.search.button).toBe("Rechercher");
    expect(dict.page.next).toBe("Suivant");
  });

  it("lets user overrides win over the pack", () => {
    const dict = resolveUIStrings("fr", {
      defaultLocale: "en",
      overrides: { fr: { search: { button: "Chercher" } } },
    });
    expect(dict.search.button).toBe("Chercher");
    // Untranslated keys still fall back to the pack, then English.
    expect(dict.page.next).toBe("Suivant");
  });

  it("ships packs for a broad set of locales", () => {
    // A representative spread across scripts/regions; not the whole list.
    const sample = ["de", "es", "ja", "zh", "zh-TW", "ar", "ru", "pt-BR"];
    for (const code of sample) {
      expect(UI_PACKS[code]).toBeDefined();
    }
    expect(Object.keys(UI_PACKS).length).toBeGreaterThan(20);
  });

  it("resolves a non-French shipped pack", () => {
    const de = resolveUIStrings("de", { defaultLocale: "en" });
    expect(de.search.button).toBe("Suchen");
    expect(de.page.previous).toBe("Zurück");

    const ja = resolveUIStrings("ja", { defaultLocale: "en" });
    expect(ja.toc.title).toBe("このページの内容");
    // Brand names stay verbatim inside translated strings.
    expect(ja.actions.edit).toContain("GitHub");
  });

  it("resolves a regional variant pack by its BCP 47 code", () => {
    const dict = resolveUIStrings("zh-TW", { defaultLocale: "en" });
    expect(dict.search.button).toBe("搜尋");
  });

  it("falls back to English for a locale with no shipped pack", () => {
    const dict = resolveUIStrings("xx", { defaultLocale: "en" });
    expect(dict.search.button).toBe(EN_UI.search.button);
    expect(dict.page.next).toBe("Next");
  });

  it("resolves a region variant to its base-language pack", () => {
    // No fr-CA pack ships, so it should use the French pack, not English.
    const dict = resolveUIStrings("fr-CA", { defaultLocale: "en" });
    expect(dict.search.button).toBe("Rechercher");
  });

  it("matches a pack code case-insensitively", () => {
    // `pt-br` should still find the `pt-BR` pack.
    const dict = resolveUIStrings("pt-br", { defaultLocale: "en" });
    expect(dict.page.next).toBe(
      resolveUIStrings("pt-BR", { defaultLocale: "en" }).page.next
    );
  });

  it("every shipped pack uses only known UI keys", () => {
    const baseline = EN_UI as Record<string, Record<string, string>>;
    const violations: string[] = [];
    for (const [code, pack] of Object.entries(UI_PACKS)) {
      for (const [group, values] of Object.entries(pack)) {
        const known = baseline[group];
        if (!known) {
          violations.push(`${code}: unknown group "${group}"`);
          continue;
        }
        for (const key of Object.keys(values)) {
          if (!(key in known)) {
            violations.push(`${code}.${group}: unknown key "${key}"`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
