---
"blume": patch
---

Stop the search preflight from falsely warning `Search provider "orama" needs "@orama/orama", which isn't installed` on a successful build. The check resolved the provider SDK from the project root only, so under isolated linkers (Bun's `isolated` mode, pnpm) a SDK Blume ships — Orama, the default provider — looked missing even though the index built fine via the `.blume` deps link. It now also resolves from Blume's own package (the same dependency set the build uses), so a shipped SDK is recognized; a genuinely uninstalled peer (Algolia, Typesense, …) still warns.
