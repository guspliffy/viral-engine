# Potato Desk 09 — Hell Reviews: design (Fable 5.2, 19 Nov 2026)

From `/mnt/project-files/videos/potato-desk/09-hell-reviews/STORY.md` (v2, 18 beats, reversal ending). New pieces only; canon cast, look and
units as `../DESIGN.md` and `../05-court-day/DESIGN.md`. Axes +x right, +y up, +z toward camera, metres; positions are
foot roots (x, z) or mesh centres (x, y, z). 1080 x 1920, 30 fps. Flat toon colours, one-off canvas art for every mark.
Drawn before the panel sheet exists (images.md wants the sheet first): re-check sizes against the sheet once Jonny has it.

## 0. Cameras (all level, all sharp)

Master lens for every wide: y 1.45, z 10.40, look straight down -z, fov 26. At z 0: 400 px/m, floor row 1540; at the
back plane z -1.30: 356 px/m, floor row 1475. Captions rows 486-608; nothing lettered above row 634 (= y 2.36 at z -1.30).

| Cam | Position -> look | Sees (at z 0) | Beats |
|---|---|---|---|
| A-WIDE | (0, 1.45, 10.4) -> (0, 1.45, 0) | x -1.35..+1.35: both doors, both badges, desk | 1-5a, 18 |
| A-BADGE | (0.86, 2.03, 3.6) -> (0.86, 2.03, -1.3), fov 24 | the HELL badge, 1.17 m wide | 12b (0.5 s flicker) |
| B-C | (0, 1.45, 10.4) -> (0, 1.45, 0) | x -1.35..+1.35: board centred, speaker, balloon | 5b, 9 |
| B-L | (-0.75, 1.45, 10.4) -> (-0.75, 1.45, 0) | x -2.10..+0.60: window, lava tub, board at right | 6, 10a, 10c, 13, 15, 16 |
| B-R | (0.75, 1.45, 10.4) -> (0.75, 1.45, 0) | x -0.60..+2.10: board at left, EXIT, buffet | 7, 8, 11, 14 |
| B-GLASS | (-1.60, 0.62, -4.3) -> (-1.60, 0.50, -1.3), fov 24 | from OUTSIDE the window: his face on the glass | 10b (1.5 s) |
| B-TAB | (0.80, 0.75, 4.7) -> (0.80, 0.75, 0.3), fov 24 | 1.05 m wide: the little one, the tablet between them, the Devil's face | 12a |
| B-DEVIL | (-0.45, 0.80, 4.6) -> (-0.45, 0.70, 0.3), fov 24 | 1.05 m wide: the Devil hugging the tablet | 17 |

B-C / B-L / B-R are ONE camera on one rail (only x changes), so the room is lit and checked once. The board is whole in all three.

## 1. THE DEVIL (new potato character, file `characters/potatobrawl/devil.json`, costume type `devil`)

A RED POTATO (the red-skinned variety). Every devil sign is a potato's own part: horns = two sprouting chits, tail = a root runner.

| | |
|---|---|
| **Body** | 0.92 high, 0.80 wide, 0.68 deep; an egg, widest at 0.40 of its height; lump 0.02, seed 66. Standing 1.06 (horn tips 1.20): 1.58 x the little one (0.67), 0.93 x Reaper (1.14) so Reaper stays the tallest. |
| **Skin** | `#c2493b`, shade `#9c3a35`; 6 potato-eye dimples `#8f2f2a` and 8 freckles `#d97a62`, each placed once. Cheeks `#ff8f6a`. |
| **Eyes, hands** | Spud's: same eye build, iris `#4a2a14`, lash 0.9; glove hands as Chip's (3 fingers + thumb), size 1.0. Brows thick, outer ends up (arch 0.05). |
| **Limbs** | `#3a1616`, width 0.032. Feet: flat sandals, sole `#f2c94c`, one strap `#b3261e`. |
| **Horns** | Two chits in place of the leaf, at body-local (±0.17, 0.95, 0): 0.16 long, Ø0.06 at the root to Ø0.02, curving 35° inward; root `#f0dcc0` blending to tip `#8e3a6b`; 2 bud bumps each. |
| **Tail** | A root runner from body-local (0, 0.22, -0.34): 0.55 long, Ø0.018, `#7a2622`, one S-curve, ending in a spade-shaped leaf 0.10 x 0.12 `#c8352b`. Idle sway 8°, 0.7 Hz. |
| **Garment** | ONE loud resort shirt, teal `#17a3a0`, shade `#0f7f80`: open collar in a V down to body-local y 0.55, 3 buttons `#f8f3e1`, hem at y 0.12, stand-off 0.018. Six flame-flowers `#ffb02e` with centres `#ff6a13`, 0.10-0.16, each DRAWN ONCE on one canvas (none copied, mirrored or tiled). Short sleeves Ø0.17 to Ø0.13, 0.12 long, ending well before the wrist; hands always clear. |
| **Name badge** | Gold plate 0.10 x 0.06 `#e8b93a` on the camera-side chest at body-local (0.20, 0.62): one red star `#b3261e`, NO letters. |
| **Object** | The review tablet (section 4, `reviewtablet`). He holds it two-handed to beat 12, pushes it into the little one's hands at the first snap, takes it back to hug at beat 17. |
| **Default face** | Neutral and open. Clip look "host": smile curve 0.7, lids 0, brows +0.01, held for the whole clip. |
| **Habit** | Presents every perk with both palms open and a 10° head tilt; the smile never changes until beat 12. The tail tip flicks once each time a red X lands and droops to the floor from beat 12. |
| **Acting states (v2)** | `crack` (beat 12): smile curve 0.7 -> 0.15, one mouth corner twitching at 3 Hz, one lid 0.3, brows up and in. `snap`: arm up to horn height, thumb against middle finger, 3-frame flick; a white `poof` appears at the perk, not at the hand. `sweat` 0..1: 3 beads `#cfe9f5` on the brow, one running (beats 15-16), smile curve 0.4 and stiff. `sob` (17): eyes shut as two arcs, mouth open and wobbling, tear beads r 0.012 rolling down both cheeks 2 per second and dripping on the tablet, body shaking 0.01. `whimper` (18): brows up and in, wet lower lids, lower lip wobble. |
| **Voice** | Warm, bright, quick game-show host, mid-low, always smiling. "Want to try again?" at half volume, slower, same smile. Gibberish proposal: pitch 122, rate 3.3, formant 0.96, range 5, breath 0.06, seed 66. |

