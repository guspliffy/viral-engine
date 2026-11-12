COMMON to tasks R1-R3: the REAL-ANATOMY rework of the animals of There's a catch EP05 (read once, then BRIEF-R<n>.md)

WHY: Jonny (producer) rejected the first animals, his words: "the t rex looks quite bad - make it look like a real
t-rex", "the animals should look more real and not like bowls fit together - rework them". The first build was
spheres and ellipsoids stuck together with big bulging toy eyes (see bench/rex-sheet.png and bench/iceage-sheet.png
ONCE: that is what NOT to build). Ignore BRIEF-COMMON.md's "cute-menacing, big bulging eyes, never realistic".

TARGET: the animal as a natural-history illustrator would draw it: real proportions, real posture, real joints,
small real eyes, drawn in the engine's clean 3D cartoon rendering (toon light, ink line). A viewer says "that is a
T. rex", not "that is a toy". Never gory. It must read on a phone at 270 px wide: get the SILHOUETTE right first.

HOW (not optional):
1. ONE CONTINUOUS SKIN. Every body part with volume is `makeLoft` (engine/page/geo.js, the header comment above it
   is the manual: sections { c, w, up, dn, n }, uv, `geo.userData.set(sections)`). The trunk of the body from the
   tail tip through the pelvis, belly, chest and neck to the back of the skull is ONE loft. Each leg is ONE loft from
   inside the body through knee and ankle to the foot. No SphereGeometry, no ellipsoid, no capsule for any body part
   (spheres only for eyeballs). Cones only for teeth, claws, horns. A loft that meets another starts 10-20 cm INSIDE it.
2. JOINTS MOVE THE SKIN. In `apply(ps)` work the joint places out from the params (plain forward kinematics, or
   2-bone IK for legs) and call `set(sections)` with the section centres on those joints, so neck, legs, tail and
   trunk bend as one skin with no gap and no ball at a joint. Pure function of the params (+ clip time `t` for a
   small idle sway only): any frame in any order gives the same picture. No Math.random, no clock.
3. PROFILE FIRST. The side silhouette comes from the section table in your brief (centre heights and up/dn make the
   back line and the belly line). Bodies are deeper than wide where the brief says so (w < up + dn).
4. SKIN IS PAINTED, NOT FLAT: one canvas texture per loft, drawn once from a seeded `rnd(i)` (copy `canvasTex` and
   the seeded rnd from engine/page/props-dino.js lines 50-83): darker back (v 0.5), pale belly (v 0 / 1) with a soft
   uneven edge, the markings your brief names, and fine marks (scales or hair strokes) each drawn once, never a tile.
5. EYES ARE SMALL AND REAL: an eyeball set INTO the head under a brow ridge, coloured iris, dark pupil, one small
   glint, an upper lid that closes for `squint` / `blink`. No white ping-pong balls on top of the head.
6. MATERIALS + GLOW: exactly the recipe of `trex` in engine/page/props-dino.js lines 88-100 and where it applies
   `ps.glow` (every material this instance's own, emissive #b8ff9a at intensity 0, c0 kept; glow 1 = a flat glowing
   silhouette plus the additive halo sprite; `ghost()` for see-through things like drool and the halo).
7. FILE SHAPE: `export const X_KINDS = { kind(P) { ... return { group, apply(ps) {...} } } }` like props-dino.js;
   a usage header on top (kinds, every spec key and param with default, sizes, origin, the joint places a director
   needs). Metres; origin on the ground between the feet; faces +z at rot 0; the prop's `scale` scales all of it.
   A param without a default in propState jumps on its first tween: list in the header which ones to seed at time 0.

BENCH (yours, in storyboards/series/what-if/05-back-to-life/bench/): a small generator like
bench/make-rex-props.mjs (read its first 45 lines), `plain` set, Spud beside the animal for scale. Stills your
brief lists. `node engine/render.mjs <bench json> --stills <t,...> --draft --safe`, then
`node qa/contact.mjs out/<id>-*.png --out <sheet.png>`. LOOK at your sheet and compare the side view with what the
real animal looks like; fix and re-render (at most 3 looks). Two other builders share this 4-core box: expect waits,
one render at a time each.
DONE ONLY WHEN: your side still passes the "real tells" list of your brief line by line (write PASS/FAIL per line in
the report); no part is a visible ball; no seam, gap or hole at any joint in any still; nothing white, black or
untextured; feet on the ground (y 0) when standing.
OUT OF SCOPE: the clip generator, cameras, acting, sounds, props3d.js (your export is already registered there),
engine/page/geo.js, other props files, qa/golden.mjs, commits.
REPORT format of .claude/agents/builder.md, plus the PASS/FAIL list.
