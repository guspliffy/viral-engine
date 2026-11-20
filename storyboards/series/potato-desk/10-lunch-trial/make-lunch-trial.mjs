// POTATO DESK 10 "Who ate my lunch?!" (Jonny 20 Nov 2026: idea 08:35, hook 08:41 = the victim's shout at 0.0 with the
// office kitchen clear at once, ending 1 = the boss did it 08:42, "create the panels in codex and go" 08:45 Berlin).
// Story + panels: STORY.md here, /mnt/project-files/videos/potato-desk/10-lunch-trial/sheets/lunch-trial-sheet-1.png.
// Design (sets, props, marks, cameras): DESIGN.md here (Fable 5.2). Build notes: NOTES.md.
//   node storyboards/series/potato-desk/10-lunch-trial/make-lunch-trial.mjs -> lunch-trial.json
//
// Chain: his labelled lunch is gone, so he shouts; so the boss wants the thief before the meeting and names the
// punishment (clean the fridge); so the gossip points at the one who was at the fridge; so he defends himself and
// makes it worse; so the victim's email pings every phone, the boss's too; so the boss, out of time, sends him to
// the fridge; so the boss closes the case and sips, and the sip shows the sauce on his collar; so he backs out; so the
// victim eats the boss's own lunch.
// Opener A (the trial is running at frame 0). Natural counter: the wall clock 8:55 -> 8:59 (on the 17.6 s cut).
// Jonny 20 Nov 09:44 (his read of the hell video's retention): no locked still shots (every shot drifts or pushes, a new
// framing on every line), no silent holds (next line 0.1-0.2 s after the last, cut 0.1-0.2 s after an action). STORY.md.
// Departures from DESIGN.md: the fridge stays open (no shut/reopen: fewer hand moves); the victim keeps the box in his
// hands (no floor rest, no phone of his own: the pings are the others'); the gossip holds his phone (his trait), not a
// coffee; Spud's spoon cut (clip-lessons: fewer hand props); panel 03 is an outside close on the fridge's inside, not a
// camera in the fridge; the tag eats from the box ON the fridge floor with a fork (one hand prop).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { LINES } from "./lines.mjs";

const c = clip({ faces: "strong", lines: { sub: false, blink: false } }), { A, sfx, cap, see } = c;
const F = (t) => r3(Math.round(t * 30) / 30);

// measured spoken lengths (desk10-voice-probe, 20 Nov 2026), in LINES order
const DUR = [1.21, 2.69, 1.78, 1.52, 2.91, 1.62, 1.73, 1.35, 1.51, 0.51, 1.40, 1.53];
const GAP = [0.05, 0.12, 0.12, 0.15, 0.12, 0.12, 0.12, 0.15, 0.15, 0.1, 0.15, 0.15];
const T = []; { let t = 0; LINES.forEach((_, i) => { t = r3(t + GAP[i]); T.push(t); t = r3(t + DUR[i]); }); }
const END_OF = (i) => r3(T[i] + DUR[i]);
const shift = (from, by) => { for (let k = from; k < T.length; k++) T[k] = r3(T[k] + by); };

// ---------------------------------------------------------------- places (DESIGN §7; x right, z toward us)
const CHIP0 = [0.15, 2.4], SPUD0 = [-0.48, 0.28], MASH0 = [0.02, -0.45], WEDGE0 = [0.92, 0.05];
const Y_CHIP = 0, Y_SPUD = 15, Y_MASH = 0, Y_WEDGE = -15;
const SPUD_FRIDGE = [-1.30, 0.07];   // panel 10: his back to us in the fridge's mouth
const CHIP_FRIDGE = [-0.40, 0.25], SPUDG_TAG = [-1.05, -0.20], Y_TAG = 10;   // the tag: at the fridge's opening edge, eating; Spud beside
const WEDGE_OUT = [2.4, 0.0];
const AWAY = -60;

const cast = [
  { id: "chip", character: "potatobrawl/chip", at: CHIP0, face: Y_CHIP, expr: "angry", follow: 0.4, seed: 2.3 },
  { id: "spud", character: "potatobrawl/spud", at: SPUD0, face: Y_SPUD, expr: "kind", follow: 0.3, seed: 1.1 },
  { id: "mash", character: "potatobrawl/mash", at: MASH0, face: Y_MASH, expr: "smug", follow: 0.3, seed: 4.1 },
  { id: "wedge", character: "potatobrawl/wedge", at: WEDGE0, face: Y_WEDGE, expr: "stern", follow: 0.3, seed: 3.1 },
  { id: "spudg", character: "potatobrawl/spud-gloves", at: [-3.5, 3.0], face: 180, expr: "sad", follow: 0.3, seed: 1.1, hidden: true },
];

