// KID VS DAD 03 "Square eyes": the ROUGH DRAFT of the whole episode (Jonny's story check).
//   node storyboards/series/kid-vs-dad/03-square-eyes/make-episode.mjs   -> kvd03-square-eyes.json
// Opening H1 (starred: the neighbour's square eyes first) + ending E1 (starred: Dad looks up, his eyes are phones; Tato
// "Screens."), setting S2 breaking news. Jonny 25 Nov ~14:05 Berlin went away for a few hours and asked for results not
// held for approvals: the starred picks are the default, the other openings stay ready to swap in (first ~20 s only).
// Outline: /mnt/project-files/videos/kid-vs-dad/03-parent-lies/OPTIONS.md (v3). Departure: no Codex panel sheet first
// (Jonny away; his PC needed), the outline table is the board.
// The rule pushed three times with the clock on the wall as the counter (8 pm ruler, 11 pm eye chart, 3 am torch); why
// the rule exists (the neighbour, 1998); Dad's three teases (eyes never leave the phone; can't read it; low battery).
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as grips from "../../../lib/grips.mjs";
import { EPISODE, RHYME } from "./lines.mjs";
const RHY = process.env.KVD_RHYME === "1";   // the rhyming version (Jonny 25 Nov 19:26): -> kvd03-square-eyes-rhyme.json
const LINES = RHY ? RHYME : EPISODE;

const DAD_CHAR = process.env.KVD_DAD || "potatobrawl/dad";
// spoken lengths: spoken.json here (node qa/lines.mjs on this storyboard writes them in its log; copied over by hand)
const SPOKEN = (() => { try { return JSON.parse(fs.readFileSync(new URL(RHY ? "./spoken-rhyme.json" : "./spoken.json", import.meta.url))); } catch { return {}; } })();
const est = (l) => r3(0.45 + l.split(/\s+/).length * 0.36);
const LABEL = "Too much TV gives you *square eyes*";
const CAPTEXT = {
  "Warning. This man watched too much TV.": "*Warning.* This man watched too much TV.",
  "One more hour, and that's you.": "One more hour, and *that's you.*",
  "Square forever? Is it true?": "Square forever? *Is it true?*",
  "We're live. Tato, age seven, has watched TV for nine hours.": "*Tato,* age seven. *Nine hours* of TV.",
  "And in this house, there is one rule: one more hour... and your eyes go square.": "One more hour... and your eyes go *square.*",
  "Hour nine. Eye check.": "*Hour nine.* Eye check.",
  "Hour twelve. Read the top line.": "*Hour twelve.* Read the top line.",
  "One summer. Nineteen ninety-eight.": "One summer. *1998.*",
  "Now everything is widescreen.": "Now everything is *widescreen.*",
  "Hour sixteen. He's going for the whole season.": "*Hour sixteen.* He's going for the whole season.",
  "Screens.": "*Screens.*",
  "Warning. Look what TV can do.": "*Warning.* Look what TV can do.",
  "One more hour... and that's you.": "One more hour... and *that's you.*",
  "In this house, there's one rule, you see: one more hour... and square you'll be.": "In this house, one rule, you see: one more hour... and *square you'll be.*",
  "Hour nine. Eye check. Hold still. Freeze.": "*Hour nine.* Eye check. Hold still. *Freeze.*",
  "Hour twelve. Read me the top row.": "*Hour twelve.* Read me the top row.",
  "One summer. Ninety-eight. I just sat and stared.": "One summer. *1998.* I just sat and stared.",
  "Now everything is widescreen... and squared.": "Now everything is *widescreen...* and *squared.*",
  "Hour sixteen. The whole season. No break.": "*Hour sixteen.* The whole season. No break.",
  "Screens. Forever. It's true.": "*Screens.* Forever. *It's true.*",
};

