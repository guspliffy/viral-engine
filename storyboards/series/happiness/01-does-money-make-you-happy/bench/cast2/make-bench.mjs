// Bench for the cast of draft 2 (DESIGN.md section 11): poor Spud (costume.poor, characters/potatobrawl/spud-poor.json), the rich couple
// (costume types duchess and dauphin), the cashier and the coffee seller (costume type teller: tot.json, rosti.json). One group per camera on
// a plain set, 7 m apart. Not a clip.
//   <name>-front / -34 / -back   each new potato standing at rest: front, 3/4 (36 degrees), back
//   rosti-dressed                the seller in his props `apron` and `paperhat`
//   couple                       duchess and dauphin side by side, a `shopbag` in each fist (grips.mug, SIZE row shopbag)
//   pair                         poor Spud next to plain Spud
//   close-*                      duchess head, the dauphin's watch (a glint frame), Tot with the glasses slipped (slip 1), poor Spud's sweater
//   node .../make-bench.mjs && node engine/render.mjs .../cast2-bench.json --stills <times printed> --draft --out <dir>
import { clip, write, r3 } from "../../../../../lib/clip.mjs";
import * as grips from "../../../../../lib/grips.mjs";

const c = clip(), { A } = c;
const RIG = { hand: 2, eyes: 2, hold: 2 };
const MOTION = { feet: 2, overlap: true, timing: true, solve: true };
const CH = { duchess: "potatobrawl/duchess", dauphin: "potatobrawl/dauphin", tot: "potatobrawl/tot", rosti: "potatobrawl/rosti", poor: "potatobrawl/spud-poor", plain: "potatobrawl/spud" };
const NAMES = ["duchess", "dauphin", "tot", "rosti", "poor"], VIEWS = [["front", 0], ["34", 36], ["back", 180]];
const actor = (id, character, gx, face, expr = "kind", seed = 2.6) => ({ id, character, at: [gx, 0], face, expr, follow: 0.2, seed });
const EXPR = { duchess: "delighted", dauphin: "smug", tot: "kind", rosti: "deadpan", poor: "sad" };
const G = {}, cast = [], SHOTS = [], T = {};
let gx = -49, k = 0;
const camFor = (g, who, ox = 0) => ({ pos: [g + ox, ({ duchess: 0.8, dauphin: 0.8, tot: 0.62, rosti: 0.72, poor: 0.62 })[who] + 0.1, 4.8], look: [g, ({ duchess: 0.68, dauphin: 0.7, tot: 0.5, rosti: 0.62, poor: 0.52 })[who], 0], fov: 34 });
for (const who of NAMES) for (const [v, face] of VIEWS) {
  const id = `${who}-${v}`; G[id] = gx; cast.push(actor(id, CH[who], gx, face, EXPR[who])); T[id] = k++;
  SHOTS.push([id, camFor(gx, who, v === "34" ? 0.9 : 0), `${who}: ${v === "34" ? "3/4" : v}`]); gx += 7;
}
// the seller in his apron and paper hat
G.rd = gx; cast.push(actor("rosti-dressed", CH.rosti, gx, 20, "deadpan")); T.rd = k++; SHOTS.push(["rd", camFor(gx, "rosti", 0.4), "rosti: apron + paper hat"]); gx += 7;
// the couple, a shopbag in each fist
G.cp = gx; const DX = -0.7, XX = 0.7;
cast.push(actor("duc", CH.duchess, gx + DX, 20, "delighted"), actor("dau", CH.dauphin, gx + XX, -20, "smug")); T.cp = k++;
SHOTS.push(["cp", { pos: [gx, 0.9, 7.4], look: [gx, 0.6, 0], fov: 36 }, "the couple with shopbags"]); gx += 7;
// poor Spud next to plain Spud
G.pr = gx; cast.push(actor("prP", CH.poor, gx - 0.55, 0, "sad"), actor("prS", CH.plain, gx + 0.55, 0, "kind")); T.pr = k++;
SHOTS.push(["pr", { pos: [gx, 0.8, 5.6], look: [gx, 0.5, 0], fov: 34 }, "poor Spud and plain Spud"]); gx += 7;
// close-ups (they use the standing groups)
T.cDu = k++; SHOTS.push(["cDu", { pos: [G["duchess-front"] + 0.1, 0.95, 2.4], look: [G["duchess-front"], 0.78, 0], fov: 28 }, ""]);
T.cDa = k++; SHOTS.push(["cDa", { pos: [G["dauphin-34"] + 1.1, 0.75, 1.9], look: [G["dauphin-34"] + 0.5, 0.6, 0.3], fov: 20 }, ""]);
T.cTo = k++; SHOTS.push(["cTo", { pos: [G["tot-front"], 0.78, 2.3], look: [G["tot-front"], 0.56, 0], fov: 28 }, ""]);
T.cPo = k++; SHOTS.push(["cPo", { pos: [G["poor-front"] + 0.2, 0.7, 2.4], look: [G["poor-front"], 0.48, 0], fov: 30 }, ""]);
T.cPoB = k++; SHOTS.push(["cPoB", { pos: [G["poor-34"] + 1.0, 0.5, 2.0], look: [G["poor-34"] + 0.1, 0.32, 0], fov: 30 }, ""]);
const END = k;