// ---------------------------------------------------------------- set (DESIGN §2-4)
const FRIDGE = { id: "fridge", kind: "ioufridge", x: -1.30, y: 0, z: -0.975, w: 1.0, h: 1.75, color: "#f2f3ef", handle: [0.42, 0.82],
  split: 1.22, freezerHandle: [1.30, 1.52], radius: 0.04, badge: false, inside: "empty", notesStyle: "scribble", notes: 34, open: 0.86 };
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.4, h: 2.6, dado: "#b7c4b8", wall: "#b7c4b8", top: "#b7c4b8", rail: "#aebbaf" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 4.6, w: 5.0, d: 12.0 },   // to the wides' bottom edge (Sol 1 #25)
  { id: "ceiling", staged: "the office's suspended ceiling", kind: "ceilingtiles", x: 0, y: 2.6, z: 1.5, w: 4.4, d: 5.6 },
  { id: "counter", kind: "kitchencounter", x: 0.51, y: 0, z: -1.025, w: 2.58, d: 0.55, h: 0.86, dressing: false,
    colors: { top: "#a4a9ab", carcass: "#6c747b", door: "#78818a", pull: "#c9ced2", plinth: "#4a5056" } },
  { id: "sink", kind: "kitchensink", x: -0.41, y: 0.86, z: -1.02 },
  { id: "micro", kind: "microwave", x: 0.24, y: 0.86, z: -1.07 },
  { id: "coffee", kind: "beanmachine", x: 0.79, y: 0.86, z: -1.05 },
  { id: "cork", staged: "screwed to the back wall", kind: "corkboard", x: -0.40, y: 1.62, z: -1.285 },
  { id: "win1", staged: "set in the back wall", kind: "blindwindow", x: 1.55, y: 1.625, z: -1.30, w: 0.5, h: 1.05 },
  { id: "clock", staged: "hangs on the back wall", kind: "wallclock", x: 0.95, y: 1.96, z: -1.28, r: 0.28, time: "8:55", hands: "bold", dial: "#f7f5ee" },
  { id: "door", kind: "frontdoor", x: 1.80, y: 0, z: -0.55, rot: 90, hinge: "right", angle: 90, w: 0.85, h: 1.95, color: "#9a6a3e",
    flush: true, lever: true, knobY: 0.70, closer: true, kick: 0.20, open: 0 },
  FRIDGE,
  { id: "m1", staged: "on a fridge shelf", kind: "mouldbox", type: "m1", x: -1.55, y: 0.50, z: -1.05 },
  { id: "m2", staged: "on a fridge shelf", kind: "mouldbox", type: "m2", x: -1.02, y: 0.50, z: -1.05 },
  { id: "m5", staged: "on a fridge shelf", kind: "yogurtcup", old: 1, x: -1.28, y: 0.50, z: -1.02 },
  { id: "m3", staged: "on a fridge shelf", kind: "mouldbox", type: "m3", x: -1.58, y: 0.86, z: -1.06 },
  { id: "m6", staged: "on a fridge shelf", kind: "mouldbox", type: "m6", x: -1.08, y: 0.86, z: -1.06 },
  { id: "m4", staged: "on a fridge shelf", kind: "mouldbox", type: "m4", x: -1.56, y: 0.18, z: -1.05 },
  { id: "bossbox", kind: "lunchbox", label: "boss", fill: "pasta", lid: 1, x: -1.07, y: 0.18, z: -1.06, staged: "on the fridge's bottom shelf" },
  ...[[-1.55, 1.05, -0.82], [-1.02, 1.08, -0.82], [-1.20, 1.10, -0.84], [-1.30, 0.20, -0.75]].map(([x, y, z], k) =>
    ({ id: `haze${k}`, staged: "a smell in the air", kind: "gas", x, y, z, color: "#b7d36a", n: 3, len: 0.35, w: 0.04, seed: 3 + k, puff: 0.6, fade: 0.45 })),
  // worn
  ...["chip", "spud", "mash", "wedge", "spudg"].map((w) => ({ id: `lan-${w}`, kind: "lanyard", wear: w, x: 0, y: w === "spudg" ? AWAY : 0, z: 0, ...((w === "spud" || w === "spudg") && { fit: { cloth: 0.06 } }), ...(w === "wedge" && { fit: { cloth: 0.05 } }) })),   // cards off the knit / jacket (Sol 1 #20)
  { id: "stain", kind: "collarstain", wear: "wedge", x: 0, y: 0, z: 0, at: [0.09, 0.0], lift: 0.05, cloth: 0.06 },
  { id: "pglow", kind: "pocketglow", wear: "wedge", x: 0, y: 0, z: 0, glow: 0 },
];

// hand props: the victim's box overhead, the suspect's yogurt, the gossip's phone, the boss's mug, the tag's fork
const at3 = (a) => ({ x: r3(a[0]), y: r3(a[1]), z: r3(a[2]) });
const fwd = (p, yaw, d, side = 0) => { const a = (yaw * Math.PI) / 180; return [r3(p[0] + Math.sin(a) * d + Math.cos(a) * side), r3(p[1] - 0 + Math.cos(a) * d - Math.sin(a) * side)]; };
const BOX_HOOK = [CHIP0[0], 0.18, CHIP0[1] + 0.40];   // lower and his short arms lose the box (grip gap)   // held out at us (overhead crossed his arms over his face in the stills)
const BOX_CHEST = [CHIP0[0], 0.17, CHIP0[1] + 0.36];   // he is 0.53 tall: higher, the box hides his eyes
const PARKED = "held on screen the whole time; parked off set from the cut that leaves it";
const BOX = { id: "minebox", staged: PARKED, kind: "lunchbox", label: "mine", fill: "empty", lid: 1, ...at3(BOX_HOOK), rot: 0 };
const YOG_AT = (() => { const p = fwd(SPUD0, Y_SPUD, 0.40, -0.22); return [p[0], 0.30, p[1]]; })();   // on his right side (side +0.20 put the right arm across his mouth)
const YOG = { id: "yog", staged: PARKED, kind: "yogurtcup", ...grips.placeFor("yogurtcup", YOG_AT, Y_SPUD) };
const PHONE_AT = (() => { const p = fwd(MASH0, Y_MASH, 0.36, 0.14); return [p[0], 0.52, p[1]]; })();
const PHONE_LOW = [PHONE_AT[0], r3(PHONE_AT[1] - 0.1), PHONE_AT[2]];   // lowered when he looks up (Sol 2 #24)
const PHONE = { id: "mphone", kind: "phone", scale: 1.5, case: "#8fb1c5", halo: 0.22, glow: 0, ...grips.placeFor("phone", PHONE_AT, 180 + Y_MASH), tip: -35 };
const MUG_AT = (() => { const p = fwd(WEDGE0, Y_WEDGE, 0.47, 0.07); return [p[0], 0.38, p[1]]; })();
const MUG = { id: "mug", staged: PARKED, kind: "teamug", scale: 2.0, color: "#f6f4ee", steam: 0, ...grips.placeFor("teamug", MUG_AT, Y_WEDGE) };
props.push(BOX, YOG, PHONE, MUG);

