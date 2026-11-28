// Legend channel, "Pandora's jar" (Hesiod, Works and Days 42-105): sets, cast, the pithos, the evils, Hope.
// Code-drawn in the legend.mjs projection and the legend-greece.mjs style (flat fills, thin dark outline, one shade
// tone, painted light = flat hand-cut screen shapes). World: metres, X right, Y up, Z into the picture; camera
// c = { x, y, z, h0?, f? }. Cast local: cm, feet at 0, up = -y, drawn facing right (dir -1 mirrors).
// Every wobble, chip, crack, strand and dust mote is seeded (hash): a frame is a pure function of (camera, t, state).
// The hosts are NOT here: use L.kid / L.keeper from legend.mjs. No text in any of these (the title lives in
// legend-pandora-title.mjs).
//
// FRAME ORDER   mood(threat)       FIRST, every frame (it also sets legend-greece's M). -1 = warm and safe (lamp, forge,
//                                  hope), 0 = calm blue night, 1 = cold threat (the jar is open, the evils are out).
//               defs() <set .back> stack([...set.items, cast...]) grade() <overlays> vignette()
//               overlays = things that must stay bright AFTER the grade: room().light, pithos().overlay (the crack and
//               Hope), fennel().light, swarm()/evil() (their silver edge), gift(), blackout().
// COLOUR        X.<key> = this module's mood palette (clay, wax, cord, earth floor); M.<key> = legend-greece's.
//               Re-exported from legend-greece: defs, grade, vignette, blackout, stack, sky, M.
//
// SETS  (world sets take the camera; the two tableau sets are screen space and take c only for a slow drift)
//   room(c,t,st) -> { back, items, svg, light, jar, lampAt }          (a) Epimetheus' house at night
//       st: { lamp 0..1 (oil lamp on its peg), moon 0..1 (courtyard light through the doorway), dust 0..1,
//             jar: {pithos state} | false, stool: {X,Z} | false (move it to the jar: she needs it to reach the lid) }.
//             ROOM = { x0,x1,z1,h, door, jar:{X,Z}, lamp, stool:{X,Z,h} }.
//       items holds the stool, the amphora and the pithos; add your cast and stack(). light = lamp glow + dust motes +
//       the jar's overlay: draw it after grade(). jar = the pithos() result. Suggested cameras: CAM.room, CAM.jarCU.
//   pithos(c,st,t) -> { svg, overlay, mouth, knob, chip, top, p, Z }   the jar, taller than a man, sunk in the floor
//       st: { X, Z, lid 0..1 (0 on, 1 lifted off and tilted), crack 0..1 (lid up a finger's width on the left: frame 0),
//             broken (bool: wax seal and cord broken; default = crack > 0 || lid > 0), slam 0..1 (dust puff off the rim
//             as the lid lands), hope 0..1 (the tiny warm light under the rim, seen through the chipped rim; same flame
//             colours as Grandma's candle jar), gapLight 0..1 (cold light in the gap, default 1), lit -1|1 (lamp side) }
//       mouth = screen point where things leave the jar (give it to swarm as `at`), knob = the lid's handle (hand
//       target), chip = where Hope sits, top = rim centre.  PITHOS = { h, r } in metres.
//   stormSky(c,t,st) -> svg           (b) Olympus: Zeus as a face in the storm clouds.  st: { laugh 0..1 (0 sly closed
//       grin, 1 head-back laugh, jaw of cloud drops, eyes squeeze), flash 0..1 (lightning: bolts + lit cloud edges),
//       look -1..1 (the eyes) }.  zeus(t, st) is the face alone (screen space, centre 540,700).
//   forge(c,t,st) -> { svg, light }   (c) Hephaestus' forge, only his hands.  st: { form 0..1 (0 mud heap, 0.4 a rough
//       clay post, 0.75 a woman of clay, 1 smoothed; the swaps at 0.4 and 0.75 want the hands closed: press 1),
//       press 0..1 (the two big soot-black hands close around it), glow 0..1 (the hearth), wet 0..1 (water on the mud) }
//   doorFront(c,t,st) -> { back, items, svg, light, doorAt }    (d)+(e) the door of Epimetheus' house from outside.
//       st: { open 0..1 (the leaf swings in), inside 0..1 (lamp light in the doorway), jarPeek (bool: the pithos seen
//       inside, default true), dusk 0..1 (sunset bands and a low sun instead of the moon) }. Hermes arriving =
//       mood(-0.7) + dusk 1; the Prometheus warning = mood(0.25), dusk 0. DOOR = { X, w, h, Z, wallH }.
//
// CAST  each -> { svg, handN, handF, lips, head, eye, p, Z }  (screen points; handN = the near hand)
//   pandora(c,st,t)      st: { X, Z, dir 1|-1, pose, clay 0..1 (unpainted mud, eyes shut: the forge), smile 0..1,
//                              dress (false = the clay woman before Athena's gift), blink 0..1, look -1..1, walk (phase) }
//       poses PANDORA.stand | walk | reach | lift | slam | look     pandoraPose(a,b,u) blends two
//   prometheus(c,st,t)   poses PROMETHEUS.stand | grip | warn       st + burnt (bool, default true: the far hand)
//   epimetheus(c,st,t)   poses EPIMETHEUS.stand | delighted | yawn | wave | gripped
//   hermes(c,st,t)       poses HERMES.stand | walk | present
//   insertMan(c,st,t)    st: { kind "farmer" | "old", cough 0..1, grey 0..1 (hair and beard go white, he stoops) }
//       any pose field can be overridden in st: lean, bend, fx, tilt, hN:[x,y], hF:[x,y] (hand targets, cm), sN/sF (hand
//       shape "open"|"reach"|"flat"|"grip"|"relax"|"pinch"), aN/aF (hand angle deg), talk 0..1, brow -1..1,
//       turn 0..1 (the near shoulder comes forward: use it when the near arm reaches, or it crosses the face),
//       rise 0..1 (tiptoe), Y (metres above the floor: Pandora on the stool = ROOM.stool.h).
//
// PROPS
//   gift(kind, st, t) -> svg     kind "dress" (Athena) | "smile" (Aphrodite) | "tongue" (Hermes: a forked silver wisp);
//       st: { at:{x,y}, s (px per metre), u 0..1 (arrives) }. For smile/tongue pass pandora().lips as at.
//   fennel(c,st,t) -> { svg, light }   Prometheus' fennel stalk.  st: { at, s, rot, ember 0..1 } or { X, Y, Z }
//   evil(c,st,t) -> svg          one evil.  st: { at:{x,y} | X,Y,Z, s, kind "moth"|"smoke"|"sick"|"toil"|"age", size,
//       seed, dir (deg, heading), squeeze 0..1 (flattened as it slides through the crack) }. No face, no mouth, ever.
//   swarm(c,t,st) -> svg         st: { at:{x,y,s} (pithos().mouth) | X,Y,Z, count, spread (deg), out 0..1 (how much of
//       the swarm has left the jar), seed, aim (deg, 0 = up, -90 = left), reach (metres), kinds }
//   hopeLight(at, s, t, amt) -> svg     the tiny flame alone (screen space)
//   candleJarCU(t, st) -> svg    the ending: Grandma's candle jar large in frame.  st: { reach 0..1 (the kid's hand
//       comes up to the lid; at 1 the lid is up a finger's width), slap 0..1 (Grandma's hand comes down flat and shuts
//       it; the kid's hand jumps back), flame 0..1 }
import * as L from "./legend.mjs";
import * as GR from "./legend-greece.mjs";
const { W, H, INK, P, n, lerp, clamp, hash, mix, ease, place } = L;
const { M } = GR, { wpoly, dabs, lightBlobs, blob, ring, crack, chip, shutterWin, stroke, limb2, lineD, jit, poly, pt } = GR.kit;
export { M };
export const { defs, grade, vignette, blackout, stack, sky } = GR;

const HOPE = { core: "#fff1b8", flame: "#ffd36a", edge: "#ff9a3a", glow: "#ffc35a" };   // = the flame in keeper()'s jar
const VOID = "#07060e", SILVER = "#cfdaff";
const xy = (x, y) => ({ x, y });
const P2 = (a) => "M" + a.map(([x, y]) => `${n(x)},${n(y)}`).join(" L");
const smooth = (a, close) => { if (a.length < 3) return lineD(a); const m = a.map((p, i) => { const q = a[(i + 1) % a.length]; return xy((p.x + q.x) / 2, (p.y + q.y) / 2); }); return close ? blob(a) : `M${pt(a[0])} L${pt(m[0])} ` + a.slice(1, -1).map((p, i) => `Q${pt(p)} ${pt(m[i + 1])}`).join(" ") + ` L${pt(a[a.length - 1])}`; };
const rot2 = (x, y, deg) => { const a = deg * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };
let UID = 0;

// ---------------------------------------------------------------- mood: [warm -1, calm 0, cold 1]
const MOODS = {
  clay: ["#f6c476", "#a7a2ee", "#2a4796"], clayL: ["#ffe6ae", "#d6d4ff", "#4f74cc"], clayS: ["#cc6a2c", "#5c52b8", "#0e1d52"], clayD: ["#7c3222", "#2c2878", "#040b22"],
  wax: ["#b8281a", "#8a2470", "#40174e"], waxL: ["#f0603a", "#c85aa8", "#6a3a8a"], waxD: ["#6a1218", "#4a1248", "#1c0a2a"],
  cord: ["#f0dc98", "#b8b2e6", "#3c4e94"], cordS: ["#a8782c", "#6460a8", "#16224e"],
  earth: ["#c0602c", "#34409e", "#0a1236"], earth2: ["#e0843a", "#4658c0", "#101e4c"], earthS: ["#6e2c26", "#1a2268", "#030616"],
  mat: ["#e8b04a", "#6a7ad8", "#16285e"], matS: ["#b8342c", "#3a3c9a", "#0a1238"],
  reed: ["#b8843a", "#4a4a9a", "#0c1434"], night: ["#3a1c7a", "#0d1a66", "#02050f"],
};
export const X = {};
let TH = 0;
export function mood(threat = 0) {
  TH = Math.max(-1, Math.min(1, threat)); GR.mood(TH); UID = 0;
  for (const k in MOODS) { const m = MOODS[k]; X[k] = TH < 0 ? mix(m[1], m[0], -TH) : mix(m[1], m[2], TH); }
  return X;
}
mood(0);
export const resetIds = () => { UID = 0; };
export const CAM = { room: { x: 0, y: 1.35, z: 0.55, h0: 1240 }, jarCU: { x: 1.05, y: 1.8, z: 2.8, h0: 1180 }, door: { x: 0, y: 1.3, z: 0.4, h0: 1180 }, jarLow: { x: 1.1, y: 0.9, z: 2.2, h0: 1260 } };

// ================================================================ the pithos
export const PITHOS = { h: 2.02, r: 0.67, sunk: 0.3 };
const PROF = [[0, 0.5], [0.3, 0.6], [0.75, 0.67], [1.12, 0.63], [1.42, 0.52], [1.63, 0.39], [1.76, 0.33], [1.86, 0.345], [1.93, 0.4], [1.97, 0.44], [2.02, 0.44]];
const profR = (y) => { for (let i = 1; i < PROF.length; i++) if (y <= PROF[i][0]) { const a = PROF[i - 1], b = PROF[i], u = (y - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], u * u * (3 - 2 * u)); } return PROF[PROF.length - 1][1]; };
export function pithos(c, st = {}, t = 0) {
  const X0 = st.X ?? ROOM.jar.X, Z0 = st.Z ?? ROOM.jar.Z, seed = st.seed ?? 3, lit = st.lit ?? -1;
  if (Z0 - c.z < 0.5) return { svg: "", overlay: "", mouth: null, knob: null, chip: null, top: null, Z: Z0 };
  const lid = clamp(st.lid ?? 0), ck = clamp(st.crack ?? 0) * (1 - lid), broken = st.broken ?? (ck > 0 || lid > 0), slam = clamp(st.slam ?? 0), hope = clamp(st.hope ?? 0), gl = clamp(st.gapLight ?? 1);
  const base = P(c, X0, 0, Z0), k = base.s, lean = 0.012;
  const at = (Y) => { const p = P(c, X0 + lean * Y, Y, Z0); return { x: p.x, y: p.y, e: clamp((c.y - Y) / (Z0 - c.z) * 1.0 + 0.5, 0.42, 0.58) * 2 - 1 }; };   // e = ellipse squash (+ = seen from above)
  const el = (Y, r, a, wob = 0) => { const q = at(Y), an = a * Math.PI / 180; return xy(q.x + Math.cos(an) * r * k * (1 + wob), q.y + Math.sin(an) * r * k * q.e); };
  const arc = (Y, r, a0, a1, kk = 14) => Array.from({ length: kk + 1 }, (_, i) => el(Y, r, lerp(a0, a1, i / kk)));
  const C = X, HT = PITHOS.h;
  // --- body
  const ys = Array.from({ length: 27 }, (_, i) => i / 26 * HT);
  const left = ys.map((y, i) => el(y, profR(y) * (1 + jit(seed + i * 1.3, 0.012)), 180)), right = ys.map((y, i) => el(y, profR(y) * (1 + jit(seed + i * 1.7 + 40, 0.014)), 0));
  const top = at(HT), eT = top.e, rT = profR(HT);
  const body = [...left, ...arc(HT, rT, 180, 360, 10).slice(1, -1).map((p) => (eT > 0 ? p : xy(p.x, 2 * top.y - p.y))), ...right.slice().reverse(), ...arc(0, 0.5, 0, 180, 8).slice(1, -1)];
  let s = `<path d="${lineD(body, true)}" fill="${C.clay}" stroke="${INK}" stroke-width="${n(Math.max(1.4, 0.012 * k))}" stroke-linejoin="round"/>`;
  const cid = `pj${UID++}`;
  s += `<clipPath id="${cid}"><path d="${lineD(body, true)}"/></clipPath><g clip-path="url(#${cid})">`;
  // one shade tone on the side away from the lamp (a hand-cut edge), one lit strip on the lamp side
  const sd = lit < 0 ? 1 : -1, shadeIn = ys.map((y, i) => { const q = at(y); return xy(q.x + sd * profR(y) * k * (0.34 + jit(seed + i * 2.9, 0.07) + 0.1 * Math.sin(i * 0.9)), q.y); });
  s += `<path d="${lineD([...shadeIn, ...(sd > 0 ? right : left).slice().reverse().map((p) => xy(p.x + sd * 30, p.y))], true)}" fill="${C.clayS}"/>`;
  const litIn = ys.map((y, i) => { const q = at(y); return xy(q.x - sd * profR(y) * k * (0.74 + jit(seed + i * 3.3, 0.04)), q.y); }), litOut = ys.map((y, i) => { const q = at(y); return xy(q.x - sd * profR(y) * k * (0.9 + jit(seed + i * 3.7, 0.025)), q.y); });
  s += `<path d="${lineD([...litIn.slice(3, 22), ...litOut.slice(3, 22).reverse()], true)}" fill="${C.clayL}" opacity="0.8"/>`;
  // coil ridges from the building (faint), kiln stains, drips
  for (let i = 0; i < 9; i++) { const y = 0.25 + i * 0.16 + jit(seed + i * 5, 0.03), r = profR(y), a0 = 180 - 20 - hash(seed + i) * 60, a1 = a0 - 30 - hash(seed + i + 7) * 60; s += stroke(lineD(arc(y, r, a0, a1, 6)), C.clayS, Math.max(1, 0.008 * k), `opacity="0.55"`); }
  for (let i = 0; i < 7; i++) { const y = 0.2 + hash(seed + i * 3.1) * 1.3, a = 20 + hash(seed + i * 4.3) * 140, p0 = el(y, profR(y), a); s += `<path d="${blob(ring(p0.x, p0.y, (0.04 + 0.07 * hash(seed + i)) * k, seed + i * 9, 8, 0.3, 1.5))}" fill="${i % 2 ? C.clayS : C.clayL}" opacity="0.35"/>`; }
  // three rope bands moulded in the clay: every twist is its own stroke
  for (const [bi, by] of [0.52, 1.08, 1.5].entries()) {
    const bh = 0.045, r = (y) => profR(y) * 1.035, lo = arc(by - bh, r(by - bh), 180, 0, 22), hi = arc(by + bh, r(by + bh), 0, 180, 22);
    s += `<path d="${lineD([...lo, ...hi], true)}" fill="${C.clay}" stroke="${INK}" stroke-width="${n(Math.max(1, 0.007 * k))}" stroke-linejoin="round"/>`;
    const N = 30 + bi * 2;
    for (let i = 0; i < N; i++) {
      const a = 176 - (i + 0.5 + jit(seed + bi * 50 + i, 0.2)) / N * 172, da = 5 + 4 * Math.abs(Math.cos(a * Math.PI / 180)), p0 = el(by - bh * 0.85, r(by), a + da * 0.5), p1 = el(by + bh * 0.85, r(by), a - da * 0.5), shade = sd > 0 ? a < 62 : a > 118;
      s += `<path d="M${pt(p0)} Q${n(lerp(p0.x, p1.x, 0.3) + jit(seed + i * 3 + bi, 0.006 * k))},${n(lerp(p0.y, p1.y, 0.6))} ${pt(p1)}" stroke="${shade ? C.clayD : C.clayS}" stroke-width="${n(Math.max(1.2, (0.013 + 0.006 * hash(seed + i + bi * 9)) * k))}" fill="none" stroke-linecap="round"/>`;
      if (!shade && i % 3 === bi) s += `<path d="M${n(lerp(p0.x, p1.x, 0.25) + 0.012 * k)},${n(lerp(p0.y, p1.y, 0.25))} L${n(lerp(p0.x, p1.x, 0.7) + 0.012 * k)},${n(lerp(p0.y, p1.y, 0.7))}" stroke="${C.clayL}" stroke-width="${n(Math.max(1, 0.007 * k))}" stroke-linecap="round"/>`;
    }
  }
  // a wavy line scratched under the neck, thumb dimples on the shoulder
  { const a = []; for (let i = 0; i <= 40; i++) { const an = 176 - i / 40 * 172; a.push(el(1.67 + 0.022 * Math.sin(i * 1.55 + jit(seed + i, 0.4)), profR(1.67), an)); } s += stroke(smooth(a), C.clayD, Math.max(1.1, 0.008 * k), `opacity="0.8"`); }
  for (let i = 0; i < 11; i++) { const an = 170 - i * 16 + jit(seed + i * 2.1, 3), p0 = el(1.33 + jit(seed + i, 0.012), profR(1.33), an), w = 0.026 * k * Math.abs(Math.sin(an * Math.PI / 180)) + 1; s += `<ellipse cx="${n(p0.x)}" cy="${n(p0.y)}" rx="${n(w)}" ry="${n(0.022 * k)}" fill="${C.clayS}"/><path d="M${n(p0.x - w)},${n(p0.y + 0.016 * k)} q${n(w)},${n(0.012 * k)} ${n(w * 2)},0" stroke="${C.clayL}" stroke-width="1" fill="none" opacity="0.7"/>`; }
  // cracks in the fired clay
  for (const [y0, a0, len, sdc] of [[1.25, 128, 0.42, 1], [0.86, 62, 0.3, 2], [0.4, 105, 0.24, 3], [1.02, 150, 0.2, 4]]) {
    const a = []; let y = y0, an = a0; for (let i = 0; i < 7; i++) { a.push(el(y, profR(y) * 1.0, an)); y -= len / 6 * (0.5 + hash(seed + sdc * 9 + i)); an += jit(seed + sdc * 7 + i, 5); }
    s += `<path d="${lineD(a)} M${pt(a[3])} l${n(jit(seed + sdc, 0.07) * k)},${n(0.05 * k)}" stroke="${C.clayD}" stroke-width="${n(Math.max(1, 0.007 * k))}" fill="none" stroke-linejoin="round"/>`;
  }
  s += `</g>`;
  // the two lugs on the shoulder
  const lugMid = (sgn) => { const a = el(1.55, profR(1.55), sgn < 0 ? 180 : 0), b = el(1.34, profR(1.34), sgn < 0 ? 180 : 0); return xy(lerp(a.x, b.x, 0.5) + sgn * 0.1 * k, lerp(a.y, b.y, 0.5) - 0.02 * k); };
  const lugD = (sgn) => { const a = el(1.55, profR(1.55) * 0.98, sgn < 0 ? 180 : 0), b = el(1.34, profR(1.34) * 0.99, sgn < 0 ? 180 : 0), ox = sgn * 0.13 * k; return `M${pt(a)} C${n(a.x + ox)},${n(a.y - 0.03 * k)} ${n(b.x + ox * 1.1)},${n(b.y - 0.02 * k)} ${pt(b)}`; };
  for (const sgn of [-1, 1]) s += stroke(lugD(sgn), INK, 0.062 * k + 2.4) + stroke(lugD(sgn), sgn * sd > 0 ? C.clayS : C.clay, 0.062 * k);
  // the rim: a thick lip, chipped. The big chip (front left) is where Hope shows.
  const rimLo = HT - 0.075, lipPts = [...arc(rimLo, 0.445, 180, 0, 16), ...arc(HT, 0.445, 0, 180, 16)];
  s += `<path d="${lineD(lipPts, true)}" fill="${C.clayL}" stroke="${INK}" stroke-width="${n(Math.max(1.2, 0.009 * k))}" stroke-linejoin="round"/>`;
  s += `<path d="${lineD([...arc(rimLo, 0.445, sd > 0 ? 58 : 122, sd > 0 ? 0 : 180, 6), ...arc(HT, 0.445, sd > 0 ? 0 : 180, sd > 0 ? 50 : 130, 6)], true)}" fill="${C.clayS}"/>`;
  if (eT > 0.02) s += `<path d="${blob(arc(HT, 0.445, 0, 340, 16))}" fill="${C.clayL}" stroke="${INK}" stroke-width="1.2"/><path d="${blob(arc(HT, 0.33, 0, 340, 14))}" fill="${VOID}"/>`;
  const chipA = 132, chipP = el(HT - 0.085, 0.44, chipA);
  const notch = (a0, w, d, sdn) => { const q = [el(HT + 0.004, 0.45, a0 - w), el(HT - d * 0.5, 0.452, a0 - w * 0.55 + jit(sdn, 1)), el(HT - d, 0.45, a0 - w * 0.1), el(HT - d * 0.8, 0.45, a0 + w * 0.5), el(HT - d * 0.25, 0.45, a0 + w * 0.8), el(HT + 0.004, 0.45, a0 + w)]; return `<path d="${lineD(q, true)}" fill="${C.clayD}" stroke="${INK}" stroke-width="1"/><path d="${lineD(q.slice(1, 5))}" stroke="${C.clayL}" stroke-width="${n(Math.max(0.8, 0.005 * k))}" fill="none" opacity="0.55" transform="translate(0,${n(0.008 * k)})"/>`; };
  s += notch(chipA, 12, 0.095, seed + 1) + notch(64, 5, 0.03, seed + 2) + notch(98, 3, 0.018, seed + 3) + notch(160, 4, 0.024, seed + 4);
  // the earth it stands in: a ring of packed floor, pebbles, a damp stain
  s = `<path d="${blob(ring(base.x + sd * 0.2 * k, base.y + 0.02 * k, 0.86 * k, seed + 70, 12, 0.08, 0.15))}" fill="${C.earthS}" opacity="0.6"/>` + s;
  s += `<path d="${blob(ring(base.x, base.y + 0.02 * k, 0.66 * k, seed + 60, 13, 0.06, 0.13).map((p) => (p.y < base.y ? xy(p.x, base.y - (base.y - p.y) * 0.5) : p)))}" fill="${C.earth2}" stroke="${INK}" stroke-width="1.1"/>`;
  for (let i = 0; i < 8; i++) { const px = base.x + jit(seed + i * 2.7, 0.66 * k), py = base.y + (0.03 + 0.07 * hash(seed + i * 1.9)) * k; s += `<path d="${blob(ring(px, py, (0.016 + 0.022 * hash(seed + i)) * k, seed + i, 6, 0.3, 0.7))}" fill="${i % 3 ? C.earthS : C.earth}" stroke="${INK}" stroke-width="0.7"/>`; }
  // --- the lid: a heavy clay disc with a knob. Pivot = its right edge; crack lifts the left edge, lid carries it off.
  const R = 0.47, th = 0.11, dome = 0.17, piv = el(HT, R, 0), rotD = ck * 4.2 + lid * 23 + (slam > 0 && slam < 1 ? Math.sin(slam * 9) * (1 - slam) * 0.35 : 0), off = [(-0.16 * lid) * k, (-0.48 * lid - 0.03 * ease(lid)) * k];
  const eL = eT, R_ = R * k, lp = (x, y) => { const [rx, ry] = rot2(x - R_, y, rotD); return xy(piv.x + off[0] + rx, piv.y + off[1] + ry); };   // lid local: x from the centre, y up negative
  const und = Array.from({ length: 21 }, (_, i) => { const an = i / 20 * Math.PI * 2; return lp(Math.cos(an) * R_, Math.sin(an) * R_ * eL); });
  const dm = [lp(-R_, 0), lp(-R_ * 1.01, -th * k * 0.5), lp(-R_ * 0.98, -th * k), lp(-R_ * 0.66, -(th + dome * 0.62) * k), lp(-R_ * 0.25, -(th + dome) * k), lp(-0.085 * k, -(th + dome + 0.015) * k), lp(-0.075 * k, -(th + dome + 0.07) * k), lp(-0.11 * k, -(th + dome + 0.115) * k), lp(-0.1 * k, -(th + dome + 0.16) * k), lp(0.03 * k, -(th + dome + 0.172) * k), lp(0.115 * k, -(th + dome + 0.15) * k), lp(0.105 * k, -(th + dome + 0.1) * k), lp(0.07 * k, -(th + dome + 0.065) * k), lp(0.09 * k, -(th + dome + 0.01) * k), lp(R_ * 0.3, -(th + dome * 0.96) * k), lp(R_ * 0.7, -(th + dome * 0.55) * k), lp(R_ * 0.99, -th * k), lp(R_ * 1.01, -th * k * 0.45), lp(R_, 0)];
  const lidFront = Array.from({ length: 11 }, (_, i) => { const an = i / 10 * Math.PI; return lp(Math.cos(an) * R_, Math.sin(an) * R_ * Math.abs(eL) * (eL > 0 ? 1 : -1)); });
  let lidS = "";
  if (lid > 0.2 || ck > 0.01) lidS += `<path d="${lineD(und, true)}" fill="${C.clayD}" stroke="${INK}" stroke-width="1.2"/>`;
  lidS += `<path d="${lineD([...dm, ...(eL > 0 ? lidFront.slice(1, -1) : [])], true)}" fill="${C.clay}" stroke="${INK}" stroke-width="${n(Math.max(1.4, 0.011 * k))}" stroke-linejoin="round"/>`;
  lidS += `<path d="${lineD([lp(sd * R_ * 0.99, -th * k), lp(sd * R_ * 0.7, -(th + dome * 0.55) * k), lp(sd * R_ * 0.3, -(th + dome * 0.96) * k), lp(sd * 0.1 * k, -(th + dome) * k), lp(sd * 0.2 * k, -(th + dome * 0.5) * k), lp(sd * R_ * 0.5, -th * k * 0.3), lp(sd * R_, 0), lp(sd * R_ * 1.01, -th * k * 0.45)], true)}" fill="${C.clayS}"/>`;
  lidS += stroke(lineD([lp(-R_ * 0.97, -th * k), lp(-R_ * 0.5, -th * k * 0.86 - 2), lp(0, -th * k * 0.82 - 3), lp(R_ * 0.5, -th * k * 0.86 - 2), lp(R_ * 0.97, -th * k)]), C.clayD, Math.max(1, 0.006 * k), `opacity="0.7"`);
  lidS += `<path d="${lineD([lp(-0.1 * k, -(th + dome + 0.16) * k), lp(0.03 * k, -(th + dome + 0.172) * k), lp(0.115 * k, -(th + dome + 0.15) * k), lp(0.02 * k, -(th + dome + 0.128) * k)], true)}" fill="${C.clayL}"/>`;
  lidS += `<path d="${lineD([lp(-R_ * 0.78, -(th + dome * 0.42) * k), lp(-R_ * 0.5, -(th + dome * 0.74) * k), lp(-R_ * 0.3, -(th + dome * 0.86) * k)])}" stroke="${C.clayL}" stroke-width="${n(Math.max(1.4, 0.014 * k))}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  lidS += `<path d="${lineD([lp(R_ * 0.52, -(th + dome * 0.9) * k), lp(R_ * 0.6, -(th + dome * 0.5) * k), lp(R_ * 0.56, -th * k * 0.4)])} M${pt(lp(-R_ * 0.2, -th * k * 0.9))} L${pt(lp(-R_ * 0.26, -(th + dome * 0.5) * k))}" stroke="${C.clayD}" stroke-width="1.1" fill="none"/>`;   // hairline cracks in the lid
  lidS += `<path d="${lineD([lp(-R_ * 0.62, 0.004 * k), lp(-R_ * 0.56, -th * k * 0.6), lp(-R_ * 0.47, -th * k * 0.3), lp(-R_ * 0.42, 0.004 * k)], true)}" fill="${C.clayD}"/>`;   // a chip out of the lid's edge
  if (!(ck > 0.01 || lid > 0.01)) lidS += stroke(lineD(lidFront), INK, Math.max(1.6, 0.011 * k));   // closed: one dark contact line, nothing open
  const knob = lp(0.01 * k, -(th + dome + 0.1) * k);
  // --- cord and wax seal
  const cordW = Math.max(2.2, 0.024 * k), LgL = lugMid(-1), LgR = lugMid(1);
  const cordPath = (a, col) => { let o = stroke(smooth(a), INK, cordW + 1.6) + stroke(smooth(a), col, cordW); for (let i = 0; i < a.length - 1; i++) for (let j = 0; j < 3; j++) { const u = (j + 0.5) / 3, x = lerp(a[i].x, a[i + 1].x, u), y = lerp(a[i].y, a[i + 1].y, u), dx = a[i + 1].x - a[i].x, dy = a[i + 1].y - a[i].y, l = Math.hypot(dx, dy) || 1; o += `<path d="M${n(x - dy / l * cordW * 0.4 - dx / l * cordW * 0.3)},${n(y + dx / l * cordW * 0.4 - dy / l * cordW * 0.3)} L${n(x + dy / l * cordW * 0.4 + dx / l * cordW * 0.3)},${n(y - dx / l * cordW * 0.4 + dy / l * cordW * 0.3)}" stroke="${C.cordS}" stroke-width="${n(cordW * 0.28)}" stroke-linecap="round"/>`; } return o; };
  let cordS = "", sealS = "";
  const waxAt = el(HT + 0.005, 0.455, 100), waxR = 0.085 * k;
  const waxBlob = (cx, cy, half) => { const a = ring(cx, cy, waxR, seed + 80, 11, 0.16, 0.86).filter((p) => !half || (half < 0 ? p.y >= cy - 1 : p.y <= cy + 1)); if (half) a.push(...(half < 0 ? [xy(cx - waxR * 0.5, cy - waxR * 0.12), xy(cx - waxR * 0.1, cy + waxR * 0.1), xy(cx + waxR * 0.4, cy - waxR * 0.16)] : [xy(cx + waxR * 0.4, cy - waxR * 0.16), xy(cx - waxR * 0.1, cy + waxR * 0.1), xy(cx - waxR * 0.5, cy - waxR * 0.12)]).sort((p, q) => (half < 0 ? p.x - q.x : q.x - p.x))); return a; };
  const stamp = (cx, cy) => `<path d="${blob(ring(cx, cy, waxR * 0.6, seed + 84, 9, 0.06, 0.86))}" fill="none" stroke="${C.waxD}" stroke-width="${n(Math.max(1, waxR * 0.09))}"/><path d="M${n(cx + waxR * 0.12)},${n(cy - waxR * 0.4)} l${n(-waxR * 0.26)},${n(waxR * 0.36)} l${n(waxR * 0.24)},${n(-waxR * 0.02)} l${n(-waxR * 0.2)},${n(waxR * 0.42)}" fill="none" stroke="${C.waxD}" stroke-width="${n(Math.max(1.1, waxR * 0.12))}" stroke-linejoin="miter"/>`;   // Zeus' mark pressed in: a small bolt
  if (!broken) {
    cordS += cordPath([LgL, el(HT - 0.02, 0.47, 168), lp(-R_ * 0.72, -(th + dome * 0.6) * k), lp(-0.1 * k, -(th + dome + 0.03) * k)], C.cord) + cordPath([lp(0.1 * k, -(th + dome + 0.03) * k), lp(R_ * 0.72, -(th + dome * 0.6) * k), el(HT - 0.02, 0.47, 12), LgR], C.cord);
    cordS += cordPath([lp(-0.105 * k, -(th + dome + 0.035) * k), lp(0, -(th + dome + 0.06) * k), lp(0.105 * k, -(th + dome + 0.035) * k)], C.cord) + cordPath([lp(-0.04 * k, -(th + dome + 0.04) * k), xy(waxAt.x - 0.02 * k, waxAt.y - 0.09 * k), xy(waxAt.x, waxAt.y - 0.02 * k)], C.cord);
    sealS += `<path d="${blob(waxBlob(waxAt.x, waxAt.y - 0.03 * k))}" fill="${C.wax}" stroke="${INK}" stroke-width="1.3"/><path d="M${n(waxAt.x - waxR * 0.5)},${n(waxAt.y + waxR * 0.6)} q${n(waxR * 0.1)},${n(waxR * 0.9)} ${n(waxR * 0.26)},${n(waxR * 0.1)} M${n(waxAt.x + waxR * 0.35)},${n(waxAt.y + waxR * 0.6)} q0,${n(waxR * 0.5)} ${n(waxR * 0.14)},0" fill="${C.wax}" stroke="${INK}" stroke-width="1"/>` + stamp(waxAt.x, waxAt.y - 0.03 * k) + `<path d="M${n(waxAt.x - waxR * 0.62)},${n(waxAt.y - waxR * 0.72)} q${n(waxR * 0.3)},${n(-waxR * 0.3)} ${n(waxR * 0.7)},${n(-waxR * 0.2)}" stroke="${C.waxL}" stroke-width="${n(Math.max(1, waxR * 0.1))}" fill="none" stroke-linecap="round"/>`;
  } else {
    // the cord hangs from the lugs, frayed; half the seal stays on the rim, half on the lid
    for (const [Lg, sg, len] of [[LgL, -1, 0.5], [LgR, 1, 0.36]]) { const sway = Math.sin(t * 1.1 + sg) * 0.01 * k; cordS += cordPath([Lg, xy(Lg.x + sg * 0.03 * k, Lg.y + len * 0.5 * k), xy(Lg.x + sg * 0.01 * k + sway, Lg.y + len * k)], C.cord); for (let j = -1; j <= 1; j++) cordS += `<path d="M${n(Lg.x + sg * 0.01 * k + sway)},${n(Lg.y + len * k)} l${n(j * 0.022 * k)},${n(0.05 * k)}" stroke="${C.cord}" stroke-width="${n(cordW * 0.4)}" stroke-linecap="round"/>`; }
    sealS += `<path d="${lineD(waxBlob(waxAt.x, waxAt.y - 0.03 * k, -1), true)}" fill="${C.wax}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    const w2 = lp(-R_ * 0.17, 0.0), dx = w2.x - waxAt.x, dy = w2.y - (waxAt.y - 0.03 * k) - (ck > 0 ? 0 : 0);
    lidS += `<g transform="translate(${n(dx)},${n(dy - ck * 0.05 * k)}) rotate(${n(rotD)} ${n(waxAt.x)} ${n(waxAt.y)})"><path d="${lineD(waxBlob(waxAt.x, waxAt.y - 0.03 * k, 1), true)}" fill="${C.wax}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M${n(waxAt.x - waxR * 0.5)},${n(waxAt.y - waxR * 0.7)} q${n(waxR * 0.3)},${n(-waxR * 0.3)} ${n(waxR * 0.7)},${n(-waxR * 0.2)}" stroke="${C.waxL}" stroke-width="${n(Math.max(1, waxR * 0.1))}" fill="none" stroke-linecap="round"/></g>`;
  }
  // --- the gap: what the open jar shows. Black inside; the cold light lives in the overlay.
  let gap = "", overlay = "";
  const gapL = lp(-R_, 0), rimL = el(HT, R, 180), open = ck > 0.01 || lid > 0.01;
  const wedge = [rimL, ...arc(HT, R, 180, 0, 10).slice(1, -1).map((p) => xy(p.x, Math.min(p.y, top.y + Math.abs(eT) * R_ * 0.5))), el(HT, R, 0), lp(R_, 0), ...und.slice(0, 11).map((p) => p).reverse().slice(0, 0), lp(0, 0), gapL];
  if (open) gap = `<path d="${lineD(lid > 0.3 ? arc(HT, 0.4, 0, 360, 18) : wedge, true)}" fill="${VOID}"/>`;
  if (st.noLid) { lidS = ""; cordS = ""; }
  s += gap + sealS + lidS + cordS;
  if (open && gl > 0) {
    const g0 = xy(lerp(rimL.x, gapL.x, 0.5), lerp(rimL.y, gapL.y, 0.5)), gh = Math.hypot(gapL.x - rimL.x, gapL.y - rimL.y), cold = "#9fc2ff", hot = "#f2f7ff", fk = 0.9 + 0.1 * hash(Math.floor(t * 8) * 3.7 + 2);
    if (lid < 0.3) {
      // a thin blade of cold light in the wedge, and hand-cut spill on the lip and the lid's underside
      const blade = [xy(rimL.x - 2, rimL.y - 1), xy(lerp(rimL.x, piv.x, 0.45), lerp(rimL.y, piv.y, 0.45) - 1), xy(lerp(rimL.x, piv.x, 0.8), piv.y - 1), xy(lerp(gapL.x, piv.x, 0.45), lerp(gapL.y, piv.y, 0.45) + 1), xy(gapL.x - 2, gapL.y + 1)];
      overlay += lightBlobs({ x: g0.x + 0.1 * k, y: g0.y, s: k }, [0.62, 0.34, 0.16], cold, [0.1 * gl * ck * fk, 0.16 * gl * ck * fk, 0.26 * gl * ck], seed + 90, 0.6);
      overlay += `<path d="${lineD(blade, true)}" fill="${cold}" opacity="${n(0.55 * gl)}"/><path d="${lineD(blade.map((p, i) => (i === 0 || i === 4 ? p : xy(lerp(p.x, g0.x, 0.28), lerp(p.y, g0.y, 0.28)))), true)}" fill="${hot}" opacity="${n(0.55 * gl)}"/>`;
      overlay += `<path d="${lineD([rimL, ...arc(HT, R * 0.99, 180, 100, 6), xy(lerp(rimL.x, piv.x, 0.4), piv.y + 0.03 * k), xy(rimL.x + 0.02 * k, rimL.y + 0.05 * k)], true)}" fill="${cold}" opacity="${n(0.75 * gl * ck)}" style="mix-blend-mode:screen"/>`;
      overlay += `<path d="${lineD([gapL, lp(-R_ * 1.01, -th * k * 0.6), lp(-R_ * 0.6, -th * k * 0.3), lp(-R_ * 0.1, 0)], true)}" fill="${cold}" opacity="${n(0.6 * gl * ck)}" style="mix-blend-mode:screen"/>`;
      for (let i = 0; i < 4; i++) { const an = (168 + i * 9 + jit(seed + i * 5, 3)) * Math.PI / 180, len = (0.5 + 0.5 * hash(seed + i * 3)) * k * (0.9 + 0.1 * fk), w = (0.02 + 0.03 * hash(seed + i)) * k; overlay += `<path d="M${n(g0.x)},${n(g0.y - gh * 0.3)} L${n(g0.x + Math.cos(an) * len)},${n(g0.y - Math.sin(an) * len * 0.5 - w)} L${n(g0.x + Math.cos(an) * len * 0.96)},${n(g0.y - Math.sin(an) * len * 0.5 + w)} L${n(g0.x)},${n(g0.y + gh * 0.3)} Z" fill="${cold}" opacity="${n((0.1 + 0.08 * hash(seed + i * 7)) * gl * ck)}" style="mix-blend-mode:screen"/>`; }
    } else {
      overlay += lightBlobs({ x: top.x, y: top.y, s: k }, [0.9, 0.5, 0.3], cold, [0.08 * gl * fk, 0.12 * gl * fk, 0.2 * gl], seed + 91, 0.5) + `<path d="${lineD([...arc(HT, 0.4, 150, 390, 12)], true)}" fill="${cold}" opacity="${n(0.3 * gl)}" style="mix-blend-mode:screen"/>`;
    }
  }
  // the lid lands: dust jumps off the rim
  if (slam > 0.01 && slam < 1) for (let i = 0; i < 12; i++) { const an = 180 - i / 11 * 180 + jit(seed + i, 6), u = ease(slam, "out"), p0 = el(HT + 0.02 + 0.1 * u * hash(seed + i * 2), R * (1.02 + (0.25 + 0.4 * hash(seed + i * 3)) * u), an), r = (0.03 + 0.05 * hash(seed + i * 5)) * k * (0.5 + u); s += `<path d="${blob(ring(p0.x, p0.y, r, seed + i * 4, 7, 0.3, 0.7))}" fill="${i % 2 ? C.clayL : C.earth2}" opacity="${n(0.85 * (1 - slam))}"/>`; }
  // Hope: one tiny flame under the rim, in the notch of the big chip
  if (hope > 0.01) overlay += hopeLight(xy(chipP.x, chipP.y + 0.012 * k), k, t, hope) + `<path d="${lineD([el(HT - 0.08, 0.45, chipA - 26), el(HT - 0.085, 0.45, chipA + 22), el(HT - 0.2, profR(HT - 0.2), chipA + 16), el(HT - 0.2, profR(HT - 0.2), chipA - 18)], true)}" fill="${HOPE.glow}" opacity="${n(0.22 * hope)}" style="mix-blend-mode:screen"/>`;
  const mouth = lid > 0.3 ? { x: top.x, y: top.y, s: k } : { x: lerp(rimL.x, gapL.x, 0.5) + 0.04 * k, y: lerp(rimL.y, gapL.y, 0.5), s: k };
  return { svg: s, overlay, mouth, knob: { ...knob, s: k }, chip: { ...chipP, s: k }, top: { x: top.x, y: top.y, s: k }, p: base, Z: Z0 };
}
// the flame of Hope: the same three colours as the candle in Grandma's jar, a seeded flicker (12 steps a second)
export function hopeLight(at, s, t, amt = 1) {
  const fk = amt * (1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1)) * (0.86 + 0.14 * hash(Math.floor(t * 12) * 5.3 + 0.7)), h = 0.055 * s * fk, w = 0.019 * s * fk, lean = Math.sin(t * 7) * w * 0.4;
  let o = lightBlobs({ x: at.x, y: at.y - h * 0.4, s }, [0.3, 0.16, 0.07], HOPE.glow, [0.1 * fk, 0.18 * fk, 0.4 * fk], 17 + Math.floor(t * 6) % 3);
  o += `<path d="M${n(at.x + lean)},${n(at.y - h)} Q${n(at.x + w)},${n(at.y - h * 0.3)} ${n(at.x)},${n(at.y)} Q${n(at.x - w)},${n(at.y - h * 0.3)} ${n(at.x + lean)},${n(at.y - h)} Z" fill="${HOPE.flame}" stroke="${HOPE.edge}" stroke-width="${n(Math.max(0.6, 0.004 * s))}"/><path d="M${n(at.x + lean * 0.5)},${n(at.y - h * 0.6)} Q${n(at.x + w * 0.45)},${n(at.y - h * 0.2)} ${n(at.x)},${n(at.y - h * 0.06)} Q${n(at.x - w * 0.45)},${n(at.y - h * 0.2)} ${n(at.x + lean * 0.5)},${n(at.y - h * 0.6)} Z" fill="${HOPE.core}"/>`;
  return o;
}

