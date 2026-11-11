# Workflow: roles, gates and the order of work

Adopted from Jonny's motion studio kit on 8 Nov 2026 (copy: `/mnt/project-files/engine/motion-studio-kit/`),
adapted to this engine. Files are the shared memory: every agent starts empty, so anything not in a file is
re-explained and re-paid. Keep CLAUDE.md <= 60 lines and docs/STATE.md <= 40 lines.

## The eight rules: every video cheaper or better than the last (Jonny, 10 Nov 2026)

Jonny: "our videos just get more and more expensive without significant rise in quality, this should change". No
fixed budget per video (length and new things differ too much): the workflow removes wasted work, and the waste is
counted the same way every time. Where a section below says otherwise, these eight win.

1. **Fixed order, no skipping back.** Story outline, staging stills, rough draft, Jonny's OK, polish, checks on the
   draft, one full render, delivery. A step back is named with its reason in the clip's notes. For the first clip of
   a new series the outline is six lines of "X, so Y, so Z" and goes to Jonny before anything is built (Fight, Flight
   or Freeze 01: three of five drafts rebuilt the story, about a third of its cost).
2. **Decide first, polish last.** The rough draft (`--draft`: story, timing, cameras, captions; only fails that hide
   a beat are fixed) goes to Jonny before any hand or foot polish, on every clip. Nothing is polished that he might
   still cut; a retiming after polish breaks the hands again (Share or Steal EP01). His OK on the draft replaces
   review B. Send it and end the turn: no polish while it waits.
3. **Look a name up once.** The vocabulary sheet and the clip's notes come before any search of the engine, and a
   name found by search goes into the notes (Survive it EP1: about 230 of 853 steps were lookups).
4. **Batch, don't loop.** Fit all cameras in one pass (`node qa/camfit.mjs`), then lay out once; fix every finding of
   a check run before the next run (Survive it EP1: 40 layout runs for 8 panels).
5. **Two rounds, then restage.** A hand, foot or contact finding that survives two fix rounds gets a simpler grip,
   another camera or a cut that hides it, not a third round of tuning (Share or Steal EP01: 20 check rounds).
6. **Prove new things small.** A new prop a hand holds passes the grip bench, a new flash or effect a one-second
   draft (`--draft --from --to`), a new set its own preflight, before it enters the clip.
7. **One full render, no waiting steps.** Strips, cut sheets and flash checks run on the draft. A second full render
   needs its reason in DELIVERY.md. Start a render with one background command and end the turn; titles, merges and
   post packs happen in a short thread, not in the clip's long one (every step there re-reads the whole thread).
