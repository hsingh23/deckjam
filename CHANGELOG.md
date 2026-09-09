# Changelog

All notable changes to Deckjam, newest first. Every commit in the repository's history is listed.

> **History rewrite note (2026-09-08):** commit messages across the 2016–2018 history were
> rewritten (messages only — file contents, authors, dates, and tree structure are unchanged)
> to follow conventional-commit style with explanatory bodies. Hashes referenced below are the
> current (post-rewrite) hashes. A pre-rewrite backup of the branch was kept locally as
> `backup/pre-docs-20260908`. One merge commit (`eb8a83c`) kept its original message.

## 2018-07-03

- **8f084a1** — `fix: remove double slash in createSet endpoint URL`
  - The `_.api` base URL ends with a slash, so `${_.api}/createSet` produced `//createSet`.
  - Fixed in `app.js` and the compiled `app.prod.js`; sourcemap regenerated.
- **808806b** — `feat: point API client at Google Cloud Functions backend`
  - Moved the API base from the self-hosted proxy at `ayudh.org:3337` to Google Cloud Functions (`us-central1-quizlet-cf`).
  - Renamed endpoints to `search`, `sets`, and `createSet`; bumped `babel-preset-latest`.

## 2017-01-31

- **3cc6557** — `feat: add Anki import dialog and hide decks with no filter matches`
  - New "Import to ANKI" dialog (`showAnki()` via `$mdDialog`, requires `ngSanitize`) walking users through the Anki Quizlet-importer plugin.
  - Deck filtering now hides decks whose terms all fail the filter; "Create" relabeled "Save".

## 2017-01-02

- **5d788a9** — `fix: hide floating action buttons while an input is focused`
  - New `inputActive()` helper; both FABs get `ng-hide="inputActive()"` so they never cover the keyboard area while typing.
- **13d6e65** — `fix: blur active input on card select, search, and form submits`
  - `blur()` helper (document.activeElement.blur()) invoked from `selectTerm`, `getTerms`, and form submits, reliably dismissing the mobile keyboard.
  - Progress bar shown and deck-name input hidden while creating.
- **deae599** — `fix: attempt input-focus fix via losefocus2 flag wiring`
  - Wired the `loseFocus` directive to a new `losefocus2` flag on the filter form; superseded by the direct `blur()` approach in 13d6e65.

## 2017-01-01

- **0d1031f** — `feat: add Deckjam header bar with subtitle and refine search input`
  - New masthead: "Deckjam" title with "Google for flashcards" subtitle.
  - Progress bar moved inside the search container; `autocomplete="off"` on search and filter inputs.
- **a9c36fc** — `refactor: move search/title row inside md-content; drop dead markup`
  - Title/search row now scrolls with page content; large blocks of commented-out toolbar/tabs markup deleted.
- **38ea21e** — `feat: add FAB navigation, deck filtering, and contextual help`
  - Second FAB scrolls to results; new `_.filter` + `matchCard()` live-filter deck terms with match highlighting.
  - Help cards now adapt to app state (welcome/FAQ before search, tips with results).

## 2016-12-31

- **9e9bc22** — `feat: add ?q= search URL param, save FAB, and mobile tweaks`
  - HTML5-mode URLs: searches write `?q=` and page load auto-runs a search from the param; searches are now shareable links.
  - Save FAB appears once 2+ cards are selected and jumps to the create panel; "Select All" hidden on xs/sm.

## 2016-12-28

- **39d1332** — `fix: define missing goTo helper used by template anchor links`
  - `goTo = id => $anchorScroll(id)` added to the controller; template nav buttons previously threw on click. Anki notes appended to `todo`.

## 2016-12-22

- **11d7994** — `feat: show Quizlet deck metadata, creator links, and staged help`
  - Deck headers now show creator avatar (linked), linked title, term/definition language tooltip, and created timestamp; `swapDeck` also swaps language metadata.
  - Staged Search/Select/Study help sections keyed to app state; two demo GIFs added.

## 2016-12-20

- **2fe6412** — `fix: restyle term cards via .deckcard CSS and fix repeat tracking`
  - Term cards rebuilt on a `.deckcard` class with responsive media query; `track by card.id` fixes ng-repeat duplicate-key errors in the selected table.

## 2016-12-18

- **c3cfa4c** — `feat: replace term table with clickable card-style layout`
  - Per-deck terms render as md-whiteframe cards (green when selected); clicking anywhere toggles selection on all screen sizes; drag-select handlers dropped.

## 2016-12-17