// ================================================================ (a) Epimetheus' house at night
export const ROOM = { x0: -2.6, x1: 2.6, z1: 6.4, h: 3.0, door: { x0: -2.08, x1: -1.02, h: 2.08 }, jar: { X: 1.3, Z: 5.4 }, lamp: { X: 0.0, Y: 2.12, Z: 6.34 }, stool: { X: -0.45, Z: 5.6, h: 0.45 } };
export function room(c, t, st = {}) {
  const R = ROOM, lampA = clamp(st.lamp ?? 1), moon = clamp(st.moon ?? 1), zN = c.z + 0.3, q = (X_, Y_, Z_) => P(c, X_, Y_, Z_), D = R.door;
  let s = `<rect width="${W}" height="${H}" fill="${M.woodS}"/>`;
  // ceiling: reed matting over round beams
  s += poly([q(R.x0, R.h, R.z1), q(R.x1, R.h, R.z1), q(R.x1, R.h, zN), q(R.x0, R.h, zN)], X.reed);
  for (let i = 0; i < 26; i++) { const z = lerp(R.z1, zN + 0.2, (i / 26) ** 1.6), a = q(R.x0, R.h, z), b = q(R.x1, R.h, z); s += `<path d="M${pt(a)} L${n(lerp(a.x, b.x, 0.5))},${n(a.y + jit(i + 0.3, 3))} L${pt(b)}" stroke="${i % 3 ? M.woodS : M.wood}" stroke-width="${n(Math.max(1, 0.012 * a.s))}" fill="none" opacity="0.75"/>`; }
  for (const [bi, bx] of [-2.1, -1.0, 0.05, 1.12, 2.15].entries()) {
    const r = 0.1 + 0.02 * hash(bi + 0.6), y0 = R.h - 0.24, side = bx < c.x ? 1 : -1;
    s += poly([q(bx + side * r, R.h, R.z1), q(bx + side * r, y0, R.z1), q(bx + side * r, y0, zN), q(bx + side * r, R.h, zN)], side > 0 ? M.woodL : M.woodS, `stroke="${INK}" stroke-width="1"`);
    s += poly(wpoly(c, [[bx - r, y0, R.z1], [bx + r, y0, R.z1], [bx + r, y0, zN], [bx - r, y0, zN]], 30 + bi, 0.012, 0.7), M.wood, `stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"`);
    for (let j = 0; j < 5; j++) { const z = lerp(R.z1 - 0.3, zN + 0.6, hash(bi * 7 + j + 0.2)), a = q(bx + jit(bi * 5 + j, r * 0.6), y0, z), b = q(bx + jit(bi * 5 + j + 1, r * 0.6), y0, z - 0.5 - hash(bi + j)); s += `<path d="M${pt(a)} L${pt(b)}" stroke="${M.woodS}" stroke-width="${n(Math.max(1, 0.012 * a.s))}" stroke-linecap="round"/>`; if (j === 1) s += `<path d="${blob(ring(a.x, a.y, 0.03 * a.s, bi + j, 6, 0.3, 0.5))}" fill="${M.woodS}"/>`; }
  }
  // side walls (in shade), back wall (whitewash over mud brick)
  s += poly([q(R.x0, 0, R.z1), q(R.x0, R.h, R.z1), q(R.x0, R.h, zN), q(R.x0, 0, zN)], M.wallS) + poly([q(R.x1, 0, R.z1), q(R.x1, R.h, R.z1), q(R.x1, R.h, zN), q(R.x1, 0, zN)], M.wallS);
  s += dabs(c, R.x0 + 0.1, R.x1 - 0.1, 0.2, R.h - 0.3, R.z1 - 0.01, 0, 1, [M.wall]);
  for (const sx of [R.x0, R.x1]) for (let i = 0; i < 9; i++) { const z = lerp(R.z1 - 0.3, zN + 0.5, hash(i * 3.3 + sx)), y = 0.3 + hash(i * 2.1 + sx + 1) * 2.3, a = q(sx, y, z), b = q(sx, y + jit(i + sx, 0.05), z - 0.3 - 0.5 * hash(i + sx)); s += `<path d="M${pt(a)} L${pt(b)}" stroke="${i % 2 ? M.wallD : M.wall}" stroke-width="${n(Math.max(1.5, 0.03 * a.s))}" stroke-linecap="round" opacity="0.4"/>`; }
  s += poly(wpoly(c, [[R.x0, 0, R.z1], [R.x1, 0, R.z1], [R.x1, R.h, R.z1], [R.x0, R.h, R.z1]], 21, 0.014, 0.6), M.wall);
  s += dabs(c, R.x0 + 0.2, R.x1 - 0.2, 0.9, R.h - 0.35, R.z1, 60, 400, [M.wallL, M.wallS, M.wallL], (X_, Y_) => X_ > D.x0 - 0.15 && X_ < D.x1 + 0.15 && Y_ < D.h + 0.2);
  // the light of the lamp ON the wall: flat hand-cut shapes, not a glow
  const lp = q(R.lamp.X + 0.19, R.lamp.Y - 0.22, R.z1);
  if (lampA > 0.02 && TH < 0.9) { const a = lampA * (1 - Math.max(0, TH) * 0.8), fk = 0.95 + 0.05 * hash(Math.floor(t * 8) + 0.4); s += `<path d="${blob(ring(lp.x, lp.y + 0.1 * lp.s, 1.75 * lp.s * fk, 51, 15, 0.07, 0.86))}" fill="${mix(M.wall, "#ffb548", 0.45)}" opacity="${n(a * 0.75)}"/><path d="${blob(ring(lp.x, lp.y + 0.05 * lp.s, 1.0 * lp.s * fk, 53, 13, 0.08, 0.9))}" fill="${mix(M.wallL, "#ffd27a", 0.6)}" opacity="${n(a * 0.85)}"/><path d="${blob(ring(lp.x, lp.y, 0.45 * lp.s * fk, 55, 11, 0.09, 0.95))}" fill="#fff0b8" opacity="${n(a * 0.8)}"/>`; }
  // a painted dado: a dark band with a hand-pulled blue line
  s += poly(wpoly(c, [[R.x0, 0, R.z1], [R.x1, 0, R.z1], [R.x1, 0.82, R.z1], [R.x0, 0.8, R.z1]], 23, 0.012, 0.35), M.wallS) + poly(wpoly(c, [[R.x0, 0.82, R.z1], [R.x1, 0.84, R.z1], [R.x1, 0.9, R.z1], [R.x0, 0.89, R.z1]], 25, 0.01, 0.3), M.blue);
  s += dabs(c, R.x0 + 0.2, R.x1 - 0.2, 0.08, 0.74, R.z1, 26, 500, [M.wallD, M.wall]);
  // plaster fallen off, the mud bricks show; cracks; a niche with two small pots
  for (const [bx, by, bw, bh, sd] of [[2.0, 2.3, 0.62, 0.42, 1], [-0.5, 0.42, 0.5, 0.3, 2], [0.8, 2.62, 0.4, 0.2, 3]]) {
    const a = ring(0, 0, 1, sd + 30, 10, 0.2).map((p) => q(bx + p.x * bw / 2, by + p.y * bh / 2, R.z1));
    const id = `pr${UID++}`; s += `<clipPath id="${id}"><path d="${lineD(a, true)}"/></clipPath><path d="${lineD(a, true)}" fill="${M.wallD}" stroke="${INK}" stroke-width="1"/><g clip-path="url(#${id})">`;
    for (let r = 0; r < 4; r++) for (let j = -1; j < 4; j++) { const x0 = bx - bw / 2 + (j + (r % 2) * 0.5) * 0.3 + jit(sd + r * 5 + j, 0.01), y0 = by - bh / 2 + r * 0.13; s += poly([q(x0 + 0.012, y0 + 0.012, R.z1), q(x0 + 0.288, y0 + 0.014 + jit(sd + r + j, 0.008), R.z1), q(x0 + 0.286, y0 + 0.118, R.z1), q(x0 + 0.014, y0 + 0.116, R.z1)], (r + j) % 3 ? M.stone : mix(M.stone, M.roof, 0.4)); }
    s += `</g>`;
  }
  s += crack(c, 1.1, 1.4, R.z1, 0.9, 5) + crack(c, -0.5, 2.9, R.z1, -0.7, 9) + crack(c, 2.3, 1.5, R.z1, 0.6, 12) + crack(c, -2.4, 2.7, R.z1, -0.6, 14);
  { const nx = -0.86, ny = 1.25, nw = 0.62, nh = 0.46; s += poly(wpoly(c, [[nx, ny, R.z1], [nx + nw, ny, R.z1], [nx + nw, ny + nh, R.z1], [nx, ny + nh, R.z1]], 41, 0.01, 0.2), M.wallD, `stroke="${INK}" stroke-width="1.1"`) + poly([q(nx, ny, R.z1), q(nx + nw, ny, R.z1), q(nx + nw - 0.05, ny + 0.06, R.z1), q(nx + 0.04, ny + 0.06, R.z1)], M.wallL);
    for (const [px, pr, ph, col] of [[nx + 0.18, 0.075, 0.2, X.clay], [nx + 0.43, 0.06, 0.13, M.roof]]) { const b = q(px, ny + 0.06, R.z1), k = b.s; s += `<path d="M${n(b.x - pr * 0.6 * k)},${n(b.y)} Q${n(b.x - pr * 1.5 * k)},${n(b.y - ph * 0.55 * k)} ${n(b.x - pr * 0.5 * k)},${n(b.y - ph * 0.86 * k)} L${n(b.x - pr * 0.7 * k)},${n(b.y - ph * k)} L${n(b.x + pr * 0.7 * k)},${n(b.y - ph * k)} L${n(b.x + pr * 0.5 * k)},${n(b.y - ph * 0.86 * k)} Q${n(b.x + pr * 1.5 * k)},${n(b.y - ph * 0.5 * k)} ${n(b.x + pr * 0.6 * k)},${n(b.y)} Z" fill="${col}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(b.x - pr * 0.9 * k)},${n(b.y - ph * 0.5 * k)} q${n(pr * 0.9 * k)},${n(0.02 * k)} ${n(pr * 1.8 * k)},0" stroke="${INK}" stroke-width="0.9" fill="none" opacity="0.6"/>`; } }
  // the doorway to the courtyard: night sky, moon, the yard wall, an olive
  const dq = [q(D.x0, 0, R.z1), q(D.x1, 0, R.z1), q(D.x1, D.h, R.z1), q(D.x0, D.h + 0.02, R.z1)], did = `pd${UID++}`, hz = P(c, 0, 0, 400).y;
  s += `<clipPath id="${did}"><path d="${lineD(dq, true)}"/></clipPath><g clip-path="url(#${did})"><rect x="${n(dq[0].x - 4)}" y="${n(dq[2].y - 4)}" width="${n(dq[1].x - dq[0].x + 8)}" height="${n(dq[0].y - dq[2].y + 8)}" fill="${M.sky2}"/>`;
  s += poly([xy(dq[0].x - 4, dq[2].y - 4), xy(dq[1].x + 4, dq[2].y - 4), xy(dq[1].x + 4, lerp(dq[2].y, hz, 0.42)), xy(dq[0].x - 4, lerp(dq[2].y, hz, 0.5))], M.sky1) + poly([xy(dq[0].x - 4, lerp(dq[2].y, hz, 0.8)), xy(dq[1].x + 4, lerp(dq[2].y, hz, 0.74)), xy(dq[1].x + 4, hz + 4), xy(dq[0].x - 4, hz + 4)], M.sky3);
  for (let i = 0; i < 9; i++) s += `<circle cx="${n(lerp(dq[0].x, dq[1].x, hash(i + 0.7)))}" cy="${n(lerp(dq[2].y, hz, hash(i + 5.7) * 0.7))}" r="${n(1 + hash(i + 9) * 1.6)}" fill="${M.moon}" opacity="${n(0.5 + 0.4 * Math.sin(t * (1 + hash(i)) + i))}"/>`;
  const mp = q((D.x0 + D.x1) / 2 + 0.12 + (c.x - 0) * 0.3, 1.62, R.z1), mr = 0.19 * mp.s;
  s += lightBlobs({ x: mp.x, y: mp.y, s: 1 }, [mr * 2.6, mr * 1.6], M.rim, [0.14 * moon, 0.18 * moon], 71) + `<path d="${blob(ring(mp.x, mp.y, mr, 73, 14, 0.015))}" fill="${M.moon}"/><path d="${blob(ring(mp.x + mr * 0.3, mp.y + mr * 0.12, mr * 0.7, 75, 9, 0.1))}" fill="${M.moonS}" opacity="0.5"/>`;
  s += GR.olive(c, t, { X: D.x0 - 0.9, Z: 13, Y: 0, size: 3.2, seed: 5, detail: 0.5 });
  s += poly(wpoly(c, [[-4.5, 0, 9.4], [1, 0, 9.4], [1, 0.74, 9.4], [-4.5, 0.7, 9.4]], 61, 0.02, 0.5), M.stone, `stroke="${INK}" stroke-width="1"`) + poly([q(-4.5, 0.7, 9.4), q(1, 0.74, 9.4), q(1, 0.84, 9.4), q(-4.5, 0.8, 9.4)], M.stoneL);
  s += poly([q(-5, 0, 9.4), q(2, 0, 9.4), q(2, 0, R.z1), q(-5, 0, R.z1)], M.pave) + dabs(c, D.x0, D.x1, 0, 0, 0, 0, 1, [M.pave]);
  for (let i = 0; i < 7; i++) { const a = q(lerp(D.x0 - 0.3, D.x1 + 0.3, hash(i + 2.2)), 0, lerp(R.z1 + 0.2, 9.2, hash(i + 4.4))); s += `<path d="M${pt(a)} l${n(0.3 * a.s)},${n(jit(i, 2))}" stroke="${M.pave2}" stroke-width="${n(0.03 * a.s)}" stroke-linecap="round" opacity="0.7"/>`; }
  s += `</g>`;
  // posts, lintel, threshold stone, the door leaf swung in against the left wall
  s += poly(wpoly(c, [[D.x0 - 0.13, 0, R.z1 - 0.02], [D.x0, 0, R.z1 - 0.02], [D.x0, D.h, R.z1 - 0.02], [D.x0 - 0.13, D.h, R.z1 - 0.02]], 44, 0.01, 0.4), M.wood, `stroke="${INK}" stroke-width="1.1"`) + poly(wpoly(c, [[D.x1, 0, R.z1 - 0.02], [D.x1 + 0.13, 0, R.z1 - 0.02], [D.x1 + 0.12, D.h, R.z1 - 0.02], [D.x1, D.h, R.z1 - 0.02]], 46, 0.01, 0.4), M.woodL, `stroke="${INK}" stroke-width="1.1"`);
  s += poly(wpoly(c, [[D.x0 - 0.24, D.h, R.z1 - 0.03], [D.x1 + 0.26, D.h + 0.02, R.z1 - 0.03], [D.x1 + 0.24, D.h + 0.2, R.z1 - 0.03], [D.x0 - 0.22, D.h + 0.21, R.z1 - 0.03]], 48, 0.012, 0.3), M.wood, `stroke="${INK}" stroke-width="1.1"`);
  for (let i = 0; i < 6; i++) { const a = q(D.x0 - 0.15 + hash(i + 0.9) * (D.x1 - D.x0 + 0.3), D.h + 0.05 + hash(i + 3.9) * 0.1, R.z1 - 0.03); s += `<path d="M${pt(a)} l${n(0.22 * a.s)},${n(jit(i, 1.5))}" stroke="${M.woodS}" stroke-width="1.3" stroke-linecap="round"/>`; }
  const leaf = [q(D.x0 - 0.02, 0, R.z1 - 0.04), q(D.x0 - 0.42, 0, R.z1 - 0.92), q(D.x0 - 0.42, D.h - 0.04, R.z1 - 0.92), q(D.x0 - 0.02, D.h - 0.02, R.z1 - 0.04)];
  s += poly(leaf, M.blueS, `stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"`); for (let j = 1; j < 4; j++) { const u = j / 4; s += `<path d="M${n(lerp(leaf[0].x, leaf[1].x, u))},${n(lerp(leaf[0].y, leaf[1].y, u))} L${n(lerp(leaf[3].x, leaf[2].x, u))},${n(lerp(leaf[3].y, leaf[2].y, u))}" stroke="${M.blue}" stroke-width="1.6"/>`; }
  // the floor: packed earth, a woven mat, the cold moon patch from the doorway
  s += poly([q(R.x0, 0, R.z1), q(R.x1, 0, R.z1), q(R.x1, 0, zN), q(R.x0, 0, zN)], X.earth);
  for (let i = 0; i < 70; i++) { const z = lerp(R.z1 - 0.1, Math.max(zN + 0.3, 1.2), hash(i + 0.21) ** 1.3), a = q(lerp(R.x0, R.x1, hash(i + 7.3)), 0, z), w = (0.12 + 0.4 * hash(i + 3.1)) * a.s; s += `<path d="M${pt(a)} l${n(w)},${n(jit(i, 2))}" stroke="${i % 3 ? X.earth2 : X.earthS}" stroke-width="${n((0.012 + 0.03 * hash(i + 9)) * a.s)}" stroke-linecap="round" opacity="${n(0.35 + 0.4 * hash(i + 11))}"/>`; }
  s += poly(wpoly(c, [[D.x0 - 0.2, 0.001, R.z1], [D.x1 + 0.2, 0.001, R.z1], [D.x1 + 0.24, 0.001, R.z1 - 0.26], [D.x0 - 0.22, 0.001, R.z1 - 0.28]], 49, 0.012, 0.3), M.stoneL, `stroke="${INK}" stroke-width="1"`);
  if (moon > 0.02) s += `<path d="${lineD(wpoly(c, [[D.x0 + 0.04, 0.002, R.z1 - 0.28], [D.x1 - 0.02, 0.002, R.z1 - 0.28], [D.x1 + 1.5, 0.002, R.z1 - 2.7], [D.x0 + 0.95, 0.002, R.z1 - 3.0]], 52, 0.02, 0.5), true)}" fill="${M.rim}" opacity="${n(0.3 * moon)}" style="mix-blend-mode:screen"/>`;
  { const mx0 = -0.9, mx1 = 0.9, mz0 = 4.0, mz1 = 5.0; s += poly(wpoly(c, [[mx0, 0.003, mz1], [mx1, 0.003, mz1 + 0.03], [mx1 + 0.04, 0.003, mz0], [mx0 - 0.03, 0.003, mz0 + 0.02]], 54, 0.012, 0.25), X.mat, `stroke="${INK}" stroke-width="1"`);
    for (let j = 0; j < 7; j++) { const z = lerp(mz0 + 0.08, mz1 - 0.06, j / 6), a = q(mx0 + 0.03, 0.004, z + jit(j + 0.4, 0.012)), b = q(mx1 - 0.02, 0.004, z + jit(j + 1.4, 0.012)); s += `<path d="M${pt(a)} L${pt(b)}" stroke="${j % 3 === 1 ? M.blue : X.matS}" stroke-width="${n((j % 3 === 1 ? 0.035 : 0.018) * a.s)}" opacity="0.9"/>`; }
    for (let j = 0; j < 12; j++) for (const [zz, dz] of [[mz0, -0.07], [mz1, 0.06]]) { const a = q(lerp(mx0, mx1, (j + 0.5) / 12), 0.003, zz), b = q(lerp(mx0, mx1, (j + 0.5) / 12) + jit(j + zz, 0.03), 0.003, zz + dz); s += `<path d="M${pt(a)} L${pt(b)}" stroke="${X.mat}" stroke-width="1.6" stroke-linecap="round"/>`; } }
  // the lamp on its peg (legend-greece's hand lamp), a garlic braid on a beam
  const pegP = q(R.lamp.X, R.lamp.Y, R.z1), lampO = GR.oilLamp(c, { X: R.lamp.X, Y: R.lamp.Y, Z: R.lamp.Z, flame: lampA, pool: false }, t);
  s += `<path d="M${n(pegP.x - 0.01 * pegP.s)},${n(pegP.y - 0.03 * pegP.s)} l${n(0.02 * pegP.s)},${n(0.05 * pegP.s)}" stroke="${INK}" stroke-width="${n(0.04 * pegP.s)}" stroke-linecap="round"/><path d="M${n(pegP.x - 0.01 * pegP.s)},${n(pegP.y - 0.03 * pegP.s)} l${n(0.02 * pegP.s)},${n(0.05 * pegP.s)}" stroke="${M.woodL}" stroke-width="${n(0.025 * pegP.s)}" stroke-linecap="round"/>` + lampO.svg;
  { const g = q(2.15, R.h - 0.26, R.z1 - 0.5), k = g.s; s += `<path d="M${pt(g)} l${n(0.01 * k)},${n(0.6 * k)}" stroke="${X.cord}" stroke-width="${n(0.02 * k)}"/>`; for (let i = 0; i < 8; i++) { const gx = g.x + (i % 2 ? 1 : -1) * 0.035 * k + jit(i + 0.5, 0.01 * k), gy = g.y + (0.14 + i * 0.06) * k; s += `<path d="${blob(ring(gx, gy, 0.042 * k, i + 3, 7, 0.14))}" fill="${i % 3 ? M.wallL : M.thymeFl}" stroke="${INK}" stroke-width="1"/><path d="M${n(gx)},${n(gy - 0.04 * k)} l${n(jit(i, 0.01 * k))},${n(-0.03 * k)}" stroke="${INK}" stroke-width="0.9"/>`; } }
  // --- things on the floor: a stool with a folded cloth, an amphora in the left corner, the pithos
  const items = [];
  if (st.stool !== false) { const sx = st.stool?.X ?? R.stool.X, sz = st.stool?.Z ?? R.stool.Z, b = q(sx, 0, sz), k = b.s; let o = `<ellipse cx="${n(b.x)}" cy="${n(b.y)}" rx="${n(0.34 * k)}" ry="${n(0.06 * k)}" fill="${X.earthS}" opacity="0.55"/>`;
    for (const dx of [-0.2, 0.02, 0.21]) o += limb2(`M${n(b.x + dx * 0.7 * k)},${n(b.y - 0.44 * k)} L${n(b.x + dx * 1.2 * k)},${n(b.y + (dx === 0.02 ? 0.03 : 0) * k)}`, dx > 0.1 ? M.woodS : M.wood, 0.05 * k);
    o += `<path d="${blob(ring(b.x, b.y - 0.45 * k, 0.24 * k, 81, 11, 0.04, 0.28))}" fill="${M.woodL}" stroke="${INK}" stroke-width="1.2"/><path d="M${n(b.x - 0.16 * k)},${n(b.y - 0.47 * k)} q${n(0.02 * k)},${n(-0.1 * k)} ${n(0.16 * k)},${n(-0.09 * k)} q${n(0.16 * k)},0 ${n(0.17 * k)},${n(0.1 * k)} q${n(-0.16 * k)},${n(0.05 * k)} ${n(-0.33 * k)},${n(-0.01 * k)} Z" fill="${M.blueL}" stroke="${INK}" stroke-width="1.1"/><path d="M${n(b.x - 0.12 * k)},${n(b.y - 0.5 * k)} q${n(0.13 * k)},${n(0.03 * k)} ${n(0.26 * k)},0" stroke="${M.blueS}" stroke-width="1.4" fill="none"/>`;
    items.push({ Z: sz, svg: o }); }
  { const ax = -2.36, az = 6.0, b = q(ax, 0, az), k = b.s; let o = `<g transform="rotate(-7 ${n(b.x)} ${n(b.y)})"><path d="M${n(b.x)},${n(b.y)} Q${n(b.x - 0.24 * k)},${n(b.y - 0.34 * k)} ${n(b.x - 0.2 * k)},${n(b.y - 0.68 * k)} Q${n(b.x - 0.16 * k)},${n(b.y - 0.84 * k)} ${n(b.x - 0.06 * k)},${n(b.y - 0.88 * k)} L${n(b.x - 0.07 * k)},${n(b.y - 1.04 * k)} L${n(b.x + 0.08 * k)},${n(b.y - 1.04 * k)} L${n(b.x + 0.06 * k)},${n(b.y - 0.88 * k)} Q${n(b.x + 0.18 * k)},${n(b.y - 0.82 * k)} ${n(b.x + 0.2 * k)},${n(b.y - 0.66 * k)} Q${n(b.x + 0.22 * k)},${n(b.y - 0.3 * k)} ${n(b.x)},${n(b.y)} Z" fill="${M.roof}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/><path d="M${n(b.x + 0.07 * k)},${n(b.y - 0.86 * k)} Q${n(b.x + 0.2 * k)},${n(b.y - 0.8 * k)} ${n(b.x + 0.21 * k)},${n(b.y - 0.62 * k)} Q${n(b.x + 0.2 * k)},${n(b.y - 0.3 * k)} ${n(b.x + 0.02 * k)},${n(b.y - 0.04 * k)} Q${n(b.x + 0.1 * k)},${n(b.y - 0.4 * k)} ${n(b.x + 0.07 * k)},${n(b.y - 0.86 * k)} Z" fill="${M.roofS}"/><path d="M${n(b.x - 0.06 * k)},${n(b.y - 1.0 * k)} q${n(-0.16 * k)},${n(0.02 * k)} ${n(-0.13 * k)},${n(0.24 * k)} M${n(b.x + 0.07 * k)},${n(b.y - 1.0 * k)} q${n(0.16 * k)},${n(0.02 * k)} ${n(0.13 * k)},${n(0.24 * k)}" stroke="${INK}" stroke-width="${n(0.05 * k)}" fill="none" stroke-linecap="round"/><path d="M${n(b.x - 0.06 * k)},${n(b.y - 1.0 * k)} q${n(-0.16 * k)},${n(0.02 * k)} ${n(-0.13 * k)},${n(0.24 * k)} M${n(b.x + 0.07 * k)},${n(b.y - 1.0 * k)} q${n(0.16 * k)},${n(0.02 * k)} ${n(0.13 * k)},${n(0.24 * k)}" stroke="${M.roof}" stroke-width="${n(0.03 * k)}" fill="none" stroke-linecap="round"/><path d="M${n(b.x - 0.19 * k)},${n(b.y - 0.6 * k)} q${n(0.2 * k)},${n(0.04 * k)} ${n(0.4 * k)},0" stroke="${INK}" stroke-width="1" fill="none" opacity="0.7"/></g>`;
    items.push({ Z: az, svg: o }); }
  let jar = null;
  if (st.jar !== false) { jar = pithos(c, { X: R.jar.X, Z: R.jar.Z, lit: -1, ...(st.jar || {}) }, t); items.push({ Z: R.jar.Z, svg: jar.svg }); }
  // --- light for after the grade: the lamp's flame + dust in its light (each mote placed by hand, drifting slowly)
  let light = lampO.light;
  const dustA = clamp(st.dust ?? 1) * lampA;
  for (let i = 0; i < 34; i++) {
    const ph = t * (0.05 + 0.06 * hash(i + 0.4)) + hash(i + 2.2), a0 = hash(i + 3.3) * 6.283, rr = (0.2 + 1.3 * hash(i + 4.4) ** 0.8) * lp.s, x = lp.x + Math.cos(a0) * rr + Math.sin(ph * 6.283) * 0.07 * lp.s, y = lp.y + 0.25 * lp.s + Math.sin(a0) * rr * 0.75 + ((ph * 0.4 * lp.s) % (0.4 * lp.s)) - 0.2 * lp.s, tw = 0.5 + 0.5 * Math.sin(t * (0.8 + hash(i + 5.5)) + i * 1.9), r = 1.2 + hash(i + 6.6) ** 2 * 3.2;
    light += i % 5 ? `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#ffe2a0" opacity="${n(dustA * tw * (0.25 + 0.5 * hash(i + 7.7)))}"/>` : `<path d="M${n(x)},${n(y)} l${n(r * 2.4)},${n(-r * 1.2)}" stroke="#ffd98a" stroke-width="${n(r * 0.8)}" stroke-linecap="round" opacity="${n(dustA * tw * 0.5)}"/>`;
  }
  if (jar) light += jar.overlay;
  return { back: s, items, svg: s + stack(items), light, jar, lampAt: lampO.flame };
}

