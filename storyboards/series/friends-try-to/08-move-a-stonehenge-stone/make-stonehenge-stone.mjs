// HOW COULD 4 FRIENDS MOVE A STONEHENGE STONE? (Friends try to 08; trial 1 of the combined niche "Spud & friends find out").
// Jonny 14 Nov 2026: "lets build this as our first try" (12:24 Berlin), outline + 10-panel sheet "looks good" (12:47).
// Sheet: /mnt/project-files/videos/friends-try-to/08-move-a-stonehenge-stone/sheets/friends-08-stonehenge-sheet-1.png.
// Opener A: the pull is already running at frame 0 (stake "4 vs 25 t" + the distance clock "0 m / 25 km").
// Set design: DESIGN.md (Fable). Props: engine/page/props-ftt-haul.js. Places, cameras, decisions: NOTES.md.
//   node storyboards/series/friends-try-to/08-move-a-stonehenge-stone/make-stonehenge-stone.mjs   -> stonehenge-stone.json
//   ... --no-vo -> stonehenge-stone-no-vo.json (no narrator: staging and local drafts)
//
// THE BRIEF
//   Want:  four friends want to move a 25 t sarsen the 25 km to Stonehenge.
//   Chain: they pull it on a sledge over timber rails, SO it won't budge (a real test: 10 people per tonne, so ~250 for this one);
//          SO they pry it with a lever on a pivot stone, BUT it creeps 5 cm and Chip is spent; SO, out of ideas, a shadow
//          falls over them: a ring ship's beam lifts the stone (the mystery answer); the wink: a crew of ~250 drags the next one.
//   Facts: RESEARCH in NOTES.md (UCL 2016 sledge test; Wallington's lever + pivot method: possible, but centimetres at a time).
//
// SET FRAME (DESIGN 1): s = metres forward along the travel line, r = metres to the right of travel, y up; G = the ground under
// the stone's middle = world (124, 0, 0) on PLACE(0); world x = 124 - s, z = -r. Travel = world -x, toward the ring 124 m ahead.
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { plain, stones, SH_A, FAR, PLACE } from "../../ancient-aliens/02-stonehenge/kit/sh-kit.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
// the builder's pack: until props-ftt-haul.js is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "haul").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), staged: "stand-in box", ...stand });
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };

// ---------------------------------------------------------------- the beats (video s)
// 01 the pull | 02 Chip strains | 03 the rope slips | 04 the numbers | 05 Wedge's lever | 06 the hang | 07 5 cm |
// 08 the shadow | 09 the beam (thumbnail) | 10 the wink
const T = { chip: 2.5, slip: 3.7, wide: 5.0, count: 6.9, wedge: 8.0, hang: 9.6, pump: 10.0, endc: 10.8, creep: 12.0, mash: 14.0,
  shade: 14.4, beam: 16.0, on: 16.35, lift: 16.9, tag: 21.0, END: 25.5 };
const END = T.END;
const O = PLACE(0), GX = 124;
const W = (s, y, r) => [r3(O[0] + GX - s), r3(y), r3(O[1] - r)];
const WP = (s, r) => [r3(O[0] + GX - s), r3(O[1] - r)];
const FWD = -90, TO_CAM = 180;   // yaw: facing +s (travel) | facing +r (the sun side, where the cameras stand)
const PARK = [O[0] + 600, O[1] + 600];
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 420;   // speech lettering in the upper third, never over a face (Jonny 12 Nov)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });
const arm = (t, who, side, pose, dur = 0.2, ease = "inOut") => c.arm(r3(t), who, side, pose, dur, ease);
const grip = (t, who, side, shape, dur = 0.08) => A(r3(t), who, "grip", { side, shape, dur });
const big = (t0, t1, text, pos = 300, size = 110) => cap(r3(t0), r3(t1), text, pos, false, { size, kinetic: false });
const label = (t0, t1, text, pos = 230, size = 46) => cap(r3(t0), r3(t1), text, pos, false, { style: "label", size, kinetic: false });

// ---------------------------------------------------------------- the rig's numbers (DESIGN 2, 4, 5)
const DECK = 0.84, STONE = [4.25, 2.1, 1.1];
const ROPE = { A: { from: [2.5, 0.77, 0.88], grip: [6.5, 0.56, 1.58], end: [7.45, 0.04, 2.13], side: 1 },
               B: { from: [2.5, 0.77, -0.88], grip: [6.5, 0.38, -1.46], end: [7.45, 0.04, -2.01], side: -1 } };
