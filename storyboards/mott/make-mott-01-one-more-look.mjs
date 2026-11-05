// MOTT 01: ONE MORE LOOK (5 Nov 2026). Mott the moth's first clip: a standalone character, not a PotatoBrawl
// fighter (Jonny, 5 Nov: "a character separate from the potato idea"). Design sheet:
// /mnt/project-files/characters/new-character-01/mott-design-sheet-v0.png. Mott is a prop (engine/page/props-mott.js),
// so this clip has no cast at all.
// node storyboards/mott/make-mott-01-one-more-look.mjs -> mott-01-one-more-look.json
//
// THE BRIEF
//   Joke:        3 AM. Mott swore he'd sleep early ("NO PHONE!"); the phone lights up and he can't resist.
//   Wants:       to sleep like a normal person.
//   Consequence: he fights it, loses, drifts to the light hypnotised and flies face first into the screen: "tink".
//   Ending:      4 AM, asleep slumped against the glowing phone, his own note stuck on his head, his dust print on
//                the screen; it pings once more, his antennae swivel to it in his sleep, and his eyes pop open.
//   Callback:    the opening promise ("I'll sleep early") answered by 4 AM and the note on his head.
//
//   1 0.00-2.00  3 AM: the phone already buzzing and glowing on the nightstand; Mott in bed snaps his antennae to it,
//                squeezes his eyes shut and turns away (nope), but his antennae keep pointing at it   (buzz, notify)
//   2 2.00-3.00  LOCK-ON (close): he turns back, the light fills his eyes, mouth "o"                 (hum)
//   3 3.00-4.60  DRIFT: wings open, he rises out of bed and floats to the light, hypnotised          (wing beats)
//   4 4.60-6.00  BONK: face first into the screen, "tink", a puff of wing dust; he slides down, turns round dazed and
//                leans back against it, blissed out; the note flutters off the wall onto his head  (tink, poof, flutter)
//   5 6.00-10.0  4 AM: asleep against the phone, the print on the screen; ping: the antennae swivel back to it in his
//                sleep; then both eyes snap open with the light in them                                  (notify)
import { clip, write, frame, r3, SUB_POS } from "../lib/clip.mjs";
import { ENERGY as E } from "../../engine/page/set-energy.js";
import { RAIL_Y, MATTRESS as M } from "../../engine/page/props-energy.js";

const c = clip({ faces: "strong" }), { sfx, cap, see } = c;
const P = (t, set, dur = 0.3, ease = "inOut") => c.prop(t, "mott", set, dur, ease);
const END = 10.0;
const R = 0.2;                                   // Mott's body radius

// ---------------------------------------------------------------- places (set-energy.js: the bed left, nightstand)
// the bed 12 cm further from the nightstand than the set puts it, so his wings and antennae clear the headboard as he
// dives into the phone
const BED = [E.bed[0] - 0.12, E.bed[1]], ST = E.stand, TOP = 0.5;      // TOP: the nightstand's top
const MAT = [BED[0] - M.w / 2, RAIL_Y, BED[1]];
// the phone stands up on the nightstand, leaning back a little, its screen turned toward the bed and the camera
const PH = { x: r3(ST[0] - 0.1), y: TOP, z: r3(ST[1] + 0.02), rot: 12, tip: -10, scale: 2.4 };
const rad = (d) => (d * Math.PI) / 180;
// a point on the phone's screen (u across, v up its face, 0..1) pushed out of the glass by `out` metres
function onScreen(u, v, out = 0.004) {
  const s = PH.scale, lx = (u - 0.5) * 0.068 * s, ly = (0.0775 + (v - 0.5) * 0.138) * s, lz = 0.0062 * s + out;
  const cx = Math.cos(rad(PH.tip)), sx = Math.sin(rad(PH.tip));
  const y1 = ly * cx - lz * sx, z1 = ly * sx + lz * cx;                    // tip round x
  const cy = Math.cos(rad(PH.rot)), sy = Math.sin(rad(PH.rot));
  return [r3(PH.x + lx * cy + z1 * sy), r3(PH.y + y1), r3(PH.z - lx * sy + z1 * cy)];
}
const PRINT = onScreen(0.5, 0.62, 0.003);
const IN_BED = [r3(BED[0] + 0.3), r3(RAIL_Y + M.d + R * 0.95), r3(BED[1] + 0.15)];
const UP = [-0.3, 1.0, -1.3];
const OVER = [0.02, 0.92, -1.5];
const HIT = onScreen(0.5, 0.55, R * 0.95);                                  // his body's middle when his face hits
const SLUMP = onScreen(2.2, 0.0, R * 0.9); SLUMP[1] = r3(TOP + R * 0.98);   // sitting beside the phone, leaning on its edge, the screen at his side
// the promise on the wall just above the phone, so frame 0 shows both (Fable review A)
const NOTE_WALL = [-0.1, 0.98, r3(E.wallZ + E.thick / 2 + 0.012)];
const NOTE_HEAD = [r3(SLUMP[0] + 0.01), r3(SLUMP[1] + R * 0.98), r3(SLUMP[2] + R * 0.45)];

