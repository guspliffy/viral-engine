# Happiness 03 "I could see everyone's happiness score": block threads (16 Nov 2026)

Jonny 16 Nov: outline v2 OK, panel sheets OK ("go for it"), every place rebuilt in REAL 3D and approved ("nice well done",
13:12 Berlin). He wants ONE review of the whole film as a rough animatic: block threads do NOT send their animatic to Jonny;
they send it to the director thread ("Outline happiness score YouTube film"), which joins the four and sends the film.
"One well done video is worth 100 half-effort videos" (Jonny): take the time to stage it well.

## Read first (in this order)
- `../OUTLINE.md`: your block's rows (story times, narrator lines, character lines, panels), twists, colour/tune/music.
- `../DESIGN.md`: glasses view (2), score tag (3), HUD + text cards (4), colour arc (5), notebooks (6), memory (7), places (8),
  pose risks (10), beauty shots. The sheets `../happy-score-sheet-1..4.png` and crops `../plates/ref/panel-NN.png`: your target.
- `score-kit.mjs` (this folder): FRAME, SETS (the set spec of every place), CAST ids, SPUD/SCORES/TRAIN in story time,
  `at(T0, keys)`, `hudFor`, `gradeFor`/`scoreGrade`, `narrate`/`say`/`card`, MUSIC rows, PART_HOOKS.
- The place you stage: its set file's header (engine/page/set-score-<x>.js: spec keys, the exported constants with stand spots and
  cameras) and its bench sheet `../bench/<x>/*sheet*.png`; `../briefs/DIRECTOR-NOTES.md` (known gaps per place and prop).
- Props (headers): props-score.js (scoreglasses worn/forehead/folded/held, scorecase, keepbox), -paper (spudpad, mashbook),
  -items (hillbench, kettle, wallmirror, reflectcard), -small (speaker, partycup, cinnabun, taperoll, satchel, flatcap, toque),
  -van (boxvan), -train (scoretrain: color "#6e2a2a"). Overlays: engine/page/score.js (tags, glasses view), hud.js (own, train),
  looks.js (grade, split, ring). All are on branch happiness-03-score.
- docs/rules/workflow.md (director writes the clip), docs/rules/story.md, docs/rules/clip-lessons.md; memory notes
  feedback-no-projected-plates-2026-11-16, feedback-character-must-sit-in-scene-2026-11-15, clip-lessons-pause-you-holds-2026-11-13.
- A recent generator of this series for the clip API patterns: storyboards/series/happiness/01-money-redo/make-money-redo.mjs (main).

## Who builds what
| Block | Story | Panels | Places (SETS key) | Thread |
|---|---|---|---|---|
| open + A | 0:00-0:50 | 01-12 | street, hall, bakery, river, bridge, bakeryRain | director thread |
| B | 0:50-1:40 | 13-24 | wall, kitchen, bakeryRain (15 puddle), party, balcony | block B thread |
| C | 1:40-2:30 | 25-36 | sunday (25-28, 31-35), memory plates M29/M30 (set-plate, DESIGN 7), street (36) | block C thread |
| D | 2:30-3:20 | 37-48 | street (37), road (38), hillGold (39-46), hillSunset (47-48) | block D thread |

## Files and ownership (one owner per file)
- Your generator + benches: `../block-<x>/` (yours alone). One storyboard per place segment: `hs03-<x><n>-wide.json`, each with its T0.
- Everything in `kit/`, `engine/`, `storyboards/lib/`, `characters/`: the director thread's. Need a change (a prop param, a set
  fix, a new helper)? Message the director thread with the exact change; or build a block-local variant you own.
- Branch `happiness-03-score-<x>` off `happiness-03-score`; the director merges it at the join. No PR from a block thread.

## Order (lean: the weekly limit is tight)
1. Your story times: lay OUTLINE's rows on the block's span; narrator lines measured on the farm (voice model; see
   01-money-redo/make-voice-probe.mjs for the probe pattern) or estimated at 2.6 words/s for the first animatic.
2. Stage with the kit; preflight 0 fails; `--layout`; draft stills contact sheet; then the draft render (= the animatic) with
   music from your MUSIC row (one library take or two, under the voice).
3. Check it yourself (contact sheets + 10-15 fps strips of every contact, the mute test), fix, then message the director thread
   with the mp4 path(s) and the block's real length. Nothing to Jonny from a block thread.
4. After Jonny's notes on the joined film: fix your block, then the final wide + your tall part (hook = PART_HOOKS[x]).

## Rules that bite here
- Colour: every storyboard gets `"grade": gradeFor(T0, extra)`; any glasses-view key gets `{ glasses: true }` (looks.js) and the
  `"score": { view, tags }` window; Spud's tag + own chip tick at the SAME story times as SPUD (one score for the whole film).
- One voice at a time: the narrator never over a character line; captions in the upper third (FRAME.SUB), never over a face or tag.
- Realistic sounds only; no chime on a -1; music under the voice (~0.45-0.6).
- Glasses: worn only while looking (the view cut); otherwise forehead/held/folded as the panel shows. Phone-style holds on the pad.
- Spud never wears the glasses after 2:52 (D); Mash wears his charcoal hoodie (36 fix); the van is the white boxvan (37 fix);
  in 47 the middle figure is SPUD and Mash waves from the train window.
