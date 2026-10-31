import * as THREE from "three";
import { lowerShell, ring, cape } from "./costumes-cast.js";
import { taperedTube, radialTexture } from "./geo.js";
import { rad } from "./util.js";

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
      const c = Math.max(0, st.charge || 0), fk = 1 + 0.06 * Math.sin(t * rad(11.3)) + 0.04 * Math.sin(t * rad(17.9));
      mat.emissiveIntensity = 1 + 7 * c * fk; blaze.intensity = 9 * c * fk;
      halo.visible = c > 0.01; halo.scale.setScalar((0.5 + 2.1 * c) * fk); halo.material.opacity = Math.min(0.95, c * 1.2);
      // the beat's phase is integrated over time in timeline.js (t × speed would jump when the speed changes)
      const rest = C.restWings ?? 0.85, w = (rest + (1 - rest) * (st.wings || 0)) * (st.span ?? 1), fl = (st.flap || 0) * (0.5 + 0.5 * (st.span ?? 1)),   // the portraits show the wings half open at rest; span tucks them
       flap = Math.sin(st.flapPhase ?? t * 7) * (0.08 * (0.4 + w) + 0.45 * fl);
      for (const W of wings) {
        const ws = Math.max(0, w + ((st.wingSide || {})[W.s < 0 ? "R" : "L"] || 0));   // a "wings" action with a side moves one wing
        W.fan.rotation.set(-0.25 - 0.2 * ws, W.s * (0.5 - 0.35 * ws - 0.25 * fl), W.s * (-2.2 + 2.0 * ws + 0.15 * fl + flap)); W.fan.scale.setScalar(1.0 + 0.4 * ws + 0.4 * fl);
      }
      const ft = st.ft || { f: 0, s: 0 };   // follow-through (timeline.js): the fan trails the head
      crest.rotation.set(0.05 * Math.sin(t * rad(3.1)) + 0.7 * ft.f, 0, 0.06 - 0.7 * ft.s);
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
// costume.hoodStyle "cloth" (Jonny, 28 Oct: "the hoodie shouldn't look like part of the body", and his hood review):
// a hood designed as its own piece of cloth. Its outer shape and its face opening are authored separately:
//   - the opening is a contour, not an ellipse: a diagonal upper edge (hoodDiag), one cheek wider than the other
//     (hoodAsym), width hoodOpen and height hoodOpenH (default hoodOpen). Keep the brows clear of it: they act
//   - a roomy dome above the head (hoodDome), off centre with a soft point flopping back to one side (hoodTip;
//     hoodSide -1 mirrors it), one broad fold running from the crown to a temple and one over the wide cheek
//     (hoodFold), and three big folds where the cloth gathers on the shoulders
//   - the edge stands off the face more on the wide cheek, so the lining shows there
//   - the opening ends in a folded hem whose width changes round the face (hoodRim: its base width, m), with a dark
//     lining recessed behind it
// Returns { shell, hem, lining } geometries in the body group's space; costume materials set their look roles.
export function hoodClothGeometry(ch, C = {}) {
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const o = C.hoodOpen ?? 1, AZ = 0.95 * o, EL = 0.62 * (C.hoodOpenH ?? o), E0 = -0.05;   // hoodOpenH: the height on its own
  const diag = C.hoodDiag ?? 0.16, asym = C.hoodAsym ?? 0.08, ovh = C.hoodOverhang ?? 0.14, side = C.hoodSide ?? 1;
  // the opening's edge at angle th round the face (th 0 = the wide cheek, pi/2 = top): [az, el]
  const edge = (th) => {
    const c = Math.cos(th), sn = Math.sin(th), az = AZ * c * (1 + side * asym * Math.sign(c) * Math.abs(c));
    return [az, E0 + EL * sn - diag * side * az * Math.max(0, sn)];
  };
  // how far a direction is from the opening: < 1 inside, 1 on the edge (measured along the ray from the centre)
  const faceOf = (az, el) => {
    const th = Math.atan2((el - E0) / EL, az / AZ), [ea, ee] = edge(th);
    return Math.hypot(az, (el - E0)) / Math.max(1e-4, Math.hypot(ea, ee - E0));
  };
  const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  // broad folds: a band (great circle through a and b, width w) bulging out on one side and creased on the other
  const band = (n, a, b, w, amp) => {
    const ax = new THREE.Vector3().crossVectors(a, b).normalize(), d = n.dot(ax);
    return amp * (Math.exp(-(((d - w) / w) ** 2)) - 0.7 * Math.exp(-(((d + 0.3 * w) / (0.6 * w)) ** 2)));
  };
  const crownDir = new THREE.Vector3(side * 0.18, 1, -0.25).normalize(), temple = dir(-side * 0.75, 0.35);
  const cheekA = dir(side * 1.0, 0.25), cheekB = dir(side * 1.25, -0.5);
  const tipDir = new THREE.Vector3(side * 0.4, 1, -0.3).normalize(), tipH = C.hoodTip ?? 0.16;
  // where a direction lands on the cloth; face: its distance from the opening (1 on the edge); lift: off the shell
  const place = (n, face, lift = 0) => {
    const near = sstep(1.0, 1.7, face), az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    const q = ch.bodyPoint(n);
    const folds = near * ((0.4 + 0.6 * sstep(-0.2, 0.4, n.z)) * band(n, crownDir, temple, 0.14, C.hoodFold ?? 0.07) + band(n, cheekA, cheekB, 0.12, 0.7 * (C.hoodFold ?? 0.07)));
    const shoulders = 0.05 * Math.sin(az * 3 + 0.4 * side) * sstep(-0.05, -0.65, n.y) * near;
    const back = Math.max(0, -n.z) * Math.max(0, n.y);
    // uneven cheek clearance: the edge stands off the face more on the wide side, so the lining shows there
    const clear = (1 - near) * (0.035 + 0.03 * side * Math.sin(az)) * sstep(-0.8, -0.1, el - E0 + 0.3);
    const sc = 1.02 + clear + 0.06 * near + (C.hoodCrown ?? 0.08) * sstep(-0.1, 0.8, n.y) * near + folds + shoulders + 0.06 * sstep(-0.55, -0.9, n.y) + lift;
    const p = new THREE.Vector3(q.x * sc, ch.cy + (q.y - ch.cy) * sc + back * back * 0.12, q.z * sc - back * back * 0.05);
    // the crown: a roomy dome well above the head (the egg's point rounded off), off centre, slumping to one side
    const crown = sstep(0.35, 0.95, n.y), dome = sstep(0.05, 0.75, n.y) * (1 - 0.6 * sstep(0.7, 1.0, n.y));
    p.x *= 1 + 0.1 * dome; p.z *= 1 + 0.08 * dome;
    p.y += (C.hoodDome ?? 0.1) * ch.ry * dome; p.x += side * (C.hoodSlump ?? 0.09) * ch.rx * crown; p.z -= 0.05 * ch.rz * crown;
    // a soft point where the cloth gathers above the crown, flopping back and to the slumped side
    // (a broad cone: lifted along the tip direction, and bent over sideways more the nearer the point)
    const u = Math.max(0, 1 - (1 - n.dot(tipDir)) / 0.2), tip = u * u * tipH;
    p.y += tip * ch.ry; p.x += side * (0.3 * tip + 0.7 * tip * u * u) * ch.rx; p.z -= 0.4 * tip * u * ch.rz;
    // the top of the opening hangs forward over the brow, more on the high side of the diagonal edge
    const top = sstep(-0.05, 0.45, el - E0) * (1 - sstep(0.0, 0.8, near)) * sstep(0.6, 1.0, Math.cos(az / AZ * 1.2)) * (1 - 0.35 * side * Math.sin(az));
    p.z += ovh * ch.rz * top; p.y -= 0.08 * ovh * ch.ry * top;
    return p;
  };
  const sheet = (lift, keepFace) => {
    const g = new THREE.SphereGeometry(1, 220, 150, 0, Math.PI * 2, 0, Math.PI * 0.86), P = g.attributes.position, v = new THREE.Vector3();
    const inside = new Uint8Array(P.count), outside = new Uint8Array(P.count);
    for (let i = 0; i < P.count; i++) {
      const n = v.fromBufferAttribute(P, i).clone().normalize();
      let az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
      let face = n.z > 0 ? faceOf(az, el) : 9;
      if (face < 1) {   // inside the opening: pulled out onto its edge, so the cut is a smooth line
        inside[i] = 1; az /= face; el = E0 + (el - E0) / face; face = 1; n.copy(dir(az, el));
      }
      if (face > keepFace) outside[i] = 1;
      const p = place(n, face, lift); P.setXYZ(i, p.x, p.y, p.z);
    }
    const idx = g.index.array, keep = [];
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2];
      if (!(inside[a] && inside[b] && inside[c]) && !(outside[a] && outside[b] && outside[c])) keep.push(a, b, c);
    }
    g.setIndex(keep); g.computeVertexNormals(); return g;
  };
  // the folded hem: an oval section swept round the opening, its width changing round the face, lying on the
  // cloth and rolled a little into the opening
  const N = 220, R = C.hoodRim ?? 0.022, ring = 14, pos = [], index = [], cen = [];
  for (let k = 0; k < N; k++) { const [az, el] = edge((k / N) * Math.PI * 2); cen.push(place(dir(az, el), 1)); }
  const body = new THREE.Vector3(0, ch.cy, 0);
  for (let k = 0; k < N; k++) {
    const th = (k / N) * Math.PI * 2, p = cen[k], T = cen[(k + 1) % N].clone().sub(cen[(k + N - 1) % N]).normalize();
    const Nn = p.clone().sub(body).normalize(), B = new THREE.Vector3().crossVectors(T, Nn).normalize();   // B: across the hem
    const w = R * (1 + 0.45 * Math.sin(2 * th + 0.7) + 0.2 * Math.sin(5 * th + 1.1)), tk = R * 0.45;
    const c = p.clone().addScaledVector(B, -0.3 * w).addScaledVector(Nn, 0.25 * tk);
    for (let r = 0; r < ring; r++) {
      const a = (r / ring) * Math.PI * 2;
      const q = c.clone().addScaledVector(B, Math.cos(a) * w).addScaledVector(Nn, Math.sin(a) * tk);
      pos.push(q.x, q.y, q.z);
    }
  }
  for (let k = 0; k < N; k++) for (let r = 0; r < ring; r++) {
    const a = k * ring + r, b = ((k + 1) % N) * ring + r, c = ((k + 1) % N) * ring + ((r + 1) % ring), d = k * ring + ((r + 1) % ring);
    index.push(a, b, d, b, c, d);
  }
  const hem = new THREE.BufferGeometry(); hem.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); hem.setIndex(index); hem.computeVertexNormals();
  return { shell: sheet(0, 99), hem, lining: sheet(-0.022, 1.45) };
}
// costume.hoodStyle "hoodie" (Jonny, 28 Oct 19:22: "the hoodie still looks super weird", look at real hoodies and at
// animated characters in hoods): built the way a real hooded sweatshirt is, instead of one skin with a hole at the face.
//   - the hood is a roomy bag sewn to a neckline; its opening is a tunnel that stands out in front of the face
//     (hoodStand, m, more at the brow), so the dark inside shows all round the face
//   - a thick, even hem round the opening (hoodRim: its radius, m) closing in a V under the mouth, with two
//     drawstrings hanging from it (hoodStrings false: none)
//   - a centre seam over the crown to the back of the neck, rising to a small soft peak at the back of the crown
//     (hoodTip; hoodSide leans it to one side)
//   - below the hood the sweatshirt: a neckline seam where the hood is sewn on, and a ribbed waistband at the hem
// Returns { shell, hem, lining, seams, strings, tips } geometries in the body group's space.
export function hoodieGeometry(ch, C = {}) {
  const sstep = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  const o = C.hoodOpen ?? 1, AZ = 0.82 * o, EL = 0.55 * (C.hoodOpenH ?? o), E0 = 0.04, side = C.hoodSide ?? 1;
  const stand = C.hoodStand ?? 0.07, chinEl = C.hoodNeck ?? -0.42;   // chinEl: the neckline's height (body elevation)
  const dir = (az, el) => new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  // the opening round the face: a rounded arch over the brow and a V under the mouth
  const edge = (th) => {
    const c = Math.cos(th), sn = Math.sin(th);
    return sn >= 0 ? [AZ * c, E0 + EL * sn * (1 - 0.12 * c * c)] : [AZ * c * (1 + 0.25 * sn), E0 + EL * 1.15 * sn - 0.06 * (1 - Math.abs(c))];
  };
  const faceOf = (az, el) => {
    const th = Math.atan2((el - E0) / EL, az / AZ), [ea, ee] = edge(th);
    return Math.hypot(az, el - E0) / Math.max(1e-4, Math.hypot(ea, ee - E0));
  };
  const body = (n, sc) => { const q = ch.bodyPoint(n); return new THREE.Vector3(q.x * sc, ch.cy + (q.y - ch.cy) * sc, q.z * sc); };
  const fwd = new THREE.Vector3(0, 0, 1);
  // the rim: the opening's outline on the face, lifted forward (most at the brow) and a little outward from the face
  const rim = (th) => {
    const [az, el] = edge(th), p = body(dir(az, el), 1.0), sn = Math.sin(th);
    const out = new THREE.Vector3(p.x, p.y - (ch.cy + E0 * ch.ry), 0).normalize();
    return p.addScaledVector(fwd, stand * (0.55 + 0.45 * Math.max(0, sn)) * (sn < 0 ? 1 + 0.6 * sn : 1)).addScaledVector(out, C.hoodFlare ?? 0.045);
  };
  // the hood bag: roomy above and behind the head, a soft peak on the centre seam at the back of the crown
  const tipDir = new THREE.Vector3(side * 0.12, 0.8, -0.6).normalize(), tipH = C.hoodTip ?? 0.12;
  const bag = (n) => {
    const hood = sstep(Math.sin(chinEl) - 0.02, Math.sin(chinEl) + 0.1, n.y);   // 1 on the hood, 0 on the sweatshirt
    const back = Math.max(0, -n.z);
    const sc = 1.05 + hood * (0.08 + 0.06 * back) + 0.05 * sstep(-0.5, -0.9, n.y);
    const p = body(n, sc);
    p.z -= hood * back * (0.04 + 0.12 * Math.max(0, n.y)) * ch.rz;                           // the bag hangs back off the head
    const u = Math.max(0, 1 - (1 - n.dot(tipDir)) / 0.18), tip = u * u * tipH;
    p.y += tip * ch.ry * 0.7; p.z -= tip * ch.rz * 0.6; p.x += side * tip * ch.rx * 0.3;
    // the hood's weight gathers in broad folds where it meets the shoulders
    const az = Math.atan2(n.x, n.z);
    const neck = Math.exp(-(((n.y - Math.sin(chinEl) - 0.12) / 0.12) ** 2)) * (1 - Math.max(0, n.z));
    const r = 1 + 0.035 * neck * Math.sin(az * 4 + 0.5);
    p.x *= r; p.z *= r;
    return p;
  };
  const place = (n, face) => {
    if (face >= 1.75 || n.z <= 0) return bag(n);
    const th = Math.atan2((Math.asin(Math.max(-1, Math.min(1, n.y))) - E0) / EL, Math.atan2(n.x, n.z) / AZ);
    const k = sstep(1.0, 1.75, face) ** 0.85;
    return rim(th).lerp(bag(n), k);   // the tunnel from the rim back to the bag
  };
  const g = new THREE.SphereGeometry(1, 220, 150, 0, Math.PI * 2, 0, Math.PI * 0.86), P = g.attributes.position, v = new THREE.Vector3();
  const faces = new Float32Array(P.count), inside = new Uint8Array(P.count);
  for (let i = 0; i < P.count; i++) {
    const n = v.fromBufferAttribute(P, i).clone().normalize();
    let az = Math.atan2(n.x, n.z), el = Math.asin(Math.max(-1, Math.min(1, n.y)));
    let face = n.z > 0 ? faceOf(az, el) : 9;
    if (face < 1) { inside[i] = 1; const th = Math.atan2((el - E0) / EL, az / AZ), [ea, ee] = edge(th); n.copy(dir(ea, ee)); face = 1; }
    faces[i] = face; const p = place(n, face); P.setXYZ(i, p.x, p.y, p.z);
  }
  const idx = g.index.array, keep = [], keepIn = [];
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    if (inside[a] && inside[b] && inside[c]) continue;
    keep.push(a, b, c);
    if (Math.min(faces[a], faces[b], faces[c]) < 1.9) keepIn.push(a, b, c);
  }
  g.setIndex(keep); g.computeVertexNormals();
  // the lining: the tunnel's inside, a little in from the shell
  const lining = g.clone(); lining.setIndex(keepIn);
  { const L = lining.attributes.position, N = g.attributes.normal; for (let i = 0; i < L.count; i++) L.setXYZ(i, L.getX(i) - N.getX(i) * 0.014, L.getY(i) - N.getY(i) * 0.014, L.getZ(i) - N.getZ(i) * 0.014); lining.computeVertexNormals(); }
  // the inside of the tunnel: from the rim straight back to where the hood meets the head round the face
  const wall = new THREE.BufferGeometry(), WN = 200, WS = 8, wp = [], wi = [];
  for (let k = 0; k <= WN; k++) {
    const th = (k / WN) * Math.PI * 2, [az, el] = edge(th), a = rim(th), sn = Math.sin(th);
    const b = body(dir(az * 1.04, E0 + (el - E0) * 1.04), 1.0).addScaledVector(fwd, -0.01);
    for (let j = 0; j <= WS; j++) { const t = j / WS, q = a.clone().lerp(b, t); q.addScaledVector(fwd, 0.012 * Math.sin(t * Math.PI) * (sn > 0 ? 1 : 0.5)); wp.push(q.x, q.y, q.z); }
  }
  for (let k = 0; k < WN; k++) for (let j = 0; j < WS; j++) { const a = k * (WS + 1) + j, b = a + WS + 1; wi.push(a, b, a + 1, b, b + 1, a + 1); }
  wall.setAttribute("position", new THREE.Float32BufferAttribute(wp, 3)); wall.setIndex(wi); wall.computeVertexNormals();
  // swept tube helper: points -> a tube of radius r(t)
  const tube = (pts, r, closed = false, segs = 200, radial = 12) => {
    const curve = new THREE.CatmullRomCurve3(pts, closed, "centripetal");
    return new THREE.TubeGeometry(curve, segs, r, radial, closed);
  };
  // the hem round the opening, a thick even roll
  const R = C.hoodRim ?? 0.028, ring = [];
  for (let k = 0; k < 160; k++) ring.push(rim((k / 160) * Math.PI * 2));
  const hem = tube(ring, R, true, 320, 14);
  // seams: the centre seam from the top of the opening over the crown to the back of the neck, and the neckline
  const seamPts = [];
  for (let k = 0; k <= 40; k++) { const el = (Math.PI / 2) * 0.62 + (k / 40) * (Math.PI - (Math.PI / 2) * 0.62 - (Math.PI / 2 + chinEl) + 0.15); const n = new THREE.Vector3(0, Math.sin(el), Math.cos(el)); seamPts.push(bag(n).addScaledVector(n, -0.001)); }
  const neckPts = [];
  for (let k = 0; k <= 60; k++) { const az = 0.55 + (k / 60) * (Math.PI * 2 - 1.1); const n = dir(az, chinEl + 0.03); neckPts.push(bag(n).addScaledVector(n, 0.002)); }
  const band = [];
  const elB = -Math.PI / 2 + Math.PI * 0.14 + 0.06;
  for (let k = 0; k < 96; k++) { const n = dir((k / 96) * Math.PI * 2, elB); band.push(bag(n)); }
  const seams = [tube(seamPts, 0.0045, false, 80, 8), tube(neckPts, 0.013, false, 120, 8), tube(band, 0.022, true, 160, 10)];
  // drawstrings from the two sides of the V, hanging down the front
  const strings = [], tips = [];
  if (C.hoodStrings !== false) for (const sx of [-1, 1]) {
    const a = rim(-Math.PI / 2 + sx * 0.5), len = C.stringLen ?? 0.2, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(a.clone().add(new THREE.Vector3(sx * 0.012 * Math.sin(t * 2.2), -len * t, 0.025 * Math.sin(t * Math.PI * 0.5) + 0.01 * t))); }
    strings.push(tube(pts, 0.0055, false, 40, 8));
    const end = pts[pts.length - 1], tipG = new THREE.CylinderGeometry(0.0075, 0.0075, 0.03, 10); tipG.translate(end.x, end.y - 0.012, end.z); tips.push(tipG);
  }
  return { shell: g, hem, lining, wall, seams, strings, tips };
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
  if (C.hoodStyle === "hoodie") {
    const { shell, hem, lining, wall, seams, strings, tips } = hoodieGeometry(ch, C);
    const inner = new THREE.MeshStandardMaterial({ color: C.lining || "#1a1720", roughness: 0.95, side: THREE.DoubleSide });
    const edge = new THREE.MeshStandardMaterial({ color: C.hoodRimColor || new THREE.Color(C.accent || "#34313a").multiplyScalar(1.3), roughness: 0.9 });
    edge.userData.lookRole = "cloth";
    const cord = new THREE.MeshStandardMaterial({ color: C.stringColor || "#6c6670", roughness: 0.8 }), aglet = new THREE.MeshStandardMaterial({ color: C.agletColor || "#b8b2b8", roughness: 0.5 });
    cloth.userData.lookRole = "cloth"; inner.userData.lookRole = "lining"; cord.userData.lookRole = "cloth";
    const parts = [[shell, cloth], [hem, edge], [lining, inner], [wall, inner], ...seams.map((s) => [s, cloth]), ...strings.map((s) => [s, cord]), ...tips.map((s) => [s, aglet])];
    for (const [geo, m] of parts) { const g = new THREE.Mesh(geo, m); g.castShadow = g.receiveShadow = true; ch.bodyGroup.add(g); }
    const { g, tip } = scythe(C);
    return { hat: null, sitDepth: -0.035, prop: { group: g, tip, charge() {} }, apply() {} };
  }
  if (C.hoodStyle === "cloth") {
    const { shell, hem, lining } = hoodClothGeometry(ch, C);
    if (C.detail) {
      // costume.detail (Jonny's clean-anime sheet, 31 Oct): a cloak under the hood, a robe over the lower body with a
      // darker hem and a cape hanging behind that trails a move
      const robe = new THREE.MeshStandardMaterial({ color: C.accent || "#34313a", roughness: 0.9, side: THREE.DoubleSide }); robe.userData.lookRole = "cloth";
      const r = new THREE.Mesh(lowerShell(ch, -0.62, 1.05), robe); r.castShadow = r.receiveShadow = true; ch.bodyGroup.add(r);
      const hemM = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.accent || "#34313a").multiplyScalar(0.7), roughness: 0.9 }); hemM.userData.lookRole = "cloth";
      ch.bodyGroup.add(ring(ch, -1.1, 0.02, hemM, 0.03));
      const cp = cape(ch, C.accent || "#34313a"); cp.userData.mesh.material.userData.lookRole = "cloth"; ch.bodyGroup.add(cp);
    }
    // explicit look roles (looks.js): outer cloth, the hem catching a little more light, the dark recessed lining
    const edge = new THREE.MeshStandardMaterial({ color: C.hoodRimColor || new THREE.Color(C.accent || "#34313a").multiplyScalar(1.3), roughness: 0.9 });
    const inner = new THREE.MeshStandardMaterial({ color: C.lining || "#1e1b25", roughness: 0.95, side: THREE.DoubleSide });
    cloth.userData.lookRole = edge.userData.lookRole = "cloth"; inner.userData.lookRole = "lining";
    for (const [geo, m] of [[shell, cloth], [hem, edge], [lining, inner]]) { const g = new THREE.Mesh(geo, m); g.castShadow = g.receiveShadow = true; ch.bodyGroup.add(g); }
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
