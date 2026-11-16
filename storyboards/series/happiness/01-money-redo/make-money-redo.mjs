// SPEND $10,000,000 BEFORE SUNSET (Happiness 01 "Does money make you happy?", the full redo from the 15 Nov lessons).
// Jonny 15 Nov 2026: "go" on OUTLINE.md (13:40 Berlin), "the panels are good" on money-redo-sheet-1/2.png (18:25).
// Opener A (the contest runs at frame 0). Looks: DESIGN.md (Fable 5.2). Takes, cut list, score plan: NOTES.md.
//   node storyboards/series/happiness/01-money-redo/make-money-redo.mjs          -> money-redo.json
//   ... --no-vo -> money-redo-no-vo.json (staging without the speech model)
//
// THE CHAIN (but / therefore, one feeling per beat)
//   01-03 Spud and Chip can't pay one coffee; the Duchess slaps a $10,000,000 check down: spend it all by sunset or keep
//         nothing (disbelief). THEREFORE 04 he buys the whole coffee cart (joy). BUT 05 the mountain barely moves: a dollar a
//         second takes 115 days (comic panic). THEREFORE 06-08 he buys big: the car, the coat, the mansion (top). BUT Chip
//         keeps tugging "come, I know a place!", "no time!" three times (sympathy) THEREFORE 09 Chip walks off up the hill
//         (sadness). BUT 10 alone in the car he isn't smiling (emptiness); 11 one million left, one minute, the yacht (stress).
//         BUT 12-14 from the road he sees Chip alone on the hill: the handbrake (the choice). THEREFORE 15-16 he leaves the
//         coat in the car and climbs; the counter hits 0:00, the tow truck takes everything (loss). 17-20 Chip's place is the
//         sunset; Spud smiles (warmth). The question is never answered out loud.
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud } from "../../../lib/overlay.mjs";
import * as grips from "../../../lib/grips.mjs";
import { COAST } from "../../../../engine/page/set-coast.js";
import { SHOWROOM } from "../../../../engine/page/set-showroom.js";
import { BOUTIQUE } from "../../../../engine/page/set-boutique.js";
import { HARBOUR } from "../../../../engine/page/props-harbour.js";
import { TOW } from "../../../../engine/page/props-tow.js";
import { RIDE_OFF } from "../../../../engine/page/props-coupe.js";

// ---------------------------------------------------------------- the template's picks
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
const PRE = 0.012;
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- the beats (video s), cut list v1 from the farm's takes
const T = {
  // v2 (Jonny 16 Nov 06:34): $1 billion in a week. Day 1 = 01-05, day 2 = 06, 3 = 07, 4 = 08, 5 = 09, 6 = 11 (the yacht),
  // the plane, 10 (alone in the car); day 7 = 12-20. The beats after 06 run in this order: 09, 11, plane, 10, 12 ...
  p01: 0, slap: 0.2, p02: 3.4, p03: 4.3, duch: 4.45, p04: 6.5, pay: 6.9, p05: 9.3, p06: 14.0, chip1: 16.05, p07: 17.1,
  tug1: 17.2, no1: 17.6, p08: 19.3, come2: 20.55, no2: 21.35, p09: 22.1, p11: 24.8, sign: 25.2, yw: 26.2, plane: 27.2, p10: 29.0,
  p12: 31.3, p13: 35.3, p14: 37.2, brake: 37.5, p15: 38.9, p16: 40.7, zero: 41.5, p17: 43.0, p18: 44.8, p19: 47.4, lean: 48.6,
  p20: 50.6, follow: 51.2, END: 54.6,
};
const END = T.END;

// ---------------------------------------------------------------- places (one world; rooms far apart, cameras cut between them)
const SR = [300, 0, 0], BQ = [500, 0, 0], CP = [0, 0, -600];
const add = (o) => (p) => [r3(p[0] + o[0]), r3(p[1] + o[1]), r3(p[2] + o[2])];
const sw = add(SR), bw = add(BQ), cw = add(CP);
const ENVS = { city: "golden-city-crossing", mday: "mansion-day" };
const PLACES = [[0, "city"], [T.p06, "show"], [T.p07, "bout"], [T.p08, "mday"], [T.p09, "coast"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];
const PITCH = Object.fromEntries(Object.entries(ENVS).map(([k, n]) => [k, JSON.parse(fs.readFileSync(new URL(`../../../../assets/environments/${n}/env.json`, import.meta.url))).eye.pitch]));
const shot = (env, pos, { pan = 0, tilt = 0, fov = 44 } = {}) => {
  const yaw = rad(pan), pit = rad(-PITCH[env] + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const push = (sh, k, dur) => ({ ...sh, to: { pos: sh.pos.map((v, j) => r3(v + (sh.look[j] - v) * k)), look: sh.look, fov: sh.fov }, dur, ease: "inOut" });

// the coupe on the coast road: a car frame (x, y, z) -> world, for a car at `at` turned `rot`
const carW = ([x, y, z], at, rot = 90) => { const a = rad(rot); return [r3(at[0] + x * Math.cos(a) + z * Math.sin(a)), r3(at[1] + y), r3(at[2] - x * Math.sin(a) + z * Math.cos(a))]; };
const road = (x) => { const r = COAST.roadAt(x); return [r3(CP[0] + x), r3(CP[1] + r.y), r3(CP[2] + r.z)]; };
const roadYaw = (x) => { const a = COAST.roadAt(x - 0.5), b = COAST.roadAt(x + 0.5); return r3(90 - (Math.atan2(b.z - a.z, 1) * 180) / Math.PI); };

// ---------------------------------------------------------------- cast
const PARK = (k) => [400 + k * 3, 400];
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: [0, 0], face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "rich", character: "potatobrawl/spud-rich", at: PARK(1), face: 0, expr: "kind", follow: 0.3, seed: 2.2 },
  { id: "chip", character: "potatobrawl/chip", at: PARK(3), face: 0, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "duch", character: "potatobrawl/duchess", at: PARK(4), face: 0, expr: "delighted", follow: 0.3, seed: 3.1 },
  { id: "rosti", character: "potatobrawl/rosti", at: PARK(5), face: 0, expr: "kind", follow: 0.3, seed: 6.1 },
  { id: "seller", character: "potatobrawl/carseller", at: PARK(6), face: 0, expr: "kind", follow: 0.3, seed: 7.2 },
  { id: "asst", character: "potatobrawl/assistant", at: PARK(7), face: 0, expr: "kind", follow: 0.3, seed: 8.3 },
  { id: "agent", character: "potatobrawl/agent", at: PARK(8), face: 0, expr: "kind", follow: 0.3, seed: 9.1 },
];
const ids = new Set(cast.map((x) => x.id));
const place = (t, who, at, yaw, y = 0) => {
  const u = Math.max(0, r3(t - PRE));
  A(u, who, "move", { to: at, y, dur: 0.01, steps: 0, ease: "linear", sync: true });
  if (yaw != null) A(u, who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
  A(u, who, "show");
};
const park = (t, who, k) => { const u = Math.max(0, r3(t - PRE)); A(u, who, "hide"); A(u, who, "move", { to: PARK(k), y: 0, dur: 0.01, steps: 0, ease: "linear", sync: true }); };
const look = (t, who, to, dur = 0.18) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const arm = (t, who, side, pose, dur = 0.25, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.1) => A(r3(t), who, "grip", { side, shape, dur });
const rest = (t, who) => { for (const s of ["R", "L"]) { arm(t - PRE, who, s, "rest", 0.01); grip(t - PRE, who, s, "relaxed", 0.01); } };
const SUBY = 480;   // under the HUD strip (y 344-462), inside the app safe zone, still in the upper third   // speech + narrator lettering on top (DESIGN 10: caption band y 210-330, the HUD under it)
const say = (t, who, line, dur, tone, pos = SUBY) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos });
const yawTo = (from, to) => r3((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI);

// ---------------------------------------------------------------- props, each in its place (shown only while its place is up)
const props = [];
const P = (where, spec, { from = 0, to = 99, stay = false } = {}) => { props.push({ ...spec, _place: where, _from: from, _to: to, _stay: stay }); return spec; };
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.01, ease = "linear") => { if (has(id)) c.prop(r3(t), id, set, dur, ease); };