// ---------------------------------------------------------------- places (gravroom: x right, +z toward the camera, back wall z -2.65)
const SOFA = [0.2, -1.61], SEAT = 0.45;
const KID = [-0.24, -1.52], DAD = [0.77, -1.52];
const TV = [-1.52, -0.99, 34];
const REP = [1.66, -0.22], PLANT = [-0.95, -2.30];
const REP_CHECK = [-0.62, -0.62], REP_CHECK_ROT = 157;   // crouched in front of Tato's left, facing him
const MASH = [1.75, -3.10];   // Sol r1 #8: at 1.40 his head sat on Dad's shoulder in Dad's shots
const CLOCK = { x: 0.20, y: 1.55, z: -2.62 };
const PH = { x: 0.54, y: 0.98, z: -1.18, rot: 175, tip: -35 };
const OFF = (z) => ({ x: 3.5, y: 0, z });   // props waiting off stage
// the rep's left hand at the check spot: 0.6 m ahead of him, 0.15 to his left, at Tato's eye height (layout-checked in stills)
const HAND_AT = (() => { const a = (REP_CHECK_ROT * Math.PI) / 180, f = [Math.sin(a), Math.cos(a)], l = [Math.cos(a), -Math.sin(a)];
  return [r3(REP_CHECK[0] + f[0] * 0.6 + l[0] * 0.15), 0.76, r3(REP_CHECK[1] + f[1] * 0.6 + l[1] * 0.15)]; })();   // over the sofa arm (top .62)
const RULER = { id: "ruler", kind: "smallruler", ...OFF(-0.5), rot: 0 };
const RULER_AT = { ...grips.placeFor("smallruler", HAND_AT, REP_CHECK_ROT), roll: 75 };   // pinched at its end, stood up (props-sqeyes.js header)
const CHART = { id: "chart", kind: "eyechart", ...OFF(-1.0), rot: 0 };
const CHART_AT = grips.placeFor("eyechart", [HAND_AT[0], 0.64, HAND_AT[2]], REP_CHECK_ROT, { turn: 135 });   // letters half to Tato, half to the camera
const TORCH = { id: "torch", kind: "policetorch", ...OFF(-1.5), rot: 0, up: true };
const TORCH_AT = { ...grips.placeFor("policetorch", [HAND_AT[0], 0.70, HAND_AT[2]], REP_CHECK_ROT), tip: 90 };

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const DUR = LINES.map(([, l]) => SPOKEN[l] ?? est(l));
// the pause before each line (action beats live here)
const GAP = LINES.map((_, i) => (i === 0 ? 0.12 : 0.3));
Object.assign(GAP, { 1: 1.3, 6: 0.6, 7: 0.9, 9: 0.8, 10: 0.3, 13: 0.4, 14: 0.6, 18: 1.45, 19: 0.8, 21: 1.6, 22: 0.9, 23: 1.6 });   // tightened after Sol r1 (task B)
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const END = r3(END_OF(LINES.length - 1) + 0.45);   // fast end after the answer (Jonny's pattern, step 5)
const cutAt = (i, before = 0.05) => r3(Math.floor((T[i] - before) * 30) / 30);
const micAt = (at, yaw) => { const a = ((yaw + 28) * Math.PI) / 180, dx = -0.36, dz = 0.22;   // the mic's offset from the rep at yaw -28, turned with him
  return grips.placeFor("newsmic", [r3(at[0] + dx * Math.cos(a) + dz * Math.sin(a)), 0.40, r3(at[1] - dx * Math.sin(a) + dz * Math.cos(a))], yaw); };
const place = (t, who, at, rot) => { if (who === "rep") c.prop(r3(t - 0.02), "mic", micAt(at, rot), 0);   // Sol r1 #4: else his mic arm stretched back across the room
  A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: rot, dur: 0.01, ease: "linear", sync: true }); };

const SUB = 430, LABY = 250;
const say = (i, { capTo, pos = SUB } = {}) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  const to = capTo ?? r3(Math.min(END_OF(i) + 0.3, (T[i + 1] ?? END) - 0.2));
  cap(T[i], to, CAPTEXT[line] ?? line, pos, false, { size: 62 });
};
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const face = (t, who, set, dur = 0) => A(r3(t), who, "face", { ...set, dur });

