// Legend 03: Urashima Taro, code-drawn 2D folklore short. Rendered by tools/svg2d/render.mjs.
// Timeline is built from the real voice takes (out/legend-urashima/vpost); shots cut on word times.
//   node tools/svg2d/render.mjs storyboards/series/legend/urashima/urashima.mjs out/legend-urashima/urashima-draft1.mp4
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
import * as SEA from "../../../../tools/svg2d/lib/legend-sea.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const OUT = "out/legend-urashima", VOICE = `${OUT}/vpost`;
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/urashima/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null, ch = 1;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") { ch = b.readUInt16LE(o + 10); sr = b.readUInt32LE(o + 12); } if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  const s = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1)));
  return { sr, s, ch };
}
// whisper writes "300" / "19." where the line says "three hundred" / "nineteen.": expand, then align the written
// words to the heard ones (shared lib, PR #338) so a differing word never throws the captions off
function cues(ln, ws) {
  const out = [];
  for (const w of ws) {
    const g = w[0].replace(/[^a-z0-9]/gi, "");
    if (g === "300") { const m = (w[1] + w[2]) / 2; out.push(["three", w[1], m], ["hundred", m, w[2]]); }
    else if (g === "19") out.push(["nineteen", w[1], w[2]]);
    else out.push(w);
  }
  return align(ln.text.split(/\s+/), out);
}
// edit round 1: trims. KEEP = inclusive heard-word index ranges kept per line (joined by SIL s of silence); TEXT/CAPS = the written line / caption phrases after the cut
const KEEP = { L02: [[1, 2]], L07: [[0, 8]], L16: [[0, 5]], L08: [[0, 3], [4, 9]], L27: [[0, 0], [1, 3]], L28: [[0, 2]] };
const TEXT = { L02: "What's inside?", L07: "The turtle carried him down, to the Dragon Palace.", L16: "Back home, the pines were giants." };
const CAPS = { L02: "What's inside?", L07: "The turtle carried him down,|to the Dragon Palace", L16: "Back home,|the pines were giants.", L08: "You saved my messenger.|Stay as long as you like." };
const SIL = 0.14, PAD = 0.03;
delete LINE.L19;
for (const ln of Object.values(LINE)) {
  if (TEXT[ln.id]) ln.text = TEXT[ln.id];
  const { sr, s, ch } = readWav(`${VOICE}/${ln.id}.wav`);
  const all = JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8"));
  const nS = s.length / ch, mono = new Float32Array(nS); for (let i = 0; i < nS; i++) mono[i] = s[i * ch] / 32768;
  const keep = KEEP[ln.id] || [[0, all.length - 1]];
  let mx0 = 0; for (let i = 0; i < nS; i++) mx0 = Math.max(mx0, Math.abs(mono[i]));
  const voiced = (i) => { let a = 0; const w = Math.round(sr * 0.01); for (let j = i; j < Math.min(nS, i + w); j++) a += mono[j] * mono[j]; return Math.sqrt(a / w) > mx0 * 0.03; };
  const parts = [], words = []; let at = 0; ln.segs = [];
  keep.forEach(([i0, i1], k) => {
    let a = KEEP[ln.id] && (i0 > 0 || ln.id === "L27") ? Math.max(all[i0][1] - PAD, i0 > 0 ? all[i0 - 1][2] : 0) : 0;
    let b = KEEP[ln.id] ? Math.min(nS / sr, all[i1][2] + PAD) : nS / sr;
    if (KEEP[ln.id]) { let e = Math.floor(b * sr); while (e > a * sr + sr * 0.1 && !voiced(e - Math.round(sr * 0.01))) e -= Math.round(sr * 0.005); b = Math.min(b, e / sr + 0.05); }
    const i0s = Math.floor(a * sr), i1s = Math.floor(b * sr); parts.push(mono.subarray(i0s, i1s)); ln.segs.push([a, b]);
    for (let w = i0; w <= i1; w++) words.push([all[w][0], at + Math.max(0, all[w][1] - a), at + Math.min(b - a, all[w][2] - a)]);
    at += b - a; if (k < keep.length - 1) { parts.push(new Float32Array(Math.round(SIL * sr))); at += SIL; }
  });
  const tot = parts.reduce((x, p) => x + p.length, 0), out = new Float32Array(tot); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
  ln.cut = !!KEEP[ln.id]; ln.dur = tot / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < tot; i += hop) { let a = 0; for (let j = i; j < Math.min(tot, i + hop); j++) a += out[j] ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = cues(ln, words);
  const cap = CAPS[ln.id] ?? SPEC.captions?.[ln.id];
  ln.phr = phrases(ln.words, ln.text, cap);
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)); return w ? w[1] : ln.dur * frac; };

// ---------------------------------------------------------------- helpers
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e), h0: lerp(a[3], b[3] ?? a[3], e) }; };
const C = (x, y, z, h0 = 1020) => [x, y, z, h0];
const B = SEA.BEACH;

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
// shot(v, d, T, ln): v = seconds since the line starts (negative in a pre-gap), d = line length
const GAP = { L01: 0.15, L02: 0.15, L03: 0.45, L04: 0.3, L05: 0.1, L06: 0.4, L07: 0.35, L08: 0.4, L09: 0.3, L10: 0.1, L11: 0.1, L12: 0.2, L13: 0.4, L14: 0.1, L15: 0.45, L16: 1.0, L17: 0.4, L18: 0.3, L20: 0.35, L21: 0.4, L22: 0.2, L23: 0.2, L24: 0.5, L25: 0.45, L26: 0.2, L27: 0 };
const BEATS = [];
const beat = (line, shot, o = {}) => BEATS.push({ line, shot, ...o });

// flame meter (fear): calm, smaller at L11, tiny at L23, back to normal at L26
let FLAME = () => 1;
const flameAt = (T) => {
  const at = (id) => TL.find((b) => b.line === id).lineAt;
  return tr([[0, 1], [at("L03") + LINE.L03.words[1][1] - 0.05, 1], [at("L03") + LINE.L03.words[1][1] + 0.6, 0.7], [at("L11") - 0.1, 0.85], [at("L11") + 1.2, 0.55], [at("L18"), 0.55], [at("L18") + 1.5, 0.42], [at("L23") - 0.2, 0.42], [at("L23") + 0.3, 0.2], [at("L25") + 3.5, 0.2], [at("L26"), 0.2], [at("L26") + 0.7, 1]], T);
};
const talkOf = (who, T) => { for (const b of TL) if (b.ln && b.ln.who === who && T >= b.lineAt && T < b.lineAt + b.d) return b.ln.env[Math.floor((T - b.lineAt) * FPS)] || 0; return 0; };

const hosts = (c, T, o = {}) => {
  const kid = o.kid === null ? "" : L.kid(c, { X: B.kid.X, Z: B.kid.Z, fx: 0.7, blink: blinkAmt(T % 3.3, [1.1]), talk: talkOf("K", T), ...(o.kid || {}) }, T).svg;
  const kp = o.keeper === null ? "" : (() => { const k = L.keeper(c, { X: B.keeper.X, Z: B.keeper.Z, fx: -0.7, stern: 0.6, flame: flameAt(T), blink: blinkAmt(T % 3.9, [2.4]), talk: talkOf("G", T), ...(o.keeper || {}) }, T); return k.svg + (o.noArm ? "" : k.arm || ""); })();
  return kid + kp;
};
const beachBox = (c, T, o = {}) => SEA.box(c, { ...B.box, worn: 1, ...o }, T).svg;
const beach = (c, T, o = {}) => SEA.beach(c, T, { sun: [860, 250, 70], ...o });
const CL = B.cam.close, CA = B.closeAt;
// single close-ups (designer's preset): one face per shot, head and shoulders, the other character out of frame
const ob = (a) => ({ x: a[0], y: a[1], z: a[2], h0: a[3] ?? 1020 });
const closeCam = (u, dz = 0.2, dx = 0, dy = 0) => ({ ...CL, x: CL.x + dx, z: CL.z + dz * ease(clamp(u)), h0: CL.h0 + dy });
const kidClose = (T, u, o = {}, sun = [860, 250, 70], gold = false) => { const c = closeCam(u, 0.2, CA.kid.X), b = SEA.beach(c, T, { sun: gold ? [230, 760, 120] : sun, glitter: gold ? [230] : undefined, boat: false, ...(o.beach || {}) }); return { c, svg: (o.wash ? SEA.wash(b.back) : b.back) + hosts(c, T, { kid: { ...CA.kid, ...(o.kid || {}) }, keeper: null }) + b.front }; };
const keeperClose = (T, u, o = {}, sun = [860, 250, 70], gold = false) => { const c = closeCam(u, 0.2, CA.keeper.X + (o.dx || 0), o.dy ?? 230), b = SEA.beach(c, T, { sun: gold ? [230, 760, 120] : sun, glitter: gold ? [230] : undefined, boat: false }); return { c, svg: b.back + hosts(c, T, { kid: null, keeper: { ...CA.keeper, ...(o.keeper || {}) }, noArm: o.noArm }) + (o.extra ? o.extra(c) : "") + b.front }; };

