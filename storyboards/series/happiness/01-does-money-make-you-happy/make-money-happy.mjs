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
import { BANKHALL as BANK } from "../../../../engine/page/set-bankhall.js";
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
const T = {   // draft 2 with the narrator's real line lengths (farm run 43692886197)
  open: 0, wipe: 2.6, city: 6.2, reach: 6.9, palm: 7.35, pat: 7.75, lining: 8.15, palms: 8.6, cupback: 8.9,
  watch: 10.6, stare: 11.5, mumble: 14.1, plan: 15.7, bank: 17.5, give: 17.7, hands: 18.05, gun: 18.9, bags: 19.25,
  robbed: 20.45, street: 21.7, cars: 22.5, duck: 23.55, past: 23.3, laugh: 24.25, rich: 24.8, spread: 25.3,
  turn: 28.7, siren1: 28.9, hide: 30.7, door: 33.7, lock1: 33.9, lock10: 34.9, knock: 34.9, chip: 35.2, back: 36.3,
  clock: 40.0, low: 41.0, gate: 43.8, flee: 45.4, car: 47.7, dash: 48.5, wide: 49.5, stop: 50.3, climb: 51.1,
  amb: 51.5, nobody: 53.1, sunset: 57.8, brk: 58.2, storm: 59.4, face: 62.9, smile: 64.2, forgot: 65.95, hold: 65.8, close: 54.4,
  END: 70.6,
};
const END = T.END;

// ---------------------------------------------------------------- places
const CP = [0, 0, -600], BP = [300, 0, 0], HP = [-300, 0, 0];   // rooms (coast frame, bank frame, hall frame + these)
const cw = (p) => [r3(p[0] + CP[0]), r3(p[1] + CP[1]), r3(p[2] + CP[2])];
const bw = (p) => [r3(p[0] + BP[0]), r3(p[1] + BP[1]), r3(p[2] + BP[2])];
const hw = (p) => [r3(p[0] + HP[0]), r3(p[1] + HP[1]), r3(p[2] + HP[2])];
const ENVS = {
  city: "golden-city-crossing", street: "dusk-bus-stop",
  mday: envOk("mansion-day") ? "mansion-day" : "golden-city-crossing",
  gate: envOk("mansion-gate-night") ? "mansion-gate-night" : "dusk-back-alley",
};
const PLACES = [[0, "coast"], [T.city, "city"], [T.bank, "bank"], [T.street, "street"], [T.rich, "mday"], [T.turn, "hall"], [T.flee, "gate"], [T.car, "coast"]];
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
  { id: "spud", character: "potatobrawl/spud-poor", at: PARK(1), face: 0, expr: "sad", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: PARK(2), face: 0, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "duch", character: "potatobrawl/duchess", at: PARK(3), face: 0, expr: "delighted", follow: 0.3, seed: 3.1 },
  { id: "daup", character: "potatobrawl/dauphin", at: PARK(4), face: 0, expr: "smug", follow: 0.3, seed: 4.2 },
  { id: "tot", character: "potatobrawl/tot", at: PARK(5), face: 0, expr: "kind", follow: 0.3, seed: 5.3 },
  { id: "rosti", character: "potatobrawl/rosti", at: PARK(6), face: 0, expr: "kind", follow: 0.3, seed: 6.1 },
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
const w3 = (base, d) => [r3(base[0] + d[0]), r3(base[1] + d[1]), r3(base[2] + d[2])];
const SUBY = 470;   // speech lettering in the upper third (Jonny 12 Nov)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });

// ---------------------------------------------------------------- props, each in its place (shown only while its place is up)
const props = [];
const P = (where, spec, { from = 0, to = 99, stay = false } = {}) => { props.push({ ...spec, _place: where, _from: from, _to: to, _stay: stay }); return spec; };
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.01, ease = "linear") => { if (has(id)) c.prop(r3(t), id, set, dur, ease); };