const ropeAt = (k, q) => { const { from: a, grip: h } = ROPE[k]; return W(a[0] + q * (h[0] - a[0]), a[1] + q * (h[1] - a[1]), a[2] + q * (h[2] - a[2])); };
// who holds which rope: body (s, r), gloves at q (front, rear); the rope-side hand takes the rear grip, the other the front
const PULL = {
  wedge: { rope: "A", at: [5.83, 2.03], q: [0.87, 0.82], near: "L" },
  spud:  { rope: "A", at: [6.35, 1.06], q: [1.00, 0.95], near: "R" },
  chip:  { rope: "B", at: [6.35, -1.04], q: [1.00, 0.95], near: "L" },
  mash:  { rope: "B", at: [5.83, -1.76], q: [0.87, 0.82], near: "R" },
};
const other = (s) => (s === "L" ? "R" : "L");
// the lever: a point d from Q toward the far end at pump p; Q = set (-2.64, 0.986, 0)
const LQ = [-2.64, 0.986];
const th = (p) => ((20.9 - 12.9 * p) * Math.PI) / 180;
const pole = (d, p) => [LQ[0] - d * Math.cos(th(p)), LQ[1] + d * Math.sin(th(p))];
// up = glove height over the soles: 0.14 + 0.42 x body (DESIGN's 0.60 put the gloves at eye height: face-covered); r off the pole so it clears the body
const HANG = { mash: { d: 1.0, r: -0.5, up: 0.39, g: 0.13 }, chip: { d: 1.66, r: -0.42, up: 0.21, g: 0.10 },
               spud: { d: 2.42, r: -0.5, up: 0.32, g: 0.13 }, wedge: { d: 3.34, r: -0.6, up: 0.34, g: 0.13 } };   // chins over the pole (0.14 + 0.2 x body): gloves under the faces
// facing +r a body's right hand is on world +x = -s: the right glove takes the point further from Q
const hangGlove = (who, side, p) => { const h = HANG[who], [s, y] = pole(h.d + (side === "R" ? h.g : -h.g), p); return W(s, y + 0.05, 0); };
const hangRoot = (who, p) => { const h = HANG[who], [s, y] = pole(h.d, p); return { at: WP(s, h.r), y: r3(y + 0.05 - h.up) }; };
// the stone pried by the lever (DESIGN 2): tilt and y in one tween with the pump
const pry = (p) => ({ tilt: r3(-1.62 * p), y: r3(DECK + 0.06 * p) });

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: WP(...PULL.spud.at), face: FWD, expr: "focused", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: WP(...PULL.chip.at), face: FWD, expr: "focused", follow: 0.3, seed: 4.4 },
  { id: "wedge", character: "potatobrawl/wedge", at: WP(...PULL.wedge.at), face: FWD, expr: "focused", follow: 0.3, seed: 2.2 },
  { id: "mash", character: "potatobrawl/mash", at: WP(...PULL.mash.at), face: FWD, expr: "focused", follow: 0.3, seed: 3.1 },
];

