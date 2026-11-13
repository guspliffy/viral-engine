# EP09b gorge look, V2: a design delta on DESIGN.md 1.1-1.5 (13 Nov 2026)

Why: Jonny on draft 1: "the cliff is close to not recognizable". Target: `redo/board-01-07-09-13.png`.
Three causes, three fixes: (1) the walls are flat planes with strata, so add vertical relief; (2) both walls are
almost all in open shade (sun from -x/+z, rim shadow below y -5.8), where the cel shader has ONE tone, and the
haze mixes 60 % pale at y -30, so shade by relief depth and facet side, and grade dark-blue instead of pale;
(3) the ledge top is painted per grid quad (tiles), so paint it per fragment.
One file: `engine/page/props-gorge.js`. No new prop, param or VOCAB name. Everything not named here stays.
This supersedes DESIGN 1.2 "never darker than #5c5364" and the 1.4 haze numbers. Hashes only (`hs`/`hz`).

## 0. Kept exactly (the clip depends on these)
Lip z 0, near top y 0, stage x -8..8 z 0..10 dead level and solid · far lip z -9, y 0.4 · chunk/notch outline,
`NOTCH`, `OUTLINE`, `lipbreak`, `crumble`, the patch x -1.6..1.6 z 0..1.2 · all GORGE anchors · bridgerope,
planks · `prof()`, wall planes z 0.25 / -9.25 · `clampB` (unchanged, applied AFTER the relief) · the rim-shadow
line (it reads world z, so it follows the relief by itself) · corridors A (x -1.2..1.2, z -5.6..-3.4, y 0..-40)
and B (x -1.2..1.2, z -1.6..-0.15, y -0.5..-40): no rock, plant or rim block inside, ever.

## 1. Wall relief: R(x, y) in metres, + = out into the gap
In `zIn`: `z = clampB(prof(near, y) - side * (R(x, y) + b.step*0.5 - dz), x, y)`. Bed steps halved and bed tones
lerped 50 % toward TONE.A: the strata stay as a faint second read. R is a SUM OF FEATURES, each
`amp(y) * shape(x)` with shape piecewise linear in x at FIXED breakpoints. Push every feature's breakpoints
(|x| <= 36 only) into every bed's `xs` (dz interpolated, w 0): R is then exact on every shared edge, no seams.
- Buttress (trapezoid): centre c, half-width hw, flank fractions fl, fr (0.18..0.45, hashed): breakpoints
  c-hw, c-hw(1-fl), c+hw(1-fr), c+hw; shape 0, 1, 1, 0. `amp(y) = A * clamp((top - y)/1.2) * (0.8 + 0.4*vn(y/7 + c))`
  (vn = value noise from hs, linear). The shoulder at `top` is a ledge: plants sit there (section 4).
- Fin: a buttress with hw 0.35..0.6, A 1.2..2.0, fl = fr = 0.45.
- Chimney (V recess, the dark slot): breakpoints c-hw, c, c+hw; shape 0, -1, 0; hw 0.3..0.6;
  `amp = D * clamp((top - y)/1.5) * clamp((y - bot)/3)`.
- Hero features (fixed, they frame the cameras). `B c hw A top` / `F` fin / `C c hw D top bot`:
  NEAR: B -4.3 1.3 1.7 -1.4 · B 3.9 1.1 1.6 -2.0 · B -8.8 1.6 1.8 -3.5 · B 8.2 1.4 1.5 -1.2 · F -6.4 0.5 1.6 -5 ·
  F 6.0 0.45 1.3 -8 · C -2.3 0.4 1.1 -0.45 -50 · C 2.4 0.35 0.9 -3 -38 · alcove B 0 1.4 -0.5 -6 (a recess).
  FAR: B -3.8 1.5 2.0 -2.2 · B 3.6 1.2 1.7 -4.5 · B -9.5 1.8 2.2 -1.5 · B 8.9 1.5 1.9 -7 · F -6.3 0.5 1.8 -3 ·
  F 6.1 0.55 1.5 -1.0 · F 1.9 0.3 0.9 -10 · C -1.9 0.4 1.2 -3 -45 · C 2.6 0.35 1.3 -0.05 -60 · C -7.4 0.5 1.4 -0.05 -40.
