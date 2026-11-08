// DEATH WAITS FOR GTA 6, episode 2: "DELAYED AGAIN?!" (8 Nov 2026), from the clip template.
//   node storyboards/series/gta6/02-delayed-again/make-delayed-again.mjs -> delayed-again.json
// Brief: /mnt/project-files/video-scripts/2026-11-08-gta6-countdown/02-delayed-again-ENGINE-PROMPT.md (series format:
// 00-SERIES-FORMAT.md there). Jonny's eight panels (8 Nov, GTA6-STORYBOARDS.zip) are the target: PANELS.md here has a
// row per panel and the departures. Episode 1 is Not Yet (storyboards/trend/not-yet): the same evening apartment.
//
// THE BRIEF (exactly 10.0 s; Phoenix, the Wizard, Reaper as Death)
//   Joke:        Death has lived on the sofa since episode 1, waiting for GTA 6 with the Wizard. Phoenix flies in with
//                his phone: "It's DELAYED again!" Death puts his controller down, takes his scythe and turns on the
//                Wizard: no game, no deal. "NOT YET!" Phoenix howls: just kidding. Death and the Wizard turn to him
//                in perfect sync, and Death draws a skull on the calendar, on the day after launch, with a little flame.
//   Wants:       Phoenix wants a laugh; the Wizard wants to live to play it; Death wants his game.
//   Consequence: the prank lands on the prankster: his day is marked.
//   Ending:      Death and the Wizard back on the sofa gaming, Phoenix frozen in the air staring at the calendar.
//   Callback:    frame 0 Phoenix in the air with bad news for the Wizard; the last frame Phoenix in the same spot, the
//                bad news his own.
//
// Departures (PANELS.md has them all):
// - Death draws standing on the sofa's backrest (the panel shows his robe ending at the sofa's top edge): from the seat
//   a potato can't reach a calendar hung high enough to show over the seated heads. The sofa stands 20 cm off the wall
//   so he fits on the backrest.
// - The scythe changes hands on cuts only (a costume weapon can't be put down): Reaper without it
//   (notyet/reaper-noscythe) on the sofa, the one with it (sofa/reaper-scythe) from 2.4 s to the calendar cut at 6.4 s.
import { clip, write, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import * as grips from "../../../lib/grips.mjs";
import { SOFA } from "../../../../engine/page/props-sofa.js";

const PAD = { w: 0.17, h: 0.045, d: 0.1 };   // props-notyet.js PAD
const CAL = { w: 0.26, h: 0.34, t: 0.008 };  // props-notyet.js CALENDAR
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;

// the template's settings (Jonny's picks, 30 Oct - 8 Nov 2026)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
// held props don't swing: Phoenix's hover bob swung the phone 5-6 cm round his glove on twos (prop-pop at 6.7, 7.5 and
// 8.8 s), and a phone held up to show a screen stays rigid in the hand (CLAUDE.md contact rule 2)
const MOTION = { feet: 2, overlap: { props: false }, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };

// two 3-frame hit-stops (the blade stopping short, the skull's last stroke) add 0.2 s: 9.8 s of story = 10.0 s of video.
// Story clock: panel 4 at 3.7 (video 3.8), 5 at 4.9 (5.0), 6 at 6.4 (6.5), 7 at 7.4 (7.5), 8 at 8.4 (8.6)
const HS1 = 3.3, HS2 = 8.18, END = 9.8;
const CUT2 = 1.0, CUT3 = 2.4, CUT4 = 3.8, CUT5 = 4.9, CUT6 = 6.4, CUT7 = 7.4, CUT8 = 8.4;

// ---------------------------------------------------------------- places (x right, z toward the camera)
const WZ = -1.75, S = 1.15, HW = r3(SOFA.half * S), D = r3(SOFA.d * S);
const SX = 0.25, SZ = r3(WZ + 0.38 + D / 2);                    // the sofa 35 cm off the back wall (Death fits on its back)
const L0 = [r3(SX - HW / 2), SZ], R0 = [r3(SX + HW / 2), SZ];
const SEAT = (dx) => [dx, 0.37, 0.22];                          // a sitter's place on a half (props-sofa.js)
const seatAt = (half, dx) => [r3(half[0] + dx * S), r3(SEAT(0)[1] * S), r3(half[1] + SEAT(0)[2] * S)];
const REA_SEAT = seatAt(L0, 0), WIZ_SEAT = seatAt(R0, 0);
const BACK = [0, 0.9, -0.31];                                    // the backrest's top, in a half's own frame
const TABLE = { x: 0.3, z: 0.95, w: 1.0, d: 0.42, h: 0.4 };
const PHX_AT = { x: 1.3, y: 1.0, z: 0.25 };                       // hovering at the sofa's right end, by the Wizard
const PHX_CAL = { x: 0.45, y: 0.66, z: -0.72 };                     // panel 7: right under the calendar, looking up at it
const REA_UP = [0, 0.43, 0.13];                                   // panel 3: Death up on his cushion (his half's frame), towering over the Wizard
const WIN = [-1.95, -1.08];                                      // the one window, at the left (panels)
const SCY_AT = [-0.45, 0.56, r3(WZ + 0.22)];                     // the parked scythe against the wall left of the sofa
const OFF = [[-6, -1.0], [6, -1.0]];                             // where a hidden twin waits (outside the room, out of every shot)

// the calendar on the wall above the sofa's left half (panels 1-8), high enough to show over the seated heads
const CAL_K = 2.6, CAL_AT = [-0.12, 1.85, r3(WZ + 0.012)];
// a point on its page: u across from the left (0..1), v down from the top (0..1), as seen from the camera; out: off the paper
const calPt = (u, v, out = 0) => [r3(CAL_AT[0] + (u - 0.5) * CAL.w * CAL_K), r3(CAL_AT[1] + (1 - v) * CAL.h * CAL_K), r3(CAL_AT[2] + CAL.t * CAL_K + out)];
// the cell after the circle (col 5, row 2 of 7 x 5: props-notyet.js countcalendar) and the skull's unit there
const CELL_U = (16 + 5.5 * (228 / 7)) / 260, CELL_V = (76 + 2.5 * 49.6) / 340, SK = 0.3 * (228 / 7 / 260);
const sk = (x, y, out = 0.004) => calPt(r3(CELL_U + x * SK), r3(CELL_V + y * SK * (260 / 340)), out);
// Death on the backrest of the left half, left of the calendar, turned to it (his left glove draws; we see his profile)
const REA_DRAW = { off: [r3((-0.55 - L0[0]) / S), BACK[1], BACK[2]], yaw: 75 };

const cast = [
  { id: "phx", character: "duo/phoenix", at: [PHX_AT.x, PHX_AT.z], face: -30, expr: "angry", follow: 0.3, seed: 1.7 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: [WIZ_SEAT[0], WIZ_SEAT[2]], face: 0, expr: "happy", follow: 0.25, seed: 2.6 },
  { id: "rea2", character: "notyet/reaper-noscythe", at: [REA_SEAT[0], REA_SEAT[2]], face: 0, expr: "kind", follow: 0.2, seed: 3.3 },
  // Death with his scythe, shown from the cut at 2.4 s until the calendar cut at 6.4 s
  { id: "rea", character: "sofa/reaper-scythe", at: OFF[0], face: 0, expr: "focused", follow: 0.2, seed: 3.3, hidden: true },
];
const PAD_LAP = (seat) => [seat[0], r3(seat[1] + 0.2), r3(seat[2] + 0.36)];
const PAD_W = { id: "padW", kind: "gamepad", style: "xbox", color: "#2e3240", dark: "#16171c", ...grips.placeFor("gamepad", PAD_LAP(WIZ_SEAT), 0), scale: 1.2 };
const PAD_W2 = { ...PAD_W, id: "padW2", x: 0, y: -5, z: 0, staged: "his spare, out of sight until the last cut" };
const PAD_R = { id: "padR", kind: "gamepad", style: "xbox", color: "#2e3240", dark: "#16171c", ...grips.placeFor("gamepad", PAD_LAP(REA_SEAT), 0), scale: 1.2 };
const PAD_R_TABLE = [0.0, TABLE.h, 0.92];                         // where Death leaves his controller (panels 3-6)
// the phone, pushed at the Wizard in Phoenix's right glove, its screen to the Wizard and to us
const PHONE = { id: "phone", kind: "phone", style: "iphone", color: "#ff7a2e", frame: "#f2a55a", x: 0.95, y: 1.35, z: 0.45, rot: -30, scale: 2.3,
  screen: { src: "assets/screens/delayed/atlas.png", cols: 2, rows: 1 }, feed: 0, nextFeed: 1, scroll: 0 };
const PEN = { id: "pen", kind: "feltpen", x: 0, y: -5, z: 0, rot: 180, color: "#8f8c94", cap: "#141318", felt: "#0c0b0e", staged: "in Death's robe until he draws" };
const CRESTOFF = [0.0, 1.06, 0.05];
const SMOKEOFF = [0.0, 1.1, -0.06];                                // the smoke starts just behind the crest's tip, so no veil over it                                // the top of Phoenix's crest from where he hovers
const props = [
  { id: "sofaL", kind: "sofahalf", side: "L", x: L0[0], z: L0[1], scale: S, color: "#3d4f8e", color2: "#5167ab", color3: "#2c3a6b" },
  { id: "sofaR", kind: "sofahalf", side: "R", x: R0[0], z: R0[1], scale: S, color: "#3d4f8e", color2: "#5167ab", color3: "#2c3a6b" },
  // the patched sofa (panels): grey tape over old tears on the right arm, the right backrest and the left seat's front
  { id: "tape", kind: "sofatape", x: SX, y: 0, z: SZ, staged: "taped onto the sofa", at: [[r3(HW - 0.09), 0.5, r3(D / 2 + 0.002), "front", 0.17, 0.3], [r3(HW - 0.32), 0.86, r3(-D / 2 + 0.27), "front", 0.15, -0.5], [r3(-HW + 0.3), 0.33, r3(D / 2 + 0.002), "front", 0.13, 0.9]] },
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, w: TABLE.w, d: TABLE.d, h: TABLE.h, color: "#9a6a3e", leg: "#7a5230", legW: 0.06, bevel: 0.012 },
  { id: "cal", kind: "countcalendar", x: CAL_AT[0], y: CAL_AT[1], z: CAL_AT[2], rot: 180, scale: CAL_K, xs: 11, rise: 0, puff: 0, staged: "hangs on the wall" },
  PEN,
  { id: "bowl", kind: "snackbowl", x: 0.35, y: TABLE.h, z: 0.97, scale: 0.85 },
  { id: "clutter", kind: "clutter", x: 0, y: 0, z: 0, items: [[-0.06, 0.9, "mug", 30, TABLE.h], [0.7, 0.93, "mug", -20, TABLE.h], [1.75, 0.65, "console", -10], [-1.35, 0.15, "books", 20], [2.0, 0.1, "slippers", 15]] },
  { id: "floorlamp", kind: "floorlamp", x: 1.5, z: r3(WZ + 0.34) },
  { id: "shelf", kind: "wallshelf", x: 0.55, y: 2.6, z: r3(WZ + 0.005), staged: "screwed to the wall" },
  { id: "art1", kind: "wallart", x: -0.85, y: 2.2, z: r3(WZ + 0.02), w: 0.26, h: 0.32, scene: "sea", frame: "#3c3a40", staged: "hangs on the wall" },
  { id: "art2", kind: "wallart", x: 1.28, y: 2.05, z: r3(WZ + 0.02), w: 0.42, h: 0.32, scene: "hills", frame: "#8a6a42", staged: "hangs on the wall" },
  { id: "art3", kind: "wallart", x: 1.72, y: 2.45, z: r3(WZ + 0.02), w: 0.26, h: 0.3, scene: "forest", frame: "#3c3a40", staged: "hangs on the wall" },
  { id: "dust", kind: "dustmotes", x: 0.3, y: 0, z: -0.4, box: [3.6, 2.2, 2.8], n: 110, seed: 5 },
  PAD_W, PAD_W2, PAD_R, PHONE,
  { id: "scyP", kind: "parkedscythe", x: SCY_AT[0], y: SCY_AT[1], z: SCY_AT[2], tip: -25, rot: 200, staged: "leaning on the wall left of the sofa" },
  { id: "staffP", kind: "parkedstaff", x: r3(R0[0] + HW / 2 + 0.18), y: 0.56, z: r3(SZ - 0.1), tip: -8, rot: 160, staged: "leaning on the sofa's right arm" },
  // tears on the Wizard's cheeks (panel 2), and the smoke off Phoenix's crest at the payoff (panels 7-8)
  { id: "tearL", kind: "tear", wear: "wiz", x: 0.15, y: 0.6, z: 0.34, length: 0.05, scale: 1.4, on: 0, fill: 0 },
  { id: "tearR", kind: "tear", wear: "wiz", x: -0.15, y: 0.6, z: 0.34, length: 0.05, scale: 1.4, on: 0, fill: 0 },
  { id: "sweat", kind: "tear", wear: "phx", x: 0.3, y: 0.78, z: 0.18, length: 0.06, scale: 1.6, on: 0, fill: 0 },
  { id: "smoke", kind: "smokewisp", x: r3(PHX_CAL.x + SMOKEOFF[0]), y: r3(PHX_CAL.y + SMOKEOFF[1]), z: r3(PHX_CAL.z + SMOKEOFF[2]), h: 0.6, size: 0.12, n: 9, rgb: "222,219,228", alpha: 0.95, on: 0 },   // pale and strong: the default grey vanished on the dusk wall and charcoal read as a smudge
];