// ---- drawn locally (the design lib has no village kids, villager or small hands)
const INKC = "#1a1328", SKINK = "#e6bf9e";
// a hand in local cm, wrist at the origin, fingers up: ext = how far each of the four fingers stands (0 curled .. 1 out)
function handSvg(k, ext = [1, 1, 1, 1], rot = 0, thumb = 1, fill = SKINK) {
  const len = [7.5, 9, 8.5, 6.5];
  const fing = ext.map((e, i) => { const l = lerp(2.2, len[i], e); return `<rect x="${-4 + i * 2}" y="${-9 - l}" width="2" height="${l + 2}" rx="1" fill="${fill}"/>`; }).join("");
  const th = `<ellipse cx="-4.6" cy="${-3.5 - 1.5 * thumb}" rx="1.5" ry="${2 + 1.4 * thumb}" transform="rotate(${-20 - 15 * thumb} -4.6 -3.5)" fill="${fill}"/>`;
  return `<g transform="rotate(${n(rot)}) scale(${n(k)})" stroke="${INKC}" stroke-width="0.55" stroke-linejoin="round">${th}${fing}<path d="M-4.2,1 Q-5,-5 -4.2,-9.5 L4.2,-9.5 Q5,-5 4.2,1 Z" fill="${fill}"/><path d="M-2,-9.3 L-2,-6 M0,-9.3 L0,-6 M2,-9.3 L2,-6" stroke-width="0.35" fill="none"/></g>`;
}
// ---- edit round 1 helpers
const SKINK2 = "#f3cdb0", SLEEVE_KID = "#e8476a", SLEEVE_URA = "#2850b8";
const toS = L.toScreen;
// a forearm from the frame edge ending in a hand that pinches `tip` (fingers point along ang deg, 0 = up, + clockwise)
function pinchHand(tip, ang, k, o = {}) {
  const a = ang * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), wr = { x: tip.x - dx * 13 * k, y: tip.y - dy * 13 * k }, far = { x: wr.x - dx * 900, y: wr.y - dy * 900 };
  const sl = o.sleeve || SLEEVE_KID, sk = o.skin || SKINK2, w = 7.2 * k;
  const arm = `M${n(far.x)},${n(far.y)} L${n(wr.x)},${n(wr.y)}`;
  return `<path d="${arm}" stroke="${INKC}" stroke-width="${n(w + 3)}" stroke-linecap="butt" fill="none"/><path d="${arm}" stroke="${sl}" stroke-width="${n(w)}" fill="none"/>
  <g transform="translate(${n(wr.x)},${n(wr.y)})"><path d="M${n(-dy * 4.2 * k)},${n(dx * 4.2 * k)} L${n(dy * 4.2 * k)},${n(-dx * 4.2 * k)}" stroke="#f2a93b" stroke-width="${n(2 * k)}" transform="translate(${n(-dx * 3 * k)},${n(-dy * 3 * k)})"/>${handSvg(k, o.ext || [0.55, 0.6, 0.5, 0.4], ang, o.thumb ?? 0.8, sk)}</g>`;
}
// box close-up insert (a box on a fixed close camera). o: { lid, cord, hinge, kid | ura hand, handAt: u, bg }
const BOXC = { x: 0.08, y: 0.2, z: 3.3, h0: 1000 };
const boxPts = (c, bx, o, t) => {   // screen point of the bow and of the lid's near edge
  const q = L.P(c, bx.X, bx.Y || 0, bx.Z), sc = q.s / 100;
  const lp = (x, y) => { if (bx.hinge) { const a = o * 34 * Math.PI / 180, dx = x - 8, dy = y + 29; return [8 + dx * Math.cos(a) - dy * Math.sin(a), -29 + dx * Math.sin(a) + dy * Math.cos(a)]; } const a = -o * 24 * Math.PI / 180, dx = x + 6, dy = y + 24; return [-6 + dx * Math.cos(a) - dy * Math.sin(a) - o * 5, -24 + dx * Math.sin(a) + dy * Math.cos(a) - o * 12]; };
  const f = (x, y) => { const [lx, ly] = lp(x, y); return { x: q.x + lx * sc, y: q.y + ly * sc }; };
  return { bow: f(1, -22.6), edge: f(-12, -22), sc, q };
};
function drawStaffAt(c, X, Y, Z, rot, T) { return SEA.staff(c, { X, Y, Z, rot, flame: 0.8 }, T); }

