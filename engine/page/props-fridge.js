import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, basic, mesh } from "./props-trend.js";

// Kid vs Dad 02 "food at home" (design: storyboards/series/kid-vs-dad/02-food-at-home/DESIGN.md section 5, panels 08 and 09).
// Metres before spec.scale. Deterministic: every grain and wart is placed once from a seeded rng; every animation is a pure
// function of the prop's tween keys; no material opacity is ever tweened (all see-through parts have a FIXED opacity, the
// door and the floor patch change by turn and visibility only).
//
//   openfridge   the fridge that replaces the stock one (set kitchen, switch `fridge: false`). Place it at x -3.0, y 0, z -1.90,
//                rot 0 (the stock fridge's place). Own frame: front +z, origin the floor under its middle; body 0.90 wide x
//                2.00 high x 0.69 deep (z -0.375 .. +0.315), `#e9e6dc`, a drawer front with a bar handle (y 0.05..0.45) under
//                the cavity. The door is 0.86 x 1.48 (y 0.48..1.96), 0.06 thick, hinged on the +x edge, opening toward +z;
//                its outside carries the vertical bar handle (r 0.014, y 0.55..1.15, 0.05 proud, 0.09 from the free edge:
//                shut it is at x -0.34, z +0.425: a rest pin for a glove goes at (-0.34, 0.75, 0.43) in the fridge frame) and
//                the kit's blank yellow note (0.16 square at x 0.12, y 1.55). The cavity is 0.80 x 1.42 (x -0.40..+0.40,
//                y 0.50..1.92, 0.62 deep): exactly a 9:16 frame. It is self-lit (unlit materials, so the toon look cannot
//                darken it): back `#eaf4fa`, sides `#d7e6f0`, ceiling `#e2eef6`, floor `#d2e1ec`, corner lines `#b9cbd9`,
//                3 shelves (tops y 0.86, 1.20, 1.56; bare but the middle one) and a white light bar under the ceiling at the
//                front. On the middle shelf: a pickle (centre x -0.19, 0.23 long x 0.09 thick, `#4c8a2c`, 14 warts) and a
//                bowl of old rice under cling film (centre x +0.17, rim r 0.135, 0.105 tall).
//     open 0..1  0 shut, 1 = 105 degrees (tween it; default spec.open or 0). A pale floor patch (`#bfe6ff`, fixed opacity
//                0.30, 0.9 x 0.7 in front of the cavity) shows while open > 0.05.
//     lit 0..1   the cavity colours and the real light (`#dff2ff` at (0, 1.80, 0.10), range 3.2): 0 = 25 % colours and no
//                light. The engine's default for `lit` is 0, so give `lit: 1` in the spec (or tween it) when the door opens.
//                Flicker is the director's: lit 1, 0 for two frames, 1 ...
//     spec.bright (default 0.7) scales the cavity colours at lit 1 (the unlit cavity colours blow out under the night kitchen's warm
//                grade at 1.0); the food has its own glow, scaled with lit the same way.
//   Not held, not solid for hands (the fridge is a set piece): Chip's glove rests on the handle by a rest pin.
//   Cling film: the see-through disc is DROPPED (the design allows it): the 4 white streaks (opaque, on the mound) and the crinkled
//   skirt with its 16 folds and 2 loose corners carry it. Counter mask: the kitchen set's counter runs behind the stock fridge's place
//   and would show through the cavity, so the inside is drawn first and a depth-only mask over the opening hides it.
export const FRIDGE = { w: 0.9, h: 2.0, z0: -0.375, z1: 0.315, cav: { x: 0.4, y0: 0.5, y1: 1.92, d: 0.62 }, shelves: [0.86, 1.2, 1.56],
  pickle: [-0.19, 1.245, 0.1], bowl: [0.17, 1.2, 0.06], handleRest: [-0.34, 0.75, 0.43] };

const CAV = { back: "#eaf4fa", side: "#d7e6f0", ceil: "#e2eef6", floor: "#d2e1ec", line: "#b9cbd9", plate: "#f4f9fc", rail: "#cddbe6" };
const rad = (d) => (d * Math.PI) / 180;

