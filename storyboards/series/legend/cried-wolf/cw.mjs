// Legend: The Boy Who Cried Wolf (Aesop, Greece), code-drawn rough draft 1 (director's list: SHOTS.md, lines: lines.json).
//   node tools/svg2d/render.mjs storyboards/series/legend/cried-wolf/cw.mjs out/legend-wolf/cw-picture.mp4    (picture only, with subs)
//   node storyboards/series/legend/cried-wolf/cw-render.mjs   (both exports in one pass: picture with and without subtitles)
// Voice-led: every line starts when the previous one's last sound has ended (+ a gap); shots are cut on those times.
import { readFileSync, existsSync } from "node:fs";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as GR from "../../../../tools/svg2d/lib/legend-greece.mjs";
import { align, phrases, captionSvg } from "../../../../tools/svg2d/lib/captions.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n } = L;

export const W = 1080, H = 1920, FPS = 30;
const VO = "out/legend-wolf/vo", SPEC = JSON.parse(readFileSync("storyboards/series/legend/cried-wolf/lines.json", "utf8"));
const KEY = /wolf|teeth|see|eyes|voice/i;
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;

// ---------------------------------------------------------------- voice: lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer, data.byteOffset, data.length >> 1) };
}
export const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));
for (const ln of Object.values(LINE)) {
  const { sr, s } = readWav(`${VO}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = []; let last = 0;
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; const r = Math.sqrt(a / hop); env.push(r); if (r > 0.01) last = (i + hop) / sr; }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  ln.off = last;                                     // the last audible sound (anything after is silence)
  ln.words = align(ln.text.split(/\s+/), JSON.parse(readFileSync(`${VO}/${ln.id}.words.json`, "utf8")));
  ln.phrases = phrases(ln.words, ln.text, SPEC.cap?.[ln.id]);
}
const wordAt = (ln, w) => { const x = ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "") === w) || ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w)); if (!x) throw new Error("no word " + w + " in " + ln.id); return x[1]; };
const wordEnd = (ln, w) => ln.words.find((q) => q[0].toLowerCase().replace(/[^a-z0-9']/g, "").startsWith(w))[2];

// order and the breath between lines (seconds after the previous line's last sound); a line's own tail is never cut
const ORDER = ["L01", "L02", "L03", "L04", "L05", "L06", "L07", "L30", "L08", "L09", "L10", "L11", "L12", "L13", "L14", "L15", "L16", "L17", "L18", "L19", "L20", "L21", "L22", "L23", "L24", "L25", "L26", "L27"];
const GAP = { L02: 0.12, L03: 0.1, L04: 0.2, L05: 0.12, L06: 0.1, L07: 0.12, L30: 0.2, L08: 0.28, L09: 0.14, L10: 0.3, L11: 0.25, L12: 0.7, L13: 0.9, L14: 0.3, L15: 0.12, L16: 0.5, L17: 0.55, L18: 0.5, L19: 0.4, L20: 0.28, L21: 0.08, L22: 0.08, L23: 0.1, L24: 0.75, L25: 0.14, L26: 0.5, L27: 0.5 };
{ let T = 0, prev = null; for (const id of ORDER) { const ln = LINE[id]; ln.at = prev ? T + GAP[id] : 0; ln.end = ln.at + ln.off; T = ln.end; prev = ln; } }
export const DUR = +(LINE.L27.at + wordEnd(LINE.L27, "town") + 0.27).toFixed(2);
export const TL_LINES = ORDER.map((id) => LINE[id]);

// ---------------------------------------------------------------- building blocks
const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${GR.defs()}<filter id="gb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter><filter id="gb2" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="9"/></filter>${inner}${GR.vignette()}`;
const talkAt = (ln, lu) => clamp(ln.env[Math.round(lu * FPS)] ?? 0);
const blinkEvery = (t, per, off = 0) => blinkAmt(t, [0.3 + off, 0.3 + off + per, 0.3 + off + 2 * per, 0.3 + off + 3 * per, 0.3 + off + 4 * per, 0.3 + off + 5 * per, 0.3 + off + 6 * per].map((v, i) => v + i * per * 0 ));
const bl = (t, seed = 0) => blinkAmt(t, [0.6 + seed, 2.1 + seed * 1.7, 3.9 + seed, 5.5 + seed * 0.6, 7.7 + seed, 9.2 + seed * 1.3]);
const oe = (i, o = {}) => ({ ...GR.OLIVES[i].eye, ...o });

// hillside shot: cast = [{Z, svg}] stacked in the world; over = svg drawn after the grade (eyes)
function hill(c, t, o = {}) {
  GR.mood(Math.min(o.mood ?? 0.3, 0.5));
  const hs = GR.hillside(c, t, o.hs || {}), items = [...hs.items, ...(o.items || [])];
  return GR.sky(c, t, { moon: o.moon === undefined ? [800, 250, 56] : o.moon, stars: o.stars ?? 0.5 }) + hs.back + GR.stack(items) + GR.mist(c, t) + (o.near === false ? "" : GR.near(c, t)) + GR.grade() + (o.over || "") + (o.dark ? GR.blackout(o.dark) : "") + (o.after || "");
}
// the kid with his crook (sleeve = hand point), returns {svg, kd}
function kidCrook(c, st, t, cr = {}) {
  const kd = L.kid(c, st, t);
  return { kd, svg: kd.svg + (cr === false || !kd.sleeve ? "" : GR.crook(c, { at: kd.sleeve, s: kd.p.s, rot: 5, grip: 74, len: 140, ...cr })) };
}
const sheepAt = (c, t, list) => GR.flock(c, list, t).items;
const PENFLOCK = (t, look = 0, o = {}) => [
  { X: -2.25, Z: 6.0, dir: 1, pose: GR.sheepPose("graze", "look", look), mark: 1, blink: bl(t, 0.1) }, { X: -1.1, Z: 5.7, dir: -1, pose: GR.sheepPose("graze", "look", look * 0.8) }, { X: -0.2, Z: 6.1, dir: 1, pose: o.huddle ? "huddle" : GR.sheepPose("graze", "look", look * 0.5) },
  { X: -2.0, Z: 5.1, dir: 1, pose: o.huddle ? "huddle" : "graze", size: 0.82 }, { X: -0.65, Z: 5.0, dir: -1, pose: o.huddle ? "huddle" : GR.sheepPose("graze", "look", look), mark: 1, seed: 8 }, { X: 0.05, Z: 5.35, dir: -1, pose: "graze", size: 0.9 },
];
// the village square: o = { windows [15], lamp, mood, glow }
function square(c, t, o = {}) {
  GR.mood(o.mood ?? -0.9);
  const vg = GR.village(c, t, { bellSwing: o.bell ?? 0, ropePull: 0, windows: o.windows ?? new Array(15).fill(1), lamp: o.lamp ?? 1 });
  const lights = []; const items = [...vg.items];
  let lampSvg = "";
  for (const v of o.cast || []) {
    const q = GR.villager(c, { ...v, h: v.h }, t); let prop = "";
    if (q.hand && v.prop) {
      if (v.prop === "lamp") { const lp = GR.oilLamp(c, { at: q.hand, s: q.hand.s, poolAt: { x: q.p.x, y: q.p.y }, flame: 1 }, t); prop = lp.svg; lights.push(lp.light); }
      else prop = GR.stick(c, { at: q.hand, s: q.hand.s, kind: v.prop, grip: v.grip ?? 60, rot: v.rot ?? 0, seed: v.kind + 1 });
    }
    items.push({ Z: q.Z ?? v.Z, svg: q.svg + prop });
  }
  for (const x of o.extra || []) items.push(x);
  return GR.sky(c, t, { moon: o.moon ?? [860, 190, 44] }) + vg.back + GR.stack(items) + GR.mist(c, t, [14]) + GR.grade() + lights.join("") + (o.over || "");
}
// a villager running/walking: x position and phase from the shot time
const V = (kind, X, Z, o = {}) => ({ kind, X, Z, ...o });

// ---------------------------------------------------------------- the shots
// s(u, ctx): u = seconds into the shot, ctx = { ln, lu (seconds into its line), t (global) }
const SHOTS = [];
const shot = (id, line, off, fn, o = {}) => SHOTS.push({ id, line, off, fn, ...o });

// 1  L01 the wolf's eyes in the black, slow push-in, blink at 1.5 s (SHOTS 1)
shot("1", "L01", 0, (u) => {
  GR.mood(1);
  const c = { x: 2.7, y: 0.78, z: lerp(3.2, 4.15, u / 3.15), h0: 1010 };
  const hs = GR.hillside(c, u), wf = GR.wolf(c, { X: 1.95, Z: 6.2, pose: "hidden", size: 1.3, eyeSize: 1.9, blink: blinkAmt(u, [1.44]), look: tr([[0, -0.5], [0.9, 0.1], [2, 0]], u) }, u);
  return GR.sky(c, u, { moon: false, stars: 0.5 }) + hs.svg + GR.mist(c, u) + GR.grade() + GR.blackout(0.62) + wf.eyes;
}, { capY: 1215 });
// 2  L02 kid close at the gate, guilty side-eye, eyes still in the olives behind him
shot("2", "L02", -0.12, (u, x) => {
  const c = { x: -1.25 + u * 0.03, y: 1.0, z: 2.5 + u * 0.12, h0: 800 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.7, worry: 0.9, talk: talkAt(x.ln, x.lu), blink: bl(u) }, u);
  const eyes = GR.eyesInTrees(c, [oe(1, { size: 2.2, open: clamp(u / 0.4) }), oe(0, { X: 1.0, Y: 1.9, Z: 8.5, size: 1.8, open: clamp((u - 0.5) / 0.3) })], u);
  return hill(c, u, { mood: 0.6, items: [{ Z: 4.0, svg: k.svg }], over: eyes, hs: { gateOpen: 0.0 } });
});
// 3  L03 pen wide at 9 p.m.; on "By two" push in on the kid's face
shot("3a", "L03", 0, (u, x) => {
  const c = { x: -0.9 - u * 0.05, y: 1.45, z: 0.2, h0: 1010 };
  const yawn = tr([[0.9, 0], [1.4, 1], [2.4, 1], [2.8, 0]], u);
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.4, shock: yawn * 0.9, blink: bl(u) }, u);
  return hill(c, u, { mood: 0.2, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u))], moon: [760, 300, 52] });
});
shot("3b", "L03", () => wordAt(LINE.L03, "by"), (u, x) => {
  const c = { x: -1.3, y: 1.02, z: lerp(2.4, 2.9, ease(u / 2.4)), h0: 790 };
  const k = kidCrook(c, { X: -1.2, Z: 4.3, fx: 0.1, worry: tr([[0, 0], [1.2, 0.8]], u), shock: 0, blink: bl(u + 2) }, u);
  const eyes = GR.eyesInTrees(c, [oe(1, { size: 2.2 }), oe(3, { size: 2.4, open: clamp((u - 0.8) / 0.3) })], u);
  return hill(c, u, { mood: tr([[0, 0.2], [2, 0.5]], u), items: [{ Z: 4.3, svg: k.svg }], over: eyes });
});
// kid cups his hands and shouts at the village below (villageFar lights on): the foreground is the kid on a dark slope
function shoutDown(u, o) {
  GR.mood(Math.min(o.mood ?? 0.2, 0.5));
  const c = { x: 0.3 - u * 0.05, y: 1.3, z: 0, f: 2000, h0: 760 }, kc = { x: o.kx ?? 0.2, y: 1.3, z: 0, f: 2000, h0: 760 - (o.dy ?? 0) };
  const kd = L.kid({ ...kc, z: 0 }, { X: o.X ?? 0.65, Z: o.Z ?? 3.0, fx: -0.75, hand2face: o.cup ?? 1, talk: o.talk ?? 0, shock: 0, worry: o.worry ?? 0, blink: bl(u, 0.4) }, u);
  const eyes = o.eyes ? GR.eyesInTrees(c, o.eyes, u) : "";
  const slope = `<path d="M-10,${o.slope ?? 1700} Q300,${(o.slope ?? 1700) - 60} 620,${(o.slope ?? 1700) - 20} Q900,${(o.slope ?? 1700) - 10} 1100,${(o.slope ?? 1700) - 90} L1100,1930 L-10,1930 Z" fill="${GR.M.earthS}"/>`;
  const tree = o.tree === false ? "" : GR.olive(c, u, { X: o.treeX ?? 3.2, Z: 3.6, Y: 0.2, size: 3.3, seed: 2, detail: 0.6 });
  return GR.sky(c, u, { moon: o.moon ?? [260, 230, 56] }) + GR.far(c, u) + GR.villageFar(c, u, { lightsOn: o.lights ?? 1 }) + tree + eyes + slope + kd.svg + GR.mist(c, u, [14]) + GR.grade() + (o.over || "");
}
// 4  L04 kid shouts at the village; one pair of eyes blinks in the olive tree on each shout
shot("4", "L04", -0.2, (u, x) => {
  const lu = x.lu, sh = L.tr([[0, 0], [0.1, 1]], u);
  const w1 = LINE.L04.words[0][1], w2 = LINE.L04.words[1][1];
  const eyes = [{ X: 3.0, Y: 1.45, Z: 3.55, size: 1.5, blink: Math.max(blinkAmt(lu, [w1 - 0.1]), blinkAmt(lu, [w2 - 0.1])) }];
  return shoutDown(u, { talk: talkAt(x.ln, lu), eyes, mood: 0.2, dy: 0 });
});
// 5  L05 the villagers run up the path with sticks and lamps
shot("5", "L05", -0.15, (u, x) => {
  GR.mood(0.1);
  const c = { x: -0.6, y: 1.3, z: 0.0 + u * 0.05, h0: 1000 };
  const cast = [[0, -4.2, 3.6, "fork"], [1, -6.0, 4.0, "lamp"], [4, -7.6, 3.5, "club"], [3, -9.2, 4.1, "lamp"], [2, -10.8, 3.7, "staff"]].map(([k, x0, Z, prop], i) => {
    const X = x0 + (u + 0.3) * 4.2, ph = (u + 0.3) * 2.6 + i * 0.3;
    return { ...V(k, X, Z, { walk: ph, armUp: 0.7, angry: 0.7, dir: 1, prop, grip: prop === "club" ? 12 : 60, rot: -10 }) };
  });
  const items = [], over = [];
  cast.forEach((v) => { const q = GR.villager(c, v, u); let prop = ""; if (v.prop === "lamp") { const lp = GR.oilLamp(c, { at: q.hand, s: q.hand.s, poolAt: { x: q.p.x, y: q.p.y } }, u); prop = lp.svg; over.push(lp.light); } else prop = GR.stick(c, { at: q.hand, s: q.hand.s, kind: v.prop, grip: v.grip, rot: v.rot, seed: v.kind + 1 }); items.push({ Z: v.Z, svg: q.svg + prop }); });
  const hs = GR.hillside(c, u, { pen: true });
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.back + GR.stack([...hs.items, ...items]) + GR.mist(c, u) + GR.grade() + over.join("") + GR.eyesInTrees(c, [oe(0, { size: 1.6, blink: blinkAmt(x.lu, [0.4]) })], u);
});
// 6  L06 the angry villager close, lamp up, panting
shot("6", "L06", -0.6, (u, x) => {
  GR.mood(0);
  const c = { x: 0.0, y: 1.45, z: 1.6, h0: 780 }, hs = GR.hillside(c, u);
  const pant = Math.sin(u * 14) * 0.012;
  const v = GR.villager(c, { kind: 0, X: 0.0, Z: 3.2, Y: pant, dir: 1, fx: 0.3, armUp: 1, shout: 0.35 + 0.6 * talkAt(x.ln, x.lu), angry: 1, h: 175 }, u);
  const lp = GR.oilLamp(c, { at: v.hand, s: v.hand.s, poolAt: { x: v.p.x, y: v.p.y }, flame: 1 }, u);
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.svg + v.svg + lp.svg + GR.mist(c, u) + GR.grade() + lp.light;
});
// 7  L07 kid grin close
shot("7", "L07", -0.05, (u, x) => {
  const c = { x: -1.2, y: 1.04, z: 2.5 + u * 0.1, h0: 800 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.0, grin: 1, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.3) }, u);
  return hill(c, u, { mood: 0.0, items: [{ Z: 4.0, svg: k.svg }] });
});
// 8  L30 the villagers turn to go; behind them in the olives, one pair of eyes: the camera pushes to them
shot("8a", "L30", -0.05, (u, x) => {
  GR.mood(0.5);
  const c = { x: 2.3, y: 1.45, z: lerp(0.6, 1.3, ease(u / 2.5)), h0: 940 }, hs = GR.hillside(c, u);
  const cast = [[0, 1.4, 3.3, "fork"], [3, 3.0, 3.9, "lamp"], [4, 4.6, 3.1, "club"]].map(([k, x0, Z, prop], i) => ({ ...V(k, x0 - Math.min(u, 3) * 0.9 - i * 0.02 * u, Z, { walk: u * 1.0 + i * 0.35, armUp: 0.3, angry: 0.6, dir: -1, prop, grip: prop === "club" ? 12 : 60, rot: 8 }) }));
  const items = [], over = [];
  cast.forEach((v) => { const q = GR.villager(c, v, u); let prop = ""; if (v.prop === "lamp") { const lp = GR.oilLamp(c, { at: q.hand, s: q.hand.s, poolAt: { x: q.p.x, y: q.p.y } }, u); prop = lp.svg; over.push(lp.light); } else prop = GR.stick(c, { at: q.hand, s: q.hand.s, kind: v.prop, grip: v.grip, rot: v.rot, seed: v.kind + 1 }); items.push({ Z: v.Z, svg: q.svg + prop }); });
  const e = oe(0, { size: lerp(1.6, 2.0, u / 2.5), open: clamp((u - 0.3) / 0.3) });
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.back + GR.stack([...hs.items, ...items]) + GR.mist(c, u) + GR.grade() + over.join("") + GR.eyesInTrees(c, [e], u);
});
shot("8b", "L30", () => wordAt(LINE.L30, "something") - 0.5, (u, x) => {
  GR.mood(0.5);
  const c = { x: lerp(2.3, 2.3, 0), y: lerp(1.45, 1.55, ease(u / 3)), z: lerp(1.3, 4.6, ease(u / 3.2)), h0: lerp(940, 900, ease(u / 3)) }, hs = GR.hillside(c, u);
  const wf = GR.wolf(c, { X: 2.4, Z: 8.9, Y: GR.groundY(8.9) + 0.0, pose: "hidden", size: 0.01 }, u);
  const e = [oe(0, { size: lerp(2.0, 3.6, ease(u / 3.2)), blink: blinkAmt(u, [1.3, 2.6]) })];
  return GR.sky(c, u, { moon: [800, 250, 56] }) + hs.svg + GR.mist(c, u) + GR.grade() + GR.blackout(lerp(0.0, 0.15, ease(u / 3.2))) + GR.eyesInTrees(c, e, u);
});
// 9  L08/L09 11 p.m.: he does it again (shorter beat)
shot("9a", "L08", -0.1, (u, x) => {
  const c = { x: -0.5, y: 1.4, z: 0.6, h0: 1000 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.6, shock: 0, tug: tr([[0.9, 0], [1.2, 1]], u), blink: bl(u, 0.7), look: 0.6 }, u);
  return hill(c, u, { mood: 0.3, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u))], moon: [300, 250, 52] });
});
shot("9b", "L09", -0.2, (u, x) => {
  const w1 = LINE.L09.words[0][1];
  return shoutDown(u, { talk: talkAt(x.ln, x.lu), eyes: [{ X: 3.0, Y: 1.45, Z: 3.55, size: 1.5, blink: blinkAmt(x.lu, [w1 - 0.1]) }], mood: 0.3, moon: [760, 260, 52], X: 0.65, dy: 0, treeX: 3.0 });
});
// 10  L10 fewer came, angrier; grandmother last, her candle smaller
shot("10a", "L10", -0.1, (u, x) => {
  GR.mood(0.3);
  const c = { x: -0.3, y: 1.3, z: 0.9, h0: 1000 }, hs = GR.hillside(c, u);
  const cast = [[0, -3.2, 3.1, "fork"], [4, -4.2, 3.6, "club"], [3, -5.6, 3.3, "lamp"]].map(([k, x0, Z, prop]) => ({ ...V(k, x0 + (u + 0.2) * 2.5, Z, { walk: (u + 0.2) * 1.6 + k * 0.2, armUp: 0.8, angry: 1, shout: 0.5, dir: 1, prop, grip: prop === "club" ? 12 : 60, rot: -14 }) }));
  const items = [], over = [];
  cast.forEach((v) => { const q = GR.villager(c, v, u); let prop = ""; if (v.prop === "lamp") { const lp = GR.oilLamp(c, { at: q.hand, s: q.hand.s, poolAt: { x: q.p.x, y: q.p.y } }, u); prop = lp.svg; over.push(lp.light); } else prop = GR.stick(c, { at: q.hand, s: q.hand.s, kind: v.prop, grip: v.grip, rot: v.rot, seed: v.kind + 1 }); items.push({ Z: v.Z, svg: q.svg + prop }); });
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.back + GR.stack([...hs.items, ...items]) + GR.mist(c, u) + GR.grade() + over.join("");
});
shot("10b", "L10", () => wordAt(LINE.L10, "his") - 0.1, (u, x) => {
  GR.mood(0.3);
  const c = { x: -0.8, y: 1.2, z: 1.1, h0: 960 }, hs = GR.hillside(c, u);
  const g = L.keeper(c, { X: -1.6 + (u + 0.1) * 0.6, Z: 3.4, run: null, stern: 0.7, flame: 0.45, fx: 0.7 }, u, null);
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.back + GR.stack([...hs.items, { Z: 3.4, svg: g.svg }]) + GR.mist(c, u) + GR.grade();
});
// 11  L11 grandmother close, quiet; then the kid's face falls on "voice"
shot("11a", "L11", -0.1, (u, x) => {
  const c = { x: -0.6, y: 1.12, z: 2.5, h0: 840 }, hs = GR.hillside(c, u);
  const g = L.keeper(c, { X: -0.9, Z: 4.1, stern: 1, flame: 0.4, fx: -0.5, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.5) }, u, null);
  return GR.sky(c, u, { moon: [300, 250, 52] }) + hs.svg + g.svg + GR.mist(c, u) + GR.grade();
});
shot("11b", "L11", () => wordAt(LINE.L11, "voice") - 0.35, (u, x) => {
  const c = { x: -1.2, y: 1.02, z: lerp(2.6, 2.3, ease(u / 1.5)), h0: 790 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.15, worry: tr([[0, 0.2], [0.6, 1]], u), shock: 0, blink: bl(u + 1) }, u);
  return hill(c, u, { mood: 0.3, items: [{ Z: 4.0, svg: k.svg }], moon: [300, 250, 52] });
});
// 12  L12 2 a.m., moon behind a cloud, the real howl, eyes in the olive trees and two more pairs open
shot("12", "L12", -0.3, (u, x) => {
  const c = { x: -0.8 + u * 0.08, y: 1.5, z: 0.4 + u * 0.1, h0: 1000 };
  const w = wordAt(LINE.L12, "howled");
  const op = (d) => clamp((x.lu - w - d) / 0.25);
  const eyes = GR.eyesInTrees(c, [oe(1, { size: 3.4, open: clamp((u - 0.3) / 0.5) }), oe(0, { size: 3.6, open: op(0.1) }), oe(3, { size: 3.8, open: op(0.5) })], u);
  const cloud = `<g opacity="0.85"><path d="M600,170 Q650,110 740,130 Q800,95 880,140 Q960,150 940,215 Q860,250 760,232 Q660,250 600,210 Z" fill="${GR.M.cloud}"/></g>`;
  return hill(c, u, { mood: 0.9, items: [...sheepAt(c, u, PENFLOCK(u, 1, { huddle: false }))], moon: [790, 190, 50], over: eyes, after: "" });
});
// 13  L13 the wolf stalks along the terrace wall; the flock; (glimpse); a push to the kid on "something new"
shot("13a", "L13", -0.3, (u, x) => {
  const wx = tr([[0, -3.4], [3.6, 0.6]], u), c = { x: wx + 0.5, y: 1.5, z: 2.0, h0: 1000 };
  const wf = GR.wolf(c, { X: wx, Z: 8.2, Y: GR.groundY(8.2), dir: 1, pose: "stalk", phase: u * 0.7, size: 1.15 }, u);
  return hill(c, u, { mood: 0.8, items: [{ Z: 8.2, svg: wf.svg }], over: wf.eyes, hs: { pen: true }, moon: false });
});
shot("13b", "L13", () => wordAt(LINE.L13, "it") - 0.1, (u, x) => {
  const c = { x: -1.0, y: 1.4, z: 0.4, h0: 1000 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.5, worry: 0.6, blink: bl(u, 1.1) }, u);
  const eyes = GR.eyesInTrees(c, [oe(1, { size: 3.4 }), oe(0, { size: 3.6 }), oe(3, { size: 3.8 })], u);
  return hill(c, u, { mood: 0.8, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, 1, { huddle: true }))], over: eyes, moon: false });
});
shot("13c", "L13", () => wordAt(LINE.L13, "but") + 0.3, (u, x) => {
  const c = { x: -1.2, y: 1.04, z: lerp(2.9, 2.4, ease(u / 1.9)), h0: 800 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.05, worry: 0.3, shock: 0, blink: bl(u + 3) }, u);
  return hill(c, u, { mood: 0.6, items: [{ Z: 4.0, svg: k.svg }], moon: false });
});
// 14  L14 the kid screams down the hill, voice cracks
shot("14", "L14", -0.15, (u, x) => shoutDown(u, { talk: talkAt(x.ln, x.lu), mood: 0.9, X: 0.65, treeX: 3.4, moon: false, eyes: [{ X: 3.1, Y: 1.5, Z: 3.55, size: 1.6 }], worry: 1 }));
// 15  L15 the lights go out one by one
shot("15", "L15", -0.15, (u, x) => {
  GR.mood(tr([[0, 0.5], [2, 0.95]], u));
  const c = { x: 0.3 - u * 0.04, y: 1.3, z: 0, f: 2000, h0: 760 };
  const a = wordAt(LINE.L15, "lights") - 0.1;
  const sh = x.lu - u, lOn = tr([[0, 1, "linear"], [Math.max(0.01, a - sh), 1, "linear"], [Math.max(0.02, x.ln.off - sh - 0.1), 0.0, "linear"]], u);
  return GR.sky(c, u, { moon: false }) + GR.far(c, u) + GR.villageFar(c, u, { lightsOn: lOn }) + GR.near(c, u) + GR.grade();
});
// 16  L16 "Please!" kid waves the crook, desperate (he is on the hill: no bell rope)
shot("16", "L16", -0.1, (u, x) => {
  const c = { x: -1.0, y: 1.1, z: 2.3, h0: 860 };
  const k = L.kid(c, { X: -1.1, Z: 4.0, fx: -0.6, shock: 1, talk: talkAt(x.ln, x.lu), reachL: 1, worry: 1, tug: 0, hop: Math.abs(Math.sin(u * 7)) * 3 }, u);
  const cr = GR.crook(c, { at: k.sleeve, s: k.p.s, rot: 25 * Math.sin(u * 6), grip: 74, len: 140 });
  return hill(c, u, { mood: 1, items: [{ Z: 4.0, svg: k.svg + cr }], moon: false });
});
// 17  L17 nobody came; more eyes in the trees, the sheep huddle
shot("17", "L17", -0.1, (u, x) => {
  const c = { x: -0.7, y: 1.5, z: 0.5 + u * 0.08, h0: 1010 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.4, worry: 1, blink: bl(u, 0.2) }, u);
  const w = wordAt(LINE.L17, "more");
  const pairs = [oe(1, { size: 3.4 }), oe(0, { size: 3.6 }), oe(3, { size: 3.8 }), oe(2, { size: 3.4, open: clamp((x.lu - w) / 0.2) }), oe(4, { size: 4, open: clamp((x.lu - w - 0.3) / 0.2) })];
  return hill(c, u, { mood: 1, items: [{ Z: 4.0, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, 1, { huddle: true }))], over: GR.eyesInTrees(c, pairs, u), moon: false });
});
// 18  L18 kid close, whisper, a candle jar almost out beside him
const jarSvg = (c, X, Z, flame, t) => {
  const p = L.P(c, X, 0.72, Z), k = p.s / 100;
  const fk = flame * (0.8 + 0.2 * Math.sin(t * 17) * Math.sin(t * 5.3));
  return `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${k.toFixed(3)})"><path d="M-9,-16 Q-10,-3 -8,0 L8,0 Q10,-3 9,-16 Z" fill="#cfe6ff" opacity="0.38" stroke="#e9f3ff" stroke-width="0.9"/><path d="M-9.4,-18 L9.4,-18 L9,-15 L-9,-15 Z" fill="#3a2a2a"/><path d="M-1.6,0 L1.6,0 L1.6,-7 L-1.6,-7 Z" fill="#fff4e0"/>
    ${fk > 0.03 ? `<path d="M0,${n(-7 - 9 * fk)} Q${n(3 * fk)},${n(-8 - 2 * fk)} 0,-7 Q${n(-3 * fk)},${n(-8 - 2 * fk)} 0,${n(-7 - 9 * fk)} Z" fill="#ffd36a" stroke="#ff9a3a" stroke-width="0.4"/>` : ""}</g>`;
};
shot("18", "L18", -0.1, (u, x) => {
  const c = { x: -1.1, y: 1.02, z: lerp(2.6, 2.2, ease(u / 3)), h0: 800 };
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx: 0.1, worry: 0.9, talk: talkAt(x.ln, x.lu) * 0.7, shock: 0, blink: bl(u + 1, 0.6) }, u);
  const jar = jarSvg(c, -0.75, 3.7, 0.3, u);
  const lp = L.P(c, -0.75, 0.82, 3.7), glow = `<circle cx="${n(lp.x)}" cy="${n(lp.y)}" r="${n(0.28 * lp.s)}" fill="#ff9a2a" opacity="0.18" style="mix-blend-mode:screen"/>`;
  return hill(c, u, { mood: 1, items: [{ Z: 4.0, svg: k.svg }, { Z: 3.7, svg: jar }], over: glow, moon: false });
});
// 19  L19 he looks from the gate to the village: the idea
shot("19", "L19", -0.1, (u, x) => {
  const c = { x: -1.0, y: 1.05, z: 2.4, h0: 800 };
  const fx = tr([[0, 0.7], [0.9, 0.7], [1.5, -0.7]], x.lu);
  const k = kidCrook(c, { X: -1.2, Z: 4.0, fx, worry: tr([[0, 1], [1.4, 0.1]], x.lu), shock: tr([[1.3, 0], [1.6, 0.5]], x.lu) * 0, talk: talkAt(x.ln, x.lu) * 0.8, blink: bl(u + 4, 0.3) }, u);
  return hill(c, u, { mood: 0.8, items: [{ Z: 4.0, svg: k.svg }], moon: false });
});
// 20  L20 the gate opens
shot("20", "L20", -0.1, (u, x) => {
  const c = { x: -1.4 + u * 0.05, y: 1.1, z: 1.2, h0: 960 };
  const k = kidCrook(c, { X: -2.2, Z: 3.9, fx: 0.5, reachL: 0.3, worry: 0.2, lean: 0 }, u);
  return hill(c, u, { mood: 0.7, hs: { gateOpen: ease(clamp((u - 0.15) / 1.0)) }, items: [{ Z: 3.9, svg: k.svg }, ...sheepAt(c, u, PENFLOCK(u, 0.9))], moon: false });
});
// 21  L21 the flock runs down the terrace path toward the village, the kid behind with his crook
shot("21", "L21", -0.1, (u, x) => {
  const dx = -2.4 * Math.max(0, u - 0.05), c = { x: 0.4 + dx, y: 1.2, z: -1.2, h0: 1050 };
  const run = (i, x0, Z, size = 1) => ({ X: x0 + dx - (i % 2) * 0.1, Z, dir: -1, pose: "run", phase: u * 2.2 + i * 0.27, size, seed: i + 1, mark: i % 3 === 0 ? 1 : 0 });
  const fl = [run(0, -1.3, 4.2), run(1, -0.9, 4.9, 0.9), run(2, -0.6, 3.8), run(3, -0.2, 4.4, 0.95), run(4, 0.15, 4.0), run(5, 0.45, 4.8, 0.85), run(6, 0.8, 3.7)];
  const kk = L.kid(c, { X: 1.9 + dx, Z: 3.3, run: u * 2.2, fx: -0.6, shock: 0, worry: 0.2, lean: -6 }, u);
  const cr = GR.crook(c, { at: kk.sleeve, s: kk.p.s, rot: -35, grip: 74, len: 140 });
  return hill(c, u, { mood: 0.6, hs: { gateOpen: 1 }, items: [...sheepAt(c, u, fl), { Z: 3.3, svg: kk.svg + cr }], moon: false });
});
// 22  L22 the flock through the dark square, then the wolf right behind them
const flockSq = (u, x0, spd, ph, cnt = 8) => [0, 1, 2, 3, 4, 5, 6, 7].slice(0, cnt).map((i) => ({ X: x0 + u * spd - i * 0.55 + (i % 2) * 0.3, Z: 4.0 + (i * 0.73 % 1.6), dir: 1, pose: "run", phase: u * 2.3 + i * 0.29 + ph, size: 0.95 + (i % 3) * 0.04, seed: i + 1, mark: i % 4 === 0 ? 1 : 0 }));
shot("22a", "L22", -0.1, (u, x) => {
  const c = { x: 0.1, y: 1.15, z: -0.4, h0: 1180 };
  const fl = sheepAt(c, u, flockSq(u, -3.2, 3.8, 0));
  return square(c, u, { mood: tr([[0, 0.4], [2.3, 0.7]], u), windows: new Array(15).fill(0), lamp: 0, extra: fl });
});
shot("22b", "L22", () => wordAt(LINE.L22, "wolf") - 0.35, (u, x) => {
  const base = -0.8 + u * 3.1, c = { x: base, y: 1.15, z: -1.0, h0: 1180 };
  const fl = sheepAt(c, u, flockSq(0, base + 1.0, 0, 0.3 + u * 2.3, 4).map((q, i) => ({ ...q, phase: u * 2.3 + i * 0.29 })));
  const wX = base - 1.2, ph = u * 2.4, wf = GR.wolf(c, { X: wX, Z: 3.6, dir: 1, pose: GR.wolfPose("runAway", "lunge", 0.5 + 0.5 * Math.sin(ph * 6.283)), phase: ph, size: 1.1 }, u);
  return square(c, u, { mood: 0.7, windows: new Array(15).fill(0), lamp: 0, extra: [...fl, { Z: 3.6, svg: wf.svg }], over: wf.eyes });
});
// 23  L23 every door and window opens at once: lamplight floods (windows 0 -> 1 in 6 frames)
shot("23", "L23", -0.1, (u, x) => {
  const c = { x: 0.15, y: 1.2, z: 0.4 + u * 0.1, h0: 1180 };
  const w = wordAt(LINE.L23, "every") + 0.55, f = clamp((x.lu - w) * FPS / 6);
  const sheep = sheepAt(c, u, [{ X: -1.2, Z: 3.4, dir: 1, pose: "huddle" }, { X: -0.5, Z: 3.9, dir: -1, pose: "huddle", size: 0.9 }, { X: 0.4, Z: 3.5, dir: -1, pose: "huddle" }, { X: 1.3, Z: 4.0, dir: 1, pose: "huddle", size: 0.95 }, { X: -2.0, Z: 4.3, dir: 1, pose: "huddle", size: 0.9 }]);
  return square(c, u, { mood: lerp(0.3, -1, f), windows: Array.from({ length: 15 }, (_, i) => clamp(f * 2 - (i % 5) * 0.12)), lamp: f, extra: sheep, cast: f > 0.4 ? [V(1, -2.5, 6.4, { armUp: 0.4, dir: 1 }), V(4, 2.0, 6.6, { armUp: 0.7, dir: -1 })] : [] });
});
// 24  L24 a villager shouts WOLF!
shot("24", "L24", -0.1, (u, x) => {
  GR.mood(-1);
  const c = { x: 0.2, y: 1.42, z: 1.3, h0: 760 };
  const vg = GR.village(c, u, { windows: new Array(15).fill(1), lamp: 1 });
  const v = GR.villager(c, { kind: 4, X: 0.2, Z: 3.0, dir: -1, fx: 0.2, armUp: 1, shout: 0.4 + 0.6 * talkAt(x.ln, x.lu), angry: 1, h: 175 }, u);
  const lp = GR.oilLamp(c, { at: v.hand, s: v.hand.s, poolAt: { x: v.p.x, y: v.p.y } }, u);
  return GR.sky(c, u, { moon: [860, 190, 44] }) + vg.back + GR.stack([...vg.items, { Z: 3.0, svg: v.svg + lp.svg }]) + GR.grade() + lp.light;
});
// 25  L25 the wolf in the lamplight with its teeth; villagers raise sticks; it runs away
const crowd = (u, extraLamp = true) => [
  V(0, -2.3, 6.4, { armUp: 1, shout: 1, angry: 1, prop: "fork", grip: 60, rot: 12 }), V(1, -1.45, 6.9, { armUp: 0.9, shout: 0.6, dir: 1, prop: "lamp" }), V(2, -0.6, 7.3, { armUp: 0.2, prop: "staff", grip: 80, rot: -4 }),
  V(3, 0.55, 7.0, { armUp: 0.75, dir: -1, shout: 0.4, prop: "lamp" }), V(4, 1.3, 6.3, { armUp: 1, dir: -1, shout: 1, angry: 1, prop: "club", grip: 12, rot: -24 }), V(5, 3.0, 6.6, { armUp: 0.6, dir: -1, prop: "staff", grip: 70, rot: -8 }),
];
shot("25", "L25", -0.15, (u, x) => {
  const c = { x: 0.15, y: 1.2, z: 0.5 + u * 0.1, h0: 1180 };
  const run = ease(clamp((u - 1.9) / 0.8));
  const wf = GR.wolf(c, { X: -0.35 + run * 5.0, Z: 3.9, dir: 1, pose: run > 0 ? GR.wolfPose("teeth", "runAway", clamp(run * 2)) : GR.wolfPose("crouch", "teeth", ease(clamp(u / 0.3))), jaw: 0.5 + 0.08 * Math.sin(u * 16), phase: u * 2.5, blink: blinkAmt(u, [0.9]) }, u);
  return square(c, u, { mood: -0.9, cast: crowd(u), extra: [{ Z: 3.9, svg: wf.svg }], over: wf.eyes });
}, { capY: 950 });
// 26  L26 grandmother close, one eyebrow up
shot("26", "L26", -0.1, (u, x) => {
  GR.mood(-0.6);
  const c = { x: -0.2, y: 1.1, z: 1.9, h0: 820 }, vg = GR.village(c, u, { windows: new Array(15).fill(1), lamp: 1 });
  const g = L.keeper(c, { X: 0.0, Z: 3.3, stern: 0, flame: 0.4, fx: -0.15, talk: talkAt(x.ln, x.lu), open: 1, blink: bl(u, 0.8) }, u, null);
  return GR.sky(c, u, { moon: [860, 190, 44] }) + vg.back + GR.stack([...vg.items, { Z: 3.3, svg: g.svg }]) + GR.grade();
});
// 27  L27 kid deadpan, proud; cut right after "town"
shot("27", "L27", -0.1, (u, x) => {
  GR.mood(-0.6);
  const c = { x: -0.1, y: 1.02, z: lerp(1.5, 1.3, ease(u / 2.4)), h0: 800 }, vg = GR.village(c, u, { windows: new Array(15).fill(1), lamp: 1 });
  const k = kidCrook(c, { X: 0.0, Z: 3.0, fx: 0.0, talk: talkAt(x.ln, x.lu), blink: bl(u, 0.9), worry: 0 }, u);
  return GR.sky(c, u, { moon: [860, 190, 44] }) + vg.back + GR.stack([...vg.items, { Z: 3.0, svg: k.svg }]) + GR.grade();
});

