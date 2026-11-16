# "Spend $10,000,000 before sunset": DESIGN of the new pieces (15 Nov 2026)

Target: Jonny's two sheets (`money-redo-sheet-1.png` panels 01-10, `money-redo-sheet-2.png` panels 11-20), OUTLINE.md
and the cut list v0 in NOTES.md. Brief: BRIEF-DESIGN.md. This file gives the numbers; builders build exactly these.
Metres, hex colours, 30 fps, px at 1080x1920. The header rules of `../01-does-money-make-you-happy/DESIGN.md` hold:
everything is a function of story time and keys (hashed, no Math.random, no clock); glass, water, light, glow and
reflections are `userData.steam` and cast no shadow; 2 cel tones + highlight, ink on hard edges, hatching on shade
faces only; every mark drawn once, no texture tile; sleeves end before the wrist. The only signs a viewer can read in
the whole film are "$10,000,000" on the check and the HUD's digits. (measure) = a builder measures it in the code first.
`docs/rules/story.md` and `docs/rules/images.md`, named by the brief, are not on this branch: I worked from the
brief's own summary of them (no fighters as random people; hand-drawn, very detailed, each mark once).

Panel -> place: 01-05 city env · 06 `showroom` · 07 `boutique` · 08 mansion env · 09-10, 12-20 `coast` · 11 `coast`
at sea level (the harbour kit).

## 0. Reused pieces: how they are dressed (no redesign)
- `spud-rich` (07-14): the aviators are OFF (the sheets show none): new option `costume.rich: { glasses: false }`
  (task T8). `spread` 0.2 at the mirror, `sit` 1 in the car. He becomes `spud` on the cut to 15 (33.0 s): two actors,
  never both on screen.
