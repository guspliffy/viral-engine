# Workflow: roles, gates and the order of work

Adopted from Jonny's motion studio kit on 8 Nov 2026 (copy: `/mnt/project-files/engine/motion-studio-kit/`),
adapted to this engine. Files are the shared memory: every agent starts empty, so anything not in a file is
re-explained and re-paid. Keep CLAUDE.md <= 60 lines and docs/STATE.md <= 40 lines.

## Roles

| Role | Who | Model, effort | Does |
|---|---|---|---|
| Director | the thread's own session | Opus 5.5, **xhigh** (project setting) | plan, PANELS.md, **the clip generator (staging, camera, acting, timing)**, briefs, integration, checks, review, PR, delivery |
| Creative director | `creative-director` | Fable 5.1, **xhigh** (Jonny, 8 Nov) | reviews A and B, writes BOARD numbers when asked; never code |
| Builder | `builder` | Sonnet 5.5, high (Jonny, 8 Nov) | one specced task with exact numbers: a props file + its bench, a painted plate or env set, a grip test, a sound pick list, a mechanical fix the director measured. **Never a clip generator, a camera or the acting** |
| Senior builder | `builder` with model opus, effort high | Opus 5.5 | rig, physics, shaders, VFX, render pipeline, timeline, new checks, bug fixes in existing systems |
| Reviewer | `reviewer` | Opus 5.5 | fresh-eyes review of engine PRs only (engine/, qa/, render.yml, storyboards/lib/) |
| Code locator | `Explore` | Haiku 5.5 | sweeps across many files |

Spawning: when the repo's agent types are loaded, use them by name (`subagent_type: "creative-director"` etc.). When
they aren't (the repo root isn't registered), spawn a general-purpose agent with the role's model and effort
(creative director: `model: "fable"`, `effort: "xhigh"`; builder: `model: "sonnet"`, `effort: "high"`) and start its prompt with
"Follow .claude/agents/<role>.md in /path/to/viral-engine". Never spawn an untyped agent without a model: it runs on
Opus. At most three builders at once. Small edits (under ~15 lines in a file you already hold) you make yourself:
a spawn costs more than the edit.

## Why the director writes the clip (8 Nov 2026 head-to-head)

Never Has Money EP03 was built twice from the same brief and panels. The new-workflow cut came out faster but Jonny
judged the old one better in quality and logic. Two causes, so two rules:

1. **The staging was frozen before anyone looked at a frame.** The BOARD was written in 10 minutes and three builders
   started at once. Its camera, looking across the bar from the bartender's side, hid the cast behind the bar. The
   friends' getaway was "two heads sliding behind a bar" (review B), the peek didn't show the empty seats, and the
   friends in the window were small and half covered. The old thread tried its staging in layouts and stills first,
   and gave each departure from the panels a reason tied to what the frame must show. For example, it stood the
   friends at a belly-high table so the faces sit level in the two-shot, and raised the street 45 cm so the friends
   show above the heads.
2. **The story logic was delegated.** A Sonnet builder wrote the whole generator, and that is where the logic gets
   made: who looks where and why, what the viewer must see before the next beat, cause and effect. The old thread made
   those calls itself, for example a glance up to the window so the viewer finds the friends, and the empty table seen
   from the peek.

So the clip is written by the director, Opus 5.5 at xhigh, never by a builder (Jonny, 8 Nov). Builders make the
parts that have a right answer someone else can check: props, plates, benches and measured fixes.

EP04 "your birthday" was then built three ways: the old workflow, v2 with the director writing, and v2 with Fable 5.1
xhigh writing (old 338 min / $64, director 323 min / $73, Fable 527 min / $169). Jonny (9 Nov): Fable as writer is
out, its cut isn't better by enough for 2.3x the cost. The director's cut has the better cut and scene management,
but the old cut has cleaner hands, and the director's hug spins Gunslinger's face away from us. The rules for both
are in "The story chain" and "Check windows" below. Fable stays the creative director (reviews A and B at xhigh).

