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
const END = 69.0;
const F = { SUB: 525, CARD: 445, HUDY: 340 };   // the counter's box starts at the safe zone's top (250 px)
const T = {
  g2: 1.0, g3: 6.0, g4: 11.0, g5: 16.0, slump: 19.5, wake: 21.0, g15: 26.0, g20: 31.0, g25: 36.0, g30: 41.0, g35: 46.0,
  g40: 51.0, g45: 56.0, g50: 61.0, black: 65.5, g1: 66.5, fling: 68.27,
};

// ---------------------------------------------------------------- places (DESIGN.md section 1)
const SOFA = [0.2, -1.61], SPUD = [0.46, -1.47], SEAT = 0.45;
const PH_HELD = { x: 0.64, y: 1.2, z: -0.95, rot: 185, tip: -35 };   // up in his left hand (screen right), beside his face, screen to him
const PH_FACE = { x: 0.46, y: 1.07, z: -1.15, rot: 180, tip: -66 };   // slammed flat onto his face (on its surface)    // slammed onto his face
const PH_SEAT = { x: -0.55, z: -1.3, rot: 160, tip: -90 };            // slid off him onto the seat on his right (screen left), clear of him when he is widest (y: the seat top)

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
};
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
  { id: "phone", kind: "phone", ...PH_HELD, scale: 1.8, case: "#3e383b", staged: "in his raised right hand, then on his face, then lying on the sofa seat (the cushion is its support)" },
  { id: "street", kind: "gstreet", x: 0, y: 0, z: 0 },
  { id: "tower", kind: "gtower", x: 0, y: 0, z: 0, fall: 0, dust: 1 },
  { id: "city", kind: "gcity", x: 0, y: 0, z: 0 },
  { id: "horizon", kind: "ghorizon", x: 0, y: 0, z: 0 },
  { id: "sky", kind: "gsky", x: 0, y: 0, z: 0 },
  { id: "moon", kind: "gmoon", staged: "the Moon in the sky", x: 0, y: 0, z: 0, moon: 0, cracks: 0, crackW: 3 },
  // nine trails read thin in a 5 s shot: a second copy, shifted and later, doubles them; the big one shows its panels
  { id: "sats", kind: "gsats", staged: "falling satellites, kilometres up in the sky", x: 0, y: 0, z: 0, t: -1, satScale: 10, cam: { pos: [0.46, 1.23, 0.4], look: [0.3, 1.71, -2.65] } },
  { id: "sats2", kind: "gsats", staged: "falling satellites, kilometres up in the sky", x: -260, y: 60, z: 0, t: -1, cam: { pos: [0.46, 1.23, 0.4], look: [0.3, 1.71, -2.65] } },
  { id: "clouds", kind: "gclouds", staged: "clouds in the sky, then a cloud sea over the street", x: 0, y: 22, z: 0, sink: 0, drift: 0 },   // 22 m up: the sea's crest at -11 buries all but the tall towers (at -33 the mid city stood out of it everywhere)
  { id: "haze", kind: "ghaze", staged: "haze filling the room air", x: 0, y: 0, z: 0, haze: 0 },
  // two camera-attached black cards: the 5 g tunnel on shot B, the blackout on the last Moon shot
  { id: "tunB", kind: "gtunnel", staged: "a black card on the camera lens (tunnel vision)", x: 0, y: 0, z: 0, cam: { ...camOnly("B4") }, r: 2000, cx: 560, cy: 1070, feather: 84 },
  { id: "tunE", kind: "gtunnel", staged: "a black card on the camera lens (the blackout)", x: 0, y: 0, z: 0, cam: { ...camOnly("C14") }, r: 2000 },
];
const cast = [{ id: "spud", character: "potatobrawl/spud", at: SPUD, face: 0, expr: "kind", follow: 0, seed: 2.9 }];

