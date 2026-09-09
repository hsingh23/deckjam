# 002 — Vendor every library; no bundler

- Date: 2016-12-03 (`88f6b91`) through 2016-12-10 (`37b1c28`)
- Status: accepted for its time

## Context

Hosting was GitHub Pages: static files only, no build server, and 2016 browser support still
needed ES5. npm-and-bundle workflows existed but added moving parts a solo project didn't
need.

## Decision

All runtime libraries are committed at the repo root: `angular.js` (1.5.9), lodash,
`angular-material.min.{js,css}`, `angular-animate`, `angular-aria`, `angular-messages`,
`angulartics.min.js`, `bloomfilter.js`, `roboto.css`. The only build tools are Pug
(`index.jade` → `index.html`) and Babel (`app.js` → `app.prod.js`), run in watch mode from a
`package.json` with a single devDependency (`babel-preset-latest`).

The Jade template keeps two script blocks — CDN and local — and switches between them by
commenting/uncommenting; jade comment indentation decides which renders (see `6173936`,
which fixed exactly this toggling bug).

## Consequences

- The site runs offline from any static file server; no install step to view the app.
- `index.html` and `app.prod.js` are committed artifacts that must be regenerated on every
  source change — several commits in history are recompiles catching up (`6173936`).
- Dependency upgrades are manual file swaps; the repo carries ~50k lines of vendored code in
  its first commit.
- Mixed loading: some scripts from CDN, some local, changed back and forth during development
  then frozen for production.

## Evidence

`88f6b91` (vendored import), `37b1c28` (tooling files), `6173936` (script-toggle bug),
`ce25636` (CDN flip for angulartics).
