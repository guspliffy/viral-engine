// Legend ep 01: the masked woman (Kuchisake-onna), code-drawn (Jonny 26 Nov 2026: "lets try our first story in this
// style"; opening 1 + ending 1). Rendered by tools/svg2d/render.mjs; lines read by tools/svg2d/read-lines.py into
// out/legend-ep01/voice/. The timeline is built from the real line lengths, so re-reading a voice re-times the cut.
//   engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/ep01/lines.json out/legend-ep01/voice
//   node tools/svg2d/render.mjs storyboards/series/legend/ep01/ep01.mjs out/legend-ep01/ep01-draft.mp4
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-ep01/voice", SPEC = JSON.parse(readFileSync("storyboards/series/legend/ep01/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  const s = new Int16Array(data.buffer, data.byteOffset, data.length >> 1);
  return { sr, s };
}
for (const ln of Object.values(LINE)) {
  if (!existsSync(`${VOICE}/${ln.id}.wav`)) { ln.dur = 0.6 + ln.text.split(" ").length * 0.36; ln.env = []; ln.words = []; continue; }   // not read yet: a guess
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = existsSync(`${VOICE}/${ln.id}.words.json`) ? JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8")) : [];
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)); return w ? w[1] : ln.dur * frac; };

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
const W0 = [-1.2, 5.9], K0 = [-0.08, 3.7], G0 = [0.52, 2.9];
const CANDY = Array.from({ length: 9 }, (_, i) => ({ X: -0.78 + hash(i + 3) * 0.5, Z: 4.05 + hash(i + 17) * 0.4, col: ["#f2a93b", "#e8476a", "#ffd36a", "#7ad18a"][i % 4] }));
const cam = (u, a, b, k = "inOut") => { const e = ease(u, k); return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; };
const base = () => ({ pal: "night", lampFl: 1, branch: true, woman: { X: W0[0], Z: W0[1], turn: 0, eyes: "calm" }, kid: { X: K0[0], Z: K0[1], fx: -0.8 }, keeper: { X: G0[0], Z: G0[1], flame: 1 }, extras: [], candies: [] });

