// FIGHT, FLIGHT OR FREEZE 02: "BEAR IN THE CAMP" (Jonny 12 Nov 2026), from the clip template and the pilot's generator.
//   node storyboards/series/fight-flight-freeze/02-bear-camp/make-bear-camp.mjs -> fff-02-bear-camp.json
//   --blocking: the new kinds (bear, props-bearcamp.js) as library stand-ins, for the staging proof
// Target: Jonny's 12-panel sheet panels-sheet.png (panels/01..12.png), built AS DRAWN (Jonny 16:43 "the scene is good"),
// and CHAIN.md (v3 + his notes). PANELS.md: the staging, the story chain and every departure. NOTES.md: build state.
//
// THE BRIEF
//   Story:   three friends camp in the wild; a 400 kg black bear walks into the camp in a dry thunderstorm. Chip plays
//            dead, so the bear drags him out in his sleeping bag ("Freeze lasted ten seconds."); Wedge runs, so the bear
//            drops the bag and chases him up a pine, and black bears climb ("Flight lasted thirty seconds. Black bears
//            climb."); Spud stands his ground on the cooler with a burning branch and a pot, roaring: the bear charges,
//            stops a metre away, bites the pot and runs. Nobody hits the bear (Jonny 16:42: "i dont want anyone to fight
//            a blackbear"). Sunrise: Spud alone. "You can't beat a black bear. But you can scare it." "Would you survive
//            against a black bear?"
//   Opener:  B, cold open: 0-1.5 s the bear on its hind legs over the tent, claws ripping the cloth (panel 01), then the
//            story from the start.
//   Rules:   realistic sounds only (Jonny 12 Nov: no blings, magic, squeaks, whooshes); captions in the upper third;
//            dramatic recorded orchestra from 0.0; the bear looks REAL; serious, no jokes.
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { bearMouth } from "../../../../engine/page/props-bear.js";
import { PHONE_EDGE } from "../../../../engine/page/timeline.js";

const BLOCKING = process.argv.includes("--blocking");
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 470 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;

const c = clip({ faces: FACES, lines: LINES }), { A, see, prop, cap } = c;
// T3's recorded sounds (assets/sfx/ai/<id>): left out of a --blocking build until they are in the library + whitelist
const NEW_SFX = ["thunder", "bear-roar", "bear-growl", "bear-huff", "bear-charge", "canvas-rip", "glass-smash", "metal-tear", "car-alarm", "grass-fire", "branch-snap", "pot-bang", "pot-bite", "bag-drag"].map((s) => `ai/${s}`);
const WL = JSON.parse(fs.readFileSync(new URL("../../../../assets/sfx/whitelist.json", import.meta.url)));
const listed = (id) => JSON.stringify(WL).includes(`"${id}"`);
const sfx = (t, id, o) => (NEW_SFX.includes(id) && (BLOCKING || !listed(id)) ? null : c.sfx(t, id, o));
const rad = (d) => (d * Math.PI) / 180;
const fr = (t) => Math.floor((Math.round(t * 30) / 30) * 1000) / 1000;   // a cut time on the 1/30 grid

// ---------------------------------------------------------------- the places: two painted envs, cameras look down -z
// camp = the storm pine clearing at night (lightning in the painting), its "-up" copy for the shot up the pine (sky
// drawn taller); dawn = the lake at sunrise (panel 12). The camp is staged so every shot looks down -z: the tent's door
// faces the forest (-z), the car is parked beyond it, the pine is back left, the campfire and cooler are on our side.
const ENVS = { camp: "storm-pine-clearing", dawn: "lake-sunset" };
const PITCH = Object.fromEntries(Object.entries(ENVS).map(([k, n]) => [k, JSON.parse(fs.readFileSync(new URL(`../../../../assets/environments/${n}/env.json`, import.meta.url))).eye.pitch]));
const shot = (env, pos, { pan = 0, tilt = 0, fov = 44 } = {}) => {
  const yaw = rad(pan), pit = rad(-PITCH[env] + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const aimAt = (pos, look, fov = 44) => ({ pos, look, fov });

// ---------------------------------------------------------------- the narrator (voice "narrator" = voice 1, deep storyteller)
// [line, spoken seconds]: guesses until out/speech/*.json gives the real lengths (NOTES.md)
const NG = 4.0;
const N = {
  camping: ["You're camping in the wild.", 1.79], bear: ["A bear is in your camp.", 1.83],
  fight: ["Fight.", 0.6], flight: ["Flight.", 0.65], freeze: ["Or freeze.", 0.85],   // three lines (one line read them 4.8 s slow)
  one: ["Only one of them survives.", 1.87], freezeOut: ["Freeze lasted ten seconds.", 2.07], flightOut: ["Flight lasted thirty seconds.", 3.39],
  climb: ["Black bears climb.", 1.85], beat: ["You can't beat a black bear.", 2.11], scare: ["But you can scare it.", 1.28],
  survive: ["Would you survive against a black bear?", 2.11],
};
const CAP_Y = 400;   // upper third (Jonny 12 Nov): under the app's top bar, over every head
const nar = (t, key, { until = null, pos = CAP_Y } = {}) => {
  const [line, len] = N[key];
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false, gain: NG });
  cap(t, until ?? r3(t + len + 0.35), line, pos);
  return r3(t + len);
};

// ---------------------------------------------------------------- the clock (story seconds; cuts on the frame grid)
const T = {
  hook: 0, phone: fr(1.5), car: fr(3.6), faces: fr(5.5), door: fr(10.1), drag: fr(12.1), run: fr(14.6), tree: fr(16.3),
  stand: fr(21.9), charge: fr(24.0), bite: fr(25.4), flee: fr(27.0), dawn: fr(29.9), end: 36.4,
};
const END = T.end;
const PLACES = [[0, "camp"], [T.dawn, "dawn"]];

