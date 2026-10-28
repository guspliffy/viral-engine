// COMPLIMENTS TO THE CHEF (Jonny's story library #09, 28 Oct 2026), built from the clip template.
// node storyboards/chef/make-compliments-to-the-chef.mjs -> storyboards/chef/compliments-to-the-chef.json
//
// THE BRIEF (story library 09, ENGINE-PROMPT.md: 10.00 s, 300 frames, seven shots, cuts after frames 14, 32 and 53)
//   Joke:        Gunslinger tastes Odin's soup and fights like a hero to keep a polite smile; it ends in one tiny puke.
//   Wants:       Gunslinger wants to spare the proud cook's feelings.
//   Consequence: his body betrays him: wet eyes, a trembling mouth, then a few drops back into his own bowl.
//   Ending:      awkward eye contact, held. Odin raises one eyebrow. No loop, no tail.
//
//   01 0.00-0.50  proud chef: Odin, ladle, soup, the loaded spoon at the left edge     (a small ceramic tick)
//   02 0.50-1.10  taste: one small sip, withdrawal starts by 1.0                         (a tiny sip)
//   03 1.10-1.80  the lie: a forced polite smile toward Odin, who beams behind           (a tense string onset)
//   04 1.80-4.20  eyes betray him: extreme close-up under the brim, one tear gathers     (the string/choir swell)
//   05 4.20-6.60  hold the smile: mouth close-up, a quiver, one swallow                  (two heartbeats under the swell)
//   06 6.60-8.20  tiny defeat: face and bowl, one brave smile, a lean, drops at 7.50     (score cuts at the first drop, "blep", a drip)
//   07 8.20-10.0  chef is watching: two-shot, the apologetic look, one white eyebrow up  (room tone)
//
// Hands (the brief): Gunslinger's own RIGHT holds the teaspoon all clip, his left rests on the table; Odin's own LEFT
// holds the ladle upright all clip, his right rests on the table. The bowl never moves.
import { clip, write, r3 } from "../lib/clip.mjs";

const c = clip(), { A, sfx } = c;
const END = 10.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const GUN = [-0.42, 0.05], ODN = [0.5, -0.02];
const TABLE_H = 0.33, TABLE_Z = 0.86, TABLE_D = 0.82;
const BOWL_S = 1.15, BOWL = [-0.24, TABLE_H, 0.6];
const SOUP_Y = 0.082 * BOWL_S;                       // props-chef.js SOUP_Y, scaled
const SPOON_S = 1.45, SPOON_TIP = [0, 0.026, 0.15]; // props-chef.js spoon: its cup's centre from the grip
const LADLE_S = 1.3, LADLE_AT = { x: 0.72, y: 0.6, z: 0.42 };    // the fist on the handle, the cup up beside his face
// the Gunslinger's mouth on the face (render --layout "mouth"), standing, and leaning over the bowl
const MOUTH = [-0.392, 0.586, 0.393], MOUTH_LEAN = [-0.36, 0.55, 0.396];
// eye targets (face look space: + right on screen, + up)
const GUN_AT_SPOON = [-0.15, -0.55], GUN_AT_ODIN = [0.75, 0.08], GUN_AHEAD = [0.1, 0.02], GUN_AT_BOWL = [0.15, -0.7];
const ODN_AT_GUN = [-0.7, -0.08];

const add = (a, b) => a.map((v, i) => r3(v + b[i]));
const sub = (a, b) => a.map((v, i) => v - b[i]);
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
// a spoon pointing along d (from the fist to its cup): the prop's rot (about y) and tip (about x) in degrees
const aim = (d) => { const [x, y, z] = norm(d); return { rot: r3((Math.atan2(x, z) * 180) / Math.PI), tip: r3((-Math.asin(y) * 180) / Math.PI) }; };
// where the fist goes so the spoon's cup lands on `tip` pointing along d
const fistFor = (tip, d) => { const n = norm(d), L = Math.hypot(...SPOON_TIP) * SPOON_S; return tip.map((v, i) => r3(v - n[i] * L)); };

// the spoon's keys: [time, cup position, direction]
const D_LOADED = [0.75, 0.05, -0.2], D_LIP = [0.62, 0.42, -0.66], D_REST = [0.95, -0.05, -0.3];
const CUP_LOADED = add(BOWL, [-0.14, 0.15, 0.04]);          // just over the bowl's left rim, loaded
const CUP_LIP = add(MOUTH, [0.03, -0.012, 0.03]);           // on the lower lip
const CUP_LOW = add(BOWL, [-0.2, 0.2, 0.08]);                // lowering, at the lower edge of shot 03
const CUP_REST = add(BOWL, [-0.23, 0.07, 0.06]);             // beside the bowl, the hand on the table