**The small poking demon (beats 8, 9; fixed in 14):** the Devil's file at scale 0.37, shirt and badge off. Body 0.34 high, 0.36
wide, standing 0.44; same red skin, chit stubs 0.05, tail 0.20. Face: lids 0.5, mouth flat, bored (a masseur on his
thousandth shift). Holds `pitchfork` in both hands. Beat 14: pitchfork flat on the floor, both hands kneading the little
one's shoulders at 1 per second, eyes wide and darting to the Devil. Silent. No second new character.


## 2. SET A — the crossroads desk

No walls. Everything stands on cloud; the sky is the only painted piece (far backdrop).

| Piece | Geometry, position, colours |
|---|---|
| Floor | Flat cloud deck 6.0 x 6.8 at y 0, `#e9f1f6`; `fogveil` over it 0.10 deep `#f7fafc` at 60 %, drifting 0.05 m/s toward -x. |
| Terrace | Cloud step 0.40 high from z -0.80 back to z -2.20, full width, top `#f4f8fb`, front face `#dbe7ef`. Front edge hidden by 7 `cloudpuff` (r 0.22-0.34, centres y 0.22-0.34, z -0.78), each a different lump seed. Both doors stand ON it, so they clear the characters' heads. |
| Sky | Far backdrop plane at z -14, 16 x 10: left half `#9fd0f0` up to `#d9eefb` with a gold haze `#fff1c2` behind the heaven door; right half `#5a3f52` up to `#2b2030` with an ember haze `#b3402a` behind the hell door; soft blend 1.2 m wide at x 0. Flat and calm in rows 200-640. |
| Counter | `woodcounter` turned 90°: length 1.25 (z -0.70..+0.55), depth 0.50 (x -0.25..+0.25), top 0.50. Top `#d9c3a0`, body `#7d6a55`. **Departure from the series:** centred on x 0 (series: x -0.40..+0.10) so one door shows each side. |
| On the counter | `rubberstamp` knob `#b43a23` at (-0.10, 0.38); `paper` form 0.15 x 0.21 at (0.05, 0.25); after beat 4 one `stampmarks` mark `#b43a23` on it. |
| Scythe | `parkedscythe` planted in the cloud at (0, -0.76), upright, blade tip y 1.55, in the gap between the two badges. Reaper's hands stay free. |
| HEAVEN door | NEW `reviewdoor` at (-0.90, z -1.30), sill y 0.40. Leaf 0.80 x 1.24 `#f6f1e4`, 2 raised panels `#e9dfc6`, casing 0.06 `#d9a93a` (top y 1.70), star-shaped gold knob. Light leak `#fff1c2` at the sill, 0.5 m long on the terrace. |
| HELL door | `reviewdoor` at (+0.90, z -1.30), sill y 0.40. Leaf `#1d1a20`, panels `#2b2228` with 4 hand-drawn scorch marks `#3a2a2e`, casing `#b3261e`, round red knob. Ember line `#ff7a1c` under the door, one smoke wisp. Plain red doormat 0.70 x 0.30 `#b3261e` (no text). Casing `glow` 0..1 goes `#ff3b22` when the Reaper stamps (beat 4). Hinge at x +1.30, opens 110° toward the camera in 5 frames (beat 5); behind it a box 1.0 deep, `#ff6a13` at the floor to `#8f1f1c`. |
| Badges | One over each door, sitting on the casing: 1.10 x 0.60 x 0.05, centres (-0.86, 2.04, -1.26) and (+0.86, 2.04, -1.26), y 1.74..2.34 (rows 643-857). Edges in frame at px 95 and 985. Layout in section 4, `reviewbadge`. |

