# Sol round 1: EDITOR pass + glitch/logic review — "Night Marchers" (folklore legend episode, rough draft 1)

You are the editor and checker of an 82.3 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only images in this folder:
- `beats.txt`: every beat with its start-end time (s), speaker, spoken line, and what the shot shows.
- `sheet-1fps-00-41s.jpg`, `sheet-1fps-42-83s.jpg`: one frame per second (12 per row, left to right, top to bottom; a timestamp is printed top-left of each frame).
- `strip-5fps-00s.jpg` ... `strip-5fps-80s.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.

## The video
Hawaiian legend of the Night Marchers (huakaʻi pō): ghost warriors who guard their chiefs and still walk their old paths at night. A stern grandmother (blue cloak, candle-jar staff = fear meter) and a curious 12-year-old boy (red quilted jacket) camp on a windward Oʻahu hillside. Narrator voice-over plus character lines, word-by-word subtitles in the upper third (their timing has already been fixed since these frames were made; ignore subtitle timing). String-trio score, distant drums + conch as sound effects.
RESPECT RULE (keep it): this is a sacred tradition. The marchers are NEVER drawn: only far torch points, their light, shadows of feet/legs, flames reflected in a puddle, and sound. Comedy only from the two hosts, never about the marchers.
Story chain (approved by the producer after the rough draft, "generally the video is really good"; keep it): grandma covers his phone "Never look at them" -> "Look at who?" -> face down, eyes shut -> who they are -> they camped on the marchers' path -> drums, conch, torches -> "Not a sound" -> ti plants protect a home -> they only have a plastic fern (gag) -> "What happens if you look?" "You never go home" -> light floods over them, feet pass -> only an ancestor among them can claim someone who looks -> he sneezes, his eye opens a crack -> EVERYTHING STOPS (black, silence) -> "Leave him. He is mine." -> march moves on -> "Who was that?" "Your great-great-grandfather. You have his ears." "I'm Hawaiian?" "Why do you think we came here?" hard cut.
The whole video is drawn in code (flat 2D, a 2.5D hillside set with a moving camera). What can change cheaply: camera position/move/zoom per shot, cut points, shot order, holds, inserts (the phone, the candle jar, the fern, the puddle, the stone path, the torch line, grass, hands, eyes), light colour/strength, the kid's face (eyes shut/crack/open, worry, mouth), the feet-shadow passes, music/sfx timing. The grandmother has no lip-sync while lying down (her lines play over other shots). Lines can be trimmed or dropped, not newly recorded easily.

## Part A — EDITOR (main task)
Make it hold viewers better: faster cuts, fewer static or repeated shots (the kid close-up repeats often), stronger moments, better tension and payoff. House rules: hook in the first 1-2 s; still shots lose viewers, so move the camera or cut right after each action; end on the punchline; no on-screen title or label text (subtitles only); no gore; 60-80 s is fine if every beat earns it.
Give a numbered EDIT LIST. Each item: the time range, what to change (cut/trim/reorder/new camera move/insert/hold/light), and why. Be concrete enough to build without asking. Then the NEW BEAT LIST (one line per shot with its new approximate time).

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a limb or body through another, a prop floating, a face cut off by the frame, subtitles over a face, wrong sizes between shots, a dark blob that reads wrong) and every logic issue (effect before cause, prop jumps between cuts, a reaction to something not shown), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items). Keep the whole answer under 1,400 words.
Write your full answer to `answer.md` in this folder.
