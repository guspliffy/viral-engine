# Clip writer brief: Never Has Money 04 "your birthday" (director, 8 Nov 2026)

```
TASK W1: write the clip generator make-your-birthday.mjs (staging, camera, acting, timing) on top of the staging proof
WHY: the cheapest gift wins. Frame 0 the Wizard proudly hands Viking the biggest present; the last frame the Wizard
     stares at it ignored on the rug while Gunslinger, lifted in Viking's bear hug, winks "Next year's on me!"
DESIGN: Jonny's brief /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md
        (series format 00-SERIES-FORMAT.md there); his eight panels
        /mnt/project-files/video-scripts/2026-11-05-never-has-money/storyboards/04-your-birthday/storyboard-eight-panels.png
        (4x2; panels win over the brief's camera words where they differ); PANELS.md here (rows, story chain, departures).
RULES: CLAUDE.md, docs/rules/workflow.md ("The story chain", "Check windows"), docs/rules/writing-clips.md,
       docs/rules/characters-grips.md
READ: the generator here (the staging proof: positions, facings, the eight cameras P01-P08, the hug keyframes HUGK);
      storyboards/series/never-has-money/pocket-pat.mjs + wink.mjs (series blocks: use them, don't copy them);
      storyboards/series/never-has-money/02-coffee-run/make-coffee-run.mjs (an episode that already uses both blocks);
      storyboards/lib/clip.mjs, acting.mjs, grips.mjs
OWN: make-your-birthday.mjs, your-birthday.json, PANELS.md (append your departures). Touch nothing else.
MACHINE: yours for preflight, --layout and draft stills; one such job at a time. No full renders.
```

## Fixed by the staging proof (keep unless a still proves a beat can't be seen; then say why)

- Places and paths: G0, V0, W_IN, R_IN, W0, R0, CRATE, G1, W1, R1, V1, HUG/HUGK, W2, R2 (PANELS.md "Departures" says why
  each exists: rows swap with a cause, over-the-shoulder coupon handover, the hug swings, cake table front left, crate
  visible from frame 0).
- Cameras: P01-P08 at the panel times (beats 0, 1.5, 2.8, 4.1, 4.6, 6.0, 7.0, 8.7). The brief's slow 5% push-in during
  the hug (6.0-8.8) is yours to add on P06/P07 if it doesn't cost a face.
- Length: END 9.8 + two 3-frame hit-stops (4.2 coupon up, 6.1 hug lands) = exactly 10.00 s; hard cut at 10.00.

## What you add (the brief's five beats, PANELS.md story chain 1-13)

- The acting: every glance that leads the eye (1.1 all heads to Gunslinger; the Wizard and Reaper glance at each other
  4.6-5.2; the Wizard's stare and jaw drop at his present in 07; Reaper dusts his box), faces (tears, trembling lip,
  tongue out writing, huge grin), the "wait!" finger 2.8, pen from the hat band, paper from the bandana, scribble with
  pen squeaks, tear-off, the handover, the drop (physics: the black box bounces off the purple one), the lift, the rock.
