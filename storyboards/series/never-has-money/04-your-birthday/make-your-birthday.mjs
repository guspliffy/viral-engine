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
// Review A (8 Nov) re-stage: the hug happens right of the crate (it stood on it), the presents land in front of the
// Wizard and Reaper so they face us looking down at them (07), both stay in 01's frame for "And yours?", Viking stands
// clear of Gunslinger's brim in 02, the coupon passes over Gunslinger's shoulder at the left edge of 05, the wink rises
// above the Wizard's brim in 08. Every place below is clear of the others (bodies ~0.75 m wide) when it is used.
const G0 = [-0.25, -0.42], V0 = [0.52, -0.45];           // the back row
const V0b = [0.68, -0.5];                                // 1.1 Viking eases right as he turns to look (clear of the brim in 02)
const W_IN = [-0.62, 0.2], R_IN = [1.1, 0.05];           // frame 0: stepped in to hand over the presents
const W0 = [-1.08, -0.2], R0 = [1.36, 0.0];              // a step back to the sides (0.5-1.0), faces still in 01
const CRATE = [-1.05, 0.6];                               // his seat at the front left (a wooden crate, 0.34 m)
const G1 = [-0.35, 1.1];                                 // 3.95 he hops up off the crate toward Viking (04, then 05)
const V1 = [0.55, 0.6];                                  // 4.55 Viking steps to him for the coupon (0.9 right, 0.5 behind him)
const V3 = [-0.1, -0.05], W3 = [0.0, -0.85];             // 3.05 Viking steps closer to peek (03, behind him at the right); the Wizard
                                                         // moves round behind Viking to see (out of 03, so nothing pokes from his hat)