// ---------------------------------------------------------------- props
const sunSet = { sunAz: 20.5, sunEl: 11, sunColor: "#fff3c4" };
const land = plain("pl", O, { era: "new", T: 25 }).filter((p) => !/-(henge|avenue)$/.test(p.id)).map((p) => (p.id === "pl-ground" ? { ...p, trees: false, ditch: false } : p));
const ring = stones("pl", O, { era: "new", T: 25, built: 0.5 }).map((p) => ({ ...p, scale: 0.4 }));   // DESIGN Q1: at real scale it is 40 % of panel 04's width (sheet 14 %)
const STONE_AT = W(0, DECK, 0);
const props = [
  ...land, ...ring,
  ph("haul", { id: "rails", kind: "haulrails", x: STONE_AT[0], y: 0, z: STONE_AT[2], rot: 180, creep: 0, skid: 0, skidAt: [6.35, -1.04], staged: "the track lies on its sleepers in the turf" }, { ...box(35, 0.32, 1.25), x: r3(STONE_AT[0] - 15.4) }),
  ph("haul", { id: "sledge", kind: "haulsledge", x: STONE_AT[0], y: 0, z: STONE_AT[2], rot: 180, staged: "the sledge rides on the rails" }, box(5.15, DECK, 2.2)),
  { id: "stone", kind: "fallensarsen", x: STONE_AT[0], y: DECK, z: STONE_AT[2], rot: 0, size: STONE, look: "today", pieces: 1, sink: 0, fringe: false, seed: 3, ...sunSet, staged: "it lies on the timber sledge" },
  ph("haul", { id: "lash", kind: "haullash", x: STONE_AT[0], y: DECK, z: STONE_AT[2], rot: 0, size: STONE, staged: "the lashings round the stone" }, { ...box(0.01, 0.01, 0.01), y: -50 }),
  ph("haul", { id: "ropeA", kind: "haulrope", x: STONE_AT[0], y: 0, z: STONE_AT[2], rot: 180, ...ROPE.A, slack: 0, staged: "tied to the sledge, held or lying on the frost" }, { ...box(0.01, 0.01, 0.01), y: -50 }),
  ph("haul", { id: "ropeB", kind: "haulrope", x: STONE_AT[0], y: 0, z: STONE_AT[2], rot: 180, ...ROPE.B, slack: 0, staged: "tied to the sledge, held or lying on the frost" }, { ...box(0.01, 0.01, 0.01), y: -50 }),
  ph("haul", { id: "lever", kind: "haullever", ...(([x, y, z]) => ({ x, y, z }))(W(LQ[0], LQ[1], 0)), rot: 180, pump: 0, staged: "the lever rests on the pivot boulder" }, { ...box(4.4, 0.1, 0.1), y: 1.4 }),
  ph("haul", { id: "pivot", kind: "pivotstone", ...(([x, , z]) => ({ x, y: 0, z }))(W(LQ[0], 0, 0)), rot: 180 }, box(1.05, 0.93, 1.0)),
  { id: "ship", kind: "ringship", ...(([x, y, z]) => ({ x, y, z }))(W(0, 60, 0)), s: 0.35, beam: 0, lit: 0.4, beamLen: 43, beamR: 7.1, staged: "the ring ship hovers over the stone" },
  { id: "crew", kind: "haulteam", ...(([x, , z]) => ({ x, y: 0, z }))([O[0] + 138, 0, O[1] + 14]), rot: 180, track: 40, along: 0, staged: "the far crew" },
];

// seed every param that is first tweened later (an unseeded tween writes NaN)
Pk("haul", 0, "rails", { creep: 0, skid: 0 }); Pk("haul", 0, "ropeA", { slack: 0 }); Pk("haul", 0, "ropeB", { slack: 0 }); Pk("haul", 0, "lever", { pump: 0 });
P(0, "stone", { y: DECK, tilt: 0 }); Pk("haul", 0, "lash", { y: DECK, tilt: 0 });
P(0, "ship", { beam: 0 }); P(0, "crew", { along: 0, y: -60 }); P(T.tag - 0.02, "crew", { y: 0 });   // the crew only exists for the wink

const groan = (t, who, gain = 0.3) => sfx(r3(t), "groan", { gain, reason: `${who} straining` });
const creak = (t, gain = 0.3, why = "the rope and the sledge's lashings creaking under the strain") => sfx(r3(t), "creak", { gain, reason: why });
const wind = (from, to, gain = 0.06) => { for (let t = from; t < to - 0.2; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain, dur: r3(Math.min(6, to - t)), reason: "cold wind over the open plain, far under" }); };
wind(0, END);

