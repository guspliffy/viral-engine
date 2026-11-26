import * as THREE from "three";
import { NOTYET_KINDS } from "./props-notyet.js";

// Kid vs Dad 03 "Square eyes" (25 Nov 2026, task T-props-sqeyes, rough draft): the wall clock, the eye chart and the school ruler.
// Metres, y up, toon look of the gravroom living room (ink #1B1530). Every mark is placed by index, no Math.random, no wall
// clock. Registered in props3d.js as SQEYES_KINDS. Brief: storyboards/series/kid-vs-dad/03-square-eyes/briefs/T-props-sqeyes.md.
//
//   wallclock  a round wall clock, 0.34 across (spec face r 0.146 inside a rim r 0.17), 0.05 deep. ORIGIN: the centre of the BACK face (put
//              it ON the wall at (0.20, 1.55, -2.62), facing +z). Rim = dark wood #5A3A22, 0.025 wide; face cream #F4EBD6; 12 bold ink ticks
//              (12/3/6/9 longer and wider), no numerals; hour hand black #111 0.09 long, minute hand 0.14 long (both with a short tail), a
//              black centre cap. Optional red #C8382E second hand 0.15 long: spec.second 1 (default 0 = off), it runs 1 turn a minute of
//              the clock's own time.
//              PARAM time 0..24 hours (default 20 = 8 pm, tweenable): the hour hand sits at (time % 12) x 30 deg, the minute hand at the
//              fraction of the hour x 360 deg (so 20 = 8:00, 23 = 11:00, 27 = 3:00; 23 -> 27 is a fast spin of 4 turns of the minute hand).
//              Steps 8 -> 11 -> 3 are cuts: c.prop(t, id, { time: 23 }, 0). SEED: propState's own default for `time` is 2.75 (the old
//              clocks), not 20: give the prop spec `time: 20` (or key c.prop(0, id, { time: 20 }, 0)) or a tween starts from 2.75.
//              Left unseeded and unset the clock still shows 20 (a time of exactly 2.75 with no spec.time reads as 20).
//              CLASH: props-notyet.js has an older kind "wallclock" (Potato Desk 10, Not Yet). This file takes the name as the brief asks, but
//              hands any prop with spec.r or a STRING spec.time ("8:55") to that old builder, so those two clips render as before. A new
//              clock: no r, number time.
//              Size 0.34 x 0.34 x 0.05, about 0.4k triangles. Not held.
//   eyechart   a hand-held Snellen-style board, 0.30 wide (x) x 0.42 tall (y) x 0.01 (z), white #FAFAF4, a thin black border, black letters
//              getting smaller top to bottom: E / F P / T O Z / L P E D / P E C F D / E D F C Z P (canvas texture 600 x 840, no random).
//              ORIGIN: the middle of the BOTTOM edge (board x -0.15..0.15, y 0..0.42, z -0.005..0.005). The letters face +z; the back is plain
//              white. HOLD: grips.phone(c, who, CHART, { side, height: 0.2 }) = one glove on the side edge 8 cm up from the bottom (SIZE
//              eyechart { w 0.30, h 0.42, t 0.01 }). In the phone hold the face turns TOWARD the holder at placeFor's default rot; to show
//              the letters to someone in front of the holder, turn it (placeFor(.., { turn: 180 }) or rot) as for ravenphoto / wallcalendar.
//   smallruler a 30 cm school ruler, 0.30 (x) x 0.035 (y) x 0.004 (z), pale wood #E8C88A with a few darker grain strokes, black ticks (a cm
//              tick every 10 mm, a long one at 5 cm steps, a short one at 5 mm) from the top edge, numbers 5 10 15 20 25 30 under them, the
//              printing on the +z face; the back is plain wood. ORIGIN: the middle of the HELD END (the ruler's x 0 end, y 0 = its middle,
//              z 0 = its middle), it runs along +x, the far end at x 0.30. HOLD: grips.thin(c, who, RULER, { from: 0, ... }) = the thumb and
//              index pinch the end (SIZE smallruler { len 0.02, r 0.002 }: from 0 is the origin, the default from 0.6 is 1.2 cm into the
//              width); the director turns the ruler with rot / tip / roll (with the default placeFor rot, roll 75 stands it up pinched at its end, ticks to the camera: proof out/grip-proof-smallruler-roll.png) for what it points at. Do NOT use placeFor's `turn` with it (it swaps the grip side; the bench shows the ruler through the body): placeFor at the holder's yaw points the ruler to the holder's right (world -x for a holder facing +z).
//
// Registry: Object.assign(KINDS, ..., SQEYES_KINDS) in props3d.js.

