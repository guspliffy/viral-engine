// THAT ONE FRIEND WHO NEVER HAS MONEY… AT YOUR BIRTHDAY (never has money, episode 4, 8 Nov 2026), from the clip template.
//   node storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs -> your-birthday.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/04-your-birthday-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/04-your-birthday/ there (PANELS.md here).
//
// STAGING PROOF (the director's blocking, workflow v2): cast, places, the camera per panel, the set and placeholder
// props at their real sizes. The clip writer writes the acting on top of these positions.
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper, Viking; at Viking's birthday at home, no Samurai)
//   Joke:        Viking's birthday: the Wizard hands over a huge purple present, Reaper a neat black box. All eyes on
//                Gunslinger, empty-handed. Pocket pat, the moth. He scribbles a hand-drawn "FREE HUG" coupon on his knee.
//                Viking reads it, bursts into happy tears, drops the expensive presents and bear-hugs him off the floor.
//   Wants:       Gunslinger wants to get away with no present.
//   Consequence: the cheapest gift wins; the Wizard's big present lies ignored on the rug.
//   Ending:      the wink over Viking's shoulder at the stunned Wizard, "Next year's on me!".
//   Callback:    frame 0 the Wizard proudly hands over the biggest present; the last frame he stares at it ignored.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
const END = 9.8;   // two 3-frame hit-stops (4.2, 6.1) make it 10.0 s of video

// ---------------------------------------------------------------- the living room (world metres; camera at +z)
// The back wall (the painted plate) at z -2.4; the rug in the middle. Frame 0 (panel 01): the Wizard has stepped in at
// the front left to push the big present into Viking's arms (centre right, back row); Gunslinger stands centre left in
// the back row, his face above the box; Reaper leans in from the right with the black box. By 1.0 the Wizard and Reaper
// have stepped back a little, beside the other two, so at 1.1 ("And yours?") they look across at Gunslinger with their
// faces to us. 2.8 "wait!": Gunslinger hurries forward to the crate at the front and sits to write, turned half away
// (panel 03: Viking behind him at the right). 4.1 he stands and holds the coupon up to us (04), then turns and holds it
// out to Viking, who has stepped forward to him: the camera looks past Gunslinger's shoulder at Viking, the Wizard
// behind Viking's left shoulder and Reaper behind his right (05). 6.0 the hug: Viking lifts him and swings him a
// quarter round (06-07: Viking at the left, Gunslinger at the right), then the rocking turns on another quarter until
// Viking's back is to the front-left camera and Gunslinger's face is over his shoulder (08). The presents fall at
// Viking's right; the Wizard and Reaper come round the hug to them (07) and the Wizard is in front at the left (08).
const G0 = [-0.25, -0.42], V0 = [0.52, -0.45];           // the back row
const W_IN = [-0.72, 0.28], R_IN = [1.12, 0.08];         // frame 0: stepped in to hand over the presents
const W0 = [-1.08, -0.28], R0 = [1.2, -0.2];            // a step back, beside them (0.5-1.0)
const CRATE = [-0.6, 0.86];                              // his seat at the front left (a wooden crate, 0.34 m)
const G1 = [-0.6, 0.92];                                 // standing up from the crate (4.0)
const W1 = [-0.5, -0.6], R1 = [0.85, -0.5];           // stepped in behind to watch (W 3.35, R 4.7: into Viking's place)
const V1 = [0.2, 0.2];                                   // Viking steps forward to him for the coupon (4.6): 1 m from him, clear of his hat
const HUG = [-0.38, 0.6];                                // the hug's middle
const W2 = [-1.18, 1.55], R2 = [0.62, 1.3];               // at the presents on the rug, in front of the hug (07, 08)
const yawTo = ([x0, z0], [x1, z1]) => r3((Math.atan2(x1 - x0, z1 - z0) * 180) / Math.PI);

