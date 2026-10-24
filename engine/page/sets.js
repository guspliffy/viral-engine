import * as THREE from "three";
import { rng } from "./util.js";

function skyDome(top, horizon, bottom) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, hor: { value: new THREE.Color(horizon) }, bot: { value: new THREE.Color(bottom) } },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform vec3 top; uniform vec3 hor; uniform vec3 bot; varying vec3 vP;",
      "void main(){ float h = vP.y;",
      "  vec3 c = h > 0.0 ? mix(hor, top, pow(clamp(h*1.6,0.0,1.0), 0.7)) : mix(hor, bot, clamp(-h*4.0,0.0,1.0));",
      "  gl_FragColor = vec4(c,1.0);",
      "  #include <colorspace_fragment>",
      "}",
    ].join("\n"),
  });
  return new THREE.Mesh(new THREE.SphereGeometry(90, 32, 24), m);
}

function groundTexture(inner, outer) {
  const c = document.createElement("canvas"); c.width = c.height = 512;
  const g = c.getContext("2d"); const gr = g.createRadialGradient(256, 256, 10, 256, 256, 256);
  gr.addColorStop(0, inner); gr.addColorStop(0.35, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// "meadow": a soft grassy stage under a warm sky, rolling hills and a few clouds.
export function buildSet(scene, spec = {}) {
  const S = { sky: ["#7fc8ff", "#ffe9bf"], ground: ["#8fd16a", "#4f9a45"], seed: 3, ...spec };
  const rnd = rng(S.seed * 131);
  scene.background = new THREE.Color(S.sky[1]);
  scene.fog = new THREE.Fog(S.sky[1], 22, 70);
  scene.add(skyDome(S.sky[0], S.sky[1], S.ground[1]));

  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 96), new THREE.MeshStandardMaterial({ map: groundTexture(S.ground[0], S.ground[1]), roughness: 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const hillM = [new THREE.MeshStandardMaterial({ color: "#6fbf5a", roughness: 1 }), new THREE.MeshStandardMaterial({ color: "#5aa84f", roughness: 1 })];
  for (let i = 0; i < 7; i++) {
    const h = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20), hillM[i % 2]);
    const x = -26 + i * 9 + rnd() * 4, z = -22 - rnd() * 16, sx = 7 + rnd() * 6;
    h.scale.set(sx, 2.2 + rnd() * 2.6, 5 + rnd() * 3); h.position.set(x, -0.6, z); scene.add(h);
  }
  const cloudM = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, emissive: "#eef6ff", emissiveIntensity: 0.55, fog: false });
  for (let i = 0; i < 6; i++) {
    const cg = new THREE.Group();
    for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), cloudM); b.scale.setScalar(0.9 + rnd() * 0.9); b.position.set(k * 1.1 - 2.2, rnd() * 0.6, rnd() * 0.5); cg.add(b); }
    cg.position.set(-24 + i * 9 + rnd() * 5, 7 + rnd() * 6, -40 - rnd() * 10); cg.scale.setScalar(1.2 + rnd()); scene.add(cg);
  }
  // grass tufts and flowers, kept out of the middle of the stage
  const tuftM = new THREE.MeshStandardMaterial({ color: "#4f9a3f", roughness: 0.9 });
  const petal = ["#ffffff", "#ffd1e8", "#fff3a0"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }));
  const centre = new THREE.MeshStandardMaterial({ color: "#f2b33d", roughness: 0.6 });
  for (let i = 0; i < 70; i++) {
    const a = rnd() * Math.PI * 2, r = 2.6 + rnd() * 9;
    const x = Math.cos(a) * r, z = Math.sin(a) * r * 0.8 - 1.5;
    if (z > 2.2) continue;
    if (rnd() < 0.65) {
      const g = new THREE.Group();
      for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.22 + rnd() * 0.12, 5), tuftM); b.position.set((rnd() - 0.5) * 0.12, 0.1, (rnd() - 0.5) * 0.12); b.rotation.set((rnd() - 0.5) * 0.6, 0, (rnd() - 0.5) * 0.6); g.add(b); }
      g.position.set(x, 0, z); scene.add(g);
    } else {
      const f = new THREE.Group();
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 5), tuftM); stem.position.y = 0.11; f.add(stem);
      const pm = petal[Math.floor(rnd() * petal.length)];
      for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), pm); const aa = (k / 5) * Math.PI * 2; p.position.set(Math.cos(aa) * 0.035, 0.23, Math.sin(aa) * 0.035); p.scale.set(1, 0.4, 1); f.add(p); }
      const cc = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), centre); cc.position.y = 0.235; f.add(cc);
      f.position.set(x, 0, z); scene.add(f);
    }
  }
}

export function buildLights(scene, spec = {}) {
  scene.add(new THREE.HemisphereLight("#d6ecff", "#7a6a3a", 0.9));
  const key = new THREE.DirectionalLight("#fff0d4", 2.6);
  key.position.set(-3.5, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 20 });
  scene.add(key);
  const fill = new THREE.DirectionalLight("#c4dcff", 0.7); fill.position.set(4, 2.5, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight("#fff6e8", 1.6); rim.position.set(1, 3.5, -5); scene.add(rim);
}
