# Keeping it fast and cheap: renders, cache, farm, golden

Moved out of CLAUDE.md on 8 Nov 2026 (motion studio workflow); the text is unchanged. Read it when the task in CLAUDE.md's table says so.

- Judge a clip from its contact sheet, not by reading frame after frame. The exception is contact: a contact sheet
  missed every grip glitch, so look at grabs, raises and touches as a 10–15 fps strip.
- Sound-only changes: `--audio-only` (seconds) instead of a re-render.
- **Frame cache** (on by default for whole renders, `engine/cache.mjs`): a render keeps every frame it draws in
  `out/frame-cache/` under a key of everything that frame depends on, and the next render of the clip draws only the
  frames an edit reached (a changed reaction, caption or effect); a sound-only edit draws nothing and an interrupted
  render resumes. Keys cost seconds; a few reused frames are drawn again and must match, else everything is drawn.
  An edit to the set, camera, shots, cast or look redraws every frame. `--no-cache` turns it off, `--cache-verify`
  draws every frame and compares each one the cache holds. Shards on the farm don't use it.
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
  split works by hand: `--shard 3/12` on each machine, `--stitch 12` where the shards are collected.
- **Engine changes**: after changing anything in `engine/`, `characters/` or `assets/`, run `node qa/golden.mjs`
  (also runs on every pull request). It draws 12 approved stills (`qa/golden/golden.json`) with your working tree and
  with `origin/main` on the same machine (2.5 minutes each; main's are kept per commit) and fails on any changed pixel,
  with a sheet of main | now | difference | zoom in `out/golden/`. A change you meant goes to Jonny with that sheet;
  merging it makes it the golden look. Add a still to the list when Jonny approves a clip. The same run draws 12-frame
  motion strips of five regress moves (walk, turn, pick-up, hug, blink) and compares them by SSIM, so a change in
  timing or an arc shows too (`--no-motion` skips them).
