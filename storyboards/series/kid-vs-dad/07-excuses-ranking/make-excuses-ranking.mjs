// KID VS DAD 07 "Ranking Dad's excuses" (Jonny 26 Nov 2026 21:05 Berlin: hook H2 + ending E1, ranking R1 = trophies).
//   node storyboards/series/kid-vs-dad/07-excuses-ranking/make-excuses-ranking.mjs -> excuses-ranking.json
// Options: /mnt/project-files/videos/kid-vs-dad/07-excuses-ranking/OPTIONS.md. Lines: ./lines.mjs. No panel sheet: every set,
// character and prop is reused (ep 3 living room "gravroom", Tato, Dad B, the what-if 03 trophy at five sizes).
// Chain: POWER WORD hook "the worst excuses in the world" -> NAME (Dad: "Tato.") + entry 5 -> STAKE the park closes at eight
// (wall clock) -> RULE told by Dad: "Nothing in the world gets me off this sofa." -> four tries, each bigger, each an excuse
// (bribe x2 / the clock x2 / around him: ask your mother, the ping-pong breaks the ladder) -> SECOND LOOP "number one... the
// worst one" -> "My back." -> the ice cream jingle -> Dad springs off the sofa and bolts -> "...Number one." CUT.
// Natural counter: the trophy row on the rug fills 5 -> 2 (smallest first), the giant cup waits beside Tato for number one;
// the wall clock 5 pm -> 6 -> 7 -> quarter to 8. No rank text burned in (Jonny 25 Nov): "Number four" is a spoken subtitle.
// Teases of the twist (Dad CAN move): a faint jingle at "five more minutes" opens one eye; his hand on his back at 4 and 1.
import fs from "node:fs";
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { LINES } from "./lines.mjs";

const SPOKEN = (() => { try { return JSON.parse(fs.readFileSync(new URL("./spoken.json", import.meta.url))); } catch { return {}; } })();
const est = (l) => r3(0.45 + l.split(/\s+/).length * 0.34);
const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const onCut = (t) => r3(Math.floor(t * 30 + 1e-6) / 30 - 0.02);   // c.beats snaps a shot DOWN to its frame
const DUR = LINES.map(([, l], i) => (Array.isArray(SPOKEN) ? SPOKEN[i] : null) ?? est(l));

// ---------------------------------------------------------------- places (gravroom: x right, +z toward the camera, back wall z -2.65)
const SOFA = [0.2, -1.61], SEAT = 0.45;
const DAD = [0.42, -1.52];
const TATO = [-0.45, -0.45], YAW_CAM = 12, YAW_DAD = 128;   // to the camera / to Dad (set on cuts only)
const GIANT = [-0.80, -0.95];
const ROW = [[0.02, -0.86, 0.55], [0.34, -0.88, 0.80], [0.70, -0.90, 1.10], [1.12, -0.92, 1.45]];   // x, z, scale: entries 5, 4, 3, 2
const TV = [-1.52, -0.99, 34];
const CLOCK = { x: 0.20, y: 1.62, z: -2.62 };

const cast = [
  { id: "spud", character: "potatobrawl/spud-kid", at: TATO, face: YAW_CAM, expr: "kind", follow: 0, seed: 4.1 },
  { id: "dad", character: "potatobrawl/dad", at: DAD, face: 0, expr: "deadpan", follow: 0, seed: 2.9 },
  { id: "mom", character: "potatobrawl/mash", at: [6, 4], face: 0, follow: 0, seed: 1.1 },   // off screen, voice only (never shown)
];
const cups = ROW.map(([x, z, s], i) => ({ id: `cup${5 - i}`, kind: "trophy", x, y: -9, z, rot: -8 + i * 5, scale: s, glint: 0 }));
const props = [
  { id: "sofa", kind: "gsofa", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, sink: 0.02, damage: 0 },
  { id: "tv", kind: "gtv", x: TV[0], y: 0, z: TV[1], rot: TV[2], glow: 1, picture: "cartoon", light: 0.55, castLight: 4, on: 1, card: 0 },
  { id: "lamp", kind: "glamp", x: -1.75, y: 0, z: -2.35, rot: 180 },
  { id: "plant", kind: "gplant", x: 1.80, y: 0, z: -1.60 },
  { id: "rug", kind: "grug", x: 0.18, y: 0, z: 0.11 },
  { id: "clock", kind: "wallclock", ...CLOCK, rot: 0, time: 17, staged: "hung on the back wall over the sofa" },
  { id: "giant", kind: "trophy", x: GIANT[0], y: 0, z: GIANT[1], rot: 18, scale: 2.6, glint: 0, staged: "a giant cup standing on the floor beside Tato" },
  ...cups,
];

