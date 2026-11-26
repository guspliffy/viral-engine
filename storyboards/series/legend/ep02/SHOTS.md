# Legend ep 02 La Lechuza: shot list (director: this is the creative target; builder implements, no creative changes)

Look: tools/svg2d/lib/legend-mexico.mjs (MX) + cast from tools/svg2d/lib/legend.mjs (L). Read design notes:
/mnt/project-files/videos/folklore-legend/ep02/design/design.md. Proof scene to copy patterns from:
tools/svg2d/scenes/legend-mexico-proof.mjs. Story structure/timing/captions/mix pattern: storyboards/series/legend/ep01/ep01.mjs.
Lines: storyboards/series/legend/ep02/lines.json (L01-L20; speakers N narrator, G grandmother, K kid, O owl copying grandma).

GLOBAL
- 1080x1920, 30 fps. Timeline from real line lengths (like ep01). Captions word by word upper third (y 420) like ep01; key words
  yellow: lechuza, baby, owl, scream, salt, insult, breathe. O's line captions in italic (it's the fake voice).
- EVERY shot has slow camera motion (push in, pull out, slight drift); new picture every 2-3 s max: a long line gets 2-3
  cuts on word times (wordAt). Never a dead still. Hard cuts, no fades except where noted.
- mood(threat) per beat as below, eased between values inside a shot where noted (u = time in shot).
- Cast always alive: blinks, breathing, the kid's eyes follow sounds (look up when the roof creaks).
- Owl presets MX.OWL.* + owlPose blends; eerie default 1. Candle flame on grandma's jar = fear meter (keeper flame param):
  1 calm, shrinks with threat, 0.15 at worst, flares to 1.2 at the release.

BEATS (pre-gap / shot)
B0  (no line, 1.4 s) INTERIOR night, threat 0.2. Close on the shuttered window from inside, kid's hand (kid reachL) lifting the
    latch bar (latch 0 -> 0.8), shutters starting to open 0 -> 0.15. Baby cry SFX from 0.0. Slow push in.
B1  L01 G "Don't open it. That's not a baby." At line start grandma's staff/hand slams the shutters shut (open 0.15 -> 0,
    latch -> 0, 3 frames, slight camera shake 0.15 s). Medium two-shot kid + grandma by the window, push in to grandma on "baby".
B2  L02 K "Then what is it?" Close on the kid looking up at the shutter, eyes wide. threat 0.3.
B3  L03 N (narrator, ~8 s): 3 cuts on word times.
    a) "In Mexico, they call her La Lechuza." EXTERIOR wide: house, moon, mesquite, the owl perched on the roof (OWL.perch,
       facing -1 then head turn 2 -> 0 slowly = the 180 head turn toward camera). threat 0.4. Slow pull back.
    b) "A witch who turns into a giant owl..." owl medium, OWL.watch, spread 0 -> 0.25 slow, feathers puff a bit; push in.
    c) "...and cries like a baby, so children open the window." close on owl face, OWL.cry (beak opens on 'cries'),
       baby cry SFX layered, push in slowly. threat 0.5.
B4  L04 K "But what if it's a real baby?" INTERIOR two-shot, kid turned up to grandma. threat 0.35.
B5  L05 G "Real babies don't cry from the roof." Close on grandma deadpan, then on "roof" both look UP: dust particles fall from
    the ceiling vigas (small ochre dots, seeded) + roof-steps SFX. Hold 0.6 s after the line on the ceiling view (camera tilt up).
B6  L06 K "It's moving." (whisper) EXTERIOR roof level, owl walking along the roof edge right to left (X moves, crouch 0.3,
    step bob), then INTERIOR: kid + grandma heads turning following the sound. threat 0.55. Candle 0.6.
B7  (no line, 1.2 s) SILENCE: crying stops, music killed (see mix). Interior, slow push on the shutter. threat 0.6.
B8  L07 O "Open the window, sweetheart." Interior: the kid looks at grandma; grandma's mouth stays SHUT (no talk param during
    O's line!). Slow push on grandma's closed mouth. threat 0.75.
B9  L08 K "Grandma... that's you." Close on the kid, frozen.
B10 L09 G "I know." Extreme close on grandma, eyes sliding sideways to the shutter. Candle 0.4. Hold 0.4 s.
B11 L10 N "Lechuza is the Spanish word for barn owl. And barn owls don't hoot. They scream." Cuts:
    a) EXTERIOR (different place: a fence post/mesquite branch in moonlight) real small barnOwl sitting, threat 0.3, push in.
    b) on "scream": barnOwl beak open, short screech SFX, camera shake 0.1.