// ---------------------------------------------------------------- helpers
const expr = (t, name, set, dur = 0.2) => A(t, "spud", "expr", { expr: name, ...(set && { set }), dur });
const look = (t, to, dur = 0.2) => A(t, "spud", "look", { to, dur, blink: false });
const arms = (t, o, dur = 0.3, ease) => { c.arm(t, "spud", "R", { o }, dur, ease); c.arm(t, "spud", "L", { o }, dur, ease); };
const narr = (t, line, pos = F.SUB) => {
  const d = LEN[line]; if (!d) throw new Error(`no measured length for "${line}" (run measure-lines.mjs)`);
  c.at(t, { macro: "narrate", line, voice: NARRATOR, ...(TAKES[line] && { take: TAKES[line] }), dur: d, caption: false, pos, gain: 4.0 });
  cap(t, Math.min(r3(t + d + 0.15), END - 0.01), line, pos);
};
// the first line sits under the hook question (two lines from F.CARD), the rest at F.SUB
LINES.forEach(([t, line], i) => narr(t, line, i === 0 ? 600 : F.SUB));

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
HOLD(0, 0); A(0, "spud", "grip", { side: "L", shape: "hold", dur: 0 });
expr(0, "kind", { eye: 0.85 }, 0); look(0, [0, 0.35], 0);
cap(0, 4.75, "WHAT IF GRAVITY KEPT GROWING?", F.CARD, false, { size: 54, kinetic: false, color: "#ffffff", stroke: "#1d1b20" });
prop(T.g2, "phone", PH_FACE, 0.07, "in");
arms(T.g2, [0.12, 0.42, 0.3], 0.08, "in");
expr(r3(T.g2 + 0.07), "angry", { eye: 0.1, open: 0.05, curve: -0.7 }, 0.06);
A(r3(T.g2 + 0.07), "spud", "face", { lid: 0.85, dur: 0.06 });
sfx(r3(T.g2 + 0.07), "kenney/impact-soft-medium", { gain: 0.8, reason: "the phone smacks onto his face" });
sfx(r3(T.g2 + 0.1), "kenney/impact-wood-light", { gain: 0.35, reason: "the sofa frame knocks as he sinks" });
// the phone slides off his face onto the seat, his arms sink to the cushion
// it slides off the front of his face and drops onto the seat beside him (round his body, never through it)
prop(1.3, "phone", { x: 0.18, y: 0.98, z: -0.86, rot: 170, tip: -80 }, 0.35, "inOut");
prop(1.66, "phone", { ...PH_SEAT, y: r3(SEAT + 0.006) }, 0.4, "in");
A(1.3, "spud", "grip", { side: "L", shape: "open", dur: 0.25 });
arms(1.3, [0.05, 0.38, 0.32], 0.3, "inOut"); arms(1.62, [0.3, 0.05, 0.12], 0.9, "inOut");
A(1.95, "spud", "face", { lid: 0.3, dur: 0.3 });
expr(1.95, "annoyed", { eye: 0.7 }, 0.3); look(1.95, [0, 0.1], 0.3);
see(0, T.g2, ["spud.face", "phone"], "frame 0: you on the sofa, the phone held over your face; the counter reads 1 g");
see(T.g2, T.g3, ["spud.face"], "2 g: the phone slams onto his face");

// ================================================================ 6-11 3 g: rocket launch strain
expr(T.g3, "angry", { eye: 0.5, open: 0.25, curve: -0.6 }, 0.15);
A(T.g3, "spud", "face", { lid: 0.4, dur: 0.15 });
for (let k = 0; k < 6; k++) A(r3(T.g3 + 0.6 + k * 0.7), "spud", "squash", { amount: 0.03, dur: 0.35 });   // breath against the weight
sfx(r3(T.g3 + 0.1), "ai-package/flat-exhale", { gain: 0.5, reason: "he pushes air out under 3 g" });
sfx(r3(T.g3 + 0.2), "kenney/cloth", { gain: 0.35, reason: "the sweater rubs on the sofa" });
see(T.g3, T.g4, ["spud.face"], "3 g: teeth gritted, pressed into the cushion");