const cast = [
  { id: "gun", character: "lookdev/gunslinger-crisp", at: GUN, face: 4, expr: "cocky", follow: 0.25, seed: 2.2 },
  { id: "odn", character: "lookdev/allfather-crisp", at: ODN, face: -30, expr: "happy", follow: 0.25, seed: 3.7 },
];
const props = [
  { id: "table", kind: "coffeetable", x: 0, z: TABLE_Z, h: TABLE_H, w: 2.8, d: TABLE_D, color: "#e6c493", leg: "#c99a64" },
  { id: "bowl", kind: "soupbowl", x: BOWL[0], y: BOWL[1], z: BOWL[2], scale: BOWL_S, steam: 0.55,
    from: sub(MOUTH_LEAN, BOWL).map((v) => r3(v / BOWL_S)) },
  { id: "spoon", kind: "spoon", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, fistFor(CUP_LOADED, D_LOADED)[i]])), ...aim(D_LOADED), scale: SPOON_S },
  { id: "ladle", kind: "ladle", ...LADLE_AT, rot: -30, scale: LADLE_S },
];

// the spoon rides the right fist; its angle changes with the arm, so it stays rigid in the hand
const spoonTo = (t, cup, d, dur, ease = "inOut") => {
  c.arm(t, "gun", "R", { world: fistFor(cup, d) }, dur, ease);
  c.prop(t, "spoon", aim(d), dur, ease);
};

// ---------------------------------------------------------------- frame 0: everything already in place
A(0, "gun", "grab", { prop: "spoon", hand: "R", grip: "handle", dur: 0, pose: null });
A(0, "gun", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "gun", "arm", { side: "R", pose: { world: fistFor(CUP_LOADED, D_LOADED) }, dur: 0 });
A(0, "gun", "arm", { side: "L", pose: { world: [-0.06, TABLE_H + 0.035, 0.56] }, dur: 0 });
A(0, "gun", "grip", { side: "L", shape: "paw", dur: 0 });
A(0, "odn", "grab", { prop: "ladle", hand: "L", grip: "handle", dur: 0, pose: null });
A(0, "odn", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "odn", "arm", { side: "L", pose: { world: [LADLE_AT.x, LADLE_AT.y, LADLE_AT.z] }, dur: 0 });
A(0, "odn", "arm", { side: "R", pose: { world: [0.33, TABLE_H + 0.035, 0.55] }, dur: 0 });
A(0, "odn", "grip", { side: "R", shape: "paw", dur: 0 });
A(0, "gun", "noblink"); A(0, "odn", "noblink");

// ---------------------------------------------------------------- 01 PROUD CHEF 0.00-0.50
A(0, "odn", "look", { to: [-0.6, -0.3], dur: 0, blink: false });   // on the spoon: will he like it?
A(0.5, "odn", "look", { to: ODN_AT_GUN, dur: 0.2, blink: false });
A(0, "odn", "expr", { expr: "eager", set: { open: 0, curve: 0.9, eye: 1.0 }, dur: 0 });
A(0, "odn", "face", { brow: 0.5, lid: 0.08, dur: 0 });               // proud and expectant: brows high
A(0, "odn", "pitch", { to: -6, dur: 0.35 });                      // chest out, chin up: proud
A(0, "gun", "look", { to: GUN_AT_SPOON, dur: 0, blink: false });
spoonTo(0.02, add(CUP_LOADED, [0.03, 0.08, 0.0]), [0.7, 0.2, -0.35], 0.46, "in");
sfx(0.03, "kenney/impact-plate-light", { gain: 0.22 });           // the spoon leaves the bowl's rim

