/**
 * Pre-paint inline scripts shared by the document layouts (`RootLayout`,
 * `PageLayout`, `ReferenceLayout`). They run synchronously in `<head>`, before
 * first paint, so the page never flashes the wrong theme or a since-dismissed
 * banner. Kept in one place so the layouts can't drift on this timing-critical
 * logic.
 *
 * Both are constants, never built by interpolating config into source text: the
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
