import type { ResolvedConfig } from "./schema.ts";

/**
 * List the enabled features that require Astro server output. Static builds
 * fail clearly when any of these are enabled.
 */
export const serverFeatures = (config: ResolvedConfig): string[] => {
  const features: string[] = [];
  if (config.ai.ask?.enabled) {
    features.push("Ask AI");
  }
  return features;
};
