// ANCIENT ALIENS EP02 "Who really built Stonehenge?", BLOCK B (story 0:50-1:42, 52 s): clue 2 the journey (bluestones,
// Wales, the Altar Stone, Scotland) and the "type 1 or 2" ask. Panels 13-24 (sheet 2). One of four blocks (kit/BLOCKS.md),
// joined later; also cut tall as TikTok part 2. Story: /mnt/project-files/videos/ancient-aliens/02-stonehenge/STORY.md.
// Built only from ../kit/sh-kit.mjs.
//   node storyboards/series/ancient-aliens/02-stonehenge/block-b/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/02-stonehenge/block-b/make-block-b.mjs    -> aa02-b-wide.json (+ aa02-b-tall.json with --tall)
//
// THE BRIEF (Jonny 14 Nov: explain like the pyramid film, every picture drawn with love for detail, the score supports
// each scene). Video time t = story time - 50.
//   Chain: he knocks on a small dark stone and it rings (the score is silent) SO it does not belong here: clue 2, about
//          eighty of them, two tonnes and more (he pushes one: nothing moves) SO where from? the map: the line runs west,
//          240 km, to the Preseli Hills; there (2500 BC) the cutter frees a pillar and the cargo ship carries a row of them
//          over the hills while a shepherd and his sheep stare up, while the voice says "dragged here"; BUT then the Altar
//          Stone (6 t, he crouches at it, palm on the mica) was tested in 2024: not from Wales; the map: the line turns
//          north and runs up the whole island, the camera has to follow it, 750 km; his leaf droops: nobody knows how; SO
//          the ask: aliens type 1, humans type 2; "I'll wait": only the sheep chews (score out).
//   Opens on its own hook (part 2): the knock and "This stone does not belong here." in the first 2.5 s.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, SET_OF, CAST, VIEW, shot, today, winter, sheep, wales, mapBoard, MAP_VIEW, host, hostSay, clueTag, sunsetClock, sunTrack, count, score, partScore, hookOf, lampClip, PLACE } from "../kit/sh-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const T0 = 50, END = 52.0;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(l.split(/\s+/).length * 0.42)]));
const fr = (t) => r3(Math.floor(t * 30 + 1e-6) / 30);   // cut times on whole frames

// ---------------------------------------------------------------- places (2000 m apart)
const PL = { today: PLACE(0), map: PLACE(1), wales: PLACE(2) };
const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const D = Math.PI / 180;
// a point given in a prop's own frame (x, z; rot in degrees) -> world
const toLocal = ([wx, wy, wz], rot) => [r3(wx * Math.cos(rot * D) - wz * Math.sin(rot * D)), wy, r3(wx * Math.sin(rot * D) + wz * Math.cos(rot * D))];
const local = (p, lx, lz) => [r3(p.x + lx * Math.cos(p.rot * D) + lz * Math.sin(p.rot * D)), r3(p.z - lx * Math.sin(p.rot * D) + lz * Math.cos(p.rot * D))];

// THE SMALL DARK STONE he knocks on (panel 13) and pushes (14): one real-scale bluestone of today, inside the circle in
// front of the open horseshoe (free of the ruin's own bluestones: outer ring r 11.8, inner oval r 5)
const KS = { id: "ks", kind: "bluestone", x: at(PL.today, -2.6, 8.4)[0], z: 8.4, rot: 0, era: "today", size: [0.72, 0.86, 0.46], seed: 7 };
const SPOT = {
  knock: local(KS, 0.92, 0.12),        // at its +x side, his right knuckle on its +x face
  push: local(KS, 0.78, 0),             // at its +x end, both palms on that end (from the long side the stone hides his face)
  spread: at(PL.today, -0.6, 10.4),     // panel 14: in the middle of the bluestones, arms spread
  stand: at(PL.today, 1.45, -2.9),      // panel 21: standing on the slab's near side, Stone 56 and the low sun behind him
  altar: at(PL.today, 2.92, -4.2),      // panel 18-21: at the +x end of the Altar Stone (fallen Stone 55 covers its -x half)
  axis: at(PL.today, -1.2, 58.5),       // panel 22-24: on the axis, the ruin and the low sun behind him, the visitors' rope behind
};

