// Bench for the heist props (engine/page/props-heist.js, task T1 of ../BRIEF-T1.md): one group per camera on a plain set,
// 7 m apart so each camera sees only its own group. Not a clip.
//   mask      eyemask on Viking, Phoenix, Reaper: facing the camera, then 3/4, each as cast ("kind"), "shocked", "angry"; the back
//   cap       policecap on Samurai, Norse god, Dragon: front at eye level, then side
//   bag       moneybag closed and open on the floor (front, 3/4)
//   shield    riotshield standing, and worn in front of the Norse god (his gloves on the handles behind it)
//   torch     policetorch off and on (close), and the beam (long)
//   net       policenet at open 0, open 1, and wrap 1 over Viking
//   node storyboards/series/fight-flight-freeze/01-bank-robbery/bench/make-heist-props.mjs
//   node engine/render.mjs storyboards/series/fight-flight-freeze/01-bank-robbery/bench/heist-props.json --stills <times> --draft --out <dir>
import { clip, write, r3 } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const GX = { maskF: -35, mask34: -28, maskB: -21, cap: -14, capS: -7, bag: 0, shield: 7, torch: 14, net: 21, netw: 28, beam: 42 };
const SP = 0.92;   // trio spacing

// ---- the cast: trios, each in its own group
const FACE34 = 36;   // 3/4: turned toward +x
const trio = (ids, chars, gx, face, seeds) => ids.map((id, i) => ({ id, character: chars[i], at: [r3(gx + (i - 1) * SP), 0], face, expr: "kind", follow: 0.2, seed: seeds[i] }));
const ROB = ["duo/viking", "duo/phoenix", "never-has-money/reaper"], COPS = ["duo/samurai", "potatobrawl/allfather", "potatobrawl/dragon"];
const cast = [
  ...trio(["vikF", "phxF", "reaF"], ROB, GX.maskF, 0, [3.3, 1.7, 3.1]),
  ...trio(["vik3", "phx3", "rea3"], ROB, GX.mask34, FACE34, [3.3, 1.7, 3.1]),
  ...trio(["vikB", "phxB", "reaB"], ROB, GX.maskB, 180, [3.3, 1.7, 3.1]),
  ...trio(["samF", "godF", "draF"], COPS, GX.cap, 0, [2.2, 4.4, 4.1]),
  ...trio(["samS", "godS", "draS"], COPS, GX.capS, 90, [2.2, 4.4, 4.1]),
  { id: "godW", character: "potatobrawl/allfather", at: [GX.shield + 0.55, 0], face: 0, expr: "stern", follow: 0.2, seed: 4.4 },
  { id: "vikN", character: "duo/viking", at: [GX.netw, 0], face: 0, expr: "shocked", follow: 0.2, seed: 3.3 },
];
const FITS = ["vik", "phx", "rea"];
// ---- the props
const CAPS = {   // [x, y, z, r, tilt] on each cop (body frame): see the fit table in props-heist.js
  sam: [0, 1.09, 0.02, 0.2, 0], god: [0, 1.22, 0.02, 0.2, 0], dra: [0, 1.04, 0.02, 0.2, 0],
};
const props = [];
for (const [grp, tag] of [["F", "F"], ["3", "3"], ["B", "B"]]) ["vik", "phx", "rea"].forEach((n, i) => props.push({ id: `mask-${n}${tag}`, kind: "eyemask", wear: `${n}${grp}`, x: 0, y: 0, z: 0, fit: FITS[i] }));
for (const tag of ["F", "S"]) ["sam", "god", "dra"].forEach((n) => { const [x, y, z, r, tilt] = CAPS[n]; props.push({ id: `cap-${n}${tag}`, kind: "policecap", wear: `${n}${tag}`, x, y, z, r, tilt }); });
props.push(
  { id: "bagC", kind: "moneybag", x: GX.bag - 0.28, z: 0, rot: -10 },
  { id: "bagO", kind: "moneybag", x: GX.bag + 0.28, z: 0, rot: 10, open: true },
  { id: "shStand", kind: "riotshield", x: GX.shield - 0.85, z: 0, rot: 14, tip: -6 },
  { id: "shWorn", kind: "riotshield", wear: "godW", x: 0, y: 0.27, z: 0.56 },
  { id: "tOff", kind: "policetorch", x: GX.torch - 0.28, y: 0.55, z: 0, rot: 62, tip: 14 },
  { id: "tOn", kind: "policetorch", x: GX.torch + 0.28, y: 0.55, z: 0, rot: -62, tip: 14, len: 1.2, r: 0.2 },
  { id: "tLong", kind: "policetorch", x: GX.beam - 1.7, y: 1.0, z: 0, rot: 90, tip: 0 },
  { id: "net0", kind: "policenet", x: GX.net - 0.95, y: 0.12, z: 0 },
  { id: "net1", kind: "policenet", x: GX.net + 0.55, y: 1.05, z: 0, spin: 12 },
  { id: "net2", kind: "policenet", x: GX.netw, y: 1.3, z: 0 },
);
// params that propState has no default for are seeded at 0 (a dur-0 set), then tweened
c.prop(0, "net0", { open: 0 }, 0); c.prop(0, "net1", { open: 1 }, 0); c.prop(0, "net2", { open: 1, wrap: 1 }, 0);
c.prop(0, "tOff", { on: 0 }, 0); c.prop(0, "tOn", { on: 1 }, 0); c.prop(0, "tLong", { on: 1 }, 0);

