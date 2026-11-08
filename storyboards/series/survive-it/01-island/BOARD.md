# BOARD: survive-it-01-island (Survive it, Part 1: stranded on an island with your friends)

Generator: `make-island.mjs` (numbers there win where this lags). Format A of the X-posts review (8 Nov 2026).

## §1 Brief

- Joke: stranded at sunset, Viking has it planned ("Food for three days!"), but Dragon is already eating it behind
  him. Plan two, call for help: the Sorcerer has spent the battery on sunset selfies and the phone dies in his hand.
  Plan three, a signal fire: Phoenix lights it, gets so hyped he flaps it out.
- Wants: Viking wants the group to survive the night. Consequence: no food, no phone, no fire, getting dark.
- Ending: Dragon's tummy rumbles (hungry again); the vote card: who goes into the jungle for food in Part 2, Viking
  (chest out) or Reaper ("Nope. Nope. Nope.")? Comment A or B.
- Callback: frame 0 Dragon eats the food behind Viking's back; at the end the food question is back (his tummy).
- Source: coordinator brief (format A: each friend's trait causes the next problem, day/clock HUD, comment vote
  decides Part 2); gate: **new format, animatic first** (draft render to Jonny before polish/full render).
- Length 16.0 s (departure from 8-11 s: three traits in a chain plus the vote; the format's originals run 60-90 s);
  loop: no (a part ends on its question); profile: short.
- Traits used (series plan in memory): Dragon = always hungry, Sorcerer = 100 photos, Phoenix = too much energy,
  Reaper = scared of everything (the vote's B), Viking = the planner (the vote's A).

## §2 Look

- Cast: `duo/viking`, `potatobrawl/dragon`, `never-has-money/reaper` (no scythe), `duo/phoenix`, `duo/sorcerer`;
  castLook "sheet"; set env `fern-valley-campfire` (jungle clearing, palms, volcano, pink-gold sunset), `life` auto,
  `lighting` 2, cel 0.25 + anime timing, hatch boil 0.25 (the template).
- Light: the painting's low warm sun from the right; the campfire's own warm light while lit (9.3-10.4 s).
- Palette (env.json): #332825, #47362e, #784f54, #e5a394, #a86e83, #a389a9.
- Music: `sneaky`, gain 0.28, lowCut 150; payoff (music lock) = the fire going out at 10.45 s.
- Cameras: low (y 0.8-1.1) and close (z <= 5.3): the painted floor ends nearer than ~4.5 m in front of a low camera
  (qa/env.mjs), and every camera looks into the valley (pan +-10 deg), so the cast is staged per part for a two-shot
  and the 9:16 frame. Faces land at y 1110-1245; subtitles sit under the chins at y 1275 (inside the safe area,
  which ends at 1360), the HUD and cards above the heads.
- Time skips: the HUD clock jumps +26 / +21 / +18 min at 4.0, 8.0 and 12.4; the cast is re-placed under those cuts
  (part 3: Viking at the pit's front left, the Sorcerer sulking off right; part 4: Phoenix back at his spot).

## §3 Shots (story time = video time, no hit-stops)

### §3.1 The food (0.0-4.0, hook)
- 0.0-1.05 HOOK: two-shot from the front left, Viking front right (proud, fists on hips), Dragon at the left behind
  the food box crunching, the last cookie at his chest, empty wrappers round him. Line 0.0 Viking "Food for three
  days!" (subtitled); crunch 0.0 / 0.42 / 0.84 (`ai/crunch`). HUD from frame 0: DAY 1, 18:05, battery 41 %.
- 1.05-1.9 Viking close-up: hears it, smile freezes, eyes slide left (B8 victim cut).
- 1.9-4.0 CAUGHT: Viking turns (-45), shock; Dragon freezes "Mmf?", stuffs the rest in (`gulp` 2.5), flicks the
  empty bag over his shoulder (physics, lands 3.2, `crinkle`), sheepish grin; Viking angry. RULE 1 card 2.9-4.0: "Never
  let the hungry one guard the food" (Dragon's colour).

### §3.2 The phone (4.0-8.0)
- 4.0 PHONE2 two-shot: Viking turns to the Sorcerer at his right: "Call for help!", a low point. The Sorcerer's phone
  is up between them (a selfie). Clock jumps to 18:31 (+26 min). 4.85 SELFIE: on the Sorcerer and the phone.
- 4.55 Sorcerer "One sec!"; selfies at 4.95 / 5.35 / 5.75 / 6.15 (`flash`, a 0.28 white flash, a new lean and face
  each); battery 41 -> 30 -> 18 -> 7 -> 1.
- 5.95 Viking leans in and grabs at it "Give it!" (a hand short); 6.45 DEAD (two-shot): the phone dies (screen black, `plunk`), battery 0 = DEAD (blinks).
- 6.55-8.0 Sorcerer looks at the black screen, then at Viking: "Oops." sheepish; Viking annoyed. RULE 2 card
  6.8-7.95: "Never give the selfie one the phone".

### §3.3 The fire (8.0-12.4, payoff 10.45)
- 8.0 FIRE3 wide (+21 min): Viking at the pit's front left, "Signal fire!" pointing at it; clock 18:52. Phoenix
  bursts over from the right: "Me! Me!", a hop.
- 9.1 fire from both gloves into the pit (`flamejet`), 9.3 it catches (`ai/flare`), everyone delighted.
- 9.65 "Woo-hoo!": he flies up, wings beating over the fire (`windswell` 9.9); the flames lie flat and die (10.2).
- 10.0 a wrapper by the pit skids away in the gust (physics). 10.45 PAYOFF, STARE (medium): out (`ai/snuff`,
  `poof`), smoke rises round him; he lands mid-cheer, Viking stares. RULE 3 card 10.75-12.35: "Never let the hyper one near the fire".

### §3.4 The vote (12.4-16.0)
- 12.4 RUMBLE two-shot (+18 min): Dragon's tummy: `rumble` + text pop "grumble"; Viking turns round to him; clock
  19:10.
- 13.05-16.0 VOTE (wide: Viking left, Reaper right on his log, the cold pit between): "PART 2: who goes into the
  jungle for food?" A Viking / B Reaper, "Comment A or B". Viking chest out, fist to chest, cocky; the ferns behind
  rustle (`leafrustle`); Reaper terrified, "Nope. Nope. Nope." with his eyes darting.

## §4 Check times

0.3, 1.4, 2.45, 3.5, 4.4, 5.4, 6.1, 6.7, 8.5, 9.4, 10.1, 10.8, 12.7, 13.6, 15.5