**Badge readings:** left `HEAVEN  3.1  ★★★☆☆  (212)`; right `HELL  4.9  ★★★★★  (6,665)`. The big number is 87 px high in
the master (29 px at 360 px width). The count never changes. Beat 12 (A-BADGE insert, 0.5 s): the number flickers
4.9 -> 4.8 -> 4.9 three times like a failing lamp and the fifth star dims with each 4.8; it settles on 4.9 and is 4.9 in the tag.

**Marks, A-WIDE** (bodies yawed 25° to the camera, nobody shows a back):
| Who | Root (x, z) | In frame |
|---|---|---|
| Reaper | (-0.72, 0.10) | head top row 1085; 214 rows of the heaven door and its whole badge clear above him |
| The little one | (0.55, 0.10), both hands on the counter edge, eyes up 25° | head top row 1270; hell door fully clear above him |
| Devil, beat 5 | (0.90, -1.05) on the terrace (y 0.40), arms wide | feet row 1332, horn tips row 890: whole body above the little one |
| The big one, beat 18 | (0.75, 0.10), camera-side arm up, ONE finger, grin | spans x 0.31..1.19, head top row 1093; fingertip row 1010, under the hell badge |
| Devil, beat 18 | (0.62, -1.22) on the terrace; hell door open 25° | one horn, one eye and 3 fingers show in the gap at the door's inner edge, `whimper` |

Beat 2: he points up-right at the 4.9 with the camera-side arm, then swings it left to the 3.1 and back. Beat 18: Reaper
turns only his eyes to the lens, lids 0.42, 0.5 s before the cut.

## 3. SET B — the hell resort lobby

Room 5.2 wide (x -2.60..+2.60), back wall z -1.30, no front wall, walls 4.2 high.
- Wall: dado y 0..0.80 `#5a2a24`; rail 0.05 `#d9a93a` at 0.80; main band to 2.40 `#3a2a2e`; above `#2a2024`, empty (captions).
- Floor: `checkerfloor` `#4a2226` / `#57292b`, tile 0.40. Red runner carpet 1.0 wide `#8f1f1c` along z at x 0.
- Light: warm key from upper left `#ffe2c4`; orange underglow `#ff7a1c` from the tub, falling off in 1.5 m. Faces stay bright.

**Back wall, left to right**
| x range | Piece |
|---|---|
| -2.10..-1.10 | `curtainwindow`: opening 1.00 x 1.50, sill y 0.35, top 1.85, gold frame 0.06. Closed until beat 10. Pull cord with tassel at x -1.04. |
| -0.98..-0.66 | `speakerbox` on the floor at (-0.82, z -1.05); ONE `balloon` tied to it, centre (-0.80, 1.35, -1.05). |
| -0.55..+0.55 | `perkboard` on two gold posts at z -1.00 (0.30 off the wall), face y 1.22..2.34. |
| +0.70..+1.50 | `door` (EXIT): leaf 0.80 x 1.60 `#2f6b3f`, casing `#d9a93a`; `officesign` 0.50 x 0.20 at (1.10, 1.84, -1.27), plate `#1f7a3a`, "EXIT" `#f3ead2` cap 0.12. |

