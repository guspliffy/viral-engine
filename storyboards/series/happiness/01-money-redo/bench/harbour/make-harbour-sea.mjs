// Proof still FIRST (T3, DESIGN 3.1 risk): the coast set's sea shader from 2.3 m above the water, no props. Camera at the panel 11 lens
// (pier frame (0.9, 2.30, -6.0) at H = (-40, -55, -90)), 1 degree toward +x of -z, 4 degrees down, fov 42.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const LOOK = { aperture: 0, focus: false, bloom: "emissive", lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };
const H = [-40, -55, -90], D = Math.PI / 180;
const pos = [H[0] + 0.9, H[1] + 2.3, H[2] - 6.0];
const dir = (az, el) => [Math.sin(az * D) * Math.cos(el * D), -Math.sin(el * D), -Math.cos(az * D) * Math.cos(el * D)];
const at = (p, d, k = 50) => p.map((v, i) => +(v + d[i] * k).toFixed(3));
const shots = [
  { name: "panel11-lens", look: at(pos, dir(1, 4)), fov: 42 },
  { name: "level", look: at(pos, dir(4, 0)), fov: 42 },
  { name: "wide", look: at(pos, dir(0, 8)), fov: 60 },
];
const sb = {
  id: "harbour-sea", title: "Harbour bench: the sea from 2.3 m (T3 proof)", fps: 30, look: "anime-pro", castLook: "sheet", profile: "short", loop: false, duration: 6, cleanStart: true,
  set: { type: "coast", break: 1, late: 0, sink: 0, grass: 0.2, ...LOOK }, music: false, sound: { sfx: 0, ambience: 0, speech: false }, creative: { length: [1, 6], notes: false },
  cast: [{ id: "spud", character: "potatobrawl/spud", at: [0, 0], face: 180, expr: "kind", follow: 0, seed: 29 }], props: [], actions: [], captions: [],
  shots: shots.map((s, i) => ({ at: i * 2, pos, look: s.look, fov: s.fov })), notes: "T3 proof bench.",
};
fs.writeFileSync(path.join(here, "harbour-sea.json"), JSON.stringify(sb, null, 1) + "\n");
console.log("stills: 1,3,5 ", shots.map((s) => s.name).join(","));
