// ANCIENT ALIENS EP02 "Who really built Stonehenge?", BLOCK A (story 0:00-0:50, TikTok part 1): hook, contract, clue 1 the
// weight, the turn to the small stones. Panels 01-12 of ancient-aliens-02-sheet-1.png. One of four blocks (kit/BLOCKS.md).
// Story: /mnt/project-files/videos/ancient-aliens/02-stonehenge/STORY.md. Built only from ../kit/sh-kit.mjs (+ the pilot kit).
//   node storyboards/series/ancient-aliens/02-stonehenge/block-a/measure-lines.mjs   -> lines.json (spoken lengths)
//   node storyboards/series/ancient-aliens/02-stonehenge/block-a/make-block-a.mjs    -> aa02-a-wide.json (+ -tall after Jonny's OK)
//
// THE BRIEF (Jonny 14 Nov: "use the kind of explaining we used for the pyramid and use music"; "images with love to the
// detail ... + good interesting commentary + music supporting the scenes"). Opener B, cold open in 2500 BC. Block A's film
// opening is also part 1's hook (hookOf(F, "a") = 0).
//   Chain: a 30-tonne stone hangs in the ring ship's beam and drops into its pit (no wheel, no metal) SO the ring goes up
//          stone by stone to 80; he points at it, and SNAP, the same frame today: "farmers built this", the sheep chews;
//          SO he sets the contract: five clues, answered when the sun of the shortest day touches the tallest stone (the
//          sun glides down to it, the countdown punches in); clue 1: the camera climbs the tallest stone 0 -> 6.7 m, his palm
//          on it takes him to 2500 BC where the beam sinks it into its pit: 9.1 m; today he pushes a stone as heavy as two
//          buses and slides back on the frost ("rope, sledges and muscle"); the quarry 25 km away on the map; 2500 BC: the
//          ship sets stone after stone in jump cuts, the last one lands where he stands, the foreman waves him off ("just
//          stone tools... they say"); BUT the big stones are not the problem: he walks to a small dark one.
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, SET_OF, sunAt, CAST, VIEW, shot, plain, stones, today, past, winter, sheep, liftStone, stoneAt, mapBoard, MAP_VIEW, host, hostSay, clueTag, sunsetClock, count, score, partScore, hookOf, lampClip, PLACE } from "../kit/sh-kit.mjs";
import { LINES, toneOf } from "./lines.mjs";

const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(l.split(/\s+/).length * 0.4)]));
const fr = (t) => r3(Math.round(t * 30) / 30);   // cut times on whole frames (a place one frame early shows otherwise)
const yawTo = ([x, z], [tx, tz]) => r3((Math.atan2(tx - x, tz - z) * 180) / Math.PI);
const B = (m) => r3(0.2 + (0.5 * m) / 30 + 0.002);   // `built` with circle uprights 1..m standing (giant pairs done, no top stones)

