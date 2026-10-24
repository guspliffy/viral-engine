import * as THREE from "three";
import { taperedTube, radialTexture } from "./geo.js";

// PotatoBrawl's Phoenix and Reaper in 3D, from the game's colours and drawings (game/core.js palettes,
// game/ui/draw-fighters.js): the Phoenix's flame crest and flame wings, the Reaper's hood and farm scythe.
// buildCostume (costumes.js) hands over to these for costume types "phoenix" and "reaper".

// one flame feather: a flattened tapered tube from base to tip, accent at the root and a hot tip
function feather(len, width, col, tip, bend = 0.25) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, len * 0.5, -len * bend * 0.4), new THREE.Vector3(0, len, -len * bend)]);
  const g = taperedTube(curve, width, 0.004, 16, 10, (t) => width * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) + 0.004);
  // colour runs from the accent at the root to the hot tip
  const pos = g.attributes.position, cols = [], a = new THREE.Color(col), b = new THREE.Color(tip);
  for (let i = 0; i < pos.count; i++) { const k = Math.max(0, Math.min(1, pos.getY(i) / len)); const c = a.clone().lerp(b, Math.pow(k, 1.6)); cols.push(c.r, c.g, c.b); }
  g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  return g;
}

export function phoenixCostume(C, ch) {
  const accent = C.accent || "#ff6a2b", tip = C.tip || "#ffd23f";
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, emissive: new THREE.Color(accent).multiplyScalar(0.25) });
  // the crest: a fan of flame feathers on top, swept back
  const crest = new THREE.Group();
  const N = 7;
  for (let i = 0; i < N; i++) {
    const k = i / (N - 1) - 0.5, len = 0.36 + 0.18 * Math.cos(k * Math.PI) + (i % 2) * 0.05;
    const m = new THREE.Mesh(feather(len, 0.06, accent, tip, 0.55), mat); m.castShadow = true;
    m.scale.set(1, 1, 0.5);   // thin front to back, so the fan reads from the front
    m.rotation.set(-0.3 - Math.abs(k) * 0.25, 0, k * 1.9); m.position.set(k * 0.14, -0.04, -0.06);
    crest.add(m);
  }
  // the wings: two fans of long flame feathers on the back, folded down at rest, spread up and out by st.wings
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.55, ch.cy + ch.ry * 0.15, -ch.rz * 0.75); ch.bodyGroup.add(pivot);
    const fan = new THREE.Group(); pivot.add(fan);
    for (let i = 0; i < 5; i++) {
      const len = 0.42 - i * 0.05, m = new THREE.Mesh(feather(len, 0.055, accent, tip, 0.15), mat); m.castShadow = true;
      m.scale.set(1, 1, 0.35); m.rotation.set(0, 0, s * (-0.25 - i * 0.32)); fan.add(m);
    }
    return { pivot, fan, s };
  });
  // "charge" makes the Phoenix blaze: the feathers glow, a halo grows behind it and it lights the room round it
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture([[0, "rgba(255,250,225,1)"], [0.3, "rgba(255,214,120,0.75)"], [0.65, "rgba(255,140,60,0.25)"], [1, "rgba(255,120,40,0)"]]), transparent: true, depthWrite: false }));
  halo.position.set(0, ch.cy + 0.15, -0.5); halo.visible = false; halo.name = "glow"; ch.bodyGroup.add(halo);
  const blaze = new THREE.PointLight("#ffbf70", 0, 7, 1.4); blaze.position.set(0, ch.cy + 0.3, 0.25); ch.bodyGroup.add(blaze);
  return {
    hat: { group: crest, height: 0.25, brimR: 0 }, sitDepth: 0.06,
    apply(st, t) {
      const c = Math.max(0, st.charge || 0), fk = 1 + 0.06 * Math.sin(t * 11.3) + 0.04 * Math.sin(t * 17.9);
      mat.emissiveIntensity = 1 + 7 * c * fk; blaze.intensity = 9 * c * fk;
      halo.visible = c > 0.01; halo.scale.setScalar((0.5 + 2.1 * c) * fk); halo.material.opacity = Math.min(0.95, c * 1.2);
      // the beat's phase is integrated over time in timeline.js (t × speed would jump when the speed changes)
      const w = st.wings || 0, fl = st.flap || 0, flap = Math.sin(st.flapPhase ?? t * 7) * (0.08 * (0.4 + w) + 0.45 * fl);
      for (const W of wings) { W.fan.rotation.set(-0.25 - 0.2 * w, W.s * (0.5 - 0.35 * w - 0.25 * fl), W.s * (-2.2 + 1.3 * w + 0.15 * fl + flap)); W.fan.scale.setScalar(0.85 + 0.4 * w + 0.4 * fl); }
      crest.rotation.x = 0.05 * Math.sin(t * 3.1);
    },
  };
}

