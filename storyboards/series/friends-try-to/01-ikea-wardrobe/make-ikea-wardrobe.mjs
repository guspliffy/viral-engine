// MY FRIEND GROUP TRYING TO BUILD ONE IKEA WARDROBE ("friends try to" episode 1, 4 Nov 2026), from the clip template.
//   node storyboards/series/friends-try-to/01-ikea-wardrobe/make-ikea-wardrobe.mjs -> ikea-wardrobe.json (same folder)
// Brief: /mnt/project-files/video-scripts/2026-11-04-friends-try-to/01-ikea-wardrobe-ENGINE-PROMPT.md
// Series format: ../00-SERIES-FORMAT.md there; Jonny's eight panels: storyboards/01-ikea-wardrobe/ there (PANELS.md here).
//
// THE BRIEF (exactly 10 s, Wizard, Viking, Phoenix, Reaper)
//   Joke:        four friends build a flat-pack wardrobe: the spell builds it upside down, Viking's flip knocks a door
//                off, the tutorial is useless; Reaper turns one bolt with the Allen key and it is perfect.
//   Wants:       everyone wants the wardrobe built.
//   Consequence: they cheer; Viking leans one elbow on it and, with no back panel, it folds flat.
//   Ending:      the glare at Viking; the unused back panel still leans on the wall (there from frame 0).
//   Callback:    frame 0 is a pile of loose panels; the last frame is a pile of loose panels again.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { ending } from "../ending.mjs";
import { WARDROBE as WD } from "../../../../engine/page/props-ikea.js";

const OPENER = { who: "wiz", line: "wah!", words: false };
const FACES = "strong";
const MOTION = "natural";

const c = clip({ faces: FACES }), { A, sfx, see } = c;
const T0 = 7.0, END = 9.8;   // + two 3-frame hit-stops = exactly 10.0 s; the shared ending runs T0..END

// ---------------------------------------------------------------- places (x right, z toward the camera)
// Jonny's panels: the wardrobe stands in the middle of the room (it folds backwards at the end, so 1.4 m of floor
// behind it stays clear), the back panel leans on the back-left wall, the window is back-right (the plate). The
// four stand in a staggered arc so a 9:16 frame holds all four faces side by side: Viking back-left, the Wizard
// back-centre, Phoenix front-left, Reaper front-right on a taped box (the panels' places). The potatoes are 0.85 m
// tall, so the frame is only about four of them wide.
// K: the wardrobe at 72 % of the props-ikea size, about one and a half potatoes tall (W 0.83, H 1.37, D 0.40)
const K = 0.72, WW = WD.W * K, WH = WD.H * K, WDp = WD.D * K;
const WX = 0.05, WZ = -1.2, H = WD.H;
const VIK0 = [-0.85, -0.65], WIZ0 = [0.3, -0.45], PHX0 = [-1.15, 0.4];
// sit puts Reaper's body on the box's middle (timeline.js sit), facing its yaw; his face is 0.33 m in front of it.
// The Wizard's staff hand sits 0.57 m out to his left (screen right), so he stays a metre from the box
const BOX = [0.95, 0.75], REA_SIT = BOX;
const REA0 = [BOX[0], BOX[1]];
const VIK_FLIP = [r3(WX - WW / 2 - 0.42), r3(WZ + 0.05)];   // at the wardrobe's left side for the flip
const WIZ_NEAR = [0.72, -0.32];            // the Wizard steps in after the slam to look at the right door
const REA_FIX = [0.92, -0.62];   // at the wardrobe's front right corner: the key in the bolt shows past his left side
const REA_END = [1.35, 0.0];   // right, clear of the wardrobe column, the Wizard (back) and his box   // standing front right, the key at his chest: left of the Wizard's face on screen
const VIK_LEAN = [r3(WX - WW / 2 - 0.72), r3(WZ + 0.05)];   // his resting left mitten hangs 0.5 m out: clear of it
const VIK_IN = [r3(VIK_LEAN[0] + 0.22), VIK_LEAN[1]];   // the half step in for the lean
const WIZ_BACK = [1.0, -0.45], WIZ_ASIDE = [0.95, -2.1], PHX_BACK = [-1.25, 0.35], PHX_MID = [-0.05, 0.8];
// a point on the wardrobe in its own frame (before scale) from world offsets off its foot: upright, and upside down
const loc = (dx, y, dz) => [r3(dx / K), r3(y / K), r3(dz / K)];
const locUp = (dx, y, dz) => [r3(-dx / K), r3(H - y / K), r3(dz / K)];   // turned 180 about z: x and y flip

