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
```

Spawn the reviewer with the Agent tool on model `fable`. Give it the two file paths (it reads the image itself) and
the prompt below, with the brackets filled in. Ask for the answer as text only: no files, no edits.

What the producer does with the notes:
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
End with: "If only one: <note number>".