// ================================================================ 11-16 4 g: the picture goes grey, heavy lids
expr(T.g4, "deadpan", { eye: 0.55 }, 0.4);
A(T.g4, "spud", "face", { lid: 0.55, dur: 0.6 });
A(T.g4, "spud", "droop", { to: 0.5, dur: 0.6 });
sfx(T.g4, "ai/heartbeat", { gain: 0.35, dur: 5, reason: "his pulse, slow and heavy" });
see(T.g4, T.g5, ["spud.face"], "4 g: grey picture, heavy lids");

// ================================================================ 16-21 5 g: tunnel vision on his face, black at 19.5, slump
expr(T.g5, "terrified", { open: 0.35 }, 0.15);
A(T.g5, "spud", "face", { lid: 0, dur: 0.12 });
look(T.g5, [0.15, 0.05], 0.15); look(17.3, [-0.15, 0.05], 0.2); look(18.4, [0, 0], 0.2);
prop(T.g5, "tunB", { r: 1650, feather: 84 }, 0, "linear");
prop(r3(T.g5 + 0.01), "tunB", { r: 238 }, 1.74, "out");
prop(17.75, "tunB", { r: 126, feather: 40 }, 1.15, "inOut");
prop(18.9, "tunB", { r: 0, feather: 0 }, 0.6, "in");
prop(19.8, "tunB", { r: 2000, feather: 84 }, 0, "linear");
sfx(T.g5, "ai/heartbeat", { gain: 0.6, dur: 3.6, reason: "his pulse loud in the tunnel" });
// slump (hidden by the black, shown from the cut at 19.8): eyes shut, sprout flat, sinking back
A(T.slump, "spud", "face", { lid: 1, dur: 0.3 });
expr(T.slump, "serene", { curve: -0.1 }, 0.3);
A(T.slump, "spud", "droop", { to: 0.9, dur: 0.4 });
A(T.slump, "spud", "lean", { to: -10, dur: 0.5, ease: "out" });
arms(T.slump, [0.36, -0.05, 0.08], 0.5, "out");
sfx(T.slump, "kenney/cloth", { gain: 0.8, reason: "his sweater slides on the sofa as he slumps" });
sfx(r3(T.slump + 0.25), "ai/cushion-poof", { gain: 0.45, reason: "he drops into the cushion" });
see(T.g5, T.slump, ["spud.face"], "5 g: the picture closes to a hole on his face");
see(19.8, T.wake, ["spud"], "he has blacked out, slumped back on the sofa");

// ================================================================ 21-26 10 g: lying flat, blood back, he wakes; the sofa legs break
A(T.wake, "spud", "face", { lid: 0, dur: 0.12 });
expr(T.wake, "shocked", { eye: 1.15, curve: -0.4 }, 0.12);
A(T.wake, "spud", "lean", { to: 0, dur: 0.3 });
look(T.wake, [0, 0.1], 0.1); look(23.2, [-0.3, -0.35], 0.25); look(24.6, [0, 0.1], 0.2);
prop(T.wake, "sofa", { damage: 1 }, 0.8, "out");
sfx(T.wake, "ai/surface-gasp", { gain: 0.5, reason: "his breath comes back as he wakes" });
sfx(r3(T.wake + 0.15), "ai/branch-snap", { gain: 0.6, reason: "the front sofa legs crack" });
sfx(r3(T.wake + 0.45), "ai/branch-snap", { gain: 0.5, reason: "the second leg cracks" });
sfx(r3(T.wake + 0.6), "kenney/impact-wood-heavy", { gain: 0.6, reason: "the floor boards creak and split under the feet" });
see(T.wake, T.g15, ["spud.face", "sofa"], "10 g: awake again, pressed flat; the sofa legs splay and the floor cracks");

