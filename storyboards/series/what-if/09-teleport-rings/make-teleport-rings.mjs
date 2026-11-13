// WHAT IF YOU COULD TELEPORT? (There's a catch, episode 9, the wedding rings). Jonny 13 Nov 2026 07:30 Berlin: "lets start
// building this" with his full story (viral study story 7). His brief is the target beat for beat: STORY.md here.
// Panels: board.png + PANELS.md here (Codex sheet, 13 Nov). New looks: DESIGN.md here (Fable). Places, cameras: NOTES.md.
//   node storyboards/series/what-if/09-teleport-rings/make-teleport-rings.mjs           -> teleport-rings.json (opener A)
//   OPEN=B ...                                                                           -> teleport-rings-b.json (3 s prefix)
//   ... --no-vo                                                                          -> *-no-vo.json (no narrator)
//
// THE BRIEF
//   Want:  Spud, best man, must get the rings to the altar before the bride (twenty steps away) arrives.
//   Rule:  he can teleport, but every jump leaves behind the last thing he touched; it drops where he stood.
//   Chain: no rings, SO he jumps; he touched the bow tie, SO it stays (Chip catches it); he touched the rings last, SO
//          they stay (spinning on the hall floor); the box arrives empty, Chip: "...Again."; he clutched the box, SO it
//          stays (Chip's other glove); he works out the rule and picks a decoy: the cactus, SO he flinches; he scratches
//          his leaf, SO the leaf stays; the rings arrive and he is bald. The photo: Chip holding everything, Spud bald
//          and proud. Tag: the leaf beside the cactus under the old photo of Spud with his leaf.
//
// WORLD (DESIGN.md). Frame A, the garden: `gardenaltar` at the origin, x right as the camera sees it, the camera on +z
// looking down the aisle (-z); lawn y 0, altar line z 0. Frame B, the hall: `ringhall` at [0, 0, 60], its door wall
// z 60, the corridor running to +z (cuts hide the distance).
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { hud } from "../../../lib/overlay.mjs";

// ---------------------------------------------------------------- the template's picks (storyboards/templates)
const LOOK = "sheet", LIGHTING = 2, HATCH = { boil: 0.25 }, CEL = { at: 0.25 }, ANIME_TIMING = true;
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 }, PHYSICS = true;
const c = clip({ faces: "strong", lines: { sub: true, blink: false } }), { A, cap, see } = c;
const VO = !process.argv.includes("--no-vo");
const B = (process.env.OPEN ?? "A").toUpperCase() === "B";
const O = B ? 3.0 : 0;   // opener B: 3 s in front, the film then runs unchanged
// the builders' packs: until a file is in, its kinds are stood in for by boxes at the real sizes (the staging proof)
const READY = new Set((process.env.READY ?? "set,props,hud,sound").split(",").filter(Boolean));
const has = (pack) => READY.has(pack);
// the episode's new sounds (sound builder: engine/soundgen/recipes-teleport-rings-sfx.json); left out until "sound" is in
const NEW_SFX = new Set(["ai/ring-box-snap", "ai/air-push", "ai/ring-spin-wood", "ai/cloth-catch", "ai/guest-gasp", "ai/camera-shutter", "ai/clock-tick"]);
const sfx = (t, name, o) => (NEW_SFX.has(name) && !has("sound") ? null : c.sfx(t, name, o));
const box = (w, h, d) => ({ kind: "stoneblock", w, h, d });
const ph = (pack, final, stand) => (has(pack) ? final : { id: final.id, x: final.x, y: final.y ?? 0, z: final.z, ...(final.rot != null && { rot: final.rot }), ...stand });
const P = (t, id, set, dur = 0.01, ease = "linear") => c.prop(r3(t), id, set, dur, ease);
const Pk = (pack, t, id, set, dur, ease) => { if (has(pack)) P(t, id, set, dur, ease); };

// ---------------------------------------------------------------- the beats (story seconds; video = story + O)
// 01 the empty box | 02 insert | 03 the bow tie | 04 jump 1 | 05 hall, rings into the box | 06 rings spin |
// 07 the box presented | 08 "...Again." | 09 jump 3, the box | 10 hall, the rule | 11 the cactus | 12 the leaf |
// 13 bald | 14 rings on | 15 the photo | 16 the leaf on the shelf
const S = {
  ins: 1.3, two: 2.3, tie: 3.0, j1: 4.45, hall: 6.3, scoop: 7.0, drop: 8.1, j2: 8.9, spin: 9.0, alt2: 12.0, snap: 12.3,
  pres: 12.7, open: 13.3, cu: 14.3, again: 15.4, two3: 16.6, grab3: 16.9, j3: 17.6, hall3: 18.8, look1: 20.4,
  look2: 21.5, close: 23.4, flinch1: 24.6, flinch2: 26.3, hallm: 27.8, scratch: 28.4, j4: 29.4, alt4: 31.2, fist: 31.8,
  stare: 33.2, pat: 34.4, gasp: 35.2, arrive: 37.6, rings: 38.6, photo: 40.2, flash: 41.0, shelf: 43.2, END: 46.5,
};
const T = Object.fromEntries(Object.entries(S).map(([k, v]) => [k, r3(v + O)]));
const END = T.END;
const DOWN = -60, PARK = [200, 0];
const FAR = [205, 0.5, 5];   // where a prop goes when it leaves the story (off every set)


// ---------------------------------------------------------------- the clock: steps left, the SAME keys move Mash
// (DESIGN 7: number and bride can't drift apart). [story s, steps] points, linear between them.
const STEPS = [[0, 20], [4.6, 17], [9.0, 15], [14.0, 12], [20.5, 6], [27.0, 3], [32.5, 1], [S.arrive + 0.6, 0]];
const BRIDE = (n) => [0, r3(-0.65 - 0.5 * n)];
const stepKeys = [[0, 20], ...STEPS.slice(1).map(([t, n], i) => [r3(STEPS[i][0] + O + 0.01), n, r3(t - STEPS[i][0] - 0.01)])];
if (B) stepKeys[0] = [0, 20];

