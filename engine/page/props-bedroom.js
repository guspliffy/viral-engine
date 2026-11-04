import * as THREE from "three";
import { clamp, lerp, rng } from "./util.js";
import { mat, mesh, canvasTex, smooth } from "./props-trend.js";

// "My friend group trying to get one cat out from under the bed" (friends try to, episode 3, 4 Nov 2026) and the cat's
// cameos in later episodes (the Christmas tree). Jonny's brief: a round, fluffy, grumpy grey tabby, a little smaller
// than a potato, big unimpressed yellow eyes, a fat tail; nobody handles it roughly.
//   cat        origin: between its feet, facing +z (rot turns it). Numbers (props3d "prop" tweens; the cat's words are
//              mapped onto names propState already tweens: use the CAT table, e.g. c.prop(t, "cat", { [CAT.hiss]: 1 })):
//                walk 0..1   the legs step and the body bobs (a walk cycle on the clip clock while walk > 0)
//                hiss 0..1   back arched, fur puffed, ears flat, mouth open (a cute hiss, not a scary one)
//                happy 0..1  eyes closed into happy arcs, a small smile, ears up ("mrrp")
//                sit 0..1    the rear sits down (a loaf in a box at 1 with tuck)
//                tuck 0..1   the legs fold under it (a loaf: sitting in the box)
//                dark 0..1   in the shadow under the bed: the fur goes nearly black, only the eyes show
//                glow 0..1   the eyes shine (under the bed, in a torch beam)
//                streak 0..1 stretched long and low at full speed, ears back (shooting back under the bed)
//                lid 0..1    the upper lids (0.35 = its default unimpressed look, 1 closed)
//   plaidbed   a low double bed running along x (spec.len, spec.wid): a wooden frame on four legs, a purple plaid
//              duvet hanging over the front edge, and a dark gap under it (spec.gap high) where the cat hides.
//              origin: the middle of the floor under it. Lift it with the root's tilt (props3d gripWorld follows)
//   petcarrier a purple pet carrier, its grille door swung open toward +x (spec.open, degrees)
//   sock       one sock (spec.color, spec.stripe), lying flat on its side; tween x, y, z, rot, tip to throw it
//   torchbeam  a phone torch's light: a soft cone from the origin along +z (spec.len, spec.r) that fades with `on`
//   toymouse   a little grey toy mouse with a pink tail
//   treat      a small fish-shaped cat treat
//   cattree    a cat tree: a sisal post with two round platforms and a dangling pompom
//   shadowpool a soft dark patch on the floor (spec.w, spec.d): the shade under the bed
export const BEDROOM_GRIPS = {};
// the cat's numbers -> the propState names they ride on (spec.lid: its resting lids, 0.35 is the grumpy default)
export const CAT = { walk: "flap", hiss: "puff", happy: "happy", sit: "over", tuck: "drop", dark: "char", glow: "glow", streak: "jet", lid: "lid" };

const FUR = "#9aa0a8", FUR2 = "#6c727c", WHITE = "#f4f1ea", EYE = "#ffd43a";