**Floor pieces**
- `lavatub` centre (-1.30, +0.50), r 0.52 (x -1.82..-0.78, z -0.02..+1.02), rim 0.14 high.
- `buffettable` along z: x 1.40..1.86, z -0.30..+0.80, top 0.40 (under the little one's eyes at 0.47). `friesmound` at (1.63, 0.40, -0.02) under `cloche`; 3 `plate` of fries at z +0.30, +0.50, +0.70.
- `towelmat` r 0.30 `#f4f1e8` at (0.20, +0.40).
- From beat 13 the peeled X stickers lie where they fall, under the board at z -0.85 (5 by beat 15).
- Outside the window: `heavenisland` centre (-2.05, 1.62, -7.5), in the top third of the glass from B-L; behind it a rock-shaft backdrop at z -9 (dark red rock `#3a1f22`, one shaft of sky `#9fd0f0`): far backdrop only. From beat 15 `beachview` stands in its place (section 4).

**Perk beats in this one room**
| Beat | Cam | Marks (x, z) and the one visible change |
|---|---|---|
| 5b welcome | B-C | Devil (0, 0.20) arms wide under the board (horn tips row 1062, board bottom row 1044); little one (0.80, 0.50) looks up at the board. All five perks unmarked. |
| 6 HOT TUB | B-L | Devil (-1.30, -0.55) behind the tub, palms down at it; little one (-0.40, 0.45) leans over the rim, jumps back 0.3. `rubberduck` on the lava sags to a puddle in 1.0 s. X on row 1. |
| 7 BUFFET | B-R | Devil (1.63, -0.75) behind the table's far end lifts the `cloche` 0.35: fries. Little one (0.95, 0.25) backs to (0.45, 0.25), hands up. Devil holds out `ketchupbottle`. X on row 2. |
| 8 MASSAGE | B-R | Little one on the mat (0.20, 0.40) facing -x; demon (0.72, 0.40) pokes his back at 2 per second, he hops 0.04 on each; Devil (1.25, -0.30) palms open. X on row 3. |
| 9 PARTY | B-C | Conga loop on an oval: front lane z +0.95 moving -x, back lane z -0.35 moving +x, turns at x -0.50 and +0.70. Order: Devil, little one in a `partyhat`, demon last. Speaker cone pulses on the same 3 notes; the balloon bobs once per loop. X on row 4. |
| 10 VIEW | B-L, B-GLASS, B-L | a) Devil (-0.80, -0.80) pulls the cord, curtains part: the sunny island. Little one runs to (-1.60, -1.02). b) From outside: his face squashed 0.03 flat on the glass, both palms on it, eyes up, sun patch `#fff1c2` on his face, Devil smiling behind. c) He turns to the lens, shouting. X on row 5: all five gone. |
| 11 EXIT | B-R | Little one marches along z 0.30 to (0.45, 0.30); Devil slides in at (1.15, 0.30) between him and the EXIT door, tablet up, five unlit stars. |
| 12 one star | B-TAB, A-BADGE | Tablet held between them at x 0.63..0.97, y 0.35..0.81, clear of the Devil's face. His finger hovers 0.03 over star 1 (ring on it). Devil `crack`. Insert: the HELL badge flickers 4.9 -> 4.8. |
| 13 snap 1 | B-L | Devil (-0.40, 0.45) `snap`; little one (0.25, 0.60) arms crossed, tablet under one arm, 1 star lit. `poof` over the tub: `lavatub.fix` 0 -> 1, the duck pops up whole. X peels off row 1. Room underglow turns from orange to soft white. |
| 14 snaps 2, 3 | B-R | Devil (1.63, -0.75) drops the `cloche` over the fries, snaps, lifts it: `cakestack`; plates swap in the same `poof`. X off row 2. Little one on the mat (0.20, 0.40), tablet in both hands, 2 stars lit; demon (0.72, 0.40) rubs his shoulders. X off row 3. |
| 15 snap 4 | B-L | Devil (-0.40, 0.20) snaps: `partylights` on (wall band brightens to `#6a3a34`), `confetti` falls, `balloon` cluster of 7, speaker cone pulses on a real beat; curtains open on `beachview`. X's off rows 4 and 5: the board is clean. Little one (0.25, 0.60), party hat on, 3 stars lit. |
| 16 four stars | B-L | Little one sits in the foam at the tub centre (-1.30, 0.50), head top y 0.62, foam to his chest, `drinkglass` in the camera-side hand. Tablet propped on the rim at (-0.80, 0.50), screen to him and the lens; he taps star 4. Devil (-0.45, 0.30) fans him with `palmleaf` in both hands, 1 stroke per second, `sweat` 1. |
| 17 sob | B-DEVIL | Devil at (-0.45, 0.30) hugs the tablet to his chest, screen out (4 lit, 1 grey), `sob`. Foam and party lights soft behind him. |

The ladder gets worse by picture (steam -> his own kind on a plate -> pain -> a loop -> seeing what he gave up), then each
fix is the same prop made good in the same place, so the viewer needs no new geography. Every swap is hidden by one white `poof`.

## 4. NEW props / kinds to build

