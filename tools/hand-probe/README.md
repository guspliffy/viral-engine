# Hand probe (prototype, not for merging)

Measuring tools from the quality plan (`docs/QUALITY-PLAN.md`, section 4, 5 Nov 2026). Branch `quality-demo-hand-frame`.

- `engine/page/potato.js`: `"rig": { "hand": "swing" }` swings the hand's base frame from out-and-forward onto the
  forearm (instead of the look-at from a fixed reference); `"swing2"` also lets the shoulder-to-hand line take over on
  every frame when the forearm is under 14 cm. Without the flag every clip renders as on main. The layout also records,
  per hand and frame, why the hand is turned the way it is (`dbg`: forearm length `yl`, forearm direction `y`, `cond`
  how far the forearm is from the look-at's singular direction, and the weights of the fist, palm, cupped, paw and
  locked-frame turns).
- `count-checks.mjs <scratch> <sb...>`: layout-time check counts, `lay/before/<name>` against `lay/after/<name>`.
- `why-pops.mjs <layout> <sb>`: each hand pop with the hand-frame record of both frames.
- `classify-pops.mjs <layout> <sb> [<layout> <sb> ...]`: each pop sorted by its main cause.

Run from the repo root: `node engine/render.mjs <sb> --layout --out <dir>`, then the scripts on the layout.
