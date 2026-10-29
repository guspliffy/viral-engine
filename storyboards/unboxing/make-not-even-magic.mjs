// NOT EVEN MAGIC — DUO UNBOXING (Jonny's story library #11, cinematic v4, 29 Oct 2026), built from the clip template.
// node storyboards/unboxing/make-not-even-magic.mjs -> storyboards/unboxing/not-even-magic.json (+ -b with a caption)
//
// THE BRIEF (story library 11, ENGINE-PROMPT.md: 15.00 s, 450 frames, nine shots, three lines, no loop)
//   Joke:        a beautiful product reveal collapses after one careful everyday action: the phone breaks on the table
//                after the Wizard lets go, and his magic can rejoin the hinge but not the screens.
//   Wants:       the Wizard wants to show off his new folding phone (and then to save it).
//   Consequence: the spell reconnects only the hinge; the failed boot shows both displays ruined, then they go dark.
//   Ending:      Dragon: "Even magic can't fix that." The Wizard quietly folds it, puts it back in its tray and closes
//                the box. A quiet hold, no loop.
//
//   01 0.00-1.30  the purchase: lid already lifting, the closed phone in its tray, lid parked left   (packaging, lid tap)
//   02 1.30-2.40  delight: Wizard close-up, "Look how cool!"
//   03 2.40-3.50  show the friend: two-shot, the closed phone lifted, Dragon "Does it fold?", button 3.25 (click)
//   04 3.50-5.80  careful use, sudden failure: ONE close view: unfold, screens, set down, release, then the hinge
//                 parts and both screens break at 5.20 (hinge click, table tap, tiny crack; the music stops there)
//   05 5.80-6.40  recognition: Wizard close-up, stunned, then concentration                           (silence, breath)
//   06 6.40-8.70  false hope: the golden spell slides the halves together, hinge reconnects 8.15, hope 8.30
//   07 8.70-10.0  not even magic: phone macro, wake 8.75, corrupted 8.85-9.30, off 9.35, cracks stay  (note, chirp)
//   08 10.0-12.2  the verdict: Dragon "Even magic can't fix that." The Wizard lowers his gaze
//   09 12.2-15.0  the return: fold, tray, lid, a quiet settle (lid tap 14.65)
//
// Hands and props (the brief): the Wizard's own RIGHT hand (picture-left) holds half A (the left half, "L"), his own
// LEFT holds half B ("R"). Dragon never touches a prop: both his paws stay on his own far-right part of the table.
// One box base (front-left), one lid (parked farther left), one phone. Every hold is a framed arm pose locked to the
// prop or to one half (storyboards/lib/foldphone.mjs), so nothing slides in a hand.
// Screens: ONE damage map per half from the break on (props-duo.js damage "map"): lit and dim after the break, bright
// corrupted bands on the failed boot, dark glass with the same pale cracks once off.
import { clip, write, r3 } from "../lib/clip.mjs";
import * as act from "../lib/acting.mjs";
import { aim } from "../lib/camera.mjs";
import { EDGE, AROUND, BEHIND, SIDE } from "../lib/foldphone.mjs";
import { FOLD, BOX } from "../../engine/page/props-duo.js";

const c = clip(), { A, sfx } = c;
const END = 15.0;

// ---------------------------------------------------------------- places (x right, z toward the camera, y up)
const TH = 0.34;                                        // the pale maple tabletop
const TABLE = { x: 0, z: 0.9, w: 2.8, d: 0.8 };         // its near edge at z 0.5, a hand's breadth in front of the bodies
const WIZ = [-0.46, 0.0], DRA = [0.56, 0.0];
const BOX_AT = [-0.8, TH, 0.86];                       // the box base, front-left before the Wizard
const LID_PARK = [-1.23, TH, 0.86];                     // its lid, parked immediately farther left
const LID_ON = [0, BOX.H - BOX.SKIRT + 0.012, 0];       // a lid on its base (12 mm proud: the phone's back stands above the rim)
const IN_TRAY = [FOLD.H / 2, BOX.TRAY + FOLD.T + 0.002, -FOLD.W / 2];   // the closed phone lying in the tray (tilt -90)
const add = (a, b) => a.map((v, i) => r3(v + b[i]));
const TRAY = add(BOX_AT, IN_TRAY);
// the open phone set down screen-up in the clear area beside the box (origin = the bottom of its hinge, nearest the
// camera; the halves lie toward the Wizard): x -0.37..0.01, z 0.56..0.80
const FLAT = [-0.18, r3(TH + FOLD.T), 0.8];
const HOLD = [-0.42, 0.35, 0.47];                        // held up before his body: 0.45 m out, below the mouth
const GAP = 0.03, SLIP = 0.012;                         // the snapped hinge: an empty gap with wood showing, a slight offset
const HINGE = [FLAT[0], TH + 0.006, FLAT[2] - FOLD.H / 2];   // the middle of the hinge on the table (for the spell)