// ---------------------------------------------------------------- the camp (metres; x right, z toward the lens)
const TENT = [0, 0], TENT_S = 1.35;   // scaled 1.35 (3.5 x 3.0, peak 1.96): at 1.0 the fly went through their heads (Jonny, draft 1)            // domecamp, door to -z (rot 180), 2.6 w x 2.2 d, peak 1.45
const CAR = [0.3, -5.6];        // facing the tent (+z), its driver door (+x) toward our right
const LANTERN = [0.9, -1.95];   // on the grass beside the door, outside
const PINE = [-2.4, -2.8];      // the pine Wedge climbs (its climb side +z, toward us)
const FIRE = [-1.15, 2.1];      // the campfire on our side of the tent
const COOLER = [-0.15, 2.35];   // Spud stands on it in 09-11 (its lid at y 0.48)
// inside the tent: three side by side facing +z (the back wall, toward us), the door behind them
const SPUD_IN = [-0.82, 0.55], CHIP_IN = [0, 0.7], WEDGE_IN = [0.84, 0.55];
const PARK = { spud: [40, 40], chip: [43, 40], wedge: [46, 40] };
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD_IN, face: 8, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP_IN, face: 0, expr: "shocked", follow: 0.3, seed: 2.1 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE_IN, face: -8, expr: "shocked", follow: 0.3, seed: 3.7 },
];
const place = (t, who, at, yaw, y = 0) => {
  const u = Math.max(0, r3(t - 0.02));
  A(u, who, "move", { to: at, y, dur: 0.01, steps: 0, ease: "linear" });
  if (yaw != null) A(u, who, "turn", { to: yaw, dur: 0.01 });
  A(u, who, "show");
};
const park = (t, who) => { const u = Math.max(0, r3(t - 0.02)); A(u, who, "hide"); A(u, who, "move", { to: PARK[who], y: 0, dur: 0.01, steps: 0, ease: "linear" }); };
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });

// ---------------------------------------------------------------- props
const NEW = ["bear", "domecamp", "campcar", "cardoor", "cooler", "cookpot", "burnbranch", "gaslantern", "grassfire", "clawmarks", "climbpine"];
const STAND_IN = {
  bear: (p) => ({ ...p, kind: "sabretooth", scale: 1.05, tail: 0 }),
  domecamp: (p) => ({ ...p, kind: "camptent", scale: 1.85 }),
  campcar: (p) => ({ ...p, kind: "citycar", color: "#8d9297" }),
  cooler: (p) => ({ ...p, kind: "cardbox", closed: true, w: 0.72, d: 0.46, h: 0.48 }),
  climbpine: (p) => ({ ...p, kind: "pinetrunk", h: 11, r: 0.36, crown: 0.5 }),
};
const props = [];
const P = (spec) => {
  if (BLOCKING && NEW.includes(spec.kind)) { if (!STAND_IN[spec.kind]) return spec; spec = STAND_IN[spec.kind](spec); }
  props.push(spec); return spec;
};
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.3, ease = "inOut") => { if (has(id)) prop(t, id, set, dur, ease); };

P({ id: "tent", kind: "domecamp", x: TENT[0], z: TENT[1], rot: 0, scale: TENT_S, open: 1, rip: 0, push: 0, cut: 0, flutter: 0.4 });   // 01 only: turned to us (the cold open is a flash-forward); rot 180 from 02
P({ id: "car", kind: "campcar", x: CAR[0], z: CAR[1], rot: 0, smash: 0, door: 0, torn: 0, lights: 0, flash: 0 });
P({ id: "door", kind: "cardoor", x: 40, z: 40, rot: 0 });   // parked off set until the bear tears it off
P({ id: "lantern", kind: "gaslantern", x: LANTERN[0], z: LANTERN[1], lit: 1, tip: 0 });
P({ id: "grass", kind: "grassfire", x: 1.6, z: -2.4, w: 2.6, d: 0.9, seed: 4, fire: 0, spread: 0 });
P({ id: "grass2", kind: "grassfire", x: -0.6, z: 1.0, w: 3.2, d: 0.8, seed: 9, fire: 0, spread: 0 });   // it reaches our side by 07
P({ id: "pine", kind: "climbpine", x: PINE[0], z: PINE[1], rot: 180, sway: 0, shake: 0, snap: 0 });   // rot 180: its branch stubs away from the climb side
P({ id: "fire", kind: "campfire", x: FIRE[0], z: FIRE[1], lit: 1 });
P({ id: "cooler", kind: "cooler", x: 58, z: 40, rot: 0 });   // cut cheat: kept out of the tent shots, in from 07
P({ id: "bag", kind: "sleepbag", x: 50, z: 40, rot: 0, color: "#3c4a7a", cover: 0, recline: 18 });   // 04: Chip sits in it
P({ id: "lbag", kind: "lyingbag", x: 50, z: 46, rot: 0, color: "#3c4a7a", cover: 0, drag: 0 });   // 05-07: Chip lies zipped in it (T4)
P({ id: "phone", kind: "phone", style: "iphone", x: 52, y: 0.5, z: 40, screen: { src: "storyboards/series/fight-flight-freeze/02-bear-camp/art/no-service.png", cols: 1, rows: 1 }, feed: 0 });
// the branch and the pot wait beside Spud's park spot: he takes them off screen (06-08) with the grip library's holds
// (the burnbranch header: grips.mug; the cookpot header: grips.phone, the fist on the handle). Draft 1 grabbed them
// bare at a fixed spot and his hand hung open under the branch (Jonny's circle)
const POT = P({ id: "pot", kind: "cookpot", dent: 0, ...grips.placeFor("cookpot", [39.76, 0.36, 40.3], 0) });
const BRANCH = P({ id: "branch", kind: "burnbranch", fire: 0, ...grips.placeFor("burnbranch", [40.24, 0.36, 40.3], 0) });
P({ id: "bolt", kind: "skybolt", x: -6, y: 0, z: -40, h: 60, seed: 5, glow: 0 });
P({ id: "bear", kind: "bear", x: 0, z: -2.2, rot: 0, scale: 1.05 });   // posed per shot below; 1.05 = 2.54 m reared (BEAR-DESIGN.md)
// panel 12, at the lake: the torn bag at the forest edge, the clawed pine on the right
P({ id: "bag12", kind: "lyingbag", x: 40, z: 44, color: "#3c4a7a", cover: 0, drag: 0 });   // empty, flat on the grass
P({ id: "pine12", kind: "climbpine", x: 40, z: 46 });
P({ id: "claws", kind: "clawmarks", x: 40, z: 46, r: 0.36 });