const cast = [
  { id: "vik", character: "always-orders-potatoes/viking", at: V0, face: -45, expr: "delighted", follow: 0.3, seed: 4.1 },
  { id: "gsl", character: "never-has-money/gunslinger", at: G0, face: 10, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "wiz", character: "never-has-money/wizard", at: W_IN, face: 70, expr: "happy", follow: 0.3, seed: 2.6 },
  { id: "rea", character: "never-has-money/reaper", at: R_IN, face: -75, expr: "deadpan", follow: 0.25, seed: 3.3 },
];
// placeholder props at their real sizes
const BIG = { w: 0.46, h: 0.34 }, SMALL = { w: 0.22, h: 0.14 };
const held = ([x, z]) => [r3(x - 0.1), 0.16, r3(z + 0.42)];   // the stack at Viking's belly: his face stays clear above it
const HELD = held(V0);
const props = [
  { id: "floor", kind: "plankfloor", x: 0, z: 0.4, w: 7, d: 6 },
  { id: "rug", kind: "rug", x: -0.2, z: 0.7, w: 3.2, d: 3.0, color: "#a8473a" },
  { id: "caketable", kind: "coffeetable", x: -1.6, z: 1.55, w: 0.7, d: 0.5, h: 0.42 },
  { id: "cake", kind: "cake", x: -1.6, y: 0.42, z: 1.55, lit: 1 },
  { id: "crate", kind: "crate", x: CRATE[0], z: CRATE[1], size: 0.34 },
  { id: "giftP", kind: "bowgift", x: -0.15, y: 0.22, z: 0.25, rot: -20, w: BIG.w, h: BIG.h, color: "#7d3fb8", ribbon: "#e7b43a" },
  { id: "giftB", kind: "bowgift", x: 0.9, y: 0.5, z: 0.3, w: SMALL.w, h: SMALL.h, color: "#26232a", ribbon: "#c9ced6" },
  // the hero prop (props-birthday.js, T2): drawing on +z; ink 0..1 writes it, fold 1 = the little square from his bandana
  { id: "coupon", kind: "coupon", x: -0.15, y: 0.6, z: 0.15, rot: 0, ink: 1, fold: 0, scale: 0.001 },
  // worn (T2 bench offsets, body frame): Gunslinger's striped cone on top of his cowboy hat, Viking's small blue dotted
  // cone in his hair (on in 06-08 as the correction prompt asks), his gold rosette on the chest
  { id: "hatG", kind: "partyhat", wear: "gsl", x: 0.06, y: 1.31, z: 0, color: "#d8392b", accent: "#f2c14e", pattern: "stripes", pom: "#f2c14e" },
  { id: "hatV", kind: "partyhat", wear: "vik", x: 0.08, y: 1.2, z: 0.08, tilt: 14, color: "#3d7fd1", accent: "#f2c14e", pattern: "dots", pom: "#f2c14e" },
  { id: "ros", kind: "rosette", wear: "vik", x: -0.2, y: 0.5, z: 0.36 },
  // the bunting across the top of the room (every panel): in front of the plate, in the top fifth of P01, above every
  // head and hat (Gunslinger lifted in the hug tops out at ~1.9 m)
  { id: "bunt", kind: "bunting", x: 0, y: 2.22, z: -1.5, w: 3.6, sag: 0.24, count: 15, colors: ["#8a4fc4", "#f2c14e", "#e97a9a"], faces: true },
];

