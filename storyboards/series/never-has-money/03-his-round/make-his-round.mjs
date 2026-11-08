// THAT ONE FRIEND WHO NEVER HAS MONEY… WHEN IT'S HIS ROUND (never has money, episode 3, 8 Nov 2026), from the clip template.
//   node storyboards/series/never-has-money/03-his-round/make-his-round.mjs -> his-round.json
// Brief: /mnt/project-files/video-scripts/2026-11-05-never-has-money/03-his-round-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels: storyboards/03-his-round/ there. The spec with every number, time
// and place: BOARD.md here; the panels as a table: PANELS.md.
//
// THE BRIEF (exactly 10.0 s; Gunslinger, Wizard, Reaper, the Samurai as the bartender)
//   Joke:        three empty glasses and it's Gunslinger's round. Pocket pat, the moth. "Bathroom!" He dashes into the
//                toilet; Wizard and Reaper nod, put their coats on and tiptoe out. He peeks out: empty stools, round
//                dodged! He sits down, pleased, and the Samurai pushes the card reader in front of him: 84.00.
//   Wants:       Gunslinger wants to dodge paying the round.
//   Consequence: his dodge leaves him alone with the whole night's bill (the friends wave from outside).
//   Ending:      the wink to the Samurai, "Next time's on me!"; the Samurai doesn't blink and taps the reader once.
//   Callback:    frame 0 the Wizard sets the third empty glass down and points at him; the last frame the Samurai's
//                finger on the reader, the friends laughing outside.
import { clip, write, r3, frame } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { PUB } from "../../../../engine/page/props-pub.js";
import { patProps, pocketPat, PAT } from "../pocket-pat.mjs";
import { wink } from "../wink.mjs";

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
// two 3-frame hit-stops (the toilet lamp snapping red at video 3.50, the reader stopping at video 7.50) add 0.2 s: 9.8 s
// of story = exactly 10.0 s of video (BOARD.md header)
const HS1 = 3.5, HS2 = 7.4, END = 9.8;
// a time on the video's clock -> the story's clock
const V = (tv) => r3(tv <= HS1 ? tv : tv <= HS2 + 0.2 ? tv - 0.1 : tv - 0.2);

// ---------------------------------------------------------------- the pub (world metres; x right, z toward the camera)
// The camera is on the bartender's side (+z) and looks toward -z. The bar counter runs along x; the three friends sit on
// stools on the far side (-z) facing us; the Samurai works on our side. The toilet partition is at the left behind them,
// the front door off frame right.
const SEAT = 0.5;                                // the stool seat's top, raised from 0.38 so a seated face clears the bar top (the stools carry h: SEAT; the sit action lands the body on it)
const OFF = r3(SEAT - 0.12);                     // how much higher a seated body is than a standing one (timeline.js sit)
const BAR_H = PUB.bar?.h ?? r3(SEAT + 0.28);     // the bar top: the seated potatoes' "table" hands rest on it
const BAR_D = PUB.bar?.d ?? 0.45;                // the counter's depth (z -0.225 .. +0.225)
const GX = -1.05, RX = 0.0, WX = 1.0, SZ = -0.72;  // the stools (BOARD §3 has z -0.5: the bodies are 0.7 deep, so they sit back to clear the bar)
const BODY_Z = r3(SZ + 0.03);                    // where a seated body's centre is (sit puts it 3 cm forward of the seat)
const SAM0 = [1.6, 0.74], SAM1 = [0.1, 0.74];      // the Samurai: polishing at the right end; at the reader (BOARD has x -0.25: 0.5 m of gap keeps two 0.8 m bodies clear in the two-shot)
const RS = 2.5;                                  // the reader's prop scale: 84.00 has to read in the 360 px frame
const R0 = [-0.02, 0.02], R1 = [-0.45, 0.02];   // where the reader lies on the bar, and where it stops
const CNT_Z = 5.3, CNT_H = 0.8;                   // the foreground back counter: top about a third up the wide frame
const CT = [["ctA", -0.32, 0], ["ctB", -0.23, 0], ["ctC", 0.25, 0], ["ctD", 0.33, 0]];   // all empty: the night's empties (review B 5)
// (was: two half full)   // its tumblers, off the centre where the subtitle sits (the wide sees only x -0.37..0.37 at the counter)
const SAM0_YAW = -60, SAM1_YAW = -70;
const DOOR = [-1.6, -1.35];                      // the toilet door in its partition (the partition runs x -2.4 .. -1.1)
const BEHIND = [-1.6, -1.8];                     // Gunslinger inside the toilet, behind the partition
const OUT_W = [0.55, -3.0], OUT_R = [1.35, -3.8]; // the friends outside under the street lamp, seen in the window
const EXIT_X = 1.95;                             // the front door, just off frame right

const cast = [
  { id: "gsl", character: "never-has-money/gunslinger", at: [GX, SZ], face: 0, expr: "eager", follow: 0.3, seed: 1.3 },
  { id: "rea", character: "never-has-money/reaper", at: [RX, SZ], face: 0, expr: "deadpan", follow: 0.25, seed: 3.3 },
  { id: "wiz", character: "never-has-money/wizard", at: [WX, SZ], face: 0, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "sam", character: "bistro/samurai-waiter", at: SAM0, face: SAM0_YAW, expr: "deadpan", follow: 0.2, seed: 2.2, sway: 0.4 },
  // the friends outside (the same two, new ids: hidden until 6.9, they stand under the street lamp seen through the window)
  { id: "wizO", character: "never-has-money/wizard", at: OUT_W, face: 0, expr: "happy", follow: 0.3, seed: 2.7 },
  { id: "reaO", character: "never-has-money/reaper", at: OUT_R, face: 0, expr: "happy", follow: 0.25, seed: 3.4 },
];