// ---------------------------------------------------------------- helpers
const place = (t, who, at, yaw, y) => { A(r3(t - 0.02), who, "move", { to: at, dur: 0.01, steps: 0, ease: "linear", sync: true, ...(y != null && { y }) }); A(r3(t - 0.02), who, "turn", { to: yaw, dur: 0.01, ease: "linear", sync: true }); };
const expr = (t, who, e, set, dur = 0.12) => A(r3(t), who, "expr", { expr: e, ...(set && { set }), dur });
const look = (t, who, to, dur = 0.2) => A(r3(t), who, "look", { to, dur, blink: false });
const SUBY = 360;    // speech lettering in the upper third, centred under the counter, never over a face (DESIGN 7)
const say = (t, who, line, dur, tone) => c.say(r3(t), who, line, dur, tone, { voice: false, sub: line, pos: SUBY });

// places, frame A (DESIGN 1.1)
const CHIP = [-0.48, 0], SPUD = [0.5, 0], CHIP_STEP = [-0.3, 0];   // Chip's one step toward Spud's spot to catch (DESIGN 9.5)
const PHOTO = { chip: [-0.6, 2.2], spud: [0.62, 2.2], mash: [0, 1.55] };
const TIE_HANG = [0.5, 0.47, 0.335];
// frame B (DESIGN 2): ringhall local + [0, 0, 60]
const HZ = 60, H = (x, y, z) => [x, y, r3(z + HZ)];
const SPUD_SHELF = [0.28, r3(1.8 + HZ)];   // 12 cm further from the shelf than DESIGN: his reach stayed in the plank
const RING_SHELF = H(1.05, 0.5, 1.97), RING_A = H(0.2, 0.015, 2.15), RING_B = H(0.52, 0.015, 2.3);
const KNEEL = [0.36, r3(2.6 + HZ)];   // beside where the rings came to rest

// ---------------------------------------------------------------- cast
const cast = [
  { id: "spud", character: "potatobrawl/spud", at: SPUD, face: -8, expr: "shocked", follow: 0.3, seed: 1.3 },
  { id: "bald", character: has("props") ? "what-if/spud-bald" : "potatobrawl/spud", at: [204, 0], face: 0, expr: "kind", follow: 0.3, seed: 1.3 },
  { id: "chip", character: "potatobrawl/chip", at: CHIP, face: 8, expr: "shocked", follow: 0.3, seed: 4.4 },
  { id: "mash", character: "potatobrawl/mash", at: BRIDE(20), face: 0, expr: "happy", follow: 0.2, seed: 7.1 },
];

// ---------------------------------------------------------------- props
const NIL = { ...box(0.01, 0.01, 0.01), y: DOWN };
const GUESTS = [   // DESIGN 1.3: [seat id, side, row, col, dress, color, hat, glasses]
  ["R1a", 1, 1, 1, "jacket", "#34466b", 0, true], ["R1b", 1, 1, 2, "dress", "#c98a8f", 3, false],
  ["L1a", -1, 1, 1, "dress", "#a892c0", 1, false], ["L1b", -1, 1, 2, "jacket", "#7a2f3a", 2, false],
  ["R2a", 1, 2, 1, "jacket", "#6b4a36", 1, false], ["R2b", 1, 2, 2, "dress", "#9fb78a", 0, false],
  ["L2a", -1, 2, 1, "jacket", "#6f7044", 0, true], ["L2b", -1, 2, 2, "jacket", "#5d3f5f", 3, false],
  ["R3a", 1, 3, 1, "jacket", "#5f6f86", 2, false], ["L3a", -1, 3, 1, "dress", "#c98a8f", 1, false],
  ["L3b", -1, 3, 2, "jacket", "#34466b", 0, false], ["R4b", 1, 4, 2, "dress", "#a892c0", 2, false],
  ["L4a", -1, 4, 1, "jacket", "#6b4a36", 3, false], ["R5a", 1, 5, 1, "jacket", "#6f7044", 1, false],
];
const SEAT = (side, k, col) => [r3(side * (1.25 + 0.75 * (col - 1))), r3(-2.15 - 1.5 * (k - 1))];
const props = [
  // ---- the garden (T1 props-wedding-set.js)
  ph("set", { id: "gar", kind: "gardenaltar", x: 0, y: 0, z: 0 }, { ...box(1.3, 0.006, 11.5), z: -6.15 }),
  ph("set", { id: "archE", kind: "flowerarch", x: 0, y: 0, z: -10.95, on: 1 }, { ...box(2.7, 3.0, 0.45), z: -11.2 }),
  ph("set", { id: "archA", kind: "flowerarch", x: 0, y: 0, z: 1.55, on: 0 }, NIL),
  ...GUESTS.map(([id, side, k, col, dress, color, hat, glasses]) => {
    const [x, z] = SEAT(side, k, col);
    return ph("set", { id: `g${id}`, kind: "weddingguest", x, y: 0, z, size: 1, dress, color, hat, glasses, turn: 0, gasp: 0, cheer: 0, sway: 0.5 }, { ...box(0.56, 0.86, 0.5), x, z });
  }),
  // ---- the hall (T1)
  ph("set", { id: "hall", kind: "ringhall", x: 0, y: 0, z: HZ }, { ...box(2.4, 0.02, 5.2), z: r3(HZ + 2.6) }),
  // ---- hand props + wearables (T2 props-wedding.js)
  ph("props", { id: "rbox", kind: "ringbox", x: 210, y: DOWN, z: 0, lid: 0, rings: 0 }, { ...box(0.18, 0.135, 0.15), x: 210, y: DOWN }),
  ph("props", { id: "rings", kind: "goldring", n: 2, pose: "lean", x: RING_SHELF[0], y: RING_SHELF[1], z: RING_SHELF[2], spin: -1 }, { ...box(0.2, 0.03, 0.1), x: RING_SHELF[0], y: RING_SHELF[1], z: RING_SHELF[2] }),
  ph("props", { id: "ringA", kind: "goldring", x: 0, y: DOWN, z: 0, spin: -1, seed: 0.13 }, NIL),
  ph("props", { id: "ringB", kind: "goldring", x: 0, y: DOWN, z: 0, spin: -1, seed: 0.61 }, NIL),
  ph("props", { id: "ringOn", kind: "goldring", up: true, x: 0.2, y: DOWN, z: -0.3, staged: "slid onto her glove in the close shot" }, NIL),
  ph("props", { id: "tieWorn", kind: "bowtie", wear: "spud", x: 0, y: 0.47, z: 0.335, color: "#201e26" }, NIL),
  ph("props", { id: "tieLoose", kind: "bowtie", x: 0, y: DOWN, z: 0, color: "#201e26" }, NIL),
  ph("props", { id: "pin", kind: "flowerpin", wear: "chip", x: -0.12, y: 0.36, z: 0.25 }, NIL),
  ph("props", { id: "veil", kind: "bridalveil", wear: "mash", x: 0, y: 0, z: 0, swing: 0 }, NIL),
  ph("props", { id: "bq", kind: "bouquet", x: 0, y: DOWN, z: 0 }, NIL),
  // the leaf places itself in world metres relative to its own x, y, z: parked 200 m off until the vanish frame
  ph("props", { id: "leaf", kind: "spudleaf", from: FAR, to: FAR, x: 0, y: 0, z: 0, fall: 0, staged: "a leaf on the air" }, NIL),
];
if (has("set")) { Pk("set", 0, "archA", { on: 0 }); for (const [id] of GUESTS) Pk("set", 0, `g${id}`, { rot: 0, gasp: 0, cheer: 0 }); }
if (has("props")) { P(0, "rbox", { lid: 0, rings: 0 }); P(0, "tieWorn", { scale: 1 }); P(0, "leaf", { fall: 0 }); P(0, "ringA", { spin: 0 }); P(0, "ringB", { spin: 0 }); P(0, "veil", { swing: 0 }); }
// dust rings: one per jump and arrival (DESIGN 5); the fallback is a flat poof
const DUST = [];
const dust = (t, [x, z], leave, floorY = 0, color = "#efe3c6") => {
  if (has("props")) {
    const id = `dr${DUST.length}`; DUST.push(id);
    props.push({ id, kind: "dustring", staged: "dust on the ground", x, y: floorY, z, n: leave ? 14 : 10, r0: leave ? 0.3 : 0.2, r1: leave ? 0.6 : 0.42, s0: leave ? 0.12 : 0.09, s1: leave ? 0.22 : 0.16, a: leave ? 0.7 : 0.5, color, puff: 0 });
    P(t, id, { puff: 0 }); P(r3(t + 0.01), id, { puff: 1 }, leave ? 0.5 : 0.35, "linear");
  } else c.at(r3(t), { fx: "poof", pos: [x, floorY + 0.02, z], dur: 0.45, color, puffs: leave ? 10 : 6, sparks: 0, size: leave ? 0.28 : 0.2, lift: 0.04 });
};
// a jump: two frames of squash, then gone (parked); never a fade, flash or flicker (DESIGN 5)
const jumpOut = (t, who, at, floorY = 0, color, carry) => {
  if (carry && has("props")) A(r3(t - 0.04), who, "release", { prop: carry, to: FAR, dur: 0.01 });   // he takes it with him: off the set for the jump, back in his glove on arrival
  A(r3(t - 0.067), who, "squash", { amount: 0.22, dur: 0.05 });
  place(t, who, [PARK[0] + (who === "bald" ? 4 : 0), PARK[1]], 0);
  A(r3(t), who, "squash", { amount: 0, dur: 0.01 });
  dust(t, at, true, floorY, color);
  sfx(r3(t), "ai/air-push", { gain: 0.5, reason: "the soft push of air where he stood" });
};
const jumpIn = (t, who, at, yaw, floorY = 0, color) => {
  place(t, who, at, yaw);
  A(r3(t), who, "squash", { amount: 0.16, dur: 0.01 }); A(r3(t + 0.02), who, "squash", { amount: 0, dur: 0.2, ease: "out" });
  dust(t, at, false, floorY, color);
  sfx(r3(t), "ai/air-push", { gain: 0.3, reason: "he lands: a softer push of air" });
};
const HALL_DUST = "#f3eada";

