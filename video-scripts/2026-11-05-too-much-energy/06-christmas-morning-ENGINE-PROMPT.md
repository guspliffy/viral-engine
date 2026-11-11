# Too Much Energy, episode 6: Christmas morning — Viral Engine prompt (5 Nov 2026)

Jonny picked this on 5 Nov as one of seven episodes of the "That one friend with too much energy" series. Read 00-SERIES-FORMAT.md in this folder first: Phoenix's energy meter, THE GRIN (7.30–8.50), the "ting" logo and the posting pattern come from there. Too Much Energy (clip 23) is the pilot.

**Post on Thursday 24 December 2026.** German-speaking viewers open presents that evening and US viewers the next morning, so it lands for both. Build it in the week before.

It applies the reach playbook (reach-playbook-2026-11-04.md) and Jonny's lab picks: a gibberish yelp in the first half second (subtitled), stronger force with 3-frame hit-stops, stronger faces with longer holds. The whole frame stays sharp: no depth of field.

---

Create an **exactly 10-second, 9:16 Potato Brawl animated comedy**, 1080 × 1920 at 30 fps.

**Core joke:** 5 am on Christmas morning, and Phoenix is already opening everyone's presents. He puts on Reaper's new slippers, wakes Wizard with Wizard's own new wand, and then rips open the biggest box so hard that its ribbon pulls the whole light string off the tree: it wraps round him and the star lands on his head. He grins, blinking like a Christmas tree. Then Reaper shows him whose box that was: Phoenix's own present, from Reaper. Inside: decaf. Phoenix hugs him, and Reaper gives his tiny nod. **A soft ending for the season:** Phoenix wrecks the morning, and the friendship wins.

**Why it should travel:**
- **Share hook:** everyone knows who wakes the whole house on Christmas morning.
- **Comment trigger (open question):** "What would you give your friend with too much energy?" This replaces the series question.
- **Running joke:** the meter and the grin; Reaper's tiny nod; the energy friend finally gets a present that answers the whole series.
- **Plain search words:** "Christmas morning".

## Jonny's storyboard (wins over this brief)

Jonny's eight panels (5 Nov): `storyboards/06-christmas-morning/storyboard-eight-panels.png` in the project folder copy of this series (video-scripts/2026-11-05-too-much-energy/; the image prompts sit next to it). **The panels set the place, the camera side, who stands where, the eyelines, the light and the detail level; match them frame by frame and run `qa/panels.mjs` before any full render.** The text below still sets the mechanics the drawings simplify (prop counts, grips, contact, timing), as the pack's own review notes say. Where the panels differ from the text, use these notes:

- **Place and camera:** a cosy wooden cabin living room: the tree on the left, the wall clock at five above it, the staircase centre-back where Reaper comes down, the sofa on the right with Wizard asleep, his staff leaning on it. Snow in the windows. Phoenix front-centre among the presents.
- **Tags:** the gift tags show the friends' faces as little drawings (Reaper's on the slippers' bag, Phoenix's on the big box); keep that, no words.
- **03:** the wand's sparkles land on Wizard on the sofa; he wakes up wide-eyed.
- **04:** the ribbon from the big box is tied to the end of the light string; the string whips off the tree and the star flies off the top.
- **05–06:** Phoenix wrapped in lights with the star on his head, wearing the slippers; the wand on the rug.
- **07:** Reaper holds the decaf bag up out of the big box (the Phoenix tag on the box); Phoenix is in the left foreground with his back half to us. Turn him three-quarters so his face reads.
- **08:** the hug: Reaper's arm wraps round Phoenix's side, both eyes closed; Wizard laughs behind them; Reaper's mug on the floor. Contact: close, never intersecting.

## Cast

Phoenix and two sleepy friends.

- **Phoenix** (too much energy): front centre on the rug among the presents.
- **Reaper** (the tired one): comes down the stairs in a long nightcap over his hood, holding a mug in both hands. No scythe.
- **Wizard** (asleep): on the sofa under a blanket, his hat on, his old staff leaning on the sofa arm.

Preserve all approved character designs from the reference sheet. Clean cinematic anime linework, controlled cel shadows, crisp faces and restrained highlights.

## Environment (one painted set)

Try a **layered painted environment** first (new env `christmas-living-room`, about 3 minutes). If the coverage check or the look fails indoors, fall back to a painted plate plus 3D geometry (the `livingroom-golden` plate is the model for the room, relit for night).

