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
  const crest = new THREE.Group(); crest.scale.setScalar(C.crest ?? 0.6);   // smaller than the game's crest: the portraits show only the sprout
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
    const pivot = new THREE.Group(); pivot.position.set(s * ch.rx * 0.72, ch.cy + ch.ry * 0.12, -ch.rz * 0.55); ch.bodyGroup.add(pivot);
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
      const rest = C.restWings ?? 0.85, w = (rest + (1 - rest) * (st.wings || 0)) * (st.span ?? 1), fl = (st.flap || 0) * (0.5 + 0.5 * (st.span ?? 1)),   // the portraits show the wings half open at rest; span tucks them
       flap = Math.sin(st.flapPhase ?? t * 7) * (0.08 * (0.4 + w) + 0.45 * fl);
      for (const W of wings) { W.fan.rotation.set(-0.25 - 0.2 * w, W.s * (0.5 - 0.35 * w - 0.25 * fl), W.s * (-2.2 + 2.0 * w + 0.15 * fl + flap)); W.fan.scale.setScalar(1.0 + 0.4 * w + 0.4 * fl); }
      const ft = st.ft || { f: 0, s: 0 };   // follow-through (timeline.js): the fan trails the head
      crest.rotation.set(0.05 * Math.sin(t * 3.1) + 0.7 * ft.f, 0, 0.06 - 0.7 * ft.s);
    },
  };
}

