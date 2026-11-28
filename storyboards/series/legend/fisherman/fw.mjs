// Legend: The Fisherman and his Wife (Grimm KHM 19), code-drawn DRAFT 1 (director's list: SHOTS.md, lines: lines.json).
//   node storyboards/series/legend/fisherman/fw-render.mjs <out-subs.mp4> <out-nosubs.mp4> [--from s --to s]   (both exports in one pass)
//   TITLE=A|B|C selects the opening banner (default A); only frames 0..~105 depend on it.
// Built like cried-wolf/cw.mjs: voice-led. Every line starts when the previous line's last sound has ended (+ a gap); a shot of
// a line never starts before the previous line is over (no voice is cut off, no two voices overlap).
import { readFileSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as BAL from "../../../../tools/svg2d/lib/legend-baltic.mjs";
import { titleCard } from "../../../../tools/svg2d/lib/legend-baltic-title.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, ease, blinkAmt, n, hash, INK } = L;

export const W = 1080, H = 1920, FPS = 30;
export const TITLE = process.env.TITLE || "A";
const VO = "out/legend-fisher/vo", SPEC = JSON.parse(readFileSync("storyboards/series/legend/fisherman/lines.json", "utf8"));
const KEY = /black|one|once|grey|blue|king|sun|towers|gone|pot/i;
// subtitle phrases (| splits): short enough that a 2-row caption stays at a readable size
const CAP = {
  L03: "Six hours earlier,|the Baltic was green.|And the fish he caught|could talk.", L04: "Let me go.|I'm not a fish.|I'm a prince.",
  L05: "Wish once.|Then throw it back.", L06: "One wish.|A real house for Grandma.", L07: "The hut became a cottage.|And the sea turned grey.",
  L09: "In the Grimms' 1812 version,|the couple lived in a pot.", L10: "Flounder, flounder, in the sea!|I want a castle!",
  L11: "Dark blue. Thick.|And it started to smell.", L12: "I've seen the sea|this colour once before.", L14: "Make me king|of the whole coast!", L16: "One more,|and I can't give it back.",
  L18: "Just one more.|Make the sun come up when I say!", L19: "The waves stood up|like church towers.", L21: "Castle.|Crown.|Cottage.|Gone.|Just the old hut.|And a green sea.", L23: "Child...|why do you think I live in a pot?",
};
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- voice: lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1))) };
}
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VO}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = []; let last = 0;
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; const r = Math.sqrt(a / hop); env.push(r); if (r > 0.004) last = (i + hop) / sr; }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = align(ln.text.split(/\s+/), JSON.parse(readFileSync(`${VO}/${ln.id}.words.json`, "utf8")));
  ln.phrases = phrases(ln.words, ln.text, CAP[ln.id]);
  ln.len = Math.max(last, ln.words[ln.words.length - 1][2]);   // the last sound, or the last word as Whisper heard it
}
const nw = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, "");
const wordAt = (ln, w) => { const x = ln.words.find((q) => nw(q[0]) === w) || ln.words.find((q) => nw(q[0]).startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };

// order and the breath between lines (seconds after the previous line's last sound): 0.15-0.35 inside a scene, 0.4-0.6 on a scene change
export const ORDER = SPEC.lines.map((l) => l[0]);
const GAP = { L02: 0.2, L03: 0.35, L04: 0.25, L05: 0.3, L06: 0.3, L07: 0.45, L08: 0.3, L09: 0.35, L10: 0.3, L11: 0.3, L12: 0.35, L13: 0.3, L14: 0.2, L15: 0.35, L16: 0.62, L17: 0.35, L18: 0.3, L19: 0.35, L20: 0.3, L21: 0.5, L22: 0.5, L23: 0.3 };
{ let prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? prev.end + GAP[id] : 0; ln.end = ln.at + ln.len; prev = ln; } }
for (let i = 1; i < ORDER.length; i++) if (LINE[ORDER[i]].at < LINE[ORDER[i - 1]].end) throw new Error("voices overlap at " + ORDER[i]);
export const DUR = +(LINE.L23.at + LINE.L23.len + 0.05).toFixed(2);   // hard cut on "pot": the picture and the sound end together, right after the word's last sound
export const TL_LINES = ORDER.map((id) => LINE[id]);
const prevEnd = (id) => { const i = ORDER.indexOf(id); return i ? LINE[ORDER[i - 1]].end : 0; };
const LN = (id) => LINE[id], WD = (id, w) => LINE[id].at + wordAt(LINE[id], w);

// ---------------------------------------------------------------- faces: every drawn face registers a circle, captions keep clear of them
let FACES = [];
const face = (x, y, r) => { FACES.push({ x, y, r }); };
const B = BAL.BALTIC, CAM = B.cam;
const kidAt = (c, st, t) => { const kd = L.kid(c, st, t); if (kd.p) face(kd.p.x + (st.fx ?? -0.8) * 0.02 * kd.p.s, kd.p.y - 1.1 * kd.p.s, 0.17 * kd.p.s); return kd; };
const keepAt = (c, st, t) => { const g = L.keeper(c, st, t); if (g.p) face(g.p.x + (st.fx ?? -0.7) * 0.02 * g.p.s, g.p.y - 1.3 * g.p.s, 0.2 * g.p.s); return g; };
// the flounder's head (local x -38, y -4 on a 100-long fish) in screen space
const fishHead = (x, y, len, rot, flip) => { const a = rot * Math.PI / 180, k = len / 100, lx = -38 * k * (flip ? -1 : 1), ly = -4 * k; return { x: x + lx * Math.cos(a) - ly * Math.sin(a), y: y + lx * Math.sin(a) + ly * Math.cos(a) }; };
const regFish = (x, y, len, rot, flip) => { const h = fishHead(x, y, len, rot, flip); face(h.x, h.y, 0.17 * len); };

