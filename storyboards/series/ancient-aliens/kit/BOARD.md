# Ancient aliens: shared kit BOARD (13 Nov 2026)

Series: Spud (Reaper's voice) proves that aliens built famous places. EP01 = the Great Pyramid, ~2:55, built as four
blocks by four threads from THIS kit, so every piece below has one look and one owner file. Story, panels and facts:
`/mnt/project-files/videos/ancient-aliens/01-pyramids/` (STORY.md, RESEARCH.md, DESIGNS.md, ancient-aliens-01-sheet-1..3.png).
Jonny approved the three sheets on 13 Nov ("thats really nice go"): the sheets are the look target. Where a number
here and a sheet differ, the number wins (the sheets missed some story points).

House rules for every piece: hand-drawn Ghibli look, very detailed, every mark drawn once by hand (hashed, no repeating
texture), realistic and physical (no sparkles, no magic glow, no floating symbols); light beams are soft see-through
columns made visible by drifting dust. Whole frame sharp. Deterministic (no Math.random, no wall clock). Metres.
World axes for every Giza piece: **north = -z, south = +z (toward the default camera), east = +x, up = +y.**

## 1. Palette

| Thing | Hex |
|---|---|
| Sand / plateau limestone | `#d9c49a`, shadows `#b79f73`, rubble `#c9b388` |
| Core limestone, fresh (2560 BC) | `#d8bd7a`, joints `#a88f58` |
| Weathered limestone (today) | `#b89a6a`, pits `#8f7650` |
| Tura casing, fresh | `#f2efe6`, joints `#cfc9ba` (hairline, 2 mm drawn as 1 px at 360 px) |
| Aswan red granite | `#a8554d`, speckle `#7d3b38` and `#d08f84`, cut face `#b8635a` smooth |
| Alien skin | `#9fb3c4`, freckles `#6f8496` |
| Alien coverall | `#c8581f`, fold shade `#9a4116`, cream trim, gloves and boots `#efe6cf` |
| Alien antenna knob / iris | `#1f6f6b` / `#2a9d94` |
| Machine ceramic | `#ece8df`, panel seams `#b9b4a8`, stripe `#d9682a`, graphite `#3a3d42` |
| Beam and cut light | `#8fe6dc` (lens `#9fded6`), hot cut edge `#e07a3a` |
| Nile water / fields / palms | `#3f7fa8` / `#6f9b45` / `#3f6b3a` trunks `#7a5a3a` |
| Mud brick | `#b98a5a` |
| Linen (kilt, headcloth) | `#f1ece0`, fold shade `#cfc7b4` |
| Red ochre paint | `#a8341f` |
| Headlamp band / housing / glass | `#8f8a5e` khaki / `#1c1c1e` / `#5d6166`, light `#fff1d6` |

## 2. Sizes that every block relies on

- Spud is 0.88 m tall. A core block is taller than he is: **limeblock 1.3 w x 1.05 h x 1.3 d**; bottom-course block 1.5 high.
- Great Pyramid, real numbers: base 230.3, height 146.6 (finished), today 138.5 with a flat 10 m top; slope 51.84 deg.
- Giza today, centres on the ground (x east, z south, from Khufu's centre): Khufu (0, 0) base 230.3 h 138.5;
  Khafre (-334, +354) base 215.3 h 136.4, casing cap on its top 22 %; Menkaure (-574, +739) base 103.4 h 61.
  Menkaure sits 125 m east of the line through the other two: that offset is a story point (clue 5), keep it exact.
- Giza 2560 BC: Khufu's pyramid ALONE. "building" = built to half height (flat working top at 73 m), white casing on the
  lower 45 % of what is built, stepped yellow core above. "finished" = all white, sharp tip, 146.6.
- Ring ship: 30 m across (outer r 15), hovers 40 m above its work. Lift beam r 2.0. Cargo ship: 12 m wide half ring.
- Granite beam: 8.0 long x 1.5 wide x 2.2 high (about 70 t). King's Chamber: 10.47 (x, east-west) x 5.23 (z) x 5.82 high.
- Aliens: crew 0.60 tall round; foreman 1.05 tall narrow; lifter 0.75 tall, 0.85 wide.
- Orion's Belt, degrees from the middle star Alnilam (x to the right = west, y up, seen facing south):
  Alnitak (-1.15, -0.74), Mintaka (+1.05, +0.90); Betelgeuse (-4.75, +8.61), Bellatrix (+2.78, +7.55),
  Saiph (-2.90, -8.47), Rigel (+5.40, -7.00). Mintaka is the faintest Belt star and sits 0.22 deg off the line.

## 3. Pieces and their owner files

| File | Kinds | Task |
|---|---|---|
| `engine/page/props-aa-giza.js` | far scenery, built at `spec.s` scale: aasky, gizaplateau, pyramid, gizatoday, nilevalley, cairohaze, potatocrowd, orion, starfield, moon | T1 |
| `engine/page/props-aa-site.js` | real-scale close pieces: pyramidbase, worktop, limeblock, casingpair, blockrows, gizapavement, northline | T2 |
| `engine/page/props-aa-ship.js` | ringship, cargoship, granitespan, granitecutter, roughgranite, aswanquarry | T3 |
| `engine/page/props-aa-inside.js` | kingschamber, grandgallery, pyramidentrance, starshaft, relievingchamber, gangmarks, worklamp, oillamp, paintbowl, reedbrush | T4 |
| `engine/page/costumes-aliens.js` + `characters/ancient-aliens/*.json` | aliencrew (crew, foreman, lifter), egyptworker (worker-a, worker-b) | T5 |
| `engine/page/props-aa-items.js` | headlamp, strawhat, spiritlevel, camel, reedboat, nilewater | T6 |

**Forced perspective (the engine's camera sees 300 m, hard-coded in stage.js):** everything far is a miniature. The
far-scenery kinds and the two ships take `spec.s` (default 1 = real metres) and the block threads use **s 0.2** for
wide shots: the whole of Giza then fits inside 250 m. Close shots (Spud beside a block, on the working top, at the
base) use the real-scale pieces of props-aa-site.js. Never mix a real-scale character INTO a miniature: characters
stand on the real-scale foreground, the miniature starts 25 m or more behind them.

The detailed spec of each kind is in the TASK brief of its file (`kit/briefs/T1..T6.md`); the usage header of each
file is what the block threads read.

**Build scenes from `kit/aa-kit.mjs`** (far layer, Giza today / 2560 BC, lift ship, the pyramid's foot, headlamp,
hats, car, the night over the pyramids, the three lights SET / SET_LATE / SET_NIGHT, proven camera spots). Its header
is the manual; `kit/bench/make-aa-proof.mjs` is the worked example and `kit/bench/aa-proof-sheet.png` the look Jonny
judged. The cast's light is one value per storyboard: a block that changes light is one storyboard per light.

## 4. What stays out of the kit (block threads do these in their generators)

Cameras, acting, timing, captions, the clue counter, the map line and the two number texts (text / hud), sound, music.
Tourists = Chip, Wedge and Mash from the cast with the `strawhat`; the white car = the existing hatchback (`campcar`,
`spec.color "#f4f4f2"`).