// ---- coast: the coupe (S1, S9), the bag and the notes (S10), the ambulance (S9)
P("coast", { id: "car", kind: "coupe", x: CAR[0], y: CAR[1], z: CAR[2], rot: CAR_ROT, streaks: 0 });
P("coast", { id: "cbag", kind: "moneybag", staged: "lying flat on the cliff grass, emptied by the wind", mark: false, x: cw(COAST.BAG)[0], y: CP[1], z: cw(COAST.BAG)[2], rot: 200, open: true }, { from: T.sunset });
// the money storm (DESIGN 11.6): every note in the sack, a pure function of the clip time from t0
P("coast", { id: "storm", kind: "notestorm", x: CP[0], y: CP[1], z: CP[2], rot: 0, t0: T.storm, n: 700, seed: 1, size: 1.3 }, { from: T.sunset });
const AMB_Z = (x) => r3(CP[2] + COAST.roadAt(x).z), AMB_Y = (x) => r3(CP[1] + COAST.roadAt(x).y);
if (HAPPY) P("coast", { id: "amb", kind: "ambulance", x: r3(CP[0] - 10), y: AMB_Y(-10), z: AMB_Z(-10), rot: 90, lights: 0 }, { from: T.climb });
// ---- city (S2, DESIGN 11.4): the coffee cart, the parked limo, the couple's bags, his pocket linings
const CITY = { cart: [-1.25, 1.0], seller: [-2.05, 1.0], buy: [-0.42, 1.0], watch: [-0.2, 2.2], duch: [0.35, -0.3], daup: [1.75, -0.25] };
P("city", { id: "cart", kind: "coffeecart", x: CITY.cart[0], z: CITY.cart[1], rot: 0 });
const CUP = [r3(CITY.cart[0] - 0.08), 0.46, r3(CITY.cart[1] + 0.18)];
P("city", { id: "cup", kind: "cocoacup", x: CUP[0], y: CUP[1], z: CUP[2], rot: 0 });
P("city", { id: "apron", kind: "apron", wear: "rosti", x: 0, y: 0, z: 0 });
P("city", { id: "phat", kind: "paperhat", wear: "rosti", x: 0, y: 0, z: 0 });
P("city", { id: "limo", kind: "limo", open: null, x: 2.0, z: -2.35, rot: 90 });
const SBAGS = [["sb1", "duch", "R", "#f29bb5"], ["sb2", "duch", "L", "#f2c75a"], ["sb3", "daup", "L", "#c9a6e8"]].map(([id, who, side, color]) => ({ who, side, spec: P("city", { id, kind: "shopbag", color, x: 0, y: 0, z: 0, rot: 0 }) }));
P("city", { id: "plA", kind: "pocketlining", wear: "spud", x: 0.34, y: 0.24, z: 0.1, side: 1, w: 0.16, h: 0.11, color: "#fbf8f1" }, { to: T.bank });
P("city", { id: "plB", kind: "pocketlining", wear: "spud", x: -0.34, y: 0.24, z: 0.1, side: -1, w: 0.16, h: 0.11, color: "#fbf8f1", scale: 1 }, { to: T.bank });
// ---- the bank counter (S3a, DESIGN 11.5): the gun, three sacks the cashier pushes through the slot
P("bank+street", { id: "mask", kind: "balaclava", wear: "spud", x: 0, y: 0, z: 0 }, { stay: true });
const GUNP = bw([BANK.GUN[0], BANK.GUN[1], 0.35]);   // 0.15 nearer the lens than the design: clear of his eyes in the two-shot and of the sacks on his ledge
P("bank", { id: "gun", kind: "zrevolver", x: GUNP[0], y: GUNP[1], z: GUNP[2], rot: 90, scale: 0.9, flash: 0, smoke: 0, staged: "in his right fist" });
const BZ = [-0.62, 0.62];   // two sacks on the teller's ledge behind the bars, either side of the arch
const BAGS3 = BZ.map((z, i) => P("bank", { id: `kb${i}`, kind: "moneybag", mark: false, x: bw(BANK.BAG_WAIT[0])[0], y: BANK.TOP, z: r3(BP[2] + z), rot: 90, staged: "on the teller's ledge, then pushed over the counter by her palm" }));
// ---- the night street (S3b): one sack in his arms, the police cars, their light
const ST = { start: [0, -6.0], cross: [0.6, -1.5], hide: [1.3, 4.2] };
const SBAG = P("street", { id: "sbag", kind: "moneybag", staged: "carried in his arms", mark: false, x: r3(ST.start[0]), y: 0.2, z: r3(ST.start[1] + 0.4), rot: 180 }, { stay: true });
P("street", { id: "bank", kind: "bankfront", x: 0, z: -9 });
[["pc1", -16, -2.7], ["pc2", -22, -3.3], ["pc3", -28, -2.9]].forEach(([id, x, z]) => P("street", { id, kind: "policecar", x, z, rot: 90, lights: 1 }));
P("street", { id: "wash", kind: "sirenwash", x: 1.3, y: 0.2, z: 3.4, w: 3, h: 2.6, on: 0 });
// ---- the mansion by day (S4): the coupe on the gravel
const MD = { car: [3.6, -5.6], spud: [0.25, -6.4] };
P("mday", { id: "dcar", kind: "coupe", x: MD.car[0], z: MD.car[1], rot: -60, load: 0, rain: 0 });
P("mday", { id: "fountain", kind: "fountain", x: 0, z: -11 });
// ---- the hall (S5-S8): the bags he hides, the gift Chip brings
const HB = hw([HALL.HATCH[0], 0, HALL.HATCH[2]]);
// the two sacks on the floor beside the open hole (the loose tile: a 1.0 diamond round HB), he pushes them in by hand
const HBAG = { hbagA: [-0.42, 0.3, 0.17], hbagB: [-0.42, -0.3, -0.17] };   // [dx, dz, dz in the hole]
for (const [id, [dx, dz]] of Object.entries(HBAG)) P("hall", { id, kind: "moneybag", mark: false, x: r3(HB[0] + dx), y: 0, z: r3(HB[2] + dz), rot: 90, staged: "on the floor by the hole, then pushed in by his hands" });
P("hall", { id: "gift", kind: "gift", staged: "Chip holds the gift up in both hands", x: 0, y: -30, z: 0, scale: 0.6 }, { stay: true });
// ---- the gate at night (S8)
const GT = { car: [1.5, -2.6], from: [-0.7, 3.6] };
P("gate", { id: "gcar", kind: "coupe", x: GT.car[0], z: GT.car[1], rot: -90, load: 0.6, rain: 0.6 });
const GBAG = P("gate", { id: "gbag", kind: "moneybag", staged: "carried in his arms", mark: false, x: r3(GT.from[0]), y: 0.2, z: r3(GT.from[1] + 0.4), rot: 180 }, { stay: true });
P("gate", { id: "gwash", kind: "sirenwash", x: 0, z: -9.5, w: 8, h: 6, flat: true, on: 0 });
P("gate", { id: "igate", kind: "irongate", x: 0, z: -7 });

