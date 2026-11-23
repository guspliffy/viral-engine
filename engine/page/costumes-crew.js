import * as THREE from "three";

// Mash's worker headset (Kid vs Dad 02 "We have food at home", panels 12 and 14; storyboards/series/kid-vs-dad/02-food-at-home/DESIGN.md
// section 3). A costume piece of the `mash` type (costumes-everyday.js calls headset(ch, C)); metres, deterministic, nothing moves with the face.
//
// USAGE (character file costume keys; every key opt-in, without `headset` the costume draws exactly as before):
//   headset  true | "#hex"  the headset's shell colour (default "#2b2d33"); true turns it on
//   phones   false          drops Mash's blue neck headphones (the headset replaces them); read in costumes-everyday.js
//   characters/potatobrawl/mash-crew.json has both.
//
// Built by shares of the body (Hh = its own height, 1.24 on Mash), so a different body scales it:
//   ear cups   both sides, a disc r 0.060 x 0.035 thick (shell "#2b2d33", pad ring "#3b3d44" on the inside face), centre 0.64 Hh above the
//              underside (0.79 on Mash), on the side of the body (theta +-90 degrees), its inner face 0.012 off the skin
//   band       "#2b2d33", 0.018 wide, 0.008 thick, 0.006 off the skin, from cup to cup over the crown, a touch behind the middle (the paper cap
//              hides it above 1.10 above the underside)
//   boom       a tube r 0.006 "#2b2d33" from the bottom front of his RIGHT cup (the -x side, the viewer's left) round the cheek, 0.02 off the skin
//   mic end    a foam ball r 0.016 "#1d1e22", centre 0.08 to his right of the face's middle line, ON the mouth line (the design said 0.02 below it
//              and 0.02 off the skin: there Mash's hood cowl covers it, bench 22 Nov), 0.04 off the skin: just outside the mouth corner, never in
//              front of the lips. costume.headsetMic { dx 0.08, dy 0, lift 0.04 } overrides
// The build prints nothing; ch.headsetInfo = { cupY, micAt: Vector3, mouthY } is left on the character for a bench to read.

const PI = Math.PI, V = (x, y, z) => new THREE.Vector3(x, y, z);
const mat = (c, o = {}) => { const m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...o }); m.userData.lookRole = "cloth"; return m; };
const mesh = (g, m) => { const o = new THREE.Mesh(g, m); o.castShadow = o.receiveShadow = true; return o; };
// the elevation at which the surface (meridian th) is y metres up
function phAtY(surf, th, y, lo = -1.45, hi = 1.55) { let a = lo, b = hi; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (surf(th, m).pos.y < y) a = m; else b = m; } return (a + b) / 2; }

// a rectangular bar swept along points P (outward normals N): w across (along T x N), t thick (along N), four flat sides
function bar(P, N, w, t) {
  const pos = [], idx = [], n = P.length - 1, corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let c = 0; c < 4; c++) {
    const [a0, b0] = corners[c], [a1, b1] = corners[(c + 1) % 4], base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const T = P[Math.min(n, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize(), B = new THREE.Vector3().crossVectors(T, N[i]).normalize();
      for (const [a, b] of [[a0, b0], [a1, b1]]) { const q = P[i].clone().addScaledVector(B, (a * w) / 2).addScaledVector(N[i], (b * t) / 2); pos.push(q.x, q.y, q.z); }
    }
    for (let i = 0; i < n; i++) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function headset(ch, C) {
  const parts = ch.potatoParts, Hh = ch.ry * 2, base = ch.cy - ch.ry, surf = (th, ph) => ch.surf(th, ph);
  const col = typeof C.headset === "string" ? C.headset : "#2b2d33", shellM = mat(col), padM = mat("#3b3d44", { roughness: 0.85 }), micM = mat("#1d1e22", { roughness: 0.95 });
  const R = 0.06, cupY = base + 0.64 * Hh, off = 0.012, TH = 0.035;
  // ---- the two ear cups, a disc facing out from the side of the head
  for (const s of [-1, 1]) {
    const th = s * (PI / 2), q = surf(th, phAtY(surf, th, cupY)), cup = new THREE.Group();
    const shell = mesh(new THREE.CylinderGeometry(R, R * 0.95, TH, 32), shellM); cup.add(shell);
    const pad = mesh(new THREE.TorusGeometry(R - 0.0095, 0.0085, 10, 32), padM); pad.rotation.x = PI / 2; pad.position.y = -TH / 2 + 0.0085; cup.add(pad);   // the cushion ring on the face toward the head
    const nrm = q.normal.clone(); cup.quaternion.setFromUnitVectors(V(0, 1, 0), nrm);
    cup.position.copy(q.pos).addScaledVector(nrm, off + TH / 2);
    parts.add(cup);
  }
  // ---- the band: over the crown in a plane a touch behind the head's middle, 0.006 off the skin (centre 0.006 + 0.004)
  {
    const e0 = (th) => { const q = surf(th, phAtY(surf, th, cupY)); return Math.atan2(q.pos.y - ch.cy, Math.abs(q.pos.x)); };
    const eA = Math.min(e0(PI / 2), e0(-PI / 2)) + 0.05, eB = PI - eA, n = 80, zb = -0.1, P = [], N = [];
    const dirAt = (e) => V(Math.cos(e), Math.sin(e), zb).normalize();
    for (let i = 0; i <= n; i++) {
      const d = dirAt(eA + (eB - eA) * (i / n)), p = ch.bodyPoint(d.clone());
      const e = 0.002, d2 = d.clone().add(V(0, 0, e)).normalize(), t2 = ch.bodyPoint(d2).sub(p);   // a small step along z: the second tangent
      const dn = dirAt(eA + (eB - eA) * (i / n) + 0.002), t1 = ch.bodyPoint(dn).sub(p);
      let nn = new THREE.Vector3().crossVectors(t1, t2).normalize(); if (nn.dot(p.clone().sub(V(0, ch.cy, 0))) < 0) nn.negate();
      P.push(p.clone().addScaledVector(nn, 0.006 + 0.004)); N.push(nn);
    }
    parts.add(mesh(bar(P, N, 0.018, 0.008), shellM));
  }
  // ---- the boom and the mic end on his right (-x)
  {
    const place = ch.face?.place ? ch.face.place(0, ch.face.layout.mouthV).pos : V(0, base + 0.45 * Hh, ch.ry);
    const mouthY = place.y, faceX = place.x, M = C.headsetMic || {}, micY = mouthY + (M.dy ?? 0), micX = faceX - (M.dx ?? 0.08), micLift = M.lift ?? 0.04;
    let a = -1.4, b = -0.05; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (surf(m, phAtY(surf, m, micY)).pos.x < micX) a = m; else b = m; }   // theta of the mic's meridian (x grows with theta)
    const thM = (a + b) / 2, along = (th, y, lift) => { const q = surf(th, phAtY(surf, th, y)); return q.pos.clone().addScaledVector(q.normal, lift); };
    const pts = [along(-1.4, cupY - 0.045, 0.034), along(-1.22, base + 0.60 * Hh, 0.026), along(-0.98, base + 0.505 * Hh, 0.022), along((-0.98 + thM) / 2, micY + 0.014, 0.5 * (0.02 + micLift)), along(thM, micY, micLift)];
    parts.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 48, 0.006, 8, false), shellM));
    const mic = mesh(new THREE.SphereGeometry(0.016, 16, 12), micM); mic.position.copy(pts[pts.length - 1]); parts.add(mic);
    ch.headsetInfo = { cupY, micAt: mic.position.clone(), mouthY, faceX };
  }
}
