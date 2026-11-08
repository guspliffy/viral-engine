# Workflow: roles, gates and the order of work

Adopted from Jonny's motion studio kit on 8 Nov 2026 (copy: `/mnt/project-files/engine/motion-studio-kit/`),
adapted to this engine. Files are the shared memory: every agent starts empty, so anything not in a file is
re-explained and re-paid. Keep CLAUDE.md <= 60 lines and docs/STATE.md <= 40 lines.

## Roles

| Role | Who | Model, effort | Does |
|---|---|---|---|
| Director | the thread's own session | project default (Opus 5.5, high) | plan, briefs, integration, checks, review, PR, delivery; no bulk code |
| Creative director | `creative-director` | Fable 5.1, **xhigh** (Jonny, 8 Nov) | reviews A and B, writes BOARD numbers when asked; never code |
| Builder | `builder` | Sonnet 5.5, high (Jonny, 8 Nov) | one specced task: a clip generator from a BOARD, a props file, an env set |
| Senior builder | `builder` with model opus, effort high | Opus 5.5 | rig, physics, shaders, VFX, render pipeline, timeline, new checks, bug fixes in existing systems |
| Reviewer | `reviewer` | Opus 5.5 | fresh-eyes review of engine PRs only (engine/, qa/, render.yml, storyboards/lib/) |
| Code locator | `Explore` | Haiku 5.5 | sweeps across many files |

Spawning: when the repo's agent types are loaded, use them by name (`subagent_type: "creative-director"` etc.). When
they aren't (the repo root isn't registered), spawn a general-purpose agent with the role's model and effort
(creative director: `model: "fable"`, `effort: "xhigh"`; builder: `model: "sonnet"`, `effort: "high"`) and start its prompt with
"Follow .claude/agents/<role>.md in /path/to/viral-engine". Never spawn an untyped agent without a model: it runs on
Opus. At most three builders at once. Small edits (under ~15 lines in a file you already hold) you make yourself:
a spawn costs more than the edit.

## Gates (Jonny signs off each one)

- **Gate A, brief**: Jonny's brief (ENGINE-PROMPT, video-scripts, storyboard panels) or a BOARD.md he approved. No
  renders before his go when he said so for a series.
- **Animatic gate, new series or new formats only**: the draft render (`--draft`: real timing, draft look, scratch
  sound) goes to Jonny before any polish or full render. Episodes of a series that is already running skip it.
- **Look gate, new characters, sets or looks only**: 2-3 style frames (draft stills at the final look), checked by the
  creative director against the design, then Jonny. An existing look skips it.
- **Delivery gate**: full render + checks + review B, the gate report + post pack, Jonny's go, PR, "merge it" only
  when every check on the head is green.

## Briefs and the work loop with builders

1. **Plan**: cut the work into tasks of ~30-200 changed lines with disjoint file ownership (one generator, one
   `props-<x>.js`, one env). Shared files are the director's: `storyboards/lib/*`, `engine/page/stage.js`, the
   `props3d.js` registry/imports, `qa/*`, templates. A plan for Jonny shows one line per task (agent, model,
   minutes), what it saves and which risk it guards, and waits for "go" when it changes the engine.
2. **Brief** each builder with `docs/templates/BRIEF.md`. Point to sources (BOARD sections, panel numbers, file
   paths) instead of paraphrasing them. A vague brief costs a build, a review and a fix round.
3. **Dispatch** independent tasks in one message; don't wait idle (review finished tasks or write the next brief).
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
