// THE EASY TRAIL (friend comedies 24; Jonny's brief, 30 Oct 2026: /mnt/project-files/video-scripts/
// 2026-10-30-four-friend-comedies/engine-pack/24-the-easy-trail/ENGINE-PROMPT.md + its eight-panel board), built from
// the clip template. node storyboards/friend-comedies/24-the-easy-trail/make-the-easy-trail.mjs -> the-easy-trail.json
//
// THE BRIEF (exactly 10 s; Wizard, Reaper, Phoenix, Dragon; caption "my friend said this trail was easy")
//   Joke:        Reaper's "easy" trail is a frantic downhill ride that ends off a cliff; Reaper never needed the ground.
//   Wants:       the Wizard wants to keep up with Reaper and survive the trail.
//   Consequence: he flies off the cliff, his bike and staff fall away, Dragon catches him in mid-air.
//   Ending:      Reaper pedals level beside them on the same tiny bike, unsupported, deadpan; the Wizard stares (no loop).
//
//   1 0.00-1.10  FULL SPEED: the Wizard's riding view (his gloves on the bars), Reaper ahead on a tiny red bike
//   2 1.10-2.00  EASY: Reaper rides no-hands, turns round and looks back, deadpan, and back to the trail
//   3 2.00-3.00  ROOT: the front wheel rises over a root across the trail, one clean landing
//   4 3.00-4.00  PLANK: one narrow plank over a gully, the wheel on it, Reaper already at the far end
//   5 4.00-5.00  SHOW-OFF: Phoenix flies past backwards and waves; Reaper rolls off the end of the trail and drops
//   6 5.00-6.70  CLIFF: cut to a side wide: the Wizard and his bike launch, he lifts off the saddle and flails, his
//                staff comes loose from his back and tumbles on its own
//   7 6.70-8.30  CATCH: Dragon swoops up under him and catches him astride his back, a soft compression; the bike and
//                the staff keep falling out of frame below
//   8 8.30-10.0  STILL PEDALLING (payoff): a tracking two-shot in the air: the Wizard, relieved, looks over and finds
//                Reaper flying level beside them on the same tiny bike, calmly pedalling; Reaper glances back, deadpan
//
// Departures from the brief (flagged for Jonny): the publication caption is also on screen 0-2.5 s (Jonny's standing
// hook-caption rule), music plays from 0:00 (his background-music rule), the Wizard says two gibberish syllables (a
// "whoa" at 0 s, the lab's opener pick, and a "huh?" at the reveal) and Reaper rides no-hands while he looks back.
//
// World (engine/page/set-trail.js TRAIL): the trail runs along x 0 toward -z on a plateau at y 0; the root at z 2.44,
// the gully between z -0.4 and -2.8 with the plank on it, the cliff edge at z -8, the valley 36 m below.
import { clip, write, r3 } from "../../lib/clip.mjs";
import * as act from "../../lib/acting.mjs";
import { TRAIL } from "../../../engine/page/set-trail.js";

const OPENER = { who: "wiz", line: "whoa-whoa!", words: false };   // the lab picks (Jonny, 30 Oct): on
const FOCUS = true;
const FACES = "strong";

const c = clip({ faces: FACES }), { A, sfx, cap } = c;
const END = 10.0;
const r2 = (x) => Math.round(x * 100) / 100;

// ---------------------------------------------------------------- the ride (0-5.2): the Wizard's bike at 4 m/s
const V = 4.0, BZ0 = 12.6;                     // the bike's middle at 0 s; it reaches the edge (z -8) at 5.15 s
const bikeZ = (t) => BZ0 - V * t;
const TURN = 1.257;                            // metres per wheel turn (props3d.js bike: radius 0.2)
const RIDE = { off: [0, 0.36, -0.16], yaw: 0, sit: true };   // on the saddle (the bike clip's seat)
const LAUNCH = 5.2;                            // the back wheel leaves the edge: from here the bike falls
const ROOT_HOP = 2.36, PLANK_ON = 3.03, PLANK_OFF = 3.97;
// the first-person camera rides in the Wizard's head (his body is not drawn: "pov"), a little behind his face so his
// gloves on the bars sit low in the frame
const EYE = 1.15, camPos = (t) => [0, EYE, r3(bikeZ(t) + 0.26)], camLook = (t) => [0, r3(EYE - 0.73), r3(bikeZ(t) - 2)];

