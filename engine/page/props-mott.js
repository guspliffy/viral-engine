import * as THREE from "three";
import { clamp } from "./util.js";

// MOTT (5 Nov 2026, thread "Make Mott the moth's first video"): a standalone character, NOT a PotatoBrawl fighter.
// A small fluffy rosy-maple moth who can't resist anything that glows. Design sheet:
// /mnt/project-files/characters/new-character-01/mott-design-sheet-v0.png. He is built as a prop (like the shark in
// props-shark.js), so he never touches the potato rig, the cast files or the look code: a clip opts in by placing a
// "mott" prop and animating its state with c.prop(...).
//
//   mott        the moth, facing +z, origin the middle of his fluffy body (radius spec.r, default 0.2). Wings in the
//               plane behind him. State (only keys propState already tweens):
//                 open 0..1    wings spread (0 folded back over him at rest, 1 spread flat like the sheet)
//                 flap 0..1    wing beat strength (a soft beat, spec.hz per second, default 5)
//                 bob 0..1     hover bob (spec.bob defaults to 0 here: give it 0..1 in a tween)
//                 lid 0..1     upper lids down (sleepy at 0.5, shut at 1); blink adds on top
//                 squint 0..1  eyes shut tight as two curves (a happy or a sorry squeeze)
//                 glow 0..1    the lock-on: the light he stares at shows as two warm dots in each eye
//                 lookX/lookY  where the pupils' catch lights and the antennae point (-1..1, + right / up on screen)
//                 hope 0..1    antennae spring up and forward;  wilt 0..1 antennae droop sideways
//                 happy 0..1   smile;  sad 0..1 the smile turns down;  mouth 0..1 an open "o"
//                 bank (deg)   roll;  lean (deg) pitch forward
//                 puff 0..1    a burst of pink wing dust round him (the bonk)
//                 breath 0..1  a slow sleepy swell;  curl 0..1 squashed flat against what he hit (his front flattens)
//   stickynote  a square yellow sticky note (origin its middle, facing +z), spec.text in marker (\n breaks lines),
//               spec.size (0.13); wag 0..1 a fluttering wobble while it falls.
//   dustprint   a moth-shaped print of wing dust lying flat (origin its middle, +y up, the head toward -z), spec.size
//               (0.16 across); on 0..1 fades it in.
// The wing dust and the print are see-through for the checks; the moth and the note are solid.
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
// drawn like the sheet cast: flat cels and pencil hatching in the shade (looks.js role "drawn")
const drawn = (m) => { m.userData.lookRole = "drawn"; return m; };
const basic = (o) => { const m = new THREE.MeshBasicMaterial(o); m.userData.noOutline = true; return m; };
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
const glowy = (o, order = 3) => { o.frustumCulled = false; o.renderOrder = order; o.castShadow = false; o.receiveShadow = false; o.userData.steam = true; return o; };
const ell = (rx, ry, rz, seg = 24) => { const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)); g.scale(rx, ry, rz); return g; };
function canvasTex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const tube = (pts, r, seg = 16) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, 6, false);

const PINK = "#f2a7b8", YEL = "#f6dc8a", ROSE = "#c9607a", INK = "#2a2420", BLUSH = "#f28fa0";

// a wing as a flat shape with its UVs spread over its bounding box, so a canvas paints the band and the tip
function wingGeo(pts) {
  const s = new THREE.Shape(); s.moveTo(...pts[0]);
  for (let i = 1; i < pts.length; i += 2) s.quadraticCurveTo(...pts[i], ...pts[i + 1]);
  const g = new THREE.ShapeGeometry(s, 24); g.computeBoundingBox();
  const b = g.boundingBox, uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - b.min.x) / (b.max.x - b.min.x), (p.getY(i) - b.min.y) / (b.max.y - b.min.y));
  return g;
}

