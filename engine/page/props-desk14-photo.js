import * as THREE from "three";
import { clamp } from "./util.js";

// Potato Desk 14 "Don't. Laugh." (storyboards/series/potato-desk/14-dont-laugh/DESIGN.md section 3a): the two worn props that
// turn `spud-kid` into the boy in Exhibit A, the school photo. Metres, in the wearer's body frame (y 0 = the floor under him,
// +z the front). Both are WORN: spec.wear = the actor id, x 0, y 0, z 0. Both squash with the wearer (the same wearSquash as
// props-heist.js's balaclava) and both are userData.steam (see-through for the checks: the face stays on show).
//
//   bowlcut     a brown bowl-cut wig-shell on the kid's head (the body's ellipsoid: centre y 0.415, radii 0.25 / 0.275 / 0.22).
//               It follows the real skin (spud-kid's seed 29 lumps, scaled to his lump 0.02): 0.028 off it at the crown,
//               0.022 at the edge. Lower edge: y 0.537 across the front (within 55 deg of +z), down to 0.47 by 85 deg, 0.47
//               round the back; a rolled edge (tube r 0.014) runs along it and the front edge has 7 scallops 0.008 deep. A
//               0.022 hole at the crown for his leaf. One canvas 1024 x 1024: 22 strand strokes, a gloss arc at y 0.62 from
//               -40 to +25 deg. Spec keys and defaults: color "#7b4a27", strand "#5c3518", gloss "#a26a3a", fit "kid" (or an
//               object { rx, rz, cy, ry, taper, lumps } as BALA_FITS in props-heist.js), out 0.022, outTop 0.028, front 0.537,
//               side 0.47, scallops 7, scallop 0.008, roll 0.014, hole 0.022. Origin: the body frame's floor point. Not held.
//   bracesgrin  a flat decal 0.19 x 0.075 centred on the mouth (x 0, y 0.37), 0.004 off the skin, laid on the real skin: a
//               lozenge grin (top edge near straight, corners 0.012 up, the screen-left one 0.006 higher: awkward; bottom
//               corners r 0.03), ink #2a1a14 0.006, 6 teeth #fbf7ee with 5 gaps #d8d0c0 0.0025, a wire #7f8b95 0.005 across
//               the middle, 6 brackets 0.017 x 0.015 #b9c2ca outlined #4a5560 0.002, white glints 0.004 on brackets 2 and 5.
//               His own mouth lies under it: use `face` press 1. Spec keys and defaults: at [0, 0.37] (x, y of the mouth),
//               w 0.19, h 0.075, out 0.004, fit "kid", ink, teeth, gap, wire, bracket, bracketInk. Origin: the body frame's
//               floor point. Not held.
// Budget: the bowl cut about 6k triangles, the grin 1k.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function canvasTex(w, h, draw) {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const thru = (o, parent, order = 3) => { parent.add(o); o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
// a parametric surface fn(u, v) on a (nu+1) x (nv+1) grid, front = +u x +v
function surfGrid(fn, nu, nv) {
  const pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); pos.push(q.p.x, q.p.y, q.p.z); uv.push(q.u, q.v); }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, d, a, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// spud-kid's body, as potato.js bodyPoint builds it: width 0.5, height 0.55, depth 0.44 on legs 0.14 (cy 0.415), taper 0.07, seed 29 lumps