- **4f3874b** — `chore: add CNAME to serve GitHub Pages at deckjam.org`
  - Root `CNAME` file recreated (seconds after 527e726 deleted it), restoring the custom domain.
- **527e726** — `chore: remove CNAME file`
  - Temporary delete of the GitHub Pages custom-domain file; net effect nil once 4f3874b re-added it.
- **b026d93** — `feat: replace md-tabs with anchor-scroll nav buttons`
  - Tab panels replaced by one scrolling page (#help, #decks, #nav, #selected) with toolbar buttons scrolling via `$anchorScroll`.

## 2016-12-16

- **40a8cbb** — `feat: add deck term swap, search restart fix, and load-previous paging`
  - `swapDeck` flips term/definition across a deck; `getTerms` refactored to an options API (`restartIndex`, `replaceTerms`, `replaceBloom`) powering Load Next/Previous paging.
  - Angulartics event tracking wired (search, load more, create failed); `todo` file added.

## 2016-12-15

- **b402895** — `docs: add README with project overview and build commands`
  - First README: curation purpose, "Why Deckjam" and naming trivia, and the pug/babel build commands.

## 2016-12-14

- **d1e34f9** — `feat: shrink toolbar on scroll`
  - `md-scroll-shrink` on the toolbar so it collapses while scrolling down.
- **784dcbc** — `feat: show placeholder text for searched term on first load`
  - `searched` initialized to "your last search term" so the pre-search results heading reads naturally.
- **cf5be3f** — `feat: include search term in results heading`
  - Heading becomes "Found N Quizlet decks containing {term}" and updates as soon as a search starts.
- **a42669b** — `fix: correct selection breakpoints and add guidance toasts`
  - Selection gesture split fixed via `$mdMedia('gt-md')`: checkbox tap on tablet-and-below, drag-select on larger screens.
  - Startup toast reports selected-card count; loaded-decks toast hints at checkboxes.
- **6ed1882** — `fix: stop auto-focusing the search input on load`
  - `autofocus` removed so the page load does not pop the mobile keyboard.
- **559c856** — `feat: blur search input when a search runs`
  - New `loseFocus` directive blurs the search field when the `losefocus` flag is set in `getTerms`; search wrapped in an ng-submit form (Enter searches).

## 2016-12-13

- **c6f205d** — `refactor: search single term and constrain card image widths`
  - Multi-term comma-split search replaced by a single trimmed query (min 3 chars); card images capped with `max-width: 100%`.
- **6f283f3** — `style: render deck images full width without checkbox ripple`
  - Full-width deck images with definitions on a new line; checkbox ripple suppressed via `md-no-ink`.
- **6173936** — `fix: restore deck localStorage caching and CDN script tags`
  - Re-enabled `localStorage.decks` persistence (was commented out); fixed jade comment indentation so CDN production scripts render.
- **5db9582** — `fix(ui): remove autofocus from main search input`
  - Toolbar search no longer grabs focus on load.
- **cb033db** — `feat(search): add Load next button to page in more decks`
  - "Load next" advances a per-term `startIndexes` cursor by 10 sets, keeping the bloom filter across pages.
- **e145320** — `feat(search): chunk Quizlet fetches and split selection by viewport`
  - 20-set fetch split into two parallel 10-set batches for smaller payloads; click-to-select on small screens, drag-to-select on md+ (`selectClickTerm`/`selectDragTerm`).
  - Decks persist to localStorage again; "N Quizlet decks" header added.
- **8b1387d** — `feat(ui): add iconText directive and simplify help/action cards`
  - Reusable `iconText` element (tooltip+icon on xs, text label above xs) used for action buttons; help cards simplified to plain headings with per-card Ok buttons.

## 2016-12-12

- **eb8a83c** — `Merge branch 'master' of github.com:deckjam/deckjam` (merge, message kept)
  - Brought in the remote `CNAME` addition (deckjam.org custom domain) alongside local work.
- **8dad31b** — `feat(ui): show checkbox state on deck cards and tidy tables`
  - Explicit `check_box`/`check_box_outline_blank` icons per row; create form laid out as a centered flex row.
- **6b63f2f** — `chore(deploy): add CNAME file for deckjam.org`
  - First CNAME commit binding the GitHub Pages site to the custom domain.
- **b538b18** — `fix(search): fetch only first 20 Quizlet sets per search term`
  - Search results sliced to 20 sets before the batch details request, capping payload size.
- **57e4aa2** — `fix(search): show error toast when fetching sets fails`
  - "Unable to get terms - try another query" toast in both `getTerms` catch handlers.
- **e4d23e5** — `feat(ui): show progress bar while searching or importing`
  - `fetching` flag drives an indeterminate toolbar `md-progress-linear`; auto-switch to results tab when loaded.
- **ce25636** — `feat(analytics): re-enable Angulartics/Google Analytics tracking`
  - Angulartics module deps restored and CDN scripts enabled, reactivating the `analytics-on` directives throughout the templates.
- **6433504** — `fix(ui): apply live-testing feedback to copy and toolbar controls`
  - Logo click returns to Decks tab; placeholder "Flashcards for: "; clearer empty-state examples; Clear Selected becomes a red text button.
- **bd2a403** — `fix(ui): show search icon on toolbar search button`
  - Search submit button showed literal "swap" text; now a magnifier icon with tooltip.
- **7f70977** — `feat(ui): add state-aware onboarding help and FAQ cards`
  - Welcome card guidance steps react to app state; dismissible FAQ card ("Why Deckjam?"); `numDecks` helper added.
- **d3edef9** — `feat: add feedback and donation card shown after first deck creation`
  - "Feedback and Support" card (contact + donation links) appears on the Selected tab after the first created deck; `createdOne` counter persisted to localStorage.
- **6a0cbdb** — `fix: repair malformed attributes and interpolation on Create button`
  - `analytics-on`/`analytics-event` attributes leaked as raw text and the `{{creating ? ...}}` interpolation was missing a brace.
- **0aefd16** — `feat: track anonymous user id in Google Analytics`
  - First-visit random id persisted in localStorage and set on the GA tracker for cross-visit attribution.
- **0affa11** — `feat: add Search analytics events to toolbar search controls`
  - `analytics-on` submit/click Search events on the toolbar form and buttons.
- **bbe8fc6** — `fix: load missing angulartics core script`
  - Core angulartics library script tag added; the module dependency could not resolve without it.
- **3c56e8b** — `feat: add Google Analytics tracking and polish create-flow UI`
  - Angulartics + GA snippet registered; tabs and create/import/editable controls instrumented.
  - Editable button becomes an md-switch; indeterminate progress bar during creation; spacing fixes.
- **7a4fabc** — `feat: show creation result toasts and selected card count`
  - Toasts for deck created / server error / HTTP failure; `numSelected()` count shown in the tab label.
- **e96637a** — `feat: add onboarding help cards and fix deck action buttons`
  - Dismissible help cards on both tabs; ng-click moved from md-icon to md-button so removeDeck/selectAll/removeSelected/swapSelected actually fire; selectAll toggle logic fixed; `_.api` base URL extracted.
- **8eaff83** — `feat: force http protocol and add editable card toggle`
  - Protocol redirect flipped to force http (the plain-HTTP proxy backend would be blocked as mixed content from https); mobile meta tags added.
  - Editable toggle switches selected cards between read-only spans and textareas.
- **37b1c28** — `feat: rebuild Selected tab with create/import flows and editable cards`
  - Create and import action views with back buttons; deck-name input wired to `create(title)`; created-deck link; per-row delete and term/definition swap; editable textareas.
  - `import(importUrl)` pulls in an existing Quizlet set by URL/id; build tooling added (babel-compiled app.prod.js, package.json, yarn.lock, .gitignore) and Bootstrap table CSS vendored.
- **03896df** — `feat: add Selected tab panel with sorting and select-all`
  - App restructured into tab-switched panels; Selected tab lists curated cards with sort-by (time/term), reverse switch, Clear Selected; `selectAll(id)` toggles a whole deck into/out of the persisted selection.

## 2016-12-03

- **6fb36c3** — `refactor: remove Stickyfill sticky-header experiment`
  - Pure removal of the Stickyfill integration (MutationObserver re-application loop, CDN script, sticky CSS) after the approach failed.
- **1a95ef5** — `refactor: swap failed fixed-sticky jQuery plugin for Stickyfill`
  - Second (also unsuccessful) attempt at sticky card titles: jQuery fixed-sticky replaced with Stickyfill plus a MutationObserver to re-apply on DOM changes; fully removed in 6fb36c3.
- **88f6b91** — `feat: import initial Deckjam app with vendored libraries`
  - Root commit: AngularJS/Angular Material app (`app.js`, `index.jade`, `style.css`) that searches Quizlet through a proxy API, drag-selects terms, dedupes terms with a bloom filter, persists decks/selection to localStorage, and POSTs curated sets back to Quizlet.
  - Libraries vendored wholesale (angular, lodash, angular-material, angular-messages, bloomfilter, roboto.css); the jQuery fixed-sticky setup included but non-working.