// ---------------------------------------------------------------- 02 TASTE 0.50-1.10
spoonTo(0.48, CUP_LIP, D_LIP, 0.24, "out");                        // spoon on the lip at 0.72
A(0.5, "gun", "look", { to: [0.0, -0.35], dur: 0.15, blink: false });
A(0.62, "gun", "face", { lid: 0.45, dur: 0.15 });                  // savouring
A(0.62, "gun", "expr", { set: { curve: 0.15, smirk: 0.1, open: 0.3 }, dur: 0.08 });
sfx(0.72, "ai/sip", { gain: 0.32 });
c.prop(0.74, "spoon", { fill: 0.25 }, 0.18);
A(0.82, "gun", "expr", { set: { open: 0, curve: 0.3, smirk: 0.35 }, dur: 0.1 });
spoonTo(0.9, add(CUP_LIP, [-0.03, -0.05, 0.06]), [0.68, 0.3, -0.5], 0.2);   // withdrawal begins
A(0.96, "gun", "face", { lid: 0.2, dur: 0.08 });
A(0.98, "gun", "expr", { set: { pupil: 0.72, eye: 1.08 }, dur: 0.06 });     // the flavour registers: pupils shrink
A(0.98, "gun", "still", { dur: 0.2, idle: 0.05 });

// ---------------------------------------------------------------- 03 THE LIE 1.10-1.80
spoonTo(1.1, CUP_LOW, [0.85, 0.15, -0.3], 0.6);
A(1.08, "gun", "look", { to: GUN_AT_ODIN, dur: 0.18, blink: false });
A(1.12, "gun", "expr", { expr: "kind", set: { curve: 0.85, smirk: 0.05, eye: 0.86, pupil: 0.8, tilt: 0.22 }, dur: 0.3 });
A(1.12, "gun", "face", { lid: 0.32, brow: 0.12, dur: 0.3 });
A(1.15, "gun", "turn", { to: 12, dur: 0.35 });
A(1.1, "odn", "expr", { expr: "happy", set: { open: 0, curve: 1, eye: 0.9 }, dur: 0.2 });
A(1.1, "odn", "face", { lid: 0.36, dur: 0.25 });                   // beaming, eyes still on him
sfx(1.12, "kenney/low-random", { gain: 0.08, reason: "a tense string onset under the forced smile" });

// ---------------------------------------------------------------- 04 EYES BETRAY HIM 1.80-4.20
spoonTo(1.85, CUP_REST, D_REST, 0.7);
A(1.8, "gun", "look", { to: GUN_AHEAD, dur: 0.2, blink: false });
A(1.8, "gun", "still", { dur: 2.3, idle: 0.1 });
A(1.85, "gun", "face", { tear: 0.5, lid: 0.25, brow: -0.08, tilt: 0.12, dur: 0.8 });
A(2.45, "gun", "squash", { amount: 0.04, dur: 0.3 });                // a suppressed heave: the smile buckles and recovers
A(2.45, "gun", "pitch", { to: 2, dur: 0.2 });
A(2.47, "gun", "expr", { set: { curve: 0.62, pupil: 0.66 }, dur: 0.1 });
A(2.47, "gun", "face", { lid: 0.44, dur: 0.16 });
A(2.62, "gun", "pitch", { to: 0, dur: 0.3 });
A(2.65, "gun", "expr", { set: { curve: 0.85, pupil: 0.8 }, dur: 0.2 });
A(2.65, "gun", "face", { lid: 0.25, dur: 0.2 });
A(2.8, "gun", "face", { tearR: 1, tearL: 0.62, dur: 0.75 });      // one tear gathers (his right eye, screen left)
A(3.05, "gun", "look", { to: GUN_AT_ODIN, dur: 0.18, blink: false }); // a brief, socially motivated glance at the cook
A(3.5, "gun", "look", { to: GUN_AHEAD, dur: 0.22, blink: false });
A(3.6, "gun", "face", { lid: 0.34, tilt: 0.2, dur: 0.4 });         // the strain grows

// ---------------------------------------------------------------- 05 HOLD THE SMILE 4.20-6.60
// the quiver: one corner, small and irregular, as if held down
const quiver = [[4.4, -0.35], [4.62, 0], [4.8, -0.35], [5.0, 0.02], [5.9, -0.35], [6.12, 0]];   // slow and big enough to read on a phone
for (const [t, v] of quiver) A(t, "gun", "face", { cornerR: v, dur: 0.12 });
A(4.32, "gun", "face", { press: 0.35, dur: 0.2 });
A(5.15, "gun", "face", { press: 0.9, cornerR: 0.1, dur: 0.12 });   // the swallow: lips pressed
A(5.2, "gun", "squash", { amount: 0.05, dur: 0.45 });                // cheeks and shoulders tighten
A(5.2, "gun", "pitch", { to: 1.5, dur: 0.25 });                       // the gulp dips the head
A(5.45, "gun", "pitch", { to: 0, dur: 0.3 });
A(5.2, "gun", "expr", { set: { eye: 0.75 }, dur: 0.1 });
A(5.55, "gun", "face", { press: 0.35, dur: 0.15 });
A(6.4, "gun", "face", { press: 0, dur: 0.15 });
A(5.6, "gun", "expr", { set: { curve: 0.9, eye: 0.86 }, dur: 0.15 }); // presses the smile back into place
A(4.2, "gun", "still", { dur: 2.3, idle: 0.08 });
sfx(4.55, "ai/heartbeat", { gain: 0.34, reason: "his heartbeat under the held smile (the brief's two subdued pulses)" });
sfx(5.3, "ai/heartbeat", { gain: 0.4, reason: "the second pulse, on the swallow" });

