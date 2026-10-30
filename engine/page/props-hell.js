import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Real Footage of Hell" (30 Oct 2026): the moving parts of the giant fryer and its tunnel (set-furnace.js
// is the still scenery).
//   fryoil       the oil in the vat: a flat amber surface (spec.w x spec.d) with bubbles that swell, pop and ring
//                out, drawn by its own shader from the clip time. Its origin is the surface's centre.
//   burnerflames flame tongues licking up from the burner's slots (spec.at: [[x, z], ...] in the prop's frame, or a
//                row spec.xs at z 0; spec.w x spec.h each), facing +z, flickering.
//   fryerbasket  one wire basket: a rigid box of bars (spec.w x spec.d x spec.h, origin = the floor's centre) with a
//                bail (two side posts and a top bar, spec.bail high) and a hook, and the lift chain from the hook up
//                to spec.top (world y; it shortens as the basket rises, so it stays taut). `spill` 0..1 makes oil drip
//                from its bottom back down to spec.oil (world y). A character stands in it with { do: "ride" }.
//   steamjet     a jet of steam from a vent along the prop's +x: puffs that stream out, swell and thin. `jet` 0..1
//                is how hard it blows (spec.len metres at full), spec.width the puffs' size. spec.fire: a jet of
//                flame instead (white-yellow core, orange, red ragged edge; the tongues rise as they burn out) with a
//                glow round the nozzle.
//   steamhaze    a few large soft drifting veils of steam (spec.w wide), always there, spec.a their strength.
//   bobspud      a whole plain potato floating in the oil (spec.r its size), bobbing and turning slowly.
//   fryfloat     a few French fries floating in the oil (spec.at: [[x, z, yaw], ...] in the prop's frame), bobbing.
// fryerbasket spec.fries: [[x, z, yaw, tilt, len], ...] French fries leaning in the basket (they ride it).
//   spudshadows  the furnace light on a wall with big potato-shaped shadows bobbing across it (spec.w x spec.h,
//                facing the prop's +z; spec.hot 1 or 0: which end the light comes from): what the oil throws on the tunnel wall before the reveal.
// Oil, flames, steam, drips, shadows and light are see-through for the checks (opacity under 0.5); the basket's bars
// and the potatoes are solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };

// a camera-facing disc of steam: soft round edge, lit warm from below (the furnace), white in the middle
function puffMaterial(fire = false) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uFire: { value: fire ? 1 : 0 }, uHeat: { value: 1 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime, uFire, uHeat; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float rag = uFire > 0.5 ? 0.16 : 0.08;
        float edge = 0.86 + rag * sin(a * 4.0 + uSeed * 6.3 + uTime * (uFire > 0.5 ? 9.0 : 1.5)) + rag * 0.6 * sin(a * 7.0 - uSeed * 2.0 - uTime * 6.0 * uFire);
        float d = r / edge; if (d > 1.0) discard;
        vec3 col = mix(vec3(1.0, 0.97, 0.94), vec3(1.0, 0.62, 0.48), smoothstep(0.1, 0.9, -q.y * 0.5 + d * 0.6));
        float al = uA * (1.0 - smoothstep(0.45, 1.0, d));
        if (uFire > 0.5) {
          // flame: a white-yellow core, orange, a red ragged rim; cooler (redder) as the tongue burns out (uHeat 1 -> 0)
          float k = clamp(d * 1.1 + (1.0 - uHeat) * 0.6, 0.0, 1.0);
          col = mix(vec3(1.0, 0.97, 0.7), vec3(1.0, 0.66, 0.12), smoothstep(0.0, 0.45, k));
          col = mix(col, vec3(0.92, 0.22, 0.06), smoothstep(0.55, 0.95, k));
          al = uA * (1.0 - smoothstep(0.75, 1.0, d));
        }
        gl_FragColor = vec4(col, al);
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true;
  return m;
}

