# Sol check, round 2 (the last): "Heaven reads your search history" (draft 4, 43.3 s, vertical 9:16)

You are checking a draft of a short animated comedy sketch for BUGS, GLITCHES and LOGIC ISSUES, and, new this time,
you also act as its EDITOR: where to cut, which shots to shorten or drop so it plays faster and more interesting
(fewer still moments, faster cuts). You cannot see the video itself: you get its frames. Look at every image here:

- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), timestamp burned in.
- `strip-10fps-0s.jpg` ... `strip-10fps-40s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.

Timestamps are on the RENDER clock. The posted video plays 1.1x faster (the producer's pick), about 39.4 s.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes). Spoken dialogue, captioned
word by word mostly in the top third (white, highlighted words yellow). No names on screen on purpose. The opening text
"Heaven reads your search history" (first ~3 s) is the label; the ending answers it.

Cast: THE HERO = golden potato, teal knit sweater, one green leaf. HIS BEST FRIEND = small potato in a yellow hoodie,
holding a blue casserole dish with a red heart on the lid in both hands all video, standing right behind the hero.
THE ANGEL = tall potato in a white robe, gold halo, round gold glasses, behind a cloud podium with a gold tablet and
a gold button. THE GUNSLINGER = potato in a cowboy hat and poncho (first 3 s only). A QUEUE of four other potato souls
on the top steps. Set: the top of a white marble stairway in the sky, a pearl gate, a round gold TRAPDOOR in the floor
in front of the podium (souls stand on it), a huge floating screen in a gold frame above the gate with a search bar.
The rule the picture must keep: each search read out opens the trapdoor's glowing crack wider (the counter), the
sweet search makes it draw back, at "Hell." the trapdoor drops open and the soul falls through.

Story chain (render clock, draft 4):
1. 0.0-2.8 The Angel reads the Gunslinger's search: "How to cheat at poker. HELL." and presses the button; the trapdoor
   leaves swing down and he drops below the rim before the cut. Label on screen.
2. 2.8-4.1 Side angle: the hero gulps; behind him his friend lifts the dish happily. "Next." He sets off.
3. 4.1-6.5 The hero steps onto the trapdoor; his friend moves up behind him. Hero: "Wait. Out loud?"
4. 6.5-7.0 Insert: the Angel's finger glances at the tablet's red LAST row (tease).
5. 7.0-11.2 The rule in three shots: the Angel says "At heaven's gate, there's one rule." (7.0), the hero and friend
   hear it (8.4), the giant screen flickers on for "Hide nothing." (9.7).
6. 11.2-14.3 Search 1 typed while read: "Is it normal to talk to my plants." Overhead: queue chuckles, gap CLOSED. "Fine."
7. 14.3-18.1 Search 2: "Why does my best friend never pay me back." Two-shot: the gap opens NARROW. Friend: "...What?"
8. 18.1-22.5 Search 3: "How to pretend I like my best friend's cooking." Overhead: the gap WIDER; then the friend in
   three-quarter, dish lowered, lid tips up (red heart on lid and side): "My casserole?"
9. 22.5-26.8 Search 4: "How to save a baby bird." Overhead: "Awww.", the gap draws back NARROWER. Wide: the gate opens a
   hand's width (25.3); side angle: the hero reaches for the tablet, the Angel pulls it back a handspan (25.9).
10. 26.8-31.4 Search 5: "How to get a new best friend." The gate slams on "best friend" (in that wide). Two-shot: the
    gap WIDEST, friend gasps, lid tips: "A NEW one?" Front: the hero turns to his friend (screen-left), hands up,
    "That's out of context!", hands come down.
11. 31.4-32.0 Low: the gap flares under his toes, he recoils.
12. 32.0-37.0 The Angel at the tablet's end: "Oh. The last one." The hero drops to his knees: "Not the last one."
    Closer (35.5) as he reaches toward the tablet: "Please!"
13. 37.0-41.3 Wide, pushing in: the screen types "how to delete search history" word by word on the spoken words;
    the outline turns red when "history" lands.
14. 41.3-42.1 The friend, eyes shut, one head shake, both gloves on the dish.
15. 42.1-43.3 The Angel: "Hell." finger onto the button; the trapdoor drops the hero; hard cut as he goes below the rim.

## Round 1 and what changed

Your round 1 list (FIX 31) is in `SOL-REPORT-r1.md` with draft 3's times. Every item was acted on except #24 (the pause
before "HELL." sits inside one voice take; cutting it needs a new take, kept as is). The trims took the render from
47.9 s to 43.3 s. Times in round 1 do NOT match draft 4: use the chain above.

## What to report

First: for each round 1 item, is it fixed? Only list the ones that are NOT fixed (number from round 1, what still
shows). Then anything NEW, in the same four groups:

A. Glitches, with the timestamp of each: one-frame pops, objects or characters jumping, flicker, things passing
through each other (bodies, arms, the dish, the podium, the trapdoor rim), floating props, a prop vanishing or
appearing without a reason, hands not touching what they hold, a camera inside or behind something, a face cut off or
hidden for a whole shot, a character facing the wrong way, the screen text wrong or out of step.
B. Captions: overlapping captions, a caption over a face or eyes, cut off, wrong words, up too long or too short.
C. Logic and continuity: the crack width matches the story (0, small, wider, back, widest, open), who stands where
across cuts, the dish always in the friend's hands, anything that contradicts the dialogue or confuses a viewer.
D. EDITOR (only what still plays slow after the round 1 trims): name each shot or moment to cut or shorten, with start-end times and how
many seconds it saves, most valuable first. Aim for a tighter cut with fewer still moments and faster cuts; keep
every line of dialogue and the ending. Say which still shots need motion instead.

Do not judge the drawing style or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] (A|B|C|D) what is wrong -> the concrete fix`. Most
important first. End with one line: `VERDICT: PASS` (nothing a viewer would notice) or `VERDICT: FIX n`.