// ---- the city at noon (01-05): the coffee cart, the check, the coins, the bag mountain
// Rosti behind his counter, the Duchess at its left end, Spud and Chip at its right (DESIGN 4: the check between them)
const CITY = { cart: [-1.25, 1.0], rosti: [-1.25, -0.1], spud: [-0.55, 1.2], chip: [0.2, 1.66], duch: [-1.98, 1.5] };
P("city", { id: "cart", kind: "coffeecart", x: CITY.cart[0], z: CITY.cart[1], rot: 0 });
P("city", { id: "apron", kind: "apron", wear: "rosti", x: 0, y: 0, z: 0 });
P("city", { id: "phat", kind: "paperhat", wear: "rosti", x: 0, y: 0, z: 0 });
const CHECK = [-1.43, 0.465, 1.2];
P("city", { id: "check", kind: "bigcheck", amount: "$1,000,000,000", x: CHECK[0], y: CHECK[1], z: CHECK[2], rot: 90, slap: 0, corner: [1, 1] }, { to: T.p04 });
const COINS = [0, 1, 2].map((i) => P("city", { id: `coin${i}`, kind: "coin", x: 0, y: -30, z: 0, scale: 0.35, flat: 1 }, { to: T.p03, stay: true }));
const BRICK = P("city", { id: "brick", kind: "cashbrick", ...grips.placeFor("cashbrick", [-1.05, 0.46, 1.25], -65) }, { from: T.p04, to: T.p05 });
const SM = [0.1, 0.4], SM_YAW = 10;
const CUP = P("city", { id: "cup", kind: "cocoacup", ...grips.placeFor("cocoacup", [-0.06, 0.4, 0.68], SM_YAW) }, { from: T.p05 });
const MOUNT = [0.0, 0, -2.4];
P("city", { id: "mount", kind: "bagmountain", x: MOUNT[0], y: 0, z: MOUNT[2], rot: 0, gap: 1, shed: 0 }, { from: T.p05 });
P("city", { id: "sun03", kind: "sundisc", az: -6, el: 25, r: 1.1 }, { from: T.p03, to: T.p04 });
// ---- the showroom (06)
const SCAR = sw([1.6, 0, -0.3]), SCAR_ROT = 0;   // nose to the lens (+z)
P("show", { id: "scar", kind: "coupe", x: SCAR[0], y: 0, z: SCAR[2], rot: SCAR_ROT, load: 0, lamp: 0.3 });
const SSACK = [r3(SCAR[0] - 0.3), 0.67, r3(SCAR[2] + 2.05)];   // on the bonnet (DESIGN 6: car frame [-0.3, 0.67, 2.05])
P("show", { id: "ssack", kind: "moneybag", mark: false, x: SSACK[0], y: 0, z: SSACK[2], rot: 20, staged: "slammed onto the bonnet by Spud" }, { stay: true });
P("show", { id: "keys", kind: "carkeys", x: 0, y: 0.55, z: 0, staged: "held out in the seller's fingers" });
P("show", { id: "scap", kind: "flatcap", wear: "seller", x: 0, y: 0.84, z: 0, r: 0.24 });
P("show", { id: "sbow", kind: "bowtie", wear: "seller", x: 0, y: 0.34, z: 0.36 });
// ---- the boutique (07)
["b1", "b2", "b3"].forEach((id, i) => P("bout", { id, kind: "gift", w: 0.3, h: 0.12, color: ["#f2b8c6", "#f4ead8", "#c9a6e8"][i], ribbon: "#d9b24a", x: 0, y: -30, z: 0 }, { stay: true }));
// ---- the mansion (08)
const MD = { car: [2.0, -10.5], spud: [0.0, -6.5], agent: [1.05, -7.0], chip: [-0.9, -7.3] };
P("mday", { id: "mcar", kind: "coupe", x: MD.car[0], z: MD.car[1], rot: 80, load: 0.4, rain: 0 }, { to: T.p09 });
P("mday", { id: "fountain", kind: "fountain", x: -3.2, z: -11.5 });
P("mday", { id: "clip", kind: "clipboard", x: 0, y: -30, z: 0, staged: "in the agent's hand" }, { stay: true });
P("mday", { id: "pen", kind: "feltpen", color: "#1b1a20", cap: "#c9a24a", x: 0, y: -30, z: 0, staged: "in Spud's hand" }, { stay: true });
// ---- the coast (09-20): the coupe, the harbour kit, the tow truck, the coat on the seat
const X10 = -40, X12 = [-34, -6];
const CAR2 = cw(COAST.CARSTOP2);
P("coast", { id: "car", kind: "coupe", x: road(X10)[0], y: road(X10)[1], z: road(X10)[2], rot: roadYaw(X10), load: 0.4, lamp: 0, door: 0, brake: 0 });
const PILE = [[-0.46, 0.46, -0.25, 0], [-0.44, 0.58, -0.27, 12], [-0.48, 0.70, -0.24, -8]];
P("coast", { id: "pier", kind: "pier", ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, cw(HARBOUR.H)[i]])), rot: 0, stand: true });
{ const yt = cw(HARBOUR.at(HARBOUR.YACHT.at ?? [-2.4, 0, -31])); P("coast", { id: "yacht", kind: "yacht", x: yt[0], y: yt[1], z: yt[2], rot: 0, refl: "stern" }); }
P("coast", { id: "hclip", kind: "clipboard", x: 0, y: -30, z: 0, staged: "on the signing stand" }, { stay: true });
const TRUCK_X0 = 30, TRUCK_DRIVE = 9;   // the truck stands east of CARSTOP2 facing +x (it pulls the coupe away east)
{ const r = road(COAST.CARSTOP2[0] + 5.2); P("coast", { id: "truck", kind: "towtruck", x: r[0], y: r[1], z: r[2], rot: 90, lights: 1, len: 0 }, { from: T.p16 }); }
P("coast", { id: "coat", kind: "coatheap", x: 0, y: -30, z: 0, door: 0 }, { from: T.p15, to: T.p16, stay: true });
P("coast", { id: "gulls", kind: "gulls", x: CP[0], y: CP[1], z: CP[2] }, { from: T.p17 });

// prime every key that is first tweened later (an unseeded tween writes NaN)
pr(0, "check", { slap: 0 }); pr(0, "mount", { shed: 0, gap: 1 });
pr(0, "car", { rain: 0, wiper: 0, wiped: 0, gauge: 1, quiver: 0, cough: 0, lamp: 0, load: 0.4, door: 0, brake: 0 });
pr(0, "scar", { rain: 0, lamp: 0.3, load: 0, door: 0 }); pr(0, "mcar", { rain: 0, load: 0.4 });
pr(0, "truck", { lights: 1, len: 0 }); pr(0, "coat", { door: 0 }); pr(0, "fountain", { on: 1 });

