import * as THREE from "three";
import { clamp } from "./util.js";

// Props for Fart in the Elevator (Jonny's storyboard, 26 Oct 2026), with the "elevator" set (set-elevator.js):
//   floorsign  the lift's floor display: a dark glass panel in a brass frame with a green up arrow and the floor
//              number. `count` is the floor (the number shown is its whole part, so a tween from 3 to 4 changes it
//              when it gets there), `glow` 0..1 brightens the frame for the arrival ding. The arrow pulses while it
//              travels. spec.gate: "inside" shows it only while the camera is inside the car (the sign over the doors).
//   elevdoors  the two sliding door panels (brushed steel, a dark seam where they meet), the prop's spot is the middle
//              of the doorway at the floor. `open` 0 shut .. 1 open: each panel slides out behind the front wall.
//              Shown only while the camera is inside the car, like the front wall.
//   gas        a small green cloud: a soft puff at the bottom and spec.n (default 3) thin wavy wisps curling up from
//              it, see-through, always facing the camera. `puff` 0..1 lets it out (the puff swells, the wisps grow
//              up out of it), `fade` 0..1 thins it away (the wisps drift up a little as they go). spec.len is the
//              wisps' height in metres (default 0.4), spec.w their width, spec.lean tips them sideways (metres at
//              the top), spec.seed varies the curls. Move it with x, y, z and shrink it with scale.
//   spell      the Wizard's cleaning spell: a golden spiral of light that turns, with sparkles round its rim, facing
//              the camera. `magic` 0..1 draws it in (and out), `level` 0..1 is its size (tighten it to gather).
//   orb        a glowing green ball, the gathered gas. `glow` 0..1 grows it, `wobble` 0..1 buckles it (it bulges and
//              dents, faster as it goes), `burst` 0..1 splits it: it pops and three sparks fly out along arcs to
//              spec.to (three offsets [x, y, z] from the orb), each leaving a short trail, and go out at the end.
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...o });
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
const smooth = (k) => k * k * (3 - 2 * k);
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const insideCar = (cam) => cam.z < 1.2;   // set-elevator.js ELEVATOR.gateZ
const VSH = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
// a camera-facing quad: the vertex shader places it at the object's origin in view space, sized by its world scale
const BILLBOARD = `varying vec2 vUv;
  void main() { vUv = uv; float s = length(modelMatrix[0].xyz); vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); c.xy += position.xy * s; gl_Position = projectionMatrix * c; }`;
function glowSprite(color, size) {
  const t = canvasTex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, color); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.setScalar(size); s.renderOrder = 5; return s;
}

export const ELEVATOR_GRIPS = {};

