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
export const VO = process.env.HG_VO || "out/legend-hansel/vo";
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
  L11: "The Brothers Grimm,|1812.|Their first version|is darker than|the one you know.",
  L12: "Walls of bread.|A roof of cake.|Windows of|clear sugar.",
  L13: "Nibble, nibble,|little mouse...|who is nibbling|at my house?",
  L14: "...The wind?",
  L15: "Come in,|my sweet ones.|There are pancakes.",
  L16: "Three in|the morning.",
  L17: "Witches have|red eyes.|They can't|see far.|But they smell you...|like animals do.",
  L18: "He smelled|her house.|She smelled|him first.",
  L19: "Stick out|your finger.",
  L20: "Hansel held out|a chicken bone.|Her eyes couldn't|tell the difference.",
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
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
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
export const ORDER = Array.from({ length: 30 }, (_, i) => "L" + String(i + 1).padStart(2, "0"));
const GAP = { L02: 0.1, L03: 0.3, L04: 0.3, L05: 0.12, L06: 0.2, L07: 0.3, L08: 0.28, L09: 0.12, L10: 0.22, L11: 0.3, L12: 0.2, L13: 0.55, L14: 0.2, L15: 0.1, L16: 0.7, L17: 0.45, L18: 0.5, L19: 0.85, L20: 0.18, L21: 0.15, L22: 0.7, L23: 0.1, L24: 0.35, L25: 0.14, L26: 1.7, L27: 0.5, L28: 0.4, L29: 0.45, L30: 0.5 };
{ let T = 0, prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? T + GAP[id] : 0; ln.end = ln.at + ln.off; T = ln.end; prev = ln; } }
export const DUR = +(LINE.L30.at + wordEnd(LINE.L30, "turning") + 0.2).toFixed(2);
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
// Hansel: L.kid + Grandma's candle jar in his left hand (the lib kid carries a bell there; the jar hangs over it). fl = flame 0..1 (the fear meter)
function K(c, st, t, fl = 1) {
  const kd = L.kid(c, st, t);
  if (!kd.p) return { svg: "", light: "", kd, hand: null };
  const h = HS.kidHand(c, st), k = kd.p.s / 100 * 0.8, f = Math.max(0, fl) * (1 + 0.05 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1));
  const jx = h.x, jy = h.y + 4 * k;           // the jar hangs from his fist on a wire loop
  let j = `<g class="ol" transform="translate(${n(jx)},${n(jy)}) scale(${(k).toFixed(4)})">
    <path d="M0,0 Q-5,-9 0,-14 Q5,-9 0,0" stroke="#3a2a2a" stroke-width="0.8" fill="none"/>
    <path d="M-6.5,6 L6.5,6 L6,9 L-6,9 Z" fill="#3a2a2a"/>
    <path d="M-6,9 Q-7.5,16 -6,24 Q0,27 6,24 Q7.5,16 6,9 Z" fill="#cfe6ff" opacity="0.5" stroke="#e9f3ff" stroke-width="0.8"/>
    <path d="M-1.6,24 L1.6,24 L1.6,17 L-1.6,17 Z" fill="#fff4e0"/>
    ${f > 0.04 ? `<path d="M0,${n(17 - 10 * f)} Q${n(3.4 * f)},${n(15.5 - 3 * f)} 0,15.5 Q${n(-3.4 * f)},${n(15.5 - 3 * f)} 0,${n(17 - 10 * f)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.5"/>` : `<path d="M-0.6,16.5 q0.6,-3 1.2,-5" stroke="#8a8a8a" stroke-width="0.7" fill="none" opacity="0.6"/>`}</g>`;
  const light = f > 0.04 ? blobLight(jx, jy + 17 * k, (14 + 30 * f) * k, "#ffb860", 0.06 + 0.07 * f, 5) : "";
  return { svg: kd.svg + j, light, kd, hand: h };
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
// the forest at night: back + (house) + mid + front trees, grade, then the lit cast and the light layers
function fscene(c, t, o = {}) {
  const mood = o.mood ?? 0; HS.night(mood);
  const f = HS.forest(c, t, mood, { split: o.split, clear: o.clear, shafts: o.shafts, fog: o.fog, moon: o.moon, path: o.path });
  const h = o.house ? HS.house(c, o.house, t) : null;
  return f.back + (o.water || "") + (h ? h.svg : "") + (o.mid || "") + f.front + HS.grade(mood, o.grade ?? 1) + (o.cast || "") + (h ? h.light : "") + (o.light || "");
}
const dk = (a) => `<rect width="${W}" height="${H}" fill="#0a0a1c" opacity="${a}" style="mix-blend-mode:multiply"/>`;
const pathPts = (c, k, z0, z1, seed) => HS.trail(k, z0, z1, seed);

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
// 1  L01 FRAME 0: the hook preset, slow push-in, the eyes turn to the camera at ~1.5 s
shot("1", "L01", 0, (u) => hookScene(u), { vig: 0.9 });

// 2  L02 kid close at the door, sniffing, the jar in his hand; the eyes in the top window above him
shot("2", "L02", -0.1, (u, x) => {
  const c = { x: 0.2, y: 1.0, z: 0.4 + u * 0.12, h0: 1150 };
  const k = K(c, { X: 0.35, Z: 2.9, fx: -0.15, worry: 0.9, talk: talkAt(x.ln, x.lu), blink: bl(u), lean: 2 + sw(u, 2.5, 1.5) }, u, 1);
  return fscene(c, u, { mood: 0, clear: { X: 0, Z: 4.8, r: 3.2 }, split: 2.2, house: { X: 0, Z: 4.8, eyes: 1, eyesWin: "top", eyeK: 1.5, look: tr([[0, 0.3], [1, 0]], u), glow: 1 }, cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: k.light });
}, { vig: 0.85 });