// ---------------------------------------------------------------- building blocks
const frame = (inner, flat) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${BAL.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter><filter id="gb3" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3.5"/></filter>${inner}${flat ? "" : BAL.vignette()}`;
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? 0);
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const E = (u0, u1, u) => ease(clamp((u - u0) / Math.max(1e-6, u1 - u0)));
// grey-and-slate for the first count (Sol R1 B11): the sea drains to slate, the sky keeps its grade
const SLATE = { sea0: "#46525e", sea1: "#5a6a78", sea2: "#7a8c9a", sea3: "#a0b0bc" };
function slate(m) { const k = m <= 1 ? m : clamp(2 - m); if (k < 0.01) return; for (const q in SLATE) BAL.M[q] = L.mix(BAL.M[q], SLATE[q], 0.85 * k); }
// the whole set, like BAL.coast() but with a size for the home (the "pop away" in shot 21), `under` (drawn behind the jetty: the flounder's foam never crosses the deck) and noJetty
function coast2(c, t, m, o = {}) {
  BAL.mood(m); slate(m);
  const hm = BAL.home(c, { stage: o.stage || 0, light: o.light, smoke: o.smoke, size: o.size, alpha: o.alpha }, t), jt = BAL.jetty(c, t);
  const st = clamp(m - 3), tw = o.towers ?? st, r = o.rain ?? st;
  const back = BAL.sky(c, t, o) + BAL.sea(c, t, o) + BAL.towers(c, t, { amt: tw }) + BAL.shore(c, t, o) + (o.noHome ? "" : hm.svg) + (o.drift === false ? "" : BAL.driftwood(c, { ...B.drift, rot: -4, seed: 3 })) + (o.under || "") + (o.noJetty ? "" : jt.svg);
  return { back, front: BAL.near(c, t) + (r > 0.02 ? BAL.rain(t, r) : ""), home: hm };
}
const compose = (s, cast, post = "") => s.back + cast + BAL.grade() + post + s.front;
const FLAT = (svg) => "<!--flat-->" + svg;
const flick = (u, times, dur = 0.5) => Math.max(0, ...times.map((b) => (u > b && u < b + dur ? (u < b + 0.08 ? 1 : 0.5 + 0.5 * Math.sin((u - b) * 40)) * (1 - (u - b) / dur) : 0)));
const jettyKid = (c, t, st) => kidAt(BAL.deckCam(c), { ...B.kid, fx: -0.7, reachL: 1, ...st }, t);
const rodOf = (kd, o = {}) => BAL.rod(BAL.kidHand(kd, o.reachL ?? 1), kd.p.s / 100, { ang: -44, len: 138, line: 40, ...o });
const keeperAt = (c, X, Z, t, o = {}) => keepAt(c, { X, Z, fx: 0.55, stern: 0.8, flame: 1, open: 1, ...o }, t);

// the gold crown on the kid's head: seeded at the palace reveal, stays until the word "Crown" (Sol R1 B24). a = size 0..1
const crownOn = (kd, a) => {
  if (!kd.p || a < 0.02) return "";
  const s = kd.p.s, k = s * 0.0092 * a;
  return `<g transform="translate(${n(kd.p.x - 0.03 * s)},${n(kd.p.y - 1.27 * s - (1 - a) * 0.3 * s)}) scale(${n(k * 100) / 100}) rotate(-6)"><path d="M-14,0 L-17,-14 L-8,-6 L0,-18 L8,-6 L17,-14 L14,0 Z" fill="#ffd838" stroke="#7a4a00" stroke-width="1.6" stroke-linejoin="round"/><path d="M-14,0 Q0,3 14,0" stroke="#c8861c" stroke-width="1.6" fill="none"/><circle cx="0" cy="-19" r="1.8" fill="#fff3a0"/><circle cx="-17" cy="-15" r="1.5" fill="#fff3a0"/><circle cx="17" cy="-15" r="1.5" fill="#fff3a0"/></g>`;
};
// one path through the scene for the kid: points [t, X, Z]; returns { X, Z, run } with the walk cycle tied to the distance walked
const walkPath = (pts, t) => {
  if (t <= pts[0][0]) return { X: pts[0][1], Z: pts[0][2], run: null };
  let dist = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], seg = Math.hypot(b[1] - a[1], b[2] - a[2]);
    if (t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return { X: lerp(a[1], b[1], u), Z: lerp(a[2], b[2], u), run: ((dist + seg * u) / 1.1) % 1 }; }
    dist += seg;
  }
  const e = pts[pts.length - 1]; return { X: e[1], Z: e[2], run: null };
};
// a raised arm for Grandma's rule finger: from the sleeve, the forearm up, one short finger. up 0 = at rest
function raisedArm(g, up) {
  const p = g.p, k = p.s / 100, sh = L.toScreen(p, 0, -14, -94), el = (a, b) => ({ x: lerp(a[0], b[0], up), y: lerp(a[1], b[1], up) });
  const e = el([-20, -78], [-40, -88]), h = el([-18, -68], [-36, -114]), E2 = L.toScreen(p, 0, e.x, e.y), H = L.toScreen(p, 0, h.x, h.y);
  const d = `M${n(sh.x)},${n(sh.y)} Q${n(E2.x)},${n(E2.y)} ${n(H.x)},${n(H.y)}`;
  const fin = up > 0.3 ? `<path d="M${n(H.x)},${n(H.y - 3 * k)} l${n(-0.5 * k)},${n(-9 * k * up)}" stroke="${INK}" stroke-width="${n(4.6 * k)}" stroke-linecap="round"/><path d="M${n(H.x)},${n(H.y - 3 * k)} l${n(-0.5 * k)},${n(-9 * k * up)}" stroke="#e6bf9e" stroke-width="${n(3 * k)}" stroke-linecap="round"/>` : "";
  return `<path d="${d}" stroke="${INK}" stroke-width="${n(12.2 * k)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#2b2f6b" stroke-width="${n(11 * k)}" stroke-linecap="round" fill="none"/><circle cx="${n(H.x)}" cy="${n(H.y)}" r="${n(4.6 * k)}" fill="#e6bf9e" stroke="${INK}" stroke-width="${n(0.8 * k)}"/>${fin}`;
}
// ---------------------------------------------------------------- the shots (draft 2: Sol round 1 applied, see SOL-R1.md)
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });
const W2 = () => LN("L10").at + LN("L10").words[1][1];          // the second "Flounder!"
const KIDJ = { X: 1.62, Z: 11.3 };                                 // the kid on the jetty, close cameras

