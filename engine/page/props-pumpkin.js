import * as THREE from "three";
import { clamp, rad } from "./util.js";

// Props for "Don't Let Dragon Light the Pumpkin" (eight trend tests #06, 29 Oct 2026): Dragon's hollow pumpkin helmet,
// the one flame plume his sneeze sends down the hall, and a tiny soot spot for Reaper's hood.
//   pumpkinhelm  a carved jack-o'-lantern worn as a helmet: an eight-lobed orange shell, open underneath, with a stem
//                and a leaf. Its origin is the shell's centre; spec.wear (stage.js) puts it on a character's body.
//                Carved into its front (the shell's +z): two triangle eyes and a nose that are painted carvings, lit
//                from inside by `glow` 0..1 (dark carvings -> glowing yellow-orange), and a jagged grin that is a real
//                opening (the wearer's mouth and cheeks show through it, and the fire comes out of it). `on` 0..1 is
//                a big soft orange aura round the pumpkin (the fire building inside it lighting the hall).
//                PUMPKIN.mouth gives the grin's centre in the helmet's frame. The shell is drawn by its own toon
//                shader (two cel bands from the set's key light, like the look's materials) so the grin can be cut
//                cleanly; an inverted hull gives it the same dark contour the look draws round characters.
//   fireplume    one sneeze of fire: a column of cel-banded fireballs (white core, yellow, orange, a red rim) running
//                along the prop's +z from its origin, each a camera-facing disc, so the plume reads from the front,
//                the side or straight down its length. `len` 0..1: how far it has reached (spec.length metres at 1),
//                `on` 0..1 its strength, `fade` 0..1 dissipation (the balls swell, rise, cool to grey smoke and go).
//                spec.width: the head's radius. A warm glow travels with its head.
//   soot         a tiny smudge of soot and grey ash (spec.size metres across), a flat decal facing its +z; shown by `scale` 0 -> 1.
// The fire and the aura are see-through (opacity under 0.5) and flagged as steam, so the contact and caption checks
// leave them out; the helmet's shell is solid and is checked like any prop.
export const PUMPKIN = { r: 0.62, squashY: 0.8, open: 2.31, lobes: 8,
  eyes: { az: 0.3, el: 0.16, w: 0.2, h: 0.24 }, nose: { el: -0.16, w: 0.09, h: 0.1 },
  mouth: { el: -0.57, w: 0.66, h: 0.28 } };
// the grin's centre on the shell (helmet frame): where the fire leaves and the wearer's mouth should sit behind
PUMPKIN.mouthAt = [0, PUMPKIN.r * Math.sin(PUMPKIN.mouth.el) * PUMPKIN.squashY, PUMPKIN.r * Math.cos(PUMPKIN.mouth.el)];
export const PUMPKIN_GRIPS = {
  // both hands under the shell's widest point, either side (for lifting it off)
  pumpkinhelm: { sides: [0, -0.05, 0] },
};

