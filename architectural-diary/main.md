# Deckjam — Architectural Diary

A narrative history of Deckjam, a flashcard curation tool for Quizlet, reconstructed from all
56 commits (2016-12-03 → 2018-07-03). Hashes are current (post-2026-rewrite) hashes; per-commit
detail lives in [../CHANGELOG.md](../CHANGELOG.md), decision records in
[decisions/](decisions/).

## The idea

Flashcards work, but writing them is tedious. Quizlet already had millions of user-made decks;
what it lacked was a way to **mix cards across decks** into your own set. Deckjam was that
layer: search Quizlet, load decks, pick cards (deduplicated automatically), push the curated
selection back to Quizlet as a new set. Later it also explained how to carry that set into
Anki for spaced repetition.

## Phase 0 — Import and false starts (2016-12-03)

The repo opens with `88f6b91`, a full working-in-spirit AngularJS 1.5.9 + Angular Material app:
one module, one `homeContainer` controller, a Jade template, all libraries vendored at the repo
root, and a Quizlet proxy API already assumed. The very first history entries are two failed
attempts at sticky deck titles — jQuery fixed-sticky (`1a95ef5`), then Stickyfill with a
MutationObserver — both abandoned and removed (`6fb36c3`). Sticky headers were not worth the
complexity; the lesson stuck.

## Phase 1 — Making the core loop real (2016-12-06 → 12-12)

A week of intense iteration turned the mock into the product:

- The Selected tab appears with sorting, select-all, and a table of curated cards (`03896df`),
  then grows create/import flows, editable cards, and per-row swap/delete (`37b1c28`).
- The proxy backend is plain HTTP, so the app forces the `http:` protocol to dodge mixed
  content (`8eaff83`) — a decision that outlived its reason (see
  [decisions/009-no-offline-caching.md](decisions/009-no-offline-caching.md)).
- Angulartics + Google Analytics arrive in a burst of commits (`bbe8fc6`, `0affa11`,
  `0aefd16`), including an anonymous localStorage user id for cross-visit attribution.
- Live-user testing feedback drives copy and control fixes (`6433504`, `bd2a403`: the search
  button literally said "swap").
- `deckjam.org` goes live via a GitHub Pages `CNAME` (`6b63f2f`, re-done via the GitHub UI in
  `527e726`/`4f3874b`), and the only merge commit in history (`eb8a83c`) reconciles that
  remote change with local work.

## Phase 2 — Mobile reality and pagination (2016-12-13 → 12-17)

The app was being used on phones, and it showed:

- Result fetches were chunked into two parallel 10-set batches (`e145320`), then Load
  next/previous paging arrived on a per-term cursor with a bloom filter carried across pages
  (`cb033db`, `40a8cbb`).
- Selection gestures split by viewport: tap a checkbox on small screens, drag across rows on
  desktop (`e145320`, corrected breakpoints in `a42669b`) — later simplified to
  click-anywhere-card selection (`c3cfa4c`, see
  [decisions/008-viewport-split-selection-gestures.md](decisions/008-viewport-split-selection-gestures.md)).
- The biggest structural change: md-tabs were replaced by one scrolling page with
  `$anchorScroll` navigation (`b026d93`), later joined by floating action buttons (`38ea21e`,
  `9e9bc22`) — [decisions/007-single-scrolling-page.md](decisions/007-single-scrolling-page.md).
- A running battle with input focus (autofocus on/off, `loseFocus` directives) played out
  across `5db9582`, `559c856`, `6ed1882`, ending in the simple `blur()` call pattern
  (`deae599`, `13d6e65`, `5d788a9`).

## Phase 3 — Polish and identity (2016-12-18 → 12-31)

- Terms became clickable cards with a `.deckcard` style and correct `track by` (`c3cfa4c`,
  `2fe6412`).
- Deck headers started alluding to their Quizlet origin: creator links, language indicators,
  timestamps (`11d7994`).
- Searches became shareable URLs via `?q=` in HTML5 mode (`9e9bc22`), and the page gained a
  proper masthead — "Deckjam / Google for flashcards" (`0d1031f`).
- A missing `goTo` helper broke navigation and was hotfixed (`39d1332`); live filtering with
  match highlighting and context-aware help landed (`38ea21e`).

## Phase 4 — Anki bridge and farewell (2017-01-31 → 2018-07-03)

The last functional commit (`3cc6557`) added the Anki import dialog — an acknowledgment that
serious learners would graduate to spaced repetition — and hid filter-emptied decks. Then, 18
months later, two commits migrated the API base from the self-hosted `ayudh.org:3337` Node
proxy to Google Cloud Functions (`808806b`) and fixed a double-slash URL bug the migration
introduced (`8f084a1`). History ends there.

## Postmortem

The architecture was exactly right for a solo, fast-moving, free-hosted project: zero build
infrastructure beyond two compilers, zero backend to operate until the proxy moved to Cloud
Functions, localStorage as the entire database, and GitHub Pages as the deploy target. The
costs were the flip side: committed compiled artifacts that could drift from source, no tests
or CI, one controller accreting all state, and a hard dependency on Quizlet's unofficial API —
which, when it disappeared, took the product with it. For a full recreation spec see
[../prompt.md](../prompt.md).
