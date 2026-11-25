import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp, rng } from "./util.js";
import { basic, mesh, canvasTex } from "./props-trend.js";

// Kid vs Dad 05 "Carrots" T4: the night hall and Tato's room (design: storyboards/series/kid-vs-dad/05-carrots/DESIGN.md sections 7 to 9).
// Metres before spec.scale. Deterministic: every board joint, knot and star comes from a fixed table or a seeded rng; the two
// moving things (door, light strip) are pure functions of the tween keys; no material opacity is ever tweened.
//
//   kidhall      the hall and Tato's room as ONE prop. Place it at world (200, 0, 0), rot 0: that is frame H (every x, z below is H;
//                the kitchen frame K stays at the origin, 200 m away). +z toward the camera, +x screen right. Unlit painted materials
//                (MeshBasic, no ink line), so the night grade and `lights` 0.15 cannot sink it to black. Three walls and a floor,
//                open toward +z, west (x -5.6) and above. spec keys (all optional): open 0 (the door, 0 shut .. 1 = 100 degrees into
//                the hall), strip 0 (the light under the door, 0 off .. 1 on). Both tween: c.prop(t, "hall", { open: 1 }, dur).
//                Size 9.0 x 3.2 floor, walls 2.6 high. Origin: x 0 is 5.6 from the room's west edge, y 0 the floor, z 0 mid-depth.
//     Floor      x -5.6 .. +3.4, z -1.4 .. +1.8, y 0. Boards along x 0.16 wide `#3b4470`, joints `#2c3359`, 14 knots.
//     Back wall  z -1.4, 2.6 high `#44558f`, skirting 0.10 `#2f3a68`, picture rail y 1.9; frames 0.22 x 0.28 at x -0.6, -0.1, +2.2, y 1.35.
//     End wall   x +3.4 (hall side), a dark arch 1.0 x 2.0 `#161d3c` at z +0.2: the way to the kitchen. Nothing stands behind it.
//     Partition  x -2.0, 0.10 thick, z -1.4 .. +1.8. Hall = x -2.0 .. +3.4, Tato's room = x -5.6 .. -2.0.
//     Door       in the partition, centre z +0.10, hinge on the -z edge (x -2.0, z -0.33), free edge z +0.53. Leaf 0.86 x 1.90 x 0.05,
//                y 0.022 .. 1.922 (a 2.2 cm gap under it), six raised panels, brass ball knob r 0.035 at y 0.80 on both faces
//                (z +0.44, 0.11 above Tato's crown), casing 0.08. `open` swings it toward +x. Solid only while open < 0.5.
//     Strip      `strip` 0..1: on the ROOM side (x < -2.0), a bar 0.80 x 0.022 `#ffd58a` in the gap and a 3-band floor fan 0.80 wide at
//                the door to 1.10 wide, 0.45 long (to x -2.48), `#b98f5a` / `#947c69` / `#6f6a78`; colours scale with the key, 0 hides
//                both. Hidden too once `open` passes 0.3 (the gap is then no gap).
//     Windows    W1 on the back wall at x +0.9 (hall), W2 at x -3.4 (room): 0.90 x 1.00, centre y 1.45, frame 0.07 `#27305a`, cross bar.
//                Painted sky `#1d2f6e` to `#3a55a8`, crescent, 12 stars, 2 trees. Moon patches under each: x +-0.45 at the wall to
//                +-0.60 at z +0.30, `#6177bd`, bar shadow `#3b4470`.
//     Room       a wall shelf at x -4.6, y 1.45 (4 blank spines, a toy rocket 0.22 tall).
//   Solid: back wall, end wall, partition, door leaf, frames, shelf (closed boxes). Floor, patches, strip, sky: not solid.
//   Cameras must stay outside the walls (back wall z < -1.4 side and end wall x > 3.4). Nobody is placed inside the partition (x -2.05 .. -1.95).
//
//   floortoys    the seven floor toys, static, each solid, one prop (place it at H like the hall: world (200, 0, 0)).
//                spec.items [[x, z, type, rotDeg, color?]] in H; default = DESIGN section 7's table: (0.20, 0.25) is NOT here (that is
//                `toyblock`); (-0.70, -0.50) and (2.10, 0.20) block `#e8b93a`, (-0.20, 1.10) block `#d8452e`, (-0.90, 0.75) car rot 25,
//                (1.50, 0.95) ball, (1.30, -0.80) dino rot -30. rotDeg = turn about y (positive = counter-clockwise from above).
//                Types (each sits on the floor, origin at its floor point): block cube 0.09 (corner r 0.008; color = item[4] or spec.color
//                `#e8b93a`); car 0.22 long (x at rot 0) x 0.10 high x 0.09 wide, body `#4f7fc8`, cabin `#bcd7f2`, 4 wheels r 0.028;
//                ball r 0.11, 6 gores `#d8452e` / `#f4f1ea` / `#4f7fc8`; dino 0.28 long x 0.26 high x 0.10 wide, FRONT toward +z at
//                rot 0 (so rot -30 faces the lens, a little to screen right), `#4f9a5a`, 5 back plates `#3b7a46`, a dot eye each side.
//                Toy parts are MeshStandard with their own glow (they read at night; they take the toon ink line). Not held.
//   toyblock     the one red cube 0.09 `#d8452e` he steps on. Origin: the middle of its underside (y 0 floor), so `tip` (degrees,
//                the engine's usual prop tip) tips it about that point: at tip 10 raise it 0.008 (y) so no corner sinks. Not held.
export const HALL = {
  floor: { x0: -5.6, x1: 3.4, z0: -1.4, z1: 1.8 }, wallH: 2.6, partX: -2.0,
  door: { z0: -0.33, z1: 0.53, w: 0.86, h: 1.9, gap: 0.022, knobY: 0.8 }, w1: 0.9, w2: -3.4,
  toys: [[-0.7, -0.5, "block", 0, "#e8b93a"], [2.1, 0.2, "block", 0, "#e8b93a"], [-0.2, 1.1, "block", 0, "#d8452e"], [-0.9, 0.75, "car", 25], [1.5, 0.95, "ball", 0], [1.3, -0.8, "dino", -30]],
  block: [0.2, 0.25],
};
const rad = (d) => (d * Math.PI) / 180;
const C = { wall: "#44558f", skirt: "#2f3a68", frame: "#2a325c", field: "#5b6aa3", floor: "#3b4470", joint: "#2c3359", door: "#36437a", edge: "#5a6db0", casing: "#2b3560", brass: "#b9975a", arch: "#161d3c", win: "#27305a", patch: "#6177bd" };