const KEY = new THREE.Vector3(4.2, 4.0, 2.6).normalize();   // the golden look's key light (looks.js), for the shell's bands
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// the shell: lobes push the surface in between eight ribs; az/el (radians, 0 at the front) say where a carving is
function shellGeometry(R, sy, open, lobes) {
  const g = new THREE.SphereGeometry(R, 96, 56, 0, Math.PI * 2, 0, open), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.x, v.z), k = 1 - 0.065 * Math.pow(Math.abs(Math.sin(a * lobes / 2)), 0.7);
    p.setXYZ(i, v.x * k, v.y * sy, v.z * k);
  }
  g.computeVertexNormals();
  return g;
}
function shellMaterial() {
  const P = PUMPKIN;
  return new THREE.ShaderMaterial({
    uniforms: { uKey: { value: KEY.clone() }, uGlow: { value: 0 }, uSy: { value: P.squashY }, uR: { value: P.r } },
    side: THREE.DoubleSide,
    vertexShader: `varying vec3 vN; varying vec3 vO; varying vec3 vW;
      void main() { vO = position; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uKey; uniform float uGlow, uSy, uR; varying vec3 vN; varying vec3 vO; varying vec3 vW;
      float aa(float e, float x) { float w = fwidth(x) * 0.8 + 1e-4; return smoothstep(e - w, e + w, x); }
      // 1 inside the triangle given by three points (az, el), 0 outside
      float tri(vec2 p, vec2 a, vec2 b, vec2 c) {
        float d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
        float d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
        float d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
        float neg = min(min(d1, d2), d3), pos = max(max(d1, d2), d3);
        return (neg < 0.0 && pos > 0.0) ? 0.0 : 1.0;   // mixed signs: outside
      }
      void main() {
        vec3 o = vec3(vO.x, vO.y / uSy, vO.z);
        float az = atan(o.x, o.z), el = asin(clamp(o.y / max(length(o), 1e-4), -1.0, 1.0));
        vec2 p = vec2(az, el);
        // the grin: a wide crescent with three teeth up from its bottom edge and two down from its top
        float mx = abs(az) / ${(P.mouth.w / 2).toFixed(3)};
        float top = ${(P.mouth.el + P.mouth.h * 0.35).toFixed(3)} - 0.06 * mx * mx, bot = ${(P.mouth.el - P.mouth.h * 0.5).toFixed(3)} + 0.16 * mx * mx;
        float tooth = 0.0;
        for (int i = -1; i <= 1; i++) { float c = float(i) * 0.14; tooth = max(tooth, tri(p, vec2(c - 0.05, bot - 0.01), vec2(c + 0.05, bot - 0.01), vec2(c, bot + 0.075))); }
        for (int i = 0; i <= 1; i++) { float c = (float(i) - 0.5) * 0.28; tooth = max(tooth, tri(p, vec2(c - 0.045, top + 0.01), vec2(c + 0.045, top + 0.01), vec2(c, top - 0.065))); }
        bool mouth = mx < 1.0 && el < top && el > bot && tooth < 0.5;
        if (mouth) discard;
        // eyes and nose: carved (dark when unlit), glowing from inside with uGlow
        float eye = 0.0;
        for (int s = -1; s <= 1; s += 2) {
          float x = float(s) * ${P.eyes.az.toFixed(3)};
          eye = max(eye, tri(p, vec2(x - float(s) * ${(P.eyes.w * 0.6).toFixed(3)}, ${(P.eyes.el - P.eyes.h * 0.35).toFixed(3)}), vec2(x + float(s) * ${(P.eyes.w * 0.45).toFixed(3)}, ${(P.eyes.el - P.eyes.h * 0.45).toFixed(3)}), vec2(x - float(s) * ${(P.eyes.w * 0.05).toFixed(3)}, ${(P.eyes.el + P.eyes.h * 0.6).toFixed(3)})));
        }
        eye = max(eye, tri(p, vec2(-${(P.nose.w / 2).toFixed(3)}, ${(P.nose.el - P.nose.h / 2).toFixed(3)}), vec2(${(P.nose.w / 2).toFixed(3)}, ${(P.nose.el - P.nose.h / 2).toFixed(3)}), vec2(0.0, ${(P.nose.el + P.nose.h / 2).toFixed(3)})));
        vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
        float d = dot(n, uKey);
        // two cel bands like the look (lit / shade), the ribs a little darker toward their creases
        float crease = 1.0 - 0.12 * pow(abs(cos(az * 4.0)), 6.0);
        vec3 lit = vec3(1.0, 0.56, 0.16), shade = vec3(0.78, 0.33, 0.1);
        vec3 col = mix(shade, lit, aa(-0.45, d)) * crease;
        // a soft warm top and a darker bottom (painted volume)
        col *= 0.92 + 0.12 * clamp(o.y / uR + 0.3, 0.0, 1.0);
        if (!gl_FrontFacing) col = vec3(0.62, 0.27, 0.08) + vec3(0.38, 0.3, 0.1) * uGlow;   // the carved-out inside, lit by the fire
        // the carvings: dark cut flesh, then the light coming through (a hot yellow core, orange edge)
        if (eye > 0.5) {
          vec3 dark = vec3(0.28, 0.12, 0.05), hot = mix(vec3(1.0, 0.62, 0.14), vec3(1.0, 0.93, 0.55), uGlow);
          col = mix(dark, hot, uGlow);
        }
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);   // authored as screen colours; the pipeline works in linear light
      }`,
  });
}
// a soft round additive glow card, camera-facing (the aura and the plume's light)
function glowCard(parent, color) {
  const geo = new THREE.PlaneGeometry(1, 1);
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 0.5 }, uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; float s = length(modelMatrix[0].xyz); vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        c.xy += (uv - 0.5) * 2.0 * uR * s; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uA; uniform vec3 uC; varying vec2 vUv;
      void main() { float r = length(vUv - 0.5) * 2.0; float a = pow(max(0.0, 1.0 - r), 2.0) * uA; gl_FragColor = vec4(uC, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.3,
  });
  m.userData.noOutline = true;
  const o = new THREE.Mesh(geo, m); o.frustumCulled = false; o.renderOrder = 3; o.castShadow = false; o.userData.steam = true;
  parent.add(o);
  return o;
}
// one fireball: a camera-facing disc with ragged cel bands (core, yellow, orange, red rim), or grey smoke as it cools
function fireballMaterial() {
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uR: { value: 0.1 }, uA: { value: 0 }, uSeed: { value: 0 }, uHeat: { value: 1 }, uSmoke: { value: 0 } },
    vertexShader: `uniform float uR; varying vec2 vUv;
      void main() { vUv = uv; vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += (uv - 0.5) * 2.0 * uR; gl_Position = projectionMatrix * c; }`,
    fragmentShader: `uniform float uTime, uA, uSeed, uHeat, uSmoke; varying vec2 vUv;
      float bandStep(float e, float x) { float w = fwidth(x) * 0.9 + 0.004; return smoothstep(e - w, e + w, x); }
      void main() {
        vec2 q = (vUv - 0.5) * 2.0; float a = atan(q.y, q.x), r = length(q);
        // a billowing edge: a few lobes that turn slowly, different for each ball
        float edge = 0.82 + 0.1 * sin(a * 5.0 + uSeed * 6.0 + uTime * 3.0) + 0.06 * sin(a * 9.0 - uSeed * 3.0 - uTime * 5.0);
        float d = r / edge;
        if (d > 1.0) discard;
        float k = d + (1.0 - uHeat) * 0.45 - q.y * 0.12;   // hotter low and in the middle
        vec3 core = vec3(1.0, 0.97, 0.8), yel = vec3(1.0, 0.8, 0.28), ora = vec3(1.0, 0.5, 0.12), red = vec3(0.86, 0.24, 0.08);
        vec3 col = mix(core, yel, bandStep(0.35, k));
        col = mix(col, ora, bandStep(0.62, k));
        col = mix(col, red, bandStep(0.88, k));
        // cooling: through a sooty brown to warm grey (a cool grey over the red read as purple smoke)
        col = mix(col, vec3(0.36, 0.3, 0.26) + 0.08 * (1.0 - d), uSmoke);
        float alpha = (1.0 - smoothstep(0.9, 1.0, d)) * uA;
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true, depthWrite: false, opacity: 0.45,
  });
  m.userData.noOutline = true;
  return m;
}

export const PUMPKIN_KINDS = {
  pumpkinhelm(P) {
    const R = PUMPKIN.r, sy = PUMPKIN.squashY, geo = shellGeometry(R, sy, PUMPKIN.open, PUMPKIN.lobes);
    const shellM = shellMaterial(), shell = new THREE.Mesh(geo, shellM); shell.castShadow = true; shell.receiveShadow = false; P.whole.add(shell);
    // the contour: the same shell a little bigger, drawn from inside in the look's dark line colour
    const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#4a1c06", side: THREE.BackSide }));
    hull.scale.setScalar(1.018); hull.material.userData.noOutline = true; hull.castShadow = false; P.whole.add(hull);
    // the stem (a bent, ribbed green-brown stalk) and one curled leaf
    const stemM = new THREE.MeshStandardMaterial({ color: "#5d7a2a", roughness: 0.7 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.17, 7), stemM); stem.position.set(0.0, R * sy + 0.06, -0.01); stem.rotation.set(-0.15, 0, 0.32); stem.castShadow = true; P.whole.add(stem);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), stemM); tip.position.set(-0.03, R * sy + 0.14, -0.02); tip.scale.set(1.1, 0.7, 1.1); P.whole.add(tip);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 8), new THREE.MeshStandardMaterial({ color: "#6cbf3a", roughness: 0.6 }));
    leaf.scale.set(1.3, 0.22, 0.7); leaf.position.set(0.1, R * sy + 0.03, 0.02); leaf.rotation.set(0.2, 0.4, -0.35); P.whole.add(leaf);
    const aura = glowCard(P.whole, "#ff8a2a"); aura.position.set(0, 0.05, -R * 0.4);   // behind the shell: a halo round it
    const eyeGlow = glowCard(P.whole, "#ffb347"); eyeGlow.position.set(0, R * Math.sin(PUMPKIN.eyes.el) * sy, R * 1.02);
    return {
      grip: 0,
      apply(ps, t) {
        const g = clamp(ps.glow), on = clamp(ps.on), fl = 1 + 0.05 * Math.sin(t * rad(15.3)) + 0.03 * Math.sin(t * rad(23.1) + 2);
        shellM.uniforms.uGlow.value = g * fl;
        eyeGlow.material.uniforms.uR.value = 0.3 + 0.1 * on; eyeGlow.material.uniforms.uA.value = 0.25 * g * fl;
        aura.material.uniforms.uR.value = 0.6 + 2.2 * on; aura.material.uniforms.uA.value = 0.6 * on * fl;
        eyeGlow.visible = g > 0.01; aura.visible = on > 0.01;
      },
    };
  },
  fireplume(P) {
    const S = P.spec, N = S.balls ?? 30, L = S.length ?? 4, W = S.width ?? 0.55;
    const balls = Array.from({ length: N }, (_, i) => {
      const m = fireballMaterial(); m.uniforms.uSeed.value = rnd(i);
      const o = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); o.frustumCulled = false; o.renderOrder = 5 + (i % 3); o.castShadow = false; o.userData.steam = true;
      P.whole.add(o);
      return { o, m, s: (i + rnd(i + 40) * 0.6) / N, jx: rnd(i + 7) - 0.5, jy: rnd(i + 17) - 0.5, ph: rnd(i + 27) * 6.28 };
    });
    const head = glowCard(P.whole, "#ff9a3a"), trail = glowCard(P.whole, "#ff7a2a");
    return {
      grip: 0,
      apply(ps, t) {
        const len = clamp(ps.len), on = clamp(ps.on), fade = clamp(ps.fade);
        for (const b of balls) {
          // a ball is born when the head passes its place, swells to its size, then (fade) rises, swells more and cools
          const k = clamp((len - b.s) / 0.12), z = b.s * L * (1 - 0.04 * fade);
          const r0 = W * (0.32 + 0.68 * Math.pow(b.s, 0.6)) * (0.8 + 0.4 * rnd(b.ph * 10));
          const wob = Math.sin(t * 7 + b.ph) * 0.04 * b.s;
          b.o.position.set(b.jx * W * 0.5 * b.s + wob, b.jy * W * 0.35 * b.s + fade * fade * 0.6 * (0.4 + b.s) + Math.cos(t * 5 + b.ph) * 0.02, z);
          b.m.uniforms.uR.value = r0 * (0.25 + 0.75 * k) * (1 + 0.7 * fade);
          b.m.uniforms.uA.value = k * on * (1 - Math.pow(fade, 1.4));
          b.m.uniforms.uHeat.value = 1 - 0.55 * fade - 0.25 * b.s * (1 - len);
          b.m.uniforms.uSmoke.value = clamp((fade - 0.15) / 0.5);
          b.m.uniforms.uTime.value = t;
          b.o.visible = k > 0.001 && on > 0.001 && fade < 0.999;
        }
        const hz = len * L;
        head.position.set(0, 0, hz); head.material.uniforms.uR.value = W * 2.6; head.material.uniforms.uA.value = 0.55 * on * (1 - fade) * (len > 0.01 ? 1 : 0);
        trail.position.set(0, 0.1, hz * 0.5); trail.material.uniforms.uR.value = Math.max(0.3, hz * 0.6 + W); trail.material.uniforms.uA.value = 0.35 * on * (1 - fade) * (len > 0.01 ? 1 : 0);
        head.visible = trail.visible = on > 0.01 && fade < 0.99 && len > 0.01;
      },
    };
  },
  soot(P) {
    const S = P.spec, c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    // a dark core in a ring of grey ash: the ash is what reads on a black hood at phone size
    gr.addColorStop(0, "rgba(52,47,46,0.95)"); gr.addColorStop(0.35, "rgba(96,89,86,0.9)"); gr.addColorStop(0.7, "rgba(150,142,136,0.75)"); gr.addColorStop(1, "rgba(160,152,146,0)");
    g.fillStyle = gr; g.beginPath(); g.ellipse(32, 32, 30, 22, 0.4, 0, Math.PI * 2); g.fill();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    m.userData.noOutline = true;
    const s = S.size ?? 0.06, o = new THREE.Mesh(new THREE.PlaneGeometry(s, s), m); o.castShadow = false; o.userData.steam = true; P.whole.add(o);
    return { grip: 0 };
  },
};