// prime every key that is first tweened later (an unseeded tween writes NaN)
pr(0, "car", { rain: 1, wiper: 0, wiped: 0, gauge: 0.18, quiver: 0, cough: 0, lamp: 1, load: 1 });
pr(0, "dcar", { rain: 0, wiper: 0, wiped: 0, gauge: 1, quiver: 0, cough: 0, lamp: 0, load: 0 });
pr(0, "gcar", { rain: 0.6, wiper: 0, wiped: 0, gauge: 0.4, quiver: 0, cough: 0, lamp: 0, load: 0.6 });
pr(0, "wash", { on: 0, clock: 0 }); pr(0, "gwash", { on: 0, clock: 0 }); pr(0, "igate", { open: 0, lit: 1, wet: 1 }); pr(0, "bank", { alarm: 1, clock: 0 }); pr(0, "fountain", { on: 1 });
pr(0, "amb", { lights: 0, clock: 0, len: 0 }); pr(0, "limo", { len: 0 }); pr(0, "cbag", { full: 1 });

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

// ================================================================= S2 THE CITY (4.3-13.4): no money for a coffee; the rich
// S2a, the coffee cart (DESIGN 11.4, beat 1): he reaches for the cup, the seller's palm comes up, he pats his hem, pulls
// the lining out, shows two empty palms; the seller draws the cup back
const SBUY = CITY.buy, SELL = CITY.seller;
place(T.city, "spud", [r3(SBUY[0] + 0.75), r3(SBUY[1] + 0.3)], -70); place(T.city, "rosti", SELL, 65);
A(r3(T.city + 0.02), "spud", "move", { to: SBUY, dur: 0.6, steps: 3 });
A(r3(T.city + 0.6), "spud", "turn", { to: -65, dur: 0.15 });
// the seller wipes his counter until the customer's hand comes out
for (let k = 0; k < 3; k++) { arm(r3(T.city + 0.05 + k * 0.4), "rosti", "R", { world: [-1.6, 0.54, 0.94] }, 0.2); arm(r3(T.city + 0.25 + k * 0.4), "rosti", "R", { world: [-1.6, 0.54, 1.2] }, 0.2); }
grip(T.city + 0.05, "rosti", "R", "flat", 0.1);
look(T.city + 0.6, "rosti", [0.6, 0.05], 0.15);
A(r3(T.city - PRE), "spud", "droop", { to: 0.6, dur: 0.01 }); A(r3(T.city - PRE), "spud", "lean", { to: 6, dur: 0.01 });
for (const s of ["R", "L"]) { arm(T.city - PRE, "spud", s, "rest", 0.01); grip(T.city - PRE, "spud", s, "relaxed", 0.01); arm(T.city - PRE, "rosti", s, "rest", 0.01); }
arm(T.city - PRE, "rosti", "R", { world: [-1.6, 0.54, 1.05] }, 0.01);
expr(T.city, "spud", "sad", { curve: -0.35, brow: 0.5 }, 0.01); look(T.city, "spud", [-0.4, -0.1], 0.01);
expr(T.city, "rosti", "kind", { curve: 0.3 }, 0.01); look(T.city, "rosti", [0.4, 0], 0.01);
// the reach (eager: the one hopeful beat)
expr(T.reach - 0.1, "spud", "eager", { curve: 0.2, eye: 1.1 }, 0.15);
arm(T.reach, "spud", "L", { world: [-0.78, 0.5, 1.22] }, 0.3, "out"); grip(T.reach, "spud", "L", "open", 0.2);   // the camera-side hand: the far one crossed his face
// the seller's palm: first the money
arm(T.palm, "rosti", "R", { world: [-1.62, 0.68, 0.98] }, 0.25, "out"); grip(T.palm, "rosti", "R", "flat", 0.15);
expr(T.palm, "rosti", "focused", { brow: 0.4, curve: 0 }, 0.2);
// pat, pat: both hem sides
arm(T.pat - 0.1, "spud", "R", { x: [-0.36, up(0.26), 0.08] }, 0.2); grip(T.pat - 0.1, "spud", "R", "flat", 0.15);
arm(T.pat - 0.1, "spud", "L", { x: [0.36, up(0.26), 0.08] }, 0.2); grip(T.pat - 0.1, "spud", "L", "flat", 0.15);
for (const k of [0, 1]) for (const s of ["R", "L"]) { const sx = s === "R" ? -1 : 1; arm(r3(T.pat + 0.1 + k * 0.18), "spud", s, { x: [r3(sx * 0.37), up(0.21), 0.08] }, 0.08); arm(r3(T.pat + 0.19 + k * 0.18), "spud", s, { x: [r3(sx * 0.36), up(0.26), 0.08] }, 0.08); }
expr(T.pat, "spud", "worried", { brow: 0.6, open: 0.1 }, 0.15);
// the right lining comes out in his pinch
arm(T.lining - 0.1, "spud", "R", { x: [-0.44, up(0.22), 0.12] }, 0.15); grip(T.lining - 0.1, "spud", "R", "pinch", 0.1);
pr(0, "plB", { scale: 0.001 }); pr(T.lining, "plB", { scale: 1 }, 0.17, "out");
// two empty palms
for (const s of ["R", "L"]) { arm(T.palms, "spud", s, "shrug", 0.25, "out"); grip(T.palms, "spud", s, "open", 0.2); }
expr(T.palms, "spud", "sad", { curve: -0.4, brow: 0.6 }, 0.25); look(T.palms, "spud", [-0.2, -0.3], 0.2);
// the seller shakes his head: no money, no coffee
expr(T.cupback, "rosti", "sad", { curve: -0.1, brow: 0.3 }, 0.2);
for (const [k, x] of [[0, -0.35], [1, 0.75], [2, -0.35], [3, 0.4]]) look(r3(T.cupback + k * 0.16), "rosti", [x, 0], 0.12);
see(T.city, T.watch, ["spud.face", "rosti", "cup"], "noon, a coffee cart: dirty, sad Spud reaches for a coffee; the seller holds out his palm; Spud turns out his empty pockets and shows two empty hands");

