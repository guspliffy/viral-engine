// Legend 03: Urashima Taro, code-drawn 2D folklore short. Rendered by tools/svg2d/render.mjs.
// Timeline is built from the real voice takes (out/legend-urashima/vpost); shots cut on word times.
//   node tools/svg2d/render.mjs storyboards/series/legend/urashima/urashima-glitch.mjs out/legend-urashima/urashima-glitch.mp4
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
const CAPS = SPEC.captions || {};

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
for (const ln of Object.values(LINE)) {
  const { sr, s, ch } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / ch / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length / ch; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length / ch, i + hop); j++) a += (s[j * ch] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = cues(ln, JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8")));
  ln.phr = phrases(ln.words, ln.text, CAPS[ln.id]);
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)); return w ? w[1] : ln.dur * frac; };

// ---------------------------------------------------------------- helpers
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e), h0: lerp(a[3], b[3] ?? a[3], e) }; };
const C = (x, y, z, h0 = 1020) => [x, y, z, h0];
const B = SEA.BEACH;

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
// shot(v, d, T, ln): v = seconds since the line starts (negative in a pre-gap), d = line length
const GAP = { L01: 0.2, L02: 0.2, L03: 0.5, L04: 0.45, L05: 0.2, L06: 0.5, L07: 0.45, L08: 0.5, L09: 0.5, L10: 0.2, L11: 0.5, L12: 0.25, L13: 0.5, L14: 0.2, L15: 0.5, L16: 0.4, L17: 0.45, L18: 0.5, L19: 0.5, L20: 0.3, L21: 0.4, L22: 0.4, L23: 0.4, L24: 0.25, L25: 0.5, L26: 0.4, L27: 0.6 };
const BEATS = [];
const beat = (line, shot, o = {}) => BEATS.push({ line, shot, ...o });

// flame meter (fear): calm, smaller at L11, tiny at L23, back to normal at L26
let FLAME = () => 1;
const flameAt = (T) => {
  const at = (id) => TL.find((b) => b.line === id).lineAt;
  return tr([[0, 1], [at("L03") - 0.1, 1], [at("L03") + 0.8, 0.85], [at("L11") - 0.1, 0.85], [at("L11") + 1.2, 0.55], [at("L19"), 0.55], [at("L19") + 1.5, 0.42], [at("L23") - 0.2, 0.42], [at("L23") + 0.3, 0.2], [at("L25") + 3.5, 0.2], [at("L26"), 0.2], [at("L26") + 0.7, 1]], T);
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
// ================================================================ the beats (draft 2 timeline, glitches fixed)
const BX = { ...B.box };
// ---- opening: hand insert (fingers pull the red cord, the lid lifts to a slit), the staff comes in and shuts it, rebound
function openInsert(T, v, fl) {
  const u = clamp((v + 0.3) / 1.08), c = { ...BOXC, z: BOXC.z + 0.08 * u, x: BOXC.x + 0.01 * u };
  const b = SEA.beach(c, T, { sun: [860, 220, 70], pines: false, boat: false });
  const o = v < 0.5 ? lerp(0.1, 0.34, ease(clamp((v + 0.3) / 0.75))) : lerp(0.34, 0, ease(clamp((v - 0.5) / 0.06)));
  const cord = v < 0.5 ? lerp(0.12, 0.34, ease(clamp((v + 0.3) / 0.75))) : 0.2;
  const bx = { ...BX, Y: 0, worn: 1, weed: 1 }, bs = SEA.box(c, { ...bx, lid: o, cord }, T), pt = boxPts(c, bx, o, T);
  const back = v > 0.5 ? ease(clamp((v - 0.5) / 0.2)) * 520 : -Math.sin(clamp((v + 0.3) / 0.8) * 3) * 10;
  const hand = pinchHand({ x: pt.bow.x - back * 0.6 - 4, y: pt.bow.y + back * 0.8 }, 48, pt.sc * 1.25, { sleeve: SLEEVE_KID });
  const gap = v < 0.18 ? 0.9 : v < 0.46 ? lerp(0.9, 0.05, ease(clamp((v - 0.18) / 0.28), "in")) : v < 0.5 ? lerp(0.05, 0, (v - 0.46) / 0.04) : v < 0.62 ? 0 : lerp(0, 0.8, ease(clamp((v - 0.62) / 0.28)));   // Sol r2: contact holds 0.5-0.62
  const tipY = 0.29 + 0.12 * o + gap, tipX = BX.X + 0.04 + (v < 0.5 ? lerp(0.5, 0.0, ease(clamp((v - 0.1) / 0.4))) : lerp(0, 0.35, ease(clamp((v - 0.62) / 0.28))));
  const stf = SEA.staff(c, { X: tipX, Y: tipY, Z: BX.Z - 0.05, rot: 10 + 18 * (tipX - BX.X), flame: fl }, T);
  return `<g transform="translate(${n(shake(v, 0.5, 7))},${n(shake(v, 0.5, 9, 0.18))})">` + b.back + bs.svg + hand + stf + b.front + `</g>`;
}
const OPEN_SHIFT = 0.36;   // draft 2's insert spans 0..1.1 s: the slam lands at 0.7 s, the rebound runs to the cut
beat(null, (v, d, T) => { SEA.mood(0); return openInsert(T, T - 0.6 + OPEN_SHIFT, flameAt(T)); }, { dur: 0.6 });
beat("L01", (v, d, T, ln) => {
  SEA.mood(0); const fl = flameAt(T) + 0.5 * Math.exp(-Math.max(0, v - 0.1) * 5);
  if (v < 0.5) return openInsert(T, v + OPEN_SHIFT, fl);
  if (v < 1.3) { const c = cam((v - 0.5) / 0.8, C(0.12, 0.78, 2.5, 1010), C(0.12, 0.8, 2.7, 1010)), b = beach(c, T, { pines: false });
    return b.back + hosts(c, T, { kid: { X: lerp(-0.36, -0.58, ease(clamp((v - 0.5) / 0.25))), shock: 1 }, keeper: { stern: 1, flame: fl } }) + beachBox(c, T, { lid: 0, weed: 1 }) + b.front; }
  return keeperClose(T, (v - 1.3) / 1, { keeper: { stern: 1, flame: fl } }).svg;
});
beat("L02", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { look: -0.8 } }).svg; });
beat("L03", (v, d, T, ln) => { SEA.mood(0.1); return keeperClose(T, clamp(v / d) * 0.5, { dx: 0.17, dy: 300, keeper: { stern: 1 } }).svg; });