// the hood: the top and back of a slightly larger potato shell, open at the front around the face, a soft point at the back
// peak (0..1): the crown rises into a soft point that leans back, like a cloak's hood (the face-targets sheet)
export function hoodGeometry(ch, extent = 0.82, peak = 0, lining = 0, fine = lining > 0) {
  // a shell a little bigger than the body over the top and down the back. Round the face (an oval) and below it at
  // the front the shell sinks inside the body, so the opening's edge is where the two surfaces meet: smooth at any size
  const g = new THREE.SphereGeometry(1, fine ? 200 : 120, fine ? 130 : 80, 0, Math.PI * 2, 0, Math.PI * extent), p = g.attributes.position, v = new THREE.Vector3();
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  for (let i = 0; i < p.count; i++) {
    const n = v.fromBufferAttribute(p, i).clone().normalize(), q = ch.bodyPoint(n);
    const az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    // lining: the hood's inside, a shell between body and hood whose opening is that much smaller, so a dark band shows
    // just inside the hood's edge round the face
    const k = 1 - lining, face = (az / (0.95 * k)) ** 2 + ((el + 0.05) / (0.62 * k)) ** 2, front = n.z > -0.15 && n.y < -0.2 ? 0 : 1;
    const out = Math.min(sstep(0.85, 1.15, face), front ? 1 : sstep(-0.35, -0.15, n.z)), sc = 0.9 + (lining ? 0.155 : 0.18) * out;
    const back = Math.max(0, -n.z) * Math.max(0, n.y);
    const top = peak * sstep(0.45, 1.0, n.y) * out;
    p.setXYZ(i, q.x * sc * (1 - 0.35 * top * top), ch.cy + (q.y - ch.cy) * sc + back * back * 0.14 * out + top * top * 0.3 * ch.ry, q.z * sc * (1 - 0.35 * top * top) - back * back * 0.06 * out - top * top * 0.16 * ch.ry);
  }
  g.computeVertexNormals();
  return g;
}
// costume.hoodStyle "cloth" (Jonny, 28 Oct: "the hoodie shouldn't look like part of the body"): a hood made as its own
// piece of cloth instead of a shell that sinks into the face. It stands off the head with some volume, its opening
// round the face ends in a thick rolled edge, its top hangs forward over the forehead (it shades the face), the
// lower part falls in soft folds and flares a little at the hem.
//   C.hoodOpen (1): opening size, C.hoodOverhang (0.14): how far the top edge reaches forward, C.hoodRim (0.024 m),
//   C.hoodRound (0.07): how much the crown rounds off, C.hoodSlump (0.05): how far it falls to one side
export function hoodClothGeometry(ch, C = {}) {
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const o = C.hoodOpen ?? 1, ovh = C.hoodOverhang ?? 0.14, AZ = 0.95 * o, EL = 0.62 * o, E0 = -0.05;
  // where a direction lands on the cloth; near = 0 on the opening's edge, 1 away from it
  const place = (n, face) => {
    const near = sstep(1.0, 1.7, face), az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const q = ch.bodyPoint(n);
    const fold = 0.014 * Math.sin(az * 7 + 0.6) * sstep(0.1, -0.7, n.y) * near;
    const back = Math.max(0, -n.z) * Math.max(0, n.y);
    // a seam groove over the crown, front to back, and two drape folds running down from the cheeks
    const seam = -0.012 * Math.exp(-(((Math.abs(az) < Math.PI / 2 ? az : Math.PI - Math.abs(az)) / 0.07) ** 2)) * sstep(0.35, 0.85, n.y);
    const drape = 0.018 * near * sstep(0.2, -0.5, n.y) * (Math.exp(-(((Math.abs(az) - 1.25) / 0.16) ** 2)));
    const sc = 1.04 + 0.06 * near + 0.08 * sstep(-0.1, 0.8, n.y) * near + fold + seam + drape + 0.06 * sstep(-0.55, -0.9, n.y);
    const p = new THREE.Vector3(q.x * sc, ch.cy + (q.y - ch.cy) * sc + back * back * 0.12, q.z * sc - back * back * 0.05);
    // a cloth dome, not the egg's point: the crown rounds off wider and lower and slumps back to one side
    const crown = sstep(0.35, 0.95, n.y);
    p.x *= 1 + 0.08 * sstep(0.2, 0.8, n.y); p.z *= 1 + 0.05 * sstep(0.2, 0.8, n.y);
    p.y -= (C.hoodRound ?? 0.07) * ch.ry * crown; p.x += (C.hoodSlump ?? 0.05) * ch.rx * crown; p.z -= 0.04 * ch.rz * crown;
    // the top of the opening hangs forward and a little down over the brow
    const top = sstep(-0.05, 0.45, el - E0) * (1 - sstep(0.0, 0.8, near)) * sstep(0.6, 1.0, Math.cos(az / AZ * 1.2));
    p.z += ovh * ch.rz * top; p.y -= 0.08 * ovh * ch.ry * top;
    return p;
  };
  const g = new THREE.SphereGeometry(1, 220, 150, 0, Math.PI * 2, 0, Math.PI * 0.86), P = g.attributes.position, v = new THREE.Vector3();
  const inside = new Uint8Array(P.count);
  for (let i = 0; i < P.count; i++) {
    const n = v.fromBufferAttribute(P, i).clone().normalize();
    let az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    let face = (az / AZ) ** 2 + ((el - E0) / EL) ** 2;
    if (face < 1 && n.z > 0) {   // inside the opening: pulled out onto its edge, so the cut is a smooth line
      inside[i] = 1; const k = 1 / Math.sqrt(Math.max(1e-6, face)); az *= k; el = E0 + (el - E0) * k; face = 1;
      n.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    }
    const p = place(n, face); P.setXYZ(i, p.x, p.y, p.z);
  }
  const idx = g.index.array, keep = [];
  for (let i = 0; i < idx.length; i += 3) if (!(inside[idx[i]] && inside[idx[i + 1]] && inside[idx[i + 2]])) keep.push(idx[i], idx[i + 1], idx[i + 2]);
  g.setIndex(keep); g.computeVertexNormals();
  // the rolled edge round the face
  const pts = [];
  for (let k = 0; k < 160; k++) {
    const th = (k / 160) * Math.PI * 2, az = AZ * Math.cos(th), el = E0 + EL * Math.sin(th);
    pts.push(place(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)), 1));
  }
  const rim = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 200, C.hoodRim ?? 0.024, 12, true);
  return { shell: g, rim };
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
  if (C.hoodStyle === "cloth") {
    const { shell, rim } = hoodClothGeometry(ch, C);
    // the rolled edge catches a little more light than the hood (C.hoodRimColor), so the opening reads as a cloth edge
    const edge = new THREE.MeshStandardMaterial({ color: C.hoodRimColor || new THREE.Color(C.accent || "#34313a").multiplyScalar(1.45), roughness: 0.9 });
    for (const [geo, m] of [[shell, cloth], [rim, edge]]) { const o = new THREE.Mesh(geo, m); o.castShadow = true; ch.bodyGroup.add(o); }
    const { g, tip } = scythe(C);
    return { hat: null, sitDepth: -0.035, prop: { group: g, tip, charge() {} }, apply() {} };
  }
  const hood = new THREE.Mesh(hoodGeometry(ch, 0.82, C.hoodPeak ?? 0, 0, !!C.hoodLining), cloth); hood.castShadow = true; ch.bodyGroup.add(hood);
  // costume.hoodLining (0.06 to 0.12): the dark inside of the hood showing as a band round the face (both shells finer,
  // so the edges where they cross stay smooth)
  if (C.hoodLining) ch.bodyGroup.add(new THREE.Mesh(hoodGeometry(ch, 0.82, C.hoodPeak ?? 0, C.hoodLining),
    new THREE.MeshStandardMaterial({ color: C.lining || "#1e1b25", roughness: 0.95, side: THREE.DoubleSide })));
  const { g, tip } = scythe(C);
  return { hat: null, sitDepth: -0.035, prop: { group: g, tip, charge() {} }, apply() {} };
}
