# Hand probe

Measuring tools for the hand rig (`docs/QUALITY-PLAN.md` item 2, 5 Nov 2026). They read layouts, nothing here runs in a
render.

`engine/page/potato.js` records per hand and frame why the hand is turned the way it is, in the layout's
`contacts[].actors[].dbg` (`R`, `L`): forearm length `yl`, forearm direction `y`, `cond` how far the forearm is from the
base frame's singular direction, the weights of the fist (`w`), palm (`pal`), locked-frame (`fr`), cupped (`up`) and paw
(`dn`) turns, and `lim` (over 1 = the wrist turn was folded back at its limit). With `"debug": { "forearm": true }` it
also records the hand minus elbow (`a`) and hand minus shoulder (`s`).

- `count-checks.mjs <scratch> <sb...>`: layout-time check counts, `lay/before/<name>` against `lay/after/<name>`.
- `why-pops.mjs <layout> <sb>`: each hand pop with the hand-frame record of both frames.
- `classify-pops.mjs <layout> <sb> [<layout> <sb> ...]`: each pop sorted by its main cause (whole-body turn, frame 0,
  palm switch, forearm fold, wrist limit, ...).
- `forearm-eval.mjs <tagdir> <sb...>`: offline, how often candidate forearm formulas turn over 40 / 60 degrees in a
  frame (needs layouts made with `debug.forearm`).
- `base-eval.mjs <tagdir> <sb...>`: offline, the base frame's turn per frame for the look-at and the swing variants.

Run from the repo root: `node engine/render.mjs <sb> --layout --out <dir>` (under `xvfb-run`), then the scripts on the
layout. To measure rig 2 on an old storyboard, copy it with `"rig": { "hand": 2 }` added.
