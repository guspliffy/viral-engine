# BOARD: his-round (Never Has Money, episode 3)

Times are the VIDEO clock unless marked "story". Two 3-frame hit-stops (video 3.50, 7.50) add 0.1 s each, so the story
is 9.8 s: story = video before 3.5, video - 0.1 from 3.6 to 7.5, video - 0.2 after 7.6 (copy the `V()` helper in
storyboards/series/never-has-money/02-coffee-run/make-coffee-run.mjs).

## §1 Brief

- Joke: three empty glasses and it's Gunslinger's round. Pocket pat, the moth. "Bathroom!" He dashes into the toilet;
  Wizard and Reaper nod, put their coats on and tiptoe out. He peeks out: empty stools, round dodged! He sits down,
  pleased, and the Samurai bartender pushes the card reader in front of him: 84.00. Through the window his friends wave.
- Wants: Gunslinger wants to dodge paying the round. Consequence: his dodge leaves him alone with the whole night's bill.
- Ending: the wink to the Samurai, "Next time's on me!"; the Samurai doesn't blink and taps the reader once.
- Callback: frame 0 the Wizard sets the third empty glass down and points at him ("Your round!"); the last frame the
  Samurai's finger on the reader, the friends laughing outside.
- Source: /mnt/project-files/video-scripts/2026-11-05-never-has-money/03-his-round-ENGINE-PROMPT.md + 00-SERIES-FORMAT.md;
  panels storyboards/03-his-round/storyboard-eight-panels.png there; PANELS.md here. Gate: series episode, no animatic.
- Length exactly 10.00 s, loop no, profile short, cover 2.6 s (the moth).

## §2 Look

- Cast: `gsl` never-has-money/gunslinger, `rea` never-has-money/reaper, `wiz` never-has-money/wizard, `sam`
  bistro/samurai-waiter (bartender: white bar towel over his left shoulder, no sword, no paper hat, no apron).
  castLook "sheet", lighting 2, hatch { boil: 0.25 }, FOCUS false (all sharp), faces "strong", rig { hand 2, eyes 2,
  hold 2 }, motion { feet 2, overlap, timing, solve }, physics true: copy the template's flags.
- Set: type "plain" + painted plates (like EP01 at-dinner): far wall `assets/plates/pub-night.png` (window panes cut to
  alpha) at z -2.4, a street plate `assets/plates/pub-street-night.png` behind it at z -4.2; `life` off (interior).
- Light: warm amber key from the brass lamps (upper left), fire-orange fill; cool blue street light only through the
  window and outside. Palette: wood #5a3520, bar top #7a4a28, green wall #2f4a36, brass #d9a441, night #1d2b52.
- Music: a light Irish-pub fiddle reel, D major, ~116 bpm, lowCut 150, gain 0.3 (AI bed `pub-reel` if T2 makes one,
  else the procedural style closest to it). Parts: full 0-3.8, thin (fiddle only / hush) 3.8-5.9, full 5.9-7.5,
  silence at 7.5 (the reader stops), one last flourish on the wink ~9.0, then room tone. Hard cut 10.00.

## §3 World (metres; camera on the bartender's side at +z, looking toward -z; +x is screen right)

- Bar counter (`barcounter` from props-steak.js or a pub bar in props-pub.js): along x from -1.6 to +1.6, centre z 0.0,
  depth 0.45. Top height: at the seated potatoes' chest, elbows on it (match the stool height so the contact gate is clean).
