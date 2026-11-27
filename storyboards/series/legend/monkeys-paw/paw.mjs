// Legend: The Monkey's Paw (W. W. Jacobs, 1902), H1 attic + E1 wrong voice. Built from SHOTS.md (the director's shot list),
// draft 2 = draft 1 + Sol round 1 (sol-r1/answer.md) + the director's decisions of 27 Nov.
// Rendered by tools/svg2d/render.mjs; voices read + post-processed already in out/legend-paw/voice/.
//   node tools/svg2d/render.mjs storyboards/series/legend/monkeys-paw/paw.mjs out/legend-paw/paw-draft2.mp4
// The timeline is built from the real line lengths; every shot is a function of (u = seconds into the line, d = line length).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as PW from "../../../../tools/svg2d/lib/legend-paw.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-paw/voice", VEDIT = "out/legend-paw/voice-edit", MUS = "assets/music/ai", OUT = "out/legend-paw";
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/monkeys-paw/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
function writeWav(p, s, sr) {
  const b = Buffer.alloc(44 + s.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + s.length * 2, 4); b.write("WAVEfmt ", 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(s.length * 2, 40);
  Buffer.from(s.buffer, s.byteOffset, s.byteLength).copy(b, 44); writeFileSync(p, b);
}
// non-destructive edits inside a take (the source wavs stay as they are): from = start the line at that word (40 ms margin),
// gap = squeeze every silence between words down to this many seconds; 15 ms fades at every join; the cut take goes to voice-edit/
const EDITS = {
  L01: { gap: 0.22 }, L04: { from: "in", gap: 0.3, text: "In 1902, the English writer W. W. Jacobs wrote the story of the most dangerous gift in England." },
  L05: { gap: 0.3 }, L06: { gap: 0.4 }, L09: { gap: 0.4 }, L12: { gap: 0.3 }, L13: { gap: 0.32 }, L16: { from: "bring", text: "Bring our boy back!" },
  L18: { gap: 0.3 }, L19: { gap: 0.35 }, L21: { gap: 0.3 }, L22: { gap: 0.42 }, L25: { gap: 0.25 },
};
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
mkdirSync(VEDIT, { recursive: true });
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  let words = JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8")), src = s, file = `${VOICE}/${ln.id}.wav`;
  const ed = EDITS[ln.id];
  if (ed) {
    const segs = []; let a = 0, k0 = 0;
    if (ed.from) { k0 = words.findIndex((w) => norm(w[0]).startsWith(ed.from)); a = Math.max(0, words[k0][1] - 0.04); if (k0 > 0) a = Math.max(a, words[k0 - 1][2] - 0.02); }
    for (let k = k0; k < words.length - 1; k++) {
      const g = words[k + 1][1] - words[k][2];
      if (ed.gap && g > ed.gap + 0.12) { segs.push([a, words[k][2] + ed.gap / 2]); a = words[k + 1][1] - ed.gap / 2; }
    }
    segs.push([a, s.length / sr]);
    const out = []; let off = 0; const map = [];   // map: [srcStart, srcEnd, newStart]
    for (const [x, y] of segs) {
      const i0 = Math.round(x * sr), i1 = Math.min(s.length, Math.round(y * sr)), seg = Int16Array.from(s.subarray(i0, i1)), fd = Math.round(0.015 * sr);
      for (let i = 0; i < Math.min(fd, seg.length); i++) { seg[i] = Math.round(seg[i] * (i / fd)); seg[seg.length - 1 - i] = Math.round(seg[seg.length - 1 - i] * (i / fd)); }
      map.push([x, y, off / sr]); for (const v of seg) out.push(v); off += seg.length;
    }
    const mp = (t) => { for (const [x, y, o] of map) if (t <= y + 1e-6) return o + Math.max(0, t - x); return off / sr; };
    words = words.slice(k0).map((w) => [w[0], mp(w[1]), mp(w[2])]);
    src = Int16Array.from(out); file = `${VEDIT}/${ln.id}.wav`; writeWav(file, src, sr);
    if (ed.text) ln.text = ed.text;
  }
  ln.file = file; ln.words = words; ln.dur = src.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < src.length; i += hop) { let a = 0; for (let j = i; j < Math.min(src.length, i + hop); j++) a += (src[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => norm(x[0]).startsWith(word)); return w ? w[1] : ln.dur * frac; };
const wordEnd = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => norm(x[0]).startsWith(word)); return w ? w[2] : ln.dur * frac; };

// written words -> spoken-word times (Needleman-Wunsch on normalised words), so captions show the written text
function alignWords(ln) {
  const wr = ln.text.split(/\s+/).filter(Boolean), sp = ln.words, a = wr.map(norm), b = sp.map((w) => norm(w[0]));
  const N = a.length, M = b.length, S = Array.from({ length: N + 1 }, () => new Float32Array(M + 1)), G = -1.2;
  for (let i = 1; i <= N; i++) S[i][0] = i * G; for (let j = 1; j <= M; j++) S[0][j] = j * G;
  const sc = (x, y) => (x === y ? 2 : x && y && (x.startsWith(y) || y.startsWith(x)) ? 1 : -1);
  for (let i = 1; i <= N; i++) for (let j = 1; j <= M; j++) S[i][j] = Math.max(S[i - 1][j - 1] + sc(a[i - 1], b[j - 1]), S[i - 1][j] + G, S[i][j - 1] + G);
  const map = new Array(N).fill(-1); let i = N, j = M;
  while (i > 0 && j > 0) {
    if (S[i][j] === S[i - 1][j - 1] + sc(a[i - 1], b[j - 1])) { map[i - 1] = j - 1; i--; j--; } else if (S[i][j] === S[i - 1][j] + G) i--; else j--;
  }
  const out = wr.map((w, k) => [w, map[k] >= 0 ? sp[map[k]][1] : null]);
  for (let k = 0; k < out.length; k++) {   // unmatched written words: spread between the neighbours
    if (out[k][1] != null) continue;
    let p = k - 1; while (p >= 0 && out[p][1] == null) p--;
    let q = k + 1; while (q < out.length && out[q][1] == null) q++;
    const t0 = p >= 0 ? out[p][1] : 0, t1 = q < out.length ? out[q][1] : ln.dur;
    out[k][1] = lerp(t0, t1, (k - p) / (q - p));
  }
  for (let k = 1; k < out.length; k++) if (out[k][1] <= out[k - 1][1]) out[k][1] = out[k - 1][1] + 0.02;
  ln.cap = out;
}
for (const ln of Object.values(LINE)) alignWords(ln);

