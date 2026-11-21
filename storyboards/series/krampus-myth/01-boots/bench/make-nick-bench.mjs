// Krampus myth 01 Saint Nick bench (task T-C, 21 Nov 2026): costume `stnick` (engine/page/costumes-stnick.js, characters/krampus-myth/nick.json)
// at DESIGN section C sizes, cast at scale 1.22 (1.24 standing, mitre top 1.63). Not a clip, no story. One shot per beat (1.2 s each, the still is 0.9 s in):
//   front n34 side back        the whole figure: front, 3/4 (turn 35), profile (90), from behind (165: the cope's shield and the 9 folds)
//   face faceSmile faceGlow    close on the face: beard, moustache, brows, lids 0.55; smile 1; glow 1 (the book's light on the beard)
//   mitre mitreSide mitreBack  the mitre close: front shield, the cleft from the side, the back and the lappets
//   emb embHem                 the embroidery close: oak vine band + lily damask, the hem band with its lozenges
//   read readSide              READ: left palm under a stand-in book (a plain slab), right index on the page; lids 0.8
//   shake1 shake2              the head shake at its two ends (body yaw +9 / -9, eyes shut)
//   kneel kneelSide kneelBack  the rig's kneel pose: the hem a pool on the snow, from 3/4, profile, behind
//   pour                       kneel + both hands low at the stand-in sack (panel 22)
//   size                       Nick, Spud and Chip side by side, bodies 1.2 m apart, from 9 m
//   node storyboards/series/krampus-myth/01-boots/bench/make-nick-bench.mjs
//   flock /tmp/claude-0/render.lock node engine/render.mjs storyboards/series/krampus-myth/01-boots/bench/nick-bench.json --stills <times printed> --draft --safe --out /tmp/claude-0/bench-nick
//   node qa/contact.mjs /tmp/claude-0/bench-nick/nick-bench-*.png --out storyboards/series/krampus-myth/01-boots/bench/nick-sheet.png
import { clip, frame, write } from "../../../../lib/clip.mjs";

const c = clip(), { A } = c;
const NX = 0, SPX = 1.2, CHX = 2.4;
const shots = [];
let T = 0;
const beat = (name, cam, acts = () => {}) => { acts(T); shots.push([name, T, cam]); T += 1.2; };
const at = (x = 0, y = 0.82, z = 0) => [NX + x, y, z];
const WHO = ["nick", "spud", "chip"];
for (const w of WHO) { A(0, w, "noblink"); c.arm(0, w, "R", "rest", 0.01); c.arm(0, w, "L", "rest", 0.01); }

