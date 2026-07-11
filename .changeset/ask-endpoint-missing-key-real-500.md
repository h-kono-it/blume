---
"blume": patch
---

The generated Ask AI endpoint now rejects a missing API key (or missing AI Gateway credential) up front with a real 500 and a pointer to the env var to set, and logs provider errors server-side via streamText's `onError` callback. Previously `streamText` deferred auth failures to stream consumption, so the endpoint returned a 200 whose stream aborted mid-flight, the UI showed a generic error, and nothing was logged.
