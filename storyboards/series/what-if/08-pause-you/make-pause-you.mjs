// THERE'S A CATCH EP08: "What if your friend could pause YOU?" (13 Nov 2026), from the clip template.
//   node storyboards/series/what-if/08-pause-you/make-pause-you.mjs [--open B] -> pause-you.json (pause-you-b.json)
// Brief: BRIEF.md here (Jonny's own story, 13 Nov 06:47/06:49 Berlin); 16-panel Codex sheet: PANEL-PROMPT.md
// (the sheet itself is on Jonny's PC: codex-image-trial\out\pause-you-cookie-16-panels.png). Working memory: NOTES.md.
//
// THE BRIEF (~45 s; Reaper, Wizard; no narrator, no dialogue, title only on the cover)
//   Joke:        Wizard's magic remote pauses Reaper inches from the last cookie; Wizard takes it. Reaper learns the
//                rules (a thrown cushion keeps flying), then turns the power round with a mirror-bright tray.
//   Wants:       both want the last cookie.
//   Consequence: the cheater is paused by his own ray; the winner shares.
//   Ending:      Wizard thinks about one more trick, Reaper tilts the tray, Wizard lowers the remote; cookie halves tap.
//   Callback:    frame 0 the reach for one cookie; the last frame the cookie shared.
// Openings (BRIEF "Opening comparison"): A (default) freezes the already-reaching hand at once; B (--open B) shows ~1 s
// of the hand approaching first. Everything after the freeze is the same film, shifted by O.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { SOFA } from "../../../../engine/page/props-sofa.js";

const OPEN = process.argv.includes("--open") ? process.argv[process.argv.indexOf("--open") + 1] : "A";
const O = OPEN === "B" ? 1.0 : 0;                    // opening B: one more second of the reach before the first freeze
const T = (t) => r3(t + O);                          // story time -> clip time (opening B shifts everything after 0)

const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: { props: false }, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const END = T(45.0);

// ---------------------------------------------------------------- places (x right, z toward the camera)
const WZ = -1.75, S = 1.1, HW = r3(SOFA.half * S), D = r3(SOFA.d * S);
// the two face each other across the table, each turned 35 deg toward the other and toward the front camera, so both
// faces stay at 3/4 (payoff-face) and the tray sits on the line between them: from over Reaper's shoulder the flat tray
// shows the Wizard (the eye, the tray and his face on one line; DESIGN section 4)
const SROT = 35, ax = [r3(Math.cos(SROT * Math.PI / 180)), r3(-Math.sin(SROT * Math.PI / 180))];   // the sofa's own x axis
const R0 = [-0.55, -0.88], L0 = [r3(R0[0] - ax[0] * HW), r3(R0[1] - ax[1] * HW)];   // the right half by the table
const ALONG = 0.12, REA_SEAT = [r3(R0[0] + ax[0] * ALONG * S), r3(R0[1] + ax[1] * ALONG * S)];
const TABLE = { x: 0.12, z: -0.4, w: 0.72, d: 0.44, h: 0.42 };       // between them, in reach of both
const CHAIR = [0.82, -0.7], CHAIR_ROT = -50;                         // the Wizard's armchair across from Reaper
const TRAY = { k: 1.2, x: 0.1, z: -0.5, y: TABLE.h };   // scale 1.2 (0.43 across the rim): room for the plate AND the reflected face            // the silver tray (Fable: DESIGN.md section 4)
// the plate sits off the tray centre, toward the back left: the Wizard's reflection (the 16 s insert) shows on the
// mirror's front right, clear of the plate and the cookie
const PLATE_ON_TRAY = [r3(TRAY.x - 0.09), r3(TABLE.h + 0.012), r3(TRAY.z - 0.07)], PLATE_K = 0.7;
const PLATE_OFF = [0.06, TABLE.h, -0.28];                            // where Reaper slides the plate (20 s): the front middle, in reach of both
const COOKIE_ON = (p) => [p[0], r3(p[1] + 0.02 + 0.013), p[2]];
const CUSH_AT = [r3(REA_SEAT[0] - ax[0] * 0.45), 0.54, r3(REA_SEAT[1] - ax[1] * 0.45 + 0.06)];   // the cushion on the seat at his right
const WIN = [-1.95, -1.08];

