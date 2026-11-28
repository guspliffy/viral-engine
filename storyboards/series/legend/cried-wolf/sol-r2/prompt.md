# Sol round 2 (LAST round): check of round-1 fixes + glitch/logic review — "The Boy Who Cried Wolf" (lesson-legend, draft 2)

You are the editor and checker of an 85.8 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every spoken line with its start-end time (s), speaker and text, then every shot with its start-end time and id.
- `sheet-1fps-00-47s.jpg`, `sheet-1fps-48-85s.jpg`: one frame per second (12 per row, left to right, top to bottom; the second sheet starts at 48 s).
- `strip-5fps-00s.jpg` ... `strip-5fps-80s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Aesop's Boy Who Cried Wolf retold as ONE night in a Greek hill village (olive terraces, a dry-stone sheep pen, a white village square with a chapel bell). The hero is our recurring kid host (12, pink quilted jacket, shepherd's crook); his grandmother (indigo cloak, white bun, staff with a candle lantern = fear meter) gives the rule. Speakers: N narrator, G grandmother, K kid, V a village man.
Built on what holds viewers in this niche: the wolf's yellow eyes are on screen from frame 0 (brightest thing on a dark frame), the rule is the first line ("Shout wolf only when you SEE its teeth."), the kid lives one night with exact times (9 p.m., 11 p.m., 2 a.m.), only ONE history line (L13), and the rule is tested and twisted at the end (he drives the flock into the square so everyone SEES the teeth). Four re-hooks: a 6-frame blurred glimpse of the ending at ~2.4 s (clearer 12-frame glimpse again at "But this boy..."), "By two, he'd wish he'd kept his mouth shut" (~8 s), eyes in the olive trees blinking on each fake alarm + "watching. And counting." (~17-22 s), "But this boy was about to try something new" (~40 s).
Music (Greek shepherd's flute, laouto, Cretan lyra, live strings) with hard silences under the real howl, while the village lights go out, before the villager's "WOLF!" and before the kid's last line.
Everything is drawn in code (flat 2D vector, thin outlines, 2.5D sets with a moving camera). What can change cheaply: camera position/move/zoom per shot, cut points, shot order, holds and gaps, poses and expressions, inserts (close-ups of eyes, teeth, the gate latch, hands on the crook, the candle, village windows), music timing. Lines can be trimmed or dropped (not newly recorded easily). NEVER suggest a trim that cuts into a spoken word. The owner already approved the STORY: keep every story beat; editing is about timing, shots and clarity.
NEW SINCE ROUND 1: subtitles are back in the UPPER THIRD (owner's call), and an opening story banner (Greek vase shard 'THE BOY WHO CRIED WOLF ...the third time was real', 0.25-2.6 s, above the subtitles) was added on purpose and picked by the owner: judge only its timing/readability. Your round-1 answer (FIX 41) is in `SOL-R1.md` here; the builder applied all items. One known exception: the kid's 'Please!' take has a ~0.75 s vocal tail that we keep whole (no voice is ever cut).

## Part A — ROUND-1 CHECK + SMALL EDITS
For each round-1 item (A1-A15, B1-B26) say FIXED, PARTLY or NOT, with one line where it is not fixed. Then at most 5 new timing edits, only if clearly worth it (the story and the lines are approved; no structural changes).

## Part B — GLITCHES AND LOGIC
List every visible glitch still there or new (pops, flicker, a pose that jumps between two frames of the same shot, a body through another body or a wall, a prop in the air, a face or animal cut by the frame edge, a face too small to read on a phone in a dialogue shot, subtitles over a face or the banner touching the subtitles, wrong sizes between shots) and every logic issue (an effect before its cause, a character or prop in the wrong place between cuts, sheep or gate continuity, the wolf in two places), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of NOT/PARTLY items + new edits + Part B items).
Write your full answer to `answer.md` in this folder.
