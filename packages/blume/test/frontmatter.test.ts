import { describe, expect, it } from "bun:test";

import baseMatter from "gray-matter";
import yaml from "js-yaml";

import matter from "../src/core/frontmatter.ts";

const doc = "---\ntitle: Home\ncount: 2\n---\nbody text";

// `safeLoad` was removed from js-yaml 4's types, but the runtime still ships a
// stub that throws — that is exactly what crashes gray-matter's default engine.
const removedSafeLoad = (
  yaml as unknown as { safeLoad: (input: string) => object }
).safeLoad;

describe("frontmatter wrapper", () => {
  it("parses front matter into data and content", () => {
    const parsed = matter(doc);

    expect(parsed.data).toEqual({ count: 2, title: "Home" });
    expect(parsed.content).toBe("body text");
  });

  it("round-trips through stringify", () => {
    const out = matter.stringify("body text", { count: 2, title: "Home" });
    const back = matter(out);

    expect(back.data).toEqual({ count: 2, title: "Home" });
    expect(back.content.trim()).toBe("body text");
  });

  it("treats empty front matter as an empty object", () => {
    expect(matter("---\n---\nbody").data).toEqual({});
  });

  it("avoids the js-yaml 4 `safeLoad` removal that crashes gray-matter's default engine", () => {
    // gray-matter@4's default YAML engine is `yaml.safeLoad`, which was removed
    // in js-yaml 4 and now throws. Wiring that engine in explicitly reproduces
    // the reported `blume dev` crash in a workspace pinned to js-yaml 4...
    expect(typeof removedSafeLoad).toBe("function");
    expect(() =>
      baseMatter(doc, { engines: { yaml: { parse: removedSafeLoad } } })
    ).toThrow(/safeLoad is removed/u);

    // ...while the wrapper supplies `load`/`dump`, which exist in js-yaml 3 and 4.
    expect(matter(doc).data).toEqual({ count: 2, title: "Home" });
  });
});
