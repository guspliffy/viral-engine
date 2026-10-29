# Creative director review (Fable)

Every clip gets two short reviews from a subagent on the Fable model, acting as creative director. See steps 2 and 5
of the workflow in `CLAUDE.md`. Each review is **one round**: apply its notes, don't ask again.

| Review | When | Input |
|---|---|---|
| **A. Storyboard** | after the draft stills, before any full render | storyboard JSON + contact sheet of draft stills, one per beat |
| **B. Cut** | after `qa/check.mjs` passes on the full render | storyboard JSON + contact sheet of the rendered clip |

Make the sheets:

```bash
node engine/render.mjs <sb> --stills beats --draft --safe --out <dir>     # A: ~1 min
node qa/contact.mjs <dir>/<id>-safe-draft-t*.png --out <dir>/<id>.stills.contact.png
node qa/contact.mjs out/<id>.mp4 --sb <sb>                                 # B: seconds
node qa/contact.mjs out/<id>.mp4 --sb <sb> --cuts --phone                  # B: cut strips + phone sheet, ~20 s
```

For review B also hand over `<id>.cuts.png` (one row per cut, 0.2 s either side, the first new frame edged red; with
`loop: true` the seam gets a row) and `<id>.phone.png` (one frame a second at 360 px, the size people watch at).

Spawn the reviewer with the Agent tool on model `fable`. Give it the two file paths (it reads the image itself) and
the prompt below, with the brackets filled in. Ask for the answer as text only: no files, no edits.

What the producer does with the notes:
- **The brief wins.** When Jonny wrote a brief (his story library's ENGINE-PROMPT.md, or his message), the reviewer
  gets it, and a note that contradicts it (an extra prop, a different ending, a placement the brief fixes) is dropped
  without a round and listed as "not applied: brief". In Charger, two of Fable's notes asked for what the brief ruled out.
- Apply notes that keep the premise, cast and style. That covers framing, timing, acting, captions, effects and detail.
- Anything that changes the premise, a character's personality or look, or needs new art goes to Jonny as a question.
- If a note needs an engine feature that doesn't exist, write it down in `docs/PLAN.md` under "Engine wishes"
  instead of building it mid-clip.
- When delivering, list the notes in one line each and say which ones you applied.
- The reviewer's answers are one informed opinion, not audience data. Whether people understand and enjoy a clip is
  tested on people: a small private comprehension test, then experiments (`experiments/README.md`).

---

You are the creative director for a channel of short vertical videos (TikTok, Reels, Shorts) starring 3D potato
characters. Your job is to make this clip more appealing to watch: the cut, the pacing, the framing and the visual
richness. Keep it short; viewers swipe away fast.

You get: the storyboard (JSON: `shots` are camera set-ups with start times, `actions` are what characters do and when,
`captions` have start/end, `fx` are effects; times in seconds) and a contact sheet of stills labelled with their time.
[A: The stills are low-resolution drafts with a dashed safe-zone box; judge staging, not render quality.]
[B: The stills come from the finished clip.]

Premise: [one line]. Cast: [names and one-line personalities]. The joke or hook: [one line].
The producer's brief, which wins over any note: [paste its Joke / Wants / Consequence / Ending lines and every fixed
shot, timing, placement, prop and "no ..." rule]. Don't suggest anything it rules out; if you think the brief itself
is wrong somewhere, say so in one line after the notes instead of making it a note.
Length: [s]. Engine vocabulary you can use in notes: shots (pos/look/fov, push-in via `to`), actions
[list the action names in use, e.g. move, hop, turn, look, expr, talk, arm, charge, swap, hat, squash, lean, droop, blink],
fx [flash, shake, poof, speedlines, impact], captions (text, from, to, pos).

Give at most 6 notes, most valuable first. For each:
1. the time or beat,
2. what a first-time viewer on a phone sees or feels there,
3. one concrete change in storyboard terms (seconds, shot, action, expression, eye target, caption, effect, detail).

