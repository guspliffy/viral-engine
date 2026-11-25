// POTATO DESK 13 "Who's in your hell?" (heaven/hell 4, idea A; Jonny 25 Nov 2026: A picked 13:36, no spoken names, the
// hero is one of the four friends (Spud), the screamer is his own friend Mash; hook H1 picked 13:49 Berlin).
// Outline v3 + panel sheet: /mnt/project-files/videos/potato-desk/heaven-hell-4/ (OUTLINE-A-v3.md, codex/whos-hell-sheet-v1.png).
// Design (sizes, marks, cameras): DESIGN.md next to this file. Lines: lines.mjs (voices x1.2, Jonny 25 Nov).
//   node storyboards/series/potato-desk/13-whos-in-your-hell/make-whos-in-your-hell.mjs -> whos-in-your-hell.json
//
// Hook pattern (Jonny 25 Nov): power word (HELL) -> short question ("Who's in my hell?") -> the rule ("forever, with
// everyone who ever annoyed you") -> the story escalates the rule (chewer, reply-all, spoiler) and teases the answer (the
// star seat "for the worst one", three times) -> fast end on the answer (he is the worst one: his friend screams at his pen).
// Label at 0 s (ffmpeg after the render, not a caption): "Hell = forever with people who annoy you".
// Chain: he is dead, so the Devil seats him; the rule is forever with the people who annoy you, so a chewer sits on his
// one side, so he asks him to chew quieter and gets "Nope", so a reply-all guy squeezes him from the other side and his
// phone pings, so a wizard spoils every film over the couch, so he snaps; the star seat is for the worst one, so the door
// rattles and he clicks his pen in fear; wrong page: he is not in a hell, he IS one, so he goes free and his friend walks
// in for eternity: "NOT THE PEN!". The pen is planted from frame 1 (his nervous habit). End on the scream.
// Built simpler than the design where a hand would carry a prop through a walk (clip lessons: hold props): the bucket and
// Wedge's phone are worn (spec.wear) with the hands posed on them; the Wizard's crystal ball rests on the couch's back,
// his glove over it; the Devil places on cuts only.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { sfx, cap, see } = c;
const CUTS = new Set();
const A = (t, ...rest) => c.A(CUTS.has(r3(t)) ? r3(t - 0.02) : t, ...rest);   // an action set at a cut lands 0.02 s early
// a cut on the 2-frame grid, its start rounded UP to the millisecond: c.beats snaps a start DOWN to its frame, and 83/15 =
// 5.5333 written as 5.533 became frame 165 (5.500): every place set at start - 0.02 then showed two frames into the shot
const F2 = (t) => Math.ceil((Math.round(t * 15) * 2 / 30) * 1000 - 1e-6) / 1000;

// measured spoken lengths (node qa/lines.mjs desk13-voice-probe.json, 25 Nov 2026), in LINES order
const DUR = [1.07, 0.81, 2.95, 1.77, 1.16, 2.00, 0.35, 1.29, 1.75, 2.48, 0.46, 1.36, 0.59, 2.89, 0.90, 1.23, 1.61, 1.50, 1.02, 0.91, 0.57, 0.61];
const T = new Array(LINES.length).fill(null);
const END_OF = (i) => r3(T[i] + DUR[i]);

// ---------------------------------------------------------------- places (DESIGN §1-2, §4; x right, z toward us)
const AWAY = -60;
const SEAT = { seat: "couch", height: 0.32, feet: [0.32, 0] };
const SPUD_AL = -0.20, CHIP_AL = 0.46, WEDGE_AL = -1.08;   // squeezed from the start (no slides: a held pen slips on a slide)
const SPUD0 = [SPUD_AL, 0.03];
const D1 = [1.85, 0.70], D4 = [1.55, 1.50], DOORBOX = [2.25, -1.90];
const WIZ = [0.36, -0.87], STEP_Y = 0.40;   // right of the hero's head as cam 09 sees it (layout 4)
const S15 = [0.78, 2.30];
const MASH_IN = [2.25, -1.55];
const PARK = { chip: [-30, 5], wedge: [-34, 5], wizard: [-38, 5], mash: [-42, 5], devil: [-46, 5] };
const fwd = (p, yaw, d, side = 0) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + Math.sin(a) * d + Math.cos(a) * side), r3(p[1] + Math.cos(a) * d - Math.sin(a) * side)]; };

const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "devil", character: "potatobrawl/devil", at: D1, face: -30, expr: "delighted", follow: 0.3, seed: 6.6 },
  { id: "chip", character: "potatobrawl/chip", at: DOORBOX, face: 0, expr: "kind", follow: 0.4, seed: 2.3 },
  { id: "wedge", character: "potatobrawl/wedge", at: PARK.wedge, face: -90, expr: "deadpan", follow: 0.3, seed: 3.1 },
  { id: "wizard", character: "potatobrawl/wizard", at: WIZ, y: STEP_Y, face: -8, expr: "smug", follow: 0.3, seed: 4.4 },
  { id: "mash", character: "potatobrawl/mash", at: [2.45, -2.05], face: -15, expr: "happy", follow: 0.3, seed: 5.2 },
];

