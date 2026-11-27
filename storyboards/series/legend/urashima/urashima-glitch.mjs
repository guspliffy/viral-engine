// Legend 03: Urashima Taro, code-drawn 2D folklore short. Rendered by tools/svg2d/render.mjs.
// Timeline is built from the real voice takes (out/legend-urashima/vpost); shots cut on word times.
//   node tools/svg2d/render.mjs storyboards/series/legend/urashima/urashima.mjs out/legend-urashima/urashima-glitch.mp4
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
  const kp = o.keeper === null ? "" : (() => { const k = L.keeper(c, { X: B.keeper.X, Z: B.keeper.Z, fx: -0.7, stern: 0.6, flame: flameAt(T), blink: blinkAmt(T % 3.9, [2.4]), talk: talkOf("G", T), ...(o.keeper || {}) }, T); return k.svg + (k.arm || ""); })();
  return kid + kp;
};
const beachBox = (c, T, o = {}) => SEA.box(c, { ...B.box, worn: 1, ...o }, T).svg;
const beach = (c, T, o = {}) => SEA.beach(c, T, { sun: [860, 250, 70], ...o });
const CL = B.cam.close, CA = B.closeAt;
// single close-ups (designer's preset): one face per shot, head and shoulders, the other character out of frame
const ob = (a) => ({ x: a[0], y: a[1], z: a[2], h0: a[3] ?? 1020 });
const closeCam = (u, dz = 0.2, dx = 0) => ({ ...CL, x: CL.x + dx, z: CL.z + dz * ease(clamp(u)) });
const kidClose = (T, u, o = {}, sun = [860, 250, 70], gold = false) => { const c = closeCam(u, 0.2, CA.kid.X), b = SEA.beach(c, T, { sun: gold ? [230, 760, 120] : sun, glitter: gold ? [230] : undefined, boat: false, ...(o.beach || {}) }); return { c, svg: (o.wash ? SEA.wash(b.back) : b.back) + hosts(c, T, { kid: { ...CA.kid, ...(o.kid || {}) }, keeper: null }) + b.front }; };
const keeperClose = (T, u, o = {}, sun = [860, 250, 70], gold = false) => { const c = closeCam(u, 0.2, CA.keeper.X), b = SEA.beach(c, T, { sun: gold ? [230, 760, 120] : sun, glitter: gold ? [230] : undefined, boat: false }); return { c, svg: b.back + hosts(c, T, { kid: null, keeper: { ...CA.keeper, ...(o.keeper || {}) } }) + (o.extra ? o.extra(c) : "") + b.front }; };

