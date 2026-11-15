# "Survive it": series format (8 Nov 2026)

Jonny, 8 Nov: he liked Part 1 ("Stranded on an island with your friends", `videos/survive-it/01-island/`), but "the question for part 2 in the end should be cut for the next videos of the series". At 19:36 he liked all 10 ideas (`../2026-11-08-survive-it-ideas/IDEAS.md`) and asked for storyboards "so i can create images for refference". This folder holds those 10 storyboards. He makes the eight-panel reference sheets himself from them (built-in image generation, as he did for the food series on 6 Nov).

Every episode brief in this folder follows this page. When an episode brief and this page disagree, the episode brief wins. When Jonny makes panels for an episode, **his panels win over both** (copy their staging, camera side and light; `qa/panels.mjs`).

## Rule 0: one chain of cause and effect (Jonny, 10 Nov 2026) - this wins over the story shape below

Jonny on EP1 "Snowed in" (10 Nov): "i dont like how its build up ... its just different scenes", and: "this series (as every video) should make sense but especially the would you survive this must make sense and should have a logical cause and effect. elsewise the viewer is just wondering why he watched the video."

So an episode is no longer three separate fails joined by day jumps and RULE cards. It is ONE chain: one mistake in the first second, and every scene happens because of the scene before it ("X, so Y, so Z"), up to a last frame that answers the first mistake. The days pass because of what the friends do, never as a cut between unrelated scenes. No RULE card between scenes unless Jonny asks for them back. Every episode goes to Jonny as a 6-line outline before any build. The model is `02-stuck-in-a-lift-CHAIN-OUTLINE.md` (Jonny, 10 Nov: "works for me") and the full brief written from it, `02-stuck-in-a-lift-ENGINE-PROMPT.md` (chain table, chain check per outcome, time-lapse as jump cuts inside one action, no RULE cards, no jump tags). The other nine ENGINE-PROMPT briefs in this folder are still in the old shape: rewrite one as a chain before building it.

## What every episode is

A group of 3 to 5 potato friends tries to survive one extreme situation. **Each friend's fixed type causes the next problem.** Each failure is bigger than the last. A **RULE card** after each failure names the lesson. The **HUD** shows the days and the clock jumping between beats. The episode **stands alone**: no "Part 2", no vote card, no question card at the end. It ends on its biggest failure or a reveal **as the last frame, then a hard cut**.

Length **15 to 18 s**, 9:16, 1080 x 1920, 30 fps. One episode, one place (a second place only where the brief says so, like the roof in "no Wi-Fi").

## The story shape (time codes are a guide; each brief sets its own)

| Time | Beat | What happens |
|---|---|---|
| 0.00-1.00 | **HOOK + SNAP 1** | Frame 0: a medium-wide with the troublemaker AND the victim in it, trouble already happening, something moving, sound at 0.0 (voice or impact) with the music already running. The promise line (3 to 6 words, subtitled) at 0.05. By 1.0 s the picture shows the opposite of the line. Every noun of the title is in frame 0. |
| 1.00-2.50 | **THE VICTIM'S FACE** | Cut to the victim (usually the one with the plan) for a 0.6-0.8 s reaction. **The stakes are in the picture by 1.5 s**: the last log, the one bar, the 1 % battery, the jar of coins. |
| ~2.5-~6 | **FAIL 1 (small: one object)** | Friend A's type breaks the first plan. RULE 1 card on the failure sound. |
| ~6-~10 | **FAIL 2 (bigger: one friend)** | HUD clock jump at the cut. Friend B's type makes it worse. RULE 2 card. |
| ~10-~14 | **FAIL 3 (biggest: the whole place)** | Friend C's type. **The wow moment** (a physics spectacle or a scale gag only our engine can do). RULE 3 card. |
| ~14-~15.5 | **SNAP 2: THE FAKE-OUT** | A clock jump, then a beat where it really looks like they made it (rescue, light, land, signal). Cheers. |
| ~15.5-~17.5 | **THE PAYOFF** | The fake-out breaks in the biggest way, or the hidden truth is revealed. **It is the last frame.** Hard cut. No outro, no card after it, no "done" pose. |

Stair-step: one object, then one friend, then the whole place, then the payoff on top. Never a wind-down beat.

## The 10x pass (Jonny, 9 Nov: "yes" to making every story 10x more extreme)

Every episode uses all five levers. They replace the softer versions in the first storyboards (kept in `v1-before-10x/`).

1. **10x numbers on the HUD.** Days, degrees, floors and hours go absurd (7 days -> 100, -30° -> -60°, 100 floors -> 1,000, 3 days -> 30). The day counter races through the time skips (a fast count-up under the cut, not a single jump).
2. **A threat you can see in every shot.** One thing keeps getting worse on screen even between the gags, ideally also as a HUD chip: snow climbing up the window, the lift cable losing strands (12 -> 1), the raft losing logs, the lava line creeping closer. It is in frame 0 and it is worst in the last shot.
3. **The place turns them into more of a potato** (the wow only our cast can do). In the dark their sprouts grow longer every day, like real potatoes. In heat they bake: steam, crisping golden skin, a knob of butter melting on top. In snow they frost over like frozen fries. In water they go wrinkly. Show the days on their bodies, step by step. Keep it cute: they are fine and annoyed, never hurt, never scary, never food for each other.
4. **Fail 3 wrecks the whole place, not just one thing.** The cottage sleds down the mountain on an avalanche; the lift rockets out of the roof; the whole city goes dark.
5. **The ending zooms out to the biggest scale.** Pull back from their faces to the whole city, the whole forest from a plane, the whole island, the whole ocean.