// show each prop only while its place is up and inside its own from-to (hidden = tiny and 30 m under the floor)
function hideOffstage() {
  for (const p of props) {
    const mine = (name) => p._place === "all" || p._place.split("+").includes(name);
    const on = (t) => mine(placeAt(t)) && t >= p._from - 1e-6 && t < p._to - 1e-6;
    const full = p.scale ?? 1, y0 = p.y ?? 0, away = (now) => ({ scale: now ? full : 0.001, ...(!p.wear && !p._stay && { y: now ? y0 : -30 }) });
    let was = on(0);
    if (!was) Object.assign(p, away(false));
    const times = [...new Set([...PLACES.slice(1).map(([at]) => at), p._from, p._to])].filter((t) => t > 0 && t < END).sort((x, y) => x - y);
    for (const t of times) { const now = on(t); if (now !== was) c.at(r3(t - PRE), { do: "prop", id: p.id, set: away(now), dur: 0.01, ease: "linear", reason: "off the set between scenes: hidden and parked under the floor on the cut" }); was = now; }
  }
}

// ================================================================= 01-03 THE CHECK (0-6.5): no coffee money; ten million
place(0, "spud", CITY.spud, -65); place(0, "chip", CITY.chip, -55); place(0, "rosti", CITY.rosti, 0); place(0, "duch", CITY.duch, 65);
for (const w of ["spud", "chip", "rosti", "duch"]) rest(0, w);
expr(0, "spud", "sad", { curve: -0.2, brow: 0.4 }, 0.01); expr(0, "chip", "worried", { brow: 0.4 }, 0.01); expr(0, "rosti", "kind", { curve: 0.1 }, 0.01);
expr(0, "duch", "delighted", { curve: 0.6 }, 0.01);
// Spud's open palm with three coins, held out toward the seller
const PALM = [-0.84, 0.54, 1.38];
arm(0 - PRE, "spud", "L", { world: PALM }, 0.01); grip(0 - PRE, "spud", "L", "open", 0.01);
COINS.forEach((cn, i) => pr(r3(0 - PRE + i * 0.001), cn.id, { x: r3(PALM[0] + (i - 1) * 0.035), y: r3(PALM[1] + 0.03), z: r3(PALM[2] + 0.01 * i), scale: 0.35 }));
look(0, "spud", [-0.2, -0.3], 0.01); look(0, "chip", [-0.4, -0.2], 0.01);
// the Duchess's gloved hand slaps the check flat on the counter (frame 0 = the trouble)
A(0, "duch", "lean", { to: 12, dur: 0.01 });
arm(0 - PRE, "duch", "L", { world: [CHECK[0] - 0.04, 0.62, CHECK[2] - 0.02] }, 0.01); grip(0 - PRE, "duch", "L", "flat", 0.01);
arm(T.slap - 0.1, "duch", "L", { world: [CHECK[0] - 0.04, 0.52, CHECK[2] - 0.02] }, 0.1, "in");
pr(T.slap, "check", { slap: 1 }, 0.1667, "linear");
sfx(T.slap, "slap", { gain: 0.5, reason: "her palm slaps the check flat on the wooden counter" });
arm(T.slap + 0.5, "duch", "L", "rest", 0.5); A(T.slap + 0.5, "duch", "lean", { to: 0, dur: 0.5 });
expr(T.slap + 0.05, "spud", "shocked", { open: 0.4, eye: 1.3 }, 0.12); expr(T.slap + 0.1, "chip", "shocked", { open: 0.45, eye: 1.3 }, 0.12);
look(T.slap + 0.05, "spud", [-0.3, -0.5], 0.12); look(T.slap + 0.1, "chip", [-0.5, -0.5], 0.12);
look(T.slap + 0.05, "rosti", [0.4, -0.4], 0.15);
see(0, T.p02, ["spud.face", "chip.face", "duch.face", "check", "cart"], "noon at a coffee cart: Spud holds out three coins; a rich lady slaps a $10,000,000 check on the counter");
// 02: the gasp, the coins fall
COINS.forEach((cn, i) => { const t0 = r3(T.p02 + 0.15 + i * 0.1); pr(t0, cn.id, { y: 0.02, x: r3(PALM[0] + (i - 1) * 0.06), z: r3(PALM[2] + 0.06 * i) }, 0.3, "in"); });
sfx(T.p02 + 0.45, "coins", { gain: 0.35, reason: "three coins hit the cobbles" });
grip(T.p02 + 0.1, "spud", "L", "relaxed", 0.15); arm(T.p02 + 0.12, "spud", "L", { world: [PALM[0] + 0.05, 0.42, PALM[2] + 0.05] }, 0.3);
A(T.p02 + 0.05, "spud", "squash", { amount: 0.06, dur: 0.25 }); A(T.p02 + 0.1, "chip", "hop", { height: 0.05, dur: 0.25, quiet: true });
A(T.p02 - PRE, "spud", "turn", { to: -30, dur: 0.01 }); A(T.p02 - PRE, "chip", "turn", { to: -25, dur: 0.01 });
A(T.p03 - PRE, "spud", "turn", { to: -65, dur: 0.01 }); A(T.p03 - PRE, "chip", "turn", { to: -55, dur: 0.01 });
see(T.p02, T.p03, ["spud.face", "chip.face"], "close: both stare down at the check, mouths open, his coins fall");
// 03: she points up at the high noon sun: spend it all by sunset
arm(T.p03 + 0.1, "duch", "R", "up", 0.3, "out"); grip(T.p03 + 0.1, "duch", "R", "point", 0.15);
expr(T.p03, "duch", "smug", { curve: 0.5, brow: -0.2 }, 0.2); look(T.p03 + 0.1, "duch", [0.1, 0.6], 0.2);
look(T.p03 + 0.25, "spud", [0.2, 0.7], 0.25); look(T.p03 + 0.35, "chip", [0.1, 0.7], 0.25);
say(T.duch, "duch", "Spend it all in seven days... or keep nothing.", 1.8, "smug");
see(T.p03, T.p04, ["duch.face", "spud", "chip"], "low angle: the Duchess points up at the noon sun; Spud and Chip look up with her");

// ================================================================= 04 THE CART (6.5-9.3): his first buy
place(T.p04, "duch", PARK(4), 0); park(T.p04, "duch", 4);
const hb = grips.box(c, "spud", BRICK);
{ let t = hb.take(T.p04 + 0.05, { reach: 0.25, settle: 0.12 }); t = hb.carry(Math.max(t, T.pay - 0.05), [-1.32, 0.46, 1.08], 0.45); hb.release(t + 0.05); }
look(T.p04, "rosti", [0.5, -0.4], 0.15);
expr(T.pay + 0.45, "rosti", "shocked", { open: 0.35, eye: 1.3 }, 0.15);
sfx(T.pay + 0.42, "kenney/book-place", { gain: 0.3, reason: "the bundle of notes lands in his palms" });
// Spud's right hand takes the cart's handle: he bought the whole cart
arm(T.pay + 1.1, "spud", "L", { world: [-0.98, 0.52, 1.46] }, 0.35); grip(T.pay + 1.1, "spud", "L", "flat", 0.15);   // pats his cart: it's his now
expr(T.pay + 0.5, "spud", "delighted", { curve: 0.8, open: 0.3 }, 0.2);
for (const k of [0, 1, 2]) A(r3(T.pay + 0.7 + k * 0.38), "chip", "hop", { height: 0.12, dur: 0.32 });
for (const s of ["R", "L"]) { arm(T.pay + 0.65, "chip", s, "up", 0.2, "out"); grip(T.pay + 0.65, "chip", s, "fist", 0.1); }
expr(T.pay + 0.6, "chip", "delighted", { curve: 0.9, open: 0.6 }, 0.15);
see(T.p04, T.p05, ["spud.face", "rosti.face", "chip.face", "cart"], "he pushes a stack of notes into the seller's hands and grabs the cart's handle: he bought the whole cart; Chip jumps for joy");