// the old-days village kid with proper arms, hands and feet. st: { X, Z, fx, run, sa (stick angle deg, 0 up .. 130 down-forward), hair, col, grip: [sx, sy] screen point the stick must pass through }
function oldKid(c, st) {
  const p = L.P(c, st.X, 0, st.Z), k = p.s / 100, d = (st.fx ?? 0.7) > 0 ? 1 : -1, sw = st.run == null ? 0 : Math.sin(st.run * Math.PI * 2), bob = st.run == null ? 0 : -Math.abs(sw) * 3;
  const col = st.col || ["#a8793f", "#8a8378", "#c29a45"][st.hair || 0], skin = "#e8bd98", skinD = "#c99a74";
  const sh = [d * 6, -78 + bob], sa = (st.sa ?? 40) * Math.PI / 180, arm = 27;
  const hand = [sh[0] + d * Math.sin(sa) * arm, sh[1] - Math.cos(sa) * arm]; const dir = [d * Math.sin(sa), -Math.cos(sa)];
  let len = 62;
  if (st.aim) { const vx = (st.aim.x - (p.x + k * hand[0])) / k, vy = (st.aim.y - (p.y + k * (hand[1] + bob))) / k, l = Math.hypot(vx, vy) || 1; dir[0] = vx / l; dir[1] = vy / l; len = Math.max(62, l * 1.4); }
  const tip = [hand[0] + dir[0] * len, hand[1] + dir[1] * len], back = [hand[0] - dir[0] * 10, hand[1] - dir[1] * 10];
  const el = [(sh[0] + hand[0]) / 2 - d * 4, (sh[1] + hand[1]) / 2 + 7];
  const hair = st.hair === 1 ? `<path d="M-9.5,-95 Q-9,-106 0,-106 Q9,-106 9.5,-95 Q4,-99 0,-99 Q-4,-99 -9.5,-95 Z" fill="#1d1829"/><circle cx="${d}" cy="-109" r="3.6" fill="#1d1829"/>` : st.hair === 2 ? `<path d="M-10,-93 Q-11,-106 0,-106 Q11,-106 10,-93 L8,-97 Q0,-101 -8,-97 Z" fill="#1d1829"/>` : `<path d="M-8,-99 Q0,-104 8,-99" stroke="#6b5a4a" stroke-width="0.8" fill="none" opacity="0.7"/>`;
  const leg = (sd, sg) => { const kx = sd * 4 + sg * sw * 4, fx2 = sd * 5 + sg * sw * 11, lift = Math.max(0, sg * sw) * 5; return `<path d="M${sd * 3.5},-44 L${n(kx)},-24 L${n(fx2)},${n(-5 - lift)}" stroke="${INKC}" stroke-width="6.4" fill="none"/><path d="M${sd * 3.5},-44 L${n(kx)},-24 L${n(fx2)},${n(-5 - lift)}" stroke="#d9a982" stroke-width="4.4" fill="none"/><path d="M${n(fx2 - 5)},${n(-5 - lift)} L${n(fx2 + d * 8)},${n(-5 - lift)} Q${n(fx2 + d * 10)},${n(-1.2 - lift)} ${n(fx2 + d * 7)},${n(-0.6 - lift)} L${n(fx2 - 5)},${n(-0.6 - lift)} Z" fill="#6b5236"/><path d="M${n(fx2 - 1)},${n(-5 - lift)} l${d * 5},3" stroke="#3a2a1a" stroke-width="0.7"/>`; };
  const fist = (x, y) => `<circle cx="${n(x)}" cy="${n(y)}" r="3.5" fill="${skin}"/><path d="M${n(x - 1.6)},${n(y - 2.6)} l0,5.2 M${n(x + 0.2)},${n(y - 2.8)} l0,5.6" stroke="${skinD}" stroke-width="0.6"/>`;
  const svg = `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(k)})" stroke="${INKC}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="0" cy="1" rx="17" ry="3" fill="#0003" stroke="none"/>
    <g transform="translate(0,${n(bob)})">${leg(-1, 1)}${leg(1, -1)}
    <path d="M${-d * 6},-78 L${-d * 10},-62 L${-d * 7},-46" stroke="${INKC}" stroke-width="6" fill="none"/><path d="M${-d * 6},-78 L${-d * 10},-62 L${-d * 7},-46" stroke="${skinD}" stroke-width="4" fill="none"/>${fist(-d * 7, -45)}
    <path d="M-10,-82 L10,-82 L13,-42 L-13,-42 Z" fill="${col}"/><path d="M-13,-60 L13,-60 L13.4,-55 L-13.4,-55 Z" fill="#4a3a2a"/><path d="M${-d * 3},-82 L${d * 4},-52" stroke="#00000030" stroke-width="1"/>
    <path d="M${-d * 1},-76 L${n(sh[0])},${n(sh[1])}" stroke="${col}" stroke-width="7"/>
    <path d="M${n(back[0])},${n(back[1])} L${n(tip[0])},${n(tip[1])}" stroke="${INKC}" stroke-width="4.4" fill="none"/><path d="M${n(back[0])},${n(back[1])} L${n(tip[0])},${n(tip[1])}" stroke="#7b5a34" stroke-width="2.6" fill="none"/>
    <path d="M${n(sh[0])},${n(sh[1])} Q${n(el[0])},${n(el[1])} ${n(hand[0])},${n(hand[1])}" stroke="${INKC}" stroke-width="6.6" fill="none"/><path d="M${n(sh[0])},${n(sh[1])} Q${n(el[0])},${n(el[1])} ${n(hand[0])},${n(hand[1])}" stroke="${skin}" stroke-width="4.6" fill="none"/>${fist(hand[0], hand[1])}
    <rect x="-3" y="-91" width="6" height="9" fill="${skin}"/><circle cx="0" cy="-95" r="10" fill="${skin}"/>${hair}<circle cx="${d * 4.2}" cy="-95" r="0.9" fill="${INKC}"/><circle cx="${d * 8}" cy="-95" r="0.9" fill="${INKC}"/><path d="M${d * 4},-90 q${d * 2},1.4 ${d * 4},0" fill="none" stroke-width="0.7"/></g></g>`;
  const S = (q) => ({ x: p.x + k * q[0], y: p.y + k * (q[1] + bob) });
  return { svg, hand: S(hand), tip: S(tip), p, k };
}
// the old villager woman: straw hat, rust coat, hands wrapped round a crook cane, two legs with sandals. st: { X, Z, fx, talk, blink, gest 0..1 }
function villager(c, st, T) {
  const p = L.P(c, st.X, 0, st.Z), k = p.s / 100, d = (st.fx ?? -0.7) > 0 ? 1 : -1, tk = st.talk || 0, bl = st.blink || 0, gest = st.gest || 0;
  const skin = "#d6a47e", skinD = "#b2805e", coat = "#9a4a2a", coatS = "#74361e", hat = "#dcbe74";
  const leg = (x, sg) => `<path d="M${x},-50 L${x + sg * 1.5},-26 L${x + sg * 2.5},-5" stroke="${INKC}" stroke-width="9" fill="none"/><path d="M${x},-50 L${x + sg * 1.5},-26 L${x + sg * 2.5},-5" stroke="#8a7a68" stroke-width="7" fill="none"/><path d="M${x + sg * 2.5 - 6},-6 L${x + sg * 2.5 + d * 9},-6 Q${x + sg * 2.5 + d * 12},-2 ${x + sg * 2.5 + d * 9},-0.6 L${x + sg * 2.5 - 6},-0.6 Z" fill="#5a4630"/><path d="M${x + sg * 2.5 - 2},-6 l${d * 5},3.4" stroke="#2a1a10" stroke-width="0.8"/>`;
  const hand = (x, y, r = 4.6) => `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${skin}"/><path d="M${n(x - r * 0.5)},${n(y - r * 0.9)} l0,${n(r * 1.8)} M${n(x + r * 0.2)},${n(y - r)} l0,${n(r * 2)}" stroke="${skinD}" stroke-width="0.6"/>`;
  const gx = d * 28, gy = -84;
  const fa = [-d * 18, -62 - gest * 24];
  return `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(k)})" stroke="${INKC}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="0" cy="1" rx="26" ry="4" fill="#0003" stroke="none"/>
    <path d="M${gx},${gy} L${d * 31},0" stroke="${INKC}" stroke-width="5" fill="none"/><path d="M${gx},${gy} L${d * 31},0" stroke="#6b4a2a" stroke-width="3" fill="none"/><path d="M${gx},${gy - 1} q${d * -1},-9 ${d * -8},-8" stroke="${INKC}" stroke-width="5" fill="none"/><path d="M${gx},${gy - 1} q${d * -1},-9 ${d * -8},-8" stroke="#6b4a2a" stroke-width="3" fill="none"/>
    ${leg(-9, -1)}${leg(10, 1)}
    <path d="M-22,-112 Q-26,-60 -22,-38 L22,-38 Q27,-60 22,-112 Q0,-122 -22,-112 Z" fill="${coat}"/><path d="M-4,-114 L${d * 8},-42" stroke="${coatS}" stroke-width="1.6" fill="none"/><path d="M-22,-70 L22,-70 L22,-62 L-22,-62 Z" fill="#3a3a2a"/>
    <path d="M${-d * 18},-104 Q${n(-d * 24)},-84 ${n(fa[0])},${n(fa[1] + 4)}" stroke="${INKC}" stroke-width="10" fill="none"/><path d="M${-d * 18},-104 Q${n(-d * 24)},-84 ${n(fa[0])},${n(fa[1] + 4)}" stroke="${coat}" stroke-width="8" fill="none"/>${hand(fa[0], fa[1])}
    <path d="M${d * 18},-104 Q${d * 28},-96 ${d * 27},-87" stroke="${INKC}" stroke-width="10" fill="none"/><path d="M${d * 18},-104 Q${d * 28},-96 ${d * 27},-87" stroke="${coat}" stroke-width="8" fill="none"/>${hand(gx, gy + 1, 5)}<path d="M${gx - 3},${gy - 2} l6,0 M${gx - 3},${gy + 1} l6,0 M${gx - 3},${gy + 4} l6,0" stroke="${skinD}" stroke-width="0.7"/>
    <ellipse cx="0" cy="-130" rx="15" ry="17.5" fill="${skin}"/>
    <g transform="translate(${d * 2},0)"><path d="M-9.5,-136 q3,-3 6,-0.5 M3.5,-136.5 q3,-2.5 6,0.5" stroke="#f0eee6" stroke-width="1.6" fill="none"/>
      ${bl > 0.5 ? `<path d="M-9,-131 h5 M4,-131 h5" stroke-width="0.9"/>` : `<ellipse cx="-6.5" cy="-131" rx="2.4" ry="${n(1.9 * (1 - bl))}" fill="#fff"/><ellipse cx="6.5" cy="-131" rx="2.4" ry="${n(1.9 * (1 - bl))}" fill="#fff"/><circle cx="${n(-6.5 + d * 0.9)}" cy="-131" r="1.1" fill="#2a1a18"/><circle cx="${n(6.5 + d * 0.9)}" cy="-131" r="1.1" fill="#2a1a18"/>`}
      <path d="M0,-130 q${d * 2},5 -1,7" fill="none" stroke-width="0.8"/><path d="M-10,-122 q3,2 5,0 M5,-122 q3,2 5,0" fill="none" stroke-width="0.4" opacity="0.6"/>
      ${tk > 0.15 ? `<ellipse cx="0" cy="-118.5" rx="3.6" ry="${n(1 + 3 * tk)}" fill="#5a1f30"/>` : `<path d="M-4.5,-118.5 q4.5,-1.4 9,0" fill="none" stroke-width="0.9"/>`}</g>
    <path d="M-34,-137 Q-20,-150 0,-171 Q20,-150 34,-137 Q0,-128 -34,-137 Z" fill="${hat}"/><path d="M-22,-141 Q0,-134 22,-141 M-14,-152 Q0,-146 14,-152" fill="none" stroke="#a98a44" stroke-width="0.8"/></g>`;
}
// the keeper's FREE arm (screen-left), posed on its own so she never has a third hand. hand = local cm; finger 0..1 raises the index
function grandmaArm(c, X, Z, hand, o = {}) {
  const p = L.P(c, X, 0, Z), k = p.s / 100, sh = toS(p, 0, -14, -94), h = toS(p, 0, hand[0], hand[1]);
  const el = { x: (sh.x + h.x) / 2 - 12 * k, y: Math.max(sh.y, (sh.y + h.y) / 2) + 14 * k };
  const d = `M${n(sh.x)},${n(sh.y)} Q${n(el.x)},${n(el.y)} ${n(h.x)},${n(h.y)}`, ang = Math.atan2(h.y - el.y, h.x - el.x) * 180 / Math.PI;
  const cuff = { x: lerp(el.x, h.x, 0.82), y: lerp(el.y, h.y, 0.82) };
  const fin = o.finger ? handSvg(k * 0.85, [1.1, 0.1, 0.1, 0.1], o.rot ?? 6, 0.5, "#e6bf9e") : handSvg(k * 0.85, o.ext || [0.45, 0.5, 0.45, 0.35], o.rot ?? -78, 0.2, "#e6bf9e");
  return `<path d="${d}" stroke="${INKC}" stroke-width="${n(12.2 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#2b2f6b" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#20234f" stroke-width="${n(3.5 * k)}" stroke-linecap="round" fill="none" transform="translate(0,${n(3 * k)})"/>
    <g transform="translate(${n(cuff.x)},${n(cuff.y)}) rotate(${n(ang)}) scale(${k.toFixed(4)})"><ellipse rx="2.6" ry="6.2" fill="#f2a93b" stroke="${INKC}" stroke-width="0.6"/></g><g transform="translate(${n(h.x)},${n(h.y)})">${fin}</g>`;
}
const WARM = `<rect width="${W}" height="${H}" fill="#ff9a3c" opacity="0.2" style="mix-blend-mode:multiply"/>`;
const cut = (v, ...ts) => ts.filter((x) => v >= x).length;   // which sub-shot
const shake = (v, v0, amp = 6, len = 0.14) => { const u = (v - v0) / len; return u < 0 || u > 1 ? 0 : amp * Math.sin(u * 22) * (1 - u); };
const ws = (ln, w, fb = 0.5) => wordAt(ln, w, fb);
// ================================================================ the beats (edit round 1)
const BX = { ...B.box };
// 1+2. open on the hand insert, the staff shuts the slit, cut on the rebound to the pair, then grandma
beat("L01", (v, d, T, ln) => {
  SEA.mood(0); const fl = flameAt(T);
  if (v < 0.78) {
    const u = clamp((v + 0.3) / 1.08), c = { ...BOXC, z: BOXC.z + 0.08 * u, x: BOXC.x + 0.01 * u };
    const b = SEA.beach(c, T, { sun: [860, 220, 70], pines: false, boat: false });
    const o = v < 0.5 ? lerp(0.1, 0.34, ease(clamp((v + 0.3) / 0.75))) : lerp(0.34, 0, ease(clamp((v - 0.5) / 0.06)));
    const cord = v < 0.5 ? lerp(0.12, 0.34, ease(clamp((v + 0.3) / 0.75))) : 0.2;
    const bx = { ...BX, Y: 0, worn: 1, weed: 1 }, bs = SEA.box(c, { ...bx, lid: o, cord }, T), pt = boxPts(c, bx, o, T);
    const back = v > 0.5 ? ease(clamp((v - 0.5) / 0.2)) * 520 : -Math.sin(clamp((v + 0.3) / 0.8) * 3) * 10;
    const hand = pinchHand({ x: pt.bow.x - back * 0.6 - 4, y: pt.bow.y + back * 0.8 }, 48, pt.sc * 1.25, { sleeve: SLEEVE_KID });
    const gap = v < 0.18 ? 0.9 : v < 0.46 ? lerp(0.9, 0.05, ease(clamp((v - 0.18) / 0.28), "in")) : v < 0.5 ? lerp(0.05, 0, (v - 0.46) / 0.04) : lerp(0, 0.8, ease(clamp((v - 0.5) / 0.28)));
    const tipY = 0.29 + 0.12 * o + gap, tipX = BX.X + 0.04 + (v < 0.5 ? lerp(0.5, 0.0, ease(clamp((v - 0.1) / 0.4))) : lerp(0, 0.35, ease(clamp((v - 0.5) / 0.28))));
    const stf = SEA.staff(c, { X: tipX, Y: tipY, Z: BX.Z - 0.05, rot: 10 + 18 * (tipX - BX.X), flame: fl }, T);
    return `<g transform="translate(${n(shake(v, 0.5, 7))},${n(shake(v, 0.5, 9, 0.18))})">` + b.back + bs.svg + hand + stf + b.front + `</g>`;
  }
  const fk = flameAt(T) + 0.5 * Math.exp(-Math.max(0, v - 0.8) * 5);
  if (v < 1.45) { const c = cam((v - 0.78) / 0.67, C(0.12, 0.78, 2.5, 1010), C(0.12, 0.8, 2.7, 1010)), b = beach(c, T, { pines: false });
    return b.back + hosts(c, T, { kid: { X: lerp(-0.36, -0.58, ease(clamp((v - 0.78) / 0.25))), shock: 1 }, keeper: { stern: 1, flame: fk } }) + beachBox(c, T, { lid: 0, weed: 1 }) + b.front; }
  return keeperClose(T, (v - 1.45) / (d - 1.45), { keeper: { stern: 1, flame: fk } }).svg;
}, { lead: 0.3 });
beat("L02", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { look: -0.8 } }).svg; });
beat("L03", (v, d, T, ln) => { SEA.mood(0.1); return keeperClose(T, clamp(v / (ws(ln, "years", 1.5) + 0.1)), { dx: 0.17, dy: 300, keeper: { stern: 1 } }).svg; }, { cutAt: (ln) => ws(ln, "years", 1.5) + 0.03 });