// the bear's pose for a shot: one instant set two hundredths before the cut, then the beat's tweens
const BEAR0 = { gait: 0, bound: 0, rear: 0, swipe: 0, climb: 0, climbStep: 0, jaw: 0, snarl: 0, brow: 0, squint: 0, headY: 0, headP: 0, ears: 0, breath: 0.5 };
const bear = (t, set, dur = 0.01, ease = "linear") => pr(t, "bear", set, dur, ease);
const bearAt = (t, x, z, rot, pose = {}) => bear(Math.max(0, r3(t - 0.02)), { ...BEAR0, x, z, rot, ...pose });
const lightning = (t, { bolt = true, x = -6, seed = 5 } = {}) => {
  if (bolt) { pr(t - 0.02, "bolt", { x, seed }, 0.01, "linear"); pr(t, "bolt", { glow: 1 }, 0.03, "linear"); pr(t + 0.12, "bolt", { glow: 0 }, 0.18, "in"); }
  c.at(t, { fx: "flash", peak: 0.35, dur: 0.3, color: "#dfe8ff" });   // as doomscroll 01
  sfx(r3(t + 0.35), "ai/thunder", { gain: 0.8, reason: "the thunder after the flash" });
};

// ================================================================ 01 COLD OPEN 0-1.5: the bear over the tent, claws in the cloth
// panel 01: lightning, the bear on its hind legs right behind the tent, both fore paws raking down through the front
// of the fly; the three in the torn opening scream at us. (Story-wise this is the moment of 05, seen from outside.)
pr(0, "tent", { scale: 1.15 }, 0, "linear"); pr(T.phone - 0.02, "tent", { scale: TENT_S }, 0.01, "linear");   // 01 (a flash-forward, outside) a smaller tent so the bear towers over it
bearAt(0, 0, -0.85, 0, { rear: 1, jaw: 0.8, snarl: 1, brow: -1, ears: -0.6, headP: 25 });
pr(0, "tent", { cut: 0, push: 0, open: 1 }, 0, "linear");   // seeds (no propState default)
pr(0, "tent", { rip: 0.65 }, 0.5, "out");
bear(0, { swipe: 0.6 }, 0.45, "out");
lightning(0.05);
sfx(0, "ai/bear-roar", { gain: 1, reason: "the bear roaring over the tent" });
sfx(0.1, "ai/canvas-rip", { gain: 0.9, reason: "claws ripping the tent" });
for (const [who, at] of [["spud", [-0.74, 0.7]], ["chip", [0, 0.98]], ["wedge", [0.76, 0.7]]]) {
  place(0, who, at, 0); expr(0, who, "terrified", { open: 0.6 }, 0.01); look(0, who, [0, 0.9], 0.01);
}
nar(0.0, "camping", { until: T.phone + 0.1 });
see(0, T.phone, ["bear", "tent", "spud.face", "chip.face", "wedge.face"], "COLD OPEN: the bear on its hind legs ripping the tent, the three screaming inside");

// ================================================================ 02 1.5-3.4: inside the tent, no signal
// panel 02: close group in the dark tent, Spud holds up his phone ("No service"), its light on his face; Chip and
// Wedge pressed behind him. The tent's door (-z) behind them; outside, the bear's growl.
bearAt(T.phone, r3(CAR[0] + 1.35), r3(CAR[1] + 0.7), -70, { headP: 10 });
place(T.phone, "spud", [-0.15, 0.35], 0); place(T.phone, "chip", [0.6, 0.0], -10); place(T.phone, "wedge", [-0.75, -0.25], 10);
for (const who of ["spud", "chip", "wedge"]) expr(T.phone - 0.02, who, "terrified", { open: 0.25 }, 0.01);
look(T.phone - 0.02, "spud", [0.25, -0.35], 0.01); look(T.phone - 0.02, "chip", [-0.3, -0.2], 0.01); look(T.phone - 0.02, "wedge", [0.3, -0.2], 0.01);
pr(T.phone - 0.02, "tent", { rip: 0, open: 0, rot: 180, cut: 1 }, 0.01, "linear");   // from here the door faces the forest; the back is a wild wall for the inside shots
// the phone held up, its screen to us as drawn: the approved edge hold for a phone shown to others (gta6 02 SHOW,
// feedback-phone-shown-to-others): the R glove behind its outer edge, fingers flat on the back, the thumb on the bezel
const PH_SIZE = { w: 0.078, h: 0.155, t: 0.012 }, PH_TILT = (5 * Math.PI) / 180;
const SHOW = (o = {}) => ({ prop: "phone", grip: [r3(-PH_SIZE.w / 2), r3(0.5 * PH_SIZE.h), r3(-PH_SIZE.t / 2)],
  frame: { y: [r3(Math.cos(PH_TILT)), r3(Math.sin(PH_TILT)), 0], z: [0, 0, 1], at: PHONE_EDGE, elbow: 1 }, ...o });
pr(T.phone - 0.02, "phone", { x: 0.05, y: 0.38, z: 0.9, rot: 0, tip: 0 }, 0.01, "linear");
c.arm(T.phone - 0.02, "spud", "R", SHOW({ at: [0.05, 0.38, 0.9] }), 0.01, "linear"); A(T.phone - 0.02, "spud", "grip", { side: "R", shape: "phoneEdge", dur: 0 });
A(r3(T.phone - 0.005), "spud", "grab", { prop: "phone", hand: "R", grip: SHOW().grip, dur: 0, pose: null, keep: true });   // after the hand is on it (keep holds it where it is)
sfx(T.phone + 0.3, "ai/bear-growl", { gain: 0.7, reason: "a deep growl right outside the tent" });
nar(T.phone + 0.15, "bear");
see(T.phone, T.car, ["spud.face", "chip.face", "wedge.face", "phone"], "no signal: Spud's phone reads No service, three terrified faces");