| Kind | Size (m) | Build and colours |
|---|---|---|
| `reviewdoor` | leaf 0.80 x 1.24 x 0.05 | Section 2. spec.leaf, .panel, .casing, .knob, `open` 0..1 (110°), `glow` 0..1. |
| `reviewbadge` | 1.10 x 0.60 x 0.05 | Heaven: plate `#fbf6ea`, frame 0.025 `#d9a93a`, ink `#24323f`. Hell: plate `#1d1a20`, frame `#b3261e`, ink `#f3ead2`, number `#ffc65a`. Row 1 (local y +0.19): the word, cap 0.105. Row 2: number cap 0.245 centred at local x -0.30, y -0.09; five stars each 0.11 across from x 0.00 to +0.50 at y -0.03, filled `#ffc65a`, empty outline `#8a8f96` (3 filled for 3.1, 5 for 4.9); count in brackets cap 0.06 at y -0.20. Min stroke 0.015. `flicker` (beat 12): swaps the number art 4.9 / 4.8 and dims star 5 to 40 %, 3 cycles in 0.5 s. |
| `cloudpuff` | r 0.22-0.34 | 3 merged spheres, `#f7fafc`, underside `#dbe7ef`, spec.seed. |
| `perkboard` | 1.10 x 1.12 x 0.07, posts Ø0.05 x 1.25 | Case `#2b1a1c`, face `#1d1a20`, frame 0.03 `#d9a93a`. Header "HELL RESORT" `#ffc65a` cap 0.10 at local y +0.44. Five rows, pitch 0.17, first at y +0.24: HOT TUB, BUFFET, MASSAGE, PARTY, VIEW, `#f3ead2` cap 0.125 (46 px), left-aligned at x -0.45, a gold bullet r 0.02 before each. `x[i]` 0..1: a red X `#e0261c` of two brush strokes 0.035 wide, 0.17 high x 0.60 long ACROSS the word, each X drawn once (different seed), slams from scale 1.4 to 1 in 4 frames; the word dims to `#8a8474` but stays readable. `peel[i]` 0..1 (beats 13-15): the X is a sticker; it curls from its upper right end in 6 frames, drops in 6 more and lies flat on the floor; the word goes back to `#f3ead2`. States run 0 X -> 5 X -> 0 X. |
| `lavatub` | r 0.52, rim 0.14 high x 0.12 thick | Rim stone `#4b3b3b`, top edge `#6a5552`; pool handrail pair Ø0.025, 0.45 high, `#c9ced6` at the +x side (reads "pool"). Surface y 0.10 `#ff6a13`, 5 hand-drawn bright veins `#ffd23f`, crust islets `#7a2a1c`; 6 bubbles r 0.03-0.07 rising and popping on fixed phases by index; heat shimmer off. `fix` 0..1: surface becomes water `#bfe6f2` under a foam mound `#ffffff` (12 puffs, each its own size, shade `#dfeef5`) rising 0.10 over the rim, 5 soap bubbles r 0.02-0.05 drifting up on fixed phases, no glow. |
| `rubberduck` | 0.14 x 0.12 x 0.10 | `#ffcf2e`, beak `#f08a24`; `melt` 0..1 sags it to a flat puddle 0.20 across. Back to `melt` 0 on the foam from beat 13, bobbing 0.01. |
| `buffettable` | 0.46 x 0.40 x 1.10 | Cloth `#f4f1e8` to the floor, 4 drawn folds per side, runner 0.16 `#b3261e`. |
| `friesmound` | 0.36 x 0.26 x 0.40 | About 40 `fry` (0.039 x 0.24 x 0.035, `#ecb348`, sides `#cc8735`, top `#f5c662`) on a dome, every one at its own angle. |
| `cloche` | r 0.24, 0.22 high | Silver `#c9ced6`, shade `#88969e`, knob r 0.025; held by the knob (pinch grip). |
| `plate` (of fries) | Ø0.20 x 0.02 | `#fbf6ea`, 5 `fry` fanned on each. |
| `ketchupbottle` | Ø0.09 x 0.24 | `#d3261e`, white cap `#f8f3e1`, cream label with one drawn tomato, no words. Hold grip. |
| `pitchfork` | 0.50 long | Shaft Ø0.02 `#3b2a20`; head 0.12 wide, 3 tines 0.10 `#c9ced6` with ROUNDED tips (tone limits). Two-hand grip. |
| `towelmat` | r 0.30 x 0.015 | `#f4f1e8`, one drawn stripe ring `#17a3a0`. |
| `speakerbox` | 0.32 x 0.56 x 0.28 | `#24262b`, cone r 0.12 `#3a3d42`, dust cap `#55585e`, small cone r 0.05 above; `pulse` 0..1 pushes the cone 0.015 out. |
| `balloon` | r 0.15, string 0.60 | ONE, pale pink `#ff8f8f`, a little slack (2 drawn wrinkles), highlight `#ffd0d0`, string `#f8f3e1`. `cluster` 0/1 adds 6 more (r 0.13-0.17: `#ffcf2e`, `#6cbf3a`, `#9fd0f0`, `#ff8a1c`, `#c9a0e8`, `#f8f3e1`), all taut, each on its own string. |
| `partyhat` | cone Ø0.14 x 0.20 | `#17a3a0` with 3 hand-drawn stripes `#ffcf2e`, pompom r 0.02 `#f8f3e1`; sits beside his two leaves; on from beat 9, tilted, off only in the tag. |
| `curtainwindow` | 1.00 x 1.50 opening | Frame `#d9a93a`; glass with one diagonal sheen stroke at 12 %; two velvet panels `#8f1f1c`, 5 drawn folds each `#6f1616`, gold cord and tassel; `open` 0..1 slides each panel to 0.18 wide in 10 frames. |
| `heavenisland` | 0.90 x 0.45 x 0.40 | Cloud `#f7fafc` in full sun, sun disc r 0.12 `#fff1c2`, 3 dancing potato figures 0.12 high (`#e2a95c`, flat), 3 balloons r 0.04 (`#ffcf2e`, `#6cbf3a`, `#9fd0f0`), one gold arch. Bobs 0.02, 1 Hz. |
| `beachview` | 1.6 x 1.2 x 0.6 at (-2.05, 1.05, -7.5) | Real pieces outside the window: sand strip `#f2d59a`, sea band `#3f8fb0` with 3 drawn wave lines `#bfe6f2`, half sun disc r 0.22 `#ffcf5a` on the horizon, one palm 0.55 high (trunk `#7d5a3a`, 5 fronds `#3f8a3a`). Far backdrop behind it at z -9: sky `#ffb36b` up to `#c95a7a`. Swaps with `heavenisland` and the rock shaft while the curtains are closed (beat 15). |
| `cakestack` | Ø0.34 x 0.36 | 3 tiers Ø0.34 / 0.25 / 0.16, sponge `#fbf6ea`, icing `#ff9fb2` with 5 hand-drawn drips per tier, one cherry r 0.03 `#d3261e`. Sits where `friesmound` sat. Plates swap to one cupcake, one donut `#f08a24` with pink icing, one jelly `#e0473a`, each Ø0.10-0.12. |
| `poof` | r 0.25-0.60, 6 frames | 5 white puffs `#f7fafc` growing and thinning from one centre, fixed by index; spec.r. Covers every swap. |
| `partylights` | 2 swags, 2.6 m | Cord `#1d1a20` from the window top (-1.10, 1.95) to the board's left post and on to the EXIT sign, sag 0.15; 11 bulbs r 0.03 in `#ffcf2e`, `#ff8a1c`, `#6cbf3a`, `#9fd0f0`, `#ff8f8f`; `on` 0/1 makes them emissive. |
| `confetti` | 60 pieces 0.02 x 0.03 | Six colours as the bulbs plus `#f8f3e1`; falls 0.6 m/s with a flutter fixed by index, from y 2.6; 25 pieces stay on the floor. Never in front of a face for more than 2 frames. |
| `palmleaf` | 0.80 long, blade 0.40 wide | One fan frond `#3f8a3a`, 9 drawn ribs `#2f6b2f`, stem Ø0.02 `#7d9a4a`; two-hand grip on the stem; the blade bends 15° against each stroke. |
| `drinkglass` | Ø0.07 x 0.16 | Tall glass, drink `#ff9a2e`, striped straw `#f8f3e1` / `#d3261e` 0.10 above the rim, paper umbrella Ø0.07 `#17a3a0`. Hold grip. |
| `reviewtablet` | 0.34 x 0.46 x 0.02 | Bezel `#1d1a20`, screen emissive cream `#fff4d6`. "RATE YOUR STAY" `#24323f` cap 0.03 at the top; ONE row of 5 stars, each 0.058 across, unlit `#c9c2ae`, lit `#ffc65a`. `lit` 0..5 lights them from the left (beats: 0, then 1, 2, 3, 4); `hover` 1..5 draws a ring `#b3261e` round that star (beat 12). Held at y 0.35..0.81, yawed 30° to the lens; the little one carries it against his belly with both hands or under one arm. |