// ---------------------------------------------------------------- helpers
const SUB = 400;
const CAPTEXT = {
  "My dad has the worst excuses in the world. I ranked them.": "My dad has the *worst excuses* in the world. I ranked them.",
  "Tato. I'm not asleep. I'm resting my eyes.": "*Tato.* I'm not asleep. I'm *resting my eyes.*",
  "Number five.": "*Number five.*", "Dad. The park closes at eight.": "Dad. The park closes *at eight.*",
  "Nothing in the world gets me off this sofa.": "*Nothing in the world* gets me off this sofa.", "Challenge accepted.": "*Challenge accepted.*",
  "I'll clean your room.": "I'll clean *your* room.", "I'll clean the whole house.": "I'll clean *the whole house.*",
  "We'll see means no. Number four.": "*We'll see* means *no.* Number four.", "Dad. It's six.": "Dad. It's *six.*",
  "It's seven.": "It's *seven.*", "Dad. The TV is off.": "Dad. The TV is *off.*",
  "His minutes are an hour long. Number three.": "His minutes are *an hour* long. *Number three.*", "Number two.": "*Number two.*",
  "And number one... the worst one.": "And number one... *the worst one.*", "Dad. Quarter to eight. Last chance.": "Dad. Quarter to eight. *Last chance.*",
  "I can't, buddy. My back.": "I can't, buddy. *My back.*", "Ice cream!": "*ICE CREAM!*", "...Number one.": "...*Number one.*",
};
const T = [];
const say = (i, at, { capTo } = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  A(r3(T[i] - 0.06), who, "expr", { set: { open: 0.1 }, dur: 0.05 });   // the talk moves a closed mouth only
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false });
  cap(T[i], capTo ?? r3(T[i] + DUR[i] + 0.25), CAPTEXT[line] ?? line, SUB, false, { size: 62 });
  return r3(T[i] + DUR[i]);
};
const at0 = (t, dur) => (dur <= 0.011 && t > 0.05 ? onCut(t) : r3(t));   // an instant change lands just before its cut (never before 0)
const look = (t, who, to, dur = 0.2) => A(at0(t, dur), who, "look", { to, dur, blink: false });
const expr = (t, who, e, dur = 0.2) => A(at0(t, dur), who, "expr", typeof e === "string" ? { expr: e, dur } : { set: e, dur });
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const yaw = (t, who, to) => A(onCut(t), who, "turn", { to, dur: 0.01, ease: "linear", sync: true });
const P = (t, id, set, dur = 0) => c.prop(r3(t), id, set, dur);
const shots = [];
const shot = (name, t, cam, mark) => shots.push(mark ? [name, r3(t), cam, mark] : [name, r3(t), cam]);
const push = (s, k = 0.07, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur: r3(dur), ease: "inOut" });

// cameras (every shot pushes a little; Jonny 20 Nov: no still shots)
const HOOK = { pos: [-0.30, 0.95, 2.15], look: [-0.22, 0.62, -1.0], fov: 50 };    // Tato front left, Dad asleep behind him
const KID = { pos: [0.03, 0.52, 1.80], look: [-0.58, 0.42, -0.55], fov: 36 };    // Tato to the camera, the giant cup at his right
const KID_CU = { pos: [-0.12, 0.46, 1.15], look: [-0.45, 0.40, -0.45], fov: 34 };
const OTS = { pos: [-1.20, 0.95, 0.75], look: [0.42, 0.85, -1.52], fov: 40 };     // over Tato's shoulder onto Dad
const DADC = { pos: [0.38, 1.02, 1.30], look: [0.42, 0.95, -1.52], fov: 33 };
const DAD_CU = { pos: [0.40, 1.00, 0.85], look: [0.42, 0.90, -1.52], fov: 35 };
const ROWC = { pos: [0.36, 0.40, 1.90], look: [0.36, 0.18, -0.80], fov: 46 };     // low on the rug: the row, Dad's shins behind
const CLOCKC = { pos: [0.20, 1.50, -1.30], look: [CLOCK.x, CLOCK.y, CLOCK.z], fov: 30 };
const WIDE = { pos: [0.40, 1.30, 3.30], look: [0.40, 0.70, -1.00], fov: 64 };
// the row shot per entry: framed on the cups there are, so the row grows wider each time (5: one cup, 2: all four)
const rowCam = (n) => { const xs = ROW.slice(0, n).map((r) => r[0]), x = r3((Math.min(...xs) + Math.max(...xs)) / 2), d = [1.4, 1.8, 2.4, 3.1][n - 1];
  return { pos: [x, r3(0.22 + d * 0.1), r3(-0.88 + d)], look: [x, 0.16, -0.88], fov: 42 }; };
