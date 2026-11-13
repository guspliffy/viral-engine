# Block B (story 0:56-1:40, 44.0 s): panels 13-18 of ancient-aliens-01-sheet-2.png

Generator: `make-block-b.mjs` -> `aa01-block-b.json`. One light (SET). Music false (the join lays the bed). Spud speaks the
STORY.md lines word for word in Reaper's voice (`say` macro, voice `reaper`), captions at y 430 (upper third).

| # | Block time | Panel | Camera, who, what | Departures |
|---|---|---|---|---|
| 13 | 0.0-4.6 | Grand Gallery climb | behind him, low, up the ramp; he climbs 3 m (headlamp lit) | a ramp, not the sheet's stairs (BOARD); no line (a 4.6 s climb) |
| 14 | 4.6-11.6 | King's Chamber | from the east end looking west, tilts up to the nine granite beams; "The ceiling: granite beams. Up to eighty tonnes each."; text "80 t = 13 elephants" | |
| 15 | 11.6-15.65 | palm on granite | north wall on the right, his left palm on it, he says "There is no granite at Giza." to us | his face turns to us instead of the wall (a host's line) |
| 15 b | 15.65-21.0 | map line | painted map card (`nile-map.png`, from `bench/make-nile-map.py`): Giza at the top, the red route down the Nile to Aswan, "800 km"; camera pans Giza -> Aswan; "It comes from Aswan, more than eight hundred kilometres up the Nile." | the map is block-made (BOARD section 4), a PIL drawing; a Codex-painted map can replace it at polish |
| 16 | 21.0-27.6 | Aswan cutter | quarry wide, the foreman's palm on the control slab (pedestal moved forward), the turquoise cut line slices the block dead straight, push in on Spud: "They tell you: copper saws and wooden boats..." | |
| 17 | 27.6-33.8 | the Nile | reed boat across the frame: Spud and two fishermen, the cargo ship with one granite beam crossing slowly overhead, the fishermen stare up; "For eighty tonnes." | the line split across 16/17 at the cut (word for word kept) |
| 18 | 33.8-44.0 | the ask | close on Spud in the boat, ship and beam behind him; "ALIENS 1 · HUMANS 2" top; "Aliens? Type one. Humans? Type two." beat "I'll wait." then 3.2 s of river and his raised brow | 3.2 s wait instead of 1.5 s (fills the slot) |

Counter "CLUE 2/5" top left 0.3-33.8. Sounds: steps (auto), cutter scrape + low hum (scifi scene), stone thud, Nile water
(`ai/car-waves`, the closest whitelisted lapping), cargo ship hum. Voice takes: "saws" and "tonnes" are take 2 (take 1 heard
as "für 80 Tonnen").

## v2 (Jonny 13 Nov: block A v2 rules "way more interesting", block B v2 "i like it")

Music: the pilot score, `score(56)`. 12 shots with a move each (kit BLOCKS.md "How we explain"): the gallery roof down to
him (he slips back a step); the granite ceiling first, he walks in; past his upturned face, 80 t counts; nine beams, a
grain ticks from the cracked beam, he sidesteps; palm on the granite in profile, "There is no granite at Giza." (excited);
the map with an 800 km count (the map's own label removed); close on the cut; the foreman waves him off; his doubt; 80 t
overhead; the boat, he points up; the ask with ALIENS = 1 / HUMANS = 2 on the words and finger counts (question tone).
Full render: qa/check.mjs PASS. Kept warnings: lean-jump at 2.2 / 2.7 s (his steps up the 26 deg ramp), hand-jump on
the foreman's wave and Spud's finger counts (anime timing snaps the pose; the moves are 0.4-0.5 s).
