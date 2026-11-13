TASK T3: the corner shop's inside (zshop), the food tin (tin), the cloth bag that gets too heavy (tinbag)
WHY: the one greedy decision of the story happens here: the Gunslinger stuffs a bag far too heavy with tins, and one
  tin later slips out of it. The tin is also the last food the five share. Both must read at phone size.
DESIGN: storyboards/series/survive-it/04-zombies/BRIEF-COMMON.md (read first), panels 05, 08, 09, 12 in
  /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-B-10X-IMAGE-PROMPT.txt (text).
RULES: CLAUDE.md "Rules that apply to every task"; docs/rules/characters-grips.md for the two held props.
READ: `engine/page/props-heist.js` lines 1-110 (header style, `moneybag`, HEIST_GRIPS) and `storyboards/lib/grips.mjs`
  SIZE (how a held prop gets its sizes), `engine/page/props-heistset.js` lines 1-80,
  `storyboards/lookdev/make-hotpotato-set-bench.mjs` (bench pattern).
OWN: `engine/page/props-zshop.js` (stub exists: replace, keep the three export names), the `tin` and `tinbag` lines
  in `storyboards/lib/grips.mjs` SIZE (add only), `storyboards/lookdev/make-zshop-bench.mjs` + its json.
CONTRACT (every size a spec key with this default):
  zshop   a small corner shop, open toward the camera. Origin: floor centre, y 0 = floor top. `w` 5.5 x `d` 4.2,
    `h` 2.8, back wall at z -2.1, side walls, ceiling with two dead strip lamps, NO front wall. Floor: cream and
    grey tiles 0.3 m, a few cracked. In the back wall a glass shop door 1.0 x 2.1 at x 1.4 and a shop window
    2.2 x 1.4 (sill y 0.8) at x -0.9; through both a painted card 0.6 m behind the wall: the grey street with
    zombies standing packed, their BACKS to the shop (heads and shoulders with sprouts, 8 to 10 across). Shelves:
    one 2.0 m high unit along the left wall (z -1.8..1.2) and one along the right wall (z -1.8..0.2), four boards
    each, HALF EMPTY: about 40 tins in loose groups, a few fallen over, some empty boards, torn price strips (no
    readable text). A counter with an old till at the right front (x 1.9, z 1.2). State `dim` 0..1 (default 0.25:
    dull daylight from the window only). Solid = false.
  tin     a 400 g food tin: 7.5 cm across, 11 cm high, ribbed steel, a red-orange paper label with a pale bean
    shape (no readable text). Origin: bottom centre. Held round its side (grip from the grip library, one hand).
    State `open` 0..1: the lid peeled up and bent back, beans in sauce inside.
  tinbag  a big jute sack with a drawstring. Origin: bottom centre. `size` 0.75 (height when full). State `fill`
    0..1: 0 an empty limp sack (a low heap 0.2 high); 0.5 half full, slumped; 1 bulging, 0.75 high x 0.62 wide, tin
    shapes pressing through the cloth, three tin tops showing in the open mouth, seams straining. Held by ONE hand
    at the neck, at local (0, 0.95 * height, 0) (give the point in the header), hanging below the fist when
    carried.
MACHINE: stills only (see BRIEF-COMMON), plus the in-hand proof below.
DONE WHEN:
- bench (`storyboards/lookdev/zshop-bench-sheet.png`): the shop from (0, 1.5, 5.6) looking at (0, 1.1, -1), fov 46;
  a close still of one shelf; the tin closed and open on the floor from 0.6 m; the tinbag at fill 0, 0.5 and 1.
- in-hand proof for both held props: `node storyboards/lookdev/make-grip-tests.mjs --prop tin --hold <hold>` and
  `--prop tinbag --hold <hold>`: look at the front and side still; the hand closed where a real hand would hold it.
- at 360 px wide the tin reads as a food tin and the full bag as much too heavy.
- usage header complete; `ZSHOP_STATE` lists every state key; SIZE lines added.
OUT OF SCOPE: the street outside (a painted card only), a spoon (exists), shelves that fall, the clip generator.