const props = [
  { id: "frame", kind: "bedframe", x: BED[0], z: BED[1] },
  { id: "mat", kind: "tipmattress", x: MAT[0], y: MAT[1], z: MAT[2], cover: 0, blanket: "#8a5fa8", stripe: "#b48ad0" },
  { id: "stand", kind: "nightstand", x: ST[0], z: ST[1] },
  { id: "phone", kind: "phone", ...PH, case: "#5a6fb0", glow: 1, bright: 1.4, faceLight: 4, faceReach: 2.6, faceColor: "#cfe6ff", halo: 0.5, haloK: 0.6 },
  { id: "print", kind: "dustprint", x: PRINT[0], y: PRINT[1], z: PRINT[2], rot: PH.rot, tip: r3(90 + PH.tip), size: 0.11 },
  { id: "note", kind: "stickynote", x: NOTE_WALL[0], y: NOTE_WALL[1], z: NOTE_WALL[2], text: "NO\nPHONE!", size: 0.15, rot: 0 },
  { id: "mott", kind: "mott", x: IN_BED[0], y: IN_BED[1], z: IN_BED[2], r: R, rot: 18, open: 0.15, lookX: 0.6, lookY: -0.2, bob: 0, glow: 0.35, hope: 0.4 },
];

// ---------------------------------------------------------------- 1 3 AM 0-2.0: the phone is already going
const CAP_Y = 1170;
const buzz = (t0, n) => { for (let i = 0; i < n; i++) c.prop(t0 + i * 0.08, "phone", { x: r3(PH.x + (i % 2 ? -0.006 : 0.006)) }, 0.04, "linear"); c.prop(t0 + n * 0.08, "phone", { x: PH.x }, 0.04); };
buzz(0, 6); sfx(0, "notify", { gain: 0.12, reason: "the phone lights up at 3 AM" });
P(0, { hope: 1, lookX: 1, lookY: -0.1, glow: 0.6, mouth: 0 }, 0.18, "out");   // the antennae snap to it
P(0.55, { squint: 1, sad: 1, glow: 0 }, 0.15);                                  // nope: eyes shut tight
P(0.6, { rot: -40, bank: 8 }, 0.35, "out");                                      // turns his back on it...
c.textPop(0.75, null, "nope.", { xy: [330, 860], dur: 0.8, color: "#ffffff", angle: -6, size: 96 });
P(1.0, { lookX: 1.4 }, 0.2);                                                       // ...but the antennae keep pointing at it
buzz(1.05, 5); sfx(1.05, "notify", { gain: 0.11, reason: "it pings again" });
P(1.45, { squint: 0.55 }, 0.2);                                                   // one peek
P(1.75, { squint: 0, sad: 0, rot: 18, bank: 0, lookX: 1, glow: 0.7 }, 0.25, "out");   // he turns back to it
// captions low (CAP_Y, under Mott in the wide), clear of the title Jonny adds at the top in the app; "3 AM." on the second ping sets up "4 AM."
cap(0, 1.0, "Me: I'll sleep early tonight.", CAP_Y, false, { kinetic: false });
cap(1.05, 2.0, "3 AM."   /* on the second ping (review B) */, CAP_Y, false, { kinetic: false });
see(0, 2.0, ["mott", "phone"], "3 AM: the phone glowing beside Mott in bed");

// ---------------------------------------------------------------- 2 LOCK-ON 2.0-3.0 (close)
P(2.0, { lid: 0.5, glow: 0.3, lookX: 0.4, hope: 0.6 }, 0);   // the close-up opens on heavy lids... (review B)
P(2.12, { glow: 1, mouth: 0.6, lid: 0 }, 0.1, "out");          // ...that snap open as the light fills his eyes
P(2.2, { lookX: 1.4, hope: 1 }, 0.6);                          // the antennae swing to the phone across the shot
sfx(2.05, "sharkhum", { gain: 0.07, reason: "Mott's hypnotised little hum as the light fills his eyes" });
see(2.0, 3.2, ["mott"], "the lock-on: the light in his eyes");

