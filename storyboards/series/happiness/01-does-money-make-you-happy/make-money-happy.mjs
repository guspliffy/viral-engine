// DOES MONEY MAKE YOU HAPPY? (Happiness series pilot). Jonny 14 Nov 2026: "go" (bank robbery version), "go for it" on
// OUTLINE.md, "ok" on board.png (the Codex sheet). Opener B (cold open). Timeline, chain, decisions: NOTES.md. Looks:
// DESIGN.md (Fable 5.2; section 10 = the director's decisions).
//   node storyboards/series/happiness/01-does-money-make-you-happy/make-money-happy.mjs          -> money-happy.json
//   ... --no-vo -> money-happy-no-vo.json (staging without the speech model)
//
// THE BRIEF
//   Want:   Spud wants to be happy; rich potatoes look happy.
//   Chain:  he is rich and empty in his gold car (cold open), because thirty days earlier he saw that money looks happy,
//           so he robbed a bank, so he bought everything, so he had something to lose: a siren, so he hides the money,
//           locks ten locks and shuts his friend out, so he is alone; a siren stops at his gate, so he flees with the
//           money, so the car runs dry on the coast road; he runs on, and the siren was only an ambulance: nobody was
//           ever coming; with nothing left to run from he sits, the clouds break, and for one moment he smiles.
//   Ending: the sunset, the notes blowing away, his first smile. The question is never answered out loud.
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { COAST } from "../../../../engine/page/set-coast.js";
import { VAULT } from "../../../../engine/page/set-vault.js";
import { HALL } from "../../../../engine/page/set-mansionhall.js";
import { RIDE_OFF, DASH } from "../../../../engine/page/props-coupe.js";
import { LIMO } from "../../../../engine/page/props-happy.js";

// ---------------------------------------------------------------- the template's picks
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
const PRE = 0.012;   // instant changes finish 2 ms before a cut (the frame before a cut is at least 16 ms before it)
const rad = (d) => (d * Math.PI) / 180;
const envOk = (n) => fs.existsSync(new URL(`../../../../assets/environments/${n}/env.json`, import.meta.url));
const HAPPY = true;

// ---------------------------------------------------------------- the beats (video s)
const T = {
  open: 0, wipe: 1.2, city: 3.8, limo: 5.0, mumble: 6.9, plan: 8.1,
  vault: 9.05, alarm: 9.75, run: 10.5,
  street: 11.0, cars: 12.0, duck: 13.05, past: 12.85, laugh: 13.75,
  rich: 14.45, spread: 15.0,
  turn: 17.55, siren1: 17.7, hide: 18.6,
  door: 20.5, lock1: 20.7, lock10: 21.7, knock: 22.0, chip: 22.3, back: 23.35,
  clock: 24.0, low: 25.15, gate: 27.95, flee: 28.7,
  car: 30.45, dash: 31.25, wide: 32.25, stop: 33.0, climb: 33.8, amb: 34.2, nobody: 35.6,
  sunset: 37.0, brk: 37.4, face: 41.0, open2: 41.2, smile: 41.9, forgot: 42.2, hold: 45.0, END: 48.0,
};
const END = T.END;

