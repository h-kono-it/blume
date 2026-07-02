import { describe, expect, it } from "bun:test";

import {
  parseYouTubeId,
  youtubeEmbedUrl,
} from "../src/components/content/youtube.ts";

describe("parseYouTubeId", () => {
  it("accepts a bare 11-character id", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("trims surrounding whitespace", () => {
    expect(parseYouTubeId("  dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from every common URL form", () => {
    const cases = [
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://www.youtube.com/watch?list=RD&v=dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ",
    ];
    for (const url of cases) {
      expect(parseYouTubeId(url)).toBe("dQw4w9WgXcQ");
    }
  });

  it("returns null for empty or whitespace-only input", () => {
    expect(parseYouTubeId("")).toBeNull();
    expect(parseYouTubeId("   ")).toBeNull();
  });

  it("returns null when nothing looks like an id", () => {
    expect(parseYouTubeId("https://example.com/not-a-video")).toBeNull();
    expect(parseYouTubeId("too-short")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("builds a privacy-enhanced embed URL", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    );
  });

  it("appends a floored start time when positive", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ", { start: 30.9 })).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=30"
    );
  });

  it("omits the start param when zero or negative", () => {
    const base = "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ";
    expect(youtubeEmbedUrl("dQw4w9WgXcQ", { start: 0 })).toBe(base);
    expect(youtubeEmbedUrl("dQw4w9WgXcQ", { start: -5 })).toBe(base);
  });
});