const cast = [
  { id: "vik", character: "duo/viking", at: VIK0, face: 25, expr: "focused", follow: 0.3, seed: 4.1 },
  { id: "wiz", character: "sofa/wizard-staff", at: WIZ0, face: -15, expr: "kind", follow: 0.3, seed: 2.6 },
  { id: "phx", character: "duo/phoenix", at: PHX0, face: 20, expr: "kind", follow: 0.3, seed: 1.7, span: 0.15 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, face: -20, expr: "kind", follow: 0.25, seed: 3.3 },
];
const PHONE = { id: "phone", kind: "phone", ...grips.placeFor("phone", [PHX0[0] + 0.1, 0.48, PHX0[1] + 0.3], 20), tip: -10, scale: 1.6, case: "#7cc4bd" };
const KEY = { id: "key", kind: "allenkey", ...grips.placeFor("allenkey", [r3(REA_SIT[0] - 0.15), 0.6, r3(REA_SIT[1] + 0.44)], -25) };
const MANUAL = { id: "manual", kind: "manual", ...grips.placeFor("manual", [WIZ0[0] - 0.12, 0.4, WIZ0[1] + 0.32], -15), scale: 1.3, away: true, upside: true };
const props = [
  { id: "wardrobe", kind: "wardrobe", x: WX, y: 0, z: WZ, scale: 0.001, apart: 1 },
  { id: "aura", kind: "spellaura", x: WX, y: 0.3, z: WZ, w: 1.4, d: 0.9, scale: 1.4 },
  { id: "backpanel", kind: "hardboard", x: -1.85, z: -2.45, w: 0.82, h: 1.5, lean: 9 },   // its top shows over Viking's crest
  // the loose panels at frame 0: the side panel Viking holds up, the top panel leaning on the pile (it slaps down),
  // one lying flat
  { id: "plankV", kind: "plank", x: -1.57, y: 0, z: -0.55, w: 0.4, h: 1.2, rot: 0, seed: 6 },
  { id: "plankA", kind: "plank", x: -0.05, y: 0, z: 0.25, w: 0.82, h: 0.4, tip: -40, rot: 5, seed: 9 },
  { id: "plankB", kind: "plank", x: 0.1, y: 0.02, z: 0.3, w: 0.82, h: 0.4, tip: -90, rot: 10, seed: 12 },
  // Reaper's seat: a taped box 0.3 m high (h 0.42 at scale 0.714, timeline.js sits on SEAT_Y x scale)
  { id: "box", kind: "cardbox", x: BOX[0], z: BOX[1], w: 0.66, d: 0.5, h: 0.42, scale: 0.714, rot: -25, closed: true },
  { id: "screws", kind: "screwbag", x: 0.35, z: 1.3, rot: 30 },
  { id: "wrap", kind: "bubblewrap", x: -0.2, z: 1.35, w: 0.9, d: 0.6, rot: 15 },
  // foreground clutter like the panels: an opened box front left, a spare shelf lying across the front
  { id: "openbox", kind: "cardbox", x: -1.1, z: 1.35, w: 0.66, d: 0.5, h: 0.42, scale: 0.714, rot: 20 },
  { id: "plankC", kind: "plank", x: 0.15, y: 0.02, z: 1.6, w: 0.82, h: 0.4, tip: -90, rot: 80, seed: 15 },
  { id: "sheet2", kind: "manual", x: 0.55, y: 0.003, z: 0.55, tip: -90, rot: 25 },
  MANUAL, PHONE, KEY,
  { id: "motes", kind: "dustmotes", x: 0.6, y: 1.2, z: -1.0 },
];

const SUB = 470, SUBS = { size: 62, kinetic: false };
const ahead = (at, yaw, d) => [r3(at[0] + Math.sin((yaw * Math.PI) / 180) * d), r3(at[1] + Math.cos((yaw * Math.PI) / 180) * d)];

// the wardrobe's root pose for a roll about its middle (the root turns about its foot): theta in degrees, lift in m.
// It turns with tilt (= -theta), not roll: props3d gripWorld turns grip points by tilt, so hands on it stay on it
function wardrobeAt(t, theta, lift, dur, ease = "linear", x = WX) {
  const th = (theta * Math.PI) / 180, h = WH / 2;
  c.prop(t, "wardrobe", { tilt: r3(-theta), x: r3(x + h * Math.sin(th)), y: r3(h + lift - h * Math.cos(th)) }, dur, ease);
}