// 1  FRAME 0: the eye (the flounder's colours and red spots round it) is closed at frame 0, opens on the next frame, slow push-in; cut on "black?"
shot("1", "L01", () => 0, (u) => {
  BAL.mood(4);
  return FLAT(BAL.eyeShot(u, { open: u <= 0 ? 0 : clamp(0.25 + 0.75 * E(0, 0.5, u)), r: lerp(268, 330, u / 2.0), cx: 540, cy: 1290, look: [0.15 * Math.sin(u * 1.3), -0.1] }));
});
// 1b  the kid NEARER, on the jetty in front of the curling black water, the tower waves behind (Sol A4/B2/B3)
shot("1b", "L01", () => WD("L01", "black") - 0.02, (u, x) => {
  const c = { x: 1.3, y: 1.5, z: lerp(8.0, 8.5, u / 1.5), h0: 1010 }, s = coast2(c, x.t, 4, { light: 0.5, bolt: flick(u, [0.25]), boltX: 860, towers: 1, rain: 1 });
  const kd = kidAt(BAL.deckCam(c), { ...KIDJ, fx: -0.5, shock: 1, reachL: 0.3, lean: 5 + 2 * Math.sin(u * 5), talk: talkAt(x.ln, x.lu), blink: 0 }, x.t);
  return s.back + BAL.grade() + kd.svg + s.front;
});
// 2  Grandma close at the hut door, the lamp swinging, the candle jar nearly out
shot("2", "L02", () => LN("L02").at - 0.1, (u, x) => {
  const c = { x: -0.95, y: 1.0, z: lerp(3.0, 3.35, u / 3), h0: 1010 }, s = coast2(c, x.t, 4, { light: 1, bolt: flick(u, [0.9]), boltX: 300, towers: 1, rain: 1 });
  const g = keeperAt(c, -0.5, 5.75, x.t, { fx: 0.6, stern: 1, flame: 0.12 + 0.03 * Math.sin(u * 17), talk: talkAt(x.ln, x.lu), blink: bl(u) });
  const sw = 2.2 * Math.sin(u * 2.9), pv = L.P(c, -0.5, 0, 5.75);
  return compose(s, "", `<g transform="rotate(${n(sw)} ${n(pv.x)} ${n(pv.y)})">${g.svg}${g.arm}</g>`);
});
// 3  6 p.m.: wide shore, evening sun, the kid fishing on the jetty (the blurred flash is gone); the cut to the bending rod comes on "And the fish" (Sol A6)
shot("3", "L03", () => LN("L03").at - 0.02, (u, x) => {
  const c = { x: 0, y: 3.0, z: lerp(0.6, 1.5, u / 3.0), h0: 760 }, s = coast2(c, x.t, 0, { light: 0 });
  const kd = jettyKid(c, x.t, { reachL: 1, blink: bl(u) }), r = rodOf(kd, { ang: -50, line: 70, swing: 3 * Math.sin(u * 1.4) });
  const g = keeperAt(c, B.keeper.X, B.keeper.Z, x.t, { stern: 0.3, blink: bl(u, 0.3) });
  return compose(s, r.svg + kd.svg + g.svg + g.arm);
});
shot("3b", "L03", () => WD("L03", "fish") - 0.3, (u, x) => {
  const c = { x: 1.2, y: 1.5, z: lerp(8.0, 8.5, u / 2), h0: 1010 }, s = coast2(c, x.t, 0, { sun: [200, 940, 90], glitter: 200 });
  const kd = kidAt(BAL.deckCam(c), { ...KIDJ, fx: -0.75, reachL: 1, shock: 0.6, worry: 0.3, lean: -4 + 1.5 * Math.sin(u * 22), blink: 0 }, x.t);
  const r = BAL.rod(BAL.kidHand(kd, 1), kd.p.s / 100, { ang: -50 + 6 * E(0.2, 0.5, u), len: 138, bend: lerp(0.15, 0.75, E(0.2, 0.6, u)), line: 46, swing: 6 * Math.sin(u * 30) });
  // the fish breaks the surface on "could talk": it comes up on the line
  const rise = clamp((x.t - (WD("L03", "could") - 0.1)) / 0.45), fish = rise > 0 ? BAL.flounderOnLine({ x: r.end.x, y: r.end.y + (1 - ease(rise)) * 420 }, 360, { open: 0.3 * rise, mood: 1, swing: 4 * Math.sin(u * 7), look: [0.6, 0.4], t: x.t }).svg : "";
  return compose(s, fish + r.svg + kd.svg);
});
// 4  the flounder rises side-on beside the kid, its mouth talks; the kid jolts back, still holding the rod; slow push toward its snout. Foam is drawn behind the deck (B5)
shot("4", "L04", () => LN("L04").at - 0.04, (u, x) => {
  const c = { x: 0.7, y: 0.9, z: lerp(7.2, 8.2, u / 2.7), h0: 1130 }; BAL.mood(0);
  const p = L.P(c, 0.45, 0, 11.0), out = 0.2 + 0.7 * E(0, 0.5, u), len = 340;
  const fr = BAL.flounderRise(p.x, p.y, len, { mood: 1, open: talkAt(x.ln, x.lu), out, t: x.t });
  regFish(p.x, p.y + len * (0.3 - out * 0.5), len, 62, false);
  const s = coast2(c, x.t, 0, { sun: [200, 900, 90], glitter: 200, under: fr });
  const jolt = E(0, 0.18, u) * (1 - 0.6 * E(0.3, 1.2, u));
  const kd = kidAt(BAL.deckCam(c), { ...KIDJ, fx: -0.85, reachL: 1, shock: 1, worry: 0.8, lean: -9 * jolt, talk: 0, blink: bl(u) }, x.t);
  const r = rodOf(kd, { ang: -42, len: 138, line: 60, bend: 0.4, swing: -12 });
  return compose(s, r.svg + kd.svg);
});
// 5  Grandma at the hut door (door camera), one short finger raised from a bent arm: the rule shot
shot("5", "L05", () => LN("L05").at - 0.04, (u, x) => {
  const c = { ...CAM.door, z: lerp(2.2, 2.7, u / 2.8) }, s = coast2(c, x.t, 0, { sun: [900, 900, 80], glitter: 900, light: 1 });
  const up = E(0.45, 0.8, u);
  const g = keeperAt(c, -0.5, 5.75, x.t, { fx: 0.6, stern: 1, talk: talkAt(x.ln, x.lu), blink: bl(u) });
  return compose(s, g.svg + raisedArm(g, up));
});
// 6  the kid close with the fish in his hands, proud, a kind smile; then (6b) at the waterline his hands open and the fish slips into the water
shot("6", "L06", () => LN("L06").at - 0.05, (u, x) => {
  const c = { x: 0, y: 1.0, z: lerp(2.2, 2.55, u / 2.2), h0: 1010 }, s = coast2(c, x.t, 0, { sun: [800, 900, 84], glitter: 800 });
  const kd = kidAt(c, { X: -0.52, Z: 4.4, fx: 0.3, smile: 1, worry: 0.25, reachL: 0.15, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.4) }, x.t);
  const f = BAL.flounderHeld(kd, 250, { open: 0, mood: 1, t: x.t });
  return compose(s, kd.svg + f.svg);
});
shot("6b", "L06", () => WD("L06", "grandma") - 0.1, (u, x) => {
  const c = { x: 1.6, y: 1.0, z: 4.6, h0: 1020 }, s = coast2(c, x.t, 0, { sun: [800, 900, 84], glitter: 800, drift: false });
  const kd = kidAt(c, { X: 1.6, Z: 7.6, fx: -0.2, smile: 1, worry: 0.25, reachL: 0.15, blink: bl(u, 0.2) }, x.t), w = L.P(c, 1.9, 0, 8.7), fall = clamp((u - 0.3) / 0.3);
  const hold = BAL.flounderHeld(kd, 250, { open: 0, mood: 1, t: x.t });
  let cast = "";
  if (u < 0.3) cast = kd.svg + hold.svg;
  else {
    const fx = lerp(hold.x, w.x, ease(fall)), fy = lerp(hold.y, w.y, fall * fall), q = clamp((u - 0.6) / 0.9);
    let rip = ""; for (let i = 0; i < 3; i++) { const r = (30 + q * 150 + i * 38) * (u > 0.6 ? 1 : 0), op = u > 0.6 ? 0.8 * (1 - q) * (1 - i * 0.25) : 0; rip += `<ellipse cx="${n(w.x)}" cy="${n(w.y)}" rx="${n(r)}" ry="${n(r * 0.22)}" fill="none" stroke="${BAL.M.foam}" stroke-width="4" opacity="${n(op)}"/>`; }
    const fish = fall < 1 ? BAL.flounder(fx, fy, lerp(250, 200, fall), { rot: -6 + 70 * fall, mood: 1, t: x.t }) : `<g opacity="${n(1 - clamp((u - 0.6) / 0.5))}">${BAL.flounderUnder(w.x, w.y + 6, 170, { rot: 80, depth: 0.5, t: x.t })}</g>`;
    cast = (fall < 1 ? rip + kd.svg + fish : rip + fish + kd.svg);
  }
  return compose(s, cast);
});
// 7  wide: the hut cross-fades to the cottage on "cottage" (fast, on one footprint); on "grey" the sea drains to slate
shot("7", "L07", () => LN("L07").at - 0.05, (u, x) => {
  const tt = x.t, stage = E(WD("L07", "cottage") - 0.05, WD("L07", "cottage") + 0.3, tt), m = E(WD("L07", "grey") - 0.45, WD("L07", "grey") + 0.4, tt);
  const c = { x: 0.1, y: 3.0, z: lerp(0.9, 0.2, u / 3), h0: 760 }, s = coast2(c, tt, m, { stage, light: stage });
  const kd = jettyKid(c, tt, { reachL: 0.2, blink: bl(u), smile: 0.6 });
  const g = keeperAt(c, B.keeper.X, B.keeper.Z, tt, { stern: 0.4, blink: bl(u, 0.3), flame: 1 });
  return compose(s, kd.svg + g.svg + g.arm);
});
// 8  Grandma close beside the grey sea, looking at the water, the candle flame shrinks once (the cottage roof stays below the caption)
shot("8", "L08", () => LN("L08").at - 0.05, (u, x) => {
  const c = { ...CAM.door, z: lerp(2.6, 3.0, u / 2), h0: 1190 }, s = coast2(c, x.t, 1, { stage: 1, light: 1 });
  const fl = lerp(1, 0.8, E(0.55, 0.9, u)) + (u > 0.55 && u < 0.7 ? -0.15 : 0);
  const g = keeperAt(c, -0.5, 5.75, x.t, { fx: 0.75, stern: 0.6, flame: fl, talk: talkAt(x.ln, x.lu), blink: bl(u), look: 0.4 });
  return compose(s, g.svg + g.arm);
});
// 9  the 1812 chapbook page: a woodcut of the old couple in a round pot-like hut (marks only, nothing to read)
function chapbook(zoom, cx, cy, t) {
  const ink = "#241810", paper = "#e8d6a8", paperD = "#cdb27a", s = [];
  const j = (i, a) => (hash(i) * 2 - 1) * a, lines = (x0, x1, y, seed, rows) => Array.from({ length: rows }, (_, r) => { const w = (x1 - x0) * (r === rows - 1 ? 0.55 : 1 - 0.05 * hash(seed + r)), yy = y + r * 40; let d = `M${x0},${yy}`; for (let k = x0; k < x0 + w; k += 30) d += ` l${n(14 + 12 * hash(seed + r * 50 + k))},${n(j(k + r, 3))} l${n(8 + 9 * hash(k + seed))},0`; return `<path d="${d}" stroke="${ink}" stroke-width="9" fill="none" stroke-linecap="round" opacity="0.62"/>`; }).join("");
  s.push(`<rect width="${W}" height="${H}" fill="#2a1d14"/>`);
  s.push(`<rect x="70" y="250" width="940" height="1470" rx="10" fill="${paperD}" transform="translate(14,18)" opacity="0.5"/><rect x="70" y="250" width="940" height="1470" rx="10" fill="${paper}"/>`);
  for (let i = 0; i < 46; i++) s.push(`<circle cx="${n(90 + 900 * hash(i))}" cy="${n(270 + 1430 * hash(i + 50))}" r="${n(3 + 9 * hash(i + 90))}" fill="#a88a4e" opacity="${n(0.18 + 0.2 * hash(i + 120))}"/>`);
  s.push(`<rect x="130" y="320" width="820" height="1330" fill="none" stroke="${ink}" stroke-width="5" opacity="0.7"/><rect x="142" y="332" width="796" height="1306" fill="none" stroke="${ink}" stroke-width="2" opacity="0.7"/>`);
  // the woodcut block: a pot-hut by the sea
  const bx = 190, by = 700, bw = 700, bh = 720;
  s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="#f0e2b8" stroke="${ink}" stroke-width="9"/>`);
  let w = `<clipPath id="cbx"><rect x="${bx}" y="${by}" width="${bw}" height="${bh}"/></clipPath><g clip-path="url(#cbx)">`;
  for (let i = 0; i < 14; i++) w += `<path d="M${bx},${by + 40 + i * 16} L${bx + bw},${n(by + 40 + i * 16 + j(i, 5))}" stroke="${ink}" stroke-width="${n(1.5 + i * 0.06)}" opacity="0.5"/>`;   // sky hatching
  for (let i = 0; i < 24; i++) { const a = -0.2 + i * 0.27; w += `<path d="M${bx + 160},${by + 140} L${n(bx + 160 + Math.cos(a) * 300)},${n(by + 140 + Math.sin(a) * 300)}" stroke="${ink}" stroke-width="3" opacity="0.5"/>`; }
  w += `<circle cx="${bx + 160}" cy="${by + 140}" r="62" fill="#f0e2b8" stroke="${ink}" stroke-width="7"/>`;
  for (let r = 0; r < 9; r++) { let d = `M${bx},${by + 470 + r * 30}`; for (let k = 0; k < bw; k += 50) d += ` q25,${-18 - r} 50,0`; w += `<path d="${d}" stroke="${ink}" stroke-width="${n(5 + r * 0.5)}" fill="none"/>`; }
  w += `<path d="M${bx},${by + 600} Q${bx + 200},${by + 560} ${bx + bw},${by + 600} L${bx + bw},${by + bh} L${bx},${by + bh} Z" fill="${ink}" opacity="0.88"/>`;     // dark sand
  // pot-shaped hut: a round pot with a lid, chimney, door, a little window
  const hx = bx + 440, hy = by + 520;
  w += `<path d="M${hx - 190},${hy} Q${hx - 235},${hy - 170} ${hx - 120},${hy - 250} Q${hx},${hy - 295} ${hx + 120},${hy - 250} Q${hx + 235},${hy - 170} ${hx + 190},${hy} Z" fill="#f0e2b8" stroke="${ink}" stroke-width="9" stroke-linejoin="round"/>`;
  for (let i = 0; i < 16; i++) w += `<path d="M${hx - 200 + i * 26},${hy - 8 - 10 * (i % 3)} Q${hx - 200 + i * 26 + 8},${hy - 150} ${hx - 185 + i * 26},${n(hy - 255 + 40 * Math.abs(Math.sin(i * 0.2)))}" stroke="${ink}" stroke-width="3.5" fill="none" opacity="0.6"/>`;
  w += `<path d="M${hx - 130},${hy - 258} Q${hx},${hy - 335} ${hx + 130},${hy - 258} Q${hx},${hy - 285} ${hx - 130},${hy - 258} Z" fill="${ink}"/><rect x="${hx + 60}" y="${hy - 340}" width="34" height="70" fill="${ink}"/><path d="M${hx + 70},${hy - 350} q${n(14 + 8 * Math.sin(t * 2))},-40 -4,-80 q-30,-30 5,-70" stroke="${ink}" stroke-width="6" fill="none" opacity="0.6"/>`;
  w += `<path d="M${hx - 36},${hy} L${hx - 36},${hy - 100} Q${hx},${hy - 130} ${hx + 36},${hy - 100} L${hx + 36},${hy} Z" fill="${ink}"/><rect x="${hx + 90}" y="${hy - 120}" width="46" height="46" fill="${ink}"/>`;
  // the old couple: two figures by the door, the woman with a cap, the man with a hat and a rod
  const fig = (x, h, hat) => `<path d="M${x - 30},${hy + 40} Q${x - 22},${hy + 40 - h * 0.5} ${x},${n(hy + 40 - h * 0.8)} Q${x + 22},${hy + 40 - h * 0.5} ${x + 30},${hy + 40} Z" fill="${ink}"/><circle cx="${x}" cy="${n(hy + 40 - h * 0.88)}" r="${n(h * 0.12)}" fill="#f0e2b8" stroke="${ink}" stroke-width="6"/><path d="M${n(x - h * 0.16)},${n(hy + 40 - h * 0.95)} L${n(x + h * 0.16)},${n(hy + 40 - h * 0.95)} L${n(x + (hat ? h * 0.1 : 0))},${n(hy + 40 - h * 1.12)} Z" fill="${ink}"/>`;
  w += fig(hx - 125, 190, false) + fig(hx - 70, 205, true) + `<path d="M${hx - 62},${hy - 90} L${hx + 10},${hy - 215}" stroke="${ink}" stroke-width="6"/>`;
  w += `</g>`;
  s.push(w);
  s.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="${ink}" stroke-width="9"/>`);
  s.push(lines(190, 890, 1470, 7, 3) + lines(190, 890, 380, 17, 2));
  return `<g transform="translate(540,960) scale(${n(zoom * 100) / 100}) translate(${-cx},${-cy})">${s.join("")}</g><rect width="${W}" height="${H}" fill="#000" opacity="0.12"/>`;
}
shot("9a", "L09", () => LN("L09").at - 0.05, (u, x) => { BAL.mood(0); return FLAT(chapbook(lerp(1.0, 1.1, u / 2.4), 540, 930, x.t)); });
shot("9b", "L09", () => WD("L09", "pot") - 0.45, (u, x) => { BAL.mood(0); return FLAT(chapbook(lerp(1.9, 2.7, E(0, 0.9, u)), 630, 1070, x.t)); });