// ---------------------------------------------------------------- props
const at3 = (x, y, z) => ({ x: r3(x), y: r3(y), z: r3(z) });
const PEN_AT = [r3(SPUD_AL + 0.19), 0.50, 0.40];   // the pen's felt end, in front of his belly on his right (screen left... his R hand)
const PEN = { id: "pen", kind: "feltpen", scale: 1.7, color: "#d9342b", cap: "#c9ced6", felt: "#1d1a20", ...grips.placeFor("feltpen", PEN_AT, 0) };
const PEN2_AT = [r3(S15[0] + 0.15), 0.26, r3(S15[1] + 0.42)];   // up in front of his belly: the payoff prop reads (stills 1)   // standing (shot 15): the same hand, lower
const PEN2 = { staged: "parked under the world until a hand takes it on a cut", id: "pen2", kind: "feltpen", scale: 1.7, color: "#d9342b", cap: "#c9ced6", felt: "#1d1a20", ...grips.placeFor("feltpen", [PEN2_AT[0], AWAY, PEN2_AT[2]], 5) };
const PP_AT = [r3(SPUD_AL + 0.34), 0.50, 0.42];   // his phone, shot 08: up in his left hand, screen to the lens
const PPHONE = { staged: "parked under the world until a hand takes it on a cut", id: "pphone", kind: "pingphone", scale: 1.8, count: 0, ...grips.placeFor("pingphone", [PP_AT[0], AWAY, PP_AT[2]], 0, { turn: 180 }) };
const CLIP_AT = (p, yaw) => { const q = fwd(p, yaw, 0.32, 0.17); return [q[0], 0.28, q[1]]; };   // the Devil's clipboard in his left hand
const CLIPB = { staged: "parked under the world until a hand takes it on a cut", id: "clip", kind: "clipboard", face: 1, flip: 0, ...grips.placeFor("clipboard", [CLIP_AT(D4, 12)[0], AWAY, CLIP_AT(D4, 12)[2]], 12) };
// the chewer's popcorn bucket and the reply-all guy's phone are worn (body frame: x his left, y up from his body's bottom,
// z his front), the hands posed on them
const BUCKET_WALK = { x: 0, y: 0.02, z: 0.40 }, BUCKET_LAP = { x: 0, y: -0.08, z: 0.40 };
const BK_R = 0.135;   // the bucket's radius at half height at scale 0.75
const props = [
  { id: "room", staged: "the waiting room's shell", kind: "lobbyroom", ...at3(0, 0, 0), w: 6.4, front: 9.5, holes: [[1.75, 2.75, 0, 1.58]] },
  { id: "door", staged: "set in the back wall", kind: "reviewdoor", ...at3(2.25, 0, -1.30), side: "hell", scale: 1.3, inside: true, smoke: true, mat: false, open: 0, glow: 0 },
  { id: "clock", staged: "hung on the back wall", kind: "wallclock", ...at3(1.00, 2.05, -1.28), r: 0.26, dial: "#ead9c4", hands: false, rim: "#8a5a34" },
  { id: "lava", staged: "light on the floor from the lava off screen", kind: "lightpool", ...at3(-2.40, 0.008, 1.20), w: 2.6, d: 1.8, color: "#ff7a1c", on: 0.55 },
  { id: "feet1", staged: "shadow on the floor under the door", kind: "shadowpool", ...at3(2.10, AWAY, -1.14), w: 0.16, d: 0.10 },
  { id: "feet2", staged: "shadow on the floor under the door", kind: "shadowpool", ...at3(2.40, AWAY, -1.14), w: 0.16, d: 0.10 },
  { id: "couch", staged: "stands on the floor", kind: "hellcouch", ...at3(0, 0, 0), glow: 0, step: true },
  { id: "ball", staged: "rests on the couch's back roll", kind: "crystalball", ...at3(0.88, AWAY, -0.43), glow: 1 },
  PEN, PEN2, PPHONE, CLIPB,
  { id: "bucket", staged: "worn: held in the chewer's arms", kind: "cinemabucket", wear: "chip", ...BUCKET_WALK, scale: 0.75, fill: 1, puff: 0 },
  { id: "wphone", staged: "worn: in the reply-all guy's two hands", kind: "phone", wear: "wedge", x: 0, y: 0.40, z: 0.34, rot: 180, tip: -30, scale: 1.8, case: "#1d1a20", glow: 1, halo: 0.26 },
  { id: "crumbs", staged: "popcorn on his shoulder", kind: "popcornpile", wear: "spud", x: 0.26, y: 0.55, z: 0.04, r: 0.07, n: 7, h: 0.02, fill: 0, seed: 3 },
  { id: "floorpile", staged: "popcorn on the floor", kind: "popcornpile", ...at3(0.38, 0, 0.55), r: 0.14, n: 9, h: 0.03, fill: 0, seed: 7 },
];

// ---------------------------------------------------------------- helpers
const SUB = 470;   // captions: rows 470-640 (DESIGN §0), under the in-app label band
const CAPTEXT = { 0: "Welcome to *HELL.*", 2: "One rule. *Forever...* with everyone who ever annoyed you.", 4: "...is for *the worst one.*", 9: "I'm *DEAD.* Why do I still have a phone?", 14: "I'm *ALREADY* dead!", 19: "You're *his* hell.", 21: "*NOT THE PEN!*" };
const say = (i, at, extra = {}) => {
  T[i] = r3(at);
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who, "say", { line, tone, style, ...o, dur: DUR[i], caption: false, ...extra });
  cap(T[i], r3(END_OF(i) + 0.3), CAPTEXT[i] ?? line, SUB, false, { size: 64 });
  return END_OF(i);
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(t, who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(t, who, "grip", { side, shape, dur });
const step = (t, who, to, dur, o = {}) => A(t, who, "move", { to, dur, ...o });
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(t, who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2, set) => A(t, who, "expr", { expr: e, dur, ...(set && { set }) });
const HIDDEN = new Set(["chip", "wedge", "wizard", "mash"]);
const place = (t, who, to, yaw, y = 0) => {
  if (CUTS.has(t) && !HIDDEN.has(who)) { A(r3(t - 0.029), who, "hide"); A(r3(t - 0.02), who, "show"); }
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, ...(y != null && { y }) });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const hideWho = (t, who) => { A(r3(t - 0.02), who, "hide"); HIDDEN.add(who); };
const showWho = (t, who) => { A(r3(t - 0.02), who, "show"); HIDDEN.delete(who); };
const sitAt = (t, who, along, dur = 0.01) => A(r3(t - 0.02), who, "sit", { ...SEAT, along, dur, hands: "keep" });
const hideProp = (t, id) => c.prop(t, id, { y: AWAY }, 0);
const showProp = (t, id, y) => c.prop(t, id, { y }, 0);
// let go of a prop on a cut and hide it (a released prop falls with physics wherever the hand was)
const dropHidden = (tt, who, id, side) => { A(r3(tt - 0.015), who, "release", { prop: id, dur: 0, to: [0, AWAY, 0] }); c.A(r3(tt - 0.012), who, "arm", { side, pose: side === "L" ? SPUD_L : "lap", dur: 0.005 }); c.A(r3(tt - 0.012), who, "grip", { side, shape: "relaxed", dur: 0.005 }); };
// the chewer: a crunch (the heap hops, crumbs fly from his mouth)
const crunch = (t, gain = 0.8) => { sfx(t, "ai/crunch", { gain }); c.prop(t, "bucket", { puff: 1 }, 0.12, "out"); c.prop(r3(t + 0.12), "bucket", { puff: 0 }, 0.18, "in"); A(t, "chip", "talk", { dur: 0.45, amp: 0.7 }); };
// the bucket's hands: palms on its two sides (body frame, his R hand on his right = -x)
const BK_HANDS = (b) => ({ R: { x: [r3(-(BK_R + 0.05)), r3(b.y + 0.17), b.z] }, L: { x: [r3(BK_R + 0.05), r3(b.y + 0.17), b.z] } });
const bucketHands = (t, b, dur = 0.01) => { const h = BK_HANDS(b); arm(t, "chip", "R", h.R, dur); arm(t, "chip", "L", h.L, dur); };
// the reply-all guy's thumbs on his phone
const WP_HANDS = { R: { x: [-0.065, 0.42, 0.33] }, L: { x: [0.065, 0.42, 0.33] } };