## Gates (Jonny signs off each one)

- **Gate A, brief**: Jonny's brief (ENGINE-PROMPT, video-scripts, storyboard panels) or a BOARD.md he approved. No
  renders before his go when he said so for a series.
- **Animatic gate, new series or new formats only**: the draft render (`--draft`: real timing, draft look, scratch
  sound) goes to Jonny before any polish or full render. Episodes of a series that is already running skip it.
- **Look gate, new characters, sets or looks only**: 2-3 style frames (draft stills at the final look), checked by the
  creative director against the design, then Jonny. An existing look skips it.
- **Staging proof, every clip, before any builder starts** (director + creative director, about 30-40 min): write
  PANELS.md, with one row per panel and a reason for every departure, and the story chain (below). Block the clip in
  the generator: cast, camera per shot, set from boxes or existing props, placeholder props at their real sizes.
  Render the draft stills at one time per panel, run `qa/panels.mjs` against Jonny's board, and get review A on those
  stills plus the panels. Fix staging until review A has no note that a story beat can't be seen. Only then write the
  BOARD's numbers and brief the builders: they build to proven positions, not guessed ones.
- **Delivery gate**: full render + checks + review B, the gate report + post pack, Jonny's go, PR, "merge it" only
  when every check on the head is green.

## Briefs and the work loop with builders

1. **Plan**: cut the work into tasks of ~30-200 changed lines with disjoint file ownership (one `props-<x>.js`,
   one plate or env, one bench). The generator is the director's. Shared files are the director's: `storyboards/lib/*`, `engine/page/stage.js`, the
   `props3d.js` registry/imports, `qa/*`, templates. A plan for Jonny shows one line per task (agent, model,
   minutes), what it saves and which risk it guards, and waits for "go" when it changes the engine.
2. **Brief** each builder with `docs/templates/BRIEF.md`. Point to sources (BOARD sections, panel numbers, file
   paths) instead of paraphrasing them. A vague brief costs a build, a review and a fix round.
3. **Dispatch** independent tasks in one message; don't wait idle (review finished tasks or write the next brief).
   This box has 4 cores: only one job at a time may run layout, preflight or a render (a layout pass went from ~2 to
   7-10 min with three builders sharing it). Props benches, plates and sound picks can run beside it. Full renders go
   to the render farm.
4. **Verify** yourself: `node qa/preflight.mjs <sb>`, `--layout`, the draft stills contact sheet at half scale. Read
   only the tails of outputs.
5. **Review the diff**, not the files: `git diff --stat`, then `git diff -- <task files>`. Check the DONE WHEN list,
   nothing outside OWN, determinism, Jonny's rules (docs/rules/*), and accept or reject each listed assumption.
6. **Fix**: numbered fixes to the same builder (SendMessage keeps its cache warm), two builder rounds at most; after
   that the spec was wrong, so re-spec or fix it yourself. Check-fix rounds on a clip stay at 3 (step 4 below).
7. **Commit** each approved task on its own: `git commit -m "T<id>: <summary>"`.

The creative director is called once per gate, never per task: collect every open design question and send one
batch (current state in 1-3 lines, numbered questions, constraints, which BOARD sections to fill). It answers with
numbers (frames, seconds, hex, px at 1080x1920, metres), not adjectives.

## The story chain (in PANELS.md, checked at the staging proof and in review A and B)

Write the clip as a chain of beats, one line each: **what happens -> what the viewer must see for it to read -> the
shot that shows it**. Every cause is on screen before its effect, and every place change has a visible path. EP03's
chain, for example:
- the friends decide (a nod, both faces), then they leave (coats on, walking out, readable size);
- he peeks, and we see what he sees (the empty seats in the same frame);
- the bill comes from somewhere (the bartender picks up the reader before he pushes it);
- the friends outside are found because he looks there.

