// HAPPINESS 03 "I could see everyone's happiness score", BLOCK C "The box" (story 1:40-2:30, panels 25-36, Sunday morning:
// desperation, surprise, understanding). Story: ../OUTLINE.md; look: ../DESIGN.md; kit: ../kit/score-kit.mjs + ../kit/BLOCKS.md.
//   node storyboards/series/happiness/03-happiness-score/block-c/measure-lines.mjs   -> lines.json (narrator lengths)
//   node storyboards/series/happiness/03-happiness-score/block-c/make-block-c.mjs [tall] -> hs03-c{1,2,3,4}-wide.json (tall: -tall)
//   TALL (Jonny 17 Nov: one tall film of the whole story): same story times, sound and lines; only the cameras, the memory
//   crops and two caption spots change (each shot's tall camera sits beside the wide one: tc(wide, tall)).
//   bash storyboards/series/happiness/03-happiness-score/block-c/join-block-c.sh      -> the block's wide animatic (4 renders joined)
//
// FOUR storyboards (a set is one type per storyboard), each with its story T0:
//   c1 room   (scoreroom sunday)  25 search, 25b the DON'T KEEP box, 26 the case lifts, 27 the book, 28 Spud reads
//   c2 memory (painted plates M30 then M29 on a plain set, DESIGN 7; the film's one dissolve in and out)
//   c3 room   (scoreroom sunday)  31 Mash at the door, 32 seats, 33 Mash close, 34 taping, 35 Spud at the window (honk)
//   c4 street (scorestreet)       36 Mash on his step, the white box truck, the driver waves
// Departure (for the director): the memory runs 30 THEN 29. "Years ago, he wore these glasses" lands on kid Mash in the
// glasses (30) and "And the friend he copied..." on kid Spud and his 90 (29), so "...was you" cuts to Mash at the door.
// Spud's score is 30 all block (SPUD keys: no check in C); the glasses ride on his forehead (28) until Mash holds them (32-33),
// lie on the seat (34) and are back on his nose in 35 (OUTLINE 2:27 "Spud still wears the glasses").
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import * as grips from "../../../../lib/grips.mjs";
import { existsSync, readFileSync } from "node:fs";
import { FRAME, SETS, CAST, ROOM, STREET, hudFor, gradeOf, GRADE_FIXED, LOOK_C, narrate, say, tune, SCORE, LEVEL } from "../kit/score-kit.mjs";
import { SCORE_FITS } from "../../../../../engine/page/props-score.js";
import { VAN_SEAT } from "../../../../../engine/page/props-score-van.js";
import { LINES } from "./lines.mjs";

const MEASURED = new URL("./lines.json", import.meta.url);
const DUR = existsSync(MEASURED) ? JSON.parse(readFileSync(MEASURED, "utf8")) : Object.fromEntries(Object.entries(LINES).map(([k, l]) => [k, r3(0.4 + l.split(/\s+/).length / 2.6)]));
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const PRE = 0.012, FAR = 40, D2R = Math.PI / 180;
const yawTo = (a, b) => r3(Math.atan2(b[0] - a[0], b[1] - a[1]) / D2R);
const fwd = (yaw, d) => [r3(Math.sin(yaw * D2R) * d), r3(Math.cos(yaw * D2R) * d)];
const local = (o, yaw, [x, y, z]) => [r3(o[0] + x * Math.cos(yaw * D2R) + z * Math.sin(yaw * D2R)), r3(y), r3(o[1] - x * Math.sin(yaw * D2R) + z * Math.cos(yaw * D2R))];

// ---------------------------------------------------------------- story times (s from the film's frame 0)
const T = {
  s25: 100.0, n1: 100.2, s25b: 105.25, s26: 108.2, lift: 108.7, s27: 110.8, n2: 111.8, s28: 115.75, gasp: 116.3,
  m30: 119.0, n3a: 119.35, m29: 122.4, n3b: 122.75, whistle: 124.9,
  s31: 126.2, n4: 126.25, found: 128.15, s32: 129.4, wore: 129.75, changed: 134.95, box: 136.35, s33: 138.0,
  s34: 139.4, n5: 139.8, s35: 145.9, honk: 146.3, s36: 147.9, END: 150.0,   // v2: D starts at 150.0
};
const SEGS = [
  { key: "c1", place: "room", t0: T.s25, t1: T.m30 },
  { key: "c2", place: "memory", t0: T.m30, t1: T.s31 },
  { key: "c3", place: "room", t0: T.s31, t1: T.s36 },
  { key: "c4", place: "street", t0: T.s36, t1: T.END },
];

