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
//                is how hard it blows (spec.len metres at full), spec.width the puffs' size.
//   steamhaze    a few large soft drifting veils of steam (spec.w wide), always there, spec.a their strength.
//   bobspud      a whole plain potato floating in the oil (spec.r its size), bobbing and turning slowly.
//   spudshadows  the furnace light on a wall with big potato-shaped shadows bobbing across it (spec.w x spec.h,
//                facing the prop's +z; spec.hot 1 or 0: which end the light comes from): what the oil throws on the tunnel wall before the reveal.
// Oil, flames, steam, drips, shadows and light are see-through for the checks (opacity under 0.5); the basket's bars
// and the potatoes are solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const steamy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.userData.steam = true; return o; };

// a camera-facing disc of steam: soft round edge, lit warm from below (the furnace), white in the middle
function puffMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA, uSeed, uTime; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.86 + 0.08 * sin(a * 4.0 + uSeed * 6.3 + uTime * 1.5) + 0.05 * sin(a * 7.0 - uSeed * 2.0);
        float d = r / edge; if (d > 1.0) discard;
        vec3 col = mix(vec3(1.0, 0.97, 0.94), vec3(1.0, 0.62, 0.48), smoothstep(0.1, 0.9, -q.y * 0.5 + d * 0.6));
        gl_FragColor = vec4(col, uA * (1.0 - smoothstep(0.45, 1.0, d)));
      }`,
    transparent: true, depthWrite: false, opacity: 0.4,
  });
  m.userData.noOutline = true;
  return m;
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
    // the drips: drops that fall from the floor's wires to the oil, each on its own loop
    const dropM = new THREE.MeshBasicMaterial({ color: "#ffb347", transparent: true, opacity: 0.45 }); dropM.userData.noOutline = true;
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
    const S = P.spec, n = S.puffs ?? 18, L = S.len ?? 1.2, W = S.width ?? 0.22;
    const puffs = Array.from({ length: n }, (_, i) => {
      const m = puffMaterial(); m.uniforms.uSeed.value = rnd(i);
      const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 5 + (i % 3)); P.whole.add(o);
      return { o, m, ph: i / n + rnd(i + 11) * 0.05, jy: rnd(i + 21) - 0.5, jz: rnd(i + 31) - 0.5 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        const j = clamp(ps.jet);
        for (const p of puffs) {
          // each puff runs out along +x over 0.5 s on a loop, swelling and rising as it slows
          const u = (t * 2.2 + p.ph) % 1, s = 1 - (1 - u) * (1 - u);
          p.o.position.set(s * L * (0.4 + 0.6 * j), p.jy * W * 0.6 * u + u * u * 0.18, p.jz * W * 0.6 * u);
          p.m.uniforms.uR.value = W * (0.3 + 1.5 * u) * (0.5 + 0.5 * j);
          p.m.uniforms.uA.value = j * 0.85 * Math.min(1, u * 8) * (1 - u) ** 1.2;
          p.m.uniforms.uTime.value = t;
          p.o.visible = j > 0.01;
        }
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
  spudshadows(P) {
    const S = P.spec, w = S.w ?? 2.4, h = S.h ?? 2.0;
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uSize: { value: new THREE.Vector2(w, h) }, uHot: { value: S.hot ?? 1 } },
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uTime, uHot; uniform vec2 uSize; varying vec2 vUv;
        float blob(vec2 p, vec2 c, vec2 r, float lump) { vec2 d = (p - c) / r; float a = atan(d.y, d.x); return (length(d) - (1.0 + lump * sin(a * 3.0 + c.x * 5.0) + lump * 0.6 * sin(a * 5.0 - c.y * 3.0))) * min(r.x, r.y); }
        void main() {
          vec2 p = vUv * uSize;
          // the furnace light: hottest at the u = 1 end (spec.hot 0: the u = 0 end), toward the mouth, and low down
          float light = smoothstep(0.0, 1.0, mix(1.0 - vUv.x, vUv.x, uHot)) * (1.0 - 0.45 * vUv.y);
          float s = 1e3;
          for (int i = 0; i < 3; i++) {
            float fi = float(i), sp = 0.55 + 0.15 * fi;
            vec2 r = vec2(0.36 + 0.04 * fi, 0.46 + 0.04 * fi);
            vec2 c = vec2(uSize.x * (0.18 + 0.32 * fi) + 0.12 * sin(uTime * sp + fi), uSize.y * (0.36 + 0.06 * fi) + 0.16 * abs(sin(uTime * 2.6 + fi * 2.1)));
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
          gl_FragColor = vec4(col, max(light * 0.5 * (1.0 - shadow), shadow * 0.97));
        }`,
      transparent: true, depthWrite: false, opacity: 0.4,
    });
    m.userData.noOutline = true;
    // drawn after the wall's heat glow, so the shadows stay dark
    const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), 4); P.whole.add(o);
    return { grip: 0, apply(ps, t) { m.uniforms.uTime.value = t; } };
  },
};