const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: KID, face: 12, expr: "kind", follow: 0, seed: 4.1 },
  { id: "wedge", character: DAD_CHAR, at: DAD, face: -6, expr: "deadpan", follow: 0, seed: 2.9 },
  { id: "rep", character: "potatobrawl/reporter", at: REP, face: -28, follow: 0.3, seed: 131.3 },
  { id: "mash", character: "potatobrawl/mash", at: MASH, face: 0, expr: "kind", follow: 0, seed: 3.7 },
];
const MIC = { id: "mic", kind: "newsmic", lean: 30, ...grips.placeFor("newsmic", [r3(REP[0] - 0.36), 0.40, r3(REP[1] + 0.22)], -28) };
const props = [
  { id: "sofa", kind: "gsofa", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, sink: 0.02, damage: 0 },
  { id: "tv", kind: "gtv", x: TV[0], y: 0, z: TV[1], rot: TV[2], glow: 1, picture: "cartoon", light: 0.55, castLight: 4, on: 1, card: 0 },
  { id: "lamp", kind: "glamp", x: -1.75, y: 0, z: -2.35, rot: 180 },
  { id: "plant", kind: "gplant", x: PLANT[0], y: 0, z: PLANT[1] },
  { id: "rug", kind: "grug", x: 0.18, y: 0, z: 0.11 },
  { id: "clock", kind: "wallclock", ...CLOCK, rot: 0, time: 20, staged: "hung on the back wall" },
  { id: "phone", kind: "phone", ...PH, scale: 1.6, case: "#3e383b" },
  MIC,
  RULER, CHART, TORCH,
  { id: "beam", kind: "torchbeam", ...OFF(-2.0), rot: 0, on: 0, len: 0.45, r: 0.16 },
];

// ---------------------------------------------------------------- frame 0
A(0, "spud", "sit", { rot: 12, height: SEAT, dur: 0, hands: "lap" });
A(0, "wedge", "sit", { rot: -6, height: SEAT, dur: 0, hands: "keep", feet: [0.06, 0.04] });   // shoes tucked inside the sofa front (Sol r2 #1: toes poked out of it)
A(0, "wedge", "grab", { prop: "phone", hand: "L", dur: 0, pose: null });
const DAD_PHONE = { o: [-0.05, 0.5, 0.42] }, DAD_PHONE_CLOSE = { o: [-0.03, 0.62, 0.30] };
c.arm(0, "wedge", "L", DAD_PHONE, 0); c.arm(0, "wedge", "R", "rest", 0);
look(0, "wedge", [0.25, -1.0], 0); A(0, "wedge", "pitch", { to: 8, dur: 0 });   // eyes and head down on the phone in his left hand (Sol r1 #3, r2 #6)
expr(0, "wedge", { eye: 0.7, tilt: -0.05, curve: -0.1 }, 0);
for (let t = 1.2; t < END - 0.4; t = r3(t + 1.7 + ((t * 7) % 0.9))) { A(r3(t), "wedge", "grip", { side: "L", shape: "scroll", dur: 0.1 }); A(r3(t + 0.16), "wedge", "grip", { side: "L", shape: "hold", dur: 0.12 }); }
look(0, "spud", [-0.75, 0.05], 0); expr(0, "spud", { eye: 1.1, open: 0.15 }, 0);
A(0, "rep", "crouch", { to: 0.14, dur: 0.01 }); expr(0, "rep", { tilt: -0.08, browY: -0.02, eye: 0.95 }, 0);
const gm = grips.mug(c, "rep", MIC, { side: "R" }); gm.take(0, { reach: 0.01, settle: 0.01 });
// a tool into the rep's left hand on a cut: brought to the hand spot off camera, taken at once (grip library holds)
const tool = (t, spec, at, hold) => { c.prop(r3(t - 0.14), spec.id, at, 0); hold(c, "rep", { ...spec, ...at }).take(r3(t - 0.12), { reach: 0.01, settle: 0.01 }); };
const putAway = (t, id, z) => A(r3(t - 0.04), "rep", "release", { prop: id, to: [3.5, 0, z], dur: 0.01 });   // gone at once (Sol r1 #19: the chart flew through a shot)
c.prop(0, "tv", { on: 1, card: 0 }, 0);
c.prop(0, "clock", { time: 20 }, 0);
c.prop(0, "beam", { on: 0 }, 0);
face(0, "mash", { square: 1 }); look(0, "mash", [0, 0], 0);
expr(0, "mash", { eye: 1.12, browY: 0.02, tilt: 0.05, curve: 0.2, open: 0, pupil: 0.85 }, 0);
face(0, "wedge", { square: 0.02 });   // held just above 0 so the teases can flicker the corners on screen (DESIGN.md: switch on cuts)