// subtitles inside y 470-1360, clear of Jonny's title at the top and of the faces
const SUB_HI = 560, SUB_LO = 1260, SUB_WALL = 480;   // SUB_WALL: on the wall left of the Wizard's hat tip, under Jonny's title
// a gibberish line with its subtitle placed by hand: on the wall or the sofa, off every face (caption-overlap), ending on
// its own shot's cut so no caption runs into the next shot (review A: the hook line sat on Phoenix's beak)
const line = (t, who, text, dur, tone, to, pos, x, sub = text, from = t) => {
  c.say(t, who, text.toLowerCase(), dur, tone, { voice: false, sub: false });
  c.cap(from, to, sub, pos, false, { ...SUB_STYLE, ...(x != null && { x }) });
};

// ---------------------------------------------------------------- 1 THE NEWS (0-1.0): main shot (panel 1)
// Phoenix hovers by the Wizard and shoves the phone at him: "It's DELAYED again!"
// he is already airborne on frame 0: the fly at 0 is instant and the hover keeps the wings out (timeline.js airSince)
A(0, "phx", "fly", { to: { x: PHX_AT.x, y: PHX_AT.y, z: PHX_AT.z }, dur: 0 });
A(0, "phx", "hover", { dur: r3(CUT3 - 0.01) });
// panel 3 cheats him 20 cm toward us: the Wizard shrinks back toward him and his wing would brush the hat brim
const PHX_P3 = { ...PHX_AT, z: r3(PHX_AT.z + 0.2) };
A(CUT3, "phx", "fly", { to: PHX_P3, dur: 0 }); A(r3(CUT3 + 0.01), "phx", "hover", { dur: r3(CUT4 - CUT3 - 0.02) });
A(CUT4, "phx", "fly", { to: PHX_AT, dur: 0 }); A(r3(CUT4 + 0.01), "phx", "hover", { dur: r3(CUT7 - CUT4 - 0.02) });
const ph = grips.phone(c, "phx", PHONE, { side: "R" });
ph.carry(CUT3, [PHONE.x, PHONE.y, r3(PHONE.z + 0.2)], 0); ph.carry(CUT4, [PHONE.x, PHONE.y, PHONE.z], 0);
c.arm(0, "phx", "R", { prop: "phone", grip: ph.hands.R.grip, palm: true }, 0); A(0, "phx", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "phx", "grab", { prop: "phone", hand: "R", grip: ph.hands.R.grip, dur: 0, pose: null });
A(0, "phx", "look", { to: [-0.6, -0.1], dur: 0, blink: false });
A(0, "phx", "expr", { expr: "angry", set: { open: 0.6, eye: 1.15 }, dur: 0 });
c.arm(0, "phx", "L", { o: [-0.05, 0.62, 0.3] }, 0); A(0, "phx", "grip", { side: "L", shape: "open", dur: 0 });
line(0.04, "phx", "It's DELAYED again!", 0.75, "excited", CUT2, SUB_WALL, 380, undefined, 0);   // the hook line is up on frame 0
sfx(0, "notify", { gain: 0.2, reason: "the news alert on Phoenix's phone, as he shoves it at the Wizard" });
// the two on the sofa, a controller each in both hands, eyes on the phone
const sitWithPad = (t, who, half, pad, dx) => {
  A(t, who, "ride", { prop: half, off: SEAT(dx), sit: true, yaw: 0, dur: 0 });
  for (const [s, sx] of [["R", 1], ["L", -1]]) c.arm(t, who, s, { prop: pad.id, grip: [r3(sx * (PAD.w / 2 + 0.045 / 1.2)), r3(0.55 * PAD.h), 0], palm: true }, 0);
  A(t, who, "grip", { side: "both", shape: "press", dur: 0 });
  A(t, who, "grab", { prop: pad.id, hand: "both", grip: [0, r3(0.55 * PAD.h), 0], dur: 0, pose: null });
};
sitWithPad(0, "wiz", "sofaR", PAD_W, 0); sitWithPad(0, "rea2", "sofaL", PAD_R, 0);
A(0, "wiz", "still", { dur: 1.0, idle: 0.5, blink: false });   // frozen mid-game
A(0, "wiz", "look", { to: [0.6, 0.12], dur: 0, blink: false });
A(0, "wiz", "expr", { expr: "shocked", set: { eye: 1.25, open: 0.2 }, dur: 0 });
A(0, "rea2", "look", { to: [0.75, 0.08], dur: 0, blink: false });
A(0, "rea2", "expr", { expr: "shocked", set: { eye: 1.1, open: 0.12 }, dur: 0 });
A(0.6, "rea2", "expr", { expr: "deadpan", set: { eye: 0.85 }, dur: 0.25 });   // his face sets at "delayed"
see(0, CUT2, ["phx.face", "wiz.face", "rea2.face", "phone"], "frame 0 (panel 1): Phoenix shoves the bad news at the Wizard; Death beside him");

