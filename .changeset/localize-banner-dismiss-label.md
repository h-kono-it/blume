---
"blume": patch
---

The announcement banner's dismiss button had a hardcoded English "Dismiss announcement" accessibility label. It now resolves through the UI strings dictionary (`banner.dismiss`), ships translations in every built-in locale pack, and can be overridden per locale via `i18n.ui`.
