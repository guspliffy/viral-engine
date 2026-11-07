import * as THREE from "three";
import { taperedTube } from "./geo.js";

const SEAM = 0.05;   // where the shut lids meet: this far (radians) below the front of the eye
const _gz = new THREE.Vector3(1, 1.1, 0.5), _q = new THREE.Quaternion(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _t = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const _mu = new THREE.Matrix4(), _ml = new THREE.Matrix4(), _v = new THREE.Vector3(), _w = new THREE.Vector3();
// a blink over a big iris (face._deepen): the share of the eye's outline whose iris must stay under the lids, and the
// closure past which a blinking eye draws no iris at all
const EDGE = 0.85, SHUT = 0.93;

// Eyes that stay readable (quality plan item 4; storyboard "rig": { "eyes": 2 }, off by default so old clips and the
// golden stills render as before). Gaze and lids work together:
//   (a) the pupil is kept inside the opening the lids leave: a look that would push it under a lid is held back until
//       at least READ of the pupil shows (or, in a squint narrower than the pupil, as much as the slit allows), the
//       same way for both eyes so they keep looking at one point;
//   (b) the upper lid follows the gaze: down by about half of the pupil's drop on a downward look, up a little on an
//       upward one, as real lids do (the old rule moved it 0.14 of a closure per unit of look);
//   (c) gaze shifts are saccades (lookProgress, used by timeline.js): 2-3 frames, a small overshoot, settled, held;
//   (d) each face records how much of each pupil shows (face.shown, read by the layout), blinks included.
// Squints and blinks are left alone: the limit reads the lids without the blink, and a slit keeps the pupil where it
// shows most instead of pushing it out of the eye.
let EYES = 1;
export const setFaceRig = (sb) => { EYES = Number(sb?.rig?.eyes) || 1; };
const READ = 0.65;           // share of the pupil a look keeps on show (the layout warns under 0.6)
const FOLLOW_DOWN = 0.5, FOLLOW_UP = 0.2;   // how far the upper lid's edge follows the pupil's drop / rise

// (c) how far a look action has got at time t (0 at its start, 1 settled), in place of its ease `e`. With "rig":
// { "eyes": 2 } a look of 0 < dur <= 0.45 s is a saccade: the eyes get there in 2 frames (3 for a big jump across the
// eye), overshoot by 6 % and settle back over 0.1 s, then hold. A longer look is a deliberate slow pan (following
// something that moves) and keeps its ease; dur 0 stays a cut. `from` is the look before this action.
export function lookProgress(sb, a, t, e, from) {
  if ((Number(sb?.rig?.eyes) || 1) < 2) return e;
  const d = a.dur ?? 0.3; if (!(d > 0) || d > 0.45) return e;
  const u = t - a.at; if (u <= 0) return 0;
  const amp = Math.hypot(a.to[0] - from[0], a.to[1] - from[1]), T = (2 + clamp01(amp / 1.2)) / 30;
  if (u < T) { const q = u / T; return 1.06 * (1 - (1 - q) ** 3); }
  const v = clamp01((u - T) / 0.1); return 1 + 0.06 * (1 - v * v * (3 - 2 * v));
}

// Expression presets. Every value is a plain number so two expressions can be blended.
//   tilt   brow rotation: + inner ends up (kind, worried), - inner ends down (angry, focused)
//   browY  extra brow height        curve  mouth: -1 frown .. 1 smile
//   open   mouth opening 0..1       eye    eye openness (1 normal, <1 squint, >1 wide)
//   pupil  pupil size               smirk  one mouth corner up (+ right side)
//   raise  extra height on the left brow (the cocky eyebrow)
export const EXPRESSIONS = {
  kind:      { tilt: 0.18, browY: 0.0,   curve: 0.6,  open: 0.0,  eye: 1.0,  pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  happy:     { tilt: 0.22, browY: 0.02,  curve: 0.9,  open: 0.35, eye: 0.95, pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  delighted: { tilt: 0.3,  browY: 0.035, curve: 1.0,  open: 0.6,  eye: 1.12, pupil: 1.1,  smirk: 0.0, raise: 0.0 },
  eager:     { tilt: 0.26, browY: 0.03,  curve: 0.8,  open: 0.25, eye: 1.05, pupil: 1.05, smirk: 0.0, raise: 0.0 },
  cocky:     { tilt: -0.15, browY: 0.0,  curve: 0.45, open: 0.0,  eye: 0.85, pupil: 1.0,  smirk: 0.7, raise: 0.03 },
  smug:      { tilt: -0.08, browY: 0.0,  curve: 0.45, open: 0.0,  eye: 0.68, pupil: 1.0,  smirk: 0.6, raise: 0.0 },
  shocked:   { tilt: 0.38, browY: 0.055, curve: -0.1, open: 0.95, eye: 1.18, pupil: 0.62, smirk: 0.0, raise: 0.0 },
  sad:       { tilt: 0.48, browY: -0.01, curve: -0.6, open: 0.0,  eye: 0.85, pupil: 1.05, smirk: 0.0, raise: 0.0 },
  evil:      { tilt: -0.5, browY: 0.0,   curve: 0.85, open: 0.4,  eye: 0.8,  pupil: 0.9,  smirk: 0.0, raise: 0.0 },
  focused:   { tilt: -0.36, browY: -0.01, curve: 0.1, open: 0.0,  eye: 0.8,  pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  stern:     { tilt: -0.45, browY: -0.01, curve: -0.2, open: 0.0, eye: 0.85, pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  // full-strength reactions (Jonny, 29 Oct: "more angry and annoyed", and his eyebrow sheet): the brows angle in and
  // stay above the eyes, the lids squint (acting.mjs mood sets them), the mouth carries the rest
  annoyed:   { tilt: -0.25, browY: -0.03, curve: -0.2, open: 0.0,  eye: 0.74, pupil: 1.0,  smirk: 0.18, raise: 0.03 },
  angry:     { tilt: -0.35, browY: -0.03, curve: -0.6, open: 0.06, eye: 0.74, pupil: 0.9,  smirk: 0.0, raise: 0.0 },
  deadpan:   { tilt: 0.0,  browY: -0.015, curve: 0.0, open: 0.0,  eye: 0.6,  pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  serene:    { tilt: 0.1,  browY: 0.0,   curve: 0.35, open: 0.0,  eye: 0.06, pupil: 1.0,  smirk: 0.0, raise: 0.0 },   // eyes closed, content
  dizzy:     { tilt: 0.42, browY: 0.02,  curve: -0.35, open: 0.3, eye: 1.08, pupil: 0.45, smirk: 0.4, raise: 0.02 },
  // panic (Jonny 7 Nov, the plane: "no panic, the situation appears quite chill"): brows shot up and in, eyes wide with
  // a small iris in a big white (shrink), the mouth a big wide yell, corners down (wide keeps it broad through the
  // speech's vowels; pair it with a face corner of about -0.6)
  terrified: { tilt: 0.6,  browY: 0.07,  curve: -0.45, open: 0.8, eye: 1.3,  pupil: 0.5,  smirk: 0.0, raise: 0.0, wide: 1, shrink: 0.4 },
};
// keys only one side has (pucker: pursed lips, Dragon vs. the Candle) blend from or to 0
export const blendExpr = (a, b, t) => { const o = {}; for (const k in a) o[k] = a[k] + ((b[k] ?? 0) - a[k]) * t; for (const k in b) if (!(k in a)) o[k] = b[k] * t; return o; };

// a juice splat on a cheek (c.juiceL / c.juiceR, Vampire vs Juice Box): an irregular purple blob, a few flecks and two
// short runs down the cheek, with a wet highlight
function juiceTexture(color) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), col = new THREE.Color(color), rgb = (k) => `rgb(${[col.r, col.g, col.b].map((v) => Math.round(255 * Math.min(1, v * k))).join(",")})`;
  g.fillStyle = rgb(1);
  for (const [x, y, r] of [[60, 56, 22], [76, 50, 15], [48, 66, 13], [70, 70, 14], [56, 42, 11]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  for (const [x, y, r] of [[96, 36, 5], [26, 44, 4], [100, 66, 3.5], [34, 84, 3]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  // two runs: a narrow streak ending in a round drop
  for (const [x, y0, y1, w] of [[52, 70, 100, 6], [72, 76, 94, 5]]) { g.fillRect(x - w / 2, y0, w, y1 - y0); g.beginPath(); g.arc(x, y1, w * 0.85, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "rgba(255,255,255,0.55)"; g.beginPath(); g.ellipse(52, 46, 7, 4, -0.6, 0, Math.PI * 2); g.fill();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

function blushTexture(color, k = 1) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  const col = new THREE.Color(color); const rgb = `${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0}`;
  gr.addColorStop(0, `rgba(${rgb},${Math.min(1, 0.45 * k)})`); gr.addColorStop(0.55, `rgba(${rgb},${Math.min(1, 0.22 * k)})`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// A face drawn onto any surface. `place(u, v)` maps face coordinates (u: -1 left .. 1 right,
// v: -1 chin .. 1 forehead) to { pos, normal } on the host surface, in the host group's space.
const NO_CTL = { lidL: 0, lidR: 0, browL: 0, browR: 0, tiltL: 0, tiltR: 0, cornerL: 0, cornerR: 0, press: 0, tearL: 0, tearR: 0, fangs: 0, juiceL: 0, juiceR: 0 };

export class Face {
  // eye: the character's eye design (character file face.eye): depth (how far the eye stands out of the face),
  // iris (radius as a share of the eye), lash (lid line thickness), flick (outer-corner flick, 0 none), tilt (lid angle:
  // + lifts the outer corner, - drops it), glints (1 or 2 catch lights), oval (height to width, 1.24 default: a tall oval),
  // corner (a lower-lash tick at the outer corner, 0 none .. 1), glintSize (the catch light's size, 1 default)
  // freckles ({ n, color, seed }, castLook "sheet"): a few quiet freckles over the cheeks, a darker warm shade of the skin
  constructor({ place, size = 1, iris = "#4a2a14", cheeks = "#ff6f6f", ink = "#2a1a14", brow = null, lids = null, eye = {} }) {
    this.place = place; this.size = size;
    this.group = new THREE.Group();
    const E = { depth: 0.31, iris: 0.6, lash: 1, flick: 1, corner: 0, tilt: 0, glints: 1, shine: 1, oval: 1.12 / 0.9, ...eye };
    this.eyeStyle = E;
    // the character's brow design (face.browShape): arch height, inner and outer ends (face u), thickness, taper, tip, lift
    this.browStyle = { arch: 0.05, inner: 0.19, outer: 0.55, thick: 0.85, ...(arguments[0].browShape || {}) };
    this.inkMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.55 });
    this.browMat = brow ? new THREE.MeshStandardMaterial({ color: brow, roughness: 0.9 }) : this.inkMat;   // white brows for the Norse god
    // browShape.cap (castLook "sheet"): the brow tube's open ends are drawn from inside too, so a brow seen end-on in a
    // three-quarter view no longer shows a skin-coloured notch at its inner tip
    if (this.browStyle.cap) { this.browMat = this.browMat === this.inkMat ? this.inkMat.clone() : this.browMat; this.browMat.side = THREE.DoubleSide; }
    // face.mouth { ink, thick } (Pebble, 6 Nov 2026; default-preserving): the closed smile's own colour (a warm brown
    // instead of the ink) and a thickness factor, so the smile can be finer without scaling the whole face
    const MO = arguments[0].mouth || {}; this.mouthStyle = { thick: MO.thick ?? 1 };
    this.smileMat = MO.ink ? new THREE.MeshStandardMaterial({ color: MO.ink, roughness: 0.55 }) : this.inkMat;
    this.mouthMat = new THREE.MeshStandardMaterial({ color: "#6a2228",   // shallow, warm dark red: never a black hole
       roughness: 0.6, side: THREE.DoubleSide });
    // a warm off-white, matte enough that the one painted catch light is the only highlight
    const white = new THREE.MeshStandardMaterial({ color: E.white ?? "#fbf5ea", roughness: 0.45 });   // eye.white: a warmer, subdued white (Pebble)
    const irisM = new THREE.MeshStandardMaterial({ color: iris, roughness: 0.4 });
    // eye.irisShade: the anime iris, painted top to bottom: dark under the upper lid, the colour, then a bright warm
    // band low in the iris (reads in extreme close-ups; off by default so older clips keep their eyes)
    if (E.irisShade) {
      const cv = document.createElement("canvas"); cv.width = 4; cv.height = 256; const g = cv.getContext("2d"), col = new THREE.Color(iris);
      const sh = (k, w = 0) => `rgb(${[col.r, col.g, col.b].map((v) => Math.round(255 * Math.min(1, v * k + w))).join(",")})`;
      const gr = g.createLinearGradient(0, 0, 0, 256);   // canvas top = the sphere's top (v 1)
      gr.addColorStop(0, sh(0.7)); gr.addColorStop(0.38, sh(0.8)); gr.addColorStop(0.5, sh(1.25, 0.02)); gr.addColorStop(0.6, sh(1.9, 0.08)); gr.addColorStop(0.68, sh(2.6, 0.16)); gr.addColorStop(1, sh(1.6, 0.05));
      g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      irisM.color.set("#ffffff"); irisM.map = tex;
    }
    const pupilM = new THREE.MeshStandardMaterial({ color: "#0b0a0e", roughness: 0.4 });
    const glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    // the drawn look's pencil hatching stays off the eyes and the ink (looks.js, castLook "art")
    for (const m of [white, irisM, pupilM, this.inkMat, this.browMat, this.mouthMat, this.smileMat]) m.userData.noHatch = true;
    // shine 0: the eye's own material response is switched off (fully rough, no reflections, no rim in the looks),
    // so the painted catch light (glints) is the only highlight; with both off the eye has no highlight at all
    if (E.shine === 0) for (const m of [white, irisM, pupilM]) { m.roughness = 1; m.envMapIntensity = 0; m.userData.noShine = true; }
    this.eyes = [-1, 1].map((side) => {
      const root = new THREE.Group(); // placed on the surface, z = out of the surface
      const lid = new THREE.Group(); root.add(lid); // scaled for blinks and squints (no lids) or widened (wide eyes)
      const r = 0.08 * size, D = E.depth, ri = E.iris;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), white); ball.scale.set(0.9, 0.9 * E.oval, D); lid.add(ball);
      const look = new THREE.Group(); lid.add(look);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(r * ri, 28, 20), irisM); ir.scale.set(1, 1.12, 0.35); ir.position.z = r * (D - 0.16); look.add(ir);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(r * ri * 0.55, 24, 16), pupilM); pu.scale.set(1, 1.1, 0.3); pu.position.z = r * (D - 0.07); look.add(pu);
      // one designed catch light, the same way in both eyes (up and to the right); a second, small one is optional
      const g1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.14 * (E.glintSize ?? 1), 14, 10), glint); g1.scale.set(1, 1.1, 0.5); g1.position.set(r * ri * 0.36, r * ri * 0.5, r * (D + 0.03)); look.add(g1);
      const glints = E.glints >= 1 ? [g1] : []; g1.visible = E.glints >= 1;   // glints 0: no catch light (a diagnostic)
      if (E.glints > 1) { const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.07, 10, 6), glint); g2.scale.set(1, 1, 0.5); g2.position.set(-r * ri * 0.3, -r * ri * 0.36, r * (D + 0.02)); look.add(g2); glints.push(g2); }
      // the lid line, tapered at both ends, thickest over the pupil, with the character's outer-corner flick
      const lineR = (t) => r * E.lash * (0.016 + 0.07 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.96))), 0.75));
      let lidPivot = null, lowPivot = null, crease = null, lash;
      if (lids) {
        // real upper lids (`lids`: the skin material): a skin shell over a stable eye that rolls down from the top, the
        // lid line riding its edge. Squints, blinks and the gaze move the lid; the eye itself never changes shape.
        // just deep enough to cover the iris and the catch light, so a closed eye stays a shallow lid, not a capsule
        const space = new THREE.Group(); space.scale.set(0.9, 0.9 * E.oval, (D + 0.14) / 1.05); space.userData.z0 = space.scale.z; lid.add(space);
        lidPivot = new THREE.Group(); lidPivot.rotation.order = "ZYX"; space.add(lidPivot);
        const shell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lids); lidPivot.add(shell);
        // the edge of the shell is the circle y = 0; its front half (z > 0) is the lid line
        const pts = [];
        for (let k = 0; k <= 10; k++) { const ph = 0.12 + k * ((Math.PI - 0.24) / 10), x = Math.cos(ph) * side; pts.push(new THREE.Vector3(-x * r * 1.07, -0.015 * r, Math.sin(ph) * r * 1.07)); }
        if (E.flick > 0) pts.push(new THREE.Vector3(side * r * (1.07 + 0.15 * E.flick), -0.015 * r, r * (0.55 - 0.21 * E.flick)));
        pts.sort((a, b) => side * (a.x - b.x));   // inner corner first, so the line thickens towards the outer side
        lash = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 44, 8, lineR), this.inkMat);
        lidPivot.add(lash);
        // corner (face.eye.corner, 0 none): a short lower-lash tick hugging the outer bottom of the eye, like the
        // painted references; it stays put on a blink (the lower lid rises inside it)
        if (E.corner > 0) {
          const cp = [];
          for (let k = 0; k <= 6; k++) { const t = k / 6, az = 1.0 + 0.5 * t, el = -0.5 - 0.4 * E.corner * (1 - t); cp.push(new THREE.Vector3(side * Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r * 1.05)); }
          space.add(new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(cp), 0, 0, 16, 6, (t) => r * E.lash * 0.05 * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * t)), 0.6)), this.inkMat));
        }
        // the lower lid: rises late in a blink to meet the upper one a little below the middle, so the shut eye ends in one
        // downward-curving crease on the front of the eye instead of the upper lid's edge rolling round to the bottom
        lowPivot = new THREE.Group(); space.add(lowPivot);
        // the closed-eye crease: a gently arched tapered line drawn on the shut lid (in the eye's own unscaled frame, so it
        // keeps its width), shown in place of the lid line once the eye is nearly shut
        const cz = (D + 0.14) * 0.32, cp = [];
        for (let i = 0; i <= 10; i++) { const x = -0.92 + i * 0.184, q = 1 - x * x; cp.push(new THREE.Vector3(x * r * 0.9, r * (-0.06 + 0.13 * q), r * (cz * Math.sqrt(Math.max(0, q)) + 0.03))); }
        // it lies only a hair above the shut lid and the skin, so it is drawn pulled towards the camera (polygon offset)
        // to win the depth test where they nearly touch
        if (!this.creaseMat) { this.creaseMat = this.inkMat.clone(); Object.assign(this.creaseMat, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8 }); }
        crease = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(cp), 0, 0, 30, 8, (t) => r * (0.012 + 0.05 * Math.pow(Math.sin(Math.PI * t), 0.7))), this.creaseMat);
        crease.visible = false; root.add(crease);
        lowPivot.add(new THREE.Mesh(new THREE.SphereGeometry(r * 1.0, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), lids));
      } else {
        // no lids (props with faces): the lash sits in the lid group and closes with the eye on a blink
        const pts = [];
        for (let k = 0; k <= 8; k++) { const a = 2.75 - k * (2.55 / 8); pts.push(new THREE.Vector3(side * Math.cos(a) * r * 0.97, Math.sin(a) * r * 1.16 * (E.oval * 0.9 / 1.12) - r * 0.05, r * (0.3 + 0.12 * Math.sin(a)) * D / 0.62)); }
        if (E.flick > 0) pts.push(new THREE.Vector3(side * r * (0.97 + 0.15 * E.flick), r * 0.3, r * 0.2 * D / 0.62));
        lash = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 40, 8, lineR), this.inkMat);
        lid.add(lash);
      }
      // tears (c.tearL / c.tearR): the lower lid turns wet (a pale water band along the bottom of the eye, a bright line
      // on its top edge), then one tear gathers on the lid at the outer side and swells. Drawn flat just in front of the
      // eye in its lid group, so they squint and blink with it and never cover the pupil
      const tear = this._tear(side, r, D, E.oval);
      lid.add(tear.group);
      this.group.add(root);
      return { side, root, lid, look, iris: ir, pupil: pu, lash, lidPivot, lowPivot, space: lids ? lidPivot.parent : null, crease, glints, r, tear };
    });
    const bt = blushTexture(cheeks, arguments[0].blush ?? 1);   // blush: how strong the cheeks are (less for the Reaper and Samurai)
    this.cheeks = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * size, 0.13 * size), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
      this.group.add(m); return { side, m };
    });
    this.juiceColor = arguments[0].juice ?? "#8a33b8";
    this.freckleSpec = arguments[0].freckles || null;
    this.brows = [null, null]; this.mouthLine = null; this.mouthFill = null; this.mouthInner = [];
    this.teethMat = new THREE.MeshStandardMaterial({ color: "#fbf7ee", emissive: "#5a5650", roughness: 0.35 });
    this.tongueMat = new THREE.MeshStandardMaterial({ color: "#e0606a", roughness: 0.55 });
    this.teethMat.userData.noHatch = this.tongueMat.userData.noHatch = true;
    this._lastKey = "";
    this.layout = { eyeU: 0.35, eyeV: 0.32, browV: 0.86, mouthV: -0.12, mouthW: 0.27, cheekU: 0.68, cheekV: -0.06, ...(arguments[0].layout || {}) };   // layout: a character file's face.layout overrides (castLook "board" sets the eyes wider apart)
  }

  // the wet band, its shine line and the tear bead for one eye (in the eye's lid group; x across, y up, z out)
  _tear(side, r, D, oval) {
    const g = new THREE.Group(), rx = r * 0.9, ry = r * 0.9 * oval, zf = r * D + 0.0025;
    if (!this.waterMat) {
      this.waterMat = new THREE.MeshBasicMaterial({ color: "#c4e6fb", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      this.shineMat = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
      this.beadMat = new THREE.MeshBasicMaterial({ color: "#c6e8fb", transparent: true, opacity: 0, depthWrite: false });
      this.beadEdge = new THREE.MeshBasicMaterial({ color: "#7fb4d6", transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide });
    }
    // the band: from the bottom of the eye's outline up to a gently wavy top edge, unit height (scaled per frame)
    const band = (h0) => {
      const sh = new THREE.Shape(), n = 24, top = [];
      for (let i = 0; i <= n; i++) { const a = Math.PI * (1.12 + 0.76 * (i / n)); sh[i ? "lineTo" : "moveTo"](Math.cos(a) * rx * 1.03, Math.sin(a) * ry * 1.03); }
      for (let i = n; i >= 0; i--) { const u = i / n, x = (Math.cos(Math.PI * (1.12 + 0.76 * u)) * rx * 1.03), y = -ry * h0 + Math.sin(u * Math.PI * 3 + side) * r * 0.025; sh.lineTo(x, y); top.push(new THREE.Vector3(x, y, 0)); }
      return { geo: new THREE.ShapeGeometry(sh), top };
    };
    const b = band(0.55), water = new THREE.Mesh(b.geo, this.waterMat); water.position.z = zf; water.renderOrder = 4; g.add(water);
    const shine = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(b.top.slice(3, -3)), 24, r * 0.022, 5, false), this.shineMat);
    shine.position.z = zf + 0.0006; shine.renderOrder = 5; g.add(shine);
    // the bead: a swelling, slightly flattened drop sitting on the lower lid toward the outer corner, with a glint
    const bead = new THREE.Group(); bead.position.set(side * rx * 0.5, -ry * 0.86, zf + 0.002); g.add(bead);
    const body = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 20, 14), this.beadMat); body.scale.set(1.25, 0.9, 0.45); body.renderOrder = 5; bead.add(body);
    const rim = new THREE.Mesh(new THREE.SphereGeometry(r * 0.32, 20, 14), this.beadEdge); rim.scale.set(1.25, 0.9, 0.45); rim.renderOrder = 4; bead.add(rim);
    const gl = new THREE.Mesh(new THREE.SphereGeometry(r * 0.075, 10, 8), this.shineMat); gl.position.set(-side * r * 0.1, r * 0.09, r * 0.05); gl.renderOrder = 6; bead.add(gl);
    for (const o of [water, shine, body, rim, gl]) { o.userData.tear = true; o.castShadow = false; }
    return { group: g, water, shine, bead, body, rim, gl };
  }

  _curveCheek(ch, L, s) {
    const u0 = ch.side * L.cheekU, v0 = L.cheekV, e = 0.01;
    const c = this.place(u0, v0).pos, du = this.place(u0 + e, v0).pos.distanceTo(c) / e, dv = this.place(u0, v0 + e).pos.distanceTo(c) / e;
    const hu = (0.1 * this.size) / du, hv = (0.065 * this.size) / dv, nu = 8, nv = 6, pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = i / nu, b = j / nv, p = this.place(u0 + (a * 2 - 1) * hu * ch.side, v0 + (b * 2 - 1) * hv);
      const q = p.pos.clone().addScaledVector(p.normal, 0.004 * s); pos.push(q.x, q.y, q.z); uv.push(ch.side > 0 ? a : 1 - a, b);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const k = j * (nu + 1) + i; idx.push(k, k + 1, k + nu + 1, k + 1, k + nu + 2, k + nu + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    ch.m.geometry.dispose(); ch.m.geometry = g; ch.m.position.set(0, 0, 0); ch.m.rotation.set(0, 0, 0);
    ch.m.material.side = THREE.DoubleSide; ch.curved = true;
  }

  // freckles (castLook "sheet", the design sheets: "a few quiet freckles"): n small soft dots of uneven size, scattered
  // without a pattern over the upper cheeks and the bridge between the eyes, never on the eyes or the blush's middle.
  // One decal per cheek; the dots come from the character's seed, so they are the same in every clip.
  _freckles(L, s) {
    const { n, color, seed } = this.freckleSpec;
    let st = (seed * 2654435761) >>> 0; const rnd = () => ((st = (st * 1664525 + 1013904223) >>> 0) / 4294967296);
    const col = new THREE.Color(color), hsl = {}; col.getHSL(hsl, THREE.SRGBColorSpace);
    const ink = new THREE.Color().setHSL(hsl.h - 0.015, Math.min(1, hsl.s * 1.05), hsl.l * 0.5, THREE.SRGBColorSpace);
    const hx = ink.getHexString(THREE.SRGBColorSpace), rgb = [0, 2, 4].map((i) => parseInt(hx.slice(i, i + 2), 16)).join(",");
    this.freckles = [-1, 1].map((side, i) => {
      const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
      const k = side < 0 ? Math.floor(n / 2) : Math.ceil(n / 2), pts = [];
      for (let j = 0; j < k * 20 && pts.length < k; j++) {
        const x = 18 + rnd() * 92, y = 30 + rnd() * 64;
        if (pts.every((p) => Math.hypot(p[0] - x, p[1] - y) > 22)) pts.push([x, y, 4.2 + rnd() * 2.6]);
      }
      for (const [x, y, r] of pts) {
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, `rgba(${rgb},0.8)`); gr.addColorStop(0.55, `rgba(${rgb},0.6)`); gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = this._decal(side * (L.cheekU - 0.12), L.cheekV + 0.09, 0.17 * s, 0.11 * s, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 0.0042);
      m.userData.noOutline = true; m.renderOrder = 2;
      return m;
    });
  }

  // a decal laid on the face's surface round (u0, v0), w x h in metres (a juice splat), in the host's space
  _decal(u0, v0, w, h, material, lift = 0.005) {
    const e = 0.01, c = this.place(u0, v0).pos, du = this.place(u0 + e, v0).pos.distanceTo(c) / e, dv = this.place(u0, v0 + e).pos.distanceTo(c) / e;
    const hu = (w / 2) / du, hv = (h / 2) / dv, n = 8, pos = [], uv = [], idx = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const a = i / n, b = j / n, p = this.place(u0 + (a * 2 - 1) * hu, v0 + (b * 2 - 1) * hv), q = p.pos.clone().addScaledVector(p.normal, lift * this.size);
      pos.push(q.x, q.y, q.z); uv.push(a, b);
    }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = j * (n + 1) + i; idx.push(k, k + 1, k + n + 1, k + 1, k + n + 2, k + n + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const m = new THREE.Mesh(g, material); m.renderOrder = 3; this.group.add(m); return m;
  }

  // aim the part along the surface normal, in the host's local space (Object3D.lookAt takes a world target, which
  // turned eyes and cheeks the wrong way whenever a character stood away from the origin)
  _orient(obj, p) { obj.position.copy(p.pos); _m.lookAt(_t.copy(p.pos).add(p.normal), p.pos, _up); obj.quaternion.setFromRotationMatrix(_m); }

  // browShape.clear (metres): how far a brow is lifted, as a whole, so a strip of skin at least that wide shows between
  // its underside and the top of the eye's lid line at every point along it, whatever the expression asks (the brow
  // keeps its angle; it never runs into the eye white or merges with the lid line). The eye is an ellipse on the
  // face (its size in face units measured on the surface, wide eyes taller); points outside its width only need to
  // clear its edge height. Continuous in every control, so a change of expression never snaps the brow.
  _browClear(side, pts, e) {
    const L = this.layout, s = this.size, B = this.browStyle, E = this.eyeStyle, r = 0.08 * s, d = 0.01;
    const o = this.place(side * L.eyeU, L.eyeV).pos;
    const su = this.place(side * (L.eyeU + d), L.eyeV).pos.distanceTo(o) / d, sv = this.place(side * L.eyeU, L.eyeV + d).pos.distanceTo(o) / d;
    const a = (r * 0.9) / su, b = (r * 0.9 * E.oval * Math.max(1, e.eye)) / sv;
    // the brow's widest half-thickness and the lid line's, both in metres
    const need = B.clear + s * B.thick * ((B.tip ?? 0.006) + 0.013) + r * E.lash * 0.086;
    let up = 0;
    for (const [u, v] of pts) {
      const dx = (Math.abs(u) - L.eyeU) / a, top = L.eyeV + b * Math.sqrt(Math.max(0, 1 - dx * dx));
      up = Math.max(up, top + need / sv - v);
    }
    return up;
  }

  _surfLine(pts, lift) {
    // pts: [[u,v],...] in face coords -> points just above the surface
    return pts.map(([u, v]) => { const p = this.place(u, v); return p.pos.clone().addScaledVector(p.normal, lift); });
  }

  // the requested gaze in the eye's own frame (gx, gy in -0.45..0.45 / -0.5..0.5): both pupils aim at one target, the
  // gaze direction in the host's space taken into each eye's frame (the eyes sit on a curved face and point apart, so
  // straight ahead means a little inwards for each). The pupil sits at gx * r * 0.5, gy * r * 0.48 in the lid group.
  _gaze(eye, look) {
    _q.copy(eye.root.quaternion).invert();
    _d.set(look[0] * 0.55, look[1] * 0.45, 1).applyQuaternion(_q);
    return [Math.max(-0.45, Math.min(0.45, _d.x / Math.max(0.3, _d.z))), Math.max(-0.5, Math.min(0.5, _d.y / Math.max(0.3, _d.z)))];
  }

  // the opening the lids leave at closure k (kL: the lower lid's, when it differs), seen from the front of the eye (its lid group, metres, before the group's
  // scale, which the pupil shares): the top (the upper lid's edge less the lid line drawn on it, or the eye white's
  // outline) and the bottom (the lower lid's edge or the white's outline) at 49 points across the eye. Built from the
  // same rotations set() gives the lid shells, so it is the drawn opening seen square on.
  _opening(eye, k, kL = k) {
    const E = this.eyeStyle, r = eye.r, A = 0.945 * r, B = A * E.oval, W = 0.9 * r, H = W * E.oval;
    const sa = Math.sin(-Math.PI / 2 + k * (Math.PI / 2 + SEAM)), tau = eye.side * (E.tilt || 0) * clamp01(k * 4), ct = Math.cos(tau), st = Math.sin(tau);
    const lo = clamp01((kL - 0.5) / 0.37), sb = Math.sin(Math.PI / 2 - lo * lo * (3 - 2 * lo) * (Math.PI / 2 - SEAM));
    const ex = [], ey = [];   // the upper lid's edge: the shell's rim (t across its front half), turned and scaled as drawn
    for (let i = 0; i <= 32; i++) { const t = (Math.PI * i) / 32, c = Math.cos(t), sn = Math.sin(t); ex.push(A * (c * ct + sn * sa * st)); ey.push(B * (c * st - sn * sa * ct)); }
    const top = [], bot = [], up = [];
    for (let j = 0; j <= 48; j++) {
      const x = -W + (2 * W * j) / 48, w = Math.sqrt(Math.max(0, 1 - (x / W) ** 2));
      // ex runs from +A to -A: find the segment that holds x (from the far end, as x grows)
      let m = 31; while (m > 0 && ex[m] < x) m--;
      const q = ex[m] === ex[m + 1] ? 0 : Math.max(0, Math.min(1, (x - ex[m]) / (ex[m + 1] - ex[m]))), edge = ey[m] + (ey[m + 1] - ey[m]) * q;
      const lash = H * E.lash * (0.031 + 0.07 * Math.max(0, Math.cos((Math.PI * x) / (2 * A))) ** 0.75);
      top.push(Math.min(edge - lash, H * w)); bot.push(-H * sb * w); up.push(edge - lash);
    }
    return { top, bot, up, W, H, A, B, sb };
  }

  // how far (metres) the iris (radius R, 1.12 tall, round px, py) shows outside the eye white where no lid covers it:
  // with a big iris (the sheet cast's 0.74) a strong side look pushed it past the corner of the eye, drawn over the skin
  // (the split-the-bill waiter's "glitchy" eye). 0 when it stays in.
  _irisOut(O, px, py, R) {
    let out = 0;
    for (let i = 0; i < 24; i++) {
      const a = (Math.PI * 2 * i) / 24, x = px + R * Math.cos(a), y = py + 1.12 * R * Math.sin(a);
      const inWhite = (x / O.W) ** 2 + (y / O.H) ** 2 <= 1;
      if (inWhite) continue;
      const f = Math.max(0, Math.min(48, ((x + O.W) / (2 * O.W)) * 48)), j = Math.min(47, Math.floor(f)), q = f - j, u = O.up[j] + (O.up[j + 1] - O.up[j]) * q;
      // under the upper lid's shell, or under the lower one (its outline is the white's)
      if (y >= u && (x / O.A) ** 2 + (y / O.B) ** 2 <= 1) continue;
      out = Math.max(out, Math.sqrt((x / O.W) ** 2 + (y / O.H) ** 2) - 1);
    }
    return out * O.W;
  }

  // the share of the pupil (an ellipse rx by ry round px, py) that shows in the opening O, in 12 columns
  _shown(O, px, py, rx, ry) {
    let vis = 0, tot = 0;
    for (let i = 0; i < 12; i++) {
      const xi = ((i + 0.5) / 12) * 2 - 1, h = ry * Math.sqrt(1 - xi * xi), x = px + xi * rx;
      const f = Math.max(0, Math.min(48, ((x + O.W) / (2 * O.W)) * 48)), j = Math.min(47, Math.floor(f)), q = f - j;
      const out = x < -O.W || x > O.W, T = out ? 0 : O.top[j] + (O.top[j + 1] - O.top[j]) * q, Bm = out ? 0 : O.bot[j] + (O.bot[j + 1] - O.bot[j]) * q;
      vis += Math.max(0, Math.min(py + h, T) - Math.max(py - h, Bm)); tot += 2 * h;
    }
    return tot > 0 ? vis / tot : 0;
  }

  // where on a column x the pupil shows most: { py, m } (a coarse scan, then a golden-section refine)
  _best(O, px, rx, ry, r) {
    let bi = 0, bm = -1; const lo = -1.2 * r, step = (2.4 * r) / 24;
    for (let i = 0; i <= 24; i++) { const m = this._shown(O, px, lo + i * step, rx, ry); if (m > bm + 1e-9) { bm = m; bi = i; } }
    let a = lo + Math.max(0, bi - 1) * step, b = lo + Math.min(24, bi + 1) * step; const g = 0.381966;
    for (let n = 0; n < 18; n++) { const c = a + g * (b - a), d = b - g * (b - a); if (this._shown(O, px, c, rx, ry) >= this._shown(O, px, d, rx, ry)) b = d; else a = c; }
    const py = (a + b) / 2, m = this._shown(O, px, py, rx, ry);
    return m >= bm ? { py, m } : { py: lo + bi * step, m: bm };
  }

  // (a) + (b): each eye's lid closure before the blink and its pupil's place, for "rig": { "eyes": 2 }
  _fitEyes(e, look, c) {
    const L = this.layout, s = this.size, E = this.eyeStyle;
    const F = this.eyes.map((eye) => {
      const p = this.place(eye.side * L.eyeU, L.eyeV);
      this._orient(eye.root, { pos: p.pos.clone().addScaledVector(p.normal, -0.012 * s), normal: p.normal });
      const [gx, gy] = this._gaze(eye, look), r = eye.r, pxq = gx * r * 0.5, pyq = gy * r * 0.48;
      // (b) the lid as the face asks (squint and lid control), then its edge moved with the pupil: down by half of a
      // drop, up by a fifth of a rise; the half-lid cap and the floor as before
      const sq = Math.max(0, Math.min(0.95, (1 - e.eye) * 0.85)), own = eye.side < 0 ? c.lidR : c.lidL, k1 = sq + own;
      let kf = k1;
      if (k1 < 1) {
        const span = Math.PI / 2 + SEAM, B = 0.945 * r * E.oval, k0 = Math.max(0, k1);
        const h = B * Math.sin(Math.PI / 2 - k0 * span) + (pyq < 0 ? FOLLOW_DOWN : FOLLOW_UP) * pyq;
        kf = (Math.PI / 2 - Math.asin(Math.max(-1, Math.min(1, h / B)))) / span + (k1 - k0);
      }
      const k = Math.max(0.1, Math.min(1, Math.min(Math.max(0.86, own), kf)));
      // the lower lid rises with a squint of the expression (serene's shut eyes, a hard squint) and with a lid control
      // that closes past the half-lid cap, but not with a droop of the upper lid (a deadpan or sleepy lid control): in the
      // old rule a heavy upper lid also brought the lower one up, and the eye became a slit too narrow for the pupil
      const kL = Math.min(1, sq + (1 - sq) * clamp01((own - 0.86) / 0.14));
      const rx = r * E.iris * 0.55 * e.pupil, ry = rx * 1.08;
      return { eye, r, k, kL, O: this._opening(eye, k, kL), pxq, pyq, rx, ry, R: r * E.iris };
    });
    // up and down at a given place across: moved from the asked height toward where the pupil shows most until READ of
    // it shows (in a slit, 98 % of the most it can)
    const toward = (f, px, from, best, need) => {
      if (this._shown(f.O, px, from, f.rx, f.ry) >= need) return from;
      let a = best, b = from;   // a shows enough, b not
      for (let n = 0; n < 16; n++) { const m = (a + b) / 2; if (this._shown(f.O, px, m, f.rx, f.ry) >= need) a = m; else b = m; }
      return a;
    };
    const fits = (f, px, needX) => {
      const b = this._best(f.O, px, f.rx, f.ry, f.r);
      if (b.m < needX) return false;
      return this._irisOut(f.O, px, toward(f, px, f.pyq, b.py, Math.min(READ, 0.98 * b.m)), f.R) < 0.002 * f.r;
    };
    // across: held back (the same share for both eyes) until the pupil can show READ of itself somewhere on its column,
    // or 90 % of what the middle of the eye allows when the lids are narrower than that
    // and the iris stays inside the eye white wherever no lid covers it
    let fx = 1;
    for (const f of F) {
      if (Math.abs(f.pxq) < 1e-7) continue;
      const needX = Math.min(READ, 0.9 * this._best(f.O, 0, f.rx, f.ry, f.r).m);
      if (fits(f, f.pxq, needX)) continue;
      let a = 0, b = 1;
      for (let n = 0; n < 14; n++) { const m = (a + b) / 2; if (fits(f, m * f.pxq, needX)) a = m; else b = m; }
      fx = Math.min(fx, a);
    }
    // up and down: each eye's own move (toward), then both eyes take the larger move each way, and each is checked in
    // its own lids again (and held in from the corner if the shared move took its iris out)
    for (const f of F) { f.px = fx * f.pxq; const b = this._best(f.O, f.px, f.rx, f.ry, f.r); f.best = b.py; f.need = Math.min(READ, 0.98 * b.m); f.dy = toward(f, f.px, f.pyq, f.best, f.need) - f.pyq; }
    const up = Math.max(0, ...F.map((f) => f.dy)), down = Math.min(0, ...F.map((f) => f.dy));
    for (const f of F) {
      f.py = toward(f, f.px, f.pyq + up + down, f.best, f.need);
      if (this._irisOut(f.O, f.px, f.py, f.R) >= 0.002 * f.r) { let a = 0, b = 1; for (let n = 0; n < 14; n++) { const m = (a + b) / 2; if (this._irisOut(f.O, m * f.px, f.py, f.R) < 0.002 * f.r) a = m; else b = m; } f.px *= a; }
    }
    return F;
  }

  // The iris, pupil and catch light stand in front of the eye white, further than the lid shells reach with the sheet
  // cast's big iris (0.74 of the eye), so a blink's lids closed behind the front of the iris: the lower lid rose
  // behind it and the iris showed over the skin as a dark blob with a jagged edge where it cut the shell (Never Looks
  // Up shark, Phoenix 8.60 s and 8.73 s, a blink on a look down and to the side). During a blink the lid shells are
  // made just deep enough (front to back) that whatever of the iris lies inside the eye's outline stays under them;
  // with no blink nothing changes. The shut crease moves out with them so it stays on the lid.
  _deepen(eye, blink) {
    const S = eye.space.scale, z0 = eye.space.userData.z0;
    S.z = z0; eye.crease.scale.z = 1; eye.look.visible = true;
    if (!(blink > 0.02)) return;   // a held lid (and the last hundredths of a blink easing out) stays as it was
    // shut (the lids have met): nothing of the iris can show, so it is not drawn at all
    if (Math.min(eye.shut, eye.shutLow ?? eye.shut) >= SHUT) { eye.look.visible = false; return; }
    const P = [], L = eye.look.position;
    for (const m of [eye.iris, eye.pupil, ...eye.glints]) {
      if (!m.visible || m.scale.x < 1e-3) continue;
      const R = m.geometry.parameters.radius, sc = m.scale, o = m.position;
      P.push([L.x + o.x, L.y + o.y, L.z + o.z + R * sc.z]);
      for (const th of [0.35, 0.7, 1.05, 1.35]) for (let j = 0; j < 16; j++) {
        const ph = (j / 16) * Math.PI * 2;
        P.push([L.x + o.x + R * sc.x * Math.sin(th) * Math.cos(ph), L.y + o.y + R * sc.y * Math.sin(th) * Math.sin(ph), L.z + o.z + R * sc.z * Math.cos(th)]);
      }
    }
    eye.lidPivot.updateMatrix(); eye.lowPivot.updateMatrix();
    _mu.copy(eye.lidPivot.matrix).invert(); _ml.copy(eye.lowPivot.matrix).invert();
    const RU = eye.r * 1.05 * 0.985, RL = eye.r * 0.985;
    // a point shows in front of a lid: it lies on the lid's side of the shell's rim and outside the shell. Only points
    // inside the eye's outline count: the rim of a big iris out past the side of the eye sits down at the face skin.
    const Q = P.filter((p) => (p[0] / S.x) ** 2 + (p[1] / S.y) ** 2 < (EDGE * RL) ** 2);
    const pokes = (f) => Q.some((p) => {
      _v.set(p[0] / S.x, p[1] / S.y, p[2] / (z0 * f));
      _w.copy(_v).applyMatrix4(_mu); if (_w.y > 0 && _w.lengthSq() > RU * RU) return true;
      _w.copy(_v).applyMatrix4(_ml); return _w.y < 0 && _w.lengthSq() > RL * RL;
    });
    if (!pokes(1)) return;
    let a = 1, b = 2;   // at a something shows, at b nothing does
    for (let n = 0; n < 14; n++) { const m = (a + b) / 2; if (pokes(m)) a = m; else b = m; }
    S.z = z0 * b; eye.crease.scale.z = b;
  }

  // e: expression params, look: [x,y] in -1..1, blink: 0 open .. 1 closed, c: fine controls (timeline.js FACE_KEYS)
  set(e, look = [0, 0], blink = 0, c = NO_CTL) {
    const L = this.layout, s = this.size;
    const fit = EYES >= 2 && this.eyes[0].lidPivot ? this._fitEyes(e, look, c) : null;
    this.shown = [1, 1];
    this.eyes.forEach((eye, ei) => {
      const p = this.place(eye.side * L.eyeU, L.eyeV);
      this._orient(eye.root, { pos: p.pos.clone().addScaledVector(p.normal, -0.012 * s), normal: p.normal });
      if (eye.lidPivot) {
        // closing 0 open .. 1 shut: from the squint, then the blink on top, the lid following the gaze up and down,
        // and the per-eye control (lidR is the character's right eye, at -u)
        let k, kL = null;
        if (fit) { k = fit[ei].k; kL = fit[ei].kL + (1 - fit[ei].kL) * blink; }
        else {
          const sq = Math.max(0, Math.min(0.95, (1 - e.eye) * 0.85)), own = eye.side < 0 ? c.lidR : c.lidL;
          // squints, half-lids and the gaze stop short of shut (a crease only when a lid control asks for 1, or a blink)
          // (the cap rises with the control above 0.86, so a slow close glides shut instead of waiting at 0.86 and popping)
          k = Math.min(Math.max(0.86, own), sq + own - 0.14 * look[1]);
        }
        k = k + (1 - k) * blink;
        // the lid edge never rides up off the top of the eye (at 0 or a raised gaze the lash line vanished behind it)
        k = Math.max(0.1, Math.min(1, k));
        eye.shut = k;
        eye.lidPivot.rotation.x = -Math.PI / 2 + k * (Math.PI / 2 + SEAM);
        const lo = Math.max(0, Math.min(1, ((kL ?? k) - 0.5) / 0.37)), lw = lo * lo * (3 - 2 * lo);   // up before the crease shows, so it never sweeps over it
        eye.lowPivot.rotation.x = Math.PI / 2 - lw * (Math.PI / 2 - SEAM);
        eye.shutLow = kL ?? k;
        // the crease takes over just above the half-lid cap (0.86), so only a blink or a shut lid shows it
        eye.crease.visible = k > 0.87 && (kL ?? k) > 0.87; eye.lash.visible = !eye.crease.visible;
        eye.lidPivot.rotation.z = eye.side * (this.eyeStyle.tilt || 0) * Math.min(1, Math.max(0, k * 4));   // the character's lid angle, as soon as the lid is on the eye
        // the catch lights stand proud of the eye: tuck them away as the lid closes over them
        const gs = 1 - Math.max(0, Math.min(1, (k - 0.55) / 0.3));
        for (const gl of eye.glints) gl.visible = gs > 0.01, gl.scale.setScalar(gs).multiply(_gz);
        // as it shuts the whole eye settles into the face: a closed eye stands out about a third as far as an open one
        // (with the eyes rig, by how shut the eye really is: a held heavy upper lid over an open lower one is a half-open
        // eye, and sinking it sank the eye white under the skin and left the iris poking out of the lid)
        const cl = Math.max(0, Math.min(1, ((kL == null ? k : Math.min(k, kL)) - 0.3) / 0.7));
        eye.lid.scale.set(1 + (e.eye - 1) * 0.25, Math.max(1, e.eye), 1 - 0.7 * cl * cl * (3 - 2 * cl));
      } else {
        const open = Math.max(0.06, e.eye * (1 - blink));
        eye.lid.scale.set(1 + (e.eye - 1) * 0.25, open, 1);
      }
      if (fit) eye.look.position.set(fit[ei].px, fit[ei].py, 0);
      else { const [gx, gy] = this._gaze(eye, look); eye.look.position.set(gx * eye.r * 0.5, gy * eye.r * 0.48, 0); }
      eye.pupil.scale.set(e.pupil, e.pupil * 1.08, 0.3);
      // shrink (0..1, opt-in): the iris draws in, a small dark iris in a big white (terror); its catch light comes in
      // with it. Default 0 leaves every mesh exactly as built.
      const ik = 1 - Math.max(0, Math.min(0.6, e.shrink || 0));
      eye.iris.scale.set(ik, 1.12 * ik, 0.35);
      for (const g of eye.glints) { const o = g.userData.at ??= g.position.clone(); g.position.set(o.x * ik, o.y * ik, o.z); }
      // (d) how much of the pupil shows, seen square on, with the blink (face.shown [right eye, left eye], the layout's
      // measure; eyes without lids count as shown)
      if (eye.lidPivot) {
        const E = this.eyeStyle, rx = eye.r * E.iris * 0.55 * e.pupil, O = this._opening(eye, eye.shut, eye.shutLow), P = eye.look.position;
        this.shown[ei] = Math.round(this._shown(O, P.x, P.y, rx, rx * 1.08) * 1000) / 1000;
        // with the eyes rig the catch light goes under the lid where the lid really reaches it (the old rule tucked it
        // away from closure 0.55 on, wherever the pupil was, so a heavy lid over a lowered pupil lost its sparkle)
        if (fit) {
          const gr = eye.r * 0.14 * (E.glintSize ?? 1) * 1.1, x = P.x + eye.r * E.iris * 0.36, y = P.y + eye.r * E.iris * 0.5;
          const f = Math.max(0, Math.min(48, ((x + O.W) / (2 * O.W)) * 48)), j = Math.min(47, Math.floor(f)), q = f - j;
          const room = Math.min(O.top[j] + (O.top[j + 1] - O.top[j]) * q - y, y - (O.bot[j] + (O.bot[j + 1] - O.bot[j]) * q));
          const gs = clamp01(room / (2 * gr) + 0.5);
          for (const gl of eye.glints) gl.visible = gs > 0.01, gl.scale.setScalar(gs).multiply(_gz);
        }
      }
      if (eye.space) this._deepen(eye, blink);
      // tears: 0..0.5 the band fades in, 0.5..1 the bead swells (the character's right eye is at -u)
      const tk = Math.max(0, Math.min(1, (eye.side < 0 ? c.tearR : c.tearL) || 0)), T = eye.tear;
      const gather = Math.max(0, (tk - 0.5) / 0.5);
      // a closing lid covers the tears with the eye (squeezed shut, nothing of them pokes through)
      const open = 1 - Math.max(0, Math.min(1, ((eye.shut ?? 0) - 0.42) / 0.2));
      T.group.visible = tk > 0.01 && open > 0.02;
      T.group.scale.set(1, 0.4 + 0.6 * open, 1);
      T.bead.scale.setScalar(0.001 + gather);
      T.bead.visible = gather > 0.01;
    });
    if (this.waterMat) {
      const tk = Math.max(c.tearL || 0, c.tearR || 0), wet = Math.min(1, tk / 0.5);
      this.waterMat.opacity = 0.62 * wet; this.shineMat.opacity = 0.95 * wet; this.beadMat.opacity = 0.82; this.beadEdge.opacity = 0.55;
    }
    // blush follows the curve of the face: a flat card on a round body dips under the skin at its edges and shows
    // a hard cut. Built once, in the host's space, from the same surface mapping as the rest of the face.
    for (const ch of this.cheeks) if (!ch.curved) this._curveCheek(ch, L, s);
    if (this.freckleSpec && !this.freckles) this._freckles(L, s);
    // juice splats on the cheeks (juiceR is the character's right cheek, at -u): built the first time one shows
    if ((c.juiceL || c.juiceR) && !this.juices) {
      const tex = juiceTexture(this.juiceColor);
      this.juices = [-1, 1].map((side) => {
        const m = this._decal(side * (L.cheekU - 0.06), L.cheekV + 0.06, 0.15 * s, 0.15 * s, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }), 0.006);
        if (side < 0) m.scale.x = 1;
        return { side, m };
      });
    }
    if (this.juices) for (const sp of this.juices) { const k = Math.max(0, Math.min(1, (sp.side < 0 ? c.juiceR : c.juiceL) || 0)); sp.m.visible = k > 0.01; sp.m.material.opacity = Math.min(1, k * 1.6); }
    // geometry that depends on the expression is rebuilt only when it changes
    // round: the lips rounding on a vowel (speech); pucker: pursed lips set by an expression (blowing out a candle)
    const round = Math.max(e.round || 0, e.pucker || 0);
    const key = [e.tilt, e.browY, e.curve, e.open, e.smirk, e.raise, round, c.browL, c.browR, c.tiltL, c.tiltR, c.cornerL, c.cornerR, c.press, this.browStyle.clear != null ? e.eye : 0, c.fangs || 0, e.wide || 0].join("|");
    if (key === this._lastKey && !globalThis.__noGeomCache) return;
    this._lastKey = key;
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1;
      if (this.brows[i]) { this.group.remove(this.brows[i]); this.brows[i].geometry.dispose(); }
      // browR / tiltR drive the character's right brow (at -u), browL / tiltL the left
      const yb = L.browV + e.browY * 6 + (side < 0 ? e.raise * 6 : 0) + (side < 0 ? c.browR : c.browL) * 0.3, tilt = e.tilt + (side < 0 ? c.tiltR : c.tiltL);
      const B = this.browStyle, inner = B.inner, outer = B.outer;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, u = side * (inner + (outer - inner) * t);
        const arch = Math.sin(t * Math.PI) * B.arch;
        pts.push([u, yb + arch + (1 - t) * tilt * 0.35 - t * tilt * 0.05]);
      }
      if (B.clear != null) { const up = this._browClear(side, pts, e); for (const q of pts) q[1] += up; }
      const curve = new THREE.CatmullRomCurve3(this._surfLine(pts, (B.lift ?? 0.012) * s));
      // thick in the middle, tapering to both ends, like the portraits' brush-stroke brows (browShape.taper: higher is
      // a finer point, tip: the width left at the ends, lift: how far off the skin it sits)
      const g = taperedTube(curve, 0, 0, 20, 8, (t) => s * B.thick * ((B.tip ?? 0.006) + 0.013 * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), B.taper ?? 0.55)));
      this.brows[i] = new THREE.Mesh(g, this.browMat); this.group.add(this.brows[i]);
    }
    if (this.mouthLine) { this.group.remove(this.mouthLine); this.mouthLine.geometry.dispose(); this.mouthLine = null; }
    if (this.mouthFill) { this.group.remove(this.mouthFill); this.mouthFill.geometry.dispose(); this.mouthFill = null; }
    for (const m of this.mouthInner) { this.group.remove(m); m.geometry.dispose(); }
    this.mouthInner = [];
    for (const m of this.fangMeshes || []) { this.group.remove(m); m.geometry.dispose(); }
    this.fangMeshes = [];
    // pressed lips (c.press) close and flatten the mouth and pull it in; mouth corners move on their own (cornerR is the
    // character's right corner, at -u; + up)
    const press = c.press, open = e.open * (1 - press), smile = e.curve * (1 - 0.8 * press);
    // wide (0..1, opt-in, the "terrified" scream): the mouth stays broad as it opens and through the speech's rounding,
    // a big open D of a yell instead of a small round "o" (Never Looks Up ep 2, Jonny 7 Nov: "no panic in the plane")
    const wd = Math.max(0, Math.min(1, e.wide || 0));
    const w = L.mouthW * (1 - (open * 0.35 + round * 0.3) * (1 - wd) - (e.pucker || 0) * 0.2) * (1 + 0.5 * wd) * (1 - 0.28 * press), mv = L.mouthV, n = 14;
    const upper = [], lower = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = -w + 2 * w * t;
      const sm = e.smirk * (t - 0.5) * 0.16 + 0.12 * (c.cornerR * (1 - t) ** 3 + c.cornerL * t ** 3);
      const bow = -Math.sin(t * Math.PI) * smile * 0.13; // smile pulls the middle down
      upper.push([u, mv + bow * (1 - open * 0.6) + sm + open * (0.06 + 0.18 * wd) * Math.pow(Math.sin(t * Math.PI), 1 - 0.3 * wd)]);   // a yell's top lip arches up
      lower.push([u, mv + bow + sm - open * 0.3 * Math.sin(t * Math.PI)]);
    }
    this.corners = { R: upper[0], L: upper[n] };   // face coordinates of the mouth corners (a straw held in the lips follows them)
    // fangs (c.fangs 0..1, a vampire costume): two small white points hanging from the upper lip a third of the way in
    // from each corner, over the lower lip when the mouth is shut
    const fk = Math.max(0, Math.min(1, c.fangs || 0));
    if (fk > 0.01) {
      if (!this.fangMat) this.fangMat = new THREE.MeshStandardMaterial({ color: "#fffaf2", emissive: "#6a6660", roughness: 0.3 });
      for (const t of [0.3, 0.7]) {
        const k = Math.round(t * n), lip = open > 0.04 ? upper[k] : lower[k];
        const [b, tip] = this._surfLine([[lip[0], lip[1] + 0.012], [lip[0], lip[1] - 0.115 * fk]], 0.009 * s);
        const len = b.distanceTo(tip), cone = new THREE.ConeGeometry(0.0135 * s * (0.4 + 0.6 * fk), len, 10);
        cone.rotateX(Math.PI); cone.translate(0, 0, 0);   // apex down the cone's -y
        const m = new THREE.Mesh(cone, this.fangMat);
        m.position.copy(b).lerp(tip, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), tip.clone().sub(b).normalize());
        this.group.add(m); this.fangMeshes.push(m);
      }
    }
    if (open > 0.04) {
      const up = this._surfLine(upper, 0.006 * s), lo = this._surfLine(lower, 0.006 * s);
      const pos = [], idx = [];
      for (let k = 0; k <= n; k++) { pos.push(up[k].x, up[k].y, up[k].z, lo[k].x, lo[k].y, lo[k].z); }
      for (let k = 0; k < n; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      this.mouthFill = new THREE.Mesh(g, this.mouthMat); this.group.add(this.mouthFill);
      // a row of upper teeth under the top lip and a tongue in the bottom of the mouth, once it is open enough to see
      const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      const patch = (k0, k1, f0, f1, lift, mat) => {
        const i0 = Math.round(k0 * n), i1 = Math.round(k1 * n), top = [], bot = [];
        for (let k = i0; k <= i1; k++) { top.push(lerp(upper[k], lower[k], f0(k / n))); bot.push(lerp(upper[k], lower[k], f1(k / n))); }
        const a = this._surfLine(top, lift * s), b = this._surfLine(bot, lift * s), ps = [], ix = [];
        for (let k = 0; k < a.length; k++) ps.push(a[k].x, a[k].y, a[k].z, b[k].x, b[k].y, b[k].z);
        for (let k = 0; k < a.length - 1; k++) { const q = k * 2; ix.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(ps, 3)); pg.setIndex(ix); pg.computeVertexNormals();
        const m = new THREE.Mesh(pg, mat); m.material.side = THREE.DoubleSide; this.group.add(m); this.mouthInner.push(m);
      };
      if (open > 0.06) {
        // they grow in with the opening, so a mouth starting to talk never shows them appearing in one frame
        const ramp = Math.min(1, (open - 0.06) / 0.22), teeth = Math.max(0, Math.min(1, (smile - 0.35) / 0.3)) * Math.max(0, Math.min(1, (open - 0.25) / 0.2)),
          tongue = Math.max(0, Math.min(1, (open - 0.35) / 0.2)), tw = Math.min(0.42, 0.2 + open * 0.3) * ramp * teeth;   // one restrained tooth row, only in a broad smile
        if (tw > 0.005) patch(0.1, 0.9, () => 0.02, (t) => tw * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.35), 0.0075, this.teethMat);
        if (tongue > 0.01) patch(0.22, 0.78, (t) => 1 - 0.42 * tongue * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.22) / 0.56)))), 0.5), () => 0.96, 0.0078, this.tongueMat);
      }
      const ring = [...upper, ...lower.slice().reverse()];
      const curve = new THREE.CatmullRomCurve3(this._surfLine(ring, 0.006 * s), true);
      this.mouthLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0072 * s, 6, true), this.inkMat); this.group.add(this.mouthLine);
    } else {
      const curve = new THREE.CatmullRomCurve3(this._surfLine(lower, 0.005 * s));
      // a closed smile: a brush line, fuller in the middle, fine at the corners
      this.mouthLine = new THREE.Mesh(taperedTube(curve, 0, 0, 32, 8, (t) => s * this.mouthStyle.thick * (0.003 + 0.0065 * (1 + 0.9 * press) * Math.pow(Math.sin(Math.PI * t), 0.8))), this.smileMat); this.group.add(this.mouthLine);
    }
  }
}
