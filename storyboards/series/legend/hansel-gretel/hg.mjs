// Legend: Hansel and Gretel (Grimm KHM 15), code-drawn rough draft 1 (director's list: SHOTS.md, lines: lines.json).
//   node storyboards/series/legend/hansel-gretel/hg-render.mjs   (picture with and without subtitles, then the mux; see that file)
// Built like cried-wolf (cw.mjs): voice-led timeline from out/legend-hansel/vo/<id>.wav + .words.json, hand-set caption phrases (CAP below),
// word-by-word reveal in the UPPER THIRD (y 580, below the opening banner), glimpse re-hooks, one pass for both exports.
// A voice that does not exist yet gets an estimated length (so the board can be built before the takes are done).
import { readFileSync, existsSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as HS from "../../../../tools/svg2d/lib/legend-hesse.mjs";
import { titleSvg } from "../../../../tools/svg2d/lib/legend-hesse-title.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n, P, hash } = L;

export const W = 1080, H = 1920, FPS = 30;
export const VO = process.env.HG_VO || "out/legend-hansel/vo-cut";   // round 2: the cut takes (hg-cut.mjs); L05 and L26 are dropped
const SPEC = JSON.parse(readFileSync("storyboards/series/legend/hansel-gretel/lines.json", "utf8"));
const KEY = /gingerbread|smell|turn|around|red|eyes|bone|oven|hungry/i;
const CAPY = 580;
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// hand-set subtitle phrases (2-4 words each; "|" splits; the words must follow the written line)
const CAP = {
  L01: "If you smell|gingerbread at night...|turn around.",
  L02: "...And if she|smells ME?",
  L03: "Nine o'clock.|Their father left them|by a fire,|deep in the forest.|And this time,|he wasn't coming back.",
  L04: "Last night,|white pebbles|led them home.|Tonight, Hansel|only had bread.",
  L05: "And the birds|were hungry too.",
  L06: "Hansel...|the crumbs|are gone.",
  L07: "Midnight.|Something sweet|drifted through|the trees.",
  L08: "Do you|smell that?",
  L09: "Grandma said|turn around.",
  L10: "Grandma's not|hungry.",
  L11: "The Brothers Grimm,|1812.",
  L12: "Walls of bread.|A roof of cake.|Windows of|clear sugar.",
  L13: "Nibble, nibble,|little mouse...|who is nibbling|at my house?",
  L14: "...The wind?",
  L15: "Come in,|my sweet ones.|There are pancakes.",
  L16: "Three in|the morning.",
  L17: "Witches have|red eyes.|They can't|see far.|But they smell you...|like animals do.",
  L18: "He smelled|her house.|She smelled|him first.",
  L19: "Stick out|your finger.",
  L20: "Hansel held out|a chicken bone.",
  L21: "Still thin.",
  L22: "But a bone only|works until|she gets hungry.",
  L23: "Fat or thin,|I eat him|at dawn.|Girl! Light|the oven.",
  L24: "Crawl in.|See if it's hot.",
  L25: "I don't know how...|Show me?",
  L26: "She lured them|with sweets.|Gretel lured her|with one sweet|little question.",
  L27: "By sunrise,|they were running home,|pockets full|of her pearls.",
  L28: "Gretel...|gingerbread.",
  L29: "Turn around.",
  L30: "...I'm turning.",
};

// ---------------------------------------------------------------- voice: lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
const DROP = ["L05", "L26"];                      // Sol R1 / director D2: dropped whole
export const LINE = Object.fromEntries(SPEC.lines.filter(([id]) => !DROP.includes(id)).map(([id, who, text]) => [id, { id, who, text }]));
LINE.L11.text = "The Brothers Grimm, 1812.";   // the second sentence is cut from the take
LINE.L20.text = "Hansel held out a chicken bone.";
export const MISSING = [];
for (const ln of Object.values(LINE)) {
  const wp = `${VO}/${ln.id}.wav`, jp = `${VO}/${ln.id}.words.json`, W0 = ln.text.split(/\s+/);
  if (!existsSync(wp) || !existsSync(jp)) {      // not generated yet: an estimate, so the board still builds
    MISSING.push(ln.id); ln.dur = 0.5 + W0.length * 0.36; ln.env = []; ln.off = ln.dur; ln.est = true;
    ln.words = W0.map((w, i) => [w, 0.1 + i * (ln.dur - 0.2) / W0.length, 0.1 + (i + 0.9) * (ln.dur - 0.2) / W0.length]);
  } else {
    const { sr, s } = readWav(wp);
    ln.dur = s.length / sr;
    const hop = Math.round(sr / FPS), env = []; let last = 0;
    for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; const r = Math.sqrt(a / hop); env.push(r); if (r > 0.01) last = (i + hop) / sr; }
    const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
    ln.off = last;                                     // the last audible sound (anything after is silence)
    ln.words = align(W0, JSON.parse(readFileSync(jp, "utf8")));
  }
  ln.phrases = phrases(ln.words, ln.text, CAP[ln.id]);
}
const nzw = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const wordAt = (ln, w) => { const x = ln.words.find((q) => nzw(q[0]) === w) || ln.words.find((q) => nzw(q[0]).startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };
const wordEnd = (ln, w) => { const x = ln.words.find((q) => nzw(q[0]) === w) || ln.words.find((q) => nzw(q[0]).startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[2]; };

// order and the breath between lines (seconds after the previous line's last sound); a line's own tail is never cut
export const ORDER = Array.from({ length: 30 }, (_, i) => "L" + String(i + 1).padStart(2, "0")).filter((id) => !DROP.includes(id));
const GAP = { L02: 0.1, L03: 0.13, L04: 0.13, L06: 0.93, L07: 0.12, L08: 0.16, L09: 0.12, L10: 0.22, L11: 0.3, L12: 0.2, L13: 0.47, L14: 0.2, L15: 0.1, L16: 0.2, L17: 0.2, L18: 0.23, L19: 0.3, L20: 0.18, L21: 0.15, L22: 0.17, L23: 0.1, L24: 0.17, L25: 0.14, L27: 3.35, L28: 0.17, L29: 0.25, L30: 0.3 };   // Sol R1 A1-A13 (L06: 0.83 s bird insert; L27: 0.2 hold + 1.6 shove + 1.5 rescue)
{ let T = 0, prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? T + GAP[id] : 0; ln.end = ln.at + ln.off; T = ln.end; prev = ln; } }
export const DUR = +(LINE.L30.at + LINE.L30.off + 0.15).toFixed(2);   // D3: through the real last sound + 0.15 s
export const TL_LINES = ORDER.map((id) => LINE[id]);
const w = (id, p) => LINE[id].at + wordAt(LINE[id], p);        // absolute time of a word
export const CUE = {                                            // times the mix needs
  slam: null, shove: null, oven: w("L23", "oven"),
};

// ---------------------------------------------------------------- building blocks
const frame = (inner, vig = 0.8) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HS.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>${inner}${HS.vignette(vig)}`;
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? (ln.est ? 0.5 + 0.5 * Math.sin(lu * 17) : 0));
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const sw = (t, f, a = 1, ph = 0) => a * Math.sin(t * f * Math.PI * 2 + ph);
const near = (Z, c) => Z - c.z > 0.5;

// ---- dark / lit helpers: nobody is ever semi-transparent: cast goes AFTER grade() through lit()
const NIGHT_LIT = { a: 0.55, side: -1, rim: "#ffb060", rimA: 0.7 };
const lit = (svg, o = {}) => HS.lit(svg, { ...NIGHT_LIT, ...o });
// flat hand-cut blobs of light (screen blend), used for the jar and small lamps
function blobLight(x, y, r, col, a, seed = 0) {
  let s = "";
  [1, 0.62, 0.34].forEach((k, j) => {
    const pts = Array.from({ length: 12 }, (_, i) => { const an = i / 12 * Math.PI * 2, rr = r * k * (1 + (hash(seed + j * 17 + i) - 0.5) * 0.14); return [x + Math.cos(an) * rr, y + Math.sin(an) * rr]; });
    const m = pts.map((p, i) => { const q = pts[(i + 1) % 12]; return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; });
    s += `<path d="M${n(m[11][0])},${n(m[11][1])} ` + pts.map((p, i) => `Q${n(p[0])},${n(p[1])} ${n(m[i][0])},${n(m[i][1])}`).join(" ") + ` Z" fill="${col}" opacity="${(a * [0.55, 0.8, 1][j]).toFixed(2)}" style="mix-blend-mode:screen"/>`;
  });
  return s;
}
// walk-cycle frequency (Hz) that plants the feet at ground speed v (m/s): L.kid steps ~0.44 m per Hz, HS.gretel ~0.7 m per Hz when running
const kidF = (v) => v / 0.44, gretF = (v) => v / 0.7;
// the candle jar (Grandma's): hanging from a wire loop (jx, jy = the fist) or standing (stand = true: jx, jy = its base). k = px per cm, f = flame 0..1
function jarSvg(jx, jy, k, f, stand = false) {
  return `<g class="ol" transform="translate(${n(jx)},${n(jy - (stand ? 27 * k : 0))}) scale(${k.toFixed(4)})">
    ${stand ? "" : `<path d="M0,0 Q-5,-9 0,-14 Q5,-9 0,0" stroke="#3a2a2a" stroke-width="0.8" fill="none"/>`}
    <path d="M-6.5,6 L6.5,6 L6,9 L-6,9 Z" fill="#3a2a2a"/>
    <path d="M-6,9 Q-7.5,16 -6,24 Q0,27 6,24 Q7.5,16 6,9 Z" fill="#cfe6ff" opacity="0.5" stroke="#e9f3ff" stroke-width="0.8"/>
    <path d="M-1.6,24 L1.6,24 L1.6,17 L-1.6,17 Z" fill="#fff4e0"/>
    ${f > 0.04 ? `<path d="M0,${n(17 - 10 * f)} Q${n(3.4 * f)},${n(15.5 - 3 * f)} 0,15.5 Q${n(-3.4 * f)},${n(15.5 - 3 * f)} 0,${n(17 - 10 * f)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.5"/>` : `<path d="M-0.6,16.5 q0.6,-3 1.2,-5" stroke="#8a8a8a" stroke-width="0.7" fill="none" opacity="0.6"/>`}</g>`;
}
// the sugar piece (D6): one corner of the clear-sugar window pane, ~9 cm, the same prop from the bite to the last shot. p = { x, y, s }, o { rot, k, bitten 0..1 }
function sugarPiece(p, o = {}) {
  const b = o.bitten || 0, k = p.s / 100 * (o.k ?? 1) * 1.15, pts = b > 0.3 ? "-5,-4 2,-6 4,-1 1,1 3,4 -2,5 -6,1" : "-5,-4 4,-6 6,3 -2,5 -6,1";
  return `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${n(o.rot || 0)}) scale(${k.toFixed(4)})"><polygon points="${pts}" fill="#ffe7a6" stroke="#c98a3e" stroke-width="0.9" stroke-linejoin="round"/><polygon points="-3,-2.5 2,-4 3,-0.5 -2,1" fill="#fff8dc"/><path d="M-4,-3 L3,-5" stroke="#ffffff" stroke-width="0.9" opacity="0.85"/></g>`;
}
// screen point of L.kid's RIGHT hand (the fist at his side; hand2face brings it to the mouth), same numbers as legend.mjs kid()
function kidRH(c, st) {
  const p = P(c, st.X, 0, st.Z), S = 0.8, DY = 78 * (1 - 0.74), HSC = 1.32, fx = st.fx ?? -0.8, h = st.hand2face || 0, hx = fx * 1.5, ex = hx + fx * 4.5, hy = -138;
  return L.toScreen(p, st.lean || 0, lerp(17 + (st.tug || 0) * 3.5, (ex + 6) * HSC, h) * S, (lerp(-76, -127 + (hy + 7 + 127) * HSC, h) + DY - (st.hop || 0)) * S);
}
// Hansel: L.kid + the candle jar (o.jar "hand" = in his left fist (the lib kid has a bell there; the jar hangs over it), "none", or [X, Z] = standing on the ground there; D4: set down at bedtime)
// o.piece = { hand "R"|"L", rot, k, bitten } the sugar piece in a hand. fl = flame 0..1
function K(c, st, t, fl = 1, o = {}) {
  const kd = L.kid(c, st, t);
  if (!kd.p) return { svg: "", light: "", kd, hand: null };
  const h = HS.kidHand(c, st), k = kd.p.s / 100 * 0.8, f = Math.max(0, fl) * (1 + 0.05 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1)), jar = o.jar ?? "hand";
  let svg = kd.svg, light = "";
  if (jar === "hand") { svg += jarSvg(h.x, h.y + 4 * k, k, f); if (f > 0.04) light = blobLight(h.x, h.y + 4 * k + 17 * k, (14 + 30 * f) * k, "#ffb860", 0.06 + 0.07 * f, 5); }
  else if (Array.isArray(jar)) { const q = P(c, jar[0], 0, jar[1]), kk = q.s / 100 * 0.8; svg += jarSvg(q.x, q.y, kk, f, true); if (f > 0.04) light = blobLight(q.x, q.y - 12 * kk, (14 + 30 * f) * kk, "#ffb860", 0.06 + 0.07 * f, 5); }
  if (o.piece) { const hp = o.piece.hand === "L" ? h : kidRH(c, st); svg += sugarPiece({ x: hp.x, y: hp.y, s: kd.p.s }, { rot: o.piece.rot ?? -14, k: o.piece.k ?? 1, bitten: o.piece.bitten }); }
  return { svg, light, kd, hand: h };
}
// the father, seen from behind: a dark figure (no new design), walking away. X, Z feet; ph walk phase; dir 1 = going right
function father(c, X, Z, ph, dark = "#050a08") {
  if (!near(Z, c)) return "";
  const p = P(c, X, 0, Z), s = Math.sin(ph * Math.PI * 2), k = 1.08;
  return `<g transform="${L.place(p)} scale(${k})"><ellipse cx="0" cy="0" rx="26" ry="5" fill="#000" opacity="0.4"/>
    <path d="M-7,-85 L-2,-85 L${n(-3 + s * 9)},-6 L${n(-8 + s * 9)},-6 Z" fill="${dark}"/><path d="M2,-85 L7,-85 L${n(8 - s * 9)},-6 L${n(3 - s * 9)},-6 Z" fill="${dark}"/>
    <path d="M${n(-9 + s * 9)},-6 L${n(-2 + s * 9)},-6 L${n(-1 + s * 9)},-1 L${n(-12 + s * 9)},-1 Z M${n(4 - s * 9)},-6 L${n(11 - s * 9)},-6 L${n(13 - s * 9)},-1 L${n(2 - s * 9)},-1 Z" fill="${dark}"/>
    <path d="M-17,-148 Q-21,-125 -19,-92 L-22,-60 L22,-60 L19,-92 Q21,-125 17,-148 Q0,-155 -17,-148 Z" fill="${dark}"/>
    <path d="M-17,-146 Q-27,-120 ${n(-25 + s * 5)},-84 L${n(-19 + s * 5)},-82 Q-17,-110 -13,-136 Z M17,-146 Q27,-120 ${n(25 - s * 5)},-84 L${n(19 - s * 5)},-82 Q17,-110 13,-136 Z" fill="${dark}"/>
    <ellipse cx="0" cy="-166" rx="10" ry="12" fill="${dark}"/><path d="M-11,-172 Q0,-186 11,-172 L12,-166 Q0,-174 -12,-166 Z" fill="${dark}"/></g>`;
}
// a head on a pillow, eyes shut (kid: dark hair / Gretel: ginger braid). at = screen point of the chin, s = px per metre
function sleeper(at, s, who, breath = 0) {
  const k = s / 100, dk = who === "K", skin = dk ? "#f3cdb0" : "#f6d3b6", hair = dk ? "#1d1829" : "#ec7a2a";
  return `<g class="ol" transform="translate(${n(at.x)},${n(at.y + breath * 0.8 * k)}) scale(${k.toFixed(4)})">
    <ellipse cx="0" cy="-10" rx="21" ry="21" fill="${skin}"/>
    <path d="M-22,-14 Q-23,-36 0,-35 Q23,-36 22,-14 Q15,-26 6,-27 Q-6,-25 -12,-30 Q-18,-22 -22,-14 Z" fill="${hair}"/>
    ${dk ? "" : `<path d="M-22,-12 Q-27,2 -24,14 M22,-12 Q27,2 24,14" stroke="${hair}" stroke-width="7" fill="none" stroke-linecap="round"/>`}
    <path d="M-12,-11 Q-8,-8 -4,-11 M4,-11 Q8,-8 12,-11" stroke="#3a2a2a" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <path d="M-3,-1 Q0,1 3,-1" stroke="#9a4a52" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="-12" cy="-3" rx="4" ry="2.2" fill="#f58a8a" opacity="0.45" stroke="none"/><ellipse cx="12" cy="-3" rx="4" ry="2.2" fill="#f58a8a" opacity="0.45" stroke="none"/></g>`;
}
// the forest at night: back + (house) + mid + front trees, grade, the house light, then o.over (painted on the house), then the lit cast OPAQUE on top of every light layer (B2), then o.light
function fscene(c, t, o = {}) {
  const mood = o.mood ?? 0; HS.night(mood);
  const f = HS.forest(c, t, mood, { split: o.split, clear: o.clear, shafts: o.shafts, fog: o.fog, moon: o.moon, path: o.path });
  const h = o.house ? HS.house(c, o.house, t) : null;
  return f.back + (o.water || "") + (h ? h.svg : "") + (o.mid || "") + f.front + HS.grade(mood, o.grade ?? 1) + (h ? h.light : "") + (o.over || "") + (o.cast || "") + (o.light || "");
}
const dk = (a) => `<rect width="${W}" height="${H}" fill="#0a0a1c" opacity="${a}" style="mix-blend-mode:multiply"/>`;
const pathPts = (c, k, z0, z1, seed) => HS.trail(k, z0, z1, seed);


