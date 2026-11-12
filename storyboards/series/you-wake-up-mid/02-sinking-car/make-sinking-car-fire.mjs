// You wake up mid EP02, THE NEXT ONE (the loop into EP03): "You wake up and your house is burning."
// Jonny 12 Nov 18:56 Berlin on rough draft 1: "the house fire isnt a burning house. and the phrase should be you wake
// up and your house is burning". The lake clip is one set (stormlake), so the bedroom is its own short clip in the
// energyroom set (Reaper's bedroom from Too Much Energy, at night) and is joined after wake-up-mid-sinking-car.
// Reuses: energyroom, bedframe, tipmattress, nightstand, digiclock, winglass, firecurtain, outglow (props-energy),
// flames (props3d), cabinsmoke (props-wakeup-fx). No new design.
//
// Jonny 19:55 on draft 2: "the character has no legs" (sitting in bed, the blanket hid them) and "the music is friendly
// in a dangerous scene" -> he wakes in first person, then stands by the bed, whole body in shot; the episode's
// orchestra bed (disaster-04) runs on from the lake clip.
// 0.00  first person from his pillow, eyes opening: the curtains and the window on fire, smoke under the ceiling
// 0.80  Spud on his feet in front of the bed, terrified, the fire behind him; the smoke alarm beeps throughout
import { readFileSync } from "node:fs";
import { clip, write, frame, r3, SUB_STYLE } from "../../../lib/clip.mjs";
import { ENERGY as E } from "../../../../engine/page/set-energy.js";
import { RAIL_Y, MATTRESS as M } from "../../../../engine/page/props-energy.js";

const LINES = { sub: true, blink: false, pos: 470 };
const c = clip({ faces: "strong", lines: LINES }), { A, see } = c;
const WL = readFileSync(new URL("../../../../assets/sfx/whitelist.json", import.meta.url), "utf8");
const sfx = (t, name, o) => (name.startsWith("ai/") && !WL.includes(`"${name}"`) ? null : c.sfx(t, name, o));
const narr = (t, line, dur, chunks, y = LINES.pos, tail = 0.25) => {
  c.at(t, { macro: "narrate", line, voice: "narrator", caption: false });
  const n = chunks.reduce((k, x) => k + x.length, 0); let a = t;
  chunks.forEach((text, i) => { const b = i === chunks.length - 1 ? t + dur + tail : a + (dur * text.length) / n; c.cap(r3(a), r3(b), text, y, false, SUB_STYLE); a = b; });
};

const LINE_DUR = 2.45;   // estimate until the narrator reads it (the render measures; adjust after the first draft)
const T = { up: 0.8, look: 1.3, line: 0.2 };
const END = r3(T.line + LINE_DUR + 0.25 + 0.75);

const BED = E.bed, WZ = E.wallZ, WIN_X = (E.win.x0 + E.win.x1) / 2;
const MAT = [BED[0] - M.w / 2, RAIL_Y, BED[1]];
const STAND = [0.55, -0.55];   // on the floor beside the bed (the bed would hide his legs), facing the camera
const POV = { pos: [-0.85, 1.1, -1.25], look: [0.6, 1.2, -2.3], fov: 66 };   // from his pillow toward the burning window
const cast = [{ id: "spud", character: "potatobrawl/spud", at: STAND, face: "camera", expr: "terrified", follow: 0.3, seed: 2.9 }];
const props = [
  { id: "frame", kind: "bedframe", x: BED[0], z: BED[1] },
  { id: "mat", kind: "tipmattress", x: MAT[0], y: MAT[1], z: MAT[2], cover: 1 },
  { id: "stand", kind: "nightstand", x: E.stand[0], z: E.stand[1] },
  { id: "clock", kind: "digiclock", x: E.stand[0], y: 0.5, z: E.stand[1] + 0.06, scale: 1.25, text: "03:12" },
  { id: "glass", kind: "winglass", x: WIN_X, y: E.win.y0, z: WZ - 0.075, w: E.win.x1 - E.win.x0, h: E.win.y1 - E.win.y0 },
  { id: "curtL", kind: "firecurtain", x: E.win.x0 - 0.2, y: 0.55, z: WZ + 0.08, w: 0.32, h: 1.3, edge: 1 },
  { id: "curtR", kind: "firecurtain", x: E.win.x1 + 0.2, y: 0.12, z: WZ + 0.08, w: 0.34, h: 1.73, edge: -1 },
  { id: "glow", kind: "outglow", x: WIN_X, y: 1.05, z: WZ - 0.7, w: 1.9, h: 1.9 },
  // the fire spreading along the bottom of the back wall and the right wall
  { id: "fireW", kind: "flames", x: 1.45, y: 0, z: r3(WZ + 0.25), scale: 1.5 },
  { id: "fireR", kind: "flames", x: r3(E.right - 0.25), y: 0, z: -1.2, rot: 90, scale: 1.3 },
  // smoke under the ceiling, the glow on the back wall (cabinsmoke's box in the room's frame; z0 = the back wall)
  { id: "lids", staged: "a first-person overlay", kind: "eyelids", cam: POV },
  { id: "smoke", kind: "cabinsmoke", x: 0, y: 0, z: 0, x0: -2.4, x1: E.right, z0: WZ, z1: 2.5, top: 2.6 },
];