// ================================================================= 01 THE PULL (0-2.5) + 02 CHIP STRAINS (2.5-3.7)
// Frame 0: all four already heaving on the two ropes, leaning into them; the 25 t stone towers behind on its sledge.
const ropeHold = (t, who, dur = 0.01) => {
  const h = PULL[who];
  arm(t, who, h.near, { world: ropeAt(h.rope, h.q[0]) }, dur); arm(t, who, other(h.near), { o: [0.22, 0.32, 0.12] }, dur);   // one glove on the rope (a cross-body reach comes out of the chest), the other a fist
  grip(t, who, "L", "fist", dur); grip(t, who, "R", "fist", dur);
};
for (const who of Object.keys(PULL)) { ropeHold(0, who); A(0, who, "pitch", { to: 18, dur: 0.01 }); expr(0, who, "angry", { brow: 1, open: 0.15 }, 0.01); look(0, who, [0, 0.1], 0.01); }
// the heave: a pulse of lean and squash every 0.6 s, out of step between the four
Object.keys(PULL).forEach((who, i) => { for (let t = 0.15 + i * 0.13; t < T.slip - 0.1; t = r3(t + 0.6)) { A(r3(t), who, "pitch", { to: 24, dur: 0.25 }); A(r3(t + 0.3), who, "pitch", { to: 18, dur: 0.25 }); A(r3(t), who, "squash", { amount: 0.04, dur: 0.25 }); } });
big(0, T.chip, "4 vs 25 t", 300, 90);
label(0, T.creep, "0 m / 25 km");
groan(0.1, "the four"); creak(0.3); groan(1.2, "Wedge", 0.25); creak(1.6, 0.25); groan(2.2, "Mash", 0.25);
see(0, T.chip, ["spud", "chip", "wedge", "mash", "stone"], "frame 0: four friends heaving on two ropes, the 25 t stone on its sledge towering behind them");
// 02: close on Chip, the front man: trainers skidding, cheeks puffed, the rope a bar
Pk("haul", T.chip, "rails", { skid: 1 }, 1.1, "out");
expr(T.chip, "chip", "angry", { brow: 1, open: 0.05 }, 0.08);
A(r3(T.chip + 0.05), "chip", "blink", { dur: 0.9 });   // eyes squeezed shut
c.say(r3(T.chip + 0.2), "chip", "Let's go!", 0.8, "excited", { voice: false, sub: "Let's go!", pos: 330 });
sfx(r3(T.chip + 0.1), "scrape", { gain: 0.3, reason: "Chip's trainers scraping through the frost" });
see(T.chip, T.slip, ["chip.face"], "Chip at the front of the rope, straining, his trainers scraping lines in the frost");

// ================================================================= 03 THE ROPE SLIPS (3.7-5.0)
// The rope slips through every glove at once: leaning into nothing, the four stumble forward and Chip goes flat on his face.
// (Departure from panel 03: the sheet has Chip on his back; leaning away from the load, a slipping rope throws you forward.)
Pk("haul", T.slip, "ropeA", { slack: 1 }, 0.35, "out"); Pk("haul", T.slip, "ropeB", { slack: 1 }, 0.35, "out");
for (const who of Object.keys(PULL)) { const fl = (sd) => (who === "mash" && sd === "R") ? [0.16, 0.25, -0.02] : (who === "chip" && sd === "L") ? [0.1, 0.3, 0.25] : [0.22, 0.35, 0.3]; grip(T.slip, who, "L", "open", 0.06); grip(T.slip, who, "R", "open", 0.06); arm(T.slip + 0.02, who, "L", { o: fl("L") }, 0.2, "out"); arm(T.slip + 0.02, who, "R", { o: fl("R") }, 0.2, "out"); expr(T.slip + 0.05, who, "shocked", { open: 0.5, eye: 1.3 }, 0.08); }
const stumble = { spud: 0.45, wedge: 0.35, mash: 0.22 };
for (const [who, ds] of Object.entries(stumble)) { const [s, r] = PULL[who].at; A(r3(T.slip + 0.03), who, "move", { to: WP(s + ds, r), dur: 0.45, steps: 3, ease: "out" }); A(r3(T.slip + 0.03), who, "pitch", { to: 10, dur: 0.3 }); A(r3(T.slip + 0.5), who, "pitch", { to: 0, dur: 0.35 }); }
A(r3(T.slip + 0.03), "chip", "move", { to: WP(7.35, -1.25), dur: 0.42, steps: 2, ease: "in" });
A(r3(T.slip + 0.03), "chip", "pitch", { to: 82, dur: 0.42, ease: "in" });
sfx(r3(T.slip + 0.45), "land", { gain: 0.4, reason: "Chip hitting the frozen ground" });
sfx(r3(T.slip + 0.02), "ai/bag-drag", { gain: 0.25, reason: "the rope whipping through the gloves and slapping onto the frost" });
look(T.slip + 0.5, "spud", [-0.4, -0.3], 0.2); look(T.slip + 0.5, "mash", [0.6, -0.3], 0.2); look(T.slip + 0.6, "wedge", [0, 0.1], 0.25);
A(r3(T.slip + 0.7), "wedge", "turn", { to: r3(FWD + 160), dur: 0.4 });   // he looks back at the stone: it hasn't moved
see(T.slip, T.wide, ["chip", "spud.face", "stone"], "the ropes slack on the frost, Chip flat on the ground, the stone not moved an inch");

