// Ancient aliens EP02 "Who really built Stonehenge?", BLOCK D (story 2:36-3:28, panels 37-48, sheet 4): clue 5 the old
// story, the low, the sunset, the landing, "Case closed", the tag. One of four blocks built at the same time from the kit
// (../kit/BLOCKS.md, ../kit/sh-kit.mjs); the join lays one film. Notes: NOTES.md next to this file.
//   node storyboards/series/ancient-aliens/02-stonehenge/block-d/make-aa02-block-d.mjs           (wide: the master)
//   node storyboards/series/ancient-aliens/02-stonehenge/block-d/make-aa02-block-d.mjs --tall    (after Jonny's OK on the wide animatic)
//
// THE BRIEF (STORY.md rows 2:36-3:28)
//   Joke:        the deadpan believer closes the case: the 30 m ring is a parking space for the 30 m ring ship.
//   Wants:       Spud wants proof before the sun touches the tallest stone.
//   Consequence: at sunset the ship comes down the sun line and parks on the ring; "Case closed."
//   Ending:      behind him twenty Stone Age workers drag a stone past on a sledge (the real answer): "...Nobody saw that."
//
// Story chain (cause and effect): even 900 years ago people said giants built it, and the oldest picture shows a giant
// setting a top stone, so we cut to the alien lifter doing exactly that; but five clues are still no proof and the sun is
// almost down, so Spud waits at the tallest stone; the sun touches it, he lays his palm on the Altar Stone, so the same
// frame is 2500 BC: the sun in the slit, the shaft down the line, so the ring ship comes down that line and parks on the
// ring; so "It's a parking space. Case closed."; but behind him humans drag a stone, so he hides them with his body.
//
// TWO LIGHTS = TWO STORYBOARDS: "sun" (SH_D, 0-31 s = story 2:36-3:07) and "dusk" (SH_DUSK, 31-52 s = 3:07-3:28), hard
// cut on the change of place (the ship over the slit, then the ship settling seen from the Avenue).
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { FRAME, SH_D, SH_DUSK, sunAt, CAST, shot, plain, today, past, sheep, liftStone, ringShip, RING_SHIP, stoneAt, page, haul, host, hostSay, clueTag, sunsetClock, count, score, hookOf, lampClip, PLACE } from "../kit/sh-kit.mjs";
import LEN from "./lines.json" with { type: "json" };
import { LINES, TONES } from "./lines.mjs";

const TALL = process.argv.includes("--tall");
const T0 = 156, SPLIT = 31.0, END = 52.0;   // block times; story time = 156 + t
const MOTION = { feet: 2, overlap: true, timing: true, solve: true }, RIG = { hand: 2, eyes: 2, hold: 2 };
const who = (id, character, o, x, z, face, extra = {}) => ({ id, character, at: [r3(o[0] + x), r3(o[1] + z)], face, expr: "kind", follow: 0.2, seed: 2.1, ...extra });
const at = (pos, look, fov) => ({ pos, look, fov });
// a camera pair relative to a place; a move = { ...A, to: B, dur }
const mv = (F, o, a, b, dur, ease = "inOut") => { const A = shot(F, o, a), B = shot(F, o, b); return { ...A, to: { pos: B.pos, look: B.look, fov: B.fov }, dur, ease }; };
const STYLE = { look: "anime-pro", castLook: "sheet", profile: "short", loop: false, fps: 30, cleanStart: true, motion: MOTION, rig: RIG, physics: false, animeTiming: true };
const setOf = (L) => ({ ...L, aperture: 0, focus: false, bloom: "emissive", hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true });

