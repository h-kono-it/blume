"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Audit money shot: a single frosted terminal card telling the whole 1.1 story
// in three beats — `blume audit` dumps a findings report (grouped by check,
// exactly the shape the real CLI prints), `blume audit --claude` hands the
// findings to Claude Code, and a rerun comes back green.

const SANS =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
const MONO = "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace";

const INK = "rgba(0,0,0,0.85)";
const MUTED = "rgba(0,0,0,0.55)";
const FAINT = "rgba(0,0,0,0.34)";
const ACCENT = "#009696";
const ERROR = "#d64545";
const WARNING = "#b45309";
const GREEN = "#1a9950";
const CHROME_BORDER = "rgba(90,100,120,0.14)";

const CARD_W = 960;
const CARD_H = 564;
const CHROME_H = 40;
const PAD_X = 26;
const PAD_TOP = 12;
const PAD_BOTTOM = 18;
const LINE_H = 23;
const VIEW_H = CARD_H - CHROME_H - PAD_TOP - PAD_BOTTOM;
// Real report columns: url.padEnd(34) before the dim source file.
const URL_COL_W = 296;

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CHARS_PER_FRAME = 2;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Severity = "error" | "warning";

interface TermLine {
  kind:
    | "cmd"
    | "blank"
    | "header"
    | "summary"
    | "category"
    | "finding"
    | "page"
    | "more"
    | "fix"
    | "hand"
    | "ok";
  text?: string;
  /** header: the dim `pages · dir` tail; finding: the dim page count. */
  meta?: string;
  /** page lines: the dim source file that fixes the page. */
  file?: string;
  severity?: Severity;
  /** Frames after the previous line finishes before this one lands. */
  delay: number;
  /** Extra hold after this line, before the next starts. */
  pause?: number;
}

// The script. Copy mirrors `formatReport` in packages/blume/src/audit/report.ts
// — real check titles, real fix strings, counts that add up (2 errors +
// 3 warnings = 5 findings handed off).
const LINES: TermLine[] = [
  { delay: 16, kind: "cmd", text: "blume audit" },
  { delay: 10, kind: "blank" },
  { delay: 0, kind: "header", meta: "124 pages · dist · offline" },
  {
    delay: 3,
    kind: "summary",
    text: "10,788 audits · 2 errors · 3 warnings · 0 notes",
  },
  { delay: 3, kind: "blank" },
  { delay: 2, kind: "category", text: "content" },
  {
    delay: 3,
    kind: "finding",
    meta: "1 page",
    severity: "error",
    text: "Title tag missing or empty",
  },
  {
    delay: 2,
    file: "docs/guides/webhooks.mdx",
    kind: "page",
    text: "/guides/webhooks",
  },
  {
    delay: 2,
    kind: "fix",
    text: "fix: Add a `title` to the page's frontmatter.",
  },
  {
    delay: 4,
    kind: "finding",
    meta: "3 pages",
    severity: "warning",
    text: "Meta description missing or empty",
  },
  { delay: 2, file: "docs/api/errors.mdx", kind: "page", text: "/api/errors" },
  {
    delay: 2,
    file: "docs/guides/rate-limits.mdx",
    kind: "page",
    text: "/guides/rate-limits",
  },
  { delay: 2, kind: "more", text: "… and 1 more (--verbose)" },
  {
    delay: 2,
    kind: "fix",
    text: "fix: Add a `description` to the page's frontmatter.",
  },
  { delay: 4, kind: "blank" },
  { delay: 0, kind: "category", text: "links" },
  {
    delay: 3,
    kind: "finding",
    meta: "1 page",
    severity: "error",
    text: "Page has links to a broken page",
  },
  {
    delay: 2,
    file: "docs/quickstart.mdx:41",
    kind: "page",
    text: "/quickstart",
  },
  {
    delay: 2,
    kind: "fix",
    // Hold here so the full report can be scanned before the next beat.
    pause: 48,
    text: "fix: Fix the link target, or create the page it points at.",
  },
  { delay: 8, kind: "blank" },
  { delay: 0, kind: "cmd", text: "blume audit --claude" },
  {
    delay: 14,
    kind: "hand",
    // The beat where Claude Code works, elided between prompts.
    pause: 36,
    text: "Handing 5 findings to Claude Code…",
  },
  { delay: 10, kind: "blank" },
  { delay: 0, kind: "cmd", text: "blume audit" },
  { delay: 10, kind: "blank" },
  { delay: 0, kind: "header", meta: "124 pages · dist · offline" },
  {
    delay: 3,
    kind: "summary",
    text: "10,788 audits · 0 errors · 0 warnings · 0 notes",
  },
  { delay: 3, kind: "blank" },
  { delay: 2, kind: "ok", text: "✔ No issues found." },
];