// S2b, the rich (DESIGN 11.2): a laughing couple with shopping bags walk up to their white limousine behind him
const WATCH0 = [-0.7, 1.85];
place(T.watch, "spud", WATCH0, 20);
for (const s of ["R", "L"]) { arm(T.watch - PRE, "spud", s, "rest", 0.01); grip(T.watch - PRE, "spud", s, "relaxed", 0.01); }
expr(T.watch, "spud", "sad", { curve: -0.35, brow: 0.5 }, 0.01); look(T.watch, "spud", [0, -0.35], 0.01);
A(r3(T.watch + 0.05), "spud", "move", { to: CITY.watch, dur: 0.8, steps: 3 });
park(T.watch, "rosti", 6);
park(T.bank, "duch", 3); park(T.bank, "daup", 4); park(T.street, "tot", 5);
// the couple: in from the right, bags in their fists, to their marks beside the limo
const CPL = { duch: [CITY.duch, 20, [4.6, -0.2]], daup: [CITY.daup, -20, [5.8, -0.15]] };
for (const [who, [to, yaw, from]] of Object.entries(CPL)) {
  place(T.watch, who, from, -90);
  for (const s of ["R", "L"]) { arm(T.watch - PRE, who, s, "rest", 0.01); grip(T.watch - PRE, who, s, "relaxed", 0.01); }
  expr(T.watch, who, "delighted", { curve: 0.8, open: 0.4 }, 0.01); look(T.watch, who, [0, 0.1], 0.01);
  A(r3(T.watch + 0.1), who, "move", { to, dur: 1.4, steps: 5 });
  A(r3(T.watch + 1.5), who, "turn", { to: yaw, dur: 0.35 });
}
// the bags: the fist up at the loop (y 0.55+), the bag hanging under it (SHOPBAG_GRIP), held from the cut
for (const { who, side, spec } of SBAGS) {
  const sx = side === "R" ? -1 : 1;
  arm(T.watch - 0.011, who, side, { x: [r3(sx * 0.52), 0.42, 0.12] }, 0.001);
  grip(T.watch - 0.011, who, side, "hold", 0.001);
  pr(T.watch - 0.009, spec.id, { x: CPL[who][2][0], z: CPL[who][2][1], y: 0.15, rot: -90 }, 0.001);
  A(r3(T.watch - 0.006), who, "grab", { prop: spec.id, hand: side, grip: [0, 0.41, 0], dur: 0, pose: null });
}
// they laugh together, never looking at him
for (const [who, i] of [["duch", 0], ["daup", 1]]) {
  look(T.watch + 1.6, who, [i ? -0.7 : 0.7, 0.05], 0.2);
  for (const k of [0, 1, 2]) A(r3(T.stare + 0.4 + k * 0.5 + i * 0.18), who, "hop", { height: 0.03, dur: 0.22, quiet: true });
}
// he turns to stare at them, then back to us with his question
A(T.stare, "spud", "turn", { to: 172, dur: 0.5 });
look(T.stare + 0.1, "spud", [0, 0.1], 0.2);
look(r3(T.mumble - 0.85), "spud", [0.3, 0], 0.15);
A(r3(T.mumble - 0.7), "spud", "turn", { to: 10, dur: 0.65 });
expr(T.mumble - 0.2, "spud", "focused", { brow: 0.6, curve: -0.05 }, 0.2);
say(T.mumble, "spud", "Mo-ney... ha-ppy?", 1.0, "question");
act.idea(c, T.plan - 0.1, "spud", { at: [0.25, -0.3], hold: 0.7 });
see(T.watch, T.bank, ["spud.face", "duch.face", "daup.face", "limo"], "behind him a rich couple in fur, pearls and velvet laugh by their white limousine with shopping bags; he stares, then wonders");

