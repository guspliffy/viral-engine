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

// ---------------------------------------------------------------- the clock (story seconds; every cut on the frame grid)
const T = {
  hook: 0, snap1: fr(1.6), police: fr(2.9), faces: fr(3.7), fight: fr(4.5), flight: fr(5.1), freeze: fr(5.7), question: fr(6.4),
  roar: fr(7.6), charge: fr(8.2), grin: fr(9.2), wall: fr(9.9), net: fr(10.7),
  bolt: fr(12.0), roof: fr(12.7), leap: fr(13.9), lost: fr(15.5), van: fr(16.9),
  alone: fr(19.3), crate: fr(22.2), sweep: fr(23.4), lean: fr(25.0), radio: fr(26.8),
  beach: fr(28.6), which: fr(31.0), end: 32.0,
};
const END = T.end;
// which env is up from when (set.swap); the alley is the first env: its light is the clip's light
const PLACES = [[0, "alley"], [T.charge, "street"], [T.bolt, "alley"], [T.roof, "roof"], [T.lost, "corner"], [T.van, "street"], [T.alone, "alley"], [T.beach, "beach"]];
const placeAt = (t) => PLACES.filter(([at]) => at <= t + 1e-6).pop()[1];

// ---------------------------------------------------------------- cast
const PARK = { vik: [40, 40], phx: [43, 40], rea: [46, 40], sam: [40, 44], god: [43, 44], dra: [46, 44] };
// the alley: the three stand behind a row of market crates (0.5 m: belly high), the potato bin at Reaper's left hand
const VIK_A = [0, -0.95], PHX_A = [-0.92, -0.45], REA_A = [0.86, -0.45];
const cast = [
  { id: "vik", character: "duo/viking", at: VIK_A, face: 0, expr: "delighted", follow: 0.3, seed: 3.3 },
  { id: "phx", character: "duo/phoenix", at: PHX_A, face: 16, expr: "delighted", follow: 0.3, seed: 1.7 },
  { id: "rea", character: "never-has-money/reaper", at: REA_A, face: -16, expr: "happy", follow: 0.25, seed: 3.1 },
  { id: "sam", character: "duo/samurai", at: PARK.sam, face: 0, expr: "kind", follow: 0.3, seed: 2.2 },
  { id: "god", character: "potatobrawl/allfather", at: PARK.god, face: 0, expr: "kind", follow: 0.3, seed: 4.4 },
  { id: "dra", character: "potatobrawl/dragon", at: PARK.dra, face: 0, expr: "kind", follow: 0.3, seed: 4.1 },
];
// a cut cheat: who stands where from t on (an instant move just before the cut frame), or off the set
const place = (t, who, at, yaw) => {
  const u = Math.max(0, r3(t - 0.02));
  A(u, who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear" });
  if (yaw != null) A(u, who, "turn", { to: yaw, dur: 0.01 });
  A(u, who, "show");
};
const park = (t, who) => { const u = Math.max(0, r3(t - 0.02)); A(u, who, "hide"); A(u, who, "move", { to: PARK[who], dur: 0.01, steps: 0, ease: "linear" }); };

// ---------------------------------------------------------------- props, each in its place (shown only while its env is up)
const props = [];
const P = (place_, spec) => { props.push({ ...spec, _place: place_ }); return spec; };
const BOX = (id, x, z, w, d, h, o = {}) => ({ id, kind: "cardbox", x, z, w, d, h, closed: true, ...o });
// alley: the crate row in front of the three, the potato bin right of Reaper with its price tag
const ROW_Z = 0.3, ROW_H = 0.5;
P("alley", BOX("crateL", -0.95, ROW_Z, 0.9, 0.5, ROW_H));
P("alley", BOX("crateM", 0, ROW_Z, 0.9, 0.5, ROW_H));
P("alley", BOX("crateR", 0.86, ROW_Z, 0.7, 0.5, ROW_H));
const BIN = { x: 2.05, z: -0.45, w: 1.5, d: 1.0, h: 0.28 };
P("alley", BOX("bin", BIN.x, BIN.z, BIN.w, BIN.d, BIN.h, { closed: false, empty: true }));
P("alley", { id: "tag", kind: "sign", x: BIN.x - 0.3, z: BIN.z + BIN.d / 2 + 0.08, text: "POTATOES 2.99", small: true, rot: 0 });
// street: the shield line's place, the van, the cars
P("street", { id: "van", kind: "citycar", x: 0, z: -3.2, rot: 180, color: "#20263a" });
P("street", { id: "car1", kind: "citycar", x: -3.2, z: -7.5, rot: 60, color: "#20263a" });
P("street", { id: "car2", kind: "citycar", x: 3.2, z: -7.5, rot: -60, color: "#20263a" });
// roof: two blocks and the gap
P("roof", BOX("roofL", -2.3, 0.2, 2.8, 2.0, 1.0));
P("roof", BOX("roofR", 2.3, 0.2, 2.8, 2.0, 1.0));
// beach
P("beach", { id: "lounger", kind: "deckchair", x: 0, z: 0.6, rot: 0 });

// show each prop only while its place is up
for (const p of props) {
  const on0 = placeAt(0) === p._place;
  p._scale = p.scale ?? 1;
  if (!on0) p.scale = 0.001;
  let was = on0;
  for (const [at, name] of PLACES.slice(1)) {
    const on = name === p._place;
    if (on !== was) prop(r3(at - 0.02), p.id, { scale: on ? p._scale : 0.001 }, 0.01, "linear");
    was = on;
  }
}

// ---------------------------------------------------------------- BLOCKING: who is where in each shot (acting comes after the staging proof)
// alley 0-7.6: all three behind the crates
park(0, "sam"); park(0, "god"); park(0, "dra");
// street 8.2-12.0: the shield line (backs to us), Viking through them
place(T.charge, "god", [-0.62, 3.0], 180); place(T.charge, "dra", [0.62, 3.0], 180);
place(T.charge, "vik", [0, -5.5], 0); park(T.charge, "phx"); park(T.charge, "rea");
A(T.charge + 0.1, "vik", "move", { to: [0, 1.6], dur: 0.8, ease: "linear" });
// alley 12.0: Phoenix bolts; Viking is gone
place(T.bolt, "phx", PHX_A, 16); place(T.bolt, "rea", REA_A, -16); park(T.bolt, "vik"); park(T.bolt, "god"); park(T.bolt, "dra");
// roof 12.7-15.5
place(T.roof, "phx", [0, -3], 0); park(T.roof, "rea");
place(T.leap, "phx", [-1.6, 0.6], 90);
// corner 15.5-16.9
place(T.lost, "phx", [0, 1.5], 0);
// street 16.9-19.3: the van, a door each
place(T.van, "phx", [0, 3.5], 180); place(T.van, "god", [-1.6, -2.2], 20); place(T.van, "dra", [1.6, -2.2], -20);
// alley 19.3-28.6: Reaper alone, then Samurai
place(T.alone, "rea", REA_A, -16); park(T.alone, "phx"); park(T.alone, "god"); park(T.alone, "dra");
place(T.lean, "sam", [3.4, 0.2], -60);
// beach
place(T.beach, "rea", [0, 0.6], 0); park(T.beach, "sam");

// ---------------------------------------------------------------- shots
const HOOK = shot("alley", [0, 0.95, 5.4], { tilt: -8, fov: 46 });
const TRIO_CU = shot("alley", [0, 0.85, 4.3], { tilt: -8, fov: 40 });
const ONE = (x, z) => shot("alley", [x, 0.8, z + 3.1], { tilt: -8, fov: 34 });
const STREET_W = shot("street", [0, 1.25, 8.6], { tilt: -6, fov: 46 });
const STREET_M = shot("street", [0, 1.0, 5.6], { tilt: -6, fov: 40 });
const ROOF_RUN = shot("roof", [0, 1.0, 6.0], { tilt: -8, fov: 46 });
const ROOF_LEAP = shot("roof", [0, 0.5, 6.4], { tilt: 6, fov: 50 });
const CORNER = shot("corner", [0, 0.95, 5.2], { tilt: -5, fov: 40 });
const VAN = shot("street", [0, 1.25, 8.6], { tilt: -6, fov: 46 });
const ALONE = shot("alley", [0.9, 0.9, 5.0], { tilt: -8, fov: 44 });
const CRATE = shot("alley", [1.75, 0.85, 3.4], { tilt: -8, fov: 40 });
const BEACH = shot("beach", [0, 0.95, 5.2], { tilt: -6, fov: 42 });
const beats = c.beats([
  ["1 you just robbed a bank", T.hook, HOOK, "hook"],
  ["2 the police are here", T.police, HOOK],
  ["3 three faces", T.faces, TRIO_CU],
  ["4 fight", T.fight, ONE(...VIK_A)],
  ["4 flight", T.flight, ONE(...PHX_A)],
  ["4 freeze", T.freeze, ONE(...REA_A)],
  ["5 only one gets away", T.question, TRIO_CU],
  ["6 the charge", T.charge, STREET_W],
  ["6 fighting works", T.grin, STREET_M],
  ["7 phoenix bolts", T.bolt, HOOK],
  ["7 the rooftops", T.roof, ROOF_RUN],
  ["7 the leap", T.leap, ROOF_LEAP, "escalation"],
  ["7 lost them", T.lost, CORNER],
  ["7 the van", T.van, VAN],
  ["8 the one who did nothing", T.alone, ALONE],
  ["8 in the potatoes", T.crate, CRATE],
  ["9 the beach", T.beach, BEACH, "payoff"],
], END);

for (const p of props) { delete p._place; delete p._scale; }
write(import.meta.url, {
  id: "fff-01-bank-robbery",
  title: "You just robbed a bank. Fight, flight or freeze?",
  idea: "Fight, Flight or Freeze pilot: three friends rob a bank; Viking fights (netted), Phoenix runs (in a circle, into the van), Reaper freezes (tips into a crate of potatoes and gets away)",
  format: "series: Fight, Flight or Freeze (one extreme situation, three instincts, all three outcomes in one video)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [470, 1360],
  cleanStart: true, motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  set: { type: "env", env: ENVS.alley, swap: PLACES.slice(1).map(([at, name]) => ({ at, env: ENVS[name] })), aperture: 0, focus: false, lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  music: { style: "sneaky", lowCut: 150, gain: 0.28 },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, surface: "concrete", room: "street", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["vik", "phx", "rea"], hint: 0, what: "three masked potatoes high-five over open money bags in a back alley, a bank alarm ringing" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [],
  notes: "Generated by storyboards/series/fight-flight-freeze/01-bank-robbery/make-bank-robbery.mjs. Title added in TikTok's text tool.",
});