// 3  L03 nine o'clock: the fire in the forest, the father's back walking away into the dark; push in on the two kids
const FIREKIDS = (c, u, fx, o = {}) => {
  const k = K(c, { X: -0.4, Z: 4.4, fx, worry: o.kw ?? 0.6, blink: bl(u + 1), lean: o.kl ?? 0 }, u, 1);
  const g = HS.gretel(c, { X: 0.5, Z: 4.1, fx, worry: o.gw ?? 1, blink: bl(u + 2.3), look: o.look }, u);
  return { k, g };
};
shot("3a", "L03", -0.1, (u, x) => {
  const c = { x: 0.3, y: 1.25, z: 0.4 + u * 0.1, h0: 1140 }, fire = HS.campfire(c, { X: -1.4, Z: 5.6, level: 0.9 }, u);
  const { k, g } = FIREKIDS(c, u, 0.7);
  const fz = lerp(5.2, 11.5, ease(u / 3.0)), fxp = lerp(1.4, 3.6, ease(u / 3.0));
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: lit(k.svg) + lit(g.svg) + father(c, fxp, fz, u * 1.7), light: fire.light + k.light });
}, { vig: 0.85 });
shot("3b", "L03", () => wordAt(LINE.L03, "by") - 0.2, (u, x) => {
  const c = { x: 0.1, y: 1.0, z: 1.5 + u * 0.12, h0: 1000 }, fire = HS.campfire(c, { X: -1.6, Z: 5.6, level: 0.9 }, u);
  const { k, g } = FIREKIDS(c, u, 0.65, { kw: 0.8 });
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: lit(k.svg) + lit(g.svg) + father(c, 3.1, 11.5, u * 1.3), light: fire.light + k.light });
}, { vig: 0.85 });
shot("3c", "L03", () => wordAt(LINE.L03, "and") - 0.15, (u, x) => {
  const c = { x: -0.05, y: 0.85, z: 2.2 + u * 0.08, h0: 900 }, fire = HS.campfire(c, { X: -1.7, Z: 5.4, level: 0.8 }, u);
  const { k, g } = FIREKIDS(c, u, 0.7, { kw: 1, gw: 1, look: 0.8 });
  return fscene(c, u, { mid: fire.svg, split: 3.2, cast: lit(k.svg) + lit(g.svg), light: fire.light + k.light });
}, { vig: 0.9 });

// 4  L04 low shot: the white pebbles glint (memory), then Hansel drops the crumbs
const pebs = [{ X: -0.9, Z: 3.1 }, { X: -0.2, Z: 3.7 }, { X: 0.7, Z: 3.2 }, { X: 1.2, Z: 4.0 }, { X: -1.4, Z: 4.3 }];
shot("4a", "L04", -0.1, (u, x) => {
  const c = { x: 0.1, y: 0.3, z: 0.4 + u * 0.12, h0: 900 };
  return fscene(c, u, { mood: 0, split: 2.5, mid: HS.pebbles(c, [...pebs, ...HS.trail(5, 3.4, 8, 3)], u, { k: 2.4 }), shafts: 1 });
}, { vig: 0.9 });
shot("4b", "L04", () => wordAt(LINE.L04, "tonight") - 0.35, (u, x) => {
  const kx = -0.6 + u * 0.5, c = { x: kx + 0.2, y: 0.45, z: 0.9, h0: 1290 };
  const drop = ease(clamp(u / 1.0)), cr = Array.from({ length: 9 }, (_, i) => ({ X: -2.4 + i * 0.4, Z: 2.55 + (i % 3) * 0.1 })).filter((q) => q.X < kx - 0.25);
  const k = K(c, { X: kx, Z: 2.6, fx: 0.75, worry: 0.7, run: u * 1.1, reachL: 0.35 * drop, blink: bl(u) }, u, 1);
  return fscene(c, u, { split: 2.5, mid: HS.crumbs(c, cr, { k: 1.8 }), cast: lit(k.svg), light: k.light });
}, { vig: 0.9 });

// 5  L05 birds peck the crumbs, the crumbs vanish one by one (eaten 0 -> all)
shot("5", "L05", -0.12, (u, x) => {
  const c = { x: 0.2, y: 0.4, z: 0.5, h0: 930 }, tr5 = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ X: 0.35 + pathX5(i), Z: 2.5 + i * 0.5 }));
  const eaten = clamp((u - 0.25) / 1.4) * 7;
  const bird = (X, Z, d, ph) => HS.bird(P(c, X, 0, Z), { dir: d, peck: 0.5 + 0.5 * Math.sin(u * 15 + ph), k: 1.8 });
  const birds = bird(0.9, 3.2, -1, 0) + bird(-0.2, 3.7, 1, 2) + bird(0.3, 2.5, -1, 4) + bird(-0.8, 4.6, 1, 1) + HS.bird(P(c, 0.1, 1.9, 3.5), { fly: u * 3, k: 1.3, dir: 1 });
  return fscene(c, u, { split: 2.2, mid: HS.crumbs(c, tr5, { eaten, k: 2.0 }) + birds });
}, { vig: 0.9 });
const pathX5 = (i) => 0.2 * Math.sin(i * 1.3);