// ---- drawn locally (the design lib has no village kids, villager or small hands)
const INKC = "#1a1328", SKINK = "#e6bf9e";
// a hand in local cm, wrist at the origin, fingers up: ext = how far each of the four fingers stands (0 curled .. 1 out)
function handSvg(k, ext = [1, 1, 1, 1], rot = 0, thumb = 1, fill = SKINK) {
  const len = [7.5, 9, 8.5, 6.5];
  const fing = ext.map((e, i) => { const l = lerp(2.2, len[i], e); return `<rect x="${-4 + i * 2}" y="${-9 - l}" width="2" height="${l + 2}" rx="1" fill="${fill}"/>`; }).join("");
  const th = `<ellipse cx="-4.6" cy="${-3.5 - 1.5 * thumb}" rx="1.5" ry="${2 + 1.4 * thumb}" transform="rotate(${-20 - 15 * thumb} -4.6 -3.5)" fill="${fill}"/>`;
  return `<g transform="rotate(${n(rot)}) scale(${n(k)})" stroke="${INKC}" stroke-width="0.55" stroke-linejoin="round">${th}${fing}<path d="M-4.2,1 Q-5,-5 -4.2,-9.5 L4.2,-9.5 Q5,-5 4.2,1 Z" fill="${fill}"/><path d="M-2,-9.3 L-2,-6 M0,-9.3 L0,-6 M2,-9.3 L2,-6" stroke-width="0.35" fill="none"/></g>`;
}
// an old-days village kid: short tunic, simple hair, a stick; st: { X, Z, fx, run (phase or null), poke (0..1 stick motion), hair 0 shaved | 1 topknot | 2 bowl, col }
function oldKid(c, st) {
  const p = L.P(c, st.X, 0, st.Z), k = p.s / 100, d = (st.fx ?? 0.7) > 0 ? 1 : -1, sw = st.run == null ? 0 : Math.sin(st.run * Math.PI * 2), bob = st.run == null ? 0 : -Math.abs(sw) * 3;
  const col = st.col || ["#a8793f", "#8a8378", "#c29a45"][st.hair || 0], colS = "#00000030", poke = st.poke || 0;
  const hand = [14 * d, -66 + poke * 8], tip = [36 * d, -28 + poke * 10];
  const hair = st.hair === 1 ? `<path d="M-9.5,-95 Q-9,-106 0,-106 Q9,-106 9.5,-95 Q4,-99 0,-99 Q-4,-99 -9.5,-95 Z" fill="#1d1829"/><circle cx="${d * 1}" cy="-109" r="3.6" fill="#1d1829"/>` : st.hair === 2 ? `<path d="M-10,-93 Q-11,-106 0,-106 Q11,-106 10,-93 L8,-97 Q0,-101 -8,-97 Z" fill="#1d1829"/>` : `<path d="M-8,-99 Q0,-104 8,-99" stroke="#6b5a4a" stroke-width="0.8" fill="none" opacity="0.7"/>`;
  return `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(k)})" stroke="${INKC}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="0" cy="1" rx="17" ry="3" fill="#0003" stroke="none"/>
    <g transform="translate(0,${n(bob)})"><path d="M-3.5,-44 L${n(-3.5 + sw * 6)},-4" stroke="#d9a982" stroke-width="4.4"/><path d="M3.5,-44 L${n(3.5 - sw * 6)},-4" stroke="#d9a982" stroke-width="4.4"/>
    <ellipse cx="${n(-3.5 + sw * 6 + d)}" cy="-2" rx="4.6" ry="2" fill="#5a4630"/><ellipse cx="${n(3.5 - sw * 6 + d)}" cy="-2" rx="4.6" ry="2" fill="#5a4630"/>
    <path d="M-9,-80 L9,-80 L12,-42 L-12,-42 Z" fill="${col}"/><path d="M-9.5,-62 L9.5,-62 L10,-58 L-10.5,-58 Z" fill="#4a3a2a"/><path d="M${-d * 2},-80 L${d * 4},-52" stroke="#00000030" stroke-width="1"/>
    <path d="M${d * 5},-76 L${hand[0]},${hand[1]}" stroke="#d9a982" stroke-width="3.6"/><path d="M${hand[0]},${hand[1]} L${tip[0]},${tip[1]}" stroke="#6b4a2a" stroke-width="2"/>
    <path d="M${-d * 5},-76 L${-d * 9},-56" stroke="#d9a982" stroke-width="3.6"/>
    <circle cx="0" cy="-92" r="9.5" fill="#e8bd98"/>${hair}<circle cx="${d * 4.2}" cy="-92" r="0.9" fill="${INKC}"/><circle cx="${d * 8}" cy="-92" r="0.9" fill="${INKC}"/><path d="M${d * 4},-87 q${d * 2},1.4 ${d * 4},0" fill="none" stroke-width="0.7"/></g></g>`;
}
// the old villager of beat 17: a woman in a straw hat, rust coat, walking stick (nothing like Urashima); st: { X, Z, fx, talk, blink }
function villager(c, st, T) {
  const p = L.P(c, st.X, 0, st.Z), k = p.s / 100, d = (st.fx ?? -0.7) > 0 ? 1 : -1, tk = st.talk || 0, bl = st.blink || 0;
  const skin = "#d6a47e", coat = "#9a4a2a", coatS = "#74361e", hat = "#dcbe74";
  return `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(k)})" stroke="${INKC}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="0" cy="1" rx="26" ry="4" fill="#0003" stroke="none"/>
    <g transform="rotate(${n(d * 2)} 0 0)"><path d="M${d * 24},-84 L${d * 28},0" stroke="#6b4a2a" stroke-width="3.2"/>
    <path d="M-12,-52 L-12,-4 M10,-52 L10,-4" stroke="#7a6a5a" stroke-width="5"/><ellipse cx="-12" cy="-2" rx="6" ry="2.4" fill="#5a4630"/><ellipse cx="10" cy="-2" rx="6" ry="2.4" fill="#5a4630"/>
    <path d="M-22,-112 Q-26,-60 -20,-40 L20,-40 Q27,-60 22,-112 Q0,-122 -22,-112 Z" fill="${coat}"/><path d="M-4,-114 L${d * 8},-44" stroke="${coatS}" stroke-width="1.6" fill="none"/><path d="M-21,-70 L21,-70 L21,-62 L-21,-62 Z" fill="#3a3a2a"/>
    <path d="M${d * 18},-104 Q${d * 28},-92 ${d * 25},-84" stroke="${coat}" stroke-width="8"/><circle cx="${d * 25}" cy="-84" r="4.2" fill="${skin}"/>
    <path d="M${-d * 18},-104 Q${-d * 24},-80 ${-d * 16},-62" stroke="${coat}" stroke-width="8"/><circle cx="${-d * 16}" cy="-61" r="4" fill="${skin}"/>
    <ellipse cx="0" cy="-130" rx="15" ry="17.5" fill="${skin}"/>
    <path d="M-15,-132 Q-16,-118 -9,-112 L9,-112 Q16,-118 15,-132" fill="none"/>
    <g transform="translate(${d * 2},0)"><path d="M-9.5,-136 q3,-3 6,-0.5 M3.5,-136.5 q3,-2.5 6,0.5" stroke="#f0eee6" stroke-width="1.6" fill="none"/>
      ${bl > 0.5 ? `<path d="M-9,-131 h5 M4,-131 h5" stroke-width="0.9"/>` : `<ellipse cx="-6.5" cy="-131" rx="2.4" ry="${n(1.9 * (1 - bl))}" fill="#fff"/><ellipse cx="6.5" cy="-131" rx="2.4" ry="${n(1.9 * (1 - bl))}" fill="#fff"/><circle cx="${n(-6.5 + d * 0.9)}" cy="-131" r="1.1" fill="#2a1a18"/><circle cx="${n(6.5 + d * 0.9)}" cy="-131" r="1.1" fill="#2a1a18"/>`}
      <path d="M0,-130 q${d * 2},5 -1,7" fill="none" stroke-width="0.8"/><path d="M-10,-122 q3,2 5,0 M5,-122 q3,2 5,0 M-6,-136 q-2,3 -1,5" fill="none" stroke-width="0.4" opacity="0.6"/>
      ${tk > 0.15 ? `<ellipse cx="0" cy="-118.5" rx="3.6" ry="${n(1 + 3 * tk)}" fill="#5a1f30"/>` : `<path d="M-4.5,-118.5 q4.5,-1.4 9,0" fill="none" stroke-width="0.9"/>`}</g>
    <path d="M-34,-137 Q-20,-150 0,-171 Q20,-150 34,-137 Q0,-128 -34,-137 Z" fill="${hat}"/><path d="M-22,-141 Q0,-134 22,-141 M-14,-152 Q0,-146 14,-152" fill="none" stroke="#a98a44" stroke-width="0.8"/><path d="M-12,-135 Q0,-129 12,-135" fill="none" stroke="#3a3a2a" stroke-width="0.8"/></g></g>`;
}
const WARM = `<rect width="${W}" height="${H}" fill="#ff9a3c" opacity="0.2" style="mix-blend-mode:multiply"/>`;
const cut = (v, ...ts) => ts.filter((x) => v >= x).length;   // which sub-shot

