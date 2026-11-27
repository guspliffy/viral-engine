// KID VS DAD 08 "Dad's jokes come true" (Jonny 27 Nov 2026 21:55 Berlin: every starred option; panel sheet v1 OK 22:17 Berlin).
//   node storyboards/series/kid-vs-dad/08-dad-jokes-true/make-dad-jokes-true.mjs -> dad-jokes-true.json
// Options: /mnt/project-files/videos/kid-vs-dad/08-dad-jokes-ranked/OPTIONS.md (C1 fridge ladder, jokes 1-5, H1, E1).
// Panels: sheets/kid-vs-dad-08-panels-v1.png there. Design: ./DESIGN.md (sections 0-13). Lines: ./lines.mjs.
// Chain: POWER WORDS hook "greatest ... nothing beats them" + "his jokes come TRUE" -> joke 1 the hot corner -> 2 Tato's shoes on
// Dad -> 3 the beard carpet -> 4 Tato a sandwich -> 5 the moon, everything floats -> the crash -> Tato: "You're toast." POOF -> Tato's
// photo of toast Dad under the gold magnet: "Top spot." CUT.
// Natural counter: instant photos. Each new one goes under the gold magnet (top spot), Tato moves it to the bottom row (b1..b4,
// filling right to left); the gold magnet is empty again after each move, until the toast. No rank text anywhere.
// Jokes reset on cuts (the sheet): beard, sneakers, bread are gone in the next shot.
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const SPOKEN = (() => { try { return JSON.parse(fs.readFileSync(new URL("./spoken.json", import.meta.url))); } catch { return {}; } })();
const est = (l) => r3(0.45 + l.split(/\s+/).length * 0.34);
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);   // c.beats snaps a shot DOWN to its frame
const DUR = LINES.map(([, l], i) => (Array.isArray(SPOKEN) ? SPOKEN[i] : null) ?? est(l));
const HIDE = -9;

// ---------------------------------------------------------------- places (K = kitchenroom origin; back wall z -2.30, +z to the lens)
const DAD_M = [0.25, -0.60], DAD_M_YAW = 10;          // master marks (DESIGN 1)
const KID_M = [0.95, -0.95], KID_M_YAW = -15;
const DAD_TOP = [0.80, -1.02], DAD_TOP_YAW = 60;      // side on, LEFT palm on the top photo
const KID_CORNER = [-5.00, -1.82], KID_CORNER_YAW = 20;
const DAD_BEARD = [0.0, -0.85], DAD_BEARD_YAW = 55, KID_BEARD = [1.80, 0.41];
const DAD_SNEAK = [0.25, -0.55], KID_SNEAK = [1.45, -0.95];
const STEP = [1.10, -1.22];
const DOOR_Z = -1.4965;                               // a photo's centre on the door
const TOPP = { x: 1.35, y: 1.2325, z: DOOR_Z, roll: -2 };
const SLOT = { b1: [1.586, 4], b2: [1.429, -3], b3: [1.272, 2], b4: [1.115, -5] };
const slot = (b) => ({ x: SLOT[b][0], y: 0.62, z: DOOR_Z, roll: SLOT[b][1] });
const kidAt = (b) => [r3(SLOT[b][0] - 0.45), -1.08];  // Tato's row mark; rot 35 = his LEFT side to the door (T2 bench)

const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: KID_M, face: KID_M_YAW, expr: "kind", follow: 0, seed: 4.1 },
  { id: "dad", character: "potatobrawl/dad", at: DAD_M, face: DAD_M_YAW, expr: "happy", follow: 0, seed: 2.9 },
  { id: "dadS", character: "potatobrawl/dad-sneakers", at: [9, 6], face: 0, follow: 0, seed: 2.9 },   // joke 2 only, swapped on cuts
  { id: "dadT", character: "potatobrawl/dad-toast", at: [12, 6], face: 0, follow: 0, seed: 2.9 },     // the ending only
];
const PICS = ["corner", "sneakers", "beard", "sandwich", "moon", "toast"];
const photos = PICS.map((pic, i) => ({ id: `ph${i + 1}`, kind: "jokephoto", pic, x: TOPP.x, y: HIDE, z: DOOR_Z, rot: 0, roll: TOPP.roll }));
const CAMD = { id: "camD", kind: "instacam", ...grips.placeFor("instacam", [DAD_M[0], HIDE, DAD_M[1]], DAD_M_YAW), eject: 0, flash: 0 };
const CAMT = { id: "camT", kind: "instacam", ...grips.placeFor("instacam", [0.90, HIDE, 0.10], 0), eject: 0, flash: 0 };
const props = [
  { id: "kitchen", kind: "kitchenroom", x: 0, y: 0, z: 0, fridge: false, lamp: 1, time: 2.75 },
  { id: "fridge", kind: "openfridge", x: 1.35, y: 0, z: -1.78, rot: 0, scale: 0.75, open: 0, lit: 0, note: false, handleY: [1.00, 1.50] },
  { id: "ladder", kind: "jokeladder", x: 1.35, y: 0.36, z: -1.499, rot: 0 },
  ...photos, CAMD, CAMT,
  { id: "table", kind: "kitchentable", x: -1.25, y: 0, z: 0.15, w: 1.10, d: 0.60, h: 0.42 },
  { id: "chair", kind: "chair", x: -1.25, y: 0, z: 0.78, rot: 180 },
  { id: "plate1", kind: "plate", x: -1.62, y: 0.42, z: 0.02 }, { id: "plate2", kind: "plate", x: -1.25, y: 0.42, z: 0.02 }, { id: "plate3", kind: "plate", x: -0.88, y: 0.42, z: 0.02 },
  { id: "cup1", kind: "teacup", saucer: false, x: -1.50, y: 0.42, z: 0.33 }, { id: "cup2", kind: "teacup", saucer: false, x: -1.12, y: 0.42, z: 0.33 }, { id: "cup3", kind: "teacup", saucer: false, x: -0.84, y: 0.42, z: 0.33 },
  { id: "stool", kind: "stepstool", h: 0.30, x: 1.95, y: 0, z: -1.36, rot: 0 },
  { id: "corner", kind: "hotcorner", x: -5.50, y: 0, z: -2.30, rot: 0, bright: 0.8 },
  ...[[-0.19, 0.47, 0.04], [0.19, 0.47, 0.04], [0.05, 0.40, -0.16]].map(([x, y, z], i) => ({ id: `wisp${i}`, kind: "smokewisp", wear: "spud", x, y, z, rgb: "255,250,240", alpha: 0.5, h: 0.42, size: 0.045, n: 7 })),
  ...[-0.115, 0.115].map((x, i) => ({ id: `flush${i}`, kind: "blotch", wear: "spud", x, y: 0.40, z: 0.23, color: "#ff5a3c", size: 0.07, alpha: 0.5 })),
  { id: "socks", kind: "kidsocks", wear: "spud", x: 0, y: 0, z: 0 },
  { id: "shoes", kind: "kidsneakers", ...grips.placeFor("kidsneakers", [KID_M[0], HIDE, KID_M[1]], 0) },
  { id: "beard", kind: "beardflood", x: DAD_BEARD[0], y: 0, z: DAD_BEARD[1], rot: DAD_BEARD_YAW, reach: 2.2, waist: 0.36 },
  { id: "bread", kind: "tatosandwich", wear: "spud", x: 0, y: 0, z: 0 },
  { id: "moon", kind: "moonview", x: 0, y: 0, z: 0, on: 0 },
  { id: "shard1", kind: "plateshards", x: -1.5, y: 0, z: 0.5, v: 0, on: 0 },
  { id: "shard2", kind: "plateshards", x: -0.7, y: 0, z: 0.7, v: 1, on: 0 },
  { id: "moonK", kind: "moonlamp", x: 0.3, y: 2.4, z: 1.0, range: 8 },
];