// ---------------------------------------------------------------- cameras (DESIGN §0): every shot pushes in, linear, over its length
const CAM = {
  1: { pos: [0.55, 1.30, 12.4], look: [0.55, 1.52, 0], fov: 32, push: [0.55, 1.30, 11.5] },
  "1b": { pos: [0.55, 1.22, 10.6], look: [0.55, 1.20, 0], fov: 32, push: [0.55, 1.20, 9.9] },   // the seats: a step closer than 01, lower
  2: { pos: [0.30, 0.95, 5.0], look: [-0.35, 1.05, 0.2], fov: 20, push: [0.24, 0.96, 4.6] },
  3: { pos: [1.30, 0.50, 7.0], look: [1.62, 1.02, 0.7], fov: 28, push: [1.33, 0.52, 6.5] },
  4: { pos: [0.30, 0.86, 5.6], look: [0.30, 0.70, 0.0], fov: 32, push: [0.30, 0.85, 5.2] },   // low and frontal: him on the left, the glowing empty star seat on the right (stills: the design's view from above hid his face)   // the star seat in front, his face turned to it (stills 1: from above the right end his face was hidden)
  5: { pos: [-2.20, 1.20, 8.5], look: [0.85, 1.45, -0.3], fov: 32, push: [-2.02, 1.21, 7.97] },
  6: { pos: [0.45, 1.15, 6.8], look: [-0.02, 1.00, 0.15], fov: 24, push: [0.41, 1.14, 6.3] },
  7: { pos: [-0.95, 0.80, 8.0], look: [-0.56, 1.25, 0.1], fov: 30, push: [-0.92, 0.83, 7.5] },   // 0.2 left of the design: the reply-all guy was cut by the edge
  8: { pos: [-0.05, 0.92, 4.9], look: [-0.12, 1.12, 0.2], fov: 20, push: [-0.06, 0.93, 4.55] },
  9: { pos: [0.55, 1.50, 6.6], look: [0.12, 1.28, -0.1], fov: 24, push: [0.50, 1.50, 6.1] },   // 1.32, not 1.15: over the chewer's head to the Wizard's face (layout 2)
  "2b": { pos: [-0.70, 0.95, 5.0], look: [-0.10, 1.05, 0.0], fov: 22, push: [-0.65, 0.96, 4.6] },   // "Who?": from his other side, the Wizard behind his shoulder
  "9b": { pos: [0.50, 1.50, 6.1], look: [0.12, 1.28, -0.1], fov: 22, push: [0.46, 1.50, 5.7] },   // the Wizard again, a step closer
  10: { pos: [0, 1.90, 9.6], look: [0, 1.30, 0], fov: 34, push: [0, 1.84, 9.0] },
  11: { pos: [2.60, 0.85, 5.6], look: [1.89, 0.92, 1.36], fov: 30, push: [2.56, 0.85, 5.3] },
  12: { pos: [-0.20, 0.70, 7.2], look: [-0.18, 1.12, 0.05], fov: 28, push: [-0.20, 0.72, 6.8] },
  13: { pos: [3.00, 0.90, 7.2], look: [1.07, 1.09, 1.52], fov: 30, push: [2.89, 0.91, 6.86] },
  14: { pos: [-0.90, 0.95, 9.3], look: [0.89, 1.43, 0.17], fov: 32, push: [-0.79, 0.98, 8.75] },
  15: { pos: [0.35, 0.50, 6.3], look: [1.28, 1.20, 1.44], fov: 32, push: [0.41, 0.55, 5.96] },
};
const shots = [];
// cuts on the 2-frame grid animeTiming draws
const shot = (name, t, k, kind) => { const { push, ...cam } = CAM[k]; shots.push([name, F2(t), { ...cam, push }, kind].filter((v) => v !== undefined)); CUTS.add(F2(t)); return F2(t); };

