// Legend: The Monkey's Paw (W. W. Jacobs, 1902), H1 attic + E1 wrong voice. Built from SHOTS.md (the director's shot list).
// Rendered by tools/svg2d/render.mjs; voices read + post-processed already in out/legend-paw/voice/.
//   node tools/svg2d/render.mjs storyboards/series/legend/monkeys-paw/paw.mjs out/legend-paw/paw-draft1.mp4
// The timeline is built from the real line lengths; every shot is a function of (u = seconds into the line, d = line length).
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as PW from "../../../../tools/svg2d/lib/legend-paw.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-paw/voice", MUS = "out/legend-paw/music", OUT = "out/legend-paw";
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/monkeys-paw/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8"));
}
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
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
const jitter = (t, a) => Math.sin(t * 61) * a + Math.sin(t * 37 + 1) * a * 0.6;

// ---------------------------------------------------------------- the attic (the two hosts)
// o: kid / keeper state overrides, paw = paw in the kid's hand (state or null), pawW = {X,Y,Z,st} paw in the world, blank, m, tint
function atticScene(T, c, o = {}) {
  const m = o.m || PW.mood("attic");
  const ks = { X: A.kid.X, Z: A.kid.Z, fx: 0.7, reachL: o.paw ? 0.9 : 0, blink: blinkAmt(T % 3.9, [1.4]), talk: tk("K", T), ...o.kid };
  const gs = { X: A.keeper.X, Z: A.keeper.Z, fx: -0.7, stern: 1, open: 1, flame: 1, blink: blinkAmt((T + 1) % 3.3, [2.1]), talk: tk("G", T) || tk("GX", T), ...o.keeper };
  const kd = L.kid(c, ks, T), blank = o.blank || 0;
  const kp = blank > 0 ? PW.keeperBlank(c, { ...gs, blank }, T, null) : L.keeper(c, gs, T, null);
  const h = PW.kidHand(c, ks);
  const hand = o.paw ? PW.pawAt(h.x + (o.paw.dx || 0), h.y + (o.paw.dy || 0), h.k * (o.paw.size ?? 0.85), { rot: -10, ...o.paw, m }, T) : "";
  const pawW = o.pawW ? PW.paw(c, o.pawW.X, o.pawW.Y, o.pawW.Z, { size: 1.6, lying: 1, ...o.pawW.st, m }, T) : "";
  const kidDraw = o.kid === false ? "" : kd.svg + hand;
  return PW.attic(c, T, m, { light: kp.jar || { x: 540, y: 600 }, dust: o.dust ?? 1 }) + pawW + (kp.jar ? PW.candleLight(kp.jar, m, o.glow ?? 1, T) : "") + byZ([[ks.Z, kidDraw], [gs.Z, o.keeper === false ? "" : kp.svg + kp.arm]]) + PW.grade(m, o.tint ?? 0.9);
}