// ---------------------------------------------------------------- places
const CP = [0, 0, -600], VP = [300, 0, 0], HP = [-300, 0, 0];   // rooms (coast frame, vault frame, hall frame + these)
const cw = (p) => [r3(p[0] + CP[0]), r3(p[1] + CP[1]), r3(p[2] + CP[2])];
const vw = (p) => [r3(p[0] + VP[0]), r3(p[1] + VP[1]), r3(p[2] + VP[2])];
const hw = (p) => [r3(p[0] + HP[0]), r3(p[1] + HP[1]), r3(p[2] + HP[2])];
const ENVS = {
  city: "golden-city-crossing", street: "dusk-bus-stop",
  mday: envOk("mansion-day") ? "mansion-day" : "golden-city-crossing",
  gate: envOk("mansion-gate-night") ? "mansion-gate-night" : "dusk-back-alley",
};
const PLACES = [[0, "coast"], [T.city, "city"], [T.vault, "vault"], [T.street, "street"], [T.rich, "mday"], [T.turn, "hall"], [T.flee, "gate"], [T.car, "coast"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];
const PITCH = Object.fromEntries(Object.entries(ENVS).map(([k, n]) => [k, JSON.parse(fs.readFileSync(new URL(`../../../../assets/environments/${n}/env.json`, import.meta.url))).eye.pitch]));
const cam = (pos, deg, fov = 46, yaw = 0) => { const a = rad(deg), y = rad(yaw); return { pos, look: [r3(pos[0] + Math.sin(y) * Math.cos(a) * 10), r3(pos[1] + Math.sin(a) * 10), r3(pos[2] - Math.cos(y) * Math.cos(a) * 10)], fov }; };
const shot = (env, pos, { pan = 0, tilt = 0, fov = 44 } = {}) => {
  const yaw = rad(pan), pit = rad(-PITCH[env] + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};

// the coupe: parked on the coast road at CARSTOP, nose +x (rot 90): its frame (x, y, z) -> world
const CAR = cw(COAST.CARSTOP), CAR_ROT = 90;
const carW = ([x, y, z], at = CAR, rot = CAR_ROT) => { const a = rad(rot); return [r3(at[0] + x * Math.cos(a) + z * Math.sin(a)), r3(at[1] + y), r3(at[2] - x * Math.sin(a) + z * Math.cos(a))]; };
const ROLL_IN = 3.2;   // metres it rolls in on the wide shot (from CAR - 3.2 along +x)

// ---------------------------------------------------------------- cast
const PARK = (k) => [400 + k * 3, 400];
const cast = [
  { id: "rich", character: "potatobrawl/spud-rich", at: [CAR[0], CAR[2]], face: CAR_ROT, expr: "sad", follow: 0.25, seed: 2.2 },
  { id: "spud", character: "potatobrawl/spud", at: PARK(1), face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: PARK(2), face: 0, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "pa", character: "what-if/viking-old", at: PARK(3), face: 0, expr: "delighted", follow: 0.3, seed: 3.1 },
  { id: "pb", character: "what-if/wizard-old", at: PARK(4), face: 0, expr: "delighted", follow: 0.3, seed: 4.2 },
];
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
// a run along 2-D points at a speed (m/s): pts [t, x, z] from the distances, rate = footfalls a second
const run = (t, who, pts, speed = 2.6, rate = 4.4) => { let tt = 0; const P3 = [[0, pts[0][0], pts[0][1]]]; for (let i = 1; i < pts.length; i++) { tt = r3(tt + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / speed); P3.push([tt, pts[i][0], pts[i][1]]); } A(r3(t), who, "run", { pts: P3, dur: tt, rate: [[0, rate], [tt, rate]], stride: 1.7 }); return P3; };
// a sack hugged to the belly (the vault hug, one sack): both arms round it, the sack keyed along the path in front of him
const up = (y) => r3((y - 0.14) / 0.88);
const HUG_F = 0.52, HUG_Y = 0.1;
const hug = (t, who) => { arm(r3(t), who, "R", { x: [-0.3, up(0.3), 0.56] }, 0.01); arm(r3(t), who, "L", { x: [0.3, up(0.3), 0.56] }, 0.01); grip(t, who, "R", "press", 0.01); grip(t, who, "L", "press", 0.01); };
const bagPos = (x, z, yaw, y0 = 0, f = HUG_F) => ({ x: r3(x + Math.sin(rad(yaw)) * f), y: r3(y0 + HUG_Y), z: r3(z + Math.cos(rad(yaw)) * f), rot: r3(yaw) });
const headings = (P3) => P3.map((p, i) => { const a = P3[Math.min(i, P3.length - 2)], b = P3[Math.min(i + 1, P3.length - 1)]; return r3((Math.atan2(b[1] - a[1], b[2] - a[2]) * 180) / Math.PI); });
const bagAlong = (t0, id, P3, y = () => 0) => { const H = headings(P3); P3.forEach((p, i) => { const at = i ? r3(t0 + P3[i - 1][0]) : r3(t0 - PRE), dur = i ? r3(p[0] - P3[i - 1][0]) : 0.01; c.prop(at, id, bagPos(p[1], p[2], H[i], y(p)), dur, "linear"); }); return H; };
const SUBY = 470;   // speech lettering in the upper third (Jonny 12 Nov)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });

// ---------------------------------------------------------------- props, each in its place (shown only while its place is up)
const props = [];
const P = (where, spec, { from = 0, to = 99, stay = false } = {}) => { props.push({ ...spec, _place: where, _from: from, _to: to, _stay: stay }); return spec; };
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.01, ease = "linear") => { if (has(id)) c.prop(r3(t), id, set, dur, ease); };

// ---- coast: the coupe (S1, S9), the bag and the notes (S10), the ambulance (S9)
P("coast", { id: "car", kind: "coupe", x: CAR[0], y: CAR[1], z: CAR[2], rot: CAR_ROT, streaks: 0 });
P("coast", { id: "cbag", kind: "moneybag", mark: false, x: cw(COAST.BAG)[0], y: CP[1], z: cw(COAST.BAG)[2], rot: 200, open: true }, { from: T.sunset });
const AMB_Z = (x) => r3(CP[2] + COAST.roadAt(x).z), AMB_Y = (x) => r3(CP[1] + COAST.roadAt(x).y);
if (HAPPY) P("coast", { id: "amb", kind: "ambulance", x: r3(CP[0] - 10), y: AMB_Y(-10), z: AMB_Z(-10), rot: 90, lights: 0 }, { from: T.climb });
// ---- city (S2)
const LM = { x: 0.9, z: -3.6, from: -14 }, LS = LIMO.seats("R");
P("city", { id: "limo", kind: "limo", open: "R", x: LM.from, z: LM.z, rot: 90 });
[["bag1", "#f29bb5", -1.35], ["bag2", "#f2c75a", -1.85], ["bag3", "#c9a6e8", -2.35]].forEach(([id, color, lz]) => P("city", { id, kind: "shopbag", color, staged: "the shop bags hang over the sill of the open window", x: r3(LM.from + lz), y: LIMO.belt, z: r3(LM.z + 0.95), rot: 180 }));

P("city", { id: "plA", kind: "pocketlining", wear: "spud", x: 0.34, y: 0.24, z: 0.1, side: 1 }, { to: T.vault });
P("city", { id: "plB", kind: "pocketlining", wear: "spud", x: -0.34, y: 0.24, z: 0.1, side: -1 }, { to: T.vault });
// ---- vault (S3): two sacks in his hug
const VS = vw(VAULT.SPUD);
P("vault", { id: "mask", kind: "balaclava", wear: "spud", x: 0, y: 0, z: 0 }, { stay: true });
P("vault", { id: "vbagL", kind: "moneybag", staged: "hugged against his belly", mark: false, open: true, x: r3(VS[0] - 0.17), y: 0.08, z: r3(VS[2] + 0.66), rot: 180 });
P("vault", { id: "vbagR", kind: "moneybag", staged: "hugged against his belly", mark: false, open: true, x: r3(VS[0] + 0.17), y: 0.08, z: r3(VS[2] + 0.66), rot: 180 });
// ---- the night street (S3b): one sack in his arms, the police cars, their light
const ST = { start: [0, -6.0], cross: [0.6, -1.5], hide: [1.3, 4.2] };
const SBAG = P("street", { id: "sbag", kind: "moneybag", mark: false, x: r3(ST.start[0]), y: 0.2, z: r3(ST.start[1] + 0.4), rot: 180 }, { stay: true });
P("street", { id: "bank", kind: "bankfront", x: 0, z: -9 });
[["pc1", -16, -2.7], ["pc2", -22, -3.3], ["pc3", -28, -2.9]].forEach(([id, x, z]) => P("street", { id, kind: "policecar", x, z, rot: 90, lights: 1 }));
P("street", { id: "wash", kind: "sirenwash", x: 1.3, y: 0.2, z: 3.4, w: 3, h: 2.6, on: 0 });
// ---- the mansion by day (S4): the coupe on the gravel
const MD = { car: [3.6, -5.6], spud: [0.25, -6.4] };
P("mday", { id: "dcar", kind: "coupe", x: MD.car[0], z: MD.car[1], rot: -60, load: 0, rain: 0 });
P("mday", { id: "fountain", kind: "fountain", x: 0, z: -11 });
// ---- the hall (S5-S8): the bags he hides, the gift Chip brings
const HB = hw([HALL.HATCH[0], 0, HALL.HATCH[2]]);
P("hall", { id: "hbagA", kind: "moneybag", mark: false, x: r3(HB[0] - 0.9), y: 0, z: r3(HB[2] + 1.4), rot: 200 });
P("hall", { id: "hbagB", kind: "moneybag", mark: false, x: r3(HB[0] - 0.55), y: 0, z: r3(HB[2] + 1.75), rot: 160 });
P("hall", { id: "gift", kind: "gift", staged: "Chip holds the gift up in both hands", x: 0, y: -30, z: 0, scale: 0.6 }, { stay: true });
// ---- the gate at night (S8)
const GT = { car: [1.5, -2.6], from: [-0.7, 3.6] };
P("gate", { id: "gcar", kind: "coupe", x: GT.car[0], z: GT.car[1], rot: -90, load: 0.6, rain: 0.6 });
const GBAG = P("gate", { id: "gbag", kind: "moneybag", mark: false, x: r3(GT.from[0]), y: 0.2, z: r3(GT.from[1] + 0.4), rot: 180 }, { stay: true });
P("gate", { id: "gwash", kind: "sirenwash", x: 0, z: -9.5, w: 8, h: 6, flat: true, on: 0 });
P("gate", { id: "igate", kind: "irongate", x: 0, z: -7 });

// prime every key that is first tweened later (an unseeded tween writes NaN)
pr(0, "car", { rain: 1, wiper: 0, wiped: 0, gauge: 0.18, quiver: 0, cough: 0, lamp: 1, load: 1 });
pr(0, "dcar", { rain: 0, wiper: 0, wiped: 0, gauge: 1, quiver: 0, cough: 0, lamp: 0, load: 0 });
pr(0, "gcar", { rain: 0.6, wiper: 0, wiped: 0, gauge: 0.4, quiver: 0, cough: 0, lamp: 0, load: 0.6 });
pr(0, "wash", { on: 0, clock: 0 }); pr(0, "gwash", { on: 0, clock: 0 }); pr(0, "igate", { open: 0, lit: 1, wet: 1 }); pr(0, "bank", { alarm: 1, clock: 0 }); pr(0, "fountain", { on: 1 });
pr(0, "amb", { lights: 0, clock: 0, len: 0 }); pr(0, "limo", { len: 0 });

// show each prop only while its place is up and inside its own from-to (hidden = tiny and 30 m under the floor)
for (const p of props) {
  const mine = (name) => p._place === "all" || p._place.split("+").includes(name);
  const on = (t) => mine(placeAt(t)) && t >= p._from - 1e-6 && t < p._to - 1e-6;
  const full = p.scale ?? 1, y0 = p.y ?? 0, away = (now) => ({ scale: now ? full : 0.001, ...(!p.wear && !p._stay && { y: now ? y0 : -30 }) });
  let was = on(0);
  if (!was) Object.assign(p, away(false));
  const times = [...new Set([...PLACES.slice(1).map(([at]) => at), p._from, p._to])].filter((t) => t > 0 && t < END).sort((x, y) => x - y);
  for (const t of times) { const now = on(t); if (now !== was) c.at(r3(t - PRE), { do: "prop", id: p.id, set: away(now), dur: 0.01, ease: "linear", reason: "off the set between scenes: hidden and parked under the floor on the cut" }); was = now; }
}

// ---------------------------------------------------------------- sound beds
const rainCar = (from, to, gain = 0.45) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/rain-car-roof", { gain, dur: r3(Math.min(6, to - t)), reason: "rain drumming on the car roof" }); };
const wind = (from, to, gain = 0.06) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain, dur: r3(Math.min(6, to - t)), reason: "wind on the cliff, far under the music" }); };