const DEG = Math.PI / 180;
const C = (hex) => new THREE.Color(hex);
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function add(parent, geo, m, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function decal(parent, geo, m, x, y, z) {
  const o = add(parent, geo, m, x, y, z); o.castShadow = false;
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  return o;
}
// a printed canvas for a flat card: lit like paper (a little self-light so it reads at phone size)
function printed(cv, lift = 0.35) {
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
  const m = new THREE.MeshStandardMaterial({ map: tx, roughness: 0.8, emissive: C("#ffffff"), emissiveMap: tx, emissiveIntensity: lift });
  return m;
}

// ------------------------------------------------------------------------------------------------ the wall clock
const CK = { rim: 0.17, face: 0.146, depth: 0.05, faceZ: 0.038 };
const HOUR_LEN = 0.09, MIN_LEN = 0.14, SEC_LEN = 0.15;
const DEFAULT_TIME = 20, OLD_DEFAULT = 2.75;   // propState seeds `time` at 2.75 when the spec has none

function wallclock(P) {
  const S = P.spec;
  if (S.r != null || typeof S.time === "string") return NOTYET_KINDS.wallclock(P);   // the older clocks (Potato Desk 10, Not Yet)
  const g = new THREE.Group(); P.whole.add(g);
  const wood = std("#5A3A22", { roughness: 0.55 }), faceM = std("#F4EBD6", { roughness: 0.8, emissive: C("#F4EBD6"), emissiveIntensity: 0.25 });
  const ink = std("#111111", { roughness: 0.5 }), red = std("#C8382E", { roughness: 0.5 });
  // the rim: a ring 0.025 wide (r 0.145 .. 0.17) and 0.05 deep, a disc behind the face fills it up to the face plane
  const ring = new THREE.Shape(); ring.absarc(0, 0, CK.rim, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, CK.face - 0.001, 0, Math.PI * 2, true); ring.holes.push(hole);
  add(g, new THREE.ExtrudeGeometry(ring, { depth: CK.depth, bevelEnabled: false, curveSegments: 40 }), wood);
  const discG = new THREE.CylinderGeometry(CK.face, CK.face, CK.faceZ, 40); discG.rotateX(Math.PI / 2); discG.translate(0, 0, CK.faceZ / 2);
  add(g, discG, [wood, faceM, wood]);
  // 12 bold ticks, long at 12 / 3 / 6 / 9
  for (let i = 0; i < 12; i++) {
    const a = i * 30 * DEG, q = i % 3 === 0, len = q ? 0.03 : 0.017, w = q ? 0.012 : 0.008, rr = 0.128 - len / 2;
    const tk = decal(g, new THREE.BoxGeometry(w, len, 0.002), ink, Math.sin(a) * rr, Math.cos(a) * rr, CK.faceZ + 0.001); tk.rotation.z = -a;
  }
  // the hands hang from pivots at the centre: rotation.z = -angle, clockwise from 12
  const hand = (len, w, z, m, tail = 0.02) => { const p = new THREE.Group(); p.position.z = z; g.add(p); const b = add(p, new THREE.BoxGeometry(w, len + tail, 0.003), m, 0, (len - tail) / 2, 0); b.castShadow = false; return p; };
  const hourH = hand(HOUR_LEN, 0.013, CK.faceZ + 0.004, ink), minH = hand(MIN_LEN, 0.008, CK.faceZ + 0.0068, ink), secH = S.second ? hand(SEC_LEN, 0.0035, CK.faceZ + 0.0095, red, 0.03) : null;
  const cap = add(g, new THREE.CylinderGeometry(0.009, 0.009, 0.004, 14), ink, 0, 0, CK.faceZ + 0.0105); cap.rotation.x = Math.PI / 2; cap.castShadow = false;
  return {
    grip: 0,
    apply(ps) {
      const t = typeof ps.time === "number" && !(ps.time === OLD_DEFAULT && S.time == null) ? ps.time : (S.time ?? DEFAULT_TIME);
      const h = ((t % 12) + 12) % 12, frac = ((t % 1) + 1) % 1;
      hourH.rotation.z = -h * 30 * DEG; minH.rotation.z = -frac * 360 * DEG;
      if (secH) secH.rotation.z = -((t * 3600) % 60) * 6 * DEG;
    },
  };
}

// ------------------------------------------------------------------------------------------------ the eye chart
const EC = { w: 0.30, h: 0.42, t: 0.01 };
const ROWS = [["E", 220], ["F P", 140], ["T O Z", 100], ["L P E D", 74], ["P E C F D", 54], ["E D F C Z P", 40]];   // [letters, px height]
function chartCanvas() {
  const W = 600, H = 840, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d");
  x.fillStyle = "#FAFAF4"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "#111111"; x.lineWidth = 6; x.strokeRect(14, 14, W - 28, H - 28);
  x.fillStyle = "#111111"; x.textAlign = "center"; x.textBaseline = "middle";
  let y = 48;
  for (const [row, px] of ROWS) {
    const letters = row.split(" "), step = px * 1.3, cy = y + px / 2;
    x.font = `900 ${px}px Arial, Helvetica, sans-serif`;
    letters.forEach((ch, i) => x.fillText(ch, W / 2 + (i - (letters.length - 1) / 2) * step, cy + px * 0.04));
    y += px + 24;
  }
  return cv;
}
function eyechart(P) {
  const g = new THREE.Group(); P.whole.add(g);
  add(g, new THREE.BoxGeometry(EC.w, EC.h, EC.t), std("#FAFAF4", { roughness: 0.8 }), 0, EC.h / 2, 0);
  decal(g, new THREE.PlaneGeometry(EC.w - 0.002, EC.h - 0.002), printed(chartCanvas()), 0, EC.h / 2, EC.t / 2 + 0.0004);
  return { grip: 0 };
}

// ------------------------------------------------------------------------------------------------ the small ruler
const RL = { len: 0.30, w: 0.035, t: 0.004 };
function rulerCanvas() {
  const W = 1200, H = 140, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
  const x = cv.getContext("2d"), pxcm = W / 30;
  x.fillStyle = "#E8C88A"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(160,110,50,0.35)"; x.lineWidth = 2;   // a few grain strokes by index
  [[0.22, 0.00, 0.31], [0.62, 0.10, 0.38], [0.88, 0.45, 0.80], [0.45, 0.55, 0.92], [0.15, 0.70, 0.35]].forEach(([y0, a, b]) => { x.beginPath(); x.moveTo(a * W, y0 * H + 40); x.lineTo(b * W, y0 * H + 46); x.stroke(); });
  x.strokeStyle = "#111111"; x.fillStyle = "#111111"; x.textAlign = "center"; x.textBaseline = "top";
  for (let mm = 0; mm <= 300; mm += 5) {
    const px = Math.min(W - 3, Math.max(3, mm * pxcm / 10)), cm = mm % 10 === 0, five = mm % 50 === 0;
    x.lineWidth = cm ? 4 : 3; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, five ? 62 : cm ? 46 : 28); x.stroke();
    if (five && mm > 0) { x.font = "bold 40px Arial, Helvetica, sans-serif"; x.fillText(String(mm / 10), Math.min(px, W - 26), 68); }
  }
  return cv;
}
function smallruler(P) {
  const g = new THREE.Group(); P.whole.add(g);
  add(g, new THREE.BoxGeometry(RL.len, RL.w, RL.t), std("#E8C88A", { roughness: 0.7 }), RL.len / 2, 0, 0);
  const cv = rulerCanvas();   // printed on both faces (the back reads the same from behind, so a hold turned either way shows the ticks)
  decal(g, new THREE.PlaneGeometry(RL.len - 0.001, RL.w - 0.001), printed(cv, 0.25), RL.len / 2, 0, RL.t / 2 + 0.0003);
  decal(g, new THREE.PlaneGeometry(RL.len - 0.001, RL.w - 0.001), printed(cv, 0.25), RL.len / 2, 0, -RL.t / 2 - 0.0003).rotation.y = Math.PI;
  return { grip: 0 };
}

export const SQEYES_KINDS = { wallclock, eyechart, smallruler };
