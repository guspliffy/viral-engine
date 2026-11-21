// Potato Desk 11 "thermostat war" office props bench (task T3, 20 Nov 2026): workdesk, officechair, wallnotes, paperstack, manilafolder, icebag (worn + loose),
// bobblehat with spec.cuffColor, huddleblanket with spec.pattern "tartan" (engine/page/props-office11.js; DESIGN.md sections 2, 5, 6). Not a clip.
// The room is the DESIGN's: wall, carpet, three desks with paper stacks, chairs, wall notes, Chip lifted 0.26 at his desk in scarf + hat + tartan blanket, Spud, Mash in the ice bag.
//   node storyboards/lookdev/make-office11-bench.mjs
//   node engine/render.mjs storyboards/lookdev/office11-bench.json --stills <times the generator prints> --draft --safe --out storyboards/lookdev/out
//   node engine/render.mjs storyboards/lookdev/office11-bench-defaults.json --stills 0.5 --draft --safe --out storyboards/lookdev/out     (default bobblehat + default blanket, unchanged)
//   node qa/contact.mjs storyboards/lookdev/out/office11-bench-*.png --out storyboards/lookdev/out/office11-bench-sheet.png
import { clip, write, r3 } from "../lib/clip.mjs";

const c = clip();
const DESKS = [[-1.0, 0.255], [0.0, 0.255], [1.0, 0.255]];
const props = [
  { id: "wall", kind: "officewall", x: 0, y: 0, z: -1.3, w: 4.6, h: 2.6, dado: "#B7C4B8", wall: "#B7C4B8", top: "#B7C4B8", rail: "#AEBBAF" },
  { id: "floor", kind: "carpettiles", x: 0, y: 0, z: 4.6, w: 5.0, d: 12.0 },
  ...DESKS.map(([x, z], i) => ({ id: "desk" + i, kind: "workdesk", x, y: 0, z, w: 0.9, h: 0.5, d: 0.55 })),
  { id: "stackSpud", kind: "paperstack", x: -0.31, y: 0.5, z: 0.25, amount: 1 },
  { id: "stackChip", kind: "paperstack", x: -1.33, y: 0.5, z: 0.22, amount: 1 },
  { id: "stackMashA", kind: "paperstack", x: 0.82, y: 0.5, z: 0.36, amount: 1 },
  { id: "stackMashB", kind: "paperstack", x: 1.05, y: 0.5, z: 0.36, amount: 0.5 },
  { id: "folder", kind: "manilafolder", x: 1.3, y: 0.5045, z: 0.45, rot: 15, tip: -90 },
  { id: "chairGal", kind: "officechair", x: 3.3, y: 0, z: 0.2, rot: -25, patch: true },
  { id: "chairChip", kind: "officechair", x: -1.05, y: 0, z: -0.88 },
  { id: "chairSpud", kind: "officechair", x: 0.0, y: 0, z: -0.88, patch: true },
  { id: "chairMash", kind: "officechair", x: 1.62, y: 0, z: -0.3, rot: 25 },
  { id: "notes", kind: "wallnotes", x: 0, y: 0, z: -1.285 },
  { id: "bagLoose", kind: "icebag", part: "loose", x: 0.29, y: 1.34, z: -1.2 },
  // worn
  { id: "scarf", kind: "scarf", wear: "chip", color: "#8E2F3A", width: 0.11, x: 0, y: 0, z: 0 },
  { id: "hat", kind: "bobblehat", wear: "chip", color: "#8E2F3A", pom: "#8E2F3A", cuffColor: "#EFE3CC", cuffZigzag: "#8E2F3A", x: 0, y: 0, z: 0 },
  { id: "blanket", kind: "huddleblanket", pattern: "tartan", colors: ["#8E2F3A", "#EFE3CC"], check: 0.09, fringe: 0.03, cover: 1, over: [[-1.0, -0.36, 0.93]] },
  { id: "bagWorn", kind: "icebag", part: "worn", wear: "mash", x: 0, y: 0, z: 0 },
];
const cast = [
  { id: "chip", character: "potatobrawl/chip", at: [-1.0, -0.36], face: 0, expr: "kind", follow: 0.2, seed: 1.7 },
  { id: "spud", character: "potatobrawl/spud", at: [0.0, -0.36], face: 0, expr: "kind", follow: 0.2, seed: 1.9 },
  { id: "mash", character: "potatobrawl/mash", at: [1.0, -0.36], face: 0, expr: "kind", follow: 0.2, seed: 2.3 },
];
c.A(0, "chip", "move", { to: [-1.0, -0.36], dur: 0, y: 0.26 });
for (const w of ["chip", "spud", "mash"]) c.A(0, w, "noblink");