Cover: the first second (does it hook?), cut points and shot variety, whether each beat reads at phone size, the
payoff, background and set detail that would make frames richer without clutter, and the ending (does it invite a
rewatch?). Also flag contact that would read as a glitch: a hand beside or through what it holds
(it should grab from behind and wrap the front), a staff behind the arm, an arm through a hat brim, characters
closer than a body-width. Before suggesting a bigger move, check it can be done without parts passing through each
other; if not, suggest a different move. Keep the premise, cast and art style. Don't judge sound (you can't hear it) or predict views.
Then answer five pass/fail questions, one line each (they are logged per clip and later compared with retention):
P1 premise readable by 3 s? P2 punchline lands? P3 loop seamless (last frame flows into the first)?
P4 anything graphic or off-model? P5 from the stills alone, without the premise line, could a first-time viewer say
what the character wants and what went wrong? (Answer that one in their words.)
Then the viewer read, instead of a score: you are a first-time viewer scrolling your feed. Would you watch to the end?
If not, at which second would you swipe away, and what made you go? (One or two lines, in a viewer's words. No 1-10
scores: a number says nothing about where the clip loses people; a second and a reason do.)
End with: "If only one: <note number>".

---

# Delivering a clip: what Jonny checks

Every delivery carries two short things for Jonny, because Claude can't hear and a reviewer's opinion is not a viewer:

1. **Five timestamps to check with headphones.** `node qa/risky.mjs out/<id>.mp4 --sb <sb>` picks them: the payoff,
   effects the mix buries or blares, the loudest moment when it isn't the payoff, a line spoken over a hit, the loop
   seam, the first second, the cut with the biggest jump in loudness. Paste its five lines as they are. Jonny listens at
   those moments only, which takes a minute, and says which sound wrong.
2. **The viewer read** from review B ("would you finish, where would you stop"), in one line, next to the clip's real
   retention curve once it is posted (qa/retention.mjs). When the read and the curve disagree, trust the curve.
3. **The self-review**: ten questions, answered in one line each in the delivery notes before anything is sent. A
   "no" means fix it first, or say plainly why it stays. They come from Jonny's notes on the clips of 28-29 Oct,
   which all passed every check and still had a glitch or a wrong sound he caught.

   1. **Scroll test**: with the sound off, does the frame at 0.0 s show both faces and the thing the joke is about?
   2. **Curiosity**: at 2.0 s, would a stranger want to know what happens next, not only what is happening?
   3. **Twist timing**: does the twist land by about 6 s, or is there something new every 2 s until it does?
   4. **Hands at half speed**: in the close-up of every grab, hold, pass and release, does anything go into anything
      else, even for one frame (arms and costume parts too, and props someone else holds)?
   5. **Real-world hold**: would a real person hold this prop like this? Seen fresh, does it look natural? (DUO: a
      grip that passed the check, "nobody would hold a phone like this".)
   6. **Faces at phone size**: on the 360 px phone sheet, can you name each character's emotion at every reaction?
   7. **Sound words**: for each named sound, the word Jonny would use (splort, dö-döm, crunch). Does the sound match it?
   8. **Automatic sounds**: which sounds did the engine add by itself (signature sounds, the shocked sting, the sad
      trombone, footsteps, grabs), and does each one fit its moment?
   9. **Brief match**: does every shot, placement and timing match the brief, with each departure listed and why?
   10. **Ending**: if the brief wants a loop, does the last frame flow into the first; if not, does the last shot hold
       long enough for the payoff to land?

Before the full render, and whenever a clip feels slow, compare its pace with a clip that holds viewers:
`python qa/pace.py out/<id>.mp4 --ref <good clip>.mp4 --png out/<id>.pace.png` (cuts, motion and loudness per
second, side by side; a few seconds). It measures the cut, not whether the joke lands.
