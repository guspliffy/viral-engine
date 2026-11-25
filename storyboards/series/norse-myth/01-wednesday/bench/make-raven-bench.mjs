// Norse myth 01 raven bench (task T-B, 22 Nov 2026): kind `norseraven` of engine/page/props-norse-raven.js (DESIGN.md section B). Not a clip.
// The ravens sit on a stand-in at Odin's shoulder heights (the odin character as a plain stand-in; his costume is the other builder's): the fur
// shelf top is y 0.97 at x -0.34 (who 1, HIS RIGHT) and +0.34 (who 2, HIS LEFT). One still per shot (1.2 s a shot, the still is 0.9 s in).
//   perch200 pair at 200 px   perchF both, front   prof1 / prof2 each in profile   head1 / head2 heads 3/4 (eye, beak, 14 bristles, 60 crown marks)
//   backV rear view folded wings   wingsF landing: wings open   tintT / tintF wing feathers painted by class (count 60)   tail fan 0 / 70
//   hackleC (16 hackles, ruff 1)   bristleC (14 bristles)   wingTop / notchC (S6 notch, 4 split feathers a wing)   pair200 / pair200b both birds at 200 px
//   leanS / leanF the whisper lean (35 degrees, turn 40, beak open) free of the stand-in
//   flap0..7 a wingbeat cycle in 8 phases   glide   brake0 brake1 brakeF   whisper0 whisper1   talk (ruff)   takeoff   foot
// Usage: node storyboards/series/norse-myth/01-wednesday/bench/make-raven-bench.mjs [shot names...]
//   flock /tmp/claude-0/render.lock node engine/render.mjs <this dir>/raven-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-raven
//   node qa/contact.mjs /tmp/claude-0/bench-raven/raven-bench-*.png --out <this dir>/raven-sheet.png
import { clip, frame, write } from "../../../../lib/clip.mjs";
import { ravenCounts } from "../../../../../engine/page/props-norse-raven.js";

const c = clip(), { A } = c;
const ONLY = process.argv.slice(2);
const BASE = { wings: 0, flap: 0, glide: 0, brake: 0, grip: 1, lean: 0, headYaw: 0, headPitch: 0, headRoll: 0, talk: 0, ruff: 0, shake: 0, hop: 0, blink: 0, tint: 0, perchR: 0.05 };
const POS = { r1: [-0.34, 0.97, -0.01], r2: [0.34, 0.97, -0.01] };
const GONE = [60, 0, -20];
const shots = [];
const shot = (name, ov, cam, t = {}) => { if (ONLY.length && !ONLY.includes(name)) return; shots.push([name, ov, cam, t]); };
const SH = 0.34, SY = 0.97;   // shoulder
const B1 = [-SH, SY + 0.12, 0], B2 = [SH, SY + 0.12, 0];
const AIR = (x, y, z, rot = 0) => ({ x: x + 5, y, z, rot, grip: 0 });   // flying shots stand 5 m off to the side of the stand-in