// 10  the kid at the end of the jetty, hands cupped, calling (no rod); a ripple beside the pier between the two "Flounder!"; a two-shot with the fish clear of the reeds
const C10 = { x: 1.2, y: 1.5, z: 9.4, h0: 1010 }, K10 = { X: 1.62, Z: 13.7 };
shot("10", "L10", () => LN("L10").at - 0.05, (u, x) => {
  const c = { x: 1.2, y: 1.5, z: lerp(10.6, 11.0, u / 1.2), h0: 1010 }, s = coast2(c, x.t, 1, { stage: 1, light: 1 });
  const kd = kidAt(BAL.deckCam(c), { ...K10, fx: -0.85, hand2face: 1, lean: -2, talk: talkAt(x.ln, x.lu), shock: 0.3, smile: 0.0, blink: bl(u, 0.2) }, x.t);
  return compose(s, kd.svg);
});
shot("10b", "L10", () => W2() - 0.5, (u, x) => {   // the ripple beside the pier: a swell, a ring, the fish's back just under the surface
  const c = { x: 1.2, y: 0.8, z: 9.6, h0: 900 }, s = coast2(c, x.t, 1, { stage: 1, light: 1 });
  const w = L.P(c, 0.5, 0, 14.6), q = clamp(u / 0.5);
  let rip = ""; for (let i = 0; i < 3; i++) { const r = (20 + q * 90 + i * 30) * 1, op = 0.85 * (1 - q * 0.6) * (1 - i * 0.25); rip += `<ellipse cx="${n(w.x)}" cy="${n(w.y)}" rx="${n(r)}" ry="${n(r * 0.2)}" fill="none" stroke="${BAL.M.foam}" stroke-width="4" opacity="${n(op)}"/>`; }
  return compose(s, rip + BAL.flounderUnder(w.x, w.y, 150, { rot: 12, depth: 0.7, t: x.t }));
});
shot("10c", "L10", () => W2() - 0.05, (u, x) => {
  const c = { ...C10 }; BAL.mood(1);
  const p = L.P(c, 0.7, 0, 16.8), up = E(0.1, 0.9, u), out = 0.05 + 0.85 * up, len = 320;
  const fr = BAL.flounderRise(p.x, p.y, len, { mood: 1, open: 0.2 + 0.5 * talkAt(x.ln, x.lu), out, t: x.t });
  if (up > 0.3) regFish(p.x, p.y + len * (0.3 - out * 0.5), len, 62, false);
  const s = coast2(c, x.t, 1, { stage: 1, light: 1, under: fr });
  const kd = kidAt(BAL.deckCam(c), { ...K10, fx: -0.85, hand2face: 0.8, lean: -2, talk: talkAt(x.ln, x.lu), shock: 0.3, blink: bl(u, 0.2) }, x.t);
  return compose(s, kd.svg);
});
// 11  wide: cottage -> castle on "Dark blue" (fast, one footprint), sea 1 -> 2; a low surface insert on "Thick"; the kid recoils on "smell"
shot("11a", "L11", () => LN("L11").at - 0.05, (u, x) => {
  const tt = x.t, stage = 1 + E(0.12, 0.45, u), m = 1 + E(0.1, 1.0, u);
  const c = { x: 0, y: 3.0, z: lerp(0.4, 1.0, u / 1.3), h0: 760 }, s = coast2(c, tt, m, { stage, light: 1 });
  const kd = jettyKid(c, tt, { reachL: 0.3, blink: bl(u) }), g = keeperAt(c, B.keeper.X, B.keeper.Z, tt, { flame: 0.8, blink: bl(u, 0.3) });
  return compose(s, kd.svg + g.svg + g.arm);
});
shot("11b", "L11", () => WD("L11", "thick") - 0.05, (u, x) => {   // slow broad streaks, a dragged reflection: no posts
  const c = { x: 1.0, y: 0.38, z: lerp(7.4, 8.2, u / 1.3), h0: 800 }, s = coast2(c, x.t, 2, { stage: 2, light: 1, drift: false, noJetty: true, noHome: true });
  return compose(s, "");
});
shot("11c", "L11", () => WD("L11", "and") - 0.05, (u, x) => {
  const c = { x: 1.2, y: 1.5, z: lerp(9.0, 9.8, u / 1.6), h0: 1010 }, s = coast2(c, x.t, 2, { stage: 2, light: 1 });
  const sm = clamp((x.t - (WD("L11", "smell") - 0.05)) / 0.3);
  const kd = kidAt(BAL.deckCam(c), { ...KIDJ, Z: 12.2, fx: -0.8, worry: 1, shock: 0.4, hand2face: 0.7 * sm, lean: 2 - 7 * sm * (1 - 0.5 * sm), blink: bl(u, 0.3) }, x.t);
  return compose(s, kd.svg);
});
// 12  Grandma, closer than the castle wide, very quiet, a gentle push on "once before", the candle shrinks
shot("12", "L12", () => LN("L12").at - 0.05, (u, x) => {
  const c = { ...CAM.door, z: lerp(3.3, 4.0, u / 3.0) }, s = coast2(c, x.t, 2, { stage: 2, light: 1 });
  const fl = lerp(0.8, 0.6, E(1.6, 2.3, u));
  const g = keeperAt(c, -0.5, 5.75, x.t, { fx: 0.7, stern: 0.7, flame: fl, talk: talkAt(x.ln, x.lu) * 0.7, blink: bl(u), look: 0.3 });
  return compose(s, g.svg + g.arm);
});
// 13  the kid close, a confident grin, not listening: fast
shot("13", "L13", () => LN("L13").at - 0.05, (u, x) => {
  const c = { x: 0, y: 1.0, z: lerp(2.2, 2.5, u / 1.4), h0: 1010 }, s = coast2(c, x.t, 2, { stage: 2, light: 1 });
  const kd = kidAt(c, { X: -0.52, Z: 4.4, fx: 0.4, grin: 1, worry: 0.1, reachL: 0.2, talk: talkAt(x.ln, x.lu), lean: 2 * Math.sin(u * 7), blink: bl(u, 0.1) }, x.t);
  return compose(s, kd.svg);
});
// 14  the kid close, shouting, arms wide, the stone castle behind him through "coast!"; the palace (and his crown) appear in the gap after the word
shot("14", "L14", () => LN("L14").at - 0.05, (u, x) => {
  const tt = x.t, rv = E(LN("L14").end - 0.05, LN("L14").end + 0.3, tt);
  const c = { x: 0.4, y: 1.25, z: lerp(2.1, 2.6, u / 1.8), h0: 1040 }, s = coast2(c, tt, 2, { stage: 2 + rv, light: 1 });
  const kd = kidAt(c, { crown: E(LN("L14").end + 0.1, LN("L14").end + 0.4, tt), X: 0.95, Z: 5.3, fx: 0.7, reachL: 1, shock: 0.8, worry: 0, talk: talkAt(x.ln, x.lu), lean: -3 * Math.sin(u * 6), blink: 0 }, tt);
  return compose(s, kd.svg);
});
// 15  wide: the sea goes black, lightning far off; 0.4 s silence follows "black"; the kid (crowned) still on the sand
shot("15", "L15", () => LN("L15").at - 0.05, (u, x) => {
  const tt = x.t, m = 2 + E(WD("L15", "turned") - 0.1, WD("L15", "black") + 0.25, tt);
  const c = { x: 0, y: 3.0, z: lerp(0.5, 0.0, u / 2), h0: 760 }, s = coast2(c, tt, m, { stage: 3, light: 1, bolt: flick(u, [0.75, 1.15]), boltX: 820 });
  const kd = kidAt(c, { crown: 1, X: 0.95, Z: 5.3, fx: 0.7, shock: 0.5, worry: 0.2, blink: 0 }, tt), g = keeperAt(c, B.keeper.X, B.keeper.Z, tt, { flame: 0.6, blink: bl(u, 0.3) });
  return s.back + g.svg + g.arm + BAL.grade() + kd.svg + s.front;
});
// 16  the flounder close, cold, half lids, a thin pale rim against the black; it looks at the palace (left) while it says it. "it" = the gains
shot("16", "L16", () => LN("L16").at - 0.2, (u, x) => {
  const c = { x: -0.5, y: 0.9, z: 5.2, h0: 800 }; BAL.mood(3);
  const p = L.P(c, 0.7, 0, 11.0), len = lerp(620, 700, u / 2.2), out = 0.85, fx = p.x, fy = p.y + 170, look = [-1, 0.15 + 0.1 * Math.sin(u * 2)];
  const fish = (o) => BAL.flounderRise(fx, fy, len, { mood: 0, open: talkAt(x.ln, x.lu), out, t: x.t, crown: 0.6, look, foamK: 0.5, ...o });
  const rim = `<g transform="translate(-7,-7)" style="filter:brightness(2.6) saturate(0.35) hue-rotate(185deg)" opacity="0.55">${fish({ open: 0 })}</g>`;
  regFish(fx, fy + len * (0.3 - out * 0.5), len, 62, false);
  const s = coast2(c, x.t, 3, { stage: 3, light: 1, drift: false, bolt: flick(u, [1.0]), boltX: 300 });
  return compose(s, rim + fish({}));
});
// 17  Grandma closer, urgent, the candle gutters hardest on "Now"
shot("17", "L17", () => LN("L17").at - 0.05, (u, x) => {
  const c = { ...CAM.door, z: lerp(2.9, 3.6, u / 1.5) }, s = coast2(c, x.t, 3, { stage: 3, light: 1, bolt: flick(u, [0.6]), boltX: 300 });
  const fl = lerp(0.6, 0.3, E(0, 0.5, u)) + 0.09 * Math.sin(u * 23) - 0.16 * Math.max(0, Math.sin(clamp((x.lu - LN("L17").words[1][1]) / 0.5) * Math.PI));
  const g = keeperAt(c, -0.5, 5.75, x.t, { fx: 0.65, stern: 1, flame: Math.max(0.1, fl), talk: talkAt(x.ln, x.lu), blink: 0 });
  return compose(s, g.svg + g.arm);
});
// 18  one sustained build: the kid defiant close in the rain with a low swell behind (18a), pulling back as it grows (18b), then the tower wave rise (19)
const TW18 = (t) => lerp(0.05, 0.22, clamp((t - LN("L18").at) / (WD("L18", "say") - LN("L18").at)));
shot("18a", "L18", () => LN("L18").at - 0.05, (u, x) => {
  const c = { x: 1.2, y: 1.5, z: lerp(8.0, 8.5, u / 1.6), h0: 1010 }, s = coast2(c, x.t, 3.3, { stage: 3, light: 1, rain: 0.8, towers: TW18(x.t), bolt: flick(u, [0.4]), boltX: 800 });
  const kd = kidAt(BAL.deckCam(c), { crown: 1, ...KIDJ, fx: -0.8, reachL: 0.8, shock: 0.8, worry: -1, talk: talkAt(x.ln, x.lu), lean: 4, blink: 0 }, x.t);
  return s.back + BAL.grade() + kd.svg + s.front;
});
shot("18b", "L18", () => WD("L18", "make") - 0.05, (u, x) => {
  const m = 3.3 + 0.7 * E(0.1, 2.1, u), c = { x: 1.3, y: 1.6, z: lerp(8.5, 6.6, E(0, 2.2, u)), h0: 1010 }, s = coast2(c, x.t, m, { stage: 3, light: 1, towers: TW18(x.t), bolt: flick(u, [1.3, 1.9]), boltX: 760 });
  const kd = kidAt(BAL.deckCam(c), { crown: 1, ...KIDJ, fx: -0.7, reachL: 1, shock: 0.8, worry: -1, talk: talkAt(x.ln, x.lu), lean: 5, blink: 0 }, x.t);
  return s.back + BAL.grade() + kd.svg + s.front;
});
// 19  the tower waves stand up over the jetty, the kid tiny and crowned, lightning: peak on "towers"; a wing of the palace at left
shot("19", "L19", () => LN("L19").at - 0.05, (u, x) => {
  const up = 0.22 + 0.78 * E(WD("L19", "stood") - 0.1, WD("L19", "towers") + 0.2, x.t), c = { x: 1.6, y: 2.0, z: lerp(1.5, 2.4, u / 3.0), h0: 1000 }, s = coast2(c, x.t, 4, { stage: 3, light: 0.5, towers: up, rain: 1, bolt: flick(u, [1.3, 2.35], 0.6), boltX: 880 });
  const kd = kidAt(BAL.deckCam(c), { crown: 1, ...KIDJ, Z: 11.4, fx: -0.5, shock: 1, reachL: 0.4, lean: 6 + 2 * Math.sin(u * 4), blink: 0 }, x.t);
  return s.back + BAL.grade() + kd.svg + s.front;
});
// 20  the flounder, closer and at water level, in front of the wave wall: eyes and mouth stay above the foam through its last word, then it dips in the gap
shot("20", "L20", () => LN("L20").at - 0.05, (u, x) => {
  const c = { x: 1.8, y: 1.1, z: 3.6, h0: 900 }; BAL.mood(4);
  const p = L.P(c, 1.8, 0, 11.5), len = 700, tEnd = LN("L20").end, out = 0.1 + 0.62 * E(0, 0.45, u) - 0.6 * E(tEnd - 0.02 - (x.t - u), tEnd + 0.2 - (x.t - u), u);
  const fr = BAL.flounderRise(p.x, p.y, len, { mood: 0, open: talkAt(x.ln, x.lu), out, t: x.t, crown: 0.4, foamK: 0.45 });
  if (out > 0.15) regFish(p.x, p.y + len * (0.3 - out * 0.5), len, 62, false);
  const s = coast2(c, x.t, 4, { stage: 3, light: 0.5, towers: 1, rain: 1, bolt: flick(u, [0.2]), boltX: 600, under: "" });
  return s.back + BAL.grade() + fr + s.front;
});
// 21  the vanishing, one footprint: palace -> castle (just after "gone"), castle pops on "Castle", "Crown" lifts off his head, cottage pops, a held empty site on "Gone", then the old hut; the palette runs back through blue and grey to green as the kid walks down the jetty
const pop = (u0, dur, u) => { const q = clamp((u - u0) / dur); return q <= 0 ? 1 : q >= 1 ? 0 : Math.max(0, 1 - ease(q) ** 0.8 * 1.25); };
const L21 = () => ({ castle: WD("L21", "castle"), crown: WD("L21", "crown"), cottage: WD("L21", "cottage"), gone: WD("L21", "gone"), just: WD("L21", "just"), hut: WD("L21", "hut"), green: WD("L21", "green") });
const C21 = { x: 0, y: 2.4, z: 0.8, h0: 800 };
shot("21a", "L21", () => LN("L21").at - 0.3, (u, x) => {   // palace -> castle in the gap, the castle pops away on "Castle"
  const T = L21(), tt = x.t, st = 3 - E(LN("L20").end + 0.02, LN("L20").end + 0.27, tt), sz = tt < T.crown - 0.4 ? 1 : pop(T.crown - 0.4, 0.3, tt);
  const s = coast2(C21, tt, 4, { stage: st, alpha: sz, light: 0.5, towers: 0.8, rain: 1 });
  const kd = jettyKid(C21, tt, { crown: 1, reachL: 0.2, shock: 0.5, blink: 0 }), g = keeperAt(C21, B.keeper.X, B.keeper.Z, tt, { flame: 0.7, stern: 0.5, blink: bl(u, 0.3) });
  return s.back + g.svg + g.arm + BAL.grade() + kd.svg + s.front;
});
shot("21b", "L21", () => WD("L21", "crown") - 0.05, (u, x) => {   // "Crown." the crown lifts off his head and pops away; his hand is empty
  const T = L21(), tt = x.t, c = { x: 1.2, y: 1.5, z: 8.2, h0: 1010 }, s = coast2(c, tt, 4, { stage: 3, light: 0.5, towers: 0.8, rain: 1, noHome: true, drift: false });
  const kd = kidAt(BAL.deckCam(c), { crown: pop(T.crown + 0.15, 0.5, tt), ...KIDJ, fx: -0.8, reachL: 0.5, shock: 0.6, worry: 0.6, blink: 0 }, tt);
  return s.back + BAL.grade() + kd.svg + s.front;
});
shot("21c", "L21", () => WD("L21", "cottage") - 0.05, (u, x) => {   // "Cottage." the cottage pops away on the same footprint
  const T = L21(), tt = x.t, sz = tt < T.gone - 0.35 ? 1 : pop(T.gone - 0.35, 0.3, tt);
  const s = coast2(C21, tt, 4, { stage: 1, alpha: sz, light: 0.5, towers: 0.8, rain: 1, noHome: sz < 0.02 });
  const kd = jettyKid(C21, tt, { reachL: 0.1, shock: 0.5, blink: 0 }), g = keeperAt(C21, B.keeper.X, B.keeper.Z, tt, { flame: 0.7, stern: 0.5, blink: bl(u, 0.3) });
  return s.back + g.svg + g.arm + BAL.grade() + kd.svg + s.front;
});
const WALK21 = () => { const T = L21(); return [[T.just, 1.5, 11.4], [T.just + 1.1, 1.5, 7.8], [T.green + 0.7, 0.95, 5.3]]; };
shot("21d", "L21", () => WD("L21", "gone") - 0.05, (u, x) => {   // "Gone." the empty site, held; "Just the old hut." the hut stands up; the sea starts back
  const T = L21(), tt = x.t, m = 4 * (1 - E(T.just, T.green + 0.2, tt)), hz = clamp((tt - (T.hut - 0.3)) / 0.45), sz = ease(hz);
  const s = coast2(C21, tt, m, { stage: 0, alpha: sz, noHome: hz <= 0, light: 1, drift: false, rain: clamp(m - 3), towers: clamp(m - 3) });
  const w = walkPath(WALK21(), tt), kd = jettyKid(C21, tt, { X: w.X, Z: w.Z, run: w.run, reachL: 0, shock: 0, worry: 0.8, blink: bl(u) });
  const g = keeperAt(C21, B.keeper.X, B.keeper.Z, tt, { flame: lerp(0.6, 0.8, hz), stern: 0.4, blink: bl(u, 0.3) });
  return compose(s, g.svg + g.arm + kd.svg);
});
shot("21e", "L21", () => WD("L21", "green") + 0.3, (u, x) => {   // "And a green sea." the first fully green frame; the kid arrives beside Grandma
  const T = L21(), c = { ...CAM.two, z: lerp(0.8, 1.4, u / 1.5) }, s = coast2(c, x.t, 0, { stage: 0, light: 1, sun: [800, 990, 84], glitter: 800, drift: false });
  const w = walkPath(WALK21(), x.t), kd = kidAt(c, { X: w.X, Z: w.Z, run: w.run, fx: -0.7, worry: 0.8, blink: bl(u) }, x.t), g = keeperAt(c, 0.3, 5.45, x.t, { fx: 0.7, stern: 0.2, flame: lerp(0.8, 1, E(0, 1.5, u)), blink: bl(u, 0.5) });
  return compose(s, g.svg + g.arm + kd.svg);
});
// 22  the kid close by the hut, small and sad (he is dry: the reset is magic)
shot("22", "L22", () => LN("L22").at - 0.05, (u, x) => {
  const c = { x: -0.3, y: 1.0, z: lerp(2.5, 2.8, u / 1.8), h0: 1010 }, s = coast2(c, x.t, 0, { stage: 0, light: 1, sun: [200, 900, 84], glitter: 200 });
  const kd = kidAt(c, { X: -0.52, Z: 4.4, fx: 0.4, worry: 1, lean: -3, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.2) }, x.t);
  return compose(s, kd.svg);
});
// 23  medium on Grandma beside the hut's round roof and curved door, deadpan; on "pot" she glances at the hut. HARD CUT right after the last sound of "pot"
shot("23", "L23", () => LN("L23").at - 0.05, (u, x) => {
  const c = { x: -0.75, y: 1.1, z: lerp(2.5, 2.9, u / 3.7), h0: 1010 }, s = coast2(c, x.t, 0, { stage: 0, light: 1, smoke: 1, sun: [900, 960, 80], glitter: 900 });
  const potT = WD("L23", "pot"), gl = E(potT - 0.15, potT + 0.12, x.t);
  const g = keeperAt(c, -0.3, 5.75, x.t, { fx: lerp(0.35, -0.9, gl), stern: 0.2, flame: 1, talk: talkAt(x.ln, x.lu) * 0.8, blink: bl(u, 0.4), look: lerp(0, -0.9, gl) });
  return compose(s, g.svg + g.arm);
});

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) { const ln = LINE[s.line]; let a = s.off(); if (a < ln.at) a = Math.max(a, prevEnd(s.line)); s.at = Math.max(0, a); }
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
for (const s of SHOTS) if (s.end - s.at < (s.short ? 0.15 : 0.2)) throw new Error("shot too short " + s.id + " " + (s.end - s.at));
export const TIMELINE = SHOTS;
// the line being spoken at t: it shows from its first word until its last word has been said (+0.3 s), never cut early by the next
const holdEnd = (i) => Math.min(i + 1 < ORDER.length ? LINE[ORDER[i + 1]].at - 0.02 : 1e9, LINE[ORDER[i]].end + 0.3);
const lineAtTime = (t) => { let k = null; ORDER.forEach((id, i) => { const ln = LINE[id]; if (t >= ln.at - 0.04 && t < holdEnd(i)) k = ln; }); return k; };

