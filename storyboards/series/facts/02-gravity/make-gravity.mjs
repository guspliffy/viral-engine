// Fact what-if 02: "What if gravity got stronger every five seconds?" (vertical, 69 s loop). Settled step by step with
// Jonny in the thread "Make gravity what-if fact video" (19 Nov 2026): facts (STORY.md, sourced), pacing 1-5 g in 1 g steps
// then 5 g steps to 50 g, hook A (clock line first), a written g counter (this video only), ending D (the world ladder,
// black, back to 1 g, the phone loops), the 13-beat story. Target: Sol's panel sheet + room reference
// (/mnt/project-files/videos/facts/02-gravity/ref/), numbers: DESIGN.md. Spud = "you", alone on the sofa.
// Director departure from DESIGN.md section 7: Spud SITS reclined on the sofa facing the camera the whole time (as the
// panels draw him), not lying on his back across the seat (pitch -90 there would put his head through the back
// cushion and turn his face to the ceiling in shot A); "lying flat" is the deep recline after the blackout, and the
// gravity flattens him top-down ("flat", the body's own height), so panels 6-14 read as the pancake they draw.
//   node storyboards/series/facts/02-gravity/make-gravity.mjs   -> gravity.json
import { clip, write, r3 } from "../../../lib/clip.mjs";
import { NARRATOR, TAKES, STEPS, LINES } from "./lines.mjs";
import { readFileSync } from "node:fs";

const LEN = JSON.parse(readFileSync(new URL("./lines.json", import.meta.url), "utf8"));
const c = clip({ faces: "strong" }), { A, sfx, prop, cap, see } = c;
const END = 64.0;
const F = { SUB: 525, CARD: 445, HUDY: 340 };   // the counter's box starts at the safe zone's top (250 px)
// v2 (Jonny 20 Nov): 1-5 g tick every 2.5 s, blackout at 11; then 5 g steps every 5 s; the Moon hits 56-60.5
const T = {
  g2: 1.0, g3: 3.5, g4: 6.0, g5: 8.5, slump: 11.0, cutA: 11.3, wake: 13.0, g15: 18.0, g20: 23.0, g25: 28.0, g30: 33.0, g35: 38.0,
  g40: 43.0, g45: 48.0, g50: 53.0, black: 60.5, g1: 61.5,
};

// ---------------------------------------------------------------- places (DESIGN.md section 1)
const SOFA = [0.2, -1.61], SPUD = [0.46, -1.47], SEAT = 0.45;
// the phone never leaves his left hand (v2, Jonny 20 Nov "the phone hold is glitched": a loose tweened phone floated
// beside the hand): 2 g slams the hand, phone and all, onto his face; 1 g springs it back up (= frame 0)
const PH_HELD = { x: 0.64, y: 1.2, z: -0.95, rot: 185, tip: -35 };

// ---------------------------------------------------------------- cameras (DESIGN.md section 9; B and C re-aimed for a seated Spud)
const CAM = {
  A: { pos: [0.22, 1.3, 1.5], look: [0.36, 1.12, -1.6], fov: 52 },   // closer than DESIGN.md: Spud fills the lower half (panel 1)
  A2: { pos: [0.26, 1.24, 1.2], look: [0.4, 1.08, -1.6], fov: 50 },
  B4: { pos: [0.4, 1.02, 0.15], look: [0.46, 1.0, -1.6], fov: 46 },
  A6: { pos: [0.22, 1.2, 1.3], look: [0.36, 0.98, -1.6], fov: 52 },
  C7: { pos: [0.46, 1.23, 0.33], look: [0.82, 1.62, -2.65], fov: 66 },
  C8: { pos: [0.46, 1.42, 0.53], look: [0.3, 1.37, -2.65], fov: 67 },
  B9: { pos: [0.42, 1.0, 0.6], look: [0.46, 0.86, -0.95], fov: 44 },
  C10: { pos: [0.46, 1.23, 0.4], look: [0.3, 1.71, -2.65], fov: 68 },
  B11: { pos: [0.38, 1.02, 0.55], look: [0.46, 0.85, -0.92], fov: 46 },
  D12: { pos: [-0.23, 0.97, 0.95], look: [-1.52, 0.86, -0.96], fov: 45 },   // square on to the screen (yaw 34), the whole picture in frame
  C13: { pos: [0.46, 1.24, 0.46], look: [0.2, 1.75, -2.65], fov: 69 },
  C14: { pos: [0.46, 1.24, 0.46], look: [0.25, 1.8, -2.65], fov: 72 },
  // v2 (Sol's DESIGN-v2.md section E, panels P1-P9 of gravity-panels-v2): the world breaks, seen from the room and outside
  P1: { pos: [0.34, 1.26, -0.02], look: [0.06, 0.95, -8], fov: 59 },
  P2: { pos: [0.2, 2.55, -2.57], look: [-5.5, -60, -38], fov: 47 },
  P3: { pos: [0.34, 1.18, 0.94], look: [0.55, 2.34, -8], fov: 63 },
  P4: { pos: [0.34, 1.3, -0.02], look: [-0.12, 0.95, -8], fov: 60 },
  P5: { pos: [40000, 1308, 930], look: [40000, 1338, -1806], fov: 84 },   // the Alps: props-gravalps.js origin [40000, 0, 0], scale .6
  P6: { pos: [40168, 1566, -348], look: [40366, 1842, -1656], fov: 57 },
  P7: { pos: [0.34, 1.02, 0.05], look: [-0.09, 2.12, -8], fov: 65 },   // closer to the window than Sol's (.34,1.12,.94): from there the window top hid the Moon until 50 s
  P8: { pos: [0.15, 1.91, -2.58], look: [-48, 130, -2500], fov: 53 },
  P9: { pos: [0.48, 1.39, 0.21], look: [0.37, 0.78, -2.3], fov: 71 },
};
const TROOM = 59.287;   // the fire wall reaches the window (DESIGN-v2 D: 2497.9 m at 760 m/s from contact at 56)
const camOnly = (k) => ({ pos: CAM[k].pos, look: CAM[k].look, fov: CAM[k].fov });
// a slow push (constant motion): the camera creeps k of the way toward its look point over the shot
const push = (k, dur, amt = 0.06) => {
  const C = CAM[k], to = C.pos.map((p, i) => r3(p + (C.look[i] - p) * amt));
  return { ...camOnly(k), to: { pos: to, look: C.look, fov: C.fov }, dur: r3(dur), ease: "linear" };
};

