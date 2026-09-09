# 003 — Quizlet through a server-side proxy (self-hosted Node → Google Cloud Functions)

- Date: assumed from initial import (2016-12-03, `88f6b91`); migrated 2018-07-03 (`808806b`)
- Status: accepted; the dependency ultimately killed the product

## Context

Quizlet's API sent no CORS headers, so a browser page could not call it directly (noted in
`app.js` comments citing the era's Stack Overflow guidance). Deckjam therefore needed a
server-side shim that forwarded search, set-fetch, and set-creation calls with API
credentials applied server-side.

## Decision

All Quizlet traffic goes through an HTTP proxy whose base URL is the `_.api` constant in
`app.js`. Three endpoints:

- `GET {api}search?query=<term>` → Quizlet set search
- `GET {api}sets?query=<id,id,...>` → batch set details (terms, creator, languages)
- `POST {api}createSet` → create a Quizlet set from `{title, lang_terms, lang_definitions, data}`

The proxy ran as a self-hosted Node server at `ayudh.org:3337` (plain HTTP — see decision 009
for the fallout) until `808806b` moved it to Google Cloud Functions
(`us-central1-quizlet-cf`) with renamed paths, and `8f084a1` fixed the `//createSet` double
slash the new base URL introduced.

## Consequences

- Clean separation: the frontend never saw Quizlet credentials.
- The proxy was a single point of failure outside version control; its source is not in this
  repository, so the backend is unrecoverable from this repo alone.
- When Quizlet killed API access and the Cloud Functions deployment went away, the frontend
  survived only as a UI shell — the defining reason this project is archived.
- Search results were cached client-side per URL (`$http` cache: true) and decks in
  localStorage, softening repeated proxy round-trips (~8s per search, per the UI toast).

## Evidence

`app.js` (`_.api`, endpoint calls, CORS comments), `808806b`, `8f084a1`.
