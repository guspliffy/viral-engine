# Writing a clip as beats

New clips are written as **beat storyboards**. `engine/compile.mjs` turns them into the flat storyboard (absolute
shots, actions, fx, sfx, captions) that the renderers and `qa/` read. Example: `storyboards/test-01-golden-v4.json`.

```json
{ "id": "my-clip", "set": { "type": "meadow" }, "cast": [ { "id": "gun", "character": "potatobrawl/gunslinger", "at": [-0.48, 0] } ],
  "beats": [
    { "name": "hook", "shot": { "pos": [0, 1.12, 5.6], "look": [0, 0.86, 0], "to": { "pos": [-0.25, 1.1, 4.3] }, "dur": 1 },
      "do": [ { "macro": "say", "who": "gun", "line": "make me golden.", "tone": "excited" },
              { "who": "gun", "do": "hop", "height": 0.18, "dur": 0.4, "at": 0.1 } ] },
    { "name": "change me back", "kind": "escalation", "len": 1.2, "do": [ ... ] } ] }
```

- **Beats run one after another.** A beat starts where the previous one ended (or at its own `"at"`), and lasts
  `"len"` seconds, or until its last item ends plus `"hold"` (default 0.15 s). Changing one beat moves everything after it.
- **Times inside a beat** are relative: `"at": 0.3` (seconds from the beat's start), `"+0.2"` (0.2 s after the
  previous item ends), `"end-0.3"` (0.3 s before the beat ends; needs `len`).
- **Items**: an action `{ "who", "do", ... }` (all engine actions), an effect `{ "fx": "flash", ... }`, a sound
  `{ "sfx": "tink", ... }`, a caption `{ "caption": "text", "len": 1 }`, or a macro `{ "macro", "who", ... }`.
- **`shot`** starts at the beat (omit it to keep the camera). **`caption`** shows for the beat, or for
  `{ "text", "beats": 2 }` beats.
- **`kind: "escalation"`** marks the second turn of the joke; clips over 20 s need one (`qa/check.mjs`).
- No `duration` needed: the clip lasts as long as its beats. `node engine/compile.mjs <sb>` prints the flat result,
  with `beatSpans` (each beat's start and end). Contact sheets put one still inside each beat.

## Macros

| Macro | Parameters | What it does |
|---|---|---|
| `say` | `line`, `tone`, `dur?`, `caption?`, `pos?` | Gibberish voice + lip sync sized to the line, and the line as a caption |
| `enter` | `to`, `dur?` | Walks to a spot and settles |
| `take` | `to` (look target), `away?` | Double take: glance, look away, snap back shocked |
| `react` | `expr`, `big?` | Expression + squash (+ hop when big) |
| `nod` | `times?` | Nods |
| `shrug` | `hold?`, `expr?` | Smug shrug with lean, arms back down after `hold` |
| `sigh` | | Deadpan, sprout droops, small sag |
| `fail-and-recover` | | Hop, it goes wrong, pretends it was on purpose |
| `zap` | `color?` | Transformation cover: flash (impact frame in anime), shake, poof |

Add a macro in `MACROS` in `engine/compile.mjs` when the same group of actions shows up in two clips.