// ---------------------------------------------------------------- shared set pieces
const jit = (seed, amp = 1) => (hash(seed) * 2 - 1) * amp;
const aw = (id, p) => wordAt(LINE[id], p);                       // seconds into a line
// the stable cage with a real gate (the lib cage has none): lib back + my front. door 0 closed .. 1 swung open (toward the camera)
function cage2(c, st, door = 0) {
  const w = st.w ?? 1.3, d = st.d ?? 1.0, h = st.h ?? 1.5, X = st.X, z0 = st.Z, wood = "#8a5c34", woodS = "#5e3c20", woodL = "#b07e4a", ink = `stroke="${L.INK}" stroke-width="2" stroke-linejoin="round"`;
  const lib = HS.cage(c, st), nb = Math.round(w / 0.19), th = ease(door) * 95 * Math.PI / 180, hinge = X - w / 2 + 3.5 * w / nb;
  const Pq = (X2, Y, Z) => P(c, X2, Y, Math.max(c.z + 0.3, Z));
  const bar = (x, z, sd, col) => { const a = Pq(x, 0.08, z), b = Pq(x, h, z), r = 0.032 * a.s, j = jit(sd, r * 0.5); return `<path d="M${n(a.x - r)},${n(a.y)} L${n(a.x - r + j)},${n((a.y + b.y) / 2)} L${n(b.x - r * 0.9)},${n(b.y)} L${n(b.x + r * 0.9)},${n(b.y)} L${n(a.x + r + j)},${n((a.y + b.y) / 2)} L${n(a.x + r)},${n(a.y)} Z" fill="${col}" ${ink}/><path d="M${n(a.x + r * 0.3)},${n(a.y)} L${n(a.x + r * 0.3 + j)},${n((a.y + b.y) / 2)} L${n(b.x + r * 0.3)},${n(b.y)}" stroke="${woodL}" stroke-width="${n(r * 0.4)}" fill="none" opacity="0.7"/>`; };
  const rail = (y, xa, za, xb, zb, col) => `<polygon points="${[Pq(xa, y, za), Pq(xb, y, zb), Pq(xb, y + 0.1, zb), Pq(xa, y + 0.1, za)].map((q) => `${n(q.x)},${n(q.y)}`).join(" ")}" fill="${col}" ${ink}/>`;
  const slab = `<polygon points="${[Pq(X - w / 2 - 0.05, h + 0.1, z0), Pq(X + w / 2 + 0.05, h + 0.1, z0), Pq(X + w / 2 + 0.05, h + 0.1, z0 + d), Pq(X - w / 2 - 0.05, h + 0.1, z0 + d)].map((q) => `${n(q.x)},${n(q.y)}`).join(" ")}" fill="${woodS}" ${ink}/>`;
  let front = slab;
  for (let i = 0; i <= 3; i++) front += bar(X - w / 2 + i * w / nb, z0, i * 7 + 2, wood);
  front += rail(h, X - w / 2 - 0.05, z0, X + w / 2 + 0.05, z0, wood) + rail(0, X - w / 2 - 0.05, z0, hinge, z0, wood);
  const L2 = X + w / 2 + 0.05 - hinge, ex = hinge + L2 * Math.cos(th), ez = z0 - L2 * Math.sin(th);
  if (door < 0.05) front += rail(0, hinge, z0, X + w / 2 + 0.05, z0, wood);
  for (let i = 4; i <= nb; i++) { const dx = X - w / 2 + i * w / nb - hinge; front += bar(hinge + dx * Math.cos(th), z0 - dx * Math.sin(th), i * 7 + 2, wood); }
  if (door >= 0.05) front += rail(h - 0.1, hinge, z0, ex, ez, wood) + rail(0.0, hinge, z0, ex, ez, wood);
  const ldx = X + w * 0.28 - hinge, lk = Pq(hinge + ldx * Math.cos(th), h * 0.55, z0 - ldx * Math.sin(th)), r = 0.06 * lk.s;
  front += `<rect x="${n(lk.x - r)}" y="${n(lk.y)}" width="${n(r * 2)}" height="${n(r * 1.6)}" rx="${n(r * 0.2)}" fill="#4a4a56" ${ink}/><circle cx="${n(lk.x)}" cy="${n(lk.y + r * 0.7)}" r="${n(r * 0.25)}" fill="#0c0c12"/>`;
  return { back: lib.back, front, lock: { x: lk.x, y: lk.y + r * 0.7 } };
}
// the sugar window: the pane of the right window of a house (HS.HOUSE.win), screen corners
const paneCorner = (c, hs, which = "br") => { const b = P(c, hs.X, 0, hs.Z), s = b.s, G = HS.HOUSE, x = G.win.x + (which.endsWith("r") ? 1 : -1) * G.win.w / 2, y = G.win.y + (which.startsWith("t") ? G.win.h : 0); return { x: b.x + x * s, y: b.y - y * s, s }; };
// the broken corner of the pane: a dark jagged notch (the piece Hansel took)
function notch(c, hs, k = 1) {
  const q = paneCorner(c, hs, "br"), s = q.s * 0.42 * k;
  return `<polygon points="${n(q.x + 4)},${n(q.y + 4)} ${n(q.x - s * 0.55)},${n(q.y + 4)} ${n(q.x - s * 0.4)},${n(q.y - s * 0.12)} ${n(q.x - s * 0.15)},${n(q.y - s * 0.22)} ${n(q.x - s * 0.05)},${n(q.y - s * 0.5)} ${n(q.x + 4)},${n(q.y - s * 0.62)}" fill="#1e0e10" stroke="#fff6e6" stroke-width="2.5" stroke-linejoin="round"/>`;
}
const sniffHouse = (u, x) => {          // Hansel close at the house, sniffing; the red eyes in the RIGHT window (B1: one window for the whole opening)
  const c = { x: 0.55, y: 1.0, z: 1.9 + u * 0.1, h0: 1000 }, hs = { X: 0.15, Z: 5.2 };
  const k = K(c, { X: 0.45, Z: 3.4, fx: 0.4, worry: 0.9, talk: x.ln ? talkAt(x.ln, x.lu) : 0, blink: bl(u), lean: 2 + sw(u, 2.5, 1.5) }, u, 1);
  return fscene(c, u, { mood: 0, clear: { X: hs.X, Z: hs.Z, r: 3.2 }, split: 2.2, house: { ...hs, eyes: 1, eyesWin: "R", eyeK: 1.7, look: tr([[0, 0.3], [1, -0.2]], u), glow: 1 }, cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: k.light });
};