8. **Count the waste and fix the biggest.** Every video gets one row in `docs/LEDGER.md` with the same five counts:
   lookups, layout runs, check-fix rounds, full renders, waiting steps (counted from the thread's own tool calls and
   the clip's notes, the same way each time), and Jonny's score out of 10 when he gives one. What is done with the
   row is "The improvement loop" at the end of this file: one fix per video, tested on the next one. A lesson that
   does not become a tool, a check or a template line is dropped, and a new line in a rule file replaces or merges
   an old one.

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
- **Animatic gate, every clip (rule 2 above)**: the draft render (`--draft`: real timing, draft look, scratch
  sound) goes to Jonny before any polish or full render. His OK replaces review B.
- **Look gate, new characters, sets or looks only**: 2-3 style frames (draft stills at the final look), checked by the
  creative director against the design, then Jonny. An existing look skips it.
- **Staging proof, every clip, before any builder starts** (director + creative director, about 30-40 min): write
  PANELS.md from `docs/templates/PANELS.md`: a numbered checklist of what the panels stand on (8-12 lines, with numbers
  and "never" where the default goes wrong), the Numbers table read off each panel before any code, a reason for every
  departure, and the story chain (below). Block the clip in
  the generator: cast, camera per shot, set from boxes or existing props, placeholder props at their real sizes.
  Check every staging edit on the floor plan first (`node qa/clear.mjs <sb>`, 1-2 s) and try cameras and subtitle
  spots with `node qa/camfit.mjs` (a second each) before a layout pass; fix rounds lay out only the seconds they
  changed (`--layout --from --to`, docs/rules/fast-cheap.md).
  Render the draft stills at one time per panel, run `qa/panels.mjs` against Jonny's board and
  `node qa/panelfit.mjs <sb> --panels <PANELS.md>` (each panel graded by number: size, eye line, x, faces, camera), grade
  every checklist line yes, partial or no against the panel image (not against memory), and get review A on those
  stills plus the panels. Grade the checklist again before the full render; the grades live in PANELS.md. Fix staging until review A has no note that a story beat can't be seen. Only then write the
  BOARD's numbers and brief the builders: they build to proven positions, not guessed ones.
- **Delivery gate**: full render + checks (+ review B only when Jonny did not see the draft), the gate report + post pack, Jonny's go, PR, "merge it" only
  when every check on the head is green.

## Look a name up once (10 Nov 2026, trial)

In a sampled stretch of a build 84 of 163 tool calls were greps of the engine for a name: which verbs exist and what
they take, expressions, poses, easings, effects, sounds, helpers, prop kinds. Every one re-reads the whole thread
(about 6 cents and 20 s at 300k tokens), and the same burst came back after each compaction.
- **Read `docs/VOCAB.md` once at the start, and again after a compaction**, before any grep of `engine/` or
  `storyboards/lib/`. It is written from the code at session start (`node tools/vocab.mjs` rewrites it, a second:
  run it after a builder adds a prop kind or you add a helper). It has names and parameters; what a thing does is in
  `docs/STORYBOARD.md` at the heading and line the sheet's last section gives.
- **Keep `NOTES.md` next to the generator** (from `docs/templates/NOTES.md`): where the build stands, the cast's
  places, the props and who holds them how, each camera, decisions with their reason, what was tried and dropped, and
  any name you did have to look up. Update it at each step. After a compaction read it before anything else: it is
  what the summary loses.
- **A builder's prop or set file starts with a usage header** (BRIEF "DONE WHEN"): the kinds, each spec key with its
  default, the size, where the origin is, where a hand holds it. The director reads the header, not the file.
- **`node qa/peek.mjs <sb> --at <s> [--ids a,b]`** prints where the cast and props are in the last layout (boxes,
  eyes, hands, who holds what, what is in what): no throwaway script to open the layout JSON.

## Reuse before you build (9 Nov 2026)

Every Never Has Money episode so far built a new room and new props. In the director's EP04 build that was two builder
tasks, about 290k tokens and 42 min of builder time (the props 11 min, the painted room 31 min), before any acting.
Jonny's MrBeast playbook already says to reuse sets (approved 8 Nov). So, before the plan:
- **Start from the series' last set** when the brief's place fits (the same flat, the same café): copy the set block,
  plate and props from the last episode's generator and change the dressing (bunting, a cake table), not the room.
- **Look for the prop before briefing one**: `grep -l "<kind>" engine/page/props-*.js` (a gift box, a crate, a table).
  A different size is a number in the generator; only a prop the library hasn't got is a builder task.
- A new room or a new prop is for a place or a panel the library can't give. PANELS.md names which, and why.

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
   only the tails of outputs. A bench with a cast is judged by CI's episode preflight like an episode (two clips in
   a row went red on their benches, 10 Nov 2026): its cast stands clear of each other (1.2 m or more side by side),
   and the director gives it the same worn-prop windows as the episode.
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