// the remote in the Wizard's right glove, its lens (REMOTE.tip, 0.282 ahead of the fist) aimed at Reaper's chest
const REM = [0.35, 0.88, -0.55];
const REA_CHEST = [r3(REA_SEAT[0] + 0.05), 0.85, r3(REA_SEAT[1] + 0.2)];
const WIZ_CHEST = [0.6, 0.78, -0.53];   // under his eyes (layout: 0.53, 1.0, -0.49), a little back
const REM_ROT = r3((Math.atan2(-(REA_CHEST[0] - REM[0]), -(REA_CHEST[2] - REM[2])) * 180) / Math.PI);
const TIP = [r3(REM[0] - Math.sin(REM_ROT * Math.PI / 180) * 0.282), REM[1], r3(REM[2] - Math.cos(REM_ROT * Math.PI / 180) * 0.282)];
// the shield: the tray stood on its rim across the ray's line, 40% of the way from the lens to Reaper's chest, its
// mirror turned half way between the lens and the Wizard's chest (a true reflection: in at the lens, out at him).
// tip leans the mirror (+y) toward +z, rot turns it about y (props3d.js: rotation YXZ), so the mirror normal is
// (sin rot sin tip, cos tip, cos rot sin tip)
const sub = (a, b) => a.map((v, i) => v - b[i]), unit = (v) => { const n = Math.hypot(...v); return v.map((x) => x / n); };
const SH = TIP.map((v, i) => r3(v + 0.35 * (REA_CHEST[i] - v)));
const NRM = unit(unit(sub(TIP, SH)).map((v, i) => v + unit(sub(WIZ_CHEST, SH))[i]));
const SHROT = r3((Math.atan2(NRM[0], NRM[2]) * 180) / Math.PI), SHTIP = r3((Math.acos(NRM[1]) * 180) / Math.PI);
const BOUNCE = SH.map((v, i) => r3(v + NRM[i] * 0.012));   // the mirror face, where the ray turns
if (process.env.SHOW) console.log({ TIP, SH, SHROT, SHTIP, BOUNCE, REM_ROT });
const cast = [
  { id: "rea", character: "notyet/reaper-noscythe", at: REA_SEAT, face: SROT, expr: "focused", follow: 0.2, seed: 3.3 },
  { id: "wiz", character: "notyet/wizard-nostaff", at: CHAIR, face: CHAIR_ROT, expr: "smug", follow: 0.25, seed: 2.6 },
];
const props = [
  { id: "sofaL", kind: "sofahalf", side: "L", x: L0[0], z: L0[1], rot: SROT, scale: S, color: "#5a8a5e", color2: "#6c9d70", color3: "#46704a" },
  { id: "sofaR", kind: "sofahalf", side: "R", x: R0[0], z: R0[1], rot: SROT, scale: S, color: "#5a8a5e", color2: "#6c9d70", color3: "#46704a" },
  { id: "chair", kind: "redarmchair", x: CHAIR[0], z: CHAIR[1], rot: CHAIR_ROT },
  { id: "table", kind: "coffeetable", x: TABLE.x, z: TABLE.z, w: TABLE.w, d: TABLE.d, h: TABLE.h, color: "#9a6a3e", leg: "#7a5230", legW: 0.06, bevel: 0.012 },
  { id: "rug", kind: "rug", x: TABLE.x, z: TABLE.z, w: 2.6, d: 1.8, pattern: "quiet" },
  // placeholders until T2 lands (props-pauseyou.js): tray, remote, ray
  { id: "tray", kind: "silvertray", x: TRAY.x, y: TRAY.y, z: TRAY.z, scale: TRAY.k, rot: SHROT, tip: 0, res: 1024, staged: "moved by its own tweens; the gloves are posed on its handles" },
  { id: "plate", kind: "dessertplate", x: PLATE_ON_TRAY[0], y: PLATE_ON_TRAY[1], z: PLATE_ON_TRAY[2], scale: PLATE_K },
  { id: "halfL", kind: "cookiehalf", side: "L", x: 0, y: -5, z: 0, scale: 1.25, staged: "the Wizard's half, out of sight until the snap" },
  { id: "halfR", kind: "cookiehalf", side: "R", x: 0, y: -5, z: 1, scale: 1.25, staged: "Reaper's half, out of sight until the snap" },
  { id: "cookie", kind: "chunkcookie", x: PLATE_ON_TRAY[0], y: COOKIE_ON(PLATE_ON_TRAY)[1], z: PLATE_ON_TRAY[2], scale: 1.25, staged: "moved by tweens while the Wizard has it; the gloves are posed on it" },
  { id: "cush", kind: "pillow", x: CUSH_AT[0], y: CUSH_AT[1], z: CUSH_AT[2], scale: 0.9, color: "#e9c46a", body: { bounce: 0 } },
  { id: "remote", kind: "magicremote", x: REM[0], y: REM[1], z: REM[2], rot: REM_ROT, tip: 0 },
  { id: "clutter", kind: "clutter", x: 0, y: 0, z: 0, items: [[0.42, r3(TABLE.z - 0.18), "mug", 30, TABLE.h], [-1.9, 0.2, "books", 20], [1.9, -0.6, "slippers", 15]] },
  { id: "floorlamp", kind: "floorlamp", x: -1.75, z: r3(WZ + 0.34) },
  { id: "shelf", kind: "wallshelf", x: 0.6, y: 2.4, z: r3(WZ + 0.005), staged: "screwed to the wall" },
  { id: "art1", kind: "wallart", x: -0.75, y: 1.95, z: r3(WZ + 0.02), w: 0.5, h: 0.36, scene: "hills", frame: "#8a6a42", staged: "hangs on the wall" },
  { id: "dust", kind: "dustmotes", x: 0, y: 0, z: -0.3, box: [3.6, 2.2, 2.8], n: 80, seed: 8 },
];

// ---------------------------------------------------------------- helpers
const look = (t, who, to, dur = 0.2) => A(t, who, "look", { to, dur, blink: false });
const expr = (t, who, e, set = {}, dur = 0.2) => A(t, who, "expr", { expr: e, set, dur });
// the remote's tip in the Wizard's left glove: where the ray starts (placeholder: measured from the layout later)
// the ray: a beam from a to b, grown over `grow` s, held, faded (placeholder lightbeam: origin at a, along local -z)
// the ray (props-pauseyou.js pauseray, DESIGN 2): one prop per shot, from the remote's lens to just in front of the body
// it hits, optionally bounced off the tray (via). Grows in 3 frames, holds 8, fades 6; the hit disc and the bounce glint.
const rays = [];
const surf = (from, chest, r = 0.3) => { const d = [from[0] - chest[0], 0, from[2] - chest[2]], n = Math.hypot(d[0], d[2]); return [r3(chest[0] + (d[0] / n) * r), chest[1], r3(chest[2] + (d[2] / n) * r)]; };
function ray(t, a, b, { via = null, grow = 0.1, hold = 0.27, fade = 0.2 } = {}) {
  const id = `ray${rays.length + 1}`, off = (q) => [r3(q[0] - a[0]), r3(q[1] - a[1]), r3(q[2] - a[2])];
  rays.push({ id, kind: "pauseray", x: a[0], y: a[1], z: a[2], to: off(b), ...(via && { via: off(via) }), glow: 1, rise: 0, hit: 0, glint: 0, staged: "the remote's ray: light, nothing holds it" });
  c.prop(0, id, { rise: 0, hit: 0, glint: 0 }, 0, "linear");
  c.prop(t, id, { rise: 1 }, grow, "linear");
  if (via) { const L1 = Math.hypot(...off(via)), L2 = Math.hypot(b[0] - via[0], b[1] - via[1], b[2] - via[2]), tv = r3(t + (grow * L1) / (L1 + L2));
    c.prop(tv, id, { glint: 1 }, 0.067, "out"); c.prop(r3(t + grow + hold), id, { glint: 0 }, fade, "in"); }
  c.prop(r3(t + grow), id, { hit: 1 }, 0.067, "out");
  c.prop(r3(t + grow + hold), id, { glow: 0, hit: 0 }, fade, "in");
  return r3(t + grow);   // the hit
}
// the press: the button sinks and the lens lights while the ray is on
c.prop(0, "remote", { press: 0, lit: 0 }, 0, "linear");
const press = (t, len = 0.45) => { c.prop(r3(t - 0.067), "remote", { press: 1, lit: 1 }, 0.067, "out"); c.prop(r3(t + len), "remote", { press: 0, lit: 0 }, 0.1, "in"); };
const click = (t) => sfx(t, "ai/key-press", { gain: 0.4 });   // real: a small plastic tactile button (T3 sound pick)
const PAUSES = [];

