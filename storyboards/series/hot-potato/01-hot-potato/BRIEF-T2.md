TASK T2: the Hot Potato hand props: the coal (hpcoal), kitchen tongs (hptongs), rainbow bow tie (hpbowtie), fry-basket lift (hplift)
WHY: the whole game is one glowing coal passed from glove to glove. It must read as HOT at phone size (glowing
  orange-white cracks, a smoke trail), sit in a potato's gloves without poking through them, and fly as a thrown body.
DESIGN: Jonny's panel sheet `storyboards/series/hot-potato/01-hot-potato/panels-sheet.png` (5 x 2 panels): the coal in
  panels 01, 03, 05, 07; the tongs in 03; the host's bow tie in 03 and 10; the basket on its pole in 10.
RULES: CLAUDE.md "Rules that apply to every task"; `docs/rules/characters-grips.md`.
READ: `engine/page/props-sos.js` (header, SOS_GRIPS, one KINDS entry), `engine/page/props-hell.js` `fryerbasket` (a wire
  basket a character rides), `engine/page/props-okilied.js` `smokewisp` (a smoke trail that is steam for the checks),
  `engine/page/props-pumpkin.js` lines 1-40 (a worn prop: spec.wear), `storyboards/lib/grips.mjs` (HOLDS, SIZE),
  `storyboards/lookdev/make-grip-tests.mjs` usage header. Nothing else unless blocked.
OWN: `engine/page/props-hotpotato.js` (a stub exists: replace it, keep the export names `HP_KINDS`, `HP_GRIPS`),
  `storyboards/lookdev/make-hotpotato-bench.mjs` + the json it writes, and ONLY new `SIZE` entries for `hpcoal` and
  `hptongs` in `storyboards/lib/grips.mjs`. Touch nothing else (the registry lines in props3d.js are already in).
CONTRACT (metres; every size is a spec key with this default):
  hpcoal    one lump of charcoal, fist-sized: an irregular faceted lump about `r` 0.1 radius (0.2 across), origin at
            its centre. Near-black charcoal (#2a2422) with a web of glowing cracks and hot patches, orange (#ff7a1a) to
            white-yellow at the hottest (emissive: it must glow in the bloom), flickering slowly with clip time.
            Params: `glow` 0..1 (default 1) the strength of the heat; `smoke` 0..1 (default 0.6) a thin grey smoke
            wisp rising about 0.45 m from it (see-through / steam for the checks, never solid).
            Grips (HP_GRIPS.hpcoal): where each glove holds it when cupped in both hands from below and the sides
            (L and R), and a one-hand hold from below (palm up).
  hptongs   long steel kitchen tongs, `len` 0.55. Origin at the hinge (the handle end, where a glove holds them: give
            HP_GRIPS.hptongs), the two arms along +z ending in scalloped jaws. Param `open` 0..1 (default 0.25): 0
            jaws closed on a 0.2 m coal (they hold the coal at z 0.5), 1 wide open. Polished steel.
  hpbowtie  a big rainbow bow tie the host WEARS (spec.wear = his cast id; the director gives x, y, z on his body):
            0.36 wide x 0.17 tall, two puffy lobes and a centre knot, vertical rainbow stripes (red, orange, yellow,
            green, blue, violet, bright and saturated, a thin dark outline). Origin at the knot. Param `singe` 0..1:
            the colours darken toward brown and the edges char (he comes out of the fryer).
  hplift    the fry-basket lift. Origin = the centre of the basket's floor. A wire basket `w` 0.9 x `d` 0.8 x `h` 0.42
            (steel wire grid like fryerbasket, open top, bars thin enough that a potato standing inside reads through
            the front), a steel pole 0.05 thick standing at the basket's right side (x w/2 + 0.08) from `pole` 3.0 m
            below the basket floor up to 0.55 above its rim, with a short arm holding the rim. A character stands in
            it with { do: "ride" } exactly as with fryerbasket. Param `drip` 0..1: oil dripping from the basket floor
            (see-through for the checks). The wire and pole are solid.
MACHINE: the grip proof and draft stills of your own bench only (with `export CHROME_PATH=/opt/pw-browsers/chromium`).
  No layout pass or preflight on anything else, no draft or full render. One job at a time.
DONE WHEN:
- the file starts with a usage header (the kinds, every spec key and param with its default, sizes, origins, where
  a glove holds each prop)
- `SIZE` entries for hpcoal and hptongs in grips.mjs, and the in-hand proof for the coal held in both cupped gloves
  at chest height by `potatobrawl/spud` and for the tongs in one glove of `halloween/wizard-host`
  (`node storyboards/lookdev/make-grip-tests.mjs --prop hpcoal --hold <hold>`; if that tool cannot take a new kind,
  show both in your own bench instead): front and side stills, the gloves closed where a real hand would hold it,
  nothing through the glove
- the bench shows: the coal alone close up (glow 1, smoke 1); the coal in Spud's cupped gloves; the tongs in the
  host's glove holding the coal in their jaws (the coal carried by the tongs: `{ do: "carry", prop, by, off }`); the
  bow tie worn on the host's chest under his face (singe 0 and singe 1); the host standing in the lift basket
- you looked at your contact sheet next to the panel sheet; contact sheet at `out/hotpotato-bench.png`
OUT OF SCOPE: the set (task T1), fire, confetti, sounds, new arm moves, the episode's generator, any other engine file.
