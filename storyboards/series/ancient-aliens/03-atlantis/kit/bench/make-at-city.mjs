// Bench for the Atlantis near city (engine/page/props-at-city.js, task T1 of ../briefs/T1.md): one group per camera, each on its own
// 3 km sea disc (citybenchsea), wide frame (1920 x 1080), far 9000. Not a clip. Each shot is one beat; the still is 0.55 s in.
//   A  panel 01: harbourquay + gate, brass citywall runs left and right of it, 2 triremes, Spud on the quay      A2 the quay close
//   B  panel 02: red-gold wall close, flash 0 / 0.5 / 1 (B, B2, B3)
//   C  panel 10: scaffold on the red-gold wall, 2 alien crew, Spud's palm on the three-colour stone
//   D  panel 11: the three walls from outside in (short runs at their radii) under a dawn sky
//   E  panels 08 / 09: canalcut (E), canalcut modern (E2)
//   F  panels 19-20: bridgedeck, column fall 0 (F), 0.6 with the splash (F2)
//   G  panel 29: edgeroad water 0.6 in the evening with the brass wall behind
//   H  panel 17: platebench (polish 0.5) on a brass wall-walk, the polishing cloth, a crew member, Spud
//   node storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-city.mjs
//   node engine/render.mjs storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-city.json --stills <times> --draft --out out/at-city
//   node qa/contact.mjs out/at-city/at-city-*.png --out storyboards/series/ancient-aliens/03-atlantis/kit/bench/at-city-sheet.png
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const KEYS = ["A", "A2", "A3", "B", "B2", "B3", "C", "C2", "D", "D2", "E", "E2", "F", "F2", "G", "H"];
const G = Object.fromEntries(KEYS.map((k, i) => [k, [3000 + i * 12000, 3000 + i * 12000]]));
const at = (g, x, z) => [r3(G[g][0] + x), r3(G[g][1] + z)];
const cast = [], props = [];
const SPUD = (id, g, x, z, face, y = 0) => ({ id, character: "potatobrawl/spud", at: at(g, x, z), y, face, expr: "kind", follow: 0.2, seed: 2.1 });
const CREW = (id, g, x, z, face, y = 0) => ({ id, character: "ancient-aliens/alien-crew", at: at(g, x, z), y, face, expr: "kind", follow: 0.2, seed: 3.3 });
const P = (id, kind, g, x, z, extra = {}) => { const [wx, wz] = at(g, x, z); return { id, kind, x: wx, z: wz, ...extra }; };
const cam = (g, p, l, f = 34) => ({ pos: [r3(G[g][0] + p[0]), r3(p[1]), r3(G[g][1] + p[2])], look: [r3(G[g][0] + l[0]), r3(l[1]), r3(G[g][1] + l[2])], fov: f });
// the ring point at along-position s of a ring of radius R whose s = 0 point is (x0, z0): position and the prop's turn
const ring = (x0, z0, R, s) => { const th = s / R; return { x: x0 + R * Math.sin(th), z: z0 - R + R * Math.cos(th), rot: th * 180 / Math.PI }; };
const SHOTS = [];
const shot = (name, cm, label, grp, set) => SHOTS.push({ name, cm, label, grp, set });
const sea = (g, light = "dawn") => props.push(P("sea" + g, "citybenchsea", g, 0, 0, { color: light === "eve" ? "#3d4f5e" : "#2f6fae" }));
const sky = (g, time = "b") => props.push(P("sky" + g, "shsky", g, 0, 0, { time }));
let T = 0;

// =====BLOCK B=====
// ---------------------------------------------------------------- B: panel 02, the red-gold wall close (flash 0, 0.5, 1)
for (const [g, fl] of [["B", 0], ["B2", 0.5], ["B3", 1]]) {
  sea(g); sky(g);
  props.push(P("rg" + g, "citywall", g, 0, 0, { ring: "redgold", len: 48, r: 462, flash: fl, light: "dawn", seed: 3 }));
  cast.push(SPUD("spud" + g, g, -3.2, 10.2, 200, 0));
  shot(g, cam(g, [-6, 3.2, 11.5], [5, 10, 0], 55), `${g} panel 02: red-gold wall close, flash ${fl}`);
}