// ---------------------------------------------------------------- frame 0
A(0, "spud", "sit", { ...SEAT, along: SPUD_AL, dur: 0.01, hands: "keep" });
A(0, "wizard", "hide"); A(0, "chip", "hide"); A(0, "wedge", "hide"); A(0, "mash", "hide");
const SPUD_L = { x: [0.10, 0.22, 0.30] };   // his free hand on his belly: "lap" reached into the chewer beside him (layout 2)
arm(0, "spud", "L", SPUD_L, 0.01);
const hp = grips.thin(c, "spud", PEN, { side: "R" });
hp.take(0, { reach: 0.01, settle: 0.01 });
const hc = grips.phone(c, "devil", CLIPB, { side: "L" });
arm(0, "devil", "both", { o: [0.30, 0.62, 0.14] }, 0.01); grip(0, "devil", "both", "open", 0.01);
look(0, "spud", [0.7, 0.05], 0.01); expr(0, "spud", "shocked", 0.01, { open: 0.1 });
look(0, "devil", [-0.6, -0.1], 0.01);
// chip waits in the door's hot box with his bucket
bucketHands(0, BUCKET_WALK); grip(0, "chip", "both", "hold", 0.01);
// the pen click: the fist dips 6 mm and back in 4 frames
const click = (t, gain = 0.75) => {
  hp.carry(t, [PEN_AT_NOW[0], r3(PEN_AT_NOW[1] - 0.008), PEN_AT_NOW[2]], 0.067, "out");
  hp.carry(r3(t + 0.067), PEN_AT_NOW, 0.067, "in");
  sfx(r3(t + 0.05), "click", { gain });
};
let PEN_AT_NOW = PEN_AT;

// ================================================================ 1 WELCOME + THE RULE (01-03)
let t;
shot("welcome", 0, 1, "hook");
see(0, 1.2, ["spud.face", "devil.face", "couch"], "frame 0: a little potato on a hell couch, the Devil welcomes him");
t = say(0, 0.1);   // Welcome to HELL.
sfx(0.12, "ai/ignite", { gain: 0.3 });
click(0.75, 0.6);   // the plant: his nervous habit from the first second

const S2 = shot("who", r3(t + 0.08), 2);
t = say(1, r3(S2 + 0.1));   // Who's in my hell?
click(r3(t + 0.08));
see(S2, t, ["spud.face", "pen"], "his question, his pen");

const S3 = shot("rule", r3(t + 0.25), 3, "threat");
look(S3, "spud", [0.7, 0.1], 0.01);
arm(S3, "devil", "both", { o: [0.28, 0.70, 0.18] }, 0.6);
expr(S3, "devil", "evil", 0.2);
t = say(2, r3(S3 + 0.1));   // One rule. Forever... with everyone who ever annoyed you.
see(S3, t, ["devil.face"], "the rule: forever, with everyone who ever annoyed you");

// ================================================================ 2 THE SEATS (01b, 04)
const S3b = shot("seats", r3(t + 0.1), "1b");
place(S3b, "devil", D1, -55);
expr(S3b, "devil", "delighted", 0.01);
arm(S3b, "devil", "L", "rest", 0.01); grip(S3b, "devil", "L", "relaxed", 0.01);
arm(S3b, "devil", "R", { o: [0.30, 0.55, 0.30] }, 0.01); grip(S3b, "devil", "R", "point", 0.01);
t = say(3, r3(S3b + 0.1));   // Two seats left. And this one...
arm(r3(T[3] + 0.15), "devil", "R", { o: [0.36, 0.50, 0.26] }, 0.25);   // seat 1
arm(r3(T[3] + 0.6), "devil", "R", { o: [0.20, 0.55, 0.36] }, 0.25);    // seat 3
see(S3b, r3(T[3] + 0.95), ["devil.face", "spud.face", "couch"], "two seats left beside him");

const S4 = shot("star", r3(T[3] + 1.0), 4);
place(S4, "devil", [2.55, 1.60], -40);   // D3: out of the way of this camera
arm(S4, "devil", "R", "rest", 0.01); grip(S4, "devil", "R", "relaxed", 0.01);
c.prop(S4, "couch", { glow: 1 }, 0.4, "out");
sfx(S4, "magic-up", { gain: 0.35 });
look(r3(S4 + 0.1), "spud", [0.6, -0.35], 0.25);   // to the star seat on his left
expr(r3(S4 + 0.3), "spud", "terrified", 0.2, { open: 0.1 });
t = say(4, r3(Math.max(END_OF(3) + 0.15, S4 + 0.2)));   // ...is for the worst one.
A(r3(t + 0.05), "spud", "squash", { amount: 0.06, dur: 0.25 });   // the gulp
sfx(r3(t + 0.05), "ai/blep", { gain: 0.35 });
c.prop(r3(t + 0.2), "couch", { glow: 0.3 }, 0.4);
see(S4, t, ["spud.face", "couch"], "the empty star seat is for the worst one");

// ================================================================ 3 THE CHEWER (05, 06)
const S5 = shot("chewer", r3(t + 0.25), 5);
const BANG1 = r3(S5 + 0.1);
c.prop(BANG1, "door", { open: 1 }, 0.17, "out");
sfx(BANG1, "door-slam", { gain: 0.8 });
showWho(BANG1, "chip");
look(BANG1, "spud", [0.9, 0.1], 0.15); expr(BANG1, "spud", "shocked", 0.15, { open: 0.1 });
step(r3(BANG1 + 0.05), "chip", [2.18, -0.55], 0.55);
step(r3(BANG1 + 0.6), "chip", [1.75, 0.66], 0.75);
look(BANG1, "chip", [-0.3, -0.3], 0.01); expr(BANG1, "chip", "happy", 0.01);
crunch(r3(BANG1 + 0.75));
c.prop(r3(BANG1 + 1.1), "door", { open: 0 }, 0.27, "in");
sfx(r3(BANG1 + 1.35), "door-close", { gain: 0.5 });
see(BANG1, r3(BANG1 + 1.3), ["chip", "door", "spud.face"], "the first arrival: a chewer with a popcorn bucket");