shot("perch200", { r1: {}, r2: {} }, frame([0, 0.95, 0], { az: 0, el: 4, h: 4.8, fov: 24 }));
shot("perchF", { r1: {}, r2: {} }, frame([0, 1.12, 0.05], { az: 0, el: 6, h: 2.3, fov: 22 }));
shot("prof1", { r1: { perchR: 0.05 }, r2: GONE }, frame(B1, { az: -90, el: 4, h: 0.75, fov: 22 }));
shot("prof2", { r1: GONE, r2: { perchR: 0.05 } }, frame(B2, { az: 90, el: 4, h: 0.75, fov: 22 }));
shot("head1", { r2: GONE }, frame([-SH, SY + 0.23, 0.1], { az: -30, el: 8, h: 0.24, fov: 20 }));
shot("head2", { r1: GONE }, frame([SH, SY + 0.23, 0.1], { az: 30, el: 8, h: 0.24, fov: 20 }));
shot("backV", { r1: {}, r2: {} }, frame([0, 1.1, -0.1], { az: 180, el: 24, h: 2.3, fov: 22 }));
shot("wingsF", { r1: { wings: 1 }, r2: { wings: 1 } }, frame([0, 1.15, 0.05], { az: 0, el: 6, h: 3.0, fov: 22 }));
shot("tintT", { r1: { ...AIR(0, 1.2, 0), wings: 1, tint: 1 }, r2: GONE }, frame([5, 1.2, -0.02], { az: 0, el: 80, h: 1.35, fov: 22 }));
shot("wingTop", { r1: { ...AIR(0, 1.2, 0), wings: 1 }, r2: GONE }, frame([5.15, 1.2, 0.0], { az: 0, el: 88, h: 1.5, fov: 22 }));
shot("notchC", { r1: { ...AIR(0, 1.2, 0), wings: 1 }, r2: GONE }, frame([5.2, 1.2, -0.03], { az: 0, el: 88, h: 0.45, fov: 20 }));
shot("tintF", { r1: { ...AIR(0, 1.2, 0), wings: 1, tint: 1 }, r2: GONE }, frame([5, 1.2, -0.02], { az: 0, el: 8, h: 1.35, fov: 22 }));
shot("tintU", { r1: { ...AIR(0, 1.2, 0), wings: 1, tint: 1 }, r2: GONE }, frame([5, 1.2, -0.02], { az: 180, el: -35, h: 1.35, fov: 22 }));
shot("tail0", { r1: GONE, r2: { ...AIR(0.0, 1.2, 0, 180), wings: 0 } }, frame([5, 1.18, -0.2], { az: 180, el: 25, h: 0.6, fov: 20 }));
shot("tail70", { r1: { ...AIR(0, 1.2, 0, 180), wings: 1, brake: 1 }, r2: GONE }, frame([5, 1.2, -0.2], { az: 180, el: 25, h: 0.9, fov: 20 }));
for (let i = 0; i < 8; i++) shot("flap" + i, { r1: { ...AIR(0, 1.2, 0, 0), wings: 1, flap: i / 8 }, r2: GONE }, frame([5, 1.2, 0], { az: -90, el: 2, h: 1.25, fov: 22 }));
shot("flapF", { r1: { ...AIR(0, 1.2, 0, 0), wings: 1, flap: 0.5 }, r2: GONE }, frame([5, 1.2, 0], { az: 0, el: 3, h: 1.25, fov: 22 }));
shot("glide", { r1: { ...AIR(0, 1.2, 0, 0), glide: 1, flap: 0 }, r2: GONE }, frame([5, 1.2, 0], { az: 35, el: 20, h: 1.4, fov: 22 }));
shot("brake0", { r1: { ...AIR(0, 1.2, 0, 0), wings: 1, brake: 0.5 }, r2: GONE }, frame([5, 1.25, 0], { az: -90, el: 3, h: 1.1, fov: 22 }));
shot("brake1", { r1: { ...AIR(0, 1.2, 0, 0), wings: 1, brake: 1 }, r2: GONE }, frame([5, 1.25, 0], { az: -90, el: 3, h: 1.1, fov: 22 }));
shot("brakeF", { r1: { ...AIR(0, 1.2, 0, 0), wings: 1, brake: 1 }, r2: GONE }, frame([5, 1.25, 0], { az: 25, el: 8, h: 1.25, fov: 22 }));
shot("pair200", { r1: [4.7, 0, 0.2], r2: [5.3, 0, 0.2] }, frame([5, 0.3, 0.2], { az: 0, el: 6, h: 4.8, fov: 24 }));
shot("pair200b", { r1: [4.7, 0, 0.2], r2: [5.3, 0, 0.2] }, frame([5, 0.2, 0.2], { az: 0, el: 6, h: 1.8, fov: 20 }));
shot("whisper0", { r1: { lean: 1, headYaw: 0.85, perchR: 0.05 }, r2: GONE }, frame([-0.2, 1.2, 0.05], { az: -20, el: 8, h: 1.3, fov: 22 }));
shot("whisper1", { r1: { lean: 1, headYaw: 0.85, talk: 1, perchR: 0.05 }, r2: GONE }, frame([-0.2, 1.2, 0.05], { az: -20, el: 8, h: 1.3, fov: 22 }));
shot("leanS", { r1: { x: 5, y: 0, z: 0, perchR: 0.004, lean: 1, headYaw: 0.5, talk: 1 }, r2: GONE }, frame([5, 0.2, 0], { az: 0, el: 6, h: 0.75, fov: 20 }));
shot("leanF", { r1: { x: 5, y: 0, z: 0, perchR: 0.004, lean: 1, headYaw: 0.5, talk: 0.5 }, r2: GONE }, frame([5, 0.2, 0], { az: -55, el: 14, h: 0.75, fov: 20 }));
shot("whisperC", { r1: { lean: 1, headYaw: 0.85, talk: 1, perchR: 0.05 }, r2: GONE }, frame([-0.3, 1.12, 0.1], { az: -70, el: 8, h: 0.55, fov: 20 }));
shot("talk", { r1: GONE, r2: { talk: 1, ruff: 1, perchR: 0.05 } }, frame([SH, SY + 0.22, 0.1], { az: 80, el: 5, h: 0.28, fov: 20 }));
shot("takeoff", { r1: { ...AIR(0, 1.05, 0, 0), wings: 1, flap: 0.2, hop: 0.5 }, r2: GONE }, frame([5, 1.15, 0], { az: -90, el: 3, h: 1.1, fov: 22 }));
shot("hackleC", { r1: GONE, r2: { ruff: 1, headYaw: -0.3, headPitch: -0.3, perchR: 0.05 } }, frame([SH, SY + 0.19, 0.1], { az: 25, el: -20, h: 0.2, fov: 20 }));
shot("bristleC", { r1: { perchR: 0.05, headYaw: 0.5 }, r2: GONE }, frame([-SH, SY + 0.21, 0.17], { az: -50, el: 8, h: 0.13, fov: 20 }));
shot("foot", { r1: { perchR: 0.05 }, r2: GONE }, frame([-SH, SY + 0.01, 0.0], { az: -60, el: 12, h: 0.14, fov: 20 }));

