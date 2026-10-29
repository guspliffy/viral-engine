// A test bench for the phone-edge grip (Jonny 29 Oct, DUO: Launch Day): the Wizard holds an open foldphone by its two
// outer edges, locked to each half (arm poses with part + frame), seen from the front, the back, the side and above.
// Not a clip: `node engine/render.mjs storyboards/duo/test-phone-grip.json --stills beats --draft`.
import { clip, write, r3 } from "../lib/clip.mjs";
import { FOLD } from "../../engine/page/props-duo.js";
import { PHONE_EDGE } from "../../engine/page/timeline.js";

const c = clip(), { A } = c;
const OPEN = Number(process.env.OPEN ?? 1), GAP = Number(process.env.GAP ?? 0), TH = Number(process.env.TH ?? 30);
const PH = [0, 0.33, 0.42];
// a hand on a half's outer edge, a little below its middle: fingers in along the back and tipped up TH degrees
const EDGE = (side, v = 0.45) => {
  const a = (TH * Math.PI) / 180;
  return { prop: "ph", part: side < 0 ? "L" : "R", grip: [side * FOLD.W, v * FOLD.H, -FOLD.T / 2].map(r3),
    frame: { y: [r3(-side * Math.cos(a)), r3(Math.sin(a)), 0], z: [0, 0, 1], at: PHONE_EDGE } };
};
A(0, "wiz", "noblink");
c.arm(0, "wiz", "R", EDGE(-1), 0.01);
c.arm(0, "wiz", "L", EDGE(1), 0.01);
A(0, "wiz", "grip", { side: "both", shape: process.env.GRIP || "phoneEdge", dur: 0.01 });
A(0, "wiz", "look", { to: [0, -0.3], dur: 0.01 });
const cam = (az, el, h = 0.55) => {
  const t = [PH[0], PH[1] + 0.12, PH[2]], a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((22 * Math.PI) / 360);
  return { pos: [t[0] + Math.sin(a) * Math.cos(e) * d, t[1] + Math.sin(e) * d, t[2] + Math.cos(a) * Math.cos(e) * d].map(r3), look: t.map(r3), fov: 22 };
};
// (no view from behind: the body is there) the top and the underside show the fingers behind the slab, the side its edge
// each view looks at the right half's edge (the left hand), close
const camE = (az, el, h = 0.32) => { const k = cam(az, el, h), t = [PH[0] + FOLD.W, PH[1] + 0.11, PH[2]], d = k.pos.map((v, i) => v - k.look[i]); return { ...k, look: t.map(r3), pos: t.map((v, i) => r3(v + d[i])) }; };
const beats = c.beats([["front", 0, camE(0, 8)], ["top", 0.5, camE(0, 75)], ["side", 1.0, camE(90, 5)], ["under", 1.5, camE(20, -55)], ["wide", 2.0, cam(10, 10, 1.6)]], 2.5);
write(import.meta.url, {
  id: "test-phone-grip", title: "Phone edge grip test", fps: 30, look: "anime-pro", profile: "short", loop: false,
  set: { type: "storefront", seed: 5, light: "golden", key: [5.5, 5.0, 3.6], wallZ: -9, aperture: 0 },
  music: false, sound: { sfx: 0, ambience: 0, speech: false },
  cast: [{ id: "wiz", character: "lookdev/wizard-crisp", at: [0, 0], face: 0, expr: "happy", follow: 0, seed: 1 }],
  props: [{ id: "ph", kind: "foldphone", x: PH[0], y: PH[1], z: PH[2], open: OPEN, gap: GAP, seed: 3 }],
  captions: [], beats, notes: "Test bench, not a clip.", ...(process.env.DEBUG && { debug: { colors: true } }),
});