// ---------------------------------------------------------------- 2 THE DROP (1.0-2.4): the Wizard's close-up (panel 2)
act.shock(c, 1.05, "wiz", { open: 0.2, eye: 0.75, curve: -0.55, brow: 0.5, hold: 0.25 });
A(1.36, "wiz", "expr", { expr: "sad", set: { eye: 0.62, open: 0.12, curve: -0.8 }, dur: 0.25 });
// the controller slips out of his gloves onto the cushion (physics), the empty gloves come up by his cheeks
A(1.35, "wiz", "release", { prop: "padW", dur: 0 });
for (const s of ["R", "L"]) c.arm(1.4, "wiz", s, { o: [0.05, 0.42, 0.34] }, 0.35, "inOut");
A(1.38, "wiz", "grip", { side: "both", shape: "open", dur: 0.2 });
sfx(1.48, "thud-soft", { gain: 0.35, reason: "the controller drops onto the cushion" });
sfx(1.48, "kenney/switch", { gain: 0.6, reason: "the controller's plastic clack on landing, over the thud so a phone speaker hears it" });
for (const id of ["tearL", "tearR"]) { c.prop(1.4, id, { on: 1 }, 0.1, "out"); c.prop(1.45, id, { fill: 1 }, 0.5, "linear"); }
line(1.65, "wiz", "No…", 0.5, "sad", CUT3, 470, 190);   // on the wall left of his hat, off his face
A(1.6, "wiz", "pitch", { to: 6, dur: 0.4 });
// beside him, Death's eyes slide to his scythe at the wall
A(1.75, "rea2", "look", { to: [-0.95, -0.1], dur: 0.2, blink: false });
A(1.95, "rea2", "turn", { to: -15, dur: 0.35 });
A(1.8, "rea2", "expr", { expr: "focused", set: { eye: 0.8 }, dur: 0.25 });
see(1.05, CUT3, ["wiz.face"], "the victim: the Wizard's face falls, the controller drops");

