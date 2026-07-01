# Blume — TODO

Outstanding work distilled from the original `plan/` spec, cross-referenced
against `packages/blume/src` (audit: 2026-07-01). The static markdown docs
product is essentially shipped; the items below are the unfinished frontier.

**Already shipped (not tracked here):** i18n (locale routing, UI dict packs,
hreflang/RTL, switcher), MCP server, content-sources / "Path B" (filesystem,
mdx-remote, Sanity, Notion, github-releases, asset materialization, `blume
sync`), Mintlify migration + live bridge, theming, the content-component
library, all four deploy adapters, `llms.txt`/`llms-full.txt`,
sitemap/robots/RSS.

---

## P0 — Biggest holes (whole features not built)

### Native OpenAPI reference (plan 24)

Currently Scalar-embed only (plan 21). None of the native layer exists.

- [ ] OpenAPI IR (`ApiReference`/`ApiOperation`/`SchemaNode`) + Layer-1 delegated parse/dereference/up-convert (2.0/3.0 → 3.1)
- [ ] Per-operation pages (`/reference/<tag>/<operationId>`)
- [ ] Per-tag sidebar grouping
- [ ] Per-operation `SearchDocument`, SEO/OG, and inclusion in `llms.txt` / Ask AI
- [ ] `renderer: "native" | "scalar"` + `playground: boolean` config (default `native`)
- [ ] Optional hybrid Scalar playground island

### API-reference components (plan 10 / 16)

- [ ] `Endpoint`, `ParameterTable`, `ResponseExample`, `RequestExample`, `SchemaViewer`, `AuthMethod`, `CodeSamples`
- [ ] Wire `Endpoint` / `ParameterTable` into the MDX map (currently dead override keys)
- [ ] Hand-authored API pages: accept `type: api`, `method`/`path` frontmatter, and the `api:` meta block (plan 15/17) — currently rejected by the strict schema

### Ask AI retrieval (plan 11)

- [ ] Ground Ask AI in the docs: inject retrieved content (lexical/Orama/embeddings) into the endpoint — today it streams chat messages with a generic system prompt (ungrounded)
- [ ] Pass page/context from the island to the endpoint

### `blume ai` helper commands (plan 11)

- [ ] `blume ai summarize`
- [ ] `blume ai frontmatter` (metadata suggestions)
- [ ] `blume ai broken-links`

---

## P1 — Partially implemented (customization / override API, plan 05 / 16)

- [ ] `defineComponents({ islands })` group — currently silently dropped (only `mdx` + `layout` are read)
- [ ] Honor hydration descriptors (`.client` / `.media`) on layout-slot overrides — a React override renders with no `client:*`
- [ ] Resolve string-path component references (e.g. `Footer: "./components/footer.astro"`)
- [ ] Expose the missing overridable layout slots: `Layout`, `Logo`, `MobileNav`, `Search`, `Footer`, `PageHeader`, `PageFooter` (only 5 of ~12 wired today)
- [ ] `blume/runtime` data helpers: `getBlumeCollection`, `<BlumePage>`
- [ ] React island hooks: `useBlume()`, `usePage()`, `useSearch()`, `useAskAI()`
- [ ] Export per-component prop types (`import type { CalloutProps } from "blume/components"`)
- [ ] Friendly diagnostic when an override targets a framework component with no hydration mode

---

## P2 — Concrete smaller gaps

### Registry `blume add` (plan 05 / 07)

- [ ] Ship more registry items beyond the 5 layout components: `feedback`, `code-group`
- [ ] `blume add theme-<name>` source themes (theme.css + components bundle)

### Errors & diagnostics (plan 18)

- [ ] Dev overlay (Blume diagnostics bridged into Vite/Astro overlay with snippet + fix + docs link)
- [ ] Remap `.blume/` stack frames back to user source
- [ ] Missing-component diagnostic (unknown MDX tag → suggest `blume add`)
- [ ] Hydration-mismatch diagnostic
- [ ] Line/column on config + frontmatter errors (`diagnosticsFromZod` sets file/schemaPath but not line/column)
- [ ] Populate `docsUrl` on diagnostics (field is formatted but never set)
- [ ] `--json` diagnostics output for CI/editors
- [ ] Stable internal-error contract (code + version dump) instead of raw re-throws

### CLI flags (plan 02)

- [ ] `init`: `--template docs|api|sdk|changelog`, `--package-manager`, `--eject`
- [ ] `dev`: `--content-dir`, `--debug`
- [ ] `build`: `--output static|server`, `--adapter`, `--base`, `--analyze`
- [ ] Wire broken-link checking into `build --strict` (currently only standalone `validate`)
- [ ] `blume eject`: pre-eject diff/preview + interactive confirmation
- [ ] Expand `doctor` checks (package manager, Astro/Vite compat, peer integrations, broken nav refs, missing assets, invalid override files)

### Navigation (plan 06)

- [ ] `_meta.json` / `_meta.yaml` folder-meta support (only `meta.ts|js|mjs` today)
- [ ] Versioned docs (`versions: { current, versions }`, `docs/v1|v2/`)
- [ ] Render `navigation.selectors` (validates + builds into the graph but no component consumes it)
- [ ] Nav diagnostics: missing pages referenced in config, duplicate labels at a level, hidden pages referenced by pagination
- [ ] Validate icon names against the icon sets

### Deployment (plan 19)

- [ ] Dynamic server-mode OG endpoint (currently always prerendered)
- [ ] Emit platform redirect files (`_redirects` / `vercel.json`) + a redirect manifest for hosts needing manual wiring
- [ ] Env-var fail-fast when a feature needs a secret (AI Gateway token, analytics keys, feedback creds)

### Config (plan 04)

- [ ] `integrations: [...]` pluggable integration API (schema/content-transforms/routes/endpoints/islands/build hooks)
- [ ] `components` as an inline `blume.config` field (currently only the separate `components.ts`)
- [ ] Resolve orphan config fields (favicon/navbar/footer/icons/contextual/styling/banner) — prune or wire

### Content types & meta (plan 15 / 17)

- [ ] `toc` frontmatter (`toc: true` shorthand + `{ minHeadingLevel, maxHeadingLevel }`)
- [ ] Guide handling (prerequisites/estimated time/related guides) — currently renders as a plain doc
- [ ] `type: example` + `stack: [...]` support — currently rejected by the strict schema

### Content sources (plan 22)

- [ ] Strategy 2: custom Astro Content Layer loader (`blumeLoader`) — everything routes through Strategy 1 staging today (plan recommends Strategy 1 first, so this is planned-later)

---

## P3 — Tooling & quality (plan 13 / 14)

- [ ] Runnable/deployable example apps under `examples/` (basic, api-reference, custom-theme, ask-ai, ejected) — today only migration input samples exist
- [ ] Fixture matrix (static/server deploy, broken links, invalid frontmatter, nested nav, custom `.astro`, React island, migration samples)
- [ ] Playwright e2e (nav, mobile sidebar, search modal, tabs/accordions, theme toggle, code copy, Ask AI shell, custom pages)
- [ ] Visual regression tests + automated accessibility checks (axe, focus trap, contrast, reduced motion)
- [ ] Performance-budget tooling (budgets are documented, not measured)
- [ ] Release: canary channel, fixture build matrix before stable, generated-runtime compatibility tests
- [ ] Migration safety: emit a diff / dry-run / "safe to delete" checklist across migrators (currently edits in place)
