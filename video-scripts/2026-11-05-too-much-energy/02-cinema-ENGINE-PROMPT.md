# Too Much Energy, episode 2: the cinema — Viral Engine prompt (5 Nov 2026)

Jonny picked this on 5 Nov as one of seven episodes of the "That one friend with too much energy" series. Read 00-SERIES-FORMAT.md in this folder first: Phoenix's energy meter, THE GRIN (7.30–8.50), the "ting" logo and the posting pattern come from there. Too Much Energy (clip 23) is the pilot.

It applies the reach playbook (reach-playbook-2026-11-04.md) and Jonny's lab picks: a gibberish yelp in the first half second (subtitled), stronger force with 3-frame hit-stops, stronger faces with longer holds. The whole frame stays sharp: no depth of field.

---

Create an **exactly 10-second, 9:16 Potato Brawl animated comedy**, 1080 × 1920 at 30 fps.

**Core joke:** A dark cinema, a scary film, everyone silent. Phoenix reacts louder than the film: he screams at the jump scare, stands on his seat shouting advice at the screen, and his glowing wings light up the whole room. When the hero wins he jumps to cheer, lands on his flipped-up seat, and it catapults his giant popcorn bucket over the row behind him. He grins. The whole row sits covered in popcorn, the Astronaut wearing the bucket, while Reaper calmly eats one piece off his own hood. Then the credits roll, and Phoenix wants to watch it again.

**Why it should travel:**
- **Share hook:** everyone has sat next to (or been) the person who talks through the whole film.
- **Comment trigger (pick a side):** "Where would you sit: next to him or as far away as possible?" This replaces the series question.
- **Running joke:** the meter and the grin, and the "AGAIN!" from the pilot's repost ending.
- **Plain search words:** "movies" in the title and caption line 1 (what US viewers search; the caption matches the title), "#cinema" as the tag (Europe).

## Cast

Phoenix, two tired friends and two strangers.

- **Phoenix** (too much energy): front row centre, a popcorn bucket as big as his body on his lap.
- **Reaper** (the tired one): the seat to Phoenix's left (frame left), hood up, perfectly still, eyes on the screen.
- **Wizard** (tries to calm him): the seat to Phoenix's right (frame right), hat off and on his lap so he doesn't block anyone. No staff in this episode.
- **Astronaut and Dragon** (guests, strangers in the row behind): the tiered row is one step higher, so their faces show above the front row's heads. The Dragon holds a giant soda; the Astronaut has a small popcorn of his own.

Preserve all approved character designs from the reference sheet. Clean cinematic anime linework, controlled cel shadows, crisp faces and restrained highlights.

## Environment (one painted set)

Try a **layered painted environment** first (new env `cinema-rows`, about 3 minutes). If the coverage check or the look fails indoors, fall back to a painted plate plus 3D seat geometry. Either way most of what we see is the seats, so the seats are real geometry.

- **The camera is where the screen is:** we look back at the audience, so **the film is never shown**, only its light on the faces (no real film, no copyright problem, and the faces stay readable).
- **Far:** the dark tiers rising up into the back of the hall, a projector window glowing at the top, a few empty seats with a soft red glow on their edges, aisle step lights.
- **Mid and near:** two rows of red velvet cinema seats with **flip-up seats** and cup holders; Phoenix's row in front, the strangers' row one step up behind.
- **Real geometry:** the seats, the armrests, the cup holders, the popcorn bucket, the soda, every piece of popcorn (many small pieces that fall and settle), Wizard's hat.
- **Light:** the screen's flickering cool blue-white on every face (it changes with the film: a white flash on the jump scare, a warm gold flash when the hero wins), the rest dark. Phoenix's meter adds warm orange light on his neighbours that grows with each step, so the room gets brighter the more hyped he is. Keep the faces readable at all times; dark room, not dark faces. All sharp.

## Camera and look

- One wide from the front (the screen side), slightly below the front row's eye level, the five faces in two tiers. Phoenix owns the centre of the front row; nobody leans in front of him.
- THE GRIN uses the series framing with the popcorn-covered row behind him.
- **Hit-stops:** (1) his scream at the jump scare at 1.90, (2) the seat catapulting at 6.10.
- **Space for the title:** the top 20% clear from 0 to 2 s. Don't burn in a title.

## Sound