// ---------------------------------------------------------------- 3 DEAL'S OFF (2.4-3.7): medium (panel 3)
// the cut: Death is up in front of the sofa with the scythe (the scytheless twin goes; the parked scythe is in his hand
// now), his controller left on the table, the Wizard's still on the cushion; the tears dry
A(CUT3, "rea2", "release", { prop: "padR", to: PAD_R_TABLE, dur: 0 });
c.prop(CUT3, "padR", { x: PAD_R_TABLE[0], y: PAD_R_TABLE[1], z: PAD_R_TABLE[2], rot: 160 }, 0);
A(CUT3, "rea2", "ride", {}); A(CUT3, "rea2", "hide"); A(CUT3, "rea2", "move", { to: OFF[1], dur: 0, ease: "linear" });
c.at(CUT3, { do: "prop", id: "scyP", set: { y: -5 }, dur: 0, reason: "the scythe is in Death's hands for this shot (his twin holds it): the parked one waits out of sight" });
A(0, "rea", "noblink", { dur: CUT3 });   // the scythe twin waits off stage
sfx(CUT3, "sig-reaper", { gain: 0.25, reason: "Death up with his scythe: his low bell (the brief puts it on the scythe grab)" });
for (const id of ["tearL", "tearR"]) c.prop(CUT3, id, { on: 0 }, 0);
A(CUT3, "rea", "show"); A(CUT3, "rea", "move", { to: [REA_SEAT[0], REA_SEAT[2]], dur: 0, ease: "linear" });
A(CUT3, "rea", "ride", { prop: "sofaL", off: REA_UP, yaw: 60, dur: 0 });
c.arm(CUT3, "rea", "L", { o: [0.12, 0.42, 0.3] }, 0); A(CUT3, "rea", "grip", { side: "L", shape: "fist", dur: 0 });
A(CUT3, "rea", "expr", { expr: "angry", set: { eye: 0.85 }, dur: 0 }); A(CUT3, "rea", "look", { to: [0.55, 0.15], dur: 0, blink: false });
const SCY_HOLD = { o: [0.15, 0.5, 0.4] }, SCY_UP = { o: [0.15, 0.62, 0.4] };
c.arm(CUT3, "rea", "R", SCY_HOLD, 0); A(CUT3, "rea", "tilt", { to: [0, 0], dur: 0 });
// he raises the scythe upright, its blade curving over the Wizard (well above his hat), and leans in
c.arm(2.5, "rea", "R", SCY_UP, 0.35, "out"); A(2.5, "rea", "tilt", { to: [0, 0], dur: 0.35 });
sfx(2.52, "whoosh", { gain: 0.2, reason: "the scythe swings up" });
line(2.6, "rea", "Then it's time.", 0.6, "calm", HS1, 470, 470);
A(3.15, "rea", "lean", { to: 12, dur: 0.15, ease: "in" });
A(3.15, "rea", "tilt", { to: [35, 0], dur: 0.15, ease: "in" });   // the blade swings over the Wizard's hat (review A)
c.hitStop(HS1);
sfx(HS1, "shing", { gain: 0.35, reason: "the blade stops dead over the Wizard and gleams: shing! (the clang drowned on a phone)" });
// the Wizard shrinks back into the sofa, both empty hands up: "NOT YET!"
A(2.6, "wiz", "look", { to: [-0.7, 0.2], dur: 0.15, blink: false });
A(2.65, "wiz", "expr", { expr: "terrified", dur: 0.2 });
A(2.75, "wiz", "lean", { to: -8, dur: 0.3 });
for (const s of ["R", "L"]) c.arm(2.8, "wiz", s, { o: [0.16, 0.6, 0.3] }, 0.25, "out");
for (const s of ["R", "L"]) c.arm(3.5, "wiz", s, "lap", 0.2, "inOut");   // the hands sink once the blade has stopped
line(3.4, "wiz", "NOT YET!", 0.38, "scared", CUT4, 1275, undefined, undefined, 3.32);   // the shout just after the shing, so a phone hears both   // on the sofa front, under the knees
see(2.5, CUT4, ["rea", "wiz.face", "phx"], "panel 3: Death turns on the Wizard with the scythe; NOT YET!");

