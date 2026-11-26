// Legend ep 02: La Lechuza, code-drawn. Built from SHOTS.md, then re-cut to Sol's round-1 list (SOL-R1.md, 60.4 s).
//   node tools/svg2d/render.mjs storyboards/series/legend/ep02/ep02.mjs out/legend-ep02/ep02-draft.mp4
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as MX from "../../../../tools/svg2d/lib/legend-mexico.mjs";
const { lerp, clamp, tr, ease, hash, blinkAmt, n, P, toScreen } = L;

export const W = 1080, H = 1920, FPS = 30;
const VOICE = "out/legend-ep02/voice", SPEC = JSON.parse(readFileSync("storyboards/series/legend/ep02/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
// where each voice line starts (s). Sol's list is the target; the voices were trimmed (pauses cut inside the wavs) to fit it.
const VP = { L01: 1.15, L02: 3.55, L03: 4.93, L04: 14.0, L05: 15.9, L06: 19.3, L07: 22.4, L08: 25.05, L09: 27.3, L10: 28.8, L11: 33.8, L12: 35.95, L13: 38.95, L14: 41.25, L15: 42.65, L16: 44.05, L17: 49.4, L18: 51.0, L19: 53.9, L20: 59.35 };

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  const s = new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + (data.length & ~1)));
  return { sr, s };
}
for (const ln of Object.values(LINE)) {
  ln.at = VP[ln.id];
  if (!existsSync(`${VOICE}/${ln.id}.wav`)) { ln.dur = 0.6 + ln.text.split(" ").length * 0.36; ln.env = []; ln.words = []; continue; }
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.words = existsSync(`${VOICE}/${ln.id}.words.json`) ? JSON.parse(readFileSync(`${VOICE}/${ln.id}.words.json`, "utf8")) : [];
  const tok = ln.text.split(/\s+/);   // the aligner mishears names and adds words: show the written text on the aligned times
  if (ln.words.length > tok.length) ln.words = ln.words.slice(0, tok.length);
  if (ln.words.length === tok.length) ln.words = ln.words.map((w, i) => [tok[i], ...w.slice(1)]);
}
// absolute time of a word in a line (first word starting with `word`)
const WA = (id, word, frac = 0.5) => { const ln = LINE[id], w = ln.words.find((x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)); return ln.at + (w ? w[1] : ln.dur * frac); };

// ---------------------------------------------------------------- helpers
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); const o = { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; if (a[3] != null) o.h0 = lerp(a[3], b[3] ?? a[3], e); return o; };
// face-framed camera: face centre at screen y = ys, dist metres from the subject (s = 1300 / dist px per metre)
const fc = (X, Zf, dist, ys = 1000, fy = 0.9) => [X, fy + (1140 - ys) / (1300 / dist), Zf - dist];
const fk = (X, Zf, dist, ys = 1030) => fc(X, Zf, dist, ys, 0.82), fg = (X, Zf, dist, ys = 1030) => fc(X, Zf, dist, ys, 0.98);
const R = MX.HOUSE.roost, ROOM = MX.ROOM;
const KS = { X: 0.4, Z: 4.2, fx: -0.75 }, GS = { X: 0.92, Z: 3.85, fx: -0.7, stern: 1, open: 1 };
const wobble = (u, f, a) => Math.sin(u * f) * a;
const OWLIN = (o = {}) => ({ ...ROOM.owlSpot, Y: -0.62, turn: 0, wide: 0.3, look: 0.4, shadow: false, ...o });
const inn = (th, c, o = {}) => ({ k: "in", th, cam: c, kid: { ...KS }, gm: { ...GS }, ...o });
const yardS = (th, c, o = {}) => ({ k: "yard", th, cam: c, moon: [800, 360, 125], ...o });
const OWLP = (a, b, u, extra = {}) => ({ ...R, ...MX.owlPose(a, b, u), ...extra });
// the shutters, one continuous state through the whole film: seam pried at 0.5, slammed shut at 1.1, shut until the eye
// pries a narrow gap at 37.6 (it stays), Grandma throws them open at 44.15 (they stay open to the end).
const SHUT = (T) => ({
  open: T < 1.1 ? tr([[0.5, 0], [0.85, 0.15]], T) : T < 1.2 ? tr([[1.1, 0.15], [1.2, 0]], T) : T < 37.6 ? 0 : T < 44.1 ? tr([[37.45, 0], [37.65, 0.32], [38.2, 0.3]], T) : tr([[44.1, 0.3], [44.35, 1]], T),
  latch: T < 1.1 ? tr([[0.1, 0], [0.55, 0.8]], T) : T < 37.2 ? 0 : T < 44.1 ? tr([[37.2, 0], [37.4, 0.35], [37.7, 0.25]], T) : 0.2,
});