// ---- the rescue: four sub-shots (wide, pokes, the block, the surf), kids with real hands and feet
const TU = B.turtle;
const KP = [{ X: -0.4, Z: 6.9, fx: 0.7, hair: 0 }, { X: -0.05, Z: 8.1, fx: 0.7, hair: 1 }, { X: 0.7, Z: 6.9, fx: -0.7, hair: 2 }];
beat("L04", (v, d, T, ln) => {
  SEA.mood(0); const k = cut(v, 1.5, 3.0, 4.4);
  if (k < 3) {
    const c = [cam(v / 1.5, C(-0.2, 1.55, -1.2, 800), C(0.0, 1.5, -0.6, 820)), cam((v - 1.5) / 1.5, C(0.1, 0.9, 4.5, 980), C(0.12, 0.9, 4.7, 980)), cam((v - 3.0) / 1.4, C(0.0, 0.9, 4.6, 980), C(0.06, 0.9, 4.8, 980))][k];
    const b = SEA.beach(c, T, { sun: [800, 190, 64], boat: true });
    const tu = SEA.turtle(c, { X: TU.X, Y: -0.035, Z: TU.Z, size: 0.45, dir: 1, tuck: 0.92 + 0.08 * Math.sin(v * 9), swim: T * 0.4 }, T);
    const blocking = k === 2, away = blocking ? clamp((v - 3.75) / 0.6) : 0;
    let uxx = k === 0 ? lerp(-3.4, -1.9, ease(clamp(v / 1.5))) : k === 1 ? lerp(-1.9, -1.35, ease(clamp((v - 1.5) / 1.5))) : lerp(-1.35, KP[1].X + 0.05, ease(clamp((v - 3.0) / 0.4)));
    const ur = SEA.urashima(c, { X: uxx, Z: k < 2 ? 7.2 : 7.2, fx: 0.85, reach: blocking ? ease(clamp((v - 3.1) / 0.3)) : 0, look: 0.6, lean: k < 2 ? 5 : 3, Y: k < 2 ? Math.abs(Math.sin(v * 12)) * 0.04 : 0, shock: 0.2 }, T);
    const stickAim = (i, y) => { const a = L.P(c, TU.X + (i - 1) * 0.12, y + 0.06 * Math.sin(T * 8 + i * 2), TU.Z); return { x: a.x, y: a.y }; };
    let hp = null; if (blocking && ur.hold) hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z);
    const kids = KP.map((q, i) => ({ q, i })).sort((a, b2) => b2.q.Z - a.q.Z);
    let body = b.back, fist = "";
    for (const { q, i } of kids) {
      const run = blocking && v > 3.75 ? T * 3 + i : null, mv = run != null ? (i === 1 ? 0.35 : (i - 1) * 1.6) * away : 0;
      let st;
      if (i === 1 && blocking && hp && run == null) st = { ...q, sa: 70, aim: hp };
      else if (i === 1 && k === 1) st = { ...q, sa: 60, aim: stickAim(i, lerp(1.1, 0.12, ease(clamp((v - 1.9) / 1.0), "in"))) };
      else if (blocking) st = { ...q, X: q.X + mv, sa: i === 1 ? 70 : 45, run, aim: run == null ? stickAim(i, 0.25) : undefined };
      else st = { ...q, sa: 55, aim: stickAim(i, 0.12 + 0.1 * (0.5 + 0.5 * Math.sin(T * 7 + i * 2))) };
      body += oldKid(c, st).svg;
    }
    body += tu.svg + tu.front + ur.svg;
    if (hp) fist = `<circle cx="${n(hp.x)}" cy="${n(hp.y)}" r="${n(hp.s * 0.034)}" fill="#f0c49c" stroke="${INKC}" stroke-width="2"/><path d="M${n(hp.x - hp.s * 0.012)},${n(hp.y - hp.s * 0.02)} v${n(hp.s * 0.04)} M${n(hp.x + hp.s * 0.008)},${n(hp.y - hp.s * 0.022)} v${n(hp.s * 0.044)}" stroke="${INKC}" stroke-width="1.6"/>`;
    return body + fist + b.front + WARM;
  }
  // the surf: carried to the water's edge, lowered, one flipper kick, the shell slips under (the turtle always rides on his arms or the sand/sea)
  const u = v - 4.4, c = cam(u / 1.4, C(0.3, 0.9, 5.4, 990), C(0.4, 0.9, 5.6, 990));
  const b = SEA.beach(c, T, { sun: [800, 190, 64], boat: true });
  const wx = 1.0, edge = SEA.shoreZ(wx) + 0.05, walk = ease(clamp(u / 0.55)), low = ease(clamp((u - 0.4) / 0.35));
  const ur = SEA.urashima(c, { X: lerp(0.3, wx - 0.45, walk), Z: lerp(7.2, edge - 0.55, walk), fx: 0.85, reach: 1, look: 0.6, kneel: 0.55 * low, bow: 10 * low }, T);
  let body = b.back;
  if (u < 0.8) {
    const h = ur.hold || { X: wx, Y: 1, Z: edge };
    const tu = SEA.turtle(c, { X: h.X + 0.02, Y: h.Y - 0.14, Z: h.Z - 0.02, size: 0.45, dir: 1, tuck: 0.3, swim: T * 1.2 }, T);
    body += ur.svg + tu.svg + tu.front;
  } else {
    const r = u - 0.8, tz = edge - 0.05 + 0.5 * ease(clamp(r / 0.7)), ty = -0.5 * ease(clamp((r - 0.1) / 0.5)), tx = wx + 0.1 + 0.3 * r;
    const tu = SEA.turtle(c, { X: tx, Y: ty, Z: tz, size: 0.45, dir: 1, tuck: 0, swim: T * 4 }, T), wy = L.P(c, tx, 0, tz).y, id = "wlc" + Math.round(u * 100);
    body += ur.svg + `<clipPath id="${id}"><rect x="0" y="0" width="${W}" height="${n(wy)}"/></clipPath><g clip-path="url(#${id})">${tu.svg}${tu.front}</g>`;
    const wp = L.P(c, tx, 0, tz);
    for (let i = 0; i < 3; i++) { const q = clamp((r - 0.05 - i * 0.15) / 0.6); if (q > 0 && q < 1) body += `<ellipse cx="${n(wp.x)}" cy="${n(wp.y)}" rx="${n(wp.s * (0.15 + 0.5 * q))}" ry="${n(wp.s * (0.04 + 0.12 * q))}" fill="none" stroke="#ffffff" stroke-width="3" opacity="${n(0.7 * (1 - q))}"/>`; }
  }
  return body + b.front + WARM;
});
beat("L05", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { grin: 1 } }).svg; });
beat("L06", (v, d, T) => { SEA.mood(0.1); return keeperClose(T, v / d, { keeper: { stern: 1 } }).svg; });