// ---------------------------------------------------------------- 4 JUST KIDDING (3.7-4.9): main shot (panel 4)
// the cut: Death back on the sofa, the scythe held low at his side; the Wizard's hands down, staring
A(CUT4, "rea", "ride", {}); A(CUT4, "rea", "hide"); A(CUT4, "rea", "move", { to: OFF[0], dur: 0, ease: "linear" });
c.prop(CUT4, "scyP", { y: SCY_AT[1] }, 0);
A(CUT4, "rea2", "show"); A(CUT4, "rea2", "move", { to: [REA_SEAT[0], REA_SEAT[2]], dur: 0, ease: "linear" }); A(CUT4, "rea2", "turn", { to: 0, dur: 0 });
A(CUT4, "rea2", "ride", { prop: "sofaL", off: SEAT(0), sit: true, yaw: 0, dur: 0 });
for (const s of ["R", "L"]) c.arm(CUT4, "rea2", s, "lap", 0);
A(CUT4, "rea2", "grip", { side: "both", shape: "relaxed", dur: 0 });
A(CUT4, "rea2", "expr", { expr: "shocked", set: { eye: 1.05, open: 0.1 }, dur: 0 }); A(CUT4, "rea2", "look", { to: [0.75, 0.1], dur: 0, blink: false });
A(r3(CUT4 - 0.01), "wiz", "lean", { to: 0, dur: 0 });   // just before the cut: at the cut itself it showed a frame late
A(CUT4, "wiz", "expr", { expr: "shocked", set: { eye: 1.15, open: 0.15 }, dur: 0 }); A(CUT4, "wiz", "look", { to: [0.7, 0.12], dur: 0, blink: false });
// Phoenix bursts out laughing, wings wide, and swipes the phone to the next card: a laughing face
A(3.82, "phx", "expr", { expr: "delighted", set: { open: 0.85, eye: 0.15, curve: 1.0 }, dur: 0.12 });
for (const [t, p] of [[3.85, -14], [4.1, 10], [4.35, -12], [4.6, 8], [4.85, 0]]) A(t, "phx", "pitch", { to: p, dur: 0.22, ease: "inOut" });
c.arm(3.85, "phx", "L", { o: [0.02, 0.4, 0.26] }, 0.35, "inOut");   // a glove on his belly
c.prop(3.9, "phone", { scroll: 1 }, 0.25, "inOut");
c.prop(4.15, "phone", { feed: 1, scroll: 0 }, 0);
line(4.05, "phx", "Ha ha, just kidding!!", 0.9, "excited", 5.0, SUB_WALL, 330, "Just kidding!!");
see(3.85, CUT5, ["phx.face", "phone", "wiz.face", "rea2.face"], "panel 4: just kidding: Phoenix howls, the others stare");