// the box in Spud's right glove (toward Chip), lid toward him
const boxIn = (t, who = "spud", side = "R", o = { o: [-0.02, 0.52, 0.3] }) => {
  c.arm(r3(t), who, side, o, 0.01); A(r3(t), who, "grip", { side, shape: "flat", dur: 0.01 });   // the box sits on a flat palm (props-wedding.js: presented)
  A(r3(t + 0.01), who, "grab", { prop: "rbox", hand: side, grip: [0, -0.075, 0], dur: 0, pose: null });
};

// ---------------------------------------------------------------- Mash walks on the clock (story points -> video)
for (let i = 1; i < STEPS.length; i++) {
  const [t0] = STEPS[i - 1], [t1, n1] = STEPS[i];
  A(r3(t0 + O + 0.01), "mash", "move", { to: BRIDE(n1), dur: r3(t1 - t0 - 0.01), steps: 1, ease: "inOut" });   // the counter counts inOut too (shared/sky.js keyed)
}
A(0, "mash", "turn", { to: 0, dur: 0.01 });
// her bouquet in both gloves at her waist, the veil worn
if (has("props")) {
  c.arm(0, "mash", "R", { o: [-0.05, 0.42, 0.24] }, 0.01); c.arm(0, "mash", "L", { o: [-0.05, 0.38, 0.24] }, 0.01);
  A(0.01, "mash", "grab", { prop: "bq", hand: "R", grip: [0, 0.045, 0], dur: 0, pose: null });
}

// ================================================================= OPENER B (story -3.0..0): Spud pops in beside Chip
if (B) {
  place(0, "spud", PARK, 0);
  look(0, "chip", [-0.1, 0.1], 0.01); expr(0, "chip", "kind", null, 0.01);
  jumpIn(0.4, "spud", SPUD, -8);
  expr(0.6, "spud", "cocky", { curve: 0.5 }, 0.15);
  look(0.7, "chip", [0.6, 0.1], 0.15); expr(0.75, "chip", "shocked", { open: 0.15 }, 0.15);
}