// ---------------------------------------------------------------- cameras (every shot drifts or pushes; Jonny 20 Nov)
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const MASH_CU = { pos: [1.98, 0.81, -1.54], look: [1.75, 0.74, -2.87], fov: 30 };   // look a little low: the LIVE bar on his chest, not his mouth (Sol r1 #10)
const MASH_MED = { pos: [1.90, 1.0, -0.35], look: [1.73, 0.85, -2.87], fov: 40 };
const KIDC = { pos: [-0.45, 0.80, 1.05], look: [-0.17, 0.77, -1.30], fov: 36 };
const KID_TIGHT = { pos: [-0.36, 0.78, 0.15], look: [-0.20, 0.77, -1.30], fov: 34 };
const DADC = { pos: [0.66, 1.01, 1.20], look: [0.80, 0.98, -1.17], fov: 31 };   // closer: phone in frame, his feet below it (Sol r1 #3, #5)
const DAD_CU = { pos: [0.60, 0.99, 0.55], look: [0.75, 0.90, -1.30], fov: 34 };   // face high: the LIVE strap on his shirt (Sol r2 #15)
const REPC = { pos: [1.00, 0.60, 1.90], look: [1.57, 0.56, -0.02], fov: 36 };
const WIDE = { pos: [0.34, 1.35, 2.75], look: [0.34, 0.85, -1.5], fov: 48 };
const CHECK = { pos: [0.62, 0.86, 0.55], look: [-0.28, 0.76, -1.30], fov: 40 };   // Tato and the tool get the frame (Sol r1 #21)   // the rep in profile, the tool at Tato's eye
const CLOCKC = { pos: [0.20, 1.45, -1.30], look: [0.20, 1.55, -2.62], fov: 30 };   // the wall clock over the sofa
const TVC = { pos: [-0.62, 0.86, 0.05], look: [-1.52, 0.86, -0.99], fov: 40 };     // the TV from Tato's side of the room
const shots = [];

// ---------------------------------------------------------------- 0-20 s: opening H1 (as kvd03-opening-h1)
A(0, "mash", "noblink");   // Sol r1 #16: square lids showed seams in a blink; he stares instead
A(0, "rep", "hide"); A(r3(cutAt(3) - 0.1), "rep", "show");
A(r3(cutAt(3) - 0.1), "mash", "hide");
say(0);
shots.push(["eyes", 0, push(MASH_CU, 0.03, 1.1), "hook"]);
const CU1 = push(MASH_CU, 0.03, 1.1).to;
shots.push(["pull out", 1.1, { pos: CU1.pos, look: CU1.look, fov: CU1.fov, to: { pos: MASH_MED.pos, look: MASH_MED.look, fov: MASH_MED.fov }, dur: 0.8, ease: "out" }]);
see(0, 1.1, ["mash.face"], "frame 0: a man's perfectly square eyes, blinking, behind a window");
shots.push(["thats you", cutAt(1), push(DADC, 0.08, DUR[1] + 0.3)]);
c.arm(T[1], "wedge", "R", { o: [0.28, 0.78, -0.15] }, 0.3, "out");
{ const td = r3(Math.min(END_OF(1) + 0.15, cutAt(2) - 0.3)); say(1); c.arm(td, "wedge", "R", "rest", 0.25); A(td, "wedge", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); }   // down before the cut (Sol r2 #14)
shots.push(["is it true", cutAt(2), push(KIDC, 0.08, DUR[2] + 0.3)]);
look(T[2] - 0.2, "spud", [0.8, 0.15], 0.25); expr(T[2] - 0.2, "spud", { eye: 1.2, pupil: 0.8, tilt: 0.25, curve: -0.2 }, 0.2);
say(2);
look(END_OF(2) + 0.2, "spud", [-0.75, 0.05], 0.3); expr(END_OF(2) + 0.2, "spud", { eye: 1.1, open: 0.15, tilt: 0, curve: 0 }, 0.3);
shots.push(["live", cutAt(3), push(REPC, 0.08, DUR[3] + 0.3)]);
say(3);
shots.push(["one rule", cutAt(4), push(WIDE, 0.12, DUR[4] + 0.6)]);
say(4);