// ---------------------------------------------------------------- the shots
// s(u, x): u = seconds into the shot, x = { ln, lu (seconds into its line), t (global) }
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });
const HOOK = HS.HOOK;
function hookScene(u) {
  const e = ease(clamp(u / 3.4)), c = { ...HOOK.cam, z: lerp(1.6, 2.7, e) };   // departure: the preset camera starts 1.6 m closer so the eyes read on a phone
  const f = HS.forest(c, u, 0, { clear: HOOK.clear, split: HOOK.split });
  const hs = HS.house(c, { ...HOOK.house, eyeK: 1.9, look: tr([[0, -0.75], [1.1, -0.7], [1.6, 0.0], [3.5, 0.0]], u) }, u);
  return f.back + hs.svg + f.front + HS.grade() + hs.light;
}
// 1  L01 FRAME 0: the hook preset, slow push-in, the eyes turn to the camera at ~1.5 s (the blurred oven glimpse at 2.4 s)
shot("1", "L01", 0, (u) => hookScene(u), { vig: 0.9 });
// 2  L02 Hansel close, the sniff reads (A13); the eyes stay in the same window as frame 0 (B1)
shot("2", "L02", -0.1, (u, x) => sniffHouse(u, x), { vig: 0.85 });

// 3  L03 nine o'clock: fire + the father leaving once (wide push), then the children's eyeline (father small in the dark), then their faces (A9)
const FIREKIDS = (c, u, fx, o = {}) => {
  const k = K(c, { X: -0.4, Z: 4.4, fx, worry: o.kw ?? 0.6, blink: bl(u + 1), lean: o.kl ?? 0 }, u, 1);
  const g = HS.gretel(c, { X: 0.5, Z: 4.1, fx, worry: o.gw ?? 1, blink: bl(u + 2.3), look: o.look }, u);
  return { k, g };
};
shot("3a", "L03", -0.1, (u, x) => {
  const c = { x: 0.3, y: 1.25, z: 0.4 + u * 0.14, h0: 1140 }, fire = HS.campfire(c, { X: -1.4, Z: 5.6, level: 0.9 }, u);
  const { k, g } = FIREKIDS(c, u, 0.7);
  const fz = lerp(5.2, 11.5, ease(u / 3.4)), fxp = lerp(1.4, 3.6, ease(u / 3.4));
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: lit(k.svg) + lit(g.svg) + father(c, fxp, fz, u * 1.7), light: fire.light + k.light });
}, { vig: 0.85 });
shot("3b", "L03", () => aw("L03", "deep") - 0.3, (u, x) => {
  const c = { x: 1.0, y: 1.2, z: 2.2 + u * 0.22, h0: 1090 }, fire = HS.campfire(c, { X: -0.9, Z: 4.4, level: 0.7 }, u);
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: father(c, lerp(3.4, 4.2, u / 2), lerp(12, 15.5, u / 2), u * 1.5), light: fire.light });
}, { vig: 0.9 });
shot("3c", "L03", () => aw("L03", "and") - 0.15, (u, x) => {
  const c = { x: -0.05, y: 0.85, z: 2.2 + u * 0.08, h0: 900 }, fire = HS.campfire(c, { X: -1.7, Z: 5.4, level: 0.8 }, u);
  const { k, g } = FIREKIDS(c, u, 0.7, { kw: 1, gw: 1, look: 0.8 });
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: lit(k.svg) + lit(g.svg), light: fire.light + k.light });
}, { vig: 0.9 });