// ================================================================= 04 THE NUMBERS (5.0-8.0)
// Very wide from behind and above: four tiny friends beside the enormous stone, the rails running off to the ring.
const WIDE_AT = { wedge: [1.2, 4.3], spud: [1.6, 3.4], chip: [2.0, 2.6], mash: [2.5, 1.85] };
for (const [who, [s, r]] of Object.entries(WIDE_AT)) { place(T.wide, who, WP(s, r), 135, 0); A(r3(T.wide - 0.02), who, "pitch", { to: 0, dur: 0.01 }); arm(T.wide - 0.02, who, "L", "rest", 0.01); arm(T.wide - 0.02, who, "R", "rest", 0.01); grip(T.wide - 0.02, who, "L", "relaxed", 0.01); grip(T.wide - 0.02, who, "R", "relaxed", 0.01); expr(T.wide - 0.02, who, "deadpan", { lid: 0.2 }, 0.01); look(T.wide - 0.02, who, [-0.4, 0.3], 0.01); }
label(T.wide + 0.2, T.count, "UCL 2016: 1 t = 10", 310, 54);
const countUp = (t0, t1, hold, a, b, fmt) => { const n = Math.max(1, Math.round((t1 - t0) / 0.1)); for (let i = 0; i <= n; i++) { const v = a + (b - a) * (1 - Math.pow(1 - i / n, 3)), ts = r3(t0 + i * 0.1); big(ts, i === n ? hold : r3(ts + 0.1), fmt(i === n ? b : v), 300, 96); } };
countUp(T.count, r3(T.count + 0.8), T.wedge, 10, 250, (v) => `25 t ≈ ${Math.round(v)}`);
see(T.wide, T.wedge, ["stone", "rails"], "the four friends small beside the giant stone, the empty rails running off toward the far stone ring");

// ================================================================= 05 WEDGE'S LEVER (8.0-9.6)
// Wedge, smirking, has the lever's tip under the stone's back end and reaches up to its pole; the other three watch, doubtful.
const W05 = pole(1.16, 0);
place(T.wedge, "wedge", WP(W05[0], -0.35), TO_CAM, 0);
arm(T.wedge - 0.02, "wedge", "R", { world: W(W05[0] - 0.08, W05[1] + 0.05, 0) }, 0.01); grip(T.wedge - 0.02, "wedge", "R", "fist", 0.01);
arm(T.wedge - 0.02, "wedge", "L", "hips", 0.01);
expr(T.wedge - 0.02, "wedge", "cocky", { raise: 0.8 }, 0.01); look(T.wedge - 0.02, "wedge", [0, 0.1], 0.01);
const WATCH = { spud: [-4.4, -1.4], chip: [-5.35, -1.3], mash: [-6.3, -1.5] };
for (const [who, [s, r]] of Object.entries(WATCH)) { place(T.wedge, who, WP(s, r), TO_CAM, 0); arm(T.wedge - 0.02, who, "L", "rest", 0.01); arm(T.wedge - 0.02, who, "R", "rest", 0.01); expr(T.wedge - 0.02, who, "annoyed", { brow: 0.5 }, 0.01); look(T.wedge - 0.02, who, [0.6, 0.0], 0.01); }
say(T.wedge + 0.3, "wedge", "Trust me.", 0.8, "calm");
see(T.wedge, T.hang, ["wedge.face", "lever", "pivot"], "Wedge with the long lever on the pivot boulder, smirking; the three watching, doubtful");

