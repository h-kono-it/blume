---
"blume": patch
---

Stop long OpenAPI routes from overflowing the native API reference layout. An operation's heading now wraps a long `METHOD /path` title instead of clipping it off the content column, and the overview list rows stack the summary over the route (each getting the full row width) and wrap a long route inside the card — dropping the duplicate path that overlapped the label when a spec sets no summary.