// ---------------------------------------------------------------- 3 DRIFT 3.0-4.6
// lift-off: he rises off the blanket first, then the wings open (opening low swept the hind wings into the mattress)
// (the lift starts 0.2 s into the drift shot, so the viewer has found him before he moves)
P(3.2, { y: r3(IN_BED[1] + 0.12) }, 0.1, "out");
P(3.25, { open: 1, flap: 0.7, bob: 1 }, 0.3, "out");
sfx(3.2, "wings", { gain: 1.2, dur: 1.4, reason: "his wing beats as he floats to the light" });
P(3.3, { x: UP[0], y: UP[1], z: UP[2], rot: 30 }, 0.6, "inOut");
P(3.9, { x: OVER[0], y: OVER[1], z: OVER[2], rot: 60, lean: 10 }, 0.4, "inOut");
// the last stretch: he speeds up and turns his face into the screen
P(4.3, { x: HIT[0], y: HIT[1], z: HIT[2], rot: r3(PH.rot + 180), lean: 0, open: 0.25, lookX: 0, lookY: -1, hope: 0 }, 0.3, "in");   // the dive: wings half up, clear of the headboard, antennae swept back like a diving moth's
see(3.2, 4.6, ["mott"], "he floats up off the bed");
see(3.8, 4.6, ["mott", "phone"], "he floats to the light");

// ---------------------------------------------------------------- 4 BONK 4.6-6.0 (the payoff)
const T_HIT = 4.6;
sfx(T_HIT, "tink", { gain: 1.6, loud: true, reason: "Mott's face hits the phone's glass" });
sfx(T_HIT + 0.02, "poof", { gain: 0.45, reason: "a puff of wing dust" });
c.at(T_HIT, { fx: "shake", dur: 0.15, amp: 0.02 });
c.hitStop(T_HIT, 3);
P(T_HIT, { puff: 1, flap: 0, bob: 0, mouth: 0 }, 0.7, "linear");
P(T_HIT, { open: 0.9 }, 0.04, "out");   // splat: wings flung flat against the glass for the hit-stop (review B)...
P(T_HIT + 0.12, { open: 0 }, 0.24, "out");   // ...then they snap shut over his back as he peels off
P(T_HIT, { squint: 1, glow: 0 }, 0.08, "out");
P(T_HIT, { curl: 1 }, 0.05, "out"); P(T_HIT + 0.25, { curl: 0 }, 0.35, "out");   // squashed flat on the glass, then back
c.prop(T_HIT, "print", { on: 1 }, 0.1);
c.textPop(T_HIT + 0.02, null, "tink!", { xy: [820, 560], dur: 0.5, color: "#ffd6e0", angle: 8, size: 120 });
// he slides down the glass, turns round dazed and leans back against it, blissed out in the glow
// he bounces back off the glass toward us, squashed and dizzy, then drops onto the nightstand beside it
const BOUNCE = onScreen(0.6, 0.6, R * 0.95 + 0.2);
P(T_HIT + 0.1, { x: BOUNCE[0], y: r3(BOUNCE[1] + 0.06), z: BOUNCE[2], rot: r3(PH.rot + 10), bank: -18, hope: 1, lookY: 0.3 }, 0.32, "out");   // the antennae boing forward again
P(5.1, { x: SLUMP[0], y: SLUMP[1], z: SLUMP[2], rot: r3(PH.rot - 26), bank: 12 }, 0.45, "inOut");   // turned so neither closed wing is edge-on to us
P(5.55, { squint: 0, lid: 0.55, happy: 1, hope: 0.2, wilt: 0.4, lean: -8 }, 0.3);
// the shake shakes the note loose: it hangs by its top edge, lets go, flutters down in front of him and lands on his head
c.prop(4.65, "note", { wag: 1 }, 0.1);
// it peels up and out, then tumbles down in an arc onto his head (review B: a fall the eye can follow)
c.prop(5.0, "note", { x: -0.02, y: 1.06, z: -2.08, tip: -70 }, 0.15, "out");
c.prop(5.15, "note", { x: 0.25, y: 0.93, z: -1.72, rot: 60, tip: -30, tilt: 20 }, 0.3, "in");
c.prop(5.45, "note", { x: NOTE_HEAD[0], y: NOTE_HEAD[1], z: NOTE_HEAD[2], rot: 25, tip: -55, tilt: 8 }, 0.25, "out");
c.prop(5.9, "note", { wag: 0 }, 0.1);
sfx(5.0, "flutter", { gain: 0.35, reason: "the sticky note flutters down" });
see(T_HIT, 6.0, ["mott", "phone"], "tink: face first into the screen");
see(5.3, 6.0, ["mott", "note"], "the note lands on his head");

