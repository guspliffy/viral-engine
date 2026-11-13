# EP03 "mid zombie apocalypse": DESIGN of the three new looks (12 Nov 2026)

Target: OUTLINE.md v3 (Jonny's sheet is not in the repo yet; the outline wins). Builders build exactly these numbers,
one file per look: `engine/page/props-zroof.js`, `props-zstairs.js`, `props-zwait.js`, each with a usage header and a
`<NAME>_STATE` export as in props-zfight.js. Reused, not designed here: zstreet, zhorde, zrevolver, zshot, zstreetdoor,
zroom, zdoor, the rigged zombies, the zombie look (skin #7f8c6c, sprouts #e9e2c8, eyes #eceed9, never blood).

Rules for all three:
- Local metres, x right, y up, z toward the default camera, as the z-props. Each look is ONE kind holding its whole
  place. Stand them 300 m or more from each other and from zstreet (far plane 300): e.g. x 400, x -400, z 400.
- The clip's set is one plain grey sky, so each look brings its own sky or walls AND its own lights (as zstreet's dawn
  spot, zroom's dim): range 60 m at most, off while the look is hidden. zstairs and zwait draw only the inner faces of
  walls, slabs and ceilings, so a camera may stand outside them.
- A pure function of spec, state and t; every mark painted once from an index and spec.seed. Set meshes solid = false;
  cards, glows, smoke, light patches: steam, noOutline, no shadow. Ink on hard edges, hatching only on shade faces.

## 1. ZROOF (kind `zroof`; panels 08-13 and the SEED insert of 04)

Origin: the middle of the gap, at deck height (y 0 = both roofs), on the jump line (z 0). The gap runs along z.
Bearings: theta degrees from +x toward -z, direction (cos theta, 0, -sin theta).

| Thing | Where | Size |
|---|---|---|
| Roof A, ours | x -15.0..-1.0, z -11.0..+7.0, deck y 0 | 14 x 18 m |
| Roof B, the far roof, the SAME height | x +1.0..+13.0, z -11.0..+7.0, deck y 0 | 12 x 18 m |
| The gap at roof level | x -1.0..+1.0 | 2.0 m |
| Alley: walls x -1.4 and +1.4, ground y -12.0, open at both ends | z -11.0..+7.0 | 2.8 x 18 m |
| Front street, ground y -12.0 | z +7..+16, x -40..+40 | 9 m (asphalt 6, pavements 1.5 at +0.15) |
| Kiosk, the roof door in its +x face | x -8.6..-6.0, z -1.6..+1.6, y 0..2.62 | |
| The lane: bare tar, nothing stands in it | x -6.0..-1.36, z -1.5..+1.5 | 4.64 m from door to lip |
| JUMP SPOT: the low lip, top y 0.30 | x -1.36..-1.0, z -1.5..+1.5 | the cast stands on z -1.0..+1.0 |

- **Buildings.** Two brick blocks, 4 storeys of 3.0 m. Brick = zstreet's shop brick: base #7d6a60, strokes #867066
  #73625a #8c7a6e #6b5c54, mortar rgba(205,190,165,0.55), a string course #cbbfa4 at y -9, -6, -3; in full on both alley
  walls and both fronts (z +7). Windows 0.9 x 1.2, sills at y -10.9, -7.9, -4.9, -1.9 (stones 0.10 proud), at z -9.2,
  -5.6, -2.0, +1.6, +5.2 on the alley walls, every 3.5 m on the fronts; none lit, 25 % broken, 15 % boarded.
- Cornice, both alley sides: the top 0.60 m steps out in 5 courses of 0.08 m, from the walls (x -1.4 and +1.4) to the
  lips (x -1.0 and +1.0). So the roofs are 2.0 m apart over a 2.8 m alley.
- A's parapet on all four edges: brick 0.30 thick, 0.60 high, stone coping 0.36 x 0.06 #cbbfa4 (gap side: coping x
  -1.36..-1.00). JUMP SPOT: for z -1.5..+1.5 it is 0.30 high, same coping: the old fire-ladder landing, two rusted hooks
  (#7a4a32) over the coping at z -1.3 and +1.3, 1.5 m of torn ladder hanging outside at z +1.3.
- B's gap edge has NO parapet: a pale stone kerb x +1.00..+1.36, top y 0.15, the whole edge long, a 4 cm dark drip line
  under it, then the 5 cornice steps: nothing to grab, the edge "just out of reach". Behind it a bare landing zone (x to
  +4.6, z -2..+2), then a shut hatch 0.9 x 0.9 x 0.25 at (5.6, -0.6) (the way down they never reach), a chimney 1.2 x
  0.6 x 1.9 at (10.5, -6.0), vents at (8.0, 3.5) and (5.5, -7.5). B's other edges: the 0.60 parapet.
- Six neighbour boxes, painted fronts, tar roofs (x0..x1, z0..z1, top y): 13.2..30, -11..7, -3; -31..-15.2, -11..7, -2;
  -30..-4, -31..-19, +2; -2..24, -33..-19, -2; -40..-6, 16..28, -3; -4..40, 16..30, 0.
- **Kiosk and door.** Brick box, walls 0.25, concrete cap 2.9 x 3.5 x 0.12 (0.15 overhang). Opening in the +x face: z
  -0.5..+0.5, y 0..2.05, steel frame 6 cm, sill flush with the deck. Leaf: steel 1.0 x 2.05 x 0.05, outside #4f5a52,
  rust #7a4a32 on the bottom 0.3 m, a wired pane 0.2 x 0.3 at y 1.5; inside #6a766c, a push bar at y 1.0.
- State `open` 0..1 (0): the hinge axis is (x -6.0, z -0.5) and the leaf swings OUT and round toward -z; 1 = 172
  degrees, flat on the kiosk wall (z -1.5..-0.5), so it never hides the doorway from a camera at +z or on B. The burst
  is the director's tween (0 -> 1 in 4 frames, back to 0.9, to 1). State `shake` 0..1 (0): 0.9 degrees, 6.5 Hz.
- Inside: #17130f, a landing at y 0 from x -7.3 to -6.0 (a zshot zombie stands in the doorway on it), then 3 steps down
  toward -x (rise 0.167, run 0.28). State `behind` 0..1 (0): a painted card 1.0 x 2.0 at x -7.35 with 4
  head-and-shoulder shapes coming up the steps, tops at y 0.95, 0.80, 0.60, 0.40, skin #4f5846, each 2 milky eyes 5 cm
  and 6-9 pale sprouts; head i shows from behind = 0.25 i and sways 2 cm at 0.7 Hz, phase hashed.
- **Roof A.** Tar felt: base #5d5f61, strokes #6a6c6e #505254 #646668, felt seams every 1.0 m along z, 9 tar patches
  0.8-2.6 m #3a3b3d, 5 puddles 0.5-1.4 m mirroring the glow (#d98a4e at 0.55; none in the lane). Painted shadows: 30 %
  dark, soft, pointing -x, 4.7 x the height, cut at 3 m.
- Water tank at (-12.4, -3.4): steel stand 2.4 x 2.4 x 1.8, stave tank 2.6 across x 3.0 tall, #6b5446, 4 hoops, cone lid
  0.7; top y 5.5. Chimney 1.2 x 0.6 x 1.9 at (-13.9, 3.8). Mushroom vents (0.40 across, 0.70 tall, #8e8a82) at (-4.6,
  -5.2), (-9.4, -6.0), (-12.6, 1.2). Skylight 1.8 x 1.1 x 0.55 at (-3.8, -8.2). Mast 3.2 m at (-10.6, 5.6).
- **Sky, burning city, smoke.** Dome r 240: zenith #4b4a52, 40 degrees up #6e6266, 10 degrees #7a6e6c; 6 smoke bands,
  tops #3e3b42, bellies #c9703a over a fire. Three fires light the horizon: F1 theta 15, 110 wide, strength 1.0; F2
  theta 105, 60 wide, 0.6; F3 theta 170, 60 wide, 0.45. At strength 1: core #ffc27a up to 4 degrees over the middle
  third, #f08a3c to 10 degrees, gone by 25. theta 215..330 stays dark slate.
- Skyline: 3 painted ribbons, a full ring, feet at y -12: r 90, tops y -3..+9, #2b2629; r 140, tops +2..+16, #4a3b3a; r
  200, tops +6..+26 with 3 towers and a spire, #6e5148 (farther = paler and warmer). No lit windows; 14 with fire inside
  (#ff8a2a). Flames on 3 roofs of the r 90 ribbon in F1 and on a car in the front street at (9.0, -12, 11.5): 2-5 m,
  hard bands #ffe9a8 #ff9a2a #c9401a, 3 painted shapes each, swapped 8 times a second.
- Glow cards between the ribbons: 5 in F1, 3 in F2, 2 in F3, each 30-60 m wide x 14-25 m tall, #ff7a1e, additive, 0.55
  at the centre. Flicker, always on: card i x (1 + 0.10 sin(2 pi 1.3 t + a_i) + 0.06 sin(2 pi 3.7 t + b_i)).
- Smoke columns: 7 cards at theta -20, 5, 22, 48, 98, 112, 172, feet at r 90-140, 8-14 m wide at y +2 widening to 25-45
  m at y +110, leaning 25-35 degrees along the wind (toward (-1, 0, 0.2)); #2e2a2e, the lowest 25 m lit #b8602e. Streaks
  scroll up 3 m/s; each sways 1.5 degrees over 11 s. Ash: 120 flakes of 1-2 cm round the camera, #cfc8bd, 0.35 m/s.
- States: `fire` 0..1 (1) scales glows, flames and the key light (0 = embers at 15 %). `smoke` 0..1 (1) scales columns
  and ash. `dusk` 0..1 (1): at 0 the dome, glows, flames, columns and warm lights are gone, the clip's grey sky shows
  (SEED: 0.3).
- **Light, smoky orange-grey dusk (all x `dusk`).** Key: direction TO the light (0.945, 0.208, -0.253) (F1, 12 degrees
  up, from beyond roof B), #ff9d5c, x `fire`, F1's flicker at 6 %: faces turned to the gap are warm, the kiosk door is
  front-lit.
- Back rim: TO (-0.25, 0.17, -0.95) (F2), #ff8a4a, 0.35 of the key. Fill: sky #6a6672, ground #3b302d. Key to fill 1.6
  to 1. As seen: brick lit #a8714f, shade #4a3f42; tar lit #6f5f56, shade #3b3739; coping and B's kerb lit #d9b48c,
  shade #857a76 (in shade the kerb is still 3 x brighter than the brick under it).
- Alley: a slot light straight down, #c9a48a, on x -1.4..+1.4 only; a point light #ff9a4a at (0.8, -9.5, 9.0), range 14
  m, flicker 16 %. Walls as seen: top 3 m #7a5644, middle #4a3b3a, bottom 3 m #2e282b; upturned faces 1.8 x brighter
  than that.
- **Hordes (reused zhorde; positions in zroof's frame).** Alley: at (0, -12, -2), box [1.9, 17.6], n 90, seed 5; `up` 0
  -> 1 as the pair jumps, `reach` 1 from panel 12, goal gx 0, gz 2 (under the fall). `adv` stays 0 (zhorde's rings round
  the goal would stand inside the walls). The raised hands top out at y -10.5. Front street (only "08 streets" sees it):
  at (0, -12, 11.5), box [44, 7.0], n 400, seed 9, avoid [[9.0, 0, 4.4, 2.0]] (the burning car).

Cameras (pos -> look, vertical fov; starting points for qa/camfit.mjs). A standing jump carries the feet 1.4 m, so the
fingertips end 0.4 m short of B's kerb.

| Shot | Camera | In frame at 1080 x 1920 |
|---|---|---|
| 04 SEED | (0, -10.6, 13.5) -> (0, 0.5, 4.0), fov 50, `dusk` 0.3 | two cornices, the 2.0 m slot of sky 320 px wide |
| 08 burst | (-1.8, 1.0, 2.8) -> (-6.0, 1.2, 0), fov 50 | the door 830 px tall, F3's glow round the kiosk |
| 08 reveal | (-8.0, 5.0, 0.8) -> (1.0, 1.4, 0), fov 60 | cast in the lane, the gap a dark band 180 px, B, skyline |
| 08 streets | (-1.5, 6.0, 5.5) -> (3.5, -12, 12.0), fov 55 | both roof corners, alley mouth, 11 m of street, zombie 76 px |
| 09, 10 | on B: (2.6, 1.7, 0.7) -> (-6.0, 1.0, -0.2), fov 50 | A's lit wall bottom 320 px, Spud (x -3) 440 px, door 490 px |
| 11, 12b | (0, 2.6, 7.2) -> (0, -2.5, -2.0), fov 60 | pair 290 px, 310-600 px from the top; hands in the bottom 40 % |
| 12a reach | (0.9, -0.9, 2.2) -> (0.55, 0.25, 0), fov 45 | B's kerb at the right, hand 110 px, the miss (0.4 m) 370 px |
| 13 fall | (0, 3.0, 0.2) straight down, screen top = -z, fov 36 | hands strip 552 px wide, zombie 162 px, pair 394 -> 284 px (y -6 -> -9.5) |

## 2. ZSTAIRS (kind `zstairs`; panel 07)

Origin: the hall floor (y 0), on the shaft's centre line, at the first riser of flight 1. Shaft inside x -1.3..+1.3.

| Thing | Where | Size |
|---|---|---|
| Hall, floor y 0, ceiling y 2.82 | z 0..+3.4 | 2.6 x 3.4 m |
| Flight 1, up toward -z | x +0.1..+1.3, risers at z 0, -0.28 ... -2.24 | 9 risers of 0.1667, 8 treads of 0.28, 1.2 wide |
| Half landing, top y 1.50 | x -1.3..+1.3, z -3.74..-2.24 | 2.6 x 1.5 m |
| Flight 2, back toward +z, up to y 3.0 | x -1.3..-0.1, risers at z -2.24 ... 0 | same steps |
| First-floor landing, top y 3.0, slab 0.18 | x -1.3..+1.3, z 0..+1.5 | well between the flights x -0.1..+0.1 |
| Flight 3 over flight 1: its underside only | 2.82 above the nosings | to y 4.32 over the half landing |
| Window W in the back wall (z -3.74) | centre x +0.7, y 2.40..3.90 | 0.9 x 1.5 m, 2 x 3 dirty panes |
| Opening D in the front wall (z +3.4, 0.12 thick outside) | x 0..+1.0, y 0..2.1 | zdoor at (0.5, 0, 3.4), rot 180 |

- spec `door` false closes D with a painted door card; above y 6 the well is a dark card. Steps: concrete #8e8a82, the
  middle 0.6 m of each tread worn pale #a8a49b, a 3 cm nosing strip #3a3d41, risers #6a6e72. Hall floor: zstreetdoor's
  tiles.
- Rails: on the well side of both flights a steel balustrade, top rail (flat bar 5 x 1.2 cm) 0.90 above the nosing line
  and 0.95 above landings, square balusters 1.5 cm every 0.14 m, newels 4 cm at each turn; on the outer walls a 4 cm
  tube at 0.90 on brackets every 0.9 m. Paint #2b2f2c, worn to steel #8a8f8a on top.
- Walls: an oil-paint dado 1.4 m high following the stairs #5f6f5c, a 3 cm line #3d4a42, cream gone grey #b9b29c above.
  Peeling: 22 patches 0.15-0.6 m of bare plaster #8e8a82, curled pale flake edges, a 2 px shadow; 7 cracks.
- **Light: dim, three sources and no other (ambient #3a3d41).** W, the brightest thing: #d8b890, the first warm light of
  the clip (the bridge from the grey street to the dusk roof). A painted patch 0.9 x 1.6 m on the landing and the top 3
  treads, a soft shaft card at 0.12. A zombie at the head of flight 1 stands as a silhouette against it.
- L, a caged bulkhead lamp 0.22 x 0.14 on the left wall at (-1.28, 3.55, -3.0): point light #ffcf8a, range 5 m, and a
  painted pool r 1.5 m on the wall. Flicker from t: tick k = floor(15 t); a tick is dark (level 0.12) when hash(k) <
  0.10 or k mod 26 is 0, 1 or 3 (a triple stutter every 1.73 s), else its level is 1 - 0.06 hash(k + 500). L lights the
  left half of the landing, where the second zombie waits: it shows only on the bright ticks. As seen in shade: dado
  #3a4438, cream #6e6a5e, steps #55585a.
- The street door, behind and below the camera: cool daylight #aab4b8, painted on the hall floor and flight 1.
- States: `crack` 0..1 (0), the street door giving way, shown as LIGHT: 0 only the pane's patch 0.45 x 1.1 m on the hall
  floor (z 1.6..2.7) with 2 head shadows swaying in it; 0.5 a slit of daylight 0.08 m wide from D across the floor and
  up risers 1-2, 4 arm shadows waving through it; 1 a wedge 0.5 m wide at D reaching riser 4, 9 head and arm shadows, 40
  dust motes lit in the beam. The leaf itself is zdoor. `lamp` 0..1 (1) scales L. `flicker` 0..1 (1), 0 = steady.
  `flash` 0..1 (0): the gunshot lights the well, a point light #fff0c0 at spec `flashAt` (default (0.7, 0.9, 0.6)),
  range 6 m; at 1 the nearest wall reads #f2e6c4.

| What | Where | In frame |
|---|---|---|
| Camera A, low; free box x 0.2..1.2, y 0.25..0.9, z 1.2..3.2 | (0.7, 0.35, 2.6) -> (0.7, 2.2, -2.6), fov 55 | flight 1 from riser 1, door light in the bottom quarter |
| Camera B, the door below | (0.75, 2.6, -2.9) -> (0.5, 0.7, 3.3), fov 55 | down flight 1 to D, the door 596 px tall |
| Zombie 1 (zshot n 1): 320 px from A, W behind its head | (0.7, 1.5, -2.6), facing +z | falls flat on the landing, z -3.6..-2.65 |
| Zombie 2 (zshot n 1) | from (-0.65, 1.5, -3.2), turned 35 degrees toward flight 1 | hit after 0.9 m, in the lamp's half |

## 3. ZWAIT (kind `zwait`; panel 14, the teaser)

Origin: the floor's centre. Room x -1.8..+1.8, z -2.2..+2.2, 2.6 high. The viewer sits at the +z end facing the back
wall (z -2.2). Everything that matters is stacked on that wall, because the frame is only 2.8 m wide there.

| Thing | Where | Size |
|---|---|---|
| Vent V, back wall | x -1.10..-0.60, y 2.10..2.40 | steel louvre 0.5 x 0.3, 7 slats, cream #c9c9bf, #3a3d41 between |
| Clock, back wall | centre (-0.85, 1.72) | 0.28 across, white face, black rim 2 cm, hands at 2:17 |
| Observation window OW, back wall | x -0.20..+1.15, y 1.50..2.20 | 1.35 x 0.70, frame 5 cm #6e7472 |
| Booth behind OW, floor raised to y 0.75 | x -0.35..+1.30, z -3.4..-2.2, ceiling y 2.45 | walls #3f474d |
| Lab man | stands at (0.55, 0.75, -2.75) | 1.45 tall, 0.6 wide; seen from y 1.5 up, eyes at y 1.85 |
| 3 chairs on the back wall, a sitter on each | x -0.75, 0, +0.75, centre z -1.8 | seat 0.46 x 0.42 at y 0.42, back to 0.78; heads to y 1.20 |
| Low table | centre (0, 0, -0.95) | 0.9 x 0.5, top y 0.40, 4 magazines |
| Lights F | (0.2, 2.6, -1.2) and (0.2, 2.6, 1.3) | twin-tube battens 1.25 x 0.2 x 0.09 along x |

- Walls: gloss dado 1.0 m #8f9892, a 3 cm rail #6f7773, matte #a9aeac above (dark enough for white smoke to stand off).
  Ceiling: 0.6 m tiles #c9ccc8. Floor: 0.3 m lino tiles #b8b4a6 / #a9a598, skirting 0.1 #5c605e. Nothing else on the
  walls.
- Chairs: 1960s moulded plastic shells #5d7688 (grey-blue, so golden skin stands off), steel tube legs 2 cm. The three
  sitters and the lab man are FIGURES built in the prop (the zcivil build: golden #d9a85a body, face on the body, thin
  limbs), not cards and not rigs: the shot is frontal, bright and 3.3 m away, a flat card would show. Clothes, left to
  right: brown cardigan #7b6a58, grey jacket #5a5f66 with a thin tie, pale blue blouse #9aa7b0. Each holds a clipboard
  0.23 x 0.32 (#8a6a48, steel clip, a white form with 9 grey lines) tilted 35 degrees on the lap, and a pencil. Eyes
  down, lids 60 % shut. Writing from t: the hand runs 1.2 cm along a line at 2.5 Hz and drops one line every 1.4 s,
  phases hashed. Nobody ever looks up. The clock's red second hand steps 6 degrees a second.
- Lab man: white coat #f2f2ec (shade #c9ced2), dark tie #3a3d41, black-rimmed glasses, a clipboard at his chest. The
  booth is dim (a desk-lamp pool #ffd9a0 low right, a tape recorder with two turning 0.18 m reels at the left): the coat
  is the brightest thing behind the glass.
- State `smoke` 0..1 (0; the director runs it to 1 over about 3 s). Cel smoke, thick: 3 flat tones (lit #fbfbf8, body
  #e3e6e6, underside #bcc4c9), hard scalloped edges, opacity 0.96 (0.6 in the leading 0.5 m). 0 a clean vent. 0.10 a
  first puff 0.3 m out of the slats. From 0.10 the plume pushes 0.3 m into the room and rolls up the wall, 0.5 m wide at
  the vent, 0.9 m at the ceiling (14 lobes of 0.18 -> 0.5 m). Ceiling layer: 60 lobes of 0.5-0.9 m, flattened to 0.6, on
  a hashed lattice; its front is R = 0.4 + 4.6 x smoke^0.8 metres from the vent (the whole ceiling at 1) with 7 round
  lobes of 0.4-0.7 m on the leading edge; thickness 0.12 + 0.33 x smoke, so at 1 the underside is y 2.15, 5 cm over the
  top of OW, with a bulge down to y 2.0 within 0.5 m of the vent. A lobe grows 0 -> 1 over 0.25 of the state once the
  front passes it; on t each lobe turns 15-35 degrees a second and breathes 6 %. The batten F in the frame keeps glowing
  through the layer as a soft white bar.
- State `watch` 0..1 (0): 0 the lab man looks down and writes; 1 his head lifts 6 degrees, the pen stops, his pupils sit
  on the viewer. The clip's last frame.
- Light, flat fluorescent: key TO the light (0.1, 1.0, 0.2), #f1f6f2; fill sky #e3e8e5, ground #c2bfb2; key to fill 1.2
  to 1. Contact ovals only, 20 % dark. No flicker. The brightest shot of the clip (frame mean about 62 %).
- POV camera (0, 1.0, 1.5) -> (0, 1.35, -2.2), fov 68; free box x -0.3..0.3, y 0.9..1.1, z 1.2..1.8. About, in px from
  the top left: ceiling line y 490, vent x 118-310, y 570-680, clock 108 px at (214, 820), OW x 463-982, y 640-900,
  sitters 259 px wide at x 217, 540, 863, heads at y 1015, floor line y 1490; at smoke 1 smoke down to y 655.

## 4. What each panel uses

| # | Place | Reused | New |
|---|---|---|---|
| 01-03 | zstreet floor (y -15), POV lying, then close | rigged zombie (hand on the hood), zhorde n 12, zrevolver; zshot n 1 for the drop | |
| 04 | zstreet run, then the SEED insert | zstreet, 2 zhorde in the side streets | zroof, `dusk` 0.3 |
| 05 | zstreet facade | zstreetdoor open; rig for the sleeve grab, then zshot n 1 | |
| 06 | zroom, dress hall | zdoor (shadows, bulge), a cabinet of the director's pick | |
| 07 | zstairs | zdoor in D, 2 zshot (n 1), zrevolver | zstairs: crack, flicker, flash |
| 08 | zroof | zhorde alley and front street | zroof: shake, open, fire, smoke |
| 09, 10 | zroof | zshot n 1 in the kiosk door (d1), a second zshot n 1, zrevolver | zroof: behind 0 -> 1 |
| 11-13 | zroof, 13 straight down | zhorde up 0 -> 1, reach 1 from 12 | |
| 14 | zwait | none | zwait: smoke 0 -> 1, watch |

## 5. What cannot be staged as written (default fix)

- 01 to 08: the outline opens "bright" and the roof is dusk 27 s later. Default: zstreet stays grey, the stairwell (5 s,
  dim, the warm window) hides the change, dusk starts at the roof door.
- 04: zstreet's two roofs are 7.9 m apart, they never "almost touch". Default: the 1.0 s look-up insert in zroof.
- 08: from the door at eye height the 2 m gap is a line 27 px tall, and no street shows from the deck. Default: the
  burst, then the reveal crane (gap 180 px), then "08 streets" for the zombies.
- 09, 10: door, Spud and gap side by side need 7.4 m of width, so Spud is 180 px. Default: stage it in depth from B.
  zshot stands its zombies in a row 1.1 m apart, three will not file through a 1.0 m door. Default: the first falls at
  (-4.2, 0, -0.8), one zshot n 1 walks out on z +0.1, the rest are the heads of `behind` 1.
- 12: the reach and the hands do not fit one frame at a readable size. Default: 12a for 1.5 s, then 12b.
- 13: with the pair small Spud's eye is 33 px, so closing eyes will not read; and a real fall to the hands lasts 1.48 s.
  Default: a 0.7 s face insert first (camera 1.2 m over him, falling with him), then the straight-down hold in slow
  motion, y -6 to y -9.5 in 2.3 s, cut 1.0 m over the hands. Bodies lie across the alley, faces sideways.
- 07: zshot needs flat ground: zombies stand only on the half landing, never on a step. 14: three sitters and the window
  do not fit side by side in a 1080 px POV: they are stacked on the back wall.