// ================================================================ 03 3.4-5.6: through the door's mesh window, the car
// panel 03: from inside the tent through its mesh window: the bear smashes the windscreen, the driver door hangs torn
// open on the grass, the headlights flash across the camp.
bearAt(T.car, r3(CAR[0] + 1.3), r3(CAR[1] + 1.4), -135, { headP: 10 });   // at the front corner by the driver door, facing the windscreen (at the bonnet its body went into it)
pr(T.car - 0.02, "car", { lights: 1 }, 0.01, "linear");
pr(T.car - 0.02, "tent", { open: 1 }, 0.01, "linear");   // the mesh read black from inside: through the open doorway (departure)
bear(T.car + 0.1, { rear: 0.55, swipe: 0 }, 0.25, "out");
const SMASH = r3(T.car + 0.45), TEAR = r3(T.car + 1.15);   // no narrator here: the glass, the metal, the alarm
bear(SMASH - 0.1, { swipe: 1 }, 0.12, "in");
pr(SMASH, "car", { smash: 1 }, 0.06, "out");
sfx(SMASH, "ai/glass-smash", { gain: 1, reason: "the windscreen smashed by the paw" });
bear(SMASH + 0.3, { swipe: 0, rear: 0.2 }, 0.3, "inOut");
pr(TEAR - 0.3, "car", { door: 1 }, 0.25, "in");
pr(TEAR - 0.02, "car", { torn: 1 }, 0.01, "linear");
pr(TEAR - 0.02, "door", { x: r3(CAR[0] + 1.05), y: 0.6, z: r3(CAR[1] + 0.5), rot: 20 }, 0.01, "linear");
pr(TEAR, "door", { x: r3(CAR[0] + 2.2), y: 0, z: r3(CAR[1] + 1.6), rot: 75, tilt: 85 }, 0.45, "in");
sfx(TEAR - 0.2, "ai/metal-tear", { gain: 0.9, reason: "the door wrenched off its hinges" });
pr(TEAR + 0.1, "car", { flash: 6 }, 2.4, "linear");
sfx(TEAR + 0.1, "ai/car-alarm", { gain: 0.5, dur: 5.6, reason: "the car alarm" });
see(T.car + 0.2, T.faces, ["bear", "car"], "through the mesh: the bear smashes the windscreen and tears the door off, the alarm and lights going");

// ================================================================ 04 5.6-7.6: three faces, three choices
// panel 04: side by side, lit red and white by the flashing headlights: Spud clenches a fist (FIGHT), Chip slides into
// his sleeping bag (FREEZE), Wedge looks at the tent door (FLIGHT). Labels as drawn (speech-bubble shape: textPop).
place(T.faces, "spud", [-0.55, 0.2], 10); place(T.faces, "chip", [0, 0.75], 0); place(T.faces, "wedge", [0.58, 0.2], -10);
// he keeps the phone (every let-go in the tent left it hanging in the air: the bake knows the tent only as it is at frame 0):
// low at his side in 04, let go off set once he is parked (06)
c.arm(T.faces - 0.02, "spud", "R", SHOW({ at: [-0.9, 0.32, 0.45] }), 0.01, "linear");   // on his right (-x), outside the body
A(T.drag + 0.05, "spud", "release", { prop: "phone", keep: "air", reason: "the phone is put away off set while he is parked", dur: 0 });
pr(T.drag + 0.08, "phone", { x: 52, y: 0, z: 40 }, 0.01, "linear");
// Chip sits in his bag in front of the two, as drawn: the sitter bag at 0.8 (at 1.0 its hood stood over his head)
pr(T.faces - 0.02, "bag", { x: 0, z: 0.75, rot: -40, cover: 0, recline: 8, scale: 0.64 }, 0.01, "linear");
A(T.faces - 0.02, "chip", "ride", { prop: "bag", sit: true });
expr(T.faces - 0.02, "spud", "angry", { open: 0.05 }, 0.01); c.arm(T.faces + 0.12, "spud", "L", "fist", 0.25, "out");
expr(T.faces - 0.02, "chip", "terrified", { open: 0.1 }, 0.01); A(T.faces + 1.9, "chip", "face", { lid: 1, dur: 0.2 });
expr(T.faces - 0.02, "wedge", "terrified", { open: 0.2 }, 0.01); look(T.faces + 0.9, "wedge", [0.6, 0.05], 0.15);
// one word, one face, one label, as the pilot: "Fight." Spud's fist, "Flight." Wedge eyes the door, "Or freeze." Chip
// pulls the bag up; then the three together for the big question
const LABEL = { size: 110, dur: 0.6, angle: -4, dy: -0.7, dx: 0 };   // just over the heads, under the caption band
const W_FIGHT = r3(T.faces + 0.1), W_FLIGHT = r3(T.faces + 0.9), W_FREEZE = r3(T.faces + 1.7), W_ONE = r3(T.faces + 2.6);
nar(W_FIGHT, "fight", { until: W_FLIGHT }); nar(W_FLIGHT, "flight", { until: W_FREEZE }); nar(W_FREEZE, "freeze", { until: W_ONE }); nar(W_ONE, "one", { until: T.door });
c.textPop(W_FIGHT + 0.05, "spud", "FIGHT", { ...LABEL, color: "#ffffff" });
c.textPop(W_FLIGHT + 0.05, "wedge", "FLIGHT", { ...LABEL, color: "#ffffff" });
c.textPop(W_FREEZE + 0.05, "chip", "FREEZE", { ...LABEL, color: "#ffffff" });
sfx(T.faces, "ai/heartbeat", { gain: 0.6, reason: "their hearts pounding" });
see(T.faces + 0.2, T.door, ["spud.face", "chip.face", "wedge.face"], "three choices: Spud's fist, Chip into the bag, Wedge eyeing the door");

// ================================================================ 05 7.6-9.6: the lantern, the fire, the bear's head in the door
// panel 05: at the open door: the bear knocks the gas lantern over (the dry grass catches), pushes its head and
// shoulders in; Chip lies curled in his bag, eyes shut tight. Spud and Wedge pressed to the back wall, out of shot.
const KNOCK = r3(T.door + 0.25);

