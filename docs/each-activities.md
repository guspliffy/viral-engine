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
