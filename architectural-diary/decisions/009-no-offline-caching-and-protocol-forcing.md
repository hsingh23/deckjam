# 009 — No offline caching, and the http:-forcing workaround

- Date: 2016-12-10 (`37b1c28`, `8eaff83`); rationale documented in `app.js` comments
- Status: accepted; both decisions outlived their reasons

## Context

Two constraints collided: (1) the self-hosted Quizlet proxy at `ayudh.org:3337` served plain
HTTP, so an https page would block its API calls as mixed content; (2) the initial import
included a Google-sample `service-worker.js` for read-through offline caching, but the Quizlet
API sent no CORS headers, and `no-cors` fetches cannot carry the authorization header the
proxy needed.

## Decision

1. Force the protocol at the top of `app.js`: any non-`http:` page redirects to `http:` —
   first as https-forcing, then flipped to http-forcing (`8eaff83`) once mixed content bit.
2. Comment out service-worker registration entirely; keep the sample file unused. A code
   comment records exactly why (CORS, no-cors auth limitation, with links).
3. Disable `$sce` entirely (`$sceProvider.enabled(false)`) to allow the hand-authored HTML in
   the Anki dialog.

## Consequences

- The app worked on GitHub Pages over plain HTTP in an era before HTTPS-everywhere; today the
  redirect is actively harmful (browsers flag http, and the final Cloud Functions endpoint was
  itself https — the forcing logic contradicts its own backend).
- No offline mode: refreshing on a plane meant losing everything not in localStorage. The
  localStorage database (decision 005) quietly became the only offline story.
- `$sce` disabled is an XSS foot-gun for any future remote content rendered in templates;
  it was tolerable only because all HTML strings were app-authored.
- These three are the first things to reverse in any revival: serve https only, drop the
  redirect, re-enable `$sce` with explicit trusts.

## Evidence

`app.js` lines 1–9 (protocol redirect, service-worker comment, CORS note), line 14
(`$sceProvider.enabled(false)`), `8eaff83`, `37b1c28`, `service-worker.js`.