// ---- the dive: ONE follow with a fixed camera (no size snap), the turtle's nose in frame; only the exterior cut changes size
function palaceExterior(T, v) {
  const dc = { ...SEA.DIVE.cam.main }, e = clamp(v / 1.6), dv = SEA.dive(dc, T, { depth: 0.95, palace: 1 });
  const tu = SEA.turtle(dc, { X: lerp(-1.2, -0.7, e), Y: 2.45, Z: 8.5, size: 1, dir: 1, pitch: 24, swim: T * 0.9 }, T), ur = SEA.urashima(dc, { ...tu.seat, ride: 1, fx: 0.75, bow: 12 }, T);
  return dv.back + tu.svg + ur.svg + tu.front + dv.front;
}
beat("L07", (v, d, T, ln) => {
  const f = v / d; SEA.mood(lerp(0.55, 1.25, ease(f)));
  if (v < 3.0) { const dc = { ...SEA.DIVE.cam.main, h0: SEA.DIVE.cam.main.h0 + 150 }, e = clamp(v / 3.0), dv = SEA.dive(dc, T, { depth: lerp(0.0, 0.85, e) }), tu = SEA.turtle(dc, { X: -0.28, Y: 1.15, Z: 3.9, size: 1, dir: 1, pitch: lerp(10, 24, e), swim: T * 0.9 }, T), ur = SEA.urashima(dc, { ...tu.seat, ride: 1, fx: 0.75, shock: 0.3, bow: 8, look: 0.6 }, T); return dv.back + tu.svg + ur.svg + tu.front + dv.front; }
  return palaceExterior(T, v - 3.0);
});