export const ELEVATOR_KINDS = {
  floorsign(P) {
    const W = 0.36, H = 0.22, digits = new Map();
    const face = (n) => {
      if (!digits.has(n)) digits.set(n, canvasTex(256, 160, (g) => {
        g.fillStyle = "#121816"; g.fillRect(0, 0, 256, 160);
        g.fillStyle = "#6ff0c0"; g.font = "bold 120px 'DejaVu Sans', Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
        g.shadowColor = "rgba(110,240,190,0.8)"; g.shadowBlur = 14; g.fillText(String(n), 176, 86);
      }));
      return digits.get(n);
    };
    const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.05, H + 0.05, 0.03), mat("#c99a3e", { metalness: 0.7, roughness: 0.3 })); frame.position.z = 0.015; P.whole.add(frame);
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W, H), basic({ map: face(1) })); glass.position.z = 0.032; P.whole.add(glass);
    // the arrow: its own plane over the left of the panel, so it can pulse
    const arrowT = canvasTex(96, 128, (g) => { g.fillStyle = "#6ff0c0"; g.shadowColor = "rgba(110,240,190,0.9)"; g.shadowBlur = 10; g.beginPath(); g.moveTo(48, 12); g.lineTo(88, 60); g.lineTo(62, 60); g.lineTo(62, 116); g.lineTo(34, 116); g.lineTo(34, 60); g.lineTo(8, 60); g.closePath(); g.fill(); });
    const arrow = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.1), basic({ map: arrowT, transparent: true, depthWrite: false })); arrow.position.set(-W * 0.27, 0, 0.034); P.whole.add(arrow);
    const ring = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.12, H + 0.12), new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 } }, vertexShader: VSH,
      fragmentShader: "uniform float uK; varying vec2 vUv; void main() { vec2 q = abs(vUv - 0.5) * 2.0; float d = max(q.x, q.y); float a = uK * smoothstep(0.62, 0.8, d) * (1.0 - smoothstep(0.86, 1.0, d)); gl_FragColor = vec4(vec3(1.0, 0.86, 0.5) * a, 1.0); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    ring.material.userData.outlineParameters = { visible: false }; ring.position.z = 0.031; P.whole.add(ring);
    if (P.spec.gate === "inside") P.whole.userData.camGate = insideCar;
    let shown = -1;
    return {
      apply(ps, t) {
        const n = Math.floor(ps.count + 1e-6);
        if (n !== shown) { glass.material.map = face(n); glass.material.needsUpdate = true; shown = n; }
        arrow.material.opacity = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t * 5.5));
        ring.material.uniforms.uK.value = clamp(ps.glow);
      },
    };
  },

  elevdoors(P) {
    const D = { hw: 0.62, h: 2.05 };
    const tex = canvasTex(128, 512, (g, w, h) => {
      g.fillStyle = "#b9bcbf"; g.fillRect(0, 0, w, h);
      const sh = g.createLinearGradient(0, h, w, 0); sh.addColorStop(0, "rgba(255,252,246,0)"); sh.addColorStop(0.5, "rgba(255,252,246,0.12)"); sh.addColorStop(1, "rgba(255,252,246,0)"); g.fillStyle = sh; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) { const x = (i * 37.7) % w; g.fillStyle = i % 2 ? "rgba(255,250,240,0.03)" : "rgba(70,60,50,0.03)"; g.fillRect(x, 0, 1, h); }
    });
    const m = mat("#ffffff", { map: tex, roughness: 0.4, metalness: 0.15 }), edge = mat("#2f2a27", { roughness: 0.5 });
    const panels = [-1, 1].map((s) => {
      const g = new THREE.Group(); P.whole.add(g);
      const p = new THREE.Mesh(new THREE.BoxGeometry(D.hw, D.h, 0.03), m); p.position.set(s * D.hw / 2, D.h / 2, 0); p.receiveShadow = true; g.add(p);
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.012, D.h, 0.034), edge); e.position.set(s * 0.006, D.h / 2, 0); g.add(e);   // the dark meeting edge
      return [s, g];
    });
    P.whole.userData.camGate = insideCar;
    return { apply(ps) { const k = clamp(ps.open); for (const [s, g] of panels) g.position.x = s * D.hw * 1.02 * k; } };
  },

  gas(P) {
    const sp = P.spec, n = sp.n ?? 3, len = sp.len ?? 0.4, w = sp.w ?? 0.05, lean = sp.lean ?? 0, seed = sp.seed ?? 1;
    const col = new THREE.Color(sp.color ?? "#8fdc4a");
    // the puff: a soft cloud of a few overlapping round blobs
    const puff = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uTime: { value: 0 }, uColor: { value: col }, uSeed: { value: seed } }, vertexShader: BILLBOARD,
      fragmentShader: `uniform float uK, uTime, uSeed; uniform vec3 uColor; varying vec2 vUv;
        float blob(vec2 p, vec2 c, float r) { return 1.0 - smoothstep(r * 0.55, r, length(p - c)); }
        void main() {
          vec2 p = vUv - 0.5; float a = 0.0;
          for (int i = 0; i < 5; i++) { float fi = float(i), an = fi * 1.3 + uSeed + uTime * 0.6;
            a = max(a, blob(p, vec2(cos(an), sin(an) * 0.6) * 0.16, 0.2 + 0.04 * sin(fi * 2.1 + uSeed))); }
          float core = 1.0 - smoothstep(0.0, 0.32, length(p));
          vec3 c = mix(uColor, vec3(0.86, 1.0, 0.7), core * 0.5);
          gl_FragColor = vec4(c, a * uK * 0.62);
        }`,
      transparent: true, depthWrite: false,
    }));
    puff.material.userData.outlineParameters = { visible: false }; puff.frustumCulled = false; puff.renderOrder = 3; P.whole.add(puff);
    const geo = new THREE.PlaneGeometry(1, 1, 1, 32); geo.translate(0, 0.5, 0);   // uv.x across, uv.y up from the puff
    const wisps = Array.from({ length: n }, (_, i) => {
      const ph = seed * 1.7 + i * 2.1, x0 = (i - (n - 1) / 2) * 0.06, L = len * (0.75 + 0.25 * Math.cos(ph * 3.1));
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uGrow: { value: 0 }, uFade: { value: 0 }, uPh: { value: ph }, uLen: { value: L }, uW: { value: w }, uX: { value: x0 }, uLean: { value: lean }, uColor: { value: col } },
        vertexShader: `uniform float uTime, uGrow, uFade, uPh, uLen, uW, uX, uLean; varying vec2 vUv;
          void main() {
            vUv = uv; float v = uv.y, s = length(modelMatrix[0].xyz);
            vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
            // an S-curl that travels up, wider toward the top, tipped by lean; it rises a little as it fades
            float curl = sin(v * 6.5 - uTime * 2.4 + uPh) * 0.045 * (0.35 + v) + sin(v * 13.0 - uTime * 3.1 + uPh * 2.0) * 0.008;
            float y = uLen * v * (0.25 + 0.75 * uGrow) + uFade * 0.12;
            float wd = uW * (0.55 + 0.45 * sin(3.14159 * min(1.0, v * 1.2)));
            c.xy += vec2(uX * (1.0 + v) + curl + uLean * v * v + (uv.x - 0.5) * wd, y) * s;
            gl_Position = projectionMatrix * c;
          }`,
        fragmentShader: `uniform float uTime, uGrow, uFade, uPh; uniform vec3 uColor; varying vec2 vUv;
          void main() {
            float v = vUv.y, across = abs(vUv.x - 0.5) * 2.0;
            float edge = 1.0 - smoothstep(0.35, 1.0, across);
            float head = 1.0 - smoothstep(uGrow - 0.15, uGrow + 0.02, v);   // grows up out of the puff
            float a = edge * head * smoothstep(0.0, 0.12, v) * (1.0 - smoothstep(0.7, 1.0, v)) * (1.0 - uFade);
            vec3 c = mix(uColor, vec3(0.88, 1.0, 0.72), (1.0 - across) * 0.55);
            gl_FragColor = vec4(c, clamp(a, 0.0, 1.0) * 0.72);
          }`,
        transparent: true, depthWrite: false,
      });
      m.userData.outlineParameters = { visible: false };
      const o = new THREE.Mesh(geo, m); o.frustumCulled = false; o.renderOrder = 3; P.whole.add(o);
      return o;
    });
    const size = sp.size ?? 0.36;
    return {
      apply(ps, t) {
        const k = clamp(ps.puff), f = clamp(ps.fade), on = k > 0.005 && f < 0.995;
        puff.visible = on; for (const o of wisps) o.visible = on;
        if (!on) return;
        // the puff pops out fast and sinks back to a haze; the wisps take the rest of the time to grow
        const swell = smooth(clamp(k / 0.35));
        puff.scale.setScalar(size * (0.45 + 0.75 * swell + 0.2 * f));
        puff.material.uniforms.uK.value = swell * (1 - 0.45 * clamp((k - 0.35) / 0.65)) * (1 - f);
        puff.material.uniforms.uTime.value = t;
        for (const o of wisps) { const u = o.material.uniforms; u.uTime.value = t; u.uGrow.value = smooth(clamp((k - 0.1) / 0.9)); u.uFade.value = f; }
      },
    };
  },

  spell(P) {
    const m = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 }, uTime: { value: 0 }, uSize: { value: 1 } }, vertexShader: BILLBOARD,
      fragmentShader: `uniform float uK, uTime, uSize; varying vec2 vUv;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0 / max(0.05, uSize); float r = length(p), an = atan(p.y, p.x);
          // an Archimedean spiral of two and a half turns, turning; a soft glow round its line
          float s = r * 2.6 - an / 6.28318 - uTime * 1.6, d = abs(fract(s) - 0.5);
          float line = (1.0 - smoothstep(0.03, 0.11, d)) * (1.0 - smoothstep(0.75, 1.0, r)) * smoothstep(0.04, 0.16, r);
          float glow = (1.0 - smoothstep(0.0, 0.35, d)) * 0.25 * (1.0 - smoothstep(0.5, 1.0, r));
          // sparkles round the rim
          float sp = 0.0;
          for (int i = 0; i < 7; i++) { float fi = float(i), a = fi * 0.897 + uTime * (0.9 + 0.13 * fi); vec2 c = vec2(cos(a), sin(a)) * (0.78 + 0.12 * sin(fi * 3.7 + uTime * 2.0));
            vec2 q = abs(p - c); float tw = 0.5 + 0.5 * sin(uTime * 7.0 + fi * 2.3);
            sp += tw * (max(0.0, 1.0 - (q.x * 11.0 + q.y * 70.0)) + max(0.0, 1.0 - (q.y * 11.0 + q.x * 70.0))); }
          float a = (line + glow + sp) * uK;
          gl_FragColor = vec4(vec3(1.0, 0.8, 0.32) * a * 1.25, 1.0);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    m.userData.outlineParameters = { visible: false };
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.frustumCulled = false; q.renderOrder = 5; q.scale.setScalar(P.spec.size ?? 0.42); P.whole.add(q);
    return { apply(ps, t) { const k = clamp(ps.magic); q.visible = k > 0.005; m.uniforms.uK.value = k; m.uniforms.uTime.value = t; m.uniforms.uSize.value = clamp(ps.level, 0.05, 1); } };
  },

  orb(P) {
    const R = P.spec.r ?? 0.085, col = P.spec.color ?? "#9be35f";
    const ball = new THREE.Mesh(new THREE.SphereGeometry(R, 28, 20), new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(col) } },
      vertexShader: "varying vec3 vN; varying vec3 vP; void main() { vN = normalize(normalMatrix * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: `uniform float uTime; uniform vec3 uColor; varying vec3 vN; varying vec3 vP;
        void main() { float rim = 1.0 - abs(vN.z); float sw = 0.5 + 0.5 * sin(vP.y * 60.0 + vP.x * 40.0 + uTime * 6.0);
          vec3 c = mix(uColor * 1.05, vec3(0.9, 1.0, 0.75), 0.35 * sw * (1.0 - rim)) + vec3(0.25, 0.4, 0.1) * rim * rim;
          gl_FragColor = vec4(c, 0.88); }`,
      transparent: true, depthWrite: false,
    }));
    ball.material.userData.outlineParameters = { visible: false }; ball.renderOrder = 4; P.whole.add(ball);
    const halo = glowSprite("rgba(150,230,90,0.55)", R * 5); P.whole.add(halo);
    const to = (P.spec.to || [[-1, 0, -0.4], [1, 0, -0.4], [0, 0, -0.4]]).map((v) => new THREE.Vector3(...v));
    const sparks = to.map(() => { const head = glowSprite("rgba(230,255,150,1)", 0.34), trail = Array.from({ length: 7 }, (_, i) => glowSprite("rgba(170,240,90,0.85)", 0.24 * (1 - i * 0.11))); P.whole.add(head, ...trail); return { head, trail }; });
    const at = (v, k, out) => out.copy(v).multiplyScalar(k).setY(v.y * k + 0.12 * Math.sin(Math.PI * k));   // a low arc, under the faces
    const tmp = new THREE.Vector3();
    return {
      apply(ps, t) {
        const g = clamp(ps.glow), b = clamp(ps.burst), wob = clamp(ps.wobble), whole = g > 0.005 && b < 0.04;
        ball.visible = halo.visible = whole;
        ball.material.uniforms.uTime.value = t;
        // buckling: bulges and dents that speed up as it gets worse
        const f = 9 + 16 * wob, sq = 0.22 * wob * Math.sin(t * f), sq2 = 0.14 * wob * Math.sin(t * f * 1.7 + 1.0);
        ball.scale.set(g * (1 + sq), g * (1 - sq + sq2), g * (1 - sq2));
        halo.scale.setScalar(R * 5 * g * (1 + 0.3 * wob)); halo.material.opacity = 0.75 + 0.25 * Math.sin(t * 9);
        sparks.forEach((s, i) => {
          const on = b > 0.04 && b < 0.999, k = smooth(clamp((b - 0.04) / 0.86)), out = 1 - smooth(clamp((b - 0.86) / 0.13));
          s.head.visible = on; for (const q of s.trail) q.visible = on;
          if (!on) return;
          s.head.position.copy(at(to[i], k, tmp)); s.head.material.opacity = out;
          s.trail.forEach((q, j) => { q.position.copy(at(to[i], Math.max(0, k - (j + 1) * 0.04), tmp)); q.material.opacity = out * 0.7 * (1 - j * 0.17); });
        });
      },
    };
  },
};
