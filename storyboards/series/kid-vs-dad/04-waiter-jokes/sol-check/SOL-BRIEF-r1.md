# Sol check, round 1: "Dad jokes at the waiter" (draft, 57.4 s, vertical 9:16)

You are checking a draft of a short animated comedy sketch for BUGS, GLITCHES and LOGIC ISSUES, and you are also its
EDITOR. You cannot see the video itself: you get its frames. Look at every image in this folder:

- `sheet-3fps-00s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), timestamp burned in top left.
- `strip-10fps-00s.jpg` ... `strip-10fps-50s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.
- `phone.jpg`: one frame a second at the size people watch at (read every caption there).
- `cuts.jpg`: one row per shot cut, 0.2 s either side, the first new frame marked red.
- `contacts-1.jpg`: one row per hand contact (grab, release), a 15 fps strip round it, the contact frame red.

The frames are at story speed. The posted video will be the same cut sped up 1.15x as a whole (voices included);
keep that in mind for the editor notes.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue; some lines are captioned in the top third (white, highlighted words yellow), not every line has a caption
(on purpose). A red news bar "LIVE: WAITER IN DANGER" sits low in the frame most of the video (on purpose).
Characters have no names on screen on purpose. The hook "Danger. A dad is about to order. Will the waiter survive?"
opens one question; the ending answers it.

Cast: TATO = a small golden potato kid in a teal knit sweater with one green leaf on top (the hero, age seven). THE
DAD = a big round potato with a moustache and a leaf tuft, cheerful, much taller than Tato. THE REPORTER = a potato war correspondent in a padded jacket and helmet, at the next
table, hiding behind a tall standing menu with a news microphone (he narrates like a front-line reporter). THE WAITER
= a tall potato in a white shirt, black waistcoat and long white apron, nervous, with a notepad (later with a round tray, later empty
handed). THE COOK = a potato in a chef's hat seen only through the round porthole window of the kitchen door, hands
pressed together praying (shot at ~37 s only). Set: a small daytime restaurant, round tables with cloths, hoop chairs,
a kitchen door at the back left; next to the door a framed photo of the dad with "DO NOT SERVE".
The counter the picture must keep: Tato sinks one level per joke: seated (start) -> chin on the tablecloth after
joke 1 -> only his eyes over the table after joke 2 -> under the table after joke 3. He never rises again.

Story chain (times in this video):
1. 0.0-2.5 HOOK: the reporter behind the menu, whispering into the mic: "Danger. A dad is about to order."
2. 2.5-4.1 Close on him: "Will the waiter survive?"
3. 4.1-7.5 The family table: Tato and the dad. Reporter (voice): "We're live. Tato, age seven, is hungry."
4. 7.5-9.6 Reporter: "And at this table, there is one rule."
5. 9.6-11.2 Wide: "No jokes at the waiter."
6. 11.2-13.6 Tato, hands pressed together: "Dad. Please. Just order."
7. 13.6-16.1 Dad: "Relax. I'm always normal."
8. 16.1-20.5 JOKE 1: the waiter with his notepad: "Hi. Can I take your order?" Dad: "Sure. Where are you taking
   it?" Rimshot (~20 s).
9. 20.5-21.3 The waiter frozen; Tato has slid down, chin on the cloth (level 2).
10. 21.3-24.4 Reporter: "First joke. The waiter is still standing."
11. 24.4-28.3 JOKE 2: the waiter is back with a tray of two water glasses (glasses then stand on the table): "Sorry
   for the wait." Dad pats his belly: "That's okay. I've been working out." Rimshot (~28 s).
12. 28.3-30.0 Tato sinks to eyes-only (level 3): "Dad..."
13. 30.0-32.8 Reporter: "He's sinking. Tato is sinking."
14. 32.8-37.1 The kitchen door swings; reporter: "Wait. What's on that wall?" The photo of the dad: DO NOT SERVE.
   "He's been here before."
15. 37.1-39.5 Through the porthole the cook prays. "Last time... the waiter quit."
16. 39.5-42.1 JOKE 3 setup: the waiter, very careful, notepad like a shield: "And... how would you like your steak?"
17. 42.1-43.4 Tato from low: "Dad, no."
18. 43.4-45.3 Reporter: "He's standing up. He's standing up!"
19. 45.3-49.0 The room goes dark, a spotlight on the standing dad: "Like my jokes." ... "Well done." Rimshot.
20. 49.0-51.8 Lights back with a clang: the tray already lies on the floor at the waiter's feet (it fell in the dark),
   the waiter frozen with empty hands; the reporter ducks: "Man down! Man down!"
21. 51.8-53.3 Under the table (a cheat set): Tato curled up, hands over his face, the dad's legs at the edge.
22. 53.3-55.0 Back in the room, the dad seated again; the waiter has slapped the bill on the table and walks off
   fast toward the kitchen.
23. 55.0-57.4 The bill in the dad's hand reads "TIP: STOP." The dad deflates: "Tip... stop." END (hard cut).

## What to report

A. Glitches and logic (fix list), with the timestamp of each:
- Glitches: one-frame pops, objects or characters jumping, flicker, things passing through each other (bodies,
  arms, apron, tray, glasses, menu, chairs, table cloth, door), floating props, a prop vanishing or appearing without
  a reason, hands not touching what they hold, a camera inside or behind something, a face cut off or hidden for a
  whole shot when that character speaks, wrong scale, a character facing the wrong way.
- Captions: overlapping captions, a caption over a face or eyes, a caption cut off, missing or wrong words, a
  caption staying up too long or too short.
- Logic and continuity: Tato's level (see the counter) at every moment, who holds what (notepad, tray, glasses,
  bill), the dad seated or standing, where people are across cuts, the room dark only during the spotlight,
  anything that contradicts the dialogue, anything a viewer would find confusing.
- Readability: a beat that cannot be understood from the picture.

B. Editor notes (separate list, at most 6): as the editor of a TikTok short, where would you cut tighter, which shot
is too still or too long, which shot could be dropped, which reaction is missing. Keep the story and the lines; say
the exact seconds. These are suggestions; the producer decides.

Do not judge the drawing style, the story itself or the music (you cannot hear it).

Answer as numbered lists, one item per line: `n. [mm:ss.s] what is wrong -> the concrete fix`. Most important first.
Write the whole answer into `SOL-REPORT-r1.md` in this folder.
End list A with one line: `VERDICT: PASS` (nothing a viewer would notice) or `VERDICT: FIX n` (n items in list A).
