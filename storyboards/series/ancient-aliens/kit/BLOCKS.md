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
- Captions: speech lettering in the upper third, never over eyes or faces. Clue counter `clueTag(c, t0, t1, n)` from aa-kit.mjs (one style for all blocks) in the
  block where the clue starts (1 in A, 2 in B, 3 and 4 in C, 5 in D); numbers as text as STORY.md says. Most viewers
  are German speakers: the picture and the numbers must tell the clue without the English.
- Sound: `music: score(<story time of the storyboard's first frame>)` from aa-kit.mjs in every storyboard, animatics
  included (one score for the whole film; the join pass lays the same file once over the joined blocks). Realistic sounds
  only (stone thud, sand steps, camel, far wind at about 0.06, water, a low physical hum for the ship; no whooshes,
  chimes or blings).
- Project rules as always: cause and effect, clean never-glitchy picture, hands checked, preflight / clear / layout
  gates, the animatic (draft) goes to Jonny before polish, one full render, merge only on his "merge it".

## How we explain (Jonny 13 Nov on the block A animatic: "we must explain this in a more interesting way, right now it's pretty plain and boring")

A host who stands beside a caption and lists numbers is the boring version. The lines stay STORY.md's; what changes
is what the picture does while he says them. Most viewers do not follow the English, so the picture alone must make
the point.

1. **Show the fact happening.** Every number gets a demonstration built from kit pieces, and the line only names it.
   "Heavier than a car": the beam lifts the tourists' car and the block side by side, the car bobs up light, the block
   drags its beam down. "Every two minutes, for twenty years": blocks land thud, thud, thud in jump cuts while the
   pyramid stands higher at each cut (`built` 0.2, 0.35, 0.5) and the counter races. "146 metres": the camera climbs
   the whole face in one move from Spud as a dot at the foot, a metre counter running to 146. If a fact has no
   picture yet, find one before writing the shot.
2. **Spud is never a talking statue.** In every shot he does something that belongs to the fact: measures with his
   arms, climbs a course and gives up, ducks as a block passes, gets dusted by a landing, is lifted a metre by the
   beam by mistake. The aliens react to him: the foreman waves him off the landing spot, a crew alien copies his
   pose. One small gag per chapter, caused by the scene, never a pause for it.
3. **Start on the evidence, not on Spud.** Open a clue on the thing itself and reveal by a move (crane up the face,
   whip to the ship, push in on the joint); Spud enters the frame or the camera finds him.
4. **Something changes at least every 3 seconds:** a cut, a camera move, a landing, a number ticking. Never more than
   one sentence on one shot; split a long line across shots.
5. **Numbers move.** A number counts up or punches in on the word, one at a time, big, in the upper third; no label
   that just stands there for a whole shot.
6. **The voice is deadpan, not flat:** questions take tone "question", the reveal of each clue "excited"; leave
   0.3-0.5 s of air before a number lands.
7. **Sound carries it:** the score from 0.0 (`score()`), and every landing, step and scrape is heard.

Block A proves this first (it has Jonny's note). B applies it before its animatic goes out. C and D keep their sent
animatics until Jonny has reacted to block A's new one, then apply what he approved: no round on a guess.

## The finished pyramid (Jonny 13 Nov on block A 0:39-0:45: "more detailed... look really good... the golden top")

`giza2560(id, o, { state: "finished" })` now carries the gold capstone, drawn masonry and the whole 2560 BC complex
(court wall, temple, causeway, queens' pyramids, tomb rows, a town with palms in the south). Nothing to set: re-run
the generator on the new kit head. Frame it so the complex shows: `VIEW.finishedHigh` (orbit to
`VIEW.finishedHighEnd`), keep the ship off the tip so the gold reads, and by night pass `valley: false`.
Bench: `kit/bench/make-aa-finished.mjs`.

## Engine lessons from block A (read before you cut shots)

- Put every cut on a time whose frame rounds down or is exact (8.7, 18.0): a cut time that `r3` rounds up past its
  frame (8.767 > 263/30) lands one frame late, a `place()` teleport shows for a frame and the pops check fails.
- An automatic blink on the last frames before a cut also flags pops: `A(t, who, "noblink", { dur })` over the end of
  the shot.
- `hostSay` keeps a subtitle 0.4 s past the voice. Two lines closer than that fail caption-collide on the FULL render
  (preflight does not catch it): pass `{ hold: <gap to the next line> }` on the first of the two.

## The join (one pass, after the four blocks are approved)

Concatenate A + B + C + D on hard cuts (rendered with `music: false` for the join, or with their score slices if the
lengths kept their slots), lay `assets/music/ancient-aliens/aa01-score.ogg` once from 0.0 under the voice (re-laid from
its README table if a block's length moved), run `qa/check.mjs` on the joined film, then deliver with the
post pack and the improvement loop.
