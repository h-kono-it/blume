import type { ResolvedConfig, ResolvedI18nConfig } from "./schema.ts";

/**
 * Locale logic, centralized. Every seam that needs to reason about locales
 * (content discovery, navigation, manifest, runtime generation, the catch-all)
 * goes through these helpers so the routing rules live in exactly one place.
 */

/** True when the project opts into i18n. */
export const i18nEnabled = (
  config: ResolvedConfig
): config is ResolvedConfig & { i18n: ResolvedI18nConfig } =>
  config.i18n !== undefined;

/** All configured locale codes, default first as authored. */
export const localeCodes = (i18n: ResolvedI18nConfig): string[] =>
  i18n.locales.map((locale) => locale.code);

/** Text direction for a locale (`ltr` when unknown). */
export const localeDir = (
  code: string,
  i18n: ResolvedI18nConfig
): "ltr" | "rtl" =>
  i18n.locales.find((locale) => locale.code === code)?.dir ?? "ltr";

/**
 * The locale a missing translation falls back to: `fallbackLocale` when set,
 * the default locale when `fallbackLocale` is omitted, or `null` (disabled)
 * when explicitly set to `null`.
 */
export const resolveFallbackLocale = (
  i18n: ResolvedI18nConfig
): string | null => {
  if (i18n.fallbackLocale === null) {
    return null;
  }
  return i18n.fallbackLocale ?? i18n.defaultLocale;
};

/** URL prefix for a locale: `""` for the hidden default, else `/<code>`. */
export const localePrefix = (code: string, i18n: ResolvedI18nConfig): string =>
  code === i18n.defaultLocale && i18n.hideDefaultLocalePrefix ? "" : `/${code}`;

/**
 * Prefix a locale-agnostic route (e.g. `/guides/x` or `/`) with its locale.
 * `/` becomes `/fr` (or stays `/` for the hidden default).
 */
export const localizeRoute = (
  logicalRoute: string,
  code: string,
  i18n: ResolvedI18nConfig
): string => {
  const prefix = localePrefix(code, i18n);
  if (!prefix) {
    return logicalRoute;
  }
  return logicalRoute === "/" ? prefix : `${prefix}${logicalRoute}`;
};

/**
 * Detect a leading non-default locale directory in a path's segments. The
 * default locale lives at the content root, so only non-default codes are
 * matched as a leading segment. Returns the resolved locale and the remaining
 * (locale-stripped) segments.
 */
export const detectLocale = (
  parts: string[],
  i18n: ResolvedI18nConfig
): { locale: string; rest: string[] } => {
  const [first] = parts;
  const isNonDefault = i18n.locales.some(
    (locale) => locale.code !== i18n.defaultLocale && locale.code === first
  );
  if (first !== undefined && isNonDefault) {
    return { locale: first, rest: parts.slice(1) };
  }
  return { locale: i18n.defaultLocale, rest: parts };
};
