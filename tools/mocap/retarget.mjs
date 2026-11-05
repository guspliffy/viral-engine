// Turns one CMU take into a named move for storyboards/lib/moves/ (quality plan item 16). Retarget by intent, never
// by joint angles: what is kept is where the body goes and how it carries itself, in numbers a potato can play with
// the actions it already has (storyboards/lib/moves/index.mjs plays them):
//   path   the pelvis over the floor, metres, in the move's frame (+f along the take's travel, +l to the left)
//   yaw    which way the body faces, degrees from the travel direction (+ turns left)
//   pitch  the torso's forward tip (pelvis -> neck), degrees from how this actor stands upright (+ forward)
//   lean   its sideways tip, degrees (+ toward its right, as the potato's lean)
//   drop   how far the pelvis sinks, as a share of its standing height (- = rises onto the toes)
//   hand   each hand from its own shoulder in the torso's frame [out, up, fwd], in arm lengths
//   head   the head's turn and nod against the torso, degrees ([+ to its left, + up])
//   feet   each foot's steps: lift and touch-down times, where it stood before and after (path frame), lift height
// Every channel goes through a two-way 1€ filter (one-euro.mjs). Times are seconds from `from`.
//   node tools/mocap/retarget.mjs <subject.asf> <take.amc> --name sneak --from 1.2 --to 10.6 [--out storyboards/lib/moves/sneak.json]
import fs from "node:fs";
import { readAsf, readAmc, pose } from "./asf-amc.mjs";
import { oneEuro2 } from "./one-euro.mjs";

