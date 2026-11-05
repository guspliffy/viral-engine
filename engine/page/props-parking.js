import * as THREE from "three";

// Props for friends-try-to episode 5, "parallel park one car" (4 Nov 2026). The cars themselves are rig models
// (car-hatchback.js), so the cast can sit in them; these are the street pieces they bump into.
//   wheeliebin  a green two-wheeled wheelie bin (its foot centre at the origin, its front, the side with the handle-free
//               face, toward +z; the wheels and the handle at the back, -z). spec.h its height (0.82), spec.color.
//               tip 0..1 tips it over sideways onto its own left side (+x) about its bottom edge, the lid flapping
//               open as it lands (lid 0..1 opens the lid by itself); wobble 0..1 rocks it on its base (a nudge).
//   kerb        a run of kerbstones along x from spec.x0 to spec.x1, its street face at z (the stones run back to
//               z - d), spec.h tall (0.12): pale granite blocks of uneven length with dark joints, a darker gutter
//               strip of setts in front. spec.seed varies the joints. spec.slope (degrees) tilts the run down toward +x
//               about the prop's origin and spec.lift raises it, like the street (place it at x 0).
//   street      the cobbled street: a spec.w x spec.d plane of granite setts in rows (warm grey with an evening glow,
//               dark joints), centred on the prop, tilted spec.slope degrees down toward +x about the prop's origin and
//               raised spec.lift (so it stays above the set's flat floor). A sloping street gives a parked car a reason to roll.
//   flagway     the pavement behind the kerb: big pale flagstones (spec.w x spec.d, its front edge at the prop's z,
//               running back to z - d), spec.h above the street, the same slope and lift as the street.
export const PARKING_GRIPS = {};
// the street's height at x (for the cast and the cars standing on it)
export const streetY = (x, slope = 0, lift = 0) => lift - x * Math.tan((slope * Math.PI) / 180);

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const clamp = (x) => Math.min(1, Math.max(0, x));
// a group under the prop's root, tilted down toward +x by spec.slope degrees and raised spec.lift
function tilted(P) { const g = new THREE.Group(); g.rotation.z = -((P.spec.slope ?? 0) * Math.PI) / 180; g.position.y = P.spec.lift ?? 0; P.whole.add(g); return g; }
// granite setts in rows across the street (the rows run along x), warm grey with an evening glow on their tops
function settTex(seed, [R, G, B]) {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), r = rnd(seed);
  g.fillStyle = "#5c5254"; g.fillRect(0, 0, S, S);
  const rowH = S / 14;
  for (let row = 0; row < 14; row++) {
    let x = -r() * 60;
    while (x < S) {
      const w = 70 + r() * 40, v = 0.86 + r() * 0.24, y0 = row * rowH + 3 + (r() - 0.5) * 3;
      const k = (q) => Math.round(Math.min(255, q * v));
      g.fillStyle = `rgb(${k(R)},${k(G)},${k(B)})`;
      const rr = 10 + r() * 6; g.beginPath(); g.roundRect(x + 3, y0, w - 6, rowH - 6, rr); g.fill();
      g.fillStyle = `rgba(255,205,150,${0.1 + r() * 0.12})`; g.beginPath(); g.roundRect(x + 9, y0 + 5, w - 22, rowH * 0.42, rr * 0.7); g.fill();
      g.fillStyle = `rgba(40,30,45,${0.12 + r() * 0.08})`; g.beginPath(); g.roundRect(x + 6, y0 + rowH * 0.62, w - 12, rowH * 0.24, rr * 0.5); g.fill();
      x += w;
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
// big pale flagstones in staggered rows, matching the painted pavement
function flagTex(seed) {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S; const g = c.getContext("2d"), r = rnd(seed);
  g.fillStyle = "#8f8476"; g.fillRect(0, 0, S, S);
  const rows = 4, rowH = S / rows;
  for (let row = 0; row < rows; row++) {
    let x = -r() * 200;
    while (x < S) {
      const w = 220 + r() * 160, v = 0.9 + r() * 0.14, k = (q) => Math.round(Math.min(255, q * v));
      g.fillStyle = `rgb(${k(222)},${k(210)},${k(194)})`; g.fillRect(x + 4, row * rowH + 4, w - 8, rowH - 8);
      g.fillStyle = `rgba(150,130,110,${0.08 + r() * 0.08})`; g.fillRect(x + 4 + r() * w * 0.5, row * rowH + 10 + r() * rowH * 0.5, w * 0.3, rowH * 0.25);
      x += w;
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}
function rnd(seed) { let s = Math.floor(seed * 9973) + 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
// a box with rounded edges (a superellipsoid)
function pad(w, h, d, n = 6) {
  const g = new THREE.SphereGeometry(1, 28, 18), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}

export const PARKING_KINDS = {
  wheeliebin(P) {
    const S = P.spec, H = S.h ?? 0.82, W = H * 0.62, D = H * 0.74;
    const green = mat(S.color || "#3f6b45", { roughness: 0.55 }), dark = mat("#26372a", { roughness: 0.6 }), tyre = mat("#202024", { roughness: 0.9 });
    // the pivot: its left bottom edge (+x), so tip rolls it over onto that side
    const pivot = new THREE.Group(); pivot.position.set(W / 2, 0, 0); P.whole.add(pivot);
    const bin = new THREE.Group(); bin.position.set(-W / 2, 0, 0); pivot.add(bin);
    // the body: a tapered tub, a little narrower at the foot
    const geo = pad(W, H * 0.9, D, 7), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), k = 0.88 + 0.12 * ((y / (H * 0.9)) + 0.5); pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
    geo.computeVertexNormals();
    mesh(geo, green, bin, 0, H * 0.45 + 0.03, 0);
    // a rim under the lid, the lid on a hinge at the back, a moulded front panel line
    mesh(pad(W * 1.06, 0.05, D * 1.06, 6), dark, bin, 0, H * 0.9, 0);
    const hinge = new THREE.Group(); hinge.position.set(0, H * 0.92, -D * 0.53); bin.add(hinge);
    const lid = mesh(pad(W * 1.1, 0.05, D * 1.12, 6), green, hinge, 0, 0.02, D * 0.55);
    mesh(pad(W * 0.5, 0.025, 0.04, 4), dark, lid, 0, 0.0, D * 0.56);   // the lid's front lip
    mesh(new THREE.BoxGeometry(W * 0.7, 0.02, 0.01), dark, bin, 0, H * 0.62, D * 0.47).castShadow = false;
    // the handle bar and the two wheels at the back
    const bar = mesh(new THREE.CylinderGeometry(0.018, 0.018, W * 0.8, 10), dark, bin, 0, H * 0.86, -D * 0.6); bar.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const w = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 18), tyre, bin, s * W * 0.36, 0.075, -D * 0.45); w.rotation.z = Math.PI / 2; }
    return {
      grip: H * 0.86,
      apply(ps, t) {
        const tip = clamp(ps.tip ?? 0), wob = clamp(ps.wobble ?? 0);
        // it goes over slowly, then falls fast, and bounces a little where it lands
        const e = tip < 0.75 ? 0.35 * (tip / 0.75) ** 2 : 0.35 + 0.65 * ((tip - 0.75) / 0.25) ** 1.6;
        const land = tip >= 1 ? 0 : 0;
        pivot.rotation.z = -(Math.PI / 2) * Math.min(1, e) + land;
        pivot.rotation.x = wob * 0.08 * Math.sin((t ?? 0) * 26);
        hinge.rotation.x = -1.9 * clamp(Math.max(ps.lid ?? 0, (tip - 0.85) / 0.15));
      },
    };
  },
  street(P) {
    const S = P.spec, w = S.w ?? 18, d = S.d ?? 12, g = tilted(P);
    const tex = settTex(S.seed ?? 3, S.color || [156, 146, 144]); tex.repeat.set(w / 1.8, d / 1.8);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 }); m.userData.lookRole = "set";
    const f = mesh(new THREE.PlaneGeometry(w, d), m, g, 0, 0, 0); f.rotation.x = -Math.PI / 2; f.castShadow = false;
    return { grip: 0 };
  },
  flagway(P) {
    const S = P.spec, w = S.w ?? 18, d = S.d ?? 3, h = S.h ?? 0.12, g = tilted(P);
    const tex = flagTex(S.seed ?? 5); tex.repeat.set(w / 3.2, d / 3.2);
    const top = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }); top.userData.lookRole = "set";
    const side = mat("#b8ad9e", { roughness: 0.9 });
    const slab = mesh(new THREE.BoxGeometry(w, h, d), [side, side, top, side, side, side], g, 0, h / 2, -d / 2); slab.castShadow = false;
    return { grip: h };
  },
  kerb(P) {
    const S = P.spec, x0 = S.x0 ?? -6, x1 = S.x1 ?? 6, h = S.h ?? 0.12, d = S.d ?? 0.26, r = rnd(S.seed ?? 3);
    const grp = tilted(P); const P0 = P; P = { ...P0, whole: grp };
    const stone = (k) => mat(["#cfc6b8", "#c6bcae", "#d7cfc2", "#bfb6a9"][k % 4], { roughness: 0.85 });
    const mats = [0, 1, 2, 3].map(stone), joint = mat("#6c6258", { roughness: 0.9 }), sett = mat(S.gutter || "#8f8579", { roughness: 0.9 });
    // the stones sit with their street face at local z 0 (the prop's z), back to -d
    for (let x = x0; x < x1 - 0.05;) {
      const len = Math.min(x1 - x, 0.55 + r() * 0.5), k = Math.floor(r() * 4);
      const s = mesh(pad(len - 0.025, h * 2, d, 8), mats[k], P.whole, x + len / 2, 0, -d / 2);
      s.scale.y = 1; s.position.y = 0;   // half below the ground: the top edge is rounded, the bottom hidden
      x += len;
    }
    mesh(new THREE.BoxGeometry(x1 - x0, 0.004, d * 0.9), joint, P.whole, (x0 + x1) / 2, h * 0.02, -d / 2).castShadow = false;
    // the gutter: a strip of small dark setts in front of the kerb
    for (let x = x0; x < x1 - 0.1; x += 0.2) for (const z of [0.09, 0.27]) {
      const st = mesh(pad(0.17, 0.03, 0.15, 6), sett, P.whole, x + 0.1 + (z > 0.1 ? 0.1 : 0) * (r() > 0.5 ? 0 : 1) * 0, 0.004, z); st.castShadow = false;
    }
    return { grip: h };
  },
};
