// Legend: The Boy Who Cried Wolf (Aesop, Greece), code-drawn DRAFT 2 (director's list: SHOTS.md + SOL-R1.md, lines: lines.json).
//   node storyboards/series/legend/cried-wolf/cw-render.mjs <out-subs.mp4> <out-nosubs.mp4> [--from s --to s]   (both exports in one pass)
//   TITLE=vase|marble|shepherd selects the opening banner (default vase); only frames 0..~90 depend on it: see cw-head.sh.
// Voice-led: every line starts when the previous line's last word/sound has ended (+ a gap); a shot of a line never starts
// before the previous line is over (no voice is cut off, no two voices overlap).
import { readFileSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as GR from "../../../../tools/svg2d/lib/legend-greece.mjs";
import { titleCard } from "../../../../tools/svg2d/lib/legend-greece-title.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
export const TITLE = process.env.TITLE || "vase";
const VO = "out/legend-wolf/vo", SPEC = JSON.parse(readFileSync("storyboards/series/legend/cried-wolf/lines.json", "utf8"));
const KEY = /wolf|teeth|see|eyes|voice/i;
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- voice: lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer, data.byteOffset, data.length >> 1) };
}
// stretches of REAL digital silence taken out of a line (never inside a word, never the first onset or the last tail):
// L16 "Please!" has 0.67 s of digital zero between the word and its tail sound
export const CUTS = { L16: [[0.6, 1.05]] };
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
for (const ln of Object.values(LINE)) {
  let { sr, s } = readWav(`${VO}/${ln.id}.wav`);
  ln.cuts = CUTS[ln.id] || [];
  if (ln.cuts.length) { const keep = []; for (let i = 0; i < s.length; i++) { const t = i / sr; if (!ln.cuts.some(([a, b]) => t >= a && t < b)) keep.push(s[i]); } s = Int16Array.from(keep); }
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = []; let last = 0;
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; const r = Math.sqrt(a / hop); env.push(r); if (r > 0.004) last = (i + hop) / sr; }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = align(ln.text.split(/\s+/), JSON.parse(readFileSync(`${VO}/${ln.id}.words.json`, "utf8")));
  ln.phrases = phrases(ln.words, ln.text, SPEC.cap?.[ln.id]);
  ln.len = Math.max(last, ln.words[ln.words.length - 1][2]);   // the last sound, or the last word as Whisper heard it
}
const wordAt = (ln, w) => { const x = ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "") === w) || ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };
const wordEnd = (ln, w) => ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w))[2];

// order and the breath between lines (seconds after the previous line's last sound)
export const ORDER = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L30", "L08", "L09", "L10", "L11", "L12", "L13", "L14", "L15", "L16", "L17", "L18", "L19", "L20", "L21", "L22", "L23", "L24", "L25", "L26", "L27"];
const GAP = { L02: 0.12, L03: 0.1, L04: 0.2, L05: 0.12, L06: 0.1, L07: 0.12, L30: 0.15, L08: 0.35, L09: 0.14, L10: 0.3, L11: 0.25, L12: 0.5, L13: 0.9, L14: 0.3, L15: 0.12, L16: 0.5, L17: 0.7, L18: 0.45, L19: 0.4, L20: 0.28, L21: 0.45, L22: 0.08, L23: 0.1, L24: 0.55, L25: 0.12, L26: 0.3, L27: 0.5 };
{ let prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? prev.end + GAP[id] : 0; ln.end = ln.at + ln.len; prev = ln; } }
for (let i = 1; i < ORDER.length; i++) if (LINE[ORDER[i]].at < LINE[ORDER[i - 1]].end) throw new Error("voices overlap at " + ORDER[i]);
export const DUR = +(LINE.L27.at + wordEnd(LINE.L27, "town") + 0.35).toFixed(2);
export const TL_LINES = ORDER.map((id) => LINE[id]);
const prevEnd = (id) => { const i = ORDER.indexOf(id); return i ? LINE[ORDER[i - 1]].end : 0; };

// ---------------------------------------------------------------- faces: every drawn face/eye pair registers a circle, captions keep clear of them
let FACES = [];
const face = (x, y, r) => { FACES.push({ x, y, r }); };
const K_ = (c, st, t) => { const kd = L.kid(c, st, t); if (kd.p) face(kd.p.x + (st.fx ?? 0) * 0.02 * kd.p.s, kd.p.y - 1.1 * kd.p.s, 0.17 * kd.p.s); return kd; };
const G_ = (c, st, t, sl) => { const g = L.keeper(c, st, t, sl); if (g.p) face(g.p.x + (st.fx ?? -0.7) * 0.02 * g.p.s, g.p.y - 1.3 * g.p.s, 0.2 * g.p.s); return g; };
const VL_ = (c, st, t) => { const v = GR.villager(c, st, t); if (v.p) { const sc = (st.h ?? 165) / 165; face(v.p.x, v.p.y - 1.5 * sc * v.p.s, 0.16 * sc * v.p.s); } return v; };
const eyesT = (c, list, t) => { for (const e of list) { if (e.open === 0) continue; const p = L.P(c, e.X, e.Y, e.Z); if (p.s > 0 && p.s < 4000) face(p.x, p.y, 0.2 * p.s * (e.size ?? 1) / 3.3 * 1.0 + 20); } return GR.eyesInTrees(c, list, t); };
const wolfFace = (wf) => { if (wf.head) face(wf.head.x, wf.head.y, 0.3 * wf.head.s); return wf; };

