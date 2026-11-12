TASK T3: realistic sound effects for Fight, Flight or Freeze 02 "Bear in the camp", made locally with engine/soundgen.
WHY: Jonny (12 Nov): no blings, magic chimes, squeaks or whooshes that only mark movement; every sound must be realistic
or close to it. The clip is a black bear attacking a camp at night in a dry thunderstorm. The library (assets/sfx) has
none of the sounds below.
DESIGN: storyboards/series/fight-flight-freeze/02-bear-camp/CHAIN.md and panels-sheet.png (what happens on screen).
RULES: CLAUDE.md; engine/soundgen/README.md (the whole pipeline, speed, licence); docs/rules/output.md sound section.
READ: engine/soundgen/README.md, recipes.json (sfx entry format), recipes-back-to-life.json, pick.py --help;
assets/sfx/ai/manifest.json (one entry); assets/sfx/make-catalog.mjs header. Nothing else unless blocked.
OWN: engine/soundgen/recipes-bear-camp.json (new); new files under assets/sfx/ai/<id>/; the entries pick.py adds to
assets/sfx/ai/manifest.json; assets/sfx/catalog.json via make-catalog.mjs; a test sheet
storyboards/series/fight-flight-freeze/02-bear-camp/sound/bear-camp-sfx-sheet.mp4 (sheet.py). Touch nothing else.
CONTRACT: sfx ids (oneshot unless said), each 2 prompts x 2 seeds, realistic field-recording wording, no music:
  bear-growl (a deep low black bear growl, close, 1.5-2.5 s), bear-roar (a black bear's loud bellowing roar/bawl as it
  rears up, 1.5-2.5 s), bear-huff (a bear's sharp huffing breaths and jaw popping, split), bear-charge (heavy fast
  paws pounding on dirt and grass, a big animal galloping, 1.5 s), canvas-rip (tent nylon fabric torn by claws, 1 s),
  glass-smash (a car windscreen smashed by a heavy blow, cracking safety glass, 1 s), metal-tear (a car door wrenched
  off its hinges, bending sheet metal, 1-1.5 s), car-alarm (a real car alarm siren, loop-able 4 s), thunder (a close
  thunder crack and long rumble, 4-6 s), grass-fire (dry grass catching fire, crackling and whooshing flames, loop-able
  4 s), branch-snap (pine branches snapping and bark scraping as something heavy climbs, split), pot-bang (a metal
  cooking pot banged hard with a stick, split), pot-bite (teeth biting a thin steel pot, metal crunch, 1 s),
  bag-drag (a sleeping bag dragged fast over grass and dirt, 1.5 s), splash-none: skip. Also a night ambience
  storm-wind (low gusty wind in pines, loop-able 6 s, will play very quietly).
MACHINE: generate.py and pick.py use every core; another job may be running preflight on this box: run generate.py and
pick.py one at a time and never in parallel with each other. If engine/soundgen/setup.sh has not been run in this box
(no sa3.cpp build / weights), run it once (about 3.3 GB download) and say how long it took.
DONE WHEN:
- every id above has 1-3 picked cuts in assets/sfx/ai/<id>/ with manifest entries (CLAP scores) and catalog ids ai/<id>
- the test sheet mp4 exists (numbered, so Jonny can judge by ear)
- a short list in your report: id, files, best CLAP score, any id whose best score is weak (below 0.1) named plainly
OUT OF SCOPE: music beds, mixing, the clip generator, any engine code, full renders. Commit on the current branch
fff-02-bear-camp with "T3: bear camp sound effects" (do not commit raw takes or the weights; keep them outside the repo).
