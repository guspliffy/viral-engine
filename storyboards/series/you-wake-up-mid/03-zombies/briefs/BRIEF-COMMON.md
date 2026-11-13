# You wake up mid EP03 "mid zombie apocalypse": what every builder task shares

Story: you wake up on a zombie street with six bullets and your best friend; you shoot your way into a building, up the
stairwell, onto the roof, spend the last bullet, jump the 2 m gap to the next roof from standing, fall short into the
alley of zombies, and wake up mid a 1968 smoke-room experiment. Serious, tense, realistic, NO blood or wounds ever.

THE DESIGN IS WRITTEN: storyboards/series/you-wake-up-mid/03-zombies/DESIGN.md. Read the rules at its top and your
own section; build exactly those numbers. Where a number is impossible, pick the nearest that works and say so.

- World metres. x right, y up, z toward the camera. `rot` degrees about y; at rot 0 a thing faces +z.
- House look: hand-drawn anime, painted canvas textures (every mark drawn once, hashed from an index and `spec.seed`,
  nothing tiled), ink lines on hard edges, hatching only on shade faces; cel shading comes from the engine.
- Deterministic: no `Math.random`, no wall clock. `apply(ps, t)` gets the clip time `t`; anything that moves is a pure
  function of its state and `t`.
- A kind is `kind(P) { ...build into P.whole...; return { grip: 0, apply(ps, t) {...} }; }` like the z-files named
  under READ. State keys read `ps.<key> ?? spec.<key> ?? default`; list every tweenable key in the file's `<NAME>_STATE`
  export as `{ kind: { key: default } }`. The stub file is ALREADY registered in engine/page/props3d.js: replace its
  body, keep the three export names, do not touch props3d.js.
- Set meshes `userData.solid = false`; flat painted cards, glows, smoke: `material.userData.noOutline = true`, steam,
  no shadow. Lights the look brings: range 60 m at most, off when the look is not in view (or keyed to a state).
- The file starts with a usage header: each kind, every spec key with its default, sizes, the origin, every state key
  with what 0 and 1 look like, and the camera starting points from DESIGN.md. The director reads only that header.
- Bench: one generator `storyboards/lookdev/make-<name>-bench.mjs` writing its json next to it, set
  `{ type: "plain", color: "#aab0b4", floor: "none" }`, no cast, one camera per thing to show (use DESIGN.md's cameras),
  `node engine/render.mjs <json> --stills <times> --draft --silent`, then `node qa/contact.mjs <pngs> --out <sheet>`.
  `export CHROME_PATH=/opt/pw-browsers/chromium` first. Look at your own sheet once before reporting and fix what is
  plainly wrong (one fix round). No layout pass, no full render, no commit, no push.
- Three tasks run at the same time on a 4-core box: stills only, at most 8 stills per run.
- Report (at most 150 words): files written, the sheet's path, what differs from DESIGN.md and why, open issues.