// ---------------------------------------------------------------- props
const props = [
  { id: "sofa", kind: "gsofa", x: SOFA[0], y: 0, z: SOFA[1], rot: 0, sink: 0.012, damage: 0 },
  { id: "tv", kind: "gtv", x: -1.52, y: 0, z: -0.99, rot: 34, crumble: 0, glow: 1 },
  { id: "lamp", kind: "glamp", x: -1.75, y: 0, z: -2.35, rot: 180 },   // the left corner (DESIGN.md: right): there its shade hung over the tower in every window shot
  { id: "plant", kind: "gplant", x: 1.8, y: 0, z: -1.6 },
  { id: "rug", kind: "grug", x: 0.18, y: 0, z: 0.11 },
  { id: "phone", kind: "phone", ...PH_HELD, scale: 1.8, case: "#3e383b" },
  { id: "tower", kind: "gtower", staged: "the glass tower across the street, its base on the city ground 60 m below", x: 0, y: 0, z: 0, fall: 0, dust: 1 },
  { id: "horizon", kind: "ghorizon", x: 0, y: 0, z: 0 },
  { id: "sky", kind: "gsky", x: 0, y: 0, z: 0 },
  { id: "moon", kind: "gmoon", staged: "the Moon in the sky", x: 0, y: 0, z: 0, moon: 0, cracks: 0, crackW: 3 },
  { id: "clouds", kind: "gclouds", staged: "clouds in the sky", x: 0, y: 22, z: 0, sink: 0, drift: 0 },
  { id: "haze", kind: "ghaze", staged: "haze filling the room air", x: 0, y: 0, z: 0, haze: 0 },
  // v2 world (DESIGN-v2.md): each kind runs on one param t = clip seconds
  ...[["ruin", "gruin", "the city outside: 136 buildings, ground, dust sea; collapses at 20 g, erased by the Moon's wave"],
    ["rupture", "grupture", "the street below the window tearing open, cars, fires"],
    ["entry", "gentry", "satellites and the space station burning in, kilometres up"],
    ["strike", "gstrike", "three falling satellites hitting the city"],
    ["glass", "gglass", "cracks in the window glass"],
    ["alps", "galps", "the Alps valley, 40 km away in its own sky"],
    ["moonfall", "gmoonfall", "the Moon falling onto the Earth"],
    ["firewall", "gfirewall", "the impact's fire wall racing across the city"],
    ["roomhit", "groomhit", "the window blown in: glass, wood, stuffing, the shelf"],
  ].map(([id, kind, staged]) => ({ id, kind, staged, x: 0, y: 0, z: 0, t: -1 })),
  { id: "flash", kind: "gflash", staged: "a white flash on the camera lens", x: 0, y: 0, z: 0, t: -1, cam: { pos: CAM.P9.pos, look: CAM.P9.look, fov: CAM.P9.fov } },
  // two camera-attached black cards: the 5 g tunnel on shot B, the black after the room hit
  { id: "tunB", kind: "gtunnel", staged: "a black card on the camera lens (tunnel vision)", x: 0, y: 0, z: 0, cam: { ...camOnly("B4") }, r: 2000, cx: 560, cy: 1070, feather: 84 },
  { id: "tunE", kind: "gtunnel", staged: "a black card on the camera lens (the black after the hit)", x: 0, y: 0, z: 0, cam: { ...camOnly("P9") }, r: 2000 },
];
const cast = [{ id: "spud", character: "potatobrawl/spud", at: SPUD, face: 0, expr: "kind", follow: 0, seed: 2.9 }];