// ---------------------------------------------------------------- Reaper's ride ahead (his speed eases while he looks back)
const RS = 0.75;                                // his tiny bike
const reaV = (t) => (t < 1.0 ? 4.0 : t < 1.2 ? 4.0 - 5 * (t - 1.0) : t < 1.9 ? 3.0 : t < 2.2 ? 3.0 + (t - 1.9) * 5.33 : 4.6);
const reaZ = (() => { const s = [[0, 8.8]]; for (let t = 0.01; t <= 5.0 + 1e-9; t += 0.01) s.push([r3(t), s.at(-1)[1] - reaV(t - 0.005) * 0.01]); return (t) => s[Math.min(s.length - 1, Math.round(t * 100))][1]; })();
const at = (fz, z) => { let t = 0; while (t < 5 && fz(t) > z) t += 0.01; return r3(t); };   // when a path passes z
const REA_EDGE = at(reaZ, TRAIL.edge);

// ---------------------------------------------------------------- the fall (5.2-6.7) and the catch (6.7)
const CATCH = 6.7;
const WIZ0 = [0, 0.36, r3(bikeZ(LAUNCH) + 0.16)];          // where the Wizard sits at the launch
// he lifts off the saddle and arcs out, slowing from the bike's 4 m/s (cartoon air), falling toward the valley
const wizFall = (t) => { const u = t - LAUNCH; return [0, 0.36 + 1.7 * u - 2.1 * u * u, WIZ0[2] - (2.2 * u + 0.54 * (1 - Math.exp(-u / 0.3)))]; };
// Dragon (1.5x): the Wizard sits on top of him, behind his sprout, between the wing roots; both face DRA_YAW (3/4 to
// the camera on the travel side)
const DRA_SCALE = 1.5, DRA_YAW = 135, SEAT = [0, 1.3, -0.18];
const yawR = (DRA_YAW * Math.PI) / 180, seatW = [SEAT[0] * Math.cos(yawR) + SEAT[2] * Math.sin(yawR), SEAT[1], -SEAT[0] * Math.sin(yawR) + SEAT[2] * Math.cos(yawR)];
const W_CATCH = wizFall(CATCH), D_CATCH = W_CATCH.map((v, i) => v - seatW[i]);
// Hermite segments: up from under the cliff (out of frame), easing into a slight dive that matches the Wizard's fall,
// then a soft dip as he lands (the compression), then a level cruise away from the cliff
const herm = (p0, v0, p1, v1, t0, t1) => (t) => { const h = t1 - t0, u = (t - t0) / h, a = 2 * u ** 3 - 3 * u ** 2 + 1, b = u ** 3 - 2 * u ** 2 + u, c2 = -2 * u ** 3 + 3 * u ** 2, d = u ** 3 - u ** 2; return p0.map((_, i) => a * p0[i] + b * h * v0[i] + c2 * p1[i] + d * h * v1[i]); };
// he swoops up from below, ahead of the fall (the bike has dropped past by then), turning back under the Wizard
const DRA_IN = 5.75, V_CATCH = [0, -0.5, -1.6], CRUISE = [0, 0.12, -2.0];
const D_IN = [0.7, -7.6, -13.9], D_DIP = [D_CATCH[0], r3(D_CATCH[1] - 0.22), r3(D_CATCH[2] - 0.75)], DIP_END = 7.15;
const draA = herm(D_IN, [-0.4, 7.0, 2.6], D_CATCH, V_CATCH, DRA_IN, CATCH);
const draB = herm(D_CATCH, V_CATCH, D_DIP, CRUISE, CATCH, DIP_END);
const draC = (t) => D_DIP.map((v, i) => v + CRUISE[i] * (t - DIP_END));
const draAt = (t) => (t < CATCH ? draA(t) : t < DIP_END ? draB(t) : draC(t));
const wizAt = (t) => (t < CATCH ? wizFall(t) : draAt(t).map((v, i) => v + seatW[i]));
// the bike keeps the trail's speed and falls faster (nothing slows it), nose dropping; the staff slips off his back
// as he lifts and tumbles end over end on its own line, between the two
const BIKE_Y = (u) => 0.1 * u - 4.5 * u * u;
const bikeFall = (t) => { const u = t - LAUNCH; return [0, BIKE_Y(u), bikeZ(LAUNCH) - 3.0 * u]; };
const STAFF_OFF = [0.0, 0.95, -0.52];                        // on his back while he rides (in the bike's turned frame)
const STAFF_FREE = 5.2, staff0 = [0, STAFF_OFF[1], bikeZ(STAFF_FREE) - STAFF_OFF[2]];
const staffFall = (t) => { const u = t - STAFF_FREE; return [0.9 * u, staff0[1] + 1.0 * u - 2.6 * u * u, staff0[2] - 0.6 * u]; };

