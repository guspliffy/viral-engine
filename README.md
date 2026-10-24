# viral-engine

Character-driven short videos, rendered from data. Characters and storyboards are JSON files; the engine turns a
storyboard into a vertical 1080×1920 MP4 (plus a cover frame) with 3D characters, camera shots, effects, captions
and sound. No filming, no stock footage, no cost per video.

Status: **v0.2, pipeline test.** Two PotatoBrawl fighters (Wizard, Gunslinger), an original cast (Onion, Egg, Tomato in
`characters/originals/`), four sets (meadow, party, office, rooftop), two render styles
(`standard`, `anime`), code-generated voices and sound effects.
See [`docs/PLAN.md`](docs/PLAN.md) for the roadmap, decisions and open questions.

## Quick start

Needs Node.js 18+, ffmpeg and a Chromium build.

```bash
npm install
npx playwright install chromium      # once; or point CHROME_PATH at an existing Chromium
node engine/render.mjs storyboards/test-01-golden.json
node engine/render.mjs storyboards/test-01-golden.json --style anime
# -> out/test-01-golden.mp4, out/test-01-golden-anime.mp4, cover PNGs and the WAV mixes
```

Useful flags:

| Flag | What it does |
|---|---|
| `--stills 0.5,3.2,7` | Renders PNG stills at those times only (seconds). Fast way to check a shot. |
| `--safe` | Draws the area TikTok's buttons and text don't cover, as a dashed box. |
| `--from 2 --to 4` | Renders only part of the timeline. |
| `--draft` | Fast preview: 3D at half resolution, no anti-aliasing (captions stay sharp). About 3x faster. |
| `--style anime` | Renders in another style. Default: the storyboard's `style`, else `standard`. |
| `--audio-only` | Redoes only the sound on an existing render (seconds instead of minutes). |
| `--silent` | No sound, a silent track instead. |
| `--png` | Lossless frames into the encoder instead of JPEG q95. Slower, rarely visible after H.264. |
| `--layout` | Writes only `<id>.layout.json` (caption and character boxes) for `qa/check.mjs`. Takes seconds. |
| `--out dir` | Output folder (default `out/`). |

Rendering is deterministic: every frame is drawn at a fixed time `t = frame / fps`, so the same storyboard always
gives the same video, however fast or slow the machine is.

Speed on a 2-core machine without a GPU (software WebGL): about 1.8 s per frame at full quality (a 9 s clip in
about 8 minutes) and 0.55 s per frame with `--draft`. Most of the time is lighting the pixels; a machine with a real
GPU should be much faster (not measured yet).

## Quality checks

Rules for every clip are in [`CLAUDE.md`](CLAUDE.md). Two small tools check a clip before it counts as done:

```bash
node engine/render.mjs storyboards/test-01-golden-v2.json --layout     # caption + character boxes, seconds
node qa/check.mjs out/test-01-golden-v2.mp4                            # size, duration, blank frames, loudness, captions
node qa/contact.mjs out/test-01-golden-v2.mp4 --sb storyboards/test-01-golden-v2.json   # contact sheet for review
```

`qa/check.mjs` works on any MP4. The caption checks read a `layout.json`
(`{fps, samples:[{t, captions:[[x,y,w,h]] or [{box, covered}], actors:[{id, box}]}]}`, output pixels), which
`engine/render.mjs` writes with every full render or with `--layout`. Other renderers can write the same file.

## How it works

```
characters/*.json ─┐
                   ├─► engine/render.mjs ──► headless Chromium (Three.js scene, one frame per step) ──► ffmpeg ──► out/*.mp4
storyboards/*.json ┘
```

- `engine/render.mjs` makes the sound first (`engine/audio.mjs`), then serves the repo locally, opens
  `engine/page/index.html` in headless Chromium, calls `ENGINE.frame(t)` for every frame, reads the composed canvas
  (`ENGINE.capture`) and pipes the frames into ffmpeg (H.264, yuv420p). Finally it muxes picture and sound with
  two-pass loudness normalisation to -14 LUFS, true peak -2 dBTP.
- `engine/audio.mjs` synthesises everything in code: gibberish voices (formant synthesis) for `talk` actions and sound
  effects placed automatically from the storyboard (hop, land, pop, charge, whoosh, tink, sting, sad slide, impact, poof).
  Claude can't listen, so audio is checked by measurement (levels, spectrum, timing); a human has to judge the sound.
- `engine/shared/syllables.js` plans each line as syllables. The voice speaks them and the mouth shapes them
  (round on o/u, closed on b/p/m), so lip sync comes for free.
