# 005 — localStorage is the database

- Date: from initial import (2016-12-03, `88f6b91`); persistence scope debated 2016-12-10
  (`e96637a`) to 2016-12-13 (`6173936`)
- Status: accepted

## Context

No user accounts, no server-side session: the user's curated selection *had* to survive
reloads and browser restarts, but a backend for state was out of scope for a static GitHub
Pages site.

## Decision

Four `localStorage` keys hold all durable state:

- `decks` — the full search-result deck map (URL, title, creator, timestamp, languages,
  terms). JSON-serialized wholesale on every fetch.
- `selected` — the curated card map, keyed by term id with `setId` and a selection `time`
  stamp; written on every select/deselect/swap/remove/import.
- `createdOne` — count of decks the user created, gating the feedback/donation card
  (`d3edef9`).
- `user` — random anonymous id for analytics attribution (`0aefd16`).

The history shows real deliberation about *what* deserves persistence: `e96637a` stopped
persisting decks (empty load each visit) while starting to persist `selected`; `e145320`
restored deck persistence; `cb033db` briefly commented it out again; `6173936` restored it
for good.

## Consequences

- Zero-backend durability: selection survives anything short of cache clearing; returning
  users get a toast ("You have N cards selected…") instead of a cold start.
- `decks` can grow large (full term lists as JSON), risking quota pressure; there is no
  eviction strategy.
- Selection state is device-local with no sync or export path other than creating the Quizlet
  set — acceptable for the tool's one-shot usage pattern.
- The `time` stamp per selected card powers the default newest-first ordering of the selection
  panel (`03896df`).

## Evidence

`app.js` (`JSON.parse(localStorage...)` initializers, `selectTerm`, `clearSelected`,
`swapSelected`), `e96637a`, `e145320`, `6173936`, `d3edef9`, `0aefd16`.
