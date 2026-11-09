// WHAT IF YOUR COMPETITIVE FRIEND COULD RUN AT LIGHT SPEED? (what if, episode 3; Jonny's go 9 Nov 2026 "go with the
// 2 what if videos"). The series format (video-scripts/2026-11-08-what-if/00-SERIES-FORMAT.md): one power with the
// same word, sound and look every time, three demos (the third the 10x, in slow motion; no title card), a real-fact
// twist, a closing question, 19.0 s. Jonny's eight panels win (PANELS.md next to this file: the checklist and numbers).
//   node storyboards/series/what-if/03-light-speed/make-light-speed.mjs -> light-speed.json
//   ... --no-vo -> light-speed-no-vo.json: the same clip without the commentator voiceover (renders 1-5)
//
// THE BRIEF
//   Joke:        Samurai can't stand losing, so he runs at light speed: he wins a foot race before "GO", beats Viking
//                driving a car, then takes Viking's "first one around the world!". He skids back in from behind us,
//                trophy high. For him it was two seconds; for his friends it was sixty years.
//   Wants:       Samurai wants to win; Viking wants one fair race.
//   Consequence: every race is over before it starts (Viking still crouched, the car still on the road).
//   Ending:      the real physics of moving that fast: time runs slower for him. The same road sixty years later,
//                cracked and overgrown, the car rusted; Viking and the Wizard old men with white beards. Only Reaper is
//                exactly the same (Death doesn't age). "...you won."
//   Callback:    the narrator asks the title at 0.0 ("What if your competitive friend could run at light speed?",
//                Jonny 9 Nov 14:25: "the title of the video should be spoken out at the beginning"; it replaced
//                Samurai's "Watch me win at light speed!") and asks the viewer at the end: "Would you still want to win?"
// The power: the word "GO!" (he shouts it himself), the sound (a rising electric whine and a thunder crack) and the
// look (a green light streak, his blade's colour, that flattens the wheat and blows dust, leaves and hats about).
//
// THE CLOCKS: two speed ramps (fx "ramp"): the opening stare-down under the spoken title (story 0-0.6 over OPEN_VIDEO
// s of video) and the 10x blast (story 9.4-10.0 over 1.6 s). Every time below is story time; VT() gives video time,
// ST() story time. The brief's video times (V()) are the old clock's (no opening slow motion).
//
// WORLD: the painted road (assets/environments/wheat-road-day; its twin wheat-road-old from the reveal on). x right,
// z toward the camera; the painting's camera stands at (0, 4.5, 22) looking down the road (-z), so every shot looks
// down the road. The road is about 3.3 m wide, its middle near x -0.3 from z 14 to z 0, bending to x +0.8 by z -17.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import * as act from "../../../lib/acting.mjs";
import { rigToWorld } from "../../../../engine/page/vehicle.js";
import { holdsOf, renderTime, storyTime } from "../../../../engine/shared/holds.js";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", FOCUS = false, LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
// the living world, plus one hard gust band through the painted wheat at each GO (the brief: "the wheat along his path is
// pushed flat by a moving wind volume"); the 3D wheat rows read as brown fuzz beside the painted banks, so the
// painting's own wheat carries it
const LIFE = (gos) => ({ auto: true, wind: { at: gos.map(([t, s]) => ({ t: r3(t + 0.03), s, w: 5 })) } });
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
// The commentator voiceover is on by default (Jonny 9 Nov 2026 13:07: "add the voice over we used for the other what if
// episodes. also make the voice over for this format default"); --no-vo makes the cut without it (renders 1-5)
const VO = !process.argv.includes("--no-vo");
// story seconds (19.0 s of video with the 1.0 s title freeze); with the voiceover the last shot holds 0.7 s longer, so
// the spoken closing question has room (EP01's commentator cut held 1.2 s longer)
const END = VO ? 18.7 : 18.0;
// No title card mid-video (Jonny 9 Nov 2026 14:09 on EP02: the title "is the title of the video and should not appear
// mid video"). In its place the 10x blast plays in slow motion: story 9.4-10.0 over 1.6 s of video (a speed ramp),
// so the video still runs 1.0 s longer than the story from 10.0 on, as with the old 1.0 s freeze.
const FREEZE = 10.0, HOLD = 1.0;        // the end of the slow motion (story) and the video it adds
const SLOW = { at: 9.4, len: 0.6, rate: 0.26, in: 0.25, out: 0.25 };   // 0.6 s of story in 48 frames
// The spoken title (Jonny 9 Nov 14:25) opens the clip: the narrator asks it over the stare-down in slow motion (the
// first 0.6 s of story stretched to the read plus a breath), then "Ready..." and "GO!" at full speed.
const TITLE = "What if your competitive friend could run at light speed?", TITLE_TAKE = 1, TITLE_LEN = 2.95;   // the read (s): take 1, Whisper word for word, speaker match 0.587 (take 2 0.600 runs 3.65 s)
const OPEN_VIDEO = r3(Math.ceil((TITLE_LEN + 0.25) * 30) / 30);   // the slow motion's video length
const OPEN_SLOW = { at: 0, len: 0.6, rate: r3(0.45 / (OPEN_VIDEO - 0.15)), in: 0, out: 0.3 };   // 0.6 s of story over OPEN_VIDEO
const CLOCK = holdsOf({ fps: 30, fx: [...(VO ? [{ do: "ramp", ...OPEN_SLOW }] : []), { do: "ramp", ...SLOW }] });
const VT = (story) => r3(renderTime(CLOCK, story));   // story -> video
const ST = (video) => r3(storyTime(CLOCK, video));   // video -> story
if (Math.abs(VT(FREEZE) - VT(SLOW.at) - SLOW.len - HOLD) > 0.002) throw new Error("the 10x slow motion must add exactly HOLD");
const V = (video) => r3(video <= FREEZE ? video : video - HOLD);   // a brief's video time -> story time
const VIK_VOICE = { voice: "viking" }, WIZ_VOICE = { voice: "wizard" }, SAM = { voice: false };   // Samurai speaks gibberish (subtitled)
const rad = (d) => (d * Math.PI) / 180;
// a point in front of someone at `at` facing `yaw` (0 = to us, 90 = to +x): fwd metres ahead, side metres to their
// right, y up
const front = (at, yaw, fwd, side, y) => [r3(at[0] + Math.sin(rad(yaw)) * fwd - Math.cos(rad(yaw)) * side), r3(y), r3(at[1] + Math.cos(rad(yaw)) * fwd + Math.sin(rad(yaw)) * side)];
// a cut to a new setup: put someone in place two frames before the cut (anime timing draws the cut frame on)
const setup = (t, who, at, yaw) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0 }); if (yaw != null) A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01 }); };
const hide = (t, who) => A(r3(t), who, "hide", { dur: 0 });
const show = (t, who) => A(r3(t), who, "show", { dur: 0 });

// ---------------------------------------------------------------- the scenes (hard cuts), story time
const GO1 = 0.98;                      // snap 1: "GO!" before the flag
const VICTIM = 1.62, AGAIN = 2.5;      // Viking's face; he jumps up: "AGAIN!"
const CAR = 4.0, LAUNCH = 4.45, GO2 = 4.8, CHASE = 4.85, GLARE = 6.6;   // demo 2: the car
const WORLD = 7.5, GO3 = 8.6, BLAST = 8.5;                            // demo 3: around the world
const BACK = 10.3;                     // snap 2: he's back (story; video 11.3): sixty years have gone
const OPEN = 12.1, REVEAL = 12.5;      // he opens his eyes (video 13.1, done by 12.18,  before the reveal's hidden move starts its step lead-in at 12.18: three frames of open eyes before the cut were lost on a phone, review B); the reveal wide (video 13.5)
const LINE = 13.6;                     // in on old Viking and the unchanged Reaper for "...you won." (video 14.6)
const STARE = 14.85, QUESTION = 16.6;  // the fact over his face (brief: 16.0 video); the closing two-shot (video 17.6)

// ---------------------------------------------------------------- places
const START_Z = 9.0, FIN_Z = -4.0;                       // the chalk line and the finish ribbon: 13 m of road
const SAM1 = [-0.5, 9.3], VIK1 = [0.45, 9.3];            // crouched at the line, a body-width apart
const SAM1_YAW = 75, VIK1_YAW = -75;                     // a face-off crouch: turned to each other, glaring (faces 3/4 to the camera behind them)
const WIZ1 = [-1.1, 5.4], WIZ1_YAW = 25;                // at the left verge, the flag up
const REA1 = [1.25, -3.5], REA1_YAW = -12;               // beside the right post with the trophy
const SAM_LAND = [0.75, -5.8];                           // past the ribbon (panel 02), where he stays for panel 03
const POST_R = [1.65, FIN_Z];                            // the right post (finishline w 3.3 round x 0)
const SAM2 = [0.6, 8.6];                                // demo 2: beside the car at the line
const SAM2_POST = [1.3, -3.7];                          // ...already at the finish, leaning on the right post
// demo 3, all at the finish end (the car stopped there): Samurai in front, the friends round him, the road clear in
// the middle for the streak
const SAM3 = [0.0, 1.0], VIK3 = [0.95, 0.4], WIZ3 = [-0.75, 0.4], REA3 = [1.05, 3.5];
const VIK3B = [0.65, 0.3];   // the blast frame cheats Viking half a metre in, between the two (panel 05; the challenge two-shot needs him clear of Samurai)   // panel 05: Wizard left, Viking centre right, Reaper front right
const SAMB = [0.15, 1.9];                                 // where he skids in, back from round the world
// sixty years later: they stand together now, the car where it stopped
const WIZO = [-0.95, -0.3], VIKO = [0.05, -0.9], REAO = [1.05, -0.4];
const SAMQ = [-0.55, 0.0];                              // panel 08: he has walked up to them (the Wizard steps out of frame)

