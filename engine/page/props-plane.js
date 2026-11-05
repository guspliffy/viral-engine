import * as THREE from "three";
import { clamp } from "./util.js";

// Props for "Never Looks Up" episode 2, turbulence (5 Nov 2026; Jonny's 8-panel board in
// /mnt/project-files/NEVER-LOOKS-UP-STORYBOARDS.zip 02-plane-turbulence): one row of a passenger cabin at night, a
// neutral unnamed airline (no logos, names or words). Only existing propState keys are used (props3d.js propState).
//
//   planeseat   one economy seat facing +z: blue fabric cushion (top at SEAT_Y 0.42, so "sit" works on it), a tall
//               back with a white headrest cover, armrests on both sides (spec.arms: "both" | "L" | "R" | "none").
//   seatbelt    a grey lap belt with a silver buckle across a sitter's belly (origin: the seat's origin; spec.r the
//               belly's half width). open 0..1: the buckle parts and the two halves drop to hang beside the seat.
//               Drawn over the body, so it is see-through for the contact checks (userData.steam).
//   cabinwall   the left cabin wall (origin: its foot at the row, facing +x) with oval windows; glow 0..1 is a
//               lightning flash: the storm outside lights the panes cool white-blue.
//   overhead    the ceiling over the row: bins, the passenger panel with reading lights and the seatbelt sign (an
//               icon, no words; lit 0..1) and one mask door per seat (spec.doors: x offsets); open 0..1 drops them.
//   oxymask     a yellow oxygen mask on a coiled hose: the prop's position is the mask cup, spec.anchor [x, y, z]
//               the hose's top (world, at the panel). The hose sags between them every frame. The cup faces +z
//               turned by rot; tilt / tip turn it too.
//   drinktray   a small flight attendant's tray (origin: its middle) with a glass of orange juice and a cup. Level
//               unless tilted (it never is).
//   blob        a floating blob of liquid (spec.color): fill 0..1 its size, wobble 0..1 how much it jiggles.
//   pillow      a small white cabin pillow; magazine an open in-flight magazine with a plain blue-sky cover.
//   rowback     the row in front, where the camera sits (its headrests low in frame): spec.n seats, spec.gap apart.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const steam = (o) => { o.traverse((c) => { c.userData.steam = true; c.castShadow = false; }); return o; };
const rad = (d) => (d * Math.PI) / 180;
// a box with soft corners (a seat cushion, a back): a rounded rectangle extruded and bevelled
function softBox(w, h, d, r = 0.04) {
  const s = new THREE.Shape(), x = -w / 2 + r, y = -h / 2 + r, W = w - 2 * r, H = h - 2 * r;
  s.moveTo(x, y - r); s.lineTo(x + W, y - r); s.quadraticCurveTo(x + W + r, y - r, x + W + r, y); s.lineTo(x + W + r, y + H);
  s.quadraticCurveTo(x + W + r, y + H + r, x + W, y + H + r); s.lineTo(x, y + H + r); s.quadraticCurveTo(x - r, y + H + r, x - r, y + H);
  s.lineTo(x - r, y); s.quadraticCurveTo(x - r, y - r, x, y - r);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * r * 0.6), bevelEnabled: true, bevelThickness: r * 0.6, bevelSize: r * 0.6, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * r * 0.6) / 2); return g;
}
const FABRIC = "#34518f", FABRIC_D = "#283f70", COVER = "#eef0f2", PLASTIC = "#d9d6cf", PLASTIC_D = "#a9a59c";