// ================================================================ the cast: one rig, hand-drawn hands
// hands: wrist at 0,0, fingers along +x, thumb on the -y side. a = finger angles, c = curl at the middle joint.
const HANDS = {
  open: { a: [-26, -10, 6, 22], c: [4, 2, 4, 8], th: [-64, 1], l: 1 },
  reach: { a: [-12, -4, 4, 12], c: [16, 18, 20, 26], th: [-50, 1], l: 1 },
  flat: { a: [-5, -1.5, 2, 6], c: [3, 2, 3, 5], th: [-24, 0.9], l: 1 },
  relax: { a: [6, 11, 16, 22], c: [38, 46, 54, 60], th: [-26, 0.85], l: 0.92 },
  grip: { a: [30, 34, 38, 42], c: [112, 118, 124, 128], th: [16, 0.95], l: 0.86 },
  pinch: { a: [4, 22, 32, 40], c: [48, 100, 112, 120], th: [-12, 1], l: 0.92 },
};
const blendHand = (A, B, u) => ({ a: A.a.map((v, i) => lerp(v, B.a[i], u)), c: A.c.map((v, i) => lerp(v, B.c[i], u)), th: [lerp(A.th[0], B.th[0], u), lerp(A.th[1], B.th[1], u)], l: lerp(A.l, B.l, u) });
// C: { skin, shade?, tips? (burnt / muddy fingertips), nail? }.  o: { detail (knuckles, nails), w (finger width) }
export function hand(x, y, ang, shape, C, k = 1, side = 1, o = {}) {
  const S = typeof shape === "string" ? HANDS[shape] || HANDS.relax : shape, fw = o.w ?? 2.25, ink = o.ink ?? INK, lw = o.lw ?? 1.15;
  const LEN = [7.4, 8.5, 7.9, 6.2], BY = [-3.25, -1.1, 1.1, 3.2], BX = [8.3, 8.9, 8.7, 8.0];
  const seg = (d, col, w) => `<path d="${d}" stroke="${col}" stroke-width="${n(w)}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  let s = `<g transform="translate(${n(x)},${n(y)}) rotate(${n(ang)}) scale(${n(k * 1000) / 1000},${n(k * side * 1000) / 1000})">`;
  s += `<path d="M-1,-3.3 Q4,-4.9 8.8,-4.5 Q10.6,0 8.6,4.5 Q4,5 -1,3.3 Z" fill="${C.skin}" stroke="${ink}" stroke-width="${lw}" stroke-linejoin="round"/>`;
  if (C.shade) s += `<path d="M0,1.4 Q4,3 8.6,2.2 L8.4,4.2 Q4,4.6 -0.4,3 Z" fill="${C.shade}"/>`;
  for (let i = 3; i >= 0; i--) {
    const a0 = S.a[i] * Math.PI / 180, a1 = (S.a[i] + S.c[i]) * Math.PI / 180, a2 = (S.a[i] + S.c[i] * 1.75) * Math.PI / 180, L1 = LEN[i] * S.l;
    const m = [BX[i] + Math.cos(a0) * L1 * 0.44, BY[i] + Math.sin(a0) * L1 * 0.44], m2 = [m[0] + Math.cos(a1) * L1 * 0.3, m[1] + Math.sin(a1) * L1 * 0.3], tp = [m2[0] + Math.cos(a2) * L1 * 0.26, m2[1] + Math.sin(a2) * L1 * 0.26];
    const d = `M${BX[i] - 1.2},${BY[i]} L${n(m[0])},${n(m[1])} L${n(m2[0])},${n(m2[1])} L${n(tp[0])},${n(tp[1])}`;
    s += seg(d, ink, fw + lw * 1.5) + seg(d, C.skin, fw);
    if (C.tips) s += seg(`M${n(m2[0])},${n(m2[1])} L${n(tp[0])},${n(tp[1])}`, C.tips, fw);
    if (o.detail) s += seg(`M${n(m[0] - 0.5)},${n(m[1] - fw * 0.36)} l0.5,${n(fw * 0.7)}`, C.shade || ink, 0.45) + seg(`M${n(tp[0] - Math.cos(a2) * 0.9)},${n(tp[1] - Math.sin(a2) * 0.9)} L${n(tp[0] + Math.cos(a2) * 0.3)},${n(tp[1] + Math.sin(a2) * 0.3)}`, C.nail || "#fff2e0", fw * 0.5);
  }
  s += seg(`M7.6,-4 L7.9,4`, C.skin, 1.6);   // the knuckle line stays soft: no ink between palm and fingers
  for (let i = 0; i < 4; i++) s += `<path d="M${n(BX[i] - 0.4)},${n(BY[i] - 0.9)} q0.9,0.9 0,1.8" stroke="${C.shade || ink}" stroke-width="0.5" fill="none" opacity="0.8"/>`;
  { const a0 = S.th[0] * Math.PI / 180, a1 = (S.th[0] + 26) * Math.PI / 180, L1 = 6.6 * S.th[1], m = [2.6 + Math.cos(a0) * L1 * 0.55, -3 + Math.sin(a0) * L1 * 0.55], tp = [m[0] + Math.cos(a1) * L1 * 0.45, m[1] + Math.sin(a1) * L1 * 0.45], d = `M1.8,-1.6 L${n(m[0])},${n(m[1])} L${n(tp[0])},${n(tp[1])}`;
    s += seg(d, ink, 2.9 + lw * 1.5) + seg(d, C.skin, 2.9) + seg(`M1.2,-0.6 L${n(lerp(1.8, m[0], 0.5))},${n(lerp(-1.6, m[1], 0.5))}`, C.skin, 3.1);
    if (C.tips) s += seg(`M${n(lerp(m[0], tp[0], 0.4))},${n(lerp(m[1], tp[1], 0.4))} L${n(tp[0])},${n(tp[1])}`, C.tips, 2.9);
    if (o.detail) s += seg(`M${n(tp[0] - Math.cos(a1) * 1)},${n(tp[1] - Math.sin(a1) * 1)} L${n(tp[0] + Math.cos(a1) * 0.3)},${n(tp[1] + Math.sin(a1) * 0.3)}`, C.nail || "#fff2e0", 1.5); }
  return s + `</g>`;
}
function ik(sx, sy, hx, hy, l1, l2, bend) {
  let dx = hx - sx, dy = hy - sy, d = Math.hypot(dx, dy) || 1; const mx = l1 + l2 - 0.6;
  if (d > mx) { hx = sx + dx / d * mx; hy = sy + dy / d * mx; dx = hx - sx; dy = hy - sy; d = mx; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  return { e: [sx + dx / d * a - bend * dy / d * h, sy + dy / d * a + bend * dx / d * h], h: [hx, hy] };
}
// an almond eye: the outer corner lifts, the upper lid is one firm line with a flick
function almond(x, y, w, h, look, open, dir, iris = "#3a2418") {
  if (open < 0.22) return `<path d="M${n(x - w * dir)},${n(y + h * 0.1)} Q${n(x)},${n(y + h * 0.75)} ${n(x + w * dir)},${n(y - h * 0.3)}" stroke="${INK}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
  h *= open; const id = `pe${UID++}`, sh = `M${n(x - w * dir)},${n(y + h * 0.3)} Q${n(x - w * 0.15 * dir)},${n(y - h * 1.2)} ${n(x + w * dir)},${n(y - h * 0.5)} Q${n(x + w * 0.2 * dir)},${n(y + h * 0.9)} ${n(x - w * dir)},${n(y + h * 0.3)} Z`, ix = x + look * w * 0.42 + dir * w * 0.05, ir = Math.min(w * 0.5, 2.1);
  return `<clipPath id="${id}"><path d="${sh}"/></clipPath><path d="${sh}" fill="#f6efe6"/><g clip-path="url(#${id})"><circle cx="${n(ix)}" cy="${n(y - h * 0.1)}" r="${n(ir)}" fill="${iris}"/><circle cx="${n(ix)}" cy="${n(y - h * 0.1)}" r="${n(ir * 0.5)}" fill="#0b0710"/><circle cx="${n(ix + ir * 0.4)}" cy="${n(y - h * 0.1 - ir * 0.4)}" r="${n(ir * 0.26)}" fill="#fff"/></g><path d="M${n(x - w * dir)},${n(y + h * 0.3)} Q${n(x - w * 0.15 * dir)},${n(y - h * 1.2)} ${n(x + w * dir)},${n(y - h * 0.5)} l${n(1.3 * dir)},-0.9" stroke="${INK}" stroke-width="1.05" fill="none" stroke-linecap="round"/><path d="M${n(x - w * 0.6 * dir)},${n(y + h * 0.62)} Q${n(x + w * 0.2 * dir)},${n(y + h * 0.95)} ${n(x + w * 0.8 * dir)},${n(y + h * 0.05)}" stroke="${INK}" stroke-width="0.35" fill="none" opacity="0.6"/>`;
}
const NUM = ["lean", "bend", "fx", "tilt", "rise", "brow", "smile", "talk", "yawn", "squint", "swing", "crouch", "aN", "aF", "turn"], PT = ["hN", "hF"], STR = ["sN", "sF", "bN", "bF"];
const blendPose = (T, a, b, u) => { const A = { ...T.stand, ...(T[a] || a) }, B = { ...T.stand, ...(T[b] || b) }, o = {}; for (const k of NUM) if (A[k] != null || B[k] != null) o[k] = A[k] == null || B[k] == null ? (u < 0.5 ? A[k] : B[k]) : lerp(A[k], B[k], u); for (const k of PT) o[k] = [lerp(A[k][0], B[k][0], u), lerp(A[k][1], B[k][1], u)]; for (const k of ["sN", "sF"]) o[k] = blendHand(HANDS[A[k]] || A[k], HANDS[B[k]] || B[k], u); for (const k of ["bN", "bF"]) o[k] = u < 0.5 ? A[k] : B[k]; return o; };
// the rig. K = the character sheet (H cm, w width, colours, garment + head callbacks). Local numbers are for 172 cm.
function figure(c, st, K, T, t = 0) {
  if (st.Z - c.z < 0.3) return { svg: "", handN: null, handF: null, lips: null, head: null, p: null, Z: st.Z };
  const pose = { ...T.stand, ...(typeof st.pose === "string" ? T[st.pose] : st.pose || {}) };
  for (const k of [...NUM, ...PT, ...STR]) if (st[k] != null) pose[k] = st[k];
  const p = P(c, st.X, st.Y ?? 0, st.Z), dir = st.dir ?? 1, sc = K.H / 172, w = K.w ?? 1, k = p.s / 100 * sc, seed = K.seed ?? 1;
  const walk = st.walk, sw = walk == null ? 0 : Math.sin(walk * 6.283), cw = walk == null ? 0 : Math.cos(walk * 6.283), bob = walk == null ? 0 : -Math.abs(cw) * 1.8;
  const rise = (pose.rise ?? 0) * 6, crouch = pose.crouch ?? 0, hipY = -90 - rise + crouch + bob, bend = pose.bend ?? 0, lean = pose.lean ?? 0, fx = pose.fx ?? 0.6;
  const rb = (x, y) => { const [a, b] = rot2(x, y - (-90), bend); return [a, b + hipY]; };
  const clay = clamp(st.clay ?? 0), Cc = (col, to = X.clay) => (clay > 0 ? mix(col, to, clay) : col), skin = Cc(K.skin), skinS = Cc(K.skinS, X.clayS);
  const HC = { skin, shade: skinS };
  // legs
  const stride = K.stride ?? 17, fN = [sw * stride - 2, -Math.max(0, cw) * 5 * (walk == null ? 0 : 1)], fF = [-sw * stride + 5, -Math.max(0, -cw) * 5 * (walk == null ? 0 : 1)];
  const legW = (K.legW ?? 7.4) * (0.7 + 0.3 * w), leg = (hx, f, far) => { const j = ik(hx, hipY, f[0], f[1] - 7 - rise, 42, 41.3, -1); return L.limb([[hx, hipY], j.e, [j.h[0], j.h[1]]], legW, far ? skinS : skin, far ? null : skinS) + K.foot({ x: j.h[0], y: f[1] - rise, far, Cc, rise, seed }); };
  let lower = "", upper = "", back = K.back ? K.back({ w, hipY, sw, Cc, rb, bend, seed, t }) : "";
  if (K.garment === "peplos") {
    const hem = -5 - rise * 0.5, sway = sw * 3, dress = Cc(st.dress === false ? X.clay : K.dress), dS = Cc(st.dress === false ? X.clayS : K.dressS, X.clayS), gold = Cc(st.dress === false ? X.clayS : K.border, X.clayS);
    lower += `<ellipse cx="${n(fF[0] + 7)}" cy="${n(-2 - rise)}" rx="5" ry="2.6" fill="${skinS}" stroke="${INK}" stroke-width="0.9"/><ellipse cx="${n(fN[0] + 6)}" cy="${n(-1.6 - rise)}" rx="5.6" ry="2.8" fill="${skin}" stroke="${INK}" stroke-width="0.9"/>`;
    if (rise > 2) lower += `<path d="M${n(fN[0] + 1)},${n(-2 - rise)} l-2,${n(rise * 0.5)} M${n(fF[0] + 2)},${n(-2 - rise)} l-2,${n(rise * 0.5)}" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/><path d="M${n(fN[0] + 1)},${n(-2 - rise)} l-2,${n(rise * 0.5)}" stroke="${skin}" stroke-width="2.4" stroke-linecap="round"/>`;
    const sk = [[-9.5 * w, hipY - 16], [9.5 * w, hipY - 16], [12.5 * w + sw * 2, hipY + 20], [15 * w + sway + sw * 5, hem - 2], [9, hem + 1.5 + jit(seed, 0.8)], [0 + sway * 0.5, hem + 2.4], [-8, hem + 1.2], [-14 * w + sway * 0.4, hem - 1], [-12 * w, hipY + 20]];
    lower += `<path d="M${sk[0]} L${sk[1]} Q${sk[2]} ${sk[3]} Q${sk[4]} ${sk[5]} Q${sk[6]} ${sk[7]} Q${sk[8]} ${sk[0]} Z" fill="${dress}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    lower += `<path d="M${n(-4 * w)},${n(hipY - 14)} Q${n(-12 * w)},${n(hipY + 30)} ${n(-13 * w + sway * 0.4)},${hem - 1} Q-9,${hem + 1} -6,${hem + 1.4} Q${n(-9 * w)},${n(hipY + 30)} ${n(-4 * w)},${n(hipY - 14)} Z" fill="${dS}"/>`;
    for (const [i, fxp] of [-5.5, -1.5, 2.5, 6.4, 9.6].entries()) lower += `<path d="M${n(fxp * w + jit(seed + i, 0.8))},${n(hipY - 12 + hash(seed + i * 3) * 14)} Q${n(fxp * 1.3 * w + sw * (1 + i * 0.4))},${n(hipY + 40)} ${n(fxp * 1.55 * w + sway * 0.8 + jit(seed + i + 9, 1))},${n(hem - 5 - hash(seed + i) * 5)}" stroke="${dS}" stroke-width="${n(0.9 + hash(seed + i * 7) * 0.7)}" fill="none" stroke-linecap="round"/>`;
    // the gold border: a band at the hem, each little key stroke placed by hand
    lower += `<path d="M${n(-13.6 * w + sway * 0.4)},${hem - 6.5} Q0,${hem - 3.4} ${n(14.7 * w + sway + sw * 5)},${hem - 7.5} L${n(15 * w + sway + sw * 5)},${hem - 2} Q9,${hem + 1.5} ${n(sway * 0.5)},${hem + 2.4} Q-8,${hem + 1.2} ${n(-14 * w + sway * 0.4)},${hem - 1} Z" fill="${gold}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;
    for (let i = 0; i < 9; i++) { const bx = lerp(-11.5 * w, 12.5 * w, i / 8) + sway * (0.4 + 0.07 * i), by = hem - 2.6 - Math.abs(i - 4) * 0.42 + jit(seed + i * 2.3, 0.3); lower += `<path d="M${n(bx - 0.9)},${n(by + 1.1)} l0,-2.2 l1.8,0 l0,1.3" stroke="${Cc("#8a4a12", X.clayD)}" stroke-width="0.6" fill="none"/>`; }
    upper += `<path d="M${n(-11.4 * w)},-136.5 Q${n(-10.6 * w)},-141.6 ${n(-5 * w)},-143 Q0,-139.6 ${n(5.4 * w)},-143 Q${n(10.8 * w)},-141.6 ${n(11.6 * w)},-136 Q${n(12.4 * w)},-122 ${n(9.2 * w)},-104 L${n(-9.2 * w)},-104 Q${n(-12.6 * w)},-122 ${n(-11.4 * w)},-136.5 Z" fill="${dress}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    upper += `<path d="M${n(-10.6 * w)},-121 Q0,-118 ${n(11 * w)},-122 L${n(12 * w)},-99 Q${n(6 * w)},${n(-94.5 + jit(seed + 3, 0.8))} 0,-96.5 Q${n(-6 * w)},-95 ${n(-11.6 * w)},-98 Z" fill="${dress}" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(-11.6 * w)},-98 Q${n(-6 * w)},-95 0,-96.5 Q${n(6 * w)},-94.5 ${n(12 * w)},-99 L${n(11.8 * w)},-102.6 Q${n(6 * w)},-98.4 0,-100.2 Q${n(-6 * w)},-98.8 ${n(-11.4 * w)},-101.6 Z" fill="${gold}" stroke="${INK}" stroke-width="0.7"/>`;
    upper += `<path d="M${n(-11 * w)},-136 Q${n(-12.4 * w)},-120 ${n(-10.8 * w)},-103 L${n(-6 * w)},-102 Q${n(-8.6 * w)},-122 ${n(-6.4 * w)},-141 Z" fill="${dS}"/><path d="M${n(-4 * w)},-142.6 Q0,-136 ${n(5 * w)},-142.4" stroke="${gold}" stroke-width="2" fill="none"/><path d="M${n(-4 * w)},-142.6 Q0,-136 ${n(5 * w)},-142.4" stroke="${INK}" stroke-width="0.5" fill="none" transform="translate(0,1.2)"/>`;
    for (const [i, fxp] of [-2, 3, 7].entries()) upper += `<path d="M${n(fxp * w)},${n(-136 + i * 2)} Q${n(fxp * w + 1.4)},-120 ${n(fxp * 1.2 * w + jit(seed + i + 20, 0.8))},-104" stroke="${dS}" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
    for (const sx of [-8 * w, 8.4 * w]) upper += `<circle cx="${n(sx)}" cy="-140.4" r="1.7" fill="${gold}" stroke="${INK}" stroke-width="0.7"/>`;
  } else {
    lower += leg(4, fF, true) + leg(-4, fN, false);
    const hemY = hipY + (K.hem ?? 36), bel = K.belly ?? 0, tun = Cc(K.dress), tS = Cc(K.dressS);
    lower += `<path d="M${n(-10 * w)},${n(hipY - 16)} L${n(10 * w + bel)},${n(hipY - 16)} Q${n(13 * w + bel)},${n(hipY + 10)} ${n(13.5 * w + sw * 3)},${n(hemY - 1)} Q${n(5 * w)},${n(hemY + 2.4 + jit(seed, 0.8))} 0,${n(hemY + 1)} Q${n(-6 * w)},${n(hemY + 2.8)} ${n(-13 * w - sw * 2)},${n(hemY)} Q${n(-12.5 * w)},${n(hipY + 10)} ${n(-10 * w)},${n(hipY - 16)} Z" fill="${tun}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    lower += `<path d="M${n(-10 * w)},${n(hipY - 14)} Q${n(-12.5 * w)},${n(hipY + 10)} ${n(-12.6 * w - sw * 2)},${n(hemY - 1)} L${n(-7 * w)},${n(hemY + 1.4)} Q${n(-8 * w)},${n(hipY + 10)} ${n(-5 * w)},${n(hipY - 14)} Z" fill="${tS}"/>`;
    for (const [i, fxp] of [-3, 2, 7].entries()) lower += `<path d="M${n(fxp * w)},${n(hipY - 8 + i * 2)} Q${n(fxp * 1.2 * w)},${n(hipY + 14)} ${n(fxp * 1.35 * w + sw * 2 + jit(seed + i, 1))},${n(hemY - 3)}" stroke="${tS}" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    if (K.hemBand) lower += `<path d="M${n(-12.6 * w - sw * 2)},${n(hemY - 4.6)} Q0,${n(hemY - 2.4)} ${n(13.3 * w + sw * 3)},${n(hemY - 5.2)}" stroke="${K.hemBand}" stroke-width="2" fill="none"/>`;
    upper += `<path d="M${n(-12 * w)},-135.5 Q${n(-11 * w)},-141.8 ${n(-5 * w)},-143.2 Q0,-140 ${n(5.4 * w)},-143.2 Q${n(11.4 * w)},-141.8 ${n(12.4 * w)},-135 Q${n(12.6 * w + bel * 1.2)},-118 ${n(10.2 * w + bel)},-100 L${n(-10.2 * w)},-100 Q${n(-12.8 * w)},-120 ${n(-12 * w)},-135.5 Z" fill="${tun}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    upper += `<path d="M${n(-11.6 * w)},-135 Q${n(-12.6 * w)},-120 ${n(-10.4 * w)},-101 L${n(-5.6 * w)},-100.6 Q${n(-8.4 * w)},-122 ${n(-6.6 * w)},-141.4 Z" fill="${tS}"/>`;
    upper += `<path d="M${n(-10.6 * w)},-106.5 Q0,${n(-103 + bel * 0.4)} ${n(10.8 * w + bel * 1.3)},-106.8 L${n(10.6 * w + bel * 1.2)},-102 Q0,${n(-98.4 + bel * 0.4)} ${n(-10.6 * w)},-101.8 Z" fill="${K.belt}" stroke="${INK}" stroke-width="0.8"/>`;
    if (K.torso) upper += K.torso({ w, bel, Cc, seed });
  }
  // neck + head
  const nk = rb(0.6, -143), hr = bend * 0.55 + (pose.tilt ?? 0), hx = fx * 1.6, hy = -13.6, ex = hx + fx * 4.3;
  upper += `<path d="M-3.2,-147 L3.6,-147 L4.2,-141 Q0,-137.6 -3.8,-141 Z" fill="${skinS}" stroke="${INK}" stroke-width="0.9"/>`;
  const blink = clamp(st.blink ?? 0), open = (1 - blink) * (1 - (pose.squint ?? 0) * 0.6) * (clay > 0.5 ? 0 : 1) * (1 - clamp(pose.yawn ?? 0)), F = { hx, hy, ex, fx, st, pose, Cc, skin, skinS, open, look: st.look ?? fx * 0.6, seed, t, clay, w };
  let head = (K.headBack ? K.headBack(F) : "") + `<path d="${L.headPath(hx, hy, K.rx ?? 9.4, K.ry ?? 11, fx, K.chin ?? 1.04)}" fill="${skin}" stroke="${INK}" stroke-width="1.1"/>` + K.face(F) + (K.headFront ? K.headFront(F) : "");
  // arms: shoulder -> elbow -> wrist, then the hand
  const arm = (near) => {
    const sh = rb(near ? lerp(-8.6, 4.5, pose.turn ?? 0) * w : 9.2 * w, -136.5 + (near ? (pose.turn ?? 0) * 2.5 : 0)), tg = near ? pose.hN : pose.hF, swg = (walk == null ? 0 : (near ? -1 : 1) * sw * (pose.swing ?? 9));
    const j = ik(sh[0], sh[1], tg[0] + swg, tg[1] - rise * (tg[1] < -130 ? 1 : 0.3), 30, 26, (near ? pose.bN : pose.bF) ?? (tg[1] < sh[1] - 45 ? -1 : 1)), aw = (K.armW ?? 5.6) * (0.75 + 0.25 * w);
    const fa = Math.atan2(j.h[1] - j.e[1], j.h[0] - j.e[0]) * 180 / Math.PI, ang = (near ? pose.aN : pose.aF) ?? fa, shp = near ? pose.sN : pose.sF, hc = (!near && K.farHand && st.burnt !== false ? K.farHand(HC, Cc) : HC), side = Math.cos(ang * Math.PI / 180) >= 0 ? 1 : -1;
    let a = L.limb([sh, j.e, j.h], aw, near ? skin : skinS, near ? skinS : null);
    if (K.sleeve) a += L.limb([sh, [lerp(sh[0], j.e[0], 0.42), lerp(sh[1], j.e[1], 0.42)]], aw + 2.2, Cc(near ? K.dress : K.dressS));
    if (K.bracer) a += K.bracer(j, aw);
    a += hand(j.h[0], j.h[1], ang, shp, hc, (K.handK ?? 1.02) * (0.8 + 0.2 * w), side * (near ? 1 : -1) * (pose.flipHand ? -1 : 1), { detail: k > 2.2 });
    return { svg: a, h: [j.h[0] + Math.cos(ang * Math.PI / 180) * 9, j.h[1] + Math.sin(ang * Math.PI / 180) * 9] };
  };
  const aF = arm(false), aN = arm(true);
  const body = `<ellipse cx="0" cy="0" rx="${n(22 * w)}" ry="4.6" fill="${X.earthS}" opacity="0.5"/>` + back + aF.svg + lower + `<g transform="rotate(${n(bend)} 0 ${n(hipY)}) translate(0,${n(hipY + 90)})">${upper}</g><g transform="translate(${n(nk[0])},${n(nk[1])}) rotate(${n(hr)})">${head}</g>` + aN.svg + (K.front ? K.front({ w, hipY, sw, Cc, rb, seed }) : "");
  const scr = (x, y) => { const [a, b] = rot2(x, y, lean); return { x: p.x + k * dir * a, y: p.y + k * b, s: p.s * sc }; }, hd = (x, y) => { const [a, b] = rot2(x, y, hr); return scr(nk[0] + a, nk[1] + b); };
  return { svg: `<g transform="translate(${n(p.x)},${n(p.y)}) scale(${n(k * dir * 1000) / 1000},${n(k * 1000) / 1000}) rotate(${n(lean)})">${body}</g>`, handN: scr(...aN.h), handF: scr(...aF.h), lips: hd(ex + fx * 0.8, hy + 6.4), head: hd(hx, hy), eye: hd(ex, hy - 1), p, Z: st.Z };
}
const sandal = (col = "#7a4a24") => ({ x, y, far, Cc }) => `<path d="M${n(x - 3.4)},${n(y - 1)} Q${n(x - 4)},${n(y - 6.4)} ${n(x)},${n(y - 7)} L${n(x + 5)},${n(y - 5.4)} Q${n(x + 10.4)},${n(y - 3.6)} ${n(x + 10)},${n(y - 0.8)} Z" fill="${Cc(far ? "#c08a66" : "#dba67c")}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/><path d="M${n(x - 4)},${n(y - 0.6)} L${n(x + 10.6)},${n(y - 0.4)}" stroke="${col}" stroke-width="1.7" stroke-linecap="round"/><path d="M${n(x - 2)},${n(y - 5.6)} L${n(x + 3.6)},${n(y - 1)} M${n(x + 3)},${n(y - 6)} L${n(x + 0.4)},${n(y - 1)} M${n(x + 6)},${n(y - 4.6)} L${n(x + 6.6)},${n(y - 1)}" stroke="${col}" stroke-width="0.9" fill="none"/>`;
const nose = (F, col) => `<path d="M${n(F.ex + F.fx * 1.0)},${n(F.hy - 0.6)} q${n(F.fx * 2.4)},3.4 ${n(-F.fx * 0.3)},4.4" stroke="${col}" stroke-width="0.85" fill="none" stroke-linecap="round"/>`;
const ear = (F) => (Math.abs(F.fx) > 0.25 ? `<path d="M${n(F.hx - F.fx * 8.6)},${n(F.hy - 2.4)} q${n(-F.fx * 3.6)},-0.4 ${n(-F.fx * 3)},4.2 q${n(F.fx * 0.4)},2.8 ${n(F.fx * 3)},2.2 Z" fill="${F.skin}" stroke="${INK}" stroke-width="0.8"/>` : "");
const brows = (F, col, wd, lift = 0, slant = 0) => { const b = F.pose.brow ?? 0, y = F.hy - 5.4 - lift - b * 1.3; return `<path d="M${n(F.ex - 7.4)},${n(y + 0.6 + slant - Math.min(0, b) * 1.6 * -1 * 0)} Q${n(F.ex - 4.6)},${n(y - 1.5)} ${n(F.ex - 1.7)},${n(y + 0.2 - slant + Math.min(0, b) * -1.8)} M${n(F.ex + 1.9)},${n(y + 0.2 - slant + Math.min(0, b) * -1.8)} Q${n(F.ex + 4.8)},${n(y - 1.5)} ${n(F.ex + 7.2)},${n(y + 0.6 + slant)}" stroke="${col}" stroke-width="${wd}" fill="none" stroke-linecap="round"/>`; };
const eyes = (F, w = 3.1, h = 2.15, iris) => almond(F.ex - 4.3, F.hy - 1.2, F.fx < -0.3 ? w * 0.8 : w, h, F.look, F.open, -1, iris) + almond(F.ex + 4.3, F.hy - 1.2, F.fx > 0.3 ? w * 0.8 : w, h, F.look, F.open, 1, iris);
const mouthOf = (F, o = {}) => { const x = F.ex + F.fx * 0.8, y = F.hy + 6.4, sm = F.pose.smile ?? o.smile ?? 0, tk = F.pose.talk ?? 0, yw = F.pose.yawn ?? 0, mw = o.w ?? 2.6;
  if (yw > 0.15) return `<path d="${blob(ring(x, y + 1 + yw * 1.4, 2.2 + yw * 1.6, 3, 9, 0.06, 1.25))}" fill="#5a1c30" stroke="${INK}" stroke-width="0.8"/><path d="M${n(x - 1.6)},${n(y + 2.6 + yw * 2.6)} q1.6,-1.6 3.2,0" stroke="#e0707a" stroke-width="1.2" fill="none"/>`;
  if (tk > 0.12) return `<path d="M${n(x - mw)},${n(y - sm)} Q${n(x)},${n(y - 0.6)} ${n(x + mw)},${n(y - sm)} Q${n(x)},${n(y + 1.2 + tk * 3.6)} ${n(x - mw)},${n(y - sm)} Z" fill="#5a1c30" stroke="${INK}" stroke-width="0.7"/>`;
  return `<path d="M${n(x - mw)},${n(y - sm * 1.5 + (o.skew ?? 0))} Q${n(x)},${n(y + sm * 1.9 + 0.2)} ${n(x + mw)},${n(y - sm * 1.7 - (o.skew ?? 0))}" stroke="${o.col || "#7a2a38"}" stroke-width="${o.lw ?? 1}" fill="none" stroke-linecap="round"/>`; };

