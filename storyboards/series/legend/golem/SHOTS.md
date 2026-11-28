# The Golem of Prague: shot list (director, 27 Nov 2026). H1 iron rungs + E1 song twice. TITLE-CAPTION TRIAL.
Lines: lines.json; final voices out/legend-golem/vo (post-voice.py + trim-tails.py done; words.json per line = Whisper on the
final takes). World lib tools/svg2d/lib/legend-golem.mjs (+ legend.mjs hosts); proof tools/svg2d/scenes/legend-golem-proof.mjs
shows every set/pose working (reuse its hosts() and camera values). Music + SFX: out/legend-golem/music, out/legend-golem/sfx
(see recipes engine/soundgen/recipes-golem.json); Sol's music plan project files videos/folklore-legend/golem/sol-music/answer-summary.md.

## House rules (all from the owner, do not break)
- New framing every 1-3 s (sub-shots cut on word times), always a slow push/drift, never a still frame. Faces fill >= 1/4 of
  frame width in dialogue close-ups. Characters react. Nothing floats, hands hold what they hold, no popping.
- SUBTITLES: lib/captions.mjs (align + phrases + captionSvg), y=560, Inter 900 white, key words gold (#ffc04a: GOLEM, Friday,
  twice, DOWN). Each phrase laid out WHOLE and fixed (no resize, no re-centre); each word invisible until its own start time
  (same as monkeys-paw paw.mjs captions). Word times from the final wavs. Never over faces.
- NO VOICE CUT OFF: silences inside a take may be squeezed ONLY where the take is below -42 dB for the whole cut span (measure
  the samples, do not trust Whisper word edges alone); keep >= 0.08 s before a word and >= 0.15 s after. If unsure, keep it.
- No lettering burned in except the subtitles AND the opening title (this video only).
- Music from 0.0 under the voice (~0.45 of voice level), changes at the turns, stops dead where marked.
- Hard cut at the end (render.mjs NOFADE), picture and sound end together.
- Target ~85 s (voice alone is 83.6 s; squeeze the long in-take pauses: L04 after "1600", L06 before "It opened", L07,
  L14 after "down." and after "begun,", L17 before "He reached").

## TWO VERSIONS (owner wants to compare)
Build ONE board golem.mjs with `export const TITLE = process.env.TITLE || "clay"`; render twice:
- golem-draft1-A.mp4: titleCard style "clay", teaser "…it only rests on Friday nights"
- golem-draft1-D.mp4: titleCard style "relief", teaser "Something walks in the attic."
Everything else identical. For BOTH styles keep the title's top edge >= y 640 (move D down by ~45 px from its spec so it no
longer touches the 2-row subtitle at y=560; keep D's size). Title clock: in at 0.25 s, gone by 2.6 s, while L01 plays.