// ---------------------------------------------------------------- blocking (places and facings only)
// 0-1.5 PAY UP: the purple present into Viking's arms, the black box on top; both step back; 1.1 all eyes on Gunslinger
c.prop(0.0, "giftP", { x: HELD[0], y: HELD[1], z: HELD[2], rot: -35 }, 0.45, "out");
c.prop(0.55, "giftB", { x: HELD[0], y: r3(HELD[1] + BIG.h + 0.06), z: HELD[2], rot: -30 }, 0.3, "out");
A(0.5, "wiz", "move", { to: W0, dur: 0.45, steps: 3 });
A(0.9, "rea", "move", { to: R0, dur: 0.3, steps: 2 });
A(1.0, "wiz", "turn", { to: yawTo(W0, G0), dur: 0.2 });
A(1.1, "vik", "turn", { to: yawTo(V0, G0), dur: 0.25 });
A(1.15, "rea", "turn", { to: yawTo(R0, G0), dur: 0.25 });
// 2.8 THE DODGE: "wait!", forward to the crate, sits to write turned half away; the others turn to watch
A(2.85, "gsl", "move", { to: [CRATE[0], r3(CRATE[1] - 0.25)], dur: 0.4, steps: 3 });
A(3.25, "gsl", "sit", { seat: "crate", dur: 0.25, hands: "keep" });
A(3.3, "gsl", "turn", { to: -35, dur: 0.2 });
for (const [who, from] of [["rea", R0], ["vik", V0]]) A(3.0, who, "turn", { to: yawTo(from, CRATE), dur: 0.3 });
A(3.35, "wiz", "move", { to: W1, dur: 0.35, steps: 2 });
A(3.5, "wiz", "turn", { to: yawTo(W1, CRATE), dur: 0.25 });
c.prop(3.4, "coupon", { scale: 1, x: r3(CRATE[0] - 0.12), y: 0.55, z: r3(CRATE[1] + 0.25) }, 0.05);
// 4.0 up, the coupon held up to us (04); 4.6 he turns and holds it out to Viking, who steps forward to him (05)
A(4.0, "gsl", "stand", { dur: 0.2 });
A(4.05, "gsl", "turn", { to: 0, dur: 0.15 });
c.prop(4.1, "coupon", { x: G1[0], y: 0.55, z: r3(G1[1] + 0.42) }, 0.08);
A(4.55, "vik", "move", { to: V1, dur: 0.45, steps: 3 });
A(5.02, "vik", "turn", { to: -8, dur: 0.2 });   // he reads it facing us (Gunslinger at his front left)
A(4.6, "gsl", "turn", { to: yawTo(G1, V1), dur: 0.3 });
A(4.9, "rea", "move", { to: R1, dur: 0.35, steps: 2 });
for (const [who, from] of [["wiz", W1], ["rea", R1]]) A(4.75, who, "turn", { to: yawTo(from, V1), dur: 0.3 });
c.prop(4.55, "giftP", { x: held(V1)[0], y: 0.16, z: held(V1)[2] }, 0.45);
c.prop(4.55, "giftB", { x: held(V1)[0], y: r3(0.16 + BIG.h + 0.06), z: held(V1)[2] }, 0.45);
c.prop(4.7, "coupon", { x: r3(G1[0] + 0.05), y: 0.55, z: r3(G1[1] - 0.4) }, 0.2);
c.prop(5.2, "coupon", { x: r3(V1[0] - 0.2), y: 0.62, z: r3(V1[1] + 0.4) }, 0.2);
// 6.0 the hug: the presents drop at his right; he lifts him and swings him round
c.prop(6.0, "giftP", { x: 0.32, y: 0.0, z: 0.5, rot: 20 }, 0.3, "in");
c.prop(6.0, "giftB", { x: 0.12, y: 0.0, z: 1.05, rot: -15 }, 0.35, "in");
// keyframes of the pair: [time, Viking [x, z, yaw], Gunslinger [x, y, z, yaw], dur]. 5.95 Viking lunges at him (from
// behind his right); 6.0-6.6 he lifts him and swings him round behind himself (Viking passes behind, Gunslinger in
// front) to side by side, angled in, cheek to cheek, both faces to the front (06-07: Viking left, Gunslinger right);
// 8.0-8.7 the rocking turns them on until Viking's back is to the front-left camera and Gunslinger, lifted higher, looks
// out over his left shoulder (08)
const HUGK = [
  [5.95, [-0.15, 0.42, -50], [-0.6, 0, 0.88, 130], 0.12],
  [6.3, [-0.45, 0.28, 20], [-0.32, 0.12, 0.92, 200], 0.25],
  [6.6, [-0.7, 0.6, 45], [-0.12, 0.2, 0.62, 315], 0.3],
  [8.05, [-0.6, 0.92, 100], [-0.18, 0.26, 0.42, 300], 0.3],
  [8.4, [-0.2, 0.9, 205], [-0.78, 0.4, 0.4, 380], 0.3],
];
for (const [t, [vx, vz, vy], [gx, gy, gz, gyaw], dur] of HUGK) {
  A(t, "vik", "move", { to: [vx, vz], dur }); A(t, "vik", "turn", { to: vy, dur });
  if (gy > 0) A(t, "gsl", "fly", { to: { x: gx, y: gy, z: gz }, dur }); else A(t, "gsl", "move", { to: [gx, gz], dur });
  A(t, "gsl", "turn", { to: gyaw, dur });
}
// 6.3-7.2 the Wizard and Reaper come round the hug to their presents on the rug (07)
A(6.3, "wiz", "move", { to: [-1.25, 0.5], dur: 0.45, steps: 3 });
A(6.75, "wiz", "move", { to: W2, dur: 0.4, steps: 2 });
A(7.15, "wiz", "turn", { to: 40, dur: 0.3 });
A(6.4, "rea", "move", { to: [0.85, 0.55], dur: 0.4, steps: 3 });
A(6.8, "rea", "move", { to: R2, dur: 0.35, steps: 2 });
A(7.2, "rea", "turn", { to: -60, dur: 0.3 });