// ---------------------------------------------------------------- the glimpse (re-hook): the lamplit square, the wolf snarling; blurred and dark, then hard back
const GLIMPSES = [{ at: 2.4, frames: 6, blur: "gb", dark: 0.5, zoom: 1.0 }, { line: "L13", word: "but", frames: 12, blur: "gb2", dark: 0.22, zoom: 1.0, pre: 0.0 }];
for (const g of GLIMPSES) if (g.line) g.at = LINE[g.line].at + wordAt(LINE[g.line], g.word) - 0.1;
function glimpse(t, g) {
  const u = (t - g.at) * FPS, c = { x: 0.15, y: 1.0, z: 1.4 + u * 0.01, h0: 1000 }, k = u / g.frames;
  GR.mood(-0.9);
  const wf = GR.wolf(c, { X: -0.1, Z: 3.7, size: 1.2, pose: GR.wolfPose("crouch", "teeth", ease(clamp(u / 3))), jaw: 0.55 + 0.1 * Math.sin(u * 1.7), phase: 0.2 }, t);
  const inner = square(c, t, { mood: -0.9, cast: crowd(t), extra: [{ Z: 3.7, svg: wf.svg }], over: wf.eyes });
  return `<g filter="url(#${g.blur})">${inner}</g><rect width="${W}" height="${H}" fill="#02030a" opacity="${g.dark + 0.15 * Math.sin(k * Math.PI)}"/>`;
}