const GIANTC = { pos: [-0.12, 0.58, 1.50], look: [-0.62, 0.45, -0.70], fov: 38 };   // Tato and the giant cup, both

const FACE = {
  asleep: { eye: 0.04, tilt: 0.05, curve: 0.15, open: 0.1 },
  oneEye: { eye: 0.45, tilt: -0.1 },
  awake: { eye: 1.3, pupil: 0.65, tilt: 0.35, browY: 0.05, open: 0.5, curve: 0.3 },
  pain: { eye: 0.15, tilt: 0.3, curve: -0.5, browY: 0.02 },
  shout: { eye: 0.6, tilt: -0.1, open: 0.55 },
  flat: { eye: 0.7, tilt: -0.05, browY: -0.02, curve: -0.05 },
  sly: { eye: 0.6, tilt: -0.2, curve: 0.25, smirk: 0.4 },
  hope: { eye: 1.1, pupil: 0.8, tilt: 0.25, curve: 0.25 },
};

// ---------------------------------------------------------------- frame 0
A(0, "dad", "sit", { rot: 0, height: SEAT, dur: 0, hands: "lap", feet: [0.06, 0.04] });
A(0, "dad", "pitch", { to: -6, dur: 0 });   // head back on the sofa, asleep
expr(0, "dad", FACE.asleep, 0);
A(0, "dad", "noblink");
A(0, "mom", "hide");
expr(0, "spud", FACE.sly, 0); look(0, "spud", [0, 0], 0);
P(0, "clock", { time: 17 }, 0);
P(0, "giant", { glint: 0 }, 0);
for (const k of cups) P(0, k.id, { y: -9, glint: 0 }, 0);
// Dad breathes asleep: a slow squash in and out while his eyes are shut (stops when he wakes)

// ---------------------------------------------------------------- 0-6 s: hook H2, the name, entry 5
let t = 0.12, e;
shot("hook", 0, push(HOOK, 0.05, 3.6), "hook");
see(0, 1.2, ["spud.face", "dad.face"], "frame 0: a kid whispering to us in front of his dad asleep on the sofa, a giant gold cup beside him");
e = say(0, t);
const C1 = onCut(e + 0.15) + 0.02;
shot("not asleep", C1, push(DADC, 0.06, DUR[1] + 0.6));
e = say(1, C1 + 0.12);
const C2 = r3(e + 0.12);
P(onCut(C2), "cup5", { y: 0 }, 0); P(C2 + 0.1, "cup5", { glint: 1 }, 0.15); P(C2 + 0.5, "cup5", { glint: 0 }, 0.3);
shot("five", C2, push(rowCam(1), 0.08, DUR[2] + 0.8));
sfx(r3(C2 + 0.05), "tink", 0.4);
e = say(2, C2 + 0.15);

// ---------------------------------------------------------------- 6-14 s: the stake (the clock) + the rule (Dad) + "Challenge accepted."
const C3 = r3(e + 0.35);
shot("five pm", C3, push(CLOCKC, 0.06, 0.7));
sfx(r3(C3 + 0.05), "knock-tap", 0.3);
const C4 = r3(C3 + 0.7);
yaw(C4, "spud", YAW_DAD); expr(C4 - 0.02, "spud", FACE.flat, 0.01);
shot("park", C4, push(OTS, 0.06, DUR[3] + 0.4));
e = say(3, C4 + 0.1);
const C5 = r3(e + 0.15);
shot("nothing", C5, push(DAD_CU, 0.10, DUR[4] + 0.5));
e = say(4, C5 + 0.1);
const C6 = r3(e + 0.3);
yaw(C6, "spud", YAW_CAM); expr(C6 - 0.02, "spud", FACE.sly, 0.01); look(C6, "spud", [0, 0], 0.01);
shot("challenge", C6, push(KID_CU, 0.06, DUR[5] + 0.5));
e = say(5, C6 + 0.1);

