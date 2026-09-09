# 008 — Card selection gestures: drag on desktop, tap on touch

- Date: 2016-12-13 (`e145320`, `a42669b`), simplified 2016-12-18 (`c3cfa4c`)
- Status: accepted, then deliberately simplified

## Context

Selecting hundreds of cards one checkbox at a time is painful on desktop; precise checkboxes
are essential on touch, where drag means scroll. One gesture could not serve both.

## Decision

Split by `$mdMedia('gt-md')` breakpoint: on large screens, mouse-down-and-drag across rows
toggles selection (`selectDragTerm`); on tablet-and-below, an explicit checkbox button taps
selection (`selectClickTerm`). `e145320` introduced the split with the boundary initially
wrong (`'md'`), corrected by `a42669b` to `'gt-md'`.

Five days later `c3cfa4c` collapsed the distinction: terms rendered as full clickable cards
(green when selected) where tapping anywhere selects on all screens — drag handlers dropped
from the container. The checkbox affordance later returned visually as a leading
check_box/outline icon (`8dad31b`).

## Consequences

- The drag gesture was the power feature for desktop bulk-curation; tap-anywhere cards made
  the same action obvious on every device at the cost of drag multi-select.
- Selection state (term id → `setId`, `time`) is gesture-independent and persisted in
  localStorage, so the interaction layer stayed swappable — demonstrated by how little changed
  when the gestures were swapped.
- The FAB/keyboard conflicts (`5d788a9`) and focus battles (`13d6e65`) were downstream
  fallout of touch-first polish.
- A residue `_.draggable` flag from the drag era was left unused in the controller.

## Evidence

`app.js` `selectClickTerm`/`selectDragTerm`, `e145320`, `a42669b`, `c3cfa4c`, `8dad31b`.
