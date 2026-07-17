---
"blume": patch
---

Format the changelog timeline's dates in the configured locale. The timeline hardcoded `en`, so an i18n site showed two languages at once: a page's "last updated" stamp honored the locale while `/changelog` stayed English. `/changelog` is an unlocalized route whose chrome already renders in the default locale, so its dates now follow that same locale. English sites are unaffected.