// ---------------------------------------------------------------- 5 4 AM 6.0-10.0
const T4 = 6.0;
P(T4, { lid: 1, happy: 0.6, wilt: 0.8, hope: 0, lookX: 0, lookY: 0, bank: 14, lean: -6 }, 0);
P(T4, { breath: 1 }, 0);
c.textPop(6.4, null, "z", { xy: [840, 800], dur: 0.9, color: "#dfe8ff", angle: 8, size: 80 });
c.textPop(6.95, null, "zZ", { xy: [880, 740], dur: 0.9, color: "#dfe8ff", angle: 10, size: 92 });
cap(T4, 7.6, "4 AM.", 470, false, { kinetic: false });   // above his head in the close-up (low, it sat on his face), under the in-app title
// the phone locks itself: the room goes dark round him and he sinks deeper, safe at last
c.prop(T4, "phone", { glow: 0.12 }, 0);   // the cut to 4 AM finds it already locked: the dark room is the time jump (review B)
P(6.3, { wilt: 1 }, 0.5);   // (no lean back: it tipped his closed wings into the wall)
const T_PING = 7.4;
// ...and the ping lights it again: the light sweeping his face is what wakes the antennae
buzz(T_PING, 5); sfx(T_PING, "notify", { gain: 0.14, reason: "the phone pings at 4 AM and lights up" });
c.prop(T_PING, "phone", { glow: 1 }, 0.06, "out");
P(T_PING + 0.08, { wilt: 0, hope: 1, lookX: -0.7, lookY: 0.6, breath: 0 }, 0.22, "out");   // the antennae swivel back to it, asleep
P(8.1, { lid: 0, glow: 1, happy: 0, mouth: 0.5 }, 0.12, "out");                  // eyes snap open, the light in them
P(8.5, { lean: 8 }, 0.35, "out");                                                 // and he leans in: frame 0's snap to the light, again
see(T4, END, ["mott", "phone", "note"], "4 AM: asleep against the phone, the note on his head");

// ---------------------------------------------------------------- shots
const WIDE = frame([-0.38, 0.6, -1.75], { az: 10, el: 14, h: 2.4, fov: 34 });   // Mott, the phone and the note all in the safe zone
const LOCK = frame([IN_BED[0] - 0.04, IN_BED[1] + 0.06, IN_BED[2]], { az: 26, el: 10, h: 0.85, fov: 30, push: 0.12, dur: 1.2 });
// the drift: the camera pans with him from the bed to the light
const DRIFT_A = frame([-0.5, 0.85, -1.45], { az: 34, el: 14, h: 1.8, fov: 34 }), DRIFT_B = frame([-0.06, 0.78, -1.8], { az: 34, el: 14, h: 1.6, fov: 34 });
const DRIFT = { ...DRIFT_A, to: { pos: DRIFT_B.pos, look: DRIFT_B.look }, dur: 1.25, ease: "inOut" };
const DAZED = frame([SLUMP[0] - 0.14, SLUMP[1] + 0.14, SLUMP[2]], { az: 32, el: 14, h: 1.3, fov: 32 });
const FOUR = frame([SLUMP[0] - 0.05, SLUMP[1] + 0.12, SLUMP[2]], { az: 12, el: 8, h: 1.15, fov: 30, push: 0.12, dur: 4.0 });
const beats = c.beats([
  ["3 am", 0, WIDE, "hook"],
  ["lock-on", 2.0, LOCK],
  ["drift", 3.2, DRIFT],
  ["bonk", T_HIT, "keep", "payoff"],
  ["dazed", 5.05, DAZED],
  ["4 am", T4, FOUR, "reaction"],
], END);

write(import.meta.url, {
  id: "mott-01-one-more-look",
  title: "Mott: one more look",
  cover: 2.5,
  idea: "Mott the moth's first clip: 3 AM, the phone lights up, he can't resist, flies face first into the screen and is still there at 4 AM",
  fps: 30, look: "anime-pro", profile: "short", loop: false, captionStyle: "kinetic",
  exposure: 0.5,   // a dark 3 AM room, so the phone is the brightest thing in it
  cleanStart: true,
  // the engine's current look (Jonny 5 Nov): light 2 (edge light, contact shading, the "halfway" shade) and the whole
  // frame sharp; Mott himself is drawn like the sheet cast (props-mott.js, looks.js role "drawn")
  set: { type: "energyroom", night: true, seed: 6, aperture: 0, lighting: 2, hatch: { scale: 1.3, boil: 0.25, k: 0.6 } },   // hatching tuned for the re-encode (docs/STORYBOARD.md)
  music: { style: "warm", lowCut: 150, gain: 0.3, seed: 501 },
  sound: { sfx: 0.7, ambience: 0.15, speech: false, signature: false, surface: "wood", guard: true },
  creative: { length: [10, 10] },
  hook: { show: ["mott", "phone"], hint: 0, what: "3 AM: the phone lights up beside Mott in bed" },
  cast: [], props, captions: c.captions, beats, visible: c.visible, ...(c.hitStops.length && { hitStop: c.hitStops }),
  notes: "Generated by storyboards/mott/make-mott-01-one-more-look.mjs. Mott is a prop (engine/page/props-mott.js). Title added in TikTok's text tool.",
});