**Cause and effect across the whole clip** (Jonny, 10 Nov 2026, on Survive it EP1: "its just different scenes", "must
make sense and should have a logical cause and effect. elsewise the viewer is just wondering why he watched the
video"): every beat happens BECAUSE of the beat before it. Write the chain as "X, so Y, so Z" from the first second
to the last frame. A beat that can only be joined with "and then", a time jump or a card is rewritten or cut. One
mistake or one want starts the clip and the last frame answers it; a stranger can retell the clip in one sentence.
Review A checks this before anything else, and a brief or series format that asks for separate gags goes back to
Jonny as an outline first (Survive it's three-fails shape did).

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

`payoff-face` (qa/framing.mjs, a visible glitch) checks this from the payoff's first frame to the end, for every face
that acts from then on or that a "visible" window names: a turn inside a shot past 45° off camera, or a line or a
reaction past 45° or under its own brim or a hand, for 0.2 s or more. On the three EP04 cuts it found the director's
hug (Viking 6.3-7.0 s, Gunslinger 7.8-8.8 s, Reaper 7.1-8.6 s) and passed the old and Fable cuts.

## Hands: every move gets the frames its distance needs (EP04, 9 Nov)

Jonny on EP04: "old has cleaner hand movements and hands are less glitchy". It was not the engine: the old branch's
anime-timing fix, applied to the director's clip, moved its hands by 2° at most. It was how the hands were written.
The director's cut had 12 frames where Gunslinger's hand turned over 60° against the old cut's 4, at the beats
everyone watches: "And yours?" (1.2 s), the pocket slap (1.6 s), the coupon reveal (4.0 s) and the hug (5.6-6.1 s).
Most are hand jumps: a hand sent 24-68 cm in 2-3 frames; the palms-up turn on "And yours?" flips both hands 81° in
one frame (the hand-cause tool in the open PR #128, `handcause.mjs`, names the cause of each pop).
- A hand move gets at least one frame per 10 cm it travels: a 66 cm reach is 7 frames (0.23 s), not 0.08 s.
- Go straight from one hold to the next. Dropping a hand to `rest` and taking the next hold 0.06 s later sent the
  left mitten 68 cm and back in 3 frames (the coupon reveal).
- A palm turn (palms up for "And yours?", a flip onto a prop) spreads over 6-8 frames, the same palm side through it.
- Every hand-pop on a subject's hand on screen is fixed before the full render, even under the 90° flip gate.
  "Fine if hidden" means hidden: off frame, behind a body, or smeared by a fast move, as the check says.

Three rig facts that cost Share or Steal EP01 about 20 check rounds (10 Nov), each found by trial:
- A free arm pose `{ o: [out, up, fwd] }` counts `out` from that side's flank, mirrored per side: 0 is at the body's
  side, a negative value crosses the body (the hand lands on the face), a large one hides behind a costume's
  shoulders. `up` is a fraction of the body's height, `fwd` is metres in front. `{ x: [x, up, fwd] }` is the signed
  body position (`handTarget` in `engine/page/potato.js`). Check a new pose with one draft still before a layout.
- A hand lying flat on a table or a card needs `palm: [x, y - 0.4, z]`, a point below the grip. `palm: true` faces
  the prop's own axis at the grip's height, which is sideways for anything flat, and the palm flips on the way.
- `animeTiming` draws on 2s on one frame grid for the whole clip (`drawingNo` in `engine/page/drawn.js`). Moving a
  beat by an odd number of frames changes which frames are drawn after it, and a passage that was clean can pick up
  slides. Retime in steps of 2 frames (0.067 s), and hide a sit or a step-out behind a cut instead of tuning it.

Four more from Share or Steal EP02 (11 Nov), each measured in a layout:
- A hand that leaves a lap beside a table goes through the table's edge on a straight line. Send it over the edge
  first: a `{ world: [...] }` point 18 cm above the top, beside the face (never between face and camera), first leg
  ease "in", second leg "linear". "in" into "out" puts 20-40 cm into one drawing at the join.
- An arm pose change scheduled on a cut turned the palm 62-75 degrees four frames before the cut, still in the old
  shot. Keep the pose through the cut and change it half a second later, or not at all.
- A still at a rounded time is not the video's frame: 4.267 s is after frame 128 (4.2667 s). A prop swap two
  hundredths before a cut showed for one frame in the outgoing shot. Judge cut frames on the render's `--cuts` sheet.
- A seated character follows a moving chair with `ride` (`prop`, `off: [0, 0.3, 0.03]`); `drop` falls on its own curve.

`qa/hands.mjs` checks these numbers on screen, unsmeared and inside a shot: `palm-turn` (a turn of 60° or more in fewer
than 6 frames) is a visible glitch; `hand-jump` (a move 2 or more frames short of one frame per 10 cm) is a warning
with its one-line reason in the delivery. On the EP04 cuts: palm turns old 1, director 12, Fable 12; hand jumps old 13,
director 30, Fable 21, the same order as Jonny's "old has cleaner hands".

## Check windows (`allowClip`): only the director adds them

In the 8 Nov head-to-head, the new-workflow cut had 8 check warnings against the old cut's 32, yet it showed more
glitches. Its builder had added 41 windows, against the old cut's 25, and several of them waived contact on screen.
Gunslinger squeezed through a toilet door narrower than his body, in and out, because the BOARD had guessed it at
0.5 m. The old cut built that door 1.25 m wide because the hat brim is wider. The Samurai also had a hand-and-arm
waiver for the whole clip.
- A window may cover only (a) contact the beat needs, like a hand on what it holds or a hug, or (b) a moment no
  camera sees, like inside the shut toilet or off frame on a cut. Never a body through a door, a wall, furniture or
  another body on screen: resize the prop or re-stage.
- A hand flip (`hand-turn`, `palm-turn`), a rig jump or a foot slide on screen is never waived: change the move (see "Hands"
  below). In EP04 the director's cut waived two hand flips on screen; the old cut waived none.
- Only the director writes windows. A builder reports the fail instead.
- The delivery lists every window that is on screen, with its 15 fps strip. When clips are compared, count those
  windows next to the warnings.
- Preflight counts them (10 Nov 2026, `qa/waivers.mjs`): how many windows are in frame, for how long, and which
  findings they take out of the verdict. `node qa/waivers.mjs <sb> --md` writes the table for DELIVERY.md. Over 10
  windows in frame (`GATE.waiverBudget`; EP04: the clean-hands cut had 7, the others 30 and 31), look at a 15 fps
  strip of each before the full render. The count goes in the clip's ledger row, so the budget can be set from
  Jonny's notes on the next five clips.

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
   **The one-second proof of rule 6** (Survive it EP1: all three fix rounds were one-frame pops, each a farm render):
   for every flash, impact frame, card that lands on an effect and big prop passing the lens, and after a review
   note that adds or moves one: `node engine/render.mjs <sb> --draft --from <s> --to <s+1>`, then
   `node qa/pops.mjs out/<id>-<s>-<s+1>-draft.mp4 --from <s>` (30 s). A flash at its peak one frame before a dark
   card fades in at the same spot is an odd frame: start the flash two frames earlier.
5. **Strips and review B on the passing draft, before the full render** (trial from 10 Nov 2026, Jonny; before, both
   came after the full render). `node qa/contact.mjs out/<id>-draft.mp4 --sb <sb> --contacts` cuts a 15 fps strip of
   every grab, release and drop and of whatever appears or vanishes inside a shot (`--at 3.8,11.3` adds a raise or a
   touch, `--every 1` shows every frame); look at every row yourself first. Then **creative director review B (cut)**
   on the draft's contact sheet, cut strips and phone sheet (`node qa/contact.mjs <draft> --sb <sb>`, then
   `--cuts --phone`), one round, told that it is a draft (the look is not final: no notes on line quality or grain).
   Apply the notes that are cheap (timing, framing, captions), draft again, and cut the strips again where you
   changed something. Bigger notes go into the next cut or to Jonny. Why: What if EP03 (9 Nov) found four one-frame
   glitches that every check had passed (a trophy alone in the air for two frames, an arm stepping back, eyes opening
   late, Viking gone 0.2 s early) on the strips and in review B after full render 1: four more farm renders, 42 min.
6. **Full render, once** on GitHub's free runners (`gh workflow run render.yml -f storyboard=<sb>`, see below) or in
   the background here (fetch the branches again right before it), `qa/check.mjs --ears` on the final MP4
   (earshot listens: hits on their frame, footsteps on the right floor). Look at its contact sheet and phone sheet
   yourself for what only the final look shows (lines, grade, blur, a caption's edge). No second review B unless the
   cut changed after the one on the draft. Count the farm renders after review B in the ledger row: the target is one.
   The background command of rule 7: `until [ "$(gh run view <id> --json status -q .status)" = completed ]; do
   sleep 30; done`, no check-ins beside it (about 100 of Survive it EP1's 853 steps only waited). Open the pull
   request when the final clip has passed, not during the build (each check event wakes the thread), and run
   `node qa/preflight.mjs <bench> --quick` on every bench the branch adds before that push.
7. **Deliver** (see "Delivery" below): the MP4, its cover and a `DELIVERY.md` next to it with the one-line check result and Fable's notes in one line each, marked
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

## The improvement loop (Jonny, 10 Nov 2026)

Written by Claude for Claude on Jonny's ask: the workflow and the engine improve themselves in tokens and time while
quality stays the same or rises. It replaces "Measuring the new workflow" and the Trial lines in docs/STATE.md.

Goal: every video takes fewer steps and fewer minutes than the last comparable one, and Jonny's score does not fall.
Jonny judges finished videos; numbers only say what they cost. There is no budget and no target total. You remove
wasted work, and you prove it.

**Before the first step of a video**

1. `node tools/ledger.mjs` prints the last three ledger rows and the fix that is on test. Write in the clip's notes
   which count that fix should lower.
2. Pick the comparison video: the earlier one closest in length and in new things (props, effects, sets, format).

**While building**

3. The third time you do the same kind of step for the same reason, stop. That is waste showing itself live. Write
   one line in the notes (what repeated, why) and change the route. These lines are the causes for the ledger, so
   nobody re-reads a transcript later.
4. When a check fails, note whether the fault can be seen in the frames. A fail nobody can see is the check's fault,
   not the clip's.

**After delivery, in a short thread**

5. Add one ledger row with one command (`node tools/ledger.mjs add ...`): length, new things, rule 8's five counts,
   check fails seen and unseen, steps, minutes from brief to delivery, machine minutes, director model and effort,
   cost, Jonny's score, each note he gave. Unknown is `?`, never a guess. The counts come from the thread's own
   transcript: `node tools/ledger-count.mjs --from <time of the brief> --to <time of the delivery>` (under a second).
6. Judge the fix on test against the comparison video. Count fell and score held: keep it. No drop after two videos:
   take it out again. Nothing stays on belief.
7. Pick exactly one next fix. A fault that reached Jonny's eyes always goes first. Otherwise the largest of: the
   biggest waste count, the slowest engine command times its runs, a check with unseen fails in two videos.
8. Build it as deep as it will go: first an engine or helper default so it cannot go wrong, then a warning or check
   at the earliest step, then the template or vocabulary sheet, and a rule line only as a last resort, replacing an
   old one. A lesson kept as text is paid again in every thread.
9. Keep it small: it must cost less than it saves over the next three videos. A fix that changes what the video
   looks like is proven on a finished video Jonny judges; any other fix by a before and after number. It goes to
   Jonny as one small pull request and waits for his word. The ledger's "Fix on test" names it.

**Every fifth video**

10. Prune. Take out checks, tools and rule lines that did not fire or were not used in five videos. Ask whether this
    loop paid for itself in the ledger, and cut the steps of this section that did not.

Never trade quality for a number, never skip a check to improve a count, and never ask Jonny to judge anything but a
video.
