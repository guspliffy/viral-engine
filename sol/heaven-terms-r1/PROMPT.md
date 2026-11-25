# Sol round 1: "Heaven's terms and conditions" (rough draft 1) — EDITOR pass + glitch/logic check

You are GPT-6.2 Sol, reviewing a 64.7 s vertical (1080x1920, 30 fps) animated short for TikTok/Reels/YouTube Shorts.
Producer: Jonny (channel PotatoBrawl). The story is APPROVED by Jonny; your job has two parts:

A. EDITOR. Jonny: "ask sol to edit it to a more interesting video". His own test: when he gave videos to Codex, they came
   back much shorter and more interesting, with faster cuts and fewer still scenes. Make this one more interesting.
B. GLITCH + LOGIC CHECK. Every visible glitch and every logic issue, each with its time.

All files are in this folder:
- `heaven-terms-rough-draft-1.mp4` — the draft itself (use it for part A; you may extract frames with ffmpeg).
- `contact.png` — one frame per shot (23 shots), each labelled with its time.
- `cuts.png` — one row per cut, 0.2 s either side, first new frame marked red.
- `heaven-terms-anime-pro-draft.contacts-1.png`, `-2.png` — 15 fps strips of every contact moment (grab, release, drop).
- `phone.png` — one frame a second at 360 px (phone size): read every caption there.

## The story (approved chain, one line per beat)
At heaven's gate the one rule is "you agree to everything, forever" -> so the Angel (a clerk with a halo and round
glasses) drops the terms: the scroll rolls down all 100 steps into hell's red glow -> the hero (a potato in a teal
sweater, unnamed) stamps it without reading ("Who reads these?"), the gate opens -> in heaven every clause comes true:
harp at 6 AM, wet clouds (his socks), his ex docks next door, "free hugs" (she hugs him), no wifi (the Devil far below
has five bars) -> he storms back: "I want to READ it." "Nobody gets to the end." -> he walks DOWN the scroll reading
clauses 41, 68, 93 -> at the bottom, on the hatch, clause 100: "Anyone who didn't read this... goes to hell." -> the
hatch drops, CUT on the punchline.

## Shots (video seconds)
1 rule 0.00-3.27 | 2 drop 3.27-4.13 | 3 down (scroll runs to hell) 4.13-5.87 | 4 stamp 5.87-8.00 | 5 wake 8.00-9.47 |
6 harp 9.47-15.40 | 7 socks 15.40-17.27 | 8 clause 8 17.27-20.33 | 9 dock 20.33-23.53 | 10 hide 23.53-25.73 |
11 clause 15 25.73-28.80 | 12 bright 28.80-32.93 | 13 hug 32.93-35.87 | 14 phone 35.87-37.53 | 15 edge 37.53-40.00 |
16 clause 22 40.00-43.40 | 17 read 43.40-45.00 | 18 nobody 45.00-47.00 | 19 reading 80 47.00-50.00 |
20 reading 40 50.00-57.20 | 21 arrive 57.20-59.67 | 22 clause 100 59.67-63.93 | 23 hatch 63.93-64.67

## Lines (caption from-to, video seconds)
0.00-2.00 label "Nobody reads heaven's terms" | 0.10 Angel: At heaven's gate, there's one rule: you agree to everything.
Forever. | 5.97 Hero: Who reads these? | 9.92 Angel: Clause 3. Harp practice. 6 A.M. | 13.43 Hero: I'm dead. Let me sleep.
| 16.05 Hero: Why is it wet?! | 17.42 Angel: Clause 8. Clouds are wet. | 22.48 Ex: Hiii! | 23.83 Hero: No no no. |
25.88 Angel: Clause 15. Your ex lives next door. | 28.90 Angel: Clause 16. Free hugs. | 31.21 Hero: Oh, nice! |
33.18 Ex: I missed you sooo much! | 34.90 Hero: Help. | 36.22 Hero: Where's the wifi? | 38.83 Devil: Five bars down here!
| 40.15 Angel: Clause 22. Wifi is downstairs. | 43.75 Hero: I want to READ it. | 45.25 Angel: Nobody gets to the end. |
47.30 Hero: Clause 41. No snooze button. | 50.20 Hero: Clause 68. Mondays. Forever. | 53.69 Hero: Clause 93. Heaven may
change these terms at any time. | 58.40 Devil: Keep reading, buddy! | 59.87 Hero: Clause 100. Anyone who didn't read
this... goes to hell.

## House rules (Jonny's)
- Hook in 1-2 s; first spoken line = the rule. End ON the punchline (no tag after it). Every shot should move (slow
  push-ins, angle changes); cut right after each action; still scenes lose viewers.
- Captions in the upper third, never over eyes. No title card mid-video. Hero is never named on screen.
- Jonny speeds most finished videos up 10-25 % after render; voices are already 1.2x.
- Known stand-ins in this draft (not glitches): the music, the harp sound (a bell + a pluck), the ex's voice.
- Known open items already on my list: the Angel's "Clause" may sound like "Close"; shot 15 (edge) does not show the
  hero or his phone.

## What I can build (so your edit is implementable)
The video is rendered from a script by a 3D engine, so I can: cut, trim, reorder or merge shots; change any camera
(framing, angle, push/pull, pan, crane, whip, a quick punch-in on a reaction); re-time or overlap lines; cut a line or
shorten its words (re-recorded); add a short reaction insert or cutaway using the SAME characters, sets and props;
add sound effects. I can NOT add new characters, sets or props without a design round, so mark any such idea "NEW".
Do not change the approved story chain silently: any edit that drops or changes a story beat goes in a separate list
"STORY CHANGES (Jonny decides)".

## What to write (to `sol-r1.md` in this folder)
1. EDIT PLAN: a new shot list with target times (in seconds at 1.0x), one line per shot: keep / trim to n s / cut /
   merge / new camera (say what), and what each change buys. Aim for the most interesting version; say the new length.
2. STORY CHANGES (Jonny decides): anything that alters the beats above, with your reason.
3. If you can, render your cut as a preview with ffmpeg from the draft (`sol-cut-preview.mp4`, rough is fine) so Jonny
   can see the pacing. Optional.
4. GLITCHES + LOGIC: every visible glitch (pops, flicker, a hand or body through a prop or person, a prop in the air,
   a face lost or covered, a caption over eyes or cut off) and every logic issue (an effect before its cause, a prop
   that jumps place, a reaction to something not shown), each with its time and the file you saw it in.
5. Last line: `VERDICT: PASS` or `VERDICT: FIX <n>` (n = glitch + logic items).
