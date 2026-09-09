# 006 — Commit the compiled artifacts

- Date: from 2016-12-10 (`37b1c28`) onward
- Status: accepted (forced by the hosting choice)

## Context

GitHub Pages serves whatever is committed. With Pug (`index.jade`) and Babel sources, the
compiled `index.html`, `app.prod.js`, and `app.prod.js.map` had to exist in the repo for the
site to work.

## Decision

Treat compiled outputs as first-class tracked files, regenerated locally and committed
alongside source changes. Nearly every UI commit in history carries the triple
`index.jade + app.js` → `index.html + app.prod.js + app.prod.js.map`. The Babel output also
meant production could load `app.prod.js` (ES5) while the source used arrow functions and
template literals.

## Consequences

- Deploys are trivial: push to master, Pages serves it. No CI needed — none existed.
- Source/artifact drift is a live hazard: `6173936` exists precisely because compiled output
  had drifted (commented script blocks flipped the wrong way), and `39d1332` shipped a
  template referencing a helper the controller didn't define — classes of bugs a build gate
  would catch.
- Reviews double in size; whitespace-only recompiles pollute several commits.
- The `.map` file makes production debuggable against ES6 source — genuinely ahead of its
  time for a 2016 side project.

## Evidence

`37b1c28` (first compiled artifacts + tooling), `6173936` (drift fix), `8f084a1` (source and
artifact fixed together), AGENTS.md "Verify changes".