// 4  L04 the pebble memory (cut on "Tonight"), then Hansel drops the crumbs: each one falls from his hand and stays where it lands (B3)
const pebs = [{ X: -0.9, Z: 3.1 }, { X: -0.2, Z: 3.7 }, { X: 0.7, Z: 3.2 }, { X: 1.2, Z: 4.0 }, { X: -1.4, Z: 4.3 }];
shot("4a", "L04", -0.1, (u) => {
  const c = { x: 0.05 + u * 0.08, y: 0.3, z: 0.4 + u * 0.1, h0: 900 };
  return fscene(c, u, { split: 2.5, mid: HS.pebbles(c, [...pebs, ...HS.trail(5, 3.4, 8, 3)], u, { k: 2.4 }), shafts: 1 });
}, { vig: 0.9 });
shot("4b", "L04", () => aw("L04", "tonight") - 0.12, (u) => {
  const V = 0.5, f = kidF(V), kz = 2.6, kx = (q) => -0.6 + q * V, cam = (q) => ({ x: kx(q) + 0.2, y: 0.45, z: 0.9, h0: 1290 }), c = cam(u);
  const drops = [];
  for (let i = 0, ti = 0.4; ti <= u; i++, ti += 0.5) {      // where the crumb leaves his hand, in world units (camera of that moment)
    const ci = cam(ti), hand = HS.kidHand(ci, { X: kx(ti), Z: kz, run: f * ti }), feet = P(ci, kx(ti), 0, kz);
    drops.push({ X: kx(ti) + (hand.x - feet.x) / feet.s, Y: (feet.y - hand.y) / feet.s, t: ti });
  }
  const landed = drops.filter((q) => u >= q.t + 0.28).map((q) => ({ X: q.X, Z: kz + 0.03 }));
  let fall = "";
  for (const q of drops) if (u < q.t + 0.28) { const g = (u - q.t) / 0.28, p = P(c, q.X, q.Y * (1 - g * g), kz + 0.03), r = 0.075 * p.s * 1.3; fall += `<circle cx="${n(p.x)}" cy="${n(p.y)}" r="${n(r)}" fill="#d9a85a" stroke="#5a3210" stroke-width="1.4"/>`; }
  const k = K(c, { X: kx(u), Z: kz, fx: 0.75, worry: 0.7, run: f * u, blink: bl(u) }, u, 1);
  return fscene(c, u, { split: 2.5, mid: HS.crumbs(c, landed, { k: 1.8 }), cast: lit(k.svg) + fall, light: k.light });
}, { vig: 0.9 });
// 5  (L05 dropped) a 0.83 s insert: beak and crumb, each crumb gone at a beak contact, the last one at the end; ends on bare ground (B4, A6)
shot("5", "L04", () => LINE.L04.off, (u) => {
  const c = { x: 0.0, y: 0.3, z: 1.2, h0: 960 }, pts = [{ X: 0.35, Z: 2.8 }, { X: 0.05, Z: 2.55 }, { X: -0.3, Z: 2.3 }];
  const eaten = tr([[0, 0], [0.1, 0], [0.27, 1], [0.33, 1], [0.5, 2], [0.55, 2], [0.72, 3]], u);
  const peck = (a, b) => 0.5 + 0.5 * Math.sin((u - a) * 30) * (u >= a && u <= b ? 1 : 0);
  const aX = tr([[0, 0.55], [0.28, 0.55], [0.36, 0.25], [1, 0.25]], u), aHop = u > 0.28 && u < 0.36 ? 14 : 0;
  const A = HS.bird(P(c, aX, 0, tr([[0, 2.8], [0.28, 2.8], [0.36, 2.55], [1, 2.55]], u)), { dir: -1, peck: peck(0.08, 0.27) + peck(0.38, 0.5) - 0.5, k: 2.2, hop: aHop });
  const bT = clamp(u / 0.42), bX = lerp(-1.1, -0.5, ease(bT)), bY = 1.1 * (1 - ease(bT)) ** 1.5;
  const B = u < 0.42 ? HS.bird(P(c, bX, bY, 2.3), { fly: u * 3.2, k: 2.0, dir: 1 }) : HS.bird(P(c, -0.5, 0, 2.3), { dir: 1, peck: peck(0.5, 0.72), k: 2.0 });
  return fscene(c, u, { split: 2.2, mid: HS.crumbs(c, pts, { eaten, k: 2.4 }) + A + B });
}, { vig: 0.9 });
// 6  L06 Gretel close, scared, the empty path behind her
shot("6", "L06", -0.1, (u, x) => {
  const c = { x: 0.15, y: 0.95, z: 1.9 + u * 0.08, h0: 1050 };
  const g = HS.gretel(c, { X: 0.05, Z: 3.0, fx: 0.15, worry: 1, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.4), look: 0.5 + sw(u, 0.5, 0.4) }, u);
  return fscene(c, u, { split: 2.5, cast: lit(g.svg, { a: 0.5 }) });
}, { vig: 0.9 });

// 7  L07 midnight: starts on warm light between the trunks, drifts until the house resolves on "Something sweet" (A10)
const GLOW = { X: 0.3, Z: 16 };
const glowFar = (c, k = 1, a = 1) => { const p = P(c, GLOW.X, 1.2, GLOW.Z); return blobLight(p.x, p.y, 120 * k, "#ffb050", 0.22 * a, 9) + blobLight(p.x, p.y, 40 * k, "#ffe0a0", 0.4 * a, 12); };
shot("7", "L07", -0.1, (u, x) => {
  const c = { x: 0.1 + u * 0.03, y: 1.3, z: 0.2 + u * 0.9, h0: 1100 };
  return fscene(c, u, { shafts: 1.4, split: 3, light: glowFar(c, 1 + u * 0.1, 1), house: { X: GLOW.X, Z: GLOW.Z, glow: tr([[0, 0.05], [1.0, 0.2], [1.9, 0.9]], u) } });
}, { vig: 0.85 });
// 8  L08 Gretel sniffs and points (closer on her warning)
shot("8", "L08", -0.1, (u, x) => {
  const c = { x: 0.2, y: 1.0, z: 1.6, h0: 1050 };
  const g = HS.gretel(c, { X: -0.2, Z: 3.1, fx: 0.55, sniff: 1, point: ease(clamp((u - 0.5) / 0.4)), worry: 0.3, talk: talkAt(x.ln, x.lu) * 0.5, blink: bl(u, 0.2) }, u);
  return fscene(c, u, { shafts: 1.2, split: 2.5, cast: lit(g.svg, { a: 0.5 }), light: glowFar(c, 1.4), house: { X: 1.2, Z: 14, glow: 0.7 } });
}, { vig: 0.9 });
// 9  L09-L10 two-shot: Gretel worried; Hansel starts beside her and walks past her toward the glow; the flame shrinks on "hungry"
shot("9", "L09", -0.1, (u, x) => {
  const d10 = LINE.L10.at - LINE.L09.at, t0 = d10 + aw("L10", "hungry"), c = { x: 0.4, y: 1.0, z: 0.9 + u * 0.03, h0: 1050 };
  const fl = tr([[0, 1], [t0 - 0.2, 1], [t0 + 0.35, 0.35]], u), V = 0.34, kx = 0.35 + u * V * 0.6, kz = 3.2 + u * V * 0.8;
  const g = HS.gretel(c, { X: -0.35, Z: 3.2, fx: 0.4, worry: 1, talk: u < LINE.L09.off ? talkAt(x.ln, x.lu) : 0, blink: bl(u, 0.3) }, u);
  const k = K(c, { X: kx, Z: kz, fx: 0.75, run: kidF(V) * u, blink: bl(u + 1), talk: u > d10 ? talkAt(LINE.L10, u - d10) : 0 }, u, fl);
  return fscene(c, u, { shafts: 1.2, split: 2.5, cast: lit(g.svg, { a: 0.5 }) + lit(k.svg, { a: 0.5 }), light: k.light + glowFar(c, 1.6), house: { X: 1.6, Z: 16, glow: 0.7 } });
}, { vig: 0.9 });
// 10  L11 ONE walking shot toward the house (the 1812 line): Hansel ahead, Gretel behind him, both steps planted, same arrangement as shot 9 (B5)
shot("10", "L11", -0.1, (u, x) => {
  const V = 0.8, c = { x: 0.0, y: 1.1, z: u * V, h0: 1080 };
  const k = K(c, { X: 0.4, Z: c.z + 3.3, fx: 0.2, run: kidF(V) * u, blink: bl(u) }, u, 0.9);
  const g = HS.gretel(c, { X: -0.45, Z: c.z + 2.6, fx: 0.2, run: gretF(V) * u + 0.5, worry: 0.6, blink: bl(u + 1) }, u);
  return fscene(c, u, { shafts: 0.8, split: c.z + 4, cast: lit(k.svg, { a: 0.5 }) + lit(g.svg, { a: 0.5 }), house: { X: 0.15, Z: 14, glow: 1 }, clear: { X: 0.15, Z: 14, r: 3 }, light: k.light });
}, { vig: 0.85 });