// ---- the Dragon Palace: singles never show a sliver of the other character
const hall = (c, T, o = {}) => {
  const h = SEA.palace(c, T, {}), ot = SEA.otohime(c, { X: 0.5, Z: 9.9, fx: o.otFx ?? -0.6, sad: 0.3, blink: blinkAmt(T % 3.1, [0.9]), talk: talkOf("O", T), give: o.give || 0, ...(o.ot || {}) }, T);
  const ur = o.ur === null ? { svg: "" } : SEA.urashima(c, { X: -0.5, Z: 9.8, fx: 0.75, sad: 0.3, blink: blinkAmt(T % 2.9, [1.7]), talk: talkOf("U", T), ...(o.ur || {}) }, T);
  return { h, ot, ur };
};
beat("L08", (v, d, T, ln) => {
  SEA.mood(2); const k = cut(v, 1.3, 2.9);
  if (k === 0) { const c = cam(v / 1.3, C(0, 1.5, 0.5, 1130), C(0, 1.45, 2.5, 1130)), { h, ot, ur } = hall(c, T, { otFx: -0.6 }); return h.back + ot.svg + ur.svg + h.front; }
  const c = k === 1 ? cam((v - 1.3) / 1.6, C(0.35, 1.25, 8.0, 1080), C(0.38, 1.27, 8.35, 1080)) : cam((v - 2.9) / 1.2, C(-0.4, 1.2, 8.1, 1080), C(-0.4, 1.22, 8.35, 1080));
  const { h, ot, ur } = hall(c, T, { otFx: k === 1 ? -0.5 : -0.6 });
  return h.back + (k === 1 ? ot.svg : ur.svg) + h.front;
});
// ---- the four seasons: one slow push to the wall, then an insert exactly on each spoken word
beat("L09", (v, d, T, ln) => {
  SEA.mood(2); const S = ["spring", "summer", "autumn", "winter"].map((s) => ws(ln, s, 0.5) - 0.04), w0 = S[0] - 0.05;
  const k = S.findIndex((x) => v >= x && v < x + 0.8);
  if (k >= 0) { const z = 1 + 0.05 * clamp((v - S[k]) / 0.8); return `<g transform="translate(540,960) scale(${n(z)}) translate(-540,-960)">${SEA.seasonView(k, 0, 0, W, H, T)}</g>`; }
  const c = cam(v / w0, C(0, 2.5, 0.6, 960), C(0, 2.55, 1.9, 960));
  const lastK = S.reduce((a, x, i) => (v >= x ? i : a), -1);   // Sol r2: 'Autumn.' over the wall keeps the autumn pane lit
  return SEA.seasons(v < w0 ? c : SEA.SEASONS.cam.all, T, lastK >= 0 ? { open: [1, 1, 1, 1], focus: lastK } : { open: [1, 1, 1, 1] });
});
beat("L10", (v, d, T) => { SEA.mood(0.1); return kidClose(T, v / d, { kid: { shock: 0.5, grin: 0.8 } }).svg; });
beat("L11", (v, d, T, ln) => {
  const a = ws(ln, "year", 2.2) + 0.35, bb = ws(ln, "he", 3.1) - 0.05;
  if (v >= a && v < bb + 0.02) { SEA.mood(2); const f = Math.round((v - a) * FPS), pane = Math.min(3, Math.floor(f / 4)); return SEA.seasons(SEA.SEASONS.cam.all, T, { open: [1, 1, 1, 1], focus: pane }); }
  SEA.mood(0.2); return keeperClose(T, v < a ? v / a * 0.5 : 0.5 + (v - bb) / (d - bb) * 0.5, { keeper: { stern: 1 } }).svg;
});
beat("L12", (v, d, T) => { SEA.mood(2.6); const c = cam(v / d, C(-0.5, 1.28, 8.0, 1080), C(-0.5, 1.3, 8.3, 1080)), { h, ot, ur } = hall(c, T, { ur: { sad: 1, fx: 0.7 } }); return h.back + ur.svg + h.front; });
// ---- the gift: the box rests in Otohime's palms, then both hands are on it as the weight passes
beat("L13", (v, d, T, ln) => {
  SEA.mood(2.4); const w = ws(ln, "but", 1.8) - 0.1, c = cam(v / d, C(0.0, 1.25, 7.2, 1080), C(0.0, 1.15, 7.8, 1080));
  const u = ease(clamp((v - w) / (d - w - 0.25)));
  const { h, ot, ur } = hall(c, T, { give: 1 - 0.5 * u, ot: { sad: 0.8 }, ur: { reach: 0.3 + 0.7 * ease(clamp((v - w + 0.45) / 0.4)), sad: 0.7, fx: 0.75 } });   // Sol r2: palm under the base first
  const a = ot.hold, b2 = ur.hold || a, bp = { X: lerp(a.X, b2.X, u), Y: lerp(a.Y, b2.Y, u), Z: lerp(a.Z, b2.Z, u) };
  return h.back + ot.svg + ur.svg + SEA.box(c, { ...bp, X: bp.X - 0.02 * (1 - u), held: true }, T).svg + h.front;
});
beat("L14", (v, d, T) => { SEA.mood(0.05); return kidClose(T, v / d, { kid: { shock: 1 } }).svg; });
beat("L15", (v, d, T) => {
  SEA.mood(0.15); const rise = ease(clamp(v / 0.5));
  return keeperClose(T, v / d, { keeper: { stern: 0.2 }, noArm: true, extra: (c) => grandmaArm(c, CA.keeper.X, CA.keeper.Z, [-24, -92 - 12 * rise], { finger: true, rot: 4 }) }).svg;
});
// ---- the village 300 years on
const villageCam = SEA.VILLAGE.cam.wide;
beat("L16", (v, d, T, ln) => {
  SEA.mood(3); const w = wordAt(ln, "nobody", 0.5) - 0.1;
  if (v < w) { const c = cam(v / w, [villageCam.x, villageCam.y, villageCam.z, villageCam.h0], [villageCam.x + 0.2, villageCam.y - 0.1, villageCam.z + 0.6, villageCam.h0]), vl = SEA.village(c, T, { sun: [760, 200, 56] }), ur = SEA.urashima(c, { X: -1.3, Z: 4.8, age: 0, fx: 0.75, sad: 0.7, bow: 4 }, T); return SEA.wash(vl.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, T).svg + SEA.wash(vl.front); }
  const c = cam((v - w) / (d - w), C(0.5, 1.3, 0.6, 1050), C(0.3, 1.3, 1.5, 1050)), vl = SEA.village(c, T, { sun: [760, 200, 56] }), ur = SEA.urashima(c, { X: -0.35, Z: 4.2, fx: 0.75, sad: 0.7, bow: 4, blink: blinkAmt(T % 3, [1]) }, T);
  return SEA.wash(vl.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, T).svg + SEA.wash(vl.front);
});
// the old villager: a medium so her hands, cane grip and legs show; the caption lane clears her hat tip
beat("L17", (v, d, T) => {
  SEA.mood(3); const c = cam(v / d, C(0.3, 1.1, 2.0, 1090), C(0.3, 1.1, 2.3, 1090)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
  return SEA.wash(vl.back) + villager(c, { X: 0.3, Z: 4.4, fx: -0.7, talk: talkOf("V", T), gest: 0.35 + 0.35 * Math.max(0, Math.sin(v * 2.4)), blink: blinkAmt(T % 3.4, [1.4]) }, T) + SEA.wash(vl.front);
});
// the grave: he kneels (feet planted until the knees land), the closed box set in the sand beside him
beat("L18", (v, d, T) => {
  SEA.mood(3); const c = cam(v / d, C(0.2, 0.95, 2.0, 1010), C(0.18, 0.92, 2.6, 1010)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
  const k = ease(clamp(v / 0.9)), ur = SEA.urashima(c, { ...SEA.VILLAGE.stand, X: -0.2, age: 0, fx: 0.75, sad: 1, kneel: k, reach: 0.3 + 0.6 * clamp((v - 0.7) / 0.4), bow: 8, blink: blinkAmt(T % 3.2, [1.5]) }, T);
  const bx = SEA.box(c, { X: 0.28, Y: 0, Z: 4.9, worn: 0 }, T).svg;
  return SEA.wash(vl.back + ur.svg + vl.front) + bx + `<rect width="${W}" height="${H}" fill="#1a2640" opacity="0.18" style="mix-blend-mode:multiply"/>`;
});
// the kid keeps the beach's own colours
beat("L19", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { shock: 0.7, worry: 1 } }).svg; });