// ================================================================ the "sun" storyboard: 2:36-3:07 (SH_D)
function buildSun(F) {
  const H = hookOf(F, "d"), c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
  const say = (t, k, o = {}) => hostSay(c, F, t, o.who, LINES[k], LEN[k], TONES[k] ?? "calm", o);
  const O = PLACE;
  // ---- times (block time, + H in the tall cut)
  const T = { page1: 0, ago: 0.35, page2: 5.0, giants: 5.15, page2b: 8.0, page3: 10.8, picture: 11.0, match: 12.6, clack: 14.45,
    low: 15.0, lowL: 15.45, altar: 21.0, crouch: 22.3, palm: 22.75, past: 24.0, shaft: 24.15, ship: 27.0, end: SPLIT };
  for (const k in T) T[k] = r3(T[k] + H);
  // ---- places
  const P = { page: O(7), match: O(1), low: O(2), altar: O(3), slit: O(4), come: O(5), hook: O(6) };
  // MATCH (panel 40): 2500 BC, the ring finished but top stone 1 (on uprights 1 and 2) still hangs in the beam; the lifter
  // stands in front of the gap with both gloves up, Spud beside him (where the little wizard stood in the drawing).
  const LA = 12 * Math.PI / 180, LIN = [r3(P.match[0] - 15.5 * Math.sin(LA)), r3(P.match[1] + 15.5 * Math.cos(LA))];
  const tan = [-Math.cos(LA), -Math.sin(LA)], out = [-Math.sin(LA), Math.cos(LA)];
  const onRing = (r, s) => [r3(-r * Math.sin(LA) + s * tan[0]), r3(r * Math.cos(LA) + s * tan[1])];   // r out from the centre, s along the ring (+ = screen left)
  const LIFT = onRing(19.3, 0), SPM = onRing(19.6, 1.4);
  // LOW (panel 41): today, Spud sits on a fallen stone inside the ruin, the sheep lies beside him; the sun low, left of Stone 56
  const SEAT = [-1.9, 4.6], SEAT_TOP = 0.42;
  // ALTAR (panels 42-43): he crouches at the east end of the Altar Stone, palm on its top; Stone 56 behind, the sun at its left edge
  const ALT = [2.0, -3.3];
  const cast = [
    who("liftM", CAST.lifter, P.match, LIFT[0], LIFT[1], -12),
    who("spudM", CAST.spud, P.match, SPM[0], SPM[1], -18),
    who("spudL", CAST.spud, P.low, SEAT[0], SEAT[1], 10),
    who("spudA", CAST.spud, P.altar, ALT[0], ALT[1], 160),
    who("spudP", CAST.spud, P.slit, ALT[0], ALT[1], 160),
    ...(H ? [who("spudH", CAST.spud, P.hook, -0.9, 118, 0)] : []),
  ];
  const lin = liftStone("lm", [LIN[0], LIN[1]], { piece: "toplintel", yaw: 168, h: 1.3, beam: 0.6 });
  const props = [
    // PARCHMENT: three pages on one desk row, 10 m apart; the camera looks straight down
    ...page("g1", P.page, 1), ...page("g2", [P.page[0] + 10, P.page[1]], 2), ...page("g3", [P.page[0] + 20, P.page[1]], 3),
    // MATCH: 2500 BC under the low red sun (light of the cut it follows: SH_D)
    ...past("m", P.match, { T: 168, gap: [1] }), ...lin, host("spudM"),
    // LOW: today's ruin at 2:51, the seat stone, the sheep
    ...today("l", P.low, { T: 171 }), { id: "seatL", kind: "fallensarsen", x: P.low[0] + SEAT[0], z: P.low[1] + SEAT[1] - 0.05, rot: 8, size: [2.0, 1.1, 0.52], sink: 0.2, pieces: 1, seed: 5 },
    sheep("sheepL", P.low[0] + SEAT[0] - 1.25, P.low[1] + SEAT[1] + 0.35, 25, { lie: 1, chew: 0.5, grass: true }), host("spudL"),
    // ALTAR today at 2:57 and 2500 BC at 3:00, the same frame
    ...today("a", P.altar, { T: 177 }), host("spudA"),
    ...past("s", P.slit, { T: 180 }), { id: "shaftS", kind: "sunshaft", x: P.slit[0], z: P.slit[1], show: 0 }, host("spudP"),
    // THE SHIP COMES DOWN THE SUN LINE (panel 44), 3:03
    ...past("c", P.come, { T: 183 }), ...ringShip("rc", P.come, { hover: 120, lit: 0.5 }),
    // the tall part's hook: today, the red sun a finger from the tallest stone, Spud small in front
    ...(H ? [...today("h", P.hook, { T: 153 }), host("spudH")] : []),
  ];
  // each actor is shown only in its own shots (the checks then never project a body from another place)
  const only = (id, t0, t1) => { if (t0 > 0) { A(0, id, "hide"); A(t0, id, "show"); } if (t1 < T.end) A(t1, id, "hide"); };
  only("liftM", T.match, T.low); only("spudM", T.match, T.low); only("spudL", T.low, T.altar); only("spudA", T.altar, T.past); only("spudP", T.past, T.ship);
  if (H) only("spudH", 0, H);
  // seeds (params with no default start at 0)
  c.prop(0, "lm-ship", { beam: 0.6, wobble: 0.3 }, 0); c.prop(0, "rc-ship", { beam: 0, wobble: 0.25 }, 0);
  c.prop(0, "shaftS", { show: 0 }, 0);

  // ================================================================ the tall hook (3.0 s, part 4 only)
  if (H) {
    hostSay(c, F, 0.05, "spudH", LINES.hook, LEN.hook, "calm", { hold: 0.05 });
    sfx(0, "ai/storm-wind", { gain: 0.06, dur: H, reason: "far wind over the plain" });
    A(0, "spudH", "look", { to: [0, 0], dur: 0.01 });
  }

  // ================================================================ 1 CLUE 5, THE OLD STORY (2:36, panels 37-39)
  // Start on the evidence: the medieval page fills the frame and the year counts back from today to the book; then the
  // giants wade the sea (the camera follows them along the drawing); then the oldest picture: the giant sets the top stone,
  // the little wizard points up, and the SAME pose cuts to 2500 BC.
  say(T.ago, "ago", { who: "spudM", hold: 0.3 });
  count(c, F, r3(T.page1 + 1.2), r3(T.page1 + 3.4), r3(T.page2 - 0.05), 2026, 1136, (v) => String(Math.round(v)));
  sfx(T.page1, "ai/storm-wind", { gain: 0.04, dur: 4.9, reason: "a quiet room, far wind outside" });
  sfx(T.page2, "kenney/book-flip", { gain: 0.3, reason: "the next page of the manuscript" });
  clueTag(c, F, T.page2, T.low, 5);
  say(T.giants, "giants", { who: "spudM", hold: 0.3 });
  sfx(T.page3, "kenney/book-flip", { gain: 0.25, reason: "the page with the oldest picture" });
  say(T.picture, "picture", { who: "spudM", hold: 0.35 });
  see(T.page1, T.page2, ["g1-page"], "the manuscript page, the ring of stones and the giant");
  see(T.page2, T.page3, ["g2-page"], "the giants wade the sea with the stones");
  see(T.page3, T.match, ["g3-page"], "the giant sets the top stone, the little wizard points up");

  // MATCH CUT (panel 40): the lifter in the giant's pose, gloves up under the top stone in the beam; it settles on its two
  // knobs (clack); Spud beside him looks at us: there is your giant.
  for (const s of ["R", "L"]) { c.arm(0, "liftM", s, "up", 0.01); A(0, "liftM", "grip", { side: s, shape: "flat", dur: 0.01 }); }
  A(0, "liftM", "look", { to: [0, 0.8], dur: 0.01 });
  c.prop(T.match, `lm-stone`, { y: 4.1 }, r3(T.clack - T.match), "inOut");
  sfx(T.match, "kenney/space-engine-low", { gain: 0.22, dur: 2.4, reason: "the ship's low hum high over the ring" });
  sfx(T.clack, "kenney/impact-mining", { gain: 0.55, reason: "stone on stone: the holes drop over the knobs" });
  sfx(r3(T.clack + 0.02), "thud", { gain: 0.45, reason: "the weight of the top stone settling" });
  c.prop(r3(T.clack + 0.1), "lm-ship", { beam: 0 }, 0.6);
  A(T.match, "spudM", "look", { to: [0, 0], dur: 0.01 });
  A(r3(T.match + 0.3), "spudM", "face", { brow: 0.35, dur: 0.3 });
  A(r3(T.clack + 0.05), "spudM", "expr", { expr: "deadpan", dur: 0.25 });
  c.arm(r3(T.clack + 0.1), "liftM", "R", "rest", 0.75); c.arm(r3(T.clack + 0.15), "liftM", "L", "rest", 0.75);
  A(r3(T.low - 0.3), "spudM", "noblink", { dur: 0.3 });
  see(T.match, T.low, ["liftM.face", "lm-stone", "spudM.face"], "the lifter's raised gloves under the top stone, Spud beside him");

  // ================================================================ 2 THE LOW (2:51, panel 41): one long quiet shot
  // He sits on a fallen stone, shoulders low, the sheep lies beside him chewing; the sun sinks toward the tallest stone;
  // the countdown is the only text that moves.
  A(0, "spudL", "sit", { seat: "seatL", height: SEAT_TOP, dur: 0.01, hands: "lap" });
  A(0, "spudL", "look", { to: [0.15, -0.35], dur: 0.01 });
  A(T.low, "spudL", "expr", { expr: "sad", dur: 0.01 });
  say(T.lowL, "low", { who: "spudL", hold: 0.3 });
  A(r3(T.low + 2.6), "spudL", "pitch", { to: 6, dur: 0.8 });
  c.prop(r3(T.low + 3.2), "sheepL", { ears: 1 }, 0.25); c.prop(r3(T.low + 3.45), "sheepL", { ears: 0 }, 0.25);
  c.prop(r3(T.low + 4.4), "sheepL", { headY: -0.5 }, 0.6);
  sfx(T.low, "ai/storm-wind", { gain: 0.06, dur: 9.0, reason: "far wind over the plain at sunset" });
  sfx(r3(T.low + 4.1), "ai/raven-caw", { gain: 0.12, reason: "a far crow on the plain" });
  A(r3(T.altar - 0.3), "spudL", "noblink", { dur: 0.3 });
  see(T.low, T.altar, ["spudL.face", "sheepL", "l-stones"], "Spud on the fallen stone, the sheep, the sun low beside the tallest stone");

  // ================================================================ 3 SUNSET (2:57-3:03, panels 42-43)
  // No voice, no music: 0:03, 0:02, 0:01. He crouches at the Altar Stone and lays his palm on it as the sun touches the
  // tallest stone; SAME frame: 2500 BC, the sun exactly in the slit, and the red shaft runs down the line toward us.
  A(T.altar, "spudA", "look", { to: [-0.35, 0.45], dur: 0.01 });
  A(T.crouch, "spudA", "crouch", { to: 0.55, dur: 0.4 });
  c.arm(r3(T.palm - 0.15), "spudA", "R", { o: [0.05, 0.25, 0.5] }, 0.5, "out");
  A(T.palm, "spudA", "grip", { side: "R", shape: "flat", dur: 0.3 });
  sfx(r3(T.palm + 0.33), "pat", { gain: 0.35, reason: "his palm on cold stone" });
  sfx(T.altar, "ai/storm-wind", { gain: 0.06, dur: 3.0, reason: "only the wind under the last seconds" });
  A(r3(T.past - 0.3), "spudA", "noblink", { dur: 0.3 });
  see(T.altar, T.past, ["spudA", "a-stones"], "the sun at the tallest stone, his palm on the slab at its foot");
  // 2500 BC: the same pose on the Altar Stone (its top 0.3 m higher than today's buried one: less crouch)
  A(0, "spudP", "crouch", { to: 0.3, dur: 0.01 });
  c.arm(0, "spudP", "R", { o: [0.05, 0.5, 0.5] }, 0.01); A(0, "spudP", "grip", { side: "R", shape: "flat", dur: 0.01 });
  A(0, "spudP", "look", { to: [-0.35, 0.45], dur: 0.01 });
  c.prop(T.shaft, "shaftS", { show: 1 }, 1.6, "out");
  A(r3(T.past + 0.5), "spudP", "expr", { expr: "shocked", dur: 0.2 });
  A(r3(T.past + 0.5), "spudP", "look", { to: [-0.5, 0.6], dur: 0.25 });
  A(r3(T.past + 1.7), "spudP", "look", { to: [-0.6, -0.1], dur: 0.6 });
  sfx(T.past, "ai/storm-wind", { gain: 0.05, dur: 3.0, reason: "the plain in 2500 BC" });
  A(r3(T.ship - 0.3), "spudP", "noblink", { dur: 0.3 });
  see(T.past, T.ship, ["spudP", "shaftS", "s-stones"], "the sun in the slit, the shaft running out along the line");

  // ================================================================ 4 THE SHIP COMES DOWN THE SUN LINE (3:03, panel 44)
  // Very wide from the Avenue side, up high: the monument, the red sliver of sun behind it; the ring ship comes out of the
  // sunset, low and slow, straight down the line, and stops right over the circle.
  const SH0 = { x: P.come[0] - 30, y: 70, z: P.come[1] - 330 }, SH1 = { x: P.come[0], y: 24, z: P.come[1] };
  c.prop(0, "rc-ship", SH0, 0);
  c.prop(T.ship, "rc-ship", SH1, r3(T.end - T.ship + 0.4), "out");
  sfx(T.ship, "kenney/space-engine-low", { gain: 0.35, dur: 4.0, reason: "a deep hum grows as the ring comes near" });
  sfx(r3(T.ship + 1.5), "rumble", { gain: 0.25, dur: 2.5, reason: "the air shakes under it" });
  see(T.ship, T.end, ["rc-ship", "c-stones"], "the ring ship coming down the sun line toward the circle");

  // ---- the countdown, top right; a big countdown in the tall hook
  if (H) {
    for (const [a, b, s] of [[0, 1.0, "0:27"], [1.0, 2.0, "0:26"], [2.0, 2.8, "0:25"]]) cap(a, b, `SUNSET ${s}`, F.NUM, false, { size: 96, kinetic: false });
    sunsetClock(c, F, T0 - H, 2.8, T.end);
  } else sunsetClock(c, F, T0, 0, T.end);

  // ---- shots (wide frames; tall pairs after Jonny's OK on the wide animatic)
  const PG = (dx, pos, look, fov) => at([pos[0] + dx, pos[1], pos[2]], [look[0] + dx, look[1], look[2]], fov);
  const V = {
    p1a: { wide: PG(0, [0, 1.95, 0.03], [0, 0, 0], 22), tall: PG(0, [0, 2.4, 0.03], [0, 0, 0], 25) },
    p1b: { wide: PG(0, [0.04, 1.65, -0.02], [0.04, 0, -0.05], 22), tall: PG(0, [0, 2.1, 0.03], [0, 0, 0], 25) },
    p2a: { wide: PG(10, [-0.12, 1.25, 0.06], [-0.12, 0, 0.03], 22), tall: PG(10, [-0.1, 1.6, 0.03], [-0.1, 0, 0], 25) },
    p2b: { wide: PG(10, [0.1, 1.15, 0.06], [0.1, 0, 0.03], 22), tall: PG(10, [0.1, 1.5, 0.03], [0.1, 0, 0], 25) },
    p2c: { wide: PG(10, [0.02, 0.9, -0.05], [0.02, 0, -0.08], 22), tall: PG(10, [0, 1.2, 0.03], [0, 0, 0], 25) },
    p2d: { wide: PG(10, [0.05, 0.8, -0.06], [0.05, 0, -0.09], 22), tall: PG(10, [0, 1.1, 0.03], [0, 0, 0], 25) },
    p3a: { wide: PG(20, [0, 1.45, 0.05], [0, 0, 0.02], 22), tall: PG(20, [-0.05, 1.9, 0.03], [-0.05, 0, 0], 25) },
    p3b: { wide: PG(20, [0.02, 1.2, 0.05], [0.02, 0, 0.02], 22), tall: PG(20, [-0.04, 1.7, 0.03], [-0.04, 0, 0], 25) },
    ma: { wide: at([onRing(24.8, 0.6)[0], 0.85, onRing(24.8, 0.6)[1]], [onRing(17.5, 0.4)[0], 2.3, onRing(17.5, 0.4)[1]], 44), tall: at([onRing(25.6, 0.6)[0], 0.85, onRing(25.6, 0.6)[1]], [onRing(17.5, 0.4)[0], 2.8, onRing(17.5, 0.4)[1]], 62) },
    mb: { wide: at([onRing(24.4, 0.6)[0], 0.85, onRing(24.4, 0.6)[1]], [onRing(17.5, 0.4)[0], 2.35, onRing(17.5, 0.4)[1]], 43), tall: at([onRing(25.2, 0.6)[0], 0.85, onRing(25.2, 0.6)[1]], [onRing(17.5, 0.4)[0], 2.85, onRing(17.5, 0.4)[1]], 61) },
    la: { wide: at([0.2, 1.5, 12.0], [-0.6, 1.75, -6.3], 34), tall: at([-0.6, 1.5, 11.2], [-2.5, 2.2, -6.3], 60) },
    lb: { wide: at([0.2, 1.48, 11.2], [-0.6, 1.72, -6.3], 33), tall: at([-0.6, 1.48, 10.6], [-2.5, 2.15, -6.3], 59) },
    aa: { wide: at([0.15, 3.0, 4.0], [0.5, 1.3, -8], 40), tall: at([0.15, 3.0, 5.2], [0.5, 2.3, -8], 62) },
    ab: { wide: at([0.15, 3.0, 3.6], [0.5, 1.3, -8], 40), tall: at([0.15, 3.0, 4.8], [0.5, 2.3, -8], 62) },
    ca: { wide: at([12, 17, 118], [-3, 9, -40], 34), tall: at([9, 17, 118], [-3, 14, -40], 50) },
    cb: { wide: at([10, 15, 104], [-2, 10, -30], 34), tall: at([8, 15, 104], [-2, 14, -30], 50) },
  };
  const shots = [
    ["the manuscript", T.page1, mv(F, P.page, V.p1a, V.p1b, 5.0), "hook"],
    ["giants over the sea", T.page2, mv(F, P.page, V.p2a, V.p2b, 3.0)],
    ["the stones they carry", T.page2b, mv(F, P.page, V.p2c, V.p2d, 2.8)],
    ["the oldest picture", T.page3, mv(F, P.page, V.p3a, V.p3b, 1.8)],
    ["the lifter in the same pose", T.match, mv(F, P.match, V.ma, V.mb, 2.4), "reveal"],
    ["the low", T.low, mv(F, P.low, V.la, V.lb, 6.0)],
    ["sunset", T.altar, mv(F, P.altar, V.aa, V.ab, 3.0)],
    ["the sun in the slit", T.past, mv(F, P.slit, V.ab, { wide: at([0.15, 3.05, 3.2], [0.5, 1.35, -8], 40), tall: at([0.15, 3.05, 4.4], [0.5, 2.35, -8], 62) }, 3.0)],
    ["down the sun line", T.ship, mv(F, P.come, V.ca, V.cb, r3(T.end - T.ship))],
  ];
  if (H) shots.unshift(["hook: wait for the sunset", 0, mv(F, P.hook, { wide: at([0, 1.6, 150], [0, 3.6, -6.3], 5.6), tall: at([0, 1.6, 150], [-6.5, 4.6, -6.3], 14) }, { wide: at([0, 1.6, 146], [0, 3.6, -6.3], 5.4), tall: at([0, 1.6, 150], [-6.5, 4.6, -6.3], 13.4) }, H), "hook"]);
  const spuds = cast.filter((a) => a.character === CAST.spud).map((a) => a.id);
  return {
    set: setOf(SH_D), music: H ? score(0, { file: "ancient-aliens/aa02-part-d.ogg" }) : score(T0),
    captionBand: F.key === "wide" ? [30, 420] : [200, 760],
    hook: { show: H ? ["spudH"] : ["g1-page"], hint: 0, what: H ? "part 4 hook: the sun a finger from the tallest stone, the countdown big" : "block D opens mid-film on a hard cut: the medieval page" },
    creative: { length: [T.end, T.end] },
    cast, props, captions: c.captions, beats: c.beats(shots, T.end), visible: c.visible,
    allowClip: [
      ...lampClip(spuds, T.end),
      { who: "spudL", with: "seatL", from: 0, to: T.end, reason: "he sits on the fallen stone (panel 41)" },
      { who: "spudA", with: "a-stones", from: T.palm, to: T.past, checks: ["hand-in-prop", "arm-in-prop"], reason: "his palm lies flat on the Altar Stone (panel 42)" },
      { who: "spudP", with: "s-stones", from: 0, to: T.end, checks: ["hand-in-prop", "arm-in-prop"], reason: "his palm lies flat on the Altar Stone (panel 43)" },
    ],
    end: T.end,
  };
}

