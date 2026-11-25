// KID VS DAD 03 "Square eyes": the four test OPENINGS (Jonny 25 Nov 2026 11:58 Berlin: "create all the openings ... id need
// to watch them to judge them"). One storyboard per hook: opening-h1.json .. opening-h4.json.
//   node storyboards/series/kid-vs-dad/03-square-eyes/make-openings.mjs
// Hooks v2 (/mnt/project-files/videos/kid-vs-dad/03-parent-lies/OPTIONS.md): every hook opens on a power word (Jonny 11:54);
// label at 0 s "Too much TV gives you square eyes" (8-line rule, line 2 + 8: plain English). Then the series opener
// template (line 7): "We're live. Tato, age seven, [...]. And in this house, there is one rule: [...]".
// Set: the living room "gravroom" (sofa, TV with the cartoon picture, lamp, plant), the square-eyed neighbour outside the window.
// Square eyes: DESIGN.md here (face keys square / sqCorner / sqTall / sqPhone). Dad = Wedge as a stand-in until the new Dad
// (DAD-DESIGN.md) is built.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { OPENINGS } from "./lines.mjs";

const DAD_CHAR = process.env.KVD_DAD || "potatobrawl/wedge";
// spoken lengths (node qa/lines.mjs kvd03-voice-probe.json, 25 Nov)
const SPOKEN = {
  "Warning. This man watched too much TV.": 2.15, "One more hour, and that's you.": 2.25, "Square forever? Is it true?": 1.4,
  "We're live. Tato, age seven, has watched TV for nine hours.": 3.99,
  "And in this house, there is one rule: one more hour... and your eyes go square.": 6.66,
  "Breaking. Square eyes are spreading.": 2.25, "Is this kid next?": 1.18, "Lies. Your parents lied to you... or did they?": 3.65,
  "Danger. One more hour, and your eyes go square. Forever.": 4.15, "Is it true?": 0.72,
};
const LABEL = "Too much TV gives you *square eyes*";
const CAPTEXT = {
  "Warning. This man watched too much TV.": "*Warning.* This man watched too much TV.",
  "One more hour, and that's you.": "One more hour, and *that's you.*",
  "Square forever? Is it true?": "Square forever? *Is it true?*",
  "We're live. Tato, age seven, has watched TV for nine hours.": "*Tato,* age seven. *Nine hours* of TV.",
  "And in this house, there is one rule: one more hour... and your eyes go square.": "One more hour... and your eyes go *square.*",
  "Breaking. Square eyes are spreading.": "*Breaking.* Square eyes are spreading.",
  "Is this kid next?": "Is this kid *next?*",
  "Lies. Your parents lied to you... or did they?": "*Lies.* Your parents lied to you... *or did they?*",
  "Danger. One more hour, and your eyes go square. Forever.": "*Danger.* One more hour... *square. Forever.*",
  "Is it true?": "Is it *true?*",
};

// ---------------------------------------------------------------- places (gravroom: x right, +z toward the camera, back wall z -2.65)
const SOFA = [0.2, -1.61], SEAT = 0.45;
const KID = [-0.22, -1.52], DAD = [0.70, -1.52];
const TV = [-1.52, -0.99, 34];
const REP = [1.66, -0.22], PLANT = [1.95, -1.15];
const MASH = [1.40, -3.10];
const PH = { x: 0.54, y: 0.98, z: -1.18, rot: 175, tip: -35 };

