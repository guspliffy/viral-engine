TASK T4: the night ending for There's a catch EP04 "copy money": the dark diner front in the snow and the oil barrel fire. One props file + bench.
WHY: the hard cut after the twist (v2 panel 08): night, snow, the diner dark and shut. The friend who had every
dollar in the city stands alone at an oil barrel burning bundles of his banknotes to keep warm. The frame must read
in one second as "the same diner, dead, and he is burning money": cold blue night, one warm fire.
DESIGN: script /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (panel 08, timing 9
and 10). The diner by day is red and chrome with tall red-framed windows (assets/plates/diner-sunny.png, look at it):
the front must be recognisably that diner from outside. Cast scale: a potato is 0.9 m wide and 1.1 m tall.
RULES: determinism rules in CLAUDE.md.
READ: CLAUDE.md; engine/page/props-bistro.js lines 1-60 (file layout, canvas textures, `KINDS` with `apply(ps)`);
engine/page/props-dino.js `campfire` and `firelog` (the house fire look: reuse its flame and glow helpers by import
if they are exported, else copy the approach); engine/page/props-energy.js lines 1-60 (`glowy`, see-through for the
checks via userData.steam); storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs (a bench
generator); nothing else unless blocked.
OWN: engine/page/props-nightdiner.js (replace the stub; export NIGHTDINER_KINDS),
storyboards/series/what-if/04-copy-money/bench/make-nightdiner-props.mjs and the JSON it writes. Touch nothing else
(props3d.js already imports the file).
CONTRACT (metres; colours hex; origin on the ground; the street side is +z):
1. `dinerfront`: the diner's street front at night, a backdrop that fills a 9:16 frame from a camera 6 to 8 m in front
   of it (spec.w 9 wide, the wall 3.3 tall, everything behind and above included):
   - a low red wall (#7a2a2a by night, chrome band #8b93a3 along its top and bottom) with four tall dark windows
     (red frames with mullions like the plate, panes near black #10141f with a faint cold reflection and one pane
     with a paper notice "CLOSED" hanging askew), a glass door at x +2.6 with a chain and padlock across its handles;
   - a flat roof edge with a rounded chrome cornice and, standing on it at x -1.0, the dead diner sign: a rounded
     board 1.6 x 1.0 with a brown cowboy hat with a green sprout on a cream face gone grey-blue, a dark unlit neon
     border, one letter-less bulb row; `flicker` 0..1 lets the border glow dull red for a moment (the generator may
     blink it once);
   - snow: 6 to 10 cm lying on the roof edge, the sign's top, every window sill and the door step; icicles under the
     cornice; a snow-covered pavement spec.d 9 deep toward +z and spec.w wide (soft blue-white #cfd9ea, a few
     darker footprints leading from x +3 to the barrel spot at x 0, z 2.4), drifts against the wall;
   - behind and above: a night sky card (deep blue #0e1630 to #1b2748 at the horizon, a few stars, no moon) 14 wide
     and 10 tall, and two dark building silhouettes with three small warm lit windows far left and right;
   - one street lamp at x -3.4, z 1.0 (2.6 tall), lit: a soft warm cone and a glow disc on the snow.
   Unlit or lightly lit materials so it stays readable at night; no outline on the sky. Solid for the checks: only
   the wall. Everything is static except `flicker`.
2. `oilbarrel`: a 200-litre steel drum, r 0.29, 0.86 tall, dented, rust-brown #6b4a3a with two rolled hoops and a
   faded stripe, holes punched near the top glowing orange, an open top with a bed of burning banknote bundles
   (green notes with cream bands, charred black at the edges) visible over the rim. Params: `fire` 0..1 (flame
   height: at 1 the flames stand 0.55 above the rim; cel-style flame shapes, yellow core #ffe27a, orange #ff9a3d,
   red tips #e2502e, moving with `clock`), `clock` (seconds, tweened by the generator), `feed` 0..1 (a flare: the
   flames jump 40 % higher and 20 sparks rise, for the moment a bundle goes in), `glow` 0..1 (a warm additive light
   pool on the ground r 1.6 and a soft warm rim light sprite that brightens what stands within 1.5 m: additive,
   see-through for the checks). Rising embers and a few burnt note scraps drifting up 1.5 m above the rim from the
   clock. The drum is solid for the checks, flames and glow see-through.
MACHINE: yours for bench stills only (`node engine/render.mjs <bench json> --stills ... --draft`, one job at a time);
no layout of the clip, no draft or full render, never the farm.
DONE WHEN:
- the bench: a plain set with a dark floor and `"sky": [[0, 1]]` (night), `never-has-money/gunslinger` at x -0.75,
  z 2.0 and `never-has-money/reaper` at x 1.35, z 2.25 either side of the barrel at x 0.25, z 2.4; camera A at
  [0.3, 1.5, 9.7] looking at [0.3, 0.82, 2.0], fov 48; camera B at [-0.1, 1.2, 6.1] looking at [-0.15, 0.82, 2.0],
  fov 36. Stills: both cameras with fire 1 at two clock values, feed 0 and 1, flicker 0 and 1
- a contact sheet at storyboards/series/what-if/04-copy-money/bench/nightdiner-sheet.png; look at it once: at 270 px
  wide it reads as a shut diner on a snowy night with a barrel fire, the two potatoes are clearly visible (not
  black), the fire is the brightest thing in frame, nothing is plain white or untextured, the frame's top 20 % and
  the band y 470 to 760 px (of 1920) are calm enough for white captions
- the file starts with a usage header: the kinds, every spec key and param with its default, sizes, origins
- deterministic: no Math.random, no clock; every frame drawable from the params alone
OUT OF SCOPE: falling snow (another task's `noterain` with look "snow"), the clip generator, cameras, acting,
sounds, engine changes.
