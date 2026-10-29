import * as THREE from "three";
import { taperedTube } from "./geo.js";

const SEAM = 0.05;   // where the shut lids meet: this far (radians) below the front of the eye
const _gz = new THREE.Vector3(1, 1.1, 0.5), _q = new THREE.Quaternion(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _t = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

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
  // full-strength reactions (Jonny, 29 Oct: "should look a bit more angry and annoyed"): the brows do the work, the
  // eyes narrow with them, never the lids over the pupils (that reads as glitched)
  annoyed:   { tilt: -0.45, browY: -0.02, curve: -0.4, open: 0.0, eye: 0.68, pupil: 1.0,  smirk: 0.22, raise: 0.035 },
  angry:     { tilt: -0.7,  browY: 0.0,   curve: -0.75, open: 0.08, eye: 0.82, pupil: 0.85, smirk: 0.0, raise: 0.0 },
  deadpan:   { tilt: 0.0,  browY: -0.015, curve: 0.0, open: 0.0,  eye: 0.6,  pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  serene:    { tilt: 0.1,  browY: 0.0,   curve: 0.35, open: 0.0,  eye: 0.06, pupil: 1.0,  smirk: 0.0, raise: 0.0 },   // eyes closed, content
  dizzy:     { tilt: 0.42, browY: 0.02,  curve: -0.35, open: 0.3, eye: 1.08, pupil: 0.45, smirk: 0.4, raise: 0.02 },
};
export const blendExpr = (a, b, t) => { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; };

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
const NO_CTL = { lidL: 0, lidR: 0, browL: 0, browR: 0, tiltL: 0, tiltR: 0, cornerL: 0, cornerR: 0, press: 0, tearL: 0, tearR: 0 };

export class Face {
  // eye: the character's eye design (character file face.eye): depth (how far the eye stands out of the face),
  // iris (radius as a share of the eye), lash (lid line thickness), flick (outer-corner flick, 0 none), tilt (lid angle:
  // + lifts the outer corner, - drops it), glints (1 or 2 catch lights), oval (height to width, 1.24 default: a tall oval),
  // corner (a lower-lash tick at the outer corner, 0 none .. 1)
  constructor({ place, size = 1, iris = "#4a2a14", cheeks = "#ff6f6f", ink = "#2a1a14", brow = null, lids = null, eye = {} }) {
    this.place = place; this.size = size;
    this.group = new THREE.Group();
    const E = { depth: 0.31, iris: 0.6, lash: 1, flick: 1, corner: 0, tilt: 0, glints: 1, shine: 1, oval: 1.12 / 0.9, ...eye };
    this.eyeStyle = E;
    // the character's brow design (face.browShape): arch height, inner and outer ends (face u), thickness, taper, tip, lift
    this.browStyle = { arch: 0.05, inner: 0.19, outer: 0.55, thick: 0.85, ...(arguments[0].browShape || {}) };
    this.inkMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.55 });
    this.browMat = brow ? new THREE.MeshStandardMaterial({ color: brow, roughness: 0.9 }) : this.inkMat;   // white brows for the Norse god
    this.mouthMat = new THREE.MeshStandardMaterial({ color: "#6a2228",   // shallow, warm dark red: never a black hole
       roughness: 0.6, side: THREE.DoubleSide });
    // a warm off-white, matte enough that the one painted catch light is the only highlight
    const white = new THREE.MeshStandardMaterial({ color: "#fbf5ea", roughness: 0.45 });
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
      const g1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.14, 14, 10), glint); g1.scale.set(1, 1.1, 0.5); g1.position.set(r * ri * 0.36, r * ri * 0.5, r * (D + 0.03)); look.add(g1);
      const glints = E.glints >= 1 ? [g1] : []; g1.visible = E.glints >= 1;   // glints 0: no catch light (a diagnostic)
      if (E.glints > 1) { const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.07, 10, 6), glint); g2.scale.set(1, 1, 0.5); g2.position.set(-r * ri * 0.3, -r * ri * 0.36, r * (D + 0.02)); look.add(g2); glints.push(g2); }
      // the lid line, tapered at both ends, thickest over the pupil, with the character's outer-corner flick
      const lineR = (t) => r * E.lash * (0.016 + 0.07 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.96))), 0.75));
      let lidPivot = null, lowPivot = null, crease = null, lash;
      if (lids) {
        // real upper lids (`lids`: the skin material): a skin shell over a stable eye that rolls down from the top, the
        // lid line riding its edge. Squints, blinks and the gaze move the lid; the eye itself never changes shape.
        // just deep enough to cover the iris and the catch light, so a closed eye stays a shallow lid, not a capsule
        const space = new THREE.Group(); space.scale.set(0.9, 0.9 * E.oval, (D + 0.14) / 1.05); lid.add(space);
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
      return { side, root, lid, look, pupil: pu, lash, lidPivot, lowPivot, crease, glints, r, tear };
    });
    const bt = blushTexture(cheeks, arguments[0].blush ?? 1);   // blush: how strong the cheeks are (less for the Reaper and Samurai)
    this.cheeks = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * size, 0.13 * size), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
      this.group.add(m); return { side, m };
    });
    this.brows = [null, null]; this.mouthLine = null; this.mouthFill = null; this.mouthInner = [];
    this.teethMat = new THREE.MeshStandardMaterial({ color: "#fbf7ee", emissive: "#5a5650", roughness: 0.35 });
    this.tongueMat = new THREE.MeshStandardMaterial({ color: "#e0606a", roughness: 0.55 });
    this._lastKey = "";
    this.layout = { eyeU: 0.35, eyeV: 0.32, browV: 0.86, mouthV: -0.12, mouthW: 0.27, cheekU: 0.68, cheekV: -0.06 };
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

  // aim the part along the surface normal, in the host's local space (Object3D.lookAt takes a world target, which
  // turned eyes and cheeks the wrong way whenever a character stood away from the origin)
  _orient(obj, p) { obj.position.copy(p.pos); _m.lookAt(_t.copy(p.pos).add(p.normal), p.pos, _up); obj.quaternion.setFromRotationMatrix(_m); }

  _surfLine(pts, lift) {
    // pts: [[u,v],...] in face coords -> points just above the surface
    return pts.map(([u, v]) => { const p = this.place(u, v); return p.pos.clone().addScaledVector(p.normal, lift); });
  }

  // e: expression params, look: [x,y] in -1..1, blink: 0 open .. 1 closed, c: fine controls (timeline.js FACE_KEYS)
  set(e, look = [0, 0], blink = 0, c = NO_CTL) {
    const L = this.layout, s = this.size;
    for (const eye of this.eyes) {
      const p = this.place(eye.side * L.eyeU, L.eyeV);
      this._orient(eye.root, { pos: p.pos.clone().addScaledVector(p.normal, -0.012 * s), normal: p.normal });
      if (eye.lidPivot) {
        // closing 0 open .. 1 shut: from the squint, then the blink on top, the lid following the gaze up and down,
        // and the per-eye control (lidR is the character's right eye, at -u)
        const sq = Math.max(0, Math.min(0.95, (1 - e.eye) * 0.85)), own = eye.side < 0 ? c.lidR : c.lidL;
        // squints, half-lids and the gaze stop short of shut (a crease only when a lid control asks for 1, or a blink)
        // (the cap rises with the control above 0.86, so a slow close glides shut instead of waiting at 0.86 and popping)
        let k = Math.min(Math.max(0.86, own), sq + own - 0.14 * look[1]);
        k = k + (1 - k) * blink;
        // the lid edge never rides up off the top of the eye (at 0 or a raised gaze the lash line vanished behind it)
        k = Math.max(0.1, Math.min(1, k));
        eye.shut = k;
        eye.lidPivot.rotation.x = -Math.PI / 2 + k * (Math.PI / 2 + SEAM);
        const lo = Math.max(0, Math.min(1, (k - 0.5) / 0.37)), lw = lo * lo * (3 - 2 * lo);   // up before the crease shows, so it never sweeps over it
        eye.lowPivot.rotation.x = Math.PI / 2 - lw * (Math.PI / 2 - SEAM);
        // the crease takes over just above the half-lid cap (0.86), so only a blink or a shut lid shows it
        eye.crease.visible = k > 0.87; eye.lash.visible = !eye.crease.visible;
        eye.lidPivot.rotation.z = eye.side * (this.eyeStyle.tilt || 0) * Math.min(1, Math.max(0, k * 4));   // the character's lid angle, as soon as the lid is on the eye
        // the catch lights stand proud of the eye: tuck them away as the lid closes over them
        const gs = 1 - Math.max(0, Math.min(1, (k - 0.55) / 0.3));
        for (const gl of eye.glints) gl.visible = gs > 0.01, gl.scale.setScalar(gs).multiply(_gz);
        // as it shuts the whole eye settles into the face: a closed eye stands out about a third as far as an open one
        const cl = Math.max(0, Math.min(1, (k - 0.3) / 0.7));
        eye.lid.scale.set(1 + (e.eye - 1) * 0.25, Math.max(1, e.eye), 1 - 0.7 * cl * cl * (3 - 2 * cl));
      } else {
        const open = Math.max(0.06, e.eye * (1 - blink));
        eye.lid.scale.set(1 + (e.eye - 1) * 0.25, open, 1);
      }
      // both pupils aim at one target: the gaze direction in the host's space, taken into each eye's own frame (the eyes
      // sit on a curved face and point apart, so straight ahead means a little inwards for each)
      _q.copy(eye.root.quaternion).invert();
      _d.set(look[0] * 0.55, look[1] * 0.45, 1).applyQuaternion(_q);
      const gx = Math.max(-0.45, Math.min(0.45, _d.x / Math.max(0.3, _d.z))), gy = Math.max(-0.5, Math.min(0.5, _d.y / Math.max(0.3, _d.z)));
      eye.look.position.set(gx * eye.r * 0.5, gy * eye.r * 0.48, 0);
      eye.pupil.scale.set(e.pupil, e.pupil * 1.08, 0.3);
      // tears: 0..0.5 the band fades in, 0.5..1 the bead swells (the character's right eye is at -u)
      const tk = Math.max(0, Math.min(1, (eye.side < 0 ? c.tearR : c.tearL) || 0)), T = eye.tear;
      const gather = Math.max(0, (tk - 0.5) / 0.5);
      // a closing lid covers the tears with the eye (squeezed shut, nothing of them pokes through)
      const open = 1 - Math.max(0, Math.min(1, ((eye.shut ?? 0) - 0.42) / 0.2));
      T.group.visible = tk > 0.01 && open > 0.02;
      T.group.scale.set(1, 0.4 + 0.6 * open, 1);
      T.bead.scale.setScalar(0.001 + gather);
      T.bead.visible = gather > 0.01;
    }
    if (this.waterMat) {
      const tk = Math.max(c.tearL || 0, c.tearR || 0), wet = Math.min(1, tk / 0.5);
      this.waterMat.opacity = 0.62 * wet; this.shineMat.opacity = 0.95 * wet; this.beadMat.opacity = 0.82; this.beadEdge.opacity = 0.55;
    }
    // blush follows the curve of the face: a flat card on a round body dips under the skin at its edges and shows
    // a hard cut. Built once, in the host's space, from the same surface mapping as the rest of the face.
    for (const ch of this.cheeks) if (!ch.curved) this._curveCheek(ch, L, s);
    // geometry that depends on the expression is rebuilt only when it changes
    const round = e.round || 0;
    const key = [e.tilt, e.browY, e.curve, e.open, e.smirk, e.raise, round, c.browL, c.browR, c.tiltL, c.tiltR, c.cornerL, c.cornerR, c.press].map((x) => x.toFixed(3)).join("|");
    if (key === this._lastKey) return;
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
    // pressed lips (c.press) close and flatten the mouth and pull it in; mouth corners move on their own (cornerR is the
    // character's right corner, at -u; + up)
    const press = c.press, open = e.open * (1 - press), smile = e.curve * (1 - 0.8 * press);
    const w = L.mouthW * (1 - open * 0.35 - round * 0.3) * (1 - 0.28 * press), mv = L.mouthV, n = 14;
    const upper = [], lower = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = -w + 2 * w * t;
      const sm = e.smirk * (t - 0.5) * 0.16 + 0.12 * (c.cornerR * (1 - t) ** 3 + c.cornerL * t ** 3);
      const bow = -Math.sin(t * Math.PI) * smile * 0.13; // smile pulls the middle down
      upper.push([u, mv + bow * (1 - open * 0.6) + sm + open * 0.06 * Math.sin(t * Math.PI)]);
      lower.push([u, mv + bow + sm - open * 0.3 * Math.sin(t * Math.PI)]);
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
      this.mouthLine = new THREE.Mesh(taperedTube(curve, 0, 0, 32, 8, (t) => s * (0.003 + 0.0065 * (1 + 0.9 * press) * Math.pow(Math.sin(Math.PI * t), 0.8))), this.inkMat); this.group.add(this.mouthLine);
    }
  }
}