// ---------------------------------------------------------------- the car (the roadster rig): parked at the line for
// demo 2, races off, slides round at the finish and stops facing us on the left, where it is still sixty years later
const CAR0 = [-0.55, 10.3], CAR_STOP = [-1.3, -2.4], STOP_YAW = 25, PIVOT = [0, 0.55, 0];
const ACC = 10, VMAX = 12;
const runDist = (u) => (u <= VMAX / ACC ? 0.5 * ACC * u * u : 0.5 * VMAX * VMAX / ACC + VMAX * (u - VMAX / ACC));
const SPIN_Z = 1.4;   // the slide starts here
const SPIN0 = (() => { let lo = LAUNCH, hi = LAUNCH + 4; for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; if (CAR0[1] - runDist(m - LAUNCH) > SPIN_Z) lo = m; else hi = m; } return lo; })();
const SPIN_LEN = 0.66;
const sm = (x) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
const HIDDEN = [0, 0, 400];     // a car not in the story yet / any more: far behind every camera (they all look down the road, -z)
function carAt(t) {
  if (t < CAR - 0.02 || t >= WORLD - 0.02) return { at: r3(t), pos: HIDDEN, yaw: 180, pitch: 0, roll: 0, steer: 0 };
  if (t < LAUNCH) {   // parked, revving: the body rocks on its springs
    const k = t > CAR + 0.12 ? 1 : 0, w = Math.sin((t - CAR) * 38) * 0.6 * k;
    return { at: r3(t), pos: [CAR0[0], 0, CAR0[1]], yaw: 180, pitch: r3(-0.5 * k + 0.3 * w), roll: r3(0.4 * w), steer: 0 };
  }
  if (t < SPIN0) {    // the launch: the nose lifts, then it runs straight down the left lane
    const u = t - LAUNCH, lift = Math.sin(Math.min(1, u / 0.5) * Math.PI) * 2.2;
    return { at: r3(t), pos: [CAR0[0], 0, r3(CAR0[1] - runDist(u))], yaw: 180, pitch: r3(-lift), roll: 0, steer: 0 };
  }
  const v0 = Math.min(VMAX, ACC * (SPIN0 - LAUNCH)), u = Math.min(1, (t - SPIN0) / SPIN_LEN);
  // the slide: the speed bleeds off evenly over the length, the back steps out (yaw 180 -> STOP_YAW the short way, by
  // the car's right), it drifts left onto the verge and leans on its outside springs
  const zSlide = CAR0[1] - runDist(SPIN0 - LAUNCH), dz = CAR_STOP[1] - zSlide;
  const zk = 1 - (1 - u) * (1 - u);   // even braking: position eases out
  const yaw = 180 + (STOP_YAW - 180) * sm(u * 1.15), x = CAR0[0] + (CAR_STOP[0] - CAR0[0]) * sm(u);
  const settle = t > SPIN0 + SPIN_LEN ? Math.exp(-(t - SPIN0 - SPIN_LEN) * 7) * Math.sin((t - SPIN0 - SPIN_LEN) * 22) : 0;
  return { at: r3(t), pos: [r3(x), 0, r3(zSlide + dz * zk)], yaw: r3(yaw), pitch: r3(1.8 * Math.sin(u * Math.PI) + 1.2 * settle), roll: r3(-3.5 * Math.sin(u * Math.PI) + 0.8 * settle), steer: r3(u < 1 ? -30 * Math.sin(u * Math.PI) : 0), v0: undefined };
}
const keys = []; for (let f = 0; f <= Math.round(END * 30); f++) { const k = carAt(f / 30); delete k.v0; k.at = f / 30; keys.push(k); }   // exact frame times: the frame lands on its key, never between two keys either side of a jump
const rig = { id: "car", kind: "roadster", color: "#d8342c", pivot: PIVOT, keys };
// the same car sixty years later, where it stopped: rust, flat tyres, grass round it
// one key a frame, like the young car: rig keys are a smooth spline (engine/page/vehicle.js hermite), so two far-apart
// keys either side of a jump overshoot by hundreds of metres between them
const oldKeys = []; for (let f = 0; f <= Math.round(END * 30); f++) { const t = f / 30, on = t >= REVEAL - 0.03; oldKeys.push({ at: t, pos: on ? [CAR_STOP[0], 0, CAR_STOP[1]] : HIDDEN, yaw: on ? STOP_YAW : 180, pitch: 0, roll: 0, steer: 0 }); }
const rigOld = { id: "carold", kind: "roadster", color: "#d8342c", pivot: PIVOT, rust: 1, keys: oldKeys };
const W = (t, q) => rigToWorld(rig, t, q).map(r3);
console.log(`car: launch ${LAUNCH}, slide ${r3(SPIN0)}-${r3(SPIN0 + SPIN_LEN)} from z ${r3(CAR0[1] - runDist(SPIN0 - LAUNCH))} at ${r3(Math.min(VMAX, ACC * (SPIN0 - LAUNCH)))} m/s, stops at ${CAR_STOP}`);
const SEAT_Y = 0.18, SEAT_Z = -0.32, DRV_X = 0.47, PAS_X = -0.47;   // car frame: x its left, z its front (the driver on its left)

// ---------------------------------------------------------------- cast
const cast = [
  { id: "sam", character: "duo/samurai", at: SAM1, face: SAM1_YAW, expr: "focused", follow: 0.3, seed: 2.6 },
  { id: "vik", character: "always-orders-potatoes/viking", at: VIK1, face: VIK1_YAW, expr: "angry", follow: 0.3, seed: 3.1 },
  { id: "wiz", character: "never-has-money/wizard", at: WIZ1, face: WIZ1_YAW, expr: "kind", follow: 0.3, seed: 1.4 },
  { id: "rea", character: "never-has-money/reaper", at: REA1, face: REA1_YAW, expr: "deadpan", follow: 0.3, seed: 3.3 },
  // Viking at the wheel (demo 2): the same Viking riding the car (a rider is its own cast entry)
  { id: "vikc", character: "always-orders-potatoes/viking", rig: "car", at: [DRV_X, r3(SEAT_Z + 0.03)], face: "camera", expr: "angry", seed: 3.1, shadowFall: 0.001, follow: 0.4,
    belt: { side: "L" }, arms: { R: { prop: "wheel", grip: "R" }, L: { prop: "wheel", grip: "L" } }, grip: { R: "hold", L: "hold" } },
  // sixty years later
  { id: "viko", character: "what-if/viking-old", at: VIKO, face: 0, expr: "tired", follow: 0.3, seed: 5.2 },
  { id: "wizo", character: "what-if/wizard-old", at: WIZO, face: 10, expr: "tired", follow: 0.3, seed: 4.4 },
];
for (const w of ["vikc", "viko", "wizo"]) hide(0, w);
A(0, "vikc", "sit", { seat: "seatD", dur: 0, hands: "keep" });

// ---------------------------------------------------------------- props
const TROPHY0 = front(REA1, REA1_YAW, 0.42, 0.2, 0.42);   // in Reaper's right glove at his chest
const props = [
  { id: "chalk", kind: "chalkline", x: -0.15, z: START_Z, w: 3.7, age: 0 },
  { id: "finish", kind: "finishline", x: 0, z: FIN_Z, w: 3.3, cut: 0.25, snap: 0, wave: 0, age: 0 },
  { id: "trophy", kind: "trophy", x: TROPHY0[0], y: TROPHY0[1], z: TROPHY0[2], rot: REA1_YAW, glint: 0 },
  { id: "flag", kind: "startflag", ...(() => { const p = front(WIZ1, WIZ1_YAW, 0.18, 0.3, 0.62); return { x: p[0], y: p[1], z: p[2] }; })(), rot: WIZ1_YAW, wave: 0 },
  // the power's look, one streak per firing (each runs from its origin along -z, turned by rot)
  { id: "st1", kind: "lightstreak", x: SAM1[0], z: r3(SAM1[1] - 0.15), len: 16, head: 0, tail: 0, glow: 1, sparks: 1, clock: 0, ...aim(SAM1, SAM_LAND) },
  { id: "st2", kind: "lightstreak", x: SAM2[0], z: r3(SAM2[1] - 0.15), len: 14, head: 0, tail: 0, glow: 0, sparks: 0, clock: 0, ...aim(SAM2, SAM2_POST) },
  // the 10x runs from under the blast camera (panel 05: a green band from the bottom edge to the horizon), passing
  // through his start spot; rot -1.5 bends it with the road, so it starts 0.16 m left to cross x 0 at his feet
  { id: "st3", kind: "lightstreak", x: -0.16, z: 7.0, len: 86, w: 0.7, head: 0, tail: 0, glow: 0, sparks: 0, clock: 0, rot: -1.5 },
  { id: "sp3", kind: "lightstreak", x: SAM3[0], z: r3(SAM3[1] - 0.15), len: 1, head: 0, tail: 0, glow: 0, sparks: 0, clock: 0 },   // only its sparks: at his feet
  // the way back: in from behind the camera (rot 180: it runs toward us)
  { id: "st4", kind: "lightstreak", x: SAMB[0], z: r3(SAMB[1] - 1.0), len: 14, head: 0, tail: 0, glow: 0, sparks: 0, clock: 0, rot: 180 },
  // the car's seats and wheel (they ride in it)
  { id: "seatD", kind: "carseat", rig: "car", x: DRV_X, y: SEAT_Y, z: SEAT_Z, head: false, color: "#7a2620", trim: "#4a1612" },
  { id: "wheel", kind: "steer", rig: "car", x: DRV_X, y: 0.9, z: 0.25, tip: 34 },
  // the old men's sticks (off the road until the reveal)
  { id: "stickV", kind: "walkingstick", style: "crook", x: 6, z: 30, rot: 0 },
  { id: "stickW", kind: "walkingstick", style: "knob", x: 7, z: 30, rot: 0 },
  // sixty years later: wild grass with white flowers through the cracks in the foreground (panel 07); under the road
  // until the world ages
  ...[[-0.95, 1.2, 1], [0.6, 1.0, 2], [0.95, 1.8, 3], [-0.55, 2.2, 4]].map(([x, z, k]) => ({ id: `weeds${k}`, kind: "weeds", x, y: -3, z, seed: k, h: 0.26 + 0.05 * (k % 2), flowers: 2 + (k % 2), rot: 40 * k })),
];
// a streak's turn so it runs from a to b, and its length
function aim(a, b) { const dx = b[0] - a[0], dz = b[1] - a[1]; return { rot: r3((Math.atan2(-dx, -dz) * 180) / Math.PI) }; }
// the param keys props3d has no default for start at their spec value (seeded at 0 with a dur-0 set: props-race.js)
c.prop(0, "finish", { snap: 0, wave: 0, age: 0 }, 0, "linear");
c.prop(0, "finish", { wave: END }, END, "linear");
c.prop(0, "flag", { wave: 0 }, 0, "linear"); c.prop(0, "flag", { wave: END }, END, "linear");
c.prop(0, "trophy", { glint: 0 }, 0, "linear");
for (const id of ["st1", "st2", "st3", "st4", "sp3"]) { c.prop(0, id, { clock: 0, head: 0, sparks: id === "st1" ? 1 : 0 }, 0, "linear"); c.prop(0, id, { clock: END }, END, "linear"); }