bearAt(T.door, 0.55, -2.1, 0, { headP: 25, sniff: 1 });
bear(KNOCK - 0.1, { swipe: 0.5 }, 0.15, "in"); bear(KNOCK + 0.1, { swipe: 0 }, 0.3);
pr(KNOCK, "lantern", { tip: 1 }, 0.35, "in");
sfx(KNOCK + 0.3, "ai/glass-smash", { gain: 0.35, reason: "the lantern's glass on the ground" });
pr(KNOCK + 0.3, "grass", { fire: 1 }, 0.4, "out"); pr(KNOCK + 0.3, "grass", { spread: 0.6 }, 1.6, "linear");
sfx(KNOCK + 0.35, "ai/grass-fire", { gain: 0.45, dur: 18.0, reason: "the dry grass burning" });
bear(T.door + 0.75, { z: -1.15, x: -0.2, headP: 40, jaw: 0.2 }, 0.7, "inOut");   // head and shoulders into the door
pr(T.door + 0.75, "tent", { push: 0.6 }, 0.7, "inOut");
sfx(T.door + 0.9, "ai/bear-huff", { gain: 0.8, reason: "the bear huffing as it sniffs Chip" });
// Chip lies down in the bag, curled, eyes shut
// he lies zipped in the lying bag (T4: the sitter bag cannot lie down), his face up by the door, eyes shut
pr(T.door - 0.02, "bag", { x: 50, z: 40 }, 0.01, "linear");
pr(T.door - 0.02, "lbag", { x: -0.25, z: -0.9, rot: 90, cover: 0.3, drag: 0, roll: 60 }, 0.01, "linear");
A(T.door - 0.02, "chip", "lean", { to: 60, dur: 0 });   // the bag rolled to us and Chip with it (the rider does not take the prop's roll): his face to us
A(T.door - 0.02, "chip", "ride", { prop: "lbag", off: [0, -0.19, -0.05], dur: 0 });
A(T.door - 0.02, "chip", "pitch", { to: -90, dur: 0 });
for (const side of ["R", "L"]) c.arm(T.door - 0.02, "chip", side, { o: [-0.02, 0.3, -0.12] }, 0);
A(T.door - 0.02, "chip", "face", { lid: 1, dur: 0.01 });
park(T.door, "spud"); park(T.door, "wedge");   // pressed to the back wall, out of shot (in the corners a glove still showed)
see(T.door + 0.1, T.drag, ["bear", "lantern", "lbag"], "the lantern goes over, the grass burns, the bear's head comes in over Chip in his bag");

// ================================================================ 06 9.6-11.9: dragged out into the dark
// panel 06: side view, the bear walks away to the left with the bag's foot in its teeth, Chip inside; the grass fire
// behind. The bag follows the mouth hold (BEAR_MOUTH from the bear's header).
const DRAG0 = [3.6, -2.6], DRAG1 = [1.2, -2.9];
bearAt(T.drag, DRAG0[0], DRAG0[1], -95, { gait: 0, headP: 30, jaw: 0.35 });
bear(T.drag, { x: DRAG1[0], z: DRAG1[1], gait: 3 }, r3(T.run - T.drag), "linear");
// the bag lies along the bear's near side (toward us), its foot end in the bear's teeth (bearMouth, props-bear.js)
const DRAG_ROT = -95, BEAR_S = 1.05;
const bagFor = ([x, z], gait) => {
  const m = bearMouth({ ...BEAR0, headP: 30, jaw: 0.35, gait }, { x, z, rot: DRAG_ROT, scale: BEAR_S }), a = rad(DRAG_ROT);
  // the bag trails back along the bear's near (+z) flank, its foot end in the teeth: the origin (his face) 0.7 back and
  // 0.5 out to our side, the bag turned so its foot points at the mouth (lyingbag grip "foot" [0, 0.32, 0.8] at drag 1)
  const fwd = [Math.sin(a), Math.cos(a)], o = [m[0] - fwd[0] * 0.55, m[2] - fwd[1] * 0.55 + 0.55];
  return { x: r3(o[0]), z: r3(o[1]), rot: r3((Math.atan2(m[0] - o[0], m[2] - o[1]) * 180) / Math.PI) };
};
pr(T.drag - 0.02, "lbag", { ...bagFor(DRAG0, 0), drag: 1, cover: 0.3, roll: -60 }, 0.01, "linear");   // rolled onto its side: his face to us
A(T.drag - 0.02, "chip", "lean", { to: -60, dur: 0 });
pr(T.drag, "lbag", bagFor(DRAG1, 3), r3(T.run - T.drag), "linear");
sfx(T.drag, "ai/bag-drag", { gain: 0.7, reason: "the bag dragged over the grass" });
park(T.drag, "spud"); park(T.drag, "wedge");
pr(T.drag - 0.02, "tent", { cut: 0, push: 0 }, 0.01, "linear");
nar(T.drag + 0.3, "freezeOut");
see(T.drag + 0.1, T.run, ["bear", "lbag"], "Freeze: the bear drags Chip away in his sleeping bag");
// off screen at his park spot, facing the two props: Spud takes the branch (L) and the pot (R), the library's holds
A(r3(T.drag + 0.02), "spud", "turn", { to: 0, dur: 0.01 });
const hBr = grips.mug(c, "spud", BRANCH, { side: "R" }), hPot = grips.phone(c, "spud", POT, { side: "L" });   // as drawn: the fire in his right hand
hBr.take(r3(T.drag + 0.4)); hPot.take(r3(T.drag + 0.4));

// ================================================================ 07 11.9-13.6: Wedge runs; the bear drops the bag and chases
// panel 07: Wedge sprints past the burning grass toward the trees (to our left); the bear behind him, low and fast.
park(T.run, "chip");
const W0 = [1.0, 2.0], W1 = [-1.1, 4.0];   // panel 07: he runs at us and past to the left, the bear behind him
place(T.run, "wedge", W0, -46);
expr(T.run - 0.02, "wedge", "terrified", { open: 0.35 }, 0.01); look(T.run - 0.02, "wedge", [0.6, 0.1], 0.01);
A(T.run, "wedge", "move", { to: W1, dur: 1.7, ease: "linear", stride: 1.4 });
bearAt(T.run, 2.6, 0.4, -43, { bound: 1, gait: 0, jaw: 0.5, snarl: 0.6, headP: 10, ears: -0.6 });
bear(T.run, { x: 0.3, z: 2.9, gait: 3 }, 1.7, "linear");
pr(T.run - 0.02, "lbag", { x: 2.9, z: -3.4, rot: -95, drag: 0 }, 0.01, "linear");   // dropped behind the tent
A(T.run - 0.03, "chip", "ride", { prop: null, dur: 0 }); A(T.run - 0.03, "chip", "pitch", { to: 0, dur: 0 });
pr(T.stand - 0.02, "cooler", { x: COOLER[0], z: COOLER[1] }, 0.01, "linear");   // in from 09 (in 07 Wedge ran through it)   // dropped behind the tent
pr(T.run, "grass2", { fire: 1, spread: 0.5 }, 0.3, "out");
sfx(T.run + 0.1, "ai/bear-charge", { gain: 0.9, reason: "the bear galloping after Wedge" });
sfx(T.run + 0.2, "ai/step-grass", { gain: 0.5, reason: "Wedge running" });
see(T.run + 0.1, T.tree, ["wedge.face", "bear"], "Flight: Wedge runs, the bear drops the bag and goes after him");

