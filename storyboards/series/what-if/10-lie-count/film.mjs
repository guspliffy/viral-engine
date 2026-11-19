// "What if you could see how many times everyone has lied to you?" (There's a catch EP10, wide 16:9 YouTube film ~8 min)
// THE CHEAP-FILM TRIAL (Jonny 18 Nov 2026: "lets test it over night"; 8 min films only if they cost fewer tokens per
// minute). The method: ONE kit made once (the happiness-03 town sets, reused as they are), nine shot types computed from
// a place's stage (no per-shot staging), the narrator carrying most of the time, full acting only at the turns.
// This file is the kit + the whole film as data; make-film.mjs writes one storyboard per place run.
//
// PLACES: real 3D sets from Happiness 03 (engine/page/set-score-*.js), no new design. A place = set spec + a stage: an
// open floor centre c [x, z], the camera's look yaw (deg, 0 = +z) that shows the place's good side, floor y, and limits.
import { RIVER as RV } from "../../../../engine/page/set-score-river.js";
import { frame } from "../../../lib/clip.mjs";

export const r3 = (x) => Math.round(x * 1000) / 1000;
const rad = (d) => (d * Math.PI) / 180;
export const yawTo = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);

export const F = { key: "wide", sb: { frame: "wide" }, W: 1920, H: 1080, SUB: 128, CARD: 880 };

const BZ = RV.bridge.z;
export const PLACES = {
  terrace: { set: { type: "scorebakery", rain: false, light: "golden", key: [-5.5, 3.6, 4.5], shadowSize: 9, windows: false }, c: [-1.5, 1.0], yaw: 155, wideH: 3.0, surface: "stone", room: "open", nature: ["birds"] },
  counter: { set: { type: "scorebakery", rain: false, light: "golden", key: [-5.5, 3.6, 4.5], shadowSize: 9, windows: false }, c: [3.0, -1.0], yaw: 180, wideH: 1.8, surface: "wood", room: "small" },
  rain: { set: { type: "scorebakery", rain: true, light: "dusk-rain", shadowSize: 9, windows: false }, c: [-1.5, 1.0], yaw: 155, wideH: 3.0, surface: "stone", room: "open", nature: ["wind"] },
  street: { set: { type: "scorestreet", light: "golden", key: [6.5, 3.4, 3.0], shadowSize: 9, windows: false }, c: [1.0, 1.2], yaw: 180, wideH: 3.0, surface: "stone", room: "open", nature: ["birds", "leaves"] },
  river: { set: { type: "scoreriver", view: "path", light: "golden", key: [3.5, 5, 4.5], shadowSize: 12, windows: false }, c: [1.5, -0.6], yaw: 172, wideH: 2.6, surface: "stone", room: "open", nature: ["stream", "birds"] },
  bridge: { set: { type: "scoreriver", view: "bridge", light: "golden", key: [3.5, 5, 4.5], shadowSize: 12, windows: false }, c: [18, BZ], yaw: -90, wideH: 2.8, deck: true, surface: "stone", room: "open", nature: ["stream"] },
  room: { set: { type: "scoreroom", state: "party", light: "golden", key: [-1.5, 2.2, 4.0], shadowSize: 5, windows: false }, c: [-0.6, -0.5], yaw: 180, wideH: 2.0, surface: "wood", room: "small" },
  balcony: { set: { type: "scorebalcony", night: true, key: [-3, 4, 3], shadowSize: 8 }, c: [0.9, 1.5], yaw: 190, wideH: 2.2, surface: "stone", room: "open", nature: ["wind"] },
  hill: { set: { type: "scorehill", time: "sunset", light: "golden", key: [-2.2, 1.6, -4.6], shadowSize: 9, windows: false }, c: [0.2, -2.3], yaw: 180, wideH: 2.6, surface: "grass", room: "open", nature: ["birds", "leaves"] },
};
export const floorY = (P, x) => (P.deck ? r3(RV.deckY(x)) : 0);

// ---------------------------------------------------------------- cast (Happiness 03 ids; extras = happiness/*)
export const CAST = {
  spud: "potatobrawl/spud", mash: "potatobrawl/mash", chip: "potatobrawl/chip", wedge: "potatobrawl/wedge",
  baker: "happiness/baker", mover: "happiness/mover", driver: "happiness/driver",
};
// THE NUMBER: how many times this person has lied to you (story time keys). Start values; ticks are added by the film.
export const START = { mash: 211, chip: 37, wedge: 0, baker: 3, mover: 1, driver: 0 };