// ---------------------------------------------------------------- props
// The tumblers (r ~0.035, h ~0.09): the third empty one is the Wizard's, set down at frame 0. The grip library has no
// "tumbler" size, so a glass is held through a proxy of the same size (the bistro water glass, 0.038 x 0.10).
const TY = BAR_H;
// the Samurai's glass: in his hands from frame 0, at his chest (polishing)
const front = ([x, z], yaw, f, s, y) => { const a = (yaw * Math.PI) / 180; return [r3(x + f * Math.sin(a) + s * Math.cos(a)), y, r3(z + f * Math.cos(a) - s * Math.sin(a))]; };
const TS_AT = front(SAM0, SAM0_YAW, 0.4, -0.1, r3(BAR_H + 0.16));
const TUM = {
  G: { id: "tumG", kind: "tumbler", x: -1.4, y: TY, z: -0.15, fill: 0.22, lemon: true, staged: "Gunslinger's lemonade, 2 cm of amber and a lemon slice" },
  g: { id: "tumGe", kind: "tumbler", x: -1.05, y: TY, z: -0.1, fill: 0 },
  r: { id: "tumR", kind: "tumbler", x: 0.05, y: TY, z: -0.1, fill: 0 },
  w: { id: "tumW", kind: "tumbler", x: 0.95, y: TY, z: -0.1, fill: 0 },
  s: { id: "tumS", kind: "tumbler", x: TS_AT[0], y: TS_AT[1], z: TS_AT[2], fill: 0, staged: "the one the Samurai is polishing: in his hands until 5.2" },
};
const proxy = (t, scale = 0.92) => ({ id: t.id, kind: PUB.tumbler?.gripKind ?? "waterglass", x: t.x, y: t.y, z: t.z, rot: t.rot ?? 0, scale });
// the coats: over the stool backs from 0, then worn (a second prop on the body) from the moment the coat swings on
// a drape coat's origin is on the stool's back rail (props-pub.js PUB.stool.rail)
const COAT_Y = r3(SEAT + (PUB.stool?.rail?.y ?? 0.15)), COAT_Z = r3(SZ - (PUB.stool?.rail?.r ?? 0.33));
const COAT_R = "#4a4a52", COAT_W = "#a07850", SCARF = "#7d3fb8";
const coat = (id, color, extra = {}) => ({ id, kind: "pubcoat", color, ...extra });
const patSpec = patProps({ who: "gsl", at: [GX, BODY_Z], yaw: 0 });
const props = [
  { id: "bar", kind: "pubbar", x: 0, z: 0, w: 3.2, d: BAR_D, h: BAR_H },
  { id: "stG", kind: "pubstool", h: SEAT, x: GX, z: SZ, rot: 0 },
  { id: "stR", kind: "pubstool", h: SEAT, x: RX, z: SZ, rot: 0 },
  { id: "stW", kind: "pubstool", h: SEAT, x: WX, z: SZ, rot: 0 },
  coat("coatR", COAT_R, { x: RX, y: COAT_Y, z: COAT_Z, mode: "drape", staged: "over the stool back rail" }),
  coat("coatW", COAT_W, { x: WX, y: COAT_Y, z: COAT_Z, mode: "drape", scarf: SCARF, staged: "over the stool back rail" }),
  coat("coatRw", COAT_R, { wear: "rea", mode: "worn", scale: 0.001, staged: "on Reaper from 4.3" }),
  coat("coatWw", COAT_W, { wear: "wiz", mode: "worn", scarf: SCARF, scale: 0.001, staged: "on the Wizard from 4.4" }),
  coat("coatRo", COAT_R, { wear: "reaO", mode: "worn", scale: 0.001, staged: "on Reaper outside, from 6.9" }),
  coat("coatWo", COAT_W, { wear: "wizO", mode: "worn", scarf: SCARF, scale: 0.001, staged: "on the Wizard outside, from 6.9" }),
  ...Object.values(TUM),
  { id: "toilet", kind: "toiletdoor", x: DOOR[0], z: DOOR[1], rot: 0, open: 0, lamp: 1 },
  { id: "reader", kind: "pubreader", x: R0[0], y: BAR_H, z: R0[1], rot: -14, text: "84.00", scale: 0.001, staged: "lies on the bar at the Samurai's end from the two-shot at 6.0 (hidden before it: the wide shows no reader)" },
  // the back counter in the foreground (bartender's side): fills the bottom third of the wides, hidden in the other shots
  { id: "counter", kind: "pubbar", x: 0, z: CNT_Z, w: 3.6, d: BAR_D, h: CNT_H },
  ...CT.map(([id, x, fill]) => ({ id, kind: "tumbler", x, y: CNT_H, z: CNT_Z - 0.04, fill })),
  { id: "towel", kind: "bartowel", wear: "sam", staged: "the bar towel over the Samurai's left shoulder (worn)" },
  // the wallet waits in the holster (seated: the body frame is OFF higher than the pocket-pat block's standing frame)
  ...patSpec.map((p) => (p.id === "wallet" ? { ...p, y: r3(p.y + OFF), scale: 0.001, staged: "down in his holster until he draws it" } : p)),
];

// ---------------------------------------------------------------- helpers
const MOUTH_Y = r3(SEAT + 0.4);                  // the seated mouth, measured in the stills: 0.9 m
const SUB_LOW = 1250, SUB_HIGH = 520;
const look = (t, who, to, dur = 0.1) => A(t, who, "look", { to, dur, blink: false });

// ---------------------------------------------------------------- the first frame: three seated at the bar
// hands rest on the bar top: a little higher and further in than the "table" pose, whose palms sink into the bar's edge
const TABLE = (side) => ({ o: [-0.14, 0.29, 0.38] });
for (const [id, st] of [["gsl", "stG"], ["rea", "stR"], ["wiz", "stW"]]) {
  A(0, id, "sit", { seat: st, dur: 0.01, hands: "keep", height: SEAT, feet: [0.38, 0.1] });
  for (const sd of ["R", "L"]) { c.arm(0, id, sd, TABLE(sd), 0); A(0, id, "grip", { side: sd, shape: "relaxed", dur: 0 }); }
}
// the Samurai behind the bar, polishing a tumbler with both hands; the towel stays over his shoulder
const tsH = grips.mug(c, "sam", { ...proxy(TUM.s), rot: r3(SAM0_YAW + 180) }, { side: "R", height: 0.66 });
c.arm(0, "sam", "R", { prop: "tumS", grip: tsH.hands.R.grip, palm: "wrap" }, 0);
A(0, "sam", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "sam", "grab", { prop: "tumS", hand: "R", grip: tsH.hands.R.grip, dur: 0, pose: null });
// the left hand turns inside the rim: small circles, a polish every 0.45 s
for (let t = 0; t < 4.5; t += 0.45) {
  c.arm(r3(t), "sam", "L", { world: front(SAM0, SAM0_YAW, 0.36, 0.05, r3(BAR_H + 0.24)) }, 0.2, "inOut");
  c.arm(r3(t + 0.22), "sam", "L", { world: front(SAM0, SAM0_YAW, 0.4, 0.0, r3(BAR_H + 0.2)) }, 0.2, "inOut");
}
A(0, "sam", "grip", { side: "L", shape: "flat", dur: 0 });
c.arm(4.95, "sam", "L", "rest", 0.2, "inOut");
look(0, "sam", [-0.2, -0.55], 0);