// ---------------------------------------------------------------- captions: upper third, centre ~580, off every face; below the banner while it is up
const CAPY = [580, 540, 620, 660, 700, 500, 740, 780, 820];
const OPT = { key: KEY, keyColor: "#ff3b3b", reveal: true };           // normal legend size (urashima): maxFs 74, width 940, wrap at 19
const BANNER_OUT = 3.45;
const CAPFIX = { L08: 330 };      // L08: the roof of the cottage fills the usual spot: this caption sits in the sky above it
function capBox(ph, y) {
  const ws = ph.ws.map((q) => q[0]), len = (a) => a.join(" ").length, wrapAt = 19, maxFs = 74, width = 940;
  let k = ws.length;
  if (len(ws) > wrapAt && ws.length > 1) { let best = 1e9; for (let i = 1; i < ws.length; i++) { const d = Math.abs(len(ws.slice(0, i)) - len(ws.slice(i))); if (d < best) { best = d; k = i; } } }
  const rows = k < ws.length ? [ws.slice(0, k), ws.slice(k)] : [ws], mx = Math.max(...rows.map(len)), fs = Math.min(maxFs, Math.round(width / Math.max(1, mx * 0.6)));
  const w = mx * fs * 0.6 + 24, h = rows.length * fs * 1.08 + 14;
  return { x0: 540 - w / 2, x1: 540 + w / 2, y0: y - h / 2, y1: y + h / 2 };
}
const hit = (b, f) => { const dx = Math.max(b.x0 - f.x, 0, f.x - b.x1), dy = Math.max(b.y0 - f.y, 0, f.y - b.y1); return dx * dx + dy * dy < (f.r + 14) ** 2; };
const facesAt = (t) => { FACES = []; bodyAt(t); const f = FACES; FACES = []; return f; };
const CAPCACHE = new Map();
function capY(ln, pi, ph) {
  const key = ln.id + ":" + pi; if (CAPFIX[ln.id]) return CAPFIX[ln.id];
  if (CAPCACHE.has(key)) return CAPCACHE.get(key);
  const t0 = ln.at + ph.at, t1 = pi + 1 < ln.phrases.length ? ln.at + ln.phrases[pi + 1].at : ln.end + 0.3;
  const fs = [t0 + 0.05, (t0 + t1) / 2, t1 - 0.08].map((t) => facesAt(Math.min(t, DUR - 0.01))).flat();
  let best = null, bs = 1e9;
  for (const y of CAPY) { const b = capBox(ph, y); if (t0 < BANNER_OUT && b.y0 < 512) continue; const bad = fs.filter((f) => hit(b, f)).length; if (!bad) { best = y; break; } if (bad < bs) { bs = bad; best = y; } }
  if (best == null) best = 620;
  CAPCACHE.set(key, best); return best;
}
function captions(t) {
  const ln = lineAtTime(t); if (!ln) return "";
  const u = t - ln.at; let pi = -1; for (let i = 0; i < ln.phrases.length; i++) if (u >= ln.phrases[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  return captionSvg(ln.phrases, u, { ...OPT, y: capY(ln, pi, ln.phrases[pi]) });
}
export const SUBS = { on: true };
function shotAt(time) { let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q; return s; }
function bodyAt(time) {
  L.resetIds(); BAL.resetIds();
  const s = shotAt(time), ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  return { body: s.fn(u, { ln, lu: t - ln.at, t }), shot: s.id };
}
// the picture at time t: { pic: svg without subtitles (banner included), cap: the subtitle svg (or "") }
export function parts(time) {
  FACES = [];
  const b = bodyAt(time), fcs = FACES.slice(), flat = b.body.startsWith("<!--flat-->");
  const title = time < BANNER_OUT ? titleCard(time, { style: TITLE, teaser: "T1" }) : "";
  const dbg = process.env.DEBUGFACES ? fcs.map((f) => `<circle cx="${n(f.x)}" cy="${n(f.y)}" r="${n(f.r)}" fill="none" stroke="#0f0" stroke-width="3"/>`).join("") : "";
  return { pic: frame(b.body, flat) + title + dbg, cap: captions(time), shot: b.shot, faces: fcs };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