// ---------------------------------------------------------------- 06 TINY DEFEAT 6.60-8.20
A(6.6, "odn", "face", { lid: 0.12, dur: 0.2 });                      // the cook watches, proud
A(6.62, "gun", "face", { cornerR: 0.05, press: 0, dur: 0.1 });
A(6.68, "gun", "expr", { set: { curve: 1, eye: 0.9 }, dur: 0.12 });   // one last heroic smile
A(6.7, "gun", "look", { to: GUN_AT_BOWL, dur: 0.2, blink: false });
A(6.8, "gun", "pitch", { to: 4, dur: 0.4 });                          // a small lean over his own bowl
A(7.1, "gun", "squash", { amount: 0.07, dur: 0.3 });                  // the involuntary pulse
A(7.25, "gun", "pitch", { to: -3, dur: 0.15 });                      // anticipation: back, then over the bowl
A(7.12, "gun", "face", { press: 1, dur: 0.1 });
A(7.15, "gun", "expr", { set: { eye: 1.12, pupil: 0.7, curve: 0.4 }, dur: 0.1 });
A(7.4, "gun", "look", { to: [0.08, -0.15], dur: 0.06, blink: false });   // eyes up off the bowl as they squeeze shut
A(7.46, "gun", "face", { press: 0, lid: 0.96, dur: 0.05 });
A(7.46, "gun", "expr", { set: { open: 0.5, curve: -0.2, eye: 0.9 }, dur: 0.05 });
A(7.47, "gun", "pitch", { to: 6, dur: 0.12, ease: "out" });
c.prop(7.5, "bowl", { fall: 2 }, 0.8, "linear");
sfx(7.5, "ai/blep", { gain: 0.8 });
sfx(7.68, "ai/drip", { gain: 0.9, reason: "the first drops land in the soup (bowl fall)" });
sfx(7.76, "ai/drip", { gain: 0.6, reason: "the last drop lands in the soup (bowl fall)" });
A(7.76, "gun", "expr", { set: { open: 0, curve: -0.1, eye: 0.95 }, dur: 0.1 });
A(7.95, "gun", "face", { lid: 0.3, dur: 0.15 });                     // eyes stay shut until the drops are in
A(7.97, "gun", "look", { to: GUN_AT_BOWL, dur: 0.15, blink: false });
A(8.0, "gun", "pitch", { to: 2, dur: 0.2 });
A(6.6, "gun", "still", { dur: 1.6, idle: 0.12 });

