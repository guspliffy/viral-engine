# "Each fighter does it their own way": the activity storyboards

Written overnight on 2026-10-24 while new videos were paused (Jonny: improve the look first). Each activity has its
storyboard, the habits it draws on and how each fighter plays one. They passed the motion check, the layout checks
(clipping, captions) and Fable's storyboard review (review A) on draft stills. **None is rendered as a video yet**:
that waits for the new look. Signatures in *italics* are Jonny's canon (Wizard messes up, Samurai slices, Viking
destroys, Gunslinger shoots); the rest are proposals.

Build a storyboard with `node storyboards/make-<name>.mjs`; all of them use `storyboards/each-lib.mjs`.

## 1. Alarm clock: "how each fighter wakes up" (bedroom)

`storyboards/make-alarm.mjs` → `alarm-01-wake-up.json`, 19.9 s, one take from the foot of the bed.

Habits (the usual wake-up types): the morning person, the one awake before the alarm, the snoozer, five-more-minutes
under the blanket, scrolling the phone in bed, the one who wants to destroy the alarm, turning it off in your sleep,
the parent who throws the curtains open, hitting snooze too hard.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | the morning person | up at the first ring, a zero-g flip out of bed |
| Reaper | awake before it rings | lies there staring at the clock, stops it on the first tick |
| Sorcerer | snoozes forever | zaps snooze from his pillow twice, eyes shut |
| Wizard | the spell goes wrong | *his spell to stop it summons four more ringing clocks* |
| Dragon | five more minutes | under the blanket, a fire puff from under it shuts the clock up |
| Phoenix | scrolling in bed | phone in front of his face while it rings, sees the time, panics and flies off |
| Gunslinger | wants to destroy it | *shoots the clock off the nightstand* |
| Samurai | turns it off asleep | *cuts the clock in half without opening his eyes* |
| Allfather | rise and shine | turns round in bed and throws the curtains open |
| Viking | hits snooze hard | *smashes the clock, the nightstand and the bed, sleeps on in the wreck* |

Loop: a fresh bed and clock poof in, the Astronaut dives in, the alarm rings (frame 0).
New engine parts: `bedroom` set (with `flip`), `bed`, `alarm`, `nightstand`, `curtains` props, the wall `clock` now
takes a `time`, `ring` sound.
Fable's notes: tighter shot and a bigger clock (applied); the Viking stays asleep in the wreck until the reset
(applied); the Allfather's curtains were off screen (applied differently: the window is now above the bed and he
opens it from bed); the Phoenix's phone in front of his face with thumb flicks (applied); frame 0 mid-burst with a
visibly rattling clock (applied); a 6:00 wall clock and the queue beside the bed (applied; slippers and a plant not
added).

## 2. School test: "how each fighter takes a test" (classroom)

`storyboards/make-test.mjs` → `test-01-school-test.json`, 20.9 s (over 20 s, so it's flagged as an escalation clip;
the Viking is the escalation). One take from the teacher's side: the camera is the teacher, who slides a fresh test
onto the desk for each fighter.

Habits (the usual exam types): the overachiever who asks for more paper, the one done in a minute, the cheater, the
blank mind, the one who decorates their name, the multiple-choice guesser, the pencil sharpener, the clock-watcher,
the eraser who rubs a hole in the page.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | asks for more paper | fills it in in a blur, hand up, a stack of extra sheets arrives |
| Reaper | done in one stroke | one stroke, pencil down, stares at the teacher |
| Sorcerer | the cheater | a shifty look each way, the answers glow onto the page by magic |
| Wizard | the spell goes wrong | *a spell to answer it ends in an ink splat* |
| Dragon | mind goes blank | eyes up and empty, his head steams, a snort of fire burns the test to ash |
| Phoenix | signs his name | a huge pink signature with a heart, then the bell goes |
| Gunslinger | guesses everything | *shoots a hole through every answer* |
| Samurai | sharpens the pencil | *three sword cuts, holds the stub up to the lens* |
| Allfather | watches the clock | glares at the wall clock, a lightning bolt sends the hands racing to the bell |
| Viking | rubs out a mistake | *rubs so hard the paper rips and the desk snaps in two* |

Loop: a poof clears the wreck, the Astronaut sits and scribbles (frame 0).
New engine parts: `classroom` set, `desk`, `paper`, `pencil` props, `scribble` and `bell` sounds.
Fable's notes: bigger paper and a tighter shot (applied, framing adjusted so captions stay clear); the hook up longer,
the Astronaut buzzing as he writes, "done in one stroke" (applied); the Samurai holds the stub to the lens (applied);
the Dragon's steam bigger and white, a flash on the snort (applied); the next fighter queues after each payoff
(applied); the Astronaut glances at the viewer before the seam (applied).

## 3. No toilet paper: "what each fighter does" (bathroom)

`storyboards/make-toilet.mjs` → `toilet-01-no-paper.json`, 21.15 s (escalation clip). Kept clean: the joke is the
empty cardboard tube, nothing bodily. One take from the bathroom door.

Habits (what people do when the roll is empty): bring their own, accept their fate, reach for the spare without
getting up, panic, text the family for help, use whatever is in reach, shout "who used the last roll?", get angry
at the holder.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | brought his own | spins the empty tube ("?"), pulls his own roll from his suit |
| Reaper | stares into the void | finds the empty tube, a long dead stare at us |
| Sorcerer | the lazy reach | floats the spare roll down from the high shelf by magic |
| Wizard | the spell goes wrong | *a spell for one roll brings an avalanche of rolls* |
| Dragon | panics | "!", sweat, looks everywhere, snorts little fires |
| Phoenix | texts for help | texts the family; a roll flies in through the door and bonks him |
| Gunslinger | shoots it down | *shoots the spare roll off the high shelf and catches it* |
| Samurai | uses the curtain | *cuts the shower curtain into neat squares* |
| Allfather | who used the last roll?! | a dad roar that shakes the house |
| Viking | bangs the holder | *bangs the empty holder so hard the toilet cracks in two* |

