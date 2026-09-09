# 004 — Bloom filter for cross-deck term dedupe

- Date: present from initial import (2016-12-03, `88f6b91`); semantics refined 2016-12-16
  (`40a8cbb`) and 2016-12-13 (`cb033db`)
- Status: accepted

## Context

Searching Quizlet for "chemistry" returns many decks that share the same cards — the same
"atom", the same definitions. Deckjam's value was a *curated, deduplicated* selection, and
hash-set membership over thousands of term+definition strings would mean keeping them all in
memory.

## Decision

Deduplicate with a vendored bloom filter (`bloomfilter.js`), sized 3e5 bits with a 3e-5 false
positive rate. As fetched sets stream in, a term is kept only if `bloom.test(term + definition)`
is false, and every kept term is immediately `bloom.add`ed. Decks reduced to ≤2 unique terms
are dropped entirely.

Reset semantics are tied to the fetch mode in `getTerms({restartIndex, replaceTerms,
replaceBloom})`: a new search replaces the filter; "Load next" keeps it so later pages stay
deduped against earlier ones (`cb033db`, `40a8cbb`).

## Consequences

- Constant-memory dedupe across unbounded paging; no string set to maintain.
- False positives silently drop a rare legitimate duplicate — acceptable for curation, and the
  3e-5 rate makes it negligible at this corpus size.
- The filter is per-session, in-memory only, so dedupe state doesn't survive reloads even
  though decks do (a reload re-filters nothing; cached decks render as stored).
- One of the few algorithmic flourishes in an otherwise straightforward CRUD app, and a nice
  era-typical example of reaching for a compact probabilistic structure.

## Evidence

`app.js` `getSets` (`bloom.test`/`bloom.add`, `terms.length > 2` guard), `bloomfilter.js`,
`cb033db`, `40a8cbb`.