// ================================================================ 08 13.6-17.5: up the pine, and the bear climbs after him
// panel 08: lightning, looking up the pine: Wedge clings halfway up, the bear climbs right behind him, bark flying.
// The cut on the treetop: Wedge's face looking down, the bear's head rising into the frame under him.
const CLIMB = r3(T.tree + 0.2);
place(T.tree, "wedge", [PINE[0], r3(PINE[1] + 0.42)], 180, 2.5);   // on the trunk's +z side, his back to us (he faces the bark), climbing
A(T.tree - 0.02, "wedge", "pitch", { to: 0, dur: 0.01 });
A(CLIMB, "wedge", "climb", { to: { y: 3.7 }, steps: 4, dur: 2.6 });
look(T.tree + 1.2, "wedge", [0.3, -0.9], 0.2); expr(T.tree + 1.2, "wedge", "terrified", { open: 0.5 }, 0.15);
bearAt(T.tree, PINE[0], r3(PINE[1] + 0.55), 180, { climb: 1, climbStep: 0, y: 0.1, jaw: 0.4, snarl: 0.5 });
bear(CLIMB, { y: 0.9, climbStep: 2 }, 3.1, "linear");   // crown stays under Wedge's feet (2.4 m reared + y)
pr(T.tree, "pine", { shake: 1, snap: 6 }, 3.5, "linear");
lightning(T.tree + 0.05, { x: -2, seed: 8 });
sfx(T.tree + 0.3, "ai/branch-snap", { gain: 0.8, reason: "bark and branches breaking as the bear climbs" });
sfx(T.tree + 1.6, "ai/branch-snap", { gain: 0.8, reason: "more branches" });
sfx(T.tree + 2.4, "ai/bear-growl", { gain: 0.8, reason: "the bear right under him" });
nar(T.tree + 0.3, "flightOut", { until: r3(T.tree + 3.65) }); nar(r3(T.tree + 3.65), "climb", { until: T.stand });
see(T.tree + 0.1, T.stand, ["wedge", "bear", "pine"], "black bears climb: the bear climbs the pine right behind Wedge");

// ================================================================ 09 17.5-19.6: Spud stands his ground
// panel 09: Spud up on the cooler by the campfire, a burning branch raised in his L hand, the pot in his R, roaring;
// behind him (back right) the bear has come down the pine and turns toward him.
park(T.stand, "wedge");
place(T.stand, "spud", COOLER, 55, 0.48);
// where a held prop goes for Spud on the cooler facing yaw: [side (+ his right), height of its bottom, forward]
const bodyPt = (base, yaw, [side, up, fwd]) => { const a = rad(yaw); return [r3(base[0] - Math.cos(a) * side + Math.sin(a) * fwd), r3(up), r3(base[1] + Math.sin(a) * side + Math.cos(a) * fwd)]; };   // facing +z his right hand is at -x
const UP_BR = [0.32, 1.32, 0.05], OUT_POT = [-0.38, 0.86, 0.3];
const hold = (t, yaw, at = COOLER, br = UP_BR, pot = OUT_POT) => { hBr.carry(t, bodyPt(at, yaw, br), 0.01, "linear"); hPot.carry(t, bodyPt(at, yaw, pot), 0.01, "linear"); };
pr(T.stand - 0.02, "branch", { fire: 1 }, 0.01, "linear");
hold(T.stand - 0.015, 55);
// he waves the fire at it twice as he roars
hBr.carry(T.stand + 0.35, bodyPt(COOLER, 55, [0.26, 1.3, 0.24]), 0.25, "inOut"); hBr.carry(T.stand + 0.6, bodyPt(COOLER, 55, UP_BR), 0.3, "inOut");
hBr.carry(T.stand + 1.0, bodyPt(COOLER, 55, [0.26, 1.3, 0.24]), 0.25, "inOut"); hBr.carry(T.stand + 1.25, bodyPt(COOLER, 55, UP_BR), 0.3, "inOut");
expr(T.stand - 0.02, "spud", "angry", { open: 0.7 }, 0.01); look(T.stand - 0.02, "spud", [0.5, 0.1], 0.01);
bearAt(T.stand, 1.9, -2.2, -160, { headP: 5, jaw: 0.3 });   // back right, past the tent (at 1.2 it stood inside the bigger tent)
bear(T.stand + 0.3, { rot: -140 }, 0.8, "inOut");
c.say(T.stand + 0.25, "spud", "GET AWAY! GO!", { voice: "spud", gibberish: true, gain: 1.0 });
see(T.stand + 0.1, T.charge, ["spud.face", "branch", "pot", "bear"], "Spud on the cooler, burning branch up, roaring; the bear turns to him");

// ================================================================ 10 19.6-21.0: the charge
// panel 10: low behind Spud: the bear charges at full speed straight at him, dirt and sparks; he does not step back.
place(T.charge, "spud", COOLER, 180, 0.48);   // cut cheat: his back to us, the bear coming at him down the lens axis
hold(T.charge - 0.015, 180);
pr(T.charge - 0.02, "tent", { x: -1.9 }, 0.01, "linear");   // cut cheat: the tent slid left out of the charge line
pr(T.bite - 0.02, "tent", { x: TENT[0] }, 0.01, "linear");
pr(T.charge - 0.02, "lantern", { x: 60 }, 0.01, "linear"); pr(T.bite - 0.02, "lantern", { x: LANTERN[0] }, 0.01, "linear");   // out of the charge line
bearAt(T.charge, 1.3, -4.6, -7, { bound: 1, jaw: 0.6, snarl: 0.8, ears: -1, headP: 8 });
bear(T.charge, { x: 0.55, z: 1.3, gait: 3.5 }, 1.35, "in");
lightning(T.charge + 0.35, { x: 2, seed: 11 });
sfx(T.charge, "ai/bear-charge", { gain: 1, reason: "the bear charging" });
sfx(T.charge + 0.5, "ai/bear-roar", { gain: 0.9, reason: "roaring as it charges" });
see(T.charge + 0.05, T.bite, ["bear", "spud"], "the bear charges straight at Spud; he holds his ground");

