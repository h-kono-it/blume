---
"blume": patch
---

Fall through to the next platform env var when one is set but empty. `VERCEL_PROJECT_PRODUCTION_URL=""` dead-ended the chain before `VERCEL_URL` (same for Netlify's `URL`/`DEPLOY_PRIME_URL`/`DEPLOY_URL`), leaving `deployment.site` unset so canonicals, OG images, and the sitemap silently switched off for that deploy.
