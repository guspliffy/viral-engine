// Proof bench for the haul set (engine/page/props-ftt-haul.js, DESIGN.md section 8), TALL frame (1080 x 1920). Not a clip: one beat per still.
//   A1 camera 01 (the whole set, looking back down the rails)   A2 camera 04 (from behind and above, the ring ahead)
//   B0 B1 B2 the ropes at slack 0, 0.5, 1 from above            C0 C1 the lever at pump 0 and 1, the stone pried, camera 06
//   D0 D1 creep 0 and 0.05, camera 07 (D2 D3 the same close above the rail)  A3 A4 side and runner detail  E2 the skid from above                            E skid 1, camera 02            F the bare sledge, the lashed stone at y 8.84, camera 09
// Set frame (DESIGN 1): s forward, r right, world x = o.x + 124 - s, z = o.z - r. Spud (0.88 m) stands clear of every prop for scale.
//   node storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/make-ftt-haul.mjs      (prints the still times)
//   node engine/render.mjs storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/ftt-haul.json --stills <times> --draft --out out/ftt-haul
//   node qa/contact.mjs out/ftt-haul/ftt-haul-*.png --out storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/ftt-haul-sheet.png
import { clip, write, r3 } from "../../../../lib/clip.mjs";
import { plain, stones, SH_A, FRAME, CAST } from "../../../ancient-aliens/02-stonehenge/kit/sh-kit.mjs";

const F = FRAME.tall, o = [0, 0], c = clip();
const W = (s, r) => [r3(o[0] + 124 - s), r3(o[1] - r)];
const cam = (p, l, fov) => ({ pos: [W(p[0], p[2])[0], p[1], W(p[0], p[2])[1]], look: [W(l[0], l[2])[0], l[1], W(l[0], l[2])[1]], fov });
const G = W(0, 0), at = (id, kind, s, y, r, extra = {}) => { const [x, z] = W(s, r); return { id, kind, x, y, z, rot: 180, ...extra }; };

// land and light (DESIGN 1): no oaks, no ditch, no -henge / -avenue; the far ring on the rail line at 0.4
const land = plain("p", o, { era: "new", T: 25 }).filter((p) => !/-(henge|avenue)$/.test(p.id)).map((p) => (p.kind === "salisburyplain" ? { ...p, trees: false, ditch: false } : p));
const ring = stones("p", o, { era: "new", T: 25, built: 0.5 }).map((p) => ({ ...p, scale: 0.4 }));

const SUN = { sunAz: 20.5, sunEl: 11, sunColor: "#fff3c4" };
const STONE = { id: "stone", kind: "fallensarsen", x: G[0], y: 0.84, z: G[1], rot: 0, size: [4.25, 2.1, 1.1], look: "new", pieces: 1, sink: 0, seed: 3, fringe: false, ...SUN, staged: "it lies on the sledge's deck (SOLID); lifted in proof F it hangs in the ring ship's beam" };
const LASH = { id: "lash", kind: "haullash", x: G[0], y: 0.84, z: G[1], rot: 0, size: [4.25, 2.1, 1.1], seed: 1, staged: "the lashing rides the stone (same x, y, z, tilt): on the deck, lifted in proof F" };
const ROPES = [{ side: 1, id: "ropeA" }, { side: -1, id: "ropeB" }];
const props = [
  ...land, ...ring, STONE, LASH,
  at("sledge", "haulsledge", 0, 0, 0, { staged: "it rides on the rail tops (the rails are scenery, not solid)" }), at("rails", "haulrails", 0, 0, 0, { skidAt: [6.35, -1.04], staged: "the rails and sleepers are laid on the plain" }),
  ...ROPES.map((r) => at(r.id, "haulrope", 0, 0, 0, { side: r.side })),
  at("lever", "haullever", -2.64, 0.986, 0, { staged: "the pole rests on the pivot boulder's saddle" }), at("boulder", "pivotstone", -2.64, 0, 0),
  { id: "ship", kind: "ringship", x: W(0, 0)[0], y: 15, z: W(0, 0)[1], s: 0.35, beam: 0, wobble: 0, lit: 0.4, beamLen: 43, beamR: 7.1, staged: "it hovers over the sledge in proof F" },
];
const SP = (id, s, r, toward) => { const [x, z] = W(s, r), [tx, tz] = W(...toward); return { id, character: CAST.spud, at: [x, z], face: Math.round((Math.atan2(tx - x, tz - z) * 180) / Math.PI), expr: "kind", follow: 0.2, seed: 2.1 }; };
const cast = [SP("spudA", 10.5, -1.8, [22, 0]), SP("spudB", 9.2, 1.7, [5, 0]), SP("spudC", -4.6, -2.1, [-9.2, 5]), SP("spudF", 12.5, 1.3, [16, 0])];

