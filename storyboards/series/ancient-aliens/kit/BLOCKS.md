# Ancient aliens EP01 "Who really built the pyramids?": the four blocks

The pilot (~2:55) is built as four blocks in four threads at the same time, then joined. Read first, in this order:
`/mnt/project-files/videos/ancient-aliens/01-pyramids/STORY.md` (times, lines, panels), the three panel sheets next to
it (`ancient-aliens-01-sheet-1..3.png`, approved by Jonny), `kit/BOARD.md`, the header of `kit/aa-kit.mjs`, then
`kit/bench/make-aa-proof.mjs` (the worked example) and `kit/bench/aa-proof-sheet.png`. Facts: RESEARCH.md.

| Block | Story time | Chapters | Panels | Light (one storyboard per light) |
|---|---|---|---|---|
| A | 0:00-0:56 | hook, contract, clue 1 the mountain, turn into the dark | 01-12 | SET (day); the walk into the entrance stays in SET |
| B | 0:56-1:40 | clue 2 the granite (gallery, King's Chamber, Aswan, the Nile), the "type 1 or 2" ask | 13-18 | SET |
| C | 1:40-2:18 | clue 3 precision (level, joint, north line), the low at sunset, clue 4 the number | 19-25 | SET (afternoon), SET_LATE from the sunset on |
| D | 2:18-2:55 | clue 5 the stars, the shaft, the ship goes home, "Case closed", the tag | 26-36 | SET_NIGHT |

## Rules every block keeps (so the join is seamless)

- Branch off `ancient-aliens-kit` (PR #226). Your files: `storyboards/series/ancient-aliens/01-pyramids/block-<a|b|c|d>/`
  only. **Never edit a kit file** (`engine/page/props-aa-*.js`, `costumes-aliens.js`, `characters/ancient-aliens/`,
  `kit/`): if a piece is missing or wrong, message the kit thread ("Create ancient aliens history series") with the
  kind and what is needed. One owner per file.
- Build every scene from `kit/aa-kit.mjs`. Sizes, palette and axes come from BOARD.md; where a sheet and BOARD differ,
  BOARD wins. Sheet misses NOT to copy: 27 (Orion's Belt is three stars in a line over the three pyramids), 21-22 (ONE
  north line, not a square), 30 (an open ring, not a saucer), 06 (the noon sun is in the sky), 13 (the gallery is a
  ramp, not stairs).
- Host: Spud (`potatobrawl/spud`) with the headlamp band in every scene (`host()`), lit only in the dark. He holds
  nothing: he points or lays a palm flat on stone. He speaks with Reaper's voice: write every line of his with
  `hostSay(c, t, who, line, dur)` from aa-kit.mjs (NOT `c.say`: in a beat storyboard a `c.say` line is never voiced and
  plays as gibberish without a warning). The headlamp needs `allowClip: lampClip([...], END)`; a prop in the air on
  purpose needs `staged: "<why>"`. Lines are STORY.md's, word for word. No narrator, never two voices at once.
  Time everything after a line from the spoken length the render prints (`speech: "..." lasts Xs spoken`).
- Each block starts and ends on a hard cut at its story time; keep the block's length within 1 s of its slot. First
  and last 0.3 s: no line running, no move half done.
- Captions: speech lettering in the upper third, never over eyes or faces. Clue counter "CLUE n/5" top corner in the
  block where the clue starts (1 in A, 2 in B, 3 and 4 in C, 5 in D); numbers as text as STORY.md says. Most viewers
  are German speakers: the picture and the numbers must tell the clue without the English.
- Sound: `music: false` in every block (the join pass lays ONE orchestra bed over the whole film). Realistic sounds
  only (stone thud, sand steps, camel, far wind at about 0.06, water, a low physical hum for the ship; no whooshes,
  chimes or blings).
- Project rules as always: cause and effect, clean never-glitchy picture, hands checked, preflight / clear / layout
  gates, the animatic (draft) goes to Jonny before polish, one full render, merge only on his "merge it".

## The join (one pass, after the four blocks are approved)

Concatenate A + B + C + D on hard cuts, lay one recorded-sounding orchestra bed from 0.0 under the voice (about 0.45,
lifts at each clue, out at the low, full at the climax), run `qa/check.mjs` on the joined film, then deliver with the
post pack and the improvement loop.
