// Fact story 01: "How did one thief make the Mona Lisa famous?" (vertical, ~70 s). Jonny's formula (19 Nov 2026): one
// interesting fact, a story people didn't know, simple characters, fast pacing, constant visual movement. Fact, hook,
// ending and the 10-beat story were each settled with him in the thread "Make interesting fact story video" (STORY.md).
// The method is the cheap-film kit (what-if/10-lie-count): the whole film is data here, the shots are computed from each
// place's stage, make-film.mjs writes one storyboard per run of scenes in one place. Facts: STORY.md (sources).
import { frame } from "../../../lib/clip.mjs";

export const r3 = (x) => Math.round(x * 1000) / 1000;
const rad = (d) => (d * Math.PI) / 180;
export const yawTo = (a, b) => r3((Math.atan2(b[0] - a[0], b[1] - a[1]) * 180) / Math.PI);

// tall 9:16; captions in the upper third (story.md), the hook question above them
export const F = { W: 1080, H: 1920, SUB: 470, CARD: 175, ASPECT: 9 / 16 };

// ---------------------------------------------------------------- places
// gallery: the museum hall (props-museum.js museumhall, the There's a catch EP05 hall) on a plain set, its right wall
// (x +6) hung with paintings; the Mona Lisa at z 0. The stage looks at that wall (+x).
const WALLX = 5.96;
export const ML = { x: WALLX, y: 0.62, z: 0, rot: -90, h: 0.5 };   // bottom of the panel 0.62 up (centre 0.87)
const GALLERY_SET = { type: "plain", color: "#9fcdf0", floor: "#d9cfc0", light: "golden", para: 0, bloom: "emissive" };
const ART = [[-1.25, 0.95, 0.62, 0.48, "hills"], [1.25, 0.95, 0.62, 0.48, "sea"], [-2.6, 1.25, 0.95, 0.75, "forest"], [2.6, 1.25, 0.95, 0.75, "hills"], [-4.1, 1.0, 0.7, 0.55, "sea"], [4.1, 1.0, 0.7, 0.55, "forest"]];
const galleryProps = () => [
  { id: "hall", kind: "museumhall", x: 0, y: 0, z: 0 },
  ...ART.map(([z, y, w, h, scene], i) => ({ id: `art${i}`, kind: "wallart", x: WALLX + 0.01, y, z, rot: -90, w, h, scene, frame: "#8a6a2e" })),
];
export const PLACES = {
  gallery: { set: GALLERY_SET, props: galleryProps, c: [4.3, 0], yaw: 90, wideH: 3.4, surface: "stone", room: "large" },
  corridor: { set: { type: "nighthall", night: true }, c: [0, 2.2], yaw: 180, wideH: 2.8, surface: "wood", room: "small",
    props: () => [
      { id: "door", kind: "nightdoor", x: -1.45, z: -0.7, rot: 91, angle: -100 },   // closed in the doorway, swings out into the night (rot -89 stood beside the doorway and swung into the wall: Sol r3 #16 pop)
      { id: "closet", kind: "momdoor", x: 1.39, z: 1.0, rot: -90, w: 0.85 },
    ] },
  street: { set: { type: "scorestreet", light: "golden", key: [6.5, 3.4, 3.0], shadowSize: 9, windows: false }, c: [1.0, 1.2], yaw: 180, wideH: 3.2, surface: "stone", room: "open", nature: ["birds"] },
  room: { set: { type: "scoreroom", state: "sunday", light: "golden", key: [-1.5, 2.2, 4.0], shadowSize: 5, windows: false }, c: [-0.6, -0.5], yaw: 180, wideH: 2.4, surface: "wood", room: "small",
    props: () => [{ id: "pad", kind: "daypad", x: -0.6, y: 1.25, z: -2.47, rot: 0, count: 1 }] },
  shop: { set: { type: "boutique", twin: 0 }, c: [0.3, 0.4], yaw: 180, wideH: 2.6, surface: "wood", room: "small" },
};