// 6  L06 Gretel close, scared, the empty path behind her
shot("6", "L06", -0.1, (u, x) => {
  const c = { x: 0.15, y: 0.95, z: 1.9 + u * 0.08, h0: 1050 };
  const g = HS.gretel(c, { X: 0.05, Z: 3.0, fx: 0.15, worry: 1, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.4), look: 0.5 + sw(u, 0.5, 0.4) }, u);
  return fscene(c, u, { split: 2.5, mid: HS.crumbs(c, [], {}), cast: lit(g.svg, { a: 0.5 }) });
}, { vig: 0.9 });

// 7  L07 midnight: moon shafts, a faint warm glow far between the trees, the camera drifts toward it
const GLOW = { X: 0.3, Z: 21 };
const glowFar = (c, t, k = 1) => { const p = P(c, GLOW.X, 1.2, GLOW.Z); return blobLight(p.x, p.y, 120 * k, "#ffb050", 0.22, 9) + blobLight(p.x, p.y, 40 * k, "#ffe0a0", 0.4, 12); };
shot("7", "L07", -0.1, (u, x) => {
  const c = { x: 0.1 + u * 0.03, y: 1.3, z: 0.2 + u * 0.6, h0: 1100 };
  return fscene(c, u, { shafts: 1.4, split: 3, light: glowFar(c, u, 1 + u * 0.1), house: { X: GLOW.X, Z: GLOW.Z, glow: 0.6 } });
}, { vig: 0.85 });

// 8  L08 Gretel sniffs and points toward the glow
shot("8", "L08", -0.1, (u, x) => {
  const c = { x: 0.2, y: 1.0, z: 1.6, h0: 1050 };
  const g = HS.gretel(c, { X: -0.2, Z: 3.1, fx: 0.55, sniff: 1, point: ease(clamp((u - 0.5) / 0.4)), worry: 0.3, talk: talkAt(x.ln, x.lu) * 0.5, blink: bl(u, 0.2) }, u);
  return fscene(c, u, { shafts: 1.2, split: 2.5, cast: lit(g.svg, { a: 0.5 }), light: glowFar(c, u, 1.4), house: { X: 1.2, Z: 14, glow: 0.7 } });
}, { vig: 0.9 });

// 9  L09-L10 two-shot: Gretel worried; the kid is already walking toward the glow; the flame shrinks on "hungry"
shot("9", "L09", -0.1, (u, x) => {
  const t0 = LINE.L10.at - LINE.L09.at + wordAt(LINE.L10, "hungry"), c = { x: 0.3, y: 1.0, z: 0.9 + u * 0.03, h0: 1050 }, kz = 3.3 + u * 0.55;
  const fl = tr([[0, 1], [t0 - 0.15 - 0.05, 1], [t0 + 0.35, 0.35]], u);
  const g = HS.gretel(c, { X: -0.35, Z: 3.2, fx: 0.4, worry: 1, talk: u < LINE.L09.off ? talkAt(x.ln, x.lu) : 0, blink: bl(u, 0.3) }, u);
  const k = K(c, { X: 0.7 + u * 0.1, Z: kz, fx: 0.75, run: u * 1.0, blink: bl(u + 1), talk: u > LINE.L10.at - LINE.L09.at ? talkAt(LINE.L10, u - (LINE.L10.at - LINE.L09.at)) : 0 }, u, fl);
  return fscene(c, u, { shafts: 1.2, split: 2.5, cast: lit(g.svg, { a: 0.5 }) + lit(k.svg, { a: 0.5 }), light: k.light + glowFar(c, u, 1.6), house: { X: 1.6, Z: 16, glow: 0.7 } });
}, { vig: 0.9 });

// 10  L11 walking shot toward the house through the trees, no stop (the 1812 line); the house grows ahead
const walkTo = (c, u, hz, kzOff = 2.9) => {
  const ph = u * 1.15, kx = c.x + 0.5, k = K(c, { X: kx, Z: c.z + kzOff, fx: 0.18, run: ph, blink: bl(u) }, u, 0.9);
  const g = HS.gretel(c, { X: kx - 0.7, Z: c.z + kzOff + 0.1, fx: 0.18, run: ph + 0.5, worry: 0.6, blink: bl(u + 1) }, u);
  return { k, g };
};
shot("10a", "L11", -0.1, (u, x) => {
  const c = { x: 0.0, y: 1.1, z: 0.0 + u * 1.9, h0: 1080 };
  const { k, g } = walkTo(c, u);
  return fscene(c, u, { shafts: 0.8, split: c.z + 4, cast: lit(k.svg, { a: 0.5 }) + lit(g.svg, { a: 0.5 }), house: { X: 0.15, Z: 17, glow: 1 }, clear: { X: 0.15, Z: 17, r: 3 }, light: k.light });
}, { vig: 0.85 });
shot("10b", "L11", () => wordAt(LINE.L11, "their") - 0.1, (u, x) => {
  const c = { x: -1.1 + u * 0.1, y: 0.8, z: 5.0 + u * 1.9, h0: 1000 };
  const { k, g } = walkTo({ ...c, x: c.x + 1.1 }, u, 17, 3.3);
  return fscene(c, u, { shafts: 0.8, split: c.z + 3.5, cast: lit(k.svg, { a: 0.5 }) + lit(g.svg, { a: 0.5 }), house: { X: 0.15, Z: 17, glow: 1 }, clear: { X: 0.15, Z: 17, r: 3 }, light: k.light });
}, { vig: 0.85 });

