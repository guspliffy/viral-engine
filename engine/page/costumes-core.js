import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { ring, onSurface } from "./costumes-cast.js";
import { drapeMesh, drapeInk, inkMesh, clothMat, metalMat, roll, sstep, stitches } from "./costumes-art.js";

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
    // the suit's soft neck liner inside the seal, hugging the neck: it closes the gap between the neck and the ring
    const nr = H.neck ? H.neck.geometry.parameters.radiusTop : 0.1;
    const liner = mesh(new THREE.TorusGeometry((nr + cr) / 2, (cr - nr) / 2 + 0.006, 12, 40), std(C.liner || "#e9e3d4", { roughness: 0.9 }));
    liner.rotation.x = Math.PI / 2; liner.scale.z = 0.55; liner.position.y = collarY + 0.006; P.add(liner);
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
  // REAPER: a short warm-faced night humanoid. A deep, softly asymmetric charcoal hood round the separate head (it
  // turns with the head; its skirt over the shoulders follows only part of the way, so the neck stays covered), a short
  // weighted cloak from the shoulders to the shins in broad folds, open at the front below one concentric silver clasp
  // on the upper chest, dark sleeves and gloves, trousers and substantial boots. The cloth drapes over the arms: an arm
  // under the cloak lifts it, an arm out through it opens it round the sleeve (armPush, every frame from the arm's pose).
  reaper(C, ch, out) {
    const P = ch.potatoParts, H = ch.head;
    const clothC = C.cloth || "#302B37", liningC = C.lining || "#514354";
    const top = ch.cy + ch.ry, legH = ch.legH, lw = ch.def.legs?.width ?? ch.limbW * 1.1;
    // --- the cloak: a bell from the neck over the shoulders to just above the boots (drape() on a bell surface)
    const yN = top + 0.012, yH = legH * (C.hemAt ?? 0.5), shS = C.shoulderS ?? 0.17;
    const NR = [0.118, 0.112], SR = [ch.rx + 0.06, ch.rz + 0.05], HR = [ch.rx + (C.flare ?? 0.13), ch.rz + (C.flare ?? 0.13) - 0.02];
    const bell = bellSurface({ y0: yN, y1: yH, neck: NR, shoulder: SR, hem: HR, shS });
    const open = C.open ?? 0.1;
    const cloak = drapeMesh(bell, {
      top: Math.PI / 2, hem: -Math.PI / 2, from: open, to: Math.PI * 2 - open, spread: C.spread ?? 0.42, flare: 0.03, lift: 0.0, lift0: 0, thick: 0.026, facing: 0.07,
      segs: 120, rows: 36, free: false, sheen: 1.4, rollR: 0.016, ink: { width: 0.006 }, follow: 0, grad: 0.18, valleyShade: 3,
      // broad folds: a few deep ones at the back and sides, shallower at the front panels (never in a rhythm)
      folds: C.cloakFolds || [[0.55, 0.02, 0.2], [1.1, -0.025, 0.2], [1.62, 0.04, 0.3], [2.15, -0.03, 0.2], [2.62, 0.036, 0.24], [3.0, -0.04, 0.15], [3.36, 0.05, 0.22], [3.86, -0.032, 0.19], [4.4, 0.042, 0.3], [5.0, -0.026, 0.2], [5.6, 0.02, 0.18]],
      sag: 1.1, drift: [0.03, 1.3, 2.2],
    }, clothC, liningC);
    P.add(cloak);
    // the robe under the cloak (the sheet: dark robe folds down to the boots, showing in the cloak's opening), closed,
    // from the waist to the boot tops, its own vertical folds
    const yW = ch.cy - ch.ry * 0.1, robe = drapeMesh(bellSurface({ y0: yW, y1: legH * (C.robeHem ?? 0.24), neck: [ch.rx + 0.012, ch.rz + 0.012], shoulder: [ch.rx + 0.018, ch.rz + 0.018], hem: [ch.rx + 0.05, ch.rz + 0.06], shS: 0.1 }), {
      top: Math.PI / 2, hem: -Math.PI / 2, flare: 0.015, lift: 0, lift0: 0, thick: 0.02, segs: 96, rows: 24, free: false, sheen: 1.3, rollR: 0.012, ink: { width: 0.005 }, follow: 0, grad: 0.22, valleyShade: 3,
      folds: [[0.25, 0.012, 0.16], [0.7, -0.014, 0.14], [1.3, 0.016, 0.2], [2.0, -0.012, 0.16], [2.8, 0.018, 0.24], [3.6, -0.014, 0.18], [4.3, 0.014, 0.2], [5.0, -0.012, 0.15], [5.75, 0.012, 0.18]],
      sag: 0.8, drift: [0.012, 2.1, 0.7],
    }, C.robe || "#2a2630", C.robeLining || "#1f1c24");
    P.add(robe);
    // the repair: three tidy stitches on the left front facing near the hem (the sheet's "repaired hem"), in a pale thread
    { const D = cloak.userData.drape, v = 0.82, t = D.f0(v) + 0.045, p = D.at(t, v, D.thick + 0.006), n = D.at(t, v, 1).sub(D.at(t, v, 0)).normalize(), up = D.at(t, v - 0.05, 0).sub(D.at(t, v + 0.05, 0));
      cloak.add(stitches(p, n, up, 3, 0.026, C.thread || "#b9ab94")); }
    // the clasp: a concentric silver disc on the upper chest where the two front edges meet
    const metal = metalMat(C.metal || "#A6A2A0", 0.34), clasp = new THREE.Group();
    clasp.add(mesh(new THREE.CylinderGeometry(0.046, 0.044, 0.016, 40), metal));
    for (const [r, t] of [[0.04, 0.006], [0.024, 0.005]]) { const q = mesh(new THREE.TorusGeometry(r, t, 10, 40), metal, false); q.rotation.x = Math.PI / 2; q.position.y = 0.009; clasp.add(q); }
    const boss = mesh(new THREE.SphereGeometry(0.012, 16, 10), metal, false); boss.scale.y = 0.6; boss.position.y = 0.01; clasp.add(boss);
    const cy0 = C.claspY ?? 0.09, cS = cy0 / (yN - yH), cPh = Math.PI / 2 - cS * Math.PI, cA = bell.surf(0, cPh);
    const claspAt = cA.pos.clone().addScaledVector(cA.normal, 0.034);
    clasp.position.copy(claspAt); clasp.quaternion.setFromUnitVectors(_y, cA.normal); clasp.scale.setScalar(C.claspR ?? 1); P.add(clasp);
    // --- the hood round the head, in the head's own frame (origin at its centre, +z forward)
    const hood = hoodMesh(H, C, clothC);
    hood.group.position.copy(H.group.position); P.add(hood.group);
    out.hood = hood.group;
    // --- sleeves: the cloak's cloth over the arm from under the cloak to a soft bell cuff short of the glove
    const sleeveM = clothMat(clothC), cuffM = clothMat(new THREE.Color(clothC).lerp(new THREE.Color(liningC), 0.5));
    const sl = {}; for (const s of ["R", "L"]) { sl[s] = { tube: mesh(new THREE.BufferGeometry(), sleeveM), cuff: mesh(new THREE.TorusGeometry(1, 0.16, 8, 28), cuffM) }; sl[s].tube.frustumCulled = false; ch.root.add(sl[s].tube); ch.root.add(sl[s].cuff); }
    boots(ch, std(C.boot || "#3a302a", { roughness: 0.6 }), std(C.sole || "#1d1917", { roughness: 0.7 }), { size: C.bootSize || [0.08, 0.062, 0.112] });
    const bandG = new THREE.TorusGeometry(1, 0.3, 10, 28); bandG.rotateX(Math.PI / 2);
    // boot tops: a folded leather cuff a shade lighter than the boot, with a darker welt line round the sole
    const cuffL = std(C.bootCuff || "#54443a", { roughness: 0.62 });
    const shaft = { R: mesh(bandG, cuffL), L: mesh(bandG, cuffL) };
    for (const s of ["R", "L"]) ch.root.add(shaft[s]);
    // glove cuffs: a short flared leather gauntlet over the wrist, out of the sleeve
    const gloveM = std(C.gloveCuff || "#1f1c23", { roughness: 0.55 }), gc = {};
    for (const s of ["R", "L"]) { gc[s] = mesh(new THREE.BufferGeometry(), gloveM); gc[s].frustumCulled = false; ch.root.add(gc[s]); }
    // the per-frame cloth: rest positions of every cloak piece, bent by the body's follow-through and pushed off the arms
    const pieces = []; for (const G of [cloak, robe]) G.traverse((m) => { if (m.isMesh) pieces.push({ g: m.geometry, rest: m.geometry.attributes.position.array.slice(), shell: m.geometry.index && m.geometry.attributes.position.count > 2000 }); });
    const yTop = yN, L = yN - yH, tmp = new THREE.Vector3();
    return [(st, t, hands, fries) => {
      const S = ch.bodyGroup.scale, segs = armSegs(ch, S, fries), ft = st.ft || { f: 0, s: 0, u: 0 }, f = ft.f * 0.5, sd = ft.s * 0.5;
      const bend = (x, y, z, o) => {
        const d = Math.max(0, Math.min(1, (yTop - y) / L)), w = d ** 1.5 * L; let dx = sd * w, dz = f * w;
        const r = Math.hypot(x, z) || 1, nx = x / r, nz = z / r, into = dx * nx + dz * nz;
        if (into < 0) { dx -= nx * into * 0.85; dz -= nz * into * 0.85; }
        o.set(x + dx, y + 0.35 * (dx * dx + dz * dz) / Math.max(0.05, w), z + dz);
        return pushOut(o, segs);
      };
      for (const pc of pieces) {
        const Pa = pc.g.attributes.position, R = pc.rest;
        for (let i = 0; i < Pa.count; i++) { bend(R[i * 3], R[i * 3 + 1], R[i * 3 + 2], tmp); Pa.setXYZ(i, tmp.x, tmp.y, tmp.z); }
        Pa.needsUpdate = true; pc.g.computeBoundingSphere();
        if (pc.shell) pc.g.computeVertexNormals();
      }
      bend(claspAt.x, claspAt.y, claspAt.z, clasp.position);
      hood.update(H.group.rotation, segs);
      for (const s of ["R", "L"]) {
        const A = ch.arms[s], on = !fries && !!A.elbow;
        sl[s].tube.visible = sl[s].cuff.visible = shaft[s].visible = gc[s].visible = on;
        if (!on) continue;
        const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint), Lc = curve.getLength(), u1 = Math.max(0.45, 1 - (C.cuff ?? 0.085) / Lc);
        const pts = []; for (let i = 0; i <= 14; i++) pts.push(curve.getPointAt(0.08 + (u1 - 0.08) * (i / 14)));
        const c2 = new THREE.CatmullRomCurve3(pts), rad = (u) => ch.limbW * (1.28 + 0.32 * sstep(0.6, 1, u));
        sl[s].tube.geometry.dispose(); sl[s].tube.geometry = taperTube(c2, 18, 14, rad);
        bandAt(sl[s].cuff, curve.getPointAt(u1), curve.getPointAt(Math.min(1, u1 + 0.04)), ch.limbW * 1.6);
        { const a = Math.max(0.5, u1 - 0.02), b = Math.min(0.97, 1 - 0.045 / Lc), gp = []; for (let i = 0; i <= 6; i++) gp.push(curve.getPointAt(a + (b - a) * (i / 6)));
          gc[s].geometry.dispose(); gc[s].geometry = taperTube(new THREE.CatmullRomCurve3(gp), 6, 16, (u) => ch.limbW * (1.12 + 0.3 * u)); }
        const fp = ch.legs[s].foot.position, k = new THREE.Vector3(fp.x, fp.y + 0.075, fp.z);
        bandAt(shaft[s], k, k.clone().add(new THREE.Vector3(0, 1, 0)), lw * 1.18);
      }
    }];
  },
};

