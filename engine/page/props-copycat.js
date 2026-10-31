import * as THREE from "three";
import { clamp } from "./util.js";
import { flameMesh, glowMesh } from "./props-candle.js";

// Props for "Friends Who Copy Everything" (Jonny's four friend comedies #21, 30 Oct 2026): a round café table, two
// small already-open hot-sauce bottles (told apart by how full they are), one white table candle that Dragon lights,
// and the hole the Wizard's oversized fire blast opens in the café wall.
//   cafetable    a round wooden café table on one pedestal (origin = the floor under its middle). spec.h its height,
//                spec.r the top's radius. Grip: its top (`grip` = h).
//   hotsauce     a small clear glass bottle with a red sauce inside, a white paper label round its middle with a red
//                chili on it and a red rim at its open neck (no cap: it is already open). Origin = its bottom centre.
//                `fill` 0..1 is how full it is (the sauce's level; empty shows clear glass above and below the label).
//                Held round the label with the mug hold (grips.mjs SIZE hotsauce).
//   pillarcandle a short white table candle on a brass dish (origin = the dish's bottom centre). `lit` 0..1 lights its
//                flame (the candle clip's cel flame and glow), `fire` 0..1 flares it.
//   sidewall     a plain café side wall (the right-hand wall the blast hits): warm cream plaster with soft light falling
//                across it, a sage wainscot with a wooden rail and a baseboard. Origin = its bottom middle on the floor; it
//                faces +z (turn it with rot). spec.w, spec.h its size (metres).
//   wallhole     the hole a blast punches in a plaster wall: a ragged opening showing the view outside (sky, a lake,
//                hills), a broken plaster rim round it and chunky plaster pieces that fly out and land on the floor.
//                Origin = the hole's centre on the wall's face; it faces +z. spec.r is the hole's radius, spec.floor the
//                floor's height below the origin (metres, positive), spec.wall the plaster's colour. `open` 0..1 grows
//                the hole, `burst` is the seconds since it burst (tween it linearly; the pieces fly, fall and settle
//                on their own, the same on every render).
// The glass and flames are see-through (opacity under 0.5), so the contact checks leave them out: a hand on a bottle is
// measured against its label, sauce and rim.
export const COPYCAT = {
  sauce: { r: 0.022, body: 0.072, neckR: 0.0085, h: 0.112, label: [0.018, 0.056] },   // the bottle (label: its bottom and top)
  candle: { r: 0.032, h: 0.085, dish: 0.052 },
};
COPYCAT.candle.wickTop = 0.012 + COPYCAT.candle.h + 0.012;   // the flame's root above the dish's bottom
export const COPYCAT_GRIPS = {};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// a stable pseudo-random number for index i (renders stay deterministic: no Math.random)
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const canvasTex = (w, h, draw) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; draw(cv.getContext("2d"), w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; };

