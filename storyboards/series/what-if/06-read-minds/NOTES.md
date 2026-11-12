# NOTES: read-minds (the director's working memory)

## Where the build stands

- Step: rough draft (local draft 1 had gibberish narrator: no voice model here; farm draft run 43209643838 with --draft)
- Next: rough draft SENT 12 Nov (project files videos/what-if/06-read-minds/read-minds-rough-draft.mp4); wait for Jonny's OK, then polish
- Renders so far: drafts 1 local + 1 farm, full 0; fix rounds used: 0 of 3 (staging rounds: 5 still sets, 6 layouts)
- Local voice: engine/voice not set up (VoxCPM narrator needs --vox, ~6.5 GB): narrated drafts go to the farm

## The improvement loop

- Fix on test: the draft pops line (keep renders at 1); recorded orchestra beds for danger
- Comparison video: there's a catch EP05 back-to-life (21 s, 5 builder tasks)
- Check fails: -

## Cast

| id | character | at x,z | faces | sits on | holds |
|---|---|---|---|---|---|
| wdg | potatobrawl/wedge | -0.65,-0.92 | 38 | chW | stacks (push), keys R, aces R, tower drag L |
| spud | potatobrawl/spud | 0.45,-0.98 | -25 | chS (seated throughout); hotel bed (sit height 0.5) | sFan L (0-4.94), pillow L+R (18.9-) |
| chip | potatobrawl/chip | -1.15,0.3 | 75 | chC | - |
| mash | potatobrawl/mash | 1.25,-0.5 | -60 | chM | mphone L (grips.phone), R lap |

## Props

| id | kind | size | place | note |
|---|---|---|---|---|
| table | pokertable | w1.6 d1.1 h0.62 | 0,0 | smaller than brief 2.4x1.4 for reach (spec params) |
| lamp | pokerlamp | rim r0.55 | y 2.65 | |
| pot | chippile | r0.36 | 0,-0.12 | raked to x 0.42 at 5.55-6.15 |
| mount | chipmountain | w0.8 d0.55 h1.45 | 0.5,-0.12 | grow 8.1-9.3; x 0.05 at 16.5; x -0.48 at 18.15 |
| bW/bC/bM, gb0-9 | thoughtbubble | r0.17-0.24 | over heads | pop |
| fHall/fNear/fWdg/fCity/fRoom/fStream | bubblefield | | | fill/rise/pull |
| city | neoncity | 120x120 | x 1000 | |
| room/sky/pillow | hotelroom etc. | | x 2000 | |

## Cameras: SH in the generator (14 cuts), fitted with camfit (trust "head top" x; the "eyes" column is off for seated bodies)

## Decisions

- Table 1.9 x 1.15: seats 0.5 beyond the rim (Share or Steal 02 reach).
- Music: sos-tension-01 to 10.15, then disaster-01 (recorded beds; then.from).
- No voice on character lines (captions only); the narrator speaks 4 lines.

## Tried and dropped

- Players on the table's two long sides (x +-1.45): out of a 9:16 frame (fov 42 sees +-0.78 m at 3.7 m). Arc on the far side instead.
- Wedge at the near left end facing Spud: his back to every front camera.
- Spud standing to swat (10): "stand" drove him 38 % into the table; he swats seated.
- fx "impact" on the keys slam: a full black frame. Sound only.

## Names looked up that VOCAB.md didn't answer

- music.then { file, from, gain }: engine/music.mjs:217

## Open findings

- qa/check cartoon-only FAILS on the character id "mash" (RULES.gore has \bmash): a check bug; fix = test the action without its `who` (candidate for the one tested fix).
- Farm notes: eyes-lead before table reaches (acting.eyesLead); bC/bM out of frame in 05; Spud behind the tower 14.9-18.5; cut at 16.9 too similar (change size or 30 deg); payoff (13.3) quieter than the mountain beat.
