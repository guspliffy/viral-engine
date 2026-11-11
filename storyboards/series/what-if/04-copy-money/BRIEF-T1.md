TASK T1: the money props for There's a catch EP04 "copy money" in one props file, with a bench.
WHY: the power is "COPY!": one gold coin becomes two, one wallet a hundred, then bricks of cash and a throne of cash.
The viewer must read "money" in one frame on a phone: gold coins and green notes with a potato emblem, never a real
currency, never text on a note except the emblem.
DESIGN: Jonny's sheet /mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/03-copy-money/storyboard-eight-panels.png
(4x2 panels, read it: 02 the coins, 04 wallets and coin stacks, 05-08 the notes and bundles: the look to match);
script /mnt/project-files/video-scripts/2026-11-08-what-if/03-copy-money-EXTREME-v2.md (demos 1-3, snap 2).
Cast scale: a potato is 0.9 m wide and 1.1 m tall, a glove is about 0.2 m wide, hands rest about 0.45 m up.
RULES: determinism rules in CLAUDE.md; docs/rules/characters-grips.md only for the in-hand proofs.
READ: CLAUDE.md; engine/page/props-bistro.js lines 1-60 (file layout: header comment listing each kind, helpers from
props-trend.js, canvas textures, `KINDS` entries with `apply(ps)`), engine/page/props-diner.js `wallet` (the wallet's
look and size: the heap is made of that wallet) and `tipjar`; engine/page/props-race.js for a GRIPS export and how a
tweened param reaches apply(); storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs (a bench
generator); nothing else unless blocked.
OWN: engine/page/props-money.js (replace the stub; export MONEY_KINDS and MONEY_GRIPS),
storyboards/series/what-if/04-copy-money/bench/make-money-props.mjs and the JSON it writes, and ONE line per held
prop in storyboards/lib/grips.mjs SIZE (coin, cashbrick). Touch nothing else (props3d.js already imports the file).
CONTRACT (origin bottom centre unless said; front +z; metres; colours hex; every param 0..1 unless said):
Shared look: note green #7fae6a with a darker border #4f7f4a and a cream oval holding a small potato emblem (a
rounded golden potato #e9a93a with a green two-leaf sprout); paper bands cream #f3ead2; gold #f2c230 (metalness 0.8,
roughness 0.3, one bright cel band). One canvas texture for the note face, reused by every kind and exported
(`noteTexture()`), so other files can use the same note.
1. `coin`: a gold coin r 0.085, 0.016 thick, a raised rim and the potato emblem in relief on both faces. Origin its
   CENTRE; it stands on edge with a face to +z. Params: `flat` (1 lies it face up, still about its centre), `shine`
   (a gold glow halo plus a 4-point star at its top right: additive, see-through for the checks), `spin` (degrees
   about y). MONEY_GRIPS.coin.pinch = the rim's bottom point (a glove pinches it there, thumb in front).
2. `cashbrick`: three banded bundles side by side: 0.34 wide (x) x 0.2 deep (z) x 0.11 tall, each bundle a stack of
   notes (visible note edges on the sides, the note face on top) with one cream band across carrying the emblem.
   Param `squash` (0..1: 8 % flatter and wider, for the slap). MONEY_GRIPS.cashbrick.top = the centre of its top
   face (one glove lies flat on it and carries it from above, fingers over the front edge).
3. `cashthrone`: an armchair built of cash bricks: spec.w 1.25, spec.d 1.0, spec.seat 0.42 (seat top), spec.back 1.7
   (top of the backrest), armrests 0.68 high and 0.22 wide, the seat 0.8 wide and 0.6 deep; the backrest's top stepped
   like a crown (5 bricks, the middle highest) with one gold coin (r 0.12) as its jewel; a few loose notes and coins
   round its foot. It faces +z. Param `build` 0..1: the bricks stack up from the floor row by row with a little
   overshoot per brick (0 = nothing visible, 1 = complete); below 0.15 only a low pile shows. Solid for the contact
   checks; usable as a seat (the generator uses `sit` with seat height spec.seat).
4. `walletheap`: spec.n (100) brown wallets (the diner wallet's look, 0.12 x 0.085 x 0.02 each, slight colour
   variety from a hash) heaped in a potato's arms: a wide fan at chest height like panel 04 plus a leaning tower above
   it, 0.9 wide, 0.95 tall, 0.35 deep. Origin: bottom centre of the heap (the generator puts it at the holder's chest,
   y about 0.3). Params: `n` 0..1 (how many have popped in, bottom to top, each with a small bounce), `spill` 0..1
   (the heap bursts forward: every wallet flies on its own arc to a point on the floor in a fan 2.2 wide and 0.6 to
   2.4 m in front, +z, tumbling, and lies flat at 1), `wobble` (degrees: the tower sways). Instanced.
5. `cashheap`: a loose mound of notes and a few bundles: spec.w 0.6, spec.d 0.5, spec.h 0.36 at `grow` 1; `grow`
   0..1 raises it from nothing with notes sliding down its sides. Instanced note cards, each a little bent.
MACHINE: yours for bench stills only (`node engine/render.mjs <bench json> --stills ... --draft`, one job at a time,
a few seconds each); no layout of the clip, no draft or full render, never the farm.
DONE WHEN:
- the bench (plain set, one camera per group, cast `never-has-money/gunslinger`): coin pinched in each glove at chest
  height (`shine` 0 and 1); coins lying flat on a 0.38 m high box; cashbrick carried from above in the right glove
  and lying on the box with the glove flat on it; cashthrone at build 0.1, 0.5, 1 with Gunslinger sitting on it;
  walletheap at n 0.3 and 1 in his arms and at spill 0.5 and 1; cashheap at grow 0.5 and 1 on the box
- a contact sheet of those stills at storyboards/series/what-if/04-copy-money/bench/money-sheet.png; look at it once:
  every prop reads as what it is at 270 px wide, nothing white or untextured, no z-fighting
- in-hand proofs: `node storyboards/lookdev/make-grip-tests.mjs --prop coin --hold thin` and `--prop cashbrick
  --hold box` (or the hold that fits a one-hand top carry; say which): the two stills each names, the hand closed
  where a real hand would hold it, nothing through the glove
- the file starts with a usage header: the kinds, every spec key and param with its default, the size, where the
  origin is, where a hand holds it
- deterministic: no Math.random, no clock; any variety from a hash of the instance index
OUT OF SCOPE: the clip generator, cameras, acting; banknotes flying or raining (another task); sounds; engine changes.