Never shrink the big prop or the big number to save render time; cut a beat instead (sprint rule 3). Name every new rig control or asset the 10x pass needs (sprout growth, baking skin, frost) in the brief's props table.

### Shared 10x controls (build each one ONCE)

The briefs were written in parallel, so some name the same control differently. They are one control each:

| Control | Names in the briefs | Episodes |
|---|---|---|
| Sprout growth (sprout -> long vine across the floor, step by step) | `sproutvine` (`grow`), `sprout` | 03, 04, 06, 10 |
| Baking (golden -> crisp jacket skin, steam, butter knob on top) | `bakeskin` (`bake`), `bake` + `butter` | 02, 05, 09 |
| Frost (frosted skin, icy sprout) | `frostcoat` (`frost`) | 01 |
| Wrinkle (wet, wrinkly skin) | `wrinkle` | 07, 08 |
| Beard growth | `beardgrow` (`beard`) | 04 |

The first build thread that needs one makes it as a cast control for all ten potatoes, with steps 0 to 1, and the later threads reuse it. All of them stay cute: the friends look annoyed, never hurt.

## The narrator (Jonny, 9 Nov 2026)

- After the voiceover test on Part 1 (`videos/survive-it/voiceover-test/`), Jonny picked the narrator for the series: engine voice `narrator` (voice 1, the deep storyteller, the same as What if).
- **The title is spoken from 0.0** ("the title of the survive it video should be spoken too so the viewer knows instantly what its about"). The narrator reads the episode title over frame 0; the promise line follows right after it. This adds about 2.5 s, so episodes run about 18-20 s.
- The narrator speaks only where nobody talks and no hit lands (short, deadpan lines: the day jumps, a closing line). Subtitled like every line.

## What stays from Part 1 (the series signatures)

- **HUD from frame 0:** small chips in the top corners (y about 214-284): DAY n, the clock (with a "+26 min" style jump tag at each time-skip cut), and the battery % where a phone matters. A small series label chip **"SURVIVE IT"** where Part 1 had "PART 1". Some episodes add one gauge (warmth °C, thermometer, Wi-Fi bars): the brief says which. The overlay API is `storyboards/lib/overlay.mjs` `hud({...})`; a new gauge is a small addition there.
- **The clock and the world always agree** (Jonny, 8 Nov): a night clock means a night window or sky. `livingroom-golden` has a night picture; outdoor envs use `sky.js` (dusk 19:30, night 21:30). Never a moon on the HUD over a sunny window.
- **RULE cards:** "RULE 1" + one line, always in the form **"Never let the <type> one <do the thing>"**, in the troublemaker's colour, under the HUD (y about 300-564), never over a face, 1.3-1.6 s each, starting on the failure sound.
- **Time skips** under the cuts between beats, carried by the clock jump tag.
- **Each friend reacts to the others' failures:** glares, blame, overlapping gibberish, a sheepish grin from the one who did it.

## The friends (potato cast only)

Fixed friend types (same as the sprint line-ups). Use 3 to 5 per episode; the brief names them.

| Potato | Type in Survive it | Look (approved sheets in `references/cast-sheets-v1/<name>-reference-v1.png`) |
|---|---|---|
| **Viking** | the planner / leader, sure of every plan ("easy!"); always orders potatoes | Golden potato, green eyes, spiky orange-copper crest with a green sprout, cream fur shoulders, red tunic, brown strap and wide belt with a round gold buckle, black gloves and boots, double-headed grey axe (allowed in this series). |
| **Dragon** | always hungry | Bare golden potato, green sprout, brown eyes, two orange-red dragon wings, curved gold tail with a red tip, black gloves and boots. Can hiccup small flames. |
| **Sorcerer** | takes 100 photos | Rich violet hooded cloak with gold edging and a round gold clasp, violet eyes, golden potato face, green sprout through the hood top, black gloves and boots, small green orb over one palm. His phone uses the edge hold when shown to others (thumb on the bezel). |
| **Phoenix** | too much energy | Bare golden potato, green sprout in an orange feather crest, orange-gold feather wings, small fiery tail, tiny black hands and boots. Can fly. Not a bird. |
| **Reaper** | scared of everything | Dark charcoal hooded cloak, golden potato face, green sprout out of the hood, silver round chest clasp, small black gloves and feet. Scythe optional (the brief says). |
| **Wizard** | overthinks / reads the manual / has a plan for everything | Tall purple floppy pointed hat with a gold band, green sprout at the hat band, golden potato body, brown eyes, short purple cape, black gloves and boots, staff. Not a purple hood. |
| **Samurai** | too competitive | Bare golden upper potato, green sprout, dark brown eyes, blue sash with a side knot, dark navy pleated lower garment, black gloves and boots, one green katana with a black and gold grip. |
| **Gunslinger** | never has money | Brown cowboy hat with a green sprout above it, golden potato, brown eyes, red neckerchief, open brown vest, belt with a round gold buckle and two hip holsters that hold a wallet (no pistols). Signatures: the pocket pat, the moth that flies out, the "Next time's on me!" wink. |
| **Astronaut** | falls asleep anywhere | Golden potato in a clear dome helmet, green two-leaf sprout inside the dome, white and silver lower suit, grey collar ring, small chest control panel, white gloves, tiny boots, compact white backpack. |
| **Norse god** | **overkill** (calls thunder when a match would do; new, from ideas 1, 4 and 9, which Jonny liked) | Blue eyes, ivory-white hair and beard, two side braids with gold bands, green sprout above the hair, small round golden nose, dark armour, dark red cape, black gloves and boots. A raven may sit on his shoulder. |