// ---------------------------------------------------------------- helpers
const expr = (t, name, set, dur = 0.2) => A(t, "spud", "expr", { expr: name, ...(set && { set }), dur });
const look = (t, to, dur = 0.2) => A(t, "spud", "look", { to, dur, blink: false });
const arms = (t, o, dur = 0.3, ease) => { c.arm(t, "spud", "R", { o }, dur, ease); c.arm(t, "spud", "L", { o }, dur, ease); };
const narr = (t, line, text, pos = F.SUB) => {
  const d = LEN[line]; if (!d) throw new Error(`no measured length for "${line}" (run measure-lines.mjs)`);
  c.at(t, { macro: "narrate", line, voice: NARRATOR, ...(TAKES[line] && { take: TAKES[line] }), dur: d, caption: false, pos, gain: 4.0 });
  cap(t, Math.min(r3(t + d + 0.15), END - 0.01), text, pos);   // spoken "gee", written "g"
};
// the first line sits under the hook question (two lines from F.CARD), the rest at F.SUB
LINES.forEach(([t, line, text], i) => narr(t, line, text, i === 0 ? 600 : F.SUB));

// per step: how flat he is (DESIGN.md section 7 f column), the cushion under him and the pitch of his recline
const PER = {
  0: { f: 0, sink: 0.012, pitch: -22 }, [T.g2]: { f: 0.04, sink: 0.024, pitch: -24 }, [T.g3]: { f: 0.075, sink: 0.043, pitch: -26 },
  [T.g4]: { f: 0.105, sink: 0.058, pitch: -27 }, [T.g5]: { f: 0.13, sink: 0.07, pitch: -28 }, [T.slump]: { f: 0.16, sink: 0.084, pitch: -42 },
  [T.wake]: { f: 0.25, sink: 0.109, pitch: -42 }, [T.g15]: { f: 0.33, sink: 0.123, pitch: -42 }, [T.g20]: { f: 0.4, sink: 0.135, pitch: -42 },
  [T.g25]: { f: 0.48, sink: 0.152, pitch: -42 }, [T.g30]: { f: 0.5, sink: 0.156, pitch: -42 }, [T.g35]: { f: 0.52, sink: 0.158, pitch: -42 },
  [T.g40]: { f: 0.53, sink: 0.159, pitch: -42 }, [T.g45]: { f: 0.55, sink: 0.162, pitch: -42 }, [T.g50]: { f: 0.57, sink: 0.164, pitch: -42 },
};
const seatY = (sink) => r3(SEAT - sink);
// sink into the cushion: a glide in place (a second "sit" would nudge him 3 cm forward each time); y = seat - 0.12 (sit's leg offset)
const sinkTo = (t, sink, dur, ease = "out") => A(t, "spud", "move", { to: SPUD, y: r3(seatY(sink) - 0.12), dur, steps: 0, ease });
A(0, "spud", "sit", { rot: 0, height: seatY(PER[0].sink), dur: 0, hands: "keep" });
A(0, "spud", "pitch", { to: PER[0].pitch, dur: 0 });
A(0, "spud", "flat", { to: 0, dur: 0 });
for (const k of Object.keys(PER).map(Number).filter((k) => k > 0).sort((a, b) => a - b)) {
  const P = PER[k], d = k === T.slump ? 0.5 : 0.18;
  A(k, "spud", "flat", { to: P.f, dur: d, ease: "out" });
  sinkTo(k, P.sink, d);
  A(k, "spud", "pitch", { to: P.pitch, dur: d, ease: "out" });
  prop(k, "sofa", { sink: P.sink }, d, "out");
  if (k !== T.slump) A(k, "spud", "squash", { amount: 0.1, dur: 0.22 });   // each step lands as a jolt
}

