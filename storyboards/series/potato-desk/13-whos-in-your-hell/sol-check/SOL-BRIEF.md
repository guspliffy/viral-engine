# Sol check, round 1: "Who's in your hell?" (draft, 43.4 s, vertical 9:16)

You have TWO jobs on this draft of a short animated comedy sketch:
A. find BUGS, GLITCHES and LOGIC ISSUES;
B. act as the EDITOR: say where to cut, which shots are too still or too long and should be shortened or dropped, so
   the video is tighter and keeps moving (the producer's own tests: Codex edits came out shorter and more interesting,
   with faster cuts and fewer still scenes).

You cannot see the video itself: you get its frames. Look at every image in this folder:
- `sheet-3fps-0s.jpg`, `-20s`, `-40s`: 3 frames per second, 20 s per sheet (rows of 4 s), time burned in top left.
- `strip-10fps-0s.jpg` ... `strip-10fps-40s.jpg`: 10 frames per second, 10 s per strip (rows of 1 s), time burned
  in. Use these for one-frame pops, jumps, things passing through each other, flicker.

## The video

Engine: Three.js toon render of round potato characters (no necks, short arms, big eyes), cartoon world. Spoken
dialogue (voices already 1.2x fast), each line captioned word by word in the top third (white, key words yellow).
No names on screen on purpose. The white label "Hell = forever with people who annoy you" over the first 3 s is the
hook text (added on purpose). Ends on the punchline (no tag, on purpose).

Cast: HE = the hero, a golden potato with a green sprout in a TEAL KNIT SWEATER; holds a RED CLICK PEN (silver end
up) in his right hand all video, in his left hand in the last shot (his nervous habit: he clicks it). THE DEVIL = red potato with small horns and a teal
shirt; holds a brown CLIPBOARD from 31 s. THE CHEWER = small potato in a YELLOW hoodie with a giant red-white POPCORN
BUCKET in both hands. THE REPLY-ALL GUY = potato in a red-brown hoodie, always on his PHONE. THE WIZARD = potato with
a big purple hat and a staff, standing on a step BEHIND the couch, leaning over its back; a glowing CRYSTAL BALL rests
on the couch's back roll. THE FRIEND = a tall potato in a grey hoodie (the hero's own friend) at the very end.
Set: hell's waiting room: dark walls, a gold rail, a red runner on the floor, a long red velvet couch for four with a
glowing gold STAR on the 4th seat (the empty "worst one" seat), a black hell door with a red frame and a hot orange
glow behind it, a round clock without hands above.

Story chain (times in this draft; shot names in brackets):
1. 0.0-1.3 [wide] The hero sits alone on the couch; the Devil, arms wide: "Welcome to HELL." He clicks his pen.
2. 1.3-2.4 [hero close] "Who's in my hell?"
3. 2.4-5.5 [Devil low] "One rule. Forever... with everyone who ever annoyed you."
4. 5.5-8.9 [wide, then hero + star seat] Devil points at the seats: "Two seats left. And this one..." The star glows:
   "...is for the worst one." He gulps.
5. 8.9-10.5 [door diagonal] The door bangs open; the chewer walks in with the bucket, crunching.
6. 10.5-14.6 [two-shot] The chewer sits pressed against him, crunches, crumbs land on his shoulder and the floor.
   He: "Could you chew... quieter?" Chewer: "Nope." CRUNCH.
7. 14.6-18.4 [three low] The door bangs again (off screen); the reply-all guy walks past in front of the couch staring
   at his phone and squeezes in on the hero's other side: "Reply all."
8. 18.4-23.7 [hero close] The hero's own phone pings three times (three bubbles): "Thanks. Thanks. THANKS!"
   He: "I'm DEAD. Why do I still have a phone?" Devil off screen: "Hell."
9. 23.7-29.4 [Wizard lean, hero close, Wizard] A wizard appears (purple puff) leaning over the couch's back:
   "He dies at the end." "Who?" "Everyone. In every movie you haven't seen."
10. 29.4-30.9 [high wide] All three at once: "I'm ALREADY dead!" (camera shake).
11. 30.9-33.1 [Devil + door] The Devil reads his clipboard: "And the worst one..." The door rattles, glows, two
   feet shadows under it.
12. 33.1-35.9 [all four on the couch] The hero clicks his pen three times in fear; at each click the other three
   flinch away. "Please be another chewer."
13. 35.9-38.3 [Devil] He frowns and flips the page on the clipboard: "Hm. Wrong page."
14. 38.3-41.2 [wide verdict] Hero: "I'm free?" Devil points at him: "You're HIS hell." Thumb back at the door; the
   door opens softly.
15. 41.2-43.4 [hero standing, door behind] The hero has stood up; his friend appears in the doorway, waves: "Hey,
   buddy!" The hero smiles and clicks the pen once. The friend: "NOT THE PEN!" Cut.

## What to report

A. Glitches, with the timestamp of each: one-frame pops, objects or characters jumping, flicker, things passing
through each other (bodies, arms, props, the couch, the door), floating props, a prop vanishing or appearing without a
reason, hands not touching what they hold, a face cut off or hidden for a whole shot, a character facing the wrong
way. Captions: overlapping, over eyes, cut off, wrong words, up too long or short. Logic and continuity: who sits
where across cuts, the pen in his hand, the bucket and phones, the star seat staying empty, anything confusing.

B. Edit: name every cut you would make as `trim [mm:ss.s-mm:ss.s]` (a span to remove or shorten, with why), and
every still shot that needs motion or a faster cut. Keep every spoken line (they are the story); trims go between and
around lines, in walks, holds and reactions. Say the new length you expect.

Do not judge the drawing style, the story itself or the music (you cannot hear it).

Answer as a numbered list, one item per line: `n. [mm:ss.s] what is wrong -> the concrete fix`, glitches first (most
important first), then the edit items. End with one line: `VERDICT: PASS` (nothing a viewer would notice, no edit
needed) or `VERDICT: FIX n` (n items).