const S6 = shot("chewing", r3(BANG1 + 1.45), 6);
sitAt(S6, "chip", CHIP_AL);
c.prop(r3(S6 - 0.02), "bucket", BUCKET_LAP, 0);
bucketHands(S6, BUCKET_LAP);
A(r3(S6 - 0.02), "chip", "lean", { to: 6, dur: 0.01 });   // leans in to him (lean +: the top toward -x)
look(S6, "chip", [-0.4, -0.2], 0.01); expr(S6, "chip", "happy", 0.01);
look(S6, "spud", [0.8, -0.1], 0.01); expr(S6, "spud", "annoyed", 0.01, { open: 0.1 });
A(S6, "spud", "face", { lid: 0.35, dur: 0.01 });
// crumbs: one rain for the whole clip, a piece set per crunch from his mouth to the hero's shoulder, lap and the floor
const RAIN0 = S6, MOUTH = [r3(CHIP_AL - 0.06), 0.62, 0.30];
const KS = [];
const rain = (tt, n = 6) => { for (let k = 0; k < n; k++) { const u = (k * 0.618) % 1, to = k % 3 === 0 ? [r3(SPUD_AL + 0.26), 0.88, 0.10] : k % 3 === 1 ? [r3(0.05 + u * 0.15), 0.42, 0.40] : [r3(0.30 + u * 0.18), 0.02, r3(0.50 + u * 0.12)]; KS.push([...MOUTH.map((v, j) => r3(v + (j === 0 ? -0.02 * u : j === 1 ? 0.02 * u : 0))), ...to, r3(tt - RAIN0 + k * 0.03), 0.35, 0.10, k % 3 === 2 ? 0 : 1]); } };
crunch(r3(S6 + 0.15)); rain(r3(S6 + 0.2));
crunch(r3(S6 + 0.6)); rain(r3(S6 + 0.65), 4);
c.prop(r3(S6 + 0.3), "crumbs", { fill: 0.4 }, 0.6, "linear");
c.prop(r3(S6 + 0.3), "floorpile", { fill: 0.3 }, 0.8, "linear");
t = say(5, r3(S6 + 1.0));   // Could you chew... quieter?
look(r3(T[5] - 0.1), "spud", [0.6, -0.15]);
look(r3(t + 0.05), "chip", [-0.5, -0.15]);
expr(r3(t + 0.05), "chip", "smug", 0.15);
t = say(6, r3(t + 0.2));   // Nope.
crunch(r3(t + 0.1), 1.0); rain(r3(t + 0.15), 8);
c.prop(r3(t + 0.2), "crumbs", { fill: 1 }, 0.5, "linear");
c.prop(r3(t + 0.2), "floorpile", { fill: 0.5 }, 0.5, "linear");
A(r3(t + 0.2), "spud", "face", { lid: 0.6, dur: 0.15 });
see(S6, r3(t + 0.5), ["spud.face", "chip.face", "bucket"], "Could you chew quieter? Nope. Crunch.");

// ================================================================ 4 REPLY ALL (07, 08)
const BANG2 = r3(t + 0.45);
sfx(BANG2, "door-slam", { gain: 0.75 });   // off screen: the door bangs again
A(BANG2, "spud", "face", { lid: 1, dur: 0.08 }); A(r3(BANG2 + 0.25), "spud", "face", { lid: 0.45, dur: 0.15 });
const S7 = shot("reply all", r3(BANG2 + 0.15), 7);
unparkWedge(S7);
function unparkWedge(tt) {
  showWho(tt, "wedge");
  place(tt, "wedge", [1.30, 1.15], -90);
  for (const s of ["R", "L"]) arm(tt, "wedge", s, WP_HANDS[s], 0.01);
  grip(tt, "wedge", "both", "hold", 0.01);
  look(tt, "wedge", [0, -0.9], 0.01); expr(tt, "wedge", "deadpan", 0.01);
  A(tt, "wedge", "face", { lid: 0.4, dur: 0.01 });
}
look(S7, "spud", [0.6, 0], 0.01); look(S7, "chip", [0.6, 0], 0.01);
step(r3(S7 + 0.05), "wedge", [r3(WEDGE_AL), 1.15], 1.5);
step(r3(S7 + 1.58), "wedge", [r3(WEDGE_AL), 0.60], 0.3);   // a step back to the couch
const WSIT = r3(S7 + 1.9);
A(WSIT, "wedge", "sit", { ...SEAT, along: WEDGE_AL, dur: 0.35, hands: "keep" });
c.prop(WSIT, "wphone", { y: 0.06, z: 0.42, tip: -55 }, 0.35);   // seated: the phone down at his chest, off his face (stills 1)
for (const sd of ["R", "L"]) arm(WSIT, "wedge", sd, { x: [sd === "R" ? -0.065 : 0.065, 0.10, 0.42] }, 0.35);   // draft 1: higher, the phone covered his face from the low camera
look(r3(S7 + 0.4), "spud", [-0.2, -0.1], 0.4); look(r3(S7 + 1.0), "spud", [-0.7, 0], 0.3);
crunch(r3(S7 + 0.8), 0.6); rain(r3(S7 + 0.85), 4);
expr(r3(S7 + 0.3), "spud", "deadpan", 0.2);
t = say(7, r3(WSIT + 0.45));   // Reply all.
A(r3(T[7] + 0.4), "wedge", "tap", { count: 2, every: 0.18, side: "R", lift: 0.01 });
see(S7, t, ["wedge.face", "spud.face", "chip.face", "wphone"], "the second arrival squeezes in on his other side, on his phone");

const S8 = shot("thanks", r3(t + 0.15), 8);
c.prop(r3(S8 - 0.016), "pphone", { y: PP_AT[1] }, 0);
const hpp = grips.phone(c, "spud", { ...PPHONE, y: PP_AT[1] }, { side: "L" });
hpp.take(r3(S8 - 0.015), { reach: 0.005, settle: 0.005 });
look(S8, "spud", [0.1, -0.5], 0.01); expr(S8, "spud", "deadpan", 0.01);
A(S8, "spud", "face", { lid: 0.45, dur: 0.01 });
t = say(8, r3(S8 + 0.1));   // Thanks. Thanks. THANKS!
const PINGS = [r3(T[8] + 0.12), r3(T[8] + 0.68), r3(T[8] + 1.25)];
PINGS.forEach((p, k) => { c.prop(p, "pphone", { count: k + 1 }, 0.13, "out"); sfx(p, "notify", { gain: 0.5 + 0.1 * k }); A(p, "spud", "face", { lid: 0.45 + 0.12 * (k + 1), dur: 0.08 }); });
look(r3(END_OF(8) + 0.05), "spud", [0, 0.05], 0.2);   // to us
expr(r3(END_OF(8) + 0.05), "spud", "annoyed", 0.15, { open: 0.1 });
t = say(9, r3(END_OF(8) + 0.2));   // I'm DEAD. Why do I still have a phone?
t = say(10, r3(t + 0.12));         // (off screen) Hell.
see(S8, t, ["spud.face", "pphone"], "three reply-all pings on his phone: I'm dead, why do I still have a phone?");

