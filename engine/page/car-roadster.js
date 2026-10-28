import * as THREE from "three";
import { ROADSTER } from "./vehicle.js";

// The roadster: a chunky open-top cartoon sports car (Jonny's red-car panels, 28 Oct): one smooth body with a sunken
// cockpit, round fenders over the wheels, round headlamps on the front fenders, an oval meshed grille, a chrome
// windscreen frame and bumpers, red ball mirrors. It is built in its rig's frame (front +z, origin on the ground under
// its middle); its seats and steering wheel are props (props-road.js), so "sit" and hand grips work on them.
// apply(state, t, travel): wheels spin with the road's distance, the front ones steer, and each sits at its own
// suspension travel (vehicle.js wheelTravel), so a tyre always meets the road.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const smooth = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const bump = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

// the body: slices along z, each a superellipse (flat sides, round corners) whose width, top and bottom follow the
// car's profile; the cockpit is a dip in the top between the doors. Vertex colours: paint, the dark cockpit inside,
// the dark underside.
export const BODY = { z0: -1.86, z1: 1.98, w: 0.8, fender: 0.31, seatZ: -0.32 };
function profile(z) {
  // the top line: rear deck, cockpit sides, the cowl at the windscreen, the hood running down to the nose
  const top = 0.86 + 0.04 * smooth(0.25, 0.6, z) - 0.2 * smooth(0.75, 1.95, z) ** 1.4 - 0.05 * smooth(-1.3, -1.86, z);
  const bottom = 0.27 + 0.05 * smooth(1.3, 1.98, z) + 0.06 * smooth(-1.4, -1.86, z);
  return { top, bottom };
}
// the cockpit: how deep the top dips at z (0..1), and across x
const cockpit = (z) => smooth(-0.98, -0.78, z) * (1 - smooth(0.28, 0.5, z));
const COCKPIT_FLOOR = 0.42;
function bodyGeometry() {
  const NZ = 140, NV = 72, pos = [], col = [], idx = [];
  const paint = new THREE.Color("#ffffff"), inside = new THREE.Color("#4a1714"), under = new THREE.Color("#3a2a2c");
  const L = (BODY.z1 - BODY.z0) / 2, zm = (BODY.z0 + BODY.z1) / 2;
  for (let i = 0; i <= NZ; i++) {
    const z = BODY.z0 + (BODY.z1 - BODY.z0) * (i / NZ), { top, bottom } = profile(z);
    // a blunt nose and tail: the plan narrows to 60 % (front) / 70 % (back) along a superellipse, then a small domed
    // face closes each end
    const e = Math.min(1, Math.abs((z - zm) / L)), front = z > zm, n = front ? 5 : 4, blunt = front ? 0.6 : 0.7;
    const R = 0.16, q = Math.max(0, (Math.abs(z - zm) - (L - R)) / R), cap = Math.sqrt(Math.max(0, 1 - q * q));
    const f = (blunt + (1 - blunt) * Math.pow(Math.max(0, 1 - e ** n), 1 / n)) * cap;
    const yc = (top + bottom) / 2, h = ((top - bottom) / 2) * Math.pow(cap, 0.5);
    // the front fenders run forward to the nose (the headlamps sit in their tips), the rear ones round off
    const fenders = (z > ROADSTER.front ? bump(z, ROADSTER.front, 1.1) : bump(z, ROADSTER.front, 0.6)) + bump(z, ROADSTER.rear, 0.58);
    const dip = cockpit(z);
    for (let j = 0; j <= NV; j++) {
      const v = (j / NV) * Math.PI * 2, c = Math.cos(v), s = Math.sin(v);
      let y = yc + h * Math.sign(s) * Math.abs(s) ** (2 / 4.5);
      // fenders bulge out above the wheels' middle (the tyres show below them), and stand a little proud on top
      const W = (BODY.w + BODY.fender * fenders * smooth(0.36, 0.62, y)) * f;
      const x = W * Math.sign(c) * Math.abs(c) ** (2 / 4.5);
      y += 0.11 * fenders * smooth(0.5, 0.95, Math.abs(x) / Math.max(W, 1e-4)) * Math.max(0, s);
      // the cockpit: the top between the door tops drops to the floor
      const across = 1 - smooth(BODY.w * 0.78, BODY.w * 0.93, Math.abs(x));
      const k = dip * across * Math.max(0, s) ** 0.6;
      y -= (top - COCKPIT_FLOOR) * k;
      pos.push(x, y, z);
      const cc = k > 0.25 ? inside : s < -0.85 ? under : paint;
      col.push(cc.r, cc.g, cc.b);
    }
  }
  for (let i = 0; i < NZ; i++) for (let j = 0; j < NV; j++) {
    const a = i * (NV + 1) + j, b = a + NV + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// the top of the body at (x, z) (for placing parts on it)
export function bodyTop(z) { return profile(z).top; }

function meshTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = "#15161b"; g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "#4b4f5a"; g.lineWidth = 3;
  for (let i = -128; i < 256; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 128, 128); g.stroke(); g.beginPath(); g.moveTo(i + 128, 0); g.lineTo(i, 128); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 1.6);
  return t;
}