// ---------------------------------------------------------------- helpers
const SUB = 330;
const CAPTEXT = {
  0: "*Tato!* Tonight I rank my *greatest jokes.* *Nothing* beats them.", 1: "Problem. His jokes come *TRUE.*",
  3: "Go stand in the corner. It's *ninety degrees.*", 4: "*Hot. Hot. HOT!*", 5: "*Top spot!*", 6: "*Bottom.*",
  8: "Sure. But they *won't fit me.*", 11: "*Top spot!*", 12: "*Lower.*", 13: "I used to *hate* facial hair...",
  15: "But then it *grew on me!*", 17: "*Top spot!*", 18: "*Lower.*", 20: "*Poof!* You're a *sandwich.*", 21: "I *hate* this house.",
  22: "*Top spot!*", 23: "*Still* lower.", 24: "Fine. My *best* one. A restaurant *on the moon.*", 26: "Great food. *No atmosphere!*",
  27: "Dad. Where's the *gravity?*", 28: "*Top spot!* Nothing beats *the moon!*", 31: "You're *toast.*", 32: "*Top spot.*",
};
const T = [], END_OF = (i) => r3(T[i] + DUR[i]);
const say = (i, at, { tail = 0.2, y = SUB } = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  cap(T[i], r3(END_OF(i) + tail), CAPTEXT[i] ?? line, y, false, { size: 62 });
  return END_OF(i);
};
const at0 = (t, dur) => (dur <= 0.011 && t > 0.05 ? onCut(t) : r3(t));
const look = (t, who, to, dur = 0.2) => A(at0(t, dur), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(at0(t, dur), who, "expr", typeof e === "string" ? { expr: e, dur } : e.expr ? { expr: e.expr, set: e.set, dur } : { set: e, dur });
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.15) => A(r3(t), who, "grip", { side, shape, dur });
const place = (t, who, at, yaw, y) => { const a = onCut(t); A(a, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(a, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const P = (t, id, set, dur = 0, ease) => c.prop(r3(t), id, set, dur, ease);
const shots = [], grade = [], fx = [];
const shot = (name, t, cam, mark) => shots.push(mark ? [name, r3(t), cam, mark] : [name, r3(t), cam]);
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur: r3(Math.max(0.3, dur)), ease: "inOut" });
const LOOKS = {
  evening: { s: 1.12, w: 0.5, c: 1, lift: 0.03, tint: "#ffffff" },
  moon: { s: 0.85, w: -0.6, c: 1.05, lift: -0.02, tint: "#c8d4ff" },
};
const state = (t, name, lights, lamp, dur = 0.01) => { grade.push([dur <= 0.011 ? onCut(t) : r3(t), LOOKS[name], ...(dur > 0.011 ? [dur] : [])]); fx.push({ do: "lights", at: dur <= 0.011 ? onCut(t) : r3(t), to: lights, lamp, dur }); };
const swapIn = (t, from, to, at, yaw) => { const a = onCut(t); A(a, from, "hide"); A(a, from, "move", { to: [9, 6], dur: 0.01, steps: 0, sync: true }); A(a, to, "show"); place(t, to, at, yaw); };
const swapBack = (t, from, to, at, yaw) => { const a = onCut(t); A(a, from, "hide"); A(a, from, "move", { to: [9, 6], dur: 0.01, steps: 0, sync: true }); A(a, to, "show"); place(t, to, at, yaw); };

// the instant camera is only in Dad's hand in his snap shots: taken on the cut, dropped off set on the next cut (no release
// moves: they would pull the arm after the cut)
const camOff = (t, who, id, to = [0, HIDE, 0]) => A(onCut(t), who, "release", { prop: id, dur: 0, to });
const camOn = (t, at, yaw) => { P(onCut(t), "camD", grips.placeFor("instacam", [at[0], 0, at[1]], yaw), 0); camHold.take(onCut(t), { reach: 0.01, settle: 0.01 }); arm(onCut(t), "dad", "R", { o: [0.36, 0.48, 0.28] }, 0.01); };
// the photo on the door: Dad slaps it under the gold magnet (his LEFT palm on its picture), then Tato moves it to slot b
const palmOn = (id) => ({ prop: id, grip: [0, 0.015, 0.05], palm: [0, 0.015, -0.4] });
const toTop = (t, id) => P(onCut(t), id, { ...TOPP }, 0);
const toSlot = (t, id, b) => { P(onCut(t), id, { ...slot(b), y: r3(slot(b).y + 0.12) }, 0); P(r3(t + 0.05), id, slot(b), 0.3, "out"); };   // the cut + a 0.12 slide down (Q6)

// cameras (DESIGN 1 where given; every shot pushes a little)
const MASTER = { pos: [0.65, 1.05, 3.60], look: [0.80, 0.80, -1.20], fov: 46 };
const TOPI = { pos: [0.95, 1.25, -0.20], look: [1.38, 1.27, -1.50], fov: 34 };
const LADDER = { pos: [1.35, 0.875, 1.20], look: [1.35, 0.875, -1.50], fov: 30 };
const CORNERC = { pos: [-4.30, 0.62, -0.03], look: [-5.08, 0.42, -1.98], fov: 40 };
const SNEAKC = { pos: [1.10, 0.22, 1.35], look: [0.45, 0.55, -0.80], fov: 44 };
const MOONW = { pos: [0.45, 1.55, 3.90], look: [0.45, 1.75, -2.00], fov: 56 };
const KIDCU = { pos: [0.80, 0.52, 0.55], look: [0.95, 0.46, -0.95], fov: 34 };
const DADMED = { pos: [0.05, 0.98, 1.30], look: [0.25, 0.82, -0.60], fov: 40 };
const TWO = { pos: [0.95, 0.85, 2.40], look: [0.60, 0.62, -0.80], fov: 42 };
const ROWKID = (b) => ({ pos: [r3(SLOT[b][0] - 0.05), 0.70, 0.45], look: [r3(SLOT[b][0] - 0.25), 0.55, -1.30], fov: 42 });
const BEARDW = { pos: [0.95, 1.35, 3.70], look: [0.90, 0.40, -0.30], fov: 50 };
const BEARDK = { pos: [1.55, 0.62, 1.75], look: [1.80, 0.36, 0.41], fov: 36 };
const SANDC = { pos: [0.95, 0.55, 0.80], look: [0.95, 0.45, -0.95], fov: 40 };
const FLOORC = { pos: [0.30, 0.55, 1.80], look: [0.55, 0.15, 0.10], fov: 44 };
const TOASTC = { pos: [0.55, 0.85, 2.30], look: [0.45, 0.62, -0.40], fov: 42 };

const FACE = {
  proud: { eye: 1.05, tilt: 0.25, curve: 0.55, browY: 0.04 },
  showman: { eye: 1.2, pupil: 0.7, tilt: 0.3, open: 0.4, curve: 0.5, browY: 0.06 },
  flat: { eye: 0.7, tilt: -0.05, browY: -0.02, curve: -0.05 },
  flatter: { eye: 0.55, tilt: -0.1, browY: -0.03, curve: -0.12 },
  cold: { eye: 0.8, tilt: 0.3, curve: -0.35, browY: 0.03 },
  hot: { eye: 0.7, tilt: 0.35, curve: -0.5, open: 0.15 },
  plead: { eye: 1.1, pupil: 0.8, tilt: 0.35, curve: -0.25, browY: 0.04 },
  smug: { eye: 0.6, tilt: -0.2, curve: 0.3, smirk: 0.45 },
  shocked: { eye: 1.35, pupil: 0.6, tilt: 0.4, open: 0.55, browY: 0.08 },
  offended: { eye: 0.9, tilt: -0.25, curve: -0.3, browY: -0.03 },
};

// ---------------------------------------------------------------- frame 0
state(0, "evening", 1, 1);
for (const [id, set] of [["corner", { heat: 0 }], ["beard", { grow: 0 }], ["bread", { scale: 0.001 }], ["socks", { scale: 0.001 }], ["moon", { on: 0 }],
  ["shard1", { on: 0 }], ["shard2", { on: 0 }], ["moonK", { on: 0 }], ["camD", { eject: 0, flash: 0 }], ["camT", { eject: 0, flash: 0 }],
  ...[0, 1, 2].map((i) => [`wisp${i}`, { scale: 0.001 }]), ...[0, 1].map((i) => [`flush${i}`, { scale: 0.001 }])]) P(0, id, set, 0);
A(0, "dadS", "hide"); A(0, "dadT", "hide");
const camHold = grips.mug(c, "dad", CAMD, { side: "R" });
// the camera is in Dad's right hand on his master mark from frame 0 (raised beside his head, never over his face)
P(0, "camD", grips.placeFor("instacam", [DAD_M[0], 0, DAD_M[1]], DAD_M_YAW), 0);
camHold.take(0, { reach: 0.01, settle: 0.01 });
camHold.carry(0.15, [r3(DAD_M[0] - 0.30), 0.98, r3(DAD_M[1] + 0.22)], 0.45);   // raises it like a trophy, beside his head
expr(0, "dad", FACE.showman, 0.01); look(0, "dad", [0.1, 0.1], 0.01);
expr(0, "spud", FACE.flat, 0.01); look(0, "spud", [0, 0], 0.01);

// ---------------------------------------------------------------- 0-5 s HOOK H1
let e, t;
shot("hook", 0, push(MASTER, 0.05, DUR[0] + 0.5), "hook");
see(0, 1.2, ["dad.face", "spud.face", "ladder"], "frame 0: a proud dad raises an instant camera in front of the fridge, a deadpan kid beside him, an empty gold magnet at the top of the door");
e = say(0, 0.12);
const C1 = r3(e + 0.12);
shot("problem", C1, push(KIDCU, 0.06, DUR[1] + 0.5));
A(onCut(C1), "spud", "turn", { to: 0, dur: 0.01, sync: true }); A(onCut(C1), "spud", "noblink", { dur: DUR[1] + 0.4 });
e = say(1, C1 + 0.1);
// RE-HOOK (Jonny 27 Nov: hook loops + re-hooks): a 0.4 s flash-forward under "come TRUE": the winning photo (toast Dad) already under
// the gold magnet, gone on the next cut, so the viewer waits to learn how it gets there
const CF = r3(e - 0.4);
toTop(CF, "ph6"); shot("flash forward", CF, push(TOPI, 0.02, 0.45));

// ---------------------------------------------------------------- 5-16 s JOKE 1: the corner
const C2 = r3(e + 0.2);
P(onCut(C2), "ph6", { y: HIDE }, 0);
shot("cold", C2, push(TWO, 0.05, DUR[2] + DUR[3] + 0.6));
A(onCut(C2), "spud", "turn", { to: -40, dur: 0.01, sync: true }); expr(C2, "spud", FACE.cold, 0.01);
arm(onCut(C2), "spud", "L", { o: [0.10, 0.40, 0.18] }, 0.01); arm(onCut(C2), "spud", "R", { o: [-0.10, 0.40, 0.18] }, 0.01);   // hugging himself
A(onCut(C2), "spud", "shake", { amount: 0.01, dur: DUR[2] + 0.3 });
camOff(C2, "dad", "camD"); arm(onCut(C2), "dad", "R", "rest", 0.01);
e = say(2, C2 + 0.1);
look(e - 0.2, "dad", [-0.4, 0], 0.15); expr(e - 0.2, "dad", FACE.proud, 0.2);
arm(e, "dad", "R", { o: [0.55, 0.62, 0.10] }, 0.3); grip(e + 0.1, "dad", "R", "point");   // o x = outward on that side   // points far left: the empty corner (DESIGN 1)
e = say(3, e + 0.3);
sfx(r3(e + 0.05), "ai/rimshot", { gain: 0.35, reason: "the dad joke's punchline" });
const C3 = r3(e + 0.35);
place(C3, "spud", KID_CORNER, KID_CORNER_YAW); arm(onCut(C3), "spud", "L", "rest", 0.01); arm(onCut(C3), "spud", "R", "rest", 0.01);
P(onCut(C3), "corner", { heat: 0.3 }, 0); P(r3(C3 + 0.05), "corner", { heat: 1 }, 0.6);
for (let i = 0; i < 3; i++) P(r3(C3 + 0.1), `wisp${i}`, { scale: 1 }, 0.5);
for (let i = 0; i < 2; i++) P(r3(C3 + 0.1), `flush${i}`, { scale: 1 }, 0.5);
expr(C3, "spud", FACE.hot, 0.01); A(onCut(C3), "spud", "squash", { amount: 0.05, dur: 0.01 });
sfx(r3(C3 + 0.05), "sizzle", { gain: 0.35 });
shot("hot corner", C3, push(CORNERC, 0.06, DUR[4] + 1.0));
see(C3, r3(C3 + 1.5), ["spud.face", "corner"], "the kitchen corner glows red hot, steam rising off the kid");
A(r3(C3 + 0.6), "spud", "hop", { count: 3, height: 0.05, dur: DUR[4] });
e = say(4, C3 + 0.6);
// the snap: Dad on the top-spot mark, flash, the photo slapped under the gold magnet
const C4 = r3(e + 0.15);
for (let i = 0; i < 3; i++) P(onCut(C4), `wisp${i}`, { scale: 0.001 }, 0);
for (let i = 0; i < 2; i++) P(onCut(C4), `flush${i}`, { scale: 0.001 }, 0);
P(onCut(C4), "corner", { heat: 0 }, 0); A(onCut(C4), "spud", "squash", { amount: 0, dur: 0.01 });
const snap = (C, i, line) => {   // Dad on the top spot, the flash, the slap; returns the end of his "Top spot!"
  place(C, "dad", DAD_TOP, DAD_TOP_YAW); place(C, "spud", [0.10, -0.05], 120);
  camOn(C, DAD_TOP, DAD_TOP_YAW); arm(onCut(C), "dad", "L", "rest", 0.01);
  P(onCut(C), "camD", { flash: 1, eject: 1 }, 0); P(r3(C + 0.07), "camD", { flash: 0.25 }, 0.25); P(r3(C + 0.35), "camD", { eject: 0 }, 0.01);
  fx.push({ do: "flash", at: r3(C + 0.02), dur: 0.1, peak: 0.5 });
  sfx(r3(C + 0.02), "click", { gain: 0.5, reason: "the instant camera's shutter" });
  expr(C, "dad", FACE.showman, 0.01); look(C, "dad", [-0.5, 0.2], 0.01);
  toTop(C + 0.35, `ph${i}`);
  arm(r3(C + 0.15), "dad", "L", palmOn(`ph${i}`), 0.25, "out"); grip(r3(C + 0.15), "dad", "L", "flat");
  sfx(r3(C + 0.38), "slap", { gain: 0.45 });
  shot(`top spot ${i}`, C, push(TOPI, 0.05, DUR[line] + 0.7));
  return say(line, C + 0.3);
};
e = snap(C4, 1, 5);
// Tato moves it down
const kidDown = (C, i, b, line) => {
  place(C, "spud", kidAt(b), 35);
  arm(onCut(C), "dad", "L", "rest", 0.01); camOff(C, "dad", "camD"); arm(onCut(C), "dad", "R", "rest", 0.01); place(C, "dad", [-0.30, -0.45], DAD_M_YAW);
  toSlot(C, `ph${i}`, b);
  arm(onCut(C), "spud", "L", palmOn(`ph${i}`), 0.01); grip(onCut(C), "spud", "L", "flat", 0.01);
  P(r3(C + 0.05), `ph${i}`, slot(b), 0.3, "out");
  expr(C, "spud", FACE.flat, 0.01); look(C, "spud", [-0.5, 0], 0.01);
  shot(`row ${i}`, C, push(ROWKID(b), 0.05, DUR[line] + 0.6));
  const end = say(line, C + 0.3);
  arm(r3(end + 0.05), "spud", "L", "rest", 0.25);
  return end;
};
const C5 = r3(e + 0.12);
e = kidDown(C5, 1, "b1", 6);

// ---------------------------------------------------------------- 16-27 s JOKE 2: the shoes
const C6 = r3(e + 0.25);
place(C6, "spud", KID_M, KID_M_YAW); place(C6, "dad", DAD_M, DAD_M_YAW);
P(onCut(C6), "shoes", grips.placeFor("kidsneakers", [KID_M[0], 0, KID_M[1]], KID_M_YAW), 0);
const shoeHold = grips.box(c, "spud", { id: "shoes", kind: "kidsneakers", ...grips.placeFor("kidsneakers", [KID_M[0], 0, KID_M[1]], KID_M_YAW) });
shoeHold.take(onCut(C6), { reach: 0.01, settle: 0.01 });
expr(C6, "spud", FACE.plead, 0.01); look(C6, "spud", [-0.6, 0.15], 0.01);
expr(C6, "dad", FACE.proud, 0.01); look(C6, "dad", [0.5, -0.1], 0.01);
shot("shoes", C6, push(TWO, 0.05, DUR[7] + DUR[8] + 0.6));
e = say(7, C6 + 0.1);
e = say(8, e + 0.3);
sfx(r3(e + 0.05), "ai/rimshot", { gain: 0.35 });
const C7 = r3(e + 0.3);
camOff(C7, "spud", "shoes", [KID_M[0], HIDE, KID_M[1]]); arm(onCut(C7), "spud", "L", "rest", 0.01); arm(onCut(C7), "spud", "R", "rest", 0.01);
swapIn(C7, "dad", "dadS", DAD_SNEAK, 25);
place(C7, "spud", KID_SNEAK, -30); P(onCut(C7), "socks", { scale: 1 }, 0);
arm(onCut(C7), "dadS", "L", { o: [0.62, 0.50, 0.05] }, 0.01); arm(onCut(C7), "dadS", "R", { o: [0.62, 0.50, 0.05] }, 0.01);
grip(onCut(C7), "dadS", "L", "open", 0.01); grip(onCut(C7), "dadS", "R", "open", 0.01);
expr(C7, "dadS", { eye: 1.15, pupil: 0.8, tilt: 0.2, open: 0.3 }, 0.01);
A(r3(C7 + 0.05), "dadS", "move", { to: [0.05, -0.30], dur: 1.6, steps: 4, stride: 0.08, ease: "linear" });
for (let k = 0; k < 4; k++) A(r3(C7 + 0.05 + k * 0.4), "dadS", "lean", { to: k % 2 ? -7 : 7, dur: 0.2 });
A(r3(C7 + 1.7), "dadS", "lean", { to: 0, dur: 0.2 });
sfx(r3(C7 + 0.05), "creak", { gain: 0.25, reason: "the tiny sneakers straining" });
shot("waddle", C7, push(SNEAKC, 0.05, DUR[9] + DUR[10] + 0.8));
see(C7, r3(C7 + 1.5), ["dadS", "spud"], "dad waddles in his kid's tiny red sneakers, the kid in his socks behind him");
e = say(9, C7 + 0.15, { y: 1150 });
expr(e, "spud", FACE.flat, 0.01);
e = say(10, e + 0.3, { y: 1150 });
const C8 = r3(e + 0.15);
P(onCut(C8), "socks", { scale: 0.001 }, 0);
swapBack(C8, "dadS", "dad", DAD_TOP, DAD_TOP_YAW);
e = snap(C8, 2, 11);
const C9 = r3(e + 0.12);
e = kidDown(C9, 2, "b2", 12);

// ---------------------------------------------------------------- 27-39 s JOKE 3: the beard
const C10 = r3(e + 0.25);
place(C10, "dad", DAD_BEARD, DAD_BEARD_YAW); place(C10, "spud", [0.95, -0.20], 230);
arm(r3(C10 + 0.1), "dad", "L", { o: [0.10, 0.60, 0.38] }, 0.3); grip(r3(C10 + 0.1), "dad", "L", "relaxed");   // stroking his chin
expr(C10, "dad", { eye: 0.6, tilt: 0.1, curve: 0.3, browY: 0.04 }, 0.01); look(C10, "dad", [0.5, 0.1], 0.01);
expr(C10, "spud", FACE.plead, 0.01); look(C10, "spud", [-0.3, 0.2], 0.01);
shot("facial hair", C10, push(DADMED, 0.07, DUR[13] + DUR[14] + DUR[15] + 0.9));
e = say(13, C10 + 0.1);
A(r3(e + 0.05), "spud", "move", { to: [1.20, 0.05], dur: 0.5, steps: 2, stride: 0.15 });   // backing away
e = say(14, e + 0.3);
arm(e, "dad", "L", { o: [0.62, 0.95, 0.10] }, 0.25); expr(e, "dad", FACE.showman, 0.15);
e = say(15, e + 0.3);
sfx(r3(e + 0.02), "ai/rimshot", { gain: 0.35 });
const C11 = r3(e + 0.2);
place(C11, "spud", KID_BEARD, 235);
P(onCut(C11), "beard", { grow: 0 }, 0); P(r3(C11 + 0.05), "beard", { grow: 1 }, 1.5, "out");
sfx(r3(C11 + 0.05), "whoosh", { gain: 0.35, reason: "the beard pouring over the floor" });
arm(onCut(C11), "dad", "L", "rest", 0.01); arm(r3(C11 + 0.6), "dad", "R", { prop: "beard", grip: [0.08, 0.50, 0.50], palm: [0.08, 0.50, 0.2] }, 0.3);
expr(r3(C11 + 0.6), "spud", FACE.flatter, 0.2);
shot("beard flood", C11, push(BEARDW, 0.04, 1.8));
see(C11, r3(C11 + 1.8), ["dad.face", "spud.face", "beard"], "a giant beard pours out of dad's chin across the floor and swallows the kid to his waist");
const C12 = r3(C11 + 1.8);
shot("tangled", C12, push(BEARDK, 0.06, DUR[16] + 0.6));
look(C12, "spud", [0, 0], 0.01);
e = say(16, C12 + 0.1);
const C13 = r3(e + 0.15);
P(onCut(C13), "beard", { grow: 0, scale: 0.001 }, 0);
e = snap(C13, 3, 17);
const C14 = r3(e + 0.12);
e = kidDown(C14, 3, "b3", 18);

// ---------------------------------------------------------------- 39-52 s JOKE 4: Tato himself
const C15 = r3(e + 0.25);
place(C15, "spud", KID_M, 0); place(C15, "dad", [-0.15, -0.45], 30); arm(onCut(C15), "dad", "R", "rest", 0.01); arm(onCut(C15), "dad", "L", "rest", 0.01);
expr(C15, "spud", { eye: 0.75, tilt: 0.3, curve: -0.2 }, 0.01); look(C15, "spud", [-0.5, 0.15], 0.01);
expr(C15, "dad", FACE.proud, 0.01); look(C15, "dad", [0.6, -0.15], 0.01);
shot("sandwich ask", C15, push(TWO, 0.05, DUR[19] + DUR[20] + 0.5));
e = say(19, C15 + 0.1);
e = say(20, e + 0.3);
const TP = r3(e - 0.2);
fx.push({ do: "poof", who: "spud", at: TP, dur: 0.7, puffs: 26, sparks: 0, color: "#fff4dc" });
sfx(TP, "poof", { gain: 0.5 });
P(r3(TP + 0.1), "bread", { scale: 1 }, 0.01);
const C16 = r3(e + 0.35);
shot("sandwich", C16, push(SANDC, 0.06, DUR[21] + 0.8));
see(C16, r3(C16 + 1.2), ["spud.face", "bread"], "the kid stands between two giant slices of bread, a lettuce leaf on his head: a potato sandwich");
expr(C16, "spud", FACE.flatter, 0.01); look(C16, "spud", [0, 0], 0.01); A(onCut(C16), "spud", "noblink", { dur: DUR[21] + 0.5 });
e = say(21, C16 + 0.25);
const C17 = r3(e + 0.15);
e = snap(C17, 4, 22);
const C18 = r3(e + 0.12);
e = kidDown(C18, 4, "b4", 23);
const C19 = r3(e + 0.2);
P(onCut(C19), "bread", { scale: 0.001 }, 0);

// ---------------------------------------------------------------- 52-68 s JOKE 5: the moon
place(C19, "spud", [-0.40, 0.30], 20); place(C19, "dad", DAD_M, -20); arm(onCut(C19), "dad", "R", "rest", 0.01);
expr(C19, "dad", { eye: 0.6, tilt: 0.0, curve: 0.2, browY: -0.02 }, 0.01); look(C19, "dad", [-0.5, -0.1], 0.01);
expr(C19, "spud", FACE.plead, 0.01); look(C19, "spud", [0.5, 0.15], 0.01);
shot("best one", C19, push(MOONW, 0.04, DUR[24] + DUR[25] + DUR[26] + 0.8));
e = say(24, C19 + 0.1);
arm(e, "spud", "R", { prop: "table", grip: [0.50, 0.42, -0.25], palm: [0.5, 0.1, -0.25] }, 0.2);
e = say(25, e + 0.3);
expr(e, "dad", FACE.showman, 0.15); arm(e, "dad", "L", { o: [0.55, 1.0, 0.1] }, 0.25);
e = say(26, e + 0.3);
sfx(r3(e - 0.3), "ai/rimshot", { gain: 0.3 });
const TM = r3(e - 0.25);
state(TM, "moon", 0.15, 0.08, 0.4); P(TM, "moonK", { on: 0.9 }, 0.4);
P(onCut(TM), "moon", { on: 1 }, 0);
sfx(TM, "ai/slowmo-air", { gain: 0.3, reason: "the air going out of the room" });
// everything floats up (prop tweens, deterministic), Tato and Dad lift off
const FLOAT = [["plate1", 0.9, 30], ["plate2", 1.3, -40], ["plate3", 1.1, 55], ["cup1", 1.5, 70], ["cup2", 1.0, -60], ["cup3", 1.7, 40], ["chair", 1.2, 25]];
for (const [id, y, r] of FLOAT) P(r3(TM + 0.1), id, { y, roll: r, tilt: r / 2 }, 2.4, "out");
arm(r3(TM + 0.05), "spud", "R", "rest", 0.3);
A(r3(TM + 0.15), "spud", "fly", { to: { x: -0.20, y: 0.95, z: 0.20 }, dur: 1.6, ease: "out" });
A(r3(TM + 0.15), "spud", "pitch", { to: 180, dur: 1.8 });
arm(r3(TM + 0.2), "spud", "L", { o: [0.6, 0.5, 0.1] }, 0.4); arm(r3(TM + 0.2), "spud", "R", { o: [0.6, 0.5, 0.1] }, 0.4);
const C20 = r3(e + 0.3);
shot("no gravity", C20, push(MOONW, 0.03, DUR[27] + 0.8));
see(C20, r3(C20 + 1.2), ["spud.face", "moon"], "gravity is gone: the dark kitchen with the moon in the window, plates, cups, a chair and the kid float upside down");
expr(C20, "spud", FACE.flatter, 0.01);
e = say(27, C20 + 0.1);
// Dad floats to the top spot, head down, palm on the moon photo
const C21 = r3(e + 0.15);
place(C21, "dad", DAD_TOP, DAD_TOP_YAW, 1.05); A(onCut(C21), "dad", "pitch", { to: 180, dur: 0.01 }); camOn(C21, DAD_TOP, DAD_TOP_YAW);
P(onCut(C21), "camD", { flash: 1, eject: 1 }, 0); P(r3(C21 + 0.07), "camD", { flash: 0.25 }, 0.25); P(r3(C21 + 0.35), "camD", { eject: 0 }, 0.01);
fx.push({ do: "flash", at: r3(C21 + 0.02), dur: 0.1, peak: 0.4 });
sfx(r3(C21 + 0.02), "click", { gain: 0.5 });
toTop(C21 + 0.35, "ph5");
arm(r3(C21 + 0.15), "dad", "L", palmOn("ph5"), 0.25, "out"); grip(r3(C21 + 0.15), "dad", "L", "flat");
expr(C21, "dad", FACE.showman, 0.01);
shot("moon top", C21, push(TOPI, 0.04, DUR[28] + 0.6));
e = say(28, C21 + 0.3);

// ---------------------------------------------------------------- 68-80 s ENDING: the crash, "You're toast.", POOF, top spot
const C22 = r3(e + 0.2);
state(C22, "evening", 1, 1); P(onCut(C22), "moon", { on: 0 }, 0); P(onCut(C22), "moonK", { on: 0 }, 0);
for (const [id] of FLOAT) P(onCut(C22), id, { y: 0, roll: 0, tilt: 0 }, 0);
P(onCut(C22), "chair", { x: -0.95, z: 0.85, y: 0, roll: 90, tilt: 0 }, 0);
P(onCut(C22), "plate1", { y: HIDE }, 0); P(onCut(C22), "plate2", { y: HIDE }, 0); P(onCut(C22), "shard1", { on: 1 }, 0); P(onCut(C22), "shard2", { on: 1 }, 0);
for (const id of ["cup1", "cup2", "cup3", "plate3"]) P(onCut(C22), id, { x: { cup1: -1.7, cup2: -0.4, cup3: 0.15, plate3: -0.95 }[id], z: { cup1: 0.7, cup2: 0.9, cup3: 0.6, plate3: 0.35 }[id] }, 0);
sfx(onCut(C22), "ai/glass-smash", { gain: 0.45, reason: "the plates crash when gravity comes back" });
sfx(onCut(C22), "slam", { gain: 0.4 });
A(onCut(C22), "spud", "pitch", { to: 0, dur: 0.01 }); place(C22, "spud", [0.55, 0.10], 0, 0);
A(onCut(C22), "spud", "flat", { to: 0.7, dur: 0.01 });   // flat on his belly on the floor
expr(C22, "spud", { eye: 0.3, tilt: 0.1, curve: -0.2 }, 0.01);
A(onCut(C22), "dad", "pitch", { to: 0, dur: 0.01 }); place(C22, "dad", DAD_M, DAD_M_YAW, 0);
arm(onCut(C22), "dad", "L", { o: [0.30, 0.42, 0.15] }, 0.01); arm(onCut(C22), "dad", "R", { o: [0.30, 0.42, 0.15] }, 0.01);   // fists on his belt
grip(onCut(C22), "dad", "L", "fist", 0.01); grip(onCut(C22), "dad", "R", "fist", 0.01); camOff(C22, "dad", "camD");
arm(onCut(C22), "spud", "L", { o: [0.38, 0.22, 0.12] }, 0.01); arm(onCut(C22), "spud", "R", { o: [0.38, 0.22, 0.12] }, 0.01);   // arms out beside him, flat on the floor
expr(C22, "dad", FACE.proud, 0.01); look(C22, "dad", [0.3, -0.3], 0.01);
shot("crash", C22, push(MASTER, 0.04, DUR[29] + DUR[30] + 1.0));
see(C22, r3(C22 + 1), ["dad.face", "spud", "shard1"], "gravity is back: broken plates, the chair on its side, the kid flat on the floor, dad victorious");
e = say(29, C22 + 0.5);
e = say(30, e + 0.3);
const C23 = r3(e + 0.15);
shot("toast", C23, push(FLOORC, 0.06, DUR[31] + 0.7));
expr(C23, "spud", FACE.flat, 0.01); look(C23, "spud", [-0.2, 0.3], 0.01); A(onCut(C23), "spud", "flat", { to: 0.5, dur: 0.01 });
A(r3(C23 + 0.1), "spud", "flat", { to: 0.35, dur: 0.6 });   // slowly raising his head
e = say(31, C23 + 0.25);
const C24 = r3(e + 0.1);
fx.push({ do: "poof", who: "dad", at: onCut(C24), dur: 0.7, puffs: 26, sparks: 0, color: "#fff4dc" });
sfx(onCut(C24), "poof", { gain: 0.5 });
const TT = r3(C24 + 0.1);
A(TT, "dad", "hide"); A(TT, "dad", "move", { to: [9, 6], dur: 0.01, steps: 0, sync: true });
A(TT, "dadT", "show"); A(TT, "dadT", "move", { to: DAD_M, dur: 0.01, steps: 0, sync: true }); A(TT, "dadT", "turn", { to: 20, dur: 0.01, sync: true });
expr(TT, "dadT", FACE.shocked, 0.01); look(TT, "dadT", [0, 0], 0.01);
A(onCut(C24), "spud", "flat", { to: 0, dur: 0.01 }); place(C24, "spud", [0.95, 0.15], -25);
P(onCut(C24), "camT", grips.placeFor("instacam", [0.95, 0, 0.15], -25), 0);
const camK = grips.box(c, "spud", { ...CAMT, ...grips.placeFor("instacam", [0.95, 0, 0.15], -25) });
camK.take(onCut(C24), { reach: 0.01, settle: 0.01 });
expr(C24, "spud", FACE.smug, 0.01); look(C24, "spud", [-0.5, 0.2], 0.01);
shot("poof toast", C24, push(TOASTC, 0.05, 1.5));
see(TT, r3(TT + 1.2), ["dadT.face", "spud.face"], "POOF: dad is a giant slice of toast with his face and moustache, the kid aims the instant camera at him");
P(r3(C24 + 0.8), "camT", { flash: 1, eject: 1 }, 0); P(r3(C24 + 0.87), "camT", { flash: 0 }, 0.25);
fx.push({ do: "flash", at: r3(C24 + 0.8), dur: 0.1, peak: 0.5 }); sfx(r3(C24 + 0.8), "click", { gain: 0.5 });
const C25 = r3(C24 + 1.5);
camOff(C25, "spud", "camT"); arm(onCut(C25), "spud", "L", "rest", 0.01);
place(C25, "spud", STEP, 90, 0.30); P(onCut(C25), "stool", { x: STEP[0], z: STEP[1] }, 0);
place(C25, "dadT", [0.40, -0.70], 20);
toTop(C25, "ph6");
arm(onCut(C25), "spud", "R", { o: [0.25, 0.70, 0.25] }, 0.01);
arm(r3(C25 + 0.15), "spud", "R", palmOn("ph6"), 0.2, "out"); grip(r3(C25 + 0.15), "spud", "R", "flat");
sfx(r3(C25 + 0.3), "slap", { gain: 0.45 });
expr(C25, "spud", FACE.smug, 0.01); look(C25, "spud", [0.3, 0.1], 0.01);
shot("top spot toast", C25, push(TOPI, 0.05, DUR[32] + 1.0), "payoff");
e = say(32, C25 + 0.45);
const END = r3(e + 0.4);   // end on the punchline (Jonny 20 Nov)

const beats = c.beats(shots, END);
write(import.meta.url, {
  id: "dad-jokes-true", title: "Kid vs Dad 08: Dad's jokes come true (rough draft)",
  idea: "Kid vs Dad 08: Dad ranks his greatest dad jokes on the fridge door, but every joke comes true on Tato (a red-hot corner, Dad in Tato's tiny shoes, a beard carpet, Tato as a sandwich, the kitchen on the moon); Tato moves each photo to the bottom, then wins the top spot with his own joke: 'You're toast.'",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1230], captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
  captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", night: true, floor: "none", light: "dusk", para: 0, aperture: 0, lighting: 2, bloom: "emissive",
    hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade, fx,
  music: { file: "ai/nm-deadpan/nm-deadpan-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood" },
  creative: { length: [END, END] },
  hook: { show: ["dad", "spud"], hint: 0, what: LINES[0][1] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "beard", from: onCut(C11), to: onCut(C13), checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "tangled to his waist in the beard carpet (DESIGN 7)" },
    { who: "spud", with: "stool", from: onCut(C25), to: END, reason: "standing on the step stool (DESIGN 1)" },
    { who: "spud", with: "bread", from: TP, to: onCut(C19), checks: ["shell", "clipping", "limb-in-prop", "arm-in-prop", "hand-in-prop", "costume-in-prop"], reason: "the worn sandwich slices around him (DESIGN 8)" },
    { who: "dad", with: "fridge", from: onCut(C21), to: onCut(C22), checks: ["arm-in-prop", "hand-in-prop"], reason: "floating upside down at the top spot, his palm on the door (DESIGN 9)" },
    { who: "dad", with: "kitchen", from: onCut(C21), to: onCut(C22), checks: ["arm-in-prop", "hand-in-prop"], reason: "floating upside down beside the window (DESIGN 9)" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/08-dad-jokes-true/make-dad-jokes-true.mjs. Rough draft 1 for Jonny's story check (all starred options; panel sheet v1).",
});
console.log(`spoken lengths: ${Array.isArray(SPOKEN) && SPOKEN.length === LINES.length ? "measured" : "ESTIMATED"}, end ${END} s`);
