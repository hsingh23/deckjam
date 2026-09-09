# Deckjam

> **Archived project.** Deckjam was a flashcard curation tool built in 2016–2018 and served at
> [deckjam.org](https://deckjam.org) on GitHub Pages. It depended on Quizlet's API through a
> small proxy backend, and that integration (and the backend) is long gone. The code is kept as
> a historical artifact of the jQuery-to-AngularJS era of single-page apps; it will not run
> end-to-end today without rebuilding the API layer. See [CHANGELOG.md](CHANGELOG.md) for the
> full history and [prompt.md](prompt.md) for a one-shot recreation spec.

## What it was

Deckjam let students, teachers, and lifelong learners **curate** flashcards instead of writing
them. You searched Quizlet for a topic, Deckjam loaded matching decks, and you picked
individual cards across decks — deduplicated automatically — into your own set. One click
created the curated set back on Quizlet, where you could study it with Quizlet's games and
mobile apps. Later, an in-app guide explained how to import the created deck into
[Anki](https://apps.ankiweb.net) for spaced-repetition study.

**Why Deckjam?** Flashcards are proven to improve recognition and recall, yet creating them is
tedious. Deckjam made it fast to find cards matching your expression style and pack together
concise study material for a test — or for curiosity-driven lifelong learning.

**Why the name?** The app lets you *jam* together your favorite flashcards into a *deck* —
improvised creation and curation of study material. Deck + jam.

## Features (as shipped)

- Single-box Quizlet search; results paged 10 decks at a time (Load next / Load previous)
- Click-to-select cards on touch devices, drag-to-select on desktop
- Bloom-filter dedupe of duplicate terms across the loaded decks
- Per-deck select-all, per-card term/definition swap, deck-wide swap, deck removal
- Live filter across loaded cards with match highlighting; empty decks hidden
- Curated selection persisted in `localStorage` across visits; import an existing Quizlet set by URL
- Create a new Quizlet set from the selection via the proxy API, with toasts and progress bars
- Anki import walkthrough dialog
- Shareable search URLs (`?q=term`), Google Analytics via Angulartics
- Responsive Angular Material UI with a custom light-blue theme

## Stack

| Layer | Choice |
| --- | --- |
| Framework | AngularJS 1.5.9 (single module, single controller) |
| UI | Angular Material 1.1.x, custom palette, Roboto |
| Templates | Jade/Pug (`index.jade`) compiled to `index.html` |
| JS build | Babel (`app.js` → `app.prod.js` + sourcemap) |
| Utilities | lodash, vendored `bloomfilter.js` |
| Analytics | Angulartics + Google Analytics |
| Hosting | GitHub Pages with a `CNAME` (deckjam.org) |
| Backend (2018) | Google Cloud Functions proxy over the Quizlet API (earlier: a self-hosted Node proxy) |

There are no environment variables; the API base URL is the `_.api` constant in `app.js`.

## Quickstart (historical)

Everything is static files; the only tooling is the Pug and Babel compilers:

```sh
yarn install                     # installs babel-preset-latest (devDependency)

# Compile index.jade -> index.html (watch mode)
pug -w .

# Compile app.js -> app.prod.js (watch mode, with sourcemaps)
babel app.js --out-file app.prod.js --watch --source-maps --presets latest
```

Serve the directory over HTTP (the app forces the `http:` protocol) and open `index.html`.
Note that search and set creation call a defunct backend, so the UI loads but data flows will
fail today.

## Repository structure

```
app.js               # AngularJS source (module config, directives, homeContainer controller)
app.prod.js[.map]    # Babel-compiled output served in production (committed build artifact)
index.jade           # Pug template — the whole UI
index.html           # Compiled template (committed build artifact)
style.css            # App styles (+ vendored Bootstrap table CSS)
service-worker.js    # Google sample; registration disabled (Quizlet API had no CORS)
bloomfilter.js       # Vendored bloom filter used to dedupe terms
angular*.js|css, lodash.js, roboto.css   # Vendored libraries
CNAME                # GitHub Pages custom domain: deckjam.org
todo                 # Original author task list (historical)
package.json         # babel-preset-latest devDependency only
```

`app.js` talks to three endpoints on the API base: `search?query=`, `sets?query=ids`, and
`createSet` (POST). Client state lives in `localStorage` under the keys `decks`, `selected`,
`createdOne`, and `user`.

## Documentation

- [CHANGELOG.md](CHANGELOG.md) — every commit, newest first
- [AGENTS.md](AGENTS.md) — build commands, architecture map, conventions, gotchas
- [architectural-diary/](architectural-diary/) — narrative history and decision records
- [prompt.md](prompt.md) — one-shot prompt to recreate the project from scratch

## License

MIT (per `package.json`); original author Harsh Singh.