Loop: a poof resets the toilet, the Astronaut sits and spins the empty tube (frame 0).
New engine parts: `bathroom` set, `toilet`, `tpholder` (standing), `troll` (a loose roll), `curtain` props;
`sweat` and `alert` head effects; the `drop` action now eases into its tuck instead of snapping.
Fable's notes: tighter shot (applied, no push-in so the loop stays seamless); the empty tube bigger and turned to
the camera, a "?" on the Astronaut (applied); the curtain brought into frame (applied); the avalanche piles in front
of the Wizard (applied); the Viking gone before the Astronaut walks in, the question up longer (applied); the spare
roll bigger with a glint before it's used (applied).

## 4. Parallel parking: "how each fighter parks" (street)

`storyboards/make-parking.mjs` → `parking-01-parallel.json`, 22.25 s (escalation clip). One take from the pavement
across the street: one gap between a blue and a green parked car, two little open-top cars taking turns (a fighter
rides in on one while the last one pulls out).

Habits (the usual parallel-parking types): the smooth one-go pro, parking by feel (bump, bump), twenty tries,
giving up and stopping in the road, the "dad reverse" with an arm over the seat, the one who needs a gap three cars
long, blocking the lane while checking themselves in the mirror, bumper-car parking.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | the pro | one smooth reverse, perfectly straight, arm up |
| Reaper | parks by feel | bumps the car behind, bumps the car in front, blinks |
| Sorcerer | doesn't bother steering | floats the car sideways into the gap |
| Wizard | the spell goes wrong | *his parking spell shrinks the car to a toy; he trundles in anyway* |
| Dragon | twenty tries | three big swings, still crooked, sweat and a fire snort |
| Phoenix | parks in the road | stops in the lane and checks his look |
| Gunslinger | makes space | *shoots the car in front so it rolls away, drives straight in* |
| Samurai | makes it fit | *one cut takes his own car's front off, then he backs in* |
| Allfather | the dad reverse | turns round, arm over the seat, in in one go, a satisfied nod |
| Viking | bumper cars | *rams the car behind and the car in front off the street* |

Loop: a poof brings both parked cars back, the Astronaut rolls up to the gap (frame 0).
New engine parts: `car` prop (split, chop, smash, bump, tiny; the wheels turn with distance), the `ride` action
(a fighter rides a prop at an offset; later rides re-aim them), the street's `parking` option (bay lines, a P sign).
Fable's notes: aim the camera at the gap (applied); make the Reaper's bumps loud, with puffs and both cars rocking
(applied); the Phoenix's "metre from the kerb" didn't read, so he now stops in the road (applied, a changed habit);
the Gunslinger aims the wrong way and the blue car vanishes in the crop (applied); the Dragon's tries read as a
jitter, now three big swings (applied); the first fighter's name from frame 0 with the hook under it, the question on
one picture at the end (applied, and the name-from-frame-0 change now applies to every activity clip).

## 5. Cooking an egg: "how each fighter cooks an egg" (kitchen, morning)

`storyboards/make-egg.mjs` → `egg-01-breakfast.json`, 21.43 s (escalation clip). One take like a cooking show:
the camera looks over a stove at the cook behind it. Each fighter walks up with a clean pan and an egg, cooks, and
takes the pan away; a row of eggs on the counter goes down by one with each turn.

Habits (the usual egg cooks): the show-off chef flip, eating straight out of the pan, the lazy shortcut, turning the
heat all the way up, photographing the food first, cracking it too hard, making breakfast for the whole family.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | the chef flip | tosses the egg, it spins and lands perfectly |
| Reaper | eats from the pan | no plate: lifts the pan and slides the egg in, deadpan |
| Sorcerer | the lazy cook | magic floats the egg over, cracks it and cooks it in green fire |
| Wizard | the spell goes wrong | *his cooking spell makes the egg enormous: a giant fried egg swamps the stove* |
| Dragon | full heat | turns it all the way up: huge flames, charcoal, smoke |
| Phoenix | photo first | photos and a selfie, and by then it's burnt |
| Gunslinger | cracks it with a shot | *tosses it up and shoots it open over the pan* |
| Allfather | cooks for everyone | egg after egg after egg, a pan full of yolks |
| Samurai | cuts it open | *tosses it and cuts the shell open in mid-air* |
| Viking | too hard | *cracks it so hard the pan flies and the stove is flattened* |

Loop: a poof restores the stove and the eggs on the counter; the Astronaut looks at us, then tosses (frame 0 is the
egg in mid-air, yolk to the camera).
New engine parts: `stove` (on, fire, smash), `pan` (fried, yolks, burn, big, flip), `egg` (crack) props; the kitchen's
`morning` option (a daytime window).
Fable's notes: frame 0 showed an empty pan, now the egg is mid-air in front of him (applied); the hook as the top line
and no title word (applied to every activity clip, see below); a stray egg next to the Phoenix (applied: the phone
comes after the egg is gone); the Gunslinger aims at the egg with a muzzle puff, and the Allfather now plays between the
two toss beats (applied); a row of eggs on the counter that goes down each turn (applied); a short hold on the
Astronaut before the toss at the loop (applied).

**Captions in every activity clip (changed 2026-10-24 night):** the hook is the top line for the first second, with
the first fighter's name under it from frame 0; after that only the fighter's name and habit. The one-word title
caption is gone (Fable: it meant nothing on screen).
