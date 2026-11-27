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
const VOICE = "out/legend-pp/vo-cut", OUT = "out/legend-pp", SPEC = JSON.parse(readFileSync("storyboards/series/legend/pied-piper/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

LINE.L03.text = "In Hamelin, Germany, there is one street where nobody plays music. Because of what happened here, in twelve eighty-four.";   // Sol R1 A3: "Not for five hundred years." is cut from the take
LINE.L12.text = "He just left.";   // Sol R1 A11
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

// today: the lane at dusk with the hosts. o: { cold, kid (state | null), keeper (state | null), whistle, mouthGrab (0..1: her hand aimed at his mouth),
//   lower (0..1: she lowers the whistle away from his face), jarCold (0..1: a LOCAL cold flicker round the jar), palm { ext, cup, coin }, pay (0..1: his hand brings the coin) }
let SPN = 0;
function today(T, c, o = {}) {
  HM.dusk(o.cold || 0);
  const st = HM.street(c, T, { lamps: o.lamps });
  const ks = o.kid === null ? null : { ...HM.LANE.kid, blink: blinkAmt(T % 4.1, [1.3]), fx: 0.7, ...o.kid, talk: talkAt("K", T) };
  const kd = ks ? L.kid(c, ks, T) : { svg: "", sleeve: null };
  const mouth = ks ? HM.kidMouth(c, ks) : null, low = o.lower || 0;
  const gs = o.keeper === null ? null : { ...HM.LANE.keeper, blink: blinkAmt(T % 3.7, [2.2]), stern: 1, open: 1, fx: -0.7, flame: 1, ...o.keeper, talk: talkAt("G", T) };
  const tgt = mouth ? { x: mouth.x + low * 5 * mouth.k, y: mouth.y + low * 15 * mouth.k } : null;
  const kp = gs ? L.keeper(c, gs, T, o.mouthGrab && tgt ? tgt : kd.sleeve) : { svg: "", arm: "", jar: null };
  const wh = o.whistle && tgt ? HM.tinWhistle(tgt, { k: mouth.k, dir: mouth.dir, grip: 1, rot: 22 + low * 50 + Math.sin(T * 9) * 2 * (1 - low) }) : "";
  let extra = "", pk = gs ? L.P(c, gs.X, 0, gs.Z) : null;
  if (o.palm && gs) {
    const k = pk.s / 100, sx = pk.x - 14 * k, sy = pk.y - 94 * k, ext = o.palm.ext ?? 1, px = sx - lerp(5, 16, ext) * k, py = sy + lerp(2, 8, ext) * k;
    extra += `<path d="M${n(sx)},${n(sy)} Q${n((sx + px) / 2 + 8 * k)},${n(sy + 14 * k)} ${n(px + 19 * k)},${n(py)}" stroke="#2b2f6b" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/>` + HM.palm({ x: px, y: py }, { k: 0.75 * k, rot: -4, dir: -1, cup: o.palm.cup || 0 });
    if (o.palm.coin) extra += HM.coin({ x: px - 2 * k, y: py - 1 * k }, { k: 1.8 * k, flip: 0.07 });
    if (o.pay != null && ks) {   // his hand comes from his side with the coin, lets go over her palm, goes back
      const kp0 = L.P(c, ks.X, 0, ks.Z), kk = kp0.s / 100, a = o.pay, rest = kd.sleeve ? { x: kd.sleeve.x, y: kd.sleeve.y } : { x: kp0.x + 14 * kk, y: kp0.y - 62 * kk }, sh0 = { x: rest.x - 3 * kk, y: rest.y - 30 * kk }, over = { x: px - 2 * k, y: py - 14 * k };
      const e = ease(clamp(a / 0.45)), back = ease(clamp((a - 0.6) / 0.35)), hx = lerp(lerp(rest.x, over.x, e), rest.x, back), hy = lerp(lerp(rest.y, over.y, e), rest.y, back);
      const hasCoin = a < 0.5;   // the coin leaves his fingers at 0.5 and lands in her palm by 0.55
      extra += `<path d="M${n(sh0.x)},${n(sh0.y)} Q${n((sh0.x + hx) / 2 - 10 * kk)},${n((sh0.y + hy) / 2 + 10 * kk)} ${n(hx - 4 * kk)},${n(hy)}" stroke="#bd2f50" stroke-width="${n(8 * kk)}" stroke-linecap="round" fill="none"/>`
        + `<ellipse cx="${n(hx)}" cy="${n(hy)}" rx="${n(5.2 * kk)}" ry="${n(3.8 * kk)}" fill="#f3cdb0" stroke="${L.INK}" stroke-width="${n(0.9 * kk)}"/>`;
      if (hasCoin) extra += HM.coin({ x: hx + 3 * kk, y: hy - 3 * kk }, { k: 2.6 * kk, flip: 0.07 });
      else if (a < 0.62) { const f = (a - 0.5) / 0.12; extra += HM.coin({ x: hx + 3 * kk, y: lerp(hy - 3 * kk, py - 1 * k, ease(f, "in")) }, { k: 2.6 * kk, flip: 0.07 + f * 0.1 }); }
    }
  }
  if (kp.jar && pk) {   // the jar's own small light: warm by its flame, cold on the flicker
    const fl = gs.flame, cold = o.jarCold || 0, id = `sp${SPN++}`, r = 0.5 * pk.s * (0.55 + 0.35 * Math.min(1.6, fl)) * (1 + cold * 0.4);
    extra += `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${cold > 0.05 ? "#9fc0ff" : "#ffd79a"}" stop-opacity="${n(Math.min(0.55, 0.22 + 0.2 * fl) * (cold > 0.05 ? 1.2 : 1))}"/><stop offset="1" stop-color="${cold > 0.05 ? "#5f86d8" : "#ff9a3a"}" stop-opacity="0"/></radialGradient></defs><circle cx="${n(kp.jar.x)}" cy="${n(kp.jar.y)}" r="${n(r)}" fill="url(#${id})" style="mix-blend-mode:screen"/>`;
  }
  return { svg: `${st.back}${kd.svg}${wh}${kp.svg}${kp.arm}${st.glow}${extra}${HM.dust(T)}${HM.grade()}`, jar: kp.jar };
}
const TD = (T, c, o) => wrap(today(T, c, o).svg);
const KC = (p) => cam(p, [-0.14, 0.97, 2.85], [-0.18, 0.97, 2.95]);          // kid close
const GCAM = (p, z0 = 2.05, z1 = 2.25) => cam(p, [0.64, 1.2, z0], [0.64, 1.2, z1]);   // grandmother single with the staff light, the boy out of frame
const TWO = (p) => cam(p, [0.42, 1.12, 1.75], [0.42, 1.12, 1.85]);              // two-shot with both faces AND the jar on the staff
const nth = (ln, word, k = 0) => { const a = ln.words.filter((x) => norm(x[0]).startsWith(word)); return a[Math.min(k, a.length - 1)]?.[1] ?? ln.dur * 0.5; };

// ---------------------------------------------------------------- glass shots shared across beats
const squareView = (v) => ({ x: 540, y: lerp(960, 1100, ease(v)), zoom: lerp(1.0, 1.15, ease(v)) });
const squareShot = (T, v) => { HM.mood("rats"); return glassAt(squareView(v), HM.square(T), T); };
const by = (id) => TL.find((b) => b.line === id);
let GLOW0 = 0, GLOW1 = 0;   // the jar's flare -> a lit pane of the occupied market (absolute time, about 13 frames: 6 flare, 7 wipe)
const GC3 = (T) => { const b = by("L03"); return GCAM(sg(T, b.lineAt + nth(b.ln, "because"), GLOW1)); };
function glowFrame(T) {
  const p = clamp((T - GLOW0) / (GLOW1 - GLOW0)), td = today(T, GC3(T), { kid: null, keeper: { flame: 1.15 + p, fx: -0.7 } }), jx = td.jar ? td.jar.x : 760, jy = td.jar ? td.jar.y : 700;
  if (p < 0.5) return wrap(td.svg + HM.glowToGlass(p, [jx, jy]), 0.9);
  const f = 1 - (p - 0.5) / 0.5;   // the occupied market is already under the flare; the gold clears from the jar's spot outward
  return wrap(squareShot(T, 0) + `<defs><radialGradient id="gw${SPN++}" cx="${n(jx / W)}" cy="${n(jy / H)}" r="${n(0.2 + 1.3 * (1 - f))}"><stop offset="0" stop-color="#ffe9a0" stop-opacity="${n(0.9 * f)}"/><stop offset="0.6" stop-color="#ffb23a" stop-opacity="${n(0.6 * f)}"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#gw${SPN - 1})" style="mix-blend-mode:screen"/>`, 0.7);
}
// the piper's pivot front -> profile -> back, the feet planted (the figure is squashed about its own axis, never to a sliver)
const pivotPiper = (st, T, a) => { const sx = a < 0.5 ? lerp(1, 0.5, ease(a / 0.5)) : lerp(0.5, 1, ease((a - 0.5) / 0.5)); return `<g transform="translate(${n(st.x)},0) scale(${n(sx)},1) translate(${n(-st.x)},0)">${HM.piper({ ...st, turn: a < 0.5 ? 0 : 1, lean: (st.lean || 0) + 4 * Math.sin(a * Math.PI) }, T)}</g>`; };
const CH_BLUE = 3;   // the same blue-coated boy through the doors, the street, the gate and the hill
const KIDS = [[3, "boy"], [5, "girl"], [6, "boy"], [7, "girl"], [8, "boy"], [9, "girl"], [10, "boy"], [11, "girl"], [13, "boy"], [14, "girl"]];
// the group along a path [[x, y, s], ...]: the blue boy leads, each follower a fixed gap behind, strides offset, no two on the same spot
const kidsOn = (path, lead, gap, T, n0 = 9) => {
  const list = [];
  for (let i = 0; i < n0; i++) {
    const u = lead - i * gap; if (u < 0 || u > 1) continue;
    const f = u * (path.length - 1), k = Math.min(path.length - 2, Math.floor(f)), a = path[k], b = path[k + 1], v = f - k, s = lerp(a[2], b[2], v);
    list.push({ x: lerp(a[0], b[0], v) + ((i % 3) - 1) * 9 * s, y: lerp(a[1], b[1], v), s, seed: KIDS[i][0], kind: KIDS[i][1], walk: T * (1.25 + 0.15 * (i % 3)) + i * 0.37 });
  }
  return list.sort((a, b) => a.y - b.y).map((c) => HM.child(c, T)).join("");
};
const hallFig = (T, o = {}) => HM.hall(T) + HM.councillor({ x: 700, y: 1540, s: 3.0, seed: 2, laugh: o.laugh ?? 0.6, dir: -1 }, T) + HM.councillor({ x: 940, y: 1550, s: 3.0, seed: 4, laugh: o.laugh ?? 0.6, dir: -1 }, T);
const COINS = [[560, 1710], [620, 1765], [520, 1790]];   // where the three coins settle on the hall floor
const HANDM = [650, 1500];                                // the mayor's open hand in the hall two-shot
// the church street: the children leave the doors, walk down into the street and then away to ONE vanishing point at the centre (like the lane today)
const PA = (door) => [[door[0], 1275, 2.3], [lerp(door[0], 545, 0.55), 1620, 3.1], [545, 1450, 1.9], [545, 1330, 1.0]];
const churchKids = (u, T, dr) => {
  const spec = [[3, "boy", 0, 0.35], [5, "girl", 1, 1.0], [6, "boy", 2, 1.5], [7, "girl", 1, 2.3], [8, "boy", 3, 2.8], [9, "girl", 0, 3.4], [10, "boy", 2, 3.9], [11, "girl", 3, 4.4]], out = [];
  spec.forEach(([seed, kind, di, t0], i) => {
    const v = u - t0; if (v <= 0 || !dr[di]) return;
    const pth = PA(dr[di]), f = clamp(v / 5.2) * (pth.length - 1), k = Math.min(pth.length - 2, Math.floor(f)), a = pth[k], b = pth[k + 1], q = ease(f - k, "linear");
    out.push({ x: lerp(a[0], b[0], q) + ((i % 3) - 1) * 8, y: lerp(a[1], b[1], q), s: lerp(a[2], b[2], q), seed, kind, walk: T * (1.2 + 0.15 * (i % 3)) + i * 0.4 });
  });
  return out.sort((a, b) => a.y - b.y).map((c) => HM.child(c, T)).join("");
};
const TOY = [420, 1560];

// ---------------------------------------------------------------- the beats (Sol round 1 + 2, 27 Nov: recut)
const BEATS = [
  // 1-2. the boy plays D F, her hand arrives on the second note
  { line: null, dur: 0.55, shot(u, D, T) {
    const c = cam(u / D, [-0.02, 1.02, 1.5], [0.12, 1.02, 1.55], "out");
    return TD(T, c, { kid: { X: lerp(-0.4, -0.08, ease(u / D)), fx: 0.8, hand2face: 1, run: u * 0.9 }, whistle: true, mouthGrab: 1, keeper: { grab: tr([[0.2, 0], [0.5, 1, "back"]], u), stern: 0.2, flame: 1.1 } }); } },
  // 2-3. L01 ONE two-shot: her hand closes on the whistle, pulls it from his lips, lowers it; "Not one note."
  { line: "L01", hold: 0, shot(u, D, T, ln) {
    const k = { fx: 0.7, hand2face: tr([[0.5, 1], [1.1, 0]], u), shock: 0.3 };
    return TD(T, cam(u / D, [0.12, 1.02, 1.55], [0.28, 1.04, 1.8]), { kid: k, whistle: true, mouthGrab: 1, lower: tr([[0.35, 0], [1.25, 1, "out"]], u), keeper: { grab: 1, stern: 1, flame: tr([[0, 1.35], [0.8, 1.0], [D, 0.75]], u) } }); } },
  // 4. L02 ONE medium close-up, the eyes flick from her hand to the far end of the street
  { line: "L02", hold: 0, shot(u, D, T) {
    return TD(T, KC(u / D), { kid: { fx: u < 0.22 ? 0.7 : -0.55, look: u < 0.22 ? 0 : -0.7, hand2face: 0, worry: 0.3 }, keeper: { flame: 0.75, grab: 0 } }); } },
  // 5-6. L03 one street push (Hamelin + the ban), grandmother + staff on "Because", the jar's flare into a lit market pane
  { line: "L03", pre: 0.03, hold: 0, shot(u, D, T, ln, b) {
    const a1 = nth(ln, "because");
    if (T >= GLOW0) return glowFrame(T);
    if (u < a1) return TD(T, cam(u / a1, [0.1, 1.5, -0.9], [0.1, 1.3, 1.5]), { kid: { fx: 0.7, hand2face: 0 }, keeper: { flame: 0.9, grab: 0 } });
    return TD(T, GC3(T), { kid: null, keeper: { flame: tr([[a1, 1.0], [D, 1.1]], u), grab: 0 } }); } },
  // 7-9. L04 square 1.6 / bread 1.2 / bed 0.9, each cut on its phrase; a rat clears the blanket edge on the cut
  { line: "L04", hold: 0, shot(u, D, T, ln) {
    const a1 = nth(ln, "in", 0), a2 = nth(ln, "in", 1); HM.mood("rats");
    if (T < GLOW1) return glowFrame(T);
    if (u < a1) return wrap(squareShot(T, sg(u, 0, a1)), 0.7);
    if (u < a2) { const e = ease(sg(u, a1, a2)); return wrap(glassAt({ x: lerp(360, 520, e), y: lerp(1210, 1250, e), zoom: lerp(1.5, 1.55, e) }, HM.square(T, { rats: 1 }), T), 0.7); }
    const e = ease(sg(u, a2, D)), v = sg(u, a2 + 0.1, D - 0.02);
    const rx = lerp(430, 790, ease(v, "in")), ry = lerp(1405, 1432, v) - Math.sin(v * Math.PI) * 14;
    return wrap(glassAt({ x: lerp(470, 540, e), y: lerp(1500, 1440, e), zoom: lerp(1.2, 1.35, e) }, HM.bedroom(T, { rats: 1 }) + (v > 0 ? HM.rat(rx, ry, 2.6, { pose: "run", dir: 1, seed: 77, ph: T * 3.4 }) : ""), T), 0.7); } },
  // 10. L05 the gate: one real step across the threshold, green shade -> warm light; the piper stays below the caption band
  { line: "L05", hold: 0, shot(u, D, T, ln) {
    const e = ease(sg(u, 0, D)); HM.mood("rats", "gold", ease(sg(u, 0.1, nth(ln, "many", 0.7))));
    const pip = HM.piper({ x: 540, y: lerp(1450, 1650, e), s: lerp(2.4, 2.6, e), ...HM.PIPER.walk, walk: lerp(0.0, 0.5, e), shadow: { len: 260, ang: 70 } }, T);
    return wrap(glassAt({ x: 540, y: lerp(1260, 1380, e), zoom: lerp(1.25, 1.35, e) }, HM.gate(T, { open: 1 }) + pip, T), 0.7); } },
  // 11. L06 the hand lifts through "Gone", the coin flashes between two fingers on "thousand"
  { line: "L06", hold: 0, shot(u, D, T, ln) {
    const a = nth(ln, "gone", 0.4), b = nth(ln, "thousand", 0.7); HM.mood("gold");
    const lift = ease(sg(u, a - 0.5, a + 0.2)), pose = HM.piperPose("stand", "finger", lift);
    const fig = HM.piper({ x: 340, y: 3860, s: 15, ...pose, handF: [lerp(17, 40, lift), lerp(-103, -176, lift)], coin: u >= b - 0.05, look: tr([[0, -0.2], [a, 0.1], [D, 0.5]], u), blink: blinkAmt(u, [0.4, 2.4]) }, T);
    const g = clamp(1 - Math.abs(u - (b + 0.1)) / 0.14), glint = g > 0 ? `<g transform="translate(940,1020) scale(${n(1 + 1.5 * g)})" style="mix-blend-mode:screen" opacity="${n(g)}"><path d="M0,-34 L6,-6 L34,0 L6,6 L0,34 L-6,6 L-34,0 L-6,-6 Z" fill="#fff3b0"/></g>` : "";
    return wrap(glassAt({ x: mv(u, 0, D, 540, 600), y: mv(u, 0, D, 960, 900), zoom: mv(u, 0, D, 1.0, 1.15) }, HM.backdrop(T) + fig + glint, T, { bars: false }), 0.6); } },
  // 12-13. L07 "Done!" the mayor reaches, then a tight two-shot: clasp, one shake, the downstroke
  { line: "L07", hold: 0, shot(u, D, T) {
    HM.mood("gold"); const a = 0.5;
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1030, 990), zoom: mv(u, 0, a, 1.0, 1.06) }, HM.backdrop(T, { seed: 3 }) + HM.mayor({ x: 520, y: 3060, s: 13.5, talk: talkAt("M", T), look: 0.5, shake: sg(u, 0.25, a) * 0.3, blink: blinkAmt(u, [0.9]) }, T), T, { bars: false }), 0.6);
    const v = u - a, sh = v < 0.3 ? 0 : Math.sin((v - 0.3) * 13) * 1, S = 4.1;
    return wrap(glassAt({ x: 545, y: 1290, zoom: 1.5 }, HM.hall(T) + HM.piper({ ...HM.PIPER.offer, x: 455, y: 1960, s: S }, T) + HM.mayor({ x: 660, y: 1960, s: S, dir: -1, shake: v < 0.05 ? 0.3 : v < 0.3 ? 1 : 0.5 + 0.5 * sh, talk: talkAt("M", T) }, T), T), 0.7); } },
  // 14-16. L08 the pipe (a breath, a lift) / the procession with the rats behind his feet / one rat crosses the bank, leaps, splash
  { line: "L08", hold: 0.0, shot(u, D, T, ln) {
    const a1 = nth(ln, "and"), a2 = nth(ln, "straight"), lift = ease(sg(u, 0, 0.7));
    if (u < a1) { HM.mood("gold"); const inh = Math.sin(sg(u, 0.5, 0.95) * Math.PI);
      return wrap(glassAt({ x: mv(u, 0, a1, 600, 540), y: mv(u, 0, a1, 960, 900), zoom: 1.05 }, HM.backdrop(T) + HM.piper({ x: 330, y: 3860, s: 15, ...HM.piperPose("stand", "play", lift), lean: lerp(0, 2, lift) - 4 * inh, tilt: 3 + 3 * inh, play: sg(u, 0.75, 1.0) }, T), T, { bars: false }), 0.6); }
    if (u < a2) {
      HM.mood("gold", "river", 0.3); const e = ease(sg(u, a1, a2)), px = lerp(660, 820, e);
      const swarm = HM.ratSwarm({ n: 70, seed: 6, box: [-40, 1560, px - 70, 1900], t: T, flow: [260, 0], size: [2.4, 4.2], amount: 1 });
      return wrap(glassAt({ x: lerp(520, 620, e), y: lerp(1470, 1500, e), zoom: lerp(1.1, 1.25, e) }, HM.gate(T, { open: 1 }) + swarm + HM.piper({ x: px, y: 1830, s: 3.1, dir: 1, ...HM.PIPER.play, play: 1, walk: u * 0.7 }, T), T), 0.7);
    }
    HM.mood("river"); const v = u - a2, tot = D - a2;
        const bx = (x) => HM.RIVER.bankY(x);
    // final check 27 Nov: the leap went DOWN onto the grass (water is above the bank line); now three rats run the bank
    // and leap UP into the water, a splash where each lands, camera closer on the bank
    let rat = "", spl = "";
    [[0, 41, 4.4], [0.16, 42, 3.8], [0.3, 43, 3.4]].forEach(([dl, sd, sz], k) => {
      const w = clamp((v - dl * tot) / (tot * 0.7)), run = clamp(w / 0.55), lf = clamp((w - 0.55) / 0.3), x0 = 120 + k * 40, x1 = 360 + k * 60, x2 = x1 + 120 + k * 30, y2 = bx(x1) - 150 - k * 40;
      if (w <= 0) return;
      if (run < 1) rat += HM.rat(lerp(x0, x1, run), bx(lerp(x0, x1, run)) - 6, sz, { pose: "run", dir: 1, seed: sd, ph: T * 3.2 });
      else if (lf < 1) rat += HM.rat(lerp(x1, x2, lf), lerp(bx(x1) - 6, y2, lf) - Math.sin(lf * Math.PI) * 120, sz, { pose: "leap", dir: 1, seed: sd, ph: lf * 2, rot: lerp(-30, 35, lf) });
      if (lf >= 1) spl += HM.splash(x2, y2 + 8, 70 + sz * 8, clamp((w - 0.85) / 0.15 * 0.95 + 0.05), 5 + k);
    });
    return wrap(glassAt({ x: lerp(420, 450, ease(clamp(v / tot))), y: 1250, zoom: 1.45 }, HM.river(T, { rats: 0 }) + rat + spl + HM.piper({ x: HM.RIVER.spot[0], y: HM.RIVER.spot[1], s: HM.RIVER.s, dir: -1, ...HM.PIPER.play, play: 1 }, T), T), 0.7); } },
  // 17. L09 the kid, hopeful
  { line: "L09", pre: 0.08, hold: 0, shot(u, D, T) {
    return TD(T, KC(u / D), { kid: { fx: 0.55, hand2face: 0, worry: 0 }, keeper: { flame: 1.4, stern: 0.2 } }); } },
  // 18. L10 "Wait." the flame dips; music stops dead
  { line: "L10", pre: 0.04, hold: 0.05, shot(u, D, T) {
    return TD(T, GCAM(u / D, 1.95, 2.15), { kid: null, keeper: { stern: 1, flame: tr([[0, 1.1], [0.45, 0.4]], u), grab: 0 }, jarCold: 0 }); } },
  // 19-20. L11 the mayor already laughing; the hall wider on "Why": his hand opens first, then three coins fall, the piper looks at the last bounce
  { line: "L11", pre: 0, hold: 0.05, shot(u, D, T, ln) {
    const a = nth(ln, "why", 0.55); HM.mood("gold", "brass", ease(sg(u, 0, D)));
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1030, 990), zoom: mv(u, 0, a, 1.0, 1.08) }, HM.backdrop(T, { seed: 3 }) + HM.mayor({ x: 520, y: 3060, s: 13.5, talk: talkAt("M", T), laugh: 1, look: 0.5 }, T), T, { bars: false }), 0.6);
    const open = ease(sg(u, a, a + 0.25)), rel = [0.3, 0.6, 0.9];
    const coins = [0, 1, 2].map((i) => {
      const f = clamp((u - a - rel[i]) / 0.45), [tx, ty] = COINS[i];
      if (u < a + rel[i]) return HM.gcoin(HANDM[0] - 6 * i, HANDM[1] + 8 - 6 * i, { r: 13 });   // still in his palm
      const bounce = f > 0.78 ? Math.sin((f - 0.78) / 0.22 * Math.PI) * 14 : 0;
      return HM.gcoin(lerp(HANDM[0] - 6 * i, tx, f), lerp(HANDM[1] + 8, ty, ease(f, "in")) - bounce, { r: 17, flip: f * (0.4 + i * 0.1) }); }).join("");
    return wrap(glassAt({ x: mv(u, a, D, 520, 580), y: mv(u, a, D, 1490, 1500), zoom: mv(u, a, D, 1.2, 1.3) }, hallFig(T, { laugh: 1 }) + HM.mayor({ x: 745, y: 1590, s: 3.4, dir: -1, laugh: 1, drop: open, talk: talkAt("M", T) }, T) + coins + HM.piper({ ...HM.PIPER.stand, x: 330, y: 1620, s: 3.4, tilt: tr([[a + 1.2, 0], [D, 10]], u), look: -0.4 }, T), T), 0.7); } },
  // 21. he leaves the coins and pivots (silent): same hall framing as the last shot, the mayor and both aides stay, he turns with the feet planted
  { line: null, dur: 1.1, shot(u, D, T) {
    HM.mood("brass"); const a = sg(u, 0.2, 0.95);
    return wrap(glassAt({ x: mv(u, 0, D, 580, 540), y: mv(u, 0, D, 1500, 1490), zoom: mv(u, 0, D, 1.3, 1.35) }, hallFig(T, { laugh: 0.6 }) + HM.mayor({ x: 745, y: 1590, s: 3.4, dir: -1, laugh: 0.7, drop: 1 }, T) + COINS.map(([x, y], i) => HM.gcoin(x, y, { r: 18, flip: [0, 0.1, 0.18][i] })).join("") + pivotPiper({ ...HM.PIPER.stand, ...HM.piperPose("stand", "away", a), x: 330, y: 1620, s: 3.4, look: -0.3, tilt: 6 * (1 - a) }, T, a), T), 0.7); } },
  // 22. L12 "He just left." over him crossing the gate; cut as his trailing foot clears the arch
  { line: "L12", hold: 0.34, shot(u, D, T) {
    HM.mood("brass", "moon", ease(sg(u, 0, D))); const e = ease(sg(u, 0, D, "in"));
    return wrap(glassAt({ x: 540, y: mv(u, 0, D, 1500, 1250), zoom: mv(u, 0, D, 1.1, 1.2) }, HM.gate(T, { moon: [200, 200, 54] }) + HM.piper({ ...HM.PIPER.away, x: 540, y: lerp(1790, 1380, e), s: lerp(3.1, 1.9, e), walk: u * 0.75, shadow: { len: 520, ang: 80 } }, T), T), 0.7); } },
  // 23. L13 grandmother: the push only on "He comes back", ending on her whole face with the low flame in frame
  { line: "L13", pre: 0.04, hold: 0, shot(u, D, T, ln) {
    const a = nth(ln, "he", 0.7);
    const c = u < a ? cam(u / a * 0.2, [0.64, 1.2, 2.05], [0.64, 1.2, 2.1]) : cam(sg(u, a, D), [0.64, 1.2, 2.1], [0.62, 1.2, 2.26]);
    return TD(T, c, { cold: tr([[0, 0.35], [D, 0.7]], u), kid: null, keeper: { stern: 1, flame: tr([[0, 0.45], [D, 0.3]], u), grab: 0 } }); } },
  // 24-25. L14 church windows with the seated silhouettes, then the piper takes one step into the moonlight
  { line: "L14", pre: 0.05, hold: 0, shot(u, D, T, ln) {
    const a = nth(ln, "he", 0.55); HM.mood("moon");
    if (u < a) return wrap(glassAt({ x: 540, y: mv(u, 0, a, 1050, 930), zoom: mv(u, 0, a, 1.1, 1.35) }, HM.church(T, { lit: 1 }), T), 0.7);
    const v = u - a, e = ease(sg(v, 0, 1.1));
    const pose = HM.piperPose("walk", "play", sg(v, 0.9, 1.7));
    return wrap(glassAt({ x: lerp(720, 700, e), y: lerp(1400, 1340, e), zoom: 1.5 }, HM.church(T, { lit: 1 }) + HM.piper({ ...pose, x: lerp(800, 770, e), y: lerp(1380, 1420, e), s: lerp(1.35, 1.6, e), dir: -1, walk: lerp(0, 0.5, ease(sg(v, 0, 1.0))), play: sg(v, 1.2, 1.8) }, T), T), 0.7); } },
  // 26. L15 the kid, a question
  { line: "L15", pre: 0.06, hold: 0, shot(u, D, T) {
    return TD(T, KC(u / D), { cold: 0.3, kid: { fx: 0.6, worry: 0.6, hand2face: 0 }, keeper: { flame: 0.45 } }); } },
  // 27. L16 "Like someone calling you home"
  { line: "L16", pre: 0.04, hold: 0, shot(u, D, T) {
    return TD(T, GCAM(u / D, 1.95, 2.15), { cold: 0.4, kid: null, keeper: { stern: 0.3, flame: 0.45 + 0.2 * Math.sin(T * 9) * Math.sin(T * 5.3), grab: 0 } }); } },
  // 28-32. L17 the first door opens ON the cut from "home", the children walk down the street to one vanishing point, the gate, the hill, the fog enters
  { line: "L17", pre: 0, hold: 0.0, shot(u, D, T, ln) {
    const tO = nth(ln, "out"), tU = nth(ln, "up"), tF = nth(ln, "into");
    if (u < tO) {   // one continuous shot: doors, then "down this street" (no cut between)
      HM.mood("moon"); const d0 = ease(sg(u, 0.0, 0.55)), d1 = ease(sg(u, 0.75, 1.3)), d2 = ease(sg(u, 1.25, 1.8)), d3 = ease(sg(u, 3.3, 3.8)), doors = d0 + d1 + d2 + d3;
      const ch = HM.church(T, { lit: 1, doors }), dr = HM.CHURCH.doors, v = sg(u, 0, tO);
      return wrap(glassAt({ x: lerp(480, 540, ease(v)), y: lerp(1420, 1500, ease(v)), zoom: lerp(1.2, 1.15, ease(v)) }, ch + HM.horseToy(TOY[0], TOY[1], { s: 2.6 }) + HM.piper({ ...HM.PIPER.away, pipe: 1, handF: [20, -160], handB: [12, -168], x: 548, y: 1320, s: 1.0, walk: T * 0.6 }, T) + churchKids(u, T, dr), T), 0.7);
    }
    if (u < tU) {   // out of the gate: the piper ahead, the blue boy leads the line through the arch
      HM.mood("moon"); const lead = mv(u, tO, tU, 0.12, 0.95, "linear"), path = [[330, 1960, 3.5], [470, 1760, 3.1], [540, 1580, 2.4], [540, 1440, 1.8]];
      const pe = ease(sg(u, tO, tU));
      return wrap(glassAt({ x: 540, y: mv(u, tO, tU, 1600, 1330), zoom: mv(u, tO, tU, 1.1, 1.2) }, HM.gate(T, { open: 1, moon: [200, 200, 54] }) + HM.piper({ ...HM.PIPER.away, pipe: 1, handF: [20, -160], handB: [12, -168], x: 540, y: lerp(1420, 1300, pe), s: lerp(1.7, 1.2, pe), walk: T * 0.6 }, T) + kidsOn(path, lead, 0.12, T, 8), T), 0.7);
    }
    HM.mood("moon", "fog", 0.12 + 0.3 * ease(sg(u, tF, D)));
    const lead = mv(u, tU, D, 0.12, 0.85, "linear"), fog = u < tF ? 0.05 : mv(u, tF, D, 0.1, 0.5);
    return wrap(glassAt({ x: 540, y: mv(u, tU, D, 1500, 1090), zoom: 1.2 }, HM.hill(T, { moon: [860, 210, 62], stars: 1 }) + kidsOn(HM.HILL.path, lead, 0.1, T, 9) + HM.piper({ x: 548, y: 808, s: 0.62, ...HM.PIPER.away, pipe: 1, handF: [20, -160], handB: [12, -168] }, T) + HM.fogDoors(fog, T), T), 0.6); } },
  // 33-34. L18 the fog keeps moving through "closed behind them", seals; 3 frames later the same toy at the same curb
  { line: "L18", pre: 0.08, hold: 1.1, shot(u, D, T, ln) {
    const d = ln.dur, seal = Math.min(d - 0.05, ln.words[ln.words.length - 1][2] + 0.03), tA = nth(ln, "and", 1), tC = nth(ln, "closed");
    if (u < seal + 0.07) {   // kids readable through "children.", the doors roll in on "And the fog closed", the seam shuts on the end of "them."; cut 3 frames later
      const f = tr([[0, 0.1], [tA, 0.3, "linear"], [tC + 0.3, 0.66, "linear"], [seal, 0.87, "linear"]], u); HM.mood("moon", "fog", 0.4 + 0.6 * f);
      return wrap(glassAt({ x: 540, y: mv(u, 0, d, 1090, 1000), zoom: mv(u, 0, d, 1.15, 1.05) }, HM.hill(T, { moon: [860, 210, 62] }) + kidsOn(HM.HILL.path, mv(u, 0, d, 0.78, 0.97, "linear"), 0.1, T, 9) + HM.fogDoors(f, T), T, { light: 1 }), 0.6);
    }
    const v = u - seal - 0.07, e = ease(sg(v, 0, 0.9, "out")); HM.mood("moon", "fog", 0.35);
    return wrap(glassAt({ x: lerp(470, 440, e), y: lerp(1500, 1470, e), zoom: lerp(1.35, 1.5, e) }, HM.church(T, { lit: 0.6, doors: 3 }) + HM.horseToy(TOY[0], TOY[1], { s: 2.6 }), T, { light: 0.9 }), 0.6); } },
  // 35-37. L19 the two children at the fork / the crutch step (camera still) / the girl's one glance up the path
  { line: "L19", pre: 0.05, hold: 0, shot(u, D, T, ln) {
    const a1 = nth(ln, "one", 0) - 0.1, a2 = nth(ln, "one", 1) - 0.1; HM.mood("dawn");
    const s1 = ease(sg(u, a1 + 0.3, a1 + 0.5)), s2 = ease(sg(u, a1 + 0.85, a1 + 1.35)), plant = Math.sin(clamp((u - a1 - 0.85) / 0.5) * Math.PI), hop = Math.sin(clamp((u - a1 - 0.3) / 0.2) * Math.PI) * 6;
    const boy = HM.child({ x: HM.HILL.foot[0] + s1 * 14 + s2 * 34, y: HM.HILL.foot[1] - hop - plant * 12, s: 4.2, kind: "crutch", seed: 5, h: 118 }, T), girl = HM.child({ x: HM.HILL.girl[0], y: HM.HILL.girl[1], s: 4.2, kind: "girl", seed: 8, h: 92, look: tr([[a2, 0], [a2 + 0.7, -1]], u) }, T), set = HM.hill(T, { open: 0 });
    if (u < a1) return wrap(glassAt({ x: 540, y: mv(u, 0, a1, 1400, 1330), zoom: mv(u, 0, a1, 1.0, 1.1) }, set + boy + girl, T), 0.6);
    if (u < a2) return wrap(glassAt({ x: 400, y: 1690, zoom: 1.45 }, set + boy + girl, T, { bars: false }), 0.6);
    return wrap(glassAt({ x: mv(u, a2, D, 740, 760), y: mv(u, a2, D, 1700, 1660), zoom: mv(u, a2, D, 1.4, 1.5) }, set + boy + girl, T, { bars: false }), 0.6); } },
  // 38. L20 the kid: his smile drops, a small recoil
  { line: "L20", pre: 0.05, hold: 0, shot(u, D, T) {
    return TD(T, KC(u / D), { cold: 0.4, kid: { fx: u < 0.4 ? 0.6 : -0.35, worry: tr([[0, 0.2], [0.5, 0.8]], u), lean: tr([[0.2, 0], [0.6, -4]], u), hand2face: 0 }, keeper: { flame: 0.35 } }); } },
  // 39-41. L21 the chronicle (the whole quote on the page), the beam once, one short push down the empty street
  { line: "L21", pre: 0.05, hold: 0, shot(u, D, T, ln) {
    const a1 = nth(ln, "and", 0) - 0.12, a2 = nth(ln, "nobody", 0.6) - 0.08;
    if (u < a1) return wrap(HM.chronicle({ y: mv(u, 0, a1, 0.05, 0.55), zoom: mv(u, 0, a1, 1.0, 1.1) }, T), 1);
    if (u < a2) return wrap(HM.beamInsert({ x: mv(u, a1, a2, 0.7, 0.3), zoom: mv(u, a1, a2, 1.2, 1.1) }, T, { light: 0.8 }), 1);
    return TD(T, cam(sg(u, a2, D), [0.1, 1.4, 0.3], [0.1, 1.3, 1.3], "out"), { cold: tr([[a2, 0.5], [a2 + 1.0, 0]], u), kid: null, keeper: null }); } },
  // 42. L22 "Now." her hand comes out toward the boy, attached to her arm (the jar in frame)
  { line: "L22", pre: 0.0, hold: 0, shot(u, D, T, ln) {
    return TD(T, TWO(u / D), { cold: 0, kid: { fx: 0.7, hand2face: 0 }, keeper: { stern: 1, flame: tr([[0, 0.6], [D, 1.0]], u), grab: 0 }, palm: { ext: ease(sg(u, 0.0, 0.5, "out")) } }); } },
  // 43. L23 "Right now?"   44. L24 "Right now."
  { line: "L23", pre: 0.05, hold: 0.1, shot(u, D, T) {
    return TD(T, KC(u / D), { kid: { fx: 0.7, hand2face: 0, worry: 0.2, lean: -3 }, keeper: { flame: 0.95 } }); } },
  { line: "L24", pre: 0.0, hold: 0.0, shot(u, D, T) {
    return TD(T, GCAM(u / D, 1.95, 2.15), { kid: null, keeper: { stern: 0.7, flame: 1.0, grab: 0 } }); } },
  // 45. payment: his fingers carry the coin over her palm, let go, it lands; she closes her fingers; the jar rises warm (jar in frame)
  { line: null, dur: 1.2, shot(u, D, T) {
    const a = u / D;
    return TD(T, TWO(a * 0.0), { kid: { fx: 0.7, hand2face: 0 }, keeper: { stern: 0.5, flame: tr([[0.5, 1.0], [D, 1.6]], u), grab: 0 }, palm: { ext: 1, cup: tr([[0.7, 0], [0.95, 1]], a), coin: a >= 0.62 && a < 0.93 }, pay: a }); } },
  // 46. two-shot with both faces and the jar: three far notes, she lowers her hand, both freeze and look the same way, a cold flicker on the jar, hard cut
  { line: null, dur: 2.3, end: true, shot(u, D, T) {
    const look = ease(sg(u, 0.23, 0.5));
    return TD(T, TWO(0.0), { kid: { fx: lerp(0.7, -0.9, look), hand2face: 0, blink: 0, worry: 0.2 }, keeper: { fx: lerp(-0.7, -0.95, look), stern: 0.6, flame: u > 1.53 && u < 1.95 ? 0.35 : 1.4, grab: 0, blink: 0 }, palm: { ext: 1 - ease(sg(u, 0.1, 0.4)), cup: 1, coin: false }, jarCold: u > 1.53 && u < 1.95 ? 1 : 0 }); } },
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
GLOW0 = by("L03").lineAt + by("L03").d - 0.22; GLOW1 = by("L04").lineAt + 0.22;
export const TIMELINE = TL;