// eye targets (face look space: + right on screen, + up)
const W_AT_BOX = [-0.2, -0.85], W_AT_DRA = [0.75, 0.05], W_AT_HELD = [0.05, -0.45], W_AT_FLAT = [0.15, -0.8], W_DOWN = [0.1, -0.7];
const D_AT_PHONE_HELD = [-0.55, -0.3], D_AT_FLAT = [-0.5, -0.65], D_AT_WIZ = [-0.8, 0.0];

const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: WIZ, y: 0.06, face: 10, expr: "eager", follow: 0.2, seed: 2.6 },
  { id: "dra", character: "lookdev/dragon-crisp-table", at: DRA, face: -14, expr: "kind", follow: 0.25, seed: 4.1 },
];
const props = [
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, h: TH, w: TABLE.w, d: TABLE.d, color: "#ecd6aa", leg: "#cfa874", gloss: 0.25 },
  { id: "box", kind: "duobox", x: BOX_AT[0], y: BOX_AT[1], z: BOX_AT[2] },
  { id: "lid", kind: "duolid", ...xyz(add(BOX_AT, add(LID_ON, [0, 0.06, 0]))) },   // frame 0: already mid-lift
  { id: "ph", kind: "foldphone", ...xyz(TRAY), tilt: -90, seed: 11, damage: "map", glow: 0 },
];
function xyz(p) { return { x: p[0], y: p[1], z: p[2] }; }

// ---------------------------------------------------------------- helpers
const look = (t, id, to, dur = 0.2) => A(t, id, "look", { to, dur, blink: false });
const grip = (t, id, side, shape, dur = 0.12) => A(t, id, "grip", { side, shape, dur });
const onProp = (prop, g, palm) => ({ prop, grip: g.map(r3), ...(palm && { palm: palm.map(r3) }) });
// the lid's back edge (toward the Wizard), a little right of its middle, pinched from above and behind: thumb over the
// top, fingers down the skirt (DUO's approved lid pinch, on the near edge instead of an end)
const LD = BOX.D / 2 + 0.012;
const LID_BACK = [0.06, BOX.SKIRT + 0.03, -(LD + 0.03)], LID_BACK_PALM = [0.06, BOX.SKIRT - 0.01, -(LD - 0.02)];
// the closed phone lying in the tray or on the table: both palms flat on its back, one on each end (DUO's lift)
const END_GRIP = { top: [0.042, FOLD.H * 0.74, FOLD.W * 0.5], bottom: [0.042, FOLD.H * 0.26, FOLD.W * 0.5] };
// the wrist rides a little high (fingers slope down 27° onto the back), so the forearm clears the box walls
const ON_BACK = (end) => ({ ...onProp("ph", END_GRIP[end]), frame: { y: [0, 0, 1], z: [-1, 0, 0] } });
// a hand hovering over a half (the spell): palm down, a hand's height over the screen, fingers toward the Wizard
const HOVER = (side) => ({ prop: "ph", grip: [r3(side * FOLD.W * 0.55), r3(FOLD.H * 0.42), 0.17], frame: { y: [0, 1, 0], z: [0, 0, -1], at: [0, 0.02, 0] } });
// a hand just let go of the flat phone: the same turn as its SIDE hold, lifted up and out (nothing turns in a frame)
const LIFT_OFF = (side, v) => ({ ...SIDE("ph", side, v), off: [r3(side * 0.07), 0.1, 0] });
// hands at rest: a paw on the tabletop just in front of his body, clear of the box and the phone
const REST_R = { world: [-0.57, TH + 0.035, 0.62] }, REST_L = { world: [-0.42, TH + 0.035, 0.55] };
const REST_L2 = { world: [-0.5, TH + 0.035, 0.5] };   // after the spell: a little back from the phone (out of the macro shot)
// the same rest as a hold on the tabletop: palm down, fingers forward (the paw's own turn)
const restOn = (r) => ({ prop: "table", grip: [r3(r.world[0] - TABLE.x), r3(r.world[1]), r3(r.world[2] - TABLE.z)], frame: { y: [0.12, -0.05, 1], z: [0, -1, -0.05] } });
const PAW_R = { world: [0.38, TH + 0.035, 0.6] }, PAW_L = { world: [0.76, TH + 0.035, 0.6] };   // Dragon's, all clip

// ---------------------------------------------------------------- frame 0: lifting the lid already
act.blinksAt(c, "wiz", [2.55, 9.6, 12.0]);
act.blinksAt(c, "dra", [1.9, 4.15, 7.4, 13.4]);
c.prop(0, "ph", { fault: 0, slip: 0, mend: 0, pin: 0 }, 0.01);   // start the screen's own numbers (props-duo.js)
for (const [s, p] of [["R", PAW_R], ["L", PAW_L]]) { c.arm(0, "dra", s, p, 0); grip(0, "dra", s, "paw", 0); }
look(0, "dra", [-0.45, -0.55], 0.01);
A(0, "dra", "expr", { expr: "kind", set: { curve: 0.25 }, dur: 0.01 });