export const MOTT_KINDS = {
  mott(P) {
    const S = P.spec, R = S.r ?? 0.2, HZ = S.hz ?? 4;
    // spec.palette (never has money's moth, 6 Nov 2026: a cream moth with tan tips): the same build in other colours;
    // without it he is Mott, exactly as before
    const C = { fluff: YEL, collar: "#efcf74", wing: PINK, band: "246,220,138", rose: ROSE, blush: BLUSH, dust: "#f7c6d2", ...S.palette };
    const root = new THREE.Group(); P.whole.add(root);      // bob, bank and lean
    const body = new THREE.Group(); root.add(body);
    const fluff = drawn(mat(C.fluff, { roughness: 0.95 })), rose = drawn(mat(C.rose, { roughness: 0.7 }));
    // the fluffy ball: a core and tufts spread evenly over it (a Fibonacci sphere), so its outline is scalloped from
    // every side, like the sheet
    mesh(ell(R, R * 0.96, R * 0.92, 48), fluff, body);
    // scallops: a ring of tufts round his outline as seen from the front, and a ring round the side, so the outline
    // is scalloped from the front and the side while the face stays smooth (like the sheet)
    const tuft = (x, y, z, k) => mesh(ell(R * k, R * k, R * k, 12), fluff, body, x, y, z);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.1; tuft(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.83, -R * 0.12, 0.25 + 0.04 * rnd(i)); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.3; if (Math.sin(a) > 0.55) continue; tuft(0, Math.cos(a) * R * 0.83, Math.sin(a) * R * 0.8, 0.24 + 0.04 * rnd(i + 30)); }
    // a soft fluffy collar under the chin, a shade deeper
    const collar = mesh(new THREE.TorusGeometry(R * 0.62, R * 0.14, 8, 20), drawn(mat(C.collar, { roughness: 0.95 })), body, 0, -R * 0.6, R * 0.12); collar.rotation.x = Math.PI / 2 - 0.35;
    // four short rose legs under him
    for (const s of [-1, 1]) for (const k of [0, 1]) { const l = mesh(new THREE.CapsuleGeometry(R * 0.07, R * 0.28, 4, 8), rose, body, s * R * (0.22 + 0.24 * k), -R * 0.98, R * (0.25 - 0.3 * k)); l.rotation.z = s * 0.25; }

    // the face (+z): two huge glossy black eyes, catch lights, lids, blush and a small mouth
    const face = new THREE.Group(); face.position.set(0, R * 0.08, R * 0.8); body.add(face);
    const eyeM = mat("#17131a", { roughness: 0.18, metalness: 0.1 });
    const shine = basic({ color: "#ffffff" }), warm = basic({ color: "#fff3b8" });
    const lidM = drawn(mat(C.fluff, { roughness: 0.95 })), lineM = mat(INK, { roughness: 0.6 }); lidM.userData.noHatch = true;   // the lid as the fluff, clean
    const ER = [R * 0.3, R * 0.36, R * 0.16];
    const eyes = [-1, 1].map((s) => {
      const e = new THREE.Group(); e.position.set(s * R * 0.36, 0, 0.0); e.rotation.y = s * 0.32; face.add(e);
      mesh(ell(...ER, 26), eyeM, e);
      const c1 = mesh(ell(R * 0.075, R * 0.075, R * 0.03, 12), shine, e, -R * 0.09, R * 0.12, ER[2] * 0.92);
      const c2 = mesh(ell(R * 0.035, R * 0.035, R * 0.02, 10), shine, e, R * 0.1, -R * 0.12, ER[2] * 0.9);
      // the lock-on: the light he stares at, two warm dots with a soft ring
      const d1 = mesh(ell(R * 0.06, R * 0.06, R * 0.03, 12), warm, e, 0, R * 0.02, ER[2] * 0.95);
      const ring = mesh(new THREE.RingGeometry(R * 0.08, R * 0.12, 24), basic({ color: "#ffe9a0", transparent: true, opacity: 0.5, depthWrite: false }), e, 0, R * 0.02, ER[2] * 0.97);
      const d2 = mesh(ell(R * 0.025, R * 0.025, R * 0.015, 8), warm, e, R * 0.1, -R * 0.14, ER[2] * 0.9);
      // the upper lid: a cap of fluff that rolls down over the eye (as the shark's)
      const lid = mesh(new THREE.SphereGeometry(1, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), lidM, e); lid.scale.set(ER[0] * 1.08, ER[1] * 1.08, ER[2] * 1.5);
      // a shut eye drawn as a curve (squint)
      const shut = mesh(tube([[-ER[0] * 0.9, 0, 0], [0, -ER[1] * 0.35, 0], [ER[0] * 0.9, 0, 0]], R * 0.022, 12), lineM, e, 0, -R * 0.02, ER[2] * 1.05);
      return { s, e, c1, c2, d1, d2, ring, lid, shut };
    });
    for (const s of [-1, 1]) { const b = mesh(ell(R * 0.13, R * 0.07, R * 0.03, 12), mat(C.blush, { roughness: 0.9 }), face, s * R * 0.6, -R * 0.33, -R * 0.06); b.rotation.y = s * 0.5; }
    const smile = mesh(tube([[-R * 0.08, 0, 0], [0, -R * 0.06, 0.004], [R * 0.08, 0, 0]], R * 0.018, 10), lineM, face, 0, -R * 0.36, R * 0.07);
    const frown = mesh(tube([[-R * 0.08, -R * 0.04, 0], [0, R * 0.01, 0.004], [R * 0.08, -R * 0.04, 0]], R * 0.018, 10), lineM, face, 0, -R * 0.36, R * 0.07);
    const oMouth = mesh(ell(R * 0.06, R * 0.08, R * 0.03, 14), mat("#5a2a30", { roughness: 0.8 }), face, 0, -R * 0.4, R * 0.06);

    // the antennae: feathery like ferns, from the top of his head, each in its own group so it can aim
    const ants = [-1, 1].map((s) => {
      const g = new THREE.Group(); g.position.set(s * R * 0.32, R * 0.78, R * 0.25); body.add(g);
      const pts = [[0, 0, 0], [s * R * 0.12, R * 0.6, R * 0.05], [s * R * 0.5, R * 1.35, R * 0.02]];
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      mesh(new THREE.TubeGeometry(curve, 18, R * 0.028, 6, false), rose, g).userData.limb = "antenna";   // checked against every surface (stage.js limbsIn)
      for (let i = 2; i <= 13; i++) {
        const t = i / 14, p = curve.getPoint(t), d = curve.getTangent(t), len = R * (0.12 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
        for (const side of [-1, 1]) {
          const n = new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(side);
          const dir = n.clone().multiplyScalar(0.8).add(d.clone().multiplyScalar(0.6)).normalize();
          const barb = mesh(new THREE.CylinderGeometry(R * 0.011, R * 0.016, len, 5), rose, g);
          barb.position.copy(p).addScaledVector(dir, len / 2);
          barb.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          barb.castShadow = false;
        }
      }
      return { s, g };
    });

    // the wings: big forewings and smaller hind wings, pink with a butter band and rose tips (the rosy maple moth),
    // hinged at his sides; they fold back behind him at rest
    const wingTex = canvasTex(256, 256, (x, W, H) => {
      x.fillStyle = C.wing; x.fillRect(0, 0, W, H);
      const gr = x.createLinearGradient(0, H, W, 0); gr.addColorStop(0, `rgba(${C.band},0)`); gr.addColorStop(0.3, `rgba(${C.band},0.95)`); gr.addColorStop(0.62, `rgba(${C.band},0.95)`); gr.addColorStop(0.78, `rgba(${C.band},0)`);
      x.fillStyle = gr; x.fillRect(0, 0, W, H);
      x.fillStyle = C.rose; x.beginPath(); x.ellipse(W * 0.98, H * 0.95, W * 0.3, H * 0.24, 0, 0, Math.PI * 2); x.fill();
      x.strokeStyle = "rgba(201,96,122,0.35)"; x.lineWidth = 3;
      for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(0, H * 0.4); x.quadraticCurveTo(W * 0.5, H * (0.3 + i * 0.12), W, H * (0.5 + i * 0.12)); x.stroke(); }
    });
    const hindTex = canvasTex(128, 128, (x, W, H) => { x.fillStyle = C.wing; x.fillRect(0, 0, W, H); x.fillStyle = `rgba(${C.band},0.85)`; x.beginPath(); x.ellipse(W * 0.2, H * 0.7, W * 0.35, H * 0.3, 0, 0, Math.PI * 2); x.fill(); });
    const wingM = drawn(mat("#ffffff", { map: wingTex, side: THREE.DoubleSide, roughness: 0.8 }));
    const hindM = drawn(mat("#ffffff", { map: hindTex, side: THREE.DoubleSide, roughness: 0.8 }));
    wingM.userData.noHatch = hindM.userData.noHatch = true;   // thin wings stay clean: hatched, their shaded back read as a dirty brown card
    const fore = wingGeo([[0, 0], [R * 1.2, R * 2.0], [R * 3.0, R * 1.55], [R * 3.25, R * 0.4], [R * 2.4, -R * 0.35], [R * 1.2, -R * 0.55], [0, -R * 0.2]]);
    const hind = wingGeo([[0, -R * 0.1], [R * 1.4, -R * 0.15], [R * 1.75, -R * 0.9], [R * 1.3, -R * 1.55], [R * 0.4, -R * 0.95], [R * 0.1, -R * 0.6], [0, -R * 0.1]]);
    const wings = [-1, 1].map((s) => {
      const hinge = new THREE.Group(); hinge.position.set(s * R * 0.5, R * 0.12, -R * 0.35); body.add(hinge);
      const f = mesh(fore, wingM, hinge); f.scale.x = s; f.castShadow = false; f.userData.limb = `${s < 0 ? "left" : "right"} forewing`;
      const h = mesh(hind, hindM, hinge, 0, -R * 0.05, -0.004); h.scale.x = s; h.castShadow = false; h.userData.limb = `${s < 0 ? "left" : "right"} hind wing`;
      return { s, hinge, h };
    });

    // the wing dust: pink flecks thrown out round him (the bonk)
    const dustM = basic({ color: C.dust, transparent: true, opacity: 0.85, depthWrite: false });
    const dust = Array.from({ length: 40 }, (_, i) => {
      const o = glowy(new THREE.Mesh(new THREE.SphereGeometry(R * (0.06 + 0.07 * rnd(i + 3)), 8, 6), dustM), 4); P.whole.add(o);
      const a = rnd(i) * Math.PI * 2, e = (rnd(i + 1) - 0.3) * 1.4;
      return { o, d: new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e) + 0.3, Math.sin(a) * Math.cos(e) * 0.6), sp: 0.6 + rnd(i + 2) * 0.8 };
    });

    const RS = S.rest ?? [0.75, 1.1, 1.1];   // the closed wings' sweep back, raise and hind-wing tuck (radians), spec.rest
    return { grip: 0, apply(ps, t) {
      const tt = t ?? 0, open = clamp(ps.open ?? 0), flap = clamp(ps.flap ?? 0), bob = clamp(ps.bob ?? 0);
      // hover bob in time with the beat, a little roll and pitch
      root.position.y = bob * R * 0.12 * Math.sin(tt * HZ * Math.PI * 2 - 0.6);
      // breath: a slow sleepy swell; curl: squashed flat against whatever he hit (his front +z flattens)
      const br = 1 + 0.035 * (ps.breath ?? 0) * Math.sin(tt * Math.PI * 2 * 0.45), cu = clamp(ps.curl ?? 0);
      body.scale.set(br * (1 + 0.16 * cu), br * (1 + 0.1 * cu), br * (1 - 0.32 * cu)); body.position.z = R * 0.25 * cu;
      root.rotation.z = THREE.MathUtils.degToRad(ps.bank ?? 0); root.rotation.x = THREE.MathUtils.degToRad(ps.lean ?? 0);
      // wings: at rest they close up over his back like a butterfly's (raised about 80 degrees, swept back about 40) with
      // the hind wings tucked in behind the forewings, as a moth's are, so nothing hangs below him or reaches back into
      // the pillow or the wall he sits by (Jonny 5 Nov: the old fold, swept straight back with the hind wings hanging, cut
      // into the bed, the nightstand and the wall); flat at open 1; the beat sweeps them back and forth
      const beat = flap * 0.45 * Math.sin(tt * HZ * Math.PI * 2), shut = 1 - open;
      for (const w of wings) { w.hinge.rotation.y = w.s * (0.15 + RS[0] * shut + beat); w.hinge.rotation.z = w.s * (0.08 + RS[1] * shut); w.h.rotation.z = w.s * RS[2] * shut; }
      // eyes
      const lk = clamp((ps.lid ?? 0) + (ps.blink ?? 0)), sq = clamp(ps.squint ?? 0), gl = clamp(ps.glow ?? 0);
      const lx = ps.lookX ?? 0, ly = ps.lookY ?? 0;
      for (const q of eyes) {
        q.lid.rotation.x = THREE.MathUtils.degToRad(-90 + 150 * Math.max(lk, sq));
        q.lid.visible = Math.max(lk, sq) > 0.04;
        q.shut.visible = sq > 0.6 || lk > 0.92;
        const ox = R * 0.06 * lx, oy = R * 0.06 * ly;
        q.c1.position.x = -R * 0.09 + ox; q.c1.position.y = R * 0.12 + oy; q.c2.position.x = R * 0.1 + ox; q.c2.position.y = -R * 0.12 + oy;
        const n = 1 - gl; q.c1.scale.setScalar(Math.max(0.01, n)); q.c2.scale.setScalar(Math.max(0.01, n));
        q.d1.position.x = ox; q.d1.position.y = R * 0.02 + oy; q.d2.position.x = R * 0.1 + ox; q.d2.position.y = -R * 0.14 + oy;
        q.ring.position.x = ox; q.ring.position.y = R * 0.02 + oy;
        q.d1.visible = q.d2.visible = gl > 0.02; q.ring.visible = gl > 0.02;
        q.d1.scale.setScalar(Math.max(0.01, gl)); q.d2.scale.setScalar(Math.max(0.01, gl)); q.ring.scale.setScalar(Math.max(0.01, 0.7 + 0.3 * gl + 0.06 * Math.sin(tt * 9)));
        q.ring.material.opacity = 0.5 * gl;
      }
      // mouth
      const mo = clamp(ps.mouth ?? 0), hp = clamp(ps.happy ?? 0), sd = clamp(ps.sad ?? 0);
      oMouth.visible = mo > 0.08; oMouth.scale.set(0.6 + 0.4 * mo, 0.3 + 0.7 * mo, 1);
      smile.visible = mo <= 0.08 && sd < 0.5; frown.visible = mo <= 0.08 && sd >= 0.5;
      smile.scale.set(1 + 0.5 * hp, 0.6 + 0.9 * hp, 1);
      // antennae: aim at lookX/lookY, spring up with hope, droop with wilt, and quiver a touch while locked on
      const hope = clamp(ps.hope ?? 0), wilt = clamp(ps.wilt ?? 0), quiver = gl * 0.04 * Math.sin(tt * 23);
      for (const a of ants) {
        a.g.rotation.z = -0.55 * lx + a.s * (0.9 * wilt - 0.12 * hope) + quiver;
        a.g.rotation.x = -0.45 * ly - 0.35 * hope + 0.5 * wilt;
      }
      // wing dust
      const p = clamp(ps.puff ?? 0), k = p * 0.8;
      for (const d of dust) { d.o.visible = p > 0.01 && p < 0.99; const r = R * 4.5 * d.sp * Math.sqrt(k); d.o.position.set(d.d.x * r, d.d.y * r - 2.2 * k * k * R * 3, Math.abs(d.d.z) * r + R * 0.6); dustM.opacity = 0.9 * (1 - p * p); }
    } };
  },

  stickynote(P) {
    const S = P.spec, W = S.size ?? 0.13;
    const tex = canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = S.color ?? "#ffe873"; x.fillRect(0, 0, w, h);
      x.fillStyle = "rgba(0,0,0,0.06)"; x.fillRect(0, 0, w, h * 0.18);
      x.fillStyle = "#1c2a6a"; x.textAlign = "center"; x.textBaseline = "middle";
      const lines = String(S.text ?? "NO PHONE").split("\n"), fs = lines.length > 2 ? 52 : 64;
      x.font = `bold ${fs}px 'Comic Sans MS', 'DejaVu Sans', sans-serif`;
      lines.forEach((l, i) => x.fillText(l, w / 2, h * 0.56 + (i - (lines.length - 1) / 2) * fs * 1.05));
    });
    const g = new THREE.Group(); P.whole.add(g);
    const note = mesh(new THREE.PlaneGeometry(W, W, 4, 4), mat("#ffffff", { map: tex, side: THREE.DoubleSide, roughness: 0.9 }), g);
    // a slight curl at the bottom edge
    const pos = note.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) { const v = (pos.getY(i) + W / 2) / W; pos.setZ(i, 0.012 * (1 - v) * (1 - v)); }
    note.geometry.computeVertexNormals(); note.castShadow = false;
    return { grip: 0, apply(ps, t) { const w = clamp(ps.wag ?? 0); g.rotation.z = w * 0.5 * Math.sin((t ?? 0) * 11); g.rotation.x = w * 0.35 * Math.sin((t ?? 0) * 7 + 1); } };
  },

  dustprint(P) {
    const S = P.spec, W = S.size ?? 0.16;
    const tex = canvasTex(256, 256, (x, w, h) => {
      x.fillStyle = "rgba(245,190,205,0.9)";
      x.beginPath(); x.ellipse(w / 2, h * 0.5, w * 0.12, h * 0.16, 0, 0, Math.PI * 2); x.fill();
      for (const s of [-1, 1]) {
        x.beginPath(); x.moveTo(w / 2, h * 0.45); x.quadraticCurveTo(w / 2 + s * w * 0.2, h * 0.1, w / 2 + s * w * 0.47, h * 0.2); x.quadraticCurveTo(w / 2 + s * w * 0.5, h * 0.5, w / 2 + s * w * 0.3, h * 0.56); x.closePath(); x.fill();
        x.beginPath(); x.moveTo(w / 2, h * 0.55); x.quadraticCurveTo(w / 2 + s * w * 0.32, h * 0.6, w / 2 + s * w * 0.3, h * 0.8); x.quadraticCurveTo(w / 2 + s * w * 0.12, h * 0.82, w / 2, h * 0.62); x.fill();
      }
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(250,200,215,${0.2 + 0.4 * rnd(i)})`; x.fillRect(w * (0.08 + 0.84 * rnd(i + 9)), h * (0.1 + 0.75 * rnd(i + 19)), 3, 3); }
    });
    const m = basic({ map: tex, transparent: true, opacity: 0, depthWrite: false });
    const o = glowy(new THREE.Mesh(new THREE.PlaneGeometry(W, W), m), 5); o.rotation.x = -Math.PI / 2; P.whole.add(o);
    return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0); o.visible = on > 0.01; m.opacity = 0.85 * on; } };
  },
};