A beat whose "must see" is hidden by the set, too small at 360 px or off frame fails the chain. Fix it by re-staging
(camera side, positions, a cut). It is never a note "on the brief", and it never waits for the next cut.

**The payoff keeps its faces to us, start to end.** In EP04 (director's cut) the hug was staged so both faces were
3/4 to us, then a 1.6 s "happy sway" turned the pair until Gunslinger's face left the camera for most of a second,
and the wink after it sat under his hat brim. Viking's face in the hug was in profile, one eye showing. The checks
passed because a `see()` window counts a face as seen up to about 78° off camera (`VISIBLE.facing` 0.2 in
`qa/framing.mjs`), and the sway's window didn't list Gunslinger's face at all. So:
- every `see()` window from the payoff's first frame to the end lists the faces that carry it, including the moves
  between shots;
- a turn, spin or carry never takes a payoff face past 3/4 (about 45° off camera) while it is on screen; when a
  later beat needs a back to us (a wink over a shoulder), cut to it;
- a face under a hat brim, a hood or a hand during its line or its reaction is not seen; look at the 15 fps strip of
  every payoff beat, and say in PANELS.md which way each payoff face turns.

## Hands: every move gets the frames its distance needs (EP04, 9 Nov)

Jonny on EP04: "old has cleaner hand movements and hands are less glitchy". It was not the engine: the old branch's
anime-timing fix, applied to the director's clip, moved its hands by 2° at most. It was how the hands were written.
The director's cut had 12 frames where Gunslinger's hand turned over 60° against the old cut's 4, at the beats
everyone watches: "And yours?" (1.2 s), the pocket slap (1.6 s), the coupon reveal (4.0 s) and the hug (5.6-6.1 s).
Most are hand jumps: a hand sent 24-68 cm in 2-3 frames; the palms-up turn on "And yours?" flips both hands 81° in
one frame (`qa/handcause.mjs` in PR #128 names the cause of each pop).
- A hand move gets at least one frame per 10 cm it travels: a 66 cm reach is 7 frames (0.23 s), not 0.08 s.
- Go straight from one hold to the next. Dropping a hand to `rest` and taking the next hold 0.06 s later sent the
  left mitten 68 cm and back in 3 frames (the coupon reveal).
- A palm turn (palms up for "And yours?", a flip onto a prop) spreads over 6-8 frames, the same palm side through it.
- Every hand-pop on a subject's hand on screen is fixed before the full render, even under the 90° flip gate.
  "Fine if hidden" means hidden: off frame, behind a body, or smeared by a fast move, as the check says.

## Check windows (`allowClip`): only the director adds them

In the 8 Nov head-to-head, the new-workflow cut had 8 check warnings against the old cut's 32, yet it showed more
glitches. Its builder had added 41 windows, against the old cut's 25, and several of them waived contact on screen.
Gunslinger squeezed through a toilet door narrower than his body, in and out, because the BOARD had guessed it at
0.5 m. The old cut built that door 1.25 m wide because the hat brim is wider. The Samurai also had a hand-and-arm
waiver for the whole clip.
- A window may cover only (a) contact the beat needs, like a hand on what it holds or a hug, or (b) a moment no
  camera sees, like inside the shut toilet or off frame on a cut. Never a body through a door, a wall, furniture or
  another body on screen: resize the prop or re-stage.
- A hand flip (`hand-turn`), a rig jump or a foot slide on screen is never waived: change the move (see "Hands"
  below). In EP04 the director's cut waived two hand flips on screen; the old cut waived none.
- Only the director writes windows. A builder reports the fail instead.
- The delivery lists every window that is on screen, with its 15 fps strip. When clips are compared, count those
  windows next to the warnings.

## The order of work for a clip: creative review and cheap checks first, then the full render

1. **Layout + draft stills** (about a minute): `node engine/render.mjs <sb> --layout`, then
   `node engine/render.mjs <sb> --stills beats --draft --safe`. Look at them scaled down (≤ 360 px wide).
   `node qa/motion.mjs <sb>` (under a second) finds hands, bodies or wings that jump between two frames, straight
   from the storyboard. Fix those before any render. `--layout` also prints the contact results (overlap, grips,
   arms through staffs or brims, hand pops), and fixes for them come first too. Look at a 10–15 fps draft strip of
   every grab, release, raise and contact. `node qa/readability.mjs <sb>` (about a minute) warns when a character
   melts into the set or into another character at a beat, and draws each beat as a frame with the lost outline in
   red above all characters as black silhouettes: a pose that doesn't read in black won't read in a feed.
   `node qa/colour.mjs <sb>` (about 35 s) warns when a beat's light turns a character's own colours into others
   (Delta E 2000 against the character file, per beat).
2. **Creative director review A (storyboard)**: Fable (`.claude/agents/creative-director.md`, effort xhigh) reviews the storyboard, a contact sheet of the draft stills and
   the readability sheet.
   See `qa/REVIEW.md`. **Default for every new clip**, one round. Give it Jonny's brief: the brief wins, and
   notes against it are dropped without a round. Apply the notes, then go to step 3.
3. **Draft render + checks** (~2 min): `node engine/render.mjs <sb> --draft`, then
   `node qa/check.mjs out/<id>-draft.mp4 --sb <sb> --layout out/<id>.layout.json`.
4. **Fix loop**: fix what failed, then repeat step 3. **At most 3 rounds.** If it still fails after the third, stop
   and send Jonny the check output and what you tried. Warnings don't block, but mention them.
5. **Full render** on GitHub's free runners (`gh workflow run render.yml -f storyboard=<sb>`, see below) or in the
   background here (fetch the branches again right before it), `qa/check.mjs --ears` on the final MP4
   (earshot listens: hits on their frame, footsteps on the right floor),
   a 15 fps strip of every contact moment, then **creative director review B (cut)**
   on its contact sheet, cut strips and phone sheet (`node qa/contact.mjs <clip> --sb <sb>`, then `--cuts --phone`), one round. Apply the notes that are cheap
   (timing, framing, captions) and re-render once. Bigger ones go into the next cut or to Jonny.
6. **Deliver** (see "Delivery" below): the MP4, its cover and a `DELIVERY.md` next to it with the one-line check result and Fable's notes in one line each, marked
   applied or not, plus the five timestamps to check with headphones (`node qa/risky.mjs <clip> --sb <sb>`) and the
   viewer read ("would you finish, where would you stop") from review B, and the twelve self-review answers
   (`qa/REVIEW.md`, "Delivering a clip"). For a motion change, add a labelled close-up strip of the moments that changed. Don't post anywhere: Jonny posts by hand.

Fable is the creative director, Jonny is the producer: premise, characters, look, and anything that needs new art
are his call. Skip the reviews only for pure engine tests, and say so.

## Delivery: the gate report

The message to Jonny is the gate report, at most 200 words, plus the post pack. Everything longer (the
self-review's twelve answers, Fable's notes, `qa/risky.mjs` timestamps, check tails, warnings with reasons) goes into
`DELIVERY.md` next to the video in the project files, and is attached.

```
WATCH: <video path> (+ close-up crop)
CHANGED: <up to 5 bullets>
BROKEN / UNKNOWN: <warnings left, what Claude can't judge (sound)>
DECIDED (reversible): <choices made without asking>
QUESTIONS: <numbered, each with a default>
POST PACK: title, caption (line 1 situation, line 2 "Which one are you..."), #funnyanimation #animation +1 tag,
comment poll, playlist + slot (reach rules v2)
```

## Measuring the new workflow

Jonny asked (8 Nov) to try it on the next episode and compare its time and tokens with the last one. For each clip
made this way, add one line to docs/STATE.md "Trial": wall-clock minutes from brief to delivery, the thread's
context tokens at delivery (`get_session`), the subagents' token totals from their results, and fix rounds used.