// a tyre with rounded shoulders (a lathe round the x axis) on a chrome five-spoke wheel
function wheel(tyreM, chromeM, darkM, r) {
  const g = new THREE.Group(), w = ROADSTER.width / 2;
  const prof = [[r * 0.62, -w * 0.92], [r * 0.9, -w], [r * 0.98, -w * 0.82], [r, -w * 0.45], [r, w * 0.45], [r * 0.98, w * 0.82], [r * 0.9, w], [r * 0.62, w * 0.92]].map(([a, b]) => new THREE.Vector2(a, b));
  const tyre = mesh(new THREE.LatheGeometry(prof, 40), tyreM, g); tyre.rotation.z = Math.PI / 2; tyre.material.side = THREE.DoubleSide;
  for (const s of [-1, 1]) {
    const face = mesh(new THREE.CircleGeometry(r * 0.64, 32), darkM, g, s * w * 0.9, 0, 0); face.rotation.y = (s * Math.PI) / 2;
    const rim = mesh(new THREE.TorusGeometry(r * 0.55, r * 0.06, 8, 32), chromeM, g, s * w * 0.88, 0, 0); rim.rotation.y = Math.PI / 2;
    const hub = mesh(new THREE.CylinderGeometry(r * 0.17, r * 0.2, 0.05, 18), chromeM, g, s * w * 0.9, 0, 0); hub.rotation.z = Math.PI / 2;
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2, sp = mesh(new THREE.BoxGeometry(0.03, r * 0.4, r * 0.08), chromeM, g, s * w * 0.9, Math.cos(a) * r * 0.33, Math.sin(a) * r * 0.33);
      sp.rotation.x = -a;
    }
  }
  return g;
}