// ================================================================= 01-02 THE EMPTY BOX (0-2.8): stake + clock at frame 0
// Frame 0 (panel 01): the altar from in front, Chip left, Spud right with the box in his glove snapping open; Mash small
// under the far arch, walking; the counter 20 top right; NO RINGS over the aisle.
boxIn(O);
Pk("props", O, "rbox", { lid: 0, rings: 0 });
Pk("props", r3(O + 0.15), "rbox", { lid: 1 }, 0.12, "out");
sfx(r3(O + 0.15), "ai/ring-box-snap", { gain: 0.8, reason: "the box snaps open: empty" });
expr(O, "spud", "shocked", { open: 0.3, eye: 1.25, brow: 0.6 }, 0.01); look(O, "spud", [-0.25, -0.45], 0.01);
expr(O, "chip", "shocked", { open: 0.25, eye: 1.2 }, 0.01); look(O, "chip", [0.45, -0.4], 0.01);
look(O + 0.9, "chip", [0.05, 0.2], 0.18);
cap(O, T.two, "NO RINGS", 344);
see(O, T.ins, ["spud.face", "chip.face", "rbox", "mash"], "frame 0: the empty box, both faces, the bride far down the aisle");
// 02 insert (1.3-2.3): the empty velvet slot fills the frame, Chip sweating behind it
see(T.ins, T.two, ["rbox", "chip.face"], "the box is empty");

// ================================================================= 03-04 THE BOW TIE, JUMP 1 (2.3-6.3)
expr(T.tie - 0.3, "spud", "focused", { brow: 0.9, open: 0.02 }, 0.15);
c.arm(T.tie, "spud", "L", { o: [-0.02, 0.62, 0.36] }, 0.3, "inOut");   // left glove to the knot (the box stays in the right)
A(T.tie + 0.3, "spud", "grip", { side: "L", shape: "pinch", dur: 0.1 });
A(r3(T.tie + 0.35), "spud", "face", { lid: 0.9, dur: 0.15 });   // eyes shut, concentrating
c.arm(T.tie + 0.6, "spud", "L", { o: [0.0, 0.6, 0.37] }, 0.15); c.arm(T.tie + 0.85, "spud", "L", { o: [-0.03, 0.61, 0.36] }, 0.15);   // a tug, a tug
look(T.tie, "chip", [0.55, 0.1], 0.15); expr(T.tie, "chip", "kind", { brow: 0.3 }, 0.2);
// the jump: the tie hangs one blink where his collar was, then falls into Chip's open glove
A(r3(T.j1 - 0.6), "chip", "move", { to: CHIP_STEP, dur: 0.4, steps: 1, ease: "inOut" });
c.arm(r3(T.j1 - 0.3), "chip", "L", { o: [0.12, 0.3, 0.26] }, 0.25, "out"); A(r3(T.j1 - 0.3), "chip", "grip", { side: "L", shape: "cup", dur: 0.15 });
jumpOut(T.j1, "spud", SPUD, 0, undefined, "rbox");
if (has("props")) {
  P(r3(T.j1 - 0.01), "tieWorn", { scale: 0.0001 });
  P(T.j1, "tieLoose", { x: TIE_HANG[0], y: TIE_HANG[1], z: TIE_HANG[2], rot: 0 });
  c.throw(r3(T.j1 + 0.1), "tieLoose", { to: [0.06, 0.34, 0.26], in: 0.3, spin: [0, 0, 0.3] });
  A(r3(T.j1 + 0.4), "chip", "grab", { prop: "tieLoose", hand: "L", grip: [0, 0.03, 0], dur: 0.05, pose: null });
  sfx(r3(T.j1 + 0.4), "ai/cloth-catch", { gain: 0.6, reason: "the tie lands in Chip's glove" });
}
expr(r3(T.j1 + 0.15), "chip", "shocked", { open: 0.2, eye: 1.3 }, 0.1); look(r3(T.j1 + 0.4), "chip", [0.3, -0.35], 0.15);
see(T.tie, T.j1, ["spud.face", "chip.face"], "Spud straightens his bow tie, eyes shut");
see(T.j1, T.hall, ["chip.face", "tieLoose"], "Spud is gone, the tie drops into Chip's glove");

// ================================================================= 05-06 HALL: RINGS INTO THE BOX, JUMP 2 (6.3-12.0)
jumpIn(r3(T.hall + 0.1), "spud", SPUD_SHELF, 20, 0, HALL_DUST);
boxIn(r3(T.hall + 0.1));
Pk("props", r3(T.hall + 0.1), "rbox", { lid: 1, rings: 0 });
expr(r3(T.hall + 0.2), "spud", "eager", { curve: 0.4 }, 0.15); look(r3(T.hall + 0.2), "spud", [0.7, -0.35], 0.15);
// left glove takes the pair off the shelf, drops them in the open box
c.arm(T.scoop, "spud", "L", { o: [0.4, 0.6, 0.24] }, 0.35, "inOut"); A(r3(T.scoop + 0.3), "spud", "grip", { side: "L", shape: "pinch", dur: 0.1 });
A(r3(T.scoop + 0.4), "spud", "grab", { prop: "rings", hand: "L", grip: [0, 0.01, 0], dur: 0.05, pose: null });
c.arm(r3(T.scoop + 0.5), "spud", "L", { o: [0.02, 0.6, 0.34] }, 0.4, "inOut");
look(r3(T.scoop + 0.5), "spud", [-0.1, -0.4], 0.2);
A(T.drop, "spud", "release", { prop: "rings", to: FAR, dur: 0.01 });   // the pair goes into the box: shown by the box's rings param
Pk("props", r3(T.drop + 0.01), "rbox", { rings: 2 });
sfx(r3(T.drop + 0.02), "ai/ring-box-snap", { gain: 0.3, reason: "the rings settle in the velvet" });
expr(r3(T.drop + 0.1), "spud", "happy", { curve: 0.7 }, 0.15); look(r3(T.drop + 0.2), "spud", [0, 0.1], 0.15);
// jump 2: the two rings stay where the box held them, hang one blink, fall and spin on the boards
jumpOut(T.j2, "spud", SPUD_SHELF, 0, HALL_DUST, "rbox");
Pk("props", T.j2, "rbox", { rings: 0 });
if (has("props")) {
  P(T.j2, "ringA", { x: 0.37, y: 0.92, z: r3(HZ + 2.12) }); P(T.j2, "ringB", { x: 0.43, y: 0.92, z: r3(HZ + 2.14) });
  c.throw(r3(T.j2 + 0.1), "ringA", { to: RING_A, in: 0.42, spin: [1, 0, 2] });
  c.throw(r3(T.j2 + 0.1), "ringB", { to: RING_B, in: 0.45, spin: [-1, 0, 2] });
  P(r3(T.j2 + 0.52), "ringA", { spin: 0 }); P(r3(T.j2 + 0.53), "ringA", { spin: 2.2 }, 2.2, "linear");
  P(r3(T.j2 + 0.55), "ringB", { spin: 0 }); P(r3(T.j2 + 0.56), "ringB", { spin: 2.2 }, 2.2, "linear");
}
sfx(r3(T.j2 + 0.52), "ai/ring-spin-wood", { gain: 0.8, reason: "ring A hits the boards and spins down" });
sfx(r3(T.j2 + 0.6), "ai/ring-spin-wood", { gain: 0.6, reason: "ring B, a beat later" });
see(T.hall, T.j2, ["spud.face", "rbox"], "the hall: rings on the shelf by the cactus, into the box");
see(T.spin, T.alt2, ["ringA", "ringB"], "the empty hall: the rings spinning on the floor");