export const COPYCAT_KINDS = {
  cafetable(P) {
    const S = P.spec, H = S.h ?? 0.34, R = S.r ?? 0.62, T = 0.05;
    const wood = mat(S.color ?? "#b8773f", { roughness: 0.42 }), dark = mat(S.leg ?? "#6e4422", { roughness: 0.55 });
    wood.userData.lookRole = dark.userData.lookRole = "wood";
    mesh(new THREE.CylinderGeometry(R, R, T, 64), wood, P.whole, 0, H - T / 2, 0);
    mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.06, 0.03, 48), dark, P.whole, 0, H - T - 0.015, 0);   // the skirt under the edge
    mesh(new THREE.CylinderGeometry(0.045, 0.06, H - T - 0.03, 20), dark, P.whole, 0, (H - T - 0.03) / 2 + 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.24, 0.27, 0.035, 32), dark, P.whole, 0, 0.0175, 0);
    return { grip: H };
  },
  hotsauce(P) {
    const B = COPYCAT.sauce, S = P.spec;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#f3fbff", roughness: 0.06, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    // the bottle: a straight body, a rounded shoulder and a narrow neck (one lathe, open at the top)
    const prof = [[0.001, 0], [B.r - 0.003, 0], [B.r, 0.004], [B.r, B.body], [B.r * 0.86, B.body + 0.01], [B.neckR * 1.3, B.body + 0.022], [B.neckR, B.body + 0.028], [B.neckR, B.h]].map(([x, y]) => new THREE.Vector2(x, y));
    const shell = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); shell.castShadow = false; shell.renderOrder = 3;
    // the sauce: a cylinder whose top follows `fill`, plus the neck's sauce while it is full
    const sauceM = mat(S.sauce ?? "#c8261a", { roughness: 0.3 });
    const sauce = mesh(new THREE.CylinderGeometry(B.r - 0.002, B.r - 0.002, 1, 28), sauceM, P.whole); sauce.renderOrder = 2;
    const neck = mesh(new THREE.CylinderGeometry(B.neckR - 0.0015, B.r * 0.84, B.h - B.body - 0.008, 20), sauceM, P.whole, 0, (B.h + B.body - 0.008) / 2, 0); neck.renderOrder = 2;
    // the label: white paper with a red chili and two thin red lines
    const tex = canvasTex(256, 96, (g, w, h) => {
      g.fillStyle = "#fbf4e6"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#c8261a"; g.fillRect(0, 8, w, 6); g.fillRect(0, h - 14, w, 6);
      for (const cx of [64, 192]) {   // a chili on the front and on the back
        g.save(); g.translate(cx, h / 2); g.rotate(-0.5);
        g.fillStyle = "#d8261a"; g.beginPath(); g.ellipse(0, 0, 30, 11, 0, 0, Math.PI * 2); g.fill();
        g.beginPath(); g.moveTo(26, -4); g.quadraticCurveTo(44, 0, 40, 14); g.lineTo(34, 12); g.quadraticCurveTo(36, 4, 24, 4); g.fill();
        g.fillStyle = "#3f8f2a"; g.beginPath(); g.ellipse(-30, -2, 8, 7, 0.3, 0, Math.PI * 2); g.fill();
        g.restore();
      }
    });
    tex.offset.x = 0.25;   // a chili faces the front (+z)
    const [l0, l1] = B.label;
    mesh(new THREE.CylinderGeometry(B.r + 0.0012, B.r + 0.0012, l1 - l0, 32, 1, true), mat("#ffffff", { map: tex, roughness: 0.7, side: THREE.DoubleSide }), P.whole, 0, (l0 + l1) / 2, 0);
    const rim = mesh(new THREE.TorusGeometry(B.neckR + 0.0006, 0.0022, 8, 24), mat("#a81c14", { roughness: 0.4 }), P.whole, 0, B.h - 0.002, 0); rim.rotation.x = Math.PI / 2;
    const fill0 = 0.004, full = B.body - fill0;
    return {
      grip: B.h / 2,
      apply(ps) {
        const f = clamp(ps.fill ?? 1), y = full * f;
        sauce.visible = f > 0.01; sauce.scale.y = Math.max(y, 0.001); sauce.position.y = fill0 + y / 2;
        neck.visible = f > 0.985;
      },
    };
  },
  pillarcandle(P) {
    const C = COPYCAT.candle;
    const brass = mat("#d8a548", { roughness: 0.3, metalness: 0.6 }), wax = mat("#fbf6ea", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(C.dish, C.dish * 0.9, 0.012, 40), brass, P.whole, 0, 0.006, 0);
    mesh(new THREE.TorusGeometry(C.dish - 0.003, 0.004, 8, 40), brass, P.whole, 0, 0.012, 0).rotation.x = Math.PI / 2;
    // the wax, with a soft dip round the wick at its top
    const prof = [[0.001, 0], [C.r, 0], [C.r, C.h], [C.r - 0.004, C.h + 0.002], [C.r * 0.5, C.h - 0.002], [0.001, C.h - 0.004]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 40), wax, P.whole, 0, 0.012, 0);
    const wick = mesh(new THREE.CylinderGeometry(0.0013, 0.0016, 0.016, 6), mat("#2a211c", { roughness: 0.9 }), P.whole, 0, 0.012 + C.h + 0.004, 0); wick.castShadow = false;
    const flame = flameMesh(P.whole, C.wickTop - 0.002), glow = glowMesh(P.whole, C.wickTop + 0.014);
    const light = new THREE.PointLight("#ffb36b", 0, 1.6, 1.8); light.position.set(0, C.wickTop + 0.03, 0.03); P.whole.add(light);
    return {
      grip: C.h,
      apply(ps, t) {
        const l = clamp(ps.lit), f = clamp(ps.fire), fl = 1 + 0.06 * Math.sin(t * 0.229) + 0.04 * Math.sin(t * 0.379 + 1);
        const u = flame.material.uniforms;
        u.uTime.value = t; u.uFire.value = f; u.uBend.value = ps.bend ?? 0;
        u.uH.value = 0.045 * Math.pow(l, 0.7) * (1 + 4 * f) * fl; u.uW.value = 0.015 * Math.pow(l, 0.5) * (1 + 2.5 * f);
        u.uA.value = clamp(l * 1.6); flame.visible = l > 0.01;
        const g = glow.material.uniforms; g.uR.value = 0.06 * (1 + 0.8 * f) * (0.6 + 0.4 * l); g.uA.value = 0.36 * l * fl; g.uLift.value = 0.05 * f;
        glow.visible = l > 0.01;
        light.intensity = 0.7 * l * (1 + 2 * f) * fl;
      },
    };
  },
  sidewall(P) {
    const S = P.spec, W = S.w ?? 5, H = S.h ?? 3.2;
    const tex = canvasTex(1024, Math.round(1024 * H / W), (g, w, h) => {
      const k = h / H;   // pixels a metre
      const lit = g.createLinearGradient(0, 0, w, 0); lit.addColorStop(0, "#e8d4b4"); lit.addColorStop(0.45, "#f4e4c8"); lit.addColorStop(1, "#ead7b8");
      g.fillStyle = lit; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(255, 236, 190, 0.35)";   // two soft sun patches
      for (const [x, y, rw, rh] of [[0.3, 0.35, 0.16, 0.22], [0.62, 0.3, 0.12, 0.18]]) { g.beginPath(); g.ellipse(x * w, y * h, rw * w, rh * h, 0, 0, Math.PI * 2); g.fill(); }
      const wain = h - 0.95 * k;
      g.fillStyle = "#9fb08f"; g.fillRect(0, wain, w, h - wain);
      g.strokeStyle = "#8a9c7a"; g.lineWidth = 6;
      for (let x = 30; x < w - 60; x += 190) g.strokeRect(x, wain + 0.12 * k, 160, 0.6 * k);
      g.fillStyle = "#b07a48"; g.fillRect(0, wain - 0.05 * k, w, 0.07 * k);
      g.fillStyle = "#8a5a32"; g.fillRect(0, h - 0.12 * k, w, 0.12 * k);
    });
    const m = mat("#ffffff", { map: tex, roughness: 0.9 });
    const wall = mesh(new THREE.PlaneGeometry(W, H), m, P.whole, 0, H / 2, 0); wall.castShadow = false;
    return { grip: 0 };
  },
  wallhole(P) {
    const S = P.spec, R = S.r ?? 0.6, FLOOR = S.floor ?? 1.2, N = 40;
    // the ragged outline: a radius per angle, the same every render
    const edge = Array.from({ length: N }, (_, i) => 0.78 + 0.3 * rnd(i + 3) + (i % 3 === 0 ? 0.08 : 0));
    const outline = (k) => { const s = new THREE.Shape(); for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI * 2, r = R * k * edge[i % N]; if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r * 1.1); else s.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.1); } return s; };
    // the view through it: a bright morning sky, far hills, a blue lake and a green shore
    const view = canvasTex(512, 512, (g, w, h) => {
      const sky = g.createLinearGradient(0, 0, 0, h * 0.55); sky.addColorStop(0, "#5aa9e6"); sky.addColorStop(1, "#bfe3f7");
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      g.fillStyle = "#ffffff"; for (const [x, y, r] of [[120, 120, 38], [160, 110, 46], [205, 125, 34], [380, 80, 30], [415, 72, 38]]) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = "#7f9fb8"; g.beginPath(); g.moveTo(0, 290); for (let x = 0; x <= w; x += 32) g.lineTo(x, 262 - 34 * Math.sin(x / 70) - 18 * Math.sin(x / 23)); g.lineTo(w, 330); g.lineTo(0, 330); g.fill();
      g.fillStyle = "#4f8fc4"; g.fillRect(0, 300, w, 90);
      g.fillStyle = "#8ac6ea"; for (let i = 0; i < 9; i++) g.fillRect(40 + i * 52, 318 + (i % 3) * 18, 26, 3);
      g.fillStyle = "#5f9b3c"; g.beginPath(); g.moveTo(0, 380); g.quadraticCurveTo(w * 0.5, 350, w, 390); g.lineTo(w, h); g.lineTo(0, h); g.fill();
    });
    const viewM = new THREE.MeshBasicMaterial({ map: view }); viewM.userData.noOutline = true;
    const hole = mesh(new THREE.ShapeGeometry(outline(1), 2), viewM, P.whole, 0, 0, 0.004); hole.castShadow = hole.receiveShadow = false;
    // UVs across the hole's box so the view fills it
    const uv = hole.geometry.attributes.uv, pos = hole.geometry.attributes.position;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + pos.getX(i) / (2.8 * R), 0.5 + pos.getY(i) / (2.8 * R));
    // the broken plaster rim: a ring of the wall's colour round the hole, a darker crack line on its inner edge
    const rimShape = outline(1.22); rimShape.holes.push(outline(1));
    const plaster = mat(S.wall ?? "#efe2c8", { roughness: 0.85 }), crack = mat("#8f7a5c", { roughness: 0.9 });
    const rimM = mesh(new THREE.ShapeGeometry(rimShape, 2), plaster, P.whole, 0, 0, 0.012); rimM.castShadow = false;
    const inner = outline(1.06); inner.holes.push(outline(1));
    const crackM = mesh(new THREE.ShapeGeometry(inner, 2), crack, P.whole, 0, 0, 0.014); crackM.castShadow = false;
    // the pieces: chunky plaster, each with its own start, speed and spin; they fall to the floor and stay
    const chunks = Array.from({ length: S.pieces ?? 16 }, (_, i) => {
      const a = rnd(i + 50) * Math.PI * 2, r0 = R * 0.5 * Math.sqrt(rnd(i + 70)), big = 0.05 + 0.07 * rnd(i + 90);
      const m = mesh(new THREE.DodecahedronGeometry(big, 0), i % 4 === 0 ? crack : plaster, P.whole);
      m.scale.set(1, 0.6 + 0.4 * rnd(i + 110), 0.7 + 0.5 * rnd(i + 130));
      return { m, big, p0: [Math.cos(a) * r0, Math.sin(a) * r0, 0.06], v: [Math.cos(a) * (0.3 + 0.6 * rnd(i + 150)), 0.4 + 1.2 * rnd(i + 170), 0.25 + 0.45 * rnd(i + 190)], spin: [4 * rnd(i + 210) - 2, 6 * rnd(i + 230) - 3, 4 * rnd(i + 250) - 2] };
    });
    const G = 9.8;
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open ?? 0), b = Math.max(0, ps.burst ?? 0);
        for (const m of [hole, rimM, crackM]) { m.visible = o > 0.01; m.scale.set(Math.max(o, 0.01), Math.max(o, 0.01), 1); }
        for (const c of chunks) {
          c.m.visible = o > 0.01;
          // flight until it reaches the floor, then it lies there (a little slide, no bounce)
          const yFloor = -FLOOR + c.big * 0.5, land = (c.v[1] + Math.sqrt(c.v[1] ** 2 + 2 * G * (c.p0[1] - yFloor))) / G, tf = Math.min(b, land);
          const slide = Math.min(Math.max(0, b - land), 0.25), k = slide * (1 - slide / 0.5) * 0.6;
          c.m.position.set(c.p0[0] + c.v[0] * (tf + k), b >= land ? yFloor : c.p0[1] + c.v[1] * tf - 0.5 * G * tf * tf, c.p0[2] + c.v[2] * (tf + k));
          c.m.rotation.set(c.spin[0] * tf, c.spin[1] * tf, c.spin[2] * tf);
        }
      },
    };
  },
};