// ---------------------------------------------------------------- 01 THE PURCHASE 0.00-1.30
// the right hand (picture-left) holds the lid by its back edge and lifts it straight up, carries it left and lets it
// down flat at its parking place; the left hand rests on the table where the phone will go later
c.arm(0, "wiz", "R", onProp("lid", LID_BACK, LID_BACK_PALM), 0);
grip(0, "wiz", "R", "pinch", 0);
c.arm(0, "wiz", "L", REST_L, 0); grip(0, "wiz", "L", "paw", 0);
c.at(0, { do: "carry", prop: "lid" });
look(0, "wiz", W_AT_BOX, 0.01);
A(0, "wiz", "expr", { expr: "eager", set: { open: 0.3, eye: 1.1 }, dur: 0.01 });
const lid0 = add(BOX_AT, LID_ON);
c.prop(0, "lid", { y: lid0[1] + 0.1 }, 0.25, "out");
// the brand-new phone catches the light as the lid clears it (Fable A4)
c.at(0.6, { fx: "glint", pos: add(BOX_AT, [0.03, BOX.H + 0.012, 0.06]), size: 0.05, dur: 0.35 });
sfx(0.04, "ai-package/cardboard-rustle", { gain: 0.45, reason: "the snug lid slides up off the box (soft packaging release)" });
c.prop(0.28, "lid", { x: LID_PARK[0], y: LID_PARK[1] + 0.06, z: LID_PARK[2] }, 0.5, "inOut");
A(0.3, "wiz", "move", { to: [WIZ[0] - 0.07, WIZ[1]], dur: 0.45, ease: "inOut", steps: 0 });   // a small lean after the lid
c.prop(0.78, "lid", { y: LID_PARK[1] }, 0.1, "in");
const LID_DOWN = 0.88;
sfx(LID_DOWN, "ai-package/box-set-down", { gain: 0.5, reason: "the lid touches down flat on the table" });
// let go: the hand opens and rises off the lid's edge, then comes back toward him
const liftOff = add(add(LID_PARK, LID_BACK), [0, 0.12, -0.05]);
c.arm(LID_DOWN + 0.03, "wiz", "R", { world: liftOff, palm: add(liftOff, [0, -0.1, 0.05]) }, 0.12, "out");
grip(LID_DOWN + 0.03, "wiz", "R", "relaxed", 0.08);
A(1.0, "wiz", "move", { to: WIZ, dur: 0.35, ease: "inOut", steps: 0 });
// straight from the lid into the first fist of delight (no long sweep over to a rest and back up)
c.arm(1.0, "wiz", "R", { x: [-0.26, 0.3, 0.45] }, 0.5, "inOut"); grip(1.0, "wiz", "R", "fist", 0.45);
look(0.95, "wiz", [-0.05, -0.8], 0.2);                  // eyes on the phone in its tray
A(0.95, "wiz", "expr", { expr: "delighted", set: { open: 0.4 }, dur: 0.3 });
look(0.35, "dra", [-0.6, -0.55], 0.3);

// ---------------------------------------------------------------- 02 DELIGHT 1.30-2.40 ("Look how cool!")
A(1.32, "wiz", "face", { brow: 0.3, dur: 0.25 });
A(1.32, "wiz", "expr", { expr: "delighted", set: { open: 0.55, eye: 1.18, pupil: 1.1 }, dur: 0.25 });
A(1.35, "wiz", "squash", { amount: -0.025, dur: 0.2 });
// fists of delight in front of his chest (the brief's panel 02), clear of his face
c.arm(1.3, "wiz", "L", { x: [0.26, 0.3, 0.45] }, 0.3, "settle");
grip(1.3, "wiz", "L", "fist", 0.3);
act.eyesLead(c, 1.55, "wiz", W_AT_DRA, { lead: 0.13 });   // from the box to Dragon as he speaks
c.cap(1.4, 2.35, "Look\nhow\ncool!", 230, false, { x: 175 });   // beside him, on the wall (the say caption would sit on his face)
c.macro(1.4, "wiz", "say", { caption: false, line: "Look how cool!", tone: "excited", voice: "wizard", pos: 300 });
A(1.55, "wiz", "turn", { to: 18, dur: 0.4 });
look(1.45, "dra", D_AT_WIZ, 0.25);
A(1.7, "dra", "expr", { expr: "kind", set: { curve: 0.45 }, dur: 0.3 });