const box = (w, h, d, m, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z);
const deco = (o) => { o.userData.solid = false; o.castShadow = o.receiveShadow = false; return o; };
// a flat convex polygon lying on the floor, points [x, z]
function poly(pts, m, y, parent) {
  const g = new THREE.BufferGeometry(), v = [];
  for (let i = 1; i < pts.length - 1; i++) for (const p of [pts[0], pts[i], pts[i + 1]]) v.push(p[0], y, p[1]);
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  m.side = THREE.DoubleSide;
  const o = new THREE.Mesh(g, m); parent.add(o); return deco(o);
}

function floorTexture(f) {
  const PX = 200, W = Math.round((f.x1 - f.x0) * PX), H = Math.round((f.z1 - f.z0) * PX), BW = Math.round(0.16 * PX);
  return canvasTex(W, H, (g) => {
    g.fillStyle = C.floor; g.fillRect(0, 0, W, H);
    const tone = ["rgba(255,255,255,0.00)", "rgba(255,255,255,0.035)", "rgba(0,0,0,0.045)", "rgba(255,255,255,0.02)"];
    for (let i = 0; i * BW < H; i++) {
      const y = i * BW; g.fillStyle = tone[i % 4]; g.fillRect(0, y, W, BW);
      g.fillStyle = C.joint; g.fillRect(0, y, W, 2);                                           // the long joint
      const off = (((i * 7) % 11) / 11) * 1.8 * PX;                                            // butt joints every 1.8 m, staggered
      for (let x = off; x < W; x += 1.8 * PX) g.fillRect(Math.round(x), y, 2, BW);
    }
    const r = rng(14);                                                                         // 14 knots, each placed once
    for (let k = 0; k < 14; k++) {
      const x = 20 + r() * (W - 40), b = Math.floor(r() * Math.floor(H / BW)), y = b * BW + BW * (0.35 + 0.3 * r());
      g.fillStyle = "#333c66"; g.strokeStyle = C.joint; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 8 + 3 * r(), 4 + 1.5 * r(), 0, 0, Math.PI * 2); g.fill(); g.stroke();
    }
  });
}

