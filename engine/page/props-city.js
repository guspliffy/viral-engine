import * as THREE from "three";
import { buildHatchback, HATCH } from "./car-hatchback.js";
import { clamp } from "./util.js";

// Props for Never Looks Up 06b "city car crash" (7 Nov 2026, Jonny: "the car dodging another car in a city environment
// and the other car crashes then in the background and explodes"). The other car is a prop, not a vehicle rig, so the
// physics bake (physics.js) can take it over when it trips on the kerb: it rolls and tumbles as a real rigid body.
//   citycar    the city hatchback (car-hatchback.js) as a prop: nobody inside (the cabin is a dark tinted box, so no one
//              is hurt in the blast: cartoon impacts only). Origin on the ground under its middle, front +z.
//              `len` metres it has rolled (the wheels turn len / R), `bend` the front wheels' steer (degrees),
//              `scorch` 0..1 burns the paint black, `broken` 1 hides its front right wheel (it flew off as a cartyre).
//              spec.color, spec.tint (the dark glass colour).
//   cartyre    one tyre on its hub, the citycar's own wheel (spec.r its radius): a loose wheel for the physics bake. Its
//              axle is x, so it rolls along z.
//   carburst   the explosion: a ball of cel-banded fireballs (white core, yellow, orange, a red rim) that swell out from
//              the origin in 0.25 s, rise and cool through soot brown to grey smoke over ~2.5 s, a flash card and a ring
//              of dust along the ground. spec.at: the clip time it goes off (its whole life is timed from it, so a still
//              at any frame is the same), spec.r: the fireball's radius (m). `on` 0..1 its strength (0 hides it).
//   firesmoke  what burns on afterwards: tongues of flame licking up off the wreck and a slow grey smoke column rising
//              and leaning with the wind. spec.w (m across), spec.h (the column's height). `fire` 0..1 its strength.
// The fire, smoke and flash are see-through and flagged steam (and their kinds read as air in physics.js: "burst",
// "smoke"), so no check or body ever touches them.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sm = (x) => { const k = clamp(x); return k * k * (3 - 2 * k); };
const steamy = (o, order = 5) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };

// one fireball: a camera-facing disc with ragged cel bands, cooling to smoke (the pumpkin plume's fire, props-pumpkin.js)
function fireballMaterial(seed) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: seed }, uHeat: { value: 1 }, uSmoke: { value: 0 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uTime, uA, uSeed, uHeat, uSmoke; varying vec2 vUv;
      float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        float edge = 0.8 + 0.1 * sin(a * 5.0 + uSeed * 6.0 + uTime * 2.0) + 0.07 * sin(a * 9.0 - uSeed * 3.0 - uTime * 3.0);
        float d = r / edge;
        if (d > 1.0) discard;
        float k = d + (1.0 - uHeat) * 0.5 - q.y * 0.1;
        vec3 core = vec3(1.0, 0.96, 0.78), yel = vec3(1.0, 0.8, 0.28), ora = vec3(1.0, 0.48, 0.1), red = vec3(0.84, 0.22, 0.07);
        vec3 col = mix(core, yel, bandStep(0.32, k));
        col = mix(col, ora, bandStep(0.6, k));
        col = mix(col, red, bandStep(0.86, k));
        vec3 smoke = mix(vec3(0.3, 0.26, 0.23), vec3(0.52, 0.5, 0.49), clamp(uSmoke * 1.4 - 0.4, 0.0, 1.0)) + 0.07 * (1.0 - d) - 0.05 * q.y;
        col = mix(col, smoke, clamp(uSmoke, 0.0, 1.0));
        float alpha = (1.0 - smoothstep(0.86, 1.0, d)) * uA;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true;
  return m;
}
const ball = (parent, seed, order) => { const m = fireballMaterial(seed), o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), order); parent.add(o); return { o, m }; };
// a soft round additive glow card, camera-facing
function glowCard(parent, color) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 1 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 1.6) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  });
  m.userData.noOutline = true;
  const o = steamy(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m), 4); parent.add(o); return o;
}