// ---------------------------------------------------------------- the build, one function of the frame
// The TALL cut (a TikTok part on its own) opens on its own 3.0 s hook (kit BLOCKS.md "The vertical parts open on their
// own hook"); the block is written on its film times and shifted by H afterwards (H = 0 in the wide film).
function build(F) {
  const H = hookOf(F, "b");
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
  const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
  const say = (t, k, o = {}) => { hostSay(c, F, r3(t), "spud", LINES[k], DUR[k], toneOf(k), o); return r3(t + DUR[k]); };
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const place = (t, who, xz, yaw) => { A(r3(t - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const NUM = { size: F.numSize, kinetic: false };
  const big = (t0, t1, text, o = {}) => c.cap(r3(t0), r3(t1), text, o.pos ?? F.NUM, false, { ...NUM, ...o });

  // ---- the cast
  const cast = [
    { id: "spud", character: CAST.spud, at: SPOT.knock, face: r3(yawTo(SPOT.knock, [KS.x, KS.z]) + 20), expr: "neutral", follow: 0.2, seed: 2.1 },
    // panel 24: three tourists behind a short rope beside him, turned round to look at us too
    { id: "chip", character: CAST.chip, at: at(PL.today, 0.75, 55.4), face: -4, expr: "kind", follow: 0.2, seed: 7.7 },
    { id: "wedge", character: CAST.wedge, at: at(PL.today, 1.85, 55.0), face: -10, expr: "neutral", follow: 0.2, seed: 8.2 },
    { id: "mash", character: CAST.mash, at: at(PL.today, 2.95, 55.5), face: -16, expr: "kind", follow: 0.2, seed: 9.9 },
    { id: "crew1", character: CAST.crew, at: at(PL.wales, -1.45, 7.9), face: 50, expr: "focused", follow: 0.2, seed: 3.3 },
    { id: "crew2", character: CAST.crew, at: at(PL.wales, 1.45, 8.0), face: -50, expr: "focused", follow: 0.2, seed: 4.4 },
  ];

  // ---- props
  const W = PL.wales, SHIP0 = at(W, -35, 4), SHIP1 = at(W, 40, 4), SHIPY = 18;   // the cargo ship's crossing (panel 17)
  const STONES = [-4.0, -2.4, -0.8, 0.8, 2.4, 4.0];   // the row hung under it, x along the ship
  const props = [
    // TODAY: the ruin at the gold light of block B, visitors behind their rope, three sheep about, a crow
    ...today("t", PL.today, { T: 76, rope: true }), KS, host("spud"),
    sheep("sheepK", at(PL.today, -3.95, 9.55)[0], 9.55, 125, { chew: 0.6, grass: true }),
    sheep("sheepW", at(PL.today, -2.45, 58.9)[0], 58.9, 70, { chew: 0, grass: true }),
    { id: "rope24", kind: "ropeline", x: PL.today[0], z: 0, pts: [[0.1, 56.5], [2.6, 56.75], [5.1, 56.6]] },
    { id: "crowA", kind: "crow", x: at(PL.today, 4.1, -5.5)[0], z: -5.5, rot: -110 },
    ...winter("chip", "chip"), ...winter("wedge", "wedge", "#2f6fb0", "#e0b030"), ...winter("mash", "mash", "#e0b030", "#c23b3b"),
    // THE MAP: the same board three times in the film; here the 25 km stub is already there, Wales and Scotland draw
    ...mapBoard("m", PL.map, { woods: 1, wales: 0, scotland: 0 }),
    // WALES 2500 BC: the crag, the cutter at its free pillar, two crew; the cargo ship with a row of bluestones over the hills,
    // a Stone Age shepherd and his sheep staring up
    ...wales("w", W, { out: 0 }),
    { id: "cargo", kind: "cargoship", x: SHIP0[0], y: SHIPY - 300, z: SHIP0[1], rot: 0, s: 1.3, beam: 1, lit: 0.5, beamLen: 2.6, staged: "it flies over the Welsh hills" },
    ...STONES.map((dx, i) => ({ id: `hang${i}`, kind: "bluestone", x: r3(SHIP0[0] + dx * 1.3), y: r3(SHIPY - 300 - 1.0 - 4.4), z: SHIP0[1], rot: (i * 37) % 30 - 15, era: "new", size: [0.62, 1.9, 0.42], seed: 11 + i, staged: "it hangs in the cargo ship's beam" })),
    { id: "shep", kind: "stonefolk", who: "shepherd", x: at(W, 1.6, 32.0)[0], z: 32.0, rot: 95, lookAt: toLocal([5 - 1.6, 18, 4 - 32.0], 95), seed: 2 },
    sheep("ws1", at(W, 0.4, 31.2)[0], 31.2, 80, { headP: -1, headY: -0.2 }),
    sheep("ws2", at(W, 2.6, 32.9)[0], 32.9, 100, { headP: -1, headY: -0.4 }),
    sheep("ws3", at(W, -0.7, 32.5)[0], 32.5, 70, { headP: -0.8, headY: 0.2 }),
  ];

  // seed every param that is tweened later
  P(0, "cargo", { beam: 1, wobble: 0 }); P(0, "w-cutter", { slide: 0.25, cut: 0 }); P(0, "w-crag", { out: 0 });
  P(0, "m-map", { woods: 1, wales: 0, scotland: 0 }); P(0, "spud-lamp", { lit: 0 });
  P(0, "sheepK", { ears: 0, headY: 0 }); P(0, "sheepW", { chew: 0, headY: 0 }); P(0, "crowA", { hop: 0, caw: 0, headY: 0 });
  sunTrack(c, "t", T0, 0, END);   // the sky's sun sinks in real time through the block

  // ---- times (video s; story = +50)
  const T = { p13: 0, p14: 4.0, p14b: 8.0, p15: 10.0, p16: 18.0, p17: 22.0, p18: 27.0, p19: 30.0, p19b: 32.8, p20: 36.3, p21: 43.4, p22: 45.7, p23: 47.9, p24: 50.4 };

  // ================================================================= 13 THE KNOCK (0-4): the score is silent here
  // Close: his knuckle on a small dark stone flecked with pale spots: knock, knock: a dull ring, like a bell far off. He
  // listens, one brow up; the sheep's ears flick. "This stone does not belong here."
  look(0, "spud", [-0.5, -0.15], 0.01); expr(0, "spud", "focused", { brow: 0.35 }, 0.01);
  const KN = { prop: "ks", grip: [0.38, 0.58, 0.1], palm: [0.1, 0.58, 0.1] }, KNOFF = { prop: "ks", grip: [0.48, 0.6, 0.12], palm: [0.2, 0.6, 0.12] };
  A(0, "spud", "grip", { side: "R", shape: "fist", dur: 0 }); c.arm(0, "spud", "R", KNOFF, 0);
  for (const k of [0.3, 0.72]) {
    c.arm(r3(k - 0.1), "spud", "R", KN, 0.1, "in"); c.arm(r3(k + 0.02), "spud", "R", KNOFF, 0.14, "out");
    sfx(k, "knock-hit", { gain: 0.5, reason: "his knuckle on the stone" });
    sfx(r3(k + 0.01), "bell-heavy", { gain: 0.16, reason: "the bluestone rings: a dull far bell (real: spotted dolerite rings when struck)" });
  }
  A(0.85, "spud", "lean", { to: -6, dur: 0.3 });   // his ear toward the stone
  expr(0.95, "spud", "surprised", { brow: 0.8, open: 0.05 }, 0.15);
  P(1.0, "sheepK", { ears: 1 }, 0.12, "out"); P(1.12, "sheepK", { ears: 0 }, 0.18, "in"); P(1.05, "sheepK", { headY: 0.45 }, 0.35, "inOut");
  c.arm(1.25, "spud", "R", "rest", 0.6, "inOut"); A(1.3, "spud", "grip", { side: "R", shape: "relaxed", dur: 0.5 }); A(1.25, "spud", "lean", { to: 0, dur: 0.3 });
  A(1.3, "spud", "turn", { to: -10, dur: 0.35, ease: "inOut" }); look(1.4, "spud", [0, 0.05], 0.2);
  const e1 = say(1.4, "b1");
  expr(1.35, "spud", "kind", null, 0.2); expr(r3(e1 - 0.5), "spud", "neutral", { brow: 0.45, lid: 0.25 }, 0.2);
  A(3.2, "spud", "noblink", { dur: 0.8 });
  see(0, T.p14, ["spud.face", "ks", "sheepK"], "panel 13: his knuckle on the small dark stone, it rings; the sheep's ears flick");

  // ================================================================= 14 CLUE 2 (4-10): eighty of them, two tonnes and more
  // The score comes in. Wide from a little height: the dark bluestones stand in a curve among the grey giants, he stands in
  // the middle with both arms spread, the camera travels round him, the counter runs to 80. Cut: he puts both palms on the
  // small stone and pushes, his boots slide back on the frost, it does not move: "2 t +".
  place(T.p14, "spud", SPOT.spread, 8); look(T.p14, "spud", [0, 0.1], 0.01); expr(T.p14, "spud", "happy", { brow: 0.5 }, 0.01);
  c.arm(r3(T.p14 + 0.1), "spud", "R", { o: [0.42, 0.55, 0.06] }, 0.35, "out"); c.arm(r3(T.p14 + 0.12), "spud", "L", { o: [0.42, 0.55, 0.06] }, 0.35, "out");
  A(r3(T.p14 + 0.1), "spud", "grip", { side: "both", shape: "open", dur: 0.25 });
  P(T.p14, "sheepK", { headY: 0 });
  clueTag(c, F, T.p14, END, 2);
  const e2a = say(4.3, "b2a");
  const t2b = r3(e2a + 0.25), e2b = say(t2b, "b2b");
  count(c, F, r3(t2b + 0.1), r3(T.p14b - 0.2), T.p14b, 0, 80);
  A(r3(T.p14b - 0.8), "spud", "noblink", { dur: 0.8 });
  // 14b the push (on "Two tonnes")
  const PUSHAT = SPOT.push, PUSHYAW = yawTo(PUSHAT, [KS.x, KS.z]), BACK = local(KS, 0.84, 0);
  place(T.p14b, "spud", PUSHAT, PUSHYAW);
  for (const [s, lz] of [["R", -0.15], ["L", 0.15]]) c.arm(r3(T.p14b - 0.02), "spud", s, { prop: "ks", grip: [0.375, 0.38, lz], palm: [0, 0.38, lz] }, 0.01);   // low: his hands under his eyes for the camera
  A(r3(T.p14b - 0.02), "spud", "grip", { side: "both", shape: "flat", dur: 0.01 });
  A(r3(T.p14b - 0.02), "spud", "pitch", { to: 10, dur: 0.01 });
  look(T.p14b, "spud", [0, 0.1], 0.01); expr(T.p14b, "spud", "focused", { brow: -0.4, lid: 0.3 }, 0.01);
  A(r3(T.p14b + 0.3), "spud", "squash", { amount: 0.05, dur: 0.3 });
  A(r3(T.p14b + 0.5), "spud", "move", { to: BACK, dur: 0.35, steps: 0, ease: "out" });   // his boots slide back on the frost
  sfx(r3(T.p14b + 0.5), "step-grass", { gain: 0.3, reason: "his boots slip on the frosty grass" });
  for (const [s, lz] of [["R", -0.15], ["L", 0.15]]) c.arm(r3(T.p14b + 0.5), "spud", s, { prop: "ks", grip: [0.375, 0.36, lz], palm: [0, 0.36, lz] }, 0.35, "out");
  big(r3(e2b - 1.15), T.p15, "2 t +", F.key === "wide" ? { x: 1450 } : {});
  A(r3(T.p14b + 1.3), "spud", "pitch", { to: 0, dur: 0.4 }); c.arm(r3(T.p14b + 1.3), "spud", "R", "rest", 0.4, "inOut"); c.arm(r3(T.p14b + 1.32), "spud", "L", "rest", 0.4, "inOut");
  A(r3(T.p14b + 1.3), "spud", "grip", { side: "both", shape: "relaxed", dur: 0.3 });
  A(r3(T.p14b + 1.35), "spud", "turn", { to: -150, dur: 0.5, ease: "inOut" });   // to the camera look(r3(T.p14b + 1.6), "spud", [0, 0.1], 0.2);
  expr(r3(T.p14b + 1.6), "spud", "neutral", { brow: 0.6, lid: 0.35 }, 0.2);
  A(r3(T.p15 - 0.7), "spud", "noblink", { dur: 0.7 });
  see(T.p14, T.p14b, ["spud", "t-stones"], "panel 14: the dark bluestones among the grey giants, his arms spread, the counter to 80");
  see(T.p14b, T.p15, ["spud.face", "ks"], "he pushes the small stone with both palms, slides back: it does not move (2 t +)");

  // ================================================================= 15 THE MAP (10-18): the line runs west, 240 km
  const e3a = say(10.3, "b3a");
  const t3b = r3(e3a + 0.2), e3b = say(t3b, "b3b");
  P(r3(t3b + 0.2), "m-map", { wales: 1 }, r3(Math.max(2.4, e3b - t3b + 0.6)), "inOut");
  const t4 = r3(e3b + 0.3), e4 = say(t4, "b4");
  count(c, F, r3(t3b + 0.2), r3(t4 + DUR.b4 - 0.2), T.p16, 0, 240, (v) => `${Math.round(v)} km`);
  see(T.p15, T.p16, ["m-map"], "panel 15: the painted map, the 25 km stub, the red line runs west to Wales, 240 km");

  // ================================================================= 16 WALES, 2500 BC (18-22.6): the cutter frees a pillar
  const CUT0 = r3(T.p16 + 0.15), CUT1 = r3(T.p16 + 2.1), TIP = r3(T.p16 + 2.35), DOWN = r3(TIP + 0.95);
  for (const w of ["crew1", "crew2"]) { c.arm(0, w, "R", { o: [0.3, 0.42, 0.22] }, 0.01); c.arm(0, w, "L", { o: [0.3, 0.42, 0.22] }, 0.01); A(0, w, "grip", { side: "both", shape: "flat", dur: 0.01 }); look(0, w, [0, 0.35], 0.01); }
  P(CUT0, "w-cutter", { cut: 1 }, 0.12, "out"); P(CUT0, "w-cutter", { slide: 0.75 }, r3(CUT1 - CUT0), "inOut"); P(CUT1, "w-cutter", { cut: 0 }, 0.12, "in");
  sfx(CUT0, "kenney/space-engine-low", { gain: 0.07, dur: r3(CUT1 - CUT0), reason: "the cutter's low hum while its line cuts" });
  sfx(r3(CUT1 + 0.05), "kenney/impact-mining", { gain: 0.45, reason: "the pillar cracks free at its foot" });
  P(TIP, "w-crag", { out: 1 }, r3(DOWN - TIP), "in");
  for (const [w, dx] of [["crew1", -0.45], ["crew2", 0.45]]) {
    look(r3(TIP - 0.2), w, [0, -0.1], 0.13);
    c.arm(r3(TIP), w, "R", "rest", 0.4, "inOut"); c.arm(r3(TIP + 0.02), w, "L", "rest", 0.4, "inOut"); A(TIP, w, "grip", { side: "both", shape: "relaxed", dur: 0.3 });
    look(r3(TIP + 0.1), w, [0, -0.3], 0.25);
    A(DOWN, w, "squash", { amount: 0.05, dur: 0.25 });
  }
  sfx(DOWN, "thud", { gain: 0.9, loud: true, reason: "the pillar lands flat on the turf" });
  const e5a = say(18.4, "b5a");
  see(T.p16, T.p17, ["w-crag", "w-cutter", "crew1", "crew2"], "panel 16: the cutter frees a pillar, two crew guide it down");

  // ================================================================= 17 OVER THE HILLS (22.6-27): the cargo ship, the shepherd
  const FLY = r3(T.p18 - T.p17 + 0.1);
  P(T.p17, "cargo", { x: SHIP0[0], y: SHIPY, z: SHIP0[1] }); P(r3(T.p17 + 0.02), "cargo", { x: SHIP1[0], z: SHIP1[1] }, FLY, "linear");
  STONES.forEach((dx, i) => { P(T.p17, `hang${i}`, { x: r3(SHIP0[0] + dx * 1.3), y: r3(SHIPY - 1.0 - 4.4) }); P(r3(T.p17 + 0.02), `hang${i}`, { x: r3(SHIP1[0] + dx * 1.3) }, FLY, "linear"); });
  sfx(T.p17, "kenney/space-engine-low", { gain: 0.1, dur: r3(T.p18 - T.p17 - 0.2), reason: "the cargo ship's low hum crossing the sky" });
  P(r3(T.p17 + 1.2), "ws2", { headY: 0.3 }, 1.6, "inOut"); P(r3(T.p17 + 2.0), "ws1", { headY: 0.4 }, 1.4, "inOut");
  const t5b = r3(e5a + 0.8), e5b = say(t5b, "b5b");
  big(r3(e5b - 1.0), T.p18, "× 80");
  see(T.p17, T.p18, ["cargo", "shep", "ws1"], "panel 17: the cargo ship carries a row of bluestones over the Welsh hills, the shepherd and his sheep stare up");

  // ================================================================= 18 THE ALTAR STONE (27-30): he crouches at the flat slab
  const AYAW = -110;   // toward the slab (-x), a little toward the camera on its far side
  place(T.p18, "spud", SPOT.altar, AYAW); A(r3(T.p18 - 0.02), "spud", "crouch", { to: 1, dur: 0.01 });
  look(T.p18, "spud", [0.2, -0.45], 0.01); expr(T.p18, "spud", "kind", null, 0.01);
  P(r3(T.p18 + 0.8), "crowA", { hop: 1 }, 0.3, "out"); P(r3(T.p18 + 1.1), "crowA", { hop: 0 }, 0.2, "in");
  P(r3(T.p18 + 1.6), "crowA", { caw: 1 }, 0.12, "out"); P(r3(T.p18 + 1.8), "crowA", { caw: 0 }, 0.2, "in");
  sfx(r3(T.p18 + 1.62), "ai/raven-caw", { gain: 0.25, reason: "the crow on the fallen giant caws once" });
  const e6a = say(27.3, "b6a");
  look(r3(e6a - 0.4), "spud", [-0.6, 0.15], 0.2);   // to us on "this one"
  A(r3(T.p19 - 0.6), "spud", "noblink", { dur: 0.6 });
  see(T.p18, T.p19, ["spud.face", "t-stones", "crowA"], "panel 18: the fallen giant across the flat slab, he crouches at its end");

  // ================================================================= 19 PALM ON THE SLAB (30-33): mica glints; six tonnes
  look(T.p19, "spud", [0.2, -0.55], 0.01);
  c.arm(r3(T.p19 + 0.15), "spud", "R", { prop: "t-stones", grip: [2.3, 0.21, -4.3], palm: [2.3, 0.0, -4.3] }, 0.45, "inOut"); A(r3(T.p19 + 0.15), "spud", "grip", { side: "R", shape: "flat", dur: 0.3 });
  sfx(r3(T.p19 + 0.55), "cloth", { gain: 0.22, reason: "his glove on the stone" });
  const t6b = r3(Math.max(e6a + 0.25, T.p19 + 0.2)), e6b = say(t6b, "b6b");
  big(r3(e6b - 0.85), T.p19b, "6 t");
  see(T.p19, T.p19b, ["spud", "t-stones"], "panel 19: close down on the slab, his palm flat on it");

  // ================================================================= 19b 2024 (33-35.6): he stands up to us
  c.arm(T.p19b, "spud", "R", "rest", 0.35, "inOut"); A(T.p19b, "spud", "grip", { side: "R", shape: "relaxed", dur: 0.3 });
  A(r3(T.p19b + 0.05), "spud", "crouch", { to: 0, dur: 0.45 });
  A(r3(T.p19b + 0.2), "spud", "turn", { to: r3(yawTo(SPOT.altar, at(PL.today, 0.3, -5.25))), dur: 0.4, ease: "inOut" }); look(r3(T.p19b + 0.4), "spud", [0, 0.1], 0.2);
  const t7a = r3(Math.max(e6b + 0.3, T.p19b + 0.2)), e7a = say(t7a, "b7a");
  big(r3(t7a + 0.2), T.p20, "2024");
  expr(r3(e7a - 0.4), "spud", "neutral", { brow: 0.75, lid: 0.25 }, 0.2);
  A(r3(T.p20 - 0.6), "spud", "noblink", { dur: 0.6 });
  see(T.p19b, T.p20, ["spud.face", "t-stones"], "he stands up to us: 2024, scientists tested it");

  // ================================================================= 20 THE MAP AGAIN (35.6-43): not from Wales; north, 750 km
  const e7b = say(r3(T.p20 + 0.2), "b7b");
  const N0 = r3(e7b + 0.25), t8a = N0, e8a = say(t8a, "b8a"), t8b = r3(e8a + 0.25), e8b = say(t8b, "b8b");
  const N1 = r3(Math.min(T.p21 - 0.4, e8b));
  P(N0, "m-map", { scotland: 1 }, r3(N1 - N0), "inOut");
  big(T.p20, N0, "240 km");
  count(c, F, N0, N1, T.p21, 240, 750, (v) => `${Math.round(v)} km`);
  see(T.p20, T.p21, ["m-map"], "panel 20: the line turns north and runs up the whole island, the camera follows it, 750 km");

  // ================================================================= 21 NOBODY KNOWS HOW (43-46): his leaf droops
  place(T.p21, "spud", SPOT.stand, 25); A(r3(T.p21 - 0.02), "spud", "crouch", { to: 0, dur: 0.01 });
  look(T.p21, "spud", [0.3, 0.15], 0.01); expr(T.p21, "spud", "neutral", { brow: 0.2 }, 0.01);
  A(r3(T.p21 + 0.4), "spud", "droop", { to: 1, dur: 0.6 }); expr(r3(T.p21 + 0.4), "spud", "deadpan", null, 0.3);
  const e9 = say(r3(T.p21 + 0.7), "b9");
  look(r3(e9 + 0.2), "spud", [0, 0.05], 0.3);
  A(r3(T.p22 - 0.6), "spud", "noblink", { dur: 0.6 });
  see(T.p21, T.p22, ["spud.face", "t-stones"], "panel 21: he stares into the distance, the leaf drooping, the low gold sun behind the stones");

  // ================================================================= 22-23 THE ASK (46-49.9): one finger, two fingers
  place(T.p22, "spud", SPOT.axis, 5); A(r3(T.p22 - 0.02), "spud", "droop", { to: 0, dur: 0.01 });
  look(T.p22, "spud", [0, 0.05], 0.01); expr(T.p22, "spud", "neutral", { brow: 0.3, lid: 0.25 }, 0.01);
  big(r3(T.p22 + 0.1), T.p24, "ALIENS 1 · HUMANS 2", { size: Math.round(F.numSize * 0.62) });
  c.arm(r3(T.p22 + 0.3), "spud", "R", { o: [0.2, 0.5, 0.2] }, 0.3, "out"); A(r3(T.p22 + 0.3), "spud", "grip", { side: "R", shape: "point", dur: 0.2 });
  const e10a = say(r3(T.p22 + 0.25), "b10a");
  A(r3(T.p23 - 0.5), "spud", "noblink", { dur: 0.5 });
  c.arm(T.p23, "spud", "L", { o: [0.2, 0.5, 0.2] }, 0.3, "out"); A(T.p23, "spud", "grip", { side: "L", shape: "point", dur: 0.2 });
  const e10b = say(r3(Math.max(e10a + 0.2, T.p23 + 0.1)), "b10b");
  A(r3(T.p24 - 0.5), "spud", "noblink", { dur: 0.5 });
  see(T.p22, T.p23, ["spud.face"], "panel 22: close on him, one finger: aliens? type one");
  see(T.p23, T.p24, ["spud.face"], "panel 23: two fingers: humans? type two");

  // ================================================================= 24 I'LL WAIT (49.9-52): score out, only the sheep chews
  c.arm(r3(T.p24 - 0.02), "spud", "R", "rest", 0.01); c.arm(r3(T.p24 - 0.02), "spud", "L", "rest", 0.01);
  A(r3(T.p24 - 0.02), "spud", "grip", { side: "both", shape: "relaxed", dur: 0.01 });
  expr(T.p24, "spud", "neutral", { lid: 0.3 }, 0.01);
  const e11 = say(r3(T.p24 + 0.3), "b11");
  P(r3(e11 + 0.1), "sheepW", { chew: 1, headY: -0.35 }, 0.25, "out");
  for (let t = r3(e11 + 0.2); t < END - 0.4; t = r3(t + 0.62)) sfx(t, "step-grass", { gain: 0.12, reason: "the sheep grinds grass (a soft dry crunch)" });
  for (const w of ["chip", "wedge", "mash"]) look(T.p24, w, [0, 0.05], 0.01);
  A(r3(END - 0.6), "spud", "noblink", { dur: 0.6 });
  see(T.p24, END, ["spud.face", "sheepW", "chip.face"], "panel 24: he waits; only the sheep chews; the tourists look at us too");

  // the countdown (top right) over every shot; the far wind under the outdoor ones (Jonny 9 Nov: ~0.06)
  for (let t = 0; t < END - 0.3; t = r3(t + 6)) if (!(t >= T.p15 - 0.1 && t < T.p16) && !(t >= T.p20 - 0.1 && t < T.p21)) sfx(r3(t), "ai/storm-wind", { gain: 0.06, dur: r3(Math.min(6, END - t)), reason: "far wind over the plain" });

  // ---------------------------------------------------------------- shots (a move on every one)
  const mv = (from, to, dur, fov) => ({ ...from, to: { pos: to.pos, ...(to.look && { look: to.look }), ...(to.fov && { fov: to.fov }) }, dur, ...(fov && { fov }) });
  const O = (o, v) => ({ pos: [r3(o[0] + v.pos[0]), v.pos[1], r3(o[1] + v.pos[2])], ...(v.look && { look: [r3(o[0] + v.look[0]), v.look[1], r3(o[1] + v.look[2])] }), ...(v.fov && { fov: v.fov }) });
  const pair = (w, t) => (F.key === "wide" ? w : t ?? w);
  const PT = PL.today, PM = PL.map;
  const map = (v) => O(PM, v);
  // tall (1080 x 1920): the subtitle at y 400 and the numbers at 580 sit in the upper third, so every tall camera looks
  // higher and wider than its wide pair and the subject stands in the lower half
  const T2 = (o, a, b, dur) => mv(O(o, a), O(o, b), dur);
  const SHOTS = [
    ["13 the knock", T.p13, pair(T2(PT, { pos: [-1.75, 0.85, 11.4], look: [-2.3, 0.62, 8.5], fov: 30 }, { pos: [-1.8, 0.84, 11.0] }, 4.0),
      T2(PT, { pos: [-1.6, 0.9, 11.6], look: [-2.35, 0.95, 8.5], fov: 52 }, { pos: [-1.65, 0.9, 11.2] }, 4.0)), "hook"],
    ["14 eighty of them", T.p14, pair(T2(PT, { pos: [-2.4, 1.3, 13.9], look: [-0.4, 1.3, 8.0], fov: 44 }, { pos: [0.9, 1.35, 13.9] }, r3(T.p14b - T.p14)),
      T2(PT, { pos: [-1.2, 1.4, 14.2], look: [-0.6, 2.2, 9.4], fov: 66 }, { pos: [-0.2, 1.45, 14.2] }, r3(T.p14b - T.p14)))],
    ["14b two tonnes", T.p14b, pair(T2(PT, { pos: [-2.6, 1.1, 6.6], look: [-2.0, 0.6, 8.4], fov: 40 }, { pos: [-2.75, 1.1, 6.75] }, r3(T.p15 - T.p14b)),
      T2(PT, { pos: [-2.7, 1.15, 6.3], look: [-2.0, 1.1, 8.4], fov: 62 }, { pos: [-2.85, 1.15, 6.45] }, r3(T.p15 - T.p14b)))],
    ["15 the map, Wales", T.p15, pair(mv(map(MAP_VIEW.stub.wide), map(MAP_VIEW.south.wide), 2.6), mv(map(MAP_VIEW.stub.tall), map(MAP_VIEW.south.tall), 2.6))],
    ["16 Wales, the crag", T.p16, pair(T2(W, { pos: [-3.0, 1.9, 11.6], look: [0.3, 1.4, 7.2], fov: 40 }, { pos: [-2.7, 1.85, 11.1] }, r3(T.p17 - T.p16)),
      T2(W, { pos: [-3.4, 1.9, 12.8], look: [0.2, 2.6, 7.2], fov: 62 }, { pos: [-3.1, 1.85, 12.3] }, r3(T.p17 - T.p16)))],
    ["17 over the hills", T.p17, pair(T2(W, { pos: [1.0, 0.9, 36], look: [-2, 8, 4], fov: 50 }, { pos: [1.0, 0.9, 36], look: [12, 9.5, 4] }, r3(T.p18 - T.p17)),
      T2(W, { pos: [1.0, 0.9, 36], look: [-14, 9.5, 4], fov: 72 }, { pos: [1.0, 0.9, 36], look: [16, 9.5, 4] }, r3(T.p18 - T.p17)))],
    ["18 the Altar Stone", T.p18, pair(T2(PT, { pos: [0.4, 1.1, -5.3], look: [2.6, 0.45, -3.9], fov: 46 }, { pos: [0.7, 1.05, -5.15] }, r3(T.p19 - T.p18)),
      T2(PT, { pos: [0.2, 1.2, -5.6], look: [2.6, 1.0, -3.9], fov: 64 }, { pos: [0.5, 1.15, -5.45] }, r3(T.p19 - T.p18)))],
    ["19 palm on the slab", T.p19, pair(T2(PT, { pos: [1.35, 1.0, -5.3], look: [2.5, 0.55, -4.1], fov: 50 }, { pos: [1.45, 0.98, -5.2] }, r3(T.p19b - T.p19)),
      T2(PT, { pos: [1.2, 1.1, -5.4], look: [2.85, 0.9, -4.2], fov: 66 }, { pos: [1.28, 1.08, -5.34] }, r3(T.p19b - T.p19)))],
    ["19b 2024", T.p19b, pair(T2(PT, { pos: [0.3, 0.9, -5.25], look: [2.9, 0.75, -3.9], fov: 38 }, { pos: [0.5, 0.9, -5.1] }, r3(T.p20 - T.p19b)),
      T2(PT, { pos: [0.2, 0.95, -5.4], look: [2.9, 1.25, -3.9], fov: 56 }, { pos: [0.4, 0.95, -5.25] }, r3(T.p20 - T.p19b)))],
    // the camera leaves Wales only when the line starts north, and travels with it (it ran ahead in the first animatic)
    ["20 not from Wales", T.p20, pair(mv(map(MAP_VIEW.south.wide), map({ pos: [0, MAP_VIEW.south.wide.pos[1], 9.9] }), r3(N0 - T.p20)),
      mv(map(MAP_VIEW.south.tall), map({ pos: [0, MAP_VIEW.south.tall.pos[1], 29.4] }), r3(N0 - T.p20)))],
    ["20b north, 750 km", N0, pair(mv(map({ ...MAP_VIEW.south.wide, pos: [0, MAP_VIEW.south.wide.pos[1], 9.9] }), map(MAP_VIEW.north.wide), r3(N1 - N0)),
      mv(map({ ...MAP_VIEW.south.tall, pos: [0, MAP_VIEW.south.tall.pos[1], 29.4] }), map({ pos: [0, MAP_VIEW.south.tall.pos[1], 27.5] }), r3(T.p21 - N0)))],
    ["21 nobody knows how", T.p21, pair(T2(PT, { pos: [1.0, 0.85, 0.2], look: [0.7, 0.95, -6.0], fov: 40 }, { pos: [1.0, 0.85, -0.2] }, r3(T.p22 - T.p21)),
      T2(PT, { pos: [1.0, 0.9, 0.6], look: [0.75, 1.6, -6.0], fov: 58 }, { pos: [1.0, 0.9, 0.2] }, r3(T.p22 - T.p21)))],
    ["22 type one", T.p22, pair(T2(PT, { pos: [-1.2, 0.72, 61.2], look: [-1.2, 0.82, 58.5], fov: 30 }, { pos: [-1.2, 0.72, 60.9] }, r3(T.p23 - T.p22)),
      T2(PT, { pos: [-1.2, 0.8, 61.6], look: [-1.2, 1.2, 58.5], fov: 46 }, { pos: [-1.2, 0.8, 61.3] }, r3(T.p23 - T.p22)))],
    ["23 type two", T.p23, pair(T2(PT, { pos: [-1.2, 0.7, 60.6], look: [-1.2, 0.82, 58.5], fov: 30 }, { pos: [-1.2, 0.7, 60.35] }, r3(T.p24 - T.p23)),
      T2(PT, { pos: [-1.2, 0.78, 61.0], look: [-1.2, 1.15, 58.5], fov: 46 }, { pos: [-1.2, 0.78, 60.75] }, r3(T.p24 - T.p23)))],
    ["24 I'll wait", T.p24, pair(T2(PT, { pos: [-0.6, 1.3, 64.0], look: [-0.8, 0.5, 40], fov: 30 }, { pos: [-0.6, 1.3, 63.4] }, r3(END - T.p24)),
      T2(PT, { pos: [0.25, 1.4, 67.5], look: [0.25, 1.9, 40], fov: 58 }, { pos: [0.25, 1.4, 66.9] }, r3(END - T.p24)))],
  ];
  // a subtitle ends where the next one starts (hostSay holds 0.4 s past the voice: caption-collide on the full render)
  const subs = c.captions.filter((x) => x.pos === F.SUB).sort((x, y) => x.from - y.from);
  subs.forEach((x, i) => { if (subs[i + 1] && x.to > subs[i + 1].from) x.to = subs[i + 1].from; });
  // shift the block by the hook, then the hook (tall only) and the countdown over everything
  if (H) {
    for (const it of c.items) it.at = r3(it.at + H);
    for (const cp of c.captions) { cp.from = r3(cp.from + H); cp.to = r3(cp.to + H); }
    for (const v of c.visible) { v.from = r3(v.from + H); v.to = r3(v.to + H); }
    for (const s of SHOTS) s[1] = r3(s[1] + H);
    SHOTS.unshift(...hook(c, F, H, { W, SHIPY, STONES, P, O, mv }));
  }
  sunsetClock(c, F, T0 - H, 0, END + H);
  const beats = c.beats(SHOTS, END + H);
  const sh = (w) => ({ ...w, from: r3(w.from + H), to: r3(w.to + H) });
  return {
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [
      sh({ who: "spud", with: "ks", from: 0, to: 1.3, reason: "his knuckle knocks on the stone's face" }),
      sh({ who: "spud", with: "ks", from: T.p14b, to: T.p15, reason: "both palms flat on the stone, pushing" }),
      ...lampClip(["spud"], END + H),
      // the Welsh ground and the crag's grass apron are scenery the crew stand on (not judged by their surface like the plain)
      ...["crew1", "crew2"].flatMap((who) => ["w-hills", "w-crag"].map((w) => ({ who, with: w, from: 0, to: END + H, reason: "standing on the kit's Welsh moor (welshhills ground / preselicrag grass apron, scenery)" }))),
      { who: "crew2", with: "w-crag", from: 0, to: END + H, checks: ["shell"], reason: "his boots in the crag's moor-grass apron, the flat painted ground disc round the tor (no rock there: still 20.0 shows him on grass)" },
      ...["chip", "wedge", "mash"].flatMap((who) => [`${who}-hat`, `${who}-scarf`].map((w) => ({ who, with: w, from: 0, to: END + H, reason: "the winter things he wears (kit winter())" }))),
    ],
  };
}

// THE PART 2 HOOK (tall only, 3.0 s; kit BLOCKS.md table): Wales in the past, the cargo ship carries its row of bluestones
// over the green hills, close and slow, the shepherd and his sheep stare up from the bottom of the frame; the line starts
// at 0.0 and is done by 2.7 s; the km counter races 0 -> 240 and lands with the stones' clack at 1.8 s; "240 km · NO
// WHEEL" in the upper third; hard cut to the knock. The same Welsh place as panel 17 (the ship is hidden again at the cut
// and comes back for panel 17); nothing of it is in the wide film.
function hook(c, F, H, { W, SHIPY, STONES, P, O, mv }) {
  const HY = 14, A0 = at(W, -9, 4), A1 = at(W, 9, 4), Y0 = r3(HY - 1.0 - 4.4), END = r3(H - 0.04);
  P(0, "cargo", { x: A0[0], y: HY, z: A0[1] }); P(0.02, "cargo", { x: A1[0], z: A1[1] }, END, "linear");
  STONES.forEach((dx, i) => { P(0, `hang${i}`, { x: r3(A0[0] + dx * 1.3), y: Y0, z: A0[1] }); P(0.02, `hang${i}`, { x: r3(A1[0] + dx * 1.3) }, END, "linear"); });
  // gone at the cut (panel 17 brings it back from the far west)
  P(H, "cargo", { y: SHIPY - 300 }); STONES.forEach((dx, i) => P(H, `hang${i}`, { y: r3(SHIPY - 300 - 1.0 - 4.4) }));
  P(0, "ws1", { headY: 0.2 }); P(0.4, "ws2", { headY: 0.35 }, 1.4, "inOut");
  c.sfx(0, "kenney/space-engine-low", { gain: 0.12, dur: H, reason: "the cargo ship's low hum overhead" });
  c.sfx(0, "ai/storm-wind", { gain: 0.06, dur: H, reason: "far wind over the Welsh moor" });
  c.sfx(1.8, "knock-hit", { gain: 0.35, reason: "two of the hanging bluestones knock together in the beam" });
  hostSay(c, F, 0.0, "spud", LINES.h1, DUR.h1, toneOf("h1"), { hold: 0.2 });
  count(c, F, 0.3, 1.8, H, 0, 240, (v) => `${Math.round(v)} km · NO WHEEL`, { size: Math.round(F.numSize * 0.7) });
  c.see(0, H, ["cargo", "shep"], "part 2 hook: the cargo ship carries a row of bluestones over the Welsh hills, the shepherd and his sheep stare up");
  return [["0 hook: Wales, the cargo ship", 0, mv(O(W, { pos: [1.0, 0.9, 36], look: [0, 10, 4], fov: 74 }), O(W, { pos: [1.0, 0.9, 35.4], look: [1.5, 10.2, 4] }), H), "hook"]];
}

const TALL = process.argv.includes("--tall");
for (const F of TALL ? [FRAME.wide, FRAME.tall] : [FRAME.wide]) {
  write(import.meta.url, {
    id: `aa02-b-${F.key}`,
    title: "Who really built Stonehenge? (block B)",
    idea: "Ancient aliens EP02 block B (0:50-1:42): the bluestone rings; clue 2, eighty of them, two tonnes; the map runs 240 km to Wales; the cutter frees a pillar and the cargo ship carries them over the hills; the Altar Stone, tested in 2024, came 750 km from Scotland; nobody knows how; aliens type 1, humans type 2; I'll wait",
    ...F.sb, fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set: SET_OF(T0 + 26), music: hookOf(F, "b") ? partScore("b") : score(T0),
    sound: { scenes: ["scifi"], signature: false, sfx: 0.65, ambience: 0.06, surface: "grass", room: "open", guard: true },
    hook: hookOf(F, "b") ? { show: ["cargo", "shep"], hint: 0, what: "Wales 2500 BC: the cargo ship carries a row of bluestones over the hills, the shepherd stares up; 240 km, no wheel" }
      : { show: ["spud", "ks"], hint: 0, what: "today, inside Stonehenge: Spud knocks on a small dark stone and it rings" },
    ...build(F),
    notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/block-b/make-block-b.mjs. Block B of four (kit/BLOCKS.md); music = the EP02 score from 0:50 (kit score(50)).",
  });
}