// ---------------------------------------------------------------- 03 SHOW THE FRIEND 2.40-3.50 ("Does it fold?")
// both hands to the phone in its tray, palms flat on its back at its two ends, lift it straight up, stand it up like
// a book (spine left, cover to the camera), then each hand to its own half's outer edge in two quarter turns (DUO v4)
const T3 = { reach: 2.36, lift: 2.6, up: 2.72, edges: 2.84, held: 3.18 };
look(2.3, "wiz", [-0.05, -0.8], 0.15);
A(2.38, "wiz", "turn", { to: 6, dur: 0.3 });
// the reach starts in the close-up, so the cut to the two-shot lands mid-move (Fable B: no streak across the cut)
c.arm(T3.reach - 0.16, "wiz", "R", ON_BACK("top"), T3.lift - T3.reach + 0.14, "inOut");
c.arm(T3.reach - 0.14, "wiz", "L", ON_BACK("bottom"), T3.lift - T3.reach + 0.12, "inOut");
grip(T3.lift - 0.1, "wiz", "both", "flat", 0.08);
c.at(T3.lift - 0.02, { do: "carry", prop: "ph" });
sfx(T3.lift + 0.02, "grab", { gain: 0.85, reason: "both palms take the phone out of its tray" });
c.prop(T3.lift, "ph", { y: TRAY[1] + 0.06 }, T3.up - T3.lift, "out");
c.prop(T3.up, "ph", { x: HOLD[0], y: HOLD[1], z: HOLD[2], tilt: 0, rot: 90 }, T3.held - T3.up, "inOut");
A(T3.lift + 0.05, "wiz", "pitch", { to: 3, dur: 0.3 });
const t2 = T3.edges + (T3.held - T3.edges) * 0.5;
c.arm(T3.edges, "wiz", "R", AROUND("ph", -1, 0.95), t2 - T3.edges, "in");
c.arm(t2, "wiz", "R", EDGE("ph", -1, 0.52), T3.held - t2, "out");
c.arm(T3.edges, "wiz", "L", BEHIND("ph", 1, 0.26), t2 - T3.edges, "in");
c.arm(t2, "wiz", "L", EDGE("ph", 1, 0.26), T3.held - t2, "out");
grip(T3.edges, "wiz", "R", "open", 0.06); grip(t2, "wiz", "both", "phoneEdgeReady", T3.held - t2);
look(2.75, "wiz", W_AT_HELD, 0.25);
A(2.75, "wiz", "expr", { expr: "delighted", set: { open: 0.35, eye: 1.12 }, dur: 0.3 });
// Dragon looks at the hinge and asks; a mild doubt in one brow, friendly
look(2.5, "dra", D_AT_PHONE_HELD, 0.2);
A(2.5, "dra", "face", { brow: 0.25, dur: 0.25 });
A(2.52, "dra", "expr", { expr: "kind", set: { curve: 0.15, raise: 0.06 }, dur: 0.3 });
c.macro(2.5, "dra", "say", { line: "Does it fold?", tone: "question", voice: "phoenix", pos: 300 });
// he switches it on: the thumb on the left half's edge presses the side button (no screen shows while it is closed)
const BUTTON = 3.25;
grip(BUTTON - 0.06, "wiz", "L", "phoneEdge", 0.06);
sfx(BUTTON, "kenney/switch", { gain: 3.5, reason: "the side button pressed" });
c.prop(BUTTON + 0.02, "ph", { glow: 1 }, 0.15);
c.at(BUTTON + 0.02, { fx: "glint", pos: [-0.16, 0.48, 0.46], size: 0.04, dur: 0.3 });   // the press shows (Fable A3)
grip(BUTTON + 0.12, "wiz", "L", "phoneEdgeReady", 0.08);
look(3.3, "wiz", [0.6, -0.1], 0.2);                     // a proud glance at Dragon: watch this

