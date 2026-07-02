import { describe, expect, it } from "bun:test";

import { parsePort } from "../src/cli/args.ts";

describe("parsePort", () => {
  it("returns undefined when no port is given", () => {
    expect(parsePort()).toBeUndefined();
  });

  it("parses a valid integer port", () => {
    expect(parsePort("3000")).toBe(3000);
    expect(parsePort("1")).toBe(1);
    expect(parsePort("65535")).toBe(65_535);
  });
});
