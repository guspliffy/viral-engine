// Norse myth 01 wind things bench (task T-E2, 22 Nov 2026): kinds norseleaves, norsepile, norserope, norsestaves of engine/page/props-norse-wind.js
// (DESIGN.md section E2). Not a clip. One still per beat (1.2 s a beat, the still is 0.9 s in). Each kind stands 20 m from the next.
// Usage: node storyboards/series/norse-myth/01-wednesday/bench/make-wind-bench.mjs [chip]   (chip: only the Chip-upside-down proof)
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/wind-bench.json --stills <times printed> --draft --safe --out <dir>
//   node qa/contact.mjs <dir>/wind-bench-*.png --out <this dir>/wind-sheet.png
import { clip, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const ONLY = process.argv.slice(2);
const X = { plate: 20, air: 40, pile: 60, spl: 80, sdr: 100, rope: 120, chip: 140, rope2: 160, rope3: 180 };
const props = [
  { id: "plate", kind: "norseleaves", x: X.plate, plate: 5 },
  { id: "air", kind: "norseleaves", x: X.air },
  { id: "pile", kind: "norsepile", x: X.pile },
  { id: "spl", kind: "norsestaves", x: X.spl, plate: true },
  { id: "sdr", kind: "norsestaves", x: X.sdr, flares: [[0.9, 0.9, -0.2], [-0.7, -1.1, -0.2]] },
  { id: "rope", kind: "norserope", x: X.rope, bar: true, slipAt: 0.5 },
  { id: "rope2", kind: "norserope", x: X.rope2, bar: true, slipAt: 0.5 },
  { id: "rope3", kind: "norserope", x: X.rope3, bar: true, slipAt: 0.5 },
  { id: "ropec", kind: "norserope", x: X.chip, bar: true },
];
const shots = [];
let T = 0;
const cam = (x, y, z, lx, ly, lz, fov) => ({ pos: [x, y, z], look: [lx, ly, lz], fov });
const beat = (name, camera, acts = () => {}) => { if (ONLY.length && !ONLY.includes(name)) return; acts(T); shots.push([name, T, camera]); T += 1.2; };
const prop = (t, id, set) => c.prop(t, id, set, 0);

c.A(0, "chip", "noblink");
c.A(0, "chip", "pitch", { to: 180, dur: 0.01 });
// the leaves
beat("leaf-shapes", cam(X.plate, 0.62, 4.7, X.plate, 0.55, 0, 50));
beat("air-wide", cam(X.air, 3.0, 13, X.air, 3.0, 0, 55));
beat("air-near", cam(X.air, 2.6, 4.6, X.air, 2.6, 0, 46));
beat("air-gust", cam(X.air, 3.0, 13, X.air, 3.0, 0, 55), (t) => prop(t, "air", { gust: 1 }));
// the pile at rest, then the burst strip
beat("pile-rest", cam(X.pile + 0.1, 1.7, 6.6, X.pile + 0.1, 0.3, 0, 46));
beat("pile-top", cam(X.pile, 1.0, 2.5, X.pile, 0.4, 0.1, 40));
for (const b of [0.04, 0.12, 0.25, 0.45, 0.7]) beat(`burst-${b}`, cam(X.pile, 1.2, 4.6, X.pile, 0.55, 0, 50), (t) => prop(t, "pile", { burst: b }));
beat("burst-1", cam(X.pile, 1.2, 4.6, X.pile, 0.4, 0, 50), (t) => prop(t, "pile", { burst: 1 }));
beat("hole", cam(X.pile, 1.9, 1.0, X.pile, 0.55, 0, 30), (t) => prop(t, "pile", { burst: 1 }));
// the staves
beat("staves-nine", cam(X.spl, 0.0, 5.7, X.spl, 0.0, 0.5, 50));
beat("staves-close", cam(X.spl - 0.6, 0.0, 2.3, X.spl - 0.6, 0, 0.5, 40));
beat("staves-drift", cam(X.sdr, 0, 8.0, X.sdr, 0, 0, 50), (t) => prop(t, "sdr", { fall: 0.5 }));
beat("staves-drift2", cam(X.sdr, 0, 8.0, X.sdr, 0, 0, 50), (t) => prop(t, "sdr", { fall: 0.56 }));
// the rope
beat("rope-whole", cam(X.rope, 2.05, 3.2, X.rope, 1.95, 0, 28), (t) => { });
beat("rope-turns", cam(X.rope - 0.02, 3.0, 0.8, X.rope, 2.62, 0, 28));
beat("rope-hitch-low", cam(X.rope + 0.0, 2.9, 1.0, X.rope + 0.0, 2.55, 0, 22));
beat("rope-under", cam(X.rope + 0.05, 1.95, 1.0, X.rope, 2.0, 0, 28));
beat("ankle-loop", cam(X.rope, 1.7, 0.9, X.rope, 1.6, 0, 28));
beat("ankle-back", cam(X.rope, 1.75, -0.9, X.rope, 1.65, 0, 28));
beat("slip-creep", cam(X.rope2, 1.7, 0.9, X.rope2, 1.6, 0, 28), (t) => prop(t, "rope2", { slip: 0.5 }));
beat("slip-letgo", cam(X.rope2, 1.65, 0.9, X.rope2, 1.55, 0, 28), (t) => prop(t, "rope2", { slip: 0.75 }));
beat("slip-empty", cam(X.rope3, 1.7, 0.9, X.rope3, 1.55, 0, 28), (t) => { prop(t, "rope3", { slip: 1 }); });
beat("swing-twist", cam(X.rope, 2.0, 3.2, X.rope, 1.95, 0, 28), (t) => { prop(t, "rope", { swing: 1, twist: 1 }); });
// Chip hangs by the ankle: front, side, close
beat("chip-front", cam(X.chip, 1.5, 4.0, X.chip, 1.5, 0, 28), (t) => { });
beat("chip-side", cam(X.chip + 4.0, 1.5, 0, X.chip, 1.5, 0, 28));
beat("chip-foot", cam(X.chip, 1.75, 1.4, X.chip, 1.65, 0, 22));

const END = T + 1.2;
const stills = shots.map(([n, t]) => Math.round((t + 0.9) * 100) / 100);
console.log("stills:", stills.join(","));
write(import.meta.url, {
  id: "wind-bench", title: "Norse myth 01 wind things bench", idea: "Bench for the wind things (task T-E2), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#9fc6ea", floor: "#7f9a4a", para: 0, aperture: 0, lighting: { v: 2, key: [-0.5, 0.75, 0.45], light: "#fff1d0", shadow: "#9fc6ea", rim: "#fff1d0", exposure: 1.0, measure: false }, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true },
  music: false, sound: { auto: false },
  hook: { show: [], hint: 0, what: "engine test" },
  cast: [{ id: "chip", character: "potatobrawl/chip", at: [X.chip + 0.15, 0], y: 0.68, face: 0, follow: 0, seed: 2.1 }],
  props, captions: c.captions, beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-wind-bench.mjs (wind things bench, no story).",
});
