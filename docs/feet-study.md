# Feet study: walks, runs, stops and turns (quality plan item 10, 5 Nov 2026)

The CLAUDE.md "Movement" rule: study how real people, athletes and top animation do a move, write the beats down, then
adapt them to potato bodies. This is the study behind the planted gait (`engine/page/timeline.js`, `gaitPlan`;
storyboard `"motion": { "feet": 2 }`).

## What real feet do

**Walk** (gait biomechanics; Richard Williams' *Animator's Survival Kit* walk chapters; Ghibli walk cycles).
- Each foot stands for about 60 % of the cycle and swings for 40 %. Both feet are down for a moment twice a cycle
  (double support, about 10 % each). There is never a moment with both feet in the air.
- A standing foot does not move. The body passes over it: the foot lands ahead of the hip, is under it half way
  through the stance, and is behind it when it lifts. All the travel comes from the body moving over still feet.
- The body is lowest just after a foot lands (the "down" in the Williams cycle: the knee bends to take the weight)
  and highest as it passes over the standing foot. The hips shift sideways over the standing foot every step.
- Faster walking first makes steps longer (up to about a leg length), then makes them quicker.
- The arms swing against the legs: the right arm is forward when the left foot is.

**Run.**
- Each foot stands for only about a third of the cycle, so there is a moment with both feet in the air between steps.
- The body is lowest half way through the stance and highest in the air between steps (the opposite of a walk's bob).
- The foot lands nearer under the body than in a walk, the feet lift higher, the body leans forward with the speed.
- A walk becomes a run when it gets too fast for the leg (a Froude number of about 0.5: for a potato leg of about
  20 cm, a little over 1 m/s; our cartoon cast run from about 1.5 m/s).

**Starting.** The weight shifts first: the body moves over the foot that will stand, then the other foot lifts. The
first step is short and quick. The body tips back a touch as it sets off (it hasn't caught up with its feet).

**Stopping.** The body keeps going over the last standing foot and tips forward, the trailing foot comes up beside it
(a short last step), and the body rocks back once and settles. In Ghibli stops the settle is small and soft, never a
snap: one forward rock and back.

**Turning on the spot.** The eyes and head go first, then the body; the feet follow in small pivot steps, each one
turning the foot about 45°, the outside foot of the turn stepping first. Feet never swivel flat on the floor.

**Shuffling.** Small, quick steps that barely leave the floor; the step is only as long as the shift needs.

**Stumbling (shoved).** The body goes first and the feet scramble to catch it: quick, short catch steps, one after the
other, until a foot lands under the body; then the body rocks back and settles.

**Ghibli.** The contact pose is the key drawing: a foot that is down stays down. Small characters take quick little
steps (Totoro's chibi, Kiki's cat) and heavy ones slow, weighted ones. Walks read on twos and threes, so the contact
positions must be exact; the in-betweens can be loose.

## Adapted to potatoes

- Legs are short (hip about 20 cm up, feet 13 cm either side of the middle and 4 cm forward), so steps are short and
  quick: the cast walk at 2.2 cycles a second with a cycle of up to 44 cm, run at 3 or more with up to 80 cm, and a
  foot never lands more than 15 cm ahead of where the body will be when it lands (more reads as the splits).
- A walking step lifts the foot about 6.5 cm at a normal stride, a shuffle barely 1-2 cm, a run 8.5 cm.
- A standing foot stays exactly where it landed (0 mm). When the body only shuffles, turns or leans, a foot steps as
  soon as staying would leave it 3 cm or 20° from where it belongs. A dash faster than the rhythm lets a foot that is
  20 cm behind scramble after the body at once.
- Each step aims at where the foot will be needed half way through its next stance, read from the body's own path a
  moment ahead (the plan knows the whole storyboard), so a stop brings both feet together under the body.
- The bob, the sway over the standing foot and the arm swing follow the real steps (lowest just after each footfall
  in a walk, at mid-stance in a run), eased in from just before the first step and out after the last.
- A damped spring (about 2.4 Hz) pushed by the body's acceleration tips it forward on a stop, back on a start, with
  one small overshoot and settle.
- In the air (a hop, a fly), sitting, kneeling, riding or gliding on purpose (`steps: 0`, the Wizard dragged in the
  tent clip) the feet go with the body as before.
