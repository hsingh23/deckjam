# 001 — One module, one controller, no services

- Date: 2016-12-03 (initial import `88f6b91`), held for the project's life
- Status: accepted, era-appropriate; superseded ecosystem-wide by component architectures

## Context

Deckjam was a solo side project shipping fast against a two-week deadline feel: one page, one
data flow (search → select → create). Angular 1.5 offered services, components, and routing,
but none of the problems they solve (shared state, multiple views, teams) existed here.

## Decision

The entire app is one AngularJS module (`deckjam`) with one controller (`homeContainer`) whose
scope object is literally named `_` (lodash-style). All state, API calls, and helpers hang off
that scope; templates bind directly to `_.search`, `_.decks`, `_.selected`, `_.create`, etc.
No services, no factories, no router (html5Mode `$location` is used only for the `?q=` param).

## Consequences

- Extremely fast iteration: every commit touches `app.js` bottom-up and `index.jade`, nothing
  else to wire.
- Directives stayed tiny and genuinely reusable (`iconText`, `loseFocus`, `postRepeatDirective`).
- The controller became a 250-line grab bag; unit testing was impossible in practice (scope
  functions, `localStorage`, and `$http` interleaved), which is why the repo has zero tests.
- The `_` scope name shadowed lodash, prompting the `var lo = _` alias at the top of `app.js` —
  one of the codebase's lasting quirks.

## Evidence

`88f6b91` (import), `37b1c28` (controller grows create/import), `app.js` overall shape.