// ================================================================ 0-6 HOOK: 1 g, the phone over his face; 2 g at 1.0 slams it down
// his LEFT hand (screen right, +x) holds the phone up beside his face; the right one rests on his belly
const HOLD = (t, dur, ease) => { c.arm(t, "spud", "L", { o: [-0.16, 0.55, 0.5] }, dur, ease); c.arm(t, "spud", "R", { o: [-0.22, 0.25, 0.3] }, dur, ease); };
HOLD(0, 0); A(0, "spud", "grab", { prop: "phone", hand: "L", dur: 0, pose: null });
expr(0, "kind", { eye: 0.85 }, 0); look(0, [0, 0.35], 0);
cap(0, 4.75, "WHAT IF GRAVITY KEPT GROWING?", F.CARD, false, { size: 54, kinetic: false, color: "#ffffff", stroke: "#1d1b20" });
// 2 g: the arm can't hold it: hand and phone drop onto his face, hold there, then slide down to the cushion beside him
c.arm(T.g2, "spud", "L", { o: [-0.3, 0.42, 0.52] }, 0.08, "in");
expr(r3(T.g2 + 0.07), "angry", { eye: 0.1, open: 0.05, curve: -0.7 }, 0.06);
A(r3(T.g2 + 0.07), "spud", "face", { lid: 0.85, dur: 0.06 });
sfx(r3(T.g2 + 0.07), "kenney/impact-soft-medium", { gain: 0.8, reason: "his hand and the phone smack onto his face" });
sfx(r3(T.g2 + 0.1), "kenney/impact-wood-light", { gain: 0.35, reason: "the sofa frame knocks as he sinks" });
c.arm(1.55, "spud", "L", { o: [0.3, 0.05, 0.12] }, 1.3, "inOut"); c.arm(1.4, "spud", "R", { o: [0.3, 0.05, 0.12] }, 0.6, "inOut");
A(1.95, "spud", "face", { lid: 0.3, dur: 0.3 });
expr(1.95, "annoyed", { eye: 0.7 }, 0.3); look(1.95, [0, 0.1], 0.3);
see(0, T.g2, ["spud.face", "phone"], "frame 0: you on the sofa, the phone held over your face; the counter reads 1 g");
see(T.g2, T.g3, ["spud.face"], "2 g: hand and phone slam onto his face");

// ================================================================ 6-11 3 g: rocket launch strain
expr(T.g3, "angry", { eye: 0.5, open: 0.25, curve: -0.6 }, 0.15);
A(T.g3, "spud", "face", { lid: 0.4, dur: 0.15 });
for (let k = 0; k < 3; k++) A(r3(T.g3 + 0.5 + k * 0.7), "spud", "squash", { amount: 0.03, dur: 0.35 });   // breath against the weight
sfx(r3(T.g3 + 0.1), "ai-package/flat-exhale", { gain: 0.5, reason: "he pushes air out under 3 g" });
sfx(r3(T.g3 + 0.2), "kenney/cloth", { gain: 0.35, reason: "the sweater rubs on the sofa" });
see(T.g3, T.g4, ["spud.face"], "3 g: teeth gritted, pressed into the cushion");

// ================================================================ 11-16 4 g: the picture goes grey, heavy lids
expr(T.g4, "deadpan", { eye: 0.55 }, 0.4);
A(T.g4, "spud", "face", { lid: 0.55, dur: 0.6 });
A(T.g4, "spud", "droop", { to: 0.5, dur: 0.6 });
sfx(T.g4, "ai/heartbeat", { gain: 0.35, dur: 2.5, reason: "his pulse, slow and heavy" });
see(T.g4, T.g5, ["spud.face"], "4 g: grey picture, heavy lids");

// ================================================================ 16-21 5 g: tunnel vision on his face, black at 19.5, slump
expr(T.g5, "terrified", { open: 0.35 }, 0.15);
A(T.g5, "spud", "face", { lid: 0, dur: 0.12 });
look(T.g5, [0.15, 0.05], 0.15); look(r3(T.g5 + 0.9), [-0.15, 0.05], 0.2); look(r3(T.g5 + 1.7), [0, 0], 0.2);
prop(T.g5, "tunB", { r: 1650, feather: 84 }, 0, "linear");
prop(r3(T.g5 + 0.01), "tunB", { r: 238 }, 1.2, "out");
prop(r3(T.g5 + 1.22), "tunB", { r: 126, feather: 40 }, 0.8, "inOut");
prop(r3(T.slump - 0.5), "tunB", { r: 0, feather: 0 }, 0.5, "in");
prop(T.cutA, "tunB", { r: 2000, feather: 84 }, 0, "linear");
sfx(T.g5, "ai/heartbeat", { gain: 0.6, dur: 2.6, reason: "his pulse loud in the tunnel" });
// slump (hidden by the black, shown from the cut at T.cutA): eyes shut, sprout flat, sinking back
A(T.slump, "spud", "face", { lid: 1, dur: 0.3 });
expr(T.slump, "serene", { curve: -0.1 }, 0.3);
A(T.slump, "spud", "droop", { to: 0.9, dur: 0.4 });
A(T.slump, "spud", "lean", { to: -10, dur: 0.5, ease: "out" });
arms(T.slump, [0.36, -0.05, 0.08], 0.5, "out");
sfx(T.slump, "kenney/cloth", { gain: 0.8, reason: "his sweater slides on the sofa as he slumps" });
sfx(r3(T.slump + 0.25), "ai/cushion-poof", { gain: 0.45, reason: "he drops into the cushion" });
see(T.g5, T.slump, ["spud.face"], "5 g: the picture closes to a hole on his face");
see(T.cutA, T.wake, ["spud"], "he has blacked out, slumped back on the sofa");

