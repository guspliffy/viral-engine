// FIGHT, FLIGHT OR FREEZE, PILOT: "YOU JUST ROBBED A BANK" (Jonny 10 Nov 2026), from the clip template.
//   node storyboards/series/fight-flight-freeze/01-bank-robbery/make-bank-robbery.mjs -> fff-01-bank-robbery.json
//   --blocking: the new props (props-heist*.js) as stand-ins from the library, for the staging proof
// Brief: /mnt/project-files/video-scripts/2026-11-10-fight-flight-freeze/00-SERIES-FORMAT-AND-PILOT.md (series rules
// + the pilot's beat table). PANELS.md next to this file: the staging, the story chain and every departure.
//
// THE BRIEF
//   Story:       three friends hide in a house after robbing a bank and the police arrive. One fights, one runs, one
//                freezes. Serious, one cause-and-effect chain (Jonny, 10 Nov, on draft 3: no forced jokes):
//                Viking storms out of the front door and is netted in four seconds, so the police know the house;
//                an officer comes in with a torch, so Phoenix bolts; every officer chases Phoenix, so nobody ever
//                searches the house; Phoenix is caught three days later; Reaper, frozen behind the crates, is free.
//   Wants:       all three want to get away with the money.
//   Ending:      the silent hall: Reaper breathes out for the first time since "Freeze." "Which one are you?"
// Series rules: the situation spoken, written and shown in the first 3-5 s (narrator = voice "narrator", first word
// at 0.0, the caption the same words one sentence at a time); the three options each on one face with a label; the
// big question "Only one of them gets away."; three outcomes, each caused by the one before; "Fight lasted ...",
// "Flight lasted ..."; "Which one are you?".
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { NIGHTHALL } from "../../../../engine/page/set-nighthall.js";

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
// The hideout is a built room, the night hall of a house (engine/page/set-nighthall.js), moved HALL_Z toward the lens
// so its open front door (left wall) is between the camera and the crates the three hide behind.
const HALL_Z = 3;
const ENVS = { hall: "dusk-back-alley", street: "dusk-bus-stop", air: "airport-apron-sunrise" };   // "hall": only the old alley painting's pitch, for the front shots' framing
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
  fightOut: ["Fight lasted four seconds.", 2.16], chased: ["Everyone chased Flight.", 2.28], flightOut: ["Flight lasted three days.", 2.41],
  searched: ["Nobody ever searched the house.", 2.61], which: ["Which one are you?", 1.32],
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
  search: fr(13.45), run: fr(15.5), left: fr(17.1), chase: fr(18.5),
  days: fr(20.1), caught: fr(21.5), quiet: fr(25.1), which: fr(28.2), end: 29.7,
};
T.back = T.search;
const END = T.end;
const NET = r3(T.net + 0.34);   // the net lands on Viking
const HIT = r3(T.charge + 0.75);   // Viking goes through the shield line
// which place is up from when (set.swap); the street is the first env: its light is the clip's light
const PLACES = [[0, "hall"], [T.police, "street"], [T.faces, "hall"], [T.charge, "street"], [T.search, "hall"], [T.chase, "street"], [T.days, "air"], [T.quiet, "hall"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];

// ---------------------------------------------------------------- cast
const PARK = { vik: [40, 40], phx: [43, 40], rea: [46, 40], sam: [40, 44], god: [43, 44], dra: [46, 44] };
// the hall: the three stand behind a row of crates across the hall (0.34 m: belt high; crouched, only their eyes
// show over it), the open front door on the left wall between the row and the lens
const AX = 0, VIK_A = [AX, -1.15], PHX_A = [r3(AX - 0.92), -0.4], REA_A = [r3(AX + 0.88), -0.4], PHX_YAW = 16, REA_YAW = -16;
const PHX_H = [r3(AX - 0.66), -0.4], REA_H = [r3(AX + 0.66), -0.4];   // huddled, from the duck on
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

// ---- the hall
const ROW_Z = 0.45, ROW_H = 0.34;
[["crateL", -0.92], ["crateM", 0], ["crateR", 0.92]].forEach(([id, x]) => P("hall", { id, kind: "producecrate", x, z: ROW_Z, w: 0.9, d: 0.5, h: ROW_H }));
// the loot: two open bags on the ground in front of the row, Reaper's in his arms (the frozen pose's bag, to the beach)
P("hall", { id: "bagL", kind: "moneybag", x: r3(AX - 0.72), z: 1.02, rot: 14, open: true });
P("hall", { id: "bagM", kind: "moneybag", x: r3(AX + 0.38), z: 1.06, rot: -10, open: true });
const front = ([x, z], yaw, f, s, y) => { const a = rad(yaw); return [r3(x + f * Math.sin(a) + s * Math.cos(a)), r3(y), r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const BAG_AT = front(REA_A, REA_YAW, 0.4, 0, 0.2);
// (a held prop stays in the world when its holder is parked: it is carried wherever Reaper goes, by hand, below)
// The box hold puts the R glove on the prop's +x: the prop's front goes toward its holder (rot = yaw + 180), or the
// arms cross. So the sack's "$" is on its back (spec.back), toward us.
const BAG = P("hall", { id: "bagR", kind: "moneybag", x: BAG_AT[0], y: BAG_AT[1], z: BAG_AT[2], rot: REA_YAW + 180, back: true });
// Viking's shield: a small crate on the ground in front of him, behind the row
const SHIELD = P("hall+street", { id: "shield", kind: "producecrate", x: AX, z: -0.7, w: 0.5, d: 0.36, h: 0.3, scale: 0.85, rot: 180 }, { to: T.search });
// police light in the hall: a wash on each wall and one on the floor by the door, the torch's pool on the crate fronts
P("hall", { id: "washL", kind: "sirenwash", x: -1.37, y: 0.3, z: -1.2, rot: 90, w: 4.5, h: 2.2, on: 0 });
P("hall", { id: "washR", kind: "sirenwash", x: 1.37, y: 0.3, z: -1.2, rot: -90, w: 4.5, h: 2.2, on: 0 });
P("hall", { id: "washG", kind: "sirenwash", x: -0.3, z: 1.6, w: 2.4, h: 2.4, flat: true, on: 0 });
P("hall", { id: "pool", kind: "lightpool", x: -1.45, y: 0.2, z: r3(ROW_Z + 0.27), w: 1.1, d: 0.6, face: "z", on: 0 });   // on the crate fronts
P("hall", { id: "search", kind: "lightpool", x: -1.2, y: 0.01, z: 1.5, w: 1.5, d: 1.1, on: 0 });   // the searchlight's pool on the hall floor
// outside the window in the far wall (WIN): three patrol cars, noses at the house, on a street half a metre up so the
// lens (0.9 m high, 9 m from the window) sees their windscreens and light bars; one more outside the front door
const WIN = { x: 0, y: 1.0, w: 1.9, h: 1.15 }, OUT_Y = 0.5, OUT_Z = r3(NIGHTHALL.far + HALL_Z - 6.4);   // noses about 4 m from the glass: a whole car front fits the window
P("hall", { id: "winA", kind: "policecar", x: 0.1, y: OUT_Y, z: r3(OUT_Z - 9), rot: 0, lights: 0, staged: "the street outside the window lies half a metre above the hall floor" });
P("hall", { id: "winB", kind: "policecar", x: -2.3, y: OUT_Y, z: r3(OUT_Z - 10), rot: 24, lights: 0, staged: "the street outside the window lies half a metre above the hall floor" });
P("hall", { id: "winC", kind: "policecar", x: 2.5, y: OUT_Y, z: r3(OUT_Z - 11), rot: -24, lights: 0, staged: "the street outside the window lies half a metre above the hall floor" });
P("hall", { id: "winwash", kind: "sirenwash", x: 0, y: 1.7, z: r3(NIGHTHALL.far + HALL_Z - 0.6), w: 4.6, h: 3, on: 0 });   // their blue and red in the window: the navy cars read against it
P("hall", { id: "doorcar", kind: "policecar", x: -4.4, z: 6.6, rot: 150, lights: 1 }, { from: T.search, to: T.left });
// the masks and the caps (fit tables: props-heist.js header)
const CAP = { sam: 1.09, god: 1.26, dra: 1.06 };
for (const who of ["vik", "phx", "rea"]) P("all", { id: `mask-${who}`, kind: "eyemask", wear: who, x: 0, y: 0, z: 0, fit: who });
for (const who of ["sam", "god", "dra"]) P("all", { id: `cap-${who}`, kind: "policecap", wear: who, x: 0, y: CAP[who], z: 0.02, r: 0.2 });

// ---- street (the market street: the shield line, then the wall of cars; later the van)
const LINE_Z = -1.7, GOD_S = [-0.66, LINE_Z], DRA_S = [0.66, LINE_Z];
for (const who of ["god", "dra"]) P("street", { id: `shield-${who}`, kind: "riotshield", wear: who, x: 0, y: 0.27, z: 0.56 }, { to: T.search });
const WALL_Z = -6.2;
P("street", { id: "car1", kind: "policecar", x: -7.5, z: WALL_Z - 0.6, rot: 62, lights: 0 }, { to: T.search });
P("street", { id: "car2", kind: "policecar", x: 7.5, z: WALL_Z - 0.6, rot: -62, lights: 0 }, { to: T.search });
P("street", { id: "car3", kind: "policecar", x: 0, z: WALL_Z - 9, rot: 0, lights: 0 }, { to: T.search });
[-1.5, -0.75, 0.75, 1.5].forEach((x, i) => P("street", { id: `wall${i}`, kind: "riotshield", x, y: -1.2, z: WALL_Z + 1.4 }, { to: T.search }));
P("street", { id: "washS", kind: "sirenwash", x: 0, y: 0.2, z: WALL_Z + 2.2, w: 7, h: 4.5, on: 0 }, { to: T.search });
P("street", { id: "netfly", kind: "policenet", x: 0, y: 0.9, z: WALL_Z + 1.2, r: 0.75, open: 0, wrap: 0 }, { from: T.net, to: NET + 0.02 });
P("street", { id: "netwrap", kind: "policenet", wear: "vik", x: 0, y: 1.12, z: 0, r: 0.75, open: 1, wrap: 1 }, { from: NET + 0.02, to: T.search });
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
P("street", { id: "carX", kind: "policecar", x: WRECK.x, z: WRECK.z, rot: 0, lights: 1 }, { from: T.charge, to: T.search });
P("street", { id: "boom", kind: "carburst", x: r3(WRECK.x - 0.5), y: 0.6, z: r3(WRECK.z + 1.6), at: BOOM, r: 1.5, on: 1 }, { from: T.charge, to: T.search });
P("street", { id: "fire", kind: "firesmoke", x: r3(WRECK.x - 0.7), y: 0.7, z: r3(WRECK.z + 1.6), w: 2.6, h: 4.6, fire: 0 }, { from: T.charge, to: T.search });
// the chase down the same street: the wreck still burning, three more cars, the helicopter's beam
P("street", { id: "carY", kind: "policecar", x: WRECK.x, z: WRECK.z, rot: 0, lights: 0 }, { from: T.chase });
P("street", { id: "fireY", kind: "firesmoke", x: r3(WRECK.x - 0.7), y: 0.7, z: r3(WRECK.z + 1.6), w: 2.6, h: 4.6, fire: 0 }, { from: T.chase });
P("street", { id: "boom2", kind: "carburst", x: r3(WRECK.x - 1.0), y: 0.7, z: r3(WRECK.z - 1.2), at: r3(T.chase + 0.85), r: 1.8, on: 1 }, { from: T.chase });
for (const id of ["chase1", "chase2", "chase3"]) P("street", { id, kind: "policecar", x: 0, z: -30, rot: 0, lights: 0 }, { from: T.chase });
P("street", { id: "spot", kind: "lightpool", x: 0, y: 0.01, z: -6, w: 2.2, d: 1.5, on: 0 }, { from: T.chase });
P("street", { id: "beam", kind: "lightbeam", x: 0.6, y: 9, z: -6, tip: 0, len: 9.2, w: 1.6, color: "#ffffff", glow: 0 }, { from: T.chase });
// ---- the airport apron, three days later: his suitcase, two patrol cars, police light on the tarmac
P("air", { id: "case", kind: "suitcase", x: 0.6, y: 0.24, z: 2.3, color: "#c8452e" });
P("air", { id: "air1", kind: "policecar", x: -9.5, z: -2.3, rot: 62, lights: 0 });
P("air", { id: "air2", kind: "policecar", x: 9.5, z: -2.6, rot: -62, lights: 0 });
P("air", { id: "washA", kind: "sirenwash", x: 0, y: 0.6, z: -1.2, w: 7, h: 3.5, on: 0 });
P("air", { id: "washB", kind: "sirenwash", x: 0, z: 3.2, w: 6, h: 4, flat: true, on: 0 });

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
// ---- frame 0: the hall of a dark house, masks, open money bags, a high-five in the air, the alarm ringing
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
for (const id of ["washL", "washR", "washG", "winwash"]) { pr(T.snap1 + (id === "winwash" ? 0.3 : 0), id, { on: id === "winwash" ? 0.45 : 1 }, 0.12, "out"); }
// ...and through the window behind them three patrol cars roll up, noses at the house
[["winA", OUT_Z, 0], ["winB", r3(OUT_Z - 0.8), 0.12], ["winC", r3(OUT_Z - 1.4), 0.24]].forEach(([id, z, dt]) => { pr(T.snap1 - 0.02, id, { lights: 1 }, 0.01, "linear"); pr(T.snap1 + dt, id, { z, len: 9 }, 0.45, "out"); });
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
pr(T.police + 0.1, "pool", { on: 0.7 }, 0.2); pr(T.police + 0.1, "pool", { x: -1.15 }, 0.6, "inOut");
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
// FREEZE: Reaper goes stiff where he is, down behind his crate: only his eyes over it. THE pose: it holds to the end
nar(T.freeze, "freeze", { sub: false });
c.textPop(T.freeze + 0.25, "rea", "FREEZE", { ...LABEL, color: "#8fd8ff" });
const BAG_0 = front(REA_H, 0, 0.33, 0, 0.2);   // the bag in front of him once he faces us
bag.carry(T.freeze - 0.08, [BAG_0[0], r3(BAG_0[1] + DUCK), BAG_0[2]], 0.12, "out", { rot: 180 });
A(T.freeze - 0.02, "rea", "turn", { to: 0, dur: 0.1 });
A(T.freeze, "rea", "expr", { expr: "shocked", set: { open: 0.02, eye: 1.5, curve: -0.02 }, dur: 0.08 });
A(T.freeze, "rea", "face", { brow: 0.55, dur: 0.08 });
look(T.freeze, "rea", [0, 0.02], 0.06);
A(T.freeze + 0.05, "rea", "squash", { amount: -0.06, dur: 0.2 });
sfx(T.freeze + 0.05, "tink", { gain: 0.6, reason: "Reaper freezing solid" });
A(T.freeze + 0.1, "rea", "still", { dur: r3(T.quiet + 0.5 - T.freeze), idle: 0 });
A(0, "rea", "noblink");
see(T.freeze, T.question, ["rea.face"], "FREEZE: Reaper goes stiff behind his crate, eyes wide");

// ---- the big question (6.65): the torch's pool one step from them
nar(T.question + 0.05, "one", { until: T.roar });
A(T.question - 0.02, "phx", "wings", { to: 0.12, dur: 0.01 });
pr(T.question, "pool", { x: -0.95 }, 0.9, "inOut");
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
nar(T.net, "fightOut", { until: T.search });
see(NET + 0.75, T.search, ["vik.face"], "Viking netted, on his side, face to us");

// ================================================================ 3 FLIGHT: he can't take it, runs out of the door, and takes every officer with him
// Jonny, 10-11 Nov: no forced jokes, one logical chain, more dramatic. Viking stormed out of the front door, so the
// police know the house: their cars stand outside the window, a megaphone orders the rest out. Phoenix cracks and runs
// out of the door; every car goes after him, so nobody ever comes in to look behind the crates where Reaper froze.
const BAG_F = [BAG_0[0], r3(BAG_0[1] + DUCK), BAG_0[2]];   // the bag's place in the frozen pose: put back after every cut to the hall
const backInHall = (t) => { place(t, "rea", REA_H, 0, DUCK); bag.carry(r3(t - 0.009), BAG_F, 0.008, "linear"); };
// ---- two left behind the crates. Outside: three cars, a searchlight through the window, a megaphone
backInHall(T.back);
place(T.back, "phx", PHX_H, 0, DUCK); A(T.back - 0.02, "phx", "crouch", { to: 1, dur: 0.01 }); A(T.back - 0.02, "phx", "wings", { to: 0, dur: 0.01 });
c.arm(T.back - 0.02, "phx", "both", { o: [-0.05, 0.3, 0.3] }, 0.01);
park(T.back, "vik"); park(T.back, "god"); park(T.back, "dra");
place(T.back, "sam", [5.6, -7], 0);   // outside, behind the wall: only his voice comes in
sfx(T.back + 0.05, "feedback", { gain: 0.5, reason: "the police megaphone squealing on outside the window" });
c.say(T.back + 0.3, "sam", "come out with your hands up!", 1.3, "excited", { sub: "COME OUT WITH YOUR HANDS UP!" });
pr(T.back - 0.02, "search", { x: -1.2, on: 0.75 }, 0.01, "linear"); pr(T.back, "search", { x: 1.1 }, 0.9, "inOut"); pr(T.back + 0.9, "search", { x: -0.6 }, 1.0, "inOut");   // the searchlight sweeping the hall floor
expr(T.back - 0.02, "phx", "terrified", { open: 0.15 }, 0.01);
for (const [dt, to] of [[0, [-0.6, 0.3]], [0.45, [0.7, 0.2]], [0.9, [-0.8, -0.1]], [1.4, [-0.85, 0.05]]]) look(T.back + dt, "phx", to, 0.1);   // the window, Reaper, the door... the door
c.at(r3(T.back + 0.3), { fx: "sweat", who: "phx", dur: 0.9, count: 5 });
A(T.back + 0.2, "phx", "tap", { count: 10, every: 0.14, side: "R" });
for (const dt of [0.2, 0.75, 1.25, 1.65]) sfx(T.back + dt, "ai/heartbeat", { gain: 0.9, reason: "Phoenix's heart, faster and faster" });
see(T.back, T.run, ["phx.face", "rea.face", "winA"], "police cars and their lights fill the window, a megaphone orders them out; Phoenix's eyes go to the door, Reaper has not moved");

// ---- he bolts (seen from the hiding place): up over the crates and out of the front door into the police lights
const RUN = T.run;
pr(RUN, "search", { on: 0 }, 0.1, "linear");
A(RUN, "phx", "crouch", { to: 0, dur: 0.1 }); A(RUN, "phx", "wings", { to: 1, dur: 0.1 }); A(RUN, "phx", "turn", { to: -20, dur: 0.1 });
c.arm(RUN, "phx", "both", "rest", 0.1);
A(RUN + 0.12, "phx", "fly", { to: { x: -0.75, y: 1.2, z: 0.85 }, dur: 0.24, ease: "linear" });
A(RUN + 0.36, "phx", "fly", { to: { x: -2.6, y: 0.8, z: 1.9 }, dur: 0.26, ease: "linear" });
sfx(RUN + 0.12, "rocket", { gain: 0.55, dur: 0.5, reason: "Phoenix bursting out of the hiding place" });
c.at(r3(RUN + 0.14), { fx: "shake", dur: 0.25, amp: 0.03 });
park(RUN + 0.64, "phx");
c.say(RUN + 0.7, "sam", "he's running! after him!", 0.9, "excited", { sub: "HE'S RUNNING! AFTER HIM!" });
sfx(RUN + 0.75, "sirenwail", { dur: 4.2, gain: 0.6, reason: "every siren starting up after Phoenix" });
pr(RUN + 0.95, "doorcar", { x: -3.2, z: 24, len: 12 }, 0.65, "in"); sfx(RUN + 0.95, "screech", { gain: 0.7, reason: "the car outside the door tearing off after him" });
see(RUN + 0.1, RUN + 0.5, ["phx"], "Phoenix bursts up over the crates and out of the open front door");
see(RUN + 0.7, T.left, ["doorcar"], "'He's running! After him!': the police car outside the door tears off; Reaper's back, frozen, in the corner");

// ---- left behind: through the window the cars pull away, the lights leave the walls. Nobody came in
backInHall(T.left); place(T.left, "sam", PARK.sam, 0); park(T.left, "sam");
[["winA", 0], ["winB", 0.12], ["winC", 0.22]].forEach(([id, dt]) => { pr(T.left + 0.1 + dt, id, { x: id === "winC" ? 16 : -16, len: 14 }, 0.8, "in"); });
sfx(T.left + 0.15, "screech", { gain: 0.55, reason: "the cars outside the window tearing off" });
for (const id of ["washL", "washR", "washG", "winwash"]) pr(T.left + 0.5, id, { on: 0 }, 0.7, "inOut");
nar(T.left + 0.3, "chased", { until: r3(T.left + 2.8) });   // the line runs on over the chase itself
see(T.left, T.chase, ["rea.face", "winA"], "Reaper alone behind the crates; through the window every police car pulls away after Phoenix");

// ---- the chase (the cover): Phoenix flat out down the street at us, three cars and a helicopter's beam on him, the
// wreck from Viking's fight still burning; one car clips it and goes up too
const CH = T.chase, CHD = r3(T.days - T.chase);
place(CH, "phx", [0.2, -9.5], 0); park(CH, "rea");
A(CH - 0.02, "phx", "pitch", { to: 0, dur: 0.01 }); A(CH - 0.02, "phx", "wings", { to: 0.6, dur: 0.01 });
A(CH, "phx", "move", { to: [-0.3, 2.4], dur: CHD, ease: "linear", stride: 1.9 });
expr(CH - 0.02, "phx", "terrified", { open: 0.55 }, 0.01); look(CH, "phx", [0, 0.05], 0);
look(CH + 0.5, "phx", [0.5, 0.6], 0.1); look(CH + 0.95, "phx", [0, 0.05], 0.1);
sfx(CH, "chopper", { dur: CHD, gain: 0.6, reason: "the police helicopter over the street" });
pr(CH - 0.02, "fireY", { fire: 1 }, 0.01, "linear");
[["chase1", -1.5, -19, -6.5], ["chase2", 1.35, -22, -5.6], ["chase3", -0.1, -27, -12]].forEach(([id, x, z0, z1]) => {
  pr(CH - 0.02, id, { x, z: z0, lights: 1 }, 0.01, "linear"); pr(CH, id, { z: z1, len: 14 }, CHD, "linear");
});
pr(CH - 0.02, "spot", { on: 1, x: 1.6, z: -10.5 }, 0.01, "linear"); pr(CH, "spot", { x: -0.3, z: 2.0 }, CHD, "in");
pr(CH - 0.02, "beam", { glow: 0.7, x: 1.6, z: -10.5 }, 0.01, "linear"); pr(CH, "beam", { x: -0.3, z: 2.0 }, CHD, "in");
const BOOM2 = r3(CH + 0.85);   // chase2 passes the wreck
pr(CH - 0.02, "boom2", { on: 1 }, 0.01, "linear"); pr(BOOM2 + 0.4, "boom2", { on: 0 }, 0.25, "inOut");   // the fireball only (its cooling smoke reads as pale blocks in this look)
sfx(BOOM2, "firework", { gain: 0.85, reason: "a chasing patrol car clipping the burning wreck and going up" }); sfx(BOOM2, "slam", { gain: 0.9, reason: "the second blast" });
c.at(BOOM2, { fx: "shake", dur: 0.3, amp: 0.04 });
pr(BOOM2, "chase2", { lights: 0 }, 0.05, "linear");
sfx(CH + 0.2, "screech", { gain: 0.6, reason: "three patrol cars sliding into the street behind him" });
see(CH + 0.3, T.days, ["phx.face", "chase1", "chase2"], "THE CHASE: Phoenix sprints at us, three police cars and a helicopter's beam behind him, a car going up in flames");

// ================================================================ 4 THREE DAYS LATER: the airport. One more step and he is on the plane
// He walks out across the apron to the jet, a suitcase rolling beside him. Two patrol cars slide in between him and
// the stairs; he spins round to run back, and there are more behind him. Hands up.
const WALK0 = [0, 2.3], WALK1 = [0, 0.7], CASE_DX = 0.6, WALKD = r3(T.caught - T.days + 0.15);
place(T.days, "phx", WALK0, 180);
A(T.days - 0.02, "phx", "wings", { to: 0, dur: 0.01 }); c.arm(T.days - 0.02, "phx", "both", "rest", 0.01);
expr(T.days - 0.02, "phx", "happy", null, 0.01); look(T.days - 0.02, "phx", [0, 0.1], 0.01);
A(T.days, "phx", "move", { to: WALK1, dur: WALKD, ease: "linear" });
pr(T.days - 0.02, "case", { x: r3(WALK0[0] + CASE_DX), z: WALK0[1] }, 0.01, "linear"); pr(T.days, "case", { z: WALK1[1] }, WALKD, "linear");
sfx(T.days, "rumble", { dur: r3(T.quiet - T.days - 0.05), gain: 0.3, reason: "a jet's engines idling on the apron" });
const CARD = { size: 58, kinetic: false, style: "label" };
cap(r3(T.days + 0.1), r3(T.caught + 0.3), "Three days later.", 480, true, CARD);
see(T.days, T.caught, ["phx", "case"], "three days later: Phoenix walks out to a waiting plane, a suitcase rolling beside him");
// ---- two cars cut him off
const CUT = T.caught;
[["air1", -1.75, 62, 0], ["air2", 1.9, -62, 0.12]].forEach(([id, x, rot, dt]) => {
  pr(CUT - 0.02, id, { lights: 1 }, 0.01, "linear"); pr(CUT + dt, id, { x, len: 9 }, 0.36, "out");
  sfx(CUT + dt + 0.05, "screech", { gain: 0.7, reason: "a patrol car sliding in between him and the plane" });
});
sfx(CUT, "sirenwail", { dur: 3.4, gain: 0.5, reason: "sirens all round him on the apron" });
pr(CUT + 0.3, "washA", { on: 1 }, 0.15);
act.shock(c, CUT + 0.3, "phx", { hold: 0.2 }); A(CUT + 0.3, "phx", "hop", { height: 0.1, dur: 0.2 });
pr(CUT + 0.34, "case", { x: r3(WALK1[0] + CASE_DX + 0.1) }, 0.3, "out"); pr(CUT + 0.4, "case", { tilt: 88 }, 0.3, "in");   // let go: it rolls on a step and falls over sfx(CUT + 0.7, "thud", { gain: 0.6, reason: "the suitcase falling over" });
A(CUT + 0.55, "phx", "turn", { to: 0, dur: 0.4, ease: "inOut" });   // round, to run back the way he came
expr(CUT + 0.6, "phx", "terrified", { open: 0.4 });
A(CUT + 0.95, "phx", "move", { to: [0, 1.25], dur: 0.3, ease: "out", stride: 1.4 });
// ...and more of them behind him (behind the lens): a siren whoop, their light on the ground at his feet. He stops
sfx(CUT + 1.05, "siren", { gain: 0.8, reason: "another patrol car whooping right in front of him, behind the lens" });
pr(CUT + 1.05, "washB", { on: 1 }, 0.12);
look(CUT + 1.1, "phx", [-0.8, 0.1], 0.1); look(CUT + 1.4, "phx", [0.8, 0.1], 0.12); look(CUT + 1.75, "phx", [0, 0], 0.15);
expr(CUT + 1.75, "phx", "sad", null, 0.3);
c.arm(CUT + 1.9, "phx", "both", "up", 0.45, "inOut");   // hands up: it is over
// the officers walk up from the cars behind him
place(CUT + 0.9, "sam", [-2.9, 0.1], 70); place(CUT + 0.9, "god", [3.1, 0.1], -70);   // in from the sides, in front of the cars
for (const who of ["sam", "god"]) { A(CUT + 0.88, who, "pitch", { to: 0, dur: 0.01 }); expr(CUT + 0.88, who, "stern", { browY: -0.012 }, 0.01); look(CUT + 0.9, who, [0, 0], 0.01); }
A(CUT + 0.95, "sam", "move", { to: [-1.1, 0.35], dur: 0.9, ease: "out" }); A(CUT + 1.05, "god", "move", { to: [1.5, 0.3], dur: 0.9, ease: "out" });
A(CUT + 1.6, "sam", "turn", { to: 25, dur: 0.25 }); A(CUT + 1.7, "god", "turn", { to: -25, dur: 0.25 });
sfx(CUT + 2.75, "cuffs", { gain: 0.8, reason: "handcuffs" });
nar(CUT + 1.0, "flightOut", { until: T.quiet });
see(CUT + 0.3, CUT + 0.8, ["phx", "air1", "air2"], "two patrol cars slide in between Phoenix and the plane; the suitcase falls");
see(CUT + 1.9, T.quiet, ["phx.face", "cap-sam", "cap-god"], "Phoenix, turned back to us, hands up; police lights all round, two officers walking up behind him");

// ================================================================ 5 FREEZE: nobody ever searched the house
backInHall(T.quiet); park(T.quiet, "phx"); park(T.quiet, "sam"); park(T.quiet, "god");
for (const id of ["winA", "winB", "winC"]) pr(T.quiet - 0.02, id, { lights: 0 }, 0.01, "linear");
nar(T.quiet + 0.3, "searched", { until: T.which });
// the hall is silent, the window dark. Only his eyes move: left, right. Then he comes up and breathes out
look(T.quiet + 0.6, "rea", [-0.8, 0.02], 0.25); look(T.quiet + 1.2, "rea", [0.8, 0.02], 0.3); look(T.quiet + 1.85, "rea", [0, 0.02], 0.2);
const OUT = r3(T.quiet + 2.25);
A(OUT, "rea", "blink", { dur: 0.25 });
A(OUT + 0.1, "rea", "crouch", { to: 0, dur: 0.5 }); A(OUT + 0.1, "rea", "move", { to: REA_H, y: 0, dur: 0.5, steps: 0, ease: "inOut" });   // up from behind the crate at last
bag.carry(OUT + 0.1, BAG_0, 0.5, "inOut");
A(OUT + 0.55, "rea", "squash", { amount: 0.07, dur: 0.5 });
A(OUT + 0.5, "rea", "expr", { expr: "happy", set: { curve: 0.25, open: 0.12, eye: 1 }, dur: 0.4 }); A(OUT + 0.5, "rea", "face", { brow: 0, dur: 0.4 });
sfx(OUT + 0.55, "deflate", { gain: 0.3, reason: "Reaper finally breathing out" });
nar(T.which + 0.02, "which", { until: END });
see(T.quiet, END, ["rea.face", "bagR"], "the payoff: the house is silent, the window dark; Reaper comes up from behind the crates with the bag and breathes out");

// ---------------------------------------------------------------- blinks: placed, never on a line; Reaper never blinks after "Freeze." until it is over
act.blinksAt(c, "vik", [1.2, 3.3, 6.15]);
act.blinksAt(c, "phx", [1.35, 3.45, 6.2]);
A(1.1, "rea", "blink", { dur: 0.22 }); A(3.4, "rea", "blink", { dur: 0.22 });

// ---------------------------------------------------------------- shots
// the hall is a built room: the front shots keep the old alley framing (shot("hall") uses the alley painting's pitch),
// the reverse shot looks from the hiding place at the front door
const HOOK = shot("hall", [0.06, 0.95, 5.3], { tilt: -8, fov: 46 });
const COPS = shot("street", [0, 1.1, -1.8], { tilt: -6, fov: 42 });
const TRIO_CU = shot("hall", [0, 0.6, 3.0], { tilt: -8, fov: 46 });
const QUEST = shot("hall", [0, 0.9, 4.3], { tilt: -8, fov: 46 });
const ONE = ([x, z], y = 0.8) => shot("hall", [x, y, z + 3.0], { tilt: -8, fov: 34 });
const CHARGE_W = shot("street", [0.7, 1.25, 7.0], { tilt: -6, fov: 46 });   // off his axis: the shooter in the gap and the car on the right stay in view past Viking's back
const STREET_M = shot("street", [0, 1.15, 4.4], { tilt: -6, fov: 42 });
const REV = { pos: [0.95, 1.25, -2.9], look: [-0.7, 0.72, 1.5], fov: 50 };   // from behind the two who are left: the crates, the open front door
const LEFT = shot("hall", [0.3, 0.9, 4.4], { tilt: -8, fov: 46 }), LEFT_IN = shot("hall", [0.4, 0.85, 3.8], { tilt: -8, fov: 46 });
const BACK = shot("hall", [0, 0.95, 4.6], { tilt: -8, fov: 46 });   // the two behind the crates, the window and its police lights over their heads
const CHASE = shot("street", [0, 1.25, 7.0], { tilt: -6, fov: 46 });
const AIR = shot("air", [0, 1.4, 8.0], { tilt: -6, fov: 46 });
const QUIET = shot("hall", [0.5, 0.8, 3.4], { tilt: -8, fov: 46 }), QUIET_IN = shot("hall", [0.6, 0.75, 2.7], { tilt: -8, fov: 46 });
const beats = c.beats([
  ["1 you just robbed a bank", T.hook, HOOK, "hook"],
  ["2 the police are here", T.police, COPS],
  ["3 three faces", T.faces, TRIO_CU],
  ["4 fight", T.fight, ONE(VIK_A)],
  ["4 flight", T.flight, ONE(PHX_H)],
  ["4 freeze", T.freeze, shot("hall", [REA_H[0], 1.05, REA_H[1] + 3.0], { tilt: -19, fov: 34 })],   // from above the crate: his whole face
  ["5 only one gets away", T.question, QUEST],
  ["6 the roar", T.roar, QUEST],
  ["6 the charge", T.charge, CHARGE_W],
  ["6 fighting works", T.grin, STREET_M],
  ["7 come out with your hands up", T.back, BACK],
  ["7 phoenix bolts", T.run, REV],
  ["8 left behind", T.left, { ...LEFT, to: LEFT_IN, dur: r3(T.chase - T.left), ease: "linear" }],
  ["9 the chase", T.chase, CHASE, "escalation"],
  ["10 three days later, the airport", T.days, AIR],
  ["11 nobody searched the house", T.quiet, { ...QUIET, to: QUIET_IN, dur: r3(END - T.quiet), ease: "linear" }, "payoff"],
], END);

for (const p of props) { delete p._place; delete p._from; delete p._to; delete p._stay; }
const V = (t) => r3(t > HIT ? t + 0.1 : t);   // story seconds -> the video's clock (the hit-stop holds 3 frames)
write(import.meta.url, {
  id: "fff-01-bank-robbery",
  title: "You just robbed a bank. Fight, flight or freeze?",
  idea: "Fight, Flight or Freeze pilot: three friends hide in a house after a bank robbery; Viking storms out to fight (netted in seconds), Phoenix runs out of the door (every police car chases him; caught three days later at the airport, one step from a plane), and because they all chase Phoenix nobody searches the house where Reaper froze",
  format: "series: Fight, Flight or Freeze (one extreme situation, three instincts, all three outcomes in one video)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  cover: r3(BOOM2 + 0.3),
  set: { type: "env", env: ENVS.street, swap: PLACES.map(([at, name]) => (name === "hall" ? { at, room: { type: "nighthall", pos: [0, 0, HALL_Z], window: WIN } } : { at, env: ENVS[name] })), aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  music: { style: "sneaky", lowCut: 150, gain: 0.26, parts: [{ at: 0, part: "main" }, { at: T.quiet, part: "stop" }] },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, surface: "wood", room: "street", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["vik", "phx", "rea", "bagL", "bagM"], hint: 0, what: "three masked potatoes high-five over open money bags in a dark house hall, a bank alarm ringing" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "vik", with: "phx", from: 0, to: 0.3, reason: "the high-five: their two gloves meet" },
    { who: "rea", with: "bagR", from: 0, to: V(END), reason: "Reaper hugs his money bag against his belly from frame 0 to the end (the frozen pose)" },
    { who: "vik", with: "shield", from: V(NET + 0.7), to: V(T.search), reason: "Viking, netted, lies on the splinters of his crate: a glove rests in them" },
    { who: "phx", with: "case", from: V(T.days), to: V(T.caught + 0.75), reason: "Phoenix pulls his suitcase along by its handle, then lets go of it" },
    { who: "god", with: "cap-god", from: 0, to: V(END), reason: "the officer's cap sits in his hair (worn)" },
    { who: "dra", with: "cap-dra", from: 0, to: V(END), reason: "the officer's cap (worn)" },
    { who: "sam", with: "cap-sam", from: 0, to: V(END), reason: "the officer's cap (worn)" },
  ],
  notes: "Generated by storyboards/series/fight-flight-freeze/01-bank-robbery/make-bank-robbery.mjs. Title added in TikTok's text tool.",
});