// ---------------------------------------------------------------- 1 ALREADY GOING WRONG 0-1.5 (P1)
// no burned-in title: Jonny types it in-app (top 20 % clear for the first 2 s)
act.opener(c, OPENER.who, OPENER.line, { words: OPENER.words });
// Viking holds a tall side panel upright beside him (both palms on its edge)
// (his right hand, on our left, steadies it by its edge; the left gestures at the pile)
c.arm(0, "vik", "R", { prop: "plankV", grip: [0.23, 0.62, 0.02], palm: true }, 0);
A(0, "vik", "grip", { side: "R", shape: "flat", dur: 0 });
c.arm(0.3, "vik", "L", { o: [0.18, 0.5, 0.36] }, 0.3, "out"); A(0.35, "vik", "grip", { side: "L", shape: "point", dur: 0.15 });
c.arm(1.1, "vik", "L", "rest", 0.35, "inOut"); A(1.1, "vik", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(0, "vik", "look", { to: [0.45, -0.35], dur: 0, blink: false });
// the top panel slides off the pile and slaps flat (dust)
c.prop(0, "plankA", { tip: -90, y: 0.03 }, 0.2, "in");   // a big visible fall (50 degrees), not a twitch
sfx(0.2, "kenney/impact-plank-medium", { gain: 0.75, reason: "the flat-pack top panel slaps flat on the floor" });
c.at(0.19, { fx: "poof", pos: [-0.05, 0.05, 0.45], dur: 0.5, color: "#efe3cf", puffs: 8, sparks: 0, size: 0.35, lift: 0.04 });
c.at(0.19, { fx: "shake", dur: 0.15, amp: 0.012 });
// the Wizard reads the instruction sheet, upside down (the sheet's roll 180), staff in his other hand
const man = grips.phone(c, "wiz", MANUAL, { side: "R", height: 0.5 });
man.secure(0, 0.01);
A(0, "wiz", "look", { to: [-0.2, -0.4], dur: 0, blink: false });
A(0.05, "wiz", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.2 }, dur: 0.1 });
A(0.6, "wiz", "expr", { expr: "focused", dur: 0.25 });
// Phoenix holds his phone up, the tutorial playing (tinny chirps); we never see the screen
const ph = grips.phone(c, "phx", PHONE, { side: "R" });
ph.secure(0, 0.01);
A(0, "phx", "look", { to: [0.1, -0.2], dur: 0, blink: false });
act.scrollPhone(c, "phx", [0.4, 1.1]);
// Reaper sits on the box, the Allen key already in his hand, deadpan
A(0, "rea", "sit", { seat: "box", dur: 0.01, hands: "keep" });
const key = grips.thin(c, "rea", KEY, { side: "R", from: 0.45 });
key.secure(0, 0.01);
A(0, "rea", "look", { to: [-0.6, 0.05], dur: 0, blink: false });
A(0, "rea", "face", { lid: 0.48, dur: 0 });
see(0, 1.5, ["vik.face", "wiz.face", "phx.face", "rea.face", "plankA"], "P1: the loose panels, the upside-down instructions, the phone, Reaper waiting");
act.blinksAt(c, "rea", [2.6]); act.blinksAt(c, "phx", [1.9]);