/** Frames a line spends arriving: cmd lines type, output lines just land. */
const arrival = (line: TermLine): number =>
  line.kind === "cmd"
    ? Math.ceil((line.text?.length ?? 0) / CHARS_PER_FRAME)
    : 0;

const computeStarts = (lines: TermLine[]): number[] => {
  const starts: number[] = [];
  let acc = 14;
  for (const line of lines) {
    acc += line.delay;
    starts.push(acc);
    acc += arrival(line) + (line.pause ?? 0);
  }
  return starts;
};

const STARTS = computeStarts(LINES);
const LAST = LINES.length - 1;
const TAIL_HOLD = 56;
export const AUDIT_TERMINAL_DURATION =
  STARTS[LAST] + arrival(LINES[LAST]) + TAIL_HOLD;

// Terminal scroll: once the content outgrows the viewport, each new line eases
// the buffer up just far enough to stay visible — monotonic by construction.
const scrollSteps = (): { start: number; delta: number }[] => {
  const steps: { start: number; delta: number }[] = [];
  let target = 0;
  for (const [i, start] of STARTS.entries()) {
    const bottom = (i + 1) * LINE_H;
    const next = Math.max(target, bottom - VIEW_H);
    if (next > target) {
      steps.push({ delta: next - target, start });
      target = next;
    }
  }
  return steps;
};

const SCROLL_STEPS = scrollSteps();

const SEVERITY_COLOR: Record<Severity, string> = {
  error: ERROR,
  warning: WARNING,
};
const GLYPH: Record<Severity, string> = { error: "✖", warning: "⚠" };

const TrafficLight = ({ color }: { color: string }) => (
  <span
    style={{
      background: color,
      borderRadius: 999,
      display: "inline-block",
      height: 11,
      width: 11,
    }}
  />
);

const LineBody = ({ line }: { line: TermLine }) => {
  switch (line.kind) {
    case "blank": {
      return null;
    }
    case "header": {
      return (
        <>
          <span style={{ color: INK, fontWeight: 600 }}>{"  blume audit"}</span>
          <span style={{ color: FAINT }}>{`  ${line.meta}`}</span>
        </>
      );
    }
    case "summary": {
      return <span style={{ color: MUTED }}>{`  ${line.text}`}</span>;
    }
    case "category": {
      return (
        <span style={{ color: INK, fontWeight: 600 }}>{`  ${line.text}`}</span>
      );
    }
    case "finding": {
      const color = SEVERITY_COLOR[line.severity ?? "error"];
      return (
        <>
          <span style={{ color }}>
            {`  ${GLYPH[line.severity ?? "error"]} ${line.text}`}
          </span>
          <span style={{ color: FAINT }}>{`  ${line.meta}`}</span>
        </>
      );
    }
    case "page": {
      return (
        <>
          <span
            style={{ color: MUTED, display: "inline-block", width: URL_COL_W }}
          >
            {`      ${line.text}`}
          </span>
          <span style={{ color: FAINT }}>{line.file}</span>
        </>
      );
    }
    case "more": {
      return <span style={{ color: FAINT }}>{`      ${line.text}`}</span>;
    }
    case "fix": {
      return <span style={{ color: ACCENT }}>{`      ${line.text}`}</span>;
    }
    case "hand": {
      return <span style={{ color: INK }}>{`  ${line.text}`}</span>;
    }
    case "ok": {
      return (
        <span style={{ color: GREEN, fontWeight: 600 }}>
          {`  ${line.text}`}
        </span>
      );
    }
    default: {
      return null;
    }
  }
};