// ================================================================= S1 COLD OPEN (0-3.8): rich, sad, in the rain
A(0, "rich", "ride", { prop: "car", off: RIDE_OFF, yaw: 0, sit: true, dur: 0 });
expr(0, "rich", "sad", { curve: -0.15, open: 0, brow: 0.35 }, 0.01); look(0, "rich", [0.15, -0.05], 0.01);
for (const s of ["R", "L"]) { arm(0, "rich", s, "lap", 0.01); grip(0, "rich", s, "relaxed", 0.01); }
// the wiper: out and back every 1.6 s, the cleared fan keeps up with it
for (let t = 0.2; t < T.city; t = r3(t + 1.6)) { pr(t, "car", { wiper: 1, wiped: 1 }, 0.55, "inOut"); pr(r3(t + 0.6), "car", { wiper: 0 }, 0.55, "inOut"); pr(r3(t + 1.2), "car", { wiped: 0 }, 0.35, "linear"); }
A(2.4, "rich", "blink", { dur: 0.5 });   // a slow, heavy blink
look(2.9, "rich", [0.35, 0.05], 0.4);    // out of the side window, at nothing
rainCar(0, T.city);
cap(0, 1.65, "$10,000,000", 255);
cap(1.65, T.city, "HAPPY?", 255);
A(r3(T.city - 0.06), "rich", "ride", { prop: null, dur: 0 }); park(T.city, "rich", 0);
see(0, T.city, ["rich.face", "car"], "frame 0: Spud in his fur coat and gold chain at the wheel of a gold car, rain on the glass, money bags piled behind him, his face empty");