// ---------------------------------------------------------------- 2 THE SPELL 1.5-3.3 (P2): built upside down, mid-air
const SPELL = 1.6;
// he tosses the useless sheet over his shoulder (it flutters down behind him)
A(1.45, "wiz", "release", { prop: "manual", to: [WIZ0[0] + 0.2, 0.003, WIZ0[1] - 0.45], dur: 0.45, arc: 0.25 });
c.prop(1.45, "manual", { tip: -90 }, 0.45);
A(1.45, "wiz", "grip", { side: "R", shape: "open", dur: 0.12 }); c.arm(1.48, "wiz", "R", "rest", 0.3, "inOut");
A(SPELL, "wiz", "talk", { line: "trust me", tone: "calm", dur: 0.4, voice: false });
c.cap(SPELL, 2.5, "Trust me.", SUB, false, SUBS);
A(SPELL, "wiz", "expr", { expr: "cocky", dur: 0.25 }); A(SPELL, "wiz", "face", { lid: 0.25, dur: 0.25 });
A(1.7, "wiz", "turn", { to: -20, dur: 0.3 });
A(1.72, "wiz", "look", { to: [-0.4, 0.45], dur: 0.15, blink: false });
A(1.75, "wiz", "grip", { side: "L", shape: "fist", dur: 0.12 });
c.arm(1.8, "wiz", "L", { o: [0.25, 0.95, 0.1] }, 0.3, "out"); A(1.8, "wiz", "tilt", { to: [18, 8], dur: 0.3 });
A(1.9, "wiz", "charge", { to: 1, dur: 0.3 });
sfx(1.9, "charge", { gain: 0.3, dur: 1.2, reason: "the Wizard's build spell" });
c.prop(1.95, "aura", { glow: 1, y: 0.7 }, 0.3);
// the loose panels fly up into the swirl (Viking's is pulled out of his hands)
A(2.0, "vik", "grip", { side: "R", shape: "open", dur: 0.12 });
c.arm(2.05, "vik", "R", { o: [0.2, 0.7, 0.2] }, 0.2, "out");
c.arm(2.6, "vik", "R", "rest", 0.4, "inOut"); A(2.6, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
// (Viking's goes straight up first, clear of his head, then over)
c.prop(1.98, "plankV", { y: 1.55, x: -1.5 }, 0.24, "out");
// (the two on the floor go straight up too, over the Wizard's hat, then back into the swirl)
c.prop(1.98, "plankA", { y: 1.95, tip: -30 }, 0.24, "out"); c.prop(2.0, "plankB", { y: 2.0, tip: -20 }, 0.24, "out");
for (const [id, t0] of [["plankV", 2.22], ["plankA", 2.22], ["plankB", 2.24]]) {
  c.prop(t0, id, { x: WX, y: 1.3, z: WZ, rot: 40, tip: 30, roll: 60 }, 0.25, "in");
  c.prop(r3(t0 + 0.24), id, { scale: 0.001 }, 0.06);
}
sfx(2.05, "whoosh", { gain: 0.3, reason: "the panels fly up into the spell" });
// the wardrobe assembles in the swirl, upside down, then settles on the floor upside down (on its top, legs up)
wardrobeAt(2.3, 180, 0.6, 0.01);   // high in the swirl, legs up
c.prop(2.3, "wardrobe", { scale: K }, 0.08, "out");
c.prop(2.3, "wardrobe", { apart: 0 }, 0.5, "out");
c.prop(2.55, "wardrobe", { open: 0.3, wobble: 0.5 }, 0.3, "out");   // both doors hang open from the top: upside down at a glance
for (const t of [2.45, 2.6, 2.75]) sfx(t, "kenney/impact-wood-medium", { gain: 0.35, reason: "panels clacking together in mid-air" });
wardrobeAt(2.95, 180, 0, 0.22, "in");   // (the doors stay open after it lands)
c.prop(3.0, "aura", { glow: 0 }, 0.25);
A(2.95, "wiz", "charge", { to: 0, dur: 0.25 });
c.arm(3.0, "wiz", "L", "rest", 0.35, "inOut"); A(3.0, "wiz", "tilt", { to: null, dur: 0.35 });
// he backs off to the right, pleased with himself, out of the flip's way
A(2.88, "wiz", "look", { to: [0.45, -0.1], dur: 0.12, blink: false });
A(2.98, "wiz", "move", { to: WIZ_BACK, dur: 0.35, ease: "inOut", steps: 2 });
sfx(3.17, "kenney/impact-plank-medium", { gain: 0.6, reason: "the upside-down wardrobe lands on its top" });
c.at(3.17, { fx: "poof", pos: [WX, 0.05, WZ + 0.25], dur: 0.5, color: "#efe3cf", puffs: 8, sparks: 0, size: 0.4, lift: 0.04 });
// faces: Viking glares at the Wizard, Phoenix snickers behind his phone, Reaper sighs
A(2.4, "vik", "look", { to: [0.4, 0.45], dur: 0.15, blink: false });
A(3.2, "vik", "look", { to: [0.85, 0.05], dur: 0.12, blink: false });
act.mood(c, 3.2, "vik", "angry", { hold: 0.2 });
A(2.4, "phx", "look", { to: [0.35, 0.45], dur: 0.15, blink: false });
A(3.15, "phx", "expr", { expr: "smug", dur: 0.2 });
c.textPop(2.75, "vik", "upside down?!", { dur: 0.5, xy: [490, 560], size: 80 });   // review B note 1: the spell's failure named
A(3.18, "phx", "talk", { line: "pff-heh-heh", tone: "excited", dur: 0.36, voice: false });
A(2.4, "rea", "look", { to: [-0.45, 0.4], dur: 0.2, blink: false });
act.emote(c, 2.85, "rea", "sigh", { dur: 0.42, dx: -0.45, dy: -0.6 });   // ends before the cut
see(2.35, 3.3, ["wardrobe", "wiz.face", "vik.face"], "P2: the wardrobe built upside down in the spell");

// ---------------------------------------------------------------- 3 VIKING FLIPS IT 3.3-4.5 (P3): a door flies into the Wizard's hat
A(3.22, "vik", "look", { to: [0.6, 0.15], dur: 0.12, blink: false });
A(3.3, "vik", "move", { to: VIK_FLIP, dur: 0.32, ease: "inOut", steps: 2 });
A(3.3, "vik", "turn", { to: 85, dur: 0.25 });
// upside down, the wardrobe's own right side faces Viking: palms on it at chest and shoulder height
const SIDE = (y, s) => ({ prop: "wardrobe", grip: locUp(-WW / 2 - 0.035, y, s === "R" ? 0.08 : -0.08), palm: true });
c.arm(3.5, "vik", "R", SIDE(0.5, "R"), 0.12, "out"); c.arm(3.5, "vik", "L", SIDE(0.66, "L"), 0.12, "out");
A(3.52, "vik", "grip", { side: "both", shape: "flat", dur: 0.08 });
A(3.6, "vik", "expr", { expr: "angry", set: { open: 0.35, curve: -0.3 }, dur: 0.12 });
A(3.66, "vik", "talk", { line: "hrrngh", tone: "excited", dur: 0.3, voice: false });
// the heave: he throws it up off its top, it turns over high above everyone (its corners clear the heads), and it
// slams down upright where it was
const TOSS = 3.68, SLAM = 4.02;
c.arm(TOSS, "vik", "R", { o: [0.36, 1.0, 0.32] }, 0.15, "out"); c.arm(TOSS, "vik", "L", { o: [0.36, 1.0, 0.32] }, 0.15, "out");
A(TOSS, "vik", "grip", { side: "both", shape: "open", dur: 0.08 });
wardrobeAt(TOSS, 200, 0.45, 0.08, "out");
wardrobeAt(r3(TOSS + 0.08), 270, 0.8, 0.09, "linear");
wardrobeAt(r3(TOSS + 0.17), 330, 0.6, 0.08);
wardrobeAt(r3(TOSS + 0.25), 360, 0, r3(SLAM - TOSS - 0.25), "in");
sfx(TOSS, "whoosh", { gain: 0.35, reason: "the wardrobe swings over" });
c.prop(SLAM, "wardrobe", { open: 0.85, wobble: 1, bend: 0.12 }, 0.12, "out");
sfx(SLAM, "slam", { gain: 0.8, reason: "the wardrobe slams down upright" });
c.at(SLAM, { fx: "poof", pos: [WX, 0.05, WZ + 0.3], dur: 0.55, color: "#efe3cf", puffs: 10, sparks: 0, size: 0.45, lift: 0.05 });
c.at(SLAM, { fx: "shake", dur: 0.2, amp: 0.02 });
// the Wizard steps in to look at it; the right door drops off its hinge and swings into his hat: bonk
A(3.95, "wiz", "look", { to: [-0.4, 0.2], dur: 0.12, blink: false });
A(4.0, "wiz", "move", { to: WIZ_NEAR, dur: 0.25, ease: "inOut", steps: 2 });
A(4.0, "wiz", "turn", { to: -30, dur: 0.25 });
const BONK = 4.3;
c.prop(4.15, "wardrobe", { broken: 1 }, 0.15, "in");
act.impact(c, BONK, "wiz", { sound: "hit-wood", gain: 0.7, recoil: -12, look: [-0.2, 0.4] });
c.prop(r3(BONK + 0.1), "wardrobe", { wobble: 0.3 }, 0.6, "inOut");
A(3.7, "phx", "look", { to: [0.45, 0.3], dur: 0.15, blink: false });
A(3.95, "rea", "look", { to: [-0.35, 0.3], dur: 0.15, blink: false });
see(3.6, 4.45, ["wardrobe", "vik.face", "wiz.face"], "P3: Viking flips it, the door swings off into the Wizard's hat");

// ---------------------------------------------------------------- 4 BLAME 4.5-5.5 (P4): "YOUR hands!" / "YOUR spell!", the phone between them
A(4.5, "wiz", "turn", { to: -35, dur: 0.2 }); A(4.45, "vik", "turn", { to: 60, dur: 0.2 });
A(4.5, "wiz", "look", { to: [-0.9, 0.05], dur: 0.1, blink: false }); A(4.5, "vik", "look", { to: [0.9, 0.05], dur: 0.1, blink: false });
act.mood(c, 4.55, "wiz", "angry", { hold: 0.5 });
c.arm(4.52, "wiz", "R", { o: [0.15, 0.6, 0.5] }, 0.14, "out");   // across, at face height, at Viking A(4.54, "wiz", "grip", { side: "R", shape: "point", dur: 0.1 });
A(4.56, "wiz", "talk", { line: "YOUR hands!", tone: "excited", dur: 0.4, voice: false });
c.cap(4.55, 5.05, "YOUR hands!", SUB, false, SUBS);
act.mood(c, 4.85, "vik", "angry", { hold: 0.5 });
c.arm(4.9, "vik", "R", { o: [0.3, 0.5, 0.45] }, 0.14, "out");   // out toward the Wizard, clear of his own face (review B note 4)   // across, at face height, at the Wizard A(4.92, "vik", "grip", { side: "R", shape: "point", dur: 0.1 });
c.arm(4.9, "vik", "L", "rest", 0.25);
A(4.95, "vik", "talk", { line: "YOUR spell!", tone: "excited", dur: 0.4, voice: false });
c.cap(5.05, 5.5, "YOUR spell!", SUB, false, SUBS);
// Phoenix steps up and holds the tutorial out between them; both push it away at once
A(4.45, "phx", "look", { to: [0.5, 0.2], dur: 0.12, blink: false });
A(4.95, "phx", "move", { to: PHX_MID, dur: 0.35, ease: "inOut", steps: 3 });   // after both points land (review B note 4)
A(4.95, "phx", "turn", { to: 0, dur: 0.2 });   // faces us as he side-steps, so the phone stays in front
ph.carry(4.81, [r3(PHX0[0] + 0.05), 0.5, r3(PHX0[1] + 0.45)], 0.12, "out", { rot: 190 });   // out in front first
ph.carry(4.93, [r3(PHX_MID[0] - 0.1), 0.48, r3(PHX_MID[1] + 0.45)], 0.35, "inOut", { rot: 180 });
A(5.1, "phx", "look", { to: [0, 0.2], dur: 0.1, blink: false });
ph.carry(5.28, [r3(PHX_MID[0] - 0.12), 0.56, r3(PHX_MID[1] + 0.44)], 0.2, "out", { rot: 180, tip: 0 });
A(5.15, "phx", "expr", { expr: "eager", dur: 0.2 });
A(5.15, "phx", "look", { to: [0.2, 0.4], dur: 0.15, blink: false });
c.arm(5.3, "wiz", "R", { o: [0.1, 0.72, 0.35] }, 0.12, "out"); A(5.3, "wiz", "grip", { side: "R", shape: "flat", dur: 0.08 });
c.arm(5.32, "vik", "R", { o: [0.3, 0.75, 0.42] }, 0.12, "out"); A(5.32, "vik", "grip", { side: "R", shape: "flat", dur: 0.08 });
ph.carry(5.4, [r3(PHX_MID[0] - 0.1), 0.46, r3(PHX_MID[1] + 0.38)], 0.18, "out", { rot: 180, tip: -10 });
A(5.42, "phx", "expr", { expr: "shocked", set: { open: 0.12 }, dur: 0.15 });
c.arm(5.45, "wiz", "R", "rest", 0.3); c.arm(5.45, "vik", "R", "rest", 0.3);
A(5.45, "wiz", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(5.45, "vik", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
see(4.55, 5.45, ["wiz.face", "vik.face", "phone"], "P4: the blame, the tutorial pushed away by both");

// ---------------------------------------------------------------- 5 THE CALM FIX 5.5-7.0 (P5): one quarter turn of the Allen key
A(5.2, "rea", "look", { to: [-0.3, 0.3], dur: 0.12, blink: false });
A(5.3, "rea", "stand", { dur: 0.3 });
A(5.58, "rea", "turn", { to: -145, dur: 0.25 });
A(5.62, "rea", "move", { to: REA_FIX, dur: 0.58, ease: "inOut", steps: 5 });
A(6.05, "rea", "turn", { to: -125, dur: 0.2 });   // to the bolt on the front edge
// the others step aside for him
A(5.45, "wiz", "look", { to: [-0.3, -0.1], dur: 0.12, blink: false });
A(5.45, "wiz", "move", { to: [1.3, -1.0], dur: 0.35, ease: "in", steps: 2 });   // round the wardrobe's right, a body-width clear
A(5.8, "wiz", "move", { to: WIZ_ASIDE, dur: 0.35, ease: "out", steps: 2 });   // backs off, still facing us
A(5.95, "wiz", "turn", { to: -50, dur: 0.3 });
A(5.45, "phx", "look", { to: [-0.4, 0.0], dur: 0.12, blink: false });
// he backs off to the left, out of Reaper's way, to where he started, the phone still up
A(5.5, "phx", "look", { to: [-0.5, 0.0], dur: 0.1, blink: false });
A(5.55, "phx", "move", { to: PHX_BACK, dur: 0.6, ease: "inOut", steps: 4 }); A(5.55, "phx", "turn", { to: 20, dur: 0.3 });
ph.carry(5.55, [r3(PHX_BACK[0] + 0.12), 0.48, r3(PHX_BACK[1] + 0.36)], 0.6, "inOut", { rot: 200, tip: -10 });
A(5.6, "vik", "move", { to: VIK_LEAN, dur: 0.3, ease: "inOut", steps: 2 }); A(5.6, "vik", "turn", { to: 20, dur: 0.3 });
// the key (in his right mitten, the camera side) goes into the cam bolt in the frame's front edge by the right
// door; one quarter turn and the whole thing squares up, the loose door swinging back onto its hinge
const BOLT = [r3(WX + WW / 2 - 0.03), 0.62, r3(WZ + WDp / 2 + 0.02)];
A(6.06, "rea", "look", { to: [0.3, -0.2], dur: 0.12, blink: false });
key.carry(6.1, [BOLT[0], r3(BOLT[1] - 0.2), r3(BOLT[2] + 0.075)], 0.18, "out", { rot: 90 });   // in the bolt before the insert cuts in
const CLICK = 6.5;
c.prop(6.4, "key", { tilt: -55 }, 0.1, "inOut");   // the quarter turn: the long arm swings round the bolt
sfx(CLICK, "kenney/metal-click", { gain: 0.6, reason: "the Allen key's quarter turn: the bolt clicks tight" });
c.hitStop(CLICK, 3);
c.prop(r3(CLICK + 0.02), "wardrobe", { bend: 0, open: 0, broken: 0, wobble: 0 }, 0.2, "out");
sfx(r3(CLICK + 0.18), "hit-wood", { gain: 0.35, reason: "both doors swing shut with a soft clack" });
c.at(r3(CLICK + 0.02), { fx: "poof", pos: [WX, WH, WZ + 0.25], dur: 0.35, color: "#fff3c4", puffs: 4, sparks: 8, size: 0.18, lift: 0.05 });
c.prop(6.68, "key", { tilt: 0 }, 0.25, "inOut");
// he turns to us first, then side-steps out of the way, the key moving with him
// the key comes out of the bolt first, then he turns to us with it, then side-steps
key.carry(6.56, [r3(REA_FIX[0] - 0.29), 0.5, r3(REA_FIX[1] - 0.2)], 0.1, "out", { rot: 55 });
A(6.64, "rea", "turn", { to: -15, dur: 0.18 });
key.carry(6.64, [r3(REA_FIX[0] - 0.28), 0.44, r3(REA_FIX[1] + 0.26)], 0.18, "inOut", { rot: 165 });
A(6.84, "rea", "move", { to: REA_END, dur: 0.45, ease: "inOut", steps: 4 });
key.carry(6.84, [r3(REA_END[0] - 0.28), 0.44, r3(REA_END[1] + 0.26)], 0.45, "inOut", { rot: 165 });
A(6.66, "rea", "look", { to: [0, 0.05], dur: 0.15, blink: false });
A(6.7, "rea", "expr", { expr: "deadpan", dur: 0.2 });
for (const [who, d] of [["phx", 0.08]]) act.shock(c, r3(CLICK + 0.15 + d), who, { open: 0.5, eye: 1.3, hold: 0.4 });   // (the Wizard is behind Reaper in this shot)
see(6.32, 6.5, ["key"], "P5: the key in the bolt, the quarter turn (the insert)");
see(6.58, 6.72, ["wardrobe"], "P5: the wardrobe squares up, the doors swing shut");
see(6.75, 6.98, ["rea.face"], "P5: Reaper turns back to us, deadpan");

// ---------------------------------------------------------------- 6-8 THE SHARED ENDING (P6-P8)
const AT = { wiz: WIZ_ASIDE, vik: VIK_IN, phx: PHX_BACK, rea: REA_END };
const E = ending(c, {
  T0, at: AT,
  arms: { wiz: ["R"], vik: ["R"], phx: ["L"], rea: ["L"] },   // Viking's left stays down: it would go up into the wardrobe beside him
  cheerHop: ["phx"],
  glareShare: { wiz: 0.35, phx: 0.12, rea: 0.35 },
  undo(U) {
    // Viking, beaming, leans one elbow casually on the wardrobe's side: "Solid."
    A(r3(U - 0.1), "vik", "look", { to: [0.6, -0.05], dur: 0.1, blink: false });
    A(U, "vik", "turn", { to: 80, dur: 0.15 });
    A(U, "vik", "move", { to: VIK_IN, dur: 0.15, ease: "inOut", steps: 1 });
    c.arm(r3(U + 0.1), "vik", "L", { prop: "wardrobe", grip: loc(-WW / 2 - 0.09, 0.56, 0.04), palm: true }, 0.12, "out");   // after the turn, so the arm comes round on its own side
    A(r3(U + 0.12), "vik", "lean", { to: 12, dur: 0.16 });
    A(r3(U + 0.06), "vik", "expr", { expr: "cocky", dur: 0.15 });
    A(r3(U + 0.08), "vik", "talk", { line: "solid", tone: "calm", dur: 0.3, voice: false });
    c.cap(r3(U + 0.06), r3(U + 0.75), "Solid.", SUB, false, SUBS);
    // no back panel: it racks sideways, then folds flat backwards
    c.prop(r3(U + 0.15), "wardrobe", { bend: 0.3 }, 0.4, "in");   // slowly at first
    sfx(r3(U + 0.15), "door-creak", { gain: 0.55, reason: "the wardrobe creaks as it racks under his elbow" });
    A(r3(U + 0.42), "vik", "look", { to: [0.55, 0.15], dur: 0.08, blink: false });   // he feels it go
    c.prop(r3(U + 0.5), "wardrobe", { fall: 1 }, 0.4, "in");
    const FLAT = r3(U + 0.9);
    sfx(FLAT, "kenney/impact-wood-heavy", { gain: 0.9, reason: "the wardrobe folds flat on the floor: whump" });
    for (const dx of [-0.35, 0.35]) c.at(FLAT, { fx: "poof", pos: [r3(WX + dx), 0.08, WZ - 0.7], dur: 1.1, color: "#efe3cf", puffs: 22, sparks: 0, size: 1.0, lift: 0.08 });   // review B note 6
    c.at(FLAT, { fx: "shake", dur: 0.3, amp: 0.035 });
    // his elbow stays in the air where the wardrobe was; he stands back up
    c.arm(r3(U + 0.55), "vik", "L", { o: [0.42, 0.7, 0.06] }, 0.2, "out");
    A(r3(U + 0.55), "vik", "lean", { to: 4, dur: 0.25 });
    act.shock(c, r3(U + 0.6), "vik", { open: 0.2, hold: 0.35 });
  },
  sting: 0.3,
  rub: "R",
});
see(r3(E.glare + 0.5), 9.7, ["backpanel"], "P8: the unused back panel still leans on the wall");
A(E.glare, "vik", "turn", { to: 25, dur: 0.3, ease: "inOut" });   // 3/4 to us for the sheepish grin

// ---------------------------------------------------------------- shots: Jonny's panels (one front view, eye level)
// the wide looks down on the room so the back row's faces clear the front row's heads
const WIDE = { pos: [0.0, 2.8, 6.0], look: [0.0, 0.45, -0.5], fov: 52 };
// review B note 1: the opening creeps in on the spell (slow first, so the hook holds), the flip then cuts away
const OPEN = { ...WIDE, to: { pos: [0.0, 2.4, 4.6], look: [0.05, 1.0, -1.0] }, dur: 2.5, ease: "in" };
const FLIP = { pos: [-0.2, 2.1, 3.5], look: [-0.15, 0.85, -1.0], fov: 52 };
const BLAME = { pos: [-0.1, 2.6, 5.2], look: [0.0, 0.6, -0.7], fov: 50 };   // a size step out from the flip (no jump cut)
const FIX = { pos: [-0.1, 2.0, 3.6], look: [0.35, 0.7, -1.0], fov: 46 };   // front, like the panel: the whole wardrobe, Reaper at its right corner, the key in the bolt   // from the right, so his right mitten and the key show past him
const KEYIN = { pos: [-0.25, 1.05, 0.8], look: [0.38, 0.62, -0.98], fov: 38 };   // the brief's insert: mitten, key, bolt, the quarter turn (review B's wider angle round to the left put the Wizard's face in it: kept this one)
const beats = c.beats([
  ["P1-P2 going wrong, the spell", 0, OPEN, "hook"],
  ["P3 the flip", 3.3, FLIP],
  ["P4 blame", 4.5, BLAME, "reaction"],
  ["P5 the calm fix", 5.5, "keep"],
  ["P5 the key insert", 6.3, KEYIN],
  ["P5 it squares up", 6.55, BLAME],
  ["P6-P8 cheer, undo, glare", T0, WIDE],
  ["P7 the undo", E.payoff, "keep", "payoff"],
], END);

write(import.meta.url, {
  id: "ikea-wardrobe",
  title: "My friend group trying to build one IKEA wardrobe",
  idea: "Friends try to, episode 1: the spell builds it upside down, the flip knocks a door off, Reaper fixes it with one turn of the Allen key, then Viking leans on it and it folds flat (the back panel was never used)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 9.6,
  // the painted room (assets/plates/ikea-bedroom.png, paint.py seed 3): its wall meets the floor 70 % down the picture,
  // so the plate hangs with that line on y 0; the 3D floor takes the painted floor's colour and the shadows
  set: { type: "plain", color: "#f1e2c4", floor: "#b98455", light: "golden", para: 0, bloom: "emissive", aperture: 0,
    plate: { src: "assets/plates/ikea-bedroom.png", z: -2.6, center: [0.1, 1.68], height: 8.4, depth: false, motion: false, dust: 20 } },
  music: { style: "bounce", lowCut: 150, gain: 0.3, until: E.musicStop },   // the brief asks for a Nordic folk fiddle; beat.mjs has no folk style, so the plucky "bounce"
  sound: { sfx: 0.7, ambience: 0.3, surface: "wood", room: "room", signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["vik", "wiz", "phx", "rea", "plankA"], hint: 0.2, what: "the loose panels slap down, the instructions are upside down" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "box", from: 0, to: 5.8, reason: "Reaper sits on the cardboard box and gets up from it" },
    { who: "wiz", with: "wardrobe", from: 4.15, to: 4.55, reason: "the loose door swings into the Wizard's hat brim (the bonk)" },
    { who: "vik", with: "wardrobe", from: 3.45, to: 3.8, reason: "Viking's palms on its side for the heave" },
    { who: "vik", with: "wardrobe", from: 7.8, to: 8.3, reason: "Viking's elbow and palm on the wardrobe's side as he leans on it" },
    { who: "rea", with: "wardrobe", from: 6.15, to: 6.75, reason: "Reaper's key in the bolt on the wardrobe's side, his mitten against it" },
    { who: "vik", with: "plankV", from: 0, to: 2.1, reason: "Viking holds the side panel up by its edge" },
  ],
  notes: "Generated by storyboards/series/friends-try-to/01-ikea-wardrobe/make-ikea-wardrobe.mjs. Panels: PANELS.md.",
});