// ---------------------------------------------------------------- 1 PAY UP 0-1.5 (panel 1, the wide)
// 0.00 the Wizard's hand sets the third empty tumbler down (tink) and he points at Gunslinger: "Your round!". Reaper
// turns his head to Gunslinger (0.3), the Samurai looks up (0.2); by 1.0 every head is on him and he freezes, eyes wide.
{
  const w = grips.mug(c, "wiz", proxy(TUM.w), { side: "R", height: 0.66 });
  c.arm(0, "wiz", "R", { prop: "tumW", grip: w.hands.R.grip, palm: "wrap" }, 0);
  A(0, "wiz", "grip", { side: "R", shape: "hold", dur: 0 });
  A(0, "wiz", "grab", { prop: "tumW", hand: "R", grip: w.hands.R.grip, dur: 0, pose: null });
  sfx(0, "tink", { gain: 0.5, reason: "the third empty tumbler set down on the bar at frame 0" });
  w.release(0.05, { rest: false });
  c.arm(0.05, "wiz", "R", { o: [0.12, 0.4, 0.7] }, 0.3, "inOut");   // a low, forward path: the palm stays on one side through the point
  c.arm(0.35, "wiz", "R", { o: [0.2, 0.85, 0.78] }, 0.2, "inOut");   // high: the glove reads on the green wall, not on the Reaper's robe (review B 6) A(0.2, "wiz", "grip", { side: "R", shape: "point", dur: 0.25 });
}
look(0, "wiz", [-0.6, 0.0], 0);
c.say(0.05, "wiz", "your round!", 0.85, "excited", { voice: false, sub: "Your round!", pos: SUB_LOW });
act.mood(c, 0.04, "wiz", "annoyed", { strength: 0.5, hold: 0.5 });
// Gunslinger is mid-chat, happy; he turns to the Wizard, understands, and freezes
A(0, "gsl", "expr", { expr: "happy", set: { curve: 0.5, open: 0.1 }, dur: 0 });
look(0, "gsl", [0.35, -0.3], 0);
look(0.3, "gsl", [0.55, 0.05], 0.1);
A(0.3, "gsl", "turn", { to: 18, dur: 0.25 });
act.shock(c, 0.75, "gsl", { hold: 0.9 });
A(0.3, "rea", "turn", { to: -22, dur: 0.3 }); look(0.28, "rea", [-0.6, 0.05], 0.12);
A(0.4, "wiz", "turn", { to: -16, dur: 0.3 });
look(0.2, "sam", [-0.4, 0.05], 0.12);
A(0.35, "sam", "expr", { expr: "deadpan", dur: 0.2 });
see(0, 1.45, ["gsl.face", "wiz.face", "rea.face", "sam.face", "tumW"], "panel 1: the Wizard sets the third glass down and points; every head turns to Gunslinger");

