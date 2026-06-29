import { describe, expect, it } from "bun:test";

import type { IslandSpec } from "../src/astro/islands.ts";
import {
  catchAllPageTemplate,
  changelogIndexTemplate,
  islandMapTemplate,
  islandWrapperTemplate,
  userComponentsTemplate,
} from "../src/astro/templates.ts";

const island = (over: Partial<IslandSpec> = {}): IslandSpec => ({
  client: "visible",
  file: "/project/islands/Counter.tsx",
  framework: "react",
  name: "Counter",
  ...over,
});

const exportOpts = { askEnabled: false, exportEpub: false, exportPdf: false };

describe("userComponentsTemplate", () => {
  it("exports empty override maps when no components file exists", () => {
    const out = userComponentsTemplate(null);
    expect(out).toContain("export const mdxComponents = {}");
    expect(out).toContain("export const layoutOverrides = {}");
  });

  it("re-exports mdx and layout overrides from the user file", () => {
    const out = userComponentsTemplate("../../components.ts");
    expect(out).toContain('import overrides from "../../components.ts"');
    expect(out).toContain("export const mdxComponents = overrides.mdx ?? {}");
    expect(out).toContain(
      "export const layoutOverrides = overrides.layout ?? {}"
    );
  });
});

describe("catchAllPageTemplate", () => {
  it("imports layout overrides and passes them to RootLayout", () => {
    const out = catchAllPageTemplate({ ...exportOpts, mathEnabled: false });
    expect(out).toContain(
      'import { mdxComponents as userMdx, layoutOverrides } from "../generated/components.ts"'
    );
    expect(out).toContain("layout={layoutOverrides}");
  });

  it("imports the island map and spreads it into the MDX scope", () => {
    const out = catchAllPageTemplate({ ...exportOpts, mathEnabled: false });
    expect(out).toContain(
      'import { islandComponents } from "../generated/islands.ts"'
    );
    expect(out).toContain("...islandComponents,");
  });

  it("no longer imports the removed Warning component", () => {
    const out = catchAllPageTemplate({ ...exportOpts, mathEnabled: false });
    expect(out).not.toContain("Warning");
  });
});

describe("islandWrapperTemplate", () => {
  it("applies the default visible directive and forwards props + slot", () => {
    const out = islandWrapperTemplate(island());
    expect(out).toContain('import Island from "/project/islands/Counter.tsx"');
    expect(out).toContain(
      "<Island client:visible {...Astro.props}><slot /></Island>"
    );
  });

  it("applies client:load", () => {
    expect(islandWrapperTemplate(island({ client: "load" }))).toContain(
      "<Island client:load {...Astro.props}>"
    );
  });

  it("applies client:only with the framework name", () => {
    expect(islandWrapperTemplate(island({ client: "only" }))).toContain(
      '<Island client:only="react" {...Astro.props}>'
    );
  });
});

describe("islandMapTemplate", () => {
  it("exports an empty map when there are no islands", () => {
    expect(islandMapTemplate([])).toContain(
      "export const islandComponents = {}"
    );
  });

  it("imports each wrapper and maps it by name", () => {
    const out = islandMapTemplate([island(), island({ name: "Chart" })]);
    expect(out).toContain('import I0 from "./islands/Counter.astro"');
    expect(out).toContain('import I1 from "./islands/Chart.astro"');
    expect(out).toContain("Counter: I0,");
    expect(out).toContain("Chart: I1,");
  });
});

describe("changelogIndexTemplate", () => {
  it("imports layout overrides and passes them to RootLayout", () => {
    const out = changelogIndexTemplate(exportOpts);
    expect(out).toContain(
      'import { layoutOverrides } from "../generated/components.ts"'
    );
    expect(out).toContain("layout={layoutOverrides}");
  });
});