// ================================================================= S2 THE CITY (3.8-9.05): everyone with money looks happy
const CW = { a: [0.65, -1.3], b: [0.5, 0.5] };
place(T.city, "spud", CW.a, 8);
A(T.city, "spud", "move", { to: CW.b, dur: 1.25, steps: 4 });
// the limo glides in behind him: he turns to stare at the laughing couple, then back to us for his question
look(r3(T.limo + 0.05), "spud", [-0.7, 0.1], 0.15);
A(r3(T.limo + 0.2), "spud", "turn", { to: -168, dur: 0.45 });
look(r3(T.mumble - 0.85), "spud", [0.3, 0], 0.15);
A(r3(T.mumble - 0.7), "spud", "turn", { to: 8, dur: 0.65 });
for (const s of ["R", "L"]) { arm(T.city - PRE, "spud", s, "rest", 0.01); grip(T.city - PRE, "spud", s, "relaxed", 0.01); }
expr(T.city, "spud", "sad", { curve: -0.1, brow: 0.3 }, 0.01); look(T.city, "spud", [0, -0.2], 0.01);
// the limousine glides in from the left and stops beside him; the couple ride on its bench, laughing
for (const [id, i] of [["pa", 0], ["pb", 1]]) {
  A(r3(T.city - PRE), id, "ride", { prop: "limo", off: [LS[i][0], LS[i][1] - 0.12, r3(LS[i][2] + (i ? -0.22 : 0.2))], yaw: -90, sit: true, dur: 0 });
  A(r3(T.vault - PRE), id, "ride", { prop: null, dur: 0 }); park(T.vault, id, 3 + i);
  expr(0, id, "delighted", { curve: 0.8, open: 0.4 }, 0.01);
  for (const k of [0, 1, 2]) A(r3(T.limo + 0.9 + k * 0.55 + i * 0.2), id, "hop", { height: 0.03, dur: 0.22, quiet: true });
}
const LIN = r3(T.limo - 1.0), LDUR = 2.0;
pr(LIN, "limo", { x: LM.x, len: r3(LM.x - LM.from) }, LDUR, "out");
[["bag1", -1.35], ["bag2", -1.85], ["bag3", -2.35]].forEach(([id, lz]) => pr(LIN, id, { x: r3(LM.x + lz) }, LDUR, "out"));
sfx(LIN, "tyres", { gain: 0.25, reason: "the limousine rolling to a stop at the kerb" });
expr(T.limo + 0.3, "spud", "shocked", { open: 0.2, eye: 1.2 }, 0.12);
expr(T.mumble - 0.2, "spud", "focused", { brow: 0.6, curve: -0.05 }, 0.2);
say(T.mumble, "spud", "Mo-ney... ha-ppy?", 1.0, "question");
act.idea(c, T.plan - 0.1, "spud", { at: [0.25, -0.3], hold: 0.7 });
see(T.city, T.vault, ["spud.face"], "noon in the city: Spud with his pockets turned out; a white limousine with a laughing rich couple and shopping bags; he wonders");

// ================================================================= S3 THE VAULT (9.05-11.0)
place(T.vault, "spud", [VS[0], VS[2]], 0);
arm(T.vault - PRE, "spud", "R", { x: [-0.385, up(0.24), 0.66] }, 0.01); arm(T.vault - PRE, "spud", "L", { x: [0.385, up(0.24), 0.66] }, 0.01);
grip(T.vault - PRE, "spud", "R", "press", 0.01); grip(T.vault - PRE, "spud", "L", "press", 0.01);
expr(T.vault, "spud", "delighted", { open: 0.35, eye: 1.2 }, 0.01); look(T.vault, "spud", [0, 0.1], 0.01);
A(r3(T.vault + 0.3), "spud", "hop", { height: 0.06, dur: 0.25, quiet: true });
sfx(T.vault + 0.05, "creak", { gain: 0.5, reason: "the vault door's hinge, the door still swinging" });
sfx(T.alarm, "alarmbell", { gain: 0.6, dur: 1.4, reason: "the bank's alarm bell" });
expr(T.alarm + 0.05, "spud", "shocked", { open: 0.4, eye: 1.4 }, 0.15);
A(r3(T.alarm + 0.05), "spud", "squash", { amount: 0.08, dur: 0.18 });
look(T.alarm + 0.1, "spud", [-0.6, 0.5], 0.2);
expr(T.run - 0.1, "spud", "evil", { curve: 0.4 }, 0.15);
see(T.vault, T.street, ["spud.face", "vbagL", "vbagR"], "the vault: Spud in a black balaclava hugs two sacks of money in front of the open steel door; the alarm, the red light");

// ================================================================= S3b THE NIGHT STREET (11.0-14.45): the escape
place(T.street, "spud", ST.start, 40);
for (const s of ["R", "L"]) arm(r3(T.street - PRE), "spud", s, "rest", 0.01);
hug(T.street - PRE, "spud");
expr(T.street, "spud", "terrified", { open: 0.3 }, 0.01);
const SP = run(T.street, "spud", [ST.start, ST.cross, ST.hide], 5.0, 5.0);
const SH_ = bagAlong(T.street, "sbag", SP);
c.prop(T.duck, "sbag", bagPos(ST.hide[0], ST.hide[1], 20), 0.25, "inOut");
c.prop(r3(T.duck + 0.25), "sbag", { y: r3(HUG_Y - 0.12) }, 0.25, "inOut");
c.prop(T.laugh, "sbag", { y: HUG_Y }, 0.35, "inOut");
sfx(T.street + 0.1, "siren", { gain: 0.7, reason: "a police car's whoop as it turns into the street" });
sfx(T.street + 0.4, "sirenwail", { dur: 3.4, gain: 0.5, reason: "three police cars, sirens rising" });
[["pc1", 5.0, 0.0], ["pc2", 6.2, 0.15], ["pc3", 7.4, 0.3]].forEach(([id, z, dt]) => pr(r3(T.cars + dt), id, { x: r3(18 + dt * 10), len: 36 }, 1.8, "linear"));
sfx(T.past, "screech", { gain: 0.45, reason: "tyres as the cars race past the corner" });
A(T.duck, "spud", "turn", { to: 20, dur: 0.25 });
A(r3(T.duck + 0.25), "spud", "crouch", { to: 0.6, dur: 0.25 });
look(T.duck + 0.3, "spud", [-0.5, 0.0], 0.15);
pr(T.past - 0.2, "wash", { on: 1 }, 0.15, "out"); pr(T.past + 0.9, "wash", { on: 0 }, 0.4, "in");
A(r3(T.laugh), "spud", "crouch", { to: 0, dur: 0.35 });
expr(T.laugh, "spud", "delighted", { curve: 0.8, open: 0.4 }, 0.2);
A(r3(T.laugh + 0.1), "spud", "hop", { height: 0.08, dur: 0.3, quiet: true }); A(r3(T.laugh + 0.45), "spud", "hop", { height: 0.06, dur: 0.28, quiet: true });
see(T.street, T.rich, ["spud.face"], "night street: he runs from the bank with a sack, police cars race past, he hides at the corner and laughs");
park(T.rich, "spud", 1);

