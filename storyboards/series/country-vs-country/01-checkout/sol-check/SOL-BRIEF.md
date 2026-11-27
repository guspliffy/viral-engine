# Sol check, round 1: "Paying at the supermarket: Germany vs America" (draft 2, 57.3 s, vertical 9:16)

You have TWO jobs on this draft of a short animated comedy sketch:
A. find BUGS, GLITCHES and LOGIC ISSUES;
B. act as the EDITOR: say where to cut, which shots are too still or too long and should be shortened or dropped, so
   the video is tighter and keeps moving (the producer's own tests: Codex edits came out shorter and more interesting,
   with faster cuts and fewer still scenes).

You cannot see the video itself: you get its frames. Look at every image in this folder:
- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), time burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-50s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), time burned
  in. Use these for one-frame pops, jumps, things passing through each other, flicker.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue (voices 1.15x fast), each line captioned word by word in the top third (white, key words yellow). No names
on screen on purpose; no lettering in the picture on purpose (flags only). Ends on the punchline on purpose.
The producer's notes on draft 1: "the flags should be more visible and there are many glitches". Draft 2 adds big
flags hanging over each lane and bigger till flags; tell us if the flags still don't read.

Two lanes, cut between every 2-4 s. GERMAN LANE: grey discount checkout, black conveyor belt, cold strip lights,
cardboard boxes on steel racks, black-red-gold flags. AMERICAN LANE: warm, cream and red, candy racks, copper pendant
lamps, stars-and-stripes flags. Each lane has its own colour grade (German cooler, American warmer).

Cast: YOU = the hero, a golden potato with a green sprout in a TEAL KNIT SWEATER, in BOTH lanes (same character).
German lane: he holds an armful of groceries and a BLUE BANK CARD between his teeth (later in his hand); a cream tote
bag stands at his feet. THE CASHIER = tall potato in a red jacket with fur collar and sunglasses on his head, stands
behind the till, never blinks, sweeps his hand over the scanner. THE RETIREE = round old potato, grey brows, round
glasses, flat tweed cap, beige cardigan, sighs and taps his watch. American lane: he holds a CASH ROLL. THE BAGGER =
tall potato in a grey hoodie with headphones round his neck and a green apron, puts one item in each brown paper bag.
Background shoppers are potato extras.

Story chain (draft 2 times; shot names in brackets):
1. 0.0-2.1 [DE wide] Goods fly off the fast belt at you; the cashier: "Don't. Stop. Packing."
2. 2.1-4.0 [cashier low] He points: "Nobody survives this line."
3. 4.0-6.5 [you close, DE] Card in your teeth, arms full: "Survives... WHAT?"
4. 6.5-11.7 [US medium] The bagger holds up ONE grape: "Paper or plastic? For each grape?" Lowers it into a bag,
   holds up the next: "And grape number two!" You hold a cash roll.
5. 11.7-12.9 [retiree] He sighs: "Hhhhhhh."
6. 12.9-14.1 [cashier low] "Faster." The belt speeds up.
7. 14.1-15.7 [eggs] An egg carton lands on your palm, goods keep coming: "Not the eggs!"
8. 15.7-18.1 [ten bags, from above] Ten bags in a row, one item each; the bagger leans on the counter: "So... how's your mom?"
9. 18.1-21.1 [you close, US] "Please. Just. Bag."
10. 21.1-24.8 [over your shoulder] The retiree sighs and taps his watch: "Hhhhhhhhh. Too slow."
11. 24.8-27.5 [you, then retiree] The card in your teeth; the retiree shakes his head: "A card. Pah."
12. 27.5-29.8 [DE peak, wide] Scanner sparks, goods fly, belt at full speed: "Use your feet."
13. 29.8-31.9 [retiree] "TOO. SLOW."
14. 31.9-33.9 [US peak, wide] A mountain of bags to the ceiling, you stand in it: "Need help to your car, hon?"
15. 33.9-37.2 [US close] You hold out the cash roll; the bagger stares: "Is that... paper money?" You: "It's money." Him: "Cute."
16. 37.2-38.9 [card, DE] "Twelve forty." You hold out the card.
17. 38.9-40.5 [US wide] "Three hundred twelve forty!"
18. 40.5-44.8 [card, DE] The cashier stares at your card: "What. Is. This?" ... "Cash. Only."
19. 44.8-45.5 [retiree] Gasps, hands on his cheeks.
20. 45.5-48.1 [US close] "Oh, hon... Card only."
21. 48.1-50.3 [split frame: German half left, American half right, a thin white line between] Both lines of shoppers stare at
    you, arms full: "I just want to go home."
22. 50.3-51.7 [DE wide] The retiree: "Move." He shoulders you aside to the counter.
23. 51.7-57.3 [coins] He counts copper coins one by one onto a pay tray: "One cent. Two cent. Three cent..." The cashier who
    rushed you smiles: "Take your time." END.

## What to send back

Write your answer to `SOL-REPORT-r1.md` in this folder. A numbered list, each item: time (s), what is wrong, what you
see, a concrete fix. Glitches first (pops, flicker, a hand/body/prop through another, a prop floating or jumping, a
face covered or cut by the frame edge, an empty or confusing frame), then logic (cause after effect, a prop that
changes place between shots, a reaction to something not shown, the card/cash not readable when it matters), then
EDITOR notes (cut, shorten, drop, faster). Last line exactly `VERDICT: PASS` or `VERDICT: FIX <n>`.