// ---------------------------------------------------------------- helpers
const SUB = 250;   // captions in the upper third, rows ~210-410 (DESIGN §1: plain wall and ceiling join)
const CAPTEXT = { 0: "Who ate my *lunch?!*", 2: "Thief cleans the *fridge.*", 7: "I emailed *everyone.*", 11: "...Let's take this *offline.*" };
const say = (i, extra = {}, capTo = null) => {
  const [who, line, tone, style, o = {}] = LINES[i];
  c.macro(T[i], who === "spudg" ? "spudg" : who, "say", { line, tone, style, ...(who === "spud" && { voice: "spud" }), ...o, dur: DUR[i], caption: false, ...extra });
  const to = r3(Math.min(END_OF(i) + 0.25, T[i + 1] ?? END_OF(i) + 1.0));
  cap(T[i], capTo ?? to, CAPTEXT[i] ?? line, SUB, false, { size: 64 });
};
const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => A(r3(t), who, "arm", { side, pose, dur, ease });
const grip = (t, who, side, shape, dur = 0.2) => A(r3(t), who, "grip", { side, shape, dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const turn = (t, who, to, dur = 0.3) => A(r3(t), who, "turn", { to, dur });
const expr = (t, who, e, dur = 0.2) => A(r3(t), who, "expr", { expr: e, dur });
const place = (t, who, to, yaw) => {
  A(r3(t - 0.029), who, "hide"); A(r3(t - 0.02), who, "show");
  A(r3(t - 0.02), who, "move", { to, dur: 0.01, ease: "linear", sync: true, y: 0 });
  A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true });
};
const hideProp = (t, id) => c.prop(r3(t), id, { y: AWAY }, 0);

const gBox = grips.box(c, "chip", BOX, { height: 0.8 });
const gYog = grips.mug(c, "spud", YOG, { side: "R" });
const gPhone = grips.phone(c, "mash", PHONE, { side: "R" });
const gMug = grips.mug(c, "wedge", MUG, { side: "R" });

// looks [x, y] (screen right, up)
const AT_CHIP = [0.2, -0.3], AT_SPUD_FROM_MASH = [-0.6, -0.1], AT_CLOCK = [0.1, 0.9];

// ---------------------------------------------------------------- frame 0: everyone round the open fridge, the box overhead
for (const [w, y] of [["chip", Y_CHIP], ["spud", Y_SPUD], ["mash", Y_MASH], ["wedge", Y_WEDGE]]) turn(0, w, y, 0.01);
// on the grips from frame 0, fingers closed (take() opened the gloves for 4 frames, Sol 1 #11, #22)
gBox.secure(0, 0.001); for (const sd of ["R", "L"]) A(0, "chip", "grip", { side: sd, shape: "press", dur: 0 });
gYog.secure(0, 0.001); A(0, "spud", "grip", { side: "R", shape: "hold", dur: 0 });
c.arm(0, "mash", "R", { prop: "mphone", grip: gPhone.hands.R.grip, palm: true }, 0); A(0, "mash", "grip", { side: "R", shape: "hold", dur: 0 });   // held from frame 0, as read-minds (take() turned the palm on 0.03)
A(0, "mash", "grab", { prop: "mphone", hand: "R", grip: gPhone.hands.R.grip, dur: 0, pose: null });
gMug.take(0, { reach: 0.003, settle: 0.003 });
look(0, "spud", [0.4, -0.2], 0.01); look(0, "mash", [0.1, -0.5], 0.01); look(0, "wedge", [-0.5, -0.3], 0.01);   // the gossip reads his phone until his line (Sol 1 #24)
look(0, "chip", [0, 0.1], 0.01);
act.blinksAt(c, "spud", [2.4, 6.9, 15.8]); act.blinksAt(c, "mash", [3.3, 12.2, 18.9]);
act.blinksAt(c, "wedge", [5.6, 13.1]); act.blinksAt(c, "chip", [9.6, 18.2]);
see(0, END_OF(0), ["chip.face", "minebox", "fridge", "spud.face", "mash.face", "wedge.face"], "office kitchen, open fridge: the little one holds up an empty labelled box and shouts");