// ---------------------------------------------------------------- shared helpers
const A = PW.ATTIC, R = PW.PARLOUR, HL = PW.HALL;
const cam = (u, a, b, k = "inOut") => { const e = ease(u, k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; };
const byZ = (list) => list.filter((q) => q && q[1]).sort((p, q) => q[0] - p[0]).map((q) => q[1]).join("");
const pulse = (u, times, len = 0.22) => { let v = 0; for (const t0 of times) if (u >= t0 && u < t0 + len) v = Math.max(v, Math.exp(-(u - t0) * 10) * (0.6 + 0.4 * Math.sin((u - t0) * 80))); return clamp(v); };
const TRUNK = { X: -1.5, Y: 0.5, Z: 5.5 };                 // where the hosts' paw lies
const RUG = { X: -0.15, Z: 4.9 };                          // where the story paw lies on the parlour floor
const KX = 0.15;                                           // the keeper after "Nobody knows" (nearer the boy, so lantern + his face fit one frame)
const wpt = (c, P, size = 1.6) => { const q = L.P(c, P.X, P.Y, P.Z); return { x: q.x, y: q.y, k: q.s / 100 * size }; };
// a paw in the air between two screen points (so a release / a pick-up is always connected): a, b = {x, y, k}
const flyPaw = (a, b, f, st, T, rot = [-10, 40], arc = 90) => { const e = ease(f); return PW.pawAt(lerp(a.x, b.x, e), lerp(a.y, b.y, e) - Math.sin(f * Math.PI) * arc, lerp(a.k, b.k, e), { rot: lerp(rot[0], rot[1], e), ...st }, T); };
const heldPt = (r, k) => ({ x: r.held.x, y: r.held.y, k });

// ---------------------------------------------------------------- the attic (the two hosts)
// o: kid / keeper state overrides (false = leave out), paw = paw in the kid's hand (state or null), pawW = {X,Y,Z,st} paw in the
// world, fly = {from, to ('hand' | {X,Y,Z}), f, st} paw in the air, blank, m, glow, tint
function atticScene(T, c, o = {}) {
  const m = o.m || PW.mood("attic");
  const ks = { X: A.kid.X, Z: A.kid.Z, fx: 0.7, reachL: o.paw || o.fly ? 0.9 : 0, blink: blinkAmt(T % 3.9, [1.4]), talk: tk("K", T), ...o.kid };
  const gs = { X: A.keeper.X, Z: A.keeper.Z, fx: -0.7, stern: 1, open: 1, flame: 1, blink: blinkAmt((T + 1) % 3.3, [2.1]), talk: tk("G", T) || tk("GX", T), ...o.keeper };
  const kd = L.kid(c, ks, T), blank = o.blank || 0;
  const kp = blank > 0 ? PW.keeperBlank(c, { ...gs, blank }, T, null) : L.keeper(c, gs, T, null);
  const h = PW.kidHand(c, ks), hp = { x: h.x + ((o.paw || o.fly || {}).dx || 0), y: h.y + ((o.paw || o.fly || {}).dy || 0), k: h.k * 0.85 };
  const hand = o.paw ? PW.pawAt(hp.x, hp.y, hp.k * (o.paw.size ?? 1), { rot: -10, ...o.paw, m }, T) : "";
  const pawW = o.pawW ? PW.paw(c, o.pawW.X, o.pawW.Y, o.pawW.Z, { size: 1.6, lying: 1, ...o.pawW.st, m }, T) : "";
  let fly = "";
  if (o.fly) { const pt = (q) => (q === "hand" ? hp : wpt(c, q)); fly = flyPaw(pt(o.fly.from), pt(o.fly.to), o.fly.f, { fingers: 0, m, ...o.fly.st }, T, [-10, 40], o.fly.arc ?? 90); }
  const kidDraw = o.kid === false ? "" : kd.svg + hand;
  return PW.attic(c, T, m, { light: kp.jar || { x: 540, y: 600 }, dust: o.dust ?? 1 }) + pawW + (kp.jar ? PW.candleLight(kp.jar, m, o.glow ?? 1, T) : "") + byZ([[ks.Z, kidDraw], [gs.Z, o.keeper === false ? "" : kp.svg + kp.arm]]) + fly + PW.grade(m, o.tint ?? 0.9);
}

// ---------------------------------------------------------------- the parlour
// actors: [[Z, svg], ...]; the table goes behind everything nearer than it, in front of the rest
function parlourScene(T, c, m, o, actors) {
  const z = R.table.Z;
  const far = actors.filter((a) => a[0] >= z), near = actors.filter((a) => a[0] < z);
  return PW.parlour(c, T, m, { noTable: true, fire: o.fire ?? 1, lamp: o.lamp ?? 1 }) + byZ(far) + PW.parlourTable(c, T, m) + byZ(near);
}
const fatherSit = (m, o = {}) => ({ X: R.father.X, Z: R.father.Z - 0.08, fx: -0.5, sit: 1, m, ...o });
const sonSit = (m, o = {}) => ({ X: R.sonSeat.X, Z: R.sonSeat.Z - 0.08, fx: -0.6, sit: 1, smile: 1, m, ...o });
const motherSit = (m, o = {}) => ({ X: R.mother.X, Z: R.mother.Z - 0.08, fx: 0.5, sit: 1, knit: 1, seat: 0.5, m, ...o });
const act = (fn, c, st, T) => { const r = fn(c, st, T); return [st.Z, r.svg, r]; };
const SOLDIER = { X: -1.05, Z: 5.45, fx: -0.5 };         // faces the fire the whole way, so the paw stays in his left hand
// put a hand of a figure on a screen point (3 passes of correction), returns [Z, svg, result]
function handOn(fn, c, st, which, tx, ty, T) {
  let h = [0, -150], r;
  for (let i = 0; i < 4; i++) { r = fn(c, { ...st, [which]: h }, T); const cur = which === "handR" ? r.handR : r.handL, k = r.p.s / 100 * 0.85; h = [h[0] + (tx - cur.x) / k, h[1] + (ty - cur.y) / k]; }
  r = fn(c, { ...st, [which]: h }, T); return [st.Z, r.svg, r];
}
const boltPt = (c) => L.P(c, HL.bolt.X + 0.02, HL.bolt.Y - 0.02, HL.bolt.Z);
const STORY = (f, o = {}) => ({ fingers: f, ...o });       // the story paw: 0 -> 1 (wish 1) -> 2 (wish 2) -> 3 (wish 3)

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
const BEATS = [
  // 1. HOOK: the paw in his hand, Grandma in by 0.65 s, three warnings close together, he lets go of it on "Don't make one"
  { line: "L01", pre: 0.04, hold: 0.04, shot(u, d, T, ln) {
    const dn = wordEnd(ln, "down", 0.5), th = wordAt(ln, "three", 1.0) - 0.08, dt = wordAt(ln, "dont", 2.0) - 0.08, one = wordEnd(ln, "one", d);
    if (u < 0.62) {
      const c = cam(u / 0.62, [-0.4, 0.98, 2.95], [-0.42, 1.0, 3.2], "in");
      return atticScene(T, c, { kid: { fx: 0.45, grin: 1 }, keeper: { fx: -0.7 }, paw: { fingers: 0, size: 1.05 }, tint: 0.7 });
    }
    if (u < th) {   // medium 2-shot, Grandma speaking: her hand slaps his wrist
      const c = cam((u - 0.62) / (th - 0.62), [0.15, 1.0, 1.95], [0.2, 1.02, 2.15]);
      return atticScene(T, c, { kid: { fx: 0.7, shock: tr([[dn - 0.1, 0], [dn + 0.1, 0.8]], u), tug: tr([[dn - 0.1, 0], [dn + 0.1, 1]], u) }, keeper: { grab: tr([[dn - 0.1, 0], [dn + 0.1, 1]], u) }, paw: { fingers: 0, size: 1.05 } });
    }
    if (u < dt) {   // close on the keeper, the flame flares (the boy is out of frame)
      const c = cam((u - th) / (dt - th), [0.78, 1.0, 2.0], [0.8, 1.02, 2.25]);
      return atticScene(T, c, { kid: false, keeper: { grab: 1, flame: tr([[0, 1], [0.3, 1.6], [0.9, 1.1]], u - th) } });
    }
    const f = clamp((u - dt) / (one - dt));   // 2-shot: his hand opens and the paw goes down to the trunk
    const c = cam((u - dt) / (d + 0.1 - dt), [0.2, 1.0, 1.8], [0.1, 1.0, 2.0]);
    return atticScene(T, c, { kid: { fx: 0.7, shock: 0.8, tug: 1, reachL: lerp(0.9, 0.15, ease(f)) }, keeper: { grab: tr([[0, 1], [0.3, 0]], u - dt), stern: 1 },
      fly: f > 0 && f < 1 ? { from: "hand", to: { ...TRUNK, size: 1.6 }, f, st: { fingers: 0 }, arc: 70 } : null, paw: f <= 0 ? { fingers: 0, size: 1.05 } : null,
      pawW: f >= 1 ? { ...TRUNK, st: { fingers: 0, rot: 40 } } : null });
  } },
  { line: "L02", pre: 0.08, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.42, 0.98, 2.75], [-0.4, 1.0, 2.9]);
    return atticScene(T, c, { kid: { fx: -0.5, look: -1, grin: 1 }, keeper: { grab: 0 }, pawW: { ...TRUNK, st: { fingers: 0, rot: 40 } } });
  } },
  // 3. PARLOUR: the credit over one push toward the soldier and the paw (no lead-in; the tail stays)
  { line: "L04", pre: 0.12, hold: 0.05, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), w0 = wordAt(ln, "1902", 0.2) - 0.04, w1 = wordAt(ln, "english", 1.4) - 0.05;
    const mk = (c, hu) => {
      const so = act(PW.soldier, c, { ...SOLDIER, hold: "paw", holdUp: hu, paw: STORY(0), m }, T);
      const rest = [act(PW.whiteFather, c, fatherSit(m, { leanIn: 2 }), T), act(PW.son, c, sonSit(m, { hold: "piece", holdUp: 0.3 }), T), act(PW.whiteMother, c, motherSit(m), T)];
      return parlourScene(T, c, m, {}, [so, ...rest].map((a) => [a[0], a[1]]));
    };
    if (u < w0) return mk(cam(u / w0, [-0.05, 1.3, 0.3], [-0.1, 1.24, 1.5]), 0.3);
    if (u < w1) return PW.parlour(cam((u - w0) / (w1 - w0), [1.2, 1.55, 3.3], [1.4, 1.58, 4.0]), T, m, { noTable: true });
    return mk(cam((u - w1) / (d + 0.05 - w1), [-0.75, 1.3, 2.2], [-1.0, 1.32, 3.9], "inOut"), tr([[w1, 0.3], [w1 + 0.8, 1]], u));
  } },
  // 4. the soldier lifts the paw on "brought it home"; "holy man" = paw close with a slow glow; "fate punishes" = the listeners
  { line: "L05", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const hm = wordAt(ln, "holy", 3.0) - 0.15, fp = wordAt(ln, "fate", 5.0) - 0.05, br = wordAt(ln, "brought", 0.6) - 0.1;
    if (u < hm) {
      const m = PW.mood("parlour"), c = cam(u / hm, [-1.0, 1.42, 3.0], [-1.0, 1.44, 3.5]);
      const so = act(PW.soldier, c, { ...SOLDIER, hold: "paw", holdUp: tr([[br, 0.2], [br + 0.5, 1]], u), paw: STORY(0), m }, T);
      return parlourScene(T, c, m, {}, [so, act(PW.whiteFather, c, fatherSit(m, { leanIn: 8 }), T)].map((a) => [a[0], a[1]]));
    }
    if (u < fp) {
      const k = tr([[0, 0], [0.5, 0.3]], u - hm), m = PW.moodMix("parlour", "paw", k), c = cam((u - hm) / (fp - hm), [-1.18, 1.3, 4.3], [-1.18, 1.32, 4.6]);
      const so = act(PW.soldier, c, { ...SOLDIER, hold: "paw", holdUp: 1, haunted: 0.3, paw: STORY(0, { glow: k, twist: 0.1 }), m }, T);
      return parlourScene(T, c, m, {}, [[so[0], so[1]]]);
    }
    const m = PW.mood("parlour"), c = cam((u - fp) / (d - fp), [0.66, 1.2, 1.9], [0.66, 1.2, 2.3]);
    return parlourScene(T, c, m, { fire: 0.9 }, [act(PW.whiteFather, c, fatherSit(m, { leanIn: 4 }), T), act(PW.son, c, sonSit(m, { smile: 0.2 }), T), act(PW.whiteMother, c, motherSit(m), T)].map((a) => [a[0], a[1]]));
  } },
  // 5. the soldier close, haunted; the push into his eyes stops short (face stays whole); fire dims; the wind-up starts as "death" ends
  { line: "L06", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), dt = wordAt(ln, "death", d - 0.8) - 0.1, ha = tr([[0, 0.5], [dt, 1]], u);
    const c = u < dt ? cam(u / dt, [-1.12, 1.46, 4.1], [-1.14, 1.47, 4.3]) : cam((u - dt) / (d - dt), [-1.14, 1.47, 4.4], [-1.15, 1.48, 4.5], "out");
    const fire = tr([[0, 1], [dt, 0.9], [d, 0.35]], u);
    const so = act(PW.soldier, c, { ...SOLDIER, hold: "paw", holdUp: 0.5, haunted: ha, brow: 0.4, talk: tk("S", T), paw: STORY(0), m }, T);
    return parlourScene(T, c, m, { fire }, [[so[0], so[1]]]);
  } },
  // 6. the throw into the fire (he stays on the paw hand), the flare, the father kneels and pulls it out
  { line: "L07", pre: 0.04, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), th = wordAt(ln, "threw", 0.3), fi = wordAt(ln, "fire", 1.0), fa = wordAt(ln, "father", 2.0), pl = wordAt(ln, "pulled", 3.0), ot = wordEnd(ln, "out", d - 0.1);
    const FP = { X: R.fire.X + 0.05, Y: R.fire.Y + 0.05, Z: R.fire.Z - 0.2 };
    if (u < fa - 0.05) {   // soldier wind-up and fling; the paw flies from his hand into the grate
      const c = cam(u / (fa - 0.05), [-0.85, 1.05, 2.6], [-0.95, 1.05, 3.0]);
      const tk0 = clamp((u - th + 0.2) / (fi - th + 0.4)), rel = clamp((tk0 - 0.55) / 0.4), fl = pulse(u, [th + 0.5], 0.6);
      const so = act(PW.soldier, c, { ...SOLDIER, hold: "paw", throw: tk0, haunted: 0.5, paw: STORY(0), pawSize: rel > 0 ? 0.01 : 1.15, m }, T);
      const q = wpt(c, FP, 1.3), pawF = rel > 0 ? flyPaw(heldPt(so[2], q.k), q, rel, STORY(0, { m }), T, [-20, 520], 120) : "";
      return parlourScene(T, c, m, { fire: 1 + fl * 0.6 }, [[so[0], so[1]]]) + pawF + (fl > 0.05 ? `<rect width="${W}" height="${H}" fill="#ffb040" opacity="${n(fl * 0.3)}" style="mix-blend-mode:screen"/>` : "");
    }
    const c = cam((u - fa + 0.05) / (d - fa + 0.05), [-0.5, 1.0, 3.3], [-0.65, 0.95, 3.7]);
    const kn = tr([[fa - 0.05, 0], [fa + 0.4, 1]], u), reach = tr([[fa + 0.2, 0], [pl - 0.1, 1], [ot, 0.5]], u), up = tr([[pl, 0], [ot, 1]], u);
    const fa1 = act(PW.whiteFather, c, { X: -0.65, Z: 5.2, fx: -0.6, kneel: kn, reach: up > 0.1 ? 0 : reach, reachTo: [-34, -72], hold: up > 0.05 ? "paw" : null, holdUp: up, paw: STORY(1 - 1), brow: 0.6, wide: 0.5, m }, T);
    const pawFire = up < 0.05 ? PW.paw(c, FP.X, FP.Y, FP.Z, STORY(0, { rot: 70, size: 1.3, glow: 0.2, m }), T) : "";
    return parlourScene(T, c, m, { fire: 1.1 }, [[5.9, pawFire], [fa1[0], fa1[1]]]);
  } },
  // 7. the father stands, the paw up in the same (left) hand, half smile; the son grinning behind, clear of the raised cuff
  { line: "L08", pre: 0.05, hold: 0.03, shot(u, d, T, ln) {
    const m = PW.mood("parlour");
    const set = (c) => {
      const f = act(PW.whiteFather, c, { X: 0.2, Z: 4.9, fx: -0.4, hold: "paw", holdUp: 1, paw: STORY(0), smile: 0.5, brow: 0.4, talk: tk("F", T), m }, T);
      const so = act(PW.son, c, { X: 0.95, Z: 5.7, fx: -0.4, smile: 1, m }, T), mo = act(PW.whiteMother, c, { X: -0.95, Z: 5.7, fx: 0.5, m }, T);
      return parlourScene(T, c, m, {}, [f, so, mo].map((a) => [a[0], a[1]]));
    };
    const cut = d * 0.6;
    return u < cut ? set(cam(u / cut, [0.1, 1.3, 2.9], [0.1, 1.33, 3.2])) : set(cam((u - cut) / (d - cut), [0.55, 1.2, 1.8], [0.5, 1.2, 2.2]));
  } },
  // 8. the wish: green twist + the first finger, the father lets go (the paw falls to the rug), the family's stillness
  { line: "L09", pre: 0.1, hold: 0.7, shot(u, d, T, ln) {
    const tw = wordAt(ln, "twisted", 0.3), sn = wordEnd(ln, "snake", 2.2), nt = wordAt(ln, "nothing", 2.9);
    const k = tr([[tw - 0.1, 0], [tw + 0.3, 1], [sn - 0.2, 1], [sn + 0.4, 0]], u), m = k > 0 ? PW.moodMix("parlour", "paw", k) : PW.mood("parlour");
    const fing = tr([[tw + 0.2, 0], [tw + 0.7, 1]], u), glow = Math.max(k, pulse(u, [tw + 0.5], 0.5));
    const mP = PW.mood("parlour"), FS = { X: 0.2, Z: 4.9, fx: -0.4 };
    if (u < sn + 0.1) {
      const c = cam(u / (sn + 0.1), [-0.15, 1.3, 3.3], [-0.2, 1.31, 3.6]);
      const f = act(PW.whiteFather, c, { ...FS, hold: "paw", holdUp: 1, paw: STORY(fing, { twist: k, glow }), pawSize: 1.6, wide: k * 0.8, brow: k, m }, T);
      return parlourScene(T, c, m, { fire: lerp(1, 0.6, k) }, [[f[0], f[1]]]);
    }
    if (u < nt - 0.1) {   // he drops it: wide; the paw leaves his hand and lands on the rug, still one finger down
      const c = cam((u - sn - 0.1) / (nt - sn - 0.2), [0.1, 1.2, 0.9], [0.1, 1.2, 1.3]), dr = clamp((u - sn - 0.1) / 0.45);
      const f = act(PW.whiteFather, c, { ...FS, hold: "paw", holdUp: 1 - 0.7 * dr, paw: STORY(1), pawSize: dr > 0 ? 0.01 : 1.15, wide: 0.4, m: mP }, T);
      const so = act(PW.son, c, sonSit(mP, { smile: 0.6 }), T), mo = act(PW.whiteMother, c, motherSit(mP), T);
      const q = wpt(c, { X: 0.45, Y: 0.03, Z: 4.8 }, 1.3), pw = dr > 0 ? (dr < 1 ? flyPaw(heldPt(f[2], q.k), q, dr, STORY(1, { m: mP }), T, [-10, 80], 40) : PW.paw(c, 0.45, 0.03, 4.8, STORY(1, { rot: 80, lying: 1, size: 1.3, m: mP }), T)) : "";
      return parlourScene(T, c, mP, {}, [f, so, mo].map((a) => [a[0], a[1]])) + pw;
    }
    const c = cam((u - nt + 0.1) / (d + 0.7 - nt), [0.7, 1.15, 2.4], [0.62, 1.17, 2.8]);   // father + son, a shrug, then the stillness
    const sh = Math.sin(clamp((u - nt) / 0.5) * Math.PI);
    const f = act(PW.whiteFather, c, { X: 0.1, Z: 4.9, fx: 0.6, tilt: 5 * sh, brow: -0.2, smile: 0.4, lean: -2 * sh, m: mP }, T);
    const so = act(PW.son, c, { X: 1.15, Z: 5.1, fx: -0.6, smile: 1, tilt: -5 * sh, lean: 2 * sh, m: mP }, T);
    return parlourScene(T, c, mP, {}, [f, so].map((a) => [a[0], a[1]])) + PW.paw(c, 0.45, 0.03, 4.8, STORY(1, { rot: 80, lying: 1, size: 1.3, m: mP }), T);
  } },
  // 9-10. silence: the kid is smug, the keeper says wait (flame shrinks), the cut comes off her last syllable
  { line: "L10", pre: 0.12, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.4, 1.0, 2.8], [-0.38, 1.01, 2.95]);
    return atticScene(T, c, { kid: { fx: 0.6, grin: 1, look: 0.9 }, keeper: { flame: 1 }, pawW: { ...TRUNK, st: { fingers: 0, rot: 40 } } });
  } },
  { line: "L11", pre: 0.08, hold: 0.1, shot(u, d, T) {
    const c = cam(u / (d + 0.1), [0.78, 1.0, 2.15], [0.78, 1.02, 2.4]);
    return atticScene(T, c, { kid: false, keeper: { flame: tr([[0, 1], [d + 0.1, 0.5]], u), stern: 1 }, glow: tr([[0, 1], [d + 0.1, 0.6]], u) });
  } },
  // 11. the factory gate (no lettering); "caught" tilts down to the cap, the cap carries the rest
  { line: "L12", pre: 0.05, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("grief"), ca = wordAt(ln, "caught", 2.0) + 0.1, cp = PW.FACTORY.cap;
    if (u < ca) return PW.factoryGate(cam(u / ca, [0.0, 1.5, -0.6], [0.1, 1.4, 1.6]), T, m);
    return PW.factoryGate(cam((u - ca) / (d - ca + 0.05), [0.12, 1.35, 1.9], [cp.X - 0.05, 0.38, 2.9], "out"), T, m);
  } },
  // 12. the man from the firm: medium by "takes no blame", envelope offered on "200 pounds" (the hat stays in his other hand)
  { line: "L13", pre: 0.05, hold: 0.05, shot(u, d, T, ln) {
    const m = PW.mood("grief"), wi = wordAt(ln, "wish", 2.3) - 0.1, tw = wordAt(ln, "200", 3.3) - 0.15, w1 = 0.4;
    const CL = (extra) => ({ X: 0.05, Z: HL.Z - 0.1, fx: -0.2, hat: 1, nervous: 1, talk: tk("C", T), m, ...extra });
    const mother = (c) => act(PW.whiteMother, c, { X: -0.68, Z: 4.35, fx: 0.7, grief: 1, tears: 0.6, m }, T), father = (c) => act(PW.whiteFather, c, { X: 0.7, Z: 4.3, fx: -0.7, brow: 1, m }, T);
    const door = (c) => PW.frontDoor(c, T, m, { open: 1, bolt: 1, outside: "grief" });
    if (u < w1) {
      const c = cam(u / w1, [0.0, 1.32, 2.1], [0.02, 1.34, 2.4]);
      const cl = act(PW.clerk, c, CL(), T);
      return door(c) + byZ([cl, mother(c), father(c)].map((a) => [a[0], a[1]]));
    }
    if (u < tw) {
      const c = cam((u - w1) / (tw - w1), [0.05, 1.45, 3.5], [0.05, 1.45, 3.95]);
      const dn = tr([[wi, 0], [wi + 0.3, 1]], u);
      const cl = act(PW.clerk, c, CL({ tilt: 9 * dn, look: -0.3 }), T);
      return door(c) + cl[1];
    }
    const c = cam((u - tw) / (d + 0.1 - tw), [-0.12, 1.32, 3.6], [-0.14, 1.3, 3.9]);
    const cl = act(PW.clerk, c, CL({ fx: -0.3, nervous: 0.6, offer: clamp((u - tw) / 0.3), hold: "envelope" }), T);
    return door(c) + cl[1];
  } },
  // 13. "That's... the same money."
  { line: "L14", pre: 0.05, hold: 0, shot(u, d, T) {
    const m = PW.moodMix("attic", "grief", 0.8), c = cam(u / d, [-0.4, 1.0, 2.75], [-0.38, 1.01, 2.9]);
    return atticScene(T, c, { m, kid: { fx: 0.55, shock: 0.8, look: 0.6 }, keeper: { flame: 0.35 }, glow: 0.6 });
  } },
  // 14. the mother takes the paw from the mantel (it lies on the shelf first, one finger down)
  { line: "L15", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("grief"), gr = wordAt(ln, "grabbed", 1.5) - 0.2;
    const MP = { X: R.mantel.X, Y: R.mantel.Y + 0.01, Z: R.mantel.Z - 0.1 };
    const mo = (c, o) => act(PW.whiteMother, c, { X: -0.95, Z: 5.3, fx: 0.3, grief: 1, tears: 0.3, m, ...o }, T);
    const fa = (c) => act(PW.whiteFather, c, fatherSit(m, { fx: -0.5, brow: 1, smile: -0.5 }), T);
    if (u < gr) {
      const c = cam(u / gr, [-0.7, 1.55, 2.8], [-0.85, 1.5, 3.4]);
      const reach = clamp((u - 0.15) / (gr - 0.15)), a = mo(c, { reach, reachTo: [30, -148] });
      return parlourScene(T, c, m, { fire: 0, lamp: 0.2 }, [a, fa(c)].map((q) => [q[0], q[1]])) + PW.paw(c, MP.X, MP.Y, MP.Z, STORY(1, { rot: -80, size: 1.5, lying: 1, m }), T);
    }
    const c = cam((u - gr) / (d - gr + 0.1), [-0.82, 1.3, 4.2], [-0.82, 1.25, 4.5], "out");
    const a = mo(c, { hold: "paw", holdUp: tr([[gr, 0.6], [gr + 0.4, 1]], u), paw: STORY(1), pawSize: 1.5 });
    return parlourScene(T, c, m, { fire: 0, lamp: 0.2 }, [[a[0], a[1]]]);
  } },
  // 15. "Bring our boy back!" (the second finger closes on "back"), then she lets go and the paw falls to the rug
  { line: "L16", pre: 0.08, hold: 0.4, shot(u, d, T, ln) {
    const m = PW.mood("grief"), bk = wordAt(ln, "back", d - 0.4), be = wordEnd(ln, "back", d), bb = wordAt(ln, "boy", 1.0);
    const fing = tr([[bk, 1], [bk + 0.35, 2]], u), tw = tr([[bk, 0], [bk + 0.2, 1], [be + 0.3, 0.3]], u), glow = pulse(u, [be - 0.05], 0.5);
    const rel = clamp((u - (d - 0.05)) / 0.4);
    const MO = { X: -1.2, Z: 5.4, fx: 0.5, hold: "paw", holdUp: 1, paw: STORY(fing, { twist: tw, glow }), pawSize: rel > 0 ? 0.01 : 1.4, grief: 1, tears: 1, brow: 0.6, talk: tk("M", T), lean: 3, m };
    const FA = { X: 0.0, Z: 5.5, fx: -0.6, brow: 1, smile: -0.8, reach: 0.25, m };
    if (u < bb) {
      const c = cam(u / bb, [-1.0, 1.33, 4.2], [-1.05, 1.34, 4.45]);
      return parlourScene(T, c, m, { fire: 0, lamp: 0 }, [act(PW.whiteMother, c, MO, T)].map((q) => [q[0], q[1]]));
    }
    if (u < d - 0.05) {
      const c = cam((u - bb) / (d - bb), [-0.9, 1.3, 3.1], [-0.95, 1.3, 3.5]);
      return parlourScene(T, c, m, { fire: 0, lamp: 0 }, [act(PW.whiteMother, c, { ...MO, lean: 4 }, T), act(PW.whiteFather, c, FA, T)].map((q) => [q[0], q[1]]));
    }
    const c = cam((u - d + 0.05) / 0.5, [-0.7, 1.05, 2.5], [-0.65, 1.0, 2.7]);   // she lets go: the paw falls to the rug where he will crawl
    const mo = act(PW.whiteMother, c, { ...MO, lean: 4 }, T), q = wpt(c, { X: RUG.X, Y: 0.03, Z: RUG.Z }, 1.3);
    const pw = rel < 1 ? flyPaw(heldPt(mo[2], q.k), q, rel, STORY(2, { m }), T, [-10, 80], 30) : PW.paw(c, RUG.X, 0.03, RUG.Z, STORY(2, { rot: 80, lying: 1, size: 1.3, m }), T);
    return parlourScene(T, c, m, { fire: 0, lamp: 0 }, [mo, act(PW.whiteFather, c, FA, T)].map((x) => [x[0], x[1]])) + pw;
  } },
  // 16-17. the kid hopeful, the keeper very quiet
  { line: "L17", pre: 0.1, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.4, 1.0, 2.75], [-0.38, 1.01, 2.9]);
    return atticScene(T, c, { kid: { fx: 0.55, grin: 0.5, look: 0.8 }, keeper: { flame: 0.55 }, glow: 0.8 });
  } },
  { line: "L18", pre: 0.1, hold: 0.35, shot(u, d, T) {
    const c = cam(u / (d + 0.35), [0.78, 1.0, 2.2], [0.8, 1.01, 2.4]);
    return atticScene(T, c, { kid: false, keeper: { flame: tr([[0, 0.5], [d + 0.3, 0.18]], u), stern: 1 }, glow: 0.5 });
  } },
  // 18. the hall: push toward the door; it shakes on "knocked"
  { line: "L19", pre: 0.15, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("knock"), kn = wordAt(ln, "knocked", d - 1.2) - 0.05;
    return PW.frontDoor(cam(u / d, [0.0, 1.35, 1.2], [0.06, 1.45, 3.0]), T, m, { knock: pulse(u, [kn], 0.5), bolt: 0 });
  } },
  // 19. quiet, the first hit (door), the second hit on the mother's face; the third is saved for the crawl
  { id: "KN", line: null, dur: 1.55, pre: 0.3, hold: 0, shot(u, d, T) {
    const m = PW.mood("knock");
    if (u < 1.0) return PW.frontDoor(cam(u / 1.0, [0.02, 1.4, 1.2], [0.05, 1.42, 2.3]), T, m, { knock: pulse(u, [0.35], 0.45), bolt: 0 });
    const c = cam((u - 1.0) / 0.55, [0.12, 1.2, 3.35], [0.13, 1.22, 3.55]);
    const mo = handOn(PW.whiteMother, c, { X: 0.14, Z: 4.72, fx: 0.25, tiptoe: 0.5, grief: 1, tears: 1, wide: 0.8, shock: 1, m }, "handR", boltPt(c).x, boltPt(c).y, T);
    return PW.frontDoor(c, T, m, { knock: pulse(u, [1.0], 0.45), bolt: 0 }) + mo[1];
  } },
  // 20. the mother at the bolt, the knocks louder and faster
  { line: "L20", pre: 0.04, hold: 0.04, shot(u, d, T, ln) {
    const m = PW.mood("knock"), cut = d * 0.5, bolt = tr([[0.3, 0], [0.8, 0.2], [1.1, 0.1], [1.6, 0.35], [2.0, 0.25], [2.5, 0.4]], u);
    const kn = pulse(u, [0.0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.05, 2.3, 2.55], 0.2) * 0.8;
    const c = u < cut ? cam(u / cut, [0.12, 1.22, 3.35], [0.13, 1.24, 3.6]) : cam((u - cut) / (d - cut), [0.18, 1.3, 3.6], [0.2, 1.32, 3.85]);
    const b = boltPt(c), mo = handOn(PW.whiteMother, c, { X: 0.14, Z: 4.72, fx: 0.25, tiptoe: 1, grief: 1, tears: 1, talk: tk("M", T), m }, "handR", b.x - bolt * 30, b.y, T);
    return PW.frontDoor(c, T, m, { knock: kn, bolt }) + mo[1];
  } },
  // 21. the dark parlour: the father crawls, a cut to her fingers on the bolt, his hand finds the paw (two fingers down), the last wish
  { line: "L21", pre: 0.08, hold: 0.3, shot(u, d, T, ln) {
    const m = PW.mood("knock"), fo = wordAt(ln, "found", 1.7) - 0.05, ls = wordAt(ln, "last", 3.2), ws = wordAt(ln, "wish", 3.5), we = wordEnd(ln, "wish", d);
    const fing = tr([[ws, 2], [we, 3]], u), glow = Math.max(pulse(u, [we], 0.7), tr([[we, 0], [we + 0.15, 0.7]], u));
    const pawW = (c) => PW.paw(c, RUG.X, 0.03, RUG.Z, STORY(fing, { glow, rot: 64, size: 1.3, lying: 1, m }), T);
    const fx = (X, o = {}) => ({ X, Z: 4.9, fx: 0.7, crawl: 1, wide: 1, brow: 1, m, ...o });
    const cutA = fo - 0.55, cutB = fo - 0.02;
    if (u < cutA) {
      const c = cam(u / cutA, [-0.6, 0.75, 2.4], [-0.3, 0.72, 3.0]), X = lerp(-1.1, -0.55, ease(u / cutA, "linear"));
      const f = act(PW.whiteFather, c, fx(X, { reach: 0.3 + 0.2 * Math.sin(u * 5) }), T);
      return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1];
    }
    if (u < cutB) {   // the hall: her fingers slide the bolt
      const c = cam((u - cutA) / (cutB - cutA), [0.18, 1.3, 3.6], [0.2, 1.32, 3.75]), bolt = tr([[cutA, 0.4], [cutB, 0.75]], u), b = boltPt(c);
      const mo = handOn(PW.whiteMother, c, { X: 0.14, Z: 4.72, fx: 0.25, tiptoe: 1, grief: 1, tears: 1, m }, "handR", b.x - bolt * 30, b.y, T);
      return PW.frontDoor(c, T, m, { knock: pulse(u, [cutA + 0.1], 0.3) * 0.8, bolt }) + mo[1];
    }
    if (u < ws - 0.05) {
      const c = cam((u - cutB) / (ws - cutB), [-0.35, 0.5, 3.0], [-0.1, 0.42, 3.6]);
      const f = act(PW.whiteFather, c, fx(-0.5, { reach: tr([[cutB, 0.5], [ws - 0.4, 1]], u), reachTo: [60, -10] }), T);
      return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1];
    }
    const c = cam((u - ws) / (d + 0.3 - ws), [-0.1, 0.4, 3.7], [-0.05, 0.36, 3.9]);
    const f = act(PW.whiteFather, c, fx(-0.5, { reach: 1, reachTo: [60, -10] }), T);
    return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1] + (pulse(u, [we], 0.25) > 0.02 ? `<rect width="${W}" height="${H}" fill="#cfe34a" opacity="${n(pulse(u, [we], 0.25) * 0.25)}" style="mix-blend-mode:screen"/>` : "");
  } },
  // 22. silence; she clears the bolt and the door swings open in one move; the empty road
  { line: "L22", pre: 0.05, hold: 0, shot(u, d, T, ln) {
    const st = wordEnd(ln, "stopped", 1.0), sw = wordAt(ln, "swung", 1.8) - 0.1, op = wordEnd(ln, "swung", 2.5) + 0.2, rd = wordAt(ln, "road", 3.0) - 0.05;
    const MO = (c, o = {}) => ({ X: 0.6, Z: 4.7, fx: -0.4, grief: 1, tears: 1, m: o.m, ...o });
    if (u < sw) {
      const m = PW.mood("knock"), c = cam(u / sw, [0.06, 1.4, 1.9], [0.08, 1.42, 2.4], "linear");
      const bolt = tr([[st + 0.1, 0.75], [sw - 0.05, 1]], u), b = boltPt(c);
      const mo = handOn(PW.whiteMother, c, MO(c, { m, tiptoe: 1 }), "handR", b.x - bolt * 30, b.y, T);
      return PW.frontDoor(c, T, m, { knock: u < st - 0.05 ? pulse(u % 0.35, [0], 0.3) * 0.9 : 0, bolt }) + mo[1];
    }
    if (u < rd) {
      const k = tr([[sw, 0], [op, 1]], u), m = PW.moodMix("knock", "road", k), c = cam((u - sw) / (rd - sw), [0.2, 1.4, 2.3], [0.2, 1.4, 3.0]);
      const mo = act(PW.whiteMother, c, MO(c, { m, X: lerp(0.6, 0.78, ease(clamp((u - sw) / 0.5))), fx: -0.5 }), T);
      return PW.frontDoor(c, T, m, { bolt: 1, chain: 0, open: tr([[sw + 0.05, 0], [op, 1]], u) }) + mo[1];
    }
    const m = PW.mood("road");
    return PW.road(cam((u - rd) / (d - rd + 0.05), [0, 1.45, -1.4], [0.08, 1.5, 0.5], "out"), T, m);
  } },
  // 23-25. back in the attic: empty-handed, he fetches the hosts' own paw while she answers
  { line: "L23", pre: 0.2, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.52, 0.98, 2.8], [-0.5, 1.0, 2.95]);
    return atticScene(T, c, { kid: { fx: 0.5, shock: 0.5, look: 0.5, reachL: 0 }, keeper: { flame: 0.8 }, pawW: { ...TRUNK, st: { fingers: 0, rot: 40 } } });
  } },
  { line: "L24", pre: 0.06, hold: 0.75, shot(u, d, T) {
    const c = cam(u / (d + 0.75), [-0.25, 1.0, 1.5], [-0.15, 1.0, 1.75]);
    const out = clamp(u / 0.5), back = clamp((u - 1.0) / 0.7), pick = clamp((u - 0.5) / 0.4);
    const X = lerp(A.kid.X, -0.85, ease(out)) + (-0.35 - (-0.85)) * ease(back), walking = (u > 0 && u < 0.5) || (u > 1.0 && u < 1.7);
    const kfx = u < 1.0 ? -0.6 : 0.2;
    return atticScene(T, c, { kid: { X, fx: kfx, run: walking ? u * 2.4 : null, reachL: pick > 0 ? 0.9 * Math.min(1, pick * 2) : 0, lean: walking ? 3 : 0 }, keeper: { X: lerp(A.keeper.X, KX, ease(clamp(u / 0.5))), fx: 0.7, flame: 0.7 },
      pawW: pick <= 0 ? { ...TRUNK, st: { fingers: 0, rot: 40 } } : null, fly: pick > 0 && pick < 1 ? { from: TRUNK, to: "hand", f: pick, st: { fingers: 0 }, arc: 60 } : null, paw: pick >= 1 ? { fingers: 0, size: 1.05 } : null });
  } },
  { line: "L25", pre: 0.1, hold: 0.04, shot(u, d, T) {
    const c = cam(u / d, [-0.65, 1.0, 2.9], [-0.65, 1.03, 2.7]);
    return atticScene(T, c, { kid: { X: -0.35, fx: -0.7, reachL: 1, look: -0.8, grin: 0.5 }, keeper: false, paw: { fingers: 0, dy: -36, dx: -4, size: 1.0 } });
  } },
  // 26. extreme close: ONE finger curls (no face, just the paw, his sleeve and the attic)
  { id: "CURL", line: null, dur: 0.5, pre: 0, hold: 0, shot(u, d, T) {
    const m = PW.mood("attic"), c = cam(u / d, [-0.5, 0.95, 3.4], [-0.5, 0.97, 3.52]);
    const f = tr([[0.04, 0], [0.4, 1]], u), glow = pulse(u, [0.32], 0.3);
    const sleeve = `<g class="ol"><path d="M360,1920 L420,1330 Q540,1290 650,1330 L720,1920 Z" fill="#e8476a" stroke="${L.INK}" stroke-width="5"/><path d="M430,1480 L640,1470 M440,1640 L655,1630" stroke="#bd2f50" stroke-width="5" fill="none"/><path d="M430,1330 Q540,1290 650,1330 L650,1370 Q540,1340 430,1370 Z" fill="#f2c8a0" stroke="${L.INK}" stroke-width="4"/></g>`;
    return PW.attic(c, T, m, { dust: 0.6 }) + sleeve + PW.pawAt(540, 1360 - u * 20, 22, { rot: -4, fingers: f, glow: glow * 0.6, m }, T) + PW.grade(m, 0.9);
  } },
  // 27. the wrong voice: she drains, close, dead still, lantern whole
  { line: "L26", pre: 0.2, hold: 0, shot(u, d, T) {
    const k = clamp((u + 0.15) / 0.15), m = PW.moodMix("attic", "blank", k), c = cam((u + 0.2) / (d + 0.2), [0.12, 1.12, 1.95], [0.12, 1.12, 2.05]);
    return atticScene(T, c, { m, blank: k, kid: false, keeper: { X: KX, fx: -0.45, flame: 1 - 0.6 * k }, glow: 1 - 0.4 * k, dust: 1 - 0.7 * k }) + PW.grade(m, k);
  } },
  // 28. "Grandma?": the wick is lit in this shot and goes out on the end of the question, then black
  { line: "L27", pre: 0.1, hold: 0.28, shot(u, d, T) {
    const out = clamp((u - d) / 0.12), cl = 1 - out, m = PW.moodMix("attic", "blank", 1 - 0.0);
    const c = cam(u / (d + 0.28), [0.15, 1.05, 2.3], [0.13, 1.05, 2.2]);
    const turn = tr([[0, 0.7], [0.5, -0.1]], u);
    return atticScene(T, c, { m, blank: 1, kid: { X: -0.35, fx: turn, shock: 1, worry: 1, reachL: 0.9 }, paw: { fingers: 1, size: 1.0 }, keeper: { X: KX, fx: -0.5, flame: cl, talk: 0 }, glow: cl, dust: 0.3 * cl }) + PW.grade(m, 1)
      + (out > 0 ? `<rect width="${W}" height="${H}" fill="#02050a" opacity="${n(out * 0.6)}"/>` : "");
  } },
  { black: 0.3 },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  if (b.black) { TL.push({ black: true, at: t, end: t + b.black, d: b.black }); t += b.black; continue; }
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur;
  const st = t + (b.pre || 0);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + (b.hold || 0) });
  t = st + d + (b.hold || 0);
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
function tk(who, time) {
  for (const b of TL) if (b.ln && b.ln.who === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
}
const at = (id) => TL.find((b) => b.line === id || b.id === id);

// ---------------------------------------------------------------- captions: word by word in the upper third, never over faces
const KEY = /^(1902|200|paw|wish|wishes|death|knock|knocked|jacobs)/i;
function captions(time, y) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < x.lineAt + x.d);   // a caption ends with its line (and so with the cut), never carries over
  if (!b) return "";
  const u = time - b.lineAt, words = b.ln.cap, chunks = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); if ((/[.,?!…]$/.test(w[0]) && w[0].length > 2) || (cur.length >= 4 && !/^[A-Z]\.$/.test(w[0]) && !/^[A-Z]\.$/.test(words[i + 1]?.[0] || "")) || i === words.length - 1) { chunks.push(cur); cur = []; } });
  const ci = chunks.findIndex((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] - 0.04 : 1e9));
  const ch = chunks[ci < 0 ? chunks.length - 1 : ci];
  // (27 Nov, Jonny on the other folklore drafts: captions "a bit messy") the whole chunk is laid out from its first word,
  // words not yet spoken are invisible, so nothing re-centres or changes size while words appear (as PR #338's captions lib)
  if (u < ch[0][1] - 0.04) return "";
  if (u > ch[ch.length - 1][1] + 1.1) return "";
  const full = ch.map((w) => w[0]).join(" ");
  const txt = ch.map((w) => `<tspan fill="${KEY.test(norm(w[0])) ? "#ffc04a" : "#ffffff"}"${u >= w[1] - 0.04 ? "" : ` fill-opacity="0" stroke-opacity="0"`}>${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  return `<text x="540" y="${y}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${n(Math.min(74, 74 * 22 / Math.max(1, full.length)))}" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  if (b.black) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/></svg>`;
  const u = time - b.lineAt;
  const body = b.shot(Math.max(u, -0.5), b.d, time, b.ln);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${body}${L.vignette()}${captions(time, b.capY ?? 270)}</svg>`;
}

