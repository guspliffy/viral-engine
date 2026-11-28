# Sol check, round 1: "Waiting at a red light: Germany vs America" (draft 3, 59.5 s, vertical 9:16)

You have TWO jobs on this draft of a short animated comedy sketch:
A. find BUGS, GLITCHES and LOGIC ISSUES;
B. act as the EDITOR: say where to cut, which shots are too still or too long and should be shortened or dropped, so
   the video is tighter and keeps moving. Do not cut the curiosity re-hooks (2 s curtain twitch, the clock lines, the
   binoculars, every curtain twitching at the toe) or the ending.

You cannot see the video itself: you get its frames. Look at every image in this folder:
- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), time burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-50s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), time burned
  in. Use these for one-frame pops, jumps, things passing through each other, flicker.
- `traffic-sheet-1.png`: the producer's approved storyboard (12 panels). Say per panel where the video falls short of it.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue (voices 1.15x fast), each line captioned word by word in the top third (white, key words yellow). No names
on screen on purpose; no lettering in the picture on purpose (flags and pictograms only). Ends on the punchline on purpose.

Two streets, cut between every 2-4 s, each with its own colour grade. GERMAN STREET: a narrow empty cobbled street,
pink and butter-yellow blocks of flats with lace curtains, a pedestrian light with a red / green little man with a hat,
a yellow city bus waiting at an island across the road, a black-red-gold flag on a balcony. Not one car on purpose.
AMERICAN STREET: a wide four-lane road, yellow lights hanging on a wire, a pole with an orange raised hand and a big
round push button with a speaker grille, a diner and gas station painted far behind, a stars-and-stripes flag, a white
bus at the far pavement, a red pickup truck.

Cast: YOU = the hero, a golden potato with a green sprout in a TEAL KNIT SWEATER, on BOTH streets (same character).
THE RETIREE = round old potato, grey brows, round glasses, flat tweed cap, cardigan, leaning out of his open window.
THE BUS DRIVER (Germany) = tall potato in a red jacket with fur collar, sunglasses on his head, never blinks, a wrist
watch. THE KID = a tiny potato in a red raincoat with the hood up, never blinks, appears beside you. A WATCHER behind
the lace across the street with binoculars. THE PICKUP DRIVER (USA) = tall potato in a grey hoodie. THE JAYWALKER (USA) =
small potato in a yellow hoodie with a burger. At the end: rows of old potatoes in every window of the block.

Story chain (draft 3 times):
1. 0.0-2.1 [DE wide] Empty street, red man, you at the kerb; a window bangs open, the retiree: "DON'T. You. DARE."
   (2.2 s: every lace curtain on the block twitches once: a flash of the ending.)
2. 2.1-3.3 [you close] "Who's even WATCHING?!"
3. 3.3-6.4 [window, low] "Red means STAND. Forever."
4. 6.4-11 [bus across the road, then the driver through the windscreen] "Bus leaves in one minute." "This bus is NEVER late."
5. 11-14 [USA, at the button] You press: "Come on... come on." A red pickup turns right on red past your nose: "Right on red, hon!"
6. 14-17 [retiree] "Think. Of. The children."
7. 17-18 [you] "There ARE no children!"
8. 18-20 [retiree] "There are ALWAYS children."
9. 20-22.5 [kerb two-shot] A kid in a red raincoat is suddenly beside you, staring: "...Where did YOU come from?"
10. 22.5-27 [USA] A jaywalker strolls across mid-road with a burger: "Morning!" You: "It's RED!" Him: "It's a suggestion.
    Nobody walks here, man."
11. 27-28.5 [driver] taps his watch: "Thirty seconds."
12. 28.5-30.8 [you lean over the kerb] "Okay. Nobody's looking..."
13. 30.8-32.2 [window across the street] Binoculars glint behind the lace: "I SEE you."
14. 32.2-37.5 [USA] You hammer the button: "Come ON!" The button: "Wait." You: "I AM waiting!" Button: "Wait."
15. 37.5-41.7 [DE wide low, then retiree] Your toe slides off the kerb, every curtain on the block parts with eyes in the
    gaps; the retiree holds up an open hand: "Five. Euros." "And I'm telling your MOTHER."
16. 41.7-47.5 [USA] The pickup stops for you: "Go ahead, hon!" You just walk across and step onto the bus: "...Huh. Made it."
17. 47.5-52.2 [driver, you] "Ten seconds." You stare at the red man: "Come on, come on, come on..."
18. 52.2-56 [driver "Too late.", the light turns GREEN, you step off, the bus doors close and it pulls away]
19. 56-59.5 [retiree "Good.", then the whole block] Every window opens, rows of old potatoes lean out and slow-clap, the kid
    claps too; you stand alone on the crossing. END.

## What to send back

Write your answer to `SOL-REPORT-r1.md` in this folder. A numbered list, each item: time (s), what is wrong, what you
see, a concrete fix. Glitches first (pops, flicker, a hand/body/prop through another, a prop floating or jumping, a
face covered or cut by the frame edge, an empty or confusing frame), then logic (cause after effect, a prop that
changes place between shots, a reaction to something not shown, a clock that does not add up), then the storyboard
gap per panel, then EDITOR notes (cut, shorten, drop, faster). Last line exactly `VERDICT: PASS` or `VERDICT: FIX <n>`.
