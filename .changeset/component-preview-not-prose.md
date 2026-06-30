---
"blume": patch
---

Insulate the `<Component>` live preview from the page's prose styles. The preview renders inside the content's `.prose` wrapper, so Tailwind Typography bled into the previewed component (heading sizes, link colors, list markers, paragraph spacing), making it look unlike its real rendering. The Preview pane now carries `not-prose`; the Code pane keeps prose so the highlighted source stays styled.
