---
"blume": patch
---

Keep the docs sidebar scrolled to the current page across navigations. Each page load previously reset the sidebar's own scroll container to the top, so on long sidebars the viewport visibly jumped away from the link you just clicked. A pre-paint inline script now centers the active link when it would otherwise be out of view — this also fixes deep links landing with the current page's link below the fold. Short sidebars, and pages whose active link is already visible, are untouched.
