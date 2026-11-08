// THAT ONE FRIEND WHO NEVER HAS MONEY… WHEN IT'S HIS ROUND (never has money, episode 3, 8 Nov 2026), from the clip
// template.
//   node storyboards/series/never-has-money/03-his-round/make-his-round.mjs -> his-round.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/03-his-round-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/03-his-round/ there (PANELS.md here: plan + departures).
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper, the Samurai bartender; a pub at night)
//   Joke:        three empty glasses and it's his round. The pocket pat finds the moth. "Bathroom!" He dashes into the
//                toilet; the door shuts, the light goes red. The Wizard and Reaper nod, put their coats on and tiptoe
//                out. He peeks out: the table's empty, round dodged! He strolls back pleased and sips Reaper's leftover
//                lemonade, and the Samurai pushes the card reader to a stop in front of him: 84.00, the whole night.
//   Wants:       Gunslinger wants to dodge buying the round.
//   Consequence: his own dodge leaves him alone with the whole night's bill.
//   Ending:      the wink to the deadpan Samurai, "Next time's on me!"; his friends wave from outside the window.
//   Callback:    frame 0 the Wizard calls the round on him; the last frame the Samurai's finger on the bill he now owes
//                alone (same table, opposite result: the friends who wanted a round got away free).
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the light snapping to red at 3.5, the reader stopping at 7.5 on the video's clock) add 0.2 s:
// 9.8 s of story = exactly 10.0 s of video
const HS1 = 3.5, HS2 = 7.4, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.1 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- the pub (world metres; the camera in the room at +z)
// One line of fronts at the back: the toilet block at the left (its door faces us), the bar beside it with the Samurai
// behind it and the bottle shelves (the plate) behind him, then the window wall a step further back at the right, with
// the night street (a plate) outside. The three stand at a high round table in the middle in a half circle open to the
// camera (PANELS.md: standing at a belly-high table reads as a person at a bar, and keeps the standing Samurai level with
// them in panels 6-8). The coats hang over the bar's front edge behind Reaper (pubs' regulars leave them there).
const TABLE = { x: -0.3, z: 0.12, r: 0.4, h: 0.5 };
const BAR = { x: 0.125, z: -1.5, w: 0.95, d: 0.5, h: 0.45 };   // (low: the Samurai's face clears it, his polishing hands under his eyes)            // x -0.35 .. 0.6, front z -1.25 (the top's nose -1.21)
const LOO = { x: -1.75, z: -1.3, w: 1.25, h: 1.6 };   // (wide: his hat brim passes the jambs)                       // the doorway's middle, the wall's front; hinged left, opens in
const HINGE = [r3(LOO.x - LOO.w / 2 + 0.005), r3(LOO.z - 0.035)];
const WIN = { z: -2.55, x0: 0.7, x1: 5.2, ow: 1.9, cx: 1.75, sill: 0.5, oh: 1.75 };   // the window wall and its opening (x 0.8 .. 2.7)
// the cast's places
const G0 = [-1.22, 0.32], R0 = [-0.55, -0.74], W0 = [0.5, -0.18], S0 = [0.12, -2.2];
const G_YAW = 40, R_YAW = 15, W_YAW = -75, S_YAW = 0;
// a point in front of someone: f metres along their facing, s metres to their left (their own left), at height y
const front = ([x, z], yaw, f, s, y) => { const a = (yaw * Math.PI) / 180; return [r3(x + f * Math.sin(a) + s * Math.cos(a)), y, r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const yawTo = ([x0, z0], [x1, z1]) => r3((Math.atan2(x1 - x0, z1 - z0) * 180) / Math.PI);
const TOP = TABLE.h;
// the glasses: two empties along the table's front, the Wizard's (the third) in his hand at frame 0, and Reaper's
// leftover lemonade (a lemon slice) at the back by his place
const GL = [[-0.56, 0.29], [-0.33, 0.39]];
const LEMON = [-0.3, -0.22], G_PUT = [-0.42, -0.18];   // the lemonade, and where he bangs it down at the bill
const W_GLASS = front(W0, W_YAW, 0.58, 0.3, TOP);                          // where the Wizard sets his down (clear of the reader's path)
const glass = (i, [x, z], o = {}) => ({ id: `glass${i}`, kind: "tumbler", x, y: TOP, z, fill: 0, seed: i + 2, ...o });
// the card reader: on the bar's right end until the Samurai takes it; he sets it on the table and pushes it to a stop
// in front of Gunslinger (back at Reaper's place)
const READER0 = [0.5, -1.47], READER_SET = [-0.02, 0.0], READER_STOP = [-0.17, -0.15];
const READER = { id: "reader", kind: "barreader", x: READER0[0], y: BAR.h, z: READER0[1], rot: 0, total: "84.00" };
// the Samurai's glass he polishes over the bar
const SGLASS = { id: "sglass", kind: "tumbler", ...grips.placeFor("tumbler", front(S0, S_YAW, 0.52, 0.2, 0.5), S_YAW), fill: 0, seed: 9 };
// Gunslinger's places: the door's front, the doorway, inside out of the door's swing (it opens in: 1.5 m from the
// hinge clears the leaf and his body), the peek, and back at the table where Reaper stood (the lemonade)
const DOOR_FRONT = [-1.75, -0.9], DOORWAY = [-1.72, -1.55], HIDE = [-0.9, -2.1], PEEK = [-1.7, -1.67], OUTSIDE = [-1.76, -0.72];
// panels 6-8: Gunslinger and the Samurai side by side behind the table's back right (a body-width apart), on a line
// square to the camera that looks past them at the window, so the window and the street sit behind them; the reader
// slides from the Samurai's hand across the table's back to the spot in front of Gunslinger
const G6 = [-0.32, -0.72], S6 = [0.5, -0.2], G6_YAW = -22, S6_YAW = -72;

const cast = [
  { id: "gsl", character: "never-has-money/gunslinger", at: G0, face: G_YAW, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: R0, face: R_YAW, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "wiz", character: "never-has-money/wizard", at: W0, face: W_YAW, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "sam", character: "bistro/samurai-waiter", at: S0, face: S_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
];
const BODY = { rx: 0.38, rz: 0.36, cy: 0.66, ry: 0.52, taper: 0.16 };   // Reaper and the Wizard (1.04 tall, taper 0.16)
const NOSE = r3(BAR.z + BAR.d / 2 + 0.04);
const props = [
  { id: "floor", kind: "plankfloor", x: 0.5, z: 0.6, w: 9, d: 9 },
  { id: "bar", kind: "pubbar", x: BAR.x, z: BAR.z, w: BAR.w, d: BAR.d, h: BAR.h },
  { id: "loo", kind: "loodoor", x: LOO.x, z: LOO.z, w: LOO.w, h: LOO.h, wl: 1.225, wr: 0.775, wh: 3.6, room: 1.5, roomw: 2.15, roomx: 0.275, ret: 2.45, open: 0, on: 0 },
  { id: "clock", kind: "clock", x: -0.56, y: 2.15, z: -1.27, scale: 0.6, time: 11.3, staged: "the pub clock on the wall beside the toilet, a quarter past eleven (a lived-in room; review A: the wall was bare at frame 0)" },
  { id: "window", kind: "windowwall", x: r3((WIN.x0 + WIN.x1) / 2), z: WIN.z, w: r3(WIN.x1 - WIN.x0), wh: 3.9, ret: 1.1, win: { x: r3(WIN.cx - (WIN.x0 + WIN.x1) / 2), w: WIN.ow, h: WIN.oh, sill: WIN.sill, cols: 1, rails: 1 } },
  { id: "table", kind: "hightable", x: TABLE.x, z: TABLE.z, r: TABLE.r, h: TABLE.h },
  { id: "stool1", kind: "stool", x: -1.2, z: 1.27, r: 0.22, color: "#6b4226", staged: "an empty stool by the table (panel 5)" },
  { id: "stool2", kind: "stool", x: 0.75, z: 0.87, r: 0.22, color: "#6b4226", staged: "an empty stool by the table (panel 5)" },
  { id: "coatR", kind: "drapedcoat", x: -0.25, y: BAR.h, z: NOSE, w: 0.26, color: "#7a7580", fade: 0, staged: "Reaper's coat over the bar's front edge" },
  { id: "coatW", kind: "drapedcoat", x: 0.5, y: BAR.h, z: NOSE, w: 0.26, color: "#8a5a34", fade: 0, staged: "the Wizard's coat over the bar's front edge" },
  { id: "lamp1", kind: "pendant", x: TABLE.x, y: 2.0, z: TABLE.z, len: 1.45, r: 0.15, staged: "hangs from the ceiling over the table" },
  { id: "lamp2", kind: "pendant", x: 0.2, y: 2.2, z: -1.5, len: 1.15, r: 0.13, staged: "hangs from the ceiling over the bar" },
  glass(1, GL[0]), glass(2, GL[1]),
  // the Wizard's: in his right hand at frame 0, a hand over the table, coming down
  glass(3, [W_GLASS[0], W_GLASS[2]], { y: r3(TOP + 0.08) }),
  glass(4, LEMON, { fill: 0.45, lemon: true }),
  SGLASS,
  READER,
  { id: "towel", kind: "bartowel", wear: "sam", x: 0.3, y: 0.98, z: 0.02, rot: 10 },
  { id: "wcoatR", kind: "wearcoat", wear: "rea", x: 0, y: 0, z: 0, color: "#7a7580", y0: 1.0, y1: 0.28, body: BODY, on: 0 },
  { id: "wcoatW", kind: "wearcoat", wear: "wiz", x: 0, y: 0, z: 0, color: "#8a5a34", y0: 1.0, y1: 0.3, body: BODY, on: 0 },
  ...patProps({ who: "gsl", at: G0, yaw: G_YAW }).map((p) => (p.id === "wallet" ? { ...p, scale: 0.001, staged: "down in his holster (part of his costume) until he draws it" } : p)),
];

// subtitles inside y 470-1360 (TikTok's safe zone, clear of Jonny's in-app title at the top)
const SUB_HIGH = 560;

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// frame 0: the Wizard is setting the third empty glass down (tink) and already pointing at Gunslinger: "Your round!".
// Reaper turns his head to him too; behind them the Samurai looks up from polishing a glass.
const g3 = props.find((p) => p.id === "glass3");
const wg = grips.mug(c, "wiz", g3, { side: "L", height: 1.4 });
c.arm(0, "wiz", "L", { prop: "glass3", grip: wg.hands.L.grip, palm: "wrap" }, 0); A(0, "wiz", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "wiz", "grab", { prop: "glass3", hand: "L", grip: wg.hands.L.grip, dur: 0, pose: null });
let tw = wg.place(0, W_GLASS, 0.12);
sfx(r3(tw), "put-down-glass", { gain: 0.7, reason: "the Wizard sets the third empty glass down on the table" });
wg.release(r3(tw + 0.02), { back: 0.12 });
// his right hand points straight at Gunslinger (across the table, high over its top), a little jab on the line
c.arm(0, "wiz", "R", { o: [-0.24, 0.48, 0.42] }, 0); A(0, "wiz", "grip", { side: "R", shape: "point", dur: 0 });
for (const t of [0.12, 0.42]) { c.arm(t, "wiz", "R", { o: [-0.25, 0.5, 0.47] }, 0.07, "out"); c.arm(r3(t + 0.07), "wiz", "R", { o: [-0.24, 0.48, 0.42] }, 0.12, "inOut"); }
A(0, "wiz", "look", { to: [-0.15, 0.0], dur: 0, blink: false });
act.mood(c, 0.02, "wiz", "annoyed", { strength: 0.7, hold: 0.6 });
c.say(0, "wiz", "your round!", 0.55, "excited", { voice: false, sub: "Your round!", pos: SUB_HIGH });
A(0.05, "wiz", "squash", { amount: 0.02, dur: 0.1 });

// Reaper: his head turns to Gunslinger, deadpan
A(0.1, "rea", "look", { to: [-0.5, -0.05], dur: 0.25, blink: false }); A(0.1, "rea", "face", { lid: 0.45, dur: 0.2 });
A(0.25, "rea", "turn", { to: -20, dur: 0.35 });
// Gunslinger: he was peering into his own empty glass; eyes up at the Wizard, a sheepish grin
A(0, "gsl", "look", { to: [0.2, -0.45], dur: 0, blink: false });
grips.rest(c, "gsl", "L", { ...props.find((p) => p.id === "table"), h: TABLE.h }, [-0.32, 0.02], 0, { dur: 0 });   // his hand on the table's edge (table frame)
A(0, "gsl", "expr", { expr: "happy", set: { curve: 0.5, open: 0.1 }, dur: 0 });
A(0.22, "gsl", "look", { to: [0.5, 0.05], dur: 0.08, blink: false });
act.sheepish(c, 0.3, "gsl");
A(0.6, "gsl", "look", { to: [0.3, 0.1], dur: 0.1, blink: false });   // to Reaper: no help there
A(0.95, "gsl", "look", { to: [0.5, 0.05], dur: 0.1, blink: false });
A(1.0, "gsl", "squash", { amount: -0.02, dur: 0.15 });
see(0, 1.45, ["wiz.face", "gsl.face", "rea.face", "glass3", "sam.face"], "panel 1: the Wizard calls the round on Gunslinger over three empty glasses, the Samurai behind the bar");
// the Samurai, behind the bar: polishing a glass (the towel hand rubbing round inside it), looks up at the call
const sg = grips.mug(c, "sam", SGLASS, { side: "L", height: 1.4 });
c.arm(0, "sam", "L", { prop: "sglass", grip: sg.hands.L.grip, palm: "wrap" }, 0); A(0, "sam", "grip", { side: "L", shape: "hold", dur: 0 });
A(0, "sam", "grab", { prop: "sglass", hand: "L", grip: sg.hands.L.grip, dur: 0, pose: null });
const SG_AT = [SGLASS.x, SGLASS.y, SGLASS.z];
const polish = (t0, t1) => { A(t0, "sam", "grip", { side: "R", shape: "flat", dur: t0 ? 0.1 : 0 }); for (let t = t0, k = 0; t < t1 - 0.05; t = r3(t + 0.16), k++) c.arm(t, "sam", "R", { world: [r3(SG_AT[0] - 0.085 + (k % 2 ? 0.015 : -0.01)), r3(SG_AT[1] + 0.05), r3(SG_AT[2] + 0.03)] }, t ? 0.16 : 0, "inOut"); };
polish(0, 1.6);
A(0, "sam", "look", { to: [0.0, -0.4], dur: 0, blink: false });
A(0.35, "sam", "look", { to: [-0.3, -0.05], dur: 0.15, blink: false });   // up at the call
A(0.4, "sam", "face", { lid: 0.4, dur: 0.2 });

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
pocketPat(c, { who: "gsl", at: G0, yaw: G_YAW, friend: [0.5, 0.05] });
A(1.55, "rea", "look", { to: [-0.45, -0.15], dur: 0.12, blink: false });
A(2.58, "rea", "face", { lid: 0.6, dur: 0.2 });   // the moth: a slow droop of his lids
A(1.6, "wiz", "look", { to: [-0.2, -0.1], dur: 0.12, blink: false });
c.arm(1.6, "wiz", "R", "rest", 0.3, "inOut"); A(1.62, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.arm(1.9, "wiz", "R", "hips", 0.3, "inOut"); c.arm(1.95, "wiz", "L", "hips", 0.4, "inOut");   // both hands on his hips: he has heard this before
A(2.6, "wiz", "face", { lid: 0.45, dur: 0.15 });

// ---------------------------------------------------------------- 3 BATHROOM! 2.8-3.5 (panel 3)
// the wallet back in the holster; a thumb over his shoulder at the toilet ("Bathroom!"), and he's off; at the door his
// palm on the push plate, it swings in, a cheeky look back, and he's in (the cut). The door swings shut behind him and
// the light snaps to red (hit-stop).
c.prop(2.82, "wallet", { open: 0 }, 0.06, "inOut");
const HOLSTER = patProps({ at: G0, yaw: G_YAW })[0];
c.arm(2.8, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOLSTER.x, HOLSTER.y, HOLSTER.z] }, 0.1, "inOut");
A(2.9, "gsl", "release", { prop: "wallet", to: [HOLSTER.x, HOLSTER.y, HOLSTER.z], dur: 0.03 });
c.prop(2.91, "wallet", { tip: 360, rot: HOLSTER.rot }, 0.03, "inOut");
c.at(2.93, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.03, ease: "in", reason: "back down in his holster (part of his costume), so it runs with him" });
A(2.78, "gsl", "look", { to: [-0.7, 0.1], dur: 0.06, blink: false });   // eyes to the toilet first
A(2.9, "gsl", "turn", { to: yawTo(G0, DOOR_FRONT), dur: 0.18 });
c.arm(2.84, "gsl", "L", { o: [0.36, 0.62, -0.12] }, 0.1, "out"); A(2.86, "gsl", "grip", { side: "L", shape: "point", dur: 0.06 });   // the thumb jab over his shoulder
A(2.84, "gsl", "expr", { expr: "eager", set: { curve: 0.7, open: 0.5 }, dur: 0.08 });
c.say(2.84, "gsl", "bathroom!", 0.4, "excited", { voice: false, sub: "Bathroom!", pos: SUB_HIGH });
// the dash: to the toilet door, quick little steps
A(2.92, "gsl", "move", { to: DOOR_FRONT, dur: 0.22, ease: "inOut", steps: 3 });
c.arm(3.0, "gsl", "L", "rest", 0.15, "inOut"); A(3.0, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
A(3.08, "gsl", "turn", { to: 180, dur: 0.08 });
sfx(2.98, "step-indoor", { gain: 0.3, reason: "his quick hurried steps on the boards (the gait adds the rest)" });
// at the door: his right palm flat on the push plate, the door swings in; a cheeky look back over his shoulder
const PLATE = [r3(LOO.x + LOO.w / 2 - 0.12), 0.84, r3(LOO.z + 0.03)];
c.arm(2.91, "gsl", "R", { o: [0.12, 0.45, 0.12] }, 0.08, "out");   // out from the holster round his side
c.arm(3.02, "gsl", "R", { world: PLATE }, 0.09, "out"); A(3.04, "gsl", "grip", { side: "R", shape: "flat", dur: 0.06 });
c.prop(3.13, "loo", { open: 0.85 }, 0.14, "out");
sfx(3.13, "door-open", { gain: 0.35, reason: "he pushes the toilet door open" });
// he spins round to us with a cheeky grin, a thumb at the toilet, and backs in through the doorway (the door swings on)
c.arm(3.13, "gsl", "R", "rest", 0.1, "inOut"); A(3.13, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.08 });
A(3.15, "gsl", "turn", { to: 25, dur: 0.16 });
A(3.17, "gsl", "look", { to: [0.35, 0.05], dur: 0.06, blink: false });
A(3.17, "gsl", "expr", { expr: "cocky", set: { curve: 0.9 }, dur: 0.06 });
c.arm(3.16, "gsl", "L", { o: [0.3, 0.66, -0.1] }, 0.14, "out"); A(3.2, "gsl", "grip", { side: "L", shape: "point", dur: 0.06 });
A(3.24, "gsl", "move", { to: DOORWAY, dur: 0.12, ease: "in", steps: 2 });
see(3.25, 3.34, ["gsl.face", "loo"], "panel 3: he backs into the toilet with a cheeky grin, a thumb at the door");
// the cut (3.35): inside, he's out of the door's swing; the door swings shut behind him, the light snaps red
A(3.35, "gsl", "move", { to: HIDE, dur: 0.03, steps: 0, reason: "on the cut, inside the toilet (behind the wall): out of the door's swing" });
A(3.35, "gsl", "turn", { to: yawTo(HIDE, [-1.27, -1.4]), dur: 0.03 });
c.arm(3.36, "gsl", "L", "rest", 0.2, "inOut"); A(3.36, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
c.prop(3.36, "loo", { open: 0 }, 0.12, "in");
sfx(3.47, "door-close", { gain: 0.5, reason: "the toilet door swings shut behind him" });
c.prop(r3(HS1 - 0.01), "loo", { on: 1 }, 0.01, "linear");   // (red by the hit-stop's frozen frame)
sfx(r3(HS1 - 0.01), "latch-click", { gain: 0.6, reason: "the lock snaps across: the light over the door goes red" });
c.hitStop(HS1, 3);
see(3.5, 3.62, ["loo"], "the door shut, its light red (hit-stop)");
// the friends watch him go
A(2.9, "wiz", "look", { to: [-0.7, 0.05], dur: 0.15, blink: false }); A(2.9, "rea", "look", { to: [-0.6, 0.0], dur: 0.15, blink: false });
A(3.0, "wiz", "turn", { to: -95, dur: 0.3 }); A(3.0, "rea", "turn", { to: -40, dur: 0.3 });
A(2.95, "sam", "look", { to: [-0.55, 0.0], dur: 0.15, blink: false });
polish(1.6, 3.4);

// ---------------------------------------------------------------- 4 THE GETAWAY 3.5-5.2 (panel 4)
// the Wizard and Reaper look at each other. One slow nod. They take their coats off the bar's edge, throw them on and
// tiptoe out to the right in a line; the Samurai watches them go, deadpan, still polishing. The front door's bell
// rings softly as they slip out (off screen right).
A(3.4, "wiz", "turn", { to: -80, dur: 0.2 }); A(3.4, "rea", "turn", { to: 55, dur: 0.2 });
A(3.42, "wiz", "look", { to: [-0.5, 0.0], dur: 0.1, blink: false }); A(3.42, "rea", "look", { to: [0.4, 0.0], dur: 0.1, blink: false }); A(3.36, "rea", "face", { lid: 0.3, dur: 0.1 });   // (his lids up from the moth droop: the look reads)
A(3.55, "wiz", "expr", { expr: "smug", dur: 0.12 }); A(3.55, "rea", "expr", { expr: "smug", dur: 0.12 });
A(3.68, "wiz", "nod", { times: 1 }); A(3.68, "rea", "nod", { times: 1 });
see(3.66, 3.9, ["wiz.face", "rea.face"], "panel 4: the Wizard and Reaper look at each other, one slow nod");
// the tiptoe: low, careful, quick little high steps, hands up in front, eyes on the toilet door
const tiptoe = (t, who, to, dur, steps, lean = 8) => {
  A(t, who, "crouch", { to: 0.25, dur: 0.15 }); A(t, who, "pitch", { to: lean, dur: 0.15 });
  A(t, who, "move", { to, dur, ease: "inOut", steps: steps ?? Math.max(3, Math.round(dur * 6)) });
  A(r3(t + dur), who, "crouch", { to: 0, dur: 0.15 }); A(r3(t + dur), who, "pitch", { to: 0, dur: 0.15 });
};
const tiphands = (t, who) => { for (const s of ["L", "R"]) { c.arm(t, who, s, { o: [-0.12, 0.42, 0.32] }, 0.2, "inOut"); A(r3(t + 0.02), who, "grip", { side: s, shape: "relaxed", set: { curl: 0.3 }, dur: 0.15 }); } };
// the coats: a turn to the bar, a hand to the coat's collar, and it whips off the edge and round the shoulders
const coatOn = (t, who, coat, worn, x) => {
  c.arm(t, who, "R", { world: [x, r3(BAR.h + 0.09), r3(NOSE + 0.04)] }, 0.14, "out"); A(t, who, "grip", { side: "R", shape: "hold", dur: 0.1 });
  c.prop(r3(t + 0.14), coat, { fade: 1 }, 0.02, "linear");
  c.at(r3(t + 0.14), { do: "prop", id: worn, set: { on: 1 }, dur: 0.28, ease: "out", reason: "the coat he took off the bar's edge swings round his shoulders (the draped copy goes on the same frame)" });
  c.arm(r3(t + 0.16), who, "R", { o: [0.12, 0.95, -0.15] }, 0.12, "out");   // the throw: up over the shoulder
  c.arm(r3(t + 0.3), who, "R", { o: [-0.12, 0.42, 0.32] }, 0.15, "inOut"); A(r3(t + 0.3), who, "grip", { side: "R", shape: "relaxed", set: { curl: 0.3 }, dur: 0.12 });
  sfx(r3(t + 0.16), "cloth", { gain: 0.35, reason: "the coat thrown on round his shoulders" });
};
const W_COAT = [0.5, -0.68];
A(3.86, "rea", "look", { to: [0.3, -0.2], dur: 0.1, blink: false });
A(3.88, "rea", "turn", { to: 160, dur: 0.25 });
coatOn(4.05, "rea", "coatR", "wcoatR", -0.25);
A(3.84, "wiz", "turn", { to: yawTo(W0, W_COAT), dur: 0.26 });
tiptoe(3.86, "wiz", W_COAT, 0.4, 3);
A(4.26, "wiz", "turn", { to: 180, dur: 0.15 });
coatOn(4.32, "wiz", "coatW", "wcoatW", 0.5);
tiphands(3.9, "wiz");
// out to the right along the bar, one behind the other, glancing back at the toilet door
const OUT_W = [2.95, -0.72], OUT_R = [1.9, -0.82];
A(4.42, "rea", "turn", { to: 50, dur: 0.3 });   // (more along his way than to us: turned to us, his coat and hands brushed the table and the lemonade)   // a sideways sneak, faces to us tiphands(4.5, "rea");
A(4.55, "wiz", "turn", { to: 28, dur: 0.3 });
tiptoe(4.66, "wiz", OUT_W, 1.3); tiptoe(4.66, "rea", OUT_R, 1.3, undefined, 2);
for (const sd of ["L", "R"]) c.arm(4.5, "rea", sd, { o: [-0.1, 0.6, 0.2] }, 0.18, "inOut");   // (his hands up high and close to his chest: held out at the Wizard's height his right sleeve and arm brushed the table top going past)   // (Reaper turned to us leans less: leaning, his coat brushed the lemonade on the table)
A(4.55, "rea", "look", { to: [-0.7, 0.1], dur: 0.1, blink: false }); A(4.65, "wiz", "look", { to: [-0.7, 0.05], dur: 0.1, blink: false });
A(4.62, "wiz", "expr", { expr: "happy", set: { curve: 0.8 }, dur: 0.12 }); A(4.66, "wiz", "face", { lid: 0.9, dur: 0.1 });   // eyes shut, grinning (panel 4)
A(4.6, "rea", "expr", { expr: "smug", dur: 0.12 });
// motion ticks at their feet (panel 4): a little dust tick and a bounce on every other step while they're in the wide
// (the step times and places come from the planted gait's footfalls for these moves)
for (const [who, steps] of [["wiz", [[4.77, 0.66], [4.92, 1.01]]], ["rea", [[4.76, -0.43], [4.91, -0.08]]]]) for (const [t, x] of steps) {
  c.at(t, { fx: "poof", pos: [r3(x - 0.06), 0.02, -0.62], dur: 0.25, color: "#e9d8c0", puffs: 3, sparks: 0, size: 0.12, lift: 0.03 });
  if (who === "wiz") A(t, who, "squash", { amount: 0.03, dur: 0.07 });   // (not Reaper: his bounce popped his elbow in his coat)
}
sfx(4.72, "step-wood", { gain: 0.12, reason: "a careful tiptoe on the boards (the gait adds the rest, soft)" });
A(5.19, "wiz", "move", { to: [3.6, -0.95], dur: 0.01, steps: 0, reason: "on the cut to the peek: out of the front door (the peek shot looks along their way out)" });
A(5.19, "rea", "move", { to: [3.6, 0.15], dur: 0.01, steps: 0, reason: "on the cut to the peek: out of the front door (the peek shot looks along their way out)" });
sfx(5.96, "ding", { gain: 0.16, reason: "the pub's front-door bell, softly, as they slip out off screen right (heard over the peek)" });
see(4.1, 4.45, ["rea", "wiz", "coatW"], "panel 4: the coats off the bar's edge and on");
see(4.7, 5.15, ["rea.face", "wiz.face"], "panel 4: tiptoeing out, Reaper smug, the Wizard grinning");
// the Samurai watches them go, deadpan, still polishing
A(3.9, "sam", "look", { to: [-0.2, -0.1], dur: 0.2, blink: false });
A(4.7, "sam", "look", { to: [0.5, -0.1], dur: 0.25, blink: false });
polish(3.6, 4.6);

// ---------------------------------------------------------------- 5 ROUND DODGED 5.2-6.3 (panel 5)
// the lock slides back (green); he pulls the door open from inside and steps into the doorway: the table's empty. Round
// dodged! A grin; he strolls back to it, pleased, to Reaper's place (the leftover lemonade).
A(5.0, "gsl", "look", { to: [-0.3, 0.0], dur: 0.1, blink: false });
const HANDLE = (deg) => { const a = (deg * Math.PI) / 180, R = LOO.w - 0.13, n = 0.09; return [r3(HINGE[0] + R * Math.cos(a) - n * Math.sin(a)), 0.84, r3(HINGE[1] - R * Math.sin(a) - n * Math.cos(a))]; };
c.arm(5.02, "gsl", "R", { world: HANDLE(0) }, 0.14, "out"); A(5.02, "gsl", "grip", { side: "R", shape: "hold", dur: 0.1 });
c.prop(5.18, "loo", { on: 0 }, 0.02, "linear");
sfx(5.18, "latch-click", { gain: 0.45, reason: "the toilet lock slides back: the light goes green" });
c.prop(5.22, "loo", { open: 1 }, 0.2, "out");   // all the way: the leaf clears his brim as he steps into the doorway
sfx(5.22, "door-open", { gain: 0.3, reason: "he pulls the toilet door open" });
c.arm(5.22, "gsl", "R", { world: HANDLE(15) }, 0.06, "out");   // the pull, then he lets it swing on
c.arm(5.28, "gsl", "R", { o: [0.14, 0.42, 0.16] }, 0.1, "out"); c.arm(5.42, "gsl", "R", "rest", 0.18, "inOut");   // off the handle out to his side first (round his own body), then down A(5.33, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.1 });
A(5.34, "gsl", "turn", { to: 25, dur: 0.18 });
A(5.36, "gsl", "move", { to: [PEEK[0], -1.86], dur: 0.12, ease: "inOut", steps: 2 });   // (once the leaf has swung past his brim)
A(5.48, "gsl", "move", { to: PEEK, dur: 0.1, ease: "out", steps: 1 });
A(5.42, "gsl", "look", { to: [0.4, -0.1], dur: 0.06, blink: false });
A(5.55, "gsl", "look", { to: [0.65, -0.15], dur: 0.06, blink: false });   // the table: empty
A(5.64, "gsl", "look", { to: [0.2, -0.1], dur: 0.06, blink: false });
act.grin(c, 5.66, "gsl");
A(5.68, "gsl", "squash", { amount: -0.04, dur: 0.15 });
see(5.55, 5.85, ["gsl.face", "loo", "table", "sam.face", "reader"], "panel 5: he peeks out of the toilet at the empty table; a grin; the Samurai behind the bar with the reader");
// back to the table, chest out
// (he steps out of the doorway in the peek shot; the rest of the way back happens between the shots: on the cut he is
// a step from the table. Covering it all in the shot was a 4 m/s dash, and its lean jumped.)
const G6_PRE = [r3(G6[0] - 0.25 * Math.sin((G6_YAW * Math.PI) / 180)), r3(G6[1] - 0.25 * Math.cos((G6_YAW * Math.PI) / 180))];   // a step behind his spot
A(5.86, "gsl", "turn", { to: yawTo(PEEK, OUTSIDE), dur: 0.12 });
A(5.88, "gsl", "move", { to: [-1.7, -1.2], dur: 0.36, ease: "inOut", steps: 3 });
for (const s of ["L", "R"]) c.arm(5.95, "gsl", s, { o: [0.04, 0.5, 0.18] }, 0.15, "inOut");   // hands in front, chest out
A(6.27, "gsl", "move", { to: G6_PRE, dur: 0.02, steps: 0, reason: "on the cut to the two-shot: back across the room to a step from the table" });
A(6.27, "gsl", "turn", { to: G6_YAW, dur: 0.02 });
A(6.3, "gsl", "move", { to: G6, dur: 0.18, ease: "out", steps: 2 });   // the last step up to the table, facing it
A(5.88, "gsl", "expr", { expr: "happy", set: { curve: 0.85, open: 0.25 }, dur: 0.12 });
A(5.95, "gsl", "look", { to: [0.4, -0.25], dur: 0.1, blink: false });   // eyes on the leftover lemonade
// the Samurai: the glass down on the bar, the reader off the bar's end in both hands, out from behind the bar to the
// table (round the bar's right end) while Gunslinger is in the toilet doorway
const sgDown = [r3(SGLASS.x), BAR.h, r3(SGLASS.z)];
let ts = sg.place(4.6, sgDown, 0.12);
sfx(ts, "put-down-glass", { gain: 0.2, reason: "the Samurai sets his polished glass down on the bar" });
sg.release(r3(ts + 0.02), { rest: false, back: 0.08 });
A(4.7, "sam", "look", { to: [0.3, -0.35], dur: 0.12, blink: false });
A(4.72, "sam", "turn", { to: yawTo(S0, READER0), dur: 0.12 });   // square to the reader: both hands reach it on their own sides
const rd = grips.box(c, "sam", READER, { height: 1.5 });   // (high on its sides: the gloves clear the bar top)
let tr = rd.take(4.82, { reach: 0.15, settle: 0.05 });   // (a quick closing grab: the gloves on its ends only a moment before it lifts)
const SP = [[0.95, -2.15], [1.15, -1.0], S6];
const carryAt = (p, yaw) => front(p, yaw, 0.6, 0, 0.56);
tr = rd.carry(r3(tr), front(S0, yawTo(S0, READER0), 0.6, 0, 0.465), 0.12, "out");   // (just over the bar top: held higher, his gloves covered his eyes in the peek shot)
// he holds it behind the bar through the peek (panel 5); on the cut to the two-shot he has come round the bar's end
// and is a step from the table's right side (a run with it round the bar in the peek shot leaned in jumps)
const S6_PRE = [0.72, -0.47], S6_IN = yawTo(S6_PRE, S6);
A(6.27, "sam", "move", { to: S6_PRE, dur: 0.02, steps: 0, reason: "on the cut to the two-shot: out from behind the bar round its end, a step from the table" });
A(6.27, "sam", "turn", { to: S6_IN, dur: 0.02 });
rd.carry(6.27, carryAt(S6_PRE, S6_IN), 0.02, "linear", { rot: S6_IN });
A(6.3, "sam", "move", { to: S6, dur: 0.3, ease: "out", steps: 2 });
rd.carry(6.3, carryAt(S6, S6_IN), 0.3, "out", { rot: S6_IN });
A(6.56, "sam", "turn", { to: S6_YAW, dur: 0.12 });
const T_SAM = 6.66;
A(5.25, "sam", "look", { to: [0.6, 0.0], dur: 0.12, blink: false });
A(6.3, "sam", "look", { to: [-0.4, -0.1], dur: 0.15, blink: false });

// ---------------------------------------------------------------- 6 THE LEFTOVERS 6.3-7.0 (panel 6)
// at the table with a happy sigh, he snatches up Reaper's leftover lemonade: eyes shut, a long sip. Beside him the
// Samurai sets the reader down. (His left hand drops to his side: a hand on the table reached across in front of him
// and into the Samurai.)
c.arm(6.4, "gsl", "L", { o: [-0.14, 0.36, 0.26] }, 0.3, "inOut"); A(6.4, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.2 });   // (in front of his belly, under the table top: a hand hanging at his side touched the Samurai)
A(6.52, "gsl", "squash", { amount: 0.03, dur: 0.25 });
const lem = grips.mug(c, "gsl", props.find((p) => p.id === "glass4"), { side: "R", height: 1.4 });   // (round its top, as the Wizard and the Samurai hold theirs: the big glove clears the table)
A(6.36, "gsl", "look", { to: [0.1, -0.38], dur: 0.08, blink: false });   // eyes to the glass first
let tl = lem.secure(lem.approach(6.47, 0.15), 0.03);
A(r3(tl - 0.1), "gsl", "face", { lid: 0, dur: 0.08 });
// at his lips: the layout's mouth point with his head tipped back is [-0.45, 0.60, -0.40]; the glass's base 10 cm under
// it and its middle a glass radius plus 4 cm in front of it (aimed into the face, the glove stopped and the glass slipped)
const SIP = [-0.48, 0.5, -0.33];
lem.carry(r3(tl), [LEMON[0], r3(TOP + 0.12), LEMON[1]], 0.06, "out");
tl = lem.carry(r3(tl + 0.06), SIP, 0.22, "inOut");   // (not faster: at 0.16 s the glove lagged and the glass slipped as it stopped)   // (upright: his head tips back instead; a tipped glass slipped in the glove)
A(r3(tl - 0.22), "gsl", "pitch", { to: -5, dur: 0.22 });   // the head tips back for the sip
A(r3(tl - 0.05), "gsl", "face", { lid: 1, dur: 0.08 });
A(r3(tl), "gsl", "expr", { expr: "happy", set: { curve: 0.8, open: 0, pucker: 0.4 }, dur: 0.1 });
sfx(r3(tl + 0.05), "ai/sip", { gain: 0.4, reason: "his long, pleased sip of the leftover lemonade, eyes shut" });
c.prop(r3(tl + 0.05), "glass4", { fill: 0.15 }, 0.5, "linear");
see(r3(tl), r3(tl + 0.3), ["gsl.face", "glass4"], "panel 6: eyes shut, sipping the leftover lemonade, very pleased");
// the Samurai sets the reader on the table in front of him
A(r3(T_SAM - 0.12), "sam", "pitch", { to: 6, dur: 0.15 }); A(7.3, "sam", "pitch", { to: 0, dur: 0.3 });
let tp = rd.place(T_SAM, [READER_SET[0], TOP, READER_SET[1]], 0.16);
sfx(tp, "put-down", { gain: 0.55, reason: "the Samurai sets the card reader down on the table" }); sfx(tp, "kenney/impact-wood-light", { gain: 0.35, reason: "a light knock layered on the reader set-down: the put-down alone is mostly lows, under the bed on a phone" });
rd.release(r3(tp + 0.02), { rest: false, back: 0.06 });
// (let go where it was put: a release with `to` on its own spot, so it is the prop's own again and the push below can
// slide it; a let-go body would start inside the hand's collision ball and be flung off the table)
Object.assign(c.items.findLast((x) => x.do === "release" && x.prop === "reader"), { to: [READER_SET[0], TOP, READER_SET[1]], dur: 0.05 });
A(r3(tp), "sam", "look", { to: [-0.4, -0.2], dur: 0.12, blink: false });

// ---------------------------------------------------------------- 7 THE BILL LANDS 7.0-8.6 (panel 7)
// one finger behind it: a flat push, and the reader slides across the table and stops exactly in front of him
// (hit-stop): 84.00. The music cuts. He opens his eyes on it: shock. Outside the window the Wizard and Reaper wave.
const RX = (k) => [r3(READER_SET[0] + (READER_STOP[0] - READER_SET[0]) * k), r3(READER_SET[1] + (READER_STOP[1] - READER_SET[1]) * k)];
const behind = (k, up = 0.09) => { const [x, z] = RX(k), dx = READER_STOP[0] - READER_SET[0], dz = READER_STOP[1] - READER_SET[1], L = Math.hypot(dx, dz); return [r3(x - (dx / L) * 0.11), r3(TOP + up), r3(z - (dz / L) * 0.11)]; };
const T_PUSH = 7.05;
c.arm(r3(T_PUSH - 0.1), "sam", "L", { world: behind(0, 0.1) }, 0.08, "out"); A(r3(T_PUSH - 0.1), "sam", "grip", { side: "L", shape: "point", dur: 0.08 });
c.arm(T_PUSH, "sam", "L", { world: behind(0.3) }, 0.08, "in");
c.arm(r3(T_PUSH + 0.12), "sam", "L", { world: behind(0.3, 0.11) }, 0.12, "out");
c.arm(r3(T_PUSH + 0.24), "sam", "L", { world: [0.22, r3(TOP + 0.12), -0.08] }, 0.12, "inOut"); c.arm(7.4, "sam", "L", "rest", 0.25, "inOut");   // (back over the table's edge first, then down) A(7.4, "sam", "grip", { side: "L", shape: "relaxed", dur: 0.2 });   // (a flick: the reader slides on alone and his hand drops; held out after it, his arm crossed his chin through the shock)
c.arm(r3(tp + 0.1), "sam", "R", { o: [0.06, 0.3, -0.1] }, 0.3, "inOut"); A(r3(tp + 0.1), "sam", "grip", { side: "R", shape: "relaxed", dur: 0.2 });   // the other hand down at his side, a little back: off the reader (it came between us and his eyes) and clear of Gunslinger beside him
c.at(T_PUSH, { do: "prop", id: "reader", set: { x: RX(1)[0], z: RX(1)[1] }, dur: r3(HS2 - T_PUSH), ease: "out", reason: "pushed by his finger, the reader slides across the table on its own and slows to a stop in front of Gunslinger (a slide on a flat top: the ease-out is a constant friction deceleration, no fall)" });
sfx(r3(T_PUSH + 0.02), "scrape", { gain: 0.18, dur: 0.3, reason: "the reader sliding across the wooden table top" });
c.hitStop(HS2, 3);
sfx(HS2, "put-down", { gain: 0.45, reason: "the reader stops dead in front of him: a small wooden knock" });
c.prop(r3(HS2 + 0.02), "reader", { glow: 1 }, 0.05, "out"); c.prop(r3(V(8.8)), "reader", { glow: 0 }, 0.3, "inOut");   // (lit through the shock, review B)
sfx(r3(HS2 + 0.03), "timer-beep", { gain: 0.35, reason: "the card reader's beep: the bill is up, 84.00" });
// his eyes open on it
A(7.32, "gsl", "face", { lid: 0, dur: 0.06 });
A(7.34, "gsl", "look", { to: [0.2, -0.55], dur: 0.06, blink: false });
act.shock(c, 7.45, "gsl", { hold: 0.7 });
// the glass comes down from his lips onto the table beside him (his right hand is free for the hat tip at the wink)
let tg = lem.carry(7.5, [G_PUT[0], r3(TOP + 0.003), G_PUT[1]], 0.2, "in");   // (gathering speed into the bang)
c.prop(tg, "glass4", { squash: 0.05 }, 0.05, "out"); c.prop(r3(tg + 0.05), "glass4", { squash: 0 }, 0.15, "settle");   // a two-frame squash as it hits the wood
sfx(r3(tg), "put-down-glass", { gain: 1.0, reason: "he sets the lemonade down hard at the bill: a glass knock on the wood" });
lem.release(r3(tg + 0.03), { back: 0.1, rest: { o: [0.1, 0.48, 0.2] } });   // (the hand up off it, ready for the hat tip)
// (let go where it stands: a release with `to`, so it isn't a physics body that starts inside the glove's collision ball)
Object.assign(c.items.findLast((x) => x.do === "release" && x.prop === "glass4"), { to: [G_PUT[0], TOP, G_PUT[1]], dur: 0.05 });
A(7.42, "gsl", "pitch", { to: -6, dur: 0.1 }); A(8.45, "gsl", "pitch", { to: 0, dur: 0.25 });   // the head jerks back at the bill
act.emote(c, 7.55, "gsl", "!", { dur: 0.6, size: 120, dx: 0.32, dy: -0.55, angle: 8 });
see(V(7.5), V(8.3), ["gsl.face", "reader"], "panel 7: the reader in front of him, 84.00; his shocked face");
A(7.95, "gsl", "look", { to: [0.45, 0.5], dur: 0.1, blink: false });   // up to the window: the friends waving (review B: the viewer finds them because he does)
A(8.35, "gsl", "look", { to: [0.55, 0.1], dur: 0.1, blink: false });   // and back to the Samurai
// the Samurai: deadpan, finger still behind the reader, eyes on him
A(7.2, "sam", "look", { to: [-0.5, 0.0], dur: 0.12, blink: false }); A(7.2, "sam", "face", { lid: 0.35, dur: 0.15 });
c.at(6.28, { do: "prop", id: "towel", set: { x: -0.3, rot: -10 }, dur: 0.02, reason: "on the cut to the two-shot: his towel onto the shoulder the camera sees (turned to Gunslinger, on the other one it hid behind his head; review B)" });
// outside: the Wizard and Reaper stand on the street at the window, snickering to each other, then wave at him with
// little fingers. (No walk along the street: it is a step up, which the planted gait reads as off the floor, so a walk
// there had no footsteps and its lean jumped.)
const OW = [2.0, -3.35], OR = [3.02, -3.35];
A(6.0, "wiz", "move", { to: OW, y: 0.45, dur: 0.03, steps: 0, reason: "off screen: from the front door round onto the street outside" });
A(6.0, "rea", "move", { to: OR, y: 0.45, dur: 0.03, steps: 0, reason: "off screen: from the front door round onto the street outside" });
for (const w of ["wiz", "rea"]) { for (const s of ["L", "R"]) { const inner = (w === "wiz") === (s === "L"); c.arm(6.0, w, s, inner ? { o: [-0.14, 0.4, 0.28] } : "rest", 0.03); A(6.0, w, "grip", { side: s, shape: "relaxed", dur: 0.03 }); } A(6.0, w, "crouch", { to: 0, dur: 0.03 }); A(6.0, w, "pitch", { to: 0, dur: 0.03 }); A(6.0, w, "face", { lid: 0, dur: 0.03 }); }
A(6.0, "wiz", "turn", { to: -15, dur: 0.03 }); A(6.0, "rea", "turn", { to: -20, dur: 0.03 });
A(6.4, "wiz", "look", { to: [0.6, 0.0], dur: 0.12, blink: false }); A(6.42, "rea", "look", { to: [-0.6, 0.0], dur: 0.12, blink: false });   // to each other
A(6.48, "wiz", "expr", { expr: "happy", set: { curve: 0.8, open: 0.3 }, dur: 0.15 }); A(6.5, "rea", "expr", { expr: "smug", dur: 0.15 });
A(6.55, "wiz", "squash", { amount: 0.03, dur: 0.2 }); A(6.75, "wiz", "squash", { amount: -0.02, dur: 0.2 });   // a snicker
// they wave with their outer hands (the Wizard's right, Reaper's left), away from each other; the inner hands are
// in front of them from the start (hanging at their sides, Reaper's glove went into the Wizard's coat)
const wave = (t0, t1, who, side) => { const sx = side === "R" ? -1 : 1; c.arm(t0, who, side, { o: [0.2, 0.78, 0.18] }, 0.15, "out"); A(t0, who, "grip", { side, shape: "flat", dur: 0.1 }); for (let t = r3(t0 + 0.15), k = 0; t < t1; t = r3(t + 0.14), k++) c.arm(t, who, side, { o: [k % 2 ? 0.26 : 0.16, 0.79, 0.18] }, 0.14, "inOut"); return sx; };
wave(7.4, 9.7, "wiz", "R"); wave(7.45, 9.7, "rea", "L");
A(7.2, "wiz", "look", { to: [-0.4, -0.1], dur: 0.12, blink: false }); A(7.2, "rea", "look", { to: [-0.5, -0.1], dur: 0.12, blink: false });
A(7.3, "wiz", "expr", { expr: "happy", set: { curve: 0.9, open: 0.4 }, dur: 0.12 }); A(7.3, "rea", "expr", { expr: "smug", dur: 0.12 });
see(V(7.8), V(8.6), ["wiz.face", "rea.face"], "panel 7: the Wizard and Reaper outside the window, waving");

// ---------------------------------------------------------------- 8 THE WINK 8.6-9.8 (panel 8)
// to the Samurai: two fingers to the brim, the wink, "Next time's on me!". The Samurai doesn't blink; he taps the reader
// once with one finger. Outside the Wizard snickers.
const WK = V(8.8);
A(r3(WK - 0.1), "gsl", "look", { to: [0.5, 0.1], dur: 0.08, blink: false });
wink(c, { who: "gsl", t: WK, until: END, pos: SUB_HIGH, side: "R", look: [0.5, 0.1] });
// (the line sits a little smaller, right of the middle, in the gap between his hat, the friends in the window and the
// Samurai's head: at the other lines' place it covered them for the whole second)
Object.assign(c.captions.find((x) => x.text === "Next time's on me!"), { pos: 610, x: 670, size: 52 });
// a lean over the table to reach it (the reader stopped in front of Gunslinger, past the Samurai's easy reach)
const TAP = [r3(READER_STOP[0] + 0.04), r3(READER_STOP[1] - 0.03)];
A(r3(WK + 0.4), "sam", "turn", { to: -55, dur: 0.25 }); A(r3(WK + 0.5), "sam", "pitch", { to: 6, dur: 0.2 });   // (turned to us, he taps with the hand on Gunslinger's side: his left one, on our side, crossed his chin)
c.arm(r3(WK + 0.52), "sam", "R", { world: [TAP[0], r3(TOP + 0.27), TAP[1]] }, 0.15, "out"); A(r3(WK + 0.52), "sam", "grip", { side: "R", shape: "point", dur: 0.1 });
c.arm(r3(WK + 0.67), "sam", "R", { world: [TAP[0], r3(TOP + 0.15), TAP[1]] }, 0.1, "linear");
sfx(r3(WK + 0.77), "kenney/impact-wood-light", { gain: 0.3, reason: "the Samurai's one finger tap on the reader" });
c.arm(r3(WK + 0.78), "sam", "R", { world: [TAP[0], r3(TOP + 0.24), TAP[1]] }, 0.1, "out");
// the reader answers the tap: a two-frame squash and a flash of its screen (review B: the tap read too small)
c.prop(r3(WK + 0.77), "reader", { squash: 0.05, glow: 1 }, 0.03, "out"); c.prop(r3(WK + 0.8), "reader", { squash: 0 }, 0.12, "settle"); c.prop(r3(WK + 0.89), "reader", { glow: 0 }, 0.2, "inOut");
A(r3(WK + 0.3), "sam", "face", { lid: 0.35, dur: 0.01 });
for (const t of [9.0, 9.18, 9.36]) A(t, "wiz", "squash", { amount: 0.03, dur: 0.09 });   // snickering
A(9.0, "wiz", "face", { lid: 0.9, dur: 0.1 });
see(r3(WK + 0.2), r3(WK + 0.75), ["gsl.face", "moth", "sam.face"], "panel 8: the wink and the hat tip to the deadpan Samurai, the moth lifting");
see(r3(WK + 0.8), END, ["reader", "sam.face"], "panel 8: the Samurai's finger on the 84.00");

// blinks off the lines and the key looks
act.blinksAt(c, "wiz", [1.3, 3.3, 6.2]); act.blinksAt(c, "rea", [1.4, 3.3, 6.3]); act.blinksAt(c, "gsl", [1.35, 4.2]); c.A(0, "sam", "noblink");   // the Samurai never blinks (cast, brief)

// ---------------------------------------------------------------- shots (Jonny's panels)
// the wide (panel 1), medium-wide (reach rules v2, B1): the three round the table, the Samurai behind the bar between
// Reaper and the Wizard, the toilet door's light at the top left, the window at the right
const WIDE = { pos: [-0.5, 1.5, 2.9], look: [-0.45, 0.8, -0.9], fov: 66 };
// the pocket pat (panel 2): Gunslinger chest up with the whole hat, the Wizard's arm at the right edge
const PATSHOT = { pos: [0.15, 1.2, 2.72], look: [-1.1, 0.88, 0.22], fov: 40 };
// the dash for the toilet (panel 3): from the front right, the door and its light ahead
const DOOR = { pos: [0.2, 1.4, 2.4], look: [-1.55, 0.95, -1.05], fov: 38 };
// the door shuts, the nod and the getaway (panel 4): wide from in front of the table, the red light at the top left,
// the bar with the coats and the Samurai behind it, the way out at the right
const WIDE2 = { pos: [-0.1, 1.35, 3.0], look: [-0.3, 0.8, -1.0], fov: 62 };   // (the door shot holds through the red light now, so this one keeps the Wizard's face clear of the right edge)
// the peek (panel 5): lower, from the right of the table, the empty table in front, the toilet door behind
const PEEKSHOT = { pos: [1.6, 0.95, 2.2], look: [-0.8, 0.78, -1.9], fov: 58 };   // (wide and from the right, as panel 5: the Samurai behind the bar with the reader in it too; review A)
// the two-shot at the table (panels 6-8): Gunslinger left, the Samurai right, the window behind and above them
// (low enough that the reader on the table reads, high enough that the street outside shows over their heads)
const TWO = { ...frame([0.03, 0.85, -0.45], { az: -36, el: 20, h: 2.3, fov: 45, push: 0.08, dur: 3.5 }) };   // (lower and a smaller push-in than the first try: the friends outside stay under TikTok's top bar and Reaper in frame; review A)
const beats = c.beats([
  ["P1 pay up", 0, WIDE, "hook"],
  ["P2 the pocket pat", PAT.from, PATSHOT],
  ["P3 bathroom", 2.95, DOOR],
  ["P4 the nod", 3.62, WIDE2, "reaction"],
  ["P4 the getaway", 3.85, null, "escalation"],
  ["P5 round dodged", 5.2, PEEKSHOT],
  ["P6 the leftovers", 6.3, TWO],
  ["P8 the wink", WK, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "his-round",
  title: "That one friend who never has money… when it's his round",
  idea: "Never has money, episode 3: three empty glasses and it's his round; the pocket pat finds the moth; 'Bathroom!', he hides in the toilet; his friends put their coats on and tiptoe out; he comes back pleased to an empty table, and the Samurai bartender slides him the whole night's bill, 84.00; next time's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.6,
  set: { type: "plain", color: "#1d1712", floor: "#7a4a2a", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/pub-backbar-night.png", z: -3.65, center: [-0.45, 2.0], height: 4.0, depth: false, motion: false, dust: 6 },
    plates: [{ src: "assets/plates/pub-street-night.png", z: -3.6, center: [2.35, 1.3], height: 2.6 }],
    lighting: 2, hatch: { boil: 0.25 } },
  // the brief asks for an Irish fiddle reel in D; beat.mjs has no folk style, so the plucky "bounce" in D with the whistle
  // lead (the reel's tune); quiet (intro) while they tiptoe, full when he strolls back, cut dead on the reader's stop,
  // the lead alone (music box) for the wink. Parts on the video clock
  music: { style: "bounce", key: 2, lead: "whistle", lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 3.9, part: "intro" }, { at: 6.0, part: "main" }, { at: 7.5, part: "stop" }, { at: 8.85, part: "musicbox" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["wiz", "gsl", "rea", "glass3", "sam"], hint: 0.3, what: "the Wizard sets the third empty glass down and points: your round!" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // windows on the video clock (this storyboard is gate 1): after the hit-stops at 3.5 and 7.4 the times are 0.1 and
  // 0.2 s later than the story times above
  allowClip: [
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.0, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: 2.27, to: 2.33, checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: 2.38, to: 2.52, checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", from: 1.5, to: 1.78, checks: ["rig-jump", "motion"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s (episode 1's block)" },
    { who: "gsl", from: 3.33, to: 3.4, checks: ["motion", "rig-jump"], reason: "inside the toilet, behind the wall beside the doorway (the door shot sees only the doorway), he is moved out of the door's swing as it shuts" },
    { who: "gsl", with: "loo", from: 3.0, to: 6.45, checks: ["clipping"], reason: "he is inside the toilet room (the door's own lit room behind its wall): in the doorway, then behind the shut door, then in the doorway again" },
    { who: "gsl", with: "loo", from: 3.33, to: 5.47, checks: ["costume-in-prop", "hand-in-prop", "arm-in-prop"], reason: "inside the toilet room, behind its wall beside the doorway (the door shut, then swinging open): no camera sees him (his brim against the room's side wall)" },
    { who: "sam", with: "bar", from: 4.98, to: 5.22, checks: ["hand-in-prop", "hand-turn"], reason: "the pick-up: his fingertips slide under the card reader's ends on the bar top to lift it (five frames, the gloves bigger than the reader is tall); the left glove turns over as it closes on it" },
    { who: "gsl", from: 6.66, to: 6.74, checks: ["hand-turn"], reason: "the grab: his glove turns round the lemonade glass as it closes on it" },
    { who: "sam", from: 6.45, to: 7.15, checks: ["face-covered"], reason: "he comes to the table with the reader and sets it down on the table: from the camera above, his hands on it pass in front of his own lowered eyes (he isn't the one acting: the beat is Gunslinger's sip)" },
    { who: "sam", from: 4.98, to: 5.08, checks: ["hand-turn"], reason: "the pick-up: his left glove turns palm-in as it closes on the reader's end" },
    { who: "gsl", from: 2.8, to: 2.95, checks: ["rig-jump", "prop-pop", "motion"], reason: "the wallet snapped shut and shoved back in the holster in one whip (0.1 s): a smear under the motion blur, not a pop" },
    { who: "gsl", from: 3.0, to: 3.15, checks: ["rig-jump"], reason: "the dash to the toilet: quick little running steps (1.3 m in 0.22 s), the feet smeared by the motion blur" },
    { who: "moth", with: "loo", from: 3.45, to: 5.47, checks: ["limb-in-surface"], reason: "on his brim inside the shut toilet room: no camera sees it" },
    { who: "gsl", from: 3.45, to: 5.47, checks: ["front", "face-hidden", "hand-turn"], reason: "inside the shut toilet room: he is meant to be out of sight while the friends sneak off" },
    { who: "wiz", with: "wcoatW", from: 4.4, to: 10, reason: "his coat (worn)" },
    { who: "rea", with: "wcoatR", from: 4.1, to: 10, reason: "his coat (worn)" },
    { who: "sam", with: "towel", from: 0, to: 10, reason: "his bar towel over his shoulder (worn)" },
    { who: "gsl", with: "glass4", from: 6.55, to: 7.9, reason: "his lips on the glass: a sip" },
    { who: "wiz", from: 6.0, to: 6.2, checks: ["motion", "rig-jump"], reason: "off screen (the peek shot looks away from the front door): from the front door round onto the street" },
    { who: "rea", from: 6.0, to: 6.2, checks: ["motion", "rig-jump"], reason: "off screen (the peek shot looks away from the front door): from the front door round onto the street" },
    { who: "wiz", from: 5.25, to: 5.4, checks: ["motion", "rig-jump", "lean-jump"], reason: "on the cut to the peek: out of the front door, off screen right" },
    { who: "wiz", with: "rea", from: 5.25, to: 5.4, reason: "off screen on the cut to the peek: both slip out of the front door in the same frame" },
    { who: "rea", from: 5.25, to: 5.4, checks: ["motion", "rig-jump", "lean-jump"], reason: "on the cut to the peek: out of the front door, off screen right" },
  ],
  notes: "Generated by storyboards/series/never-has-money/03-his-round/make-his-round.mjs. Panels and departures: PANELS.md.",
});
