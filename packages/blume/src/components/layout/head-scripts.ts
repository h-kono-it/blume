/**
 * Pre-paint inline scripts shared by the document layouts (`RootLayout`,
 * `PageLayout`, `ReferenceLayout`). They run synchronously — in `<head>`, or
 * immediately after the markup they act on — before that content paints, so the
 * page never flashes the wrong theme, a since-dismissed banner, or a sidebar
 * scrolled away from the current page. Kept in one place so the layouts can't
 * drift on this timing-critical logic.
 *
 * All are constants, never built by interpolating config into source text: any
 * values they need ride in as `data-*` attributes on the script tag and are read
 * back through `document.currentScript`. Baking a config string into JS — even
 * via `JSON.stringify` — is code construction, and JSON escaping does not cover
 * a script context (`</script>`, U+2028/U+2029 all survive it). Attributes are
 * HTML-escaped by Astro, so the value can never be parsed as code.
 */

/**
 * Set `data-theme` from the stored preference (or the configured default, or the
 * OS setting for `"system"`) before the body paints, avoiding a theme flash.
 *
 * Reads `data-mode` — `"system" | "light" | "dark"`.
 */
export const THEME_INIT_SCRIPT = `(()=>{const m=document.currentScript?.dataset.mode??"system";const s=localStorage.getItem("blume-theme");const sys=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=s??(m==="system"?sys:m);})();`;

/**
 * Hide a previously-dismissed banner before it can flash in.
 *
 * Reads `data-key` — the banner's dismissal key.
 */
export const BANNER_INIT_SCRIPT = `(()=>{const k=document.currentScript?.dataset.key;if(k&&localStorage.getItem("blume-banner:"+k))document.documentElement.setAttribute("data-blume-banner-hidden","");})();`;

/**
 * Center the current page's sidebar link before the sidebar paints. Every
 * navigation is a full page load, and the sidebar is its own scroll container,
 * so without this it is reborn scrolled to the top on every click — on a long
 * sidebar the viewport visibly jumps away from the link you just clicked.
 *
 * Runs inline immediately after the sidebar `<aside>` (not in `<head>`: it
 * needs that markup parsed). The lookup is scoped to the page tree
 * (`data-blume-nav-tree`) because the drawer also holds the mobile tabs list,
 * whose active tab is `aria-current` too. `getClientRects()` skips links that
 * aren't rendered — `hidden` drill-in panels and breakpoint-hidden duplicates —
 * and the script no-ops when the active link is already inside the visible
 * scroll area, so a short sidebar never moves.
 */
export const SIDEBAR_SCROLL_INIT_SCRIPT = `(()=>{const n=document.querySelector("[data-blume-nav-drawer]");const s=n&&(n.querySelector("[data-blume-nav-tree]")||n);if(!s)return;let l=null;for(const a of s.querySelectorAll('a[aria-current="page"]')){if(a.getClientRects().length){l=a;break;}}if(!l)return;const r=n.getBoundingClientRect();const t=l.getBoundingClientRect();if(t.top>=r.top&&t.bottom<=r.bottom)return;n.scrollTop+=t.top-r.top-(n.clientHeight-t.height)/2;})();`;