// 11  L12 the house reveal: three different crops, one per phrase: bread wall, roof icing, the sugar pane (A11)
const HZ = 6.0;
const houseSc = (c, u, o = {}) => fscene(c, u, { shafts: 0.5, split: 2, clear: { X: 0.15, Z: HZ, r: 3.6 }, house: { X: 0.15, Z: HZ, glow: 1, door: 0, ...(o.h || {}) }, over: o.over || "", cast: o.cast || "", light: o.light || "" });
shot("11a", "L12", -0.15, (u) => houseSc({ x: -0.6, y: 0.9, z: 3.0 + u * 0.25, h0: 1050 }, u), { vig: 0.85 });
shot("11b", "L12", () => aw("L12", "a") - 0.15, (u) => houseSc({ x: 0.9, y: 1.5, z: 2.6 + u * 0.2, h0: 1700 }, u), { vig: 0.85 });
shot("11c", "L12", () => aw("L12", "windows") - 0.2, (u) => houseSc({ x: 1.23, y: 1.1, z: 3.8 + u * 0.15, h0: 1080 }, u), { vig: 0.85 });

// 12  L13 Hansel breaks a corner off the sugar pane BEFORE "Nibble" (D6/B6: the pane shows the break), the piece stays in his hand through the bite (B8); then the eyes; the jar stands on the ground beside him (D4)
const BW = { X: 0.15, Z: 5.2 };
const bite12 = (c, u, st = {}) => {
  const cn = paneCorner(c, BW), Zk = BW.Z - (BW.Z - c.z) / 1.4, X0 = 2.0, s0 = P(c, X0, 0, Zk).s;
  const hand0 = HS.kidHand(c, { X: X0, Z: Zk, reachL: 1 }), X = X0 + (cn.x - hand0.x) / s0;
  const reach = ease(clamp(u / 0.14)), gone = u > 0.16;
  const k = K(c, { X, Z: Zk, fx: lerp(-0.25, -0.75, ease(clamp((u - 0.3) / 0.3))), reachL: reach, blink: bl(u + 3), talk: u > 0.5 ? 0.35 + 0.35 * Math.sin(u * 24) : 0, worry: 0.2, ...st }, u, 1, { jar: [X - 0.45, Zk + 0.15], piece: gone ? { hand: "L", rot: -20, bitten: u > 0.55 ? 1 : 0 } : null });
  return { k, over: gone ? notch(c, BW) : "", X, Zk };
};
shot("12a", "L13", -0.19, (u) => {
  const c = { x: 1.35, y: 0.5, z: 1.8, h0: 1000 }, b = bite12(c, u);
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: BW.X, Z: BW.Z, r: 3.4 }, house: { ...BW, glow: 1 }, over: b.over, cast: lit(b.k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: b.k.light });
}, { vig: 0.85 });
shot("12b", "L13", () => 0.9, (u) => {
  const c = { x: BW.X + 1.08, y: 1.1, z: 3.6 + u * 0.18, h0: 1100 }, hs = { ...BW, glow: tr([[0, 1], [1.6, 0.55]], u), eyes: clamp((u - 0.25) / 1.4), eyesWin: "R", eyeK: 1.6, look: tr([[0, 0.5], [1.8, -0.3]], u) };
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: BW.X, Z: BW.Z, r: 3.4 }, house: hs, over: notch(c, BW) });
}, { vig: 0.85 });
// 13  L14 reaction close-up, kept through the line's last sound (A8): the piece still in his hand at his face
shot("13", "L14", -0.15, (u, x) => {
  const c = { x: 1.55, y: 0.9, z: 2.9 + u * 0.08, h0: 1250 }, cn = paneCorner(c, BW), Zk = BW.Z - (BW.Z - c.z) / 1.4;
  const hand0 = HS.kidHand(c, { X: 2.0, Z: Zk, reachL: 1 }), X = 2.0 + (cn.x - hand0.x) / P(c, 2, 0, Zk).s;
  const k = K(c, { X, Z: Zk, fx: -0.6, reachL: 1, shock: 0.7, worry: 0.8, talk: talkAt(x.ln, x.lu) * 0.4, blink: 0 }, u, 1, { jar: "none", piece: { hand: "L", rot: -20, bitten: 1 } });
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: BW.X, Z: BW.Z, r: 3.4 }, house: { ...BW, bite: 1, glow: 0.55, eyes: 1, eyesWin: "R", eyeK: 1.6 }, over: notch(c, BW), cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: k.light });
}, { vig: 0.9 });

// 14  L15 the door swings open, the beam grows from the opening, the witch sweet in the doorway; the kids (opaque, faces clear of the spill) take their steps to the threshold (B9-B11)
shot("14", "L14", () => LINE.L14.off, (u, x) => {
  const L15 = LINE.L15, uu = u, c = { x: 0.5, y: 1.15, z: 0.5 + u * 0.08, h0: 1100 }, hz = 5.6, door = ease(clamp((u - 0.1) / 1.0)), V = 0.42;
  const wi = HS.witch(c, { X: 0.1, Z: hz - 0.25, dir: 1, sweet: 1, bend: 0.5, talk: u > 0.15 ? talkAt(L15, u - 0.15) : 0, blink: bl(u) }, u);
  const kx = lerp(0.95, 0.4, ease(u / 3)), gx = lerp(0.4, -0.05, ease(u / 3));
  const k = K(c, { X: kx, Z: 3.9 + u * V * 0.85, fx: -0.5, run: kidF(V) * u, blink: bl(u + 2) }, u, 1);
  const g = HS.gretel(c, { X: gx, Z: 3.75 + u * V * 0.85, fx: -0.4, run: gretF(V) * u + 0.4, worry: 1, blink: bl(u + 1) }, u);
  HS.night(0);
  const f = HS.forest(c, u, 0, { clear: { X: 0.15, Z: hz, r: 3.5 }, split: 2 }), h = HS.house(c, { X: 0.15, Z: hz, door, glow: 1, bite: 1 }, u);
  return f.back + h.svg + f.front + HS.grade(0, 1) + h.panes + (door > 0.35 ? HS.lit(wi.svg, { shade: "#8a6a5a", a: 0.6, rim: "#ffd08a", side: 1 }) : "") + h.spill + lit(k.svg + g.svg, { a: 0.5, rim: "#ffc070" }) + k.light;
}, { vig: 0.85 });

// 15  L16 3 a.m.: both pillows in the frame, a patch of moonlight on them; the jar stands on the floor by the bed (D4/B17)
const BEDS = HS.ROOM.beds;
const bedHeads = (c, br) => { const a = P(c, BEDS[0].X, 0.62, 6.0), b = P(c, BEDS[1].X, 0.62, 6.0); return sleeper(a, a.s, "R", br) + sleeper(b, b.s, "K", br); };
const bedJar = (c, t) => { const q = P(c, BEDS[1].X - 0.62, 0, 5.3), kk = q.s / 100 * 0.8; return jarSvg(q.x, q.y, kk, 0.9, true) + blobLight(q.x, q.y - 12 * kk, 36 * kk * 2, "#ffb860", 0.1, 5); };
const moonOn = (c) => { const a = P(c, 1.7, 0.7, 5.9); return blobLight(a.x, a.y, a.s * 1.25, "#9ac0ff", 0.14, 21); };
const bedRoom = (c, u, o = {}) => { const r = HS.room(c, u, { lamp: 0, dark: 0.85, oven: { fire: 0.15 } }); return r; };
shot("15", "L16", -0.1, (u) => {
  const c = { x: 1.7, y: 1.25, z: 1.4 + u * 0.1, h0: 1100 }, r = bedRoom(c, u);
  return r.back + bedHeads(c, sw(u, 0.35, 1)) + r.light + dk(0.2) + moonOn(c) + bedJar(c, u);
}, { vig: 0.95 });