// a bell-shaped body for drape() (which only needs surf(th, ph)): th round the body (0 front), ph from +pi/2 at the top
// (a neck, a waist) to -pi/2 at the hem, in bodyGroup space. Radii [x, z] at the top, at the shoulder line (shS of the
// way down, reached on a quarter sine) and at the hem (straight from the shoulders). For capes, cloaks, robes, skirts
// of every core character: the potato cast's cloth kit (costumes-art.js) on a body that isn't a potato
export function bellSurface({ y0, y1, neck, shoulder, hem, shS = 0.17, z = -0.01 }) {
  const pt = (th, ph) => {
    const s = (Math.PI / 2 - ph) / Math.PI, y = y0 + (y1 - y0) * s, k = Math.min(1, Math.max(0, s / shS)), sh = Math.sin((k * Math.PI) / 2) ** 0.75, fl = Math.max(0, s - shS) / (1 - shS);
    const rx = neck[0] + (shoulder[0] - neck[0]) * sh + (hem[0] - shoulder[0]) * fl, rz = neck[1] + (shoulder[1] - neck[1]) * sh + (hem[1] - shoulder[1]) * fl;
    return new THREE.Vector3(Math.sin(th) * rx, y, Math.cos(th) * rz + z);
  };
  return { surf(th, ph) {
    const p = pt(th, ph), e = 1e-3, a = pt(th + e, ph).sub(pt(th - e, ph)), b = pt(th, ph + e).sub(pt(th, ph - e)), n = a.cross(b).normalize();
    if (n.x * p.x + n.z * (p.z - z) < 0) n.negate();
    return { pos: p, normal: n };
  } };
}