// ---------------------------------------------------------------- the payoff (8.3-10): Reaper level beside them
const PAY = 8.3, FIN_YAW = 115;
const REA_SIDE = [-0.4, 1.1, -1.3];                        // his bike from Dragon's root: beside the Wizard, level with his head, above the wing tips
const reaFly = (t) => draAt(t).map((v, i) => v + REA_SIDE[i]);

// ---------------------------------------------------------------- cast and props
const cast = [
  { id: "wiz", character: "lookdev/wizard-crisp", at: [0, r3(bikeZ(0) + 0.16)], face: 180, expr: "shocked", follow: 0.3, seed: 2.6 },
  { id: "rea", character: "lookdev/reaper-crisp", at: [0, r3(reaZ(0) + 0.12)], face: 180, expr: "smug", follow: 0.25, seed: 3.3 },
  { id: "phx", character: "duo/phoenix", at: [-1.3, r3(bikeZ(4) - 1.0)], y: 1.3, face: 20, expr: "delighted", follow: 0.3, seed: 1.7, hidden: true },
  { id: "dra", character: "lookdev/dragon-crisp", at: [D_IN[0], D_IN[2]], y: D_IN[1], face: DRA_YAW, scale: DRA_SCALE, expr: "kind", follow: 0.2, seed: 4.4, hidden: true },
];
const props = [
  { id: "bw", kind: "bike", color: "#7b4fd0", x: 0, z: bikeZ(0), rot: 180 },
  { id: "br", kind: "bike", color: "#d23a2e", x: 0, z: reaZ(0), rot: 180, scale: RS },
  { id: "staff", kind: "trailstaff", x: 0, y: STAFF_OFF[1], z: r3(bikeZ(0) - STAFF_OFF[2]), tip: -22, tilt: 18 },
  { id: "wc", kind: "carrier", x: WIZ0[0], y: WIZ0[1], z: WIZ0[2], rot: DRA_YAW },
  { id: "dc", kind: "carrier", x: D_IN[0], y: D_IN[1], z: D_IN[2], rot: DRA_YAW - 75 },
];
// a path as dense linear tweens (every 2 frames), so a prop follows a curve
// (axes: which of x, y, z it sets, so a hop's own y tween can ride on top)
const path = (id, t0, t1, f, extra = () => ({}), dt = 1 / 15, axes = "xyz") => {
  for (let t = t0; t < t1 - 1e-6; t += dt) {
    const t2 = Math.min(t1, t + dt), p = f(t2), set = {};
    [..."xyz"].forEach((k, i) => { if (axes.includes(k)) set[k] = r3(p[i]); });
    c.prop(r3(t), id, { ...set, ...extra(t2) }, r3(t2 - t), "linear");
  }
};

