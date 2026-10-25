import * as THREE from "three";
import { taperedTube } from "./geo.js";

const _q = new THREE.Quaternion(), _d = new THREE.Vector3(), _m = new THREE.Matrix4(), _t = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);

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
  deadpan:   { tilt: 0.0,  browY: -0.015, curve: 0.0, open: 0.0,  eye: 0.6,  pupil: 1.0,  smirk: 0.0, raise: 0.0 },
  serene:    { tilt: 0.1,  browY: 0.0,   curve: 0.35, open: 0.0,  eye: 0.06, pupil: 1.0,  smirk: 0.0, raise: 0.0 },   // eyes closed, content
  dizzy:     { tilt: 0.42, browY: 0.02,  curve: -0.35, open: 0.3, eye: 1.08, pupil: 0.45, smirk: 0.4, raise: 0.02 },
};
export const blendExpr = (a, b, t) => { const o = {}; for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; };

function blushTexture(color) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
  const col = new THREE.Color(color); const rgb = `${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0}`;
  gr.addColorStop(0, `rgba(${rgb},0.62)`); gr.addColorStop(0.55, `rgba(${rgb},0.32)`); gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// A face drawn onto any surface. `place(u, v)` maps face coordinates (u: -1 left .. 1 right,
// v: -1 chin .. 1 forehead) to { pos, normal } on the host surface, in the host group's space.
const NO_CTL = { lidL: 0, lidR: 0, browL: 0, browR: 0, tiltL: 0, tiltR: 0, cornerL: 0, cornerR: 0, press: 0 };

