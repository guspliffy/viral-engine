// Bench for T8 (happiness 01 money redo, DESIGN.md section 6): the three side characters on the built costumes, the Duchess with the watch, Spud rich
// without glasses. Not a clip: stills only. One group per subject, 8 m apart, four actors per group = a turnaround strip (front, 3/4, side, back), wide frame.
//   carseller   characters/potatobrawl/carseller.json  + worn flatcap and bowtie (props-spree.js)
//   assistant   assistant.json                           + worn flatcap (the twins as1 / as2 are this file twice)
//   agent       agent.json                               (clipboard and its hold are the director's)
//   duchess     duchess.json, costume.watch true         (left arm up in the close-up)
//   spudrich    spud-rich.json, costume.rich { glasses: false }
// The cap and bow tie heights below are the MEASURED fit for the director (body frame, y up from the floor):
const FIT = {
  carseller: { cap: { y: 0.84, z: 0.0, r: 0.24 }, bow: { y: 0.34, z: 0.36 } },
  assistant: { cap: { y: 0.75, z: 0.0, r: 0.22 } },
};
//   FIT=1 node ... adds the cap and bow tie fit groups (not for preflight)
//   node storyboards/series/happiness/01-money-redo/bench/sidecast/make-sidecast-bench.mjs  -> sidecast-bench.json + the still times
//   flock /tmp/ve-render.lock node engine/render.mjs <json> --stills <times> --draft --safe --silent --out <dir>
//   node qa/contact.mjs <dir>/*.png --out <sheet.png> [--width 360]
import { clip, write, r3 } from "../../../../../lib/clip.mjs";

