import { afterAll, describe, expect, it } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

import { dirname, join } from "pathe";

import { changelogComponentSerializers } from "../src/ai/changelog-components.ts";
import { buildChangelogIndexMarkdown } from "../src/ai/changelog-markdown.ts";
import { downlevelComponents } from "../src/ai/component-markdown.ts";
import {
  compareChangelogDates,
  groupChangelogYears,
  parseChangelogDate,
  uniqueAnchorIds,
} from "../src/core/changelog-list.ts";
import type { BlumeProject } from "../src/core/project-graph.ts";
import { scanProject } from "../src/core/project-graph.ts";

/**
 * `<Changelog />` — the release list the generated `/changelog` page renders,
 * and the one an authored page places to put prose above it. What matters is
 * that the two routes to an index agree: the same releases, in the same order,
 * on the rendered page and on every agent surface.
 */

const dirs: string[] = [];

afterAll(async () => {
  await Promise.all(
    dirs.map((dir) => rm(dir, { force: true, recursive: true }))
  );
});

const scanFixture = async (
  files: Record<string, string>
): Promise<BlumeProject> => {
  const root = await mkdtemp(join(tmpdir(), "blume-changelog-component-"));
  dirs.push(root);
  await Promise.all(
    Object.entries(files).map(async ([rel, content]) => {
      const abs = join(root, rel);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, content);
    })
  );
  return await scanProject(root);
};

const release = (title: string, date: string, category?: string): string =>
  `---\ntitle: ${title}\ntype: changelog\ndate: ${date}\n${
    category ? `changelog:\n  category: ${category}\n` : ""
  }---\n\nBody.\n`;

const componentSource = async (): Promise<string> =>
  await readFile(
    fileURLToPath(
      new URL("../src/components/content/Changelog.astro", import.meta.url)
    ),
    "utf-8"
  );

describe("changelog list policy", () => {
  it("sorts newest first and leaves undated entries last", () => {
    const dates = [
      parseChangelogDate("2026-01-15"),
      null,
      parseChangelogDate("2026-07-01"),
    ];
    expect(
      [...dates]
        .toSorted(compareChangelogDates)
        .map((date) => date?.toISOString().slice(0, 10) ?? "undated")
    ).toEqual(["2026-07-01", "2026-01-15", "undated"]);
  });

  it("reads a Date as well as a string, and refuses a malformed one", () => {
    expect(parseChangelogDate(new Date("2026-03-04"))?.getUTCFullYear()).toBe(
      2026
    );
    expect(parseChangelogDate("2026-03-04")?.getUTCFullYear()).toBe(2026);
    // A malformed date costs the row its stamp, never the build.
    expect(parseChangelogDate("not a date")).toBeNull();
    expect(parseChangelogDate(null)).toBeNull();
  });

  it("groups consecutive rows of the same year, undated in their own group", () => {
    const rows = [
      { year: "2026" },
      { year: "2026" },
      { year: "2025" },
      { year: null },
    ];
    expect(
      groupChangelogYears(rows, (row) => row.year).map((group) => [
        group.year,
        group.items.length,
      ])
    ).toEqual([
      ["2026", 2],
      ["2025", 1],
      [null, 1],
    ]);
  });

  it("suffixes repeated anchors so every row keeps its own", () => {
    expect(uniqueAnchorIds(["v1", "v2"])).toEqual(["v1", "v2"]);
    expect(uniqueAnchorIds(["update", "update", "update"])).toEqual([
      "update",
      "update-2",
      "update-3",
    ]);
    // A generated suffix never collides with a later natural slug.
    expect(uniqueAnchorIds(["v1", "v1", "v1-2"])).toEqual([
      "v1",
      "v1-2",
      "v1-2-2",
    ]);
  });
});

describe("Changelog component", () => {
  it("folds in the staged collection from the route manifest, not a generator flag", async () => {
    const source = await componentSource();
    // The gap this closes: a hand-written index reads `docs` only and silently
    // drops GitHub Releases entries. The component asks the manifest instead,
    // so it is right wherever it is placed — including an authored page, which
    // no generator flag reaches.
    expect(source).toContain('route.collection === "staged"');
    expect(source).toContain('await getCollection("docs")');
    expect(source).toContain('getCollection("staged" as "docs")');
  });

  it("lists the default locale's entries whatever locale it sits in", async () => {
    const source = await componentSource();
    // One rule, stated once: every surface that publishes this list is default
    // locale only, so a translated page listing its own locale's entries would
    // be the one surface disagreeing about which releases exist.
    expect(source).toContain(
      "const locale = i18n ? i18n.defaultLocale : null;"
    );
    expect(source).not.toContain("Astro.currentLocale ?? i18n.defaultLocale");
    // The chrome around it still follows the reader.
    expect(source).toContain("contentStrings(data, Astro.currentLocale)");
  });

  it("keeps the list's markup, not the page's heading or description", async () => {
    const source = await componentSource();
    expect(source).toContain("{group.year}");
    expect(source).toContain("datetime={item.dateTime}");
    expect(source).toContain("{strings.empty}");
    // The heading and the description belong to whoever owns the page: the
    // generated page keeps its translatable pair, an authored page writes its
    // own prose.
    expect(source).not.toContain("<h1>");
    expect(source).not.toContain("changelogDescription");
  });
});

describe("Changelog serializer", () => {
  it("downlevels the tag to the release list agents would otherwise miss", async () => {
    const project = await scanFixture({
      "blume.config.ts": 'export default { title: "Acme" };',
      "docs/changelog/v1.md": release("v1.0.0", "2026-01-15"),
      "docs/changelog/v2.md": release("v2.0.0", "2026-07-01", "Features"),
      "docs/index.md": "---\ntitle: Home\n---\n\nHome.\n",
    });
    const markdown = downlevelComponents(
      "Prose above the list.\n\n<Changelog />\n",
      changelogComponentSerializers(project)
    );
    expect(markdown).toContain("Prose above the list.");
    // Without a serializer the tag would reach `/changelog.md`, llms-full.txt
    // and MCP `get_page` verbatim, and an agent would read no releases at all.
    expect(markdown).not.toContain("<Changelog />");
    expect(markdown).toContain("## 2026");
    expect(markdown).toContain("[v2.0.0](/changelog/v2)");
    expect(markdown).toContain("[v1.0.0](/changelog/v1)");
    expect(markdown).toContain("Features");
  });

  it("publishes the same list the generated page's mirror does", async () => {
    const project = await scanFixture({
      "blume.config.ts": 'export default { title: "Acme" };',
      "docs/changelog/v1.md": release("v1.0.0", "2026-01-15"),
      "docs/index.md": "---\ntitle: Home\n---\n\nHome.\n",
    });
    const authored = downlevelComponents(
      "<Changelog />\n",
      changelogComponentSerializers(project)
    ).trim();
    const generated = buildChangelogIndexMarkdown(project);
    // The authored page brings its own heading, so the mirror of the generated
    // page is that same list under the translatable title and description.
    expect(generated).toContain(authored);
    expect(generated).toContain("# Changelog");
    expect(authored).not.toContain("# Changelog");
  });

  it("declines on a site with no releases rather than emitting a bare heading", async () => {
    const project = await scanFixture({
      "blume.config.ts": 'export default { title: "Acme" };',
      "docs/index.md": "---\ntitle: Home\n---\n\nHome.\n",
    });
    // Declining leaves the page's own prose as all an agent reads, which is
    // accurate — an empty "## Undated" would not be. The serializer reads the
    // project, not the usage, so it takes no context.
    expect(changelogComponentSerializers(project).Changelog()).toBeNull();
  });
});