// ================================================================ 26-31 15 g: the tower across the street cracks and falls
expr(T.g15, "shocked", { open: 0.3, eye: 1.1 }, 0.15); look(T.g15, [0.4, 0.3], 0.2);
prop(T.g15, "tower", { fall: 1 }, 3.5, "linear");
sfx(r3(T.g15 + 0.2), "ai/glass-smash", { gain: 0.45, reason: "the tower's glass breaks across the street, heard through our window" });
sfx(r3(T.g15 + 0.9), "ai/thunder", { gain: 0.85, dur: 3.2, reason: "concrete floors slam down, a deep rumble through the glass" });
sfx(r3(T.g15 + 1.4), "ai/metal-tear", { gain: 0.3, reason: "the steel frame tears" });
see(T.g15, T.g20, ["tower"], "15 g: the glass tower across the street cracks and collapses straight down in dust");

// ================================================================ 31-36 20 g: the clouds sink to the street
expr(T.g20, "shocked", { open: 0.25 }, 0.2); look(T.g20, [0, -0.3], 0.3);
prop(T.g20, "clouds", { sink: 1 }, 3.4, "inOut");
prop(T.g20, "tower", { dust: 0.35 }, 2.0, "inOut");
sfx(T.g20, "ai/storm-wind", { gain: 0.12, dur: 5, reason: "wind presses on the window as the air sinks" });
see(T.g20, T.g25, ["clouds"], "20 g: the clouds sink into a sea at street level; tall roofs stick out");

// ================================================================ 36-41 25 g: pancake flat, a wink: "good thing you're a potato"
expr(T.g25, "kind", { curve: 0.4 }, 0.2); look(T.g25, [0, 0], 0.15);
expr(39.2, "smug", { curve: 0.8 }, 0.2);
A(39.25, "spud", "face", { lidR: 1, lidL: 0.1, dur: 0.12 });
A(40.4, "spud", "face", { lidR: 0, lidL: 0, dur: 0.15 });
sfx(T.g25, "kenney/cloth", { gain: 0.35, reason: "his knit rubs as he settles flatter" });
sfx(39.1, "ai-package/flat-exhale", { gain: 0.7, reason: "a small breath out before the wink" });
see(T.g25, T.g30, ["spud.face"], "25 g: pancake flat, a calm wink on 'Good thing you're a potato'");

// ================================================================ 41-46 30 g: satellites burn across the sky
expr(T.g30, "shocked", { open: 0.3, eye: 1.1 }, 0.15); look(T.g30, [0, 0.6], 0.2);
prop(0, "sats", { t: -1 }, 0, "linear"); prop(0, "sats2", { t: -1 }, 0, "linear");
prop(T.g30, "sats", { t: 0 }, 0, "linear"); prop(r3(T.g30 + 0.01), "sats", { t: 5 }, 4.99, "linear");
prop(T.g30, "sats2", { t: -1.4 }, 0, "linear"); prop(r3(T.g30 + 0.01), "sats2", { t: 3.6 }, 4.99, "linear");
sfx(r3(T.g30 + 0.9), "ai/thunder", { gain: 0.2, dur: 2.5, reason: "distant reports through the glass as they burn in" });
see(T.g30, T.g35, ["sats"], "30 g: every satellite falls, burning trails across the dusk sky");

// ================================================================ 46-51 35 g: thick air, haze, he gasps
expr(T.g35, "terrified", { open: 0.7 }, 0.15); look(T.g35, [0, 0.15], 0.2);
prop(T.g35, "haze", { haze: 0.7 }, 1.8, "inOut");   // 1 hides him on shot B
for (const g of [46.15, 47.35, 48.55, 49.75]) { A(g, "spud", "squash", { amount: 0.05, dur: 0.5 }); sfx(g, "ai/surface-gasp", { gain: 0.55, reason: "he gasps for air in the thick haze" }); }
see(T.g35, T.g40, ["spud.face"], "35 g: the air thickens to a haze, he gasps");