// ---------------------------------------------------------------- 04 CAREFUL USE, SUDDEN FAILURE 3.50-5.80 (one shot)
// unfold 3.50-4.00, the wallpaper shows until 4.35, tipped screen-up and lowered 4.35-4.95, table contact 4.95, the
// hands open 5.05 and are clear by 5.20; only then the hinge parts and both screens break. Held to 5.80.
const OPEN = 3.5, OPENED = 4.0, LOWER = 4.35, CONTACT = 4.95, LETGO = 5.05, CLEAR = 5.2, FAIL = 5.2;
grip(OPEN + 0.02, "wiz", "both", "phoneEdge", 0.16);
c.prop(OPEN, "ph", { open: 0.98, rot: 0 }, OPENED - OPEN, "inOut");
sfx(OPENED - 0.02, "kenney/metal-click", { gain: 1.6, reason: "the hinge clicks fully open" });
look(OPEN, "wiz", [0.0, -0.3], 0.2);
A(OPENED, "wiz", "expr", { expr: "delighted", set: { open: 0.45, eye: 1.2, pupil: 1.15 }, dur: 0.25 });   // pride
look(OPENED + 0.05, "wiz", [0.55, -0.05], 0.2);        // shows it to Dragon
look(OPEN + 0.1, "dra", [-0.5, -0.25], 0.2);
A(OPENED + 0.1, "dra", "expr", { expr: "kind", set: { curve: 0.4, raise: 0.03 }, dur: 0.3 });
// careful: down to the table with both hands, the screens turning up; a small arc so the bottom edge clears the table
look(LOWER - 0.12, "wiz", W_AT_FLAT, 0.2);
A(LOWER, "wiz", "expr", { expr: "eager", set: { curve: 0.22 }, dur: 0.3 });    // careful, a small smile (no frown: he is happy)
c.prop(LOWER, "ph", { x: FLAT[0], y: FLAT[1], z: FLAT[2], tip: -90, open: 1 }, CONTACT - LOWER, "inOut");
c.at(LOWER, { do: "prop", id: "ph", set: {}, dur: CONTACT - LOWER, arc: 0.05 });
A(LOWER, "wiz", "pitch", { to: 8, dur: 0.4 });
// the fingers come out from behind the halves to their side edges while it is still in the air (SIDE)
c.arm(4.58, "wiz", "R", SIDE("ph", -1, 0.52), 0.24, "inOut");
c.arm(4.6, "wiz", "L", SIDE("ph", 1, 0.48), 0.24, "inOut");
sfx(CONTACT, "put-down", { gain: 1.2, reason: "the phone's back meets the table" });
c.at(CONTACT, { do: "carry", prop: "ph" });               // from here the table holds it
grip(LETGO, "wiz", "both", "relaxed", 0.1);
c.arm(LETGO, "wiz", "R", LIFT_OFF(-1, 0.52), CLEAR - LETGO, "out");
c.arm(LETGO + 0.01, "wiz", "L", LIFT_OFF(1, 0.48), CLEAR - LETGO - 0.01, "out");
A(LETGO, "wiz", "pitch", { to: 2, dur: 0.3 });
A(LETGO, "wiz", "expr", { expr: "delighted", set: { open: 0.2, curve: 0.8 }, dur: 0.25 });   // pleased, done
// the failure: the hinge separates, both screens break, the light dims (one damage map, from here to the end)
c.prop(FAIL, "ph", { gap: GAP, slip: SLIP }, 0.07, "out");
c.prop(FAIL, "ph", { crack: 1 }, 0.01);
c.prop(FAIL, "ph", { glow: 0.55 }, 0.12, "out");
sfx(FAIL, "ai/screen-crack", { gain: 1.6, reason: "the tiny dry crack as both screens break (a glassy crackle, no thud)" });
A(FAIL + 0.03, "wiz", "still", { dur: 0.6, idle: 0.03 });
A(FAIL + 0.12, "wiz", "expr", { expr: "delighted", set: { open: 0.1, curve: 0.5, eye: 1.25, pupil: 0.85 }, dur: 0.1 });   // the smile hangs, eyes first
look(FAIL + 0.05, "dra", D_AT_FLAT, 0.15);
A(FAIL + 0.15, "dra", "expr", { expr: "shocked", set: { open: 0.12, eye: 1.15 }, dur: 0.25 });

// ---------------------------------------------------------------- 05 RECOGNITION 5.80-6.40 (Wizard close-up)
look(5.8, "wiz", W_AT_FLAT, 0.15);
A(5.8, "wiz", "face", { brow: 0.35, lid: 0, dur: 0.25 });     // a quiet stunned face, not a scream: the smile goes
A(5.8, "wiz", "expr", { expr: "shocked", set: { open: 0.16, curve: -0.2, eye: 1.2 }, dur: 0.25 });
A(5.82, "wiz", "still", { dur: 0.3, idle: 0.03 });
sfx(5.84, "gasp", { gain: 0.35, reason: "a short breath as he sees it" });
act.mood(c, 6.12, "wiz", "focused", { strength: 0.45, hold: 0.3, squash: 0 });   // the thought changes: concentration, gentle (not a scowl, Fable B4)
A(6.5, "wiz", "pitch", { to: 6, dur: 0.6 });                // he leans in over the spell
A(8.0, "wiz", "pitch", { to: 2, dur: 0.4 });
// the hands come back over the table, ready (still clear of the phone)