- Hashed features everywhere else (|x| > 11 to xMax): per 7.5 m cell one buttress with probability 0.8
  (hw 1.0..2.2, A 0.7..1.8 near / 0.8..2.2 far, top -1..-14 as -1 - 13*h^2); per 11 m cell one fin (p 0.5,
  top -1..-20); per 4.3 m cell one chimney (p 0.6, D 0.6..1.4, top -0.45..-10, bot -25..-65).
  Beyond |x| 36 the relief is sampled at the joints only (no breakpoints): rough is fine there.
- Clamps, in this order. Total R in [-1.5, cap]. NEAR cap: 0 for |x| <= 1.5, rising linearly to 1.8 at |x| 2.6.
  FAR cap: 1.2 for |x| <= 2.2 (z <= -8.05 above y -30, <= -7.2 at -40; the limit is -6.0), 2.2 beyond.
  Both walls, |x| <= 1.6 and y > -6: R in [-0.15, 0] (flat behind the bridge remains and the notch).
  Top: R+ is 0 at yTopW by the `top` ramps; recesses may reach the top, so the lip slab's underside goes back
  1.8 m behind the lip and the dark backing sheet moves to `prof + side*3.2`. Still closed from every angle.
- Normals: the true face normal of each triangle (split each wall quad in two; `hint` only picks the sign).

## 2. Jagged tops
- Near lip plan (`lipN`): unchanged for |x| <= 1.5. Else `z = J(x)*ramp`, J = 0.6*vn(x/2.3) + 0.25*vn(x/0.7)
  mapped to -0.6 (out) .. +0.2 (bite, never deeper: the wall plane is 0.25), ramp 0.12 at |x| 1.5 -> 1 at |x| 4.
  LIPX step 0.25 for 2 < |x| <= 12. Far lip (`farN`): +-0.08 for |x| <= 2, else -9.2..-8.4 the same way.
- Rim blocks (boxGeo / ico d0, turned and tilted by hash, tones of 3.1, not solid). NEAR: 14 at 3.2 <= |x| <= 30,
  z lip+0.15..1.6, 0.25..0.9 m (<= 0.45 m high and z <= 0.9 inside |x| 8); none in x -3..3. FAR: 22 teeth
  on z -9.3..-11, 0.4..2.2 m high, 0.5..1.4 wide, none in |x| < 1.6, <= 0.5 m high in the clearing x 3.4..8.4.
  Keep 0.6 m clear of every bridgerope post and anchor.

## 3. Colour and depth (cel shader `GFS`, wall modes 1, 2, 6 unless said)
3.1 Tones (lit / mid / shade): rock A #b4bcc8 / #7c88a0 / #47536f (B, C, D: today's, 50 % toward A) ·
crevice #1e2338 · deep shade = shade * 0.62 · warm sun #e9d3a4 · slab face #6a6672 / #4c4857 / #34303f ·
slab underside #2a2733 · fresh break stays #dcc9a6.
3.2 Shade gets three tones. Port `prof()` to GLSL; `r = (vW.z > -4.5) ? profN(y) - vW.z : vW.z - profF(y)`.
- `ndl -= 0.5*h` becomes `0.15*h` (no facet patchwork).
- Where kH == 0: `kF = bandStep(0.15, dot(N, normalize(vec3(-0.80, 0.35, 0.0))))`; `c = mix(deepShade, vShade, kF)`:
  the +x flank of every rib goes dark, as a vertical shape.
- `c = mix(c, CREVICE, 0.85 * (1.0 - bandStep(-0.45, r)))`: chimneys and recesses are dark slots.
- In shade, `c = mix(c, vMid, 0.35 * bandStep(0.9, r))`: proud buttress fronts catch the sky.
- Warm tops: today's uW* tint only where kL == 1, and wider: `mix(c, WARM, 0.55 * smoothstep(-5.0, -0.5, y) * kL)`;
  faces with N.y > 0.6 (shoulders, ledge tops) above the rim shadow: lit #d8c79c.
3.3 Depth grade replaces `depthHaze` (same call site, all modes but the river's): mix toward #1d2a47 by
0 at y >= -3 · 0.30 at -20 · 0.55 at -40 · 0.70 at -70 (linear between). Then mist toward #6f8fb5:
`0.12 * smoothstep(-25, -60, y)` (a glow over the river so the floor is not black). Then distance haze toward
#a9bdd6: 0 at 45 m from the camera, 0.40 at 170 m (was 0.7 at 150). Flora, ridges take all three as today.
3.4 Floor and river: gravel banks #46505e, boulders #2c3442, floor beyond the banks #22343a (final colours,
no grade on top). River 1.8 m wide (was 2.6), base #d6efe6, channel #8fc7b4, foam as is, full strength.