// ================================================================ 5 SPOILERS, CHAOS (09, 2b, 9b, 10)
const S9 = shot("spoiler", r3(t + 0.15), 9);
showWho(S9, "wizard"); showProp(r3(S9 - 0.02), "ball", 0.95);
A(r3(S9 - 0.4), "wizard", "pitch", { to: 12, dur: 0.01 }); 
arm(S9, "wizard", "R", { x: [-0.28, 0.32, 0.42] }, 0.01);   // his glove on the back's top roll (draft 1: the forearm crossed his eyes)
look(S9, "wizard", [-0.6, -0.2], 0.01); expr(S9, "wizard", "smug", 0.01);
c.at(r3(S9 + 0.02), { fx: "poof", pos: [0.28, 1.15, -0.75], dur: 0.4, color: "#b9a0e8", puffs: 8, sparks: 0, size: 0.35, lift: 0.1, sound: false });
sfx(r3(S9 + 0.02), "magic-up", { gain: 0.4 });
look(S9, "spud", [0.3, -0.1], 0.01); expr(S9, "spud", "shocked", 0.01, { open: 0.1 });
t = say(11, r3(S9 + 0.35));   // He dies at the end.
c.prop(T[11], "ball", { glow: 1.4 }, 0.1, "out"); c.prop(r3(T[11] + 0.2), "ball", { glow: 1 }, 0.3);
look(r3(T[11] + 0.3), "spud", [0.5, 0.15], 0.15);
see(S9, t, ["wizard.face", "spud.face", "ball"], "the third: a wizard leans over the couch with a crystal ball and spoils the film");

const S9b = shot("who dies", r3(t + 0.1), "2b");
expr(S9b, "spud", "annoyed", 0.01, { open: 0.1 }); look(S9b, "spud", [0.6, 0.2], 0.01);
t = say(12, r3(S9b + 0.1));   // Who?
see(S9b, t, ["spud.face"], "Who?");

const S9c = shot("everyone", r3(t + 0.12), "9b");
look(S9c, "wizard", [-0.3, -0.2], 0.01); expr(S9c, "wizard", "delighted", 0.01);
t = say(13, r3(S9c + 0.1));   // Everyone. In every movie you haven't seen.
c.prop(T[13], "ball", { glow: 1.4 }, 0.1, "out"); c.prop(r3(T[13] + 0.2), "ball", { glow: 1 }, 0.3);
sfx(T[13], "ai/magic-zap", { gain: 0.25 });
see(S9c, t, ["wizard.face", "spud.face"], "everyone dies in every film you haven't seen");

const S10 = shot("chaos", r3(t + 0.15), 10);
look(S10, "spud", [0, 0.1], 0.01); expr(S10, "spud", "angry", 0.01, { open: 0.1 });
crunch(r3(S10 + 0.05)); rain(r3(S10 + 0.1), 6);
sfx(r3(S10 + 0.12), "notify", { gain: 0.45 });
c.prop(r3(S10 + 0.08), "ball", { glow: 1.4 }, 0.1, "out"); c.prop(r3(S10 + 0.4), "ball", { glow: 1 }, 0.3);
c.prop(r3(S10 + 0.1), "floorpile", { fill: 0.8 }, 0.6, "linear");
t = say(14, r3(S10 + 0.2));   // I'm ALREADY dead!
A(T[14], "spud", "squash", { amount: -0.08, dur: 0.3 });   // he swells as he snaps
const SHAKES = [{ do: "shake", at: r3(T[14] + 0.05), dur: 0.35, amp: 0.02 }];
see(S10, t, ["spud.face", "chip.face", "wedge.face", "wizard.face", "couch"], "all three at once: I'm ALREADY dead!");

// ================================================================ 6 THE WORST ONE (11, 12)
const S11 = shot("the worst one", r3(t + 0.35), 11);
place(S11, "devil", D4, 12);
dropHidden(S11, "spud", "pphone", "L");   // he holds his phone through the spoilers; let go where he is off screen
hc.take(r3(S11 - 0.02), { reach: 0.01, settle: 0.01 });
c.prop(r3(S11 - 0.04), "clip", { ...grips.placeFor("clipboard", CLIP_AT(D4, 12), 12) }, 0);
arm(S11, "devil", "R", "rest", 0.01);
look(S11, "devil", [0, -0.4], 0.01); expr(S11, "devil", "delighted", 0.01);
A(S11, "devil", "face", { lid: 0.35, dur: 0.01 });
t = say(15, r3(S11 + 0.15));   // And the worst one...
look(r3(t + 0.05), "devil", [0.7, 0.1], 0.2);   // over his shoulder at the door
const RATTLE = r3(t + 0.1);
for (let k = 0; k < 5; k++) { const p = r3(RATTLE + k * 0.125); c.prop(p, "door", { open: 0.03 }, 0.05, "out"); c.prop(r3(p + 0.06), "door", { open: 0 }, 0.05, "in"); }
sfx(RATTLE, "kenney/metal-latch", { gain: 0.6 }); sfx(r3(RATTLE + 0.25), "kenney/metal-latch", { gain: 0.6 }); sfx(r3(RATTLE + 0.5), "kenney/metal-latch", { gain: 0.6 });
c.prop(RATTLE, "door", { glow: 1 }, 0.3);
showProp(RATTLE, "feet1", 0.006); showProp(RATTLE, "feet2", 0.006);
c.prop(RATTLE, "couch", { glow: 1 }, 0.2); c.prop(r3(RATTLE + 0.6), "couch", { glow: 0.4 }, 0.3);
see(S11, r3(RATTLE + 0.6), ["devil.face", "door", "feet1"], "the worst one is behind the door: it rattles, two feet under it");

