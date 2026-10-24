# viral-engine

Character-driven short videos, rendered from data. Characters and storyboards are JSON files; the engine turns a
storyboard into a vertical 1080×1920 MP4 (plus a cover frame) with 3D characters, camera shots, effects and captions.
No filming, no stock footage, no cost per video.

Status: **v0.1, pipeline test.** Two PotatoBrawl fighters (Wizard, Gunslinger), one set (meadow), no sound yet.
See [`docs/PLAN.md`](docs/PLAN.md) for the roadmap, decisions and open questions.

## Quick start

Needs Node.js 18+, ffmpeg and a Chromium build.

```bash
npm install
npx playwright install chromium      # once; or point CHROME_PATH at an existing Chromium
node engine/render.mjs storyboards/test-01-golden.json
# -> out/test-01-golden.mp4 and out/test-01-golden-cover.png
```

Useful flags:

| Flag | What it does |
|---|---|
| `--stills 0.5,3.2,7` | Renders PNG stills at those times only (seconds). Fast way to check a shot. |
| `--safe` | Draws the area TikTok's buttons and text don't cover, as a dashed box. |
| `--from 2 --to 4` | Renders only part of the timeline. |
| `--draft` | Fast preview: 3D at half resolution, no anti-aliasing (captions stay sharp). About 3x faster. |
| `--png` | Lossless frames into the encoder instead of JPEG q95. Slower, rarely visible after H.264. |
| `--out dir` | Output folder (default `out/`). |

Rendering is deterministic: every frame is drawn at a fixed time `t = frame / fps`, so the same storyboard always
gives the same video, however fast or slow the machine is.

Speed on a 2-core machine without a GPU (software WebGL): about 1.8 s per frame at full quality (a 9 s clip in
about 8 minutes) and 0.55 s per frame with `--draft`. Most of the time is lighting the pixels; a machine with a real
GPU should be much faster (not measured yet).

## How it works

```
characters/*.json ─┐
                   ├─► engine/render.mjs ──► headless Chromium (Three.js scene, one frame per step) ──► ffmpeg ──► out/*.mp4
storyboards/*.json ┘
```

- `engine/render.mjs` serves the repo locally, opens `engine/page/index.html` in headless Chromium, calls
  `ENGINE.frame(t)` for every frame, reads the composed canvas (`ENGINE.capture`) and pipes the frames into ffmpeg
  (H.264, yuv420p, plus a silent AAC track so editors and TikTok's sound picker get an audio stream).
- `engine/page/` is the browser side:
  - `stage.js` renderer, lights, set, cast, particles; captions and flash are drawn on a 2D canvas over the 3D frame
  - `timeline.js` turns the storyboard into per-frame state (pure function of time)
  - `potato.js` the potato rig: lumpy body, face, limbs, squash and stretch
  - `face.js` eyes, brows, mouth, blush and the expression presets
  - `costumes.js` hats, sprout, held props (wizard staff with charge glow)
  - `props.js` alternative forms (the fries box)
  - `sets.js` sky, ground, hills, clouds, flowers, lights

## Characters

`characters/<franchise>/<name>.json`. Example: `characters/potatobrawl/wizard.json`.

| Field | Meaning |
|---|---|
| `body` | colour, height, width, depth, `lump` (how uneven), `seed` (the lump pattern) |
| `limbs` | colour and thickness of arms and legs |
| `face.default` | resting expression (see below), iris and blush colours |
| `sprout` | the leaves; `placement`: `top`, `hat-top` or `hat-brim` |
| `costume` | `type` (`wizard`, `cowboy`), colours, `propHand` (`L` / `R`) |
| `personality`, `voice`, `notes` | for scripting; not used by the renderer |

Expressions: `kind happy delighted eager cocky smug shocked sad evil focused stern deadpan`.

## Storyboards

`storyboards/<id>.json`. `test-01-golden.json` is the reference example.

- `fps`, `duration` (seconds), `cover` (time of the cover frame)
- `set`: `{ type: "meadow", sky: [top, horizon], ground: [inner, outer], seed }`
- `cast`: `{ id, character, at: [x, z], face, expr, arms: { R, L } }`. `face`: `camera`, `left`, `right`, `3q-left`, `3q-right`, `back` or degrees.
- `shots`: camera cuts. `{ at, pos, look, fov, to: { pos, look, fov }, dur, ease }` — a shot lasts until the next one starts; `to` makes it move.
- `actions`: `{ who, at, do, dur, ease, ... }`
  - `move` `{ to: [x, z] }` walks there · `hop` `{ count, height }` · `turn` `{ to }` · `lean` `{ to: degrees }`
  - `expr` `{ expr }` · `look` `{ to: [x, y] }` eyes, -1..1 · `talk` `{ rate }` mouth flaps · `blink` · `noblink`
  - `arm` `{ side: R|L|both, pose }` poses: `rest up wave point shrug hips cast hold hat fist cheeks`
  - `charge` `{ to: 0..1 }` prop glow · `droop` `{ to }` leaves · `swap` `{ form: "fries" }` · `hat` `{ off: [x,y,z], spin: [deg,deg,deg] }`
  - `squash` `{ amount }` · `hide` · `show`
- `fx`: `flash`, `shake` `{ amp }`, `poof` `{ who | pos, spark }`
- `captions`: `{ from, to, text, pos: top|mid|low|<px>, style: main|sub, pop }`. Captions stay inside the TikTok safe zone.

Easing names: `linear in out inOut back elastic`.

## Rules

- Nothing in the engine uses `Math.random` or the clock: same input, same video.
- No real people, no other franchises' characters, no brand marks. Format ideas from trends are rebuilt with our own
  cast and our own joke; footage from other creators is never used.
- Every post gets TikTok's AI-generated label switched on.
- Rendering is CPU-heavy. The VPS also runs the trading bot, so nothing renders there until that is decided
  (see `docs/PLAN.md`).

Fonts: Inter (SIL Open Font License, see `assets/fonts/Inter-LICENSE.txt`).