// ---------------------------------------------------------------- 0-3 THE REACH (panels 01-03)
A(0, "rea", "sit", { seat: "sofaR", dur: 0.01, hands: "keep", along: ALONG });
A(0, "wiz", "sit", { seat: "chair", dur: 0.01, hands: "keep" });
const COOKIE0 = COOKIE_ON(PLATE_ON_TRAY);
const REACH = { world: [r3(COOKIE0[0] - 0.2), r3(COOKIE0[1] + 0.12), r3(COOKIE0[2] + 0.02)] };   // a few cm short of it, above the plate
A(0, "rea", "turn", { to: 45, dur: 0.01 });
if (O) { c.arm(0, "rea", "R", "lap", 0); c.arm(0.2, "rea", "R", REACH, r3(O + 0.2), "inOut"); }
else c.arm(0, "rea", "R", REACH, 0);
A(0, "rea", "lean", { to: 0.18, dur: 0.01 });
c.arm(0, "rea", "L", "lap", 0);
look(0, "rea", [0.35, -0.6], 0.01); expr(0, "rea", "eager", { eye: 1.1 }, 0.01);
// the Wizard: remote in his RIGHT glove (the hand on Reaper's side in this staging; DESIGN 1 said left), aimed at Reaper
c.arm(0, "wiz", "R", { prop: "remote", grip: [0, 0, 0], palm: true }, 0); A(0, "wiz", "grip", { side: "R", shape: "hold", dur: 0 });
A(0, "wiz", "grab", { prop: "remote", hand: "R", grip: [0, 0, 0], dur: 0, pose: null, keep: true });
c.arm(0, "wiz", "L", "lap", 0);
look(0, "wiz", [-0.8, -0.1], 0.01); expr(0, "wiz", "smug", { curve: 0.4, eye: 0.85 }, 0.01);
// 0.35 click, ray, Reaper freezes inches from the cookie
const F1 = T(0.35);
A(r3(F1 - 0.05), "wiz", "grip", { side: "R", shape: "press", dur: 0.05 }); click(F1);
press(F1); const HIT1 = ray(F1, TIP, surf(TIP, REA_CHEST));
PAUSES.push({ from: HIT1, to: T(3.4), keep: ["wiz"], world: false, look: "frozen", hit: REA_CHEST });
// 1.2-2.2 the Wizard picks the cookie up past the frozen hand, 2.2-3.0 holds it up beside his face
const COOKIE_UP = [0.78, 1.05, -0.25];   // in front of his left shoulder: beside his face on screen, clear of his body
look(T(1.1), "wiz", [-0.5, -0.45], 0.2);
// the cookie is moved by its own tweens while he has it, his glove posed on it (physics let it bounce off the cushion)
const onK = { prop: "cookie", grip: [0.07, 0.08, 0], palm: true };   // the glove on top of its rim, not sunk in it
c.arm(T(1.25), "wiz", "L", { ...onK, off: [0.03, 0.08, 0.02] }, 0.45, "inOut");   // over it first, then down onto it
c.arm(T(1.7), "wiz", "L", onK, 0.14, "out"); A(T(1.74), "wiz", "grip", { side: "L", shape: "hold", dur: 0.1 });
c.prop(T(1.85), "cookie", { y: r3(COOKIE0[1] + 0.06) }, 0.15, "out");
c.prop(T(2.0), "cookie", { x: r3(COOKIE_UP[0] - 0.09), y: COOKIE_UP[1], z: COOKIE_UP[2] }, 0.5, "inOut");
look(T(2.3), "wiz", [-0.85, 0.05], 0.2); expr(T(2.3), "wiz", "smug", { curve: 0.7, eye: 0.6 }, 0.2);
see(0, T(3.0), ["rea.face", "wiz.face", "cookie", "remote"], "the reach, the remote, the cookie: the unfair power at frame 0");