// 11  L12 the house reveal: one detail per phrase (walls, roof, windows), pushing in
const houseSc = (c, u, o = {}) => fscene(c, u, { shafts: 0.5, split: 2, clear: { X: 0, Z: o.hz ?? 6, r: 3.6 }, house: { X: 0, Z: o.hz ?? 6, glow: 1, door: 0, ...(o.h || {}) }, cast: o.cast || "", light: o.light || "" });
shot("11a", "L12", -0.15, (u) => houseSc({ x: 0.1, y: 1.3, z: 0.4 + u * 0.35, h0: 1150 }, u, { hz: 6 }), { vig: 0.85 });
shot("11b", "L12", () => wordAt(LINE.L12, "a") - 0.15, (u) => houseSc({ x: -0.2, y: 1.0, z: 1.6 + u * 0.3, h0: 1500 }, u, { hz: 6 }), { vig: 0.85 });
shot("11c", "L12", () => wordAt(LINE.L12, "windows") - 0.2, (u) => houseSc({ x: 0.9, y: 0.95, z: 2.6 + u * 0.3, h0: 1060 }, u, { hz: 6 }), { vig: 0.85 });

// 12  L13 the kid breaks off a piece (bite); the eyes open in the window behind him; the witch sings from inside
shot("12a", "L13", -0.2, (u, x) => {
  const c = { x: 1.7, y: 1.0, z: 1.8 + u * 0.12, h0: 1100 }, bite = ease(clamp((u - 0.7) / 0.5));
  const k = K(c, { X: 2.0, Z: 4.0, fx: -0.2, reachL: 1, blink: bl(u), worry: 0.3 }, u, 1);
  const hnd = HS.kidHand(c, { X: 2.0, Z: 4.0, reachL: 1 });
  const pc = HS.piece({ x: hnd.x, y: hnd.y, s: k.kd.p.s * 0.9 }, { rot: -14, k: 0.9 });
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: 0, Z: 5.2, r: 3.4 }, house: { X: 0, Z: 5.2, bite, eyes: clamp((u - 1.0) / 0.4), eyesWin: "R", eyeK: 1.4, look: 0.5 }, cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }) + (bite > 0.9 ? lit(pc, { a: 0.4, side: 1 }) : ""), light: k.light });
}, { vig: 0.85 });
shot("12b", "L13", () => wordAt(LINE.L13, "who") - 0.1, (u, x) => {
  const c = { x: 1.85, y: 1.0, z: 2.5 + u * 0.15, h0: 1050 };
  const hnd = HS.kidHand(c, { X: 2.0, Z: 4.0, fx: -0.2, talk: 0 });
  const k = K(c, { X: 2.0, Z: 4.0, fx: -0.2, talk: 0, shock: 0.2, worry: 0.2, blink: bl(u + 3), hand2face: 0 }, u, 1);
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: 0, Z: 5.2, r: 3.4 }, house: { X: 0, Z: 5.2, bite: 1, eyes: 1, eyesWin: "R", eyeK: 1.4, look: tr([[0, 0.5], [1.4, -0.3]], u) }, cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: k.light });
}, { vig: 0.85 });

// 13  L14 kid close, mouth full, frozen
shot("13", "L14", -0.15, (u, x) => {
  const c = { x: 1.9, y: 1.0, z: 2.6 + u * 0.1, h0: 1000 };
  const k = K(c, { X: 2.0, Z: 4.0, fx: -0.05, shock: 0.7, worry: 0.8, talk: talkAt(x.ln, x.lu) * 0.4, blink: 0 }, u, 1);
  return fscene(c, u, { shafts: 0.4, split: 3, clear: { X: 0, Z: 5.2, r: 3.4 }, house: { X: 0, Z: 5.2, bite: 1, eyes: 1, eyesWin: "R", eyeK: 1.4 }, cast: lit(k.svg, { a: 0.4, side: 1, rim: "#ffd08a" }), light: k.light });
}, { vig: 0.9 });

// 14  L15 the door opens, the witch sweet in the doorway, the light spills; the kids small in front
shot("14", "L15", -0.3, (u, x) => {
  const c = { x: 0.3, y: 1.15, z: 0.5 + u * 0.15, h0: 1100 }, hz = 5.6, door = ease(clamp(u / 0.8));
  const wi = HS.witch(c, { X: 0.1, Z: hz - 0.25, dir: 1, sweet: 1, bend: 0.5, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  const k = K(c, { X: 1.4, Z: 3.9, fx: -0.6, shock: 0.5, blink: bl(u + 2) }, u, 1), g = HS.gretel(c, { X: 0.85, Z: 3.6, fx: -0.5, worry: 1, blink: bl(u + 1) }, u);
  const mood = 0; HS.night(mood);
  const f = HS.forest(c, u, mood, { clear: { X: 0, Z: hz, r: 3.5 }, split: 2 }), h = HS.house(c, { X: 0, Z: hz, door, glow: 1, bite: 1 }, u);
  return f.back + h.svg + f.front + HS.grade(0, 1) + h.panes + (door > 0.4 ? HS.lit(wi.svg, { shade: "#8a6a5a", a: 0.6, rim: "#ffd08a", side: 1 }) : "") + lit(k.svg + g.svg, { a: 0.5, rim: "#ffc070" }) + h.spill + k.light;
}, { vig: 0.85 });

// 15  L16 the room at 3 a.m., dark: the kids asleep in the little beds
const BEDS = HS.ROOM.beds;
const bedHeads = (c, br) => { const a = P(c, BEDS[0].X, 0.62, 6.0), b = P(c, BEDS[1].X, 0.62, 6.0); return sleeper(a, a.s, "R", br) + sleeper(b, b.s, "K", br); };
shot("15", "L16", -0.1, (u, x) => {
  const c = { x: 0.2 + u * 0.05, y: 1.35, z: 0.3 + u * 0.15, h0: 1150 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.15 } });
  return r.back + bedHeads(c, sw(u, 0.35, 1)) + r.light + dk(0.5);
}, { vig: 0.95 });

