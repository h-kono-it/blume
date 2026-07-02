---
"blume": minor
---

Export per-component prop types from `blume/components`, so you can type an
override or wrapper against the built-in's contract:

```tsx
import type { CalloutProps } from "blume/components";
```

Types are provided for the content components (`CalloutProps`, `CardProps`,
`CardGroupProps`, `BadgeProps`, `TabsProps`, `TabProps`, `StepsProps`,
`StepProps`, `AccordionProps`, `ColumnsProps`, `FrameProps`, `TooltipProps`,
`IconProps`, and more). Each is derived from the component with Astro's
`ComponentProps`, so it can never drift from the real props.
