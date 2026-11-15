# "My friend group trying to…": series format (4 Nov 2026)

Jonny, 4 Nov: a "friend group tries to do something" series like Moving One Sofa, because those were among the best performers on TikTok. He picked seven episodes: **IKEA wardrobe, cat under the bed, split the bill, pitch a tent, sneak in late, parallel park, and the Christmas tree** (for the holiday season). Moving One Sofa (clip 22, PR #70, posted 31 Oct) is the pilot.

**Jonny's eight-panel storyboards for all seven episodes (4 Nov 22:58) are in storyboards/<episode>/storyboard-eight-panels.png.** Each brief has a "Jonny's storyboard" section with the per-panel notes; sneak in late and Christmas tree were rewritten (v2) to follow his panels, and the earlier versions are in old/.

Every episode brief in this folder follows this page. When an episode brief and this page disagree, the episode brief wins. If Jonny makes storyboard panels for an episode, his panels win over both (run `qa/panels.mjs`).

## What made Moving One Sofa work (and what we keep)

- **One physical problem you get on mute in one second:** a sofa jammed in a doorway. Every episode opens on its problem already going wrong, never on the arrival.
- **Each friend tries their own way, and each try makes it worse:** brute force, then magic, then the calm one. The tries overlap and interrupt each other; it is never a neat one-after-another rotation (Jonny dropped that format on 25 Oct).
- **The quiet one solves it with one calm move** (Reaper's single scythe cut). That calm move is the satisfying beat people rewatch.
- **Conflict:** Jonny's v3 note "they just doing things" taught us that every failure needs a reaction from the others: eye rolls, a snicker, both pointing at each other, overlapping gibberish, Reaper sighing between them.
- **Gibberish lines get translation subtitles** (Jonny's v5 note), except the opening yelp.
- **Whole frame sharp** (v2: Jonny said "still not sharp"), and **a detailed, lived-in place** (Not Yet lesson: "still very simple", "no dust flying around"). Props that tear or break show real material, never white blobs.
- **The caption pattern** "my friend group moving one sofa". The word "one" makes the struggle funnier, so every title keeps it.

## What stays the same in every episode

**1. The same four friends, each a fixed friend type** (proposal for Jonny to adjust; it reuses the canon signatures and the reach-playbook types):

| Friend | Type | What they always do |
|---|---|---|
| **Wizard** | The one who's "done this a hundred times" | Goes first, confidently, with a spell. It always goes wrong (canon). Holds his staff. |
| **Viking** | The strong one who breaks things | Brute force, and the one who ruins it at the very end with something tiny and well-meant. No axe in any episode (domestic places), including shadows. |
| **Phoenix** | The one always on his phone | Plays a tutorial, reads instructions aloud, shines his flashlight, films it for his story. Same dark phone and case as Still Scrolling; we never see the screen. Same character as "The friend who never looks up", so the two series feed each other. |
| **Reaper** | The quiet one | Silent the whole time, glares at the others, sighs between them, then fixes it with one calm move. |

Guests only where the place needs one (the cat, the Samurai waiter). Four faces is the most a 9:16 wide can hold at 5.5 m and fov 56 (sofa lesson); never more than five on screen.

**2. The same story shape, at the same time codes.** All episodes are **exactly 10.0 s**. The last three beats are the series signature viewers learn to wait for.

| Time | Beat | What happens |
|---|---|---|
| 0.00–1.50 | **ALREADY GOING WRONG** | Frame 0 is the problem mid-failure, with full sound and all four faces in a wide. Wizard's gibberish yelp at 0.05 (sound only, no subtitle). No extra cut before 1.5 s. Muted, a viewer knows the task by 1.5 s. |
| 1.50–5.50 | **IT GETS WORSE** | Two quick tries from Wizard, Viking or Phoenix, each worse than the last, overlapping. After each failure, a reaction from the others: eye roll, glare, pointing at each other, overlapping gibberish with subtitles. Each try is one habit real people have doing this task. |
| 5.50–7.20 | **THE CALM FIX** | Reaper, silent until now, steps in and does one calm, simple thing. It works perfectly. A 3-frame hit-stop on the moment it clicks. The others' jaws drop. |
| 7.20–8.00 | **WE DID IT** | All four cheer together: arms up, a group hug or a high-five (close but never intersecting). The music lands on a big major chord. Hold the success long enough to believe it. |
| 8.00–9.00 | **THE TINY UNDO** | Viking does one tiny, well-meant thing (a proud pat, a lean, a sneeze, a helpful hand) and it undoes everything. **The series sound logo plays on the undo: a two-note "dö-döm"** (Jonny's word, the same sting every episode). The music cuts out on the "döm". The cause must be visible: the thing that breaks was set up on screen earlier (world logic). |
| 9.00–10.00 | **THE GLARE** | Everything is back to the start or worse. Wizard, Phoenix and Reaper turn their heads slowly to Viking, one after the other. Viking freezes mid-gesture with a tiny sheepish grin. Room tone only. **Hard cut at exactly 10.00** on the glare. No outro. |

**3. The same posting pattern.**
- In-app title (Jonny adds it with TikTok's text tool): **"My friend group trying to <do> one <thing>"**. Plain search words. Keep the top 20% of the frame clear from 0 to 2 s; nothing is burned in except translation subtitles after 2 s.
- Caption line 1 matches the title, then **"Tag the friend who always ruins it at the end"**, then the series question **"What should they try next?"** (it asks viewers to pitch episodes, which is our missing comment trigger). An episode may swap the question for a stronger pick-a-side question; the brief says so.
- Exactly 3 hashtags: #funnyanimation #animation + one situation tag. Never #viral or #fyp.
- **Cover frame: always the GLARE at 9.6 s.** It shows the failed task plus three faces glaring at Viking, so the grid reads as one series.

## What changes every episode

The place (one layered painted env each), the problem, the tries, Reaper's calm fix, Viking's tiny undo, and the music (a different style, key and tempo every time, per Jonny's music-variety rule).

## Rules every episode follows (from project memory)

- **Hook:** frame 0 is already action with full sound. Full faces, a wide shot and visible motion. It makes sense muted by 1.5 s.
- **Sharp frame:** no depth of field (FOCUS=false, or focusBand 0.7). Separate characters from the background with light and contrast, not blur.
- **Place:** a layered painted environment (set type `env`, PR #92) per place, about 3 minutes to make. Prompt for potato scale ("low ground level view, … fills the bottom"). Real 3D geometry wherever a character or prop touches something. Stay inside the env's safe camera range (about 0.9 m sideways and 4 to 10° of turn): no reverse angles. Painterly, Ghibli-like mood, our own look. Lived-in detail, dust in the air, dust and debris bursts on every hit. Every change of place, direction or state has a visible cause.
- **Interiors:** five of the seven places are rooms, and the env system was built and tested on an outdoor meadow. Try the env first. If the coverage check or the look fails, fall back to a painted plate plus 3D room geometry, as planned for Bonfire Night. The tent and parking episodes are outdoors and are the safe first builds.
- **Look:** castLook "sheet" (hatched). Preserve the approved designs in references/cast-sheets-v1/. Clean anime linework, cel shadows, crisp faces.
- **Hands and contact:** 3-finger + thumb gloves. Every hand contact touches its object with no gaps and no passing through. Group hugs and high-fives stay close but never intersect; arms wrap round the side. The contact and rig checks (#88, #94) and the env coverage check must pass before any full render.
- **Hit-stops and faces:** two 3-frame hit-stops per episode (the worst failure and the calm fix). Strong faces with long holds (lab picks).
- **Sound:** music under the whole clip with `music.lowCut` around 150 Hz; check `qa/sound.mjs <sb> --phone`. Only whitelisted sounds or Jonny's words (splort, dö-döm, bonk). Voices are gibberish (Kokoro: Phoenix A, Reaper A, Wizard B) with translation subtitles after 2 s: classic style, 62 px, y 470, lines take turns.
- **Nobody gets hurt.** A bonk on the head is fine; nothing breaks on a body, no fire on anyone, no car crash.
- **Workflow:** start from storyboards/templates/clip-template.mjs. Fable reviews the storyboard and the cut. Merge only on Jonny's "merge it".

## Build tip: make the ending once

Build the 7.20–10.00 block as one shared module (for example storyboards/series/friends-try-to/ending.mjs) that takes the four positions, the cheer pose, the undo callback and the camera. The cheer, the "dö-döm" sting, the music cut and the three-head glare are then frame-identical across the series, and each episode only builds 0 to 7.2 s plus its undo.

## New designs and props needed

| Episode | New design or prop | Notes |
|---|---|---|
| IKEA wardrobe | Flat-pack wardrobe | Panels hinged at the corners so it can rack sideways and fold flat. Generic: no brand logo, no real product name on screen. |
| Cat under the bed | The cat | Round, fluffy, grumpy cartoon cat in our linework, a bit smaller than a potato. Recurs as a cameo in the tree episode. |
| Split the bill | Long paper bill, café set | Samurai as the waiter (no sword). |
| Pitch a tent | Dome tent with poles | Cloth that billows and collapses. |
| Sneak in late | Mom (never shown) | Only the light under her door, her snore and her shadow. |
| Parallel park | Small hatchback | Reuse the Car Crash car if it fits; no real brand. |
| Christmas tree | Tree, light string, star | The light knot as one rig that can unwind into a spiral. |

## Suggested posting order

1. **IKEA wardrobe:** Jonny's favourite and the closest sequel to Moving One Sofa. #ikea is a huge search word.
2. **Pitch a tent:** outdoors, so it's the safest env build, and the tent blowing away is pure muted slapstick.
3. **Cat under the bed:** cats are one of the biggest audiences on TikTok, and the cat becomes a recurring cameo.
4. **Split the bill:** the strongest comment trigger in the set (split equally or pay for what you ate?).
5. **Parallel park:** outdoors; the car rig is the most work.
6. **Sneak in late:** a night interior, the hardest light.
7. **Christmas tree: post on Saturday 28 November**, the day after US Thanksgiving and the eve of the first Advent Sunday (29 Nov), when both the US and DACH start putting up trees. Build it in the week before. If more slots are free in December, a repost with a new hook works well there.

Post them on separate days so each gets its own test group (the series can go out on consecutive days between other clips). Keep the title pattern, caption pattern and posting time the same, so the episode is the only variable.

## Measure

For each episode at 24 h, 48 h and 7 days: views, average watch time, finish rate, and comments, shares and saves per 1,000 views (baseline 0, 0.1 and 0.5). Also count comments that suggest a new task (does the series question work?) and comments that name Viking or tag a friend (does the fixed undo friend work?).