// ================================================================= 07-08 THE BOX PRESENTED, "...AGAIN." (12.0-16.6)
jumpIn(T.alt2, "spud", SPUD, -12);
boxIn(T.alt2);
Pk("props", T.alt2, "rbox", { lid: 1, rings: 0 });
A(T.snap, "spud", "grip", { side: "L", shape: "flat", dur: 0.05 }); c.arm(T.snap, "spud", "L", { o: [0.0, 0.62, 0.36] }, 0.12, "out");
Pk("props", r3(T.snap + 0.1), "rbox", { lid: 0 }, 0.08, "in");
sfx(r3(T.snap + 0.18), "ai/ring-box-snap", { gain: 0.7, reason: "he snaps the box shut without looking" });
c.arm(r3(T.snap + 0.25), "spud", "L", "rest", 0.25);
expr(T.alt2, "spud", "cocky", { curve: 0.6 }, 0.15); look(T.alt2, "spud", [-0.6, 0.05], 0.15);
// the flourish: the box on his palm, out to Chip
c.arm(T.pres, "spud", "R", { o: [-0.12, 0.5, 0.42] }, 0.35, "back");
look(T.pres, "chip", [0.35, -0.3], 0.15); expr(T.pres, "chip", "kind", null, 0.15);
// Chip opens the lid with his free right glove (the tie in his left)
c.arm(T.open, "chip", "R", { o: [-0.1, 0.42, 0.34] }, 0.3, "inOut"); A(r3(T.open + 0.25), "chip", "grip", { side: "R", shape: "pinch", dur: 0.08 });
Pk("props", r3(T.open + 0.3), "rbox", { lid: 1 }, 0.15, "out");
sfx(r3(T.open + 0.3), "ai/ring-box-snap", { gain: 0.6, reason: "Chip lifts the lid" });
expr(r3(T.open + 0.5), "chip", "deadpan", { lid: 0.5 }, 0.2); expr(r3(T.open + 0.5), "spud", "shocked", { open: 0.3, eye: 1.3 }, 0.12);
look(r3(T.open + 0.45), "spud", [-0.35, -0.4], 0.12);
// he hands the box over: it is in Chip's right glove now
A(r3(T.open + 0.6), "chip", "grab", { prop: "rbox", hand: "R", grip: [0, -0.075, 0], dur: 0.1, pose: null });
see(T.alt2, T.cu, ["spud.face", "chip.face", "rbox", "mash"], "the box presented, Chip opens it: empty again; the bride much closer");
// 08 Chip into the lens, then the one word
look(T.cu, "chip", [0, 0], 0.15); expr(T.cu, "chip", "deadpan", { lid: 0.55 }, 0.15);
c.arm(T.cu, "chip", "R", { o: [-0.02, 0.36, 0.28] }, 0.2);   // the open empty box at chest height
say(T.again, "chip", "…Again.", 0.9, "deadpan");
see(T.cu, T.two3, ["chip.face", "rbox", "tieLoose"], "Chip looks straight at us: …Again.");

// ================================================================= 09 JUMP 3, THE BOX (16.6-18.8)
c.arm(T.two3, "spud", "R", { o: [-0.12, 0.45, 0.36] }, 0.2);
A(r3(T.grab3 + 0.15), "spud", "grab", { prop: "rbox", hand: "R", grip: [0, -0.075, 0], dur: 0.08, pose: null });
c.arm(r3(T.grab3 + 0.25), "spud", "R", { o: [0.02, 0.55, 0.3] }, 0.2, "out");   // clutched to his chest
Pk("props", r3(T.grab3 + 0.2), "rbox", { lid: 0 }, 0.1);
c.arm(r3(T.grab3 + 0.3), "chip", "R", { o: [0.12, 0.3, 0.26] }, 0.2); A(r3(T.grab3 + 0.3), "chip", "grip", { side: "R", shape: "cup", dur: 0.1 });
expr(T.grab3, "spud", "focused", { brow: 1, open: 0.05 }, 0.1);
jumpOut(T.j3, "spud", SPUD);
if (has("props")) {
  A(r3(T.j3 + 0.01), "spud", "release", { prop: "rbox", dur: 0.01, keep: "air", reason: "the box hangs one blink where he held it" });
  P(r3(T.j3 + 0.02), "rbox", { x: 0.48, y: 0.55, z: 0.42 });
  c.throw(r3(T.j3 + 0.1), "rbox", { to: [-0.05, 0.36, 0.28], in: 0.28, spin: [0, 0, 0] });
  A(r3(T.j3 + 0.38), "chip", "grab", { prop: "rbox", hand: "R", grip: [0, -0.075, 0], dur: 0.05, pose: null });
}
sfx(r3(T.j3 + 0.38), "ai/cloth-catch", { gain: 0.5, reason: "the velvet box lands in Chip's other glove" });
expr(r3(T.j3 + 0.45), "chip", "deadpan", { lid: 0.6 }, 0.2); look(r3(T.j3 + 0.5), "chip", [0.25, -0.35], 0.15);
see(T.two3, T.hall3, ["chip.face", "rbox", "tieLoose", "mash"], "Spud clutches the box and is gone; the box drops into Chip's other glove");