// ---------------------------------------------------------------- Pandora: pale dress, gold border, dark hair, a face that tells nothing
const HAIR = "#1d1829", HAIRL = "#463e66";
const K_PANDORA = { H: 168, w: 0.9, seed: 11, skin: "#f2cba6", skinS: "#d79c7a", garment: "peplos", dress: "#f6efdc", dressS: "#cfc3d8", border: "#f4b41c", armW: 6.2, legW: 6.4, handK: 1, rx: 9.2, ry: 11, chin: 1.07,
  foot: () => "",
  headBack(F) { const { hx, hy, fx, Cc, seed } = F, hc = Cc(HAIR, X.clayS); let s = `<path d="${blob(ring(hx - fx * 2.6, hy - 1.6, 11.6, seed, 12, 0.035, 1.08))}" fill="${hc}" stroke="${INK}" stroke-width="1"/>`;
    // the knot at the back, bound with a gold cord; one long lock down the back, every strand its own line
    s += `<path d="${blob(ring(hx - fx * 12.4, hy + 1.4, 5.6, seed + 4, 9, 0.07, 1.06))}" fill="${hc}" stroke="${INK}" stroke-width="1"/><path d="M${n(hx - fx * 8.6)},${n(hy - 3.6)} q${n(-fx * 1.4)},5 ${n(fx * 0.2)},9.6" stroke="${Cc("#f4b41c", X.clayS)}" stroke-width="1.6" fill="none"/>`;
    s += `<path d="M${n(hx - fx * 13)},${n(hy + 5)} Q${n(hx - fx * 17)},${n(hy + 18)} ${n(hx - fx * 12.4)},${n(hy + 30)} Q${n(hx - fx * 10.4)},${n(hy + 34.5)} ${n(hx - fx * 8.6)},${n(hy + 31.4)} Q${n(hx - fx * 12)},${n(hy + 19)} ${n(hx - fx * 8.6)},${n(hy + 6)} Z" fill="${hc}" stroke="${INK}" stroke-width="1"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${n(hx - fx * (12.4 - i * 0.7))},${n(hy + 7 + i)} Q${n(hx - fx * (15.6 - i * 1.1))},${n(hy + 19)} ${n(hx - fx * (11.6 - i * 0.6) + jit(seed + i, 0.5))},${n(hy + 29 + jit(seed + i + 3, 1.6))}" stroke="${Cc(HAIRL, X.clayD)}" stroke-width="0.55" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 4; i++) s += `<path d="M${n(hx - fx * 12.4 + jit(seed + i * 3, 3))},${n(hy - 1 + i * 1.3)} q${n(-fx * 2.6)},${n(1 + jit(seed + i, 1))} ${n(-fx * (4 + hash(seed + i) * 2.4))},${n(jit(seed + i + 7, 2.4))}" stroke="${hc}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
    return s; },
  face(F) { const { hx, hy, ex, fx, Cc, clay } = F, lip = Cc("#b24a58", X.clayD); let s = ear(F);
    s += brows(F, Cc(HAIR, X.clayD), 0.95, 0.5) + eyes(F, 3.3, 2.2, "#3a2418") + nose(F, Cc("#c98a6e", X.clayD));
    const sm = F.pose.smile ?? 0, x = ex + fx * 0.8, y = hy + 6.5;
    s += `<path d="M${n(x - 2.5)},${n(y - sm * 1.1)} Q${n(x - 0.6)},${n(y - 0.9 + sm * 0.9)} ${n(x)},${n(y - 0.2 + sm)} Q${n(x + 0.8)},${n(y - 0.9 + sm * 0.9)} ${n(x + 2.5)},${n(y - 0.1 - sm * 1.3)}" stroke="${lip}" stroke-width="1" fill="none" stroke-linecap="round"/><path d="M${n(x - 1.5)},${n(y + 0.8 + sm * 0.6)} Q${n(x)},${n(y + 2 + sm * 0.5)} ${n(x + 1.6)},${n(y + 0.8 + sm * 0.5)}" stroke="${lip}" stroke-width="1.5" fill="none" stroke-linecap="round" opacity="0.75"/>`;
    if (!clay) s += `<ellipse cx="${n(ex - 6)}" cy="${n(hy + 3.6)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.35"/><ellipse cx="${n(ex + 6.2)}" cy="${n(hy + 3.6)}" rx="2" ry="1.1" fill="#f08a96" opacity="0.35"/>`;
    return s; },
  headFront(F) { const { hx, hy, fx, Cc, seed } = F, hc = Cc(HAIR, X.clayS), sh = Cc(HAIRL, X.clayD);
    let s = `<path d="M${n(hx - 9.6)},${n(hy + 1.5)} Q${n(hx - 11.6)},${n(hy - 13.5)} ${n(hx - 1)},${n(hy - 13.4)} Q${n(hx + 11.4)},${n(hy - 13.6)} ${n(hx + 9.7)},${n(hy + 0.5)} Q${n(hx + 8.6 + fx * 1)},${n(hy - 6.6)} ${n(hx + fx * 5)},${n(hy - 8.8)} Q${n(hx - 4 + fx * 3)},${n(hy - 8)} ${n(hx - 8 + fx * 2)},${n(hy - 3)} Q${n(hx - 9.6)},${n(hy - 1)} ${n(hx - 9.6)},${n(hy + 1.5)} Z" fill="${hc}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`;
    s += `<path d="M${n(hx - 10.2)},${n(hy - 6.6)} Q${n(hx)},${n(hy - 11.4)} ${n(hx + 10)},${n(hy - 7.4)}" stroke="${Cc("#f4b41c", X.clayS)}" stroke-width="1.5" fill="none"/>`;
    for (let i = 0; i < 8; i++) { const u = i / 7, x0 = hx + fx * 5 + jit(seed + i, 0.6), x1 = lerp(hx - 9, hx + 9.4, u); s += `<path d="M${n(x0)},${n(hy - 9)} Q${n(lerp(x0, x1, 0.6))},${n(hy - 12.6 + Math.abs(u - 0.5) * 4)} ${n(x1)},${n(hy - 6.5 + Math.abs(u - 0.5) * 9 + jit(seed + i + 5, 0.8))}" stroke="${sh}" stroke-width="0.5" fill="none" stroke-linecap="round"/>`; }
    // a curl in front of the ear, two loose strands
    s += `<path d="M${n(hx - fx * 7.4)},${n(hy - 2)} q${n(-fx * 2.8)},4 ${n(-fx * 0.4)},7.4 q${n(fx * 1.6)},1.6 ${n(fx * 1.5)},-0.8" stroke="${hc}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M${n(hx + fx * 8.8)},${n(hy - 5)} q${n(fx * 1.8)},3 ${n(fx * 0.6)},6.4 M${n(hx + 2)},${n(hy - 13.4)} q2.2,-2.2 4.6,-1.2" stroke="${hc}" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
    if (!F.clay) s += `<circle cx="${n(hx - fx * 9.6)}" cy="${n(hy + 4.6)}" r="1.1" fill="#f4b41c" stroke="${INK}" stroke-width="0.5"/>`;
    return s; },
};
export const PANDORA = {
  stand: { lean: 0, bend: 0, fx: 0.6, tilt: 0, rise: 0, hN: [-7, -81], hF: [11, -82], sN: "relax", sF: "relax", aN: 84, aF: 82, brow: 0, smile: 0 },
  walk: { lean: 2, hN: [-3, -84], hF: [12, -85], swing: 8, fx: 0.7 },
  reach: { turn: 1, fx: 0.75, tilt: -14, rise: 0.7, hN: [42, -178], sN: "reach", aN: -50, hF: [12, -85], lean: 2 },
  lift: { turn: 1, fx: 0.75, tilt: -17, rise: 1, hN: [28, -196], hF: [38, -193], sN: "grip", sF: "grip", aN: -68, aF: -64, lean: 3, brow: 0.4 },
  slam: { turn: 1, fx: 0.8, tilt: 4, rise: 0.5, bend: 10, hN: [34, -180], hF: [44, -178], sN: "flat", sF: "flat", aN: -8, aF: -6, lean: 5, brow: -0.9 },
  look: { turn: 1, fx: 0.9, tilt: 13, rise: 1, bend: 8, hN: [27, -160], hF: [37, -158], sN: "grip", sF: "grip", aN: -24, aF: -22, bN: 1, bF: 1, lean: 3, brow: 0.6 },
};
export const pandoraPose = (a, b, u) => blendPose(PANDORA, a, b, u);
export const pandora = (c, st, t) => figure(c, st, K_PANDORA, PANDORA, t);

// ---------------------------------------------------------------- Prometheus: wiry, singed beard, the burnt hand
const K_PROMETHEUS = { H: 178, w: 0.86, seed: 23, skin: "#cf9468", skinS: "#9c6446", garment: "chiton", dress: "#b0263c", dressS: "#7a1634", belt: "#2a1c24", hem: 34, armW: 5.8, legW: 7, sleeve: false, rx: 8.8, ry: 11.4, chin: 1.12, foot: sandal("#3a2418"),
  farHand: (HC) => ({ skin: "#b9523a", shade: "#7a2a28", tips: "#2a1a1e", nail: "#5a3a34" }),
  back({ w, hipY, sw, seed }) { // a ragged mantle off one shoulder, scorched along its edge
    let s = `<path d="M${n(-10 * w)},${n(hipY - 50)} Q${n(-21 * w)},${n(hipY - 20)} ${n(-17 * w - sw * 2)},${n(hipY + 44)} l3,-5 l2.4,7 l3,-8 l2.6,6 l3,-9 L${n(-3 * w)},${n(hipY - 46)} Z" fill="#3a2a4a" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/>`;
    for (let i = 0; i < 4; i++) s += `<circle cx="${n(-16 * w + i * 3.2 + jit(seed + i, 1))}" cy="${n(hipY + 38 + jit(seed + i + 4, 3))}" r="${n(0.7 + hash(seed + i) * 0.7)}" fill="#ff7a1f"/>`;
    return s; },
  torso({ w, seed }) { let s = `<path d="M${n(-9.6 * w)},-140 L${n(-2 * w)},-143.6 L${n(9 * w)},-108 L${n(4 * w)},-106.6 Z" fill="#3a2a4a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>`; for (let i = 0; i < 5; i++) s += `<path d="${blob(ring(jit(seed + i * 2, 7 * w), -112 - hash(seed + i * 3) * 22, 1 + hash(seed + i) * 1.6, seed + i, 6, 0.3))}" fill="#2a1a1e" opacity="0.55"/>`; return s; },   // soot
  headBack(F) { const { hx, hy, fx, seed } = F; let s = ""; for (let i = 0; i < 9; i++) { const a = (200 + i * 22 + jit(seed + i, 6)) * Math.PI / 180 * (fx >= 0 ? 1 : 1), r = 13.5 + hash(seed + i * 3) * 4.5, bx = hx - fx * 2 + Math.cos(a) * 9.4 * (fx >= 0 ? 1 : -1), by = hy - 2 + Math.sin(a) * 10.5; s += `<path d="M${n(bx - 2.6)},${n(by + 1.6)} L${n(hx - fx * 2 + Math.cos(a) * r * (fx >= 0 ? 1 : -1))},${n(hy - 2 + Math.sin(a) * r)} L${n(bx + 2.8)},${n(by - 1)} Z" fill="${i % 4 === 1 ? "#6a6470" : "#2a2230"}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`; } return s + `<path d="${blob(ring(hx - fx * 2.4, hy - 2.6, 10.6, seed + 30, 11, 0.05, 1.04))}" fill="#2a2230" stroke="${INK}" stroke-width="0.9"/>`; },
  face(F) { const { hx, hy, ex, fx, seed, t } = F; let s = ear(F);
    s += `<path d="M${n(ex - 6.6)},${n(hy + 1.6)} q1.2,3.4 0.2,6 M${n(ex + 6.8)},${n(hy + 1.6)} q-1,3.2 -0.2,5.6" stroke="#9c6446" stroke-width="0.8" fill="none" stroke-linecap="round"/>`;   // hollow cheeks
    s += `<path d="M${n(ex - 5.4)},${n(hy + 1.2)} q1.8,1 3.6,0.2 M${n(ex + 2.2)},${n(hy + 1.4)} q1.8,0.8 3.4,-0.2" stroke="#9c6446" stroke-width="0.6" fill="none"/>`;
    s += brows(F, "#1a1420", 1.7, 0.2, -0.9) + eyes(F, 3.0, 2.0, "#4a2a14") + nose(F, "#8a5438");
    // the beard: a jagged cut shape, tips charred black and still glowing here and there
    const bx = ex + fx * 0.6, jw = [[-8.4, 2], [-7.6, 8.4], [-6.6, 12.6], [-4.4, 11.6], [-3, 16.4], [-1, 13], [0.8, 18.6], [2.4, 13.6], [4.4, 16], [5.4, 11.4], [7.2, 12.4], [7.8, 7.4], [8.4, 2], [5, 5.2], [2.6, 4.2], [0, 5], [-2.6, 4.2], [-5, 5.2]];
    s += `<path d="${P2(jw.map(([a, b], i) => [bx + a + jit(seed + i * 1.3, 0.35), hy + b + jit(seed + i * 1.3 + 0.5, 0.35)]))} Z" fill="#2a2230" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;
    for (const [i, a, b] of [[0, -3, 16.4], [1, 0.8, 18.6], [2, 4.4, 16], [3, -6.6, 12.6], [4, 7.2, 12.4]]) { const g = 0.6 + 0.4 * Math.sin(t * (2.2 + i * 0.7) + i * 2.1); s += `<path d="M${n(bx + a - 1)},${n(hy + b - 2.4)} L${n(bx + a)},${n(hy + b)} L${n(bx + a + 1)},${n(hy + b - 2.2)} Z" fill="#0c0810"/><circle cx="${n(bx + a)}" cy="${n(hy + b - 0.5)}" r="${n(0.5 + 0.3 * g)}" fill="${i % 2 ? "#ff7a1f" : "#ffd36a"}" opacity="${n(0.5 + 0.5 * g)}"/>`; }
    for (let i = 0; i < 6; i++) s += `<path d="M${n(bx - 5 + i * 2 + jit(seed + i, 0.5))},${n(hy + 7 + hash(seed + i * 2) * 2)} l${n(jit(seed + i + 3, 0.6))},${n(3 + hash(seed + i) * 2.6)}" stroke="${i % 3 === 0 ? "#8a8490" : "#4a4254"}" stroke-width="0.5" stroke-linecap="round"/>`;
    return s + mouthOf(F, { w: 2.3, col: "#5a1c24" }); },
  headFront(F) { const { hx, hy, fx, seed } = F; let s = `<path d="M${n(hx - 9.2)},${n(hy)} Q${n(hx - 11)},${n(hy - 13.4)} ${n(hx)},${n(hy - 13.6)} Q${n(hx + 10.8)},${n(hy - 13.4)} ${n(hx + 9.2)},${n(hy - 1)} L${n(hx + 7.4 + fx)},${n(hy - 6)} L${n(hx + 5 + fx * 2)},${n(hy - 9.4)} L${n(hx + 2 + fx * 3)},${n(hy - 6.6)} L${n(hx - 1.6 + fx * 3)},${n(hy - 10)} L${n(hx - 4.6 + fx * 2)},${n(hy - 6.4)} L${n(hx - 7.4 + fx)},${n(hy - 8)} Z" fill="#2a2230" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${n(hx - 6 + i * 3)},${n(hy - 12.4 + Math.abs(i - 2) * 0.8)} l${n(jit(seed + i, 1))},${n(3.4)}" stroke="${i === 3 ? "#8a8490" : "#4a4254"}" stroke-width="0.5" stroke-linecap="round"/>`; return s; },
};
export const PROMETHEUS = {
  stand: { lean: 0, bend: 3, fx: 0.7, tilt: 0, hN: [-5, -84], hF: [13, -86], sN: "relax", sF: "relax", aN: 86, aF: 80, brow: -0.5 },
  grip: { turn: 0.9, lean: 7, bend: 8, fx: 0.85, tilt: -3, hN: [43, -116], sN: "grip", aN: 4, hF: [27, -152], sF: "open", aF: -78, brow: -1, talk: 0.5 },
  warn: { lean: 3, bend: 4, fx: 0.8, hN: [20, -108], sN: "relax", aN: 20, hF: [24, -158], sF: "open", aF: -84, brow: -1, talk: 0.6 },
};
export const prometheusPose = (a, b, u) => blendPose(PROMETHEUS, a, b, u);
export const prometheus = (c, st, t) => figure(c, st, K_PROMETHEUS, PROMETHEUS, t);

// ---------------------------------------------------------------- Epimetheus: big, soft, pleased with everything
const K_EPIMETHEUS = { H: 192, w: 1.34, belly: 5, seed: 37, skin: "#eebb94", skinS: "#c98c68", garment: "chiton", dress: "#2f86e0", dressS: "#1c58b0", belt: "#f6efdc", hem: 38, hemBand: "#f6efdc", armW: 6.6, legW: 8.2, sleeve: true, rx: 9.9, ry: 10.6, chin: 0.98, stride: 15, foot: sandal("#7a4a24"),
  headBack(F) { const { hx, hy, fx, seed } = F; let s = ""; for (let i = 0; i < 11; i++) { const a = (188 + i * 17) * Math.PI / 180; s += `<circle cx="${n(hx - fx * 2 + Math.cos(a) * 10.6 * (fx >= 0 ? 1 : -1))}" cy="${n(hy - 2 + Math.sin(a) * 11)}" r="${n(3.2 + hash(seed + i) * 1.4)}" fill="#7a4a24" stroke="${INK}" stroke-width="0.8"/>`; } return s; },
  face(F) { const { hx, hy, ex, fx, seed } = F, sm = F.pose.smile ?? 0.5, yw = F.pose.yawn ?? 0; let s = ear(F);
    s += `<ellipse cx="${n(ex - 6.4)}" cy="${n(hy + 3.8)}" rx="2.8" ry="1.7" fill="#f47a7a" opacity="0.5"/><ellipse cx="${n(ex + 6.6)}" cy="${n(hy + 3.8)}" rx="2.8" ry="1.7" fill="#f47a7a" opacity="0.5"/>`;
    s += brows(F, "#5a3418", 1.5, 1.4 + yw * 1.4, 0.7);
    s += (yw > 0.4 ? [-4.3, 4.3].map((d) => `<path d="M${n(ex + d - 2.8)},${n(hy - 1.6)} Q${n(ex + d)},${n(hy + 0.6)} ${n(ex + d + 2.8)},${n(hy - 1.8)}" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`).join("") : eyes({ ...F, open: F.open * (0.74 + 0.26 * (F.pose.brow > 0.5 ? 1 : 0)) }, 3.0, 2.3, "#5a3a1c"));
    s += `<path d="M${n(ex + fx * 0.6)},${n(hy)} q${n(fx * 3.2)},3.2 ${n(fx * 0.2)},4.4 q${n(-fx * 1.6)},0.4 ${n(-fx * 2)},-0.6" stroke="#b97a58" stroke-width="0.9" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 12; i++) s += `<circle cx="${n(ex + fx + jit(seed + i * 1.7, 6))}" cy="${n(hy + 7.6 + hash(seed + i * 2.3) * 3)}" r="0.32" fill="#7a4a24" opacity="0.7"/>`;   // stubble
    s += yw > 0.15 || (F.pose.talk ?? 0) > 0.12 ? mouthOf(F, { w: 3.2 }) : `<path d="M${n(ex + fx * 0.8 - 4.2)},${n(hy + 5.2 - sm * 0.8)} Q${n(ex + fx * 0.8)},${n(hy + 6.6 + sm * 3.4)} ${n(ex + fx * 0.8 + 4.4)},${n(hy + 5 - sm * 0.9)} Q${n(ex + fx * 0.8)},${n(hy + 6.2 + sm * 0.8)} ${n(ex + fx * 0.8 - 4.2)},${n(hy + 5.2 - sm * 0.8)} Z" fill="#fff8ec" stroke="#6a2430" stroke-width="0.9" stroke-linejoin="round"/>`;
    return s; },
  headFront(F) { const { hx, hy, fx, seed } = F; let s = ""; for (let i = 0; i < 8; i++) { const u = i / 7; s += `<circle cx="${n(lerp(hx - 8.8, hx + 9, u) + fx)}" cy="${n(hy - 10 - Math.sin(u * Math.PI) * 3.4 + jit(seed + i + 20, 0.7))}" r="${n(3 + hash(seed + i + 9) * 1.2)}" fill="#7a4a24" stroke="${INK}" stroke-width="0.8"/>`; } for (let i = 0; i < 5; i++) s += `<path d="M${n(hx - 6 + i * 3 + fx)},${n(hy - 12.4)} q1.2,-1.4 2.2,0" stroke="#b07a3c" stroke-width="0.6" fill="none"/>`; return s; },
};
export const EPIMETHEUS = {
  stand: { lean: 0, bend: 0, fx: 0.6, tilt: 0, hN: [-8, -82], hF: [13, -83], sN: "relax", sF: "relax", aN: 86, aF: 84, brow: 0.3, smile: 0.5 },
  delighted: { lean: -2, fx: 0.7, tilt: -5, hN: [-30, -112], hF: [38, -148], sN: "open", sF: "open", aN: -150, aF: -58, bN: -1, bF: -1, brow: 1, smile: 1, rise: 0.4 },
  yawn: { lean: -3, fx: 0.4, tilt: -12, hN: [10, -150], sN: "relax", aN: -76, bN: 1, hF: [36, -138], sF: "open", aF: -40, yawn: 1, brow: 0.4 },
  wave: { lean: 3, fx: 0.7, tilt: 4, hN: [-22, -176], sN: "open", aN: -112, bN: 1, hF: [14, -88], yawn: 0.5, brow: 0.2, swing: 5 },
  gripped: { lean: -2, fx: 0.2, tilt: 5, hN: [-14, -84], hF: [26, -112], sF: "relax", aF: 30, brow: 0.7, smile: 0.2 },
};
export const epimetheusPose = (a, b, u) => blendPose(EPIMETHEUS, a, b, u);
export const epimetheus = (c, st, t) => figure(c, st, K_EPIMETHEUS, EPIMETHEUS, t);

// ---------------------------------------------------------------- Hermes: travel hat, winged sandals, a grin that knows
const wing = (x, y, k, flip, seed, t = 0) => { let s = `<g transform="translate(${n(x)},${n(y)}) scale(${n(k * flip)},${k}) rotate(${n(Math.sin(t * 5 + seed) * 5)})">`; for (let i = 3; i >= 0; i--) { const a = -18 - i * 21, len = 9.6 - i * 1.1, [fx, fy] = rot2(len, 0, a), [cx, cy] = rot2(len * 0.5, -2.2, a); s += `<path d="M0,0 Q${n(cx)},${n(cy)} ${n(fx)},${n(fy)} Q${n(cx * 0.9 + 0.8)},${n(cy + 2.2)} 0.6,1.4 Z" fill="${i % 2 ? "#dfe8ff" : "#ffffff"}" stroke="${INK}" stroke-width="0.7" stroke-linejoin="round"/>`; } return s + `</g>`; };
const K_HERMES = { H: 180, w: 0.92, seed: 51, skin: "#dfa87c", skinS: "#b3764e", garment: "chiton", dress: "#f6efdc", dressS: "#c9bfd6", belt: "#7a3fd0", hem: 30, hemBand: "#7a3fd0", armW: 6, legW: 7.4, sleeve: false, rx: 9, ry: 11, chin: 1.08, stride: 19,
  foot: (o) => sandal("#8a5a2a")(o) + wing(o.x - 2.6, o.y - 5.6, 1, -1, o.far ? 2 : 1),
  back({ w, hipY, sw, seed }) { return `<path d="M${n(-9 * w)},${n(hipY - 52)} Q${n(-22 * w - sw * 2)},${n(hipY - 22)} ${n(-19 * w - sw * 4)},${n(hipY + 26)} Q${n(-12 * w)},${n(hipY + 30 + jit(seed, 1))} ${n(-5 * w)},${n(hipY + 22)} L${n(2 * w)},${n(hipY - 50)} Z" fill="#12936a" stroke="${INK}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${n(-12 * w)},${n(hipY - 40)} Q${n(-17 * w)},${n(hipY - 10)} ${n(-14 * w - sw * 3)},${n(hipY + 24)} M${n(-6 * w)},${n(hipY - 40)} Q${n(-9 * w)},${n(hipY - 6)} ${n(-8 * w - sw * 2)},${n(hipY + 22)}" stroke="#0a6a50" stroke-width="1.1" fill="none" stroke-linecap="round"/>`; },
  torso({ w }) { return `<path d="M${n(-10 * w)},-140 Q0,-131 ${n(10 * w)},-141 L${n(9.6 * w)},-134 Q0,-124.6 ${n(-10.4 * w)},-132 Z" fill="#12936a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><circle cx="${n(6.6 * w)}" cy="-137" r="1.9" fill="#f4b41c" stroke="${INK}" stroke-width="0.7"/>`; },
  headBack(F) { const { hx, hy, fx } = F; return `<path d="${blob(ring(hx - fx * 2.6, hy - 1, 10.4, 61, 11, 0.04, 1.05))}" fill="#a85a1c" stroke="${INK}" stroke-width="0.9"/>` + [0, 1, 2].map((i) => `<path d="M${n(hx - fx * 9.6)},${n(hy + 2 + i * 2.4)} q${n(-fx * 3)},1.6 ${n(-fx * 1.4)},4.4" stroke="#a85a1c" stroke-width="1.6" fill="none" stroke-linecap="round"/>`).join(""); },
  face(F) { const { hx, hy, ex, fx } = F, x = ex + fx * 0.8, y = hy + 6.2, sm = F.pose.smile ?? 0.8; let s = ear(F);
    const b = F.pose.brow ?? 0;   // one brow up: he knows something
    s += `<path d="M${n(ex - 7.2)},${n(hy - 5.2)} Q${n(ex - 4.6)},${n(hy - 6.6)} ${n(ex - 1.8)},${n(hy - 4.4)}" stroke="#6a3410" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M${n(ex + 1.9)},${n(hy - 6.4 - b)} Q${n(ex + 4.8)},${n(hy - 9.2 - b)} ${n(ex + 7.4)},${n(hy - 6.2 - b)}" stroke="#6a3410" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
    s += eyes({ ...F, open: F.open * 0.72 }, 3.3, 2.1, "#2a6a4a") + nose(F, "#a8683e");
    s += `<path d="M${n(x - 3.2)},${n(y + 0.3)} Q${n(x)},${n(y + 1.6 * sm)} ${n(x + 3.6)},${n(y - 1.9 * sm)} q0.9,-0.5 1.1,-1.6" stroke="#6a2430" stroke-width="1" fill="none" stroke-linecap="round"/>` + ((F.pose.talk ?? 0) > 0.12 ? mouthOf(F, { w: 2.6 }) : `<path d="M${n(x - 1)},${n(y + 0.9 * sm)} Q${n(x + 1.6)},${n(y + 0.4 * sm)} ${n(x + 3.2)},${n(y - 1.4 * sm)} Q${n(x + 1.4)},${n(y + 2.2 * sm)} ${n(x - 1)},${n(y + 0.9 * sm)} Z" fill="#fff8ec" stroke="#6a2430" stroke-width="0.6"/>`);
    return s; },
  headFront(F) { const { hx, hy, fx, seed, t } = F, by = hy - 8.4; let s = `<path d="M${n(hx - 8.4)},${n(by + 1)} q2,3.4 4.4,1.2 q2.2,2.6 4.6,0.4 q2.4,2.4 4.6,0 q1.6,1.6 3.4,-1" fill="#a85a1c" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
    // the petasos: a wide straw brim, a low crown, a cord, two small wings
    s += wing(hx - 7.6, by - 3.4, 0.86, -1, 3, t);
    s += `<path d="M${n(hx - 18)},${n(by + 1.4)} Q${n(hx - 1)},${n(by - 6.4)} ${n(hx + 19)},${n(by + 0.4 + fx)} Q${n(hx + 8)},${n(by + 4)} ${n(hx)},${n(by + 2.6)} Q${n(hx - 9)},${n(by + 4.6)} ${n(hx - 18)},${n(by + 1.4)} Z" fill="#f0c95a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M${n(hx - 8.6)},${n(by - 1.6)} Q${n(hx - 8)},${n(by - 11)} ${n(hx + 0.5)},${n(by - 11.6)} Q${n(hx + 8.6)},${n(by - 11)} ${n(hx + 9)},${n(by - 1.8)} Q${n(hx)},${n(by - 4.4)} ${n(hx - 8.6)},${n(by - 1.6)} Z" fill="#f0c95a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M${n(hx - 8.6)},${n(by - 2.6)} Q${n(hx)},${n(by - 5.6)} ${n(hx + 9)},${n(by - 2.9)}" stroke="#7a3fd0" stroke-width="1.6" fill="none"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${n(hx - 15 + i * 3.8)},${n(by + 0.6 - Math.sin(i / 8 * Math.PI) * 4)} l${n(1.6 + jit(seed + i, 0.6))},${n(1.6)}" stroke="#b8862a" stroke-width="0.5" stroke-linecap="round"/>`;
    return s + wing(hx + 7.8, by - 3.6, 0.9, 1, 4, t); },
};
export const HERMES = {
  stand: { lean: 0, bend: 0, fx: 0.6, tilt: 3, hN: [-5, -83], hF: [13, -85], sN: "relax", sF: "relax", aN: 86, aF: 82, brow: 1, smile: 0.8 },
  walk: { lean: 4, fx: 0.7, hN: [-8, -90], hF: [16, -94], swing: 10, smile: 0.8, brow: 1 },
  present: { lean: 5, bend: 6, fx: 0.8, tilt: 6, hN: [36, -112], sN: "open", aN: -18, flipHand: 1, hF: [-2, -94], sF: "relax", aF: 96, brow: 1.6, smile: 1 },
};
export const hermesPose = (a, b, u) => blendPose(HERMES, a, b, u);
export const hermes = (c, st, t) => figure(c, st, K_HERMES, HERMES, t);

// ---------------------------------------------------------------- insert people: a farmer who coughs, an old man who greys
const K_MAN = (kind, grey) => ({ H: kind === "old" ? 164 : 172, w: 1, seed: kind === "old" ? 71 : 83, skin: kind === "old" ? "#d9a680" : "#d49668", skinS: kind === "old" ? "#ad7656" : "#a66a44", garment: "chiton", dress: kind === "old" ? "#8a4fb8" : "#d98a2a", dressS: kind === "old" ? "#5e2f8a" : "#a85a1c", belt: "#3a2418", hem: kind === "old" ? 44 : 34, armW: 5.4, legW: 6.6, sleeve: true, rx: 9.4, ry: 11, chin: 1.04, foot: sandal("#3a2418"),
  headBack(F) { const hc = mix("#2a1c1c", "#f0ece4", grey), { hx, hy, fx } = F; return kind === "old" ? `<path d="${blob(ring(hx - fx * 3.4, hy + 0.4, 9.6, 5, 10, 0.06, 1))}" fill="${hc}" stroke="${INK}" stroke-width="0.9"/>` : `<path d="${blob(ring(hx - fx * 2.6, hy - 1.6, 10.4, 6, 11, 0.05, 1.05))}" fill="#2a1c1c" stroke="${INK}" stroke-width="0.9"/>`; },
  face(F) { const { hx, hy, ex, fx, seed } = F, hc = mix("#2a1c1c", "#f0ece4", grey), cg = F.pose.squint ?? 0; let s = ear(F) + brows(F, kind === "old" ? hc : "#2a1c1c", 1.5, 0.2, cg * -1) + eyes(F, 2.9, 2.0) + nose(F, "#9a6244");
    if (kind === "old") { for (let i = 0; i < 3; i++) s += `<path d="M${n(ex - 6 + i * 0.4)},${n(hy - 9.4 - i * 1.5)} q6,${n(-1 - grey)} 12,0" stroke="#ad7656" stroke-width="0.5" fill="none" opacity="${n(0.25 + 0.75 * grey)}"/>`; s += `<path d="M${n(ex - 7)},${n(hy + 1.6)} q1.4,1 0.6,2.6 M${n(ex + 7)},${n(hy + 1.6)} q-1.2,1 -0.4,2.6" stroke="#ad7656" stroke-width="0.55" fill="none" opacity="${n(0.2 + 0.8 * grey)}"/>`;
      const jw = [[-8, 3], [-7, 9], [-5, 13], [-3.4, 12], [-1.6, 16.5 + grey * 2], [0.4, 14], [2.2, 17 + grey * 3], [3.8, 13], [5.6, 14], [7, 9], [8, 3], [4, 5.4], [0, 4.4], [-4, 5.4]]; s += `<path d="${P2(jw.map(([a, b], i) => [ex + fx * 0.6 + a + jit(seed + i, 0.3), hy + b]))} Z" fill="${hc}" stroke="${INK}" stroke-width="0.9" stroke-linejoin="round"/>`;
      for (let i = 0; i < 7; i++) s += `<path d="M${n(ex - 5 + i * 1.7)},${n(hy + 7.4)} l${n(jit(seed + i, 0.6))},${n(3 + hash(seed + i) * 3)}" stroke="${hash(seed + i * 3) < grey ? "#ffffff" : mix("#2a1c1c", "#8a8490", grey)}" stroke-width="0.5" stroke-linecap="round"/>`; }
    return s + mouthOf(F, { w: 2.4 }); },
  headFront(F) { const { hx, hy, fx, seed } = F, hc = mix("#2a1c1c", "#f0ece4", grey);
    if (kind === "old") { let s = `<path d="M${n(hx - 9.4)},${n(hy + 2)} q-1.6,-6 1.4,-9.4 q1.4,3 0.6,8 Z M${n(hx + 9.4)},${n(hy + 1)} q1.6,-6 -1.2,-9 q-1.4,3 -0.6,7.6 Z" fill="${hc}" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`; for (let i = 0; i < 6; i++) s += `<path d="M${n(hx - 5 + i * 2.2)},${n(hy - 11.6 + Math.abs(i - 2.5) * 0.5)} q${n(fx * 1.6)},-1.4 ${n(fx * 3)},0.2" stroke="${hash(seed + i * 5) < grey ? "#ffffff" : mix("#2a1c1c", "#8a8490", grey)}" stroke-width="0.6" fill="none" stroke-linecap="round"/>`; return s; }
    return `<path d="M${n(hx - 17)},${n(hy - 6.6)} Q${n(hx)},${n(hy - 12.6)} ${n(hx + 18)},${n(hy - 7)} Q${n(hx + 8)},${n(hy - 4.6)} ${n(hx)},${n(hy - 5.6)} Q${n(hx - 9)},${n(hy - 4.2)} ${n(hx - 17)},${n(hy - 6.6)} Z" fill="#f0c95a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/><path d="M${n(hx - 8.4)},${n(hy - 9.4)} Q${n(hx - 6)},${n(hy - 19)} ${n(hx + 0.6)},${n(hy - 19.4)} Q${n(hx + 7)},${n(hy - 19)} ${n(hx + 8.8)},${n(hy - 9.6)} Q${n(hx)},${n(hy - 12)} ${n(hx - 8.4)},${n(hy - 9.4)} Z" fill="#f0c95a" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/>` + [0, 1, 2, 3, 4, 5].map((i) => `<path d="M${n(hx - 12 + i * 4.6)},${n(hy - 8.6 - Math.sin(i / 5 * Math.PI) * 2.4)} l1.8,1.5" stroke="#b8862a" stroke-width="0.5"/>`).join(""); },
});
const MAN = { stand: { lean: 0, bend: 0, fx: 0.6, tilt: 0, hN: [-5, -83], hF: [13, -85], sN: "relax", sF: "relax", aN: 86, aF: 82, brow: 0 } };
export function insertMan(c, st, t = 0) {
  const kind = st.kind || "farmer", cough = clamp(st.cough ?? 0), grey = clamp(st.grey ?? 0), jolt = cough * (0.75 + 0.25 * Math.sin(t * 26));
  const pose = kind === "old" ? { bend: 4 + grey * 13, tilt: grey * 6, hN: [lerp(-10, 22, grey), lerp(-88, -96, grey)], aN: lerp(86, 70, grey), brow: grey * 0.8, crouch: grey * 3 }
    : { bend: jolt * 17, tilt: jolt * 8, hN: [lerp(-10, 17, cough), lerp(-88, -146 + jolt * 9, cough)], sN: cough > 0.5 ? "grip" : "relax", aN: lerp(86, -66, cough), bN: 1, hF: [lerp(14, 12, cough), lerp(-92, -112, cough)], squint: cough, brow: -cough, talk: cough * 0.5, crouch: jolt * 3 };
  const r = figure(c, { ...st, pose: { ...pose, ...(typeof st.pose === "object" ? st.pose : {}) } }, K_MAN(kind, grey), MAN, t);
  if (kind === "farmer" && cough > 0.3 && r.lips) for (let i = 0; i < 3; i++) r.svg += `<path d="M${n(r.lips.x + (st.dir ?? 1) * (0.1 + i * 0.03) * r.lips.s)},${n(r.lips.y + (i - 1) * 0.045 * r.lips.s)} l${n((st.dir ?? 1) * 0.06 * r.lips.s)},${n((i - 1) * 0.022 * r.lips.s)}" stroke="${M.wallL}" stroke-width="${n(0.012 * r.lips.s)}" stroke-linecap="round" opacity="${n(0.4 + 0.5 * jolt)}"/>`;
  return r;
}

// ================================================================ the evils: ink-black, no face, no mouth, no sound
// Built from torn wing shapes and smoke: nothing round that could be an eye, nothing that opens. A thin silver edge on
// the side of the jar's light is all that separates them from the dark. They glide: slow beats, long tails.
const anchor = (c, st) => (st.at ? { x: st.at.x, y: st.at.y, s: st.s ?? st.at.s ?? 250 } : P(c, st.X, st.Y ?? 0, st.Z));
const ribbonPts = (N, step, amp, wMax, t, seed, sp) => { const c0 = Array.from({ length: N }, (_, i) => [12 - i * step, Math.sin(t * sp + seed * 1.7 + i * 0.62) * amp * (0.25 + i / N) + Math.sin(i * 1.3 + seed) * amp * 0.3]), w = (i) => wMax * Math.sin((i + 0.7) / (N + 0.4) * Math.PI) ** 0.6; return { c0, out: [...c0.map(([x, y], i) => xy(x, y - w(i))), ...c0.slice().reverse().map(([x, y], i) => xy(x, y + w(N - 1 - i)))] }; };
const tail = (len, wid, seed, t, k = 3) => { let s = ""; for (let i = 0; i < k; i++) { const off = (i - (k - 1) / 2) * wid * 0.5, L1 = len * (0.7 + 0.5 * hash(seed + i * 3)), w1 = Math.sin(t * 1.3 + seed + i * 1.9) * wid * 0.6, w2 = Math.sin(t * 1.1 + seed * 2 + i) * wid; s += `<path d="M0,${n(off - wid * 0.22)} Q${n(-L1 * 0.45)},${n(off + w1 - wid * 0.2)} ${n(-L1)},${n(off * 2 + w2)} Q${n(-L1 * 0.5)},${n(off + w1 + wid * 0.16)} 0,${n(off + wid * 0.22)} Z"/>`; } return s; };
const FORE = [[8, 0], [15, -9], [11, -29], [2, -38], [-4, -31], [-1, -24], [-8, -26], [-5, -17], [-11, -15], [-6, 0]], HIND = [[-5, 0], [-9, -12], [-14, -23], [-20, -19], [-17, -12], [-23, -10], [-18, -4], [-21, 0]];
export function evil(c, st, t = 0) {
  const a = anchor(c, st), kind = st.kind || "moth", seed = st.seed ?? 1, k = a.s / 100 * (st.size ?? 1), sq = 1 - clamp(st.squeeze ?? 0) * 0.78, dir = st.dir ?? -30;
  const flap = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.5 + seed * 2.3)), flipY = Math.cos(dir * Math.PI / 180) < 0 ? -1 : 1;
  let body = "", edge = "", extra = "";
  if (kind === "moth" || kind === "sick") {   // seen from above: four torn wings on a thin body, a smoke tail. No head to speak of.
    const wing = (W_, sd, f, sy) => P2(W_.map(([x, y], i) => [x + jit(seed + sd + i * 1.3, 1.2), y * f * sy + jit(seed + sd + i * 1.7, 1.1) * (i && i < W_.length - 1 ? 1 : 0)])) + " Z";
    body = wing(FORE, 0, flap, 1) + " " + wing(FORE, 20, flap * (0.9 + 0.1 * hash(seed)), -1) + " " + wing(HIND, 40, flap, 1) + " " + wing(HIND, 60, flap, -1);
    body = `<path d="${body}" stroke-linejoin="round"/><path d="M15,0 Q4,-2.6 -22,-1 Q-27,0 -22,1.2 Q4,2.6 15,0 Z"/><g transform="translate(-22,0)">${tail(44, 5, seed, t, 3)}</g><path d="M14,-0.6 q7,-2 10,-8 M14,0.6 q7,2.4 11,7" fill="none" stroke-width="0.9" stroke-linecap="round"/>`;
    edge = `<path d="${P2(FORE.slice(0, 5).map(([x, y]) => [x, y * flap]))}"/><path d="${P2(HIND.slice(1, 4).map(([x, y]) => [x, y * flap]))}"/>`;
    if (kind === "sick") { for (let i = 0; i < 12; i++) { const sy = i % 2 ? 1 : -1, u = hash(seed + i * 2.1), v = hash(seed + i * 3.7); extra += `<path d="${blob(ring(8 - u * 20, sy * (5 + v * 24) * flap, 1 + hash(seed + i) * 1.8, seed + i, 5, 0.4, 0.7))}" fill="${i % 3 ? "#8fa38a" : "#c5cf9a"}"/>`; } extra += `<path d="M-6,${n(-26 * flap)} q-5,-2 -9,2 M-8,${n(25 * flap)} q-6,1 -8,6 M-18,${n(-12 * flap)} q-5,0 -7,4" stroke="#8fa38a" stroke-width="1" fill="none" stroke-linecap="round"/>`; }   // fever dust on the wings, drips off the edges
  } else if (kind === "toil") {   // a bent, heavy shape under a yoke: a load with nobody carrying it, dragging its hem
    const sag = Math.sin(t * 0.9 + seed) * 1.5, hem = Array.from({ length: 9 }, (_, i) => [22 - i * 7, 16 + (i % 2 ? 9 + hash(seed + i) * 7 : 1) + sag * (i % 2)]);
    body = `<path d="${P2([[24, 10], [25, -6], [18, -22], [4, -31], [-12, -30], [-25, -20], [-33, -4], [-36, 12], ...hem.slice().reverse()])} Z" stroke-linejoin="round"/><path d="M-34,10 Q-56,13 -78,${n(22 + sag)} Q-96,26 -112,${n(24 - sag)} Q-92,30 -72,29 Q-50,28 -30,20 Z"/>`;
    body += `<path d="M34,-30 Q0,-47 -40,-27" fill="none" stroke-width="5" stroke-linecap="round"/><path d="M33,-30 l1,22 M-39,-27 l-1,24" fill="none" stroke-width="1.6"/><path d="${blob(ring(34, -3, 6.5, seed + 3, 7, 0.2))}"/><path d="${blob(ring(-40, 2, 7.5, seed + 5, 7, 0.2))}"/>`;
    edge = `<path d="M33,-31 Q0,-48 -40,-28"/><path d="M24,-8 Q20,-22 5,-31"/>`;
    for (let i = 0; i < 5; i++) extra += `<path d="M${n(-24 + i * 10)},${n(-20 + Math.abs(i - 2) * 3)} q${n(2 + jit(seed + i, 1))},12 ${n(-1)},${n(26 + (i % 2) * 6)}" stroke="#1c2a52" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  } else if (kind === "age") {   // a slow wisp the colour of ash, shedding flakes
    const R = ribbonPts(15, 9.5, 8, 2.7, t, seed, 0.6);
    body = `<path d="${blob(R.out)}" stroke-width="2.4"/>`;
    extra = `<path d="${blob(R.out)}" fill="#e4dfd4"/><path d="${smooth(R.c0.slice(1, 12).map(([x, y]) => xy(x, y + 0.6)))}" stroke="#a9a498" stroke-width="1" fill="none" stroke-linecap="round"/><path d="${smooth(R.c0.slice(1, 8).map(([x, y]) => xy(x, y - 0.9)))}" stroke="#ffffff" stroke-width="0.7" fill="none" stroke-linecap="round"/>`;
    for (let i = 0; i < 9; i++) { const ph = (t * 0.2 + hash(seed + i * 2.9)) % 1, x = -20 - hash(seed + i * 1.3) * 90 - ph * 12, y = R.c0[6][1] * 0.5 + jit(seed + i, 5) + ph * 22; extra += `<path d="M${n(x)},${n(y)} l${n(1.8 + hash(seed + i) * 1.8)},${n(1)} l-1.2,1.6 Z" fill="#e4dfd4" opacity="${n(1 - ph)}"/>`; }
  } else {   // "smoke": a tapering ribbon of ink
    const R = ribbonPts(10, 9, 6, 4.2, t, seed, 1.1);
    body = `<path d="${blob(R.out)}"/>`;
    edge = `<path d="${smooth(R.out.slice(0, 6))}"/>`;
  }
  return `<g transform="translate(${n(a.x)},${n(a.y)}) rotate(${n(dir)}) scale(${n(k * 1000) / 1000},${n(k * sq * flipY * 1000) / 1000})"><g fill="${VOID}" stroke="${VOID}" stroke-width="1.4">${body}</g>${extra}<g fill="none" stroke="${SILVER}" stroke-width="${n(Math.max(0.7, 1 / Math.max(0.4, k)))}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${n(9 + hash(seed) * 8)} ${n(3 + hash(seed + 1) * 4)}" opacity="${n(st.edge ?? 0.85)}">${edge}</g></g>`;
}
// the swarm leaving the jar. Each one has its own start, its own arc, its own speed; all of it from (t, out, seed).
export function swarm(c, t, st = {}) {
  const a = anchor(c, st), count = st.count ?? 14, spread = st.spread ?? 60, out = clamp(st.out ?? 1), seed = st.seed ?? 1, aim = st.aim ?? 0, reach = (st.reach ?? 2.6) * a.s, kinds = st.kinds || ["moth", "smoke", "moth", "smoke", "sick", "moth", "age", "smoke", "toil"];
  const list = [];
  for (let i = 0; i < count; i++) {
    const d0 = hash(seed * 7 + i * 1.37) * 0.72, u = clamp((out - d0) / 0.28); if (u <= 0) continue;
    const kind = kinds[i % kinds.length], slow = kind === "age" ? 0.55 : kind === "toil" ? 0.7 : 1, ang = (aim + jit(seed + i * 2.3, spread) - 90) * Math.PI / 180;
    const drift = t * (0.03 + 0.04 * hash(seed + i * 5.1)) * slow, pr = Math.min(1.25, ease(u, "out") * (0.35 + 0.65 * hash(seed + i * 3.9)) + drift), R = reach * pr * slow;
    const curl = Math.sin(pr * 3 + i) * 0.35 * R * 0.3, x = a.x + Math.cos(ang) * R - Math.sin(ang) * curl + Math.sin(t * 0.6 + i * 1.7) * 0.05 * a.s, y = a.y + Math.sin(ang) * R * (kind === "toil" ? 0.35 : 1) + Math.cos(ang) * curl + (kind === "toil" ? 0.5 * a.s * pr : 0) + Math.cos(t * 0.5 + i * 2.3) * 0.04 * a.s;
    const head = Math.atan2(Math.sin(ang) * (kind === "toil" ? 0.2 : 1) + Math.cos(pr * 3 + i) * 0.3, Math.cos(ang)) * 180 / Math.PI;
    list.push({ pr, svg: evil(c, { at: { x, y }, s: a.s, kind, seed: seed * 3 + i, size: (0.55 + 0.75 * hash(seed + i * 6.7)) * (0.35 + 0.65 * clamp(u * 1.6)) * (st.size ?? 1), dir: head, squeeze: 1 - clamp(u * 2.2), edge: 0.85 + 0.15 * clamp(1.2 - pr) }, t) });
  }
  return list.sort((p, q) => q.pr - p.pr).map((o) => o.svg).join("");
}

// ================================================================ props
// the gods' gifts. u 0..1 = it arrives (drops / lands at the lips).
export function gift(kind, st = {}, t = 0) {
  const a = st.at, s = st.s ?? a.s ?? 300, k = s / 100, u = clamp(st.u ?? 1), e = ease(u, "back");
  if (kind === "dress") {   // Athena: the pale dress with the gold border, held up by its two shoulder pins
    const sway = Math.sin(t * 2.2) * 2.2 * (0.4 + (1 - u));
    let s2 = `<g transform="translate(${n(a.x)},${n(a.y - (1 - e) * 60 * k)}) scale(${n(k)}) rotate(${n(sway * 0.5)})">`;
    s2 += `<path d="M-10,0 Q0,7 10,0 Q13,26 ${n(11 + sway * 0.3)},44 Q${n(17 + sway)},86 ${n(19 + sway * 1.6)},128 Q${n(8 + sway)},133 ${n(sway)},131 Q${n(-10 + sway)},134 ${n(-18 + sway * 1.4)},128 Q${n(-15 + sway * 0.6)},86 -11,44 Q-13,24 -10,0 Z" fill="#f6efdc" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
    s2 += `<path d="M-10,2 Q-13,24 -11,44 Q${n(-15 + sway * 0.6)},86 ${n(-17.4 + sway * 1.4)},127 L${n(-10 + sway)},130 Q-9,80 -6,44 Q-8,22 -5,4 Z" fill="#cfc3d8"/>`;
    s2 += `<path d="M-12.4,38 Q0,42 12.6,37 L13.4,44 Q0,49.4 -13,45 Z" fill="#f4b41c" stroke="${INK}" stroke-width="0.8"/><path d="M${n(-18 + sway * 1.4)},121 Q0,126 ${n(19 + sway * 1.6)},121 L${n(19 + sway * 1.6)},128 Q${n(8 + sway)},133 ${n(sway)},131 Q${n(-10 + sway)},134 ${n(-18 + sway * 1.4)},128 Z" fill="#f4b41c" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`;
    for (let i = 0; i < 10; i++) s2 += `<path d="M${n(-15 + i * 3.6 + sway * 1.3)},${n(127.6 - Math.abs(i - 4.5) * 0.3)} l0,-2.6 l2,0 l0,1.5" stroke="#8a4a12" stroke-width="0.6" fill="none"/>`;
    for (const [i, x] of [-5, -1, 3.4, 7.4].entries()) s2 += `<path d="M${n(x)},${n(50 + i * 3)} Q${n(x * 1.5 + sway * 0.5)},90 ${n(x * 1.9 + sway * 1.3 + jit(i + 3, 1))},${n(118 - hash(i) * 6)}" stroke="#cfc3d8" stroke-width="1" fill="none" stroke-linecap="round"/>`;
    for (const sx of [-9.4, 9.6]) s2 += `<circle cx="${sx}" cy="0.6" r="2.2" fill="#f4b41c" stroke="${INK}" stroke-width="0.8"/><path d="M${sx},-1.6 L${n(sx * 1.2)},-16" stroke="${SILVER}" stroke-width="0.7"/>`;
    return s2 + `</g>`;
  }
  if (kind === "smile") {   // Aphrodite: a rose curve that settles on her lips, three hand-cut sparks
    let s2 = `<path d="M${n(a.x - 0.032 * s)},${n(a.y - 0.006 * s)} Q${n(a.x)},${n(a.y + 0.024 * s * e)} ${n(a.x + 0.036 * s)},${n(a.y - 0.012 * s)}" stroke="#ff4f8a" stroke-width="${n(0.009 * s)}" fill="none" stroke-linecap="round"/>`;
    for (const [i, dx, dy, r] of [[0, 0.12, -0.1, 0.05], [1, 0.19, 0.0, 0.03], [2, 0.09, 0.1, 0.022], [3, -0.1, -0.08, 0.026]]) { const tw = 0.6 + 0.4 * Math.sin(t * 5 + i * 2.1), rr = r * s * e * tw, x = a.x + dx * s * e, y = a.y + dy * s * e; s2 += `<path d="M${n(x)},${n(y - rr * 1.5)} L${n(x + rr * 0.32)},${n(y - rr * 0.3)} L${n(x + rr * 1.3)},${n(y + rr * 0.1)} L${n(x + rr * 0.3)},${n(y + rr * 0.36)} L${n(x - rr * 0.1)},${n(y + rr * 1.4)} L${n(x - rr * 0.34)},${n(y + rr * 0.3)} L${n(x - rr * 1.2)},${n(y - rr * 0.1)} L${n(x - rr * 0.3)},${n(y - rr * 0.32)} Z" fill="${i % 2 ? "#ff9ac0" : "#fff3b0"}" stroke="#ff4f8a" stroke-width="${n(Math.max(0.6, 0.004 * s))}" stroke-linejoin="round"/>`; }
    return s2;
  }
  // "tongue": Hermes' gift. A forked silver wisp that slips in at her lips: a ribbon of smoke, never flesh.
  const len = 0.34 * s * (1 - u * 0.72), wv = (i) => Math.sin(t * 3.2 + i * 1.1) * 0.014 * s * (i / 5), pts = Array.from({ length: 7 }, (_, i) => [a.x + i / 6 * len, a.y + wv(i) - (i / 6) ** 2 * 0.05 * s]), w = (i) => 0.014 * s * (0.5 + 0.5 * Math.sin((i + 0.6) / 6.4 * Math.PI));
  const end = pts[6], pa = pts[5], dx = end[0] - pa[0], dy = end[1] - pa[1], l = Math.hypot(dx, dy) || 1, f = 0.07 * s;
  const d = "M" + pts.map(([x, y], i) => `${n(x)},${n(y - w(i))}`).join(" L") + ` L${n(end[0] + dx / l * f - dy / l * f * 0.55)},${n(end[1] + dy / l * f + dx / l * f * 0.55 - f * 0.9)} L${n(end[0] + dx / l * f * 0.2)},${n(end[1])} L${n(end[0] + dx / l * f + dy / l * f * 0.3)},${n(end[1] + dy / l * f + f * 0.55)} L` + pts.slice().reverse().map(([x, y], i) => `${n(x)},${n(y + w(6 - i))}`).join(" L") + " Z";
  return `<path d="${d}" fill="#dfe6ff" stroke="#3a3f7a" stroke-width="${n(Math.max(1, 0.006 * s))}" stroke-linejoin="round"/><path d="M${pts.slice(0, 6).map(([x, y]) => `${n(x)},${n(y - 0.003 * s)}`).join(" L")}" stroke="#ffffff" stroke-width="${n(0.005 * s)}" fill="none" stroke-linecap="round"/><path d="M${n(pts[2][0])},${n(pts[2][1] + 0.012 * s)} L${n(pts[4][0])},${n(pts[4][1] + 0.012 * s)}" stroke="#8a90d0" stroke-width="${n(0.005 * s)}" stroke-linecap="round"/>`;
}
// Prometheus' fennel stalk: fire carried in its hollow. Origin = the hand.
export function fennel(c, st = {}, t = 0) {
  const a = anchor(c, st), k = a.s / 100, em = clamp(st.ember ?? 1), fk = em * (0.8 + 0.2 * hash(Math.floor(t * 12) * 3.1 + 5)), len = st.len ?? 120, g = st.grip ?? 40, y1 = g - len;
  let s = `<g transform="translate(${n(a.x)},${n(a.y)}) rotate(${n(st.rot ?? 8)}) scale(${n(k * 1000) / 1000})">`;
  const d = `M0,${g} Q-2,${n(lerp(g, y1, 0.5))} 1,${y1}`;
  s += stroke(d, INK, 6.6) + stroke(d, "#9ab83a", 5) + stroke(d, "#5a7a1c", 1.4, `transform="translate(1.5,0)"`);
  for (let i = 1; i < 6; i++) { const y = lerp(g, y1, i / 6) + jit(i + 0.3, 2); s += `<path d="M-3.2,${n(y)} q3,1.6 6.4,-0.4" stroke="#5a7a1c" stroke-width="1.3" fill="none"/>`; if (i % 2) s += `<path d="M${i % 4 === 1 ? 3 : -3},${n(y)} q${i % 4 === 1 ? 9 : -9},-4 ${i % 4 === 1 ? 12 : -12},-14" stroke="#7a9a2a" stroke-width="1.3" fill="none" stroke-linecap="round"/>`; }
  s += `<path d="M-3.6,${y1 + 1} L4.4,${y1 - 0.6} L3.6,${y1 - 7} L-2.8,${y1 - 6} Z" fill="#1c1418" stroke="${INK}" stroke-width="1"/>`;   // the charred mouth of the stalk
  if (fk > 0.03) s += `<g transform="translate(0.6,${y1 - 6}) rotate(${n(Math.sin(t * 9) * 5)}) scale(${n(0.7 + fk * 0.6)})"><path d="M-3.4,0 Q-5.6,-7 -0.4,-15 Q1,-10 4,-12 Q5.4,-5 3.4,0 Z" fill="#ff5a1f" stroke="#a8281a" stroke-width="0.7" stroke-linejoin="round"/><path d="M-1.8,-0.4 Q-2.4,-5 0.4,-9 Q2.4,-5 1.8,-0.4 Z" fill="${HOPE.flame}"/></g><circle cx="0.4" cy="${y1 - 4}" r="2.2" fill="${HOPE.core}"/>`;
  s += `</g>`;
  const [fx, fy] = rot2(0.6, y1 - 8, st.rot ?? 8), fp = { x: a.x + fx * k, y: a.y + fy * k, s: a.s };
  return { svg: s, light: lightBlobs(fp, [0.9, 0.5, 0.22, 0.08], "#ff8a2a", [0.07 * fk, 0.1 * fk, 0.17 * fk, 0.5 * fk], 7 + Math.floor(t * 6) % 3), flame: fp };
}
// a camera that puts a cast member at a screen point: at2d(x, y, pxPerMetre) -> { c, X, Z } (spread into the cast call)
export const at2d = (x, y, s) => ({ c: { x: 0, y: 0, z: 0, f: s, h0: y }, X: (x - W / 2) / s, Z: 1 });

// ================================================================ (b) Olympus: Zeus is the storm
const bank = (pts, seed, fill, dx = 0, dy = 0, grow = 1) => pts.map(([x, y, r], i) => `<path d="${blob(ring(x + dx, y + dy, r * grow, seed + i * 7, 11, 0.1, 0.86))}" fill="${fill}"/>`).join("");
const cloud = (pts, seed, col, lit, rim = 1) => bank(pts, seed, lit, -9 * rim, -12 * rim, 1.03) + bank(pts, seed, col);
function bolt(x0, y0, x1, y1, seed, w) {
  const N = 7, a = [[x0, y0]]; for (let i = 1; i < N; i++) { const u = i / N; a.push([lerp(x0, x1, u) + jit(seed + i * 3.1, 46) * (i % 2 ? 1 : -0.6), lerp(y0, y1, u) + jit(seed + i * 1.7, 18)]); } a.push([x1, y1]);
  const L_ = a.map(([x, y], i) => [x - w * (1 - i / N) - 1, y]), R_ = a.map(([x, y], i) => [x + w * (1 - i / N) * (i % 2 ? 1.5 : 0.7) + 1, y + (i % 2 ? 9 : -5)]);
  const br = a[3], fork = `M${n(br[0])},${n(br[1])} L${n(br[0] + jit(seed, 30) + 70)},${n(br[1] + 70)} L${n(br[0] + 60)},${n(br[1] + 160)} L${n(br[0] + 58)},${n(br[1] + 84)} Z`;
  return P2([...L_, ...R_.reverse()]) + " Z " + fork;
}
// the face alone. Everything is cloud: brows, cheeks, moustache, beard. The eyes and the grin are gaps the lightning shows through.
export function zeus(t, st = {}) {
  const lg = clamp(st.laugh ?? 0), fl = clamp(st.flash ?? 0.3), look = st.look ?? 0, cx = st.x ?? 540, cy = st.y ?? 900, k = st.k ?? 1;
  const shake = Math.sin(t * 19) * 7 * lg, drop = lg * 150 + shake, D = mix("#241068", "#3a1c9a", fl), Lt = mix("#6a3fe0", "#efe6ff", fl), D2 = mix("#1a0a4e", "#2a1478", fl), hot = mix("#ffe21a", "#fffbd8", 0.3 + 0.7 * fl), gapC = mix("#7a52f0", "#fff7c0", 0.25 + 0.75 * fl);
  let s = `<g transform="translate(${n(cx)},${n(cy + shake * 0.4)}) scale(${k})">`;
  // what shows through the face: one lit sheet behind the eyes and the mouth
  const mo = lerp(30, 250, ease(lg)), mw = lerp(300, 330, lg), my = 196 - lg * 20;
  s += `<path d="M${-mw},${n(my - 10 - lg * 40)} Q0,${n(my + 120 - lg * 40)} ${mw},${n(my - 30 - lg * 40)} Q${mw + 30},${n(my + mo * 0.5)} ${n(mw * 0.5)},${n(my + 60 + mo)} Q0,${n(my + 90 + mo)} ${n(-mw * 0.5)},${n(my + 64 + mo)} Q${-mw - 30},${n(my + mo * 0.5)} ${-mw},${n(my - 10 - lg * 40)} Z" fill="${gapC}"/>`;
  s += `<path d="M${n(-mw * 0.7)},${n(my + mo * 0.75 + 40)} Q0,${n(my + mo + 96)} ${n(mw * 0.7)},${n(my + mo * 0.75 + 36)} Q0,${n(my + mo * 0.5 + 60)} ${n(-mw * 0.7)},${n(my + mo * 0.75 + 40)} Z" fill="${mix(gapC, "#ff4fa0", 0.5)}" opacity="${n(lg * 0.9)}"/>`;
  // teeth: a row of uneven blocks hanging from the moustache, cut by hand
  for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, x = lerp(-mw * 0.8, mw * 0.8, u), yT = my + 78 * Math.sin(u * Math.PI) - lg * 40 - 26, wT = mw * 0.166, hT = (34 + 22 * hash(i + 3.3)) * (0.5 + 0.5 * lg) + 16; s += `<path d="M${n(x - wT / 2 + 2)},${n(yT)} L${n(x + wT / 2 - 2)},${n(yT + jit(i, 3))} L${n(x + wT / 2 - 5 + jit(i + 1, 2))},${n(yT + hT)} Q${n(x)},${n(yT + hT + 7)} ${n(x - wT / 2 + 4)},${n(yT + hT - 2)} Z" fill="${mix("#cdbcff", "#ffffff", 0.3 + 0.7 * fl)}" stroke="${D2}" stroke-width="3" stroke-linejoin="round"/>`; }
  // the cloud of him
  const hair = [[-430, -330, 150], [-250, -400, 170], [-40, -440, 180], [190, -410, 170], [400, -330, 150], [-520, -160, 130], [520, -150, 130], [-560, 40, 120], [560, 60, 120], [-100, -280, 150], [130, -270, 150]];
  s += cloud(hair, 11, D, Lt);
  s += cloud([[-520, 200, 120], [-470, 360 + drop * 0.3, 120], [520, 220, 120], [470, 380 + drop * 0.3, 120]], 15, D2, D, 0.6);
  // beard: drops with the laugh; its tails stream down as rain
  const by = my + mo + 150 + shake, beard = [[-330, by - 40, 110], [-190, by + 30, 120], [-30, by + 60, 130], [140, by + 40, 120], [310, by - 30, 110], [-220, by + 170, 100], [-60, by + 220, 110], [110, by + 190, 100], [250, by + 120, 90], [-110, by + 350, 80], [40, by + 400, 76], [-20, by + 500, 54]];
  s += cloud(beard, 21, D, Lt);
  for (let i = 0; i < 16; i++) { const x = -300 + hash(i + 0.7) * 620, y = by + 150 + hash(i + 2.7) * 330, len = 90 + hash(i + 4.7) * 150; s += `<path d="M${n(x)},${n(y)} q${n(-12 + jit(i, 6))},${n(len * 0.5)} ${n(-30)},${n(len)}" stroke="${i % 3 ? D : Lt}" stroke-width="${n(5 + hash(i + 6.7) * 9)}" stroke-linecap="round" fill="none" opacity="0.85"/>`; }
  // cheeks push up when he laughs; nose; moustache
  for (const sd of [-1, 1]) s += cloud([[sd * 300, 96 - lg * 30, 104], [sd * 390, 40 - lg * 30, 84]], 31 + sd, D, Lt);
  s += cloud([[0, -10, 52], [6, 60, 60], [-36, 118, 44], [44, 116, 46], [4, 124, 50]], 41, D, Lt);
  for (const sd of [-1, 1]) s += cloud([[sd * 70, 168 - lg * 34, 60], [sd * 170, 190 - lg * 46, 58], [sd * 268, 214 - lg * 60, 50], [sd * 350, 250 - lg * 70, 38], [sd * 410, 290 - lg * 70, 24]], 51 + sd * 3, D, Lt);
  for (const sd of [-1, 1]) { const ex = sd * 196, ey = -48 - lg * 14, w = 92, h = lerp(40, 34, lg), low = lerp(h * 0.5, -h * 0.55, lg); s += `<path d="M${n(ex - w)},${n(ey + 12 * sd * (1 - lg))} Q${n(ex)},${n(ey - h * lerp(1.5, 2.3, lg))} ${n(ex + w)},${n(ey - 12 * sd * (1 - lg))} Q${n(ex)},${n(ey + low)} ${n(ex - w)},${n(ey + 12 * sd * (1 - lg))} Z" fill="${hot}"/>`; if (lg < 0.7) s += `<path d="${blob(ring(ex + look * 34, ey - 6, 21 * (1 - lg * 0.6), sd + 5, 8, 0.12, 1.05))}" fill="${D2}"/><path d="${blob(ring(ex + look * 34 + 5, ey - 11, 6, sd + 8, 6, 0.15))}" fill="${hot}"/>`; }
  // brows: heavy, one cocked; they lift apart when he roars
  s += cloud([[-340, -150 - lg * 50, 50], [-250, -160 - lg * 64, 58], [-150, -138 - lg * 56, 54], [-70, -104 - lg * 40, 44]], 61, D2, Lt) + cloud([[350, -190 - lg * 30, 48], [260, -196 - lg * 36, 58], [160, -160 - lg * 40, 54], [78, -118 - lg * 30, 44]], 67, D2, Lt);
  return s + `</g>`;
}
export function stormSky(c, t, st = {}) {
  const fl = clamp(st.flash ?? 0.3), ox = -(c?.x ?? 0) * 60, oy = ((c?.y ?? 0)) * 40, zk = 1 + (c?.z ?? 0) * 0.1;
  let s = `<rect width="${W}" height="${H}" fill="${mix("#0e0530", "#2a1280", fl)}"/>`;
  for (const [y, col] of [[0, mix("#160844", "#3a1ca0", fl)], [520, mix("#22106a", "#5a34d0", fl)], [1100, mix("#3a1a8a", "#8a5cf0", fl)]]) s += `<path d="M0,${y + 260} ${Array.from({ length: 7 }, (_, i) => `Q${i * 180 + 90},${n(y + 200 + jit(y + i, 60))} ${i * 180 + 180},${n(y + 260 + jit(y + i + 9, 30))}`).join(" ")} L1080,${y + 700} L0,${y + 700} Z" fill="${col}"/>`;
  // far cloud decks drifting
  for (let i = 0; i < 6; i++) { const y = 120 + i * 260 + 60 * hash(i + 1.2), x = ((hash(i + 3.4) * 1400 + t * (6 + 5 * hash(i))) % 1700) - 300; s += bank([[x, y, 90], [x + 120, y - 30, 110], [x + 260, y, 96], [x + 380, y + 20, 70]], 80 + i, mix("#1c0c58", "#34189a", fl)); }
  // lightning: two bolts off his brow, only while the flash is up
  if (fl > 0.45) s += `<path d="${bolt(160 + ox, 520 + oy, 60 + ox * 0.5, 1560, 3 + Math.floor(t * 9) % 2, 30 * fl)}" fill="#fff7a8" stroke="#ffe21a" stroke-width="3" stroke-linejoin="round"/><path d="${bolt(930 + ox, 560 + oy, 1010 + ox * 0.5, 1500, 8 + Math.floor(t * 9) % 2, 24 * fl)}" fill="#fff7a8" stroke="#ffe21a" stroke-width="3" stroke-linejoin="round"/>`;
  s += zeus(t, { ...st, x: 540 + ox, y: 860 + oy, k: 0.88 * zk });
  // Olympus: the peak under him, a small temple on its shoulder
  const mY = 1600 + oy * 0.4, mc = mix("#0c0428", "#1a0c50", fl), rim = mix("#3a1c9a", "#cdbcff", fl);
  const ridge = [[-20, mY + 120], [120, mY + 40], [220, mY + 70], [330, mY - 30], [420, mY + 10], [520, mY - 120], [580, mY - 96], [640, mY - 150], [720, mY - 40], [800, mY - 60], [900, mY + 50], [1000, mY + 20], [1100, mY + 110]].map(([x, y], i) => [x + ox * 0.3 + jit(i + 0.4, 8), y + jit(i + 5.4, 8)]);
  s += `<path d="${P2(ridge)} L1100,1930 L-20,1930 Z" fill="${mc}"/><path d="${P2(ridge.slice(3, 9))}" fill="none" stroke="${rim}" stroke-width="5" stroke-linejoin="round" opacity="${n(0.4 + 0.6 * fl)}"/>`;
  s += `<path d="${P2([ridge[5], [ridge[5][0] + 34, ridge[5][1] + 46], [ridge[5][0] + 60, ridge[5][1] + 30], [ridge[7][0] - 10, ridge[7][1] + 50], [ridge[7][0] + 30, ridge[7][1] + 44], ridge[7], ridge[6]])} Z" fill="${mix("#8a7ad8", "#ffffff", fl)}"/>`;
  { const tx = ridge[9][0] - 20, ty = ridge[9][1] - 4; s += `<path d="M${n(tx - 46)},${n(ty)} L${n(tx + 46)},${n(ty)} L${n(tx + 46)},${n(ty - 8)} L${n(tx - 46)},${n(ty - 8)} Z M${n(tx - 48)},${n(ty - 52)} L${n(tx)},${n(ty - 76)} L${n(tx + 48)},${n(ty - 52)} Z" fill="${rim}"/>`; for (let i = 0; i < 5; i++) s += `<rect x="${n(tx - 42 + i * 19)}" y="${n(ty - 52)}" width="8" height="44" fill="${rim}"/>`; }
  for (let i = 0; i < 60; i++) { const x = (hash(i + 0.2) * 1300 - 100 - ((t * 500 * (0.7 + 0.5 * hash(i + 2))) % 400) * 0.25), y = (hash(i + 7.2) * 1900 + t * 900 * (0.7 + 0.5 * hash(i + 2))) % 1920; s += `<path d="M${n(x)},${n(y)} l-14,56" stroke="${mix("#5a3ad0", "#e8deff", fl)}" stroke-width="${n(1.5 + hash(i + 4) * 2)}" stroke-linecap="round" opacity="${n(0.25 + 0.4 * hash(i + 9))}"/>`; }
  if (fl > 0.8) s += `<rect width="${W}" height="${H}" fill="#efe6ff" opacity="${n((fl - 0.8) * 1.2)}" style="mix-blend-mode:screen"/>`;
  return s;
}