// ================================================================ 11 21.0-24.3: one metre away, on its hind legs; the pot
// panel 11: the bear stopped a metre in front of him, rearing and roaring; Spud thrusts the pot up and it bites the
// pot (drawn so: Jonny 16:43). Then it drops to all fours, turns and runs into the forest. He never hits it.
const BITE = r3(T.bite + 0.9);
place(T.bite, "spud", COOLER, 90, 0.48);
hold(T.bite - 0.015, 90);
const THRUST = bodyPt(COOLER, 90, [-0.14, 1.25, 0.4]);   // the pot's bottom centre, thrust up at its face
hPot.carry(T.bite + 0.5, THRUST, 0.3, "out");
// the bear stands so its teeth close on the pot's middle at the bite (bearMouth, props-bear.js)
const BITE_POSE = { ...BEAR0, rear: 0.4, jaw: 0.35, headP: 30 };   // mouth at 1.35 m: the pot's middle
const m0 = bearMouth(BITE_POSE, { x: 0, z: 0, rot: -90, scale: 1.05 }), POTMID = [THRUST[0] + 0.05, THRUST[2]];
const BEAR11 = [r3(POTMID[0] - m0[0]), r3(POTMID[1] - m0[2])];
bearAt(T.bite, BEAR11[0], BEAR11[1], -90, { rear: 0.65, jaw: 0.9, snarl: 1, ears: -1, brow: -1, headP: 5 });
bear(BITE - 0.35, { rear: 0.4, jaw: 0.35, headP: 30 }, 0.35, "in");   // lunges down onto the pot
pr(BITE, "pot", { dent: 1 }, 0.1, "out");
sfx(BITE, "ai/pot-bite", { gain: 1, reason: "teeth on the steel pot" });
sfx(T.bite + 0.1, "ai/bear-roar", { gain: 1, reason: "the roar in his face" });
bear(BITE + 0.35, { jaw: 0.7, headP: 5 }, 0.25, "out");   // lets go of the pot
hPot.carry(BITE + 0.4, bodyPt(COOLER, 90, OUT_POT), 0.35, "inOut");
see(T.bite + 0.05, T.flee, ["bear", "spud.face", "pot"], "a metre away on its hind legs: it bites the pot Spud holds up");

// ================================================================ 11b: the bear gives up and runs (Jonny, draft 1:
// "one should see how the black bear gets flight"): wide on the bear; it drops to all fours, backs off, turns away from
// Spud and lopes off past the tent into the dark forest. Spud off the left of the frame.
const FLEE = T.flee;
bearAt(FLEE, BEAR11[0], BEAR11[1], -90, { rear: 0.4, jaw: 0.5, headP: 20, ears: -1 });
bear(FLEE + 0.1, { rear: 0, jaw: 0.15, x: 1.6, z: 1.95 }, 0.5, "inOut");   // down on all fours, backing off from him
sfx(FLEE + 0.25, "ai/bear-huff", { gain: 0.8, reason: "the bear huffing as it backs off" });
bear(FLEE + 0.65, { rot: -205 }, 0.45, "inOut");   // turns away: its rump swings toward us, not through him
bear(FLEE + 1.1, { x: 3.3, z: -4.6, gait: 2.5, bound: 0.6 }, 1.7, "in");
sfx(FLEE + 1.1, "ai/bear-charge", { gain: 0.6, reason: "the bear running off into the forest" });
see(FLEE + 0.05, T.dawn, ["bear"], "the bear gives up and runs off into the forest");

// ================================================================ 12 24.3-31.0: sunrise at the lake
// panel 12: smoke over the burnt grass, Spud alone with the dented pot, breathing out; behind him the empty torn bag
// at the forest edge, deep claw marks up the empty pine on the right.
place(T.dawn, "spud", [-0.2, 0.6], 12);
// the branch left behind at the camp (off screen in 11b): let go in the air, out of the physics bake, and put away
A(r3(T.dawn - 0.4), "spud", "release", { prop: "branch", keep: "air", reason: "the branch is put away off screen before the dawn cut", dur: 0 });
pr(r3(T.dawn - 0.35), "branch", { x: 56, y: 0, z: 42, fire: 0 }, 0.01, "linear");
c.A(r3(T.dawn - 0.4), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.1 }); c.arm(r3(T.dawn - 0.38), "spud", "R", "rest", 0.3, "inOut");
hPot.carry(T.dawn - 0.015, bodyPt([-0.2, 0.6], 12, [-0.3, 0.22, 0.12]), 0.01, "linear");   // the dented pot hangs in his hand
expr(T.dawn - 0.02, "spud", "sad", { open: 0.05 }, 0.01); look(T.dawn - 0.02, "spud", [0.6, 0.2], 0.01);
pr(T.dawn - 0.02, "bag12", { x: 0.75, z: -0.6, rot: 70 }, 0.01, "linear");
pr(T.dawn - 0.02, "pine12", { x: 1.25, z: -1.4, rot: 180 }, 0.01, "linear");
pr(T.dawn - 0.02, "claws", { x: 1.25, y: 1.3, z: -1.04 }, 0.01, "linear");
pr(T.dawn - 0.02, "bear", { x: 60, z: 60 }, 0.01, "linear");
["tent", "car", "door", "lantern", "grass", "grass2", "pine", "fire", "cooler", "bag", "lbag", "bolt"].forEach((id, i) => pr(T.dawn - 0.02, id, { x: 70 + i * 4, z: 70 }, 0.01, "linear"));
A(T.dawn + 1.6, "spud", "squash", { amount: 0.06, dur: 0.6 });   // breathes out
nar(T.dawn + 0.3, "beat", { until: r3(T.dawn + 2.55) }); nar(r3(T.dawn + 2.55), "scare", { until: r3(T.dawn + 4.0) }); nar(r3(T.dawn + 4.0), "survive", { until: END, pos: 300 });
see(T.dawn + 0.1, END, ["spud.face", "pot", "bag12"], "sunrise: Spud alone with the dented pot, the empty torn bag, the clawed pine");

// ---------------------------------------------------------------- blinks: placed, never on a line
act.blinksAt(c, "spud", [3.55, 9.95, 23.6, 30.6]);
act.blinksAt(c, "wedge", [3.56, 10.0]);
act.blinksAt(c, "chip", [3.57]);