// ---------------------------------------------------------------- 3-7 THE PROVOCATION (panels 03-04)
// 3.4 he releases Reaper to show off; the reach completes into empty air
A(T(3.3), "wiz", "grip", { side: "R", shape: "press", dur: 0.05 }); click(T(3.35));
press(T(3.35)); ray(T(3.35), TIP, surf(TIP, REA_CHEST));
c.arm(T(3.45), "rea", "R", { world: [REACH.world[0] + 0.03, REACH.world[1] - 0.02, REACH.world[2]] }, 0.2, "out");
A(T(3.5), "rea", "grip", { side: "R", shape: "fist", dur: 0.12 });
look(T(3.75), "rea", [0.35, -0.65], 0.12); expr(T(3.8), "rea", "shocked", { eye: 1.2, open: 0.1 }, 0.15);
look(T(4.5), "rea", [0.8, 0.0], 0.2); expr(T(4.6), "rea", "annoyed", { eye: 0.8 }, 0.25);
A(T(4.6), "rea", "lean", { to: 0, dur: 0.4 }); c.arm(T(4.6), "rea", "R", "lap", 0.45, "inOut"); A(T(4.7), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
c.prop(T(4.0), "cookie", { x: r3(COOKIE_UP[0] - 0.07), y: r3(COOKIE_UP[1] + 0.04) }, 0.4, "inOut");   // a little wave of the prize
look(T(5.6), "rea", [-0.7, -0.35], 0.15);   // eyes first: the cushion beside him
expr(T(5.8), "rea", "focused", { eye: 0.75 }, 0.2);
see(T(3.4), T(7.0), ["rea.face", "wiz.face", "cookie"], "the empty grab, the prize waved, Reaper finds the cushion");

// ---------------------------------------------------------------- 7-15 THE FIRST PAYOFF (panels 05-08)
// the cushion is flown by its own tweens from the pick-up on (his right glove posed on it, like the tray): a physics
// throw started inside Reaper's own body capsule and bounced back off his hood (two rounds, workflow rule 5)
A(T(6.6), "rea", "turn", { to: 25, dur: 0.3 });
const onC = { prop: "cush", grip: [0.13, 0, 0], palm: true };
c.arm(T(6.6), "rea", "R", onC, 0.4, "inOut"); A(T(6.9), "rea", "grip", { side: "R", shape: "hold", dur: 0.08 });
const WINDUP = [-0.9, 0.95, -0.55], SWING = [-0.35, 1.0, -0.22], THROW = T(7.65), HIT_W = T(8.2);
const CUSH_HIT = [0.36, 0.9, -0.34];   // just in front of his face and chest (eyes 0.53, 1.0, -0.49), under the brim
const CUSH_REL = [0.12, 1.06, -0.38], CUSH_MID = [r3((CUSH_REL[0] + CUSH_HIT[0]) / 2), r3(Math.max(CUSH_REL[1], CUSH_HIT[1]) + 0.06), r3((CUSH_REL[2] + CUSH_HIT[2]) / 2)];
c.prop(T(7.05), "cush", { x: WINDUP[0], y: WINDUP[1], z: WINDUP[2] }, 0.35, "inOut");   // wind-up at his right side: a side-arm swing
A(T(7.1), "rea", "turn", { to: 45, dur: 0.3 });
look(T(7.1), "rea", [0.85, 0.1], 0.15); expr(T(7.2), "rea", "angry", { eye: 0.8 }, 0.15);
c.prop(T(7.42), "cush", { x: SWING[0], y: SWING[1], z: SWING[2] }, 0.12, "in");   // round in front of him, clear of his hood
c.prop(T(7.54), "cush", { x: CUSH_REL[0], y: CUSH_REL[1], z: CUSH_REL[2] }, r3(THROW - T(7.54)), "linear");   // the throw
c.prop(THROW, "cush", { x: CUSH_MID[0], y: CUSH_MID[1], z: CUSH_MID[2] }, r3((HIT_W - THROW) / 2), "linear");
c.prop(r3(THROW + (HIT_W - THROW) / 2), "cush", { x: CUSH_HIT[0], y: CUSH_HIT[1], z: CUSH_HIT[2] }, r3((HIT_W - THROW) / 2), "in");
A(THROW, "rea", "grip", { side: "R", shape: "open", dur: 0.06 });
// in the swing the glove leads the cushion as a world point (aimed at the flying cushion it flipped at the release)
c.arm(T(7.42), "rea", "R", { world: [r3(SWING[0] - 0.1), SWING[1], r3(SWING[2] - 0.04)] }, 0.12, "in");
c.arm(T(7.54), "rea", "R", { world: [r3(CUSH_REL[0] - 0.1), CUSH_REL[1], r3(CUSH_REL[2] - 0.04)] }, r3(THROW - T(7.54)), "linear");
c.arm(THROW, "rea", "R", { world: [0.0, 0.8, -0.36] }, 0.3, "out");   // the follow-through, frozen there at F2   // the follow-through, frozen there at F2
// he freezes Reaper in the follow-through, clearly after the release
const F2 = T(7.85);
look(T(7.5), "wiz", [-0.85, 0.0], 0.1); expr(T(7.5), "wiz", "shocked", { eye: 1.2 }, 0.1);
A(r3(F2 - 0.05), "wiz", "grip", { side: "R", shape: "press", dur: 0.05 }); click(F2);
press(F2); const HIT2 = ray(F2, TIP, surf(TIP, REA_CHEST));
PAUSES.push({ from: HIT2, to: T(15.2), keep: ["wiz"], world: false, look: "frozen", hit: REA_CHEST });
expr(T(7.95), "wiz", "smug", { curve: 0.6, eye: 0.7 }, 0.12);   // smiles too early
// the cushion lands on him; the cookie jumps out of his glove onto its plate
sfx(HIT_W, "ai/cushion-poof", { gain: 0.5 });
expr(HIT_W, "wiz", "shocked", { eye: 0.2, open: 0.15 }, 0.06);
// it jumps out of his glove, over the cushion, and drops onto its plate (staged by tweens)
c.prop(r3(HIT_W + 0.03), "cookie", { x: 0.4, y: 1.22, z: -0.42 }, 0.18, "out");
c.prop(r3(HIT_W + 0.21), "cookie", { x: COOKIE0[0], y: COOKIE0[1], z: COOKIE0[2] }, 0.27, "in");
c.prop(r3(HIT_W + 0.48), "cookie", { squash: 0.05 }, 0.05, "out"); c.prop(r3(HIT_W + 0.53), "cookie", { squash: 0 }, 0.15, "settle");
sfx(r3(HIT_W + 0.48), "tink", { gain: 0.3 });   // the cookie on the plate (T3: a small ceramic tap)
// his free glove catches the cushion on his face (the cookie has just left it) and holds it there a beat
c.arm(r3(HIT_W + 0.03), "wiz", "L", { world: [r3(CUSH_HIT[0] + 0.04), CUSH_HIT[1], r3(CUSH_HIT[2] + 0.08)] }, 0.12, "out");
A(r3(HIT_W + 0.13), "wiz", "grab", { prop: "cush", hand: "L", dur: 0, pose: null, keep: true });
expr(T(9.6), "wiz", "annoyed", { eye: 0.85 }, 0.3); look(T(9.6), "wiz", [-0.4, -0.45], 0.25);   // the cookie, back on its plate
see(T(7.5), T(10.0), ["wiz.face", "cush", "cookie"], "the cushion keeps flying through the freeze and knocks the cookie home");
// 10.2 he pulls it down off his face (annoyed), 12.6 drops it on the floor beside his chair
c.arm(T(10.2), "wiz", "L", { world: [0.5, 0.66, -0.3] }, 0.5, "inOut");
c.arm(T(12.55), "wiz", "L", { world: [1.25, 0.42, 0.08] }, 0.6, "inOut");   // down beside the chair (a thrown cushion bounced back onto the table)
A(T(13.15), "wiz", "release", { prop: "cush", dur: 0 });   // it drops the last bit to the floor
c.arm(T(13.25), "wiz", "L", "lap", 0.55, "inOut");
look(T(13.6), "wiz", [-0.85, 0.0], 0.2); expr(T(13.6), "wiz", "stern", { eye: 0.85 }, 0.2);   // now it's a contest

// ---------------------------------------------------------------- 15-20 THE OBSERVATION (panels 09-10)
const R2 = T(15.2);
A(r3(R2 - 0.1), "wiz", "grip", { side: "R", shape: "press", dur: 0.05 }); click(r3(R2 - 0.05));
press(r3(R2 - 0.05)); ray(r3(R2 - 0.05), TIP, surf(TIP, REA_CHEST));
c.arm(r3(R2 + 0.05), "rea", "L", "lap", 0.45, "inOut"); c.arm(r3(R2 + 0.05), "rea", "R", "lap", 0.45, "inOut"); A(r3(R2 + 0.1), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.2 }); A(r3(R2 + 0.05), "rea", "turn", { to: 10, dur: 0.4 });
expr(r3(R2 + 0.1), "rea", "annoyed", { eye: 0.85 }, 0.2);
look(T(16.0), "rea", [0.3, -0.65], 0.2);   // down at the tray
expr(T(17.6), "rea", "focused", { eye: 0.7 }, 0.15);   // the idea: a restrained eye change
see(T(16.0), T(18.6), ["tray", "rea.face"], "Reaper sees the Wizard in the tray");