## Shots (line -> picture). m = mood.
| # | line | set / mood | shots (cut on words) | sound |
|---|---|---|---|---|
| 0 | (0.0-0.3) | today / friday | OPENING WIDE (SYN.CAM.wide, push in slowly): kid already in the air jumping for the lowest rung (kidUp up 0.6->1), grandma 1.5 m behind reaching. Title appears 0.25 | music golem-a-dusk from 0.0; Sol: one low bow stroke as the title lands (the bed's start or a viol hit); shoe scrape on stone |
| 1 | L01 G "Get DOWN! Nobody goes up there." | today | stay WIDE while the title holds (until 2.6 s): on "DOWN" grandma grabs his jacket (sleeve = kidUp back) and pulls him down; he lands. Title gone -> cut to medium 2-shot on "Nobody" | grab = cloth rustle; land = step |
| 2 | L02 K "What's up there?" | today | kid close looking UP at the rungs (look up), then quick tilt UP the rungs to the small attic door (SYN.CAM.rungs) | |
| 3 | L03 G "Something made of mud... that still knows the way down." | today | grandma close (keeperClose), candle flame shrinks; on "way down" cut to the attic door from below, slow push | music thins; "way down" ends dry |
| 4 | L04 N "Prague, around 1600... nobody to protect it." | lane / lane | lane wide at night 1600, lamps, empty; on "enemies" a shutter slams + townsfolk (townswoman, baker, boy) hurry inside; on "nobody" lane empty, slow push | music golem-b-clay (lute + viol, D) |
| 5 | L05 N "So Rabbi Loew went down to the river... shaped a giant out of clay." | river / river | river wide at dawn (castle, mist); on "Rabbi Loew" rabbi medium kneeling at the bank; on "shaped" close on hands shaping (shape) + the lying clay giant appears in stages (body reveal left to right as he works) | clay squelches (golem-clay-squelch) on hand moves |
| 6 | L06 N "He wrote a holy name on a slip of paper, and put it in the giant's mouth. It opened its eyes." | river | close: rabbi holds the slip up (hold slip, abstract ink only); on "put it" he reaches to the mouth, slip goes in (golem slip 1); on "opened" EXTREME close on golem face, awake 0->1 (thumb-hole eyes open) | Sol: golem motif D-Eb-D complete exactly on "opened its eyes" |
| 7 | L07 R "Every Friday before sunset, I take the word out. On the Sabbath, even you rest." | river | the golem SITS UP / stands (pose lie sit 0.4 -> stand); rabbi medium, finger raised (finger) speaking to it; on "sunset" cut to the sun touching the river (natural clock); on "even you rest" golem close, it nods slowly | one lute dyad at the start then music clears for "even you rest" |
| 8 | L08 N "The golem guarded the streets all night. It fetched the water..." | lane / lane | golem walking the lane at night (walk cycle, lamps); on "fetched the water" it walks in carrying the WHOLE WELL ring on its shoulder (carry 1), the bucket rope dangling, the baker staring, mouth open | music golem-c-guard (84 BPM tread); heavy steps golem-step (soft, not scary) |
| 9 | L09 K "So... a bodyguard?" | today / friday | kid close, amused half smile | |
| 10 | L10 G "A very literal one." | today | grandma close, dry, one eyebrow up | music drops out under this line (dry) |
| 11 | L11 N "And every Friday, for years, the rabbi remembered." | river at sunset (river mood shifted warm) -> lane | quick montage, 3 sub-shots: sun setting + rabbi taking the slip out (golem sits, eyes close); next: same, different light; next: same again (each 1 s) | soft music |
| 12 | L12 K "So nothing happened." | today | kid close, relieved/bored | music thins to one held bow |
| 13 | L13 G "Until one Friday." | today | grandma close, very still, candle tiny; HOLD 0.5 s after the line on street tone only | music KILLED on "Until one Friday" |
| 14 | L14 N "The sun went down. The Sabbath song had already begun... and the word was still in its mouth." | lane -> synagogue / sabbath | the sun disappears behind roofs (lane, light goes); on "Sabbath song" synagogue wide, rabbi on the bimah with the book (book 1), worshippers; on "the word was still" cut to the golem in the dark lane, the slip still in its mouth, its eyes opening wider (awake, anger 0->0.5) | the psalm phrase = golem-f-psalm (solo viol, soft, inside-the-hall room), starts on "Sabbath song" |
| 15 | L15 W "Rabbi! The giant!" | synagogue | the back door bursts open (door 1), townswoman runs in pointing; worshippers turn (turn 1); rabbi looks up | door slam (door-slam); psalm cuts |
| 16 | L16 N "It tore through the streets. Doors split. Carts flew. And it grew, with every step." | lane / rampage | FAST cuts on each sentence: golem smash (smash 1) a door splits (doors 1) close on the door; cart thrown (cart rot+fly across frame, big in a LOW shot so it reads); golem walking toward camera, grow 0->1 across the line, townsfolk fleeing (run) | music golem-d-rampage (viol + frame drum); sfx golem-door-split, golem-cart-crash, golem-step heavy on each step |
| 17 | L17 N "The rabbi ran out, mid-song. He reached up into its mouth, and pulled out the word." | lane / rampage | rabbi running out (run) into the lane; golem bends down (bend 0.6->1) roaring face to face; rabbi reaches up (reach to golem.mouth); on "pulled out the word" EXTREME close: the slip comes out | KILL ALL music + ambience for 0.4 s exactly at the frame the slip clears the mouth |
| 18 | L18 N "The giant fell apart... into a pile of clay." | lane / rampage -> dust | crumble 0->1 (wide, golem falls into a pile), rabbi standing with the slip; the lane light warms back slightly | golem-crumble alone (after the 0.4 s silence) |
| 19 | L19 N "They carried the clay up to the attic. And took the stairs away." | attic / attic | attic wide, the clay pile in the light blade; on "took the stairs away" outside the synagogue (1600 light, use todaySynagogue with friday mood darker) the lowest rungs being removed is too fussy: instead show the back wall + the rungs starting high, slow tilt up | music golem-e-attic (two faint viol harmonics) |
| 20 | L20 N "In 1920, a reporter climbed up there. He found only dust." | attic / dust | hatch opens (hatch 1), reporter climbs in with lantern (reporter climb, lanternPool); on "only dust" close on the pile: just dust (clayPile dry 1) in the lantern light | only breath at "only dust" |
| 21 | L21 K "So it's just dust now." | today / friday (later, darker dusk) | kid close, relieved, looks up at the wall | score OUT |
| 22 | L22 G "Then why do they still sing that song twice? Every Friday." | today | grandma close, knowing look; on "twice" cut to the synagogue window lit warm; on "Every Friday" both hosts small in the wide, looking up at the attic door | after "Every Friday" leave a beat (0.5 s), then the SAME psalm phrase (golem-f-psalm) from the window, muffled across the lane (lowpass + short room), 1.6 s in -> ONE heavy thud overhead (golem-attic-thud), dust trickles from the attic door, kid + grandma flinch and look up -> HARD CUT 0.35 s after the thud (picture + all sound) |

Captions key words gold: DOWN, golem, GOLEM, Friday, twice, giant.