// ================================================================= 05 THE MOUNTAIN (9.3-14.0): a dollar a second
park(T.p05, "rosti", 5); park(T.p05, "chip", 3);
place(T.p05, "spud", SM, SM_YAW); rest(T.p05, "spud");
const hc = grips.mug(c, "spud", CUP, { side: "R" });
hc.take(T.p05 - 0.006, { reach: 0.005, settle: 0.005 });
expr(T.p05, "spud", "delighted", { curve: 0.5 }, 0.01); look(T.p05, "spud", [0, 0], 0.01);
hc.carry(T.p05 + 0.3, [-0.02, 0.52, 0.66], 0.45);   // the sip
pr(T.p05, "mount", { shed: 1 }, 1.3, "linear");
look(T.p05 + 1.1, "spud", [0.2, 0.8], 0.4);   // up at the gap: one bag gone
expr(T.p05 + 1.4, "spud", "shocked", { open: 0.15, eye: 1.4 }, 0.2);
hc.carry(T.p05 + 1.5, [-0.05, 0.46, 0.68], 0.3);   // the cup comes down
A(T.p05 + 2.6, "spud", "turn", { to: -10, dur: 0.4 }); look(T.p05 + 2.8, "spud", [0, 0.1], 0.2);   // to us: 115 days
expr(T.p05 + 3.0, "spud", "worried", { brow: 0.7, open: 0.2 }, 0.2);
see(T.p05, T.p06, ["spud.face", "mount"], "he sips his coffee in front of a mountain of money bags taller than the shops; one bag is gone from the top");

// ================================================================= 06 THE SHOWROOM (14.0-17.1): he buys the car; Chip at the window
A(r3(T.p06 - 0.02), "spud", "release", { prop: "cup", dur: 0 });
const S6 = sw([-0.15, 0, 1.75]), SEL = sw([-1.1, 0, 1.0]), CWIN = sw([0.4, 0, -2.75]), CPALM = sw([0.4, 0.3, -2.31]);
place(T.p06, "rich", [S6[0], S6[2]], 35);
park(T.p06, "spud", 0); rest(T.p06, "rich");
place(T.p06, "seller", [SEL[0], SEL[2]], yawTo([SEL[0], SEL[2]], [S6[0], S6[2]])); rest(T.p06, "seller");
place(T.p06, "chip", [CWIN[0], CWIN[2]], 0); rest(T.p06, "chip");
expr(T.p06, "rich", "delighted", { curve: 0.7 }, 0.01); expr(T.p06, "seller", "kind", { curve: 0.5 }, 0.01); expr(T.p06, "chip", "eager", { curve: 0.5, eye: 1.1 }, 0.01);
// the sack goes down on the bonnet (from his arms), the seller bows and holds out the keys


for (const s of ["R", "L"]) { arm(T.p06 + 0.1, "rich", s, "hips", 0.35); }   // proud: hands on his hips by the car he paid for
A(T.p06 + 0.5, "seller", "lean", { to: 6, dur: 0.3 });
const SEL_YAW = yawTo([SEL[0], SEL[2]], [S6[0], S6[2]]), SF = [Math.sin(rad(SEL_YAW)), Math.cos(rad(SEL_YAW))];
const KEYS = props.find((p) => p.id === "keys");
Object.assign(KEYS, grips.placeFor("carkeys", [r3(SEL[0] + SF[0] * 0.3 - SF[1] * 0.12), 0.42, r3(SEL[2] + SF[1] * 0.3 + SF[0] * 0.12)], SEL_YAW), { y: 0.42 });
const hk = grips.thin(c, "seller", KEYS, { side: "R" });
{ const t = hk.take(T.p06 - 0.006, { reach: 0.005, settle: 0.005 }); hk.carry(T.p06 + 0.5, [r3(SEL[0] + SF[0] * 0.42 - SF[1] * 0.1), 0.47, r3(SEL[2] + SF[1] * 0.42 + SF[0] * 0.1)], 0.35); }
// Chip outside the glass: palm on the pane, then points at the hill behind him
arm(T.p06 + 0.2, "chip", "L", { world: CPALM }, 0.3); grip(T.p06 + 0.2, "chip", "L", "flat", 0.1);
arm(T.chip1 - 0.3, "chip", "R", "up", 0.3, "out"); grip(T.chip1 - 0.3, "chip", "R", "point", 0.1);
say(T.chip1, "chip", "Come! I know a place!", 0.75, "excited");
for (const k of [0, 1]) A(r3(T.chip1 + 0.1 + k * 0.4), "chip", "hop", { height: 0.06, dur: 0.3, quiet: true });
look(T.chip1 + 0.2, "rich", [0.5, 0.0], 0.2);   // he hears, he doesn't look
see(T.p06, T.p07, ["rich.face", "seller", "scar", "chip.face"], "a showroom: he slams a money bag on the gold car, the seller hands him the keys; outside the window Chip points at a green hill");

// ================================================================= 07 THE BOUTIQUE (17.1-18.6): the coat; the first tug
// the lens stands in the mirror box (the glass is an opening, twin 1, no twin actor): we are the mirror he admires
const SB = bw(BOUTIQUE.SPUD), CB = bw([0.0, 0, -0.52]);
park(T.p07, "seller", 6); A(r3(T.p07 - 0.02), "seller", "release", { prop: "keys", dur: 0 });
place(T.p07, "rich", [SB[0], SB[2]], BOUTIQUE.SPUD_FACE); rest(T.p07, "rich");
place(T.p07, "chip", [CB[0], CB[2]], yawTo([CB[0], CB[2]], [SB[0], SB[2]])); rest(T.p07, "chip");
const AS = bw(BOUTIQUE.ASSISTANTS[0]);
place(T.p07, "asst", [AS[0], AS[2]], 20); rest(T.p07, "asst");
expr(T.p07, "rich", "smug", { curve: 0.6, eye: 0.7 }, 0.01);
// he admires himself: hand up to the chain (the twin mirrors it on the other side)
for (const [w, s] of [["rich", "R"]]) { arm(T.p07 + 0.1, w, s, "up", 0.35, "out"); grip(T.p07 + 0.1, w, s, "open", 0.1); }
// Chip tugs the cuff with both hands, points at the door
const CUFF = [r3(SB[0] - 0.3), 0.4, r3(SB[2] - 0.36)];   // his left cuff (he faces the mirror, 125 deg)
for (const s of ["R", "L"]) { arm(T.tug1, "chip", s, { world: [r3(CUFF[0] - (s === "R" ? 0.03 : -0.03)), CUFF[1], CUFF[2]] }, 0.2); grip(T.tug1, "chip", s, "fist", 0.1); }
for (const k of [0, 1]) A(r3(T.tug1 + 0.2 + k * 0.22), "chip", "lean", { to: k % 2 ? 4 : -8, dur: 0.2 });
expr(T.tug1, "chip", "eager", { curve: 0.3, brow: 0.5 }, 0.15);
// no line here: the narrator says "Every day, his best friend asked." over the wave-off (one voice at a time)
arm(T.no1, "rich", "L", { world: [r3(SB[0] - 0.3), 0.6, r3(SB[2] - 0.38)] }, 0.2, "out"); grip(T.no1, "rich", "L", "flat", 0.1);   // waves him off, eyes on the mirror
for (const s of ["R", "L"]) { arm(T.no1 + 0.3, "chip", s, "rest", 0.4); grip(T.no1 + 0.3, "chip", s, "relaxed", 0.2); }
expr(T.no1 + 0.3, "chip", "sad", { curve: -0.1, brow: 0.5 }, 0.3);
see(T.p07, T.p08, ["rich.face", "chip.face"], "a boutique: Spud in a fur coat admires himself in a gold mirror; Chip tugs his sleeve; he waves him off");