// ---------------------------------------------------------------- the stage frame of a place
// f = the camera's look direction, r = screen right. A local spot [lx, lz] = c + r*lx + f*lz (lz > 0 = deeper).
export function stage(P) {
  const f = [Math.sin(rad(P.yaw)), Math.cos(rad(P.yaw))], r = [-f[1], f[0]];
  const w = ([lx, lz]) => [r3(P.c[0] + r[0] * lx + f[0] * lz), r3(P.c[1] + r[1] * lx + f[1] * lz)];
  return { f, r, w, camYaw: P.yaw, facing: r3(P.yaw + 180) };
}

// ---------------------------------------------------------------- the nine shot types (all from the stage, nothing hand-placed)
// pos(id) -> [x, z] world, y(id) floor y; face height 0.55 above the floor (a potato is ~0.9 m)
const HEADS = { spud: 0.53, mash: 0.76, chip: 0.34, wedge: 0.6, baker: 0.58, mover: 0.58, driver: 0.58 };   // face height (~0.6 x body height)
export function shotOf(P, spec, pos, len) {
  const S = stage(P), az0 = S.facing, t = (id) => { const [x, z] = pos(id); return [x, floorY(P, x) + (HEADS[id] ?? 0.55), z]; };
  const toward = (a, b, k) => a + (((b - a + 540) % 360) - 180) * k;
  const mid = (ids) => { const ps = ids.map(t); return [0, 1, 2].map((i) => r3(ps.reduce((s, p) => s + p[i], 0) / ps.length)); };
  const push = spec.push ?? 0.05, dur = r3(Math.max(0.5, len));
  const o = (target, a) => frame(target, { az: a.az ?? az0, el: a.el ?? 4, h: a.h, fov: a.fov ?? 36, push, dur });
  switch (spec.t) {
    case "wide": return o(mid(spec.who ?? []).map((v, i) => (spec.who ? v : [P.c[0], floorY(P, P.c[0]) + 0.5, P.c[1]][i])), { h: spec.h ?? P.wideH, el: spec.el ?? 7, fov: 40, az: az0 + (spec.az ?? 0) });
    case "two": case "group": {
      const ids = spec.who, ps = ids.map(pos), spread = Math.max(...ps.map((p) => Math.hypot(p[0] - ps[0][0], p[1] - ps[0][1])));
      return o(mid(ids), { h: spec.h ?? Math.max(1.5, spread + 1.0), el: 5, fov: 36, az: az0 + (spec.az ?? 0) });
    }
    case "close": { const [who] = spec.who; return o(t(who), { h: spec.h ?? 0.8, el: spec.el ?? 3, fov: 30, az: toward(az0, spec.face ?? az0, 0.4) + (spec.az ?? 0) }); }   // between the front and his face: the partner stays out of the lens
    case "ots": {   // over fg's shoulder onto bg's face
      const [fg, bg] = spec.who, a = yawTo(pos(bg), pos(fg));
      return o(t(bg), { h: spec.h ?? 1.5, el: 6, fov: 32, az: a + (spec.az ?? 30) });
    }
    case "alone": { const [who] = spec.who; return { ...o(t(who), { h: spec.h ?? 3.6, el: 14, fov: 40, az: az0 + (spec.az ?? 0) }), ...(push > 0 ? {} : {}) }; }
    case "insert": return o(spec.at, { h: spec.h ?? 0.5, el: 30, fov: 30, az: az0 + (spec.az ?? 8) });
    default: throw new Error(`no shot type ${spec.t}`);
  }
}

// ---------------------------------------------------------------- voices + music
export const NARRATOR = "narrator";   // voice 1 "deep storyteller" (Jonny's pick for voiceovers), dry
export const WPS = 0.45;              // voice 1 reads ~0.45 s a word (story.md); measured lengths replace it (lines.json)
export const SCORE = (T0) => ({ file: "score-film/lies-score.ogg", from: 0, skip: r3(T0), seam: true, gain: 0.5, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false });
export const LEVEL = -9.7;

