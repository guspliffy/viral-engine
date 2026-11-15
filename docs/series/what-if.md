# "What if…": series format for episodes 02 onward (8 Nov 2026)

Jonny, 8 Nov 19:27: "i like all ideas write storyboards for them so i can provide you refference images". All ten pitches from 00-PITCHES.md are storyboarded in this folder, written by Opus 5.5 on xhigh. **Storyboards only: nothing is built or rendered until Jonny sends his reference images and says go. His panels win over these briefs** (`qa/panels.mjs` before any full render, feedback-copy-storyboard-panels).

The file numbers (01-10) are the pitch numbers Jonny saw. Episode numbers are given when an episode is scheduled. EP01 "Pause time" (storyboards/series/what-if/01-pause-time/, PR #180) is the pilot every episode copies.

## How to make the reference images

Each brief has a **ChatGPT image prompt (8-panel sheet)**, also collected in `ALL-IMAGE-PROMPTS.md`. Paste it with the reference sheets it names attached, in that order. The sheets are in project files `references/cast-sheets-v1/<name>-reference-v1.png`. One sheet per episode: 2 rows by 4 portrait panels, read left to right, top row first.

## What stays the same in every episode

1. **Exactly 19.0 s**, 9:16, 1080 × 1920 at 30 fps, whole frame sharp. The same beat grid every time (below), so viewers learn where the turn comes.
2. **Title:** "What if your <friend type> friend could <power>?" The friend type is the one that potato already plays in the account's other series.
3. **The power = one word + one sound + one look**, identical every time it fires, like EP01's HALT!, the tape-stop "tock" and the grey world.
4. **Three demos, each bigger than the last** (stair-step): one thing, then a bigger thing, then the 10x version. Each demo opens with a short burned-in **demo caption** in the same pattern (EP01: "Late for the photo?", "Late for coffee?", "40 minutes late?").
5. **No title card mid-video** (Jonny 9 Nov 2026 14:09 on EP02: the title "is the title of the video and should not appear mid video"; it lives in the in-app title only). The 10x moment plays straight through or in slow motion (a speed ramp, EP03), never a freeze with text. Its biggest frame, with no text on it, is the cover.
6. **The twist is one real fact** that turns the power against him, shown as a one-line **fact caption** ("Real fact: …"). Every fact is listed with its source at the end of 00-PITCHES.md; keep the wording as written.
7. **Ends on a question** to the viewer as a burned-in caption, then a hard cut. No loop needed, no outro.
8. **Friends react to each other** (glares, blame, overlapping gibberish), and the friend with the power is the subject who owns the front of frame.
9. **A commentator voiceover, on by default** (Jonny 9 Nov 2026 13:07: "make the voice over for this format default"). The engine voice `narrator` (the deep storyteller he picked: VoxCPM2 on Reaper's reference, "intrigued, mysterious, slow storyteller"), as in EP01's commentator cut (`make-pause-time.mjs --vo`, BOARD.md §5). Five or six short lines, each where nobody speaks: one per demo, "Sounds perfect, right?" over the 10x moment, the twist in a few words, and the closing question spoken (its caption stays). Each line subtitled like the others (not the 10x moment's), the best of 4 reads (Whisper hears it word for word, closest speaker match to his liked take). The last shot may hold up to ~1 s past 19.0 so the spoken question has room. The render farm sets up the narrator voice itself; a sound-only change is `--audio-only` on the farm's picture. Measure every narrator line with `qa/lines.mjs` before the render: +3 dB over the rest on a phone at least (set life's wind gusts can bury a line; lift its `gain`, lower `sound.ambience`).
10. **The narrator speaks the title first** (Jonny 9 Nov 14:25 on EP03: "the title of the video should be spoken out at the beginning of the video"): "What if your <friend type> friend could <power>?" from 0.0, subtitled under the in-app title band, over the frame-0 picture (EP03: the stare-down in slow motion for the read, then the demo at full speed). It replaces the troublemaker's opening line.
11. **The narrator sits on top of the mix** (Jonny 14:25: "the speaker is too quiet compared to the rest of the video"): every narrator line's momentary loudness in the final mix about 1-2 dB over the action's loud moments between the lines (their p90), while the biggest hits still peak a few dB above it. EP03: narrate gain 4.0 (lines -12.7 to -14.3 LUFS, action p90 -15.1, max -9.1); at 6-8 the voice drowned the action by 10-20 dB, at 1 or less the late lines sat 10-15 dB under it. **The wind stays under everything** (Jonny 9 Nov 16:10: "the wind is too loud"): outdoors with set life, `sound.ambience` about 0.06 with the voiceover (EP03: at 0.3 the wind bed alone was the loudest stem, over the narrator at each gust); check the stems, not only the mix.

## The beat grid (19.0 s)

| Time | Beat | Rule it serves |
|---|---|---|
| 0.00-0.90 | **Frame 0:** troublemaker and victim in a bright medium-wide, trouble already happening, the promise line spoken at 0.0 and subtitled, demo caption 1 on screen below the title band | reach rules B1 + B2, MrBeast frame 0 |
| 0.90-1.00 | **Snap 1:** the power fires for the first time and the picture breaks the promise line | Story Ladder snap 1 |
| 1.00-2.50 | Cut to the victim's face, a 0.6-0.8 s reaction. The thing he's about to lose is in the picture by 1.5 s | stakes by 1.5 s, B8 |
| 2.50-4.00 | **Demo 1 pays off** | stair-step 1 |
| 4.00-7.50 | **Demo 2** (demo caption 2) | stair-step 2 |
| 7.50-11.00 | **Demo 3 = the 10x version** (demo caption 3), its biggest moment around 10.0 (the cover, no text); slow motion allowed, no title card | stair-step 3, the wow |
| 11.00-13.50 | **Snap 2, the fake-out:** it really looks like it worked. Hold about a second of calm, music sweet | Story Ladder snap 2 |
| 13.50-16.00 | **The twist** (the real fact happens on screen), the loudest moment of the clip, with a breath before it | the payoff |
| 16.00-17.60 | **Fact caption** "Real fact: …" | kelano formula |
| 17.60-19.00 | **Closing question** caption, then a **hard cut at 19.00** | comment trigger |

EP01 ran 18.6 s with its title card at 13.5 s; EP02 and EP03 were built with a card at 10.0 s and had it taken out on Jonny's 14:09 note (EP03: the 10x blast in slow motion over 1.6 s, where the card's 1.0 s was, so the later beats keep their times).

## Rules every brief already follows

- **MrBeast pass:** each brief names its 10x version, its one wow moment (the only place to spend render time) and its frame-0 title check: every noun in the title is in frame 0. A bright frame 0 (daylight or full room light, faces at full key light), YAVG 110+/255 measured in DELIVERY.md. Reuse a set we already have.
- **Reach rules v2:** sound at 0.0 on the visual, music bed already running (a new style per episode), every gibberish line subtitled, the top 20% of the frame clear 0-2 s for Jonny's in-app title.
- **Template on:** anime look (cel + animeTiming), ink + satsuei, `"life": "auto"`, physics, hold 2, motion layer, sound guard. Real physics whenever something falls, flies or is knocked. Every change of place has a visible cause. No reaction signs drawn over characters. Phone shown to others: the edge hold. Any potato that gets eaten is alive.
- **Who builds:** the director thread (Opus 5.5 or Fable 5.1, xhigh) writes the generator, cameras, acting and every check window; Sonnet builders only make props, plates and benches. Fable review A (board + staging stills) and B (draft cut) from a fresh spawn. A new format shape sends Jonny an animatic first; these copy EP01's approved shape, so the animatic gate is Jonny's call per episode.

## Cast look lines (for the image prompts)

All: rounded golden potato bodies with a green leaf sprout and blush, mitten gloves with three fingers and a thumb.

- **Phoenix:** orange feather crest, cream-and-orange FEATHER wings, a little feather tail, brown eyes; never human, reptile or chicken.
- **Reaper:** charcoal hood and cape with a round silver clasp, tired half-lidded brown eyes; no scythe unless listed.
- **Wizard:** floppy purple pointed hat with a green sprout, purple cape, brown eyes; never a purple hood.
- **Viking:** orange hair, green eyes, cream fur shoulders, red tunic; no axe unless listed.
- **Samurai:** navy clothes, blue tied sash; his green-bladed sword only if listed.
- **Sorcerer:** purple pointed hood, purple eyes, a glowing green orb.
- **Dragon:** small orange MEMBRANE wings, a small tail, NO horns; not a dinosaur.
- **Astronaut:** white space suit, clear round bubble helmet.
- **Gunslinger:** curved brown cowboy hat with a green sprout, brown leather vest, red bandana, gold buckle, dark gloves and boots; NO guns, his hip pouch holds a flat brown wallet; one small fluffy cream moth with big dark eyes and feathery antennae.

## Post pack pattern (reach rules v2)

```
TITLE (TikTok text tool): <the episode title>
CAPTION:
<line 1: the situation in plain words> <one emoji>
Which one are you, <A> or <B>?
#funnyanimation #animation #<one situation tag>
POLL: Which one are you? / <A> / <B>
PLAYLIST: What if…
COVER: the 10x moment's biggest frame, no text (Jonny adds the title in-app)
```
Then the 1 h Studio check (For You eligibility, AI label) stays Jonny's step.