// ================================================================ the "dusk" storyboard: 3:07-3:28 (SH_DUSK)
function buildDusk(F) {
  const H = hookOf(F, "d"), c = clip({ faces: "strong" }), { A, sfx, cap, see } = c;
  const say = (t, k, o = {}) => hostSay(c, F, t, o.who, LINES[k], LEN[k], TONES[k] ?? "calm", o);
  const O = PLACE, D = SPLIT;   // block time of this storyboard's frame 0
  const T = { settle: 0, clunk: 34.5 - D, crew: 35.0 - D, across: 35.3 - D, point: 38.0 - D, parking: 40.6 - D, pcap: 41.55 - D, closedS: 42.4 - D,
    closed: 42.55 - D, tag: 44.6 - D, sees: 46.3 - D, back: 47.6 - D, walk: 48.3 - D, nobody: 49.4 - D, end: END - D };
  for (const k in T) T[k] = r3(T[k]);
  const P = { park: O(0), tag: O(1) };
  const SPK = [-1.2, 58.5], HULL = RING_SHIP.y + 1.8 * RING_SHIP.s, HR = 11.7 * RING_SHIP.s;   // the hull's top: y 8.24 at r 12.9
  const onHull = (deg) => [r3(-HR * Math.sin(deg * Math.PI / 180)), r3(HR * Math.cos(deg * Math.PI / 180))];
  const C1 = onHull(8), C2 = onHull(-4), C3 = onHull(20);
  const cast = [
    who("spudK", CAST.spud, P.park, SPK[0], SPK[1], 180),
    who("crewK1", CAST.crew, P.park, C1[0], C1[1], 0, { y: HULL }),
    who("crewK2", CAST.crew, P.park, C2[0], C2[1], -10, { y: HULL }),
    who("foreK", CAST.foreman, P.park, C3[0], C3[1], 15, { y: HULL }),
    who("spudT", CAST.spud, P.tag, -1.0, 56.5, 0),
  ];
  const props = [
    ...past("k", P.park, { T: 190, dusk: 0.5 }), ...ringShip("rk", P.park, { hover: 10, lit: 0.6 }), host("spudK"),
    ...past("t", P.tag, { T: 200, dusk: 0.8 }), ...ringShip("rt", P.tag, { parked: true, lit: 0.8 }), ...haul("ht", [P.tag[0], P.tag[1] + 40], 0.18), host("spudT"),
  ];
  c.prop(0, "rk-ship", { beam: 0, wobble: 0.15 }, 0); c.prop(0, "rt-ship", { beam: 0, wobble: 0 }, 0);
  c.prop(0, "ht-haul", { along: 0.18 }, 0);
  // the crew stand behind the hull's far edge until the payoff (hidden), then are up on it
  for (const id of ["crewK1", "crewK2", "foreK"]) A(0, id, "hide");
  A(T.tag, "spudK", "hide"); A(0, "spudT", "hide"); A(T.tag, "spudT", "show");

  // ================================================================ 5 THE LANDING (3:07, panel 45)
  // From the Avenue, Spud small in front with his back to us: the ring sinks the last metres, ring on ring: a deep stone
  // clunk, frost dust puffs out round the rim, the hum winds down.
  A(0, "spudK", "look", { to: [0, 0.7], dur: 0.01 });
  c.prop(0, "rk-ship", { y: r3(RING_SHIP.y + 8) }, 0);
  c.prop(0.1, "rk-ship", { y: RING_SHIP.y, wobble: 0 }, r3(T.clunk - 0.1), "inOut");
  sfx(0, "kenney/space-engine-low", { gain: 0.35, dur: r3(T.clunk + 0.6), reason: "the ship's hum, close and low" });
  sfx(0.5, "rumble", { gain: 0.3, dur: r3(T.clunk - 0.4), reason: "the air shakes under the ring" });
  sfx(T.clunk, "thud", { gain: 0.95, reason: "a 30 m ring settles on the stone ring" });
  sfx(r3(T.clunk + 0.03), "kenney/impact-mining", { gain: 0.6, reason: "stone under the hull" });
  for (const a of [-70, -45, -20, 0, 20, 45, 70]) { const r = 17.2, x = -r * Math.sin(a * Math.PI / 180), z = r * Math.cos(a * Math.PI / 180);
    c.at(r3(T.clunk + 0.02), { fx: "poof", pos: [r3(P.park[0] + x), 0.05, r3(P.park[1] + z)], dur: 0.9, color: "#e4ecea", puffs: 9, sparks: 0, size: 1.4, lift: 0.4, sound: false }); }
  A(r3(T.clunk + 0.05), "spudK", "squash", { to: 0.12, dur: 0.15 });
  sfx(0, "ai/storm-wind", { gain: 0.05, dur: T.end, reason: "far wind at dusk" });
  see(0, T.crew, ["rk-ship", "k-stones"], "the ring ship settles on the stone ring");

  // ================================================================ 6 PAYOFF (3:11, panel 46)
  // The crew are up on the hull, one stretches, one yawns, the foreman checks the fit; Spud turns to us, points up at it:
  // "Thirty metres across. Perfectly level. It was never a temple." Silence. "It's a parking space." "Case closed."
  for (const id of ["crewK1", "crewK2", "foreK"]) A(r3(T.crew - 0.05), id, "show");
  A(r3(T.crew + 0.3), "crewK1", "look", { to: [0, 0.5], dur: 0.3 });
  for (const s of ["R", "L"]) c.arm(r3(T.crew + 0.3), "crewK1", s, "up", 0.8, "out");
  A(r3(T.crew + 0.6), "crewK2", "expr", { expr: "shocked", dur: 0.4 });
  A(r3(T.crew + 0.6), "crewK2", "face", { open: 0.6, lid: 0.45, dur: 0.4 });
  A(r3(T.crew + 1.8), "crewK2", "expr", { expr: "kind", dur: 0.4 });
  A(r3(T.crew + 0.8), "foreK", "look", { to: [0.4, -0.7], dur: 0.4 });
  c.macro(r3(T.crew + 1.6), "foreK", "nod");
  sfx(r3(T.crew + 0.1), "step-concrete", { gain: 0.2, reason: "boots on the hull" });
  say(T.across, "across", { who: "spudK", hold: 0.3 });
  count(c, F, r3(T.across + 0.1), r3(T.across + 1.1), r3(T.point + 0.9), 0, 30, (v) => `${Math.round(v)} m`);
  A(r3(T.crew + 1.0), "spudK", "turn", { to: 0, dur: 0.5 });
  A(r3(T.point - 0.05), "spudK", "look", { to: [0, 0], dur: 0.01 });
  A(T.point, "spudK", "grip", { side: "R", shape: "point", dur: 0.2 });
  c.arm(r3(T.point + 0.05), "spudK", "R", { o: [0.3, 0.95, -0.15] }, 0.55, "out");
  c.arm(r3(T.parking - 0.55), "spudK", "R", "rest", 0.55);
  A(r3(T.parking - 0.4), "spudK", "grip", { side: "R", shape: "relaxed", dur: 0.2 });
  A(r3(T.parking - 0.2), "spudK", "expr", { expr: "deadpan", dur: 0.25 });
  A(r3(T.parking - 0.15), "spudK", "face", { lid: 0.42, brow: -0.25, dur: 0.25 });
  say(T.parking, "parking", { who: "spudK", hold: 0.3 });
  cap(T.pcap, r3(T.closedS - 0.05), "P", F.key === "wide" ? 225 : 240, false, { style: "label", size: F.key === "wide" ? 130 : 110, kinetic: false, x: F.key === "wide" ? 1450 : 490 });
  say(T.closed, "closed", { who: "spudK", sub: false });
  cap(r3(T.closed + 0.3), r3(T.tag - 0.05), "CASE CLOSED", F.key === "wide" ? 110 : F.SUB, false, { size: F.numSize, kinetic: false });
  sfx(r3(T.closed + 0.3), "step", { gain: 0.45, reason: "a dull stamp as the words land" });
  A(r3(T.tag - 0.3), "spudK", "noblink", { dur: 0.3 });
  see(T.crew, T.point, ["crewK1.face", "crewK2.face", "rk-ship"], "the crew up on the parked ship, stretching");
  see(T.point, T.tag, ["spudK.face"], "Spud points at the parked ship, deadpan");

  // ================================================================ 7 TAG (3:20, panels 47-48): the real answer
  // Spud stands pleased; behind him twenty Stone Age workers drag a stone on a sledge across the whole frame. He hears it,
  // looks back, sees them, turns to us and walks up to the lens until his sweater hides them: "...Nobody saw that."
  A(T.tag, "spudT", "expr", { expr: "happy", dur: 0.01 });
  A(T.tag, "spudT", "look", { to: [0, 0], dur: 0.01 });
  c.prop(T.tag, "ht-haul", { along: 0.62 }, r3(T.end - T.tag), "linear");
  sfx(T.tag, "ai/bag-drag", { gain: 0.25, dur: r3(T.end - T.tag), reason: "a stone sledge scraping over logs, far behind" });
  sfx(r3(T.tag + 0.9), "kenney/creak", { gain: 0.2, reason: "timber under the weight" });
  sfx(r3(T.tag + 2.9), "kenney/creak", { gain: 0.2, reason: "timber under the weight" });
  A(T.sees, "spudT", "turn", { to: 150, dur: 0.6 });
  A(r3(T.sees + 0.3), "spudT", "look", { to: [0.4, 0.1], dur: 0.25 });
  A(r3(T.sees + 0.7), "spudT", "expr", { expr: "shocked", dur: 0.15 });
  A(T.back, "spudT", "turn", { to: 0, dur: 0.55 });
  A(r3(T.back + 0.2), "spudT", "look", { to: [0, 0], dur: 0.2 });
  A(T.walk, "spudT", "move", { to: [r3(P.tag[0] - 0.4), r3(P.tag[1] + 61.0)], dur: 1.7, steps: 5 });
  sfx(r3(T.walk + 0.2), "ai/step-grass", { gain: 0.3, reason: "quick steps on frosty grass" });
  for (const s of ["R", "L"]) { c.arm(r3(T.walk + 1.3), "spudT", s, { o: [0.45, 0.55, 0.2] }, 0.7, "out"); }
  A(r3(T.walk + 1.6), "spudT", "expr", { expr: "happy", dur: 0.2 });
  A(r3(T.walk + 1.8), "spudT", "look", { to: [0.55, 0], dur: 0.25 });
  say(T.nobody, "nobody", { who: "spudT", sub: "...Nobody saw that." });
  A(r3(T.end - 0.3), "spudT", "noblink", { dur: 0.3 });
  see(T.tag, T.walk, ["spudT.face", "ht-haul"], "Spud pleased, the workers dragging the stone behind him");
  see(r3(T.walk + 1.7), T.end, ["spudT.face"], "his face and sweater fill the frame, the end of the sledge still in the gap");

  const V = {
    sa: { wide: at([0.5, 1.4, 68], [0, 6.5, 0], 30), tall: at([0.5, 1.4, 78], [0, 10.5, 0], 46) },
    sb: { wide: at([0.4, 1.4, 66], [0, 6.0, 0], 29), tall: at([0.4, 1.4, 76], [0, 10.0, 0], 45) },
    ca: { wide: at([-2.2, 11.2, 21.6], [-1.6, 8.9, 12.6], 30), tall: at([-2.2, 11.2, 22.6], [-1.6, 9.4, 12.6], 46) },
    cb: { wide: at([-2.1, 11.0, 21.0], [-1.6, 8.9, 12.6], 30), tall: at([-2.1, 11.0, 22.0], [-1.6, 9.4, 12.6], 46) },
    pa: { wide: at([-0.6, 0.75, 63.2], [-1.4, 3.6, 40], 32), tall: at([-0.6, 0.75, 64], [-1.4, 4.6, 40], 48) },
    pb: { wide: at([-0.65, 0.72, 62.6], [-1.4, 3.4, 40], 32), tall: at([-0.65, 0.72, 63.4], [-1.4, 4.4, 40], 48) },
    pc: { wide: at([-1.05, 0.58, 61.6], [-1.3, 1.75, 40], 26), tall: at([-1.05, 0.58, 62.0], [-1.3, 2.0, 40], 40) },
    pd: { wide: at([-1.08, 0.58, 61.3], [-1.3, 1.7, 40], 26), tall: at([-1.08, 0.58, 61.7], [-1.3, 1.95, 40], 40) },
    ta: { wide: at([0, 1.2, 62], [0, 2.4, 30], 34), tall: at([0, 1.2, 63], [0, 3.6, 30], 52) },
    tb: { wide: at([-0.2, 0.62, 62.2], [-0.45, 0.85, 30], 34), tall: at([-0.2, 0.62, 63], [-0.45, 1.1, 30], 52) },
  };
  const shots = [
    ["ring on ring", T.settle, mv(F, P.park, V.sa, V.sb, T.crew), "reveal"],
    ["the crew on the hull", T.crew, mv(F, P.park, V.ca, V.cb, r3(T.point - T.crew))],
    ["thirty metres, level", T.point, mv(F, P.park, V.pa, V.pb, r3(T.parking - T.point - 0.2))],
    ["it's a parking space", r3(T.parking - 0.2), mv(F, P.park, V.pc, V.pd, r3(T.closedS - T.parking + 0.2)), "payoff"],
    ["case closed", T.closedS, mv(F, P.park, V.pd, { wide: at([-1.12, 0.58, 60.8], [-1.3, 1.5, 40], 25), tall: at([-1.12, 0.58, 61.2], [-1.3, 1.75, 40], 39) }, r3(T.tag - T.closedS))],
    ["the tag", T.tag, { ...shot(F, P.tag, V.ta), to: shot(F, P.tag, V.ta), dur: 0.1 }],
    ["nobody saw that", T.walk, mv(F, P.tag, V.ta, V.tb, 1.9)],
  ];
  const spuds = ["spudK", "spudT"];
  return {
    set: setOf(SH_DUSK), music: H ? score(r3(SPLIT + H), { file: "ancient-aliens/aa02-part-d.ogg" }) : score(T0 + SPLIT),
    captionBand: F.key === "wide" ? [30, 420] : [200, 760],
    hook: { show: ["rk-ship"], hint: 0, what: "the second half of block D (a cut inside the film): the ring ship settles on the stone ring" },
    creative: { length: [T.end, T.end] },
    cast, props, captions: c.captions, beats: c.beats(shots, T.end), visible: c.visible,
    allowClip: [
      ...lampClip(spuds, T.end),
      ...["crewK1", "crewK2", "foreK"].map((w) => ({ who: w, with: "rk-ship", from: 0, to: T.end, reason: "the crew stands on the parked ship's hull" })),
      { who: "spudT", from: T.sees, to: r3(T.back + 0.4), checks: ["payoff-face"], reason: "the tag: he looks back over his shoulder at the haul team (panel 47), then turns to us" },
    ],
    end: T.end,
  };
}

for (const F of TALL ? [FRAME.wide, FRAME.tall] : [FRAME.wide]) for (const [part, build] of [["sun", buildSun], ["dusk", buildDusk]]) {
  const { end, ...b } = build(F);
  write(import.meta.url, {
    id: `aa02-d-${part}-${F.key}`, title: `Ancient aliens EP02 block D (${part})`,
    idea: "Who really built Stonehenge? 2:36-3:28: the giants of the old story, the low before sunset, the sun in the slit, the ring ship parks on the stone ring ('It's a parking space. Case closed.'), the Stone Age haul team behind him",
    format: "series: Ancient aliens (Spud hosts with Reaper's voice, five numbered clues, the alien answer is the premise, the tag winks at the real one); EP02 block D of four, joined later",
    ...F.sb, ...STYLE,
    sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false, scenes: ["scifi"] },
    ...b,
    notes: "Generated by storyboards/series/ancient-aliens/02-stonehenge/block-d/make-aa02-block-d.mjs. Spec: NOTES.md next to it; ../kit/BLOCKS.md.",
  });
  console.log(`aa02-d-${part}-${F.key}: ${end} s`);
}