// ---------------------------------------------------------------- cast
export const CAST = {
  thief: "facts/thief", g1: "facts/guard", g2: "facts/guard", painter: "facts/painter", plumber: "facts/plumber",
  insp: "facts/inspector", picasso: "facts/picasso", dealer: "potatobrawl/carseller",
  v1: "potatobrawl/duchess", v2: "potatobrawl/dauphin", v3: "potatobrawl/agent", v4: "potatobrawl/tot", v5: "potatobrawl/assistant",
  spud: "potatobrawl/spud", chip: "potatobrawl/chip", wedge: "potatobrawl/wedge", mash: "potatobrawl/mash",
};
// worn caps (props-score-small.js flatcap fits, props-heist.js policecap)
export const WEAR = {
  thief: { kind: "flatcap", y: 1.0, z: 0.02, r: 0.19 }, painter: { kind: "flatcap", y: 0.95, z: 0.02, r: 0.18 },
  plumber: { kind: "flatcap", y: 0.97, z: 0.02, r: 0.19 },   // props-spree.js flatcap (it wins the registry): origin = the band's bottom, body frame
  g1: { kind: "policecap", y: 1.02, z: 0.02, r: 0.19, badge: false }, g2: { kind: "policecap", y: 1.02, z: 0.02, r: 0.19, badge: false },
};
export const HEADS = { thief: 0.62, g1: 0.62, g2: 0.62, painter: 0.6, plumber: 0.6, insp: 0.55, picasso: 0.58, dealer: 0.55, spud: 0.55, chip: 0.36, wedge: 0.62, mash: 0.78 };

// ---------------------------------------------------------------- the stage frame of a place
// f = the camera's look direction, r = screen right. A local spot [lx, lz] = c + r*lx + f*lz (lz > 0 = deeper).
export function stage(P) {
  const f = [Math.sin(rad(P.yaw)), Math.cos(rad(P.yaw))], r = [-f[1], f[0]];
  const w = ([lx, lz]) => [r3(P.c[0] + r[0] * lx + f[0] * lz), r3(P.c[1] + r[1] * lx + f[1] * lz)];
  return { f, r, w, camYaw: P.yaw, facing: r3(P.yaw + 180) };
}

// ---------------------------------------------------------------- shot types, tall frame (h = the frame's height at the target)
export function shotOf(P, spec, pos, len) {
  const S = stage(P), az0 = S.facing, t = (id) => { const [x, z] = pos(id); return [x, HEADS[id] ?? 0.55, z]; };
  const toward = (a, b, k) => a + (((b - a + 540) % 360) - 180) * k;
  const mid = (ids) => { const ps = ids.map(t); return [0, 1, 2].map((i) => r3(ps.reduce((s, p) => s + p[i], 0) / ps.length)); };
  const push = spec.push ?? 0.14, dur = r3(Math.max(0.5, len));
  const o = (target, a) => frame(target, { az: a.az ?? az0, el: a.el ?? 4, h: a.h, fov: a.fov ?? 36, push, dur });
  switch (spec.t) {
    case "wide": {
      const tg = spec.who ? mid(spec.who) : [P.c[0], 0.6, P.c[1]];
      return o(spec.at ?? tg, { h: spec.h ?? P.wideH, el: spec.el ?? 7, fov: 40, az: az0 + (spec.az ?? 0) });
    }
    case "group": case "two": {
      const ids = spec.who, ps = ids.map(pos);
      let spread = 0; for (const a of ps) for (const b of ps) spread = Math.max(spread, Math.hypot(a[0] - b[0], a[1] - b[1]));
      return o(mid(ids), { h: spec.h ?? Math.min(4.6, Math.max(2.0, (spread + 1.0) / F.ASPECT)), el: spec.el ?? 6, fov: 36, az: az0 + (spec.az ?? 0) });
    }
    case "close": { const [who] = spec.who; return o(t(who), { h: spec.h ?? 1.6, el: spec.el ?? 3, fov: 30, az: (spec.front ? (spec.face ?? az0) : toward(az0, spec.face ?? az0, 0.4)) + (spec.az ?? 0) }); }
    case "ots": { const [fg, bg] = spec.who, a = yawTo(pos(bg), pos(fg)); return o(t(bg), { h: spec.h ?? 1.9, el: 6, fov: 32, az: a + (spec.az ?? 25) }); }
    case "insert": return o(spec.at, { h: spec.h ?? 0.8, el: spec.el ?? 4, fov: 30, az: az0 + (spec.az ?? 0) });
    default: throw new Error(`no shot type ${spec.t}`);
  }
}