// 1 CHIP: Who ate my lunch?!  (box shaken once overhead)
say(0);
gBox.carry(r3(END_OF(0) + 0.05), BOX_CHEST, 0.45, "inOut");
expr(0.1, "spud", "sad"); expr(0.2, "mash", "smug");   // quiet while the victim shouts (Sol 1 #12)
// 2 WEDGE (points at the clock): Meeting in five. Find the thief.
const S2 = T[1];
look(S2 - 0.1, "chip", [0.6, 0.05]); look(S2 - 0.1, "spud", [0.6, 0]); look(S2 - 0.1, "mash", [0.6, -0.1]);
arm(S2 + 0.1, "wedge", "L", { o: [0.2, 0.95, 0.1] }, 0.4, "out"); grip(S2 + 0.2, "wedge", "L", "point");
look(S2 + 0.1, "wedge", AT_CLOCK, 0.25);
say(1);
look(S2 + 1.3, "wedge", [-0.5, -0.4], 0.25); arm(S2 + 1.3, "wedge", "L", "rest", 0.5); grip(S2 + 1.4, "wedge", "L", "relaxed");
// 3 WEDGE: Thief cleans the fridge.  (insert: the fridge's inside, haze puffs; back on the wide they recoil)
say(2);
const INS = r3(T[2] + 0.35), INS_END = r3(END_OF(2) + 0.1);
for (let k = 0; k < 4; k++) { c.prop(INS - 0.3, `haze${k}`, { puff: 0.1, fade: 0.3 }, 0.01); c.prop(INS, `haze${k}`, { puff: 0.9, fade: 0.2 }, 0.6, "out"); }
sfx(INS, "bubbling", { gain: 0.25 });
expr(INS_END - 0.05, "chip", "annoyed");
for (const w of ["spud"]) { expr(INS_END - 0.05, w, "annoyed"); A(INS_END, w, "lean", { to: -10, dur: 0.25, ease: "out" }); A(r3(INS_END + 0.7), w, "lean", { to: 0, dur: 0.5 }); }
see(INS, INS_END, ["fridge"], "the fridge's mouldy inside: the punishment");
// 4 MASH (looks up from his phone, sly): I'm not one to gossip...
look(T[3] + 0.05, "mash", [-0.2, 0.5], 0.15); expr(T[3] - 0.15, "mash", "smug"); gPhone.carry(r3(T[3] - 0.05), PHONE_LOW, 0.3);   // eyes up from the phone on the line (Sol 1 #24)
for (const w of ["chip", "spud", "wedge"]) look(T[3] + 0.1, w, w === "chip" ? [0.1, 0.05] : w === "spud" ? [0.5, 0.1] : [-0.5, 0.1]);
say(3);
// 5 MASH points at Spud: But he was at the fridge at eleven.
look(T[4] + 0.3, "mash", AT_SPUD_FROM_MASH);
arm(T[4] + 0.3, "mash", "L", { o: [0.0, 0.3, 0.58] }, 0.3, "out"); grip(T[4] + 0.35, "mash", "L", "point"); arm(END_OF(4) + 0.1, "mash", "L", "rest", 0.4); grip(END_OF(4) + 0.15, "mash", "L", "relaxed");   // the free hand points at Spud, the phone stays low (Sol 2 #7: the phone jab covered his face and flipped his palm)   // the phone hand jabs at Spud (Sol 1 #7)
look(T[4] + 0.6, "chip", [-0.4, 0.5]); look(T[4] + 0.6, "wedge", [-0.7, -0.1]);
expr(T[4] + 0.9, "spud", "sad"); look(T[4] + 0.5, "spud", [0.5, 0.1]);   // the terrified mouth held one shape with stray corners (Sol 1 #13)
say(4);
// 6 SPUD: I didn't see the label!  (palms up: the yogurt hand too)
arm(T[5] - 0.15, "spud", "L", { o: [0.34, 0.24, 0.22] }, 0.3, "out"); grip(T[5] - 0.1, "spud", "L", "open");   // below the mouth (0.42 crossed his face)
gYog.carry(T[5] - 0.15, [YOG_AT[0] - 0.04, YOG_AT[1] + 0.04, YOG_AT[2]], 0.3);
turn(T[5] - 0.2, "spud", 25, 0.3); look(T[5] - 0.1, "spud", [0.4, -0.2]);
say(5, {}, r3(END_OF(5) + 0.03));
// the box turns: the label faces him (and us) on every side
const TURNBOX = r3(END_OF(5) + 0.05);
 look(TURNBOX - 0.1, "chip", [-0.6, 0.05]); expr(TURNBOX, "chip", "deadpan");
