import { describe, expect, it } from "bun:test";

import { trimChar, trimEnd, trimStart } from "../src/core/trim.ts";

// These replace `/^\/+/`, `/\/+$/` and friends, which are quadratic on a long
// run of the trimmed character and reachable from configured routes/URLs.
describe("trim helpers", () => {
  it("drops leading occurrences only", () => {
    expect(trimStart("///a/b/", "/")).toBe("a/b/");
    expect(trimStart("a/b", "/")).toBe("a/b");
    expect(trimStart("", "/")).toBe("");
    expect(trimStart("///", "/")).toBe("");
  });

  it("drops trailing occurrences only", () => {
    expect(trimEnd("/a/b///", "/")).toBe("/a/b");
    expect(trimEnd("a/b", "/")).toBe("a/b");
    expect(trimEnd("", "/")).toBe("");
    expect(trimEnd("///", "/")).toBe("");
  });

  it("drops both edges", () => {
    expect(trimChar("///a/b///", "/")).toBe("a/b");
    expect(trimChar("---slug---", "-")).toBe("slug");
    expect(trimChar("slug", "-")).toBe("slug");
    expect(trimChar("///", "/")).toBe("");
  });

  it("leaves inner runs intact", () => {
    expect(trimChar("/a//b/", "/")).toBe("a//b");
  });

  it("stays linear on a long run of the trimmed character", () => {
    const long = `${"/".repeat(100_000)}a${"/".repeat(100_000)}`;
    const started = performance.now();
    expect(trimChar(long, "/")).toBe("a");
    expect(performance.now() - started).toBeLessThan(1000);
  });
});
