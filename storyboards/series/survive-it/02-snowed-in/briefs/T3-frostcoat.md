TASK T3: `frost` and `melt` cast controls: any potato frosts over like a frozen fry, step by step, then thaws steaming
WHY: Survive it EP1 "Snowed in with your friends for 100 days" shows the days on their bodies (10x lever 3, Jonny 9 Nov:
"yes"). Four friends in a snowed-in cottage frost over from DAY 2 to DAY 100, then thaw steaming in the spring sun. It
must stay CUTE: they look fine and annoyed, never hurt, sick or scary. Built once as a cast control for all ten potatoes
(series rule "Shared 10x controls": build each one ONCE, steps 0 to 1).
DESIGN: Jonny's brief /mnt/project-files/video-scripts/2026-11-08-survive-it/01-snowed-in-7-days-ENGINE-PROMPT.md
(the `frostcoat` row of "New props and designs", the "More of a potato" bullet, beats 4-7) and 00-SERIES-FORMAT.md
("The 10x pass", lever 3; the cast table for each look). The steps:
- frost 0: nothing (bit-identical to today: golden stills must not change).
- frost 0.3 (DAY 2): a sugar frost: fine white sparkle on the upward-facing top of the body and on the tips of hair,
  crests, sprouts, hood and hat edges; a faint cool rim (pale ice blue #dff1ff) on the silhouette's top half.
- frost 0.8 (DAY 10): white frost eyebrows (a cel white tuft over each brow, the brow line still readable), a short
  white frost beard / fringe along the chin under the mouth (never over the mouth), 1-3 small icicles hanging from the
  nose tip and the chin (cones 1.5-4 cm long, clear pale blue with a white highlight), frost patches on the upper body,
  crest / hair / sprout / hood / hat / sash edges white-tipped and stiff-looking (whiter, no other shape change needed).
  A beard the character already has (Norse god) turns icy white-blue with icicles at its locks and braids.
- frost 1.0 (DAY 100): a glitter coat up to the chin: the body below the eyes reads frosted white-blue with sparkle,
  the face from the eyes up keeps its colour so the expression reads; bigger icicles (to 6 cm).
- melt 0..1 (the thaw, DAY 100 in the sun): steam puffs rise off the body (soft white, cel, 4-8 puffs, drifting up
  ~0.6 m over 1 s, deterministic in story time), and the frost slides off in sheets (white patches slipping down and
  fading), icicles drip and shrink. Driven as frost goes 1.0 -> 0.5 with melt 0 -> 1 over ~0.6 s.
- Eyes, pupils, mouth, gloves' grip shape and the sprout's green must stay readable at 360 px wide at every step.
RULES: docs/rules/characters-grips.md (cast), docs/rules/fast-cheap.md ("Engine changes": golden), CLAUDE.md
READ: engine/page/timeline.js (FACE_KEYS, how face controls blend), engine/page/potato.js (how `stainR` / `juiceL` /
`tearL` face controls are drawn from st.face: the pattern to copy), engine/page/face.js (brows, mouth, tears),
engine/page/costumes-cast.js + costumes-art-cast.js (hair, crests, hoods, the Norse god's beard and braids: find where
each part is built so the frost can reach its tips), characters/duo/viking.json, duo/samurai.json,
never-has-money/reaper.json, potatobrawl/allfather.json (the EP1 four); nothing else unless blocked.
OWN: a new engine/page/frost.js (the frost layer + icicles + steam, a function of the face controls and story time),
the hooks it needs in engine/page/potato.js and engine/page/timeline.js (FACE_KEYS += "frost", "melt"), small
read-only taps in costumes-*.js only if a part must be tagged for frost (tag, never restyle); a bench
storyboards/lookdev/make-frost-bench.mjs + its JSON; docs/STORYBOARD.md: one paragraph under "Fine face, hands and hat"
documenting `frost` / `melt`. Touch nothing else.
CONTRACT: `{ "who", "do": "face", "frost": 0..1, "melt": 0..1, "dur" }` (blends over dur like every face key; the clip
keys 0 / 0.3 at 4.6 s / 0.8 at 8.6 s / 1.0 at 13.8 s / then 0.5 with melt 1 over 0.6 s). Works on ALL ten potato
characters (duo/*, potatobrawl/*, never-has-money/*) with their castLook "sheet" (the series look) and the anime-pro
look (cel + ink + satsuei, the clip template's flags). Deterministic: no Math.random, no wall clock; sparkle and steam
are functions of story time and a per-actor seed. Cheap: a few extra meshes or a shader term per character, no
per-frame geometry rebuilds (the render runs on CPU SwiftShader).
MACHINE: benches only: draft stills of the bench (`node engine/render.mjs <bench> --stills ... --draft --safe`) and
`node qa/golden.mjs` once at the end. No full-clip layouts, no draft or full clip renders, no render farm. Another
builder may share the box: one heavy job at a time.
DONE WHEN:
- bench: the EP1 four (Viking, Samurai, Reaper, Norse god) in a row, castLook "sheet", look anime-pro, set "xmasroom"
  (warm room light, the clip's place), stills at frost 0 / 0.3 / 0.8 / 1.0 and at melt 0.5 (mid-thaw, steam up);
  a contact sheet of the five steps at 360 px wide per still in
  /mnt/project-files/videos/survive-it/02-snowed-in/frost-bench/frost-steps.png (and the full-size stills beside it)
- plus one still of the other six (Dragon, Sorcerer, Phoenix, Wizard, Gunslinger, Astronaut) at frost 0.8 (the dome of
  the Astronaut may frost on its outside instead of the face)
- faces read at 360 px at every step (eyes, mouth, brows); nothing hangs in front of an eye or the mouth; icicles hang
  straight down whatever the head tilt (they follow gravity, not the face)
- `node qa/golden.mjs`: no changed pixel with frost 0 (paste its last lines)
OUT OF SCOPE: breath clouds, room frost, icicles on the set (other tasks); new expressions or poses; any clip generator.
Report: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
