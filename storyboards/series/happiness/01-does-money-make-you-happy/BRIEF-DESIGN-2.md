# Design brief 2: "Does money make you happy?" draft 2 (Jonny's notes, 15 Nov 2026)

You are the designer (Fable). Append a section "## 11. Draft 2 designs" to `DESIGN.md` in this folder (same depth and
format as sections 1-10: sizes in metres, hex colours, light, what is see-through, all a function of story time, no
Math.random, no clock, a "build as" line and a triangle budget per item). Never code. Read first: `DESIGN.md`,
`OUTLINE.md`, `board.png`, `NOTES.md` (timeline), `docs/VOCAB.md` (engine names), and the draft-1 stills
`bench/draft1/*.png` if present. Characters: read `characters/potatobrawl/spud.json`, `chip.json`, `wedge.json`,
`mash.json` and `docs/rules/characters-grips.md` (cast JSON format; the style: hand-drawn Ghibli anime, very
detailed, one skin colour like Spud's for everyday potatoes, 3-finger gloves, sleeves end at the wrist,
hand-drawn marks, no repeating textures).

## Jonny's notes on draft 1 (his words, the target)
- "we need to speak in clear images": every scene must read without words.
- The pocket scene was not understandable: Spud should look a bit homeless and dirty, really sad; he tries to buy a
  coffee but has no money; then the rich come around.
- The rich couple were Wizard and Viking riding inside the limo (they sank into it): "create new rich characters for
  this scene, dont use wizard and viking. they dont fit there".
- The robbery: a real bank robbery scene, Spud holding a gun in the bank telling the cashier to give the money.
- The ending should be more extreme: ALL the money he brought flies away.

## Design these (numbered 11.1 ...)
1. **Poor Spud** (scene 2, before the robbery): Spud's own character with a dressing, not a new character: the teal
   sweater worn and dirty (hand-drawn smudges, a darned patch, a frayed hem, maybe one pocket lining out), dirt
   smudges on his skin (cheek, top of the head), a faded knit beanie OR none (the leaf must stay visible). Say how
   it is built (a costume variant in costumes-art-cast.js like `rich`, e.g. `costume.poor`) and keep the robbery
   balaclava fitting over it.
2. **The rich couple** (2 new potato characters, scene 2): instantly read as rich at phone size: e.g. a lady in a
   white fur stole, pearls, big sun hat or sunglasses, and a man in a cream/white suit or a velvet blazer, gold
   watch, slicked leaf. Same potato skin as Spud. Each gets a character JSON spec (body, face, costume) in the
   format of `characters/potatobrawl/*.json`. They will STAND beside the limo on the pavement (no riding inside it),
   laughing, each holding 1-2 shopping bags (`shopbag` in props-happy.js).
3. **The cashier** (1 new potato character, scene 3 bank counter): a bank teller in a white shirt, a dark green
   vest or a tie, a visor or neat glasses; plain and kind, so the robbery reads as wrong. Same skin. JSON spec.
   The coffee seller in scene 2 may be the same character in an apron (`apron` in props-winter.js) if it reads;
   say yes or no and why.
4. **Coffee stand** (scene 2, on the painted city env `golden-city-crossing`): a small street coffee cart or kiosk
   (counter 1.0-1.1 high for 0.85 m potatoes), a menu board WITHOUT letters (cup pictures only), a cup on the
   counter, a price shown as a picture or the seller's open palm; Spud pats his empty pockets / shows empty hands.
   Reuse `marketstall`, `woodcounter`, `coffeecup`, `cocoacup`, `cardterminal`, `tipjar` where they fit; say what
   is new.
5. **Bank counter room** (scene 3a, a room set via set.swap like `vault`): a marble counter with brass bars and a
   teller window (the cashier behind it, visible from the waist up), a brass lamp, a wall clock, a velvet rope, a
   tiled floor, the vault door seen at the back. Spud in the balaclava points the revolver (`zrevolver`,
   props-zfight.js, held in one hand) at the cashier; the cashier slides money bags (`moneybag`) through the gap /
   over the counter. Give the room's named points (SPUD stand, CASHIER stand, the counter top, the slot where the
   bags come through) and 2 camera starts (a two-shot side-on with both faces readable, and an over-the-gun shot).
   No words, letters or numbers anywhere.
6. **The money storm** (scene 10): ALL the money flies away, extreme: how the sacks burst/open (all 3-4 sacks he
   carried, or the one sack plus the car's load, your pick), how many notes (budget for llvmpipe CPU: say a max),
   their paths (deterministic: from a seed per note, keyed in story time), a cloud of notes swirling up over the cliff
   into the sunset, and the timing with his smile (the notes go first, the smile after). It must stay beautiful,
   not chaotic: the sunset stays the hero.

## Return
Append section 11 to DESIGN.md (aim 8-14 KB). Then reply in at most 200 words: the subsections, the build-as line per
item, open questions each with your default, risks.
