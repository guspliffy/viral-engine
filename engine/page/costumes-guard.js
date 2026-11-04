import * as THREE from "three";
import { band, clothMat, metalMat } from "./costumes-art.js";
import { onSurface } from "./costumes-cast.js";

// costume.guard (King's Guard, London clip, 4 Nov 2026): the Reaper as a royal guard, copied from Jonny's approved
// board (/mnt/project-files/video-scripts/2026-11-04-london/02-kings-guard-panels.png). On top of the castLook "sheet"
// Reaper (costumes-art-cast.js reaperSheet, which reads costume.sheetRobe and costume.sheetSpread for the red tunic
// under a wider-open cloak):
//   - a bright red tunic from the neck to the hips (the robe under the cloak turns red), a row of four gold buttons down
//     the front, a white belt with a square gold buckle
//   - a tall black bearskin sitting on top of the hood, the sprout on its very top (returned as the hat, so the sprout's
//     "hat-top" placement and the hat checks work as for the Wizard's hat)
// Real-world reference: the Foot Guards' bearskin is about 46 cm tall on a 1.8 m man (a quarter of his height) and
// round-topped, narrower at the band than over the crown, the fur long and lying downward, the chin strap under the
// lower lip; the tunic is scarlet with a high collar and brass buttons, the belt white buff leather with a brass plate.
// Potato proportions follow the board instead: the bearskin is about half the body's height and as wide as the hood.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// the bearskin: a tall round-topped drum of long black fur. A lathe whose radius swells from the band up to two thirds of
// its height and rounds over the crown; the surface is broken into lying-down tufts (a bumpy skin pushed out along the
// normal, the bumps longer than wide and pointing down), with a dark blue-black sheen so it reads as fur, not felt.
function bearskin(C) {
  const g = new THREE.Group(), H = C.bearskinH ?? 0.64, R0 = C.bearskinR ?? 0.33, NS = 44, NR = 64;
  const prof = (v) => {   // v 0 band .. 1 crown -> radius
    const bulge = R0 * (0.9 + 0.2 * Math.sin(Math.PI * Math.min(1, v * 0.85)));
    const crown = v < 0.72 ? 1 : Math.sqrt(Math.max(0, 1 - ((v - 0.72) / 0.28) ** 2));
    return bulge * crown;
  };
  const pos = [], col = [], idx = [], dk = new THREE.Color("#121118"), mid = new THREE.Color("#23212c"), c = new THREE.Color();
  for (let j = 0; j <= NS; j++) {
    const v = j / NS, r = prof(v);
    for (let i = 0; i <= NR; i++) {
      const a = (i / NR) * Math.PI * 2;
      // tufts: long downward strokes of fur (frequency along the height lower than round it), ragged at the band
      const n1 = Math.sin(a * 13 + Math.sin(v * 7 + a * 5) * 2.1 + v * 4), n2 = Math.sin(a * 29 - v * 11 + Math.sin(a * 7) * 1.7);
      const tuft = 0.006 * n1 * Math.sin(v * 9 + a * 3.1) + 0.004 * n2 + (v < 0.07 ? 0.008 * Math.sin(a * 31 + 1.3) : 0);
      const rr = Math.max(0, r + tuft * Math.min(1, r / (R0 * 0.3)));
      pos.push(Math.sin(a) * rr, v * H, Math.cos(a) * rr);
      c.copy(dk).lerp(mid, 0.5 + 0.3 * n1 + 0.2 * n2); col.push(c.r, c.g, c.b);
    }
  }
  for (let j = 0; j < NS; j++) for (let i = 0; i < NR; i++) { const a = j * (NR + 1) + i, b = a + 1, d = a + NR + 1, e = d + 1; idx.push(a, b, d, b, e, d); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const fur = new THREE.MeshStandardMaterial({ color: "#ffffff", vertexColors: true, roughness: 0.78, metalness: 0 });
  fur.userData.lookRole = "cloth";
  const m = new THREE.Mesh(geo, fur); m.castShadow = m.receiveShadow = true; g.add(m);
  // a few loose strands standing off the outline, so the silhouette is fur at phone size
  const strands = [];
  for (let k = 0; k < 26; k++) {
    const v = 0.15 + 0.8 * rnd(k), a = rnd(k + 50) * Math.PI * 2, r = prof(v);
    const s = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.05, 5), fur);
    s.position.set(Math.sin(a) * r, v * H, Math.cos(a) * r);
    s.lookAt(s.position.clone().add(new THREE.Vector3(Math.sin(a), -1.6, Math.cos(a))));
    s.rotateX(Math.PI / 2); g.add(s); strands.push(s);
  }
  // buildCostume tips every hat a little (-0.08, 0, 0.06) for a jaunty look; a guard's bearskin sits dead straight
  const outer = new THREE.Group(); g.rotation.set(0.08, 0, -0.06); g.position.y = -(C.bearskinSink ?? 0.2); outer.add(g);
  return { group: outer, height: H - (C.bearskinSink ?? 0.2) };
}

// returns { hat, apply } for costumes-pb.js reaperCostume when costume.guard is set (castLook "sheet" only)
export function guardLayer(C, ch) {
  const parts = ch.potatoParts;
  // the white belt round the waist and its square gold plate
  const white = clothMat("#f1ede4", { roughness: 0.7 }); white.userData.lookRole = "cloth";
  const belt = new THREE.Mesh(band(ch, { ph: C.beltPh ?? -0.74, w: 0.04, t: 0.014, lift: 0.032, round: 0.6 }), white);
  belt.castShadow = true; parts.add(belt);
  const gold = metalMat("#e0b13a", 0.3);
  const plate = new THREE.Group();
  plate.add(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.02, 0.095), gold));
  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.026, 0.05), metalMat("#f2cf63", 0.25)); plate.add(inner);
  parts.add(onSurface(ch, plate, 0, C.beltPh ?? -0.74, 0.05));
  // the brass buttons down the tunic front, from the collar to the belt
  const btn = new THREE.SphereGeometry(0.019, 14, 10);
  for (const ph of C.buttons || [-0.6, -0.9]) { const b = new THREE.Mesh(btn, gold); b.scale.y = 0.55; parts.add(onSurface(ch, b, 0, ph, 0.038)); }
  const hat = bearskin(C);
  return { hat, apply() {} };
}