// ---------------------------------------------------------------- 14-26 s: entry 4, the bribe twice, "We'll see."
const C7 = r3(e + 0.3);
yaw(C7, "spud", YAW_DAD); expr(C7 - 0.02, "spud", FACE.hope, 0.01);
shot("my room", C7, push(OTS, 0.05, DUR[6] + 0.3));
e = say(6, C7 + 0.1);
const C8 = r3(e + 0.1);
shot("we'll see 1", C8, push(DADC, 0.05, DUR[7] + 0.4));
e = say(7, C8 + 0.1);
const C9 = r3(e + 0.15);
shot("your room", C9, push({ ...OTS, fov: 34 }, 0.06, DUR[8] + 0.3));
e = say(8, C9 + 0.05);
const C10 = r3(e + 0.1);
shot("we'll see 2", C10, push(DADC, 0.08, DUR[9] + 0.5));
arm(C10, "dad", "R", { o: [0.30, 0.42, -0.22] }, 0.45);   // tease: his hand goes to his lower back
e = say(9, C10 + 0.15);
arm(e + 0.2, "dad", "R", "lap", 0.4);
const C10b = r3(e + 0.15);
shot("whole house", C10b, push({ ...OTS, fov: 30 }, 0.07, DUR[10] + 0.3));
e = say(10, C10b + 0.05);
const C10c = r3(e + 0.1);
shot("we'll see 3", C10c, push(DAD_CU, 0.06, DUR[11] + 0.5));
e = say(11, C10c + 0.15);
const C11 = r3(e + 0.3);
yaw(C11, "spud", YAW_CAM); expr(C11 - 0.02, "spud", FACE.flat, 0.01); look(C11, "spud", [0, 0], 0.01);
shot("means no", C11, push(KID, 0.08, DUR[12] + 0.4));
e = say(12, C11 + 0.1, { capTo: r3(T[12] + DUR[12] + 0.6) });
const C12 = r3(e + 0.12);
P(onCut(C12), "cup4", { y: 0 }, 0); P(C12 + 0.1, "cup4", { glint: 1 }, 0.15); P(C12 + 0.5, "cup4", { glint: 0 }, 0.3);
shot("four", C12, push(rowCam(2), 0.06, 0.75));
sfx(r3(C12 + 0.05), "tink", 0.45);

// ---------------------------------------------------------------- 26-40 s: entry 3, the clock (6, then 7), the jingle tease
const C13 = r3(C12 + 0.75);
P(onCut(C13), "clock", { time: 17 }, 0); P(C13 + 0.05, "clock", { time: 18 }, 0.5);
shot("six pm", C13, push(CLOCKC, 0.06, 0.7));
sfx(r3(C13 + 0.05), "whoosh", 0.3);
const C14 = r3(C13 + 0.7);
yaw(C14, "spud", YAW_DAD);
shot("it's six", C14, push(OTS, 0.05, DUR[13] + 0.3));
e = say(13, C14 + 0.1);
const C15 = r3(e + 0.1);
expr(C15 - 0.02, "dad", FACE.oneEye, 0.01); look(C15, "dad", [-0.45, -0.05], 0.01);   // half awake: eyes to the TV
shot("five more 1", C15, push(DADC, 0.06, DUR[14] + 0.4));
e = say(14, C15 + 0.1);
const C16 = r3(e + 0.25);
P(onCut(C16), "clock", { time: 18 }, 0); P(C16 + 0.05, "clock", { time: 19 }, 0.5);
shot("seven pm", C16, push(CLOCKC, 0.08, 0.7));
sfx(r3(C16 + 0.05), "whoosh", 0.3);
const C17 = r3(C16 + 0.7);
shot("it's seven", C17, push({ ...OTS, fov: 34 }, 0.06, DUR[15] + 0.3));
e = say(15, C17 + 0.05);
// tease 1: far away an ice cream jingle; Dad's eye snaps wide for a moment, then the same line
const C18 = r3(e + 0.1);
shot("jingle tease", C18, push(DAD_CU, 0.06, 1.3));
sfx(r3(C18 + 0.05), "ai/icecream-jingle", 0.12);
expr(C18 + 0.35, "dad", FACE.awake, 0.12); look(C18 + 0.35, "dad", [0.6, 0.15], 0.12);   // toward the window behind the sofa's right end
expr(C18 + 1.0, "dad", FACE.oneEye, 0.25); look(C18 + 1.0, "dad", [-0.45, -0.05], 0.25);
e = say(16, C18 + 1.3);
const C18b = r3(e + 0.25);
shot("tv off", C18b, push({ pos: [-0.68, 0.90, 0.26], look: [TV[0], 0.78, TV[1]], fov: 40 }, 0.04, 0.8));
P(C18b + 0.3, "tv", { on: 0 }, 0.05); sfx(r3(C18b + 0.3), "click", 0.5);
const C18c = r3(C18b + 0.8);
yaw(C18c, "spud", YAW_DAD); expr(C18c - 0.02, "spud", FACE.flat, 0.01);
shot("tv is off", C18c, push({ ...OTS, fov: 32 }, 0.06, DUR[17] + 0.3));
e = say(17, C18c + 0.1);
const C18d = r3(e + 0.1);
shot("five more 3", C18d, push(DADC, 0.10, DUR[18] + 0.6));
e = say(18, C18d + 0.2);
const C19 = r3(e + 0.3);
yaw(C19, "spud", YAW_CAM); look(C19, "spud", [0, 0], 0.01);
shot("hour long", C19, push(KID, 0.08, DUR[19] + 0.4));
e = say(19, C19 + 0.1, { capTo: r3(T[19] + DUR[19] + 0.6) });
const C20 = r3(e + 0.12);
P(onCut(C20), "cup3", { y: 0 }, 0); P(C20 + 0.1, "cup3", { glint: 1 }, 0.15); P(C20 + 0.5, "cup3", { glint: 0 }, 0.3);
shot("three", C20, push(rowCam(3), 0.06, 0.75));
sfx(r3(C20 + 0.05), "tink", 0.5);