// ---------------------------------------------------------------- 2 THE POCKET PAT 1.5-2.8 (panel 2, the series block)
// Seated. The block's wallet spots are in the world at standing height, so its two `at` points (the draw and the hold)
// are lifted by OFF here, the wallet prop above is, and the pats themselves are in his body frame and need nothing.
c.at(2.28, { do: "prop", id: "wallet", set: { scale: 1 }, dur: 0.04, ease: "out", reason: "the top of the wallet shows in the holster as his hand gets there" });
{
  const n0 = c.items.length;
  pocketPat(c, { who: "gsl", at: [GX, BODY_Z], yaw: 0, friend: [0.75, 0.1], hold: [0.04, 0.53, 0.4] });
  for (const it of c.items.slice(n0)) if (it.sfx === "wings") it.dur = 0.4;   // the wings fade before "Bathroom!" (3.0), so the line stands clear
  for (const it of c.items.slice(n0)) if (it.do === "arm" && it.pose?.at && it.at >= PAT.draw - 0.05) it.pose.at = [it.pose.at[0], r3(it.pose.at[1] + OFF), it.pose.at[2]];
}
look(1.6, "wiz", [-0.7, 0.05], 0.1); look(1.7, "rea", [-0.6, 0.0], 0.1);
A(2.55, "rea", "face", { lid: 0.5, dur: 0.2 });   // the moth: a slow deadpan droop of the lids
c.arm(2.75, "wiz", "R", TABLE("R"), 0.25, "inOut"); A(2.75, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
see(PAT.open, PAT.land, ["gsl.face", "wallet", "moth"], "panel 2: the open empty wallet, the moth flutters out, Wizard's pointing glove at the edge");

// ---------------------------------------------------------------- 3 BATHROOM 2.8-3.5 (panel 3)
// the wallet back in the holster; a thumb over the shoulder; "Bathroom!"; off the stool and a hurried dash to the door
const HOL = { x: patSpec[0].x, y: r3(patSpec[0].y + OFF), z: patSpec[0].z, rot: patSpec[0].rot };
c.prop(2.8, "wallet", { open: 0 }, 0.06, "inOut");
c.arm(2.82, "gsl", "R", { prop: "wallet", grip: [-0.155, 0, 0], at: [HOL.x, HOL.y, HOL.z] }, 0.1, "inOut");
A(2.92, "gsl", "release", { prop: "wallet", to: [HOL.x, HOL.y, HOL.z], dur: 0.04 });
c.prop(2.95, "wallet", { tip: 360, rot: HOL.rot }, 0.04, "inOut");
c.at(3.0, { do: "prop", id: "wallet", set: { scale: 0.001 }, dur: 0.04, ease: "in", reason: "back down in his holster (part of his costume), so it walks with him" });
A(2.86, "gsl", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
c.arm(2.86, "gsl", "L", "rest", 0.2, "inOut");
// thumb over his shoulder toward the toilet (screen left = his right)
c.arm(2.94, "gsl", "R", { o: [0.28, 0.78, -0.02] }, 0.12, "out"); A(2.96, "gsl", "grip", { side: "R", shape: "thumb", dur: 0.08 });
look(2.84, "gsl", [-0.7, 0.1], 0.1); A(2.84, "gsl", "turn", { to: -50, dur: 0.15 });
A(2.88, "gsl", "expr", { expr: "eager", set: { open: 0.3, curve: 0.5, eye: 1.05 }, dur: 0.1 });
c.say(3.0, "gsl", "bathroom!", 0.4, "excited", { voice: false, sub: "Bathroom!", pos: SUB_LOW });
// off the stool at 2.95, the dash to the door 3.05-3.38; the door swings open as he reaches it
A(2.95, "gsl", "stand", { dur: 0.2 });
A(2.97, "gsl", "turn", { to: -128, dur: 0.12 });
A(3.04, "gsl", "move", { to: [-1.3, -0.85], dur: 0.12, steps: 2, ease: "linear" });
A(3.16, "gsl", "move", { to: [-1.55, -1.15], dur: 0.12, steps: 2, ease: "linear" });
A(3.28, "gsl", "move", { to: BEHIND, dur: 0.16, steps: 3, ease: "linear" });
c.prop(3.0, "toilet", { open: 70 }, 0.25, "out");
sfx(3.14, "door-open", { gain: 0.25, reason: "the toilet door swung open as he reaches it" });
c.prop(3.38, "toilet", { open: 0 }, 0.08, "in");
sfx(3.44, "door-close", { gain: 0.5, reason: "the toilet door swinging shut behind him" });
c.prop(3.46, "toilet", { lamp: 0 }, 0.04, "linear");
// he is behind the partition, whose top is lower than his hat: hidden, the moth (worn, so it would hang in the air) with him
A(3.42, "gsl", "hide");
c.at(3.42, { do: "prop", id: "moth", set: { scale: 0.001 }, dur: 0.01, ease: "linear", reason: "the moth rides on his hat brim, so it goes into the toilet with him" });
sfx(HS1, "latch-click", { gain: 0.5, reason: "the lock snapping to occupied (the lamp goes red) on the hit-stop frame" });
c.hitStop(HS1);
c.arm(3.42, "gsl", "R", "rest", 0.05, "out"); A(3.42, "gsl", "grip", { side: "R", shape: "relaxed", dur: 0.05 });   // the thumb comes down while he is out of sight
look(3.1, "wiz", [-0.8, 0.0], 0.1); look(3.1, "rea", [-0.8, 0.0], 0.1);
see(2.95, 3.4, ["gsl", "moth", "toilet"], "panel 3: Gunslinger dashing into the toilet, the moth on his brim, the lamp above the door");

// ---------------------------------------------------------------- 4 THE NOD 3.5-3.8 (panel 4, first half)
const T4 = V(3.52);
A(T4, "wiz", "turn", { to: -14, dur: 0.2 }); look(T4, "wiz", [-0.7, 0.05], 0.08);
A(T4, "rea", "turn", { to: 14, dur: 0.2 }); look(T4, "rea", [0.7, 0.05], 0.08);
A(V(3.56), "wiz", "expr", { expr: "smug", dur: 0.12 }); A(V(3.56), "rea", "expr", { expr: "smug", dur: 0.12 });
for (const who of ["wiz", "rea"]) A(V(3.62), who, "squash", { amount: 0.07, dur: 0.2 });
see(V(3.5), V(3.8), ["wiz.face", "rea.face"], "panel 4: the two exchange one slow nod");

// ---------------------------------------------------------------- 5 TIPTOE 3.8-5.2 (panel 4)
// both stand (3.8) and take their coats off the stool backs (cloth 4.0 and 4.2); they swing them on and tiptoe out
// along the back (z <= -0.8, never in front of Gunslinger's stool) to the front door off frame right; the bell at 5.1
const RZ = -1.7, WZ = -0.8;   // the walking lanes: Reaper deeper (he passes well behind the Wizard), the Wizard just behind the stool line
// they stand in place (arms down), reach behind them for the coat on the rail, swing it on and walk off right
for (const [w, x] of [["wiz", WX + 0.15], ["rea", RX - 0.1]]) { A(V(3.8), w, "stand", { dur: 0.22 }); A(V(3.8), w, "move", { to: [x, -0.82], dur: 0.25, steps: 1 }); A(V(3.66), w, "turn", { to: 0, dur: 0.1 }); c.arm(V(3.8), w, "R", "rest", 0.2, "inOut"); c.arm(V(3.8), w, "L", "rest", 0.2, "inOut"); }
const BEHIND_HAND = { o: [0.12, 0.72, -0.5] };
c.arm(V(3.95), "rea", "R", BEHIND_HAND, 0.12, "out"); A(V(3.95), "rea", "grip", { side: "R", shape: "hold", dur: 0.08 });
c.arm(V(3.9), "wiz", "L", BEHIND_HAND, 0.12, "out"); A(V(3.9), "wiz", "grip", { side: "L", shape: "hold", dur: 0.08 });
sfx(V(3.95), "cloth", { gain: 0.8, reason: "Reaper takes his coat off the stool back" });
sfx(V(4.1), "cloth", { gain: 1.2, reason: "Wizard swings his coat on" });
c.prop(V(4.05), "coatR", { y: r3(COAT_Y + 0.45) }, 0.12, "out");
c.prop(V(4.0), "coatW", { y: r3(COAT_Y + 0.45) }, 0.12, "out");
for (const [d, w, tv] of [["coatR", "coatRw", 4.2], ["coatW", "coatWw", 4.15]]) {
  c.at(V(tv), { do: "prop", id: d, set: { scale: 0.001 }, dur: 0.02, ease: "linear", reason: "the draped coat leaves the stool: it is on his shoulders now" });
  c.at(V(tv), { do: "prop", id: w, set: { scale: 1 }, dur: 0.02, ease: "linear", reason: "the worn coat appears as the draped one lifts off" });
}
c.arm(V(4.21), "rea", "R", "rest", 0.2, "inOut"); c.arm(V(4.16), "wiz", "L", "rest", 0.2, "inOut");
// the tiptoe (about 1.4-1.6 m/s): Reaper first, deeper; the Wizard behind the stool line, a finger to his lips
look(V(4.05), "rea", [-0.75, 0.1], 0.15); look(V(3.98), "wiz", [-0.75, 0.1], 0.15);   // a look back over the shoulder at the toilet door, faces to us
A(V(3.95), "rea", "turn", { to: 40, dur: 0.25 }); A(V(3.98), "wiz", "turn", { to: 40, dur: 0.25 });
// two legs: straight back into the deep lane first (a diagonal would bring him up beside the Wizard), then right,
// off frame before he hides at 5.15 (review B 1)
A(V(3.95), "rea", "move", { to: [0.35, -1.85], dur: 0.4, steps: 2, stride: 0.7 });
A(V(4.35), "rea", "move", { to: [2.6, -1.85], dur: 0.8, steps: 4, stride: 0.7 });
A(V(3.98), "wiz", "move", { to: [EXIT_X, WZ], dur: 0.9, steps: 5, stride: 0.7 });
c.arm(V(4.22), "wiz", "R", { o: [-0.3, 0.72, 0.36] }, 0.3, "inOut"); A(V(4.3), "wiz", "grip", { side: "R", shape: "point", dur: 0.12 });   // a finger to his lips, eased in
for (const tv of [4.5, 4.68, 4.86]) sfx(V(tv), "step-wood", { gain: 0.1, reason: "a soft tiptoe" });
sfx(V(5.15), "ding", { gain: 0.25, reason: "the front door's bell as they slip out (soft, off screen right)" });
A(V(4.95), "wiz", "hide"); A(V(5.15), "rea", "hide");
c.at(V(5.15), { do: "prop", id: "coatRw", set: { scale: 0.001 }, dur: 0.01, ease: "linear", reason: "the worn coat leaves with Reaper out of the door" });
c.at(V(4.95), { do: "prop", id: "coatWw", set: { scale: 0.001 }, dur: 0.01, ease: "linear", reason: "the worn coat leaves with the Wizard out of the door" });
// the Samurai, deadpan: his eyes follow them out
look(V(4.2), "sam", [0.2, 0.0], 0.15); look(V(4.7), "sam", [0.8, 0.05], 0.2); look(V(5.2), "sam", [0.0, 0.0], 0.2);
see(V(3.9), V(5.05), ["wiz", "rea", "sam.face"], "panel 4: the two in their coats tiptoe past the bar, the Samurai deadpan behind it");

// ---------------------------------------------------------------- 6 THE PEEK 5.2-7.0 (panels 5 and 6)
// 5.25 the lamp goes green, the door opens a crack; 5.45-5.9 his head peeks round it; 5.75 the grin; 5.95-6.4 the
// stroll back; 6.4-6.65 he climbs on his stool, a happy sigh; 6.75-7.0 the lemonade, eyes shut.
c.prop(V(5.2), "toilet", { lamp: 1 }, 0.04, "linear");
c.prop(V(5.25), "toilet", { open: 25 }, 0.2, "out");
sfx(V(5.25), "door-open", { gain: 0.35, reason: "the toilet door opening a crack" });
A(V(5.0), "gsl", "turn", { to: 0, dur: 0.05 });   // turned round while he is out of sight
A(V(5.3), "gsl", "show");
c.at(V(5.3), { do: "prop", id: "moth", set: { scale: 1 }, dur: 0.01, ease: "linear", reason: "the moth is back on his brim as he shows himself" });
A(V(5.45), "gsl", "move", { to: [-1.6, -1.45], dur: 0.2, steps: 2 });
look(V(5.5), "gsl", [-0.5, 0.0], 0.1); look(V(5.62), "gsl", [0.6, 0.0], 0.1); look(V(5.72), "gsl", [0.2, -0.1], 0.08);
A(V(5.45), "gsl", "expr", { expr: "eager", set: { eye: 1.1, open: 0 }, dur: 0.1 });
act.grin(c, V(5.75), "gsl", { back: 0.5, lid: 0.2 });
A(V(5.75), "gsl", "expr", { expr: "happy", set: { curve: 0.9, open: 0.5 }, dur: 0.15 });
c.arm(V(5.45), "gsl", "L", { o: [0.18, 0.55, 0.18] }, 0.2, "out");   // a hand on the door's edge
// the stroll to behind-left of his stool, and the climb
A(V(5.8), "gsl", "move", { to: [-1.55, -0.9], dur: 0.3, steps: 2, ease: "inOut" }); A(V(5.8), "gsl", "turn", { to: 80, dur: 0.3 });
c.arm(V(5.85), "gsl", "L", "rest", 0.2, "inOut");
A(V(6.0), "gsl", "move", { to: [-0.8, -0.95], dur: 0.2, steps: 3, ease: "inOut" });   // sooner, so the cut at 6.0 has him walking in (review B 2)
A(V(6.2), "gsl", "sit", { seat: "stG", dur: 0.25, hands: "keep", height: SEAT, feet: [0.38, 0.1] });
c.arm(V(6.25), "gsl", "L", TABLE("L"), 0.25, "inOut");
sfx(V(6.22), "sit", { gain: 0.4, reason: "he climbs back on his stool" });
sfx(V(6.3), "ai-package/flat-exhale", { gain: 0.25, reason: "a happy sigh as he sits" });
A(V(6.25), "gsl", "expr", { expr: "happy", set: { curve: 0.7, open: 0.1 }, dur: 0.2 }); look(V(6.25), "gsl", [0.0, -0.1], 0.1);
c.prop(V(6.1), "toilet", { open: 0 }, 0.2, "inOut");
// the Samurai sets the polished tumbler down and walks to the reader's end of the bar (5.3 - 6.4)
tsH.place(V(5.05), [1.45, BAR_H, 0.06], 0.45); tsH.release(V(5.6), { rest: "rest", back: 0.2 });
A(V(5.75), "sam", "move", { to: SAM1, dur: 0.7, steps: 3, ease: "inOut" }); A(V(5.75), "sam", "turn", { to: SAM1_YAW, dur: 0.5 });   // sooner (review B 2)
look(V(5.8), "sam", [-0.45, 0.05], 0.2);
// the Reaper's empty glass is off the bar in the two-shot: the reader lies (and slides) where it stood (cut, unseen)
c.at(V(5.95), { do: "prop", id: "tumR", set: { scale: 0.001 }, dur: 0.01, ease: "linear", reason: "cleared off the bar before the two-shot (cut at 6.0): the reader lies and slides where it stood" });
// Gunslinger takes the lemonade and sips, eyes shut
const GL = grips.mug(c, "gsl", proxy(TUM.G), { side: "R", height: 0.66, angle: 105 });
{
  const mouth = [r3(GX - 0.02), r3(MOUTH_Y - 0.08), r3(BODY_Z + 0.42)];   // the cup's base: 10 cm under the mouth, in front of the face
  let t = GL.secure(GL.approach(V(6.42), 0.15), 0.1);
  t = GL.carry(r3(t), [TUM.G.x, r3(TY + 0.1), r3(TUM.G.z + 0.2)], 0.1, "out");
  t = GL.carry(r3(t + 0.02), mouth, 0.16, "inOut", { tip: -35 });
  A(V(6.7), "gsl", "face", { lid: 1, dur: 0.1 });
  sfx(V(6.92), "ai/sip", { gain: 0.4, reason: "his sip of the lemonade, eyes shut" });
  A(V(6.92), "gsl", "squash", { amount: 0.02, dur: 0.2 });
}
see(V(5.45), V(5.95), ["gsl.face", "toilet"], "panel 5: Gunslinger peeks out of the door, the lamp green (the empty stools are in the wide before it)");
see(V(6.75), V(7.0), ["gsl.face", "tumG", "sam.face"], "panel 6: eyes shut, a sip of lemonade, the Samurai at the right");

// ---------------------------------------------------------------- 7 THE BILL LANDS 7.0-8.8 (panels 6-8, the close two-shot)
// 7.00 the Samurai sets the card reader on the bar beside him; 7.1-7.5 one flat finger push, it slides on the wood and
// stops in front of Gunslinger (ui-confirm, the music cuts, hit-stop); 7.55 his eyes snap open, the shock, the sweat
{
  const hand = (t, x, y, z, dur = 0.1, ease = "inOut") => c.arm(V(t), "sam", "R", { world: [r3(x), r3(y), r3(z)] }, dur, ease);
  c.at(V(5.95), { do: "prop", id: "reader", set: { scale: RS }, dur: 0.01, ease: "linear", reason: "it has been on the bar at his end all along: it only shows from the cut to the two-shot at 6.0" });
  hand(6.85, R0[0] + 0.17, BAR_H + 0.22, R0[1] + 0.22, 0.08, "out"); A(V(6.85), "sam", "grip", { side: "R", shape: "pinch", dur: 0.05 });
  hand(6.9, R0[0] + 0.18, BAR_H + 0.12, R0[1] + 0.12, 0.1, "in");
  A(V(7.0), "sam", "grip", { side: "R", shape: "point", set: { thumb: 0.2 }, dur: 0.08 });
  hand(7.02, R0[0] + 0.2, BAR_H + 0.09, R0[1] + 0.02, 0.08, "out");
  // the push: his fingertip on its right edge, 0.2 m with it, then it coasts to a stop
  hand(7.1, R0[0] + 0.15, BAR_H + 0.09, R0[1], 0.04, "out");
  c.arm(V(7.14), "sam", "R", { world: [r3(R1[0] + 0.3), r3(BAR_H + 0.09), r3(R1[1])] }, 0.14, "out");
  c.prop(V(7.1), "reader", { x: R1[0], z: R1[1] }, 0.4, "out");
  sfx(V(7.1), "scrape", { gain: 0.5, dur: 0.4, reason: "the card reader slides along the wooden bar top (a long scrape)" });
  hand(7.35, R1[0] + 0.25, BAR_H + 0.1, R1[1] + 0.05, 0.2, "inOut");
  A(V(7.4), "sam", "grip", { side: "R", shape: "relaxed", dur: 0.15 });
}
sfx(HS2, "ui-confirm", { gain: 0.9, reason: "the reader's beep as it stops in front of Gunslinger (the music cuts)" });
c.hitStop(HS2);
look(V(7.0), "sam", [-0.5, -0.15], 0.1);
A(V(7.0), "sam", "expr", { expr: "deadpan", dur: 0.1 });
// Gunslinger: eyes snap open, the glass comes down, a shocked face, a sweat drop; he reads the screen, then looks up
{
  const t = V(7.55);
  A(t, "gsl", "face", { lid: 0, dur: 0.05 });
  GL.place(V(7.58), [TUM.G.x, TY, TUM.G.z], 0.25); GL.release(V(7.85), { rest: "rest", back: 0.15 });
  act.shock(c, t, "gsl", { hold: 1.0 });
  c.at(V(7.62), { fx: "sweat", who: "gsl", dur: 0.8, count: 4 });
  look(V(7.7), "gsl", [-0.15, -0.65], 0.12);
  look(V(8.3), "gsl", [0.45, 0.1], 0.15);
}
// outside in the window: the friends, under the street lamp, wave with little fingers and laugh (7.6-8.8)
for (const w of ["wizO", "reaO"]) A(0, w, "hide");
A(V(6.9), "wizO", "show"); A(V(6.9), "reaO", "show");
for (const id of ["coatRo", "coatWo"]) c.at(V(6.9), { do: "prop", id, set: { scale: 1 }, dur: 0.01, ease: "linear", reason: "the friends are outside in their coats" });
A(V(7.5), "wizO", "expr", { expr: "happy", set: { curve: 0.9, open: 0.6 }, dur: 0.15 }); A(V(7.5), "reaO", "expr", { expr: "happy", set: { curve: 0.8, open: 0.4 }, dur: 0.15 });
look(V(7.0), "wizO", [-0.2, -0.1], 0.1); look(V(7.0), "reaO", [-0.2, -0.1], 0.1);
for (let t = 7.6, k = 0; t < 9.6; t += 0.22, k++) { c.arm(V(t), "wizO", "R", { o: [0.55 + 0.1 * (k % 2), 0.95, 0.1] }, 0.2, "inOut"); c.arm(V(t + 0.1), "reaO", "L", { o: [0.55 + 0.1 * (k % 2), 0.95, 0.1] }, 0.2, "inOut"); }
for (let t = 7.7; t < 9.6; t += 0.34) { A(V(t), "wizO", "squash", { amount: 0.03, dur: 0.12 }); A(V(t + 0.12), "reaO", "squash", { amount: 0.03, dur: 0.12 }); }
see(V(7.6), V(8.8), ["wizO", "reaO"], "panel 7: the friends wave and laugh in the window behind");
see(V(7.55), V(8.7), ["gsl.face", "reader"], "panel 7: Gunslinger shocked, the reader stopped in front of him, 84.00");

// ---------------------------------------------------------------- 8 THE WINK 8.8-10.0 (panel 8, the series block)
const WK = V(8.8);
wink(c, {
  who: "gsl", t: WK, until: END, pos: SUB_HIGH, side: "L", brimTouch: { o: [0.3, 0.93, 0.08] }, look: [0.5, 0.05],
  react() {
    // the Samurai doesn't blink; he taps the reader once with one finger (9.4) and stares on; the Wizard snickers
    // into his scarf outside
    const tap = V(9.4);
    c.arm(r3(tap - 0.2), "sam", "R", { world: [r3(R1[0] + 0.28), r3(BAR_H + 0.22), r3(R1[1] + 0.12)] }, 0.15, "inOut"); A(r3(tap - 0.2), "sam", "grip", { side: "R", shape: "point", set: { thumb: 0.2 }, dur: 0.08 });
    c.arm(tap, "sam", "R", { world: [r3(R1[0] + 0.05), r3(BAR_H + 0.1), r3(R1[1] + 0.12)] }, 0.05, "in");
    sfx(r3(tap + 0.02), "knock-tap", { gain: 0.3, reason: "the Samurai's finger taps the reader once" });
    c.arm(r3(tap + 0.07), "sam", "R", { world: [r3(R1[0] + 0.1), r3(BAR_H + 0.15), r3(R1[1] + 0.12)] }, 0.1, "out");
    look(WK, "sam", [-0.55, -0.2], 0.1);
    A(r3(WK + 0.2), "wizO", "squash", { amount: 0.05, dur: 0.12 });
    
    for (const dt of [0.4, 0.62, 0.84]) A(r3(WK + dt), "wizO", "squash", { amount: 0.06, dur: 0.12 });
  },
});
see(r3(WK + 0.2), r3(WK + 0.75), ["gsl.face", "moth", "sam.face"], "panel 8: the wink and the hat tip, the moth lifting off the brim, the Samurai deadpan");
see(V(9.4), END, ["sam.face", "reader"], "panel 8: the last frame: the Samurai's finger on the reader");

// blinks off the lines and the key looks (the Samurai doesn't blink after 3 s)
act.blinksAt(c, "wiz", [1.4, 3.3]); act.blinksAt(c, "rea", [1.3, 3.1]); act.blinksAt(c, "gsl", [0.6, 1.9, V(5.3)]);
act.blinksAt(c, "sam", []);   // never blinks (brief; review B 4) act.blinksAt(c, "wizO", [V(7.8)]); act.blinksAt(c, "reaO", [V(8.0)]);

// ---------------------------------------------------------------- shots (Jonny's panels)
const fw = (target, { w, ...o }) => frame(target, { ...o, h: r3((w * 16) / 9) });
// the wide (panels 1, 3-5): from the bartender's side, a little above bar height, the toilet at the left, the window
// at the right; top 20 % clear of heads in 0-2 s (the title)
const WIDE = { pos: [0.0, 1.4, 6.8], look: [0.0, -0.08, -0.72], fov: 48 };
// the toilet door, medium-wide, 2.8 to the hit-stop: the thumb, the dash, the door shut, the lamp red on 3.5
const DOORSHOT = { pos: [-3.5, 1.7, 2.4], look: [-1.4, 0.9, -1.0], fov: 40 };
// the pocket pat (panel 2): Gunslinger chest up with the whole hat, the Wizard's pointing glove at the right edge
const PATSHOT = fw([-0.6, 1.15, -0.7], { w: 1.9, az: -10, el: 3, fov: 30 });
// the close two-shot (panels 6-8): Gunslinger left, the Samurai right, the window between them behind
const CLOSE = fw([-0.4, 1.1, 0.0], { w: 2.4, az: -14, el: 8, fov: 30 });
// the push-in on the reader, 7.0-7.5 (video), ending on the hit-stop: fov 30 -> 24, look toward the reader
const PUSH = { ...CLOSE, to: { look: [-0.5, 1.05, -0.05], fov: 22 }, dur: r3(V(7.5) - V(7.0)), ease: "inOut" };
// the counter shows in the wides only (0-1.5 and 3.5-5.45): it is out of the way of every other camera
for (const [t, k] of [[PAT.from, 0.001], [3.51, 1], [V(5.2), 0.001]]) for (const id of ["counter", ...CT.map((q) => q[0])]) c.at(t, { do: "prop", id, set: { scale: k }, dur: 0.01, ease: "linear", reason: k === 1 ? "the back counter is in the wide again" : "the back counter is out of this shot (cut)" });
const beats = c.beats([
  ["P1 pay up", 0, WIDE, "hook"],
  ["P2 the pocket pat", PAT.from, { ...PATSHOT, to: { look: [-0.66, 1.1, -0.7], fov: 25 }, dur: r3(2.8 - PAT.from), ease: "inOut" }],   // push in on the wallet and the moth (review B 3)
  ["P3 the door", 2.8, DOORSHOT],
  ["P4 the exit", 3.51, WIDE],
  ["P5 the peek", V(5.2), DOORSHOT],   // on the lamp going green (review B 1: brief panel 5 from 5.2)
  ["P6 the sip", V(6.0), CLOSE],
  ["P7-8 the bill and the wink", V(7.0), PUSH, "payoff"],
], END);
// "Bathroom!" is up 3.0-3.6 (video), "Next time's on me!" 9.0-10.0
for (const cp of c.captions) { if (/Bathroom/.test(cp.text)) cp.to = V(3.6); if (/Next time/.test(cp.text)) cp.to = END; }

write(import.meta.url, {
  id: "his-round",
  title: "That one friend who never has money… when it's his round",
  idea: "Never has money, episode 3: three empty glasses and it's Gunslinger's round; the pocket pat finds a moth; \"Bathroom!\"; the friends put their coats on and tiptoe out; he comes back pleased and the Samurai pushes the card reader in front of him: 84.00; the wink: next time's on me.",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: true,
  cover: 2.6,
  set: { type: "plain", color: "#2f4a36", floor: "#5a3520", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    // the painted pub (T2): the far wall with its window panes cut to alpha, the night street behind it
    plate: { src: "assets/plates/pub-night.png", z: -2.4, center: [0, 1.8], height: 3.6, depth: false, motion: false, dust: 0, alphaTest: 0.5 },
    plates: [{ src: "assets/plates/pub-street-night.png", z: -4.2, center: [0.9, 2.25], height: 4.5 }],
    lighting: 2, hatch: { boil: 0.25 } },
  // a light Irish-pub reel in D major at 116 bpm (the nearest procedural style: march, with the whistle lead): the full
  // bed to 3.8, the lead alone on the music box while the friends tiptoe, full again when he sits (5.9), silence at the
  // reader's stop (7.5), one last flourish on the wink (8.95), then room tone to the cut (BOARD §2)
  music: { style: "march", key: 2, bpm: 116, lead: "whistle", lowCut: 150, gain: 0.3, duck: { voice: 10 },
    parts: [{ at: 0, part: "main" }, { at: 2.95, part: "musicbox" }, { at: 5.9, part: "main" }, { at: 7.5, part: "stop" }, { at: 8.95, part: "main" }, { at: 9.6, part: "hush" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", scenes: ["ui"], guard: true, signature: { entrances: false } },
  creative: { length: [10, 10] },
  hook: { show: ["gsl", "wiz", "rea", "sam", "tumW"], hint: 0.4, what: "the Wizard sets the third empty glass down and points: it's Gunslinger's round" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  // windows on the video clock (no gate 2 yet): after the hit-stops at 3.5 and 7.5 the times are 0.1 and 0.2 s later than the story's
  allowClip: [
    { who: "wiz", from: 0.05, to: 0.7, checks: ["hand-turn", "hand-pop"], reason: "the Wizard's hand opens out of the glass grip into the point: the glove turns over once at the very start (frame 0.5, the hook's first beat)" },
    { who: "sam", from: 5.0, to: 6.1, checks: ["hand-turn", "hand-pop"], reason: "the Samurai's glass hand lets the tumbler go and drops to rest: the glove turns over once, in the background of the wide" },
    { who: "rea", from: 3.9, to: 4.1, checks: ["motion"], reason: "he stands up off the stool: the squash settles as he straightens" },
    { who: "sam", with: "rea", from: 4.7, to: 5.2, checks: ["face-covered"], reason: "Reaper slips out past the Samurai at the right edge: the Samurai's glass hand is in front of him for a moment (a cut-off tiptoe, off screen right)" },
    { who: "sam", with: "wiz", from: 3.9, to: 4.35, checks: ["face-covered", "face-hidden"], reason: "the Wizard stands at the right edge behind the Samurai: his coat swing is the beat, his face is not" },
    { who: "wiz", with: "rea", from: 3.9, to: 4.15, reason: "the Wizard's glove brushes Reaper's sleeve as he turns to go" },
    { who: "gsl", from: 2.95, to: 3.4, checks: ["motion"], reason: "he hops off the stool and dashes: the body pitches and leans into the run" },
    { who: "gsl", from: 5.8, to: 6.6, checks: ["motion", "lean-jump"], reason: "he steps up to the stool and climbs on: the body tips forward for the sit" },
    { who: "gsl", with: "stG", from: 2.9, to: 3.4, reason: "he hops off his stool and dashes away from it" },
    { who: "rea", with: "coatR", from: 3.9, to: 4.4, reason: "he takes his coat off the stool back and swings it on" },
    { who: "wiz", with: "coatW", from: 3.9, to: 4.4, checks: ["arm-in-prop", "clipping", "costume-in-prop"], reason: "he takes his coat off the stool back and swings it on" },
    { who: "rea", with: "bar", from: 3.7, to: 4.0, checks: ["arm-in-prop", "costume-in-prop"], reason: "he stands up against the bar's edge" },
    { who: "wiz", with: "bar", from: 4.0, to: 4.4, checks: ["hand-in-prop"], reason: "he turns away from the bar, his hand sweeping past its edge" },
    { who: "wiz", with: "stW", from: 3.8, to: 4.6, reason: "he stands up beside his own stool and walks off it" },
    { who: "rea", with: "stR", from: 3.8, to: 4.7, reason: "he stands up beside his own stool and walks off it" },
    { who: "rea", with: "stW", from: 4.1, to: 5.0, reason: "Reaper slips behind the Wizard's stool in a tight sneak" },
    { who: "rea", with: "coatWw", from: 4.1, to: 5.2, reason: "he passes behind the Wizard's worn coat" },
    { who: "wiz", with: "coatRw", from: 4.3, to: 5.2, reason: "Reaper passes behind the Wizard's coat" },
    { who: "gsl", with: "stG", from: 5.4, to: 6.9, reason: "he climbs back on his stool: the sit pulls him in from behind it" },
    { who: "gsl", with: "bar", from: 6.5, to: 8.9, checks: ["hand-in-prop", "arm-in-prop"], reason: "his hands rest on the bar top and wrap the tumbler" },
    { who: "reaO", with: "coatWo", from: 6.9, to: 10, reason: "the Wizard's coat and scarf tails brush Reaper where they stand shoulder to shoulder outside" },
    { who: "sam", with: "bar", from: 0, to: 10, checks: ["hand-in-prop", "arm-in-prop"], reason: "he works behind the bar: his hands and forearms rest on and over its top" },
    { who: "moth", with: "toilet", from: 5.8, to: 6.1, reason: "the moth rides his hat out through the narrow door" },
    { who: "gsl", with: "toilet", from: 5.8, to: 6.0, checks: ["limb-in-surface"], reason: "the moth rides his hat out through the narrow door" },
    { who: "wiz", with: "bar", from: 0, to: 0.5, checks: ["hand-in-prop"], reason: "he sets the glass down on the bar" },
    { who: "gsl", with: "moth", from: 2.5, to: 10, reason: "the moth flies round him and sits on his hat brim (worn)" },
    { who: "gsl", with: "wallet", from: 2.25, to: 3.05, reason: "he draws the wallet from his holster and slips it back" },
    { who: "gsl", from: 2.27, to: 2.33, checks: ["motion"], reason: "the quick-draw (series block): his hand snaps onto the wallet in the holster" },
    { who: "gsl", from: 2.38, to: 2.52, checks: ["prop-pop"], reason: "the revolver spin: the wallet turns once round his fingers on purpose, then flips open" },
    { who: "gsl", from: 1.5, to: 1.78, checks: ["rig-jump", "motion"], reason: "the series' frantic pocket pat: his left mitten slaps from the hat brim to his chest in 0.15 s" },
    { who: "gsl", with: "toilet", from: 3.0, to: 3.5, reason: "he squeezes through the narrow toilet door (potato scale)" },
    { who: "gsl", with: "toilet", from: 5.3, to: 6.3, reason: "he peeks round the toilet door and squeezes out past it" },
    { who: "gsl", with: "tumG", from: 6.6, to: 8.0, reason: "his hand round the lemonade, his lips on its rim: a sip" },
    { who: "wiz", with: "tumW", from: 0, to: 0.3, reason: "his hand round the tumbler he is setting down at frame 0" },
    { who: "sam", with: "tumS", from: 0, to: 5.7, reason: "his hands round the tumbler he is polishing" },
    { who: "sam", with: "reader", from: 6.8, to: 10, reason: "his finger on the card reader as he pushes it, and taps it" },
    { who: "wiz", with: "coatWw", from: 4.2, to: 5.2, reason: "his coat (worn)" },
    { who: "rea", with: "coatRw", from: 4.1, to: 5.2, reason: "his coat (worn)" },
    { who: "wizO", with: "coatWo", from: 6.9, to: 10, reason: "his coat (worn)" },
    { who: "reaO", with: "coatRo", from: 6.9, to: 10, reason: "his coat (worn)" },
    { who: "sam", with: "towel", from: 0, to: 10, reason: "the bar towel over his shoulder (worn)" },
  ],
  notes: "Generated by storyboards/series/never-has-money/03-his-round/make-his-round.mjs. Spec: BOARD.md; panels: PANELS.md.",
});