// ---------------------------------------------------------------- 8 pm, hour nine: the ruler
shots.push(["one more", cutAt(5), push(KIDC, 0.06, DUR[5] + GAP[6] + 0.1)]);
say(5); sfx(r3(T[5] + 0.5), "click", 0.4);
// the rep crawls in on the cut: crouched low at Tato's left, the ruler up to his eye
const tCheck1 = cutAt(6, 0.5);
place(tCheck1, "rep", REP_CHECK, REP_CHECK_ROT);
A(r3(tCheck1 - 0.02), "rep", "crouch", { to: 0.22, dur: 0.01 });
// the ruler: taken at his post during the wide (he is off its frame), carried up to Tato's eye on the cut (taken on the cut
// itself, the kid's shot before it saw the ruler arrive and the arm sweep in: draft 1 pop at 20.67 s)
{ const a = (-28 * Math.PI) / 180, at = [r3(REP[0] + Math.cos(a) * 0.42 + Math.sin(a) * 0.05), 0.40, r3(REP[1] - Math.sin(a) * 0.42 + Math.cos(a) * 0.05)];
  const start = { ...grips.placeFor("smallruler", at, -28), roll: 75, staged: "picked up at his post outside the wide's frame; nobody sees it until the cut to the check" }, tTake = r3(T[4] + 1.0);
  c.prop(r3(tTake - 0.02), "ruler", start, 0);
  const h = grips.thin(c, "rep", { ...RULER, ...start }, { side: "L", from: 0.5, roll: 75 });
  h.take(tTake, { reach: 0.3, settle: 0.2 });
  h.carry(r3(tCheck1 - 0.02), [RULER_AT.x, RULER_AT.y, RULER_AT.z], 0.01, "linear");
  c.prop(r3(tCheck1 - 0.02), "ruler", { rot: RULER_AT.rot }, 0.01); }
shots.push(["eye check", tCheck1, push(CHECK, 0.10, r3(END_OF(7) - tCheck1 + 0.3))]);
say(6); say(7);
expr(T[7] - 0.1, "rep", { eye: 1.0, curve: 0.15, tilt: 0 }, 0.2);
sfx(r3(T[7] - 0.5), "tink", 0.3);
shots.push(["last warning", cutAt(8), push(DADC, 0.10, DUR[8] + 0.5)]);
say(8);
// tease 1: one frame-pair of square corners in Dad's eyes after his line (square is held at 0.02, so this is on screen)
{ const f = (n) => r3(END_OF(8) + 0.1 + n / 30); face(f(0), "wedge", { sqCorner: 1 }, 0.067); face(f(6), "wedge", { sqCorner: 0 }, 0.067); }