// ---------------------------------------------------------------- 40-54 s: entry 2, around him: "Ask your mother." ping-pong (the ladder's break)
const C21 = r3(C20 + 0.75);
yaw(C21, "spud", YAW_DAD); expr(C21 - 0.02, "spud", FACE.hope, 0.01); expr(C21 - 0.02, "dad", FACE.asleep, 0.01); look(C21, "dad", [0, 0], 0.01);
shot("alone", C21, push(OTS, 0.05, DUR[20] + 0.3));
e = say(20, C21 + 0.1);
const C22 = r3(e + 0.1);
shot("ask mother 1", C22, push(DADC, 0.05, DUR[21] + 0.3));
e = say(21, C22 + 0.1);
// the kitchen is off screen right: the voices come from there, the heads swing there and back
const C23 = r3(e + 0.1);
yaw(C23, "spud", YAW_CAM); look(C23, "spud", [0, 0], 0.01); expr(C23 - 0.02, "spud", FACE.flat, 0.01);
shot("ping", C23, push(KID_CU, 0.05, DUR[22] + 0.35));
look(C23 + 0.05, "spud", [0.9, 0.05], 0.12);
e = say(22, C23 + 0.15);
const C24 = r3(e + 0.05);
expr(C24 - 0.02, "dad", FACE.shout, 0.01); look(C24, "dad", [0.9, 0.1], 0.01);
shot("pong", C24, push(DADC, 0.08, DUR[23] + 0.3));
e = say(23, C24 + 0.1);
const C25 = r3(e + 0.05);
shot("ping 2", C25, push(KID_CU, 0.09, DUR[24] + 0.35));
look(C25 + 0.02, "spud", [-0.5, 0.15], 0.01); look(C25 + 0.1, "spud", [0.9, 0.05], 0.1);
e = say(24, C25 + 0.12);
const C26 = r3(e + 0.2);
look(C26, "spud", [0, 0], 0.01);
shot("two", C26, push(KID, 0.06, DUR[25] + 0.25));
e = say(25, C26 + 0.1);
const C27 = r3(e + 0.12);
P(onCut(C27), "cup2", { y: 0 }, 0); P(C27 + 0.1, "cup2", { glint: 1 }, 0.15); P(C27 + 0.5, "cup2", { glint: 0 }, 0.3);
shot("row of four", C27, push(rowCam(4), 0.06, 0.9));
sfx(r3(C27 + 0.05), "tink", 0.55);