// ================================================================ 21-26 10 g: lying flat, blood back, he wakes; the sofa legs break
A(T.wake, "spud", "face", { lid: 0, dur: 0.12 });
expr(T.wake, "shocked", { eye: 1.15, curve: -0.4 }, 0.12);
A(T.wake, "spud", "lean", { to: 0, dur: 0.3 });
look(T.wake, [0, 0.1], 0.1); look(r3(T.wake + 2.2), [-0.3, -0.35], 0.25); look(r3(T.wake + 3.6), [0, 0.1], 0.2);
prop(T.wake, "sofa", { damage: 1 }, 0.8, "out");
sfx(T.wake, "ai/surface-gasp", { gain: 0.5, reason: "his breath comes back as he wakes" });
sfx(r3(T.wake + 0.15), "ai/branch-snap", { gain: 0.6, reason: "the front sofa legs crack" });
sfx(r3(T.wake + 0.45), "ai/branch-snap", { gain: 0.5, reason: "the second leg cracks" });
sfx(r3(T.wake + 0.6), "kenney/impact-wood-heavy", { gain: 0.6, reason: "the floor boards creak and split under the feet" });
see(T.wake, T.g15, ["spud.face", "sofa"], "10 g: awake again, pressed flat; the sofa legs splay and the floor cracks");

// ================================================================ 18-23 15 g: the tower across the street cracks and falls
expr(T.g15, "shocked", { open: 0.3, eye: 1.1 }, 0.15); look(T.g15, [0.4, 0.3], 0.2);
prop(T.g15, "tower", { fall: 1 }, 3.5, "linear");
sfx(r3(T.g15 + 0.2), "ai/glass-smash", { gain: 0.45, reason: "the tower's glass breaks across the street, heard through our window" });
sfx(r3(T.g15 + 0.9), "ai/thunder", { gain: 0.85, dur: 3.2, reason: "concrete floors slam down, a deep rumble through the glass" });
sfx(r3(T.g15 + 1.4), "ai/metal-tear", { gain: 0.3, reason: "the steel frame tears" });
see(T.g15, T.g20, ["tower"], "15 g: the glass tower across the street cracks and collapses straight down in dust");

// the v2 world props all run on clip time (one linear tween of t over the whole clip; reset to -1 at 1 g)
const WORLD = ["ruin", "rupture", "entry", "strike", "glass", "alps", "moonfall", "firewall", "roomhit", "flash"];
for (const id of WORLD) { prop(0, id, { t: 0 }, 0, "linear"); prop(0, id, { t: END }, END, "linear"); }

// ================================================================ 23-28 20 g: the whole city comes down (P1)
expr(T.g20, "terrified", { open: 0.45 }, 0.15); look(T.g20, [0, 0.25], 0.2);
prop(T.g20, "tower", { dust: 0.5 }, 2.0, "inOut");
sfx(r3(T.g20 + 0.3), "rumble", { gain: 0.9, dur: 5.2, reason: "a whole city's floors pancaking, a deep rumble through the glass" });
for (const [k, g] of [[0.6, 0.7], [1.5, 0.55], [2.4, 0.8], [3.3, 0.5], [4.2, 0.6]]) sfx(r3(T.g20 + k), "thunder", { gain: g, reason: "a tower's slabs slam down, far off" });
sfx(r3(T.g20 + 1.9), "ai/metal-tear", { gain: 0.35, reason: "steel frames tear across the city" });
see(T.g20, T.g25, ["spud.face"], "20 g: behind him every building in the city crushes down into a sea of dust");

// ================================================================ 28-33 25 g: the street tears open (P2), then the wink
prop(T.g25, "tower", { dust: 0.1 }, 0.6, "inOut");   // its own dust would hide the street below (P2)
sfx(r3(T.g25 + 0.15), "explosion", { gain: 0.5, dur: 1.6, reason: "the asphalt splits with a deep crack below the window" });
sfx(r3(T.g25 + 0.6), "ai/glass-shatter-car", { gain: 0.55, reason: "car windows burst as the cars are crushed" });
sfx(r3(T.g25 + 1.0), "ai/metal-tear", { gain: 0.45, reason: "car shells crumple" });
sfx(r3(T.g25 + 0.9), "ai/house-fire", { gain: 0.35, dur: 1.5, reason: "fires crackle along the fissure" });
see(T.g25, 30.3, ["rupture"], "25 g: from the window, the street below tears open, cars crushed at its lips, fires");
expr(30.3, "kind", { curve: 0.4 }, 0.2); look(30.3, [0, 0], 0.15);
expr(31.2, "smug", { curve: 0.8 }, 0.2);
A(31.25, "spud", "face", { lidR: 1, lidL: 0.1, dur: 0.12 });
A(32.4, "spud", "face", { lidR: 0, lidL: 0, dur: 0.15 });
sfx(31.1, "ai-package/flat-exhale", { gain: 0.7, reason: "a small breath out before the wink" });
see(30.3, T.g30, ["spud.face"], "25 g: pancake flat, a calm wink on 'Good thing you're a potato'");

