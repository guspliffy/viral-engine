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
  previous item ends, its caption included), `"voice+0.2"` (0.2 s after the previous item's voice or action ends,
  ignoring its caption), `"end-0.3"` (0.3 s before the beat ends; needs `len`). After a `say`, the caption stays up
  0.5 s past the voice, so `"+0.2"` leaves a pause and `"voice+0.2"` answers straight away. Choose on purpose.
- **Items**: an action `{ "who", "do", ... }` (all engine actions), an effect `{ "fx": "flash", ... }`, a sound
  `{ "sfx": "tink", ... }`, a caption `{ "caption": "text", "len": 1 }`, or a macro `{ "macro", "who", ... }`.
- **Sounds**: walks, grabs and sits get recorded foley on their own (footsteps land on the legs' footfalls). Name a
  library sound for everything else the picture does: `{ "sfx": "katana-slice" }` on the frame the blade starts
  moving (the cut lands 0.07 s later), `knock`, `door-slam`, `typing` with a `dur`, `put-down` when a prop is set
  down (a release is silent: it might be a throw). Full list in README (`sfx`).
- **`shot`** starts at the beat (omit it to keep the camera). **`caption`** shows for the beat, or for
  `{ "text", "beats": 2 }` beats.
- **`kind: "escalation"`** marks the second turn of the joke; `qa/check.mjs` notes clips over the 20 s house target
  without one.
- **Voices**: characters with a speaking voice (`"tts"` in their file: Phoenix, Reaper, Wizard, Allfather/Odin) say
  `say` lines for real (`engine/voice/`). The line then lasts exactly as long as it is spoken (a written `dur` is
  replaced, with a warning when they differ), so anything timed after it follows the voice. `"tone"` sets the
  reading (`excited` a bit faster with "!", `question` rises, `sad` slower, `whisper` = Jonny's soft voice: same
  voice, slower, quieter, no breath effect). `"soft": true` does the same for any tone. `"voice": "robot"` speaks a
  line in another voice, `"voice": false` keeps it gibberish, and `"sound": { "speech": false }` keeps the whole clip
  gibberish. Gibberish lines are seeded by speaker + line: the same line always sounds the same, and moving or
  retiming it keeps its gibberish and lip sync. `"seed"` on the macro gives a gibberish line a different take.
- **Experiments and checks**: `"experiment": { "id", "episode", "variant" }` marks a variant (see
  `experiments/README.md`); music is then seeded by experiment + episode, so variants of one story share it while
  different stories differ (top-level `"seed"` overrides). `"profile"`
  (`short` or `rewards`) picks the publishing limits, and a `"creative"` block changes the house-style targets the
  checker notes, e.g. `{ "length": [8, 15], "maxEventGap": 3 }`.
- No `duration` needed: the clip lasts as long as its beats. `node engine/compile.mjs <sb>` prints the flat result,
  with `beatSpans` (each beat's start and end). Contact sheets put one still inside each beat.

## Macros

| Macro | Parameters | What it does |
|---|---|---|
| `say` | `line`, `tone`, `dur?`, `caption?`, `pos?`, `seed?`, `voice?`, `soft?` | Spoken line (real voice, or gibberish sized to the line) + lip sync, and the line as a caption |
| `narrate` | `line`, `voice?` (default `storyteller-warm`; `storyteller-deep`), `caption?`, `pos?`, `gain?` | A narrator nobody on screen speaks for: voice and caption, no mouth (needs real speech) |
| `enter` | `to`, `dur?` | Walks to a spot and settles |
| `take` | `to` (look target), `away?` | Double take: glance, look away, snap back shocked |
| `react` | `expr`, `big?` | Expression + squash (+ hop when big) |
| `nod` | `times?` | Nods |
| `shrug` | `hold?`, `expr?` | Smug shrug with lean, arms back down after `hold` |
| `sigh` | | Deadpan, sprout droops, small sag |
| `fail-and-recover` | | Hop, it goes wrong, pretends it was on purpose |
| `zap` | `color?` | Transformation cover: flash (impact frame in anime), shake, poof |

### Performances

Small acted sequences with a thought process: the eyes move first, the body holds while the thought lands, then it
reacts. They use the `still` action and the acting eases below, so they read as decisions rather than as everything
moving at once.

| Macro | Parameters | What it does | Suits |
|---|---|---|---|
| `realize` | `to` (eye target), `then?`, `expr?`, `big?` | Eyes find it, body holds 0.3 s, face changes, body reacts, then looks at `then` | anyone |
| `reach` | `side`, `pose`, `look?`, `dur?`, `hesitate?` | Eyes first, a small lean away, then the arm winds up, goes, overshoots a touch and settles | anyone |
| `precise` | `side`, `pose`, `back?`, `hold?`, `look?` | The body goes still, one arm snaps to the pose and settles, holds, goes back | Reaper |
| `demonstrate` | `expr?` | Crouch, spring up with arms open, a flourish, land on hands on hips | Phoenix |
| `recover` | `to` (eye target after), `pose?` (`null` keeps the arms), `expr?` | Caught failing: freeze, eyes dart, sag, snap into a confident pose | Phoenix |
| `affection` | `other` (eye target), `away?` | Looks at them, slow blink, slow smile, looks away, the smallest nod | Reaper |

**Holds and eases for your own acting**

- `{ "who", "do": "still", "dur", "idle": 0.25, "sink": 0.008, "fade": 0.15, "blink": true }` turns the idle
  breathing and sway down to `idle` (0 is dead still) for a purposeful hold. The body sinks very slightly over the
  hold, so it doesn't read as a frozen frame. Use it whenever a character should be thinking, waiting or deadpan
  rather than idling.
- `"ease": "settle"` overshoots the target by about 4 % and eases back: follow-through on arms, turns and moves.
  `"antic"` pulls back about 4 % before it goes (anticipation). `"anticSettle"` does both.

Add a macro in `MACROS` in `engine/compile.mjs` when the same group of actions shows up in two clips.
