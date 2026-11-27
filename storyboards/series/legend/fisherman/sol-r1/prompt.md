# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "The Fisherman and his Wife" (lesson-legend, rough draft 1)

You are the editor and checker of a 69.0 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every spoken line with its start-end time (s), speaker and text, then every shot with its start-end time and id.
- `sheet-1fps-00-47s.jpg`, `sheet-1fps-48-68s.jpg`: one frame per second (12 per row, left to right, top to bottom; the second sheet starts at 48 s).
- `strip-5fps-00s.jpg` ... `strip-5fps-60s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
The Grimms' "The Fisherman and his Wife" (1812) retold as ONE evening on the Baltic shore of northern Germany. The hero is our recurring kid host (12, pink quilted jacket); his grandmother (indigo cloak, white bun, staff with a candle lantern = fear meter) gives the rule. Speakers: N narrator, G grandmother, K kid, F the flounder (an enchanted prince).
There is no monster: the SEA is the threat and the counter. Every wish turns it a darker colour (green -> grey -> dark blue -> black -> storm with waves like church towers), and Grandma's tiny tar-black hut becomes a cottage, a castle, a brick-Gothic palace, then everything vanishes. The ending twist: Grandma's own round hut is the "pot" from the tale ("why do you think I live in a pot?"), seeded by the one history line (L09) and the re-hook "I've seen the sea this colour once before" (L12).
Built on what holds viewers in this niche: the threat on screen from frame 0 (the flounder's gold eye under black storm water, a flash-forward), the rule as an early line ("Wish once. Then throw it back."), one evening, one history line only, the rule tested and twisted at the end, a fast end on the punchline. An opening story banner (driftwood sign, ~0.25-3.4 s) sits above the subtitles; subtitles are word by word in the upper third.
Music (north German button accordion + fiddle, cello/viola dread, recorded strings and low brass for the storm, hard silences on the eye opening, the black sea, the vanishing and before the punchline) is being added now; it is NOT in these frames. Comment on music timing only if a picture beat needs a silence or a hit.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). What can change cheaply: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of the eye, the flounder's mouth, the rod, the sea surface, the candle, the hut), colour per shot. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word. The STORY is approved: keep every story beat; editing is about timing, shots and clarity.
ALREADY DECIDED, do not comment on these: no on-screen lettering besides subtitles and the opening banner; subtitles stay in the upper third; the banner style.
KNOWN, tell us if you see a good cheap fix: the storm "tower" waves may read like snowy mountain peaks; the dark-blue "thick, oily" sea reads as plain blue; the kid's brows read cross rather than scared or cheerful; the kid and the flounder are small in several storm shots; the punchline shot is a wide.

## Part A — EDITOR (main task, TIMING FIRST)
Make it hold viewers better: where to cut earlier or later, which holds and gaps to shorten or lengthen, which shots last too long or too short, where a still shot should get a camera move or a cut, where an insert would make a beat land, where tension needs a beat of silence, which shots repeat the same framing too often, which dark shots are too dark to read on a phone, whether each sea-colour change lands clearly on its line. Give a numbered EDIT LIST. Each item: the time range, what to change, why (one line). Order by impact, max ~15 items.

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a pose that jumps between two frames of the same shot, a limb or body through another body or a wall, a prop in the air, a face lost or cut off by the frame, the flounder cut by the frame edge or hidden behind grass, a face too small to read on a phone in a dialogue shot, wrong sizes between shots) and every logic issue (an effect before its cause, a character in the wrong place between cuts, the wrong home stage or sea colour for the moment, Grandma's lantern/candle wrong, the kid wet or dry inconsistently), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
