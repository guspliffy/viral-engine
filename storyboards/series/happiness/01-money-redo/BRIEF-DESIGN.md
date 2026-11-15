# Design brief: money redo ("Spend $10,000,000 before sunset"), 15 Nov 2026

You design ONLY what the engine can't reuse, from the two drawn panel sheets (Jonny's look target):
`storyboards/series/happiness/01-money-redo/money-redo-sheet-1.png` (panels 01-10) and `-sheet-2.png` (11-20).
Story + feelings: `OUTLINE.md` here; panel texts: `/mnt/project-files/videos/happiness/01-money-redo/sheets/sheet-*-prompt.txt`;
timing: `NOTES.md` here (cut list v0, ~50 s vertical 1080x1920). Rules: `docs/rules/story.md` sections 1, 5, 6 and
`docs/rules/images.md`. Hand-drawn Ghibli look, very detailed, every mark drawn once, sleeves end before the wrist.

## Reuse (exists on this branch; do NOT redesign, only say how it is dressed or placed)
- Cast: `characters/potatobrawl/spud.json` (teal sweater), `spud-rich.json` (fur coat + gold chain), `chip.json`,
  `duchess.json`, `rosti.json`, `tot.json` (teller costume, round glasses), `dauphin.json` (blazer).
- Props: `coffeecart`, `moneybag`, `shopbag`, `coins`, `cashbrick` (banknote stack), `carkeys`, `goldwatch`, `mirror`,
  `papercup`, `paper`, `feltpen`, `cardbox`, `gift`, `fountain`, `coupe` (the gold car, engine/page/props-coupe.js), `limo`.
- Places: env `golden-city-crossing` (city street, the old coffee-cart scene), env `mansion-day` (white mansion +
  fountain), set `coast` (engine/page/set-coast.js: cliff top SEAT, the climb, coast road with rail, CARSTOP, sea,
  sunset sky with `sink`; its only states are grey rain deck -> sunset via `break`).
- Prior designs to stay consistent with: `storyboards/series/happiness/01-does-money-make-you-happy/DESIGN.md`.

## New: design these, each with numbers (metres, hex, triangle budget, which panels, prop frame/origin, where hands hold)
1. Car showroom interior (panel 06): white floor, big window with the green cliff hill outside (Chip pointing at it
   from OUTSIDE the glass in the sheet), a plant; the gold coupe on the floor.
2. Luxury boutique interior (07): gold full-length mirror, clothes rails, chandelier, purple walls.
3. Harbour at sunset (11; far in 15 and 16): wooden pier with posts, the white yacht. Say if it should be a place of
   its own or built into the coast set's far shore (15 and 16 see it small and far from the road).
4. Tow truck (16): red/orange cab, crane boom and hook, tows the coupe; drives off along the coast road.
5. The $10,000,000 check (01-02): large paper check prop, only "$10,000,000" readable.
6. Side characters designed for the scene (story.md: no fighters as random people): the car seller (06, black suit,
   bow tie, cap), two shop assistants (07), the estate agent (08, bald, round glasses, clipboard). Say whether a
   reused body (tot, rosti, dauphin) in a new costume is enough or a new character is needed.
7. The money-bag mountain (05) with ONE bag visibly missing from the top (the sheet missed it): how to make "one
   bag gone" read in 1 s (a gap with a lighter dust ring? the bag in his hand?). Uses moneybag props.
8. The fur coat and gold chain lying on the car seat (15-16) after he takes them off.
9. The sun as a clock: 01-04 noon, 05-08 afternoon, 09-10 LATE AFTERNOON (the sheet set the sun too early: fix),
   11-20 sunset into the last sliver. The coast set has no afternoon state: propose the smallest change (a new
   `break`-like key, or another env for 09) and the colour per stage.
10. The on-screen money counter + sun clock (all video, upper third under the caption band): look, size in px,
    colours, how it counts down in jumps on each purchase, how it reads with no English (German viewers).
11. Chip leaning his head on Spud's shoulder (19) and both sitting (17-20): any pose risk to flag.

## Output
Write `storyboards/series/happiness/01-money-redo/DESIGN.md`: one section per item above, then a builder task list
(one owner file per task, budgets), then open questions each with your default. Numbers, not adjectives. Return at
most 200 words: what you wrote, risks, open questions.