// ================================================================= 08 THE MANSION (18.6-20.6): he signs; Chip's arm drops
park(T.p08, "asst", 7);
place(T.p08, "rich", MD.spud, 65); rest(T.p08, "rich");
place(T.p08, "agent", MD.agent, -60); rest(T.p08, "agent");
place(T.p08, "chip", MD.chip, 45); rest(T.p08, "chip");
const CLIP = [r3(MD.agent[0] - 0.2), 0.42, r3(MD.agent[1] + 0.18)];
arm(T.p08 - PRE, "agent", "L", { world: CLIP }, 0.01); grip(T.p08 - PRE, "agent", "L", "hold", 0.01);
pr(T.p08 - PRE, "clip", { x: CLIP[0], y: r3(CLIP[1] - 0.14), z: CLIP[2], rot: yawTo(MD.agent, MD.spud), face: 1 });
A(r3(T.p08 - 0.006), "agent", "grab", { prop: "clip", hand: "L", grip: [-0.12, 0.16, 0], dur: 0, pose: null });
arm(T.p08 + 0.1, "rich", "L", { world: [r3(CLIP[0] - 0.12), 0.62, r3(CLIP[2] + 0.08)] }, 0.35);
for (const k of [0, 1, 2]) arm(r3(T.p08 + 0.5 + k * 0.22), "rich", "L", { world: [r3(CLIP[0] - 0.12 + (k % 2 ? 0.04 : -0.03)), 0.6, r3(CLIP[2] + 0.08)] }, 0.2);
say(T.come2, "chip", "Come on!", 0.7, "pleading");
arm(T.come2, "chip", "R", "up", 0.25, "out"); grip(T.come2, "chip", "R", "open", 0.1);
expr(T.come2, "chip", "eager", { brow: 0.6 }, 0.15);
say(T.no2, "rich", "No time!", 0.7, "annoyed");
arm(T.no2 + 0.4, "chip", "R", "rest", 0.5); expr(T.no2 + 0.3, "chip", "sad", { curve: -0.3, brow: 0.5 }, 0.4); look(T.no2 + 0.4, "chip", [0, -0.4], 0.4);
see(T.p08, T.p09, ["rich", "agent.face", "chip.face", "mcar"], "in front of a white mansion he signs the deed on the agent's clipboard; behind him Chip's raised arm drops, his smile fades");

// ================================================================= 09 CHIP WALKS OFF (20.6-22.9): late afternoon, the hill
park(T.p09, "rich", 1); park(T.p09, "agent", 8);
A(r3(T.p09 - 0.02), "agent", "release", { prop: "clip", to: [0, -30, 0], dur: 0 });
const C9A = cw([1.3, 0, 7.0]), C9B = cw([1.1, 0, 5.2]);
place(T.p09, "chip", [C9A[0], C9A[2]], 180, r3(CP[1] + COAST.heightAt(1.3, 8.0))); rest(T.p09, "chip");
expr(T.p09, "chip", "sad", { curve: -0.35, brow: 0.5 }, 0.01); look(T.p09, "chip", [0, -0.3], 0.01);
look(T.p09 - 0.1, "chip", [0, -0.3], 0.1);
A(T.p09 + 0.05, "chip", "move", { to: [C9B[0], C9B[2]], y: r3(CP[1] + COAST.heightAt(1.1, 5.2)), dur: 2.2, steps: 6 });
look(T.p09 + 1.3, "chip", [0.8, 0.0], 0.3); look(T.p09 + 1.9, "chip", [0, -0.3], 0.3);   // one look back
park(T.p11, "chip", 3);
see(T.p09, T.p11, ["chip"], "late afternoon: Chip walks away alone up a path toward the cliff hill, looks back once");

// ================================================================= 10 ALONE IN THE CAR (22.9-25.0)
const CARP = road(X10), CYAW = roadYaw(X10);
place(T.p10, "rich", [CARP[0], CARP[2]], CYAW, CARP[1]);
A(r3(T.p10 - PRE), "rich", "ride", { prop: "car", off: [RIDE_OFF[0], r3(RIDE_OFF[1] + 0.08), RIDE_OFF[2]], yaw: 0, sit: true, dur: 0 });
for (const s of ["R", "L"]) { arm(T.p10 - PRE, "rich", s, "wheel", 0.01); grip(T.p10 - PRE, "rich", s, "hold", 0.01); }
expr(T.p10, "rich", "sad", { curve: -0.1, brow: 0.3, eye: 0.85 }, 0.01); look(T.p10, "rich", [0.1, 0], 0.01);
pr(T.p10, "car", { len: 3 }, r3(T.p12 - T.p10), "linear");
A(T.p10 + 1.0, "rich", "blink", { dur: 0.45 }); look(T.p10 + 1.3, "rich", [-0.45, 0], 0.4);   // at the empty seat piled with boxes
see(T.p10, T.p12, ["rich.face"], "evening of day 6: alone in the gold car, the seat beside him piled with boxes where Chip sat; his face empty");

// ================================================================= 11 THE YACHT (day 6): "So he bought a yacht." He signs at the Duchess's stand
const DU = cw(HARBOUR.at([0.62, 1.35, -9.05])), RY = cw(HARBOUR.at([-0.1, 1.35, -8.2])), STANDW = cw(HARBOUR.at(HARBOUR.STAND.surface.pos));
place(T.p11, "duch", [DU[0], DU[2]], -35, DU[1]); rest(T.p11, "duch");
place(T.p11, "rich", [RY[0], RY[2]], 45, RY[1]); rest(T.p11, "rich");
expr(T.p11, "duch", "smug", { curve: 0.5 }, 0.01); look(T.p11, "duch", [-0.5, -0.2], 0.01);
expr(T.p11, "rich", "smug", { curve: 0.6, eye: 0.8 }, 0.01); look(T.p11, "rich", [0.5, 0.05], 0.01);   // signs without looking down (smug; the hat brim hides his eyes when he looks down)
// his left hand (the stand side, so the arm never crosses his face) signs on the stand's tilted top (three strokes), then he spreads his arms at his yacht
arm(T.sign - 0.2, "rich", "L", { world: [r3(STANDW[0] - 0.08), r3(STANDW[1] + 0.11), r3(STANDW[2] + 0.04)] }, 0.3); grip(T.sign - 0.2, "rich", "L", "tip", 0.15);
for (const k of [0, 1, 2]) arm(r3(T.sign + 0.15 + k * 0.2), "rich", "L", { world: [r3(STANDW[0] - 0.08 + (k % 2 ? 0.05 : 0)), r3(STANDW[1] + 0.10), r3(STANDW[2] + 0.04)] }, 0.18);
for (const s of ["R", "L"]) { arm(T.sign + 0.75, "rich", s, "up", 0.35, "out"); grip(T.sign + 0.75, "rich", s, "open", 0.15); }
look(T.sign + 0.7, "rich", [-0.6, 0.2], 0.3); expr(T.sign + 0.75, "rich", "delighted", { curve: 0.8 }, 0.2);
see(T.p11, T.yw, ["rich.face", "duch.face"], "day 6, a harbour: Spud signs for a yacht at the Duchess's stand and throws his arms up");
see(T.yw, T.p10, ["yacht"], "the white yacht he just bought, side-on in full at sunset; then his private jet roars low over it");