const RATE = 120, OUT_FPS = 30;
const r4 = (x) => Math.round(x * 1e4) / 1e4, r2 = (x) => Math.round(x * 100) / 100;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a) || 1; return a.map((v) => v / l); };
const app = (m, v) => [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
const D = 180 / Math.PI;
const UP = [0, 1, 0];
const angD = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

export function retarget(sk, frames, { from = 0, to = Infinity, name = "move", source = "", stand = 0.3 } = {}) {
  const i0 = Math.round(from * RATE), i1 = Math.min(frames.length - 1, Math.round(to * RATE));
  const P = [];
  for (let i = i0; i <= i1; i++) P.push(pose(sk, frames[i]));
  // rest-pose forward (every turn zero): the bones' world turns map it to where each part faces
  const rest = pose(sk, {});
  const fRest = norm(cross(norm(sub(rest.pos.lhipjoint, rest.pos.rhipjoint)), UP));
  const armLen = ["humerus", "radius", "wrist"].reduce((s, b) => s + sk.bones["l" + b].lenM, 0);
  const hipHalf = Math.hypot(...sub(rest.pos.lhipjoint, rest.pos.rhipjoint)) / 2;
  // the take's travel: start to end of the pelvis over the floor (a take that stays put: the first facing)
  const a = P[0].pos.root, b = P[P.length - 1].pos.root;
  const body = (p) => {
    const left = norm([...sub(p.pos.lhipjoint, p.pos.rhipjoint)].map((v, k) => v + sub(p.pos.lclavicle, p.pos.rclavicle)[k]).map((v, k) => (k === 1 ? 0 : v)));
    return { left, fwd: norm(cross(left, UP)) };
  };
  let T = [b[0] - a[0], 0, b[2] - a[2]];
  if (Math.hypot(T[0], T[2]) < 0.3) T = body(P[0]).fwd;
  T = norm(T);
  const Lft = cross(UP, T);   // the travel frame's left (x left of +f, y up)
  const toMove = (w) => { const d = sub(w, a); return [dot(d, T), dot(d, Lft)]; };
  const heading = Math.atan2(T[0], T[2]);
  // standing references from the first `stand` seconds
  const ns = Math.max(1, Math.round(stand * RATE));
  const ch = { f: [], l: [], yaw: [], pitch: [], lean: [], drop: [], hR: [[], [], []], hL: [[], [], []], hy: [], hp: [] };
  let y0 = 0, p0 = 0, l0 = 0;
  const raw = P.map((p) => {
    const { left, fwd } = body(p);
    const neck = sub(p.pos.lowerneck, p.pos.root);
    const tp = Math.atan2(dot(neck, fwd), neck[1]), tl = -Math.atan2(dot(neck, left), neck[1]);
    const yaw = angD(Math.atan2(fwd[0], fwd[2]) - heading);
    const hf = app(p.rot.head, fRest), tf = app(p.rot.thorax, fRest);
    const hy = angD(Math.atan2(hf[0], hf[2]) - Math.atan2(tf[0], tf[2]));
    const hp = Math.atan2(hf[1], Math.hypot(hf[0], hf[2])) - Math.atan2(tf[1], Math.hypot(tf[0], tf[2]));
    // the torso's own frame for the hands: its up (pelvis -> neck), forward and left square to it
    const tu = norm(neck), tlft = norm(sub(left, tu.map((v) => v * dot(left, tu)))), tfw = cross(tlft, tu);
    const hand = (s) => {
      const v = sub(p.pos[s + "hand"], p.pos[s + "clavicle"]), side = s === "l" ? 1 : -1;
      return [(side * dot(v, tlft)) / armLen, dot(v, tu) / armLen, dot(v, tfw) / armLen];
    };
    return { m: toMove(p.pos.root), yaw, tp, tl, y: p.pos.root[1], hR: hand("r"), hL: hand("l"), hy, hp };
  });
  for (let i = 0; i < ns; i++) { y0 += raw[i].y / ns; p0 += raw[i].tp / ns; l0 += raw[i].tl / ns; }
  // unwrap the yaw so a filter never averages across ±180
  for (let i = 1; i < raw.length; i++) raw[i].yaw = raw[i - 1].yaw + angD(raw[i].yaw - raw[i - 1].yaw);
  for (const r of raw) {
    ch.f.push(r.m[0]); ch.l.push(r.m[1]); ch.yaw.push(r.yaw * D); ch.pitch.push((r.tp - p0) * D); ch.lean.push((r.tl - l0) * D);
    ch.drop.push((y0 - r.y) / y0); ch.hy.push(r.hy * D); ch.hp.push(r.hp * D);
    for (let k = 0; k < 3; k++) { ch.hR[k].push(r.hR[k]); ch.hL[k].push(r.hL[k]); }
  }
  const F = (xs, o) => oneEuro2(xs, RATE, o);
  const S = { f: F(ch.f, { min: 3 }), l: F(ch.l, { min: 3 }), yaw: F(ch.yaw), pitch: F(ch.pitch), lean: F(ch.lean), drop: F(ch.drop, { min: 3 }),
    hy: F(ch.hy), hp: F(ch.hp), hR: ch.hR.map((x) => F(x, { min: 2.5 })), hL: ch.hL.map((x) => F(x, { min: 2.5 })) };
  // the feet: a foot stands while its lowest point is near the floor and it hardly moves
  const feet = { R: [], L: [] };
  const floor = Math.min(...P.map((p) => Math.min(p.pos.ltoes[1], p.pos.rtoes[1], p.pos.lfoot[1], p.pos.rfoot[1])));
  for (const [s, k] of [["R", "r"], ["L", "l"]]) {
    const low = P.map((p) => Math.min(p.pos[k + "toes"][1], p.pos[k + "foot"][1]) - floor);
    const ank = P.map((p) => p.pos[k + "tibia"]), ball = P.map((p) => p.pos[k + "foot"]);
    const sp = ball.map((v, i) => (i ? Math.hypot(v[0] - ball[i - 1][0], v[2] - ball[i - 1][2]) * RATE : 0));
    const spF = oneEuro2(sp, RATE, { min: 4 });
    // its own floor: the lowest tenth of its heights (a foot rolls on its toes; a single low frame isn't the floor)
    const own = [...low].sort((x, y) => x - y)[Math.floor(low.length * 0.1)];
    let on = low.map((h, i) => h < own + 0.06 && spF[i] < 0.25);
    // a stance or a swing shorter than 0.08 s is noise: fill it with its neighbours
    const fix = (val) => { let i = 0; while (i < on.length) { let j = i; while (j < on.length && on[j] === on[i]) j++; if (on[i] === val && j - i < 0.08 * RATE && i > 0 && j < on.length) for (let q = i; q < j; q++) on[q] = !val; i = j; } };
    fix(false); fix(true);
    const stances = [];
    for (let i = 0; i < on.length; ) { let j = i; while (j < on.length && on[j] === on[i]) j++; if (on[i]) stances.push([i, j - 1]); i = j; }
    const where = ([i, j]) => { let x = 0, z = 0; for (let q = i; q <= j; q++) { x += ank[q][0]; z += ank[q][2]; } const n = j - i + 1; return toMove([x / n, 0, z / n]); };
    for (let q = 0; q + 1 < stances.length; q++) {
      const A = stances[q], B = stances[q + 1];
      let h = 0; for (let i = A[1]; i <= B[0]; i++) h = Math.max(h, ank[i][1] - ank[A[1]][1]);
      feet[s].push({ t0: r2(A[1] / RATE), t1: r2(B[0] / RATE), p0: where(A).map(r4), p1: where(B).map(r4), h: r4(h) });
    }
    // a foot that never lands again (the take ends mid-step) is left out; one in the air at the start, too
  }
  const n = Math.floor(((i1 - i0) / RATE) * OUT_FPS) + 1, at = (xs, k) => xs[Math.min(xs.length - 1, Math.round((k * RATE) / OUT_FPS))];
  const take = (xs, f = r4) => Array.from({ length: n }, (_, k) => f(at(xs, k)));
  return {
    name, source, credit: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217.",
    fps: OUT_FPS, len: r2((n - 1) / OUT_FPS), human: { armLen: r4(armLen), hipHalf: r4(hipHalf), pelvis: r4(y0) },
    path: Array.from({ length: n }, (_, k) => [r4(at(S.f, k)), r4(at(S.l, k))]),
    yaw: take(S.yaw, r2), pitch: take(S.pitch, r2), lean: take(S.lean, r2), drop: take(S.drop),
    head: Array.from({ length: n }, (_, k) => [r2(at(S.hy, k)), r2(at(S.hp, k))]),
    hand: { R: Array.from({ length: n }, (_, k) => S.hR.map((x) => r4(at(x, k)))), L: Array.from({ length: n }, (_, k) => S.hL.map((x) => r4(at(x, k)))) },
    feet,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), opt = {};
  for (let i = 2; i < args.length; i += 2) opt[args[i].replace(/^--/, "")] = args[i + 1];
  const [asf, amc] = args;
  const sk = readAsf(fs.readFileSync(asf, "utf8")), fr = readAmc(fs.readFileSync(amc, "utf8"));
  const mv = retarget(sk, fr, { from: Number(opt.from ?? 0), to: Number(opt.to ?? Infinity), name: opt.name || "move", source: opt.source || `CMU ${amc.split("/").pop()}` });
  const out = opt.out || `storyboards/lib/moves/${mv.name}.json`;
  // one frame a line: diffs stay readable
  const txt = JSON.stringify(mv).replace(/\],\[/g, "],\n[");
  fs.writeFileSync(out, txt + "\n");
  const steps = mv.feet.R.length + mv.feet.L.length;
  console.log(`${out}: ${mv.len} s, ${steps} steps, travel ${mv.path.at(-1)[0].toFixed(2)} m, pitch ${Math.min(...mv.pitch)}..${Math.max(...mv.pitch)}, drop ${Math.max(...mv.drop).toFixed(2)}`);
}
