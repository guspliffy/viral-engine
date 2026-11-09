# BOARD: pause-time (What if, episode 1)

## §1 Brief

- Joke: the friend who is always late can stop time, so he is never late (the selfie, the coffee, the clock).
- Wants: Viking wants to look like he was on time; Phoenix and Reaper want him to stop being late.
- Consequence: the friends see the result and never how (the double take, the empty hand, 12:00 again).
- Ending: the real-physics twist: if time stops, light stops too, so he'd be blind. In the dark only his eyes; he
  walks into the clock post (BONK). The light comes back on him flat against it. "Would you still want it?"
- Callback: the clock he wound back is the post he walks into; "Late for the photo?" turns into the viewer's question.
- Source: Jonny 8 Nov ("upgrade everything and try out the formats as well"), format B of
  x-video-formats-review-2026-11-08; formula kelano86/what-if-animation `references/formula.md` (three escalating demos,
  power = word + sound + look, title card, one real fact turn, end on a question, 15-25 s). Gate: new format, animatic.
- Length 18.6 s (the format's 15-25 s, not the 8-11 s of a series episode); loop: no; profile: short.

## §2 Look

- Cast: vik (always-orders-potatoes/viking, the late one, real voice), phx (duo/phoenix), rea (never-has-money/reaper);
  castLook "sheet"; set env meadow-path, `life` auto, `lighting` 2, cel 0.25, hatch boil 0.25, no DoF.
- Stage: z -5.5 to -6.5 down the road (the generator's OX 0.2, OZ -3.6 on the first layout), past the painted bush
  (left) and tree (right) that hid anyone at a frame edge nearer the painting's eye; wide cameras at z 0.1-1.0 sit on
  x ≥ 0.15 (4.4 - z) so the hill painted in behind the tree's crown never shows (a pale halo).
- Light: summer midday, key from the left; palette meadow greens #6f9a4a #a7c46a, road #d8c49a, sky #9fc8e8, clock
  iron #1f4a35 + gold #c99a3a.
- The power, the same every time: the word "HALT!" (Viking, subtitle 0.7 s), the sound `timestop` (wooden tock +
  tape-stop) and the look (grey ring from Viking over 0.3 s, he stays in colour; music + wind + birds stop). Out:
  `timego`, colour floods back over 0.2 s. Pause 4 is `dark`: black but his eyes.
- Music: bounce, gain 0.3, lowCut 150; hush in every pause, drop on the payoff (16.85 s).

## §3 Shots

### §3.1 Photo (0-4.4 s, kind: hook)

- We see: front, medium-wide (cam [0.65, 1.5, 0.1] -> [-0.1, 0.6, -6.0] fov 48): Phoenix (phone up over their heads,
  left hand, its orange back to the lens, scale 1.8) and Reaper at the selfie, Viking running in from the left edge of
  the frame behind them (render 1: from far down the road he read as standing with them).
- Action: 0.1 "Say cheese!" (Phoenix), timer beeps 0.32 / 0.78; 0.62 HALT; pause 1.0-2.75: Viking strolls into the
  picture (1.25-2.2), thumbs up 2.25; 2.95 beep, 3.15 flash + photo print of three (3.3-3.95); 3.95 double take
  (cam [-0.6, 0.95, -2.0] fov 46).
- Text: "Late for the photo?" 0-1.0 s, y 300.

### §3.2 Coffee (4.4-8.6 s)

- We see: front wide (cam [0.51, 1.5, 1.0] -> [0.4, 0.6, -6.0] fov 48): Phoenix angry with a coffee, Reaper on the
  bench, Viking from the right; insert 5.3-6.02 on the cup hanging in the air (cam [0.3, 1.05, -2.6] -> [0.42, 0.95,
  -5.7] fov 40), the cup in colour all pause, clear beside his face (he stands 0.45 m left of it and 0.25 m behind,
  his glove behind it); the wide again for the sit; insert 7.45-7.85 on Phoenix staring at his empty hand (cam [-0.3,
  1.0, -2.3] -> [-0.55, 0.7, -5.65] fov 44, review B).
- Action: 4.5-4.9 the big gesture, the cup leaves the hand 4.9, flies at Reaper's face (it stops at CUP_HANG at
  5.02, 0.17 m nearer than the knock's aim: Phoenix's follow-through pushes it; measured, Viking's stand and hand use it); 4.66 HALT; pause 5.02-7.3: the cup hangs in the air, Viking backs up under it and takes it 5.7-5.96, sits
  beside Reaper 6.4-6.95; 7.32 Reaper flinches, 7.4 Phoenix's empty hand; 7.88 "Been here ages.", the cup held at his
  chest (render 4: no toast; raised, it turned out beside his glove) (cam [0.85, 0.95, -1.5] -> [0.85, 0.62, -6.4] fov 46).
- Text: "Late for coffee?" 4.4-5.0 s, y 300.

### §3.3 Clock (8.6-12.4 s)

- We see: front wide (cam [0.65, 1.5, 0.1] -> [0.1, 0.75, -5.9] fov 48): Reaper points at the clock (12:40), Phoenix
  taps a foot.
- Action: 8.6 Viking arrives sheepish; 9.12 HALT; pause 9.35-11.45: to the crank, 1.5 turns back 10.42-10.96 (dial
  insert, cam [-0.1, 1.42, -3.55] fov 15, a long lens; the hands race to 12:00, ratchet ticks); 11.55 the whistle;
  11.8 Reaper's double take at the clock (cam [-0.65, 1.0, -2.7] fov 44).
- Text: "40 minutes late?" 8.6-9.3 s, y 300; this demo's "HALT!" at y 440, above the clock (he fills the bottom); "hm hm hmm..." 11.55 s, y 300 (Reaper fills the bottom of the double take).

### §3.4 Title (12.4-14.0 s, kind: reveal)

- We see: wide on all three (cam [0.65, 1.4, 0.1] fov 46), Viking front middle; his wink 13.0-13.32.
- Text: "WHAT IF YOUR FRIEND COULD PAUSE TIME?" 12.45-13.95 s, y 480 (above their faces), size 96, pop. Reaper at x -0.6.

### §3.5 Twist (14.0-18.6 s, payoff at 16.85)

- We see: Viking and the post (cam [-0.74, 1.0, -1.8] fov 42, pushing in to z -3.0 over 14.0-16.3 so the eyes grow in
  the dark: review B), held through the light coming back (16.85-17.45) so it returns on the eyes we watched; then
  everyone (cam [0.65, 1.7, 0.1] fov 50) for the laugh and the question.
- Action: 14.42 HALT; dark pause 14.7-16.85: only his eyes, they dart, he crab-steps right (turned 40°, the eyes stay
  to us), BONK 16.34 (pan-bonk): the eyes squeeze shut, open dizzy 16.55 (review B); 16.85 the light back: reeling off
  the post (pitch -8 held), turns his face to us by 17.1, stars; 17.5 Phoenix "HA HA HA!", Reaper's slow blink 17.78.
- Text: "But if time stops..." 14.0, "...light stops too." 14.75, "He'd see NOTHING." 15.35, "That's real." 15.88-16.32,
  "Would you still want it?" 17.5-18.55, all y 300; "BONK!" 16.34-16.8, y 560, size 96, pop (review B: the hit on mute).

## §4 Check times

0.4, 1.8, 3.5, 4.1, 4.7, 5.5, 5.9, 6.9, 7.9, 8.9, 10.6, 11.9, 13.1, 15.4, 17.1, 17.8

## §5 The commentator cut (`--vo`, pause-time-vo.json)

Jonny 9 Nov 2026: of six voices he picked the deep storyteller (voices.json `narrator`) and wants "to try some videos
with the voiceovers as commentator". Same picture as the main cut, so the two compare the voiceover alone; END 19.8
(the last wide holds 1.2 s longer for the question after the laugh). The lines sit where nobody speaks:

| at | line | where |
|---|---|---|
| 1.02 | What if you could pause time? | the first pause, as he strolls into the photo (the premise; the read Jonny heard) |
| 5.15 | Even the coffee waits for him. | the cup hanging in the air |
| 9.85 | Just wind it back. | after this demo's HALT! subtitle, before "hm hm hmm" |
| 12.42 | Sounds perfect, right? | the title card (no subtitle: the title fills the top) |
| 14.90 | Light stops too. | the dark, after "But if time stops..." and HALT!; replaces the three twist captions |
| 18.30 | Would you still want it? | after Phoenix's laugh; replaces the closing caption |