// ================================================================= S4 THE MANSION BY DAY (14.45-17.55): he bought everything
place(T.rich, "rich", MD.spud, 10);
for (const s of ["R", "L"]) { arm(T.rich - PRE, "rich", s, "rest", 0.01); grip(T.rich - PRE, "rich", s, "relaxed", 0.01); }
expr(T.rich, "rich", "delighted", { curve: 0.7, open: 0.25 }, 0.01); look(T.rich, "rich", [0, 0.1], 0.01);
A(T.spread, "rich", "wings", { to: 1, dur: 0.4 });
arm(T.spread, "rich", "R", { o: [0.42, 0.66, 0.1] }, 0.4, "out"); arm(T.spread, "rich", "L", { o: [0.42, 0.66, 0.1] }, 0.4, "out");
grip(T.spread, "rich", "R", "open", 0.2); grip(T.spread, "rich", "L", "open", 0.2);
A(r3(T.spread + 0.3), "rich", "hop", { height: 0.08, dur: 0.3, quiet: true });
sfx(T.rich + 0.1, "ai/step-concrete", { gain: 0.3, reason: "a step on the gravel" });
see(T.rich, T.turn, ["rich.face", "dcar"], "the white mansion by day, a fountain, the gold car: Spud in his fur coat throws his arms wide");

// ================================================================= S5 THE TURN (17.55-20.5): a siren passes
const HALL_MID = [2.9, 2.8];
place(T.turn, "rich", HALL_MID.map((v, i) => r3(v + (i ? HP[2] : HP[0]))), 160);
A(r3(T.turn - PRE), "rich", "wings", { to: 0, dur: 0.01 });
for (const s of ["R", "L"]) { arm(T.turn - PRE, "rich", s, "rest", 0.01); grip(T.turn - PRE, "rich", s, "relaxed", 0.01); }
expr(T.turn, "rich", "kind", { curve: 0.2 }, 0.01); look(T.turn, "rich", [0, 0.2], 0.01);
sfx(T.siren1, "sirenwail", { dur: 2.2, gain: 0.45, reason: "a siren passing on the road outside" });
expr(T.siren1 + 0.2, "rich", "terrified", { open: 0.2, eye: 1.35 }, 0.1);
A(r3(T.siren1 + 0.2), "rich", "squash", { amount: 0.08, dur: 0.15 });
look(T.siren1 + 0.25, "rich", [-0.2, 0.7], 0.15);
// he drags the two sacks to the loose tile and sinks them under the floor
A(r3(T.hide), "rich", "move", { to: [r3(HB[0] - 1.6), r3(HB[2] + 1.5)], dur: 0.9, steps: 4 });
pr(T.hide + 1.0, "hbagA", { y: -0.6 }, 0.3, "in"); pr(T.hide + 1.2, "hbagB", { y: -0.6 }, 0.3, "in");
sfx(T.hide + 1.0, "ai/bag-drag", { gain: 0.4, reason: "a sack dragged over marble" });
see(T.turn, T.door, ["rich.face"], "night, the huge marble hall: a siren's blue and red sweeps the tall windows; he freezes, then hides the money under a floor tile");

// ================================================================= S6 THE DOOR (20.5-24.0): ten locks; he shuts his friend out
const DOOR_AT = hw(HALL.DOOR.front);
place(T.door, "rich", [r3(DOOR_AT[0] + 0.5), r3(DOOR_AT[2] - 0.2)], -40);
expr(T.door, "rich", "terrified", { open: 0.1, eye: 1.25 }, 0.01);
arm(T.door, "rich", "R", { o: [0.15, 0.6, 0.4] }, 0.2); grip(T.door, "rich", "R", "press", 0.1);
for (let i = 0; i < 4; i++) sfx(r3(T.lock1 + i * 0.25), "latch", { gain: 0.45, reason: "a padlock snapping shut" });
sfx(T.knock, "ai/knock", { gain: 0.55, reason: "a knock on the front door" });
A(r3(T.knock + 0.1), "rich", "squash", { amount: 0.1, dur: 0.12 });
expr(T.knock + 0.1, "rich", "shocked", { open: 0.3, eye: 1.4 }, 0.15);
const CH = hw(HALL.CHIP_OUT);
place(T.chip, "chip", [CH[0], CH[2]], 180, CH[1]);
c.prop(r3(T.chip - PRE), "gift", { x: CH[0], y: r3(CH[1] + 0.22), z: r3(CH[2] - 0.34), scale: 0.6 }, 0.01, "linear");
expr(T.chip, "chip", "kind", { curve: 0.35, brow: 0.3 }, 0.01); look(T.chip, "chip", [0, 0.1], 0.01);
arm(T.chip, "chip", "R", { o: [0.12, 0.42, 0.32] }, 0.01); arm(T.chip, "chip", "L", { o: [0.12, 0.42, 0.32] }, 0.01);
say(T.chip + 0.15, "chip", "Spud? It's me!", 0.85, "question");
look(r3(T.back - 0.15), "rich", [0.6, 0.1], 0.15);
A(r3(T.back), "rich", "turn", { to: 150, dur: 0.3 });
arm(T.back, "rich", "R", "rest", 0.3); grip(T.back, "rich", "R", "relaxed", 0.2);
A(r3(T.back + 0.15), "rich", "move", { to: [r3(DOOR_AT[0] + 0.7), r3(DOOR_AT[2] - 0.8)], dur: 0.6, steps: 3 });
look(T.back + 0.4, "rich", [-0.7, 0.2], 0.2);   // over his shoulder, at the window
expr(T.back - 0.25, "chip", "sad", { curve: -0.2, brow: 0.6 }, 0.25);
see(T.door, T.clock, ["rich.face", "chip.face"], "the front door: ten locks snap shut; Chip knocks with a gift at the side window in the rain; Spud backs away and does not open");

// ================================================================= S6b 3:00 + S7 THE LOW (24.0-27.95)
park(T.clock, "chip", 2);
place(T.low, "rich", [hw(HALL.SEAT_END)[0], hw(HALL.SEAT_END)[2]], 0);
A(r3(T.low - PRE), "rich", "sit", { dur: 0.01, hands: "table" });
expr(T.low, "rich", "sad", { curve: -0.25, brow: 0.5 }, 0.01); look(T.low, "rich", [0, -0.35], 0.01);
A(r3(T.low + 1.6), "rich", "blink", { dur: 0.45 });
see(T.clock, T.low, ["clock"], "the clock at 3:00");
see(T.low, T.gate, ["rich.face"], "the loneliest picture: Spud tiny at the far end of a very long table, one candle");
// S8: the siren STOPS at the gate: the light stays in the windows
sfx(T.gate - 0.3, "sirenwail", { dur: 1.3, gain: 0.5, reason: "a siren coming up the road and stopping outside" });
expr(T.gate + 0.15, "rich", "terrified", { open: 0.35, eye: 1.45 }, 0.15);
look(T.gate + 0.15, "rich", [0, 0.8], 0.12);
A(r3(T.gate + 0.3), "rich", "stand", { dur: 0.25 });