// ---------------------------------------------------------------- 07 CHEF IS WATCHING 8.20-10.0
A(8.2, "gun", "look", { to: GUN_AT_ODIN, dur: 0.25, blink: false });
A(8.3, "gun", "pitch", { to: 0, dur: 0.4 });
A(8.35, "gun", "expr", { expr: "kind", set: { curve: 0.35, tilt: 0.45, eye: 0.9, pupil: 0.95 }, dur: 0.35 });
A(8.35, "gun", "face", { tear: 0.6, lid: 0.28, dur: 0.4 });
A(8.25, "odn", "still", { dur: 1.75, idle: 0.05 });
A(8.3, "odn", "face", { lid: 0, dur: 0.2 });
A(8.28, "odn", "look", { to: [-0.55, -0.45], dur: 0.15, blink: false });   // to the bowl...
A(8.75, "odn", "look", { to: ODN_AT_GUN, dur: 0.15, blink: false });       // ...and up into his eyes
A(8.8, "odn", "arm", { side: "L", pose: { world: [LADLE_AT.x, LADLE_AT.y - 0.12, LADLE_AT.z] }, dur: 0.6, ease: "inOut" });   // the ladle sinks
A(9.45, "odn", "blink", { dur: 0.3 });
A(8.32, "odn", "expr", { expr: "deadpan", set: { eye: 0.95 }, dur: 0.25 });
A(8.3, "odn", "face", { brow: 0, dur: 0.25 });
A(8.6, "odn", "face", { browR: 1.3, dur: 0.35 });                     // one white eyebrow rises (his right, screen left)
A(8.6, "odn", "pitch", { to: 0, dur: 0.4 });
A(8.9, "gun", "still", { dur: 1.1, idle: 0.08 });
A(8.9, "odn", "face", { lid: 0.32, dur: 0.3 });                      // the proud look narrows: he saw that
A(9.2, "gun", "face", { lid: 0.4, dur: 0.12 });
A(9.34, "gun", "face", { lid: 0.28, dur: 0.15 });

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
// a camera on `target` from azimuth az (degrees round y, 0 = straight from the front, - = from the left) and
// elevation el, far enough that the frame is h metres tall at the target with lens fov
const frame = (target, { az = 0, el = 0, h = 1, fov = 20, push = 0, dur = 0 } = {}) => {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((fov * Math.PI) / 360);
  const dir = [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  const pos = target.map((v, i) => r3(v + dir[i] * d));
  return { pos, look: target.map(r3), fov, ...(push && { to: { pos: target.map((v, i) => r3(v + dir[i] * d * (1 - push))) }, dur }) };
};
const S1 = frame([0.1, 0.8, 0.42], { az: -30, el: 4, h: 1.75, fov: 24 });
const S2 = frame([-0.33, 0.92, 0.42], { az: -10, el: 6, h: 1.7, fov: 20 });
const S3 = frame([-0.06, 0.9, 0.34], { az: -10, el: 4, h: 1.75, fov: 22 });
const S4 = frame([-0.37, 0.8, 0.36], { az: -5, el: -16, h: 0.5, fov: 12, push: 0.05, dur: 2.4 });
S4.to.look = [-0.355, 0.795, 0.36];   // the creep stays centred on both eyes
const S5 = frame([-0.38, 0.63, 0.37], { az: 35, el: -3, h: 0.45, fov: 14 });   // from the cook's side: a new angle on the mouth
const S6 = frame([-0.27, 0.58, 0.44], { az: -10, el: 7, h: 0.95, fov: 20 });
const S7 = frame([-0.03, 0.72, 0.32], { az: -10, el: 2, h: 1.85, fov: 22 });
const beats = c.beats([
  ["01 proud chef", 0, S1, "hook"],
  ["02 taste", 0.5, S2],
  ["03 the lie", 1.1, S3],
  ["04 eyes betray him", 1.8, S4],
  ["05 hold the smile", 4.2, S5, "escalation"],
  ["06 tiny defeat", 6.6, S6, "payoff"],
  ["07 chef is watching", 8.2, S7, "reaction"],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "compliments-to-the-chef" : `compliments-to-the-chef-${variant.toLowerCase()}`,
  title: "Compliments to the Chef",
  idea: "Story library 09: Gunslinger tastes Odin's soup, heroically keeps a polite smile, and loses to one tiny puke",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  creative: { length: [8, 12], loop: false },
  set: { type: "plain", color: "#efe2c8", floor: "#c9a27a", light: "golden", aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/kitchen-golden.png", z: -2.3, center: [0, 1.2], height: 3.9 } },
  music: { file: "ai/drama-swell/drama-swell-01.ogg", from: 1.1, until: 7.5, gain: 0.5 },
  sound: { sfx: 0.7, ambience: 0.3, speech: false },
  experiment: { id: "hook-2026-11", episode: "compliments-to-the-chef", variant },
  cast, props, captions, beats,
  allowClip: [
    { who: "gun", with: "table", from: 0, to: END, reason: "his left paw rests on the tabletop" },
    { who: "odn", with: "table", from: 0, to: END, reason: "his right paw rests on the tabletop" },
  ],
  notes: "Generated by storyboards/chef/make-compliments-to-the-chef.mjs (Jonny's story library 09).",
});
// A: the brief as written (no on-screen text). B: A plus the brief's publication line as a caption over the three
// opening cuts (the hook lab's alien makeup result: on mute, a caption carried the setup). Pick with qa/hook.mjs.
write(import.meta.url, sb("A", c.captions));
write(import.meta.url, sb("B", [...c.captions, { from: 0, to: 1.8, text: "When the chef is watching", pos: 230, pop: false }]));