const handOn = (x, y, k) => `<g><path d="M${n(x - 220 * k)},${n(y - 60 * k)} L${n(x - 26 * k)},${n(y - 14 * k)} L${n(x - 20 * k)},${n(y + 24 * k)} L${n(x - 220 * k)},${n(y + 50 * k)} Z" fill="#e8476a" stroke="#1a1328" stroke-width="${n(Math.max(2, 1.5 * k))}"/><ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(24 * k)}" ry="${n(17 * k)}" fill="#f3cdb0" stroke="#1a1328" stroke-width="${n(Math.max(2, 1.5 * k))}"/><path d="M${n(x - 6 * k)},${n(y - 3 * k)} l${n(18 * k)},${n(4 * k)} M${n(x - 6 * k)},${n(y + 5 * k)} l${n(18 * k)},${n(4 * k)}" stroke="#1a1328" stroke-width="${n(Math.max(1.5, 1 * k))}" stroke-linecap="round"/></g>`;
// 1. the hook: fingers on the cord, foam, the tug (no line)
beat(null, (v, d, T) => {
  SEA.mood(0); const c = cam(v / d, C(0.0, 0.46, 2.9, 1000), C(0.04, 0.44, 3.15, 1000)), b = beach(c, T, { sun: [860, 220, 70] });
  const tug = tr([[0.15, 0], [0.3, 1], [0.45, 0.2], [0.55, 1]], v);
  const bx = SEA.box(c, { ...B.box, worn: 1, cord: 0.25 * tug, lid: 0.1 * tug }, T), q = L.P(c, B.box.X + 0.02, 0.2, B.box.Z - 0.02), k = q.s / 100 * 0.32;
  return b.back + hosts(c, T, { kid: { X: -0.55, Z: 4.3, tug, shock: 0 }, keeper: null }) + bx.svg + handOn(q.x - 8 * k * 0 - 2 * tug * k, q.y + 6 * k * tug, k) + b.front;
}, { dur: 0.6 });
// 2. the slam
beat("L01", (v, d, T, ln) => {
  SEA.mood(0); const sl = v < 0.5, fl = flameAt(T) + 0.5 * Math.exp(-Math.max(0, v - 0.1) * 5);
  if (sl) {
    const c = cam(v / 0.5, C(0.04, 0.46, 3.0, 1000), C(0.08, 0.48, 3.2, 1000)), b = beach(c, T, { sun: [860, 220, 70] });
    const bx = SEA.box(c, { ...B.box, worn: 1, lid: v < 0.1 ? 0.12 : 0, cord: 0.15 }, T);
    const sy = v < 0.1 ? lerp(0.9, 0.0, ease(clamp((v + 0.12) / 0.22), "in")) : 0;
    const k = hosts(c, T, { kid: { X: -0.22, Z: 3.75, reachL: 1, tug: v < 0.1 ? 1 : 0, shock: clamp((v - 0.1) * 6) }, keeper: null });
    return b.back + k + bx.svg + SEA.staff(c, { X: bx.topW.X + 0.02, Y: bx.topW.Y + 0.02 + sy, Z: B.box.Z - 0.02, rot: 5, flame: fl }, T) + b.front;
  }
  if (v < 1.3) { const c = cam((v - 0.5) / 0.8, C(0.12, 0.78, 2.5, 1010), C(0.12, 0.8, 2.7, 1010)), b = beach(c, T, { pines: false });
    return b.back + hosts(c, T, { kid: { X: lerp(-0.36, -0.58, ease(clamp((v - 0.5) / 0.25))), shock: 1 }, keeper: { stern: 1, flame: fl } }) + beachBox(c, T, { lid: 0 }) + b.front; }
  return keeperClose(T, (v - 1.3) / 1, { keeper: { stern: 1, flame: fl } }).svg;
}, {});
// 3. kid, curious
beat("L02", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { look: -0.8 } }).svg; });
// 4. grandma low, the flame shrinks, the tassel moves
beat("L03", (v, d, T, ln) => { SEA.mood(0.1); const w = wordAt(ln, "300", 0.4) - 0.1; return keeperClose(T, v < w ? v / w * 0.4 : 0.4 + (v - w) / (d - w) * 0.6, { keeper: { stern: 1 } }).svg; });
// 5. the legend: Urashima and the turtle
beat("L04", (v, d, T, ln) => {
  SEA.mood(0); const k = cut(v, 1.5, 3.0, 4.4), TU = B.turtle;
  const c = [cam(v / 1.5, C(-0.2, 1.55, -1.2, 800), C(0.0, 1.5, -0.6, 820)), cam((v - 1.5) / 1.5, C(0.1, 0.9, 3.9, 980), C(0.15, 0.92, 4.2, 980)), cam((v - 3.0) / 1.4, C(0.2, 0.95, 3.7, 980), C(0.3, 0.95, 3.9, 980)), cam((v - 4.4) / 1.4, C(0.3, 0.85, 5.0, 940), C(0.4, 0.85, 5.5, 940))][k];
  const b = SEA.beach(c, T, { sun: [800, 190, 64], boat: true });
  let body = b.back;
  const sticks = (kidSvgs) => kidSvgs;
  const run = (u) => Math.sin(u * 14);
  // the turtle
  const tu0 = { X: TU.X, Y: 0, Z: TU.Z, size: 0.45, dir: 1, swim: T * 0.4 };
  // kids poke
  const kidAt = (i, away) => ({ X: TU.X - 1.1 + i * 0.7 + away * (i - 1) * 2.5, Z: TU.Z - 0.9 + (i % 2) * 0.4 - away * 1.2, fx: 0.7 - (i % 2) * 1.4, run: away > 0 ? T * 3 + i : null, shock: away > 0 ? 0.5 : 0 });
  const away = k < 2 ? 0 : clamp((v - 3.0) / 1.2);
  const ux = k === 0 ? lerp(-2.8, TU.X - 1.3, ease(clamp(v / 1.5))) : k === 1 ? TU.X - 1.3 : TU.X - 0.95;
  let ur;
  if (k <= 2) {
    const tu = SEA.turtle(c, { ...tu0, tuck: 0.5 + 0.5 * Math.sin(v * 9) * 0.5 }, T);
    const kids = [0, 1, 2].map((i) => { const q = kidAt(i, away); return oldKid(c, { X: q.X, Z: q.Z, fx: q.fx, run: q.run, poke: away > 0 ? 0 : 0.5 + 0.5 * Math.sin(T * 8 + i * 2), hair: i }); }).join("");
    const sticksSvg = true ? "" : [0, 1, 2].map((i) => { const a = L.P(c, TU.X - 1.1 + i * 0.7 + 0.25, 0.7, TU.Z - 0.9 + (i % 2) * 0.4), e = L.P(c, TU.X - 0.1 + i * 0.1, 0.15 + 0.1 * Math.sin(T * 8 + i), TU.Z - 0.05); return `<path d="M${n(a.x)},${n(a.y)} L${n(e.x)},${n(e.y)}" stroke="#6b4a2a" stroke-width="${n(Math.max(2, 0.025 * a.s))}" stroke-linecap="round"/>`; }).join("");
    ur = SEA.urashima(c, { X: ux, Z: TU.Z - 0.7 + (k === 0 ? (1 - clamp(v / 1.5)) * 0.6 : 0), Y: k === 0 ? Math.abs(run(v)) * 0.04 : 0, fx: 0.8, shock: 0, look: 0.5, lean: k === 0 ? 6 : 0, rod: false }, T);
    body += tu.svg + tu.front + kids + sticksSvg + ur.svg;
  } else {
    // he lifts the turtle and wades out
    const f = ease(clamp((v - 4.4) / 1.3));
    ur = SEA.urashima(c, { X: lerp(TU.X - 0.95, TU.X + 0.6, f), Z: lerp(TU.Z - 0.7, 9.0, f), fx: 0.8, reach: 1, look: 0.5 }, T);
    const h = ur.hold || { X: TU.X, Y: 0.8, Z: TU.Z };
    const tu = SEA.turtle(c, { X: h.X, Y: h.Y, Z: h.Z - 0.02, size: 0.4, dir: 1, swim: T * 0.8 }, T);
    body += ur.svg + tu.svg + tu.front;
  }
  return body + b.front + WARM;
});
// 6. kid "Good guy." / grandma "Too good."
beat("L05", (v, d, T) => { SEA.mood(0); return kidClose(T, v / d, { kid: { grin: 1 } }).svg; });
beat("L06", (v, d, T) => { SEA.mood(0.1); return keeperClose(T, v / d, { keeper: { stern: 1 } }).svg; });
// 7. the dive
beat("L07", (v, d, T, ln) => {
  const k = cut(v, 1.5, 3.0), f = v / d; SEA.mood(lerp(0.55, 1.25, ease(f)));
  const dc = SEA.DIVE.cam.main;
  if (k === 0) { const c = { ...dc }, dv = SEA.dive(c, T, { depth: lerp(0.0, 0.3, v / 1.5) }), tu = SEA.turtle(c, { X: -0.1, Y: 1.15, Z: 3.9, size: 1, dir: 1, pitch: 12, swim: T * 0.9 }, T), ur = SEA.urashima(c, { ...tu.seat, ride: 1, fx: 0.75, shock: 0.4, bow: 8, look: 0.6 }, T); return dv.back + tu.svg + ur.svg + tu.front + dv.front; }
  if (k === 1) { const c = cam((v - 1.5) / 1.5, C(-0.1, 1.75, 1.0, 960), C(0.0, 1.65, 1.35, 960)), dv = SEA.dive(c, T, { depth: lerp(0.4, 0.75, (v - 1.5) / 1.5) }), tu = SEA.turtle(c, { X: -0.1, Y: 1.2, Z: 3.9, size: 1, dir: 1, pitch: 20, swim: T * 0.9 }, T), ur = SEA.urashima(c, { ...tu.seat, ride: 1, fx: 0.75, bow: 10 }, T); return dv.back + tu.svg + ur.svg + tu.front + dv.front; }
  const c = { ...dc }, dv = SEA.dive(c, T, { depth: lerp(0.9, 1, (v - 3) / 1.4), palace: 1 }), tu = SEA.turtle(c, { X: lerp(-1.2, -0.7, (v - 3) / 1.4), Y: 3.1, Z: 8.5, size: 1, dir: 1, pitch: 24, swim: T * 0.9 }, T), ur = SEA.urashima(c, { ...tu.seat, ride: 1, fx: 0.75, bow: 12 }, T);
  return dv.back + tu.svg + ur.svg + tu.front + dv.front;
});
// 8. the Dragon Palace, Otohime turns
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
  return h.back + ot.svg + ur.svg + h.front;
});
// 9. the four seasons: one bold window per word
beat("L09", (v, d, T, ln) => {
  SEA.mood(2); const ws = ["spring", "summer", "autumn", "winter"].map((s) => wordAt(ln, s, 0.5) - 0.04);
  const k = ws.filter((x) => v >= x).length;
  if (k === 0) { const c = v < 1.5 ? cam(v / 1.5, [0, 2.0, -3.5, 1130].slice(0, 4), [0, 1.9, -2.6, 1130]) : SEA.SEASONS.camOf(0); const cc = v < 1.5 ? { ...c } : cam((v - 1.5) / 1.5, C(0, 1.8, -2.6, 1130), C(-0.5, 2.3, 0, 1130)); return SEA.seasons(v < 1.5 ? SEA.SEASONS.cam.all : cc, T, { open: [1, 1, 1, 1] }); }
  const s0 = ws[k - 1], z = 1 + 0.07 * clamp((v - s0) / 1.2);
  return `<g transform="translate(540,960) scale(${n(z)}) translate(-540,-960)">${SEA.seasonView(k - 1, 0, 0, W, H, T)}</g>`;
});
// 10. kid amazed / grandma grim, the windows flick between her sentences
beat("L10", (v, d, T) => { SEA.mood(0.1); return kidClose(T, v / d, { kid: { shock: 0.5, grin: 0.8 } }).svg; });
beat("L11", (v, d, T, ln) => {
  const a = wordAt(ln, "year", 2.2) + 0.35, bb = wordAt(ln, "he", 3.1) - 0.05;
  if (v >= a && v < bb + 0.02) { const k = Math.floor((v - a) / ((bb - a) / 5)) % 4; return SEA.seasonView((k + 1) % 4, 0, 0, W, H, T); }
  SEA.mood(0.2); return keeperClose(T, v < a ? v / a * 0.5 : 0.5 + (v - bb) / (d - bb) * 0.5, { keeper: { stern: 1 } }).svg;
});
// 11. Urashima homesick
beat("L12", (v, d, T) => { SEA.mood(2.6); const c = cam(v / d, C(-0.5, 1.28, 8.0, 1080), C(-0.5, 1.3, 8.3, 1080)), { h, ot, ur } = hall(c, T, { ur: { sad: 1, fx: 0.7 }, ot: { fx: -0.6 } }); return h.back + ot.svg + ur.svg + h.front; });
// 12. the box is held out, push to the cord
beat("L13", (v, d, T, ln) => {
  SEA.mood(2.4); const w = wordAt(ln, "never", 0.6) - 0.3, c = v < w ? cam(v / w, C(0.2, 1.25, 8.0, 1080), C(0.25, 1.22, 8.4, 1080)) : cam((v - w) / (d - w), C(0.3, 1.15, 8.6, 1080), C(0.42, 1.0, 9.1, 1080), "in");
  const { h, ot, ur } = hall(c, T, { give: 1, ot: { sad: 0.8 }, ur: { reach: 0.5, sad: 0.7 } });
  return h.back + ur.svg + ot.svg + SEA.box(c, { ...ot.hold, X: ot.hold.X - 0.02, held: true }, T).svg + h.front;
});
// 13. kid outraged / grandma calm, a finger up
beat("L14", (v, d, T) => { SEA.mood(0.05); return kidClose(T, v / d, { kid: { shock: 1 } }).svg; });
beat("L15", (v, d, T) => { SEA.mood(0.15); return keeperClose(T, v / d, { keeper: { stern: 0.2 }, extra: (c) => fingerUp(c, T, clamp(v / 0.5)) }).svg; });
function fingerUp(c, T, rise) {   // workaround: the keeper has no raised-finger pose; her sleeve and a drawn hand, index finger up, beside her face
  const p = L.P(c, CA.keeper.X, 0, CA.keeper.Z), k = p.s / 100, hx = p.x + 21 * k, hy = p.y - (66 + 14 * rise) * k;
  return `<path d="M${n(p.x + 14 * k)},${n(p.y - 60 * k)} Q${n(p.x + 24 * k)},${n(p.y - 52 * k)} ${n(hx)},${n(hy)}" stroke="#2b2f6b" stroke-width="${n(9 * k)}" stroke-linecap="round" fill="none"/><g transform="translate(${n(hx)},${n(hy)})">${handSvg(k * 0.85, [1.1, 0.1, 0.1, 0.1], 6, 0.5)}</g>`;
}
// 14. the village 300 years on
const villageCam = SEA.VILLAGE.cam.wide;
beat("L16", (v, d, T, ln) => {
  SEA.mood(3); const w = wordAt(ln, "nobody", 0.5) - 0.1;
  if (v < w) { const c = cam(v / w, [villageCam.x, villageCam.y, villageCam.z, villageCam.h0], [villageCam.x + 0.2, villageCam.y - 0.1, villageCam.z + 0.6, villageCam.h0]), vl = SEA.village(c, T, { sun: [760, 200, 56] }), ur = SEA.urashima(c, { X: -1.3, Z: 4.8, age: 0, fx: 0.75, sad: 0.7, bow: 4 }, T); return SEA.wash(vl.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, T).svg + SEA.wash(vl.front); }
  const c = cam((v - w) / (d - w), C(0.5, 1.3, 0.6, 1050), C(0.3, 1.3, 1.5, 1050)), vl = SEA.village(c, T, { sun: [760, 200, 56] }), ur = SEA.urashima(c, { X: -0.35, Z: 4.2, fx: 0.75, sad: 0.7, bow: 4, blink: blinkAmt(T % 3, [1]) }, T);
  return SEA.wash(vl.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true }, T).svg + SEA.wash(vl.front);
});
// 15. the old villager: a drawn old woman in a straw hat (not Urashima)
beat("L17", (v, d, T) => {
  SEA.mood(3); const c = cam(v / d, C(0.3, 1.2, 3.0, 1060), C(0.3, 1.2, 3.3, 1060)), vl = SEA.village(c, T, { sun: [760, 200, 56] });
  return SEA.wash(vl.back) + villager(c, { X: 0.3, Z: 4.4, fx: -0.7, talk: talkOf("V", T), blink: blinkAmt(T % 3.4, [1.4]) }, T) + SEA.wash(vl.front);
});
// 16. the grave
beat("L18", (v, d, T) => {
  SEA.mood(3); const c = cam(v / d, C(0.2, 0.95, 2.0, 1010), C(0.18, 0.92, 2.6, 1010)), vl = SEA.village(c, T, { sun: [760, 200, 56] }), ur = SEA.urashima(c, { ...SEA.VILLAGE.stand, X: -0.2, age: 0, fx: 0.75, sad: 1, kneel: ease(clamp(v / 0.9)), bow: 8, blink: blinkAmt(T % 3.2, [1.5]) }, T);
  return SEA.wash(vl.back + ur.svg + vl.front) + `<rect width="${W}" height="${H}" fill="#1a2640" opacity="0.18" style="mix-blend-mode:multiply"/>`;
});
// 17. kid small, shocked (cooled beach)
beat("L19", (v, d, T) => { SEA.mood(3); return kidClose(T, v / d, { wash: true, beach: { sun: false }, kid: { shock: 0.7, worry: 1 } }).svg; });
// 18. proof montage: a brush scroll, then the shrine
const brush = (seed, x, y, w, h, T) => { let s = ""; for (let i = 0; i < 9; i++) { const yy = y + 60 + i * (h - 120) / 9, cols = 3 + Math.floor(hash(seed + i) * 4); for (let j = 0; j < cols; j++) { const xx = x + 60 + j * (w - 120) / cols + hash(seed + i * 7 + j) * 20; const l = 40 + hash(seed + i * 3 + j) * 110; s += `<path d="M${n(xx)},${n(yy)} q${n(10 + hash(i + j) * 30)},${n(-12 + hash(i * j + 1) * 24)} ${n(l)},${n(hash(i + 2 * j) * 10 - 5)}" stroke="#1a1328" stroke-width="${n(3 + hash(seed + j * 5 + i) * 7)}" stroke-linecap="round" fill="none" opacity="0.85"/>`; } } return s; };
beat("L20", (v, d, T, ln) => {
  SEA.mood(3); const sw = wordAt(ln, "shrine", 4.6) - 0.2;
  if (v < sw) {
    const f = ease(v / sw), z = 1 + 0.18 * f, ty = lerp(40, -60, f);
    return `<rect width="${W}" height="${H}" fill="#3a2f2a"/><g transform="translate(540,960) scale(${n(z)}) translate(-540,-960) translate(0,${n(ty)})"><rect x="130" y="260" width="820" height="1400" fill="#e8d6a8" stroke="#1a1328" stroke-width="6"/><rect x="110" y="230" width="860" height="46" rx="20" fill="#8a2a24"/><rect x="110" y="1650" width="860" height="46" rx="20" fill="#8a2a24"/><g opacity="0.9">${[0, 1, 2].map((c2) => brush(3 + c2 * 11, 150 + c2 * 270, 280, 270, 1360, T)).join("")}</g><path d="M130,700 Q540,690 950,712 L950,760 Q540,740 130,752 Z" fill="#b89860" opacity="0.18"/></g>`;
  }
  const c = cam((v - sw) / (d - sw), C(0.0, 1.2, 0.2, 1000), C(0.0, 1.0, 1.4, 1000)), b = SEA.beach(c, T, { sun: [800, 230, 60], boat: false });
  const px = 540, py = 1210, k = 1;   // shrine in screen space: roof, posts, lattice with the box behind
  const shrine = `<g transform="translate(0,${n(lerp(0, 0, 0))})"><ellipse cx="540" cy="1360" rx="440" ry="40" fill="#0006"/><rect x="250" y="1010" width="580" height="340" fill="#5a3a2a" stroke="#1a1328" stroke-width="6"/><rect x="300" y="1060" width="480" height="240" fill="#1a1328"/><g transform="translate(540,1230)"><rect x="-90" y="-70" width="180" height="110" rx="10" fill="#17131f" stroke="#3a3250" stroke-width="5"/><path d="M-90,-20 L90,-20 M0,-70 L0,40" stroke="#e8321e" stroke-width="8"/><circle r="12" cy="-20" fill="#e8321e"/></g>${Array.from({ length: 9 }, (_, i) => `<rect x="${300 + i * 60}" y="1060" width="10" height="240" fill="#8a5a3a"/>`).join("")}${Array.from({ length: 4 }, (_, i) => `<rect x="300" y="${1090 + i * 60}" width="480" height="8" fill="#8a5a3a"/>`).join("")}<path d="M180,1020 L540,830 L900,1020 L860,1050 L540,890 L220,1050 Z" fill="#2a2430" stroke="#1a1328" stroke-width="6"/><rect x="240" y="1340" width="600" height="30" fill="#9a8a7a"/></g>`;
  return SEA.wash(b.back) + shrine + b.front;
});
// 19. the sky races through days, pines grow
beat("L21", (v, d, T) => {
  SEA.mood(0); const f = v / d, day = 1.35, ph = (v / day) % 1, k = cut(v, 2.6, 5.2);
  const c = ob([C(0, 1.4, -1.2, 820), C(0.0, 0.7, 0.5, 1020), C(0.2, 1.1, -0.4, 880)][k]);
  const el = Math.sin(ph * Math.PI * 2), sunX = lerp(120, 960, ph), sunY = lerp(820, 140, Math.sin(ph * Math.PI)), night = clamp(0.5 - el * 0.9 + 0.1) * 0.75;
  const b = SEA.beach(c, T, { sun: ph < 0.5 ? [sunX, sunY, 60] : false, pines: false, boat: false });
  const gr = 2 + 6 * ease(f), pines = SEA.pine(c, { X: 2.9, Z: 7.0, h: gr, seed: 1, lean: -0.3, t: T }) + SEA.pine(c, { X: -4.9, Z: 8.3, h: gr * 0.8, seed: 4, lean: 0.34, t: T });
  const ur = SEA.urashima(c, { X: -0.2, Z: 7.4, fx: 0.75, age: 0 }, T);
  const moon = ph >= 0.5 ? `<circle cx="${n(lerp(960, 120, (ph - 0.5) * 2))}" cy="${n(lerp(820, 160, Math.sin((ph - 0.5) * 2 * Math.PI)))}" r="46" fill="#f6f3ea"/>` : "";
  return b.back + moon + pines + `<g style="filter:brightness(0.12)">${ur.svg}</g>` + b.front + `<rect width="${W}" height="${H}" fill="#101a4a" opacity="${n(night * 0.6)}" style="mix-blend-mode:multiply"/>`;
});
// 20. alone at dusk with the box
beat("L22", (v, d, T) => {
  SEA.mood(3.6); const c = cam(v / d, C(0.0, 1.0, 1.0, 1000), C(0.25, 1.0, 2.6, 1000)), b = SEA.beach(c, T, { sun: [200, 700, 110], glitter: [200], boat: false });
  const ur = SEA.urashima(c, { X: 0.2, Z: 5.4, fx: 0.9, age: 0, sad: 0.8, reach: 0.7, look: 0.8, blink: blinkAmt(T % 3.4, [1.2]) }, T);
  return b.back + ur.svg + SEA.box(c, { ...ur.hold, held: true }, T).svg + b.front;
});
// 21. "No, no, no..." intercut with the cord
beat("L23", (v, d, T, ln) => {
  const k = cut(v, 0.55, 1.0); SEA.mood(k === 1 ? 3.3 : 3);
  if (k === 1) { const c = ob(C(0.2, 1.0, 2.2, 1000)), b = SEA.beach(c, T, { sun: false, boat: false }), ur = SEA.urashima(c, { X: 0.2, Z: 4.4, fx: 0.9, age: 0, reach: 0.8, pull: ease(clamp((v - 0.55) / 0.3)), sad: 0.8 }, T); return SEA.wash(b.back + ur.svg) + SEA.box(c, { ...ur.hold, held: true, cord: ease(clamp((v - 0.55) / 0.4)) * 0.6 }, T).svg; }
  if (k === 2) { SEA.mood(3); return keeperClose(T, 0.6, { keeper: { stern: 1 } }).svg; }
  return kidClose(T, v / 0.55 * 0.5, { wash: true, beach: { sun: false }, kid: { shock: 1, worry: 1 } }).svg;
});
function candleInset(T) {   // the keeper's tiny candle, lower right, on the last "no!"
  const c = { ...CL, x: 0.5, z: 3.0 }, b = SEA.beach(c, T, { sun: false, boat: false });
  return `<g transform="translate(560,1250) scale(0.5)"><clipPath id="ci"><rect x="0" y="0" width="520" height="640" rx="30"/></clipPath><g clip-path="url(#ci)" transform="translate(-300,-400)">${SEA.wash(b.back)}${hosts(c, T, { kid: null, keeper: { ...CA.keeper, X: 0.5 + CA.keeper.X - 0.2, stern: 1 } })}</g></g>`;
}
// 22. white smoke, three hundred years in one breath
beat("L24", (v, d, T, ln) => {
  SEA.mood(3); const k = cut(v, 1.3, 2.9), ag = ease(clamp((v - 1.45) / 1.2)), amt = clamp((v - 0.15) / 1.4);
  const lid = clamp((v - 0.0) / 0.5), UX = 0.0, UZ = 4.4;
  const c = ob([C(0.15, 1.0, 2.7, 1020), C(0.05, 1.18, 2.75, 1100), C(0.05, 1.1, 2.4, 1100)][k]);
  const b = SEA.beach(c, T, { boat: false, pines: false, sun: false });
  const ur = SEA.urashima(c, { X: UX, Z: UZ, fx: 0.8, age: ag, reach: 1, shock: 0.5, sad: ag, blink: 0 }, T), bx = SEA.box(c, { ...ur.hold, held: true, lid, cord: 1 }, T);
  const sm = SEA.smoke(c, { ...bx.mouth, amt, rise: 1 + 2 * amt + v * 0.4, spread: lerp(0.5, 1.4, amt), drift: 0.5, seed: 2 }, T);
  return SEA.wash(b.back + ur.svg) + bx.svg + sm;
});
// 23. ancient hands and face
beat("L25", (v, d, T) => {
  SEA.mood(3); const k = cut(v, 1.75);
  const c = k === 0 ? cam(v / 1.75, C(0.0, 1.0, 2.9, 1020), C(0.0, 0.98, 3.2, 1020)) : cam((v - 1.75) / 1.75, C(0.0, 0.8, 3.2, 1020), C(0.02, 0.8, 3.4, 1020)), b = SEA.beach(c, T, { boat: false, pines: false, sun: false });
  const ur = SEA.urashima(c, { X: 0.0, Z: 4.4, fx: 0.8, age: 1, reach: 1, sad: 1, bow: 6, blink: blinkAmt(T % 3.6, [1.8]) }, T), bx = SEA.box(c, { ...ur.hold, held: true, lid: 1, cord: 1 }, T);
  return SEA.wash(b.back + ur.svg) + bx.svg;
});
// 24. golden hour: the kid pushes the box away
beat("L26", (v, d, T, ln) => {
  SEA.mood(4); const k = cut(v, 1.1);
  const px = lerp(B.box.X, B.box.X + 0.9, ease(clamp(v / 1.1)));
  if (k === 0) { const c = cam(v / 1.1, C(0.1, 0.8, 2.5, 1010), C(0.14, 0.8, 2.7, 1010)), b = SEA.beach(c, T, { sun: [230, 600, 120], glitter: [230], boat: false }); return b.back + hosts(c, T, { kid: { X: -0.2, reachL: 1, worry: 0.8 }, keeper: { stern: 0.8 } }) + SEA.box(c, { ...B.box, X: px, worn: 1 }, T).svg + b.front; }
  return kidClose(T, (v - 1.1) / (d - 1.1), { kid: { look: -0.9 } }, undefined, true).svg;
});
// 25. grandma touches her white bun (workaround: a drawn hand), then 26: the 0.6 s beat and the last line
const grandma = (T, u, hand) => {
  SEA.mood(4);
  return keeperClose(T, u, { keeper: { stern: 0.3, open: 1 }, extra: (c) => {
    if (hand <= 0) return "";
    const p = L.P(c, CA.keeper.X, 0, CA.keeper.Z), k = p.s / 100, hx = p.x + (30 - 12 * hand) * k, hy = p.y - (96 + 20 * hand) * k;   // the hand rises behind the head to the bun
    return `<path d="M${n(p.x + 18 * k)},${n(p.y - 70 * k)} Q${n(p.x + 26 * k)},${n(p.y - 100 * k)} ${n(hx)},${n(hy)}" stroke="#2b2f6b" stroke-width="${n(9 * k)}" stroke-linecap="round" fill="none"/><g transform="translate(${n(hx)},${n(hy)})">${handSvg(k * 0.9, [0.45, 0.5, 0.45, 0.35], -78, 0.2)}</g>`; } }, undefined, true).svg;
};
let T27 = 0;
beat("L27", (v, d, T) => { T27 = T - v; return grandma(T, (v + 0.2) / 4.5, tr([[0.5, 0], [1.2, 1], [d, 1]], v)); }, { hold: 0.6 });
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
  return captionSvg(b.ln.phr, time - b.lineAt, { key: KEY, y: /^L2[78]$/.test(b.line) ? 330 : 480 });
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
