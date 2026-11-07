// NEVER LOOKS UP, episode 3: ALIEN ABDUCTION (4 Nov 2026). "The friend who never looks up from his phone… even during
// an alien abduction". Jonny's brief and 8-panel board: /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip
// (03-alien-abduction/); series format 00-SERIES-FORMAT.md; panel notes PANELS-ep3-alien.md next to this file. The
// panels are the target.
//
// THE BRIEF
//   Joke:        a flying saucer beams Phoenix up, lawn chair and all; he keeps scrolling all the way to the hatch.
//   Wants:       Wizard and Reaper want him back down; the Astronaut wants to go instead; the alien wants a welcome.
//   Consequence: the alien leans out with a gift 20 cm from the phone and Phoenix gives it one flat "huh.".
//   Ending:      the offended alien slams the hatch, the beam goes off, the chair bonks onto the pile of friends, his
//                wings catch him (still scrolling) and the saucer zooms off, leaving the Astronaut heartbroken.
//   Callback:    the opening's beam onto his chair ends with the chair dropped on the friends who tried to save him,
//                and the one who wanted to go is left behind.
//
//   node storyboards/series/never-looks-up/make-ep3-alien.mjs
//   V3=1 node storyboards/series/never-looks-up/make-ep3-alien.mjs   -> never-looks-up-alien-v3rules.json: the reach
//   rules v3 opening (7 Nov 2026, research/hook-curiosity-2026-11-07): Phoenix's promise "I'll look up in a sec." from
//   0.0 s, a close-up on the Wizard at 1.1 s with a 0.7 s freeze, back to the same wide at 1.5 s; the rest unchanged
import { clip, write as writeSb, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { nowRules } from "../../lib/now-rules.mjs";
import * as grips from "../../lib/grips.mjs";
import { SAUCER } from "../../../engine/page/props-ufo.js";

const FACES = "strong", MOTION = "natural";
const ENV = process.env.ENV ?? "backyard-stargazing";
const c = clip({ faces: FACES }), { A, sfx, see, prop } = c;
const END = 10.0;
const V3 = !!process.env.V3;   // the reach rules v3 opening (see the top)
// v3 re-cuts take today's template motion (Jonny 7 Nov), except the planted gait: with it the Wizard's hat sinks 54 %
// into Phoenix and 23 % into Reaper in the tug of war (no path, lean or feetTune change fixed it), so natural walks stay
const write = (u, sb) => writeSb(u, V3 ? { ...nowRules(sb), motion: { overlap: true, timing: true, solve: true } } : sb);
const rad = (d) => (d * Math.PI) / 180;

// ---------------------------------------------------------------- places (x right, z toward us; the houses are -z)
const CHAIR0 = { x: -0.45, z: 0.0, rot: 22 };             // the lawn chair, centre-left, Phoenix turned a little to screen right
const SEAT = 0.42 - 0.12;                                  // his body's y above the chair's
const BLANKET = { x: 0.85, z: 0.35, w: 1.6, d: 2.0 };
const TELE = { x: -1.85, z: -1.55 };
// a body-width and more apart (sitting bodies read about 0.4 m round), the Astronaut back right where nobody hides him
// the Astronaut and his telescope back left, past Phoenix: in a tall frame the back right sits behind the friends
const WIZ0 = [0.25, 1.15], REA0 = [1.1, 0.95], AST0 = [-1.5, -1.25];
// the saucer: low over the lawn at frame 0; once the friends let go it glides over the blanket and stops there
const UFO0 = { x: CHAIR0.x, y: 3.05, z: CHAIR0.z, rot: 62 };   // rot 62: the hatch (its +z side) is at Phoenix's front-right
const UFO_END = { x: 0.56, y: 3.42, z: -0.33 };
// the chair ends up a little off the saucer's middle, away from the hatch, so the alien's lift clears his arm
const CHAIR_END = { x: r3(UFO_END.x - Math.sin(rad(62)) * 0.1), z: r3(UFO_END.z - Math.cos(rad(62)) * 0.1) };
const T_BREAK = 5.1, T_TOP = 6.8;
const CHAIR_TOP = r3(UFO_END.y - 1.92);                     // the chair's height under the saucer at the top (crest clear of the hull)
const lerp = (a, b, k) => a + (b - a) * k;
// the chair's height while it rises (one tween per stretch: ease in, the tug's stall, ease out to the top)
const LIFT = [[1.5, 0], [3.2, 0.6], [T_BREAK, 0.95], [T_TOP, CHAIR_TOP]];   // a body above the Wizard by 3.2 (review A, panel 02)
const UFO_Y = [[1.5, UFO0.y], [T_TOP, UFO_END.y]];          // the saucer rises a little as it reels him in

// Phoenix holds the phone in both gloves in front of his chest (Still Scrolling, ep 1)
const PH_Y = 0.2, PH_Z = 0.42;
const PHONE_R = { x: [-0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] }, PHONE_L = { x: [0.11, PH_Y, PH_Z], palm: [0, PH_Y, PH_Z] };
const AT_PHONE = [0.03, -1];

const cast = [
  { id: "phx", character: "duo/phoenix", at: [CHAIR0.x, CHAIR0.z], face: CHAIR0.rot, expr: "kind", follow: 0.3, seed: 1.7, span: 0, shadowFall: 2.0,
    arms: { R: PHONE_R, L: PHONE_L }, grip: { R: "hold", L: "hold" } },
  { id: "wiz", character: "notyet/wizard-nostaff", at: WIZ0, face: -30, expr: "kind", follow: 0.4, seed: 2.6 },
  { id: "rea", character: "notyet/reaper-noscythe", at: REA0, face: -35, expr: "kind", follow: 0.25, seed: 3.1 },
  { id: "ast", character: "duo/astronaut", at: AST0, face: 35, expr: "kind", follow: 0.4, seed: 4.4 },
];
const BOWL0 = { x: r3(WIZ0[0] - 0.12), y: 0.16, z: r3(WIZ0[1] + 0.3) };
// the hatch in the saucer's underside, in the world, for the saucer at u (the alien prop sits there and drops out of it)
const hatchAt = (u) => {
  const a = rad(UFO0.rot + SAUCER.hatch.az), H = SAUCER.hatch;
  return { x: r3(u.x + Math.sin(a) * H.r), y: r3(u.y + SAUCER.bottom), z: r3(u.z + Math.cos(a) * H.r) };
};
const H0 = hatchAt(UFO0), H_END = hatchAt(UFO_END);
const props = [
  { id: "blanket", kind: "picnicblanket", x: BLANKET.x, z: BLANKET.z, w: BLANKET.w, d: BLANKET.d, rot: -6 },
  { id: "chair", kind: "lawnchair", x: CHAIR0.x, z: CHAIR0.z, rot: CHAIR0.rot },
  { id: "tele", kind: "telescope", x: TELE.x, z: TELE.z, aim: [40, 50] },
  { id: "lights", kind: "stringlights", lit: 1, bulbs: 7, sag: 0.16, points: [[-2.2, 2.05, -2.9], [-0.8, 2.3, -3.5], [0.6, 2.15, -3.0], [2.1, 2.35, -3.6]] },
  { id: "ufo", kind: "flyingsaucer", ...UFO0, lit: 1, wobble: 1, glow: 0, beamR: 0.6 },
  { id: "alien", kind: "beanalien", ...H0, rot: -35, drop: 0, happy: 0.6 },
  { id: "phone", kind: "phone", x: CHAIR0.x, y: 0.9, z: CHAIR0.z + 0.45, rot: 180, tip: -28, scale: 1.9, case: "#2a2d36", ...(V3 && { bright: 2.2, halo: 0.15, haloK: 0.45 }) },   // v3: the bright phone rule (Jonny 5 Nov); a smaller glow than ep5: at 0.32 m it turned his eyes grey in the look-up close-up
  { id: "bowl", kind: "popcornbowl", ...BOWL0, rot: 0 },
  { id: "pop1", kind: "popcorn", x: BOWL0.x, y: 0.26, z: BOWL0.z, n: 9, to: [0.05, 0.08], spread: 0.3 },
  { id: "pop2", kind: "popcorn", x: r3(WIZ0[0] - 0.25), y: 0.2, z: r3(WIZ0[1] + 0.35), n: 14, to: [0.0, 0.1], spread: 0.35 },
  // invisible carriers: the bodies that get knocked over follow these paths (a fall is a path, not a walk)
  { id: "wizC", kind: "carrier", x: WIZ0[0], y: 0, z: WIZ0[1] },
  { id: "reaC", kind: "carrier", x: REA0[0], y: 0, z: REA0[1] },
  { id: "astC", kind: "carrier", x: AST0[0], y: 0, z: AST0[1] },
];

// ---------------------------------------------------------------- the saucer: rise, glide, hum (the alien's lift moves with it)
prop(UFO_Y[0][0], "ufo", { y: UFO_Y[1][1] }, UFO_Y[1][0] - UFO_Y[0][0], "inOut");
prop(UFO_Y[0][0], "alien", { y: H_END.y }, UFO_Y[1][0] - UFO_Y[0][0], "inOut");
prop(T_BREAK, "ufo", { x: UFO_END.x, z: UFO_END.z }, T_TOP - T_BREAK, "inOut");
prop(T_BREAK, "alien", { x: H_END.x, z: H_END.z }, T_TOP - T_BREAK, "inOut");
prop(0, "ufo", { spin: 6 }, 9.4, "linear");

// ---------------------------------------------------------------- Phoenix: in the lawn chair, on the phone, from frame 0
A(0, "phx", "ride", { prop: "chair", off: [0, SEAT, 0.03], yaw: 0, sit: true, dur: 0 });
A(0, "phx", "grab", { prop: "phone", hand: "both", grip: [0, 0.035, 0], pose: null });
A(0, "phx", "look", { to: AT_PHONE, dur: 0, blink: false });
A(0, "phx", "expr", { expr: "kind", set: { curve: 0.25, eye: 0.95 }, dur: V3 ? 0 : 0.01 });
A(0, "phx", "face", { lid: 0.45, dur: V3 ? 0 : 0.01 });
act.blinksAt(c, "phx", [1.9, 4.6, 6.6]);
act.scrollPhone(c, "phx", [0.25, 1.15, 2.05, 3.05, 3.95, 4.85, 5.75, 6.65, 7.45]);
prop(0, "phone", { glow: 0.6 }, V3 ? 0 : 0.01);

// ---------------------------------------------------------------- 1 BEAM 0-1.5 (P1)
const CAP_Y = 700;   // gibberish captions: in the sky beside the saucer, below the title's top 20 %
if (!V3) prop(0, "ufo", { glow: 0.15 }, 0.01);
if (!V3) prop(0.04, "ufo", { glow: 1 }, 0.06, "out");                  // the beam snaps on onto his chair
if (V3) prop(0, "ufo", { glow: 1 }, 0);                       // v3 (Fable B): the beam is already on him at frame 0
c.hitStop(0.1, 3);
sfx(0.08, "kenney/phaser-up", { gain: 0.55, reason: "the beam snaps on" });
sfx(0.1, "force-field", { gain: 0.32, dur: 9.2, reason: "the beam's hum while it is on" });
// the Astronaut at his telescope: gasp, then points at it
A(0, "ast", "look", { to: [0.6, 0.7], dur: 0, blink: false });
act.shock(c, 0.02, "ast", { open: 0.45, hold: 1.0 });
if (!V3) A(0.05, "ast", "talk", { line: "ooh!", dur: 0.35, tone: "excited", voice: false });   // v3: Phoenix's promise is the only line
sfx(0.05, "gasp", { gain: 0.6 });
c.arm(0.15, "ast", "R", { o: [0.25, 0.82, 0.22] }, 0.2, "out");
if (!V3) c.cap(0.05, 1.3, "THEY CAME!!", CAP_Y);
if (V3) {
  // B7: the first line at 0.0 is a promise the viewer expects him to break, said flat to the phone while the beam hits
  A(0.03, "phx", "talk", { line: "I'll look up in a sec.", dur: 0.95, tone: "calm", voice: false });
  c.cap(0.03, 1.1, "I'll look up in a sec.", CAP_Y);
  c.cap(1.1, 1.4, "I'll look up in a sec.", 470, false, { kinetic: false });   // in the close-up's sky, clear of the hat
  // B8: the Wizard glances from the saucer to Phoenix, then the cut to his face and a 0.7 s freeze on it
  A(0.88, "wiz", "look", { to: [1.0, 0.15], dur: 0.12, blink: false });
  act.mood(c, 0.9, "wiz", "annoyed", { hold: 0.25 });             // "seriously?!": squint, brows in
  c.hitStop(1.2, 21);
}
// the Wizard on the blanket: the popcorn jumps out of his bowl
A(0, "wiz", "ride", { prop: "wizC", off: [0, -0.02, 0], yaw: 0, sit: true, dur: 0 });
const bowl = grips.bowl(c, "wiz", props.find((p) => p.id === "bowl"), { height: 0.75 });
bowl.secure(0, 0);
prop(0.1, "bowl", { puff: 1 }, 0.25, "out"); prop(0.35, "bowl", { puff: 0, fill: 0.85 }, 0.3, "in");
prop(0.1, "pop1", { burst: 1 }, 0.55, "linear");
sfx(0.12, "pop", { gain: 0.6, reason: "popcorn jumps out of the bowl" });
A(0, "wiz", "look", { to: [-0.55, 0.85], dur: 0, blink: false });
act.shock(c, 0.12, "wiz", { open: 0.4, hold: V3 ? 0.5 : 1.0 });   // v3: short enough that his glance at 0.88 plays
// Reaper on the blanket: calm, eyes up at it
A(0, "rea", "ride", { prop: "reaC", off: [0, -0.02, 0], yaw: 0, sit: true, dur: 0 });
A(0, "rea", "look", { to: [-0.6, 0.8], dur: 0, blink: false });
c.arm(0, "rea", "R", { x: [-0.16, 0.32, 0.32] }, V3 ? 0 : 0.01); c.arm(0, "rea", "L", { x: [0.16, 0.32, 0.32] }, V3 ? 0 : 0.01);   // gloves in his lap, clear of the Wizard
act.shock(c, 0.3, "rea", { open: 0.05, eye: 1.15, hold: 1.4 });
see(0, V3 ? 1.1 : 1.5, ["phx.face", "wiz.face", "rea.face", "ast.face", "ufo", "phone"], "P1: the saucer beams his chair; everyone sees it but Phoenix");
if (V3) see(1.12, 1.38, ["wiz.face"], "B8: the Wizard's face, frozen on Phoenix's promise");

// ---------------------------------------------------------------- 2 LIFT 1.5-3.2 (P2)
// the chair rises in the beam with him on it, rocking gently
for (let i = 1; i < LIFT.length; i++) prop(LIFT[i - 1][0], "chair", { y: LIFT[i][1] }, LIFT[i][0] - LIFT[i - 1][0], i === 1 ? "in" : i === LIFT.length - 1 ? "out" : "linear");
prop(T_BREAK, "chair", { x: CHAIR_END.x, z: CHAIR_END.z }, T_TOP - T_BREAK, "inOut");
prop(1.5, "chair", { tilt: -4 }, 1.0); prop(2.6, "chair", { tilt: 3 }, 1.2); prop(3.9, "chair", { tilt: -2 }, 1.2); prop(5.2, "chair", { tilt: 2 }, 1.4); prop(6.7, "chair", { tilt: 0 }, 1.0);
sfx(1.5, "charge", { gain: 0.35, reason: "the rising shimmer as the chair lifts off" });
// the Astronaut: starstruck, both arms waving at the saucer
A(1.6, "ast", "expr", { expr: "delighted", set: { eye: 1.2, open: 0.6 }, dur: 0.25 });
for (const [t, s] of [[1.65, 1], [1.95, -1], [2.25, 1], [2.55, -1], [2.85, 1]]) {
  c.arm(t, "ast", "R", { o: [0.3 + 0.08 * s, 0.85, 0.12] }, 0.28); c.arm(t, "ast", "L", { o: [0.3 - 0.08 * s, 0.85, 0.12] }, 0.28);
}
A(1.75, "ast", "talk", { line: "take me take me!", dur: 1.0, tone: "excited", voice: false });
c.cap(1.75, 3.0, "TAKE ME TOO!!", 640, false, { x: 410 });   // each line by its speaker (review A)
// the Wizard drops the popcorn, gets up and grabs Phoenix's dangling foot
bowl.release(1.55, { rest: false });
prop(1.6, "bowl", { y: 0 }, 0.15, "in");   // it drops off his lap onto the blanket
prop(1.7, "bowl", { tilt: 70, fill: 0.2 }, 0.25, "in");
prop(1.7, "pop2", { burst: 1 }, 0.6, "linear");
sfx(1.92, "thud-soft", { gain: 0.35, reason: "the popcorn bowl tips onto the blanket" });
// his gloves on the foot: Phoenix's feet stick out in front of the chair, 0.42 forward along its yaw and 0.12 up
const liftAt = (t) => {
  for (let i = 1; i < LIFT.length; i++) if (t <= LIFT[i][0]) { const k = Math.max(0, (t - LIFT[i - 1][0]) / (LIFT[i][0] - LIFT[i - 1][0])); return lerp(LIFT[i - 1][1], LIFT[i][1], i === 1 ? k * k : i === LIFT.length - 1 ? 1 - (1 - k) ** 2 : k); }
  return CHAIR_TOP;
};
// Phoenix's left foot (screen right) hangs in front of the chair: measured in the layout, 0.335 m over the chair's y
const FOOTL = (t) => [r3(CHAIR0.x + 0.25), r3(liftAt(t) + 0.335), 0.215];
// the Wizard stands back right of the foot, 0.75 m from Phoenix's body, so his hat brim stays clear as Phoenix rises
const WIZ_TUG = [0.38, -0.32];
const WIZ_YAW = r3(Math.atan2(FOOTL(0)[0] - WIZ_TUG[0], FOOTL(0)[2] - WIZ_TUG[1]) * 180 / Math.PI);
const fwdW = [Math.sin(rad(WIZ_YAW)), Math.cos(rad(WIZ_YAW))], leftW = [fwdW[1], -fwdW[0]];   // a body facing us has its left on screen right
A(1.45, "wiz", "look", { to: [-0.4, -0.1], dur: 0.12, blink: false });
A(1.62, "wiz", "ride", {});
A(1.62, "wiz", "stand", { dur: 0.3 });
c.arm(1.79, "wiz", "R", { x: [-0.32, 0.55, 0.32] }, 0.2); c.arm(1.79, "wiz", "L", { x: [0.24, 0.55, 0.32] }, 0.2);   // up off the dropped bowl   // gloves out while he scrambles up
A(1.7, "wiz", "move", { to: WIZ_TUG, dur: 0.75 });
A(1.85, "wiz", "turn", { to: WIZ_YAW, dur: 0.3 });
A(1.75, "wiz", "look", { to: [-0.4, 0.5], dur: 0.12, blink: false });
act.mood(c, 1.8, "wiz", "shock", { hold: 0.6 });
A(1.85, "wiz", "talk", { line: "nonono no!", dur: 0.7, tone: "excited", voice: false });
c.cap(1.85, 2.75, "NO NO NO!", 900, false, { x: 700 });
// both gloves on the foot (one each side of it), following it up; at 2.95 his left glove goes back to Reaper
const T_GRAB = 2.4, T_BACK = 2.95;
// the gloves close round his ankle from the Wizard's side of it, above the chair's front bar
const onFoot = (t, s, back = 0.16) => { const f = FOOTL(t); return [r3(f[0] - leftW[0] * 0.055 * s - fwdW[0] * back), r3(f[1] + 0.14), r3(f[2] - leftW[1] * 0.055 * s - fwdW[1] * back)]; };
const grabTimes = [2.4, 2.8, 3.2, 3.6, 4.0, 4.4, 4.8, 5.05];
for (let i = 0; i < grabTimes.length; i++) {
  const t = grabTimes[i], d = i ? grabTimes[i] - grabTimes[i - 1] : 0.3, t0 = i ? grabTimes[i - 1] : t - 0.3;
  c.arm(t0, "wiz", "R", { world: onFoot(t, t <= 2.8 ? 0.45 : -0.4, i ? 0.16 : 0.3) }, d, i ? "linear" : "out");   // alone on the ankle once the left goes back
  if (t <= 2.8) c.arm(t0, "wiz", "L", { world: onFoot(t, -1.35, i ? 0.16 : 0.2) }, d, i ? "linear" : "out");
}
A(T_GRAB - 0.05, "wiz", "grip", { side: "both", shape: "hold", dur: 0.12 });
A(T_GRAB - 0.2, "wiz", "pitch", { to: -12, dur: 0.3 });   // he leans back the moment he has the foot (his hat brim clear of Phoenix)
// the ping: Phoenix's tiny smile at the phone
sfx(2.7, "notify", { gain: 0.32 });
act.grin(c, 2.75, "phx", { back: 0.9 });
see(1.6, 3.15, ["phx.face", "wiz.face", "ast.face", "chair"], "P2: the chair lifts in the beam, the Wizard grabs his foot, the Astronaut cheers");

// ---------------------------------------------------------------- 3 TUG OF WAR 3.2-5.0 (P3)
// a tug-of-war chain: the Wizard's right glove on the foot, his left back to Reaper, who holds it in both gloves and
// leans back with his heels dug in (a hold round the waist from behind pushed the bodies into each other)
const LBACK = [r3(WIZ_TUG[0] + leftW[0] * 0.24 - fwdW[0] * 0.4), 0.42, r3(WIZ_TUG[1] + leftW[1] * 0.24 - fwdW[1] * 0.4)];
const REA_YAW = -50, fwdR = [Math.sin(rad(REA_YAW)), Math.cos(rad(REA_YAW))];
const REA_TUG = [r3(LBACK[0] - fwdR[0] * 0.5), r3(LBACK[2] - fwdR[1] * 0.5)];
A(2.0, "rea", "look", { to: [-0.8, 0.2], dur: 0.12, blink: false });
A(2.15, "rea", "ride", {});
A(2.15, "rea", "stand", { dur: 0.3 });
A(2.36, "rea", "move", { to: REA_TUG, dur: 0.58 });
A(2.32, "rea", "turn", { to: REA_YAW, dur: 0.35 });
c.arm(T_BACK - 0.1, "wiz", "L", { world: [r3(WIZ_TUG[0] + leftW[0] * 0.48), 0.62, r3(WIZ_TUG[1] + leftW[1] * 0.48)] }, 0.18, "inOut");   // out to his side first, clear of his body
c.arm(T_BACK + 0.08, "wiz", "L", { world: LBACK }, 0.18, "inOut");
const reaOn = (dy, k) => [r3(LBACK[0] - fwdR[0] * k), r3(LBACK[1] + dy), r3(LBACK[2] - fwdR[1] * k)];
c.arm(2.95, "rea", "L", { world: reaOn(0.05, 0.07) }, 0.25, "out");
c.arm(2.98, "rea", "R", { world: reaOn(-0.05, 0.12) }, 0.25, "out");
A(3.15, "rea", "grip", { side: "both", shape: "hold", dur: 0.12 });
// leaning back against the pull, a heave every half second
A(3.25, "rea", "pitch", { to: -12, dur: 0.3 });
for (const t of [3.5, 4.0, 4.5]) { A(t, "wiz", "squash", { amount: 0.04, dur: 0.25 }); A(t + 0.05, "rea", "squash", { amount: 0.04, dur: 0.25 }); }
act.mood(c, 3.2, "wiz", "angry", { hold: 1.6 });
act.mood(c, 3.25, "rea", "annoyed", { hold: 1.6 });
A(3.3, "wiz", "talk", { line: "hnnnngh!", dur: 0.6, tone: "excited", voice: false });
c.cap(3.3, 3.85, "HNNNGH!", 900, false, { x: 700 });
A(3.3, "wiz", "look", { to: [-0.3, 0.8], dur: 0.12, blink: false });
// the Astronaut runs to the edge of the beam and jumps up and down in it, begging; Reaper shoots him a look
const AST_IN = [-1.3, -0.9];   // the beam's edge (beamR 0.6): any closer and the beam's glow washes over him
A(3.07, "ast", "look", { to: [0.5, 0.6], dur: 0.12, blink: false });
A(3.15, "ast", "move", { to: AST_IN, dur: 0.4 });
A(3.15, "ast", "turn", { to: 40, dur: 0.3 });
c.arm(3.12, "ast", "R", { o: [0.5, 0.82, 0.15] }, 0.25); c.arm(3.12, "ast", "L", { o: [0.5, 0.82, 0.15] }, 0.25);   // arms out wide as he runs, clear of the helmet
for (const [t, s] of [[3.5, 1], [3.8, -1], [4.1, 1], [4.4, -1], [4.7, 1]]) {
  c.arm(t, "ast", "R", { o: [0.45 + 0.05 * s, 0.9, 0.15] }, 0.28); c.arm(t, "ast", "L", { o: [0.45 - 0.05 * s, 0.9, 0.15] }, 0.28);
}
for (const t of [3.35, 3.95, 4.55]) A(t, "ast", "squash", { amount: -0.05, dur: 0.28 });
A(3.9, "ast", "talk", { line: "me me me!", dur: 0.6, tone: "excited", voice: false });
c.cap(3.9, 4.6, "ME! PICK ME!", 640, false, { x: 340 });
A(3.95, "rea", "look", { to: [-0.8, 0.1], dur: 0.12, blink: false });
A(4.4, "rea", "look", { to: [-0.3, 0.7], dur: 0.12, blink: false });
A(4.25, "wiz", "talk", { line: "pull pull!", dur: 0.5, tone: "excited", voice: false });
c.cap(4.25, 5.0, "PULL!!", 900, false, { x: 700 });
see(3.3, 4.9, ["phx.face", "wiz.face", "rea.face", "ast.face"], "P3: the tug of war under the chair, the Astronaut begging to go");

// ---------------------------------------------------------------- 4 HATCH 5.0-6.3 (P4)
// the Wizard's grip slips: he and Reaper sit down hard on the lawn; the Astronaut, mid-jump, lands on his bottom too
c.hitStop(T_BREAK, 3);
sfx(T_BREAK, "whoosh", { gain: 0.6, reason: "the grip slips and they fall back" });
c.arm(T_BREAK, "wiz", "R", { o: [0.3, 0.8, 0.15] }, 0.18, "out"); c.arm(T_BREAK, "wiz", "L", { o: [0.3, 0.75, 0.15] }, 0.18, "out");
A(T_BREAK, "wiz", "grip", { side: "both", shape: "open", dur: 0.1 });
c.arm(T_BREAK, "rea", "R", { o: [0.3, 0.7, 0.1] }, 0.2, "out"); c.arm(T_BREAK, "rea", "L", { o: [0.3, 0.7, 0.1] }, 0.2, "out");
A(T_BREAK, "rea", "grip", { side: "both", shape: "open", dur: 0.1 });
// each lands where the pull throws him (straight back), sitting with his legs out, a body-width apart
const FALL = { wiz: [r3(WIZ_TUG[0] - fwdW[0] * 0.3), r3(WIZ_TUG[1] - fwdW[1] * 0.3)], rea: [r3(REA_TUG[0] - fwdR[0] * 0.45), r3(REA_TUG[1] - fwdR[1] * 0.45)], ast: [AST_IN[0], r3(AST_IN[1] - 0.22)] };
const sitDown = (who, carr, to, t, dur, yaw, pitch) => {
  prop(t - 0.05, carr, { x: to[0], z: to[1] }, 0.01);
  A(t, who, "ride", { prop: carr, off: [0, -0.02, 0], yaw, sit: true, dur, ease: "in" });
  A(t, who, "pitch", { to: pitch, dur: dur * 0.9 });
  A(t + dur + 0.25, who, "pitch", { to: -8, dur: 0.4 });
};
sitDown("wiz", "wizC", FALL.wiz, T_BREAK + 0.08, 0.32, WIZ_YAW, -18);
sitDown("rea", "reaC", FALL.rea, T_BREAK + 0.1, 0.34, REA_YAW, -24);
sitDown("ast", "astC", FALL.ast, T_BREAK + 0.05, 0.3, 40, -20);
sfx(T_BREAK + 0.4, "thud", { gain: 0.5, reason: "Wizard and Reaper land on their bottoms" });
sfx(T_BREAK + 0.36, "thud-soft", { gain: 0.7, reason: "the Astronaut lands on his bottom" });
A(T_BREAK + 0.4, "wiz", "squash", { amount: 0.08, dur: 0.25 }); A(T_BREAK + 0.44, "rea", "squash", { amount: 0.08, dur: 0.25 }); A(T_BREAK + 0.36, "ast", "squash", { amount: 0.08, dur: 0.25 });
A(T_BREAK + 0.4, "wiz", "hatwobble", { amount: 8, freq: 3, dur: 0.8 });
c.arm(T_BREAK + 0.4, "wiz", "R", { o: [0.3, 0.45, 0.2] }, 0.3); c.arm(T_BREAK + 0.4, "wiz", "L", { o: [0.3, 0.45, 0.2] }, 0.3);
c.arm(T_BREAK + 0.4, "rea", "R", { o: [0.3, 0.4, 0.2] }, 0.3); c.arm(T_BREAK + 0.4, "rea", "L", { o: [0.3, 0.4, 0.2] }, 0.3);
c.arm(T_BREAK + 0.35, "ast", "R", { o: [0.3, 0.45, 0.2] }, 0.3); c.arm(T_BREAK + 0.35, "ast", "L", { o: [0.3, 0.45, 0.2] }, 0.3);
for (const w of ["wiz", "rea", "ast"]) act.shock(c, T_BREAK + 0.5, w, { open: 0.3, hold: 1.2 });
for (const w of ["wiz", "rea", "ast"]) A(T_BREAK + 0.55, w, "look", { to: [-0.2, 0.9], dur: 0.15, blink: false });
// the hatch irises open and the alien rides its lift down out of it, waving
prop(5.45, "ufo", { open: 1 }, 0.35, "out");
sfx(5.45, "doorslide", { gain: 0.5, reason: "the hatch irises open" });
prop(5.6, "alien", { drop: 0.55 }, 0.45, "out");
prop(5.75, "alien", { arms: 1, wobble: 1, happy: 1, jaw: 0.6 }, 0.3, "out");
sfx(5.95, "kenney/three-tone", { gain: 0.35, reason: "the alien's cheerful high greeting (its gibberish)" });
c.cap(5.95, 6.9, "welcome welcome!!", 450);
see(5.2, 6.25, ["phx.face", "ufo", "wiz", "rea", "ast"], "P4: the friends in a pile, Phoenix still rising, the hatch opens");

// ---------------------------------------------------------------- 5 GREETING 6.3-7.0 (P5) and 6 PEAK 7.0-8.0 (P6)
// the alien rides down beside him and holds out a glowing gift, right by the phone
const PHONE_TOP = CHAIR_TOP + 0.87, DROP_PEAK = r3(H_END.y - (PHONE_TOP + 0.05));   // its face above his eye line: he looks up at it (panels 06-07)
prop(6.7, "alien", { drop: DROP_PEAK, lean: 5, jaw: 0.3, lookX: -0.8, lookY: -0.4 }, 0.45, "inOut");
// the gift arrives: the waving mittens come down and bring it up from the rim over 0.6 s (review B: it popped in)
prop(6.45, "alien", { arms: 0, wobble: 0, gap: 1, glow: 1 }, 0.6, "inOut");
sfx(6.9, "kenney/glass", { gain: 0.3, reason: "the gift's glow sparkles on" });
// the peak stays alive: it nudges the gift closer and the glow pulses, with a second little "hello?"
prop(7.3, "alien", { glow: 1.4 }, 0.2, "out"); prop(7.5, "alien", { glow: 1 }, 0.3, "inOut");
prop(7.4, "alien", { lean: 9, jaw: 0.4 }, 0.3, "inOut"); prop(7.75, "alien", { lean: 6, jaw: 0.3 }, 0.25, "inOut");
sfx(7.5, "kenney/three-tone", { gain: 0.2, reason: "the alien's second, smaller 'hello?' (its gibberish)" });
c.cap(7.45, 7.95, "hello?", 430);
A(7.0, "phx", "noblink", { dur: 1.0 });
for (const w of ["wiz", "rea", "ast"]) A(7.8, w, "noblink", { dur: 1.75 });
see(6.35, 6.95, ["phx.face", "alien"], "P5: the alien on its lift, waving, Phoenix on his phone right below");
see(7.1, 7.95, ["phx.face", "alien", "phone"], "P6: the gift held out right by his phone");

// ---------------------------------------------------------------- 7 LOOK-UP 8.0-9.0 (P7, the series ending)
A(8.05, "phx", "look", { to: [0.75, 0.35], dur: 0.12, blink: false });
A(8.05, "phx", "face", { lid: 0.15, dur: 0.12 });
A(8.05, "phx", "pitch", { to: -8, dur: 0.15 });
A(8.35, "phx", "blink", { dur: 0.22 });
A(8.5, "phx", "talk", { line: "huh.", dur: 0.35, tone: "calm" });
c.cap(8.5, 9.0, "huh.", 1250, false, { x: 826 });   // beside his face: lower in the frame it would sit on him
prop(8.0, "alien", { happy: 1, jaw: 0.7, lookX: -0.6, lookY: -0.1 }, 0.15);
see(8.1, 8.95, ["phx.face", "alien"], "P7: Phoenix looks up at the alien and its gift: huh.");

// ---------------------------------------------------------------- 8 BACK DOWN 9.0-10.0 (P8)
A(9.0, "phx", "look", { to: AT_PHONE, dur: 0.12, blink: false });
A(9.0, "phx", "face", { lid: 0.45, dur: 0.15 });
A(9.0, "phx", "pitch", { to: 0, dur: 0.15 });
sfx(9.15, "notify", { gain: 0.2 });
A(9.2, "phx", "expr", { expr: "happy", set: { curve: 0.55 }, dur: 0.25 });
act.scrollPhone(c, "phx", [9.35, 9.75]);
// the alien is offended: hmph, the gift goes back, it zips up, the hatch slams, the beam goes off
prop(9.1, "alien", { happy: -1, jaw: 0, lean: -6, gap: 0, lookX: 0.3, lookY: 0.5 }, 0.15, "out");
A(9.1, "phx", "noblink", { dur: 0.85 });
sfx(9.1, "kenney/low-down", { gain: 0.12, reason: "the alien's offended 'hmph' (its gibberish)" });
c.cap(9.05, 9.3, "hmph!", 430);
prop(9.2, "alien", { drop: 0 }, 0.08, "in");
prop(9.26, "ufo", { open: 0 }, 0.04, "in");
c.hitStop(9.3, 3);
sfx(9.3, "slam", { gain: 0.6, reason: "the hatch slams shut" });
sfx(9.3, "kenney/switch", { gain: 0.5, reason: "the hatch's latch clicks shut (a click on the slam for phone speakers)" });
prop(9.34, "ufo", { glow: 0 }, 0.04);
sfx(9.34, "kenney/phaser-down", { gain: 0.4, reason: "the beam switches off" });
// the chair drops away beneath him onto the pile; his wings flick open and he hovers in the same seated pose
const T_OFF = 9.36, LAND = { x: -0.35, z: 0.3, y: 0.3 };   // on the lawn where it stood, clear of everyone
A(T_OFF, "phx", "ride", {});
// the wings flick open a beat into the wide, so the save reads on screen (review B)
A(T_OFF + 0.13, "phx", "span", { to: 0.7, dur: 0.14, ease: "out" });
A(T_OFF + 0.1, "phx", "fly", { to: { y: r3(CHAIR_TOP + SEAT + 0.04) }, dur: 0.3, ease: "out" });
sfx(T_OFF + 0.12, "wings", { gain: 0.45, dur: END - T_OFF - 0.17 });
prop(T_OFF, "chair", { y: LAND.y, tilt: 25, tip: -15 }, 0.3, "in");
prop(T_OFF, "chair", { x: LAND.x, z: LAND.z }, 0.3, "linear");
sfx(T_OFF + 0.3, "pan-bonk", { gain: 0.6, reason: "bonk: the lawn chair lands back on the lawn" });
for (const [w, d] of [["wiz", 0], ["rea", 0.02]]) A(T_OFF + 0.3 + d, w, "squash", { amount: 0.06, dur: 0.2 });
// the saucer zooms off into the stars, up and to the right
prop(9.5, "ufo", { x: 8, y: 10, z: -9, wobble: 0 }, 0.4, "in");   // off into the stars, gone before the last frame (review B)
sfx(9.5, "whoosh", { gain: 0.55, reason: "the saucer zooms away" });
// the Astronaut reaches after it from where he sits, heartbroken; the others glare up at Phoenix
c.arm(9.5, "ast", "R", { o: [0.25, 0.9, 0.35] }, 0.25, "out");
A(9.45, "ast", "expr", { expr: "sad", set: { open: 0.45, eye: 1.1 }, dur: 0.25 });
A(9.5, "ast", "look", { to: [0.6, 0.9], dur: 0.12, blink: false });
A(9.55, "ast", "talk", { line: "noooo...", dur: 0.4, tone: "sad", voice: false });
c.cap(9.5, END, "NOOO...", 1250, false, { x: 250 });
for (const w of ["wiz", "rea"]) { A(9.7, w, "look", { to: [-0.3, 0.7], dur: 0.15, blink: false }); act.mood(c, 9.7, w, "annoyed", { hold: 0.25 }); }
see(9.45, 9.95, ["phx", "chair", "ast.face"], "P8: the chair dropped by the friends, Phoenix hovering, the Astronaut reaching after the saucer");

// ---------------------------------------------------------------- shots (Jonny's panels; the camera looks into the garden)
// the painting's camera (env.json eye) looks along -z, up EYE_PITCH; every shot keeps near that axis (qa/env.mjs --range)
const EYE_PITCH = Number(process.env.EYE_PITCH ?? -10.955);
const shot = (pos, { pan = 0, tilt = 0, fov = 46 } = {}) => {
  const yaw = rad(pan), pit = rad(-EYE_PITCH + tilt), k = 10;
  return { pos, look: [r3(pos[0] + Math.sin(yaw) * Math.cos(pit) * k), r3(pos[1] + Math.sin(pit) * k), r3(pos[2] - Math.cos(yaw) * Math.cos(pit) * k)], fov };
};
const WIDE0 = shot([-0.1, 1.55, 6.9], { tilt: -4, fov: 48 });
// a slow push-in across P1-P3 that rises a little with the chair (review A); no ease back, the 5.0 cut steps in
const WIDE = { ...WIDE0, to: { pos: [-0.1, 1.6, 5.9], look: [WIDE0.look[0], r3(WIDE0.look[1] + 0.3), WIDE0.look[2]] }, dur: 5.0 };
const HATCH = shot([0.1, 1.35, 5.4], { tilt: -5.7, fov: 50 });   // the three flat on the lawn in the bottom third (review A)
const PX = CHAIR_END.x, PZ = CHAIR_END.z, BODY_Y = CHAIR_TOP + SEAT;      // Phoenix at the top
const GREET = shot([r3(H_END.x - 0.15), 2.75, 2.8], { pan: 3.2, tilt: -7, fov: 26 });   // a tight insert on the alien riding down (review A)
const LOOKUP = shot([r3(PX + 0.15), r3(BODY_Y + 0.62), r3(PZ + 3.95)], { tilt: -8, fov: 34 });   // the series' LOOK-UP: his eye level, the saucer and alien above
const BACKDOWN = shot([0.0, 1.6, 6.9], { tilt: -3, fov: 48 });
// v3: a close-up on the seated Wizard (front, a little from screen left so his 3/4 turn to Phoenix reads)
// back to the wide at 1.4 s (Fable B: a 1.0 s close-up, not 1.1) where its push-in had got to (inOut at 0.28 of 5 s =
// 0.088), and on to the same end by 5.0
const L3 = (p, q, k) => p.map((v, i) => r3(v + (q[i] - v) * k));
const WIDE_ON = { pos: L3(WIDE.pos, WIDE.to.pos, 0.088), look: L3(WIDE.look, WIDE.to.look, 0.088), fov: WIDE.fov, to: WIDE.to, dur: 3.6, ease: "out" };
const WIZ_CU = shot([0.3, 0.7, 3.6], { pan: -4, tilt: 0, fov: 42 });
const beats = c.beats([
  ["P1 beam", 0, WIDE, "hook"],
  ...(V3 ? [["B8 wizard close-up", 1.1, WIZ_CU, "reaction"], ["P2 lift", 1.4, WIDE_ON]] : []),
  ...(V3 ? [] : [["P2 lift", 1.5, "keep"]]),
  ["P3 tug of war", 3.2, "keep"],
  ["P4 hatch", 5.3, HATCH],   // the wide holds through the slip and the sit-down (review B)
  ["P5 greeting", 6.3, GREET],
  ["P6 peak", 7.0, LOOKUP],
  ["P7 look-up", 8.0, "keep", "payoff"],
  ["P8 back down", 9.32, BACKDOWN, "reaction"],   // cut on the beam going off, so the chair drop and the wing save play in the wide (review B)
], END);

write(import.meta.url, {
  id: V3 ? "never-looks-up-alien-v3rules" : "never-looks-up-alien",
  title: "The friend who never looks up from his phone… even during an alien abduction",
  idea: "Never Looks Up ep 3: a saucer beams Phoenix up, lawn chair and all, while his friends fight to keep him and the Astronaut begs to go; he gives the alien one 'huh.', it slams the hatch and drops the chair on the friends",
  format: "series: The friend who never looks up (fixed 8-10 s ending)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  motion: MOTION,
  cover: 8.5,
  set: { type: "env", env: ENV, night: true, shade: "soft", aperture: 0, focus: false },
  drawn: { twos: false, lines: { width: 5.4, pressure: 1.2, taper: 0.85, tint: 0.4 }, brush: { glow: 0, wrap: 0.12, cool: 0.2 }, paint: { edge: 0.35 }, paper: { grain: 0.12, wash: 0.09, pool: 0.15 } },
  music: { style: "sneaky", key: 2, lowCut: 150, gain: 0.3, parts: [{ at: 0, part: "main" }, { at: 8.0, part: "hush" }, { at: 9.15, part: "drop" }] },
  sound: { sfx: 0.7, ambience: 0.3, surface: "grass", room: "open", flaps: false, scenes: ["scifi"], signature: { entrances: false } },
  creative: { length: [END, END] },
  hook: { show: ["phx", "wiz", "rea", "ast", "ufo", "phone"], hint: 0, what: "a flying saucer's beam snaps onto Phoenix's lawn chair while he scrolls" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "phx", with: "chair", from: 0, to: T_OFF + 0.45, reason: "Phoenix sits in the lawn chair (his legs rest on its seat) until the beam drops it away from under him" },
    { who: "wiz", with: "phx", from: 2.15, to: T_BREAK + 0.1, reason: "the Wizard's gloves hold Phoenix's foot (tug of war)" },
    { who: "rea", with: "wiz", from: 1.9, to: T_BREAK + 0.9, reason: "Reaper's gloves hold the Wizard's glove (the tug-of-war chain); they get up and fall back side by side, the hat brim brushing Reaper" },
    { who: "wiz", with: "bowl", from: 0, to: 2.4, reason: "the Wizard holds the popcorn bowl in his lap, then drops it by his feet" },
    { who: "wiz", with: "pop1", from: 0, to: 2.4, reason: "popcorn kernels jump round him" },
    { who: "wiz", with: "pop2", from: 0, to: 2.4, reason: "popcorn kernels spill round him" },
    { who: "wiz", with: "blanket", from: 0, to: END, reason: "the Wizard sits on the picnic blanket" },
    { who: "rea", with: "blanket", from: 0, to: END, reason: "Reaper sits on the picnic blanket" },
    { who: "ast", with: "tele", from: 0, to: END, reason: "the Astronaut stands at his telescope" },
    ...(V3 ? [{ who: "wiz", with: "wiz", from: 2.55, to: 2.9, checks: ["face-covered"], reason: "his glove on Phoenix's rising ankle passes his own eyes as he pulls (0.2 s in the posted cut; today's eases hold it 0.3 s)" }] : []),
  // the contact checks read these windows on the video's clock: v3's 0.7 s freeze moves everything after 1.2 s later
  ].map((w) => (V3 ? { ...w, ...(w.from > 1.2 && { from: r3(w.from + 0.7) }), to: r3(Math.min(END + 1.0, w.to + 0.7)) } : w)),
  notes: "Generated by storyboards/series/never-looks-up/make-ep3-alien.mjs. Panels: PANELS-ep3-alien.md. Title added in TikTok's text tool.",
});
