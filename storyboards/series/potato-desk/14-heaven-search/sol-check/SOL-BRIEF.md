# Sol check, round 1: "Heaven reads your search history" (draft, 47.9 s, vertical 9:16)

You are checking a draft of a short animated comedy sketch for BUGS, GLITCHES and LOGIC ISSUES, and, new this time,
you also act as its EDITOR: where to cut, which shots to shorten or drop so it plays faster and more interesting
(fewer still moments, faster cuts). You cannot see the video itself: you get its frames. Look at every image here:

- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), timestamp burned in.
- `strip-10fps-0s.jpg` ... `strip-10fps-40s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.

Timestamps are on the RENDER clock. The posted video plays 1.1x faster (the producer's pick), about 43.6 s.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes). Spoken dialogue, captioned
word by word in the top third (white, highlighted words yellow). No names on screen on purpose. The opening text
"Heaven reads your search history" (first ~3 s) is the label; the ending answers it.

Cast: THE HERO = golden potato, teal knit sweater, one green leaf. HIS BEST FRIEND = small potato in a yellow hoodie,
holding a blue casserole dish with a red heart on the lid in both hands all video, standing right behind the hero.
THE ANGEL = tall potato in a white robe, gold halo, round gold glasses, behind a cloud podium with a gold tablet and
a gold button. THE GUNSLINGER = potato in a cowboy hat and poncho (first 3 s only). A QUEUE of four other potato souls
on the top steps. Set: the top of a white marble stairway in the sky, a pearl gate, a round gold TRAPDOOR in the floor
in front of the podium (souls stand on it), a huge floating screen in a gold frame above the gate with a search bar.
The rule the picture must keep: each search read out opens the trapdoor's glowing crack wider (the counter), the
sweet search makes it draw back, at "Hell." the trapdoor drops open and the soul falls through.

Story chain (render clock):
1. 0.0-2.8 The Angel reads the Gunslinger's search: "How to cheat at poker. HELL." and presses the button; the trapdoor
   drops him. Label on screen.
2. 2.8-4.1 The hero, next in line, gulps; behind him his friend lifts the dish happily. "Next."
3. 4.1-6.9 The hero steps onto the trapdoor; his friend moves up behind him. Hero: "Wait. Out loud?"
4. 6.9-7.7 Insert: the Angel's finger glances at the tablet's red LAST row (tease).
5. 7.7-11.9 Low wide: "At heaven's gate, there's one rule. Hide nothing." The giant screen flickers on.
6. 11.9-14.9 Search 1 typed on the screen while read: "Is it normal to talk to my plants." Queue chuckles. "Fine."
7. 14.9-19.2 Search 2: "Why does my best friend never pay me back." Crack opens a little. The friend: "...What?"
8. 19.2-23.5 Search 3: "How to pretend I like my best friend's cooking." Crack wider. Friend lowers the dish, lid
   tilts: "My casserole?"
9. 23.5-28.6 Search 4: "How to save a baby bird." Queue: "Awww." The crack draws back, the gate opens a hand's width;
   the hero sidesteps toward the podium and reaches for the tablet; the Angel slides it out of reach.
10. 28.6-33.1 Search 5: "How to get a new best friend." The gate slams, the friend gasps, dish tips: "A NEW one?"
    Hero spins round, hands up: "That's out of context!"
11. 33.1-34.7 Low: the crack is a glowing band under his toes.
12. 34.7-40.1 The Angel at the tablet's end: "Oh. The last one." The hero on his knees: "Not the last one. Please!"
13. 40.1-44.3 Wide: the screen types "how to delete search history", one word per spoken word; the outline turns red.
14. 44.3-46.1 The friend alone, eyes shut, slow head shake.
15. 46.1-47.9 The Angel: "Hell." presses the button; the trapdoor drops the hero; hard cut.

## What to report

A. Glitches, with the timestamp of each: one-frame pops, objects or characters jumping, flicker, things passing
through each other (bodies, arms, the dish, the podium, the trapdoor rim), floating props, a prop vanishing or
appearing without a reason, hands not touching what they hold, a camera inside or behind something, a face cut off or
hidden for a whole shot, a character facing the wrong way, the screen text wrong or out of step.
B. Captions: overlapping captions, a caption over a face or eyes, cut off, wrong words, up too long or too short.
C. Logic and continuity: the crack width matches the story (0, small, wider, back, widest, open), who stands where
across cuts, the dish always in the friend's hands, anything that contradicts the dialogue or confuses a viewer.
D. EDITOR (the producer asked for this): name each shot or moment to cut or shorten, with start-end times and how
many seconds it saves, most valuable first. Aim for a tighter cut with fewer still moments and faster cuts; keep
every line of dialogue and the ending. Say which still shots need motion instead.

Do not judge the drawing style or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] (A|B|C|D) what is wrong -> the concrete fix`. Most
important first. End with one line: `VERDICT: PASS` (nothing a viewer would notice) or `VERDICT: FIX n`.