// ---- proof: one continuous glide over the scroll, then the shrine
const brush = (seed, x, y, w, h) => { let s = ""; const rows = 14; for (let i = 0; i < rows; i++) { const yy = y + 40 + i * (h - 80) / rows; const l = 18 + hash(seed + i * 5) * 40; const st = 2 + Math.floor(hash(seed + i) * 3); for (let j = 0; j < st; j++) { const a = hash(seed + i * 13 + j) * 3.2; s += `<path d="M${n(x + 10 + (j - 1) * 6)},${n(yy)} q${n(Math.cos(a) * l * 0.6)},${n(Math.sin(a) * l * 0.5 + l * 0.4)} ${n(Math.cos(a + 1.2) * l)},${n(l * 0.8 + Math.sin(a) * 6)}" stroke="#1a1328" stroke-width="${n(3 + hash(seed + j + i) * 6)}" stroke-linecap="round" fill="none" opacity="0.86"/>`; } if (hash(seed + i * 3) > 0.7) s += `<circle cx="${n(x + 14)}" cy="${n(yy + 22)}" r="${n(3 + hash(i) * 3)}" fill="#1a1328" opacity="0.8"/>`; } return s; };
const SHRINE_BODY = `<ellipse cx="540" cy="1360" rx="440" ry="40" fill="#0006"/><rect x="250" y="1010" width="580" height="340" fill="#5a3a2a" stroke="#1a1328" stroke-width="6"/><rect x="300" y="1060" width="480" height="240" fill="#1a1328"/><path d="M180,1020 L540,830 L900,1020 L860,1050 L540,890 L220,1050 Z" fill="#2a2430" stroke="#1a1328" stroke-width="6"/><rect x="240" y="1340" width="600" height="30" fill="#9a8a7a"/>`;
const lattice = (x, y, w, h, sw = 12, sp = 55) => Array.from({ length: Math.round(w / sp) + 1 }, (_, i) => `<rect x="${x + i * sp - sw / 2}" y="${y}" width="${sw}" height="${h}" fill="#8a5a3a" stroke="#1a1328" stroke-width="2"/>`).join("") + Array.from({ length: Math.round(h / (sp + 5)) + 1 }, (_, i) => `<rect x="${x}" y="${y + i * (sp + 5) - 4}" width="${w}" height="8" fill="#8a5a3a" stroke="#1a1328" stroke-width="2"/>`).join("");
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
beat("L20", (v, d, T, ln) => {
  SEA.mood(3); const sw = ws(ln, "shrine", 4.6) - 0.2;
  if (v < sw) return scrollShot(clamp(v / sw));
  const c = cam((v - sw) / (d - sw), C(0.0, 1.2, 0.2, 1000), C(0.0, 1.0, 1.4, 1000)), b = SEA.beach(c, T, { sun: [800, 230, 60], boat: false });
  const box = `<g transform="translate(540,1250) scale(0.36)"><rect x="-260" y="-360" width="520" height="360" rx="22" fill="#1d1830" stroke="#8a7ab8" stroke-width="8"/><rect x="-280" y="-420" width="560" height="90" rx="18" fill="#2a2342" stroke="#8a7ab8" stroke-width="8"/><g transform="translate(0,-210)" stroke="#f2b82e" stroke-width="6" fill="none" stroke-linejoin="round"><path d="M-90,60 h180 M-70,60 v-40 h140 v40 M-60,20 l60,-40 l60,40 M-50,-20 h100 M-40,-20 l40,-35 l40,35 M0,-55 v-30"/></g><path d="M-260,-240 H260 M0,-360 V0" stroke="#e8321e" stroke-width="14"/><circle cx="0" cy="-240" r="26" fill="#e8321e" stroke="#1a1328" stroke-width="4"/></g>`;
  return SEA.wash(b.back) + SHRINE_BODY + box + `<g opacity="0.95">${lattice(300, 1060, 480, 240, 10)}</g>` + b.front;
});
// ---- the sky races through days: three cameras as in draft 2, but one continuous sky and one continuous growth (no flicker, no jumps)
beat("L21", (v, d, T) => {
  SEA.mood(0); const f = v / d, k = cut(v, 2.6, 5.2);
  const c = ob([C(0, 1.4, -1.2, 820), C(0.0, 0.7, 0.5, 1020), C(0.2, 1.1, -0.4, 880)][k]);
  const th = (0.3 + f * 2.0) * Math.PI * 2, sunX = 540 - Math.cos(th) * 520, sunY = 940 - Math.sin(th) * 860, night = clamp(0.5 - 0.7 * Math.sin(th));
  const b = SEA.beach(c, T, { sun: [sunX, sunY, 60], pines: false, boat: false });
  const gr = 2 + 6 * ease(f), pines = SEA.pine(c, { X: 2.9, Z: 7.0, h: gr, seed: 1, lean: -0.3, t: T }) + SEA.pine(c, { X: -4.9, Z: 8.3, h: gr * 0.8, seed: 4, lean: 0.34, t: T });
  const ur = SEA.urashima(c, { X: -0.2, Z: 7.4, fx: 0.75, age: 0 }, T);
  const mx = 540 + Math.cos(th) * 520, my = 940 + Math.sin(th) * 860, moon = `<circle cx="${n(mx)}" cy="${n(my)}" r="46" fill="#f6f3ea" opacity="${n(clamp((1000 - my) / 160) * clamp(night * 2))}"/>`;
  return b.back + moon + pines + `<g style="filter:brightness(0.12)">${ur.svg}</g>` + b.front + `<rect width="${W}" height="${H}" fill="#101a4a" opacity="${n(night * 0.6)}" style="mix-blend-mode:multiply"/>`;
});
// ---- dusk: alone with the box
beat("L22", (v, d, T) => {
  SEA.mood(3.6); const c = cam(v / d, C(0.0, 1.0, 1.0, 1000), C(0.25, 1.0, 2.6, 1000)), b = SEA.beach(c, T, { sun: [200, 700, 110], glitter: [200], boat: false });
  const ur = SEA.urashima(c, { X: 0.2, Z: 5.4, fx: 0.9, age: 0, sad: 0.8, reach: 0.7, look: 0.8, blink: blinkAmt(T % 3.4, [1.2]) }, T);
  return b.back + ur.svg + SEA.box(c, { ...ur.hold, held: true }, T).svg + b.front;
});
// ---- "No, no, no...": ONE kid close-up (his mouth moves on his words), then the fingers: thumb hesitates, the cord is pulled loose, the lid lifts
const KE23 = 0.85;
const SEG23 = () => TL.find((b) => b.line === "L23").lineAt + KE23;
const insertAt = (T, o = {}) => { const s = T - SEG23(), hes = clamp(s / 0.3), pl = ease(clamp((s - 0.3) / 0.6)), lid = ease(clamp((s - 0.95) / 0.5)) * 0.32;
  return fingersInsert(T, { cord: 0.7 * pl, pull: pl * 0.6, hes: s < 0.3 ? s : 0, lid, push: 0.02 * Math.max(0, s), ...o }); };
