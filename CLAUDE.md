# viral-engine

Characters + storyboards in, 1080x1920 30 fps MP4s out: Three.js in headless Chromium (CPU, Mesa llvmpipe) + ffmpeg.
Background music `puppet/beat.mjs`, voices `engine/voice/` (VoxCPM2 / Kokoro). Jonny (producer) owns the premise,
characters, look, new art, rights and money (zero paid AI). State: `docs/STATE.md`. Roadmap: `docs/PLAN.md`.

## Read only what the task needs

| Task | Read |
|---|---|
| Any clip: the order of work, roles, gates, briefs, delivery | `docs/rules/workflow.md` |
| What the checks fail, warn or note; publishing; house style; sound | `docs/rules/output.md` |
| Cast, contact and grip rules (grip rule n = rule n there) | `docs/rules/characters-grips.md` |
| Writing a clip from a brief or storyboard panels; the template | `docs/rules/writing-clips.md` |
| New motion, physics, living worlds, scenery | `docs/rules/movement.md` |
| Render speed, frame cache, render farm, engine changes + golden | `docs/rules/fast-cheap.md` |
| Storyboard format | `docs/STORYBOARD.md` |
| Creative reviews A and B, delivery self-review | `qa/REVIEW.md` |
| Assets and their licences | `docs/ASSETS.md` |
| Agent roles | `.claude/agents/*.md` |

## Commands

```bash
node storyboards/<topic>/make-<clip>.mjs                       # generator -> storyboard JSON
node qa/preflight.mjs <sb>                                     # one verdict before any render; FAIL blocks
node qa/clear.mjs <sb>                                         # floor plan: bodies in each other or furniture (1-2 s)
node engine/render.mjs <sb> --layout                           # layout + contact gate (~2 min)
node engine/render.mjs <sb> --layout --from 3 --to 4.5         # fix round: only those seconds (~30 s), then full again
node qa/camfit.mjs <sb> --at <s> [--pos x,y,z --look x,y,z --fov f]   # faces + free subtitle spots for a camera (1 s)
node engine/render.mjs <sb> --stills beats --draft --safe      # draft stills (~1 min)
node qa/contact.mjs <dir>/<id>-*.png --out <sheet.png>         # contact sheet of stills
node engine/render.mjs <sb> --draft                            # draft render (~2 min) = the animatic
node qa/check.mjs out/<id>.mp4 --sb <sb> --layout out/<id>.layout.json   # checks on a render
gh workflow run render.yml -f storyboard=<sb>                  # full render on the free render farm
node qa/golden.mjs                                             # after any change in engine/, characters/, assets/
node qa/regress.mjs                                            # after a rig, grip or contact-check change
```

## Rules that apply to every task

- Renders are deterministic: the same storyboard gives the same video, any frame in any order (frame cache and farm
  shards depend on it). No `Math.random`, no wall clock; page code that keeps a mesh between frames keys it on exact inputs.
- New clips start from `storyboards/templates/clip-template.mjs`; Jonny's brief and panels are the target and win
  over any reviewer note. Departures go in the delivery with a reason.
- A check FAIL blocks the render (`--force` only with a written reason). At most 3 check-fix rounds, then stop and report.
- Judge from contact sheets, phone sheets and 10-15 fps strips of every contact, never by feeding a video to a model.
- Claude can't hear: Jonny judges sound at the timestamps `qa/risky.mjs` picks.
- Nothing is posted by Claude. Merge only after Jonny says "merge it" and every check on the head commit is green.
- One owner per file across threads; merge main in before each merge (props3d.js registry conflicts).
- Write agent-facing text in English; talk to Jonny in the language he writes in.

## Folder map

`engine/` renderer (page/ = browser side) · `characters/` cast JSON · `storyboards/` generators, `lib/` (clip.mjs,
acting.mjs, grips.mjs, moves), `templates/`, `series/` · `qa/` checks · `assets/` models, envs, sfx, music, mocap ·
`tools/` one-off builders · `docs/` plans, rules, templates · `experiments/` A/B tests · `puppet/` music.