const END = shots.length * 1.2 + 0.4, stills = [];
shots.forEach(([name, ov, cam, tt], i) => {
  const t = i * 1.2;
  for (const id of ["r1", "r2"]) {
    const o = ov[id] ?? {}, place = Array.isArray(o) ? o : null;
    const base = { x: POS[id][0], y: POS[id][1], z: POS[id][2], rot: 0 };
    c.prop(t, id, { ...BASE, ...base, ...(place ? { x: place[0], y: place[1], z: place[2], perchR: 0.004, rot: id === "r1" ? 30 : -30 } : o) }, 0);
  }
  stills.push(Math.round((t + 0.9) * 100) / 100);
});
const shotList = shots.map(([name, , cam], i) => [name, i * 1.2, cam]);
const mk = (id, who) => ({ id, kind: "norseraven", who, x: POS[id][0], y: POS[id][1], z: POS[id][2], rot: 0, perchR: 0.05, ...BASE });
console.log("stills:", stills.join(","));
console.error("counts:", JSON.stringify(ravenCounts()));
write(import.meta.url, {
  id: "raven-bench", title: "Norse myth 01 raven bench", idea: "Bench for the two ravens (task T-B), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#8a93a6", floor: "#59606e", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["odin"], hint: 0, what: "engine test" },
  cast: [{ id: "odin", character: "norse-myth/odin", at: [0, 0], face: 0, follow: 0, seed: 1.3 }],
  props: [mk("r1", 1), mk("r2", 2)],
  captions: c.captions,
  beats: c.beats(shotList, END),
  notes: "Generated by storyboards/series/norse-myth/01-wednesday/bench/make-raven-bench.mjs (raven bench, no story).",
});