// ================================================================= 06 THE HANG (9.6-12.0)
// All four hang from the far end of the lever: it comes down, the stone's back end rises a hand's width (cut to it at T.endc).
const PUMP = 1.4;
for (const who of Object.keys(HANG)) {
  const h0 = hangRoot(who, 0), h1 = hangRoot(who, 1);
  place(T.hang, who, h0.at, TO_CAM, h0.y);
  for (const s of ["L", "R"]) { arm(T.hang - 0.02, who, s, { world: hangGlove(who, s, 0) }, 0.01); grip(T.hang - 0.02, who, s, "fist", 0.01); }
  expr(T.hang - 0.02, who, "angry", { brow: 1, open: 0.2 }, 0.01); look(T.hang - 0.02, who, [0, 0], 0.01);
  A(r3(T.pump), who, "move", { to: h1.at, y: h1.y, dur: PUMP, steps: 0, ease: "inOut", sync: true });
  for (const s of ["L", "R"]) arm(T.pump, who, s, { world: hangGlove(who, s, 1) }, PUMP);
  A(r3(T.pump + PUMP + 0.05), who, "squash", { amount: 0.06, dur: 0.2 });
}
Pk("haul", T.pump, "lever", { pump: 1 }, PUMP, "inOut");
P(T.pump, "stone", pry(1), PUMP, "inOut"); Pk("haul", T.pump, "lash", pry(1), PUMP, "inOut");
groan(T.hang + 0.1, "the four", 0.35); creak(T.pump + 0.2, 0.45, "the lever bending over the boulder"); sfx(r3(T.pump + 0.7), "scrape", { gain: 0.35, reason: "the stone grinding up off the sledge's deck" });
expr(T.pump + 1.0, "spud", "shocked", { open: 0.3 }, 0.1); expr(T.pump + 1.0, "chip", "happy", { open: 0.4 }, 0.1);
see(T.hang, T.endc, ["spud.face", "chip.face", "wedge.face", "mash.face"], "all four hanging off the lever's far end, straining, the pole coming down");
see(T.endc, T.creep, ["stone", "lever"], "the stone's back end lifting a hand's width off the deck");

// ================================================================= 07 5 CM (12.0-14.0)
// Down again: the stone has crept 5 cm. The bare frost mark shows behind the runner. Chip slumps against the boulder, spent.
for (const id of ["stone", "lash"]) if (id === "stone" || has("haul")) P(T.creep - 0.02, id, { tilt: 0, y: DECK, x: r3(STONE_AT[0] - 0.05) });
P(T.creep - 0.02, "sledge", { x: r3(STONE_AT[0] - 0.05) }); Pk("haul", T.creep - 0.02, "lever", { pump: 0 });
Pk("haul", T.creep - 0.02, "rails", { creep: 0.05 });
place(T.creep, "chip", WP(-2.9, 0.95), TO_CAM, 0);
A(r3(T.creep - 0.01), "chip", "sit", { rot: TO_CAM, height: 0, dur: 0.01, hands: "lap" });
expr(T.creep - 0.01, "chip", "dizzy", {}, 0.01);
["spud", "wedge", "mash"].forEach((who, k) => { place(T.creep, who, [PARK[0] + k * 3, PARK[1]], 0, 0); arm(T.creep - 0.02, who, "L", "rest", 0.01); arm(T.creep - 0.02, who, "R", "rest", 0.01); });
label(T.creep, T.mash, "0.05 m / 25 000 m");
see(T.creep, T.mash, ["sledge", "chip"], "the runner's tail: a bare 5 cm strip in the frost behind it; Chip slumped against the boulder");

// ================================================================= 08 THE SHADOW (14.0-16.0)
// Mash looks up from his phone, mouth open: a huge shadow slides over the frost and over him.
place(T.mash, "mash", WP(-4.9, 1.9), TO_CAM, 0);
arm(T.mash - 0.02, "mash", "L", "rest", 0.01); arm(T.mash - 0.02, "mash", "R", "rest", 0.01);
expr(T.mash - 0.02, "mash", "deadpan", { lid: 0.3 }, 0.01); look(T.mash - 0.02, "mash", [0.05, -0.55], 0.01);
look(T.shade + 0.25, "mash", [0, 0.9], 0.15); expr(T.shade + 0.3, "mash", "shocked", { open: 0.55, eye: 1.3 }, 0.1);
c.at(T.shade, { fx: "shade", dur: 1.6, from: -1.4, to: 0.6, width: 2.6, angle: 0, peak: 0.5 });
sfx(r3(T.shade), "rumble", { gain: 0.35, reason: "a deep hum from far above as something huge comes over" });
see(T.mash, T.beam, ["mash.face"], "Mash looks up, mouth open, as a giant shadow slides over him");