const STARS = [[0.12, 0.10], [0.30, 0.22], [0.45, 0.08], [0.58, 0.28], [0.72, 0.13], [0.20, 0.38], [0.38, 0.45], [0.64, 0.42], [0.83, 0.34], [0.09, 0.55], [0.52, 0.55], [0.90, 0.52]];
function skyTexture() {
  return canvasTex(270, 300, (g, w, h) => {
    const sky = g.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, "#1d2f6e"); sky.addColorStop(1, "#3a55a8");
    g.fillStyle = sky; g.fillRect(0, 0, w, h);
    g.fillStyle = "#f3ecc8";
    for (const [u, v] of STARS) { const x = u * w, y = v * h; g.fillRect(x - 1, y - 3, 2, 6); g.fillRect(x - 3, y - 1, 6, 2); }
    g.save(); g.beginPath(); g.arc(200, 70, 27, 0, Math.PI * 2); g.fill(); g.clip();           // the crescent: a disc minus a shifted disc of sky
    g.fillStyle = sky; g.beginPath(); g.arc(212, 62, 24, 0, Math.PI * 2); g.fill(); g.restore();
    g.fillStyle = "#16224f";                                                                   // two trees at the sill
    for (const [x, s] of [[45, 1.0], [225, 0.8]]) {
      g.fillRect(x - 5 * s, h - 95 * s, 10 * s, 95 * s);
      for (const [dx, dy, rx, ry] of [[0, -100, 38, 30], [-20, -80, 28, 24], [20, -82, 30, 24]]) { g.beginPath(); g.ellipse(x + dx * s, h + dy * s, rx * s, ry * s, 0, 0, Math.PI * 2); g.fill(); }
    }
  });
}