- **Far:** a cosy living room before dawn: a frosty window with blue snow light and falling snow outside, a staircase on the right coming down into the room, a fireplace with stockings (unlit, embers only).
- **Mid:** **the tree on the left** with a warm white light string spiralling round it and a gold star on top; the sofa centre-back with Wizard asleep; a round wall clock above the sofa showing five o'clock (hands, no numbers needed).
- **Near:** a rug in front of the tree covered in presents. Each present has a little tag with a **face icon** of whose present it is (Reaper's hood, Wizard's hat, Phoenix's crest), no words. **The biggest box, with a Phoenix tag, sits nearest the tree, and its long red ribbon is tied round the end of the tree's light string** (visible in frame 0: the cause of the break).
- **Real geometry:** the floor, rug, tree (with the light string as one rig that can unwind), star, presents, wrapping paper as torn pieces that fly and settle, the slippers, the wand, the coffee bag, the sofa, blanket, stairs, mug.
- **Light:** blue snow light from the window, the tree's warm string lights blinking slowly, Phoenix's meter as the brightest warm light in the room. When the lights leave the tree, the tree goes dark and the room's warm light now comes from Phoenix wrapped in them. All sharp.

## Camera and look

- One wide from the front, slightly low: tree left, sofa centre-back, stairs right, Phoenix front centre among the presents. Reaper comes down the stairs on the right without passing in front of Phoenix.
- THE GRIN uses the series framing: Phoenix wrapped in blinking lights with the star on his head, the bare tree behind him.
- **Hit-stops:** (1) the wand's spark spray hitting Wizard at 4.50, (2) the star landing on Phoenix's head at 6.40.
- **Space for the title:** the top 20% clear from 0 to 2 s. The tree's star sits below that band. Don't burn in a title.

## Sound

- **Music:** sleigh bells and a bouncy pizzicato-and-glockenspiel Christmas tune (our own melody, no real carol), about 140 bpm in B-flat major, `lowCut` around 150 Hz. It drops out at the star and comes back as a warm, slow chord on the hug (`ai/warm-resolve` is the model for the feeling).
- **Effects:** **wrapping paper tearing** (new sound to measure into the whitelist), paper pieces fluttering, his feet thumping on the rug, the slippers' soft pats, the wand's sparkle (`ai/magic-zap`, short), Wizard's startled snort, the light string whipping off the branches (`whoosh`, one), the bulbs clinking (`kenney/impact-glass-light`), the star landing (`bonk`, soft), a soft `ai/flare` on each meter step, the "ting" at 7.80, coffee beans rattling in the bag, the hug (`thud-soft`).
- **Voices (all subtitled):** Phoenix's yelp at 0.05, "PRESENTS! PRESENTS!" (lower third). Phoenix at 2.6, in the slippers: "Cute!". Wizard at 4.70, sitting up: "That's MY wand!". Reaper's one word at 9.10: "Decaf.". Phoenix at 9.40: "I LOVE it!".

## Exact seven-beat timing

1. **0.00–1.50 — ALREADY TOO MUCH.** Wide. Frame 0: Phoenix mid-tear on a small present, paper flying over his head in arcs, three presents already open around him. "PRESENTS! PRESENTS!". Meter small. Wizard asleep on the sofa ("zzz" emote). The clock says five. The big box and its ribbon to the tree are in plain view.

2. **1.50–3.30 — THE SLIPPERS.** He rips open a present with Reaper's tag: fluffy slippers. He puts them on his own feet and does a happy shuffle ("Cute!"). Meter up one size. Reaper appears on the stairs with his mug, stops mid-step, looks at the empty paper with his face icon on the tag, and blinks very slowly.

3. **3.30–5.30 — THE WAND.** He rips open a present with Wizard's tag: a shiny new wand with a star tip. He waves it, and a spray of sparkles shoots across the room into Wizard's sleeping face (hit-stop at 4.50). Meter up one size. Wizard sits bolt upright, hat askew, blanket sliding off: "That's MY wand!". Reaper reaches the bottom of the stairs and sighs into his mug.

4. **5.30–7.30 — THE BREAK.** Phoenix dives on the biggest box and rips it open with both wings flaring (meter at its biggest). The ribbon pulls tight, and the whole light string whips off the tree in a spiral, wraps round Phoenix three times, and the star flies off the top and lands on his head (hit-stop at 6.40). The tree is bare and dark; Phoenix glows and blinks. The music drops out.

5. **7.30–8.50 — THE GRIN.** The series block: medium close on Phoenix wrapped in blinking lights, the star on his head and the bare tree behind him. Head turn, grin and pose (one thumb up through the coils of lights), "ting" at 7.80, hold until 8.50.

6. **8.50–9.40 — DECAF.** Back to the wide. Reaper walks over, turns the big box's tag round so we see it: Phoenix's crest icon, his own present. Reaper lifts out what's inside: a bag of coffee with a big **decaf symbol** (a coffee bean with a crossed-out lightning bolt). "Decaf.". Wizard snorts a laugh behind his hand.

7. **9.40–10.00 — THE HUG.** Phoenix gasps, "I LOVE it!", and throws his arms round Reaper in a big hug, the blinking lights now round both of them. Over Phoenix's shoulder, **Reaper gives one tiny nod.** **Hard cut at exactly 10.00.**

## Continuity and contact rules

- One light string, one star, one big box. The string leaves the tree only because the ribbon pulls it; it wraps Phoenix on the outside of his body, never through it, and stays on him into the hug.
- The slippers stay on Phoenix's feet from 2.4 to the end. The wand stays in his hand until the big box, then lies on the rug.
- Torn paper pieces fly, settle and stay where they land.
- The hug: arms wrap round the sides, close but never intersecting (Zombie hug lesson). Reaper's mug is set down on the rug before the hug.
- His flames never touch paper, the tree or the lights. Nobody is hurt.

## Posting card (for Jonny)

| | |
|---|---|
| In-app text title | **That one friend with too much energy on Christmas morning** |
| Caption | That one friend with too much energy on Christmas morning 🎄 Tag the friend who's like this. What would you give your friend with too much energy? |
| Hashtags | #funnyanimation #animation #christmas |
| Cover frame | THE GRIN at 8.2 s: Phoenix wrapped in blinking lights with the star on his head, the bare tree behind him |
| Post | Thursday 24 December 2026 |

## Checks before posting (playbook section 2)

- The title states the situation in plain English in the first second, using search words.
- Full faces, a wide shot and motion from frame 0. No extra cut in the first 1.5 s.
- It works muted: the clock, the tags' face icons, the slippers, the wand, the lights, the grin and the decaf symbol tell the story without sound.
- The payoff (decaf and the hug with Reaper's nod) is the last frame. No "done" pose.
- Music is in the clip.
- The comment trigger is in the story.