const S12 = shot("flinch", r3(RATTLE + 0.7), 12);
look(S12, "spud", [0.8, 0.1], 0.01); expr(S12, "spud", "terrified", 0.01, { open: 0.1 });
look(S12, "chip", [0.6, 0.1], 0.01); look(S12, "wedge", [0.6, 0.1], 0.01); look(S12, "wizard", [0.4, -0.1], 0.01);
const FLINCH = [r3(S12 + 0.15), r3(S12 + 0.45), r3(S12 + 0.75)];
for (const f of FLINCH) {
  click(f, 0.9);
  for (const [who, dir] of [["chip", -1], ["wedge", 1], ["wizard", -1]]) {   // each away from him
    A(r3(f + 0.05), who, "lean", { to: (who === "chip" ? 6 : 0) + dir * 5, dur: 0.05 });
    A(r3(f + 0.05), who, "face", { lid: 1, dur: 0.04 });
    A(r3(f + 0.2), who, "lean", { to: who === "chip" ? 6 : 0, dur: 0.15 });
    A(r3(f + 0.22), who, "face", { lid: who === "wedge" ? 0.4 : 0, dur: 0.1 });
  }
}
t = say(16, r3(S12 + 1.05));   // Please be another chewer.
see(S12, t, ["spud.face", "chip.face", "wedge.face", "wizard.face", "pen"], "he clicks his pen in fear; everyone flinches at every click");

// ================================================================ 7 WRONG PAGE (13, 14)
const S13 = shot("wrong page", r3(t + 0.2), 13);
place(S13, "devil", D4, 14);
hc.carry(r3(S13 - 0.02), CLIP_AT(D4, 14), 0.01, "linear");
look(S13, "devil", [0, -0.4], 0.01); expr(S13, "devil", "annoyed", 0.01);
c.prop(r3(S13 + 0.25), "clip", { flip: 1 }, 0.4, "inOut");
sfx(r3(S13 + 0.25), "ai-package/cardboard-rustle", { gain: 0.45 });
look(r3(S13 + 0.3), "devil", [0, -0.5], 0.15);
t = say(17, r3(S13 + 0.7));   // Hm. Wrong page.
look(S13, "spud", [0.6, 0.1], 0.01); expr(S13, "spud", "shocked", 0.01, { open: 0.1 });
see(S13, t, ["devil.face", "clip"], "the Devil flips the page: wrong page");

const S14 = shot("verdict", r3(t + 0.15), 14);
place(S14, "devil", D4, -25);
hc.carry(r3(S14 - 0.02), CLIP_AT(D4, -25), 0.01, "linear");
look(S14, "devil", [-0.7, 0], 0.01); expr(S14, "devil", "delighted", 0.01);
look(S14, "spud", [0.7, 0.15], 0.01); expr(S14, "spud", "eager", 0.01, { open: 0.1 });
t = say(18, r3(S14 + 0.1));   // I'm free?
const POINT = r3(t + 0.05);
arm(POINT, "devil", "R", { o: [0.40, 0.62, 0.05] }, 0.2, "out"); grip(POINT, "devil", "R", "point", 0.1);
expr(POINT, "devil", "evil", 0.15);
t = say(19, r3(t + 0.2));   // You're his hell.
arm(r3(t + 0.05), "devil", "R", { o: [0.22, 0.85, -0.10] }, 0.25); grip(r3(t + 0.05), "devil", "R", "thumb", 0.1);   // thumb back at the door
expr(r3(T[19] + 0.4), "spud", "sad", 0.2, { open: 0.1 });
const SOFT = r3(t + 0.25);
c.prop(SOFT, "door", { open: 1, glow: 0 }, 0.33, "inOut");
sfx(SOFT, "door-creak", { gain: 0.5 });
hideProp(SOFT, "feet1"); hideProp(SOFT, "feet2");
see(S14, r3(t + 0.2), ["devil.face", "spud.face"], "he is not in a hell: he IS one");

// ================================================================ 8 THE FRIEND (15): end on the scream
const S15c = shot("the pen", r3(SOFT + 0.45), 15, "payoff");
hideWho(S15c, "devil"); A(r3(S15c - 0.015), "devil", "release", { prop: "clip", dur: 0, to: [0, AWAY, 0] }); hideWho(S15c, "wizard"); hideProp(r3(S15c - 0.02), "ball");   // behind him: the ball read as stuck on his head
dropHidden(S15c, "spud", "pen", "R");
A(r3(S15c - 0.02), "spud", "stand", { dur: 0.01 });
place(S15c, "spud", S15, 5, 0);
c.prop(r3(S15c - 0.03), "pen2", { y: PEN2_AT[1] }, 0);
const hp2 = grips.thin(c, "spud", { ...PEN2, y: PEN2_AT[1] }, { side: "L", from: 0.82 });   // his left hand, the door side: the right was off the frame's edge (stills 1)
hp2.take(r3(S15c - 0.02), { reach: 0.01, settle: 0.01 });
arm(S15c, "spud", "R", "rest", 0.01);
look(S15c, "spud", [0, 0.05], 0.01); expr(S15c, "spud", "happy", 0.01, { open: 0.1 });
A(S15c, "spud", "face", { lid: 0.2, dur: 0.01 });
showWho(S15c, "mash"); place(S15c, "mash", MASH_IN, -15);
arm(S15c, "mash", "R", { o: [0.18, 1.0, 0.12] }, 0.01); grip(S15c, "mash", "R", "open", 0.01);   // a wave
look(S15c, "mash", [-0.4, -0.15], 0.01); expr(S15c, "mash", "happy", 0.01);
sitAt(S15c, "wedge", -0.84); sitAt(S15c, "chip", 0.26);   // they sag into his gap
t = say(20, r3(S15c + 0.15));   // Hey, buddy!
const LAST = r3(t + 0.2);
hp2.carry(LAST, [PEN2_AT[0], r3(PEN2_AT[1] - 0.008), PEN2_AT[2]], 0.067, "out");
hp2.carry(r3(LAST + 0.067), PEN2_AT, 0.067, "in");
sfx(r3(LAST + 0.05), "click", { gain: 1.0 });
const SCREAM = r3(LAST + 0.14);
for (const s of ["R", "L"]) { arm(SCREAM, "mash", s, { o: [0.08, 0.78, 0.18] }, 0.12, "out"); grip(SCREAM, "mash", s, "open", 0.08); }   // both hands to his cheeks
A(SCREAM, "mash", "crouch", { to: 0.08, dur: 0.12 }); A(SCREAM, "mash", "pitch", { to: -6, dur: 0.12 });
expr(r3(SCREAM - 0.02), "mash", "terrified", 0.08);
t = say(21, SCREAM);   // NOT THE PEN!
SHAKES.push({ do: "shake", at: r3(SCREAM + 0.02), dur: 0.3, amp: 0.025 });
expr(r3(SCREAM + 0.1), "spud", "shocked", 0.1, { open: 0.1 });
const END = F2(t + 0.5);
see(S15c, END, ["spud.face", "mash.face", "pen2"], "his own friend walks in, he clicks the pen: NOT THE PEN!");

