/**
 * Helpers for the `<YouTube>` content component. Kept in a sibling `.ts` (like
 * `diff.ts`/`github-info.ts`) so the id parsing and embed-URL building are pure,
 * unit-testable functions — the `.astro` file stays a thin presentational shell.
 */

// A YouTube video id is 11 characters of [A-Za-z0-9_-].
const BARE_ID = /^[\w-]{11}$/u;

// Pull the id out of any common YouTube URL: youtu.be/<id>, watch?v=<id>,
// /embed/<id>, /shorts/<id>, /live/<id>.
const URL_ID =
  /(?:youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|[?&]v=)(?<id>[\w-]{11})/u;

/**
 * Resolve a YouTube video id from either a bare id or a full URL. Returns `null`
 * when nothing that looks like an id can be found, so the component can render
 * nothing rather than a broken embed.
 */
export const parseYouTubeId = (input: string): string | null => {
  const value = input.trim();
  if (!value) {
    return null;
  }
  if (BARE_ID.test(value)) {
    return value;
  }
  return URL_ID.exec(value)?.groups?.id ?? null;
};

/**
 * Build a privacy-enhanced (`youtube-nocookie.com`) embed URL, optionally
 * starting at `start` seconds.
 */
export const youtubeEmbedUrl = (
  id: string,
  options: { start?: number } = {}
): string => {
  const base = `https://www.youtube-nocookie.com/embed/${id}`;
  const { start } = options;
  if (start && start > 0) {
    const params = new URLSearchParams({ start: String(Math.floor(start)) });
    return `${base}?${params.toString()}`;
  }
  return base;
};