// ================================================================= 10 HALL: THE RULE (18.8-23.4)
jumpIn(T.hall3, "spud", KNEEL, 15, 0, HALL_DUST);
A(r3(T.hall3 + 0.25), "spud", "crouch", { to: 0.55, dur: 0.35, ease: "inOut" });
c.arm(r3(T.hall3 + 0.4), "spud", "R", { o: [-0.05, 0.12, 0.3] }, 0.35, "inOut");
if (has("props")) {
  A(r3(T.hall3 + 0.75), "spud", "grab", { prop: "ringA", hand: "R", grip: [0, 0.01, 0], dur: 0.05, pose: null });
  A(r3(T.hall3 + 0.7), "spud", "grab", { prop: "ringB", hand: "R", grip: [0, 0.01, 0], dur: 0.05, pose: null });
  A(r3(T.hall3 + 0.74), "spud", "release", { prop: "ringB", to: FAR, dur: 0.01 });   // both rings are in his fist now: ring B rides hidden
}
A(r3(T.hall3 + 0.75), "spud", "grip", { side: "R", shape: "fist", dur: 0.08 });
c.arm(r3(T.hall3 + 0.9), "spud", "R", { o: [-0.04, 0.45, 0.3] }, 0.35, "out");
A(r3(T.look1 - 0.3), "spud", "crouch", { to: 0, dur: 0.4, ease: "inOut" });
look(T.look1, "spud", [-0.2, -0.3], 0.2); expr(T.look1, "spud", "focused", { brow: 0.6 }, 0.2);   // at his own glove
look(T.look2, "spud", [0.8, 0.0], 0.25); expr(r3(T.look2 + 0.3), "spud", "cocky", { curve: 0.4 }, 0.2);   // ... at the cactus
see(T.hall3, T.close, ["spud.face"], "he scoops up the rings, stops, looks at his hand, looks at the cactus");

// ================================================================= 11-12 THE CACTUS, THE LEAF (23.4-31.2)
place(T.close, "spud", SPUD_SHELF, 20);
expr(T.close, "spud", "focused", { brow: 0.8 }, 0.01); look(T.close, "spud", [0.85, -0.1], 0.01);
A(T.close, "spud", "grip", { side: "R", shape: "fist", dur: 0.01 }); c.arm(T.close, "spud", "R", { o: [-0.04, 0.45, 0.3] }, 0.01);
A(T.close, "spud", "grip", { side: "L", shape: "point", dur: 0.01 }); c.arm(T.close, "spud", "L", { o: [0.12, 0.62, 0.15] }, 0.01);
for (const tf of [T.flinch1, T.flinch2]) {
  c.arm(r3(tf - 0.8), "spud", "L", { o: [0.32, 0.64, 0.12] }, 0.75, "in");   // the finger creeps toward the spines
  c.arm(tf, "spud", "L", { o: [0.08, 0.62, 0.2] }, 0.1, "out");               // flinch back
  expr(tf, "spud", "terrified", { open: 0.2, eye: 0.6, brow: 0.8 }, 0.05);
  say(r3(tf + 0.05), "spud", "ah!", 0.35, "excited");
  expr(r3(tf + 0.6), "spud", "focused", { brow: 0.8 }, 0.2);
}
for (let t = r3(24 + O); t < 31 + O - 0.2; t = r3(t + 0.5)) sfx(t, "ai/clock-tick", { gain: 0.22, reason: "the clock ticking under the plucked strings" });
see(T.close, T.hallm, ["spud.face"], "rings in his fist, one finger toward the cactus: flinch, again, flinch");
// 12: he scratches his leaf, thinking, and is gone; the leaf drifts down to the shelf beside the cactus
c.arm(T.scratch, "spud", "L", { o: [0.05, 1.0, 0.0] }, 0.3, "inOut"); A(T.scratch, "spud", "grip", { side: "L", shape: "relaxed", dur: 0.1 });
c.arm(r3(T.scratch + 0.35), "spud", "L", { o: [0.08, 1.02, -0.02] }, 0.12); c.arm(r3(T.scratch + 0.5), "spud", "L", { o: [0.03, 1.0, 0.0] }, 0.12);
look(T.scratch, "spud", [0.2, 0.4], 0.2); expr(T.scratch, "spud", "focused", { brow: 0.3 }, 0.2);
jumpOut(T.j4, "spud", SPUD_SHELF, 0, HALL_DUST, "ringA");
if (has("props")) { P(r3(T.j4 - 0.01), "leaf", { from: H(SPUD_SHELF[0], 1.02, 1.8), to: H(1.05, 0.5, 1.97), fall: 0 }); P(r3(T.j4 + 0.1), "leaf", { fall: 1 }, 1.6, "linear"); }
see(T.scratch, T.alt4, ["spud", "leaf"], "he scratches his leaf and vanishes; the leaf drifts down beside the cactus");

// ================================================================= 13 BALD (31.2-37.6)
jumpIn(T.alt4, "bald", SPUD, 0);
A(T.alt4, "bald", "grip", { side: "R", shape: "fist", dur: 0.01 }); c.arm(T.alt4, "bald", "R", { o: [0.14, 0.45, 0.28] }, 0.01);
expr(T.alt4, "bald", "happy", { curve: 0.8 }, 0.15); look(T.alt4, "bald", [-0.6, 0.0], 0.15);
c.arm(T.fist, "bald", "R", { o: [-0.14, 0.5, 0.42] }, 0.3, "back"); A(r3(T.fist + 0.3), "bald", "grip", { side: "R", shape: "flat", dur: 0.1 });
if (has("props")) {
  P(r3(T.fist + 0.29), "rings", { y: DOWN });
  A(r3(T.fist + 0.3), "bald", "grab", { prop: "rings", hand: "R", grip: [0, 0.01, 0], dur: 0.01, pose: null });
}
look(T.fist, "chip", [0.4, -0.25], 0.15); expr(r3(T.fist + 0.4), "chip", "happy", { curve: 0.6 }, 0.2);   // relieved
look(T.stare, "chip", [0.55, 0.45], 0.25); expr(T.stare, "chip", "shocked", { open: 0.15, eye: 1.2 }, 0.2);   // above Spud's eyes
c.arm(T.pat, "bald", "L", { o: [0.04, 0.98, 0.04] }, 0.3, "inOut"); A(T.pat, "bald", "grip", { side: "L", shape: "flat", dur: 0.1 });
c.arm(r3(T.pat + 0.35), "bald", "L", { o: [0.04, 0.95, 0.06] }, 0.1); c.arm(r3(T.pat + 0.5), "bald", "L", { o: [0.04, 0.98, 0.04] }, 0.1);
sfx(r3(T.pat + 0.35), "pat", { gain: 0.25, reason: "his glove pats the bare dome" });
expr(r3(T.pat + 0.3), "bald", "shocked", { open: 0.2, eye: 1.2 }, 0.15); look(r3(T.pat + 0.2), "bald", [0, 0.6], 0.2);
for (const [g, d] of [["gR1a", 0], ["gL1a", 0.12], ["gR1b", 0.2]]) { Pk("set", r3(T.gasp + d - 0.3), g, { rot: g.includes("L") ? -150 : 150 }, 0.35, "inOut"); Pk("set", r3(T.gasp + d), g, { gasp: 1 }, 0.2, "out"); }
sfx(T.gasp, "ai/surface-gasp", { gain: 0.45, reason: "one guest gasps (ai/guest-gasp came out a drone: sound test 01)" });
c.arm(r3(T.gasp + 1.0), "bald", "L", "rest", 0.4); expr(r3(T.gasp + 1.2), "bald", "cocky", { curve: 0.6 }, 0.3);   // proud anyway
see(T.alt4, T.arrive, ["bald.face", "chip.face", "rings", "mash"], "rings in his palm; Chip stares above his eyes; he pats his head: bald; guests turn");