// ================================================================ (c) Hephaestus' forge: only his hands
const SOOT = { skin: "#17111c", shade: "#2c2030", nail: "#6a5560" };
function bigHand(x, y, ang, shape, k, side, mud) { return hand(x, y, ang, shape, { ...SOOT, tips: mud ? X.clayS : null }, k, side, { detail: true, lw: 0.2, ink: "#e8581c", w: 2.5 }); }
function forearm(x0, y0, x1, y1, k) {
  const d = `M${n(x0)},${n(y0)} L${n(x1)},${n(y1)}`, w = 8.4 * k, dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
  let s = stroke(d, "#e8581c", w + 0.4 * k, `stroke-linecap="butt"`) + stroke(d, SOOT.skin, w, `stroke-linecap="butt"`) + stroke(d, SOOT.shade, w * 0.3, `stroke-linecap="butt" transform="translate(${n(-dy / l * w * 0.26)},${n(dx / l * w * 0.26)})"`);
  for (let i = 0; i < 16; i++) { const u = 0.08 + hash(i + 0.6) * 0.5, v = jit(i + 2.6, 0.42), px = lerp(x0, x1, u) - dy / l * w * v, py = lerp(y0, y1, u) + dx / l * w * v; s += `<path d="M${n(px)},${n(py)} q${n(dx / l * k * 1.1)},${n(dy / l * k * 1.1 - k * 0.5)} ${n(dx / l * k * 2)},${n(dy / l * k * 2 + k * 0.4)}" stroke="#3c2c3e" stroke-width="${n(0.22 * k)}" fill="none" stroke-linecap="round"/>`; }
  const bx = lerp(x0, x1, 0.78), by = lerp(y0, y1, 0.78), b2x = lerp(x0, x1, 0.96), b2y = lerp(y0, y1, 0.96);   // a leather wrist guard, stitched
  s += stroke(`M${n(bx)},${n(by)} L${n(b2x)},${n(b2y)}`, INK, w + 1.2 * k, `stroke-linecap="butt"`) + stroke(`M${n(bx)},${n(by)} L${n(b2x)},${n(b2y)}`, "#7a3a1c", w + 0.7 * k, `stroke-linecap="butt"`);
  for (let i = 0; i < 6; i++) { const v = (i - 2.5) / 6, px = lerp(bx, b2x, 0.5) - dy / l * w * v, py = lerp(by, b2y, 0.5) + dx / l * w * v; s += `<path d="M${n(px - dx / l * k * 0.6)},${n(py - dy / l * k * 0.6)} l${n(dx / l * k * 1.2)},${n(dy / l * k * 1.2)}" stroke="#f0c98a" stroke-width="${n(0.2 * k)}" stroke-linecap="round"/>`; }
  return s;
}
export function forge(c, t, st = {}) {
  const form = clamp(st.form ?? 1), press = clamp(st.press ?? 0.4), glow = clamp(st.glow ?? 1), wet = clamp(st.wet ?? 1), ox = -(c?.x ?? 0) * 80, zk = 1 + (c?.z ?? 0) * 0.08;
  const fstep = Math.floor(t * 10), fk = glow * (0.86 + 0.14 * hash(fstep * 3.3 + 1));
  let s = `<rect width="${W}" height="${H}" fill="#2a0f24"/>`;
  // the wall: big blocks, each one set a little off, soot rising from the hearth
  for (let r = 0; r < 9; r++) for (let j = -1; j < 5; j++) { const bw = 270, bh = 150, x = j * bw + (r % 2) * 130 + jit(r * 5 + j, 10) + ox * 0.4, y = r * bh - 20 + jit(r * 7 + j + 3, 6), d = Math.hypot(x + bw / 2 - 300, y + bh / 2 - 820) / 900; s += `<path d="M${n(x + 5)},${n(y + 5)} L${n(x + bw - 4)},${n(y + 4 + jit(r + j, 3))} L${n(x + bw - 5)},${n(y + bh - 4)} L${n(x + 4)},${n(y + bh - 5)} Z" fill="${mix(mix("#b8402a", "#5a1c3a", clamp(d)), "#2a0f24", clamp(d * 1.1 - 0.25))}"/>`; if (hash(r * 11 + j) < 0.4) s += `<path d="M${n(x + 40 + hash(r + j) * 150)},${n(y + 20)} l${n(jit(r * 3 + j, 20))},${n(40 + hash(r + j + 5) * 60)}" stroke="#2a0f24" stroke-width="3" opacity="0.6"/>`; }
  // the hearth: an arch of stones, coals, flames cut from three flat colours
  const hx = 300 + ox * 0.5, hy = 900;
  s += `<path d="M${hx - 250},${hy + 60} L${hx - 250},${hy - 250} Q${hx},${hy - 520} ${hx + 250},${hy - 250} L${hx + 250},${hy + 60} Z" fill="#12060f" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 11; i++) { const a0 = Math.PI + i / 11 * Math.PI, a1 = Math.PI + (i + 1) / 11 * Math.PI, r0 = 262, r1 = 336, q = (a, r) => [hx + Math.cos(a) * r * 0.97, hy - 240 + Math.sin(a) * r * (a === 0 ? 1 : 0.92)]; s += `<path d="${P2([q(a0 + 0.012, r0), q(a1 - 0.012, r0), q(a1 - 0.012, r1 + jit(i, 8)), q(a0 + 0.012, r1 + jit(i + 1, 8))])} Z" fill="${i % 3 ? "#8a3a34" : "#a84a30"}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`; }
  for (const [layer, col, hgt, wd] of [[0, "#d8281c", 330, 380], [1, "#ff7a1f", 240, 300], [2, HOPE.flame, 150, 200], [3, HOPE.core, 70, 110]]) { let d = `M${n(hx - wd / 2)},${hy + 40}`; const N = 6; for (let i = 0; i < N; i++) { const x0 = hx - wd / 2 + (i + 0.5) / N * wd, tip = hy + 40 - hgt * fk * (0.5 + 0.5 * hash(fstep * 1.3 + i * 2.7 + layer * 5)) * Math.sin((i + 0.5) / N * Math.PI) ** 0.6; d += ` Q${n(x0 - wd / N * 0.42)},${n(lerp(hy + 40, tip, 0.5))} ${n(x0 + jit(fstep + i + layer, 14))},${n(tip)} Q${n(x0 + wd / N * 0.2)},${n(lerp(hy + 40, tip, 0.4))} ${n(x0 + wd / N * 0.5)},${n(hy + 40 - hgt * 0.18)}`; } s += `<path d="${d} L${n(hx + wd / 2)},${hy + 40} Z" fill="${col}"/>`; }
  for (let i = 0; i < 12; i++) s += `<path d="${blob(ring(hx - 190 + i * 34 + jit(i, 8), hy + 42 + jit(i + 4, 10), 24 + hash(i) * 10, i + 90, 7, 0.2, 0.7))}" fill="${hash(fstep * 0.5 + i * 3.1) < 0.5 * glow ? "#ff9a2a" : i % 3 ? "#5a1418" : "#2a0a10"}" stroke="${INK}" stroke-width="2"/>`;
  for (let i = 0; i < 18; i++) { const ph = (t * (0.35 + 0.3 * hash(i + 0.9)) + hash(i + 3.9)) % 1, x = hx - 150 + hash(i + 5.9) * 300 + Math.sin(ph * 9 + i) * 26, y = hy - ph * 620; s += `<path d="M${n(x)},${n(y)} l${n(jit(i, 4))},${n(-6 - 10 * (1 - ph))}" stroke="${ph < 0.5 ? HOPE.flame : "#ff7a1f"}" stroke-width="${n(4.5 * (1 - ph) + 1)}" stroke-linecap="round" opacity="${n(glow * (1 - ph))}"/>`; }
  // tools on their pegs: tongs, a hammer
  { const tx = 800 + ox * 0.4; s += `<path d="M${tx},330 l-16,250 M${tx + 10},330 l34,250 M${tx - 8},336 q14,-40 26,0" stroke="${INK}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M${tx},330 l-16,250 M${tx + 10},330 l34,250 M${tx - 8},336 q14,-40 26,0" stroke="#5a4a6a" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M${tx + 130},300 l8,300" stroke="${INK}" stroke-width="20" stroke-linecap="round"/><path d="M${tx + 130},300 l8,300" stroke="#8a5230" stroke-width="13" stroke-linecap="round"/><path d="M${tx + 76},292 l118,-10 l4,66 l-116,8 Z" fill="#5a4a6a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M${tx + 84},300 l100,-8" stroke="#9a8ab0" stroke-width="5"/>`; }
  // the anvil table: a slab on a block, lit from the hearth side; water bowl, the heap of mud, an anvil at the far end
  const ty = 1270, lit = mix("#5a2a3a", "#ff9a4a", 0.25 + 0.5 * fk);
  s += `<path d="M-20,${ty + 12} L${1100},${ty - 12} L1100,1930 L-20,1930 Z" fill="#3a1424"/><path d="M-20,${ty - 60} L1100,${ty - 84} L1100,${ty - 6} L-20,${ty + 18} Z" fill="${lit}" stroke="${INK}" stroke-width="3"/><path d="M-20,${ty + 18} L1100,${ty - 6} L1100,${ty + 50} L-20,${ty + 74} Z" fill="#5a1c30" stroke="${INK}" stroke-width="3"/>`;
  for (let i = 0; i < 9; i++) s += `<path d="M${n(60 + i * 118 + jit(i, 30))},${n(ty - 30 - i * 2.5 + jit(i + 3, 16))} l${n(40 + hash(i) * 60)},-2" stroke="${i % 2 ? "#7a2a34" : "#ffc07a"}" stroke-width="4" stroke-linecap="round" opacity="0.6"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${n(100 + i * 230 + jit(i + 6, 40))},${ty + 80} l${n(jit(i, 14))},${n(200 + hash(i) * 200)}" stroke="#22081a" stroke-width="5" opacity="0.7"/>`;
  { const ax = 900 + ox * 0.2, ay = ty - 60; s += `<path d="M${ax - 100},${ay} L${ax - 82},${ay - 50} L${ax - 50},${ay - 70} L${ax - 110},${ay - 122} L${ax - 150},${ay - 128} L${ax - 150},${ay - 170} L${ax + 130},${ay - 178} L${ax + 210},${ay - 150} L${ax + 130},${ay - 128} L${ax + 60},${ay - 76} L${ax + 86},${ay - 48} L${ax + 100},${ay} Z" fill="#3a3050" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M${ax - 146},${ay - 164} L${ax + 126},${ay - 172} L${ax + 190},${ay - 152}" stroke="#ff9a4a" stroke-width="6" fill="none" stroke-linecap="round" opacity="${n(0.4 + 0.5 * fk)}"/><path d="M${ax - 40},${ay - 110} l60,-2 M${ax - 60},${ay - 30} l90,-2" stroke="#5a4a70" stroke-width="5" stroke-linecap="round"/>`; }
  { const bx = 150 + ox * 0.2, by = ty - 44; s += `<path d="M${bx - 92},${by - 56} Q${bx - 84},${by + 16} ${bx - 30},${by + 20} L${bx + 34},${by + 18} Q${bx + 88},${by + 10} ${bx + 94},${by - 60} Z" fill="#a84a30" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="${bx + 1}" cy="${by - 58}" rx="93" ry="17" fill="#3f8fd8" stroke="${INK}" stroke-width="4"/><path d="M${bx - 50},${by - 60} q30,-9 60,-1" stroke="#bfe8ff" stroke-width="5" fill="none" stroke-linecap="round" opacity="${n(0.5 + 0.4 * Math.sin(t * 3))}"/><path d="M${bx + 60},${by - 20} q14,10 10,26" stroke="#7a2a24" stroke-width="5" fill="none" stroke-linecap="round"/>`; }
  // --- the work: mud -> post -> woman
  const fxp = 560 + ox * 0.1, base = ty - 34, clay = X.clay, clayS = X.clayS, clayD = X.clayD;
  let work = `<path d="${blob(ring(fxp, base + 6, 180, 5, 12, 0.08, 0.16))}" fill="${clayS}" stroke="${INK}" stroke-width="3"/>`;
  if (wet > 0.05) for (let i = 0; i < 5; i++) work += `<path d="${blob(ring(fxp + jit(i + 1, 150), base + 10 + jit(i + 4, 10), 16 + hash(i) * 20, i + 9, 7, 0.2, 0.3))}" fill="#3f8fd8" opacity="${n(0.7 * wet)}"/>`;
  let figP = null;
  if (form < 0.4) {
    const u = form / 0.4, hh = lerp(110, 300, u), ww = lerp(190, 120, u);
    const a = [[-ww, 0], [-ww * 0.9, -hh * 0.4], [-ww * 0.5, -hh * 0.8], [0, -hh], [ww * 0.56, -hh * 0.78], [ww * 0.92, -hh * 0.36], [ww, 0]].map(([x, y], i) => xy(fxp + x + jit(i + 20, 12), base + y + jit(i + 30, 10)));
    work += `<path d="${blob([...a, xy(fxp, base + 30)])}" fill="${clay}" stroke="${INK}" stroke-width="4"/><path d="${blob(ring(fxp + ww * 0.3, base - hh * 0.4, ww * 0.34, 3, 8, 0.2, 1.3))}" fill="${clayS}"/>`;
    for (let i = 0; i < 4; i++) work += `<path d="M${n(fxp - ww * 0.5 + i * ww * 0.26)},${n(base - hh * (0.3 + 0.12 * i))} q${n(ww * 0.1)},${n(-hh * 0.1)} ${n(ww * 0.22)},${n(-hh * 0.04)}" stroke="${clayD}" stroke-width="5" fill="none" stroke-linecap="round"/>`;   // finger grooves
    work += `<path d="M${n(fxp - ww * 0.5)},${n(base - hh * 0.62)} q${n(ww * 0.2)},${n(-hh * 0.16)} ${n(ww * 0.4)},${n(-hh * 0.1)}" stroke="${X.clayL}" stroke-width="7" fill="none" stroke-linecap="round" opacity="${n(0.5 + 0.4 * wet)}"/>`;
  } else if (form < 0.75) {
    const u = (form - 0.4) / 0.35, hh = lerp(380, 560, u), sw = lerp(66, 78, u), hd = lerp(40, 52, u), neck = lerp(40, 26, u);
    const a = [[-sw * 0.9, 0], [-sw * 0.8, -hh * 0.4], [-sw * (0.8 - 0.25 * u), -hh * 0.56], [-sw * (1 + 0.3 * u), -hh * 0.74], [-sw * 0.9, -hh * 0.8], [-neck, -hh * 0.83], [-hd, -hh * 0.9], [-hd * 0.8, -hh], [hd * 0.8, -hh * 1.0], [hd, -hh * 0.9], [neck, -hh * 0.83], [sw * 0.9, -hh * 0.8], [sw * (1 + 0.3 * u), -hh * 0.72], [sw * (0.8 - 0.25 * u), -hh * 0.56], [sw * 0.84, -hh * 0.4], [sw * 0.96, 0]].map(([x, y], i) => [fxp + x + jit(i + 40, 7), base + y + jit(i + 50, 6)]);
    work += `<path d="${P2(a)} Z" fill="${clay}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="${P2([a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], [fxp + 20, base], [fxp + 30, base - hh * 0.5], [fxp + 10, base - hh * 0.8], [fxp + 14, base - hh * 0.95]])} Z" fill="${clayS}"/>`;
    for (let i = 0; i < 7; i++) work += `<path d="M${n(fxp - 40 + jit(i + 60, 20))},${n(base - hh * (0.1 + i * 0.1))} q20,${n(-10 + jit(i, 8))} 44,0" stroke="${clayD}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    work += `<path d="M${n(fxp - 14)},${n(base - hh * 0.93)} l10,2 M${n(fxp + 10)},${n(base - hh * 0.93)} l10,-1" stroke="${clayD}" stroke-width="4" stroke-linecap="round" opacity="${n(u)}"/>`;   // two thumb marks where the eyes will be
  } else {
    const A = at2d(fxp, base + 4, 352), u = (form - 0.75) / 0.25;
    figP = pandora(A.c, { X: A.X, Z: A.Z, clay: 1, dress: false, pose: { fx: 0.35, hN: [-9, -82], hF: [11, -82] } }, t);
    work += figP.svg;
    for (let i = 0; i < 9; i++) if (hash(i + 70.5) > u) work += `<path d="M${n(fxp - 50 + hash(i + 71) * 90)},${n(base - 60 - hash(i + 72) * 430)} q16,${n(jit(i, 8))} 34,${n(jit(i + 3, 5))}" stroke="${clayD}" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.8"/>`;   // rough marks, smoothed away one by one
  }
  // --- the hands: the right one behind the work, the left one in front. Mud on the fingertips.
  const HK = 21 * zk, sh = blendHand(blendHand(HANDS.open, HANDS.reach, clamp(press * 1.6)), HANDS.relax, clamp(press * 1.4 - 0.5) * 0.7), knead = Math.sin(t * 3.1) * 10 * press;
  const lw = { x: lerp(-40, 150, ease(press)) + ox * 0.1, y: 1010 + knead }, rw = { x: lerp(1120, 960, ease(press)) + ox * 0.1, y: 860 - knead * 0.7 };
  s += forearm(rw.x + 420, rw.y - 150, rw.x, rw.y, HK) + bigHand(rw.x, rw.y, 180 - 16 + press * 6, sh, HK, -1, true);
  s += work;
  s += forearm(lw.x - 430, lw.y + 150, lw.x, lw.y, HK) + bigHand(lw.x, lw.y, -14 + press * 5, sh, HK, 1, true);
  // light for after the grade: the hearth, painted
  const light = lightBlobs({ x: hx, y: hy - 120, s: 100 }, [7.6, 4.6, 2.6], "#ff7a1f", [0.07 * fk, 0.1 * fk, 0.14 * fk], 3 + fstep % 3, 1.1);
  return { svg: s, light, figure: figP };
}