// ---------------------------------------------------------------- 5 THE TURN (4.9-6.4): the synced glare (panel 5)
A(4.92, "rea2", "look", { to: [0.9, 0.18], dur: 0.2, blink: false }); A(4.92, "wiz", "look", { to: [0.85, 0.15], dur: 0.2, blink: false });
act.mood(c, 4.95, "rea2", "angry", { strength: 1, hold: 1.3 });
act.mood(c, 4.95, "wiz", "annoyed", { strength: 1, hold: 1.3 });
A(5.25, "phx", "expr", { expr: "sad", set: { eye: 1.15, open: 0.15, curve: 0.15 }, dur: 0.25 });
A(5.25, "phx", "pitch", { to: 0, dur: 0.2 });
c.arm(5.3, "phx", "L", { o: [-0.05, 0.55, 0.3] }, 0.3, "inOut");
line(5.9, "phx", "…heh?", 0.4, "calm", CUT6, SUB_WALL, 250);
A(5.88, "phx", "pitch", { to: -6, dur: 0.2 });
// a sweat drop runs down the side of his head as the glare lands (panel 5)
c.prop(5.3, "sweat", { on: 1 }, 0.1, "out"); c.prop(5.35, "sweat", { fill: 1 }, 0.5, "linear"); c.prop(CUT6, "sweat", { on: 0, fill: 0 }, 0);
see(4.92, CUT6, ["rea2.face", "wiz.face", "phx.face"], "panel 5: the synced glare at Phoenix");

// ---------------------------------------------------------------- 6 THE NEW DATE (6.4-7.4): Death at the calendar (panel 6)
// the cut: the scythe back against the wall; Death up on the sofa's backrest at the calendar, the marker already out
c.at(CUT6, { do: "prop", id: "scyP", set: { y: -5 }, dur: 0, reason: "out of the two calendar shots: it would stand where Death's robe is" });
A(CUT6, "rea2", "ride", {}); A(CUT6, "rea2", "ride", { prop: "sofaL", off: REA_DRAW.off, yaw: REA_DRAW.yaw, dur: 0 });
for (const s of ["R", "L"]) c.arm(CUT6, "rea2", s, "rest", 0);
A(CUT6, "rea2", "expr", { expr: "deadpan", set: { eye: 0.75 }, dur: 0 }); A(CUT6, "rea2", "face", { lid: 0.4, dur: 0 });
A(CUT6, "rea2", "look", { to: [-0.3, 0.55], dur: 0, blink: false });
// the marker in his right glove, its felt tip a little off the page, then the cap pops and the strokes begin
const PEN0 = sk(0, -0.85, 0.05);
const pen = grips.thin(c, "rea2", { ...PEN, x: PEN0[0], y: PEN0[1], z: PEN0[2], tip: -70 }, { side: "L", from: 0.72, roll: 20 });
c.prop(CUT6, "pen", { x: PEN0[0], y: PEN0[1], z: PEN0[2], tip: -70, rot: 180 }, 0);
pen.secure(CUT6, 0);
sfx(6.85, "pop", { gain: 0.15, reason: "the marker's cap pops off" });
// the skull: the cranium's round, the jaw, the eyes, the teeth (the drawing follows the tip: rise), then the flame
const STROKES = [[7.0, [0, -0.85]], [7.12, [0.65, -0.45]], [7.24, [0.5, 0.25]], [7.36, [-0.5, 0.25]], [7.48, [-0.65, -0.45]], [7.58, [0, -0.8]],
  [7.68, [-0.4, 0.62]], [7.76, [0.4, 0.62]], [7.84, [-0.26, -0.08]], [7.9, [0.26, -0.08]], [7.96, [0, 0.5]]];
for (const [t, [x, y]] of STROKES) pen.carry(t, sk(x, y), 0.1, "inOut");
c.prop(7.0, "cal", { rise: 0.42 }, 0.62, "linear"); c.prop(7.62, "cal", { rise: 0.58 }, 0.16, "linear");
c.prop(7.78, "cal", { rise: 0.82 }, 0.16, "linear"); c.prop(7.94, "cal", { rise: 1 }, 0.08, "linear");
for (const t of [7.0, 7.62, 7.84]) sfx(t, "scribble", { gain: 0.5, reason: "the marker scratches the skull onto the page" });
pen.carry(7.99, sk(2.9, 0.4), 0.06, "inOut");   // the flame, drawn in the next cell (it read as part of the skull)
c.prop(7.99, "cal", { puff: 1 }, 0.08, "linear");
// the marker comes away down and left, off the page, so the skull and the flame are bare for the hit-stop
pen.carry(8.05, sk(-7, 9, 0.15), 0.12, "out");   // well clear of the circle: the glove covered its bottom
// Phoenix floats over to the calendar, his laugh gone; the Wizard watches from the sofa, smiling
// (each cut finds him somewhere new, as in the panels: up over the sofa's end in 6, right under the calendar in 7)
const PH_LOW = (p) => [r3(p.x - 0.32), r3(p.y + 0.12), r3(p.z + 0.26)];
ph.carry(CUT6, PH_LOW(PHX_AT), 0);
const PH_CAL = (p) => [r3(p.x - 0.48), r3(p.y + 0.05), r3(p.z - 0.19)];   // the phone down at his far side, under the calendar
A(CUT7, "phx", "fly", { to: PHX_CAL, dur: 0 }); ph.carry(CUT7, PH_CAL(PHX_CAL), 0); A(CUT7, "phx", "turn", { to: -50, dur: 0 });
A(CUT7, "phx", "look", { to: [-0.7, 0.75], dur: 0, blink: false });
// the Wizard is out of the close-up: he waits out of the room for the cut (he'd sit in Phoenix's way under the calendar)
A(CUT7, "wiz", "hide"); A(CUT8, "wiz", "show");
A(r3(CUT7 + 0.01), "phx", "hover", { dur: r3(CUT8 - CUT7 - 0.02) });
A(CUT6, "phx", "expr", { expr: "sad", set: { eye: 1.2, open: 0.1 }, dur: 0 });
A(6.5, "phx", "look", { to: [-0.6, 0.5], dur: 0.2, blink: false });
A(CUT6, "wiz", "expr", { expr: "smug", set: { curve: 0.5, eye: 1.0 }, dur: 0 }); A(CUT6, "wiz", "look", { to: [-0.6, 0.6], dur: 0, blink: false });
see(6.5, CUT7, ["rea2", "cal", "wiz.face"], "panel 6: Death at the calendar with the marker; the Wizard below");