// ---------------------------------------------------------------- 1 FULL SPEED (0-1.1)
A(0, "phx", "hide"); A(0, "dra", "hide");
A(0, "wiz", "pov");
A(0, "wiz", "ride", { prop: "bw", ...RIDE, dur: 0 });
const BAR = (s) => ({ prop: "bw", grip: [s * 0.2, 0.76, 0.24], frame: { y: [0, 0, 1], z: [0, -1, 0] } });
A(0, "wiz", "arm", { side: "R", pose: BAR(-1), dur: 0 }); A(0, "wiz", "arm", { side: "L", pose: BAR(1), dur: 0 });
A(0, "wiz", "grip", { side: "both", shape: "clasp", dur: 0 });
c.prop(0, "bw", { z: r3(bikeZ(LAUNCH)), spin: r3((V * LAUNCH) / TURN) }, LAUNCH, "linear");
c.at(0, { do: "carry", prop: "staff", by: "bw", off: STAFF_OFF });
// pedalling: one run on the spot for the legs (the ride carries him), cadence about 1.6 turns a second
const pedal = (who, at0, x, z, until) => A(at0, who, "run", { pts: [[0, x, z], [r3(until - at0), x, z]], rate: [[0, 3.2]], stride: 1.4, dur: r3(until - at0) });
pedal("wiz", 0, 0, cast[0].at[1], LAUNCH);
// Reaper: on his bike, hands on its bars, pedalling, his face away from us
A(0, "rea", "ride", { prop: "br", ...RIDE, dur: 0 });
const RBAR = (s) => ({ prop: "br", grip: [s * 0.2, 0.76, 0.24], frame: { y: [0, 0, 1], z: [0, -1, 0] } });
A(0, "rea", "arm", { side: "R", pose: RBAR(-1), dur: 0 }); A(0, "rea", "arm", { side: "L", pose: RBAR(1), dur: 0 });
A(0, "rea", "grip", { side: "both", shape: "clasp", dur: 0 });
pedal("rea", 0, 0, cast[1].at[1], 9.99);
path("br", 0, REA_EDGE, (t) => [0, 0, reaZ(t)], (t) => ({ spin: r3((reaZ(0) - reaZ(t)) / TURN / RS) }), 0.1, "z");
A(0, "rea", "face", { lid: 0.42, dur: 0.01 });
cap(0, 2.5, "my friend said this trail was easy", 250, false, { kinetic: false });
if (OPENER) act.opener(c, OPENER.who, OPENER.line, { at: 0.05, words: OPENER.words });
sfx(0, "ridewind", { gain: 0.5, dur: 5.0, reason: "riding fast: the wind past the rider's ears (first-person)" });
sfx(0, "tyres", { gain: 0.45, dur: PLANK_ON + 0.02, reason: "both bikes' tyres buzzing on the dirt trail" });

// ---------------------------------------------------------------- 2 EASY (1.1-2.0): no hands, a deadpan look back
A(1.1, "rea", "arm", { side: "both", pose: "rest", dur: 0.25, ease: "inOut" });
A(1.14, "rea", "grip", { side: "both", shape: "relaxed", dur: 0.2 });
A(1.12, "rea", "look", { to: [-0.35, 0.05], dur: 0.12, blink: false });
A(1.16, "rea", "turn", { to: 30, dur: 0.3, ease: "inOut" });
A(1.25, "rea", "expr", { expr: "smug", set: { curve: 0.04, smirk: 0.12 }, dur: 0.25 });
A(1.46, "rea", "still", { dur: 0.3, idle: 0.06 });
A(1.72, "rea", "look", { to: [0.3, 0], dur: 0.12, blink: false });
A(1.76, "rea", "turn", { to: 180, dur: 0.25, ease: "inOut" });
A(1.82, "rea", "arm", { side: "R", pose: RBAR(-1), dur: 0.2, ease: "inOut" }); A(1.82, "rea", "arm", { side: "L", pose: RBAR(1), dur: 0.2, ease: "inOut" });
A(1.9, "rea", "grip", { side: "both", shape: "clasp", dur: 0.12 });
act.blinksAt(c, "rea", [2.6]);
// Reaper hops the root casually just after (his wheels lift a little)
{ const t = r3(at(reaZ, TRAIL.root + 0.36 * RS) - 0.1); c.at(t, { do: "prop", id: "br", set: { y: 0 }, dur: 0.32, ease: "inOut", arc: 0.07 }); }

// ---------------------------------------------------------------- 3 ROOT (2.0-3.0): the front wheel rises, one landing
// the nose comes up with the prop's tip, not the bike's wheelie: the hands are locked to the prop's frame, and wheelie
// turns the bike inside it, so the bars would leave the gloves
c.prop(r3(ROOT_HOP - 0.1), "bw", { tip: 11 }, 0.16, "out");
c.prop(r3(ROOT_HOP + 0.06), "bw", { tip: 0 }, 0.24, "inOut");
c.at(ROOT_HOP, { do: "prop", id: "bw", set: { y: 0 }, dur: 0.34, ease: "inOut", arc: 0.17 });
sfx(r3(ROOT_HOP + 0.34), "thud-soft", { gain: 0.55, reason: "the bike lands after hopping the root (one bump)" });