// ---------------------------------------------------------------- building blocks
const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${GR.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter><filter id="gb3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.5"/></filter>${inner}${GR.vignette()}`;
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? 0);
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const oe = (i, o = {}) => ({ ...GR.OLIVES[i].eye, ...o });
const MOOD = (m) => { const q = Math.min(m, 0.5); GR.mood(q); return q; };      // every shot sets its mood FIRST: props read the palette when they are built
const WALK = 0.75;                                                                // metres per walk cycle: feet do not slide
const PROP = ["lamp", "fork", "staff", "lamp", "club", "staff"];                 // one prop per villager kind, in every shot

// hillside shot: items = [{Z, svg}] stacked in the world; over = svg drawn after the grade (eyes)
function hill(c, t, o = {}) {
  const hs = GR.hillside(c, t, o.hs || {}), items = [...hs.items, ...(o.items || [])];
  return GR.sky(c, t, { moon: o.moon === undefined ? [800, 250, 56] : o.moon, stars: o.stars ?? 0.5 }) + hs.back + GR.stack(items) + GR.mist(c, t) + (o.near === false ? "" : GR.near(c, t)) + GR.grade() + (o.over || "") + (o.dark ? GR.blackout(o.dark) : "") + (o.after || "");
}
function kidCrook(c, st, t, cr = {}) {
  const kd = K_(c, st, t);
  return { kd, svg: kd.svg + (cr === false || !kd.sleeve ? "" : GR.crook(c, { at: kd.sleeve, s: kd.p.s, rot: 5, grip: 74, len: 140, ...cr })) };
}
const sheepAt = (c, t, list) => GR.flock(c, list, t).items;
const PENFLOCK = (t, look = 0, o = {}) => [
  { X: -2.25, Z: 6.0, dir: 1, pose: GR.sheepPose("graze", "look", o.lookA ?? look), mark: 1, blink: bl(t, 0.1) }, { X: -1.1, Z: 5.7, dir: -1, pose: GR.sheepPose("graze", "look", look * 0.8) }, { X: -0.2, Z: 6.1, dir: 1, pose: o.huddle ? "huddle" : GR.sheepPose("graze", "look", look * 0.5) },
  { X: -2.0, Z: 5.1, dir: 1, pose: o.huddle ? "huddle" : "graze", size: 0.82 }, { X: -0.65, Z: 5.0, dir: -1, pose: o.huddle ? "huddle" : GR.sheepPose("graze", "look", look), mark: 1, seed: 8 }, { X: 0.05, Z: 5.35, dir: -1, pose: "graze", size: 0.9 },
];
// villagers with their props (kind -> lamp/fork/staff/club, always the same). list: { kind, X, Z, dir, walk, armUp, shout, angry, h }
function crowd(c, t, list) {
  const items = [], lights = [];
  for (const v of list) {
    const q = VL_(c, v, t); if (!q.hand) continue;
    const kind = PROP[v.kind % 6]; let prop;
    if (kind === "lamp") { const lp = GR.oilLamp(c, { at: q.hand, s: q.hand.s, poolAt: { x: q.p.x, y: q.p.y }, flame: 1 }, t); prop = lp.svg; lights.push(lp.light); }
    else prop = GR.stick(c, { at: q.hand, s: q.hand.s, kind, grip: kind === "club" ? 12 : kind === "fork" ? 40 : 70, rot: v.rot ?? (v.dir === -1 ? 10 : -10), seed: v.kind + 1, len: kind === "fork" ? 125 : undefined });
    items.push({ Z: v.Z, svg: q.svg + prop });
  }
  return { items, light: lights.join("") };
}
// one walker: X(t) is a straight line at speed v; the walk cycle follows the distance walked
const walker = (kind, x0, v, u, Z, o = {}) => ({ kind, X: x0 + v * u, Z, dir: v >= 0 ? 1 : -1, walk: Math.abs(v * u) / WALK + (o.ph ?? 0), armUp: 0.6, angry: 0.6, ...o });

// the village square; o = { mood, skyMood, windows [15], doors 0..1, lamp, cast [], extra [], over }
const DOORS = [{ X: -3.09, w: 0.78, h: 1.72, y: 0, Z: 8, arch: 0 }, { X: -0.05, w: 0.9, h: 1.95, y: 0, Z: 8.3, arch: 1 }, { X: 3.39, w: 0.7, h: 1.6, y: 2.0, Z: 8, arch: 0 }];
function doorGlow(c, f) {
  if (f < 0.02) return "";
  let s = "";
  for (const d of DOORS) {
    const a = L.P(c, d.X - d.w / 2, d.y, d.Z - 0.05), b = L.P(c, d.X + d.w / 2, d.y + d.h, d.Z - 0.05);
    s += `<path d="M${n(a.x)},${n(a.y)} L${n(b.x)},${n(a.y)} L${n(b.x)},${n(b.y + (d.arch ? 0.25 * a.s * d.w : 0))} Q${n((a.x + b.x) / 2)},${n(b.y - (d.arch ? 0.2 * a.s * d.w : 0))} ${n(a.x)},${n(b.y + (d.arch ? 0.25 * a.s * d.w : 0))} Z" fill="#ffd27a" opacity="${n(f * 0.95 * 100) / 100}"/>`;
    if (d.y === 0) { const g0 = L.P(c, d.X - d.w / 2, 0, d.Z - 0.05), g1 = L.P(c, d.X + d.w / 2, 0, d.Z - 0.05), h0 = L.P(c, d.X - d.w * 1.6, 0, d.Z - 2.2), h1 = L.P(c, d.X + d.w * 1.6, 0, d.Z - 2.2); s += `<path d="M${n(g0.x)},${n(g0.y)} L${n(g1.x)},${n(g1.y)} L${n(h1.x)},${n(h1.y)} L${n(h0.x)},${n(h0.y)} Z" fill="#ffb450" opacity="${n(f * 0.4 * 100) / 100}" style="mix-blend-mode:screen"/>`; }
  }
  return s;
}
function square(c, t, o = {}) {
  GR.mood(o.skyMood ?? o.mood ?? -0.9);
  const sky = GR.sky(c, t, { moon: o.moon ?? [860, 190, 44] });
  GR.mood(o.mood ?? -0.9);
  const vg = GR.village(c, t, { bellSwing: o.bell ?? 0, ropePull: 0, windows: o.windows ?? new Array(15).fill(1), lamp: o.lamp ?? 1, well: o.well });
  const cr = o.cast ? crowd(c, t, o.cast) : { items: [], light: "" };
  const items = [...vg.items, ...cr.items, ...(o.extra || [])];
  return sky + vg.back + doorGlow(c, o.doors ?? 0) + GR.stack(items) + GR.mist(c, t, [14]) + GR.grade() + cr.light + (o.over || "");
}
const CROWD = () => [
  { kind: 0, X: -2.3, Z: 6.4, armUp: 1, shout: 1, angry: 1 }, { kind: 1, X: -1.45, Z: 6.9, armUp: 0.9, shout: 0.6, dir: 1 }, { kind: 2, X: -0.6, Z: 7.3, armUp: 0.2 },
  { kind: 3, X: 0.55, Z: 7.0, armUp: 0.75, dir: -1, shout: 0.4 }, { kind: 4, X: 1.3, Z: 6.3, armUp: 1, dir: -1, shout: 1, angry: 1 }, { kind: 5, X: 3.0, Z: 6.6, armUp: 0.6, dir: -1 },
];

// kid on a dark slope, shouting at the lit village far below; his crook stands planted beside him (it never vanishes)
function shoutDown(u, o) {
  const m = MOOD(o.mood ?? 0.2);
  const c = { x: 0.3 - u * 0.05, y: 1.3, z: 0, f: 2000, h0: 760 }, kc = { x: o.kx ?? 0.2, y: 1.3, z: 0, f: 2000, h0: 760 };
  const kX = o.X ?? 0.65, kZ = o.Z ?? 3.0;
  const crk = GR.crook(kc, { X: kX - 0.4, Y: 0, Z: kZ + 0.05, rot: 5, grip: 0, len: 150 });
  const kd = K_(kc, { X: kX, Z: kZ, fx: -0.75, hand2face: o.cup ?? 1, talk: o.talk ?? 0, shock: 0, worry: o.worry ?? 0, blink: bl(u, 0.4) }, u);
  const eyes = o.eyes ? eyesT(c, o.eyes, u) : "";
  const sl = o.slope ?? 1700;
  const slope = `<path d="M-10,${sl} Q300,${sl - 60} 620,${sl - 20} Q900,${sl - 10} 1100,${sl - 90} L1100,1930 L-10,1930 Z" fill="${GR.M.earthS}"/>`;
  const tree = o.tree === false ? "" : GR.olive(c, u, { X: o.treeX ?? 3.2, Z: 3.6, Y: 0.2, size: 3.3, seed: 2, detail: 0.6 });
  return GR.sky(c, u, { moon: o.moon ?? [260, 230, 56] }) + GR.far(c, u) + GR.villageFar(c, u, { lightsOn: o.lights ?? 1 }) + tree + eyes + slope + crk + kd.svg + GR.mist(c, u, [14]) + GR.grade() + (o.over || "");
}

// ---------------------------------------------------------------- the shots
// shot(id, line, startFn, fn, opts): fn(u, ctx) u = seconds into the shot, ctx = { ln, lu (seconds into its line), t (global) }
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });
const LN = (id) => LINE[id], WD = (id, w) => LINE[id].at + wordAt(LINE[id], w);

// 1  L01 the wolf's eyes in the black: eyes from frame 0, trunk + terrace edge a touch lifted, a slow creep in toward "SEE"
shot("1", "L01", () => 0, (u) => {
  GR.mood(1);
  const c = { x: 2.7, y: 0.78, z: lerp(3.2, 4.3, u / 2.9), h0: 1010 };
  const hs = GR.hillside(c, u), wf = GR.wolf(c, { X: 1.95, Z: 6.2, pose: "hidden", size: 1.3, eyeSize: 1.9, blink: blinkAmt(u, [1.44]), look: tr([[0, -0.5], [0.9, 0.1], [2, 0]], u) }, u);
  face(wf.head.x, wf.head.y, 70);
  return GR.sky(c, u, { moon: false, stars: 0.5 }) + hs.svg + GR.mist(c, u) + GR.grade() + GR.blackout(0.48) + wf.eyes;
});
// 2  L02 kid close at the gate, guilty side-eye; eyes still in the olives behind him
shot("2", "L02", () => LN("L02").at - 0.12, (u, x) => {
  const m = MOOD(0.6), c = { x: -1.25 + u * 0.03, y: 1.0, z: 2.5 + u * 0.12, h0: 960 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.7, worry: 0.9, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  const eyes = eyesT(c, [oe(1, { size: 2.6, open: clamp(u / 0.4) }), oe(0, { X: 1.0, Y: 1.9, Z: 8.5, size: 2.4, open: clamp((u - 0.5) / 0.3) })], u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], over: eyes });
});
// 3  L03 the pen wide: a bored kid (sways, taps the crook, yawns, looks around); on "By two" a push in on his face
shot("3a", "L03", () => LN("L03").at - 0.02, (u, x) => {
  const m = MOOD(0.2), c = { x: -0.9 - u * 0.04, y: 1.45, z: 0.2, h0: 1010 };
  const yawn = tr([[1.2, 0], [1.6, 1], [2.3, 1], [2.7, 0]], u);
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: tr([[0, 0.5], [1.0, -0.5], [2.2, 0.6], [3.2, 0.2]], u), shock: yawn * 0.9, tug: 0.5 + 0.5 * Math.sin(u * 3.1), lean: Math.sin(u * 1.2) * 2.2, blink: bl(u) }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u))], moon: [760, 300, 52] });
});
shot("3b", "L03", () => WD("L03", "by") - 0.05, (u, x) => {
  const m = MOOD(tr([[0, 0.2], [2, 0.5]], u)), c = { x: -1.3, y: 1.02, z: lerp(2.5, 2.9, ease(u / 2.4)), h0: 960 };
  const k = kidCrook(c, { X: -1.2, Z: 4.3, fx: 0.1, worry: tr([[0, 0], [1.2, 0.8]], u), shock: 0, blink: bl(u + 2) }, u);
  const eyes = eyesT(c, [oe(1, { size: 2.6 }), oe(3, { size: 2.8, open: clamp((u - 0.8) / 0.3) })], u);
  return hill(c, u, { mood: m, items: [{ Z: 4.3, svg: k.svg }], over: eyes });
});
// 4  L04 kid shouts at the village; one pair of eyes blinks in the olive tree on each shout
shot("4", "L04", () => LN("L04").at - 0.04, (u, x) => {
  const lu = x.lu, w1 = LINE.L04.words[0][1], w2 = LINE.L04.words[1][1];
  const eyes = [{ X: 3.0, Y: 1.45, Z: 3.55, size: 1.6, blink: Math.max(blinkAmt(lu, [w1 - 0.1]), blinkAmt(lu, [w2 - 0.1])) }];
  return shoutDown(u, { talk: talkAt(x.ln, lu), eyes, mood: 0.2 });
});
// 5  L05 the crowd runs up the hill (cycle tied to the distance walked), first villagers already in at the cut
const ARR = [[0, -1.8, 3.7], [1, -3.0, 4.15], [4, -4.1, 3.6], [3, -5.3, 4.2], [2, -6.4, 3.8]];
shot("5", "L05", () => LN("L05").at - 0.15, (u, x) => {
  const m = MOOD(0.1), c = { x: -0.5, y: 1.3, z: -0.3 + u * 0.05, h0: 1050 };
  const cast = ARR.map(([k, x0, Z], i) => walker(k, x0, 2.3, u, Z, { ph: i * 0.31, armUp: 0.8, angry: 0.8 }));
  const cr = crowd(c, u, cast), hs = GR.hillside(c, u);
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.back + GR.stack([...hs.items, ...cr.items]) + GR.mist(c, u) + GR.grade() + cr.light + eyesT(c, [oe(0, { size: 2.2, blink: blinkAmt(x.lu, [0.4]) })], u);
});
// 6  L06 the angry villager close (the same man with the same lamp), panting
shot("6", "L06", () => LN("L06").at - 0.24, (u, x) => {
  const m = MOOD(0), c = { x: 0.0, y: 1.42, z: 1.6, h0: 900 }, hs = GR.hillside(c, u);
  const cr = crowd(c, u, [{ kind: 0, X: 0.0, Z: 3.2, Y: Math.sin(u * 14) * 0.012, dir: 1, fx: 0.3, armUp: 1, shout: 0.35 + 0.6 * talkAt(x.ln, x.lu), angry: 1, h: 175 }]);
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.svg + GR.stack(cr.items) + GR.mist(c, u) + GR.grade() + cr.light;
});
// 7  L07 kid grin close; the grin leaves at ~1.1 s
shot("7", "L07", () => LN("L07").at - 0.05, (u, x) => {
  const m = MOOD(0), c = { x: -1.2, y: 1.04, z: 2.5 + u * 0.1, h0: 960 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.0, grin: 1, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.3) }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }] });
});
// 8  L30 villagers turn away (a lamp sweeps off the terrace and uncovers one pair of eyes); the camera pushes to them; a blink on "counting"
shot("8a", "L30", () => LN("L07").at + 1.15, (u, x) => {
  const m = MOOD(0.5), c = { x: 2.3, y: 1.45, z: lerp(0.4, 1.2, ease(u / 3.2)), h0: 1000 }, hs = GR.hillside(c, u);
  const cast = [[0, 1.2, 3.3], [3, 2.9, 3.9], [4, 4.3, 3.2]].map(([k, x0, Z], i) => walker(k, x0 + 0.6, -1.0, u, Z, { ph: i * 0.4, armUp: 0.3, angry: 0.5, fx: -0.2 }));
  const cr = crowd(c, u, cast);
  const e = oe(0, { size: 2.4, open: clamp((u - 0.9) / 0.35) });
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.back + GR.stack([...hs.items, ...cr.items]) + GR.mist(c, u) + GR.grade() + cr.light + eyesT(c, [e], u);
});
shot("8b", "L30", () => WD("L30", "something") - 0.45, (u, x) => {
  const m = MOOD(0.5), c = { x: 2.3, y: lerp(1.45, 1.55, ease(u / 3)), z: lerp(1.2, 4.6, ease(u / 3.4)), h0: lerp(1000, 940, ease(u / 3)) }, hs = GR.hillside(c, u);
  const e = [oe(0, { size: lerp(2.4, 3.8, ease(u / 3.4)), blink: blinkAmt(x.lu, [wordAt(LINE.L30, "counting") + 0.1]) })];      // the blink on "counting"
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.svg + GR.mist(c, u) + GR.grade() + GR.blackout(lerp(0.0, 0.12, ease(u / 3.4))) + eyesT(c, e, u);
});
// 9  L08/L09 11 p.m.: a tighter side angle, he shouts again; a few frames on the eyes blinking at the end of the call
shot("9a", "L08", () => LN("L08").at - 0.1, (u, x) => {
  const m = MOOD(0.3), c = { x: -0.7, y: 1.35, z: 1.4, h0: 1000 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.8, shock: 0, tug: tr([[0.9, 0], [1.2, 1]], u), blink: bl(u, 0.7), look: 0.8 }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u))], moon: [300, 250, 52] });
});
shot("9b", "L09", () => LN("L09").at - 0.05, (u, x) => {
  const w1 = LINE.L09.words[0][1];
  return shoutDown(u, { talk: talkAt(x.ln, x.lu), eyes: [{ X: 3.0, Y: 1.45, Z: 3.55, size: 1.7, blink: blinkAmt(x.lu, [w1 + 0.55]) }], mood: 0.3, moon: [760, 260, 52], X: 0.55, Z: 2.3, treeX: 3.0, kx: 0.25 });
});
shot("9c", "L09", () => LN("L09").end, (u, x) => {
  const m = MOOD(0.5), c = { x: 2.6, y: 1.7, z: 4.4, h0: 960 };
  const e = [oe(0, { size: 4.6, blink: blinkAmt(u, [0.1, 0.19]) })];
  return GR.sky(c, u, { moon: [800, 250, 56] }) + GR.hillside(c, u).svg + GR.mist(c, u) + GR.grade() + GR.blackout(0.1) + eyesT(c, e, u);
});
// 10  L10 fewer came (from the first crowd's angle), angrier; the grandmother comes last, a lantern in her hand, her candle smaller
const ARR2 = [[0, -1.7, 3.7], [4, -3.1, 4.1], [3, -4.6, 3.6]];
shot("10a", "L10", () => LN("L10").at - 0.02, (u, x) => {
  const m = MOOD(0.3), c = { x: -0.5, y: 1.3, z: -0.3, h0: 1050 };
  const cast = ARR2.map(([k, x0, Z], i) => walker(k, x0, 2.0, u, Z, { ph: i * 0.31, armUp: 0.9, angry: 1, shout: 0.4 }));
  const cr = crowd(c, u, cast), hs = GR.hillside(c, u);
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.back + GR.stack([...hs.items, ...cr.items]) + GR.mist(c, u) + GR.grade() + cr.light;
});
const gX = (u) => -2.6 + 0.9 * u;     // grandmother's X, 0.9 m/s
shot("10b", "L10", () => WD("L10", "his") - 0.15, (u, x) => {
  const m = MOOD(0.3), c = { x: gX(u) + 0.35, y: 1.2, z: lerp(0.8, 1.4, ease(u / 1.8)), h0: 960 }, hs = GR.hillside(c, u);
  const g = G_(c, { X: gX(u), Z: 3.3, run: Math.abs(0.9 * u) / WALK, stern: 0.7, flame: 0.45, fx: 0.6 }, u, null);
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.back + GR.stack([...hs.items, { Z: 3.3, svg: g.svg }]) + GR.mist(c, u) + GR.grade();
});
// 11  L11 grandmother, her face for "Twice now"; the candle close in the pause; the reaction cut on "used up"; his face changes on "your voice"
const gran = (u, x, extra = {}) => {
  const m = MOOD(0.3), c = { x: -1.0, y: 1.15, z: 2.0 + u * 0.05, h0: 900 }, hs = GR.hillside(c, u);
  const g = G_(c, { X: -1.35, Z: 4.0, stern: 1, flame: 0.4, fx: 0.6, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.5), ...extra }, u, null);
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.svg + g.svg + GR.mist(c, u) + GR.grade();
};
shot("11a", "L11", () => LN("L11").at - 0.05, (u, x) => gran(u, x));
shot("11b", "L11", () => WD("L11", "now") + 0.2, (u, x) => {          // the candle jar close (grandmother's fear meter): the flame leans, shrinks
  const m = MOOD(0.4), c = { x: -1.0, y: 1.0, z: 2.8, h0: 960 };
  const jar = jarSvg(c, -1.0, 3.4, tr([[0, 0.5], [0.8, 0.32]], u), u, 1.15);
  const p = L.P(c, -1.0, 1.0, 3.4);
  const glow = `<circle cx="${n(p.x)}" cy="${n(p.y - 0.2 * p.s)}" r="${n(0.55 * p.s)}" fill="#ff9a2a" opacity="0.22" style="mix-blend-mode:screen"/>`;
  return GR.sky(c, u, { moon: false }) + GR.hillside(c, u).svg + GR.grade() + GR.blackout(0.45) + jar + glow;
});
shot("11c", "L11", () => WD("L11", "you've") - 0.08, (u, x) => gran(u + 1.0, x));
shot("11d", "L11", () => WD("L11", "used") - 0.1, (u, x) => {
  const m = MOOD(0.3), c = { x: -1.2, y: 1.02, z: lerp(2.5, 2.3, ease(u / 1.5)), h0: 940 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.15, worry: tr([[0, 0.2], [Math.max(0.1, wordAt(LINE.L11, "your") - (x.lu - u)), 0.4], [Math.max(0.2, wordAt(LINE.L11, "your") - (x.lu - u)) + 0.4, 1]], u), shock: 0, blink: bl(u + 1) }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], moon: [300, 250, 52] });
});
// 12  L12 2 a.m.: a sheep's ears lift, the flock turns to the grove on the real howl; eyes in the olive trees, TWO more pairs open
shot("12", "L12", () => LN("L12").at, (u, x) => {
  const m = MOOD(0.9), c = { x: -0.8 + u * 0.06, y: 1.5, z: 0.5 + u * 0.08, h0: 1000 };
  const w = wordAt(LINE.L12, "howled"), lk = (d) => ease(clamp((x.lu - w + d) / 0.4));
  const ears = ease(clamp((x.lu - 0.3) / 0.5));
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: tr([[0, 0.4], [2, 0.4], [2.6, -0.6]], x.lu), worry: 0.7, blink: bl(u, 0.9) }, u);
  const eyes = eyesT(c, [oe(1, { size: 4.2, open: clamp((x.lu - w + 0.5) / 0.35) }), oe(0, { size: 4.4, open: clamp((x.lu - w - 0.15) / 0.35) }), oe(3, { size: 4.6, open: clamp((x.lu - w - 0.6) / 0.35) })], u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, Math.max(ears * 0.45, lk(0)), { lookA: Math.max(ears, lk(0)) }))], moon: [790, 190, 50], over: eyes });
});
// 13  L13 history over the wolf's shadow tracking along the wall; the pen; a 12-frame flash on "But"; tight on the kid; his look matches a glint on the live muzzle
shot("13a", "L13", () => LN("L13").at - 0.05, (u, x) => {
  const m = MOOD(0.8), wx = tr([[0, -3.4], [3.0, 0.6]], u), c = { x: wx + 0.5, y: 1.5, z: 2.0, h0: 1000 };
  const wf = GR.wolf(c, { X: wx, Z: 8.2, Y: GR.groundY(8.2), dir: 1, pose: "stalk", phase: Math.abs(wx + 3.4) / 1.5, size: 1.15 }, u);
  const sil = `<g style="filter:brightness(0.28)">${wf.svg}</g>`;
  return hill(c, u, { mood: m, items: [{ Z: 8.2, svg: sil }], over: wf.eyes, hs: { pen: true }, moon: false });
});
shot("13b", "L13", () => WD("L13", "it") - 0.1, (u, x) => {
  const m = MOOD(0.8), c = { x: -1.0, y: 1.4, z: 0.4, h0: 1000 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.5, worry: 0.6, blink: bl(u, 1.1) }, u);
  const eyes = eyesT(c, [oe(1, { size: 4.0 }), oe(0, { size: 4.2 }), oe(3, { size: 4.4 })], u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, 1, { huddle: true }))], over: eyes, moon: false });
});
shot("13c", "L13", () => WD("L13", "but") + 0.3, (u, x) => {
  const m = MOOD(0.6), c = { x: -1.2, y: 1.04, z: lerp(2.9, 2.4, ease(u / 1.9)), h0: 960 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: -0.55, worry: 0.3, shock: 0, blink: bl(u + 3) }, u);
  const gl = L.P(c, -2.5, 1.1, 5.2), glint = `<g transform="translate(${n(gl.x)},${n(gl.y)})"><ellipse rx="${n(gl.s * 0.06)}" ry="${n(gl.s * 0.025)}" fill="#fffbd0"/><ellipse rx="${n(gl.s * 0.14)}" ry="${n(gl.s * 0.06)}" fill="#ffe21a" opacity="0.28" style="mix-blend-mode:screen"/></g>`;
  const eyes = eyesT(c, [{ X: -2.4, Y: 1.1, Z: 5.2, size: 1.8, open: clamp(u / 0.4) }], u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], moon: false, over: eyes });
});
// 14  L14 the kid screams down the hill, voice cracks; a push in on the third cry
shot("14", "L14", () => LN("L14").at - 0.04, (u, x) => {
  const third = wordAt(LINE.L14, "wolf") + 0, last = LINE.L14.words[LINE.L14.words.length - 1][1];
  const z = tr([[0, 3.0], [Math.max(0.1, last - 0.1 - (x.lu - u)), 3.0], [Math.max(0.2, last + 0.35 - (x.lu - u)), 2.1]], u);
  return shoutDown(u, { talk: talkAt(x.ln, x.lu), mood: 0.9, X: 0.65, Z: z, treeX: 3.4, moon: false, eyes: [{ X: 3.1, Y: 1.5, Z: 3.55, size: 1.8 }], worry: 1 });
});
// 15  L15 the village goes dark: lit roofs, then a push in on three windows going out in a visible order, the last on the final "one"; the dark window sits until the plea
const WIN3 = [5, 6, 7];            // the middle row, left to right: they go out at "one", "by", "one"
shot("15a", "L15", () => LN("L15").at - 0.04, (u, x) => {
  const m = MOOD(0.5), c = { x: 0.2 + u * 0.1, y: 1.8, z: -0.6, h0: 1000 };
  return square(c, u, { mood: m, skyMood: m, windows: new Array(15).fill(1), lamp: 1, moon: [860, 190, 44] });
}, { mood: 0.5 });
shot("15b", "L15", () => WD("L15", "lights") - 0.2, (u, x) => {
  const m = MOOD(0.5), c = { x: -1.5 + u * 0.02, y: 2.3, z: 3.5 + u * 0.05, h0: 1000 };
  const lu = x.lu, t1 = wordAt(LINE.L15, "one"), t3 = LINE.L15.words[LINE.L15.words.length - 1][1], t2 = (t1 + t3) / 2;
  const off = (t0, d = 0.12) => 1 - ease(clamp((lu - t0) / d));
  const win = new Array(15).fill(0);
  win[1] = off(t1); win[2] = off(t2); win[0] = off(t3);                      // three windows out in a visible order, the last on the final "one"
  for (const i of [3, 4]) win[i] = off(wordAt(LINE.L15, "lights") + 0.1 * i, 0.25);
  return square(c, u, { mood: m, skyMood: m, windows: win, lamp: 0.3, moon: [860, 190, 44], well: false });
}, { mood: 0.5 });
// 16  L16 "Please!" (the crook waves clear of his body), then cut wide to the empty path
shot("16a", "L16", () => LN("L16").at - 0.05, (u, x) => {
  const m = MOOD(1), c = { x: -1.0, y: 1.1, z: 2.3, h0: 940 };
  const k = K_(c, { X: -1.1, Z: 4.0, fx: -0.6, shock: 1, talk: talkAt(x.ln, x.lu), reachL: 1, worry: 1, hop: Math.abs(Math.sin(u * 7)) * 3 }, u);
  const cr = GR.crook(c, { at: k.sleeve, s: k.p.s, rot: 18 + 9 * Math.sin(u * 6), grip: 74, len: 140 });
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg + cr }], moon: false });
});
shot("16b", "L16", () => LN("L16").at + 0.62, (u, x) => {
  const m = MOOD(1), c = { x: 0.2, y: 1.6, z: 0.0 + u * 0.03, h0: 1010 };
  return hill(c, u, { mood: m, moon: false, over: eyesT(c, [oe(1, { size: 3.4 }), oe(0, { size: 3.6 })], u) });
});
// 17  L17 nobody came; more eyes on "more eyes", big enough to count; the sheep huddle
shot("17", "L17", () => LN("L17").at, (u, x) => {
  const m = MOOD(1), c = { x: -0.7, y: 1.5, z: 0.5 + u * 0.08, h0: 1010 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.4, worry: 1, blink: bl(u, 0.2) }, u);
  const w = wordAt(LINE.L17, "more"), e = wordAt(LINE.L17, "eyes");
  const pairs = [oe(1, { size: 4.0 }), oe(0, { size: 4.2 }), oe(3, { size: 4.4 }), oe(2, { size: 4.2, open: clamp((x.lu - w) / 0.25) }), oe(4, { size: 4.8, open: clamp((x.lu - e) / 0.25) })];
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, 1, { huddle: true }))], over: eyesT(c, pairs, u), moon: false });
});
// 18  L18 kid close whispering Grandma's rule; a warm blurred MEMORY of her and her candle on "SEE its teeth"
shot("18a", "L18", () => LN("L18").at - 0.05, (u, x) => {
  const m = MOOD(1), c = { x: -1.1, y: 1.02, z: lerp(2.6, 2.3, ease(u / 3)), h0: 960 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: tr([[0, 0.1], [0.6, -0.5]], u), worry: 0.9, talk: talkAt(x.ln, x.lu) * 0.7, shock: 0, blink: bl(u + 1, 0.6) }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], moon: false });
});
shot("18b", "L18", () => WD("L18", "see") - 0.1, (u, x) => {          // memory: Grandma + the candle, warm, soft, ringed with dark
  const m = MOOD(-0.2), c = { x: -0.5, y: 1.15, z: 2.2, h0: 940 }, vg = GR.village(c, u, { windows: new Array(15).fill(1), lamp: 1 });
  const g = G_(c, { X: -0.3, Z: 4.0, stern: 0.8, flame: 0.9, fx: -0.3, talk: talkAt(x.ln, x.lu) * 0 }, u, null);
  const inner = GR.sky(c, u, { moon: false }) + vg.back + GR.stack([...vg.items, { Z: 4.0, svg: g.svg }]) + GR.grade();
  return `<g filter="url(#gb3)">${inner}</g><rect width="${W}" height="${H}" fill="#ffb060" opacity="0.14" style="mix-blend-mode:screen"/><radialGradient id="mem" cx="0.5" cy="0.45" r="0.62"><stop offset="0.45" stop-color="#05030a" stop-opacity="0"/><stop offset="1" stop-color="#05030a" stop-opacity="0.9"/></radialGradient><rect width="${W}" height="${H}" fill="url(#mem)"/>`;
});
// 19  L19 the idea: he looks to the grove, then at the village; ends on his glance down to the latch
shot("19", "L19", () => LN("L19").at - 0.05, (u, x) => {
  const m = MOOD(0.8), c = { x: -1.0, y: 1.05, z: 2.4, h0: 960 };
  const fx = tr([[0, -0.6], [0.9, -0.6], [1.6, -0.8], [2.2, 0.0], [2.9, 0.75]], x.lu);
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx, worry: tr([[0, 1], [1.4, 0.1]], x.lu), shock: 0, talk: talkAt(x.ln, x.lu) * 0.8, blink: bl(u + 4, 0.3) }, u);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], moon: false });
});
// 20  L20 eyeline -> the hand lifts the latch -> the gate swings -> the lead sheep clears it moving right
shot("20a", "L20", () => LN("L20").at - 0.05, (u, x) => {
  const m = MOOD(0.7), c = { x: -0.25, y: 1.0, z: 2.2, h0: 1000 };
  const k = kidCrook(c, { X: -0.2, Z: 4.0, fx: -0.6, reachL: tr([[0, 0.5], [0.35, 1]], u), worry: 0.2, blink: 0 }, u, false);
  return hill(c, u, { mood: m, items: [{ Z: 4.0, svg: k.svg }], moon: false, hs: { gateOpen: 0 } });
});
const gateU = (u) => ease(clamp((u - 0.1) / 0.85));
shot("20b", "L20", () => LN("L20").at + 0.5, (u, x) => {
  const m = MOOD(0.7), c = { x: -0.9 + 0.1 * u, y: 1.05, z: 0.9, h0: 960 };
  const k = kidCrook(c, { X: -0.15, Z: 4.0, fx: -0.6, reachL: tr([[0, 1], [0.6, 0.3]], u), worry: 0.2 }, u, { rot: 6 });
  const lead = { X: -1.2 + 0.0 + Math.max(0, u - 0.7) * 3.2, Z: 5.0 - Math.max(0, u - 0.7) * 1.1, dir: 1, pose: u > 0.7 ? "run" : "graze", phase: u * 2.4, mark: 1, size: 1 };
  const rest = [{ X: -2.3, Z: 5.7, dir: 1, pose: "graze" }, { X: -0.6, Z: 5.8, dir: -1, pose: "look", size: 0.9 }, { X: -2.0, Z: 5.2, dir: 1, pose: "look", size: 0.85 }];
  return hill(c, u, { mood: m, hs: { gateOpen: gateU(u) }, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, [lead, ...rest])], moon: false });
});
// 21  L21 a low downhill follow: the flock runs right and toward us along the terrace path, the kid behind with his crook (cycles tied to distance)
shot("21", "L21", () => LN("L21").at - 0.08, (u, x) => {
  const m = MOOD(0.6), sp = 3.0, dx = sp * (u + 0.2), c = { x: -0.9 + dx, y: 0.95 - 0.12 * u, z: -0.5, h0: 1000 };
  const run = (i, x0, Z0, size = 1) => ({ X: x0 + dx, Z: Z0 - 0.3 * u, dir: 1, pose: "run", phase: dx / 0.9 + i * 0.27, size, seed: i + 1, mark: i % 3 === 0 ? 1 : 0 });
  const fl = [run(0, 0.2, 4.3), run(1, -0.15, 4.9, 0.9), run(2, -0.5, 3.9), run(3, -0.85, 4.5, 0.95), run(4, -1.2, 4.1), run(5, -1.55, 4.8, 0.85)];
  const kk = K_(c, { X: -1.85 + dx, Z: 3.4 - 0.3 * u, run: dx / 0.9, fx: 0.6, shock: 0, worry: 0.2, lean: 5 }, u);
  const cr = GR.crook(c, { at: kk.sleeve, s: kk.p.s, rot: 40, grip: 74, len: 140 });
  return hill(c, u, { mood: m, hs: { gateOpen: 1 }, items: [...sheepAt(c, u, fl), { Z: 3.4 - 0.3 * u, svg: kk.svg + cr }], moon: false });
});
// 22  L22 + L23 ONE continuous track into the square: flock in, the wolf right behind them, the doors opening, the flock out of frame, the wolf stopped
const XL = (U) => -3.2 + 2.0 * U;                              // the lead sheep (the camera is slower: they cross the frame)
const CX = (U) => (U < 4.3 ? -0.8 + 0.6 * U : -0.8 + 0.6 * 4.3 + 0.3 * (1 - Math.exp(-(U - 4.3) / 0.5)));   // camera x: a slow track, then settles (the village ends near x = 4)
const WOLF_X = (U) => (U < 3.0 ? -9 : U < 4.3 ? CX(3.0) - 2.6 + 2.4 * (U - 3.0) : CX(3.0) - 2.6 + 2.4 * 1.3 + 1.2 * (1 - Math.exp(-(U - 4.3) / 0.5)));
function chase(U, x) {
  const t = x.t, c = { x: CX(U), y: 1.15, z: -1.0, h0: 1180 };
  const sheep = [0, 1, 2, 3, 4, 5].map((i) => ({ X: XL(U) - i * 0.5 + (i % 2) * 0.18, Z: 3.9 + (i * 0.73 % 1.0), dir: 1, pose: "run", phase: (XL(U) - i * 0.5) / 0.9 + i * 0.29, size: 0.95 + (i % 3) * 0.04, seed: i + 1, mark: i % 4 === 0 ? 1 : 0 }));
  const wXf = WOLF_X(U), slow = ease(clamp((U - 4.6) / 1.2)), ph = wXf / 1.7;       // the wolf comes in at the left edge, runs, slows and stands in the square
  const wolfPose = GR.wolfPose(GR.wolfPose("runAway", "lunge", 0.5 + 0.5 * Math.sin(ph * 6.283)), "crouch", slow);
  const wf = wolfFace(GR.wolf(c, { X: wXf, Z: 3.5, dir: 1, pose: wolfPose, phase: ph, size: 1.1 }, t));
  const door = clamp((x.t - (LINE.L23.at + wordAt(LINE.L23, "every") + 0.5)) * FPS / 6);
  const f = door;
  const windows = Array.from({ length: 15 }, (_, i) => clamp(f * 2 - (i % 5) * 0.12));
  const skyM = lerp(0.35, -0.15, ease(clamp((x.t - (LINE.L23.at + wordAt(LINE.L23, "every") + 0.4)) / 1.0)));
  const mood = lerp(0.35, -0.9, f);
  return square(c, t, { mood, skyMood: skyM, windows, doors: f, lamp: f, extra: [...sheepAt(c, t, sheep), { Z: 3.5, svg: wf.svg }], over: wf.eyes, cast: f > 0.6 ? [{ kind: 1, X: -0.8, Z: 6.4, armUp: 0.4, dir: 1 }, { kind: 4, X: 2.6, Z: 6.5, armUp: 0.5, dir: -1 }] : [] });
}
shot("22", "L22", () => LN("L22").at - 0.05, (u, x) => chase(x.t - LN("L22").at + 0.0, x));
// 24  L24 a villager looks toward the chase, a half second of quiet, then shouts WOLF! at it (the wolf at the left of frame, lit)
shot("24", "L24", () => LN("L23").end + 0.05, (u, x) => {
  const m = -0.9, c = { x: 0.2, y: 1.3, z: 0.6, h0: 1020 };
  const sh = talkAt(LINE.L24, x.t - LINE.L24.at);
  const wf = wolfFace(GR.wolf(c, { X: -0.75, Z: 3.7, dir: 1, pose: GR.wolfPose("crouch", "teeth", 0.3), jaw: 0.3, phase: 0.2, size: 1.0 }, x.t));
  const sq = square(c, x.t, { mood: m, cast: [{ kind: 4, X: 1.0, Z: 3.9, dir: -1, fx: -0.6, armUp: 1, shout: 0.12 + 0.88 * sh, angry: 1 }, { kind: 1, X: 2.6, Z: 6.4, armUp: 0.3, dir: -1 }, { kind: 2, X: 0.1, Z: 7.0, armUp: 0.2, dir: -1 }, { kind: 3, X: -1.8, Z: 6.6, armUp: 0.2, dir: 1 }], extra: [{ Z: 3.7, svg: wf.svg }], over: wf.eyes });
  return sq;
});
// 25  L25 a short wide: the wolf in front of the villagers (they raise sticks), it bolts; then the jaw close on "teeth"
shot("25a", "L25", () => LN("L25").at - 0.05, (u, x) => {
  const m = -0.9, c = { x: 0.35, y: 1.3, z: 0.4 + u * 0.05, h0: 1100 };
  const run = ease(clamp((u - 1.35) / 0.55)), X = -0.3 + run * 3.4;
  const pose = run <= 0 ? GR.wolfPose("crouch", "teeth", ease(clamp(u / 0.35))) : GR.wolfPose("teeth", "runAway", clamp(run * 1.6));
  const wf = wolfFace(GR.wolf(c, { X, Z: 3.9, dir: 1, pose, jaw: run > 0 ? undefined : 0.55 + 0.08 * Math.sin(u * 16), phase: X / 1.7, size: 1.1, blink: blinkAmt(u, [0.9]) }, x.t));
  return square(c, x.t, { mood: m, cast: CROWD().map((v, i) => ({ ...v, armUp: Math.max(0.7, v.armUp ?? 0), shout: 0.5 })), extra: [{ Z: 3.9, svg: wf.svg }], over: wf.eyes });
});
shot("25b", "L25", () => WD("L25", "teeth") - 0.22, (u, x) => {
  GR.mood(-0.9);
  const c = { x: 0.1, y: 1.0, z: 2.0 + u * 0.04, h0: 1020 };
  const wf = GR.wolf(c, { X: -0.2, Z: 3.7, dir: 1, pose: "teeth", jaw: 0.75 + 0.08 * Math.sin(u * 14), phase: 0, size: 1.15, blink: 0 }, x.t);
  wolfFace(wf);
  const vg = GR.village(c, x.t, { windows: new Array(15).fill(1), lamp: 1 });
  return GR.sky(c, x.t, { moon: false }) + vg.back + GR.stack([...vg.items, { Z: 3.7, svg: wf.svg }]) + GR.grade() + wf.eyes;
});
// 26  L26 grandmother and the kid in the same lamplit square, then (27) a cut in on his face for the answer
const twoShot = (u, x) => {
  const m = -0.9, c = { x: 0.0, y: 1.1, z: 0.2, h0: 960 };
  const k = kidCrook(c, { X: 0.55, Z: 3.4, fx: -0.5, worry: 0, blink: bl(u, 0.9) }, x.t);
  const g = G_(c, { X: -0.55, Z: 3.3, stern: 0, flame: 0.4, fx: 0.4, open: 1, talk: talkAt(LINE.L26, x.t - LINE.L26.at), blink: bl(u, 0.8) }, x.t, null);
  return square(c, x.t, { mood: m, cast: [{ kind: 0, X: -2.3, Z: 6.6, armUp: 0.2, dir: 1 }, { kind: 4, X: 2.1, Z: 6.4, armUp: 0.1, dir: -1 }, { kind: 3, X: 1.2, Z: 7.1, armUp: 0, dir: -1 }], extra: [{ Z: 3.3, svg: g.svg }, { Z: 3.4, svg: k.svg }] });
};
shot("26", "L26", () => LN("L26").at - 0.05, twoShot);
shot("27", "L27", () => LN("L27").at - 0.05, (u, x) => {
  const m = -0.9, c = { x: 0.1, y: 1.05, z: lerp(1.5, 1.25, ease(u / 2.6)), h0: 960 };
  const k = kidCrook(c, { X: 0.2, Z: 3.0, fx: -0.1, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.9), worry: 0 }, x.t);
  return square(c, x.t, { mood: m, cast: [{ kind: 0, X: -1.6, Z: 6.6, armUp: 0.2, dir: 1 }, { kind: 4, X: 1.9, Z: 6.4, armUp: 0.1, dir: -1 }], extra: [{ Z: 3.0, svg: k.svg }] });
});

// a jar with a candle (Grandma's fear meter), drawn big for the close shot and the small version by the kid
function jarSvg(c, X, Z, flame, t, sc = 1) {
  const p = L.P(c, X, 0.72, Z), k = p.s / 100 * sc;
  const fk = flame * (0.8 + 0.2 * Math.sin(t * 17) * Math.sin(t * 5.3));
  return `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${k.toFixed(3)})"><path d="M-9,-16 Q-10,-3 -8,0 L8,0 Q10,-3 9,-16 Z" fill="#cfe6ff" opacity="0.38" stroke="#e9f3ff" stroke-width="0.9"/><path d="M-9.4,-18 L9.4,-18 L9,-15 L-9,-15 Z" fill="#3a2a2a"/><path d="M-1.6,0 L1.6,0 L1.6,-7 L-1.6,-7 Z" fill="#fff4e0"/>
    ${fk > 0.03 ? `<path d="M0,${n(-7 - 9 * fk)} Q${n(3 * fk)},${n(-8 - 2 * fk)} 0,-7 Q${n(-3 * fk)},${n(-8 - 2 * fk)} 0,${n(-7 - 9 * fk)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/>` : ""}</g>`;
}

// ---------------------------------------------------------------- the glimpse (re-hook): the lamplit square, the wolf snarling; blurred and dark, then hard back
const GLIMPSES = [{ at: 2.4, frames: 6, blur: "gb", dark: 0.5 }, { line: "L13", word: "but", frames: 12, blur: "gb2", dark: 0.22 }];
for (const g of GLIMPSES) if (g.line) g.at = LINE[g.line].at + wordAt(LINE[g.line], g.word) - 0.1;
function glimpse(t, g) {
  const u = (t - g.at) * FPS, c = { x: 0.15, y: 1.0, z: 1.4 + u * 0.01, h0: 1000 }, k = u / g.frames;
  const wf = GR.wolf(c, { X: -0.1, Z: 3.7, size: 1.2, pose: GR.wolfPose("crouch", "teeth", ease(clamp(u / 3))), jaw: 0.55 + 0.1 * Math.sin(u * 1.7), phase: 0.2 }, t);
  const inner = square(c, t, { mood: -0.9, cast: CROWD(), extra: [{ Z: 3.7, svg: wf.svg }], over: wf.eyes });
  return `<g filter="url(#${g.blur})">${inner}</g><rect width="${W}" height="${H}" fill="#02030a" opacity="${g.dark + 0.15 * Math.sin(k * Math.PI)}"/>`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) { const ln = LINE[s.line]; let a = s.off(); if (a < ln.at) a = Math.max(a, prevEnd(s.line)); s.at = Math.max(0, a); }
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
for (const s of SHOTS) if (s.end - s.at < 0.2) throw new Error("shot too short " + s.id);
export const TIMELINE = SHOTS;
// the line being spoken at t: it shows from its first word until its last word has been said (+0.3 s), never cut early by the next
const holdEnd = (i) => Math.min(i + 1 < ORDER.length ? LINE[ORDER[i + 1]].at - 0.02 : 1e9, LINE[ORDER[i]].end + 0.3);
const lineAtTime = (t) => { let k = null; ORDER.forEach((id, i) => { const ln = LINE[id]; if (t >= ln.at - 0.04 && t < holdEnd(i)) k = ln; }); return k; };

// ---------------------------------------------------------------- captions: upper third, centre ~580, off every face and pair of eyes
const CAPY = [580, 540, 620, 660, 700, 740, 760, 500, 800];
const OPT = { key: KEY, keyColor: "#ff3b3b", maxFs: 104, width: 990, wrapAt: 15, reveal: true };
function capBox(ph, y) {
  const ws = ph.ws.map((q) => q[0]), len = (a) => a.join(" ").length;
  let k = ws.length;
  if (len(ws) > OPT.wrapAt && ws.length > 1) { let best = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(len(ws.slice(0, i)) - len(ws.slice(i))); if (d < best) { best = d; k = i; } } }
  const rows = k < ws.length ? [ws.slice(0, k), ws.slice(k)] : [ws], mx = Math.max(...rows.map(len)), fs = Math.min(OPT.maxFs, Math.round(OPT.width / Math.max(1, mx * 0.6)));
  const w = mx * fs * 0.6 + 24, h = rows.length * fs * 1.08 + 12;
  return { x0: 540 - w / 2, x1: 540 + w / 2, y0: y - h / 2, y1: y + h / 2 };
}
const hit = (b, f) => { const dx = Math.max(b.x0 - f.x, 0, f.x - b.x1), dy = Math.max(b.y0 - f.y, 0, f.y - b.y1); return dx * dx + dy * dy < (f.r + 14) ** 2; };
const facesAt = (t) => { FACES = []; bodyAt(t); const f = FACES; FACES = []; return f; };
const CAPCACHE = new Map();
function capY(ln, pi, ph) {
  const key = ln.id + ":" + pi;
  if (CAPCACHE.has(key)) return CAPCACHE.get(key);
  const t0 = ln.at + ph.at, t1 = pi + 1 < ln.phrases.length ? ln.at + ln.phrases[pi + 1].at : ln.end + 0.3;
  const fs = [t0 + 0.05, (t0 + t1) / 2, t1 - 0.08].map((t) => facesAt(Math.min(t, DUR - 0.01))).flat();
  let best = null, bs = 1e9;
  for (const y of CAPY) { const b = capBox(ph, y); if (t0 < 2.75 && b.y0 < 514) continue; const bad = fs.filter((f) => hit(b, f)).length; if (!bad) { best = y; break; } if (bad < bs) { bs = bad; best = y; } }
  CAPCACHE.set(key, best); return best;
}
function captions(t) {
  const ln = lineAtTime(t); if (!ln) return "";
  const u = t - ln.at; let pi = -1; for (let i = 0; i < ln.phrases.length; i++) if (u >= ln.phrases[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  return captionSvg(ln.phrases, u, { ...OPT, y: capY(ln, pi, ln.phrases[pi]) });
}
export const SUBS = { on: true };
function shotAt(time) { let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q; return s; }
function bodyAt(time) {
  L.resetIds();
  const s = shotAt(time), ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  const g = GLIMPSES.find((q) => t >= q.at - 1e-6 && t < q.at + q.frames / FPS - 1e-6);
  return { body: g ? glimpse(t, g) : s.fn(u, { ln, lu: t - ln.at, t }), shot: s.id };
}
// the picture at time t: { pic: svg without banner/subtitles + the banner, cap: the subtitle svg (or "") }
export function parts(time) {
  FACES = [];
  const b = bodyAt(time), fcs = FACES.slice();
  const title = time < 2.75 ? titleCard(time, { style: TITLE, teaser: "T1" }) : "";
  const dbg = process.env.DEBUGFACES ? fcs.map((f) => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}" fill="none" stroke="#0f0" stroke-width="3"/>`).join("") : "";
  return { pic: frame(b.body) + title + dbg, cap: captions(time), shot: b.shot, faces: fcs };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