beat("L23", (v, d, T, ln) => {
  if (v < KE23) { SEA.mood(0); return kidClose(T, v / KE23 * 0.5, { kid: { shock: 1, worry: 1 } }).svg; }
  return insertAt(T);
});
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
// ---- white smoke: the cord's last pull and the first wisp in the insert, then ONE locked medium for the ageing (no cuts, no pose pop)
const CAGE = { x: 0.2, y: 1.1, z: 3.0, h0: 1150 };
beat("L24", (v, d, T, ln) => {
  const sw = 0.8;
  if (v < sw) { const e = clamp(v / sw); return insertAt(T, { lid: 0.32 * ease(clamp((T - SEG23() - 0.95) / 0.5)) + 0.1 * e, amt: v > 0 ? 0.12 + 0.3 * e : 0 }); }
  SEA.mood(3.6);
  const c = CAGE, t3 = ws(ln, "three", 1.5), ag = ease(clamp((v - t3 + 0.1) / 1.2));
  const amt = v < t3 ? lerp(0.42, 1.0, ease(clamp((v - sw) / (t3 - sw)))) : v < t3 + 1.0 ? 1.0 : lerp(1.0, 0, ease(clamp((v - t3 - 1.0) / (d - t3 - 1.0))));
  const b = SEA.beach(c, T, { boat: false, pines: false, sun: [200, 700, 110], glitter: [200] });
  const ur = SEA.urashima(c, { X: 0.0, Z: 4.4, fx: 0.8, age: ag, reach: 1, shock: 0.4, sad: ag, blink: 0, look: 0.3 }, T);
  const bx = SEA.box(c, { ...ur.hold, held: true, lid: 0.9, cord: 1, hinge: true }, T), hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z), sk = ag > 0.5 ? "#dccbbd" : "#f0c49c";
  const palm = `<ellipse cx="${n(hp.x - hp.s * 0.02)}" cy="${n(hp.y + hp.s * 0.02)}" rx="${n(hp.s * 0.15)}" ry="${n(hp.s * 0.045)}" fill="${sk}" stroke="${INKC}" stroke-width="2.5"/>`;
  const thumb = `<path d="M${n(hp.x - hp.s * 0.12)},${n(hp.y - hp.s * 0.02)} q${n(hp.s * 0.05)},${n(-hp.s * 0.1)} ${n(hp.s * 0.1)},${n(-hp.s * 0.05)}" stroke="${INKC}" stroke-width="${n(hp.s * 0.05)}" stroke-linecap="round" fill="none"/><path d="M${n(hp.x - hp.s * 0.12)},${n(hp.y - hp.s * 0.02)} q${n(hp.s * 0.05)},${n(-hp.s * 0.1)} ${n(hp.s * 0.1)},${n(-hp.s * 0.05)}" stroke="${sk}" stroke-width="${n(hp.s * 0.04)}" stroke-linecap="round" fill="none"/>`;
  const pk = v < t3 ? amt : 1, late = Math.max(0, v - t3 - 1.0);   // Sol r2: after the peak the puffs keep their size and drift up while they thin
  const sm = SEA.smoke(c, { ...bx.mouth, amt: pk, rise: 1.4 + 1.6 * pk + 0.5 * late, spread: lerp(0.6, 1.3, pk), drift: 0.4 + 0.3 * late, seed: 2 }, T);
  return b.back + ur.svg + palm + bx.svg + thumb + `<g opacity="${n(v < t3 + 1.0 ? clamp(amt * 3) : Math.pow(amt, 0.7))}">${sm}</g>`;
});
beat("L25", (v, d, T) => {
  SEA.mood(3.6); const c = cam(v / d, C(0.2, 1.1, 3.0, 1150), C(0.3, 1.05, 3.5, 1180)), b = SEA.beach(c, T, { boat: false, pines: false, sun: [200, 700, 110], glitter: [200] });
  const ur = SEA.urashima(c, { X: 0.0, Z: 4.4, fx: 0.8, age: 1, reach: 1, sad: 1, blink: blinkAmt(T % 3.6, [1.8]) }, T), bx = SEA.box(c, { ...ur.hold, held: true, lid: 0.9, cord: 1, hinge: true }, T), hp = L.P(c, ur.hold.X, ur.hold.Y, ur.hold.Z);
  const palm = `<ellipse cx="${n(hp.x - hp.s * 0.02)}" cy="${n(hp.y + hp.s * 0.02)}" rx="${n(hp.s * 0.15)}" ry="${n(hp.s * 0.045)}" fill="#dccbbd" stroke="${INKC}" stroke-width="2.5"/>`;
  return b.back + ur.svg + palm + bx.svg;
});
// ---- back in the present: the kid's shoe pushes the seaweed box, then the boy; one steady grandma
beat("L26", (v, d, T, ln) => {
  SEA.mood(4); const sw = 1.1;
  if (v < sw) {
    const c = cam(v / sw, C(0.22, 0.6, 2.6, 1010), C(0.24, 0.6, 2.75, 1010)), b = SEA.beach(c, T, { sun: [230, 600, 120], glitter: [230], boat: false });
    const push = clamp((v - 0.2) / 0.5), bxX = B.box.X + 0.45 * ease(clamp((v - 0.35) / 0.6), "out"), kx = B.kid.X, kz = 4.5;
    const kidSvg = hosts(c, T, { kid: { X: kx, Z: kz, reachL: 0, worry: 0.8 }, keeper: { stern: 0.8 } });
    const foot = (px) => { const hip = L.P(c, kx + 0.04, 0.5, kz), fp0 = L.P(c, Math.min(px - 0.24, kx + 0.34), 0.0, 4.3), fp = { ...fp0, s: fp0.s * 0.55 }, kn = { x: lerp(hip.x, fp.x, 0.5) - 6, y: lerp(hip.y, fp.y, 0.5) - 25 };
      return `<path d="M${n(hip.x)},${n(hip.y)} L${n(kn.x)},${n(kn.y + 30)} L${n(fp.x)},${n(fp.y - 14)}" stroke="${INKC}" stroke-width="${n(fp.s * 0.05)}" stroke-linecap="round" fill="none"/><path d="M${n(hip.x)},${n(hip.y)} L${n(kn.x)},${n(kn.y + 30)} L${n(fp.x)},${n(fp.y - 14)}" stroke="#d9cba9" stroke-width="${n(fp.s * 0.038)}" stroke-linecap="round" fill="none"/><path d="M${n(fp.x - fp.s * 0.1)},${n(fp.y - fp.s * 0.04)} q${n(fp.s * 0.02)},${n(-fp.s * 0.1)} ${n(fp.s * 0.1)},${n(-fp.s * 0.08)} L${n(fp.x + fp.s * 0.18)},${n(fp.y - fp.s * 0.04)} Q${n(fp.x + fp.s * 0.2)},${n(fp.y + fp.s * 0.02)} ${n(fp.x + fp.s * 0.12)},${n(fp.y + fp.s * 0.02)} L${n(fp.x - fp.s * 0.1)},${n(fp.y + fp.s * 0.02)} Z" fill="#f2eff6" stroke="${INKC}" stroke-width="2.5"/><path d="M${n(fp.x - fp.s * 0.1)},${n(fp.y)} h${n(fp.s * 0.28)}" stroke="#b8344c" stroke-width="${n(fp.s * 0.02)}"/>`; };
    return b.back + kidSvg + SEA.box(c, { ...B.box, worn: 1, weed: 1 }, T).svg + b.front;   // Sol r2: the drawn push leg read as a third leg, so the box stays put
  }
  return kidClose(T, (v - sw) / (d - sw), { kid: { look: -0.9 } }, undefined, true).svg;
});
// ---- grandma: her FREE arm touches the bun and settles (no third hand, no snap back)
const grandma = (T, u, hand) => {
  SEA.mood(4);
  const h = ease(hand);
  return keeperClose(T, u, { dy: 0, keeper: { stern: 0.3, open: 1 }, noArm: true, extra: (c) => grandmaArm(c, CA.keeper.X, CA.keeper.Z, [lerp(-18, -9, h) - 16 * Math.sin(Math.PI * h), lerp(-68, -126, h)], { rot: lerp(180, 296, h), ext: [0.3, 0.3, 0.3, 0.25] }) }, undefined, true).svg;
};
beat("L27", (v, d, T, ln) => { const p = ws(ln, "peek", 2.0); return grandma(T, (v + 0.2) / 4.5, v < p - 0.5 ? 0 : v < p + 0.1 ? clamp((v - p + 0.5) / 0.6) : clamp(1 - (v - p - 0.1) / 0.5)); }, { hold: 0.6 });
beat("L28", (v, d, T) => grandma(T, (v + 0.6 + 3.15 + 0.2) / 4.5, 0.0), { end: true });

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0, prev = null;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur;
  const pre = prev ? (b.line === "L28" ? 0 : (GAP[prev.line] ?? 0.4)) : 0;
  const st = t + (prev ? (prev.line === "L27" ? 0 : GAP[prev.line] ?? 0) : 0);
  const lineAt = st;
  const lastEnd = b.end ? wordEnd(ln) + 0.1 : d + (b.hold || 0);
  TL.push({ ...b, ln, d, at: t, lineAt, end: lineAt + lastEnd });
  t = lineAt + lastEnd; prev = b;
}
function wordEnd(ln) { return ln.words[ln.words.length - 1][2]; }
// L27's 0.6 s hold plus the gap rule: L28 starts after the hold
for (let i = 0; i < TL.length; i++) if (TL[i].line === "L28") { TL[i].at = TL[i - 1].end; }
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
export const FADE = 0;
export const GAIN = 1;

