# 007 — From tabs to a single scrolling page with FABs

- Date: 2016-12-17 (`b026d93`), extended 2016-12-31 → 2017-01-01 (`9e9bc22`, `38ea21e`)
- Status: accepted; the final navigation model

## Context

The app started as Angular Material tabs: a Decks tab and a Selected tab (`03896df`), with a
toolbar, scroll-shrink, and md-switch tab labels. As the app grew, tabs hid the curation
flow's continuity (search results above, your selection below), and on mobile the tab chrome
ate space while the loading/messaging state made "which tab am I on" confusing.

## Decision

Delete the tabs. Restructure `index.jade` into one scrolling page with anchored sections
(`#help`, `#decks`, `#nav`, `#selected`) navigated by toolbar buttons calling a `goTo()` helper
on `$anchorScroll` (`b026d93`). Later, two floating action buttons replaced the persistent
toolbar controls: a save FAB (visible at ≥2 selected cards) that scrolls to the create panel,
and a find FAB that scrolls to the results tip card (`9e9bc22`, `38ea21e`). The toolbar was
eventually replaced by a simple masthead ("Deckjam / Google for flashcards", `0d1031f`).

## Consequences

- The mental model became a document: search → results → your deck, top to bottom.
- Section anchors made deep-linking trivial alongside `?q=` search URLs.
- `goTo` had to be re-added by hotfix after being dropped accidentally (`39d1332`) — a cost of
  template/controller coupling.
- The intermediate md-tabs markup survived as commented-out dead weight for two weeks until
  `a9c36fc` deleted it.
- The FABs needed input-awareness to avoid covering the keyboard (`5d788a9`).

## Evidence

`b026d93` (tabs removed), `9e9bc22` + `38ea21e` (FABs), `0d1031f` (masthead), `39d1332`
(goto hotfix), `5d788a9` (FAB hide on input).