// 3. the rescue, three shots: the swing, the block, the surf
const TU = B.turtle;
beat("L04", (v, d, T, ln) => {
  SEA.mood(0); const k = cut(v, 2.3, 4.0);
  const KP = [{ X: -0.6, Z: 6.9, fx: 0.7, hair: 0 }, { X: -0.1, Z: 8.1, fx: 0.7, hair: 1 }, { X: 0.95, Z: 6.9, fx: -0.7, hair: 2 }];
  if (k < 2) {
    const c = k === 0 ? cam(v / 2.3, C(0.1, 0.9, 4.5, 980), C(0.12, 0.9, 4.7, 980)) : cam((v - 2.3) / 1.7, C(0.0, 0.9, 4.6, 980), C(0.06, 0.9, 4.8, 980));
    const b = SEA.beach(c, T, { sun: [800, 190, 64], boat: true });
    const away = k === 0 ? 0 : clamp((v - 3.2) / 0.7);
    const tu = SEA.turtle(c, { X: TU.X, Y: 0, Z: TU.Z, size: 0.45, dir: 1, tuck: 0.6 + 0.4 * Math.sin(v * 9) * 0.5, swim: T * 0.4 }, T);
    const saK1 = k === 0 ? lerp(10, 78, ease(clamp((v - 0.7) / 1.5), "in")) : 70;
    const kids = KP.map((q, i) => ({ q, i, z: q.Z })).sort((a, b2) => b2.z - a.z);
    let body = b.back, ur = null, uSvg = "", fist = "", k1 = null;
    // the blocked stick is kid 1's: first pass places the hand, then Urashima, then the stick is aimed through his fist
    const kk1 = oldKid(c, { ...KP[1], sa: saK1 });
    if (k === 1) {
      const ux = lerp(KP[1].X - 1.6, KP[1].X + 0.05, ease(clamp((v - 2.3) / 0.5)));
      ur = SEA.urashima(c, { X: ux, Z: 7.2, fx: 0.85, reach: ease(clamp((v - 2.45) / 0.4)), look: 0.6, lean: 4, shock: 0.2 }, T);
      if (ur.hold) { const hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z); k1 = oldKid(c, { ...KP[1], sa: 70, aim: hp }); fist = `<circle cx="${n(hp.x)}" cy="${n(hp.y)}" r="${n(hp.s * 0.034)}" fill="#f0c49c" stroke="${INKC}" stroke-width="2"/><path d="M${n(hp.x - hp.s * 0.012)},${n(hp.y - hp.s * 0.02)} v${n(hp.s * 0.04)} M${n(hp.x + hp.s * 0.008)},${n(hp.y - hp.s * 0.022)} v${n(hp.s * 0.044)}" stroke="${INKC}" stroke-width="1.6"/>`; }
    }
    for (const { q, i } of kids) {
      const run = k === 1 && v > 3.2 ? T * 3 + i : null, mv = k === 1 && v > 3.2 ? (i === 1 ? 0 : (i - 1) * 1.6 * away) : 0;
      const ok = i === 1 && k1 ? k1 : oldKid(c, { ...q, X: q.X + mv, sa: i === 1 ? saK1 : 35 + 30 * Math.sin(T * 7 + i * 2) * (k === 0 ? 1 : 0.3), run });
      body += (i === 1 ? "" : "") + ok.svg;
      if (i === 1 && k === 0) body += "";
    }
    body += tu.svg + tu.front;
    if (k === 1 && ur) body += ur.svg + fist;
    return body + b.front + WARM;
  }
  // the surf: carried to the water's edge, lowered, one flipper kick, the shell slips under
  const c = cam((v - 4.0) / 2.9, C(0.3, 0.9, 5.4, 990), C(0.4, 0.9, 5.6, 990));
  const b = SEA.beach(c, T, { sun: [800, 190, 64], boat: true });
  const u = v - 4.0, wx = 0.5, edge = SEA.shoreZ(wx) + 0.05;
  const walk = ease(clamp(u / 1.0)), low = ease(clamp((u - 0.9) / 0.6));
  const ur = SEA.urashima(c, { X: lerp(-0.6, wx - 0.45, walk), Z: lerp(7.6, edge - 0.55, walk), fx: 0.85, reach: 1, look: 0.6, kneel: 0.55 * low, bow: 10 * low }, T);
  let body = b.back;
  const rel = u > 1.55;
  if (!rel) {
    const h = ur.hold || { X: wx, Y: 1, Z: edge };
    const tu = SEA.turtle(c, { X: h.X + 0.02, Y: h.Y - 0.14, Z: h.Z - 0.02, size: 0.45, dir: 1, tuck: 0.3, swim: T * 1.2 }, T);
    body += ur.svg + tu.svg + tu.front;
  } else {
    const r = u - 1.55, tz = edge - 0.05 + 0.5 * ease(clamp(r / 1.3)), ty = -0.5 * ease(clamp((r - 0.25) / 0.9)), tx = wx + 0.1 + 0.3 * r;
    const tu = SEA.turtle(c, { X: tx, Y: ty, Z: tz, size: 0.45, dir: 1, tuck: 0, swim: T * 4 }, T), wy = L.P(c, tx, 0, tz).y, id = "wlc" + Math.round(u * 100);
    body += ur.svg + `<clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${n(wy)}"/></clipPath><g clip-path="url(#${id})">${tu.svg}${tu.front}</g>`;
    const wp = L.P(c, tx, 0, tz);
    for (let i = 0; i < 3; i++) { const q = clamp((r - 0.2 - i * 0.25) / 1.0); if (q > 0 && q < 1) body += `<ellipse cx="${n(wp.x)}" cy="${n(wp.y)}" rx="${n(wp.s * (0.15 + 0.5 * q))}" ry="${n(wp.s * (0.04 + 0.12 * q))}" fill="none" stroke="#ffffff" stroke-width="3" opacity="${n(0.7 * (1 - q))}"/>`; }
  }
  return body + b.front + WARM;
}, { rel: true });
beat("L05", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { grin: 1 } }).svg; });
beat("L06", (v, d, T) => { SEA.mood(0.1); return keeperClose(T, v / d, { keeper: { stern: 1 } }).svg; });

