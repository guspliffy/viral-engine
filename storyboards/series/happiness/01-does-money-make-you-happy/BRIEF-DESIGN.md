# Design brief: "Does money make you happy?" (happiness series pilot, 14 Nov 2026)

You are the designer (Fable). Write `DESIGN.md` in this folder: the numbers Sonnet builders build from. Never code.
Read first: `OUTLINE.md` (the story Jonny OK'd), `board.png` (the 10-panel sheet Jonny OK'd: THE LOOK TARGET, match it),
and for the format and depth of a design doc `storyboards/series/you-wake-up-mid/02-sinking-car/DESIGN.md` (sizes in
metres, hex colours, light directions, what is see-through `userData.steam`, everything a function of story time, no
Math.random, no clock). Engine names: `docs/VOCAB.md`. Look: hand-drawn Ghibli anime, very detailed, ink lines on hard
edges, cel shading, hatching on shade faces; whole frame sharp. Cast are potatoes about 1 m tall (Spud ~0.85 m);
design every set for that scale. Vertical 1080x1920 frame.

Jonny's words for this series: "sceneries should be built with love to the detail and the beauty of for example the
sunset scene should really come through." The sunset (panel 09/10) gets the most care of everything.

## Reuse, do not redesign (only say how it is dressed or recoloured)
- Spud (`characters/potatobrawl/spud.json`, sweater in `engine/page/costumes-art-cast.js` spud), Chip.
- Money bags `moneybag` (props-heist.js), banknotes `banknote` / `cashbrick` (props-money.js), ski mask: check
  `eyemask` in props-heist.js; if it is only a domino mask, design a full black knit balaclava with eye holes
  (leaf pokes through a hole on top, as in panel 03).
- Night street + police: Fight Flight Freeze 01 (`storyboards/series/fight-flight-freeze/01-bank-robbery/`):
  `policecar`, `policevan`, `sirenwash`, `lightpool`, `policecap`. Police = potatoes in dark navy caps, NO badges.
- City street: painted envs `sunny-city-avenue` or `golden-city-crossing` (assets/environments; pick one by its
  review.png against panel 02). Car interior parts: `carseat`, `steer` (props-road.js), `carglass`, `headrest`
  (props-sinkcar.js), rain streaks from the sinking-car design. Cars: the `roadster` rig (car-roadster.js) and the
  `hatchback` (car-hatchback.js) / `citycar` prop.

## Design these (new; one numbered section each, with a "build as" line: rig variant / props file / room set / env)
1. **Spud's rich outfit** (panels 01, 04-10): long cream fur coat over the teal sweater (hand-drawn fur clumps, no
   repeating texture, sleeves end at the wrist: check the 3-finger gloves stay free), thick gold chain, gold-rimmed
   sunglasses pushed up on TOP of the head (never over the eyes; the leaf stays visible). Must not hide his face or
   arms in a hug of two money bags (panel 07) or when sitting (panel 09/10, the coat must not read as a furry lump
   from behind: give the back a readable shape).
2. **Gold car** (panels 01, 04, 07, 08): long low two-door gold coupé with a hard roof (rain on the windscreen in
   01), cream leather seats, rounded classic shape, no logos. Based on the roadster rig if that works (a hardtop,
   longer bonnet). Interior shot 01: driver seen through/around the passenger side, back seat piled with 6-8 money
   bags, one split open with notes. "Out of fuel" readable without words in 08 (say how: e.g. a fuel gauge needle
   on E in a dash close-up, or the car rolling to a stop with a last cough of exhaust; pick the clearest).
3. **Bank vault** (panel 03): room set, round steel vault door swung open, shelves of banknote bricks, red alarm
   light (rotating beacon) washing the walls. Plus the bank's front on a night street for the escape (can be a
   facade card in the FFF street).
4. **Mansion**: (a) exterior day (panel 04): white classical facade, double front stairs, fountain, gold car on the
   gravel; (b) exterior night at the gate (panel 07): iron gate, lamps, wet drive; (c) the front door from inside
   (panel 05): tall wooden door, a column of 10 locks / padlocks + chains, side window to the doorstep where Chip
   stands in the rain with a gift box; (d) the marble hall (panel 06): double staircase, very long table (seats for
   20), one candle, one plate, unlit crystal chandelier, tall arched windows with moonlight, a wall clock that can
   show 3:00 (or a grandfather clock). One room set for c + d if they can share the hall.
5. **White limousine** (panel 02) and **white ambulance** (panel 08: lights on, no words or real markings; red
   cross-free, use a plain stripe): variants of existing cars/vans, numbers only.
6. **Coast road + cliff top + SUNSET** (panels 01, 08, 09, 10): a winding coast road on green cliffs above the sea;
   the grassy cliff top with wildflowers where Spud sits; the sea. Two sky states on ONE world, keyed by story
   time: grey rain dusk (cold open, 01) and the clouds breaking into a huge orange, pink and gold sunset (09-10),
   sun on the horizon, gold road of light on a calm sea, seabirds, warm light on the grass, wind in the grass.
   The break must be visible on screen as it happens (about 3 s: grey cloud deck parting, light sweeping in).
   Say whether this is a painted env (SDXL via engine/plates/env.py, give both specs and prompts) or a 3D set like
   the gorge (props-gorge.js), and why. Banknotes lifting off the open bag and blowing away over the grass (10):
   how many, path, speed, wind direction (deterministic).

## Rules that bind the design
Realistic sounds only (not yours), captions sit in the upper third: keep the top third of each key shot calm (sky,
ceiling, wall). No words, letters or numbers anywhere in the sets (the 3:00 clock face uses hands, no numerals
needed). Nothing glitchy: no z-fighting planes, no flicker. Keep triangle counts sane (say a budget per item).

## Return
Write DESIGN.md (aim 12-20 KB). Then reply in at most 200 words: the sections, the build-as line per item, open
questions each with your default, risks.