// ================================================================= 14-15 RINGS ON, THE PHOTO (37.6-43.2)
look(T.arrive, "chip", [0.2, 0.2], 0.2); look(T.arrive, "bald", [-0.4, 0.2], 0.2); expr(T.arrive, "mash", "delighted", null, 0.2);
for (const g of ["gR1a", "gL1a", "gR1b"]) { Pk("set", T.arrive, g, { gasp: 0 }); Pk("set", T.arrive, g, { rot: 0 }, 0.4, "inOut"); }
see(T.arrive, T.rings, ["mash.face", "chip.face", "bald.face"], "the bride arrives");
// 14 insert: a gold ring slides onto Mash's raised glove (her bouquet in the other); the givers' gloves are full, so
// the close shot stays on her glove and the ring
c.arm(r3(T.rings - 0.4), "mash", "L", { o: [0.02, 0.5, 0.36] }, 0.35, "inOut"); A(r3(T.rings - 0.4), "mash", "grip", { side: "L", shape: "point", dur: 0.2 });
if (has("props")) { P(T.rings, "ringOn", { x: 0.25, y: 0.77, z: -0.23 }); P(r3(T.rings + 0.3), "ringOn", { z: -0.31 }, 0.7, "inOut"); P(T.photo, "ringOn", { y: DOWN }); }
see(T.rings, T.photo, ["ringOn"], "one close shot of the ring going on");
// 15 the photo: everyone beaming at the lens, under the altar arch
for (const [who, at] of [["chip", PHOTO.chip], ["bald", PHOTO.spud], ["mash", PHOTO.mash]]) { place(T.photo, who, at, 0); expr(T.photo, who, "delighted", { curve: 0.9 }, 0.01); look(T.photo, who, [0, 0], 0.01); }
Pk("set", r3(T.photo - 0.02), "archA", { on: 1 });
c.arm(T.photo, "bald", "L", "up", 0.25); A(T.photo, "bald", "grip", { side: "L", shape: "thumb", dur: 0.1 });
c.arm(T.photo, "bald", "R", "up", 0.25); A(T.photo, "bald", "grip", { side: "R", shape: "thumb", dur: 0.1 });
for (const [id] of GUESTS) { Pk("set", T.photo, `g${id}`, { rot: 0, gasp: 0, cheer: 1 }); }
c.at(T.flash, { fx: "flash", dur: 0.2, peak: 0.8, color: "#ffffff" });
sfx(T.flash, "ai/camera-shutter", { gain: 0.8, reason: "the wedding photo" });
see(T.photo, T.shelf, ["chip.face", "bald.face", "mash.face", "rbox", "tieLoose"], "the photo: Chip holding tie + empty box, Spud bald and proud");

// ================================================================= 16 THE LEAF ON THE SHELF (43.2-46.5)
see(T.shelf, END, ["leaf"], "the leaf beside the cactus, under the old photo of Spud with his leaf");

// ---------------------------------------------------------------- shots
const SH = {   // camfit 13 Nov on stand-ins (NOTES.md)
  hookB:  { pos: [-0.35, 0.8, 4.6], look: [0.1, 0.82, -4], fov: 40 },
  wide:   { pos: [-0.35, 0.8, 4.6], look: [0.1, 0.82, -4], fov: 40 },
  ins:    { pos: [0.09, 1.08, 0.78], look: [0.09, 0.66, 0.24], fov: 36 },
  two:    { pos: [-0.2, 0.78, 3.7], look: [0.12, 0.74, -2], fov: 38 },
  bald:   { pos: [0.1, 0.95, 3.7], look: [0.05, 0.8, -2], fov: 38 },
  arrive: { pos: [0.05, 1.05, 3.6], look: [0.02, 0.85, -1], fov: 38 },
  hall:   { pos: [-0.6, 1.05, r3(HZ + 5.4)], look: [0.5, 0.62, r3(HZ + 1.7)], fov: 46 },
  floor:  { pos: [-0.25, 1.15, r3(HZ + 4.4)], look: [0.38, 0.15, r3(HZ + 2.0)], fov: 44 },
  cu:     { pos: [-0.2, 0.5, 2.4], look: [-0.2, 0.52, 0], fov: 34 },
  cactus: { pos: [-0.1, 0.9, r3(HZ + 4.4)], look: [0.7, 0.66, r3(HZ + 1.75)], fov: 40 },
  rings:  { pos: [0.0, 0.9, 0.3], look: [0.25, 0.76, -0.3], fov: 26 },
  photo:  { pos: [0, 1.35, 6.6], look: [0, 0.85, 1.9], fov: 40 },
  shelf:  { pos: [0.35, 0.85, r3(HZ + 3.1)], look: [1.07, 0.6, r3(HZ + 2.0)], fov: 40 },
};
const CUTS = [
  ...(B ? [["00 Spud pops in", 0, SH.hookB, "hook"]] : []),
  ["01 the empty box", O, SH.wide, B ? undefined : "hook"],
  ["02 insert: empty", T.ins, SH.ins],
  ["03 the bow tie", T.two, SH.two],
  ["05 hall: rings into the box", T.hall, SH.hall],
  ["06 the rings spin", T.spin, SH.floor],
  ["07 the box presented", T.alt2, SH.two],
  ["08 ...Again.", T.cu, SH.cu, "reaction"],
  ["09 the box stays", T.two3, SH.two],
  ["10 hall: the rule", T.hall3, SH.hall],
  ["11 the cactus", T.close, SH.cactus],
  ["12 the leaf", T.hallm, SH.hall],
  ["13 bald", T.alt4, SH.bald, "payoff"],
  ["13b the bride arrives", T.arrive, SH.arrive],
  ["14 rings on", T.rings, SH.rings],
  ["15 the photo", T.photo, SH.photo],
  ["16 the leaf on the shelf", T.shelf, SH.shelf],
].map((r) => r.filter((x) => x !== undefined));

