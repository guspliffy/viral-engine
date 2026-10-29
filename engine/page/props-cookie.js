import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "The Slow-Motion Cookie Rescue" (Jonny's story library #05, 29 Oct 2026), in their own file so the clips
// made in parallel never edit the same one (props3d.js merges these into its KINDS and GRIPS):
//   chunkcookie  one thick, round chocolate-chip cookie, the size of a glove (spec.r, default 0.075 m; 2.6 cm thick).
//                Its origin is its CENTRE and it lies flat (faces up and down, +y), so it sits on a table at y = top +
//                COOKIE.t / 2. A golden baked top with darker cracks and chips, a slightly bumpy edge. `cut` 0..1 is the
//                bite: below 0.5 the cookie is whole, from 0.5 one bite is out of its edge at spec.biteAt (degrees in its
//                own x/z plane, 0 = +x, 90 = -z), with a few dough crumbs on the torn edge. Tween it across 0.5 on the
//                frame the edge is at the mouth: it is one bite, it doesn't grow. Grips: "edge" is a point just outside
//                the rim at biteAt + 180 (the side opposite the bite), for a hand that holds it by that edge.
//                Lean it with tilt (top toward +x: over a table's right edge it tips that way) and tip (top toward +z).
//   floorcushion a thick round pale-blue floor cushion (pouf) lying on the floor: spec.r (0.48) wide, spec.h (0.2) tall,
//                piping round its top edge, a covered button in a dimple in the middle. `squash` (every prop has it)
//                presses it down and out; `bend` 0..1 is the dent a body leaves in its top (the middle sinks up to
//                40 % of its height and stays down while someone lies on it).
//   carrier      nothing you can see: a point to "ride" (timeline.js) so a character follows a path the clip tweens with
//                prop x / y / z / rot (the Wizard's dive: a leap is a path, not a walk, and "fly" floats).
export const COOKIE = { r: 0.075, t: 0.026 };
export const CUSHION = { r: 0.48, h: 0.2 };
export const COOKIE_GRIPS = {
  // the rim opposite a bite at biteAt (pass the same angle to cookieEdge for another one)
  chunkcookie: { edge: cookieEdge(90 + 180) },
};
// a point just outside the rim at angle a (degrees, cookie plane: 0 = +x, 90 = -z), at mid-thickness
export function cookieEdge(a, r = COOKIE.r, out = 0.004) {
  const q = (a * Math.PI) / 180;
  return [Math.round(Math.cos(q) * (r + out) * 1000) / 1000, 0, Math.round(-Math.sin(q) * (r + out) * 1000) / 1000];
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function rnd(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// the cookie's outline: radius at angle q (radians, in its shape plane), a few soft lumps round the rim
const rim = (R, q) => R * (1 + 0.035 * Math.sin(5 * q + 0.7) + 0.02 * Math.sin(9 * q + 2.1) + 0.012 * Math.sin(17 * q));
// the bite: three overlapping tooth arcs eaten into the rim at angle b (radians); the ray from the centre at q stops
// where it first meets one of them
function bitten(R, q, b) {
  let r = rim(R, q);
  const u = [Math.cos(q), Math.sin(q)];
  for (const [da, d, rho] of [[0, 1.0, 0.44], [0.42, 1.04, 0.3], [-0.42, 1.04, 0.3]]) {
    const c = [Math.cos(b + da) * d * R, Math.sin(b + da) * d * R], uc = u[0] * c[0] + u[1] * c[1];
    const disc = uc * uc - (c[0] * c[0] + c[1] * c[1]) + (rho * R) ** 2;
    if (disc > 0) { const rin = uc - Math.sqrt(disc); if (rin > 0) r = Math.min(r, rin); }
  }
  return r;
}
function cookieShape(R, b) {
  const s = new THREE.Shape(), N = 160;
  for (let i = 0; i <= N; i++) {
    const q = (i / N) * Math.PI * 2, r = b == null ? rim(R, q) : bitten(R, q, b);
    if (i === 0) s.moveTo(r * Math.cos(q), r * Math.sin(q)); else s.lineTo(r * Math.cos(q), r * Math.sin(q));
  }
  return s;
}

export const COOKIE_KINDS = {
  carrier() { return { grip: 0 }; },
  chunkcookie(P) {
    const S = P.spec, R = S.r ?? COOKIE.r, T = COOKIE.t, b = (((S.biteAt ?? 90) * Math.PI) / 180);
    // the shape plane is x / -z of the cookie (the extrusion goes along +y after the turn below), so shape angle q is
    // the cookie-plane angle measured from +x toward -z, as spec.biteAt
    const top = canvasTex(256, 256, (g, w, h) => {
      const r = rnd(5); g.fillStyle = "#d9984a"; g.fillRect(0, 0, w, h);
      // a lighter golden middle, a darker baked ring toward the edge
      const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(246,196,112,0.9)"); gr.addColorStop(0.65, "rgba(232,170,86,0.5)"); gr.addColorStop(1, "rgba(160,92,36,0.9)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? "rgba(255,224,160,0.18)" : "rgba(150,86,30,0.16)"; g.beginPath(); g.ellipse(r() * w, r() * h, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, Math.PI * 2); g.fill(); }
      // a few baked cracks
      g.strokeStyle = "rgba(128,70,24,0.5)"; g.lineWidth = 2; g.lineCap = "round";
      for (let i = 0; i < 6; i++) { let x = w * (0.25 + r() * 0.5), y = h * (0.25 + r() * 0.5); g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 34; y += (r() - 0.5) * 34; g.lineTo(x, y); } g.stroke(); }
    });
    top.repeat.set(1 / (2.2 * R), 1 / (2.2 * R)); top.offset.set(0.5, 0.5); top.wrapS = top.wrapT = THREE.ClampToEdgeWrapping;
    const face = mat("#ffffff", { map: top, roughness: 0.9 }), side = mat("#b8763a", { roughness: 0.9 }), chip = mat("#3a2215", { roughness: 0.55 });
    const crumbM = mat("#e9b46a", { roughness: 0.95 });
    const make = (bite) => {
      const g = new THREE.Group(); P.whole.add(g);
      const bev = 0.006, geo = new THREE.ExtrudeGeometry(cookieShape(R, bite), { depth: T - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.9, bevelSegments: 3, curveSegments: 1 });
      geo.translate(0, 0, -(T - 2 * bev) / 2); geo.rotateX(-Math.PI / 2);   // shape x/y -> cookie x/-z, thickness along y
      mesh(geo, [face, side], g);
      // chocolate chips half sunk into both faces (none where the bite took the dough)
      const r = rnd(11);
      for (const sy of [1, -1]) for (let i = 0; i < 8; i++) {
        const q = r() * Math.PI * 2, d = R * (0.12 + 0.68 * Math.sqrt(r()));
        if (bite != null && d > bitten(R, q, bite) - 0.012) continue;
        const c = mesh(new THREE.IcosahedronGeometry(0.0085 + r() * 0.004, 0), chip, g, Math.cos(q) * d, sy * (T / 2 - 0.001), -Math.sin(q) * d);
        c.scale.set(1, 0.55, 1.15); c.rotation.y = r() * 3; c.castShadow = false;
      }
      // the torn edge of the bite: a few lighter crumbs of dough stuck along it
      if (bite != null) for (let i = 0; i < 6; i++) {
        const q = bite + (i / 5 - 0.5) * 0.9, d = bitten(R, q, bite) - 0.003, k = mesh(new THREE.IcosahedronGeometry(0.0045 + (i % 3) * 0.0015, 0), crumbM, g, Math.cos(q) * d, ((i % 2) - 0.5) * T * 0.5, -Math.sin(q) * d);
        k.castShadow = false;
      }
      return g;
    };
    const whole = make(null), eaten = make(b);
    eaten.visible = false;
    return { grip: 0, apply(ps) { const k = clamp(ps.cut || 0) >= 0.5; whole.visible = !k; eaten.visible = k; } };
  },

  floorcushion(P) {
    const S = P.spec, R = S.r ?? CUSHION.r, H = S.h ?? CUSHION.h;
    const weave = canvasTex(256, 256, (g, w, h) => {
      const r = rnd(7); g.fillStyle = S.color ?? "#9fbfe3"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 3) { g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.05})`; g.fillRect(0, y, w, 1); }
      for (let x = 0; x < w; x += 3) { g.fillStyle = `rgba(40,70,120,${0.04 + r() * 0.04})`; g.fillRect(x, 0, 1, h); }
      for (let i = 0; i < 30; i++) { const x = r() * w, y = r() * h, rr = 20 + r() * 50, gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, r() < 0.5 ? "rgba(255,255,255,0.08)" : "rgba(30,60,110,0.07)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    });
    weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(4, 2);
    const cloth = mat("#ffffff", { map: weave, roughness: 0.95 }), piping = mat(S.piping ?? "#7f9fcb", { roughness: 0.9 });
    // a lathe profile: flat bottom, a soft bulging side, a gently domed top that dips to a button in the middle
    const N = 18, pts = [new THREE.Vector2(0, 0.004)];
    for (let i = 0; i <= N; i++) { const a = -Math.PI / 2 + (i / N) * Math.PI, bulge = Math.cos(a); pts.push(new THREE.Vector2(R - 0.06 + 0.06 * bulge, H / 2 + (H / 2) * Math.sin(a))); }
    for (let i = 1; i <= 12; i++) { const k = i / 12, rr = (R - 0.06) * (1 - k); pts.push(new THREE.Vector2(Math.max(rr, 0.0005), H + 0.012 * Math.sin(Math.PI * Math.min(1, (1 - k) * 1.25)) - 0.03 * Math.max(0, 1 - rr / 0.12) ** 2)); }
    const geo = new THREE.LatheGeometry(pts, 64);
    const body = mesh(geo, cloth, P.whole);
    const base = Float32Array.from(geo.attributes.position.array);
    const pipe = mesh(new THREE.TorusGeometry(R - 0.045, 0.011, 8, 72), piping, P.whole, 0, H - 0.012, 0); pipe.rotation.x = Math.PI / 2;
    const btn = mesh(new THREE.SphereGeometry(0.022, 14, 10), piping, P.whole, 0, H - 0.03, 0); btn.scale.y = 0.5;
    let lastBend = -1;
    return {
      grip: H,
      apply(ps) {
        // the dent: the top sinks most in the middle and not at all at the piping, so the rim stays round
        const d = clamp(ps.bend || 0);
        if (d === lastBend) return; lastBend = d;
        const a = geo.attributes.position;
        for (let i = 0; i < a.count; i++) {
          const x = base[3 * i], y = base[3 * i + 1], z = base[3 * i + 2], rr = Math.hypot(x, z);
          const k = y > H * 0.5 ? Math.max(0, 1 - (rr / (R - 0.04)) ** 2) * ((y - H * 0.5) / (H * 0.5)) : 0;
          a.setY(i, y - 0.4 * H * d * k);
        }
        a.needsUpdate = true; geo.computeVertexNormals();
        btn.position.y = H - 0.03 - 0.4 * H * d; pipe.position.y = H - 0.012 - 0.03 * d;
      },
    };
  },
};