// ---------------------------------------------------------------- 06 FALSE HOPE 6.40-8.70 (the spell)
// both hands hover palms-down over the halves (they never touch them); the phone's own state slides the halves
// together on the table, a small golden glow along the hinge; the hinge rejoins at 8.15, the damage stays
const SPELL = 6.6, JOINED = 8.15, HOPE = 8.3;
c.arm(6.3, "wiz", "R", HOVER(-1), 0.22, "inOut"); c.arm(6.31, "wiz", "L", HOVER(1), 0.21, "inOut");
grip(6.3, "wiz", "both", "open", 0.25);   // open hands, palms down over the halves: casting, never touching
look(6.4, "wiz", W_AT_FLAT, 0.15);
A(6.4, "wiz", "still", { dur: 1.75, idle: 0.04 });
c.prop(SPELL - 0.05, "ph", { mend: 1 }, 0.3, "out");
sfx(SPELL, "charge", { gain: 0.08, reason: "the small spell rising (a restrained rising tone)" });
c.prop(SPELL, "ph", { gap: 0, slip: 0 }, JOINED - SPELL, "inOut");
// small golden glints running along the hinge line as the halves close (the glow carries the rest)
for (let i = 0; i < 6; i++) c.at(SPELL + 0.15 + i * 0.24, { fx: "glint", pos: add(HINGE, [0, 0.008, r3(((i * 7) % 6) / 5 * 0.16 - 0.08)]), size: 0.06, dur: 0.38 });
c.at(SPELL, { fx: "glint", pos: add(HINGE, [0, 0.012, 0]), size: 0.07, dur: 0.4 });   // the spell starts at the gap (a sparkle burst strayed off the table)
sfx(JOINED, "latch-click", { gain: 2.6, reason: "the hinge clicks back together" });
A(JOINED, "wiz", "squash", { amount: -0.015, dur: 0.2 });   // a small breath of relief that sets up the hopeful smile
c.at(JOINED, { fx: "glint", pos: add(HINGE, [0, 0.01, 0]), size: 0.09, dur: 0.35 });
c.prop(JOINED + 0.02, "ph", { mend: 0 }, 0.3, "in");
// the hands relax back to the table after the click; the hope arrives after the reconnection, readable by 8.70
c.arm(JOINED + 0.1, "wiz", "R", REST_R, 0.45, "inOut"); c.arm(JOINED + 0.12, "wiz", "L", REST_L2, 0.45, "inOut");
grip(JOINED + 0.12, "wiz", "both", "paw", 0.4);
A(HOPE, "wiz", "face", { brow: 0.2, lid: 0, dur: 0.3 });
A(HOPE, "wiz", "expr", { expr: "kind", set: { curve: 0.55, open: 0.05, eye: 1.08 }, dur: 0.3 });   // a tiny hopeful smile
look(6.5, "dra", D_AT_FLAT, 0.2);
A(6.6, "dra", "expr", { expr: "kind", set: { curve: 0.1, eye: 1.05 }, dur: 0.3 });

// ---------------------------------------------------------------- 07 NOT EVEN MAGIC 8.70-10.0 (phone macro)
const WAKE = 8.75, OFF = 9.35;
c.prop(WAKE, "ph", { glow: 1 }, 0.06);
sfx(WAKE, "ui-confirm", { gain: 0.5, reason: "the brief startup note as the screens wake" });
c.prop(8.82, "ph", { fault: 1 }, 0.05);
sfx(9.12, "ui-error", { gain: 4.0, reason: "the startup fails into one flat chirp" });
c.prop(OFF - 0.02, "ph", { glow: 0, fault: 0 }, 0.08, "in");
look(8.75, "wiz", W_AT_FLAT, 0.1);
A(9.0, "wiz", "still", { dur: 1.0, idle: 0.04 });

// ---------------------------------------------------------------- 08 THE VERDICT 10.0-12.2 (Dragon, gently)
look(10.0, "dra", D_AT_WIZ, 0.25);
A(10.0, "dra", "turn", { to: -22, dur: 0.4 });
act.mood(c, 10.02, "dra", "sad", { strength: 0.55, hold: 0.4, squash: 0 });
A(10.12, "dra", "expr", { expr: "sad", set: { curve: -0.15, open: 0 }, dur: 0.3 });   // compassion, no upturn, so the line never reads as a smirk (Fable A6); after the mood preset at 10.07 so it wins
c.cap(10.05, 12.1, "Even magic can't fix that.", 300, false, { x: 512 });   // over the Dragon's side, clear of the Wizard's hat
c.macro(10.05, "dra", "say", { caption: false, line: "Even magic can't fix that.", tone: "sad", voice: "phoenix", pos: 300, amp: 0.4 });   // a small mouth: said gently
act.mood(c, 10.2, "wiz", "sad", { strength: 0.8, hold: 1.6, squash: 0 });
look(10.25, "wiz", W_DOWN, 0.35);                        // the gaze lowers
A(10.4, "wiz", "still", { dur: 1.7, idle: 0.03, sink: 0.01 });

