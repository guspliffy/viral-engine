# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "Hansel and Gretel" (lesson-legend, rough draft 1)

You are the editor and checker of a 100.3 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every spoken line with start-end time (s), speaker and text; every shot with start-end time and id; then the director's shot list.
- `sheet-1fps-00-49s.jpg`, `sheet-1fps-50-101s.jpg`: one frame per second (10 per row, left to right, top to bottom; the second sheet starts at 50 s).
- `strip-5fps-000s.jpg` ... `strip-5fps-100s.jpg`: five frames per second, each covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Grimm's Hansel and Gretel (Hesse, 1812) retold as ONE night in a black German forest. Hero = our recurring kid host (12, pink quilted jacket, carries his grandmother's candle jar = fear meter) as Hansel; Gretel = his younger sister (ginger braids, blue dress, white apron), the clever one; the witch (polka-dot raspberry headscarf, green skin, red near-blind eyes, long nose that sniffs). Speakers: N narrator, G grandmother (voice only), K kid/Hansel, R Gretel, W witch.
Built on what holds viewers in this niche: the house with RED EYES in a sugar window is on screen from frame 0, the rule is the first line ("If you smell gingerbread at night... turn around."), an opening story banner (Lebkuchen heart, 0-3 s, above the subtitles), exact times (9 p.m., midnight, 3 a.m., dawn), ONE history line (L11, 1812), the twist from the Grimm text (witches can't see far but smell like animals: he smelled her house, she smelled him first), and the rule tested + twisted at the end (Gretel baits the baiter with "Show me?"; on the way home he smells gingerbread again, Gretel: "Turn around." Kid, mouth full: "...I'm turning."). Re-hooks: blurred oven glimpse ~2.4 s (clearer later), "Midnight. Something sweet...", the 1812 line, "He smelled her house. She smelled him first.", "But a bone only works until she gets hungry."
Music is not in this draft yet (German forest folk + horror strings, coming in draft 2); don't comment on sound.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). Cheap to change: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of eyes, nose, crumbs, the bone, the oven door, hands, the candle), splitting/merging shots. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word. The owner approved the STORY: keep every story beat.
ALREADY DECIDED, do not comment: subtitles in the upper third, word by word; the Lebkuchen banner; "I'm turning" with a full mouth as the last line.

## Part A — EDITOR (main task, TIMING FIRST)
TARGET LENGTH ~80-85 s (it is 100 s now; the owner speeds videos up 10-25% and wants story, not padding). Say exactly which gaps/holds to shorten, which lines or line parts (between sentences only) to drop, and which shots last too long or too short. Also: where a still shot needs a camera move or a cut, where an insert makes a beat land, where tension needs a silence, which framings repeat too often, which dark shots are too dark or faces too small to read on a phone. Numbered EDIT LIST, each item: time range, change, why (one line). Order by impact, max ~15 items.

## Part B — GLITCHES AND LOGIC
Every visible glitch (pops, flicker, a pose jumping between two frames of one shot, limbs through bodies/walls/bars, props in the air, faces lost or cut by the frame, wrong sizes between shots, semi-transparent bodies) and every logic issue (effect before cause, a character in the wrong place between cuts, Hansel outside the cage after he was locked in, the candle jar appearing/disappearing, the oven door state, crumbs back after the birds ate them), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