const W1 = [-0.35, -0.35], R1 = [1.15, -0.2];            // 4.3/4.9 they step in behind Viking's left and right shoulders (05)
const W2 = [-0.35, 1.8], R2 = [1.3, 2.0];               // at their presents on the rug, in front of the hug (07)
const GIFT_P = [0.25, 2.3], GIFT_B = [0.85, 2.4];        // where the presents land (6.0-6.4): in front of them
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
  { id: "rug", kind: "rug", x: 0.15, z: 0.9, w: 3.6, d: 3.4, color: "#a8473a" },
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
// the stack: in Viking's arms at his belly (01-04), then in his right arm (05: his left mitten takes the coupon)
const ARMS = ([x, z]) => [r3(x - 0.1), 0.16, r3(z + 0.42)], RIGHT_ARM = ([x, z]) => [r3(x + 0.3), 0.16, r3(z + 0.35)];
const stack = (t, at, dur, ease = "inOut") => {
  c.prop(t, "giftP", { x: at[0], y: at[1], z: at[2] }, dur, ease);
  c.prop(t, "giftB", { x: at[0], y: r3(at[1] + BIG.h + 0.06), z: at[2] }, dur, ease);
};
// 0-1.5 PAY UP: the purple present into Viking's arms, the black box on top; both step back; 1.1 all eyes on Gunslinger
c.prop(0.0, "giftP", { x: HELD[0], y: HELD[1], z: HELD[2], rot: -35 }, 0.45, "out");
c.prop(0.55, "giftB", { x: HELD[0], y: r3(HELD[1] + BIG.h + 0.06), z: HELD[2], rot: -30 }, 0.3, "out");
A(0.5, "wiz", "move", { to: W0, dur: 0.45, steps: 3 });
A(0.9, "rea", "move", { to: R0, dur: 0.3, steps: 2 });
A(1.0, "wiz", "turn", { to: 80, dur: 0.2 });                        // three-quarter to us, eyes on Gunslinger
A(1.1, "vik", "move", { to: V0b, dur: 0.25 }); A(1.1, "vik", "turn", { to: -55, dur: 0.25 });
stack(1.1, ARMS(V0b), 0.25);
A(1.15, "rea", "turn", { to: -95, dur: 0.25 });
// 2.8 THE DODGE: "wait!", he hurries forward and left to the crate, sits and writes turned half away; they turn to watch
A(2.85, "gsl", "move", { to: [-0.4, 0.2], dur: 0.22, steps: 2 });
A(3.07, "gsl", "move", { to: [-0.75, 0.6], dur: 0.2, steps: 2 });
A(3.3, "gsl", "sit", { seat: "crate", dur: 0.25, hands: "keep" });
A(3.4, "gsl", "turn", { to: -35, dur: 0.2 });
A(3.0, "rea", "turn", { to: yawTo(R0, CRATE), dur: 0.3 });
A(3.05, "vik", "move", { to: V3, dur: 0.35, steps: 2 }); A(3.05, "vik", "turn", { to: yawTo(V3, CRATE), dur: 0.3 });
stack(3.05, ARMS(V3), 0.35);
A(3.3, "wiz", "move", { to: [-0.6, -0.9], dur: 0.25, steps: 2 }); A(3.55, "wiz", "move", { to: W3, dur: 0.25, steps: 2 });   // behind Viking
A(3.8, "wiz", "turn", { to: yawTo(W3, CRATE), dur: 0.3 });
c.prop(3.4, "coupon", { scale: 1, x: r3(CRATE[0] - 0.12), y: 0.55, z: r3(CRATE[1] + 0.25) }, 0.05);
// 3.95 he hops up off the crate toward Viking and holds the coupon up to us (04); 4.3-4.9 the others step in behind
// Viking; 4.55 Viking steps to him; 4.6 he turns and holds it out (05, over his shoulder at the left edge)
A(3.95, "gsl", "stand", { dur: 0.15 });
A(3.97, "gsl", "move", { to: G1, dur: 0.15 }); A(3.97, "gsl", "turn", { to: 0, dur: 0.15 });
c.prop(4.1, "coupon", { x: G1[0], y: 0.4, z: r3(G1[1] + 0.42) }, 0.08);   // at his chest, clear of his face
A(4.62, "wiz", "move", { to: W1, dur: 0.3, steps: 2 });   // once Viking has left his place
A(4.55, "vik", "move", { to: V1, dur: 0.45, steps: 3 });
stack(4.55, RIGHT_ARM(V1), 0.45);
A(4.6, "gsl", "turn", { to: yawTo(G1, V1), dur: 0.3 });
A(4.9, "rea", "move", { to: R1, dur: 0.3, steps: 2 });
A(5.02, "vik", "turn", { to: -8, dur: 0.2 });   // he reads it facing us (Gunslinger at his front left)
for (const [who, from] of [["wiz", W1], ["rea", R1]]) A(4.75, who, "turn", { to: yawTo(from, V1), dur: 0.3 });
c.prop(4.7, "coupon", { x: r3((G1[0] + V1[0]) / 2), y: 0.62, z: r3((G1[1] + V1[1]) / 2 + 0.25) }, 0.2);
c.prop(5.2, "coupon", { x: r3(V1[0] - 0.3), y: 0.8, z: r3(V1[1] + 0.3) }, 0.2);
// 6.0 the hug: the presents fall forward off his arm (in front of the Wizard and Reaper); he lunges, lifts him and
// swings him round his front to his right
c.prop(6.0, "giftP", { x: GIFT_P[0], y: 0.0, z: GIFT_P[1], rot: 20 }, 0.35, "in");
c.prop(6.0, "giftB", { x: GIFT_B[0], y: 0.0, z: GIFT_B[1], rot: -15 }, 0.4, "in");
// keyframes of the pair: [time, Viking [x, z, yaw], Gunslinger [x, y, z, yaw], dur]. 5.95 Viking lunges at him;
// 6.12 he lifts him and swings him round his front; 6.32-6.57 side by side, angled in, cheek to cheek, both faces to the
// front (06-07: Viking left, Gunslinger right); 8.05-8.7 the rocking turns them on until Viking's back is to the
// front-left camera and Gunslinger, lifted higher, looks out over his left shoulder at the Wizard (08)
const HUGK = [
  [5.95, [0.25, 0.8, -60], [G1[0], 0, G1[1], 119], 0.12],
  [6.12, [0.45, 0.7, 20], [0.75, 0.12, 1.2, 200], 0.2],
  [6.32, [0.4, 0.95, 45], [0.97, 0.2, 0.92, 315], 0.25],
  [8.05, [0.5, 1.27, 100], [0.92, 0.26, 0.77, 300], 0.3],
  [8.4, [0.9, 1.25, 205], [0.32, 0.7, 0.75, 321], 0.3],   // he looks down-left at the Wizard
];
for (const [t, [vx, vz, vy], [gx, gy, gz, gyaw], dur] of HUGK) {
  A(t, "vik", "move", { to: [vx, vz], dur }); A(t, "vik", "turn", { to: vy, dur });
  if (gy > 0) A(t, "gsl", "fly", { to: { x: gx, y: gy, z: gz }, dur }); else A(t, "gsl", "move", { to: [gx, gz], dur });
  A(t, "gsl", "turn", { to: gyaw, dur });
}
// 6.25-7.2 the Wizard and Reaper come round the hug to their presents on the rug (07): the Wizard down the left
// (between the crate and the hug), Reaper round the right
A(6.25, "wiz", "move", { to: [-0.45, 0.6], dur: 0.35, steps: 3 });
A(6.6, "wiz", "move", { to: W2, dur: 0.45, steps: 3 });
A(7.05, "wiz", "turn", { to: yawTo(W2, GIFT_P), dur: 0.3 });
A(6.2, "rea", "move", { to: [1.8, 0.9], dur: 0.5, steps: 3 });
A(6.7, "rea", "move", { to: R2, dur: 0.45, steps: 3 });
A(7.2, "rea", "turn", { to: yawTo(R2, GIFT_B), dur: 0.3 });
// 8.3 the Wizard steps closer, under Gunslinger's eyes, staring ahead stunned (08: his face in the bottom-left foreground)
A(8.3, "wiz", "move", { to: [-0.3, 1.75], dur: 0.2 });
A(8.3, "wiz", "turn", { to: 25, dur: 0.3 });

// ---------------------------------------------------------------- shots, one per panel
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
const P01 = { pos: [0.15, 1.2, 4.8], look: [0.12, 0.72, -0.2], fov: 44 };   // the four across, the Wizard and Reaper cut by the edges
const P02 = fw([r3(G0[0] + 0.3), 0.95, G0[1]], { w: 1.5, az: -4, el: 4, fov: 30 });
const P03 = fw([-0.75, 0.75, 0.3], { w: 1.7, az: 15, el: 8, fov: 30 });           // from his left: Viking behind him at the right
const P04 = fw([G1[0], 0.7, G1[1]], { w: 0.85, az: 4, el: 2, fov: 30 });
const P05 = fw([r3(V1[0] + 0.02), 0.85, V1[1]], { w: 1.4, az: 4, el: 12, fov: 30 });
const P06a = fw([-0.05, 0.88, 0.95], { w: 1.7, az: 0, el: 4, fov: 32 }), P06b = fw([0.68, 0.95, 0.93], { w: 1.7, az: 0, el: 4, fov: 32 });
const P06 = { ...P06a, to: { pos: P06b.pos, look: P06b.look }, dur: 0.6 };      // follows the swing
const P07 = { pos: [0.37, 2.35, 5.6], look: [0.37, 0.55, 1.2], fov: 48 };
const P08 = fw([0.2, 1.35, 0.75], { w: 1.25, az: -4, el: 4, fov: 30 });
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