// Draft 3 (26 Nov): Sol round 1 editor pass (sol-r1/answer-summary.md) on Jonny's ask "edit the video to a more interesting
// version": the grab by 0.3 s, "Why?" dropped, candle-glow into the "say yes" illustration (cool grade), two-stage unmask,
// 1979 montage, a closer freeze, a candy sequence with visible pickups, two run, last piece -> lens.
const BEATS = [
  // 1. HOOK: he is already walking toward her; the grandmother catches his sleeve by 0.3 s, then his eyeline to her
  { line: "L01", pre: 0.25, hold: 0.1, shot(u, d, T, ln) {
    const s = base(), nv = wordAt(ln, "never", 0.6) - 0.05, walk = clamp((u + 0.25) / 0.55);
    if (u < nv) {
      s.cam = cam((u + 0.25) / (nv + 0.25), [0.3, 0.72, 1.7], [0.26, 1.1, 1.85]);
      s.kid = { X: lerp(0.05, K0[0], ease(walk)), Z: lerp(3.4, K0[1], ease(walk)), fx: u < 0.25 ? -0.8 : 0.7, run: u < 0.3 ? (u + 0.25) * 1.6 : null, shock: tr([[0.05, 0], [0.25, 0.6]], u), tug: tr([[-0.15, 0], [0.05, 1]], u) };
      s.keeper = { X: G0[0], Z: G0[1], grab: tr([[-0.25, 0.2], [0.05, 1, "back"]], u), stern: 1, open: 1, flame: 1, fx: -0.7 };
    } else {   // down his eyeline to the white mask at the far lamp
      s.cam = cam((u - nv) / (d + 0.1 - nv), [-0.95, 1.08, 4.0], [-1.0, 1.12, 4.45], "out");   // from where he stands (he and she are behind the lens)
      s.kid = { ...s.kid, tug: 1, fx: -0.8 }; s.keeper = { ...s.keeper, grab: 1, stern: 1, fx: -0.7 };
    }
    return s; } },
  { line: "L02", pre: 0.1, hold: 0.0, shot(u, d) {   // "She's just standing there." (no "Why?")
    const s = base();
    s.cam = cam(u / d, [0.3, 1.0, 1.5], [0.26, 1.0, 1.7]);
    s.kid = { ...s.kid, fx: 0.7, look: -0.8, tug: 1 };
    s.keeper = { ...s.keeper, grab: 1, stern: 1, open: 1, fx: -0.7 };
    return s; } },
  // 2. NAME: over his shoulder toward her, push in on the name; tilt down the lamp; punch into the mask; the street
  { line: "L03", pre: 0.1, hold: 0.05, shot(u, d, T, ln) {
    const s = base(), c0 = wordAt(ln, "her", 0.18) + 0.1, c1 = wordAt(ln, "she", 0.4), c2 = wordAt(ln, "white", 0.6) - 0.05, c3 = wordAt(ln, "and", 0.7);
    s.kid.tug = 1; s.keeper = { ...s.keeper, grab: 1, stern: 1, open: 1 };
    if (u < c1) s.cam = cam((u + 0.1) / (c1 + 0.1), [-1.15, 1.4, 3.6], [-1.16, 1.5, 4.55]);   // full figure -> waist-up on the name
    else if (u < c2) s.cam = cam((u - c1) / (c2 - c1), [-1.35, 2.55, 4.4], [-1.18, 1.62, 4.55]);
    else if (u < c3) { s.cam = cam((u - c2) / (c3 - c2), [-1.1, 1.52, 5.05], [-1.1, 1.52, 5.2]); s.woman.open = 1 - blinkAmt(u, [c2 + 0.3]); }
    else s.cam = cam((u - c3) / (d + 0.05 - c3), [0.1, 1.5, -0.6], [0.06, 1.45, -0.2]);
    return s; } },
  { line: "L04", pre: 0.15, hold: 0.15, speaker: "woman", shot(u, d) {   // child height, her eyes settle toward him
    const s = base();
    s.cam = cam(u / d, [-1.06, 1.32, 4.75], [-1.07, 1.34, 4.98]);
    s.woman = { ...s.woman, turn: 0.15, look: tr([[0, 0.9], [d * 0.5, 0.35]], u), eyes: "calm" };
    return s; } },
  // 3. THE RULE: no = angry, yes = the mask comes off
  { line: "L05", pre: 0.1, hold: 0.0, speaker: "kid", shot(u, d) {
    const s = base();
    s.cam = cam(u / d, [-0.14, 0.97, 2.85], [-0.16, 0.97, 3.0]);
    s.kid = { ...s.kid, fx: 0.7, worry: 0.8, tug: 1 };
    return s; } },
  { line: "L06", pre: 0.1, hold: 0.05, speaker: "keeper", shot(u, d, T, ln) {
    const s = base(), v = wordAt(ln, "very", 0.7) - 0.05;
    s.cam = u < v ? cam(u / v, [0.45, 1.0, 1.75], [0.46, 1.02, 1.95]) : cam((u - v) / (d + 0.05 - v), [0.5, 1.1, 2.42], [0.5, 1.1, 2.5]);
    s.keeper = { ...s.keeper, stern: 1, open: 1, grab: 1, flame: tr([[0, 1], [d, 0.75]], u) };
    s.kid = { ...s.kid, fx: 0.7, worry: 1, tug: 1 };
    return s; } },
  { line: "L07", pre: 0.1, hold: 0.0, speaker: "kid", shot(u, d) {
    const s = base();
    s.cam = cam(u / d, [-0.2, 0.97, 2.85], [-0.24, 0.97, 2.97]);
    s.kid = { ...s.kid, X: lerp(K0[0], -0.16, ease(u / d)), fx: 0.6, grin: 1, lean: -4, tug: 1 };
    return s; } },
  { line: "L08", pre: 0.05, hold: 0.1, speaker: "keeper", shot(u, d, T, ln) {   // grip tightens, his grin drops, push into the candle glow
    const s = base(), tk = wordAt(ln, "takes", 0.65);
    s.cam = u < tk ? cam(u / tk, [0.25, 1.1, 1.3], [0.22, 1.1, 1.55]) : cam((u - tk) / (d + 0.1 - tk), [0.86, 1.6, 2.2], [0.86, 1.6, 2.68], "in");
    s.kid = { ...s.kid, X: -0.16, fx: 0.7, grin: tr([[0, 1], [0.4, 0]], u) > 0.5 ? 1 : 0, shock: tr([[0.35, 0], [0.55, 0.6]], u), tug: 1 };
    s.keeper = { ...s.keeper, grab: 1, stern: 1, open: 1, flame: tr([[0, 0.75], [d, 1]], u) };
    s.glow = tr([[tk + 0.3, 0], [d + 0.1, 1]], u);
    return s; } },
  // 4. HER ILLUSTRATION (cool light): fingers on the loop, one cheek, then the whole grin
  { line: "L09", pre: 0.15, hold: 0.05, shot(u, d, T, ln) {
    const s = base(), sm = wordAt(ln, "smile", 0.45), ea = wordAt(ln, "way", 0.75) - 0.05;
    s.grade = "cool"; s.glow = tr([[-0.15, 1], [0.25, 0]], u);
    if (u < ea) s.cam = cam((u + 0.15) / (ea + 0.15), [-1.08, 1.5, 5.28], [-1.1, 1.5, 5.36]);
    else s.cam = cam((u - ea) / (d + 0.05 - ea), [-1.2, 1.52, 5.38], [-1.2, 1.52, 5.46]);
    s.woman = { ...s.woman, turn: u < ea ? 0.2 : 0.45, look: 0.5, eyes: "stare", hand: tr([[0, 0], [0.6, 0.9]], u), scar: 1,
      unmask: u < ea ? tr([[sm - 0.1, 0], [sm + 0.25, 0.14]], u) : tr([[ea, 0.14], [ea + 0.7, 1, "out"]], u) };
    return s; } },
  { line: "L10", pre: 0.1, hold: 0.55, speaker: "woman", shot(u, d) {
    const s = base(); s.grade = "cool";
    s.cam = cam(u / (d + 0.55), [-1.2, 1.53, 5.46], [-1.2, 1.54, 5.56], "out");
    s.woman = { ...s.woman, turn: 0.45, look: 0.3, eyes: "stare", hand: 0.9, scar: 1, unmask: 1, tilt: tr([[0, 0], [d, 6]], u) };
    return s; } },
  // 5. PROOF: 1979 montage (flag, beside the group, ahead of the group, the flashlight)
  { line: "L11", pre: 0.15, hold: 0.1, shot(u, d, T, ln) {
    const s = base(), c1 = wordAt(ln, "spread", 0.35), c2 = wordAt(ln, "sent", 0.6), c3 = wordAt(ln, "and", 0.77);
    s.woman = null; s.kid = null; s.keeper = null; s.branch = false;
    const zg = 8.2 - (u + 0.15) * 0.55;   // the group walks toward the lens
    const group = [{ kind: "teacher", X: 0.62, Z: zg - 0.5, walk: u * 1.3, seed: 1 },
      ...Array.from({ length: 6 }, (_, i) => ({ kind: "pupil", X: -0.32 + (i % 2) * 0.5 + (Math.floor(i / 2) % 2) * 0.22, Z: zg + Math.floor(i / 2) * 0.7 + (i % 2) * 0.28, walk: u * 1.5 + i * 0.37, seed: i }))];
    if (u < c3) {
      s.pal = "dusk"; s.extras = group;
      if (u < c1) s.cam = cam((u + 0.15) / (c1 + 0.15), [0.35, 1.45, zg - 3.6], [0.3, 1.55, zg - 3.1]);
      else if (u < c2) s.cam = { x: -0.6, y: 1.05, z: zg - 2.4 };
      else s.cam = { x: 0.2, y: 1.25, z: zg - 3.1 };
    } else {
      const v = u - c3;
      s.cam = v < 0.55 ? cam(v / 0.55, [-0.36, 1.2, 4.35], [-0.38, 1.2, 4.5]) : cam((v - 0.55) / (d + 0.1 - c3 - 0.55), [0.2, 1.3, 1.2], [0.15, 1.28, 1.7]);
      s.extras = [{ kind: "police", X: -0.5, Z: 5.6, walk: v < 0.55 ? 0 : v * 1.2, seed: 2, beam: v < 0.3 ? 0 : 0.9, beamAng: v < 0.55 ? 0 : 18 + Math.sin(v * 2.2) * 14, raise: clamp(v / 0.3) }];
    }
    return s; } },
  // 6. ESCALATE: back in the street (the beam's glow becomes the candle)
  { line: "L12", pre: 0.15, hold: 0.0, speaker: "kid", shot(u, d) {
    const s = base(); s.glow = tr([[-0.15, 0.9], [0.2, 0]], u);
    s.cam = cam(u / d, [-0.14, 0.97, 2.85], [-0.17, 0.97, 3.0]);
    s.kid = { ...s.kid, X: -0.16, fx: 0.7, worry: 1, tug: 1 };
    s.keeper.grab = 1;
    return s; } },
  { line: "L13", pre: 0.1, hold: 0.2, speaker: "keeper", shot(u, d) {
    const s = base();
    s.cam = cam(u / d, [0.28, 1.05, 1.75], [0.3, 1.06, 1.98]);
    s.keeper = { ...s.keeper, stern: 0.3, flame: 0.55, grab: tr([[d * 0.75, 1], [d + 0.15, 0]], u) };
    s.kid = { ...s.kid, X: -0.16, fx: 0.7, worry: 1, tug: tr([[d * 0.75, 1], [d + 0.15, 0]], u) };
    return s; } },
  // 7. THE TURN (music box): every flicker she is closer, then she is behind him
  { line: "L14", pre: 0.1, hold: 0.1, music: "turn", shot(u, d) {
    const s = base(), steps = [[-1.2, 5.9], [-0.95, 5.25], [-0.7, 4.75], [-0.45, 4.3]];
    const fl = [0.15, d * 0.3, d * 0.55];
    const k = fl.filter((x) => u >= x + 0.08).length, p = steps[k];
    s.lampFl = 1 - 0.9 * blinkAmt(u, fl.map((x) => x + 0.02)) ** 0.5;
    const c2 = d * 0.72;
    s.cam = u < c2 ? cam(u / c2, [0.1, 1.32, 0.1], [0.04, 1.3, 0.6]) : cam((u - c2) / (d - c2), [-0.3, 1.14, 2.2], [-0.3, 1.14, 2.45]);
    s.woman = { X: p[0], Z: p[1], turn: 0, eyes: "stare", look: 1 };
    s.kid = { X: -0.16, Z: K0[1], fx: -0.6, worry: 1, shock: k >= 3 ? 0.3 : 0 };
    s.keeper = u < c2 ? { ...s.keeper, grab: 0, stern: 1, open: 1, flame: tr([[0, 0.55], [d, 0.3]], u) } : null;
    return s; } },
  { line: "L15", pre: 0.1, hold: 0.1, speaker: "woman", shot(u, d) {   // she dips toward his shoulder, both faces in frame
    const s = base();
    s.cam = cam(u / d, [-0.28, 1.28, 2.55], [-0.29, 1.28, 2.72]);
    s.woman = { X: -0.45, Z: 4.3, turn: 0.1, eyes: "stare", look: 1, lean: tr([[0, 0], [d, 7]], u) };
    s.kid = { X: -0.16, Z: K0[1], fx: tr([[d * 0.5, 0.6], [d * 0.8, -0.7]], u), shock: tr([[d * 0.4, 0], [d * 0.6, 0.5]], u) }; s.keeper = null;
    return s; } },
  { line: "L16", pre: 0.15, hold: 0.0, speaker: "kid", shot(u, d) {
    const s = base();
    s.cam = cam(u / d, [-0.18, 1.0, 2.8], [-0.2, 1.0, 2.92]);
    s.woman = { X: -0.45, Z: 4.3, turn: 0.1, eyes: "stare", look: 1, lean: 7 };
    s.kid = { X: -0.16, Z: K0[1], fx: -0.7, worry: 1, lean: -2 };
    s.keeper = null;
    return s; } },
  // she freezes: her eyes, a slow creep, one unfinished blink
  { line: null, dur: 0.85, pre: 0, hold: 0, shot(u, d) {
    const s = base();
    s.cam = cam(u / d, [-0.5, 1.5, 3.62], [-0.5, 1.5, 3.7]);
    s.woman = { X: -0.45, Z: 4.3, turn: 0.1, eyes: "stare", look: 0.4, tilt: tr([[0.1, 0], [0.6, -4]], u), open: 1 - 0.55 * clamp((u - 0.35) / 0.2) };
    s.kid = null; s.keeper = null;
    return s; } },
  // 8. THE ESCAPE: the throw, the bounce, she kneels and picks up piece by piece, THEN the two run
  { line: "L17", pre: 0.0, hold: 0.7, shot(u, d, T, ln) {
    const s = base(), hc = wordAt(ln, "hard", 0.2) - 0.05, c = wordAt(ln, "she", 0.45) - 0.05;
    s.woman = { X: -0.45, Z: 4.3, turn: 0.1, eyes: "stare", look: 0.2, tilt: -4 };
    s.kid = { X: -0.16, Z: K0[1], fx: 0.6, shock: 0.4 };
    s.keeper = { ...s.keeper, throw: tr([[0, 0], [0.45, 1]], u), flame: 0.6 };
    const fly = (uu) => CANDY.map((cd, i) => {
      const t0 = 0.3 + i * 0.025, f = clamp((uu - t0) / 0.45), bt = clamp((uu - t0 - 0.45) / 0.35), b = Math.abs(Math.sin(bt * Math.PI)) * 0.06 * (1 - bt);
      const X = lerp(0.35, cd.X, f), Z = lerp(2.9, cd.Z, f), Y = uu < t0 ? 1.0 : f < 1 ? lerp(1.0, 0, f) + Math.sin(f * Math.PI) * 0.35 : b;
      return { ...cd, X, Z, Y, gone: uu < t0 };
    });
    s.candies = fly(u);
    if (u < hc) s.cam = cam(u / hc, [0.42, 1.12, 1.75], [0.36, 1.1, 1.9]);                       // her hand opens, the candy leaves it
    else if (u < c) { s.cam = cam((u - hc) / (c - hc), [-0.62, 0.12, 3.3], [-0.62, 0.11, 3.42]); s.kid = null; s.keeper = null; }   // ground insert   // ground: pieces bounce on the stones
    else {
      const v = u - c, cr = tr([[0, 0], [0.4, 1]], v), per = 0.55;
      s.cam = cam(v / (d + 0.7 - c), [0.05, 1.2, 1.2], [0.02, 1.15, 1.55]);
      const picks = Math.floor(clamp(v - 0.45, 0, 9) / per);   // a piece leaves the stones at each reach peak
      const ph = (v - 0.45) / per, inHand = v > 0.45 && ph - Math.floor(ph) < 0.45 && picks >= 1 ? CANDY[Math.min(8, picks - 1)].col : null;
      s.woman = { X: -0.42, Z: 4.4, turn: 0, eyes: "calm", look: 0, crouch: cr, reach: cr * (0.6 + 0.4 * Math.cos(ph * Math.PI * 2)), hold: inHand, tilt: 0 };
      s.candies = CANDY.map((cd, i) => ({ ...cd, gone: i < picks }));
      const run = clamp((v - 1.05) / 1.6);   // they go only after the first pickup has read
      s.kid = { X: lerp(-0.16, 1.4, ease(run, "in")), Z: lerp(K0[1], 2.0, ease(run, "in")), fx: run > 0 ? 0.8 : 0.6, run: run > 0 ? v * 2.2 : null, lean: run > 0 ? 6 : 0, shock: 0.3 };
      s.keeper = { X: lerp(G0[0], 1.7, ease(run, "in")), Z: lerp(G0[1], 1.7, ease(run, "in")), run: run > 0 ? v * 2.2 : null, flame: 0.8, fx: 0.7, grab: 0 };
    }
    return s; } },
  // 9. THE END: the last piece leaves the stones, her eyes come up, she asks US
  { line: "L18", pre: 0.55, hold: 0.05, end: true, speaker: "woman", shot(u, d) {
    const s = base();
    s.kid = null; s.keeper = null;
    if (u < -0.05) {
      s.cam = cam((u + 0.55) / 0.5, [-0.32, 0.9, 2.9], [-0.33, 0.9, 3.05]);
      s.woman = { X: -0.42, Z: 4.4, turn: 0.6, eyes: "stare", look: 0, crouch: 1, reach: tr([[-0.55, 1], [-0.25, 0.3]], u), hold: u > -0.4 ? CANDY[8].col : null, tilt: 0 };
      s.candies = CANDY.map((cd, i) => ({ ...cd, gone: i < 8 || u > -0.35 }));
    } else {
      s.cam = cam(u / d, [-0.42, 1.5, 3.62], [-0.42, 1.5, 3.82], "out");
      s.woman = { X: -0.42, Z: 4.4, turn: 1, eyes: "stare", look: 0, crouch: 0, tilt: 0 };
    }
    return s; } },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur;
  const st = t + (b.pre || 0);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + (b.hold || 0) });
  t = st + d + (b.hold || 0) + (b.black || 0);
  if (b.black) TL.push({ black: true, at: t - b.black, end: t });
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
const SPK = { G: "keeper", K: "kid", W: "woman" };
const talkAt = (who, time) => {
  for (const b of TL) if (b.ln && SPK[b.ln.who] === who && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0;
  return 0;
};

// ---------------------------------------------------------------- captions: word by word in the upper third
const fixWords = (ws) => { const o = []; for (const w of ws) { if (/^-?ona\.?$/i.test(w[0]) && o.length && /^kuchisake$/i.test(o[o.length - 1][0])) { o[o.length - 1] = ["Kuchisake-onna.", o[o.length - 1][1], w[2]]; continue; } o.push(w[0] === "your" ? ["You're", w[1], w[2]] : w); } return o; };
const KEY = /^(kuchisake|1979|pretty|average|candy|mask|yes|ears)/i;
function captions(time) {
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.2, x.end));
  if (!b || !b.ln.words.length) return "";
  const u = time - b.lineAt, words = fixWords(b.ln.words);
  const chunks = []; let cur = [];
  words.forEach((w, i) => { cur.push(w); const brk = /[.,?!]$/.test(w[0]) || cur.length >= 4; if (brk || i === words.length - 1) { chunks.push(cur); cur = []; } });
  const ch = chunks.find((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] : 1e9)) || chunks[chunks.length - 1];
  const shown = ch.filter((w) => u >= w[1] - 0.04);
  if (!shown.length) return "";
  const txt = shown.map((w) => `<tspan fill="${KEY.test(w[0].replace(/[^a-z0-9]/gi, "")) ? "#ffc04a" : "#ffffff"}">${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  return `<text x="540" y="480" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${n(Math.min(74, 74 * 22 / Math.max(1, shown.map((w) => w[0]).join(" ").length)))}" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  if (b.black) return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/></svg>`;
  const u = time - b.lineAt, d = b.d;
  const s = b.shot(Math.max(u, -0.4), d, time, b.ln);
  const c = s.cam;
  const kt = (who) => talkAt(who, time);
  let kidS = s.kid ? { blink: blinkAmt(time % 4.1, [1.3]), ...s.kid, talk: kt("kid") } : null;
  const kd = kidS ? L.kid(c, kidS, time) : { svg: "", sleeve: null };
  const kp = s.keeper ? L.keeper(c, { blink: blinkAmt(time % 3.7, [2.2]), ...s.keeper, talk: kt("keeper") }, time, kd.sleeve) : { svg: "", arm: "" };
  const wm = s.woman ? L.woman(c, { ...s.woman, talk: kt("woman") }) : "";
  const lp = L.lamp(c, s.lampFl ?? 1);
  // draw far to near: the woman, the kid, the grandmother by depth
  const actors = [];
  if (s.woman) actors.push([s.woman.Z, wm]);
  if (s.kid) actors.push([s.kid.Z, kd.svg]);
  if (s.keeper) actors.push([s.keeper.Z, kp.svg + kp.arm]);
  for (const e of s.extras) actors.push([e.Z, L.extra(c, e)]);
  actors.sort((a, b2) => b2[0] - a[0]);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${L.defs(s.pal)}
    <g filter="url(#haze)">${L.sky(c, time, s.pal)}${L.far(c, s.pal)}</g>${L.ground(c, time, s.pal, s.candies.filter((x) => !x.Y))}${L.houses(c, time, -1, s.pal)}${L.houses(c, time, 1, s.pal)}${L.vending(c)}
    ${lp.s}${actors.map((a) => a[1]).join("")}
    ${L.ground({ ...c }, time, s.pal, []).length && s.candies.some((x) => x.Y) ? flying(c, s.candies.filter((x) => x.Y && !x.gone)) : ""}
    ${s.pal === "night" ? L.lampLight(lp.head, s.lampFl ?? 1) : ""}
    ${L.near(c, time, s.branch)}
    ${s.grade === "cool" ? `<rect width="${W}" height="${H}" fill="#3a5a9a" opacity="0.28" style="mix-blend-mode:multiply"/><rect width="${W}" height="${H}" fill="#9ab8ff" opacity="0.08" style="mix-blend-mode:screen"/>` : ""}
    ${s.glow > 0.01 ? `<defs><radialGradient id="cglow" cx="0.5" cy="0.45" r="0.75"><stop offset="0" stop-color="#fff2c8"/><stop offset="0.45" stop-color="#ffb24a"/><stop offset="1" stop-color="#c4521a"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#cglow)" opacity="${n(Math.min(1, s.glow) * 0.95)}"/>` : ""}
    ${L.vignette()}
    ${captions(time)}</svg>`;
}
function flying(c, list) {
  return list.map((cd) => { const q = L.P(c, cd.X, cd.Y + 0.012, cd.Z), r = 0.014 * q.s; return `<ellipse cx="${n(q.x)}" cy="${n(q.y)}" rx="${n(r * 1.15)}" ry="${n(r * 0.9)}" fill="${cd.col}" stroke="${L.INK}" stroke-width="${n(Math.max(0.6, r * 0.12))}"/>`; }).join("");
}

// ---------------------------------------------------------------- the sound mix (voices + music + a few real sounds)
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export function prepare(outPath) {
  mkdirSync("out/legend-ep01", { recursive: true });
  const turn = TL.find((b) => b.music === "turn").lineAt - 0.1, endT = DUR;
  const ins = [], f = [];
  const add = (file, at, gain = 1, extra = "") => { ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(at * 1000)}:all=1[a${k}]`); };
  for (const b of TL) if (b.ln) add(`${VOICE}/${b.ln.id}.wav`, b.lineAt, b.ln.who === "W" ? 0.9 : b.ln.who === "K" ? 1.45 : 1);   // kid +3 dB (Jonny 26 Nov: louder)
  add("assets/music/ai/orchestra-suspense/orchestra-suspense-01.ogg", 0, 0.42, `aloop=loop=-1:size=2e9,atrim=0:${turn.toFixed(2)},afade=t=out:st=${(turn - 0.6).toFixed(2)}:d=0.6,`);
  add("assets/music/ai/spooky/spooky-02.ogg", turn, 0.4, `aloop=loop=-1:size=2e9,atrim=0:${(endT - turn).toFixed(2)},afade=t=in:d=0.4,`);
  const sfx = (p) => `assets/sfx/${p}`;
  const b1 = TL[0]; add(sfx("kenney/rpg/cloth1.ogg"), b1.lineAt + 0.75, 0.6);
  const b8 = TL.find((b) => b.line === "L08"); add(sfx("kenney/rpg/cloth1.ogg"), b8.lineAt + 0.25, 0.6);
  const b17 = TL.find((b) => b.line === "L17");
  CANDY.forEach((_, i) => add(sfx(`kenney/impact/impactGlass_light_00${i % 5}.ogg`), b17.lineAt + 0.85 + i * 0.03, 0.35));
  for (let i = 0; i < 8; i++) add(sfx(`kenney/impact/footstep_concrete_00${i % 5}.ogg`), b17.lineAt + wordAt(b17.ln, "she", 0.4) + 0.35 + i * 0.24, 0.5);
  const mixPath = "out/legend-ep01/mix.wav";
  const k = ins.length / 2;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync("out/legend-ep01/timeline.json", JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +(b.lineAt ?? 0).toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
export const GAIN = 1;