// ================================================================= S8 THE GATE (28.7-30.45): he flees with the money
place(T.flee, "rich", GT.from, 140);
hug(T.flee - PRE, "rich");
expr(T.flee, "rich", "terrified", { open: 0.3 }, 0.01);
bagAlong(T.flee, "gbag", run(T.flee, "rich", [GT.from, [r3(GT.car[0] - 0.3), r3(GT.car[1] + 2.05)]], 4.4));
pr(T.flee - 0.1, "gwash", { on: 1 }, 0.1, "linear");
look(T.flee + 0.5, "rich", [-0.6, 0.0], 0.15);   // over his shoulder, at the light
sfx(T.flee + 0.1, "sirenwail", { dur: 1.6, gain: 0.45, reason: "the siren beyond the gate" });
sfx(T.flee + 1.3, "ai/car-door-shove", { gain: 0.4, reason: "the car door" });
see(T.flee, T.car, ["rich.face", "gcar"], "the mansion gate at night, red and blue light on the wet drive from beyond the gate: he runs to his car with a sack");

// ================================================================= S9 THE COAST ROAD (30.45-37.0): out of fuel; the ambulance
A(r3(T.car - PRE), "rich", "ride", { prop: "car", off: RIDE_OFF, yaw: 0, sit: true, dur: 0 });
for (const s of ["R", "L"]) { arm(T.car - PRE, "rich", s, "lap", 0.01); grip(T.car - PRE, "rich", s, "relaxed", 0.01); }
expr(T.car, "rich", "sad", { curve: -0.15, brow: 0.35 }, 0.01); look(T.car, "rich", [0.15, -0.05], 0.01);
rainCar(T.car, T.climb, 0.4);
pr(T.car - PRE, "car", { x: r3(CAR[0] - ROLL_IN), len: 0, wiper: 0, wiped: 0, gauge: 0.15 }, 0.01);
pr(T.car + 0.3, "car", { wiper: 1, wiped: 1 }, 0.55, "inOut"); pr(T.car + 0.9, "car", { wiper: 0.4 }, 0.4, "out");   // the wiper dies halfway back
look(T.car + 0.6, "rich", [0.0, -0.6], 0.2);   // down at the dash
pr(T.dash, "car", { gauge: 0 }, 0.45, "in"); pr(T.dash + 0.45, "car", { quiver: 1 }, 0.01); pr(T.dash + 0.6, "car", { quiver: 0 }, 0.01);
sfx(T.dash + 0.45, "click", { gain: 0.25, reason: "the needle hitting its stop" });
// the wide: the car rolls the last metres and stops; one cough from the exhaust; the lamps die
pr(T.wide, "car", { x: CAR[0], len: ROLL_IN, lamp: 0.3 }, 0.75, "out");
pr(T.stop, "car", { cough: 1 }, 0.9, "linear"); pr(T.stop + 0.95, "car", { cough: 0 }, 0.01);
sfx(T.wide, "freewheel", { gain: 0.3, reason: "tyres rolling to a stop on the wet road" });
// the climb: out on the rocks with one sack, looking back down at the road
const CL = (k) => { const x = COAST.CLIMB[0] * k, z = COAST.CLIMB[1] * k; return [r3(CP[0] + x), r3(CP[2] + z), r3(CP[1] + COAST.heightAt(x, z))]; };
const [c1x, c1z, c1y] = CL(13), [c2x, c2z, c2y] = CL(10.2);
A(r3(T.climb - 0.06), "rich", "ride", { prop: null, dur: 0 });
place(T.climb, "rich", [c1x, c1z], r3((Math.atan2(c2x - c1x, c2z - c1z) * 180) / Math.PI), c1y);
const cbag2 = P("coast", { id: "cbag2", kind: "moneybag", staged: "carried in his arms", mark: false, x: c1x, y: r3(c1y + 0.2), z: r3(c1z - 0.35), rot: 35 }, { from: T.climb, to: T.sunset, stay: true });
hug(T.climb - PRE, "rich");
A(T.climb, "rich", "move", { to: [c2x, c2z], y: c2y, dur: 1.6, steps: 5 });
{ const yaw = r3((Math.atan2(c2x - c1x, c2z - c1z) * 180) / Math.PI); c.prop(r3(T.climb - PRE), "cbag2", bagPos(c1x, c1z, yaw, c1y), 0.01, "linear"); c.prop(T.climb, "cbag2", bagPos(c2x, c2z, yaw, c2y), 1.6, "linear"); }
expr(T.climb, "rich", "terrified", { open: 0.15 }, 0.01);
sfx(T.amb - 0.4, "sirenwail", { dur: 2.2, gain: 0.55, reason: "a siren coming up the coast road" });
look(T.amb, "rich", [0.85, -0.3], 0.2);   // over his shoulder, down at the road
pr(T.amb - PRE, "amb", { lights: 1 }, 0.01);
for (let k = 1, N = 15, X0 = -10, X1 = 60, D = 3.0; k <= N; k++) { const x = X0 + ((X1 - X0) * k) / N, xp = X0 + ((X1 - X0) * (k - 1)) / N, rx = COAST.roadAt(x), rp = COAST.roadAt(xp), yaw = r3(90 - (Math.atan2(rx.z - rp.z, x - xp) * 180) / Math.PI);
  pr(r3(T.amb + (D * (k - 1)) / N), "amb", { x: r3(CP[0] + x), z: AMB_Z(x), y: AMB_Y(x), rot: yaw, len: r3(Math.hypot(x - X0, 0)) }, r3(D / N), "linear"); }
