import * as THREE from "three";

// steam: three thin wavy wisps rising from a hot drink, drawn as ribbons that always face the camera. The waves travel
// up and the wisps fade in at the bottom and out at the top. amount 0..1 (the prop's `steam`), t the clip time.
export function steamWisps(parent, top) {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 24); geo.translate(0.5, 0.5, 0);   // uv.x across, uv.y up
  const wisps = [[-0.022, 0.0, 0.9], [0.004, 0.6, 1.0], [0.026, 2.3, 0.8]].map(([x, phase, len]) => {
    const m = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uPhase: { value: phase }, uLen: { value: len } },
      vertexShader: `uniform float uTime, uPhase, uLen; varying vec2 vUv;
        void main() {
          vUv = uv; float v = uv.y, u = uv.x - 0.5, s = length(modelMatrix[0].xyz);
          vec4 c = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float wob = sin(v * 7.0 - uTime * 3.2 + uPhase) * 0.022 * (0.25 + v);
          c.xy += vec2(wob + u * 0.026 * (1.0 - 0.5 * v), 0.3 * uLen * v) * s;
          gl_Position = projectionMatrix * c;
        }`,
      fragmentShader: `uniform float uTime, uAmount, uPhase; varying vec2 vUv;
        void main() {
          float v = vUv.y, edge = 1.0 - smoothstep(0.15, 0.5, abs(vUv.x - 0.5));
          float a = uAmount * edge * smoothstep(0.0, 0.18, v) * (1.0 - smoothstep(0.45, 1.0, v)) * (0.55 + 0.45 * sin(v * 11.0 - uTime * 4.0 + uPhase * 2.0));
          gl_FragColor = vec4(1.0, 1.0, 1.0, clamp(a, 0.0, 1.0) * 0.75);
        }`,
      // opacity below 0.95 keeps the wisps out of the caption check (stage.js treats them as see-through)
      transparent: true, depthWrite: false, opacity: 0.5,
    });
    m.userData.noOutline = true;
    const o = new THREE.Mesh(geo, m); o.position.set(x, top, 0); o.frustumCulled = false; o.renderOrder = 3; o.userData.steam = true; parent.add(o);
    return o;
  });
  return (amount, t) => { for (const o of wisps) { o.visible = amount > 0.01; o.material.uniforms.uAmount.value = amount; o.material.uniforms.uTime.value = t; } };
}