// ================================================================ 51-56 40 g: the Alps crumble on the TV news
prop(T.g40, "tv", { crumble: 1 }, 3.6, "inOut");
prop(T.g40, "haze", { haze: 0.45 }, 1.0, "inOut");
sfx(r3(T.g40 + 0.2), "ai/thunder", { gain: 0.45, dur: 3.5, reason: "the avalanche's roar from the TV speaker" });
see(T.g40, T.g45, ["tv"], "40 g: on the TV news the Alps slump and avalanche");

// ================================================================ 56-61 45 g: the Moon, low and huge
expr(T.g45, "shocked", { open: 0.4, eye: 1.2 }, 0.15); look(T.g45, [0, 0.7], 0.2);
prop(T.g45, "moon", { moon: 0.5 }, 0, "linear");
prop(r3(T.g45 + 0.01), "moon", { moon: 0.7 }, 4.98, "in");
prop(T.g45, "haze", { haze: 0.25 }, 0.6, "inOut");
sfx(T.g45, "kenney/impact-glass-light", { gain: 0.3, reason: "the window glass flexes" });
sfx(r3(T.g45 + 1.5), "kenney/impact-plate-light", { gain: 0.25, reason: "the TV cabinet rattles" });
see(T.g45, T.g50, ["moon"], "45 g: the Moon hangs huge and low over the city");

// ================================================================ 61-65.5 50 g: the Moon fills the window and cracks; black
prop(T.g50, "moon", { moon: 0.86 }, 0, "linear");
prop(r3(T.g50 + 0.01), "moon", { moon: 1 }, 3.6, "in");
prop(r3(T.g50 + 0.1), "moon", { cracks: 1 }, 3.5, "in");
sfx(r3(T.g50 + 0.4), "ai/screen-crack", { gain: 0.35, reason: "the window frame ticks under the strain" });
sfx(r3(T.g50 + 1.6), "kenney/impact-wood-heavy", { gain: 0.45, reason: "the floor cracks under the sofa" });
sfx(r3(T.g50 + 2.2), "ai/thunder", { gain: 0.35, dur: 2.0, reason: "a low vibration through the building" });
prop(T.black, "tunE", { r: 0, feather: 0 }, 0, "linear");
see(T.g50, T.black, ["moon"], "50 g: the Moon fills the window, cracking");

// ================================================================ 66.5-69 1 g: back to normal; the cushion flings the phone back into his hands
prop(T.g1, "tunE", { r: 2000, feather: 84 }, 0, "linear");
for (const [id, set] of [["tower", { fall: 0, dust: 1 }], ["clouds", { sink: 0 }], ["moon", { moon: 0, cracks: 0 }], ["sats", { t: -1 }], ["sats2", { t: -1 }], ["haze", { haze: 0 }], ["tv", { crumble: 0 }], ["sofa", { damage: 0 }]]) prop(T.g1, id, set, 0, "linear");
A(T.g1, "spud", "flat", { to: 0, dur: 0.16, ease: "back" });
A(T.g1, "spud", "pitch", { to: PER[0].pitch, dur: 0.25, ease: "out" });
sinkTo(T.g1, PER[T.g50].sink, 0.16);
A(T.g1, "spud", "droop", { to: 0, dur: 0.3, ease: "back" });
A(T.g1, "spud", "face", { lid: 0, dur: 0.1 });
expr(T.g1, "shocked", { open: 0.45, eye: 1.25 }, 0.1); look(r3(T.g1 + 0.1), [0, 0.1], 0.1);
sfx(T.g1, "ai/cushion-poof", { gain: 0.5, reason: "he pops back round, the sofa sighs" });
look(67.6, [0.35, -0.3], 0.25);   // he spots the phone on the seat
// 68.27 the dented cushion springs back and flings the phone up; he raises his hands and it lands in them (= frame 0)
prop(T.fling, "sofa", { sink: PER[0].sink }, 0.28, "out");
sinkTo(T.fling, PER[0].sink, 0.28);
prop(T.fling, "phone", { x: 0.3, y: 1.5, z: -0.95, rot: 182, tip: -25 }, 0.36, "out");   // up off the seat, over to his raised left hand
prop(r3(T.fling + 0.36), "phone", PH_HELD, r3(END - T.fling - 0.37), "in");
HOLD(68.05, 0.8, "inOut");
look(68.3, [0.2, 0.45], 0.15); look(68.65, [0, 0.35], 0.2);
expr(68.6, "kind", { eye: 0.85 }, 0.3);
sfx(T.fling, "ai/cushion-poof", { gain: 0.4, reason: "the cushion springs back up" });
sfx(68.9, "grab", { gain: 0.4, reason: "the phone lands in his hands" });
see(T.g1, END, ["spud.face", "phone"], "1 g again: the room is whole, the phone flies back into his hands (the loop)");