export const PLANE_KINDS = {
  planeseat(P) {
    const S = P.spec, W = 0.7, fab = mat(S.color ?? FABRIC, { roughness: 0.9 }), dark = mat(FABRIC_D, { roughness: 0.9 }), pl = mat(PLASTIC, { roughness: 0.5 }), cov = mat(COVER, { roughness: 0.8 });
    // the cushion (top at 0.42), the back (tilted 8 degrees), the headrest cover, the base
    mesh(softBox(W - 0.04, 0.14, 0.56, 0.05), fab, P.whole, 0, 0.35, 0.02).rotation.x = -Math.PI / 2 + Math.PI / 2;
    const back = new THREE.Group(); back.position.set(0, 0.42, -0.27); back.rotation.x = rad(-8); P.whole.add(back);
    mesh(softBox(W - 0.04, 0.95, 0.15, 0.06), fab, back, 0, 0.47, -0.02);
    mesh(softBox(W - 0.14, 0.24, 0.02, 0.01), cov, back, 0, 0.8, 0.065);
    mesh(new THREE.BoxGeometry(W - 0.12, 0.28, 0.4), dark, P.whole, 0, 0.14, -0.02);
    for (const sx of [-1, 1]) mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8), mat("#55595f", { roughness: 0.4, metalness: 0.4 }), P.whole, sx * (W / 2 - 0.12), 0.1, 0.05);
    const arms = S.arms ?? "both";
    for (const sx of [-1, 1]) {
      if (arms === "none" || (arms === "L" && sx < 0) || (arms === "R" && sx > 0)) continue;   // L: the seat's own left (+x, facing +z)
      mesh(softBox(0.07, 0.06, 0.5, 0.025), pl, P.whole, sx * (W / 2), 0.64, -0.02);
      mesh(new THREE.BoxGeometry(0.05, 0.22, 0.08), mat(PLASTIC_D), P.whole, sx * (W / 2), 0.52, -0.2);
    }
    return { grip: 0.42 };
  },

  seatbelt(P) {
    const S = P.spec, r = S.r ?? 0.36, z = S.z ?? 0.3, y = S.y ?? 0.52, strap = mat("#5b5f66", { roughness: 0.8 }), metal = mat("#d8dce2", { roughness: 0.25, metalness: 0.8 });
    // two halves, each a strap from the seat's side round the front of the belly to the buckle in the middle
    const half = (sx) => {
      const g = new THREE.Group(); g.position.set(sx * r, y - 0.02, z - 0.28); P.whole.add(g);   // hinged at the seat's side
      const pts = []; for (let i = 0; i <= 10; i++) { const a = (i / 10) * (Math.PI / 2); pts.push(new THREE.Vector3(-sx * r * Math.sin(a), 0.02 * Math.sin(a * 2), 0.28 * (1 - Math.cos(a)) + 0.0)); }
      const m = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.018, 6, false), strap, g); m.scale.set(1, 2.2, 1);
      const b = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), metal, g, -sx * r, 0.02, 0.28);
      return { g, b };
    };
    const L = half(-1), R = half(1);
    steam(P.whole);
    return {
      grip: 0,
      apply(ps) {
        const o = clamp(ps.open);
        // open: each half swings down from its hinge and out to hang by the seat
        L.g.rotation.set(-o * 1.25, -o * 0.5, 0); R.g.rotation.set(-o * 1.25, o * 0.5, 0);
      },
    };
  },

  cabinwall(P) {
    const S = P.spec, len = S.len ?? 6, n = S.windows ?? 5, gap = S.gap ?? 0.85, wall = mat("#e8e4dc", { roughness: 0.85 }), trim = mat("#c9c3b8", { roughness: 0.7 });
    // a curved wall panel along z (it faces +x), windows centred at y 1.05
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(len, 0); shape.lineTo(len, 2.1); shape.lineTo(0, 2.1); shape.lineTo(0, 0);
    const holes = [];
    for (let i = 0; i < n; i++) { const cz = (S.first ?? 0.6) + i * gap, h = new THREE.Path(); h.absellipse(cz, 1.05, 0.15, 0.22, 0, Math.PI * 2, true); shape.holes.push(h); holes.push(cz); }
    const g = new THREE.ShapeGeometry(shape, 24), w = mesh(g, wall, P.whole); w.rotation.y = Math.PI / 2; w.position.z = len - (S.back ?? 3); w.material.side = THREE.DoubleSide;
    // the panes: the storm outside (dark blue), lit by a flash
    const paneM = new THREE.MeshBasicMaterial({ color: "#1a2a55" }); paneM.userData.noOutline = true;
    const panes = holes.map((cz) => {
      const p = mesh(new THREE.CircleGeometry(1, 28), paneM, P.whole, -0.04, 1.05, (S.back ?? 3) - cz); p.rotation.y = Math.PI / 2; p.scale.set(0.15, 0.22, 1); p.castShadow = false;
      const ring = mesh(new THREE.TorusGeometry(1, 0.12, 6, 28), trim, P.whole, 0.01, 1.05, (S.back ?? 3) - cz); ring.rotation.y = Math.PI / 2; ring.scale.set(0.16, 0.23, 0.16);
      return p;
    });
    // a jagged bolt in one pane, seen only in the flash
    const boltM = new THREE.MeshBasicMaterial({ color: "#f4f8ff", transparent: true, opacity: 0 }); boltM.userData.noOutline = true;
    const bs = new THREE.Shape(); bs.moveTo(0.02, 0.2); bs.lineTo(-0.05, 0.02); bs.lineTo(0.01, 0.03); bs.lineTo(-0.04, -0.2); bs.lineTo(0.06, -0.01); bs.lineTo(0.0, -0.01); bs.lineTo(0.06, 0.2);
    const bolt = mesh(new THREE.ShapeGeometry(bs), boltM, P.whole, -0.035, 1.05, (S.back ?? 3) - holes[S.boltAt ?? 1]); bolt.rotation.y = Math.PI / 2; bolt.castShadow = false;
    const dark = new THREE.Color("#1a2a55"), lit = new THREE.Color("#c9dcff");
    return {
      grip: 0,
      apply(ps) {
        const f = clamp(ps.glow);
        paneM.color.copy(dark).lerp(lit, f); boltM.opacity = f > 0.15 ? Math.min(1, f * 1.4) : 0;
      },
    };
  },

  overhead(P) {
    const S = P.spec, w = S.w ?? 3.2, d = S.d ?? 0.7, bin = mat("#e9e6df", { roughness: 0.6 }), line = mat("#bdb7ab", { roughness: 0.6 }), pnl = mat("#d7d3ca", { roughness: 0.6 });
    // bins: a long box above the row with lid seams; the panel under them; the ceiling beyond
    mesh(new THREE.BoxGeometry(w, 0.42, d), bin, P.whole, 0, 0.21 + 0.12, -0.05);
    for (let i = 1; i < 4; i++) mesh(new THREE.BoxGeometry(0.012, 0.4, 0.01), line, P.whole, -w / 2 + (i * w) / 4, 0.33, d / 2 - 0.045);
    mesh(new THREE.BoxGeometry(w, 0.12, d * 0.85), pnl, P.whole, 0, 0.06, 0.02);
    // reading lights (warm) and the seatbelt sign (an icon: a buckle, no words)
    const warm = new THREE.MeshBasicMaterial({ color: "#ffd98a" }); warm.userData.noOutline = true;
    for (const x of S.doors ?? [-0.85, 0, 0.85]) { const l = mesh(new THREE.CircleGeometry(0.03, 16), warm, P.whole, x + 0.18, -0.001, 0.2); l.rotation.x = Math.PI / 2; l.castShadow = false; }
    const signBox = mesh(new THREE.BoxGeometry(0.34, 0.12, 0.03), mat("#3a3631"), P.whole, S.sign ?? 0.45, -0.07, 0.3);
    const signM = new THREE.MeshBasicMaterial({ color: "#3b2a10" }); signM.userData.noOutline = true;
    const icon = new THREE.Group(); icon.position.set(S.sign ?? 0.45, -0.07, 0.317); P.whole.add(icon);
    mesh(new THREE.PlaneGeometry(0.3, 0.09), signM, icon).castShadow = false;
    const iconM = new THREE.MeshBasicMaterial({ color: "#2a1d08" }); iconM.userData.noOutline = true;
    for (const sx of [-1, 1]) { const s = mesh(new THREE.PlaneGeometry(0.09, 0.025), iconM, icon, sx * 0.065, 0, 0.001); s.castShadow = false; }
    const buckle = mesh(new THREE.RingGeometry(0.014, 0.024, 4, 1), iconM, icon, 0, 0, 0.002); buckle.rotation.z = Math.PI / 4; buckle.castShadow = false;
    // the mask doors: a hinged flap each, swinging down
    const doors = (S.doors ?? [-0.85, 0, 0.85]).map((x) => {
      const h = new THREE.Group(); h.position.set(x - 0.06, 0, 0.12); P.whole.add(h);
      mesh(new THREE.BoxGeometry(0.22, 0.012, 0.14), pnl, h, 0, -0.006, -0.07);
      return h;
    });
    return {
      grip: 0,
      apply(ps) {
        const lit = clamp(ps.lit ?? 1), o = clamp(ps.open);
        signM.color.set(lit > 0.5 ? "#ffb43a" : "#3b2a10");
        for (const h of doors) h.rotation.x = -o * 1.9;
      },
    };
  },

  oxymask(P) {
    const S = P.spec, yel = mat("#f5c518", { roughness: 0.45 }), clear = mat("#f8f2d8", { roughness: 0.2, transparent: true, opacity: 0.85 }), hoseM = mat("#e9e4d8", { roughness: 0.6 }), band = mat("#f1ece0", { roughness: 0.7 });
    // the cup (a short cone, open side +z) with a soft rim, a little bag under it, the elastic band
    const cup = new THREE.Group(); P.whole.add(cup);
    mesh(new THREE.CylinderGeometry(0.075, 0.045, 0.07, 20, 1, true), yel, cup, 0, 0, 0).rotation.x = Math.PI / 2;
    mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 24), clear, cup, 0, 0, 0.035);
    mesh(new THREE.CircleGeometry(0.046, 18), yel, cup, 0, 0, -0.035).rotation.y = Math.PI;
    const bag = mesh(new THREE.SphereGeometry(0.05, 12, 10), clear, cup, 0, -0.1, -0.02); bag.scale.set(1, 1.3, 0.7);
    const el = mesh(new THREE.TorusGeometry(0.11, 0.006, 5, 32), band, cup, 0, 0, -0.01); el.scale.set(1, 0.7, 1);
    steam(el);
    let hose = null;
    const anchor = S.anchor || [S.x ?? 0, (S.y ?? 1) + 0.6, S.z ?? 0];
    return {
      grip: 0,
      apply(ps) {
        const x = ps.x ?? S.x ?? 0, y = ps.y ?? S.y ?? 0, z = ps.z ?? S.z ?? 0;
        cup.rotation.set(rad(-(ps.tip ?? 0)), 0, rad(ps.tilt ?? 0));
        // the hose: from the cup's back up to the anchor, sagging a little (rebuilt from this frame's inputs only)
        const a = new THREE.Vector3(anchor[0] - x, anchor[1] - y, anchor[2] - z), b = new THREE.Vector3(0, 0.02, -0.04);
        const L = a.distanceTo(b), sag = Math.max(0, 0.18 - L * 0.12);
        const mid = a.clone().add(b).multiplyScalar(0.5); mid.y -= sag; mid.z += 0.03;
        if (hose) { hose.geometry.dispose(); P.whole.remove(hose); }
        const curve = new THREE.QuadraticBezierCurve3(b, mid, a);
        hose = mesh(new THREE.TubeGeometry(curve, 24, 0.011, 6, false), hoseM, P.whole); hose.castShadow = false;
        steam(hose);
        // the coil: a few bands along it
      },
    };
  },

  drinktray(P) {
    const tr = mat("#3b3f47", { roughness: 0.5 }), glass = mat("#e9f3f7", { roughness: 0.1, transparent: true, opacity: 0.55 }), juice = mat("#f59a1f", { roughness: 0.4 }), china = mat("#f4f1ea", { roughness: 0.35 });
    mesh(softBox(0.42, 0.3, 0.025, 0.02), tr, P.whole, 0, 0, 0).rotation.x = -Math.PI / 2;
    const gl = new THREE.Group(); gl.position.set(-0.09, 0.012, 0.0); P.whole.add(gl);
    mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.11, 18, 1, true), glass, gl, 0, 0.055, 0);
    mesh(new THREE.CylinderGeometry(0.032, 0.029, 0.085, 18), juice, gl, 0, 0.043, 0);
    const cp = new THREE.Group(); cp.position.set(0.09, 0.012, 0.02); P.whole.add(cp);
    mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.008, 20), china, cp, 0, 0.004, 0);
    mesh(new THREE.CylinderGeometry(0.04, 0.03, 0.05, 18), china, cp, 0, 0.033, 0);
    mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.004, 18), mat("#6b3b17"), cp, 0, 0.056, 0);
    return { grip: 0 };
  },

  blob(P) {
    const S = P.spec, m = mat(S.color ?? "#7a4316", { roughness: 0.15, emissive: S.color ?? "#7a4316", emissiveIntensity: 0.15 });
    const b = mesh(new THREE.SphereGeometry(S.r ?? 0.045, 20, 16), m, P.whole); b.castShadow = false;
    const hi = mesh(new THREE.SphereGeometry((S.r ?? 0.045) * 0.25, 8, 6), new THREE.MeshBasicMaterial({ color: "#fff4e0" }), b, -(S.r ?? 0.045) * 0.4, (S.r ?? 0.045) * 0.45, (S.r ?? 0.045) * 0.6);
    hi.material.userData.noOutline = true; hi.castShadow = false;
    steam(P.whole);
    return {
      grip: 0,
      apply(ps, t = 0) {
        const f = clamp(ps.fill), w = clamp(ps.wobble);
        b.visible = f > 0.02;
        const k = 1 + 0.18 * w * Math.sin(t * 13), j = 1 - 0.14 * w * Math.sin(t * 13);
        b.scale.set(f * k, f * j, f * (0.5 * (k + j)));
      },
    };
  },

  pillow(P) {
    const m = mat("#f3f3f7", { roughness: 0.9 });
    const g = mesh(new THREE.SphereGeometry(0.2, 18, 12), m, P.whole); g.scale.set(1, 0.42, 0.75);
    return { grip: 0 };
  },

  magazine(P) {
    const cover = mat("#4f9be0", { roughness: 0.6 }), page = mat("#f7f4ec", { roughness: 0.8 }), cloud = mat("#ffffff", { roughness: 0.8 });
    for (const sx of [-1, 1]) {
      const h = new THREE.Group(); h.rotation.z = sx * 0.35; P.whole.add(h);
      mesh(new THREE.BoxGeometry(0.2, 0.004, 0.27), cover, h, sx * 0.1, 0, 0);
      mesh(new THREE.BoxGeometry(0.19, 0.004, 0.26), page, h, sx * 0.1, 0.004, 0);
      mesh(new THREE.SphereGeometry(0.03, 8, 6), cloud, h, sx * 0.12, -0.004, 0.05).scale.set(1.6, 0.15, 0.8);
    }
    return { grip: 0 };
  },

  rowback(P) {
    const S = P.spec, n = S.n ?? 3, gap = S.gap ?? 0.85, fab = mat(FABRIC, { roughness: 0.9 }), shell = mat("#cfcac0", { roughness: 0.6 }), tray = mat("#bdb7ab", { roughness: 0.6 });
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap, g = new THREE.Group(); g.position.x = x; g.rotation.x = rad(-8); P.whole.add(g);
      mesh(softBox(0.66, 0.98, 0.16, 0.06), fab, g, 0, 0.9, 0.02);
      mesh(softBox(0.6, 0.62, 0.03, 0.03), shell, g, 0, 0.82, -0.105);       // the back's shell (it faces the row behind)
      mesh(softBox(0.42, 0.3, 0.02, 0.02), tray, g, 0, 0.74, -0.125);        // the tray table, folded up
    }
    return { grip: 0 };
  },
};
