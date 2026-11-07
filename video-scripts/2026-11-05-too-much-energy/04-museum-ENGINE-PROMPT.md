# Too Much Energy, episode 4: the museum — Viral Engine prompt (5 Nov 2026)

Jonny picked this on 5 Nov as one of seven episodes of the "That one friend with too much energy" series. Read 00-SERIES-FORMAT.md in this folder first: Phoenix's energy meter, THE GRIN (7.30–8.50), the "ting" logo and the posting pattern come from there. Too Much Energy (clip 23) is the pilot.

It applies the reach playbook (reach-playbook-2026-11-04.md) and Jonny's lab picks: a gibberish yelp in the first half second (subtitled), stronger force with 3-frame hit-stops, stronger faces with longer holds. The whole frame stays sharp: no depth of field.

---

Create an **exactly 10-second, 9:16 Potato Brawl animated comedy**, 1080 × 1920 at 30 fps.

**Core joke:** A hushed museum hall with a marble statue of the Norse god, one arm raised in a heroic wave, behind a velvet rope and a "do not touch" sign. Phoenix copies its pose, ducks under the rope, and gives the statue a high five. A crack. He wants another one, and the marble arm snaps off in his hand. He grins with the arm under his own arm. Then he quickly sticks it back on, the wrong way: now the statue's finger points straight at him, and the guard, Wizard and Reaper follow it.

**Why it should travel:**
- **Share hook:** everyone has the friend who has to touch everything in a museum.
- **Comment trigger (pick a side):** "What do you do now: run or confess?" This replaces the series question.
- **Running joke:** the meter and the grin; the Norse god appears as his own statue (a cast in-joke that can return).
- **Plain search word:** "museum".

## Jonny's storyboard (wins over this brief)

Jonny's eight panels (5 Nov): `storyboards/04-museum/storyboard-eight-panels.png` in the project folder copy of this series (video-scripts/2026-11-05-too-much-energy/; the image prompts sit next to it). **The panels set the place, the camera side, who stands where, the eyelines, the light and the detail level; match them frame by frame and run `qa/panels.mjs` before any full render.** The text below still sets the mechanics the drawings simplify (prop counts, grips, contact, timing), as the pack's own review notes say. Where the panels differ from the text, use these notes:

- **Place and camera:** a grand hall with a glass dome, columns and red banners; the Norse god statue stands **centre-back, its right arm raised (on the frame's left)**, the raven on its right shoulder, no helmet (bare head and braids). Brass posts and red rope run along the front of the plinth.
- **The guard stands with the group, not in the doorway:** the Samurai in a dark uniform with a blue sash, beside Wizard and Reaper. He blows his whistle at 02 and points at Phoenix at 08.
- **01:** Phoenix front-left in his "It's ME!" pose; Reaper, Wizard (with headphones and an audio-guide player) and the guard behind him.
- **02:** Phoenix slides on his back under the rope; Wizard grabs at him.
- **03:** high five, drawn from the side; the three others watch at the bottom of the frame, low, so they never cover his hand.
- **04–05:** Phoenix hugs the broken marble arm, a stump on the statue's shoulder.
- **07:** the arm is back on, its finger pointing down at Phoenix; everyone looks at it.
- **08:** Phoenix points at Reaper, who stands big in the right foreground with a flat stare. That's a closer framing; cut to it from the same side, 0.4 s or more.

## Cast

Phoenix, two calm friends and a guard.

- **Phoenix** (too much energy): in the front of frame, between the camera and the plinth, always on his toes.
- **Wizard** (the one who reads every sign): on the left, holding a museum audio guide to the side of his head, nodding along. No staff (it's in the cloakroom).
- **Reaper** (the tired one): on the right, hands folded inside his sleeves, looking at a framed landscape painting on the side wall. No scythe.
- **Samurai** (guest, the guard): on a stool by the doorway in the back, in a guard's cap, half asleep, a whistle on a cord round his neck. No sword.
- **The statue:** the Norse god (Allfather) carved in white marble, slightly bigger than life on a low plinth: beard, helmet, cape folds, and his right arm raised high with an open hand in a heroic wave. The raven on his shoulder is marble too. It is our own design, not a copy of any real statue.

Preserve all approved character designs from the reference sheet. Clean cinematic anime linework, controlled cel shadows, crisp faces and restrained highlights.

## Environment (one painted set)

Try a **layered painted environment** first (new env `museum-sculpture-hall`, about 3 minutes). If the coverage check or the look fails indoors, fall back to a painted plate plus 3D geometry.

- **Far:** a grand hall with a glass skylight, soft daylight falling in, columns, a doorway arch with the guard's stool, more marble pieces on plinths in the distance (vases and busts, none of them real artworks).
- **Mid:** the statue on its plinth, centre-right, ringed by **brass posts and a red velvet rope**. A small sign on a stand in front shows a pictogram: a glove crossed out (no words, so it reads in every language).
- **Near:** the polished stone floor with soft reflections; a bench at the left edge.
- **Real geometry:** the floor, the plinth, the statue (with its raised arm as a separate piece that can break at the shoulder), the brass posts and rope, the sign, the bench, the guard's stool, the audio guide, the painting frame.
- **Light:** cool, soft skylight from above, warm accent light on the statue. Phoenix's meter adds a warm glow that shows on the white marble. Dust motes in the skylight beam. All sharp.

## Camera and look

- One wide from the front, slightly low: the statue's raised arm reads against the bright skylight, Phoenix in the front, Wizard left, Reaper right, the guard small in the doorway behind. Nobody stands between the camera and Phoenix.
- THE GRIN uses the series framing with the one-armed statue behind him.
- **Hit-stops:** (1) the first high five at 4.60, (2) the arm snapping off at 6.30.
- **Space for the title:** the top 20% clear from 0 to 2 s. The statue's raised hand sits below that band. Don't burn in a title.

## Sound

- **Music:** a light baroque harpsichord minuet, about 112 bpm in A major, `lowCut` around 150 Hz; it gets faster with each meter step and stops dead at the snap.
- **Effects:** footsteps echoing in a stone hall (the room reverb is a hall), his hops on stone, the brass posts wobbling and clanking (new sound: a light metal post clank), the guard's whistle (`whistle`, short), the high-five slap (`slap`), the marble cracking (`ai/screen-crack`), the arm snapping off (`crumble`, short), a soft `ai/flare` on each meter step, the "ting" at 7.80, the stone-on-stone grind when he jams the arm back (`creak`).
- **Voices (all subtitled):** Phoenix's yelp at 0.05, "Look! It's ME!" (lower third). Wizard at 2.5, grabbing his wing: "Don't touch!". Phoenix at 4.40: "High five!". At 9.40 Phoenix, pointing at Reaper: "He did it!". Reaper silent.

## Exact seven-beat timing

1. **0.00–1.50 — ALREADY TOO MUCH.** Wide. Frame 0: Phoenix hops round in front of the rope copying the statue's heroic pose, one hop per pose, arm up, chest out, yelling "Look! It's ME!". Meter small. Wizard listens to his audio guide; Reaper studies the painting; the guard dozes. The sign and the rope are in plain view.

2. **1.50–3.30 — UNDER THE ROPE.** Phoenix limbos under the velvet rope; the brass posts wobble and clank. Meter up one size. The guard's eyes snap open and he blows his whistle. Wizard grabs Phoenix's wing tip, "Don't touch!", and points at the sign. Phoenix slips free and gives Wizard a thumbs-up, as if Wizard had cheered him on.

3. **3.30–5.30 — THE HIGH FIVE.** Phoenix jumps onto the plinth's step, stretches up and high-fives the statue's open hand (slap, hit-stop at 4.60). A thin crack runs round the statue's shoulder (crackle). Everyone freezes: Wizard's audio guide drops to his chest on its cord, Reaper's head turns slowly, the guard half stands. Meter up one size.

4. **5.30–7.30 — THE BREAK.** Phoenix, delighted, wants another. He jumps higher, slaps the hand again, and the marble arm snaps off at the crack (hit-stop at 6.30), a puff of marble dust, and stays in his glove. It's heavy: he wobbles, hugs it to his chest and lands on the step. The music stops dead.

5. **7.30–8.50 — THE GRIN.** The series block: medium close on Phoenix, the one-armed statue behind him. Head turn, the grin, and his pose with the marble arm tucked under one arm and the other thumb up. "Ting" at 7.80, hold until 8.50.

6. **8.50–9.40 — THE WRONG WAY.** Back to the wide. Phoenix quickly jams the arm back onto the shoulder (stone grind), but the wrong way round: instead of waving at the skylight, **the marble hand now points straight down at him**. The guard, Wizard and Reaper all follow the pointing finger to Phoenix.

7. **9.40–10.00 — BLAME.** Phoenix points at Reaper: "He did it!". Reaper slowly turns his head to Phoenix. **Hard cut at exactly 10.00.**

## Continuity and contact rules

- The statue's arm is one piece: on the statue, in Phoenix's arms, then back on the statue pointing down. The break line at the shoulder stays visible after it's put back.
- Phoenix's glove meets the marble hand palm to palm, no passing through, both times. He holds the heavy arm in both arms against his chest, wobbling, never through his body.
- The rope and posts only wobble; nothing else in the hall breaks.
- The guard stays in the back by his stool, small but readable; he never walks in front of Phoenix.
- Nobody is hurt; the arm is carried, never dropped on anyone.

## Posting card (for Jonny)

| | |
|---|---|
| In-app text title | **That one friend with too much energy at the museum** |
| Caption | That one friend with too much energy at the museum 🏛️ Tag the friend who's like this. What do you do now: run or confess? |
| Hashtags | #funnyanimation #animation #museum |
| Cover frame | THE GRIN at 8.2 s: Phoenix grinning with the marble arm, the one-armed statue behind him |

## Checks before posting (playbook section 2)

- The title states the situation in plain English in the first second, using search words.
- Full faces, a wide shot and motion from frame 0. No extra cut in the first 1.5 s.
- It works muted: the "do not touch" pictogram, the rope, the crack, the arm, the grin and the pointing finger tell the story without sound.
- The payoff (the statue pointing at him, him blaming Reaper) is the last frame. No "done" pose.
- Music is in the clip.
- The comment trigger is in the story.