// the hood: the top and back of a slightly larger potato shell, open at the front around the face, a soft point at the back
function hoodGeometry(ch) {
  // a shell a little bigger than the body over the top and down the back. Round the face (an oval) and below it at
  // the front the shell sinks inside the body, so the opening's edge is where the two surfaces meet: smooth at any size
  const g = new THREE.SphereGeometry(1, 120, 80, 0, Math.PI * 2, 0, Math.PI * 0.82), p = g.attributes.position, v = new THREE.Vector3();
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  for (let i = 0; i < p.count; i++) {
    const n = v.fromBufferAttribute(p, i).clone().normalize(), q = ch.bodyPoint(n);
    const az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const face = (az / 0.95) ** 2 + ((el + 0.05) / 0.62) ** 2, front = n.z > -0.15 && n.y < -0.2 ? 0 : 1;
    const out = Math.min(sstep(0.85, 1.15, face), front ? 1 : sstep(-0.35, -0.15, n.z)), sc = 0.9 + 0.18 * out;
    const back = Math.max(0, -n.z) * Math.max(0, n.y);
    p.setXYZ(i, q.x * sc, ch.cy + (q.y - ch.cy) * sc + back * back * 0.14 * out, q.z * sc - back * back * 0.06 * out);
  }
  g.computeVertexNormals();
  return g;
}
function scythe(C) {
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: C.wood || "#6b4a2b", roughness: 0.75 });
  const steel = new THREE.MeshStandardMaterial({ color: C.blade || "#c9ced6", roughness: 0.28, metalness: 0.75, side: THREE.DoubleSide });
  const shaft = new THREE.Mesh(taperedTube(new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.55, 0), new THREE.Vector3(0.02, 0.1, 0), new THREE.Vector3(-0.01, 0.6, 0), new THREE.Vector3(0.03, 0.9, 0)]), 0.022, 0.026, 30, 10), wood);
  shaft.castShadow = true; g.add(shaft);
  // the blade: a crescent, flat, sweeping out from the top of the shaft
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.quadraticCurveTo(0.28, 0.16, 0.56, -0.08); s.quadraticCurveTo(0.3, 0.04, 0.02, -0.07); s.closePath();
  const blade = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.004, bevelSegments: 2, curveSegments: 24 }), steel);
  blade.position.set(0.02, 0.88, -0.006); blade.castShadow = true; g.add(blade);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 12), new THREE.MeshStandardMaterial({ color: "#3a3440", roughness: 0.5 }));
  collar.position.set(0.03, 0.87, 0); g.add(collar);
  // the blade's point: a prop grabbed with hand "tip" hangs here
  const tip = new THREE.Object3D(); tip.position.set(0.56, 0.8, 0); g.add(tip);
  return { g, tip };
}
export function reaperCostume(C, ch) {
  const cloth = new THREE.MeshStandardMaterial({ color: C.accent || "#34313a", roughness: 0.9, side: THREE.DoubleSide });
  const hood = new THREE.Mesh(hoodGeometry(ch), cloth); hood.castShadow = true; ch.bodyGroup.add(hood);
  const { g, tip } = scythe(C);
  return { hat: null, sitDepth: -0.035, prop: { group: g, tip, charge() {} }, apply() {} };
}