// ---------------------------------------------------------------- voices + music
export const NARRATOR = "narrator-quick";   // voice 1 "deep storyteller" (Jonny's pick), 15 % faster (his note on the Egypt opening, 19 Nov)
// a narrator take that came out wrong gets another take (another seed): Jonny 19 Nov heard a "weird noise" after the
// hooks line; Whisper heard "...four hooks, this clear." (a made-up tail after a silence)
export const TAKES = { "He lifts her off four hooks...": 2 };
// check windows (director only, workflow "Check windows"): contact the beat needs, on the segment's clock
export const ALLOW = {
  "ml01-04-corridor": [
    { who: "thief", with: "frm", from: 0.4, to: 0.8, checks: ["hand-in-prop", "arm-in-prop"], reason: "he pulls the frame off the panel: his right hand is on the frame (3-5 cm into its moulding for 0.2 s)" } ],
};
export const WPS = 0.4;
export const SCORE = (T0) => ({ file: "score-film/monalisa-score.ogg", from: 0, skip: r3(T0), seam: true, gain: 0.55, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false });
export const LEVEL = -9.7;

// ================================================================= THE FILM
// Hook (Jonny 19 Nov): the place in frame 1 (the Louvre, 1911, visitors walking past her), the narrator names her, the
// question ON SCREEN from frame 0: "How did one thief make the Mona Lisa famous?". Ending: the same shot today, packed
// with phones (the mirror), which answers it.
// Layout: who -> [lx, lz, face] (face: "cam", a yaw offset from facing the camera (180 = facing the stage's far side,
// e.g. the gallery wall), or ["to", id]). seq: ["n", text] narrator · ["s", who, text, tone] a gibberish line (captioned)
// · ["cut", shot] · ["walk", who, [lx, lz], dur] · ["e", who, expr, set] · ["arm", who, side, pose] · ["sfx", id, o]
// · ["prop", id, set, dur, ease] · ["wait", s] · ["hide", who] · ["show", who, [lx, lz, face]] · ["grab", who, prop]
// · ["let", who, prop] · ["turn", who, face] · ["look", who, [x, y, z]] · ["card", text, dur] · ["hop", who]
// sc.props: which of the run's own props are in this scene, with their state at the scene's start ({ id: {set} }).
export const ACTS = [
  { key: "hook", mood: "mystery" }, { key: "theft", mood: "sneaky" }, { key: "door", mood: "suspense" }, { key: "out", mood: "sneaky" },
  { key: "panic", mood: "drama" }, { key: "wall", mood: "mystery" }, { key: "room", mood: "suspense" }, { key: "caught", mood: "drama" }, { key: "today", mood: "reveal" },
];

const PAINT = { ml: { x: ML.x, y: ML.y, z: ML.z, rot: ML.rot, tip: 0, cover: 1 } };
const HOOKS = { id: "hooks", kind: "wallhooks", x: WALLX + 0.02, y: ML.y + ML.h / 2, z: 0, rot: -90 };
const MLP = { id: "ml", kind: "painting", ...PAINT.ml };
const ATML = [ML.x - 0.05, ML.y + ML.h / 2, ML.z];   // the face of the painting, for inserts
const ATLOW = [ML.x - 0.05, ML.y + ML.h / 2 + 0.17, ML.z];   // aimed above her eyes (0.12 over the centre): they sit just below the frame's middle, under the caption band (Sol r1 #20, r2 #10)