// ---------------------------------------------------------------- 4 PLANK (3.0-4.0): on and off the plank
c.prop(PLANK_ON, "bw", { y: TRAIL.plank.top }, 0.1, "inOut"); c.prop(PLANK_OFF, "bw", { y: 0 }, 0.1, "inOut");
for (const [a, b] of [[at(reaZ, TRAIL.plank.z0 + 0.36 * RS), at(reaZ, TRAIL.plank.z1 - 0.36 * RS)]]) { c.prop(r3(a), "br", { y: TRAIL.plank.top }, 0.16); c.prop(r3(b), "br", { y: 0 }, 0.16); }
sfx(PLANK_ON, "plank-rattle", { gain: 0.6, dur: r3(PLANK_OFF - PLANK_ON + 0.1), reason: "the wheels rattle over the plank" });
sfx(r3(PLANK_OFF + 0.08), "tyres", { gain: 0.45, dur: r3(LAUNCH - PLANK_OFF - 0.08), reason: "tyres on the dirt again up to the edge" });

// ---------------------------------------------------------------- 5 SHOW-OFF (4.0-5.0): Phoenix flies past backwards, waving
// in the camera's terms: from beside the lens at the left, ahead of it, then up and away over the cliff
const camZ = (t) => camPos(t)[2];
A(3.98, "phx", "show");
A(3.98, "phx", "fly", { to: { x: -2.0, y: 1.1, z: r3(camZ(3.98) - 1.9) }, dur: 0.02 });
A(4.0, "phx", "fly", { to: { x: -1.0, y: 0.85, z: r3(camZ(4.3) - 3.0) }, dur: 0.3, ease: "out" });
A(4.3, "phx", "fly", { to: { x: -1.1, y: 0.95, z: r3(camZ(4.45) - 3.1) }, dur: 0.15, ease: "linear" });
A(4.45, "phx", "fly", { to: { x: -2.2, y: 3.0, z: r3(camZ(4.6) - 6.0) }, dur: 0.14, ease: "in" });
A(3.98, "phx", "look", { to: [0.15, 0.05], dur: 0.01, blink: false });
A(4.08, "phx", "arm", { side: "R", pose: "wave", dur: 0.18 });
A(4.1, "phx", "grip", { side: "R", shape: "flat", dur: 0.15 });
A(4.6, "phx", "hide");
sfx(4.05, "whoosh", { gain: 0.45, reason: "Phoenix sweeps past beside the rider (a passing wing whoosh)" });
// Reaper rolls straight off the end of the trail and drops out of sight (he never stops pedalling)
path("br", REA_EDGE, 5.0, (t) => { const u = t - REA_EDGE; return [0, -6 * u * u, reaZ(t)]; }, (t) => ({ spin: r3((reaZ(0) - reaZ(t)) / TURN / RS) }));
sfx(4.62, "windswell", { gain: 0.55, dur: 1.3, reason: "the wind rising as the trail ends at the cliff" });

