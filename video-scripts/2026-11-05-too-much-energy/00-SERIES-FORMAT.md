# "That one friend with too much energy": series format (5 Nov 2026)

Jonny, 5 Nov: the account's niche is now relatable "that one friend who…" trait series, each trait a series across different places (about 40 videos). He started with two: **too much energy (Phoenix)** and never has money (Gunslinger, its own folder). For this one he liked all seven places: **library, cinema, 6 am camping, museum, gym, Christmas morning and the brunch after a late night.**

The pilot is **Too Much Energy** (clip 23, PR #67, posted 31 Oct; reposted 4 Nov with the "AGAIN!" ending, PR #86). It is one of the account's best finishers (21.9% finish rate on 4 Nov, third best), so this series builds on what worked there: Phoenix at full volume in a place that wants quiet, a tired friend who can't escape him, and a clear physical consequence.

Every episode brief in this folder follows this page. When an episode brief and this page disagree, the episode brief wins. If Jonny makes storyboard panels for an episode, his panels win over both (run `qa/panels.mjs`).

## What stays the same in every episode

**1. The same friend: Phoenix has too much energy.**
- He never stands still: he bounces on his toes, hops, spins, flaps his flame wings half open, talks fast. Big moves suit his rig (`fly`, `hover`, `drop`, flare, hops and spins).
- **The energy meter (series signature, works on mute):** the flame on his crest and the tips of his wings show how hyped he is. Small at frame 0, one size bigger after each escalation (with a soft `ai/flare` "fwoomp"), biggest at the break. Viewers learn to read it like a fuse. His flames are cosmetic: they glow and light faces, but **they never touch or light a prop or a person** (no fire on anyone; the pilot's burning curtain stays a one-off).
- He means well. He wants everyone to have as much fun as he does. That is what makes him "that friend" and not a villain (character bible: enthusiastic, generous, commits before he understands the problem).

**2. The tired friends.** Each episode has two or three calm friends who want the opposite of what Phoenix wants (quiet, sleep, focus, rest). They are not the same four every time; the place picks them.
- **Reaper** is in every episode as the most tired friend (the pilot's sleeper): hood low, lids half down, the slowest movements in the clip. He never shouts. His reactions are a slow head turn, a long blink, a sigh, and the hood pulled lower.
- **Wizard** is the occasional third. When he's in, he tries to fix Phoenix with a spell, and it goes wrong (canon).
- **One guest per place** where the place needs one (the librarian, the guard, the waiter, the strangers in the cinema row). Never more than five faces on screen.

**3. Conflict, every time.** Every escalation gets a visible reaction from someone else: a shush, a glare, an eye roll, a hand on his shoulder to calm him down that he doesn't notice, overlapping gibberish. Phoenix never notices that anyone is annoyed; he reads every reaction as encouragement.

**4. The same story shape, at the same time codes.** All episodes are **exactly 10.0 s**, hit-stops included (each 3-frame hit-stop adds 0.1 s, so plan the beats around them). The GRIN is the beat viewers learn to wait for.

| Time | Beat | What happens |
|---|---|---|
| 0.00–1.50 | **ALREADY TOO MUCH** | Frame 0: a calm, quiet place and Phoenix already mid-bounce in it, with full sound. All faces in a wide. Phoenix's gibberish yelp at 0.05 (subtitled, see the voices rule). The thing that breaks at 5.3 is already visible in frame 0 (world logic). The tired friends are perfectly still, so the contrast reads in one second on mute. No extra cut before 1.5 s. |
| 1.50–5.30 | **MORE. AND MORE.** | Two energy moves, each bigger than the last, overlapping. The meter goes up one size after each. After each move, a reaction from the others (shush, glare, grab, a failed calming spell). Each move is one habit real energetic friends have in this place. One 3-frame hit-stop on the bigger move. |
| 5.30–7.30 | **THE BREAK** | His biggest move breaks the thing set up in frame 0. The meter is at its biggest. A 3-frame hit-stop on the moment it goes. The music drops out for a breath; the room sound stays. The break is wide enough to see the cause and the result in one picture. |
| 7.30–8.50 | **THE GRIN** | **The same framing every episode:** everything else freezes and the camera cuts to a medium close on Phoenix from his front-left, three-quarters, at his eye level, the wreck behind him. At 7.45 he turns his head to us. At 7.70 a huge toothy grin and his "I meant to do that" pose (one glove thumb up, the other hand behind his head; character bible dignity move). At 7.80 **the "ting" glint on his teeth (the series sound logo, sfx `ting`)** and one small crest flare. He holds it still until 8.50. No subtitle. |
| 8.50–10.00 | **THE AFTERMATH** | Back to the wide. Episode-specific, one picture: how the tired friends answer, and one thing that leaves a question open. Some episodes Phoenix wins (the character bible says both leads win, fail and surprise; the brief says which). **Hard cut at exactly 10.00.** No outro, no end card. |

**5. The same sound logo.** The "ting" on his grin plays exactly once per episode, at 7.80, never anywhere else. Phoenix's own signature flame whoosh (`sig-phoenix`) plays only on his entrance if he flies into frame, never on the break.

**6. The same posting pattern.**
- In-app title (Jonny adds it with TikTok's text tool): **"That one friend with too much energy at the <place>"**. It's the pilot's caption, so the series and the pilot read as one. Plain search words. Keep the top 20% of the frame clear from 0 to 2 s; nothing is burned in except the gibberish subtitles.
- Caption line 1 matches the title, then **"Tag the friend who's like this"**, then the series question **"Where should we take him next?"** (viewers pitch places, which is the comment trigger we're missing, and their answers feed later episodes). An episode may swap the question for a stronger pick-a-side question; the brief says so.
- Exactly 3 hashtags: #funnyanimation #animation + one situation tag. Never #viral or #fyp.
- **Cover frame: always THE GRIN at 8.2 s.** The same face, the same framing and the same pose with a different wreck behind it, so the profile grid reads as one series.

## What changes every episode

The place, the tired friends and guest, the two energy moves, what breaks, the aftermath, and the music (a different style, key and tempo every time, per Jonny's music-variety rule).

## Rules every episode follows (from project memory)

- **Hook:** frame 0 is already action with full sound, full faces in a wide, visible motion, and it makes sense muted by 1.5 s.
- **Staging (Jonny, 5 Nov):** the subject of the clip owns the front of the frame. Phoenix acts in the clear front plane; no tired friend, guest or prop ever covers his action or face. The friends react from the sides or behind him.
- **Gibberish is always subtitled (Jonny, 4 Nov),** including the opening yelp. From 0 to 2 s the subtitle sits in the lower third (y about 1240) so it never touches Jonny's in-app title; after 2 s classic style, 62 px, at y 470 or wherever no face is. Lines take turns and each ends before the next beat. Voices: Kokoro gibberish, Phoenix A, Reaper A, Wizard B; others from the cast voices. Reaper says at most one word per episode.
- **Sharp frame:** no depth of field (FOCUS=false, or focusBand 0.7). Separate the characters from the background with light and contrast, not blur. Motion blur only above 144 px per frame (#93); check that Phoenix's fast hops don't smear his face in close shots (pilot lesson).
- **Place:** a layered painted environment (set type `env`, PR #92) per place, about 3 minutes to make, with real 3D geometry wherever a character or prop touches something. Six of the seven places are interiors: try the env first; if the coverage check or the look fails, fall back to a painted plate plus 3D room geometry. Stay inside the env's safe camera range (about 0.9 m sideways and 4 to 10° of turn): no reverse angles. Painterly, Ghibli-like mood, our own look, lived-in detail, dust in the air and debris on every hit. Every change of place, direction or state has a visible cause.
- **Look:** castLook "sheet" (hatched). Preserve the approved designs in references/cast-sheets-v1/. Clean anime linework, cel shadows, crisp faces. Eyebrows never touch the lid line.
- **Hands and contact:** 3-finger + thumb gloves (so no "five fingers" counting gags). Every hand contact touches its object with no gaps and no passing through; close contact stays close but never intersects. The contact and rig checks (#88, #94) and the env coverage check must pass before any full render.
- **Faces:** strong faces with long holds (lab picks). A reaction a face won't carry at phone size gets a small emote over the head (one or two per clip).
- **Sound:** music under the whole clip with `music.lowCut` around 150 Hz; check `qa/sound.mjs <sb> --phone`. Only whitelisted sounds or Jonny's words (splort, dö-döm, bonk). A sound the whitelist doesn't have yet (the briefs list them) gets measured and described in `assets/sfx/whitelist.json` first. For a hover use `sound.flaps: false`, because the automatic wing flaps are loud and bassy.
- **Nobody gets hurt.** Things break, people don't. A bonk is fine; nothing breaks on a body, no fire on anyone, no blood.
- **No real brands or works:** no real film on the cinema screen, no real art in the museum, no logos on gym machines, coffee cups or gifts.
- **Workflow:** start from storyboards/templates/clip-template.mjs. Fable reviews the storyboard and the cut. Merge only on Jonny's "merge it".

## Build tip: make the grin once

Build THE GRIN (7.30 to 8.50) as one shared module (for example storyboards/series/too-much-energy/grin.mjs) that takes Phoenix's position, the wreck behind him and the camera target. The cut, the head turn, the pose, the "ting" and the flare are then frame-identical across the series, and the frame cache reuses more of it. Make the energy meter one helper too (crest and wing-tip flame scale 1.0, 1.3, 1.6, 2.0, keyed with an `ai/flare` each step).

## New designs, props and sounds needed

| Episode | New design or prop | New sound to measure into the whitelist |
|---|---|---|
| Library | Tall shelves on a rolling ladder rail, books that fall as real objects | none (`shhh` exists as a voice sound) |
| Cinema | Tiered seats with flip-up seats, a giant popcorn bucket, popcorn as many small pieces | a cinema seat flipping up (wooden clack); popcorn pattering |
| 6 am camping | Reuse the `lakeside-campsite` env and the dome tent from Pitch a Tent (#105), two sleeping bags | a tent zip (the most hated sound at 6 am) |
| Museum | Marble statue of a heroic potato on a plinth, rope barrier on posts, a "do not touch" pictogram | a velvet rope post wobbling (metal clank) |
| Gym | Treadmill with a belt that can come loose, a dumbbell rack, a bench | a treadmill motor whining up |
| Christmas morning | Tree with a light string, presents, wrapping paper as torn pieces | wrapping paper tearing |
| Brunch | Café terrace table with a parasol that can tear, espresso cups | an espresso machine hissing |

## Suggested posting order

1. **Library:** the biggest contrast (the quietest place, the loudest friend) and the clearest muted picture. Closest to the pilot.
2. **Cinema:** everyone knows that person in the row. The strongest pick-a-side question in the set.
3. **Gym:** a huge search word. Repost it in the first week of January (New Year's resolutions).
4. **Museum:** the "run or confess?" comment question.
5. **6 am camping:** reuses the campsite env and tent, so it's the cheapest build. Phoenix wins this one.
6. **Brunch after a late night:** post it on a Sunday.
7. **Christmas morning: post on Thursday 24 December.** German-speaking viewers open presents that evening and US viewers the next morning, so it lands for both.

Post on separate days so each episode gets its own test group (the series can alternate with the never-has-money series). Keep the title pattern, caption pattern and posting time the same, so the place is the only variable.

## Measure

For each episode at 24 h, 48 h and 7 days: views, average watch time, finish rate, and comments, shares and saves per 1,000 views (4 Nov baseline 0, 0.1 and 0.5). Also count comments that pitch a new place (does the series question work?) and comments that tag a friend or say "this is me" (does the friend type land?). Compare the finish rate with the pilot's 21.9%.