// ---------------------------------------------------------------- 11 pm, hour twelve: the eye chart
const tClock2 = cutAt(9, 0.75);
c.prop(r3(tClock2 - 0.034), "clock", { time: 23 }, 0);
shots.push(["11 pm", tClock2, push(CLOCKC, 0.06, 0.7)]);
sfx(tClock2, "knock-tap", 0.35);
const tCheck2 = cutAt(9, 0.05);
putAway(r3(tCheck2 - 0.2), "ruler", -0.5);
tool(tCheck2, CHART, CHART_AT, (c2, w, sp) => grips.phone(c2, w, sp, { side: "L", height: 0.2 }));
shots.push(["read the top line", tCheck2, push(CHECK, 0.12, r3(END_OF(11) - tCheck2 + 0.3))]);
look(r3(T[9] + 0.3), "spud", [-0.6, -0.2], 0.25);   // Sol r1 #13: he reads the chart, then back to the TV
say(9); say(10); say(11);
look(r3(END_OF(10) + 0.2), "spud", [-0.75, 0.05], 0.3);
expr(T[11] - 0.1, "rep", { eye: 0.75, browY: -0.03, tilt: -0.1 }, 0.25);
shots.push(["so small", cutAt(12), push(DADC, 0.10, DUR[12] + 0.5)]);   // wide enough to show the phone at his nose
c.arm(r3(T[12] - 0.2), "wedge", "L", DAD_PHONE_CLOSE, 0.35);   // tease 2: he brings the phone up to his nose
expr(T[12] - 0.2, "wedge", { eye: 0.4, tilt: -0.15, curve: -0.2 }, 0.25);
say(12);

// ---------------------------------------------------------------- why the rule exists: the neighbour
// Sol r1 #18: not the same Dad angle twice; the rep goes back to his post on this cut
shots.push(["like him", cutAt(13), push(KIDC, 0.08, DUR[13] + 0.4)]);
look(r3(T[13] + 0.2), "spud", [0.9, 0.15], 0.3);
c.arm(T[13], "wedge", "R", { o: [0.12, 0.55, -0.25] }, 0.3, "out");   // a thumb back over his shoulder toward the window (the high point stretched over the clock in the kid shot)
say(13);
c.arm(r3(END_OF(13) + 0.15), "wedge", "R", "rest", 0.35); c.arm(r3(END_OF(13) + 0.15), "wedge", "L", DAD_PHONE, 0.35);
expr(END_OF(13) + 0.15, "wedge", { eye: 0.7, tilt: -0.05, curve: -0.1 }, 0.3);
const tWin = cutAt(14, 0.6), tBack = cutAt(13);
putAway(tBack, "chart", -1.0);
c.arm(r3(tBack - 0.02), "rep", "L", "rest", 0.01);
place(tBack, "rep", REP, -28);   // back at his post by the plant, asking across the room (at the window he stood in Dad and hid the neighbour)
A(r3(tBack - 0.02), "rep", "crouch", { to: 0.14, dur: 0.01 });
look(tWin, "rep", [0.35, 0.15], 0);
A(r3(tWin - 0.02), "mash", "show");
shots.push(["interview", tWin, push(REPC, 0.08, r3(END_OF(14) - tWin + 0.2))]);
say(14);
A(r3(cutAt(15) - 0.02), "rep", "hide");   // behind the neighbour's close-up camera: projected from behind onto the captions
shots.push(["one summer", cutAt(15), push(MASH_CU, 0.05, r3(END_OF(17) - T[15] + 0.4))]);
say(15, { pos: 300 }); say(16, { pos: 300 }); say(17, { pos: 300, capTo: r3(cutAt(18, 1.4) - 0.04) });   // Sol r2 #5, #16: above the square eyes, and off before the 3 am clock
{ const tw = r3(Math.floor((T[17] + DUR[17] * 0.36) * 30) / 30);   // Sol r1 #24: cut to the TV on "widescreen", then back
  shots.push(["widescreen", tw, push({ ...TVC, fov: 50 }, 0.04, 0.5)]); shots.push(["squared", r3(tw + 0.5), push(MASH_CU, 0.04, r3(END_OF(17) - tw))]); }   // fov 50: both bezels (Sol r2 #13)

