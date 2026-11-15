# "The friend who never looks up": series format (4 Nov 2026)

Jonny, 4 Nov: make "the friend who never looks up" a recurring format so viewers recognise the characters, with big events around him. He picked five episodes: **dinosaur, plane turbulence, alien abduction, shark and zombies**. Still Scrolling (posted 26 Oct, redone 4 Nov as PR #87) is the pilot: it had the best engagement on the account (14 likes, 1 share and 1 save on 239 views).

Every episode brief in this folder follows this page. When an episode brief and this page disagree, the episode brief wins. If Jonny makes storyboard panels for an episode, his panels win over both.

## What stays the same in every episode

**1. The same friend.** Phoenix is the friend who never looks up, exactly as in Still Scrolling:
- He holds one ordinary dark phone in the same case colour as Still Scrolling (the phone `case` in storyboards/home/make-still-scrolling-redo.mjs), in portrait, at chest height. One mitten holds it and the thumb scrolls (grip `scroll`).
- His head is bowed about 20°, his lids are half lowered, and his face is lit by a cool white-blue phone glow. His wings stay folded (span 0) while he's seated.
- **We never see the screen.** Only the glow. "What is he even watching?" becomes a running comment question.
- **Wing save (series signature):** whenever what he sits on disappears, his wings flick open and he hovers in the same seated pose, still scrolling, without looking. It's the Still Scrolling stool gag, and it appears in the dinosaur, alien and shark episodes.

**2. The same friends.** Wizard is the one who tries to warn him and always messes it up (his canon signature). Reaper is the quiet one: calm the longest, and the one who glares at Wizard. One guest per episode fits the place: Viking (dinosaur), Samurai (plane), Astronaut (alien), the zombie horde (zombies). Shark has no guest.

**3. Conflict between the friends.** In every episode the friends react to each other: Wizard grabs, shoves or snatches, Reaper glares or shushes him, and their gibberish overlaps. Nobody reacts to Phoenix with anger he notices.

**4. The same ending, at the same time codes.** This is the part viewers learn to wait for. All episodes are **exactly 10.0 s**.

| Time | Beat | What happens |
|---|---|---|
| 7.00–8.00 | PEAK | The threat is at its closest and most absurd, about 20 cm from his phone. Episode-specific. |
| 8.00–9.00 | LOOK-UP | **The same framing every episode:** a medium close on Phoenix from his front-left at three-quarters, at his eye level, with the threat filling the upper background. Everything freezes like a held breath, both the threat and the friends. The music cuts to one held note; the ambience stays. At 8.05 his eyes lift and his head tilts up 8°. The phone doesn't move and his thumb stops. At 8.35 he blinks once, slowly. At 8.50 he says a flat, unimpressed **"huh."** (Phoenix voice A, small and dry, not surprised). Burned-in subtitle **"huh."** in the lower third from 8.50 to 9.00. |
| 9.00–10.00 | BACK DOWN | At 9.00 his eyes drop back to the phone and his head returns. At 9.15 comes **the ping** (the same notification sound as Still Scrolling, sfx `notify`, the series sound logo). He gives a tiny smile, his thumb scrolls again, and the music snaps back in on the ping. From 9.20 the threat gives up in its own way: this is the resolution, and it changes every episode. **Hard cut at exactly 10.00.** No outro. |

**5. The same sound logo.** The ping plays exactly twice per episode: once in the setup (about 2.7 s, with a tiny smile, so the viewer learns he's hooked) and once at 9.15. Never anywhere else.

**6. The same posting pattern.**
- In-app title: **"The friend who never looks up from his phone…"** plus the episode's plain situation ("…even when a T-rex shows up"). Jonny adds it with TikTok's text tool, so the top 20% of the frame stays clear from 0 to 2 s and nothing is burned in except "huh.".
- Caption line 1 matches the title, then "Tag the friend who'd still be scrolling", then the series question **"What should finally make him look up?"**. That question asks viewers to pitch the next disaster, which is the comment trigger the account is missing, and their answers feed later episodes.
- Exactly 3 hashtags: #funnyanimation #animation + one situation tag.
- **Cover frame: always the LOOK-UP at 8.5 s.** On the profile grid the series then reads as a set: the same face and the same framing, with a different disaster behind him.

## What changes every episode

The place (one layered painted env each), the threat, the guest friend, the music (different style, key and tempo every time, per Jonny's music-variety rule), the setup gags, the PEAK and the way the threat gives up.

## Rules every episode follows (from project memory)

- **Hook:** frame 0 is already action with full sound, and the threat is visible in frame 0. A friend's gibberish yelp at 0.05 s (sound only, no subtitle). Full faces in a wide shot, no extra cut before 1.5 s. It must make sense muted by 1.5 s.
- **Sharp frame:** no depth of field (FOCUS=false, or focusBand 0.7). Separate the characters from the background with light and contrast, not blur.
- **Place:** a layered painted environment (set type `env`, PR #92) per place, about 3 minutes to make. Real 3D geometry wherever a character or prop touches something. Stay inside the env's safe camera range (about 0.9 m sideways and 4 to 10° of turn): no reverse angles. Painterly, Ghibli-like mood, our own look. Every change of place, direction or state has a visible cause (world logic).
- **Look:** castLook "sheet" (hatched). Preserve the approved character designs from references/cast-sheets-v1/. Clean anime linework, cel shadows, crisp faces.
- **Hands and contact:** 3-finger + thumb gloves. Every hand contact touches its object with no gaps and no passing through. Bodies close together never intersect. The contact and rig checks (#88, #94) and the env coverage check must pass before any full render.
- **Sound:** music under the whole clip, with `music.lowCut` around 150 Hz so it carries on phone speakers; check `qa/sound.mjs <sb> --phone`. For a hover, use `sound.flaps: false` (the soft wings bed), because the automatic wing flaps are loud and bassy. Only whitelisted sounds or Jonny's words (splort, dö-döm, bonk). Voices are gibberish except Phoenix's "huh.".
- **Nobody gets hurt.** It's cartoon peril: no blood, no bites that land, no crash, no fire on anyone, and every threat leaves or gives up. Real disasters and crashes are what the platforms hold back, so the threat stays goofy and the ending stays harmless.
- **Workflow:** start from storyboards/templates/clip-template.mjs. Fable reviews the storyboard and the cut. Run qa/panels.mjs if Jonny sends panels. Merge only on Jonny's "merge it".

## Build tip: make the ending once

The 8.00–10.00 ending is the same in all five episodes. Build it as one shared block (for example storyboards/series/never-looks-up/ending.mjs) that takes the camera target, the threat and a resolution callback. Then every episode only builds 0 to 8 s plus its 1-second resolution, the ending stays frame-identical across the series, and the frame cache can reuse more of it.

## New designs needed

| Episode | New design | Notes |
|---|---|---|
| Dinosaur | T-rex | Chunky, rounded and cartoonish, cute-menacing rather than scary, in our linework and cel shading. Big readable eyes. |
| Plane | Cabin interior, oxygen masks | Neutral airline: no real livery, logos or names. |
| Alien | Saucer, the little green-bean alien | The alien is a small green bean with big glossy eyes and the cast's mitten gloves, which fits our vegetable world. The saucer is silver with a ring of warm lights. |
| Shark | Shark | Round, soft blue-grey and toy-like, with rounded teeth like a plush toy and a big hopeful face. |
| Zombies | Horde | Cast members in zombie skin (the `skin` action and costume.zombie from Then I'm a Zombie Too): grey-green skin, ragged clothes, half-lidded eyes, arms forward. No gore. |

## Suggested posting order

1. **Dinosaur:** the strongest picture, and an outdoor env like the meadow demo.
2. **Shark:** bright and summery, and it reuses the wing save.
3. **Zombies:** reuses the zombie skin from Then I'm a Zombie Too.
4. **Alien:** the night env and two new designs.
5. **Plane:** the hardest, because the env system was built for outdoor places (see that brief).

Post them on separate days so each one gets its own test group. Keep everything else the same between them (title pattern, caption pattern, posting time) so the episode is the only variable.

## Measure

For each episode at 24 h, 48 h and 7 days: views, average watch time, finish rate, and comments, shares and saves per 1,000 views. Also count how many comments suggest a new disaster: that tells us whether the series question works.