// =====END B=====
// =====BLOCK A=====
// ---------------------------------------------------------------- A: panel 01, the harbour at dawn
{
  const g = "A", GX = 80, GZ = -150, R = 2497;
  sea(g); sky(g);
  props.push(P("quay", "harbourquay", g, 0, 0, { gate: true, gateAt: [GX, GZ], people: 10, light: "dawn" }));
  // the brass wall left and right of the gate towers (outer faces at s = +-32), curved on its ring (centre (GX, GZ - R))
  const run = (id, s0, len, towers) => props.push(P(id, "citywall", g, GX, GZ, { ring: "brass", r: R, s0, len, towers, banners: true, light: "dawn", seed: 5 }));
  run("wallL", -232, 200, [-70, -150]); run("wallR", 32, 200, [70, 150]);
  props.push(P("tri1", "trireme", g, 30, -60, { rot: 20, row: 0.6, wake: 1, light: "dawn" }), P("tri2", "trireme", g, 85, -105, { rot: 200, row: 0.6, wake: 1, light: "dawn" }));
  cast.push(SPUD("spudA", g, -1.6, 3.4, 200, 1.2));
  shot("A", cam(g, [0.8, 2.3, 9.0], [50, 9.5, -150], 42), "A panel 01: quay, gate, brass wall, two triremes, Spud on the quay");
}
// =====END A=====
// =====BLOCK C=====
// ---------------------------------------------------------------- C: panel 10, the fitting on the red-gold wall
{
  const g = "C"; sea(g); sky(g);
  props.push(P("rgC", "citywall", g, 0, 0, { ring: "redgold", len: 60, r: 462, flash: 0, light: "dawn", seed: 3 }));
  props.push(P("scafC", "scaffold", g, -1.5, 2.5, { w: 8, decks: 3 }));
  props.push(P("plateC", "platebench", g, 0, 0, {}));
  cast.push(CREW("crewC1", g, -2.4, 4.0, 180, 4.0), CREW("crewC2", g, 1.2, 4.0, 180, 4.0), SPUD("spudC", g, 4.4, 4.3, 160, 0));
  shot("C", cam(g, [4.5, 6.0, 13], [-1.2, 5.0, 2.5], 50), "C panel 10: scaffold on the red-gold wall, two crew, Spud beside the three-colour stone");
  shot("C2", cam(g, [9, 3.4, 9.6], [-2.5, 4.2, 2.8], 46), "C2 panel 10 wide: the scaffold, the plates, the stone");
}
// =====END C=====
// =====BLOCK D=====
// ---------------------------------------------------------------- D: panel 11, the three walls from outside in
{
  const g = "D"; sea(g); sky(g);
  props.push(P("brD", "citywall", g, 0, 0, { ring: "brass", len: 420, r: 2497, towers: [-210, -60, 90, 240], banners: true, light: "dawn", seed: 2 }));
  props.push(P("tinD", "citywall", g, 0, -555, { ring: "tin", len: 520, r: 1942, towers: [-240, -90, 60, 210], banners: true, light: "dawn", seed: 4 }));
  props.push(P("rgD", "citywall", g, 0, -2035, { ring: "redgold", len: 700, r: 462, flash: 1, light: "dawn", seed: 6 }));
  cast.push(SPUD("spudD", g, 0, 40, 0, 0));
  shot("D", cam(g, [30, 30, 120], [0, 5, -600], 24), "D panel 11: the brass, tin and red-gold walls, outside in");
}
// =====END D=====
// =====BLOCK E=====
// ---------------------------------------------------------------- E: panels 08 and 09, the canal cut-away
{
  sky("E");
  props.push(P("canE", "canalcut", "E", 0, 0, { light: "dawn" }));
  shot("E", cam("E", [-6, 14, 92], [6, -14, 0], 46), "E panel 08: the canal cut-away, trireme, quay, gate tower, metre staff");
  sky("E2");
  props.push(P("canE2", "canalcut", "E2", 0, 0, { light: "dawn", modern: true }));
  shot("E2", cam("E2", [120, 20, 190], [150, -14, 0], 58), "E2 panel 09: the ancient and the modern canal, the container ship");
}
// =====END E=====
// =====BLOCK F=====
// ---------------------------------------------------------------- F: panels 19-20, the bridge, the falling column
{
  for (const [g, fall, spl] of [["F", 0, 0], ["F2", 0.6, 0.6]]) {
    sea(g, "noon"); sky(g, "a");
    props.push(P("deck" + g, "bridgedeck", g, 0, 0, { len: 90, light: "noon" }));
    props.push(P("col" + g, "column", g, -9, -6, { y: 4, dir: 270, fall, splash: spl, light: "noon" }));
    cast.push(SPUD("spud" + g, g, 4.5, 24, 160, 4), CREW("crew" + g, g, 8.5, 22, 150, 4));
    shot(g, cam(g, [6, 5.8, 38], [-16, 8.5, -22], 50), `${g} panels 19-20: the bridge deck, column fall ${fall}${spl ? " with the splash" : ""}`);
  }
}
// =====END F=====
// =====BLOCK G=====
// ---------------------------------------------------------------- G: panel 29, the edge road in the evening
{
  const g = "G"; sea(g, "eve"); sky(g, "c");
  props.push(P("roadG", "edgeroad", g, 0, 0, { y: 1, len: 36, water: 0.6, light: "eve", wet: 0.6 }));
  props.push(P("wallG", "citywall", g, 0, -60, { ring: "brass", len: 160, r: 2497, towers: [-60, 50], banners: true, light: "eve", wet: 0.6, seed: 8 }));
  cast.push(SPUD("spudG", g, -0.8, -3.5, 40, 1), CREW("crewG1", g, 0.2, -8.5, 20, 1), CREW("crewG2", g, -0.3, -11, 20, 1), CREW("crewG3", g, 0.2, -13.5, 20, 1));
  shot("G", cam(g, [-4.6, 2.6, 5.5], [3, 2.8, -18], 42), "G panel 29: the edge road, water 0.6, evening light, the brass wall behind");
}
// =====END G=====
// =====BLOCK H=====
// ---------------------------------------------------------------- H: panel 17, the plates on the wall-walk (a red-gold walk, y 16)
{
  const g = "H"; sky(g, "a");
  props.push(P("wallH", "citywall", g, 0, 0, { ring: "redgold", len: 60, r: 462, light: "noon", seed: 7, apron: false }));
  props.push(P("benchH", "platebench", g, 0, 0, { y: 16, polish: 0.55, n: 3 }));
  props.push(P("clothH", "polishcloth", g, 3.2, 0.4, { y: 16.1 }));
  cast.push(SPUD("spudH", g, -1.2, 1.2, 120, 16), CREW("crewH", g, 4.6, 0.2, 250, 16));
  shot("H", cam(g, [-9.5, 17.6, 1.2], [1.0, 16.2, -0.2], 38), "H panel 17: red-gold plates on battens on the wall-walk, polish 0.55, the cloth");
}
// =====END H=====
SHOTS.sort((a, b) => KEYS.indexOf(a.name) - KEYS.indexOf(b.name));
SHOTS.forEach((s, i) => { s.T = r3(0.1 + i * 1.0); if (s.set) s.set(s.T); c.cap(s.T, s.T + 0.9, s.label, 1860, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length * 1.0 + 0.1);
console.log("stills:", SHOTS.map((s) => r3(s.T + 0.55)).join(","));
console.log("names:", SHOTS.map((s) => s.name).join(","));
write(import.meta.url, {
  id: "at-city", title: "Atlantis near-city bench", idea: "Props bench for the Atlantis near city kit (T1), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  frame: "wide", far: 9000,
  set: { type: "plain", color: "#bcd6ee", floor: "shadow" }, music: false, sound: { auto: false },
  hook: { show: ["spudB"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(SHOTS.map((s) => [s.name, s.T, s.cm]), END),
  notes: "Generated by storyboards/series/ancient-aliens/03-atlantis/kit/bench/make-at-city.mjs (props bench, no reviews).",
});