// ---------------------------------------------------------------- 3 am, hour sixteen: the torch
const tClock3 = cutAt(18, 1.4);
A(r3(tClock3 - 0.02), "mash", "hide");
c.prop(r3(tClock3 - 0.02), "clock", { time: 23 }, 0);
c.prop(tClock3, "clock", { time: 27 }, 1.05);   // the hands spin to 3 am
shots.push(["3 am", tClock3, push(CLOCKC, 0.10, 1.35)]);
sfx(tClock3, "whoosh", 0.3);
place(cutAt(18), "rep", REP_CHECK, REP_CHECK_ROT); A(r3(cutAt(18) - 0.02), "rep", "show");
A(r3(cutAt(18) - 0.02), "rep", "crouch", { to: 0.22, dur: 0.01 });
A(cutAt(18), "spud", "lean", { to: 0.25, dur: 0.01 });   // closer to the screen now
shots.push(["whole season", cutAt(18), push(WIDE, 0.18, DUR[18] + GAP[19])]);
say(18);
const tTorch = cutAt(19, 0.6);
tool(cutAt(18), TORCH, TORCH_AT, (c2, w, sp) => grips.mug(c2, w, sp, { side: "L" }));   // in hand already on the wide (taken on the clock shot)
c.prop(r3(tTorch - 0.02), "beam", { x: r3(HAND_AT[0] + 0.08), y: 0.80, z: HAND_AT[2], rot: 90, on: 0 }, 0);
c.prop(r3(tTorch + 0.25), "beam", { on: 1 }, 0.1);
sfx(r3(tTorch + 0.25), "click", 0.5);
expr(r3(tTorch + 0.3), "spud", { eye: 0.55, tilt: 0.1 }, 0.15);   // squints into the light, eyes still round
shots.push(["torch", tTorch, push(CHECK, 0.14, r3(END_OF(19) - tTorch + 0.3))]);
say(19);
c.prop(r3(END_OF(19) + 0.2), "beam", { on: 0 }, 0.1);
expr(r3(END_OF(19) + 0.2), "spud", { eye: 1.1, open: 0.15, tilt: 0 }, 0.2);
A(r3(cutAt(20) - 0.02), "rep", "hide"); putAway(cutAt(20), "torch", -1.5); A(r3(cutAt(20) - 0.04), "rep", "release", { prop: "mic", to: [3.5, -5, -2.0], dur: 0.01 });   // Sol r2 #2: the mic stood alone in front of Tato   // gone after the torch: in front of Tato he filled the kid's shots
shots.push(["five more", cutAt(20), push(DADC, 0.10, DUR[20] + 0.9)]);   // the phone in frame for the beep (Sol r1 #3)
expr(T[20] - 0.1, "wedge", { eye: 0.5, tilt: -0.1, curve: -0.15 }, 0.3);
say(20);
sfx(r3(END_OF(20) + 0.15), "timer-beep", 0.45);   // tease 3: his phone's low battery

// ---------------------------------------------------------------- the flip
const tCard = cutAt(21, 1.5);
shots.push(["still watching", tCard, push(TVC, 0.10, 1.55)]);
c.prop(r3(tCard + 0.2), "tv", { card: 1 }, 0.5);
shots.push(["no", cutAt(21), push(KIDC, 0.06, DUR[21] + GAP[22] + 0.1)]);
A(r3(T[21] - 0.2), "spud", "lean", { to: 0, dur: 0.3 });
say(21);
{ const to = r3(Math.floor((END_OF(21) + 0.1) * 30) / 30);   // Sol r1 #1: we see the screen go black
  shots.push(["tv off", to, push(TVC, 0.03, 0.6)]); c.prop(r3(to + 0.1), "tv", { on: 0 }, 0.05); sfx(r3(to + 0.1), "click", 0.5);   // black almost at once (Sol r2 #4)
  shots.push(["see", r3(to + 0.6), push(KIDC, 0.06, r3(END_OF(22) - to))]); }
