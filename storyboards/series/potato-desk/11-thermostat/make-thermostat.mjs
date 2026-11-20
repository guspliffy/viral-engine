// POTATO DESK 11 "Thermostat war" (Jonny 20 Nov 2026: "new court day, heaven, hell and office video ... apply all our
// recent learnings"; office study 17:34, premise A picked 17:52 Berlin "it has some conflict", hook H1, ending E1;
// 19:26 "target the 60+ seconds" -> outline v2). Story: /mnt/project-files/videos/potato-desk/11-office/STORY.md.
// Panels: .../sheets/thermostat-sheet-1.png. Design (set, marks, kit, 32 shots): DESIGN.md here (Fable 5.2).
//   node storyboards/series/potato-desk/11-thermostat/make-thermostat.mjs -> thermostat.json
//
// Chain: the room is 19, so the freezing one shouts who touched it; so the boiling one owns it and they click it back and
// forth; so the boss sees it and lets it run; so each one adds a device (scarf, fan, heater, open window) and the room
// splits; so the one in the middle offers 21 and they shake; so the room goes quiet, and they sneak clicks; so they
// block each other (tape, ice, hot mug) and the room blows up; so the boss locks it at 21; so they still feel it and
// tear at the box; so the boss pops the cover: an empty shell, it was never wired; so the cold one asks why he is
// freezing, and the boss nods at the window the hot one opened.
// Counter (natural, visible): the LCD's number. Opener A: the war is on at frame 0 (Chip's finger on the button).
// Jonny 20 Nov 09:44: every shot drifts or pushes, a new framing per line, cut 0.1-0.2 s after each action, no silent
// holds; the end never reuses the frame-0 picture (hell reviews data, 20 Nov).
// Departures from DESIGN.md: round 1 shows each press (finger on the button with the line) before the device, so the
// number never changes without a hand (cause and effect); two line pairs added (sulk after the lock, "Since when?" /
// "Since always." after the reveal) to reach his 60 s target with story, not holds.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (desk11-voice-probe, 20 Nov 2026), in LINES order
const DUR = [2.44, 2.56, 1.51, 0.81, 1.13, 0.96, 0.77, 2.95, 0.50, 0.74, 0.51, 0.70, 1.61, 1.09, 1.54, 0.83, 0.95, 0.80, 0.93, 1.24, 1.23, 1.22];
const T = LINES.map(() => 0);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- marks (DESIGN §1; x right, z toward us; feet)
const OY = 1.36;                                   // thermostat origin height (bench decides; fallback 1.30)
const CHIP_DESK = [-1.00, -0.36], CHIP_WALL = [-0.56, -0.92], Y_BOX = 0.26, Y_STEP = 0.74;
const SPUD0 = [0.00, -0.36];
const MASH_DESK = [1.00, -0.36], R1 = [0.64, -0.90], R1B = [0.80, -0.92], W = [1.00, -0.85], R2 = [1.80, -0.90];
const WEDGE_IN = [0.40, 1.25], WEDGE_OUT = [2.7, 1.05], AWAY = -60;
const Y_CHIP_WALL = 60, Y_MASH_R1 = -60;           // turned to the thermostat, faces still to us

const cast = [
  { id: "chip", character: "potatobrawl/chip", at: CHIP_WALL, face: Y_CHIP_WALL, expr: "angry", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 0, expr: "kind", follow: 0.3, seed: 1.1 },
  { id: "mash", character: "potatobrawl/mash", at: MASH_DESK, face: 0, expr: "smug", follow: 0.3, seed: 4.1 },
  { id: "wedge", character: "potatobrawl/wedge", at: [3.2, 1.05], face: -90, expr: "smug", follow: 0.3, seed: 3.1 },
];

// ---------------------------------------------------------------- set (DESIGN §2-5)
const TH = { id: "thermo", kind: "thermostat", x: 0, y: OY, z: -1.30, temp: 19 };
const BOX = { id: "tbox", kind: "thermobox", x: 0, y: OY, z: -1.30, dropAt: 0 };   // dropAt set below (the rip)
const LP = (id, x, y, z, w, d, color, face) => ({ id, kind: "lightpool", x, y, z, w, d, color, ...(face && { face }) });
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.6, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 4.6, w: 5.0, d: 12.0 },
  { id: "ceiling", staged: "the office's suspended ceiling", kind: "ceilingtiles", x: 0, y: 2.6, z: 1.5, w: 4.6, d: 5.6 },
  TH, BOX,
  { id: "win", staged: "set in the back wall", kind: "blindwindow", x: 1.65, y: 1.40, z: -1.30, w: 0.60, h: 0.90, view: "snow" },
  { id: "notes", staged: "pinned to the back wall", kind: "wallnotes", x: 0, y: 0, z: -1.285 },
  ...[-1.00, 0.00, 1.00].map((x, k) => ({ id: `desk${k}`, kind: "workdesk", x, y: 0, z: 0.255 })),
  { id: "mon0", kind: "crtmonitor", x: -0.67, y: 0.50, z: 0.16, rot: 180 }, { id: "mon1", kind: "crtmonitor", x: 0.42, y: 0.50, z: 0.12, rot: 180 },
  { id: "mon2", kind: "crtmonitor", x: 1.33, y: 0.50, z: 0.16, rot: 180 },
  { id: "kb0", kind: "keyboard", x: -1.02, y: 0.50, z: 0.24 }, { id: "kb1", kind: "keyboard", x: -0.05, y: 0.50, z: 0.24 }, { id: "kb2", kind: "keyboard", x: 0.98, y: 0.50, z: 0.24 },
  { id: "stackS", kind: "paperstack", amount: 1, x: -0.31, y: 0.50, z: 0.25 }, { id: "stackC", kind: "paperstack", amount: 1, x: -1.33, y: 0.50, z: 0.22 },
  { id: "stackM1", kind: "paperstack", amount: 1, x: 0.82, y: 0.50, z: 0.36 }, { id: "stackM2", kind: "paperstack", amount: 1, x: 1.05, y: 0.50, z: 0.36 },
  { id: "tape", kind: "taperoll", x: -1.12, y: 0.50, z: 0.40, lie: true },
  { id: "cup", kind: "coffeecup", x: -0.36, y: 0.50, z: 0.45, scale: 1.4, steam: 1 },
  { id: "step", kind: "stepstool", h: 0.74, x: CHIP_WALL[0], y: 0, z: CHIP_WALL[1] },
  { id: "box", kind: "stepstool", h: 0.26, x: CHIP_DESK[0], y: 0, z: CHIP_DESK[1] },
  { id: "chair0", kind: "officechair", x: -1.05, y: 0, z: -0.88 }, { id: "chair1", kind: "officechair", x: 0.00, y: 0, z: -0.88, patch: true },
  { id: "chair2", kind: "officechair", x: 1.62, y: 0, z: -0.30, rot: -25 },
  { id: "plant", kind: "wiltplant", x: -0.47, y: 0, z: 0.70, scale: 0.5, bloom: 1 },
  // climate (DESIGN §4)
  { id: "fan", kind: "deskfan", style: "desk", x: 0.70, y: 0.50, z: 0.14, rot: -75 },
  { id: "twin", kind: "deskfan", style: "twin", x: 9, y: AWAY, z: 0.80, rot: -30 },
  { id: "heater", kind: "spaceheater", x: -0.80, y: 0, z: 0.74, rot: 40 },
  LP("warmF", -0.70, 0, 0.95, 1.8, 1.2, "#FF8A2A"), LP("warmW", -1.15, 0.95, -1.285, 1.5, 1.3, "#FFB36B", "z"),
  LP("coldF", 1.20, 0, 0.85, 1.8, 1.3, "#BFE0FF"), LP("coldW", 1.50, 1.10, -1.285, 1.3, 1.4, "#BFE0FF", "z"),
  { id: "spray", kind: "snowspray", x: 1.65, y: 0.95, z: -1.28, w: 0.60, h: 0.90, gaps: [0.20, 0.45, 0.70] },
  { id: "flakes", kind: "noterain", look: "snow", x: 1.35, y: 0, z: -0.30, n: 200, r: 0.9, top: 2.0 },
  { id: "drift1", kind: "snowdrift", x: 1.65, y: 0, z: -1.30, w: 1.0, d: 0.5 },
  { id: "drift2", kind: "snowdrift", x: 2.05, y: 0, z: 0.70, w: 1.6, d: 1.125, rot: -90 },
  { id: "ice1", kind: "iciclerow", x: 1.65, y: 0.94, z: -1.24, len: 0.60, count: 6 },
  { id: "flurry", kind: "paperflurry", x: -0.31, y: 0.50, z: 0.25 },
  { id: "lump", kind: "snowlump", r: 0.05, x: -0.36, y: 0.50 + 0.15 * 1.4, z: 0.45, scale: 0 },
  // worn (DESIGN §5)
  ...["chip", "spud", "mash", "wedge"].map((w) => ({ id: `lan-${w}`, kind: "lanyard", wear: w, x: 0, y: 0, z: 0, ...(w === "spud" && { fit: { cloth: 0.06 } }), ...(w === "wedge" && { fit: { cloth: 0.05 } }) })),
  { id: "scarf", kind: "scarf", wear: "chip", x: 0, y: AWAY, z: 0, color: "#8E2F3A", width: 0.11 },
  { id: "hat", kind: "bobblehat", wear: "chip", x: 0, y: AWAY, z: 0, color: "#8E2F3A", pom: "#8E2F3A", cuffColor: "#EFE3CC", cuffZigzag: "#8E2F3A" },
  { id: "blanketW", kind: "huddleblanket", pattern: "tartan", colors: ["#8E2F3A", "#EFE3CC"], x: CHIP_WALL[0], y: 0, z: CHIP_WALL[1], scale: 0.6, rot: Y_CHIP_WALL, over: [[0, 0, r3((Y_STEP + 0.67) / 0.6)]] },   // scaled to the little one (made for 1.3 m bodies)
  { id: "blanketD", kind: "huddleblanket", pattern: "tartan", colors: ["#8E2F3A", "#EFE3CC"], x: CHIP_DESK[0], y: 0, z: CHIP_DESK[1], scale: 0.6, rot: 15, over: [[0, 0, r3((Y_BOX + 0.67) / 0.6)]] },
  { id: "icebagW", kind: "icebag", part: "worn", wear: "mash", x: 0, y: AWAY, z: 0 },
  { id: "icebagL", kind: "icebag", part: "loose", x: 0.29, y: AWAY, z: -1.20 },
];