// ================================================================ 33-38 30 g: satellites burn in (P3), a strike (P4)
expr(T.g30, "shocked", { open: 0.3, eye: 1.1 }, 0.15); look(T.g30, [0, 0.4], 0.2);
sfx(r3(T.g30 + 0.4), "rumble", { gain: 0.45, dur: 3, reason: "a far roar of things burning in high up" });
for (const k of [0.8, 1.7, 2.5]) sfx(r3(T.g30 + k), "thunder", { gain: 0.3, reason: "distant pressure cracks from the burning satellites" });
see(T.g30, 36, ["entry"], "30 g: every satellite falls, fireballs fill the sky, the space station breaks apart");
// the flash at 36.00 is silent; its blast arrives a second later (335 m through the air) and cracks the window
sfx(37.01, "explosion", { gain: 1.0, dur: 3, reason: "the strike's blast wave hits the building" });
sfx(37.05, "ai/screen-crack", { gain: 0.8, reason: "the window glass cracks" });
sfx(38.18, "explosion", { gain: 0.6, dur: 2.5, reason: "the second strike's blast, further away" });
sfx(39.7, "explosion", { gain: 0.6, dur: 2.5, reason: "the third strike's blast" });
see(36, T.g35, ["strike"], "30 g: a satellite hits the city: flash, a ring of dust, the window cracks");

// ================================================================ 38-43 35 g: the cracked window, then the air turns poisonous
sfx(38.4, "ai/house-fire", { gain: 0.3, dur: 2.2, reason: "rubble rains down and fires burn across the city" });
see(T.g35, 40.5, ["glass"], "35 g: the cracked window over the flattened, burning city");
expr(40.5, "terrified", { open: 0.7 }, 0.15); look(40.5, [0, 0.15], 0.2);
prop(40.5, "haze", { haze: 0.7 }, 1.2, "inOut");
for (const g of [40.6, 41.5, 42.4]) { A(g, "spud", "squash", { amount: 0.05, dur: 0.5 }); sfx(g, "ai/surface-gasp", { gain: 0.55, reason: "he gasps for air in the thick haze" }); }
see(40.5, T.g40, ["spud.face"], "35 g: the air thickens to a haze, he gasps");

// ================================================================ 43-48 40 g: the Alps crush (P5 wide, P6 the split summit)
prop(T.g40, "haze", { haze: 0 }, 0, "linear");
sfx(r3(T.g40 + 0.1), "rumble", { gain: 0.9, dur: 5, reason: "the valley's avalanches roar, layered and far" });
sfx(r3(T.g40 + 0.3), "ai/thunder", { gain: 0.7, dur: 4.5, reason: "cliffs breaking off and rolling down" });
for (const k of [0.5, 1.1, 1.8, 2.3]) sfx(r3(T.g40 + k), "kenney/impact-mining", { gain: 0.35, reason: "stones shedding off the near slope" });
sfx(45.5, "explosion", { gain: 0.55, dur: 2.5, reason: "the summit splits with a deep report" });
see(T.g40, 45.5, ["alps"], "40 g: real mountains: cliffs fail, avalanches pour into the valley");
see(45.5, T.g45, ["alps"], "40 g: a summit splits in two, house-sized blocks fly");

// ================================================================ 48-56 45-50 g: the Moon falls (P7, his face, P7)
prop(T.g45, "moon", { scale: 0 }, 0, "linear");   // the falling Moon (gmoonfall) takes over until the reset
expr(T.g45, "shocked", { open: 0.4, eye: 1.2 }, 0.15); look(T.g45, [0, 0.7], 0.2);
sfx(T.g45, "rumble", { gain: 0.6, dur: 8, reason: "the falling Moon's long low roar" });
for (const k of [1.5, 3.4, 5.6, 7.0]) sfx(r3(T.g45 + k), "thunder", { gain: 0.25 + k * 0.03, reason: "burning chunks of Moon crack through the sky" });
sfx(50.5, "ai/screen-crack", { gain: 0.45, reason: "the cracked window creaks in its frame" });
see(T.g45, T.g50, ["moonfall"], "45 g: the Moon falls, cracking, burning chunks breaking off");
expr(T.g50, "terrified", { open: 0.8, eye: 1.3 }, 0.12); look(T.g50, [0, 0.8], 0.15);
see(T.g50, 54.6, ["spud.face"], "50 g: he stares up at it");
see(54.6, 56, ["moonfall"], "50 g: the Moon fills the sky over the ruins");