- `engine/page/` is the browser side:
  - `stage.js` renderer, lights, set, cast, particles; captions and flash are drawn on a 2D canvas over the 3D frame
  - `timeline.js` turns the storyboard into per-frame state (pure function of time)
  - `potato.js` the potato rig: lumpy body, face, limbs, squash and stretch
  - `face.js` eyes, brows, mouth, blush and the expression presets
  - `costumes.js` hats, sprout, held props (wizard staff with charge glow)
  - `props.js` alternative forms (the fries box)
  - `sets.js` sky, ground, hills, clouds, flowers, lights
  - `styles.js` render styles: `anime` swaps in cel-shaded materials and draws ink outlines

## Characters

`characters/<franchise>/<name>.json`. Example: `characters/potatobrawl/wizard.json`.

| Field | Meaning |
|---|---|
| `body` | colour, height, width, depth, `lump` (how uneven), `seed` (the lump pattern), `specks` (default 9; 0 for smooth skins), `gloss` (0.3 potato .. 1 shiny) |
| `limbs` | colour and thickness of arms and legs |
| `face.default` | resting expression (see below), iris and blush colours |
| `sprout` | the leaves; `placement`: `top`, `hat-top`, `hat-brim` or `none` |
| `costume` | `type` (`wizard`, `cowboy`, `magician` (top hat + wand), `cap` (backwards cap), `none`), colours, `tie` (a colour adds a necktie), `propHand` (`L` / `R`) |
| `voice` | `pitch` (Hz), `rate` (syllables/s), `formant` (voice size: >1 smaller, cartoonier), `range` (semitones), `breath`, `vibrato`, `seed` |
| `personality`, `notes` | for scripting; not used by the renderer |

Expressions: `kind happy delighted eager cocky smug shocked sad evil focused stern deadpan`.

## Storyboards

`storyboards/<id>.json`. `test-01-golden.json` is the reference example.

- `fps`, `duration` (seconds), `cover` (time of the cover frame)
- `set`: `{ type, seed, ... }`. Types: `kitchen` (PotatoBrawl's kitchen at night, `time` on the clock), `meadow` (`sky: [top, horizon], ground: [inner, outer]`), `party` (living room at
  night; `wall`, `floor`), `office` (day, window, desks; `wall`, `floor`), `rooftop` (city at dusk; `sky`, `floor`), `garden` (bright tiled path between hedges with a gap at z 0 for an obstacle prop; `gap`, `hedge`)