export class Face {
  constructor({ place, size = 1, iris = "#4a2a14", cheeks = "#ff6f6f", ink = "#1b1a22", brow = null, lids = null }) {
    this.place = place; this.size = size;
    this.group = new THREE.Group();
    this.inkMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.55 });
    this.browMat = brow ? new THREE.MeshStandardMaterial({ color: brow, roughness: 0.9 }) : this.inkMat;   // white brows for the Norse god
    this.mouthMat = new THREE.MeshStandardMaterial({ color: "#4a1418", roughness: 0.6, side: THREE.DoubleSide });
    const white = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });
    const irisM = new THREE.MeshPhysicalMaterial({ color: iris, roughness: 0.2, clearcoat: 1 });
    const pupilM = new THREE.MeshStandardMaterial({ color: "#0b0a0e", roughness: 0.3 });
    const glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    this.eyes = [-1, 1].map((side) => {
      const root = new THREE.Group(); // placed on the surface, z = out of the surface
      const lid = new THREE.Group(); root.add(lid); // scaled for blinks and squints
      const r = 0.092 * size;
      // D: how far the eye stands out of the face. Shallow, so the eyes read as part of the face rather than balls on it
      // (and the far eye narrows in a three-quarter view)
      const D = 0.5;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), white); ball.scale.set(0.9, 1.12, D); lid.add(ball);
      const look = new THREE.Group(); lid.add(look);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(r * 0.68, 28, 20), irisM); ir.scale.set(1, 1.1, 0.35); ir.position.z = r * (D - 0.2); look.add(ir);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.38, 24, 16), pupilM); pu.scale.set(1, 1.08, 0.3); pu.position.z = r * (D - 0.07); look.add(pu);
      // the portraits' catch lights, the same way in both eyes: a big one up and to the right, a small one low left
      const g1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.2, 14, 10), glint); g1.scale.set(1, 1.1, 0.5); g1.position.set(r * 0.24, r * 0.34, r * (D + 0.04)); look.add(g1);
      const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.09, 10, 6), glint); g2.scale.set(1, 1, 0.5); g2.position.set(-r * 0.2, -r * 0.24, r * (D + 0.02)); look.add(g2);
      // upper lash line: a bold ink arc hugging the top of the eye, thickest over the pupil, with a small flick
      // up and out at the outer corner. It sits in the lid group, so it closes with the eye on a blink.
      const lashPts = [];
      for (let k = 0; k <= 8; k++) { const a = 2.75 - k * (2.55 / 8); lashPts.push(new THREE.Vector3(side * Math.cos(a) * r * 0.97, Math.sin(a) * r * 1.16 - r * 0.05, r * (0.3 + 0.12 * Math.sin(a)) * D / 0.62)); }
      lashPts.push(new THREE.Vector3(side * r * 1.12, r * 0.3, r * 0.2 * D / 0.62));
      const lash = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(lashPts), 0, 0, 40, 8, (t) => r * (0.025 + 0.13 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)), 0.7))), this.inkMat);
      lid.add(lash);
      // real upper lids (`lids`: the skin material): a skin shell over the eye that rolls down from the top, with the
      // lash line riding its edge. Squints, blinks and the gaze move the lid; the eye itself keeps its shape.
      let lidPivot = null;
      if (lids) {
        lash.visible = false;
        const space = new THREE.Group(); space.scale.set(0.9, 1.12, D * 1.38); lid.add(space);   // deep enough to cover the iris and catch lights
        lidPivot = new THREE.Group(); space.add(lidPivot);
        const shell = new THREE.Mesh(new THREE.SphereGeometry(r * 1.05, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2), lids); shell.castShadow = false; lidPivot.add(shell);
        // the edge of the shell is the circle y = 0; its front half (z > 0) is the lid line, outer corner flicked
        const pts = [];
        for (let k = 0; k <= 10; k++) { const ph = 0.12 + k * ((Math.PI - 0.24) / 10), x = Math.cos(ph) * side; pts.push(new THREE.Vector3(-x * r * 1.07, -0.015 * r, Math.sin(ph) * r * 1.07)); }
        pts.push(new THREE.Vector3(side * r * 1.22, -0.015 * r, r * 0.34));
        pts.sort((a, b) => side * (a.x - b.x));   // inner corner first, so the tube thickens towards the outer flick
        const edge = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3(pts), 0, 0, 44, 8, (t) => r * (0.03 + 0.12 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.1 + t * 0.95)), 0.7))), this.inkMat);
        lidPivot.add(edge);
        return this.group.add(root), { side, root, lid, look, pupil: pu, lash: edge, lidPivot, r };
      }
      this.group.add(root);
      return { side, root, lid, look, pupil: pu, lash, r };
    });
    const bt = blushTexture(cheeks);
    this.cheeks = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * size, 0.13 * size), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
      this.group.add(m); return { side, m };
    });
    this.brows = [null, null]; this.mouthLine = null; this.mouthFill = null; this.mouthInner = [];
    this.teethMat = new THREE.MeshStandardMaterial({ color: "#fbf7ee", emissive: "#5a5650", roughness: 0.35 });
    this.tongueMat = new THREE.MeshStandardMaterial({ color: "#e0606a", roughness: 0.55 });
    this._lastKey = "";
    this.layout = { eyeU: 0.35, eyeV: 0.32, browV: 0.62, mouthV: -0.12, mouthW: 0.36, cheekU: 0.66, cheekV: 0.0 };
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
        let k = sq + own - 0.14 * look[1];
        k = k + (1 - k) * blink;
        k = Math.max(-0.12, Math.min(1, k));
        eye.lidPivot.rotation.x = -Math.PI / 2 + k * Math.PI;
        eye.lid.scale.set(1 + (e.eye - 1) * 0.25, Math.max(1, e.eye), 1);
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
      const inner = 0.16, outer = 0.6;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, u = side * (inner + (outer - inner) * t);
        const arch = Math.sin(t * Math.PI) * 0.05;
        pts.push([u, yb + arch + (1 - t) * tilt * 0.35 - t * tilt * 0.05]);
      }
      const curve = new THREE.CatmullRomCurve3(this._surfLine(pts, 0.012 * s));
      // thick in the middle, tapering to both ends, like the portraits' brush-stroke brows
      const g = taperedTube(curve, 0, 0, 20, 8, (t) => s * (0.007 + 0.016 * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.55)));
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
        const ramp = Math.min(1, (open - 0.06) / 0.22), tw = Math.min(0.42, 0.2 + open * 0.3) * ramp;
        patch(0.1, 0.9, () => 0.02, (t) => tw * Math.pow(Math.max(0, Math.sin(Math.PI * t)), 0.35), 0.0075, this.teethMat);
        patch(0.22, 0.78, (t) => 1 - 0.42 * ramp * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.22) / 0.56)))), 0.5), () => 0.96, 0.0078, this.tongueMat);
      }
      const ring = [...upper, ...lower.slice().reverse()];
      const curve = new THREE.CatmullRomCurve3(this._surfLine(ring, 0.01 * s), true);
      this.mouthLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0085 * s, 6, true), this.inkMat); this.group.add(this.mouthLine);
    } else {
      const curve = new THREE.CatmullRomCurve3(this._surfLine(lower, 0.01 * s));
      // a closed smile: a brush line, fuller in the middle, fine at the corners
      this.mouthLine = new THREE.Mesh(taperedTube(curve, 0, 0, 32, 8, (t) => s * (0.006 + 0.01 * (1 + 0.9 * press) * Math.pow(Math.sin(Math.PI * t), 0.6))), this.inkMat); this.group.add(this.mouthLine);
    }
  }
}
