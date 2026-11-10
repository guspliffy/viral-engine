# Keeping it fast and cheap: renders, cache, farm, golden

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

- Judge a clip from its contact sheet, not by reading frame after frame. The exception is contact: a contact sheet
  missed every grip glitch, so look at grabs, raises and touches as a 10–15 fps strip.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- **Fewer layout passes** (9 Nov 2026: a clip ran about 28, each about 2 min and several turns of a long context):
  - `node qa/clear.mjs <sb>` after every staging edit: bodies in each other or in floor props on a floor plan, 1-2 s.
  - `node qa/camfit.mjs <sb> --at <s> --pos ... --look ... --fov ...` to try a camera or a subtitle spot: the faces,
    eye lines and free subtitle tops for that camera from the last layout, in a second (eyes match the layout's px).
  - Fix rounds: `node engine/render.mjs <sb> --layout --from 3 --to 4.5` lays out only those seconds into the last full
    layout (about 30 s for 1.5 s of a 10 s clip, against 2 min 20) and prints what the fix changed. A window gives the
    same contact rows as a full pass (character boxes can differ by a pixel or two); the rest of the clip is the last
    full layout's, so lay the whole clip out again before a draft (preflight does it by itself).
  - `qa/preflight.mjs` now judges the captions too (safe zone, the brief's `captionBand`, hidden behind characters), so
    a subtitle over a face fails before a draft instead of on one.
- **Frame cache** (on by default for whole renders, `engine/cache.mjs`): a render keeps every frame it draws in
  `out/frame-cache/` under a key of everything that frame depends on, and the next render of the clip draws only the
  frames an edit reached (a changed reaction, caption or effect); a sound-only edit draws nothing and an interrupted
  render resumes. Keys cost seconds; a few reused frames are drawn again and must match, else everything is drawn.
  An edit to the set, camera, shots, cast or look redraws every frame. What only the checks read (a waiver window,
  a must-see list, the panels file, the caption band) redraws nothing, or only the frames whose pose a waiver moved
  (10 Nov 2026: one added window used to redraw all 315 frames). `--no-cache` turns it off, `--cache-verify`
  draws every frame and compares each one the cache holds. Shards on the farm don't use it.
- **A render doesn't lay the clip out twice** (10 Nov 2026): the contact gate before a draft or a full render uses
  the last full layout while it is still this clip's (same storyboard, characters, page code and loaded files, by
  content), so the pass preflight just made isn't repeated (about 2 min on a 10 s clip). `--fresh-layout` lays out anew.
- **Page code that keeps a mesh between frames** (a memo of the last pose) must key it on the exact inputs, never a
  rounded value: a mesh built for a slightly different pose made a frame depend on the frame drawn before it, so a
  cached frame or a farm shard's first frame came out different (4 Nov 2026: arm tubes, glove skins, brows, hat sway).
- Render the second style (`--style anime`) only when it's asked for or being A/B-tested.
- Renders draw on the CPU with Mesa llvmpipe (`--gl llvmpipe`, the default since 30 Oct 2026; it needs Xvfb), about
  3x faster than the old SwiftShader (`--gl soft`). Motion blur only smears the very fastest moves (Jonny, 4 Nov: 144 px
  of smear before a frame blurs, `engine/render.mjs` BLUR; 48 px drew 39 % slower); it used to take 62-73 % of a clip's render time
  (`/mnt/project-files/engine/render-measure-01/report.md`). Run full renders in the background and keep working. Two renders at once on one machine gain only ~10 %. On a
  machine with a graphics card, try `--gl gpu` on a 1 s range (`--from 4 --to 5`) and compare the timing line; the
  "stage ready" line names the renderer actually used.
- **Render farm** (Jonny OK'd 28 Oct 2026): `.github/workflows/render.yml` cuts a clip into frame ranges, draws them on
  up to 20 free GitHub runners at once and joins them (`gh workflow run render.yml -f storyboard=<sb> -f flags="--draft"`,
  or Actions → Render a clip). The MP4, cover and check result are the run's `clip` artifact for 3 days, downloadable
  by anyone on GitHub (the repo is public): fine for clips Jonny is about to post, not for anything private. The same
  split works by hand: `--shard 3/12` on each machine, `--stitch 12` where the shards are collected. The farm keeps
  spoken lines between runs on a branch (10 Nov 2026), so only a new or changed line is read again; before, every run
  of a clip with a VoxCPM2 voice spent 6 to 14 minutes on the same lines.
- **Engine changes**: after changing anything in `engine/`, `characters/` or `assets/`, run `node qa/golden.mjs`
  (also runs on every pull request). It draws 12 approved stills (`qa/golden/golden.json`) with your working tree and
  with `origin/main` on the same machine (2.5 minutes each; main's are kept per commit) and fails on any changed pixel,
  with a sheet of main | now | difference | zoom in `out/golden/`. A change you meant goes to Jonny with that sheet;
  merging it makes it the golden look. Add a still to the list when Jonny approves a clip. The same run draws 12-frame
  motion strips of five regress moves (walk, turn, pick-up, hug, blink) and compares them by SSIM, so a change in
  timing or an arc shows too (`--no-motion` skips them).
