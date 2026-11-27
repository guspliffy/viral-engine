// Legend: The Golem of Prague, rough draft 1. Built from SHOTS.md (the director's shot list, 27 Nov 2026).
//   TITLE=stone|relief|clay  (default stone = version B; relief = version D)
//   node storyboards/series/legend/golem/render-golem.mjs --out <mp4>
// Timeline = real line lengths (silences inside a take squeezed only where the samples are below -42 dB for the whole cut).
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as G from "../../../../tools/svg2d/lib/legend-golem.mjs";
import { align, phrases } from "../../../../tools/svg2d/lib/captions.mjs";
import { hosts } from "../../../../tools/svg2d/scenes/legend-golem-proof.mjs";
const { lerp, clamp, tr, ease, hash, n } = L;

export const TITLE = process.env.TITLE || "stone";
export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-golem/vo", VEDIT = "out/legend-golem/vo-edit", OUT = "out/legend-golem";
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/golem/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");

// ---------------------------------------------------------------- voices: squeeze silences (verified on the samples), envelopes
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
const THR = 10 ** (-42 / 20) * 32768;   // -42 dBFS in int16 units (RMS of a 10 ms window)
const KEEP_GAP = 0.4, MIN_BEFORE = 0.08, MIN_AFTER = 0.15, WIN = 0.01;
export const CUTLOG = [];
mkdirSync(VEDIT, { recursive: true });
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  const words = JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8"));
  const wn = Math.round(WIN * sr), rms = (i0) => { let a = 0; const e = Math.min(s.length, i0 + wn); for (let j = i0; j < e; j++) a += s[j] * s[j]; return Math.sqrt(a / Math.max(1, e - i0)); };
  // a cut span is allowed only when every 10 ms window of it (and 20 ms around) is below -42 dB
  const quiet = (x, y) => { for (let i = Math.round((x - 0.02) * sr); i < Math.round((y + 0.02) * sr); i += wn) if (rms(Math.max(0, i)) > THR) return false; return true; };
  // sample-based: runs of 10 ms windows below -42 dB (RMS) at least 0.55 s long; the cut leaves 0.2 s after the last voiced sample
  // and 0.2 s before the next one (>= 0.15 / 0.08 required), and the whole removed span is quiet by construction
  const cuts = [], nw = Math.floor(s.length / wn), qv = []; for (let i = 0; i < nw; i++) qv.push(rms(i * wn) < THR);
  for (let i = 0; i < nw;) {
    if (!qv[i]) { i++; continue; }
    let j = i; while (j < nw && qv[j]) j++;
    const rs = i * WIN, re = j * WIN;
    if (i > 0 && j < nw && re - rs >= 0.55) { const len = re - rs - 0.4, c0 = rs + 0.2; cuts.push([c0, c0 + len]); CUTLOG.push(`${ln.id}: cut ${len.toFixed(2)} s at ${c0.toFixed(2)} (quiet run ${(re - rs).toFixed(2)} s, ${(rs).toFixed(2)}-${re.toFixed(2)})`); }
    i = j;
  }
  const segs = []; let a = 0;
  for (const [c0, c1] of cuts) { segs.push([a, c0]); a = c1; }
  segs.push([a, s.length / sr]);
  const out = []; let off = 0; const map = [];
  for (const [x, y] of segs) {
    const i0 = Math.round(x * sr), i1 = Math.min(s.length, Math.round(y * sr)), seg = Int16Array.from(s.subarray(i0, i1)), fd = Math.round(0.012 * sr);
    if (x > 0) for (let i = 0; i < Math.min(fd, seg.length); i++) seg[i] = Math.round(seg[i] * (i / fd));
    if (y < s.length / sr) for (let i = 0; i < Math.min(fd, seg.length); i++) seg[seg.length - 1 - i] = Math.round(seg[seg.length - 1 - i] * (i / fd));
    map.push([x, y, off / sr]); for (const v of seg) out.push(v); off += seg.length;
  }
  const mp = (t) => { for (const [x, y, o] of map) if (t <= y + 1e-6) return o + Math.max(0, t - x); return off / sr; };
  const src = Int16Array.from(out), file = `${VEDIT}/${ln.id}.wav`; writeWav(file, src, sr);
  ln.file = file; ln.words = words.map((w) => [w[0], mp(w[1]), mp(w[2])]); ln.dur = src.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < src.length; i += hop) { let q = 0; for (let j = i; j < Math.min(src.length, i + hop); j++) q += (src[j] / 32768) ** 2; env.push(Math.sqrt(q / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  // captions: the written words on the spoken times; phrases cut at punctuation or after 4 words
  const wr = ln.text.split(/\s+/).filter(Boolean), cw = align(wr, ln.words), parts = []; let cur = 0;
  cw.forEach((w, i) => { cur++; if (/[.,?!…]$/.test(w[0]) || cur >= 4 || i === cw.length - 1) { parts.push(cw.slice(i + 1 - cur, i + 1).map((x) => x[0]).join(" ")); cur = 0; } });
  ln.cw = cw; ln.phr = phrases(cw, ln.text, parts.join("|"));
}
const wordAt = (ln, w, dflt = 0) => { const x = ln.words.find((q) => norm(q[0]).startsWith(w)); return x ? x[1] : dflt; };
const wordEnd = (ln, w, dflt = 0) => { const x = ln.words.find((q) => norm(q[0]).startsWith(w)); return x ? x[2] : dflt; };

// ---------------------------------------------------------------- picture helpers
const S = G.SYN, RV = G.RIVER, LN = G.LANE, HL = G.HALL, AT = G.GATTIC;
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) }; };
const push = (u, a, dz = 0.5, dx = 0, dy = 0) => cam(u, a, { x: a.x + dx, y: a.y + dy, z: a.z + dz }, "lin");
const byZ = (list) => list.filter((a) => a && a[1]).sort((a, b) => b[0] - a[0]).map((a) => a[1]).join("");
const seg = (u, cuts) => { let i = 0; while (i < cuts.length && u >= cuts[i]) i++; const a = i ? cuts[i - 1] : 0, b = i < cuts.length ? cuts[i] : a + 1; return { i, f: clamp((u - a) / Math.max(0.01, b - a)), a, b }; };
const KID = { x: 0.95, y: 1.1, z: 6.15 };
const todayMood = (k = 0) => G.moodMix("friday", "lane", k);
const talk = (who, T) => tk(who, T);
const hosts_ = (c, t, m, ks = {}, gs = {}) => hosts(c, t, m, { talk: talk("K", t), ...ks }, { talk: talk("G", t), ...gs });
const T_ = (c, t, m, ks, gs, extra = "") => G.todaySynagogue(c, t, m) + extra + hosts_(c, t, m, ks, gs);
// the lit window on the synagogue wall (warm glow)
function wallWindow(c, t, k = 1) {
  const f = (X, Y) => L.P(c, X, Y, S.wall - 0.02), X0 = 2.0, X1 = 2.8, Y0 = 1.0, Y1 = 2.5;
  const pts = [f(X0, Y0), f(X1, Y0), f(X1, Y1 - 0.5), f((X0 + X1) / 2, Y1), f(X0, Y1 - 0.5)];
  const q = pts.map((p) => `${n(p.x)},${n(p.y)}`).join(" "), cx = (pts[0].x + pts[1].x) / 2, cy = (pts[0].y + pts[3].y) / 2, r = pts[1].x - pts[0].x;
  const fl = 0.9 + 0.1 * Math.sin(t * 9) * Math.sin(t * 3.1);
  return G.pool(cx, cy, r * 2.4, r * 2.2, "#ffb04a", 0.2 * k * fl, 5, 3, t) + `<polygon points="${q}" fill="#ffd27a" opacity="${n(k * fl)}" stroke="#2a1634" stroke-width="${n(Math.max(2, r * 0.06))}"/><path d="M${n(cx)},${n(pts[3].y)} L${n(cx)},${n(pts[0].y)} M${n(pts[0].x)},${n(cy)} L${n(pts[1].x)},${n(cy)}" stroke="#2a1634" stroke-width="${n(Math.max(1.5, r * 0.04))}"/>`;
}
const dustFall = (c, since) => {   // dust trickling out of the attic door
  if (since < 0) return "";
  const d = S.door, p = L.P(c, d.X, S.Y(d.y0), S.wall - 0.05); let s = "";
  for (let i = 0; i < 26; i++) {
    const a = since - hash(i + 1) * 1.2; if (a < 0 || a > 2.2) continue;
    const x = p.x + (hash(i + 7) - 0.5) * p.s * 0.55 + 6 * Math.sin(a * 3 + i), y = p.y + a * (120 + 160 * hash(i + 3)) * (p.s / 140), r = 3 + 4 * hash(i + 9);
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${i % 3 ? "#d8c4a0" : "#fff1c8"}" opacity="${n(0.9 * clamp(1 - a / 2.2))}"/>`;
  }
  return s;
};
const laneBase = (c, t, m, o = {}) => G.lane(c, t, m, o);
const stepTimes = (t0, t1, rate, off = 0.25) => { const out = []; for (let k = Math.ceil((t0 * rate - off) * 2); k / 2 + off <= t1 * rate; k++) out.push((k / 2 + off) / rate); return out; };

