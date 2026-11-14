// HOW COULD 4 FRIENDS MOVE A STONEHENGE STONE? THE 10x VERSION (reference clip, not for posting).
// Jonny 14 Nov 2026 20:54 Berlin on draft 1: "pointless and boring"; 20:57 picked option A as a REFERENCE: "such a video would fit
// into the video of the stonehenge mystery episode. to visualize the scientific side ... just as refference if we could use
// analogies like this for future videos of the mystery series". Draft 1's generator (make-stonehenge-stone.mjs) stays as it is.
// Opener A: the last stone, a sunset clock, the four already heaving at frame 0.
//   node storyboards/series/friends-try-to/08-move-a-stonehenge-stone/make-stonehenge-stone-10x.mjs   (--no-vo for local drafts)
//
// THE CHAIN (stake + clock, then a staircase): the last stone must stand before sunset, SO four friends pull: nothing; a real
// test says ten people per tonne, SO forty: it creeps; SO two hundred and fifty: it slides (the real answer, as a spectacle);
// at the gap they tip it up, BUT it crashes back with ten seconds left; SO a shadow: the ring ship sets it in the gap at 0:00.
//
// SET FRAME (DESIGN 1): s forward along the rails, r to the right, y up; G = the stone's middle on the ground = world (GX, 0, 0)
// on PLACE(0); world x = GX - s, z = -r; travel = world -x toward the ring (centre at the origin, real scale, upright 23 left out:
// it is the gap at x 15.5 on the travel line).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { plain, stones, SH_A, FAR, PLACE } from "../../ancient-aliens/02-stonehenge/kit/sh-kit.mjs";

const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
const READY = new Set((process.env.READY ?? "crew").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);

// ---------------------------------------------------------------- the beats (video s)
const T = { chip: 2.6, slip: 3.8, wide: 5.2, forty: 7.8, many: 10.4, tip: 14.6, up: 15.0, wob: 16.4, crash: 16.85, shade: 18.2,
  beam: 19.6, on: 19.9, lift: 20.3, set: 23.0, tag: 24.0, END: 27.2 };