// ---------------------------------------------------------------- shots, one per panel
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
const P01 = { pos: [0.15, 1.2, 4.2], look: [0.12, 0.72, -0.2], fov: 42 };
const P02 = fw([r3(G0[0] + 0.3), 0.95, G0[1]], { w: 1.5, az: -4, el: 4, fov: 30 });
const P03 = fw([r3(CRATE[0] + 0.3), 0.8, r3(CRATE[1] - 0.45)], { w: 1.6, az: -4, el: 8, fov: 30 });
const P04 = fw([G1[0], 0.7, G1[1]], { w: 1.0, az: 4, el: 2, fov: 30 });
const P05 = fw([r3(V1[0] + 0.02), 0.85, V1[1]], { w: 1.4, az: 4, el: 10, fov: 30 });
const P06 = fw([-0.4, 0.88, 0.6], { w: 1.55, az: 0, el: 4, fov: 32 });
const P07 = { pos: [-0.25, 1.95, 5.0], look: [-0.25, 0.58, 0.75], fov: 44 };
const P08 = fw([-0.5, 1.08, 0.55], { w: 1.25, az: -4, el: 4, fov: 30 });
const beats = c.beats([
  ["P01 pay up", 0, P01, "hook"],
  ["P02 the pocket pat", 1.5, P02],
  ["P03 the coupon", 2.8, P03],
  ["P04 free hug", 4.1, P04],
  ["P05 best gift ever", 4.6, P05, "reaction"],
  ["P06 the hug", 6.0, P06, "payoff"],
  ["P07 the bill lands", 7.0, P07],
  ["P08 the wink", 8.7, P08],
], END);

write(import.meta.url, {
  id: "your-birthday",
  title: "That one friend who never has money… at your birthday",
  idea: "Never has money, episode 4: Viking's birthday; the Wizard's huge present, Reaper's neat black box; Gunslinger has nothing, the pocket pat finds a moth; he scribbles a FREE HUG coupon on his knee; Viking cries happy tears, drops the expensive presents and bear-hugs him off the floor; next year's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true, animeTiming: true,
  set: { type: "plain", color: "#d9b98a", floor: "#a86f3e", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/birthday-living-room.png", z: -2.2, center: [0, 2.45], height: 5.0, depth: false, motion: false },
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 } },
  music: { style: "warm", lowCut: 150, gain: 0.3 },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [],
  notes: "STAGING PROOF (blocking). Generated by storyboards/series/never-has-money/04-your-birthday/make-your-birthday.mjs.",
});