// ---------------------------------------------------------------- the narrator (voice 1, deep storyteller), in the gaps
const NG = 4.0;
const NARR = !VO ? [] : [
  ...(B ? [[0.6, "What if you could teleport?", 2.0]] : []),
  [r3(O + 0.15), "No rings. She's twenty steps away.", 2.6, 455],   // under NO RINGS
  [r3(O + 2.9), "You can teleport. Every jump keeps one thing.", 3.3],
  [r3(T.j3 + 0.3), "It keeps the last thing you touch.", 3.0],
  [r3(T.j3 + 3.45), "So touch something else.", 1.8],
  [r3(T.shelf + 0.4), "Would you still jump?", 1.6],
];
for (const [t, line, dur, pos] of NARR) c.at(r3(t), { macro: "narrate", line, voice: "narrator", take: 1, dur, caption: true, pos: pos ?? SUBY, gain: NG });

const beats = c.beats(CUTS, END);
for (const cp of c.captions) if (cp.text === "NO RINGS") cp.to = r3(Math.min(cp.to, T.ins - 0.03));

const POP = (who, prop, t) => ({ who, with: prop, from: r3(t - 0.05), to: r3(t + 0.08), checks: ["prop-pop"], reason: "a teleport: he and what he holds vanish (or land) in one frame" });
const allowClip = [
  // rough draft only (workflow rule 5, two rounds done): fixed in the polish
  { who: "bald", with: "chip", from: r3(T.alt4 - 0.03), to: r3(T.alt4 + 0.06), reason: "ROUGH DRAFT: his arrival frame grazes Chip's hood 3 cm" },
  { who: "spud", with: "hall", from: r3(T.scoop + 0.15), to: r3(T.scoop + 0.45), reason: "ROUGH DRAFT: his sleeve brushes the shelf edge reaching for the rings" },
  POP("spud", "rbox", T.j1), POP("spud", "rbox", T.hall + 0.1), POP("spud", "rbox", T.j2), POP("spud", "rbox", T.alt2),
  { who: "spud", with: "rbox", from: 0, to: T.j3 + 0.1, reason: "the ring box in his glove" },
  { who: "chip", with: "rbox", from: T.open, to: END, reason: "the ring box in his glove" },
  { who: "chip", with: "tieLoose", from: T.j1, to: END, reason: "the bow tie in his glove" },
  { who: "spud", with: "tieWorn", from: 0, to: T.j1, reason: "the bow tie worn at his collar" },
  { who: "spud", with: "rings", from: T.scoop, to: T.j2 + 0.1, reason: "the rings in his glove, then into the box" },
  { who: "spud", from: r3(T.close - 0.05), to: r3(T.close + 0.12), checks: ["rig-jump"], reason: "the cut to the cactus close: his new pose starts on the cut" },
  { who: "spud", with: "ringA", from: T.hall3, to: T.j4, reason: "the rings in his fist" },
  { who: "bald", with: "rings", from: T.fist, to: END, reason: "the rings in his palm" },
  { who: "mash", with: "ringOn", from: T.rings, to: T.photo, reason: "the ring slides onto her finger" },
  { who: "mash", with: "bq", from: 0, to: END, reason: "her bouquet in her gloves" },
  { who: "mash", with: "veil", from: 0, to: END, reason: "her veil, worn" },
  { who: "chip", with: "pin", from: 0, to: END, reason: "the flower pinned on his hoodie" },
];

const ID = `teleport-rings${B ? "-b" : ""}${VO ? "" : "-no-vo"}`;
write(import.meta.url, {
  id: ID,
  title: "What if you could teleport? There's a catch",
  idea: "There's a catch, episode 9: the best man can teleport home for the forgotten rings, but every jump leaves behind the last thing he touched (his bow tie, the rings, the box, his leaf); the bride is twenty steps away",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic", captionBand: [342, 640],
  castLook: LOOK, cleanStart: true,
  motion: MOTION, rig: RIG, physics: PHYSICS, animeTiming: ANIME_TIMING, loopIdle: false,
  // the set block T1 asks for (props-wedding-set.js header): golden light, key from the front left, no window panes
  set: { type: "plain", color: "#a9d6f0", floor: "#8fc65a", light: "golden", key: [-5, 7, 5], windows: false, focus: false, para: 0, bloom: "emissive", aperture: 0,
    lighting: LIGHTING, hatch: HATCH, cel: CEL, ink: true, satsuei: true },
  ...(has("hud") && { hud: { ...hud({ show: [0, r3(T.flash)] }), steps: { keys: stepKeys, pulse: [r3(24 + O), r3(31 + O)] } } }),
  // a string quartet from 0.0 that turns nervous at the jump, holds its breath at the bald reveal and resolves on the
  // photo (STORY.md); recorded-sounding strings, never a synth bed (Jonny 12 Nov)
  music: has("sound") ? { file: process.env.MUSIC ?? `ai/wedding-score/wedding-score-${B ? "b" : "a"}.ogg`, gain: 0.45, lowCut: 90, dip: false, lock: false, duck: { voice: -6 } } : { style: "warm", lowCut: 150, gain: 0.3 },
  sound: { signature: false, sfx: 0.65, ambience: 0.06, surface: "grass", room: "open", guard: true },
  hook: { show: ["spud", "chip", "rbox", "mash"], hint: 0, what: "a garden wedding: the best man snaps the ring box open, it is empty, the bride is far down the aisle walking toward them" },
  panels: { md: "storyboards/series/what-if/09-teleport-rings/PANELS.md" },
  cast, props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  allowClip,
  notes: "Generated by storyboards/series/what-if/09-teleport-rings/make-teleport-rings.mjs.",
});