// ---------------------------------------------------------------- 09 THE RETURN 12.20-15.00 (one view)
// his right hand steadies half A on the table, his left lifts half B by its outer edge and folds it over onto A (the
// phone closes like a book on the table), then both palms take the closed phone by its back, put it in the tray with a
// quarter turn and let go; the right hand brings the lid back and lays it on. A quiet settle and hold.
const F = { reach: 12.22, lift: 12.35, up: 12.62, push: 12.72, shut: 13.06, regrip: 13.07, carry: 13.28, tray: 13.55, free: 13.7 };
act.eyesLead(c, F.reach - 0.12, "wiz", W_AT_FLAT);              // the eyes go to the phone, then the hands
A(12.2, "wiz", "turn", { to: 8, dur: 0.3 });
c.prop(12.2, "ph", { pin: -1 }, 0.01);                   // from here half A stays put and B folds over it (props-duo.js pin)
// the resting paws first take a hold on the table (the same place and turn), so the turn onto the phone's edges is one
// short even turn from hold to hold instead of a flip half way
c.arm(11.8, "wiz", "R", restOn(REST_R), 0.25, "inOut"); c.arm(11.8, "wiz", "L", restOn(REST_L2), 0.25, "inOut");
c.arm(F.reach - 0.12, "wiz", "R", SIDE("ph", -1, 0.5), F.lift - F.reach + 0.12, "inOut");
c.arm(F.reach - 0.1, "wiz", "L", SIDE("ph", 1, 0.5), F.lift - F.reach + 0.1, "inOut");
grip(F.reach - 0.12, "wiz", "both", "phoneEdge", 0.3);
// B swings up to standing (open 0.5 with pin -1) riding the left hand, the hand moves round its edge onto its back,
// then pushes it over and closed, the palm ending flat on top
c.prop(F.lift, "ph", { open: 0.5 }, F.up - F.lift, "inOut");
const PUSH = { prop: "ph", part: "R", grip: [r3(FOLD.W * 0.6), r3(FOLD.H * 0.5), r3(-FOLD.T - 0.04)], frame: { y: [0, 1, 0], z: [0, 0, 1] } };
c.arm(F.up, "wiz", "L", PUSH, F.push - F.up, "inOut");
grip(F.up, "wiz", "L", "flat", 0.08);
c.prop(F.push, "ph", { open: 0 }, F.shut - F.push, "in");
sfx(F.shut, "book-close", { gain: 0.7, reason: "the two halves close on each other (a soft flat thump)" });
// the closed phone, re-described without the pin (the same pose, props-duo.js): then both palms on its back
c.prop(F.regrip, "ph", { pin: 0, tip: 0, tilt: -90, rot: -90 }, 0.0001);
c.arm(F.regrip, "wiz", "R", ON_BACK("top"), F.carry - F.regrip, "inOut");
c.arm(F.regrip, "wiz", "L", ON_BACK("bottom"), F.carry - F.regrip, "inOut");
grip(F.regrip, "wiz", "both", "flat", 0.12);
c.at(F.carry - 0.02, { do: "carry", prop: "ph" });
c.prop(F.carry, "ph", { x: TRAY[0], y: TRAY[1] + 0.07, z: TRAY[2], rot: 0 }, F.tray - F.carry - 0.06, "inOut");
c.prop(F.tray - 0.06, "ph", { y: TRAY[1] }, 0.06, "in");
sfx(F.tray, "put-down", { gain: 1.4, reason: "the phone settles into its tray" });
act.eyesLead(c, F.carry, "wiz", W_AT_BOX, { lead: 0.2 });       // the eyes find the tray before the carry
// let go: both palms lift straight up off its back first (still turned as they held it), then go
grip(F.free, "wiz", "both", "relaxed", 0.2);
c.arm(F.free, "wiz", "L", { ...ON_BACK("bottom"), off: [0, 0.12, 0] }, 0.15, "out");
c.arm(F.free + 0.15, "wiz", "L", REST_L, 0.45, "inOut"); grip(F.free + 0.3, "wiz", "L", "paw", 0.35);
// the lid: the right hand from the phone to the lid's back edge, lifted, carried right and laid on the box
const L1 = { grab: 14.0, up: 14.13, over: 14.5, down: 14.65 };   // the reach is part of the brief's 13.85-14.65 lid close
c.arm(F.free, "wiz", "R", { ...ON_BACK("top"), off: [0, 0.1, 0] }, 0.1, "out");
c.arm(F.free + 0.1, "wiz", "R", onProp("lid", LID_BACK, LID_BACK_PALM), L1.grab - F.free - 0.1, "inOut");
grip(L1.grab - 0.06, "wiz", "R", "pinch", 0.06);
look(F.free, "wiz", [-0.45, -0.8], 0.2);
// he leans in over the box as he carries the phone to it (his arms come down onto the tray from above, not over its wall)
A(F.carry, "wiz", "move", { to: [WIZ[0] - 0.12, WIZ[1] + 0.08], dur: 0.3, ease: "inOut", steps: 0 });
c.at(L1.grab, { do: "carry", prop: "lid" });
c.prop(L1.grab, "lid", { y: LID_PARK[1] + 0.06 }, L1.up - L1.grab, "out");
c.prop(L1.up, "lid", { x: lid0[0], y: lid0[1] + 0.06, z: lid0[2] }, L1.over - L1.up, "inOut");
c.prop(L1.over, "lid", { y: lid0[1] }, L1.down - L1.over, "in");
sfx(L1.down, "kenney/impact-generic-light", { gain: 1.2, reason: "the quiet lid tap as the box closes" });
grip(L1.down, "wiz", "R", "relaxed", 0.15);
c.arm(L1.down, "wiz", "R", { ...onProp("lid", LID_BACK, LID_BACK_PALM), off: [0, 0.1, -0.03] }, 0.12, "out");
c.arm(L1.down + 0.12, "wiz", "R", REST_R, 0.22, "inOut"); grip(L1.down + 0.12, "wiz", "R", "paw", 0.22);
look(L1.up, "wiz", W_AT_BOX, 0.2);
A(L1.over, "wiz", "move", { to: WIZ, dur: 0.3, ease: "inOut", steps: 0 });
// the settle: eyes lowered, a small body sink, the hat settles; quiet hold to the end
look(L1.down + 0.1, "wiz", [0.0, -0.75], 0.35);
A(L1.down + 0.1, "wiz", "expr", { expr: "sad", set: { curve: -0.05, open: 0 }, dur: 0.35 });
A(L1.down + 0.15, "wiz", "squash", { amount: 0.02, dur: 0.3 });
A(L1.down + 0.15, "wiz", "still", { dur: END - L1.down - 0.2, idle: 0.03, sink: 0.012 });
look(12.3, "dra", [-0.5, -0.5], 0.3);
A(13.0, "dra", "expr", { expr: "sad", set: { curve: 0.1 }, dur: 0.4 });