// ================================================================= THE PLANE (day 6): "And a plane." His jet roars low over the yacht
// (the airliner of the plane-crash film at a private jet's size; flying, so no landing gear or terrain to fit)
{ const J0 = cw(HARBOUR.at([30, 3.5, -62])), J1 = cw(HARBOUR.at([-34, 15, -62]));   // climbing out from behind the yacht
  P("coast", { id: "jet", kind: "airliner", x: J0[0], y: J0[1], z: J0[2], rot: -90, roll: 0, tip: -10, scale: 0.3, cyan: -1, lit: 1, spin: 1 }, { from: T.yw, to: T.p10 });
  pr(r3(T.yw + 0.05), "jet", { x: J1[0], y: J1[1], z: J1[2] }, r3(T.p10 - T.yw - 0.1), "linear"); }   // nose first, climbing
sfx(r3(T.plane - 0.4), "rumble", { gain: 0.4, dur: 2.6, reason: "the jet's engines passing low overhead" });
sfx(r3(T.plane - 0.1), "windswell", { gain: 0.3, dur: 2.0, reason: "the air the jet pushes as it passes" });
park(T.p10, "duch", 4);

// ================================================================= 12-14 THE ROAD, CHIP, THE HANDBRAKE (29.8-34.9)
// 12: the coupe races along the coast road (the car carries him: ride keeps him in the seat)
const RACE = 10, rX = (k) => r3(X12[0] + ((X12[1] - X12[0]) * k) / RACE);
pr(T.p12 - PRE, "car", { x: road(X12[0])[0], y: road(X12[0])[1], z: road(X12[0])[2], rot: roadYaw(X12[0]) });
for (let k = 1; k <= RACE; k++) { const x = rX(k), p = road(x); pr(r3(T.p12 + ((T.p13 - T.p12) * (k - 1)) / RACE), "car", { x: p[0], y: p[1], z: p[2], rot: roadYaw(x), len: r3(3 + x - X12[0]) }, r3((T.p13 - T.p12) / RACE), "linear"); }
expr(T.p12, "rich", "focused", { brow: 0.6, curve: -0.1 }, 0.01); look(T.p12, "rich", [0, 0], 0.01);
sfx(T.p12, "ridewind", { gain: 0.3, dur: 1.5, reason: "air rushing past the open coupe racing along the coast road" });
sfx(T.p12, "rumble", { gain: 0.25, dur: 1.5, reason: "the coupe's engine low under the wind" });
// 13: abeam of the knoll: he sees Chip alone on the crest (the car keeps rolling slowly)
const X13 = -1.0, P13 = road(X13);
pr(T.p13 - PRE, "car", { x: P13[0], y: P13[1], z: P13[2], rot: roadYaw(X13) });
pr(T.p13, "car", { x: road(X13 + 2.5)[0], z: road(X13 + 2.5)[2], len: 34 }, r3(T.p14 - T.p13), "out");
const SEATW = cw([0, 0, 0]), CHIPSEAT = cw([0.72, 0, 0.05]);
place(T.p13, "chip", [CHIPSEAT[0], CHIPSEAT[2]], 180, SEATW[1]); A(r3(T.p13 - PRE), "chip", "sit", { rot: 180, dur: 0.01, height: 0, hands: "lap" });
expr(T.p13, "chip", "sad", { curve: -0.2, brow: 0.4 }, 0.01);
look(T.p13 + 0.2, "rich", [-0.6, 0.45], 0.4);
// 14: the cabin close: he pulls the handbrake (music drops)
const CAR14 = road(X13 + 2.5);
pr(T.p14 - PRE, "car", { x: CAR14[0], z: CAR14[2], rot: roadYaw(X13 + 2.5) });
expr(T.p14, "rich", "sad", { curve: -0.1, brow: 0.6, eye: 1.1 }, 0.3); look(T.p14, "rich", [-0.6, 0.4], 0.01);
arm(T.brake - 0.2, "rich", "R", { world: carW([-0.12, 0.5, -0.3], CAR14, roadYaw(X13 + 2.5)) }, 0.25); grip(T.brake - 0.2, "rich", "R", "hold", 0.1);
pr(T.brake, "car", { brake: 1 }, 0.1667, "anticSettle");
arm(T.brake, "rich", "R", { world: carW([-0.12, 0.6, -0.23], CAR14, roadYaw(X13 + 2.5)) }, 0.1667);
sfx(T.brake, "cuffs", { gain: 0.45, reason: "the handbrake ratchet pulled hard" });
sfx(T.brake + 0.15, "screech", { gain: 0.3, reason: "tyres stop on the road" });
see(T.p12, T.p13, ["car"], "the gold coupe races along the coast road at sunset");
see(T.p13, T.p14, ["rich", "chip"], "from the car: up on the green cliff sits Chip alone against the sunset");
see(T.p14, T.p15, ["rich.face"], "close in the car: his eyes on the hill, he pulls the handbrake");

// ================================================================= 15-16 THE COAT STAYS; THE TOW TRUCK (34.9-39.0)
A(r3(T.p15 - 0.06), "rich", "ride", { prop: null, dur: 0 }); park(T.p15, "rich", 1);
pr(T.p15 - PRE, "car", { x: CAR2[0], y: CAR2[1], z: CAR2[2], rot: 90, door: 1, brake: 1 });
pr(T.p15 - PRE, "coat", { ...Object.fromEntries(["x", "y", "z"].map((k, i) => [k, carW([0.22, 0.46, -0.25], CAR2, 90)[i]])), rot: 90, door: 1 });
const S15A = carW([1.45, 0, -1.0], CAR2, 90), S15B = carW([3.2, 0, -3.0], CAR2, 90);
place(T.p15, "spud", [S15A[0], S15A[2]], yawTo([S15A[0], S15A[2]], [S15B[0], S15B[2]]), CAR2[1]); rest(T.p15, "spud");   // faces where he walks (draft 1 walked backwards, Jonny 16 Nov)
expr(T.p15, "spud", "focused", { brow: 0.4 }, 0.01);
look(T.p15 - 0.05, "spud", [0.6, 0.3], 0.1);
A(T.p15 + 0.1, "spud", "move", { to: [S15B[0], S15B[2]], y: r3(CP[1] + COAST.heightAt(S15B[0] - CP[0], S15B[2] - CP[2])), dur: 1.7, steps: 5 });
// 16: the truck hooks the coupe and pulls it away east; the counter hits 0:00
{ const tr = road(COAST.CARSTOP2[0] + 5.2); const pz = TOW.pose(tr[0], tr[1], tr[2], 90);
  pr(T.p16 - PRE, "truck", { ...pz.truck, len: 0 }); pr(T.p16 - PRE, "car", { ...pz.coupe, door: 0 });
  const tr2 = road(COAST.CARSTOP2[0] + 5.2 + TRUCK_DRIVE), pz2 = TOW.pose(tr2[0], tr2[1], tr2[2], 90);
  pr(T.zero, "truck", { ...pz2.truck, len: TRUCK_DRIVE }, r3(T.p17 - T.zero), "in"); pr(T.zero, "car", { ...pz2.coupe, len: TRUCK_DRIVE }, r3(T.p17 - T.zero), "in"); }
