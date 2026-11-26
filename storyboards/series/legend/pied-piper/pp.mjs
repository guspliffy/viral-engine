// Legend: The Pied Piper of Hamelin, rough draft (builder pass, 26 Nov 2026). Shot list: SHOTS.md. Lines: lines.json, read by
// tools/svg2d/read-lines.py + post.py into out/legend-pp/vo. The timeline is built from the real wav lengths, so a replaced
// take (L02, L09, L23) re-times the cut. Designs: tools/svg2d/lib/legend-hamelin.mjs (HM) + legend.mjs hosts (L).
//   node tools/svg2d/render.mjs storyboards/series/legend/pied-piper/pp.mjs out/legend-pp/pp-draft.mp4
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as HM from "../../../../tools/svg2d/lib/legend-hamelin.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-pp/vo", OUT = "out/legend-pp", SPEC = JSON.parse(readFileSync("storyboards/series/legend/pied-piper/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
// the written words, timed by longest-common-subsequence against Whisper's words (Whisper writes "500", "1284", "26th", splits "grown-ups")
function alignWords(text, wh) {
  const A = text.split(/\s+/).filter(Boolean), a = A.map(norm), b = wh.map((w) => norm(w[0]));
  const R = a.length, C = b.length, dp = Array.from({ length: R + 1 }, () => new Int16Array(C + 1));
  for (let i = R - 1; i >= 0; i--) for (let j = C - 1; j >= 0; j--) dp[i][j] = a[i] && a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const match = new Array(R).fill(-1); let i = 0, j = 0;
  while (i < R && j < C) { if (a[i] && a[i] === b[j]) { match[i] = j; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
  const out = new Array(R); let ai = 0, wj = 0;   // gaps: spread the unmatched written words over the unmatched Whisper span
  const total = wh.length ? wh[wh.length - 1][2] : 0;
  while (ai < R) {
    if (match[ai] >= 0) { const w = wh[match[ai]]; out[ai] = [A[ai], w[1], w[2]]; wj = match[ai] + 1; ai++; continue; }
    let ae = ai; while (ae < R && match[ae] < 0) ae++;
    const we = ae < R ? match[ae] : C, t0 = wj < C ? wh[wj][1] : total, t1 = we > wj ? wh[we - 1][2] : (we < C ? wh[we][1] : total), cnt = ae - ai;
    for (let k = 0; k < cnt; k++) out[ai + k] = [A[ai + k], lerp(t0, Math.max(t0, t1), k / cnt), lerp(t0, Math.max(t0, t1), (k + 1) / cnt)];
    ai = ae; wj = we;
  }
  return out;
}
for (const ln of Object.values(LINE)) {
  if (!existsSync(`${VOICE}/${ln.id}.wav`)) { ln.dur = 0.6 + ln.text.split(" ").length * 0.36; ln.env = []; ln.words = []; ln.cap = []; continue; }
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = existsSync(`${VOICE}/${ln.id}.words.json`) ? JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8")) : [];
  ln.cap = ln.words.length ? alignWords(ln.text, ln.words) : [];
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => norm(x[0]).startsWith(word)); return w ? w[1] : ln.dur * frac; };

// ---------------------------------------------------------------- helpers
const sg = (u, a, b) => clamp((u - a) / Math.max(1e-3, b - a));
const mv = (u, a, b, A, B, k = "inOut") => lerp(A, B, ease(sg(u, a, b), k));
const cam = (p, a, b, k = "inOut") => { const e = ease(clamp(p), k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; };
const wrap = (body, vig = 1) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HM.defs()}${body}${HM.vignette(vig)}`;
const SPK = { G: "G", K: "K", M: "M", N: "N", P: "P" };
const talkAt = (who, time) => {
  for (const b of TL) if (b.ln && b.ln.who === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
};
const glassAt = (view, inner, T, o) => {   // keep the view inside the panel (no black bars)
  const z = view.zoom ?? 1, v = { ...view };
  v.x = clamp01(v.x ?? 540, 540 / z, 1080 - 540 / z); v.y = clamp01(v.y ?? 960, 960 / z, 1920 - 960 / z);
  return HM.glass(v, inner, T, o);
};
function clamp01(v, a, b) { return Math.min(b, Math.max(a, v)); }

// today: the lane at dusk with the hosts. o: { cold, kid (state | null), keeper (state | null), whistle, mouthGrab (0..1: her hand aimed at his mouth) }
function today(T, c, o = {}) {
  HM.dusk(o.cold || 0);
  const st = HM.street(c, T, { lamps: o.lamps });
  const ks = o.kid === null ? null : { ...HM.LANE.kid, blink: blinkAmt(T % 4.1, [1.3]), fx: 0.7, ...o.kid, talk: talkAt("K", T) };
  const kd = ks ? L.kid(c, ks, T) : { svg: "", sleeve: null };
  const mouth = ks ? HM.kidMouth(c, ks) : null;
  const gs = o.keeper === null ? null : { ...HM.LANE.keeper, blink: blinkAmt(T % 3.7, [2.2]), stern: 1, open: 1, fx: -0.7, flame: 1, ...o.keeper, talk: talkAt("G", T) };
  const kp = gs ? L.keeper(c, gs, T, o.mouthGrab && mouth ? { x: mouth.x, y: mouth.y } : kd.sleeve) : { svg: "", arm: "", jar: null };
  const wh = o.whistle && mouth ? HM.tinWhistle(mouth, { k: mouth.k, dir: mouth.dir, grip: 1, rot: 22 + Math.sin(T * 9) * 2 }) : "";
  return { svg: `${st.back}${kd.svg}${wh}${kp.svg}${kp.arm}${st.glow}${HM.dust(T)}${HM.grade()}`, jar: kp.jar };
}
const TD = (T, c, o) => wrap(today(T, c, o).svg);

// ---------------------------------------------------------------- glass shots shared across beats
const squareView = (v) => ({ x: 540, y: lerp(960, 1190, ease(v)), zoom: lerp(1.0, 1.3, ease(v)) });
const squareShot = (T, v) => { HM.mood("rats"); return glassAt(squareView(v), HM.square(T), T); };
const by = (id) => TL.find((b) => b.line === id);
let GLOW0 = 0, GLOW1 = 0;   // the candle-glow -> glass window (absolute time)
function glowFrame(T) {
  const p = clamp((T - GLOW0) / (GLOW1 - GLOW0));
  if (p < 0.5) {
    const c = cam(sg(T, GLOW0 - 1, GLOW1), [0.5, 1.1, 2.3], [0.5, 1.05, 2.45]);
    const td = today(T, c, { kid: null, keeper: { flame: 1.1, fx: -0.7 } });
    return wrap(td.svg + HM.glowToGlass(p, td.jar ? [td.jar.x, td.jar.y] : [W / 2, 1000]), 0.9);
  }
  return wrap(squareShot(T, 0) + HM.glowToGlass(p, [W / 2, 1000]), 0.7);
}

// ---------------------------------------------------------------- the beats
const CHILD_STATE = { kid: { fx: 0.7, hand2face: 1 } };
const BEATS = [
  // 1. the boy plays two notes, walking
  { line: null, dur: 1.15, shot(u, D, T) {
    const c = cam(u / D, [-0.45, 1.0, 2.3], [-0.2, 1.0, 2.45], "out");
    const run = u * 0.9;
    return TD(T, c, { kid: { X: lerp(-0.5, -0.08, ease(u / D)), fx: 0.8, hand2face: 1, run, hop: 0 }, whistle: true, keeper: { X: 0.52, Z: 2.9, stern: 0, open: 0, fx: -0.7, flame: 1.1 } }); } },
  // 2. L01 grandma's hand covers the whistle
  { line: "L01", pre: 0, hold: 0.15, shot(u, D, T, ln) {
    const hold = 1.15;
    const k = { fx: 0.7, hand2face: 1, shock: tr([[0, 0.2], [0.3, 0.5]], u) };
    if (u < hold) return TD(T, cam(u / hold, [0.22, 1.0, 1.55], [0.25, 1.0, 1.75]), { kid: k, whistle: true, mouthGrab: 1, keeper: { grab: tr([[-0.3, 0], [0.12, 1, "back"]], u + 0.0), flame: tr([[0, 1.35], [0.9, 1.0]], u), stern: 1 } });
    return TD(T, cam((u - hold) / (D - hold), [0.5, 1.12, 2.3], [0.5, 1.12, 2.45]), { kid: k, whistle: true, mouthGrab: 1, keeper: { grab: 1, flame: tr([[hold, 1], [D, 0.75]], u), stern: 1 } }); } },
  // 3. L02 the kid looks down the empty street
  { line: "L02", pre: 0.05, hold: 0.15, shot(u, D, T) {
    const k = { fx: -0.55, look: -0.7, hand2face: 0, worry: 0.3 };
    if (u < D * 0.55) return TD(T, cam(u / (D * 0.55), [-0.16, 0.99, 2.8], [-0.2, 0.99, 2.93]), { kid: k, keeper: { flame: 0.75, grab: 0 } });
    return TD(T, cam((u - D * 0.55) / (D * 0.45), [-0.3, 1.3, 1.2], [-0.3, 1.3, 1.9]), { kid: k, keeper: { flame: 0.75 } }); } },
  // 4. L03 wide push, the beam, the candle fills the frame (glow -> glass)
  { line: "L03", pre: 0.05, hold: 0, shot(u, D, T, ln, b) {
    const w = (x, f) => wordAt(ln, x, f), a1 = w("nobody", 0.25), a2 = w("not", 0.43), a3 = w("because", 0.65);
    if (T >= GLOW0) return glowFrame(T);
    const k = { fx: 0.7 };
    if (u < a1) return TD(T, cam(u / a1, [0.1, 1.5, -0.9], [0.05, 1.42, 0.9]), { kid: k, keeper: { flame: 0.85 } });
    if (u < a2) return TD(T, cam(sg(u, a1, a2), [0.9, 0.85, 0.2], [0.6, 0.95, 1.5]), { kid: k, keeper: { flame: 0.85 } });
    if (u < a3) return wrap(HM.beamInsert({ x: mv(u, a2, a3, 0.05, 0.85), zoom: mv(u, a2, a3, 1.05, 1.2) }, T, { light: 1 }), 1);
    return TD(T, cam(sg(u, a3, GLOW0 - b.lineAt), [0.28, 1.0, 1.7], [0.4, 1.04, 2.05]), { kid: k, keeper: { flame: 1.05 } }); } },
  // 5. L04 rats in the square, the bread, the beds
  { line: "L04", pre: 0, hold: 0.2, shot(u, D, T, ln, b) {
    if (T < GLOW1) return glowFrame(T);
    const a1 = wordAt(ln, "bread", 0.4), a2 = wordAt(ln, "beds", 0.75) - 0.1;
    HM.mood("rats");
    if (u < a1) return wrap(squareShot(T, sg(u, 0, a1)), 0.7);
    if (u < a2) { const e = ease(sg(u, a1, a2)); return wrap(glassAt({ x: lerp(380, 560, e), y: lerp(1190, 1230, e), zoom: lerp(1.5, 1.6, e) }, HM.square(T, { rats: 1 }), T), 0.7); }
    const e = ease(sg(u, a2, D)); return wrap(glassAt({ x: lerp(480, 540, e), y: lerp(1480, 1400, e), zoom: lerp(1.15, 1.3, e) }, HM.bedroom(T, { rats: 1 }), T), 0.7); } },
  // 6. L05 the stranger steps in at the gate
  { line: "L05", pre: 0.05, hold: 0.1, shot(u, D, T, ln) {
    const a = wordAt(ln, "coat", 0.45) - 0.2, e = ease(sg(u, 0, D));
    HM.mood("rats", "gold", ease(sg(u, 0.2, a)));
    const pip = HM.piper({ x: 540, y: lerp(1492, 1800, e), s: lerp(2.25, 3.2, e), ...HM.PIPER.walk, walk: u * 0.8, shadow: { len: 260, ang: 70 } }, T);
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1130, 1260), zoom: mv(u, 0, a, 1.0, 1.15) }, HM.gate(T, { open: 1 }) + pip, T), 0.7);
    return wrap(glassAt({ x: mv(u, a, D, 540, 560), y: mv(u, a, D, 1540, 1470), zoom: mv(u, a, D, 1.2, 1.3) }, HM.gate(T, { open: 1 }) + pip, T), 0.7); } },
  // 7. L06 the piper, calm, one finger, a coin
  { line: "L06", pre: 0.1, hold: 0.05, shot(u, D, T, ln) {
    const a = wordAt(ln, "for", 0.55) - 0.15; HM.mood("gold");
    const pose = HM.piperPose("stand", "finger", ease(sg(u, a, a + 0.35), "back"));
    const fig = HM.piper({ x: 470, y: 3560, s: 15, ...pose, coin: u >= a, look: tr([[0, -0.2], [a, 0.1], [D, 0.5]], u), blink: blinkAmt(u, [1.1, 3.0]) }, T);
    if (u < a) return wrap(glassAt({ x: mv(u, 0, a, 520, 580), y: mv(u, 0, a, 960, 900), zoom: mv(u, 0, a, 1.0, 1.1) }, HM.backdrop(T) + fig, T, { bars: false }), 0.6);
    return wrap(glassAt({ x: mv(u, a, D, 560, 600), y: mv(u, a, D, 840, 800), zoom: mv(u, a, D, 1.1, 1.22) }, HM.backdrop(T) + fig, T, { bars: false }), 0.6); } },
  // 8. L07 the mayor, then the too-hard handshake
  { line: "L07", pre: 0.1, hold: 0.15, shot(u, D, T) {
    HM.mood("gold"); const a = D * 0.5;
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1010, 950), zoom: mv(u, 0, a, 1.0, 1.1) }, HM.backdrop(T, { seed: 3 }) + HM.mayor({ x: 520, y: 2790, s: 13.5, talk: talkAt("M", T), look: 0.5, blink: blinkAmt(u, [0.9]) }, T), T, { bars: false }), 0.6);
    const sh = Math.sin(T * 24) * 0.5 + 0.5;
    return wrap(glassAt({ x: mv(u, a, D, 520, 540), y: mv(u, a, D, 1480, 1450), zoom: mv(u, a, D, 1.2, 1.35) }, HM.hall(T) + HM.piper({ ...HM.PIPER.offer, x: HM.HALL.piper[0], y: HM.HALL.piper[1], s: HM.HALL.s }, T) + HM.mayor({ x: HM.HALL.mayor[0], y: HM.HALL.mayor[1], s: HM.HALL.s, dir: -1, shake: sh, talk: talkAt("M", T) }, T), T), 0.7); } },
  // 9. L08 he plays, the rats follow, the Weser
  { line: "L08", pre: 0.1, hold: 0.35, shot(u, D, T, ln) {
    const a1 = wordAt(ln, "every", 0.3) - 0.1, a2 = wordAt(ln, "straight", 0.7) - 0.2;
    if (u < a1) { HM.mood("gold"); return wrap(glassAt({ x: mv(u, 0, a1, 600, 520), y: mv(u, 0, a1, 880, 830), zoom: 1.05 }, HM.backdrop(T) + HM.piper({ x: 450, y: 3500, s: 15, ...HM.PIPER.play, play: 1, walk: T * 0.5, tilt: 3 }, T), T, { bars: false }), 0.6); }
    if (u < a2) {
      HM.mood("gold", "river", 0.3); const e = ease(sg(u, a1, a2));
      const path = [[1080, 1230, 1.3], [760, 1460, 1.9], [420, 1640, 2.6], [150, 1800, 3.2]];
      return wrap(glassAt({ x: lerp(540, 520, e), y: lerp(1500, 1450, e), zoom: lerp(1.1, 1.25, e) }, HM.gate(T, { open: 1 }) + HM.ratStream({ path, n: 34, t: T, speed: 0.18, width: 70, seed: 4 }) + HM.piper({ x: 760, y: 1830, s: 3.1, dir: 1, ...HM.PIPER.play, play: 1, walk: T * 0.5 }, T), T), 0.7);
    }
    HM.mood("river"); const e = ease(sg(u, a2, D)), jump = (D - a2) * 0.0;
    return wrap(glassAt({ x: mv(u, a2, D, 500, 600), y: mv(u, a2, D, 1010, 1150), zoom: 1.25 }, HM.river(T, { rats: 1 }) + HM.piper({ x: HM.RIVER.spot[0], y: HM.RIVER.spot[1], s: HM.RIVER.s, dir: -1, ...HM.PIPER.play, play: 1 }, T), T), 0.7); } },
  // 10. L09 the kid, hopeful, candle tall
  { line: "L09", pre: 0.35, hold: 0.1, shot(u, D, T) {
    return TD(T, cam(u / D, [0.06, 1.0, 2.45], [0.04, 1.0, 2.58]), { kid: { fx: 0.55, hand2face: 0, worry: 0 }, keeper: { flame: 1.4, stern: 0.2 } }); } },
  // 11. L10 "Wait."
  { line: "L10", pre: 0.1, hold: 0.55, shot(u, D, T) {
    return TD(T, cam(u / D, [0.5, 1.1, 2.3], [0.5, 1.1, 2.5], "out"), { kid: { fx: 0.7 }, keeper: { stern: 1, flame: tr([[0, 1.0], [0.5, 0.45]], u), grab: 0 } }); } },
  // 12. L11 the mayor laughs, three coins on the floor
  { line: "L11", pre: 0, hold: 0.15, shot(u, D, T, ln) {
    const a = wordAt(ln, "why", 0.55) - 0.15, v = (T0) => clamp(u - T0);
    HM.mood("gold", "brass", ease(sg(u, 0, D)));
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1000, 960), zoom: mv(u, 0, a, 1.0, 1.1) }, HM.backdrop(T, { seed: 3 }) + HM.mayor({ x: 520, y: 2790, s: 13.5, talk: talkAt("M", T), laugh: 1, look: 0.5 }, T), T, { bars: false }), 0.6);
    const c = (i, t0) => { const f = clamp((u - t0) / 0.5); return HM.gcoin(lerp(745 - 120 + i * 60, 560 + i * 50, f), lerp(1560, [1700, 1760, 1790][i], ease(f, "in")), { r: 18, flip: f * (0.2 + i * 0.1) }); };
    const coins = [0, 1, 2].map((i) => (u > a + 0.1 + i * 0.25 ? c(i, a + 0.1 + i * 0.25) : "")).join("");
    return wrap(glassAt({ x: mv(u, a, D, 600, 640), y: mv(u, a, D, 1500, 1520), zoom: mv(u, a, D, 1.2, 1.35) }, HM.hall(T) + HM.councillor({ x: 560, y: 1540, s: 3.1, seed: 2, laugh: 1, dir: -1 }, T) + HM.councillor({ x: 930, y: 1550, s: 3.1, seed: 4, laugh: 1, dir: -1 }, T) + HM.mayor({ x: 745, y: 1590, s: 3.4, dir: -1, laugh: 1, drop: ease(sg(u, a, a + 0.5)), talk: talkAt("M", T) }, T) + coins + HM.piper({ ...HM.PIPER.stand, x: 250, y: 1620, s: 3.4 }, T), T), 0.7); } },
  // 13. L12 he picks nothing up, turns, walks out the gate; the long shadow
  { line: "L12", pre: 0.1, hold: 0.5, shot(u, D, T, ln) {
    const a = wordAt(ln, "he", 0.4);
    if (u < a) {
      HM.mood("brass"); const turn = ease(sg(u, 0.5, a));
      return wrap(glassAt({ x: mv(u, 0, a, 480, 430), y: mv(u, 0, a, 1480, 1450), zoom: mv(u, 0, a, 1.35, 1.45) }, HM.hall(T) + HM.councillor({ x: 680, y: 1540, s: 3.0, seed: 2, laugh: 0.6, dir: -1 }, T) + HM.councillor({ x: 930, y: 1550, s: 3.0, seed: 4, laugh: 0.6, dir: -1 }, T) + HM.gcoin(560, 1700, { r: 18 }) + HM.gcoin(610, 1760, { r: 18, flip: 0.1 }) + HM.gcoin(520, 1790, { r: 18, flip: 0.18 }) + HM.piper({ ...HM.piperPose("stand", "away", turn), x: 330, y: 1620, s: 3.4, look: -0.3 }, T), T), 0.7);
    }
    HM.mood("brass", "moon", ease(sg(u, a, D)));
    const e = ease(sg(u, a, D + 0.3, "in"));
    return wrap(glassAt({ x: 540, y: mv(u, a, D, 1360, 1250), zoom: mv(u, a, D, 1.1, 1.0) }, HM.gate(T, { moon: [200, 200, 54] }) + HM.piper({ ...HM.PIPER.away, x: 540, y: lerp(1750, 1520, e), s: lerp(2.9, 2.2, e), walk: T * 0.7, shadow: { len: 520, ang: 80 } }, T), T), 0.7); } },
  // 14. L13 grandma very close, candle low and blue under her chin
  { line: "L13", pre: 0.15, hold: 0.2, shot(u, D, T) {
    const a = D * 0.55;
    return TD(T, cam(u / D, [0.5, 1.06, 2.25], [0.5, 1.08, 2.5]), { cold: tr([[0, 0.35], [D, 0.7]], u), kid: { fx: 0.7, worry: 0.6 }, keeper: { stern: 1, flame: tr([[0, 0.45], [D, 0.3]], u), grab: 0 } }); } },
  // 15. L14 church, the grown-ups inside, the piper returns
  { line: "L14", pre: 0.1, hold: 0.3, shot(u, D, T, ln) {
    const a1 = wordAt(ln, "while", 0.3) - 0.1, a2 = wordAt(ln, "he", 0.55) - 0.15;
    HM.mood("moon");
    if (u < a1) return wrap(glassAt({ x: 540, y: mv(u, 0, a1, 1250, 1100), zoom: mv(u, 0, a1, 1.0, 1.1) }, HM.church(T, { lit: 1 }), T), 0.7);
    if (u < a2) return wrap(glassAt({ x: mv(u, a1, a2, 380, 520), y: mv(u, a1, a2, 760, 800), zoom: 1.4 }, HM.church(T, { lit: 1 }), T), 0.7);
    const e = ease(sg(u, a2, D));
    return wrap(glassAt({ x: mv(u, a2, D, 640, 780), y: mv(u, a2, D, 1500, 1380), zoom: mv(u, a2, D, 1.15, 1.45) }, HM.church(T, { lit: 1 }) + HM.piper({ ...HM.PIPER.play, play: sg(u, a2 + 0.5, a2 + 1.0), x: HM.CHURCH.far[0] - 12 * e, y: HM.CHURCH.far[1], s: HM.CHURCH.sFar * 1.35, dir: -1 }, T), T), 0.7); } },
  // 16. L15 the kid whispers
  { line: "L15", pre: 0.15, hold: 0.1, shot(u, D, T) {
    return TD(T, cam(u / D, [-0.15, 0.97, 2.8], [-0.19, 0.97, 2.95]), { cold: 0.3, kid: { fx: 0.6, worry: 0.7, hand2face: 0 }, keeper: { flame: 0.45 } }); } },
  // 17. L16 grandma, soft, the flame flickers
  { line: "L16", pre: 0.1, hold: 0.5, shot(u, D, T) {
    return TD(T, cam(u / D, [0.48, 1.08, 2.3], [0.5, 1.08, 2.5]), { cold: 0.4, kid: { fx: 0.7 }, keeper: { stern: 0.3, flame: 0.45 + 0.2 * Math.sin(T * 9) * Math.sin(T * 5.3), grab: 0 } }); } },
  // 18. L17 doors, children (backs), this street, gate, hill, fog
  { line: "L17", pre: 0.1, hold: 0.5, shot(u, D, T, ln) {
    const w = (x, f) => wordAt(ln, x, f), tCh = w("children", 0.15), tDo = w("doors", 0.25), tFo = w("followed", 0.33), tDn = w("down", 0.47), tOut = w("out", 0.6) - 0.1, tUp = w("up", 0.74) - 0.1, tFog = w("into", 0.84) - 0.1;
    if (u < tDo + 0.3) {   // doors open one by one
      HM.mood("moon");
      const doors = tr([[tCh - 0.3, 0], [tDo + 0.3, 3.4]], u), lead = tr([[tCh + 0.1, 0], [tDo + 1.2, 0.2]], u);
      return wrap(glassAt({ x: mv(u, 0, tDo + 0.3, 520, 470), y: mv(u, 0, tDo + 0.3, 1520, 1560), zoom: mv(u, 0, tDo + 0.3, 1.0, 1.15) }, HM.church(T, { lit: 1, doors }) + HM.childrenLine({ path: HM.CHURCH.line, n: 8, t: T, lead, gap: 0.1, seed: 3 }), T), 0.7);
    }
    if (u < tDn) {   // they follow him
      HM.mood("moon"); const lead = tr([[tDo + 0.3, 0.2], [tDn + 1.5, 0.75]], u);
      return wrap(glassAt({ x: mv(u, tDo + 0.3, tDn, 700, 800), y: mv(u, tDo + 0.3, tDn, 1450, 1380), zoom: mv(u, tDo + 0.3, tDn, 1.15, 1.4) }, HM.church(T, { lit: 1, doors: 3.4 }) + HM.childrenLine({ path: HM.CHURCH.line, n: 8, t: T, lead, gap: 0.1, seed: 3 }) + HM.piper({ ...HM.PIPER.play, play: 1, x: HM.CHURCH.far[0], y: HM.CHURCH.far[1], s: HM.CHURCH.sFar, dir: -1 }, T), T), 0.7);
    }
    if (u < tOut) {   // down this street: backs, wooden shoes, low
      HM.mood("moon"); const lead = tr([[tDn, 0.75], [tOut, 1.15]], u);
      return wrap(glassAt({ x: mv(u, tDn, tOut, 360, 560), y: mv(u, tDn, tOut, 1640, 1520), zoom: mv(u, tDn, tOut, 1.2, 1.3) }, HM.church(T, { lit: 1, doors: 3.4 }) + HM.childrenLine({ path: HM.CHURCH.line, n: 8, t: T, lead, gap: 0.1, seed: 3 }), T), 0.7);
    }
    if (u < tUp) {   // out of the gate
      HM.mood("moon"); const lead = tr([[tOut, 0.1], [tUp, 1.25]], u), path = [[330, 1960, 3.5], [470, 1760, 3.1], [540, 1580, 2.4], [540, 1440, 1.8]];
      return wrap(glassAt({ x: 540, y: mv(u, tOut, tUp, 1600, 1330), zoom: mv(u, tOut, tUp, 1.1, 1.2) }, HM.gate(T, { open: 1, moon: [200, 200, 54] }) + HM.childrenLine({ path, n: 9, t: T, lead, gap: 0.1, seed: 5 }), T), 0.7);
    }
    HM.mood("moon", "fog", u < tFog ? 0.1 : 0.1 + 0.35 * ease(sg(u, tFog, D)));
    const lead = tr([[tUp, 0.05], [D, 1.2]], u), fog = u < tFog ? 0.1 + 0.05 * sg(u, tUp, tFog) : mv(u, tFog, D, 0.15, 0.7);
    return wrap(glassAt({ x: 540, y: mv(u, tUp, D, 1480, 1050), zoom: 1.2 }, HM.hill(T, { fog, moon: [860, 210, 62], stars: 1 }) + HM.childrenLine({ path: HM.HILL.path, n: 15, t: T, lead, gap: 0.062, seed: 3 }) + HM.piper({ x: 548, y: 808, s: 0.62, ...HM.PIPER.away, pipe: 1, handF: [20, -160], handB: [12, -168] }, T), T), 0.6); } },
  // 19. L18 the fog closes like a door; the toy on the cobbles
  { line: "L18", pre: 0.25, hold: 0.8, shot(u, D, T, ln) {
    const a = wordAt(ln, "and", 0.4) + 0.0, a2 = wordAt(ln, "behind", 0.8) + 0.2;
    if (u < a2) {
      const f = tr([[0, 0.6], [a, 0.65], [a2, 1, "inOut"]], u); HM.mood("moon", "fog", 0.4 + 0.6 * f);
      return wrap(glassAt({ x: 540, y: mv(u, 0, a2, 1050, 980), zoom: mv(u, 0, a2, 1.1, 1.0) }, HM.hill(T, { fog: f, moon: [860, 210, 62] }) + (f < 0.8 ? HM.childrenLine({ path: HM.HILL.path, n: 15, t: T, lead: 1.0 + u * 0.08, gap: 0.062, seed: 3 }) : ""), T, { light: 1 }), 0.6);
    }
    const v = u - a2, e = ease(sg(v, 0, 0.7, "out")); HM.mood("fog", "moon", 0.3);
    return wrap(glassAt({ x: lerp(600, 560, e), y: lerp(1040, 1000, e), zoom: lerp(1.25, 1.4, e) }, HM.toy(T, { fog: 0.1 + 0.25 * e }), T, { light: 0.85 - 0.8 * ease(sg(v, 0.2, D - a2 - 0.25)) }), 0.6); } },
  // 20. L19 dawn: the boy with the crutch, the girl who heard nothing
  { line: "L19", pre: 0.3, hold: 0.3, shot(u, D, T, ln) {
    const a1 = wordAt(ln, "one", 0.35) - 0.2, a2 = wordAt(ln, "who", 0.75) - 0.35; HM.mood("dawn");
    const boy = HM.child({ x: HM.HILL.foot[0], y: HM.HILL.foot[1], s: 4.2, kind: "crutch", seed: 5, h: 118 }, T), girl = HM.child({ x: HM.HILL.girl[0], y: HM.HILL.girl[1], s: 4.2, kind: "girl", seed: 8, h: 92, look: tr([[a2, 0], [a2 + 0.6, -1]], u) }, T), set = HM.hill(T, { open: 0 });
    if (u < a1) return wrap(glassAt({ x: 540, y: mv(u, 0, a1, 1400, 1250), zoom: 1.0 }, set + boy + girl, T), 0.6);
    if (u < a2) return wrap(glassAt({ x: mv(u, a1, a2, 380, 340), y: mv(u, a1, a2, 1700, 1650), zoom: mv(u, a1, a2, 1.6, 1.75) }, set + boy + girl, T, { bars: false }), 0.6);
    return wrap(glassAt({ x: mv(u, a2, D, 740, 770), y: mv(u, a2, D, 1700, 1660), zoom: mv(u, a2, D, 1.6, 1.8) }, set + boy + girl, T, { bars: false }), 0.6); } },
  // 21. L20 the kid, small
  { line: "L20", pre: 0.2, hold: 0.1, shot(u, D, T) {
    return TD(T, cam(u / D, [-0.15, 0.97, 2.8], [-0.18, 0.97, 2.93]), { cold: 0.45, kid: { fx: 0.5, worry: 0.9, hand2face: 0 }, keeper: { flame: 0.35 } }); } },
  // 22. L21 the chronicle page, the beam, the street comes back warm
  { line: "L21", pre: 0.3, hold: 0.15, shot(u, D, T, ln) {
    const a1 = wordAt(ln, "hundred", 0.3) - 0.1, a2 = wordAt(ln, "and", 0.6);
    if (u < a1) return wrap(HM.chronicle({ y: mv(u, 0, a1, 0.05, 0.4), zoom: mv(u, 0, a1, 1.0, 1.1) }, T), 1);
    if (u < a2) return wrap(HM.beamInsert({ x: mv(u, a1, a2, 0.8, 0.2), zoom: mv(u, a1, a2, 1.2, 1.1) }, T, { light: 0.8 }), 1);
    return TD(T, cam(sg(u, a2, D), [0.1, 1.45, -0.9], [0.08, 1.35, 1.1]), { cold: tr([[a2, 0.8], [D, 0]], u), kid: null, keeper: null }); } },
  // 23. L22 her open hand
  { line: "L22", pre: 0.2, hold: 0.1, shot(u, D, T, ln) {
    const a = wordAt(ln, "the", 0.4) + 0.0, cold = tr([[0, 0.3], [D, 0]], u);
    const c = cam(u / D, [0.5, 1.08, 2.35], [0.5, 1.08, 2.5]);
    return TD(T, c, { cold, kid: { fx: 0.7 }, keeper: { stern: 1, flame: tr([[0, 0.6], [D, 1.0]], u) } }); } },
  // 24. L23 the kid groans, the coin goes into her palm
  { line: "L23", pre: 0.1, hold: 0.05, shot(u, D, T) {
    const a = D * 0.55;
    if (u < a) return TD(T, cam(u / a, [-0.15, 0.97, 2.8], [-0.18, 0.97, 2.9]), { kid: { fx: 0.7, worry: 0.2, shock: 0, lean: -3 }, keeper: { flame: 0.95 } });
    const e = ease(sg(u, a, D + 0.1));
    const td = today(T, cam(0, [0.3, 0.92, 2.1], [0.3, 0.92, 2.1]), {});
    return wrap(td.svg + HM.palm({ x: 640, y: 1500 }, { k: 17, rot: -8 }) + HM.coin({ x: lerp(760, 650, e), y: lerp(1180, 1478, ease(e, "in")) }, { k: 30, flip: 0.07 + e * 0.5 }), 1); } },
  // 25. L24 "Right now." The candle grows tall and warm
  { line: "L24", pre: 0.0, hold: 0.9, shot(u, D, T) {
    return TD(T, cam(u / (D + 0.9), [0.48, 1.08, 2.3], [0.5, 1.08, 2.45]), { kid: { fx: 0.7 }, keeper: { stern: 0.7, flame: tr([[0, 1.0], [D + 0.5, 1.45]], u), grab: 0 } }); } },
  // 26. three distant notes; both freeze, look; one cold flicker; HARD CUT
  { line: null, dur: 2.9, end: true, shot(u, D, T, ln, b) {
    const n0 = u - 0.6, c = cam(u / D, [0.15, 1.2, 0.9], [0.15, 1.2, 1.25]);   // wide, looking down the lane (they stand with their backs to us? no: seen from the lane end)
    const look = n0 > 0 ? tr([[0, 0], [0.3, 1]], n0) : 0;
    const cold = tr([[1.9, 0], [2.0, 0.9], [2.4, 0.9]], u);
    return TD(T, c, { cold, kid: { fx: lerp(0.7, -0.5, look), hand2face: 0, worry: 0.2 }, keeper: { fx: lerp(-0.7, -0.3, look), stern: 0.4, flame: tr([[0, 1.4], [1.9, 1.4], [2.0, 0.5]], u) } }); } },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur, st = t + (b.pre || 0);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + (b.hold || 0) });
  t = st + d + (b.hold || 0);
}
export const DUR = Math.round(t * FPS) / FPS;
export const GAIN = 1;
export const NOFADE = true;   // the end is a hard cut
GLOW0 = by("L03").lineAt + wordAt(LINE.L03, "happened", 0.75) - 0.05; GLOW1 = by("L04").lineAt + 0.85;
export const TIMELINE = TL;

// ---------------------------------------------------------------- captions: WRITTEN words, word-timed, upper third
const KEY = /^(rats?|piper|children|fog|music|1284|coins?|river|hamelin|wait|gone|twenty|hundred|thousand|five|euros?)/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.2, x.end));
  if (!b || !b.ln.cap.length) return "";
  const u = time - b.lineAt, words = b.ln.cap, chunks = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); const brk = /[.,?!…]$/.test(w[0]) || cur.length >= 4; if (brk || i === words.length - 1) { chunks.push(cur); cur = []; } });
  const ch = chunks.find((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] : 1e9)) || chunks[chunks.length - 1];
  const shown = ch.filter((w) => u >= w[1] - 0.04);
  if (!shown.length) return "";
  const txt = shown.map((w) => `<tspan fill="${KEY.test(norm(w[0])) ? "#ffc04a" : "#ffffff"}">${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  return `<text x="540" y="480" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${n(Math.min(74, 74 * 22 / Math.max(1, shown.map((w) => w[0]).join(" ").length)))}" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds(); HM.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = Math.max(0, time - b.lineAt), D = b.d + (b.hold || 0);
  const svg = b.shot(u, D, time, b.ln, b);
  return svg + `${captions(time)}</svg>`;
}

// ---------------------------------------------------------------- the sound mix
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
const firstFile = (dir) => { try { const f = readdirSync(dir).filter((x) => /\.(ogg|wav|mp3|flac)$/i.test(x)).sort(); return f.length ? `${dir}/${f[0]}` : null; } catch { return null; } };
const sh = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 26 });
const NOTE = { D: 0, F: 3, G: 5, E: 2 };   // semitones above D
function f0Of(file) {   // fundamental of the whistle sample (strongest low peak), deterministic
  const py = `import sys,numpy as np,subprocess\nr=subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-t','4','-ac','1','-ar','22050','-f','f32le','-'],capture_output=True).stdout\nx=np.frombuffer(r,dtype=np.float32)\nx=x[len(x)//4:len(x)//4+16384]*np.hanning(16384)\nS=np.abs(np.fft.rfft(x));f=np.fft.rfftfreq(16384,1/22050)\nm=(f>200)&(f<2000);S=S*m;pk=S.max();i=[k for k in range(1,len(S)-1) if S[k]>0.3*pk and S[k]>=S[k-1] and S[k]>=S[k+1]][0]\nprint(f[i])`;
  return parseFloat(sh("python3", ["-I", "-c", py, file]));
}
export function prepare(outPath) {
  mkdirSync(OUT, { recursive: true }); mkdirSync(`${OUT}/notes`, { recursive: true });
  const ins = [], f = [], miss = [];
  const add = (file, at, gain = 1, extra = "") => { if (!file || !existsSync(file)) { miss.push(file); return; } ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(Math.max(0, at) * 1000)}:all=1[a${k}]`); };
  // voices (the kid +3.2 dB: the producer keeps asking for a louder, clearer kid)
  for (const b of TL) if (b.ln) add(`${VOICE}/${b.ln.id}.wav`, b.lineAt, b.ln.who === "K" ? 1.45 : 1);
  const T = (id, dt = 0) => by(id).lineAt + dt, E = (id) => by(id).lineAt + by(id).d;
  const dead = T("L10") - 0.0;   // music and its tails stop dead on "Wait."
  // music beds (about 10 dB under the voices)
  const bed = (id, a, z, fin = 0.5, fout = 0.5, g = 1) => {
    const file = firstFile(`assets/music/ai/${id}`); if (!file) { miss.push(`assets/music/ai/${id}/*`); return; }
    add(file, a, g, `loudnorm=I=-27:TP=-4,aloop=loop=-1:size=2e9,atrim=0:${(z - a).toFixed(2)},afade=t=in:d=${fin},afade=t=out:st=${(z - a - fout).toFixed(2)}:d=${fout},`);
  };
  bed("pp-dusk", 0, T("L03", wordAt(LINE.L03, "happened", 0.75)), 0.1, 1.0);
  bed("pp-glass", GLOW0 + 0.4, T("L05", 1.5), 1.2, 1.0);
  bed("pp-rats", T("L05", 0.8), dead, 1.0, 0.012);
  bed("pp-cheat", E("L10") + 0.05, T("L13", 0.3), 0.3, 1.0);
  bed("pp-night", T("L13", 2.2), T("L17", wordAt(LINE.L17, "fog", 0.9) + 0.4), 1.5, 3.0, 1);
  bed("pp-grave", T("L18", 0.5), E("L21") + 1.0, 1.5, 1.5, 0.9);
  bed("pp-warm", T("L22", 0.0), E("L24") + 0.6, 1.0, 0.5);
  // pipe notes from one sustained whistle note (rubberband), low-passed at 3 kHz
  const wf = firstFile("assets/sfx/ai/whistle-note");
  const cache = {};
  const note = (name, oct, dur, kind) => {
    if (!wf) return null;
    const key = `${name}${oct}-${dur.toFixed(2)}-${kind}`; if (cache[key]) return cache[key];
    if (cache.f0 == null) { cache.f0 = f0Of(wf); cache.len = parseFloat(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wf])); }
    const srcLen = cache.len;
    const tgt = 293.66 * 2 ** (oct + NOTE[name] / 12), ratio = tgt / cache.f0, out = `${OUT}/notes/${key}.wav`;
    const dark = kind === "far" ? ",lowpass=f=1800,aecho=0.7:0.45:70|130:0.3|0.18" : "";
    sh("ffmpeg", ["-v", "error", "-y", "-ss", "0.3", "-i", wf, "-af", `rubberband=pitch=${ratio.toFixed(4)}:tempo=${Math.min(1, Math.max(0.35, (srcLen - 0.5) / (dur + 0.1))).toFixed(3)},atrim=0:${(dur + 0.1).toFixed(2)},afade=t=in:d=0.05,afade=t=out:st=${Math.max(0, dur - 0.12).toFixed(2)}:d=0.12,lowpass=f=3000${dark}`, "-ar", "44100", "-ac", "1", out]);
    return (cache[key] = out);
  };
  const play = (name, oct, at, dur, gain, kind) => { const nf = note(name, oct, dur, kind); if (nf) add(nf, at, gain); };
  // boy: D F at 0.0, the second cut by the hand
  const cut = by("L01").lineAt + 0.14;
  play("D", 1, 0.05, 0.42, 0.5); play("F", 1, 0.55, Math.max(0.2, cut - 0.55), 0.5);
  // rat tune 6/8 (8th 8th 8th qtr 8th, dotted quarter 104) under L08
  const e8 = 60 / 104 / 1.5, rat = [["D", e8], ["F", e8], ["G", e8], ["E", 2 * e8], ["D", e8]];
  for (let r = 0; r < 3; r++) { let at = T("L08", 0.5 + r * 1.75); if (at + 1.2 > dead + 99) break; for (const [nm, du] of rat) { play(nm, 0, at, du * 0.95, 0.4); at += du; } }
  // children's tune, legato, D F G | E D (qtr qtr half | qtr dotted half) at 60 BPM, low
  const kids = [["D", 1], ["F", 1], ["G", 2], ["E", 1], ["D", 3]];
  const phrase = (at, g) => { for (const [nm, du] of kids) { play(nm, 0, at, du + 0.18, g); at += du; } };
  phrase(T("L14", wordAt(LINE.L14, "new", 0.85) - 0.3), 0.4); phrase(T("L17", 0.0), 0.32);
  // the final call: G E D, distant and dark, then the hard cut
  const last = TL[TL.length - 1], f0 = last.lineAt + 0.6;
  [["G", 0], ["E", 0.95], ["D", 1.9]].forEach(([nm, o]) => play(nm, 0, f0 + o, 0.8, 0.45, "far"));
  // real sounds
  const sfx = (p) => `assets/sfx/${p}`, anyOf = (dir) => firstFile(`assets/sfx/${dir}`);
  add(anyOf("ai/rats-scurry"), by("L04").lineAt + 0.1, 0.55, "loudnorm=I=-30:TP=-6,");
  add(anyOf("ai/rats-scurry"), by("L08").lineAt + 0.9, 0.4, "loudnorm=I=-32:TP=-6,atrim=0:2.8,afade=t=out:st=2:d=0.8,");
  add(sfx("ai/swim-splash/") + (readdirSyncSafe("assets/sfx/ai/swim-splash")[0] || ""), by("L08").lineAt + wordAt(LINE.L08, "river", 0.9), 0.5);
  add(anyOf("ai/men-laugh"), by("L11").lineAt + 0.1, 0.5, "loudnorm=I=-26:TP=-5,atrim=0:2.4,afade=t=out:st=1.8:d=0.6,");
  for (let i = 0; i < 2; i++) add(sfx("kenney/impact/impactBell_heavy_00" + i + ".ogg"), by("L14").lineAt + 0.15 + i * 1.6, 0.3, "lowpass=f=900,aecho=0.6:0.5:120|260:0.35|0.2,");   // a far bell: library bell, low-passed, quiet
  add(anyOf("ai/fog-air"), by("L17").lineAt + wordAt(LINE.L17, "up", 0.7), 0.6, `loudnorm=I=-32:TP=-8,aloop=loop=-1:size=2e9,atrim=0:${(by("L19").end - by("L17").lineAt - wordAt(LINE.L17, "up", 0.7)).toFixed(2)},afade=t=in:d=1.5,afade=t=out:st=${(by("L19").end - by("L17").lineAt - wordAt(LINE.L17, "up", 0.7) - 1.5).toFixed(2)}:d=1.5,`);
  const coinFile = sfx("kenney/rpg/handleCoins.ogg");
  add(coinFile, by("L06").lineAt + wordAt(LINE.L06, "for", 0.55) + 0.2, 0.5);
  [0, 1, 2].forEach((i) => add(sfx(`kenney/rpg/handleCoins${i === 1 ? "2" : ""}.ogg`), by("L11").lineAt + wordAt(LINE.L11, "why", 0.55) - 0.05 + i * 0.25 + 0.35, 0.45));
  add(sfx("kenney/rpg/handleCoins2.ogg"), by("L23").lineAt + by("L23").d * 0.8, 0.6);
  for (let i = 0; i < 3; i++) add(sfx(i % 2 ? "kenney/rpg/doorOpen_2.ogg" : "kenney/rpg/doorOpen_1.ogg"), by("L17").lineAt + wordAt(LINE.L17, "children", 0.15) + 0.3 + i * 0.55, 0.35);
  const sc = readdirSyncSafe("assets/sfx/ai/step-concrete");
  if (sc.length) for (let i = 0; i < 14; i++) add(`assets/sfx/ai/step-concrete/${sc[i % sc.length]}`, by("L17").lineAt + wordAt(LINE.L17, "followed", 0.33) + i * 0.3, 0.12, "lowpass=f=2500,");
  const mixPath = `${OUT}/mix.wav`, k = ins.length / 2;
  if (miss.length) console.log("WARNING missing sound files (skipped): " + [...new Set(miss)].join(", "));
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR.toFixed(2)},atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +b.d.toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
function readdirSyncSafe(d) { try { return readdirSync(d).filter((x) => /\.(wav|ogg)$/.test(x)).sort(); } catch { return []; } }