// 16  L17 the witch's face close: red eyes, milky pupils, the nose sniffing over the sleeping kid. Scariest
const witchLit = (wi, o = {}) => HS.lit(wi.svg, { shade: "#6a4a50", a: 0.6, rim: "#ff5a3a", rimA: 0.55, side: 1, ...o }) + wi.light;
shot("16a", "L17", -0.1, (u, x) => {
  const c = { x: 0.7, y: 1.5, z: 2.6 + u * 0.08, h0: 1150 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 0.2, Z: 3.7, dir: 1, sweet: 0, bend: 0.5, sniff: 0.4 + 0.4 * Math.sin(u * 3), eyeGlow: 1, blink: 0 }, u);
  return r.back + r.light + dk(0.5) + witchLit(wi);
}, { vig: 0.95 });
shot("16b", "L17", () => wordAt(LINE.L17, "they") - 0.1, (u, x) => {
  const c = { x: 1.15, y: 1.3, z: 1.6 + u * 0.1, h0: 1100 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 1.0, Z: 4.0, dir: 1, sweet: 0, bend: 0.8, sniff: 1, reach: 0.4, eyeGlow: 1, blink: 0 }, u);
  return r.back + bedHeads(c, sw(u, 0.35)) + r.light + dk(0.45) + witchLit(wi);
}, { vig: 0.95 });
shot("16c", "L17", () => wordAt(LINE.L17, "but") - 0.1, (u, x) => {
  const c = { x: 1.4, y: 1.1, z: 2.3 + u * 0.12, h0: 1000 }, r = HS.room(c, u, { lamp: 0, dark: 0.9, oven: { fire: 0.2 } });
  const wi = HS.witch(c, { X: 1.45, Z: 4.5, dir: -1, sweet: 0, bend: 1, sniff: 1, eyeGlow: 1, blink: 0 }, u);
  return r.back + bedHeads(c, sw(u, 0.35)) + r.light + dk(0.45) + witchLit(wi);
}, { vig: 0.95 });

// 17  L18 the witch grabs the kid and drags him to the stable cage; the cage rattles
shot("17a", "L18", -0.1, (u, x) => {
  const c = { x: 0.9, y: 1.3, z: 1.2, h0: 1100 }, r = HS.room(c, u, { lamp: 0, dark: 0.85, oven: { fire: 0.3 } });
  const gr = ease(clamp(u / 0.4));
  const wi = HS.witch(c, { X: 1.0, Z: 4.4, dir: 1, sweet: 0, bend: 1, reach: gr, reachX: 30, reachY: -50, eyeGlow: 1 }, u);
  const k = L.kid(c, { X: 1.65, Z: 4.7, fx: -0.5, shock: 1, worry: 1, lean: -6 * gr }, u);
  return r.back + BEDS.map((b, i) => i == 0 ? sleeper(P(c, b.X, 0.62, 6), P(c, b.X, 0.62, 6).s, "R") : "").join("") + r.light + HS.lit(k.svg, { shade: "#5a4a5a", a: 0.6, rim: "#ff5a3a", rimA: 0.5, side: 1 }) + witchLit(wi);
}, { vig: 0.95 });
shot("17b", "L18", () => wordAt(LINE.L18, "she") - 0.2, (u, x) => {
  const c = { x: 0.0, y: 1.1, z: 0.4 + u * 0.12, h0: 1080 }, sb = HS.stable(c, u, {}), cg = HS.cage(c, { X: 0.7, Z: 3.9, door: ease(clamp((u - 0.4) / 0.5)) });
  const wx = lerp(-1.0, 0.0, ease(clamp(u / 1.3)));
  const wi = HS.witch(c, { X: wx, Z: 3.8, dir: 1, sweet: 0, bend: 0.6, reach: 1, reachX: 40, reachY: -60, eyeGlow: 0.9 }, u);
  const k = L.kid(c, { X: wx + 0.75, Z: 3.9, fx: -0.6, shock: 1, worry: 1, lean: -10 }, u);
  return sb.back + cg.back + cg.front + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.55, rim: "#9ac0ff", side: -1 }) + witchLit(wi, { shade: "#6a5a64" });
}, { vig: 0.95 });