Costume/character work: `devil.json` + costume `devil` (shirt, badge, chits, tail; face keys `crack`, `sweat`, `sob`, `whimper`), scale preset for the demon.
Reused as they are: `woodcounter`, `rubberstamp`, `stampmarks`, `paper`, `parkedscythe`, `fogveil`, `checkerfloor`, `door`, `officesign`, `fry`.

## 5. Panel sheet: IMAGE PROMPT (gpt-image-2 through Codex, on Jonny's PC)

Attach 3 references (of max 5), full paths as `referenced_image_paths`:
1. `court-day-set-cast.png` (frames of the finished Court Day video = the look, and the little one and the big one as built). It
   lives in `/mnt/project-files/videos/potato-desk/credit-for-the-crime/refs/`; copy it into `references/cast/` first.
2. `references/cast/cast-sheet.png` (Reaper = bottom row, first on the left).
3. `references/cast/chip-reference-sheet-2026-11-12.png`.
Do NOT attach the Wedge sheet: it shows a zipped jacket, the built video shows a sweater. The Devil has no reference: his text below is the design.
Grid: 6 columns x 3 rows on a SQUARE image = one cell per beat, tall 1:2 cells (as the Credit Crime sheet). No model-view cell.

PROMPT START
Use case: illustration-story. Create ONE finished full-colour storyboard contact sheet for a 58-second vertical animated comedy sketch. Square image, as large as possible. EXACTLY EIGHTEEN cells in six columns and three rows (row 1 = 01-06, row 2 = 07-12, row 3 = 13-18). Every cell is a TALL vertical phone frame (portrait, twice as high as wide), thin charcoal gutters, a small panel-number badge in each cell's top-left corner showing its own number, no title or header. Match the look of the first attached reference (frames from the finished video): soft cel-shaded 3D cartoon with hand-drawn line texture, warm light, the whole frame fully sharp, no depth of field, no motion blur. No speech bubbles, no captions, no comic impact marks, no speed lines, no floating symbols or sparkles. Hands have exactly three fingers and a thumb. Every character is a potato: no humans, no skeletons. The ONLY words allowed anywhere: the two review badges (HEAVEN, HELL, their numbers), the resort board (HELL RESORT and its five perks), the green EXIT sign, and "RATE YOUR STAY" on the tablet. Keep the top third of every cell free of faces and props (plain sky or plain wall).