// blinks between the lines (no blink on a line)
act.blinksAt(c, "spud", [3.0, 9.4, 18.3, 26.2, 33.0]);
act.blinksAt(c, "devil", [5.6, 30.9]);
act.blinksAt(c, "chip", [12.6, 22.0]);
act.blinksAt(c, "wizard", [29.6]);

// the crumbs' rain, now that every crunch is in
props.push({ id: "rain", staged: "popcorn in flight", kind: "popcornrain", ...at3(0, 0, 0), ks: KS, len: r3(END - RAIN0), burst: 0 });
c.prop(RAIN0, "rain", { burst: 1 }, r3(END - RAIN0), "linear");

// a caption ends where the next one starts
{ const cs = [...c.captions].sort((x, y) => x.from - y.from); for (let k = 0; k + 1 < cs.length; k++) if (cs[k].to > cs[k + 1].from - 0.02) cs[k].to = r3(cs[k + 1].from - 0.02); }
// every shot pushes in over its whole length (Jonny 20 Nov: camera motion, no still frame)
for (let i = 0; i < shots.length; i++) {
  const [, at, cam] = shots[i], len = r3((shots[i + 1]?.[1] ?? END) - at), { push, ...rest } = cam;
  shots[i][2] = { ...rest, to: { pos: push }, dur: len, ease: "linear" };
}
const beats = c.beats(shots, END);

write(import.meta.url, {
  id: "whos-in-your-hell",
  title: "Who's in your hell?",
  idea: "Potato Desk 13 (heaven/hell 4): hell is forever with everyone who annoys you; a chewer, a reply-all guy and a spoiler wizard squeeze him on a hell couch, the star seat waits for the worst one, and the worst one turns out to be him: his own friend walks in and screams at his pen.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [470, 1360], captionStyle: "kinetic",
  captionOverBody: { reason: "the Wizard leans over the couch in close shots (cams 09, 9b): his hat fills the upper third; the caption sits on the hat, never on an eye" },
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#2a2024", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "whos-in-your-hell/whos-hell-score.ogg", lock: false, dip: false, lowCut: 150, gain: 0.24 },   // make-score.mjs: from 0.0, changes at the turn
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor", scenes: ["ui"] },
  creative: { length: [38, 70] },
  hook: { show: ["spud", "devil", "couch"], hint: 0, what: "a little potato on a hell couch; the Devil: Welcome to HELL. Who's in my hell?" },
  fx: SHAKES, cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spud", with: "couch", from: 0, to: r3(S15c - 0.05), reason: "he sits on the hell couch (panels 01-14)" },
    { who: "chip", with: "couch", from: r3(S6 - 0.05), to: END, reason: "the chewer sits on the couch beside him (panels 06-15)" },
    { who: "wedge", with: "couch", from: r3(WSIT - 0.05), to: END, reason: "the reply-all guy sits on the couch's other end (panels 07-15)" },
    { who: "wizard", with: "couch", from: r3(S9 - 0.05), to: END, reason: "the wizard stands on the step behind the couch and leans over its back (panels 09-15)" },
    { who: "spud", with: "chip", from: r3(S6 - 0.05), to: r3(S15c - 0.05), checks: ["character-overlap", "reach"], reason: "the squeeze is the joke: the chewer sits pressed against his side (panels 06-14)" },
    { who: "spud", with: "wedge", from: r3(WSIT - 0.05), to: r3(S15c - 0.05), checks: ["character-overlap", "reach"], reason: "the squeeze is the joke: the reply-all guy sits pressed against his other side (panels 07-14)" },
    { who: "spud", with: "wedge", from: S7, to: r3(WSIT + 0.4), checks: ["face-hidden"], reason: "the reply-all guy walks past in front of the couch to his seat, a wipe across the shot (panel 07)" },
    { who: "chip", with: "wedge", from: S7, to: r3(WSIT + 0.4), checks: ["face-hidden"], reason: "the reply-all guy walks past in front of the couch to his seat, a wipe across the shot (panel 07)" },
    { who: "wizard", with: "chip", from: S9, to: S10, checks: ["face-hidden"], reason: "the chewer's leaf sways across one of the Wizard's eyes for a few frames while he chews; the other eye and the face read (cams 09, 9b)" },
    { who: "chip", with: "door", from: BANG1, to: r3(BANG1 + 0.8), checks: ["clipping", "shell"], reason: "the chewer walks out of the hot box through the open hell door (panel 05)" },
    { who: "mash", with: "door", from: r3(S15c - 0.05), to: END, checks: ["clipping", "shell"], reason: "his friend stands in the open hell door (panel 15)" },
  ],
  notes: "Generated by storyboards/series/potato-desk/13-whos-in-your-hell/make-whos-in-your-hell.mjs.",
});