const BOX_THRUST = (() => { const p = fwd(CHIP0, 0, 0.42); return [p[0], 0.18, p[1]]; })();   // straight out: a body turn with the box flipped his palms on the wider close (Sol 2 #6)
// no thrust: the box stays at his chest, label to the lens (the thrust ran it into the lens and flipped his palm, Sol 2 #6)
sfx(TURNBOX + 0.05, "click", { gain: 0.2 });
shift(6, r3(TURNBOX + 0.75 - T[6]));
// 7 SPUD (nervous grin, arms wide): I thought it was for everyone!
expr(T[6] - 0.1, "spud", "happy"); look(T[6] - 0.1, "spud", [-1.0, -0.8]); look(r3(T[6] + 1.1), "spud", [0.4, -0.2]);   // a held look at his own yogurt (Sol 2 #10)   // a glance at his own yogurt (Sol 1 #10)
arm(T[6] - 0.1, "spud", "L", { o: [0.42, 0.30, 0.15] }, 0.3, "out");
gYog.carry(T[6] - 0.1, [YOG_AT[0] - 0.08, YOG_AT[1] + 0.06, YOG_AT[2] - 0.02], 0.3);
say(6);
expr(END_OF(6) - 0.2, "chip", "angry");
// 8 CHIP: I emailed everyone.  then the pings: the gossip's phone lights, the boss's pocket glows and he flattens it
arm(T[7] - 0.1, "spud", "L", "rest", 0.4); gYog.carry(T[7] - 0.1, YOG_AT, 0.4); expr(T[7], "spud", "sad");
look(T[7] - 0.1, "chip", [-0.5, 0.15]);   // still turned to him, the box held out at him
say(7);
const PING = r3(END_OF(7) + 0.1);
for (const [k, dt] of [[0, 0], [1, 0.15], [2, 0.3], [3, 0.45]]) sfx(r3(PING + dt), "notify", { gain: 0.5 - k * 0.05 });
c.prop(PING, "mphone", { glow: 1 }, 0.08); c.prop(r3(PING + 0.9), "mphone", { glow: 0 }, 0.2);
look(PING + 0.05, "mash", [0, -0.5]);
c.prop(r3(PING + 0.15), "pglow", { glow: 1 }, 0.06); c.prop(r3(PING + 0.4), "pglow", { glow: 0.3 }, 0.1); c.prop(r3(PING + 0.55), "pglow", { glow: 1 }, 0.06);
arm(PING + 0.4, "wedge", "L", { o: [0.18, 0.28, 0.18] }, 0.25); grip(PING + 0.5, "wedge", "L", "flat"); arm(PING + 0.65, "wedge", "L", { o: [0.18, 0.34, 0.24] }, 0.1); arm(PING + 0.75, "wedge", "L", { o: [0.18, 0.28, 0.18] }, 0.1);   // two pats (Sol 2 #9)
c.prop(r3(PING + 0.8), "pglow", { glow: 0 }, 0.05);
look(PING + 0.2, "chip", [0.6, 0.0]); look(PING + 0.3, "spud", [0.6, 0.0]);
expr(PING + 0.3, "wedge", "deadpan");
see(PING, r3(PING + 1.0), ["mphone", "wedge.face"], "everyone's phone pings; the boss pats his pocket quiet");
shift(8, r3(PING + 1.05 - T[8]));
// 9 CUT: clock 8:59. WEDGE points at Spud, then the fridge: Out of time. Fridge.   SPUD: But...
const CLK = T[8];
c.prop(r3(CLK - 0.02), "clock", { time: "8:59" }, 0);
arm(CLK - 0.02, "wedge", "L", { o: [0.3, 0.55, 0.3] }, 0.01); grip(CLK - 0.02, "wedge", "L", "point", 0.01);
look(CLK, "wedge", [-0.7, -0.1]); expr(CLK, "wedge", "stern");
say(8);
arm(T[8] + 0.85, "wedge", "L", { o: [-0.1, 0.55, 0.35] }, 0.3); arm(T[8] + 1.5, "wedge", "L", "rest", 0.45); grip(T[8] + 1.55, "wedge", "L", "relaxed");
say(9);
expr(T[9], "spud", "sad");
// 10 CUT: Spud in yellow gloves, head in the fridge (swap to spudg)
const SCRUB = F(END_OF(9) + 0.15), SCRUB_END = F(SCRUB + 0.95);
A(r3(SCRUB - 0.025), "spud", "release", { prop: "yog", dur: 0, to: [-0.64, 0.86, -0.92] }); A(r3(SCRUB - 0.02), "spud", "hide");   // the yogurt waits on the counter (Sol 1 #23)
place(SCRUB, "spudg", SPUD_FRIDGE, 180); hideProp(SCRUB - 0.03, "lan-spud"); c.prop(r3(SCRUB - 0.02), "lan-spudg", { y: 0 }, 0);
A(r3(SCRUB - 0.02), "spudg", "lean", { to: 12, dur: 0.01 }); for (let k = 0; k < 3; k++) { A(r3(SCRUB + 0.1 + k * 0.28), "spudg", "lean", { to: 16, dur: 0.14 }); A(r3(SCRUB + 0.24 + k * 0.28), "spudg", "lean", { to: 12, dur: 0.14 }); }   // no pop at the cut (Sol 1 #5)
arm(SCRUB - 0.02, "spudg", "R", { o: [0.10, 0.45, 0.50] }, 0.01); arm(SCRUB - 0.02, "spudg", "L", { o: [0.10, 0.45, 0.50] }, 0.01);
const WIPE_HI = { o: [0.22, 0.65, 0.48] }, WIPE_LO = { o: [0.22, 0.25, 0.50] };   // into the fridge, up and down   // up-down wipes, the hands opposite: reads as scrubbing (Sol 2 #5)
for (let k = 0; k < 3; k++) { arm(SCRUB + 0.1 + k * 0.28, "spudg", "R", WIPE_HI, 0.14); arm(SCRUB + 0.1 + k * 0.28, "spudg", "L", WIPE_LO, 0.14); arm(SCRUB + 0.24 + k * 0.28, "spudg", "R", WIPE_LO, 0.14); arm(SCRUB + 0.24 + k * 0.28, "spudg", "L", WIPE_HI, 0.14); }   // both gloves sweep the walls, out where we see them
sfx(SCRUB + 0.1, "cloth", { gain: 0.6 });
see(SCRUB, SCRUB_END, ["spudg", "fridge"], "he cleans the mouldy fridge in rubber gloves");
// Chip and Mash watch, arms crossed (their marks stay; the wide A2 shows them)
shift(10, r3(SCRUB_END + 0.1 - T[10]));
// 11 back: WEDGE: Case closed.  then the sip: the mug RISES to his mouth and the collar shows the sauce
A(r3(T[10] - 0.03), "spudg", "lean", { to: 0, dur: 0.01 });
place(T[10], "spudg", [-0.95, 0.15], 25);   // he has turned out of the fridge's mouth, gloves on, beside it
arm(T[10] - 0.02, "spudg", "both", "rest", 0.01);
look(T[10], "wedge", [0, 0]); expr(T[10], "wedge", "smug");
say(10);
const SIP = r3(END_OF(10) + 0.05);
const MUG_UP = (() => { const p = fwd(WEDGE0, Y_WEDGE, 0.45, -0.05); return [p[0], 0.42, p[1]]; })();   // up to his mouth from his right side: the collar V comes clear   // to the lips, off the collar (Sol 1 #4)
gMug.carry(SIP, MUG_UP, 0.4, "out");
A(SIP, "wedge", "face", { lid: 0.8, dur: 0.2 });
sfx(SIP + 0.4, "ai/sip", { gain: 0.5 });
const STARE = r3(SIP + 0.45), REVEAL = r3(SIP - 0.03);   // the close starts as the mug lifts (Sol 1 #3)
for (const w of ["chip", "mash", "spudg"]) { expr(STARE, w, "shocked"); }
look(STARE, "chip", [0.9, 0.85]);
look(STARE, "mash", [0.9, 0.2]); gPhone.carry(r3(STARE - 0.1), [PHONE_LOW[0], r3(PHONE_LOW[1] - 0.06), PHONE_LOW[2]], 0.3);   // phone down, eyes on the boss (Sol 2 #8) look(STARE, "spudg", [0.8, -0.1]);
see(STARE, r3(STARE + 0.9), ["wedge", "stain", "chip.face"], "the boss's collar: tomato sauce; everyone stares");
shift(11, r3(STARE + 0.95 - T[11]));
// 12 WEDGE lowers the mug, eyes dart: ...Let's take this offline.  then he walks out right, the door swings
gMug.carry(T[11] - 0.2, MUG_AT, 0.3);
look(T[11] - 0.2, "chip", [0.9, 0.85], 0.15); expr(T[11] - 0.3, "spudg", "shocked");   // his box, then the boss: he gets it (Sol 1 #8, #10)
A(T[11] - 0.2, "wedge", "face", { lid: 0, dur: 0.15 }); expr(T[11] - 0.2, "wedge", "sad");   // caught; "terrified" held one mouth shape through the line (Sol 3 new 1) look(T[11] - 0.1, "wedge", [-0.6, 0]);
const EXIT = r3(T[11] + 0.9), TAG = F(EXIT + 0.55);
say(11, {}, r3(TAG - 0.02));
turn(EXIT, "wedge", 35, 0.3); A(EXIT, "wedge", "lean", { to: -6, dur: 0.3 });
sfx(r3(EXIT + 0.45), "creak", { gain: 0.3 });
for (const w of ["chip", "mash", "spudg"]) look(EXIT + 0.3, w, [0.8, w === "chip" ? 0.85 : 0.1]);
// 13 TAG (cut): the victim, facing us beside the open fridge, holds the boss's labelled box open and chews, staring at
// the door; Spud (gloves) nods behind him. No fork: one held prop, the BOSS label to camera (payoff face: 3/4 or closer)
A(r3(TAG - 0.02), "wedge", "release", { prop: "mug", dur: 0, to: [0, AWAY, 0] }); A(r3(TAG - 0.02), "wedge", "hide"); for (const id of ["stain", "lan-wedge", "pglow"]) hideProp(TAG - 0.02, id);
sfx(r3(TAG + 0.05), "slam", { gain: 0.35 });
A(r3(TAG - 0.02), "chip", "release", { prop: "minebox", dur: 0, to: [0, AWAY, 0] });
place(TAG, "chip", CHIP_FRIDGE, Y_TAG);
place(TAG, "spudg", SPUDG_TAG, -15);
const BOSS_HELD = (() => { const p = fwd(CHIP_FRIDGE, Y_TAG, 0.36); return [p[0], 0.18, p[1]]; })();
const BOSS = { id: "bossbox", kind: "lunchbox", label: "boss", fill: "pasta", lid: 0, ...at3(BOSS_HELD), rot: Y_TAG };
c.prop(r3(TAG - 0.015), "bossbox", { lid: 0, ...at3(BOSS_HELD), rot: Y_TAG }, 0);
const gBoss = grips.box(c, "chip", BOSS, { height: 0.8, gap: 0.02 });
gBoss.secure(r3(TAG - 0.015), 0.001); for (const sd of ["R", "L"]) A(r3(TAG - 0.015), "chip", "grip", { side: sd, shape: "press", dur: 0 });
expr(TAG, "chip", "annoyed"); look(TAG, "chip", [0.8, 0.1]);
const BITE = r3(TAG + 0.25);
look(r3(BITE - 0.1), "chip", [0, -0.2], 0.2); A(r3(BITE + 0.1), "chip", "squash", { amount: -0.08, dur: 0.1 }); A(r3(BITE + 0.25), "chip", "squash", { amount: 0, dur: 0.12 });
look(r3(BITE - 0.05), "chip", [0, -0.45], 0.12);   // face down into the box for the bite (Sol 2 #2; lifting the box flipped both palms)
expr(r3(BITE + 0.02), "chip", "delighted", 0.08); A(r3(BITE + 0.05), "chip", "talk", { dur: 0.25, amp: 1.6, gain: 0 });   // mouth only: a talk without gain 0 speaks gibberish (Jonny 20 Nov 13:33) expr(r3(BITE + 0.32), "chip", "smug", 0.1);   // the bite: a wide mouth ("face" has no open key: the mouth never moved, Sol 2 #2)
A(r3(BITE + 0.4), "chip", "talk", { dur: 1.0, amp: 1.0, gain: 0 });   // chewing
look(r3(BITE + 0.3), "chip", [0.8, 0.15], 0.15);   // chewing, staring at where the boss went
for (let k = 0; k < 5; k++) { A(r3(BITE + 0.35 + k * 0.2), "chip", "squash", { amount: -0.06, dur: 0.08 }); A(r3(BITE + 0.45 + k * 0.2), "chip", "squash", { amount: 0, dur: 0.08 }); }
sfx(r3(BITE + 0.2), "ai/crunch", { gain: 0.25 }); sfx(r3(BITE + 1.2), "gulp", { gain: 0.5 });
A(r3(TAG + 0.5), "spudg", "pitch", { to: 12, dur: 0.18 }); A(r3(TAG + 0.7), "spudg", "pitch", { to: 0, dur: 0.25 }); expr(TAG, "spudg", "smug");
const END = F(BITE + 1.75);
see(TAG, END, ["chip.face", "bossbox", "spudg.face"], "the little one eats the boss's labelled lunch; Spud nods");