const reset = (t, o = {}) => {   // back to standing, hands at rest, face 0
  A(t, "nick", "turn", { to: o.turn ?? 0, dur: 0.01 });
  A(t, "nick", "expr", { expr: o.expr ?? "kind", ...(o.set && { set: o.set }), dur: 0.01 });
};
// cameras are in world metres: world y = 0.17 + 1.22 x the body-local height of DESIGN C (eye line 0.48 -> 0.76, mitre top 1.20 -> 1.63)
beat("front", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => reset(t));
beat("n34", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => reset(t, { turn: 35 }));
beat("side", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => reset(t, { turn: 90 }));
beat("back", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => reset(t, { turn: 165 }));
beat("face", frame(at(0, 0.74), { az: 0, el: 2, h: 1.3, fov: 20 }), (t) => reset(t));
beat("faceSmile", frame(at(0, 0.74), { az: 18, el: 2, h: 1.3, fov: 20 }), (t) => { reset(t); });
beat("faceGlow", frame(at(0, 0.74), { az: -18, el: 2, h: 1.3, fov: 20 }), (t) => { reset(t); });
beat("mitre", frame(at(0, 1.33), { az: 0, el: 3, h: 1.5, fov: 20 }), (t) => reset(t));
beat("mitreSide", frame(at(0, 1.33), { az: 0, el: 3, h: 1.5, fov: 20 }), (t) => reset(t, { turn: 80 }));
beat("mitreBack", frame(at(0, 1.25), { az: 0, el: 6, h: 1.5, fov: 20 }), (t) => reset(t, { turn: 170 }));
beat("emb", frame(at(-0.3, 0.55), { az: 0, el: 2, h: 0.85, fov: 20 }), (t) => reset(t, { turn: 25 }));
beat("embHem", frame(at(0.12, 0.2), { az: 0, el: 6, h: 0.7, fov: 20 }), (t) => reset(t, { turn: 20 }));
// READ: the stand-in slab (0.3 x 0.03 x 0.22, a plinth) lies on the left palm, its middle at (0, 0.44, 0.52), tipped to his eyes; right index on the page
const slabAt = (t) => c.prop(t, "slab", { x: 0, y: 0.43, z: 0.52 }, 0.01), slabOff = (t) => c.prop(t, "slab", { x: 20 }, 0.01);
const readPose = (t) => {
  reset(t); A(t, "nick", "face", { lid: 0.8, dur: 0.1 }); slabAt(t);
  c.arm(t, "nick", "L", { x: [0.08, 0.20, 0.50] }, 0.1); A(t, "nick", "grip", { side: "L", shape: "flat", dur: 0.1 });
  c.arm(t, "nick", "R", { x: [-0.06, 0.30, 0.53] }, 0.1); A(t, "nick", "grip", { side: "R", shape: "point", dur: 0.1 });
};
beat("read", frame(at(0, 0.7), { az: 0, el: 3, h: 1.6, fov: 22 }), readPose);
beat("readSide", frame(at(0, 0.7), { az: 0, el: 3, h: 1.6, fov: 22 }), (t) => { readPose(t); A(t, "nick", "turn", { to: 90, dur: 0.01 }); });
// the head shake at its two ends (the body yaws 9 degrees, eyes shut)
const shakeEnd = (t, y) => { slabOff(t); c.arm(t, "nick", "L", "rest", 0.1); c.arm(t, "nick", "R", "rest", 0.1); A(t, "nick", "grip", { side: "L", shape: "open", dur: 0.1 }); A(t, "nick", "grip", { side: "R", shape: "open", dur: 0.1 }); reset(t, { turn: y }); A(t, "nick", "face", { lid: 1, dur: 0.05 }); };
beat("shake1", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => shakeEnd(t, 9));
beat("shake2", frame(at(0, 0.84), { az: 0, el: 3, h: 2.35, fov: 24 }), (t) => shakeEnd(t, -9));
// the size shot: bodies 1.2 m apart, from 9 m
beat("size", frame([1.2, 0.8, 0], { az: 0, el: 2, h: 7.6, fov: 24 }), (t) => { A(t, "nick", "face", { lid: 0.55, dur: 0.05 }); reset(t); });
// KNEEL: the rig's kneel pose; the cope lies on the snow
beat("kneel", frame(at(0, 0.8), { az: 0, el: 6, h: 2.6, fov: 24 }), (t) => { A(t, "nick", "face", { lid: 0.55, dur: 0.05 }); A(t, "nick", "kneel", { dur: 0.01 }); });
beat("kneelSide", frame(at(0, 0.8), { az: 0, el: 6, h: 2.6, fov: 24 }), (t) => { A(t, "nick", "turn", { to: 90, dur: 0.01 }); });
beat("kneelBack", frame(at(0, 0.8), { az: 0, el: 12, h: 2.6, fov: 24 }), (t) => { A(t, "nick", "turn", { to: 165, dur: 0.01 }); });
// POUR (panel 22): kneeling, both hands low on the stand-in sack, 0.20 above the boot cuff
beat("pour", frame(at(0, 0.55), { az: 0, el: 8, h: 1.8, fov: 22 }), (t) => {
  A(t, "nick", "turn", { to: 0, dur: 0.01 }); c.prop(t, "sack", { x: 0, y: 0.08, z: 0.42 }, 0.01);
  c.arm(t, "nick", "R", { x: [-0.1, 0.14, 0.42] }, 0.1); c.arm(t, "nick", "L", { x: [0.1, 0.14, 0.42] }, 0.1);
});
const END = T + 1.2;
const stills = shots.map(([, t]) => Math.round((t + 0.9) * 100) / 100);
console.log("stills:", stills.join(","));
console.log("shots:", shots.map((s, i) => `${i}:${s[0]}`).join(" "));
write(import.meta.url, {
  id: "nick-bench", title: "Krampus myth 01 Saint Nick bench", idea: "Bench for the stnick costume (task T-C), not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", physics: false,
  set: { type: "plain", color: "#7e8799", floor: "#cfdcf2", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, satsuei: true },
  music: false, sound: { auto: false },
  hook: { show: ["nick"], hint: 0, what: "engine test" },
  cast: [
    { id: "nick", character: "krampus-myth/nick", at: [NX, 0], face: 0, expr: "kind", follow: 0.2, seed: 1.3, scale: 1.22 },
    { id: "spud", character: "potatobrawl/spud", at: [SPX, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.6 },
    { id: "chip", character: "potatobrawl/chip", at: [CHX, 0], face: 0, expr: "kind", follow: 0.2, seed: 3.9 },
  ],
  props: [{ id: "slab", kind: "plinth", x: 20, y: 0, z: 0, w: 0.3, h: 0.03, d: 0.22, tip: -40 }, { id: "sack", kind: "plinth", x: 20, y: 0, z: 0, w: 0.22, h: 0.2, d: 0.22 }],
  captions: c.captions,
  beats: c.beats(shots, END),
  notes: "Generated by storyboards/series/krampus-myth/01-boots/bench/make-nick-bench.mjs (costume bench, no story).",
});