// 18  L19 close: the bars, the bony hand reaching in. 2D close-up
const closeUp = (u, o = {}) => {
  const cb = HS.closeBars(u, {}), z = o.zoom ?? 1, cx = 540, cy = 960;
  const hd = HS.bonyHand({ x: o.hx ?? 190, y: o.hy ?? 1010, s: 9, rot: o.hrot ?? -5, pinch: o.pinch ?? 1, feel: o.feel }), kf = o.fist === false ? "" : HS.kidFist({ x: o.kx ?? 985, y: o.ky ?? 1085, s: 9, rot: 3 }).svg;
  const eyes = o.eyes === false ? "" : HS.redEyes(o.ex ?? 250, o.ey ?? 800, o.ek ?? 34, { look: o.look ?? 0.5, glow: 1 });
  return `<g transform="translate(${cx},${cy}) scale(${z.toFixed(4)}) translate(${-cx},${-cy})">${cb.back}<rect width="${W}" height="${H}" fill="#3a2a4a" opacity="0.35"/>${eyes}${cb.bars}${kf}${hd.svg}</g>`;
};
shot("18", "L19", -0.1, (u, x) => closeUp(u, { fist: false, hx: lerp(-120, 330, ease(clamp(u / 0.9))), pinch: 0, zoom: 1 + u * 0.03, look: 0.2 }), { vig: 0.9 });
// 19  L20 close: the kid's fist holds out the bone, the hand feels it
shot("19a", "L20", -0.1, (u, x) => closeUp(u, { fist: true, kx: lerp(1150, 985, ease(clamp(u / 0.5))), hx: 290, pinch: 1, feel: u * 1.6, zoom: 1 + u * 0.035 }), { vig: 0.9 });
shot("19b", "L20", () => wordAt(LINE.L20, "her") - 0.1, (u, x) => closeUp(u, { fist: true, kx: 985, hx: 290, pinch: 1, feel: u * 1.2 + 3, zoom: 1.12 + u * 0.05, ek: 40, look: tr([[0, 0.5], [1.4, -0.4]], u) }), { vig: 0.9 });

// 20  L21 the witch close, annoyed
shot("20", "L21", -0.1, (u, x) => {
  const c = { x: 0.7, y: 1.5, z: 2.4 + u * 0.08, h0: 1160 }, sb = HS.stable(c, u, {});
  const wi = HS.witch(c, { X: 0.4, Z: 3.7, dir: 1, sweet: 0, bend: 0.3, talk: talkAt(x.ln, x.lu), eyeGlow: 1, blink: bl(u, 0.5) }, u);
  return sb.back + sb.light + witchLit(wi);
}, { vig: 0.95 });

// 21  L22 wide stable, the kid in the cage, the candle jar nearly out (re-hook)
shot("21", "L22", -0.1, (u, x) => {
  const c = { x: 0.1, y: 1.3, z: 0.7 + u * 0.1, h0: 1120 }, sb = HS.stable(c, u, {}), cg = HS.cage(c, { X: 0.45, Z: 3.9 });
  const k = K(c, { X: 0.5, Z: 4.4, fx: -0.3, worry: 1, blink: bl(u, 0.7), lean: sw(u, 0.4, 1) }, u, tr([[0, 0.3], [4, 0.12]], u));
  return sb.back + cg.back + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.5, rim: "#ffc070", side: 1 }) + HS.lit(cg.front, { shade: "#6a6a88", a: 0.5, rimA: 0 }) + k.light;
}, { vig: 0.95 });

// 22  L23 the witch points at Gretel; the oven roars, the red light floods
const s22 = (u, x, pointing, k0 = 0) => {
  const f = ease(clamp((u + k0 - (wordAt(LINE.L23, "oven") - 0.2)) / 0.5));
  const c = { x: 0.3, y: 1.2, z: 1.0 + (u + k0) * 0.1, h0: 1010 }, r = HS.room(c, u, { lamp: lerp(0.15, 0.25, f), red: lerp(0.15, 0.75, f), oven: { door: ease(clamp((u + k0 - 0.5) / 1.0)), fire: lerp(0.3, 1, f) }, dawn: 0.2 * f });
  const wi = HS.witch(c, { X: -0.2, Z: 3.5, dir: 1, sweet: 0, bend: 0.4, reach: pointing, reachX: 70, reachY: -84, talk: talkAt(x.ln, x.lu), eyeGlow: 1, blink: bl(u) }, u);
  const g = HS.gretel(c, { X: 0.55, Z: 3.3, fx: -0.6, small: 0.6, worry: 1, blink: bl(u) }, u);
  return r.back + r.light + dk(0.5 * (1 - f)) + HS.lit(wi.svg, { shade: "#b0523a", a: 0.7, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.65, rim: "#ff9a3a", side: -1 });
};
shot("22a", "L23", -0.1, (u, x) => s22(u, x, 0.0), { vig: 0.9 });
shot("22b", "L23", () => wordAt(LINE.L23, "girl") - 0.12, (u, x) => { const k0 = wordAt(LINE.L23, "girl") - 0.12 + 0.1; return s22(u, x, ease(clamp(u / 0.35)), k0); }, { vig: 0.9 });

// 23  L24 the witch at the oven mouth, the door open, sweet again
const ovenCam = { x: -0.75, y: 1.2, z: 1.3 };
shot("23", "L24", -0.1, (u, x) => {
  const c = { ...ovenCam, z: 1.3 + u * 0.08 }, r = HS.room(c, u, { lamp: 0.25, red: 0.75, oven: { door: 1, fire: 1 }, dawn: 0.6 }), sp = r.oven.spot;
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 1, lean: 0.35 + 0.1 * Math.sin(u * 2), bend: 0.2, talk: talkAt(x.ln, x.lu), eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + 0.85, Z: sp.Z - 0.05, fx: -0.7, small: 1, blink: bl(u) }, u);
  return r.back + r.light + HS.lit(wi.svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });

// 24  L25 Gretel close, small and sweet; her eyes say she is pretending
shot("24", "L25", -0.1, (u, x) => {
  const c = { x: 0.1, y: 0.95, z: 1.4 + u * 0.1, h0: 1000 }, r = HS.room(c, u, { lamp: 0.25, red: 0.75, oven: { door: 1, fire: 1 }, dawn: 0.6 });
  const g = HS.gretel(c, { X: 0.2, Z: 3.1, fx: -0.15, small: 1, worry: 0.2, talk: talkAt(x.ln, x.lu), look: tr([[0, -0.6], [0.9, -0.7], [1.3, 0.2]], u), grin: u > 1.4 ? 1 : 0, blink: bl(u, 0.9) }, u);
  return r.back + r.light + HS.lit(g.svg, { shade: "#b0523a", a: 0.65, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });

// 25  (no line) the witch leans into the oven, Gretel SHOVES, the iron door slams. Fast cuts; the music is out from the shove to one beat after the slam
const OV25 = { x: -0.75, y: 1.2, z: 1.3 };
const ovenRoom = (c, u, o = {}) => HS.room(c, u, { lamp: 0.2, red: 0.8, oven: { door: o.door ?? 1, fire: 1 }, dawn: 0.6 });
shot("25a", "L25", () => LINE.L25.off + 0.1, (u) => {
  const c = { ...OV25, z: 1.3 + u * 0.1 }, r = ovenRoom(c, u), sp = r.oven.spot;
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: lerp(0.4, 1, ease(clamp(u / 0.5))), bend: 0.3, eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + 0.85, Z: sp.Z - 0.05, fx: -0.7, small: 1, blink: 0 }, u);
  return r.back + r.light + HS.lit(wi.svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });
shot("25b", "L25", () => LINE.L25.off + 0.1 + 0.62, (u) => {
  const sh = ease(clamp(u / 0.18)), c = { x: -0.2, y: 1.0, z: 1.8 }, r = ovenRoom(c, u), sp = r.oven.spot;
  const wi = HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: 0.7, shoved: sh, bend: 0.3, eyeGlow: 0.6 }, u);
  const g = HS.gretel(c, { X: sp.X + lerp(0.85, 0.5, sh), Z: sp.Z - 0.05, fx: -0.7, small: 1 - sh, shove: sh }, u);
  return r.back + r.light + HS.lit(wi.svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });
shot("25c", "L25", () => LINE.L25.off + 0.1 + 0.62 + 0.42, (u) => {
  const c = { x: -0.5, y: 1.1, z: 1.4 }, door = 1 - ease(clamp(u / 0.12)), r = ovenRoom(c, u, { door });
  const sp = r.oven.spot, g = HS.gretel(c, { X: sp.X + 0.7, Z: sp.Z - 0.05, fx: -0.7, shove: 1 - clamp(u / 0.3), worry: 0.2, grin: 1 }, u);
  return r.back + r.light + HS.lit(g.svg, { shade: "#b0523a", a: 0.7, rim: "#ff9a3a", side: -1 });
}, { vig: 0.9 });

// 26  L26 Gretel unlocks the cage, the kid steps out
shot("26a", "L26", -0.1, (u, x) => {
  const c = { x: 0.1, y: 1.1, z: 0.0 + u * 0.1, h0: 1080 }, sb = HS.stable(c, u, { dawn: 0.5, dark: 0.6 });
  const door = ease(clamp((u - 0.9) / 0.6)), cg = HS.cage(c, { X: 0.55, Z: 3.9, door });
  const g = HS.gretel(c, { X: -0.5, Z: 3.7, fx: 0.7, worry: 0.2, blink: bl(u, 0.3), point: 0, shove: 0 }, u);
  const k = K(c, { X: lerp(0.55, 0.0, ease(clamp((u - 1.3) / 0.9))), Z: 4.4, fx: -0.2, worry: lerp(1, 0.1, door), blink: bl(u) }, u, 0.25);
  return sb.back + cg.back + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.45, rim: "#ffc070", side: 1 }) + HS.lit(cg.front, { shade: "#6a6a88", a: 0.5, rimA: 0 }) + HS.lit(g.svg, { shade: "#6a6a88", a: 0.45, rim: "#9ac0ff", side: -1 }) + k.light;
}, { vig: 0.9 });
shot("26b", "L26", () => wordAt(LINE.L26, "gretel") - 0.2, (u, x) => {
  const c = { x: 0.1, y: 1.05, z: 0.4 + u * 0.1, h0: 1060 }, sb = HS.stable(c, u, { dawn: 0.6, dark: 0.5 }), cg = HS.cage(c, { X: 0.9, Z: 4.2, door: 1 });
  const g = HS.gretel(c, { X: -0.2, Z: 3.7, fx: 0.4, grin: 1, blink: bl(u, 0.5) }, u);
  const k = K(c, { X: 0.45, Z: 3.7, fx: -0.25, grin: 1, blink: bl(u, 1.1) }, u, 0.9);
  return sb.back + cg.back + cg.front + sb.light + HS.lit(k.svg, { shade: "#6a6a88", a: 0.4, rim: "#ffc070", side: 1 }) + HS.lit(g.svg, { shade: "#6a6a88", a: 0.4, rim: "#9ac0ff", side: -1 }) + k.light;
}, { vig: 0.9 });