export function buildRoadster(spec) {
  const root = new THREE.Group();
  const paint = mat(spec.color || "#ec4b3c", { roughness: 0.32, vertexColors: true });
  const chrome = mat("#e6e9ef", { roughness: 0.18, metalness: 0.85 }), dark = mat("#26272e", { roughness: 0.7 });
  const tyreM = mat("#1f2026", { roughness: 0.92 }), lens = new THREE.MeshStandardMaterial({ color: "#fff6cf", emissive: new THREE.Color("#fff1b8"), emissiveIntensity: 0.55, roughness: 0.2 });
  const amber = new THREE.MeshStandardMaterial({ color: "#ff9a2e", emissive: new THREE.Color("#ff8a1e"), emissiveIntensity: 0.35, roughness: 0.3 });
  const tail = new THREE.MeshStandardMaterial({ color: "#d4231d", emissive: new THREE.Color("#b01812"), emissiveIntensity: 0.3, roughness: 0.3 });
  const glass = mat("#cfeaf8", { roughness: 0.05, transparent: true, opacity: 0.32 }); glass.userData.glass = true;
  const body = mesh(bodyGeometry(), paint, root); body.name = "car-body";
  const front = BODY.z1, track = ROADSTER.track;

  // parts set into the body's surface: found by casting a ray at it along z (from the front, or from the back)
  const ray = new THREE.Raycaster(); body.updateMatrixWorld(true);
  const onBody = (x, y, back = false) => {
    ray.set(new THREE.Vector3(x, y, back ? -5 : 5), new THREE.Vector3(0, 0, back ? 1 : -1));
    const h = ray.intersectObject(body)[0];
    return h ? { p: h.point, n: h.face.normal.clone() } : { p: new THREE.Vector3(x, y, back ? BODY.z0 : front), n: new THREE.Vector3(0, 0, back ? -1 : 1) };
  };
  const facing = (o, at, n, out) => { o.position.copy(at.p).addScaledVector(at.n, out); o.lookAt(o.position.clone().add(n)); };
  // headlamps in the fender tips: a chrome bezel round a glowing domed lens; amber indicators below and outside
  for (const s of [-1, 1]) {
    const at = onBody(s * 0.7, 0.68), n = at.n.clone().lerp(new THREE.Vector3(0, 0, 1), 0.6).normalize();
    const bez = mesh(new THREE.TorusGeometry(0.165, 0.034, 12, 36), chrome, root); facing(bez, at, n, 0.02);
    const l = mesh(new THREE.SphereGeometry(0.16, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), lens, root); facing(l, at, n, -0.01);
    l.rotateX(Math.PI / 2); l.scale.y = 0.45; l.castShadow = false;
    const ia = onBody(s * 0.84, 0.44), ind = mesh(new THREE.SphereGeometry(0.045, 14, 10), amber, root); facing(ind, ia, ia.n, 0.0); ind.scale.z = 0.6;
    const ta = onBody(s * 0.62, 0.64, true), tl = mesh(new THREE.SphereGeometry(0.065, 14, 10), tail, root); facing(tl, ta, ta.n, 0.0); tl.scale.z = 0.5;
  }
  // the grille: an oval of dark mesh in a chrome ring, in the nose
  const gw = 0.4, gh = 0.15, ga = onBody(0, 0.47);
  const grille = mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshStandardMaterial({ map: meshTexture(), roughness: 0.6 }), root);
  facing(grille, ga, ga.n, 0.012); grille.scale.set(gw, gh, 1); grille.castShadow = false;
  const ring = mesh(new THREE.TorusGeometry(1, 0.07, 10, 48), chrome, root); facing(ring, ga, ga.n, 0.02); ring.scale.set(gw, gh, 0.6 * gh);
  // bumpers: thin chrome bars at the nose and the tail
  for (const [z, s] of [[front - 0.02, 1], [BODY.z0 + 0.03, -1]]) {
    const curve = new THREE.CatmullRomCurve3([[-0.82, 0.31, z - s * 0.3], [-0.45, 0.3, z - s * 0.06], [0.45, 0.3, z - s * 0.06], [0.82, 0.31, z - s * 0.3]].map((p) => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(curve, 24, 0.028, 8), chrome, root);
  }
  // the dashboard under the windscreen, the windscreen in its chrome frame
  const dash = mesh(new THREE.BoxGeometry(BODY.w * 1.62, 0.16, 0.24), dark, root, 0, 0.84, 0.43); dash.rotation.x = -0.15;
  const wsZ = 0.56, wsY = 0.92, wsH = 0.2, wsW = 1.46, rake = 0.55;
  const ws = mesh(new THREE.PlaneGeometry(wsW, wsH), glass, root, 0, wsY + (wsH / 2) * Math.cos(rake), wsZ - (wsH / 2) * Math.sin(rake)); ws.rotation.x = -rake; ws.castShadow = false;
  const frame = [[-wsW / 2, 0], [-wsW / 2, wsH], [wsW / 2, wsH], [wsW / 2, 0]].map(([x, h]) => new THREE.Vector3(x, wsY + h * Math.cos(rake), wsZ - h * Math.sin(rake)));
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([frame[0], frame[1], frame[2], frame[3]], false, "catmullrom", 0.05), 40, 0.018, 8), chrome, root);
  mesh(new THREE.TubeGeometry(new THREE.LineCurve3(frame[0], frame[3]), 4, 0.016, 8), chrome, root);
  // mirrors: red balls on chrome stalks on the front fenders
  for (const s of [-1, 1]) {
    const base = new THREE.Vector3(s * 0.98, 0.88, 0.72), top = new THREE.Vector3(s * 1.04, 1.0, 0.7);
    mesh(new THREE.TubeGeometry(new THREE.LineCurve3(base, top), 3, 0.014, 8), chrome, root);
    mesh(new THREE.SphereGeometry(0.06, 18, 12), mat(spec.color || "#ec4b3c", { roughness: 0.3 }), root, top.x, top.y + 0.03, top.z);
  }
  // a chrome trim along each door top and the rear deck's edge round the cockpit
  for (const s of [-1, 1]) {
    const pts = [-0.95, -0.6, -0.2, 0.2, 0.42].map((z) => new THREE.Vector3(s * BODY.w * 0.86, bodyTop(z) + 0.012, z));
    mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.018, 8), chrome, root);
  }
  // wheels: each on its own pivot (steer about y, travel up and down), the tyre spinning inside
  const R = spec.wheel ?? ROADSTER.rideY;
  const wheels = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
    const pivot = new THREE.Group(); pivot.position.set(sx * track, R, sz > 0 ? ROADSTER.front : ROADSTER.rear); root.add(pivot);
    const w = wheel(tyreM, chrome, dark, R); pivot.add(w);
    return { pivot, w, front: sz > 0 };
  });
  return {
    root, body,
    apply(st, t, dist, travel) {
      for (let i = 0; i < 4; i++) {
        const W = wheels[i];
        W.pivot.position.y = R + (travel ? travel[i] : 0);
        W.pivot.rotation.y = W.front ? (st.steer || 0) * 0.3 * (Math.PI / 180) : 0;
        W.w.rotation.x = dist / R;
      }
    },
  };
}