// ================================================================= S3a THE BANK (13.4-17.6, DESIGN 11.5): the hold-up
const BS = bw(BANK.SPUD), BC = bw(BANK.CASHIER);
place(T.bank, "spud", [BS[0], BS[2]], 45); place(T.bank, "tot", [BC[0], BC[2]], -50, BC[1]);
A(r3(T.bank - PRE), "spud", "droop", { to: 0, dur: 0.01 }); A(r3(T.bank - PRE), "spud", "lean", { to: 0, dur: 0.01 });
// the revolver in his right fist (the bank bench's hold), level at her vest
arm(r3(T.bank - 0.011), "spud", "R", { world: GUNP }, 0.001);
A(r3(T.bank - 0.008), "spud", "grab", { prop: "gun", hand: "R", grip: "hand", dur: 0, pose: null });
arm(T.bank - PRE, "spud", "L", "rest", 0.01); grip(T.bank - PRE, "spud", "L", "relaxed", 0.01);
expr(T.bank, "spud", "angry", { brow: 0.8 }, 0.01); look(T.bank, "spud", [0.5, 0.1], 0.01);
expr(T.bank, "tot", "kind", { curve: 0.3 }, 0.01); look(T.bank, "tot", [-0.4, 0], 0.01);
for (const s of ["R", "L"]) { arm(T.bank - PRE, "tot", s, "rest", 0.01); grip(T.bank - PRE, "tot", s, "relaxed", 0.01); }
A(r3(T.bank - PRE), "tot", "wings", { to: 0, dur: 0.01 });
say(T.give, "spud", "Gi-ve mo-ney!", 0.9, "angry");
// the left palm: the seller's gesture, turned round (beckon twice)
const BECK = [w3(BS, [0.45, 0.6, -0.32]), w3(BS, [0.36, 0.66, -0.32])];
arm(T.give, "spud", "L", { world: BECK[0] }, 0.25, "out"); grip(T.give, "spud", "L", "flat", 0.2);
for (const k of [0, 1, 2, 3]) arm(r3(T.give + 0.4 + k * 0.22), "spud", "L", { world: BECK[(k + 1) % 2] }, 0.18);
// the cashier: hands up, the glasses slip
expr(T.hands, "tot", "terrified", { open: 0.35, eye: 1.4 }, 0.15);
for (const s of ["R", "L"]) { arm(T.hands, "tot", s, "up", 0.2, "out"); grip(T.hands, "tot", s, "open", 0.15); }
A(T.hands, "tot", "wings", { to: 1, dur: 0.2 });
A(r3(T.hands), "tot", "squash", { amount: 0.08, dur: 0.15 });
sfx(T.hands, "ai/surface-gasp", { gain: 0.35, reason: "the cashier's gasp" });
// she steps to each sack, pushes it along the ledge to the arch, then through it to his side (her palm on it all the way)
const OUT = [[-0.1, -0.24], [-0.1, 0.07]];
BAGS3.forEach((b, i) => {
  const t0 = r3(T.bags + i * 0.7), z0 = BZ[i], sz = Math.sign(z0), s = sz < 0 ? "R" : "L";   // facing -65 her left is +z
  const X = (x) => r3(BP[0] + x), Z = (z) => r3(BP[2] + z);
  A(r3(t0 - 0.3), "tot", "move", { to: [X(0.62), Z(z0 * 0.55)], y: BC[1], dur: 0.25, steps: 1 });
  arm(r3(t0 - 0.3), "tot", s, { world: [X(0.15), 0.66, Z(z0 + sz * 0.19)] }, 0.28); grip(r3(t0 - 0.3), "tot", s, "flat", 0.1);
  pr(t0, b.id, { z: Z(OUT[i][1]) }, 0.3, "inOut");
  arm(t0, "tot", s, { world: [X(0.15), 0.66, Z(OUT[i][1] + sz * 0.19)] }, 0.3, "inOut");
  A(r3(t0 + 0.28), "tot", "move", { to: [X(0.62), Z(OUT[i][1])], y: BC[1], dur: 0.14, steps: 1 });
  arm(r3(t0 + 0.3), "tot", s, { world: [X(0.3), 0.66, Z(OUT[i][1])] }, 0.12);
  pr(r3(t0 + 0.42), b.id, { x: X(OUT[i][0]) }, 0.25, "inOut");
  arm(r3(t0 + 0.42), "tot", s, { world: [X(OUT[i][0] + 0.15), 0.66, Z(OUT[i][1])] }, 0.25, "inOut");
  arm(r3(t0 + 0.68), "tot", s, "up", 0.2, "out"); grip(r3(t0 + 0.68), "tot", s, "open", 0.1);
  sfx(r3(t0 + 0.05), "ai/bag-drag", { gain: 0.3, reason: "a sack slid over the marble counter" });
});
A(r3(T.bags + 1.45), "tot", "move", { to: [BC[0], BC[2]], y: BC[1], dur: 0.3, steps: 1 });
expr(T.robbed - 0.4, "spud", "evil", { curve: 0.5 }, 0.2);
see(T.bank, T.street, ["spud.face", "tot.face", "gun", "kb0"], "a bank counter: Spud in a black balaclava points a revolver at the terrified cashier and beckons; she pushes two sacks of money over the counter to him");

// ================================================================= S3b THE NIGHT STREET (11.0-14.45): the escape
A(r3(T.street - 0.02), "spud", "release", { prop: "gun", to: [GUNP[0], -30, GUNP[2]], dur: 0 });
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
A(r3(T.spread + 0.75), "rich", "turn", { to: 370, dur: 1.0, ease: "inOut" });   // a full spin, arms wide
A(r3(T.spread + 1.85), "rich", "hop", { height: 0.1, dur: 0.32, quiet: true });
sfx(T.rich + 0.1, "ai/step-concrete", { gain: 0.3, reason: "a step on the gravel" });
see(T.rich, T.turn, ["rich.face", "dcar"], "the white mansion by day, a fountain, the gold car: Spud in his fur coat throws his arms wide");

