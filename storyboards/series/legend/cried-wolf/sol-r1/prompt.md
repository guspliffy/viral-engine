# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "The Boy Who Cried Wolf" (lesson-legend, rough draft 1)

You are the editor and checker of an 84.6 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every spoken line with its start-end time (s), speaker and text, then every shot with its start-end time and id.
- `sheet-1fps-00-47s.jpg`, `sheet-1fps-48-85s.jpg`: one frame per second (12 per row, left to right, top to bottom; the second sheet starts at 48 s).
- `strip-5fps-00s.jpg` ... `strip-5fps-80s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Aesop's Boy Who Cried Wolf retold as ONE night in a Greek hill village (olive terraces, a dry-stone sheep pen, a white village square with a chapel bell). The hero is our recurring kid host (12, pink quilted jacket, shepherd's crook); his grandmother (indigo cloak, white bun, staff with a candle lantern = fear meter) gives the rule. Speakers: N narrator, G grandmother, K kid, V a village man.
Built on what holds viewers in this niche: the wolf's yellow eyes are on screen from frame 0 (brightest thing on a dark frame), the rule is the first line ("Shout wolf only when you SEE its teeth."), the kid lives one night with exact times (9 p.m., 11 p.m., 2 a.m.), only ONE history line (L13), and the rule is tested and twisted at the end (he drives the flock into the square so everyone SEES the teeth). Four re-hooks: a 6-frame blurred glimpse of the ending at ~2.4 s (clearer 12-frame glimpse again at "But this boy..."), "By two, he'd wish he'd kept his mouth shut" (~8 s), eyes in the olive trees blinking on each fake alarm + "watching. And counting." (~17-22 s), "But this boy was about to try something new" (~40 s).
Music (Greek shepherd's flute, laouto, Cretan lyra, live strings) with hard silences under the real howl, while the village lights go out, before the villager's "WOLF!" and before the kid's last line.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). What can change cheaply: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of eyes, teeth, the gate latch, hands on the crook, the candle, village windows), music timing. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word. The owner already approved the STORY: keep every story beat; editing is about timing, shots and clarity.
ALREADY DECIDED, do not comment on these: the subtitles will move from the low-middle back to the UPPER THIRD (the owner's call: low subtitles covered the characters), and an opening story banner (title above the subtitles, ~0.25-2.6 s) is being added.

## Part A — EDITOR (main task, TIMING FIRST)
Make it hold viewers better: where to cut earlier or later, which holds and gaps to shorten or lengthen, which shots last too long or too short, where a still shot should get a camera move or a cut, where an insert would make a beat land, where tension needs a beat of silence, which shots repeat the same framing too often (the kid standing at the pen appears many times), which dark shots are too dark to read on a phone. Give a numbered EDIT LIST. Each item: the time range, what to change, why (one line). Order by impact, max ~15 items.

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a pose that jumps between two frames of the same shot, a limb or body through another body or a wall, a prop in the air, a face lost or cut off by the frame, an animal cut by the frame edge, a face too small to read on a phone in a dialogue shot, wrong sizes between shots) and every logic issue (an effect before its cause, a character in the wrong place between cuts, Grandma on the hill when she should be in the village, the gate shut after it opened, sheep in the pen after they left, the wolf in two places at once), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
