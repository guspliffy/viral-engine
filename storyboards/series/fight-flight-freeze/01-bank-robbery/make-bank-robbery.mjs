// FIGHT, FLIGHT OR FREEZE, PILOT: "YOU JUST ROBBED A BANK" (Jonny 10 Nov 2026), from the clip template.
//   node storyboards/series/fight-flight-freeze/01-bank-robbery/make-bank-robbery.mjs -> fff-01-bank-robbery.json
//   --blocking: the new props (props-heist*.js) as stand-ins from the library, for the staging proof
// Brief: /mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md (series rules
// + the pilot's beat table). PANELS.md next to this file: the staging, the story chain and every departure.
//
// THE BRIEF
//   Joke:        three friends rob a bank and the police arrive. One fights, one runs, one freezes. The one who did
//                nothing at all is the only one who gets away.
//   Wants:       all three want to get away with the money.
//   Consequence: Viking is netted in four seconds, Phoenix runs in a circle into the police van, Reaper tips over
//                stiff into a crate of potatoes and the officer only straightens the price tag.
//   Ending:      a sunny beach: Reaper on a lounger, still in exactly the same frozen pose. "Which one are you?"
//   Callback:    Reaper's ONE frozen pose from "Freeze." to the beach; the potato crate is in frame 0.
// Series rules: the situation spoken, written and shown in the first 3-5 s (narrator = voice "narrator", first word
// at 0.0, the caption the same words one sentence at a time); the three options each on one face with a label; the
// big question "Only one of them gets away."; three outcomes, each a head fake, each closed by a dry narrator line
// that opens the next; a fake-out before the last payoff; an end card and "Which one are you?".
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";

const BLOCKING = process.argv.includes("--blocking");
const FACES = "strong";
const LINES = { sub: true, blink: false, pos: 560 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const RIG = { hand: 2, eyes: 2, hold: 2 };
const LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;

const c = clip({ faces: FACES, lines: LINES }), { A, sfx, see, prop, cap } = c;
const rad = (d) => (d * Math.PI) / 180;
const fr = (t) => Math.floor((Math.round(t * 30) / 30) * 1000) / 1000;   // a cut time: on the 1/30 grid, rounded down to ms

// ---------------------------------------------------------------- the places: five painted envs, cut to, never panned
// Every env's camera looks down -z (pan +-10 deg, tilt +-8 deg round the painting's own pitch), so each place is
// staged in depth for that one direction: the cast faces us, the threat comes from behind the lens or from the far end.
const ENVS = { alley: "dusk-back-alley", street: "dusk-bus-stop", roof: "sunset-rooftop", corner: "twilight-city-crossing", beach: "turquoise-beach-shallows" };
const PITCH = Object.fromEntries(Object.entries(ENVS).map(([k, n]) => [k, JSON.parse(fs.readFileSync(new URL(`../../../../assets/environments/${n}/env.json`, import.meta.url))).eye.pitch]));
const shot = (env, pos, { pan = 0, tilt = 0, fov = 44 } = {}) => {
  const yaw = rad(pan), pit = rad(-PITCH[env] + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};

// ---------------------------------------------------------------- the narrator (voice "narrator", Jonny's commentator pick)
// [line, spoken seconds (measured, out/speech), take]. Every line is one of the series' loops: cut picture, never one.
const NG = 4.0;   // the narrator's gain (what if 03's measured level for this voice: -12.5 to -14 LUFS a line)
const N = {
  robbed: ["You just robbed a bank.", 1.5], hiding: ["You're hiding.", 0.95], police: ["The police are here.", 1.3],
  fight: ["Fight.", 0.55], flight: ["Flight.", 0.6], freeze: ["Or freeze.", 0.8], one: ["Only one of them gets away.", 1.75],
  fightOut: ["Fight lasted four seconds.", 1.6], oneDown: ["One down.", 0.8], flightOut: ["Flight was fast. In a circle.", 2.3], twoDown: ["Two down.", 0.8],
  nothing: ["Which leaves the one who did nothing.", 2.2], which: ["Which one are you?", 1.2],
};
const CAP_Y = 520;   // narrator captions: in the sky band over the heads, under Jonny's in-app title
const nar = (t, key, { sub = true, until = null, pos = CAP_Y } = {}) => {
  const [line, len] = N[key];
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false, gain: NG });
  if (sub) cap(t, until ?? r3(t + len + 0.35), line, pos);
  return r3(t + len);
};