// the power, the same every time: sparks crackle at his feet and the whine rises, he shouts GO!, the thunder crack,
// and the streak runs to where he already is. head 0 -> 1 in two frames, then it fades from its tail
function power(t, id, { sparksFrom, big = 1, whine = true, fade, gopos = 470, air = "whoosh" } = {}) {
  if (sparksFrom != null) { c.prop(r3(sparksFrom), id, { glow: 1 }, 0, "linear"); c.prop(r3(sparksFrom), id, { sparks: 1 }, 0.2, "out"); }
  if (whine) sfx(r3(t - 0.5), "charge", { gain: 0.45 * big, reason: "the power: the rising electric whine before he goes" });
  c.say(t, "sam", "GO!", 0.3, "excited", { ...SAM, sub: false });
  cap(t, r3(t + 0.55), "GO!", gopos, true, { size: 96 });   // a shouted word: a text pop, the same every time
  sfx(t + 0.03, "firework", { gain: Math.min(1.4, 0.95 * big), loud: true, reason: "the power: the thunder crack as he goes" });
  if (air) sfx(t + 0.03, air, { gain: 0.7, reason: air === "whoosh" ? "the air behind the streak" : "the streak itself, an electric zap (the second time, so the air sound does not repeat)" });
  c.prop(r3(t + 0.03), id, { head: 1, sparks: 0 }, 0.067, "linear");
  const f = fade ?? t + 0.1;   // the streak hangs in the air till f, then fades from its tail
  c.prop(r3(f), id, { tail: 1 }, 0.9, "in");
  c.prop(r3(f + 0.35), id, { glow: 0 }, 0.6, "inOut");
  c.at(r3(t + 0.03), { fx: "shake", dur: 0.25, amp: 0.025 * big });
}
// he vanishes on the streak's first frame and is drawn again where it ends
function zip(t, to, yaw, { y = 0 } = {}) {
  hide(r3(t + 0.03), "sam");
  A(r3(t + 0.04), "sam", "move", { to, dur: 0.01, steps: 0, ...(y && { y }) });
  if (yaw != null) A(r3(t + 0.04), "sam", "turn", { to: yaw, dur: 0.01 });
  show(r3(t + 0.1), "sam");
}