// ---------------------------------------------------------------- cameras: every shot moves (Jonny 20 Nov 09:44)
const WIDE = { pos: [-0.18, 1.6, 8.6], look: [-0.18, 0.82, 0], fov: 34 };   // lower than DESIGN (2.05): from 2.05 the downstage hood hid his eyes
const push = (s, k = 0.06, dur = 2) => ({ ...s, to: { pos: s.pos.map((v, i) => r3(v + (s.look[i] - v) * k)), look: s.look, fov: s.fov }, dur, ease: "inOut" });
const drift = (s, dx = 0.12, dur = 2) => ({ ...s, to: { pos: [r3(s.pos[0] + dx), s.pos[1], s.pos[2]], look: [r3(s.look[0] + dx * 0.5), s.look[1], s.look[2]], fov: s.fov }, dur, ease: "inOut" });
const MED_WEDGE = { pos: [1.75, 1.35, 3.6], look: [0.85, 1.28, -0.5], fov: 38 };   // the clock below the caption (Sol 2 #19)   // his point and face in, mouth above the mug (Sol 1 #18)
const FRIDGE_IN = { pos: [-1.12, 0.63, 0.6], look: [-1.12, 0.31, -0.95], fov: 34 };   // the stepped shadow under the top shelf out of frame (Sol 2 N3)   // BOSS readable (Sol 1 #17)
const MED_MASH = { pos: [0.6, 1.6, 3.6], look: [0.0, 1.0, -0.3], fov: 34 };   // in front of the victim (from behind him his eyes were hidden)
const TWO_MASH_SPUD = { pos: [-0.9, 1.3, 3.2], look: [-0.25, 0.7, -0.1], fov: 42 };   // from the left: no victim head in front (Sol 1 #7)
const MED_SPUD = { pos: [-0.55, 1.0, 3.3], look: [-0.42, 0.6, 0.35], fov: 44 };   // palm in, the victim's hood out of the corner (Sol 3 #14, new 4)   // open palm and cup both in (Sol 2 #14)   // palm and cup in (Sol 1 #14)
const SPUD_BUT = { pos: [-0.2, 1.0, 2.9], look: [-0.45, 0.7, 0.28], fov: 34 };
const CHIP_MED = { pos: [0.1, 1.5, 6.4], look: [0.0, 0.7, 1.2], fov: 30 };
const BOX_CLOSE = { pos: [-0.75, 0.85, 4.15], look: [0.12, 0.28, 2.8], fov: 34 };   // the whole box and label in, from above (Sol 2 #6, #16)   // 3/4 from the suspect's side: the label goes into his eyeline (Sol 1 #6)
const TWO_SPUD_CHIP = { pos: [-0.5, 1.15, 3.0], look: [-0.48, 0.75, 0.28], fov: 32 };
const WIDE_B = { pos: [1.9, 2.1, 6.4], look: [-0.2, 0.75, 0], fov: 38 };   // higher: the victim's sprout off Spud's face (Sol 2 N2)
const PINGS = { pos: [1.35, 0.9, 2.9], look: [0.75, 0.5, 0], fov: 48 };   // from his left: the pocket and the patting hand (Sol 3 #9)   // the pocket inside the frame (Sol 2 #9)   // the phone screen and the pocket both in (Sol 1 #9)   // the boss's pocket glow, the gossip's phone at the left edge
const SCRUB_SHOT = { pos: [-1.3, 1.5, 2.6], look: [-1.3, 0.6, -0.6], fov: 44 };   // straight behind: both gloves inside the fridge (Sol 3 #5)   // both gloves and the cup on the counter (Sol 2 #5, #23)   // 3/4 behind his right: the wiping glove (Sol 1 #5)
const A2 = { pos: [-0.30, 2.05, 7.6], look: [-0.30, 0.90, 0], fov: 34 };
const MED_WEDGE_SIP = { pos: [1.55, 1.25, 3.6], look: [0.95, 0.85, 0.05], fov: 32 };
const STAIN_IN = { pos: [1.2, 0.85, 2.3], look: [0.9, 0.55, 0.3], fov: 34 };
const OFFLINE = { pos: [0.1, 1.6, 6.8], look: [0.0, 0.75, 0], fov: 38 };   // Spud in too (Sol 2 #8)   // the boss's face in, the room looking at him (Sol 1 #8)
const TAG_SHOT = { pos: [-0.3, 0.8, 2.7], look: [-0.45, 0.35, 0.2], fov: 40 };   // the whole box and both gloves (Sol 1 #2)
const beats = c.beats([
  ["who ate my lunch", 0, push(WIDE, 0.05, T[1]), "hook"],
  ["meeting in five", r3(T[1] - 0.05), push(MED_WEDGE, 0.08, 2.8)],
  ["the fridge", INS, push(FRIDGE_IN, 0.15, 1.2)],
  ["gossip", r3(T[3] - 0.1), push(MED_MASH, 0.06, 1.7)],
  ["he was at the fridge", r3(T[4] - 0.05), drift(TWO_MASH_SPUD, -0.1, 1.6), "escalation"],
  ["heads turn", r3(T[4] + 1.55), drift(WIDE_B, -0.12, 1.5)],
  ["didn't see the label", r3(T[5] - 0.05), push(MED_SPUD, 0.05, 1.8)],
  ["the label", TURNBOX, push(BOX_CLOSE, 0.06, 0.8)],
  ["for everyone", r3(T[6] - 0.05), push(TWO_SPUD_CHIP, 0.08, 1.9)],
  ["emailed everyone", r3(T[7] - 0.05), push(CHIP_MED, 0.04, 1.5)],
  ["pings", r3(PING - 0.03), push(PINGS, 0.08, 1.1)],
  ["out of time", CLK, drift(WIDE_B, -0.15, 2.2)],
  ["but", r3(T[9] - 0.05), push(SPUD_BUT, 0.08, 0.8)],
  ["fridge duty", SCRUB, push(SCRUB_SHOT, 0.1, 1.0)],
  ["case closed", r3(T[10] - 0.05), push(MED_WEDGE_SIP, 0.06, 1.6), "payoff"],
  ["the stain", REVEAL, push(STAIN_IN, 0.15, 1.2)],
  ["offline", r3(T[11] - 0.25), drift(OFFLINE, 0.1, 2.6)],
  ["his lunch", TAG, push(TAG_SHOT, 0.08, END - TAG)],
], END);

