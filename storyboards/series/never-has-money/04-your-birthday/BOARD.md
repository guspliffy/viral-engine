# BOARD: your-birthday (Never Has Money, episode 4)

Written after the staging proof (PANELS.md has the panels, the story chain and the departures). Numbers, not
adjectives. Jonny's brief and panels win.

## §1 Brief

- Joke: Viking's birthday. The Wizard pushes a huge purple present into his arms, Reaper sets a neat black box on top,
  and every head turns to Gunslinger, empty-handed. Pocket pat, moth. He scribbles a FREE HUG coupon on his knee.
  The friends snicker; Viking reads it, bursts into happy tears, drops the expensive presents and bear-hugs him off
  the floor.
- Wants: to give a present without paying for one. Consequence: the cheapest gift wins; the Wizard's expensive one
  lies ignored on the rug. Ending: over Viking's shoulder he winks at the stunned Wizard, "Next year's on me!".
  Callback: frame 0 the Wizard's present wins Viking's beam; the last frame the Wizard twitches, his present forgotten.
- Source: /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md, panels
  storyboards/04-your-birthday/storyboard-eight-panels.png there (4 x 2). Series episode: no animatic gate.
- Length 10.0 s of video (9.8 s of story + two 3-frame hit-stops at 4.2 and 6.1); loop no; profile short.

## §2 Look

- Cast: never-has-money/{gunslinger, viking, wizard, reaper}, castLook "sheet"; set plain + painted plate
  `assets/plates/birthday-living-room.png` (T2), `lighting`: 2, `life`: auto, cel at 0.25, hatch boil 0.25.
- Light: afternoon daylight from the windows behind and left of the cast, warm interior; palette: timber #b07a45,
  rug red #9a3a3a, Wizard purple #7a3fc4, gold #f2c23a, fire orange #f08a2c.
- Music: bounce, gain 0.3; signature sounds: partyhorn at 0.0, pat (claps), scribble, papercut (the tear), sit,
  put-down, the drop of both presents (book-close thuds), wink.

### §2.1 Props (T1, `engine/page/props-birthday.js`)

Sizes come from the staging proof (generator make-your-birthday.mjs, layout of 8 Nov).

| kind | size (m) | worn by / where | spec fields | look |
|---|---|---|---|---|
| `coupon` | sheet 0.36 x 0.26, 0.002 thick, origin at its centre | held (phone hold; grips SIZE.coupon) | `ink` 0..1 draws it stroke by stroke (border, FREE, HUG, hearts, doodle); `seed` | cream paper #fbf3dc, one torn (deckled) left edge; wobbly red marker border #d8433a 0.012 in from the edge; "FREE" over "HUG" in thick hand-lettered dark-brown marker #4a2a17, letters 0.07 tall; two small red hearts #e0485a either side of HUG; under it a doodle of two potatoes hugging (brown outline, #f2b44a fill, two green sprouts). Printed on its BACK (-z) like the iounote, mirrored onto +z too, so the phone hold shows it to whoever it is held out to. Readable at 360 px when it fills 45 % of the frame width. |
| `partyhat` | cone r 0.065 at the base, 0.19 tall, pompom r 0.03 | worn (`wear`: cast id, x/y/z in the body's frame, `tilt` degrees about z, `pitch` about x) | `pattern`: "stripes" (spiral stripes #e2423b / #f4c430, yellow pompom #f6d24a) or "dots" (#3f6fd8 with #f4d23c dots 0.012 across, yellow pompom) | glossy card, a thin black elastic under it is not needed |
| `rosette` | pleated ring r 0.055, centre disc r 0.03, two ribbon tails 0.09 long | worn on Viking's chest, his left of centre, on the fur | `color` #e9b93c | gold ring with darker pleats #c99520, centre disc #f6d36b, tails cut in a V |

Wear points (found in the bench, storyboards/lookdev/make-birthday-bench.mjs; body frame, x to the wearer's left):
Gunslinger's striped cone x 0.12, y 1.265, z -0.08, tilt 12; Viking's dotted cone x -0.11, y 1.27, z 0.03, tilt -10;
the rosette x 0.24, y 0.52, z 0.34 (keep x at most 0.24: further out it leaves the fur). The coupon's `ink` changes
the image of the texture it already has (looks.js copies a material's map into its toon material once).

### §2.2 Plate (T2, `assets/plates/birthday-living-room.png`, 768 x 1344)

A cosy wooden living room seen straight on at the eye height of a small child: warm timber plank walls and beams, a
stone fireplace with a lit fire in the middle of the back wall, two tall arched multi-pane windows either side with
blue sky and green trees, a paper garland of purple, yellow and pink triangle flags strung across the top, shelves with
jars and potted plants, a hanging plant. Afternoon daylight. No people, no table, no sofa, no rug, no presents, no cake
(the 3D stage has them). It replaces assets/plates/livingroom-golden.png at z -2.3, centre [0.3, 1.7], height 6.4: the
fireplace sits behind x 0.0-0.4 (between Gunslinger and Viking in panel 1), its mantel at y 1.2.

## §3 Shots

The shots are PANELS.md rows 1-8 at the beat times in the generator, on the story clock (video time minus the
hit-stops before it): P1 0 (wide, high, front), P2 1.5 (medium on Gunslinger, front left), P3 2.8 (medium on the crate,
a little from the right and above), P4 4.1 (close on the coupon), P5a 4.5 (the wide again: the snicker and the eye
roll), P5b 5.1 (close on Viking), P6 5.9 (medium-wide on the side hug), P7 6.8 (wide, eye level, from further back),
P8 8.6 (close over Viking's shoulder, a little above; the Wizard hops to W3 at 8.2 and stares up from the bottom
left, his eyes above the caption band). Positions and cameras are the generator's constants (W0..W3,
V0, VH, G0..G2, GEND, R0..R3, BB_LAND, CRATE, CAKE_TABLE, WIDE, PATSHOT, P3..P8). Spacing: at least 0.85 m between
any two body centres, except the hug (a written allowClip window).

## §4 Check times

Draft stills and qa/panels.mjs (one per panel, video time): 0.3, 2.2, 3.6, 4.4, 5.6, 6.6, 7.9, 9.4 s. Contact sheet
adds 0.05, 1.3 (every head on him at "And yours?"), 2.6 (the moth), 4.85 (the snicker).
