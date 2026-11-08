# Camera moves by name

A brief or a BOARD (docs/templates/BOARD.md §3) can name a camera move with one of the 48 names below. Each maps to
what the engine does for it. The names come from the "Camera moves & transitions" packs of
[motion-prompt](https://github.com/showheyohtaki/motion-prompt) (#025-048 and #169-192, MIT License, © 2026 Shohei
Ohtaki). The engine column is ours.

**✓** the engine has it, **new** added 8 Nov 2026 (this page's PR), **~** close to it (says how), **✗** not for our clips
(says why). Times are story time unless a key says video seconds. A directed clip (`"direct"`, docs/STORYBOARD.md)
picks most shots from the beat's `kind`; a hand-set shot is `{ pos, look, fov }` (storyboards/lib/camera.mjs `aim()`).

## Moves

| Name | What it is | Engine |
|---|---|---|
| Pan | turn left or right on the spot | ✓ a shot with `to: { look }` and the same `pos`; a wide turn: `"spin": 1` |
| Tilt | turn up or down on the spot | ✓ `to: { look }`, the look moving up or down |
| Dolly in | move toward the subject | ✓ directed `{ "size": "medium", "push": 0.08 }`; reaction beats push 4 % by themselves |
| Zoom in | the lens narrows, the camera stays | ✓ `to: { fov }` with the same `pos` (flatter than a dolly in) |
| Tracking shot | move along with the subject | ✓ a camera path (`"camera": [{ at, pos, look, fov }, ...]`) keyed beside the walker |
| Orbit (Arc shot) | circle the subject | ✓ `"yaw": { "keys": [[t0, 0], [t1, 40]], "pivot": <metres to the subject> }` on a shot |
| Crane up | lift the camera | ✓ a camera path rising, the look kept on the subject |
| Dolly zoom (Vertigo) | the subject keeps its size, the world behind it moves | **new** `"dolly": { "fov" or "k", "dur" }` on a shot; beat kind `realize`; `dolly()` in camera.mjs |
| Rack focus | focus shifts from near to far | ~ `set.focus` + a shot's `focus`; off by house rule (Jonny 4 Nov: the whole frame sharp) |
| Handheld | a slight shake as if held | ✓ `"hand": { "rate", "bob", "sway", "roll" }` on a shot (Split the Bill) |
| FPV drone shot | fast fly-through | ~ a fast camera path; our sets are painted plates, so only short flights stay on the painting |
| Dutch angle | the frame tilted | ✓ beat kind `chaos`, or `"roll": 8-15` on a shot |
| Slow motion | the action slower | **new** `{ "fx": "ramp", "len", "rate": 0.3, "in": 0, "out": 0 }`; a run can also slow on its own (`rate` keys on `run`) |
| Speed ramp | speed changes inside one shot | **new** `{ "fx": "ramp", "at", "len", "rate", "in", "out" }`; `ramp()` in camera.mjs |
| Time-lapse | hours in seconds | ~ a ramp with `rate` 4-10 speeds the action up; the sky and light don't move hours |
| Freeze frame | the action stops for a beat | **new** `{ "fx": "freeze", "at", "hold", "on", "label" }`; `freeze()` in camera.mjs |
| Jump cut | same framing, skip ahead | ✗ qa/camera.mjs fails jump cuts; use a size step (the directed camera does) |
| Match cut | cut on a matching shape or motion | ~ two shots whose shapes line up at the cut; set both by hand |
| Whip pan | a fast blurred pan to the next view | ✓ a short shot with `to: { look }`, `"spin"`, plus `speedlines` (Real Footage of Hell) |
| Cross dissolve | blend into the next shot | ✗ one continuous scene per clip (house format); no shot blending |
| Wipe | an edge replaces the shot | ✗ as above |
| Smash cut | abrupt cut to a contrasting moment | ✓ a hard cut at a beat (the payoff's cut on action) with a sound contrast |
| J-cut | the next scene's sound starts first | ✓ start the line or sound before the beat whose shot it belongs to |
| L-cut | a line carries over the cut | ✓ let the `say` run past the next beat's start |
| Pedestal | the whole camera rises or sinks | ✓ `to: { pos, look }` with both raised by the same amount |
| Barrel roll | a full turn about the lens | ~ `"roll": 0, "to": { "roll": 360 }` on a shot; untested, check a draft first |
| Hyperlapse | a time-lapse while travelling | ✗ needs hours of light change and a long set |
| Long take | one shot, no cuts | ✓ a camera path (`"camera": [...]` never cuts); Jonny prefers one moving take for openings (30 Oct) |
| Steadicam | smooth floating move | ✓ a camera path (Catmull-Rom between keys, no corners) |
| Follow shot | behind the subject as it moves | ~ a camera path keyed behind the walker; check the hat and wings don't fill the frame |
| Locked-off shot | the camera fixed, only the subject moves | ✓ a plain `{ pos, look, fov }` shot |
| Fly-through | through an opening into the next space | ✗ our sets are one painted place |
| Low angle | from low, looking up | ✓ beat kind `threat`, or `{ "size": "medium", "angle": "low" }` (once per clip) |
| High angle | from above, looking down | ~ `aim(target, { el: 25 })` by hand; straight down is `top` |
| POV shot | through a character's eyes | ✓ `{ "do": "pov" }` on the character (The Easy Trail); its body, face and hat are hidden |
| Over-the-shoulder | one over another's shoulder | ✓ `{ "size": "ots", "who", "over" }` |
| Bird's-eye view | straight down from above | ✓ `{ "size": "top", "on": "<prop>" }` |
| Deep focus | everything sharp | ✓ the default (no depth of field, Jonny 4 Nov) |
| Establishing shot | a wide opener that shows the place | ✓ `{ "size": "establishing", "plate" }` for 0.5 s, never at frame 0 |
| Extreme close-up | one small detail fills the frame | ~ a hand-set `aim(eyes, { h: 0.25 })`, or an insert on a prop |
| Insert shot | cut in to a detail | ✓ beat kind `insert` (0.4-0.8 s, never before 3 s) |
| Morph cut | hide a join between two takes | ✗ we don't cut takes together |
| Fade to black | the picture darkens to black | ✗ clips loop, no end fade (house format) |
| Iris out | a circle closes to black | ✗ no outro (house format) |
| Cutaway | cut to something else and back | ✓ an insert, or a reaction beat and back |
| Cross-cutting | alternate two places at once | ✗ one continuous scene per clip (house format) |
| Bullet time | time stands still while the camera circles | ~ a freeze with `push` (the frozen picture pushes in); a real circle in a freeze needs the camera on the video clock (not built) |
| Montage | a run of short shots | ✗ one continuous scene per clip |

## The new ones in a storyboard

```json
{ "fx": "freeze", "at": 0.6, "hold": 1.1, "on": "phx", "push": 0.05, "tone": "warm",
  "label": { "title": "PHOENIX", "sub": "“one more video”", "who": "phx" } }
{ "fx": "ramp", "at": 4.0, "len": 0.8, "rate": 0.35, "in": 0.2, "out": 0.3 }
"shot": { "size": "close", "who": "wiz", "dolly": { "k": 0.5, "dur": 1.1 } }     (or "kind": "realize")
```

- **Freeze frame**: the story stops at `at` for `hold` seconds of video (the video gets that much longer; every sound
  after it moves with its picture). The stopped picture pushes in on `on` (or `"xy"`), drains to a warm tone with a
  vignette (`"tone"`: `"warm"`, `"cool"`, `"mono"`, `false`), flashes on its first frame (`"flash"`, 0.35) and can carry a
  name tag (`label`: `title`, `sub`, `who` for the colour, `side`, `y`). `freeze(c, t, hold, { scratch: true })` also
  plays the record scratch on it. Use one per clip: the name-tag intro ("that's me") or the moment before the payoff.
- **Speed ramp**: the story from `at` to `at + len` plays at `rate` with `in` / `out` seconds of easing; the video
  length is a whole number of frames (the slow middle's rate is evened out to fit). A line spoken inside a slow ramp
  would play at full speed over a slow mouth: `engine/load.mjs` warns, move it out. A hit-stop or freeze inside a ramp
  is refused.
- **Dolly zoom**: the lens eases from the shot's fov to `fov` (or `k` times it) while the camera slides along its line to
  the look point (or `"on": [x, y, z]`), so the picture height there stays the same. `k` under 1 pulls back: the room
  closes in behind the face (dread, the realisation; `realize` uses 0.5). Over 1 pushes in: the room falls away (shock).
  A wider lens shows more of the painted plate: check a draft for its edges.

Engine test: `storyboards/lab/make-moves-demo.mjs` (the clip template's example, before and after).