// ---------------------------------------------------------------- the shots (Sol's 60.4 s list). u = seconds into the shot, T = film time
const OWLGAP = (o = {}) => OWLIN({ human: 1, wide: 1, Z: 4.95, X: 0.12, look: 0.2, ...o });
const GM_WIN = { ...GS, X: 0.74, Z: 4.0, fx: -0.7, lean: 8 }, KID_BEHIND = { ...KS, X: 1.0, Z: 4.5, fx: -0.5, worry: 1 };
const SHOTS = [
  // 0 latch insert: the boy's fingers on the bar, it lifts, the seam opens
  { id: "S0", at: 0, dur: 1.1, shot(u, d) {
    return inn(0.2, cam(u / d, [0.07, 0.88, 3.85], [0.07, 0.9, 3.72], "out"), { kid: { ...KS, X: 0.36, Z: 4.5, reachL: tr([[0, 0.8], [0.55, 1]], u), fx: -0.8, hop: 7 }, gm: null }); } },
  // 1 slam + Grandma
  { id: "S1", at: 1.1, dur: 2.4, shot(u, d) {
    const sh = u < 0.2 ? wobble(u, 160, 0.03) : 0, v = clamp((u - 1.0) / 1.3);
    const c = cam(u / d, fc(0.5, 4.0, 1.7, 980), fc(0.72, 3.9, 1.0 + 0.0, 1000)); c.x += sh;
    return inn(0.25, c, { kid: { ...KS, fx: -0.6, shock: tr([[0, 0], [0.15, 0.5]], u), reachL: tr([[0, 1], [0.3, 0]], u) }, gm: { ...GS, fx: lerp(-0.7, -0.3, v), grab: tr([[-0.1, 0.0], [0.05, 1], [0.35, 1], [0.7, 0]], u), grabTo: [0.28, 1.2, 4.55] } }); } },
  { id: "S2", at: 3.5, dur: 1.3, shot(u, d) {
    return inn(0.3, cam(u / d, fk(0.36, 4.2, 0.9), fk(0.36, 4.2, 0.68)), { kid: { ...KS, fx: -0.2, shock: 0.5 }, gm: null }); } },
  // 3 first narrator block: the owl shows its back, then turns its face to us on "Lechuza"
  { id: "S3", at: 4.8, dur: 1.7, shot(u, d) {
    return yardS(0.4, cam(u / d, [-0.3, 1.6, 0.3, 1290], [-0.25, 1.6, 0.9, 1290]), { moon: [840, 380, 125], owl: OWLP("perch", "perch", 0, { facing: -1, turn: lerp(0.1, 0.6, u / d), look: 0, blink: 0 }) }); } },
  { id: "S4", at: 6.5, dur: 1.5, shot(u, d) {
    return yardS(0.42, cam(u / d, [0.5, 2.3, 3.2, 1420], [0.58, 2.35, 3.8, 1420]), { moon: [850, 450, 150], owl: OWLP("perch", "perch", 0, { facing: -1, turn: tr([[0, 0.6], [0.3, 0.9], [0.75, 2.0]], u), look: tr([[0.75, 0], [1.0, 0.3]], u), blink: blinkAmt(u, [1.2]) }) }); } },
  { id: "S5", at: 8.0, dur: 2.3, shot(u, d) {
    return yardS(0.45, cam(u / d, [0.5, 2.6, 4.7, 1330], [0.6, 2.65, 5.5, 1330]), { moon: [820, 330, 125], owl: OWLP("perch", "watch", 1, { spread: lerp(0, 0.25, ease(u / d)), puff: lerp(0, 0.3, u / d), look: 0.3, blink: blinkAmt(u, [1.4]) }) }); } },
  { id: "S6", at: 10.3, dur: 1.7, shot(u, d) {
    const cr = 0.12;
    return yardS(0.5, cam(u / d, [0.78, 3.35, 6.1, 1360], [0.78, 3.37, 6.7, 1360], "out"), { near: false, light: 0.7, moon: [790, 520, 170], owl: OWLP("perch", "cry", clamp(tr([[cr, 0], [cr + 0.35, 1, "out"]], u)), { turn: 0, look: 0, pupil: 0.42, beak: clamp(tr([[cr, 0], [cr + 0.3, 1]], u)) * (0.75 + 0.25 * Math.sin(u * 22)) }) }); } },
  { id: "S7", at: 12.0, dur: 1.9, shot(u, d) {   // inside, on the latch: "so children open the window"
    return inn(0.5, cam(u / d, [0.12, 0.9, 3.3], [0.1, 0.88, 3.1]), { kid: null, gm: null, latchShake: 0.03 * Math.sin(u * 23) }); } },
  { id: "S8", at: 13.9, dur: 2.0, shot(u, d) {
    return inn(0.35, cam(u / d, fc(0.84, 4.0, 1.5), fc(0.84, 4.0, 1.25)), { kid: { ...KS, fx: tr([[0, -0.5], [0.4, 0.6]], u), worry: 0.7 }, gm: { ...GS, fx: -0.2 } }); } },
  { id: "S9", at: 15.9, dur: 2.6, shot(u, d) {   // Grandma deadpan in frame through "roof"
    return inn(0.4, cam(u / d, [...fg(0.95, 3.85, 0.85), 1140], [...fg(0.95, 3.85, 0.7), 1140]), { kid: null, gm: { ...GS, fx: lerp(-0.2, 0.25, ease(clamp((u - 2.1) / 0.4))) } }); } },
  // 10 ceiling insert, dust and the first creak
  { id: "S10", at: 18.5, dur: 0.5, shot(u, d) {
    return inn(0.45, { x: 0.3, y: 1.6, z: 2.7, h0: 2750 }, { kid: null, gm: null, dust: u + 0.45 }); } },
  // 11 roof edge: a talon lifts, plants, takes weight
  { id: "S11", at: 19.0, dur: 1.1, shot(u, d) {
    const w = clamp((u - 0.3) / 0.45), x = lerp(0.95, 0.55, ease(w)), hop = Math.sin(w * Math.PI) * 0.14;
    return yardS(0.55, { x: 0.45, y: 2.85, z: 6.5, h0: 1150 }, { near: false, moon: [860, 360, 120], owl: OWLP("perch", "watch", 0.3, { X: x, Y: R.Y + hop, crouch: lerp(0.35, 0.1, Math.sin(w * Math.PI)), facing: -1, turn: -0.2, look: -0.4, lean: -6 * Math.sin(w * Math.PI) }) }); } },
  { id: "S12", at: 20.1, dur: 0.8, shot(u, d) {
    return inn(0.55, cam(u / d, [...fc(0.66, 4.0, 1.6), 1330], [...fc(0.66, 4.0, 1.6), 1470]), { kid: { ...KS, fx: lerp(0.3, -0.85, ease(u / d)), worry: 0.8 }, gm: { ...GS, fx: lerp(0.3, -0.85, ease(u / d)) }, flame: 0.6, dust: 0.3 + u * 0.6 }); } },
  { id: "S13", at: 20.9, dur: 1.4, shot(u, d) {   // silence: slow push on the shut seam
    return inn(0.6, cam(u / d, [0.02, 0.98, 2.6], [0.02, 0.98, 3.5]), { kid: null, gm: null, flame: 0.55 }); } },
  { id: "S14", at: 22.3, dur: 2.7, shot(u, d) {   // the mimic: Grandma's lips stay closed
    return inn(0.75, cam(u / d, fc(0.66, 4.0, 1.5), fc(0.86, 3.85, 0.95)), { kid: { ...KS, fx: tr([[0, -0.7], [1.75, -0.7], [2.1, 0.6]], u), worry: 0.9 }, gm: { ...GS, fx: -0.2 }, flame: 0.45, noTalk: true }); } },
  { id: "S15", at: 25.0, dur: 2.0, shot(u, d) {
    return inn(0.8, cam(u / d, fk(0.38, 4.2, 0.8), fk(0.38, 4.2, 0.6)), { kid: { ...KS, fx: 0.7, shock: 0.8, worry: 1 }, gm: null, flame: 0.4 }); } },
  { id: "S16", at: 27.0, dur: 1.8, shot(u, d) {   // "I know", the eyes slide to the shutter
    return inn(0.8, cam(u / d, fg(0.93, 3.85, 0.75), fg(0.93, 3.85, 0.5)), { kid: null, gm: { ...GS, fx: tr([[0, -0.1], [1.1, -0.1], [1.5, -0.95]], u), stern: 1, look: tr([[0, 0.3], [1.0, 0.3], [1.3, -1]], u) }, flame: 0.4 }); } },
  // 17-19 the fact: the real owl
  { id: "S17", at: 28.8, dur: 2.5, shot(u, d) {
    return { k: "fence", th: 0.3, cam: cam(u / d, [-2.9, 1.15, 4.4, 1300], [-2.9, 1.12, 4.8, 1300], "out"), owl: { X: -2.9, Y: 1.04, Z: 5.5, facing: 1, turn: 0.1, beak: 0, blink: blinkAmt(u, [1.2]) } }; } },
  { id: "S18", at: 31.3, dur: 1.7, shot(u, d) {
    return { k: "fence", th: 0.3, cam: cam(u / d, [-2.9, 1.2, 4.7, 1250], [-2.9, 1.25, 5.0, 1250], "out"), owl: { X: -2.9, Y: 1.04, Z: 5.5, facing: 1, turn: -0.1, beak: 0, blink: blinkAmt(u, [1.0]) } }; } },
  { id: "S19", at: 33.0, dur: 0.8, shot(u, d) {
    const sc = WA("L10", "scream", 0.85) - 33.0 + 0.02, on = u >= sc, c = cam(u / d, [-2.9, 1.37, 4.95], [-2.9, 1.37, 5.05]);
    if (u > 0.68) c.x += wobble(u, 140, 0.004) * (1 - clamp((u - 0.68) / 0.12));
    return { k: "fence", th: 0.3, cam: c, owl: { X: -2.9, Y: 1.04, Z: 5.5, facing: 1, turn: 0, beak: on ? clamp(0.4 + 0.6 * Math.abs(Math.sin((u - sc) * 18))) : 0 } }; } },
  // 20-22 the salt
  { id: "S20", at: 33.8, dur: 0.9, shot(u, d) {   // Grandma's real free arm reaches the shelf jar and brings it back
    const r = u / d, g = { ...GS, X: -1.3, Z: 3.9, fx: -0.9 }, rest = [g.X - 0.18, 0.7, g.Z], jar = [ROOM.shelfJar.X + 0.04, 1.36, ROOM.shelfJar.Z], held = [g.X - 0.1, 0.9, g.Z - 0.05];
    const hand = r < 0.5 ? [lerp(rest[0], jar[0], ease(r / 0.5)), lerp(rest[1], jar[1], ease(r / 0.5)), lerp(rest[2], jar[2], ease(r / 0.5))] : [lerp(jar[0], held[0], ease((r - 0.5) / 0.5)), lerp(jar[1], held[1], ease((r - 0.5) / 0.5)), lerp(jar[2], held[2], ease((r - 0.5) / 0.5))];
    const jy = r < 0.5 ? 1.3 : hand[1] - 0.12;
    return inn(0.6, cam(u / d, [-0.9, 1.15, 1.9, 1140], [-1.0, 1.1, 2.3, 1140]), { kid: null, gm: { ...g, grab: 1, grabTo: hand }, jar: false, jarAt: { X: r < 0.5 ? jar[0] : hand[0], Y: jy, Z: r < 0.5 ? jar[2] - 0.02 : hand[2] - 0.02, tilt: 0 } }); } },
  { id: "S21", at: 34.7, dur: 1.2, shot(u, d) {   // the jar tips over her open palm: empty, a few grains
    const g = { ...GS, X: -1.3, Z: 3.9, fx: -0.9 }, p = u / d, tilt = -100 * ease(clamp(p / 0.35));
    return inn(0.6, cam(u / d, [-1.4, 0.76, 2.4], [-1.4, 0.76, 2.55]), { kid: null, gm: { ...g, grab: 1, grabTo: [g.X + 0.04, 0.54, g.Z - 0.08] }, jar: false, palmDeco: [g.X + 0.04, 0.54, g.Z - 0.08], jarAt: { X: g.X + 0.2, Y: 0.6, Z: g.Z - 0.1, tilt, size: 0.85, lid: false, pour: p > 0.3 ? 0.08 : 0, fall: 0.2 } }); } },
  { id: "S22", at: 35.9, dur: 1.3, shot(u, d) {   // the bowl rises into frame between his hands on "movie"
    const lift = ease(clamp((u - 0.3) / 0.35));
    return inn(0.6, cam(u / d, fk(0.38, 4.2, 1.0, 1000), fk(0.38, 4.2, 0.85, 1000)), { kid: { ...KS, fx: tr([[0, 0.5], [0.6, 0.1]], u), shock: 0.2, worry: 0.6 }, gm: null, bowlY: lerp(0.1, 0.6, lift), jar: false }); } },
  // 23 eye in the gap, latch bowing first
  { id: "S23", at: 37.2, dur: 1.7, shot(u, d) {
    const ow = ease(clamp((u - 0.35) / 0.4));
    return inn(1, cam(u / d, [0.0, 0.98, 3.0], [0.0, 0.98, 3.6], "out"), { kid: null, gm: null, flame: 0.15, candle: 0.15, jar: false, owl: OWLGAP({ X: lerp(0.9, 0.12, ow), wide: ow }) }); } },
  { id: "S24", at: 38.9, dur: 2.3, shot(u, d) {
    return inn(0.9, cam(u / d, fg(0.93, 3.85, 0.85), fg(0.93, 3.85, 0.65)), { kid: null, gm: { ...GS, fx: -0.2, sleeve: u }, flame: 0.3, owl: OWLGAP() }); } },
  { id: "S25", at: 41.2, dur: 1.4, shot(u, d) {
    return inn(0.9, cam(u / d, fk(0.36, 4.2, 0.85), fk(0.36, 4.2, 0.65)), { kid: { ...KS, fx: 0.7, worry: 1 }, gm: null, flame: 0.3, owl: OWLGAP() }); } },
  { id: "S26", at: 42.6, dur: 1.4, shot(u, d) {
    return inn(0.9, cam(u / d, fg(0.93, 3.85, 0.8), fg(0.93, 3.85, 0.6)), { kid: null, gm: { ...GS, fx: -0.1, stern: 1 }, flame: 0.3, owl: OWLGAP() }); } },
  // 27-29 the insults, one picture each
  { id: "S27", at: 44.0, dur: 1.9, shot(u, d) {
    const v = ease(clamp((u - 0.1) / 0.3));
    return inn(0.7 - 0.2 * clamp(u / 1.5), cam(u / d, fc(0.5, 4.6, 2.5), fc(0.5, 4.6, 2.1)), { kid: KID_BEHIND, gm: { ...GM_WIN, grab: tr([[-0.1, 0], [0.12, 1], [0.5, 1], [0.8, 0]], u), grabTo: [lerp(0.05, -0.5, ease(clamp((u - 0.1) / 0.3))), 1.05, 4.55] }, flame: 0.4, owl: OWLIN({ human: 1, Z: lerp(4.95, 5.7, v), X: lerp(0.12, 0, v), wide: lerp(1, 0.3, v) }) }); } },
  { id: "S28", at: 45.9, dur: 1.3, shot(u, d) {
    return inn(0.5, cam(u / d, fc(0.0, 4.6, 2.5, 1250), fc(0.0, 4.6, 2.1, 1250)), { kid: null, gm: null, flame: 0.4, owl: OWLIN({ human: 1, Z: 5.2, wide: 0.4 * Math.sin(clamp((u - 0.2) / 0.3) * Math.PI) + 0.3, blink: clamp(1 - Math.abs(u - Math.min(WA("L16", "pillow", 0.7) - 45.9 + 0.05, 1.05)) / 0.22) }) }); } },
  { id: "S29", at: 47.2, dur: 2.1, shot(u, d) {
    const th = tr([[0, 0.5], [1.0, 0.5], [1.5, 0.8]], u);
    return inn(th, cam(u / d, fc(0.5, 4.2, 1.9), fc(0.5, 4.2, 1.65)), { kid: null, gm: { ...GS, X: 0.78, Z: 4.0, fx: -0.5, lean: 4, grab: tr([[1.45, 0], [1.75, 1]], u), grabTo: [0.77, 0.95, 4.0] }, flame: 0.4, owl: OWLIN({ human: 1, Z: 5.7 }) }); } },
  { id: "S30", at: 49.3, dur: 1.6, shot(u, d) {
    const w = ease(clamp(u / 1.2)), X = lerp(1.0, 0.82, w);
    return inn(0.8, cam(u / d, fc(0.64, 4.0, 1.9), fc(0.6, 4.0, 1.6)), { kid: { ...KS, X, Z: lerp(4.5, 4.2, w), fx: -0.8, worry: 1, run: u < 1.2 ? u * 1.5 : null }, gm: { ...GS, X: 0.92, fx: -0.7, grab: tr([[0, 1], [0.9, 1], [1.1, 0]], u) }, owl: OWLIN({ human: 1, Z: 5.7 }) }); } },
  { id: "S31", at: 50.9, dur: 1.2, shot(u, d) {
    const l = ease(clamp((u - 0.15) / 1.0));
    return inn(0.95, cam(u / d, fk(0.5, 4.4, 1.9), fk(0.5, 4.4, 1.9)), { kid: { ...KS, X: 0.82, Z: 4.2, fx: -0.3, worry: 0.8 }, gm: null, owl: OWLIN({ human: 1, Z: lerp(5.9, 5.4, l), lean: lerp(0, 3, l), wide: 0.2 }) }); } },
  { id: "S32", at: 52.1, dur: 1.6, shot(u, d) {
    const l = ease(clamp(u / 0.9));
    return inn(0.95, cam(u / d, fk(0.5, 4.4, 1.9), fk(0.5, 4.4, 1.85)), { kid: { ...KS, X: 0.82, Z: 4.2, fx: -0.3, worry: 0.8 + 0.2 * clamp((u - 1.0) / 0.3) }, gm: null, owl: OWLIN({ human: 1, Z: lerp(5.4, 4.9, l), lean: lerp(3, 6, l), wide: 0.2 }) }); } },
  { id: "S33", at: 53.7, dur: 2.3, shot(u, d) {
    return inn(0.9, cam(u / d, fk(0.84, 4.2, 0.8), fk(0.84, 4.2, 0.65)), { kid: { ...KS, X: 0.82, fx: -0.3, grin: 0, worry: 0.3 }, gm: null, owl: OWLIN({ human: 1, Z: 4.9, lean: 6 }) }); } },
  { id: "S34", at: 56.0, dur: 1.3, shot(u, d) {
    const f = clamp(u / 0.2), rc = ease(clamp((u - 0.2) / 1.0));
    return inn(0.9, cam(u / d, [0.0, 1.0, 2.5], [0.0, 1.0, 3.0]), { kid: null, gm: null, owl: OWLIN({ human: 1, Z: lerp(5.0, 6.0, rc), ...MX.owlPose("perch", "flinch", f), lean: -4 * f, wide: 1 * f }) }); } },
  { id: "S35", at: 57.3, dur: 1.9, shot(u, d) {
    const up = ease(clamp(u / 0.95)), out = ease(clamp((u - 0.85) / 1.0), "in");
    const pose = MX.owlPose("flinch", "flight", clamp(u / 0.4));
    const owl = { ...R, ...pose, X: lerp(0.8, 0.4, up) - 15 * out, Y: lerp(0.15, 3.7, up) + 2.5 * out, Z: lerp(8.8, 9.0, up) + 4 * out, facing: 1, lift: Math.sin(u * 17) * 0.9, lean: -38 * clamp((u - 0.7) / 0.5) * -1 * -1, look: -0.3, shadow: false };
    const loose = u > 0.6 ? [0, 1, 2, 3].map((i) => { const q = u - 0.6 - i * 0.07; return { X: R.X - 0.5 + i * 0.36 + Math.sin(q * 3 + i) * 0.15, Y: R.Y + 1.0 + 0.2 * i - q * (0.7 + 0.12 * i), Z: R.Z - 0.1, rot: i * 70 + q * 160 * (i % 2 ? 1 : -1), size: 0.9 }; }).filter((f) => f.Y > 0.05) : [];
    return yardS(tr([[0, 0.85], [0.9, 0.85], [1.9, -1]], u), cam(u / d, [0.3, 2.0, 2.0, 1050], [0.0, 2.7, 1.2, 1000]), { moon: [780, 380, 125], owl, loose, salt: 1, shutters: 1 }); } },
  { id: "S36", at: 59.2, dur: 1.2, shot(u, d, T) {
    return inn(-1, cam(u / d, fc(0.84, 4.0, 1.5), fc(0.84, 4.0, 1.25)), { kid: { ...KS, fx: -0.5, grin: 1, X: 0.35 }, gm: { ...GS, X: 0.98, fx: -0.6, stern: 0, nod: T - 59.2 }, flame: tr([[0, 1.2], [1.2, 1]], u), salt: 1, jar: false }); } },
];