function build(F) {
  const H = hookOf(F, "a"), T0 = 0;
  const c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
  const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t + H), id, set, dur, ease);
  const at = (o, x, z) => [r3(o[0] + x), r3(o[1] + z)];
  const place = (t, who, xz, yaw, y) => { A(r3(t - 0.02), who, "move", { to: xz, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
  const park = (t, who, k) => place(t, who, [-900 + k * 3, 0], 0, 0);
  const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.15) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const NUM = { size: F.numSize, kinetic: false };
  const label = (t0, t1, text) => cap(t0, t1, text, F.clock.y, false, { style: "label", size: F.clock.size, kinetic: false, x: F.W / 2 });
  // a line: the say macro in Reaper's voice + its subtitle, held until the next line starts (caption-collide on the full render)
  const say = (t, k, next) => { const hold = next == null ? 0.4 : Math.max(0, Math.min(0.4, r3(next - t - DUR[k] - 0.05))); hostSay(c, F, r3(t), "spud", LINES[k], DUR[k], toneOf(k), { hold }); return r3(t + DUR[k]); };

  // ---------------------------------------------------------------- places (one origin each, 2000 m apart)
  const PL = { build: PLACE(0), today: PLACE(1), s56: PLACE(2), pit: PLACE(3), map: PLACE(4), tl: PLACE(5) };
  const SP = [-2.9, 47.4];                                   // the hook spot = panels 04 and 05 (same frame, two eras), in the entrance gap
  const S30 = stoneAt(PL.build, 30), L29 = (() => { const a = (6 + 12 * 28.5) * Math.PI / 180; return [r3(PL.build[0] - 15.5 * Math.sin(a)), r3(15.5 * Math.cos(a)), r3(180 - (6 + 12 * 28.5))]; })();
  const PUSH = at(PL.today, -16, 60);                        // a lone outlier upright beside the visitor path (panel 09)
  const BLUE = at(PL.s56, -2.2, 8.6);                        // the small dark stone of panel 12
  const TLS = [27, 28, 29, 30].map((n) => stoneAt(PL.tl, n));   // the time-lapse: uprights 27..30 come down one per jump cut

  // ---------------------------------------------------------------- the beats (video s = story s)
  const T = {
    p01: 0, p02: 1.9, land: 2.3, p03: 3.4, p04: 7.3, p06a: 11.4, p06b: 13.2, p06b2: 15.7, glide: 15.75, p06c: 18.0, clock: 20.0, p07a: 21.4, p07b: 24.4, touch: 24.75,
    p08: 26.0, land8: 27.4, p09: 29.2, p10a: 34.0, p10b: 35.6, p11: 38.0, tl2: 39.4, tl3: 40.8, tl4: 42.2, land11: 44.15, p12: 45.0, END: 50.0,
  };
  const END = T.END;

  // ---------------------------------------------------------------- cast
  const cast = [
    { id: "spud", character: CAST.spud, at: at(PL.build, ...SP), face: 4, expr: "neutral", follow: 0.2, seed: 2.1 },
    { id: "fore", character: CAST.foreman, at: at(PL.build, 3.5, 17.4), face: yawTo([3.5, 17.4], [S30[0] - PL.build[0], S30[1]]), expr: "focused", follow: 0.2, seed: 4.1 },
    { id: "crew", character: CAST.crew, at: at(PL.build, -2.6, 37.0), face: 160, expr: "kind", follow: 0.2, seed: 3.3 },
    { id: "chip", character: CAST.chip, at: [-900, 30], face: 180, expr: "happy", follow: 0.2, seed: 7.7 },
    { id: "wedge", character: CAST.wedge, at: [-897, 30], face: 180, expr: "kind", follow: 0.2, seed: 8.2 },
    { id: "mash", character: CAST.mash, at: [-894, 30], face: 180, expr: "happy", follow: 0.2, seed: 9.9 },
  ];

  // ---------------------------------------------------------------- props
  const props = [
    // 01-04  2500 BC, the build: the ring half up, the ship lowers upright 30 behind him; then the top stone over 29-30
    ...past("b", PL.build, { T: 2, built: 0.58, gapUprights: [30], gap: [29] }),
    ...liftStone("h1", [S30[0], S30[1]], { yaw: S30[2], h: 2.6, under: 1.2, hover: 10 }),
    { id: "lin4", kind: "toplintel", x: L29[0], y: 9.6, z: L29[1], rot: L29[2], look: "new", staged: "it hangs in the lift ship's beam" },
    { id: "aliens3", kind: "potatocrowd", x: PL.build[0] - 26, z: 6, who: "aliens", n: 14, box: [9, 6], seed: 8, lookAt: [26, 4, -6] },
    { id: "crow1", kind: "crow", x: PL.build[0] - 1.1, y: 0, z: 46.6, rot: -150, staged: "it takes off when the stone lands" },
    // 05 06 09  today: the ruin, the rope, the crowd (two clumps, the middle kept for the near three), the sheep, the bus, the push stone
    ...today("t", PL.today, { T: 10, rope: { arc: [36, -60, 60], n: 0, bus: null } }),
    { id: "t-crowdL", kind: "visitorcrowd", x: PL.today[0], z: 0, n: 12, arc: [39, -42, -7], seed: 3 },
    { id: "t-crowdR", kind: "visitorcrowd", x: PL.today[0], z: 0, n: 12, arc: [39, 7, 42], seed: 5 },
    ...winter("chip", "chip"), ...winter("wedge", "wedge", "#2f6fb0", "#e0b030"), ...winter("mash", "mash", "#e0b030", "#c23b3b"),
    sheep("sheep", PL.today[0] - 1.1, 45.4, -115, { grass: true, chew: 1 }),
    { id: "push9", kind: "sarsen", x: PUSH[0], y: 0, z: PUSH[1], rot: 90, look: "today", knobs: 1, seed: 7 },
    { id: "bus9", kind: "shuttlebus", x: PL.today[0] - 25.5, z: 48.5, rot: 104 },
    // 07 10a 12  today at the tallest stone: a crow on its top; the small dark stone of panel 12
    ...today("s", PL.s56, { T: 23 }),
    { id: "crow7", kind: "crow", x: PL.s56[0] + 1.05, y: 6.72, z: -6.45, rot: 25, staged: "perched on the top of Stone 56" },
    { id: "blue12", kind: "bluestone", x: BLUE[0], y: 0, z: BLUE[1], rot: 20, era: "today", size: [0.8, 0.72, 0.5], seed: 4 },
    // 08  the cut-away: 2500 BC, the same stone sinks into its chalk pit (a diagram: sky, far land, the cut block)
    { id: "pit-sky", kind: "shsky", x: PL.pit[0], z: 0, time: "a", sunAz: sunAt(27)[0], sunEl: sunAt(27)[1] },
    { id: "pit-skyline", kind: "skyline", x: PL.pit[0], z: 0, staged: "kit scenery", era: "new", sunAz: sunAt(27)[0], sunEl: sunAt(27)[1] },
    { id: "pit8", kind: "pitcut", x: PL.pit[0], z: 0 },
    ...liftStone("p8", [PL.pit[0], 0.5], { yaw: 90, h: 2.4, under: 2.4, size: [2.4, 6.7, 1.2], knobs: 0, hover: 40 }),
    // 10b  the map: the 25 km stub north
    ...mapBoard("m", PL.map),
    // 11  2500 BC time-lapse inside the ring: uprights 27..30 come down one per jump cut
    ...past("tl", PL.tl, { T: 41, built: B(26) }),
    { id: "tl-ship", kind: "ringship", x: TLS[0][0], y: 40, z: TLS[0][1], s: 1, beam: 0.5, lit: 0.4, staged: "the lift ship hovers over its work", beamLen: 40, beamR: 1.6 },
    ...TLS.map(([x, z, yaw], i) => ({ id: `tl-st${i}`, kind: "sarsen", x, y: -400, z, rot: yaw, look: "new", under: 0.8, knobs: 2, seed: 30 + i, staged: "it hangs in the lift ship's beam" })),
    { id: "aliens11", kind: "potatocrowd", x: PL.tl[0] + 18, z: 2, who: "aliens", n: 8, box: [4, 3], seed: 11, lookAt: [-6, 3, 9] },
    host("spud"),
  ];
  const prop = (id) => props.find((p) => p.id === id);
  prop("h1-ship").beamR = 1.6;

  // seed every param that is tweened later
  for (const id of ["h1-ship", "p8-ship", "tl-ship"]) P(-H, id, { wobble: 0 });
  P(-H, "h1-ship", { beam: 0.5 }); P(-H, "p8-ship", { beam: 0.8 }); P(-H, "tl-ship", { beam: 0.8 });
  P(-H, "b-stones", { built: 0.58 }); P(-H, "tl-stones", { built: B(26) });
  P(-H, "t-sky", { sunAz: sunAt(10)[0], sunEl: sunAt(10)[1] });
  P(-H, "m-map", { woods: 0, wales: 0, scotland: 0 });
  P(-H, "spud-lamp", { lit: 0 });

  // ================================================================= 01 HOOK (0-1.9): 2500 BC, the stone hangs in the beam behind him
  // Panel 01: Spud big in the lower middle, deadpan; behind him the 30-tonne upright hangs in the ring ship's beam over its
  // slot, the ship's underside above, the half-built ring, a crow at his feet. "30 t · NO WHEEL" in the upper third.
  expr(0, "spud", "neutral", { brow: 0.25 }, 0.01); look(0, "spud", [0, 0.12], 0.01);
  P(0, "h1-stone", { y: 2.6 }); P(0.02, "h1-stone", { y: 2.1 }, r3(T.p02 - 0.04), "inOut");
  sfx(0, "kenney/space-engine-low", { gain: 0.12, dur: 3.2, reason: "the ring ship's low hum over the stone" });
  const l1 = say(0.2, "l1", T.p03 + 0.25);
  c.arm(0.35, "spud", "L", "point", 0.3, "out"); A(0.35, "spud", "grip", { side: "L", shape: "point", dur: 0.2 });   // a thumb back at the stone
  cap(0, T.land, "30 t · NO WHEEL", F.NUM, false, NUM);
  label(0, fr(7.45 + DUR.l3 * 0.5), "2500 BC");
  see(0, T.p02, ["spud.face", "h1-stone", "h1-ship"], "frame 0: Spud, the stone hanging in the ship's beam behind him");
  // 02 THE DROP (1.9-3.4), close at the foot: the stone falls the last metres and lands, the ground jumps, frost dust bursts
  // out, the foreman jumps back with his palms up, the crow takes off
  place(T.p02, "spud", at(PL.build, ...SP), 4);
  c.arm(T.p02, "spud", "L", "rest", 0.01); A(T.p02, "spud", "grip", { side: "L", shape: "relaxed", dur: 0.01 });
  P(T.p02 + 0.05, "h1-stone", { y: 0 }, r3(T.land - T.p02 - 0.05), "in");
  c.at(r3(T.land + H), { fx: "shake", dur: 0.3, amp: 0.05 });
  for (const [dx, dz] of [[0, 0.9], [-1.1, 0.6], [1.1, 0.6]]) c.at(r3(T.land + H), { fx: "poof", pos: [r3(S30[0] + dx), 0.05, r3(S30[1] + dz)], dur: 1.5, color: "#e4ecea", puffs: 18, sparks: 0, size: 1.5, lift: 0.1, sound: false });
  sfx(T.land, "thud", { gain: 1, loud: true, reason: "thirty tonnes of stone land in their pit" });
  sfx(r3(T.land + 0.02), "kenney/impact-mining", { gain: 0.5, reason: "grit and chalk under the stone (the crack a phone speaker carries)" });
  A(r3(T.land - 0.12), "fore", "move", { to: at(PL.build, 4.0, 18.1), dur: 0.35, stride: 0.5, ease: "out" });
  for (const s of ["R", "L"]) { c.arm(r3(T.land - 0.1), "fore", s, { o: [0.24, 0.52, 0.22] }, 0.2, "out"); A(r3(T.land - 0.1), "fore", "grip", { side: s, shape: "open", dur: 0.15 }); }
  expr(r3(T.land - 0.1), "fore", "surprised", { open: 0.3 }, 0.12); A(T.land, "fore", "squash", { amount: 0.06, dur: 0.25 });
  P(T.land, "crow1", { wings: 1, caw: 1 }, 0.15, "out"); P(r3(T.land + 0.1), "crow1", { x: r3(PL.build[0] + 1.0), y: 2.2, z: 44.5 }, 0.9, "in");
  sfx(r3(T.land + 0.08), "ai/wing-flap", { gain: 0.3, reason: "the crow takes off" });   // the hook's crow, still in frame 0 at his feet; it is gone by 03
  see(T.p02, T.p03, ["h1-stone", "fore.face"], "close at the foot: the stone lands, frost dust, the foreman jumps back");

  // ================================================================= 03 THE RING GOES UP (3.4-7.3), from a height: the beam works round the ring
  park(T.p03, "fore", 0); place(T.p03, "crew", at(PL.build, -9.5, 24.0), 150);
  P(T.p03 - 0.02, "crow1", { y: -400 });
  P(T.p03 - 0.02, "h1-ship", { y: 60, beam: 0.8 }); prop("h1-ship").beamLen = 10;
  // the beam visits the top-stone ring clockwise while `built` puts the stones up in story order; the ship is above the frame
  const RING = Array.from({ length: 9 }, (_, i) => { const a = (270 + 45 * i) * Math.PI / 180; return [r3(PL.build[0] - 15.5 * Math.sin(a)), r3(15.5 * Math.cos(a))]; });
  RING.forEach(([x, z], i) => P(r3(T.p03 + 0.05 + i * 0.42), "h1-ship", { x, z }, 0.4, "inOut"));
  P(T.p03 + 0.05, "b-stones", { built: 0.95 }, 3.6, "linear");
  for (let t = T.p03 + 0.3; t < T.p04 - 0.4; t = r3(t + 0.45)) sfx(t, "thud", { gain: 0.3, reason: "a far stone lands on the ring (time-lapse)" });
  const l2 = say(3.8, "l2", T.p04 + 0.15);
  count(c, F, 3.8, 6.4, T.p04, 0, 80, undefined, { size: F.numSize });
  see(T.p03, T.p04, ["b-stones", "spud"], "the ring goes up stone by stone to 80, Spud tiny below");

  // ================================================================= 04 HE POINTS (7.3-snap), 05 SNAP TO TODAY (snap-11.4), the same frame
  // 04: the ship lowers the top stone over 29-30 behind him; he points back over his shoulder. SNAP on "farmers": today.
  place(T.p04, "spud", at(PL.build, ...SP), 4);
  P(T.p04 - 0.02, "h1-ship", { x: L29[0], y: 14.1, z: L29[1], beam: 0.5 }); prop("h1-ship").beamLen = 10;
  P(T.p04, "lin4", { y: 8.6 }, 3.0, "inOut");
  P(T.p04 - 0.02, "b-stones", { built: 0.95 });
  look(T.p04, "spud", [0, 0.1], 0.01); expr(T.p04, "spud", "neutral", { brow: 0.3 }, 0.01);
  c.arm(r3(T.p04 + 0.1), "spud", "L", { o: [0.3, 0.82, -0.05] }, 0.55, "inOut");   // a thumb over his shoulder at the ship
  A(r3(T.p04 + 0.2), "spud", "grip", { side: "L", shape: "point", dur: 0.3 });
  const l3t = 7.45, SNAP = fr(l3t + DUR.l3 * 0.5);
  const l3 = say(l3t, "l3", T.p06a + 0.2);
  sfx(T.p04, "kenney/space-engine-low", { gain: 0.1, dur: r3(SNAP - T.p04), reason: "the ship's hum behind him" });
  for (const [w, xz] of [["chip", [-2.7, 37.7]], ["wedge", [-3.6, 37.3]], ["mash", [2.3, 37.9]]]) place(SNAP, w, at(PL.today, ...xz), 180);
  place(SNAP, "spud", at(PL.today, ...SP), 4);
  label(SNAP, T.clock, "TODAY");
  c.arm(r3(SNAP + 0.25), "chip", "R", "point", 0.4, "out"); A(r3(SNAP + 0.25), "chip", "grip", { side: "R", shape: "point", dur: 0.2 });   // a tourist points up at the stones
  expr(r3(l3 - 0.5), "spud", "neutral", { brow: 0.75, lid: 0.3 }, 0.2);   // one brow up on "built this"
  // the sheep beside him chews, then turns its head to look at him; he looks down at it, then back to us
  P(r3(SNAP + 0.9), "sheep", { headY: -0.6, headP: -0.2 }, 0.6, "inOut");
  look(r3(SNAP + 1.0), "spud", [0.6, -0.35], 0.18);
  c.arm(r3(SNAP + 0.5), "spud", "L", "rest", 0.45, "inOut"); A(r3(SNAP + 0.5), "spud", "grip", { side: "L", shape: "relaxed", dur: 0.3 });
  look(r3(T.p06a - 0.6), "spud", [0, 0.1], 0.18); expr(r3(T.p06a - 0.6), "spud", "neutral", { lid: 0.4, brow: 0.2 }, 0.2);
  sfx(r3(SNAP + 0.3), "crunch", { gain: 0.12, dur: 0.6, reason: "the sheep chewing frosty grass beside him" });
  see(T.p04, SNAP, ["spud.face", "h1-ship", "lin4"], "2500 BC: he points back at the ship lowering a top stone");
  see(SNAP, T.p06a, ["spud.face", "sheep", "t-stones"], "today, same frame: the ruin, tourists at the rope, the sheep chewing beside him");

  // ================================================================= 06 THE CONTRACT (11.4-21.4)
  // a: down the axis from the Avenue, five fingers up; b: the low sun and the tallest stone, "21 DEC", the sun glides down
  // to the stone (the promise); c: close on him, the countdown punches in.
  const SP6 = [-1.5, 58.5];
  place(T.p06a, "spud", at(PL.today, ...SP6), 6);
  P(T.p06a - 0.02, "sheep", { x: r3(PL.today[0] - 0.1), z: 57.5, rot: -115, headY: 0, headP: 0, chew: 1 });
  look(T.p06a, "spud", [0, 0.1], 0.01);
  c.arm(11.55, "spud", "R", "up", 0.3, "out"); A(11.55, "spud", "grip", { side: "R", shape: "open", dur: 0.2 });   // five fingers up
  say(11.6, "l4a", 13.35);
  cap(11.65, T.p06b, "5", F.NUM, false, { ...NUM, size: r3(F.numSize * 1.3) });
  c.arm(r3(T.p06b - 0.02), "spud", "R", "rest", 0.01); A(r3(T.p06b - 0.02), "spud", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
  see(T.p06a, T.p06b, ["spud.face", "t-stones"], "down the axis: Spud's five fingers, the ruin and the low sun behind him");
  say(13.35, "l4b", T.glide);
  cap(13.7, T.glide - 0.1, "21 DEC", F.NUM, false, NUM);
  P(T.glide, "t-sky", { sunAz: 3.6, sunEl: 3.3 }); P(r3(T.glide + 0.05), "t-sky", { sunAz: 0.42, sunEl: 0.48 }, 1.9, "inOut");
  const l4c = say(T.glide, "l4c", T.p06c + 0.1);
  see(T.p06b, T.p06b2, ["t-stones", "spud"], "wide down the axis: the low sun upper left, the ruin, Spud small in front");
  see(T.p06b2, T.p06c, ["t-stones"], "long lens on the tallest stone: the big sun glides down onto its top");
  P(T.p06c - 0.02, "t-sky", { sunAz: sunAt(19)[0], sunEl: sunAt(19)[1] });
  look(T.p06c, "spud", [0, 0.05], 0.01); expr(T.p06c, "spud", "neutral", { brow: 0.35 }, 0.01);
  const l4d = say(r3(T.p06c + 0.1), "l4d", 20.75);
  expr(r3(l4d - 0.7), "spud", "neutral", { brow: 0.8, lid: 0.3 }, 0.2);
  P(r3(T.p06c + 0.6), "sheep", { headY: 0.5 }, 0.5, "inOut");
  // the countdown punches in BIG, then lives in its corner (sunsetClock) for the rest of the film
  cap(20.75, 21.0, "SUNSET IN 2:40", F.NUM, false, { ...NUM, size: r3(F.numSize * 0.9) });
  cap(21.0, T.p07a, "SUNSET IN 2:39", F.NUM, false, { ...NUM, size: r3(F.numSize * 0.9) });
  A(r3(T.p07a - 0.6), "spud", "noblink", { dur: 0.6 });
  see(T.p06c, T.p07a, ["spud.face"], "close on Spud, the ruin behind him; the countdown punches in");

  // ================================================================= 07 CLUE 1 THE WEIGHT (21.4-26.0): the camera climbs the tallest stone
  for (const w of ["chip", "wedge", "mash"]) park(T.p07a, w, ["chip", "wedge", "mash"].indexOf(w) + 1);
  const SP7 = at(PL.s56, 2.05, -5.15);
  place(T.p07a, "spud", SP7, 180); look(T.p07a, "spud", [0, 0.75], 0.01);
  clueTag(c, F, T.p07a + H, T.p10b + H, 1);
  say(r3(T.p07a + 0.15), "l5a", T.p08 + 0.3);
  count(c, F, r3(T.p07a + 0.5 + H), r3(T.p07b - 0.3 + H), r3(T.p07b + H), 0, 6.7, (v) => `${v.toFixed(1)} m`);
  P(23.5, "crow7", { caw: 1, headY: 0.4 }, 0.15, "out"); P(23.8, "crow7", { caw: 0 }, 0.2, "inOut");
  sfx(23.5, "ai/raven-caw", { gain: 0.3, reason: "the crow on the top of the stone caws" });
  see(T.p07a + 2.2, T.p07b, ["crow7"], "the top of the tallest stone, the knob and a crow against the sky");
  // 07b the palm: low at its foot, looking up the face; his palm flat on the stone is the cut to 2500 BC
  A(r3(T.p07b - 0.02), "spud", "turn", { to: 180, dur: 0.01, sync: true });
  c.arm(T.touch, "spud", "R", { prop: "s-stones", grip: [2.2, 0.6, -5.6], palm: [2.2, 0.6, -6.1] }, 0.45, "inOut");
  A(T.touch, "spud", "grip", { side: "R", shape: "flat", dur: 0.3 });
  look(r3(T.touch + 0.2), "spud", [0, 0.9], 0.3);
  sfx(r3(T.touch + 0.45), "cloth", { gain: 0.25, reason: "his glove flat on the stone" });
  expr(r3(T.touch + 0.6), "spud", "neutral", { lid: 0.35, brow: 0.25 }, 0.3);
  see(T.p07b, T.p08, ["spud", "s-stones"], "low at the foot: his palm on the stone, the face rising to the knob against the sky");

  // ================================================================= 08 2500 BC, THE CUT-AWAY (26.0-29.2): the beam sinks it into its pit
  const SP8 = at(PL.pit, -1.75, -1.1), CR8 = at(PL.pit, 1.8, -1.2);
  place(T.p08, "spud", SP8, 90); place(T.p08, "crew", CR8, -90);
  const c8 = r3(T.p08 - 0.02);
  c.arm(c8, "spud", "R", "rest", 0.01); A(c8, "spud", "grip", { side: "R", shape: "relaxed", dur: 0.01 });
  A(c8, "spud", "crouch", { to: 0.5, dur: 0.01 }); A(c8, "crew", "crouch", { to: 0.5, dur: 0.01 });
  look(c8, "spud", [0.3, -0.5], 0.01); look(c8, "crew", [-0.3, -0.5], 0.01);
  P(T.p08, "p8-stone", { y: 2.4 }); P(r3(T.p08 + 0.05), "p8-stone", { y: 0 }, r3(T.land8 - T.p08 - 0.05), "inOut");
  sfx(T.p08, "kenney/space-engine-low", { gain: 0.1, dur: 2.8, reason: "the ship's hum far above the beam" });
  sfx(T.land8, "thud", { gain: 0.85, loud: true, reason: "the stone settles on the pit's packing stones" });
  c.at(r3(T.land8 + H), { fx: "shake", dur: 0.2, amp: 0.025 });
  c.at(r3(T.land8 + H), { fx: "poof", pos: [PL.pit[0], 0.05, 0.9], dur: 1.2, color: "#f4f1e6", puffs: 16, sparks: 0, size: 1.2, lift: 0.05, sound: false });
  look(r3(T.land8 + 0.3), "spud", [0, 0.1], 0.2); expr(r3(T.land8 + 0.3), "spud", "neutral", { brow: 0.6 }, 0.2);
  look(r3(T.land8 + 0.5), "crew", [-0.5, 0.1], 0.2);
  cap(r3(T.p08 + 0.05), r3(T.p08 + 0.9), "6.7 m", F.NUM, false, NUM);
  count(c, F, r3(T.p08 + 0.9 + H), r3(T.land8 + H), r3(T.p09 + H), 6.7, 9.1, (v) => `${v.toFixed(1)} m`);
  say(r3(T.land8 - 0.3), "l5b", T.p09 + 0.2);
  see(T.p08, T.p09, ["p8-stone", "pit8", "spud.face"], "the cut-away: the stone sinks 2.4 m into its chalk pit");

  // ================================================================= 09 30 TONNES = 2 BUSES (29.2-34.0): he pushes, slides back on the frost
  A(r3(T.p09 - 0.02), "spud", "crouch", { to: 0, dur: 0.01 }); park(T.p09, "crew", 6);
  const SP9 = [r3(PUSH[0] + 0.95), r3(PUSH[1] + 0.45)];
  place(T.p09, "spud", SP9, -90, 0);
  P(T.p09 - 0.02, "sheep", { x: r3(PUSH[0] + 1.25), z: r3(PUSH[1] - 0.6), rot: -90, headY: 0, headP: 0.55, chew: 0, grass: false });
  for (const s of ["R", "L"]) {
    const gz = s === "R" ? -0.2 : -0.84;   // stone-local: across its face (local x), the face at local z +0.55
    c.arm(r3(T.p09 - 0.02), "spud", s, { prop: "push9", grip: [gz, 0.6, 0.62], palm: [gz, 0.6, 0.2] }, 0.01);
    A(r3(T.p09 - 0.02), "spud", "grip", { side: s, shape: "flat", dur: 0.01 });
  }
  A(r3(T.p09 - 0.02), "spud", "pitch", { to: 14, dur: 0.01 }); expr(r3(T.p09 - 0.02), "spud", "focused", { lid: 0.6, brow: -0.3 }, 0.01);
  say(29.45, "l6", T.p10a + 0.25);
  cap(29.6, T.p10a, "30 t = 2 × BUS", F.key === "tall" ? F.NUM + 90 : F.NUM, false, NUM);   // tall: under the 3-line subtitle
  // he pushes harder (squash), his boots slide back on the frost, he digs in again; the sheep butts the stone beside him
  A(30.1, "spud", "squash", { amount: 0.05, dur: 0.4 });
  A(30.6, "spud", "move", { to: [r3(SP9[0] + 0.12), SP9[1]], dur: 0.45, steps: 0, ease: "out" });
  sfx(30.6, "ai/step-grass", { gain: 0.35, reason: "his boots slide back on the frosty grass" });
  A(31.4, "spud", "move", { to: SP9, dur: 0.5, stride: 0.3, ease: "inOut" });
  A(32.0, "spud", "squash", { amount: 0.06, dur: 0.4 });
  P(31.0, "sheep", { headP: 0.75 }, 0.35, "out"); P(31.4, "sheep", { headP: 0.55 }, 0.4, "inOut");
  P(32.6, "sheep", { headP: 0, headY: -0.5, ears: 1 }, 0.5, "inOut");   // it gives up first and looks at him
  // he lets go and looks to us, deadpan
  for (const s of ["R", "L"]) { c.arm(32.9, "spud", s, "rest", 0.45, "inOut"); A(32.9, "spud", "grip", { side: s, shape: "relaxed", dur: 0.3 }); }
  A(32.9, "spud", "pitch", { to: 0, dur: 0.4, ease: "inOut" });
  A(33.0, "spud", "turn", { to: 10, dur: 0.4, ease: "inOut" }); look(33.1, "spud", [0, 0.1], 0.2); expr(33.1, "spud", "neutral", { lid: 0.45, brow: 0.2 }, 0.25);
  A(r3(T.p10a - 0.45), "spud", "noblink", { dur: 0.45 });
  see(T.p09, T.p10a, ["spud.face", "push9", "sheep", "bus9"], "he pushes the stone with both palms, slides back; the sheep pushes too; the bus behind");

  // ================================================================= 10 THE QUARRY (34.0-38.0): the downs to the north, then the map, 25 km
  // a: from high over the monument, north over the frosty downs to the far woods; Spud a dot beside the ruin looking north
  place(T.p10a, "spud", at(PL.s56, -0.6, 21.5), 0); A(r3(T.p10a - 0.02), "spud", "pitch", { to: 0, dur: 0.01 });
  for (const s of ["R", "L"]) c.arm(r3(T.p10a - 0.02), "spud", s, "rest", 0.01);
  const l7 = say(34.2, "l7", T.p11 + 0.2);
  see(T.p10a, T.p10b, ["s-stones"], "high over the ruin, north over the frosty downs to the far woods");
  // b: the map, a push in on Stonehenge, the short red line north, 0 -> 25 km
  P(r3(T.p10b + 0.5), "m-map", { woods: 1 }, 1.3, "inOut");
  count(c, F, r3(T.p10b + 0.5 + H), r3(T.p10b + 1.8 + H), r3(T.p11 + H), 0, 25, (v) => `${Math.round(v)} km`, F.key === "tall" ? { pos: F.NUM + 90 } : {});
  see(T.p10b, T.p11, ["m-map"], "the map: a red line 25 km north from Stonehenge");

  // ================================================================= 11 NO CRANES, NO IRON (38.0-45.0): 2500 BC time-lapse in jump cuts
  // The same camera at each cut; the ring one upright longer each time, the ship over the next gap, a stone lands at each cut
  // (thud). The last one comes down where he stands: he ducks, the foreman waves him off the landing spot, it lands.
  const SP11 = at(PL.tl, 1.5, 14.2), SP11b = at(PL.tl, 1.25, 12.9), FO11 = at(PL.tl, 3.4, 13.1);
  place(T.p11, "spud", SP11, 200); place(T.p11, "fore", FO11, -60);
  look(T.p11, "spud", [0.2, 0.5], 0.01); c.arm(r3(T.p11 - 0.02), "spud", "R", "hips", 0.01); c.arm(r3(T.p11 - 0.02), "spud", "L", "hips", 0.01);
  c.arm(T.tl2 - 0.02, "spud", "R", "rest", 0.01); c.arm(T.tl2 - 0.02, "spud", "L", "rest", 0.01); A(T.tl2 - 0.02, "spud", "crouch", { to: 0.55, dur: 0.01 });   // time passes: he sits on his heels
  A(T.tl3 - 0.02, "spud", "crouch", { to: 0, dur: 0.01 });
  const cuts = [T.p11, T.tl2, T.tl3, T.tl4];
  cuts.forEach((t, i) => {
    const [x, z] = TLS[i], id = `tl-st${i}`, last = i === 3, landAt = last ? T.land11 : r3(t + 0.75);
    P(t - 0.02, "tl-stones", { built: B(26 + i) });
    if (i > 0) P(t - 0.02, `tl-st${i - 1}`, { y: -400 });   // the stone that landed at the cut before is now part of `built`
    P(t - 0.02, "tl-ship", { x, z });
    P(t - 0.02, id, { y: last ? 6.0 : 2.6 });
    if (last) { P(t + 0.02, id, { y: 2.2 }, r3(T.land11 - 0.45 - t), "inOut"); P(r3(T.land11 - 0.45), id, { y: 0 }, 0.45, "in"); }
    else P(t + 0.02, id, { y: 0 }, r3(landAt - t - 0.02), "in");
    sfx(landAt, "thud", { gain: last ? 1 : 0.7, ...(last && { loud: true }), reason: "an upright lands in its place on the ring" });
    c.at(r3(landAt + H), { fx: "poof", pos: [x, 0.05, z], dur: 1.2, color: "#e4ecea", puffs: 16, sparks: 0, size: 1.6, lift: 0.08, sound: false });
  });
  sfx(T.p11, "kenney/space-engine-low", { gain: 0.1, dur: 6.6, reason: "the ship's hum over the ring" });
  say(38.25, "l8a", 42.35);
  // the last stone: he looks up, ducks, the foreman waves him off, he scuttles inward, it lands behind him
  look(42.5, "spud", [0.1, 0.9], 0.2); expr(42.6, "spud", "surprised", { open: 0.2 }, 0.15);
  A(42.85, "spud", "crouch", { to: 0.6, dur: 0.22 });
  say(42.35, "l8b", T.p12 + 0.3);
  look(42.7, "fore", [-0.6, 0.2], 0.15);
  c.arm(43.0, "fore", "L", "wave", 0.3, "out"); c.arm(43.85, "fore", "L", "rest", 0.4, "inOut");
  A(43.2, "spud", "move", { to: SP11b, dur: 0.6, stride: 0.35, ease: "inOut" });
  A(43.3, "spud", "crouch", { to: 0.15, dur: 0.4 });
  A(T.land11, "spud", "squash", { amount: 0.05, dur: 0.25 }); A(T.land11, "fore", "squash", { amount: 0.05, dur: 0.25 });
  c.at(r3(T.land11 + H), { fx: "shake", dur: 0.25, amp: 0.035 });
  expr(r3(T.land11 + 0.1), "spud", "neutral", { lid: 0.7 }, 0.1);
  look(r3(T.land11 + 0.45), "spud", [0, 0.1], 0.2); expr(r3(T.land11 + 0.45), "spud", "neutral", { brow: 0.7, lid: 0.3 }, 0.2);
  A(r3(T.p12 - 0.45), "spud", "noblink", { dur: 0.45 });
  see(T.p11, T.p12, ["tl-stones", "spud", "fore"], "2500 BC jump cuts: the ring grows by one upright at each cut; the last lands where he stood");

  // ================================================================= 12 THE TURN (45.0-50.0): he walks from the giants to a small dark stone
  park(T.p12, "fore", 0);
  const W0 = at(PL.s56, -2.4, 5.9), W1 = at(PL.s56, -1.65, 7.95);
  place(T.p12, "spud", W0, 15); A(r3(T.p12 - 0.02), "spud", "crouch", { to: 0, dur: 0.01 });
  look(T.p12, "spud", [0, 0.1], 0.01); expr(T.p12, "spud", "neutral", { brow: 0.3 }, 0.01);
  A(45.25, "spud", "move", { to: W1, dur: 2.1, stride: 0.55, ease: "inOut" });
  say(45.3, "l9a", 47.75);
  A(47.4, "spud", "turn", { to: yawTo(W1, BLUE), dur: 0.4, ease: "inOut" });
  look(47.5, "spud", [0, -0.35], 0.2);
  c.arm(47.8, "spud", "R", "point", 0.35, "out"); A(47.8, "spud", "grip", { side: "R", shape: "point", dur: 0.2 });   // he points down at it
  const l9b = say(47.75, "l9b");
  look(r3(l9b + 0.1), "spud", [-0.4, 0.1], 0.2); expr(r3(l9b + 0.1), "spud", "neutral", { brow: 0.8, lid: 0.25 }, 0.2);   // a glance to us
  A(r3(END - 0.7), "spud", "noblink", { dur: 0.7 });
  see(T.p12, END, ["spud.face", "blue12"], "inside the ruin: he walks to a small dark stone, the giants and the low sun behind him");

  // the countdown (from 0:20), the clue tag, the far wind under every outdoor shot (Jonny 9 Nov: ~0.06)
  sunsetClock(c, F, T0 - H, 0, r3(T.p10b + H)); sunsetClock(c, F, T0 - H, r3(T.p11 + H), r3(END + H));
  clueTag(c, F, r3(T.p11 + H), r3(END + H), 1);
  for (const [a, b] of [[0, T.p10b], [T.p11, END]]) for (let t = a; t < b - 0.3; t = r3(t + 6)) sfx(r3(t), "ai/storm-wind", { gain: 0.06, dur: r3(Math.min(6, b - t)), reason: "far winter wind over the plain" });

  // ---------------------------------------------------------------- shots (a push or a move on every one: something changes every 3 s)
  const o = (pl, v) => ({ pos: [r3(pl[0] + v.pos[0]), v.pos[1], r3(pl[1] + v.pos[2])], look: [r3(pl[0] + v.look[0]), v.look[1], r3(pl[1] + v.look[2])], fov: v.fov, ...(v.to && { to: { pos: [r3(pl[0] + v.to.pos[0]), v.to.pos[1], r3(pl[1] + v.to.pos[2])], ...(v.to.look && { look: [r3(pl[0] + v.to.look[0]), v.to.look[1], r3(pl[1] + v.to.look[2])] }) } }), ...(v.dur && { dur: v.dur }) });
  const C01 = { pos: [-2.1, 0.5, 50.1], look: [-0.2, 3.0, 15.4], fov: 44 };
  const C04 = { pos: [-2.6, 0.6, 50.1], look: [-1.75, 1.7, 33], fov: 38 };
  // the TALL cut: its own cameras (fov is vertical, so a tall frame sees ~1/3 of the width): closer, aimed at the subject
  const tall = F.key === "tall", pick = (w, t) => (tall ? t : w);
  const T01 = { pos: [-1.9, 0.5, 53.0], look: [-3.5, 6.0, 15.4], fov: 58 };   // him lower left, the hanging stone clear of his head
  const T04 = { pos: [-2.75, 0.6, 51.2], look: [-1.6, 2.6, 33], fov: 56 };
  const TLC = [3.5, 1.2, 4.5], tlLook = (deg) => ({ pos: TLC, look: [r3(TLC[0] + 10 * Math.sin((deg * Math.PI) / 180)), 2.0, r3(TLC[2] + 10 * Math.cos((deg * Math.PI) / 180))], fov: 64 });
  const SHOTS = [
    ["01 hook", T.p01, o(PL.build, pick({ ...C01, to: { pos: [-2.05, 0.5, 49.65] }, dur: T.p02 }, { ...T01, to: { pos: [-1.9, 0.5, 52.6] }, dur: T.p02 })), "hook"],
    ["02 the drop", T.p02, o(PL.build, pick({ pos: [2.3, 0.45, 21.9], look: [S30[0] - PL.build[0], 0.95, S30[1]], fov: 42, to: { pos: [2.32, 0.45, 22.3] }, dur: 1.5 },
      { pos: [2.6, 0.5, 24.5], look: [2.4, 1.6, 16], fov: 62, to: { pos: [2.62, 0.5, 24.9] }, dur: 1.5 }))],
    ["03 the ring goes up", T.p03, o(PL.build, pick({ pos: [30, 40, 74], look: [0, 3, 2], fov: 30, to: { pos: [27, 38, 70] }, dur: 3.9 },
      { ...VIEW.high.tall, to: { pos: [27, 66, 78] }, dur: 3.9 }))],
    ["04 he points", T.p04, o(PL.build, pick({ ...C04, to: { pos: [-2.45, 0.6, 49.45] }, dur: r3(SNAP - T.p04) }, { ...T04, to: { pos: [-2.71, 0.6, 50.8] }, dur: r3(SNAP - T.p04) }))],
    ["05 today", SNAP, o(PL.today, pick({ ...C04, to: { pos: [-2.41, 0.6, 49.15] }, dur: r3(T.p06a - SNAP) }, { ...T04, to: { pos: [-2.68, 0.6, 50.5] }, dur: r3(T.p06a - SNAP) })), "reveal"],
    ["06 five clues", T.p06a, o(PL.today, pick({ pos: [-0.9, 0.85, 62.0], look: [-1.6, 1.25, 50], fov: 34, to: { pos: [-0.95, 0.85, 61.6] }, dur: r3(T.p06b - T.p06a) },
      { pos: [-1.35, 0.85, 62.3], look: [-1.6, 1.9, 50], fov: 50, to: { pos: [-1.37, 0.85, 61.9] }, dur: r3(T.p06b - T.p06a) }))],
    ["06 the low sun", T.p06b, o(PL.today, pick({ pos: [-0.5, 1.6, 70], look: [-8, 5.5, 0], fov: 28, to: { pos: [-0.5, 1.6, 68.6] }, dur: r3(T.p06b2 - T.p06b) },
      { ...VIEW.axis.tall, to: { pos: [0, 1.6, 76.4] }, dur: r3(T.p06b2 - T.p06b) }))],
    ["06 the sun and the tallest stone", T.p06b2, o(PL.today, { ...pick(VIEW.axisLong.wide, VIEW.axisLong.tall), to: { pos: [0, 1.6, 146] }, dur: r3(T.p06c - T.p06b2) })],
    ["06 you'll know", T.p06c, o(PL.today, pick({ pos: [-1.05, 0.72, 61.3], look: [-1.75, 1.05, 52], fov: 32, to: { pos: [-1.1, 0.72, 60.8] }, dur: r3(T.p07a - T.p06c) },
      { pos: [-1.4, 0.72, 61.7], look: [-1.55, 1.5, 52], fov: 44, to: { pos: [-1.42, 0.72, 61.3] }, dur: r3(T.p07a - T.p06c) }))],
    ["07 up the tallest stone", T.p07a, o(PL.s56, { pos: [2.35, 0.45, -2.6], look: [2.05, 0.6, -5.3], fov: 46, to: { pos: [2.2, 4.4, -2.5], look: [1.55, 7.4, -6.2] }, dur: r3(T.p07b - T.p07a - 0.2) })],
    ["07 his palm on the stone", T.p07b, o(PL.s56, pick({ pos: [3.45, 0.25, -4.45], look: [1.8, 3.2, -6.1], fov: 60, to: { pos: [3.35, 0.25, -4.55] }, dur: r3(T.p08 - T.p07b) },
      { pos: [3.45, 0.25, -4.45], look: [1.5, 3.0, -5.7], fov: 68, to: { pos: [3.38, 0.25, -4.52] }, dur: r3(T.p08 - T.p07b) }))],
    ["08 2500 BC the pit", T.p08, o(PL.pit, pick({ pos: [0.25, 0.75, 5.6], look: [0, 0.1, 0], fov: 46, to: { pos: [0.22, 0.72, 5.2] }, dur: r3(T.p09 - T.p08) },
      { pos: [0.15, 1.2, 11.5], look: [0, 2.0, 0], fov: 56, to: { pos: [0.14, 1.15, 10.9] }, dur: r3(T.p09 - T.p08) })), "reveal"],
    ["09 the push", T.p09, o(PL.today, pick({ pos: [-12.0, 0.9, 65.0], look: [-15.8, 1.5, 59.6], fov: 40, to: { pos: [-12.25, 0.9, 64.6] }, dur: r3(T.p10a - T.p09) },
      { pos: [-12.6, 0.9, 65.6], look: [-16.8, 2.2, 57], fov: 52, to: { pos: [-12.8, 0.9, 65.2] }, dur: r3(T.p10a - T.p09) }))],
    ["10 the downs to the north", T.p10a, o(PL.s56, pick({ pos: [2, 26, -52], look: [0, 0, 50], fov: 36, to: { pos: [2, 25, -48] }, dur: r3(T.p10b - T.p10a) },
      { pos: [2, 30, -56], look: [0, 4, 30], fov: 50, to: { pos: [2, 29, -52] }, dur: r3(T.p10b - T.p10a) }))],
    ["10 the map", T.p10b, { ...shot(F, PL.map, MAP_VIEW.south), to: shot(F, PL.map, MAP_VIEW.stub), dur: 1.4 }],
    // tall: him, the foreman, slots 29-30 and upright 1 (27 and 28 land off frame, heard), a push in for the last
    ...cuts.map((t, i) => [`11 time-lapse ${i + 1}`, t, o(PL.tl, pick({ pos: [3.6, 0.95, 8.2], look: [0.6, 1.9, 15.0], fov: 46, ...(i === 3 && { to: { pos: [3.45, 0.95, 8.7] }, dur: 2.8 }) },
      { ...tlLook([-9, -9, -9, -12][i]), ...(i === 3 && { to: { pos: [3.4, 1.2, 5.2] }, dur: 2.8 }) }))]),
    ["12 the small ones", T.p12, o(PL.s56, pick({ pos: [0.3, 1.0, 13.4], look: [-2.0, 1.9, 0], fov: 42, to: { pos: [0.15, 1.0, 12.8] }, dur: r3(END - T.p12) },
      { pos: [0.3, 1.0, 13.4], look: [-4.6, 2.4, 1.4], fov: 56, to: { pos: [0.15, 1.0, 12.8] }, dur: r3(END - T.p12) }))],
  ];
  const beats = c.beats(SHOTS.map(([n, t, s, k]) => [n, r3(t + H), s, k]), r3(END + H));

  const lamps = ["spud"];
  return {
    title: "Who really built Stonehenge? (block A)",
    idea: "Ancient aliens EP02 block A (0:00-0:50): a 30-tonne stone drops in the ring ship's beam, the ring goes up to 80; snap to today's ruin; the contract (five clues, answered when the sun of the shortest day touches the tallest stone); clue 1: 6.7 m up, 2.4 m down into its pit, as heavy as two buses, from 25 km away; the jump-cut build ends with a stone landing where he stood; he turns to the small stones",
    fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
    castLook: "sheet", cleanStart: true, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set: SET_OF(T0 + 10), music: H ? partScore("a") : score(T0),
    sound: { scenes: ["scifi"], signature: false, sfx: 0.65, ambience: 0.06, surface: "grass", room: "open", guard: true },
    hook: { show: ["spud", "h1-stone", "h1-ship"], hint: 0, what: "2500 BC: Spud in front of the half-built Stonehenge, a 30-tonne stone hanging in the ring ship's beam behind him" },
    cast, props, captions: c.captions, beats, visible: c.visible,
    allowClip: [
      { who: "spud", with: "s-stones", from: r3(T.touch + H), to: r3(T.p08 + H), reason: "his palm flat on the face of Stone 56" },
      { who: "spud", with: "push9", from: r3(T.p09 + H), to: r3(T.p10a + H), reason: "both palms flat on the stone he pushes" },
      { who: "sheep", with: "push9", from: r3(T.p09 + H), to: r3(T.p10a + H), reason: "the sheep's head against the stone" },
      ...lampClip(lamps, r3(END + H)),
      ...["chip", "wedge", "mash"].flatMap((w) => [`${w}-hat`, `${w}-scarf`].map((p) => ({ who: w, with: p, from: 0, to: r3(END + H), reason: "the winter hat and scarf he wears (kit winter())" }))),
    ],
    notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/block-a/make-block-a.mjs. Block A of four (kit/BLOCKS.md); music = the EP02 score's first 50 s (kit score(0)).",
  };
}

// the WIDE storyboard is the master; the tall cut is written after Jonny's OK on the wide animatic (BLOCKS.md)
const FRAMES = process.argv.includes("--tall") ? [FRAME.wide, FRAME.tall] : [FRAME.wide];
for (const F of FRAMES) write(import.meta.url, { id: `aa02-a-${F.key}`, ...F.sb, ...build(F) });