// ================================================================= 09 THE BEAM (16.0-21.0): the thumbnail
// From behind and below the four (holding the slack ropes): the ring ship over the stone, its beam lifting 25 t like nothing.
for (const who of Object.keys(PULL)) {
  const [s, r] = PULL[who].at; if (who === "chip") A(r3(T.beam - 0.05), who, "stand", { dur: 0.01 });
  place(T.beam, who, WP(s, r), r3(FWD + 180), 0);   // facing the sledge and the ship, backs to the camera
  A(r3(T.beam - 0.02), who, "pitch", { to: -6, dur: 0.01 });
  arm(T.beam - 0.02, who, "L", "rest", 0.01); arm(T.beam - 0.02, who, "R", "rest", 0.01);
  expr(T.beam - 0.02, who, "shocked", { open: 0.45, eye: 1.3 }, 0.01); look(T.beam - 0.02, who, [0, 1], 0.01);
}
P(T.beam - 0.02, "ship", { y: W(0, 18, 0)[1] }); P(T.beam, "ship", { y: 15 }, 1.0, "out");
P(T.on, "ship", { beam: 0.6 }, 0.5, "out");   // the stone must read inside the light
P(T.lift, "stone", { y: r3(DECK + 8) }, 3.2, "inOut"); Pk("haul", T.lift, "lash", { y: r3(DECK + 8) }, 3.2, "inOut");
sfx(r3(T.on), "rumble", { gain: 0.4, reason: "the beam's deep hum" });
sfx(r3(T.lift + 0.05), "crumble", { gain: 0.3, reason: "frost and grit falling off the stone's underside as it rises" });
see(T.beam, T.tag, ["ship", "stone"], "the ring ship over the stone, the beam lifting the 25 t stone straight up off the sledge; the four from behind staring up");

// ================================================================= 10 THE WINK (21.0-25.5)
// The ship is gone. The four sit on the empty sledge; behind them a long Stone Age crew drags the next stone toward the ring.
P(T.tag - 0.02, "ship", { y: -400, beam: 0 }); P(T.tag - 0.02, "stone", { y: -60 }); Pk("haul", T.tag - 0.02, "lash", { y: -60 });
const SEAT = { wedge: -1.7, chip: -0.57, spud: 0.57, mash: 1.7 };
for (const [who, s] of Object.entries(SEAT)) {
  place(T.tag, who, WP(s, 0.52), TO_CAM, 0); A(r3(T.tag - 0.01), who, "pitch", { to: 0, dur: 0.01 });
  A(r3(T.tag - 0.01), who, "sit", { rot: TO_CAM, height: DECK, dur: 0.01, hands: "lap" });
  expr(T.tag - 0.01, who, "deadpan", { lid: 0.35 }, 0.01); look(T.tag - 0.01, who, [0.2, 0], 0.01);
}
P(T.tag, "crew", { along: 0.35 }, r3(END - T.tag), "linear");
for (const [i, who] of ["mash", "spud", "chip", "wedge"].entries()) look(r3(T.tag + 1.0 + i * 0.12), who, [-0.85, 0.05], 0.25);
big(r3(T.tag + 1.4), END, "≈ 250");
expr(T.tag + 3.2, "spud", "deadpan", { lid: 0.55 }, 0.2); look(T.tag + 3.2, "spud", [0, 0], 0.2);
see(T.tag, END, ["spud.face", "crew"], "the four on the empty sledge, a long crew dragging a stone behind them; Spud turns to us, deadpan");