// ---------------------------------------------------------------- the sound mix
// stage 1: voices + music + soft sfx -> loudnorm -15 LUFS, true peak -4.5; stage 2: + the knocks (raw, peak ~ -1 dBFS) -> -14 LUFS / TP -1.5,
// so the knocks end up the loudest transients and the voices sit about 3 dB under them
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
const PRE_GAIN = 1.45;   // premix -17 LUFS -> about -14 with the knocks; the knocks stay at full level
export function prepare(outPath) {
  mkdirSync(OUT, { recursive: true });
  const sfx = (p) => `assets/sfx/${p}`, LP5 = "lowpass=f=5000,";
  const mk = () => ({ ins: [], f: [], tags: [] });
  const add = (G, file, at0, gain = 1, pre = "") => { G.ins.push("-i", file); const k = G.ins.length / 2 - 1; G.f.push(`[${k}:a]${pre}volume=${gain},adelay=${Math.round(at0 * 1000)}:all=1[a${k}]`); G.tags.push(`[a${k}]`); };
  const S = mk(), K = mk();
  for (const b of TL) if (b.ln) add(S, b.ln.file, b.lineAt, b.ln.who === "K" ? 1.4 : 1, "aresample=44100,");   // kid +3 dB
  const music = (bed, s, e, g, fi = 0.5, fo = 0.5, ss = 0) => {
    if (e - s < 0.3) return;
    const dur = e - s;
    add(S, `${MUS}/${bed}/${bed}-01.ogg`, s, g, `aloop=loop=-1:size=2e9,atrim=${ss}:${(ss + dur).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=4500,afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, dur - fo).toFixed(2)}:d=${fo},`);
  };
  const gA = 0.74, gB = 0.52, gC = 0.58, gD = 0.54, gE = 0.55;
  const [L01, L04, L06, L07, L09, L10, L12, L13, L14, L15, L16, L18, L19, L20, L21, L22, L23, L24, L26, L27] = ["L01", "L04", "L06", "L07", "L09", "L10", "L12", "L13", "L14", "L15", "L16", "L18", "L19", "L20", "L21", "L22", "L23", "L24", "L26", "L27"].map(at);
  const CURL = at("CURL"), KN = at("KN");
  const dth = L06.lineAt + wordAt(L06.ln, "was", 3.5);
  music("paw-a-parlour", 0, dth + 0.8, gA, 0.2, 0.9);                                         // A: attic + parlour, thins under "was for death"
  music("paw-d-door", dth, L06.lineAt + L06.d + 0.2, gD * 0.9, 0.8, 0.6);                      // one cello note on "death"
  const twist = L09.lineAt + wordAt(L09.ln, "twisted", 0.3) - 0.1;
  music("paw-b-wish", twist, L10.lineAt - 0.05, gB, 0.3, 1.1);                                 // paw motif at the twist, decays to silence
  music("paw-b-wish", L12.lineAt, L13.lineAt + wordAt(L13.ln, "give", 3) + 0.4, gB * 0.85, 0.6, 0.8);   // next day: wide notes
  music("paw-d-door", L13.lineAt + wordAt(L13.ln, "give", 3) - 0.2, L14.lineAt + L14.d + 0.4, gD * 0.6, 0.8, 0.6);   // one held note: "200 pounds" + recognition
  music("paw-c-plea", L15.lineAt + wordAt(L15.ln, "grabbed", 1.5), L16.lineAt + L16.d + 0.2, gC, 0.5, 0.5);       // swell on the plea
  music("paw-d-door", L16.lineAt + L16.d + 0.1, L18.lineAt - 0.12, gD * 0.55, 0.4, 0.12, 4);                      // single cello D for "That's good, right?"
  music("paw-d-door", L19.lineAt, L19.lineAt + L19.d - 0.12, gD * 0.35, 0.6, 0.2, 8);                              // very soft, out by the end of the line
  music("paw-d-door", L22.lineAt + wordEnd(L22.ln, "empty", 5.0) + 0.15, L23.lineAt - 0.1, gD * 0.45, 1.0, 0.3, 12);  // faint cello D once the road registers
  music("paw-e-attic", L23.lineAt - 0.25, L24.lineAt + wordAt(L24.ln, "knows", 0.5) + 0.2, gE * 0.7, 0.4, 0.5);      // thin cello, falls away on "knows"
  music("paw-e-attic", CURL.at - 0.15, CURL.end + 0.35, gE * 1.1, 0.2, 0.45, 2);                                     // exposed motif on the curling finger
  // sfx
  const slap = L01.lineAt + wordEnd(L01.ln, "down", 0.5) - 0.05;
  add(S, sfx("kenney/impact/impactSoft_medium_000.ogg"), slap, 0.9, LP5);                                  // the slap
  add(S, sfx("ai/flare/flare-01.wav"), L01.lineAt + wordAt(L01.ln, "three", 1) - 0.1, 0.35, LP5);           // flame flares
  const fireEnd = L09.lineAt + L09.d + 0.4;
  add(S, sfx("ai/house-fire/house-fire-02.wav"), L04.lineAt - 0.3, 0.13, `aloop=loop=-1:size=2e9,atrim=0:${(fireEnd - L04.lineAt + 0.3).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=3000,afade=t=in:d=1.2,afade=t=out:st=${(fireEnd - L04.lineAt - 0.6).toFixed(2)}:d=1.0,`);
  add(S, sfx("kenney/interface/tick_001.ogg"), L04.lineAt, 0.05, `apad=whole_dur=1.2,aloop=loop=-1:size=2e9,atrim=0:${(L09.lineAt + 2.0 - L04.lineAt).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=1800,afade=t=out:st=${(L09.lineAt + 1.2 - L04.lineAt).toFixed(2)}:d=0.8,`);
  add(S, sfx("ai/flare/flare-01.wav"), L07.lineAt + wordAt(L07.ln, "threw", 0.3) + 0.5, 0.8, LP5);           // the fire takes it
  add(S, sfx("kenney/rpg/creak1.ogg"), L09.lineAt + wordAt(L09.ln, "twisted", 0.3) + 0.1, 0.8, LP5);       // dry creak on the twist
  add(S, sfx("kenney/impact/impactSoft_medium_001.ogg"), L09.lineAt + wordEnd(L09.ln, "snake", 2.2) + 0.45, 0.5, LP5);   // the paw lands on the rug
  add(S, sfx("kenney/rpg/creak2.ogg"), L16.lineAt + wordAt(L16.ln, "back", L16.d - 0.4) + 0.05, 0.6, LP5);  // finger 2
  add(S, sfx("kenney/impact/impactSoft_medium_002.ogg"), L16.lineAt + L16.d + 0.3, 0.5, LP5);              // it lands on the rug
  // the knocks: the loudest sounds in the film
  // every knock take is levelled to a -1 dBFS peak after the 5 kHz lowpass, so each hit is as loud as the next
  const kn = (i, at0, g = 1) => { let gg = 1; try { const out = execFileSync("sh", ["-c", `ffmpeg -nostats -i ${sfx(`ai/knock/knock-0${i}.wav`)} -af lowpass=f=5000,volumedetect -f null - 2>&1 | grep -o 'max_volume: [-0-9.]*'`], { encoding: "utf8" }); gg = 10 ** ((-1 - parseFloat(out.split(" ")[1])) / 20); } catch (e) {} add(K, sfx(`ai/knock/knock-0${i}.wav`), at0, g * gg * 1.41, LP5); };
  kn(4, KN.lineAt + 0.35); kn(5, KN.lineAt + 1.0);
  [0.0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 2.05, 2.3, 2.55].forEach((o, i) => kn([1, 2, 3, 7, 8, 4, 5, 6, 1, 2][i], L20.lineAt + o));
  const ws = L21.lineAt + wordAt(L21.ln, "wish", 3.5);
  for (let o = L21.lineAt + 0.2, i = 0; o < ws - 0.2; o += 0.5 - 0.03 * i, i++) kn([3, 7, 8, 1, 2, 5, 4, 6][i % 8], o);
  add(S, sfx("ai/flare/flare-01.wav"), L21.lineAt + wordEnd(L21.ln, "wish", 3.8) - 0.05, 0.3, LP5);          // glow flash
  add(S, sfx("kenney/rpg/doorOpen_1.ogg"), L22.lineAt + wordAt(L22.ln, "swung", 1.8) - 0.05, 0.55, LP5);
  add(S, sfx("kenney/rpg/creak3.ogg"), CURL.at + 0.08, 0.7, LP5);                                          // the finger curls
  const snuffAt = L27.lineAt + L27.d + 0.02;
  add(S, sfx("ai/snuff/snuff-03.wav"), snuffAt, 0.9, LP5);
  const blk = TL.find((b) => b.black).at, end = `atrim=0:${blk.toFixed(2)},afade=t=out:st=${(blk - 0.04).toFixed(2)}:d=0.04,apad=whole_dur=${DUR.toFixed(2)}`;
  const premix = `${OUT}/paw-premix.wav`, mixPath = `${OUT}/paw-mix.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...S.ins, "-filter_complex", S.f.join(";") + ";" + S.tags.join("") + `amix=inputs=${S.tags.length}:normalize=0,${end},loudnorm=I=-17:TP=-6.5:LRA=11,atrim=0:${DUR.toFixed(2)}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", premix]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", premix, ...K.ins, "-filter_complex", K.f.map((x) => x.replace(/^\[(\d+)\:a\]/, (m0, i) => `[${+i + 1}:a]`).replace(/\[a(\d+)\]$/, (m0, i) => `[k${i}]`)).join(";") + ";[0:a]volume=" + PRE_GAIN + "[p0];[p0]" + K.tags.map((x) => x.replace("[a", "[k")).join("") + `amix=inputs=${K.tags.length + 1}:normalize=0,${end},alimiter=limit=0.84:level=disabled:attack=1:release=30,atrim=0:${DUR.toFixed(2)}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/paw-timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line || b.id, at: +b.at.toFixed(2), lineAt: +(b.lineAt ?? 0).toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
export const GAIN = 1;
