/**
 * Pre-paint inline scripts shared by the document layouts (`RootLayout`,
 * `SplashLayout`). They run synchronously in `<head>`, before first paint, so
 * the page never flashes the wrong theme or a since-dismissed banner. Kept in
 * one place so the two layouts can't drift on this timing-critical logic.
 */

/**
 * Set `data-theme` from the stored preference (or the configured default, or the
 * OS setting for `"system"`) before the body paints, avoiding a theme flash.
 */
export const themeInitScript = (
  themeMode: "system" | "light" | "dark"
): string =>
  `(()=>{const m=${JSON.stringify(themeMode)};const s=localStorage.getItem("blume-theme");const sys=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=s??(m==="system"?sys:m);})();`;

/** Hide a previously-dismissed banner before it can flash in. */
export const bannerInitScript = (key: string): string =>
  `(()=>{if(localStorage.getItem("blume-banner:"+${JSON.stringify(key)}))document.documentElement.setAttribute("data-blume-banner-hidden","");})();`;
