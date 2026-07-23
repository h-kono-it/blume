---
"blume": patch
---

Make `useAskAI().reset()` revoke the in-flight stream, matching the built-in island. Resetting mid-answer used to let the next chunk re-append an orphaned assistant bubble onto the emptied conversation, and a fetch error after reset resurrected the entire pre-reset history. The request is now aborted and stale writes are discarded.