write(import.meta.url, {
  id: "lunch-trial",
  title: "Who ate my lunch?!",
  idea: "Potato Desk 10: someone ate the little one's labelled lunch; the office holds a trial before the 9:00 meeting, the gossip blames Spud, the boss sends him to clean the fridge, then sips his coffee and shows the sauce on his collar.",
  fps: 30, look: "anime-pro", profile: "short", loop: false,
  captionBand: [210, 1360], captionStyle: "kinetic",
  castLook: "sheet", cleanStart: true,
  motion: { feet: 2, overlap: true, timing: true, solve: true },
  rig: { hand: 2, eyes: 2, hold: 2 },
  physics: true, animeTiming: true,
  set: { type: "plain", color: "#b7c4b8", floor: "none", light: "soft", para: 0, aperture: 0,
    lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: { file: "ai/sneaky/sneaky-01.ogg", lowCut: 150, gain: 0.15 },
  sound: { sfx: 0.6, ambience: 0.05, guard: true, signature: false, surface: "indoor" },
  creative: { length: [22, 32] },
  hook: { show: ["chip", "minebox", "fridge", "wedge"], hint: 0, what: "an office kitchen; a little one holds up his empty labelled lunch box and shouts who ate it" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "spudg", with: "fridge", from: r3(SCRUB - 0.1), to: r3(SCRUB_END + 0.05), checks: ["hand-in-prop", "arm-in-prop", "costume-in-prop"], reason: "fridge duty: his head, sweater and gloves are inside the open fridge, wiping its walls; the check reads the fridge as a solid block" },
    { who: "chip", with: "bossbox", from: r3(BITE - 0.1), to: r3(BITE + 0.7), checks: ["held-high"], reason: "the tag: the box comes up to his mouth for one bite of the boss's pasta" },
  ],
  notes: "Generated by storyboards/series/potato-desk/10-lunch-trial/make-lunch-trial.mjs.",
});
