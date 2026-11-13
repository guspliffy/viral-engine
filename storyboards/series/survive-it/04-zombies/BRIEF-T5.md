TASK T5 (v2): the outbreak in the street: a car crashed into a lamp post, people running, a zombie grabbing a man
WHY: v2 opens with the outbreak itself (Jonny 12 Nov 2026: "show the outbreak scenario aswell so it gets more
  realistic"): seen from the fifth-floor window, the viewer must read in one second that something terrible has
  started down in the street: a crash, people fleeing, the first zombie catching someone. Seen small, from above.
DESIGN: BRIEF-COMMON.md (read first, same folder), panel 02 of panels-sheet-v2.png (same folder; look at it) and its
  text in /mnt/project-files/video-scripts/2026-11-08-survive-it/11-zombie-apocalypse-V2-IMAGE-PROMPT.txt.
RULES: CLAUDE.md "Rules that apply to every task". No blood, no gore: the grab is a hand on a shoulder, a struggle.
READ: `engine/page/props-zstreet.js` lines 1-140 (the street set this goes into: its header, the car builder, the
  zhorde zombies: reuse their look; import from it if the helpers are exported, else copy what you need),
  `storyboards/lookdev/make-zstreet-bench.mjs` (bench pattern).
OWN: `engine/page/props-zoutbreak.js` (a stub exists and is ALREADY registered in props3d.js: replace its body, keep
  the three export names), `storyboards/lookdev/make-zoutbreak-bench.mjs` + its json. Touch nothing else.
CONTRACT (it stands on the zstreet floor; world metres; the camera is ~15 m above, so read shapes and motion, not detail):
  zcrash   a parked-car-sized saloon (like the zstreet cars, `paint` "#9aa3a8") that has hit a street lamp post at
    its front-left corner: a crumpled bonnet, the lamp post bent over it, a cracked windscreen, the driver door open.
    Origin the car's floor centre, its nose toward -z at rot 0. State `hazard` 0..1 (the orange indicators blink at
    2 Hz from t), `steam` 0..1 (a soft grey-white wisp from the bonnet, drawn cards, deterministic drift from t).
  zcivil   `n` (9) ordinary people fleeing: golden potatoes (#d9a85a, the cast's colour) about 0.95 m tall in plain
    everyday clothes (coats, a hoodie, a skirt; varied muted colours), each running along its own straight path in
    a box `box` [8, 14] (x, z) around the origin, mostly toward -z, deterministic from `seed`. State `run` 0..1: how far
    along its path each one is (the director tweens it linearly); the body bobs and the legs/arms swing in a run
    cycle driven by t while run is moving (a simple cycle is fine: they are seen small). `scatter` 0..1 spreads them.
  zgrab    the first bite, as a pair: one zombie (zhorde look) gripping a fleeing man (a zcivil person) by the shoulder
    from behind; the man pulls away, arms flung forward. State `grab` 0..1: 0 = the zombie a step behind with arms
    out, 1 = its hands on his shoulders and both bent toward the ground (no blood, no mouth on him). `fall` 0..1:
    the man down on his knees. Origin between them.
Bench: one camera from 15 m up looking down (like the balcony) and one from street level for each kind. Max 8 stills.
REPORT: the header text, the bench sheet path, anything in the contract you could not do.
