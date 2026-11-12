TASK T3: Mr. Crisp, the evil clown potato who hosts Hot Potato (a new cast character with his own costume type)
WHY: Jonny on draft 3 (11 Nov 2026): the host must read as evil at first glance. He picked an evil clown potato and
  approved this sheet. The joke of the show is the contrast: his COSTUME belongs to the sweet pastel kids' show, his
  FACE does not. In the clip he stands in a balcony and is seen from the belly up, small in three wide shots and big
  in one close shot (grin, tongs in one glove, the other glove on a lever), so the head, collar, sleeves and gloves
  carry everything.
DESIGN: `storyboards/series/hot-potato/01-hot-potato/mr-crisp-reference.png` (Jonny's sheet: hero, front, side, rear,
  four mood heads). In the clip: `panels-v2-sheet.png` next to it, panels 02, 03, 07, 12.
RULES: CLAUDE.md "Rules that apply to every task"; `docs/rules/characters-grips.md` (the cast section only).
  Jonny's rule for new costume pieces: no regular repeating textures (reads computer-made), every mark drawn once
  (stripes a little uneven, each ruffle its own wave); sleeves end at the wrist.
READ: `engine/page/costumes-cast.js` lines 300-330 (CAST_TYPES, castCostume dispatch) and its `kid` branch;
  `engine/page/costumes-art-cast.js` `spud()` (line 923 on: a garment shell on the potato, sleeves, cuffs, pale
  hands, `ch.surf`, `limbMat.userData.noOutline`); `characters/potatobrawl/spud.json`; `characters/sheet-cast.json`
  `types.spud`; `engine/page/face.js` around lines 99 and 690-740 (controls, `fangs`, the teeth row). Nothing else
  unless blocked.
OWN: `engine/page/costumes-clown.js` (new: the whole costume, exported as one function), ONLY the lines that
  register the type `clown` in `engine/page/costumes-cast.js` (CAST_TYPES + one dispatch line + the import) and a
  `types.clown` entry in `characters/sheet-cast.json`, `characters/hot-potato/mr-crisp.json` (new),
  `storyboards/lookdev/make-mr-crisp-bench.mjs` + the json it writes. One optional file, see CONTRACT "teeth":
  `engine/page/face.js`. Touch nothing else.
CONTRACT (metres):
  Cast id `hot-potato/mr-crisp`, rig potato, body golden (#e9b04f) height 1.12, width 0.9, depth 0.76 (a little
  taller and rounder than Viking's 1.02), `costume.type: "clown"`, the same look in every castLook (like Spud).
  Head (must read at phone size from 6 m): two round puffs of cotton-candy pink curly hair (#f29ab8, each about 0.3
    across, lumpy like the sheet, not smooth spheres) at the sides of the head above the collar; a small lemon-yellow
    cone party hat (0.2 tall) tilted on top with a pink pompom; ONE small wilted dark-green leaf on a bent stem
    beside the hat (the character's sprout: wilted, hanging). A round shiny red nose (r 0.055) in the middle of the
    face. White greasepaint as a soft heart shape on the face around eyes and mouth (cream white #f6efe2, the golden
    skin showing round it, lying ON the skin under the eyes, brows and mouth, never covering them). A small blue
    diamond above and below each eye. A painted red smile band that reaches past the mouth corners up onto the
    cheeks. Thick dark brows, low and angled down toward the nose. Yellow irises (#f2c21a) with small dark pupils,
    heavy upper lids.
  Faces: `face.default` a new neutral that is the sheet's EVIL GRIN (lids about a third down, brows low and tilted
    in, a wide smirking smile, open enough that teeth show). The clip uses the stock expr names on top of it:
    "evil", "delighted" (his TV smile), "furious", and a laugh (mouth wide open). Show these four in the bench.
  Teeth: the sheet's grin has a row of small pointed teeth. First try the stock controls (`fangs`). If, and only
    if, a pointed upper row can be added to `face.js` as an opt-in control that defaults to 0, in about 40 lines,
    with `node qa/golden.mjs` unchanged, add it (name it `sharp`, 0..1) and switch it on in mr-crisp.json.
    Otherwise use `fangs: 1` and say so under NOTES. No other change to face.js.
  Collar: a big soft ruffle lying on the shoulders round the whole body, three layers (baby blue #9cc4ee on top,
    mint #a8dcc0, pink #f4a6c0 lowest), each a wavy frill, outer radius about 1.25 x the body's. It must not cover
    the mouth: its top sits under the chin line (check the TV smile head on the sheet).
  Waistcoat: a short shell on the body from under the collar to the belly line, wide vertical stripes candy pink
    (#f08aa8) and cream (#fbf0d8), hand-painted and a little uneven, plain cream at the back; three fluffy pompom
    buttons down the front (lemon #f6d24a, mint #a8dcc0, lowest bright red #d92b2b), each r 0.06.
  Sleeves: puffy striped sleeves that follow the arms and END AT THE WRIST with a small cream frill; clean white
    gloves with three fingers and a thumb (the rig's own gloves, white).
  Below the belly (hidden behind a balcony wall in the clip, keep it simple): baby-blue trousers (#7fa6d8) as a
    lower shell, short legs, big round-toed red shoes (#c8262c).
  Outlines: any coloured limb material gets `userData.noOutline = true` (the ink hull blows up on coloured limbs).
MACHINE: draft stills of your own bench only (`export CHROME_PATH=/opt/pw-browsers/chromium`), and `node
  qa/golden.mjs` once at the end. Another builder works on this box at the same time: one job at a time each, no
  layout pass or preflight on any other storyboard, no draft or full render.
DONE WHEN:
- `engine/page/costumes-clown.js` starts with a usage header (every costume key with its default, what the clip may
  recolour, the face controls the character file sets)
- the bench (plain set, no ink surprises: check one still with the clip template's ink lines on) shows: front,
  three-quarter, side, rear full body; a waist-up close shot from slightly below with each of the four faces; both
  arms raised forward as if rubbing his gloves (sleeves follow, no arm poking through a sleeve, cuffs at the wrist);
  one still next to `potatobrawl/spud` for size
- every-frame strip of a 1 s arm move (rest to both gloves in front of the chest): sleeves and gloves hold together
- you looked at your contact sheet next to the reference sheet: the silhouette (two hair puffs, small hat, big
  collar) and the evil face read at thumbnail size; contact sheet at `out/mr-crisp-bench.png`
- `node qa/golden.mjs` unchanged
OUT OF SCOPE: the balcony, the lever, tongs, coal, the set (task T4), the episode's generator, voices, any other
  character, any engine file not listed under OWN.