export const FRIDGE_KINDS = {
  openfridge(P) {
    const W = FRIDGE.w, Z0 = FRIDGE.z0, Z1 = FRIDGE.z1, C = FRIDGE.cav, DEPTH = Z1 - Z0;
    const body = mat("#e9e6dc", { roughness: 0.35 }), shade = mat("#cfcabb", { roughness: 0.4 }), steel = mat("#9aa0a8", { roughness: 0.3, metalness: 0.5 });
    const box = (w, h, d, m, x, y, z, parent = P.whole) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);

    // ---- the body: shell round the cavity (open at the front), drawer front under it
    const cz = Z1 - C.d / 2;                                        // the cavity's middle z
    const sideW = (W - 2 * C.x) / 2;
    for (const s of [-1, 1]) {
      box(sideW, 2.0, DEPTH, body, s * (C.x + sideW / 2), 1.0, (Z0 + Z1) / 2);
      // a slightly darker strip down the outer edge of the front face (the rounded corner, drawn)
      box(0.03, 2.0, 0.004, shade, s * (W / 2 - 0.015), 1.0, Z1 + 0.0021);
    }
    box(2 * C.x, 2.0 - C.y1, DEPTH, body, 0, (C.y1 + 2.0) / 2, (Z0 + Z1) / 2);                     // top
    box(2 * C.x, C.y0, DEPTH, body, 0, C.y0 / 2, (Z0 + Z1) / 2);                                    // drawer block
    box(2 * C.x, C.y1 - C.y0, Z1 - C.d - Z0, body, 0, (C.y0 + C.y1) / 2, (Z0 + Z1 - C.d) / 2);              // the back wall behind the cavity
    // the drawer front y 0.05..0.45 and its bar handle (0.40 long, #9aa0a8)
    box(0.8, 0.4, 0.012, shade, 0, 0.25, Z1 + 0.006);
    const dh = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 10), steel, P.whole, 0, 0.41, Z1 + 0.03); dh.rotation.z = Math.PI / 2;
    for (const s of [-0.17, 0.17]) { const st = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 8), steel, P.whole, s, 0.41, Z1 + 0.018); st.rotation.x = Math.PI / 2; }
    // the gap between drawer and cavity floor (a dark line), and the feet
    box(0.8, 0.012, 0.004, mat("#9d988a"), 0, 0.5, Z1 + 0.0021);

    // ---- the cavity (self-lit: unlit materials scaled by `lit`)
    const cav = new THREE.Group(); P.whole.add(cav);   // everything inside: drawn first (see the mask below)
    const lampMats = [], glowMats = [];   // glowMats: the food's own glow (the cavity light is on it, the toon look ignores the real light)
    const glow = (m, e) => { m.emissive = m.color.clone(); m.emissiveIntensity = e; glowMats.push([m, e]); return m; };
    const unlit = (hex, o = {}) => { const m = basic({ color: hex, ...o }); lampMats.push([m, new THREE.Color(hex)]); return m; };
    const plane = (w, h, m, x, y, z, ry = 0, rx = 0) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); cav.add(p); return p; };
    const CY = (C.y0 + C.y1) / 2, CH = C.y1 - C.y0, zb = Z1 - C.d;
    plane(2 * C.x, CH, unlit(CAV.back), 0, CY, zb);                                                  // back, faces +z
    plane(C.d, CH, unlit(CAV.side), -C.x, CY, cz, Math.PI / 2);                                      // left side faces +x
    plane(C.d, CH, unlit(CAV.side), C.x, CY, cz, -Math.PI / 2);                                      // right side faces -x
    plane(2 * C.x, C.d, unlit(CAV.ceil), 0, C.y1, cz, 0, Math.PI / 2);                               // ceiling faces down
    plane(2 * C.x, C.d, unlit(CAV.floor), 0, C.y0, cz, 0, -Math.PI / 2);                             // floor faces up
    // corner lines 0.006
    const line = (w, h, d, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), unlit(CAV.line)); b.position.set(x, y, z); cav.add(b); };
    for (const s of [-1, 1]) {
      line(0.006, CH, 0.006, s * (C.x - 0.003), CY, zb + 0.003);                                      // the back's vertical corners
      for (const y of [C.y0 + 0.003, C.y1 - 0.003]) line(0.006, 0.006, C.d, s * (C.x - 0.003), y, cz);   // side/floor and side/ceiling
    }
    for (const y of [C.y0 + 0.003, C.y1 - 0.003]) line(2 * C.x, 0.006, 0.006, 0, y, zb + 0.003);       // back/floor and back/ceiling

    // shelves: a plate 0.008 thick, 9 rail lines, a white front lip 0.022 tall
    const SD = C.d - 0.02, sz = zb + SD / 2 + 0.005;
    for (const top of FRIDGE.shelves) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(2 * C.x - 0.004, 0.008, SD), unlit(CAV.plate)); m.position.set(0, top - 0.004, sz); cav.add(m);
      for (let i = 0; i < 9; i++) { const rl = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.0012, SD - 0.02), unlit(CAV.rail)); rl.position.set(-0.36 + i * 0.09, top + 0.0006, sz); cav.add(rl); }
      const under = new THREE.Mesh(new THREE.BoxGeometry(2 * C.x - 0.004, 0.012, 0.006), unlit("#b4c6d4")); under.position.set(0, top - 0.014, zb + SD + 0.005 - 0.003); cav.add(under);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(2 * C.x - 0.004, 0.022, 0.006), unlit("#ffffff")); lip.position.set(0, top + 0.007, zb + SD + 0.005 - 0.003); cav.add(lip);
    }
    // the light bar under the ceiling at the front (0.36 x 0.035 x 0.10), and the real light
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.035, 0.1), basic({ color: "#ffffff" })); bar.position.set(0, C.y1 - 0.0175, Z1 - 0.055); cav.add(bar);
    const lamp = new THREE.PointLight("#dff2ff", 0, 3.2, 1.4); lamp.position.set(0, 1.8, 0.1); cav.add(lamp);
    // a pale floor patch in front of the open door
    const patch = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), basic({ color: "#bfe6ff", transparent: true, opacity: 0.3, depthWrite: false }));
    patch.rotation.x = -Math.PI / 2; patch.position.set(0, 0.004, Z1 + 0.04 + 0.35); patch.renderOrder = 2; patch.visible = false; P.whole.add(patch);

    // ---- the pickle (lying along x, turned 12 degrees)
    const rnd = rng(7), skin = glow(mat("#4c8a2c", { roughness: 0.5 }), 0.35), wart = glow(mat("#7cb64a", { roughness: 0.6 }), 0.4); wart.userData.noOutline = true;
    const pk = new THREE.Group(); pk.position.set(...FRIDGE.pickle); pk.rotation.y = rad(12); cav.add(pk);
    const pb = mesh(new THREE.CapsuleGeometry(0.045, 0.14, 6, 16), skin, pk); pb.rotation.z = Math.PI / 2; pb.castShadow = false;
    for (let i = 0; i < 14; i++) {
      const u = -0.095 + 0.19 * ((i + 0.5 + (rnd() - 0.5) * 0.6) / 14), ang = (i * 2.399 + rnd() * 0.8) % (Math.PI * 2);   // along x; angle round the axis (golden-angle spread)
      const rr = 0.045 * Math.sqrt(Math.max(0.2, 1 - Math.pow(Math.max(0, Math.abs(u) - 0.07) / 0.045, 2)));                     // the capsule's radius at u
      const w = mesh(new THREE.SphereGeometry(0.0085, 8, 6), wart, pk, u, Math.sin(ang) * rr, Math.cos(ang) * rr); w.scale.set(1, 0.7, 1); w.castShadow = false;
    }

    // ---- the rice bowl: white lathe, a shade foot ring, a rice mound, cling film, skirt
    const BX = FRIDGE.bowl, bowl = new THREE.Group(); bowl.position.set(...BX); cav.add(bowl);
    const china = glow(mat("#f4f1ea", { roughness: 0.35, side: THREE.DoubleSide }), 0.55), foot = glow(mat("#d9d6cc", { roughness: 0.4 }), 0.45);
    const prof = [[0.001, 0.004], [0.06, 0.004], [0.062, 0.014], [0.09, 0.034], [0.118, 0.07], [0.135, 0.105], [0.128, 0.105], [0.11, 0.07], [0.08, 0.036], [0.001, 0.03]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 36), china, bowl).castShadow = false;
    mesh(new THREE.CylinderGeometry(0.06, 0.063, 0.01, 24), foot, bowl, 0, 0.005, 0).castShadow = false;
    const rim = mesh(new THREE.TorusGeometry(0.1315, 0.0035, 6, 36), china, bowl, 0, 0.105, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    const moundH = 0.025, rm = glow(mat("#e7dfc6", { roughness: 0.8 }), 0.6);
    const mound = mesh(new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), rm, bowl, 0, 0.105, 0); mound.scale.set(0.128, moundH, 0.128); mound.castShadow = false;
    const surf = (r) => 0.105 + moundH * Math.sqrt(Math.max(0, 1 - (r / 0.128) ** 2));                 // the mound's height at radius r
    const g1 = glow(mat("#cfc6a8", { roughness: 0.9 }), 0.5), g2 = glow(mat("#f6f1df", { roughness: 0.9 }), 0.6), g3 = glow(mat("#b9a877", { roughness: 0.9 }), 0.4);
    for (const m of [g1, g2, g3]) m.userData.noOutline = true;
    for (let i = 0; i < 60; i++) {
      const r = 0.118 * Math.sqrt((i + 0.5) / 60), a = i * 2.399 + rnd() * 0.5, x = Math.cos(a) * r, z = Math.sin(a) * r;
      const gr = mesh(new THREE.BoxGeometry(0.012, 0.0035, 0.0035), i % 2 ? g1 : g2, bowl, x, surf(r) + 0.0012, z); gr.rotation.y = rnd() * Math.PI; gr.castShadow = false;
    }
    for (let i = 0; i < 5; i++) { const a = 0.5 + i * 1.25 + rnd() * 0.3, r = 0.116 + rnd() * 0.008; const gr = mesh(new THREE.BoxGeometry(0.014, 0.004, 0.0045), g3, bowl, Math.cos(a) * r, surf(r) + 0.0015, Math.sin(a) * r); gr.rotation.y = a + 1.2; gr.castShadow = false; }
    // cling film: a dome 0.004 over the mound at fixed opacity 0.25, 4 white streaks, a crinkled solid skirt, 2 loose corners
    // (the see-through disc is dropped, as the design allows: a transparent part inside the cavity cannot be both hidden by the door
    // and visible through the opening once the counter mask is on. The streaks, drawn opaque, and the skirt carry the film.)
    const streakM = basic({ color: "#f8fcff" });
    [[-0.04, 0.03, 0.11, 0.5], [0.03, -0.045, 0.08, -0.9], [0.065, 0.045, 0.06, 1.3], [-0.07, -0.02, 0.05, 0.1]].forEach(([x, z, len, ry]) => {
      const r = Math.hypot(x, z), s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.001, 0.006), streakM); s.rotation.set(0, ry, 0); s.position.set(x, surf(Math.min(r + len * 0.2, 0.125)) + 0.0035, z); bowl.add(s);
    });
    const skirtG = new THREE.CylinderGeometry(1, 1, 0.035, 64, 2, true), sp = skirtG.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < sp.count; i++) {
      v.fromBufferAttribute(sp, i); const a = Math.atan2(v.z, v.x), yy = (v.y + 0.0175) / 0.035;   // yy 0 at the bottom, 1 at the rim
      const base = 0.118 + 0.017 * yy + 0.004 + 0.0045 * Math.sin(a * 16) * (1 - 0.5 * yy);          // bowl wall radius there + 0.004 + 16 folds
      sp.setXYZ(i, Math.cos(a) * base, v.y, Math.sin(a) * base);
    }
    skirtG.computeVertexNormals();
    const skirt = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.01), glow(mat("#eef6fb", { roughness: 0.5, side: THREE.DoubleSide }), 0.55), bowl); skirt.geometry.dispose(); skirt.geometry = skirtG; skirt.position.y = 0.0875; skirt.castShadow = false;
    for (const a of [0.9, 3.9]) { const c = mesh(new THREE.ConeGeometry(0.012, 0.03, 3), skirt.material, bowl, Math.cos(a) * 0.145, 0.074, Math.sin(a) * 0.145); c.rotation.set(0, -a, -Math.PI / 2 + 0.5); c.castShadow = false; }

    // The kitchen set's counter runs behind the stock fridge's place and pokes through the cavity (its top slab at y 0.86..0.95, its
    // cabinets below). So the inside is drawn FIRST (opaque parts at renderOrder -20), then a depth-only mask over the opening
    // (-19) puts the opening's depth in front of everything behind it: the counter fails against it. See-through parts (the film)
    // skip the depth test instead (a film over the rice only), drawn after the opaque pass.
    cav.traverse((o) => { if (!o.isMesh) return; if (o.material.transparent) { o.material.depthTest = false; o.renderOrder = 3 + (o.renderOrder || 0); } else o.renderOrder = -20; });
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(2 * C.x, C.y1 - C.y0), new THREE.MeshBasicMaterial({ colorWrite: false, depthFunc: THREE.AlwaysDepth })); mask.material.userData.noOutline = true;
    mask.position.set(0, CY, Z1 + 0.008); mask.renderOrder = -19; P.whole.add(mask);

    // ---- the door: its own group on the hinge (x +0.43, z at the door's middle), the free edge swings toward +z
    const HX = 0.43, DW = 0.86, DH = 1.48, DT = 0.06, HZ = Z1 + DT / 2;
    const door = new THREE.Group(); door.position.set(HX, 0, HZ); P.whole.add(door);
    const dx = -DW / 2;                                              // the door's middle, relative to the hinge
    box(DW, DH, DT, body, dx, 0.48 + DH / 2, 0, door);
    box(DW - 0.02, DH - 0.02, 0.004, mat("#dcd8cc", { roughness: 0.5 }), dx, 0.48 + DH / 2, -DT / 2 - 0.0021, door);   // the inside liner (faces -z when shut)
    // the bar handle on the outside: r 0.014, y 0.55..1.15, 0.05 proud, 0.09 from the free edge
    const hx = -DW + 0.09, hbar = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 12), steel, door, hx, 0.85, DT / 2 + 0.05); hbar.name = "fridge-handle";
    for (const y of [0.58, 1.12]) { const st = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 8), steel, door, hx, y, DT / 2 + 0.025); st.rotation.x = Math.PI / 2; }
    // the kit's blank yellow note, 0.16 square at (x 0.12, y 1.55) of the fridge: the door's middle is at x 0
    const note = box(0.16, 0.16, 0.002, mat("#ffe27a", { roughness: 0.9 }), 0.12 - HX, 1.55, DT / 2 + 0.0011, door); note.rotation.z = rad(-3); note.userData.noOutline = true; note.material.userData.noOutline = true;

    return {
      grip: 0, anchors: { handle: (() => { const o = new THREE.Object3D(); o.position.set(hx, 0.75, DT / 2 + 0.05); door.add(o); return o; })() },
      apply(ps) {
        const open = clamp(ps.open ?? P.spec.open ?? 0), lit = clamp(ps.lit ?? P.spec.lit ?? 0), k = (P.spec.bright ?? 0.7) * (0.25 + 0.75 * lit);
        door.rotation.y = rad(105) * open;
        patch.visible = open > 0.05;
        for (const [m, c0] of lampMats) m.color.copy(c0).multiplyScalar(k);
        for (const [m, e] of glowMats) m.emissiveIntensity = e * (0.25 + 0.75 * lit);
        lamp.intensity = (P.spec.lamp ?? 1.6) * lit; lamp.visible = lit > 0.001;
      },
    };
  },
};