// 16  L17 the witch: face close with the red eyes, then one slow bedside push for the sniff, over the boy (A5; she faces him through the cut, B13)
const witchLit = (wi, o = {}) => HS.lit(wi.svg, { shade: "#6a4a50", a: 0.6, rim: "#ff5a3a", rimA: 0.55, side: 1, ...o }) + wi.light;
shot("16a", "L17", -0.1, (u) => {
  const c = { x: 0.7, y: 1.5, z: 2.6 + u * 0.08, h0: 1150 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 0.2, Z: 3.7, dir: 1, sweet: 0, bend: 0.5, sniff: 0.4 + 0.4 * Math.sin(u * 3), eyeGlow: 1, blink: 0 }, u);
  return r.back + r.light + dk(0.5) + witchLit(wi);
}, { vig: 0.95 });
shot("16b", "L17", () => aw("L17", "they") - 0.1, (u) => {
  const c = { x: 1.55, y: 1.3, z: 1.6 + u * 0.12, h0: 1100 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 0.95, Z: 4.0, dir: 1, sweet: 0, bend: 0.8, sniff: 1, reach: 0.3, eyeGlow: 1, blink: 0 }, u);
  return r.back + bedHeads(c, sw(u, 0.35)) + r.light + dk(0.45) + bedJar(c, u) + witchLit(wi);
}, { vig: 0.95 });
shot("16c", "L17", () => aw("L17", "but") - 0.1, (u) => {
  const c = { x: 1.95, y: 1.1, z: 2.2 + u * 0.12, h0: 1000 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 1.4, Z: 4.5, dir: 1, sweet: 0, bend: 1, sniff: 1, eyeGlow: 1, blink: 0 }, u);
  return r.back + bedHeads(c, sw(u, 0.35)) + r.light + dk(0.45) + witchLit(wi);
}, { vig: 0.95 });

// 17  L18 He smelled her house (Hansel's sniff, the same framing as shot 2) / She smelled him (the witch's sniff over his pillow, same screen spot), the grab on "first", the gate (A5, B14, B16)
shot("17a", "L18", -0.1, (u, x) => sniffHouse(u + 0.3, { ln: null }), { vig: 0.85 });
shot("17b", "L18", () => aw("L18", "she") - 0.25, (u) => {
  const c = { x: 1.95, y: 1.1, z: 2.5, h0: 1000 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const reach = ease(clamp((u - 0.45) / 0.35));
  const wi = HS.witch(c, { X: 1.4, Z: 4.5, dir: 1, sweet: 0, bend: 1, sniff: 1 - reach * 0.6, reach, reachX: 34, reachY: -58, eyeGlow: 1, blink: 0 }, u);
  return r.back + bedHeads(c, sw(u, 0.35)) + r.light + dk(0.45) + witchLit(wi);
}, { vig: 0.95 });
shot("17c", "L18", () => aw("L18", "first") - 0.12, (u) => {
  const c = { x: 1.2, y: 1.3, z: 1.4, h0: 1100 }, r = HS.room(c, u, { lamp: 0, dark: 0.85, oven: { fire: 0.3 } }), up = ease(clamp(u / 0.2));
  const wi = HS.witch(c, { X: 1.0, Z: 4.4, dir: 1, sweet: 0, bend: 1, reach: 1, reachX: 36, reachY: -66, eyeGlow: 1 }, u);
  const k = L.kid(c, { X: 1.6, Z: 4.6, fx: -0.5, shock: 1, worry: 1, lean: -6 * up, hop: 8 * up }, u);
  return r.back + BEDS.map((b, i) => i === 0 ? sleeper(P(c, b.X, 0.62, 6), P(c, b.X, 0.62, 6).s, "R") : "").join("") + r.light + dk(0.4) + HS.lit(k.svg, { shade: "#5a4a5a", a: 0.6, rim: "#ff5a3a", rimA: 0.5, side: 1 }) + witchLit(wi);
}, { vig: 0.95 });
const CG = { X: 0.7, Z: 3.9 };
shot("17d", "L18", () => LINE.L18.off - 0.3, (u) => {
  const c = { x: 0.1, y: 1.1, z: 0.5 + u * 0.1, h0: 1080 }, sb = HS.stable(c, u, {}), door = 1 - ease(clamp((u - 0.55) / 0.35)), cg = cage2(c, CG, door);
  const kx = lerp(CG.X - 1.3, CG.X + 0.05, ease(clamp(u / 0.55))), wx = lerp(CG.X - 2.0, CG.X - 1.2, ease(clamp(u / 0.55)));
  const wi = HS.witch(c, { X: wx, Z: 3.8, dir: 1, sweet: 0, bend: 0.6, reach: 1, reachX: 40, reachY: -62, eyeGlow: 0.9 }, u);
  const k = L.kid(c, { X: kx, Z: lerp(3.7, 4.4, ease(clamp(u / 0.55))), fx: -0.4, run: u * 1.2, shock: 1, worry: 1 }, u);
  return sb.back + lit(HS.cage(c, CG).back, { a: 0.5, rimA: 0 }) + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.55, rim: "#9ac0ff", side: -1 }) + HS.lit(cg.front, { shade: "#6a6a88", a: 0.5, rimA: 0 }) + witchLit(wi, { shade: "#6a5a64" });
}, { vig: 0.95 });

// 18  L19 close: the bars; the witch's bony hand reaches in through ONE gap (hand behind the bars, fingertips in the gap), her eyes on the same side (B18, B19)
const GAPX = [485, 665];                                    // the gap between bar 2 and bar 3 of HS.closeBars (4 bars)
const closeUp = (u, o = {}) => {
  const cb = HS.closeBars(u, {}), z = o.zoom ?? 1, cx = 540, cy = 960, hy = o.hy ?? 1010;
  const hd = HS.bonyHand({ x: o.hx ?? 240, y: hy, s: 9, rot: o.hrot ?? -5, pinch: o.pinch ?? 0, feel: o.feel });
  const kf = o.fist ? HS.kidFist({ x: o.kx ?? 880, y: o.ky ?? 1090, s: 9, rot: 3 }).svg : "";
  const eyes = HS.redEyes(o.ex ?? 150, o.ey ?? 760, o.ek ?? 34, { look: o.look ?? 0.5, glow: 1 });
  const cid = `hgc${Math.round(u * 100)}`;
  return `<g transform="translate(${cx},${cy}) scale(${z.toFixed(4)}) translate(${-cx},${-cy})">${cb.back}<rect width="${W}" height="${H}" fill="#3a2a4a" opacity="0.35"/>${eyes}${hd.svg}${cb.bars}<clipPath id="${cid}"><rect x="${GAPX[0]}" y="0" width="${GAPX[1] - GAPX[0]}" height="${H}"/></clipPath><g clip-path="url(#${cid})">${hd.svg}</g>${kf}</g>`;
};
shot("18", "L19", -0.1, (u) => closeUp(u, { hx: lerp(-120, 240, ease(clamp(u / 1.0))), zoom: 1 + u * 0.03, look: 0.2 }), { vig: 0.9 });
// 19  L20 the fist with the bone comes in; the fingertips close on it ("chicken bone." is the end of the line now, the eyes line is cut: A4)
shot("19", "L20", -0.1, (u) => closeUp(u, { fist: true, kx: lerp(1150, 880, ease(clamp(u / 0.5))), hx: 240, pinch: ease(clamp((u - 0.7) / 0.6)), feel: u * 1.6, zoom: 1.03 + u * 0.04, ek: 36 }), { vig: 0.9 });
// 20  L21 the witch close, annoyed ("Still thin.")
shot("20", "L21", -0.1, (u, x) => {
  const c = { x: 0.7, y: 1.5, z: 2.4 + u * 0.08, h0: 1160 }, sb = HS.stable(c, u, {});
  const wi = HS.witch(c, { X: 0.4, Z: 3.7, dir: 1, sweet: 0, bend: 0.3, talk: talkAt(x.ln, x.lu), eyeGlow: 1, blink: bl(u, 0.5) }, u);
  return sb.back + sb.light + witchLit(wi);
}, { vig: 0.95 });
// 21  L22 tighter on Hansel in the cage (the hunger re-hook); no jar in the cage (D4)
shot("21", "L22", -0.1, (u, x) => {
  const c = { x: 0.35, y: 1.15, z: 1.5 + u * 0.12, h0: 1120 }, sb = HS.stable(c, u, {}), cg = cage2(c, CG, 0);
  const k = L.kid(c, { X: CG.X + 0.05, Z: 4.4, fx: -0.3, worry: 1, blink: bl(u, 0.7), lean: sw(u, 0.4, 1) }, u);
  return sb.back + lit(HS.cage(c, CG).back, { a: 0.5, rimA: 0 }) + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.5, rim: "#ffc070", side: 1 }) + HS.lit(cg.front, { shade: "#6a6a88", a: 0.5, rimA: 0 });
}, { vig: 0.95 });