// ---------------------------------------------------------------- the timeline
const TL = SHOTS.map((s) => ({ ...s, lineAt: s.at, d: s.dur, end: s.at + s.dur }));
export const DUR = Math.round(TL[TL.length - 1].end * FPS) / FPS;
export const TIMELINE = TL;
const SPK = { G: "gm", K: "kid" };
const talkAt = (who, time) => {
  for (const ln of Object.values(LINE)) if (SPK[ln.who] === who && time >= ln.at && time < ln.at + ln.dur) return ln.env[Math.floor((time - ln.at) * FPS)] || 0;
  return 0;
};

// ---------------------------------------------------------------- captions: word by word, short groups so they never touch the edges
const KEY = /^(lechuza|baby|babies|owl|scream|salt|insult|breathe)/i;
function captions(time) {
  const ln = Object.values(LINE).find((x) => x.words.length && time >= x.at && time < x.at + x.dur);
  if (!ln) return "";
  const u = time - ln.at, words = ln.words, it = ln.who === "O" ? ` font-style="italic"` : "";
  const chunks = []; let cur = [];
  words.forEach((w, i) => {
    cur.push(w); const next = words[i + 1], len = cur.map((x) => x[0]).join(" ").length;
    if (/[.,?!]$/.test(w[0]) || cur.length >= 4 || (next && len + 1 + next[0].length > 19) || i === words.length - 1) { chunks.push(cur); cur = []; }
  });
  const ch = chunks.find((c, i) => u < (chunks[i + 1] ? chunks[i + 1][0][1] : 1e9)) || chunks[chunks.length - 1];
  const shown = ch.filter((w) => u >= w[1] - 0.04);
  if (!shown.length) return "";
  const txt = shown.map((w) => `<tspan fill="${KEY.test(w[0].replace(/[^a-z0-9]/gi, "")) ? "#ffc04a" : "#ffffff"}">${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  return `<text x="540" y="420" text-anchor="middle"${it} font-family="Inter" font-weight="900" font-size="74" stroke="#120c24" stroke-width="14" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${txt}</text>`;
}

// ---------------------------------------------------------------- props and little hand-drawn extras
function bowl(c, X, Z, Y = 0.62, tilt = 0) {
  const p = P(c, X, Y, Z), k = p.s / 100 * 0.62;
  const kern = [[-9, -14], [-3, -17], [4, -15], [10, -13], [0, -12]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${3.6 - (i % 2) * 0.6}" fill="${i % 2 ? "#fff3d6" : "#ffe9b8"}" stroke="${L.INK}" stroke-width="0.8"/>`).join("");
  return `<g transform="translate(${n(p.x)},${n(p.y)}) rotate(${tilt}) scale(${k.toFixed(3)})">
    <path d="M-20,-12 Q-22,6 -8,10 L8,10 Q22,6 20,-12 Z" fill="#c8583a" stroke="${L.INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M-20,-12 L20,-12" stroke="${L.INK}" stroke-width="1.4"/>
    <path d="M-16,-3 L16,-3" stroke="#ffd36a" stroke-width="2.2"/>${kern}</g>`;
}
function dust(u) {
  if (!u) return "";
  let s = "";
  for (let i = 0; i < 46; i++) {
    const t0 = hash(i + 301) * 0.9, q = u - t0; if (q < 0) continue;
    const x = 120 + hash(i + 31) * 840 + Math.sin(q * 3 + i) * 10, y = 40 + q * (260 + hash(i + 9) * 220), a = clamp(1 - q / 1.6);
    if (y > 1750) continue;
    s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(2.5 + hash(i + 77) * 3.5)}" fill="${hash(i) > 0.5 ? "#d9a05a" : "#e8c48a"}" opacity="${n(a * 0.9)}"/>`;
  }
  return s;
}
function post(c, X, Z) {
  const a = P(c, X - 0.07, 0, Z), b = P(c, X + 0.07, 0, Z), cc = P(c, X + 0.07, 1.0, Z), d = P(c, X - 0.07, 1.0, Z), e = P(c, X, 0.99, Z + 0.08);
  const pts = (...q) => q.map((p) => `${n(p.x)},${n(p.y)}`).join(" ");
  const rail = (Y) => { const l = P(c, X - 2.0, Y, Z), r = P(c, X + 2.0, Y, Z), lt = P(c, X - 2.0, Y + 0.07, Z), rt = P(c, X + 2.0, Y + 0.07, Z); return `<polygon points="${pts(l, r, rt, lt)}" fill="#6a4a3a" stroke="${L.INK}" stroke-width="2"/>`; };
  return `${rail(0.45)}<polygon points="${pts(a, b, cc, d)}" fill="#7a5640" stroke="${L.INK}" stroke-width="3"/><polygon points="${pts(d, cc, e)}" fill="#8a6850" stroke="${L.INK}" stroke-width="2"/>`;
}

