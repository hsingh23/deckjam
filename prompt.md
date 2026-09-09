# Deckjam — one-shot recreation prompt

Use this prompt to recreate the Deckjam flashcard curation app from scratch in one sitting.
It encodes every design decision the original made (and a few it should have), so a faithful
rebuild is possible without the original code.

---

## Goal

Build **Deckjam**, a single-page web app that lets a user **curate** flashcards: search a
flashcard platform (originally Quizlet) for decks, load their cards, cherry-pick cards across
decks into a personal selection, and push that selection back as a brand-new deck on the
platform. The user never writes a card; they only choose. Keep the app entirely static —
no server-rendered pages, no database, no accounts.

Non-goals: studying/practicing cards in-app (the platform does that), user accounts, sync
across devices, offline mode.

## Stack (era-accurate, as originally built)

- AngularJS 1.5.x, Angular Material 1.1.x, Roboto, custom `light-blue`-derived theme
- Templates in Jade/Pug compiled to `index.html`; app source compiled by Babel to `app.prod.js`
- lodash for collections; a vendored bloom filter for dedupe
- Google Analytics via Angulartics (pageviews + explicit events)
- Hosted as static files (originally GitHub Pages + `CNAME` deckjam.org)
- All libraries vendored in-repo; the only devDependency is the Babel preset

(A modern rebuild may substitute any component framework — the *decisions* below are the spec.)

## Data model

Client-side only; persisted to `localStorage`:

- `decks: { [setId]: Deck }` — cached search results.
  `Deck = { id, url, title, creator, display_timestamp, lang_terms, lang_definitions, terms: Term[], terms_length }`
- `selected: { [termId]: SelectedCard }` — the user's curated cards.
  `SelectedCard = { id, term, definition, image?, setId, rank, time }` (`time` = selection
  timestamp, powers newest-first ordering)
- `createdOne: number` — decks created by this user (gates a feedback card)
- `user: string` — random anonymous analytics id (first visit)

`Term = { id, term, definition, image?, rank, selected? }`. Decks reduced to ≤2 unique terms
are discarded. Selection panel supports sort by `time` or `term`, with a reverse toggle.

## APIs (by name)

All platform access goes through a proxy (the platform API has no CORS); base URL is a single
constant (`_.api`). Three endpoints:

- `GET search?query=<term>` → `{ sets: [{ id, ... }, ...] }` — set search
- `GET sets?query=<id,id,...>` → `Set[]` with full terms — batched set details (10 ids per call)
- `POST createSet` body `{ title, lang_terms: 'en', lang_definitions: 'en', data: [{ term, definition, image }] }` → `{ url }` or `{ error }` — create the curated deck; the app links to it

Search is single-term, minimum 3 characters, minimum-deck threshold, results paged 10 sets at
a time via a per-term cursor (`startIndexes[term]`), with **Load next** (keep dedupe filter)
and **Load previous**.

## Design decisions (all of them)

1. **One page, one controller.** No router; html5-mode `$location` used only to mirror the
   search into `?q=` and auto-run it on load (shareable search URLs).
2. **Single scrolling page, not tabs.** Sections `#help`, `#decks`, `#nav`, `#selected`,
   navigated by `$anchorScroll` (`goTo(id)`). A masthead ("Deckjam / Google for flashcards")
   replaces a shrinking toolbar. Two floating action buttons: **save FAB** (visible when ≥2
   cards selected; scrolls to create panel) and **find FAB** (scrolls to results tips); both
   hide while an input is focused.
3. **Selection gestures by viewport.** Tap an explicit checkbox/card on small screens; drag
   across rows to multi-select on large (`gt-md`). Cards render as clickable tiles (highlight
   when selected) with a leading check icon for state.
4. **Bloom-filter dedupe.** `BloomFilter(3e5 bits, 3e-5)` over `term + definition`; a card is
   kept only if unseen, then added. Filter resets on new search, persists across Load next.
5. **localStorage is the database** (keys above). Every mutation writes through immediately;
   returning users with a selection get a toast telling them how many cards they have.
6. **Compiled artifacts are committed** — `index.html` and `app.prod.js` (+ sourcemap) ship in
   the repo so static hosting serves them; every source change regenerates them.
7. **Contextual help.** Welcome/FAQ cards only before the first search; a tip card only with
   results; staged Search/Select/Study guidance reacting to state (`numDecks()`,
   `numSelected()`); first-visit toast prompts a search.
8. **Deck headers allude to the source platform:** creator avatar linking to their profile,
   title linking to the source deck, term/definition language tooltip, created timestamp.
   A deck-wide swap flips term/definition (and language metadata) in place.
9. **Live filter across loaded decks:** a filter input filters terms by regex match on term or
   definition with highlight; decks with zero matching terms hide.
10. **Create flow:** action panel with a deck-name input, indeterminate progress bar, result
    toasts (success / server error text / network failure), a link to the created deck, and a
    persisted creation counter. **Import flow:** paste a platform deck URL; its numeric id is
    extracted and all its terms join the selection.
11. **Editable cards:** a toggle switches selected cards between read-only spans and textareas
    before creation; per-card swap and remove; deck-level select-all/none and remove-deck.
12. **Analytics:** pageviews plus explicit events (Search, Load more, Create Failed, tab and
    control clicks) with an anonymous persisted user id.
13. **Anki bridge:** a dialog walking through installing Anki + the platform importer plugin,
    then importing the created deck URL — the "graduation path" for serious learners.
14. **Feedback card** (contact + donation links) appears only after the user's first created
    deck.

Decisions to *reverse* in a rebuild (documented as mistakes): forcing the `http:` protocol
(mixed-content workaround for the original plain-HTTP proxy — serve https only), disabling
`$sce` wholesale (trust explicit HTML instead), and shipping the unused Google-sample service
worker (platform API had no CORS; there is no offline mode).

## Build order (phased)

1. **Skeleton:** module + one controller, material theme, masthead, search input (min 3 chars,
   Enter submits, blurs on search, no autofocus), protocol/`?q=` wiring.
2. **Search loop:** `search` → set ids → paged `sets` batches (10) → `Deck` objects → bloom
   dedupe → deck cards with creator/language/timestamp headers; Load next/previous; fetching
   progress bar; error toasts.
3. **Selection:** click/drag gestures by viewport, `selected` map with time stamps,
   localStorage write-through, selection panel with sort/reverse, select-all, per-card
   remove/swap, deck swap, editable toggle, live count.
4. **Create + import:** create panel (name input, progress, toasts, created link, counter),
   import-by-URL, save FAB, feedback card.
5. **Polish:** filter with highlighting and empty-deck hiding, contextual help/FAQ, find FAB,
   FAB hide-on-input, Anki dialog, analytics events + user id, `?q=` share links, mobile
   responsive tweaks (checkbox vs drag, hidden controls on xs, full-width card images with
   definition below).

## Acceptance criteria

- Searching a term loads ≥10 decks, deduped; Load next adds 10 more without duplicates from
  earlier pages; Load previous returns.
- Reload with cards selected: selection survives, toast reports the count, `?q=` re-runs the
  search.
- Creating from a ≥2-card selection produces a platform deck URL shown in-app; failure paths
  toast distinct messages.
- Importing a deck URL selects all of its terms; filter hides non-matching decks and
  highlights matches; deck/term swap flips content in place.
- Everything works on a phone-width viewport: tap selection, no autofocus keyboard pops, FABs
  never cover inputs.
- No test suite existed in the original; a rebuild should at minimum verify the flows above
  manually on http and https origins, and keep compiled artifacts in sync with source.
