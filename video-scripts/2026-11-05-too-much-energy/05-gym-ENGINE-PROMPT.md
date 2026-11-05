# Too Much Energy, episode 5: the gym — Viral Engine prompt (5 Nov 2026)

Jonny picked this on 5 Nov as one of seven episodes of the "That one friend with too much energy" series. Read 00-SERIES-FORMAT.md in this folder first: Phoenix's energy meter, THE GRIN (7.30–8.50), the "ting" logo and the posting pattern come from there. Too Much Energy (clip 23) is the pilot.

It applies the reach playbook (reach-playbook-2026-11-04.md) and Jonny's lab picks: a gibberish yelp in the first half second (subtitled), stronger force with 3-frame hit-stops, stronger faces with longer holds. The whole frame stays sharp: no depth of field.

---

Create an **exactly 10-second, 9:16 Potato Brawl animated comedy**, 1080 × 1920 at 30 fps.

**Core joke:** Viking is still stretching. Reaper walks on the treadmill at the slowest speed. Phoenix finishes everyone's workout for them: he does Viking's curls before Viking can pick up the dumbbell, and he presses Reaper's speed button until Reaper's legs are a blur. Then he takes the treadmill himself, runs so fast the belt rips loose, and it whips the dumbbell rack over. He grins. The dumbbells roll across the floor and stop in a neat row at Viking's feet. Viking, still mid-stretch, looks at them: "Warm-up done."

