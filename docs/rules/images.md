# Panel sheets and reference images (the drawn step before the engine)

The producer's storyboard panels and reference sheets set the target every clip is built to (`docs/rules/story.md`
section 5). They are drawn by an image model, not by the engine, at no extra cost on a ChatGPT plan: since 9 Nov 2026
with the official Codex CLI (image model always `gpt-image-2`) or by hand in ChatGPT's image tool.

## Order of work for a video with anything new (15 Nov 2026)

1. Short outline (six lines of "X, so Y, so Z"; mystery videos "But/Therefore") -> producer's OK.
2. Panel sheet drawn (one image, 12-16 numbered panels, 9:16 frames) -> producer's OK.
3. New designs (character, set, prop, look) made FROM the drawn sheet: pass the sheet PNGs to the designer and name
   the panels each piece comes from. Designs are the one job for Fable 5.2 (workflow.md, Roles).
4. Kit build, then staging and the first animatic (workflow.md).
Without the sheet first, a kit built from panel TEXT did not look like the drawn sheet.

## Cast references (attach them, never describe the cast from memory)

`references/cast/`: `cast-sheet.png` (the ten fighters), `spud-reference-sheet-2026-11-11.png`,
`chip-`, `wedge-`, `mash-reference-sheet-2026-11-12.png`. The image tool takes at most 5 references per image. The
Viking and Wizard drawn on the Spud sheet are off-model: use the cast sheet for fighters. Canon descriptions:
`docs/character-bible.md`.

## Codex CLI recipe (on the producer's own PC, signed in to ChatGPT)

```
codex exec --skip-git-repo-check --sandbox workspace-write -m <cheap driver model> -c model_reasoning_effort="low" \
  "<prompt, see below>" -i <ref1.png> <ref2.png> ...
```

- Put the prompt BEFORE the `-i` flags: `-i` takes several files, so text after it is read as an image path.
- Tell Codex to set `referenced_image_paths` to the full paths and to pass everything below a "PROMPT START" line
  character for character; with several references it otherwise drew without them and rewrote the prompt. Check the
  session log (`~/.codex/sessions/.../rollout-*.jsonl`) for both.
- A cheap driver model passes the prompt word for word (~3 min, ~1 % of the weekly Codex window per image); the
  default model rewrites it with more drama and costs ~4x. Past the cap only paid credits work: stop instead.
- There is no size option: a 9:16 ask came back 941x1672; upscale and set lettering locally (PIL, Inter-Black).
  A 7x2 grid on 1536x1024 gives tall thin cells, not 9:16.
- To change one thing on a sheet: attach the previous sheet by name and name only that change.
- References pull the look toward the sheets (softer, less cinematic); say what to keep from them.
- Official CLI at normal pace only: no third-party bridges reusing its login, no scripted ChatGPT website.
  Keep the AI-content label when posting.

Claude in a cloud session cannot run this; the producer runs it on the PC (or Claude does through a Remote Control
session there) and drops the PNG into the project's files or the clip's folder.