// ---------------------------------------------------------------- the room (scoreroom, sunday): spots
const SEARCH = [1.0, 0.0];                       // the open box he digs in (25)
const SP25 = [1.52, -0.44], Y25 = yawTo(SP25, SEARCH);
const CAM25 = [-0.8, 0.5];
const KB = [0.4, -0.9], KB_YAW = yawTo(KB, CAM25);   // the DON'T KEEP box, its red patch to the 25 camera
const SPK = (() => { const f = fwd(KB_YAW, 0.64); return [r3(KB[0] - f[0]), r3(KB[1] - f[1])]; })();   // Spud behind it
const Y_K = KB_YAW;                              // he faces the box (and the camera beyond it)
const Y_READ = r3(Y_K + 180);                    // 27-28: he turns to the window light to read
const INNER_H = 0.22;                            // a taped box inside the DON'T KEEP box: the book and case lie on it
const BOOK_IN = local(KB, KB_YAW, [0, INNER_H + 0.011, 0.135]);
const CASE_IN = local(KB, KB_YAW, [0.02, INNER_H + 0.022, -0.01]);
const SEAT1 = [ROOM.seats[0].x, ROOM.seats[0].z], SEAT2 = [ROOM.seats[1].x, ROOM.seats[1].z];
const MASH31 = [1.3, 1.4];
const MASH34 = [-0.2, -1.2], CAM34 = [-1.4, 0.2], Y34 = yawTo(MASH34, CAM34);
const TAPEBOX = (() => { const f = fwd(Y34, 0.53); return [r3(MASH34[0] + f[0]), r3(MASH34[1] + f[1])]; })();
const WIN35 = [2.25, -1.2];

// ---------------------------------------------------------------- the street (36)
const V = STREET.van, VAN = [V.x + 0.6, r3(STREET.farKerbZ[0] - 0.07 - 1.05)], VAN_ROT = V.rotPlusX;   // at the far kerb facing +x: the driver's window (+x local) looks at the house
const DRIVER = local(VAN, VAN_ROT, [VAN_SEAT.x, VAN_SEAT.y, VAN_SEAT.z]);
const MASH36 = [0.5, 0.75];

// ---------------------------------------------------------------- the memory plates (DESIGN 7)
const PLATE_PX = [1536, 1024], PH = 3.2, PZ = -2.2;
const PL = {
  src: "assets/plates/score-m30.webp", z: PZ, center: [0, 1.6], height: PH, depth: false, motion: false, dust: 0,
  swaps: [{ at: r3(T.m29 - T.m30), src: "assets/plates/score-m29.webp" }],
};
const plateCam = (cx, cy, vw, to) => {   // looks straight at plate pixel (cx, cy), vw plate px across the wide frame
  const k = PH / PLATE_PX[1], one = (cx, cy, vw) => {
    const X = (cx - PLATE_PX[0] / 2) * k, Y = 1.6 - (cy - PLATE_PX[1] / 2) * k, dist = 3.4, vh = vw * k * (9 / 16);
    return { pos: [r3(X), r3(Y), r3(PZ + dist)], look: [r3(X), r3(Y), PZ], fov: r3((2 * Math.atan(vh / 2 / dist) * 180) / Math.PI) };
  };
  const a = one(cx, cy, vw);
  return to ? { ...a, to: one(to[0], to[1], to[2]), dur: to[3], ease: "inOut" } : a;
};
// 29's pencil tag over the painted blank pill (M29 px 804, 194) for the 29 camera (cx 768, cy 410, vw 1450): screen px
const M29CAM = [768, 410, 1450];
const TAG90 = [r3(960 + (804 - M29CAM[0]) * (1920 / M29CAM[2])), r3(540 + (194 - M29CAM[1]) * (1920 / M29CAM[2]))];
// tall: the plate crop is the plate's full height (vh plate px tall, vh * 9/16 across), centred on the kid in each painting
const plateCamT = (cx, cy, vh, to) => {
  const k = PH / PLATE_PX[1], one = (cx, cy, vh) => {
    const X = (cx - PLATE_PX[0] / 2) * k, Y = 1.6 - (cy - PLATE_PX[1] / 2) * k, dist = 3.4;
    return { pos: [r3(X), r3(Y), r3(PZ + dist)], look: [r3(X), r3(Y), PZ], fov: r3((2 * Math.atan((vh * k) / 2 / dist) * 180) / Math.PI) };
  };
  const a = one(cx, cy, vh);
  return to ? { ...a, to: one(to[0], to[1], to[2]), dur: to[3], ease: "inOut" } : a;
};
const M29T = [760, 512, 960];
const TAG90T = [r3(540 + (804 - M29T[0]) * (1920 / M29T[2])), r3(960 + (194 - M29T[1]) * (1920 / M29T[2]))];
const TALL = process.argv.includes("tall");
const tc = (wide, tall) => (TALL ? tall : wide);

