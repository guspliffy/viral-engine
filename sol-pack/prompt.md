# Sol round 1: EDITOR pass (timing first) + glitch/logic review — "The Pied Piper of Hamelin" (folklore legend, rough draft 1)

You are the editor and checker of a 101.8 s vertical (1080x1920, 30 fps) TikTok short. You get NO video, only files in this folder:
- `beats.txt`: every beat with its start-end time (s), speaker, spoken line, and what the shot shows.
- `sheet-1fps-A.jpg` (0-50 s) and `sheet-1fps-B.jpg` (51-101 s): one frame per second, 10 per row, left to right, top to bottom.
- `strip-5fps-XXs.jpg`: five frames per second, each sheet covers 10 s (10 per row = 2 s per row), starting at the second in its name.
Subtitles in these frames are already the fixed version (whole phrase chunks, fixed size).

## The video
The Pied Piper of Hamelin, told as a short story. Today: a curious 12-year-old boy (red jacket) whistles on Bungelosenstrasse in Hamelin at dusk; his stern grandmother (blue cloak, candle-jar staff, the candle is the fear meter) stops him: "Not on this street. Not one note." Narrator: music is still not played on this street, because of 1284. The legend (drawn like panes of a medieval stained-glass church window): rats, the piper in a red/yellow patchwork coat offers to clear them for 1,000 coins, the mayor gives his word, the rats follow the pipe into the river, "So he's the hero?" "Wait.", the town laughs and won't pay, the piper leaves silently, "A man like that doesn't argue... He comes back.", on 26 June while adults are in church he returns with a new tune, the children follow him down this street, out of the gate, up the hill into fog, the fog closes; a wooden toy left behind; a few stayed (one too slow, one who couldn't hear); proof (the town record "It is a hundred years since our children left", the carved house beam, the street today); ending: grandmother holds out her hand "Now. The five euros you promised me." "Right now?" "Right now." (kid pays, candle warms), then three soft pipe notes far down the street, both freeze, hard cut (loops to the start).
The STORY is approved by the producer; keep the story chain, the hook and the ending. Everything is drawn in code (flat 2D vector + stained-glass panels, moving camera). Cheap to change: cut points, holds, gaps between lines, shot order inside a beat, camera moves/zoom, inserts, poses and expressions, which panel/set is used, music cue timing. Lines can be TRIMMED or DROPPED (words cut from the recorded takes), not newly recorded.

## Part A — EDITOR (main task, TIMING FIRST)
The producer likes your tighter edits, "more about the timing of the scenes rather than the visuals". The draft is 101.8 s; the target is about 80 s (he may speed it up another 10-15% after). Make it hold viewers: hook in 1-2 s, cut right after each action, no static holds, every beat earns its seconds, end on the payoff. No on-screen title/label text (subtitles only), nothing graphic about the children.
Give a numbered EDIT LIST. Each item: time range, what to change (trim gap / cut words from a line (say which words) / drop line / shorten hold / reorder / new camera move / insert), and why. Concrete enough to build without asking. Then the NEW BEAT LIST (one line per shot with its new approximate start time and length) and the new total length.

## Part B — GLITCHES AND LOGIC
List every visible glitch (pops, flicker, a limb/body through another, a prop floating, a face lost or cut off by the frame, subtitles over a face, figures too small to read on a phone, wrong sizes between shots, empty/plain frames) and every logic issue (effect before cause, a prop that jumps, a reaction to something not shown, wrong place between cuts), each with its time.

End with exactly one last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = number of Part A + Part B items).
Write your full answer to `answer.md` in this folder.