// ---------------------------------------------------------------- 20-26 THE REVERSAL (panels 11-13)
// he turns to the table (the reaches stay on their own side of his body) and slides the plate off the tray
A(T(19.3), "rea", "turn", { to: 60, dur: 0.35 });
const PL = (p, dy = 0.085, dz = 0.1) => ({ world: [r3(p[0] - 0.03), r3(TABLE.h + dy), r3(p[2] + dz)] });
c.arm(T(19.6), "rea", "R", PL(PLATE_ON_TRAY), 0.4, "inOut");
A(T(20.0), "rea", "grab", { prop: "plate", hand: "R", grip: [0, 0.01, 0.1], dur: 0.1, pose: null });
A(T(20.05), "rea", "grab", { prop: "cookie", hand: "R", grip: [0, 0.03, 0.1], dur: 0.1, pose: null });
c.arm(T(20.1), "rea", "R", PL(PLATE_OFF), 0.5, "inOut");
A(T(20.65), "rea", "release", { prop: "plate", to: PLATE_OFF, dur: 0 });
A(T(20.65), "rea", "release", { prop: "cookie", to: COOKIE_ON(PLATE_OFF), dur: 0 });
c.arm(T(20.75), "rea", "R", "lap", 0.35, "inOut");
// he takes the tray by its far handle and draws it to his edge of the table, then the near handle too. The tray moves
// by its own tweens (it is not grabbed); the gloves are posed on its handles, which the arm poses follow every frame
const HL = [-0.218, 0.012, 0], HR = [0.218, 0.012, 0];   // props-tray.js TRAY_GRIPS.silvertray (rot SHROT: HL near the camera)
const RIM = { prop: "tray", grip: [0, -0.03, 0.2], palm: true };   // stood up: the rim's bottom, from behind
const onH = (g, up = 0.035) => ({ prop: "tray", grip: [g[0], r3(g[1] + up), g[2]], palm: true });   // up: along the mirror normal (flat: above; stood up: -0.03 = behind it)
const PULL = [-0.06, TABLE.h, -0.56];
c.arm(T(20.9), "rea", "L", { prop: "tray", grip: [HR[0], 0.1, HR[2]] }, 0.28, "inOut"); c.arm(T(21.06), "rea", "L", onH(HR), 0.2, "out");   // over it, then the palm onto it A(T(21.2), "rea", "grip", { side: "L", shape: "hold", dur: 0.08 });
c.prop(T(21.3), "tray", { x: PULL[0], z: PULL[2] }, 0.4, "inOut");
sfx(T(21.3), "ai/cookie-scrape", { gain: 0.15 });   // metal over wood (a real scrape)
c.prop(T(21.72), "tray", { y: 0.55 }, 0.3, "inOut");   // lifted, held low and flat: ready
c.arm(T(21.8), "rea", "R", { prop: "tray", grip: [HL[0], 0.12, HL[2]] }, 0.22, "inOut"); c.arm(T(21.98), "rea", "R", onH(HL), 0.14, "out"); A(T(22.1), "rea", "grip", { side: "R", shape: "hold", dur: 0.08 });
// (lifted by the far handle before the near glove comes: a glove closing on a handle that lies on the table goes into it)
// departure: he leans in on the sofa's edge instead of standing and stepping over (no room between sofa, table and chair
// in a 9:16 two-shot: standing put him in the sofa and the chair)
A(T(21.7), "rea", "lean", { to: 0.22, dur: 0.4 });
look(T(22.2), "rea", [0.6, 0.05], 0.2);
look(T(22.9), "wiz", [-0.6, 0.0], 0.15); expr(T(23.0), "wiz", "cocky", { eye: 0.8 }, 0.15);
// he swings the tray up on its rim across the ray's line just in time; the ray bounces back onto the Wizard
const SHIELD = T(23.6), F3 = T(23.9);
c.prop(SHIELD, "tray", { x: SH[0], y: SH[1], z: SH[2], tip: SHTIP }, 0.3, "inOut");   // a swing over 9 frames: faster jumped the gloves
c.arm(SHIELD, "rea", "R", RIM, 0.3, "inOut"); A(r3(SHIELD - 0.05), "rea", "grip", { side: "L", shape: "relaxed", dur: 0.1 }); c.arm(r3(SHIELD - 0.02), "rea", "L", "lap", 0.5, "inOut");
A(r3(F3 - 0.05), "wiz", "grip", { side: "R", shape: "press", dur: 0.05 }); click(F3);
press(F3); ray(F3, TIP, surf(BOUNCE, WIZ_CHEST, 0.12), { via: BOUNCE, grow: 0.2 });
const HIT3 = r3(F3 + 0.2);
PAUSES.push({ from: HIT3, to: T(37.2), keep: ["rea"], world: false, look: "frozen", hit: WIZ_CHEST });
expr(r3(HIT3 - 0.04), "wiz", "smug", { curve: 0.75, eye: 0.75 }, 0.03);   // frozen in his own triumphant pose
look(T(24.4), "rea", [0.55, 0.15], 0.15);   // peeks over the rim
see(T(23.6), T(25.5), ["wiz.face", "tray", "remote"], "remote, tray and the return path in one view");