// ================================================================= THE FILM (story, as data)
// Opener A (the count is already running at frame 0). Hook: statement on screen "212" + the narrator's question; caption
// question "Why has his best friend lied to him 212 times?"; the ending releases it (every lie was for him).
// Layout: who -> [lx, lz, face] (face: "cam", a yaw offset from facing the camera, or ["to", id]).
// seq items: ["n", text] narrator · ["s", who, text, tone, { lie, expr }] a line (gibberish, captioned) · ["cut", shot]
// · ["card", text, dur] · ["wait", s] · ["e", who, expr, set] · ["walk", who, [lx, lz], dur] · ["arm", who, side, pose]
// · ["show", who, [lx, lz, face]] · ["hide", who] · ["sfx", id, o] · ["tick", who] · ["bite", id, amount] · ["spudtag"]
// Feelings per act: curiosity/fun -> glee -> suspicion -> unease -> suspense/anger -> loneliness -> confusion -> warmth -> laugh/warmth.
export const ACTS = [
  { key: "hook", mood: "playful" }, { key: "use", mood: "playful" }, { key: "catch", mood: "unease" }, { key: "friday", mood: "suspense" },
  { key: "fight", mood: "drama" }, { key: "alone", mood: "sad" }, { key: "birthday", mood: "unease2" }, { key: "party", mood: "warm" }, { key: "end", mood: "calm" },
];