// ================================================================ 56-60.5 50 g: contact, the fire wall (P8), the room blown in (P9)
sfx(56.0, "ai/grass-fire", { gain: 0.5, dur: 3.3, reason: "the fire wall's roar, still far" });
sfx(56.4, "rumble", { gain: 0.8, dur: 2.9, reason: "the ground shaking as the wave comes" });
sfx(58.4, "kenney/impact-glass-light", { gain: 0.9, reason: "the cracked window rattles" });
prop(59.22, "tower", { scale: 0 }, 0, "linear");   // the wave reaches the near tower's rubble (gruin erases the rest)
see(56, TROOM, ["firewall"], "50 g: the Moon hits behind the city, a wall of fire races at the window");
sfx(TROOM, "explosion", { gain: 1.2, dur: 1.4, reason: "the blast blows the window in" });
sfx(r3(TROOM + 0.02), "ai/glass-smash", { gain: 0.9, reason: "the window bursts into the room" });
sfx(r3(TROOM + 0.1), "ai/branch-snap", { gain: 0.6, reason: "the shelf and the sofa frame snap" });
sfx(r3(TROOM + 0.3), "kenney/impact-wood-heavy", { gain: 0.6, reason: "the shelf crashes over" });
expr(TROOM, "terrified", { open: 0.9, eye: 1.35 }, 0.06); look(TROOM, [0, 0.9], 0.08);
A(TROOM, "spud", "squash", { amount: 0.22, dur: 0.42 });
prop(0, "sofa", { brk: 0 }, 0, "linear"); prop(TROOM, "sofa", { brk: 1 }, r3(T.black - TROOM), "out");
see(TROOM, T.black, ["spud.face", "roomhit"], "50 g: the window explodes inward, glass and furniture fly over him, white flash");
// the lamp and the plant jump (on the cut) to where Sol's design has them in P9, then fly (props-gravmoon.js header numbers)
const MID = r3((TROOM + T.black) / 2), roomFly = (id, at0, mid, end) => {
  prop(TROOM, id, at0, 0, "linear");
  prop(r3(TROOM + 0.001), id, mid, r3(MID - TROOM - 0.001), "linear"); prop(MID, id, end, r3(T.black - MID), "linear");
};
roomFly("lamp", { x: 1.45, y: 0, z: -2.12, rot: 0, roll: 0 }, { x: 2.39, y: 0.91, z: -1.42, roll: 38 }, { x: 2.71, y: 1.64, z: -0.52, roll: 82 });
roomFly("plant", { x: -1.4, y: 0.09, z: -2.48 }, { x: -1.18, y: 0.29, z: -1.84 }, { x: -1.02, y: 0.04, z: -1.03 });
prop(T.black, "tunE", { r: 0, feather: 0 }, 0, "linear");

// ================================================================ 61.5-64 1 g: back to normal; the phone springs back up in his hand
prop(T.g1, "tunE", { r: 2000, feather: 84 }, 0, "linear");
for (const [id, set] of [["tower", { fall: 0, dust: 1, scale: 1 }], ["moon", { moon: 0, cracks: 0, scale: 1 }], ["haze", { haze: 0 }], ["sofa", { damage: 0, brk: 0 }], ["lamp", { x: -1.75, y: 0, z: -2.35, rot: 180, roll: 0 }], ["plant", { x: 1.8, y: 0, z: -1.6 }], ...WORLD.map((id) => [id, { t: -1 }])]) prop(r3(T.black + 0.01), id, set, 0, "linear");   // restored under the black
A(T.g1, "spud", "flat", { to: 0, dur: 0.16, ease: "back" });
A(T.g1, "spud", "pitch", { to: PER[0].pitch, dur: 0.25, ease: "out" });
sinkTo(T.g1, PER[T.g50].sink, 0.16);
A(T.g1, "spud", "droop", { to: 0, dur: 0.3, ease: "back" });
A(T.g1, "spud", "face", { lid: 0, dur: 0.1 });
expr(T.g1, "shocked", { open: 0.45, eye: 1.25 }, 0.1); look(r3(T.g1 + 0.1), [0, 0.1], 0.1);
sfx(T.g1, "ai/cushion-poof", { gain: 0.5, reason: "he pops back round, the sofa sighs" });
sfx(r3(T.g1 + 0.5), "ai-package/flat-exhale", { gain: 0.5, reason: "one breath out" });
prop(r3(T.g1 + 0.2), "sofa", { sink: PER[0].sink }, 0.3, "out"); sinkTo(r3(T.g1 + 0.2), PER[0].sink, 0.3);
// the weight is gone: his arm springs back up with the phone still in his hand (= frame 0)
HOLD(r3(T.g1 + 0.1), 0.4, "out"); c.arm(r3(T.g1 + 0.1), "spud", "R", { o: [-0.22, 0.25, 0.3] }, 0.9, "inOut");   // the free hand slower: no palm flip
look(r3(T.g1 + 0.6), [0.2, 0.4], 0.2); look(r3(T.g1 + 1.4), [0, 0.35], 0.2);
expr(r3(T.g1 + 1.4), "kind", { eye: 0.85 }, 0.4);
see(T.g1, END, ["spud.face", "phone"], "1 g again: the room is whole, the phone back up in his hand (the loop)");