// (the same nine as Spud's, balaclava in props-heist.js, a x 0.02 / 0.03 because his lump is 0.02)
const KS = 0.02 / 0.03;
const KID_LUMPS = [
  { d: [0.6855, -0.6998, 0.2009], a: -0.006, k: 4.77 }, { d: [0.7454, 0.6444, 0.1709], a: -0.01467, k: 7.397 }, { d: [0.6888, -0.6998, -0.1892], a: -0.00673, k: 6.628 },
  { d: [-0.7062, -0.4034, 0.5819], a: 0.01452, k: 5.341 }, { d: [0.2792, -0.8165, 0.5054], a: 0.023, k: 4.38 }, { d: [0.7635, -0.617, -0.1908], a: -0.02188, k: 3.273 },
  { d: [-0.4535, -0.2353, -0.8596], a: -0.00082, k: 5.446 }, { d: [-0.3129, 0.4265, 0.8486], a: -0.01956, k: 5.143 }, { d: [0.4648, -0.1194, -0.8773], a: 0.0132, k: 7.867 },
].map((L) => ({ ...L, a: L.a * KS }));
export const KID_FITS = { kid: { rx: 0.25, rz: 0.22, cy: 0.415, ry: 0.275, taper: 0.07, lumps: KID_LUMPS } };
const fitOf = (S) => ({ ...KID_FITS.kid, ...(typeof S.fit === "string" ? KID_FITS[S.fit] : S.fit) });
// the skin at azimuth th (0 = front, + toward +x) and elevation el, pushed `out` along its normal
function bodyAt(F, th, el, out = 0) {
  const at = (a, b) => {
    const dx = Math.sin(a) * Math.cos(b), dy = Math.sin(b), dz = Math.cos(a) * Math.cos(b);
    let r = 1; for (const L of F.lumps || []) r += L.a * Math.exp(-L.k * (1 - (dx * L.d[0] + dy * L.d[1] + dz * L.d[2])));
    const tp = 1 - (F.taper ?? 0.07) * dy;
    return new THREE.Vector3(dx * F.rx * tp * r, F.cy + dy * F.ry * r, dz * F.rz * tp * r);
  };
  const p = at(th, el);
  if (!out) return p;
  const e = 0.003, n = at(th + e, el).sub(at(th - e, el)).cross(at(th, el + e).sub(at(th, el - e))).normalize();
  return p.addScaledVector(n, out);
}
// the elevation at azimuth th where the skin is at height y (bisection: the lumps make it a few mm off the plain ellipse)
function elAtY(F, th, y) { let a = -1.2, b = 1.5; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (bodyAt(F, th, m).y < y) a = m; else b = m; } return (a + b) / 2; }

// A worn prop's `whole` follows the wearer's squash every frame (props-heist.js wearSquash, copied: it is not exported). The wearer is
// the potato standing where this prop was put; found in the posed scene, nothing from a clock. Not found: scale 1.
const _wp = new THREE.Vector3(), _bp = new THREE.Vector3();
function wearSquash(P) {
  const whole = P.whole, sup = whole.updateMatrixWorld;
  let roots = [];
  const find = () => {
    if (!roots.length) {
      let s = P.root; while (s.parent) s = s.parent;
      s.traverse((o) => { const bg = o.children[0], pp = bg && bg.children[0], body = pp && pp.children[0]; if (o.isGroup && bg && bg.isGroup && pp && pp.isGroup && body && body.isMesh && body.geometry.attributes.position.count === 12513) roots.push(o); });
    }
    P.root.getWorldPosition(_wp);
    for (const r of roots) { r.getWorldPosition(_bp); if (_bp.distanceToSquared(_wp) < 4e-6) return r; }
    return null;
  };
  whole.updateMatrixWorld = function (force) {
    const r = P.root.parent ? find() : null;
    if (r) { const b = r.children[0].scale; this.scale.set(b.x * r.scale.x, b.y * r.scale.y, b.z * r.scale.z); } else this.scale.set(1, 1, 1);
    sup.call(this, force);
  };
}