// ---------------------------------------------------------------- the clock (story seconds; every cut on the frame grid)
// the narrator's 13 lines take 16.4 s of the clip: each beat is as long as its line, so END is 33.1 (the brief's 30.0
// was written on guessed line lengths; "cut picture, never a narrator line")
const T = {
  hook: 0, snap1: fr(1.6), police: fr(2.85), faces: fr(3.65), fight: fr(4.3), flight: fr(4.9), freeze: fr(5.5), question: fr(6.35),
  roar: fr(8.15), charge: fr(8.75), grin: fr(10.05), net: fr(11.3),
  bolt: fr(12.95), roof: fr(13.8), leap: fr(14.9), lost: fr(16.4), van: fr(17.7),
  alone: fr(20.45), crate: fr(23.8), lean: fr(25.8), radio: fr(27.55),
  beach: fr(29.3), which: fr(31.4), end: 32.8,
};
const END = T.end;
const NET = r3(T.net + 0.34);   // the net lands on Viking
const HIT = r3(T.charge + 0.75);   // Viking goes through the shield line
// which env is up from when (set.swap); the alley is the first env: its light is the clip's light
const PLACES = [[0, "alley"], [T.police, "street"], [T.faces, "alley"], [T.charge, "street"], [T.bolt, "alley"], [T.roof, "roof"], [T.lost, "street"], [T.alone, "alley"], [T.beach, "beach"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];

// ---------------------------------------------------------------- cast
const PARK = { vik: [40, 40], phx: [43, 40], rea: [46, 40], sam: [40, 44], god: [43, 44], dra: [46, 44] };
// the alley: the three stand behind a row of market crates (0.34 m: belt high; crouched, only their eyes show over
// it), the potato bin at Reaper's left hand (screen right)
// AX: the whole alley staging sits 1.15 m left of the painting's middle, so the freeze shots (bin + officer, to the
// right) stay inside the painted floor (it ends about 2.8 m right of the middle at these cameras)
const AX = -1.15, VIK_A = [AX, -1.15], PHX_A = [r3(AX - 0.92), -0.4], REA_A = [r3(AX + 0.88), -0.4], PHX_YAW = 16, REA_YAW = -16;
const PHX_H = [r3(AX - 0.66), -0.4], REA_H = [r3(AX + 0.9), -0.4];   // huddled, from the duck on
const cast = [
  { id: "vik", character: "duo/viking", at: VIK_A, face: 12, expr: "delighted", follow: 0.3, seed: 3.3 },
  { id: "phx", character: "duo/phoenix", at: PHX_A, face: PHX_YAW, expr: "delighted", follow: 0.3, seed: 1.7 },
  { id: "rea", character: "never-has-money/reaper", at: REA_A, face: REA_YAW, expr: "happy", follow: 0.25, seed: 3.1 },
  { id: "sam", character: "duo/samurai", at: PARK.sam, face: 0, expr: "stern", follow: 0.3, seed: 2.2 },
  { id: "god", character: "potatobrawl/allfather", at: PARK.god, face: 0, expr: "stern", follow: 0.3, seed: 4.4 },
  { id: "dra", character: "potatobrawl/dragon", at: PARK.dra, face: 0, expr: "stern", follow: 0.3, seed: 4.1 },
];
// a cut cheat: who stands where from t on (an instant move two hundredths before the cut frame), or off the set
const place = (t, who, at, yaw, y = 0) => {
  const u = Math.max(0, r3(t - 0.02));
  A(u, who, "move", { to: at, y, dur: 0.01, steps: 0, ease: "linear" });
  if (yaw != null) A(u, who, "turn", { to: yaw, dur: 0.01 });
  A(u, who, "show");
};
const park = (t, who) => { const u = Math.max(0, r3(t - 0.02)); A(u, who, "hide"); A(u, who, "move", { to: PARK[who], y: 0, dur: 0.01, steps: 0, ease: "linear" }); };
const look = (t, who, to, dur = 0.15) => A(t, who, "look", { to, dur, blink: false });
const expr = (t, who, e, set, dur = 0.15) => A(t, who, "expr", { expr: e, ...(set && { set }), dur });

// ---------------------------------------------------------------- props, each in its place (shown only while its env is up)
// --blocking: the kinds the builders are still making (props-heist.js, props-heistset.js) as library stand-ins or left out
const STAND_IN = { producecrate: (p) => (p.id === "shield" ? { ...p, kind: "parcel" } : { ...p, kind: "cardbox", closed: true }), spudbin: (p) => ({ ...p, kind: "cardbox", empty: true }), roofblock: (p) => ({ ...p, kind: "cardbox", closed: true }),
  policevan: (p) => ({ ...p, kind: "citycar", rot: 180, color: "#1c2440" }), policecar: (p) => ({ ...p, kind: "citycar", color: "#1c2440" }) };
const NEW = [];   // T2's kinds (T1's are in)
const props = [];
const P = (where, spec, { from = 0, to = 99, stay = false } = {}) => {   // from/to: only inside these seconds (and only while its place is up)
  if (BLOCKING && NEW.includes(spec.kind)) { if (!STAND_IN[spec.kind]) return spec; spec = STAND_IN[spec.kind](spec); }
  props.push({ ...spec, _place: where, _from: from, _to: to, _stay: stay }); return spec;
};
const has = (id) => props.some((p) => p.id === id);
const pr = (t, id, set, dur = 0.3, ease = "inOut") => { if (has(id)) prop(t, id, set, dur, ease); };

// ---- alley
const ROW_Z = 0.45, ROW_H = 0.34;
P("alley", { id: "crateL", kind: "producecrate", x: r3(AX - 0.95), z: ROW_Z, w: 0.9, d: 0.5, h: ROW_H, fill: "carrots" });
P("alley", { id: "crateM", kind: "producecrate", x: AX, z: ROW_Z, w: 0.9, d: 0.5, h: ROW_H });
// Jonny, 10 Nov: the tip into the bin read as a glitch and it was not clear why Reaper is not arrested. Now the bin of
// potatoes with its price tag is the third "crate" of the row, right in front of him: he is a potato behind a
// "POTATOES 2.99" sign, and the officer says so.
const TAG_X = 0;
const BIN = { x: r3(AX + 0.98), z: ROW_Z, w: 1.0, d: 0.55, h: 0.28 };
P("alley", { id: "bin", kind: "spudbin", x: BIN.x, z: BIN.z, w: BIN.w, d: BIN.d, h: BIN.h, tagX: TAG_X, crook: -18, look: 0, seed: 7 });
// the loot: two open bags on the ground in front of the row, Reaper's in his arms (the frozen pose's bag, to the beach)
P("alley", { id: "bagL", kind: "moneybag", x: r3(AX - 0.72), z: 1.02, rot: 14, open: true }, { to: T.alone });
P("alley", { id: "bagM", kind: "moneybag", x: r3(AX + 0.38), z: 1.06, rot: -10, open: true }, { to: T.alone });
const front = ([x, z], yaw, f, s, y) => { const a = rad(yaw); return [r3(x + f * Math.sin(a) + s * Math.cos(a)), r3(y), r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const BAG_AT = front(REA_A, REA_YAW, 0.4, 0, 0.2);
// (a held prop stays in the world when its holder is parked: it is carried wherever Reaper goes, by hand, below)
// The box hold puts the R glove on the prop's +x: the prop's front goes toward its holder (rot = yaw + 180), or the
// arms cross. So the sack's "$" is on its back (spec.back), toward us.
const BAG = P("alley+beach", { id: "bagR", kind: "moneybag", x: BAG_AT[0], y: BAG_AT[1], z: BAG_AT[2], rot: REA_YAW + 180, back: true });
// Viking's shield: a small crate on the ground in front of him, behind the row
const SHIELD = P("alley+street", { id: "shield", kind: "producecrate", x: AX, z: -0.7, w: 0.5, d: 0.36, h: 0.3, scale: 0.85, rot: 180 }, { to: T.bolt });
// police light on the alley: a wash on each wall and one on the three, the torch's pool and the officer's shadow
P("alley", { id: "washL", kind: "sirenwash", x: -2.6, y: 0.4, z: -2.5, rot: 55, w: 5, h: 4, on: 0 });
P("alley", { id: "washR", kind: "sirenwash", x: 2.6, y: 0.4, z: -2.5, rot: -55, w: 5, h: 4, on: 0 });
P("alley", { id: "washG", kind: "sirenwash", x: AX, z: 1.2, w: 5, h: 3.5, flat: true, on: 0 });
P("alley", { id: "pool", kind: "lightpool", x: r3(AX - 2.6), y: 0.2, z: r3(ROW_Z + 0.27), w: 1.1, d: 0.6, face: "z", on: 0 });   // on the crate fronts
P("alley", { id: "shadow", kind: "copshadow", x: r3(AX - 0.4), z: 3.6, len: 2.6, w: 1.1, on: 0 });
// the officer's torch: worn at his right glove, along his forward (the cutaway to the police, 2.85-3.65)
const TORCH = { x: -0.53, y: 0.5, z: 0.15 };   // beside the glove, not in the palm (no check window)
P("alley", { id: "torch2", kind: "policetorch", wear: "sam", x: -0.44, y: 0.5, z: 0.15, len: 1.2, r: 0.25, on: 1 }, { from: T.lean, to: T.beach });
// the masks and the caps (fit tables: props-heist.js header)
const CAP = { sam: 1.09, god: 1.26, dra: 1.06 };
for (const who of ["vik", "phx", "rea"]) P("all", { id: `mask-${who}`, kind: "eyemask", wear: who, x: 0, y: 0, z: 0, fit: who });
for (const who of ["sam", "god", "dra"]) P("all", { id: `cap-${who}`, kind: "policecap", wear: who, x: 0, y: CAP[who], z: 0.02, r: 0.2 });

// ---- street (the market street: the shield line, then the wall of cars; later the van)
const LINE_Z = -1.7, GOD_S = [-0.66, LINE_Z], DRA_S = [0.66, LINE_Z];
for (const who of ["god", "dra"]) P("street", { id: `shield-${who}`, kind: "riotshield", wear: who, x: 0, y: 0.27, z: 0.56 }, { to: T.bolt });
const WALL_Z = -6.2;
P("street", { id: "car1", kind: "policecar", x: -7.5, z: WALL_Z - 0.6, rot: 62, lights: 0 }, { to: T.bolt });
P("street", { id: "car2", kind: "policecar", x: 7.5, z: WALL_Z - 0.6, rot: -62, lights: 0 }, { to: T.bolt });
P("street", { id: "car3", kind: "policecar", x: 0, z: WALL_Z - 9, rot: 0, lights: 0 }, { to: T.bolt });
[-1.5, -0.75, 0.75, 1.5].forEach((x, i) => P("street", { id: `wall${i}`, kind: "riotshield", x, y: -1.2, z: WALL_Z + 1.4 }, { to: T.bolt }));
P("street", { id: "washS", kind: "sirenwash", x: 0, y: 0.2, z: WALL_Z + 2.2, w: 7, h: 4.5, on: 0 }, { to: T.bolt });
P("street", { id: "netfly", kind: "policenet", x: 0, y: 0.9, z: WALL_Z + 1.2, r: 0.75, open: 0, wrap: 0 }, { from: T.net, to: NET + 0.02 });
P("street", { id: "netwrap", kind: "policenet", wear: "vik", x: 0, y: 1.12, z: 0, r: 0.75, open: 1, wrap: 1 }, { from: NET + 0.02, to: T.alone });
// the gunfire (Jonny, 10 Nov: "more extreme with shooting and action"): the lead officer fires from behind the line,
// every shot rings off Viking's crate, and the third bounces back into their own patrol car
const LINE_Z0 = -1.7, MUZZLE = [-0.05, 0.5, LINE_Z0 - 0.85], WRECK = { x: 2.7, z: -3.6 };   // the car is about 2 x 4.4 m: straight, clear of Dragon's wing and of the van
const SHOTS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.58].map((d) => r3(T.charge + d)), FLY = 0.09;
const crateZ = (t) => 4.17 + (LINE_Z0 + 1.07 - 4.17) * Math.min(1, (t - T.charge) / (HIT - T.charge - 0.1));
const HITS = SHOTS.map((t, i) => [r3(((i * 37) % 5 - 2) * 0.07), 1.12, r3(crateZ(t + FLY) - 0.2)]);   // where each shot meets the crate
const BOUNCE = [[-3.6, 4.6, -3], [3.3, 5.2, -4], [r3(WRECK.x - 0.6), 0.7, r3(WRECK.z + 1.8)], [-2.8, 5.5, -2], [3.8, 3.6, -5], [-4.2, 3.8, -4]];
const BOOM = r3(SHOTS[2] + FLY + 0.12);
const sub3 = (a, b) => [r3(a[0] - b[0]), r3(a[1] - b[1]), r3(a[2] - b[2])];
SHOTS.forEach((t, i) => {
  P("street", { id: `shot${i}`, kind: "spellbolt", x: MUZZLE[0], y: MUZZLE[1], z: MUZZLE[2], from: [0, 0, 0], to: sub3(HITS[i], MUZZLE).map((v) => r3(v / 3)), scale: 3, rise: 0, staged: "a bullet in flight" }, { from: T.charge, to: T.grin });
  P("street", { id: `rico${i}`, kind: "spellbolt", x: HITS[i][0], y: HITS[i][1], z: HITS[i][2], from: [0, 0, 0], to: sub3(BOUNCE[i], HITS[i]).map((v) => r3(v / 3)), scale: 3, rise: 0, staged: "a ricochet in flight" }, { from: T.charge, to: T.grin });
});
P("street", { id: "muzzle", kind: "lightpool", x: MUZZLE[0], y: MUZZLE[1], z: MUZZLE[2] + 0.1, w: 1.5, d: 1.5, face: "z", on: 0 }, { from: T.charge, to: T.grin });
P("street", { id: "spark", kind: "lightpool", x: 0, y: 1.12, z: 3.9, w: 1.1, d: 1.1, face: "z", on: 0 }, { from: T.charge, to: T.grin });
P("street", { id: "carX", kind: "policecar", x: WRECK.x, z: WRECK.z, rot: 0, lights: 1 }, { from: T.charge, to: T.bolt });
P("street", { id: "boom", kind: "carburst", x: r3(WRECK.x - 0.5), y: 0.6, z: r3(WRECK.z + 1.6), at: BOOM, r: 1.5, on: 1 }, { from: T.charge, to: T.bolt });
P("street", { id: "fire", kind: "firesmoke", x: r3(WRECK.x - 0.7), y: 0.7, z: r3(WRECK.z + 1.6), w: 2.6, h: 4.6, fire: 0 }, { from: T.charge, to: T.bolt });
// the same wreck, still burning, when Phoenix lands back here
P("street", { id: "carY", kind: "policecar", x: WRECK.x, z: WRECK.z, rot: 0, lights: 0 }, { from: T.van });
P("street", { id: "fireY", kind: "firesmoke", x: r3(WRECK.x - 0.7), y: 0.7, z: r3(WRECK.z + 1.6), w: 2.6, h: 4.6, fire: 0 }, { from: T.van });
const VAN = { x: 0, z: -2.4 };
P("street", { id: "van", kind: "policevan", x: VAN.x, z: VAN.z, open: 1, lights: 0 }, { from: T.van });

// ---- roof: the chase's roof is the painting's own terrace; the leap is between two blocks, low angle
const ROOF_H = 1.0, RL = { x: -2.35, z: 0.3 }, RR = { x: 2.35, z: 0.3 };
P("roof", { id: "roofL", kind: "roofblock", x: RL.x, z: RL.z, w: 2.9, d: 2.0, h: ROOF_H, extras: ["chimney"], seed: 3 }, { from: T.leap, to: T.lost });
P("roof", { id: "roofR", kind: "roofblock", x: RR.x, z: RR.z, w: 2.9, d: 2.0, h: ROOF_H, extras: ["tank", "antenna"], seed: 8 }, { from: T.leap, to: T.lost });
P("roof", { id: "spot", kind: "lightpool", x: 0, y: 0.01, z: -6, w: 2.2, d: 1.5, on: 0 });
P("roof", { id: "beam", kind: "lightbeam", x: 0.6, y: 9, z: -6, tip: 0, len: 9.2, w: 1.6, color: "#ffffff", glow: 0 });

// ---- beach: a sandbank in the shallows, the lounger on it
P("beach", { id: "sand", kind: "sandpit", x: 0, y: -0.13, z: 0.5, w: 3.4, d: 2.4, h: 0.1, color: "#f0dfb0" });
P("beach", { id: "lounger", kind: "deckchair", x: 0, z: 0.5, rot: 0, color: "#f4f0e6", stripe: "#e2483a", scale: 1.3 }, { stay: true });
P("beach", { id: "gulls", kind: "gulls", x: 0, y: 0, z: 0, n: 3, at: [1.5, 7, -14], r: 6, staged: "gulls circling in the sky" });
P("beach", { id: "gull", kind: "pigeon", wear: "rea", x: 0.05, y: 1.24, z: 0.02, happy: 1 });

// show each prop only while its place is up ("all": always; "a+b": in both) and inside its own from-to
for (const p of props) {
  const mine = (name) => p._place === "all" || p._place.split("+").includes(name);
  const on = (t) => mine(placeAt(t)) && t >= p._from - 1e-6 && t < p._to - 1e-6;
  // hidden = scale 0.001 AND 30 m under the floor (the contact checks read a prop's box whatever its scale); a worn
  // prop stays with its wearer, who is parked off the set
  const full = p.scale ?? 1, y0 = p.y ?? 0, away = (now) => ({ scale: now ? full : 0.001, ...(!p.wear && !p._stay && { y: now ? y0 : -30 }) });
  let was = on(0);
  if (!was) Object.assign(p, away(false));
  const times = [...new Set([...PLACES.slice(1).map(([at]) => at), p._from, p._to])].filter((t) => t > 0 && t < END).sort((x, y) => x - y);
  for (const t of times) { const now = on(t); if (now !== was) c.at(r3(t - 0.02), { do: "prop", id: p.id, set: away(now), dur: 0.01, ease: "linear", reason: "off the set between scenes: hidden and parked under the floor on the cut" }); was = now; }
}

// ================================================================ 1 THE SITUATION 0-7.7 (spoken, written, shown)
// ---- frame 0: the alley, masks, open money bags, a high-five in the air, the alarm ringing
park(0, "sam"); park(0, "god"); park(0, "dra");
sfx(0, "alarmbell", { dur: 1.7, gain: 0.5, reason: "the bank's alarm ringing a street away" });
sfx(0, "slap", { gain: 0.8, reason: "the high-five" });
nar(0, "robbed", { until: T.snap1 });
// Viking (back centre) and Phoenix (front left): hands meet between them at frame 0, bounce off, a cheer
// (an o pose: out from the body's SIDE, up 0.15 under the glove's height, fwd from the middle)
const HI = { vik: { o: [0.03, 0.85, 0.375] }, phx: { o: [0.13, 0.85, -0.23] } };   // both reach (AX - 0.46, 1.0, -0.775): halfway between the two bodies
A(0, "vik", "turn", { to: 12, dur: 0 });
c.arm(0, "vik", "R", HI.vik, 0); c.arm(0, "vik", "L", "fist", 0);
c.arm(0, "phx", "L", HI.phx, 0); c.arm(0, "phx", "R", { o: [0.15, 0.85, 0.1] }, 0);
look(0, "vik", [-0.5, 0.1], 0); look(0, "phx", [0.5, 0.2], 0);
c.arm(0.12, "vik", "R", { o: [0.03, 0.6, 0.3] }, 0.2, "out"); c.arm(0.34, "vik", "R", "rest", 0.3, "settle"); c.arm(0.12, "phx", "L", { o: [0.08, 0.92, 0.1] }, 0.25, "out");
A(0.1, "phx", "hop", { height: 0.12, dur: 0.3 }); A(0.5, "phx", "hop", { height: 0.1, dur: 0.28 });
A(0.15, "vik", "squash", { amount: -0.05, dur: 0.3 });
c.arm(0.7, "vik", "L", { o: [0.04, 0.95, 0.15] }, 0.3, "settle");   // a fist in the air: the big one celebrates
// Reaper (front right): the scared one already hugs his bag; a nervous little bounce
const bag = grips.box(c, "rea", BAG, { height: 0.5 });
bag.secure(0, 0);
look(0, "rea", [-0.45, 0.1], 0);
A(0.3, "rea", "hop", { height: 0.06, dur: 0.26 });
see(0, 1.5, ["vik.face", "phx.face", "rea.face", "bagL", "bagM"], "frame 0: three masked friends, the loot open at their feet, mid high-five");

// ---- snap 1 (1.6): blue-red light, a siren whoop, tyres. The high-five dies; they duck behind the crates
sfx(T.snap1, "siren", { gain: 0.75, reason: "a police car's whoop at the alley's mouth, behind the lens" });
sfx(T.snap1 + 0.25, "screech", { gain: 0.6, reason: "tyres stopping at the alley's mouth" });
sfx(T.snap1 + 0.5, "sirenwail", { dur: 6, gain: 0.5, reason: "more sirens closing in, far off, under the voice" });
for (const id of ["washL", "washR", "washG"]) { pr(T.snap1, id, { on: 1 }, 0.12, "out"); }
for (const [who, to] of [["vik", [0.1, 0.25]], ["phx", [0.2, 0.25]], ["rea", [-0.1, 0.25]]]) look(T.snap1 + 0.04, who, to, 0.1);
act.shock(c, T.snap1 + 0.05, "vik", { hold: 0.3 }); act.shock(c, T.snap1 + 0.08, "phx", { hold: 0.3 });
expr(T.snap1 + 0.1, "rea", "terrified");
c.arm(T.snap1 + 0.1, "vik", "L", { o: [0.02, 0.5, 0.2] }, 0.2, "out"); c.arm(T.snap1 + 0.35, "vik", "L", "rest", 0.3, "settle"); c.arm(T.snap1 + 0.12, "phx", "both", { o: [-0.05, 0.3, 0.3] }, 0.3, "settle");   // gloves clutched in front of him (and clear of the small crate behind the row)
A(T.snap1 + 0.15, "vik", "turn", { to: 0, dur: 0.25 });
nar(T.snap1 + 0.2, "hiding", { until: T.police });
// crouch alone drops a potato ~0.12 m: the duck also sinks them DUCK behind the row (the crates hide the floor there)
// ...and they huddle: Phoenix and Reaper shuffle in, so three faces fit one close shot from here on (PHX_H, REA_H)
const DUCK = -0.18, HOME = { vik: VIK_A, phx: PHX_H, rea: REA_H };
const duck = (t, who, down, dur = 0.22) => { A(t, who, "crouch", { to: down ? 1 : 0, dur }); A(t, who, "move", { to: HOME[who], y: down ? DUCK : 0, dur, steps: 0, ease: "out" }); };
for (const [who, dt] of [["phx", 0.42], ["vik", 0.5], ["rea", 0.58]]) duck(T.snap1 + dt, who, true);
const BAG_H = front(REA_H, REA_YAW, 0.33, 0, 0.2);
bag.carry(T.snap1 + 0.58, [BAG_H[0], r3(BAG_H[1] + DUCK), BAG_H[2]], 0.22, "out");
sfx(T.snap1 + 0.55, "pat", { gain: 0.4, reason: "three bodies dropping behind the crates" });
see(T.snap1 + 0.8, T.police, ["vik.face", "phx.face", "rea.face"], "hiding: three pairs of eyes over the crate row, police light on the walls");

// ---- the police are here (2.85): a 0.8 s cutaway to the street end of the alley, the police front on
// (review A: a beam and a shadow from behind the lens did not read; the police have to be ON screen by 3 s. The street
// camera sits at z -1.8 looking down -z, so the trio in the alley's coordinates is behind the lens.)
nar(T.police + 0.05, "police", { until: T.fight });
place(T.police, "sam", [0, -5.95], 0); place(T.police, "god", [-0.9, -6.5], 0); place(T.police, "dra", [0.9, -6.5], 0);
A(T.police, "sam", "move", { to: [0, -5.5], dur: 0.4, ease: "out" });
expr(T.police, "sam", "stern", { browY: -0.012 }); look(T.police, "sam", [0, 0], 0);
for (const who of ["god", "dra"]) { look(T.police, who, [0, 0], 0); A(T.police + 0.1, who, "move", { to: [who === "god" ? -0.9 : 0.9, -6.3], dur: 0.35, ease: "out" }); }
pr(T.police - 0.02, "car3", { z: -13.5, lights: 1 }, 0.01, "linear"); pr(T.police, "car3", { z: -9.4 }, 0.4, "out");
pr(T.faces - 0.02, "car3", { z: WALL_Z - 9, lights: 0 }, 0.01, "linear");
see(T.police, T.faces, ["sam.face", "cap-sam", "car3"], "the police, front on: caps, riot shields, a torch, a patrol car's light bar");
park(T.faces, "sam"); park(T.faces, "god"); park(T.faces, "dra");
// back in the alley their torch finds the crate row
pr(T.police, "shadow", { on: 1 }, 0.25);
pr(T.police + 0.1, "pool", { on: 1 }, 0.2); pr(T.police + 0.1, "pool", { x: r3(AX - 1.7) }, 0.6, "inOut");
sfx(T.police, "step", { gain: 0.5, reason: "the officer's boot on the cobbles" }); sfx(T.police + 0.4, "step", { gain: 0.55, reason: "another step, closer" });
for (const who of ["vik", "phx", "rea"]) look(T.police + 0.15, who, [-0.55, -0.1], 0.12);
// 3.7 the three faces, close: eyes wide; they look at each other: what now?
look(T.faces + 0.15, "phx", [0.7, 0.05]); look(T.faces + 0.2, "rea", [-0.7, 0.05]); look(T.faces + 0.35, "vik", [-0.6, 0]); look(T.faces + 0.55, "vik", [0.6, 0]);
see(T.faces, T.fight, ["vik.face", "phx.face", "rea.face"], "the close row of three faces, eyes wide");

// ---- the three options (4.5-6.65): one word, one face, one label
const LABEL = { size: 150, dur: 0.6, angle: -5, dy: -1.25, dx: 0 };
// FIGHT: Viking comes up out of the crouch, scowling, and cracks his knuckles
nar(T.fight, "fight", { sub: false });
c.textPop(T.fight + 0.02, "vik", "FIGHT", { ...LABEL, color: "#ff5a3c" });
duck(T.fight - 0.1, "vik", false, 0.15);
act.mood(c, T.fight - 0.08, "vik", "angry", { hold: 2.6 });
look(T.fight - 0.05, "vik", [0, 0.05], 0.1);
c.arm(T.fight - 0.08, "vik", "both", { o: [-0.33, 0.2, 0.46] }, 0.2, "out");   // fist in fist in front of his belt
c.arm(T.flight + 0.1, "vik", "both", "rest", 0.3, "settle");
A(T.fight, "vik", "grip", { side: "R", shape: "fist", dur: 0.1 }); A(T.fight, "vik", "grip", { side: "L", shape: "fist", dur: 0.1 });
for (const dt of [0.18, 0.4]) { A(T.fight + dt, "vik", "squash", { amount: 0.03, dur: 0.14 }); sfx(T.fight + dt, "crumble", { gain: 0.5, reason: "knuckles cracking" }); }
see(T.fight, T.flight, ["vik.face"], "FIGHT: Viking cracks his knuckles");
// FLIGHT: Phoenix is up, wings half out, feet already running on the spot, eyes hunting for a way out
nar(T.flight, "flight", { sub: false });
c.textPop(T.flight + 0.02, "phx", "FLIGHT", { ...LABEL, color: "#ffb02e" });
duck(T.flight - 0.1, "phx", false, 0.15); c.arm(T.flight - 0.1, "phx", "both", "rest", 0.2, "out");
A(T.flight - 0.05, "phx", "wings", { to: 0.35, dur: 0.2 });
expr(T.flight - 0.05, "phx", "terrified", { open: 0.3 });
A(T.flight, "phx", "tap", { count: 9, every: 0.14, side: "R" }); A(T.flight + 0.07, "phx", "tap", { count: 9, every: 0.14, side: "L" });
for (const [dt, to] of [[0.05, [-0.8, 0.2]], [0.25, [0.8, 0.3]], [0.45, [0, 0.6]]]) look(T.flight + dt, "phx", to, 0.08);
see(T.flight, T.freeze, ["phx.face"], "FLIGHT: Phoenix's legs are already going");
// FREEZE: Reaper goes stiff as a board, up out of the crouch like a plank. THE pose: it never changes again
nar(T.freeze, "freeze", { sub: false });
c.textPop(T.freeze + 0.25, "rea", "FREEZE", { ...LABEL, color: "#8fd8ff" });
duck(T.freeze - 0.08, "rea", false, 0.1);
const BAG_0 = front(REA_H, 0, 0.36, 0, 0.04);   // low, behind the bin   // the bag in front of him once he faces us: where it stays to the tip-over
bag.carry(T.freeze - 0.08, BAG_0, 0.12, "out", { rot: 180 });
A(T.freeze - 0.02, "rea", "turn", { to: 0, dur: 0.1 });
A(T.freeze, "rea", "expr", { expr: "shocked", set: { open: 0.02, eye: 1.5, curve: -0.02 }, dur: 0.08 });
A(T.freeze, "rea", "face", { brow: 0.55, dur: 0.08 });
look(T.freeze, "rea", [0, 0.02], 0.06);
A(T.freeze + 0.05, "rea", "squash", { amount: -0.06, dur: 0.2 });
sfx(T.freeze + 0.05, "tink", { gain: 0.6, reason: "Reaper freezing solid" });
A(T.freeze + 0.1, "rea", "still", { dur: r3(END - T.freeze + 1), idle: 0 });
A(0, "rea", "noblink");
see(T.freeze, T.question, ["rea.face", "bagR"], "FREEZE: Reaper stiff as a board, the bag in his arms");

// ---- the big question (6.65): the torch's pool one step from them
nar(T.question + 0.05, "one", { until: T.roar });
A(T.question - 0.02, "phx", "wings", { to: 0.12, dur: 0.01 });
pr(T.question, "pool", { x: r3(AX - 0.75) }, 0.9, "inOut"); pr(T.question, "shadow", { z: 1.75 }, 0.9, "inOut");
sfx(T.question + 0.3, "step", { gain: 0.6, reason: "the officer one step from the crates" });
A(T.question, "phx", "tap", { count: 6, every: 0.16, side: "R" });
see(T.question, T.roar, ["vik.face", "phx.face", "rea.face"], "the big question: the beam one step away, all three in frame");

// ================================================================ 2 FIGHT 7.7-12.4
// ---- the roar: Viking heaves up a crate as a shield and goes over the row at the lens
const sh = grips.box(c, "vik", SHIELD, { height: 0.5 });
c.say(T.roar + 0.03, "vik", "raaagh!", 0.5, "excited", { sub: "RAAAGH!" });
expr(T.roar, "vik", "angry", { open: 0.75 });
sh.secure(T.roar - 0.55, 0.38, [SHIELD.x, 0, SHIELD.z]); sh.carry(T.roar - 0.12, [AX, 1.12, -0.72], 0.32, "out");   // up over his brow, in front of him
A(T.roar + 0.25, "vik", "hop", { height: 0.3, dur: 0.33 });
sfx(T.roar + 0.25, "whoosh", { gain: 0.6, reason: "Viking launching himself at the street" });
see(T.roar, T.charge, ["vik.face"], "Viking roars and charges the lens with a crate for a shield");

// ---- the street: his back to us, the shield line facing us; he goes through them like skittles
place(T.charge, "vik", [0, 4.6], 180); park(T.charge, "phx"); park(T.charge, "rea");
place(T.charge, "god", GOD_S, 0); place(T.charge, "dra", DRA_S, 0);
// the lead officer between the two shields, his glove out: he opens fire
place(T.charge, "sam", [-0.1, LINE_Z - 1.4], 0); expr(T.charge - 0.02, "sam", "angry", { browY: -0.012 }, 0.01);
c.arm(T.charge - 0.02, "sam", "R", { o: [-0.37, 0.3, 0.5] }, 0.01); A(T.charge - 0.02, "sam", "grip", { side: "R", shape: "fist", dur: 0.01 });
SHOTS.forEach((t, i) => {
  sfx(t, "gunshot", { gain: 0.75, reason: "the police open fire on the charging Viking" });
  pr(t, "muzzle", { on: 1 }, 0.02, "linear"); pr(t + 0.05, "muzzle", { on: 0 }, 0.04, "linear");
  pr(t, `shot${i}`, { rise: 1 }, FLY, "linear");
  pr(t + FLY - 0.01, "spark", { x: HITS[i][0], z: r3(HITS[i][2] - 0.05) }, 0.01, "linear");
  pr(t + FLY, "spark", { on: 1 }, 0.03, "linear"); pr(t + FLY + 0.04, "spark", { on: 0 }, 0.05, "linear");
  sfx(t + FLY, "ting", { gain: 0.5, reason: "a bullet ringing off his crate" });
  pr(t + FLY, `rico${i}`, { rise: 1 }, 0.12, "linear");
});
// ...and the third one comes back at their own car
sfx(BOOM, "firework", { gain: 0.85, reason: "the patrol car blowing up behind the line" }); sfx(BOOM, "slam", { gain: 0.9, reason: "the blast" });
pr(T.charge - 0.02, "boom", { on: 1 }, 0.01, "linear");   // (its life is timed from spec.at; `on` is read from the tweens, not the spec)
pr(BOOM, "carX", { lights: 0 }, 0.05, "linear"); pr(BOOM + 0.1, "fire", { fire: 1 }, 0.3, "out");
pr(BOOM + 0.55, "boom", { on: 0 }, 0.35, "inOut");   // the fireball only: its cooling smoke reads as pale blocks in this look; the wreck burns on
look(BOOM + 0.05, "sam", [0.8, 0.1], 0.08);
sh.carry(T.charge - 0.02, [0, 1.12, 4.6 - 0.43], 0.01, "linear", { rot: 0 });
A(T.charge, "vik", "move", { to: [0, LINE_Z + 1.4], dur: r3(HIT - T.charge), ease: "linear", stride: 1.8 });
sh.carry(T.charge, [0, 1.12, LINE_Z + 1.07], r3(HIT - T.charge - 0.1), "linear"); sh.carry(HIT - 0.1, [0, 0.5, LINE_Z + 0.92], 0.1, "in");
for (const who of ["god", "dra"]) { c.arm(T.charge - 0.02, who, who === "god" ? "R" : "L", { o: [0.22, 0.5, 0.36] }, 0.01); look(T.charge, who, [0, 0], 0); act.shock(c, T.charge + 0.3, who, { hold: 0.2 }); }
sfx(HIT, "hit-wood", { gain: 0.9, reason: "the crate hitting the shield line" });
sfx(HIT, "slam", { gain: 0.7, reason: "two riot shields going over" });
// the impact frames (4 white frames after the 3-frame hit-stop) hold the hit pose: bodies that fly inside them read
// as one-frame pops (draft 1). Everything launches at GO, the frame the picture comes back.
const GO = r3(HIT + 2 / 30);
c.at(HIT, { fx: "impact", dur: r3(2 / 30) });
c.hitStop(HIT, 3);
pr(GO, "shield", { smash: 1 }, 0.35, "out");
A(GO, "vik", "release", { prop: "shield", dur: 0 });
c.arm(GO + 0.02, "vik", "both", { o: [0.2, 0.55, 0.25] }, 0.2, "out");
c.drop(GO, "shield");
for (const [who, sx] of [["god", -1], ["dra", 1]]) {
  const zf = sx > 0 ? 0.9 : -1.2;   // Dragon flies off toward the lens side: the burning car is behind him on the right
  A(GO, who, "move", { to: [sx * 2.6, LINE_Z + zf], y: 1.7, dur: 0.46, ease: "linear", steps: 0 });
  A(GO + 0.46, who, "move", { to: [sx * 5.4, LINE_Z + zf * 1.6], y: 0.3, dur: 0.26, ease: "in", steps: 0 });
  A(GO, who, "pitch", { to: sx * 360, dur: 0.74, ease: "linear" });
  expr(GO, who, "dizzy");
  park(GO + 0.74, who);
}
// he skids through, turns to us, fists up: fighting works
A(GO, "vik", "move", { to: [0, LINE_Z + 1.1], dur: 0.25, ease: "out", steps: 2 });
expr(T.grin - 0.02, "vik", "cocky", { curve: 0.6, open: 0.35 }, 0.01);
park(T.grin, "sam"); c.arm(T.grin - 0.02, "sam", "R", "rest", 0.01);
place(T.grin, "vik", [0, LINE_Z + 1.1], 0); c.arm(T.grin - 0.02, "vik", "both", { o: [0.3, 0.8, 0.12] }, 0.01); c.arm(T.grin + 0.02, "vik", "both", { o: [0.3, 1.02, 0.12] }, 0.2, "settle");
look(T.grin - 0.02, "vik", [0, 0.05], 0.01);
c.say(T.grin + 0.05, "vik", "ha!", 0.3, "excited", { sub: "HA!" });
see(T.grin, T.grin + 0.6, ["vik.face"], "the head fake: fighting works, Viking grins at us");
// ---- behind him: three cars and a wall of shields (he doesn't see it; we do)
const WALL = r3(T.grin + 0.45);
[["car1", -2.5, 0], ["car2", 2.5, 0.22], ["car3", 0, 0.44]].forEach(([id, x, dt]) => {
  if (id === "car3") pr(WALL + dt, id, { z: WALL_Z - 1.6 }, 0.3, "out"); else pr(WALL + dt, id, { x }, 0.3, "out");
  pr(WALL + dt + 0.25, id, { lights: 1 }, 0.05);
  sfx(WALL + dt + 0.1, "screech", { gain: 0.6, reason: "a police car sliding in behind Viking" });
});
[0, 1, 2, 3].forEach((i) => pr(WALL + 0.4 + i * 0.05, `wall${i}`, { y: 0 }, 0.18, "back"));
sfx(WALL + 0.5, "slam", { gain: 0.5, reason: "the second line of shields slamming down" });
pr(WALL + 0.3, "washS", { on: 1 }, 0.2);
place(WALL + 0.4, "sam", [0, WALL_Z + 0.9], 0);
// the grin dies from the eyes down: they slide left, right; the fists sink
look(WALL + 0.4, "vik", [-0.85, 0.05], 0.12); look(WALL + 0.68, "vik", [0.85, 0.05], 0.1);
expr(WALL + 0.5, "vik", "cocky", { curve: 0.1, open: 0.05 }, 0.3);
c.arm(WALL + 0.5, "vik", "both", { o: [0.3, 0.7, 0.12] }, 0.35, "inOut");
see(WALL, T.net, ["vik.face", "car1", "car2"], "the snap: the wall of cars and shields behind his grin");
// ---- the net: one small "pfft", wrapped, over like a sack
sfx(T.net, "netshot", { gain: 0.8, reason: "the net launcher behind him" });
pr(T.net, "netfly", { x: 0, y: 1.25, z: LINE_Z + 1.1, open: 1, spin: 200 }, 0.34, "linear");
A(NET, "vik", "squash", { amount: 0.12, dur: 0.25 });
act.shock(c, NET, "vik", { hold: 0.3 });
c.arm(NET, "vik", "both", "rest", 0.15);
sfx(NET, "pat", { gain: 0.7, reason: "the net landing on him" });
A(NET + 0.3, "vik", "lean", { to: -90, dur: 0.42, ease: "in" });
A(NET + 0.3, "vik", "move", { to: [-0.6, LINE_Z + 1.1], y: 0.4, dur: 0.42, ease: "in", steps: 0 });
sfx(NET + 0.72, "thud", { gain: 0.8, reason: "Viking tipping over like a sack" });
act.landDust(c, NET + 0.72, [0, LINE_Z + 1.2]);
expr(NET + 0.75, "vik", "deadpan");
sfx(NET + 1.0, "cuffs", { gain: 0.8, reason: "handcuffs" });
nar(T.net, "fightOut", { until: T.bolt });
see(NET + 0.75, T.bolt, ["vik.face"], "Viking netted, on his side, face to us");

// ================================================================ 3 FLIGHT 12.4-19.5 (the one wow)
// ---- the alley: two left. Phoenix looks at the empty spot, and bolts up and away with a flame trail
place(T.bolt, "phx", PHX_H, PHX_YAW); place(T.bolt, "rea", REA_H, 0); park(T.bolt, "vik"); park(T.bolt, "sam");
nar(T.bolt + 0.05, "oneDown", { until: T.roof });
look(T.bolt - 0.02, "phx", [0.6, -0.1], 0.01);
expr(T.bolt, "phx", "terrified");
A(T.bolt + 0.3, "phx", "turn", { to: 150, dur: 0.18 });
A(T.bolt + 0.38, "phx", "fly", { to: { x: r3(AX - 1.6), y: 4.6, z: -5.5 }, dur: 0.34, ease: "in" });
sfx(T.bolt + 0.38, "rocket", { gain: 0.5, dur: 0.5, reason: "Phoenix taking off, a trail of fire" });
see(T.bolt, T.bolt + 0.35, ["phx.face", "rea.face"], "two left: Phoenix looks at Viking's empty spot; Reaper hasn't moved");

// ---- the rooftops: he sprints at us across the roof, the helicopter's spotlight hunting him
place(T.roof, "phx", [0.3, -9], 0); park(T.roof, "rea");
sfx(T.roof, "chopper", { dur: r3(T.lost - T.roof), gain: 0.6, reason: "the police helicopter over the roofs" });
A(T.roof, "phx", "wings", { to: 0.5, dur: 0.01 });
A(T.roof, "phx", "move", { to: [0, 1.6], dur: r3(T.leap - T.roof), ease: "linear", stride: 1.9 });
expr(T.roof, "phx", "terrified", { open: 0.5 });
look(T.roof + 0.3, "phx", [0.3, 0.8], 0.1); look(T.roof + 0.75, "phx", [0, 0.1], 0.1);
pr(T.roof - 0.02, "spot", { on: 1, x: 1.8, z: -9.5 }, 0.01, "linear"); pr(T.roof - 0.02, "beam", { glow: 0.5, x: 1.8, z: -9.5 }, 0.01, "linear");
pr(T.roof, "spot", { x: 0.1, z: 1.2 }, r3(T.leap - T.roof), "in"); pr(T.roof, "beam", { x: 0.1, z: 1.2 }, r3(T.leap - T.roof), "in");
see(T.roof + 0.5, T.leap, ["phx.face"], "Phoenix sprints at us over the roof, the spotlight closing on him");

// ---- the leap: low angle, the gap between two roofs, wings wide in the beam (the cover, about 15.0)
const TOP = ROOF_H + 0.08, L0 = [-1.7, 0.75], L1 = [-1.25, 0.75], R1 = [1.35, 0.75];
place(T.leap, "phx", L0, 78, TOP);
pr(T.leap - 0.02, "spot", { on: 0 }, 0.01, "linear");
pr(T.leap - 0.02, "beam", { x: -0.9, y: 9.6, z: 0.75, glow: 1 }, 0.01, "linear");
A(T.leap, "phx", "move", { to: L1, y: TOP, dur: 0.15, ease: "linear", stride: 1.9 });
const JUMP = r3(T.leap + 0.15), APEX = r3(JUMP + 0.6), DOWN = r3(T.lost - 0.2);   // a long hang at the top (the wow), cut on the way down
sfx(JUMP, "whoosh", { gain: 0.7, reason: "Phoenix leaving the roof's edge" });
A(JUMP, "phx", "fly", { to: { x: 0.05, y: 1.8, z: 0.75 }, dur: r3(APEX - JUMP), ease: "out" });
A(APEX, "phx", "fly", { to: { x: 0.6, y: 1.7, z: 0.75 }, dur: r3(DOWN - APEX), ease: "linear" });   // he keeps drifting: no dead hang
A(JUMP, "phx", "turn", { to: 35, dur: 0.3 });   // opens to us in the air
expr(JUMP + 0.1, "phx", "delighted", { open: 0.7 });
c.arm(JUMP, "phx", "both", { o: [0.42, 0.95, 0.05] }, 0.25, "out");
A(DOWN, "phx", "land", { to: TOP, dur: 0.34 });
A(DOWN, "phx", "move", { to: R1, y: TOP, dur: 0.34, ease: "linear", steps: 0 });
pr(T.leap, "beam", { x: 0.05 }, r3(JUMP + 0.3 - T.leap), "inOut"); pr(APEX, "beam", { x: 0.6 }, r3(T.lost - APEX), "linear");
see(JUMP + 0.2, DOWN, ["phx.face", "phx"], "THE WOW: Phoenix mid-leap between the roofs, wings wide, in the helicopter's beam");

// ---- "Lost them!": he drops into a street, close on him (Jonny, 10 Nov: "i dont understand why flight got caught":
// it is the SAME street, and the wide shot shows it: the van, the officers, the burning car, Viking already inside)
const LAND = [0, 0.4];
place(T.lost, "phx", LAND, 0, 2.0);
A(T.lost, "phx", "move", { to: LAND, y: 0, dur: 0.3, ease: "linear", steps: 0 });
c.arm(T.lost - 0.02, "phx", "both", { o: [0.3, 0.8, 0.05] }, 0.01); c.arm(T.lost + 0.3, "phx", "both", "rest", 0.3, "settle");
sfx(T.lost + 0.3, "land", { gain: 0.6, reason: "Phoenix dropping into a street" });
act.landDust(c, T.lost + 0.3, LAND);
look(T.lost + 0.32, "phx", [-0.6, 0.7], 0.08); look(T.lost + 0.5, "phx", [0, 0.05], 0.08);
expr(T.lost + 0.45, "phx", "delighted", { curve: 0.75 });
c.say(T.lost + 0.48, "phx", "lost them!", 0.55, "excited", { pos: 480 });
see(T.lost + 0.35, T.van, ["phx.face"], "the head fake: 'Lost them!', grinning at us");

// ---- the wide shot: he has landed right back where it started
pr(T.van - 0.02, "van", { lights: 1 }, 0.01, "linear"); pr(T.van - 0.02, "fireY", { fire: 1 }, 0.01, "linear");
place(T.van, "god", [-1.15, -1.0], 50); place(T.van, "dra", [1.15, -1.0], -50);
for (const who of ["god", "dra"]) { A(T.van - 0.02, who, "pitch", { to: 0, dur: 0.01 }); expr(T.van - 0.02, who, "stern", null, 0.01); look(T.van, who, [who === "god" ? 0.6 : -0.6, 0], 0); }
A(T.van - 0.02, "vik", "lean", { to: 0, dur: 0.01 }); place(T.van, "vik", [-0.5, VAN.z - 1.0], 0, 0.45); expr(T.van - 0.02, "vik", "deadpan", null, 0.01);   // netted, in the van already
sfx(T.van + 0.05, "sirenwail", { dur: 0.5, gain: 0.7, reason: "one whoop of the siren right behind him" });
nar(T.van + 0.1, "flightOut", { until: T.alone });   // "Flight was fast. In a circle."
// the grin dies; his eyes slide to the side; he turns round and sees all of it
expr(T.van + 0.1, "phx", "worried", null, 0.15); look(T.van + 0.12, "phx", [0.85, 0], 0.15);
const SEEN = r3(T.van + 0.45);
A(SEEN, "phx", "turn", { to: 180, dur: 0.3 });
A(SEEN + 0.3, "phx", "wings", { to: 1, dur: 0.1 }); A(SEEN + 0.3, "phx", "hop", { height: 0.12, dur: 0.2 });
A(SEEN + 0.6, "phx", "wings", { to: 0, dur: 0.3 });
c.arm(SEEN + 0.3, "god", "L", { o: [0.45, 0.55, 0] }, 0.4, "inOut");   // the officer's glove: in you go
const WALK = r3(SEEN + 0.65), IN = r3(WALK + 0.8), SHUT = r3(IN + 0.5);
A(WALK, "phx", "move", { to: [0.45, VAN.z + 0.45], dur: 0.6 });   // he walks in by himself, shoulders down
A(IN - 0.2, "phx", "move", { to: [0.45, VAN.z - 0.65], y: 0.45, dur: 0.2, ease: "linear", steps: 0 });
sfx(IN, "hit-metal", { gain: 0.7, reason: "Phoenix's feet on the van's metal floor" });
A(IN + 0.02, "phx", "turn", { to: 0, dur: 0.3 });
expr(IN, "phx", "sad", null, 0.2);
c.arm(IN + 0.05, "god", "L", "rest", 0.45, "inOut");
pr(SHUT - 0.14, "van", { open: 0 }, 0.14, "in");
sfx(SHUT, "slam", { gain: 0.95, reason: "the van's doors" }); sfx(SHUT + 0.12, "latch", { gain: 0.7, reason: "the bolt" });
park(SHUT + 0.01, "phx"); park(SHUT + 0.01, "vik");
pr(SHUT, "van", { rock: 3 }, 0.1, "out"); pr(SHUT + 0.1, "van", { rock: -2 }, 0.14); pr(SHUT + 0.24, "van", { rock: 0 }, 0.1, "settle");
for (const who of ["god", "dra"]) A(SHUT + 0.1, who, "expr", { expr: "smug", dur: 0.2 });
see(T.van, SEEN + 0.3, ["phx.face", "van"], "the reveal: the van, the officers and the burning car right behind his grin");
see(IN + 0.3, SHUT - 0.1, ["phx.face", "vik.face"], "side by side in the van: the runner and the fighter");
see(SHUT, T.alone, ["van", "god.face", "dra.face"], "the doors shut on them");

// ================================================================ 4 FREEZE 19.5-28.7
// ---- the one who did nothing: Reaper alone behind the potato bin, exactly as he was. Steps and a torch come closer
place(T.alone, "rea", REA_H, 0); park(T.alone, "god"); park(T.alone, "dra");
pr(T.alone - 0.02, "pool", { x: 1.9, y: 0.2, on: 0 }, 0.01, "linear"); pr(T.alone - 0.02, "shadow", { on: 0 }, 0.01, "linear");
sfx(T.alone, "sirenwail", { dur: 8.5, gain: 0.4, reason: "sirens, further off now" });
nar(T.alone + 0.05, "twoDown", { until: r3(T.alone + 0.9) });
const NOTHING = r3(T.alone + 0.9);
nar(NOTHING, "nothing", { until: T.crate });
pr(T.alone + 0.9, "bin", { look: -1 }, 0.2); pr(T.alone + 1.7, "bin", { blink: 1 }, 0.08); pr(T.alone + 1.82, "bin", { blink: 0 }, 0.08);
pr(T.alone + 1.6, "pool", { on: 0.7 }, 0.2); pr(T.alone + 1.6, "pool", { x: 0.9 }, r3(T.crate - T.alone - 1.6), "inOut");
for (const dt of [1.7, 2.3, 2.9]) sfx(T.alone + dt, "step", { gain: 0.45 + dt * 0.06, reason: "the officer's boots coming down the alley" });
see(T.alone, T.crate, ["rea.face", "bin"], "Reaper alone behind the bin of potatoes, the same frozen pose, the price tag in front of him");

// ---- close: a potato behind a bin of potatoes. They look up at him, one whispers "shh". The torch stops on his face
pr(T.crate - 0.02, "bin", { look: 0 }, 0.01, "linear"); pr(T.crate + 0.15, "bin", { blink: 1 }, 0.08); pr(T.crate + 0.27, "bin", { blink: 0 }, 0.08);
const SHH = r3(T.crate + 0.3);
pr(SHH, "bin", { shh: 1 }, 0.12); pr(SHH + 0.7, "bin", { shh: 0 }, 0.2);
sfx(SHH + 0.05, "hiss", { gain: 0.35, dur: 0.5, reason: "a potato in the bin whispering shh" });
c.textPop(SHH, "rea", "Shh!", { size: 78, dur: 0.85, angle: 6, dx: 0.9, dy: 0.95, color: "#ffffff" });   // beside the potato that whispers (a centred caption sits on Reaper)
const SWEEP = r3(T.crate + 0.9), FOUND = r3(T.crate + 1.5);
pr(SWEEP - 0.02, "pool", { x: 0.7, y: 0.3, z: r3(BIN.z + BIN.d / 2 + 0.05), w: 0.9, d: 0.5 }, 0.01, "linear");
pr(SWEEP, "pool", { on: 0.45 }, 0.15); pr(SWEEP, "pool", { x: r3(REA_H[0] + 0.05), y: 0.52 }, r3(FOUND - SWEEP), "inOut");   // across the bin, up onto his face
pr(SWEEP, "bin", { look: 1 }, 0.12); pr(FOUND, "bin", { blink: 1 }, 0.1);
for (const dt of [0, 0.5]) sfx(SWEEP + 0.1 + dt, "ai/heartbeat", { gain: 0.8, reason: "Reaper's heart, the only thing moving" });
see(T.crate + 0.1, T.lean, ["rea.face", "bin"], "a potato behind a bin of potatoes; the torch stops on his face");

// ---- snap 2, the fake-out: the officer leans in, his glove comes for Reaper's face... and straightens the price tag
// He stands at the bin's right end, in profile, and leans far in over it. One hand does it all, the camera-side one:
// up to Reaper's cheek, a held beat, then a short drop to the tag right under it (the far hand holds the torch).
const SAM1 = [r3(BIN.x + BIN.w / 2 + 0.57), BIN.z], SAM0 = [r3(SAM1[0] + 1.6), SAM1[1]];
place(T.lean, "sam", SAM0, -68);   // a little open to the lens, so his face reads
c.arm(T.lean - 0.02, "sam", "R", { o: [0, 0.35, 0.25] }, 0.01); A(T.lean - 0.02, "sam", "grip", { side: "R", shape: "fist", dur: 0.01 });   // the torch hand
A(T.lean, "sam", "move", { to: SAM1, dur: 0.5, ease: "out" });
look(T.lean, "sam", [-0.3, -0.1], 0);
A(T.lean + 0.45, "sam", "lean", { to: 28, dur: 0.35 });   // + leans to screen left: over the bin, toward Reaper
expr(T.lean + 0.55, "sam", "stern", { browY: -0.01 });
c.arm(T.lean + 0.4, "sam", "L", { o: [0, 0.6, 0.3] }, 0.26, "out");
c.arm(T.lean + 0.68, "sam", "L", { o: [-0.3, 0.45, 0.55] }, 0.27, "inOut");
pr(T.lean + 0.7, "bin", { blink: 0, look: 1 }, 0.12);   // the potatoes watch the glove
for (const dt of [0.75, 1.1]) sfx(T.lean + dt, "ai/heartbeat", { gain: 0.9, reason: "Reaper's heart as the glove comes for his face" });
// ...then drops to the crooked tag in front of him, and straightens it
const FIX = r3(T.lean + 1.4);
c.arm(FIX - 0.2, "sam", "L", { o: [-0.15, 0.27, 0.52] }, 0.18, "inOut");
A(FIX - 0.15, "sam", "grip", { side: "L", shape: "pinch", dur: 0.1 });
pr(FIX, "bin", { crook: 0 }, 0.14, "back");
sfx(FIX + 0.04, "tink", { gain: 0.5, reason: "the price tag straightened" });
A(FIX + 0.15, "sam", "expr", { expr: "smug", dur: 0.2 });
c.arm(FIX + 0.25, "sam", "L", "rest", 0.35, "settle"); A(FIX + 0.25, "sam", "lean", { to: 0, dur: 0.3 });
see(T.lean + 0.5, T.radio, ["sam.face", "rea.face"], "the fake-out: the officer's glove goes past Reaper's face to the price tag");
// ---- "Nothing here. Just potatoes." He walks on; the lights leave
sfx(T.radio, "radio", { gain: 0.6, reason: "the officer's radio keying" });
A(T.radio, "sam", "turn", { to: -35, dur: 0.3 });
c.say(T.radio + 0.1, "sam", "nothing here. just potatoes.", 1.1, "calm", { sub: "Nothing here. Just potatoes." });   // its caption must be gone before the beach
A(T.radio + 1.1, "sam", "turn", { to: 90, dur: 0.25 }); A(T.radio + 1.2, "sam", "move", { to: SAM0, dur: 0.55, ease: "in" });
pr(T.radio + 0.3, "pool", { on: 0 }, 0.3);
for (const id of ["washL", "washR", "washG"]) pr(T.radio + 0.9, id, { on: 0 }, 0.7, "inOut");
pr(T.radio + 1.25, "bin", { look: 0 }, 0.2);

// ================================================================ 5 THE PAYOFF 28.7-32.2: a sunny beach, the same pose
place(T.beach, "rea", [0, 0.5], 0); park(T.beach, "sam");
A(T.beach - 0.02, "rea", "lean", { to: 0, dur: 0.01 });
A(T.beach - 0.02, "rea", "sit", { seat: "lounger", dur: 0.01, hands: "keep" });
bag.carry(T.beach - 0.02, [0, 0.28, 0.9], 0.01, "linear");   // on his lap, under his chin
prop(T.beach - 0.02, "bagR", { tilt: 0 }, 0.01, "linear");
sfx(T.beach, "waves", { dur: r3(END - T.beach - 0.05), gain: 0.5, reason: "the sea" });
sfx(T.beach + 0.25, "gull", { gain: 0.6, reason: "the seagull on his hood" });
const CARD = { size: 58, kinetic: false, style: "label" };
cap(r3(T.beach + 0.3), END, "Viking: 8 years.", 480, true, CARD);
cap(r3(T.beach + 0.9), END, "Phoenix: 8 years.", 570, true, CARD);
cap(r3(T.beach + 1.5), END, "Reaper: still hasn't moved.", 660, true, CARD);
nar(T.which + 0.02, "which", { until: END, pos: 750 });
see(T.beach, END, ["rea.face", "bagR", "lounger"], "the payoff: Reaper on a lounger at the beach, the same frozen pose, the bag in his arms");

// ---------------------------------------------------------------- blinks: placed, never on a line; Reaper never blinks again after "Freeze."
act.blinksAt(c, "vik", [1.2, 3.3, 6.15]);
act.blinksAt(c, "phx", [1.35, 3.45, 6.2, 13.9]);
act.blinksAt(c, "sam", [r3(T.lean + 0.35), r3(T.radio + 0.1)]);
act.blinksAt(c, "god", [r3(T.van + 1.5)]); act.blinksAt(c, "dra", [r3(T.van + 1.7)]);
A(1.1, "rea", "blink", { dur: 0.22 }); A(3.4, "rea", "blink", { dur: 0.22 });

// ---------------------------------------------------------------- shots
const HOOK = shot("alley", [r3(AX + 0.06), 0.95, 5.3], { tilt: -8, fov: 46 });
const COPS = shot("street", [0, 1.1, -1.8], { tilt: -6, fov: 42 });
const LOST_CU = shot("street", [0, 0.95, 4.2], { tilt: -4.5, fov: 36 });
const TRIO_CU = shot("alley", [AX, 0.6, 3.0], { tilt: -8, fov: 46 });
const QUEST = shot("alley", [AX, 0.9, 4.3], { tilt: -8, fov: 46 });
const ONE = ([x, z]) => shot("alley", [x, 0.8, z + 3.0], { tilt: -8, fov: 34 });
const STREET_W = shot("street", [0, 1.25, 7.0], { tilt: -6, fov: 46 });
const CHARGE_W = shot("street", [0.7, 1.25, 7.0], { tilt: -6, fov: 46 });   // off his axis: the shooter in the gap and the car on the right stay in view past Viking's back
const STREET_M = shot("street", [0, 1.15, 4.4], { tilt: -6, fov: 42 });
const ROOF_RUN = shot("roof", [0, 1.0, 5.0], { tilt: -8, fov: 46 });
const ROOF_LEAP = shot("roof", [0, 1.1, 5.0], { tilt: 6, fov: 44 });
const CORNER = shot("corner", [0, 0.95, 5.2], { tilt: -5, fov: 40 });
const VAN_W = shot("street", [0, 1.25, 7.0], { tilt: -6, fov: 46 });
const ALONE = shot("alley", [-0.2, 0.9, 4.9], { tilt: -8, fov: 46 });
const ALONE_IN = shot("alley", [-0.2, 0.85, 4.0], { tilt: -8, fov: 46 });
const CRATE = shot("alley", [-0.05, 0.95, 2.8], { tilt: -18, fov: 36 });   // looking down into the bin: the potatoes' faces under his
const LEAN = shot("alley", [0.25, 0.8, 4.6], { tilt: -9, fov: 46 });
const BEACH = shot("beach", [0, 1.75, 5.2], { tilt: 0, fov: 42 });   // Reaper low in frame: four lines of text fit over him
const beats = c.beats([
  ["1 you just robbed a bank", T.hook, HOOK, "hook"],
  ["2 the police are here", T.police, COPS],
  ["3 three faces", T.faces, TRIO_CU],
  ["4 fight", T.fight, ONE(VIK_A)],
  ["4 flight", T.flight, ONE(PHX_H)],
  ["4 freeze", T.freeze, ONE(REA_H)],
  ["5 only one gets away", T.question, QUEST],
  ["6 the roar", T.roar, QUEST],
  ["6 the charge", T.charge, CHARGE_W],
  ["6 fighting works", T.grin, STREET_M],
  ["7 phoenix bolts", T.bolt, QUEST],
  ["7 the rooftops", T.roof, ROOF_RUN],
  ["7 the leap", T.leap, ROOF_LEAP, "escalation"],
  ["7 lost them", T.lost, LOST_CU],
  ["7 the van", T.van, VAN_W],
  ["8 the one who did nothing", T.alone, { ...ALONE, to: ALONE_IN, dur: r3(T.crate - T.alone), ease: "linear" }],
  ["8 in the potatoes", T.crate, CRATE],
  ["8 the price tag", T.lean, LEAN],
  ["9 the beach", T.beach, BEACH, "payoff"],
], END);

for (const p of props) { delete p._place; delete p._from; delete p._to; delete p._stay; }
const V = (t) => r3(t > HIT ? t + 0.1 : t);   // story seconds -> the video's clock (the hit-stop holds 3 frames)
write(import.meta.url, {
  id: "fff-01-bank-robbery",
  title: "You just robbed a bank. Fight, flight or freeze?",
  idea: "Fight, Flight or Freeze pilot: three friends rob a bank; Viking fights (netted), Phoenix runs (in a circle, into the van), Reaper freezes (tips into a bin of potatoes and gets away)",
  format: "series: Fight, Flight or Freeze (one extreme situation, three instincts, all three outcomes in one video)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  cover: r3(APEX + 0.1),
  set: { type: "env", env: ENVS.alley, swap: PLACES.slice(1).map(([at, name]) => ({ at, env: ENVS[name] })), aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  music: { style: "sneaky", lowCut: 150, gain: 0.26, parts: [{ at: 0, part: "main" }, { at: T.alone, part: "stop" }], then: { file: "ai/elevator-bossa/elevator-bossa-01.ogg", from: T.beach, gain: 0.3 } },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, surface: "concrete", room: "street", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["vik", "phx", "rea", "bagL", "bagM"], hint: 0, what: "three masked potatoes high-five over open money bags in a back alley, a bank alarm ringing" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "phx", from: 0, to: 0.3, reason: "the high-five: their two gloves meet" },
    { who: "rea", with: "bagR", from: 0, to: V(END), reason: "Reaper hugs his money bag against his belly from frame 0 to the beach (the frozen pose)" },
    { who: "rea", with: "lounger", from: V(T.beach), to: V(END), reason: "Reaper sits on the lounger" },
    { who: "phx", with: "van", from: V(T.van + 0.4), to: V(T.alone), reason: "Phoenix runs into the open back of the van" },
    { who: "sam", with: "bin", from: V(FIX - 0.25), to: V(FIX + 0.4), reason: "the officer's glove on the bin's price tag as he straightens it" },
    { who: "sam", with: "torch2", from: V(T.lean - 0.05), to: V(T.beach), reason: "the torch is in his fist (worn at the glove)" },
    { who: "vik", with: "van", from: V(T.van), to: V(T.alone), reason: "Viking, netted, sits in the back of the van" },
    { who: "god", with: "cap-god", from: 0, to: V(END), reason: "the officer's cap sits in his hair (worn)" },
    { who: "dra", with: "cap-dra", from: 0, to: V(END), reason: "the officer's cap (worn)" },
    { who: "sam", with: "cap-sam", from: 0, to: V(END), reason: "the officer's cap (worn)" },
  ],
  notes: "Generated by storyboards/series/fight-flight-freeze/01-bank-robbery/make-bank-robbery.mjs. Title added in TikTok's text tool.",
});
