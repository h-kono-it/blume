---
"blume": patch
---

Stop opening a phantom code fence on a line-leading inline backtick span. A paragraph line like ` ```inline``` ` is not a fence opener (CommonMark forbids backticks in a backtick fence's info string), but the heading/link scanner treated it as one and silently dropped every heading and link after it from the TOC, search index, and anchor validation.