**Why it should travel:**
- **Share hook:** every gym has this person, and every friend group has the gym buddy who's way too awake.
- **Comment trigger (pick a side):** "Your gym buddy: him or Viking?" This replaces the series question.
- **Running joke:** the meter and the grin; Viking the strong one never gets to do anything (he's the one who breaks things in Friends Try To, so here the roles flip).
- **Plain search words:** "gym" in the title and caption. Repost in the first week of January with the same title (New Year's resolutions).

## Cast

Phoenix, two calm friends.

- **Phoenix** (too much energy): front centre, sweatband on his head (under the crest flame, never touching it).
- **Viking** (the slow stretcher): on a mat on the right, deep in a slow side stretch the whole clip, one arm over his head. No axe.
- **Reaper** (the tired one): on the treadmill on the left, walking at the slowest speed, a towel round his neck, hood up. No scythe.

Preserve all approved character designs from the reference sheet. Clean cinematic anime linework, controlled cel shadows, crisp faces and restrained highlights.

## Environment (one painted set)

Try a **layered painted environment** first (new env `morning-gym`, about 3 minutes). If the coverage check or the look fails indoors, fall back to a painted plate plus 3D geometry. Generic gym: no brand, no logo on any machine.

- **Far:** a bright warehouse-style gym with big windows, early morning light, plants, a water cooler, more machines in the distance.
- **Mid:** **the treadmill on the left, side-on to the camera**, its back end pointing right across the frame toward **the dumbbell rack on the back-right wall** (a short two-tier rack with six round dumbbells). Between them, open floor, so the belt's flight and the rolling dumbbells cross the frame sideways.
- **Near:** rubber floor tiles, Viking's mat on the right, a bench at the left edge, a water bottle.
- **Real geometry:** the floor, the treadmill (with a belt that can come loose and its two rollers, a control panel with a big "+" button), the rack and the six dumbbells, the mat, the bench, the towel.
- **Light:** bright, clean morning light from the windows. Phoenix's meter adds warm glow. Dust and chalk in the air. All sharp.

## Camera and look

- One wide from the front, slightly low: treadmill left, rack back-right, Viking's mat right, Phoenix centre front. The belt's path from the treadmill to the rack is in frame the whole clip.
- THE GRIN uses the series framing with the bare treadmill and the toppled rack behind him.
- **Hit-stops:** (1) the treadmill hitting top speed under Reaper at 4.40, (2) the belt snapping loose at 6.10.
- **Space for the title:** the top 20% clear from 0 to 2 s. Don't burn in a title.

## Sound

- **Music:** a punchy workout electro-funk with slap bass played up high and a cowbell, about 128 bpm in F minor, `lowCut` around 150 Hz. It drops out on the belt snap.
- **Effects:** his feet on rubber, the dumbbell clank as he grabs it and puts it back, the treadmill's button beeps (`ui-confirm`, short; the storyboard declares `"scenes": ["ui"]`), **the treadmill motor whining up** (new sound to measure into the whitelist), Reaper's feet pattering faster and faster, the belt snapping (`slap`) and flapping, the rack tipping (`kenney/impact-plank-medium` with a metal clank), dumbbells rolling and bonking softly (`bonk`, quiet), a soft `ai/flare` on each meter step, the "ting" at 7.80.
- **Voices (all subtitled):** Phoenix's yelp at 0.05, "LET'S GOOO!" (lower third). Phoenix at 2.4, curling: "One-two-three-four!". Phoenix at 3.6 at the button: "Faster!". Viking at 9.40: "Warm-up done.". Reaper silent.

## Exact seven-beat timing

1. **0.00–1.50 — ALREADY TOO MUCH.** Wide. Frame 0: Phoenix doing jumping jacks at double speed in front, wings flapping on each jump, "LET'S GOOO!". Meter small. Viking is in a slow side stretch on his mat. Reaper walks on the treadmill so slowly it looks like a rewind. The rack with its six dumbbells sits on the back wall.

2. **1.50–3.30 — VIKING'S CURLS.** Viking finally reaches for the dumbbell on the end of the rack; Phoenix gets there first, does ten curls at triple speed ("One-two-three-four!") and puts it back with a clank. Meter up one size. Viking's glove closes on air; he looks at his empty hand, then glares at Phoenix. Phoenix gives him a "you're welcome" thumbs-up and bounces off.

3. **3.30–5.30 — REAPER'S TREADMILL.** Phoenix leans over Reaper's control panel and taps the "+" button again and again (beep beep beep): the motor whines up, Reaper's slow walk becomes a jog becomes a sprint, his legs a blur and his towel flying, while his face stays completely deadpan (hit-stop at 4.40). Meter up one size. Reaper calmly steps his feet out onto the side rails and stands there, the belt racing under him.

4. **5.30–7.30 — THE BREAK.** Phoenix jumps onto the racing belt himself, wings flapping for more speed (meter at its biggest), and runs so fast his feet blur. At 6.10 (hit-stop) the belt rips off its back roller and whips out the back of the treadmill across the floor, slaps into the dumbbell rack, and the rack tips over: the six dumbbells drop and roll across the floor. Phoenix keeps running in place on the bare rollers. The music drops out.

5. **7.30–8.50 — THE GRIN.** The series block: medium close on Phoenix (now standing on the bare treadmill), the tipped rack and the loose belt behind him. Head turn, grin and pose, "ting" at 7.80, hold until 8.50.

6. **8.50–9.60 — THE ROW.** Back to the wide. The six dumbbells roll across the floor one after another and stop exactly in a neat row at Viking's feet, as if racked. Viking, still in his stretch, looks down at them, then up at Phoenix: "Warm-up done.". He flops back onto his mat.

7. **9.60–10.00 — BEAT.** Reaper, still on the side rails, slowly reaches over and presses the stop button (one beep). **Hard cut at exactly 10.00.**

## Continuity and contact rules

- Six dumbbells, one rack, one treadmill belt. The belt flies only because it came off the roller; the rack tips only because the belt hit it.
- Phoenix's glove holds the dumbbell handle with no gap during the curls. Reaper's feet are on the belt, then on the side rails; never through the treadmill.
- The dumbbells roll on the floor, never through each other, and stop well clear of everyone. Nobody is hit.
- The sweatband sits under the crest flame and never touches it.
- No brand or logo on any machine, bottle or towel.

## Posting card (for Jonny)

| | |
|---|---|
| In-app text title | **That one friend with too much energy at the gym** |
| Caption | That one friend with too much energy at the gym 🏋️ Tag the friend who's like this. Your gym buddy: him or Viking? |
| Hashtags | #funnyanimation #animation #gym |
| Cover frame | THE GRIN at 8.2 s: Phoenix on the bare treadmill, the tipped rack and the loose belt behind him |

## Checks before posting (playbook section 2)

- The title states the situation in plain English in the first second, using search words.
- Full faces, a wide shot and motion from frame 0. No extra cut in the first 1.5 s.
- It works muted: the slow stretch, the stolen curls, the blur legs, the belt, the grin and the neat row of dumbbells tell the story without sound.
- The payoff (the dumbbells lining up at Viking's feet, "warm-up done") is the last beat. No "done" pose.
- Music is in the clip.
- The comment trigger is in the story.
