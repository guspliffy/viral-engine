# NOTES: stonehenge-stone (Friends try to 08, the director's working memory)

## Where the build stands
- 14 Nov 12:24 Berlin Jonny's go; 12:47 "looks good" on the outline + 10-panel sheet (sheets in project files).
- DESIGN.md (Fable 5.2 subagent). Builder (Sonnet): engine/page/props-ftt-haul.js + bench/. Registry lines in props3d.js (director).
- Kit: branch aa-02-stonehenge-kit merged in (PR #233 not merged yet: this branch's PR waits on it). `fallensarsen fringe: false` added by the kit thread (0089e60).
- Score: assets/music/stonehenge-stone/ (four library takes, README there).
- Generator first pass on stand-ins (READY="" = boxes).
- Container setup: `npm ci` + `pip install opencv-python-headless numpy` (not preinstalled).

## Facts (on screen and spoken)
- UCL 2016 (Barney Harris): 10 people pulled a 1 t stone on a sycamore sledge over log rails. 25 t x 10 = ~250 is OUR estimate: always "≈".
- Wally Wallington (Michigan): levers + pivots alone, stood a ~9 t block in two days. So four friends with a lever is possible but slow:
  never say "impossible", show centimetres.
- Sarsens came from West Woods, 25 km north (Nash et al. 2020).

## Places (set frame s/y/r; world x = 124 - s, z = -r on PLACE(0))
- Stone (fallensarsen 4.25 x 2.1 x 1.1, 25 t) on the deck at y 0.84. Ropes A (+r) / B (-r): DESIGN 4; holds DESIGN 5.
- Lever Q (-2.64, 0.986); pole(d, pump) in the generator; hang points DESIGN 5.
- Ring (scale 0.4, built 0.5) 124 m ahead on the rail line. Crew at world (134, 0, 26) rot 180.

## Decisions
- Panel 03: Chip falls FORWARD on his face, not on his back as on the sheet: leaning away from the load, a slipping rope throws you forward.
- Panel 08: no phone in Mash's hand for the draft (a held prop for one look-up; the sheet has it). Shadow = fx "shade" sweep.
- Stake text "4 vs 25 t" + clock "0 m / 25 km" (readable without English, 82 % of TikTok viewers are DACH).

## Names looked up
- arm pose `{ world: [x, y, z] }` puts a glove on a world point (09b). `sit` without `seat`: `rot` + `height` (timeline.js 806).
- fx "shade": from, to (frame widths), width, angle, peak, color. `pitch` (deg, + forward), `lean` (deg, sideways).