const sh = (pos, look, fov = 30) => ({ pos, look, fov });
const shots = [
  ["wide", sh([0.17, 1.75, 8.6], [0.17, 0.95, 0], 34)],
  ["chip", sh([-1.9, 1.25, 3.4], [-0.5, 1.02, -1.0], 34)],
  ["mash", sh([1.75, 1.25, 3.6], [0.45, 0.98, -0.9], 36)],
  ["mashHead", sh([1.0, 1.55, 1.9], [1.0, 1.42, -0.36], 26)],
  ["notes", sh([0.0, 1.3, 3.6], [0.0, 1.2, -1.2], 40)],
  ["deskMash", sh([1.15, 1.0, 2.2], [1.1, 0.6, 0.2], 30)],
  ["chairs", sh([0.0, 1.0, 1.9], [0.0, 0.7, -0.88], 32)],
  ["tartan", sh([-1.0, 0.95, 2.0], [-1.0, 0.75, -0.36], 30)],
  ["blanket", sh([-1.75, 0.95, 1.3], [-1.3, 0.8, -0.4], 30)],
  ["chairPatch", sh([3.3, 1.0, 2.4], [3.3, 0.6, 0.2], 30)],
];
const list = shots.map(([n, s], k) => [n, k * 1.1, s]);
console.log("office11-bench stills at", list.map(([n, t]) => `${n} ${(t + 0.5).toFixed(1)}`).join(", "));
const WRAP = { checks: ["clipping", "costume-in-prop", "shell", "hand-in-prop", "arm-in-prop"], reason: "bench: a blanket wrapped round a sitter, worn cloth over the body and arms (as in the clip)" };
const mkSb = (id, props2, cast2, beats, notes, allowClip = []) => ({
  id, title: "Office 11 props bench", idea: "Props bench for Potato Desk 11 (T3), not a clip", fps: 30, look: "anime-pro", profile: "short", loop: false,
  castLook: "sheet", physics: false,
  set: { type: "plain", color: "#aab6bc", floor: "#6E7680", light: "soft", para: 0, aperture: 0, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true },
  music: false, sound: { auto: false }, hook: { show: ["chip"], hint: 0, what: "engine bench" },
  cast: cast2, props: props2, captions: c.captions, beats, notes, ...(allowClip.length && { allowClip }),
});
write(import.meta.url, mkSb("office11-bench", props, cast, c.beats(list, 1.1 * list.length), "Generated by storyboards/lookdev/make-office11-bench.mjs (engine bench, no reviews).", [{ who: "chip", with: "blanket", from: 0, to: r3(1.1 * list.length), ...WRAP }, { who: "spud", with: "blanket", from: 0, to: r3(1.1 * list.length), ...WRAP }]));
// the defaults: a red bobblehat on Spud and the patchwork quilt over Mash, spec untouched (proof that the two additions change nothing)
const d = clip();
d.A(0, "spud", "noblink"); d.A(0, "mash", "noblink");
const dProps = [
  { id: "hat0", kind: "bobblehat", wear: "spud", x: 0, y: 0, z: 0 },
  { id: "quilt0", kind: "huddleblanket", cover: 1, over: [[0.8, 0, 1.38]] },
];
const dCast = [
  { id: "spud", character: "potatobrawl/spud", at: [-0.5, 0], face: 0, expr: "kind", follow: 0.2, seed: 1.9 },
  { id: "mash", character: "potatobrawl/mash", at: [0.8, 0], face: 0, expr: "kind", follow: 0.2, seed: 2.3 },
];
write(import.meta.url, { ...mkSb("office11-bench-defaults", dProps, dCast, d.beats([["defaults", 0, sh([0.15, 0.9, 4.4], [0.15, 0.75, 0], 36)]], 1.1), "Default bobblehat and huddleblanket (unchanged).", [{ who: "mash", with: "quilt0", from: 0, to: 1.1, ...WRAP }]), captions: d.captions });
