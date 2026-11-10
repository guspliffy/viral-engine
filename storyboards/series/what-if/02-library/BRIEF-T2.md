TASK T2: the power's look for What if EP02 "faster than sound": a flame streak with after-images and a ring of flame.
WHY: Phoenix is never drawn mid-trip (panels 02, 04, 05): the viewer reads his speed from an orange flame streak with
three fading after-images and loose pages fluttering behind it, and in the 100 laps from a ring of flame round Reaper's
reading table with two after-images riding it and papers spiralling up. It is the clip's one wow, seen in long-lens
wides (a 1.0 m potato is ~0.3 of the 1920 px frame).
DESIGN: BOARD §5 T2 (storyboards/series/what-if/02-library/BOARD.md); panels 02, 04, 05 of
/mnt/project-files/video-scripts/2026-11-08-what-if/storyboards/01-faster-than-sound-library/storyboard-eight-panels.png
(read them: PANELS.md "Other reads" has the after-image places); Jonny's brief
/mnt/project-files/video-scripts/2026-11-08-what-if/01-faster-than-sound-library-ENGINE-PROMPT.md ("The power").
RULES: determinism rules in CLAUDE.md; docs/rules/fast-cheap.md "Page code that keeps a mesh between frames".
READ: CLAUDE.md; `git show origin/what-if-03-light-speed:engine/page/props-race.js` (`lightstreak`: the approach to
copy, crossed fins + flat quad, additive, toneMapped false, deterministic crackle from a `clock` param);
engine/page/props-energy.js lines 1-60 (`glowy`, userData.steam: see-through for the contact checks);
engine/page/props-whatif.js (file layout, apply(ps)); engine/page/fxcel.js head (the existing "fire" palette, to match
its colours); `git show origin/what-if-03-light-speed:storyboards/series/what-if/03-light-speed/bench/make-race-props.mjs`
(a bench generator). Nothing else unless blocked.
OWN: engine/page/props-whatif-flame.js (replace the stub; keep the export name WHATIFFLAME_KINDS),
storyboards/series/what-if/02-library/bench/make-flame.mjs and the JSON it writes. Touch nothing else.
CONTRACT: BOARD §5 T2 exactly: `flamestreak` (spec.path, spec.len, spec.ghosts, spec.seed; params t, fade, clock),
`flamering` (spec.rx, spec.rz; params t, fade). Additive, no shadows, no outline, no point lights, see-through for
the checks. The ghost silhouette: drawn once into a canvas texture (round potato body, a crest of three feather
flames, two half-spread wings), on a camera-facing quad, fire gradient, soft edge.
MACHINE: yours for bench `--layout` and `--stills` only, one at a time (if `pgrep -f "engine/render.mjs"` shows
another, wait); never a draft or full render, never the farm, never the clip.
DONE WHEN:
- the bench in a plain room (the library set if easy: `"set"` from storyboards/series/what-if/02-library/faster-than-sound.json),
  camera like the clip's wide (pos [-1.1, 3.0, 10.5], look [-1.0, 1.15, -1.5], fov 31): a streak from
  [-3.5, 0.6, 1.0] to [1.5, 1.0, -5.0] at t 0.3, 0.6, 1.0 with its 3 ghosts; a ring round [-0.7, 0, -0.3] seen from
  the clip's high camera (pos [2.4, 5.4, 10.0], look [-0.6, 0.4, -2.4], fov 28) at two times 0.25 s apart (the
  flames and ghosts have moved round; papers rising), and at fade 0.5.
- stills contact sheet at storyboards/series/what-if/02-library/bench/flame.png (qa/contact.mjs), looked at once by
  you: the streak reads as fire, the ghosts read as Phoenix-shaped, nothing white-blown over 30 % of its area.
- the same frame rendered twice (or out of order) is pixel-identical.
OUT OF SCOPE: the generator, cameras, acting, sounds, fxcel.js or any shared engine file, the clip's renders.
Report back: STATUS / FILES / CHECKS / ASSUMPTIONS / NOTES, at most 150 words (.claude/agents/builder.md).