// ---------------------------------------------------------------- 26-32 THE CHOICE (panel 14)
// he lowers the tray back onto the table, sees the frozen face
const TRAY_DOWN = [-0.07, TABLE.h, -0.54], DOWNROT = 21;   // turned so the near handle sticks out past the table's left edge (a glove can close on it)
c.prop(T(25.4), "tray", { x: TRAY_DOWN[0], y: TRAY_DOWN[1], z: TRAY_DOWN[2], tip: 0, rot: DOWNROT }, 0.45, "inOut");
c.arm(T(25.4), "rea", "R", onH(HL, 0.08), 0.45, "inOut"); // one hand sets it down
sfx(T(25.85), "tink", { gain: 0.15 });   // the tray set down (sound pick: a soft metal-on-wood set-down)
A(T(25.9), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.15 }); A(T(25.9), "rea", "grip", { side: "L", shape: "relaxed", dur: 0.15 });
c.arm(T(25.95), "rea", "R", "lap", 0.5, "inOut");
A(T(26.0), "rea", "turn", { to: 45, dur: 0.4 });
look(T(26.0), "rea", [0.5, 0.05], 0.2); expr(T(26.2), "rea", "smug", { curve: 0.3, eye: 0.85 }, 0.2);
c.arm(T(27.0), "rea", "R", { world: [r3(PLATE_OFF[0] - 0.08), r3(TABLE.h + 0.12), PLATE_OFF[2]] }, 0.45, "inOut");
A(T(27.5), "rea", "grab", { prop: "cookie", hand: "R", grip: [-0.12, 0, 0], dur: 0.1, pose: null });
const MOUTH = { world: [-0.04, 0.84, -0.44] };   // in front of his mouth (layout: -0.19, 0.93, -0.66), toward the Wizard
c.arm(T(27.7), "rea", "R", MOUTH, 0.5, "inOut");   // toward his mouth
look(T(28.0), "rea", [0.0, -0.3], 0.2);
look(T(28.9), "rea", [0.6, 0.05], 0.25); expr(T(29.0), "rea", "sad", { eye: 0.9 }, 0.3);   // he looks at his friend
look(T(30.4), "rea", [0.0, -0.3], 0.2); expr(T(30.5), "rea", "kind", { eye: 0.9 }, 0.3);