- **Music:** the film's own soundtrack is the bed: a tense low string drone with a heartbeat drum, about 92 bpm in E minor, `lowCut` around 150 Hz, which turns into a triumphant brass swell when the hero wins (5.4) and cuts out on the catapult. The room is dry and big.
- **Effects:** popcorn crunching, popcorn spraying and pattering down (new sound: popcorn patter), the film's jump-scare hit (one big orchestral stab layered with `slap`), his feet on the seat, the flip-up seat clacking up and slamming down (new sound: a wooden seat clack), a soda slurp, a soft `ai/flare` on each meter step, the "ting" at 7.80, Reaper's one crunch (`ai/crunch`), the credits music starting (a soft piano note) at 9.20.
- **Voices (all subtitled):** Phoenix's yelp at 0.05, "Ooh! OOH! OOOH!" (lower third). His scream at 1.90: "AAAAH!". The Astronaut at 2.6: "Shh!". Phoenix at 3.6, standing: "DON'T open the door!". Wizard at 4.4, pulling his wing: "Sit DOWN!". Phoenix at 9.40: "AGAIN!". Reaper silent.

## Exact seven-beat timing

1. **0.00–1.50 — ALREADY TOO MUCH.** Wide. Frame 0: the screen light flickers on five faces. Four of them are frozen and wide-eyed. Phoenix bounces in his seat with the huge bucket, stuffing popcorn, wings fluttering, whispering "Ooh! OOH!" with every bounce. Popcorn hops out of the bucket with each bounce. Meter small, already lighting Reaper's cheek.

2. **1.50–3.30 — THE SCREAM.** A white flash from the screen (the jump scare). Everyone flinches a little; Phoenix screams louder than the film and jumps (hit-stop at 1.90), and a fountain of popcorn sprays up out of the bucket and rains on the row behind. Meter up one size. The Dragon and the Astronaut glare down at him with popcorn on their heads; the Astronaut shushes. Phoenix turns round, beams at them and offers them the bucket.

3. **3.30–5.30 — THE ADVICE.** He stands up on his seat to shout at the screen; **his seat flips up behind him** (clack). He flares his wings to full span: meter up one size, and his glow lights the dark hall like a lamp. The strangers shield their eyes. Reaper pulls his hood down over his eyes. Wizard grabs a wing tip and tugs to sit him down; Phoenix doesn't notice.

4. **5.30–7.30 — THE BREAK.** A warm gold flash and the brass swell: the hero wins. Phoenix jumps up to cheer (meter at its biggest) and lands with both feet on the front edge of the flipped-up seat. It slams down like a catapult (hit-stop at 6.10) and flings the bucket up out of his hands. The bucket turns over in the air above the row behind and empties: a slow rain of popcorn over both strangers, and the bucket lands upside down over the Astronaut's helmet. The music cuts out.

5. **7.30–8.50 — THE GRIN.** The series block: medium close on Phoenix in his seat, popcorn stuck in his crest, the popcorn-covered row behind him. Head turn, grin and pose, "ting" at 7.80, hold until 8.50.

6. **8.50–9.40 — THE ROW.** Back to the wide. The Astronaut lifts the bucket off his helmet; the Dragon glares with popcorn on both horns; Wizard has his face in his hands. Reaper, who hasn't moved all clip, lifts one piece of popcorn off his own hood and eats it, eyes on the screen (crunch). The screen light turns soft: the credits start (9.20).

7. **9.40–10.00 — AGAIN.** Phoenix, beaming, already bouncing: "AGAIN!". Four heads drop at once. **Hard cut at exactly 10.00.**

## Continuity and contact rules

- One bucket: on his lap, then in the air, then on the Astronaut's helmet (it sits on the helmet, never through it).
- The popcorn that lands stays where it lands for the rest of the clip; nothing magically disappears.
- Phoenix's feet stand on the seat with no slide until the catapult. The seat hinge is visible, so the flip has a cause.
- Wizard's glove holds the wing tip without passing through it, and lets go when Phoenix jumps.
- Phoenix's light glows on faces but never touches anyone. Nobody is hurt; the bucket is light cardboard.

## Posting card (for Jonny)

| | |
|---|---|
| In-app text title | **That one friend with too much energy at the movies** |
| Caption | That one friend with too much energy at the movies 🍿 Tag the friend who's like this. Where would you sit: next to him or as far away as possible? |
| Hashtags | #funnyanimation #animation #cinema |
| Cover frame | THE GRIN at 8.2 s: Phoenix with popcorn in his crest, the covered row and the Astronaut's bucket helmet behind him |

## Checks before posting (playbook section 2)

- The title states the situation in plain English in the first second, using search words.
- Full faces, a wide shot and motion from frame 0. No extra cut in the first 1.5 s.
- It works muted: the screen light, the scream, the glowing wings, the popcorn rain and the grin tell the story without sound.
- The payoff ("AGAIN!" and the dropping heads) is the last frame. No "done" pose.
- Music is in the clip (the film's soundtrack).
- The comment trigger is in the story.
