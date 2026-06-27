import { satteri } from "@astrojs/markdown-satteri";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";

import { codeTitleTransformer } from "./code-title.ts";
import { directiveToCalloutPlugin } from "./directives.ts";
import { mathPlugin } from "./math.ts";
import { mermaidPlugin } from "./mermaid.ts";
import { packageInstallPlugin } from "./package-install.ts";

/** A Shiki transformer, derived from the upstream factories' return type. */
type ShikiTransformer = ReturnType<typeof transformerNotationDiff>;

export {
  PACKAGE_MANAGERS,
  type PackageManager,
  toPackageCommands,
} from "./package-commands.ts";
export {
  type CodeTitleTransformer,
  codeTitleTransformer,
} from "./code-title.ts";
export { calloutTypeFor } from "./directives.ts";
export { mermaidPlugin } from "./mermaid.ts";
export { packageInstallPlugin } from "./package-install.ts";

/** Element type of Satteri's `mdastPlugins`, sourced from the (alpha) core. */
type MdastPlugin = NonNullable<
  NonNullable<Parameters<typeof satteri>[0]>["mdastPlugins"]
>[number];

/**
 * Shiki transformers enabled by default for every code block. The four upstream
 * notation transformers read GitHub-style comments and strip them from the
 * output: `// [!code highlight]`, `// [!code ++]` / `// [!code --]`,
 * `// [!code word:x]`, and `// [!code focus]`. The v3 match algorithm scopes a
 * notation to the line it sits on (or the next, for a trailing comment). Blume's
 * own {@link codeTitleTransformer} runs last to promote fence-meta (title / line
 * numbers) to `<pre>` attributes. The theme styles the classes these emit
 * (`highlighted`, `diff add/remove`, `highlighted-word`, `focused`).
 */
export const blumeShikiTransformers = (): ShikiTransformer[] => [
  transformerNotationHighlight({ matchAlgorithm: "v3" }),
  transformerNotationDiff({ matchAlgorithm: "v3" }),
  transformerNotationWordHighlight({ matchAlgorithm: "v3" }),
  transformerNotationFocus({ matchAlgorithm: "v3" }),
  codeTitleTransformer() as unknown as ShikiTransformer,
];

/**
 * Sätteri Markdown features Blume enables beyond Astro's defaults. GFM,
 * frontmatter, and smart punctuation are already on; this adds superscript
 * (`^text^`) and subscript (`~text~`), which render to native `<sup>`/`<sub>`.
 */
const FEATURES = { subscript: true, superscript: true };

/** Sätteri processor for plain `.md`, with Blume's curated feature set. */
export const blumeMarkdownProcessor = () =>
  satteri({ features: { ...FEATURES } });

export interface BlumeMdxOptions {
  /** Enable KaTeX math parsing and rendering. */
  math?: boolean;
}

/**
 * Sätteri MDX processor: Blume's feature set plus the MDAST plugins that target
 * components — `package-install` → package-manager tabs, `:::note` →
 * `<Callout>`, and ` ```mermaid ` → a `<blume-mermaid>` element. Used as the
 * `processor` for `@astrojs/mdx` so these apply to
 * `.mdx` only (plain `.md` uses {@link blumeMarkdownProcessor}). Math is opt-in
 * via config since `$` is common in prose and code.
 *
 * The plugins are modeled with minimal structural types; bridge them to
 * Satteri's full `MdastPlugin` type at this single boundary.
 */
export const blumeMdxProcessor = (options: BlumeMdxOptions = {}) => {
  const plugins: unknown[] = [
    packageInstallPlugin(),
    directiveToCalloutPlugin(),
    mermaidPlugin(),
  ];
  if (options.math) {
    plugins.push(mathPlugin());
  }
  return satteri({
    features: {
      ...FEATURES,
      directive: true,
      ...(options.math ? { math: true } : {}),
    },
    mdastPlugins: plugins as unknown as MdastPlugin[],
  });
};