// ================================================================ (d)+(e) the door of Epimetheus' house, from outside
export const DOOR = { X: 0.25, w: 1.12, h: 2.12, Z: 6, wallH: 3.35 };
export function doorFront(c, t, st = {}) {
  const D = DOOR, open = clamp(st.open ?? 0), inside = clamp(st.inside ?? 1), q = (X_, Y_, Z_ = D.Z) => P(c, X_, Y_, Z_), x0 = D.X - D.w / 2, x1 = D.X + D.w / 2;
  const dusk = clamp(st.dusk ?? 0), roofY = q(0, D.wallH + 0.3).y;
  let s = GR.sky(c, t, { moon: dusk > 0.5 ? false : st.moon ?? [860, 250, 46], stars: 1 - dusk });
  if (dusk > 0.02) {   // the last of the day: hand-cut bands, a low sun going behind the roof
    for (const [i, col, y0] of [[0, "#7a2f9a", 0.3], [1, "#d8407a", 0.52], [2, "#ff6a4a", 0.72], [3, "#ffa23a", 0.88]]) s += `<path d="M-10,${n(roofY * y0)} ${Array.from({ length: 6 }, (_, j) => `Q${j * 220 + 110},${n(roofY * y0 + jit(i * 9 + j, 26))} ${j * 220 + 220},${n(roofY * y0 + jit(i * 7 + j + 3, 14))}`).join(" ")} L1100,${n(roofY + 20)} L-10,${n(roofY + 20)} Z" fill="${col}" opacity="${n(dusk)}"/>`;
    s += `<path d="${blob(ring(250 - c.x * 14, roofY - 60, 92, 5, 14, 0.02))}" fill="#fff0a0" opacity="${n(dusk)}"/>` + lightBlobs({ x: 250 - c.x * 14, y: roofY - 60, s: 1 }, [330, 190], "#ffc35a", [0.12 * dusk, 0.18 * dusk], 77);
    for (let i = 0; i < 4; i++) { const y = roofY * (0.36 + i * 0.15), x = ((hash(i + 3.1) * 1300 + t * 4) % 1500) - 200; s += `<path d="${blob([xy(x, y), xy(x + 150, y - 22), xy(x + 330, y - 10), xy(x + 420, y + 6), xy(x + 200, y + 14)])}" fill="${i % 2 ? "#ffd08a" : "#b03a8a"}" opacity="${n(0.7 * dusk)}"/>`; }
  }
  // behind the house: two cypresses and an olive over the roof line
  for (const [cxp, hgt, sd] of [[-3.3, 6.2, 1], [-2.5, 5.2, 2], [3.6, 5.8, 3]]) { const b = q(cxp, 0, 9), k = b.s, a = []; for (let i = 0; i <= 8; i++) a.push(xy(b.x - (0.42 * Math.sin(i / 8 * Math.PI) ** 0.7 + jit(sd * 9 + i, 0.05)) * k, b.y - i / 8 * hgt * k)); for (let i = 8; i >= 0; i--) a.push(xy(b.x + (0.42 * Math.sin(i / 8 * Math.PI) ** 0.7 + jit(sd * 11 + i, 0.05)) * k, b.y - i / 8 * hgt * k)); s += `<path d="${lineD(a, true)}" fill="${M.olive}" stroke="${INK}" stroke-width="1"/>`; for (let i = 0; i < 5; i++) s += `<path d="M${n(b.x + jit(sd + i, 0.2) * k)},${n(b.y - (1.5 + i * 0.8) * k)} q${n(0.1 * k)},${n(-0.4 * k)} ${n(-0.03 * k)},${n(-0.8 * k)}" stroke="${M.oliveL}" stroke-width="${n(0.04 * k)}" fill="none" stroke-linecap="round" opacity="0.5"/>`; }
  s += GR.olive(c, t, { X: 2.6, Z: 8.4, Y: 0, size: 5.2, seed: 9, detail: 0.6 });
  // the wall: whitewash, a flat mud roof with the beam ends showing
  s += poly(wpoly(c, [[-5.2, 0, D.Z], [5.2, 0, D.Z], [5.2, D.wallH, D.Z], [-5.2, D.wallH, D.Z]], 91, 0.016, 0.6), M.wall, `stroke="${INK}" stroke-width="1.2"`);
  s += dabs(c, -4.4, 4.4, 0.6, D.wallH - 0.5, D.Z, 70, 700, [M.wallL, M.wallS, M.wallL], (X_, Y_) => X_ > x0 - 0.3 && X_ < x1 + 0.3 && Y_ < D.h + 0.35);
  s += poly(wpoly(c, [[-5.2, D.wallH - 0.02, D.Z - 0.12], [5.2, D.wallH, D.Z - 0.12], [5.2, D.wallH + 0.24, D.Z - 0.12], [-5.2, D.wallH + 0.22, D.Z - 0.12]], 93, 0.02, 0.4), M.roof, `stroke="${INK}" stroke-width="1.2"`) + poly([q(-5.2, D.wallH - 0.02, D.Z - 0.12), q(5.2, D.wallH, D.Z - 0.12), q(5.2, D.wallH - 0.1, D.Z), q(-5.2, D.wallH - 0.12, D.Z)], M.wallD);
  for (let i = 0; i < 11; i++) { const b = q(-4.4 + i * 0.86 + jit(i + 0.5, 0.06), D.wallH - 0.26 + jit(i + 3, 0.02), D.Z - 0.14); s += `<path d="${blob(ring(b.x, b.y, (0.085 + 0.02 * hash(i)) * b.s, i + 5, 8, 0.07))}" fill="${M.woodL}" stroke="${INK}" stroke-width="1.1"/><path d="${blob(ring(b.x + 1, b.y + 1, 0.035 * b.s, i + 7, 6, 0.2))}" fill="none" stroke="${M.woodS}" stroke-width="1"/>`; }
  s += poly(wpoly(c, [[-5.2, 0, D.Z - 0.01], [5.2, 0, D.Z - 0.01], [5.2, 0.62, D.Z - 0.01], [-5.2, 0.6, D.Z - 0.01]], 95, 0.014, 0.35), M.blue) + dabs(c, -4.6, 4.6, 0.08, 0.52, D.Z - 0.01, 22, 800, [M.blueS, M.blueL]);
  s += crack(c, -1.3, 1.2, D.Z, 1.0, 31) + crack(c, 2.2, 3.1, D.Z, -0.9, 33) + crack(c, 1.4, 0.8, D.Z, 0.5, 35) + chip(c, -0.95, 2.75, D.Z, 0.2, 37) + chip(c, 2.9, 1.1, D.Z, 0.16, 39) + chip(c, -3.4, 0.9, D.Z, 0.13, 41);
  s += shutterWin(c, -2.15, 1.85, D.Z, 0.7, 0.86, inside, 7) + shutterWin(c, 2.35, 2.0, D.Z, 0.6, 0.74, inside * 0.9, 12);
  // the doorway: dark inside, lamp light, the jar waiting in there
  const dq = [q(x0, 0), q(x1, 0), q(x1, D.h), q(x0, D.h + 0.015)], did = `pf${UID++}`, warm = mix(M.woodS, "#ffa23a", inside * 0.85);
  s += poly(wpoly(c, [[x0 - 0.17, 0, D.Z - 0.02], [x1 + 0.17, 0, D.Z - 0.02], [x1 + 0.16, D.h + 0.2, D.Z - 0.02], [x0 - 0.18, D.h + 0.22, D.Z - 0.02]], 97, 0.012, 0.4), M.blueS, `stroke="${INK}" stroke-width="1.2"`);
  s += `<clipPath id="${did}"><path d="${lineD(dq, true)}"/></clipPath><path d="${lineD(dq, true)}" fill="${M.woodS}" stroke="${INK}" stroke-width="1.2"/><g clip-path="url(#${did})">`;
  if (open > 0.03) {
    s += `<path d="${lineD(dq, true)}" fill="${warm}"/>` + poly([q(x0, 0, D.Z), q(x1, 0, D.Z), q(x1 - 0.1, 0, D.Z + 2.6), q(x0 + 0.1, 0, D.Z + 2.6)], mix(X.earth, "#ffb548", inside * 0.4));
    if (inside > 0.05) s += `<path d="${blob(ring(lerp(dq[0].x, dq[1].x, 0.3), lerp(dq[0].y, dq[2].y, 0.62), 0.62 * dq[0].s, 23, 11, 0.1, 1.2))}" fill="#ffd27a" opacity="${n(inside * 0.8)}"/><path d="${blob(ring(lerp(dq[0].x, dq[1].x, 0.28), lerp(dq[0].y, dq[2].y, 0.66), 0.3 * dq[0].s, 25, 9, 0.1, 1.1))}" fill="#fff0b8" opacity="${n(inside * 0.8)}"/>`;
    if (st.jarPeek !== false) s += pithos(c, { X: D.X + 0.3, Z: D.Z + 2.3, lit: -1 }, t).svg;
  }
  s += `</g>`;
  // the leaf: hung on the left, swings in. Planks, two battens, chipped paint, an iron ring
  const an = open * 1.75, hx = x0 + 0.02, lz = (u) => D.Z + 0.03 + Math.sin(an) * D.w * u * 0.98, lx = (u) => hx + Math.cos(an) * (D.w - 0.04) * u, lq = (u, y) => P(c, lx(u), y, lz(u));
  if (open < 0.99) {
    const leaf = [lq(0, 0.02), lq(1, 0.02), lq(1, D.h - 0.03), lq(0, D.h - 0.02)], lid2 = `pl${UID++}`;
    s += `<clipPath id="${lid2}"><path d="${lineD(dq, true)}"/></clipPath><g clip-path="url(#${lid2})"><path d="${lineD(leaf, true)}" fill="${open > 0.5 ? M.blueS : M.blue}" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>`;
    for (let j = 1; j < 5; j++) { const u = j / 5 + jit(j + 0.3, 0.012); s += `<path d="M${pt(lq(u, 0.03))} L${pt(lq(u, D.h - 0.04))}" stroke="${M.blueS}" stroke-width="${n(Math.max(1, 0.016 * leaf[0].s))}"/>`; }
    for (const y of [0.36, 1.5]) s += poly([lq(0.03, y + 0.07), lq(0.97, y + 0.075), lq(0.97, y - 0.06), lq(0.03, y - 0.065)], M.blueL, `stroke="${INK}" stroke-width="0.9"`);
    for (let j = 0; j < 6; j++) { const p0 = lq(0.1 + hash(j * 3.3 + 0.4) * 0.8, 0.1 + hash(j * 1.7 + 0.2) ** 1.5 * 1.5); s += `<path d="${blob(ring(p0.x, p0.y, (0.025 + 0.035 * hash(j)) * p0.s * (1 - open * 0.6), j + 40, 6, 0.35))}" fill="${j % 2 ? M.woodL : M.blueL}" opacity="0.85"/>`; }
    const rg = lq(0.8, 1.02); s += `<circle cx="${n(rg.x)}" cy="${n(rg.y)}" r="${n(0.05 * rg.s)}" fill="none" stroke="${INK}" stroke-width="${n(0.03 * rg.s)}"/><circle cx="${n(rg.x)}" cy="${n(rg.y)}" r="${n(0.05 * rg.s)}" fill="none" stroke="${M.bell}" stroke-width="${n(0.016 * rg.s)}"/></g>`;
  }
  s += poly(wpoly(c, [[x0 - 0.3, D.h + 0.2, D.Z - 0.05], [x1 + 0.3, D.h + 0.21, D.Z - 0.05], [x1 + 0.28, D.h + 0.42, D.Z - 0.05], [x0 - 0.28, D.h + 0.43, D.Z - 0.05]], 99, 0.014, 0.3), M.wood, `stroke="${INK}" stroke-width="1.2"`);
  for (let i = 0; i < 5; i++) { const a = q(x0 - 0.2 + hash(i + 0.9) * (D.w + 0.2), D.h + 0.26 + hash(i + 3.9) * 0.1, D.Z - 0.05); s += `<path d="M${pt(a)} l${n(0.24 * a.s)},${n(jit(i, 1.5))}" stroke="${M.woodS}" stroke-width="1.4" stroke-linecap="round"/>`; }
  // ground: paving, two steps, weeds in the joints
  s += poly([q(-9, 0, D.Z), q(9, 0, D.Z), q(9, 0, c.z + 0.3), q(-9, 0, c.z + 0.3)], M.pave);
  for (let i = 0; i < 46; i++) { const z = lerp(D.Z - 0.2, c.z + 0.9, hash(i + 0.31) ** 1.2), a = q(lerp(-3.4, 3.4, hash(i + 5.1)), 0, z), w = (0.3 + 0.5 * hash(i + 2.2)) * a.s; s += `<path d="${blob(ring(a.x, a.y, w * 0.5, i + 60, 7, 0.14, 0.2))}" fill="${i % 3 ? M.pave2 : M.paveS}" opacity="${n(0.5 + 0.3 * hash(i + 4))}"/>`; }
  s += poly(wpoly(c, [[x0 - 0.42, 0.001, D.Z], [x1 + 0.42, 0.001, D.Z], [x1 + 0.46, 0.001, D.Z - 0.62], [x0 - 0.46, 0.001, D.Z - 0.64]], 101, 0.014, 0.3), M.stoneL, `stroke="${INK}" stroke-width="1.1"`) + poly(wpoly(c, [[x0 - 0.26, 0.12, D.Z], [x1 + 0.26, 0.12, D.Z], [x1 + 0.28, 0.12, D.Z - 0.34], [x0 - 0.28, 0.12, D.Z - 0.35]], 103, 0.012, 0.3), M.wallL, `stroke="${INK}" stroke-width="1.1"`) + poly([q(x0 - 0.28, 0.12, D.Z - 0.35), q(x1 + 0.28, 0.12, D.Z - 0.34), q(x1 + 0.28, 0, D.Z - 0.34), q(x0 - 0.28, 0, D.Z - 0.35)], M.stone, `stroke="${INK}" stroke-width="1"`);
  for (let i = 0; i < 7; i++) { const b = q(-3.6 + hash(i + 0.77) * 7.2, 0, D.Z - 0.05 - hash(i + 2.77) * 0.2); for (let j = -1; j <= 1; j++) s += `<path d="M${pt(b)} q${n(j * 0.05 * b.s)},${n(-0.12 * b.s)} ${n(j * 0.1 * b.s + jit(i + j, 3))},${n(-(0.2 + 0.1 * hash(i + j)) * b.s)}" stroke="${M.grass}" stroke-width="${n(0.02 * b.s)}" fill="none" stroke-linecap="round"/>`; }
  // warm light out of the open door, on the steps (painted)
  let light = "";
  if (open > 0.05 && inside > 0.05) light += `<path d="${lineD(wpoly(c, [[x0 + 0.05, 0.004, D.Z - 0.02], [x1 - 0.05, 0.004, D.Z - 0.02], [x1 + 0.9, 0.004, D.Z - 2.6], [x0 - 0.5, 0.004, D.Z - 2.8]], 105, 0.02, 0.5), true)}" fill="#ffa23a" opacity="${n(0.34 * open * inside)}" style="mix-blend-mode:screen"/>`;
  // a bench with a basket, a pot of basil by the step
  const items = [];
  { const bx = 1.75, bz = D.Z - 0.3, b = q(bx, 0, bz), k = b.s; let o = limb2(`M${n(b.x - 0.42 * k)},${n(b.y)} l${n(0.02 * k)},${n(-0.4 * k)} M${n(b.x + 0.42 * k)},${n(b.y)} l${n(-0.02 * k)},${n(-0.4 * k)}`, M.wood, 0.07 * k) + `<path d="M${n(b.x - 0.56 * k)},${n(b.y - 0.46 * k)} L${n(b.x + 0.56 * k)},${n(b.y - 0.47 * k)} L${n(b.x + 0.55 * k)},${n(b.y - 0.38 * k)} L${n(b.x - 0.55 * k)},${n(b.y - 0.37 * k)} Z" fill="${M.woodL}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
    o += `<path d="M${n(b.x - 0.22 * k)},${n(b.y - 0.47 * k)} Q${n(b.x - 0.3 * k)},${n(b.y - 0.72 * k)} ${n(b.x - 0.2 * k)},${n(b.y - 0.76 * k)} L${n(b.x + 0.22 * k)},${n(b.y - 0.77 * k)} Q${n(b.x + 0.3 * k)},${n(b.y - 0.7 * k)} ${n(b.x + 0.2 * k)},${n(b.y - 0.47 * k)} Z" fill="${X.mat}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`; for (let j = 0; j < 4; j++) o += `<path d="M${n(b.x - 0.25 * k)},${n(b.y - (0.52 + j * 0.06) * k)} q${n(0.24 * k)},${n(0.03 * k)} ${n(0.48 * k)},0" stroke="${X.matS}" stroke-width="1.3" fill="none"/>`;
    items.push({ Z: bz, svg: o }); }
  { const b = q(x0 - 0.62, 0, D.Z - 0.42), k = b.s; let o = `<path d="M${n(b.x - 0.17 * k)},${n(b.y - 0.36 * k)} L${n(b.x + 0.17 * k)},${n(b.y - 0.36 * k)} L${n(b.x + 0.12 * k)},${n(b.y)} L${n(b.x - 0.12 * k)},${n(b.y)} Z" fill="${M.roof}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/><path d="M${n(b.x - 0.19 * k)},${n(b.y - 0.36 * k)} l${n(0.38 * k)},0" stroke="${INK}" stroke-width="${n(0.05 * k)}" stroke-linecap="round"/><path d="M${n(b.x - 0.19 * k)},${n(b.y - 0.36 * k)} l${n(0.38 * k)},0" stroke="${M.roofS}" stroke-width="${n(0.03 * k)}" stroke-linecap="round"/>`; for (let j = 0; j < 13; j++) { const a0 = -Math.PI * (0.12 + 0.76 * hash(j + 0.3)), r = (0.16 + 0.2 * hash(j + 1.3)) * k; o += `<path d="${blob(ring(b.x + Math.cos(a0) * r, b.y - 0.38 * k + Math.sin(a0) * r, (0.05 + 0.03 * hash(j)) * k, j + 3, 6, 0.2, 0.7))}" fill="${j % 3 ? M.grass : M.oliveL}" stroke="${INK}" stroke-width="0.8"/>`; }
    items.push({ Z: D.Z - 0.42, svg: o }); }
  return { back: s, items, svg: s + stack(items), light, doorAt: { X: D.X, Z: D.Z } };
}

