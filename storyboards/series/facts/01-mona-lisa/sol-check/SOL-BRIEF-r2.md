# Sol check, ROUND 2: "How did one thief make the Mona Lisa famous?" (draft 2, 81.3 s, vertical 9:16)

You are checking a rough draft of a short animated video for BUGS, GLITCHES and LOGIC ISSUES. You cannot see the
video itself: you get its frames. Look at every image in this folder:

- `sheet-3fps-0s.jpg`, `-20s`, `-40s`, `-60s`, `-80s`: 3 frames per second, 20 s per sheet, timestamp burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-80s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), timestamps
  burned in. Use these for one-frame pops, jumps, things passing through each other, flicker.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. A narrator
(not on screen) tells the true story; his line is the caption (white, word by word, current word yellow) in the top
third. Characters have no names on screen on purpose. The video plays 1.1x faster than it was rendered (on purpose).
No on-screen title (the producer adds the question in the TikTok app).

Cast: THE THIEF = round potato in a white knit sweater (his "smock") and a black flat cap. Guards = navy vest + navy
police cap. The painter (purple sweater, flat cap) who finds the empty wall. The plumber (grey sweater, flat cap). The
police inspector (brown vest, glasses). Picasso (navy sweater). The Florence art dealer (dark suit). Museum visitors
(various outfits), and at the end a modern crowd.

Story chain (times in the video, approximate):
1. 0.0-9.9 THE LOUVRE 1911: visitors walk past the small Mona Lisa on the wall, nobody stops; push in on her. "Nineteen
   eleven. Nobody stops for the Mona Lisa. In two days, the whole world will be hunting for her." Then the thief at the
   painting: "This man put the glass on her. He knows every door in this museum."
2. 9.9-13.8 SUNDAY NIGHT, corridor: a guard walks by, the thief hides in a closet.
3. 13.8-19.8 MONDAY, the Louvre is closed: the thief lifts her off four hooks (the wall keeps four bare hooks) and
   carries her away at his side.
4. 19.8-29.8 STAIRWELL / CORRIDOR: he pulls off the frame (the empty frame lies on the floor), wraps her in his smock.
   The door is locked, the knob is gone; a plumber walks by and opens it for him.
5. 29.8-33.2 STREET: he walks out into Paris carrying her. Nobody notices.
6. 33.2-41.6 TUESDAY morning, gallery: a painter comes to copy her: four empty hooks. Guards: "Being photographed!"
   The guards shrug. Hours later... panic.
7. 41.6-48.1 STREET: the Louvre shuts for a week (a FERMÉ sign, a guard by it); front pages fly across the street with her face; police even
   question Picasso.
8. 48.1-53.9 GALLERY: when it reopens, thousands queue to stare at an empty wall.
9. 53.9-62.7 HIS ROOM: police knock; the inspector asks "Where were you on Monday?"; she's in the trunk one metre
   away; they leave; a tear-off day counter runs "Two years".
10. 62.7-68.9 FLORENCE SHOP: he tries to sell her; the dealer: "Leave it with me." The dealer calls the police.
11. 68.9-72.6 STREET: Italy cheers him; he gets seven months.
12. 72.6-81.3 TODAY, the same gallery: she now hangs in a glass case on a dark blue wall, a packed crowd with phones up in front of her. "Nobody used to stop for her.
    Now, nobody can get close. All because one man carried her out under his smock."

## Round 2: what changed since your round 1 (times shifted by up to 0.7 s)

Your round 1 found 27 items (VERDICT: FIX 27). Fixed since: 1 the frame now comes off and drops at his feet; 2 the
white smock wraps the panel on screen and stays wrapped through door and street; 3 the plumber reaches to the lock and
the door swings open; 4 Florence framed wider, the trunk opens and she rises out of it, the dealer walks off to call;
5 a top-down peek into the trunk shows her; 6 one smooth take off the hooks; 7 closet now in frame; 8 the question shot
holds both men; 11 he stays in frame on the street, a passer-by walks past; 14 a long queue; 16 the shrug framed (two-
shots keep their size now); 18 no wall in the lens; 19 steadier ending cuts; 20 her eyes kept below the captions;
21 no size jump in the last push; 22 "Monday"; 23 the plumber now in grey, no sprout; 24 the guards run apart, an alarm
gesture; 25 the painter reacts and points; 27 a FERMÉ sign for the closure; 13 today's glass case on the blue wall.
KEPT ON PURPOSE by the producer (do NOT report again): 7 (the night in the closet), 9 and 10 (no arrest or jail shot,
"He gets seven months"), 12 (Picasso's place in the order), 15 (the Italy street reuses the Paris street),
17 (no dates on the day counter), 26 ("Nobody used to stop for her"). No props are added for the painter or plumber.

Check each fixed item: is it really fixed in the frames? And is anything NEW wrong?

## What to report

Look for, with the timestamp of each:
- Glitches: one-frame pops, objects or characters jumping, flicker, things passing through each other (bodies, arms,
  caps, props, walls), floating props, a prop vanishing or appearing, hands not touching what they hold, a camera
  inside or behind something, a face cut off or hidden for a whole shot, wrong scale.
- Captions: overlapping captions, a caption over a face or eyes, a caption cut off, missing or wrong words, a caption
  staying up too long or too short.
- Logic and continuity: the painting is where the story says (on the wall / in his hands / under the smock / in the
  trunk / back on the wall today), the hooks and frame make sense, who sees whom, anything that contradicts the narration
  or history (1911 Paris), anything a viewer would find confusing.
- Readability: a beat that cannot be understood from the picture.

Do not judge the drawing style, the story itself or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] what is wrong -> the concrete fix`. Most important first.
End with exactly one last line: `VERDICT: PASS` (nothing that needs fixing) or `VERDICT: FIX <number of items>`.
Write the answer to `SOL-REPORT-r2.md` in this folder. Start with one line per round-1 item you checked: `rN fixed` or `rN NOT fixed: why`.
