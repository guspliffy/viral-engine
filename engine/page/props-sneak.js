import * as THREE from "three";

// Props for friends-try-to episode 6, "sneak in late without waking Mom" (Jonny's eight panels, 4 Nov 2026), in their own
// file so parallel clips never edit the same one (props3d.js merges SNEAK_KINDS and SNEAK_GRIPS on their own line).
// The hall itself is set-nighthall.js. Nothing here carries lettering.
//   looseboard  the one loose floorboard: a plank spec.l long (along z) and spec.w wide lying on the floor, a little
//               lighter, its nail heads missing. flex 0..1 bends it down in the middle (a foot on it) and lifts its
//               two ends; tick 0..1 shows short yellow strain lines at its ends (the creak, drawn).
//   shoerack    a low wooden rack, two shelves, slippers and a pair of shoes on them. Origin: its bottom centre, its
//               front toward +z. spec.w (0.9).
//   slippers    a pair of fluffy slippers on the floor, side by side along x, toes toward +z. spec.color, spec.check
//               (a second colour: a check pattern). puff 0..1 blows each one up into a round, shiny balloon slipper with
//               a little knot at the heel (it stays that way); bob 0..1 makes them bounce and squash (a squeak).
//   coatstand   a turned wooden coat stand: four curved feet, a pole, six hooks at the top, a long brown coat, a beige
//               coat and a plaid scarf hanging on it. tip 0..1 leans it over toward -x about its feet (to 28 deg);
//               wobble 0..1 rocks it; tug 0..1 pulls the beige coat's top toward -x and up (caught on a hat).
//               Grip "pole": the pole at 0.95 m (a hand catching it).
//   runner      a long red patterned runner rug that unrolls along +z from the prop's origin: unroll 0 is a tight roll
//               lying across the floor at the origin (its axis along x), 1 lies flat spec.l long (2.8). spec.w (0.9).
//   nightdoor   the front door leaf: dark painted panels, two big rusty barrel hinges on its hinge edge (local x 0), a
//               brass lever handle on both faces near its free edge (+x). Closed it lies along local +x with its inside
//               face to +z; open 0..1 swings it toward +z by spec.angle (deg, 140). squeal 0..1 shivers it and shows
//               yellow zigzag ticks by the top hinge. spec.w (1.18), spec.h (2.0). Grip "handle": the inside lever.
//   momdoor     Mom's bedroom door, set in a wall facing +z: a casing, a closed leaf, a knob. on 0..1 lights the gap
//               under it and round it warm, lays a warm fan of light on the floor out to spec.reach (2.6 m) and puts a
//               big round shadow (a mum with her hair in a bun, arms on her hips) in it, falling toward the viewer.
//   torchphone  a phone in a dark case whose torch is on: a soft cone of light from the camera on its back (local -z),
//               tipped down spec.tilt degrees (30); on 0..1. Held like the phone (grip at its middle, 0.05).
export const SNEAK_GRIPS = {
  coatstand: { pole: [0, 0.95, 0] },
  nightdoor: { handle: [1.05, 0.98, 0.075] },
};

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.65, ...o });
const glowMat = (o = {}) => { const m = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, ...o }); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const clamp = (x) => Math.min(1, Math.max(0, x ?? 0));
function canvas(w, h) { const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
// a box with rounded edges (a superellipsoid)
function pad(w, h, d, n = 6, seg = [24, 16]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]), p = g.attributes.position, v = new THREE.Vector3();
  const f = (q) => Math.sign(q) * Math.abs(q) ** (2 / n);
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); p.setXYZ(i, (f(v.x) * w) / 2, (f(v.y) * h) / 2, (f(v.z) * d) / 2); }
  g.computeVertexNormals(); return g;
}
// short yellow strain lines (the drawn creak and squeal), a sprite group; show(k) fades them
function ticks(parent, n, r, zig = false) {
  const [c, g] = canvas(128, 128);
  g.strokeStyle = "#ffe14a"; g.lineWidth = 12; g.lineCap = "round"; g.lineJoin = "round";
  g.beginPath(); if (zig) { g.moveTo(30, 12); g.lineTo(84, 44); g.lineTo(40, 70); g.lineTo(98, 116); } else { g.moveTo(64, 14); g.lineTo(64, 114); } g.stroke();
  g.strokeStyle = "#3a2a10"; g.lineWidth = 3; g.stroke();
  const m = new THREE.SpriteMaterial({ map: tex(c), transparent: true, depthWrite: false, opacity: 0 }); m.userData.noOutline = true;
  const grp = new THREE.Group(); parent.add(grp);
  for (let i = 0; i < n; i++) { const s = new THREE.Sprite(m); const a = (i / Math.max(1, n - 1) - 0.5) * 1.6; s.position.set(Math.sin(a) * r, Math.cos(a) * r, 0); s.material.rotation = -a; s.scale.setScalar(r * 0.7); grp.add(s); }
  return { grp, show(k, t) { m.opacity = k; grp.visible = k > 0.01; grp.scale.setScalar(0.9 + 0.12 * Math.sin((t ?? 0) * 40) * k); } };
}

