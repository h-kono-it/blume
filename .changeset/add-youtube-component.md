---
"blume": minor
---

Add a `<YouTube />` content component for embedding YouTube videos. It renders a responsive, privacy-enhanced (`youtube-nocookie.com`) 16:9 iframe with `loading="lazy"` and ships no client JavaScript. Pass a video `id` or a full `url` (any of the `youtu.be`, `watch?v=`, `/embed/`, `/shorts/`, `/live/` forms), plus an optional `title` and a `start` time in seconds. Available in `.mdx` pages, in `<BlumePage>` embeds, and via `blume add youtube`.