CAST (same in every panel):
REAPER: exactly the hooded potato at the bottom-left of the second reference: a golden-tan potato wrapped in a black hooded shroud that leaves only his round face open, a small green two-leaf sprout poking through the top of the hood, brown half-lidded eyes, a small dry smirk, thin black arms and legs. Calm, deadpan, barely moves. His farm scythe is stuck upright in the cloud behind the desk; his hands are free.
THE LITTLE ONE: exactly the small potato of the third reference and the first reference: the smallest, a round golden ball, bright yellow hoodie with the hood down and two white drawstrings, two green leaves in a V on his head, white sneakers with a red stripe. Half the Reaper's height. Excitable.
THE BIG ONE (panel 18 only): exactly the big potato in the first reference: big, broad on top, golden, dark red knit sweater with a thick cream knit collar, brown sunglasses pushed up on top of his head, one big green leaf.
THE DEVIL (new): a RED-SKINNED potato, egg-shaped, a little shorter than the Reaper and one and a half times the little one's height. Brick-red potato skin with a few darker dimples and freckles. The same big round friendly cartoon eyes and cream three-fingered glove hands as the others. Two short pale potato sprouts with purple tips curve up from his head like little horns. A thin dark-red root tail ending in a small red spade-shaped leaf. He wears one loud teal short-sleeved resort shirt with six big orange flame-shaped flowers, open collar, and a small gold badge with one red star and no writing. Yellow sandals. A wide, fixed, charming host smile until panel 12.
THE SMALL DEMON (panels 08, 09, 14): a tiny red potato, knee-high to the Devil, same red skin and two sprout stubs, no clothes, holding a small pitchfork with rounded tips.

SET A, THE CROSSROADS (panels 01-05 and 18): a floor of soft white cloud with low mist. In the middle a plain wooden service counter seen end-on, with a red-handled rubber stamp and one paper form on it. Behind it a low cloud terrace with two doors standing free on the cloud. LEFT: a white door with a gold frame, warm light under it, bright blue sky behind; above it a cream badge with a gold frame reading "HEAVEN", a big "3.1", five stars of which three are gold and two empty, and "(212)". RIGHT: a black door with a red frame, an orange glow under it, a red doormat, dark smoky red-purple sky behind; above it a black badge with a red frame reading "HELL", a big gold "4.9", five gold stars, and "(6,665)". The Reaper stands left of the counter, the customer right of it, both turned three-quarters to the viewer. One still wide camera at potato eye height showing both doors, both badges and both characters.

SET B, THE HELL RESORT LOBBY (panels 06-17): a dark red-brown hotel lobby with a gold rail, dark checker floor and a red carpet. On the back wall, centre, a tall black board with a gold frame: gold header "HELL RESORT" and five cream rows "HOT TUB", "BUFFET", "MASSAGE", "PARTY", "VIEW". In panels 06-10 a big hand-brushed red X is struck across each row in turn and stays; in panels 13-15 the X's peel off again like stickers and lie on the floor. Left of the board: a tall window with red velvet curtains, and on the floor in front of it a round stone hot tub with a chrome pool handrail. Beside the board: one black speaker box with one pale pink balloon tied to it. Right of the board: a green door under a green "EXIT" sign, and a long white-clothed buffet table.
THE TABLET: a big black tablet, as tall as the little one's body, cream glowing screen with small words "RATE YOUR STAY" and one row of five big stars; stars are grey when unlit and gold when lit.

