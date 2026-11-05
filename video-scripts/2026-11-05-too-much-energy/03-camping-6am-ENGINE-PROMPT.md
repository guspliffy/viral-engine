# Too Much Energy, episode 3: camping at 6 am — Viral Engine prompt (5 Nov 2026)

Jonny picked this on 5 Nov as one of seven episodes of the "That one friend with too much energy" series. Read 00-SERIES-FORMAT.md in this folder first: Phoenix's energy meter, THE GRIN (7.30–8.50), the "ting" logo and the posting pattern come from there. Too Much Energy (clip 23) is the pilot, and this episode is its closest cousin: 6 am, a sleeping Reaper, and Phoenix who can't wait.

It applies the reach playbook (reach-playbook-2026-11-04.md) and Jonny's lab picks: a gibberish yelp in the first half second (subtitled), stronger force with 3-frame hit-stops, stronger faces with longer holds. The whole frame stays sharp: no depth of field.

---

Create an **exactly 10-second, 9:16 Potato Brawl animated comedy**, 1080 × 1920 at 30 fps.

**Core joke:** 5:59 am at the lake, the tent door open, Reaper and Wizard asleep. Phoenix has been up for an hour. He zips the tent door open and shut, open and shut, then sticks his head in and spreads his glowing wings like a sunrise. When that doesn't work, he drags both sleeping bags out by their feet, and the tent collapses behind them. He grins. Then the real sun comes up over the lake, and it's so beautiful that even Reaper gives a tiny nod. **Phoenix wins this one** (character bible: both leads win, fail and surprise).

**Why it should travel:**
- **Share hook:** the tent zip at 6 am is the most hated sound of every camping trip, and everyone knows who does it.
- **Comment trigger (pick a side):** "Worth getting up at 6 am for this? Yes or no." This replaces the series question.
- **Running joke:** the meter and the grin; Reaper's tiny nod (his "pleased" tell); the same campsite as Pitch a Tent, so the two series share a world.
- **Plain search words:** "camping" and "6 am".

## Cast

Phoenix and two tired friends.

- **Phoenix** (too much energy): outside the tent in the front of frame, full of beans.
- **Reaper** (the tired one): asleep in a dark sleeping bag at the tent door, only his face showing under the bag's hood, drawstring pulled tight.
- **Wizard** (the grumpy one this time): asleep in a blue sleeping bag beside Reaper, his hat on even in bed, a little pillow.

Preserve all approved character designs from the reference sheet. Clean cinematic anime linework, controlled cel shadows, crisp faces and restrained highlights.

## Environment (reuse, cheapest build in the series)

**Reuse the `lakeside-campsite` env and the dome tent from Pitch a Tent (Friends Try To episode 2, PR #105),** relit for dawn. Same lake, same jetty, same birches, same fire ring.

- **Light at the start:** pale blue dawn, mist lying on the lake, the sky warming to pink low on the horizon behind the far hills. Phoenix's meter is the warmest light on screen.
- **Light at the end:** the sun clears the hills at 8.80 and washes everything in gold: the mist glows, long shadows, sparkles on the water.
- **Props:** the tent with its **door facing the camera** and rolled open, two sleeping bags with the friends' heads at the door, a small travel alarm clock on a camping stool beside the door (reuse the pilot's `digiclock`, reading 05:59), a camping lantern hanging from the tent's roof loop inside, **its cord running down and tied to the zip pull of Wizard's sleeping bag** (visible in frame 0: the cause of the collapse).
- **Real geometry:** the ground, the tent with poles and pegs, the zip door (a zip slider that moves), the sleeping bags (soft, they slide on the dewy grass), the lantern and cord, the clock, the pillow.

## Camera and look

- Wide from the front, slightly low, the tent centre-back with both sleeping faces in its open door, Phoenix in the front, the lake and hills behind. The sunrise happens behind the tent's right shoulder, so it's in frame without blocking a face.
- THE GRIN uses the series framing, the collapsed tent and the two friends in their bags behind him.
- **Hit-stops:** (1) the pillow bonking off his crest at 4.60, (2) the tent folding down at 6.30.
- **Space for the title:** the top 20% clear from 0 to 2 s. Don't burn in a title.

## Sound