B12 L11 G "The salt. Where's the salt?" Interior wide: grandma grabs the SAL jar from the shelf, tilts it: empty (pour 0, a few
    grains). threat 0.6.
B13 L12 K "It was movie night!" Close on the kid, guilty, holding up an empty popcorn bowl (simple bowl prop in his hands is
    OK, small: a hand-drawn clay bowl with 3-4 popcorn bits; builder may draw it in the ep02 file). Comic beat, threat holds.
B14 (no line, 1.4 s) The THREAT peak: latch bar bending (latch jiggles 0..0.3), shutter gap opens 0.08, the owl's eye fills the gap
    (room outside: MX.outside + lechuza at ROOM.owlSpot, human 1, eyes wide). threat 1. Candle 0.15. Roof-steps + scratching.
B15 L13 G "Fine. The old way." grandma close, stern, pulls up her sleeves (approximate with arm move). threat 0.9.
B16 L14 K "The old way?" kid close.
B17 L15 G "We insult her." grandma close, deadpan. Music TURN here (pulse starts on the next beat's shutter opening).
B18 L16 G insults (~5 s): grandma throws the shutters open (open 0 -> 1 fast) and leans out yelling; 3 cuts on the three insults:
    a) two-shot from inside, shutters fly open, owl face right there outside; b) owl reaction: blinks, slightly startled (wide 0.4)
    but stays; c) grandma close, voice cracking at the end (her talk env does it), hand to her throat. threat 0.7 (warm
    starting to fight back: threat drops to 0.5 during the yelling, pops back to 0.8 when the owl doesn't leave).
B19 L17 G "Your turn." (hoarse) grandma pushes the kid forward to the window. two-shot.
B20 L18 K "Your feathers are... a bit messy?" kid at the open window, polite; the owl LEANS IN closer (lean 0 -> 0.6, size
    grows by camera push). threat 0.95.
B21 L19 K "You're not even a good baby! Real babies BREATHE between crying!" Cuts: a) kid close, brave, shouting;
    b) on "BREATHE": owl close, OWL.flinch (puff 1, wide 1), offended. threat 0.9 -> 0.3.
B22 (no line, 1.6 s) Owl takes off: EXTERIOR wide, OWL.flight, rises and flies off past the moon, loose feathers drifting
    (MX.feathers), wing takeoff SFX. threat 0.3 -> -1 (warm floods back: relief).
B23 L20 G "Not bad." Interior two-shot, warm relief (threat -1), candle flares 1.2, grandma hoarse, small proud nod, kid grin.
    HARD CUT at line end + 0.25 s. End.

SOUND MIX (prepare(); voices + music + sfx; loudnorm -14 like ep01)
- Voices at 1.0; O line through the window: already processed in the wav.
- Files: out/lechuza-pick/music/<id>/<id>-01.ogg and out/lechuza-pick/sfx/<id>/<id>-01.wav (use -02..-08 for variety of steps/slams).
- Music, per Codex Sol's cue sheet (/mnt/project-files/videos/folklore-legend/ep02/music/music-direction-sol.md):
  * 0.0 -> B7 start: lechuza-motif (gain 0.4); from B4 crossfade (0.8 s) to lechuza-sparse; KILL (0.25 s fade) at B7 start.
  * Silence through B7-B10. lechuza-accordion fades in (0.6 s) at B11 start, gain 0.35, through B17 (ducked to 0.15 under
    B11b scream).
  * lechuza-pulse starts hard at B18 start (shutters open), gain 0.45, fades to 0 by B20 start (0.5 s) except a held tail: keep
    lechuza-accordion at 0.25 under B20.
  * SILENCE under B21 (everything music off).
  * lechuza-release from B22 start + 0.3 s, gain 0.45, under B23, cut with the picture.
- SFX: baby-cry-outside from 0.0 (gain 0.5), again under B3c (0.4) and B6 (0.35, panned to suggest moving: use pan filter); stops at B7.
  shutter-slam-01 at B1 lineAt (0.7), shutter-slam-02 at B18 open (0.6); roof-steps-0x as 4-6 steps under B5 end and B6
  (0.25 s apart, 0.45), and 3 scratches in B14; barn-owl-screech-01 at B11 "scream" (0.6); owl-wings-takeoff-01 at B22
  start (0.7); desert-night-bed-01 looped under the whole video at 0.12 (exterior shots could lift it to 0.2: optional).
- Write mix to out/legend-ep02/mix.wav and timeline.json like ep01.
