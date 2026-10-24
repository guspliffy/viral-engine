# Game puppets

The second renderer in this repo. It draws PotatoBrawl's own fighters on PotatoBrawl's own maps with the game's
own drawing code, and moves them with our choreography. This means the characters look exactly as they do in
the game. The 3D engine (`engine/`) is the other renderer. Both follow the rules in `../CLAUDE.md`.

```bash
node puppet/render.mjs storyboards/puppet/dance-01-the-spin.json            # MP4 + cover + layout + WAV in out/ (about 25 s)
node puppet/render.mjs <sb> --stills 1.5,7.8 --safe                          # PNG stills with the safe zone (seconds)
node puppet/render.mjs <sb> --audio-only --no-music                          # same picture, no placeholder beat (for posting with the trend sound)
node qa/check.mjs out/dance-01-the-spin.mp4 --sb storyboards/puppet/dance-01-the-spin.json
```

Flags: `--stills t,t`, `--layout`, `--safe`, `--audio-only`, `--no-music`, `--silent`, `--from s --to s`, `--png`,
`--out dir`. `--draft` is accepted, but a full render already takes about 60 ms a frame.

## How it works

- The game must be checked out next to this repo (`../potatobrawl`) or at `POTATOBRAWL=/path`. The renderer uses
  its built test page, `build/test.html`, and runs `python3 game/build.py` if that page is missing.
- The game's code is never changed. The renderer writes a copy of the page to `out/.puppet-page.html` with one
  hook added before `window.__blastline = {` in `ui/loop.js`. If that line ever changes, the renderer stops
  with a clear error.
- `page/moves.js` and `page/runtime.js` run inside the game's scope. Each fighter is a stand-in in the finisher
  state (`state: "fin"`). The game's `pose()` calls the fighter's `finPose` hook, and our hook returns the hands,
  feet, lean, crouch, hop, spin, wings, face and mouth for time `t`. The KO pages use the same hook.
- The game's loop never runs, because `requestAnimationFrame` is stubbed out. `Math.random` is reseeded on every
  frame. So a frame depends only on `t`, and the same storyboard always gives the same video (checked).
- Sound: the voices and effects come from `engine/audio.mjs`, fed a translated storyboard. The mouths follow the
  same syllable plan as the voices. The placeholder beat comes from `beat.mjs`. The loudness is normalised to
  −14 LUFS.

## Storyboard

`storyboards/puppet/*.json`. The units are game units: the kitchen counter top is `y = 0`, up is negative, and a
fighter is about 64 tall and 44 wide.

| Key | What it is |
|---|---|
| `map` | `moon` `bay` `castle` `fryer` `field` `kitchen` `deep` |
| `cast[]` | `{ id, fighter (game id), skin (0..), x, facing (1 right / -1 left), expr, z (draw order), voice (overrides) }` |
| `camera[]` | `{ at, x, y, z (zoom), dur, ease: linear in out inout snap }`; the first entry is the start |
| `music` | `{ bpm, offset, gain, parts: [{ at, part: intro main build drop stop }] }` |
| `actions[]` | `{ who, at, dur, do, ... }`, see below |
| `fx[]` | `notes` `sparkle` (on `who`), `lines` (manga focus lines), `flash` (peak ≤ 0.85), `spot`, `shake` |
| `captions[]` | `{ at, end, text, style: main / sub, pos: top / mid / low / px }`, kept inside the safe zone |
| `sfx[]` | any sound from `engine/audio.mjs` by name, `{ sound, at, gain, pan }` |

### Actions

- **Body moves** (one at a time, blended in over 0.12 s and out over 0.18 s), on the music's beat:
  `bounce` `nod` `groove` `roof` `point` `floss` `wave2` `step` `clap`. Others: `wave` `shrug` `hips` `tada`
  `flare` `wobble` `walk` `tiptoe` `idle`, plus `hold` (freeze whatever the body was doing). `amp` sets the size
  (0.3 is a half-hearted copy) and `speed` the beat multiple.
- **Added on top**: `hop` (`count`), `spin` (`turns`), `shake`, `lean`.
- **Moving**: `walk` / `slide` with `to` (stage x) or `by` (distance). A `walk` with `style: "tiptoe"` uses tiptoe legs.
  `turn` flips the facing, or `to: "left"` / `"right"`.
- **Face**: `face` with `expr`: `terror` `grin` `rage` `calm` (eyes closed) `dazed` `ko`, or `""` for the
  fighter's own face. It lasts until the next `face`, or for `dur`. `sting: true` on a terror face adds the "dun!".
- **Talking**: `talk` with `dur` and `tone` (`calm` `excited` `sad` `question` `chant`) speaks gibberish in the
  fighter's voice (`cast.json`), and the mouth opens on the syllables.

`storyboards/puppet/puppet-moves.json` shows every move one after the other, as a test sheet.

## Limits (as of 2026-10-24)

- The fighters are drawn side-on only, so there is no front view and no turning to the camera.
- The head can't move on its own. A nod is a lean of the whole body.
- There are no props beyond what the game draws (the Reaper's scythe stays in his front hand). There is no
  sitting, kneeling or carrying yet. The comedy scripts need these (see the comedy doc's "What the puppet needs").
- The voices are proposals until Jonny has listened. Claude can't hear the audio.