sfx(T.p16 + 0.2, "freewheel", { gain: 0.3, dur: 1.0, reason: "the tow truck's winch pulls the car up" });
sfx(T.zero, "rumble", { gain: 0.35, dur: 1.5, reason: "the truck drives off with the car" });
place(T.p16, "spud", [cw([10, 0, 10])[0], cw([10, 0, 10])[2]], -135, r3(CP[1] + COAST.heightAt(10, 10)));
A(T.p16 + 0.05, "spud", "move", { to: [cw([8.6, 0, 8.6])[0], cw([8.6, 0, 8.6])[2]], y: r3(CP[1] + COAST.heightAt(8.6, 8.6)), dur: 2.2, steps: 6 });
see(T.p15, T.p16, ["car", "spud"], "the coupe at the roadside, its door open, the fur coat and gold chain left on the seat; Spud walks away up the slope in his sweater");
see(T.p16, T.p17, ["truck", "car", "spud"], "a tow truck hooks the gold car and drives off; Spud climbs on and never looks back");

// ================================================================= 17-20 CHIP'S PLACE (39.0-50.6): the sunset
place(T.p17, "spud", [r3(SEATW[0] - 0.55), r3(SEATW[2] - 0.15)], 75, SEATW[1]);   // faces his walk to the seat
look(T.p17 - 0.05, "spud", [0.5, -0.1], 0.1);
A(T.p17 + 0.05, "spud", "move", { to: [SEATW[0], SEATW[2]], y: SEATW[1], dur: 0.55, steps: 2 });
A(T.p17 + 0.6, "spud", "sit", { rot: 180, dur: 0.6, height: 0, hands: "lap" });
expr(T.p17, "spud", "kind", { curve: 0.1 }, 0.01); look(T.p17 + 0.2, "spud", [0.5, 0], 0.2);
look(T.p17 + 0.3, "chip", [-0.5, 0.05], 0.25); expr(T.p17 + 0.4, "chip", "shocked", { open: 0.2, eye: 1.2 }, 0.15);
expr(T.p17 + 1.0, "chip", "delighted", { curve: 0.9, open: 0.5 }, 0.25);
look(T.p18, "spud", [0, 0.1], 0.5); look(T.p18, "chip", [0, 0.1], 0.5);
expr(T.p19 + 0.4, "spud", "happy", { curve: 0.5, eye: 0.55 }, 0.8); expr(T.p19 + 0.2, "chip", "happy", { curve: 0.6, eye: 0.3 }, 0.6);
A(T.lean, "chip", "lean", { to: 12, dur: 0.6, ease: "settle" }); A(T.lean, "spud", "lean", { to: -3, dur: 0.6, ease: "settle" });
for (const t of [T.p19 + 1.5, T.p20 + 0.6, T.p20 + 2.6]) { A(r3(t), "spud", "blink", { dur: 0.3 }); A(r3(t + 0.4), "chip", "blink", { dur: 0.3 }); }
see(T.p17, T.p18, ["spud.face", "chip.face"], "the cliff top: Spud sits down beside Chip; Chip grins");
see(T.p18, T.p19, ["spud", "chip"], "from behind: the two friends small on the cliff, a huge sunset over the sea");
see(T.p19, T.p20, ["spud.face", "chip.face"], "close: Spud smiles for the first time; Chip leans his head on him");
see(T.p20, END, ["spud", "chip"], "the last sliver of the sun, the first star");

// ---------------------------------------------------------------- the money counter + sun clock (DESIGN 10)
const MONEY = [[0.1, 1000000000], [T.pay, 999997000, 0.35], [10.4, 999996999], [11.4, 999996998], [12.4, 999996997], [13.4, 999996996],
  [r3(T.p06 + 0.6), 800000000, 0.45], [r3(T.p07 + 0.4), 650000000, 0.45], [r3(T.p08 + 1.1), 400000000, 0.6],
  [r3(T.sign + 0.8), 150000000, 0.6], [r3(T.plane + 0.5), 1000000, 0.6], [T.zero, 0, 0.5]];
const DAYS = [[0, 1], [T.p06, 2], [T.p07, 3], [T.p08, 4], [T.p09, 5], [T.p11, 6], [T.p12, 7]];
const FADE = [r3(T.p18 + 1.4), 1.0];
// the sun clock only on day 7, for the last hour (1:00 -> 0:00 at the tow truck)
const HUD = hud({ day: DAYS, money: { keys: MONEY, fade: FADE }, sun: { p: [[T.p12, 0.86], [T.zero, 1.0, 0.4]], last: [T.p12, T.zero], fade: FADE }, show: [0, FADE[0] + FADE[1]] });

// ---------------------------------------------------------------- sound beds
const city = (from, to) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/city-street", { gain: 0.06, dur: r3(Math.min(6, to - t)), reason: "a sunny street, far under the music" }); };
const wind = (from, to, gain = 0.06) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain, dur: r3(Math.min(6, to - t)), reason: "wind on the cliff, far under the music" }); };
wind(T.p09, T.p11, 0.05); wind(T.p13, END, 0.05);