export const SCENES = [
  // ---------------------------------------------------------------- ACT 1: THE HOOK + THE RULES (curiosity, fun)
  { id: "01 delicious", act: "hook", place: "terrace", layout: { spud: [-0.5, 0, ["to", "mash"]], mash: [0.5, 0, ["to", "spud"]] }, table: true,
    shot: { t: "two", who: ["spud", "mash"] }, seq: [
      ["e", "mash", "happy", { curve: 0.5 }], ["s", "mash", "mm-mm!", "excited"], ["bite", "bun", 0.35],
      ["s", "mash", "delicious!", "excited", { lie: true }], ["card", "212", 2.6],
      ["n", "What if you could see how many times everyone has lied to you?"],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "focused", { brow: 0.3 }],
      ["n", "Your best friend just hit two hundred and twelve."],
      ["cut", { t: "two", who: ["spud", "mash"], az: -8 }], ["bite", "bun", 0.55], ["e", "mash", "happy", { curve: 0.6 }],
      ["n", "All about your cinnamon buns."], ["wait", 0.6] ] },
  { id: "02 the morning", act: "hook", place: "terrace", layout: { spud: [-0.5, 0, ["to", "mash"]], mash: [0.5, 0, ["to", "spud"]], baker: [1.6, 1.0, "cam"] }, table: true,
    shot: { t: "wide" }, seq: [
      ["n", "It started this morning. Everyone had a number over their head."], ["n", "And only you could see them."],
      ["cut", { t: "close", who: ["baker"] }], ["s", "baker", "fresh today!", "excited", { lie: true }],
      ["n", "The baker. Four. All of them about bread."], ["wait", 0.4] ] },
  { id: "03 strangers", act: "hook", place: "street", layout: { spud: [-1.2, 0.3, 30], mover: [1.6, -0.2, -60] },
    shot: { t: "wide" }, seq: [
      ["walk", "mover", [-0.4, 0.4], 4.0], ["s", "mover", "not heavy at all!", "calm", { lie: true }],
      ["n", "Strangers had small numbers. They hadn't had the time."], ["wait", 0.5] ] },
  { id: "04 the loud one", act: "hook", place: "street", layout: { spud: [-0.45, 0, ["to", "chip"]], chip: [2.4, 0.4, ["to", "spud"]] },
    shot: { t: "wide", who: ["spud"] }, seq: [
      ["walk", "chip", [0.5, 0], 1.0], ["wait", 1.0], ["cut", { t: "two", who: ["spud", "chip"] }], ["e", "chip", "eager"],
      ["s", "chip", "sorry! the bus was late!", "excited", { lie: true }],
      ["n", "Your loudest friend. Thirty-eight."], ["cut", { t: "wide", who: ["spud", "chip"] }], ["wait", 0.4],
      ["n", "There is no bus."], ["wait", 0.8] ] },
  { id: "05 trust me", act: "hook", place: "street", layout: { spud: [-0.45, 0, ["to", "wedge"]], chip: [0.95, 0.5, ["to", "spud"]], wedge: [0.5, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "wedge"] }, seq: [
      ["e", "wedge", "cocky"], ["s", "wedge", "trust me. it's going to rain on friday.", "calm"], ["card", "0", 2.4],
      ["n", "And the friend who says 'trust me' twenty times a day..."], ["cut", { t: "close", who: ["wedge"] }], ["n", "Zero. Not once. Not ever."],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "shocked", { open: 0.2 }], ["wait", 0.6] ] },
  { id: "05b your own head", act: "hook", place: "street", layout: { spud: [-0.45, 0, 15], chip: [0.95, 0.5, ["to", "spud"]], wedge: [0.5, 0, ["to", "spud"]] },
    shot: { t: "close", who: ["spud"] }, seq: [
      ["n", "And over your own head?"], ["e", "spud", "focused"], ["wait", 0.8], ["n", "Nothing. Apparently, you were the only honest one in town."], ["e", "spud", "smug"], ["wait", 1.0] ] },
  { id: "06 why 212", act: "hook", place: "terrace", layout: { spud: [-1.0, -0.3, 10], mash: [0.7, 1.4, ["to", "spud"]] }, table: true,
    shot: { t: "ots", who: ["spud", "mash"] }, seq: [
      ["n", "Strangers, single digits. The baker, four. The loud one, thirty-eight."],
      ["cut", { t: "close", who: ["mash"] }], ["n", "So why was your best friend at two hundred and twelve?"], ["wait", 1.0] ] },

  // ---------------------------------------------------------------- ACT 2: USING IT (glee)
  { id: "07 fresh today", act: "use", place: "counter", layout: { spud: [0, -0.7, 0], baker: [0, 0.7, "cam"] }, baker: true,
    shot: { t: "ots", who: ["spud", "baker"] }, seq: [
      ["n", "At first, it was the best power in the world."],
      ["s", "baker", "all baked this morning!", "excited", { lie: true }], ["arm", "spud", "R", "point"], ["e", "spud", "smug"],
      ["cut", { t: "close", who: ["baker"], face: 0, az: 25, el: 14 }], ["e", "baker", "annoyed"], ["s", "baker", "...half price.", "sad"],
      ["n", "Nobody could fool you."], ["arm", "spud", "R", "rest"], ["wait", 0.5] ] },
  { id: "08 the fries", act: "use", place: "street", layout: { spud: [-0.45, 0, ["to", "chip"]], chip: [0.45, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "chip"] }, seq: [
      ["s", "spud", "who ate my fries?", "question"], ["e", "chip", "eager"], ["s", "chip", "not me!", "excited", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "stern"], ["wait", 1.2],
      ["cut", { t: "two", who: ["spud", "chip"] }], ["e", "chip", "sad"], ["s", "chip", "...it was me.", "sad"],
      ["n", "Not about bread. Not about fries. Not about anything."], ["wait", 0.5] ] },
  { id: "09 game night", act: "use", place: "room", layout: { spud: [-0.8, 0.2, ["to", "chip"]], chip: [0.8, 0.2, ["to", "spud"]], wedge: [0, 0.95, "cam"] },
    shot: { t: "group", who: ["spud", "chip", "wedge"] }, seq: [
      ["n", "Game night. Your friends bluffed."],
      ["e", "chip", "smug"], ["s", "chip", "i've got nothing good. promise.", "calm", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "smug"], ["s", "spud", "you've got four aces.", "calm"],
      ["cut", { t: "group", who: ["spud", "chip", "wedge"] }], ["e", "chip", "shocked", { open: 0.3 }],
      ["n", "You won every game that night."], ["n", "It was the last game night they invited you to."], ["wait", 0.6] ] },
  { id: "10 busy friday", act: "use", place: "river", layout: { spud: [-0.4, 0, ["to", "mash"]], mash: [0.4, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "mash"] }, seq: [
      ["e", "spud", "happy"], ["s", "spud", "movie on friday?", "question"],
      ["e", "mash", "kind"], ["s", "mash", "can't. i'm busy.", "calm", { lie: true }], ["card", "213", 2.2],
      ["cut", { t: "close", who: ["spud"] }], ["n", "Two hundred and thirteen."], ["e", "spud", "sad"],
      ["n", "Busy. Every Friday. For a whole year."],
      ["cut", { t: "two", who: ["spud", "mash"] }], ["n", "You had never asked what he did on Fridays."], ["n", "Now you had a number."], ["wait", 0.6] ] },

  // ---------------------------------------------------------------- ACT 3: BUT THERE'S A CATCH (unease, the laugh at the low point)
  { id: "11 the catch", act: "catch", place: "bridge", layout: { spud: [0, 0, "cam"] },
    shot: { t: "alone", who: ["spud"] }, seq: [
      ["n", "But there's a catch."], ["wait", 1.5], ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "focused"],
      ["n", "It tells you how many."], ["n", "Never why."], ["card", "WHY?", 2.0], ["wait", 1.2] ] },
  { id: "12 nice sweater", act: "catch", place: "street", layout: { spud: [-0.45, 0, ["to", "chip"]], chip: [0.45, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "chip"] }, seq: [
      ["e", "chip", "happy"], ["s", "chip", "nice sweater!", "excited", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "sad"], ["wait", 0.6], ["n", "Every compliment came with a number."], ["wait", 0.4] ] },
  { id: "13 nice day", act: "catch", place: "counter", layout: { spud: [0, -0.7, 0], baker: [0, 0.7, "cam"] }, baker: true,
    shot: { t: "ots", who: ["spud", "baker"] }, seq: [
      ["e", "baker", "happy"], ["s", "baker", "have a lovely day!", "calm", { lie: true }],
      ["n", "Every smile."], ["wait", 0.5] ] },
  { id: "14 do you like them", act: "catch", place: "river", layout: { spud: [-0.4, 0, ["to", "mash"]], mash: [0.4, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "mash"] }, seq: [
      ["n", "So you tested your best friend."],
      ["s", "spud", "do you actually like my buns?", "question"], ["e", "mash", "happy"], ["s", "mash", "love them.", "calm", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "sad"], ["n", "Two hundred and fourteen."], ["wait", 0.8] ] },
  { id: "14b asked around", act: "catch", place: "river", layout: { spud: [-0.4, 0, ["to", "chip"]], chip: [0.4, 0, ["to", "spud"]], wedge: [1.3, 0.6, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "chip"] }, seq: [
      ["n", "So you asked around."], ["s", "spud", "why does he lie to me so much?", "question"],
      ["e", "chip", "shocked", { open: 0.2 }], ["s", "chip", "him? he never lies!", "excited", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "stern"], ["n", "Even your friends were lying about him."], ["wait", 0.6],
      ["cut", { t: "two", who: ["spud", "wedge"] }], ["s", "spud", "does he lie to me?", "question"], ["e", "wedge", "deadpan"], ["s", "wedge", "trust me. ask him yourself.", "calm"],
      ["n", "The only straight answer in town."], ["wait", 0.8] ] },
  { id: "15 are you lying", act: "catch", place: "street", layout: { spud: [-0.6, 0, ["to", "chip"]], chip: [0.4, 0, ["to", "spud"]], wedge: [1.2, 0.4, ["to", "spud"]] },
    shot: { t: "group", who: ["spud", "chip", "wedge"] }, seq: [
      ["n", "And you couldn't stop asking."],
      ["s", "spud", "are you lying right now?", "question"], ["e", "chip", "annoyed"], ["s", "chip", "no!", "excited"],
      ["s", "spud", "and now?", "question"], ["s", "chip", "...no!", "excited"],
      ["e", "chip", "angry"], ["walk", "chip", [3.0, 0.6], 2.2], ["wait", 2.0], ["hide", "chip"],
      ["cut", { t: "two", who: ["spud", "wedge"] }], ["e", "wedge", "deadpan"], ["s", "wedge", "trust me. that was weird.", "calm"],
      ["n", "Even he agreed. And he doesn't lie."], ["wait", 0.5] ] },
  { id: "16 fewer lies", act: "catch", place: "bridge", layout: { spud: [0, 0, 20] },
    shot: { t: "alone", who: ["spud"], push: -0.04 }, seq: [
      ["n", "One by one, people stopped talking to you."], ["wait", 0.6],
      ["n", "Which, technically, meant fewer lies."], ["wait", 1.0] ] },

  // ---------------------------------------------------------------- ACT 4: FRIDAY (suspense)
  { id: "17 you followed him", act: "friday", place: "rain", layout: { spud: [-1.4, -0.3, 20], mash: [-0.9, 1.2, 120] },
    shot: { t: "wide" }, seq: [
      ["n", "So on Friday, you followed him."], ["walk", "mash", [0.4, 2.0], 4.0], ["wait", 1.6],
      ["n", "The bakery. After closing time."], ["wait", 0.6], ["hide", "mash"], ["sfx", "knock-tap", { gain: 0.4 }], ["wait", 0.8] ] },
  { id: "18 told you", act: "friday", place: "rain", layout: { spud: [-0.3, 0, 25], wedge: [-1.35, -0.25, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "wedge"] }, seq: [
      ["e", "wedge", "deadpan"], ["s", "wedge", "told you. rain.", "calm"],
      ["n", "He was right about the rain. He's always right."], ["wait", 0.6] ] },
  { id: "18b one hour", act: "friday", place: "rain", layout: { spud: [-0.6, -0.2, 20] },
    shot: { t: "alone", who: ["spud"], h: 3.2 }, seq: [
      ["n", "You waited an hour in the rain."], ["wait", 0.8], ["n", "He didn't come out."], ["wait", 1.2] ] },
  { id: "19 fogged windows", act: "friday", place: "rain", layout: { spud: [0.2, -1.0, 0] },
    shot: { t: "close", who: ["spud"] }, seq: [
      ["n", "The windows were fogged. Just shadows... and somebody laughing."], ["e", "spud", "angry", { brow: 0.5 }],
      ["n", "Laughing. While you stood in the rain."], ["wait", 0.6], ["n", "That was enough."], ["wait", 1.0] ] },
  // ---------------------------------------------------------------- ACT 4b: THE FIGHT (anger, regret)
  { id: "20 where were you", act: "fight", place: "bridge", layout: { spud: [0.45, 0, ["to", "mash"]], mash: [-0.45, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "mash"] }, seq: [
      ["n", "Saturday."], ["e", "spud", "stern"], ["s", "spud", "where were you last night?", "question"],
      ["e", "mash", "kind"], ["s", "mash", "home. sleeping.", "calm", { lie: true }], ["card", "215", 2.2],
      ["cut", { t: "ots", who: ["mash", "spud"] }], ["e", "spud", "angry"], ["s", "spud", "two hundred and fifteen!", "excited"],
      ["cut", { t: "ots", who: ["spud", "mash"] }], ["e", "mash", "shocked"], ["s", "mash", "what?", "question"],
      ["cut", { t: "ots", who: ["mash", "spud"] }], ["s", "spud", "i can see it! every single lie!", "excited"],
      ["cut", { t: "close", who: ["mash"] }], ["e", "mash", "sad"], ["wait", 1.6], ["s", "mash", "...okay.", "sad"],
      ["cut", { t: "two", who: ["spud", "mash"], h: 2.4 }], ["walk", "mash", [-3.4, 0.2], 4.5], ["wait", 1.2],
      ["n", "He didn't even try to explain."], ["wait", 1.8], ["hide", "mash"] ] },
  { id: "21 right about the number", act: "fight", place: "bridge", layout: { spud: [0.45, 0, -40] },
    shot: { t: "alone", who: ["spud"], push: -0.04 }, seq: [
      ["n", "You were right about the number."], ["wait", 1.5] ] },

  // ---------------------------------------------------------------- ACT 5: ALONE (loneliness, the laugh, a first doubt)
  { id: "22 nobody called", act: "alone", place: "balcony", layout: { spud: [0, 0, -10] }, plate: true,
    shot: { t: "alone", who: ["spud"], h: 2.4 }, seq: [
      ["n", "That night, nobody called."], ["wait", 0.8], ["n", "So you ate your cinnamon buns. Alone."],
      ["cut", { t: "close", who: ["spud"] }], ["bite", "bun", 0.3], ["wait", 0.6], ["e", "spud", "shocked", { open: 0.1, brow: 0.4 }], ["wait", 1.0],
      ["n", "They were... terrible."], ["wait", 0.6], ["n", "They had always been terrible."], ["wait", 0.6] ] },
  { id: "23 every week", act: "alone", place: "balcony", layout: { spud: [0, 0, -10] }, plate: true,
    shot: { t: "close", who: ["spud"], az: -14 }, seq: [
      ["e", "spud", "sad"], ["n", "Every week, he said they were delicious."], ["n", "And every week, you baked them again."],
      ["n", "You tried to remember his lies. Two hundred and fifteen. You could only think of a few."], ["n", "And every one of them came with a smile."], ["wait", 0.8],
      ["cut", { t: "alone", who: ["spud"], h: 3.0, push: -0.03 }], ["n", "Maybe some lies weren't against you."], ["wait", 1.8] ] },

  // ---------------------------------------------------------------- ACT 6: THE BIRTHDAY (the second question at ~70 %: confusion, hurt)
  { id: "24 your birthday", act: "birthday", place: "street", layout: { spud: [-0.2, 0.1, "cam"], baker: [-2.6, 0.5, 90] },
    shot: { t: "wide" }, seq: [
      ["n", "Sunday. Your birthday."], ["e", "spud", "happy", { curve: 0.4 }],
      ["walk", "baker", [-0.9, 0.5], 2.6], ["wait", 2.2], ["s", "baker", "morning!", "calm"], ["walk", "baker", [3.4, 0.8], 4.0],
      ["n", "Nobody said a word about it."], ["wait", 1.8], ["hide", "baker"] ] },
  { id: "25 just sunday", act: "birthday", place: "street", layout: { spud: [-0.45, 0, ["to", "chip"]], chip: [0.45, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "chip"] }, seq: [
      ["e", "spud", "happy"], ["s", "spud", "guess what day it is!", "excited"], ["e", "chip", "focused"],
      ["s", "chip", "uh... sunday?", "question"], ["s", "spud", "and?", "question"], ["s", "chip", "just sunday!", "excited", { lie: true }],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "sad"],
      ["n", "And then, the whole town started lying."], ["wait", 0.4] ] },
  { id: "26 no idea", act: "birthday", place: "street", layout: { spud: [-0.5, 0, ["to", "mover"]], mover: [0.5, 0.1, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "mover"] }, seq: [
      ["s", "mover", "no idea what day it is, mate.", "calm", { lie: true }],
      ["n", "About the same thing."], ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "sad", { brow: 0.4 }],
      ["n", "Either the whole town forgot your birthday..."], ["n", "...or the whole town was lying about it."], ["wait", 1.0] ] },
  { id: "26b stop counting", act: "birthday", place: "bridge", layout: { spud: [0.3, 0, -30] },
    shot: { t: "alone", who: ["spud"], push: -0.03 }, seq: [
      ["n", "You stood on the bridge where he'd walked away."], ["wait", 0.6],
      ["cut", { t: "close", who: ["spud"] }], ["n", "Two hundred and fifteen. You had counted every one."], ["n", "And you still didn't know a single why."], ["wait", 1.2] ] },

  // ---------------------------------------------------------------- ACT 7: THE PAYOFF (trust, surprise, warmth)
  { id: "27 come with me", act: "party", place: "street", layout: { spud: [-0.45, 0, ["to", "wedge"]], wedge: [0.45, 0, ["to", "spud"]] },
    shot: { t: "two", who: ["spud", "wedge"] }, seq: [
      ["e", "wedge", "kind"], ["s", "wedge", "trust me. come with me.", "calm"],
      ["n", "Only one friend still had a zero."], ["cut", { t: "close", who: ["spud"] }], ["n", "So, for the first time, you trusted him."],
      ["cut", { t: "wide", who: ["spud", "wedge"] }], ["walk", "wedge", [3.6, 0.4], 3.2], ["walk", "spud", [2.8, 0.3], 3.4], ["wait", 2.6] ] },
  { id: "28 surprise", act: "party", place: "room", layout: { spud: [0.2, -1.1, 180], mash: [-0.1, 0.4, "cam"], chip: [-1.1, 0.2, "cam"], baker: [0.9, 0.3, "cam"], wedge: [1.1, -1.2, ["to", "spud"]] }, party: true,
    shot: { t: "wide", h: 2.2 }, seq: [
      ["s", "chip", "surprise!", "excited"], ["e", "mash", "happy", { curve: 0.6 }], ["e", "chip", "delighted"], ["e", "baker", "happy"], ["sfx", "pop", { gain: 0.5 }],
      ["wait", 1.2], ["cut", { t: "ots", who: ["mash", "spud"], h: 1.2 }], ["e", "spud", "shocked", { open: 0.3 }], ["wait", 1.4],
      ["n", "Your best friend. The baker. The loud one. Everyone."], ["wait", 0.6] ] },
  { id: "29 fridays", act: "party", place: "room", layout: { spud: [0.45, 0.4, ["to", "mash"]], mash: [-0.45, 0.3, ["to", "spud"]], chip: [-1.4, -0.2, "cam"], baker: [1.3, -0.2, "cam"] }, party: true,
    shot: { t: "two", who: ["spud", "mash"] }, seq: [
      ["e", "mash", "kind"], ["s", "mash", "every friday. here. learning to bake.", "calm"], ["s", "mash", "your buns. but... a cake.", "calm"],
      ["cut", { t: "close", who: ["spud"] }], ["e", "spud", "sad", { curve: 0.2 }],
      ["n", "Every 'I'm busy'. Every 'I'm sleeping'."], ["n", "Two hundred and fifteen lies."],
      ["cut", { t: "close", who: ["mash"] }], ["n", "And every single one of them... was for you."], ["wait", 1.4] ] },
  { id: "29b confessions", act: "party", place: "room", layout: { spud: [0.45, 0.4, ["to", "chip"]], mash: [-0.45, 0.3, ["to", "spud"]], chip: [-1.3, -0.1, ["to", "spud"]], baker: [1.3, -0.2, ["to", "spud"]], wedge: [1.1, 0.9, ["to", "spud"]], mover: [2.0, 0.2, ["to", "spud"]] }, party: true,
    shot: { t: "close", who: ["chip"] }, seq: [
      ["e", "chip", "eager"], ["s", "chip", "the bus! i was buying your present!", "excited"],
      ["cut", { t: "close", who: ["baker"] }], ["e", "baker", "kind"], ["s", "baker", "the buns weren't fresh. i kept the fresh ones for your cake.", "calm"],
      ["cut", { t: "close", who: ["mover"] }], ["s", "mover", "the box was heavy. it was your present.", "calm"],
      ["cut", { t: "group", who: ["spud", "mash", "chip"] }], ["n", "Every number in town had a reason."], ["n", "You'd just never asked."], ["wait", 0.8] ] },

  // ---------------------------------------------------------------- ACT 8: THE CHOICE (laugh, warmth) + the last picture
  { id: "30 the cake", act: "end", place: "room", layout: { spud: [0.45, 0.4, ["to", "mash"]], mash: [-0.45, 0.3, ["to", "spud"]], wedge: [1.3, 0.9, ["to", "spud"]] }, party: true,
    shot: { t: "close", who: ["spud"] }, seq: [
      ["n", "Then you tasted his cake."], ["wait", 1.0], ["e", "spud", "shocked", { open: 0.1, brow: 0.5 }], ["wait", 1.0],
      ["n", "It was terrible."], ["wait", 0.5],
      ["cut", { t: "close", who: ["wedge"] }], ["e", "wedge", "deadpan"], ["wait", 1.4],
      ["cut", { t: "close", who: ["mash"] }], ["e", "mash", "eager"], ["s", "mash", "well?", "question"],
      ["cut", { t: "close", who: ["spud"] }], ["wait", 1.2], ["e", "spud", "happy", { curve: 0.6 }], ["s", "spud", "it's delicious.", "calm"], ["spudtag"],
      ["wait", 0.6], ["n", "And for the first time... you lied too."], ["wait", 0.8],
      ["cut", { t: "two", who: ["spud", "mash"] }], ["e", "mash", "delighted"], ["s", "mash", "really?", "question"], ["cut", { t: "close", who: ["spud"] }], ["s", "spud", "really.", "calm"], ["spudtag"], ["wait", 0.8],
      ["n", "Twice."], ["wait", 1.5] ] },
  { id: "31 the sunset", act: "end", place: "hill", layout: { chip: [-1.2, 0, 180], spud: [-0.4, 0, 180], mash: [0.4, 0, 180], wedge: [1.2, 0, 180] },
    shot: { t: "wide", h: 2.6 }, seq: [
      ["wait", 2.0], ["n", "Two hundred and fifteen to two."], ["wait", 1.2],
      ["s", "wedge", "trust me. the cake is terrible.", "calm"], ["e", "mash", "happy", { curve: 0.6 }], ["wait", 1.4],
      ["s", "chip", "next year, i bake!", "excited"], ["e", "wedge", "deadpan"], ["s", "wedge", "trust me. please don't.", "calm"], ["wait", 1.0],
      ["n", "You've got some catching up to do."], ["wait", 3.5] ] },
];