look(r3(END_OF(21) + 0.35), "spud", [0.85, 0.1], 0.3);
expr(r3(T[22] - 0.1), "spud", { eye: 1.05, curve: 0.35, tilt: 0.1 }, 0.25);
// rep out of the room for the ending
const tRev = cutAt(23, 1.1);
say(22, { capTo: r3(tRev - 0.05) });
// the reveal: on the cut his eyes are already phones (DESIGN.md: switch on a cut), he lifts his head
// Sol r1 #2: first his head comes up (normal eyes, phone lowering), then the cut to the open phone eyes
const tUp = r3(tRev - 0.5);
A(tUp, "wedge", "noblink");   // a blink on the phone eyes shows two blank skin squares
shots.push(["looks up", tUp, push({ pos: [0.55, 1.05, 1.9], look: [0.73, 0.95, -1.17], fov: 32 }, 0.05, 0.5)]);   // wider: the phone lowering in his hand reads
c.arm(tUp, "wedge", "L", { o: [-0.05, 0.32, 0.40] }, 0.4); look(tUp, "wedge", [0.25, -1.0], 0.01); look(r3(tUp + 0.08), "wedge", [-0.5, 0.45], 0.32); A(r3(tUp + 0.08), "wedge", "pitch", { to: -3, dur: 0.32 });   // chin and eyes up to Tato (Sol r2 #3)   // chin comes up off the phone
face(r3(tRev - 0.02), "wedge", { square: 1, sqTall: 1, sqPhone: 1 });
shots.push(["phone eyes", tRev, push({ ...DAD_CU, fov: 29 }, 0.12, 1.15)]);   // a size step tighter than "looks up" (else a jump cut)
look(r3(tRev - 0.02), "wedge", [-0.55, 0.05], 0.01);
expr(r3(tRev - 0.02), "wedge", { eye: 1.0, tilt: 0, curve: 0 }, 0.01);
sfx(r3(tRev + 0.8), "sting", 0.35);
see(tRev, r3(tRev + 1.05), ["wedge.face"], "the reveal: Dad finally looks up, his eyes are two glowing phones");
shots.push(["screens", cutAt(23), push(KID_TIGHT, 0.06, DUR[23] + 0.5)]);
expr(r3(T[23] - 0.1), "spud", { eye: 0.85, curve: 0, tilt: 0, browY: -0.02 }, 0.15);
say(23);

// ---------------------------------------------------------------- label + storyboard
if (!RHY) cap(0, 3.2, LABEL, LABY, false, { size: 58, kinetic: false });   // the rhyme cut has no label: Jonny adds it himself in TikTok (25 Nov, carrots + gum); its text goes in the post pack
const beats = c.beats(shots, END);

const sb = {
  id: RHY ? "kvd03-square-eyes-rhyme" : "kvd03-square-eyes", title: `Kid vs Dad 03: Square eyes${RHY ? " (rhyming)" : ""} (rough draft)`,
  idea: `Kid vs Dad 03 "Too much TV gives you square eyes": Dad warns Tato all night without once looking up from his phone; the reporter checks Tato's eyes at 8 pm, 11 pm and 3 am; the neighbour shows why the rule exists; at the end Tato's eyes are still round and Dad's are phones.`,
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1230], captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
  captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 200,
  set: { type: "gravroom", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  hud: { news: { label: "SQUARE EYES SPREADING", tag: "LIVE", tagW: 150, count: false, show: [cutAt(3), tCard] } },
  music: { file: "ai/orchestra-suspense/orchestra-suspense-01.ogg", lowCut: 150, gain: 0.14 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood", room: "livingroom" },
  creative: { length: [END, END] },
  hook: { show: ["mash"], hint: 0, what: LINES[0][1] },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "sitting on the sofa" },
    { who: "wedge", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "sitting on the sofa" },
    { who: "rep", with: "ruler", from: r3(tCheck1 - 0.2), to: tCheck2, checks: ["thin-prop-hidden"], reason: "a school ruler held at its very end, as a kid holds one up to an eye: the long end shows, the held end is in the fist by design (props-sqeyes.js smallruler, thin pinch from 0)" },
  ],
  notes: `Generated by storyboards/series/kid-vs-dad/03-square-eyes/make-episode.mjs. Dad = ${DAD_CHAR}. Rough draft for Jonny's story check (opening H1, ending E1).`,
};
write(import.meta.url, sb);
console.log(`spoken lengths: ${LINES.filter(([, l]) => SPOKEN[l] == null).length} estimated`);
