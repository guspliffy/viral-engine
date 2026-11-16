# Block B builders (Atlantis EP03, 15 Nov 2026): read this first, then your own brief (B1 or B2)

You are a builder (.claude/agents/builder.md) in /home/user/viral-engine on branch `aa-03-atlantis-b`. Do not commit.
Read the kit's common rules first: storyboards/series/ancient-aliens/03-atlantis/kit/briefs/COMMON.md (house rules,
determinism, performance, usage header, Producer's bar). They all apply, with these block-B changes:

WHY THIS ROUND: Jonny rejected painted envs as the main look ("the character is standing in front of a picture"). His pick:
"All 3D like Stonehenge". Spud must stand IN the place: real 3D ground under his feet (contact shadows from the plain
set's shadow floor), real 3D things around him at several depths, a camera that can move and show parallax. The
PAINTING of your place is the LOOK TARGET (colours, density, light, detail), not a backdrop. Crops of the painting MAY
be used as textures ON real 3D geometry (e.g. a far rock layer card 50 m away, a texture on a rock), never as one flat
picture behind everything.

THE SET your place is built for (the generator sets it, your bench must too): `{ type: "plain", ...AT_UNDER }` from
storyboards/series/ancient-aliens/03-atlantis/kit/at-kit.mjs (background #2a8f96, floor "shadow": a see-through shadow
floor + depth mask, r 60, at the WORLD origin only), the place at `P.sicily` = PLACE(2) = (40000, 0) for B1 and the
shelf place PLACE(25) = (20000, 120000) for B2 (block B only). Top-level storyboard `"frame": "wide", "far": 1500`.
Your kind is ONE prop placed at the place origin (x, z = the place; y 0). In your place the SAND where Spud stands is y 0
and level (+-1 cm) inside the PLAY AREA your brief names; the water surface seen from below is at y +15 (Sicily) or as
your brief says. Note: the plain set's shadow floor sits at the world origin, NOT at your place: so your sand material
must take shadows itself (receiveShadow on a lit material, or a ShadowMaterial overlay at y 0.002 over the play area).

UNDERWATER LOOK (all of it in YOUR kind, nothing in shared files): a backdrop (a large inside-out sphere or cylinder,
fog: false, depthWrite false) graded by view elevation from the surface glow above (`#8fd8d0` near the zenith with the
surface's moving ripple pattern seen from below) to the near water `#2a8f96` at eye level to the far `#0f5560` below the
horizon; distance fog on every one of your own materials toward the water colour (1 - exp(-(d / 22)^1.4), full by ~60 m;
the backdrop never fogs); 8 soft light shafts (additive, depthWrite false, slow drift, softly fading top and bottom, no
hard edges); silt motes (instanced points 1-3 px, slow drift on the clip clock). The cast and the T4 props are not
fogged by you; keep near things clear. Pattern for underwater fog/shafts/silt: engine/page/set-stormlake.js lines 1-75
(header) and grep "shafts" / "silt" there; do not import it, copy the idea.

REUSE (already built, import nothing, the generator places them): `ingots` (39 bars), `fish` (silver school, big fish),
`bubbles` from engine/page/props-at-seabed.js (read its header lines 1-40 only). Do not build bars or fish.

ANIMATION: grass sways (tufts thick at the frame edges), shafts drift, silt drifts, the surface ripples: all from the
clip clock t that apply(ps, t) gets. Every animated value deterministic.

PERFORMANCE: CPU llvmpipe, 1920 x 1080. Merge static geometry per material, instance repeats (pebbles, shells, grass
blades, rocks), canvas textures drawn once and cached. A bench still must render in under ~60 s.

BENCH: your bench generator in storyboards/series/ancient-aliens/03-atlantis/block-b/bench/ (pattern:
kit/bench/make-at-seabed.mjs, but set type plain + AT_UNDER, your prop at the place, Spud potatobrawl/spud with `host("spud", 0)`
lamp prop from kit/aa-kit.mjs where the panel shows the lamp on). Stills: `node engine/render.mjs <json> --stills 0.5,2 --draft --out out/b-<name>`.
Side-by-side: for each camera, the still next to the plate (ffmpeg hstack, both scaled to 960 x 640 / 960 x 540) ->
`block-b/bench/b-<name>-vs.png` (one per camera), plus a contact sheet `block-b/bench/b-<name>-sheet.png` (qa/contact.mjs).
Look at them, compare with the painting, fix (at most 2 rounds), then report. Generated bench JSON and out/ are not committed.

MACHINE: 4 cores, 15 GB, shared with one other builder and the director's voice job: render one still at a time, never
--layout, preflight, a draft video, a full render or the render farm.