// ---------------------------------------------------------------- 6 CLIFF (5.0-6.7): the side wide, the launch
A(5.0, "rea", "hide"); c.prop(5.0, "br", { scale: 0 }, 0.01);
A(5.0, "wiz", "pov", { on: false });
A(5.0, "wiz", "expr", { expr: "shocked", set: { open: 0.3, eye: 1.25, curve: -0.2 }, dur: 0.01 });
A(5.0, "wiz", "face", { brow: 0.5, lid: 0, dur: 0.01 });
A(5.0, "wiz", "look", { to: [0.4, -0.3], dur: 0.01, blink: false });
act.blinksAt(c, "wiz", [8.62]);
// the launch: off the saddle, onto his own arc; hands off the bars into a flail, a quarter turn toward us
c.prop(r3(LAUNCH - 0.14), "bw", { wheelie: 0.3 }, 0.14, "out");
A(LAUNCH, "wiz", "ride", { prop: "wc", off: [0, 0, 0], yaw: 0, dur: 0.18 });
path("wc", LAUNCH, CATCH, wizFall);
A(r3(LAUNCH + 0.02), "wiz", "grip", { side: "both", shape: "open", dur: 0.12 });
const FL = [{ o: [0.55, 1.0, 0.1] }, { o: [0.5, 0.74, 0.22] }];
for (let k = 0, t = LAUNCH + 0.02; t < CATCH - 0.25; k++, t += 0.17) { c.arm(r3(t), "wiz", "R", FL[k % 2], 0.15, "inOut"); c.arm(r3(t + 0.06), "wiz", "L", FL[(k + 1) % 2], 0.15, "inOut"); }
A(r3(LAUNCH + 0.05), "wiz", "look", { to: [0.2, -0.6], dur: 0.12, blink: false });
A(r3(LAUNCH + 0.05), "wiz", "expr", { expr: "shocked", set: { open: 0.42, eye: 1.32, curve: -0.3 }, dur: 0.15 });
A(r3(LAUNCH + 0.1), "wiz", "hatwobble", { dur: 0.9 });
A(r3(LAUNCH + 0.04), "wiz", "talk", { line: "waaah!", tone: "excited", dur: 0.85, voice: false });
// the bike flies on and falls, nose down; the staff comes off his back and tumbles
c.prop(LAUNCH, "bw", { wheelie: 0 }, 0.4, "inOut");
act.landDust(c, r3(LAUNCH - 0.03), [0, TRAIL.edge], { puffs: 7 });   // a puff of trail dust off the lip as the back wheel leaves
path("bw", LAUNCH, 8.0, bikeFall, (t) => ({ tip: r3(-55 * Math.min(1, (t - LAUNCH) / 1.6)), roll: r3(30 * Math.min(1, (t - LAUNCH) / 2)), spin: r3((V * LAUNCH) / TURN + (t - LAUNCH) * 2) }));
c.at(STAFF_FREE, { do: "carry", prop: "staff" });
path("staff", STAFF_FREE, 8.0, staffFall, (t) => ({ tip: r3(-22 - 320 * (t - STAFF_FREE)), tilt: r3(18 + 40 * (t - STAFF_FREE)) }));
// Dragon swoops up from under the cliff
A(DRA_IN, "dra", "show");
A(DRA_IN, "dra", "ride", { prop: "dc", off: [0, 0, 0], yaw: 0, dur: 0 });
path("dc", DRA_IN, PAY - 1 / 30, draAt, (t) => ({ rot: r3(DRA_YAW - 75 * (1 - Math.min(1, (t - DRA_IN) / (CATCH - 0.1 - DRA_IN))) ** 2) }));
// at the cut to the payoff they all turn a little more toward the new camera (FIN_YAW)
{ const p = draAt(PAY); c.prop(PAY - 1 / 30, "dc", { x: r3(p[0]), y: r3(p[1]), z: r3(p[2]), rot: FIN_YAW }, r3(1 / 30), "linear"); }   // lands exactly on the cut frame
path("dc", r3(PAY + 0.01), END - 0.001, draAt);
A(DRA_IN, "dra", "fly", { to: {}, dur: r3(END - DRA_IN - 0.01) });
A(DRA_IN, "dra", "expr", { expr: "delighted", dur: 0.01 });
A(DRA_IN, "dra", "look", { to: [-0.2, 0.5], dur: 0.01, blink: false });
A(r3(CATCH - 0.5), "dra", "look", { to: [-0.1, 0.7], dur: 0.15, blink: false });

// ---------------------------------------------------------------- 7 CATCH (6.7-8.3): astride Dragon, a soft settle
A(CATCH, "wiz", "ride", { prop: "dc", off: SEAT, yaw: 0, sit: true, dur: 0.22 });
A(CATCH, "wiz", "squash", { amount: 0.16, dur: 0.3 });
A(r3(CATCH + 0.02), "dra", "squash", { amount: 0.1, dur: 0.32 });
sfx(CATCH, "ai/cushion-poof", { gain: 0.6, reason: "Dragon catches the Wizard on his back: a soft flump" });
// his hands come down onto Dragon's crown in front of him (clear of the wings), the flail stops
const HOLD = { o: [0.3, 0.1, 0.14] };
c.arm(CATCH, "wiz", "R", HOLD, 0.2, "out"); c.arm(CATCH, "wiz", "L", HOLD, 0.2, "out");
A(r3(CATCH + 0.06), "wiz", "grip", { side: "both", shape: "rim", dur: 0.15 });
A(r3(CATCH + 0.02), "wiz", "look", { to: [0, -0.5], dur: 0.15, blink: false });
A(r3(CATCH + 0.05), "wiz", "expr", { expr: "shocked", set: { open: 0.2, eye: 1.2, curve: -0.1 }, dur: 0.25 });
A(r3(CATCH + 0.2), "dra", "look", { to: [0.1, 0.3], dur: 0.2, blink: false });
// the relief: he lets out a breath, eyes closed, sags a little (7.4-8.2)
A(7.35, "wiz", "face", { lid: 0.85, brow: 0.2, dur: 0.3 });
A(7.35, "wiz", "expr", { expr: "kind", set: { curve: 0.25, open: 0.08 }, dur: 0.3 });
A(7.4, "wiz", "squash", { amount: 0.05, dur: 0.5 });
c.at(CATCH, { fx: "poof", pos: [W_CATCH[0], r3(W_CATCH[1] + 0.15), W_CATCH[2]], dur: 0.4, color: "#fff4dc", puffs: 6, sparks: 0, size: 0.35, lift: 0.05 });   // a soft cartoon puff on the catch