// ---------------------------------------------------------------- the beats (shot(u = s into the line, d = line length, T = absolute time, ln))
const L1 = LINE.L01, TITLE_OUT = 2.6;
const BEATS = [
  // 0/1. the opening wide: the kid in the air for the rung, grandmother pulls him down on DOWN; the title holds to 2.6 s
  { line: "L01", pre: 0.3, holdTo: TITLE_OUT, shot(u, d, T) {
    const dn = wordEnd(L1, "down", 0.55), m = G.mood("friday"), c = push(clamp(T / 2.6), S.CAM.wide, 0.6, 0, -0.1);
    const grabAt = dn - 0.15, back = tr([[dn + 0.1, 0], [dn + 0.5, 1]], u), hop = u < dn + 0.05 ? Math.abs(Math.sin(T * 5.2)) * 34 : 0, grab = tr([[grabAt, 0], [grabAt + 0.25, 1]], u);
    return G.todaySynagogue(c, T, m) + hosts(c, T, m, { up: tr([[0, 1], [grabAt, 1], [dn + 0.25, 0.15]], u), hop, fx: lerp(-0.2, -0.7, back), X: S.kid.X - back * 0.22, shock: back, stretch: hop * 0.2 },
      { grab, X: S.keeper.X + tr([[-0.3, -0.5], [0.7, 0.12]], u), talk: talk("G", T) });
  } },
  // 2. kid looks up, then the tilt up the rungs to the attic door
  { line: "L02", shot(u, d, T) {
    const m = G.mood("friday"), s = seg(u, [d * 0.5]);
    if (s.i === 0) return T_(push(s.f, KID, 0.15), T, m, { fx: -0.6, look: -0.95 }, { fx: 0.7, look: 0.7 });
    return T_(cam(s.f, KID, S.CAM.rungs), T, m, { fx: -0.6, look: -0.95 }, { fx: 0.7 });
  } },
  // 3. grandmother close (the flame shrinks); on "way down" the attic door from below
  { line: "L03", shot(u, d, T, ln) {
    const m = G.mood("friday"), sw = wordAt(ln, "way", d - 0.6) - 0.05;
    if (u < sw) return T_(push(u / sw, S.CAM.keeperClose, 0.2), T, m, { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.6, open: 1, flame: lerp(1, 0.3, u / sw) });
    return T_(push((u - sw) / (d - sw), { x: 1.0, y: 3.2, z: 3.4 }, 0.7, 0, 0.35), T, m, { fx: -0.7 }, { fx: 0.7, flame: 0.3 });
  } },
  // 4. the lane, 1600; shutter slams on "enemies"; townsfolk hurry in; on "nobody" the lane is empty
  { line: "L04", shot(u, d, T, ln) {
    const m = G.mood("lane"), en = wordAt(ln, "enemies", d * 0.6), no = wordAt(ln, "nobody", d * 0.8) - 0.05, s = seg(u, [wordAt(ln, "legend", 3) - 0.05, no]);
    let c_;
    const run = (f0, fn, st0, tgt, z0, z1, delay = 0) => {
      const a = clamp((u - en - delay) / 1.5); if (u < en + delay - 0.01 || a >= 1) return null;
      return [lerp(z0, z1, a), fn(c_, { X: lerp(st0, tgt, a), Z: lerp(z0, z1, a), fx: tgt < st0 ? -0.7 : 0.7, run: u * 2.6 + f0, wide: 0.7, brow: -0.6, m }, T).svg];
    };
    const props = () => [[LN.well.Z, G.well(c_, { m }, T)], [LN.cart.Z, G.cart(c_, { m }, T)]];
    if (s.i === 0) { c_ = push(s.f, LN.CAM.wide, 0.5); return laneBase(c_, T, m, { lamps: 1 }) + byZ(props()); }
    if (s.i === 1) {
      c_ = push(s.f, LN.CAM.wide, 0.4);
      return laneBase(c_, T, m, { lamps: 1 }) + byZ([...props(), run(0, G.townswoman, -0.2, -2.0, 8.5, 5.6), run(0.3, G.baker, 0.6, 2.0, 9.5, 6.6, 0.15), run(0.6, G.boy, -0.9, -2.0, 9.0, 5.6, 0.3)]);
    }
    c_ = push(s.f, LN.CAM.low, 0.5);
    return laneBase(c_, T, m, { lamps: 1 }) + byZ(props());
  } },
  // 5. the river at dawn; the rabbi kneels; he shapes the clay giant (revealed from the left)
  { line: "L05", shot(u, d, T, ln) {
    const m = G.mood("river"), rl = wordAt(ln, "rabbi", 0.5), sh = wordAt(ln, "shaped", 3.2) - 0.05, s = seg(u, [rl - 0.05, sh]);
    const rb = (c, st) => G.rabbi(c, { ...RV.rabbi, fx: 0.7, kneel: 1, m, ...st }, T);
    if (s.i === 0) { const c = cam(s.f, RV.CAM.wide, { x: 0, y: 2.0, z: 1.0 }, "lin"); return G.river(c, T, m) + G.riverMist(c, T, m); }
    if (s.i === 1) { const c = push(s.f, { x: -1.3, y: 1.3, z: 2.4 }, 0.5); return G.river(c, T, m) + rb(c, { look: 0.4 }).svg + G.riverMist(c, T, m); }
    const c = push(s.f, { x: -0.9, y: 1.1, z: 2.9 }, 0.5), reveal = ease(clamp((u - sh) / (d - sh - 0.2)));
    const g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, m }, T), r = rb(c, { shape: 1, shapeTo: [52 + 10 * Math.sin(T * 5), -34 + 6 * Math.sin(T * 4)] });
    const k = g.k || 0.5, gx = g.p ? g.p.x : 540, clip = `<clipPath id="gdr"><rect x="${n(gx - 260 * k - 60)}" y="0" width="${n((520 * k + 120) * reveal)}" height="${H}"/></clipPath>`;
    return G.river(c, T, m) + byZ([[RV.golem.Z, clip + `<g clip-path="url(#gdr)">${g.svg}</g>`], [RV.rabbi.Z, r.svg]]) + G.riverMist(c, T, m);
  } },
  // 6. the slip is held up; it goes into the mouth; EXTREME close on the face: it opens its eyes
  { line: "L06", shot(u, d, T, ln) {
    const m = G.mood("river"), pu = wordAt(ln, "put", 2.6) - 0.05, op = wordAt(ln, "opened", 5) - 0.1, s = seg(u, [pu, op]);
    const aw = tr([[op + 0.05, 0], [op + 0.75, 1]], u);
    if (s.i === 0) {
      const c = push(s.f, { x: -1.35, y: 1.15, z: 3.7 }, 0.4);
      const rb = G.rabbi(c, { X: RV.rabbi.X, Z: RV.rabbi.Z, fx: 0.4, kneel: 1, hold: "slip", holdUp: 1, holdSize: 1.5, brow: 0.2, m }, T);
      const g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: 0, m }, T);
      return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.6);
    }
    const c = s.i === 1 ? push(s.f, { x: -0.55, y: 1.2, z: 2.2 }, 0.4) : push(s.f, { x: -0.45, y: 0.85, z: 4.5 }, 0.35);
    const slipIn = s.i === 1 ? (s.f < 0.5 ? 0 : 1) : 1, g = G.golem(c, { ...RV.golem, pose: "lie", fx: 0.4, awake: aw, look: -0.4, slip: slipIn, m }, T);
    if (s.i === 2) return G.river(c, T, m) + g.svg + G.riverMist(c, T, m, 0.5);
    const rb = G.rabbi(c, { X: RV.rabbi.X - 0.25, Z: RV.rabbi.Z - 0.1, fx: 0.7, kneel: 1, reachAt: g.mouth, hold: slipIn ? null : "slip", m }, T);
    return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z - 0.1, rb.svg]]) + G.riverMist(c, T, m, 0.6);
  } },
  // 7. it sits up; the rule; the sun touches the river; it nods
  { line: "L07", shot(u, d, T, ln) {
    const m = G.mood("river"), sn = wordAt(ln, "sunset", 1.4), ev = wordAt(ln, "even", 4.8) - 0.05, s = seg(u, [sn - 0.4, sn + 0.5, ev]);
    if (s.i === 0) {
      const sit = tr([[0, 0.4], [sn - 0.4, 1]], u), c = push(s.f, { x: -0.5, y: 1.3, z: 2.6 }, 0.4);
      const g = G.golem(c, { ...RV.golem, pose: "lie", sit, fx: 0.4, awake: 1, look: -0.6, slip: 1, m }, T);
      const rb = G.rabbi(c, { X: RV.rabbi.X, Z: RV.rabbi.Z, fx: 0.7, kneel: tr([[0, 1], [0.8, 0]], u), finger: 1, brow: 0.5, talk: talk("R", T), m }, T);
      return G.river(c, T, m) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.5);
    }
    if (s.i === 1) { const mm = G.moodMix("river", "sabbath", 0.5), c = push(s.f, { x: 0, y: 1.9, z: 1.4 }, 0.5); return G.river(c, T, mm, { mist: 0.3 }) + G.riverMist(c, T, mm, 0.4); }
    if (s.i === 2) {
      const c = push((u - s.a) / (ev - s.a), RV.CAM.stand, 0.5);
      const g = G.golem(c, { X: 0.75, Z: 6.6, fx: -0.6, awake: 1, slip: 1, look: -0.8, tilt: -4, m }, T);
      const rb = G.rabbi(c, { X: -1.05, Z: 6.0, fx: 0.7, finger: 1, brow: 0.55, talk: talk("R", T), m }, T);
      return G.river(c, T, m, { mist: 0.6 }) + byZ([[6.6, g.svg], [6.0, rb.svg]]);
    }
    const cc = push((u - s.a) / (d - s.a), { x: 0.5, y: 1.55, z: 3.9 }, 0.3), nod = 9 * Math.sin(clamp((u - ev) / 1.2) * Math.PI * 1.6) * clamp((u - ev) / 0.2);
    const g = G.golem(cc, { X: 0.75, Z: 6.6, fx: -0.6, awake: 1, slip: 1, look: -0.3, tilt: -nod, m }, T);
    return G.river(cc, T, m, { mist: 0.5 }) + g.svg;
  } },
  // 8. the golem guards the lane at night; it carries the whole well ring home
  { line: "L08", shot(u, d, T, ln) {
    const m = G.mood("lane"), fw = wordAt(ln, "fetched", 2.7) - 0.05, s = seg(u, [fw]), ph = T * 0.45;
    if (s.i === 0) {
      const c = push(s.f, LN.CAM.golem, 0.4), z = lerp(10.6, 8.6, s.f);
      const g = G.golem(c, { X: lerp(0.9, 0.2, s.f), Z: z, fx: -0.4, walk: ph, awake: 1, slip: 1, m }, T);
      return laneBase(c, T, m) + byZ([[LN.well.Z, G.well(c, { m }, T)], [z, g.svg]]);
    }
    const f = s.f, c = push(f, LN.CAM.golem, 0.5), z = lerp(8.6, 7.6, f);
    const g = G.golem(c, { X: lerp(0.5, 0.2, f), Z: z, fx: -0.5, walk: ph, carry: 1, awake: 1, slip: 1, m }, T);
    const bk = G.baker(c, { X: -1.25, Z: 5.4, fx: 0.7, wide: 0.8, brow: -0.5, hold: "loaf", m }, T), by = G.boy(c, { X: -0.75, Z: 5.1, fx: 0.6, wide: 0.6, smile: 0.8, point: 1, m }, T);
    return laneBase(c, T, m) + byZ([[LN.well.Z, G.well(c, { m, gone: 1 }, T)], [z, g.svg], [LN.cart.Z, G.cart(c, { m, X: 1.2, Z: 5.9 }, T)], [5.4, bk.svg], [5.1, by.svg]]);
  } },
  { line: "L09", shot(u, d, T) { return T_(push(u / d, KID, 0.2), T, G.mood("friday"), { fx: -0.7, grin: 1, look: 0.2 }, { fx: 0.7 }); } },
  { line: "L10", shot(u, d, T) { return T_(push(u / d, S.CAM.keeperClose, 0.15), T, G.mood("friday"), { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.7, open: 1, flame: 0.9 }); } },
  // 11. the Fridays: the rabbi takes the slip out, the golem sits and its eyes close; three times, different light
  { line: "L11", shot(u, d, T) {
    const s = seg(u, [d / 3, 2 * d / 3]), k = [0.15, 0.55, 1][s.i], m = G.moodMix("river", "sabbath", k), f = s.f;
    const c = push(f, [{ x: -0.3, y: 1.4, z: 1.6 }, { x: 0.3, y: 1.3, z: 1.9 }, { x: -0.6, y: 1.5, z: 1.4 }][s.i], 0.3, 0.1 * (s.i - 1));
    const out = clamp((f - 0.15) / 0.5), g = G.golem(c, { ...RV.golem, pose: "lie", sit: 1, fx: 0.4, awake: 1 - out, slip: out < 0.5 ? 1 : 0, m, look: -0.4 }, T);
    const rb = G.rabbi(c, { X: RV.rabbi.X + 0.05 * s.i, Z: RV.rabbi.Z, fx: 0.7, reachAt: out < 0.8 ? g.mouth : null, hold: out > 0.45 ? "slip" : null, tiptoe: 1 - out, brow: 0.1, m }, T);
    return G.river(c, T, m, { mist: 0.4 }) + byZ([[RV.golem.Z, g.svg], [RV.rabbi.Z, rb.svg]]) + G.riverMist(c, T, m, 0.3);
  } },
  { line: "L12", shot(u, d, T) { return T_(push(u / d, KID, 0.18), T, G.mood("friday"), { fx: -0.7, look: 0.3 }, { fx: 0.7 }); } },
  // 13. grandmother, very still, candle tiny; holds 0.5 s afterwards
  { line: "L13", hold: 0.5, shot(u, d, T) { return T_(push(u / (d + 0.5), S.CAM.keeperClose, 0.12), T, G.mood("friday"), { fx: -0.7 }, { fx: 0.7, look: 0.8, stern: 0.9, open: 1, flame: 0.18 }); } },
  // 14. the sun goes down behind the roofs; the song; the golem in the dark lane, its eyes opening wider
  { line: "L14", shot(u, d, T, ln) {
    const sg = wordAt(ln, "sabbath", 2.8) - 0.1, wd = wordAt(ln, "word", 5.6) - 0.1, s = seg(u, [sg, wd]);
    if (s.i === 0) {
      const mm = G.moodMix("sabbath", "lane", ease(clamp(u / (sg * 0.85)))), c = push(s.f, LN.CAM.wide, 0.5);
      return laneBase(c, T, mm, { lamps: lerp(0.2, 1, s.f) }) + G.well(c, { m: mm, gone: 1 }, T);
    }
    if (s.i === 1) {
      const m = G.mood("sabbath"), c = cam(s.f, HL.CAM.wide, { x: 0.1, y: 1.8, z: 1.3 });
      const rb = G.rabbi(c, { ...HL.rabbi, fx: 0.1, book: 1, talk: 0.3, m }, T);
      return G.synagogueInside(c, T, m, { door: 0 }) + rb.svg + G.bimahFront(c, m) + G.worshippers(c, T, { m });
    }
    const m = G.mood("lane"), c = push(s.f, { x: 0.1, y: 1.7, z: 2.2 }, 0.5), g = G.golem(c, { X: 0.1, Z: 7.6, fx: -0.3, awake: lerp(0.3, 1, s.f), anger: s.f * 0.5, slip: 1, look: -0.3, m }, T);
    return laneBase(c, T, m, { lamps: 0.7 }) + g.svg;
  } },
  // 15. "Rabbi! The giant!"
  { line: "L15", shot(u, d, T) {
    const k = tr([[0, 0], [0.35, 1]], u), m = G.mood("sabbath"), c = cam(u / d, HL.CAM.wide, { x: 0.7, y: 1.7, z: 2.6 });
    const rb = G.rabbi(c, { ...HL.rabbi, fx: lerp(-0.2, 0.6, k), book: 1 - k, wide: k, brow: -0.5 * k, m }, T);
    const wm = G.townswoman(c, { X: HL.woman.X - 0.75 * ease(k), Z: HL.woman.Z - 3.6 * ease(k), fx: -0.5, run: k < 1 ? k * 2.5 + T : null, point: k >= 1 ? 1 : 0, wide: 1, brow: -0.7, talk: talk("W", T), m }, T);
    return G.synagogueInside(c, T, m, { door: k }) + rb.svg + G.bimahFront(c, m) + wm.svg + G.worshippers(c, T, { m, turn: k, rows: HL.pews.filter(([X, Z]) => !(X > 0 && X < 2 && Z < 8)) });
  } },
  // 16. the rampage: four fast cuts
  { line: "L16", shot(u, d, T, ln) {
    const m = G.mood("rampage"), s = seg(u, [wordAt(ln, "doors", 1.4) - 0.05, wordAt(ln, "carts", 2.6) - 0.05, wordAt(ln, "and", 3.7) - 0.05]), gr = clamp(u / d);
    const folks = (c, a) => { const bk = G.baker(c, { X: lerp(-0.6, -1.3, a), Z: lerp(6.0, 4.6, a), fx: -0.7, run: T * 2.6, wide: 1, brow: -0.8, talk: 1, m }, T), by = G.boy(c, { X: lerp(0.9, 1.35, a), Z: lerp(5.6, 4.2, a), fx: 0.7, run: T * 2.8 + 0.3, wide: 1, brow: -0.8, up: 1, talk: 1, m }, T); return [[lerp(6.0, 4.6, a), bk.svg], [lerp(5.6, 4.2, a), by.svg]]; };
    if (s.i === 0) { const c = push(s.f, LN.CAM.wide, 0.6, 0, 0.1), g = G.golem(c, { X: 0.25, Z: lerp(10.4, 8.0, s.f), fx: -0.6, walk: T * 0.7, grow: gr * 0.4, anger: 1, awake: 1, slip: 1, look: -0.6, m }, T);
      return laneBase(c, T, m, { wreck: 0.4, lamps: 0.7 }) + byZ([[8, g.svg], ...folks(c, s.f)]); }
    if (s.i === 1) { const c = push(s.f, { x: -1.2, y: 1.4, z: 2.2 }, 0.4), g = G.golem(c, { X: -0.75, Z: 5.4, fx: -0.8, smash: clamp(s.f * 1.3), grow: gr * 0.6, anger: 1, awake: 1, slip: 1, m }, T);
      return laneBase(c, T, m, { doors: [tr([[0.35, 0], [0.7, 1]], s.f), 0, 0, 0], wreck: 0.8, lamps: 0.7 }) + g.svg; }
    if (s.i === 2) { const c = push(s.f, LN.CAM.low, 0.3), a = s.f;
      const ct = G.cart(c, { m, X: lerp(-1.4, 1.6, a), Y: 0.2 + 3.2 * Math.sin(a * Math.PI), Z: 6.2, rot: -40 - a * 300, spin: T * 300, broken: a, load: 0 }, T);
      const g = G.golem(c, { X: 0.2, Z: 9.5, fx: -0.6, grow: gr * 0.7, smash: 0.8, anger: 1, awake: 1, slip: 1, m }, T);
      return laneBase(c, T, m, { doors: [1, 1, 0, 0], wreck: 1, lamps: 0.7 }) + byZ([[9.5, g.svg], [6.2, ct]]); }
    const c = push(s.f, LN.CAM.low, 0.4, 0, 0.1), z = lerp(9.5, 6.6, s.f), g = G.golem(c, { X: lerp(0.2, 0.0, s.f), Z: z, fx: -0.1, walk: T * 0.9, grow: lerp(0.7, 1, s.f), anger: 1, awake: 1, slip: 1, m }, T);
    return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + byZ([[z, g.svg], ...folks(c, 1 - (1 - s.f) * 0.5)]);
  } },
  // 17. the rabbi runs out, the golem bends, he reaches into its mouth; extreme close: the slip comes out (then 0.4 s of silence)
  { line: "L17", hold: 0.4, shot(u, d, T, ln) {
    const m = G.mood("rampage"), rc = wordAt(ln, "reached", 2.3) - 0.05, pl = wordAt(ln, "pulled", 3.8) - 0.15, s = seg(u, [rc, pl]);
    if (s.i === 0) {
      const c = push(s.f, { x: 0.3, y: 1.5, z: 1.8 }, 0.6), a = s.f, z = lerp(4.5, 7.1, a);
      const g = G.golem(c, { X: 0.8, Z: 8.0, fx: -0.6, grow: 1, anger: 1, awake: 1, slip: 1, m }, T);
      const rb = G.rabbi(c, { X: lerp(-1.6, -0.9, a), Z: z, fx: 0.7, run: T * 2.4, wide: 0.5, brow: 0.6, m }, T);
      return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + byZ([[8, g.svg], [z, rb.svg]]);
    }
    const out = tr([[pl, 0], [pl + 0.28, 1]], u), c = s.i === 1 ? push(s.f, { x: 0.1, y: 1.45, z: 3.0 }, 0.4) : push(s.f, { x: -0.1, y: 2.0, z: 4.6 }, 0.25);
    const g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, bend: s.i === 1 ? lerp(0.6, 1, s.f) : 1, anger: 1 - out * 0.6, awake: 1 - out * 0.4, slip: out > 0.05 ? 0 : 1, look: -0.7, m }, T);
    const at = { x: g.mouth.x - 140 * out, y: g.mouth.y + 170 * out };
    const rb = G.rabbi(c, { X: -1.0, Z: 7.1, fx: 0.7, reachAt: at, tiptoe: 1 - out, hold: out > 0.05 ? "slip" : null, holdSize: 1.5, brow: 0.6, wide: 0.3, m }, T);
    const scene = laneBase(c, T, m, { doors: 1, wreck: 1, lamps: 0.6 }) + byZ([[7.4, g.svg], [7.1, rb.svg]]);
    if (s.i < 2) return scene;
    // EXTREME close: the whole picture scaled about the mouth / the slip (a screen-space push-in)
    const zm = lerp(1.9, 2.3, s.f), cx = (g.mouth.x + at.x) / 2, cy = (g.mouth.y + at.y) / 2;
    return `<g transform="translate(${n(540 - cx * zm)},${n(1190 - cy * zm)}) scale(${zm.toFixed(3)})">${scene}</g>`;
  } },
  // 18. it falls apart into a pile of clay
  { line: "L18", shot(u, d, T) {
    const k = tr([[0.4, 0], [d, 1]], u), m = G.moodMix("rampage", "lane", k), c = push(u / d, { x: 0.1, y: 1.4, z: 1.8 }, 0.5);
    const g = G.golem(c, { X: 0.7, Z: 7.4, fx: -0.6, grow: 1, crumble: tr([[0.1, 0], [d * 0.85, 1]], u), awake: 0.2, slip: 0, m }, T);
    const rb = G.rabbi(c, { X: -0.95, Z: 7.1, fx: 0.7, hold: "slip", holdUp: 0.3, holdSize: 1.5, brow: 0.2, smile: -0.4, m }, T);
    return laneBase(c, T, m, { doors: 1, wreck: 1, lamps: lerp(0.6, 1, k) }) + byZ([[7.4, g.svg], [7.1, rb.svg]]);
  } },
  // 19. the attic with the clay pile; the stairs are gone: the wall with its rungs starting high, tilting up
  { line: "L19", shot(u, d, T, ln) {
    const st = wordAt(ln, "took", 2.5) - 0.05, s = seg(u, [st]);
    if (s.i === 0) { const m = G.mood("attic"), c = push(s.f, AT.CAM.wide, 0.7); return G.golemAttic(c, T, m) + G.clayPile(c, { m, dry: 0.1 }); }
    return G.todaySynagogue(cam(s.f, { x: 1.0, y: 1.2, z: 3.6 }, { x: 1.0, y: 3.4, z: 3.6 }, "lin"), T, todayMood(0.55));
  } },
  // 20. the reporter climbs up; only dust
  { line: "L20", shot(u, d, T, ln) {
    const od = wordAt(ln, "only", 3.3) - 0.2, s = seg(u, [od]);
    if (s.i === 0) {
      const m = G.mood("attic"), c = cam(s.f, AT.CAM.wide, { x: -0.3, y: 1.3, z: 1.5 }), cl = clamp((u - 0.4) / 2.0);
      const rp = G.reporter(c, { X: AT.reporter.X, Y: lerp(-0.85, 0, ease(cl)), Z: AT.reporter.Z, fx: 0.6, climb: cl < 1 ? T * 1.6 : null, hold: "lantern", holdUp: 0.9, hold2: "notebook", brow: -0.3, m }, T);
      const clip = `<clipPath id="hatchclip"><rect x="0" y="0" width="1080" height="${n(L.P(c, AT.hatch.X, 0, AT.hatch.Z - 0.4).y)}"/></clipPath>`;
      return G.golemAttic(c, T, m, { hatch: 1 }) + G.clayPile(c, { m, dry: 0.75, k: 0.9 }) + G.atticLadder(c, m) + clip + `<g clip-path="url(#hatchclip)">${rp.svg}</g>` + G.lanternPool(rp.held, m, 1, T);
    }
    const m = G.moodMix("attic", "dust", 0.7), c = push(s.f, AT.CAM.pile, 0.5, 0, 0.05);
    return G.golemAttic(c, T, m, { hatch: 1 }) + G.clayPile(c, { m, dry: 1, k: 0.9 }) + G.lanternPool({ x: 380, y: 1000 }, m, 1, T, 600) + G.dust(T, m, { x: 540, y: 1000 }, { n: 60, r: 600 });
  } },
  { line: "L21", shot(u, d, T) { return T_(push(u / d, KID, 0.15), T, todayMood(0.4), { fx: -0.6, look: -0.9 }, { fx: 0.7, look: 0.7 }); } },
  // 22. grandmother; "twice": the window; "Every Friday": both small in the wide, looking up
  { line: "L22", hold: 0, shot(u, d, T, ln) {
    const m = todayMood(0.4), tw = wordAt(ln, "twice", 2.7) - 0.05, ef = wordAt(ln, "every", 3.9) - 0.08, s = seg(u, [tw, ef]);
    if (s.i === 0) return T_(push(s.f, S.CAM.keeperClose, 0.15), T, m, { fx: -0.7 }, { fx: 0.7, look: 1, stern: 0.2, open: 1, flame: 0.6 });
    if (s.i === 1) { const c = push(s.f, { x: 2.2, y: 1.7, z: 3.4 }, 0.5, 0.2); return G.todaySynagogue(c, T, m) + wallWindow(c, T, 1); }
    const c = push(clamp((u - ef) / 1.4), S.CAM.wide, 0.3, 0, -0.1);
    return G.todaySynagogue(c, T, m) + wallWindow(c, T, 1) + hosts(c, T, m, { fx: -0.3, look: -1, talk: 0 }, { fx: 0.3, look: -1, talk: 0 });
  } },
  // 23. the tail: a beat, the psalm from the window, 1.6 s in the thud, dust, flinch, hard cut 0.35 s later
  { id: "TAIL", dur: 0.5 + 1.6 + 0.35, shot(u, d, T) {
    const m = todayMood(0.4), th = 2.1, c = push(clamp((u + 1.2) / 3.6), S.CAM.wide, 0.35, 0, -0.1), fl = clamp((u - th) / 0.15) * (1 - clamp((u - th - 0.5) / 0.4) * 0.6);
    return G.todaySynagogue(c, T, m) + wallWindow(c, T, 1) + dustFall(c, u - th) + hosts(c, T, m, { fx: -0.3, look: -1, shock: fl * 0.9, hop: fl * 7, talk: 0 }, { fx: 0.3, look: -1, talk: 0, flame: 0.8 - fl * 0.5 });
  } },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur, st = t + (b.pre || 0);
  let hold = b.hold ?? (ln ? 0.15 : 0); if (b.holdTo) hold = Math.max(0, b.holdTo - st - d);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + hold });
  t = st + d + hold;
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
const at = (id) => TL.find((b) => b.line === id || b.id === id);
function tk(who, time) {
  for (const b of TL) if (b.ln && b.ln.who === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
}

// ---------------------------------------------------------------- captions (y 560, Inter 900, whole phrase fixed, each word shown from its own start)
const KEY = /^(down|golem|friday|twice|giant)$/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < x.lineAt + x.d + 0.25);
  if (!b) return "";
  const u = time - b.lineAt, phr = b.ln.phr; let pi = -1;
  for (let i = 0; i < phr.length; i++) if (u >= phr[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  const ch = phr[pi].ws, len = (ws) => ws.reduce((a, w) => a + w[0].length + 1, -1);
  let k = ch.length;
  if (len(ch) > 19 && ch.length > 1) { let best = 1e9; for (let i = 1; i < ch.length; i++) { const dd = Math.abs(len(ch.slice(0, i)) - len(ch.slice(i))); if (dd < best) { best = dd; k = i; } } }
  const rows = k < ch.length ? [ch.slice(0, k), ch.slice(k)] : [ch];
  const fs = Math.min(74, Math.round(940 / Math.max(1, Math.max(...rows.map(len)) * 0.6)));
  return rows.map((r, i) => `<text x="540" y="${n(560 + (i - (rows.length - 1) / 2) * fs * 1.08)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fs}" stroke="#120c24" stroke-width="${Math.round(fs * 0.19)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${r.map((w) => {
    const show = u >= w[1] - 0.04, key = KEY.test(w[0].replace(/[^a-z]/gi, ""));
    return `<tspan fill="${key ? "#ffc04a" : "#ffffff"}"${show ? "" : ` fill-opacity="0" stroke-opacity="0"`}>${w[0].replace(/&/g, "&amp;")}</tspan>`;
  }).join(" ")}</text>`).join("");
}

// ---------------------------------------------------------------- one frame
const TITLE_DY = { stone: 20, clay: 14, relief: 45 };   // keeps every title's top edge at y >= 640
export function draw(time) {
  L.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = time - b.lineAt, body = b.shot(Math.max(u, -0.5), b.d, time, b.ln);
  const title = time < 2.7 ? `<g transform="translate(0,${TITLE_DY[TITLE] ?? 20})">${G.titleCard(time, { style: TITLE })}</g>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs("night")}${body}${L.vignette()}${title}${captions(time)}</svg>`;
}
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export const SHEET = TL.map((b) => +(b.lineAt + (b.d || 0) * 0.5).toFixed(2));   // one frame per shot, for the contact sheet

// ---------------------------------------------------------------- the sound mix
const MUSIC_DIR = `${OUT}/music`, SFX_DIR = `${OUT}/sfx`, MISSING = [];
function best(dir, id) {   // top-ranked take of an id (CLAP rank in sg-raw/report.json), else the first file found
  const files = [];
  if (existsSync(`${dir}/${id}`)) files.push(...readdirSync(`${dir}/${id}`).filter((f) => /\.(wav|ogg|mp3|flac)$/i.test(f)).map((f) => `${dir}/${id}/${f}`));
  if (existsSync(dir)) files.push(...readdirSync(dir).filter((f) => f.startsWith(id) && /\.(wav|ogg|mp3|flac)$/i.test(f)).map((f) => `${dir}/${f}`));
  if (!files.length) return null;
  let rank = {}; try { rank = JSON.parse(readFileSync(`${OUT}/sg-raw/report.json`, "utf8")); } catch (e) {}
  const score = (f) => { const e = (rank[id] && (rank[id].ranked || rank[id].rank || rank[id])) || null; if (Array.isArray(e)) { const i = e.findIndex((x) => f.includes((x.file || x.take || x.name || x).toString().replace(/\.wav$/, "").split("/").pop())); return i < 0 ? -1 : 1000 - i; } return 0; };
  files.sort((a, b) => score(b) - score(a) || (a < b ? -1 : 1));
  return files[0];
}
export function prepare() {
  mkdirSync(OUT, { recursive: true }); MISSING.length = 0;
  const Sx = { ins: [], f: [], tags: [] };
  const add = (file, at0, gain = 1, pre = "") => { if (!file) return; Sx.ins.push("-i", file); const k = Sx.ins.length / 2 - 1; Sx.f.push(`[${k}:a]aresample=44100,${pre}volume=${gain},adelay=${Math.round(Math.max(0, at0) * 1000)}:all=1[a${k}]`); Sx.tags.push(`[a${k}]`); };
  const mus = (id, s, e, g, fi = 0.5, fo = 0.5, ss = 0, pre = "") => {
    const dur = e - s; if (dur < 0.3) return; const f = best(MUSIC_DIR, id); if (!f) { MISSING.push("music " + id); return; }
    add(f, s, g, `aloop=loop=-1:size=2e9,atrim=${ss}:${(ss + dur).toFixed(2)},asetpts=PTS-STARTPTS,${pre}afade=t=in:d=${fi},afade=t=out:st=${Math.max(0, dur - fo).toFixed(2)}:d=${fo},`);
  };
  const sfx = (id, at0, g = 1, pre = "") => { const f = best(SFX_DIR, id); if (!f) { MISSING.push("sfx " + id); return; } add(f, at0, g, pre); };
  const lib = (p, at0, g = 1, pre = "") => add(`assets/sfx/${p}`, at0, g, pre);
  for (const b of TL) if (b.ln) add(b.ln.file, b.lineAt, b.ln.who === "K" ? 1.35 : 1);
  const A = (id) => at(id), line = (id) => A(id).lineAt, lend = (id) => A(id).lineAt + A(id).d, w = (id, wd, df = 0) => line(id) + wordAt(LINE[id], wd, df), we = (id, wd, df = 0) => line(id) + wordEnd(LINE[id], wd, df);
  const MG = 0.45;   // music vs voice
  mus("golem-a-dusk", 0, we("L03", "way", lend("L03") - 0.3) + 0.4, MG, 0.1, 0.5);
  mus("golem-b-clay", line("L04"), w("L07", "even", lend("L07")) - 0.1, MG, 0.8, 0.6);
  mus("golem-c-guard", line("L08"), lend("L09") + 0.1, MG * 0.95, 0.5, 0.35);
  mus("golem-b-clay", line("L11"), lend("L11") + 0.2, MG * 0.6, 0.6, 0.6, 8);
  mus("golem-a-dusk", line("L12"), line("L13") + 0.12, MG * 0.5, 0.3, 0.12, 6);
  mus("golem-f-psalm", w("L14", "sabbath", 2.8) - 0.05, line("L15") + 0.04, MG * 1.05, 0.3, 0.04, 0, "lowpass=f=3500,aecho=0.7:0.5:90:0.25,");
  mus("golem-d-rampage", line("L16"), lend("L17") - 0.04, MG, 0.15, 0.05);
  mus("golem-e-attic", line("L19"), line("L21") + 0.12, MG * 0.8, 0.8, 0.12);
  const tail = A("TAIL").at, thud = tail + 0.5 + 1.6;
  mus("golem-f-psalm", tail + 0.5, A("TAIL").end, MG, 0.15, 0.02, 0, "lowpass=f=1300,aecho=0.8:0.6:110|230:0.35|0.2,");
  const dn = we("L01", "down", 0.55);
  lib("kenney/impact/footstep_concrete_001.ogg", 0.12, 0.5, "lowpass=f=4000,");
  lib("kenney/rpg/cloth1.ogg", dn - 0.12, 0.7); lib("kenney/impact/footstep_concrete_002.ogg", dn + 0.45, 0.55);
  lib("kenney/rpg/doorClose_2.ogg", w("L04", "enemies", 4.8) - 0.1, 0.55, "lowpass=f=5000,");
  lib("kenney/rpg/doorClose_4.ogg", w("L04", "enemies", 4.8) + 0.25, 0.4, "lowpass=f=5000,");
  for (const ts of [0.1, 0.45, 0.8, 1.2]) sfx("golem-clay-squelch", w("L05", "shaped", 3.2) + ts, 0.8);
  for (const tt of stepTimes(line("L08") + 0.3, lend("L08"), 0.45)) sfx("golem-step", tt, 0.45);
  lib("kenney/rpg/doorClose_1.ogg", line("L15") + 0.02, 0.9);
  lib("kenney/impact/impactSoft_medium_003.ogg", line("L15") + 0.02, 0.5);
  sfx("golem-door-split", w("L16", "doors", 1.5) - 0.2, 1.0);
  sfx("golem-cart-crash", w("L16", "carts", 2.6) + 0.1, 1.0);
  for (const tt of [0.3, 0.75, 1.2, 1.65, 4.1, 4.6, 5.0]) sfx("golem-step", line("L16") + tt, 0.9);
  sfx("golem-crumble", lend("L17") + 0.4, 1.0);
  sfx("golem-attic-thud", thud, 1.0);
  { const f = `assets/sfx/ai/storm-wind/storm-wind-01.wav`, s0 = line("L13") + A("L13").d * 0.5, e0 = line("L14") + 1.5;   // street tone for the L13 hold
    if (existsSync(f)) add(f, s0, 0.2, `aloop=loop=-1:size=2e9,atrim=0:${(e0 - s0).toFixed(2)},asetpts=PTS-STARTPTS,lowpass=f=1500,afade=t=in:d=0.3,afade=t=out:st=${(e0 - s0 - 0.8).toFixed(2)}:d=0.8,`); }
  // the beds end at the line end, so nothing but silence plays for the 0.4 s after "the word" (music + ambience killed)
  const mixPath = `${OUT}/golem-mix.wav`, end = `apad=whole_dur=${DUR.toFixed(3)},atrim=0:${DUR.toFixed(3)}`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...Sx.ins, "-filter_complex", Sx.f.join(";") + ";" + Sx.tags.join("") + `amix=inputs=${Sx.tags.length}:normalize=0,${end},loudnorm=I=-16:TP=-3:LRA=11,alimiter=limit=0.89:level=disabled:attack=1:release=30,${end}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath], { maxBuffer: 1 << 26 });
  writeFileSync(`${OUT}/golem-timeline.json`, JSON.stringify({ title: TITLE, missing: MISSING, cuts: CUTLOG, beats: TL.map((b) => ({ line: b.line || b.id, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })) }, null, 1));
  return mixPath;
}
export const GAIN = 1;
export const NOFADE = true;
