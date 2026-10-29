// A test bench for setting the open DUO down flat and picking it up again (Not Even Magic): the Wizard holds the phone
// lying screen-up on the table by its two outer edges, each hand turned A degrees round its edge from the book-style
// edge hold (fingers behind the half) toward fingers down beside the edge. Env: A (degrees), AT (the edge's place along
// the fingers), V (where along the edge, 0 bottom .. 1 top).
// Not a clip: `node engine/render.mjs storyboards/unboxing/test-flat-grip.json --stills beats --draft`.
import { clip, write, r3 } from "../lib/clip.mjs";
import { FOLD } from "../../engine/page/props-duo.js";
import { PHONE_EDGE } from "../../engine/page/timeline.js";

const c = clip(), { A } = c;
const ANG = Number(process.env.A ?? 50), AT = Number(process.env.AT ?? PHONE_EDGE[1]), V = Number(process.env.V ?? 0.55), LIFT = Number(process.env.LIFT ?? 0);
const TH = 0.34, PH = [-0.22, TH + FOLD.T + LIFT, 0.92];
const SIDE = (side) => {
  const a = (ANG * Math.PI) / 180;
  return { prop: "ph", part: side < 0 ? "L" : "R", grip: [side * FOLD.W, V * FOLD.H, -FOLD.T / 2].map(r3),
    frame: { y: [r3(-side * Math.cos(a)), 0, r3(-Math.sin(a))], z: [r3(-side * Math.sin(a)), 0, r3(Math.cos(a))], at: [PHONE_EDGE[0], AT, PHONE_EDGE[2]], elbow: 1 } };
};
A(0, "wiz", "noblink");
c.arm(0, "wiz", "R", SIDE(-1), 0.01);
c.arm(0, "wiz", "L", SIDE(1), 0.01);
A(0, "wiz", "grip", { side: "both", shape: process.env.GRIP || "phoneEdge", dur: 0.01 });
A(0, "wiz", "look", { to: [0.2, -0.8], dur: 0.01 });
const cam = (t, az, el, h) => { const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180, d = h / 2 / Math.tan((22 * Math.PI) / 360);
  return { pos: [t[0] + Math.sin(a) * Math.cos(e) * d, t[1] + Math.sin(e) * d, t[2] + Math.cos(a) * Math.cos(e) * d].map(r3), look: t.map(r3), fov: 22 }; };
const mid = [PH[0], TH + 0.03, PH[2] - 0.12], edgeL = [PH[0] + FOLD.W, TH + 0.03, PH[2] - 0.12], edgeR = [PH[0] - FOLD.W, TH + 0.03, PH[2] - 0.12];
const beats = c.beats([["lead", 0, cam(mid, 0, 20, 0.7)], ["clip view left", 0.1, cam([PH[0], TH + 0.12, PH[2] - 0.2], -25, 22, 0.75)], ["clip view right", 0.5, cam([PH[0], TH + 0.12, PH[2] - 0.2], 25, 22, 0.75)], ["low side", 1.0, cam(edgeL, 70, 8, 0.4)]], 1.5);
write(import.meta.url, {
  id: "test-flat-grip", title: "Flat phone grip test", fps: 30, look: "anime-pro", profile: "short", loop: false,
  set: { type: "plain", color: "#efe6d6", floor: "#c9b08a", light: "golden", aperture: 0, para: 0, bloom: "emissive" },
  music: false, sound: { sfx: 0, ambience: 0, speech: false },
  cast: [{ id: "wiz", character: "lookdev/wizard-crisp", at: [-0.42, 0.2], face: 8, expr: "happy", follow: 0, seed: 1 }],
  props: [
    { id: "table", kind: "coffeetable", x: 0, z: 0.95, h: TH, w: 2.6, d: 0.8, color: "#e8cf9f", leg: "#c9a06c" },
    { id: "ph", kind: "foldphone", x: PH[0], y: PH[1], z: PH[2], open: 1, tip: -90, seed: 3, damage: "map", glow: 1 },
  ],
  captions: [], beats, notes: "Test bench, not a clip.",
});