// the god behind his shield: gloves on the handles (arm poses are in the body frame for a worn prop)
const HY = 0.27, ZH = 0.56 - 0.085;
const up = (y) => r3((y - 0.14) / 1.04);
c.arm(0, "godW", "R", { x: [-0.05, up(HY + 0.62), ZH] }, 0.01); A(0, "godW", "grip", { side: "R", shape: "fist", dur: 0.01 });
c.arm(0, "godW", "L", { x: [0.06, up(HY + 0.36), ZH] }, 0.01); A(0, "godW", "grip", { side: "L", shape: "fist", dur: 0.01 });

// ---- expressions for the mask trios, in step with the shots
const MASKERS = ["vikF", "phxF", "reaF", "vik3", "phx3", "rea3"];
const setExpr = (t, e) => { for (const w of MASKERS) A(t, w, "expr", { expr: e, dur: 0.1 }); };
const T = { F0: 0, F1: 1.4, F2: 2.4, S0: 3.4, S1: 4.4, S2: 5.4, B: 6.4, cap: 7.4, capS: 8.4, bag: 9.4, bag3: 10.4, sh: 11.4, shB: 12.4, torch: 13.4, beam: 14.4, nets: 15.4, net0: 26.4, wrap: 16.4, wrap3: 17.4, cVik: 18.4, cPhx: 19.4, cRea: 20.4, cVik3: 21.4, cSam: 22.4, cGod: 23.4, cDra: 24.4, cGodS: 25.4 }, END = 27.4;
setExpr(0.05, "kind"); setExpr(T.F1 - 0.25, "shocked"); setExpr(T.F2 - 0.25, "angry"); setExpr(T.S0 - 0.25, "kind"); setExpr(T.S1 - 0.25, "shocked"); setExpr(T.S2 - 0.25, "angry");
setExpr(T.B - 0.25, "kind");
A(T.cVik - 0.25, "vikF", "expr", { expr: "shocked", dur: 0.1 }); A(T.cPhx - 0.25, "phxF", "expr", { expr: "angry", dur: 0.1 }); A(T.cRea - 0.25, "reaF", "expr", { expr: "shocked", dur: 0.1 }); A(T.cVik3 - 0.25, "vik3", "expr", { expr: "angry", dur: 0.1 });

