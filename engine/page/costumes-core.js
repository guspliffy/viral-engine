import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ring, onSurface } from "./costumes-cast.js";

// The Core Five redesign (Jonny's design handoff, 5 Nov 2026; characters/core-five-2026/*.json, def.build "core"): the
// clothes and gear of the humanoid cast. potato.js builds the torso (def.body), the separate head with its face
// (def.head) and the limbs; this file dresses them. Sides are anatomical: the character's RIGHT is -x, LEFT +x, forward +z.
// Returns the same object costumes.js buildCostume returns, so stage.js, the checks and the timeline read it the same way.

const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, ...o });
const mesh = (g, m, shadow = true) => { const x = new THREE.Mesh(g, m); x.castShadow = shadow; x.receiveShadow = true; return x; };

export function coreCostume(def, ch) {
  const C = def.costume || {};
  const out = { tip: null, prop: null, hat: null, hatBrim: null, helmet: null, propAxis: () => null, propLine: () => null, apply() {} };
  const build = CORE[C.type];
  if (!build) throw new Error(`core build: no costume "${C.type}" (costumes-core.js knows ${Object.keys(CORE).join(", ")})`);
  const live = build(C, ch, out) || [];
  out.apply = (st, t, hands, fries) => { for (const f of live) f(st, t, hands, fries); };
  return out;
}

// boots for a core character: the foot becomes a rounded boot with its own sole, standing on the floor (the foot's
// centre stays 3.5 cm up, where the gait puts it)
function boots(ch, upper, sole, o = {}) {
  const [w, h, d] = o.size || [0.085, 0.062, 0.115];
  for (const s of ["R", "L"]) {
    const f = ch.legs[s].foot;
    const g = new THREE.SphereGeometry(1, 28, 18); g.scale(w, h, d); g.translate(0, 0.022, 0.018);
    f.geometry.dispose(); f.geometry = g; f.material = upper; f.scale.set(1, 1, 1);
    const sl = mesh(new THREE.CylinderGeometry(1, 1, 1, 28), sole); sl.scale.set(w * 1.04, 0.022, d * 1.03); sl.position.set(0, -0.022, 0.018); f.add(sl);
  }
}

// a band round a limb at point u along its curve (the wrist or the ankle), rebuilt per frame from the limb's ends
const _y = new THREE.Vector3(0, 1, 0);
function bandAt(m, a, b, r) { const dir = b.clone().sub(a).normalize(); m.position.copy(a); m.quaternion.setFromUnitVectors(_y, dir); m.scale.setScalar(r); }