// ---------------------------------------------------------------- cameras (set frame -> world; DESIGN 7, fitted with qa/camfit.mjs)
const cam = (pos, look, fov, o = {}) => ({ pos: W(...pos), look: W(...look), fov, ...o });
const SH = {
  pull:  cam([13, 1.3, 0], [5.5, 1.0, 0], 52),   // panel 01: Spud and Chip big in front, Wedge and Mash cut by the edges, the stone towering behind
  chip:  cam([9.2, 0.42, -0.5], [6.35, 0.42, -1.15], 32),
  slip:  cam([11.4, 1.5, -2.6], [6.0, 0.45, -0.6], 44),
  wide:  cam([-21, 9.5, 5.5], [14, 2.0, -0.5], 52),
  wedge: cam([-5.4, 1.05, 5.6], [-3.4, 0.95, 0], 40),
  hang:  cam([-4.8, 2.3, 8.0], [-4.8, 1.1, -0.3], 42),   // square-on from a little above: the gloves on the pole sit under the faces
  endc:  cam([-0.6, 0.7, 3.4], [-2.1, 0.95, 0], 40),     // the stone's back end rising off the deck, the lever tip under it
  creep: cam([-0.5, 0.26, 1.9], [-2.5, 0.42, 0.75], 44),
  mash:  cam([-4.9, 1.2, 6.4], [-4.9, 1.3, 1.9], 32),
  beam:  cam([14, 0.6, 2.0], [0, 7.5, 0], 66),
  tag:   cam([0, 1.6, 9.5], [0, 1.0, -6], 48),
};
const CUTS = [
  ["01 the pull", 0, SH.pull, "hook"],
  ["02 Chip strains", T.chip, SH.chip],
  ["03 the rope slips", T.slip, SH.slip],
  ["04 the numbers", T.wide, SH.wide],
  ["05 Wedge's lever", T.wedge, SH.wedge],
  ["06 the hang", T.hang, SH.hang],
  ["06b the end lifts", T.endc, SH.endc],
  ["07 5 cm", T.creep, SH.creep],
  ["08 the shadow", T.mash, SH.mash, "reveal"],
  ["09 the beam", T.beam, SH.beam, "reveal"],
  ["10 the wink", T.tag, SH.tag, "reaction"],
];

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  [0.15, "Four friends. 25 tonnes. How?", 2.3],
  [T.wide + 0.2, "Real test: ten people per tonne.", 2.2],
  [T.creep + 0.25, "Five centimetres. 25 km to go.", 2.3],
  [T.lift + 1.2, "Unless... they had help.", 1.8],
  [T.tag + 1.6, "Or two hundred and fifty friends.", 2.0],
];
for (const [t, line, dur, pos = SUBY] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos, gain: NG });

const beats = c.beats(CUTS, END);

const allowClip = [
  ...Object.keys(PULL).map((who) => ({ who, with: PULL[who].rope === "A" ? "ropeA" : "ropeB", from: 0, to: r3(T.slip + 0.1), reason: "gloves round the pull rope" })),
  ...Object.keys(HANG).map((who) => ({ who, with: "lever", from: T.hang, to: T.creep, reason: "arms hooked over the lever's pole" })),
  { who: "chip", with: "pivot", from: T.creep, to: T.mash, reason: "slumped with his back against the boulder" },
  ...Object.keys(SEAT).map((who) => ({ who, with: "sledge", from: T.tag, to: END, reason: "sitting on the sledge's deck beams" })),
];

write(import.meta.url, {
  id: VO ? "stonehenge-stone" : "stonehenge-stone-no-vo",
  title: "How could 4 friends move a Stonehenge stone?",
  idea: "Friends try to 08: Spud, Chip, Wedge and Mash try the real methods on a 25 t Stonehenge sarsen (sledge on rails, lever on a pivot stone); it won't budge, then creeps 5 cm; a ring ship's beam lifts it; the wink: a 250-strong crew drags the next one",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [120, 640],
  castLook: LOOK, cleanStart: true, far: FAR,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  set: { ...SH_A, para: 0, aperture: 0, hatch: HATCH, cel: CEL, ink: true, satsuei: true, lighting: { ...SH_A.lighting } },
  // dramatic effort = recorded orchestra from 0.0, turning at the shadow (Jonny 11 + 12 Nov): assets/music/stonehenge-stone/README.md
  music: { file: process.env.MUSIC ?? "stonehenge-stone/stonehenge-stone-score.ogg", gain: 0.6, lowCut: 90, dip: false, duck: { voice: -6 } },
  sound: { signature: false, sfx: 0.65, ambience: VO ? 0.06 : 0.2, surface: "grass", room: "open", guard: true },
  hook: { show: ["spud", "chip", "wedge", "mash", "stone"], hint: 0, what: "four friends heaving on two ropes at a 25 t stone on a timber sledge; text 4 vs 25 t" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/friends-try-to/08-move-a-stonehenge-stone/make-stonehenge-stone.mjs.",
});