function build(F, S) {
  const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, sfx, see } = c;
  const L = (t) => r3(t - S.t0);            // story -> this storyboard's clip time
  const tt = (t) => Math.max(0, L(t));
  const place = (t, who, xz, yaw, y = 0) => {
    const u = Math.max(0, r3(L(t) - PRE));
    A(u, who, "move", { to: xz, y, dur: u === 0 ? 0 : 0.01, steps: 0, ease: "linear", sync: true });
    if (yaw != null) A(u, who, "turn", { to: yaw, dur: u === 0 ? 0 : 0.01, ease: "linear", sync: true });
    A(u, who, "show");
  };
  const park = (t, who, k) => { const u = Math.max(0, r3(L(t) - PRE)); A(u, who, "hide"); A(u, who, "move", { to: [FAR + k * 3, FAR], y: 0, dur: 0.01, steps: 0, ease: "linear", sync: true }); };
  const look = (t, who, to, dur = 0.2) => A(tt(t), who, "look", { to, dur, blink: false });
  const expr = (t, who, e, set, dur = 0.2) => A(tt(t), who, "expr", { expr: e, ...(set && { set }), dur });
  const arm = (t, who, side, pose, dur = 0.3, ease = "inOut") => c.arm(tt(t), who, side, pose, dur, ease);
  const grip = (t, who, side, shape, dur = 0.12) => A(tt(t), who, "grip", { side, shape, dur });
  const pr = (t, id, set, dur = 0.01, ease = "linear") => c.prop(tt(t), id, set, dur, ease);
  const N = (t, k, o) => narrate(c, F, L(t), LINES[k], DUR[k], o);
  const S_ = (t, who, line, dur, tone, pos) => say(c, F, L(t), who, line, dur, tone, pos != null ? { pos } : {});
  const hideP = (t, id) => pr(t - PRE, id, { scale: 0.001, y: -30 });
  const showP = (t, id, spec) => pr(t - PRE, id, { scale: spec.scale ?? 1, y: spec.y ?? 0 });
  const cam = (pos, lk, fov, to, dur) => ({ pos: pos.map(r3), look: lk.map(r3), fov, ...(to && { to: { ...(to.pos && { pos: to.pos.map(r3) }), ...(to.look && { look: to.look.map(r3) }), ...(to.fov && { fov: to.fov }) }, dur, ease: "inOut" }) });

  const cast = [], props = [], allowClip = [], SHOTS = [];
  let set, grade, hud = hudFor(S.t0, S.t1), sound = { signature: false, sfx: 0.65, ambience: 0.05, surface: "wood", room: "room", guard: true, level: LEVEL };

  if (S.key === "c1") {
    // ============================================================ 25-28: the boxes, the case, the book (100.0-119.0)
    set = { ...SETS.sunday, aperture: 0, focus: false };
    cast.push({ id: "spud", character: CAST.spud, at: SP25, face: Y25, expr: "worried", follow: 0.25, seed: 1.3 });
    const GW = { id: "glw", kind: "scoreglasses", wear: "spud", ...SCORE_FITS.forehead, fold: 0 };
    props.push(GW);
    props.push({ id: "search", kind: "cardbox", x: SEARCH[0], y: 0, z: SEARCH[1], rot: r3(Y25 + 180), w: 0.5, d: 0.4, h: 0.38 });
    props.push({ id: "kbox", kind: "keepbox", x: KB[0], y: 0, z: KB[1], rot: KB_YAW });
    props.push({ id: "inner", kind: "cardbox", closed: true, x: KB[0], y: 0.012, z: KB[1], rot: KB_YAW, w: 0.5, d: 0.36, h: INNER_H });
    const BOOKC = { id: "bookc", kind: "mashbook", open: 0, x: BOOK_IN[0], y: BOOK_IN[1], z: BOOK_IN[2], rot: KB_YAW, tip: -90 };
    const CASE = { id: "case", kind: "scorecase", open: 0, x: CASE_IN[0], y: CASE_IN[1], z: CASE_IN[2], rot: r3(KB_YAW + 8) };
    props.push(BOOKC, CASE);
    // the open book in his hands (27-28): a second instance, taken on the cut (the closed one hides)
    const HOLD = local(SPK, Y_READ, [0, 0.25, 0.3]);
    const BOOK = { id: "book", kind: "mashbook", open: 1, ...grips.placeFor("mashbook", HOLD, Y_READ), tip: -25 };
    const BOOKF_AT = local(KB, KB_YAW, [0, INNER_H + 0.012 + 0.0055, 0.135]);
    const BOOKF = { id: "bookf", kind: "mashbook", open: 1, x: BOOKF_AT[0], y: BOOKF_AT[1], z: BOOKF_AT[2], rot: KB_YAW, tip: -90, scale: 0.001 };
    props.push(BOOKF);
    BOOK.y = -30; props.push(BOOK);
    pr(0, "case", { open: 0 }); pr(0, "book", { tip: -25 });
    // ---- 25 he digs through an open box (Spud 30, HUD flips to 09:12), N1
    expr(T.s25, "spud", "worried", { brow: 0.6, curve: -0.2 }, 0.01);
    A(0, "spud", "lean", { to: 16, dur: 0 });
    look(T.s25, "spud", [0, -0.6], 0.01);
    const DIG = (k) => local(SEARCH, Y25 + 180, [k ? -0.08 : 0.1, 0.33, 0.02 * k]);
    for (let i = 0; i < 6; i++) {
      const t = T.s25 + 0.2 + i * 0.75, s = i % 2 ? "L" : "R";
      arm(t, "spud", s, { world: DIG(i % 2) }, i ? 0.3 : 0.5, "out"); grip(t, "spud", s, "open", 0.1);
      arm(t + 0.38, "spud", s, { world: local(SEARCH, Y25 + 180, [i % 2 ? -0.12 : 0.14, 0.41, 0.12]) }, 0.32, "inOut");
    }
    sfx(L(T.s25 + 0.35), "ai-package/cardboard-rustle", { gain: 0.32, reason: "his gloves dig through the packing in the open box" });
    sfx(L(T.s25 + 2.6), "ai-package/cardboard-rustle", { gain: 0.25, reason: "more digging" });
    A(L(T.s25 + 4.7), "spud", "lean", { to: 4, dur: 0.4 });
    for (const s of ["R", "L"]) arm(T.s25 + 4.7, "spud", s, "rest", 0.4);
    expr(T.s25 + 4.6, "spud", "sad", { brow: 0.7, curve: -0.35 }, 0.3);   // nothing
    look(T.s25 + 4.6, "spud", [-0.4, -0.2], 0.3);
    N(T.n1, "n1");
    see(L(T.s25), L(T.s25b), ["spud.face", "search"], "Sunday morning: Spud digs through an open moving box in the nearly empty room");
    SHOTS.push(["25 the boxes", T.s25, tc(cam([CAM25[0], 0.95, CAM25[1]], [2.6, 0.55, -1.05], 44, { pos: [-0.55, 0.92, 0.4] }, r3(T.s25b - T.s25)),
      cam([CAM25[0], 0.95, CAM25[1]], [1.35, 0.62, -0.3], 52, { pos: [-0.55, 0.92, 0.4], fov: 49 }, r3(T.s25b - T.s25)))]);
    // ---- 25b the DON'T KEEP box: he looks in
    place(T.s25b, "spud", SPK, Y_K); A(L(T.s25b) - PRE, "spud", "lean", { to: 18, dur: 0.01 });
    for (const s of ["R", "L"]) arm(T.s25b - PRE, "spud", s, "rest", 0.01);
    look(T.s25b, "spud", [0, -0.7], 0.01); expr(T.s25b, "spud", "sad", { brow: 0.5 }, 0.01);
    expr(T.s25b + 1.0, "spud", "focused", { brow: 0.2, eye: 1.15 }, 0.25);   // something in there
    A(L(T.s25b + 1.0), "spud", "lean", { to: 18, dur: 0.4 });
    grips.rest(c, "spud", "R", { ...CASE, h: 0.09 }, [0, 0], L(T.s25b + 2.2), { dur: 0.45 });
    grip(T.s25b + 2.2, "spud", "R", "flat", 0.2);
    see(L(T.s25b), L(T.s26), ["spud.face", "kbox"], "he leans over a box with a red patch: inside an old glasses case on a notebook");
    { const f = fwd(KB_YAW - 60, 1.7); SHOTS.push(["25b the DON'T KEEP box", T.s25b, cam([SPK[0] + f[0], 1.0, SPK[1] + f[1]], tc([r3((SPK[0] + KB[0]) / 2), 0.42, r3((SPK[1] + KB[1]) / 2)], [r3(SPK[0] * 0.88 + KB[0] * 0.12), 0.62, r3(SPK[1] * 0.88 + KB[1] * 0.12)]), tc(44, 60), { fov: tc(41, 56) }, r3(T.s26 - T.s25b))]); }
    // ---- 26 the case lifts off the book (his palm stays on its top: the arm aims at the case)
    pr(T.lift, "case", { y: r3(CASE_IN[1] + 0.25) }, 0.55, "inOut");
    sfx(L(T.lift + 0.05), "ai-package/cardboard-rustle", { gain: 0.18, reason: "the case scrapes off the book" });
    see(L(T.s26), L(T.s27), ["case", "bookc"], "close into the box: his glove lifts the green case; under it an old navy notebook");
    { const f = fwd(KB_YAW, 0.32); SHOTS.push(["26 the case", T.s26, cam([KB[0] + f[0], 1.22, KB[1] + f[1]], [KB[0], 0.18, KB[1]], tc(42, 52))]); }
    // ---- 27 the book, open where it lay (top-down into the box, as 26); N2. Departure: no gloves on its edges (a held book sits
    // under his face, so a top-down of it sees his head first)
    hideP(T.s27, "bookc"); hideP(T.s27, "case");
    for (const s of ["R", "L"]) { arm(T.s27 - PRE, "spud", s, "rest", 0.01); grip(T.s27 - PRE, "spud", s, "relaxed", 0.01); }
    A(L(T.s27) - PRE, "spud", "lean", { to: 14, dur: 0.01 });
    showP(T.s27, "bookf", { ...BOOKF, scale: 1 });   // BOOKF.scale is the hidden start size
    look(T.s27, "spud", [0, -0.8], 0.01); expr(T.s27, "spud", "focused", { brow: 0.3 }, 0.01);
    sfx(L(T.s27 + 0.1), "book-flip", { gain: 0.3, reason: "the old exercise book falls open" });
    N(T.n2, "n2");
    see(L(T.s27), L(T.s28), ["bookf"], "top-down into the box: the old notebook lies open: a pencil potato on a bike, and MASH = 41. WHY? with a ticked list");
    { const f = fwd(KB_YAW, 0.12); SHOTS.push(["27 the book", T.s27, cam([KB[0] + f[0], 0.98, KB[1] + f[1]], [KB[0] - f[0] * 0.3, 0.24, KB[1] - f[1] * 0.3], tc(40, 66), { fov: tc(33, 60) }, r3(T.s28 - T.s27))]); }
    // ---- 28 he reads it: the surprise
    hideP(T.s28, "bookf");
    place(T.s28, "spud", SPK, Y_READ); A(L(T.s28) - PRE, "spud", "lean", { to: 4, dur: 0.01 });
    pr(T.s28 - PRE, "book", { y: HOLD[1] });
    const hb = grips.box(c, "spud", BOOK);
    hb.take(L(T.s28) - 0.006, { reach: 0.005, settle: 0.005 });
    look(T.s28, "spud", [0, -0.45], 0.01); expr(T.s28, "spud", "focused", { brow: 0.3 }, 0.01);
    expr(T.gasp, "spud", "shocked", { open: 0.3, eye: 1.35 }, 0.18);
    A(L(T.gasp), "spud", "squash", { amount: 0.04, dur: 0.25 });
    look(T.gasp + 0.6, "spud", [0, -0.35], 0.3);
    see(L(T.s28), L(T.m30), ["spud.face", "glw", "book"], "close: Spud, glasses pushed up on his head, stares into the old book, mouth open");
    { const f = fwd(Y_READ, 1); SHOTS.push(["28 he reads", T.s28, cam([SPK[0] + f[0] * 1.65, 0.6, SPK[1] + f[1] * 1.65], [SPK[0], tc(0.5, 0.56), SPK[1]], tc(34, 50), { fov: tc(31, 46) }, r3(T.m30 - T.s28))]); }
    allowClip.push({ who: "spud", with: "glw", from: 0, to: L(S.t1), checks: ["shell", "clipping"], reason: "the glasses are worn, pushed up on his head: the temples rest on the dome (SCORE_FITS.forehead)" });
    allowClip.push({ who: "spud", with: "kbox", from: L(T.s25b), to: L(T.s28), checks: ["shell", "arm-in-prop", "hand-in-prop"], reason: "panel 26: he reaches down inside the open DON'T KEEP box for the case (the arm passes its open top)" });
    allowClip.push({ who: "spud", with: "search", from: 0, to: L(T.s25b), checks: ["arm-in-prop", "hand-in-prop", "costume-in-prop"], reason: "panel 25: he digs with both gloves through the packing inside the open box (hands and forearms inside it, the sweater over its rim)" });
    grade = gradeOf(S.t0);
  }

  if (S.key === "c2") {
    // ============================================================ 30 + 29: the memory (painted plates, 119.0-126.2)
    set = { type: "plain", floor: "none", plate: PL, aperture: 0, focus: false };
    cast.push({ id: "spud", character: CAST.spud, at: [FAR, FAR], face: 0, expr: "kind", seed: 1.3 });   // offstage: the plate is the picture
    A(0, "spud", "hide");
    N(T.n3a, "n3a");
    N(T.n3b, "n3b", TALL ? { pos: 400 } : {});   // tall: under the 90 pill (above it leaves the app safe zone)
    tune(c, L(T.whistle), { gain: 0.35, reason: "THE TUNE: kid Spud whistles it on his bike (2:05)" });
    SHOTS.push(["30 kid Mash in the glasses", T.m30, tc(plateCam(800, 470, 1450, [756, 470, 1450, r3(T.m29 - T.m30)]), plateCamT(400, 512, 960, [400, 540, 900, r3(T.m29 - T.m30)]))]);
    SHOTS.push(["29 kid Spud, 90", T.m29, tc(plateCam(...M29CAM), plateCamT(...M29T))]);
    grade = [[0, { c: LOOK_C, lift: 0, ...GRADE_FIXED.memory }]];
    hud = null;
    sound = { signature: false, sfx: 0.65, ambience: 0.04, surface: "grass", room: "open", guard: true, level: LEVEL };
    S.score = { view: [], tags: [{ xy: tc(TAG90, TAG90T), keys: [[0, 90]], show: [L(T.m29), L(T.s31)], free: true, style: "pencil", size: "close", k: 0.8 }] };
  }

  if (S.key === "c3") {
    // ============================================================ 31-35: Mash, the seats, the tape, the window (126.2-148.4)
    set = { ...SETS.sunday, aperture: 0, focus: false };
    cast.push({ id: "mash", character: CAST.mash, at: MASH31, face: 180, expr: "kind", follow: 0.25, seed: 2.1 });
    cast.push({ id: "spud", character: CAST.spud, at: [FAR, FAR], face: 0, expr: "kind", follow: 0.25, seed: 1.3 });
    A(0, "spud", "hide");
    // the tape roll in Mash's hands at the door (31); later he tapes the box (34)
    const TAPE = { id: "tape", kind: "taperoll", ...grips.placeFor("taperoll", local(MASH31, 180, [0, 0.4, 0.3]), 180), pull: 0 };
    props.push(TAPE);
    const GL = { id: "gll", kind: "scoreglasses", fold: 0, x: FAR, y: -30, z: FAR, rot: 0, tip: -45, staged: "parked offstage under the floor until Mash holds them in 32" };
    const GW = { id: "glw", kind: "scoreglasses", wear: "spud", ...SCORE_FITS.nose, fold: 0, scale: 0.001 };
    const GS = { id: "gls", kind: "scoreglasses", fold: 1, x: r3(SEAT2[0] + 0.04), y: r3(ROOM.seatH + 0.097), z: r3(SEAT2[1] - 0.05), rot: 270, tip: -24, scale: 0.001, staged: "lies folded on the seat box Mash just left (the set's seat boxes are not solid for the checks)" };
    props.push(GL, GW, GS);
    props.push({ id: "tbox", kind: "cardbox", closed: true, x: TAPEBOX[0], y: 0, z: TAPEBOX[1], rot: Y34, w: 0.55, d: 0.4, h: 0.42, scale: 0.001 });
    pr(0, "tape", { pull: 0 }); pr(0, "gll", { fold: 0 }); pr(0, "gls", { fold: 1 }); pr(0, "glw", { fold: 0 });
    // ---- 31 "...was you." Mash at the door, tape roll in his hands
    const ht = grips.box(c, "mash", TAPE);
    ht.take(0, { reach: 0.005, settle: 0.005 });
    expr(T.s31, "mash", "kind", { curve: 0.35 }, 0.01); look(T.s31, "mash", [0, -0.15], 0.01);
    N(T.n4, "n4");
    expr(T.found - 0.3, "mash", "happy", { curve: 0.55 }, 0.3);
    S_(T.found, "mash", "You found them.", 1.25, "calm");
    see(L(T.s31), L(T.s32), ["mash.face", "tape"], "Mash in the doorway with a roll of packing tape, smiling softly at Spud");
    SHOTS.push(["31 Mash at the door", T.s31, cam([0.9, 0.9, -1.3], [1.45, 1.35, 1.4], tc(40, 46), { fov: tc(38, 44) }, r3(T.s32 - T.s31))]);
    // ---- 32 both on the boxes; Mash holds the glasses, turns them
    ht.release(L(T.s32) - 0.05, { rest: false });
    hideP(T.s32, "tape");
    place(T.s32, "spud", SEAT1, -90); A(L(T.s32) - PRE, "spud", "sit", { rot: -90, height: ROOM.seatH, dur: 0, hands: "lap" });
    place(T.s32, "mash", SEAT2, -90); A(L(T.s32) - PRE, "mash", "sit", { rot: -90, height: ROOM.seatH, dur: 0, hands: "keep" });
    const GHOLD = local(SEAT2, -90, [0, 0.56, 0.3]);
    Object.assign(GL, grips.placeFor("scoreglasses", GHOLD, -90), { tip: -45 });
    pr(T.s32 - PRE, "gll", { y: GHOLD[1] });
    const hg = grips.box(c, "mash", GL);
    hg.take(L(T.s32) - 0.006, { reach: 0.005, settle: 0.005 });
    for (let i = 0; i < 2; i++) { hg.carry(L(T.s32 + 0.8 + i * 3.0), GHOLD, 1.4, "inOut", { tip: -60 }); hg.carry(L(T.s32 + 2.2 + i * 3.0), GHOLD, 1.4, "inOut", { tip: -35 }); }
    expr(T.s32, "mash", "kind", { curve: 0.3 }, 0.01); look(T.s32, "mash", [0, -0.5], 0.01);
    expr(T.s32, "spud", "sad", { brow: 0.4, curve: -0.1 }, 0.01); look(T.s32, "spud", [0.6, -0.1], 0.01);
    S_(T.wore, "mash", "I wore them a whole year.", 1.9, "calm", tc(56, null));   // split in two: one long caption ran into the clock HUD
    S_(T.wore + 1.95, "mash", "Copied everything you did.", 1.6, "calm", tc(56, null));
    S_(T.wore + 3.6, "mash", "Stayed at forty-one.", 1.4, "calm", tc(56, null));
    look(T.wore + 1.5, "mash", [-0.6, -0.05], 0.3);   // to Spud
    expr(T.changed - 0.2, "spud", "focused", { brow: 0.2, eye: 1.1 }, 0.2);
    S_(T.changed, "spud", "So what changed?", 1.2, "question", tc(56, null));
    look(T.changed + 0.1, "mash", [-0.6, -0.05], 0.2);
    see(L(T.s32), L(T.s33), ["spud.face", "mash.face", "gll"], "both sit on taped moving boxes by the window; Mash holds the old glasses in both hands");
    SHOTS.push(["32 on the boxes", T.s32, cam(tc([-0.75, 0.78, -1.22], [-1.1, 0.85, -1.22]), [3.0, 1.15, -1.22], tc(50, 60), { fov: tc(48, 58) }, r3(T.s33 - T.s32))]);
    // ---- 33 Mash close: "I put them in that box."
    expr(T.box - 0.2, "mash", "happy", { curve: 0.7 }, 0.25);
    S_(T.box, "mash", "I put them in that box.", 1.5, "calm", tc(56, null));
    look(T.box + 1.6, "mash", [-0.6, -0.05], 0.3);
    see(L(T.s33), L(T.s34), ["mash.face", "gll"], "close on Mash, smiling at Spud, the glasses in his hands (no line: his last line ends in the two-shot)");
    SHOTS.push(["33 Mash close", T.s33, cam([0.75, 1.08, -0.45], [SEAT2[0], tc(1.05, 1.14), SEAT2[1] - 0.05], tc(34, 50), { fov: tc(31, 47) }, r3(T.s34 - T.s33))]);
    // ---- 34 Mash tapes a box; Spud on his box, the glasses folded beside him; N5 (mind on what you do)
    hg.release(L(T.s34) - 0.05, { rest: false });
    pr(T.s34 - PRE, "gll", { y: -30 }); showP(T.s34, "gls", { y: GS.y }); showP(T.s34, "tbox", {});
    A(L(T.s34) - PRE, "mash", "stand", { dur: 0.01 });
    place(T.s34, "mash", MASH34, Y34);
    for (const s of ["R", "L"]) arm(T.s34 - PRE, "mash", s, "rest", 0.01);
    const TAPE_A = local(TAPEBOX, Y34, [0.18, 0.42, 0]), TAPE_B = local(TAPEBOX, Y34, [-0.16, 0.42, 0]);
    showP(T.s34, "tape", { y: TAPE_A[1] });
    pr(T.s34 - PRE, "tape", { x: TAPE_A[0], z: TAPE_A[2], rot: r3(Y34 + 180) });
    A(L(T.s34) - PRE, "mash", "lean", { to: 16, dur: 0.01 });
    const ht2 = grips.box(c, "mash", { ...TAPE, x: TAPE_A[0], y: TAPE_A[1], z: TAPE_A[2], rot: r3(Y34 + 180) });
    ht2.take(L(T.s34) + 0.1, { reach: 0.2, settle: 0.12 });
    ht2.carry(L(T.s34 + 0.9), TAPE_B, 1.6, "inOut");
    pr(T.s34 + 0.9, "tape", { pull: 1 }, 1.6, "linear");
    sfx(L(T.s34 + 0.95), "zip", { gain: 0.16, reason: "packing tape pulled off the roll along the seam" });
    ht2.carry(L(T.s34 + 3.2), TAPE_A, 1.6, "inOut");
    sfx(L(T.s34 + 3.25), "zip", { gain: 0.14, reason: "a second strip" });
    expr(T.s34, "mash", "serene", { curve: 0.3 }, 0.01); look(T.s34, "mash", [0, -0.7], 0.01);
    // Jonny 16 Nov: no whistle when a character comes into a scene (Mash's taping whistle at the 34 cut is gone)
    A(L(T.s34) - PRE, "spud", "sit", { rot: -90, height: ROOM.seatH, dur: 0, hands: "lap" });
    expr(T.s34, "spud", "sad", { brow: 0.3, curve: 0 }, 0.01); look(T.s34, "spud", [-0.5, -0.2], 0.01);
    N(T.n5, "n5");
    see(L(T.s34), L(T.s35), ["mash.face", "tbox", "spud"], "Mash tapes a box shut, eyes closed; Spud sits on a box behind him, the folded glasses beside him");
    SHOTS.push(["34 taping", T.s34, cam([-2.2, 1.0, 0.8], tc([1.0, 1.1, -1.4], [-0.05, 0.9, -1.15]), tc(44, 56), { pos: [-2.05, 1.0, 0.65] }, r3(T.s35 - T.s34))]);
    // ---- 35 Spud at the window, the glasses back on; the truck honks outside
    park(T.s35, "mash", 1); hideP(T.s35, "tape"); A(L(T.s35) - 0.05, "mash", "release", { prop: "tape", dur: 0 });
    hideP(T.s35, "gls"); showP(T.s35, "glw", { y: SCORE_FITS.nose.y });
    A(L(T.s35) - PRE, "spud", "stand", { dur: 0.01 });
    place(T.s35, "spud", WIN35, 90);
    for (const s of ["R", "L"]) arm(T.s35 - PRE, "spud", s, "rest", 0.01);
    expr(T.s35, "spud", "sad", { brow: 0.45, curve: -0.15 }, 0.01); look(T.s35, "spud", [0.2, -0.2], 0.01);
    sfx(L(T.honk), "horn", { gain: 0.3, reason: "the moving truck honks in the street below (heard through the window)" });
    expr(T.honk + 0.15, "spud", "worried", { brow: 0.6, eye: 1.2 }, 0.15);
    look(T.honk + 0.15, "spud", [0.3, -0.45], 0.2);
    see(L(T.s35), L(T.s36), ["spud.face", "glw"], "Spud at the window with the glasses on again; outside, the truck honks");
    SHOTS.push(["35 the window", T.s35, cam([2.85, 0.72, 0.25], tc([2.55, 0.62, -1.4], [2.56, 0.72, -1.25]), tc(38, 44), { fov: tc(35, 40) }, r3(T.s36 - T.s35))]);
    allowClip.push({ who: "spud", with: "glw", from: L(T.s35), to: L(S.t1), checks: ["shell", "clipping"], reason: "the glasses are worn on his nose: the temples rest on his head (SCORE_FITS.nose)" });
    allowClip.push({ who: "mash", with: "tbox", from: L(T.s34), to: L(T.s35), checks: ["arm-in-prop", "hand-in-prop"], reason: "panel 34: he presses the tape roll along the box's top seam, forearm on the lid" });
    allowClip.push({ who: "mash", with: "gll", from: L(T.s32), to: L(T.s34), checks: ["thin-prop-hidden"], reason: "thin glasses held by the hinges" });
    grade = gradeOf(S.t0);
  }

  if (S.key === "c4") {
    // ============================================================ 36 the street: Mash on his step, the box truck (148.4-151.4)
    set = { ...SETS.street, aperture: 0, focus: false };
    cast.push({ id: "mash", character: CAST.mash, at: MASH36, face: 8, expr: "kind", follow: 0.25, seed: 2.1 });
    cast.push({ id: "driver", character: CAST.driver, at: [DRIVER[0], DRIVER[2]], face: VAN_ROT, expr: "happy", seed: 6.2 });
    props.push({ id: "van", kind: "boxvan", x: VAN[0], y: V.y, z: VAN[1], rot: VAN_ROT, win: 1, open: 0, len: 0 });
    props.push({ id: "dcap", kind: "flatcap", wear: "driver", fit: "driver", color: "#9a7a4a", x: 0, y: 0, z: 0 });
    pr(0, "van", { win: 1, open: 0, len: 0 });
    A(0, "driver", "sit", { rot: VAN_ROT, height: r3(DRIVER[1] + 0.02), dur: 0, hands: "lap" });
    arm(T.s36 + 0.25, "driver", "L", "wave", 0.3, "out"); grip(T.s36 + 0.25, "driver", "L", "open", 0.1);
    expr(T.s36, "mash", "kind", { curve: 0.2 }, 0.01); look(T.s36, "mash", [0.4, 0.1], 0.01);
    sfx(L(T.s36 + 0.1), "rumble", { gain: 0.08, reason: "the truck's engine idling at the kerb" });
    see(L(T.s36), L(S.t1), ["mash", "van", "driver.face"], "from behind Mash on his doorstep: the white moving truck at the kerb, the driver waves from the window");
    SHOTS.push(["36 the truck", T.s36, cam([1.05, 1.3, -0.8], tc([2.9, 1.3, 8.0], [r3(DRIVER[0] * 0.65 + VAN[0] * 0.35), 1.35, r3(DRIVER[2] * 0.65 + VAN[1] * 0.35)]), tc(42, 50), { fov: tc(39, 46) }, r3(S.t1 - T.s36))]);
    allowClip.push({ who: "driver", with: "van", from: 0, to: L(S.t1), reason: "the driver sits in the cab (the truck encloses him)" });
    allowClip.push({ who: "driver", with: "dcap", from: 0, to: L(S.t1), reason: "the cap is worn" });
    grade = gradeOf(S.t0);
    sound = { signature: false, sfx: 0.65, ambience: 0.06, surface: "stone", room: "open", guard: true, level: LEVEL };
  }

  const beats = c.beats(SHOTS.map(([n, t, s]) => [n, L(t), s]), L(S.t1));
  return {
    title: `I could see everyone's happiness score (block C, ${S.key})`,
    idea: "Happiness 03 block C (1:40-2:30): Sunday morning; Spud searches Mash's boxes for his secret and finds Mash's old notebook under the glasses case: MASH = 41. WHY? The friend Mash copied was Spud. Mash put the glasses in the DON'T KEEP box; the truck honks.",
    fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
    cleanStart: false, motion: MOTION, rig: RIG, physics: false, loopIdle: false,
    set,
    ...(grade && { grade }), ...(hud && Object.keys(hud).length && { hud }), ...(S.score && { score: S.score }),
    music: SCORE(S.t0),   // the film's one score (kit/score.py), this segment's slice
    sound,
    hook: { show: [cast[0].id], hint: 0, what: "mid-film block (no hook of its own in the wide film)" },
    cast, props, captions: c.captions, beats, visible: c.visible, allowClip,
    notes: `Generated by storyboards/series/happiness/03-happiness-score/block-c/make-block-c.mjs. Block C, storyboard ${S.key} (story ${S.t0}-${S.t1} s). Music: block C's animatic bed (sad piano, then the felt piano + celesta of elegant-reveal from the twist at 2:06).`,
  };
}

const F0 = TALL ? FRAME.tall : FRAME.wide;
for (const S of SEGS) write(import.meta.url, { id: `hs03-${S.key}-${F0.key}`, ...F0.sb, ...build(F0, S) });
