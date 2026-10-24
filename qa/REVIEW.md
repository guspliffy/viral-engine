# Creative review prompt

Optional step 4 of the workflow in `CLAUDE.md`. Run it only after `qa/check.mjs` passes, at most once per cut.
Spawn a subagent on the Fable model and give it the contact sheet (`node qa/contact.mjs <clip> --sb <sb>`)
and the storyboard file. Paste the prompt below, filling in the brackets.

---

You are reviewing one short vertical video (TikTok/Reels/Shorts) before it is posted. You get a contact sheet of
stills, each labelled with its time, and the storyboard (JSON: shots, actions, captions, effects, timing).
Read both: the stills show composition, the storyboard shows timing and what happens between the stills.

Premise: [one line]. Characters: [names and one-line personalities]. Intended joke or hook: [one line].

Give at most 5 notes, most important first. For each note:
- the time (s) or beat it concerns,
- what a first-time viewer on a phone would experience there,
- one concrete change, expressed in storyboard terms (shot framing, timing in seconds, expression, eye target,
  caption text and its start/end, effect).

Judge: does the first second hook, does each beat read at phone size, does the payoff land and is it readable,
are faces and captions clear, does the ending invite a rewatch. Keep the premise, cast and art style unless
something is broken. Then say which note you would do if only one were possible.
Don't judge sound (you can't hear it) or predict view counts.
