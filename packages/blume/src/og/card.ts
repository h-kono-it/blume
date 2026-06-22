import { Renderer } from "@takumi-rs/core";
import { container, text } from "@takumi-rs/helpers";

// Reuse one renderer (and its loaded default fonts) across all images.
let renderer: Renderer | null = null;
const getRenderer = (): Renderer => {
  renderer ??= new Renderer();
  return renderer;
};

const ACCENT_HEX: Record<string, string> = {
  blue: "#3b82f6",
  green: "#22c55e",
  orange: "#f97316",
  pink: "#ec4899",
  purple: "#8b5cf6",
  red: "#ef4444",
  teal: "#14b8a6",
};

// OG rendering uses hex (Takumi's color parser does not accept oklch); named
// presets map to hex, raw hex passes through, anything else falls back.
const resolveAccent = (accent: string): string =>
  ACCENT_HEX[accent] ?? (accent.startsWith("#") ? accent : "#3b82f6");

export interface OgCardOptions {
  title: string;
  eyebrow?: string;
  accent?: string;
}

const WIDTH = 1200;
const HEIGHT = 630;

/** Render a 1200x630 Open Graph card to a PNG buffer. */
export const renderOgImage = (options: OgCardOptions): Promise<Buffer> => {
  const accent = resolveAccent(options.accent ?? "blue");

  const node = container({
    children: [
      container({
        children: [
          container({
            style: {
              backgroundColor: accent,
              borderRadius: 6,
              height: 32,
              width: 32,
            },
          }),
          options.eyebrow
            ? text(options.eyebrow, {
                color: "#94a3b8",
                fontSize: 30,
              })
            : container({}),
        ],
        style: { alignItems: "center", display: "flex", gap: 16 },
      }),
      text(options.title, {
        color: "#f8fafc",
        fontSize: 76,
        fontWeight: 700,
        lineHeight: 1.1,
      }),
      container({
        style: {
          backgroundColor: accent,
          borderRadius: 4,
          height: 8,
          width: 120,
        },
      }),
    ],
    style: {
      backgroundColor: "#0b1020",
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      height: HEIGHT,
      justifyContent: "space-between",
      padding: 80,
      width: WIDTH,
    },
  });

  return getRenderer().render(node, {
    format: "png",
    height: HEIGHT,
    width: WIDTH,
  });
};