export const CARROTS_HALL_KINDS = {
  kidhall(P) {
    const F = HALL.floor, W = F.x1 - F.x0, D = F.z1 - F.z0, H = HALL.wallH, PX = HALL.partX, DR = HALL.door;
    const paint = (hex) => basic({ color: hex });
    const wallM = paint(C.wall), skirtM = paint(C.skirt), frameM = paint(C.frame), fieldM = paint(C.field), casingM = paint(C.casing), winM = paint(C.win);
    const whole = P.whole;

    // ---- floor
    const fm = basic({ map: floorTexture(F) });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), fm); floor.rotation.x = -Math.PI / 2; floor.position.set((F.x0 + F.x1) / 2, 0, (F.z0 + F.z1) / 2); whole.add(floor); deco(floor);

    // ---- walls (closed boxes, the faces on the lines the design gives)
    const back = box(W, H, 0.06, wallM, (F.x0 + F.x1) / 2, H / 2, F.z0 - 0.03, whole);
    const end = box(0.06, H, D, wallM, F.x1 + 0.03, H / 2, (F.z0 + F.z1) / 2, whole);
    const dz0 = DR.z0, dz1 = DR.z1, oh = DR.gap + DR.h + 0.008;                                // the doorway: z -0.33 .. 0.53, y 0 .. 1.93
    box(0.10, H, dz0 - F.z0, wallM, PX, H / 2, (F.z0 + dz0) / 2, whole);
    box(0.10, H, F.z1 - dz1, wallM, PX, H / 2, (dz1 + F.z1) / 2, whole);
    box(0.10, H - oh, dz1 - dz0, wallM, PX, (H + oh) / 2, (dz0 + dz1) / 2, whole);
    // skirting 0.10 and the picture rail (y 1.9) along the back wall; skirting on the end wall and both partition faces
    box(W, 0.10, 0.012, skirtM, (F.x0 + F.x1) / 2, 0.05, F.z0 + 0.006, whole);
    box(W, 0.03, 0.01, skirtM, (F.x0 + F.x1) / 2, 1.9, F.z0 + 0.005, whole);
    box(0.012, 0.10, D, skirtM, F.x1 - 0.006, 0.05, (F.z0 + F.z1) / 2, whole);
    for (const s of [-1, 1]) {
      const x = PX + s * 0.056;
      box(0.012, 0.10, dz0 - F.z0, skirtM, x, 0.05, (F.z0 + dz0) / 2, whole);
      box(0.012, 0.10, F.z1 - dz1, skirtM, x, 0.05, (dz1 + F.z1) / 2, whole);
    }
    // the dark arch in the end wall: 1.0 wide x 2.0 high with a round top, and a lighter casing round it
    const arch = (w, h, hex, dx) => {
      const r = w / 2, s = new THREE.Shape(); s.moveTo(-r, 0); s.lineTo(-r, h - r); s.absarc(0, h - r, r, Math.PI, 0, true); s.lineTo(r, 0); s.lineTo(-r, 0);
      const o = new THREE.Mesh(new THREE.ShapeGeometry(s, 16), paint(hex)); o.rotation.y = -Math.PI / 2; o.position.set(F.x1 - dx, 0, 0.2); whole.add(o); return deco(o);
    };
    arch(1.12, 2.06, C.casing, 0.002); arch(1.0, 2.0, C.arch, 0.004);
    // three frames on the back wall (a dark border, a plain lighter field)
    for (const x of [-0.6, -0.1, 2.2]) {
      box(0.22, 0.28, 0.02, frameM, x, 1.35, F.z0 + 0.01, whole);
      box(0.15, 0.21, 0.004, fieldM, x, 1.35, F.z0 + 0.0225, whole).userData.solid = false;
    }

    // ---- windows and moon patches
    const sky = basic({ map: skyTexture() });
    const patchM = paint(C.patch), barM = paint(C.floor);
    for (const wx of [HALL.w1, HALL.w2]) {
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.0), sky); gl.position.set(wx, 1.45, F.z0 + 0.004); whole.add(gl); deco(gl);
      for (const s of [-1, 1]) {
        box(0.07, 1.14, 0.03, winM, wx + s * 0.485, 1.45, F.z0 + 0.015, whole);
        box(1.04, 0.07, 0.03, winM, wx, 1.45 + s * 0.535, F.z0 + 0.015, whole);
      }
      box(0.04, 1.0, 0.02, winM, wx, 1.45, F.z0 + 0.02, whole); box(0.9, 0.04, 0.02, winM, wx, 1.45, F.z0 + 0.02, whole);
      box(1.12, 0.03, 0.09, skirtM, wx, 0.90, F.z0 + 0.045, whole);                           // the sill
      // the patch on the floor: 0.9 wide at the wall to 1.2 wide at z +0.30; the bar shadow runs down it, one cross band
      const zE = 0.3, hw = (z) => 0.45 + (0.15 * (z - F.z0)) / (zE - F.z0);
      poly([[wx - 0.45, F.z0], [wx + 0.45, F.z0], [wx + hw(zE), zE], [wx - hw(zE), zE]], patchM, 0.004, whole);
      poly([[wx - 0.022, F.z0], [wx + 0.022, F.z0], [wx + 0.03, zE], [wx - 0.03, zE]], barM, 0.007, whole);
      const zb = -0.6; poly([[wx - hw(zb), zb - 0.03], [wx + hw(zb), zb - 0.03], [wx + hw(zb + 0.07), zb + 0.04], [wx - hw(zb + 0.07), zb + 0.04]], barM, 0.007, whole);
    }

    // ---- the shelf in the room
    const shelfM = paint("#6a5a48"), z0s = F.z0 + 0.11;
    box(0.80, 0.03, 0.22, shelfM, -4.6, 1.45, z0s, whole);
    for (const s of [-0.3, 0.3]) box(0.03, 0.10, 0.12, shelfM, -4.6 + s, 1.395, F.z0 + 0.06, whole);
    [[-0.34, 0.045, 0.19, "#d8452e"], [-0.285, 0.04, 0.16, "#e8b93a"], [-0.24, 0.05, 0.2, "#4f9a5a"], [-0.185, 0.038, 0.17, "#b8c4ee"]].forEach(([dx, w, h, hex]) => {
      box(w, h, 0.13, paint(hex), -4.6 + dx, 1.465 + h / 2, z0s, whole);                       // blank spines
    });
    const rk = new THREE.Group(); rk.position.set(-4.6 + 0.22, 1.465, z0s); whole.add(rk);       // toy rocket 0.22: body 0.15, nose 0.05, fins to 0.04
    const cyl = (r0, r1, h, hex, y) => mesh(new THREE.CylinderGeometry(r0, r1, h, 14), paint(hex), rk, 0, y, 0);
    cyl(0.035, 0.035, 0.15, "#a9aebf", 0.075); mesh(new THREE.ConeGeometry(0.035, 0.07, 14), paint("#d8452e"), rk, 0, 0.185, 0);
    for (let i = 0; i < 3; i++) { const a = (i * Math.PI * 2) / 3, f = box(0.012, 0.05, 0.04, paint("#d8452e"), Math.cos(a) * 0.04, 0.03, Math.sin(a) * 0.04, rk); f.rotation.y = -a; }

    // ---- the door: a leaf on its hinge, six raised panels each face, brass ball knobs
    const hinge = new THREE.Group(); hinge.position.set(PX, 0, dz0); whole.add(hinge);
    const leafMeshes = [], leafM = paint(C.door), edgeM = paint(C.edge), brassM = paint(C.brass);
    const Lw = DR.w, Lh = DR.h, y0 = DR.gap;
    leafMeshes.push(box(0.05, Lh, Lw, leafM, 0, y0 + Lh / 2, Lw / 2, hinge));
    for (const s of [-1, 1]) {
      for (const zc of [0.20, 0.52]) for (const yc of [0.46, 0.99, 1.50]) {
        const px = s * (0.025 + 0.006);
        leafMeshes.push(box(0.012, 0.44, 0.28, leafM, px, y0 + yc, zc, hinge));
        leafMeshes.push(box(0.014, 0.006, 0.28, edgeM, px + s * 0.001, y0 + yc + 0.217, zc, hinge));   // lit top edge
        leafMeshes.push(box(0.014, 0.44, 0.006, edgeM, px + s * 0.001, y0 + yc, zc - 0.137, hinge));    // lit hinge-side edge
      }
      leafMeshes.push(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.04, 8), brassM, hinge, s * 0.045, DR.knobY, 0.77));
      leafMeshes[leafMeshes.length - 1].rotation.z = Math.PI / 2;
      leafMeshes.push(mesh(new THREE.SphereGeometry(0.035, 16, 12), brassM, hinge, s * 0.085, DR.knobY, 0.77));
    }
    // casing 0.08 round the doorway on both faces (it stands 0.012 proud of the partition)
    const cz = (dz0 + dz1) / 2;
    for (const [w, h, d, y, z] of [[0.124, 1.93 + 0.08, 0.08, (1.93 + 0.08) / 2, dz0 - 0.04], [0.124, 1.93 + 0.08, 0.08, (1.93 + 0.08) / 2, dz1 + 0.04], [0.124, 0.08, dz1 - dz0, 1.93 + 0.04, cz]]) box(w, h, d, casingM, PX, y, z, whole);

    // ---- the light strip under the door, room side
    const stripG = new THREE.Group(); whole.add(stripG);
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(0.80, 0.022), basic({ color: "#ffd58a" }));
    bar.rotation.y = -Math.PI / 2; bar.position.set(PX - 0.001, 0.011, (dz0 + dz1) / 2 - 0.0); stripG.add(bar); deco(bar);
    const bands = ["#b98f5a", "#947c69", "#6f6a78"].map((hex, i) => {
      const w = (x) => 0.4 + (0.15 * Math.abs(x - (PX - 0.026))) / 0.45, xa = PX - 0.026 - i * 0.15, xb = xa - 0.15, zc = (dz0 + dz1) / 2;
      const m = basic({ color: hex }); poly([[xa, zc - w(xa)], [xa, zc + w(xa)], [xb, zc + w(xb)], [xb, zc - w(xb)]], m, 0.005, stripG); return [m, new THREE.Color(hex)];
    });
    stripG.visible = false;

    return {
      grip: 0,
      apply(ps) {
        const open = clamp(ps.open ?? P.spec.open ?? 0), strip = clamp(ps.strip ?? P.spec.strip ?? 0);
        hinge.rotation.y = rad(100) * open;
        for (const o of leafMeshes) o.userData.solid = open < 0.5;
        stripG.visible = strip > 0.01 && open < 0.3;
        bar.material.color.set("#ffd58a").multiplyScalar(strip);
        for (const [m, c] of bands) m.color.copy(c).multiplyScalar(strip);
      },
    };
  },

  floortoys(P) {
    const items = P.spec.items ?? HALL.toys, dflt = P.spec.color ?? "#e8b93a";
    const toy = (hex, rough = 0.5, glow = 0.55) => { const m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, emissive: new THREE.Color(hex), emissiveIntensity: glow }); return m; };
    const make = (type, color) => {
      const g = new THREE.Group();
      if (type === "block") mesh(new RoundedBoxGeometry(0.09, 0.09, 0.09, 2, 0.008), toy(color), g, 0, 0.045, 0);
      else if (type === "car") {
        mesh(new RoundedBoxGeometry(0.22, 0.04, 0.08, 2, 0.01), toy("#4f7fc8"), g, 0, 0.048, 0);
        mesh(new RoundedBoxGeometry(0.11, 0.04, 0.074, 2, 0.012), toy("#bcd7f2", 0.5, 0.12), g, -0.01, 0.08, 0);
        for (const sx of [-0.07, 0.07]) for (const sz of [-0.038, 0.038]) { const w = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.014, 16), toy("#232a45", 0.7, 0.9), g, sx, 0.028, sz); w.rotation.x = Math.PI / 2; }
      } else if (type === "ball") {
        mesh(new THREE.SphereGeometry(0.11, 24, 16), toy("#f4f1ea", 0.5, 0.12), g, 0, 0.11, 0);              // the white gores are this sphere
        [["#d8452e", 0], ["#4f7fc8", 2], ["#d8452e", 3], ["#4f7fc8", 5]].forEach(([hex, i]) => {
          const s = mesh(new THREE.SphereGeometry(0.1103, 10, 16, (i * Math.PI) / 3, Math.PI / 3), toy(hex, 0.5, 0.4), g, 0, 0.11, 0); s.userData.solid = false; s.castShadow = false;
        });
      } else if (type === "dino") {
        const body = toy("#4f9a5a"), plate = toy("#3b7a46");
        const ell = (rx, ry, rz, x, y, z, m = body) => { const o = mesh(new THREE.SphereGeometry(1, 16, 12), m, g, x, y, z); o.scale.set(rx, ry, rz); return o; };
        ell(0.05, 0.055, 0.07, 0, 0.10, -0.01);                                                    // body, z -0.08 .. 0.06
        for (const sx of [-0.032, 0.032]) { mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.06, 10), body, g, sx, 0.03, -0.01); ell(0.026, 0.012, 0.035, sx, 0.012, 0.005); }
        const neck = mesh(new THREE.CylinderGeometry(0.026, 0.04, 0.107, 10), body, g, 0, 0.1775, 0.075); neck.rotation.x = rad(28);
        ell(0.04, 0.036, 0.045, 0, 0.228, 0.095);                                                  // head: front z 0.14, top y 0.264
        const tail = mesh(new THREE.ConeGeometry(0.04, 0.08, 10), body, g, 0, 0.08, -0.104); tail.rotation.x = rad(-101);   // base at the body, point to z -0.143
        [[0.04, 0.158], [0.01, 0.168], [-0.03, 0.162], [-0.065, 0.145], [-0.10, 0.115]].forEach(([z, y], i) => { const c = mesh(new THREE.ConeGeometry(0.018, 0.04, 3), plate, g, 0, y, z); c.rotation.x = rad(-i * 8); });
        for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.008, 8, 6), toy("#1b2230", 0.5, 0.3), g, sx * 0.037, 0.238, 0.118);
      }
      return g;
    };
    for (const [x, z, type, rot, color] of items) { const g = make(type, color ?? dflt); g.position.set(x, 0, z); g.rotation.y = rad(rot ?? 0); P.whole.add(g); }
    return { grip: 0 };
  },

  toyblock(P) {
    const m = new THREE.MeshStandardMaterial({ color: "#d8452e", roughness: 0.5, emissive: new THREE.Color("#d8452e"), emissiveIntensity: 0.55 });
    mesh(new RoundedBoxGeometry(0.09, 0.09, 0.09, 2, 0.008), m, P.whole, 0, 0.045, 0);
    return { grip: 0 };
  },
};