export const AuditTerminal = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardOpacity = interpolate(frame, [0, 14], [0, 1], clamp);
  const cardScale = interpolate(frame, [0, 20], [0.985, 1], {
    ...clamp,
    easing: EASE,
  });
  const cardY = interpolate(frame, [0, 20], [18, 0], {
    ...clamp,
    easing: EASE,
  });

  const scroll = SCROLL_STEPS.reduce(
    (acc, step) =>
      acc +
      interpolate(frame, [step.start, step.start + 12], [0, step.delta], {
        ...clamp,
        easing: EASE,
      }),
    0
  );

  const cursorOn = Math.floor((frame / fps) * 2) % 2 === 0;
  let activeIndex = -1;
  for (const [i, start] of STARTS.entries()) {
    if (frame >= start) {
      activeIndex = i;
    }
  }

  const cardStyle = {
    // oxlint-disable-next-line react-doctor/no-large-animated-blur -- intentional video visual — frosted-glass blur radius tuned for launch render
    WebkitBackdropFilter: "blur(16px)",
    // oxlint-disable-next-line react-doctor/no-large-animated-blur -- intentional video visual — frosted-glass blur radius tuned for launch render
    backdropFilter: "blur(16px)",
    background: "rgba(255,255,255,0.82)",
    border: "1px solid rgba(255,255,255,0.85)",
    borderRadius: 14,
    boxShadow:
      "0 30px 70px rgba(30,40,60,0.24), inset 0 1px 0 rgba(255,255,255,0.8)",
    height: CARD_H,
    opacity: cardOpacity,
    overflow: "hidden",
    transform: `translateY(${cardY}px) scale(${cardScale})`,
    width: CARD_W,
  } as const;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={cardStyle}>
        {/* terminal chrome */}
        <div
          style={{
            alignItems: "center",
            borderBottom: `1px solid ${CHROME_BORDER}`,
            display: "flex",
            gap: 8,
            height: CHROME_H,
            padding: "0 16px",
            position: "relative",
          }}
        >
          <TrafficLight color="#ff5f57" />
          <TrafficLight color="#febc2e" />
          <TrafficLight color="#28c840" />
          <div
            style={{
              color: MUTED,
              fontFamily: MONO,
              fontSize: 13,
              left: 0,
              position: "absolute",
              right: 0,
              textAlign: "center",
            }}
          >
            ~/acme
          </div>
          <div
            style={{
              color: INK,
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: 600,
              marginLeft: "auto",
            }}
          >
            Terminal
          </div>
        </div>

        {/* scrolling buffer */}
        <div
          style={{
            height: VIEW_H,
            marginTop: PAD_TOP,
            overflow: "hidden",
            padding: `0 ${PAD_X}px`,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 14.5,
              lineHeight: `${LINE_H}px`,
              transform: `translateY(${-scroll}px)`,
            }}
          >
            {LINES.map((line, i) => {
              if (frame < STARTS[i]) {
                return null;
              }
              const local = frame - STARTS[i];
              const landed = interpolate(local, [0, 4], [0, 1], clamp);

              if (line.kind === "cmd") {
                const revealed = Math.min(
                  line.text?.length ?? 0,
                  Math.floor(local * CHARS_PER_FRAME)
                );
                const typing = revealed < (line.text?.length ?? 0);
                const showCursor = i === activeIndex && typing && cursorOn;
                return (
                  <div
                    key={`${line.kind}-${i}`}
                    style={{
                      alignItems: "center",
                      display: "flex",
                      height: LINE_H,
                      whiteSpace: "pre",
                    }}
                  >
                    <span style={{ color: ACCENT, marginRight: 8 }}>$</span>
                    <span style={{ color: INK }}>
                      {line.text?.slice(0, revealed)}
                    </span>
                    {showCursor && (
                      <span
                        style={{
                          background: INK,
                          display: "inline-block",
                          height: 15,
                          marginLeft: 2,
                          transform: "translateY(2px)",
                          width: 8,
                        }}
                      />
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={`${line.kind}-${i}`}
                  style={{ height: LINE_H, opacity: landed, whiteSpace: "pre" }}
                >
                  <LineBody line={line} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