const CORE = {
  // ASTRONAUT: a compact golden humanoid in an ivory padded suit. A clear dome on a graphite collar seal round the head
  // (the head turns inside it), a compact backpack, ONE hose from the RIGHT backpack port to the rear-right collar port,
  // the green two-leaf patch on the LEFT chest, one blue button on the RIGHT chest, dark wrist and ankle bands, broad
  // ivory boots with graphite soles. No head sprout.
  astronaut(C, ch, out) {
    const P = ch.potatoParts, H = ch.head, suit = ch.body.material;
    const hw = std(C.hardware || "#51545A", { roughness: 0.42, metalness: 0.45 }), seam = std(C.seam || "#cfc8b8", { roughness: 0.8 });
    const top = ch.cy + ch.ry;   // the torso's top: the collar seal sits on it
    // collar seal: a thick graphite ring with a lip, the dome's seat
    const collarY = top - 0.012, cr = Math.max(H.rx, H.rz) * 0.86;
    const collar = mesh(new THREE.TorusGeometry(cr, 0.024, 14, 48), hw); collar.rotation.x = Math.PI / 2; collar.position.y = collarY; P.add(collar);
    const lip = mesh(new THREE.CylinderGeometry(cr * 1.02, cr * 1.1, 0.045, 48, 1, true), hw); lip.position.y = collarY - 0.02; P.add(lip);
    // the dome: a clear glass sphere round the head, cut where it meets the collar (it doesn't turn with the head)
    const R = Math.max(H.rx, H.ry, H.rz) * 1.12 + (C.domeGap ?? 0.05), yc = collarY - H.cy, cut = Math.acos(Math.max(-0.99, Math.min(0.99, yc / R)));
    if (C.helmet !== false) {
      const glass = new THREE.Mesh(new THREE.SphereGeometry(R, 48, 32, 0, Math.PI * 2, 0, cut), new THREE.MeshPhysicalMaterial({ color: "#e4f4ff", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }));
      glass.position.set(0, H.cy, H.group.position.z); glass.userData.noOutline = true; P.add(glass);
      // the rim of the glass where it meets the seal, and one curved highlight at the dome's upper edge (never over the eyes)
      const rimR = Math.sqrt(Math.max(0, R * R - yc * yc));
      const rim = mesh(new THREE.TorusGeometry(rimR, 0.012, 10, 48), std("#d8dde2", { roughness: 0.3, metalness: 0.3 })); rim.rotation.x = Math.PI / 2; rim.position.set(0, collarY + 0.02, H.group.position.z); P.add(rim);
      const hl = new THREE.Mesh(new THREE.TorusGeometry(R * 0.985, 0.006, 6, 40, 0.75), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.55, depthWrite: false }));
      hl.userData.noOutline = true; hl.position.copy(glass.position); hl.rotation.set(0.25, -0.55, 0.95); P.add(hl);
      out.helmet = { mesh: glass, r: R };
      // the comm pucks on the dome's sides, low (the sheet), graphite with a lighter cap
      for (const sd of [-1, 1]) {
        const ear = new THREE.Group(), y = -0.06, x = Math.sqrt(Math.max(0, R * R - y * y)) - 0.012;
        const d = mesh(new THREE.CylinderGeometry(0.05, 0.056, 0.04, 28), hw); ear.add(d);
        const cap = mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.02, 20), std("#7b7f86", { roughness: 0.4, metalness: 0.4 })); cap.position.y = 0.026; ear.add(cap);
        ear.rotation.z = -sd * Math.PI / 2; ear.position.set(sd * x, H.cy + y, H.group.position.z); P.add(ear);
      }   // potato.js contact(): a raised arm must not run up inside the glass
    }
    // backpack: a compact rounded box on the back with two side vents, and a RIGHT side port
    const pack = mesh(new RoundedBoxGeometry(ch.rx * 1.4, ch.ry * 1.55, 0.17, 3, 0.04), std(C.pack || "#ddd6c6", { roughness: 0.65 }));
    const packZ = -ch.rz - 0.035, packY = ch.cy + ch.ry * 0.12; pack.position.set(0, packY, packZ); P.add(pack);
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const v = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.09), hw, false); v.position.set(sd * ch.rx * 0.74, packY + 0.06 - i * 0.04, packZ); P.add(v); }
    const port = (x, y, z) => { const p = mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.03, 16), hw); p.position.set(x, y, z); return p; };
    const pA = new THREE.Vector3(-ch.rx * 0.62, packY + ch.ry * 0.55, packZ - 0.02), pB = new THREE.Vector3(-cr * 0.62, collarY - 0.005, -cr * 0.72);
    const portA = port(pA.x, pA.y, pA.z); portA.rotation.x = Math.PI / 2; P.add(portA);
    const portB = port(pB.x, pB.y, pB.z); portB.rotation.set(Math.PI / 2 - 0.5, 0, 0.35); P.add(portB);
    // the hose: one continuous corrugated tube between the two ports, bowing out behind the right shoulder
    const hose = new THREE.CatmullRomCurve3([pA.clone().add(new THREE.Vector3(0, 0, -0.01)), pA.clone().add(new THREE.Vector3(-0.07, 0.05, -0.08)), pB.clone().add(new THREE.Vector3(-0.08, 0.02, -0.1)), pB.clone()]);
    P.add(mesh(new THREE.TubeGeometry(hose, 40, 0.017, 10), hw));
    for (let i = 1; i < 12; i++) { const c = mesh(new THREE.TorusGeometry(0.019, 0.004, 6, 14), hw, false); const p = hose.getPointAt(i / 12), d = hose.getTangentAt(i / 12); c.position.copy(p); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d); P.add(c); }
    // suit seams: a padded band round the middle and a soft yoke under the collar
    P.add(ring(ch, -0.2, 0.02, std(C.belt || "#bdb4a2", { roughness: 0.75 }), 0.008));
    P.add(ring(ch, 0.55, 0.009, seam, 0.004));
    // the LEFT chest patch: a round green badge with an ivory edge and two leaves; the RIGHT chest blue button
    const patch = new THREE.Group();
    patch.add(mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.008, 32), std("#efe9da", { roughness: 0.8 }), false));
    const pg = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.01, 32), std(C.patch || "#6D9144", { roughness: 0.8 }), false); pg.position.y = 0.002; patch.add(pg);
    const leafM = std("#cfe6a8", { roughness: 0.7 });
    for (const sd of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(1, 16, 10), leafM, false); l.scale.set(0.012, 0.004, 0.022); l.position.set(sd * 0.012, 0.007, -0.006); l.rotation.y = sd * 0.75; patch.add(l); }
    const stem = mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.026, 6), leafM, false); stem.rotation.x = Math.PI / 2; stem.position.set(0, 0.007, 0.012); patch.add(stem);
    patch.rotation.y = Math.PI;   // the leaves point up the chest
    P.add(onSurface(ch, patch, 0.48, 0.28, 0.008));
    const btn = new THREE.Group();
    btn.add(mesh(new THREE.CylinderGeometry(0.03, 0.033, 0.018, 24), std(C.button || "#4277A0", { roughness: 0.35 })));
    const bRim = mesh(new THREE.TorusGeometry(0.034, 0.006, 8, 24), hw, false); bRim.rotation.x = Math.PI / 2; btn.add(bRim);
    P.add(onSurface(ch, btn, -0.45, 0.3, 0.01));
    boots(ch, std(C.boot || "#ece6d8", { roughness: 0.65 }), std(C.sole || "#51545A", { roughness: 0.6 }), { size: C.bootSize });
    // dark flexible bands at the wrists and the ankles, following the limbs every frame
    const bandG = new THREE.TorusGeometry(1, 0.22, 10, 28); bandG.rotateX(Math.PI / 2);
    const wr = { R: mesh(bandG, hw), L: mesh(bandG, hw) }, an = { R: mesh(bandG, hw), L: mesh(bandG, hw) };
    for (const s of ["R", "L"]) { ch.root.add(wr[s]); ch.root.add(an[s]); }
    const lw = ch.def.legs?.width ?? ch.limbW * 1.1;
    // the padded suit's quilting: soft rings round the arms and legs between the puffs (the sheet's michelin limbs), a
    // Placed along each limb's own curve every frame, sized to the tube there
    const quilt = std(C.quilt || "#d9d1bf", { roughness: 0.85 }); quilt.userData.noOutline = true;   // an ink hull on a thin ring reads as a black stripe
    const ringG = new THREE.TorusGeometry(1, 0.13, 8, 28); ringG.rotateX(Math.PI / 2);
    const AR = C.armRings || [0.3, 0.4, 0.66, 0.76], LR = C.legRings || [0.3, 0.52, 0.7];
    const rings = Object.fromEntries(["R", "L"].map((s) => [s, { arm: AR.map(() => mesh(ringG, quilt, false)), leg: LR.map(() => mesh(ringG, quilt, false)) }]));
    for (const s of ["R", "L"]) for (const m of [...rings[s].arm, ...rings[s].leg]) ch.root.add(m);
    const along = (m, curve, u, r) => { const a = curve.getPoint(u), b = curve.getPoint(Math.min(1, u + 0.02)), c = curve.getPoint(Math.max(0, u - 0.02)); bandAt(m, a, b.sub(c).add(a), r); };
    return [(st, t, hands, fries) => {
      for (const s of ["R", "L"]) {
        const A = ch.arms[s], Lg = ch.legs[s], RG = rings[s], on = !fries && !!A.elbow;
        for (const m of [...RG.arm, ...RG.leg]) m.visible = on && !!Lg.knee;
        if (!on || !Lg.knee) continue;
        const ac = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint);
        AR.forEach((u, i) => along(RG.arm[i], ac, u, ch.constructor.armRadius(u, ch.limbW) * 1.0));
        const lc = ch.constructor.armCurve(Lg.hip, Lg.knee, Lg.foot.position, false);
        LR.forEach((u, i) => along(RG.leg[i], lc, u, lw * 1.0));
      }
    }, (st, t, hands, fries) => {
      for (const s of ["R", "L"]) {
        const A = ch.arms[s];
        wr[s].visible = an[s].visible = !fries && !!A.elbow;
        if (!A.elbow) continue;
        const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), L = curve.getLength();
        // on the glove's cuff, C.cuff metres back from the hand's centre
        const u = Math.max(0.5, 1 - (C.cuff ?? 0.075) / L), a = curve.getPointAt(u), b = curve.getPointAt(Math.min(1, u + 0.05));
        bandAt(wr[s], a, b, ch.limbW * 1.18);
        const f = ch.legs[s].foot.position, k = new THREE.Vector3(f.x, f.y + 0.085, f.z);
        bandAt(an[s], k, k.clone().add(new THREE.Vector3(0, 1, 0)), lw * 1.08);
      }
    }];
  },
};
