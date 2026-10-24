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