// 4. the dive: one downward follow with the turtle's nose in frame, then the palace exterior on "Dragon"
beat("L07", (v, d, T, ln) => {
  const dr = ws(ln, "dragon", 2.4) - 0.04, f = v / d; SEA.mood(lerp(0.55, 1.25, ease(f)));
  const dc = { ...SEA.DIVE.cam.main };
  if (v < dr) { const e = clamp(v / dr), dv = SEA.dive(dc, T, { depth: lerp(0.0, 0.85, e) }), tu = SEA.turtle(dc, { X: -0.1, Y: 1.15, Z: 3.9, size: 1, dir: 1, pitch: lerp(10, 24, e), swim: T * 0.9 }, T), ur = SEA.urashima(dc, { ...tu.seat, ride: 1, fx: 0.75, shock: 0.3, bow: 8, look: 0.6 }, T); return dv.back + tu.svg + ur.svg + tu.front + dv.front; }
  return palaceExterior(T, v - dr, true);
});
function palaceExterior(T, v, turtleOn) {
  const dc = { ...SEA.DIVE.cam.main }, e = clamp(v / 1.6), dv = SEA.dive(dc, T, { depth: 0.95, palace: 1 });
  if (!turtleOn) return dv.back + dv.front;
  const tu = SEA.turtle(dc, { X: lerp(-1.2, -0.7, e), Y: 3.1, Z: 8.5, size: 1, dir: 1, pitch: 24, swim: T * 0.9 }, T), ur = SEA.urashima(dc, { ...tu.seat, ride: 1, fx: 0.75, bow: 12 }, T);
  return dv.back + tu.svg + ur.svg + tu.front + dv.front;
}
// 5. the hall: exterior -> two-shot on the first sentence, Urashima's reverse on the second
const hall = (c, T, o = {}) => {
  const h = SEA.palace(c, T, {}), ot = SEA.otohime(c, { X: 0.5, Z: 9.9, fx: o.otFx ?? -0.6, sad: 0.3, blink: blinkAmt(T % 3.1, [0.9]), talk: talkOf("O", T), give: o.give || 0, ...(o.ot || {}) }, T);
  const ur = o.ur === null ? { svg: "" } : SEA.urashima(c, { X: -0.5, Z: 9.8, fx: 0.75, sad: 0.3, blink: blinkAmt(T % 2.9, [1.7]), talk: talkOf("U", T), ...(o.ur || {}) }, T);
  return { h, ot, ur };
};
beat("L08", (v, d, T, ln) => {
  const st = ws(ln, "stay", 2.3) - 0.05;
  if (v < 0) { SEA.mood(1.6); return palaceExterior(T, 1.6 + v, false); }
  SEA.mood(2);
  if (v < st) { const c = cam(v / st, C(0.0, 1.45, 5.6, 1100), C(0.0, 1.4, 6.9, 1100)), { h, ot, ur } = hall(c, T, { otFx: -0.6 }); return h.back + ot.svg + ur.svg + h.front; }
  const lk = 0.35 - 1.25 * ease(clamp((v - st - 0.6) / 0.7)), c = cam((v - st) / (d - st), C(-0.4, 1.2, 8.1, 1080), C(-0.4, 1.22, 8.4, 1080));
  const { h, ot, ur } = hall(c, T, { otFx: -0.6, ot: { talk: 0 }, ur: { look: lk, talk: 0, sad: 0.5 } }); return h.back + ot.svg + ur.svg + h.front;
});
// 6. the four seasons: one slow push, then an insert exactly on each word
beat("L09", (v, d, T, ln) => {
  SEA.mood(2); const S = ["spring", "summer", "autumn", "winter"].map((s) => ws(ln, s, 0.5) - 0.04), w0 = S[0] - 0.05;
  const k = S.filter((x, i) => v >= x && v < x + 0.8).length ? S.findIndex((x) => v >= x && v < x + 0.8) : -1;
  if (k >= 0) { const z = 1 + 0.05 * clamp((v - S[k]) / 0.8); return `<g transform="translate(540,960) scale(${n(z)}) translate(-540,-960)">${SEA.seasonView(k, 0, 0, W, H, T)}</g>`; }
  const c = cam(v / w0, C(0, 2.5, 0.6, 960), C(0, 2.55, 1.9, 960));
  return SEA.seasons(v < w0 ? c : SEA.SEASONS.cam.all, T, { open: [1, 1, 1, 1] });
});
beat("L10", (v, d, T) => { SEA.mood(0.1); return kidClose(T, v / d, { kid: { shock: 0.5, grin: 0.8 } }).svg; });
beat("L11", (v, d, T, ln) => {
  const y0 = ws(ln, "year", 2.2), q = v - y0;
  if (q >= 0) { SEA.mood(2); const f = Math.round(q * FPS), pane = f < 36 ? Math.floor(f / 9) % 4 : f < 60 ? Math.floor((f - 36) / 6) % 4 : 3;
    const wall = SEA.seasons(SEA.SEASONS.cam.all, T, { open: [1, 1, 1, 1], focus: pane }); return wall + `<rect x="0" y="1560" width="${W}" height="${H - 1560}" fill="#3a2330" opacity="0"/>`; }
  SEA.mood(0.2); return keeperClose(T, v / y0 * 0.7, { keeper: { stern: 1 } }).svg;
}, { hold: 0.35 });
beat("L12", (v, d, T) => { SEA.mood(2.6); const c = cam(v / d, C(-0.5, 1.28, 7.6, 1080), C(-0.5, 1.3, 8.1, 1080)), { h, ot, ur } = hall(c, T, { ur: { sad: 1, fx: 0.7 }, ot: null, otNone: 1 }); return h.back + ur.svg + h.front; });
// 7. the gift: the box rests in Otohime's palms, then the handoff with contact
beat("L13", (v, d, T, ln) => {
  SEA.mood(2.4); const w = ws(ln, "but", 1.8) - 0.1;
  if (v < w) { const c = cam(v / w, C(0.0, 1.25, 7.4, 1080), C(0.02, 1.22, 7.9, 1080)), { h, ot, ur } = hall(c, T, { give: 1, ot: { sad: 0.8 }, ur: { reach: 0.3, sad: 0.7 } });
    return h.back + ur.svg + ot.svg + SEA.box(c, { ...ot.hold, X: ot.hold.X - 0.02, held: true }, T).svg + h.front; }
  const u = ease(clamp((v - w) / (d - w - 0.25))), c = cam((v - w) / (d - w), C(0.0, 1.15, 8.2, 1080), C(0.02, 1.1, 8.5, 1080));
  const { h, ot, ur } = hall(c, T, { give: 1 - 0.5 * u, ot: { sad: 0.8 }, ur: { reach: 0.5 + 0.5 * u, sad: 0.7, fx: 0.75 } });
  const a = ot.hold, b2 = ur.hold || a, bp = { X: lerp(a.X, b2.X, u), Y: lerp(a.Y, b2.Y, u), Z: lerp(a.Z, b2.Z, u) };
  return h.back + ot.svg + ur.svg + SEA.box(c, { ...bp, held: true }, T).svg + h.front;
});
beat("L14", (v, d, T) => { SEA.mood(0.05); return kidClose(T, v / d, { kid: { shock: 1 } }).svg; });
beat("L15", (v, d, T) => {
  SEA.mood(0.15); const rise = ease(clamp(v / 0.5));
  return keeperClose(T, v / d, { keeper: { stern: 0.2 }, noArm: true, extra: (c) => grandmaArm(c, CA.keeper.X, CA.keeper.Z, [-30, -90 - 12 * rise], { finger: true, rot: 4 }) }).svg;
});
// 8. the village: the rescue shore again, the pine now a giant; the woman; the grave
const villageCam = SEA.VILLAGE.cam.wide;
beat("L16", (v, d, T, ln) => {
  SEA.mood(3); const u = clamp(v / d), c = cam(u, C(0.3, 0.9, 3.4, 960), C(0.4, 1.1, 3.8, 1100)), b = SEA.beach(c, T, { sun: [800, 190, 64], boat: false, pines: false });
  const pines = SEA.pine(c, { X: 1.3, Z: 7.0, h: 11, seed: 1, lean: -0.3, t: T }) + SEA.pine(c, { X: -2.6, Z: 8.3, h: 9, seed: 4, lean: 0.34, t: T });
  const ur = SEA.urashima(c, { X: -0.5, Z: 6.2, fx: 0.75, sad: 0.7, bow: 4, look: 0.7, blink: blinkAmt(T % 3, [1]) }, T);
  return SEA.wash(b.back + pines + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, T).svg + SEA.wash(b.front);
});
beat("L17", (v, d, T, ln) => {
  SEA.mood(3); const pre = -GAP.L16, vl0 = SEA.VILLAGE;
  const w3 = ws(ln, "three", 1.5) - 0.05;
  const talkU = v < 0 ? 0.55 * (0.5 + 0.5 * Math.sin(T * 17)) * (v > pre + 0.2 ? 1 : 0) : 0;
  if (v < w3) {
    const c = cam((v - pre) / (w3 - pre), C(0.0, 1.15, 2.7, 1120), C(0.0, 1.15, 3.0, 1120)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
    const turn = ease(clamp((v + 0.35) / 0.3)), fx = lerp(0.7, -0.7, turn) * (v > 2.9 ? -1 : 1);
    const tap = v < 0 ? Math.max(0, Math.sin(T * 11)) : 0;
    const ur = SEA.urashima(c, { X: -0.5, Z: 4.4, fx: 0.7, sad: 0.5, reach: v < 0 ? 0.45 : 0, pull: tap, talk: talkU, look: 0.1, blink: blinkAmt(T % 3, [1]) }, T);
    const wm = villager(c, { X: 0.5, Z: 4.5, fx, talk: v >= 0 ? talkOf("V", T) : 0, gest: v > 0.2 ? 0.5 : 0, blink: blinkAmt(T % 3.4, [1.4]) }, T);
    return SEA.wash(vl.back + ur.svg + wm) + SEA.wash(vl.front);
  }
  const c = cam((v - w3) / (d - w3), C(-0.4, 1.12, 2.7, 1150), C(-0.4, 1.12, 3.1, 1150)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
  const ur = SEA.urashima(c, { X: -0.55, Z: 4.4, fx: 0.7, sad: 0.9, shock: 0.7, look: 0.1, blink: 0 }, T);
  return SEA.wash(vl.back + ur.svg) + SEA.wash(vl.front);
});
beat("L18", (v, d, T) => {
  SEA.mood(3); const G = SEA.VILLAGE.grave, cool = `<rect width="${W}" height="${H}" fill="#1a2640" opacity="0.18" style="mix-blend-mode:multiply"/>`;
  const a = 0.7, bb = 1.3;
  if (v < a) {   // he looks down at the grave
    const c = cam(v / a, C(0.1, 1.1, 2.4, 1100), C(0.1, 1.0, 2.7, 1100)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
    const ur = SEA.urashima(c, { X: -0.2, Z: 5.0, age: 0, fx: 0.8, sad: 1, bow: 8 * ease(clamp(v / a)), look: 0.2, blink: 0 }, T);
    return SEA.wash(vl.back + ur.svg + vl.front) + cool;
  }
  if (v < bb) {  // moss insert
    const c = { x: G.X + 0.05, y: 0.62, z: G.Z - 1.35, h0: 1000 }, vl = SEA.village(c, T, { sun: [760, 200, 56] });
    return SEA.wash(vl.back + SEA.grave(c, {}) + vl.front) + cool;
  }
  const c = cam((v - bb) / (d + 0.6 - bb), C(0.2, 0.95, 2.3, 1010), C(0.2, 0.93, 2.5, 1010)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
  const k = ease(clamp((v - bb) / 0.8)), ur = SEA.urashima(c, { X: -0.2, Z: 5.0, age: 0, fx: 0.8, sad: 1, kneel: k, reach: 0.3 + 0.6 * clamp((v - bb - 0.7) / 0.4), bow: 8, blink: 0 }, T);
  const bx = SEA.box(c, { X: 0.28, Y: 0, Z: 4.9, worn: 0 }, T).svg;
  return SEA.wash(vl.back + ur.svg + vl.front) + bx + cool;
}, { hold: 0.6 });
// 9. proof: a brush scroll, the shrine, the box
const brush = (seed, x, y, w, h) => { let s = ""; const rows = 14; for (let i = 0; i < rows; i++) { const yy = y + 40 + i * (h - 80) / rows; const l = 18 + hash(seed + i * 5) * 40; const st = 2 + Math.floor(hash(seed + i) * 3); for (let j = 0; j < st; j++) { const a = hash(seed + i * 13 + j) * 3.2; s += `<path d="M${n(x + 10 + (j - 1) * 6)},${n(yy)} q${n(Math.cos(a) * l * 0.6)},${n(Math.sin(a) * l * 0.5 + l * 0.4)} ${n(Math.cos(a + 1.2) * l)},${n(l * 0.8 + Math.sin(a) * 6)}" stroke="#1a1328" stroke-width="${n(3 + hash(seed + j + i) * 6)}" stroke-linecap="round" fill="none" opacity="0.86"/>`; } if (hash(seed + i * 3) > 0.7) s += `<circle cx="${n(x + 14)}" cy="${n(yy + 22)}" r="${n(3 + hash(i) * 3)}" fill="#1a1328" opacity="0.8"/>`; } return s; };
function scrollShot(u) {
  const px = lerp(260, -260, ease(u, "inOut")), cols = [0, 1, 2, 3, 4, 5, 6, 7];
  return `<defs><filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.035 0.2" numOctaves="4" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.4  0 0 0 0 0.2  0 0 0 0.55 0" result="t"/><feComposite in="t" in2="SourceGraphic" operator="in"/></filter></defs>
  <rect width="${W}" height="${H}" fill="#2c2420"/><g transform="translate(${n(px)},0)"><rect x="-300" y="330" width="1760" height="1260" fill="#dcc690" stroke="#1a1328" stroke-width="6"/><rect x="-300" y="330" width="1760" height="1260" fill="#fff" filter="url(#paper)" opacity="0.95"/>
  <rect x="-300" y="330" width="1760" height="40" fill="#b8985a" opacity="0.5"/><rect x="-300" y="1550" width="1760" height="40" fill="#b8985a" opacity="0.5"/>
  ${cols.map((c2) => `<path d="M${-300 + 80 + c2 * 215},360 v1200" stroke="#7a5a30" stroke-width="2" opacity="0.5"/>${brush(3 + c2 * 17, -300 + 95 + c2 * 215, 360, 180, 1200)}`).join("")}
  <rect x="1180" y="1210" width="90" height="90" fill="#b3261e" opacity="0.88"/><path d="M1200,1230 h50 M1225,1225 v70 M1205,1275 h40" stroke="#f3d9b0" stroke-width="7"/>
  <path d="M-300,820 Q500,805 1460,830 L1460,900 Q500,880 -300,890 Z" fill="#7a5a30" opacity="0.1"/></g>
  <rect x="-40" y="330" width="130" height="1260" fill="#3a2418" opacity="0.0"/>`;
}
const SHRINE_BODY = `<ellipse cx="540" cy="1360" rx="440" ry="40" fill="#0006"/><rect x="250" y="1010" width="580" height="340" fill="#5a3a2a" stroke="#1a1328" stroke-width="6"/><rect x="300" y="1060" width="480" height="240" fill="#1a1328"/><path d="M180,1020 L540,830 L900,1020 L860,1050 L540,890 L220,1050 Z" fill="#2a2430" stroke="#1a1328" stroke-width="6"/><rect x="240" y="1340" width="600" height="30" fill="#9a8a7a"/>`;
const lattice = (x, y, w, h, sw = 12, sp = 55) => Array.from({ length: Math.round(w / sp) + 1 }, (_, i) => `<rect x="${x + i * sp - sw / 2}" y="${y}" width="${sw}" height="${h}" fill="#8a5a3a" stroke="#1a1328" stroke-width="2"/>`).join("") + Array.from({ length: Math.round(h / (sp + 5)) + 1 }, (_, i) => `<rect x="${x}" y="${y + i * (sp + 5) - 4}" width="${w}" height="8" fill="#8a5a3a" stroke="#1a1328" stroke-width="2"/>`).join("");
beat("L20", (v, d, T, ln) => {
  SEA.mood(3); const sw = ws(ln, "shrine", 4.5) - 0.05, kp = ws(ln, "still", 5.4) - 0.05;
  if (v < sw) return scrollShot(clamp(v / sw));
  if (v < kp) {
    const u = clamp((v - sw) / (kp - sw)), c = cam(u, C(0.0, 1.2, 0.2, 1000), C(0.0, 1.1, 0.9, 1000)), b = SEA.beach(c, T, { sun: [800, 230, 60], boat: false });
    return SEA.wash(b.back) + SHRINE_BODY + `<g opacity="0.95">${lattice(300, 1060, 480, 240, 10)}</g>` + b.front;
  }
  const u = clamp((v - kp) / (d - kp)), z = 1 + 0.12 * u;   // through the lattice: a closed lacquer box with the palace on its lid
  return `<rect width="${W}" height="${H}" fill="#120d18"/><radialGradient id="shl" cx="50%" cy="48%" r="55%"><stop offset="0" stop-color="#b08a5a"/><stop offset="1" stop-color="#2a1a1c"/></radialGradient><rect width="${W}" height="${H}" fill="url(#shl)"/>
  <g transform="translate(540,960) scale(${n(z)}) translate(-540,-960)"><rect x="140" y="1180" width="800" height="40" fill="#2a1a14"/>
  <g transform="translate(540,1180)"><rect x="-260" y="-360" width="520" height="360" rx="22" fill="#1d1830" stroke="#8a7ab8" stroke-width="8"/><rect x="-280" y="-420" width="560" height="90" rx="18" fill="#2a2342" stroke="#8a7ab8" stroke-width="8"/>
  <g transform="translate(0,-210)" stroke="#f2b82e" stroke-width="6" fill="none" stroke-linejoin="round"><path d="M-90,60 h180 M-70,60 v-40 h140 v40 M-60,20 l60,-40 l60,40 M-50,-20 h100 M-40,-20 l40,-35 l40,35 M0,-55 v-30"/></g>
  <path d="M-260,-240 H260 M0,-360 V0" stroke="#e8321e" stroke-width="14"/><circle cx="0" cy="-240" r="26" fill="#e8321e" stroke="#1a1328" stroke-width="4"/></g></g>
  <g opacity="0.97">${lattice(60, 300, 960, 1400, 20, 160)}</g>`;
});
// 10. light-speed: silhouette + small pine, closer, one day-night cycle and two growth stages, then the match into Urashima at dusk
beat("L21", (v, d, T, ln) => {
  const fl = ws(ln, "fly", 3.5) - 0.05, ag = ws(ln, "aged", 8) - 0.05;
  const FX = -0.2, FZ = 7.4;
  const sil = (c, g = 0.12) => `<g style="filter:brightness(${g})">${SEA.urashima(c, { X: FX, Z: FZ, fx: 0.75, age: 0 }, T).svg}</g>`;
  if (v < fl) { SEA.mood(0); const c = ob(C(0, 1.4, -1.2, 820)), b = SEA.beach(c, T, { sun: [800, 200, 64], pines: false, boat: false });
    return b.back + SEA.pine(c, { X: 2.9, Z: 7.0, h: 2.2, seed: 1, lean: -0.3, t: T }) + SEA.pine(c, { X: -4.9, Z: 8.3, h: 1.8, seed: 4, lean: 0.34, t: T }) + sil(c) + b.front; }
  if (v < ag) {
    SEA.mood(0); const ph = (v - fl) / (ag - fl), c = ob(C(0.1, 1.05, 1.6, 1000)), night = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
    const sunA = ph * Math.PI * 2, sx = 540 - Math.cos(sunA) * 520, sy = 900 - Math.sin(sunA) * 700;
    const b = SEA.beach(c, T, { sun: false, pines: false, boat: false });
    const g1 = ease(clamp((ph - 0.15) / 0.3)), g2 = ease(clamp((ph - 0.55) / 0.3)), h = 2.2 + 2.2 * g1 + 3.2 * g2;
    const body = `<circle cx="${n(sx)}" cy="${n(sy)}" r="70" fill="${sunA < Math.PI ? "#ffe9a0" : "#f6f3ea"}" opacity="${sy < 1000 ? 0.95 : 0}"/>`;
    return b.back + body + SEA.pine(c, { X: 2.9, Z: 7.0, h, seed: 1, lean: -0.3, t: T }) + SEA.pine(c, { X: -4.9, Z: 8.3, h: h * 0.8, seed: 4, lean: 0.34, t: T }) + sil(c) + b.front + `<rect width="${W}" height="${H}" fill="#0c1440" opacity="${n(night * 0.62)}" style="mix-blend-mode:multiply"/>`;
  }
  SEA.mood(3.6); const c = ob(C(0.1, 1.05, 1.6, 1000)), b = SEA.beach(c, T, { sun: [200, 700, 110], glitter: [200], boat: false, pines: false });
  const m = ease(clamp((v - ag) / 0.5)), ur = SEA.urashima(c, { X: FX, Z: FZ, fx: 0.75, age: 0, sad: 0.8, reach: 0.7 }, T);
  return b.back + SEA.pine(c, { X: 2.9, Z: 7.0, h: 7.6, seed: 1, lean: -0.3, t: T }) + `<g style="filter:brightness(${n(0.12 + 0.88 * m)})">${ur.svg}</g>` + (ur.hold ? SEA.box(c, { ...ur.hold, held: true }, T).svg : "") + b.front;
});
// 11. dusk: the box in his hands, the knot, the fingers
const BOXD = { X: 0.08, Y: 0.0, Z: 3.95 };
function fingersInsert(T, o = {}) {   // dusk close on the lacquer box and Urashima's hands. o: { lid, cord, hinge, hes, pull, amt, sunk }
  SEA.mood(3.6); const c = { ...BOXC, z: BOXC.z + (o.push || 0) }, b = SEA.beach(c, T, { sun: [200, 700, 110], glitter: [200], boat: false, pines: false });
  const lid = o.lid || 0, bx = { ...BOXD, hinge: true }, bs = SEA.box(c, { ...bx, lid, cord: o.cord ?? 0.0, held: true }, T), pt = boxPts(c, bx, lid, T), skin = "#f0c49c";
  const wob = o.hes ? Math.sin(o.hes * 9) * 6 : 0, pull = o.pull || 0;
  const rh = pinchHand({ x: pt.bow.x - pull * 70 + wob, y: pt.bow.y + pull * 90 }, 52 - 20 * pull, pt.sc * 1.2, { sleeve: SLEEVE_URA, skin, thumb: 0.9 });
  const q = pt.q, lh = pinchHand({ x: q.x + 150 * pt.sc / 8, y: q.y + 8 }, -62, pt.sc * 1.2, { sleeve: SLEEVE_URA, skin, ext: [0.3, 0.3, 0.3, 0.25], thumb: 0.3 });
  const sm = o.amt ? SEA.smoke(c, { ...bs.mouth, amt: o.amt, rise: 1.3 + o.amt, spread: 0.5, drift: 0.2, seed: 2 }, T) : "";
  return SEA.wash(b.back) + lh + bs.svg + rh + sm;
}
beat("L22", (v, d, T) => {
  const sw = d - 1.0;
  if (v < sw) {
    SEA.mood(3.6); const c = cam(v / sw, C(0.1, 1.05, 3.0, 1080), C(0.2, 1.05, 3.9, 1080)), b = SEA.beach(c, T, { sun: [200, 700, 110], glitter: [200], boat: false });
    const dip = ease(clamp((v - sw * 0.55) / (sw * 0.4)));
    const ur = SEA.urashima(c, { X: 0.2, Z: 5.4, fx: 0.9, age: 0, sad: 0.8, reach: 0.7, bow: 14 * dip, look: lerp(0.8, 0.1, dip), blink: blinkAmt(T % 3.4, [1.2]) }, T);
    return b.back + ur.svg + SEA.box(c, { ...ur.hold, held: true }, T).svg + b.front;
  }
  return fingersInsert(T, { cord: 0, push: 0.02 * (v - sw) });
});
beat("L23", (v, d, T, ln) => {
  const kEnd = Math.min(0.85, d - 0.3);
  if (v < kEnd) { SEA.mood(0); return kidClose(T, v / kEnd * 0.5, { kid: { shock: 1, worry: 1 } }).svg; }
  const q = v - kEnd, hes = clamp(q / 0.5), pl = ease(clamp((q - 0.5) / 0.5)), lid = ease(clamp((q - 1.0) / 0.5)) * 0.32;
  return fingersInsert(T, { cord: 0.7 * pl, pull: pl * 0.6, hes: q < 0.5 ? q : 0, lid, push: 0.02 * q });
}, { hold: 0.9 });
// 12. white smoke: the wisp at the crack, then one locked medium for the ageing
beat("L24", (v, d, T, ln) => {
  const sw = ws(ln, "and", 1.1) + 0.05;
  if (v < sw - 0.4) { const e = clamp((v + 0.2) / 0.8); return fingersInsert(T, { cord: 0.7, pull: 0.6, lid: 0.32 + 0.1 * e, amt: 0.12 + 0.3 * e, push: 0.02 * (v + 1.2) }); }
  SEA.mood(3.6);
  const c = { x: 0.2, y: 1.1, z: 3.0, h0: 1150 }, q = v - (sw - 0.4), t3 = ws(ln, "three", 1.5);
  const ag = ease(clamp((v - t3 + 0.1) / 1.0)), amt = v < t3 ? lerp(0.25, 1.0, ease(clamp(q / (t3 - sw + 0.4)))) : v < t3 + 1.0 ? 1.0 : lerp(1.0, 0.1, ease(clamp((v - t3 - 1.0) / (d - t3 - 1.0))));
  const b = SEA.beach(c, T, { boat: false, pines: false, sun: [200, 700, 110], glitter: [200] });
  const ur = SEA.urashima(c, { X: 0.0, Z: 4.4, fx: 0.8, age: ag, reach: 1, shock: 0.4, sad: ag, blink: 0, look: 0.3 }, T);
  const bx = SEA.box(c, { ...ur.hold, held: true, lid: 0.9, cord: 1, hinge: true }, T), hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z), sk = ag > 0.5 ? "#dccbbd" : "#f0c49c";
  const palm = `<ellipse cx="${n(hp.x - hp.s * 0.02)}" cy="${n(hp.y + hp.s * 0.02)}" rx="${n(hp.s * 0.15)}" ry="${n(hp.s * 0.045)}" fill="${sk}" stroke="${INKC}" stroke-width="2.5"/>`;
  const thumb = `<path d="M${n(hp.x - hp.s * 0.12)},${n(hp.y - hp.s * 0.02)} q${n(hp.s * 0.05)},${n(-hp.s * 0.1)} ${n(hp.s * 0.1)},${n(-hp.s * 0.05)}" stroke="${INKC}" stroke-width="${n(hp.s * 0.05)}" stroke-linecap="round" fill="none"/><path d="M${n(hp.x - hp.s * 0.12)},${n(hp.y - hp.s * 0.02)} q${n(hp.s * 0.05)},${n(-hp.s * 0.1)} ${n(hp.s * 0.1)},${n(-hp.s * 0.05)}" stroke="${sk}" stroke-width="${n(hp.s * 0.04)}" stroke-linecap="round" fill="none"/>`;
  const sm = SEA.smoke(c, { ...bx.mouth, amt, rise: 1.4 + 1.6 * amt, spread: lerp(0.6, 1.3, amt), drift: 0.4, seed: 2 }, T);
  return b.back + ur.svg + palm + bx.svg + thumb + `<g opacity="${n(clamp(amt * 3))}">${sm}</g>`;
});
beat("L25", (v, d, T) => {
  SEA.mood(3.6); const c = cam(v / d, C(0.2, 1.1, 3.0, 1150), C(0.3, 1.05, 3.5, 1180)), b = SEA.beach(c, T, { boat: false, pines: false, sun: [200, 700, 110], glitter: [200] });
  const ur = SEA.urashima(c, { X: 0.0, Z: 4.4, fx: 0.8, age: 1, reach: 1, sad: 1, blink: blinkAmt(T % 3.6, [1.8]) }, T), bx = SEA.box(c, { ...ur.hold, held: true, lid: 0.9, cord: 1, hinge: true }, T), hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z);
  const palm = `<ellipse cx="${n(hp.x - hp.s * 0.02)}" cy="${n(hp.y + hp.s * 0.02)}" rx="${n(hp.s * 0.15)}" ry="${n(hp.s * 0.045)}" fill="#dccbbd" stroke="${INKC}" stroke-width="2.5"/>`;
  return b.back + ur.svg + palm + bx.svg;
});
// 13. back in the present: the shoe pushes the box, then the boy; one steady grandma
beat("L26", (v, d, T, ln) => {
  SEA.mood(4); const sw = 1.1;
  if (v < sw) {
    const c = cam(v / sw, C(0.25, 0.6, 2.6, 1010), C(0.3, 0.6, 2.8, 1010)), b = SEA.beach(c, T, { sun: [230, 600, 120], glitter: [230], boat: false });
    const push = clamp((v - 0.2) / 0.5), bxX = B.box.X + 0.9 * ease(clamp((v - 0.35) / 0.7), "out"), kx = B.kid.X, kz = 4.5;
    const kidSvg = hosts(c, T, { kid: { X: kx, Z: kz, reachL: 0, worry: 0.8 }, keeper: { stern: 0.8 } });
    const foot = (px) => { const hip = L.P(c, kx + 0.04, 0.5, kz), fp = L.P(c, Math.min(px - 0.24, kx + 0.34), 0.0, 4.3), kn = { x: lerp(hip.x, fp.x, 0.5) - 6, y: lerp(hip.y, fp.y, 0.5) - 25 };
      return `<path d="M${n(hip.x)},${n(hip.y)} L${n(kn.x)},${n(kn.y + 30)} L${n(fp.x)},${n(fp.y - 14)}" stroke="${INKC}" stroke-width="${n(fp.s * 0.05)}" stroke-linecap="round" fill="none"/><path d="M${n(hip.x)},${n(hip.y)} L${n(kn.x)},${n(kn.y + 30)} L${n(fp.x)},${n(fp.y - 14)}" stroke="#d9cba9" stroke-width="${n(fp.s * 0.038)}" stroke-linecap="round" fill="none"/><path d="M${n(fp.x - fp.s * 0.1)},${n(fp.y - fp.s * 0.04)} q${n(fp.s * 0.02)},${n(-fp.s * 0.1)} ${n(fp.s * 0.1)},${n(-fp.s * 0.08)} L${n(fp.x + fp.s * 0.18)},${n(fp.y - fp.s * 0.04)} Q${n(fp.x + fp.s * 0.2)},${n(fp.y + fp.s * 0.02)} ${n(fp.x + fp.s * 0.12)},${n(fp.y + fp.s * 0.02)} L${n(fp.x - fp.s * 0.1)},${n(fp.y + fp.s * 0.02)} Z" fill="#f2eff6" stroke="${INKC}" stroke-width="2.5"/><path d="M${n(fp.x - fp.s * 0.1)},${n(fp.y)} h${n(fp.s * 0.28)}" stroke="#b8344c" stroke-width="${n(fp.s * 0.02)}"/>`; };
    return b.back + kidSvg + (push > 0 ? foot(bxX) : "") + SEA.box(c, { ...B.box, X: bxX, worn: 1, weed: 1 }, T).svg + b.front;
  }
  return kidClose(T, (v - sw) / (d - sw), { kid: { look: -0.9 } }, undefined, true).svg;
});
const grandma = (T, u, hand) => {
  SEA.mood(4);
  const h = ease(hand);
  return keeperClose(T, u, { dy: 0, keeper: { stern: 0.3, open: 1 }, noArm: true, extra: (c) => grandmaArm(c, CA.keeper.X, CA.keeper.Z, [lerp(-18, -9, h), lerp(-68, -126, h)], { rot: lerp(180, 282, h), ext: [0.3, 0.3, 0.3, 0.25] }) }, undefined, true).svg;
};
beat("L27", (v, d, T, ln) => { const p = ws(ln, "peek", 2.0); return grandma(T, (v + 0.2) / 4.5, v < p - 0.5 ? 0 : v < p + 0.1 ? clamp((v - p + 0.5) / 0.6) : clamp(1 - (v - p - 0.1) / 0.5)); }, { hold: 0.4 });
beat("L28", (v, d, T) => grandma(T, (v + 3.4) / 4.5, 0));

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0, pic = 0, prev = null;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur;
  const gap = prev ? (GAP[prev.line] ?? 0.3) : 0, lineAt = t + gap + (b.lead || 0), aEnd = lineAt + d + (b.hold || 0);
  const picEnd = b.cutAt ? lineAt + b.cutAt(ln) : aEnd;
  TL.push({ ...b, ln, d, at: pic, lineAt, end: picEnd });
  t = aEnd; pic = picEnd; prev = b;
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
export const FADE = 0;
export const GAIN = 1;

// ---------------------------------------------------------------- captions: whole phrases (captions.mjs), lane y 480 (330 for the last two lines)
const KEY = /^(three|hundred|478|nineteen|window|years?|box|sea|smoke|never|gift|locked)/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt - 0.04 && time < x.lineAt + x.d + 0.15);
  if (!b || !b.ln.phr.length) return "";
  const lane = { L03: 300, L23: 520, L24: 400, L25: 400, L27: 330, L28: 330, L17: 430 }[b.line] ?? 480;
  return captionSvg(b.ln.phr, time - b.lineAt, { key: KEY, y: lane });
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds(); SEA.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const v = time - (b.rel ? b.at : b.lineAt), d = b.d;
  const body = b.shot(v, d, time, b.ln);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SEA.defs()}${body}${SEA.vignette()}${captions(time)}</svg>`;
}
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- the sound mix
export function prepare(outPath) {
  mkdirSync(OUT, { recursive: true }); mkdirSync(`${OUT}/vcut`, { recursive: true });
  const ins = [], f = [];
  const add = (file, at, gain = 1, extra = "") => { ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.max(0, Math.round(at * 1000))}:all=1[a${k}]`); };
  const bed = (file, from, to, gain, lp = 4500, hard = false) => { if (!existsSync(file)) { console.log("skip (missing):", file); return; } const dd = to - from; add(file, from, gain, `aloop=loop=-1:size=2e9,atrim=0:${dd.toFixed(2)},lowpass=f=${lp},afade=t=in:d=0.5,${hard ? "" : `afade=t=out:st=${Math.max(0, dd - 0.5).toFixed(2)}:d=0.5,`}`); };
  const at = (id) => TL.find((b) => b.line === id);
  const voice = (ln) => {   // trimmed take: each kept span cut at its word times with 10 ms fades, joined by SIL of silence
    if (!ln.cut) return `${VOICE}/${ln.id}.wav`;
    const p = `${OUT}/vcut/${ln.id}.wav`, parts = ln.segs.map(([a, b], i) => `[0:a]atrim=start=${a.toFixed(3)}:end=${b.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.01,afade=t=out:st=${(b - a - 0.01).toFixed(3)}:d=0.01${i < ln.segs.length - 1 ? `,apad=pad_dur=${SIL}` : ""}[s${i}]`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${VOICE}/${ln.id}.wav`, "-filter_complex", parts.join(";") + ";" + ln.segs.map((_, i) => `[s${i}]`).join("") + `concat=n=${ln.segs.length}:v=0:a=1[o]`, "-map", "[o]", p]);
    return p;
  };
  for (const b of TL) if (b.ln) add(voice(b.ln), b.lineAt, 1);
  if (existsSync(`${OUT}/score.wav`)) add(`${OUT}/score.wav`, 0, 0.78, `atrim=0:${DUR.toFixed(3)},`); else console.log("no score.wav: rendering without music");
  bed(`${OUT}/sfx/shore-surf.wav`, 0, at("L07").lineAt, 1.9);
  bed(`${OUT}/sfx/shore-surf.wav`, at("L22").lineAt - 0.3, DUR, 1.9, 4500, true);
  const uw = "assets/sfx/ai/underwater-amb/underwater-amb-01.wav";
  bed(uw, at("L07").lineAt + 0.4, at("L13").end, 0.25, 4000);
  bed(`${OUT}/sfx/pine-wind.wav`, at("L16").lineAt - 0.3, at("L18").end, 1.8);
  const slam = "assets/sfx/kenney/impact/impactWood_light_001.ogg";
  if (existsSync(slam)) add(slam, at("L01").lineAt + 0.2, 1.4);
  const sm = `${OUT}/sfx/smoke-release.wav`;
  if (existsSync(sm)) add(sm, at("L24").lineAt - 0.1, 1.0, "lowpass=f=5000,");
  const k = ins.length / 2, mixPath = `${OUT}/mix.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(3)}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