expr(T.nobody - 0.4, "rich", "shocked", { open: 0.1, brow: 0.2 }, 0.3);
wind(T.climb, END);
see(T.car, T.dash, ["rich.face"], "back in the car, the rain: he looks down at the dash");
see(T.dash, T.wide, ["car"], "the fuel needle drops to empty");
see(T.wide, T.climb, ["car"], "the gold car rolls to a stop at the roadside; a puff from the exhaust; the lamps die");
see(T.climb, T.sunset, ["rich.face"], "he climbs the cliff with one sack, looking back: an ambulance passes below and goes; nobody was ever coming");

// ================================================================= S10 THE SUNSET (37.0-48.0): the clouds break; his first smile
const SEAT = cw([0, 0, 0]);
place(T.sunset, "rich", [SEAT[0], SEAT[2]], 180, SEAT[1]);
A(r3(T.sunset - PRE), "rich", "sit", { rot: 180, dur: 0.01, height: 0, hands: "lap" });
expr(T.sunset, "rich", "sad", { curve: -0.1, brow: 0.3 }, 0.01); look(T.sunset, "rich", [0, 0.05], 0.01);
look(T.brk + 1.2, "rich", [0.15, 0.15], 0.6);   // up, to the light
expr(T.brk + 2.0, "rich", "kind", { curve: 0.0, brow: 0.15 }, 0.8);
// the notes: lifted from the open sack by the wind (DESIGN 6.5), keyed every 0.1 s
const M = cw(COAST.MOUTH), W = COAST.WIND, hsh = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
[0, 0.5, 0.8, 1.5, 1.9, 2.8, 3.6].forEach((dt, i) => {
  const id = `note${i}`, t0 = r3(T.open2 + dt);
  P("coast", { id, kind: "banknote", staged: "blown away by the wind", x: M[0], y: M[1], z: M[2], rot: 0, scale: 1 }, { from: T.open2, to: r3(Math.min(t0 + 5.0, END)) });
  const h1 = hsh(i, 1), h2 = hsh(i, 2), h3 = hsh(i, 3);
  for (let a = 0.1; a <= 5.0 + 1e-6 && t0 + a - 0.1 < END - 0.05; a = r3(a + 0.1)) {
    const s = 3.2 * (a - 0.8 * (1 - Math.exp(-a / 0.8))), y = 0.55 * a + 0.3 * Math.sin(2 * Math.PI * (0.9 * a + h1)), side = 0.25 * Math.sin(2 * Math.PI * (0.6 * a + h2)) + 0.4 * (h3 - 0.5) * a;
    c.prop(r3(t0 + a - 0.1), id, { x: r3(M[0] + W[0] * s - W[2] * side), y: r3(M[1] + y), z: r3(M[2] + W[2] * s + W[0] * side), rot: r3(((0.4 * a * 360) * (h1 > 0.5 ? 1 : -1)) % 360), tilt: r3(((1.2 * a * 360) * (h2 > 0.5 ? 1 : -1)) % 360) }, 0.1, "linear");
  }
});
sfx(T.open2, "crinkle", { gain: 0.3, reason: "notes lifting out of the sack" });
look(T.open2 + 0.3, "rich", [0.25, 0.15], 0.3);   // he sees them go, and lets them
expr(T.smile, "rich", "happy", { curve: 0.55, eye: 0.85 }, 0.9);
A(r3(T.smile + 0.5), "rich", "blink", { dur: 0.6 });
see(T.sunset, T.face, ["rich"], "the cliff top: Spud sits small with the sack beside him; the grey deck breaks open into a huge sunset over the sea");
see(T.face, T.hold, ["rich.face"], "close: the wind takes the notes out of the open sack; he lets them go and smiles for the first time");
see(T.hold, END, ["rich"], "the sunset hold");

// ---------------------------------------------------------------- shots
const inCar = (local, lookLocal, fov) => ({ pos: carW(local), look: carW(lookLocal), fov });
const AT9 = [r3(CAR[0] - ROLL_IN), CAR[1], CAR[2]], inCar2 = (local, lookLocal, fov) => ({ pos: carW(local, AT9), look: carW(lookLocal, AT9), fov });   // S9: the car still short of its stop
const SH = {
  open: inCar([-0.62, 1.3, 0.75], [0.22, 1.12, -0.3], 72),   // the coupe bench p01face: through the passenger side at the driver
  city: shot("city", [0, 1.2, 4.5], { tilt: -6, fov: 46 }),
  vault: { pos: vw(VAULT.CAM.p03.pos), look: vw(VAULT.CAM.p03.look), fov: VAULT.CAM.p03.fov },
  street: shot("street", [0.6, 1.9, 11.0], { fov: 46 }),
  hide: cam([1.6, 1.15, 8.6], 6, 40, -3),
  mday: cam([-0.5, 1.0, -1.0], 4, 42, 8),
  turn: { pos: hw([2.3, 1.3, 5.8]), look: hw([3.5, 0.6, 0.6]), fov: 48 },
  sidewin: { pos: hw([-1.0, 1.3, 9.2]), look: hw([-1.9, 0.5, 12.1]), fov: 42 },   // the rooms bench h_sidewin: Chip outside the side window
  door: { pos: hw([2.2, 1.0, 7.4]), look: hw([-0.9, 1.2, 11]), fov: 46 },
  clock: { pos: hw([-4.6, 1.8, -2.0]), look: hw(HALL.CLOCK_FACE), fov: 38 },
  low: { pos: hw(HALL.CAM.p06.pos), look: hw(HALL.CAM.p06.look), fov: HALL.CAM.p06.fov },
  gate: cam([0, 1.0, 8.0], 7.5, 46),
  dash: inCar2([-0.45, 1.02, -0.12], DASH, 28),
  car: inCar2([-0.62, 1.3, 0.75], [0.22, 1.12, -0.3], 72),
  wide: { pos: cw(COAST.CAM.c08wide.pos.map((v, i) => (i === 1 ? 2.4 : v))), look: cw(COAST.CAM.c08wide.look), fov: COAST.CAM.c08wide.fov },
  climb: { pos: cw([4.5, 0.85, 2.2]), look: cw(COAST.CAM.c08climb.look), fov: COAST.CAM.c08climb.fov },
  sunset: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov },
  face: { pos: cw(COAST.CAM.c10.pos), look: cw(COAST.CAM.c10.look), fov: COAST.CAM.c10.fov },
  hold: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov, to: { pos: cw(COAST.CAM.c09push.pos), look: cw(COAST.CAM.c09push.look), fov: COAST.CAM.c09push.fov }, dur: r3(END - T.hold), ease: "linear" },
};
const CUTS = [
  ["S1 rich and sad in the rain", 0, SH.open, "hook"],
  ["S2 the city", T.city, SH.city],
  ["S3 the vault", T.vault, SH.vault],
  ["S3b the escape", T.street, SH.street],
  ["S3b the corner", T.duck, SH.hide],
  ["S4 he bought everything", T.rich, SH.mday],
  ["S5 the siren", T.turn, SH.turn, "escalation"],
  ["S6 ten locks", T.door, SH.door],
  ["S6 Chip at the window", T.chip, SH.sidewin],
  ["S6 he backs away", T.back, SH.door],
  ["S6b 3:00", T.clock, SH.clock],
  ["S7 alone", T.low, SH.low],
  ["S8 he flees", T.flee, SH.gate],
  ["S9 the car", T.car, SH.car],
  ["S9 empty", T.dash, SH.dash],
  ["S9 the stop", T.wide, SH.wide],
  ["S9 the ambulance", T.climb, SH.climb],
  ["S10 the clouds break", T.sunset, SH.sunset],
  ["S10 the smile", T.face, SH.face, "payoff"],
  ["S10 the hold", T.hold, SH.hold, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0.15, "He has ten million.", 1.3],
  [1.65, "He hasn't smiled in thirty days.", 1.9],
  [4.0, "Thirty days earlier.", 1.2],
  [T.plan, "So he made a plan.", 1.0],
  [14.8, "He bought everything happy people have.", 2.2],
  [18.3, "But now he had something to lose.", 1.9],
  [T.nobody, "Nobody was ever coming for him.", 1.8],
  [T.forgot, "For one moment, he forgot everything he owned.", 2.8],
];
for (const [t, line, dur, pos = SUBY] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos, gain: NG });
const beats = c.beats(CUTS, END);   // after every item (items added later are dropped: draft 1 lost its narrator this way)

