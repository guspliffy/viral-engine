# Sol check, round 3 (the last): "Hell has better reviews than heaven" (fixed draft, 58.3 s, vertical 9:16)

Round 1 found 15 items, round 2 found 10 (`SOL-REPORT-r1.md`, `SOL-REPORT-r2.md` in this folder). All were worked on;
see "What changed since round 2" at the end. Check the whole video again from scratch, not only those spots. Report
only what a viewer would notice or what breaks the story; this is the last round before the final render.

You are checking a rough draft of a short animated comedy sketch for BUGS, GLITCHES and LOGIC ISSUES. You cannot see
the video itself: you get its frames. Look at every image in this folder:

- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), timestamp burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-50s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue, each line captioned word by word in the top third (white, current word yellow). Characters have no names on
screen on purpose. The video plays 1.07x faster than it was rendered (on purpose). No on-screen title (the producer
adds "Hell has better reviews than heaven." in the TikTok app).

Cast: THE CLERK = a potato in a dark hooded cloak (the Grim Reaper) behind a small wooden counter, holding a rubber
stamp. THE CUSTOMER = a small yellow potato with a sprout, yellow hoodie. THE DEVIL = a bigger red potato with two
small horns, a teal resort shirt with a name badge, a thin tail; vain, a pushy smiling host. A TINY RED IMP (small
devil helper). THE NEXT CUSTOMER = a bigger potato at the end. Sets: A = a cloud terrace with two doors side by side,
HEAVEN (white, rating badge 3.1 stars, 212 reviews) and HELL (dark red door, badge 4.9 stars, 6,665 reviews), the clerk's
counter between. B = the hell resort lobby: a perk board "HELL RESORT: HOT TUB / BUFFET / MASSAGE / PARTY / VIEW", a
green EXIT door, a curtained window, a tub, a buffet table, a speaker, a balloon.

Story chain (times in this video):
1. 0.0-10.4 SET A: "Heaven or hell?" - "Hell. Five stars!" - "You're sure?" - "Look at the reviews!" - "Funny.
   Everyone picks hell." The clerk stamps; the hell door glows and bursts open, the Devil pops out: "Welcome to
   five-star hell!"
2. 10.4-11.8 LOBBY: the perk board, all five perks unticked.
3. 11.8-15.5 HOT TUB: it is a tub of lava. "That's lava!" - "It's hot. It's a tub." A red X slams on HOT TUB.
4. 15.5-18.6 BUFFET: every plate is fries (his own kind). "Those are potatoes!" He backs away. The Devil offers a
   ketchup bottle: "Ketchup?" X on BUFFET.
5. 18.6-22.4 MASSAGE: on a mat, the tiny imp pokes his back with a pitchfork, he hops at each poke. "Ow! Ow!" -
   "Deep tissue." X on MASSAGE.
6. 22.4-26.0 PARTY: one balloon, one speaker playing the same three notes on a loop; a two-person conga coming
   down the carpet toward us in one shared bouncing step, the customer in front, the Devil behind him with his arms
   up, herding him on. "It's the same song!" - "Forever!" X on PARTY.
7. 26.0-31.0 VIEW: the Devil snaps his fingers, the curtain opens: the window shows heaven's party on a cloud island
   far above. "Nice view, right?" The customer walks to the glass; outside shot of his sad face on the glass; back in:
   "Five stars?! This is the worst!" X on VIEW: all five crossed out.
8. 31.0-36.6 EXIT (from 33.4): he marches to the EXIT; the Devil steps into his way holding a tablet "RATE YOUR STAY":
   "Before you go... rate your stay!"
9. 36.6-39.9 He taps the first star: "One star." Insert: the hell badge on the terrace flickers (4.9 trembles). The
   Devil panics: "W-wait! One?!" and the tablet slips out of his hands and clatters to the floor.
10. 39.9-47.9 THE FIXES, each with a finger snap and a puff: the tub becomes a real bubble bath ("Hot tub! A real
   one!"), the fries become a cake buffet and the imp gives a gentle massage ("Two stars." - "Two?!"), then party
   lights, a balloon cluster and a sunset beach in the window ("Hmm. Three."). The X's peel off the board one by one.
11. 47.9-50.7 He lounges in the bubble bath, the Devil fans him with a palm leaf, sweating; a small tablet stands on
   the tub rim at his side, its screen turned between him and us; he reaches round, taps it and it lights a fourth star: "Four stars."
12. 50.7-52.3 Close-up: the Devil, empty-handed, arms hanging, sobs: "Four..."
13. 52.3-56.4 TAG, SET A: the clerk: "Heaven or hell?" The NEXT customer (bigger potato) grins and points: "Hell.
   One star."
14. 56.4-58.3 Insert: the hell rating badge on top; below it the hell door swings half open; the Devil's teary face
   in the gap: "Nooo."

## What to report

Look for, with the timestamp of each:
- Glitches: one-frame pops, objects or characters jumping, flicker, things passing through each other (bodies, arms,
  horns, tail, props, furniture, walls), floating props, a prop vanishing or appearing without its snap and puff,
  hands not touching what they hold, a camera inside or behind something, a face cut off or hidden for a whole shot,
  wrong scale, a character turning to face the wrong way.
- Captions: overlapping captions, a caption over a face or eyes, a caption cut off, missing or wrong words, a caption
  staying up too long or too short.
- Logic and continuity: the board's X's and the stars match the story at each moment, props are where the story says
  (tablet, ketchup, pitchfork, palm leaf), who is where across cuts, anything that contradicts the dialogue, anything a
  viewer would find confusing.
- Readability: a beat that cannot be understood from the picture.

Do not judge the drawing style, the story itself or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] what is wrong -> the concrete fix`. Most important first.
End with exactly one last line: `VERDICT: PASS` (nothing that needs fixing) or `VERDICT: FIX <number of items>`.
Write the answer to `SOL-REPORT-r3.md` in this folder.

## What changed since round 2 (times in this video)

1. One star: his fingertip now lands on the first star, and it lights on that touch.
2. Four stars: the rim tablet stands at his side with its screen turned toward him and us; his hand reaches it from
   the front.
3. Massage pokes: he stands in profile with his back to the imp; the whole pitchfork jabs in and pulls back each time,
   and he hops on each contact.
4. Final insert: the door opens only half way, the badge sits whole on top, his face is in the gap below it.
5. Captions: the lobby cameras moved so the captions sit on the wall above or below the board, not on it.
6. Heaven's island: the three dancers are bigger and darker.
7. Party fix: coloured light pools come up on the wall and floor and a pink wash on the two of them, with the puff.
8. The stride before the cut to the tub fix is gone; the dropped tablet now lands flat in front of him.
9. Conga: it comes down the carpet toward us in one shared bouncing step.
10. Tub close-up: he sits in the middle of the foam, with foam all round him.