export const DESK14_PHOTO_KINDS = {
  // ---------------------------------------------------------------------------------------------- bowlcut
  bowlcut(P) {
    const S = P.spec, F = fitOf(S), RAD = Math.PI / 180;
    const OUT_E = S.out ?? 0.022, OUT_T = S.outTop ?? 0.028, YF = S.front ?? 0.537, YS = S.side ?? 0.47;
    const NSC = S.scallops ?? 7, SCD = S.scallop ?? 0.008, ROLL = S.roll ?? 0.014, HOLE = S.hole ?? 0.022;
    const elTop = Math.acos(clamp(HOLE / F.rx, 0, 1));   // the shell ends in the leaf's ring at the crown
    // the lower edge's height round the head: azimuth th (0 = front) -> y
    const edgeY = (th) => {
      const a = Math.abs(th) / RAD;   // 0..180
      let y = a <= 55 ? YF : YF + (YS - YF) * sstep(55, 85, a);
      if (a < 55) { const u = (th / RAD + 55) / 110 * NSC; y -= SCD * Math.pow(Math.abs(Math.sin(Math.PI * u)), 0.7) * (1 - sstep(48, 55, a)); }   // scallops hang from the front edge
      return y;
    };
    const NU = 144, NV = 14;
    const ths = Array.from({ length: NU + 1 }, (_, i) => -Math.PI + (i / NU) * 2 * Math.PI);
    const elLo = ths.map((t) => elAtY(F, t, edgeY(t)));
    const elMin = Math.min(...elLo);
    // texture: u = azimuth, v = elevation from elMin to elTop (one canvas, drawn in those two angles)
    const TW = 1024, TH = 1024, span = elTop - elMin;
    const tex = canvasTex(TW, TH, (g, w, h) => {
      g.fillStyle = S.color || "#7b4a27"; g.fillRect(0, 0, w, h);
      const hs = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };
      const px = (th, el) => [((th + Math.PI) / (2 * Math.PI)) * w, h - ((el - elMin) / span) * h];
      g.lineCap = "round"; g.strokeStyle = S.strand || "#5c3518";
      for (let i = 0; i < 22; i++) {   // 22 strands from the crown down a meridian, 0.06-0.16 long, 0.005 wide
        const th = -Math.PI + ((i + 0.5 + (hs(i, 1) - 0.5) * 0.6) / 22) * 2 * Math.PI, len = 0.06 + 0.10 * hs(i, 2), el0 = elTop - 0.02 * hs(i, 3), el1 = el0 - len / F.ry;
        const [x0, y0] = px(th, el0), [x1, y1] = px(th + (hs(i, 4) - 0.5) * 0.05, el1);
        g.lineWidth = Math.max(2, (0.005 / (F.rx * Math.cos((el0 + el1) / 2))) / (2 * Math.PI) * w);
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      }
      // the gloss arc: 0.02 wide, at y 0.62 from -40 to +25 deg, thinning to both ends
      const elG = Math.asin(clamp((0.62 - F.cy) / F.ry, -1, 1)); g.strokeStyle = S.gloss || "#a26a3a";
      for (let i = 0; i < 40; i++) {
        const t0 = (-40 + 65 * (i / 40)) * RAD, t1 = (-40 + 65 * ((i + 1) / 40)) * RAD, k = Math.sin(Math.PI * (i + 0.5) / 40);
        const [xa, ya] = px(t0, elG), [xb, yb] = px(t1, elG);
        g.lineWidth = Math.max(1, (0.02 / F.ry) / span * h * Math.pow(k, 0.5)); g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
      }
    });
    const m = new THREE.MeshStandardMaterial({ color: "#ffffff", map: tex, roughness: 0.85, side: THREE.DoubleSide });
    // thickness: 0.022 at the edge to 0.028 at the crown, by elevation
    const surf = surfGrid((u, v) => {
      const i = Math.round(u * NU), th = ths[i], el = elLo[i] + v * (elTop - elLo[i]);
      return { p: bodyAt(F, th, el, OUT_E + (OUT_T - OUT_E) * sstep(0, 1, v)), u, v: (el - elMin) / span };
    }, NU, NV);
    thru(new THREE.Mesh(surf, m), P.whole, 2);
    // the rolled edge: a tube r ROLL along the lower edge, resting on the skin (centre ROLL + 2 mm off it)
    const pts = []; for (let i = 0; i < NU; i++) pts.push(bodyAt(F, ths[i], elLo[i], ROLL + 0.002));
    const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), NU, ROLL, 6, true), mat(S.color || "#7b4a27", { roughness: 0.85 }));
    thru(rim, P.whole, 2);
    // the crown's ring round the leaf hole: a small roll so the cut edge is not raw
    const ring = []; for (let i = 0; i < 24; i++) ring.push(bodyAt(F, (i / 24) * 2 * Math.PI, elTop, OUT_T));
    thru(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 24, 0.005, 4, true), mat(S.color || "#7b4a27")), P.whole, 2);
    if (S.wear) wearSquash(P);
    return { grip: 0 };
  },

  // ---------------------------------------------------------------------------------------------- bracesgrin
  bracesgrin(P) {
    const S = P.spec, F = fitOf(S), W = S.w ?? 0.19, H = S.h ?? 0.075, OUT = S.out ?? 0.016, [MX, MY] = S.at || [0, 0.37];
    const INK = S.ink || "#2a1a14", TEETH = S.teeth || "#fbf7ee", GAP = S.gap || "#d8d0c0", WIRE = S.wire || "#7f8b95", BR = S.bracket || "#b9c2ca", BRI = S.bracketInk || "#4a5560";
    const CW = 1024, CH = Math.round(CW * H / W), K = CW / W;   // px per m
    // the lozenge in metres from its centre (x right, y up): the top edge sags 0.012 between its corners, the screen-left corner 0.006 above the right
    const topY = (x) => { const s = x / (W / 2); return H / 2 - 0.015 + 0.012 * s * s - 0.003 * s; };
    const botY = -H / 2, rc = 0.03;
    const tex = canvasTex(CW, CH, (g, w, h) => {
      const X = (x) => w / 2 + x * K, Y = (y) => h / 2 - y * K;
      const shape = () => {
        g.beginPath(); g.moveTo(X(-W / 2), Y(topY(-W / 2)));
        for (let i = 1; i <= 40; i++) { const x = -W / 2 + (W * i) / 40; g.lineTo(X(x), Y(topY(x))); }
        g.lineTo(X(W / 2), Y(botY + rc)); g.arc(X(W / 2 - rc), Y(botY + rc), rc * K, 0, Math.PI / 2);
        g.lineTo(X(-W / 2 + rc), Y(botY)); g.arc(X(-W / 2 + rc), Y(botY + rc), rc * K, Math.PI / 2, Math.PI);
        g.closePath();
      };
      g.save(); shape(); g.clip();
      g.fillStyle = TEETH; g.fillRect(0, 0, w, h);
      const n = 6, tw = (W - 0.012) / n, x0 = -W / 2 + 0.006;   // 6 teeth, 5 gaps between them
      g.fillStyle = GAP; for (let i = 1; i < n; i++) g.fillRect(X(x0 + i * tw) - 0.00125 * K, 0, 0.0025 * K, h);
      const wireY = (x) => { const s = x / (W / 2); return (topY(x) + botY) / 2 + 0.002 * (s * s - 0.2); };
      g.strokeStyle = WIRE; g.lineWidth = 0.005 * K; g.lineCap = "butt"; g.beginPath();
      for (let i = 0; i <= 40; i++) { const x = -W / 2 + (W * i) / 40; i ? g.lineTo(X(x), Y(wireY(x))) : g.moveTo(X(x), Y(wireY(x))); } g.stroke();
      g.restore();
      for (let i = 0; i < n; i++) {   // brackets, one per tooth
        const cx = x0 + (i + 0.5) * tw, cy = wireY(cx), bw = 0.017 * K, bh = 0.015 * K;
        g.fillStyle = BR; g.strokeStyle = BRI; g.lineWidth = 0.002 * K; g.beginPath(); g.rect(X(cx) - bw / 2, Y(cy) - bh / 2, bw, bh); g.fill(); g.stroke();
        if (i === 1 || i === 4) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(X(cx) - bw * 0.2, Y(cy) - bh * 0.22, 0.002 * K, 0, 2 * Math.PI); g.fill(); }   // glints 0.004 across
      }
      g.strokeStyle = INK; g.lineWidth = 0.006 * K; g.lineJoin = "round"; shape(); g.stroke();
    });
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    m.userData.noOutline = true;
    // laid on the skin: each point (x, y) of the decal takes the skin direction that has that x and y (plain ellipse solve, then the skin's own normal)
    const NU = 40, NV = 12;
    const geo = surfGrid((u, v) => {
      const x = MX + (u - 0.5) * W, y = MY + (v - 0.5) * H;
      const el = Math.asin(clamp((y - F.cy) / F.ry, -1, 1)), tp = 1 - (F.taper ?? 0.07) * Math.sin(el);
      const th = Math.asin(clamp(x / (F.rx * tp * Math.cos(el)), -1, 1));
      return { p: bodyAt(F, th, el, OUT), u, v };
    }, NU, NV);
    thru(new THREE.Mesh(geo, m), P.whole, 6);
    if (S.wear) wearSquash(P);
    return { grip: 0 };
  },
};