// ---------------------------------------------------------------- timeline
for (const s of SHOTS) {
  const ln = LINE[s.line], o = typeof s.off === "function" ? s.off() : s.off;
  s.at = Math.max(0, ln.at + o);
}
SHOTS.forEach((s, i) => { s.end = i + 1 < SHOTS.length ? SHOTS[i + 1].at : DUR; });
export const TIMELINE = SHOTS;
const lineAtTime = (t) => { let k = null; for (const id of ORDER) { const ln = LINE[id]; if (t >= ln.at - 0.25) k = ln; } return k; };

function captions(t, y) {
  const ln = lineAtTime(t);
  if (!ln || t > ln.at + ln.off + 0.2) return "";
  return captionSvg(ln.phrases, t - ln.at, { key: KEY, keyColor: "#ff3b3b", y, maxFs: 104, width: 990, wrapAt: 15, reveal: true });
}
export const SUBS = { on: true };
// the picture at time t: { pic: svg without subtitles, cap: the subtitle svg (or "") }
export function parts(time) {
  L.resetIds();
  let s = SHOTS[0]; for (const q of SHOTS) if (time >= q.at) s = q;
  const ln = LINE[s.line], t = Math.min(time, DUR - 1e-6), u = t - s.at;
  const g = GLIMPSES.find((q) => t >= q.at - 1e-6 && t < q.at + q.frames / FPS - 1e-6);
  const body = g ? glimpse(t, g) : s.fn(u, { ln, lu: t - ln.at, t });
  return { pic: frame(body), cap: captions(t, s.capY ?? 1215), shot: s.id };
}
export function draw(time) { const p = parts(time); return p.pic + (SUBS.on ? p.cap : "") + "</svg>"; }
