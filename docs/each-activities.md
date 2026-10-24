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