// ---------------------------------------------------------------- shots
const beats = c.beats([
  ["P01 2 g: the phone slams onto your face", 0, push("A", T.g3), "hook"],
  ["P02 3 g: pressed into the sofa", T.g3, push("A2", 2.5)],
  ["P03 4 g: the picture greys", T.g4, push("A2", 2.5, 0.1)],
  ["P04 5 g: tunnel vision, black", T.g5, camOnly("B4")],
  ["P05 the blackout: slumped", T.cutA, camOnly("A")],
  ["P06 10 g: lying flat, the sofa legs break", T.wake, push("A6", 5)],
  ["P07 15 g: the tower falls", T.g15, push("C7", 5, 0.04)],
  ["P08 20 g: the whole city comes down", T.g20, push("P1", 5, 0.015)],
  ["P09 25 g: the street tears open", T.g25, push("P2", 2.3, 0.02)],
  ["P10 25 g: good thing you're a potato", 30.3, push("B9", 2.7, 0.06), "payoff"],
  ["P11 30 g: satellites burn in", T.g30, push("P3", 3, 0.01)],
  ["P12 30 g: a strike, the window cracks", 36, camOnly("P4")],
  ["P13 35 g: the air turns poisonous", 40.5, push("B11", 2.5, 0.06)],
  ["P14 40 g: the Alps crush", T.g40, push("P5", 2.5, 0.03)],
  ["P15 40 g: a summit splits", 45.5, push("P6", 2.5, 0.03)],
  ["P16 45 g: the Moon falls", T.g45, push("P7", 5, 0.01)],
  ["P17 50 g: his face", T.g50, push("B9", 1.6, 0.05)],
  ["P18 50 g: the Moon fills the sky", 54.6, push("P7", 1.4, 0.005)],
  ["P19 50 g: contact, the fire wall", 56, camOnly("P8")],
  ["P20 50 g: the room blown in", TROOM, camOnly("P9")],
  ["P21 1 g: back to normal, the phone loops", T.g1, camOnly("A")],
], END);

// ---------------------------------------------------------------- the grade (DESIGN.md section 8)
const grade = [[0, { s: 1.1 }], [r3(T.g4 - 0.03), { s: 1.1 }], [T.g4, { s: 0.07 }, 0.38], [r3(T.g5 - 0.03), { s: 0.07 }], [T.g5, { s: 1.0 }], [r3(T.g35 - 0.03), { s: 1.08 }],
  [40.5, { s: 0.84 }, 1.2], [r3(T.g40 - 0.03), { s: 0.84 }], [T.g40, { s: 1.0 }], [T.g45, { s: 1.1 }], [T.g1, { s: 1.1 }]];

write(import.meta.url, {
  id: "gravity", title: "What if gravity kept growing?",
  idea: "Fact what-if 02: gravity gets stronger every five seconds (1-5 g, then 5 g steps to 50 g): you black out, then the world breaks through the window, then back to 1 g and the phone loops.",
  format: "Fact what-if (vertical, 60 s+)",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: true, captionStyle: "kinetic",
  captionBand: [300, 1360],
  cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 },
  physics: false, animeTiming: true, loopIdle: true, far: 6000,
  set: { type: "gravroom", lampLight: [-1.46, 1.94, -2.35], aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  grade,
  hud: { gforce: { keys: STEPS, y: F.HUDY } },
  music: { file: "score-film/gravity-score.ogg", from: 0, gain: 0.75, lowCut: 90, dip: false, duck: { voice: -6 }, lock: false },
  sound: { signature: false, sfx: 0.65, ambience: 0.05, surface: "wood", room: "livingroom", guard: true, level: -9.7 },
  creative: { length: [END, END] },
  hook: { show: ["spud", "phone"], hint: 0, what: "you on the sofa, phone over your face, the counter at 1 g and the question on screen; at 1.0 s hand and phone slam onto his face" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "phone", from: T.g2, to: 1.9, checks: ["face-hidden"], reason: "the gag: 2 g slams his own hand and the phone onto his face, one eye under the phone for half a second" },
    { who: "spud", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "arm-in-prop", "costume-in-prop", "hand-in-prop", "limb-in-prop"], reason: "he sits sunk into the sofa: gravity presses him into the cushion (the dip is drawn by the sofa's sink); his widening body spreads into the seat and back cushion" },
    { who: "spud", with: "spud", from: T.g25, to: T.g1, checks: ["payoff-face"], reason: "25 g: pancake flat, his rolled collar spreads over his mouth; the wink (the payoff) is in the eyes, which stay clear" },
  ],
  notes: "Generated by storyboards/series/facts/02-gravity/make-gravity.mjs.",
});
