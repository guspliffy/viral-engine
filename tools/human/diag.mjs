// A motion diagnostic for the anime person: one take on a plain floor with a level 25 cm grid, a FIXED camera that
// sees the whole body and the whole path (front, side or three-quarter), at any speed.
//   node tools/human/diag.mjs <clip> <from> <to> [view=side|front|q34] [speed=1] [travel=90|heading=<deg>] [id]
// The take is turned so its net travel points along +x (travel=90, the default) or faces a fixed heading
// (heading=<deg>, for moves done on the spot), and placed so its path is centred on the origin.
// Writes storyboards/human/diag/<id>.json and prints its id and duration.
import fs from "node:fs";
import { Performance, prepClip } from "../../engine/page/rigs/human-perform.js";

// A chain of takes blended into each other: <clip> = "c16_35:0:0.75+c16_08:0.55:1.5[@blend]" (from and to ignored)
const [clipArg, from0, to0, view = "side", speed = "1", turn = "travel=90", idArg] = process.argv.slice(2);
const LEG = 0.845;
const parts = clipArg.includes(":") ? clipArg.split("@")[0].split("+").map((x) => { const [c, a, b] = x.split(":"); return { clip: c, from: +a, to: +b }; }) : [{ clip: clipArg, from: +from0, to: +to0 }];
const blend = +(clipArg.split("@")[1] || 0.2);
const clip = parts.map((p) => p.clip).join("+");
const clips = Object.fromEntries(parts.map((p) => [p.clip, prepClip(JSON.parse(fs.readFileSync(`assets/mocap/${p.clip}.json`, "utf8")))]));
const list = (heading, place) => { let at = 0; return parts.map((p, i) => { const s = { at, clip: p.clip, from: p.from, to: p.to, ...(i === 0 ? { place, heading } : { blend }) }; at += p.to - p.from - (i < parts.length - 1 ? blend : 0); return s; }); };
const [tk, tv] = turn.split("=");
const one = (heading, place) => new Performance(list(heading, place), clips, [], LEG);
const totalDur = parts.reduce((a, p) => a + p.to - p.from, 0) - blend * (parts.length - 1), from = "0", to = String(totalDur);
let heading = +tv;
const endOf = (P) => { const L = P.L[P.L.length - 1]; return P.at(L.at + L.dur).pos; };
if (tk === "travel") { const P = one(0, [0, 0]), e = endOf(P), b = P.at(0).pos; heading = +(+tv - Math.atan2(e.x - b.x, e.z - b.z) * 180 / Math.PI).toFixed(2); }
const P0 = one(heading, [0, 0]);
const pts = []; for (let u = 0; u <= totalDur + 1e-6; u += 0.05) pts.push(P0.at(u).pos);
const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
const place = [+(-cx).toFixed(4), +(-cz).toFixed(4)];
// a fixed camera far enough to hold the whole path and a 2.2 m tall body (portrait 9:16, vertical fov 30)
const fov = 30, hfov = 2 * Math.atan(Math.tan((fov / 2) * Math.PI / 180) * 9 / 16);
const d = Math.max(5.2, (span + 1.2) / (2 * Math.tan(hfov / 2)), 2.6 / (2 * Math.tan((fov / 2) * Math.PI / 180)) + 0.5);
const dir = { side: [0, 1], front: [1, 0], q34: [0.7071, 0.7071], back: [-1, 0] }[view] || [0, 1];
const pos = [+(dir[0] * d).toFixed(3), 1.0, +(dir[1] * d).toFixed(3)], look = [0, 0.95, 0];
const dur = +((+to - +from) / +speed).toFixed(3);
const id = idArg || `diag-${clip.replace(/\+/g, "-")}-${view}${+speed !== 1 ? `-x${speed}` : ""}`;
const sb = {
  id, title: `Diagnostic ${clip} ${view}`, fps: 30, look: "anime-pro", profile: "short", loop: false, castLook: "sheet",
  rig: { hand: 2, eyes: 2, hold: 2 },
  set: { type: "plain", grid: 0.25, aperture: 0, focus: false, lighting: 2 },
  sound: { sfx: 0, ambience: 0 }, creative: { notes: false },
  cast: [{ id: "h", character: "human/vrm-test-01", at: place, face: "camera", expr: "kind", seed: 1.3, perform: list(heading, place).map((x) => ({ ...x, at: x.at / +speed, speed: +speed })) }],
  props: [], beats: [{ name: "a", at: 0, len: dur, shot: { pos, look, fov }, do: [] }], duration: dur,
};
fs.mkdirSync("storyboards/human/diag", { recursive: true });
fs.writeFileSync(`storyboards/human/diag/${id}.json`, JSON.stringify(sb, null, 1));
console.log(id, dur);