- `cast`: `{ id, character, at: [x, z], face, expr, arms: { R, L } }`. `face`: `camera`, `left`, `right`, `3q-left`, `3q-right`, `back` or degrees.
- `shots`: camera cuts. `{ at, pos, look, fov, to: { pos, look, fov }, dur, ease }` — a shot lasts until the next one starts; `to` makes it move.
- `actions`: `{ who, at, do, dur, ease, ... }`
  - `move` `{ to: [x, z] }` walks there · `hop` `{ count, height }` · `turn` `{ to }` · `lean` `{ to: degrees }` · `pitch` `{ to: degrees }` tips forward; 360 is a flip
  - `still` `{ dur, idle, sink, fade, blink }` a purposeful hold: idle breathing and sway turned down (see `docs/STORYBOARD.md` → Performances)
  - `expr` `{ expr }` · `look` `{ to: [x, y] }` eyes, -1..1 · `talk` `{ tone: calm|excited|sad|question|chant, rate }` gibberish speech, lips in sync · `blink` · `noblink`
  - `arm` `{ side: R|L|both, pose }` poses: `rest up wave point shrug hips cast hold hat fist cheeks lap table`
  - `charge` `{ to: 0..1 }` prop glow · `droop` `{ to }` leaves · `swap` `{ form: "fries" }` · `hat` `{ off: [x,y,z], spin: [deg,deg,deg] }`
  - `squash` `{ amount }` · `grow` `{ to }` scales the whole character (1 = normal) · `hide` · `show`
  - dance moves on the music's beat (`engine/page/dance.js`, the same names as the puppets): `bounce groove point floss clap roof wave2 nod tada flare wobble` `{ amp, speed }`, plus `spin` `{ turns, dir }` and `shake` on top
  - poses held for `dur`: `kneel` · `offer` (kneels, both hands out) · `holdout` (both hands out) · `show` (one hand up) · `swing` (the Reaper's scythe)
  - flying: `fly` `{ to: { x, y, z } }` (wings spread and beat; after it the character hovers until a `drop`) · `hover` · `drop` `{ to: y }` falls like a stone · `wings` `{ to: 0..1 }` Phoenix's wings
  - `sit` `{ seat: chair prop id, hands: lap|table|hold }` until `stand` · `grab` `{ prop, hand: R|L|both|tip, off }` (`tip`: hangs from the point of the character's own prop, the Reaper's scythe) · `release` `{ prop, to: [x, y, z], arc }` (`arc`: metres the throw curves up; also on a `prop` tween's x, y, z)
  - `tilt` `{ to: [forward, outward] degrees | null }` angles the character's own held prop (the scythe) instead of the arm pose; `null` hands it back
  - `prop` `{ id, set: { split, glow, lid, twist, fill, spill, lit, spin, x, y, z, rot, scale }, arc }` tweens a prop (no `who`)
- `props`: `{ id, kind: table|chair|teacup|jar|pickle|cookie|plate|clock|gift|phone|cake|banner|gate|portal|bolt|flames|pizza|slice|cloth|cheese|tree|apple|bus|bench, x, y (its bottom; a clock's middle), z, rot (degrees; a chair at 90 faces right), scale }` (`engine/page/props3d.js`). A table top is at y 0.62, a chair seat at 0.42. A clock prop hides the kitchen's own clock.
  Per kind: `teacup` `mended` (gold seams) · `jar` `lidSide` (`1` / `-1`, where the lid pops off), `twist` turns the lid, `empty` (no pickle inside; use a `pickle` prop that can fly out, `spin` tumbles it) · `gift` `w`, `h`, `color`, `ribbon`, `hinge` (the lid swings open on its back edge instead of coming off) · `phone` (`glow` lights the screen) · `cake` (`lit` lights the candles and their warm light, `split` cuts it) · `banner` `text`, `width`, `sag` (pop it in with `scale`).
  Clip props: A table top is at y 0.62, a chair seat at 0.42. A clock prop hides the kitchen's own clock. `gate` tweens `open latch slice smash scorch`; `portal` `open`; `bolt` `on`; `flames` `fire` (all 0..1). `pizza` (10 slices on a board) shows `slices` (0..10); `slice` is one of them, at `rot` i·36 it lies exactly on slice i, and `toast` 0..1 browns it. `tree` (an apple tree, its foot at x/z) shows `apples` 0..10 (fractional regrows them one by one) and `steps` 0..1 ledges; an `apple` at `TREE_APPLES[i]` covers hanging apple i. Set `forest`: a clearing with the tree's spot at x 0, z -0.6. Action `climb`: `{ to: { y }, steps, dur }` hand over hand, stays up until a drop. `cloth` is a checked tablecloth for a table at the same spot; `cheese` a melted string `len` m long. `bus` (origin: the middle of its front door on the near side, front towards +x) tweens `open`, `full` (passengers in the windows), `bulge`, and its wheels turn with its x; `bench` has a chair's seat height (so `sit` works); Sets `restaurant` (a pizzeria, table at x 0, z 0) and `street` (a bus stop, kerb at z -1.15, road at y -0.12, a puddle at x -0.2). Fx `zzz`: sleepy z's off a character's head. Sfx `horn`, `screech`, `hiss`. Any prop also takes `tilt` and `roll` (degrees). `allowClip` entries can name a pair: `{ who, with, from, to }`.
- `captions` style `label`: white letters on a dark plate (the pinned title word of the "each character vs X" format).
- `fx`: `flash` `{ peak }`, `shake` `{ amp }`, `poof` `{ who | pos, spark }`, `speedlines` `{ center: [px, px], inner, count }` (manga focus lines), `impact` (black silhouettes on white, a few frames), `sparkle` and `notes` `{ who, count }` round a character's head, `lights` `{ to, lamp, dur }` fades the room's lights (1 = as built; `set.lights` sets the starting level, 0.1 is lights off), `photo` `{ look: dark|normal|ink, cam: { pos, look, fov }, shot, hide: [ids], pos: [px, px], w, tilt, dur }` pops up a phone showing a photo taken from `cam` at time `shot` (default: its own start); `ink` is a silhouette against a glow `zzz` `{ who, count }` sleepy z's off a character's head.
- `sfx`: extra sounds `{ at, sound, gain, pan, dur }` on top of the automatic ones (`hop land whoosh charge impact poof pop click creak shing tink sting sadslide horn screech hiss`). `sound`: `{ auto, voice, sfx, reverb }` mix settings.
- `style`: default render style. Any action, fx, caption, shot or sfx with `"only": "anime"` (or a list) is used only in that style.
- `captions`: `{ from, to, text, pos: top|mid|low|<px>, x (centre in px, optional), style: main|sub, pop }`. A `\n` in the text forces a line break. Captions stay inside the TikTok safe zone.

Easing names: `linear in out inOut back elastic`, and the acting eases `settle` (small overshoot), `antic` (small wind-up) and `anticSettle`.

## Rules

- Nothing in the engine uses `Math.random` or the clock: same input, same video.
- No real people, no other franchises' characters, no brand marks. Format ideas from trends are rebuilt with our own
  cast and our own joke; footage from other creators is never used.
- Every post gets TikTok's AI-generated label switched on.
- Rendering is CPU-heavy. The VPS also runs the trading bot, so nothing renders there until that is decided
  (see `docs/PLAN.md`).

Fonts: Inter (SIL Open Font License, see `assets/fonts/Inter-LICENSE.txt`).
