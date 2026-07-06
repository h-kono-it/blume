---
"blume": minor
---

Enable the React Compiler automatically whenever React is used. Islands and other React components are now auto-memoized by `babel-plugin-react-compiler` (which ships with Blume — nothing to install), so hand-written `useMemo`/`useCallback` is no longer needed. Opt out with `react: { compiler: false }` in `blume.config.ts`.
