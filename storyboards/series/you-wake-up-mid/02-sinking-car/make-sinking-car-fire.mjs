// You wake up mid EP02, THE NEXT ONE (the loop into EP03): "You wake up and your house is burning."
// Jonny 12 Nov 18:56 Berlin on rough draft 1: "the house fire isnt a burning house. and the phrase should be you wake
// up and your house is burning". The lake clip is one set (stormlake), so the bedroom is its own short clip in the
// energyroom set (Reaper's bedroom from Too Much Energy, at night) and is joined after wake-up-mid-sinking-car.
// Reuses: energyroom, bedframe, tipmattress, nightstand, digiclock, winglass, firecurtain, outglow (props-energy),
// flames (props3d), cabinsmoke (props-wakeup-fx). No new design.
//
// 0.00  Spud asleep in bed, eyes shut; the curtains and the wall by the window burn, smoke under the ceiling, the
//       window glows orange (the house outside burns too), the smoke alarm beeps
// 0.35  his eyes snap open; 0.75 he looks at the burning window; narrator "You wake up and your house is burning."
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
const T = { open: 0.35, look: 0.75, line: 0.2 };
const END = r3(T.line + LINE_DUR + 0.25 + 0.75);

const BED = E.bed, WZ = E.wallZ, WIN_X = (E.win.x0 + E.win.x1) / 2;
const MAT = [BED[0] - M.w / 2, RAIL_Y, BED[1]];
const cast = [{ id: "spud", character: "potatobrawl/spud", at: BED, face: "camera", expr: "serene", follow: 0.3, seed: 2.9 }];
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
  { id: "smoke", kind: "cabinsmoke", x: 0, y: 0, z: 0, x0: -2.4, x1: E.right, z0: WZ, z1: 2.5, top: 2.6 },
];

A(0, "spud", "sit", { seat: "frame", dur: 0, hands: "keep" });
A(0, "spud", "face", { lid: 1, dur: 0 });
A(0, "spud", "look", { to: [0, -0.15], dur: 0, blink: false });
c.arm(0, "spud", "R", { x: [-0.2, 0.3, 0.38] }, 0); c.arm(0, "spud", "L", { x: [0.2, 0.3, 0.38] }, 0);
for (const id of ["curtL", "curtR"]) c.prop(0, id, { fire: 1, scorch: 0.6 }, 0, "linear");
c.prop(0, "glow", { glow: 1 }, 0, "linear");
c.prop(0, "fireW", { fire: 1 }, 0, "linear"); c.prop(0, "fireR", { fire: 0.8 }, 0, "linear");
c.prop(0, "smoke", { fill: 0.6, fire: 0.8 }, 0, "linear");
// he wakes
A(T.open, "spud", "face", { lid: 0, dur: 0.1 });
A(T.open, "spud", "expr", { expr: "terrified", set: { open: 0.5 }, dur: 0.1 });
A(r3(T.look - 0.13), "spud", "look", { to: [0.7, 0.1], dur: 0.15, blink: false });
A(T.look, "spud", "turn", { to: 25, dur: 0.3, ease: "out" });
both(T.look, { o: [0.3, 0.55, 0.3] }, 0.3, "out");
narr(T.line, "You wake up and your house is burning.", LINE_DUR, ["You wake up", "and your house is burning."]);
see(0.1, END, ["spud.face", "curtL", "glow"], "Spud wakes in bed: the curtains, the wall and the window behind him on fire, smoke under the ceiling");
// sound: realistic only (Jonny 12 Nov) - the fire, the smoke alarm
sfx(0, "ai/house-fire", { gain: 0.6, dur: END, reason: "the room burning" });
for (let t = 0.05; t < END - 0.2; t += 0.55) sfx(r3(t), "ai/smoke-alarm", { gain: 0.45, reason: "the smoke alarm" });
function both(t, pose, dur, ease) { for (const s of ["R", "L"]) c.arm(t, "spud", s, pose, dur, ease); }

const MASTER = frame([-0.3, 0.95, -1.5], { az: -8, el: 10, h: 3.6, fov: 36 });
const beats = c.beats([["the next one", 0, MASTER, "hook"]], END);

write(import.meta.url, {
  id: "wake-up-mid-sinking-car-fire",
  title: "You wake up mid sinking car (the next one)",
  idea: "You wake up mid EP02's last shot: Spud wakes in bed and his house is burning (the loop into EP03); joined after wake-up-mid-sinking-car",
  fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, captionStyle: "kinetic",
  captionBand: [240, 1440], cleanStart: true, motion: { feet: 2, overlap: true, timing: true, solve: true }, animeTiming: true,
  set: { type: "energyroom", night: true, seed: 6, aperture: 0, bloom: "emissive" },
  sound: { sfx: 0.65, ambience: 0.06, guard: true, signature: false },
  creative: { length: [END, END] },
  hook: { show: ["spud", "curtL", "glow"], hint: 0, what: "his eyes open in a burning bedroom" },
  cast, props, captions: c.captions, beats, visible: c.visible,
  allowClip: [
    { who: "spud", with: "frame", from: 0, to: END, reason: "Spud sits in bed (legs under the blanket, over the frame)" },
    { who: "spud", with: "mat", from: 0, to: END, reason: "Spud sits in bed on the mattress, under the blanket" },
  ],
  notes: "Generated by storyboards/series/you-wake-up-mid/02-sinking-car/make-sinking-car-fire.mjs. Joined after wake-up-mid-sinking-car (one set per storyboard).",
});
