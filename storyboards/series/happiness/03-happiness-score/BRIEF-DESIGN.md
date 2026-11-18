# Design brief: happiness film "I could see everyone's happiness score" (16 Nov 2026)

You design ONLY what the engine can't reuse, from the four panel sheets Jonny approved ("go for it", his look target):
`happy-score-sheet-1.png` (panels 01-12) ... `happy-score-sheet-4.png` (37-48), all in this folder.
Story, beats, feelings, narrator lines, colour plan, tune, parts: `OUTLINE.md` here (Jonny OK'd). Panel texts:
`sheet-N-prompt.txt` here. Target: WIDE 1920x1080 film ~3:20 (`"frame": "wide"`), four blocks A-D of ~50 s, each also
a tall 9:16 part. Rules: `docs/rules/story.md`, `docs/rules/images.md`, `docs/rules/clip-lessons.md` (read before you
plan holds, bikes, hugs, sitting), `docs/series/README.md`. Hand-drawn Ghibli look, very detailed, every mark drawn
once (no repeating textures), sleeves end before the wrist, hands three fingers and a thumb.
Long-form reference for the build method: the ancient aliens EP03 kit on main (`storyboards/series/ancient-aliens/`,
painted plates projected on true-depth 3D, `engine/plates/`, set-plate.js): beauty shots there were painted with
gpt-image-2 on Jonny's PC from the approved panel crop, then projected; characters stay 3D. Say per place whether a
painted plate or a 3D set is better here.

## Reuse (do NOT redesign; say only how each is dressed, placed or recoloured)
- Cast: `characters/potatobrawl/spud.json`, `mash.json`, `chip.json`, `wedge.json` (+ background potatoes: mover,
  baker, van driver). No fighters as random people.
- Find existing prop kinds before you design (engine/page/props*.js, props3d.js registry; grep, read header comments):
  boxes, bench/parkbench, phone, bike, car/van, kettle, mirror, speaker, cups, notebook, umbrella, rain, leaves.
- Sets/envs (engine/page/set-*.js incl. set-hallway, set-apartment, set-street, set-storefront, set-park,
  set-hilltop, set-kitchen, set-plate; assets/environments/ incl. river-calm, river-meadow, golden-country-road,
  lake-sunset, sunset-rooftop, meadow-path, dusk-city-park). Read each header; pick by what the panel shows.

## Design these, with numbers (metres, hex, px at 1920x1080, triangle budget, panels, origin, which hand holds it)
1. THE GLASSES + CASE (02, 05, 26, 28, 32-33, 42, 45, 48 and every worn panel): round, thick honey-brown tortoiseshell
   frame, scratch on the left rim, dark-green hard case. Size on Spud's face vs Mash's (Mash is taller/narrower);
   pushed-up-on-forehead pose (28); folded on the bench lens-up (45, 48); held and turned in Mash's hands (32-33).
2. THE GLASSES VIEW (01, 04, 10, 21, 40 + every check): how the engine makes it: full greyscale grade, the two lens
   edges (sheet 40 drew the full tortoiseshell rims; pick one look and keep it), any lens vignette/curvature, the cut
   in and out of it. Keep the tags the only colour.
3. THE SCORE TAG over heads: shape, pale-gold hex, size per character at wide and close framing, the digits
   (font, weight; 41, 88, 97, 63...), how a number changes (tick down, the -1 that floats up from Spud with no chime),
   how it glows without a magic glow. Tags exist ONLY in the glasses view, plus 29 (memory) and 45 (seen through the
   lens): say how 45 renders the tag inside the lens.
4. THE HUD: Spud's own score chip + the TRAIN countdown (SUN 19:42 at 0:06, 09:12 at 1:40, 00:58 at 2:30, hits 0
   at the sunset); text cards 41 / 88. HOW? / -1 / HAVE YOU? / Follow for the next question. Start from the money
   redo house chip (branch happiness-01-money-redo, engine/page/hud.js if on main). Captions sit in the upper third,
   never over faces; where the HUD sits on WIDE and on TALL parts; when it leaves (2:52, glasses off).
5. THE COLOUR ARC (whole film): a per-shot colour grade that makes the world a shade greyer each check and warm again
   at 2:52; the party shot 20 where the warmth stops at an edge before Spud's corner. Numbers per block
   (saturation, warmth), how it is keyed (storyboard field?), and what a builder adds to the engine.
6. THE NOTEBOOKS: Spud's detective pad (05, 06, 22) and Mash's old school notebook (26-28): cover, page look, the two
   readable lines the engine overlays (MASH = 88. WHY? / MASH = 41. WHY? and the list), handwriting look.
7. THE MEMORY STILL (29-30): Jonny's default is a painted still with slow motion (camera drift, leaf/grass sway), warm
   watercolour with paper texture; kid Spud (smaller, rounder) and kid Mash (with the glasses). Propose how: a painted
   plate from Jonny's PC (prompt + the approved panel crop as reference) with a light parallax, or 3D. Kid character
   data only if needed.
8. PLACES per panel: map each of 01-48 to a reused set/env or a painted plate with its dressing: Mash's flat on
   moving day (hall 02-03, empty room 25-36, party 16-24 with string lights), Spud's flat (13-14), street with the
   white box van (01, 04, 05, 36-37), bakery + awning (06, 12), river path + stone bridge (07-08, 10), wet street
   (15), balcony at night (23), hill road (38), hilltop bench + lone tree over a valley with river, town and a stone
   railway viaduct (39-48, the film's beauty shots), the train on the viaduct (47). Fewest places that still read.
9. NEW PROPS/VEHICLES not found in the engine: moving van (white box truck), two old bikes (blue, red) and riding
   them uphill (pose risk, clip-lessons), string lights, the train. Say reuse or builder task for each.
10. POSE RISKS: hug (46), sitting side by side on boxes (32) and the bench (39-44), Chip tugging a sleeve (19),
   dancing (17), lying on grass (44), lifting glasses off (42). Flag each with the rule it touches.

## Output
Write `DESIGN.md` in this folder: one section per item above, then a builder task list (one owner file per task,
budgets in minutes and lines; Sonnet builders only build, every creative choice is in DESIGN.md), then a plate list
(which panels need a painted plate, the prompt idea), then open questions each with your default. Numbers, not
adjectives. Return at most 200 words: what you wrote, risks, open questions.