function opening(key) {
  const LINES = OPENINGS[key];
  const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
  const DUR = LINES.map(([, l]) => SPOKEN[l]);
  const GAP = LINES.map((_, i) => (i === 0 ? 0.12 : 0.3));
  if (key === "h1") GAP[1] = 1.3;          // the pull-out from the neighbour's eyes before Dad's line
  if (key === "h3") GAP[1] = 0.6;          // the eye flicker lands before the rule
  const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
  const END_OF = (i) => r3(T[i] + DUR[i]);
  const END = r3(END_OF(LINES.length - 1) + 0.6);
  const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);
  const cutAt = (i) => r3(Math.floor((T[i] - 0.05) * 30) / 30);
  const iRule = LINES.findIndex(([, l]) => l.startsWith("We're live"));

  const SUB = 430, LABY = 250;
  const say = (i) => {
    const [who, line, tone, style, o = {}] = LINES[i];
    c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
    const to = key === "h3" && i === 0 ? END_OF(0) : r3(Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END) - 0.2));   // h3: off before the eye cut
    cap(T[i], to, CAPTEXT[line] ?? line, SUB, false, { size: 62 });
  };
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
  const face = (t, who, set, dur = 0) => A(r3(t), who, "face", { ...set, dur });

  const cast = [
    { id: "spud", character: "potatobrawl/spud-kid", at: KID, face: 12, expr: "kind", follow: 0, seed: 4.1 },
    { id: "wedge", character: DAD_CHAR, at: DAD, face: -6, expr: "deadpan", follow: 0, seed: 2.9 },
    { id: "rep", character: "potatobrawl/reporter", at: REP, face: -28, follow: 0.3, seed: 131.3 },
    ...(key === "h1" || key === "h2" ? [{ id: "mash", character: "potatobrawl/mash", at: MASH, face: 0, expr: "kind", follow: 0, seed: 3.7 }] : []),
  ];
  const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", [r3(REP[0] - 0.36), 0.40, r3(REP[1] + 0.22)], -28) };
  const props = [
    { id: "sofa", kind: "gsofa", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, sink: 0.02, damage: 0 },
    { id: "tv", kind: "gtv", x: TV[0], y: 0, z: TV[1], rot: TV[2], glow: 1, picture: "cartoon", light: 0.55, castLight: 4, on: 1, card: 0 },
    { id: "lamp", kind: "glamp", x: -1.75, y: 0, z: -2.35, rot: 180 },
    { id: "plant", kind: "gplant", x: PLANT[0], y: 0, z: PLANT[1] },
    { id: "rug", kind: "grug", x: 0.18, y: 0, z: 0.11 },
    { id: "phone", kind: "phone", ...PH, scale: 1.6, case: "#3e383b" },
    MIC,
  ];

  // ---------------------------------------------------------------- frame 0: everyone in place
  A(0, "spud", "sit", { rot: 12, height: SEAT, dur: 0, hands: "lap" });
  A(0, "wedge", "sit", { rot: -6, height: SEAT, dur: 0, hands: "keep" });
  A(0, "wedge", "grab", { prop: "phone", hand: "L", dur: 0, pose: null });
  c.arm(0, "wedge", "L", { o: [-0.05, 0.5, 0.42] }, 0); c.arm(0, "wedge", "R", "rest", 0);
  look(0, "wedge", [0.1, -0.55], 0); expr(0, "wedge", { eye: 0.7, tilt: -0.05, curve: -0.1 }, 0);
  for (const t of [1.2, 2.6, 4.4, 6.1, 8.2, 10.4, 12.6, 14.9, 17.2].filter((q) => q < END - 0.4)) { A(t, "wedge", "grip", { side: "L", shape: "scroll", dur: 0.1 }); A(r3(t + 0.16), "wedge", "grip", { side: "L", shape: "hold", dur: 0.12 }); }
  look(0, "spud", [-0.75, 0.05], 0); expr(0, "spud", { eye: 1.1, open: 0.15 }, 0);
  A(0, "rep", "crouch", { to: 0.14, dur: 0.01 }); expr(0, "rep", { tilt: -0.08, browY: -0.02, eye: 0.95 }, 0);
  const gm = grips.mug(c, "rep", MIC, { side: "R" }); gm.take(0, { reach: 0.01, settle: 0.01 });
  c.prop(0, "tv", { on: 1, card: 0 }, 0);
  if (cast.some((m) => m.id === "mash")) {
    face(0, "mash", { square: 1 }); look(0, "mash", [0, 0], 0);
    expr(0, "mash", { eye: 1.12, browY: 0.02, tilt: 0.05, curve: 0.2, open: 0, pupil: 0.85 }, 0);
  }

  // cameras (every shot drifts or pushes; Jonny 20 Nov)
  const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
  const MASH_CU = { pos: [1.38, 0.81, -1.54], look: [1.38, 0.81, -2.87], fov: 30 };   // his eyes from the layout, 1.33 m out (DESIGN 3)
  const MASH_MED = { pos: [1.55, 1.0, -0.35], look: [1.38, 0.85, -2.87], fov: 40 };   // straight back on his axis, right of Dad
  // framed from the layout's eye points (t 0): eyes at ~50 % down, captions over the body, never the eyes (captionOverBody)
  const KIDC = { pos: [-0.45, 0.80, 1.05], look: [-0.17, 0.77, -1.30], fov: 36 };
  const KID_EYE = { pos: [-0.26, 0.78, -0.50], look: [-0.17, 0.77, -1.30], fov: 36 };
  const DADC = { pos: [0.40, 1.01, 2.50], look: [0.66, 1.01, -1.17], fov: 36 };
  const REPC = { pos: [1.00, 0.60, 1.90], look: [1.57, 0.56, -0.02], fov: 36 };
  const REP_CAM = { pos: [1.42, 0.58, 2.00], look: [1.57, 0.56, -0.02], fov: 36 };   // to camera (h3)
  const WIDE = { pos: [0.20, 1.35, 2.6], look: [0.20, 0.85, -1.5], fov: 46 };   // Tato and Dad on the sofa, the TV glow at the left
  const shots = [];

  if (key === "h1") {
    // frame 0: the neighbour's square eyes, two blinks, then the pull-out to the window
    A(0.30, "mash", "blink", { dur: 0.27 }); A(0.85, "mash", "blink", { dur: 0.27 });
    A(0, "rep", "hide"); A(onCut(T[iRule]), "rep", "show");   // off stage until his line (the eye close-up projected him from behind)
    say(0);
    shots.push(["eyes", 0, push(MASH_CU, 0.03, 1.1), "hook"]);
    const CU1 = push(MASH_CU, 0.03, 1.1).to;   // the pull-out starts where the push ended: one continuous shot
    shots.push(["pull out", 1.1, { pos: CU1.pos, look: CU1.look, fov: CU1.fov, to: { pos: MASH_MED.pos, look: MASH_MED.look, fov: MASH_MED.fov }, dur: 0.8, ease: "out" }]);
    see(0, 1.1, ["mash.face"], "frame 0: a man's perfectly square eyes, blinking, behind a window");
    // Dad points at the window without looking up from his phone
    shots.push(["thats you", cutAt(1), push(DADC, 0.08, DUR[1] + 0.3)]);
    c.arm(T[1], "wedge", "R", { o: [0.28, 0.78, -0.15] }, 0.3, "out");   // a thumb back over his shoulder at the window A(T[1], "wedge", "grip", { side: "R", shape: "thumb", dur: 0.15 });
    say(1); c.arm(r3(END_OF(1) + 0.15), "wedge", "R", "rest", 0.35); A(r3(END_OF(1) + 0.15), "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
    shots.push(["is it true", cutAt(2), push(KIDC, 0.08, DUR[2] + 0.3)]);
    look(T[2] - 0.2, "spud", [0.8, 0.15], 0.25); expr(T[2] - 0.2, "spud", { eye: 1.2, pupil: 0.8, tilt: 0.25, curve: -0.2 }, 0.2);
    say(2);
  }
  if (key === "h2") {
    shots.push(["breaking", 0, push(REPC, 0.08, DUR[0] + 0.4), "hook"]);
    say(0);
    see(0, END_OF(0), ["rep.face"], "a war correspondent crouched behind a house plant, live: BREAKING");
    shots.push(["next", cutAt(1), push(KIDC, 0.25, DUR[1] + 0.5)]);
    say(1);
  }
  if (key === "h3") {
    shots.push(["lies", 0, push(REP_CAM, 0.08, DUR[0] + 0.2), "hook"]);
    look(0, "rep", [0.45, 0.1], 0); say(0);
    see(0, END_OF(0), ["rep.face"], "a reporter straight to camera: LIES");
    // hard cut to Tato's eye: one corner snaps square twice (DESIGN.md section 1, the H3 flicker)
    const tf = r3(Math.floor((END_OF(0) + 0.05) * 30) / 30), f = (n) => r3(tf + n / 30);
    face(r3(tf - 0.02), "spud", { square: 0.02 });
    face(f(8), "spud", { sqCorner: 1 }, 0.067); face(f(15), "spud", { sqCorner: 0 }, 0.067);
    face(f(24), "spud", { sqCorner: 1 }, 0.067); face(f(36), "spud", { sqCorner: 0 }, 0.067);
    shots.push(["flicker", tf, push(KID_EYE, 0.05, r3(T[1] - tf - 0.05))]);
    face(r3(T[1] - 0.1), "spud", { square: 0 });
  }
  if (key === "h4") {
    shots.push(["danger", 0, push(DADC, 0.08, DUR[0] + 0.3), "hook"]);
    say(0);
    see(0, END_OF(0), ["wedge.face"], "a dad on his phone, face lit blue, warning without looking up");
    shots.push(["true", cutAt(1), push(KIDC, 0.08, DUR[1] + 0.4)]);
    expr(T[1] - 0.2, "spud", { eye: 1.15, tilt: 0.2, curve: -0.15 }, 0.2);
    say(1);
  }
  // the opener template (all four)
  shots.push(["live", cutAt(iRule), push(REPC, 0.08, DUR[iRule] + 0.3)]);
  say(iRule);
  if (LINES[iRule + 1]) { shots.push(["one rule", cutAt(iRule + 1), push(WIDE, 0.12, DUR[iRule + 1] + 0.6)]); say(iRule + 1); }

  // the label at 0 s (plain English, 8-line rule)
  cap(0, r3(Math.min(3.2, END)), LABEL, LABY, false, { size: 58, kinetic: false });   // on screen from frame 0
  const beats = c.beats(shots, END);
  const hudShow = key === "h2" ? 0 : cutAt(iRule);

  return {
    id: `kvd03-opening-${key}`, title: `Kid vs Dad 03 opening ${key.toUpperCase()}`,
    idea: `Test opening ${key} for Kid vs Dad 03 "Too much TV gives you square eyes" (Jonny judges the four openings by watching them).`,
    fps: 30, look: "anime-pro", profile: "short", loop: false,
    captionBand: [200, 1230], captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
    captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
    motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
    physics: false, animeTiming: true, far: 200,
    set: { type: "gravroom", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
    hud: { news: { label: "SQUARE EYES SPREADING", tag: key === "h2" ? "BREAKING" : "LIVE", tagW: key === "h2" ? 230 : 150, count: false, show: [hudShow, END] } },
    music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
    sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood", room: "livingroom" },
    creative: { length: [END, END] },
    hook: { show: key === "h1" ? ["mash"] : key === "h4" ? ["wedge"] : ["rep"], hint: 0, what: LINES[0][1] },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [
      { who: "spud", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "sitting on the sofa" },
      { who: "wedge", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "sitting on the sofa" },
    ],
    notes: `Generated by storyboards/series/kid-vs-dad/03-square-eyes/make-openings.mjs (${key}). Dad = ${DAD_CHAR}.`,
  };
}

for (const key of Object.keys(OPENINGS)) {
  const sb = opening(key);
  write(import.meta.url, sb);
}
