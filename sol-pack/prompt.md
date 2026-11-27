# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "The Golem of Prague" (lesson-legend, rough draft 1)

You are the editor and checker of an 87.6 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every spoken line with its start-end time (s), speaker and text.
- `sheet-1fps-00-47s.jpg`, `sheet-1fps-48-88s.jpg`: one frame per second (12 per row, left to right, top to bottom; the second sheet starts at 48 s).
- `strip-5fps-00s.jpg` ... `strip-5fps-80s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
The Golem of Prague legend (Rabbi Loew, Prague ~1600), told by two recurring hosts TODAY in Prague's Jewish Quarter at Friday dusk, outside the Old-New Synagogue whose back wall has iron rungs starting high up, leading to a small attic door: a curious, cheeky 12-year-old boy (pink quilted jacket) and his stern grandmother (indigo cloak, white bun, staff with a candle lantern = fear meter). The told story: the river at dawn (rabbi shapes a clay giant, puts a paper slip with a holy word in its mouth, it wakes), the night lane (it guards, carries a whole well ring), the rule ("Every Friday before sunset, I take the word out"), the synagogue during the Sabbath song (a woman bursts in), the rampage (doors split, cart thrown, it grows), the rabbi pulls the slip from its mouth, it crumbles to a clay pile, the attic (pile, 1920 reporter finds only dust), back to today: "Then why do they still sing that song twice? Every Friday." The song through the window, one heavy step in the attic, hard cut.
SPECIAL: an OPENING TITLE (stone plaque "THE GOLEM ...it only rests on Friday nights") shows 0.25-2.6 s ABOVE the subtitles. It is deliberate (a trial); judge only its timing/readability, do not ask to remove it.
Narrator + character voices, word-by-word subtitles in the upper third (fixed layout, each word appears when spoken). Colour follows mood (violet-rose dusk today, teal dawn river, indigo lane, gold synagogue, red-black rampage, brown attic). Music: lute + bass viol + frame drum; it stops dead on "Until one Friday" and for 0.4 s when the slip leaves the mouth.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). What can change cheaply: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of hands, the slip, the golem's eyes, the candle, the rungs, the attic door), music timing. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word.

## Part A — EDITOR (main task, TIMING FIRST)
Make it hold viewers better: where to cut earlier or later, which holds and gaps to shorten or lengthen, which shots last too long or too short, where a still shot should get a camera move or a cut, where an insert would make a beat land, where tension needs a beat of silence. House rules: hook in the first 1-2 s; still shots lose viewers, so move the camera or cut right after each action; end on the punchline (fast end); no gore; target ~80-85 s at normal speed, every beat must earn its time.
Give a numbered EDIT LIST. Each item: the time range, what to change, why (one line). Order by impact, max ~15 items.

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a pose that jumps between two frames of the same shot, a limb or body through another body or a wall, a prop in the air, a face lost or cut off by the frame, a face too small to read on a phone in a dialogue shot, subtitles over a face, wrong sizes between shots) and every logic issue (an effect before its cause, a prop that jumps place, the slip in the mouth when it should not be or missing when it should, a reaction to something not shown, a character in the wrong place between cuts), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