export const SNEAK_KINDS = {
  looseboard(P) {
    const S = P.spec, L = S.l ?? 1.1, Wd = S.w ?? 0.16, n = 8;
    const wood = mat(S.color || "#a8774a", { roughness: 0.6 }), seam = mat("#2e1a0c", { roughness: 0.9 });
    // the plank in pieces along z so it can bend; a dark gap round it
    mesh(new THREE.BoxGeometry(Wd + 0.02, 0.004, L + 0.02), seam, P.whole, 0, 0.002, 0).castShadow = false;
    const segs = [];
    for (let i = 0; i < n; i++) { const z = -L / 2 + (i + 0.5) * (L / n), s = mesh(new THREE.BoxGeometry(Wd, 0.02, L / n + 0.002), wood, P.whole, 0, 0.01, z); s.castShadow = false; segs.push([s, z]); }
    const tk = [ticks(P.whole, 3, 0.18), ticks(P.whole, 3, 0.18)];
    tk[0].grp.position.set(0, 0.1, -L / 2 - 0.05); tk[1].grp.position.set(0, 0.1, L / 2 + 0.05);
    return {
      grip: 0,
      apply(ps, t) {
        const f = clamp(ps.flex);
        for (const [s, z] of segs) { const u = z / (L / 2); s.position.y = 0.01 + f * (0.035 * u * u - 0.025); s.rotation.x = -f * 0.07 * u; }
        for (const k of tk) k.show(clamp(ps.tick), t);
      },
    };
  },
  shoerack(P) {
    const S = P.spec, w = S.w ?? 0.9, h = 0.46, d = 0.3, wood = mat("#7a5236", { roughness: 0.55 });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.03, h, d), wood, P.whole, s * (w / 2 - 0.015), h / 2, 0);
    for (const y of [0.04, 0.24, h - 0.015]) mesh(new THREE.BoxGeometry(w - 0.06, 0.025, d), wood, P.whole, 0, y, 0);
    const fluff = (c, x, y, z) => { const g = pad(0.11, 0.06, 0.22, 4); const m = mesh(g, mat(c, { roughness: 0.95 }), P.whole, x, y + 0.03, z); return m; };
    for (const [c, x, y] of [["#7da0d8", -0.28, 0.055], ["#7da0d8", -0.16, 0.055], ["#e9d8bf", 0.12, 0.255], ["#e9d8bf", 0.24, 0.255], ["#c06a8a", -0.24, 0.255], ["#c06a8a", -0.12, 0.255]]) fluff(c, x, y, 0.02);
    // a pair of outdoor shoes on the bottom shelf
    for (const x of [0.14, 0.27]) { mesh(pad(0.1, 0.07, 0.24, 5), mat("#3a2c24", { roughness: 0.5 }), P.whole, x, 0.09, 0.0); }
    return { grip: h };
  },
  slippers(P) {
    const S = P.spec, base = new THREE.Color(S.color || "#7da0d8");
    // a check pattern when spec.check is set, else a soft fleece
    const [c, g] = canvas(128, 128);
    g.fillStyle = S.color || "#7da0d8"; g.fillRect(0, 0, 128, 128);
    if (S.check) { g.fillStyle = S.check; for (let i = 0; i < 8; i++) { g.globalAlpha = 0.45; g.fillRect(i * 16, 0, 8, 128); g.fillRect(0, i * 16, 128, 8); } g.globalAlpha = 1; }
    else for (let i = 0; i < 300; i++) { g.fillStyle = "rgba(255,255,255,0.08)"; g.fillRect((i * 37) % 128, (i * 53) % 128, 3, 3); }
    const m = mat("#ffffff", { map: tex(c), roughness: 0.9 }), shine = mat("#ffffff", { roughness: 0.25, transparent: true, opacity: 0.0 });
    const one = [];
    for (const s of [-1, 1]) {
      const g0 = new THREE.Group(); g0.position.set(s * 0.085, 0, 0); P.whole.add(g0);
      const body = mesh(pad(0.13, 0.07, 0.26, 4), m, g0, 0, 0.035, 0);
      const cuff = mesh(new THREE.TorusGeometry(0.045, 0.018, 8, 16), mat("#ffffff", { roughness: 1, color: base.clone().lerp(new THREE.Color("#ffffff"), 0.6) }), g0, 0, 0.07, -0.04); cuff.rotation.x = Math.PI / 2;
      const knot = mesh(new THREE.ConeGeometry(0.02, 0.04, 10), m, g0, 0, 0.05, -0.14); knot.rotation.x = -Math.PI / 2; knot.visible = false;
      const gloss = mesh(new THREE.SphereGeometry(0.03, 10, 8), shine, g0, -0.03, 0.12, 0.03); gloss.castShadow = false;
      const ball = mesh(new THREE.SphereGeometry(1, 24, 16), mat("#ffffff", { map: m.map, roughness: 0.3, metalness: 0.05 }), g0, 0, 0.16, 0); ball.visible = false;
      one.push({ g0, body, cuff, knot, gloss, ball, s });
    }
    return {
      grip: 0.07,
      apply(ps, t) {
        const p = clamp(ps.puff), b = clamp(ps.bob);
        for (const o of one) {
          // the slipper swells into a round balloon: wider and much taller, the cuff stretched round it
          const sx = 1 + 1.15 * p, sy = 1 + 2.6 * p, sz = 1 + 0.45 * p;
          const bounce = b * Math.abs(Math.sin((t ?? 0) * 12 + o.s));
          o.body.scale.set(sx * (1 + 0.06 * bounce), sy * (1 - 0.08 * bounce), sz); o.body.position.y = 0.035 * sy * (1 - 0.08 * bounce) + 0.02 * bounce;
          // past halfway the slipper is a round balloon: an egg-shaped ball, toe forward, a little squashed on the floor
          const bp = Math.min(1, Math.max(0, (p - 0.35) / 0.65)); o.ball.visible = bp > 0.01; o.body.visible = bp < 0.6;
          o.ball.scale.set(0.13 * bp * (1 + 0.06 * bounce), 0.14 * bp * (1 - 0.08 * bounce), 0.19 * bp); o.ball.position.set(0, 0.14 * bp * (1 - 0.08 * bounce) + 0.01, 0.01);
          o.cuff.position.y = 0.07 + 0.11 * p; o.cuff.scale.setScalar(1 + 0.6 * p);
          o.knot.visible = p > 0.6; o.knot.position.set(0, 0.12, -0.2);
          o.gloss.material.opacity = 0.75 * p; o.gloss.position.set(-0.03 - 0.03 * p, 0.04 + 0.15 * p, 0.03 + 0.03 * p);
          o.g0.position.x = o.s * (0.085 + 0.065 * p); o.cuff.visible = p < 0.7;
        }
      },
    };
  },
  coatstand(P) {
    const S = P.spec, H = S.h ?? 1.75, wood = mat("#6a4128", { roughness: 0.45 });
    const pivot = new THREE.Group(); P.whole.add(pivot);
    const top = new THREE.Group(); pivot.add(top);
    mesh(new THREE.CylinderGeometry(0.03, 0.035, H, 14), wood, top, 0, H / 2, 0);
    mesh(new THREE.SphereGeometry(0.05, 14, 10), wood, top, 0, H + 0.02, 0);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 14), wood, top, 0, 0.12, 0);
    // four curved feet
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4, curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.14, 0), new THREE.Vector3(Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15), new THREE.Vector3(Math.cos(a) * 0.28, 0.015, Math.sin(a) * 0.28)]);
      mesh(new THREE.TubeGeometry(curve, 12, 0.02, 8), wood, top);
    }
    // six hooks
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, y = H - 0.08 - (i % 2) * 0.12, curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, y - 0.04, 0), new THREE.Vector3(Math.cos(a) * 0.1, y + 0.02, Math.sin(a) * 0.1), new THREE.Vector3(Math.cos(a) * 0.15, y + 0.1, Math.sin(a) * 0.15)]);
      mesh(new THREE.TubeGeometry(curve, 10, 0.014, 6), wood, top);
      mesh(new THREE.SphereGeometry(0.02, 8, 6), wood, top, Math.cos(a) * 0.15, y + 0.11, Math.sin(a) * 0.15);
    }
    // the coats: soft hanging shapes, widest at the shoulders, tapering down
    const coat = (color, a, len, w) => {
      const g = new THREE.Group(); g.position.set(Math.cos(a) * 0.14, H - 0.1, Math.sin(a) * 0.14); top.add(g);
      const geo = new THREE.CylinderGeometry(w * 0.55, w, len, 16, 6, true); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = 1 - (y + len / 2) / len; p.setZ(i, p.getZ(i) * 0.45 + 0.02 * Math.sin(p.getX(i) * 30) * k); }
      geo.computeVertexNormals();
      mesh(geo, mat(color, { roughness: 0.85, side: THREE.DoubleSide }), g, 0, -len / 2 - 0.03, 0);
      mesh(new THREE.SphereGeometry(w * 0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { roughness: 0.85 }), g, 0, -0.03, 0).scale.set(1, 0.4, 0.45);
      return g;
    };
    coat("#7a5638", Math.PI * 0.05, 0.95, 0.24);
    const beige = coat("#c9ad84", Math.PI * 0.95, 0.8, 0.21);
    // the plaid scarf over a hook at the front: two hanging tails
    const [c, g] = canvas(64, 64); g.fillStyle = "#5a6e8a"; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(160,60,50,0.6)"; for (let i = 0; i < 4; i++) { g.fillRect(i * 16 + 4, 0, 5, 64); g.fillRect(0, i * 16 + 4, 64, 5); } g.fillStyle = "rgba(230,220,180,0.5)"; for (let i = 0; i < 4; i++) { g.fillRect(i * 16 + 11, 0, 2, 64); g.fillRect(0, i * 16 + 11, 64, 2); }
    const st = tex(c); st.wrapS = st.wrapT = THREE.RepeatWrapping; st.repeat.set(1, 3);
    for (const dx of [-0.05, 0.05]) mesh(new THREE.BoxGeometry(0.08, 0.55, 0.02), mat("#ffffff", { map: st, roughness: 0.9 }), top, dx, H - 0.42 + (dx > 0 ? 0.06 : 0), 0.15);
    return {
      grip: 0.95,
      apply(ps, t) {
        const tip = clamp(ps.tip), wob = clamp(ps.wobble), tug = clamp(ps.tug);
        pivot.rotation.z = tip * 0.49 + wob * 0.06 * Math.sin((t ?? 0) * 14);
        pivot.rotation.x = wob * 0.03 * Math.sin((t ?? 0) * 11 + 1);
        beige.rotation.z = tug * 0.35; beige.position.y = H - 0.1 + tug * 0.05;
      },
    };
  },
  runner(P) {
    const S = P.spec, L = S.l ?? 2.8, w = S.w ?? 0.9, th = 0.014;
    const [c, g] = canvas(256, 1024);
    g.fillStyle = "#8e2a2e"; g.fillRect(0, 0, 256, 1024);
    g.fillStyle = "#5e1a20"; g.fillRect(0, 0, 256, 1024); g.fillStyle = "#9a3034"; g.fillRect(14, 14, 228, 996);
    g.strokeStyle = "#d9b26a"; g.lineWidth = 5; g.strokeRect(26, 26, 204, 972);
    for (let y = 70; y < 980; y += 90) { g.fillStyle = "#c9a060"; g.beginPath(); g.moveTo(128, y - 30); g.lineTo(158, y); g.lineTo(128, y + 30); g.lineTo(98, y); g.fill(); g.fillStyle = "#6e2028"; g.beginPath(); g.arc(128, y, 9, 0, Math.PI * 2); g.fill();
      for (const s of [-1, 1]) { g.fillStyle = "rgba(220,180,110,0.7)"; g.beginPath(); g.ellipse(128 + s * 66, y, 10, 18, 0, 0, Math.PI * 2); g.fill(); } }
    // a fringe at the ends
    for (let x = 4; x < 252; x += 8) { g.fillStyle = "#e8dcc0"; g.fillRect(x, 0, 3, 12); g.fillRect(x, 1012, 3, 12); }
    const rugTex = tex(c);
    const flatM = mat("#ffffff", { map: rugTex, roughness: 0.95 }); flatM.userData.noShine = true;
    const flat = new THREE.Mesh(new THREE.PlaneGeometry(w, L), flatM); flat.rotation.x = -Math.PI / 2; flat.receiveShadow = true; P.whole.add(flat);
    const back = mat("#7a2428", { roughness: 0.95 });
    const roll = new THREE.Group(); P.whole.add(roll);
    const cyl = mesh(new THREE.CylinderGeometry(1, 1, w, 28), back, roll); cyl.rotation.z = Math.PI / 2;
    // the roll's ends show the spiral
    const [sc, sg] = canvas(128, 128); sg.fillStyle = "#7a2428"; sg.fillRect(0, 0, 128, 128); sg.strokeStyle = "#c58a5a"; sg.lineWidth = 3; sg.beginPath();
    for (let a = 0; a < Math.PI * 10; a += 0.1) { const r = 4 + a * 1.9; sg.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } sg.stroke();
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.CircleGeometry(1, 28), mat("#ffffff", { map: tex(sc), roughness: 0.9 })); e.rotation.y = s * Math.PI / 2; e.position.x = s * (w / 2 + 0.001); roll.add(e); }
    const r0 = Math.sqrt((L * th) / Math.PI + 0.02 * 0.02);
    return {
      grip: r0,
      apply(ps) {
        const u = clamp(ps.unroll), laid = L * u, r = Math.sqrt(((L - laid) * th) / Math.PI + 0.02 * 0.02);
        flat.visible = laid > 0.01; flat.scale.y = Math.max(0.001, laid / L); flat.position.set(0, 0.003, laid / 2);
        flatM.map.repeat.set(1, Math.max(0.001, laid / L)); flatM.map.offset.set(0, 1 - Math.max(0.001, laid / L));
        roll.position.set(0, r, laid + r * 0.6); roll.scale.set(1, r, r); roll.rotation.x = laid / Math.max(r, 0.03);
        roll.visible = u < 0.995;
      },
    };
  },
  nightdoor(P) {
    const S = P.spec, w = S.w ?? 1.18, h = S.h ?? 2.0, t = 0.06;
    const hinge = new THREE.Group(); P.whole.add(hinge);
    const leaf = new THREE.Group(); hinge.add(leaf);
    const paint = mat(S.color || "#3f5a6e", { roughness: 0.55 }), dark = mat("#2c4050", { roughness: 0.6 });
    mesh(new THREE.BoxGeometry(w, h, t), paint, leaf, w / 2, h / 2, 0);
    // raised panels on both faces, a little window at the top
    for (const z of [t / 2 + 0.006, -t / 2 - 0.006]) for (const [x, y, pw, ph] of [[0.3, 0.45, 0.4, 0.55], [0.85, 0.45, 0.4, 0.55], [0.3, 1.15, 0.4, 0.6], [0.85, 1.15, 0.4, 0.6]]) mesh(new THREE.BoxGeometry(pw * (w / 1.18), ph, 0.012), dark, leaf, x * (w / 1.18), y, z);
    mesh(new THREE.BoxGeometry(w * 0.7, 0.28, 0.07), mat("#2a3a5a", { roughness: 0.1, emissive: "#3a5296", emissiveIntensity: 0.4 }), leaf, w / 2, h - 0.3, 0);
    // two big rusty barrel hinges on the hinge edge, seen from inside: knuckles and long straps
    const rust = mat("#8a4a26", { roughness: 0.85, metalness: 0.3 }), rustDark = mat("#4a2414", { roughness: 0.9 });
    for (const y of [0.32, h - 0.38]) {
      const k = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 12), rust, hinge, -0.01, y, 0.04);
      mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), rustDark, hinge, -0.01, y + 0.12, 0.04); mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 12), rustDark, hinge, -0.01, y - 0.12, 0.04);
      let strap;
      for (const f of [1, -1]) {
        strap = mesh(new THREE.BoxGeometry(0.42, 0.11, 0.012), rust, leaf, 0.22, y, f * (t / 2 + 0.012));
        for (const x of [0.08, 0.22, 0.36]) mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 8), rustDark, leaf, x, y, f * (t / 2 + 0.02)).rotation.x = Math.PI / 2;
        for (let i = 0; i < 5; i++) mesh(new THREE.SphereGeometry(0.012 + (i % 3) * 0.004, 6, 4), rustDark, leaf, 0.05 + i * 0.08, y + ((i * 37) % 7 - 3) * 0.01, f * (t / 2 + 0.018));
      }
      k.castShadow = strap.castShadow = false;
    }
    // the lever handle on both faces
    const brass = mat("#c9a24a", { roughness: 0.3, metalness: 0.6 });
    for (const s of [1, -1]) {
      mesh(new THREE.BoxGeometry(0.05, 0.16, 0.012), brass, leaf, w - 0.1, 0.98, s * (t / 2 + 0.008));
      const lever = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.13, 10), brass, leaf, w - 0.15, 0.98, s * (t / 2 + 0.045)); lever.rotation.z = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.04, 10), brass, leaf, w - 0.1, 0.98, s * (t / 2 + 0.025)).rotation.x = Math.PI / 2;
    }
    const tk = ticks(P.whole, 3, 0.22, true); tk.grp.position.set(0.05, h - 0.25, 0.3);
    const A = ((S.angle ?? 140) * Math.PI) / 180;
    return {
      grip: 0.98,
      apply(ps, tt) {
        const o = clamp(ps.open), q = clamp(ps.squeal);
        hinge.rotation.y = -o * A + q * 0.012 * Math.sin((tt ?? 0) * 70);
        tk.show(q, tt);
      },
    };
  },
  momdoor(P) {
    const S = P.spec, w = S.w ?? 0.95, h = S.h ?? 1.95, reach = S.reach ?? 2.6;
    const casing = mat("#d9d2c4", { roughness: 0.5 }), leafM = mat("#7a5236", { roughness: 0.55 }), dark = mat("#5e3e28", { roughness: 0.6 });
    for (const s of [-1, 1]) mesh(new THREE.BoxGeometry(0.08, h + 0.08, 0.05), casing, P.whole, s * (w / 2 + 0.04), (h + 0.08) / 2, 0.025);
    mesh(new THREE.BoxGeometry(w + 0.24, 0.1, 0.06), casing, P.whole, 0, h + 0.09, 0.03);
    mesh(new THREE.BoxGeometry(w - 0.02, h - 0.02, 0.05), leafM, P.whole, 0, h / 2 + 0.02, -0.01);
    for (const [y, ph] of [[0.5, 0.6], [1.35, 0.7]]) for (const x of [-0.2, 0.2]) mesh(new THREE.BoxGeometry(0.3 * (w / 0.95), ph, 0.012), dark, P.whole, x * (w / 0.95), y, 0.018);
    mesh(new THREE.SphereGeometry(0.035, 12, 8), mat("#c9a24a", { roughness: 0.3, metalness: 0.6 }), P.whole, w / 2 - 0.12, 0.98, 0.04);
    // the light: a bright strip under the door and a thin line down its edge
    const warm = new THREE.Color("#ffc977");
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.04, 0.025), glowMat({ color: warm, opacity: 0 })); strip.position.set(0, 0.0125, 0.03); P.whole.add(strip);
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.018, h - 0.05), glowMat({ color: warm, opacity: 0 })); edge.position.set(w / 2 - 0.01, h / 2, 0.03); P.whole.add(edge);
    // the fan of light on the floor, and the shadow in it: one canvas (light, then the shadow cut into it)
    const [c, g] = canvas(512, 512);
    const gr = g.createLinearGradient(0, 512, 0, 0); gr.addColorStop(0, "rgba(255,210,140,0.95)"); gr.addColorStop(1, "rgba(255,190,120,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(150, 512); g.lineTo(362, 512); g.lineTo(512, 0); g.lineTo(0, 0); g.closePath(); g.fill();
    const fan = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, reach), glowMat({ map: tex(c), opacity: 0 }));
    fan.rotation.x = -Math.PI / 2; fan.position.set(0, 0.006, reach / 2); fan.renderOrder = 2; P.whole.add(fan);
    // the shadow: a big round mum, hair in a bun, arms on her hips, stretched long along the floor toward the viewer
    const [sc, sg] = canvas(256, 512);
    sg.fillStyle = "#000"; sg.beginPath(); sg.ellipse(128, 300, 70, 150, 0, 0, Math.PI * 2); sg.fill();
    sg.beginPath(); sg.ellipse(128, 120, 46, 50, 0, 0, Math.PI * 2); sg.fill(); sg.beginPath(); sg.arc(128, 62, 26, 0, Math.PI * 2); sg.fill();
    for (const s of [-1, 1]) { sg.beginPath(); sg.ellipse(128 + s * 82, 270, 22, 50, s * 0.6, 0, Math.PI * 2); sg.fill(); }
    // curlers: little bumps round the head
    for (const a of [-1.1, -0.5, 0.5, 1.1]) { sg.beginPath(); sg.arc(128 + Math.sin(a) * 50, 120 - Math.cos(a) * 50, 12, 0, Math.PI * 2); sg.fill(); }
    const shM = new THREE.MeshBasicMaterial({ map: tex(sc), transparent: true, opacity: 0, depthWrite: false, color: "#1a1020", fog: false }); shM.userData.noOutline = true;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.6, reach * 0.95), shM);
    // the head end is far (toward the viewer the shadow grows): flip so the feet start at the door
    shadow.rotation.x = -Math.PI / 2; shadow.rotation.z = Math.PI; shadow.position.set(0, 0.008, reach * 0.5); shadow.renderOrder = 3; P.whole.add(shadow);
    // a soft warm glow round the door itself
    const [hc, hg] = canvas(128, 128), rg = hg.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(1, "rgba(255,255,255,0)"); hg.fillStyle = rg; hg.fillRect(0, 0, 128, 128);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.2, h * 1.2), glowMat({ map: tex(hc), color: warm, opacity: 0 })); halo.position.set(0, h * 0.35, 0.06); P.whole.add(halo);
    return {
      grip: 0,
      apply(ps) {
        const on = clamp(ps.on), sh = clamp(ps.shadow ?? ps.on);
        strip.material.opacity = on; edge.material.opacity = 0.8 * on; fan.material.opacity = 0.75 * on; halo.material.opacity = 0.35 * on;
        shM.opacity = 0.78 * sh * on;
      },
    };
  },
  torchphone(P) {
    const S = P.spec, body = mat(S.case ?? "#23242c", { roughness: 0.5 });
    mesh(new THREE.BoxGeometry(0.078, 0.155, 0.012), body, P.whole, 0, 0.0775, 0);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.138), mat("#1c3a52", { roughness: 0.2, emissive: "#8fd0ff", emissiveIntensity: 0.4 })); screen.position.set(0, 0.0775, 0.0062); P.whole.add(screen);
    // the torch: a bright dot by the camera, and a cone of light out of the back, tipped down
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.007, 12), glowMat({ color: "#ffffff", opacity: 0 })); lamp.position.set(-0.02, 0.135, -0.0065); lamp.rotation.y = Math.PI; P.whole.add(lamp);
    const L = S.len ?? 1.5, R = S.r ?? 0.42;
    const [c, g] = canvas(64, 256), gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, "rgba(255,248,220,0.7)"); gr.addColorStop(0.6, "rgba(255,240,200,0.25)"); gr.addColorStop(1, "rgba(255,240,200,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(R, L, 24, 1, true), glowMat({ map: tex(c), opacity: 0, side: THREE.DoubleSide }));
    cone.geometry.translate(0, -L / 2, 0);   // its tip at the origin, opening along -y
    const aim = new THREE.Group(); aim.position.set(-0.02, 0.135, -0.008); P.whole.add(aim);
    aim.rotation.x = Math.PI / 2 - ((S.tilt ?? 30) * Math.PI) / 180;   // -y turned to point out of the back (-z), then down
    aim.add(cone);
    return { grip: 0.05, apply(ps) { const on = clamp(ps.on); cone.material.opacity = 0.18 * on; lamp.material.opacity = on; } };
  },
};