// a tube along a curve whose radius changes along it (r(u), u 0..1), open ends (a sleeve)
function taperTube(curve, nu, nr, r) {
  const fr = curve.computeFrenetFrames(nu, false), pos = [], idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu, c = curve.getPointAt(u), N = fr.normals[i], B = fr.binormals[i], R = r(u);
    for (let j = 0; j <= nr; j++) { const a = (j / nr) * Math.PI * 2; pos.push(c.x + R * (Math.cos(a) * N.x + Math.sin(a) * B.x), c.y + R * (Math.cos(a) * N.y + Math.sin(a) * B.y), c.z + R * (Math.cos(a) * N.z + Math.sin(a) * B.z)); }
  }
  for (let i = 0; i < nu; i++) for (let j = 0; j < nr; j++) { const a = i * (nr + 1) + j, b = a + nr + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// the arms this frame as capsules (bodyGroup space): from just out of the shoulder to the glove, radius of the sleeve
// plus a little cloth. Cloth near one is pushed out to its surface (a soft max, so a fold slides over the arm)
function armSegs(ch, S, fries) {
  const out = [];
  if (fries) return out;
  for (const s of ["R", "L"]) {
    const A = ch.arms[s]; if (!A.elbow) continue;
    const curve = ch.constructor.armCurve(A.shoulder, A.elbow, A.hand.position, A.joint);
    let prev = null;
    for (let i = 0; i <= 8; i++) {
      const p = curve.getPointAt(0.1 + 0.9 * (i / 8)); p.set(p.x / S.x, p.y / S.y, p.z / S.z);
      if (prev) out.push([prev, p, i === 8 ? 0.085 : ch.limbW * 1.62]);
      prev = p;
    }
  }
  return out;
}
const _q = new THREE.Vector3(), _ab = new THREE.Vector3();
function pushOut(p, segs, k = 0.012) {
  for (const [a, b, r] of segs) {
    _ab.subVectors(b, a); const l2 = _ab.lengthSq(), t = l2 ? Math.max(0, Math.min(1, _q.subVectors(p, a).dot(_ab) / l2)) : 0;
    _q.copy(a).addScaledVector(_ab, t);
    const dx = p.x - _q.x, dy = p.y - _q.y, dz = p.z - _q.z, d = Math.hypot(dx, dy, dz);
    if (d > r + 6 * k || d < 1e-6) continue;
    const nd = d + k * Math.log1p(Math.exp((r - d) / k));
    p.x = _q.x + (dx / d) * nd; p.y = _q.y + (dy / d) * nd; p.z = _q.z + (dz / d) * nd;
  }
  return p;
}

// the Reaper's hood: a shell round the head (an ellipsoid a few centimetres off it) with a rounded-triangular opening
// for the face, a soft peak leaning back and to the character's right, and a skirt that flares onto the shoulders, open
// at the front down to the clasp. Rows run from the skirt's hem (el -pi/2) to the peak (el pi/2); each row turns with
// the head by its own weight (the crown fully, the skirt about a third), so the neck stays covered and the hood
// follows the head with restraint. Outside in the cloth, inside a dark lining, a thick rolled edge round the face.
function hoodMesh(H, C, clothC) {
  const NR = 84, NC = 72, g0 = C.hoodGap ?? 0.05, Rx = H.rx + g0, Ry = H.ry + g0, Rz = H.rz + g0;
  const elc = C.hoodOpenC ?? -0.12, ehT = C.hoodOpenT ?? 0.78, ehB = C.hoodOpenB ?? 1.5, W = C.hoodOpenW ?? 1.0;
  const hemY = -(H.ry + (C.hoodDrop ?? 0.1)), HX = C.hoodHem?.[0] ?? 0.32, HZ = C.hoodHem?.[1] ?? 0.29;
  const tip = new THREE.Vector3(...(C.hoodTip || [-0.05, 0.1, -0.11]));
  const wOf = (el) => { const x = (el - elc) / (el > elc ? ehT : ehB); return Math.abs(x) < 1 ? W * Math.sqrt(1 - x * x) : 0; };
  // the hood's folds, [psi, depth m (+ ridge, - valley), width rad], hand-placed at the back and sides, never in a rhythm
  const FOLDS = C.hoodFolds || [[1.22, 0.009, 0.17], [1.72, -0.012, 0.15], [2.3, 0.015, 0.24], [2.82, -0.013, 0.17], [3.38, 0.017, 0.27], [3.92, -0.011, 0.16], [4.48, 0.013, 0.23], [5.02, -0.01, 0.15]];
  const foldAt = (psi) => { let f = 0; for (const [c, d, w] of FOLDS) { let a = (psi - c) % (Math.PI * 2); if (a > Math.PI) a -= Math.PI * 2; if (a < -Math.PI) a += Math.PI * 2; f += d * Math.exp(-((a / w) ** 2)); } return f; };
  const INFO = { fold: 0, lip: 0, s: 0, el: 0 };
  // a point on the hood (head frame) at angle psi round from the front and elevation el, `inset` metres in
  const pt = (psi, el, inset, o) => {
    // cE: below the head's widest line the cloth falls nearly straight to the shoulders (no waist round the neck)
    const s = sstep(-0.55, -Math.PI / 2, el), cE = el < 0 ? 1 - (C.hoodWaist ?? 0.13) * sstep(0, -0.55, el) : Math.cos(el), sE = Math.sin(el), front = ((1 + Math.cos(psi)) / 2) ** 2;
    const yh = hemY + 0.05 * front;
    let x = Math.sin(psi) * ((Rx - inset) * cE * (1 - s) + (HX - inset) * s), z = Math.cos(psi) * ((Rz - inset) * cE * (1 - s) + (HZ - inset) * s) - 0.012, y = (Ry - inset) * sE * (1 - s) + yh * s;
    // the deep front: near the face opening the cloth stands forward (a thick hood brim), most over the forehead
    const pa = Math.abs(Math.atan2(Math.sin(psi), Math.cos(psi))), xe = (el - elc) / (el > elc ? ehT : ehB), q = Math.hypot(pa / W, xe), lip = Math.exp(-(((q - 1) / 0.3) ** 2)) * (1 - s) * sstep(-0.9, -0.2, el);   // the brim over the brow and beside the cheeks, not the flaps under the chin
    z += lip * (C.hoodLip ?? 0.05) * (1 + 0.6 * Math.max(0, xe)); y += lip * 0.012 * Math.max(0, xe);
    // soft folds round the back and sides, hanging from the crown and deepening toward the shoulders, none at the face
    const fold = foldAt(psi) * (0.25 + 0.75 * sstep(0.6, -1.2, el)) * (1 - lip), r = Math.hypot(x, z + 0.012) || 1;
    x += (x / r) * fold; z += ((z + 0.012) / r) * fold;
    INFO.fold = fold; INFO.lip = lip; INFO.s = s; INFO.el = el;
    // the peak: the crown drawn up and back into a soft point leaning to one side
    const pk = sstep(0.3, Math.PI / 2, el) ** 2;
    return o.set(x + tip.x * pk, y + tip.y * pk, z + tip.z * pk);
  };
  const W8 = (el) => 0.32 + 0.68 * sstep(-Math.PI / 2, -0.5, el);   // how far each row turns with the head
  const build = (inset) => {
    const pos = new Float32Array((NR + 1) * (NC + 1) * 3), col = new Float32Array(pos.length), idx = [], v = new THREE.Vector3();
    for (let j = 0; j <= NR; j++) {
      const el = -Math.PI / 2 + (Math.PI * j) / NR, w = wOf(el);
      for (let i = 0; i <= NC; i++) {
        pt(w + (Math.PI * 2 - 2 * w) * (i / NC), el, inset, v); const k = j * (NC + 1) + i; pos.set([v.x, v.y, v.z], k * 3);
        // painted shading: outside a little lighter on the crown, darker toward the shoulders and in each valley; inside
        // dark in the depth of the hood, lighter only where it turns out at the rim
        const c = inset ? 0.5 + 0.55 * INFO.lip : Math.max(0.6, 1.08 - 0.06 * INFO.el * -1 - 0.16 * INFO.s + 3.2 * Math.min(0, INFO.fold) + 1.2 * Math.max(0, INFO.fold));
        col[k * 3] = col[k * 3 + 1] = col[k * 3 + 2] = c;
      }
    }
    for (let j = 0; j < NR; j++) for (let i = 0; i < NC; i++) { const a = j * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  const outerG = build(0), innerG = build(0.014);
  const group = new THREE.Group();
  const outM = clothMat(clothC, { vertexColors: true }), inM = clothMat(C.hoodInside || "#2a2530", { side: THREE.BackSide, role: "lining", vertexColors: true });
  const outer = mesh(outerG, outM), inner = mesh(innerG, inM); group.add(outer, inner);
  // the hood casts no shadow on the face (the handoff: large shadows explain form, but nothing hides the face); it still
  // takes shadow and the inside stays dark by its own colour
  outer.castShadow = inner.castShadow = false;
  // the rolled edge round the face, from the skirt's hem on one side, over the brow, down to the hem on the other
  const aMax = Math.acos(Math.max(-1, (-Math.PI / 2 - elc) / ehB)), rimPts = [];
  for (let k = 0; k <= 90; k++) {
    const a = -aMax + (2 * aMax * k) / 90, el = elc + (Math.cos(a) > 0 ? ehT : ehB) * Math.cos(a), psi = W * Math.sin(a);
    rimPts.push(pt(psi < 0 ? Math.PI * 2 + psi : psi, el, 0.007, new THREE.Vector3()));
  }
  const rimM = clothMat(new THREE.Color(clothC).lerp(new THREE.Color(C.lining || "#514354"), 0.42));
  const rimG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rimPts, false, "centripetal"), 120, C.hoodRim ?? 0.027, 12, false);
  const hemPts = []; { const w = wOf(-Math.PI / 2); for (let k = 0; k <= 60; k++) hemPts.push(pt(w + (Math.PI * 2 - 2 * w) * (k / 60), -Math.PI / 2, 0.007, new THREE.Vector3())); }
  const hemG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hemPts, false, "centripetal"), 80, 0.014, 8, false);
  const rim = mesh(rimG, rimM), hem = mesh(hemG, rimM); rim.castShadow = false; group.add(rim, hem);
  // ink down the valleys and a light stroke down each ridge (the potato cast's drapeInk, on the hood's own surface:
  // v 0 high on the crown to 1 at the skirt's hem)
  const elOf = (vv) => 0.75 - vv * (0.75 + Math.PI / 2 - 0.02);
  const inkGs = [];
  const D = { F: FOLDS, closed: true, thick: 0, f0: () => 0, t0: () => Math.PI * 2, at: (t, vv, off) => pt(t, elOf(vv), -off, new THREE.Vector3()) };
  // the centre back seam, from the peak down to the skirt's hem: a slight ridge line in a darker thread
  { const sp = []; for (let k = 0; k <= 40; k++) sp.push(pt(Math.PI, 1.45 - (k / 40) * (1.45 + Math.PI / 2 - 0.02), -0.002, new THREE.Vector3()));
    const seamG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sp), 60, 0.0045, 6, false), sm = mesh(seamG, clothMat(new THREE.Color(clothC).multiplyScalar(0.7)), false); group.add(sm); inkGs.push(seamG); }
  const ig = drapeInk(D, { width: 0.0055 }); if (ig) { const m = inkMesh(ig, clothC, 0.32); m.castShadow = false; group.add(m); inkGs.push(ig); }
  const sg = drapeInk(D, { width: 0.012, only: "ridge" }); if (sg) { const m = inkMesh(sg, clothC, 1.4); m.castShadow = false; group.add(m); inkGs.push(sg); }
  // every piece's rest positions with each vertex's row weight (from its elevation, read back from its height)
  const pieces = [outerG, innerG, rimG, hemG, ...inkGs].map((g) => {
    const R = g.attributes.position.array.slice(), n = R.length / 3, wt = new Float32Array(n);
    for (let i = 0; i < n; i++) { const y = R[i * 3 + 1], el = y >= 0 ? Math.asin(Math.min(1, y / Ry)) : y > -Ry * 0.52 ? Math.asin(y / Ry) : -0.55 - (Math.PI / 2 - 0.55) * Math.min(1, (-Ry * 0.52 - y) / (-Ry * 0.52 - hemY)); wt[i] = W8(el); }
    return { g, R, wt, normals: g === outerG || g === innerG };
  });
  const e = new THREE.Euler(0, 0, 0, "YXZ"), q = new THREE.Quaternion(), v = new THREE.Vector3(), base = group.position;
  let key = "";
  return {
    group,
    update(rot, segs) {
      const k = `${rot.x}|${rot.y}|${segs.map((s) => `${s[0].x},${s[0].y},${s[0].z},${s[1].x},${s[1].y},${s[1].z}`).join(";")}`;   // exact inputs
      if (k === key) return; key = k;
      for (const pc of pieces) {
        const Pa = pc.g.attributes.position, R = pc.R;
        for (let i = 0; i < Pa.count; i++) {
          e.set(rot.x * pc.wt[i], rot.y * pc.wt[i], 0); q.setFromEuler(e);
          v.set(R[i * 3], R[i * 3 + 1], R[i * 3 + 2]).applyQuaternion(q).add(base);
          pushOut(v, segs); Pa.setXYZ(i, v.x - base.x, v.y - base.y, v.z - base.z);
        }
        Pa.needsUpdate = true; pc.g.computeBoundingSphere();
        if (pc.normals) { pc.g.computeVertexNormals(); weldRows(pc.g, NR, NC); }
      }
    },
  };
}
// the hood's closed rows (above and below the face opening) join their first and last column: one normal for both
function weldRows(g, nr, nc) {
  const N = g.attributes.normal;
  for (let j = 0; j <= nr; j++) { const a = j * (nc + 1), b = a + nc, x = N.getX(a) + N.getX(b), y = N.getY(a) + N.getY(b), z = N.getZ(a) + N.getZ(b), l = Math.hypot(x, y, z) || 1; N.setXYZ(a, x / l, y / l, z / l); N.setXYZ(b, x / l, y / l, z / l); }
  N.needsUpdate = true;
}
