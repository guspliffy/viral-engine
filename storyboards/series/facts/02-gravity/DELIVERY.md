# Fact what-if 02: "What if gravity got stronger every five seconds?" (delivery, 20 Nov 2026)

Final: /mnt/project-files/videos/facts/02-gravity/gravity-FINAL.mp4 (52.9 s = a 0.8 s Moon flash-forward + the 64 s render with two still tails and the 1 g reset cut, played at 1.1235x with
ffmpeg setpts + atempo, voice pitch kept; 1080x1920, 30 fps, loops), farm run 44811774324, qa/check PASS on the 1x
render (32 creative notes, CHECK-FINAL.txt beside it).
Jonny 20 Nov 13:25 Berlin: the hook question is not burned in (he adds it with the TikTok text tool), the g counter
sits where it was (centre y 445), captions at 575; 7 % faster.
Jonny 20 Nov 15:31: the 3 g step stood still ~2 s (0:03.3-0:05.6). Now a ceiling lamp (new gpendant prop) hangs over him
from frame 0 (Jonny 16:25: it came out of nothing); at 3 g its shade snaps off, bonks his head, its bulb bursts, it drops beside him; the narrator says "Three gee." on a punch-in.
Jonny 20 Nov 19:41: still tails at the end of 10 g and 15 g -> cut in the edit (1x times):
keep 0-16.8, 18.0-22.333, 23.0-64 (16.8-18.0: his face after "... comes back"; 22.333-23.0: after "... their weight";
15 ms audio fades at each join), then 1.07x.
Jonny 20 Nov 20:07: after the cuts the voice came a beat before the words -> captionLead 0.12 (each word pops 0.12 s
before its voice, never before the cut; new engine key, default 0).
Jonny 20 Nov 21:02-21:03: 5 % faster again (1.07 x 1.05 = 1.1235x from the 1x render) and the "back to 1 g" part cut
(his retention graph: most viewers skip it): the video ends at 60.5 s (1x), the last frame before the black, 40 ms audio
fade; the loop now goes from the Moon hit straight to frame 0.
Jonny 20 Nov 21:12-21:19 (from the TikTok read: 35 % gone by 0:02, the Moon part holds flat): first line "... At fifty,
the Moon falls." (was "In ten, you black out.", take 2), the 2 g step at 0.2 s, and the edit opens on the Moon: 1x
51.8-52.6 (45 g, no caption) with its own sound, then 0-16.8, 18.0-22.333, 23.0-60.5. Words pop with the voice in every
line (captions carry "said": spoken "gee", written "g"). gravity-YT.mp4 = the same with "Gravity gets stronger. /
Nothing is safe?!" burned in for the first 2.0 s (Inter Black 70 px, y 190, PIL png overlay); gravity-FINAL.mp4 has no
burned text (TikTok: he adds it in the app). ffmpeg trim/atrim + concat, then setpts=PTS/1.07,fps=30 + atempo=1.07.
Post pack: POST-PACK.md beside this file.

## Rounds
- Rough v1 -> Jonny (19 Nov): faster 1-5 g, real world destruction after the buildings (the Alps for real, not on the
  TV), the Moon really falls and everything is destroyed, then 1 g; phone hold; one "g" pronunciation; more extreme.
- v2 design by GPT-6.2 Sol (DESIGN-v2.md), four new prop files built by Sonnet builders, Jonny's cut rules of 20 Nov
  (push-in or drift on every shot, a punch-in on each line, cut 0.1-0.2 s after each action). Rough v2 -> Jonny
  20 Nov 10:14 Berlin: "way better ... now do the bug and glitch checks with sol".
- Sol glitch checks (gpt-6.2-sol xhigh on Jonny's PC, sheets + 12 fps strips): r1 FIX 15 (12 fixed, 3 kept below),
  r2 FIX 5 (all fixed), r3 FIX 1 (fixed: the opening line as two captions). Inputs and answers:
  /mnt/project-files/videos/facts/02-gravity/sol1..sol3/. Found by our own pops check between rounds and fixed: the
  fire wall's front passed through the room at 59.53 (one orange frame), the room-hit flash now starts on the cut.

## Kept on purpose (Sol r1, with reasons)
- 4: the hook says "every five seconds" while 1-5 g come every 2.5 s: Jonny's pick ("every few is too undistinguished").
- 5: "Buildings only hold about twice their weight": the approved narration (load factors 1.2D + 1.6L, an estimate).
- 10: the 21.65 face cut looks down from another angle; the dust is in the world, just out of that view.

## Departures from the design (with reasons)
- Window cameras P1/P4/P7 sit in line with his face (x .46) and use a wider lens (65/65/70): his flattened face was
  wider than the frame and the right eye was cut (Sol r2).
- P7 is closer to the window than the design: from there the window top hid the Moon until 50 s.
- The punch-ins on the window shots are gentle (fov x .93-.95), so the check notes some cuts at 19.0, 23.9, 38.0 and
  49.1 as "reads as a skipped frame" (5-13 % size change). Jonny's punch-in rule wins over that note; say if they read
  as jumps on the phone and they become angle changes.
- The street tears open during the overhead shot (28.0-30.2), not before it, and carries the collapse dust (Sol r1, r2).
- The blackout shot holds 11.15-14.8 through the wake-up and the sofa-leg snap (a cut there made the sofa jump).

## Sound (Claude can't hear: Jonny, with headphones)
(1.1235x final) 0:00.0 the Moon flash's rumble, 0:00.7 the cut to the room · 0:04.0 the lamp bonk + bulb burst · 0:04.8 "Three gee." · 0:08.2 heartbeat under the music · 0:16.5 thunder at the tower fall · 0:24.8 street fires · 0:26.0 the payoff "Good
thing you're a potato" (the wink: does it land, is there a breath before it) · 0:26.7 his flat exhale.
The destruction sounds partly come from code-made explosion, thunder and rumble: say if any sound fake.

## Engine changes on this branch
- New props: engine/page/props-gravruin.js, props-gravstrike.js, props-gravalps.js, props-gravmoon.js (registered in
  props3d.js); props-gravroom.js gsofa `brk`; hud.js gforce null key hides the counter; potato.js flatScale.
- qa/golden.mjs: all 12 stills and 5 motion strips unchanged against origin/main (23ffb3e).