// ---------------------------------------------------------------- 32-40 SHARING AND THE RELEASE (panels 14-15)
// he breaks it: the whole cookie goes, the two halves (props-pauseyou.js cookiehalf) take its place in his two gloves
// (a grab puts each half on its glove, wherever it was waiting)
const SNAP = T(32.6);
c.arm(T(32.0), "rea", "L", { world: [-0.02, 0.9, -0.6] }, 0.35, "inOut");
A(T(32.3), "rea", "grip", { side: "L", shape: "pinch", dur: 0.08 });
A(r3(SNAP - 0.02), "rea", "release", { prop: "cookie", to: [0, -5, 0], dur: 0 });   // gone: it becomes the two halves
A(SNAP, "rea", "grab", { prop: "halfR", hand: "R", grip: [-0.075, 0, 0], dur: 0, pose: null });
A(SNAP, "rea", "grab", { prop: "halfL", hand: "L", grip: [-0.075, 0, 0], dur: 0, pose: null });
c.arm(SNAP, "rea", "R", { o: [0.12, 0.6, 0.24] }, 0.12, "out"); c.arm(SNAP, "rea", "L", { o: [0.12, 0.6, 0.24] }, 0.12, "out");   // the halves part
sfx(SNAP, "ai/crunch", { gain: 0.3 });   // the snap (sound pick: a real dry biscuit crack)
// the Wizard's half onto the plate (left glove), his own onto the table's front corner (right glove)
A(T(32.8), "rea", "turn", { to: 35, dur: 0.3 });
c.arm(T(33.1), "rea", "L", { world: [r3(PLATE_OFF[0] - 0.02), r3(TABLE.h + 0.14), PLATE_OFF[2]] }, 0.5, "inOut");
A(T(33.65), "rea", "release", { prop: "halfL", dur: 0 });   // set down, then let go
sfx(T(33.77), "tink", { gain: 0.25 });
const MYHALF = [-0.12, r3(TABLE.h + 0.013), -0.3];
c.arm(T(33.1), "rea", "R", { world: [MYHALF[0], r3(TABLE.h + 0.12), MYHALF[2]] }, 0.5, "inOut");
A(T(33.65), "rea", "release", { prop: "halfR", dur: 0 });
c.arm(T(33.7), "rea", "L", "rest", 0.55, "inOut"); c.arm(T(33.7), "rea", "R", { world: [r3(MYHALF[0] - 0.05), r3(TABLE.h + 0.2), r3(MYHALF[2] + 0.04)] }, 0.25, "out");
// the tray back up to the same angle by its near handle (right glove); the left presses the button in the Wizard's
// frozen glove, and the same ray comes back off the same mirror onto him
c.arm(T(33.95), "rea", "R", { prop: "tray", grip: [HL[0], 0.14, HL[2]] }, 0.25, "inOut"); c.arm(T(34.17), "rea", "R", onH(HL, 0.08), 0.14, "out"); A(T(34.3), "rea", "grip", { side: "R", shape: "hold", dur: 0.08 });
c.prop(T(34.45), "tray", { x: SH[0], y: SH[1], z: SH[2], tip: SHTIP, rot: SHROT }, 0.5, "inOut"); c.arm(T(34.45), "rea", "R", RIM, 0.5, "inOut");
A(T(34.5), "rea", "lean", { to: 0.28, dur: 0.5 });
const BTN = [r3(REM[0] - Math.sin(REM_ROT * Math.PI / 180) * 0.165), r3(REM[1] + 0.03), r3(REM[2] - Math.cos(REM_ROT * Math.PI / 180) * 0.165)];   // REMOTE.button
const ROUND = [-0.03, 0.9, -1.06];   // round the tray's back edge (behind its far handle), clear of the mirror
c.arm(T(35.4), "rea", "L", { world: ROUND }, 0.4, "inOut");
c.arm(T(35.85), "rea", "L", { world: [BTN[0], r3(BTN[1] + 0.06), BTN[2]] }, 0.35, "inOut");
A(T(36.0), "rea", "grip", { side: "L", shape: "point", dur: 0.12 });
c.arm(T(36.75), "rea", "L", { world: [BTN[0], r3(BTN[1] + 0.012), BTN[2]] }, 0.1, "in");
const F4 = T(36.9); click(F4);
press(F4); ray(F4, TIP, surf(BOUNCE, WIZ_CHEST, 0.12), { via: BOUNCE, grow: 0.2 });
c.arm(T(37.2), "rea", "L", { world: ROUND }, 0.3, "inOut"); c.arm(T(37.55), "rea", "L", "rest", 0.4, "inOut"); A(T(37.3), "rea", "grip", { side: "L", shape: "relaxed", dur: 0.2 });
A(T(37.3), "rea", "lean", { to: 0.15, dur: 0.5 });
expr(T(37.45), "wiz", "shocked", { eye: 1.1 }, 0.15);
look(T(37.9), "wiz", [-0.4, -0.45], 0.2);   // the half-cookie on the plate
look(T(38.8), "wiz", [-0.8, 0.05], 0.2); expr(T(38.9), "wiz", "kind", { eye: 0.9 }, 0.35);   // then Reaper: he softens

// ---------------------------------------------------------------- 40-45 THE FINAL JOKE (panel 16)
c.arm(T(40.4), "wiz", "R", { world: [r3(REM[0] - 0.03), r3(REM[1] + 0.1), r3(REM[2] + 0.03)] }, 0.35, "inOut");   // one more trick?
expr(T(40.5), "wiz", "cocky", { eye: 0.75 }, 0.2);
c.prop(T(41.2), "tray", { tip: r3(SHTIP - 14), rot: r3(SHROT + 8) }, 0.25, "inOut");   // a casual tilt: he sees himself
expr(T(41.6), "wiz", "shocked", { eye: 1.15 }, 0.1);
c.arm(T(42.0), "wiz", "R", { world: [r3(REM[0] + 0.05), 0.7, r3(REM[2] + 0.1)] }, 0.45, "inOut");   // lowered, still in hand
c.prop(T(42.05), "tray", { x: TRAY_DOWN[0], y: TRAY_DOWN[1], z: TRAY_DOWN[2], tip: 0, rot: DOWNROT }, 0.4, "inOut"); c.arm(T(42.05), "rea", "R", onH(HL, 0.08), 0.4, "inOut");
A(T(42.5), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.1 });
// both take their halves and tap them together, then eat
A(T(42.2), "wiz", "turn", { to: -70, dur: 0.3 });
c.arm(T(42.55), "rea", "R", { world: [r3(MYHALF[0] - 0.05), r3(TABLE.h + 0.13), MYHALF[2]] }, 0.35, "inOut");
A(T(42.95), "rea", "grab", { prop: "halfR", hand: "R", grip: [-0.075, 0, 0], dur: 0.08, pose: null });
c.arm(T(42.4), "wiz", "L", { world: [r3(PLATE_OFF[0] + 0.05), r3(TABLE.h + 0.12), PLATE_OFF[2]] }, 0.4, "inOut");
A(T(42.85), "wiz", "grab", { prop: "halfL", hand: "L", grip: [-0.075, 0, 0], dur: 0.08, pose: null });
const TAP = [0.16, 0.95, -0.55];   // over the table's middle, between them
c.arm(T(43.15), "rea", "R", { world: [r3(TAP[0] - 0.11), TAP[1], TAP[2]] }, 0.4, "inOut");
c.arm(T(43.15), "wiz", "L", { world: [r3(TAP[0] + 0.11), TAP[1], TAP[2]] }, 0.4, "inOut");
sfx(T(43.6), "tink", { gain: 0.15 });   // the halves tap (sound pick: a soft biscuit knock)
expr(T(43.0), "wiz", "happy", { curve: 0.7 }, 0.2); expr(T(43.0), "rea", "happy", { curve: 0.6 }, 0.2);
c.arm(T(43.8), "rea", "R", MOUTH, 0.35, "inOut"); c.arm(T(43.8), "wiz", "L", { o: [0.02, 0.6, 0.22] }, 0.35, "inOut");
c.prop(0, "halfL", { cut: 0 }, 0, "linear"); c.prop(0, "halfR", { cut: 0 }, 0, "linear");
c.prop(T(44.25), "halfR", { cut: 1 }, 0, "linear"); c.prop(T(44.3), "halfL", { cut: 1 }, 0, "linear");
sfx(T(44.25), "crumble", { gain: 0.2 });
see(T(37.2), END, ["rea.face", "wiz.face"], "the shared ending");