- Series blocks: pocketPat(c, {who: "gsl", ...}) 1.50-2.80 (the moth lands on his cowboy-hat brim and stays there from
  2.8); wink(c, {who: "gsl", t: 8.8, line: "Next year's on me!", react: Wizard's LEFT-eye twitch + sweat drop}) done
  over Viking's shoulder while still lifted.
- Lines (gibberish, every one subtitled, y between 470 and 1360, never in the top 20% before 2 s): Wizard 0.05 "Happy
  birthday!", Wizard 1.10 "And yours?", Viking 5.90 "Best… gift… EVER!", Gunslinger 9.00 "Next year's on me!". Reaper
  silent. Voices: the series' cast voices (see coffee-run).
- Sound: partyhorn 0.00 (the Wizard's horn, put away by 0.60), wrapping-paper rustle, the pocket pat (block), fast pen
  squeak, paper tear, sniffle, big happy sob, two papery thumps on the rug (book-close style), cloth on the hug squeeze,
  ai/warm-resolve under the hug. Only sounds in assets/sfx/manifest.json.
- Music: there is no ukulele/glockenspiel style in puppet/beat.mjs (no engine changes in this task). Default:
  { style: "bounce" (plucked off-beat chords + claps), bpm: 120, key: 0 (C), lead: "bell", lowCut: 150, gain: 0.3 },
  parts: main from 0, "hush" 5.20-5.90, back on the hug (6.0), its last note on the wink. Say so if you pick another.
- Visible windows: c.see(t0, t1, [...], why) for every chain beat's must-see (the coupon at 4.1-4.6 as "coupon", both
  faces in the hug, the Wizard's face in 08).

## Parts built for you (contracts; the director wires them before you start)

Wired into the generator already (keep the ids):
- **Plate** (T1) `assets/plates/birthday-living-room.png`: z -2.2, centre [0, 2.45], height 5.0 (2.96 m wide): the
  fireplace behind the cast (its top ~1.9 m), the shelf ~2.3 m, the arched windows above (they show in the higher or
  tighter shots). It covers every panel camera; a camera that looks further left/right or up than P01/P07 may show its
  edge (check the still).
- **Props** (T2, `engine/page/props-birthday.js`; bench `bench-props.mjs`, stills sheet /tmp/claude-0/t2/bench.png):
  - `coupon` 0.30 x 0.24 m, drawing on +z, `ink` 0..1 writes it stroke by stroke (12 strokes), `fold` 0..1 (1 = the
    folded 7.5 x 6 cm square from his bandana; swaps at 0.5). ink and fold tween only from their second c.prop: set
    them once with dur 0 first. grips.phone holds it (SIZE row added); it turns a held picture away from the holder,
    so set `flip: true` on the spec to show the drawing to whoever he holds it out to.
  - `bowgift` (giftP 0.46 x 0.34 purple/gold with the smiley medallion; giftB 0.22 x 0.14 black/silver): solid, `lid`
    0..1, grips.box sizes come from the spec's w/h. Physics drops are yours (c.drop / c.knock; "physics": true is on).
  - `partyhat` hatG (red/yellow stripes, on top of the cowboy hat) and hatV (blue, yellow dots, in Viking's hair),
    `rosette` ros on Viking's chest: worn (spec.wear), non-solid. `bunting` bunt across the top (y 2.22, z -1.5).
- Placeholders still yours to replace: the pen (props3d `feltpen` or `pencil` exist), the moth/wallet come with the
  pocket-pat block (patProps), the Wizard's party horn (`partyhorn`).
- Seen in the staging stills, for you: at 7.8 the purple box on the rug hides behind Reaper/the hug (chain beat 12 needs
  the Wizard staring at it: move the drop spot or the Wizard); the cake table (-1.6, 1.55) is out of P01's frame
  (the panel has it bottom left: move it in or let it go, with a reason).

## Hard rules

- The hug: close, never intersecting; Viking's arms round Gunslinger's sides and back, never out of his chest;
  Gunslinger's arms over Viking's shoulders; his hat and the moth clear of Viking's face. The coupon stays in Viking's
  mitten through the hug (paper against Gunslinger's back, never through it).
- Gunslinger's party hat sits on top of his cowboy hat the whole clip. Viking's small blue cone with yellow dots stays
  on in 06-08. The coupon reads on a phone at 4.1-4.6: "FREE HUG" about a quarter of the frame width, held at chest
  height, never in front of his eyes.
- allowClip: only for contact the beat needs (a hand on what it holds, the hug) or a moment no camera sees; each with
  its reason. Never a body through furniture or another body on screen: re-stage or resize instead.
- Determinism: no Math.random, no clock.

## DONE WHEN

- `node qa/preflight.mjs <sb>`: no FAIL; `node engine/render.mjs <sb> --layout`: contact gate clean.
- Draft stills at the panel times (`--stills 0.6,2.2,3.5,4.3,5.6,6.4,7.8,9.5 --draft --safe`) and
  `node qa/panels.mjs <stills> --panels <board> --grid 4x2 --out /tmp/claude-0/writer/panels.png`: every chain beat's
  must-see readable at 360 px wide.
- Report (<= 200 words): STATUS, FILES, CHECKS (tails + the sheet path), departures with reasons, every on-screen
  allowClip window, open questions each with your default.
