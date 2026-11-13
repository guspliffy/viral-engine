# Survive it "How to survive a zombie apocalypse" (version B): what every builder task shares

Jonny's rule for this series (11 Nov 2026): REALISTIC and tense, a little dry humour, no absurdity. Nothing magic,
no fire, no blood, no wounds. The five friends keep their normal golden colour. The look is the house look:
hand-drawn anime, painted canvas textures (every mark drawn once, hashed from an index and `spec.seed`, nothing
tiled so that it reads computer-made), cel shading comes from the engine.

The story in one line: five friends are locked in a fifth-floor flat, hundreds of zombies fill the street below, and
the only way to food is a ladder laid from the balcony to the roof of the shop building across the street.

- World metres. x right, y up, z toward the camera. `rot` degrees about y; at rot 0 a thing faces +z.
- ZOMBIES are potatoes that have gone off: dull grey-green wrinkled skin (#8d9a78 to #6f7d62), many long pale
  sprouts (#e9e2c8, some with a mauve tip) out of the head and shoulders, milky blank eyes (no pupil), a dark mouth
  hanging open, stiff arms. Sad and eerie, never gory. Same body plan as the cast: a potato body about 0.95 m tall
  with the face ON the body, thin dark limbs, small hands, boots.
- Deterministic: no `Math.random`, no wall clock. A kind's `apply(ps, t)` gets the clip time `t`; anything that moves
  is a pure function of its state and `t` (any frame in any order gives the same picture).
- A kind is `kind(P) { ...build into P.whole...; return { grip: 0, apply(ps, t) {...} }; }` like the files named under
  READ. State keys are read as `ps.<key> ?? spec.<key> ?? default`. List every state key a "prop" action may tween in
  the file's `<NAME>_STATE` export as `{ kind: { key: default } }` (the registry in props3d.js already spreads it into
  the prop state; do not touch props3d.js).
- Set pieces nobody holds: every mesh `userData.solid = false` (the cast stands in and on them). Flat painted cards
  and glows: `material.userData.noOutline = true`.
- The file starts with a usage header: each kind, every spec key with its default, the size, where the origin is,
  every state key with what 0 and 1 look like. The director reads only that header.
- Bench: one generator `storyboards/lookdev/make-<name>-bench.mjs` writing its json next to it, set
  `{ type: "plain", color: "#aab0b4", floor: "none" }` (overcast sky, no ground), no cast unless the brief says so, one
  camera per thing to show, `--stills` at the listed times with `--draft --silent`, then
  `node qa/contact.mjs <pngs> --out <sheet>`. `export CHROME_PATH=/opt/pw-browsers/chromium` first. Look at your own
  sheet once before reporting. No layout pass, no full render, no commit.
- The three tasks run at the same time on a 4-core box: render stills only (never `--layout` or a draft video), at
  most 8 stills per run.