const trioCam = (gx, y = 0.95, d = 9.0, fov = 34) => ({ pos: [gx, y, d], look: [gx, y - 0.2, 0], fov });
const close = (x, y) => ({ pos: [x, y, 4.6], look: [x, y, 0], fov: 20 });
const SHOTS = [
  ["maskF0", T.F0, trioCam(GX.maskF), "eyemask facing the camera, as cast"],
  ["maskF1", T.F1, trioCam(GX.maskF), "eyemask facing, shocked"],
  ["maskF2", T.F2, trioCam(GX.maskF), "eyemask facing, angry"],
  ["mask30", T.S0, trioCam(GX.mask34), "eyemask 3/4, as cast"],
  ["mask31", T.S1, trioCam(GX.mask34), "eyemask 3/4, shocked"],
  ["mask32", T.S2, trioCam(GX.mask34), "eyemask 3/4, angry"],
  ["maskB", T.B, trioCam(GX.maskB), "eyemask from behind: knot and tails"],
  ["capF", T.cap, trioCam(GX.cap, 0.72, 9.0, 34), "policecap front at eye level"],
  ["capS", T.capS, trioCam(GX.capS, 0.72, 9.0, 34), "policecap side"],
  ["bag", T.bag, { pos: [GX.bag, 0.6, 3.7], look: [GX.bag, 0.17, 0], fov: 30 }, "moneybag closed | open"],
  ["bag3", T.bag3, { pos: [GX.bag + 1.7, 0.75, 2.9], look: [GX.bag, 0.17, 0], fov: 30 }, "moneybag 3/4"],
  ["shield", T.sh, { pos: [GX.shield - 0.1, 0.9, 5.4], look: [GX.shield - 0.1, 0.5, 0], fov: 36 }, "riotshield standing | worn by the god"],
  ["shieldB", T.shB, { pos: [GX.shield + 4.2, 1.0, 2.2], look: [GX.shield + 0.55, 0.6, 0.4], fov: 32 }, "riotshield from the side: handles and gloves"],
  ["torch", T.torch, { pos: [GX.torch, 0.75, 2.1], look: [GX.torch, 0.55, 0], fov: 30 }, "policetorch off | on"],
  ["beam", T.beam, { pos: [GX.beam, 1.3, 8.0], look: [GX.beam, 0.95, 0], fov: 34 }, "policetorch beam, len 3.5"],
  ["nets", T.nets, { pos: [GX.net, 2.7, 6.0], look: [GX.net, 0.5, 0], fov: 46 }, "policenet open 0 | open 1"],
  ["wrap", T.wrap, { pos: [GX.netw, 0.9, 5.2], look: [GX.netw, 0.55, 0], fov: 36 }, "policenet wrap 1 over Viking"],
  ["wrap3", T.wrap3, { pos: [GX.netw + 2.4, 1.0, 3.6], look: [GX.netw, 0.55, 0], fov: 36 }, "policenet wrap 1, 3/4"],
  ["cVik", T.cVik, close(GX.maskF - SP, 0.72), "close: Viking, shocked"],
  ["cPhx", T.cPhx, close(GX.maskF, 0.72), "close: Phoenix, angry"],
  ["cRea", T.cRea, close(GX.maskF + SP, 0.72), "close: Reaper, shocked"],
  ["cVik3", T.cVik3, close(GX.mask34 - SP, 0.72), "close: Viking 3/4, angry"],
  ["cSam", T.cSam, close(GX.cap - SP, 0.85), "close: Samurai's cap"],
  ["cGod", T.cGod, close(GX.cap, 0.85), "close: the god's cap"],
  ["cDra", T.cDra, close(GX.cap + SP, 0.85), "close: Dragon's cap"],
  ["cGodS", T.cGodS, close(GX.capS, 0.85), "close: the god's cap, side"],
  ["net0", T.net0, { pos: [GX.net - 0.95, 0.5, 1.7], look: [GX.net - 0.95, 0.14, 0], fov: 30 }, "policenet open 0: the bundle"],
];
console.log("stills:", SHOTS.map(([, t]) => r3(t + 0.55)).join(","));
for (const [, t, , label] of SHOTS) c.cap(t, t + 0.9, label, 240, false, { kinetic: false });

write(import.meta.url, {
  id: "heist-props", title: "Heist props bench", idea: "Props bench for Fight, Flight or Freeze 01 (eyemask, policecap, moneybag, riotshield, policetorch, policenet), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#5b6376", floor: "#3f4655" }, music: false, sound: { auto: false },
  hook: { show: ["vikF", "mask-vikF"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map(([n, t, s]) => [n, t, s]), END),
  notes: "Generated by storyboards/series/fight-flight-freeze/01-bank-robbery/bench/make-heist-props.mjs (props bench, no reviews).",
});