- **Music:** a bright marimba and hand-clap morning groove, about 124 bpm in G major, `lowCut` around 150 Hz. It cuts out at the collapse and comes back at the sunrise as a warm swell (`ai/warm-resolve` is the model for the feeling).
- **Effects:** early birds and soft lake water (room sound), his feet on grass, **the tent zip** (new sound to measure into the whitelist: a fast zzzip up and down), a soft `ai/flare` on each meter step, the pillow bonk (`bonk`), sleeping bags swishing over the grass, pegs popping out of the ground one after another (`pop`), the tent poles folding and the cloth flopping (`thud-soft`), the "ting" at 7.80, the clock beeping 06:00 (short, at 8.70), the sunrise swell.
- **Voices (all subtitled):** Phoenix's yelp at 0.05, "Good MORNIIING!" (lower third). Wizard at 2.8, one eye open: "It's SIX!". Phoenix at 3.8, head in the tent: "Sun's up!" (it isn't yet). At 8.95 Wizard, softly: "…oh." Phoenix at 9.60: "Again tomorrow?". Reaper silent.

## Exact seven-beat timing

1. **0.00–1.50 — ALREADY TOO MUCH.** Wide. Frame 0: blue dawn, the two friends asleep in the tent door, and Phoenix doing star jumps on the grass in front, wings flapping on every jump, yelling "Good MORNIIING!". Meter small. A "zzz" emote over Wizard. The clock on the stool reads 05:59.

2. **1.50–3.30 — THE ZIP.** Phoenix grabs the zip slider and zips the tent door shut and open, shut and open, faster and faster, in time with the music (zzzip zzzip zzzip). Meter up one size. Wizard's eye snaps open on the third zip: "It's SIX!". Reaper doesn't open his eyes; he pulls the drawstring of his bag tighter until only his nose shows.

3. **3.30–5.30 — THE SUNRISE.** Phoenix sticks his head and wings into the tent door and spreads his glowing wings: a fake sunrise, his orange light flooding both faces (meter up one size). Wizard pulls his pillow out from under his head and throws it: it bonks off Phoenix's crest (hit-stop at 4.60) and Phoenix laughs, thinking it's a game. Reaper slowly pulls the whole bag over his head.

4. **5.30–7.30 — THE BREAK.** Phoenix grabs the foot ends of both sleeping bags and runs backwards towards the lake, dragging the friends out of the tent like two caterpillars (meter at its biggest). Wizard's bag pulls the lantern cord, the cord pulls the roof loop, and the pegs pop out one after another: at 6.30 (hit-stop) the tent folds down flat behind them. The two bags slide to a stop on the wet grass. The music cuts out.

5. **7.30–8.50 — THE GRIN.** The series block: medium close on Phoenix, the collapsed tent and the two bagged friends behind him. Head turn, grin and pose, "ting" at 7.80, hold until 8.50. The light behind him is already turning pink.

6. **8.50–9.50 — THE SUN.** Back to the wide. The clock beeps 06:00 and the sun clears the hills: gold light pours across the lake and over all three. Phoenix points at it with both wings wide open, beaming. Wizard's face pops out of his bag, his frown melting: "…oh.". Reaper's face appears from his bag, lit gold; after Phoenix turns back to the sun, **Reaper gives one tiny nod.**

7. **9.50–10.00 — AGAIN.** Phoenix spins round: "Again tomorrow?". Both friends drop their heads back onto the grass at the same moment. **Hard cut at exactly 10.00.**

## Continuity and contact rules

- The tent, poles, pegs and cord are the ones set up in frame 0; the collapse is caused only by the cord and the drag.
- Phoenix's gloves grip the zip slider and then the bag ends with no gaps. The bags slide; the friends inside don't pass through their bags.
- The pillow bounces off his crest and lands on the grass, where it stays.
- His glow lights faces but his flames never touch the tent cloth or the bags.
- The sun rises in one place behind the hills and only rises; the light changes gradually from blue to gold. Nobody is hurt.

## Posting card (for Jonny)

| | |
|---|---|
| In-app text title | **That one friend with too much energy at 6 am camping** |
| Caption | That one friend with too much energy at 6 am camping ⛺ Tag the friend who's like this. Worth getting up at 6 am for this sunrise? Yes or no. |
| Hashtags | #funnyanimation #animation #camping |
| Cover frame | THE GRIN at 8.2 s: Phoenix grinning, the collapsed tent and two caterpillar friends behind him |

## Checks before posting (playbook section 2)

- The title states the situation in plain English in the first second, using search words.
- Full faces, a wide shot and motion from frame 0. No extra cut in the first 1.5 s.
- It works muted: the clock, the zip, the fake sunrise, the drag, the grin and the real sunrise tell the story without sound.
- The payoff (the sunrise, and the heads dropping at "again tomorrow?") is the last frame. No "done" pose.
- Music is in the clip.
- The comment trigger is in the story.