// ---------------------------------------------------------------- shots (fixed by the brief; [name, start, camera, kind])
const S01 = aim([-0.62, 0.58, 0.5], { az: -12, el: 18, h: 1.75, fov: 26, push: 0.05, dur: 1.3 });
const S02 = aim([-0.5, 0.95, 0.3], { az: -6, el: 6, h: 1.6, fov: 22, push: 0.04, dur: 1.1 });
const S03 = aim([-0.06, 0.7, 0.3], { az: 4, el: 10, h: 2.6, fov: 24 });
const S04 = aim([-0.28, 0.5, 0.55], { az: -16, el: 24, h: 1.3, fov: 20, push: 0.3, to: [-0.2, 0.42, 0.62], dur: 2.3 });   // a slow push that ends on the resting phone (Fable B2)   // hands, phone and tabletop (Fable A1)
const S05 = aim([-0.46, 0.9, 0.3], { az: -8, el: 4, h: 0.98, fov: 20, push: 0.03, dur: 0.6 });
const S06 = aim([-0.26, 0.55, 0.45], { az: 10, el: 20, h: 1.6, fov: 22, push: 0.04, dur: 2.3 });
const S07 = aim([FLAT[0] - 0.03, TH + 0.01, FLAT[2] - FOLD.H / 2], { az: -6, el: 62, h: 0.84, fov: 20, push: 0.04, dur: 1.3 });
const S08 = aim([0.14, 0.72, 0.35], { az: 14, el: 10, h: 2.6, fov: 24, push: 0.03, dur: 2.2 });
const S09 = aim([-0.45, 0.58, 0.66], { az: -6, el: 16, h: 2.15, fov: 24, to: [-0.82, 0.56, 0.7], dur: 2.0 });   // from the phone to the box and lid (Fable A2)
const beats = c.beats([
  ["01 the purchase", 0, S01, "hook"],
  ["02 delight", 1.3, S02],
  ["03 show the friend", 2.4, S03],
  ["04 careful use, sudden failure", 3.5, S04, "reveal"],
  ["05 recognition", 5.8, S05, "reaction"],
  ["06 false hope", 6.4, S06, "escalation"],
  ["07 not even magic", 8.7, S07, "payoff"],
  ["08 the verdict", 10.0, S08, "reaction"],
  ["09 the return", 12.2, S09],
], END);

const sb = (variant, captions) => ({
  id: variant === "A" ? "not-even-magic" : `not-even-magic-${variant.toLowerCase()}`,
  title: "Not Even Magic",
  idea: "Story library 11: the Wizard's new folding phone breaks on the table after he lets go; his spell rejoins the hinge but not the screens",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  creative: { length: [12, 16], loop: false },
  set: { type: "plain", color: "#efe4d0", floor: "#cdb48e", light: "golden", key: [-4.5, 4.2, 3.2], aperture: 0, para: 0, bloom: "emissive",
    plate: { src: "assets/plates/cream-room-blue.png", z: -2.3, center: [-0.2, 1.15], height: 3.9 } },
  // restrained, elegant: a soft bed under the reveal that stops exactly at the failure
  music: { file: "ai/elegant-reveal/elegant-reveal-02.ogg", until: FAIL, gain: 0.16 },   // felt piano and celesta (made for this clip), cut by the failure
  sound: { sfx: 0.7, ambience: 0.22, scenes: ["ui"], signature: false },   // ui: the screen's startup note and chirp; no sparkle signature (the brief: no extra magical sparkle sound)
  hook: { show: ["wiz", "box", "ph"], hint: 1.3, what: "a brand-new phone revealed in its box (the glamour the joke breaks)" },
  experiment: { id: "hook-2026-11", episode: "not-even-magic", variant },
  cast, props, captions, beats,
  allowClip: [
    { who: "dra", with: "table", from: 0, to: END, reason: "both his paws rest on his part of the tabletop" },
    { who: "wiz", with: "table", from: 0, to: END, reason: "his paws rest on the tabletop between the handling" },
  ],
  notes: "Generated by storyboards/unboxing/make-not-even-magic.mjs (Jonny's story library 11, cinematic v4).",
});
// the brief as written: no title card and only its three lines, so no caption variant for the hook test (an extra
// setup caption would be a fourth line)
write(import.meta.url, sb("A", c.captions));