// hand props: folder (Mash, S02), boss mug (Wedge, S04), phone (Mash, S14), hot mug (Chip, S18); a second boss mug on Spud's desk from S27
const fwd = (p, yaw, d, side = 0) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + Math.sin(a) * d + Math.cos(a) * side), r3(p[1] + Math.cos(a) * d - Math.sin(a) * side)]; };
const PARKED = "held on screen; parked off set from the cut that leaves it";
const FOLDER_AT = (() => { const p = fwd(MASH_DESK, 0, 0.30, -0.24); return [p[0], 0.62, p[1]]; })();
const FOLDER = { id: "folder", staged: PARKED, kind: "manilafolder", ...grips.placeFor("phone", FOLDER_AT, 180), tip: -10 };
const MUGW_AT = (() => { const p = fwd(WEDGE_IN, 90, 0.47, 0.07); return [p[0], 0.38, p[1]]; })();   // in his right hand as he enters
const MUGW = { id: "mugW", staged: PARKED, kind: "teamug", scale: 2.0, color: "#F6F4EE", steam: 0, ...grips.placeFor("teamug", MUGW_AT, 90), x: 9, y: AWAY };
const PHONE_AT = (() => { const p = fwd(R1, Y_MASH_R1, 0.34, 0.12); return [p[0], 0.52, p[1]]; })();
const PHONE = { id: "mphone", staged: PARKED, kind: "phone", scale: 1.5, case: "#8FB1C5", glow: 0, x: 0, y: AWAY, z: 0 };
const HOTMUG = { id: "hotmug", kind: "teamug", scale: 1.6, color: "#9DB7A0", steam: 1, x: -0.86, y: 0.50, z: 0.40 };
const MUG2 = { id: "mug2", kind: "teamug", scale: 2.0, color: "#F6F4EE", steam: 0, x: -0.02, y: AWAY, z: 0.42 };
props.push(FOLDER, MUGW, PHONE, HOTMUG, MUG2);