// arms/hands drawn in world space: a sleeve from a shoulder to a hand with a skin hand on the end
const SKIN = "#e6bf9e", KSKIN = "#f3cdb0";
function arm(c, a, b, Z, o = {}) {
  const A = P(c, a[0], a[1], Z), B = P(c, b[0], b[1], o.hz ?? Z), E = { x: lerp(A.x, B.x, 0.5) + (o.bend ?? -0.04) * A.s, y: Math.max(A.y, B.y) * 0.5 + (A.y + B.y) * 0.25 + 0.05 * A.s };
  const d = `M${n(A.x)},${n(A.y)} Q${n(E.x)},${n(E.y)} ${n(B.x)},${n(B.y)}`, w = (o.w ?? 0.085) * A.s, hr = (o.hr ?? 0.045) * A.s;
  return `<path d="${d}" stroke="${L.INK}" stroke-width="${n(w + 4)}" stroke-linecap="round" fill="none"/><path d="${d}" stroke="${o.col ?? "#2b2f6b"}" stroke-width="${n(w)}" stroke-linecap="round" fill="none"/>
    <ellipse cx="${n(B.x)}" cy="${n(B.y)}" rx="${n(hr * (o.flat ? 1.5 : 1))}" ry="${n(hr * (o.flat ? 0.7 : 1.15))}" fill="${o.skin ?? SKIN}" stroke="${L.INK}" stroke-width="2.4"/>`;
}
function fingersOnBar(c, amt, latch) {
  if (amt <= 0) return "";
  const q = P(c, 0.15 - 0.1 * latch, 0.83 + 0.2 * latch, 4.5), s = q.s;
  const f = (i) => `<ellipse cx="${n(q.x + (i - 1) * 0.026 * s)}" cy="${n(q.y - 0.012 * s + Math.abs(i - 1) * 0.004 * s)}" rx="${n(0.013 * s)}" ry="${n(0.034 * s)}" fill="${KSKIN}" stroke="${L.INK}" stroke-width="2"/>`;
  return `<g opacity="${n(amt)}"><ellipse cx="${n(q.x + 0.055 * s)}" cy="${n(q.y + 0.03 * s)}" rx="${n(0.06 * s)}" ry="${n(0.04 * s)}" fill="${KSKIN}" stroke="${L.INK}" stroke-width="2"/>${f(0)}${f(1)}${f(2)}</g>`;
}
function slamHand(c, a) {
  if (a <= 0) return "";
  const hx = lerp(1.35, 0.02, ease(a)), B = P(c, hx, 1.0, 4.4), A = P(c, 1.9, 1.25, 4.2);
  const d = `M${n(A.x)},${n(A.y)} L${n(B.x)},${n(B.y)}`, s = B.s;
  return `<path d="${d}" stroke="${L.INK}" stroke-width="${n(0.13 * s + 4)}" stroke-linecap="round"/><path d="${d}" stroke="#2b2f6b" stroke-width="${n(0.13 * s)}" stroke-linecap="round"/>
    <ellipse cx="${n(B.x - 0.04 * s)}" cy="${n(B.y)}" rx="${n(0.065 * s)}" ry="${n(0.06 * s)}" fill="${SKIN}" stroke="${L.INK}" stroke-width="2.4"/>`;
}

// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds(); MX.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = time - b.at, d = b.d;
  const s = b.shot(Math.max(u, -0.4), d, time);
  MX.mood(s.th);
  const c = s.cam, kt = (who) => (s.noTalk ? 0 : talkAt(who, time)), SH = SHUT(time);
  let body = "";
  if (s.k === "in") {
    const open = s.open ?? SH.open, latch = (s.latch ?? SH.latch) + (s.latchShake || 0), cdl = s.candle ?? s.flame ?? 1;
    const outsideSvg = MX.outside(c, time, { moon: [300, 500, 110] }) + (s.owl && open > 0.01 ? MX.lechuza(c, s.owl, time) : "");
    const rm = MX.room(c, time, { open, latch, candle: cdl, salt: 0, jar: s.jar !== false, outside: outsideSvg });
    const kd = s.kid ? L.kid(c, { blink: blinkAmt(time % 4.1, [1.3]), ...s.kid, talk: kt("kid") }, time) : { svg: "", sleeve: null };
    const gst = s.gm && { blink: blinkAmt(time % 3.7, [2.2]), flame: s.flame ?? 1, ...s.gm, talk: s.noTalk ? 0 : kt("gm") };
    let sleevePt = kd.sleeve;
    if (gst) {
      if (gst.nod != null) { gst.lean = Math.sin(gst.nod * 5) * -2 * clamp(gst.nod); delete gst.nod; }
      if (gst.sleeve != null) { gst.grab = clamp(gst.sleeve * 2); delete gst.sleeve; }
      if (gst.grabTo) { const q = P(c, gst.grabTo[0], gst.grabTo[1], gst.grabTo[2]); sleevePt = { x: q.x, y: q.y }; delete gst.grabTo; }   // her own arm reaches a world point
    }
    const kp = gst ? L.keeper(c, gst, time, sleevePt) : { svg: "", arm: "" };
    let kidX = "", gmX = kp.arm;
    if (s.bowlY != null && s.kid) kidX += bowl(c, s.kid.X, s.kid.Z - 0.05, s.bowlY);
    if (s.palmDeco) { const q = P(c, s.palmDeco[0], s.palmDeco[1], s.palmDeco[2]), r = 0.045 * q.s; gmX += `<ellipse cx="${n(q.x)}" cy="${n(q.y - 0.012 * q.s)}" rx="${n(r * 1.5)}" ry="${n(r * 0.7)}" fill="${SKIN}" stroke="${L.INK}" stroke-width="2.4"/>` + [-1.1, -0.35, 0.4, 1.15].map((f) => `<ellipse cx="${n(q.x + f * r * 0.9)}" cy="${n(q.y - 0.045 * q.s - Math.abs(f) * 2)}" rx="${n(r * 0.28)}" ry="${n(r * 0.6)}" fill="${SKIN}" stroke="${L.INK}" stroke-width="2"/>`).join(""); }
    if (s.jarAt) gmX += MX.saltJar(c, { size: 1, ...s.jarAt }, time);
    const actors = [[s.kid ? s.kid.Z : 0, kd.svg + kidX], [s.gm ? s.gm.Z : 0, kp.svg + gmX]].sort((a, b2) => b2[0] - a[0]);
    body = `${MX.defs()}${rm.back}${actors.map((a) => a[1]).join("")}${rm.light}${rm.front}${MX.grade()}${dust(s.dust)}`;
  } else if (s.k === "yard") {
    const hs = MX.house(c, time, { open: SH.open > 0.5 ? 1 : 0, light: s.light ?? 1, inside: "", salt: 0 });
    body = `${MX.defs()}<g filter="url(#haze)">${MX.sky(c, time, { moon: s.moon })}${MX.far(c)}</g>${MX.ground(c, time)}${MX.fog(c, time, [13])}${MX.mesquite(c, time)}${hs.svg}
      ${MX.clothesline(c, time)}${MX.nopal(c, { X: 2.75, Z: 7.1, seed: 2 })}${MX.nopal(c, { X: -4.6, Z: 8.6, seed: 5, size: 0.8 })}
      ${s.owl ? MX.lechuza(c, s.owl, time) : ""}${s.loose ? MX.feathers(c, s.loose) : ""}${MX.fog(c, time, [8.2, 6.4])}${s.near === false ? "" : MX.near(c, time)}${MX.grade()}${hs.glow}`;
  } else {   // fence: the real barn owl
    body = `${MX.defs()}<g filter="url(#haze)">${MX.sky(c, time, { moon: [740, 300, 120] })}${MX.far(c)}</g>${MX.ground(c, time)}${MX.fog(c, time, [13])}${MX.nopal(c, { X: -0.8, Z: 7.5, seed: 4 })}${MX.mesquite(c, time, { X: -5.2, Z: 8 })}${MX.fog(c, time, [8.2])}${post(c, s.owl.X, s.owl.Z + 0.1)}${MX.barnOwl(c, s.owl, time)}${MX.fog(c, time, [6.4])}${MX.grade()}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}${MX.vignette()}${captions(time)}</svg>`;
}