// ================================================================ the ending: Grandma's candle jar, large in frame
// The jar keeper() carries (glass, dark lid, cream candle, the same flame colours as Hope), the kid's hand in the pink
// quilted cuff, Grandma's hand in the blue cloak with the amber lining.
export function candleJarCU(t, st = {}) {
  const reach = clamp(st.reach ?? 0), slap = clamp(st.slap ?? 0), fl = clamp(st.flame ?? 1), cx = 560, top = 760, jw = 215, jh = 600;
  const hit = ease(clamp(slap / 0.5), "in"), after = clamp((slap - 0.5) / 0.5), lidUp = ease(clamp((reach - 0.82) / 0.18)) * (1 - hit), jolt = slap > 0.5 ? Math.sin(after * 22) * (1 - after) * 9 : 0;
  const fk = fl * (1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1)) * (0.88 + 0.12 * hash(Math.floor(t * 12) * 5.3 + 0.7)) * (1 - 0.3 * (slap > 0.5 ? 1 - after : 0));
  let s = `<rect width="${W}" height="${H}" fill="#120e36"/>`;
  // the night street behind, out of focus: flat hand-cut patches of the channel's night colours
  for (const [x, y, r, col, a, sd] of [[180, 420, 250, "#2b2466", 0.9, 1], [900, 620, 300, "#241d5a", 0.9, 2], [300, 1500, 360, "#1c1648", 0.9, 3], [860, 1560, 280, "#2f2670", 0.8, 4], [130, 980, 120, "#ffb867", 0.22, 5], [960, 1150, 90, "#ff6a50", 0.2, 6], [760, 330, 70, "#ffc870", 0.25, 7], [70, 1700, 80, "#bfe8ff", 0.14, 8]]) s += `<path d="${blob(ring(x, y, r, sd + 30, 11, 0.1))}" fill="${col}" opacity="${a}"/>`;
  // the staff's hook and the wire
  s += `<path d="M1100,260 Q820,250 690,330 Q590,400 ${cx + 6},470" stroke="${INK}" stroke-width="52" fill="none" stroke-linecap="round"/><path d="M1100,260 Q820,250 690,330 Q590,400 ${cx + 6},470" stroke="#6f4528" stroke-width="42" fill="none" stroke-linecap="round"/><path d="M1100,248 Q820,238 700,312" stroke="#8a5a37" stroke-width="10" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${n(1000 - i * 70 + jit(i, 14))},${n(262 + i * 5)} q-30,${n(4 + jit(i + 2, 4))} -52,${n(12)}" stroke="#4e2f1d" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const sway = Math.sin(t * 1.3) * 3 + jolt * 0.5;
  s += `<g transform="rotate(${n(sway * 0.2)} ${cx} 470) translate(0,${n(Math.abs(jolt) * 0.8)})">${[-1, 1].map((sg) => `<path d="M${cx + 6},470 L${n(cx + sg * jw * 0.86)},${top + 6}" stroke="${INK}" stroke-width="9"/><path d="M${cx + 6},470 L${n(cx + sg * jw * 0.86)},${top + 6}" stroke="#8a8090" stroke-width="4"/><circle cx="${n(cx + sg * jw * 0.86)}" cy="${top + 8}" r="11" fill="#8a8090" stroke="${INK}" stroke-width="5"/>`).join("")}`;
  // glass
  const gl = `M${cx - jw * 0.82},${top} Q${cx - jw * 1.06},${top + jh * 0.5} ${cx - jw * 0.86},${top + jh * 0.93} Q${cx},${top + jh * 1.05} ${cx + jw * 0.86},${top + jh * 0.93} Q${cx + jw * 1.06},${top + jh * 0.5} ${cx + jw * 0.82},${top} Z`;
  s += lightBlobs({ x: cx, y: top + jh * 0.46, s: 100 }, [6.2, 3.9, 2.5], HOPE.glow, [0.09 * fk, 0.14 * fk, 0.2 * fk], 17 + Math.floor(t * 6) % 3);
  s += `<path d="${gl}" fill="#cfe6ff" opacity="0.2"/><path d="${blob(ring(cx, top + jh * 0.5, jw * 0.72, 9, 12, 0.06, 1.2))}" fill="${HOPE.glow}" opacity="${n(0.3 * fk)}"/>`;
  // the candle: cream wax, runs and drips, a black wick; the flame is Hope's
  const cy0 = top + jh * 0.9, cw = 62, chh = 250;
  s += `<path d="M${cx - cw},${cy0} L${cx - cw + 3},${cy0 - chh} Q${cx},${cy0 - chh - 16} ${cx + cw - 2},${cy0 - chh + 4} L${cx + cw},${cy0} Q${cx},${cy0 + 16} ${cx - cw},${cy0} Z" fill="#fff4e0" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M${cx + cw * 0.4},${cy0 - chh} L${cx + cw - 2},${cy0 - chh + 4} L${cx + cw},${cy0} Q${cx + cw * 0.7},${cy0 + 8} ${cx + cw * 0.46},${cy0 + 10} Z" fill="#e6cfae"/>`;
  for (const [dx, len, wd] of [[-40, 92, 15], [-12, 44, 11], [24, 126, 14], [46, 60, 10]]) s += `<path d="M${cx + dx - wd / 2},${cy0 - chh + 2} L${cx + dx - wd / 2},${cy0 - chh + len} Q${cx + dx},${cy0 - chh + len + wd * 1.3} ${cx + dx + wd / 2},${cy0 - chh + len} L${cx + dx + wd / 2},${cy0 - chh + 2} Z" fill="#fffaf0" stroke="#d8c09a" stroke-width="2.5"/>`;
  s += `<ellipse cx="${cx}" cy="${cy0 - chh - 4}" rx="${cw - 6}" ry="13" fill="#ffe9b8" stroke="#d8c09a" stroke-width="3"/><path d="M${cx},${cy0 - chh - 4} q-4,-18 3,-34" stroke="#1a1218" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  const fy = cy0 - chh - 34, fh = 150 * fk, fw = 44 * fk, lean = Math.sin(t * 7) * 8 + jolt * 2;
  s += `<path d="M${n(cx + 3 + lean)},${n(fy - fh)} Q${n(cx + 3 + fw)},${n(fy - fh * 0.3)} ${cx + 3},${fy + 10} Q${n(cx + 3 - fw)},${n(fy - fh * 0.3)} ${n(cx + 3 + lean)},${n(fy - fh)} Z" fill="${HOPE.flame}" stroke="${HOPE.edge}" stroke-width="5" stroke-linejoin="round"/><path d="M${n(cx + 3 + lean * 0.5)},${n(fy - fh * 0.56)} Q${n(cx + 3 + fw * 0.46)},${n(fy - fh * 0.18)} ${cx + 3},${fy + 4} Q${n(cx + 3 - fw * 0.46)},${n(fy - fh * 0.18)} ${n(cx + 3 + lean * 0.5)},${n(fy - fh * 0.56)} Z" fill="${HOPE.core}"/>`;
  // glass on top: outline, two long reflections, a scratch, a thumbprint smear
  s += `<path d="${gl}" fill="none" stroke="#e9f3ff" stroke-width="7" stroke-linejoin="round"/><path d="${gl}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" transform="translate(0,0)" opacity="0.5"/>`;
  s += `<path d="M${cx - jw * 0.74},${top + 60} Q${cx - jw * 0.92},${top + jh * 0.45} ${cx - jw * 0.78},${top + jh * 0.76}" stroke="#ffffff" stroke-width="13" fill="none" stroke-linecap="round" opacity="0.55"/><path d="M${cx - jw * 0.56},${top + 96} Q${cx - jw * 0.66},${top + jh * 0.3} ${cx - jw * 0.6},${top + jh * 0.44}" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.5"/><path d="M${cx + jw * 0.7},${top + jh * 0.6} q14,60 -10,130" stroke="#ffffff" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.35"/><path d="M${cx + jw * 0.2},${top + jh * 0.2} l40,26" stroke="#e9f3ff" stroke-width="2" opacity="0.5"/>`;
  // the lid: dark tin, a rolled edge, dents; it tips up on the kid's side
  const lidD = `M${cx - jw * 0.92},${top + 8} L${cx - jw * 0.9},${top - 62} Q${cx - jw * 0.86},${top - 80} ${cx - jw * 0.6},${top - 84} L${cx - 26},${top - 88} L${cx - 22},${top - 104} L${cx + 22},${top - 104} L${cx + 26},${top - 88} L${cx + jw * 0.6},${top - 84} Q${cx + jw * 0.88},${top - 80} ${cx + jw * 0.9},${top - 60} L${cx + jw * 0.92},${top + 8} Q${cx},${top + 24} ${cx - jw * 0.92},${top + 8} Z`;
  s += `<g transform="rotate(${n(lidUp * 8)} ${cx + jw * 0.92} ${top + 8}) translate(0,${n(hit * 0 + (slap > 0.5 ? (1 - after) * 5 : 0))})">`;
  if (lidUp > 0.02) s += `<path d="M${cx - jw * 0.9},${top + 10} Q${cx},${top + 26} ${cx + jw * 0.9},${top + 10} L${cx + jw * 0.84},${top + 30} L${cx - jw * 0.84},${top + 30} Z" fill="${HOPE.flame}" opacity="${n(lidUp * 0.85)}"/>`;
  s += `<path d="${lidD}" fill="#3a2a2a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/><path d="M${cx + jw * 0.3},${top - 86} L${cx + jw * 0.6},${top - 84} Q${cx + jw * 0.88},${top - 80} ${cx + jw * 0.9},${top - 60} L${cx + jw * 0.92},${top + 8} Q${cx + jw * 0.6},${top + 16} ${cx + jw * 0.36},${top + 19} Z" fill="#241a1c"/><path d="M${cx - jw * 0.9},${top - 22} Q${cx},${top - 6} ${cx + jw * 0.9},${top - 22}" stroke="#5a4646" stroke-width="5" fill="none"/><path d="M${cx - jw * 0.8},${top - 62} Q${cx - jw * 0.5},${top - 72} ${cx - jw * 0.2},${top - 72}" stroke="#7a6666" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${blob(ring(cx - jw * 0.36, top - 40, 22, 4, 7, 0.2, 0.6))}" fill="#2a1e20"/><path d="${blob(ring(cx + jw * 0.5, top - 34, 14, 6, 7, 0.2, 0.6))}" fill="#1c1416"/><path d="${blob(ring(cx - jw * 0.7, top - 6, 9, 8, 6, 0.3))}" fill="#a85a30"/><path d="${blob(ring(cx + jw * 0.12, top - 52, 6, 9, 6, 0.3))}" fill="#a85a30"/>`;
  s += `<circle cx="${cx}" cy="${top - 108}" r="11" fill="#3a2a2a" stroke="${INK}" stroke-width="5"/></g></g>`;
  // --- the kid's hand: up from the lower left, fingers to the lid's edge; it jumps away at the slap
  const kS = 15, kT = { x: cx - jw * 0.92 - 108, y: top + 86 }, kFrom = { x: -80, y: 1560 }, flee = ease(clamp((slap - 0.42) / 0.3), "out");
  const kw = { x: lerp(lerp(kFrom.x, kT.x, ease(reach, "out")), kT.x - 210, flee), y: lerp(lerp(kFrom.y, kT.y, ease(reach, "out")), kT.y + 150, flee) - lidUp * 14 }, kAng = lerp(-52, -34, reach) - flee * 22;
  const kShape = flee > 0.2 ? blendHand(HANDS.reach, HANDS.open, flee) : blendHand(HANDS.reach, HANDS.pinch, clamp((reach - 0.6) / 0.4) * 0.55);
  const kElb = { x: kw.x - 330, y: kw.y + 420 }, kd = `M${n(kElb.x)},${n(kElb.y)} L${n(kw.x - 16)},${n(kw.y + 22)}`;
  let kid = stroke(kd, INK, 8.4 * kS + 10) + stroke(kd, "#e8476a", 8.4 * kS) + stroke(kd, "#bd2f50", 2.6 * kS, `transform="translate(${n(2.2 * kS)},${n(1.6 * kS)})"`);
  for (let i = 1; i < 6; i++) { const u = i / 6.4, px = lerp(kElb.x, kw.x, u), py = lerp(kElb.y, kw.y, u); kid += `<path d="M${n(px - 3.6 * kS)},${n(py - 2.6 * kS)} q${n(3.4 * kS)},${n(0.2 * kS)} ${n(6.6 * kS)},${n(5 * kS)}" stroke="#a8284a" stroke-width="3.4" fill="none"/>`; }   // quilting
  kid += stroke(`M${n(lerp(kElb.x, kw.x, 0.9))},${n(lerp(kElb.y, kw.y, 0.9))} L${n(kw.x - 6)},${n(kw.y + 8)}`, INK, 8.9 * kS + 10, `stroke-linecap="butt"`) + stroke(`M${n(lerp(kElb.x, kw.x, 0.9))},${n(lerp(kElb.y, kw.y, 0.9))} L${n(kw.x - 6)},${n(kw.y + 8)}`, "#a8284a", 8.9 * kS, `stroke-linecap="butt"`);
  kid += hand(kw.x, kw.y, kAng, kShape, { skin: "#f3cdb0", shade: "#e2b89c", nail: "#fff0e4" }, kS, 1, { detail: true, lw: 0.34, w: 2.5 });
  // --- Grandma's hand: down from the upper right, flat on the lid
  const gS = 19, gT = { x: cx + jw * 0.98, y: top - 112 }, gFrom = { x: 1080, y: 210 }, gw = { x: lerp(gFrom.x + 260, gT.x, hit), y: lerp(gFrom.y - 240, gT.y, hit) + (slap > 0.5 ? Math.sin(after * 9) * (1 - after) * 10 : 0) }, gAng = lerp(150, 176, hit);
  const gElb = { x: gw.x + 520, y: gw.y - 250 + hit * 60 }, gd = `M${n(gElb.x)},${n(gElb.y)} L${n(gw.x + 30)},${n(gw.y - 12)}`;
  let gran = "";
  if (slap > 0.01) {
    gran += stroke(gd, INK, 10.4 * gS + 10) + stroke(gd, "#2b2f6b", 10.4 * gS) + stroke(gd, "#20234f", 3.2 * gS, `transform="translate(0,${n(3.2 * gS)})"`);
    gran += `<g transform="translate(${n(gw.x + 46)},${n(gw.y - 18)}) rotate(${n(gAng + 180)})"><ellipse rx="${n(2.4 * gS)}" ry="${n(5.9 * gS)}" fill="#f2a93b" stroke="${INK}" stroke-width="5"/><ellipse cx="${n(-0.5 * gS)}" rx="${n(1.1 * gS)}" ry="${n(4.3 * gS)}" fill="#c9821c"/></g>`;
    gran += hand(gw.x, gw.y, gAng, blendHand(HANDS.open, HANDS.flat, hit), { skin: "#e6bf9e", shade: "#c09078", nail: "#f6e6d8" }, gS, -1, { detail: true, lw: 0.28, w: 2.4 });
    // the years in it: tendons and two spots, placed by hand
    const [tx, ty] = [gw.x, gw.y], gr = (lx, ly) => { const [a, b] = rot2(lx * gS, -ly * gS, gAng); return [tx + a, ty + b]; };
    for (const [a, b] of [[[1, -2], [7, -2.8]], [[1, 0], [7.4, -0.4]], [[1, 2], [7, 2.2]]]) { const p0 = gr(...a), p1 = gr(...b); gran += `<path d="M${n(p0[0])},${n(p0[1])} L${n(p1[0])},${n(p1[1])}" stroke="#c09078" stroke-width="3" stroke-linecap="round" opacity="0.8"/>`; }
    for (const [a, r] of [[[3.4, 1.2], 7], [[5.6, -1.6], 5]]) { const p0 = gr(...a); gran += `<path d="${blob(ring(p0[0], p0[1], r, 3, 6, 0.3))}" fill="#b98466" opacity="0.7"/>`; }
    if (slap > 0.5 && after < 0.6) for (let i = 0; i < 6; i++) { const a0 = (-160 + i * 28 + jit(i, 6)) * Math.PI / 180, r0 = 250 + after * 110, r1 = r0 + 50 * (1 - after); gran += `<path d="M${n(cx + Math.cos(a0) * r0)},${n(top - 60 + Math.sin(a0) * r0 * 0.5)} L${n(cx + Math.cos(a0) * r1)},${n(top - 60 + Math.sin(a0) * r1 * 0.5)}" stroke="#fff3d2" stroke-width="${n(9 * (1 - after))}" stroke-linecap="round"/>`; }
  }
  return s + kid + gran;
}

