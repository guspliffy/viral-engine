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
- **`shot`** starts at the beat (omit it to keep the camera). **`caption`** shows for the beat, or for
  `{ "text", "beats": 2 }` beats.
- **`kind: "escalation"`** marks the second turn of the joke; `qa/check.mjs` notes clips over the 20 s house target
  without one.
- **Voices** from `say` are seeded by speaker + line: the same line always sounds the same, and moving or retiming
  it keeps its gibberish and lip sync. `"seed"` on the macro gives a line a different take.
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
| `say` | `line`, `tone`, `dur?`, `caption?`, `pos?`, `seed?` | Gibberish voice + lip sync sized to the line, and the line as a caption |
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

**Fine face, hands and hat** (engine/page/timeline.js)

- `{ "who", "do": "face", "lidL", "lidR", "browL", "browR", "tiltL", "tiltR", "cornerL", "cornerR", "press", "dur" }`
  blends fine controls on top of the expression; leave out the ones to keep. `lid`, `brow`, `tilt` and `corner` set
  both sides. L and R are the character's own left and right. Lids: 0 open .. 1 shut (needs `"lids": true` in the
  character's `face`, so far the Wizard; the lids also follow the gaze and close on blinks). Brows: about ±1 up or
  down. Corners: + up. `press`: 1 = lips pressed tight.
- `{ "who", "do": "grip", "side": "R" | "L" | "both", "shape": "open" | "hold" | "fist" | "pinch" | "point" | "cup" | "flat", "dur" }`
  curls a mitten hand (`"hands": { "type": "mitten" }` in the character file, so far the Wizard). `hold` wraps a handle,
  a staff or a jar; `pinch` is thumb on index, for a cup handle or a lid; `cup` cradles an orb or a jar from below; `flat` is an open palm. A character file sets its resting face in `face.neutral` (expression and per-side lid and brow keys) and its eye design in `face.eye` (`depth`, `iris`, `lash`, `flick`, `tilt`, `glints`), `face.browShape` and `face.blush`. Props attach at `character.gripPoint(side)`.
- `{ "who", "do": "hatsway", "tip": [forward, sideways], "brim": 0.5, "dur" }` bends the Wizard hat's tip (degrees) and
  tips its brim (+ front up). `{ "who", "do": "hatwobble", "amount": 8, "freq": 3, "dur": 0.8 }` adds a wobble that
  dies away: secondary motion after a hop, a turn or a bump.

Add a macro in `MACROS` in `engine/compile.mjs` when the same group of actions shows up in two clips.