// ---------------------------------------------------------------- captions: WRITTEN words, word-timed, upper third
const KEY = /^(rats?|piper|children|fog|music|1284|coins?|river|hamelin|wait|gone|twenty|hundred|thousand|five|euros?)/i;
// Jonny 27 Nov "captions are a bit messy": the line no longer re-centres and re-sizes on every word. Each chunk (2-4 written words, broken at punctuation, no lone word unless it is a sentence) shows WHOLE from its
// first word's start, at one fixed size per chunk, and stays put until the next chunk.
function chunksOf(words) {
  const phrases = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); if (/[.,?!…]$/.test(w[0]) || i === words.length - 1) { phrases.push(cur); cur = []; } });
  for (let i = phrases.length - 2; i >= 0; i--) if (phrases[i].length === 1 && /,$/.test(phrases[i][0][0])) phrases.splice(i, 2, [...phrases[i], ...phrases[i + 1]]);
  const out = [];
  for (const ph of phrases) {   // a phrase over 5 words splits into balanced pieces of about 3-4, never a lone word
    const k = ph.length > 5 ? Math.ceil(ph.length / 4) : 1, size = Math.ceil(ph.length / k);
    for (let i = 0; i < ph.length; i += size) out.push(ph.slice(i, i + size));
  }
  return out;
}
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.2, x.end));
  if (!b || !b.ln.cap.length) return "";
  const u = time - b.lineAt, chunks = b.ln.chunks || (b.ln.chunks = chunksOf(b.ln.cap));
  if (u < chunks[0][0][1] - 0.04) return "";
  let ci = 0; while (ci + 1 < chunks.length && u >= chunks[ci + 1][0][1] - 0.04) ci++;
  const ch = chunks[ci], str = ch.map((w) => w[0]).join(" ");
  // Jonny 27 Nov: "the words appear with the spoken word": the chunk is laid out whole (no resize, no re-centre),
  // each word stays invisible until its own start time
  const txt = ch.map((w) => { const on = u >= w[1] - 0.04 ? 1 : 0; return `<tspan fill="${KEY.test(norm(w[0])) ? "#ffc04a" : "#ffffff"}" fill-opacity="${on}" stroke-opacity="${on}">${w[0].replace(/&/g, "&amp;")}</tspan>`; }).join(" ");
  return `<text x="540" y="480" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${n(Math.min(74, 74 * 22 / Math.max(1, str.length)))}" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds(); HM.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = Math.max(0, time - b.lineAt), D = b.d + (b.hold || 0);
  const svg = b.shot(u, D, time, b.ln, b);
  return svg + `${process.env.NOCAP ? "" : captions(time)}</svg>`;
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
  bed("pp-dusk", 0, GLOW0 + 0.3, 0.1, 0.8);
  bed("pp-glass", GLOW0 + 0.1, T("L05", 1.5), 0.6, 1.0);
  bed("pp-rats", T("L05", 0.8), dead, 1.0, 0.012);
  bed("pp-cheat", E("L10") + 0.05, T("L13", 0.3), 0.3, 1.0);
  bed("pp-night", T("L13", 1.6), T("L17", wordAt(LINE.L17, "fog", 0.9) + 0.4), 1.5, 3.0, 1);
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
  const cut = by("L01").lineAt + 0.03;
  play("D", 1, 0.02, 0.26, 0.5); play("F", 1, 0.29, Math.max(0.15, cut - 0.29), 0.5);
  // rat tune 6/8 (8th 8th 8th qtr 8th, dotted quarter 104) under L08
  const e8 = 60 / 104 / 1.5, rat = [["D", e8], ["F", e8], ["G", e8], ["E", 2 * e8], ["D", e8]];
  for (let r = 0; r < 3; r++) { let at = T("L08", 0.5 + r * 1.75); if (at + 1.2 > dead + 99) break; for (const [nm, du] of rat) { play(nm, 0, at, du * 0.95, 0.4); at += du; } }
  // children's tune, legato, D F G | E D (qtr qtr half | qtr dotted half) at 60 BPM, low
  const kids = [["D", 1], ["F", 1], ["G", 2], ["E", 1], ["D", 3]];
  const phrase = (at, g) => { for (const [nm, du] of kids) { play(nm, 0, at, du + 0.18, g); at += du; } };
  phrase(E("L16") - 0.05, 0.38);
  // the final call: G E D, distant and dark, then the hard cut
  const last = TL[TL.length - 1], f0 = last.lineAt + 0.23;
  [["G", 0], ["E", 0.65], ["D", 1.3]].forEach(([nm, o]) => play(nm, 0, f0 + o, 0.6, 0.45, "far"));
  // real sounds
  const sfx = (p) => `assets/sfx/${p}`, anyOf = (dir) => firstFile(`assets/sfx/${dir}`);
  add(anyOf("ai/rats-scurry"), by("L04").lineAt + 0.1, 0.55, "loudnorm=I=-30:TP=-6,");
  add(anyOf("ai/rats-scurry"), by("L08").lineAt + 0.9, 0.4, "loudnorm=I=-32:TP=-6,atrim=0:2.8,afade=t=out:st=2:d=0.8,");
  { const b8 = by("L08"), a2 = nth(b8.ln, "straight"), tot = b8.end - b8.lineAt - a2;   // one splash per rat landing (river shot)
    [[0, 0.5], [0.16, 0.32], [0.3, 0.25]].forEach(([dl, g]) => add(sfx("ai/swim-splash/") + (readdirSyncSafe("assets/sfx/ai/swim-splash")[0] || ""), b8.lineAt + a2 + dl * tot + 0.595 * tot, g)); }
  add(anyOf("ai/men-laugh"), by("L11").lineAt + 0.1, 0.5, "loudnorm=I=-26:TP=-5,atrim=0:2.4,afade=t=out:st=1.8:d=0.6,");
  for (let i = 0; i < 2; i++) add(sfx("kenney/impact/impactBell_heavy_00" + i + ".ogg"), by("L14").lineAt + 0.15 + i * 1.6, 0.3, "lowpass=f=900,aecho=0.6:0.5:120|260:0.35|0.2,");   // a far bell: library bell, low-passed, quiet
  add(anyOf("ai/fog-air"), by("L17").lineAt + wordAt(LINE.L17, "up", 0.7), 0.6, `loudnorm=I=-32:TP=-8,aloop=loop=-1:size=2e9,atrim=0:${(by("L19").end - by("L17").lineAt - wordAt(LINE.L17, "up", 0.7)).toFixed(2)},afade=t=in:d=1.5,afade=t=out:st=${(by("L19").end - by("L17").lineAt - wordAt(LINE.L17, "up", 0.7) - 1.5).toFixed(2)}:d=1.5,`);
  const coinFile = sfx("kenney/rpg/handleCoins.ogg");
  add(coinFile, by("L06").lineAt + wordAt(LINE.L06, "thousand", 0.6) - 0.1, 0.5);
  [0, 1, 2].forEach((i) => add(sfx(`kenney/rpg/handleCoins${i === 1 ? "2" : ""}.ogg`), by("L11").lineAt + wordAt(LINE.L11, "why", 0.55) + 0.45 + i * 0.3, 0.45));
  { const pay = TL.find((b) => b.line === null && b.dur === 1.2); if (pay) add(sfx("kenney/rpg/handleCoins2.ogg"), pay.lineAt + 0.7, 0.6); }
  for (let i = 0; i < 3; i++) add(sfx(i % 2 ? "kenney/rpg/doorOpen_2.ogg" : "kenney/rpg/doorOpen_1.ogg"), by("L17").lineAt + [0.3, 1.2, 1.75][i], 0.35);
  const sc = readdirSyncSafe("assets/sfx/ai/step-concrete");
  if (sc.length) for (let i = 0; i < 14; i++) add(`assets/sfx/ai/step-concrete/${sc[i % sc.length]}`, by("L17").lineAt + wordAt(LINE.L17, "and", 0.33) + i * 0.3, 0.12, "lowpass=f=2500,");
  const mixPath = `${OUT}/mix.wav`, k = ins.length / 2;
  if (miss.length) console.log("WARNING missing sound files (skipped): " + [...new Set(miss)].join(", "));
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0:dropout_transition=0,apad=whole_dur=${DUR.toFixed(2)},atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +b.d.toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
function readdirSyncSafe(d) { try { return readdirSync(d).filter((x) => /\.(wav|ogg)$/.test(x)).sort(); } catch { return []; } }
