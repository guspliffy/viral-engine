import * as THREE from "three";

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
export class Face {
  constructor({ place, size = 1, iris = "#4a2a14", cheeks = "#ff6f6f", ink = "#1b1a22" }) {
    this.place = place; this.size = size;
    this.group = new THREE.Group();
    this.inkMat = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.55 });
    this.mouthMat = new THREE.MeshStandardMaterial({ color: "#4a1418", roughness: 0.6, side: THREE.DoubleSide });
    const white = new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 });
    const irisM = new THREE.MeshPhysicalMaterial({ color: iris, roughness: 0.2, clearcoat: 1 });
    const pupilM = new THREE.MeshStandardMaterial({ color: "#0b0a0e", roughness: 0.3 });
    const glint = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    this.eyes = [-1, 1].map((side) => {
      const root = new THREE.Group(); // placed on the surface, z = out of the surface
      const lid = new THREE.Group(); root.add(lid); // scaled for blinks and squints
      const r = 0.085 * size;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), white); ball.scale.set(0.9, 1.12, 0.62); lid.add(ball);
      const look = new THREE.Group(); lid.add(look);
      const ir = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 28, 20), irisM); ir.scale.set(1, 1.08, 0.35); ir.position.z = r * 0.42; look.add(ir);
      const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.36, 24, 16), pupilM); pu.scale.set(1, 1.08, 0.3); pu.position.z = r * 0.55; look.add(pu);
      const g1 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.16, 12, 8), glint); g1.position.set(r * 0.22, r * 0.3, r * 0.62); look.add(g1);
      const g2 = new THREE.Mesh(new THREE.SphereGeometry(r * 0.08, 10, 6), glint); g2.position.set(-r * 0.2, -r * 0.18, r * 0.6); look.add(g2);
      this.group.add(root);
      return { side, root, lid, look, pupil: pu, r };
    });
    const bt = blushTexture(cheeks);
    this.cheeks = [-1, 1].map((side) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.2 * size, 0.13 * size), new THREE.MeshBasicMaterial({ map: bt, transparent: true, depthWrite: false }));
      this.group.add(m); return { side, m };
    });
    this.brows = [null, null]; this.mouthLine = null; this.mouthFill = null;
    this._lastKey = "";
    this.layout = { eyeU: 0.36, eyeV: 0.32, browV: 0.62, mouthV: -0.12, mouthW: 0.36, cheekU: 0.66, cheekV: 0.0 };
  }

  _orient(obj, p) { obj.position.copy(p.pos); obj.lookAt(p.pos.clone().add(p.normal)); }

  _surfLine(pts, lift) {
    // pts: [[u,v],...] in face coords -> points just above the surface
    return pts.map(([u, v]) => { const p = this.place(u, v); return p.pos.clone().addScaledVector(p.normal, lift); });
  }

  // e: expression params, look: [x,y] in -1..1, blink: 0 open .. 1 closed
  set(e, look = [0, 0], blink = 0) {
    const L = this.layout, s = this.size;
    for (const eye of this.eyes) {
      const p = this.place(eye.side * L.eyeU, L.eyeV);
      this._orient(eye.root, { pos: p.pos.clone().addScaledVector(p.normal, -0.012 * s), normal: p.normal });
      const open = Math.max(0.06, e.eye * (1 - blink));
      eye.lid.scale.set(1 + (e.eye - 1) * 0.25, open, 1);
      eye.look.position.set(look[0] * eye.r * 0.28, look[1] * eye.r * 0.22, 0);
      eye.pupil.scale.set(e.pupil, e.pupil * 1.08, 0.3);
    }
    for (const ch of this.cheeks) {
      const p = this.place(ch.side * L.cheekU, L.cheekV);
      this._orient(ch.m, { pos: p.pos.clone().addScaledVector(p.normal, 0.004 * s), normal: p.normal });
    }
    // geometry that depends on the expression is rebuilt only when it changes
    const round = e.round || 0;
    const key = [e.tilt, e.browY, e.curve, e.open, e.smirk, e.raise, round].map((x) => x.toFixed(3)).join("|");
    if (key === this._lastKey) return;
    this._lastKey = key;
    for (let i = 0; i < 2; i++) {
      const side = i ? 1 : -1;
      if (this.brows[i]) { this.group.remove(this.brows[i]); this.brows[i].geometry.dispose(); }
      const yb = L.browV + e.browY * 6 + (side < 0 ? e.raise * 6 : 0);
      const inner = 0.16, outer = 0.6;
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = k / 6, u = side * (inner + (outer - inner) * t);
        const arch = Math.sin(t * Math.PI) * 0.05;
        pts.push([u, yb + arch + (1 - t) * e.tilt * 0.35 - t * e.tilt * 0.05]);
      }
      const curve = new THREE.CatmullRomCurve3(this._surfLine(pts, 0.012 * s));
      const g = new THREE.TubeGeometry(curve, 16, 0.019 * s, 8, false);
      this.brows[i] = new THREE.Mesh(g, this.inkMat); this.group.add(this.brows[i]);
    }
    if (this.mouthLine) { this.group.remove(this.mouthLine); this.mouthLine.geometry.dispose(); this.mouthLine = null; }
    if (this.mouthFill) { this.group.remove(this.mouthFill); this.mouthFill.geometry.dispose(); this.mouthFill = null; }
    const w = L.mouthW * (1 - e.open * 0.35 - round * 0.3), mv = L.mouthV, n = 14;
    const upper = [], lower = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = -w + 2 * w * t;
      const sm = e.smirk * (t - 0.5) * 0.16;
      const bow = -Math.sin(t * Math.PI) * e.curve * 0.13; // smile pulls the middle down
      upper.push([u, mv + bow * (1 - e.open * 0.6) + sm + e.open * 0.06 * Math.sin(t * Math.PI)]);
      lower.push([u, mv + bow + sm - e.open * 0.3 * Math.sin(t * Math.PI)]);
    }
    if (e.open > 0.04) {
      const up = this._surfLine(upper, 0.006 * s), lo = this._surfLine(lower, 0.006 * s);
      const pos = [], idx = [];
      for (let k = 0; k <= n; k++) { pos.push(up[k].x, up[k].y, up[k].z, lo[k].x, lo[k].y, lo[k].z); }
      for (let k = 0; k < n; k++) { const a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      this.mouthFill = new THREE.Mesh(g, this.mouthMat); this.group.add(this.mouthFill);
      const ring = [...upper, ...lower.slice().reverse()];
      const curve = new THREE.CatmullRomCurve3(this._surfLine(ring, 0.01 * s), true);
      this.mouthLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.012 * s, 6, true), this.inkMat); this.group.add(this.mouthLine);
    } else {
      const curve = new THREE.CatmullRomCurve3(this._surfLine(lower, 0.01 * s));
      this.mouthLine = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.014 * s, 8, false), this.inkMat); this.group.add(this.mouthLine);
    }
  }
}