// 27  L27 dawn forest: they run holding hands (the pearls rattle)
const runPair = (c, u, X, Z, ph, o = {}) => {
  const kst = { X: X + 0.45, Z, run: ph, fx: 0.7, grin: 1, blink: bl(u) }, k = K(c, kst, u, 0.2);
  const g = HS.gretel(c, { X: X - 0.3, Z: Z + 0.05, run: ph + 0.5, fx: 0.7, grin: 1, holdTo: HS.kidHand(c, kst) }, u);
  return { k, g };
};
shot("27a", "L27", -0.1, (u) => {
  const c = { x: -1.0 + u * 2.0, y: 1.2, z: 0, h0: 1130 }, ph = u * 2.2, { k, g } = runPair(c, u, -0.9 + u * 2.0 + 0.9, 4.2, ph);
  return fscene(c, u, { mood: 1, split: 3, water: HS.water(c, u, { z0: 6.2, z1: 13 }), cast: g.svg + k.svg, mid: HS.duck(P(c, 2.2, 0, 8.4), { k: 1.8 }, u) });
}, { vig: 0.5 });
shot("27b", "L27", () => wordAt(LINE.L27, "pockets") - 0.25, (u) => {
  const c = { x: 0.5 + u * 1.7, y: 0.85, z: 0, h0: 1000 }, ph = u * 2.4, { k, g } = runPair(c, u, 0.0 + u * 1.7 + 0.2, 2.8, ph);
  return fscene(c, u, { mood: 1, split: 3, cast: g.svg + k.svg, mid: HS.pearls(P(c, 3.4, 0, 3.6), { k: 1.5 }) });
}, { vig: 0.5 });

// 28  L28 the kid stops, sniffs; a crumb of sugar window in his hand (a flute and a smile)
shot("28", "L28", -0.1, (u, x) => {
  const c = { x: 0.1, y: 0.95, z: 1.6 + u * 0.08, h0: 1090 }, kst = { X: 0.15, Z: 3.2, fx: 0.35, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.6), worry: 0 };
  const k = K(c, { ...kst, reachL: 0.9 }, u, 0.2), hnd = HS.kidHand(c, { ...kst, reachL: 0.9 });
  const pc = HS.piece({ x: hnd.x - 6, y: hnd.y - 14, s: k.kd.p.s * 0.9 }, { rot: -14, k: 0.55 });
  return fscene(c, u, { mood: 1, split: 3, cast: k.svg + pc });
}, { vig: 0.5 });
// 29  L29 Gretel close, deadpan
shot("29", "L29", -0.1, (u, x) => {
  const c = { x: 0.0, y: 0.95, z: 1.8 + u * 0.06, h0: 1040 };
  const g = HS.gretel(c, { X: 0.0, Z: 3.3, fx: 0.0, worry: 0, talk: talkAt(x.ln, x.lu), blink: bl(u, 2.0), look: 0 }, u);
  return fscene(c, u, { mood: 1, split: 3, cast: g.svg });
}, { vig: 0.5 });
// 30  L30 the kid turns around, chewing, cheeks full; cut right after "turning"
shot("30", "L30", -0.15, (u, x) => {
  const c = { x: 0.0, y: 0.95, z: 1.8 + u * 0.05, h0: 1100 }, turn = ease(clamp((u - 0.15) / 0.8));
  const chew = clamp(Math.abs(Math.sin(u * 14)) * 0.5) * (u > 0.9 ? 0.2 : 1), k = K(c, { X: 0.0, Z: 3.3, fx: lerp(0.7, -0.7, turn), talk: Math.max(chew, talkAt(x.ln, x.lu)), grin: 0, worry: 0.3 * turn, blink: bl(u, 0.7) }, u, 0.2);
  return fscene(c, u, { mood: 1, split: 3, cast: k.svg });
}, { vig: 0.5 });

// ---------------------------------------------------------------- the glimpse (re-hook): the open oven in red fire light, blurred and dark, then hard back
const GLIMPSES = [{ at: 2.4, frames: 6, blur: "gb", dark: 0.5, witch: false }, { shot: "17b", frames: 12, blur: "gb2", dark: 0.22, witch: true }];   // 2nd: ~40 s, "She smelled him first" (the director's ~40 s falls on L17/L18 in this cut)
function glimpse(t, g) {
  const u = (t - g.at) * FPS, k = u / g.frames, c = { x: -0.75, y: 1.2, z: 1.3 + u * 0.01 };
  const r = HS.room(c, t, { lamp: 0.1, red: 0.9, oven: { door: 1, fire: 1 }, dawn: 0.2 }), sp = r.oven.spot;
  const wi = g.witch ? HS.lit(HS.witch(c, { ...sp, dir: -1, sweet: 0, lean: 1, bend: 0.3, eyeGlow: 0.6 }, t).svg, { shade: "#b0523a", a: 0.75, rim: "#ffb040", side: -1, w: 6 }) : "";
  return `<g filter="url(#${g.blur})">${r.back + r.light + wi}</g><rect width="${W}" height="${H}" fill="#02030a" opacity="${(g.dark + 0.15 * Math.sin(k * Math.PI)).toFixed(2)}"/>`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) {
  const ln = LINE[s.line], o = typeof s.off === "function" ? s.off() : s.off;
  s.at = Math.max(0, ln.at + o);
}
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
export const TIMELINE = SHOTS;
for (const g of GLIMPSES) if (g.shot) g.at = SHOTS.find((q) => q.id === g.shot).at;
export const BANNER_END = Math.min(3.0, SHOTS.find((s) => s.id === "2").at - 0.02);   // the lib default (0-3 s): gone before the first cut after 2.6 s
const slamShot = SHOTS.find((s) => s.id === "25c"), shoveShot = SHOTS.find((s) => s.id === "25b");
CUE.shove = shoveShot.at + 0.1; CUE.slam = slamShot.at + 0.05;
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