// ---------------------------------------------------------------- the sound mix (Sol round 1 cue points)
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
export function prepare(outPath) {
  mkdirSync("out/legend-ep02", { recursive: true });
  const ins = [], f = [];
  const add = (file, at, gain = 1, extra = "") => { ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(at * 1000)}:all=1[a${k}]`); };
  const sh = (id) => TL.find((b) => b.id === id).at;
  const MU = (id, i = 1) => `assets/music/ai/lechuza/${id}-0${i}.ogg`, SF = (id, i = 1) => `assets/sfx/ai/lechuza/${id}-0${i}.wav`;   // picked from engine/soundgen/recipes-lechuza*.json
  const loop = (len) => `aloop=loop=-1:size=2e9,atrim=0:${Math.max(0.1, len).toFixed(2)},`;
  const fi = (d) => `afade=t=in:d=${d},`, fo = (st, d) => `afade=t=out:st=${st.toFixed(2)}:d=${d},`;
  for (const ln of Object.values(LINE)) add(`${VOICE}/${ln.id}.wav`, ln.at, ln.who === "K" ? 1.5 : 1, ln.id === "L07" ? "pan=stereo|c0=1.0*c0|c1=0.7*c0," : "");
  const T8 = sh("S8"), SIL = sh("S13"), FACT = sh("S17"), SHUTR = sh("S27"), FLY = sh("S35"), BOY = LINE.L19.at - 0.2, SCR = sh("S19") + 0.65 + 0.0;
  const scrAt = Math.max(WA("L10", "scream", 0.85) + 0.5, sh("S20") - 0.2);
  // music v2 (Codex Sol high, country + scare check, 27 Nov): five cues on the 60.4 s cut
  //   music-direction-v2-summary.md in project files videos/folklore-legend/ep02/music/
  const vol = (pairs) => `volume='${pairs.reduce((acc, [t0, t1, g]) => `if(between(t,${t0.toFixed(2)},${t1.toFixed(2)}),${g},${acc})`, "1")}':eval=frame,`;
  const C1 = 0, L09E = LINE.L09.at + LINE.L09.dur, EYE = sh("S23"), INS = sh("S26"), CRK = sh("S29") + 1.3, TURN = sh("S30");
  add(MU("lechuza2-cue1"), C1, 0.42, loop(SIL) + vol([[sh("S1") - 0.05, sh("S1") + 0.3, 0.35], [sh("S10"), SIL, 0.5]]) + fo(SIL - 0.25, 0.25));
  add(MU("lechuza2-cue2"), L09E + 0.1, 0.32, loop(FACT - L09E + 0.5) + fi(0.4) + fo(FACT - L09E - 0.1, 0.5));
  add(MU("lechuza2-cue3"), FACT, 0.36, loop(SHUTR - FACT + 0.1) + fi(0.5) + vol([[scrAt - FACT - 0.3, scrAt - FACT + 0.8, 0.15], [EYE - FACT, EYE - FACT + 1.7, 1.45], [INS - FACT, SHUTR - FACT, 0.6]]) + fo(SHUTR - FACT - 0.05, 0.1));
  add(MU("lechuza2-cue4"), SHUTR, 0.45, loop(BOY - SHUTR + 0.2) + vol([[CRK - SHUTR - 0.3, CRK - SHUTR + 0.5, 0.45], [TURN - SHUTR, BOY - SHUTR + 0.2, 0.55]]) + fo(BOY - SHUTR - 0.05, 0.2));
  add(MU("lechuza2-cue5"), FLY + 0.3, 0.45, "lowpass=f=4500," + loop(DUR - FLY - 0.3) + fi(0.3) + vol([[LINE.L20.at - FLY - 0.3 - 0.05, DUR, 0.6]]));
  // sfx
  add(SF("baby-cry-outside"), 0, 0.3, `lowpass=f=3000,atrim=0:${SIL.toFixed(2)},afade=t=out:st=${(SIL - 0.15).toFixed(2)}:d=0.15,`);
  add(SF("baby-cry-outside"), sh("S6"), 0.25, `lowpass=f=3000,atrim=0:3,afade=t=out:st=2.5:d=0.5,`);
  add(SF("baby-cry-outside"), sh("S11"), 0.2, `lowpass=f=3000,atrim=0:${(SIL - sh("S11")).toFixed(2)},pan=stereo|c0=1.0*c0|c1=0.2*c0,`);
  add(SF("shutter-slam", 1), sh("S1"), 0.7);
  add(SF("shutter-slam", 2), SHUTR + 0.05, 0.6);
  const steps = [[sh("S10"), 1]]; for (let i = 0; i < 4; i++) steps.push([sh("S11") + 0.15 + i * 0.28, 5 + (i % 4)]);
  for (const [at, v] of steps) add(SF("roof-steps", v), at, 0.45, "atrim=0:0.4,");
  const e = sh("S23"); for (let i = 0; i < 3; i++) add(SF("roof-steps", 1 + i), e + 0.2 + i * 0.4, 0.45, "atrim=0:0.5,");
  add(SF("barn-owl-screech"), scrAt, 0.4, "lowpass=f=5000,");
  add(SF("owl-wings-takeoff"), FLY + 0.15, 0.7);
  add(SF("desert-night-bed"), 0, 0.07, "lowpass=f=4000," + loop(SIL) + fo(SIL - 0.1, 0.1));
  add(SF("desert-night-bed"), sh("S14"), 0.07, "lowpass=f=4000," + loop(DUR - sh("S14") + 0.2) + fi(0.3));
  const mixPath = "out/legend-ep02/mix.wav", k = ins.length / 2;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync("out/legend-ep02/timeline.json", JSON.stringify({ dur: DUR, shots: TL.map((b) => ({ id: b.id, at: +b.at.toFixed(2), d: +b.d.toFixed(2), end: +b.end.toFixed(2) })), voice: Object.values(LINE).map((l) => ({ id: l.id, who: l.who, at: l.at, dur: +l.dur.toFixed(2), end: +(l.at + l.dur).toFixed(2) })) }, null, 1));
  return mixPath;
}
export const GAIN = 1;
