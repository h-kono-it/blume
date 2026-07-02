/**
 * Public component contracts.
 *
 * Prop types for built-in components are exported here so users can type their
 * overrides (`import type { CalloutProps } from "blume/components"`), alongside
 * the override descriptor types.
 */
export type {
  ComponentOverride,
  ComponentOverrides,
  IslandDescriptor,
} from "../core/define-components.ts";
export type { HydrationMode } from "../core/schema.ts";
export type * from "./props.ts";
