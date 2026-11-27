// Legend: the Night Marchers (huaka'i po), Hawaii, code-drawn (Jonny 26 Nov 2026 21:54 Berlin: opening H2 phone lens +
// ending E1 the ancestor claims him). Set + poses: tools/svg2d/lib/legend-hawaii.mjs (Fable 5.2 design). RESPECT RULE:
// the camera never looks at the marchers; only their torch points far away, their light, their shadows, their sound.
//   engine/voice/.venv-vox/bin/python tools/svg2d/read-lines.py storyboards/series/legend/night-marchers/lines.json out/legend-nm/voice
//   engine/voice/.venv-vox/bin/python storyboards/series/legend/night-marchers/remeasure.py out/legend-nm/voice   (after any voice edit)
//   node tools/svg2d/render.mjs storyboards/series/legend/night-marchers/nm.mjs out/legend-nm/nm-draft.mp4
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import * as L from "../../../../tools/svg2d/lib/legend.mjs";
import * as HI from "../../../../tools/svg2d/lib/legend-hawaii.mjs";
const { lerp, clamp, tr, ease, blinkAmt, n } = L, { SPOT } = HI;

export const W = 1080, H = 1920, FPS = 30;
const OUT = "out/legend-nm", VOICE = `${OUT}/voice`, SPEC = JSON.parse(readFileSync("storyboards/series/legend/night-marchers/lines.json", "utf8"));
const LINE = Object.fromEntries(SPEC.lines.map(([id, who, text]) => [id, { id, who, text }]));

// ---------------------------------------------------------------- audio: line lengths, mouth envelopes, word times
function readWav(p) {
  const b = readFileSync(p); let o = 12, sr = 44100, data = null;
  while (o < b.length - 8) { const id = b.toString("ascii", o, o + 4), sz = b.readUInt32LE(o + 4); if (id === "fmt ") sr = b.readUInt32LE(o + 12); if (id === "data") { data = b.subarray(o + 8, o + 8 + sz); break; } o += 8 + sz + (sz & 1); }
  return { sr, s: new Int16Array(data.buffer, data.byteOffset, data.length >> 1) };
}
for (const ln of Object.values(LINE)) {
  if (!existsSync(`${VOICE}/${ln.id}.wav`)) { ln.dur = 0.6 + ln.text.split(" ").length * 0.36; ln.env = []; ln.words = []; continue; }
  const { sr, s } = readWav(`${VOICE}/${ln.id}.wav`);
  ln.dur = s.length / sr;
  const hop = Math.round(sr / FPS), env = [];
  for (let i = 0; i < s.length; i += hop) { let a = 0; for (let j = i; j < Math.min(s.length, i + hop); j++) a += (s[j] / 32768) ** 2; env.push(Math.sqrt(a / hop)); }
  const mx = Math.max(...env) || 1; ln.env = env.map((v) => clamp((v / mx - 0.08) * 1.6));
  // word times heard on the FINAL voice files (after trims + the 1.07 tempo on G/K): remeasure.py writes *.words.final.json
  const wf = `${VOICE}/${ln.id}.words.final.json`;
  let words = JSON.parse(readFileSync(existsSync(wf) ? wf : `${VOICE}/${ln.id}.words.json`, "utf8"));
  ln.words = align(ln.text.split(/\s+/), words);
  // subtitle phrases (lines.json "cap", | splits): each shows WHOLE from its first spoken word (no word-by-word fill)
  let k = 0;
  ln.phrases = (SPEC.cap?.[ln.id] ?? ln.text).split("|").map((ph) => { const ws = ln.words.slice(k, k + ph.trim().split(/\s+/).length); k += ws.length; return { ws, at: ws[0]?.[1] ?? 0 }; });
}
// subtitles show the written words with the heard words' times: words that match keep their own time; a run that
// differs (a spoken spelling, a hyphenated word Whisper split, a word it missed) spreads over the heard run's span
function align(sub, heard) {
  const nz = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
  const A = sub.map(nz), B = heard.map((h) => nz(h[0])), n1 = A.length, n2 = B.length;
  const M = Array.from({ length: n1 + 1 }, () => new Array(n2 + 1).fill(0));
  for (let i = n1 - 1; i >= 0; i--) for (let j = n2 - 1; j >= 0; j--) M[i][j] = A[i] === B[j] ? M[i + 1][j + 1] + 1 : Math.max(M[i + 1][j], M[i][j + 1]);
  const pairs = []; let i = 0, j = 0;
  while (i < n1 && j < n2) { if (A[i] === B[j]) { pairs.push([i, j]); i++; j++; } else if (M[i + 1][j] >= M[i][j + 1]) i++; else j++; }
  const out = new Array(n1); let pi = 0, pj = 0;
  const fill = (i0, i1, j0, j1) => {   // written i0..i1-1 over heard j0..j1-1
    if (i1 <= i0) return;
    const t0 = j1 > j0 ? heard[j0][1] : (heard[j0 - 1]?.[2] ?? 0), t1 = j1 > j0 ? heard[j1 - 1][2] : (heard[j0]?.[1] ?? t0 + 0.3), wt = sub.slice(i0, i1).map((w) => w.length + 2), tot = wt.reduce((x, y) => x + y, 0);
    let acc = 0; for (let k = i0; k < i1; k++) { const st = t0 + (t1 - t0) * acc / tot; acc += wt[k - i0]; out[k] = [sub[k], st, t0 + (t1 - t0) * acc / tot]; }
  };
  for (const [a2, b2] of [...pairs, [n1, n2]]) { fill(pi, a2, pj, b2); if (a2 < n1) out[a2] = [sub[a2], heard[b2][1], heard[b2][2]]; pi = a2 + 1; pj = b2 + 1; }
  return out;
}
const wordAt = (ln, word, frac = 0.5) => { const w = ln.words.find((x) => x[0].toLowerCase().replace(/[^a-z0-9]/g, "").startsWith(word)); return w ? w[1] : ln.dur * frac; };