// the couple's bags: hers #f29bb5 (R) and #f2c75a (L), his #c9a6e8 in the watch hand (L = +x)
const BAG = (id, color, who, side, wx) => ({ id, kind: "shopbag", color, ...grips.placeFor("shopbag", [wx, 0.14, 0.12], 0) });
const bags = [
  BAG("bagR", "#f29bb5", "duc", "R", G.cp + DX - 0.46), BAG("bagL", "#f2c75a", "duc", "L", G.cp + DX + 0.46), BAG("bagV", "#c9a6e8", "dau", "L", G.cp + XX + 0.5),
];
// the seller's worn props
const props = [
  { id: "rosApron", kind: "apron", wear: "rosti-dressed", x: 0, y: 0, z: 0, y0: 0.46, y1: 0.1, rx: 0.34, rz: 0.31, arc: 130 },
  { id: "rosHat", kind: "paperhat", wear: "rosti-dressed", x: 0, y: 1.07, z: 0.02, scale: 0.85 },
  ...bags,
];
grips.mug(c, "duc", bags[0], { side: "R" }).secure(0.01, 0.01);
grips.mug(c, "duc", bags[1], { side: "L" }).secure(0.01, 0.01);
grips.mug(c, "dau", bags[2], { side: "L" }).secure(0.01, 0.01);
// the dauphin's arms: the left (watch) arm held out in front, the right on his hip (they show the sleeves, the white cuff and the watch)
c.arm(0, "dauphin-34", "L", "hold", 0.01); c.arm(0, "dauphin-34", "R", "hips", 0.01);
c.arm(0, "duchess-34", "L", "hold", 0.01); c.arm(0, "duchess-34", "R", "hips", 0.01);
// the glasses slip in the close-up (slip is driven by `wings` until the timeline has its own key)
A(T.cTo + 0.05, "tot-front", "wings", { to: 1, dur: 0.01 });
for (const w of cast.map((a) => a.id)) A(0, w, "noblink");

const cam0 = SHOTS.map(([n, cam, label]) => [n, cam, label]);
// a frame on the dauphin's watch glint: the star shows when (t / 0.9) mod 1 is near 0.5
const glintT = r3(0.45 + 0.9 * Math.round((T.cDa + 0.55 - 0.45) / 0.9));
const times = SHOTS.map(([n]) => (n === "cDa" ? glintT : r3(T[n] + 0.55)));
console.log("stills:", times.join(","));
const NO_LABEL = ["cDu", "cDa", "cTo", "cPo", "cPoB"];
for (const [n, , label] of SHOTS) if (!NO_LABEL.includes(n)) c.cap(T[n], T[n] + 0.9, label, 240, false, { kinetic: false });
const ALLOW = [];
for (const [who, w] of [["rosti-dressed", "rosApron"], ["rosti-dressed", "rosHat"]]) ALLOW.push({ who, with: w, from: 0, to: END, reason: "worn by the seller" });

write(import.meta.url, {
  id: "cast2-bench", title: "Draft 2 cast bench", idea: "Poor Spud, the rich couple, the cashier and the coffee seller, not a clip",
  fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", motion: MOTION, rig: RIG, physics: false,
  set: { type: "plain", color: "#5b6376", floor: "#3f4655" }, music: false, sound: { auto: false },
  hook: { show: ["poor-front"], hint: 0, what: "engine test" },
  cast, props, allowClip: ALLOW, captions: c.captions, beats: c.beats(cam0.map(([n, cam]) => [n, T[n], cam]), END),
  notes: "Generated by storyboards/series/happiness/01-does-money-make-you-happy/bench/cast2/make-bench.mjs (cast bench, no reviews).",
});