// 0-0.8 first person: his eyes open on the fire (Spud hidden, the camera is his eyes)
A(0, "spud", "hide"); A(r3(T.up - 0.02), "spud", "show");
c.prop(0, "lids", { open: 0.1 }, 0, "linear"); c.prop(0.05, "lids", { open: 0.6 }, 0.2, "out"); c.prop(0.35, "lids", { open: 1 }, 0.3, "inOut");   // one smooth opening (a re-blink at 0.3-0.4 read as a one-frame pop)
for (const id of ["curtL", "curtR"]) c.prop(0, id, { fire: 1, scorch: 0.6 }, 0, "linear");
c.prop(0, "glow", { glow: 1 }, 0, "linear");
c.prop(0, "fireW", { fire: 1 }, 0, "linear"); c.prop(0, "fireR", { fire: 0.8 }, 0, "linear");
c.prop(0, "smoke", { fill: 0.6, fire: 0.8 }, 0, "linear");
// 0.8 on his feet by the bed, the fire behind him
A(T.up, "spud", "expr", { expr: "terrified", set: { open: 0.6 }, dur: 0 });
A(T.up, "spud", "look", { to: [0, 0], dur: 0, blink: false });
both(r3(T.up - 0.02), { o: [0.3, 0.6, 0.25] }, 0.01);   // behind the cut
A(r3(T.look - 0.13), "spud", "look", { to: [0.7, 0.15], dur: 0.15, blink: false });
A(T.look, "spud", "turn", { to: 30, dur: 0.35, ease: "out" });
narr(T.line, "You wake up and your house is burning.", LINE_DUR, ["You wake up", "and your house is burning."]);
see(0.1, T.up, ["curtL", "glow"], "first person from the pillow: his eyes open on the curtains and the window on fire");
see(r3(T.up + 0.05), END, ["spud.face", "curtL", "glow"], "Spud on his feet by the bed, the room on fire behind him");
// sound: realistic only (Jonny 12 Nov) - the fire, the smoke alarm
sfx(0, "ai/house-fire", { gain: 0.6, dur: END, reason: "the room burning" });
for (let t = 0.05; t < END - 0.2; t += 0.55) sfx(r3(t), "ai/smoke-alarm", { gain: 0.45, reason: "the smoke alarm" });
function both(t, pose, dur, ease) { for (const s of ["R", "L"]) c.arm(t, "spud", s, pose, dur, ease); }

const MASTER = frame([0.35, 0.75, -1.0], { az: -8, el: 8, h: 3.4, fov: 38 });
const beats = c.beats([["his eyes open", 0, POV, "hook"], ["the house is burning", T.up, MASTER]], END);

write(import.meta.url, {
  id: "wake-up-mid-sinking-car-fire",
  title: "You wake up mid sinking car (the next one)",
  idea: "You wake up mid EP02's last shot: Spud wakes in bed and his house is burning (the loop into EP03); joined after wake-up-mid-sinking-car",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1440], cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, animeTiming: true,
  set: { type: "energyroom", night: true, seed: 6, aperture: 0, bloom: "emissive" },
  // the episode's orchestra runs on from the lake clip (disaster-04 is 14.99 s and loops: (1.698 + 34.0) mod 14.988 = 5.722)
  music: { file: "ai/disaster/disaster-04.ogg", from: 0, skip: 5.722, lowCut: 150, gain: 0.55, duck: { db: -8, voice: -10 } },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false, surface: "carpet" },
  creative: { length: [END, END] },
  hook: { show: ["curtL", "glow"], hint: 0, what: "first person: his eyes open in a burning bedroom" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
  ],
  notes: "Generated by storyboards/series/you-wake-up-mid/02-sinking-car/make-sinking-car-fire.mjs. Joined after wake-up-mid-sinking-car (one set per storyboard).",
});