// a French fry: a long square stick with soft edges, golden with a browner, crispier tip at each end and a little
// bend; origin at its bottom end, along +y
const fryMats = () => ({
  gold: new THREE.MeshStandardMaterial({ color: "#f2b53a", roughness: 0.35 }),
  tip: new THREE.MeshStandardMaterial({ color: "#c9741e", roughness: 0.5 }),
});
function fryStick(M, len, th = 0.06, seed = 0) {
  const g = new THREE.Group(), body = new THREE.Mesh(new THREE.BoxGeometry(th, len - 0.04, th, 1, 4, 1), M.gold);
  const p = body.geometry.attributes.position, bend = 0.04 * (rnd(seed) - 0.5);
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / (len - 0.04); p.setX(i, p.getX(i) + bend * (1 - 4 * y * y)); }
  body.geometry.computeVertexNormals(); body.position.y = len / 2; body.castShadow = true; g.add(body);
  for (const y of [0.02, len - 0.02]) { const e = new THREE.Mesh(new THREE.BoxGeometry(th * 0.96, 0.04, th * 0.96), M.tip); e.position.y = y; e.castShadow = true; g.add(e); }
  return g;
}

export const HELL_KINDS = {
  fryoil(P) {
    const S = P.spec, w = S.w ?? 4.9, d = S.d ?? 3.3;
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2(w, d) } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uTime; uniform vec2 uSize; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-4; return smoothstep(e - w, e + w, x); }
        void main() {
          vec2 p = vUv * uSize;
          // deep amber oil, hotter (paler) toward the middle, slow swirling bands
          float sw = sin(p.x * 1.3 + uTime * 0.9 + sin(p.y * 1.7 - uTime * 0.6) * 1.2) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.72, 0.32, 0.05), vec3(0.98, 0.62, 0.16), 0.35 + 0.35 * sw);
          col = mix(col, vec3(1.0, 0.8, 0.36), aa(0.86, sw) * 0.6);
          // bubbles: a cell grid, each cell's bubble swells, pops and leaves a ring
          float b = 0.0, ring = 0.0;
          for (int k = 0; k < 2; k++) {
            float sc = k == 0 ? 3.2 : 5.5;
            vec2 g = p * sc, id = floor(g), f = fract(g) - 0.5;
            float r0 = h(id + float(k) * 7.0), per = 0.7 + r0 * 0.8, ph = fract(uTime / per + r0 * 9.0);
            vec2 c = vec2(h(id + 3.1), h(id + 5.7)) - 0.5; c *= 0.5;
            float dd = length(f - c), rad = (0.12 + 0.18 * r0) * smoothstep(0.0, 0.7, ph);
            if (ph < 0.75) b = max(b, 1.0 - aa(rad, dd));
            else { float rr = rad + (ph - 0.75) * 1.2; ring = max(ring, (1.0 - aa(0.04, abs(dd - rr))) * (1.0 - (ph - 0.75) * 4.0)); }
          }
          col = mix(col, vec3(1.0, 0.86, 0.5), b * 0.75);
          col = mix(col, vec3(1.0, 0.92, 0.66), ring * 0.7);
          // a darker band where the oil meets the steel
          vec2 e = min(vUv, 1.0 - vUv) * uSize; col *= 0.7 + 0.3 * smoothstep(0.0, 0.25, min(e.x, e.y));
          gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        }`,
      // drawn opaque (alpha 1); the opacity flag only keeps it out of the contact checks (a potato stands under it)
      transparent: true, depthWrite: true, opacity: 0.4,
    });
    m.userData.noOutline = true;
    const o = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); o.rotation.x = -Math.PI / 2; o.renderOrder = 1; o.receiveShadow = false; o.castShadow = false; P.whole.add(o);
    // the heat glow over the oil
    const gm = new THREE.ShaderMaterial({
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "varying vec2 vUv; void main() { float r = length((vUv - 0.5) * vec2(2.0, 2.0)); gl_FragColor = vec4(vec3(1.0, 0.45, 0.1) * 0.35 * (1.0 - smoothstep(0.0, 1.0, r)), 1.0); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
    });
    gm.userData.noOutline = true;
    const glow = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w * 1.1, 1.4), gm), 2); glow.position.set(0, 0.55, d / 2 - 0.2); P.whole.add(glow);
    return { grip: 0, apply(ps, t) { m.uniforms.uTime.value = t; } };
  },
  burnerflames(P) {
    const S = P.spec, at = S.at || (S.xs || [0]).map((x) => [x, 0]), w = S.w ?? 0.46, h = S.h ?? 0.5;
    const flames = at.map(([x, z], i) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uSeed: { value: rnd(i + 3) } },
        vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: `uniform float uTime, uSeed; varying vec2 vUv;
          float aa(float e, float x) { float w = fwidth(x) * 0.9 + 1e-4; return smoothstep(e - w, e + w, x); }
          void main() {
            // three tongues licking up, cel bands: a yellow-white core, orange, a red rim
            float x = vUv.x, y = vUv.y, f = 0.0;
            for (int k = 0; k < 3; k++) {
              float c = 0.2 + 0.3 * float(k) + 0.04 * sin(uTime * 7.0 + float(k) * 2.1 + uSeed * 6.0);
              float hgt = 0.65 + 0.3 * sin(uTime * (5.0 + float(k)) + uSeed * 9.0 + float(k));
              float wid = 0.17 * (1.0 - y / hgt) + 0.02 * sin(y * 14.0 - uTime * 12.0 + float(k));
              f = max(f, clamp(1.0 - abs(x - c - 0.05 * sin(y * 6.0 - uTime * 9.0)) / max(wid, 0.001), 0.0, 1.0) * step(y, hgt));
            }
            if (f < 0.02) discard;
            vec3 col = mix(vec3(0.85, 0.16, 0.05), vec3(1.0, 0.55, 0.1), aa(0.3, f));
            col = mix(col, vec3(1.0, 0.92, 0.55), aa(0.68, f));
            gl_FragColor = vec4(col, 1.0);
          }`,
        transparent: true, depthWrite: false, opacity: 0.45,
      });
      m.userData.noOutline = true;
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 4); o.position.set(x, h / 2, z); P.whole.add(o);
      return m;
    });
    return { grip: 0, apply(ps, t) { for (const m of flames) m.uniforms.uTime.value = t; } };
  },
  fryerbasket(P) {
    const S = P.spec, W = S.w ?? 1.15, D = S.d ?? 1.05, H = S.h ?? 0.62, B = S.bail ?? 1.62, r = 0.013;
    const wire = new THREE.MeshStandardMaterial({ color: "#d9d4dc", roughness: 0.3, metalness: 0.5 });
    const frame = new THREE.MeshStandardMaterial({ color: "#b9b3be", roughness: 0.3, metalness: 0.55 });
    const bar = (a, b, rad, m) => {
      const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), len = A.distanceTo(Bv);
      const o = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 8), m); o.position.copy(A).add(Bv).multiplyScalar(0.5);
      o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); o.castShadow = true; P.whole.add(o); return o;
    };
    const x = W / 2, z = D / 2, step = 0.11;
    // the walls: upright wires all round, three bands, a thick rim and a thick bottom frame
    for (let u = -x; u <= x + 1e-6; u += W / Math.round(W / step)) for (const s of [-1, 1]) bar([u, 0, s * z], [u, H, s * z], r, wire);
    for (let u = -z; u <= z + 1e-6; u += D / Math.round(D / step)) for (const s of [-1, 1]) bar([s * x, 0, u], [s * x, H, u], r, wire);
    for (const [y, rad] of [[0, 0.024], [H * 0.36, r], [H * 0.7, r], [H, 0.026]]) {
      const m = rad > 0.02 ? frame : wire;
      for (const s of [-1, 1]) { bar([-x, y, s * z], [x, y, s * z], rad, m); bar([s * x, y, -z], [s * x, y, z], rad, m); }
    }
    // the floor: a grid of wires the potato stands on
    for (let u = -x; u <= x + 1e-6; u += W / 8) bar([u, 0.01, -z], [u, 0.01, z], r, wire);
    for (let u = -z; u <= z + 1e-6; u += D / 7) bar([-x, 0.01, u], [x, 0.01, u], r, wire);
    // the bail: two side posts up from the middle of the short sides, a top bar, a hook ring
    for (const s of [-1, 1]) bar([s * x, H * 0.5, 0], [s * x, B, 0], 0.03, frame);
    bar([-x, B, 0], [x, B, 0], 0.032, frame);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 16), frame); hook.position.set(0, B + 0.06, 0); hook.castShadow = true; P.whole.add(hook);
    // the chain: links from the hook up to spec.top, alternating flat and edge-on; links above the top are hidden
    const linkM = new THREE.MeshStandardMaterial({ color: "#8d8794", roughness: 0.35, metalness: 0.6 }), L = 0.075, n = 60;
    const links = Array.from({ length: n }, (_, i) => {
      const o = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12), linkM); o.scale.set(1, 1.5, 1);
      o.rotation.y = i % 2 ? Math.PI / 2 : 0; o.position.set(0, B + 0.12 + i * L, 0); o.castShadow = true; P.whole.add(o); return o;
    });
    // French fries leaning in the basket (spec.fries), riding it with the potato
    const FM = fryMats();
    for (const [i, [fx, fz, yaw = 0, tilt = 0.3, len = 0.5]] of (S.fries || []).entries()) {
      // standing on the floor wires, turned by yaw and leaning by tilt (radians) against the wall
      const lean = new THREE.Group(), f = new THREE.Group(); lean.rotation.z = tilt; lean.add(fryStick(FM, len, 0.065, i + 3));
      f.position.set(fx, 0.03, fz); f.rotation.y = (yaw * Math.PI) / 180; f.add(lean); P.whole.add(f);
    }
    // the drips: drops that fall from the floor's wires to the oil, each on its own loop
    const dropM = new THREE.MeshBasicMaterial({ color: "#ffb43a", transparent: true, opacity: 0.45 }); dropM.userData.noOutline = true;
    const drops = Array.from({ length: 26 }, (_, i) => {
      const o = steamy(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), dropM), 3); o.scale.set(1, 1.8, 1); P.whole.add(o);
      return { o, x: (rnd(i) - 0.5) * (W - 0.1), z: (rnd(i + 50) - 0.5) * (D - 0.1), ph: rnd(i + 90), per: 0.32 + rnd(i + 130) * 0.25 };
    });
    // a thin sheet of oil running off the floor the moment it clears the surface
    return {
      grip: 0,
      apply(ps, t) {
        const top = (S.top ?? 1.7) - ps.y;
        for (const [i, o] of links.entries()) o.visible = B + 0.12 + i * L < top - 0.02;
        const oil = (S.oil ?? -0.62) - ps.y, sp = clamp(ps.spill);
        for (const d of drops) {
          const u = ((t / d.per + d.ph) % 1), y = -0.02 - u * u * Math.max(0, -oil) * 1.0;
          d.o.position.set(d.x, y, d.z);
          d.o.visible = sp > rnd(d.ph * 77) * 0.9 + 0.05 && oil < -0.05 && y > oil;
        }
      },
    };
  },
  steamjet(P) {
    const S = P.spec, n = S.puffs ?? 18, L = S.len ?? 1.2, W = S.width ?? 0.22, fire = !!S.fire;
    // a flame jet lights the wall round its nozzle
    let glow = null;
    if (fire) {
      const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.35, "rgba(255,255,255,0.35)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const gm = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), color: "#ff7a1a", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      gm.userData.noOutline = true; glow = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), gm), 4); glow.scale.setScalar(L * 1.4); glow.position.set(L * 0.35, 0, 0); P.whole.add(glow);
    }
    const puffs = Array.from({ length: n }, (_, i) => {
      const m = puffMaterial(fire); m.uniforms.uSeed.value = rnd(i);
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); P.whole.add(o);
      return { o, m, ph: i / n + rnd(i + 11) * 0.05, jy: rnd(i + 21) - 0.5, jz: rnd(i + 31) - 0.5 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const j = clamp(ps.jet);
        for (const p of puffs) {
          // each puff runs out along +x over 0.5 s on a loop, swelling and rising as it slows
          const u = (t * (fire ? 3.0 : 2.2) + p.ph) % 1, s = 1 - (1 - u) * (1 - u);
          if (fire) {
            // a tongue of flame: shoots out, rises as it burns, swells and then shrinks away
            p.o.position.set(s * L * (0.35 + 0.65 * j), p.jy * W * 0.5 * u + u * u * 0.32 * L, p.jz * W * 0.5 * u);
            p.m.uniforms.uR.value = W * (0.45 + 1.4 * Math.sin(Math.PI * Math.min(1, u * 1.15)) ) * (0.5 + 0.5 * j);
            p.m.uniforms.uA.value = j * Math.min(1, u * 10) * (1 - u) ** 0.6;
            p.m.uniforms.uHeat.value = 1 - u;
          } else {
            p.o.position.set(s * L * (0.4 + 0.6 * j), p.jy * W * 0.6 * u + u * u * 0.18, p.jz * W * 0.6 * u);
            p.m.uniforms.uR.value = W * (0.3 + 1.5 * u) * (0.5 + 0.5 * j);
            p.m.uniforms.uA.value = j * 0.85 * Math.min(1, u * 8) * (1 - u) ** 1.2;
          }
          p.m.uniforms.uTime.value = t;
          p.o.visible = j > 0.01;
        }
        if (glow) { glow.material.opacity = 0.75 * j * (0.85 + 0.15 * Math.sin(t * 23)); glow.visible = j > 0.01; }
      },
    };
  },
  steamhaze(P) {
    const S = P.spec, n = S.n ?? 6, w = S.w ?? 3;
    const veils = Array.from({ length: n }, (_, i) => {
      const m = puffMaterial(); m.uniforms.uSeed.value = rnd(i + 5);
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 3); P.whole.add(o);
      return { o, m, x: (rnd(i) - 0.5) * w, y: rnd(i + 3) * 0.6, z: (rnd(i + 7) - 0.5) * (S.d ?? 1), sp: 0.1 + rnd(i + 9) * 0.15, r: (S.r ?? 0.6) * (0.7 + rnd(i + 13) * 0.6) };
    });
    return {
      grip: 0,
      apply(ps, t) {
        for (const v of veils) {
          v.o.position.set(v.x + Math.sin(t * v.sp * 3 + v.r) * 0.25, v.y + ((t * v.sp) % 1) * 0.3, v.z);
          v.m.uniforms.uR.value = v.r; v.m.uniforms.uA.value = (S.a ?? 0.25) * (0.6 + 0.4 * Math.sin(t * 0.8 + v.x)); v.m.uniforms.uTime.value = t;
        }
      },
    };
  },
  bobspud(P) {
    const S = P.spec, R = S.r ?? 0.32, g = new THREE.SphereGeometry(R, 28, 20), p = g.attributes.position, v = new THREE.Vector3(), sd = (S.seed ?? 1) * 3.1;
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const k = 1 + 0.06 * Math.sin(v.x * 9 + sd) * Math.sin(v.y * 7 + sd * 2) + 0.04 * Math.sin(v.z * 11 + sd * 3);
      p.setXYZ(i, v.x * k * 1.3, v.y * k * 0.85, v.z * k);
    }
    g.computeVertexNormals();
    const body = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: S.color || "#d99a46", roughness: 0.8 })); body.castShadow = true;
    const bob = new THREE.Group(); bob.add(body); P.whole.add(bob); body.rotation.set(0.2, rnd(sd) * 6, 0.15);
    // a few darker toasted spots
    const spotM = new THREE.MeshStandardMaterial({ color: "#a8622a", roughness: 0.9 });
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(R * 0.16, 10, 8), spotM); const a = rnd(sd + i) * 6.28, b = 0.2 + rnd(sd + i + 9) * 0.8; s.position.set(Math.cos(a) * R * 1.22 * Math.cos(b) * 0.98, Math.sin(b) * R * 0.8, Math.sin(a) * R * Math.cos(b) * 0.98); s.scale.set(1, 0.35, 1); s.lookAt(0, 0, 0); body.add(s); }
    return { grip: 0, apply(ps, t) { const ph = sd * 1.7; bob.position.y = (S.amp ?? 0.05) * Math.sin(t * 2.6 + ph); bob.rotation.set(0.12 * Math.sin(t * 1.9 + ph), t * 0.25 + ph, 0.1 * Math.sin(t * 2.2 + ph * 2)); } };
  },
  fryfloat(P) {
    const S = P.spec, FM = fryMats();
    const fries = (S.at || []).map(([x, z, yaw = 0], i) => {
      const f = fryStick(FM, 0.42 + 0.12 * rnd(i + 40), 0.065, i + 17); f.rotation.set(0, 0, Math.PI / 2);
      const g = new THREE.Group(); g.add(f); f.position.set(0.24, 0, 0); g.position.set(x, 0, z); g.rotation.y = (yaw * Math.PI) / 180; P.whole.add(g);
      // floating in the oil: no ground blob under them (it would darken the whole vat) and out of the contact checks
      g.traverse((o) => { o.castShadow = false; o.userData.steam = true; });
      return { g, ph: rnd(i + 60) * 6.3, x, z };
    });
    return {
      grip: 0,
      apply(ps, t) {
        for (const f of fries) { f.g.position.y = -0.02 + 0.015 * Math.sin(t * 2.1 + f.ph); f.g.rotation.x = 0.08 * Math.sin(t * 1.7 + f.ph); }
      },
    };
  },
  spudshadows(P) {
    const S = P.spec, w = S.w ?? 2.4, h = S.h ?? 2.0;
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2(w, h) }, uHot: { value: S.hot ?? 1 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uTime, uHot; uniform vec2 uSize; varying vec2 vUv;
        float blob(vec2 p, vec2 c, vec2 r, float lump) { vec2 d = (p - c) / r; float a = atan(d.y, d.x); return (length(d) - (1.0 + lump * sin(a * 3.0 + c.x * 5.0) + lump * 0.6 * sin(a * 5.0 - c.y * 3.0))) * min(r.x, r.y); }
        void main() {
          vec2 p = vUv * uSize;
          // the furnace light over the whole wall, hottest at the u = 1 end (spec.hot 0: the u = 0 end) and low down
          float light = (0.45 + 0.55 * smoothstep(0.0, 1.0, mix(1.0 - vUv.x, vUv.x, uHot))) * (1.0 - 0.35 * vUv.y);
          float s = 1e3;
          for (int i = 0; i < 3; i++) {
            float fi = float(i), sp = 0.55 + 0.15 * fi;
            vec2 r = vec2(0.36 + 0.04 * fi, 0.46 + 0.04 * fi);
            vec2 c = vec2(uSize.x * (0.18 + 0.32 * fi) + 0.12 * sin(uTime * sp + fi), uSize.y * (0.36 + 0.06 * fi) + 0.22 * abs(sin(uTime * 2.6 + fi * 2.1)));
            s = min(s, blob(p, c, r, 0.05));
            // the sprout on top: a short stem and two leaves
            vec2 st = p - c - vec2(0.0, r.y);
            s = min(s, max(abs(st.x) - 0.025, abs(st.y - 0.05) - 0.07));
            vec2 l1 = st - vec2(-0.09, 0.13), l2 = st - vec2(0.09, 0.13);
            s = min(s, length(vec2(l1.x * 0.8 + l1.y * 0.6, -l1.x * 0.6 + l1.y * 0.8) / vec2(0.11, 0.05)) * 0.05 - 0.05);
            s = min(s, length(vec2(l2.x * 0.8 - l2.y * 0.6, l2.x * 0.6 + l2.y * 0.8) / vec2(0.11, 0.05)) * 0.05 - 0.05);
          }
          float shadow = 1.0 - smoothstep(-0.05, 0.05, s);
          // the furnace light added over the wall (orange), and the shadows cut out of it, near black
          vec3 lit = vec3(1.0, 0.45, 0.14);
          vec3 col = mix(lit, vec3(0.03, 0.01, 0.01), shadow);
          gl_FragColor = vec4(col, max(light * 0.7 * (1.0 - shadow), shadow * 0.97));
        }`,
      transparent: true, depthWrite: false, opacity: 0.4,
    });
    m.userData.noOutline = true;
    // drawn after the wall's heat glow, so the shadows stay dark
    const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 4); P.whole.add(o);
    return { grip: 0, apply(ps, t) { m.uniforms.uTime.value = t; } };
  },
};