// state per still (every param seeded at 0 and set again at each beat start)
let T = 0;
const state = (o2 = {}) => {
  const { slack = 0, pump = 0, creep = 0, skid = 0, lift = 0, beam = 0 } = o2, y = 0.84 + 0.06 * pump + 8 * lift, tilt = -1.62 * pump;
  for (const r of ROPES) c.prop(T, r.id, { slack }, 0);
  c.prop(T, "lever", { pump }, 0); c.prop(T, "rails", { creep, skid }, 0);
  c.prop(T, "stone", { y: r3(y), tilt }, 0); c.prop(T, "lash", { y: r3(y), tilt }, 0); c.prop(T, "ship", { beam, scale: lift ? 1 : 0 }, 0);
};
const CAM = {
  c01: cam([22, 0.35, 0], [4, 2.4, 0], 29), c04: cam([-21, 9.5, 5.5], [14, 2.0, -0.5], 52), top: cam([-1.0, 11, 0], [5.0, 0, 0], 52),
  c06: cam([-9.2, 0.6, 5.0], [-3.9, 1.2, -0.1], 48), c07: cam([-0.5, 0.26, 1.9], [-2.5, 0.42, 0.75], 44), side: cam([0.5, 1.2, 12], [0.5, 0.9, 0], 40), detail: cam([2.6, 0.9, 2.4], [1.8, 0.55, 0.5], 45), tail: cam([-2.9, 0.55, 1.15], [-2.0, 0.3, 0.52], 40), apron: cam([3.0, 5.5, -3.2], [3.2, 0, -3.0], 40), skidTop: cam([6.2, 2.2, -0.6], [6.1, 0, -1.04], 40), c02: cam([9.2, 0.42, -0.5], [6.35, 0.42, -1.15], 32), c09: cam([16, 0.4, 0], [0, 8.2, 0], 60),
};
const SHOTS = [
  ["A1", {}, CAM.c01, "A1 camera 01: the whole set, back down the rails"], ["A2", {}, CAM.c04, "A2 camera 04: from behind and above, the ring ahead"],
  ["A3", {}, CAM.side, "A3 sledge and stone from the side (+r)"], ["A4", {}, CAM.detail, "A4 runner detail"],
  ["B0", { slack: 0 }, CAM.top, "B0 ropes slack 0: taut"], ["B1", { slack: 0.5 }, CAM.top, "B1 ropes slack 0.5: sagging, grips taut"], ["B2", { slack: 1 }, CAM.top, "B2 ropes slack 1: all on the frost"],
  ["C0", { pump: 0 }, CAM.c06, "C0 lever pump 0, stone down"], ["C1", { pump: 1 }, CAM.c06, "C1 lever pump 1, back end up 12 cm"],
  ["D0", { creep: 0 }, CAM.c07, "D0 runner tail, creep 0"], ["D1", { creep: 0.05 }, CAM.c07, "D1 creep 0.05: 5 cm bare band"],
  ["D2", { creep: 0 }, CAM.tail, "D2 rail behind the tail, creep 0"], ["D3", { creep: 0.05 }, CAM.tail, "D3 creep 0.05"],
  ["E", { skid: 1 }, CAM.c02, "E skid 1, camera 02"], ["E2", { skid: 1 }, CAM.skidTop, "E2 skid from above"], ["E3", { skid: 1 }, CAM.apron, "E3 apron decal from above"], ["F", { lift: 1, beam: 1 }, CAM.c09, "F stone and lash at y 8.84, bare sledge, camera 09"],
];
const shots = [], names = [];
SHOTS.forEach(([name, st, cm, label], i) => { T = r3(0.1 + i); state(st); shots.push([name, T, cm]); names.push(name); c.cap(T, r3(T + 0.9), label, 330, false, { kinetic: false, size: 30 }); });
const END = r3(0.1 + SHOTS.length + 0.1);
console.log("stills:", shots.map(([, t]) => r3(t + 0.55)).join(","));
console.log("names:", names.join(","));

write(import.meta.url, {
  id: "ftt-haul", title: "Friends try to 08: haul set bench", idea: "Props bench for the haul set (haulsledge, haullash, haulrails, haulrope, haullever, pivotstone), not a clip", ...F.sb,
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: SH_A, music: false, sound: { auto: false }, hook: { show: ["spudA"], hint: 0, what: "engine test" },
  cast, props, captions: c.captions, beats: c.beats(shots, END), allowClip: [],
  notes: "Generated by storyboards/series/friends-try-to/08-move-a-stonehenge-stone/bench/make-ftt-haul.mjs (props bench, no reviews).",
});