// ---------------------------------------------------------------- shots, one per panel
const beats = c.beats([
  ["P01 2 g: the phone slams onto your face", 0, push("A", T.g3), "hook"],
  ["P02 3 g: rocket launch", T.g3, push("A2", 5)],
  ["P03 4 g: the picture greys", T.g4, push("A2", 5, 0.1)],
  ["P04 5 g: tunnel vision, black", T.g5, camOnly("B4")],
  ["P05 the blackout: slumped", 19.8, camOnly("A")],
  ["P06 10 g: lying flat, the sofa legs break", T.wake, push("A6", 5)],
  ["P07 15 g: the tower falls", T.g15, push("C7", 5, 0.04)],
  ["P08 20 g: the clouds sink", T.g20, push("C8", 5, 0.04)],
  ["P09 25 g: good thing you're a potato", T.g25, push("B9", 5, 0.08), "payoff"],
  ["P10 30 g: satellites fall", T.g30, push("C10", 5, 0.04)],
  ["P11 35 g: thick air", T.g35, push("B11", 5, 0.06)],
  ["P12 40 g: the Alps on TV", T.g40, push("D12", 5, 0.1)],
  ["P13 45 g: the Moon", T.g45, push("C13", 5, 0.04)],
  ["P14 50 g: the Moon cracks, black", T.g50, camOnly("C14")],
  ["P15 1 g: back to normal, the phone loops", T.g1, camOnly("A")],
], END);

// ---------------------------------------------------------------- the grade (DESIGN.md section 8)
const grade = [[0, { s: 1.1 }], [10.97, { s: 1.1 }], [T.g4, { s: 0.07 }, 0.38], [15.97, { s: 0.07 }], [T.g5, { s: 1.0 }], [45.97, { s: 1.08 }],
  [T.g35, { s: 0.84 }, 1.8], [50.97, { s: 0.84 }], [T.g40, { s: 1.0 }], [T.g45, { s: 1.1 }], [T.g1, { s: 1.1 }]];

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
  sound: { signature: false, sfx: 0.65, ambience: 0.05, surface: "wood", room: "small", guard: true, level: -9.7 },
  creative: { length: [END, END] },
  hook: { show: ["spud", "phone"], hint: 0, what: "you on the sofa, phone over your face, the counter at 1 g and the question on screen; at 1.0 s the phone slams down" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "sofa", from: 0, to: END, checks: ["shell", "clipping", "arm-in-prop", "costume-in-prop", "hand-in-prop", "limb-in-prop"], reason: "he sits sunk into the sofa: gravity presses him into the cushion (the dip is drawn by the sofa's sink); his widening body spreads into the seat and back cushion" },
    { who: "spud", with: "spud", from: 36.0, to: 66.5, checks: ["payoff-face"], reason: "25 g: pancake flat, his rolled collar spreads over his mouth; the wink (the payoff) is in the eyes, which stay clear" },
    { who: "spud", with: "phone", from: 0.9, to: 2.1, checks: ["shell", "clipping"], reason: "the phone lies on his face after the 2 g slam, then slides off" },
  ],
  notes: "Generated by storyboards/series/facts/02-gravity/make-gravity.mjs.",
});