// ================================================================= S5 THE TURN (24.0-29.0): a siren passes; he hides the money
// he kneels by his secret hole in the hall floor; a siren's light sweeps the windows; he pushes both sacks in by hand,
// shuts the tile with his palm, and listens
const HS = [r3(HB[0] - 1.0), HB[2]];
place(T.turn, "rich", HS, 90);
for (const s of ["R", "L"]) { arm(T.turn - PRE, "rich", s, "rest", 0.01); grip(T.turn - PRE, "rich", s, "relaxed", 0.01); }
expr(T.turn, "rich", "kind", { curve: 0.25 }, 0.01); look(T.turn, "rich", [0.2, -0.4], 0.01);
sfx(T.siren1, "sirenwail", { dur: 2.2, gain: 0.45, reason: "a siren passing on the road outside" });
expr(T.siren1 + 0.2, "rich", "terrified", { open: 0.2, eye: 1.35 }, 0.1);
A(r3(T.siren1 + 0.2), "rich", "squash", { amount: 0.08, dur: 0.15 });
look(T.siren1 + 0.25, "rich", [-0.6, 0.5], 0.15);
// two sacks: crouch, both palms on the back of the sack, push it to the hole's edge, it drops in
const sackIn = (t, id) => {
  const [dx, dz, dz2] = HBAG[id], bx = r3(HB[0] + dx), bz = r3(HB[2] + dz), ex = r3(HB[0] - 0.12), ez = r3(HB[2] + dz2);
  const hands = (x, z) => [["R", r3(z + 0.09)], ["L", r3(z - 0.09)]].map(([s, hz]) => [s, [r3(x - 0.15), 0.2, hz]]);
  A(r3(t - 0.3), "rich", "move", { to: [r3(HB[0] - 1.0), r3(HB[2] + dz * 0.5)], dur: 0.25, steps: 1 });
  for (const [s, at] of hands(bx, bz)) { arm(t, "rich", s, { world: at }, 0.22); grip(t, "rich", s, "flat", 0.12); }
  A(r3(t + 0.25), "rich", "move", { to: [r3(HB[0] - 0.62), r3(HB[2] + dz2 * 0.5)], dur: 0.3, steps: 1 });
  look(t, "rich", [0.1, -0.6], 0.15);
  pr(r3(t + 0.25), id, { x: ex, z: ez }, 0.3, "inOut");
  for (const [s, at] of hands(ex, ez)) arm(r3(t + 0.25), "rich", s, { world: at }, 0.3, "inOut");
  pr(r3(t + 0.58), id, { y: -0.45, tilt: 25 }, 0.18, "in");
  sfx(r3(t + 0.74), "thud", { gain: 0.4, reason: "the sack lands at the bottom of the hole" });
};
A(r3(T.hide - 0.9), "rich", "crouch", { to: 0.55, dur: 0.25 });
look(T.hide - 0.6, "rich", [0.2, -0.5], 0.2);
expr(T.hide - 0.7, "rich", "worried", { brow: 0.7, open: 0.15 }, 0.2);
sackIn(r3(T.hide - 0.6), "hbagA");
sackIn(r3(T.hide + 0.35), "hbagB");
// the tile: his right palm on its lifted edge, pushed down shut
const TILE = [r3(HB[0] - 0.22), r3(HB[2] + 0.12)];
arm(T.hide + 1.3, "rich", "R", { world: [TILE[0], 0.4, TILE[1]] }, 0.25); grip(T.hide + 1.3, "rich", "R", "flat", 0.1);
arm(T.hide + 1.3, "rich", "L", "rest", 0.25);
arm(T.hide + 1.6, "rich", "R", { world: [TILE[0], 0.12, TILE[1]] }, 0.35, "in");
sfx(T.hide + 1.95, "thud", { gain: 0.35, reason: "the floor tile dropping back into place" });
A(r3(T.hide + 2.15), "rich", "crouch", { to: 0, dur: 0.35 });
arm(T.hide + 2.15, "rich", "R", "rest", 0.3); grip(T.hide + 2.15, "rich", "R", "relaxed", 0.2);
look(T.hide + 2.3, "rich", [-0.7, 0.3], 0.25); look(T.hide + 2.75, "rich", [0.6, 0.3], 0.25);
see(T.turn, T.door, ["rich.face", "hbagA"], "night, the huge marble hall: kneeling by a hole in the floor, a siren's blue and red sweeps the windows; he pushes the money sacks into the hole and shuts the tile");

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
// S9 close: in front of him at the top of his climb, a little to his right, at his eye height
const YAW9 = (Math.atan2(c2x - c1x, c2z - c1z) * 180) / Math.PI, F9 = [Math.sin(rad(YAW9)), Math.cos(rad(YAW9))], R9 = [-F9[1], F9[0]];
const CLOSE9 = { pos: [r3(c2x + F9[0] * 2.8 + R9[0] * 0.5), r3(c2y + 0.75), r3(c2z + F9[1] * 2.8 + R9[1] * 0.5)], look: [c2x, r3(c2y + 0.62), c2z], fov: 38 };
look(r3(T.close + 0.05), "rich", [0.15, -0.15], 0.35);   // back from the road, down: nobody was ever coming
expr(T.close + 0.1, "rich", "sad", { curve: -0.1, brow: 0.45 }, 0.4);
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
// the gust that broke the clouds rolls the sack flat; ALL the notes pour out and fly into the sun (the notes go first)
pr(r3(T.storm + 0.8), "cbag", { full: 0 }, 3.6, "inOut");
sfx(T.storm, "ai/storm-wind", { gain: 0.22, dur: 4.5, reason: "the gust over the cliff that takes the money" });
sfx(r3(T.storm + 0.8), "ai-package/cardboard-rustle", { gain: 0.3, reason: "hundreds of paper notes rustling out of the sack" });
expr(T.storm + 0.6, "rich", "shocked", { open: 0.3, eye: 1.3 }, 0.2);
look(T.storm + 0.7, "rich", [0.35, 0.35], 0.3);   // up, after the notes
expr(T.face - 0.3, "rich", "sad", { curve: -0.05, brow: 0.2 }, 0.4);
look(T.face + 0.2, "rich", [-0.4, 0.45], 0.6);    // the last of them rising up the left
expr(T.smile, "rich", "happy", { curve: 0.55, eye: 0.85 }, 0.9);
see(T.sunset, T.face, ["rich"], "the cliff top: Spud sits small with the sack beside him; the grey deck breaks open into a huge sunset over the sea");
see(T.face, T.hold, ["rich.face"], "close: the wind takes the notes out of the open sack; he lets them go and smiles for the first time");
see(T.hold, END, ["rich"], "the sunset hold");