// ---------------------------------------------------------------- the parlour
// actors: [[Z, svg], ...]; the table goes behind everything nearer than it, in front of the rest
function parlourScene(T, c, m, o, actors) {
  const z = R.table.Z;
  const far = actors.filter((a) => a[0] >= z), near = actors.filter((a) => a[0] < z);
  return PW.parlour(c, T, m, { noTable: true, fire: o.fire ?? 1, lamp: o.lamp ?? 1 }) + byZ(far) + PW.parlourTable(c, T, m) + byZ(near);
}
const fatherSit = (m, o = {}) => ({ X: R.father.X, Z: R.father.Z - 0.08, fx: 0.5, sit: 1, m, ...o });
const sonSit = (m, o = {}) => ({ X: R.sonSeat.X, Z: R.sonSeat.Z - 0.08, fx: -0.6, sit: 1, smile: 1, m, ...o });
const motherSit = (m, o = {}) => ({ X: R.mother.X, Z: R.mother.Z - 0.08, fx: 0.5, sit: 1, knit: 1, seat: 0.5, m, ...o });
const act = (fn, c, st, T) => { const r = fn(c, st, T); return [st.Z, r.svg, r]; };

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
const BEATS = [
  // 1. HOOK: paw in the kid's hand, the slap, keeper close, paw on the trunk
  { line: "L01", pre: 0.05, hold: 0.1, shot(u, d, T, ln) {
    const sl = wordEnd(ln, "down", 0.5) + 0.05, th = wordAt(ln, "three", 2.0) - 0.1, dn = wordAt(ln, "dont", 3.2) - 0.1;
    const trunkP = { X: -1.5, Y: 0.5, Z: 5.5 };
    if (u < sl) {   // close on the paw in his hand, pushing in; the staff/hand slaps his wrist at the cut
      const c = cam(u / sl, [-0.52, 0.95, 3.0], [-0.55, 0.97, 3.3], "in");
      return atticScene(T, c, { kid: { fx: 0.45, grin: 1 }, keeper: { fx: -0.7 }, paw: { fingers: 0, size: 0.9 }, tint: 0.7 });
    }
    if (u < th) {   // 2-shot medium: the paw leaves his hand and lands on the trunk
      const f = clamp((u - sl) / 0.3), arc = Math.sin(f * Math.PI) * 0.35;
      const c = cam((u - sl) / (th - sl), [0.1, 1.0, 1.3], [0.15, 1.02, 1.6]);
      const slap = clamp(1 - (u - sl) / 0.25);
      return atticScene(T, c, { kid: { fx: 0.7, shock: 0.8, tug: 1, reachL: lerp(0.9, 0.1, ease(f)) }, keeper: { grab: 1 }, pawW: { X: lerp(-0.6, trunkP.X, ease(f)), Y: lerp(0.85, trunkP.Y, f) + arc, Z: lerp(3.9, trunkP.Z, ease(f)), st: { fingers: 0, rot: lerp(-10, 40, f), lying: f >= 1 ? 1 : 0 } }, paw: f < 0.02 ? { fingers: 0 } : null });
    }
    if (u < dn) {   // close on the keeper, the flame flares
      const c = cam((u - th) / (dn - th), [0.55, 1.0, 2.0], [0.56, 1.02, 2.25]);
      return atticScene(T, c, { kid: { fx: 0.7, shock: 0.5, tug: 1 }, keeper: { grab: 1, flame: tr([[0, 1], [0.3, 1.6], [0.9, 1.1]], u - th) }, pawW: { ...trunkP, st: { fingers: 0, rot: 40 } } });
    }
    const c = cam((u - dn) / (d + 0.1 - dn), [-1.0, 0.8, 3.9], [-1.25, 0.72, 4.4]);   // close on the paw on the trunk
    return atticScene(T, c, { kid: { fx: 0.7 }, keeper: { flame: 1 }, pawW: { ...trunkP, st: { fingers: 0, rot: 40, size: 1.9 } } });
  } },
  { line: "L02", pre: 0.12, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.42, 0.98, 2.75], [-0.4, 1.0, 2.9]);
    return atticScene(T, c, { kid: { fx: -0.5, look: -1, grin: 1 }, keeper: { grab: 0 }, pawW: { X: -1.5, Y: 0.5, Z: 5.5, st: { fingers: 0, rot: 40 } } });
  } },
  // 3. PARLOUR: wide push-in, window outside, close on the paw
  { line: "L04", pre: 0.25, hold: 0.05, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), w0 = wordAt(ln, "1902", 2.8) - 0.05, w1 = wordAt(ln, "writer", 4.2), w2 = wordAt(ln, "most", 7.2) - 0.05;
    const mk = (c, extra = {}) => {
      const act1 = [act(PW.whiteFather, c, fatherSit(m, { fx: 0.6, leanIn: 2 }), T), act(PW.son, c, sonSit(m, { hold: "piece", holdUp: 0.3 }), T), act(PW.whiteMother, c, motherSit(m), T),
        act(PW.soldier, c, { X: -0.55, Z: 5.6, fx: 0.5, m }, T)];
      return parlourScene(T, c, m, {}, act1.map((a) => [a[0], a[1]])) + (extra.paw ? PW.paw(c, R.mantel.X, R.mantel.Y + 0.01, R.mantel.Z, { fingers: 0, size: extra.paw, rot: -70, m }, T) : "");
    };
    if (u < w0) return mk(cam(u / w0, [-0.05, 1.3, 0.3], [-0.1, 1.24, 1.6]), { paw: 1.4 });
    if (u < w1) {   // the window: wind in the branch
      const c = cam((u - w0) / (w1 - w0), [1.2, 1.55, 3.3], [1.4, 1.58, 4.0]);
      return PW.parlour(c, T, m, { noTable: true });
    }
    if (u < w2) return mk(cam((u - w1) / (w2 - w1), [0.5, 1.15, 2.4], [0.2, 1.2, 2.9]), { paw: 1.4 });
    const c = cam((u - w2) / (d + 0.05 - w2), [-1.0, 1.4, 4.2], [-1.15, 1.34, 4.95], "out");   // the paw on the mantel
    return mk(c, { paw: 1.8 });
  } },
  // 4. the soldier holds it up; "holy man" = paw close, glow; "fate punishes" = father + son listening
  { line: "L05", pre: 0.12, hold: 0, shot(u, d, T, ln) {
    const hm = wordAt(ln, "holy", 3.0) - 0.15, fp = wordAt(ln, "fate", 5.0) - 0.05, sm = (st = {}) => ({ X: -1.05, Z: 5.45, fx: 0.5, hold: "paw", holdUp: 1, ...st });
    const father = (c, m, o) => act(PW.whiteFather, c, fatherSit(m, { fx: -0.6, leanIn: 8, ...o }), T), son = (c, m, o) => act(PW.son, c, sonSit(m, { fx: -0.6, smile: 0.2, ...o }), T);
    if (u < hm) {
      const m = PW.mood("parlour"), c = cam(u / hm, [-0.72, 1.28, 3.0], [-0.72, 1.3, 3.55]);
      const so = act(PW.soldier, c, sm({ m, paw: { fingers: 0 } }), T);
      return parlourScene(T, c, m, {}, [so, father(c, m), act(PW.whiteMother, c, motherSit(m), T)].map((a) => [a[0], a[1]]));
    }
    if (u < fp) {
      const k = tr([[0, 0], [0.5, 0.3]], u - hm), m = PW.moodMix("parlour", "paw", k), c = cam((u - hm) / (fp - hm), [-0.78, 1.15, 4.35], [-0.78, 1.18, 4.65]);
      const so = act(PW.soldier, c, sm({ m, haunted: 0.3, paw: { fingers: 0, glow: k, twist: 0.1 } }), T);
      return parlourScene(T, c, m, {}, [so].map((a) => [a[0], a[1]]));
    }
    const m = PW.mood("parlour"), c = cam((u - fp) / (d - fp), [0.66, 1.2, 1.9], [0.66, 1.2, 2.3]);
    return parlourScene(T, c, m, { fire: 0.9 }, [father(c, m, { leanIn: 4 }), son(c, m), act(PW.whiteMother, c, motherSit(m), T)].map((a) => [a[0], a[1]]));
  } },
  // 5. the soldier close, haunted; on "death" push hard into his eyes, fire dims
  { line: "L06", pre: 0.12, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), dt = wordAt(ln, "death", d - 0.8) - 0.1, ha = tr([[0, 0.5], [dt, 1]], u);
    const c = u < dt ? cam(u / dt, [-0.85, 1.38, 4.2], [-0.86, 1.4, 4.35]) : cam((u - dt) / (d - dt), [-0.88, 1.41, 4.62], [-0.9, 1.43, 4.85], "out");
    const fire = tr([[0, 1], [dt, 0.9], [d, 0.35]], u);
    const so = act(PW.soldier, c, { X: -1.05, Z: 5.45, fx: 0.4, hold: "paw", holdUp: 0.4, haunted: ha, brow: 0.4, talk: tk("S", T), m, paw: { fingers: 0 } }, T);
    return parlourScene(T, c, m, { fire }, [so].map((a) => [a[0], a[1]]));
  } },
  // 6. the throw into the fire, the flare, the father pulls it out
  { line: "L07", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("parlour"), th = wordAt(ln, "threw", 0.3), fi = wordAt(ln, "fire", 1.0), fa = wordAt(ln, "father", 2.0), pl = wordAt(ln, "pulled", 3.0), ot = wordEnd(ln, "out", d - 0.1);
    const FP = { X: R.fire.X + 0.05, Y: R.fire.Y + 0.05, Z: R.fire.Z - 0.2 };
    if (u < fa - 0.05) {   // soldier wind-up and fling
      const c = cam(u / (fa - 0.05), [-0.6, 1.3, 3.2], [-0.8, 1.3, 3.7]);
      const tk0 = clamp((u - th) / (fi - th + 0.25)), fl = pulse(u, [fi + 0.15], 0.6);
      const so = act(PW.soldier, c, { X: -1.05, Z: 5.45, fx: -0.5, hold: tk0 < 0.55 ? "paw" : null, throw: tk0, haunted: 0.5, m, paw: { fingers: 0 } }, T);
      const f = clamp((tk0 - 0.5) / 0.4), pawF = tk0 > 0.5 ? PW.paw(c, lerp(-1.3, FP.X, ease(f)), lerp(1.2, FP.Y, ease(f)) + Math.sin(f * Math.PI) * 0.25, lerp(5.2, FP.Z, ease(f)), { fingers: 0, rot: f * 540, size: 1.3, m }, T) : "";
      return parlourScene(T, c, m, { fire: 1 + fl * 0.6 }, [so].map((a) => [a[0], a[1]])) + pawF + (fl > 0.05 ? `<rect width="${W}" height="${H}" fill="#ffb040" opacity="${n(fl * 0.35)}" style="mix-blend-mode:screen"/>` : "");
    }
    const c = cam((u - fa + 0.05) / (d - fa + 0.05), [-0.5, 1.0, 3.3], [-0.65, 0.95, 3.7]);
    const kn = tr([[fa - 0.05, 0], [fa + 0.4, 1]], u), reach = tr([[fa + 0.2, 0], [pl - 0.1, 1], [ot, 0.5]], u), up = tr([[pl, 0], [ot, 1]], u);
    const fa1 = act(PW.whiteFather, c, { X: -0.65, Z: 5.2, fx: -0.6, kneel: kn, reach: up > 0.1 ? 0 : reach, reachTo: [-34, -72], hold: up > 0.05 ? "paw" : null, holdUp: up, paw: { fingers: 0 }, brow: 0.6, wide: 0.5, m }, T);
    const pawFire = up < 0.05 ? PW.paw(c, FP.X, FP.Y, FP.Z, { fingers: 0, rot: 70, size: 1.3, glow: 0.2, m }, T) : "";
    return parlourScene(T, c, m, { fire: 1.1 }, [[5.9, pawFire], [fa1[0], fa1[1]]]);
  } },
  // 7. the father stands, paw up, half smile; the son grinning behind; the mother watching
  { line: "L08", pre: 0.1, hold: 0.05, shot(u, d, T, ln) {
    const m = PW.mood("parlour");
    const set = (c) => {
      const f = act(PW.whiteFather, c, { X: 0.1, Z: 4.9, fx: 0.25, hold: "paw", holdUp: 1, paw: { fingers: 0 }, smile: 0.5, brow: 0.4, talk: tk("F", T), m }, T);
      const so = act(PW.son, c, { X: 0.95, Z: 5.7, fx: -0.4, smile: 1, m }, T), mo = act(PW.whiteMother, c, { X: -0.85, Z: 5.7, fx: 0.5, m }, T);
      return parlourScene(T, c, m, {}, [f, so, mo].map((a) => [a[0], a[1]]));
    };
    const cut = d * 0.62;
    return u < cut ? set(cam(u / cut, [0.05, 1.3, 2.9], [0.05, 1.33, 3.2])) : set(cam((u - cut) / (d - cut), [0.4, 1.2, 1.9], [0.3, 1.2, 2.3]));
  } },
  // 8. the wish: close on the paw (twist, finger, glow), father drops it, "nothing" 2-shot
  { line: "L09", pre: 0.12, hold: 0.2, shot(u, d, T, ln) {
    const tw = wordAt(ln, "twisted", 0.3), sn = wordEnd(ln, "snake", 2.2), nt = wordAt(ln, "nothing", 2.9);
    const k = tr([[tw - 0.1, 0], [tw + 0.3, 1], [sn - 0.2, 1], [sn + 0.5, 0]], u), mm = PW.moodMix(PW.moodMix("parlour", "paw", k), "parlour", 0), m = k > 0 ? PW.moodMix("parlour", "paw", k) : PW.mood("parlour");
    const fing = tr([[tw + 0.2, 0], [tw + 0.7, 1]], u), glow = Math.max(k, pulse(u, [tw + 0.5], 0.5));
    const pawSt = { fingers: fing, twist: k, glow };
    if (u < sn + 0.1) {
      const c = cam(u / (sn + 0.1), [0.3, 1.32, 3.3], [0.28, 1.33, 3.6]);
      const f = act(PW.whiteFather, c, { X: 0.1, Z: 4.9, fx: 0.25, hold: "paw", holdUp: 1, paw: pawSt, pawSize: 1.6, wide: k * 0.8, brow: k, m }, T);
      return parlourScene(T, c, m, { fire: lerp(1, 0.6, k) }, [[f[0], f[1]]]);
    }
    const mP = PW.mood("parlour");
    if (u < nt - 0.1) {   // he drops it: wide
      const c = cam((u - sn - 0.1) / (nt - sn - 0.2), [0.1, 1.2, 0.9], [0.1, 1.2, 1.3]), dr = clamp((u - sn - 0.1) / 0.4);
      const f = act(PW.whiteFather, c, { X: 0.1, Z: 4.9, fx: 0.25, hold: dr < 0.3 ? "paw" : null, holdUp: 1 - dr, paw: { fingers: 1 }, wide: 0.4, m: mP }, T);
      const so = act(PW.son, c, sonSit(mP, { smile: 0.6 }), T), mo = act(PW.whiteMother, c, motherSit(mP), T);
      const pw = dr > 0.3 ? PW.paw(c, lerp(0.35, 0.45, dr), lerp(0.9, 0.03, ease((dr - 0.3) / 0.7, "in")), 4.8, { fingers: 1, rot: 80, lying: 1, size: 1.3, m: mP }, T) : "";
      return parlourScene(T, c, mP, {}, [f, so, mo].map((a) => [a[0], a[1]])) + pw;
    }
    const c = cam((u - nt + 0.1) / (d + 0.3 - nt), [0.7, 1.15, 2.4], [0.62, 1.17, 2.8]);   // father + son, a shrug
    const sh = Math.sin(clamp((u - nt) / 0.5) * Math.PI);
    const f = act(PW.whiteFather, c, { X: 0.1, Z: 4.9, fx: 0.6, tilt: 5 * sh, brow: -0.2, smile: 0.4, lean: -2 * sh, m: mP }, T);
    const so = act(PW.son, c, { X: 1.15, Z: 5.1, fx: -0.6, smile: 1, tilt: -5 * sh, lean: 2 * sh, m: mP }, T);
    return parlourScene(T, c, mP, {}, [f, so].map((a) => [a[0], a[1]])) + PW.paw(c, 0.5, 0.03, 4.8, { fingers: 1, rot: 80, lying: 1, size: 1.3, m: mP }, T);
  } },
  // 9-10. silence: the kid is smug, the keeper says wait
  { line: "L10", pre: 0.45, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.4, 1.0, 2.8], [-0.38, 1.01, 2.95]);
    return atticScene(T, c, { kid: { fx: 0.6, grin: 1, look: 0.9 }, keeper: { flame: 1 }, pawW: { X: -1.5, Y: 0.5, Z: 5.5, st: { fingers: 1, rot: 40 } } });
  } },
  { line: "L11", pre: 0.25, hold: 0.55, shot(u, d, T) {
    const c = cam(u / (d + 0.55), [0.5, 1.0, 2.15], [0.5, 1.02, 2.4]);
    return atticScene(T, c, { kid: { fx: 0.7, grin: 0, shock: 0.3 }, keeper: { flame: tr([[0, 1], [d + 0.5, 0.45]], u), stern: 1 }, glow: tr([[0, 1], [d + 0.5, 0.6]], u) });
  } },
  // 11. the factory gate; "caught" tilts down to the cap
  { line: "L12", pre: 0.15, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("grief"), ca = wordAt(ln, "caught", 2.6) + 0.2, cp = FCAP();
    if (u < ca) return PW.factoryGate(cam(u / ca, [0.0, 1.5, -0.6], [0.1, 1.4, 1.6]), T, m);
    const c = cam((u - ca) / (d - ca + 0.1), [0.12, 1.35, 1.9], [cp.X - 0.05, 0.38, 2.9], "out");
    return PW.factoryGate(c, T, m);
  } },
  // 12. the man from the firm
  { line: "L13", pre: 0.12, hold: 0.1, shot(u, d, T, ln) {
    const m = PW.mood("grief"), wi = wordAt(ln, "wish", 2.3) - 0.1, tw = wordAt(ln, "200", 3.3) - 0.2;
    const mother = (c, o = {}) => act(PW.whiteMother, c, { X: -0.68, Z: 4.35, fx: 0.7, face: 0.0, grief: 1, tears: 0.6, m, ...o }, T);
    const father = (c) => act(PW.whiteFather, c, { X: 0.7, Z: 4.3, fx: -0.7, brow: 1, m }, T);
    const w1 = 0.9;
    if (u < w1) {
      const c = cam(u / w1, [0.0, 1.32, 1.4], [0.02, 1.34, 1.9]);
      const cl = act(PW.clerk, c, { X: 0.05, Z: HL.Z - 0.1, fx: -0.3, hat: 1, nervous: 1, talk: tk("C", T), m }, T);
      return PW.frontDoor(c, T, m, { open: 1, bolt: 1, outside: "grief" }) + byZ([[cl[0], cl[1]], mother(c), father(c)].map((a) => [a[0], a[1]]));
    }
    if (u < tw) {
      const c = cam((u - w1) / (tw - w1), [0.05, 1.45, 3.7], [0.05, 1.45, 3.95]);
      const dn = tr([[wi, 0], [wi + 0.3, 1]], u);
      const cl = act(PW.clerk, c, { X: 0.05, Z: HL.Z - 0.1, fx: -0.2, hat: 1, nervous: 1, tilt: 9 * dn, look: -0.3, talk: tk("C", T), m }, T);
      return PW.frontDoor(c, T, m, { open: 1, bolt: 1, outside: "grief" }) + cl[1];
    }
    const c = cam((u - tw) / (d + 0.1 - tw), [-0.1, 1.3, 3.6], [-0.1, 1.28, 3.9]);
    const cl = act(PW.clerk, c, { X: 0.05, Z: HL.Z - 0.1, fx: -0.1, hat: 0, nervous: 0.8, offer: clamp((u - tw) / 0.35), hold: "envelope", talk: tk("C", T), m }, T);
    return PW.frontDoor(c, T, m, { open: 1, bolt: 1, outside: "grief" }) + cl[1];
  } },
  // 13. "That's... the same money."
  { line: "L14", pre: 0.12, hold: 0, shot(u, d, T) {
    const m = PW.moodMix("attic", "grief", 0.8), c = cam(u / d, [-0.4, 1.0, 2.75], [-0.38, 1.01, 2.9]);
    return atticScene(T, c, { m, kid: { fx: 0.55, shock: 0.8, look: 0.6 }, keeper: { flame: 0.35 }, glow: 0.6 });
  } },
  // 14. the mother takes the paw from the mantel
  { line: "L15", pre: 0.15, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("grief"), gr = wordAt(ln, "grabbed", 1.5) - 0.2;
    const MP = { X: R.mantel.X, Y: R.mantel.Y + 0.01, Z: R.mantel.Z - 0.1 };
    const mo = (c, o) => act(PW.whiteMother, c, { X: -0.95, Z: 5.3, fx: -0.3, grief: 1, tears: 0.3, m, ...o }, T);
    const fa = (c) => act(PW.whiteFather, c, fatherSit(m, { fx: -0.5, brow: 1, smile: -0.5 }), T);
    if (u < gr) {
      const c = cam(u / gr, [-0.6, 1.3, 2.8], [-0.8, 1.3, 3.4]);
      const reach = clamp((u - 0.5) / (gr - 0.5)), a = mo(c, { reach, reachTo: [-30, -148] });
      return parlourScene(T, c, m, { fire: 0, lamp: 0.2 }, [a, fa(c)].map((q) => [q[0], q[1]])) + PW.paw(c, MP.X, MP.Y, MP.Z, { fingers: 0, rot: -70, size: 1.6, m }, T);
    }
    const c = cam((u - gr) / (d - gr + 0.1), [-1.15, 1.3, 4.2], [-1.12, 1.25, 4.5], "out");
    const a = mo(c, { hold: "paw", holdUp: tr([[gr, 0.6], [gr + 0.5, 1]], u), paw: { fingers: 0 }, pawSize: 1.5, reachTo: undefined });
    return parlourScene(T, c, m, { fire: 0, lamp: 0.2 }, [[a[0], a[1]]]);
  } },
  // 15. "Wish him back!"
  { line: "L16", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("grief"), bb = wordAt(ln, "bring", 1.7) - 0.1, fing = tr([[d - 0.8, 1], [d - 0.3, 2]], u), tw = tr([[d - 0.8, 0], [d - 0.5, 1]], u), glow = pulse(u, [d - 0.45], 0.6);
    const pawSt = { fingers: fing, twist: tw, glow };
    const mo = (c, o = {}) => act(PW.whiteMother, c, { X: -1.2, Z: 5.4, fx: 0.5, hold: "paw", holdUp: 1, paw: pawSt, pawSize: 1.4, grief: 1, tears: 1, brow: 0.6, talk: tk("M", T), lean: 3, m, ...o }, T);
    if (u < bb) {
      const c = cam(u / bb, [-1.0, 1.33, 4.2], [-1.05, 1.34, 4.45]);
      return parlourScene(T, c, m, { fire: 0, lamp: 0 }, [mo(c)].map((q) => [q[0], q[1]]));
    }
    const c = cam((u - bb) / (d - bb), [-0.95, 1.3, 3.1], [-0.98, 1.3, 3.6]);
    const fa = act(PW.whiteFather, c, { X: -0.35, Z: 5.45, fx: -0.6, brow: 1, smile: -0.8, reach: 0.4, m }, T);
    return parlourScene(T, c, m, { fire: 0, lamp: 0 }, [mo(c, { lean: 4 }), fa].map((q) => [q[0], q[1]]));
  } },
  // 16-17. the kid hopeful, the keeper very quiet
  { line: "L17", pre: 0.15, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.4, 1.0, 2.75], [-0.38, 1.01, 2.9]);
    return atticScene(T, c, { kid: { fx: 0.55, grin: 0.5, look: 0.8 }, keeper: { flame: 0.55 }, glow: 0.8 });
  } },
  { line: "L18", pre: 0.2, hold: 0.6, shot(u, d, T) {
    const c = cam(u / (d + 0.6), [0.52, 1.0, 2.2], [0.54, 1.01, 2.4]);
    return atticScene(T, c, { kid: { fx: 0.7, shock: 0.4 }, keeper: { flame: tr([[0, 0.5], [d + 0.5, 0.18]], u), stern: 1 }, glow: 0.5 });
  } },
  // 18. the hall: push toward the door; it shakes on "knocked"
  { line: "L19", pre: 0.15, hold: 0, shot(u, d, T, ln) {
    const m = PW.mood("knock"), kn = wordAt(ln, "knocked", d - 1.2) - 0.05;
    return PW.frontDoor(cam(u / d, [0.0, 1.35, 1.2], [0.06, 1.45, 3.0]), T, m, { knock: pulse(u, [kn], 0.5), bolt: 0 });
  } },
  // 19. three knocks, each a hard cut closer to the door (wide, medium, bolt close)
  { line: null, dur: 2.5, pre: 0, hold: 0, shot(u, d, T) {
    const m = PW.mood("knock"), k = u < 0.7 ? 0 : u < 1.4 ? 1 : 2, v = u - k * 0.7, kn = pulse(v, [0.0], 0.45);
    const cs = [[[0, 1.4, 0.4], [0.02, 1.4, 0.7]], [[0.05, 1.4, 2.1], [0.08, 1.42, 2.3]], [[0.28, 1.84, 3.9], [0.28, 1.84, 4.15]]][k];
    return PW.frontDoor(cam(v / 0.7, cs[0], cs[1]), T, m, { knock: kn, bolt: 0 });
  } },
  // 20. the mother at the bolt, the knocks louder and faster
  { line: "L20", pre: 0.0, hold: 0.05, shot(u, d, T, ln) {
    const m = PW.mood("knock"), cut = d * 0.5, bolt = tr([[0.3, 0], [0.8, 0.25], [1.1, 0.15], [1.6, 0.5], [2.0, 0.35], [2.5, 0.6]], u);
    const mo = (c, o = {}) => act(PW.whiteMother, c, { X: 0.14, Z: 4.72, fx: 0.25, up: 1, upX: 6, tiptoe: 1, grief: 1, tears: 1, talk: tk("M", T), m, ...o }, T);
    const kn = pulse(u, [0.0, 0.35, 0.7, 1.0, 1.3, 1.6, 1.9, 2.15, 2.4, 2.65], 0.2) * 0.8;
    const c = u < cut ? cam(u / cut, [0.12, 1.5, 3.35], [0.13, 1.52, 3.6]) : cam((u - cut) / (d - cut), [0.2, 1.8, 3.4], [0.22, 1.82, 3.75]);
    return PW.frontDoor(c, T, m, { knock: kn, bolt }) + mo(c)[1];
  } },
  // 21. the dark parlour: the father crawls, the hand finds the paw, the last wish
  { line: "L21", pre: 0.1, hold: 0.1, shot(u, d, T, ln) {
    const m = PW.mood("knock"), fo = wordAt(ln, "found", 1.7) - 0.05, ls = wordAt(ln, "last", 3.2), PX = 0.42, PZ = 4.86;
    const glow = Math.max(0.0, pulse(u, [ls], 0.7), tr([[ls, 0], [ls + 0.3, 0.7]], u));
    const fing = tr([[ls, 2], [ls + 0.35, 3]], u);
    const pawW = (c) => PW.paw(c, PX, 0.03, PZ, { fingers: fing, glow, rot: 64, size: 1.3, lying: 1, m }, T);
    const fx = (X, o = {}) => ({ X, Z: 4.9, fx: 0.7, crawl: 1, wide: 1, brow: 1, m, ...o });
    if (u < fo) {
      const c = cam(u / fo, [-0.3, 0.75, 2.4], [-0.1, 0.72, 3.0]), X = lerp(-1.1, -0.35, ease(u / fo, "linear"));
      const f = act(PW.whiteFather, c, fx(X, { reach: 0.3 + 0.2 * Math.sin(u * 5) }), T);
      return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1];
    }
    if (u < ls) {
      const c = cam((u - fo) / (ls - fo), [0.1, 0.5, 3.0], [0.25, 0.42, 3.6]);
      const f = act(PW.whiteFather, c, fx(-0.2, { reach: tr([[fo, 0.5], [ls - 0.2, 1]], u), reachTo: [60, -10] }), T);
      return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1];
    }
    const c = cam((u - ls) / (d + 0.1 - ls), [0.3, 0.38, 3.9], [0.36, 0.33, 4.1]);
    const f = act(PW.whiteFather, c, fx(-0.2, { reach: 1, reachTo: [60, -10] }), T);
    return PW.parlour(c, T, m, { fire: 0.1, lamp: 0 }) + pawW(c) + f[1] + (glow > 0.05 ? `<rect width="${W}" height="${H}" fill="#cfe34a" opacity="${n(pulse(u, [ls], 0.25) * 0.25)}" style="mix-blend-mode:screen"/>` : "");
  } },
  // 22. the knocking stops; the door swings open; the road is empty
  { line: "L22", pre: 0.1, hold: 0, shot(u, d, T, ln) {
    const st = wordAt(ln, "stopped", 0.9), sw = wordAt(ln, "swung", 2.5) - 0.1, op = wordAt(ln, "swung", 2.5) + 0.5, rd = wordAt(ln, "road", 4.2) - 0.05;
    if (u < sw) {
      const m = PW.mood("knock");
      return PW.frontDoor(cam(u / sw, [0.04, 1.4, 1.8], [0.06, 1.42, 2.4], "linear"), T, m, { knock: u < st - 0.05 ? pulse(u % 0.35, [0], 0.3) * 0.9 : 0, bolt: 0.2 });
    }
    if (u < rd) {
      const k = tr([[sw, 0], [op, 1]], u), m = PW.moodMix("knock", "road", k);
      return PW.frontDoor(cam((u - sw) / (rd - sw), [0.04, 1.4, 2.3], [0.06, 1.4, 3.0]), T, m, { bolt: 1, chain: 0, open: tr([[sw + 0.1, 0], [op, 1]], u) });
    }
    const m = PW.mood("road");
    return PW.road(cam((u - rd) / (d - rd + 0.05), [0, 1.45, -1.4], [0.08, 1.5, 0.5], "out"), T, m);
  } },
  // 23-25. back in the attic: the hosts' own paw
  { line: "L23", pre: 0.3, hold: 0, shot(u, d, T) {
    const c = cam(u / d, [-0.52, 0.98, 2.8], [-0.5, 1.0, 2.95]);
    return atticScene(T, c, { kid: { fx: 0.5, shock: 0.5, look: 0.5, reachL: 0.9 }, paw: { fingers: 0 }, keeper: { flame: 0.8 } });
  } },
  { line: "L24", pre: 0.15, hold: 0.05, shot(u, d, T) {
    const c = cam(u / d, [0.52, 1.0, 2.25], [0.54, 1.01, 2.45]);
    return atticScene(T, c, { kid: { fx: 0.7, reachL: 0.9 }, paw: { fingers: 0 }, keeper: { flame: 0.7 } });
  } },
  { line: "L25", pre: 0.15, hold: 0.05, shot(u, d, T) {
    const c = cam(u / d, [-0.55, 1.0, 2.9], [-0.55, 1.03, 2.7]);
    return atticScene(T, c, { kid: { fx: -0.7, reachL: 1, look: -0.8, grin: 0.5 }, paw: { fingers: 0, dy: -36, dx: -4, size: 0.95 }, keeper: { flame: 0.7 } });
  } },
  // 26. extreme close: one finger curls
  { line: null, dur: 0.85, pre: 0, hold: 0, shot(u, d, T) {
    const m = PW.mood("attic"), c = cam(u / d, [-0.5, 0.95, 3.4], [-0.5, 0.97, 3.52]);
    const ks = { X: A.kid.X, Z: A.kid.Z, fx: -0.7, reachL: 1 }, h = PW.kidHand(c, ks);
    const f = tr([[0.15, 0], [0.55, 1]], u), glow = pulse(u, [0.45], 0.4);
    const kd = L.kid(c, ks, T);
    return PW.attic(c, T, m, { dust: 0.6 }) + kd.svg + PW.pawAt(h.x - 4, h.y - 22, h.k * 1.9, { rot: -6, fingers: f, glow: glow * 0.6, m }, T) + PW.grade(m, 0.9);
  } },
  // 27. the wrong voice: she drains, close, dead still
  { line: "L26", pre: 0.35, hold: 0, shot(u, d, T) {
    const k = clamp((u + 0.3) / 0.3), m = PW.moodMix("attic", "blank", k), c = cam((u + 0.4) / (d + 0.4), [0.56, 1.02, 2.75], [0.56, 1.02, 2.85]);
    return atticScene(T, c, { m, blank: k, kid: { fx: 0.7, shock: k, look: 0.8, reachL: 0.9 }, paw: { fingers: 1 }, keeper: { fx: -0.45, flame: 1 - 0.6 * k }, glow: 1 - 0.4 * k, dust: 1 - 0.7 * k }) + PW.grade(m, k);
  } },
  // 28. "Grandma?" then the candle goes out
  { line: "L27", pre: 0.15, hold: 0.4, shot(u, d, T) {
    const k = 1, c = cam(u / (d + 0.4), [0.0, 1.0, 2.85], [-0.02, 1.0, 2.75]), m = PW.mood("blank");
    const out = clamp((u - d) / 0.12), cl = 1 - out;
    const turn = tr([[0, 0.7], [0.5, -0.1]], u);
    return atticScene(T, c, { m, blank: 1, kid: { fx: turn, shock: 1, worry: 1, reachL: 0.9 }, paw: { fingers: 1 }, keeper: { fx: -0.5, flame: cl, talk: 0 }, glow: cl, dust: 0.3 * cl }) + PW.grade(m, 1)
      + (out > 0 ? `<rect width="${W}" height="${H}" fill="#02050a" opacity="${n(out * 0.55)}"/>` : "");
  } },
  { black: 0.3 },
];
function FCAP() { return PW.FACTORY.cap; }

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
const ROLE = { G: "G", GX: "GX", K: "K", S: "S", F: "F", M: "M", C: "C" };
function tk(who, time) {
  for (const b of TL) if (b.ln && b.ln.who === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
}
const at = (id) => TL.find((b) => b.line === id);

// ---------------------------------------------------------------- captions: word by word in the upper third, never over faces
const KEY = /^(1902|200|paw|wish|wishes|death|knock|knocked|jacobs)/i;
let capY = 400;
function captions(time, y) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.25, x.end + 0.1));
  if (!b) return "";
  const u = time - b.lineAt, words = b.ln.cap, chunks = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); if (/[.,?!…]$/.test(w[0]) || cur.length >= 4 || i === words.length - 1) { chunks.push(cur); cur = []; } });
  const ch = chunks.find((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] - 0.04 : 1e9)) || chunks[chunks.length - 1];
  const shown = ch.filter((w) => u >= w[1] - 0.04);
  if (!shown.length) return "";
  const txt = shown.map((w) => `<tspan fill="${KEY.test(norm(w[0])) ? "#ffc04a" : "#ffffff"}">${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  return `<text x="540" y="${y}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${n(Math.min(74, 74 * 22 / Math.max(1, shown.map((w) => w[0]).join(" ").length)))}" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
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
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export function prepare(outPath) {
  mkdirSync(OUT, { recursive: true });
  const ins = [], f = [], tags = [];
  const V = 0.72;   // everything sits 3 dB under the knocks (raw = true), which are the loudest sounds in the film
  const add = (file, at0, gain = 1, pre = "", raw = false) => { ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${pre}volume=${gain * (raw ? 1 : V)},adelay=${Math.round(at0 * 1000)}:all=1[a${k}]`); tags.push(`[a${k}]`); };
  const sfx = (p) => `assets/sfx/${p}`, LP5 = "lowpass=f=5000,";
  const cut = (T0) => Math.min(T0, DUR);
  // voices: kid +3 dB
  for (const b of TL) if (b.ln) add(`${VOICE}/${b.ln.id}.wav`, b.lineAt, b.ln.who === "K" ? 1.4 : 1, "aresample=44100,");
  // music cue: a loop trimmed to [s, e] with fades; g = gain
  const music = (bed, s, e, g, fi = 0.5, fo = 0.5, ss = 0) => {
    if (e - s < 0.3) return;
    const file = `${MUS}/${bed}/${bed}-01.ogg`, dur = e - s;
    add(file, s, g, `aloop=loop=-1:size=2e9,atrim=${ss}:${(ss + dur).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=4500,afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, dur - fo).toFixed(2)}:d=${fo},`);
  };
  const gA = 0.74, gB = 0.52, gC = 0.58, gD = 0.54, gE = 0.55;
  const L06 = at("L06"), L09 = at("L09"), L10 = at("L10"), L12 = at("L12"), L13 = at("L13"), L14 = at("L14"), L15 = at("L15"), L16 = at("L16"), L17 = at("L17"), L18 = at("L18"), L19 = at("L19");
  const L21 = at("L21"), L22 = at("L22"), L23 = at("L23"), L24 = at("L24"), L26 = at("L26"), CURL = TL.find((b) => !b.line && b.dur === 0.85), KN = TL.find((b) => !b.line && b.dur === 2.5);
  const dth = L06.lineAt + wordAt(L06.ln, "was", 3.5) ;
  music("paw-a-parlour", 0, dth + 0.8, gA, 0.2, 0.9);                                         // A: attic + parlour, thins under "was for death"
  music("paw-d-door", dth, L06.lineAt + L06.d + 0.2, gD * 0.9, 0.8, 0.6);                      // one cello note on "death"
  const twist = L09.lineAt + wordAt(L09.ln, "twisted", 0.3) - 0.1;
  music("paw-b-wish", twist, L10.lineAt - 0.05, gB, 0.3, 1.1);                                 // paw motif at the twist, decays to silence
  music("paw-b-wish", L12.lineAt, L13.lineAt + wordAt(L13.ln, "give", 3) + 0.4, gB * 0.85, 0.6, 0.8);   // next day: wide notes
  music("paw-d-door", L13.lineAt + wordAt(L13.ln, "give", 3) - 0.2, L14.lineAt + L14.d + 0.4, gD * 0.6, 0.8, 0.6);   // one held note: "200 pounds" + recognition
  music("paw-c-plea", L15.lineAt + wordAt(L15.ln, "grabbed", 1.5), L16.lineAt + L16.d + 0.2, gC, 0.5, 0.5);       // swell on the plea
  music("paw-d-door", L16.lineAt + L16.d - 0.1, L18.lineAt - 0.12, gD * 0.55, 0.4, 0.12, 4);                      // single cello D for "That's good, right?"
  music("paw-d-door", L19.lineAt, L19.lineAt + wordAt(L19.ln, "knocked", 3.5) - 0.25, gD * 0.35, 0.6, 0.15, 8);    // very soft, out before the first knock
  music("paw-d-door", L22.lineAt + wordEnd(L22.ln, "empty", 5.6) + 0.15, L23.lineAt - 0.1, gD * 0.45, 1.0, 0.3, 12);  // faint cello D once the road registers
  music("paw-e-attic", L23.lineAt - 0.25, L24.lineAt + wordAt(L24.ln, "knows", 0.5) + 0.2, gE * 0.7, 0.4, 0.5);      // thin cello, falls away on "knows"
  music("paw-e-attic", CURL.at - 0.2, CURL.end + 0.4, gE * 1.1, 0.25, 0.5, 2);                                       // exposed motif on the curling finger
  // sfx
  const kn = (i, at0, g) => add(sfx(`ai/knock/knock-0${i}.wav`), at0, g, LP5, true);
  const L01 = at("L01"), sl = L01.lineAt + wordEnd(L01.ln, "down", 0.5) + 0.05;
  add(sfx("kenney/impact/impactSoft_medium_000.ogg"), sl, 0.9, LP5);                           // the slap
  add(sfx("ai/flare/flare-01.wav"), L01.lineAt + wordAt(L01.ln, "three", 2) - 0.1, 0.35, LP5);  // flame flares
  const L04 = at("L04"), L07 = at("L07"), L08 = at("L08");
  const fireEnd = L09.lineAt + L09.d + 0.4;
  add(sfx("ai/house-fire/house-fire-02.wav"), L04.lineAt - 0.3, 0.13, `aloop=loop=-1:size=2e9,atrim=0:${(fireEnd - L04.lineAt + 0.3).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=3000,afade=t=in:d=1.2,afade=t=out:st=${(fireEnd - L04.lineAt - 0.6).toFixed(2)}:d=1.0,`);
  add(sfx("kenney/interface/tick_001.ogg"), L04.lineAt, 0.05, `apad=whole_dur=1.2,aloop=loop=-1:size=2e9,atrim=0:${(L09.lineAt + 2.0 - L04.lineAt).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=1800,afade=t=out:st=${(L09.lineAt + 1.2 - L04.lineAt).toFixed(2)}:d=0.8,`);
  add(sfx("ai/flare/flare-01.wav"), L07.lineAt + wordAt(L07.ln, "fire", 1) + 0.2, 0.8, LP5);                // the fire takes it
  add(sfx("kenney/rpg/creak1.ogg"), L09.lineAt + wordAt(L09.ln, "twisted", 0.3) + 0.1, 0.8, LP5);           // dry creak on the twist
  add(sfx("kenney/rpg/creak2.ogg"), L16.lineAt + L16.d - 0.6, 0.6, LP5);                                     // finger 2
  // the knocks: the loudest sounds in the film
  const kb = KN.at;
  kn(4, kb + 0.0, 1.0); kn(5, kb + 0.7, 1.0); kn(6, kb + 1.4, 1.0);
  const L20 = at("L20"), k20 = [0.0, 0.35, 0.7, 1.0, 1.3, 1.6, 1.9, 2.15, 2.4, 2.65];
  k20.forEach((o, i) => kn([1, 2, 3, 7, 8, 4, 5, 6, 1, 2][i], L20.lineAt + o, 1.0));
  const ls = L21.lineAt + wordAt(L21.ln, "wish", 3.5);
  for (let o = L21.lineAt + 0.15, i = 0; o < ls - 0.2; o += 0.52 - 0.04 * i, i++) kn([3, 7, 8, 1, 2, 5, 4, 6][i % 8], o, 1.0);
  add(sfx("ai/flare/flare-01.wav"), L21.lineAt + wordAt(L21.ln, "last", 3.2), 0.3, LP5);       // glow flash
  add(sfx("kenney/rpg/doorOpen_1.ogg"), L22.lineAt + wordAt(L22.ln, "swung", 2.5) - 0.05, 0.55, LP5);
  add(sfx("kenney/rpg/creak3.ogg"), CURL.at + 0.2, 0.7, LP5);                                  // the finger curls
  const L27 = at("L27"), snuffAt = L27.lineAt + L27.d + 0.05;
  add(sfx("ai/snuff/snuff-03.wav"), snuffAt, 0.9, LP5);
  const blk = TL.find((b) => b.black).at;
  const k = ins.length / 2;
  const mixPath = `${OUT}/paw-mix.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + tags.join("") + `amix=inputs=${k}:normalize=0,atrim=0:${blk.toFixed(2)},afade=t=out:st=${(blk - 0.04).toFixed(2)}:d=0.04,apad=whole_dur=${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5:LRA=11,atrim=0:${DUR.toFixed(2)}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/paw-timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +(b.lineAt ?? 0).toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
export const GAIN = 1;