- Three bar stools on the far side (customer side), seat centres z -0.5: `gsl` x -0.75, `rea` x 0.0, `wiz` x +0.75,
  all facing +z (toward us). Coats over the backs of `rea`'s (dark grey #4a4a52) and `wiz`'s (tan #a07850) stools.
- On the bar in front of them: 4 small clear tumblers (r ~0.035, h ~0.09): one empty in front of each friend
  (x -0.6, 0.05, 0.62 at z -0.1) + Gunslinger's with 2 cm of amber lemonade and a lemon slice at x -0.95, z -0.08.
- `sam` behind the bar on our side, at x +1.2, z +0.55, turned to face about -135 deg yaw (3/4 toward the friends, face
  readable from camera), polishing a tumbler with his towel. He walks to x -0.25, z +0.45 between 5.3 and 6.4 (while
  Gunslinger is in the toilet / peeking) so the close two-shot has Gunslinger left and him right (panels 6-8).
- Toilet: a dark-wood partition panel at z -1.35 from x -2.4 to -1.1, its door centred at x -1.6 (0.5 w x 1.05 h for
  potato scale, hinged on its left edge, opens toward us), a generic two-figure pictogram on it, a small lamp above it:
  RED when occupied, GREEN when free.
- Far wall plate (z -2.4): left dark-wood panelling (no painted door), centre bottle shelves + green banner with a gold
  potato emblem + brass lamps + plants from the beams, right a big arched multi-pane window (its panes cut to alpha)
  spanning about x +0.3 to +1.5, sill ~0.7 m, onto the street plate.
- Front door: off frame right (x ~ +2.4, z -1.5); the friends exit there at 5.1; the bell is there.
- Outside: Wizard and Reaper stand at x +0.75 / +1.1, z -3.2, under a street lamp, in cool blue light, visible in
  the window from 7.0.

## §4 Shots and action (video clock)

### §4.1 PAY UP (0.00-1.50, hook) wide

- Camera: from the bartender's side, a little above bar-top height, every face; top 384 px clear from 0 to 2 s.
- 0.00 Wizard's hand sets the third empty tumbler down (`tink` at 0.00), already moving at frame 0 (dur 0 at t=0).
  0.05 Wizard points at Gunslinger: "Your round!" (gibberish, subtitled, 0.05-1.3). 0.3 Reaper turns his head to
  Gunslinger. 0.2 Samurai looks up from polishing. By 1.0 every head on Gunslinger; he freezes, eyes wide.
- see: 0.0-1.5 gsl.face, wiz.face, rea.face, sam.face, the tumblers.

### §4.2 THE POCKET PAT (1.50-2.80) series block

- `pocketPat(c, { at: gsl seat, yaw: gsl yaw, friend: toward wiz })` + `patProps` from ../pocket-pat.mjs, seated (he
  stays on the stool; if the block's standing poses fail seated, he stands at 1.45 beside his stool first and says so).
- Camera: medium, front 3/4, chest up with the whole hat; Wizard's pointing glove at one edge (panel 2).

### §4.3 BATHROOM (2.80-3.50) wide, pan 6 deg left 3.10-3.60

- 2.85 thumb over his shoulder toward the toilet; 3.00 "Bathroom!" (subtitled 3.0-3.6). 2.95 hop off the stool,
  3.05-3.38 hurried walk (`step-indoor`) to the door, door open 70 deg by 3.25, he is through by 3.38, door swings shut
  3.38-3.46 (`door-close` 3.44), lamp snaps RED 3.50 (`latch-click`), hit-stop 1 at 3.50.
- The moth rides on his hat brim the whole time (worn).

### §4.4 THE NOD (3.50-3.80) wide, pan back 3.60-3.90

- Wizard and Reaper turn their heads to each other (3.52), one slow nod together (3.62-3.78).

### §4.5 TIPTOE (3.80-5.20) wide

- 3.80 both stand (off the stools on the far side); 3.95-4.45 each takes his coat off his stool back and swings it on
  (`cloth` 4.0 and 4.2): visible hand on the coat, then the coat worn. 4.5-5.1 they tiptoe to frame right BEHIND the
  stools (z <= -0.8), never in front of Gunslinger's stool, knees high, a finger to the lips (Wizard). 5.10 front-door
  bell (`ding`, soft), they are gone. Samurai's eyes follow them, still polishing, deadpan.

### §4.6 THE PEEK (5.20-7.00) wide until 6.0, then the close two-shot

- 5.25 the lamp goes GREEN, the door opens a crack (`door-open`); 5.45-5.90 Gunslinger's head and hat peek round it,
  looks left-right at the empty stools; 5.75 big grin (round dodged!). 5.95-6.40 he strolls back to his stool,
  6.40-6.65 climbs on, a happy sigh; 6.75-7.00 lifts the lemonade tumbler, sips, eyes shut (panel 6).
- Samurai walks to x -0.25, z +0.45 (5.3-6.4), sets his polished tumbler down.
- Cut at 6.0 to the close two-shot (panels 6-8): Gunslinger left, Samurai right, the window between them behind.

### §4.7 THE BILL LANDS (7.00-8.80) close two-shot

- 7.00 Samurai sets the card reader on the bar beside him (screen tilted up, glowing "84.00", plain digits);
  7.10-7.50 one flat finger push, it slides ~0.4 m flat on the wood (a scrape), stops in front of Gunslinger at 7.50
  (`ui-confirm` beep, music cuts), hit-stop 2 at 7.50. His fingers touch it while pushing.
- 7.55 Gunslinger's eyes snap open, tumbler lowered, shocked face, sweat drop; 7.7-8.7 looks at the screen, then up.
- 7.6-8.8 outside in the window: Wizard and Reaper wave with little fingers, laughing.

### §4.8 THE WINK (8.80-10.00) close two-shot

- `wink(c, { t: story 8.6, until: story 9.8, react })` from ../wink.mjs, aimed at the Samurai: "Next time's on me!"
  (subtitled 9.0-10.0). React: the Samurai doesn't blink, taps the reader once with one finger at 9.4; outside the
  Wizard snickers into his scarf. Hard cut at 10.00.

## §5 Check times (draft stills, qa/panels.mjs, one per panel)

0.6, 2.6, 3.3, 4.6, 5.7, 6.85, 7.9, 9.4