// ---------------------------------------------------------------- shots
const inCar = (local, lookLocal, fov) => ({ pos: carW(local), look: carW(lookLocal), fov });
const AT9 = [r3(CAR[0] - ROLL_IN), CAR[1], CAR[2]], inCar2 = (local, lookLocal, fov) => ({ pos: carW(local, AT9), look: carW(lookLocal, AT9), fov });   // S9: the car still short of its stop
const SH = {
  open: inCar([-0.62, 1.3, 0.75], [0.22, 1.12, -0.3], 72),   // the coupe bench p01face: through the passenger side at the driver
  city: shot("city", [-1.25, 1.2, 5.4], { tilt: -6, fov: 48 }),   // DESIGN 11.4 camera 2a: the cart, the seller, Spud
  cityb: shot("city", [0.3, 1.9, 6.6], { pan: 2, tilt: -9, fov: 50 }),    // 2b: limo roof, the couple, Spud in front
  bank: { pos: bw([-0.12, 0.95, 4.6]), look: bw([-0.12, 0.72, 0]), fov: 52 },   // the design two-shot, wider
  overgun: { pos: bw(BANK.CAM.overgun.pos), look: bw(BANK.CAM.overgun.look), fov: BANK.CAM.overgun.fov },
  street: shot("street", [0.6, 1.9, 11.0], { fov: 46 }),
  hide: cam([1.6, 1.15, 8.6], 6, 40, -3),
  mday: cam([-0.5, 1.0, -1.0], 4, 42, 8),
  turn: { pos: hw([5.9, 1.05, 1.3]), look: hw([3.5, 0.32, -0.75]), fov: 46 },   // across the hole at his face
  sidewin: { pos: hw([-1.0, 1.3, 9.2]), look: hw([-1.9, 0.5, 12.1]), fov: 42 },   // the rooms bench h_sidewin: Chip outside the side window
  door: { pos: hw([2.2, 1.0, 7.4]), look: hw([-0.9, 1.2, 11]), fov: 46 },
  clock: { pos: hw([-4.6, 1.8, -2.0]), look: hw(HALL.CLOCK_FACE), fov: 38 },
  low: { pos: hw(HALL.CAM.p06.pos), look: hw(HALL.CAM.p06.look), fov: HALL.CAM.p06.fov },
  gate: cam([0, 1.0, 8.0], 7.5, 46),
  dash: inCar2([-0.45, 1.02, -0.12], DASH, 28),
  car: inCar2([-0.62, 1.3, 0.75], [0.22, 1.12, -0.3], 72),
  wide: { pos: cw(COAST.CAM.c08wide.pos.map((v, i) => (i === 1 ? 2.4 : v))), look: cw(COAST.CAM.c08wide.look), fov: COAST.CAM.c08wide.fov },
  climb: { pos: cw([4.5, 0.85, 2.2]), look: cw(COAST.CAM.c08climb.look), fov: COAST.CAM.c08climb.fov },
  closeup: CLOSE9,
  sunset: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov },
  face: { pos: cw([0.55, 0.62, -3.4]), look: cw([0.32, 0.55, 0]), fov: 40 },   // DESIGN 11.6 close: the flat sack, the last notes, his face
  hold: { pos: cw(COAST.CAM.c09.pos), look: cw(COAST.CAM.c09.look), fov: COAST.CAM.c09.fov, to: { pos: cw(COAST.CAM.c09push.pos), look: cw(COAST.CAM.c09push.look), fov: COAST.CAM.c09push.fov }, dur: r3(END - T.hold), ease: "linear" },
};
const CUTS = [
  ["S1 rich and sad in the rain", 0, SH.open, "hook"],
  ["S2 no money for a coffee", T.city, SH.city],
  ["S2 the rich", T.watch, SH.cityb],
  ["S3 the hold-up", T.bank, SH.bank, "escalation"],
  ["S3 over the gun", T.gun, SH.overgun],
  ["S3b the escape", T.street, SH.street],
  ["S3b the corner", T.duck, SH.hide],
  ["S4 he bought everything", T.rich, SH.mday],
  ["S5 the siren", T.turn, SH.turn],
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
  ["S9 nobody was coming", T.close, SH.closeup],
  ["S10 the clouds break", T.sunset, SH.sunset],
  ["S10 the money flies", T.storm, SH.sunset],
  ["S10 the smile", T.face, SH.face, "payoff"],
  ["S10 the hold", T.hold, SH.hold, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [   // [at, line, length of the farm's take (s), caption pos]; each line ends 0.5 s before the next voice
  [0.1, "You have ten million dollars.", 2.69],
  [3.34, "And you haven't smiled in thirty days.", 2.4],
  [r3(T.city + 0.15), "Thirty days earlier, he couldn't even pay for a coffee.", 3.91],
  [r3(T.watch + 0.7), "Then he saw how the rich live.", 2.27],
  [r3(T.plan + 0.1), "So he made a plan.", 1.27],
  [r3(T.bank + 2.5), "He robbed a bank.", 1.25, 300],   // above her raised hands in the over-gun shot
  [r3(T.street + 0.9), "And he got away with it.", 1.53],
  [r3(T.rich + 0.1), "He bought everything he thought made him happy.", 2.89],
  [r3(T.turn + 0.9), "But now, he had something to lose.", 2.29, 330],
  [r3(T.door + 3.0), "Even his best friend had to stay outside.", 2.81],
  [r3(T.clock + 0.3), "He had everything... and no one.", 2.89],
  [r3(T.gate + 0.2), "Then one night, a siren stopped at his gate.", 3.21],
  [r3(T.car + 0.4), "He ran, until the tank ran dry.", 3.11],
  [r3(T.car + 5.0), "It was only an ambulance.", 2.27],
  [r3(T.car + 7.8), "Nobody was ever coming for him.", 1.87, 262],   // over his head in the close
  [r3(T.storm + 0.9), "The wind took every dollar he had.", 2.55],
  [T.forgot, "But the beauty of the sunset made him forget all his worries.", 4.11],
];
for (const [t, line, dur, pos = SUBY] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos, gain: NG });
const PUSH = new Map([[SH.city, 0.1], [SH.cityb, 0.08], [SH.bank, 0.14], [SH.overgun, 0.08], [SH.street, 0.08], [SH.hide, 0.1], [SH.mday, 0.12], [SH.turn, 0.12], [SH.door, 0.1], [SH.sidewin, 0.08], [SH.clock, 0.15], [SH.low, 0.18], [SH.gate, 0.12], [SH.climb, 0.12], [SH.closeup, 0.12], [SH.sunset, 0.05], [SH.face, 0.1]]);
CUTS.forEach((cu, i) => {
  const sh = cu[2], k = PUSH.get(sh); if (!k || sh.to) return;
  const dur = r3((i + 1 < CUTS.length ? CUTS[i + 1][1] : END) - cu[1]);
  cu[2] = { ...sh, to: { pos: sh.pos.map((v, j) => r3(v + (sh.look[j] - v) * k)), look: sh.look, fov: sh.fov }, dur, ease: "inOut" };
});
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
      : name === "bank" ? { at, room: room("bankhall", BP, {}) }
      : name === "hall" ? { at, room: room("mansionhall", HP, { locks: [[0, 0], [T.lock1, 1], [r3(T.lock1 + 0.25), 2], [r3(T.lock1 + 0.5), 4], [r3(T.lock1 + 0.75), 7], [T.lock10, 10]], sirenPass: [[T.siren1, r3(T.siren1 + 2.2)]], sirenStay: T.gate, rain: 1, candle: [[0, 0], [T.low, 1]], hatch: [[0, 0.5], [r3(T.hide + 1.6), 0.5], [r3(T.hide + 1.95), 0]] }) }
      : { at, env: ENVS[name] })),
    aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true,
  },
  music: { file: process.env.MUSIC ?? "money-happy/money-happy-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  creative: { length: [END, END] },
  hook: { show: ["rich", "car"], hint: 0, what: "a sad potato in a fur coat and gold chain at the wheel of a gold car in the rain, money bags piled on the back seat" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rich", with: "car", from: T.wide, to: T.climb, checks: ["shell"], reason: "he sits inside the coupe as it rolls to a stop, seen from 30 m on the wide" },
    { who: "rich", with: "car", from: 0, to: T.city, reason: "he sits inside the coupe (the car encloses him)" },
    { who: "rich", with: "car", from: T.car, to: T.climb, reason: "he sits inside the coupe (the car encloses him)" },
    { who: "spud", with: "mask", from: T.bank, to: T.rich, reason: "the balaclava is worn (it covers his head)" },
    { who: "spud", with: "plA", from: T.city, to: T.bank, reason: "the pocket lining hangs out of his sweater's hem" },
    { who: "spud", with: "plB", from: T.city, to: T.bank, reason: "the pocket lining hangs out of his sweater's hem" },
    { who: "rosti", with: "apron", from: T.city, to: T.watch, reason: "the apron is worn" },
    { who: "rosti", with: "phat", from: T.city, to: T.watch, reason: "the paper hat is worn" },
    { who: "spud", with: "gun", from: T.bank, to: T.street, reason: "the revolver in his fist" },
    { who: "spud", with: "sbag", from: T.street, to: T.rich, reason: "he carries the sack in his arms" },
    { who: "rich", with: "gbag", from: T.flee, to: T.car, reason: "he carries the sack in his arms" },
    { who: "rich", with: "cbag2", from: T.climb, to: T.sunset, reason: "he carries the sack in his arms" },
    { who: "rich", with: "cbag2", from: T.climb, to: T.sunset, checks: ["shell"], reason: "the sack hugged against his coat while he climbs" },
  ],
  notes: "Generated by storyboards/series/happiness/01-does-money-make-you-happy/make-money-happy.mjs.",
});
