# AGENTS.md — working guide for Deckjam

Deckjam is an **archived** AngularJS 1.x single-page app (2016–2018) that curated Quizlet
flashcards. Treat it as a museum piece: prefer documentation and small preservation fixes over
feature work, and never modernize dependencies casually — the whole point is the era-accurate
stack.

## Commands

```sh
yarn install                                    # only devDependency: babel-preset-latest
pug -w .                                        # compile index.jade -> index.html (watch)
babel app.js --out-file app.prod.js --watch --source-maps --presets latest
python3 -m http.server                          # or any static server; must be http:// (see gotchas)
```

There are no tests, no linter, and no CI. Verification is manual: compile, serve, open the
page, watch the console (the `postRepeatDirective` logs ng-repeat DOM render timings).

## Architecture map

One AngularJS module, one controller, three compiled-artifact pairs. Data flows browser →
Cloud Functions proxy → Quizlet.

```
index.jade ──pug──► index.html        (UI: toolbar/search, help cards, deck cards, selected panel)
app.js ──babel──► app.prod.js         ('deckjam' module: config, directives, homeContainer)

app.js
├─ module config     html5Mode URLs ($locationProvider), $sce disabled, custom light-blue theme
├─ directives        iconText (responsive icon/text button), loseFocus (blur on flag),
│                    postRepeatDirective (render-timing logs)
└─ homeContainer     all state and behavior; `_` is the controller scope object
   ├─ API (const _.api)   GET search?query=<term> · GET sets?query=<ids> · POST createSet
   ├─ search flow         getTerms({restartIndex, replaceTerms, replaceBloom})
   │                      → getSetsforTerm → slice 10 sets → getSets → decks map
   ├─ dedupe              BloomFilter(3e5 bits, 3e-5) drops repeated term+definition pairs
   ├─ selection           selected map in localStorage; selectClickTerm (touch) vs
   │                      selectDragTerm (gt-md drag), selectAll, swapDeck/swapSelected
   └─ persistence         localStorage: decks, selected, createdOne, user
```

Static assets are vendored in-repo: `angular.js`, `angular-*.min.*`, `lodash.js`,
`bloomfilter.js`, `roboto.css`. `service-worker.js` is an unmodified Google sample; its
registration is commented out in `app.js` because the Quizlet API sent no CORS headers.

## Conventions (of this codebase)

- Compiled artifacts (`index.html`, `app.prod.js`, `app.prod.js.map`) are **committed** — every
  source change must be accompanied by regenerated outputs or GitHub Pages serves stale code.
- `index.jade` toggles between CDN and local script tags by commenting/uncommenting blocks;
  jade comment indentation decides which block renders. Check which set is live before serving.
- UI copy lives in the template; behavior in `app.js`; nothing is shared via services — it is
  all one controller scope (`_`).
- History uses conventional-commit messages (rewritten 2026-09-08; see CHANGELOG.md note).

## Gotchas

- **Protocol forcing:** `app.js` redirects any non-`http:` page to `http:` — a workaround for
  the original plain-HTTP proxy (mixed content). The final Google Cloud Functions endpoint is
  HTTPS, so this redirect is contradictory legacy behavior. Any static server you test with
  must serve plain HTTP or the page endlessly redirects.
- **`$sce` is fully disabled** (`$sceProvider.enabled(false)`) to allow the hand-built HTML in
  the Anki dialog. Do not interpolate remote content into templates under this setting.
- **localStorage is the database.** `decks` (whole search results) can grow large; a stale
  `selected` map from a previous visit shows a "you have N cards selected" toast on load.
- **Duplicate ng-repeat keys** crash rendering — terms must keep `track by card.id`, decks
  `track by set.id`.
- **Input-focus battles:** the history contains many attempts (autofocus toggles, loseFocus
  directives, `blur()` calls). The settled pattern is calling `_.blur()` at the start of
  `selectTerm`, `getTerms`, and form submits; don't reintroduce `autofocus`.
- **Backend is dead.** The `_.api` Cloud Functions deployment no longer exists; expect search
  and create to fail. Only UI-only flows (filter, select from cached decks, swap) work offline.
- `todo` is the author's original task list — historical, do not "clean it up".

## Verify changes

1. Edit only `app.js` / `index.jade` / `style.css`.
2. Recompile both artifacts (`pug .`, `babel app.js --out-file app.prod.js --presets latest`).
3. Serve over plain HTTP, hard-reload, and confirm: page renders, `?q=` triggers a search
   attempt (will fail at the dead API — expect the error toast), cards from cached
   `localStorage.decks` still render, select/filter/swap work, console shows no ng-repeat
   errors.
4. `git status` must show source and compiled artifacts changed together.

## Pointers

- Full commit history with per-commit detail: [CHANGELOG.md](CHANGELOG.md)
- Design decisions and why-them: [architectural-diary/](architectural-diary/)
- Recreate-from-scratch spec: [prompt.md](prompt.md)