// ---------------------------------------------------------------- 8 STILL PEDALLING (8.3-10): the payoff
A(PAY, "rea", "show"); c.prop(PAY - 1 / 30, "br", { scale: RS, rot: FIN_YAW }, r3(1 / 30), "linear");
path("br", r3(PAY - 0.01), END - 0.001, reaFly, (t) => ({ spin: r3(20 + (t - PAY) * 1.6) }));
A(PAY, "rea", "look", { to: [0, 0], dur: 0.01, blink: false });
A(PAY, "rea", "expr", { expr: "smug", set: { curve: 0.04, smirk: 0.12 }, dur: 0.01 });
A(PAY, "dra", "look", { to: [-0.15, 0.1], dur: 0.15, blink: false });
sfx(PAY, "freewheel", { gain: 0.35, dur: 1.68, reason: "Reaper's bicycle chain ticking as he pedals calmly in mid-air" });
// the Wizard opens his eyes, then looks over: Reaper is there
A(8.4, "wiz", "face", { lid: 0.05, brow: 0.3, dur: 0.25 });
A(8.4, "wiz", "expr", { expr: "kind", set: { curve: 0.15, open: 0.04 }, dur: 0.25 });
A(8.62, "wiz", "look", { to: [0.85, 0.05], dur: 0.15, blink: false });
act.shock(c, 8.78, "wiz", { open: 0.18, eye: 1.25, curve: -0.1, brow: 0.55, hold: 0.8 });
act.emote(c, 8.85, "wiz", "?!", { dur: 1.0 });
A(8.86, "wiz", "talk", { line: "huh?", tone: "question", dur: 0.35, voice: false });
// Reaper: eyes on the sky ahead, then a calm glance back at him, then ahead again
A(9.25, "rea", "look", { to: [-0.75, 0.05], dur: 0.15, blink: false });
A(9.25, "rea", "expr", { expr: "smug", set: { curve: 0.06, smirk: 0.2 }, dur: 0.25 });
A(8.75, "dra", "look", { to: [0.7, 0.05], dur: 0.15, blink: false });   // Dragon looks at Reaper too, so every eye-line points at him
A(9.3, "rea", "still", { dur: 0.45, idle: 0.05 });
A(9.78, "rea", "look", { to: [0, 0], dur: 0.15, blink: false });

// ---------------------------------------------------------------- shots
// 1-5: one first-person take along the trail with a rider's vibration, the root hop and the plank in it
const POV = { pos: camPos(0), look: camLook(0), fov: 75, to: { pos: camPos(5.0), look: camLook(5.0) }, dur: 5.0, ease: "linear",
  hand: { rate: 6, bob: 0.009, sway: 0.006, roll: 0.4, lead: 1, dips: [[ROOT_HOP, -0.06, 0.34], [r3(ROOT_HOP + 0.34), 0.035, 0.15], [PLANK_ON, -0.05, 0.12], [3.3, 0.015, 0.08], [3.6, 0.015, 0.08], [PLANK_OFF, 0.04, 0.12]] } };