// ---------------------------------------------------------------- shots
const inCar = (local, lookLocal, fov, at, rot) => ({ pos: carW(local, at, rot), look: carW(lookLocal, at, rot), fov });
const SH = {
  p01: shot("city", [-0.95, 1.25, 5.9], { tilt: -7, fov: 50 }),
  p02: { pos: [-0.45, 1.0, 4.7], look: [-0.35, 0.6, 1.3], fov: 40 },
  p03: { pos: [-1.4, 0.9, 4.4], look: [-1.9, 1.12, 1.5], fov: 48 },   // low on the Duchess; the painted sky ends ~33 deg up
  p04: shot("city", [-0.85, 1.15, 5.2], { pan: -2, tilt: -7, fov: 50 }),
  p05: shot("city", [0.4, 0.9, 4.6], { pan: -3, tilt: 1, fov: 52 }),
  p06: { pos: sw([0.6, 1.4, 5.6]), look: sw([-0.4, 0.8, -1.0]), fov: 50 },
  p07: { pos: bw([2.15, 0.9, -1.35]), look: bw([0.25, 0.75, -0.3]), fov: 70 },   // from inside the mirror box: the mirror he admires
  p08: { pos: [0.2, 1.1, -2.8], look: [0.2, 0.6, -6.9], fov: 48 },
  p09: { pos: cw([1.0, 1.0 + COAST.heightAt(1.0, 11.5), 11.5]), look: cw([1.1, 0.5 + COAST.heightAt(1.1, 3), 3]), fov: 46 },
  p10: inCar([0.22, 1.45, 1.5], [0.22, 0.98, -0.25], 46, CARP, CYAW),   // over the bonnet, through the windscreen, above the dash
  p11: { pos: cw(HARBOUR.at([1.3, 2.4, -4.6])), look: cw(HARBOUR.at([-0.9, 1.9, -16])), fov: 46 },   // pulled back: the two at the stand, the yacht behind
  yw: { pos: cw(HARBOUR.at([6, 2.6, -14])), look: cw(HARBOUR.at([-2.4, 2.2, -31])), fov: 42 },   // the yacht side-on in full (Jonny 16 Nov: he never saw it)
  p12: { pos: cw([-6, -2.5, 6]), look: cw([-22, -9.8, 24]), fov: 44 },
  p13: { pos: carW([0.22, 1.1, -0.25], P13, roadYaw(X13)), look: [CHIPSEAT[0], r3(SEATW[1] + 0.4), CHIPSEAT[2]], fov: 18 },
  p14: inCar([0.05, 1.35, 1.2], [0.2, 0.98, -0.25], 40, CAR14, roadYaw(X13 + 2.5)),   // closer than 10, through the windscreen
  p15: inCar([1.7, 1.7, -4.2], [2.2, 0.6, 1.5], 50, CAR2, 90),
  p16: { pos: cw(COAST.CAM.c08climb.pos), look: cw(COAST.CAM.c08climb.look), fov: COAST.CAM.c08climb.fov },
  p17: { pos: cw([0.31, 0.5, -3.7]), look: cw([0.36, 0.48, 0]), fov: 40 },
  p18: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov },
  p19: push({ pos: cw([0.31, 0.5, -3.7]), look: cw([0.36, 0.48, 0]), fov: 40 }, 0.1, r3(T.p20 - T.p19)),
  p20: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov, to: { pos: cw(COAST.CAM.c09push.pos), look: cw(COAST.CAM.c09push.look), fov: COAST.CAM.c09push.fov }, dur: r3(END - T.p20), ease: "linear" },
};
const CUTS = [
  ["01 the check", 0, SH.p01, "hook"], ["02 the gasp", T.p02, SH.p02], ["03 seven days", T.p03, SH.p03],
  ["04 the cart", T.p04, SH.p04], ["05 the mountain", T.p05, SH.p05, "escalation"], ["06 the car", T.p06, SH.p06],
  ["07 the coat", T.p07, SH.p07], ["08 the mansion", T.p08, SH.p08], ["09 Chip walks off", T.p09, SH.p09],
  ["11 the yacht", T.p11, SH.p11], ["11a yacht wide", T.yw, SH.yw], ["10 alone", T.p10, SH.p10], ["12 the road", T.p12, SH.p12],
  ["13 Chip on the hill", T.p13, SH.p13], ["14 the handbrake", T.p14, SH.p14, "escalation"], ["15 the coat stays", T.p15, SH.p15],
  ["16 the tow truck", T.p16, SH.p16], ["17 beside him", T.p17, SH.p17, "payoff"], ["18 the sunset", T.p18, SH.p18],
  ["19 the smile", T.p19, SH.p19, "reaction"], ["20 the last sliver", T.p20, SH.p20],
];

// ---------------------------------------------------------------- the narrator (voice 1), lengths from the farm's takes
const NG = 4.0;
const NARR = !VO ? [] : [
  [0.1, "One billion dollars. Gone in seven days.", 3.75],
  [6.7, "So he bought the whole coffee cart.", 2.55],
  [9.45, "But at a dollar a second, a billion takes thirty-one years.", 3.9],
  [14.1, "So he bought big.", 1.41],
  [r3(T.p07 + 0.1), "Every day, his best friend asked.", 3.03],
  [r3(T.p09 + 0.4), "On day five, he stopped asking.", 2.23],
  [r3(T.p11 + 0.15), "So he bought a yacht.", 1.39],
  [r3(T.plane + 0.15), "And a plane.", 1.13],
  [r3(T.p12 + 0.1), "Day seven. One million left. One last buy.", 3.85],
  [r3(T.p13 + 0.2), "But up on the hill sat his best friend.", 3.37],
  [r3(T.p18 + 0.2), "He lost a billion dollars.", 1.95],
  [r3(T.p19 + 0.2), "But for one moment, he forgot all his worries.", 2.43],
  [T.follow, "Comment what you would do.", 1.6],   // the comment ask after the payoff (Jonny 16 Nov: instead of the follow ask)
];
for (const [t, line, dur] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos: SUBY, gain: NG });
// the hook text up top is the HUD itself: "$1,000,000,000" and DAY 1 from frame 0

hideOffstage();
const beats = c.beats(CUTS, END);   // after every item (items added later are dropped)
for (const p of props) { delete p._place; delete p._from; delete p._to; delete p._stay; }
const KEYS_COAST = {
  late: [[0, 1], [T.p11 - 0.001, 1], [T.p11, 0.5], [T.p12 - 0.001, 0.5], [T.p12, 0]],
  sink: [[0, 0], [T.p12, 0], [T.zero, 1], [T.p20, 1.45], [r3(END - 0.6), 2]],
  railGap: [15, 25], breakAt: 0, breakDur: 0.01,
};
write(import.meta.url, {
  id: VO ? "money-redo" : "money-redo-no-vo",
  title: "Spend $1,000,000,000 in a week",
  idea: "Happiness series 01 redo: a rich lady bets Spud can't spend a billion dollars in seven days; he buys everything, shuts out his best friend, and in the last hour of day seven chooses the friend and the sunset over the money",
  format: "series: Spud looks for happiness (one life question per episode, never answered out loud)",
  fps: 30, look: "anime-pro", castLook: LOOK, profile: "short", loop: false, captionStyle: "kinetic", captionBand: [210, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING, loopIdle: false,
  set: {
    type: "env", env: ENVS.city,
    swap: PLACES.map(([at, name]) => (name === "coast" ? { at, room: { type: "coast", pos: CP, ...KEYS_COAST } }
      : name === "show" ? { at, room: { type: "showroom", pos: SR, viewX: -3.5 } }
      : name === "bout" ? { at, room: { type: "boutique", pos: BQ, twin: 1 } }
      : { at, env: ENVS[name] })),
    aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true,
  },
  hud: HUD,
  music: { file: process.env.MUSIC ?? "money-redo/money-redo-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["duch", "spud", "check"], hint: 0, what: "a rich lady slaps a $1,000,000,000 check on a coffee cart in front of two poor potatoes" },
  cast: cast.filter((x) => ids.has(x.id)), props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rosti", with: "apron", from: 0, to: T.p05, reason: "the apron is worn" },
    { who: "rosti", with: "phat", from: 0, to: T.p05, reason: "the paper hat is worn" },
    { who: "seller", with: "scap", from: T.p06, to: T.p07, checks: ["clipping", "shell"], reason: "the cap is worn: it sits on his head (T8 bench fit y 0.84, r 0.24)" },
    { who: "seller", with: "sbow", from: T.p06, to: T.p07, reason: "the bow tie is worn" },
    { who: "rich", with: "car", from: T.p12, to: T.p14, checks: ["shell"], reason: "the race: a wide 30 m off, then his own view out of the car; the roof can't be seen against him" },
    { who: "rich", with: "car", from: T.p10, to: T.p15, reason: "he sits inside the coupe (the car encloses him)" },
    { who: "spud", with: "cart", from: 0, to: T.p05, reason: "he stands at the counter's end under the roof's eave (the roof's box overlaps his, not the cart's body)" },
    { who: "duch", with: "cart", from: 0, to: T.p04, reason: "she stands at the counter's end under the roof's eave and slaps the check on the counter" },
    { who: "seller", with: "keys", from: T.p06, to: T.p07, checks: ["thin-prop-hidden"], reason: "a key fob 1.5 cm long in the fingertips: the fob shows, the ring hides in the pinch" },
    { who: "chip", with: "rich", from: T.tug1, to: T.p08, reason: "Chip tugs the coat's sleeve with both hands (panel 07: the contact is the action)" },
    { who: "chip", with: "spud", from: T.lean, to: END, reason: "the lean, panels 19-20 (DESIGN 11)" },
  ],
  notes: "Generated by storyboards/series/happiness/01-money-redo/make-money-redo.mjs.",
});