// ---------------------------------------------------------------- cameras and the building blocks of each shot kind
const cam = (u, a, b, k = "inOut") => { const e = ease(clamp(u), k); const o = { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2], b[2], e) }; if (a[3] != null) o.h0 = lerp(a[3], b[3] ?? a[3], e); return o; };
const frame = (pal, back, mid, over) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${HI.hdefs(pal)}${back}${mid}${over}${L.vignette()}`;
const bg = (c, t, pal, lights, torch) => HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + (torch ? HI.torchLine(c, t, pal, torch).svg : "") + HI.hground(c, t, pal, { lights }) + HI.stonePath(c, t, pal, { lights });

// (A) standing: he films the torch line, her hand comes over the lens. grab 0..1, push 0..1 (wide -> closer on the phone)
function standing(t, o) {
  const pal = o.pal, c = o.c, flat = HI.CAMP_FLAT;
  const kf = HI.kidFilming(c, { ...SPOT.kidUp, raise: 1, tilt: 6 }, t);
  const kp = L.keeper(c, { ...SPOT.keeperUp, fx: -0.7, stern: 1, open: 1, look: -0.9, grab: o.grab, flame: 0.8, talk: o.gTalk || 0 }, t, kf.lens);
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.6 }) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) },
    { Z: SPOT.keeperUp.Z, svg: HI.tint(kp.svg) }, { Z: SPOT.kidUp.Z, svg: HI.tint(kf.svg + kp.arm + kf.phone + kf.fingers(1)) }];
  return frame(pal, bg(c, t, pal, [], { head: o.head ?? 0.55 }), HI.stack(c, t, pal, items, { flat }), HI.motes(t, pal, { amt: 0.7, at: kp.jar }));
}
// (T) the far torch line, camera tilted up at the ridge: they are only points of flame
function far(t, o) {
  const pal = o.pal, c = o.c;
  return frame(pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + HI.torchLine(c, t, pal, { head: o.head, count: o.count ?? 22 }).svg + HI.hground(c, t, pal), HI.stack(c, t, pal, [], { flat: HI.CAMP_FLAT }), HI.motes(t, pal, { amt: 0.4 }) + (o.phone ? phoneFrame(t) : ""));
}
// the phone screen frame over the far shot (the kid's view while she pulls it away): REC dot, a thin bezel
function phoneFrame(t) {
  const on = Math.floor(t * 2) % 2 === 0;
  return `<rect x="60" y="300" width="960" height="1320" rx="64" fill="none" stroke="#0c0a14" stroke-width="44"/><rect x="38" y="278" width="1004" height="1364" rx="80" fill="none" stroke="#2a2438" stroke-width="6"/>
    <circle cx="150" cy="390" r="14" fill="#ff3b3b" opacity="${on ? 1 : 0.25}"/><text x="178" y="402" font-family="Inter" font-weight="900" font-size="34" fill="#fff">REC</text>`;
}
// (B) both face down in the grass by the tent on the old path. o: torchHead, wash, flame (her candle), kidEye
function prone(t, o) {
  const pal = o.pal, c = o.c, lights = o.lights || [], flat = [...HI.CAMP_FLAT, ...HI.DOWN_FLAT];
  const kd = HI.kidProne(c, { ...SPOT.kidDown, eye: o.kidEye ?? 0, mouth: o.kTalk || 0, squeeze: o.squeeze ?? 0.8 }, t), kp = HI.keeperProne(c, { ...SPOT.keeperDown, hold: kd.back, eye: o.gEye ?? 0 }, t), sf = HI.staffDown(c, { ...SPOT.staff, flame: o.flame ?? 0.6 }, t);
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: o.tentLit ?? 0.6 }) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) }, { Z: SPOT.keeperDown.Z, svg: HI.tint(kp.svg) },
    { Z: SPOT.staff.Z, svg: HI.tint(sf.svg) }, { Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg + kp.arm) }, { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: o.puddle ?? 0 }) }];
  const feet = o.feet ? HI.feetShadows(c, t, pal, o.feet) : "";
  return frame(pal, bg(c, t, pal, lights, o.torchHead != null ? { head: o.torchHead, count: 22 } : null), HI.stack(c, t, pal, items, { flat, lights }),
    feet + HI.torchWash(c, t, pal, { amt: o.wash ?? 0, lights }) + HI.motes(t, pal, { amt: 0.6, at: sf.jar, moths: 2, warm: o.wash ?? 0.3 }));
}
// (C) close on his face in the grass. o: eye, talk, wash 0..1 (torch light), legs 0..1 (shadows walking over him), puddle
function face(t, o) {
  const pal = o.pal, c = o.c, flat = HI.DOWN_FLAT, w = o.wash ?? 0;
  const lx = tr([[0, 1.9], [6, 1.4]], t % 6), lights = w > 0.02 ? [{ X: lx, Z: 3.9, r: 2.6, k: w }, { X: lx + 0.5, Z: 5.4, r: 2.2, k: 0.7 * w }] : [];
  const kd = HI.kidProne(c, { ...SPOT.kidDown, eye: o.eye ?? 0, eye2: o.eye2 ?? ((o.eye ?? 0) >= 0.8 ? o.eye : 0), look: o.look ?? 0, squeeze: o.squeeze ?? 1, worry: o.worry ?? 1, mouth: o.talk || 0, breath: o.breath ?? 1 }, t), sf = HI.staffDown(c, { ...SPOT.staff, flame: o.flame ?? 0.5 }, t);
  const items = [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.6 }) }, { Z: SPOT.staff.Z, svg: HI.tint(sf.svg) }, { Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg) },
    { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: o.puddle ?? 0, speed: 0.16 }) }];
  const legs = o.legs ? HI.legShadows(c, t, pal, { Z: SPOT.kidDown.Z - 0.02, dirX: -1, count: 4, speed: 0.3, mag: 0.45, baseY: 0.035, fadeY: [0.05, 0.12], amt: 0.6 * o.legs, x0: c.x - 1.3, x1: c.x + 1.3 }) : "";
  return { kd, svg: frame(pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + HI.hground(c, t, pal, { lights }) + HI.stonePath(c, t, pal, { lights }), HI.stack(c, t, pal, items, { flat, lights, wind: 1 + 0.3 * w }),
    (w > 0.02 ? HI.torchWash(c, t, pal, { amt: w, lights }) : "") + legs + HI.motes(t, pal, { amt: 0.5 + 0.4 * w, warm: w }) + (o.stop ? "" : "")) };
}
// (S) the stop: black, the light rests on him, his eye open a crack
function stop(t, o) {
  const pal = "stop", c = { x: 0.56, y: 0.2, z: 3.42 + (o.push || 0) * 0.08, h0: 900 };
  const lights = [{ X: 0.62, Z: 3.95, r: 0.62 }], flat = HI.DOWN_FLAT;
  const kd = HI.kidProne(c, { ...SPOT.kidDown, eye: o.eye ?? 0.4, look: 0.5, squeeze: 0, worry: 1, breath: 0 }, t);
  const items = [{ Z: SPOT.kidDown.Z, svg: HI.tint(kd.svg) }, { Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: 0.9, speed: 0 }) }];
  return frame(pal, HI.hsky(c, t, pal) + HI.hground(c, t, pal, { lights }), HI.stack(c, t, pal, items, { flat, lights, wind: 0 }),
    HI.torchWash(c, 0.5, pal, { amt: 0.5, spots: [{ ...kd.face, r: kd.face.r * 1.7, k: 0.5 }] }) + HI.stopDark(0.5, { ...kd.face, r: kd.face.r * 1.3, ky: 0.85 }, 0.965));
}
// (J) the candle jar on her staff in the grass: the fear meter
function jar(t, o) {
  const pal = o.pal, c = { x: 0.98 + 0.04 * (o.u || 0), y: 0.16, z: 3.72, h0: 900 }, flat = HI.DOWN_FLAT;
  const sf = HI.staffDown(c, { ...SPOT.staff, flame: o.flame }, t);
  return frame(pal, HI.hsky(c, t, pal) + HI.ridge(c, t, pal) + HI.hground(c, t, pal, {}) + HI.stonePath(c, t, pal, {}), HI.stack(c, t, pal, [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.6 }) }, { Z: SPOT.staff.Z, svg: HI.tint(sf.svg) }], { flat }),
    HI.motes(t, pal, { amt: 0.8, at: sf.jar, moths: 3, warm: 0.4 }));
}
// (F) the plastic fern by the tent (the gag: everything sways, the fern does not)
function fernShot(t, o) {
  const pal = o.pal, c = o.c, flat = HI.CAMP_FLAT;
  return frame(pal, bg(c, t, pal, [], null), HI.stack(c, t, pal, [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.6 }) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) }], { flat, wind: 1.4 }), HI.motes(t, pal, { amt: 0.5 }));
}
// (P) the old stones under the tent: they camped on the path
function pathShot(t, o) {
  const pal = o.pal, c = o.c, flat = HI.CAMP_FLAT;
  return frame(pal, bg(c, t, pal, [], { head: o.head, count: 22 }), HI.stack(c, t, pal, [{ Z: SPOT.tent.Z - 0.9, svg: HI.tent(c, t, pal, { ...SPOT.tent, lit: 0.6 }) }, { Z: SPOT.fern.Z, svg: HI.fern(c, t, pal) }], { flat }), HI.motes(t, pal, { amt: 0.5 }));
}
// (R) the puddle by his face: the flames of the march go by, blurred
function puddleShot(t, o) {
  const pal = o.pal, c = { x: 0.5, y: 0.14, z: 3.3 + 0.03 * (o.u || 0), h0: 860 }, flat = HI.DOWN_FLAT, lights = [{ X: 1.6, Z: 3.9, r: 2.4, k: o.wash }];
  return frame(pal, HI.hsky(c, t, pal) + HI.hground(c, t, pal, { lights }) + HI.stonePath(c, t, pal, { lights }), HI.stack(c, t, pal, [{ Z: SPOT.puddle.Z - 0.02, svg: HI.puddle(c, t, pal, SPOT.puddle, { flames: o.flames, speed: 0.2 }) }], { flat, lights, wind: 1.2 }),
    HI.torchWash(c, t, pal, { amt: o.wash, lights }) + HI.motes(t, pal, { amt: 0.8, warm: 1 }));
}

// camera presets (from the design proof)
const CW = [0.42, 0.95, 1.15], CW2 = [0.42, 0.95, 1.45];               // wide standing
const CPH = [0.2, 1.24, 2.3];   // Sol r1: recentred, her bun was clipped                                          // closer on the phone + her hand
const CF0 = [0.3, 1.0, 0.6, 1160], CF1 = [0.3, 1.25, 0.9, 1240];         // far: tilt up at the ridge
const CB0 = [0.42, 0.62, 1.0, 1000], CB1 = [0.42, 0.62, 1.35, 1000];     // wide-low, both face down
const CK0 = [0.53, 0.2, 3.18, 880], CK1 = [0.53, 0.2, 3.3, 880];          // close on his face
const CH0 = [0.3, 1.6, 1.5, 820], CH1 = [0.3, 1.5, 1.9, 840];          // high: the feet shadows pass round them
const CFN0 = [0.35, 0.55, 2.3, 1000], CFN1 = [0.55, 0.5, 2.75, 1000];     // the camp edge: the fern small, its sticker unreadable (Sol r1)
const CFL = [0.8, 0.42, 3.95, 1500], CFP = [0.8, 0.3, 4.1, 940];          // leaves -> tilt down to the pot and its sticker
const CP0 = [1.5, 0.45, 2.45, 1000], CP1 = [1.55, 0.42, 2.8, 1000];          // high on the stones under the tent

const P_NIGHT = "night", torchy = (u) => HI.mixPal("night", "torch", clamp(u));

// ---------------------------------------------------------------- the beats: [line or null, pre-gap, hold-after, shot fn]
const BEATS = [
  // 1. HOOK: drums far away, he films the torches, her hand covers the lens
  { line: "L01", pre: 0.2, hold: 0.05, shot(u, d, T) {
    const g = tr([[-0.35, 0.25], [0.55, 1, "back"]], u);   // Sol r1: the palm covers the lens by 0.7 s
    return standing(T, { pal: P_NIGHT, c: cam((u + 0.35) / (d + 0.35), CPH, [0.2, 1.22, 2.55]), grab: g, head: 0.56 }); } },
  { line: "L02", pre: 0.1, hold: 0.1, shot(u, d, T) { return far(T, { pal: P_NIGHT, c: cam(u / d, CF0, [0.3, 1.02, 0.75, 1165]), head: 0.57 + u * 0.01 }); } },   // Sol r1: objective ridge, no phone frame
  { line: "L03", pre: 0.05, hold: 0.25, shot(u, d, T, ln) {
    const c2 = wordAt(ln, "face", 0.35);
    return u < c2 ? standing(T, { pal: P_NIGHT, c: cam(u / c2, CW2, [0.42, 0.95, 1.6]), grab: 1, head: 0.58 }) : prone(T, { pal: P_NIGHT, c: cam((u - c2) / (d - c2), CB0, [0.42, 0.62, 1.12, 1000]), torchHead: 0.62, flame: 0.8 }); } },
  // 2. NAME: the marchers, only their light
  { line: "L04", pre: 0.2, hold: 0.1, shot(u, d, T, ln) {
    const c1 = wordAt(ln, "ghost", 0.5), c2 = wordAt(ln, "still", 0.7);
    if (u >= c2) return pathShot(T, { pal: torchy(0.1), c: cam((u - c2) / (d - c2), CP0, CP1), head: 0.8 });   // Sol r1: the stones under "the paths"
    return u < c1 ? far(T, { pal: P_NIGHT, c: cam(u / c1, CF0, CF1), head: 0.6 + 0.1 * u / c1 }) : prone(T, { pal: torchy(0.1), c: cam((u - c1) / (c2 - c1), CB0, CB1), torchHead: 0.75 + 0.05 * (u - c1) / (c2 - c1), flame: 0.7, lights: [{ X: 3.4, Z: 8.5, r: 5.5, k: 0.3 }], wash: 0.2 }); } },
  // 3. STAKES, with whispered comedy
  { line: "L05", pre: 0.2, hold: 0.05, speaker: "K", shot(u, d, T) { return face(T, { pal: torchy(0.12), c: cam(u / d, CK0, CK1), talk: TK(T), squeeze: 0.8, flame: 0.7 }).svg; } },
  { line: "L06", pre: 0.15, hold: 0.15, shot(u, d, T) { return pathShot(T, { pal: torchy(0.12), c: cam(u / d, CP0, CP1), head: 0.86 }); } },
  { line: "L07", pre: 0.15, hold: 0.05, speaker: "K", shot(u, d, T) { return face(T, { pal: torchy(0.14), c: cam(u / d, CK1, [0.53, 0.2, 3.36, 880]), talk: TK(T), squeeze: 0.7, flame: 0.65 }).svg; } },
  { line: "L08", pre: 0.1, hold: 0.25, shot(u, d, T) { return prone(T, { pal: torchy(0.16), c: cam(u / d, CB1, [0.42, 0.62, 1.55, 1000]), torchHead: 0.88, flame: 0.6, lights: [{ X: 3.4, Z: 8.5, r: 5.5, k: 0.4 }], wash: 0.3, gEye: 0 }); } },
  // 4. PROOF: drums, conch, torches where no one should be
  { line: "L09", pre: 0.2, hold: 0.1, music: "warning", shot(u, d, T, ln) {
    const c1 = wordAt(ln, "drums", 0.45), c2 = wordAt(ln, "and", 0.8);
    if (u < c1) return far(T, { pal: torchy(0.2), c: cam(u / c1, CF1, [0.3, 1.3, 1.1, 1250]), head: 0.92 });
    if (u < c2) return prone(T, { pal: torchy(0.28), c: cam((u - c1) / (c2 - c1), [0.42, 0.62, 1.55, 1000], [0.42, 0.62, 1.8, 1000]), torchHead: 0.96, flame: 0.5, lights: [{ X: 3.0, Z: 7.5, r: 5, k: 0.55 }], wash: 0.45 });
    return puddleShot(T, { pal: torchy(0.4), u: (u - c2) / (d - c2), flames: 0.5, wash: 0.4 }); } },
  { line: "L10", pre: 0.15, hold: 0.2, shot(u, d, T) { return jar(T, { pal: torchy(0.3), flame: tr([[0, 0.5], [d, 0.38]], u), u: u / d }); } },
  // 5. ESCALATE: the one protection, and they have a plastic fern
  { line: "L11", pre: 0.2, hold: 0.1, music: "fern", shot(u, d, T) { return fernShot(T, { pal: torchy(0.3), c: cam(u / d, CFN0, CFN1) }); } },
  { line: "L12", pre: 0.15, hold: 0.1, speaker: "K", shot(u, d, T) { return face(T, { pal: torchy(0.32), c: cam(u / d, CK0, CK1), talk: TK(T), squeeze: 0.6, worry: 0.6, flame: 0.4, wash: 0.15 }).svg; } },
  { line: "L13", pre: 0.25, hold: 0.35, shot(u, d, T) { return fernShot(T, { pal: torchy(0.34), c: cam(u / Math.min(d, 1.0), CFL, CFP) }); } },
  { line: "L14", pre: 0.0, hold: 0.3, speaker: "K", shot(u, d, T) { return face(T, { pal: torchy(0.36), c: cam(u / d, [0.53, 0.2, 3.36, 880], [0.53, 0.2, 3.4, 880]), talk: TK(T), squeeze: 1, worry: 0.3, flame: 0.38, wash: 0.2 }).svg; } },
  // 6. THE FEAR PEAK: what happens if you look; the light floods over them
  { line: "L15", pre: 0.35, hold: 0.1, music: "pass", speaker: "K", shot(u, d, T) { return face(T, { pal: torchy(0.55), c: cam(u / d, CK0, CK1), talk: TK(T), squeeze: 1, flame: 0.3, wash: 0.45 + 0.2 * u / d }).svg; } },
  { line: "L16", pre: 0.15, hold: 0.3, shot(u, d, T) {
    return prone(T, { pal: torchy(0.75), c: cam(u / d, CH0, CH1), flame: 0.25, lights: [{ X: 1.8, Z: 4.6, r: 3.2, k: 0.9 }], wash: 0.8, puddle: 0.6, feet: { from: [1.6, 7.5], to: [1.0, 1.8], away: [-1, 0.12], count: 6, speed: 0.55, amt: 0.45 } }); } },
  { line: "L17", pre: 0.2, hold: 0.1, shot(u, d, T, ln) {
    const c1 = wordAt(ln, "if", 0.4), c2 = wordAt(ln, "that", 0.78);
    if (u < c1) return face(T, { pal: "torch", c: cam(u / c1, [0.53, 0.2, 3.22, 880], [0.53, 0.2, 3.3, 880]), squeeze: 1, flame: 0.22, wash: 1, legs: 1, puddle: 1 }).svg;
    if (u < c2) return puddleShot(T, { pal: "torch", u: (u - c1) / (c2 - c1), flames: 1, wash: 1 });
    return jar(T, { pal: "torch", flame: tr([[c2, 0.2], [d, 0.1]], u), u: (u - c2) / (d - c2) }); } },
  // 7. THE TURN: he sneezes, his eye opens a crack, everything stops
  { line: "L18", pre: 0.15, hold: 0.0, speaker: "K", shot(u, d, T) {
    const jerk = u > d - 0.35 ? Math.sin((u - d + 0.35) / 0.35 * Math.PI) * 0.035 : 0;
    const c = cam(u / d, [0.55, 0.2, 3.34, 890], [0.56, 0.2, 3.42, 900]); c.y += jerk; c.z -= jerk * 1.5;
    return face(T, { pal: "torch", c, talk: TK(T), squeeze: 1, worry: 1, flame: 0.12, wash: 1, legs: 1, puddle: 1, eye: u > d - 0.25 ? 0.36 : 0 }).svg; } },
  { line: null, dur: 1.1, pre: 0, hold: 0, music: "stop", shot(u, d, T) { return stop(T, { eye: tr([[0, 0.34], [d, 0.4]], u), push: u / d * 0.5 }); } },
  { line: "L19", pre: 0.0, hold: 0.4, shot(u, d, T) { return stop(T, { eye: 0.42, push: 0.5 + 0.5 * u / d }); } },
  // 8. THE END: the march goes on (Sol r1: the points recede before he reacts); who was that
  { line: null, dur: 1.6, pre: 0, hold: 0, music: "claimed", shot(u, d, T) { return far(T, { pal: "after", c: cam(u / d, CF1, CF0), head: lerp(0.8, 0.5, u / d), count: 22, amt: lerp(1, 0, clamp((u - d * 0.35) / (d * 0.65))) }); } },
  { line: "L20", pre: 0.0, hold: 0.1, speaker: "K", shot(u, d, T) { return face(T, { pal: "after", c: cam(u / d, CK0, CK1), talk: TK(T), eye: 0.9, look: 0.3, squeeze: 0, worry: 0.8, flame: 0.6 }).svg; } },
  { line: "L21", pre: 0.15, hold: 0.15, shot(u, d, T, ln) {
    return face(T, { pal: "after", c: cam(u / d, [0.62, 0.22, 3.22, 880], [0.53, 0.2, 3.36, 880]), eye: 1, look: 0, squeeze: 0, worry: 0.2, flame: 0.8 }).svg; } },   // ear -> eyes
  { line: "L22", pre: 0.15, hold: 0.15, speaker: "K", shot(u, d, T) { return face(T, { pal: "after", c: cam(u / d, [0.53, 0.2, 3.38, 880], [0.53, 0.2, 3.44, 880]), talk: TK(T), eye: 1, squeeze: 0, worry: 0, flame: 0.9 }).svg; } },
  { line: "L23", pre: 0.2, hold: 0.25, end: true, shot(u, d, T) { return prone(T, { pal: "after", c: cam(u / d, CB0, [0.42, 0.62, 1.2, 1000]), torchHead: null, flame: 1, kidEye: 1, gEye: 0.6, tentLit: 0.6 }); } },
];

// ---------------------------------------------------------------- the timeline
const TL = []; let t = 0;
for (const b of BEATS) {
  const ln = b.line ? LINE[b.line] : null, d = ln ? ln.dur : b.dur;
  const st = t + (b.pre || 0);
  TL.push({ ...b, ln, at: t, lineAt: st, d, end: st + d + (b.hold || 0) });
  t = st + d + (b.hold || 0);
}
export const DUR = Math.round(t * FPS) / FPS;
export const TIMELINE = TL;
const TK = (time) => { for (const b of TL) if (b.ln && b.ln.who === "K" && time >= b.lineAt && time < b.lineAt + b.d) return b.ln.env[Math.floor((time - b.lineAt) * FPS)] || 0; return 0; };

// ---------------------------------------------------------------- captions: word by word in the upper third
const KEY = /^(huaka|pō|po$|night|marchers|never|ti$|plastic|look|home|ancestor|mine|ears|hawaiian|hawaii)/i;
function captions(time) {
  // Sol r2: a caption never outlives its beat (no tails over the next shot); it sits at y 560 (upper third, under the moon)
  const b = TL.find((x) => x.ln && time >= x.lineAt && time < Math.min(x.lineAt + x.d + 0.35, x.end));
  if (!b || !b.ln.words.length) return "";
  const u = time - b.lineAt, P = b.ln.phrases;
  let pi = -1; for (let i = 0; i < P.length; i++) if (u >= P[i].at - 0.04) pi = i;
  if (pi < 0) return "";
  const ch = P[pi].ws;
  const col = (w) => (KEY.test(w[0].replace(/[^a-zʻō]/gi, "")) ? "#ffc04a" : "#ffffff");
  const span = (ws) => ws.map((w) => `<tspan fill="${col(w)}">${w[0].replace(/&/g, "&amp;")}</tspan>`).join(" ");
  const len = (ws) => ws.reduce((a, w) => a + w[0].length + 1, -1);
  // 2 rows when the phrase is long, split where the rows come out most even
  let k = ch.length;
  if (len(ch) > 19 && ch.length > 1) { let best = 1e9; for (let i = 1; i < ch.length; i++) { const d2 = Math.abs(len(ch.slice(0, i)) - len(ch.slice(i))); if (d2 < best) { best = d2; k = i; } } }
  const rows = k < ch.length ? [ch.slice(0, k), ch.slice(k)] : [ch];
  const fs = Math.min(74, Math.round(940 / Math.max(1, Math.max(...rows.map(len)) * 0.6)));
  return rows.map((r, i) => `<text x="540" y="${n(560 + (i - (rows.length - 1) / 2) * fs * 1.08)}" text-anchor="middle" font-family="Inter" font-weight="900" font-size="${fs}" stroke="#120c24" stroke-width="${Math.round(fs * 0.19)}" stroke-linejoin="round" paint-order="stroke" letter-spacing="-1">${span(r)}</text>`).join("");
}


// ---------------------------------------------------------------- one frame
export function draw(time) {
  L.resetIds();
  const b = TL.find((x) => time >= x.at && time < x.end) || TL[TL.length - 1];
  const u = time - b.lineAt;
  return b.shot(Math.max(u, -0.4), b.d, time, b.ln) + captions(time) + "</svg>";
}

// ---------------------------------------------------------------- the sound mix: voices, the string score (Sol's cue
// sheet), the night bed, the march (drums far -> close, cut at the stop), a conch, torches, bare feet in the grass
export const HEAD = `<style>@font-face { font-family: Inter; font-weight: 900; src: url(data:font/otf;base64,${readFileSync("assets/fonts/Inter-Black.otf").toString("base64")}); }</style>`;
const bed = (id) => { const m = JSON.parse(readFileSync("assets/music/ai/manifest.json", "utf8")).sounds.find((x) => x.id === id); return m ? `assets/music/ai/${m.files[0]}` : null; };
const sfxf = (id) => { const c = JSON.parse(readFileSync("assets/sfx/ai/manifest.json", "utf8")).sounds.find((s) => s.id === id); return c ? `assets/sfx/ai/${c.files[0]}` : null; };
export function prepare() {
  mkdirSync(OUT, { recursive: true });
  const at = (id) => TL.find((b) => b.line === id), mus = (k) => TL.find((b) => b.music === k);
  const ins = [], f = [];
  const add = (file, t0, gain = 1, extra = "") => { if (!file) return; ins.push("-i", file); const k = ins.length / 2 - 1; f.push(`[${k}:a]${extra}volume=${gain},adelay=${Math.round(t0 * 1000)}:all=1[a${k}]`); };
  const loop = (file, t0, t1, gain, fi = 0.2, fo = 0.2) => add(file, t0, gain, `aloop=loop=-1:size=2e9,atrim=0:${(t1 - t0).toFixed(2)},afade=t=in:d=${fi},afade=t=out:st=${(t1 - t0 - fo).toFixed(2)}:d=${fo},`);
  for (const b of TL) if (b.ln) add(`${VOICE}/${b.ln.id}.wav`, b.lineAt, { M: 1.05, K: 1.45 }[b.ln.who] ?? 1);   // Jonny 26 Nov 22:34: kid still a bit louder
  // score: Sol's six cues at the story's turns, 10 dB under the voices, nothing at the stop
  const stopB = mus("stop"), stopAt = stopB.at, claimAt = mus("claimed").at + 0.05;
  const cues = [["nm-caution", 0, at("L05").at], ["nm-deadpan", at("L05").at, mus("warning").at], ["nm-warning", mus("warning").at, mus("fern").at], ["nm-fern", mus("fern").at, mus("pass").at], ["nm-pass", mus("pass").at, stopAt]];
  for (const [id, a, z] of cues) loop(bed(id), a, z + 0.2, id === "nm-warning" || id === "nm-pass" ? 0.26 : 0.32, a === 0 ? 0.02 : 0.2, z === stopAt ? 0.005 : 0.2);
  loop(bed("nm-claimed"), claimAt, DUR, 0.34, 0.25, 0.01);
  // the world: night insects all through except the stop; the march drums from 0.0, swelling, cut dead at the stop, then fading away
  loop(sfxf("night-insects"), 0, stopAt, 0.5, 0.02, 0.005); loop(sfxf("night-insects"), claimAt, DUR, 0.5, 0.6, 0.01);
  const dr = sfxf("march-drums");
  if (dr) {
    const swell = `volume='if(lt(t,${at("L15").at.toFixed(2)}),0.18+0.32*t/${at("L15").at.toFixed(2)},0.5+0.4*min(1,(t-${at("L15").at.toFixed(2)})/3))':eval=frame,`;
    add(dr, 0, 1, `aloop=loop=-1:size=2e9,atrim=0:${stopAt.toFixed(2)},${swell}afade=t=out:st=${(stopAt - 0.005).toFixed(2)}:d=0.005,`);
    add(dr, claimAt, 0.5, `aloop=loop=-1:size=2e9,atrim=0:${(DUR - claimAt).toFixed(2)},afade=t=out:st=0.2:d=${(DUR - claimAt - 0.3).toFixed(2)},`);
  }
  const conch = sfxf("conch-call"); add(conch, 0.05, 0.45); add(conch, at("L09").lineAt + wordAt(at("L09").ln, "conch", 0.6) - 0.1, 0.6);
  loop(sfxf("torch-flame"), at("L15").at, stopAt, 0.7, 0.8, 0.005);
  const steps = JSON.parse(readFileSync("assets/sfx/catalog.json", "utf8")).sounds["kenney/footstep-grass"]?.files || [];
  for (let i = 0, t0 = at("L16").at; t0 + i * 0.42 < stopAt - 0.2; i++) if (steps.length) add(`assets/sfx/${steps[i % steps.length]}`, t0 + i * 0.42 + (i % 3) * 0.05, 0.22);
  add("assets/sfx/kenney/rpg/cloth1.ogg", at("L03").lineAt + wordAt(at("L03").ln, "face", 0.35), 0.7);
  const mixPath = `${OUT}/mix.wav`, k = ins.length / 2;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", f.join(";") + ";" + Array.from({ length: k }, (_, i) => `[a${i}]`).join("") + `amix=inputs=${k}:normalize=0,atrim=0:${DUR.toFixed(2)},loudnorm=I=-14:TP=-1.5[out]`, "-map", "[out]", "-ar", "44100", "-ac", "2", mixPath]);
  writeFileSync(`${OUT}/timeline.json`, JSON.stringify(TL.map((b) => ({ line: b.line, at: +b.at.toFixed(2), lineAt: +(b.lineAt ?? 0).toFixed(2), d: +(b.d ?? 0).toFixed(2), end: +b.end.toFixed(2) })), null, 1));
  return mixPath;
}
export const GAIN = 1;