// the hero candle jar on a staff: the same glass, tin cap, cream candle and Hope-coloured flame as the ending, drawn small.
// a = centre of the glass (px), h = glass height (px). The bail is fixed to the neck; the cap sits under it.
export function heroJar(a, h, t, fl = 0.9) {
  const k = h / 630, cx = 560, top = 760, jw = 215, jh = 600, cy0 = top + jh * 0.9, cw = 62, chh = 250;
  const fk = fl * (1 + 0.06 * Math.sin(t * 21) + 0.04 * Math.sin(t * 33 + 1)) * (0.88 + 0.12 * hash(Math.floor(t * 12) * 5.3 + 0.7));
  const gl = `M${cx - jw * 0.82},${top} Q${cx - jw * 1.06},${top + jh * 0.5} ${cx - jw * 0.86},${top + jh * 0.93} Q${cx},${top + jh * 1.05} ${cx + jw * 0.86},${top + jh * 0.93} Q${cx + jw * 1.06},${top + jh * 0.5} ${cx + jw * 0.82},${top} Z`;
  let s = `<g transform="translate(${n(a.x)},${n(a.y)}) scale(${k.toFixed(4)}) translate(${-cx},${-(top + 315)})">`;
  for (const sg of [-1, 1]) s += `<path d="M${cx},${top - 190} L${n(cx + sg * jw * 0.86)},${top + 6}" stroke="${INK}" stroke-width="12"/><path d="M${cx},${top - 190} L${n(cx + sg * jw * 0.86)},${top + 6}" stroke="#8a8090" stroke-width="6"/>`;
  s += `<path d="${gl}" fill="#1c1a48"/>` + lightBlobs({ x: cx, y: top + jh * 0.46, s: 100 }, [4.6, 3, 1.8], HOPE.glow, [0.16 * fk, 0.22 * fk, 0.3 * fk], 17) + `<path d="${gl}" fill="#cfe6ff" opacity="0.2"/><path d="${blob(ring(cx, top + jh * 0.5, jw * 0.72, 9, 12, 0.06, 1.2))}" fill="${HOPE.glow}" opacity="${n(0.35 * fk)}"/>`;
  s += `<path d="M${cx - cw},${cy0} L${cx - cw + 3},${cy0 - chh} Q${cx},${cy0 - chh - 16} ${cx + cw - 2},${cy0 - chh + 4} L${cx + cw},${cy0} Q${cx},${cy0 + 16} ${cx - cw},${cy0} Z" fill="#fff4e0" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
  for (const [dx, len, wd] of [[-40, 92, 15], [24, 126, 14]]) s += `<path d="M${cx + dx - wd / 2},${cy0 - chh + 2} L${cx + dx - wd / 2},${cy0 - chh + len} Q${cx + dx},${cy0 - chh + len + wd * 1.3} ${cx + dx + wd / 2},${cy0 - chh + len} L${cx + dx + wd / 2},${cy0 - chh + 2} Z" fill="#fffaf0" stroke="#d8c09a" stroke-width="3"/>`;
  s += `<path d="M${cx},${cy0 - chh - 4} q-4,-18 3,-34" stroke="#1a1218" stroke-width="7" fill="none" stroke-linecap="round"/>`;
  const fy = cy0 - chh - 34, fh = 190 * fk, fw = 54 * fk, lean = Math.sin(t * 7) * 8;
  s += `<path d="M${n(cx + 3 + lean)},${n(fy - fh)} Q${n(cx + 3 + fw)},${n(fy - fh * 0.3)} ${cx + 3},${fy + 10} Q${n(cx + 3 - fw)},${n(fy - fh * 0.3)} ${n(cx + 3 + lean)},${n(fy - fh)} Z" fill="${HOPE.flame}" stroke="${HOPE.edge}" stroke-width="6" stroke-linejoin="round"/>`;
  s += `<path d="${gl}" fill="none" stroke="#e9f3ff" stroke-width="9" stroke-linejoin="round"/><path d="M${cx - jw * 0.74},${top + 60} Q${cx - jw * 0.92},${top + jh * 0.45} ${cx - jw * 0.78},${top + jh * 0.76}" stroke="#ffffff" stroke-width="15" fill="none" stroke-linecap="round" opacity="0.55"/>`;
  const lidD = `M${cx - jw * 0.92},${top + 8} L${cx - jw * 0.9},${top - 62} Q${cx - jw * 0.86},${top - 80} ${cx - jw * 0.6},${top - 84} L${cx - 26},${top - 88} L${cx - 22},${top - 104} L${cx + 22},${top - 104} L${cx + 26},${top - 88} L${cx + jw * 0.6},${top - 84} Q${cx + jw * 0.88},${top - 80} ${cx + jw * 0.9},${top - 60} L${cx + jw * 0.92},${top + 8} Q${cx},${top + 24} ${cx - jw * 0.92},${top + 8} Z`;
  s += `<path d="${lidD}" fill="#3a2a2a" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/><path d="M${cx - jw * 0.9},${top - 22} Q${cx},${top - 6} ${cx + jw * 0.9},${top - 20}" stroke="#241a1c" stroke-width="10" fill="none"/>`;
  return s + `</g>`;
}
