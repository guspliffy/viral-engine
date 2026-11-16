# Design brief: happiness EP02 "skip the boring parts" (16 Nov 2026)

You design ONLY what the engine can't reuse, from the two drawn panel sheets Jonny approved (his look target):
`skip-remote-sheet-1.png` (panels 01-10) and `skip-remote-sheet-2.png` (11-20), both in this folder.
Story, beats, feelings and narrator lines: `OUTLINE.md` here (outline OK'd by Jonny; narrator speaks to the viewer as
"you", Spud is on screen). Panel texts: `sheet-1-prompt.txt`, `sheet-2-prompt.txt` here. Target ~45-50 s vertical
1080x1920. Rules: `docs/rules/story.md` sections 1, 5, 6 and `docs/rules/images.md`. Hand-drawn Ghibli look, very
detailed, every mark drawn once (no repeating textures), sleeves end before the wrist.

Series sibling for consistency (not merged, read only): the money redo design, copied to
`/tmp/claude-0/-home-user/9781097e-3e1b-51aa-92f1-481724d82328/scratchpad/money-redo-DESIGN.md`. Its section 10 (the
money counter + sun clock HUD "house chip") and section 11 (Chip leaning on Spud) apply here too.

## Reuse (do NOT redesign; say only how each is dressed, placed or recoloured)
- Cast: `characters/potatobrawl/spud.json`, `chip.json`, `wedge.json`, `mash.json` (Chip's other friends in 09 and
  background potatoes; story.md: no fighters as random people).
- Prop kinds: `car` (props3d.js), `carseat` + `steer` (props-road.js), the sinking-car interior pieces
  (props-sinkcar.js: carglass, headrest), `couch`, `officedesk`, `bench`, `parkbench`, `puddle`, `papercup`, `phone`,
  `screen` (props-trend.js), `rainbox` (props-timewatch.js), `seasonswirl`.
- Sets/envs (engine/page/set-*.js, assets/environments/): `livingroom`, `cottage`, `doorstep`, `street`, `storefront`,
  `park`, `road`; envs `sunny-city-avenue`, `golden-city-crossing`, `dusk-city-park`, `twilight-city-crossing`,
  `london-palace-forecourt-rain`. Read each file's header comment; pick by what the panel shows.

## Design these, with numbers (metres, hex, px at 1080x1920, triangle budget, panels, origin, where a hand holds it)
1. THE REMOTE (01, 02, 08, 12, 15, 17 and every press): matte black, one big white FF button front, one small red
   rewind button back. Size, grip (which hand shape, thumb on the button), how a press reads in 0.3 s at phone size,
   and a dusty variant for 11. Close-ups 02, 08, 12 fill the frame with it: its detail level there.
2. SPUD AGED: middle-aged (09-10) and old 82 (11-15), from the sheet. Character data variants of spud.json (ids
   proposed: `spud-mid`, `spud-old`): skin hex, the drawn creases (where, how many, line weight), leaf colour and bend,
   round glasses, the old grey cardigan over the faded teal sweater (old ONLY: panel 10 wrongly puts the cardigan on
   middle-aged Spud), posture (lean, height), walk speed. Same face at every age. Say what can be data and what needs
   a builder (glasses, cardigan, creases).
3. THE AGE COUNTER HUD (whole video): "AGE 25" at frame 0, jumps on every press (25, 31, 38, 61, 79, 82), rolls back
   82 -> 25 on the rewind (16). Same house chip as the money redo; no English needed (a number plus an icon); where it
   sits with the caption band (captions are in the upper third, never over faces); how a jump and the roll-back read;
   when it leaves (the sunset ending). Also the "YES or NO" text for the question at panel 08 (~2 s).
4. SPUD'S CAR (01-03, 16-20): the sheet drew a rusty teal vintage saloon, and Jonny's OK covers it. Inside (driver +
   passenger seats, windscreen, dashboard, the GLOVE BOX that opens in 17) and outside (03, 19). Say whether the
   `car` prop + sinking-car interior recoloured is enough, or what a builder makes. The traffic jam around it (01, 16,
   19 from above at sunset): how many cars, reused kinds.
5. THE OLD BOX TV (11, 13-14): wooden cabinet set. Its screen plays earlier shots of this clip (the car joke, the
   puddle jump): how (a `screen` texture from rendered stills? a second camera?), screen size, glow on old Spud's face.
6. PLACES per panel: map each of 01-20 to a reused set/env with its dressing (rain for 04, dry for 05, autumn leaves
   09, snow window 10, evening lamp 11, sunset 19-20), or name what is new and why. Fewest places that still read.
   Panel 06 needs a bakery queue (storefront?) with background potatoes; 07-08 an office.
7. CHIP mid-moment then gone (03, 04-05, 06, 07): Chip vanishes on each press. Propose how a skip reads with
   realistic sound only (Jonny's rule: a real button click + a hard cut, no whoosh, no magic glow): what changes in the
   frame so the viewer sees time jumped (light, weather, Chip gone, the counter).
8. The ending pose (20): Chip leans his head on Spud's shoulder in the car seats: flag any pose risk (see the money
   redo section 11).

## Output
Write `DESIGN.md` in this folder: one section per item above, then a builder task list (one owner file per task,
budgets in minutes and lines), then open questions each with your default. Numbers, not adjectives. Return at most
200 words: what you wrote, risks, open questions.
