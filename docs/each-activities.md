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

## 6. Phone on 1%: "what each fighter does" (living room)

`storyboards/make-phone.mjs` → `phone-01-one-percent.json`, 23.45 s (escalation clip; the longest so far, a cut to
nine fighters would bring it near 21 s). One take from the middle of the room: a couch, a wall socket with a charger
whose cable runs along the floor to the couch. Each fighter walks in scrolling, flops onto the couch, and a red "1%"
pops up over their head.

Habits (what people do at 1%): the one with a power bank, letting it die, refusing to get up for the charger,
the cable that's too short (sitting on the floor by the socket), one more selfie, power-saving mode, the tangled
cable, yanking the cable to make it reach.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | carries a power bank | out of his suit: 100% |
| Reaper | lets it die | watches it go to a grey 0%, at peace |
| Sorcerer | won't get up | the charger floats across the room to him |
| Wizard | the spell goes wrong | *a charging spell: "500%", the phone pops and smokes* |
| Dragon | the cable's too short | pulls it taut, gives up, crouches on the floor by the socket |
| Phoenix | one more selfie | selfie, selfie... it dies mid-pose |
| Gunslinger | power-saving mode | *shoots the lamp out to save battery* |
| Allfather | the god way | one lightning bolt: 100% |
| Samurai | the tangled cable | *one clean cut through the knot: now it's two cables* |
| Viking | makes it reach | *pulls until the socket comes out of the wall* |

Loop: a poof mends the wall, the Astronaut is back on the couch on 1% (frame 0).
New engine parts: `livingroom` set, `couch`, `socket` (and its hole), `charger` (its cable follows the plug end
wherever it is: stage.js links them; knot, cut, unplug), `plugend`, `powerbank` props; the phone's `burn`.
Fable's notes: the 100% came before the premise was read (applied: the 1% holds, a look at us, a bigger power bank);
the next fighter was half in frame at the edge (applied: they wait off screen and walk in); the Dragon's "too short"
didn't read (applied: the cable pulls taut first, the cable is now dark and thicker); numbers stacked over heads
(applied: shorter 1%, the Wizard's 500% longer, more smoke); the Samurai's knot was tiny and far away (applied: bigger,
next to the couch); the Viking's rip was too fast (applied: a tug first).

## 7. Gym: "how each fighter lifts" (gym)

`storyboards/make-gym.mjs` → `gym-01-lift.json`, 23.73 s (escalation clip). One take from the middle of a gym: a
lifting platform with one loaded barbell, a bench, a mirror wall, racks, a punching bag. The next fighter waits beside
the platform and watches (reacting to the big moments), then steps up.

Habits (real gym types): the one who makes it look easy, the bench hogger on the phone, the grunter, the ego lifter
who loads too much, the endless warm-up, the one who drops the weights from the top.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | makes it look easy | the loaded bar up on one hand, two easy pumps |
| Reaper | hogs the bench | sits there scrolling, never lifts a thing |
| Sorcerer | doesn't touch it | the bar floats up while he stands there |
| Wizard | the spell goes wrong | *a lightening spell: balloons carry him up, then pop* |
| Dragon | the grunter | one lift, one "RAAH!", a jet of fire at the ceiling |
| Phoenix | the ego lift | "MORE": one more plate each side, it pins him ("help") |
| Gunslinger | too heavy | *shoots the plates off, lifts the bare bar* |
| Allfather | the endless warm-up | stretches and stretches, then calls it a workout |
| Samurai | two dumbbells | *one cut splits the barbell in two* |
| Viking | drops it | *from the top: the bar goes through the floor* |

Loop: a poof mends the floor, the Astronaut holds the bar up on one hand again (frame 0).
New engine parts: `gym` set, `barbell` (plates 0–3 per end, bend, balloons, split into dumbbells), `weightbench` props.
Fable's notes: the frame-0 lift was over before the premise read (applied: longer hold, hook up to 1.4 s); the waiting
fighter was off screen so nobody reacted (applied: they wait in view and react to the Wizard's fall and the Phoenix pin);
the Dragon's grunt was small (applied: bigger fire and a "RAAH!"); the Phoenix's pin didn't read (applied: "MORE", a
plate poof, the bar at his chin, "help"); the Reaper, Sorcerer and Allfather beats ran long (applied: trimmed); the
ending had no hold (applied: a beat on the Viking before the reset). The banner above the mirror hit the captions, so
it's now a side poster.

## 8. Shopping trolley: "does each fighter put it back?" (supermarket car park)

`storyboards/make-cart.mjs` → `cart-01-put-it-back.json`, 20.15 s (escalation clip). One take from the pavement in
front of a trolley bay (blue "CARTS" sign), parked cars behind. Each fighter pushes an empty trolley in from the right.

Habits (the "shopping cart test"): puts it back properly, leaves it wherever, "close enough" by the bay, lets it roll
into a car, only returns it for the €1 coin, rides it like a kid, rams it into the row.

| Fighter | Habit | How |
|---|---|---|
| Astronaut | puts it back | nests it neatly, salutes |
| Reaper | leaves it there | in the middle of the pavement, a shrug, back to the shop |
| Sorcerer | floats it back | his trolley and the Reaper's float into the bay |
| Wizard | the spell goes wrong | *a spell to send it back: five trolleys* |
| Dragon | rides it | comes in sitting in it, fire boost, crashes into the bay |
| Phoenix | close enough | leaves it by the bay; it rolls into a parked car |
| Gunslinger | shoots it back | *three shots hop it into the bay* |
| Allfather | puts it back. Do you? | steps up to the camera and points at you: "?" |
| Samurai | gets his coin back | *one cut at the lock: "€1", the trolley stays* |
| Viking | puts it back hard | *rams it into the bay: the bay is wrecked* |

Loop: a poof mends the bay, the Astronaut is pushing his trolley in again (frame 0).
New engine parts: `cart` (ride it at [0, 0.42, 0.02]) and `corral` props (`count` nested trolleys, smash,
spec.sign moves the sign), the street set's `parking` option is reused. Getting off a seat ride now eases the sitting
pose out instead of snapping (timeline.js).
**Hook style test:** this clip shows the hook as the big boxed line ("Put the trolley back?") for 0.9 s, the first name
after it (`hookLabel: true` in `finish`). The other clips keep the small hook over the name. A candidate for an A/B
experiment rather than a series-wide change.
Fable's notes: the camera was too far, faces too small (applied: closer and lower, the action recentred); the Dragon's
and Gunslinger's trolleys hardly moved (applied: the Dragon rides in from off screen across the frame; the Gunslinger
lets go further out and each shot hops it, though the bay mouth limits the travel); the Sorcerer and the Allfather's
"Do you?" were at the frame edge (applied: centre, the "?" held 0.9 s); the hook was the smallest text (applied, see
above); the Reaper's trolley looked put back (applied: it's left in the way, nearer the camera); the Phoenix's trolley
vanished on screen (applied: it bumps the parked car and stays until the reset; a second parked car added).
