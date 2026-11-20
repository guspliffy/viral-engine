// Potato Desk 11 reach bench (DESIGN.md section 8): the four wall reaches near the top of each body's reach, before staging.
// Stand-ins: the thermostat is a lightpool card at its DESIGN size; small snow lumps mark the target points. Not a clip.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
const c = clip({ faces: "strong" }), { A } = c;
const OY = Number(process.env.OY ?? 1.36);          // thermostat origin height to test
const BTN = r3(OY - 0.135), Z_FACE = -1.225;
const UP = [-0.105, BTN, -1.22], DOWN = [0.105, BTN, -1.22];
const RAILR = [0.22, r3(OY - 0.27), -1.17], COVERLOW = [0.45, r3(OY - 0.26), -1.22], SHAKE = [0, 1.05, -0.92];
const arm = (t, who, side, pose, dur = 0.3) => A(r3(t), who, "arm", { side, pose, dur });
const grip = (t, who, side, shape) => A(r3(t), who, "grip", { side, shape, dur: 0.1 });
const place = (t, who, to, yaw, y = 0) => { A(r3(t), who, "move", { to, dur: 0, y }); A(r3(t), who, "turn", { to: yaw, dur: 0 }); };
const CHIPW = [Number(process.env.CX ?? -0.56), -0.98], MASHR1 = [Number(process.env.MX ?? 0.64), -0.95];
const cast = [
  { id: "chip", character: "potatobrawl/chip", at: CHIPW, face: 60, expr: "angry" },
  { id: "spud", character: "potatobrawl/spud", at: [0, -0.36], face: 0, expr: "kind" },
  { id: "mash", character: "potatobrawl/mash", at: MASHR1, face: -60, expr: "smug" },
  { id: "wedge", character: "potatobrawl/wedge", at: [2.6, 0.6], face: 0, expr: "stern" },
];
const mark = (id, p) => ({ id, kind: "snowlump", r: 0.025, x: p[0], y: r3(p[1] - 0.02), z: p[2] });
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.6, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 1.5, w: 5, d: 6 },
  { id: "card", kind: "lightpool", face: "z", w: 0.48, d: 0.44, color: "#ffffff", x: 0, y: OY, z: -1.29, on: 1 },
  mark("mUp", UP), mark("mDown", DOWN), mark("mRail", RAILR), mark("mLow", COVERLOW), mark("mShake", SHAKE),
];
c.prop(0, "card", { on: 1 }, 0);
// phase 1 (0-1.5): Chip on the 0.74 step, left glove on UP; Mash at R1, right glove on DOWN
place(0, "chip", CHIPW, 60, 0.74);
arm(0.1, "chip", "L", { world: UP }, 0.4); grip(0.2, "chip", "L", "point");
arm(0.1, "mash", "R", { world: DOWN }, 0.4); grip(0.2, "mash", "R", "point");
// phase 2 (1.5-3): Mash out, Wedge at R1 under railR, then at R1b under coverLow (3-4.5)
place(1.5, "mash", [2.6, -0.2], 0); arm(1.5, "mash", "R", "rest", 0);
place(1.5, "wedge", [0.64, -0.95], -40); arm(1.6, "wedge", "R", { world: RAILR }, 0.4); grip(1.7, "wedge", "R", "flat");
place(3.0, "wedge", [0.86, -0.95], -30); arm(3.0, "wedge", "R", { world: COVERLOW }, 0.3); grip(3.1, "wedge", "R", "point");
// phase 3 (4.5-6): handshake over Spud: Chip on the step (left glove), Mash at R1 (right glove)
place(4.5, "wedge", [2.6, 0.6], 0); arm(4.5, "wedge", "R", "rest", 0);
place(4.5, "mash", MASHR1, -60); arm(4.6, "mash", "R", { world: [0.03, 1.05, -0.92] }, 0.4); grip(4.6, "mash", "R", "flat");
arm(4.6, "chip", "L", { world: [-0.03, 1.05, -0.92] }, 0.4); grip(4.6, "chip", "L", "flat");
A(4.6, "spud", "lean", { to: 8, dur: 0.3 });
const F = { pos: [0, 1.45, 3.6], look: [0, 1.15, -1.0], fov: 34 }, S = { pos: [2.6, 1.4, 0.4], look: [0, 1.15, -1.0], fov: 40 }, L = { pos: [-2.4, 1.4, 0.6], look: [0, 1.15, -1.0], fov: 40 };
const beats = c.beats([["btn-front", 0, F], ["btn-left", 0.9, L], ["btn-right", 1.2, S], ["rail-front", 2.2, F], ["rail-side", 2.6, S],
  ["low-front", 3.7, F], ["low-side", 4.1, S], ["shake-front", 5.3, F], ["shake-left", 5.6, L]], 6);
write(import.meta.url, { id: "desk11-reach-bench", title: "desk11 reach bench", idea: "reach bench", tool: "bench", fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1360], castLook: "sheet", rig: { hand: 2, eyes: 2, hold: 2 }, motion: { feet: 2, solve: true },
  set: { type: "plain", color: "#b7c4b8", floor: "none", light: "soft" }, sound: { signature: false },
  creative: { length: [6, 6] }, cast, props, captions: c.captions, beats, visible: c.visible, notes: "reach bench" });