// ---------------------------------------------------------------- shots
const MAIN = { pos: [0.14, 1.0, 3.5], look: [0.14, 0.62, -0.6], fov: 40 };
const CU_REA = { pos: [0.15, 1.05, 1.3], look: [-0.2, 0.92, -0.65], fov: 38 };
const CU_REA2 = { pos: [0.6, 1.15, 0.5], look: [-0.06, 0.95, -1.0], fov: 44 };
const CU_WIZ = { pos: [0.45, 1.1, 1.9], look: [0.62, 0.9, -0.5], fov: 40 };
const TABLE_CU = { pos: [0.1, 1.05, 0.75], look: [TRAY.x, TABLE.h, TRAY.z], fov: 38 };
// the reflection shot: on the far side of the tray from the Wizard's face (mirror geometry), at Reaper's left
// the reflection insert: the Wizard's eyes (layout 0.53, 1.0, -0.5) mirrored in the tray floor (y 0.426) are W'; the
// camera sits in front of Reaper, clear of him, on the line from W' through the tray point P where the face shows
// (P = 0.2, 0.426, -0.38 on the mirror's front right, away from the plate): C = P + 1.1 (P - W')
const OTS = { pos: [-0.163, 1.057, -0.248], look: [0.2, 0.426, -0.38], fov: 34 };
const BOUNCE_CAM = { pos: [0.6, 1.15, 2.4], look: [0.25, 0.86, -0.6], fov: 36 };   // front right: the tray's mirror face, both faces
const beats = c.beats([
  ["01 the reach", 0, MAIN, "hook"],
  ["03 the prize", T(2.2), CU_WIZ, "reaction"],
  ["04 the cushion", T(5.3), CU_REA],
  ["05 the throw", T(7.0), MAIN, "payoff"],
  ["08 the landing", T(8.7), TABLE_CU, "insert"],
  ["07 cushion off", T(9.5), CU_WIZ, "reaction"],
  ["09 contest", T(13.6), MAIN],
  ["10 the reflection", T(16.0), OTS, "reveal"],
  ["11 the plate", T(18.8), MAIN],
  ["12 the bounce", T(23.4), BOUNCE_CAM, "payoff"],
  ["13 frozen", T(24.6), CU_WIZ, "reaction"],
  ["14 the choice", T(26.4), CU_REA],
  ["14b sharing", T(31.6), MAIN],
  ["15 the release", T(35.8), BOUNCE_CAM],
  ["16 final", T(40.0), MAIN],
], END);

write(import.meta.url.replace("make-pause-you.mjs", OPEN === "B" ? "make-pause-you-b.mjs" : "make-pause-you.mjs"), {
  id: OPEN === "B" ? "pause-you-b" : "pause-you",
  title: "What if your friend could pause YOU?",
  idea: "There's a catch EP08 (Jonny's story): a magic remote pauses Reaper inches from the last cookie; a tray turns it round",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: LOOK, cleanStart: true, seed: 8008,
  motion: MOTION, rig: RIG, physics: true, animeTiming: ANIME_TIMING,
  cover: T(23.5),
  set: { type: "apartment", windows: [WIN], print: false, light: "golden", aperture: 0, lighting: LIGHTING, hatch: HATCH, life: "auto", cel: CEL, ink: true, satsuei: true },
  music: { style: "sneaky", lowCut: 150, gain: 0.45 },
  sound: { sfx: 0.6, ambience: 0.06, guard: true, surface: "wood", room: "room", signature: false },
  hook: { show: ["rea", "wiz", "cookie", "remote"], hint: 0, what: "Reaper's glove inches from the last cookie, the Wizard's remote on him" },
  creative: { length: [40, 47] },
  ...(!process.env.NOPAUSE && { pause: PAUSES }),
  cast, props: [...props, ...rays], captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "rea", with: "remote", from: T(35.95), to: T(37.35), reason: "his fingertip presses the button on the remote in the Wizard's frozen glove" },
    { who: "rea", with: "sofaR", from: 0, to: END, reason: "Reaper sits on the sofa" },
    { who: "wiz", with: "chair", from: 0, to: END, reason: "the Wizard sits in the armchair" },
    { who: "wiz", with: "remote", from: 0, to: END, reason: "the Wizard holds the remote" },
  ],
  notes: "Generated by storyboards/series/what-if/08-pause-you/make-pause-you.mjs. Brief: BRIEF.md; notes: NOTES.md.",
});