- `moneybag`: `mark: false` everywhere (the sheets' sacks are plain).
- 01-02 coins: 3 `coin` at scale 0.35 (r 0.03), `flat` 1, on Spud's open palm; in 02 they fall 0.42 m in 0.3 s, one
  every 3 frames. 04: one `cashbrick` from Spud's hand into Rosti's two palms in 0.4 s.
- 05 cup: `cocoacup` (the cart's own cup). `papercup` is the striped juice cup with straws, `coffeecup` has a logo.
- Boxes (07, 08, 10): `gift` w 0.30, h 0.12, colours #f2b8c6 / #f4ead8 / #c9a6e8, ribbon #d9b24a. `shopbag` as built.
- Pen (08, 11): `feltpen` color #1b1a20, cap #c9a24a. Paper: `paper` on the new `clipboard` (section 6).
- The Duchess's watch (11): the dauphin costume's wrist watch as option `watch: true` on `duchess`, LEFT wrist (T8).
  Prop `goldwatch` lies flat with its band open and cannot be worn.
- Coupe from 08 on: `load` 0.4 (3 plain sacks on the back bench: the unspent million) + a pile riding the passenger
  seat, car frame: `gift` at (-0.46, 0.46, -0.25), (-0.44, 0.58, -0.27) rot 12, (-0.48, 0.70, -0.24) rot -8, one
  `moneybag` on top at (-0.46, 0.82, -0.26). Top 1.16: seen over the cowl through the windscreen (10), 0.46 under the roof.
- Mansion (08): env + `fountain` + coupe as the old 4a. Not used: `limo`, `mirror` (an oval on a wooden stand, 1.15
  tall: not the gold one).

## 1. CAR SHOWROOM (panel 06, 14.0-17.1 s)
Build as: room set `showroom` for `set.swap`, new file engine/page/set-showroom.js. Budget 20k triangles.
Frame: floor y 0; the window wall is the plane z -2.2; the lens side z +3.2 has no wall. Room x -4.5..+4.5, 3.4 tall.
- Floor: white tiles 0.9 x 0.9, lit #f4f2ee, shade #c9cdd6, grout #d9d6d0 (drawn lines, hashed 1-2 mm wobble). Sheen:
  a darker upside-down copy of the window light only, opacity 0.22, and under the coupe's nose a gold smear decal
  0.9 x 1.6, #e9b93a at 0.18, broken into 5 dashes. No real reflection.
- Walls lit #eef0f2, shade #c3c8d2, skirting 0.12 #d0d3d8. Ceiling #f7f7f5 with 2 light strips 0.25 x 3.0, #fffbe8.
- Window: x -3.6..+2.4 (6.0 wide), sill y 0.08, head y 2.90: 4 x 3 panes (1.5 x 0.93), mullions 0.05 wide #5a6068.
  Glass #cfe6ee at 0.10 with one diagonal streak per pane (#ffffff at 0.18, hashed place). Solid for contact.
- Outside: a pavement strip 1.6 deep at y 0 (#cfc8ba). CHIP_WIN (-1.6, 0, -2.75) facing +z: seen whole through the
  glass (sill 0.08, he is 0.53), about 215 px tall from the lens below. One palm flat 0.01 off the glass, the far
  arm `point`.
- View card at z -9.0, 16 wide x 7 tall, painted in code like the coast plates (one canvas 2048 x 896, brush strokes):
  sky #4f8fd6 at the top to #bfdcec at the horizon, 4 cumulus (#fffaf0, shade #d6e2ee), sea #3f7fb0 with its horizon
  at y 0.95, and THE HILL: the coast set's knoll in small: base from card x -1.0 to +4.2, a level top 1.3 wide at
  y 2.6, a sheer rock face on its right side down to the sea; grass lit #a9c94a, shade #6f9f3c, rock #c9b08a /
  #6a6470, a path line #d9c9a0 up its left flank. Same shape as in 09, 13 and 18: the viewer must know it again.
- Sun (afternoon, 40 degrees up, not in the window): 12 pane-shaped light patches on the floor from z -2.1 to +1.3,
  skewed 20 degrees toward +x, #fff6d8 at 0.35 (steam decals).
- Plant, in the set: white pot r 0.22 x 0.42 at (-3.9, 0, -1.6), 9 arching blade leaves 0.7-1.1 long, 0.16 wide,
  #3f8a3c / #2c6a34 / #6fb04a, top y 1.75.
- Coupe: (1.5, 0, 0.25), rot -40 (nose toward the lens, turned to screen left), `load` 0, `lamp` 0.3. Marks in the
  CAR frame: SPUD (-1.5, 0, +2.0), SELLER (+1.45, 0, +1.5) bowing 14 degrees, keys held out at y 0.50 (thin pinch at
  the fob); the sack lands on the bonnet at (-0.30, 0.67, +2.05), `tip` 7.
- Lens start: (-0.6, 0.95, 3.0) -> (0.4, 0.80, -0.5), fov 44. The hill's top falls at y 515 px, the sea horizon at 855,
  Chip's head at 1040. Top third: white wall and window.
- Risk: the bonnet is 0.62-0.88 high and Spud is 0.88 tall: the slam lifts both gloves to y 0.83, above his eyes. It
  works only from a side-on lens. Fallback after one failed check round: a white sales plinth 0.5 x 0.5 x 0.46 at
  the nose takes the sack (a panel departure to name in the delivery).

## 2. LUXURY BOUTIQUE (panel 07, 17.1-18.6 s)
Build as: room set `boutique`, new file engine/page/set-boutique.js. Budget 28k (chandelier 4k, rails 6k, mirror 2k).
Frame: floor y 0; back wall z -2.75; lens side z +2.75 open. Room x -3.25..+3.25, 3.4 tall.
- Walls: aubergine panels lit #7a4a86, shade #4a2c5a; 4 gold panel frames 1.1 x 1.9 on the back wall and a picture
  rail at y 2.6, #d9b24a / #9a7424; 2 gold sconces at y 1.9 (x -0.2, +2.4), bulbs #fff3c4.
- Floor: dark herringbone #6a4426 / #4f321c. Rug: prop `rug` 3.2 x 2.2, color #8a2f4a, at (0.3, 0, 0.2).
- Chandelier, LIT, at (-0.3, 2.55, -0.9): 2 brass rings r 0.55 / 0.32, 10 flame bulbs #fff3c4 each with a glow card
  r 0.12 (#ffd98a at 0.5), 48 crystal drops (one instanced mesh, 4-7 cm, #fff6e0 at 0.7, one glint each), 8 bead
  swags. Lowest point y 2.0. Light #ffd9a0 reaching 4 m. Drops sway +-1.5 degrees, period 3.1 s, hashed phases.
- Clothes rails: brass tube r 0.015 at y 1.20 on two stands, rail A x -2.9..-0.9 at z -2.3, rail B x 1.9..3.0 at z -2.2.
  9 garments on A, 5 on B: a wire hanger + a potato coat 0.46 wide x 0.52 long x 0.10 thick with round shoulders;
  colours in hashed order #6a3f8a, #efe3c8, #8a2f4a, #2f3f6a, #d9b24a, #b8336a, #4a2c5a, #f4efe6, #2f5d44; two carry
  a cream fur collar (the coat's lobe clumps). Each sways +-1 degree. A shelf at y 1.75 over rail A: 3 hat boxes
  r 0.16 x 0.14 (#f29bb5, #efe3c8, #c9a6e8).
- Door: an arch in the wall x -3.25, 1.3 wide x 2.1 tall, centre z +0.6; beyond it a warm daylight card #fff1d0 and a
  floor patch 1.3 wide x 3.0 long toward +x, #ffe2a8 at 0.35 (the sun is 32 degrees up: longer than the showroom's).
- **Gold mirror**, standing on the floor at (1.55, 0, -0.6), rot -38, leaning back 6 degrees: frame 0.95 wide x 1.75
  tall, 0.11 wide, lit #f2cf5a, shade #b5801c, 36 carved leaf bumps (each drawn once), a scroll crest 0.22 tall on
  top. Glass 0.73 x 1.53.
- **The reflection** (the sheet shows the fur in the glass): the glass is an opening into a box 1.2 deep painted
  #5a3668; a second `spud-rich` actor stands at the mirrored point behind it and plays Spud's arms with the sides
  swapped. In frame the glass is 300 px wide and shows him from chest to leaf. Turn the mirror until Chip is outside
  its cone. Fallback: no twin, the glass a sheen #dfe9ee to #b9c9d6 with 3 streaks.
- Marks: SPUD (0.55, 0, 0.1) facing the glass; CHIP (-0.15, 0, 0.45), both hands at the cuff of the sleeve on Spud's
  door side, then one arm `point` at the door; ASSISTANTS (-1.9, 0, -1.5) and (-1.1, 0, -1.9), each with 3 `gift`
  in the box hold. Lens start: (-0.9, 0.85, 3.4) -> (0.6, 0.75, -0.4), fov 42. Top third: chandelier and purple wall.

## 3. HARBOUR AT SUNSET (panel 11, 25.4-27.9 s; the brief asks for it far in 15 and 16)
**Verdict: no new set and no change to set-coast.js for it.** The harbour is a prop kit standing in the coast
room's sea: one sky, one sun and one `sink` value run from 11 to 20, so the sun clock never jumps between places.
Build as: prop kinds `pier` and `yacht` in a new file engine/page/props-harbour.js.

### 3.1 The kit (panel 11). Origin H = (-40, -55, -90) in the coast frame (y -55 is the sea surface)
- `pier` (5k). Frame: origin on the water under the shore end, the pier runs to -z. Deck 2.4 wide x 22 long, top
  1.35 above the water. Planks 0.18 wide laid across, 2 cm gaps, three browns in hashed order #a8794a / #94683e /
  #b88a58, ends uneven by +-2 cm, 2 nail dots each. Piles r 0.14 every 3.0 m on both edges, standing 0.55 above the
  deck with a rounded top and an iron band #3a3f47; rope (r 0.02, #d9c9a0, 3 turns) on the piles at z -9 and -12.
  Nothing is built under the water line: each pile ends in a foam ring (r 0.22, #fff3e0, breathing 5 s).
  spec `stand: true` adds a signing stand at pier (0.45, 1.35, -8.2): a post with a top 0.30 x 0.40 at y +0.50,
  tilted 15 degrees to the signer, carrying `clipboard` + `paper`.
- `yacht` (9k). Frame: origin on the water under the middle, bow -z. 16 long, beam 4.4, freeboard 1.6 at the bow,
  1.1 at the stern. Hull lit #fbf8f1, shade #c3c8d8, a water-line band #2a3550 0.12 tall, a gold pin line #d9b24a.
  Cabin z -5..+2 (boat frame), 1.9 tall, a band of 10 dark panes #2a3550, each with a sunset glint #ffb866; a
  flybridge with a raked screen; a radar arch 2.2 tall with a small dome; chrome rails r 0.02 on posts every 1.2.
  No name, no flag. It rolls +-1.2 degrees, period 4.2 s, and never heaves (the hull ends at the water line). A
  reflection decal on the water: the hull's colour at 0.45, 0.6 x its height long, 6 wavy dashes.
  Place: moored stern-to at the pier head, centre line at pier x -2.4, stern at pier z -23, bow at -39.
- DUCHESS at pier (0.68, 1.35, -8.6) facing +z, turned 20 degrees to her watch: pen in the right hand over the
  stand, left forearm raised, eyes to the watch, then up along the coast.
- Lens start, pier frame: (0.9, 2.30, -6.0) looking 1 degree toward +x of -z and 4 degrees down, fov 42: she fills
  48 % of the height left of centre, the yacht's stern stands behind her from the left edge to x 350 px, the sun is
  at x 800 px on the horizon, three piles step away on the right. Her face needs a warm front fill #ffd9a0 at 0.6
  (the sun is behind her). `sink` 0 here.
- No other lens of the film sees this kit: the cliff hides all water nearer than 380 m.
- Risk: the set's sea shader has only been seen from 55 m up; from 2.3 m the waves (0.22 m, 9 m long) are large in
  frame. Proof still before anything else is built on it.

### 3.2 The far harbour of 15 and 16: not on this set
- From set-coast.js: the road runs INLAND of the knoll, 9 m under its top, and the sea lies 55 m down a cliff on the
  knoll's other side. No lens at road height sees the sea, the sun or a harbour.
- One frame that holds road, climb and sea needs a crane 15 m up and 60 m back: 13-18 degrees of height, which
  leaves Spud 33-54 px tall and the truck under y 1400 px. It does not read on a phone.
- **Default: no far harbour is built.** The lost yacht is shown as the outline writes it ("the Duchess shrugs"):
  0.8 s back on panel 11's lens at 36.0 s, `sink` 1 (the disc half sunk beside the yacht), her eyes from the watch
  to the empty coast, a shrug, as the HUD hits 0:00 (question 5).
- The sea behind the road, as drawn in 12, 15 and 16, would be a new coast terrain (a road shelf on the sea side, a
  grass slope where the cliff is): a later draft, not a dressing. For that draft: `harbourfar`, one merged group of
  1.5k: a spit 60 long with 7 houses (#f4e2c0, roofs #c8623a), 14 window dots #ffd27a, a quay, a pier 30 long, the
  yacht side-on, 3 boats; baked sunset colours (lit #ffd9a8, shade #8a5a7a); drawn at scale 0.34 at 240 m (the far
  plane is 300 m).

## 4. TOW TRUCK (panel 16, 35.0-37.5 s)
Build as: prop kind `towtruck`, new file engine/page/props-tow.js, on the ambulance's cab front. Budget 9k.
Frame: origin on the ground under the middle, front +z. 5.6 long (z -2.8..+2.8), 2.1 wide.
- Cab z +0.9..+2.8, roof y 2.15: red-orange lit #e2572b, shade #a83a1f (the ambulance stripe's red), dark glass
  #1c222c at 0.6, nobody modelled inside, two round headlamps #fff6c8, a plain grille. Roof bar to y 2.33: two amber
  lamps #ffb02e flashing in turn, 2 a second (key `lights` 0..1, `clock`), each with a glow card.
- Deck z -2.8..+0.9 at y 0.98; side boards 0.25 tall #3a3f47 with 5 diagonal stripes #f2c230 / #22252b (no letters).
- Crane: pivot (0, 1.30, +0.2), a boom 3.6 long, 0.14 square, raised 30 degrees to the rear, #f2c230 / #b58a1c; tip
  (0, 3.10, -2.92). A cable r 0.012 hangs 1.75 to a steel hook 0.22 tall, #9aa3a8.
- Wheels r 0.42: front z +1.9, twin rear z -1.6. Keys `len` (wheels turn len / 0.42), `bend`, `lights`.
- **The tow** (as the sheet: tail first): the coupe is not turned. It hangs by its tail lip, lifted 0.45, rolling on
  its front wheels: coupe at truck frame (0, 0.19, -5.10), rot +180, `tip` 7 (sign: measure), `door` 0, `lamp` 0.
  Train length 10.45. Already hooked on the cut: no hooking is shown. The truck stands west of the car and pulls it
  toward -x, back to the city: 0 -> 5 m/s in 1.2 s, then steady.
- It must read as a silhouette at 220 px tall: the slanted yellow boom, the cable, amber flashes, the gold car
  hanging tail-up behind it.

## 5. THE $10,000,000 CHECK (panels 01-02, 0.0-4.3 s)
Build as: prop kind `bigcheck` in a new file engine/page/props-spree.js. Budget 0.2k.
- Frame: origin at the middle of its underside, lying flat, face up; the text reads along +x. 0.56 x 0.24, 2 mm
  thick, paper #fbf6ea, one corner lifted 8 degrees.
- Face (one canvas 1024 x 440, drawn once): a double border #2f6b4a; "$10,000,000" in heavy numerals #1d2a22, cap
  height 0.085, spanning x -0.17..+0.23, each glyph hashed +-1.5 px and +-1.2 degrees (hand-inked); under it two
  wavy rules and one signature scrawl that is no letter; a round seal r 0.035 with 12 ticks at the +x end. The -x
  end is a blank pad 0.09 wide.
- Hands: the Duchess's flat palm (`press`) lands on the pad at (-0.225, 0.002, 0), so no finger covers a numeral.
  Nobody lifts it. If a later draft does: thin pinch at (0.28, 0, 0) and a grips.mjs SIZE row.
- Key `slap` 0..1: the corner flattens in 2 frames and the paper bounces 1 cm over 3 frames.
- On the cart: centre (0.02, 0.462, 0.22) in the cart frame, long side along z. The tent card and the cup leave the
  counter for this film. Readable when the numerals' cap height is 60 px or more in 01 and 110 px in 02.

## 6. SIDE CHARACTERS (panels 06, 07, 08)
**Verdict: no new costume type and no rig work. Three new character files (data) on the built costumes `dauphin`
and `teller`, in black, plus three small props.** `tot.json`, `rosti.json` and `dauphin.json` themselves are not
reused: Rosti is this film's coffee seller, and one face in two jobs draws a false line (old 11.3). Skin, iris,
cheeks and gloves as Spud's. Ids are proposals; names are Jonny's.

    carseller  body { height 0.84, width 0.66, depth 0.58, lump 0.03, seed 103, taper 0.06 }  limbs "#1f2126"
               face { default "eager", browShape { arch 0.10, thick 0.6 }, size 0.9 }  hands 1.2
               costume { type "dauphin", blazer "#24262c", lapel "#111318", gold "#c9a24a", ascot false,
                         watch false, square false }  + worn `bowtie`, `flatcap`
    assistant  body { height 0.74, width 0.60, depth 0.54, lump 0.03, seed 109, taper 0.02 }  limbs "#1f2126"
               face { default "serene", size 0.85 }  hands 1.1   costume as carseller, no bow tie  + worn `flatcap`
               (cast twice, ids as1, as2: twins, as drawn)
    agent      body { height 0.82, width 0.70, depth 0.62, lump 0.03, seed 107, taper 0.04 }  limbs "#3b3f48"
               face { default "kind", size 0.9 }  no sprout (bald)  hands 1.15
               costume { type "teller", shirt "#fbf8f1", vest "#2b2d33", tie "#8a2f4a", glasses "#2b2d33",
                         garters false }  + held `clipboard`

- Jacket sleeves end 0.11 before the hand's centre, then 0.02 of white cuff; shirt sleeves 0.09 before it.
- New props, all in props-spree.js (1.2k together):
  - `flatcap` (worn): soft black cap #1b1c22, crown r 0.17 x 0.06 bulging over a band 0.035, a visor 0.06, its lowest
    edge 0.05 above the brows (measure). The leaf: size 0 under it if the rig allows, else through a 0.03 hole.
  - `bowtie` (worn): 0.14 wide x 0.07, black #111318, origin at the knot, at (0, 0.34, front + 0.01) (measure).
  - `clipboard`: board 0.24 x 0.32 x 0.008, #8a6a3c, a steel clip 0.10 wide; spec `gold: true` (11) gives it a rim
    #d9b24a. It carries `paper` 0.21 x 0.30 with 7 wavy rules and no letter. Hold: the agent's left hand under the
    bottom edge, thumb on top, top edge at y 0.50; Spud signs at the lower right corner. Needs a SIZE row.
- If `dauphin` has no `ascot` / `watch` / `square` switches (measure), T8 adds them as booleans.
- Budgets: each character as the cast's (the built costumes); nothing new above 0.5k.

## 7. THE MONEY-BAG MOUNTAIN (panel 05, 9.3-14.0 s)
Build as: prop kind `bagmountain` in props-spree.js: ONE instanced mesh of a low sack (140 triangles: a lathe body, a
neck, a rope ring) in the `moneybag` look: cream lit #d9c9a3, shade #a8966e, rope #8a6a3c, plain. Budget 32k.
- Heap 4.4 (x) x 2.4 (z) x 3.1 tall, 230 sacks (150 on the front face, 40 round the back rim, 40 in the base
  ring), each 0.30 wide x 0.34 tall +-8 %, hashed turn, leaning 12 degrees at most. Origin: bottom centre.
- **One bag gone, read in 1 s. Three signs at once:**
  1. A missing tooth on the skyline. The top three rows are laid as neat as bricks: 3 sacks at y 2.42 (x -0.31, 0,
     +0.31), 2 at y 2.70 (x +-0.155), and the apex seat at y 2.98 is EMPTY: the mountain ends in a flat step one sack
     wide with blue sky in it. The two shoulder sacks lean 8 degrees outward. Lower rows are untidy, so the eye goes
     to the one place that is in order and broken. (No dust ring: canvas leaves none, and it would be 6 px.)
  2. Motion in the first second: key `shed` 0..1 over 9.3-10.6 s: three notes flutter down from the seat (2.6 m in
     1.3 s, the old 6.5 tumble numbers) and the left shoulder sack slides 0.04 into the gap, ease `settle`.
  3. The bag itself: a real `moneybag` (`mark: false`, `open: true`) at Spud's side on the ground, 0.55 from him,
     5 `banknote` fanned out of its mouth.
  Key `gap` (1): 0 puts the apex sack back.
- The HUD above it says the same: $9,997,000, ten full sacks (section 10).
- Frame targets: an apex sack 70 px wide or more, the sky hole 70 x 60 px or more, the seat between y 480 and 600 px
  (under the HUD strip). Lens start, Spud at (0.2, 0, 0.6), heap centre (0, 0, -2.4): (0.5, 0.42, 4.2) ->
  (0.1, 1.35, -2.4), fov 55: a sack is 78 px wide at the apex, the seat at y 500.

## 8. THE COAT ON THE SEAT, and what the coupe needs for it (panels 14, 15, 16)
### 8a. `coatheap`, in props-tow.js. Budget 2.5k
- The built coat's look, no new colour: cloth #efe3c8, shade #cdbb98, lobe clumps #f7efdc along every edge, ink marks
  #8a7556. Heap 0.60 (x) x 0.48 (z) x 0.24 tall, the collar roll peaking at 0.30. Origin: bottom centre. It rides the
  coupe on the driver's cushion, car frame (0.22, 0.46, -0.25).
- **The spill**: one sleeve runs over the cushion's door-side edge, across the body sill (y 0.19) and lies 0.30 out on
  the road, cuff clumps last. The chain (the costume's 24 links, 0.046 x 0.032, #f6c832 / #b5801c, glint #fff3b0 on
  every third) runs with it: an S on the heap, 7 links over the sill, 4 on the asphalt. No sunglasses.
- Why the spill: from behind the car the seat itself is hidden by the rear quarter (a grazing angle); the cream
  sleeve and the gold chain on dark asphalt under an open door are what panel 15's lens sees, 147 px long.
- In 16 the driver's side faces the sea, away from any lens that holds truck, climb and crest: the coat is not
  seen there (question 6). The tow man shuts the door: the heap is drawn without its spill when `door` is 0.

### 8b. Coupe key `door` (engine/page/props-coupe.js; today it has no door). Budget 1.2k
- Driver's door (+x side): z -0.55..+0.50, y 0.19..0.95, hinged on a vertical line at (x +0.90, z +0.50). Key `door`
  0..1 = 0..62 degrees outward (its tip reaches 0.93 from the body). The door is the body's own patch, cut out and
  hung, so at `door` 0 every pixel is as today (golden). Inside: a cream trim panel #f1e4c6 with piping #c9a55a and
  a chrome pull 0.12 long; a dark jamb strip 0.06 wide #3a2a1e round the hole. The driver's side pane is hidden while
  `door` > 0.02 (rolled down).
- Fallback if the cut costs more than half a day: no open door; the coat lies over the seat back, collar at y 1.20,
  and is seen through the windscreen (a panel departure).

### 8c. Coupe key `brake` (panel 14; the cabin has no handbrake). 0.3k
- Lever between the front seats: pivot at car frame (-0.12, 0.47, -0.38), 0.24 long, chrome r 0.012, a grip 0.09
  long r 0.018 #3a2a1e with a chrome button. Key `brake` 0..1 = 6 -> 40 degrees up; in 14 over 5 frames, ease
  `anticSettle`. Spud's RIGHT hand on the grip, at (-0.12, 0.60, -0.23) when pulled.
- Lens start for 14, car frame, inside: (-0.50, 0.90, 0.22) -> (0.20, 0.92, -0.22), fov 50: the lever low in the
  middle, his face above it turned to his own window (the hill's side). The passenger pile stays behind the lens.

## 9. THE SUN AS A CLOCK
The sun's true height per stage. A disc is never cheated lower than its stage to get it into frame; where it cannot
be in frame, the light, the shadows' length and the HUD's sun carry the hour.

| Stage | Panels (video s) | Sun up | Place and how the hour shows | Key / fill |
|---|---|---|---|---|
| Noon | 01-04 (0-9.3) | 65 deg | city env, noon light; shadows 0.47 x height; the disc in frame only in 03 | #fff6e0 / #bcd8f0 at 0.5 |
| Early afternoon | 05 (9.3-14.0) | 50 | same env; shadows 0.84 x | #fff0cc / #bcd8f0 |
| Afternoon | 06 (14.0-17.1) | 40 | showroom floor patches #fff6d8, 3.4 m deep | #fff3d6 / #cfd8e6 |
| Afternoon | 07 (17.1-18.6) | 32 | boutique door patch #ffe2a8, 3.0 m long | #ffd9a0 / #5a3668 |
| Afternoon | 08 (18.6-20.6) | 26 | mansion env, warm; shadows 2.05 x; no disc (it is behind the lens) | #ffe2b0 / #a9c0e0 |
| Late afternoon | 09 (20.6-23.0) | 12 | coast, `late` 1: the disc 6 of its own widths over the sea | table below |
| Late afternoon | 10 (23.0-25.4) | 6.8 | coast, `late` 0.5: an orange rim on his left cheek, lit boxes | halfway |
| Sunset | 11-16 (25.4-37.5) | 1.6 -> 0 | coast as built, `sink` 0 -> 1; the deadline 36.0 s = the disc half sunk | as built |
| After sunset | 17-19 (37.5-45.5) | 0 -> -0.8 | `sink` 1 -> 1.45 | as built, dimming |
| Last sliver | 20 (45.5-49.5) | -0.8 -> -1.75 | `sink` 1.45 -> 2 at 49.0: a sliver 71 x 7 px; the first star | dusk |

### 9.1 City and mansion (envs)
- `golden-city-crossing` is painted at golden hour with a low sun at the street's far end, and every env lens looks
  down that street: at 0.0 s the film would open on a setting sun and the clock would have nowhere to fall. Smallest
  change that keeps noon: ONE new painting `old-town-noon` after Jonny's panel 01, no code. spec: size 896x1344,
  upscale 2, refine 0, eye height 1.1, vfov 46, eye pos (0, 1.1, 6), surface "road", groundMax 40, light key
  (1.5, 9, 3) "high noon sun", shadow 0.3.
  prompt: "anime film background painting, gouache, soft brush strokes, low ground level view across a wide empty
  cobbled old town street that fills the bottom half, pastel shop fronts with striped awnings and flower boxes, iron
  street lamps, high noon light, short shadows, deep blue sky, small white clouds".
  no: "people, potato, car, vehicle, text, letters, sign, logo, sun disc, sunset, golden hour, long shadows, aerial
  view, lamp in foreground, tree in foreground".
  Fallback with no painter at hand: a noon grade `city-crossing-noon` (`graded_from` the golden env: sky to
  #4f9be6, whites neutral) with the cart's canopy, the Duchess or the bag mountain standing over the street's far end.
- Mansion: a grade `mansion-afternoon` (`graded_from` `mansion-day`): whites to #ffe9c8, sky to #9fc8e8, clouds to
  #ffd9b0, shade to #7a6a9a. The painting holds no sun and no long shadow, so a grade is enough.
- `sundisc`, new prop in props-spree.js (0.1k, steam): a disc that faces the lens on the env's sky distance; spec
  `az`, `el` (degrees), `r` 1.1 degrees, color #fffbe0, halo 5 degrees #fff3b0 at 0.5. The env cards hide it. Used
  in panel 03 (the low angle on her pointing hand) at el 65.

### 9.2 Coast: four additions to set-coast.js, all invisible at their defaults (golden unchanged)
Why the set and not a painted env for 09: the hill Chip climbs must be the hill of 13 and 18.
- **New key `late` 0..1** (default 0 = the sunset as built; a story-time key list like `break`; step it on cuts,
  never inside a shot). The sun's height becomes lerp(sunset height, 12 degrees, late); its azimuth stays. Every G/S
  colour pair gets a third state A, mixed in by `late`:

| Thing | Late afternoon (A) |
|---|---|
| Sky at the sun's azimuth: horizon / 10 deg / 25 / 45 / zenith | #ffe6b0 / #ffd590 / #bfdcec / #86bde8 / #4f8fd6 |
| Sky 90 deg and more from the sun: horizon / 25 / zenith | #f3dcc4 / #a9cfee / #4f8fd6 |
| Disc, halo | #fffbe6, r 1.9 deg; halo 6 deg #fff1c0 at 0.5; no ray fan |
| Cloud plates | each plate colour mixed 0.8 toward its own brightness x #fff4e0 (cream clouds, undersides #f6d9a8) |
| Grass lit / half / shade | #a9c94a / #6f9f3c / #3f6a3a, tips #e6f08a |
| Sea trough / body / crest | #2f6492 / #3f7fb0 / #cfe6ee; sun path #ffe7a8 at 0.6, 3 deg wide at the horizon |
| Rock lit / shade | #c9b08a / #6a6470 |
| Cast key / fill sky / fill ground | #ffdf9a from TO (0.12, 0.21, -0.97) / #9fc4e8 / #7a8a4a; key : fill 2 : 1 |
| Fake long shadows | length = height x 4.7, tint #3f4f7a at 0.35 |

- **`sink` runs on to 2** (today it stops at 1). 0..1 as built (1.6 -> 0 degrees). 1..2: 0 -> -1.75 degrees, and
  with d = sink - 1 the dusk comes in: zenith to #2f2f6a, 45 degrees to #5a4a94, the horizon band within 40 degrees
  of the sun to #ff8a4a and 5 degrees tall, plate undersides to #e86a8a and bodies to #5a4a8a (mix 0.7 d), sea body to
  #3a3668, the gold road from 16 to 6 degrees wide at half strength, grass lit to #6f7a52 and shade to #2a3a36, the
  cast key x (1 - 0.65 d), fill sky to #6a5aa8. From behind, the two friends go toward #2b2440 (0.7 d) with a rim
  #ffb070 of 1.5 px. The first star from d 0.6, fading in over 0.6 s: 4 points, core 5 px, rays 12 px, #fff6e0, 3.5
  degrees right of the sun and 9 degrees up (y 300 px in the last hold), twinkling 0.7-1.0 on a 1.7 s period.
- **spec `press`**: the two pressed grass patches [[x, z, r], [x, z, r]] (today fixed at SEAT and the old bag):
  [[0, 0, 0.45], [0.72, 0.05, 0.34]] for Chip. `shadows`: [[0, 0, 0.30, 0.85], [0.72, 0.05, 0.24, 0.50]].
- **spec `railGap`: [15, 25]** (default none): no posts or bands between those x. Today the steel rail runs unbroken
  between the road and the climb, and Spud would walk through it in 15.
- Keys for this film: `break` 1 throughout; `late` 1 from 20.6, 0.5 from 23.0, 0 from 25.4; `sink` [[25.4, 0],
  [36.0, 1, "linear"], [45.5, 1.45], [49.0, 2]].

### 9.3 Marks on the coast
- CARSTOP2 = (19.5, road y, road centre z - 1.05) (measure with COAST.roadAt), nose +x: at the gap and the climb's
  foot (19.2, -8.1, 14.4), 1.15 from the rail's line so the door swings free. The old CARSTOP (26) is 7 m past it.
- CHIP (0.72, 0, 0.05) facing -z, on Spud's right: screen right from behind, as panels 18 and 20 (question 4).

### 9.4 Coast: what each panel can see (measured from set-coast.js; lenses are starting points for qa/camfit.mjs)
| Panel | Where and lens | In frame |
|---|---|---|
| 09 | Chip walks from (1.3, -1.0, 8) to (1.0, -0.2, 3.5), up the knoll's last metres; lens (1.0, 0.2, 11.5) -> (1.1, 0.6, 0), fov 50 | Chip 168 px, his back; flowers in front; a sea band of 100 px; the disc at y 576 px, 3 deg right of him |
| 10 | car at x -60 heading +x; the old panel 01 lens in the car frame | the sun is on the driver's side, 21 deg ahead of abeam: its disc is NOT in a lens that looks back through the windscreen. Rim #ffb866 on his left cheek and on the boxes |
| 12 | car x -50 -> -20; lens inland and high (-32, 1.6, 58) -> (-30, -6, 20), fov 44-50 | car side-on moving right, low in frame; verge; a sea band 5.7 deg tall; the sun on it. Keep the horizon at y 560 px or lower |
| 13 | car abeam of SEAT (x 0 +-5): Chip is 22.8 m off and 26 deg up, in the top of the driver's pane | Chip dark on the crest against the cloud plate; no sea, no disc. From his eye at fov 50 the pane frames it and Chip is 45 px; at fov 18 he is 150 px with no frame |
| 14 | cabin lens of 8c | his face, the lever |
| 15 | CARSTOP2; lens behind the car on the sea side, car frame (+1.7, 1.7, -4.2) -> (+2.2, 0.6, +1.5), fov 50 | tail quarter right, the open door's cream inside, sleeve + chain on the road 147 px, Spud's back 220-340 px going left through the gap and up the climb |
| 16 | lens on the road to the east (38, -7.4, 22.5) -> (15.5, -6.1, 14.1), fov 44 | the coupe 207 px wide hanging from the boom (y 1130-1350), the truck 220 px tall behind it, Spud's back 72 px on the climb above them, Chip a 25 px dot on the crest at y 660, sunset sky. No sea |
| 17, 19 | front lens (0.31, 0.50, -3.7) -> (0.36, 0.48, 0), fov 40 | both faces; afterglow plate behind |
| 18, 20 | the built c09 and c09push | as the old 09 |
A sun disc never sits behind a HUD chip: frame it in the gap between the chips or below y 480 px.

## 10. THE MONEY COUNTER + SUN CLOCK (0.1-43.2 s)
Build as: two opt-in parts `money` and `sun` in engine/page/hud.js (keys `[t, value, dur?]` as the battery's) and
their pass-through in storyboards/lib/overlay.mjs. No English: a dollar sign, digits, sacks, a sun on an arc, an
hourglass.
- **Strip**: y 344-462 (118 tall), under a top caption band of y 210-330 (question 2). The house chip: fill
  rgba(18,16,24,0.66), edge rgba(255,255,255,0.16), radius 20.
- **Money chip**, left: x 72, 380 wide. Row 1, centre y 386: "$" in #ffd25a + "10,000,000" in #fff8ec, CapBlack 58
  px, fixed cells of 34 px (a comma 14), written as on the check. Row 2, centre y 436: 10 sack pips, each 24 x 28,
  one every 34 px: one sack = one million. Pip k is filled from its bottom by clamp(value / 1,000,000 - (k - 1));
  full #e9dcb4, empty an outline of 3 px at rgba(255,248,236,0.32).
- **A purchase**: the number runs down over the key's dur (0.35-0.6 s), the chip kicks 5 px down and back in 0.18 s,
  and each sack that empties glows #ffd25a for 0.4 s. Spending is progress, so nothing here is red.
- **Sun chip**, right: right edge x 908, 150 wide (292 from 23.2 s, growing in 0.2 s). A quarter arc of r 76: from
  straight up (noon) clockwise down to a sea line (#7cc4ff, 3 px, 3 bumps, 60 long) at y 444. The sun, r 16 with 8
  rays of 5 px, sits at 90 degrees x p along it; the arc behind it is dim (0.25), ahead of it 4 px in the sun's
  colour: p 0-0.3 #ffe066, to 0.6 #ffd04a, to 0.85 #ffb23d, then #ff7a3a without rays, cut off by the sea line as it
  sinks, with a 10 px reflection under it.
- **The last minute**: at 23.2 s (the narrator's "One minute") an hourglass 22 x 30 and "1:00" (CapBlack 50) pop in
  beside the arc and run to "0:00" at 36.0 s. Under 0:10 the digits are #ff4d4d and the chip's edge pulses red at 2 a
  second. At 0:00 the money number and its last sack flash #ff4d4d twice (0.15 s on, 0.15 off), run to $0 in 0.5 s,
  and both chips drop to 0.45 opacity.
- **Keys v0** (the director retimes them to the buys):
  money [0.1, 10000000] [6.9, 9997000, 0.35] [10.4, 9996999] [11.4, 9996998] [12.4, 9996997] [13.4, 9996996]
  [14.6, 8000000, 0.45] [17.5, 6500000, 0.45] [19.2, 1000000, 0.6] [36.0, 0, 0.5]. The four single dollars in panel 05
  ARE the narrator's "a dollar a second": the mountain stands, the last digit ticks.
  sun p [0.1, 0.02] [6.5, 0.06] [9.3, 0.18] [14.0, 0.34] [17.1, 0.46] [18.6, 0.58] [20.6, 0.72] [23.0, 0.82]
  [25.4, 0.90] [36.0, 1.0], each over 0.4 s (the sun slides on every cut).
- **In and out**: pops in at 0.1 s with the slap (scale 0.9 -> 1 in 0.18 s). Fades over 1.0 s from 42.2 s, on "he
  forgot all his worries": the counter leaving IS the line (question 3).
- At 360 px wide (a phone): digits 19 px tall, a sack 8 x 9 px, the sun 11 px, "1:00" 17 px.

## 11. POSES: SITTING (17-20) AND THE LEAN (19)
- Spud at SEAT, Chip at (0.72, 0, 0.05), both facing -z: 5.5 cm between the bodies (0.38 + 0.285 half widths).
- **The lean**: Chip `lean` 12 degrees toward Spud and Spud 3 toward Chip, 0.6 s, ease `settle`. That presses Chip
  7.5 cm into Spud's flank (13 % of Chip's width; the gate allows 18 % inside a window). 14 + 3 gives 16 %, 18 + 3
  fails. It needs an `allowClip` window (chip with spud, 42.0-49.5, "the lean, panels 19-20").
- **A potato has no shoulder**: Chip's crown must land on Spud's flank between y 0.46 and 0.58 (above his widest line,
  under his eyes) (measure, both seated). Lower than that reads as leaning on his belly.
- **Spud's arm is in the way**: his right arm hangs exactly where Chip's head lands, and an arm more than 4 cm into
  another body fails inside a window too. Both of Spud's hands stay in `lap` from the sit to the end; Chip's near
  hand in `lap` as well.
- **Chip's leaves**: the inner leaf tip ends about 0.24 outside Spud's skin at Spud's eye height (estimate). Keep it
  0.15 or more, or `face-hidden` trips in the front shot. Do not droop it toward Spud.
- **Where a lean pivots** (measure): if `lean` turns Chip about his middle, his seat slides away 6 cm
  (`stance-slide`): add 0.06 toward Spud in the same 0.6 s.
- **Half-closed eyes** (Spud, 19): lid 0.45 trips `eyes-readable`: a window with the reason "calm half-closed eyes,
  panel 19". Chip's closed smiling eyes likewise.
- **Never benched**: Chip sitting on the ground, and Spud's `sit` beside a body 5.5 cm away (the sit tips him
  forward, not sideways). Bench both first: front, behind, 10 fps strips.
- **Long holds**: 19 is 3.5 s and 20 is 4 s. Keep breath, 2 blinks each, one twitch of Chip's leaf, the grass wind
  and `sink` moving: no still of 1 s.
- **Left and right**: seen from the front (17, 19) Chip is screen LEFT of Spud; the sheet draws him right in all four.
- Also, 07: Chip's two gloves on the coat's cuff stay 2 cm outside the sleeve (a touch warning, never an arm into
  Spud); window "the sleeve tug". This gesture carries the mute test three times: it gets its own strip.

## 12. BUILDER TASKS (one owner per file)
| Task | Owner file(s) | What | Triangles | Proof (each also at 360 px wide) |
|---|---|---|---|---|
| T1 | engine/page/set-showroom.js | section 1 | 20k | panel 06 still; Chip through the glass |
| T2 | engine/page/set-boutique.js | section 2, the mirror box | 28k | panel 07 still, twin on and off |
| T3 | engine/page/props-harbour.js | `pier`, `yacht` | 5k + 9k | the sea from 2.3 m FIRST; panel 11 at `sink` 0 and 1 |
| T4 | engine/page/props-spree.js | `bigcheck`, `bagmountain`, `sundisc`, `flatcap`, `bowtie`, `clipboard` | 0.2k + 32k + 1.5k | panels 01, 02, 05 (gap 1 and 0, a `shed` strip), 03 |
| T5 | engine/page/props-tow.js | `towtruck`, `coatheap` | 9k + 2.5k | the train side-on and from panel 16's lens; the heap with its spill |
| T6 | engine/page/props-coupe.js | keys `door`, `brake` | 1.5k | panels 14, 15; golden at `door` 0 |
| T7 | engine/page/set-coast.js | `late`, `sink` to 2 with dusk and star, `press`, `railGap`, CARSTOP2 | 0 | from c09: late 1, 0.5; sink 0, 1, 1.45, 2; panels 09, 15; golden at defaults |
| T8 | engine/page/costumes-everyday.js, costumes-art-cast.js, characters/potatobrawl/{carseller,assistant,agent}.json | section 6; `watch` on `duchess`; `rich.glasses: false` | 0.5k | turnarounds of the three; Spud rich without glasses |
| T9 | engine/page/hud.js, storyboards/lib/overlay.mjs | section 10 | - | stills at 0.2, 7.0, 12.0, 14.8, 19.5, 30.0, 35.5, 36.2 s; a strip of 35.8-36.8 |
| T10 | assets/environments/old-town-noon/, mansion-afternoon/ | 9.1 | - | review.png each; the cart at noon |
Shared files stay the director's: sets.js (two set types), props3d.js (the registry), grips.mjs SIZE rows for
`clipboard` and `bigcheck`. All: VOCAB lines; prime every new key with a dur-0 set at t 0; a new room at most 10 %
slower per frame than `mansionhall`. Bench before the draft: section 11's two sits.

## 13. OPEN QUESTIONS (my default in brackets)
1. The brief reuses `golden-city-crossing`, but it is a golden-hour street with a low sun in every frame: noon cannot
   read on it. [Paint `old-town-noon`; the noon grade is the fallback.]
2. Where is the caption band? [On top, y 210-330, the HUD under it at 344-462. If the subtitles stay at y 1180, the HUD
   moves to y 214 and frees 130 px of sky.]
3. Does the HUD stay to the last frame? The brief says all video. [It fades from 42.2 s on "forgot all his worries",
   so panels 19 and 20 are only the sunset.]
4. Which side does Chip sit on? The sheet puts him right of Spud both from behind and from the front. [Spud's right,
   as 18 and 20; in 17 and 19 he is screen left.]
5. The far harbour of 15 and 16 cannot be seen on this set (3.2), and sheets 12, 15 and 16 draw the sea behind the
   road, which this set does not have. [No far harbour and no new terrain in this draft; 0.8 s of the Duchess's
   shrug on panel 11's lens at 0:00, taken out of panel 16's 2.5 s.]
6. Panel 16's text wants the coat seen on the seat. [Not in 16: it reads in 15, by the spill.]
7. Panel 06: sack on the bonnet, 0.67 high beside a 0.88 Spud. [Follow the panel side-on; the plinth after one failed
   round.]
8. The mirror's reflection. [The twin; the sheen if the twin costs a check round.]
9. The coupe's door is a cut in a golden-checked body. [Build it; the seat-back coat if it costs over half a day.]
10. Ledger: car $2,000,000, clothes $1,500,000, mansion $5,500,000, leaving $1,000,000. [As keyed in section 10.]
11. Twin shop assistants from one character file. [Yes, as drawn.]
12. Panel 09's far mansion "small and far below". [Left out: the hill, the light and the HUD carry the beat.]
13. Panel 10's sun "through the side window" cannot be in a lens that looks back through the windscreen (9.4). [Rim
    light and lit boxes, no disc.]
14. Names and ids of the three side characters are Jonny's. [carseller, assistant, agent until he names them.]
