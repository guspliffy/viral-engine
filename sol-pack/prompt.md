# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "Urashima Taro" (folklore legend, rough draft 2)

You are the editor and checker of a 99.0 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only images in this folder:
- `beats.txt`: every beat with its start-end time (s), speaker, spoken line, and what the shot shows.
- `sheet-1fps-00-35s.jpg`, `sheet-1fps-36-71s.jpg`, `sheet-1fps-72-99s.jpg`: one frame per second (12 per row, left to right, top to bottom; each sheet starts at the second in its name).
- `strip-5fps-00s.jpg` ... `strip-5fps-90s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Japanese legend Urashima Taro (8th century, Tango coast), told by two recurring hosts: a stern grandmother (rule keeper, indigo cloak, staff with a candle = fear meter) and a curious 12-year-old boy (red jacket). Narrator voice-over plus character lines, word-by-word subtitles in the upper third. Music: koto + cello + one shakuhachi note, silent under the grave and the smoke, faded out before the last two lines.
Story chain (approved by the producer, keep it): kid finds a box from the sea, grandmother slams it shut: "Never open a box from the sea." / "What's inside?" / "Someone's three hundred years." -> Urashima saves a turtle -> the Dragon Palace, four season windows turning faster ("Every window is a year. He didn't count.") -> the princess gives him the box: never open it -> home: 300 years have passed, mother's grave -> proof (chronicle dates it to 478, a shrine keeps the box, the "Urashima effect" in physics) -> he opens it, white smoke, ancient in one breath -> back on the beach: "Grandma... did you ever open one?" "Once. Just a peek." ... "I was nineteen." HARD CUT.
The whole video is drawn in code (flat 2D vector style). What can change cheaply: cut points, holds, shot order, camera moves/zoom per shot, inserts (hands, box, cord, candle, eyes, windows, waves), poses/expressions, music timing. Lines can be trimmed or dropped (not newly recorded). The producer usually speeds the final up 10-25 %; the cut is 99 s at normal speed and should get tighter.

## Part A — EDITOR (main task)
The producer: it is "more about the timing of the scenes rather than the visuals". Make it hold viewers better: tighter timing, faster cuts where shots sit still, stronger moments (the season windows speeding up, the 300-years reveal, the aging), payoff landing hard. House rules: hook in the first 1-2 s; still shots lose viewers, so move the camera or cut right after each action; end on the punchline; no on-screen title or label text (subtitles only); real beats, no padding.
Give a numbered EDIT LIST. Each item: the time range, what to change (cut/trim/reorder/new camera move/insert/hold/drop or trim a line) and why. Concrete enough to build without asking. Then the NEW BEAT LIST you propose (one line per shot with its new approximate time) and the new total length.

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a limb through a body, a prop in the air, a face cut off by the frame, subtitles over a face, size jumps between shots, crude or off-model drawing) and every logic issue (effect before cause, prop jumping place, reaction to something not shown, wrong place between cuts), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