// ---------------------------------------------------------------- 7 THE SKULL (7.4-8.4): the calendar close-up (panel 7)
A(7.45, "phx", "expr", { expr: "terrified", set: { open: 0.6, eye: 1.3 }, dur: 0.15 });
c.hitStop(HS2);
c.prop(r3(HS2 + 0.02), "smoke", { on: 1 }, 0.2, "out");
c.at(r3(HS2 + 0.02), { fx: "poof", pos: [r3(PHX_CAL.x + CRESTOFF[0]), r3(PHX_CAL.y + CRESTOFF[1] - 0.05), r3(PHX_CAL.z + CRESTOFF[2])], dur: 0.9, color: "#8a8790", puffs: 6, sparks: 0, size: 0.25, lift: 0.4 });
sfx(r3(HS2 + 0.02), "fizzle", { gain: 0.65, reason: "Phoenix's flame tips go out with a little pff" });
A(r3(HS2 + 0.05), "phx", "squash", { amount: 0.06, dur: 0.25 });
A(8.15, "rea2", "look", { to: [0.8, -0.2], dur: 0.2, blink: false });
A(8.2, "rea2", "expr", { expr: "smug", set: { eye: 0.65, curve: 0.25 }, dur: 0.2 });
see(7.45, CUT8, ["cal", "phx.face"], "panel 7: the skull and the flame on the day after launch; Phoenix's face");

// ---------------------------------------------------------------- 8 BACK TO THE GAME (8.4-9.8): main shot (panel 8)
// the cut: Death back on his seat with his controller, the Wizard with his, Phoenix back where he started, frozen,
// staring at the calendar with smoke rising off his crest; the menu music comes back
A(CUT8, "rea2", "release", { prop: "pen", to: [0, -5, 0], dur: 0 }); c.prop(CUT8, "pen", { x: 0, y: -5, z: 0 }, 0);
A(CUT8, "rea2", "ride", {});
c.prop(CUT8, "padR", { ...grips.placeFor("gamepad", PAD_LAP(REA_SEAT), 0) }, 0);
c.prop(CUT8, "padW2", { ...grips.placeFor("gamepad", PAD_LAP(WIZ_SEAT), 0) }, 0);
c.prop(CUT8, "scyP", { y: SCY_AT[1] }, 0);
A(CUT8, "wiz", "ride", {});
sitWithPad(CUT8, "rea2", "sofaL", PAD_R, 0); sitWithPad(CUT8, "wiz", "sofaR", PAD_W2, 0);
A(CUT8, "rea2", "look", { to: [0.1, -0.05], dur: 0, blink: false }); A(CUT8, "rea2", "expr", { expr: "smug", set: { eye: 0.7, curve: 0.3 }, dur: 0 });
A(CUT8, "wiz", "pitch", { to: 0, dur: 0 }); A(CUT8, "wiz", "look", { to: [-0.05, -0.05], dur: 0, blink: false }); A(CUT8, "wiz", "expr", { expr: "happy", set: { curve: 0.8, eye: 0.55 }, dur: 0 });
A(8.55, "wiz", "talk", { line: "heh heh", tone: "calm", dur: 0.45, voice: false });
A(CUT8, "phx", "fly", { to: PHX_AT, dur: 0 }); A(r3(CUT8 + 0.01), "phx", "hover", { dur: r3(END - CUT8 - 0.02) });
ph.carry(CUT8, [PHONE.x, PHONE.y, PHONE.z], 0);   // the phone back up where it started (the loop)
c.prop(CUT8, "smoke", { x: r3(PHX_AT.x + SMOKEOFF[0]), y: r3(PHX_AT.y + SMOKEOFF[1]), z: r3(PHX_AT.z + SMOKEOFF[2]) }, 0);
A(CUT8, "phx", "turn", { to: -30, dur: 0 }); A(CUT8, "phx", "look", { to: [-0.85, 0.45], dur: 0, blink: false }); A(CUT8, "phx", "expr", { expr: "terrified", set: { open: 0.3, eye: 1.25 }, dur: 0 });
c.arm(CUT8, "phx", "L", { o: [-0.05, 0.62, 0.3] }, 0);   // his frame-0 pose: the loop
A(9.2, "rea2", "pitch", { to: 3, dur: 0.3 });
see(CUT8, END, ["rea2.face", "wiz.face", "phx.face", "cal"], "panel 8: back to the game; Phoenix frozen, staring at his marked day");

