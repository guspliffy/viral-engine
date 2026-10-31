import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Too Much Energy" (friend comedies 23, 30 Oct 2026): Reaper's bed in two parts so the mattress can tip,
// the window glass that Phoenix smashes, curtains his magic fire catches, the 06:00 clock, a short broom and a
// dustpan, the ash pile he burns out into, the ash stream tipped out of the window and the glow outside (set-energy.js
// is the still room).
//   bedframe     a single bed without its mattress, seen from its foot: the origin is where its sleeper sits up
//                (like props3d bed), the rails' top at RAIL_Y, headboard and footboard, legs. "sit" works on it.
//   tipmattress  the mattress with its sheet, pillow and blanket: its origin is the LEFT long bottom edge (the hinge),
//                the slab runs W along +x and from z -0.35 to +1.6 (the bed's length), so a prop `tilt` below 0
//                tips its right side up like a lid. cover 0..1 pulls the blanket's turned-down edge up to the
//                sleeper's chest (as props3d bed). Put it at the bedframe's x - W/2, y RAIL_Y, z.
//   winglass     the window's glass and its cross bars, filling ENERGY.win (origin: the opening's bottom middle, in
//                the wall). bulge 0..1 bows it into the room and cracks it; smash 0..1 is the 0.7 s after the break:
//                the pane is gone, a few chunky stylised shards fly a little way into the room and drop onto the sill
//                and the floor below it; jagged rests stay in the corners of the frame.
//   firecurtain  one curtain panel (origin bottom middle, spec.w x spec.h, colour spec.color) with its rod. fire
//                0..1: Phoenix's magic flames licking up its edge (spec.edge: -1 left, 1 right); scorch 0..1: dark
//                burnt patches that stay after the flames go out.
//   digiclock    a bedside digital clock (origin bottom middle, facing +z) reading spec.text ("06:00") in red LEDs.
//   broom        a short broom: straw head at the origin (its bottom), the handle up +y to spec.len (0.78).
//   dustpan      a dustpan lying on its floor (origin: the middle of its floor), its open mouth toward +z, the
//                handle out of its back (-z). fill 0..1: the ash heaped in it.
//   ashpile      one small neat pile of grey ash (origin its bottom middle); glow 0..1 a dying ember in it.
//   ashfall      ash pouring down from the origin (a dustpan's lip): fall 0..1 runs the stream over spec.dur
//                seconds (flakes leave in turn over the first 60 %, then fall away under gravity).
//   outglow      an orange glow outside a window (origin its middle, spec.w x spec.h, facing +z): glow 0..1, flickering.
// Glass, flames, glows and ash flakes are see-through for the checks (opacity under 0.5); the bed, the clock, the
// broom, the pan and the pile are solid.
export const RAIL_Y = 0.28;          // the bed rails' top: the mattress lies on it
export const MATTRESS = { w: 1.1, d: 0.14, z0: -0.35, len: 1.95 };
export const BROOM = { len: 0.78, head: 0.15, r: 0.018 };
export const PAN = { w: 0.26, d: 0.22, back: 0.075, handle: 0.24, rise: 0.61 };   // rise: the handle's angle up from level

const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
// see-through for the checks and drawn after the solid things (glass, flames, glows, flakes)
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };

// a flame tongue on a camera-facing quad: a yellow-white core, orange, a red rim, flickering with the clip time
function flameMaterial(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uSeed: { value: seed }, uA: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uTime, uSeed, uA; varying vec2 vUv;
      float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-4; return smoothstep(e - w, e + w, x); }
      void main() {
        float x = vUv.x - 0.5, y = vUv.y;
        float hgt = 0.7 + 0.25 * sin(uTime * 8.0 + uSeed * 9.0) * uA;
        float wid = 0.42 * (1.0 - y / hgt) * (0.6 + 0.4 * sqrt(clamp(y * 3.0, 0.0, 1.0)));
        float f = clamp(1.0 - abs(x - 0.08 * sin(y * 7.0 - uTime * 10.0 + uSeed * 4.0)) / max(wid, 0.001), 0.0, 1.0) * step(y, hgt);
        f *= uA; if (f < 0.04) discard;
        vec3 col = mix(vec3(0.86, 0.2, 0.06), vec3(1.0, 0.56, 0.12), aa(0.3, f));
        col = mix(col, vec3(1.0, 0.93, 0.6), aa(0.66, f));
        gl_FragColor = vec4(col, 1.0);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true;
  return m;
}