const END = T.END;
const O = PLACE(0), GX = 160;
const W = (s, y, r) => [r3(O[0] + GX - s), r3(y), r3(O[1] - r)];
const WP = (s, r) => [r3(O[0] + GX - s), r3(O[1] - r)];
const xyz = ([x, y, z]) => ({ x, y, z });
const FWD = -90, TO_CAM = 180;
const PARK = [O[0] + 600, O[1] + 600];
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const park = (t, who, k) => { place(t, who, [PARK[0] + k * 3, PARK[1]], 0, 0); arm(t - 0.02, who, "L", "rest", 0.01); arm(t - 0.02, who, "R", "rest", 0.01); A(r3(t - 0.02), who, "pitch", { to: 0, dur: 0.01 }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const Pc = (t, id, set, dur, ease) => { if (has("crew")) P(t, id, set, dur, ease); };
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 420;
const arm = (t, who, side, pose, dur = 0.2, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.08) => A(r3(t), who, "grip", { side, shape, dur });
const big = (t0, t1, text, pos = 300, size = 96) => cap(r3(t0), r3(t1), text, pos, false, { size, kinetic: false });
const label = (t0, t1, text, pos = 230, size = 46) => cap(r3(t0), r3(t1), text, pos, false, { style: "label", size, kinetic: false });
const WHO = ["spud", "chip", "wedge", "mash"];

// ---------------------------------------------------------------- the rig (DESIGN 2, 4, 5)
const DECK = 0.84, STONE = [4.25, 2.1, 1.1], L = STONE[0];
const ROPE = { A: { from: [2.5, 0.77, 0.88], grip: [6.5, 0.56, 1.58], end: [7.45, 0.04, 2.13], side: 1 },
               B: { from: [2.5, 0.77, -0.88], grip: [6.5, 0.38, -1.46], end: [7.45, 0.04, -2.01], side: -1 } };
const ropeAt = (k, q) => { const { from: a, grip: h } = ROPE[k]; return W(a[0] + q * (h[0] - a[0]), a[1] + q * (h[1] - a[1]), a[2] + q * (h[2] - a[2])); };
const PULL = {
  wedge: { rope: "A", at: [5.83, 2.03], q: [0.87, 0.82], near: "L" },
  spud:  { rope: "A", at: [6.35, 1.06], q: [1.00, 0.95], near: "R" },
  chip:  { rope: "B", at: [6.35, -1.04], q: [1.00, 0.95], near: "L" },
  mash:  { rope: "B", at: [5.83, -1.76], q: [0.87, 0.82], near: "R" },
};
const other = (s) => (s === "L" ? "R" : "L");
// the gap: upright 23 of the ring stands at (15.5, 0) (SH_STONES_PARTS.stone(23)); our stone stood up there has its foot edge at
// QX and its middle at y L/2. Tipping about that edge: tilt -a (deg) puts the origin at (QX + L/2 cos a, L/2 sin a).
const QX = 16.05;
const tipAt = (a) => { const k = (a * Math.PI) / 180; return { x: r3(QX + (L / 2) * Math.cos(k)), y: r3((L / 2) * Math.sin(k)), tilt: r3(-a) }; };
const DRAG = 8;   // metres the 250 drag the stone in the time-lapse

// ---------------------------------------------------------------- cast
const cast = WHO.map((id, i) => ({ id, character: `potatobrawl/${id}`, at: WP(...PULL[id].at), face: FWD, expr: "focused", follow: 0.3, seed: [1.3, 4.4, 2.2, 3.1][i] }));

// ---------------------------------------------------------------- props
const sunSet = { sunAz: 20.5, sunEl: 11, sunColor: "#fff3c4" };
const land = plain("pl", O, { era: "new", T: 25 }).filter((p) => !/-(henge|avenue)$/.test(p.id)).map((p) => (p.id === "pl-ground" ? { ...p, trees: false, ditch: false } : p));
const ring = stones("pl", O, { era: "new", T: 25, built: 1, gapUprights: [23], gap: [22, 23] });
const G = W(0, 0, 0), FRONT = W(2.5, 0, 0);
const NIL = { kind: "stoneblock", w: 0.01, h: 0.01, d: 0.01, y: -60 };
const props = [
  ...land, ...ring,
  { id: "rails", kind: "haulrails", x: G[0], y: 0, z: G[2], rot: 180, creep: 0, skid: 0, skidAt: [6.35, -1.04], staged: "the track lies on its sleepers in the turf" },
  { id: "sledge", kind: "haulsledge", x: G[0], y: 0, z: G[2], rot: 180, staged: "the sledge rides on the rails" },
  { id: "stone", kind: "fallensarsen", x: G[0], y: DECK, z: G[2], rot: 0, size: STONE, look: "today", pieces: 1, sink: 0, fringe: false, seed: 3, ...sunSet, staged: "on the sledge, then on the ground at the gap, tipped, carried by the beam" },
  { id: "lash", kind: "haullash", x: G[0], y: DECK, z: G[2], rot: 0, size: STONE, staged: "the lashings round the stone" },
  { id: "ropeA", kind: "haulrope", x: G[0], y: 0, z: G[2], rot: 180, ...ROPE.A, slack: 0, staged: "tied to the sledge, held or lying on the frost" },
  { id: "ropeB", kind: "haulrope", x: G[0], y: 0, z: G[2], rot: 180, ...ROPE.B, slack: 0, staged: "tied to the sledge, held or lying on the frost" },
  has("crew") ? { id: "crew", kind: "haulcrew", ...xyz(FRONT), y: -60, rot: 180, n: 250, grow: 0.16, heave: 1, walk: 0, staged: "the haul crew on the ropes" } : { id: "crew", ...NIL },
  has("crew") ? { id: "crew2", kind: "haulcrew", x: 15.2, y: -60, z: 0, rot: 180, n: 60, grow: 1, heave: 1, walk: 0, staged: "the crew pulling the stone upright from inside the ring" } : { id: "crew2", ...NIL },
  { id: "ship", kind: "ringship", x: 15.5, y: 80, z: 0, s: 0.35, beam: 0, lit: 0.4, beamLen: 40, beamR: 7.1, staged: "the ring ship hovers over the gap" },
];
P(0, "rails", { creep: 0, skid: 0 }); P(0, "ropeA", { slack: 0 }); P(0, "ropeB", { slack: 0 });
P(0, "stone", { x: G[0], y: DECK, tilt: 0 }); P(0, "lash", { x: G[0], y: DECK, tilt: 0 }); P(0, "sledge", { x: G[0] });
Pc(0, "crew", { x: FRONT[0], grow: 0.16, heave: 1, walk: 0 }); P(0, "ship", { y: 80, beam: 0 });

const groan = (t, who, gain = 0.3) => sfx(r3(t), "groan", { gain, reason: `${who} straining` });
const creak = (t, gain = 0.3, why = "the rope and the sledge's lashings creaking under the strain") => sfx(r3(t), "creak", { gain, reason: why });
for (let t = 0; t < END - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain: 0.05, dur: r3(Math.min(6, END - t)), reason: "cold wind over the open plain, far under" });
const clock = (t0, t1, text) => label(t0, t1, `SUNSET ${text}`);

// ================================================================= 01 THE LAST STONE (0-2.6) + 02 CHIP (2.6-3.8) + 03 THE SLIP (3.8-5.2)
const ropeHold = (t, who) => { const h = PULL[who]; arm(t, who, h.near, { world: ropeAt(h.rope, h.q[0]) }, 0.01); arm(t, who, other(h.near), { o: [0.22, 0.32, 0.12] }, 0.01); grip(t, who, "L", "fist", 0.01); grip(t, who, "R", "fist", 0.01); };
for (const who of WHO) { ropeHold(0, who); A(0, who, "pitch", { to: 18, dur: 0.01 }); expr(0, who, "angry", { brow: 1, open: 0.15 }, 0.01); look(0, who, [0, 0.1], 0.01); }
WHO.forEach((who, i) => { for (let t = 0.15 + i * 0.13; t < T.slip - 0.1; t = r3(t + 0.6)) { A(r3(t), who, "pitch", { to: 24, dur: 0.25 }); A(r3(t + 0.3), who, "pitch", { to: 18, dur: 0.25 }); A(r3(t), who, "squash", { amount: 0.04, dur: 0.25 }); } });
big(0, T.chip, "25 t", 300, 110);
clock(0, T.forty, "3 h");
groan(0.1, "the four"); creak(0.3); groan(1.2, "Wedge", 0.25); creak(1.6, 0.25); groan(2.2, "Mash", 0.25);
see(0, T.chip, ["spud", "chip", "wedge", "mash", "stone"], "frame 0: four friends heaving on two ropes at the last stone, a sunset clock running");
P(T.chip, "rails", { skid: 1 }, 1.1, "out");
expr(T.chip, "chip", "angry", { brow: 1, open: 0.05 }, 0.08); A(r3(T.chip + 0.05), "chip", "blink", { dur: 0.9 });
c.say(r3(T.chip + 0.2), "chip", "Let's go!", 0.8, "excited", { voice: false, sub: "Let's go!", pos: 330 });
sfx(r3(T.chip + 0.1), "scrape", { gain: 0.3, reason: "Chip's trainers scraping through the frost" });
see(T.chip, T.slip, ["chip.face"], "Chip at the front of the rope, straining, trainers scraping lines in the frost");
P(T.slip, "ropeA", { slack: 1 }, 0.35, "out"); P(T.slip, "ropeB", { slack: 1 }, 0.35, "out");
for (const who of WHO) { const fl = (sd) => (who === "mash" && sd === "R") ? [0.16, 0.25, -0.02] : (who === "chip" && sd === "L") ? [0.1, 0.3, 0.25] : [0.22, 0.35, 0.3]; grip(T.slip, who, "L", "open", 0.06); grip(T.slip, who, "R", "open", 0.06); arm(T.slip + 0.02, who, "L", { o: fl("L") }, 0.2, "out"); arm(T.slip + 0.02, who, "R", { o: fl("R") }, 0.2, "out"); expr(T.slip + 0.05, who, "shocked", { open: 0.5, eye: 1.3 }, 0.08); }
for (const [who, ds] of Object.entries({ spud: 0.45, wedge: 0.35, mash: 0.22 })) { const [s, r] = PULL[who].at; A(r3(T.slip + 0.03), who, "move", { to: WP(s + ds, r), dur: 0.45, steps: 3, ease: "out" }); A(r3(T.slip + 0.03), who, "pitch", { to: 10, dur: 0.3 }); A(r3(T.slip + 0.5), who, "pitch", { to: 0, dur: 0.35 }); }
A(r3(T.slip + 0.03), "chip", "move", { to: WP(7.35, -1.25), dur: 0.42, steps: 2, ease: "in" }); A(r3(T.slip + 0.03), "chip", "pitch", { to: 82, dur: 0.42, ease: "in" });
sfx(r3(T.slip + 0.45), "land", { gain: 0.5, reason: "Chip hitting the frozen ground" });
sfx(r3(T.slip + 0.02), "ai/bag-drag", { gain: 0.25, reason: "the rope whipping through the gloves onto the frost" });
big(r3(T.slip + 0.5), T.wide, "4 ✗", 300, 110);
see(T.slip, T.wide, ["chip", "stone"], "the ropes slack on the frost, Chip flat on his face, the stone not moved an inch");

// ================================================================= 04 THE NUMBERS (5.2-7.8): the real test, from above behind the stone
const WIDE_AT = { wedge: [1.2, 4.3], spud: [1.6, 3.4], chip: [2.0, 2.6], mash: [2.5, 1.85] };
for (const [who, [s, r]] of Object.entries(WIDE_AT)) { place(T.wide, who, WP(s, r), 135, 0); A(r3(T.wide - 0.02), who, "pitch", { to: 0, dur: 0.01 }); arm(T.wide - 0.02, who, "L", "rest", 0.01); arm(T.wide - 0.02, who, "R", "rest", 0.01); grip(T.wide - 0.02, who, "L", "relaxed", 0.01); grip(T.wide - 0.02, who, "R", "relaxed", 0.01); expr(T.wide - 0.02, who, "deadpan", { lid: 0.2 }, 0.01); look(T.wide - 0.02, who, [-0.4, 0.3], 0.01); }
label(T.wide + 0.2, r3(T.wide + 1.4), "UCL 2016: 1 t = 10", 310, 54);
big(r3(T.wide + 1.4), T.forty, "25 t × 10 = 250", 300, 84);
see(T.wide, T.forty, ["stone", "rails"], "the four friends small beside the giant stone, the rails running off toward the stone ring with its one gap");

// ================================================================= 05 FORTY (7.8-10.4): forty on the ropes, the stone creeps
P(T.forty - 0.02, "ropeA", { y: -60 }); P(T.forty - 0.02, "ropeB", { y: -60 });   // the crew brings its own ropes
Pc(T.forty - 0.02, "crew", { y: 0, grow: 0.16, heave: 1, walk: 0 });
const SIDE = { spud: [0.2, -2.6], chip: [1.1, -2.5], wedge: [-0.8, -2.7], mash: [2.0, -2.6] };
for (const [who, [s, r]] of Object.entries(SIDE)) { place(T.forty, who, WP(s, r), TO_CAM, 0); expr(T.forty - 0.02, who, "focused", { brow: 0.6 }, 0.01); look(T.forty - 0.02, who, [-0.5, 0.1], 0.01); }
P(T.forty + 0.6, "stone", { x: r3(G[0] - 0.05) }, 1.2, "inOut"); P(T.forty + 0.6, "lash", { x: r3(G[0] - 0.05) }, 1.2, "inOut"); P(T.forty + 0.6, "sledge", { x: r3(G[0] - 0.05) }, 1.2, "inOut"); P(T.forty + 0.6, "rails", { creep: 0.05 }, 1.2, "inOut");
big(T.forty, T.many, "40", 300, 120); clock(T.forty, T.many, "1 h");
creak(T.forty + 0.3, 0.45, "forty pulling: the lashings and runners groan"); groan(T.forty + 0.2, "forty haulers", 0.4); sfx(r3(T.forty + 0.7), "scrape", { gain: 0.35, reason: "the runners grinding 5 cm along the frosted rails" });
expr(T.forty + 1.6, "spud", "shocked", { open: 0.25 }, 0.1);
see(T.forty, T.many, ["stone", "sledge"], "forty Stone Age haulers leaning into the two ropes; the stone creeps a few centimetres; the four watching");

// ================================================================= 06 TWO HUNDRED AND FIFTY (10.4-14.6): the real answer, as a spectacle
for (const [k, who] of WHO.entries()) park(T.many, who, k);
Pc(T.many - 0.02, "crew", { grow: 1, walk: 1 });
for (const id of ["stone", "lash", "sledge"]) P(T.many + 0.2, id, { x: r3(G[0] - 0.05 - DRAG) }, 4.0, "inOut");
Pc(T.many + 0.2, "crew", { x: r3(FRONT[0] - DRAG) }, 4.0, "inOut");
big(T.many, T.tip, "250 ✓", 300, 120); clock(T.many, r3(T.many + 2.0), "1 h"); clock(r3(T.many + 2.0), T.tip, "10 min");
groan(T.many + 0.2, "two hundred and fifty haulers", 0.4); sfx(r3(T.many + 0.4), "scrape", { gain: 0.4, dur: 3.6, reason: "the sledge sliding fast along the rails" }); creak(T.many + 1.5, 0.4);
see(T.many, T.tip, ["stone", "crew"], "from the air: two hundred and fifty haulers on two long ropes dragging the stone along the rails toward the ring");

// ================================================================= 07 THE TIP (14.6-18.2): at the gap they pull it upright; it wobbles, crashes back
for (const id of ["sledge", "rails"]) P(T.tip - 0.02, id, { y: -60 });
Pc(T.tip - 0.02, "crew", { y: -60 }); Pc(T.tip - 0.02, "crew2", { y: 0, heave: 1, walk: 0 });
P(T.tip - 0.02, "stone", tipAt(0)); P(T.tip - 0.02, "lash", tipAt(0));
const AT_GAP = { wedge: [20.69, 5.52], spud: [21.5, 4.51], chip: [22.3, 3.49], mash: [23.11, 2.48] };   // world x, z: outside the ring, one row square to the tip camera, watching
for (const [k, [who, at]] of Object.entries(AT_GAP).entries()) { place(T.tip, who, at, -140 + k * 4, 0); expr(T.tip - 0.02, who, "focused", { brow: 0.8 }, 0.01); look(T.tip - 0.02, who, [-0.3, 0.6], 0.01); }
const tip = (t, a, dur, ease) => { for (const id of ["stone", "lash"]) P(t, id, tipAt(a), dur, ease); };
tip(T.up, 76, 1.3, "inOut"); tip(r3(T.up + 1.3), 83, 0.3, "out"); tip(r3(T.up + 1.6), 79, 0.25, "inOut"); tip(r3(T.up + 1.85), 81, 0.2, "inOut");
tip(T.wob, 72, 0.25, "in"); tip(r3(T.wob + 0.25), 0, 0.45, "in");   // it goes over backwards: crash at T.crash + 0.25
groan(T.up, "the crew", 0.35); creak(T.up + 0.6, 0.45, "ropes straining as the stone rises");
sfx(r3(T.crash), "rumble", { gain: 0.6, reason: "25 tonnes hitting the ground" }); sfx(r3(T.crash), "land", { gain: 0.7, reason: "the stone's crash" });
c.at(r3(T.crash), { fx: "shake", dur: 0.5, amp: 0.08 });
c.at(r3(T.crash), { fx: "poof", pos: [18.2, 0.2, 0], dur: 1.0, color: "#cfc6b4", puffs: 16, sparks: 0, size: 0.8, lift: 0.2, sound: false });
for (const who of WHO) expr(T.wob + 0.1, who, "terrified", { open: 0.5, eye: 1.3 }, 0.08);
clock(T.tip, T.crash, "10 min"); clock(T.crash, T.beam, "0:10");
see(T.tip, T.shade, ["stone"], "at the gap they haul the stone upright; it nearly stands, wobbles and crashes back down");

// ================================================================= 08 THE SHADOW (18.2-19.6)
for (const who of WHO) { look(T.shade + 0.2, who, [0, 0.7], 0.15); expr(T.shade + 0.3, who, "shocked", { open: 0.55, eye: 1.3 }, 0.1); }
c.at(T.shade, { fx: "shade", dur: 1.4, from: -1.4, to: 0.6, width: 2.6, angle: 0, peak: 0.5 });
sfx(r3(T.shade), "rumble", { gain: 0.3, reason: "a deep hum from far above" });
clock(T.shade, T.beam, "0:05");
see(T.shade, T.beam, ["spud.face", "chip.face", "wedge.face", "mash.face"], "the four look up, mouths open, as a giant shadow slides over them");

// ================================================================= 09 THE BEAM (19.6-24.0): the ship stands it in the gap at 0:00
P(T.beam - 0.02, "ship", { y: 22 }); P(T.beam, "ship", { y: 15 }, 1.0, "out"); P(T.on, "ship", { beam: 0.6 }, 0.4, "out");
Pc(T.beam - 0.02, "crew2", { heave: 0 });
const mid = { x: 17.0, y: 5.0, tilt: -45 };
for (const id of ["stone", "lash"]) { P(T.lift, id, mid, 1.3, "inOut"); P(r3(T.lift + 1.3), id, tipAt(90), 1.4, "inOut"); }
sfx(r3(T.on), "rumble", { gain: 0.4, reason: "the beam's deep hum" }); sfx(r3(T.set), "land", { gain: 0.5, reason: "the stone settling into its socket" });
clock(T.beam, T.set, "0:03"); clock(T.set, END, "0:00");
see(T.beam, T.tag, ["ship", "stone"], "the ring ship's beam lifts the stone and stands it in the gap, the ring complete, as the clock hits 0:00");

// ================================================================= 10 THE WINK (24.0-27.2)
const WINK = { spud: [20.0, 2.0], chip: [20.9, 1.2], wedge: [20.3, 3.1], mash: [21.6, 0.2] };
for (const [who, at] of Object.entries(WINK)) place(T.tag, who, at, who === "spud" ? 110 : -110, 0);
for (const who of ["chip", "wedge", "mash"]) { expr(T.tag - 0.02, who, "shocked", { open: 0.4 }, 0.01); look(T.tag - 0.02, who, [0, 0.6], 0.01); }
expr(T.tag - 0.02, "spud", "deadpan", { lid: 0.45 }, 0.01); look(T.tag - 0.02, "spud", [0, 0], 0.01);
see(T.tag, END, ["spud.face", "stone"], "the stone stands in its gap; Spud turns to us, deadpan; the others still staring up");

// ---------------------------------------------------------------- cameras
const cam = (pos, lk, fov, o = {}) => ({ pos: W(...pos), look: W(...lk), fov, ...o });
const wcam = (pos, lk, fov, o = {}) => ({ pos, look: lk, fov, ...o });
const SH = {
  pull:  cam([13, 1.3, 0], [5.5, 1.0, 0], 52),
  chip:  cam([9.2, 0.42, -0.5], [6.35, 0.42, -1.15], 32),
  slip:  cam([11.4, 1.5, -2.6], [6.0, 0.45, -0.6], 44),
  wide:  cam([-21, 9.5, 5.5], [14, 2.0, -0.5], 52),
  forty: cam([1.0, 1.7, 9.0], [8.0, 0.7, 0], 52),
  many:  wcam([178, 34, 44], [100, 0, 0], 46, { to: { pos: [168, 30, 40], look: [92, 0, 0], fov: 46 }, dur: 4.2, ease: "linear" }),
  tip:   wcam([27.5, 1.1, 8.5], [17.5, 2.6, 0], 52),
  shade: wcam([16.7, 1.9, -0.7], [21.9, 1.0, 4.0], 50),
  beam:  wcam([31, 1.0, 11], [16.5, 7.5, 0], 62),
  tag:   wcam([25.5, 1.0, 1.2], [19.5, 1.3, 2.0], 50),
};
const CUTS = [
  ["01 the last stone", 0, SH.pull, "hook"], ["02 Chip", T.chip, SH.chip], ["03 the slip", T.slip, SH.slip],
  ["04 ten per tonne", T.wide, SH.wide], ["05 forty", T.forty, SH.forty], ["06 two hundred and fifty", T.many, SH.many],
  ["07 the tip", T.tip, SH.tip], ["08 the shadow", T.shade, SH.shade, "reveal"], ["09 the beam", T.beam, SH.beam, "payoff"],
  ["10 the wink", T.tag, SH.tag, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1), in the gaps
const NARR = !VO ? [] : [
  [0.15, "The last stone. Three hours left.", 2.1],
  [T.wide + 0.2, "Real test: ten people per tonne.", 2.2],
  [T.many + 0.5, "Two hundred and fifty. That's how.", 2.2],
  [T.tag + 0.4, "...Or did they have help?", 1.7],
];
for (const [t, line, dur, pos = SUBY] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos, gain: 4.0 });

const beats = c.beats(CUTS, END);
const allowClip = [
  ...WHO.map((who) => ({ who, with: PULL[who].rope === "A" ? "ropeA" : "ropeB", from: 0, to: r3(T.slip + 0.1), reason: "gloves round the pull rope" })),
];

write(import.meta.url, {
  id: VO ? "stonehenge-stone-10x" : "stonehenge-stone-10x-no-vo",
  title: "The last stone before sunset",
  idea: "Reference for the mystery series: the science side as a staircase. Four friends can't move the last 25 t stone; forty make it creep; two hundred and fifty drag it (the real answer); at the gap it tips back with ten seconds left, and the ring ship stands it in place at sunset",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [120, 640],
  castLook: LOOK, cleanStart: true, far: FAR,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { ...SH_A, para: 0, aperture: 0, hatch: HATCH, cel: CEL, ink: true, satsuei: true, lighting: { ...SH_A.lighting } },
  music: { file: process.env.MUSIC ?? "stonehenge-stone/stonehenge-stone-10x-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  hook: { show: ["spud", "chip", "wedge", "mash", "stone"], hint: 0, what: "four friends heaving on two ropes at the last 25 t stone; text 25 t, SUNSET 3 h" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/friends-try-to/08-move-a-stonehenge-stone/make-stonehenge-stone-10x.mjs.",
});