// ---------------------------------------------------------------- captions: word by word in the upper third
const KEY = /^(three|hundred|478|nineteen|window|years?|box|sea|smoke|never|gift|locked)/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.2, x.end));
  if (!b || !b.ln.words.length) return "";
  const lane = { L03: 300, L11: 430, L17: 300, L23: 520, L24: 400, L25: 400, L26: 300, L27: 190, L28: 190 }[b.line] ?? 480;
  return captionSvg(b.ln.phr, time - b.lineAt, { reveal: true, key: KEY, y: lane });
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds(); SEA.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const v = time - b.lineAt, d = b.d;
  const body = b.shot(v, d, time, b.ln);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${SEA.defs()}${body}${SEA.vignette()}${captions(time)}</svg>`;
}
// the cast's own grade is part of the frame: SEA.grade() tints the cast per mood
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- the sound mix
export function prepare(outPath) {
  mkdirSync(OUT, { recursive: true });
  const ins = [], f = [];
  const add = (file, at, gain = 1, extra = "") => { ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.max(0, Math.round(at * 1000))}:all=1[a${k}]`); };
  const bed = (file, from, to, gain, lp = 4500, hard = false) => { if (!existsSync(file)) { console.log("skip (missing):", file); return; } const dd = to - from; add(file, from, gain, `aloop=loop=-1:size=2e9,atrim=0:${dd.toFixed(2)},lowpass=f=${lp},afade=t=in:d=0.5,${hard ? "" : `afade=t=out:st=${Math.max(0, dd - 0.5).toFixed(2)}:d=0.5,`}`); };
  const at = (id) => TL.find((b) => b.line === id);
  for (const b of TL) if (b.ln) add(`${VOICE}/${b.ln.id}.wav`, b.lineAt, 1);
  // levels measured: voices -16.3 LUFS, score -21.2 (gain 0.78 puts it 7 dB under), surf -31.5, pine -32.8, underwater -14.9
  if (existsSync(`${OUT}/score-glitch.wav`)) add(`${OUT}/score-glitch.wav`, 0, 0.78, `atrim=0:${DUR.toFixed(3)},`); else console.log("no score-glitch.wav: rendering without music");
  bed(`${OUT}/sfx/shore-surf.wav`, 0, at("L07").lineAt, 1.9);
  bed(`${OUT}/sfx/shore-surf.wav`, at("L22").lineAt - 0.3, DUR, 1.9, 4500, true);
  const uw = "assets/sfx/ai/underwater-amb/underwater-amb-01.wav";
  bed(uw, at("L07").lineAt + 0.4, at("L13").end, 0.25, 4000);
  bed(`${OUT}/sfx/pine-wind.wav`, at("L16").lineAt - 0.3, at("L19").end, 1.8);
  const slam = "assets/sfx/kenney/impact/impactWood_light_001.ogg";
  if (existsSync(slam)) add(slam, at("L01").lineAt + 0.1, 1.4);
  const sm = `${OUT}/sfx/smoke-release.wav`;
  if (existsSync(sm)) add(sm, at("L24").lineAt + 0.1, 1.0, "lowpass=f=5000,");
  const k = ins.length / 2, mixPath = `${OUT}/mix-glitch.wav`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(3)}[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/timeline-glitch.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +b.lineAt.toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