// 6-7: a side wide from beyond the edge, panning with the fall and the catch (the cliff wall recedes at the left)
// it pans at a steady speed onto Dragon's line, then rides along with him at his speed until the cut
const WIDE_END = 7.2, OFF = [6.3, 1.4, 0.9], onDra = (t) => { const d = draAt(t); return [r3(d[0]), r3(d[1] + 1.2), r3(d[2])]; };
const WIDE = { pos: [6.3, 1.1, -8.05], look: [0, 0.25, -7.95], fov: 52, to: { pos: onDra(WIDE_END).map((v, i) => r3(v + OFF[i])), look: onDra(WIDE_END) }, dur: r3(WIDE_END - 5.0), ease: "linear" };
// 8: a tracking two-shot in the air, from the travel side looking out over the valley, with a slow push
const mid = (t) => { const d = draAt(t); return [d[0] - 0.25, d[1] + 1.75, d[2] - 0.8]; };
const F0 = mid(PAY), F1 = mid(END), CAMOFF = [5.5, 0.3, 1.2], PUSH = 0.9;
const LIFT = [0, 0.3, 0];   // Dragon low in the frame, the Wizard and Reaper in the upper middle
const FINAL = { pos: F0.map((v, i) => r3(v + CAMOFF[i])), look: F0.map((v, i) => r3(v + LIFT[i])), fov: 44, to: { pos: F1.map((v, i) => r3(v + CAMOFF[i] * PUSH)), look: F1.map((v, i) => r3(v + LIFT[i])) }, dur: r3(END - PAY), ease: "linear" };
// 7b: the same pose, riding along with Dragon until the cut (no cut here)
const CARRY_AT = WIDE_END;
const CARRY = { pos: WIDE.to.pos, look: WIDE.to.look, fov: 52, to: { pos: onDra(PAY).map((v, i) => r3(v + OFF[i])), look: onDra(PAY) }, dur: r3(PAY - CARRY_AT), ease: "linear" };
const beats = c.beats([
  ["full speed", 0, POV, "hook"],
  ["easy", 1.1, "keep"],
  ["root", 2.0, "keep"],
  ["plank", 3.0, "keep", "escalation"],
  ["show-off", 4.0, "keep"],
  ["cliff", 5.0, WIDE],
  ["catch", CATCH, "keep"],
  ["carried", CARRY_AT, CARRY],
  ["still pedalling", PAY, FINAL, "payoff"],
], END);

// distances that must stay clear in the fall (printed so a change of path can't quietly merge them)
{
  let m = { bike: 9, staff: 9 };
  for (let t = DRA_IN; t < 8.0; t += 0.02) {
    const d = draAt(t), mid = [d[0], d[1] + 0.72 * DRA_SCALE, d[2]];
    const dist = (p) => Math.hypot(p[0] - mid[0], p[1] - mid[1], p[2] - mid[2]);
    m.bike = Math.min(m.bike, dist(bikeFall(t))); m.staff = Math.min(m.staff, dist(staffFall(t)));
  }
  console.log(`clearances from Dragon's middle: bike ${m.bike.toFixed(2)} m, staff ${m.staff.toFixed(2)} m; Reaper leaves the edge at ${REA_EDGE} s; catch at`, W_CATCH.map(r2));
}

write(import.meta.url, {
  id: "the-easy-trail",
  title: "The Easy Trail",
  idea: "Jonny's friend comedies 24 (30 Oct 2026): 'my friend said this trail was easy': a first-person ride behind Reaper ends off a cliff; Dragon catches the Wizard, and Reaper never needed the ground",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  castLook: "golden",   // golden skin, bigger eyes (Jonny, 30 Oct; engine/load.mjs castLook)
  set: { type: "trail", seed: 7, light: "golden", windows: false, key: [6, 12, 6], shadowSize: 18, bloom: "emissive",
    aperture: FOCUS ? 0.03 : 0, ...(FOCUS && { focus: "acting" }) },
  music: { styles: ["funk", "chip", "bounce"] },
  sound: { sfx: 0.7, ambience: 0.25, room: "forest", signature: false },
  hook: { show: ["rea"], hint: 0, what: "a first-person ride racing down a forest trail behind Reaper on a tiny bike" },
  creative: { length: [10, 10] },
  cast, props, captions: c.captions, beats, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip: [
    { who: "wiz", with: "bw", from: 0, to: LAUNCH + 0.2, reason: "the Wizard sits on his bike, gloves round its grips" },
    { who: "rea", with: "br", from: 0, to: END, reason: "Reaper sits on his tiny bike, gloves round its grips" },
    { who: "wiz", with: "dra", from: CATCH - 0.05, to: END, reason: "the Wizard sits astride Dragon's back, his gloves on Dragon's crown" },
  ],
  notes: "Generated by storyboards/friend-comedies/24-the-easy-trail/make-the-easy-trail.mjs.",
});