// ---------------------------------------------------------------- helpers
const SUB = 250;   // captions in rows ~210-410: the bare wall above y 1.82 / the ceiling (DESIGN §1)
const CAPTEXT = { 0: "Nineteen degrees?! Who *touched it?!*", 12: "Locked. *Twenty-one.*", 18: "It's *fake.*", 21: "...Then why am I *freezing?*" };
const say = (i, at, capTo = null) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...(who === "spud" && { voice: "spud" }), ...o, dur: DUR[i], caption: false });
  for (const k of c.captions) if (k.to > T[i] && k.from < T[i]) k.to = r3(T[i] - 0.01);   // the last caption ends where this one starts
  cap(T[i], capTo ?? r3(END_OF(i) + 0.2), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.12) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(r3(t), who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", { expr: e, dur });
const place = (t, who, to, yaw, y = 0) => {
  A(r3(t - 0.029), who, "hide"); A(r3(t - 0.02), who, "show");
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const P = (t, id, set, dur = 0, ease) => c.prop(r3(t), id, set, dur, ease);
const hideProp = (t, id) => P(t, id, { y: AWAY });
const showProp = (t, id, y) => P(t, id, { y });
// a press: the fingertip onto a button (a grip point of the thermostat), the dip, the beep, the number; then back
const press = (t, who, side, btn, temp, { hold = 0.18, back = true } = {}) => {
  arm(t, who, side, { prop: "thermo", grip: btn, off: [0, 0, 0.09] }, 0.2, "out"); grip(t, who, side, "point", 0.08);
  const hit = r3(t + 0.2), k = btn === "btnUp" ? "up" : "down";
  P(hit, "thermo", { [k]: 1 }, 0.05); P(r3(hit + 0.1), "thermo", { [k]: 0 }, 0.08);
  if (temp != null) P(hit, "thermo", { temp }, 0);
  sfx(hit, "kenney/tick", { gain: 0.45 });
  if (back) { arm(r3(hit + hold), who, side, "rest", 0.3); grip(r3(hit + hold + 0.05), who, side, "relaxed"); }
  return hit;
};
// the whole room's climate (DESIGN §4): heat = heater + warm pools; cold = window + snow + cold pools
const heat = (t, on, dur = 0.3) => { for (const id of ["heater", "warmF", "warmW"]) P(t, id, { on: id === "warmW" ? on * 0.35 : on }, dur); };
const cold = (t, on, dur = 0.4) => {
  P(t, "win", { lift: on, open: on }, dur); for (const id of ["coldF", "coldW"]) P(t, id, { on: id === "coldW" ? on * 0.35 : on }, dur);
  P(t, "spray", { on }, dur); P(t, "flakes", { amount: on * 0.6 }, dur);
};
const fans = (t, on, both = false, dur = 0.4) => { P(t, "fan", { on }, dur); if (both) P(t, "twin", { on }, dur); };

// ---------------------------------------------------------------- frame 0
for (const id of ["heater", "warmF", "warmW", "coldF", "coldW", "spray", "flakes", "fan", "twin", "flurry"]) P(0, id, { on: 0, amount: 0 });
P(0, "thermo", { temp: 19 }); P(0, "tbox", { on: 0 }); P(0, "plant", { bloom: 1 });
place(0.03, "chip", CHIP_WALL, Y_CHIP_WALL, Y_STEP);
act.blinksAt(c, "spud", [3.1, 9.0, 19.5, 31.0, 47.0]); act.blinksAt(c, "mash", [4.2, 15.1, 24.6, 36.4]);
act.blinksAt(c, "wedge", [8.6, 33.0, 52.0]); act.blinksAt(c, "chip", [6.9, 20.6, 39.9]);
// Chip trembles from frame 0 (DESIGN §0 #5: no shiver lines; the body does it)
const SHIVER = (t0, t1, who = "chip") => { for (let t = t0; t < t1 - 0.1; t = r3(t + 0.1)) { A(r3(t), who, "lean", { to: 1.5, dur: 0.05 }); A(r3(t + 0.05), who, "lean", { to: -1.5, dur: 0.05 }); } A(r3(t1), who, "lean", { to: 0, dur: 0.05 }); };   // a lean jitter: squash pushed the knit hat through his crown

// ================================================================ ACT 1 (0-~14 s)
// S01: Chip on the step, finger on UP, the 19; Spud under it. "Nineteen degrees?! Who touched it?!"
arm(0.02, "chip", "L", { prop: "thermo", grip: "btnUp", off: [0, 0, 0.09] }, 0.005); grip(0, "chip", "L", "point", 0.01);
look(0, "chip", [0.2, 0.1], 0.01); look(0, "spud", [0, 0.6], 0.01); expr(0, "spud", "sad", 0.01);
let t = say(0, 0.05);
SHIVER(0.1, 2.4);
see(0, t, ["chip.face", "thermo", "spud.face"], "an office: the little one on a step at the wall thermostat (19), shouting");
// S02: Mash at his desk fans himself with a folder. "Me. It's a sauna in here."
const S02 = r3(t + 0.08);
const gFolder = grips.phone(c, "mash", FOLDER, { side: "R" });
arm(r3(S02 - 0.02), "mash", "R", { prop: "folder", grip: gFolder.hands.R.grip, palm: true }, 0.01); grip(r3(S02 - 0.02), "mash", "R", "hold", 0.01);
A(r3(S02 - 0.02), "mash", "grab", { prop: "folder", hand: "R", grip: gFolder.hands.R.grip, dur: 0, pose: null });
P(S02, "folder", { fan: 1 }, 0); expr(S02, "mash", "smug"); look(S02, "mash", [-0.5, 0.3]);
t = say(1, r3(S02 + 0.08));
look(S02 + 0.1, "chip", [0.7, -0.2]);
// S03 (cut): the close on the thermostat: Chip's yellow cuff UP 21, Mash's DOWN 19 (Mash at R1 on the cut)
const S03 = r3(t + 0.1);
A(r3(S03 - 0.03), "mash", "release", { prop: "folder", dur: 0, to: [1.10, 0.50, 0.30] }); P(r3(S03 - 0.02), "folder", { fan: 0, rot: 90, tip: -90 }, 0);
place(S03, "mash", R1, Y_MASH_R1); arm(r3(S03 - 0.02), "mash", "R", "rest", 0.01);
press(r3(S03 + 0.15), "chip", "L", "btnUp", 21, { hold: 0.25 });
press(r3(S03 + 0.75), "mash", "R", "btnDown", 19, { hold: 0.25 });
look(S03, "spud", [0, 0.8]); A(r3(S03 + 0.3), "spud", "look", { to: [-0.3, 0.8], dur: 0.12 }); A(r3(S03 + 0.9), "spud", "look", { to: [0.3, 0.8], dur: 0.12 });
see(S03, r3(S03 + 1.3), ["thermo"], "two hands fight over the thermostat's buttons: 21, 19");
// S04: the boss crosses with his mug, glance, smirk. "Hm. Carry on."
const S04 = r3(S03 + 1.35);
place(S04, "wedge", WEDGE_IN, 45);   // three-quarter to us as he crosses: his glance and smirk read

A(S04, "wedge", "move", { to: [1.00, 1.25], dur: 1.6, ease: "inOut" });
look(S04, "wedge", [-0.6, 0.4]); expr(S04, "wedge", "smug");
look(S04 + 0.2, "spud", [0.7, -0.1]); look(S04 + 0.1, "chip", [0.6, -0.4]); look(S04 + 0.1, "mash", [0.4, -0.4]);
t = say(2, r3(S04 + 0.25));
A(r3(t - 0.2), "wedge", "move", { to: [1.6, 1.25], dur: 0.5, ease: "in" });
see(S04, t, ["wedge.face", "spud.face"], "the boss walks past, sees the war, lets it run");

// round 1: each press with its line, then the device (DESIGN §4 states)
// S05: Chip on the step in a scarf: UP to 23
const S05 = r3(t + 0.08);
place(S05, "wedge", [3.2, 1.05], -90);
showProp(r3(S05 - 0.02), "scarf", 0); look(S05, "chip", [0.4, 0.3]); look(S05, "mash", [-0.5, 0.2]);
const h5 = press(r3(S05 + 0.05), "chip", "L", "btnUp", 23);
t = say(3, r3(h5 + 0.05)); SHIVER(S05, t);
// S06: Mash at his desk: the fan on, papers fly across Spud: 17 (Mash pressed DOWN on the cut-in)
const S06 = r3(t + 0.12);
place(S06, "mash", MASH_DESK, 0); P(r3(S06 - 0.02), "thermo", { temp: 17 }, 0);
arm(S06, "mash", "R", { prop: "fan", grip: "button", off: [0, 0.04, 0] }, 0.2, "out"); grip(S06, "mash", "R", "point");
fans(r3(S06 + 0.22), 1); sfx(r3(S06 + 0.22), "kenney/switch", { gain: 0.4 }); P(r3(S06 + 0.35), "flurry", { amount: 0.5 }, 0.5); P(r3(S06 + 0.35), "stackS", { amount: 0.7 }, 0.5);
t = say(4, r3(S06 + 0.25)); arm(r3(S06 + 0.6), "mash", "R", "rest", 0.3);
A(r3(S06 + 0.5), "spud", "lean", { to: -6, dur: 0.25 }); expr(S06 + 0.4, "spud", "sad"); sfx(r3(S06 + 0.45), "book-flip", { gain: 0.3 });
// S07: Chip at his desk in the bobble hat points at the heater: 25, the heater lights
const S07 = r3(t + 0.12);
place(S07, "chip", CHIP_DESK, 15, Y_BOX); showProp(r3(S07 - 0.02), "hat", 0); P(r3(S07 - 0.02), "thermo", { temp: 25 }, 0);
arm(S07, "chip", "L", { o: [0.25, 0.38, 0.45] }, 0.25, "out"); grip(S07, "chip", "L", "point"); look(S07, "chip", [0.3, -0.6]);
heat(r3(S07 + 0.3), 1, 0.4); sfx(r3(S07 + 0.3), "ai/ignite", { gain: 0.25 }); P(r3(S07 + 0.3), "plant", { bloom: 0.8 }, 1.5);
t = say(5, r3(S07 + 0.2)); arm(r3(t + 0.05), "chip", "L", "rest", 0.3); SHIVER(r3(t + 0.1), r3(t + 0.8));
// S08: Mash at the window, ice bag on his head, slats up, sash out, snow in: 15
const S08 = r3(t + 0.15);
place(S08, "mash", W, 20); showProp(r3(S08 - 0.02), "icebagW", 0); P(r3(S08 - 0.02), "thermo", { temp: 15 }, 0); P(r3(S08 - 0.02), "cup", { steam: 0 }, 0);
arm(S08, "mash", "L", { world: [1.37, 1.15, -1.20] }, 0.18, "out"); grip(S08, "mash", "L", "flat");
t = say(6, r3(S08 + 0.05));
cold(r3(S08 + 0.15), 1, 0.4); sfx(r3(S08 + 0.2), "ai/storm-wind", { gain: 0.35 });
arm(r3(S08 + 0.45), "mash", "L", "rest", 0.3); expr(S08 + 0.3, "mash", "happy");
// S09: the whole room, half orange, half blue: Spud between them types; Chip shivers at his desk, Mash back at his
const S09 = r3(Math.max(t, S08 + 0.75) + 0.12);
place(S09, "mash", MASH_DESK, 0); P(S09, "drift1", { depth: 0.12 }, 1.2); P(S09, "plant", { bloom: 0.6 }, 1.2);
expr(S09, "chip", "angry"); expr(S09, "mash", "smug"); expr(S09, "spud", "sad"); SHIVER(S09, r3(S09 + 1.1));
look(S09, "spud", [-0.6, 0.1], 0.15); look(r3(S09 + 0.45), "spud", [0.6, 0.1], 0.15);   // eyes to the heater, then the snow (typing hands went into the desk)
sfx(r3(S09 + 0.1), "ai/storm-wind", { gain: 0.25 });
see(S09, r3(S09 + 1.0), ["chip.face", "spud.face", "mash.face", "heater", "win"], "the room split: heater glowing on one side, snow on the other");
// S10 + S11 FALSE CLOSE 1: Spud, a palm to each side: "Twenty-one. Both of you. Deal?"; Chip clicks 17, 19, 21; the handshake
const S10 = r3(S09 + 1.05);
place(S10, "chip", CHIP_WALL, Y_CHIP_WALL, Y_STEP); place(S10, "mash", R1, Y_MASH_R1);
arm(S10, "spud", "both", "rest", 0.2);
arm(r3(S10 + 0.1), "spud", "R", { o: [0.42, 0.42, 0.2] }, 0.3); arm(r3(S10 + 0.1), "spud", "L", { o: [0.42, 0.42, 0.2] }, 0.3);
grip(S10 + 0.1, "spud", "both", "open"); expr(S10, "spud", "sad"); look(S10, "spud", [0, 0.1]);
t = say(7, r3(S10 + 0.12));
look(r3(S10 + 0.8), "spud", [-0.4, 0.5]); look(r3(S10 + 1.6), "spud", [0.4, 0.5]); look(r3(S10 + 2.3), "spud", [0, 0.1]);
let h = press(r3(t - 0.9), "chip", "L", "btnUp", 17, { back: false }); h = press(r3(h + 0.12), "chip", "L", "btnUp", 19, { back: false }); h = press(r3(h + 0.12), "chip", "L", "btnUp", 21, { hold: 0.12 });
arm(r3(t + 0.05), "spud", "both", "rest", 0.3);
const S11 = r3(Math.max(t, h + 0.3) + 0.1);
const SHAKE = [0, 1.05, -0.92];
arm(S11, "chip", "L", { world: [-0.03, SHAKE[1], SHAKE[2]] }, 0.3, "out"); arm(S11, "mash", "R", { world: [0.03, SHAKE[1], SHAKE[2]] }, 0.3, "out");
grip(S11, "chip", "L", "flat"); grip(S11, "mash", "R", "flat");
A(S11, "spud", "lean", { to: 8, dur: 0.25 }); A(S11, "spud", "squash", { amount: 0.08, dur: 0.25 }); look(S11, "spud", [0, 0.9]);
for (let k = 0; k < 2; k++) for (const [w, x] of [["chip", -0.03], ["mash", 0.03]]) {
  arm(r3(S11 + 0.35 + k * 0.2), w, w === "chip" ? "L" : "R", { world: [x, SHAKE[1] - 0.03, SHAKE[2]] }, 0.1);
  arm(r3(S11 + 0.45 + k * 0.2), w, w === "chip" ? "L" : "R", { world: [x, SHAKE[1], SHAKE[2]] }, 0.1);
}
expr(S11, "chip", "annoyed"); expr(S11, "mash", "annoyed");
t = say(8, r3(S11 + 0.3)); t = say(9, r3(t + 0.1));
see(S11, t, ["chip.face", "mash.face", "spud.face", "thermo"], "they shake on 21 over Spud's head");

// ================================================================ ACT 2 (~19-34 s)
// S12: the deal undoes the room: fans run down, the glow dies, the window shuts, the papers land (three at their desks)
const S12 = r3(t + 0.12);
place(S12, "chip", CHIP_DESK, 0, Y_BOX); place(S12, "mash", MASH_DESK, 0);
for (const w of ["chip", "mash", "spud"]) { arm(r3(S12 - 0.02), w, "both", "rest", 0.01); grip(r3(S12 - 0.02), w, "both", "relaxed", 0.01); }
A(S12, "spud", "lean", { to: 0, dur: 0.2 }); A(S12, "spud", "squash", { amount: 0, dur: 0.2 });
fans(r3(S12 + 0.1), 0, false, 0.8); heat(r3(S12 + 0.1), 0, 0.8); cold(r3(S12 + 0.2), 0, 0.6);
P(r3(S12 + 0.2), "flurry", { amount: 0 }, 0.6); P(r3(S12 + 0.1), "drift1", { depth: 0 }, 0.8); P(r3(S12 + 0.1), "plant", { bloom: 1 }, 0.8);
hideProp(r3(S12 - 0.02), "scarf"); hideProp(r3(S12 - 0.02), "hat"); hideProp(r3(S12 - 0.02), "icebagW");
expr(S12, "spud", "happy");
look(S12 + 0.2, "chip", [0.6, 0]); look(S12 + 0.2, "mash", [-0.6, 0]);
sfx(r3(S12 + 0.2), "kenney/switch", { gain: 0.3 }); sfx(r3(S12 + 0.45), "door-close", { gain: 0.2 });
// S13: Chip on the step, eyes on the ceiling, his hand creeps: 22
const S13 = r3(S12 + 1.15);
place(S13, "chip", CHIP_WALL, Y_CHIP_WALL, Y_STEP); look(S13, "chip", [0.1, 0.9]); expr(S13, "chip", "smug");
arm(S13, "chip", "L", { prop: "thermo", grip: "btnUp", off: [0, -0.08, 0.10] }, 0.5);
press(r3(S13 + 0.55), "chip", "L", "btnUp", 22, { hold: 0.2 });
// S14: Mash at R1, eyes on his phone, finger: 20
const S14 = r3(S13 + 1.15);
place(S14, "mash", R1, Y_MASH_R1);
const gPhone = grips.phone(c, "mash", { ...PHONE, ...grips.placeFor("phone", PHONE_AT, 180 + Y_MASH_R1), tip: -35 }, { side: "L" });
P(r3(S14 - 0.03), "mphone", { ...grips.placeFor("phone", PHONE_AT, 180 + Y_MASH_R1), tip: -35, glow: 0.6 }, 0);
c.arm(r3(S14 - 0.02), "mash", "L", { prop: "mphone", grip: gPhone.hands.L.grip, palm: true }, 0); grip(r3(S14 - 0.02), "mash", "L", "hold", 0.01);
A(r3(S14 - 0.02), "mash", "grab", { prop: "mphone", hand: "L", grip: gPhone.hands.L.grip, dur: 0, pose: null });
look(S14, "mash", [0.2, -0.5]); expr(S14, "mash", "smug");
press(r3(S14 + 0.35), "mash", "R", "btnDown", 20, { hold: 0.2 });
// S15: the close: two fingers, a beep every 0.3 s; Spud's leaf flicks to each
const S15 = r3(S14 + 1.2);
arm(r3(S15 - 0.04), "mash", "L", "rest", 0.01); A(r3(S15 - 0.03), "mash", "release", { prop: "mphone", dur: 0, to: [9, AWAY, 0] });
place(S15, "chip", CHIP_WALL, Y_CHIP_WALL, Y_STEP);
[[23, "chip"], [19, "mash"], [24, "chip"], [18, "mash"]].forEach(([n, w], k) => press(r3(S15 + 0.05 + k * 0.3), w, w === "chip" ? "L" : "R", w === "chip" ? "btnUp" : "btnDown", n, { hold: 0.08 }));
expr(S15, "chip", "angry"); expr(S15, "mash", "angry"); look(S15, "chip", [0.6, 0.2]); look(S15, "mash", [-0.6, 0.2]);
// S16: Chip sets 26, two tape slaps over DOWN; Mash jabs the X twice: nothing
const S16 = r3(S15 + 1.4);
press(S16, "chip", "L", "btnUp", 26, { back: false, hold: 0.1 });
arm(r3(S16 + 0.3), "chip", "L", { prop: "thermo", grip: "btnDown", off: [0, 0, 0.03] }, 0.15, "out"); grip(r3(S16 + 0.3), "chip", "L", "flat");
P(r3(S16 + 0.45), "thermo", { tape: 0.5 }, 0.05); sfx(r3(S16 + 0.45), "kenney/cloth", { gain: 0.4 });
arm(r3(S16 + 0.52), "chip", "L", { prop: "thermo", grip: "btnDown", off: [0, 0, 0.09] }, 0.08);
arm(r3(S16 + 0.6), "chip", "L", { prop: "thermo", grip: "btnDown", off: [0, 0, 0.03] }, 0.08); P(r3(S16 + 0.68), "thermo", { tape: 1 }, 0.05); sfx(r3(S16 + 0.68), "kenney/cloth", { gain: 0.4 });
arm(r3(S16 + 0.85), "chip", "L", "rest", 0.3); expr(r3(S16 + 0.85), "chip", "smug");
for (let k = 0; k < 2; k++) { arm(r3(S16 + 1.05 + k * 0.3), "mash", "R", { prop: "thermo", grip: "btnDown", off: [0, 0, 0.05] }, 0.12, "out"); grip(r3(S16 + 1.05), "mash", "R", "point"); arm(r3(S16 + 1.2 + k * 0.3), "mash", "R", { prop: "thermo", grip: "btnDown", off: [0.02, -0.04, 0.14] }, 0.12); sfx(r3(S16 + 1.17 + k * 0.3), "kenney/impact-soft-medium", { gain: 0.25 }); }
expr(r3(S16 + 1.2), "mash", "annoyed"); arm(r3(S16 + 1.75), "mash", "R", "rest", 0.25);
// S17: Mash holds the ice bag on it: the number runs down to 12
const S17 = r3(S16 + 2.0);
hideProp(r3(S17 - 0.02), "icebagW"); showProp(r3(S17 - 0.02), "icebagL", r3(OY - 0.02));
arm(r3(S17 - 0.02), "mash", "R", { prop: "thermo", grip: "coverRight", off: [0.06, 0, 0.05] }, 0.01); grip(r3(S17 - 0.02), "mash", "R", "flat", 0.01);
P(r3(S17 + 0.2), "thermo", { temp: 12 }, 1.2, "linear"); expr(S17, "mash", "smug"); expr(r3(S17 + 0.6), "chip", "shocked"); look(S17, "chip", [0.6, 0.3]);
sfx(r3(S17 + 0.05), "ai/crunch", { gain: 0.2 });
// S18: Chip's hot mug on the other side: "Thirty!" / "Twelve!": the number flickers 30/12
const S18 = r3(S17 + 1.55);
const gHot = grips.mug(c, "chip", HOTMUG, { side: "L" });
const HOT_AT = [-0.31, 1.03, -1.10];
P(r3(S18 - 0.03), "hotmug", { ...grips.placeFor("teamug", HOT_AT, Y_CHIP_WALL) }, 0); gHot.take(r3(S18 - 0.02), { reach: 0.003, settle: 0.003 });
P(S18, "thermo", { temp: 30 }, 0.25, "linear");
t = say(10, r3(S18 + 0.1)); t = say(11, r3(t + 0.12));
for (let k = 0; k < 6; k++) P(r3(t + k * 0.125), "thermo", { temp: k % 2 ? 12 : 30 }, 0);
P(r3(S18 + 0.2), "thermo", { shake: 0.3 }, 0.1); expr(S18, "chip", "angry"); expr(r3(S18 + 0.5), "mash", "angry");
see(S17, r3(t + 0.6), ["thermo", "chip.face", "mash.face"], "ice bag on one side, hot mug on the other: the number flips 30/12");
// S19 PEAK: wide, everything back on in one cascade: fans (Mash's finger), heater (Chip points), blanket, window; snow and paper build
const S19 = r3(t + 0.8);
place(S19, "chip", CHIP_DESK, 15, Y_BOX); place(S19, "mash", MASH_DESK, 0);
A(r3(S19 - 0.03), "chip", "release", { prop: "hotmug", dur: 0, to: [-0.86, 0.50, 0.40] }); arm(r3(S19 - 0.02), "chip", "L", "rest", 0.01); arm(r3(S19 - 0.02), "mash", "R", "rest", 0.01);
hideProp(r3(S19 - 0.02), "icebagL"); showProp(r3(S19 - 0.02), "icebagW", 0); showProp(r3(S19 - 0.02), "scarf", 0); showProp(r3(S19 - 0.02), "hat", 0);
P(r3(S19 - 0.02), "thermo", { temp: 30, shake: 0 }, 0); for (let k = 0; k < 14; k++) P(r3(S19 + 0.1 + k * 0.15), "thermo", { temp: k % 2 ? 30 : 12 }, 0);
P(r3(S19 - 0.02), "twin", { x: 1.00, y: 0 });
arm(S19, "mash", "R", { prop: "fan", grip: "button", off: [0, 0.04, 0] }, 0.15, "out"); grip(S19, "mash", "R", "point"); fans(r3(S19 + 0.15), 1, true, 0.3); sfx(r3(S19 + 0.15), "kenney/switch", { gain: 0.4 });
arm(r3(S19 + 0.25), "chip", "L", { o: [0.25, 0.38, 0.45] }, 0.15, "out"); grip(r3(S19 + 0.25), "chip", "L", "point"); heat(r3(S19 + 0.35), 1, 0.25); sfx(r3(S19 + 0.35), "ai/ignite", { gain: 0.3 });
P(r3(S19 + 0.55), "blanketD", { cover: 1 }, 0.3); sfx(r3(S19 + 0.55), "cloth", { gain: 0.4 });
arm(r3(S19 + 0.45), "mash", "R", "rest", 0.2); A(r3(S19 + 0.5), "mash", "move", { to: [1.32, -0.62], dur: 0.35 });
arm(r3(S19 + 0.75), "mash", "L", { world: [1.37, 1.15, -1.20] }, 0.15, "out"); grip(r3(S19 + 0.75), "mash", "L", "flat");
cold(r3(S19 + 0.85), 1, 0.3); sfx(r3(S19 + 0.9), "ai/storm-wind", { gain: 0.5 });
P(r3(S19 + 0.9), "spray", { on: 1 }, 0.3); P(r3(S19 + 0.9), "flakes", { amount: 1 }, 0.5);
P(r3(S19 + 0.4), "flurry", { amount: 1 }, 0.6); P(r3(S19 + 0.4), "stackS", { amount: 0.3 }, 0.6); sfx(r3(S19 + 0.5), "book-flip", { gain: 0.4 });
P(r3(S19 + 0.9), "drift1", { depth: 0.35 }, 1.4); P(r3(S19 + 1.0), "drift2", { depth: 0.35 }, 1.3);
arm(r3(S19 + 1.1), "chip", "L", "rest", 0.3); arm(r3(S19 + 1.1), "mash", "L", "rest", 0.3); SHIVER(r3(S19 + 0.6), r3(S19 + 2.3));
expr(S19, "spud", "shocked"); A(r3(S19 + 0.3), "spud", "squash", { amount: 0.06, dur: 0.2 });
see(S19, r3(S19 + 2.2), ["chip.face", "spud.face", "mash.face", "heater", "win", "twin"], "the peak: fans, heater, blanket, open window, snow and paper everywhere");
// S20: the plant folds in the orange; Spud's gloves type; his cup ices over
const S20 = r3(S19 + 2.3);
place(S20, "mash", MASH_DESK, 0);
P(S20, "plant", { bloom: 0 }, 1.0); P(r3(S20 + 0.6), "lump", { scale: 1 }, 0.4, "out"); P(r3(S20 + 0.6), "ice1", { grow: 1 }, 0.6);
look(r3(S20 + 0.5), "spud", [0.1, -0.6], 0.2); expr(r3(S20 + 0.9), "spud", "sad");   // he looks down at his frozen coffee
sfx(r3(S20 + 0.7), "ai/crunch", { gain: 0.3 });
// S21 FALSE CLOSE 2: the boss's clear box drops over it, the key turns, out: "Locked. Twenty-one."
const S21 = r3(S20 + 1.6);
place(S21, "wedge", R1, -30); arm(r3(S21 - 0.02), "spud", "both", "rest", 0.01); place(S21, "mash", R2, -20);   // Mash by his window: the wall lane at his desk is too narrow for the boss
P(r3(S21 - 0.02), "thermo", { temp: 21 }, 0);
arm(S21, "wedge", "R", { prop: "tbox", grip: "railR", off: [0, -0.04, 0.02] }, 0.2); grip(S21, "wedge", "R", "flat");
P(r3(S21 + 0.1), "tbox", { on: 1 }, 0.35, "out"); sfx(r3(S21 + 0.45), "latch-click", { gain: 0.5 });
arm(r3(S21 + 0.6), "wedge", "R", { prop: "tbox", grip: "barrel", off: [0, 0, 0.03] }, 0.15); grip(r3(S21 + 0.6), "wedge", "R", "pinch");
P(r3(S21 + 0.75), "tbox", { key: 1 }, 0.4); sfx(r3(S21 + 0.8), "key", { gain: 0.5 });
expr(S21, "wedge", "stern"); look(S21, "wedge", [0, 0.2]);
t = say(12, r3(S21 + 0.4));
arm(r3(S21 + 1.2), "wedge", "R", "rest", 0.3);
see(S21, t, ["thermo", "tbox", "wedge.face"], "the boss locks it in a clear box at 21");
// S22: Wedge pats his pocket and leaves right along the wall
const S22 = r3(t + 0.1);
arm(S22, "wedge", "L", { o: [0.18, 0.28, 0.30] }, 0.2); grip(S22, "wedge", "L", "flat"); arm(r3(S22 + 0.3), "wedge", "L", { o: [0.18, 0.34, 0.34] }, 0.1); arm(r3(S22 + 0.4), "wedge", "L", "rest", 0.2);
expr(r3(S22 + 0.45), "wedge", "smug"); look(r3(S22 + 0.45), "wedge", [0.6, 0.1]);   // he pats the key pocket, smug; the cut takes him away
look(S22, "chip", [0.5, 0.4]); look(S22, "mash", [-0.3, 0.4]); expr(S22, "chip", "sad"); expr(S22, "mash", "sad");
// S23: sulking at their desks; their eyes meet across Spud; "It's still freezing." / "It's still boiling."
const S23 = r3(S22 + 1.2);
place(S23, "wedge", [3.2, 1.05], -90); place(S23, "mash", MASH_DESK, 0); hideProp(r3(S23 - 0.02), "icebagW");
arm(S23, "chip", "both", "hips", 0.3); arm(S23, "mash", "both", "hips", 0.3);   // sulking: hands on hips (no crossed-arms pose in the rig)
look(S23, "chip", [0.3, -0.3]); look(S23, "mash", [-0.3, -0.3]);
t = say(13, r3(S23 + 0.15)); SHIVER(S23, t);
t = say(14, r3(t + 0.1));
look(r3(t - 0.6), "chip", [0.8, 0.05]); look(r3(t - 0.6), "mash", [-0.8, 0.05]); expr(r3(t - 0.5), "chip", "angry"); expr(r3(t - 0.5), "mash", "angry");
look(r3(t - 0.5), "spud", [-0.6, 0.2], 0.1); look(r3(t - 0.25), "spud", [0.6, 0.2], 0.1); look(r3(t), "spud", [0, 0.8], 0.15);
see(S23, t, ["chip.face", "spud.face", "mash.face"], "locked at 21, and they still feel it: they glare across Spud");

// ================================================================ ACT 3 (~40-52 s)
// S24: the tug of war: four palms on the box; Spud's palms at the sides of his head
const S24 = r3(t + 0.15);
place(S24, "chip", CHIP_WALL, 90, Y_STEP); place(S24, "mash", R1, -90);   // side-on: a tug of war
arm(r3(S24 - 0.02), "chip", "both", { prop: "tbox", grip: "sideL", off: [-0.03, 0, 0.04] }, 0.01); arm(r3(S24 - 0.02), "mash", "both", { prop: "tbox", grip: "sideR", off: [0.03, 0, 0.04] }, 0.01);
grip(r3(S24 - 0.02), "chip", "both", "flat", 0.01); grip(r3(S24 - 0.02), "mash", "both", "flat", 0.01);
arm(S24, "spud", "R", { o: [0.36, 0.62, 0.05] }, 0.2); arm(S24, "spud", "L", { o: [0.36, 0.62, 0.05] }, 0.2); grip(S24, "spud", "both", "flat"); A(S24, "spud", "face", { lid: 1, dur: 0.15 });
for (let k = 0; k < 10; k++) { const s = k % 2 ? 1 : -1; P(r3(S24 + k * 0.28), "tbox", { tug: s }, 0.25); for (const [w, g] of [["chip", "sideL"], ["mash", "sideR"]]) arm(r3(S24 + k * 0.28), w, "both", { prop: "tbox", grip: g, off: [r3(0.035 * s + (w === "chip" ? -0.03 : 0.03)), 0, 0.04] }, 0.25);  P(r3(S24 + k * 0.28), "thermo", { shake: 0.6 }, 0.1); A(r3(S24 + k * 0.28), s < 0 ? "chip" : "mash", "lean", { to: -6, dur: 0.2 }); A(r3(S24 + 0.14 + k * 0.28), s < 0 ? "chip" : "mash", "lean", { to: 0, dur: 0.14 }); }
expr(S24, "chip", "angry"); expr(S24, "mash", "angry"); sfx(S24, "kenney/impact-plate-light", { gain: 0.3 });
t = say(15, r3(S24 + 0.2)); t = say(16, r3(t + 0.12));
see(S24, t, ["chip.face", "mash.face", "tbox", "spud.face"], "tug of war on the locked box");
// S25: the screws walk out of the plaster; the number flips
const S25 = r3(Math.max(t + 0.15, S24 + 2.85));
const FLIP = [27, 14, 29, 13, 25, 16, 30, 12, 28, 15, 26, 18, 24, 21];
FLIP.forEach((n, k) => P(r3(S25 + k * 0.133), "thermo", { temp: n }, 0));
P(S25, "tbox", { rip: 0.6 }, 1.2, "linear"); for (let k = 0; k < 4; k++) { const s = k % 2 ? 1 : -1; P(r3(S25 + k * 0.3), "tbox", { tug: s }, 0.25); for (const [w, g] of [["chip", "sideL"], ["mash", "sideR"]]) arm(r3(S25 + k * 0.3), w, "both", { prop: "tbox", grip: g, off: [r3(0.035 * s + (w === "chip" ? -0.03 : 0.03)), 0, 0.04] }, 0.25); }
sfx(S25, "ai/canvas-rip", { gain: 0.2 });
// S26: the box tears free and drops; Chip rocks back, Mash staggers out right to R2; "Enough." off screen
const S26 = r3(S25 + 1.2), RIP = r3(S26 + 0.3);
BOX.dropAt = r3(RIP + 0.15);
P(RIP, "tbox", { rip: 1 }, 0.15); P(r3(RIP + 0.1), "thermo", { temp: 21, shake: 0 }, 0); sfx(r3(RIP + 0.05), "kenney/impact-plate-heavy", { gain: 0.45 });
for (const w of ["chip", "mash"]) { arm(RIP, w, "both", "rest", 0.25); grip(RIP, w, "both", "relaxed"); }
A(RIP, "chip", "lean", { to: -5, dur: 0.15 }); turn(RIP, "chip", Y_CHIP_WALL, 0.2); A(r3(RIP + 0.3), "chip", "lean", { to: 0, dur: 0.3 });
A(RIP, "mash", "move", { to: R2, dur: 0.5, ease: "out" }); expr(RIP, "chip", "shocked"); expr(RIP, "mash", "shocked");
A(r3(RIP + 0.1), "spud", "face", { lid: 0, dur: 0.1 }); arm(r3(RIP + 0.1), "spud", "both", "rest", 0.3); expr(r3(RIP + 0.1), "spud", "shocked");
t = say(17, r3(RIP + 0.8));
look(r3(t - 0.3), "chip", [0.7, 0]); look(r3(t - 0.3), "spud", [0.6, 0.3]);
// S27 REVEAL: Wedge at R1b, one fingertip: the cover swings off; mug on Spud's desk. "It's fake."
const S27 = r3(t + 0.15);
P(S27, "spray", { on: 0.2 }, 0.3); P(S27, "flakes", { amount: 0.25 }, 0.3);   // the jets thin out: snow keeps falling, faces stay clear
place(S27, "wedge", R1B, -30); turn(r3(S27 - 0.02), "chip", Y_CHIP_WALL, 0.01); place(S27, "mash", R2, -15); showProp(r3(S27 - 0.02), "mug2", 0.50);
arm(S27, "wedge", "R", { prop: "thermo", grip: "coverClip", off: [0.02, -0.03, 0.04] }, 0.2, "out"); grip(S27, "wedge", "R", "point");
const POP = r3(S27 + 0.25);
P(POP, "thermo", { pop: 1 }, 0.35, "out"); sfx(POP, "latch-click", { gain: 0.5 }); arm(r3(POP + 0.05), "wedge", "R", { prop: "thermo", grip: "coverLow", off: [0, -0.04, 0.02] }, 0.3);
expr(S27, "wedge", "deadpan"); look(S27, "wedge", [0.1, 0.2]);
for (const w of ["chip", "mash", "spud"]) look(r3(POP + 0.2), w, w === "chip" ? [0.6, 0.4] : w === "mash" ? [-0.7, 0.4] : [0.2, 0.9]);
t = say(18, r3(POP + 0.45));
see(S27, t, ["thermo", "wedge.face", "chip.face", "spud.face"], "the boss pops the cover off: an empty shell, no wires: it's fake");
// S28: the bare plate, the hanging cover, Chip's face beside it
const S28 = r3(t + 0.12);
expr(S28, "chip", "shocked"); A(r3(S28 + 0.2), "chip", "face", { lid: 0.3, dur: 0.2 });
// S29: Mash at R2 in the snow: "...Since when?"
const S29 = r3(S28 + 1.0);
expr(S29, "mash", "sad"); look(S29, "mash", [-0.6, 0.3]);
t = say(19, r3(S29 + 0.1));
// S29b: Wedge, dry: "Since always."
const S29B = r3(t + 0.12);
look(S29B, "wedge", [-0.3, 0]); expr(S29B, "wedge", "smug");
t = say(20, r3(S29B + 0.1));
// S30 ONE BEAT PAST: Chip in hat, scarf and blanket: "...Then why am I freezing?"
const S30 = r3(t + 0.12);
P(r3(S30 - 0.02), "flurry", { amount: 0 }, 0); 
P(r3(S30 - 0.02), "blanketD", { cover: 0 }, 0); P(r3(S30 - 0.02), "blanketW", { cover: 1 }, 0);
expr(S30, "chip", "sad"); look(S30, "chip", [0.6, 0.3]); SHIVER(S30, r3(S30 + 2.0));
t = say(21, r3(S30 + 0.1), r3(S30 + 3.6));
// S31: the boss tips his sunglasses at the window; Mash, in the snow stream, looks away
const S31 = r3(t + 0.12);
look(S31, "wedge", [0.8, 0.1], 0.25); arm(r3(S31 + 0.1), "wedge", "L", { o: [0.25, 0.85, 0.25] }, 0.3); grip(r3(S31 + 0.1), "wedge", "L", "point");
look(r3(S31 + 0.5), "mash", [0.8, -0.3], 0.25); expr(r3(S31 + 0.5), "mash", "sad");
arm(r3(S31 + 1.1), "wedge", "L", "rest", 0.3);
// S32: Chip and Spud turned to screen-right, the bare plate above Spud; hold 1.5 s after the last line
const S32 = r3(S31 + 1.4);
for (const w of ["chip", "spud"]) { look(S32, w, [0.9, 0.2]); expr(S32, w, "deadpan"); }
const END = F(S32 + 1.6);
P(0, "flakes", { clock: 0 }); P(0.001, "flakes", { clock: END }, END, "linear");   // noterain snow is driven by its clock, not story time
see(S30, END, ["chip.face"], "the cold one asks why he is freezing; the boss nods at the window the hot one opened");

// ---------------------------------------------------------------- cameras (DESIGN §7; every shot moves)
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const cam = (pos, look, fov) => ({ pos, look, fov });
const beats = c.beats([
  ["who touched it", 0, push(cam([-0.35, 1.45, 3.85], [-0.25, 1.10, -1.30], 30), 0.06, S02), "hook"],
  ["sauna", S02, drift(cam([1.55, 1.25, 3.30], [1.00, 0.85, -0.36], 32), -0.10, S03 - S02)],
  ["the buttons", S03, push(cam([0.00, 1.38, 0.55], [0.00, 1.36, -1.30], 30), 0.08, S04 - S03)],
  ["carry on", S04, drift(cam([0.30, 1.25, 4.40], [0.60, 0.85, 0.00], 38), 0.12, S05 - S04)],
  ["23 scarf", S05, push(cam([-1.90, 1.25, 3.40], [-0.40, 1.10, -1.00], 34), 0.05, S06 - S05), "escalation"],
  ["17 fan", S06, drift(cam([1.75, 1.25, 3.60], [0.45, 0.98, -0.90], 36), -0.12, S07 - S06)],
  ["25 heater", S07, push(cam([-1.55, 1.55, 3.60], [-0.62, 0.72, -0.50], 38), 0.06, S08 - S07)],
  ["15 window", S08, drift(cam([2.20, 1.40, 3.10], [0.78, 1.18, -1.20], 42), -0.15, S09 - S08)],
  ["split room", S09, push(cam([0.17, 1.75, 8.60], [0.17, 0.95, 0.00], 34), 0.04, S10 - S09)],
  ["deal?", S10, push(cam([0.00, 0.95, 3.20], [0.00, 0.95, -0.50], 32), 0.08, S11 - S10)],
  ["handshake", S11, push(cam([0.00, 1.55, 2.60], [0.00, 1.12, -0.95], 34), 0.06, S12 - S11)],
  ["quiet", S12, drift(cam([-1.90, 1.70, 6.60], [0.00, 0.85, -0.30], 32), 0.15, S13 - S12)],
  ["sneak 22", S13, drift(cam([-1.45, 1.35, 2.90], [-0.30, 1.15, -1.00], 34), 0.10, S14 - S13)],
  ["sneak 20", S14, drift(cam([1.50, 1.40, 2.90], [0.32, 1.12, -1.00], 34), -0.10, S15 - S14)],
  ["beeps", S15, push(cam([0.00, 1.50, 0.90], [0.00, 1.33, -1.30], 34), 0.10, S16 - S15)],
  ["tape", S16, push(cam([-0.75, 1.45, 1.60], [-0.05, 1.30, -1.25], 36), 0.06, S17 - S16)],
  ["ice", S17, push(cam([0.80, 1.45, 1.70], [0.08, 1.30, -1.25], 36), 0.06, S18 - S17)],
  ["30/12", S18, push(cam([0.00, 1.40, 2.90], [0.00, 1.22, -1.00], 36), 0.10, S19 - S18)],
  ["peak", S19, drift(cam([-0.25, 1.55, 8.40], [0.15, 0.95, 0.00], 35), 0.20, S20 - S19)],
  ["frozen cup", S20, { pos: [-0.75, 0.75, 2.40], look: [-0.45, 0.40, 0.60], fov: 30, to: { pos: [0.35, 0.80, 2.40], look: [0.12, 0.62, 0.35], fov: 30 }, dur: S21 - S20, ease: "inOut" }],
  ["locked", S21, push(cam([-0.40, 1.70, 2.00], [0.30, 1.10, -1.10], 40), 0.10, S22 - S21)],
  ["pocket", S22, drift(cam([-0.70, 2.20, 3.20], [0.45, 0.95, -0.90], 36), 0.12, S23 - S22)],
  ["still freezing", S23, push(cam([0.00, 1.40, 7.40], [0.00, 0.75, 0.00], 38), 0.10, S24 - S23)],
  ["let go", S24, push(cam([0.00, 1.35, 3.00], [0.00, 1.15, -1.00], 38), 0.08, S25 - S24)],
  ["screws", S25, push(cam([-0.35, 1.25, 0.60], [0.02, 1.38, -1.28], 36), 0.06, S26 - S25)],
  ["rip", S26, push(cam([0.00, 1.50, 3.60], [0.00, 1.05, -0.80], 38), 0.05, S27 - S26)],
  ["it's fake", S27, push(cam([0.85, 2.00, 3.40], [0.25, 1.05, -1.00], 46), 0.06, S28 - S27), "payoff"],
  ["bare plate", S28, push(cam([-0.45, 1.40, 1.60], [-0.12, 1.30, -1.25], 44), 0.14, 0.5)],
  ["since when", S29, push(cam([2.55, 1.65, 2.60], [1.78, 0.95, -0.90], 34), 0.12, 0.8)],   // over the monitor: his eyes clear
  ["since always", S29B, push(cam([0.60, 1.75, 2.20], [0.86, 1.00, -0.95], 36), 0.08, S30 - S29B)],
  ["why am I freezing", S30, drift(cam([-0.95, 1.30, 1.30], [-0.56, 1.14, -0.98], 34), 0.08, S31 - S30)],
  ["the window", S31, push(cam([2.20, 1.40, 2.40], [1.20, 1.00, -1.00], 40), 0.06, S32 - S31)],
  ["end", S32, push(cam([-1.30, 1.20, 2.20], [-0.15, 0.95, -0.60], 42), 0.06, END - S32)],
], END);

write(import.meta.url, {
  id: "thermostat",
  title: "Who touched the thermostat?!",
  idea: "Potato Desk 11: the office thermostat war. One freezes, one boils, they click it back and forth, pile on scarves, fans, a heater and an open window, the boss locks it and they tear the box off, then the boss pops the cover: it's a fake, never wired.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#b7c4b8", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15, until: r3(S27 - 0.3), then: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", from: 0, gain: 0.14 } },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor", scenes: ["ui"] },   // ui: the thermostat panel beeps on every press
  creative: { length: [50, 66] },
  hook: { show: ["chip", "thermo", "spud"], hint: 0, what: "an office: a little one on a step at the wall thermostat (19) shouts who touched it" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "chip", with: "blanketD", from: 0, to: END, checks: ["clipping", "costume-in-prop", "shell", "hand-in-prop", "arm-in-prop"], reason: "a blanket wrapped round him: worn cloth over his body and arms" },
    { who: "chip", with: "blanketW", from: 0, to: END, checks: ["clipping", "costume-in-prop", "shell", "hand-in-prop", "arm-in-prop"], reason: "a blanket wrapped round him: worn cloth over his body" },
  ],
  notes: "Generated by storyboards/series/potato-desk/11-thermostat/make-thermostat.mjs.",
});
