# Sol check, round 1: "Never say this at heaven's gate" (draft, 44.3 s, vertical 9:16)

You are checking a draft of a short animated comedy sketch for BUGS, GLITCHES and LOGIC ISSUES. You cannot see the
video itself: you get its frames. Look at every image in this folder:

- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), timestamp burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-40s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue, each line captioned word by word in the top third (white, highlighted words yellow). Characters have no
names on screen on purpose. The video plays 1.25x faster than it was rendered (on purpose). The opening text "Never say
THIS at heaven's gate?!" is the hook; the last line answers it.

Cast: HE = a small golden potato with a green sprout in a yellow hoodie (the hero). THE ANGEL = a taller potato in a
white robe, small wings, gold halo, round gold glasses, at a cloud podium with a big ledger and a golden quill
(deadpan clerk). A SECOND POTATO in a teal sweater with a suitcase (only at the start). THE DEVIL = a red potato with
small horns, sunglasses and a teal resort shirt, lounging in a deck chair at the bottom. A TINY RED IMP pops out of a
round hatch in the floor at the bottom. Set: ONE white marble stairway of 100 steps in the sky, gold numbers on some
risers (2, 10..90, 61, 62, 91, 98, 99, 100), landings every 10 steps, a pearl gate at the top (step 100), the lower
steps turn grey, then orange, then scorched dark red at the bottom where hell's hatch and the deck chair are.
The rule the picture must keep: his step number = his points. A penalty of N folds the N steps under him flat into a
slide and he slides down N steps, then the steps unfold behind him.

Story chain (times in this video):
1. 0.0-2.4 TOP: he stands on 99 under the gate; the Angel: "Hundred points to get in. You've got ninety-nine."
2. 2.4-5.1 "One point? Easy." The second potato trips on 96-98, his suitcase tumbles to 98; he: "Here, let me!" and
   lifts the suitcase up.
3. 5.1-6.5 Good deed: a glowing plate lifts him from 99 to 100, the gate swings open; he hands the case over, the
   second potato walks through the gate.
4. 6.5-10.2 Arms up: "Did you SEE that?!" The Angel writes: "Bragging. Minus ten." Steps 100..91 fold flat, he slides
   down to the landing at 90; the gate shuts.
5. 10.2-12.5 Landing 90: he waters a wilted cloud flower with a small gold can while filming himself with a phone:
   "Watering a flower, guys!" The flower blooms; a camera flash; he lifts to 91.
6. 12.5-16.1 Insert of the ledger writing -30; "Posting it? Minus thirty." He is caught; 91..62 fold, the phone and
   can fly off, a long slide down to step 61.
7. 16.1-18.0 Step 61: he puts a gold coin into a glass donation jar ("tink"), lifts to 62.
8. 18.0-22.2 He whispers on a wooden soapbox, trembling: "Anonymous. Totally anonymous." Then he holds a red
   megaphone: "I DONATED! EVERYONE!"
9. 22.2-24.9 The Angel: "Minus sixty." 62..3 fold: soapbox, megaphone and he pitch forward, a long tumble, he lands on
   step 2 at hell's door.
10. 24.9-28.6 The imp opens the hatch: "Come on down!" He: "Fine. I'll walk." He climbs 3, 4, 5, 6 with effort
   ("Hnnngh!"), steps 6..3 fold, he slides back to 2.
11. 28.6-33.6 The Devil in the deck chair: "Hell has 4.9 stars, buddy." He, small: "...Heaven has 3.1." The hatch
   opens wide with orange glow: "Hot tub's warm!" He steps down toward it.
12. 33.6-36.6 At the top the Angel's quill slips and falls all the way down the stairs; it lands standing in the step
   right in front of him. He picks it up and holds it UP toward heaven (does not keep it); the Devil lowers his shades.
13. 36.6-39.2 The Angel: "...Humility." The steps turn gold from the bottom up like an escalator wave; the Devil
   lunges from the chair and grabs air, the chair tips; he rides a glowing plate up the gold stairway (told in 3 cuts).
14. 39.2-42.7 Top: the gate opens, he gives the quill back to the Angel, then turns, smug: "Did you see how humble I
   was?"
15. 42.7-44.3 The Angel, not looking up: "Minus one." Step 100 folds, he glides down to 99, the gate slams: the last
   frame matches the first (the video loops).

## What to report

Look for, with the timestamp of each:
- Glitches: one-frame pops, objects or characters jumping, flicker, things passing through each other (bodies, arms,
  wings, horns, props, steps, railings), floating props, a prop vanishing or appearing without a reason, hands not
  touching what they hold, a camera inside or behind something, a face cut off or hidden for a whole shot, wrong
  scale, a character facing the wrong way.
- Captions: overlapping captions, a caption over a face or eyes, a caption cut off, missing or wrong words, a caption
  staying up too long or too short.
- Logic and continuity: his step number matches his points at each moment (99, 100, 90, 91, 61, 62, 2, 100, 99),
  props are where the story says (suitcase, can, phone, coin, jar, soapbox, megaphone, quill), who is where across
  cuts, anything that contradicts the dialogue, anything a viewer would find confusing.
- Readability: a beat that cannot be understood from the picture.

Do not judge the drawing style, the story itself or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] what is wrong -> the concrete fix`. Most important first.
End with one line: `VERDICT: PASS` (nothing a viewer would notice) or `VERDICT: FIX n` (n items to fix).