export const SCENES = [
  // 1 HOOK: the Louvre, 1911; visitors stroll past without a look; push in on her
  { id: "01 nobody stops", act: "hook", place: "gallery", extra: [MLP, HOOKS], props: { ml: PAINT.ml },
    layout: { v1: [-0.9, 1.25, 90], v2: [-2.6, 1.25, 90], v3: [0.2, 0.45, 90], v4: [-1.7, 0.45, 90] },
    shot: { t: "wide", at: [5.2, 0.75, 0], h: 4.0, az: -12 }, seq: [
      ["walk", "v1", [2.0, 1.25], 4.4], ["walk", "v2", [0.3, 1.25], 4.4], ["walk", "v3", [3.1, 0.45], 4.4], ["walk", "v4", [1.2, 0.45], 4.4],
      ["sfx", "step", { gain: 0.3 }],
      ["n", "Nineteen eleven. Nobody stops for the Mona Lisa."],
      ["cut", { t: "insert", at: ATLOW, h: 0.9, push: 0.25, hold: true }], ["hide", "v1"], ["hide", "v2"], ["hide", "v3"], ["hide", "v4"],
      ["n", "In two days, the whole world will be hunting for her."] ] },
  // 2 PLANT: the man who put the glass on her
  { id: "02 the glass man", act: "hook", place: "gallery", extra: [MLP, HOOKS], props: { ml: PAINT.ml },
    layout: { thief: [0.5, 1.15, -135] },
    shot: { t: "insert", at: [5.6, 0.75, 0.25], h: 1.7, az: -40 }, seq: [
      ["arm", "thief", "R", { o: [0.18, 0.42, 0.32] }], ["arm", "thief", "L", { o: [0.14, 0.2, 0.3] }],
      ["n", "This man put the glass on her."],
      ["cut", { t: "close", who: ["thief"], face: -90, az: 0, h: 3.3 }], ["arm", "thief", "R", "rest"], ["arm", "thief", "L", "rest"], ["turn", "thief", -20], ["e", "thief", "focused", { brow: 0.2 }],
      ["n", "He knows every door in this museum."], ["look", "thief", [4.3, 0.8, -6]] ] },
  // 3 SUNDAY NIGHT: into the closet as a guard walks by
  { id: "03 closet", act: "theft", place: "corridor", extra: [], props: {},
    layout: { thief: [0.4, 0.4, 150], g1: [-0.3, 5.0, 0] },
    shot: { t: "wide", at: [0.3, 0.8, 1.6], h: 2.6, az: -18 }, seq: [
      ["walk", "thief", [0.95, 1.0], 1.2], ["n", "Sunday night, he hides in a closet."], ["cut", { t: "wide", who: ["g1"], h: 2.8 }], ["sfx", "latch", { gain: 0.5 }], ["hide", "thief"],   // hidden on the cut, never on screen
      ["walk", "g1", [-0.2, 0.2], 2.6], ["sfx", "step", { gain: 0.4 }], ["wait", 1.2] ] },
  // 4 MONDAY: closed; off four hooks
  { id: "04 off the wall", act: "theft", place: "gallery", extra: [MLP, HOOKS], props: { ml: PAINT.ml },
    layout: { thief: [-2.4, 0.9, 90] },
    shot: { t: "wide", at: [5.0, 0.6, -0.6], h: 3.0, az: -8 }, seq: [
      ["walk", "thief", [0, 1.12], 1.6], ["n", "Monday, the Louvre is closed."],
      ["turn", "thief", 180], ["arm", "thief", "R", { o: [0.21, 0.36, 0.3] }], ["arm", "thief", "L", { o: [0.21, 0.36, 0.3] }],
      ["cut", { t: "insert", at: [5.55, 0.7, -0.1], h: 2.0, az: -75 }],
      ["n", "He lifts her off four hooks..."],
      ["sfx", "scrape", { gain: 0.4 }], ["mltake", "thief", { rot: ML.rot }], ["wait", 0.9],
      ["cut", { t: "wide", at: [5.2, 0.7, 0], h: 3.2, az: 15 }],
      ["turn", "thief", 90], ["walk", "thief", [2.6, 0.7], 1.3], ["wait", 0.6] ] },
  // 5 THE STAIRWELL: the frame comes off, she goes under his smock
  { id: "05 frame off", act: "theft", place: "corridor", extra: [{ id: "ml", kind: "painting", x: 0, y: -40, z: 0, cover: 1, wrap: 0 }, { id: "frm", kind: "frameonly", x: 1.3, y: -40, z: 0.3, rot: 0, tip: 0 }],
    props: { frm: { y: -40 } },
    layout: { thief: [0.2, 1.4, 0] },
    shot: { t: "wide", at: [-0.1, 0.72, 0.85], h: 2.7, az: -15 }, seq: [
      ["mlhold", "thief"], ["e", "thief", "focused"], ["arm", "thief", "L", { o: [0.3, 0.3, 0.12] }], ["wait", 0.35],
      // the frame comes off the panel where he holds her and drops at his feet (Sol r1 #1)
      ["prop", "ml", { cover: 0 }, 0.01, "linear"], ["prop", "frm", { x: -0.46, y: 0.38, z: 0.9, rot: 0, tip: 0 }, 0.01, "linear"],
      ["prop", "frm", { x: -0.85, y: 0.04, z: 1.15, rot: 25, tip: -80 }, 0.4, "in"], ["sfx", "tink", { gain: 0.5 }], ["arm", "thief", "L", "rest"],
      ["n", "...pulls off the frame in a stairwell..."],
      // and the white smock wraps her, bottom up, her face still peeking out (Sol r1 #2)
      ["cut", { t: "wide", at: [-0.2, 0.75, 0.85], h: 2.4, az: 20 }], ["arm", "thief", "L", { o: [0.3, 0.25, 0.14] }], ["prop", "ml", { wrap: 1 }, 0.8, "inOut"], ["sfx", "flutter", { gain: 0.3 }], ["wait", 0.5], ["arm", "thief", "L", "rest"],
      ["n", "...and wraps her in his smock."], ["wait", 0.3] ] },
  // 6 THE LOCKED DOOR + THE PLUMBER
  { id: "06 locked", act: "door", place: "corridor", extra: [], props: {},
    layout: { thief: [-0.75, 3.5, -60], plumber: [1.05, 0.5, -90] },
    shot: { t: "wide", at: [-0.95, 0.8, -1.0], h: 2.6, az: 35 }, seq: [
      ["mlhold", "thief", { cover: 0, wrap: 1 }],
      ["prop", "door", { squeal: 1 }, 0.25, "out"], ["sfx", "latch", { gain: 0.6 }], ["prop", "door", { squeal: 0 }, 0.25, "inOut"],
      ["n", "But the door is locked. The knob is gone."], ["e", "thief", "shocked", { open: 0.15 }],
      ["cut", { t: "wide", who: ["thief", "plumber"], h: 3.2 }], ["walk", "plumber", [-0.55, 2.55], 2.0], ["sfx", "step", { gain: 0.4 }],
      ["n", "Then a plumber walks by..."], ["turn", "thief", ["to", "plumber"]],
      // he reaches to the lock himself and swings the door open (Sol r1 #3)
      ["cut", { t: "wide", at: [-1.0, 0.8, -0.85], h: 3.0, az: 10, hold: true }], ["turn", "plumber", ["to", "thief"]], ["arm", "plumber", "L", { o: [0.25, 0.5, 0.32] }], ["sfx", "latch", { gain: 0.5 }],
      ["wait", 0.3], ["prop", "door", { open: 1 }, 0.9, "inOut"], ["sfx", "creak", { gain: 0.5 }],
      ["n", "...and opens it for him."], ["arm", "plumber", "L", "rest"], ["walk", "thief", [-2.25, 3.5], 1.2], ["wait", 0.4] ] },
  // 7 OUT INTO PARIS
  { id: "07 paris", act: "out", place: "street", extra: [{ id: "ml", kind: "painting", x: 0, y: -40, z: 0, cover: 0, wrap: 1 }], props: {},
    layout: { thief: [-1.3, 0.2, 90], v3: [1.3, 1.15, -90], v4: [2.3, 2.35, -90] },
    shot: { t: "wide", at: [1.0, 0.6, 0.9], h: 4.4, az: -8, hold: true }, seq: [
      ["mlhold", "thief", { cover: 0, wrap: 1 }],
      ["walk", "thief", [1.1, 0.2], 3.4], ["walk", "v3", [-1.6, 1.15], 3.0], ["walk", "v4", [-1.4, 1.9], 3.4],
      ["n", "He walks out into Paris."], ["n", "Nobody notices."], ["wait", 0.3] ] },
  // 8 TUESDAY: the painter, four empty hooks, the shrug, then panic
  { id: "08 empty hooks", act: "panic", place: "gallery", extra: [HOOKS], props: {},
    layout: { painter: [-2.4, 0.9, 90], g1: [0.9, 0.6, -40] },
    shot: { t: "wide", at: [5.2, 0.7, -0.8], h: 3.2, az: -10 }, seq: [
      ["walk", "painter", [-0.8, 0.9], 1.6], ["n", "Next morning, a painter comes to copy her."],
      ["turn", "painter", 160], ["cut", { t: "insert", at: [ML.x - 0.05, ML.y + 0.33, 0], h: 1.4, push: 0.2, az: 15 }],
      ["n", "Four empty hooks."],
      ["cut", { t: "wide", at: [5.0, 0.6, 0.1], h: 4.6, az: 0, el: 6, hold: true }], ["turn", "painter", 135], ["e", "painter", "shocked", { open: 0.2 }], ["hop", "painter"], ["arm", "painter", "R", "point"], ["wait", 0.5], ["turn", "painter", ["to", "g1"]],
      ["s", "g1", "being photographed!", "calm"], ["arm", "g1", "R", "shrug"], ["arm", "g1", "L", "shrug"],
      ["n", "The guards shrug."], ["arm", "g1", "R", "rest"], ["arm", "g1", "L", "rest"],
      ["arm", "painter", "R", "rest"], ["walk", "painter", [-2.2, 1.25], 1.0], ["n", "Hours later..."], ["sfx", "alarmbell", { gain: 0.6 }], ["e", "g1", "shocked"],
      ["cut", { t: "wide", h: 3.4, az: 12 }], ["arm", "g1", "R", "up"], ["walk", "g1", [3.2, 0.3], 1.2], ["show", "g2", [-2.8, -0.45, 90]], ["walk", "g2", [2.6, -0.45], 1.4],
      ["n", "...panic."], ["wait", 0.4] ] },
  // 9 THE WORLD EXPLODES: papers everywhere, Picasso questioned
  { id: "09 front pages", act: "panic", place: "street",
    extra: [...[0, 1, 2, 3].map((i) => ({ id: `np${i}`, kind: "newspaper", x: 0, y: -40, z: 0, bend: 0.6 })), { id: "ferme", kind: "sign", x: 0.65, y: 0, z: 0.2, rot: 0, text: "FERMÉ" }], props: {},
    layout: { g1: [-1.05, 1.15, 0], v1: [-1.9, 0.4, 20], v2: [0.4, 0.8, -15], insp: [1.85, 0.2, ["to", "picasso"]], picasso: [0.45, 0.0, ["to", "insp"]] },
    shot: { t: "wide", h: 3.2, az: 8 }, seq: [
      ["papers"], ["sfx", "flutter", { gain: 0.6 }],
      ["n", "The Louvre shuts for a week."],
      ["cut", { t: "insert", at: "np0", h: 0.8, push: 0.2 }],
      ["n", "Her face is on every front page on Earth."],
      ["cut", { t: "two", who: ["insp", "picasso"], az: -10 }], ["e", "picasso", "terrified"], ["arm", "insp", "R", "point"],
      ["n", "Police even question Picasso."], ["fx", { fx: "sweat", who: "picasso", dur: 1.2 }], ["wait", 0.3] ] },
  // 10 THE EMPTY WALL (the second hook)
  { id: "10 empty wall", act: "wall", place: "gallery", extra: [HOOKS], props: {},
    // a line from the bare hooks back through the hall (Sol r1 #14), then the empty wall over the front of the line
    layout: { v1: [-0.1, 1.0, 180], v2: [0.15, 0.25, 180], v3: [-0.12, -0.5, 180], spud: [0.12, -1.25, 180], v5: [-0.1, -2.0, 180], wedge: [0.14, -2.75, 180], v4: [-0.1, -3.5, 180], mash: [0.12, -4.25, 180] },
    shot: { t: "wide", at: [2.9, 0.5, 0], h: 6.2, az: -70, el: 32, hold: true }, seq: [
      ["n", "When it reopens, thousands queue..."],
      ["walk", "mash", [0.12, -4.05], 0.8], ["walk", "v4", [-0.1, -3.4], 0.8],
      ["cut", { t: "wide", at: [5.8, 0.8, 0], h: 2.4, az: 18, el: 42, hold: true }],
      ["n", "...to stare at an empty wall."], ["wait", 0.5] ] },
  // 11 HIS ROOM: the knock, the search, the trunk a metre away; two years
  { id: "11 his room", act: "room", place: "room", extra: [{ id: "trunk", kind: "trunk", x: -1.25, y: 0, z: -1.6, rot: 0, open: 0 },
      { id: "ml", kind: "painting", x: -1.0, y: 0.15, z: -1.6, rot: 90, tip: -90, cover: 0, wrap: 0.3 }], props: {},
    layout: { thief: [0.25, 0.9, 0], insp: [1.6, -1.2, ["to", "thief"]] },
    shot: { t: "wide", who: ["thief"], h: 2.6 }, seq: [
      ["sfx", "knock-tap", { gain: 0.7 }], ["e", "thief", "shocked", { open: 0.1 }],
      ["walk", "insp", [1.15, 1.0], 1.4], ["n", "Then the police knock on his door."],
      ["cut", { t: "two", who: ["thief", "insp"], h: 2.8, az: 0 }], ["s", "insp", "where were you on Monday?", "question"],
      ["cut", { t: "insert", at: [-1.25, 0.25, -1.6], h: 1.3, el: 22, push: 0.2, az: -40, hold: true }],
      ["n", "She's in the trunk. One metre away."],
      ["cut", { t: "wide", who: ["thief"], h: 2.6, az: -10 }], ["walk", "insp", [1.8, -1.4], 1.0],
      ["n", "They leave."], ["hide", "insp"],
      // only now, alone, he lifts the lid: she is there (Sol r1 #5, r2 #5)
      ["cut", { t: "insert", at: [-1.25, 0.18, -1.55], h: 1.0, el: 50, push: 0.15, az: -70, hold: true }], ["prop", "trunk", { open: 0.55 }, 0.4, "out"], ["wait", 1.1], ["prop", "trunk", { open: 0 }, 0.3, "in"], ["wait", 0.3],
      ["cut", { t: "insert", at: [-0.6, 1.25, -2.4], h: 0.9, push: 0.1 }], ["prop", "pad", { count: 843 }, 2.4, "in"], ["sfx", "flutter", { gain: 0.4 }],
      ["n", "Two years."], ["wait", 1.2] ] },
  // 12 FLORENCE: the dealer
  { id: "12 dealer", act: "caught", place: "shop", extra: [{ id: "trunk", kind: "trunk", x: 0.3, y: 0, z: 0.1, rot: 0, open: 0 }, { id: "ml", kind: "painting", x: 0.3, y: 0.15, z: 0.05, rot: 0, tip: -90, cover: 0 }],
    props: {},
    layout: { thief: [-0.75, 0.75, 30], dealer: [0.8, 0.85, -35] },
    shot: { t: "two", who: ["thief", "dealer"], h: 3.7, el: 16, az: -20 }, seq: [
      ["prop", "trunk", { open: 1 }, 0.6, "out"], ["sfx", "creak", { gain: 0.4 }], ["arm", "thief", "R", "point"], ["wait", 0.5],
      ["prop", "ml", { y: 0.42, tip: -45 }, 0.8, "out"],
      ["n", "Then he tries to sell her in Florence."],
      ["cut", { t: "close", who: ["dealer"], h: 2.1, az: 10 }], ["e", "dealer", "shocked", { eye: 1.3 }], ["wait", 0.3], ["e", "dealer", "kind"], ["s", "dealer", "leave it with me.", "calm"],
      ["cut", { t: "two", who: ["thief", "dealer"], h: 3.9, el: 12, az: 5 }], ["walk", "dealer", [2.3, 0.3], 1.1],
      ["n", "The dealer calls the police."], ["wait", 0.3] ] },
  // 13 CAUGHT, CHEERED
  { id: "13 seven months", act: "caught", place: "street", extra: [], props: {},
    layout: { thief: [-1.6, -0.1, 90], g1: [-2.5, 0.55, 90], g2: [-0.7, 0.55, 90], v1: [0.5, 1.55, -150], v2: [1.45, 1.45, -160], v3: [-0.4, 1.7, -140], v4: [2.4, 1.6, -170] },
    shot: { t: "wide", at: [0.4, 0.5, 0.9], h: 4.2, el: 10 }, seq: [
      ["walk", "thief", [0.4, -0.1], 2.6], ["walk", "g1", [-0.5, 0.55], 2.6], ["walk", "g2", [1.3, 0.55], 2.6],
      ["arm", "v1", "R", "up"], ["arm", "v2", "L", "up"], ["hop", "v1"], ["hop", "v4"], ["sfx", "gasp", { gain: 0.3 }],
      ["n", "Italy cheers him."], ["cut", { t: "close", who: ["thief"], h: 2.8, az: -20 }], ["e", "thief", "smug"],
      ["n", "He gets seven months."], ["wait", 0.4] ] },
  // 14 TODAY: the mirror of the first shot
  { id: "14 today", act: "today", place: "gallery", extra: [{ ...MLP, x: ML.x - 0.07 }, { id: "mlwall", kind: "mlwall", x: WALLX - 0.01, y: 0, z: 0, rot: -90 },
      { id: "crowd", kind: "visitorcrowd", x: ML.x, y: 0, z: 0, rot: 0, n: 30, arc: [1.7, -145, -35], h: 0.85, seed: 3 },
      { id: "rope", kind: "exhibitrope", x: ML.x - 1.3, y: 0, z: 0, posts: [[0, -1.2], [0, 0], [0, 1.2]] }],
    props: { ml: { ...PAINT.ml, x: ML.x - 0.07 } },
    layout: {},
    shot: { t: "wide", at: [5.2, 0.8, 0], h: 3.4, az: -10, el: 14, hold: true }, seq: [
      ["sfx", "notify", { gain: 0.25 }],
      ["n", "Nobody used to stop for her."],
      ["cut", { t: "wide", at: [5.3, 0.9, 0], h: 3.0, az: 14, el: 24, hold: true }],
      ["n", "Now, nobody can get close."],
      ["cut", { t: "insert", at: [ML.x - 0.3, ML.y + ML.h / 2 + 0.22, 0], h: 1.4, el: 10, push: 0.3, hold: true }],
      ["n", "All because one man carried her out under his smock."], ["wait", 1.0] ] },
];