// ---------------------------------------------------------------- 54-66 s: the second loop, the last chance, "My back."
const C28 = r3(C27 + 0.9);
shot("number one", C28, push(GIANTC, 0.12, DUR[26] + 0.6));
expr(C28 - 0.02, "spud", FACE.sly, 0.01);
P(C28 + 0.3, "giant", { glint: 1 }, 0.2);
e = say(26, C28 + 0.15);
P(e + 0.2, "giant", { glint: 0 }, 0.3);
const C29 = r3(e + 0.35);
P(onCut(C29), "clock", { time: 19 }, 0); P(C29 + 0.05, "clock", { time: 19.75 }, 0.4);
shot("quarter to", C29, push(CLOCKC, 0.08, 0.6));
const C30 = r3(C29 + 0.6);
yaw(C30, "spud", YAW_DAD); expr(C30 - 0.02, "spud", FACE.flat, 0.01);
shot("last chance", C30, push({ ...OTS, fov: 32 }, 0.08, DUR[27] + 0.3));
e = say(27, C30 + 0.1);
const C31 = r3(e + 0.1);
expr(C31 - 0.02, "dad", FACE.pain, 0.01);
shot("my back", C31, push(DAD_CU, 0.08, DUR[28] + 1.3));
arm(C31 + 0.05, "dad", "R", { o: [0.30, 0.42, -0.22] }, 0.35);
e = say(28, C31 + 0.2);

// ---------------------------------------------------------------- the ending E1: the jingle, the sprint, "...Number one." CUT
const tJ = r3(e + 0.25);
sfx(tJ, "ai/icecream-jingle", 0.55);
expr(tJ + 0.45, "dad", FACE.awake, 0.08); look(tJ + 0.45, "dad", [0.4, 0.2], 0.08);
arm(tJ + 0.3, "dad", "R", "lap", 0.35);
const tUp = r3(tJ + 0.75);
e = say(29, tUp);
A(tUp, "dad", "stand", { dur: 0.3 });   // springs up out of the close-up's top
sfx(r3(tUp + 0.05), "cushion-poof", 0.5);
const C32 = r3(tUp + 0.45);
const RUN_TO = [2.0, 2.85];
A(onCut(C32), "dad", "move", { to: [1.30, -0.30], dur: 0.01, steps: 0, ease: "linear", sync: true });   // already up and a step out on the cut
A(onCut(C32), "dad", "turn", { to: 70, dur: 0.01, ease: "linear", sync: true });
A(r3(C32 + 0.02), "dad", "move", { to: RUN_TO, dur: 0.75, steps: 4, stride: 0.45, ease: "in" });
shot("bolts", C32, push(WIDE, 0.04, 1.2));
sfx(r3(C32 + 0.1), "whoosh", 0.5);
yaw(C32, "spud", YAW_DAD); look(C32 + 0.1, "spud", [0.6, 0], 0.1); look(C32 + 0.45, "spud", [-0.4, 0], 0.25);
expr(C32 - 0.02, "spud", FACE.flat, 0.01);
const C33 = r3(C32 + 1.2);
A(onCut(C33), "dad", "hide");
yaw(C33, "spud", YAW_CAM); look(C33, "spud", [0, 0], 0.01); expr(C33 - 0.02, "spud", { eye: 0.55, tilt: -0.1, curve: -0.1, browY: -0.02 }, 0.01);
shot("number one", C33, push(GIANTC, 0.06, DUR[30] + 0.8));
e = say(30, C33 + 0.35);
const END = r3(e + 0.45);   // end on the punchline (Jonny 20 Nov)

const beats = c.beats(shots, END);
const sb = {
  id: "excuses-ranking", title: "Kid vs Dad 07: Ranking Dad's excuses (rough draft)",
  idea: "Kid vs Dad 07: Tato ranks his dad's worst excuses live, from 'I'm resting my eyes' to number one, 'My back' - which Dad disproves the second the ice cream truck plays.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [200, 1230], captionStyle: "kinetic", castLook: "sheet", cleanStart: true,
  captionOverBody: { reason: "close-ups where the speaker fills the phone frame; captions in the upper third over the body, never the eyes (rule from the 8-min film trial, Jonny OK 20 Nov)" },
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, far: 200,
  set: { type: "gravroom", aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, signature: false, surface: "wood", room: "livingroom" },
  creative: { length: [END, END] },
  hook: { show: ["spud", "dad"], hint: 0, what: LINES[0][1] },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "dad", with: "sofa", from: 0, to: r3(C32 + 0.1), checks: ["shell", "clipping", "limb-in-prop", "hand-in-prop", "costume-in-prop"], reason: "sitting on the sofa" },
  ],
  notes: "Generated by storyboards/series/kid-vs-dad/07-excuses-ranking/make-excuses-ranking.mjs. Rough draft for Jonny's story check (hook H2, ending E1, ranking R1). Mom is never shown (voice from the kitchen off screen right).",
};
write(import.meta.url, sb);
console.log(`spoken lengths: ${Array.isArray(SPOKEN) && SPOKEN.length === LINES.length ? "measured" : "ESTIMATED"}, end ${END} s`);