const c = clip();
const VIEWS = [["front", 0], ["q34", 40], ["side", 90], ["back", 180]], DX = [-1.65, -0.55, 0.55, 1.65];
const SUBJECTS = [
  { id: "carseller", ch: "potatobrawl/carseller", expr: "eager", cap: FIT.carseller.cap, bow: FIT.carseller.bow },
  { id: "assistant", ch: "potatobrawl/assistant", expr: "serene", cap: FIT.assistant.cap },
  { id: "agent", ch: "potatobrawl/agent", expr: "kind" },
  { id: "duchess", ch: "potatobrawl/duchess", expr: "delighted", watchArm: true },
  { id: "spudrich", ch: "potatobrawl/spud-rich", expr: "kind" },
];
const cast = [], props = [], shots = [], times = [];
const LOOK = { aperture: 0, focus: false, lighting: 2, hatch: { boil: 0.25 }, cel: { at: 0.25 }, ink: true, satsuei: true };
let k = 0;
const shot = (name, pos, look, fov) => { const t = k++ * 1.4; shots.push([name, t, { pos, look, fov }]); times.push(r3(t + 0.55)); };
SUBJECTS.forEach((S, gi) => {
  const gx = gi * 8;
  VIEWS.forEach(([v, face], vi) => {
    const id = `${S.id}_${v}`;
    cast.push({ id, character: S.ch, at: [r3(gx + DX[vi]), 0], face, expr: S.expr, follow: 0, seed: 2.6 + gi });
    if (S.cap) props.push({ id: `${id}_cap`, kind: "flatcap", wear: id, r: S.cap.r, x: 0, y: S.cap.y, z: S.cap.z });
    if (S.bow) props.push({ id: `${id}_bow`, kind: "bowtie", wear: id, x: 0, y: S.bow.y, z: S.bow.z });
      });
  shot(`${S.id}_turn`, [gx, 0.75, 4.7], [gx, 0.5, 0], 30);
});
// FIT=1 adds the two fit groups (they are meant to clip: a variant is wrong by being inside the head): the cap fit: the carseller, front and 3/4 views, four heights / radii of the cap side by side (CAPFIT: [y, spec.r])
if (process.env.FIT) {
const CAPFIT = [[0.84, 0.24], [0.88, 0.21], [0.9, 0.19], [0.92, 0.17]];
CAPFIT.forEach(([y, r], i) => {
  for (const [v, face] of [["f", 0], ["q", 50]]) {
    const id = `fit${v}${i}`; cast.push({ id, character: "potatobrawl/carseller", at: [r3(48 + (v === "q" ? 8 : 0) + DX[i]), 0], face, expr: "eager", follow: 0, seed: 2.6 });
    props.push({ id: `${id}_cap`, kind: "flatcap", wear: id, r, x: 0, y, z: 0 });
  }
});
// the bow tie fit: four (y, z) on the front view
[[0.34, 0.3], [0.4, 0.3], [0.34, 0.36], [0.4, 0.36]].forEach(([y, z], i) => {
  const id = `bowfit${i}`; cast.push({ id, character: "potatobrawl/carseller", at: [r3(64 + DX[i]), 0], face: 0, expr: "eager", follow: 0, seed: 2.6 });
  props.push({ id: `${id}_bow`, kind: "bowtie", wear: id, x: 0, y, z });
});
shot("bowfit", [64, 0.5, 3.0], [64, 0.45, 0], 28);
shot("capfit_front", [48, 0.9, 3.4], [48, 0.8, 0], 28); shot("capfit_q34", [56, 0.9, 3.4], [56, 0.8, 0], 28);
}
// close-ups: face and head of the cap wearers and the agent (front, 3/4 from the left), the Duchess's watch, Spud's bare head
const close = (id, name, dy = 0.0, d = 2.0, fov = 24) => { const a = cast.find((x) => x.id === id), x = a.at[0]; shot(name, [x, 0.8 + dy, d], [x, 0.7 + dy, 0], fov); };
close("carseller_front", "carseller_close_front"); close("carseller_q34", "carseller_close_q34");
close("carseller_side", "carseller_close_side"); close("assistant_front", "assistant_close_front", -0.05); close("assistant_q34", "assistant_close_q34", -0.05);
close("agent_front", "agent_close_front"); close("agent_q34", "agent_close_q34");
{ const x0 = 3 * 8 + 4;   // a lone Duchess, her LEFT hand held up in front of her chest: the watch faces the lens
  cast.push({ id: "duchess_hand", character: "potatobrawl/duchess", at: [x0, 0], face: 0, expr: "delighted", follow: 0, seed: 3.1 }); c.arm(0, "duchess_hand", "L", { o: [0.14, 0.5, 0.3] }, 0.01);
  shot("duchess_watch", [x0 + 0.5, 0.6, 1.7], [x0 + 0.14, 0.5, 0.3], 28); }; close("spudrich_front", "spudrich_close_front", 0.05); close("spudrich_q34", "spudrich_close_q34", 0.05);
const END = r3(k * 1.4);
write(import.meta.url, {
  id: "sidecast-bench", title: "Side cast bench (T8)", idea: "Bench for the money redo's side characters, not a clip", fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet", frame: "wide",
  motion: { feet: 2, overlap: true, timing: true, solve: true }, rig: { hand: 2, eyes: 2, hold: 2 }, physics: false,
  set: { type: "plain", color: "#f3d9a4", floor: "#d9b27a", light: "golden", para: 0, ...LOOK }, music: false, sound: { auto: false },
  hook: { show: ["carseller_front"], hint: 0, what: "engine test" },
  cast, props, allowClip: props.filter((p) => p.kind === "flatcap" && !process.env.FIT).flatMap((p) => [undefined, ["shell"]].map((checks) => ({ who: p.wear, with: p.id, from: 0, to: END, ...(checks && { checks }), reason: "the cap is worn: it sits on the head, as the paper hat and the balaclava in the first film" }))), captions: [], beats: c.beats(shots, END),
  notes: `Generated by bench/sidecast/make-sidecast-bench.mjs (character bench, no reviews). Stills: ${shots.map(([n], i) => `${i + 1}:${n}`).join(" ")}`,
});
console.log("stills at", times.join(","));