PANELS:
01. Set A wide. The little one stands at the counter holding its edge, looking up. The Reaper holds his rubber stamp raised over the paper form, looking down at him. Both doors and both badges fully visible.
02. Same wide. The little one points up at the HELL badge with one arm, beaming, bouncing on his toes. The Reaper has not moved.
03. Same wide. The Reaper slowly turns his half-lidded eyes onto the little one, stamp still raised. The little one points at both badges with both arms.
04. Same wide. The Reaper has brought the stamp down on the form, eyes forward, flat mouth. The red frame of the HELL door now glows bright red. The little one grins with both fists up.
05. Same wide. The black HELL door has swung open, fiery orange light pouring out. The Devil stands in the doorway on the cloud terrace with both arms spread wide and a huge host smile. The little one looks up at him, delighted. The Reaper looks at the stamp.
06. Set B wide, left half of the lobby: the board at the right, one big red X struck across "HOT TUB", the other four rows clean. The hot tub is full of glowing orange LAVA with bubbles. The Devil stands behind it presenting it with both open palms. The little one leans back from the rim in horror, pointing at the lava; a yellow rubber duck is melting on the surface.
07. Set B wide, right half: the board at the left with X on "HOT TUB" and "BUFFET". The Devil stands behind the buffet table holding up a silver dome lid in one hand and a red ketchup bottle in the other: under the lid a huge golden mountain of french fries, and three plates of fries beside it. The little one backs away with both hands up, eyes wide.
08. Set B wide, right half: board with three X (down to "MASSAGE"). The little one stands on a small round white towel mat, hopping, mouth open in an "ow". Behind him the small demon pokes his back with the pitchfork, bored. The Devil stands by the EXIT door with both palms open, proud.
09. Set B wide, centre: board with four X (down to "PARTY"), the speaker box and the single pink balloon at the left, dim light. A conga line shuffles across the floor: the Devil in front, then the little one wearing a small teal party hat with his hands on the Devil's back, looking miserable, then the small demon.
10. Seen from OUTSIDE through the window glass: the little one's face pressed flat against the pane, cheeks squashed, both palms on the glass, eyes looking up and longing, warm sunlight on his face. Behind him inside the dark lobby, between two parted red curtains, the Devil smiles with one hand on a gold curtain cord. In the top corner of the cell, far up a dark rock shaft, a tiny sunny cloud island with tiny potatoes dancing and balloons.
11. Set B wide, right half: board with all five rows crossed out in red. The little one marches toward the green EXIT door, fists clenched, angry. The Devil has stepped between him and the door, holding up the big glowing tablet with both hands: five unlit grey stars.
12. Closer two-shot. The little one holds one finger just above the FIRST star on the tablet, eyes narrowed, calm. The Devil's smile has cracked: mouth wobbling, one eye twitching, brows up in panic, one hand raised to stop him.
13. Set B wide, left half. The Devil snaps his fingers high in the air. The hot tub is now a BUBBLE BATH: white foam piled over the rim, soap bubbles drifting up, the yellow rubber duck whole again on top. On the board the red X on "HOT TUB" is peeling off like a sticker; four X remain. The little one watches with arms crossed, the tablet under one arm, one star lit.
14. Set B wide, right half. The Devil behind the buffet lifts the silver dome lid with a nervous grin: under it a three-tier pink-and-cream cake with a cherry, and plates with a cupcake, a donut and a jelly. In front, the little one stands on the towel mat holding the tablet with two stars lit while the small demon gently rubs his shoulders from behind, the pitchfork lying on the floor. On the board only "PARTY" and "VIEW" are still crossed out; three red X stickers lie on the floor.
15. Set B wide, left half, now brightly lit. A string of coloured party lights, a big cluster of colourful balloons on the speaker, confetti falling. The red curtains are open: through the window a golden sunset over a beach with one palm tree. The board is completely clean, no X. The Devil holds both arms out, sweating, hopeful. The little one, party hat on, taps his chin and holds the tablet with three stars lit.
16. Set B wide, left half, same party light. The little one lounges in the bubble bath, foam up to his chest, a tall orange drink with a striped straw and a tiny umbrella in one hand, the other hand tapping the tablet propped on the rim: four stars lit. Beside the tub the Devil fans him with a big green palm leaf held in both hands, sweat beads on his brow, a strained smile.
17. Close-up of the Devil only: sobbing, eyes squeezed shut, big tear drops rolling down his red cheeks, hugging the tablet to his chest with both arms; the tablet shows four gold stars and one grey star.
18. Set A wide, exactly as panel 01, but the customer is now THE BIG ONE: he holds up ONE finger and grins. The Reaper stands still and stares straight out at the viewer, half-lidded, deadpan. The HELL door is open a crack and the Devil peeks out from behind it: one horn, one wet worried eye and three fingers on the door edge. Badges unchanged: HEAVEN 3.1, HELL 4.9.

## Decisions taken (19 Nov, v2)

- The big one wears the red knit sweater as built in Court Day (the canon file still says bomber jacket).
- One green EXIT sign is the only lettering beyond badges, board and tablet.
- The hell count stays (6,665); the badge only flickers 4.9 -> 4.8 -> 4.9 at beat 12.
- The rubber duck melts at beat 6 and is whole again on the foam from beat 13.
- No conga guest: Devil, the little one and the demon make the line.
- A Devil model sheet (front, side, back) is NOT on the panel sheet any more; ask for it as a second image if the build needs it.