## 4. Greenery on the walls (flora Geo; tones lit #86a652 / mid #4f7a48 / shade #2b4a40, pines as 1.4)
Shrub = 2..3 squashed icos (d 1 above y -20, d 0 below), r 0.35..0.9. Clinging pine 1.5..3.5 m, `out` as today.
Inside |x| <= 30: NEAR 26 shrubs + 9 pines, FAR 40 shrubs + 14 pines, on top of today's lists. Where: first one
shrub clump on EVERY buttress and fin shoulder (c, top) and a pine on every third; the rest hashed onto bed
ledges, 60 % above y -15, 30 % y -15..-30, 10 % below. z from `W.zAt`. Keep-out: near wall none in |x| < 2.2;
far wall in |x| < 2.2 only if z + reach <= -6.2. Far rim: 10 more juniper clumps between the teeth.

## 5. Near ledge top (mode 7) as a rocky clifftop
- No per-quad paint: `nearPaint(zc)` only (drop h); delete the straight joint decals inside the stage. Keep the
  lip's two cracks and the chunk rides.
- Rock top tones #b9b4a6 / #8f8a8c / #5f5a6a replace SLAB on the top, the patch and the chunk's top.
- Per fragment in mode 7: jittered Voronoi on `vW.xz * vec2(1/2.0, 1/1.3)` (3x3 cells, hs1). Tone by cell hash:
  x1.0, x0.90, warm #c4b596, cool #a3a6a8. Crack #2f2b36 where (d2 - d1) < 0.014 on 55 % of the borders.
  Moss #7d9150 at 60 % in 12 % of the cells for z < 2.5, rising to 45 % of the cells at z 6; EARTH from z 6..16.
- The path decal `pa`: strength 0.6, colour #a8946c.
- Lip edge: pass the distance to the lip in `vP.z` (0 at the lip, clamp 1). Where
  `vP.z < 0.10 + 0.12*hs1(floor(vW.x/0.23))`: mix 50 % toward #ddd3bd (a worn, chipped rim).
- Slab front face (and the chunk's front): top 0.06 m #d8ceb6, the rest the dark slab-face tones of 3.1.
- Grass tufts (the wall-ledge grass helper, 0.10..0.25 m): 60 on 3 <= |x| <= 14, z 0.1..9; 12 along the lip at
  1.7 <= |x| <= 3, z < 0.22, <= 0.14 m. Pebbles as today. NOTHING raised in x -3..3, z 0.25..3: paint only.

## 6. Budget and checks
Added triangles, estimate: walls 95k (breakpoints only in |x| <= 36) + plants 18k + rim blocks 3k + tufts 1k =
about 117k, under the 150k cap. Print the gorge's triangle count once at build; if the delta is over 150k, cut the
breakpoint zone to |x| <= 24. Raise the `rock` Geo capacity as needed. Shader cost: one 3x3 Voronoi on the top only.
Builder checks before handing back: stills from the four cameras (hook, rope side-on, 11.5 s straight down,
14 s lip) on one contact sheet next to the board; an assert in the builder that no rock or flora vertex lies in
corridor A or B; `node qa/golden.mjs` (engine/ changed).

## 7. Camera note for the opening shot (9:16; hand-computed, confirm with `qa/camfit.mjs`)
Fact: from behind the friends the near ledge hides the far wall below `y = -9 * camY / camZ`. The board-like
low camera (0, 3.0, 4.6) shows only the top 6 m of wall: it cannot show the drop, whatever the set looks like.
- A, high over the shoulders: pos (0, 5.6, 2.4), look (0, -3.2, -4.6), fov 54. Far wall from its lip (top of
  frame) down to y -21 over 77 % of the height; Chip at 37..42 % from the top, centred; Spud and Wedge from
  above-behind at 85..91 % from the top, x +-0.57 of the half-width: check the caption/UI zone. The near wall
  shows only as the hero shoulders at x -4.3 and 3.9 at the frame edges. No river.
- B, crane over the lip: pos (0, 9.5, 0.4), look (0, -8, -3.6), fov 60. The whole far wall, the near wall's
  buttresses on both sides (down to y -34), and the river as a bright line just above the lip (about 64 % from
  the top); Chip at 32 % from the top; Spud and Wedge at 74 % as heads and shoulders from above, each only
  14 % of the frame wide. Camera y 9.5 is above the 1.5 safe box but looks down: no horizon in frame.
A reads the friends better; B is the only one of the two with both walls AND the river.