// 22  L23 the witch addresses Gretel; "Girl!": she points at her; "Light the oven.": Gretel lights it (a visible ignition, B20), the room goes red
const s22 = (u, x, pointing, k0 = 0) => {
  const f = ease(clamp((u + k0 - (aw("L23", "oven") - 0.05)) / 0.4));
  const c = { x: 0.3, y: 1.2, z: 1.0 + (u + k0) * 0.1, h0: 1010 }, r = HS.room(c, u, { lamp: lerp(0.15, 0.25, f), red: lerp(0.15, 0.75, f), oven: { door: ease(clamp((u + k0 - 0.5) / 1.0)), fire: lerp(0.3, 1, f) }, dawn: 0.2 * f });
  const wi = HS.witch(c, { X: -0.2, Z: 3.5, dir: 1, sweet: 0, bend: 0.4, reach: pointing, reachX: 70, reachY: -84, talk: talkAt(x.ln, x.lu), eyeGlow: 1, blink: bl(u) }, u);
  const g = HS.gretel(c, { X: 0.55, Z: 3.3, fx: -0.6, small: 0.6, worry: 1, blink: bl(u) }, u);
  return r.back + r.light + dk(0.5 * (1 - f)) + HS.lit(wi.svg, { shade: "#b0523a", a: 0.7, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.65, rim: "#ff9a3a", side: -1 });
};
shot("22a", "L23", -0.1, (u, x) => s22(u, x, 0.0), { vig: 0.9 });
shot("22b", "L23", () => aw("L23", "girl") - 0.12, (u, x) => { const k0 = aw("L23", "girl") - 0.12 + 0.1; return s22(u, x, ease(clamp(u / 0.35)), k0); }, { vig: 0.9 });
shot("22c", "L23", () => aw("L23", "light") - 0.05, (u, x) => {          // the insert: Gretel at the oven strikes a flame, touches the mouth, the fire catches, the iron door is open
  const ig = clamp((u - 0.25) / 0.2), c = { x: -0.55, y: 1.1, z: 1.7 }, r = HS.room(c, u, { lamp: 0.2, red: 0.5 + 0.4 * ig, oven: { door: 1, fire: 0.15 + 0.85 * ig }, dawn: 0.3 }), sp = r.oven.spot;
  const g = HS.gretel(c, { X: sp.X + 0.5, Z: sp.Z, fx: -0.7, point: 1, lean: 4 * ig, worry: 0.3, blink: 0 }, u);
  const fl = `<g transform="translate(${n(g.hand.x)},${n(g.hand.y)})"><path d="M0,0 Q${n(-9 * (1 - ig * 0.4))},-26 0,-42 Q${n(9 * (1 - ig * 0.4))},-26 0,0 Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="2"/></g>`;
  return r.back + r.light + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 }) + (ig < 0.9 ? fl : "");
}, { vig: 0.9 });
// 23  L24 tighter side two-shot: the witch STANDS beside the open oven, sweet again, an arm at the mouth ("Crawl in"); the forward lean is saved for her answer (B21, A12)
shot("23", "L24", -0.1, (u, x) => {
  const c = { x: -0.45, y: 1.1, z: 1.9 + u * 0.06, h0: 1050 }, r = HS.room(c, u, { lamp: 0.25, red: 0.75, oven: { door: 1, fire: 1 }, dawn: 0.6 }), sp = r.oven.spot;
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 1, lean: 0.0, bend: 0.2, reach: 0.7, reachX: 50, reachY: -95, talk: talkAt(x.ln, x.lu), eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + 0.8, Z: sp.Z - 0.05, fx: -0.7, small: 1, blink: bl(u) }, u);
  return r.back + r.light + HS.lit(wi.svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });
// 24  L25 Gretel close, the push in to her eyes on "Show me?", then 0.2 s of silence (A2)
shot("24", "L25", -0.1, (u, x) => {
  const sm = ease(clamp((u - (aw("L25", "show") - 0.3)) / 0.9)), c = { x: 0.15, y: 0.95, z: 1.4 + 0.5 * sm + u * 0.04, h0: 1000 };
  const r = HS.room(c, u, { lamp: 0.25, red: 0.75, oven: { door: 1, fire: 1 }, dawn: 0.6 });
  const g = HS.gretel(c, { X: 0.2, Z: 3.1, fx: -0.15, small: 1, worry: 0.2, talk: talkAt(x.ln, x.lu), look: tr([[0, -0.6], [aw("L25", "show") - 0.4, -0.7], [aw("L25", "show") - 0.1, 0.25]], u), grin: u > aw("L25", "show") + 0.5 ? 1 : 0, blink: bl(u, 0.9) }, u);
  return r.back + r.light + HS.lit(g.svg, { shade: "#b0523a", a: 0.65, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });

// 25  the shove, fast: anticipation and lean 0.5 s / the shove 0.6 s / the door and the latch 0.5 s (A2). The witch's body is one rigid piece, clipped at the oven mouth as it goes in (B22, B23)
const ovenRoom = (c, u, o = {}) => HS.room(c, u, { lamp: 0.2, red: 0.8, oven: { door: o.door ?? 1, fire: 1 }, dawn: 0.6 });
const witchRed = (wi) => HS.lit(wi.svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 });
shot("25a", "L25", () => LINE.L25.off + 0.2, (u) => {
  const c = { x: -0.45, y: 1.1, z: 1.9 }, r = ovenRoom(c, u), sp = r.oven.spot, e = ease(clamp(u / 0.45));
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: lerp(0.15, 1, e), bend: 0.3, eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + lerp(0.8, 0.62, e), Z: sp.Z - 0.05, fx: -0.7, small: 1 - e, blink: 0 }, u);
  return r.back + r.light + witchRed(wi) + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });
shot("25b", "L25", () => LINE.L25.off + 0.7, (u) => {
  const sh = ease(clamp(u / 0.2)), go = ease(clamp((u - 0.15) / 0.4)), c = { x: -0.45, y: 1.1, z: 1.9 }, r = ovenRoom(c, u), sp = r.oven.spot, m = r.oven.mouth;
  const wi = HS.witch(c, { X: sp.X - 0.8 * go, Z: sp.Z, dir: -1, sweet: 0, lean: 1, shoved: sh, bend: 0.3, eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + 0.62 - 0.55 * go * 0.5, Z: sp.Z - 0.05, fx: -0.7, shove: sh, worry: 0.2 }, u);
  return r.back + r.light + `<clipPath id="hgcw"><rect x="${n(m.x)}" y="0" width="${W}" height="${H}"/></clipPath><g clip-path="url(#hgcw)">${witchRed(wi)}</g>` + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });
shot("25c", "L25", () => LINE.L25.off + 1.3, (u) => {
  const door = 1 - ease(clamp((u - 0.1) / 0.2)), c = { x: -0.45, y: 1.1, z: 1.9 }, r = ovenRoom(c, u, { door }), sp = r.oven.spot;
  const g = HS.gretel(c, { X: sp.X + 0.55, Z: sp.Z - 0.05, fx: -0.7, shove: 1 - clamp(u / 0.3), worry: 0.2, grin: u > 0.3 ? 1 : 0 }, u);
  return r.back + r.light + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });

// 26  (L26 dropped) the rescue, 1.5 s: Gretel's hand at the lock, the gate swings, Hansel steps through (B24) / she scoops the pearls into her apron pocket (D5, B26)
const PEARL = { X: -0.9, Z: 3.3 };
shot("26a", "L25", () => LINE.L25.off + 1.8, (u) => {
  const c = { x: 0.1, y: 1.1, z: 0.0 + u * 0.1, h0: 1080 }, sb = HS.stable(c, u, { dawn: 0.5, dark: 0.6 }), door = ease(clamp((u - 0.25) / 0.35)), cg = cage2(c, CG, door);
  const g = HS.gretel(c, { X: CG.X - 0.85, Z: 3.7, fx: 0.7, worry: 0.2, blink: 0, holdTo: cg.lock }, u);
  const st = ease(clamp((u - 0.45) / 0.35)), k = L.kid(c, { X: lerp(CG.X + 0.05, CG.X - 0.65, st), Z: lerp(4.4, 3.65, st), fx: -0.4, worry: lerp(1, 0.1, st), run: st > 0 && st < 1 ? u * 1.2 : null }, u);
  return sb.back + lit(HS.cage(c, CG).back, { a: 0.5, rimA: 0 }) + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.45, rim: "#ffc070", side: 1 }) + HS.lit(cg.front, { shade: "#6a6a88", a: 0.5, rimA: 0 }) + HS.lit(g.svg, { shade: "#6a6a88", a: 0.45, rim: "#9ac0ff", side: -1 });
}, { vig: 0.9 });
shot("26b", "L25", () => LINE.L25.off + 2.6, (u) => {
  const c = { x: -0.4, y: 1.0, z: 1.2 + u * 0.1, h0: 1060 }, sb = HS.stable(c, u, { dawn: 0.6, dark: 0.5 }), scoop = ease(clamp((u - 0.1) / 0.45));
  const g = HS.gretel(c, { X: PEARL.X + 0.4, Z: PEARL.Z, fx: -0.7, small: scoop, worry: 0, blink: 0 }, u);
  const k = L.kid(c, { X: PEARL.X + 1.1, Z: PEARL.Z + 0.3, fx: -0.6, grin: 1, blink: bl(u) }, u);
  const pearls = scoop < 0.95 ? HS.pearls(P(c, PEARL.X, 0, PEARL.Z), { k: 1.6 * (1 - 0.8 * scoop) }) : "";
  return sb.back + sb.light + pearls + HS.lit(k.svg, { shade: "#6a6a88", a: 0.4, rim: "#ffc070", side: 1 }) + HS.lit(g.svg, { shade: "#6a6a88", a: 0.4, rim: "#9ac0ff", side: -1 });
}, { vig: 0.9 });