export const CITY_KINDS = {
  citycar(P) {
    const S = P.spec, car = buildHatchback({ color: S.color || "#3f7fd0", plate: false }); P.whole.add(car.root);
    // nobody inside: the side openings and the glass show a dark tinted cabin
    const tint = new THREE.MeshStandardMaterial({ color: S.tint || "#1c222c", roughness: 0.25, metalness: 0.2 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(HATCH.W * 1.86, 0.98, HATCH.cabin[1] - HATCH.cabin[0] - 0.08), tint);
    cab.position.set(0, HATCH.belt + 0.47, (HATCH.cabin[0] + HATCH.cabin[1]) / 2); cab.castShadow = false; car.root.add(cab);
    const mats = []; car.root.traverse((o) => { if (o.isMesh && o.material?.color && o.material !== tint) { const m = o.material; if (!mats.includes(m)) mats.push(m); } });
    const base = mats.map((m) => ({ m, c: m.color.clone(), e: m.emissive ? m.emissive.clone() : null, ei: m.emissiveIntensity }));
    const soot = new THREE.Color("#1e1b1a");
    return {
      grip: 0.9,
      apply(ps) {
        const d = ps.len ?? 0, st = ps.bend ?? 0, sc = clamp(ps.scorch ?? 0);
        for (const W of car.wheels) { W.pivot.rotation.y = W.front ? (st * Math.PI) / 180 : 0; W.w.rotation.x = d / car.R; }
        car.wheels[0].pivot.visible = (ps.broken ?? 0) < 0.5;
        for (const b of base) { b.m.color.copy(b.c).lerp(soot, sc * 0.85); if (b.e) { b.m.emissive.copy(b.e).lerp(soot, sc); b.m.emissiveIntensity = b.ei * (1 - 0.8 * sc); } }
      },
    };
  },

  cartyre(P) {
    const S = P.spec, R = S.r ?? HATCH.wheel;
    const tyreM = new THREE.MeshStandardMaterial({ color: "#26252b", roughness: 0.92 }), hubM = new THREE.MeshStandardMaterial({ color: "#a9adb4", roughness: 0.45, metalness: 0.4 });
    const dark = new THREE.MeshStandardMaterial({ color: "#2b2830", roughness: 0.7 });
    const add = (g, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = true; P.whole.add(o); return o; };
    const t = add(new THREE.TorusGeometry(R * 0.72, R * 0.28, 14, 36), tyreM, 0, R, 0); t.rotation.y = Math.PI / 2; t.scale.z = 1.1;
    const d = add(new THREE.CylinderGeometry(R * 0.5, R * 0.5, 0.2, 28), hubM, 0, R, 0); d.rotation.z = Math.PI / 2;
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; for (const s of [-1, 1]) { const h = add(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 12), dark, s * 0.1, R + Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3); h.rotation.z = Math.PI / 2; } }
    return { grip: R };
  },

  carburst(P) {
    const S = P.spec, R = S.r ?? 2.4, T0 = S.at ?? 0, N = S.balls ?? 34;
    const balls = Array.from({ length: N }, (_, i) => {
      // directions over the upper half (a car blast pushes up and out off the road), the bigger balls near the middle
      const az = rnd(i) * Math.PI * 2, el = Math.asin(0.15 + 0.85 * rnd(i + 50)), out = 0.35 + 0.65 * rnd(i + 90);
      return { ...ball(P.whole, rnd(i + 3), 6 + (i % 3)), dir: [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)], out,
        size: 0.42 + 0.5 * rnd(i + 130) * (1.2 - out * 0.6), delay: 0.05 * rnd(i + 170), rise: 0.6 + 0.8 * rnd(i + 210), life: 1.7 + 1.4 * rnd(i + 250) };
    });
    const flash = glowCard(P.whole, "#ffd890"), warm = glowCard(P.whole, "#ff7a2a");
    // the dust ring that runs out along the ground
    const dust = Array.from({ length: 16 }, (_, i) => ({ ...ball(P.whole, rnd(i + 400), 5), az: (i / 16) * Math.PI * 2 + rnd(i + 410) * 0.3 }));
    return {
      grip: 0,
      apply(ps, t) {
        const on = clamp(ps.on ?? 1), age = (t ?? 0) - T0, live = on > 0.001 && age >= 0;
        P.whole.visible = live; if (!live) return;
        for (const b of balls) {
          const a = age - b.delay, grow = sm(a / 0.22), k = a / b.life;
          const r = R * b.out * (0.35 + 0.65 * grow) * (1 + 0.25 * sm(k)), up = R * 0.5 * b.rise * k * k + R * 0.25 * sm(k * 1.5);
          b.o.position.set(b.dir[0] * r, b.dir[1] * r * 0.8 + R * 0.25 + up, b.dir[2] * r);
          b.m.uniforms.uR.value = R * b.size * (0.2 + 0.8 * grow) * (1 + 0.9 * sm(k));
          b.m.uniforms.uHeat.value = 1 - 0.75 * sm(k / 0.5);
          b.m.uniforms.uSmoke.value = sm((k - 0.2) / 0.45);
          b.m.uniforms.uA.value = on * (a > 0 ? 1 : 0) * (1 - sm((k - 0.7) / 0.3));
          b.m.uniforms.uTime.value = t;
          b.o.visible = a > 0 && k < 1;
        }
        flash.material.uniforms.uR.value = R * 3.2; flash.position.set(0, R * 0.4, 0);
        flash.material.uniforms.uA.value = 0.6 * on * sm(age / 0.04) * (1 - sm((age - 0.06) / 0.4));
        warm.material.uniforms.uR.value = R * 4.5; warm.position.set(0, R * 0.6, 0);
        warm.material.uniforms.uA.value = 0.3 * on * (1 - sm((age - 0.3) / 1.6));
        for (const d of dust) {
          const k = sm(age / 0.9), r = R * (0.4 + 1.6 * k);
          d.o.position.set(Math.cos(d.az) * r, R * 0.12 + 0.3 * k, Math.sin(d.az) * r);
          d.m.uniforms.uR.value = R * (0.18 + 0.3 * k); d.m.uniforms.uHeat.value = 0; d.m.uniforms.uSmoke.value = 1;
          d.m.uniforms.uA.value = 0.75 * on * sm(age / 0.12) * (1 - sm((age - 0.5) / 1.2)); d.m.uniforms.uTime.value = t;
          d.o.visible = age < 1.8;
        }
      },
    };
  },

  firesmoke(P) {
    const S = P.spec, W = S.w ?? 2.4, H = S.h ?? 7;
    const cols = ["#ff5a1f", "#ff8a2a", "#ffc23d", "#ffe27a"].map((c) => { const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, depthWrite: false }); m.userData.noOutline = true; return m; });
    const tongues = Array.from({ length: 26 }, (_, i) => {
      const x = (rnd(i) - 0.5) * W, z = (rnd(i + 40) - 0.5) * W * 0.5, inner = 1 - Math.abs(x) / (W / 2);
      const c = steamy(new THREE.Mesh(new THREE.ConeGeometry(0.09 + 0.08 * rnd(i + 7), 1, 8), cols[i % 4]), 6); c.position.set(x, 0, z); P.whole.add(c);
      return { c, h: (0.5 + 1.1 * inner) * (0.6 + 0.4 * rnd(i + 3)), ph: rnd(i + 9) * 6.28, sp: 7 + rnd(i + 11) * 6 };
    });
    const puffs = Array.from({ length: 22 }, (_, i) => ({ ...ball(P.whole, rnd(i + 600), 4), s: i / 22, jx: rnd(i + 610) - 0.5, jz: rnd(i + 620) - 0.5 }));
    const glow = glowCard(P.whole, "#ff8a3a");
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.fire ?? 0), tt = t ?? 0; P.whole.visible = f > 0.01; if (f <= 0.01) return;
        for (const q of tongues) { const k = Math.max(0.01, f * q.h * (0.75 + 0.3 * Math.sin(tt * q.sp + q.ph))); q.c.scale.set(1, k, 1); q.c.position.y = k / 2; }
        for (const p of puffs) {
          // each puff rides up the column on its own loop (2.6 s), swelling and thinning, leaning downwind (+x)
          const u = (p.s + tt / 2.6) % 1, y = 0.8 + u * H;
          p.o.position.set(p.jx * W * 0.4 + u * u * H * 0.35, y, p.jz * W * 0.3);
          p.m.uniforms.uR.value = (0.45 + 1.4 * u) * (W / 2.4); p.m.uniforms.uHeat.value = 0; p.m.uniforms.uSmoke.value = 0.75 + 0.25 * u;
          p.m.uniforms.uA.value = f * 0.85 * sm(u / 0.08) * (1 - sm((u - 0.55) / 0.45)); p.m.uniforms.uTime.value = tt;
        }
        glow.material.uniforms.uR.value = W * 1.4; glow.position.set(0, W * 0.3, 0); glow.material.uniforms.uA.value = 0.32 * f * (0.9 + 0.1 * Math.sin(tt * 13));
      },
    };
  },
};