Never more than five faces on screen. Exactly one of each named friend. No humans, no Pebble, no Mott, no Little Chaos Club.

## Rules every episode follows

- **MrBeast playbook** (Jonny, 8 Nov: "id like to try all of it"): the 10x version of the premise; frame 0 shows exactly what the title says; stair-step; one wow moment, where the render time goes; reuse sets; the best TikTok clip, not the prettiest. Bright frame 0 is now optional (8 Nov test found no link), but light the opening so faces read.
- **Two snaps** and **stakes visible by 1.5 s** (see the shape above).
- **Reach rules v2** (`/mnt/project-files/reach-rules-v2-2026-11-07.md`): troublemaker + victim in frame 0, sound at 0.0, group-moment shape, caption line 2 asks "Which one are you…?", exactly #funnyanimation #animation + one situation tag, a comment poll.
- **Every gibberish line is subtitled** (Jonny, 4 Nov), placed clear of the HUD, the RULE cards and every face. In Part 1 the cameras looked into the valley and faces sat low, so subtitles went in the sky band (y about 585) under the cards.
- **Physics everywhere:** anything that falls, flies, is thrown, knocked or floats is simulated and lands on its story spot. Every change of place or direction has a visible cause (world logic).
- **Food rule:** any potato that gets eaten is alive (fries, mash, crisps have faces).
- **Staging:** the subject of each beat owns the front of frame; nobody covers the main action. Close contact (Reaper jumping into Viking's arms) stays close but never intersects. 3-finger + thumb gloves. No reaction signs or emoji over heads. No brand names or logos anywhere.
- **Look:** the template (anime cel + anime timing, ink + satsuei, `"life": "auto"`, physics, hold 2, motion layer, sound guard, light 2). Whole frame sharp, no depth of field. castLook "sheet".
- **Workflow:** clip writer Opus 5.5 or Fable 5.1 on xhigh; builders only build props, plates and benches. Staging proof before any builder. Fable review A (board + stills) and B (cut) from fresh spawns. New format? No: Part 1's shape is approved, so no animatic gate unless the brief says it is new (episodes that bring a new gauge or a new set should still show Jonny staging stills).

## Lessons from building Part 1 (for the build threads)

- No shot fits five potatoes side by side (bodies about 0.86 m wide): stage each beat as a two-shot or a three-shot and re-place the cast under the time-skip cuts.
- On painted envs a low camera must stay close (on `fern-valley-campfire`: camera y 0.85 at z ≤ 4.5) or the painted floor ends at the frame bottom; the cameras can't tilt far down, so overhead shots need a built 3D set.
- A held prop does not follow a dur-0 re-place: re-target it with the holder's `carry(t, at, 0)` at the same cut.
- A walker re-placed under a cut steps a frame early: keep walkers on their spot or hide the re-place differently.
- Sound surface "dirt" falls back to an indoor step 20 dB too loud: use "grass".

## The eight-panel reference sheet (for Jonny's images)

Each episode has an `NN-<slug>-IMAGE-PROMPT.md`: one paste-ready prompt for ONE storyboard contact sheet, **exactly eight portrait 9:16 panels in 4 columns x 2 rows** (01-04 top, 05-08 bottom), a small time badge on each panel, the HUD chips drawn small in the top corners, the RULE cards drawn as small rounded cards with their exact words, subtitles only where given. Attach the character sheets in the reference order the prompt lists (`references/` in this pack). Panel 01 = frame 0, panel 08 = the last frame.

## Posting pattern

- In-app title = the episode title (Jonny adds it with TikTok's text tool). The HUD sits at the top, so the title goes in the sky band from 0 to about 2.7 s, or is skipped (as proposed for Part 1).
- Caption: line 1 = the title's situation in plain words + one emoji; line 2 = "Which one are you, <A> or <B>?"; then exactly `#funnyanimation #animation #<situation tag>`.
- Comment poll = the self-ID question (two options). Playlist: **Survive it**.
