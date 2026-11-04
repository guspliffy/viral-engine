import * as THREE from "three";
import { clamp } from "./util.js";

// A paper party horn (the "blowout"), blown straight from an actor's lips with no hands, as kids do (Still Scrolling
// redo, 4 Nov 2026). In its own file so clips made in parallel never edit the same one (props3d.js merges it in).
//   partyhorn  a white mouthpiece and a striped paper tube that is rolled up into a coil under its far end. Like the
//              candle breath (props-candle.js), it rides on an actor's mouth: spec.mouth names the actor, spec.target
//              a prop and spec.at a point in that prop's frame; the horn points from the lips toward that point,
//              tipped up or down at most spec.maxPitch radians (0.35), so the coil still hangs under it. Leave x, y, z at 0.
//              `show` 0..1 grows it in at the lips (cover it with a poof); `blow` 0..1 unrolls the paper: 0 rolled
//              up tight, 1 straight out (HORN.len of paper past the mouthpiece) with a slight droop; `flutter` 0..1
//              shakes the unrolled paper (a buzzing blow); `droop` 0..1 lets the unrolled part hang limp from the lips. spec.len / spec.r change the paper's length and thickness.
// Solid all through, so the contact checks count it.
export const HORN = { len: 0.3, r: 0.0085, piece: 0.05, pieceR: 0.0095, coil: 0.034, coilEnd: 0.011 };

const N = 72;   // centreline points along the paper

function stripes() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 16;
  const g = c.getContext("2d"), cols = ["#ff3d8b", "#ffd23f", "#2fb7e8", "#ffd23f"];
  for (let i = 0; i < 16; i++) { g.fillStyle = cols[i % cols.length]; g.fillRect(i * 32, 0, 32, 16); }
  g.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 16; i++) g.fillRect(i * 32 + 2, 0, 3, 16);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.repeat.set(1, 1); return t;
}

export const HORN_KINDS = {
  partyhorn(P) {
    const S = P.spec, L = S.len ?? HORN.len, R = S.r ?? HORN.r;
    const H = new THREE.Group(); P.whole.add(H);
    const white = new THREE.MeshStandardMaterial({ color: "#fbf7ee", roughness: 0.45 });
    const piece = new THREE.Mesh(new THREE.CylinderGeometry(HORN.pieceR, HORN.pieceR * 1.08, HORN.piece, 18), white);
    piece.rotation.z = -Math.PI / 2; piece.position.x = HORN.piece / 2 - 0.012; piece.castShadow = true; H.add(piece);   // 1.2 cm between the lips
    const paperMat = new THREE.MeshStandardMaterial({ color: "#ffffff", map: stripes(), roughness: 0.6, side: THREE.DoubleSide });
    let paper = null, cap = null;
    const capMat = new THREE.MeshStandardMaterial({ color: "#ff3d8b", roughness: 0.6 });
    let st = { show: 0, blow: 0, flutter: 0, droop: 0, t: 0 };

    // the paper's centreline in the horn's frame (x out from the lips, y up): straight for blow * L, then a coil that
    // turns downward and tightens toward the tip (about two turns when rolled up)
    function line(b, fl, dr, t) {
      const pts = [], s0 = HORN.piece - 0.012, straight = b * L, rest = L - straight;
      let x = s0, y = 0, th = 0;
      const ds = L / (N - 1);
      for (let i = 0; i < N; i++) {
        const s = i * ds;
        pts.push(new THREE.Vector3(x, y, 0));
        let k;   // curvature (1/m), negative turns down
        if (s < straight) k = -0.35 - 0.5 * b * (s / L) - dr * 6.5 * (s / L);   // a slight droop as it straightens; limp: it hangs
        else { const u = rest > 1e-4 ? (s - straight) / rest : 1; k = -1 / (HORN.coil + (HORN.coilEnd - HORN.coil) * u); }
        if (fl > 0 && s < straight) k += fl * 4.0 * Math.sin(s * 38 - t * 70) * (s / L);   // the buzz runs out along it
        th += k * ds; x += Math.cos(th) * ds; y += Math.sin(th) * ds;
      }
      return pts;
    }

    return {
      grip: 0,
      apply(ps, t) { st = { show: clamp(ps.show ?? 0), blow: clamp(ps.blow ?? 0), flutter: clamp(ps.flutter ?? 0), droop: clamp(ps.droop ?? 0), t }; H.visible = st.show > 0.01; H.scale.setScalar(Math.max(0.01, st.show)); },
      // mouth and target in the world: the horn sits in the lips and points level toward the target
      aim(mouth, target) {
        if (!H.visible) return;
        P.root.updateMatrixWorld(true);
        const a = P.root.worldToLocal(mouth.clone()), b = P.root.worldToLocal(target.clone());
        H.position.copy(a);
        const dx = b.x - a.x, dz = b.z - a.z, pitch = clamp(Math.atan2(b.y - a.y, Math.hypot(dx, dz)), -(S.maxPitch ?? 0.35), S.maxPitch ?? 0.35);
        H.rotation.set(0, Math.atan2(-dz, dx), pitch);
        const pts = line(st.blow, st.flutter, st.droop, st.t);
        if (paper) { H.remove(paper); paper.geometry.dispose(); }
        if (cap) { H.remove(cap); cap.geometry.dispose(); }
        const curve = new THREE.CatmullRomCurve3(pts);
        paper = new THREE.Mesh(new THREE.TubeGeometry(curve, N, R, 10, false), paperMat);
        paper.castShadow = true; paper.frustumCulled = false; H.add(paper);
        cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.05, 12, 8), capMat); cap.position.copy(pts[pts.length - 1]); H.add(cap);
      },
    };
  },
};
