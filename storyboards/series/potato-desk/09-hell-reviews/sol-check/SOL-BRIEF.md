# Sol check, round 1: "Hell has better reviews than heaven" (rough draft, 58.5 s, vertical 9:16)

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
1. 0.0-10.7 SET A: "Heaven or hell?" - "Hell. Five stars!" - "You're sure?" - "Look at the reviews!" - "Funny.
   Everyone picks hell." The clerk stamps; the hell door glows and bursts open, the Devil pops out: "Welcome to
   five-star hell!"
2. 10.7-12.1 LOBBY: the perk board, all five perks unticked.
3. 12.1-15.8 HOT TUB: it is a tub of lava. "That's lava!" - "It's hot. It's a tub." A red X slams on HOT TUB.
4. 15.8-18.9 BUFFET: every plate is fries (his own kind). "Those are potatoes!" He backs away. The Devil offers a
   ketchup bottle: "Ketchup?" X on BUFFET.
5. 18.9-22.7 MASSAGE: on a mat, the tiny imp pokes his back with a pitchfork, he hops at each poke. "Ow! Ow!" -
   "Deep tissue." X on MASSAGE.
6. 22.7-26.3 PARTY: one balloon, one speaker playing the same three notes on a loop; a two-person conga around the
   lobby he can't leave. "It's the same song!" - "Forever!" X on PARTY.
7. 26.3-31.3 VIEW: the Devil snaps his fingers, the curtain opens: the window shows heaven's party on a cloud island
   far above. "Nice view, right?" The customer walks to the glass; outside shot of his sad face on the glass; back in:
   "Five stars?! This is the worst!" X on VIEW: all five crossed out.
8. 33.7-36.9 EXIT: he marches to the EXIT; the Devil steps into his way holding a tablet "RATE YOUR STAY":
   "Before you go... rate your stay!"
9. 36.9-40.2 He taps the tablet: "One star." Insert: the hell badge on the terrace flickers (4.9 trembles). The Devil
   panics: "W-wait! One?!"
10. 40.2-48.2 THE FIXES, each with a finger snap and a puff: the tub becomes a real bubble bath ("Hot tub! A real
   one!"), the fries become a cake buffet and the imp gives a gentle massage ("Two stars." - "Two?!"), then party
   lights, a balloon cluster and a sunset beach in the window ("Hmm. Three."). The X's peel off the board one by one.
11. 48.2-50.8 He lounges in the bubble bath, the Devil fans him with a palm leaf, sweating; a small tablet on the
   tub rim lights a fourth star: "Four stars."
12. 50.8-52.5 Close-up: the Devil hugs the tablet (4 stars lit, 1 grey) and sobs: "Four..."
13. 52.5-56.6 TAG, SET A: the clerk: "Heaven or hell?" The NEXT customer (bigger potato) grins and points: "Hell.
   One star."
14. 56.6-58.5 Insert: the hell door opens a crack; the Devil's teary face in the gap: "Nooo."

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
Write the answer to `SOL-REPORT.md` in this folder.