for (const p of props) { delete p._place; delete p._from; delete p._to; delete p._stay; }
const room = (type, pos, keys) => ({ type, pos, ...keys });
const COASTKEYS = { breakAt: T.brk, breakDur: 3.0, slit: [[0, 0], [T.wide, 0], [r3(T.wide + 0.8), 1]], rain: [[0, 1], [T.climb, 1], [r3(T.brk + 1.2), 0]], sink: [[0, 0], [T.hold, 0], [END, 1]] };
write(import.meta.url, {
  id: VO ? "money-happy" : "money-happy-no-vo",
  title: "Does money make you happy?",
  idea: "Happiness series pilot: Spud robs a bank because rich potatoes look happy, buys everything, and is only afraid of losing it; he flees from a siren that was never for him, his car runs dry on the coast, and the sunset gives him the smile the money didn't",
  format: "series: Spud looks for happiness (one life question per episode, never answered out loud)",
  fps: 30, look: "anime-pro", castLook: LOOK, profile: "short", loop: false, captionStyle: "kinetic", captionBand: [250, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING, loopIdle: false,
  set: {
    type: "env", env: ENVS.city,
    swap: PLACES.map(([at, name]) => (name === "coast" ? { at, room: room("coast", CP, COASTKEYS) }
      : name === "vault" ? { at, room: room("vault", VP, { doorAt: r3(T.vault - 0.5), doorDur: 1.2, alarmAt: T.alarm }) }
      : name === "hall" ? { at, room: room("mansionhall", HP, { locks: [[0, 0], [T.lock1, 1], [r3(T.lock1 + 0.25), 2], [r3(T.lock1 + 0.5), 4], [r3(T.lock1 + 0.75), 7], [T.lock10, 10]], sirenPass: [[T.siren1, r3(T.siren1 + 2.2)]], sirenStay: T.gate, rain: 1, candle: [[0, 0], [T.low, 1]], hatch: [[0, 0], [T.hide + 0.7, 0], [T.hide + 0.9, 1], [T.hide + 1.6, 1], [T.hide + 1.8, 0]] }) }
      : { at, env: ENVS[name] })),
    aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true,
  },
  music: { file: process.env.MUSIC ?? "money-happy/money-happy-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["rich", "car"], hint: 0, what: "a sad potato in a fur coat and gold chain at the wheel of a gold car in the rain, money bags piled on the back seat" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "pa", with: "limo", from: 0, to: T.vault, checks: ["shell", "body", "prop"], reason: "the couple sit on the bench inside the limousine" },
    { who: "pb", with: "limo", from: 0, to: T.vault, checks: ["shell", "body", "prop"], reason: "the couple sit on the bench inside the limousine" },
    { who: "pa", with: "pb", from: 0, to: T.vault, reason: "the couple sit shoulder to shoulder on the limousine's bench (arm round each other)" },
    { who: "rich", with: "car", from: T.wide, to: T.climb, checks: ["shell"], reason: "he sits inside the coupe as it rolls to a stop, seen from 30 m on the wide" },
    { who: "rich", with: "car", from: 0, to: T.city, reason: "he sits inside the coupe (the car encloses him)" },
    { who: "rich", with: "car", from: T.car, to: T.climb, reason: "he sits inside the coupe (the car encloses him)" },
    { who: "spud", with: "mask", from: T.vault, to: T.rich, reason: "the balaclava is worn (it covers his head)" },
    { who: "spud", with: "vbagL", from: T.vault, to: T.street, reason: "he hugs the sacks against his belly" },
    { who: "spud", with: "vbagR", from: T.vault, to: T.street, reason: "he hugs the sacks against his belly" },
    { who: "spud", with: "sbag", from: T.street, to: T.rich, reason: "he carries the sack in his arms" },
    { who: "rich", with: "gbag", from: T.flee, to: T.car, reason: "he carries the sack in his arms" },
    { who: "rich", with: "cbag2", from: T.climb, to: T.sunset, reason: "he carries the sack in his arms" },
    { who: "rich", with: "cbag2", from: T.climb, to: T.sunset, checks: ["shell"], reason: "the sack hugged against his coat while he climbs" },
  ],
  notes: "Generated by storyboards/series/happiness/01-does-money-make-you-happy/make-money-happy.mjs.",
});