// ---------------------------------------------------------------- shots
// every shot keeps to the paintings' safe range (node qa/env.mjs --range <env>): camp x +-2.7, y >= 0.65, pan +-10,
// tilt +-8 round the painting's own pitch (the storm painting looks 11.9 deg UP, tilt - is down), fov <= 52; dawn x +-0.59, y >= 1.14, z 3.4-5.4. So the shot up the pine
// is taken from up in the air (4.4 m), level with the two of them, not from the ground looking up.
const OPEN = shot("camp", [0, 1.6, 4.2], { tilt: -6, fov: 50 });             // 01 low in front of the torn tent, the bear above it
const PHONE = shot("camp", [0.0, 0.8, 2.9], { tilt: -8, fov: 46 });       // 02 through the wild wall: the three and the phone
const MESH = shot("camp", [0.15, 0.85, 0.1], { pan: 6, tilt: -4, fov: 50 });   // from inside, out through the open door as panel 03 frames it  // 03 inside behind them, out through the door's mesh window
const FACES3 = shot("camp", [0, 0.85, 3.9], { tilt: -8, fov: 48 });          // 04 the three side by side
const DOORIN = shot("camp", [0.1, 1.0, 2.6], { pan: 0, tilt: -8, fov: 46 });   // high: Chip's face up in the bag, the bear's nose in the door // 05 from behind the back wall to the door: the bear's head comes in over Chip
const DRAG = shot("camp", [2.0, 1.2, 1.2], { pan: 0, tilt: -8, fov: 50 });  // 06 the bear drags the bag off to the left, the fire behind
const RUN = shot("camp", [0.2, 1.0, 5.4], { pan: 3, tilt: -2, fov: 48 });   // 07 Wedge across the front of the tent, the bear behind
const UP = shot("camp", [-1.5, 3.6, 2.2], { pan: -6, tilt: 0, fov: 46 });   // 08 level with the climb, up in the air
const STAND = shot("camp", [-0.1, 1.1, 5.6], { pan: 3, tilt: -3, fov: 46 }); // 09 Spud on the cooler, the bear back left
const LOWBACK = shot("camp", [0, 1.0, 4.6], { pan: 0, tilt: -5, fov: 46 }); // 10 low behind Spud, the charge at us
const SIDE = shot("camp", [0.35, 1.5, 5.5], { tilt: -3, fov: 52 });          // 11 the two of them side on
const FLEECAM = shot("camp", [1.0, 1.4, 4.6], { pan: 0, tilt: -1, fov: 50 });   // 11b wide: the bear backs off and runs into the forest
const DAWN = shot("dawn", [0.2, 1.3, 4.4], { tilt: 5, fov: 46 });            // 12 the lake at sunrise
const beats = c.beats([
  ["01 cold open: the bear over the tent", T.hook, OPEN, "hook"],
  ["02 no service", T.phone, PHONE],
  ["03 the car", T.car, MESH],
  ["04 fight flight freeze", T.faces, FACES3],
  ["05 the bear in the door", T.door, DOORIN],
  ["06 freeze dragged off", T.drag, DRAG],
  ["07 flight runs", T.run, RUN, "escalation"],
  ["08 black bears climb", T.tree, UP],
  ["09 spud stands his ground", T.stand, STAND],
  ["10 the charge", T.charge, LOWBACK],
  ["11 a metre away", T.bite, SIDE, "payoff"],
  ["11b the bear runs", T.flee, FLEECAM],
  ["12 sunrise", T.dawn, { ...DAWN, to: shot("dawn", [0.2, 1.3, 3.9], { tilt: 5, fov: 46 }), dur: r3(END - T.dawn), ease: "linear" }],
], END);

write(import.meta.url, {
  id: "fff-02-bear-camp",
  title: "Would you survive a black bear in your camp?",
  idea: "Fight, Flight or Freeze 02: a black bear walks into the camp in a thunderstorm; Chip plays dead and is dragged off in his sleeping bag, Wedge runs and the bear climbs the pine after him, Spud stands his ground on the cooler with fire and noise and the bear gives up",
  format: "series: Fight, Flight or Freeze (one extreme situation, three instincts, all three outcomes in one video)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [200, 640],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  cover: 0.4,
  set: { type: "env", env: ENVS.camp, swap: PLACES.map(([at, name]) => ({ at, env: ENVS[name] })), life: "storm", aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  music: { file: "ai/orchestra-chase/orchestra-chase-01.ogg", lowCut: 90, gain: 0.8, duck: { voice: -6 }, dip: false, until: T.dawn,
    then: { file: "ai/sad/sad-02.ogg", from: T.dawn, gain: 0.55 } },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, surface: "grass", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["bear", "tent", "spud", "chip", "wedge"], hint: 0, what: "a black bear on its hind legs rips open a tent with three screaming potatoes inside, lightning behind" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "bag", from: T.faces, to: T.door, reason: "Chip sits inside his sleeping bag (enclosing prop)" },
    { who: "chip", with: "lbag", from: T.door, to: T.run, reason: "Chip lies zipped inside the lying bag (enclosing prop) until he is dragged off" },
    ...["spud", "chip", "wedge"].map((who) => ({ who, with: "tent", from: 0, to: T.drag, reason: "the three are inside the tent (an enclosing prop): its cloth is all round them" })),
    { who: "chip", with: "bear", from: T.door, to: T.run, reason: "the bear's muzzle over Chip in his bag, then his bag's foot end in its teeth (the bear never touches the potato itself on screen)" },
    { who: "wedge", with: "pine", from: T.tree, to: T.stand, reason: "Wedge climbs the pine: arms round the trunk, gloves and jacket against the bark" },
    { who: "wedge", with: "tent", from: T.run, to: T.tree, reason: "Wedge runs out past the tent" },
    { who: "spud", with: "cooler", from: T.stand, to: T.dawn, reason: "Spud stands on the cooler's lid" },
    { who: "wedge", with: "chip", from: 0, to: T.door, reason: "the three are pressed together in a small tent (panels 01, 02, 04 draw them shoulder to shoulder)" },
    { who: "chip", with: "spud", from: 0, to: T.door, reason: "the three are pressed together in a small tent (panels 01, 02, 04 draw them shoulder to shoulder)" },
  ],
  notes: "Generated by storyboards/series/fight-flight-freeze/02-bear-camp/make-bear-camp.mjs. Title added in TikTok's text tool.",
});