// ================================================================ 1 THE START 0-1.62 (panels 01 and 02)
// Frame 0: both crouched at the chalk line, glaring at each other; green sparks already crackle at Samurai's feet and
// the whine is rising. The Wizard holds the flag up; down the road Reaper holds the trophy at the ribbon.
// "Watch me win at light speed!" at 0.0 (the matched opening: Jonny's title, this subtitle and frame 0 say the same).
const CROUCH = (who, at, yaw) => {
  A(0, who, "crouch", { to: 1, dur: 0.01 }); A(0, who, "pitch", { to: 18, dur: 0.01 });
  for (const [s, sd] of [["R", 0.17], ["L", -0.17]]) { c.arm(0, who, s, { world: front(at, yaw, 0.3, sd, 0.06) }, 0.01); A(0, who, "grip", { side: s, shape: "flat", dur: 0.01 }); }
};
CROUCH("sam", SAM1, SAM1_YAW); CROUCH("vik", VIK1, VIK1_YAW);
A(0, "sam", "look", { to: [0.05, 0.05], dur: 0.01, blink: false }); A(0, "sam", "expr", { expr: "cocky", set: { smirk: 0.5, curve: 0.5 }, dur: 0.01 });
A(0, "vik", "look", { to: [-0.05, 0.05], dur: 0.01, blink: false }); act.mood(c, 0, "vik", "angry", { hold: 0.7 });
// the Wizard: the flag up in his right glove
c.arm(0, "wiz", "R", { prop: "flag", grip: "stick" }, 0.01); A(0, "wiz", "grip", { side: "R", shape: "fist", dur: 0.01 });
A(0, "wiz", "grab", { prop: "flag", hand: "R", grip: "stick", dur: 0, pose: null });
c.arm(0, "wiz", "R", { prop: "flag", grip: "stick", at: front(WIZ1, WIZ1_YAW, 0.12, 0.3, 0.92) }, 0.01);
A(0, "wiz", "look", { to: [0.5, -0.05], dur: 0.01, blink: false }); A(0, "wiz", "expr", { expr: "focused", dur: 0.01 });
// Reaper: the trophy at his chest
c.arm(0, "rea", "R", { prop: "trophy", grip: "stem" }, 0.01); A(0, "rea", "grip", { side: "R", shape: "fist", dur: 0.01 });
A(0, "rea", "grab", { prop: "trophy", hand: "R", grip: "stem", dur: 0, pose: null });
A(0, "rea", "look", { to: [-0.2, 0.0], dur: 0.01, blink: false });
sfx(0, "charge", { gain: 0.4, reason: "frame 0: the green sparks crackling at Samurai's feet, the power building" });
// with the voiceover the narrator's spoken title has the opening (Samurai's promise goes), over the stare-down in
// slow motion; the plain cut keeps his line at full speed
if (VO) c.at(OPEN_SLOW.at, { fx: "ramp", ...OPEN_SLOW });
else c.say(0, "sam", "Watch me win at light speed!", 0.72, "excited", { ...SAM, pos: 470 });   // under the top 20 % (the in-app title)
c.say(0.74, "wiz", "Ready...", 0.3, "calm", { ...WIZ_VOICE, pos: 470 });
c.captions[c.captions.length - 1].to = r3(GO1 - 0.02);
A(0.62, "vik", "expr", { expr: "focused", set: { open: 0.1 }, dur: 0.12 });   // he starts to answer the Wizard's "Ready"
see(0, GO1, ["sam.face", "vik.face", "wiz", "rea", "trophy", "finish", "chalk"], "frame 0: the race (line, ribbon, trophy) and the competitive friend glaring, sparks at his feet");
// SNAP 1: GO before the flag. The streak runs past the ribbon; he is in the air beyond it with the trophy held high
power(GO1, "st1", { gopos: 720 });   // under him: he is in the air past the ribbon at 470
zip(GO1, SAM_LAND, -20, { y: 0.55 });
A(r3(GO1 + 0.04), "sam", "crouch", { to: 0, dur: 0.01 }); A(r3(GO1 + 0.04), "sam", "pitch", { to: -6, dur: 0.01 });
const UP_O = { o: [0.12, 0.95, 0.12] };   // the trophy held high in his right glove, body-relative (it rides with him)
c.arm(r3(GO1 + 0.04), "sam", "R", UP_O, 0.01); A(r3(GO1 + 0.04), "sam", "grip", { side: "R", shape: "fist", dur: 0.01 });
A(r3(GO1 + 0.05), "sam", "grab", { prop: "trophy", hand: "R", grip: "stem", dur: 0, pose: null });
c.arm(r3(GO1 + 0.04), "sam", "L", { o: [0.18, 0.62, 0.2] }, 0.01); A(r3(GO1 + 0.04), "sam", "grip", { side: "L", shape: "fist", dur: 0.01 });
A(r3(GO1 + 0.04), "sam", "expr", { expr: "delighted", set: { curve: 1, open: 0.55 }, dur: 0.01 }); A(r3(GO1 + 0.04), "sam", "face", { lid: 1, dur: 0.01 });
A(r3(GO1 + 0.12), "sam", "move", { to: SAM_LAND, y: 0, dur: 0.22, ease: "in", steps: 0 });
act.landDust(c, r3(GO1 + 0.34), SAM_LAND);
sfx(r3(GO1 + 0.34), "land", { gain: 1.4, loud: true, reason: "he lands past the ribbon (lifted: it has to cut through the bed on a phone)" });
A(r3(GO1 + 0.34), "sam", "squash", { amount: 0.12, dur: 0.18 });
c.prop(r3(GO1 + 0.32), "trophy", { glint: 1 }, 0.1, "out"); c.prop(r3(GO1 + 0.62), "trophy", { glint: 0 }, 0.3, "inOut");   // the far win reads (review A)
// the ribbon snaps as the streak goes through; Reaper's glove is empty
c.prop(r3(GO1 + 0.06), "finish", { snap: 1 }, 0.35, "out");
sfx(r3(GO1 + 0.06), "slap", { gain: 0.35, reason: "the finish ribbon snapping" });
// his empty glove stays up where the trophy was until the cut (deadpan): a drop to rest before his hide either
// moved 27-32 cm in one frame or, longer, was drawn past the hide (anime timing front-loads a key); the arm goes
// to rest while he is hidden (WORLD)
A(r3(GO1 + 0.05), "rea", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
A(r3(GO1 + 0.4), "rea", "look", { to: [-0.6, 0.0], dur: 0.15, blink: false });
// the wheat beside the streak bends flat away from it: a gust band on the painted wheat (set.life wind "at", below)
c.at(r3(GO1 + 0.05), { fx: "poof", pos: [SAM1[0], 0.05, SAM1[1]], dur: 0.6, color: "#e9d8c0", puffs: 10, sparks: 0, size: 0.5, lift: 0.1 });
// Viking stays crouched, mouth open on his "Ready"; the Wizard's flag still up
A(r3(GO1 + 0.08), "vik", "expr", { expr: "shocked", set: { open: 0.45, eye: 1.2 }, dur: 0.1 });
A(r3(GO1 + 0.12), "vik", "look", { to: [-0.3, 0.1], dur: 0.15, blink: false });
A(r3(GO1 + 0.15), "wiz", "expr", { expr: "shocked", set: { open: 0.2 }, dur: 0.15 });
see(r3(GO1 + 0.1), r3(VICTIM - 0.02), ["sam", "trophy", "vik", "wiz"], "panel 02: he is already past the ribbon with the trophy high; Viking still crouched");

// ================================================================ 2 THE VICTIM 1.62-2.5
// Viking, still crouched, turns his head to us (a look to the camera) and goes red
A(r3(VICTIM - 0.02), "vik", "turn", { to: -20, dur: 0.01, ease: "linear", sync: true });   // turned to us on the cut (review B: turning after it, the cut landed on his hair)
A(r3(VICTIM + 0.05), "vik", "look", { to: [0.0, 0.0], dur: 0.2, blink: false });
A(r3(VICTIM + 0.05), "vik", "pitch", { to: 6, dur: 0.25 });
// (all done by 2.17: the AGAIN turn's feet start stepping at 2.2, 0.3 s before the cut, and a key still front-loading
// then stepped Viking back a drawing, the draft check's pop at 2.17 s)
A(r3(VICTIM + 0.25), "vik", "skin", { color: "#e2533c", to: 0.42, dur: 0.3 });
act.mood(c, r3(VICTIM + 0.25), "vik", "angry", { hold: 0.5 });
A(r3(VICTIM + 0.25), "vik", "squash", { amount: 0.05, dur: 0.3 });
sfx(r3(VICTIM + 0.35), "sizzle", { gain: 0.35, reason: "Viking going red, steaming" });
see(r3(VICTIM + 0.1), r3(AGAIN - 0.02), ["vik.face"], "the victim: Viking still crouched, going red");

// ================================================================ 3 AGAIN! 2.5-4.0 (panel 03)
// Viking jumps up, points down the road at Samurai, who stands calm at the right post with the trophy, eyes shut
hide(r3(VICTIM - 0.02), "rea");   // panels 03-04 have no Reaper
A(AGAIN, "vik", "crouch", { to: 0, dur: 0.15 }); A(r3(AGAIN - 0.02), "vik", "pitch", { to: 0, dur: 0.01, sync: true });   // upright on the cut (review B: pitched forward, the cut landed on the top of his head)
A(AGAIN, "vik", "turn", { to: 35, dur: 0.25 });   // (turned on the cut, his feet stepped through the victim shot: a turn's steps start 0.3 s early)
A(AGAIN, "vik", "hop", { height: 0.12, dur: 0.3 });
// his left glove is off the road by the cut (the road at his feet is below this frame), then points: from flat on the
// road the glove turned over 84-131° in one drawing on screen
c.arm(r3(AGAIN - 0.02), "vik", "L", { o: [0.38, 0.55, 0.16] }, 0.01); A(r3(AGAIN - 0.02), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
c.arm(r3(AGAIN + 0.22), "vik", "L", { o: [0.42, 0.62, 0.1] }, 0.35, "inOut"); A(r3(AGAIN + 0.25), "vik", "grip", { side: "L", shape: "point", dur: 0.25 });
c.arm(r3(AGAIN + 0.1), "vik", "R", { o: [0.12, 0.36, 0.16] }, 0.25, "inOut"); A(r3(AGAIN + 0.1), "vik", "grip", { side: "R", shape: "fist", dur: 0.15 });
A(r3(AGAIN + 0.12), "vik", "look", { to: [0.55, 0.05], dur: 0.12, blink: false });
A(AGAIN, "vik", "face", { lid: 0, dur: 0.08 }); A(AGAIN, "vik", "skin", { to: 0.6, dur: 0.15 });   // the shout: eyes wide, redder (review A: lids 0.46 read sulky)
A(r3(AGAIN + 0.1), "vik", "expr", { expr: "angry", set: { open: 0.8 }, dur: 0.1 }); A(r3(AGAIN + 0.8), "vik", "expr", { expr: "angry", set: { open: 0.25 }, dur: 0.3 });
c.say(r3(AGAIN + 0.2), "vik", "AGAIN!", 0.55, "angry", { ...VIK_VOICE, sub: false, amp: 1.6 });   // amp: a shout, not a small "o" (review B)
c.textPop(r3(AGAIN + 0.2), "vik", "AGAIN!", { dur: 0.8, color: "speaker", size: 130 });   // his shout slammed beside his head (one of two pops)
A(r3(AGAIN + 0.9), "vik", "skin", { to: 0.2, dur: 0.45 });   // done by 3.85: anime timing front-loads a key, and a 0.8 s fade drew him past his 3.98 hide at 3.8 (he vanished 0.2 s before the cut)
// Samurai at the post: calm, eyes shut, the trophy at his chest
setup(VICTIM, "sam", SAM_LAND, -15);
c.arm(r3(VICTIM - 0.02), "sam", "R", { o: [0.02, 0.45, 0.34] }, 0.01);   // the trophy at his chest
c.arm(r3(VICTIM - 0.02), "sam", "L", "rest", 0.01); A(r3(VICTIM - 0.02), "sam", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
A(r3(VICTIM - 0.02), "sam", "expr", { expr: "smug", set: { curve: 0.55 }, dur: 0.01 }); A(r3(VICTIM - 0.02), "sam", "face", { lid: 1, dur: 0.01 });
see(r3(AGAIN + 0.2), r3(CAR - 0.02), ["vik.face", "sam", "trophy"], "panel 03: Viking pointing, furious; Samurai calm with the trophy");

// ================================================================ 4 DEMO 2: EVEN AGAINST A CAR? 4.0-7.5 (panel 04)
// Viking at the wheel of the red roadster at the line, revving and glaring; Samurai beside it, bored, the trophy at
// his side. The car goes; then GO!: Samurai is already at the finish, leaning on the post, yawning, as the car
// arrives and slides round in a cloud of dust. Viking glares through the windscreen.
hide(r3(CAR - 0.02), "vik"); show(r3(CAR - 0.02), "vikc");
hide(r3(CAR - 0.02), "wiz");   // panel 04 has neither: they watch from the verge
c.prop(r3(CAR - 0.03), "finish", { snap: 0 }, 0, "linear");   // the ribbon tied up again between races
setup(CAR, "sam", SAM2, -70);
c.arm(r3(CAR - 0.02), "sam", "R", { o: [0.1, 0.3, 0.2] }, 0.01);   // the trophy at his side
A(r3(CAR - 0.02), "sam", "expr", { expr: "bored", set: { curve: 0.2 }, dur: 0.01 }); A(r3(CAR - 0.02), "sam", "face", { lid: 0.45, dur: 0.01 });
A(r3(CAR - 0.02), "sam", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
A(r3(CAR - 0.02), "vikc", "look", { to: [-0.7, 0.0], dur: 0.01, blink: false }); A(r3(CAR - 0.02), "vikc", "expr", { expr: "angry", dur: 0.01 });
A(r3(CAR - 0.02), "vikc", "skin", { color: "#e2533c", to: 0.15, dur: 0.01 });
cap(CAR, r3(GO2 - 0.02), "Even against a car?", 470);
sfx(r3(LAUNCH + 0.02), "screech", { gain: 0.5, reason: "the wheels spinning as the roadster launches" });
sfx(r3(LAUNCH + 0.02), "tyres", { gain: 0.6, dur: 1.9, reason: "the tyres on the dirt road" });
c.at(r3(LAUNCH + 0.02), { fx: "poof", pos: [CAR0[0], 0.05, r3(CAR0[1] + 1.3)], dur: 0.9, color: "#e9d8c0", puffs: 14, sparks: 0, size: 0.8, lift: 0.15 });
A(r3(LAUNCH + 0.02), "vikc", "pitch", { to: -8, dur: 0.15 }); A(r3(LAUNCH + 0.4), "vikc", "pitch", { to: 0, dur: 0.4 });
// Samurai: a yawn, then GO
A(r3(LAUNCH + 0.05), "sam", "look", { to: [0.0, 0.0], dur: 0.12, blink: false });
c.prop(r3(GO2 - 0.35), "st2", { glow: 1 }, 0, "linear"); c.prop(r3(GO2 - 0.35), "st2", { sparks: 1 }, 0.2, "out");
power(GO2, "st2", { big: 1.15, air: "zap" });
zip(GO2, SAM2_POST, -35);
c.arm(r3(GO2 + 0.04), "sam", "R", { o: [0.1, 0.3, 0.2] }, 0.01);
// leaning on the right post, yawning, eyes shut (his left glove to his mouth)
A(r3(GO2 + 0.04), "sam", "lean", { to: -9, dur: 0.01 });
c.arm(r3(GO2 + 0.04), "sam", "L", { o: [0.06, 0.55, 0.3] }, 0.01); A(r3(GO2 + 0.04), "sam", "grip", { side: "L", shape: "flat", dur: 0.01 });
A(r3(GO2 + 0.04), "sam", "expr", { expr: "bored", set: { open: 0.75, curve: -0.1 }, dur: 0.01 }); A(r3(GO2 + 0.04), "sam", "face", { lid: 1, dur: 0.01 });
A(r3(GO2 + 0.9), "sam", "expr", { expr: "smug", set: { open: 0.1, curve: 0.45 }, dur: 0.3 });
// the slide at the finish
sfx(r3(SPIN0), "screech", { gain: 0.85, loud: true, reason: "the roadster sliding round at the finish" });
sfx(r3(SPIN0), "tyres", { gain: 0.8, dur: SPIN_LEN, reason: "gravel under the sliding tyres" });
c.at(r3(SPIN0 + 0.1), { fx: "poof", pos: [CAR_STOP[0] + 0.3, 0.05, CAR_STOP[1] + 0.8], dur: 0.7, color: "#e9d8c0", puffs: 18, sparks: 0, size: 1.1, lift: 0.2 });
A(r3(SPIN0 + 0.05), "vikc", "lean", { to: 12, dur: 0.25 }); A(r3(SPIN0 + SPIN_LEN), "vikc", "lean", { to: 0, dur: 0.3, ease: "settle" });
see(r3(CHASE + 0.1), r3(GLARE - 0.02), ["vikc", "sam", "finish"], "panel 04: the car races off; Samurai is already at the ribbon, yawning");
// the glare through the windscreen
A(r3(GLARE - 0.02), "vikc", "look", { to: [0.75, 0.05], dur: 0.01, blink: false }); act.mood(c, GLARE, "vikc", "angry", { hold: 0.4 });
A(r3(GLARE + 0.1), "vikc", "skin", { to: 0.4, dur: 0.3 });
A(r3(GLARE + 0.15), "sam", "face", { lidR: 0.0, dur: 0.1 });   // one eye opens at him
see(r3(GLARE + 0.05), r3(WORLD - 0.02), ["vikc.face", "sam.face"], "Viking glares at Samurai through the windscreen");

// ================================================================ 5 DEMO 3: AROUND THE WHOLE WORLD? 7.5-10.3 (panel 05)
// Viking out of the car: "First one around the world!", pointing down the road at the horizon. Samurai shrugs, turns
// to the road; sparks; GO!: the biggest crack, the streak to the horizon, the wheat flattened in a line, the Wizard's
// hat and Viking's cape blown back, dust and leaves; everyone shields their faces. Its last 0.6 s play in slow motion.
hide(r3(WORLD - 0.02), "vikc"); show(r3(WORLD - 0.02), "vik"); show(r3(WORLD - 0.02), "wiz");
c.at(r3(WORLD - 0.03), { do: "prop", id: "seatD", set: { y: -3 }, dur: 0, ease: "linear", reason: "put away under the road at a cut (only the driver needed it), not a fall" });
show(r3(BLAST - 0.02), "rea");   // out of the challenge two-shot; in the blast frame (panel 05, front right)
setup(WORLD, "vik", VIK3, -35); setup(BLAST, "vik", VIK3B, -20); setup(WORLD, "sam", SAM3, 60); setup(WORLD, "wiz", WIZ3, 25); setup(WORLD, "rea", REA3, -20);
A(r3(WORLD - 0.02), "vik", "skin", { to: 0.25, dur: 0.01 });
c.arm(r3(WORLD - 0.02), "rea", "R", "rest", 0.01);
A(r3(WORLD - 0.02), "rea", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
// the flag is put away (he lays it at his feet)
c.arm(r3(WORLD - 0.02), "wiz", "R", "rest", 0.01); A(r3(WORLD - 0.03), "wiz", "release", { prop: "flag", to: [WIZ3[0] - 0.4, 0, WIZ3[1] - 0.3], dur: 0.01 });
A(r3(WORLD - 0.02), "wiz", "look", { to: [0.6, 0.0], dur: 0.01, blink: false }); A(r3(WORLD - 0.02), "wiz", "expr", { expr: "worried", dur: 0.01 });
c.arm(r3(WORLD - 0.02), "sam", "R", { o: [0.08, 0.3, 0.16] }, 0.01);   // the trophy low at his side
c.arm(r3(WORLD - 0.02), "sam", "L", "rest", 0.01); A(r3(WORLD - 0.02), "sam", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
A(r3(WORLD - 0.02), "sam", "lean", { to: 0, dur: 0.01 });
A(r3(WORLD - 0.02), "sam", "look", { to: [0.75, 0.0], dur: 0.01, blink: false }); A(r3(WORLD - 0.02), "sam", "expr", { expr: "smug", dur: 0.01 }); A(r3(WORLD - 0.02), "sam", "face", { lid: 0.3, dur: 0.01 });
cap(WORLD, r3(GO3 - 0.05), "Around the whole world?", 470);
// Viking: the challenge, his left arm flung out down the road behind him
A(r3(WORLD + 0.08), "vik", "expr", { expr: "angry", set: { open: 0.4 }, dur: 0.15 });
c.arm(r3(WORLD + 0.12), "vik", "L", { o: [0.34, 0.68, -0.05] }, 0.25, "out"); A(r3(WORLD + 0.12), "vik", "grip", { side: "L", shape: "point", dur: 0.15 });
A(r3(WORLD + 0.12), "vik", "look", { to: [-0.2, 0.05], dur: 0.12, blink: false });
c.say(r3(WORLD + 0.15), "vik", "First one around the world!", 1.2, "excited", { ...VIK_VOICE, pos: 1200 });   // under their feet (the demo caption is above)
// Samurai: one raised brow, a shrug of a smile, then he turns to the road
A(r3(WORLD + 0.7), "sam", "expr", { expr: "smug", set: { raise: 0.05, curve: 0.6, smirk: 0.5 }, dur: 0.2 });
A(r3(GO3 - 1.0), "sam", "look", { to: [-0.3, 0.0], dur: 0.12, blink: false });
A(r3(BLAST - 0.02), "sam", "turn", { to: 178, dur: 0.01, ease: "linear", sync: true });   // sync: the motion layer may not stagger it past the cut   // cut on the turn: in the blast frame he already has his back to us (turning on screen swung his hands 30 cm a frame)

c.arm(r3(BLAST - 0.02), "vik", "L", "rest", 0.01); A(r3(BLAST - 0.02), "vik", "grip", { side: "L", shape: "relaxed", dur: 0.01 });   // down by the cut
c.prop(r3(GO3 - 0.4), "st3", { glow: 0.55 }, 0, "linear");   // a green core, not a white one (review B: the cover's streak read white) c.prop(r3(GO3 - 0.4), "sp3", { glow: 1 }, 0, "linear"); c.prop(r3(GO3 - 0.4), "sp3", { sparks: 1 }, 0.2, "out");
c.prop(r3(FREEZE + 0.02), "sp3", { sparks: 0 }, 0.4, "inOut");   // the sparks crackle on where he stood through the slow motion
power(GO3, "st3", { big: 1.45, fade: r3(FREEZE + 0.02), air: null });   // the boom and the wind swell are its air   // still blazing through the slow motion
hide(r3(GO3 + 0.03), "sam"); A(r3(GO3 + 0.04), "sam", "move", { to: [0.15, 40], dur: 0.01, steps: 0 });
sfx(r3(GO3 + 0.03), "impact", { gain: 1.6, loud: true, reason: "the biggest crack: a deep boom under it (the 10x)" });
sfx(r3(GO3 + 0.05), "windswell", { gain: 0.8, dur: 1.3, reason: "the blast of air down the road behind him" });
sfx(r3(GO3 + 0.1), "leafrustle", { gain: 0.5, reason: "the wheat and leaves thrashing" });
c.prop(r3(GO3 + 0.03), "finish", { snap: 0 }, 0, "linear");   // (mended after demo 1; it snaps again)
c.prop(r3(GO3 + 0.12), "finish", { snap: 1 }, 0.3, "out");
// the dust rises in his wake, just behind the friends (in front of them it fogged their faces), panel 05; no ground
// ring: from this low camera it read as a thin cyan line across the road
c.at(r3(GO3 + 0.05), { fx: "poof", pos: [SAM3[0], 0.1, r3(SAM3[1] - 1.4)], dur: 1.4, color: "#e9d8c0", puffs: 22, sparks: 0, size: 1.0, lift: 0.4 });
// the blast (panel 05): Viking screws his eyes shut behind his forearm, the Wizard's hat flies off and he grabs after
// it, wide-eyed; the Reaper does not move a muscle (only his cloak and a slow blink: he has seen faster)
// Viking has learnt: he is already braced behind his forearm when the blast frame cuts in (no arm thrown up on screen)
A(r3(BLAST - 0.02), "vik", "arm", { side: "R", pose: { o: [-0.14, 0.6, 0.46] }, dur: 0.01, sync: true });   // the forearm across in front of his face A(r3(BLAST - 0.02), "vik", "grip", { side: "R", shape: "flat", dur: 0.01, sync: true });
A(r3(GO3 + 0.04), "vik", "expr", { expr: "shocked", set: { open: 0.55, curve: -0.6 }, dur: 0.1 }); A(r3(GO3 + 0.06), "vik", "face", { lid: 1, dur: 0.1 });   // screwed shut
A(r3(GO3 + 0.04), "vik", "pitch", { to: -10, dur: 0.25 });
A(r3(GO3 + 0.08), "wiz", "expr", { expr: "shocked", set: { eye: 1.3, open: 0.7, curve: -0.4 }, dur: 0.1 });
A(r3(GO3 + 0.06), "wiz", "pitch", { to: -8, dur: 0.25 });
c.arm(r3(GO3 + 0.2), "wiz", "R", { o: [0.22, 1.02, 0.05] }, 0.8, "inOut"); A(r3(GO3 + 0.2), "wiz", "grip", { side: "R", shape: "open", dur: 0.2 });   // grabbing after the hat
A(r3(GO3 + 0.06), "wiz", "hat", { off: [-0.05, 0.75, -0.6], spin: [-25, 30, 40], dur: 2.0, ease: "out", quiet: true });   // still in the air in the slow motion, the cone still reads as a hat
A(r3(GO3 + 0.1), "rea", "pitch", { to: -3, dur: 0.3 });
A(r3(GO3 + 0.4), "rea", "face", { lid: 0.5, dur: 0.3 });
A(r3(GO3 + 0.04), "vik", "lean", { to: 6, dur: 0.15 });
see(r3(GO3 + 0.1), FREEZE, ["st3", "wiz.face", "vik.face", "rea"], "panel 05: the streak to the horizon, the wheat flattened, the friends shielding their faces");
// the 10x blast in slow motion (the old title card's place; no title mid-video): the streak, the flying hat, the
// shielded faces, the sparks, 0.6 s of story over 1.6 s of video
c.at(SLOW.at, { fx: "ramp", ...SLOW });

// ================================================================ 6 SNAP 2: BACK 10.3-12.5 (panel 06)
// He went round the planet: the streak comes in from behind the camera and Samurai skids to a stop facing us in a
// spray of dust, the trophy high, eyes shut, laughing: "WON!" The fanfare. He soaks it in. Sixty years have gone.
const SWAP = BACK;   // the cast is sixty years older from the moment he is back (they are out of his shots till the reveal)
// the world shows its age only at the reveal cut, when he opens his eyes: Jonny's panel 06 has the golden wheat and the
// blue sky behind him, so the WON! close-up keeps the young road and the twist lands on one cut (07)
const AGE = REVEAL;
hide(r3(SWAP - 0.02), "vik"); hide(r3(SWAP - 0.02), "wiz");
show(r3(SWAP - 0.02), "viko"); show(r3(SWAP - 0.02), "wizo");
setup(SWAP, "rea", REAO, -15);
// the old friends stand in front of him: behind the camera in the shots of his face (06 and the stare), in the
// reveal and in panel 08 (where he has walked up to them)
for (const w of ["viko", "wizo", "rea"]) { hide(r3(SWAP - 0.01), w); show(r3(REVEAL - 0.02), w); hide(r3(STARE - 0.02), w); show(r3(QUESTION - 0.02), w); }
const putAway = (t, id, y) => c.at(r3(t), { do: "prop", id, set: { y }, dur: 0, ease: "linear", reason: "the old men's sticks go with them out of the shots of his face (at a cut), not a fall" });
for (const st of ["stickV", "stickW"]) putAway(SWAP - 0.03, st, -3), putAway(REVEAL - 0.03, st, 0), putAway(STARE - 0.03, st, -3), putAway(QUESTION - 0.03, st, 0);
A(r3(SWAP - 0.02), "rea", "pitch", { to: 0, dur: 0.01 }); A(r3(SWAP - 0.02), "rea", "squash", { amount: 0, dur: 0.01 });
c.arm(r3(SWAP - 0.02), "rea", "L", "rest", 0.01); A(r3(SWAP - 0.02), "rea", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
A(r3(SWAP - 0.02), "rea", "expr", { expr: "deadpan", dur: 0.01 }); A(r3(SWAP - 0.02), "rea", "look", { to: [-0.5, 0.0], dur: 0.01, blink: false });
c.prop(r3(AGE - 0.03), "finish", { snap: 0, age: 1 }, 0, "linear");
c.prop(r3(AGE - 0.03), "chalk", { age: 1 }, 0, "linear");
for (let k = 1; k <= 4; k++) c.at(r3(AGE - 0.03), { do: "prop", id: `weeds${k}`, set: { y: 0 }, dur: 0, ease: "linear", reason: "the weeds of sixty years come up with the old road, at the reveal cut, not a fall" });
// the old men and their sticks: Viking's crook in his right glove, the Wizard's knob in his left
const STICK_V = front(VIKO, 0, 0.34, 0.3, 0), STICK_W = front(WIZO, 10, 0.34, -0.3, 0);
c.prop(r3(SWAP - 0.03), "stickV", { x: STICK_V[0], z: STICK_V[2] }, 0, "linear");
c.prop(r3(SWAP - 0.03), "stickW", { x: STICK_W[0], z: STICK_W[2] }, 0, "linear");
for (const [w, s, spec, p] of [["viko", "R", "stickV", STICK_V], ["wizo", "L", "stickW", STICK_W]]) {
  c.arm(r3(SWAP - 0.02), w, s, { prop: spec, grip: [0, 0.6, 0], palm: [0, -0.4, 0] }, 0.01);
  A(r3(SWAP - 0.02), w, "grip", { side: s, shape: "hold", dur: 0.01 });
  A(r3(SWAP - 0.02), w, "pitch", { to: 9, dur: 0.01 });   // the stoop
  A(r3(SWAP - 0.02), w, "look", { to: [0.0, 0.0], dur: 0.01, blink: false });
}
// in from behind the camera
const SKID = r3(BACK + 0.05);
c.prop(r3(BACK - 0.02), "st4", { glow: 0.55 }, 0, "linear");
c.prop(SKID, "st4", { head: 1 }, 0.067, "linear"); c.prop(r3(SKID + 0.08), "st4", { tail: 1 }, 0.6, "in"); c.prop(r3(SKID + 0.4), "st4", { glow: 0 }, 0.5, "inOut");
sfx(SKID, "firework", { gain: 1.0, loud: true, reason: "the power: the crack as he arrives from behind the camera" });
sfx(SKID, "whoosh", { gain: 0.8, reason: "the air behind the streak" });
sfx(r3(SKID + 0.06), "scrape", { gain: 0.6, reason: "his feet skidding on the dirt" });
sfx(r3(SKID + 0.06), "tyres", { gain: 0.5, dur: 0.4, reason: "grit under the skid" });
c.at(r3(SKID + 0.03), { fx: "shake", dur: 0.25, amp: 0.03 });
// (he stays far behind the camera, hidden, until just before he is drawn again: the trophy in his glove went with him
// to the skid's start at the cut and hung in the air alone for two frames, the full render's pop at 11.30 s)
A(SKID, "sam", "move", { to: [SAMB[0], r3(SAMB[1] + 0.9)], dur: 0.01, steps: 0 });   // (and drawn again on the next drawing, below)
A(r3(BACK - 0.02), "sam", "turn", { to: 0, dur: 0.01 });
show(r3(SKID + 0.01), "sam");
A(r3(SKID + 0.05), "sam", "move", { to: SAMB, dur: 0.38, ease: "out", steps: 0 });   // the skid: feet ahead, sliding to a stop
A(r3(SKID + 0.05), "sam", "pitch", { to: -14, dur: 0.05 }); A(r3(SKID + 0.43), "sam", "pitch", { to: 0, dur: 0.3, ease: "settle" });
c.at(r3(SKID + 0.08), { fx: "poof", pos: [SAMB[0], 0.02, r3(SAMB[1] + 0.45)], dur: 1.0, color: "#e9d8c0", puffs: 14, sparks: 0, size: 0.55, lift: 0.06 });
c.arm(r3(BACK - 0.02), "sam", "R", { o: [-0.04, 0.86, 0.22] }, 0.01);   // high and in over his head, so the trophy is in the close frame (panel 06)
c.arm(r3(BACK - 0.02), "sam", "L", { o: [0.2, 0.55, 0.22] }, 0.01); A(r3(BACK - 0.02), "sam", "grip", { side: "L", shape: "fist", dur: 0.01 });
A(r3(BACK - 0.02), "sam", "expr", { expr: "delighted", set: { curve: 1, open: 0.7 }, dur: 0.01 }); A(r3(BACK - 0.02), "sam", "face", { lid: 1, dur: 0.01 });
c.prop(r3(SKID + 0.45), "trophy", { glint: 1 }, 0.2, "out"); c.prop(r3(SKID + 0.9), "trophy", { glint: 0 }, 0.4, "inOut");
sfx(r3(SKID + 0.45), "ting", { gain: 0.4, reason: "the trophy's glint" });
c.say(r3(SKID + 0.25), "sam", "WON!", 0.4, "excited", { ...SAM, sub: false });
c.textPop(r3(SKID + 0.25), "sam", "WON!", { dur: 0.9, color: "speaker", size: 140, burst: "#ffd84a" });   // the win, slammed beside his head (the second pop)
sfx(r3(SKID + 0.4), "brassswell", { gain: 0.7, dur: r3(OPEN - 0.2 - SKID - 0.4), reason: "the winner's fanfare (cut off at 12.2)" });
A(r3(SKID + 0.7), "sam", "squash", { amount: -0.04, dur: 0.6 });   // he swells with pride
// two trophy pumps, each with a glint (review B: 1.7 s with nothing moving was the swipe point)
// (both done by 12.15: the reveal's hidden move behind the cut starts his 0.3 s step lead-in at 12.18, and a pump
// still front-loading then stepped him back a drawing, the check's pop at 13.17 s)
for (const t of [11.2, 11.75]) {
  c.arm(t, "sam", "R", { o: [-0.04, 0.96, 0.22] }, 0.2, "out"); c.arm(r3(t + 0.2), "sam", "R", { o: [-0.04, 0.86, 0.22] }, 0.2, "inOut");
  c.prop(t, "trophy", { glint: 1 }, 0.1, "out"); c.prop(r3(t + 0.3), "trophy", { glint: 0 }, 0.25, "inOut");
}
act.blinksAt(c, "sam", []);
see(r3(SKID + 0.1), r3(REVEAL - 0.02), ["sam.face", "trophy"], "panel 06: back, trophy high, eyes shut: WON!");
// the fanfare stops; he opens his eyes
A(OPEN, "sam", "face", { lid: 0, dur: 0.06 }); A(OPEN, "sam", "expr", { expr: "delighted", set: { curve: 0.8, open: 0.3 }, dur: 0.08 });

// ================================================================ 7 THE TWIST 12.5-16.6 (panels 07, then his face)
// The same road sixty years later: cracked, overgrown, the car rusted, the ribbon in tatters on leaning posts. Viking
// and the Wizard old men on sticks, Reaper exactly the same. The wind over the empty road; a stick creaks. "...you won."
hide(r3(REVEAL - 0.02), "sam"); show(r3(STARE - 0.02), "sam");   // the reveal is what he sees (his eyes' view)
A(r3(REVEAL - 0.02), "sam", "move", { to: [SAMB[0], 8], dur: 0.01, steps: 0 }); A(r3(STARE - 0.02), "sam", "move", { to: SAMB, dur: 0.01, steps: 0 });

sfx(r3(REVEAL + 0.4), "creak", { gain: 0.5, reason: "an old walking stick creaking under Viking's weight" });
A(r3(REVEAL + 0.4), "viko", "pitch", { to: 12, dur: 0.6 });
A(r3(REVEAL + 0.2), "viko", "expr", { expr: "tired", set: { curve: 0.15 }, dur: 0.3 });
A(r3(REVEAL + 0.5), "wizo", "face", { lid: 0.55, dur: 0.4 });
act.blinksAt(c, "rea", []);
c.say(r3(V(VO ? 14.9 : 14.8)), "viko", "...you won.", 0.9, "calm", { ...VIK_VOICE, style: "a very old man, thin, crackly, frail, slow", sub: "...you won.", pos: 470 });
A(r3(V(14.8) + 0.65), "viko", "expr", { expr: "kind", set: { curve: 0.35 }, dur: 0.3 });   // a tired little smile
see(r3(REVEAL + 0.1), r3(STARE - 0.02), ["viko.face", "wizo.face", "rea.face", "carold", "finish"], "panel 07: sixty years later, the friends old, Reaper the same");
// his face: the smile drains, the trophy droops
A(r3(STARE + 0.05), "sam", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.3 }, dur: 0.2 });
c.arm(r3(STARE + 0.2), "sam", "R", { prop: "trophy", grip: "stem", at: front(SAMB, 0, 0.3, 0.4, 0.2) }, 0.7, "inOut");
c.arm(r3(STARE - 0.02), "sam", "L", "rest", 0.01); A(r3(STARE - 0.02), "sam", "grip", { side: "L", shape: "relaxed", dur: 0.01 });   // (lowered while we looked at them)
A(r3(STARE + 0.3), "sam", "look", { to: [-0.4, 0.0], dur: 0.2, blink: false });
A(r3(STARE + 0.55), "sam", "expr", { expr: "worried", set: { open: 0.2 }, dur: 0.3 }); A(r3(STARE + 0.55), "sam", "pitch", { to: 6, dur: 0.4 });   // it dawns on him (review B: the stare read as cute surprise)
A(r3(STARE + 0.55), "sam", "look", { to: [-0.15, -0.4], dur: 0.25, blink: false });   // down at the drooping trophy
A(r3(STARE + 1.15), "sam", "look", { to: [0.45, 0.05], dur: 0.25, blink: false });   // then up at the Reaper
// the brief's first sentence only (Jonny 9 Nov 2026 13:20: cut it to its first sentence; the 24 words in 1.7 s could not
// be read), whole at once (kinetic off)
cap(STARE, r3(QUESTION - 0.03), "Real fact: the faster you move, the slower your time runs.", 470, false, { kinetic: false });
see(r3(STARE + 0.1), r3(QUESTION - 0.02), ["sam.face", "trophy"], "his face: it was two seconds for him");

// ================================================================ 8 WOULD YOU STILL WANT TO WIN? 16.6-18.0 (panel 08)
// Samurai frozen at the left front, turned to us, the trophy drooping, staring at Reaper; old Viking on his stick
// between them; Reaper unchanged, one slow blink.
setup(QUESTION, "sam", SAMQ, 40);
c.arm(r3(QUESTION - 0.02), "sam", "R", { prop: "trophy", grip: "stem", at: front(SAMQ, 40, 0.4, 0.15, 0.3) }, 0.01);
c.arm(r3(QUESTION - 0.02), "sam", "L", "rest", 0.01);
A(r3(QUESTION - 0.02), "sam", "expr", { expr: "shocked", set: { open: 0.25, eye: 1.3 }, dur: 0.01 });
A(r3(QUESTION - 0.02), "sam", "look", { to: [0.75, 0.0], dur: 0.01, blink: false }); A(r3(QUESTION - 0.02), "sam", "pitch", { to: 0, dur: 0.01 });
setup(QUESTION, "wizo", [-2.3, -2.2], 10);   // stepped aside, out of frame
c.prop(r3(QUESTION - 0.03), "stickW", { x: front([-2.3, -2.2], 10, 0.34, -0.3, 0)[0], z: front([-2.3, -2.2], 10, 0.34, -0.3, 0)[2] }, 0, "linear");
setup(QUESTION, "rea", [1.0, REAO[1]], -20);   // a step in, so his slow blink sits inside the phone safe zone
A(r3(QUESTION - 0.02), "rea", "look", { to: [-0.6, 0.0], dur: 0.01, blink: false });
A(r3(QUESTION - 0.02), "viko", "look", { to: [-0.5, 0.0], dur: 0.01, blink: false });
A(r3(V(18.3)), "rea", "face", { lid: 1, dur: 0.16 }); A(r3(V(18.3) + 0.3), "rea", "face", { lid: 0, dur: 0.16 });   // the slow blink (lids shut on purpose)
cap(QUESTION, r3(END - 0.03), "Would you still want to win?", 470);
see(r3(QUESTION + 0.05), r3(END - 0.05), ["sam.face", "rea.face", "viko"], "panel 08: Samurai stares at the unchanged Reaper");

// ---------------------------------------------------------------- shots (by hand: the painting's camera range)
const SH = {
  start: { pos: [-0.05, 1.55, 13.0], look: [0.0, 0, 5.0], fov: 40 },                    // panels 01-02: behind the line, down the road
  victim: { pos: [-0.1, 0.85, 13.0], look: [0.35, 0.5, 9.3], fov: 30 },                   // Viking's face; Samurai with the trophy far behind
  again: { pos: [1.32, 1.06, 15.3], look: [-0.37, -0.3, -5.8], fov: 16 },               // panel 03: long lens, Viking near, Samurai far
  car: { pos: [-0.3, 2.6, 17.5], look: [0.0, 0.5, 8.0], fov: 38 },                   // Viking in the car, Samurai bored beside it
  chase: { pos: [-0.45, 2.6, 10.2], look: [0.15, -0.4, -3.6], fov: 32 },   // panel 04
  glare: { pos: [0.1, 1.3, 6.5], look: [0.0, 0.55, -3.0], fov: 38 },                    // the car's front, Samurai at the post (a step back: Viking's head was cut by the left edge)
  world: { pos: [1.4, 1.5, 7.2], look: [0.35, 0.55, 0.6], fov: 34 },                    // the challenge
  blast: { pos: [0.05, 1.5, 7.2], look: [0.1, 0.3, -3], fov: 46 },   // panel 05: the cover frame. Low and straight down the road like the painting: from higher up the camera saw over the painted wheat bank onto its bare floor
  back: { pos: [0.1, 0.62, 5.5], look: [0.1, 0.62, 0], fov: 34 },                       // panel 06: low, Samurai fills it
  reveal: { pos: [0.05, 2.4, 4.0], look: [0.05, 0.0, -2.4], fov: 62, to: { pos: [0.05, 2.4, 4.0], look: [0.05, 0.0, -2.4], fov: 52 }, dur: 1.1, ease: "inOut" },   // pushes in (review B: the faces were small)                   // panel 07: what he sees, the car whole and all three inside the safe zone
  line: { pos: [0.5, 1.4, 3.9], look: [0.5, 1.0, -0.7], fov: 42 },                      // old Viking beside the unchanged Reaper (review A: the Reaper was half out of the wide)
  stare: { pos: [0.3, 1.0, 6.2], look: [0.15, 1.0, 1.9], fov: 30 },                      // his face
  question: { pos: [0.1, 1.3, 4.7], look: [0.24, 0.8, -0.8], fov: 44 },                 // panel 08
};
// ================================================================ THE COMMENTATOR (default; --no-vo leaves it out)
// The voice "narrator" (engine/voice/voices.json: VoxCPM2 on Reaper's reference, "intrigued, mysterious, slow
// storyteller"), Jonny's pick for the What if commentator (EP01's commentator cut, make-pause-time.mjs --vo). Each line
// sits where nobody speaks: after the first "GO!", after the car loses, over the slow motion, at the reveal, and the
// closing question (its caption is already on screen). The takes: 4 reads of each line; kept is the one Whisper heard
// word for word with the closest speaker match (ECAPA cosine 0.44-0.55) to the read Jonny picked (project files
// audio/premise-voice-01/1-deep-storyteller.mp3) among the reads that fit the gap. "Sounds perfect, right?" is EP01's
// read (take 3). The lines are queued here, before c.beats() takes the actions; their subtitles are added after the
// cut trim below, so a voiceover's subtitle runs on across a cut.
const NARR = !VO ? [] : [
  // [story s, line, take, spoken s (video), subtitle until (story) | false, gain]. Gains: every line at about
  // -12.7 LUFS momentary in the final mix, level with the action's loud moments (Jonny 9 Nov 14:25: "the speaker is
  // too quiet compared to the rest of the video"; at 2.4/1.2/0.9 the lines sat -13 to -25 against the action's -7 to
  // -11). The spike guard levels the mix to -14 LUFS around them and its voice limiter takes up to 1.7 dB off peaks.
  // The ambience is 0.5 -> 0.3 with the voiceover (the streak's wind gusts sat under the first lines on a phone).
  [0, TITLE, TITLE_TAKE, TITLE_LEN, false, 7.7],   // the spoken title (Jonny 14:25) over the slow-motion stare-down; subtitled in four short parts below
  [1.50, "He never loses.", 4, 1.15, false, 7.5],                     // Viking going red, after the landing; ends before "AGAIN!" (2.7). No subtitle: his close fills y 160-1500 (camfit: no free spot in the band)
  [6.05, "Not even close.", 1, 1.33, r3(WORLD - 0.03), 8.0],          // the roadster slides in after him; on over the glare cut
  [SLOW.at, "Sounds perfect, right?", 3, 1.56, false, 8.2],           // over the slow motion (video 12.0-13.6; EP01's line and read), in the 10x blast's wind. No subtitle, as on EP01's title card
  [r3(REVEAL + 0.02), "Sixty years later.", 4, 1.23, r3(V(14.9) - 0.03), 8.4],   // the reveal, before old Viking's "...you won."
  [r3(QUESTION + 0.02), "Would you still want to win?", 3, 1.63, false, 8.4],    // the closing question (its caption is on screen)
];
for (const [t, line, take, len, until, gain] of NARR) {
  c.at(t, { macro: "narrate", line, voice: "narrator", take, caption: false, gain });
  if (until && VT(until) < VT(t) + len - 0.01) throw new Error(`"${line}" is cut off at ${until} (video ${VT(until)})`);
  if (!until && VT(t) + len > VT(END) - 0.3) throw new Error(`"${line}" runs to the end`);
}


const beats = c.beats([
  ["start: watch me win", 0, SH.start, "hook"],
  ["victim: still crouched", VICTIM, SH.victim, "reaction"],
  ["again!", AGAIN, SH.again],
  ["demo 2: against a car", CAR, SH.car],
  ["demo 2: the race", CHASE, SH.chase],
  ["demo 2: the glare", GLARE, SH.glare, "reaction"],
  ["demo 3: around the world", WORLD, SH.world],
  ["demo 3: the blast (slow motion)", BLAST, SH.blast, "reveal"],
  ["snap 2: back, WON!", BACK, SH.back],
  ["twist: sixty years later", REVEAL, SH.reveal, "payoff"],
  ["twist: ...you won.", LINE, SH.line, "reaction"],
  ["twist: his face", STARE, SH.stare, "reaction"],
  ["would you still want to win?", QUESTION, SH.question, "reaction"],
], END);
// a caption gives way at each cut it would run over
for (const cp of c.captions) for (const cut of [VICTIM, AGAIN, CAR, CHASE, GLARE, WORLD, BLAST, BACK, REVEAL, LINE, STARE, QUESTION]) if (cp.from < cut - 0.05 && cp.to > cut - 0.03) cp.to = r3(cut - 0.03);
for (const [t, line, , , until] of NARR) if (until) cap(t, until, line, 470, false, { kinetic: false });   // the commentator's subtitles (above)
// the spoken title's subtitle in four short parts, as the read says them (Whisper: "friend" ends 1.42 s in), each short
// enough to sit between the Wizard's hat and the far Reaper under the in-app title band
if (VO) {
  cap(0, ST(0.44), "What if your", 470, false, { kinetic: false });
  cap(ST(0.44), ST(1.42), "competitive friend", 470, false, { kinetic: false });
  cap(ST(1.42), ST(1.84), "could run", 470, false, { kinetic: false });
  cap(ST(1.84), r3(OPEN_SLOW.len - 0.02), "at light speed?", 470, false, { kinetic: false });
}

const allowClip = [
  { who: "rea", from: r3(GO1), to: r3(VICTIM), checks: ["rig-jump"], reason: "his empty glove drops as the trophy vanishes at light speed; he is 12 % of the frame, 15 m down the road" },
  { who: "rea", from: r3(V(18.3) - 0.05), to: END, checks: ["eyes-readable"], reason: "Reaper's slow blink (the brief's 18.30 beat): the lids close on purpose" },
  { who: "sam", from: r3(GO1), to: r3(GO1 + 0.4), checks: ["rig-jump", "foot-slide", "stance-slide", "hand-jump", "prop-pop"], reason: "the power: he vanishes on the streak and is drawn again past the ribbon, the trophy snatched from Reaper's glove at light speed" },
  { who: "sam", from: r3(GO2), to: r3(GO2 + 0.2), checks: ["rig-jump", "foot-slide", "stance-slide", "hand-jump", "prop-pop"], reason: "the power: he vanishes beside the car and is drawn again at the finish post" },
  { who: "sam", from: r3(GO3 - 0.05), to: r3(SKID + 0.5), checks: ["rig-jump", "foot-slide", "stance-slide", "hand-jump", "prop-pop"], reason: "the power: gone round the world; he is drawn again skidding in from behind the camera (a glide, feet ahead)" },
  { who: "vikc", with: "wheel", from: CAR, to: WORLD, reason: "his gloves hold the steering wheel's rim" },
  { who: "vikc", with: "seatD", from: CAR, to: WORLD, reason: "he sits in the driver's seat" },
  { who: "sam", with: "finish", from: GO2, to: WORLD, checks: ["clipping"], reason: "he leans his shoulder on the right finish post, yawning" },
  { who: "viko", with: "stickV", from: SWAP, to: END, reason: "his glove rests on the crook of his walking stick" },
  { who: "wizo", with: "stickW", from: SWAP, to: END, reason: "his glove rests on the knob of his walking stick" },
];

// check windows are on the video clock at gate 1 (qa/gate.mjs windowFor): VT through both slow motions

for (const w of allowClip) { w.from = VT(w.from); w.to = VT(w.to); }

write(import.meta.url, {
  id: VO ? "light-speed" : "light-speed-no-vo",
  title: "What if your competitive friend could run at light speed?",
  idea: "What if, episode 3: the friend who has to win runs at light speed; three races he wins before they start, then around the world: two seconds for him, sixty years for his friends",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [470, 1360],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { type: "env", env: "wheat-road-day", swap: [{ at: AGE, env: "wheat-road-old" }], aperture: FOCUS ? 0.045 : 0, lighting: LIGHTING, hatch: HATCH, cel: CEL, life: LIFE([[GO1, 3], [GO2, 3], [GO3, 5]]), ink: true, satsuei: true },
  rigs: [rig, rigOld],
  // a fast surf-rock race groove from 0.0; the biggest GO drops it; the fanfare's win, then dead silence for the
  // reveal (the wind over an empty road), and the music box for the fact and the question
  music: { style: "surf", lowCut: 150, gain: 0.28, parts: [
    { at: 0, part: "main" }, { at: r3(GO3 - 0.4), part: "build" }, { at: GO3, part: "drop" }, { at: SKID, part: "drop" },
    { at: r3(OPEN - 0.2), part: "stop" }, { at: REVEAL, part: "hush" }, { at: STARE, part: "musicbox" }] },
  sound: { sfx: 0.65, ambience: VO ? 0.3 : 0.5, surface: "grass",   // the soft outdoor step for a dirt road ("road" is no library surface and fell back to the indoor step)
  room: "open", guard: true,
    engine: { keys: [[0, 0, 0, 0], [r3(CAR - 0.05), 0, 0, 0], [CAR, 900, 0.25, 1], [r3(CAR + 0.15), 4200, 0.7, 1], [r3(CAR + 0.3), 2600, 0.4, 1], [r3(LAUNCH - 0.05), 3800, 0.6, 1],
      [r3(LAUNCH + 0.1), 5600, 1, 1], [r3(SPIN0 - 0.05), 6200, 0.9, 1], [r3(SPIN0 + 0.1), 3200, 0.2, 1], [r3(SPIN0 + SPIN_LEN), 1000, 0.15, 1], [r3(WORLD - 0.1), 900, 0.15, 1], [WORLD, 0, 0, 0], [END, 0, 0, 0]], gain: 0.17, cyl: 4 } },
  hook: { show: ["sam", "vik", "trophy", "finish"], hint: 0, what: "two friends crouched at a start line glaring at each other in slow motion, green sparks at Samurai's feet; the narrator: 'What if your competitive friend could run at light speed?'" },
  panels: { md: "storyboards/series/what-if/03-light-speed/PANELS.md" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/03-light-speed/make-light-speed.mjs.",
});