// 27  L27 dawn: they run home hand in hand (feet planted: steps keep the ground speed, the inner hands joined), the sugar piece in his hand, the pearls in her pocket (D5, D6, B25-B27)
const pocketPearls = (g) => { if (!g.p) return ""; const q = L.toScreen(g.p, 0, 6 * 0.8, -46 * 0.8), r = g.p.s / 100 * 1.5; return [[0, 0], [-r * 1.5, r * 0.7], [r * 1.2, r * 0.9]].map(([dx, dy], i) => `<circle cx="${n(q.x + dx)}" cy="${n(q.y + dy)}" r="${n(r)}" fill="${["#f6f0ff", "#ffe9f0", "#e9f6ff"][i]}" stroke="#9a9ab0" stroke-width="1"/>`).join(""); };
const runPair = (c, u, X, Z, V, o = {}) => {
  const kst = { X: X + 0.4, Z, run: kidF(V) * u, fx: 0.7, grin: 1, blink: bl(u) }, k = K(c, kst, u, 0, { jar: "none", piece: { hand: "R", rot: -20 } });
  const g = HS.gretel(c, { X, Z: Z + 0.02, run: gretF(V) * u + 0.5, fx: 0.7, grin: 1, holdTo: HS.kidHand(c, kst) }, u);
  return { k, g };
};
shot("27a", "L27", -0.1, (u) => {
  const V = 1.0, X = -1.2 + u * V, c = { x: X + 0.6, y: 1.2, z: 0, h0: 1130 }, { k, g } = runPair(c, u, X, 4.2, V);
  return fscene(c, u, { mood: 1, split: 3, water: HS.water(c, u, { z0: 6.2, z1: 13 }), cast: g.svg + k.svg + pocketPearls(g), mid: HS.duck(P(c, 2.2, 0, 8.4), { k: 1.8 }, u) });
}, { vig: 0.5 });
shot("27b", "L27", () => aw("L27", "pockets") - 0.25, (u) => {
  const V = 1.0, X = 0.4 + u * V, c = { x: X + 0.5, y: 0.85, z: 0, h0: 1000 }, { k, g } = runPair(c, u, X, 2.8, V);
  return fscene(c, u, { mood: 1, split: 3, cast: g.svg + k.svg + pocketPearls(g) });
}, { vig: 0.5 });
// 28  L28 he stops and sniffs, lifts the piece to his mouth before the reverse (B28)
shot("28", "L28", -0.1, (u, x) => {
  const c = { x: 0.1, y: 0.95, z: 1.6 + u * 0.08, h0: 1090 };
  const k = K(c, { X: 0.15, Z: 3.2, fx: 0.35, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.6), worry: 0, hand2face: ease(clamp((x.lu - 0.3) / 0.5)), lean: 2 + sw(u, 2.2, 1.2) }, u, 0, { jar: "none", piece: { hand: "R", rot: -10, bitten: x.lu > 0.6 ? 1 : 0 } });
  return fscene(c, u, { mood: 1, split: 3, cast: k.svg });
}, { vig: 0.5 });
// 29  L29 Gretel close, deadpan
shot("29", "L29", -0.1, (u, x) => {
  const c = { x: 0.0, y: 0.95, z: 1.8 + u * 0.06, h0: 1040 };
  const g = HS.gretel(c, { X: 0.0, Z: 3.3, fx: 0.0, worry: 0, talk: talkAt(x.ln, x.lu), blink: bl(u, 2.0), look: 0 }, u);
  return fscene(c, u, { mood: 1, split: 3, cast: g.svg });
}, { vig: 0.5 });
// 30  L30 he turns around chewing: the shoulders and the planted feet start the pivot (the body narrows through the turn), the head follows; picture through the last sound + 0.15 s (B29, B30)
shot("30", "L30", -0.15, (u, x) => {
  const c = { x: 0.0, y: 0.95, z: 1.8 + u * 0.05, h0: 1100 }, tn = ease(clamp((u - 0.12) / 0.9)), sx = 1 - 0.5 * Math.sin(Math.PI * tn);
  const chew = clamp(Math.abs(Math.sin(u * 14)) * 0.5) * (u > 1.2 ? 0.2 : 1);
  const k = K(c, { X: 0.0, Z: 3.3, fx: lerp(0.7, -0.7, clamp(tn * 1.3)), hand2face: 0.9, talk: Math.max(chew, talkAt(x.ln, x.lu)), worry: 0.3 * tn, blink: bl(u, 0.7), lean: -3 * Math.sin(Math.PI * tn) }, u, 0, { jar: "none", piece: { hand: "R", rot: -10, bitten: 1 } });
  const px = k.kd.p.x;
  return fscene(c, u, { mood: 1, split: 3, cast: `<g transform="translate(${n(px)},0) scale(${sx.toFixed(3)},1) translate(${n(-px)},0)">${k.svg}</g>` });
}, { vig: 0.5 });

// ---------------------------------------------------------------- the glimpses (re-hooks): the open oven in red fire light, blurred and dark, then hard back
// 1) 2.4 s, 6 frames, the first look.  2) the house reveal (B15: not during the smell reversal): 12 frames in the gap after "clear sugar", cropped to the glowing mouth
const GLIMPSES = [{ at: 2.4, frames: 6, blur: "gb", dark: 0.5, zoom: 1 }, { line: "L12", off: -0.12, frames: 12, blur: "gb2", dark: 0.22, zoom: 2.3, witch: true }];
function glimpse(t, g) {
  const u = (t - g.at) * FPS, k = u / g.frames, c = { x: -0.75, y: 1.2, z: 1.3 + u * 0.01 };
  const r = HS.room(c, t, { lamp: 0.1, red: 0.9, oven: { door: 1, fire: 1 }, dawn: 0.2 }), sp = r.oven.spot, m = r.oven.mouth;
  const wi = g.witch ? HS.lit(HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: 1, bend: 0.3, eyeGlow: 0.6 }, t).svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) : "";
  const zz = lerp(1, g.zoom, 1), tf = g.zoom > 1 ? `translate(${n(W / 2)},${n(H * 0.5)}) scale(${zz}) translate(${n(-m.x)},${n(-m.y)})` : "";
  return `<g filter="url(#${g.blur})"><g transform="${tf}">${r.back + r.light + wi}</g></g><rect width="${W}" height="${H}" fill="#02030a" opacity="${(g.dark + 0.15 * Math.sin(k * Math.PI)).toFixed(2)}"/>`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) {
  const ln = LINE[s.line], o = typeof s.off === "function" ? s.off() : s.off;
  s.at = Math.max(0, ln.at + o);
}
SHOTS.sort((a, b) => a.at - b.at);
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
export const TIMELINE = SHOTS;
for (const g of GLIMPSES) if (g.line) g.at = LINE[g.line].end + g.off;
export const BANNER_END = Math.min(3.0, SHOTS.find((s) => s.id === "2").at - 0.02);   // the lib default (0-3 s): gone before the first cut after 2.6 s
const sh25b = SHOTS.find((s) => s.id === "25b"), sh25c = SHOTS.find((s) => s.id === "25c");
CUE.shove = sh25b.at + 0.05; CUE.slam = sh25c.at + 0.28;
const lineAtTime = (t) => { let k = null; for (const id of ORDER) { const ln = LINE[id]; if (t >= ln.at - 0.25) k = ln; } return k; };

function captions(t, y) {
  const ln = lineAtTime(t);
  if (!ln || t > ln.at + ln.off + 0.2) return "";
  return captionSvg(ln.phrases, t - ln.at, { key: KEY, keyColor: "#ff3b3b", y, maxFs: 74, width: 900, wrapAt: 15, reveal: true });
}
export const SUBS = { on: true };
// the picture at time t: { pic: svg without subtitles (banner stays), cap: the subtitle svg (or "") }
export function parts(time) {
  L.resetIds(); HS.resetIds(); HS.night(0);
  let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q;
  const ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  const g = GLIMPSES.find((q) => t >= q.at - 1e-6 && t < q.at + q.frames / FPS - 1e-6);
  const body = g ? glimpse(t, g) : s.fn(u, { ln, lu: t - ln.at, t });
  return { pic: frame(body, g ? 0.8 : s.vig ?? 0.8) + titleSvg("lebkuchen", t, { teaser: "T1", end: BANNER_END }), cap: captions(t, s.capY ?? CAPY), shot: s.id };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