export const ENERGY_KINDS = {
  bedframe(P) {
    const wood = mat("#7a5236", { roughness: 0.7 }), dark = mat("#3c2a26", { roughness: 0.8 });
    const { w: W, z0: Z0, len: L } = MATTRESS;
    mesh(new THREE.BoxGeometry(W + 0.08, 0.14, L), wood, P.whole, 0, RAIL_Y - 0.07, Z0 + L / 2);         // rails + slats
    mesh(new THREE.BoxGeometry(W - 0.04, 0.02, L - 0.06), dark, P.whole, 0, RAIL_Y - 0.005, Z0 + L / 2);  // the slats' top
    mesh(new THREE.BoxGeometry(W + 0.14, 0.95, 0.08), wood, P.whole, 0, 0.475, Z0 - 0.04);                // headboard
    mesh(new THREE.BoxGeometry(W + 0.14, 0.06, 0.1), wood, P.whole, 0, 0.97, Z0 - 0.04);                  // its cap
    mesh(new THREE.BoxGeometry(W + 0.14, 0.4, 0.07), wood, P.whole, 0, 0.2, Z0 + L + 0.035);              // footboard
    for (const [sx, k] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) mesh(new THREE.BoxGeometry(0.08, RAIL_Y - 0.14, 0.08), wood, P.whole, sx * (W / 2), (RAIL_Y - 0.14) / 2, Z0 + 0.06 + k * (L - 0.12));
    return { grip: RAIL_Y };
  },
  tipmattress(P) {
    const S = P.spec, { w: W, d: D, z0: Z0, len: L } = MATTRESS;
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    x.fillStyle = S.blanket || "#3f5fae"; x.fillRect(0, 0, 128, 128); x.strokeStyle = S.stripe || "#6f8fd6"; x.lineWidth = 6;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, 16 + i * 32); x.lineTo(128, 16 + i * 32); x.stroke(); }
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(2, 3);
    const blanketM = mat("#ffffff", { map: tx, roughness: 0.85 }), sheet = mat("#eef0f6", { roughness: 0.8 }), side = mat("#d9dbe6", { roughness: 0.8 });
    // the slab: quilted sides (a seam line), the sheet over the top
    mesh(new THREE.BoxGeometry(W, D, L), sheet, P.whole, W / 2, D / 2, Z0 + L / 2);
    mesh(new THREE.BoxGeometry(W + 0.004, 0.012, L + 0.004), side, P.whole, W / 2, D * 0.55, Z0 + L / 2);
    const pil = mesh(new THREE.SphereGeometry(0.3, 18, 10), mat("#ffffff", { roughness: 0.8 }), P.whole, W / 2, D + 0.06, Z0 + 0.14); pil.scale.set(1.45, 0.32, 0.6);
    // the blanket: over the bed below the sleeper's chest, and its turned-down top edge rising to the chest
    mesh(new THREE.BoxGeometry(W + 0.06, 0.06, L - 0.5), blanketM, P.whole, W / 2, D + 0.02, Z0 + 0.5 + (L - 0.5) / 2);
    const edge = new THREE.Group(); edge.position.set(W / 2, D, 0.16); P.whole.add(edge);
    const flap = mesh(new THREE.BoxGeometry(W + 0.06, 1, 0.07), blanketM, edge, 0, 0.5, 0);
    return {
      grip: D,
      apply(ps) { const cv = clamp(ps.cover ?? 0); flap.scale.y = Math.max(0.05, 0.08 + 0.32 * cv); flap.position.y = flap.scale.y / 2; edge.visible = cv > 0.02; },
    };
  },
  winglass(P) {
    const S = P.spec, w = S.w ?? 0.9, h = S.h ?? 1.05;
    // the pane: a subdivided sheet that can bow into the room, faint blue with two highlight streaks and cracks
    const crack = document.createElement("canvas"); crack.width = 256; crack.height = 300; const g = crack.getContext("2d");
    const pane = new THREE.Group(); P.whole.add(pane);
    const drawGlass = (k) => {
      g.clearRect(0, 0, 256, 300); g.fillStyle = "rgba(170,200,255,0.35)"; g.fillRect(0, 0, 256, 300);
      g.strokeStyle = "rgba(255,255,255,0.55)"; g.lineWidth = 10; for (const o of [40, 80]) { g.beginPath(); g.moveTo(o, 300); g.lineTo(o + 120, 0); g.stroke(); }
      if (k > 0) {
        g.strokeStyle = `rgba(255,255,255,${0.9 * Math.min(1, k * 2)})`; g.lineWidth = 3;
        for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + 0.3, r = 40 + 110 * k; g.beginPath(); g.moveTo(128, 150); g.lineTo(128 + Math.cos(a) * r * 0.5, 150 + Math.sin(a) * r * 0.5 + 6); g.lineTo(128 + Math.cos(a + 0.12) * r, 150 + Math.sin(a + 0.12) * r); g.stroke(); }
      }
    };
    drawGlass(0);
    const gtx = new THREE.CanvasTexture(crack); gtx.colorSpace = THREE.SRGBColorSpace;
    const gm = new THREE.MeshBasicMaterial({ map: gtx, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }); gm.userData.noOutline = true;
    const geo = new THREE.PlaneGeometry(w, h, 12, 12), base = geo.attributes.position.array.slice();
    glowy(mesh(geo, gm, pane, 0, h / 2, 0), 3);
    const barM = mat("#e9e4ee");
    const bars = [mesh(new THREE.BoxGeometry(0.035, h, 0.035), barM, pane, 0, h / 2, 0), mesh(new THREE.BoxGeometry(w, 0.035, 0.035), barM, pane, 0, h * 0.55, 0)];
    // jagged rests in the corners after the break
    const shardM = new THREE.MeshBasicMaterial({ color: "#cfe0ff", transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false }); shardM.userData.noOutline = true;
    const tri = (a, b, c) => { const q = new THREE.BufferGeometry(); q.setAttribute("position", new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); return q; };
    const rests = new THREE.Group(); P.whole.add(rests);
    for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
      const x0 = (sx * w) / 2, y0 = sy * h, dx = -sx * 0.16, dy = sy ? -0.2 : 0.22;
      glowy(mesh(tri([x0, y0, 0], [x0 + dx, y0, 0], [x0, y0 + dy, 0]), shardM, rests), 3);
    }
    // the flying shards: chunky flat triangles with a white edge, each its own path (out into the room, down)
    const shards = Array.from({ length: S.shards ?? 9 }, (_, i) => {
      const sz = 0.06 + rnd(i) * 0.06, o = glowy(mesh(tri([-sz, -sz * 0.7, 0], [sz, -sz * 0.4, 0], [rnd(i + 9) * sz * 0.6, sz, 0]), shardM, P.whole), 3);
      const p0 = [(rnd(i + 1) - 0.5) * w * 0.8, h * (0.25 + rnd(i + 2) * 0.6), 0];
      // mostly out and down to the right (away from the bed at the left), a few fall back outside the wall
      const out = rnd(i + 5) < 0.3 ? -0.4 : 0.5 + rnd(i + 3) * 0.9, v = [0.2 + rnd(i + 4) * 0.7, 0.6 + rnd(i + 6) * 0.8, out];
      // where it lands: the sill (when it stops over the board) or the floor (spec.floor below the origin)
      return { o, p0, v, spin: [rnd(i + 7) * 12, rnd(i + 8) * 12, rnd(i + 10) * 8] };
    });
    const floor = -(S.floor ?? 0.55), sillD = S.sill ?? 0.19;
    return {
      grip: 0,
      apply(ps) {
        const b = clamp(ps.bulge), s = clamp(ps.smash), whole = s <= 0.001;
        pane.visible = whole; rests.visible = !whole;
        if (whole) {
          const a = geo.attributes.position.array;
          for (let i = 0; i < a.length; i += 3) { const u = (base[i] / w) * 2, v = (base[i + 1] / h) * 2; a[i + 2] = base[i + 2] + b * 0.1 * Math.max(0, 1 - u * u) * Math.max(0, 1 - v * v); }
          geo.attributes.position.needsUpdate = true; bars.forEach((o) => (o.position.z = b * 0.05));
          const k = Math.round(b * 8) / 8; if (pane.userData.k !== k) { pane.userData.k = k; drawGlass(k); gtx.needsUpdate = true; }
        }
        const T = s * 0.7;
        for (const sh of shards) {
          sh.o.visible = !whole;
          if (whole) continue;
          // fall under gravity until it reaches the sill (inside, over the board) or the floor, then lie still
          const land = sh.v[2] > 0 && sh.p0[2] + sh.v[2] * 0.3 < sillD ? 0.02 : sh.v[2] > 0 ? floor + 0.01 : -3;
          const tHit = (() => { const A = -4.9, B = sh.v[1], C = sh.p0[1] - land; return (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A); })();
          const u = Math.min(T, tHit);
          sh.o.position.set(sh.p0[0] + sh.v[0] * u, sh.p0[1] + sh.v[1] * u - 4.9 * u * u, sh.p0[2] + sh.v[2] * u);
          if (T < tHit) sh.o.rotation.set(sh.spin[0] * T, sh.spin[1] * T, sh.spin[2] * T); else sh.o.rotation.set(-Math.PI / 2, sh.spin[1] * tHit, 0);
          sh.o.visible = sh.o.position.y > -2.5;
        }
      },
    };
  },
  firecurtain(P) {
    const S = P.spec, w = S.w ?? 0.4, h = S.h ?? 1.6, edge = S.edge ?? 1;
    const m = mat(S.color || "#8c6fb8", { roughness: 0.85 });
    for (let k = 0; k < 5; k++) { const f = mesh(new THREE.CylinderGeometry(0.045, 0.06, h, 10), m, P.whole, -w / 2 + 0.05 + k * ((w - 0.1) / 4), h / 2, 0.03 * (k % 2)); f.castShadow = false; }
    mesh(new THREE.CylinderGeometry(0.018, 0.018, w + 0.3, 8), mat("#3a2a24"), P.whole, 0, h + 0.03, 0).rotation.z = Math.PI / 2;
    // scorch: dark burnt patches on the edge the fire caught, a ragged burnt hem
    const burnt = new THREE.MeshBasicMaterial({ color: "#1a1214", transparent: true, opacity: 0, depthWrite: false }); burnt.userData.noOutline = true;
    const spots = [[0.12, 0.35, 0.09], [0.06, 0.62, 0.07], [0.14, 0.9, 0.1], [0.04, 1.15, 0.06], [0.1, 0.18, 0.06]].map(([dx, y, r], i) => {
      const o = glowy(mesh(new THREE.CircleGeometry(r, 9), burnt, P.whole, edge * (w / 2 - dx), y * (h / 1.6), 0.075), 2); o.scale.y = 1.5 + rnd(i) * 0.6; return o;
    });
    // the flames: four tongues up the edge
    const flames = [0.15, 0.45, 0.75, 1.05].map((y, i) => {
      const fm = flameMaterial(rnd(i + 20)); const o = glowy(mesh(new THREE.PlaneGeometry(0.3, 0.42), fm, P.whole, edge * (w / 2 - 0.04), (y * h) / 1.6 + 0.21, 0.11), 4); o.castShadow = false; return { o, fm };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire), sc = clamp(ps.scorch);
        burnt.opacity = 0.45 * sc; spots.forEach((o) => (o.visible = sc > 0.01));
        flames.forEach(({ o, fm }, i) => { const k = clamp(f * 1.3 - i * 0.1); o.visible = k > 0.02; o.scale.setScalar(Math.max(0.01, k)); fm.uniforms.uTime.value = t ?? 0; fm.uniforms.uA.value = k; });
      },
    };
  },
  digiclock(P) {
    const S = P.spec, w = 0.3, h = 0.13, d = 0.1;
    mesh(new THREE.BoxGeometry(w, h, d), mat("#22232b", { roughness: 0.5 }), P.whole, 0, h / 2, 0);
    const c = document.createElement("canvas"); c.width = 256; c.height = 100; const x = c.getContext("2d");
    x.fillStyle = "#0c0b10"; x.fillRect(0, 0, 256, 100); x.fillStyle = "#ff3b2e"; x.font = "bold 78px monospace"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(S.text || "06:00", 128, 54);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.MeshBasicMaterial({ map: tx }); face.userData.noOutline = true;
    mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.72), face, P.whole, 0, h / 2, d / 2 + 0.002).castShadow = false;
    return { grip: h };
  },
  broom(P) {
    const S = P.spec, len = S.len ?? BROOM.len, hd = BROOM.head;
    const straw = mat("#d8b45a", { roughness: 0.9 }), dark = mat("#b48a3c", { roughness: 0.9 }), wood = mat("#8a5a34", { roughness: 0.6 });
    // the straw head: a flat fan, wider at the bottom, with a few darker strands and a red binding
    const fan = new THREE.CylinderGeometry(0.06, 0.12, hd, 12, 1); fan.scale(1, 1, 0.32);
    mesh(fan, straw, P.whole, 0, hd / 2, 0);
    for (let i = 0; i < 5; i++) { const s = mesh(new THREE.BoxGeometry(0.008, hd * 0.9, 0.01), dark, P.whole, -0.08 + i * 0.04, hd * 0.45, 0.034); s.rotation.z = (i - 2) * 0.12; s.castShadow = false; }
    mesh(new THREE.CylinderGeometry(0.064, 0.064, 0.025, 12), mat("#b43a32"), P.whole, 0, hd - 0.005, 0).scale.z = 0.4;
    mesh(new THREE.CylinderGeometry(BROOM.r, BROOM.r, len - hd, 10), wood, P.whole, 0, hd + (len - hd) / 2, 0);
    return { grip: len * 0.7 };
  },
  dustpan(P) {
    const { w, d, back, handle } = PAN;
    const m = mat(P.spec.color || "#4f7fa8", { roughness: 0.45, metalness: 0.2, side: THREE.DoubleSide });
    mesh(new THREE.BoxGeometry(w, 0.008, d), m, P.whole, 0, 0.004, 0);                                    // its floor
    mesh(new THREE.BoxGeometry(w, back, 0.01), m, P.whole, 0, back / 2, -d / 2);                          // the back
    for (const s of [-1, 1]) {                                                                            // the sloping sides
      const g = new THREE.BufferGeometry(), x = (s * w) / 2;
      g.setAttribute("position", new THREE.Float32BufferAttribute([x, 0, -d / 2, x, back, -d / 2, x, 0, d / 2], 3)); g.computeVertexNormals();
      mesh(g, m, P.whole);
    }
    // the handle: out of the back, rising at PAN.rise (radians) so a hand can hold it with the pan level
    const hm = mesh(new THREE.CylinderGeometry(0.017, 0.017, handle, 10), mat("#2d3c52", { roughness: 0.5 }), P.whole, 0, 0.06 + (handle / 2) * Math.sin(PAN.rise), -d / 2 - (handle / 2) * Math.cos(PAN.rise));
    hm.rotation.x = Math.PI / 2 + PAN.rise;
    // the ash in it: a low grey heap on the pan's floor, swelling with fill
    const heap = mesh(new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat("#8d8a92", { roughness: 1 }), P.whole, 0, 0.008, -0.02);
    return { grip: back, apply(ps) { const f = clamp(ps.fill); heap.visible = f > 0.01; heap.scale.set(Math.max(0.05, 0.7 + 0.3 * f), 0.55 * f + 0.01, Math.max(0.05, 0.6 + 0.3 * f)); } };
  },
  ashpile(P) {
    const g = new THREE.Group(); P.whole.add(g);
    const ash = mat("#8d8a92", { roughness: 1 }), dark = mat("#5c5862", { roughness: 1 });
    const pile = mesh(new THREE.ConeGeometry(0.15, 0.12, 16, 3), ash, g, 0, 0.06, 0);
    pile.geometry.attributes.position.array.forEach((_, i, a) => { if (i % 3 === 1 && a[i] < 0.059) { a[i - 1] *= 1 + 0.12 * Math.sin(i * 3.1); a[i + 1] *= 1 + 0.12 * Math.cos(i * 2.3); } });
    pile.geometry.computeVertexNormals();
    for (let i = 0; i < 7; i++) { const a = rnd(i) * 6.28, r = 0.05 + rnd(i + 3) * 0.08; mesh(new THREE.SphereGeometry(0.018 + rnd(i + 5) * 0.012, 6, 4), i % 2 ? dark : ash, g, Math.cos(a) * r, 0.01, Math.sin(a) * r * 0.8); }
    // the ember: a hot orange core near the top, fading with glow
    const em = new THREE.MeshBasicMaterial({ color: "#ff8a2a", transparent: true, opacity: 0.45, depthWrite: false }); em.userData.noOutline = true;
    const ember = glowy(mesh(new THREE.SphereGeometry(0.03, 10, 8), em, g, 0.01, 0.1, 0.03), 4);
    return { grip: 0.12, apply(ps, t) { const k = clamp(ps.glow); ember.visible = k > 0.02; em.opacity = 0.45 * k * (0.75 + 0.25 * Math.sin((t ?? 0) * 17)); ember.scale.setScalar(0.6 + 0.6 * k); } };
  },
  ashfall(P) {
    const S = P.spec, n = S.flakes ?? 36, dur = S.dur ?? 0.8;
    const fm = new THREE.MeshBasicMaterial({ color: "#a9a5ae", transparent: true, opacity: 0.45, depthWrite: false }); fm.userData.noOutline = true;
    const flakes = Array.from({ length: n }, (_, i) => ({ o: glowy(mesh(new THREE.SphereGeometry(0.012 + rnd(i) * 0.012, 6, 4), fm, P.whole), 3), r: [rnd(i + 1) - 0.5, rnd(i + 2) - 0.5, rnd(i + 3)] }));
    return {
      grip: 0,
      apply(ps) {
        const T = clamp(ps.fall) * dur;
        flakes.forEach(({ o, r }, i) => {
          const a = T - (i / n) * 0.6 * dur;
          o.visible = a > 0 && ps.fall < 0.999;
          if (!o.visible) return;
          o.position.set(r[0] * 0.12 + r[0] * 0.25 * a, -4.0 * a * a - 0.3 * a * r[2], r[1] * 0.08 - 0.12 * a);
        });
      },
    };
  },
  outglow(P) {
    const S = P.spec, w = S.w ?? 1.6, h = S.h ?? 1.6;
    const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d");
    const gr = x.createRadialGradient(64, 80, 4, 64, 80, 64); gr.addColorStop(0, "rgba(255,215,90,1)"); gr.addColorStop(0.3, "rgba(255,150,30,0.97)"); gr.addColorStop(0.7, "rgba(250,110,15,0.7)"); gr.addColorStop(1, "rgba(255,110,20,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, fog: false }); m.userData.noOutline = true;
    const o = glowy(mesh(new THREE.PlaneGeometry(w, h), m, P.whole), 2);
    return { grip: 0, apply(ps, t) { const k = clamp(ps.glow); o.visible = k > 0.01; m.opacity = k * (0.85 + 0.15 * Math.sin((t ?? 0) * 11) * Math.sin((t ?? 0) * 4.3)); } };
  },
};
// grip points (the prop's own frame, before its scale): the broom's handle where a fist closes on it, the pan's handle
export const ENERGY_GRIPS = {
  broom: { hand: [0, 0.56, 0], low: [0, 0.4, 0] },
  dustpan: { handle: [0, 0.06 + 0.85 * PAN.handle * Math.sin(PAN.rise), -PAN.d / 2 - 0.85 * PAN.handle * Math.cos(PAN.rise)] },
};