function furTex(seed = 3) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = FUR; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    // tabby stripes round the body (vertical bands on the canvas wrap round a sphere's sides)
    g.strokeStyle = FUR2; g.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const x = (i + 0.2 + r() * 0.6) * (w / 7); g.lineWidth = 5 + r() * 7;
      g.beginPath(); g.moveTo(x, h * 0.12); g.bezierCurveTo(x + 10, h * 0.35, x - 10, h * 0.55, x + 4, h * 0.72); g.stroke();
    }
    for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "40,44,52"},0.12)`; g.fillRect(r() * w, r() * h, 2, 5); }
  });
}

export const BEDROOM_KINDS = {
  cat(P) {
    const tex = furTex(P.spec.seed ?? 3);
    const fur = mat("#ffffff", { map: tex, roughness: 0.9 }), furPlain = mat(FUR, { roughness: 0.9 }), white = mat(WHITE, { roughness: 0.9 });
    const dark = mat("#2a2c33", { roughness: 1 }), pink = mat("#e89aa6", { roughness: 0.8 });
    const eyeM = new THREE.MeshStandardMaterial({ color: EYE, emissive: new THREE.Color(EYE), emissiveIntensity: 0.15, roughness: 0.4 });
    const pupilM = new THREE.MeshBasicMaterial({ color: "#121212" }), lidM = mat(FUR, { roughness: 0.9 });
    const furMats = [fur, furPlain, white, lidM];
    const base = furMats.map((m) => m.color.clone());
    const body = new THREE.Group(); P.whole.add(body);
    // the round body (a little pear: wide hips), a white bib, four short legs with white paws
    const torso = mesh(new THREE.SphereGeometry(0.15, 24, 18), fur, body, 0, 0.17, 0); torso.scale.set(1.0, 0.92, 1.45);
    const bib = mesh(new THREE.SphereGeometry(0.1, 16, 12), white, body, 0, 0.15, 0.13); bib.scale.set(0.9, 1, 0.7);
    const legs = [];
    for (const [x, z] of [[-0.075, 0.13], [0.075, 0.13], [-0.08, -0.12], [0.08, -0.12]]) {
      const hip = new THREE.Group(); hip.position.set(x, 0.12, z); body.add(hip);
      mesh(new THREE.CylinderGeometry(0.034, 0.03, 0.1, 10), furPlain, hip, 0, -0.05, 0);
      const paw = mesh(new THREE.SphereGeometry(0.036, 12, 8), white, hip, 0, -0.1, 0.01); paw.scale.set(1, 0.6, 1.25);
      legs.push(hip);
    }
    // the head: big and round, cheeks fluffed out, ears, a white muzzle, eyes, nose
    const head = new THREE.Group(); head.position.set(0, 0.29, 0.17); body.add(head);
    const skull = mesh(new THREE.SphereGeometry(0.13, 24, 18), fur, head, 0, 0, 0); skull.scale.set(1.12, 0.95, 0.95);
    for (const s of [-1, 1]) { const ch = mesh(new THREE.SphereGeometry(0.06, 12, 10), furPlain, head, s * 0.1, -0.04, 0.02); ch.scale.set(1, 0.8, 0.9); }
    const ears = [];
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(s * 0.075, 0.09, -0.01); head.add(e);
      mesh(new THREE.ConeGeometry(0.045, 0.085, 4), furPlain, e, 0, 0.035, 0).rotation.y = Math.PI / 4;
      mesh(new THREE.ConeGeometry(0.026, 0.05, 4), pink, e, 0, 0.03, 0.012).rotation.y = Math.PI / 4;
      ears.push({ e, s });
    }
    const muzzle = mesh(new THREE.SphereGeometry(0.055, 16, 12), white, head, 0, -0.045, 0.1); muzzle.scale.set(1.25, 0.75, 0.7);
    mesh(new THREE.SphereGeometry(0.014, 8, 6), pink, head, 0, -0.022, 0.138).scale.set(1.3, 0.8, 0.8);
    // the mouth: a dark oval that opens for the hiss and a small smile line for happy
    const mouth = mesh(new THREE.SphereGeometry(0.022, 12, 8), dark, head, 0, -0.065, 0.128); mouth.scale.set(1.2, 0.05, 0.4);
    const smile = mesh(new THREE.TorusGeometry(0.018, 0.0035, 6, 12, Math.PI), dark, head, 0, -0.05, 0.135); smile.rotation.z = Math.PI;
    // whiskers
    for (const s of [-1, 1]) for (const k of [-1, 0, 1]) { const w = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.11, 4), dark, head, s * 0.09, -0.04 + k * 0.012, 0.11); w.rotation.z = s * (Math.PI / 2 + k * 0.12); w.castShadow = false; }
    // eyes: big yellow discs with slit pupils, the upper lid a fur-coloured cap (grumpy at 0.35)
    const eyes = [];
    for (const s of [-1, 1]) {
      const g = new THREE.Group(); g.position.set(s * 0.052, 0.008, 0.112); g.rotation.y = s * 0.28; head.add(g);
      const ball = mesh(new THREE.SphereGeometry(0.036, 16, 12), eyeM, g, 0, 0, 0); ball.scale.set(1, 1, 0.45);
      const pupil = mesh(new THREE.SphereGeometry(0.03, 10, 8), pupilM, g, 0, 0, 0.012); pupil.scale.set(0.22, 0.95, 0.2);
      // a flat fur lid over the top of the eye with a dark lid line on its lower edge (scaled down from the top)
      const lid = new THREE.Group(); lid.position.set(0, 0.04, 0.019); g.add(lid);
      mesh(new THREE.PlaneGeometry(0.086, 1), lidM, lid, 0, -0.5, 0).castShadow = false;
      const lidLine = mesh(new THREE.PlaneGeometry(0.084, 0.007), pupilM, lid, 0, -1, 0.001); lidLine.castShadow = false;
      // happy: a closed arc in place of the eye
      const arc = mesh(new THREE.TorusGeometry(0.026, 0.005, 6, 14, Math.PI), dark, g, 0, -0.006, 0.02);
      eyes.push({ g, ball, pupil, lid, arc });
    }
    // the fat fluffy tail: a chain of spheres along a curve, ringed dark
    const tail = new THREE.Group(); tail.position.set(0, 0.2, -0.2); body.add(tail);
    const segs = [];
    const ring = mat(FUR2, { roughness: 0.9 }); furMats.push(ring); base.push(ring.color.clone());
    for (let i = 0; i < 12; i++) { const sg = mesh(new THREE.SphereGeometry(0.05 - i * 0.0012, 12, 10), Math.floor(i / 2) % 2 ? ring : furPlain, tail, 0, 0, 0); segs.push(sg); }
    // speed lines for the streak (thin white streaks behind it)
    const lines = [];
    for (let i = 0; i < 5; i++) { const l = mesh(new THREE.BoxGeometry(0.006, 0.006, 0.3), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0 }), P.whole, (i - 2) * 0.05, 0.1 + (i % 3) * 0.08, -0.45); l.castShadow = false; lines.push(l); }
    return {
      grip: 0.2,
      apply(ps, t = 0) {
        // props3d propState only tweens the numbers it lists, so the cat reads its own words from listed ones (CAT)
        const walk = clamp(ps.flap ?? 0), hiss = clamp(ps.puff ?? 0), happy = clamp(ps.happy ?? 0), sit = clamp(ps.over ?? 0), tuck = clamp(ps.drop ?? 0);
        const dk = clamp(ps.char ?? 0), glow = clamp(ps.glow ?? 0), streak = clamp(ps.jet ?? 0), lidK = ps.lid ?? 0.35;
        const ph = t * 11;
        // legs: a trot (diagonal pairs together), folded under for a loaf
        legs.forEach((hip, i) => { const pair = i === 0 || i === 3 ? 0 : Math.PI; hip.rotation.x = walk * 0.55 * Math.sin(ph + pair) * (1 - tuck) + streak * (i < 2 ? -1.0 : 1.0); hip.scale.y = 1 - 0.75 * tuck; });
        // the body: bob on the walk, sit tips the rear down, the arch for the hiss, long and low for the streak
        body.position.y = walk * 0.012 * Math.abs(Math.sin(ph)) - 0.075 * tuck - 0.05 * streak;
        body.rotation.x = -0.35 * sit * (1 - tuck);
        torso.scale.set(1.0 + 0.12 * hiss, 0.92 + 0.22 * hiss - 0.15 * streak, 1.45 + 0.55 * streak);
        torso.position.y = 0.17 + 0.05 * hiss;
        head.position.set(0, 0.29 + 0.02 * hiss - 0.06 * streak, 0.17 + 0.12 * streak);
        head.rotation.x = 0.1 * hiss - 0.1 * happy;
        // ears: flat back for the hiss and the streak, perked for happy
        for (const { e, s } of ears) { e.rotation.z = -s * (0.15 + 1.0 * Math.max(hiss, streak)); e.rotation.x = -0.6 * Math.max(hiss, streak) + 0.1 * happy; }
        // mouth and smile
        mouth.scale.set(1.2 + 0.4 * hiss, 0.05 + 1.1 * hiss, 0.4); mouth.position.y = -0.065 - 0.012 * hiss;
        smile.visible = happy > 0.4 && hiss < 0.2;
        // eyes: lids, happy arcs, wide in the hiss, the glow
        for (const E of eyes) {
          const open = happy > 0.5 ? 0 : 1;
          E.ball.visible = E.pupil.visible = E.lid.visible = !!open; E.arc.visible = !open;
          const lk = clamp(lidK * (1 - hiss));
          E.lid.visible = !!open && lk > 0.02;
          E.lid.scale.set(1, Math.max(0.001, 0.08 * lk), 1);
          // the lid line sits on the lower edge of the lid (in the lid's own units it is at -1; keep it thin)
          E.lid.children[1].scale.y = 1 / Math.max(0.001, 0.08 * lk) * 1;
          E.pupil.scale.set(0.22 + 0.25 * hiss, 0.95, 0.2);
        }
        eyeM.emissiveIntensity = 0.15 + 1.6 * glow;
        // the tail: swishing up and curling (low and straight in the streak, a puffed bottle-brush in the hiss)
        // a fat tail rising from the rump in a curve and hooking at the tip (a question mark), swishing slowly
        segs.forEach((sg, i) => {
          const k = i / 11, sw = Math.sin(t * 2.2 + k * 2) * 0.05 * k * (1 - streak), up = (1 - streak) * (1 - 0.6 * tuck);
          const a = k * 1.9 * up;   // the curve: back, then up, then over
          sg.position.set(sw + 0.04 * k * k, 0.02 + up * 0.17 * Math.sin(a) + 0.12 * hiss * k, -0.03 - 0.2 * k * (up ? Math.cos(a * 0.8) : 1) * (1 + 0.7 * streak));
          sg.scale.setScalar((1 + 0.45 * hiss) * (1 - 0.25 * k));
        });
        tail.visible = tuck < 0.95 || sit < 0.5;
        // dark under the bed: the fur goes almost black (lerp each material's colour)
        furMats.forEach((m, i) => { m.color.copy(base[i]).lerp(new THREE.Color("#15161b"), 0.92 * dk); });
        for (const l of lines) { l.material.opacity = 0.75 * streak; l.visible = streak > 0.02; }
      },
    };
  },

  plaidbed(P) {
    const S = P.spec, L = S.len ?? 1.7, W = S.wid ?? 1.25, gap = S.gap ?? 0.33, frameH = 0.1, matH = 0.14;
    const wood = mat("#8a5a3a", { roughness: 0.7 }), sheet = mat("#efe8f2", { roughness: 0.9 });
    const plaid = canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = "#8f7fb4"; g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(70,55,110,0.45)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 32 + 4, 0, 12, h); g.fillRect(0, i * 32 + 4, w, 12); }
      g.fillStyle = "rgba(235,225,250,0.35)"; for (let i = 0; i < 8; i++) { g.fillRect(i * 32 + 22, 0, 3, h); g.fillRect(0, i * 32 + 22, w, 3); }
    });
    plaid.wrapS = plaid.wrapT = THREE.RepeatWrapping; plaid.repeat.set(3, 3);
    const duvetM = mat("#ffffff", { map: plaid, roughness: 0.95, side: THREE.DoubleSide });
    // frame and legs (the legs at the corners leave the gap open)
    mesh(new THREE.BoxGeometry(L, frameH, W), wood, P.whole, 0, gap + frameH / 2, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(0.06, gap, 0.06), wood, P.whole, x * (L / 2 - 0.05), gap / 2, z * (W / 2 - 0.05));
    // a headboard at -x
    mesh(new THREE.BoxGeometry(0.06, 0.55, W), wood, P.whole, -L / 2 - 0.03, gap + 0.27, 0);
    mesh(new THREE.BoxGeometry(L - 0.04, matH, W - 0.04), sheet, P.whole, 0, gap + frameH + matH / 2, 0);
    // pillows
    for (const z of [-0.28, 0.28]) { const pl = mesh(new THREE.SphereGeometry(0.2, 16, 10), sheet, P.whole, -L / 2 + 0.25, gap + frameH + matH + 0.05, z); pl.scale.set(0.7, 0.35, 1.0); }
    // the duvet: a thick quilt over the top that hangs down the front (+z) and the foot (+x) to just above the gap
    const top = gap + frameH + matH, hang = top - gap + 0.02;
    const q = mesh(new THREE.BoxGeometry(L * 0.8, 0.07, W + 0.06), duvetM, P.whole, 0.1 * L, top + 0.035, 0);
    q.scale.y = 1;
    const front = mesh(new THREE.BoxGeometry(L * 0.8, hang, 0.05), duvetM, P.whole, 0.1 * L, top - hang / 2 + 0.06, W / 2 + 0.04);
    const foot = mesh(new THREE.BoxGeometry(0.05, hang, W + 0.06), duvetM, P.whole, L / 2 + 0.04, top - hang / 2 + 0.06, 0);
    // soft folds along the hanging edge
    for (let i = 0; i < 7; i++) { const f = mesh(new THREE.CylinderGeometry(0.03, 0.03, hang, 8), duvetM, P.whole, -L * 0.28 + i * (L * 0.8 / 6), top - hang / 2 + 0.06, W / 2 + 0.065); f.castShadow = false; }
    void front; void foot;
    // the dark under the bed: a black box just inside the legs, so the gap reads as shadow from every side
    const voidM = new THREE.MeshBasicMaterial({ color: "#0d0c12" }); voidM.userData.noOutline = true;
    const v = new THREE.Mesh(new THREE.BoxGeometry(L - 0.16, gap - 0.01, W - 0.2), voidM); v.position.set(0, gap / 2, -0.06); P.whole.add(v);
    return { grip: top };
  },

  petcarrier(P) {
    const S = P.spec, w = 0.42, h = 0.3, d = 0.55, open = ((S.open ?? 70) * Math.PI) / 180;
    const shell = mat("#9b6bd0", { roughness: 0.5 }), grille = mat("#d9d9e0", { roughness: 0.4, metalness: 0.5 }), dark = mat("#3a2d4f", { roughness: 0.8 });
    const b = mesh(new THREE.BoxGeometry(w, h, d), shell, P.whole, 0, h / 2, 0); b.scale.set(1, 1, 1);
    mesh(new THREE.BoxGeometry(w - 0.06, h - 0.06, 0.01), dark, P.whole, 0, h / 2, d / 2 + 0.001);
    mesh(new THREE.TorusGeometry(0.08, 0.015, 8, 16, Math.PI), shell, P.whole, 0, h + 0.005, 0).rotation.y = Math.PI / 2;
    // side vents
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) mesh(new THREE.BoxGeometry(0.004, 0.12, 0.03), dark, P.whole, s * (w / 2 + 0.001), h * 0.55, -0.15 + i * 0.1);
    // the door: a grille hinged on its +x edge, swung open
    const hinge = new THREE.Group(); hinge.position.set(w / 2 - 0.03, h / 2, d / 2 + 0.01); hinge.rotation.y = open; P.whole.add(hinge);
    for (let i = 0; i < 6; i++) mesh(new THREE.CylinderGeometry(0.005, 0.005, h - 0.08, 6), grille, hinge, -0.03 - i * 0.065, 0, 0);
    for (const y of [-(h - 0.08) / 2, (h - 0.08) / 2]) { const r = mesh(new THREE.CylinderGeometry(0.007, 0.007, w - 0.06, 6), grille, hinge, -(w - 0.06) / 2, y, 0); r.rotation.z = Math.PI / 2; }
    return { grip: h };
  },

  sock(P) {
    const S = P.spec, c1 = S.color ?? "#e85d75", c2 = S.stripe ?? "#ffffff";
    const tex = canvasTex(64, 128, (g, w, h) => { g.fillStyle = c1; g.fillRect(0, 0, w, h); g.fillStyle = c2; for (let y = 6; y < h * 0.7; y += 18) g.fillRect(0, y, w, 7); g.fillStyle = c2; g.fillRect(0, h * 0.86, w, h * 0.14); });
    const m = mat("#ffffff", { map: tex, roughness: 0.95 });
    // a flat sock lying on its side: the leg along +y (in the sock's own plane), the foot turning toward +x
    const g = new THREE.Group(); g.rotation.x = -Math.PI / 2; P.whole.add(g);
    const leg = mesh(new THREE.CapsuleGeometry(0.035, 0.12, 4, 10), m, g, 0, 0.08, 0.012); leg.scale.set(1, 1, 0.35);
    const foot = mesh(new THREE.CapsuleGeometry(0.033, 0.09, 4, 10), m, g, 0.06, 0.005, 0.012); foot.rotation.z = Math.PI / 2; foot.scale.set(1, 1, 0.35);
    return { grip: 0.01 };
  },

  torchbeam(P) {
    const S = P.spec, len = S.len ?? 1.2, r = S.r ?? 0.3;
    const g = new THREE.ConeGeometry(r, len, 24, 1, true); g.translate(0, -len / 2, 0); g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshBasicMaterial({ color: "#fff2b0", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    m.userData.noOutline = true;
    const cone = new THREE.Mesh(g, m); cone.castShadow = false; P.whole.add(cone);
    // the lit spot where it lands
    const spotM = new THREE.MeshBasicMaterial({ color: "#fff2b0", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    spotM.userData.noOutline = true;
    const spot = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 24), spotM); spot.position.z = len; P.whole.add(spot);
    return { grip: 0, apply(ps) { const on = clamp(ps.on ?? 0); m.opacity = 0.22 * on; spotM.opacity = 0.3 * on; cone.visible = spot.visible = on > 0.01; } };
  },

  toymouse(P) {
    const grey = mat("#a9a9b2", { roughness: 0.9 }), pink = mat("#ef8fa8", { roughness: 0.8 });
    const b = mesh(new THREE.SphereGeometry(0.04, 12, 10), grey, P.whole, 0, 0.03, 0); b.scale.set(0.8, 0.7, 1.4);
    for (const s of [-1, 1]) mesh(new THREE.SphereGeometry(0.016, 8, 6), pink, P.whole, s * 0.022, 0.06, 0.03).scale.set(1, 1, 0.3);
    const t = mesh(new THREE.TorusGeometry(0.05, 0.004, 6, 16, Math.PI * 1.2), pink, P.whole, 0, 0.01, -0.09); t.rotation.x = Math.PI / 2;
    return { grip: 0.03 };
  },

  treat(P) {
    const m = mat("#d98a3c", { roughness: 0.7 });
    const b = mesh(new THREE.SphereGeometry(0.022, 10, 8), m, P.whole, 0, 0.012, 0); b.scale.set(1.5, 0.6, 1);
    const tl = mesh(new THREE.ConeGeometry(0.016, 0.02, 3), m, P.whole, -0.04, 0.012, 0); tl.rotation.z = Math.PI / 2;
    return { grip: 0.012 };
  },

  cattree(P) {
    const sisal = mat("#d8c39a", { roughness: 1 }), plush = mat("#b8a6d8", { roughness: 1 }), pom = mat("#f07aa0", { roughness: 1 });
    mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.05, 20), plush, P.whole, 0, 0.025, 0);
    mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 12), sisal, P.whole, 0, 0.47, 0);
    mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 20), plush, P.whole, 0.04, 0.5, 0);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 20), plush, P.whole, -0.02, 0.92, 0);
    mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.18, 4), sisal, P.whole, 0.16, 0.41, 0.0);
    mesh(new THREE.SphereGeometry(0.03, 10, 8), pom, P.whole, 0.16, 0.31, 0);
    return { grip: 0.9 };
  },

  shadowpool(P) {
    const S = P.spec, w = S.w ?? 1.6, d = S.d ?? 1.1;
    const tex = canvasTex(128, 128, (g, ww, hh) => { const gr = g.createRadialGradient(ww / 2, hh / 2, 4, ww / 2, hh / 2, ww / 2); gr.addColorStop(0, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, ww, hh); });
    const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }); m.userData.noOutline = true;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.y = 0.004; p.castShadow = false; P.whole.add(p);
    return { grip: 0 };
  },
};
void lerp; void smooth;