// ---------------------------------------------------------------- shots: [name, start, camera, kind?]
const MAIN = { pos: [0.6, 1.75, 4.4], look: [0.6, 1.28, -0.9], fov: 48 };   // Phoenix's crest below Jonny's title band
// panel 2: the Wizard, hat and all, the controller falling below him, Death's hood at the left edge
const CU_WIZ = { pos: [0.35, 1.35, 1.9], look: [0.65, 1.3, -0.65], fov: 46 };
// panel 3: Death up on the cushion, the blade over the Wizard's head, Phoenix and his phone at the right
const MED3 = { pos: [0.55, 1.35, 3.2], look: [0.55, 1.2, -0.7], fov: 52 };
// panels 4-5: the wide, then a slow push in on the three as the joke turns (one shot, no cut on the glare)
const PUSH = { ...MAIN, to: { pos: [0.55, 1.65, 3.7], look: [0.5, 1.3, -0.7] }, dur: r3(CUT6 - CUT4), ease: "inOut" };
// panel 6 (mirrored, see PANELS.md): from the left of the Wizard, so his hat stays right of the calendar
const CAL6 = { pos: [0.6, 1.3, 2.2], look: [0.3, 1.6, -1.75], fov: 46, to: { pos: [0.56, 1.33, 2.0] }, dur: 1.0, ease: "inOut" };
// panel 7: the calendar big, Death's face at its left, Phoenix's face in the bottom right corner
const CU7 = { pos: [0.15, 1.45, 1.4], look: [0.08, 1.85, -1.75], fov: 38 };
const beats = c.beats([
  ["1 the news", 0, MAIN, "hook"],
  ["2 the drop", CUT2, CU_WIZ, "reaction"],
  ["3 deal's off", CUT3, MED3, "escalation"],
  ["4 just kidding", CUT4, PUSH, "reveal"],
  ["5 the turn", CUT5, "keep", "reaction"],
  ["6 the new date", CUT6, CAL6],
  ["7 the skull", CUT7, CU7, "payoff"],
  ["8 back to the game", CUT8, MAIN],
], END);

// contact the beats need, with its reason; the checks read these windows on the video's clock (after the hit-stops)
const HOLDS = c.hitStops.map((h) => ({ at: h.at, dur: h.frames / 30 }));
const rt = (t) => r3(t + HOLDS.filter((h) => t > h.at + 1e-9).reduce((a, h) => a + h.dur, 0));
const ALLOW = [
  { who: "wiz", with: "sofaR", from: 0, to: END, reason: "the Wizard sits on the sofa" },
  { who: "rea2", with: "sofaL", from: 0, to: CUT3, reason: "Death sits on the sofa" },
  { who: "rea", with: "sofaL", from: CUT3, to: CUT4, reason: "Death stands up on his cushion, scythe raised over the Wizard" },
  { who: "rea2", with: "sofaL", from: CUT4, to: CUT6, reason: "Death sits on the sofa" },
  { who: "rea2", with: "sofaL", from: CUT6, to: CUT8, reason: "Death stands on the sofa's backrest to reach the calendar" },
  { who: "rea2", with: "sofaL", from: CUT8, to: END, reason: "Death sits on the sofa" },
  { who: "wiz", with: "padW", from: 0, to: 1.6, reason: "the Wizard holds his controller until it slips out" },
  { who: "wiz", with: "padW2", from: CUT8, to: END, reason: "the Wizard holds his spare controller" },
  { who: "rea2", with: "padR", from: 0, to: CUT3, reason: "Death holds his controller" },
  { who: "rea2", with: "padR", from: CUT8, to: END, reason: "Death holds his controller" },
  { who: "phx", with: "phone", from: 0, to: END, reason: "Phoenix holds his phone" },
  { who: "rea2", with: "pen", from: CUT6, to: CUT8, reason: "Death holds the marker" },
  { who: "rea2", with: "cal", from: CUT6, to: CUT8, reason: "the marker's tip on the calendar's page as he draws" },
  { who: "rea2", from: 7.0, to: CUT8, checks: ["prop-pop"], reason: "eleven quick marker strokes in a second, drawn on twos (anime timing): the pen moves fast but never leaves the glove" },
].map((w) => ({ ...w, from: rt(w.from), to: rt(w.to) }));

write(import.meta.url, {
  id: "delayed-again",
  title: "Delayed AGAIN?!",
  idea: "Death waits for GTA 6, episode 2: Phoenix pranks the Wizard that the game is delayed; Death takes it seriously",
  fps: 30, look: "anime-pro", profile: "short", loop: true, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true, seed: 6202,
  motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING, loopIdle: true,
  set: { type: "apartment", dusk: true, windows: [WIN], print: false, light: "golden", grade: "warm", aperture: 0, lighting: LIGHTING, hatch: HATCH, life: "auto", cel: CEL },
  // the bed drops out on the blade's ring (the scythe stops dead, "NOT YET!") and is back for the laugh
  music: { style: "lofi", lowCut: 220, gain: 0.3, payoff: r3(CUT8 + 0.2), parts: [{ at: 0, part: "main" }, { at: HS1, part: "stop" }, { at: CUT4, part: "main" }, { at: CUT5, part: "stop" }, { at: 8.6, part: "main" }] },
  sound: { sfx: 0.6, ambience: 0.3, guard: true, surface: "wood", room: "room" },
  hook: { show: ["phx", "wiz", "rea2", "phone"], hint: 0, what: "Phoenix shoves his phone at the Wizard: delayed again; Death beside him" },
  creative: { length: [10, 10] },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: ALLOW,
  notes: "Generated by storyboards/series/gta6/02-delayed-again/make-delayed-again.mjs. Jonny's panels: PANELS.md.",
});
