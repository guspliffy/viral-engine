import * as THREE from "three";
import { clamp, lerp, rng } from "./util.js";
import { mat, mesh, canvasTex, smooth } from "./props-trend.js";

// Props for "My friend group trying to build one IKEA wardrobe" (friends try to, episode 1, 4 Nov 2026). Generic
// flat-pack: no brand, no logo, no readable product name.
//   wardrobe   a two-door flat-pack wardrobe without its back panel (WARDROBE sizes; origin: the bottom centre, the
//              doors facing +z). Its own params (all tweened through the shared prop state keys):
//                apart 0..1   the parts scattered (1) or built (0); spec.apart sets the start (default 0 = built)
//                flip  0..1   upside down (1) or upright (0), turned about its middle; it lifts a little mid-turn so no
//                             corner goes into the floor
//                open  0..1   both doors swing open (spec.open); wobble 0..1 makes them swing loose
//                broken 0..1  the right door hangs off its top hinge, askew
//                bend -1..1   racking: the carcass leans into a parallelogram sideways (+ = top to the right)
//                fall  0..1   it gives way backwards and folds flat on the floor (doors up), with no back panel
//                             holding it square; it reaches 1.9 m behind its foot, so keep that floor clear
//   plank      a loose flat-pack panel (spec.w, spec.h, spec.t, spec.color): lean it, hold it, fly it (scale 0 hides)
//   hardboard  the thin brown back panel, leaning against a wall (spec.w, spec.h, spec.lean degrees)
//   allenkey   an L-shaped hex key (cartoon size, so it shows past a fist at both ends); origin: the long arm's end,
//              the long arm up +y, the short arm toward +x at the top
//   cardbox    an opened cardboard box with its flaps up and some packing in it (spec.w, spec.d, spec.h; spec.empty: no
//              packing, the cat's box); spec.closed:
//              taped shut, a seat (spec.h 0.42 and scale = the seat height / 0.42: timeline.js sits on SEAT_Y x scale)
//   screwbag   a small clear bag of screws and dowels (spec.size)
//   bubblewrap a crumpled sheet of bubble wrap on the floor (spec.w, spec.d)
//   manual     the fold-out instruction sheet: a white sheet with simple step drawings and no words (spec.w, spec.h);
//              origin: its bottom centre, the drawings facing +z (spec.away: -z; spec.upside: upside down); hold it
//              with grips.phone like the wall calendar
export const WARDROBE = { W: 1.15, H: 1.9, D: 0.55, T: 0.03, plinth: 0.08 };

const WOOD = "#e9d7b4", WOOD2 = "#d8c29a", EDGE = "#c9b086";

function woodTex(seed, light = WOOD) {
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = light; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(150,110,60,${0.05 + r() * 0.08})`; g.lineWidth = 1 + r() * 2; const x = r() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8 - r() * 16, h * 0.3, x + 8 - r() * 16, h * 0.7, x + 4 - r() * 8, h); g.stroke(); }
  });
}

export const IKEA_KINDS = {
  wardrobe(P) {
    const { W, H, D, T, plinth } = WARDROBE;
    const panel = mat("#ffffff", { map: woodTex(3), roughness: 0.7 }), edge = mat(EDGE, { roughness: 0.75 });
    const doorM = mat("#ffffff", { map: woodTex(8, "#efdfbf"), roughness: 0.65 }), metal = mat("#9aa3ad", { roughness: 0.35, metalness: 0.6 });
    // root -> lift (flip lift) -> spin (flip about the middle) -> carcass (shear matrix) -> parts
    const lift = new THREE.Group(); P.whole.add(lift);
    const spin = new THREE.Group(); spin.position.y = H / 2; lift.add(spin);
    const carcass = new THREE.Group(); carcass.matrixAutoUpdate = false; spin.add(carcass);
    const body = new THREE.Group(); body.position.y = -H / 2; carcass.add(body);
    const parts = [];
    // a part: its built position and a scatter offset (where it hangs in the spell's swirl when apart = 1)
    const part = (obj, scatter, spinTo) => { body.add(obj); parts.push({ obj, home: obj.position.clone(), rot: obj.rotation.clone(), scatter: new THREE.Vector3(...scatter), spinTo: new THREE.Euler(...spinTo) }); return obj; };
    const slab = (w, h, d, m = panel) => { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.castShadow = b.receiveShadow = true; g.add(b); return g; };
    const sL = slab(T, H, D); sL.position.set(-W / 2 + T / 2, H / 2, 0); part(sL, [-0.7, 0.4, 0.3], [0.3, 0.6, 0.4]);
    const sR = slab(T, H, D); sR.position.set(W / 2 - T / 2, H / 2, 0); part(sR, [0.75, 0.25, 0.2], [-0.4, -0.5, -0.3]);
    const top = slab(W, T, D); top.position.set(0, H - T / 2, 0); part(top, [0.2, 0.7, 0.1], [0.5, 0.2, 0.6]);
    const bot = slab(W - 2 * T, T, D); bot.position.set(0, plinth + T / 2, 0); part(bot, [-0.3, -0.45, 0.25], [-0.4, 0.3, 0.2]);
    const pl = slab(W - 2 * T, plinth, T); pl.position.set(0, plinth / 2, D / 2 - T / 2 - 0.01); part(pl, [0.1, -0.6, 0.5], [0.2, 0.2, -0.5]);
    const shelf = slab(W - 2 * T, T, D - 0.04); shelf.position.set(0, H * 0.7, -0.01); part(shelf, [-0.2, 0.15, -0.3], [0.6, -0.4, 0.2]);
    const rod = new THREE.Group(); const rm = mesh(new THREE.CylinderGeometry(0.012, 0.012, W - 2 * T, 10), metal, rod); rm.rotation.z = Math.PI / 2; rod.position.set(0, H * 0.7 - 0.08, 0); part(rod, [0.3, -0.1, 0.4], [0, 0.8, 0.5]);
    // doors: hinged on the outer edges, a little in front of the carcass; a round knob near the middle edge
    const doors = [];
    for (const s of [-1, 1]) {
      const hinge = new THREE.Group(); hinge.position.set(s * (W / 2), plinth + 0.02, D / 2 + T / 2 + 0.002);
      const dw = W / 2 - 0.006, dh = H - plinth - 0.04;
      const door = new THREE.Group(); door.position.x = -s * dw / 2; hinge.add(door);
      mesh(new THREE.BoxGeometry(dw, dh, T * 0.8), doorM, door, 0, dh / 2, 0);
      // a recessed frame line and a bar handle near the middle edge
      for (const [ww, hh, yy] of [[dw - 0.12, 0.012, 0.1], [dw - 0.12, 0.012, dh - 0.1]]) mesh(new THREE.BoxGeometry(ww, hh, 0.004), edge, door, 0, yy, T * 0.4 + 0.002);
      for (const xx of [-(dw / 2 - 0.06), dw / 2 - 0.06]) mesh(new THREE.BoxGeometry(0.012, dh - 0.2, 0.004), edge, door, xx, dh / 2, T * 0.4 + 0.002);
      const hb = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), metal, door, -s * (dw / 2 - 0.09), dh * 0.5, T * 0.4 + 0.035);
      for (const yy of [-0.08, 0.08]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.035, 8), metal, door, -s * (dw / 2 - 0.09), dh * 0.5 + yy, T * 0.4 + 0.017).rotation.x = Math.PI / 2;
      void hb;
      part(hinge, [s * 0.9, 0.05 + (s > 0 ? 0.35 : -0.1), 0.6], [0.2 * s, 0.9 * s, 0.3]);
      doors.push({ s, hinge, door, dh });
    }
    const M = new THREE.Matrix4(), R = new THREE.Matrix4(), F = new THREE.Matrix4();
    return {
      grip: 1.0,
      apply(ps, t = 0) {
        const ap = clamp(ps.apart ?? 0), fl = clamp(ps.flip ?? 0), op = clamp(ps.open ?? 0), br = clamp(ps.broken ?? 0), wb = clamp(ps.wobble ?? 0);
        const fa = clamp(ps.fall ?? 0), bend = Math.max(-1, Math.min(1, ps.bend ?? 0));
        // the flip turns about the middle; mid-turn it lifts so the corners clear the floor
        spin.rotation.z = Math.PI * fl;
        lift.position.y = Math.sin(Math.PI * fl) * 0.18;
        // racking (x-y) then the fold backwards (y-z): both keep the foot on the floor (the shear is about y = 0)
        const a = bend * 0.32 + fa * 0.12, b = smooth(clamp(fa * 1.1)) * 1.5;   // b up to ~86 degrees: flat
        R.set(1, Math.sin(a), 0, 0, 0, Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        F.set(1, 0, 0, 0, 0, Math.cos(b), 0, 0, 0, -Math.sin(b), 1, 0, 0, 0, 0, 1);
        // shear about the foot: move the body's origin (y = -H/2 in spin space) to 0, shear, move back
        const toFoot = new THREE.Matrix4().makeTranslation(0, H / 2, 0), back = new THREE.Matrix4().makeTranslation(0, -H / 2, 0);
        M.copy(back).multiply(F).multiply(R).multiply(toFoot);
        carcass.matrix.copy(fl > 0.001 ? new THREE.Matrix4() : M);
        // scattered parts converge as apart goes to 0 (each turning on the way in)
        const e = smooth(ap);
        for (const q of parts) {
          q.obj.position.copy(q.home).addScaledVector(q.scatter, e);
          q.obj.rotation.set(q.rot.x + q.spinTo.x * e, q.rot.y + q.spinTo.y * e, q.rot.z + q.spinTo.z * e);
        }
        for (const d of doors) {
          const sw = op * 1.75 + wb * 0.35 * Math.sin(t * 9 + d.s);
          d.hinge.rotation.y = d.s * sw * (1 - fa);
          d.door.rotation.z = 0;
          if (d.s > 0 && br > 0) {
            // the right door off its lower hinge: it swings down about its top-outer corner, askew and half open
            d.hinge.rotation.y = d.s * (0.45 * br + sw);
            d.door.rotation.z = -0.32 * br;
            d.door.position.y = 0.06 * br;
          } else d.door.position.y = 0;
        }
      },
    };
  },

  plank(P) {
    const S = P.spec, w = S.w ?? 0.55, h = S.h ?? 1.8, t = S.t ?? 0.03;
    const m = mat("#ffffff", { map: woodTex(S.seed ?? 5, S.color ?? WOOD), roughness: 0.7 });
    mesh(new THREE.BoxGeometry(w, h, t), m, P.whole, 0, h / 2, 0);
    // pre-drilled holes along the edges (flat-pack), dark dots on the face
    const hole = mat("#6b5536", { roughness: 0.9 });
    for (const y of [0.08, h * 0.35, h * 0.7, h - 0.08]) for (const x of [-w / 2 + 0.04, w / 2 - 0.04]) { const c = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 8), hole, P.whole, x, y, t / 2 + 0.001); c.rotation.x = Math.PI / 2; c.castShadow = false; }
    return { grip: h * 0.55 };
  },

  hardboard(P) {
    const S = P.spec, w = S.w ?? 1.1, h = S.h ?? 1.85, lean = ((S.lean ?? 8) * Math.PI) / 180;
    const g = new THREE.Group(); g.rotation.x = -lean; P.whole.add(g);
    const tex = canvasTex(128, 256, (c, ww, hh) => { c.fillStyle = "#8a5a33"; c.fillRect(0, 0, ww, hh); const r = rng(4); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(${r() < 0.5 ? "60,35,18" : "170,120,80"},0.25)`; c.fillRect(r() * ww, r() * hh, 1.5, 1.5); } });
    mesh(new THREE.BoxGeometry(w, h, 0.006), mat("#ffffff", { map: tex, roughness: 0.9 }), g, 0, h / 2, 0);
    // the white front face (the side that would face into the wardrobe) shows a strip at the edge
    mesh(new THREE.BoxGeometry(w, h, 0.002), mat("#f2efe6", { roughness: 0.8 }), g, 0, h / 2, -0.004);
    return { grip: 0 };
  },

  allenkey(P) {
    const m = mat("#3d434c", { roughness: 0.3, metalness: 0.7 }), L = 0.2, S2 = 0.07, r = 0.011;
    const hex = (len) => new THREE.CylinderGeometry(r, r, len, 6);
    mesh(hex(L), m, P.whole, 0, L / 2, 0);
    const s = mesh(hex(S2), m, P.whole, S2 / 2, L, 0); s.rotation.z = Math.PI / 2;
    mesh(new THREE.SphereGeometry(r * 1.02, 8, 6), m, P.whole, 0, L, 0);
    return { grip: 0.1 };
  },

  cardbox(P) {
    const S = P.spec, w = S.w ?? 0.62, d = S.d ?? 0.42, h = S.h ?? 0.36;
    const card = mat("#c79a62", { roughness: 0.85 }), inner = mat("#a97c48", { roughness: 0.9 }), tape = mat("#e8d7a8", { roughness: 0.6 });
    const t = 0.012;
    mesh(new THREE.BoxGeometry(w, t, d), card, P.whole, 0, t / 2, 0);
    for (const s of [-1, 1]) { mesh(new THREE.BoxGeometry(t, h, d), card, P.whole, s * (w / 2 - t / 2), h / 2, 0); mesh(new THREE.BoxGeometry(w, h, t), card, P.whole, 0, h / 2, s * (d / 2 - t / 2)); }
    mesh(new THREE.BoxGeometry(w - 2 * t, 0.002, d - 2 * t), inner, P.whole, 0, t + 0.001, 0);
    // flaps standing open at angles (two long, two short)
    const flap = (fw, fh, x, z, ry, lean) => { const g = new THREE.Group(); g.position.set(x, h, z); g.rotation.set(0, ry, 0); P.whole.add(g); const f = mesh(new THREE.BoxGeometry(fw, fh, t), card, g, 0, fh / 2, 0); g.rotation.x = 0; f.parent.rotateX(lean); return g; };
    if (S.closed) {
      // taped shut (a seat): the two long flaps closed over the top, a strip of tape along the seam
      mesh(new THREE.BoxGeometry(w, t, d), card, P.whole, 0, h - t / 2, 0);
      mesh(new THREE.BoxGeometry(w * 0.96, 0.002, 0.05), tape, P.whole, 0, h + 0.001, 0);
      mesh(new THREE.BoxGeometry(w * 0.92, 0.04, 0.002), tape, P.whole, 0, h - 0.03, d / 2 + 0.002);
      return { grip: h };
    }
    flap(w, d * 0.48, 0, d / 2, 0, 0.55); flap(w, d * 0.48, 0, -d / 2, 0, -0.35);
    flap(d, d * 0.42, w / 2, 0, Math.PI / 2, 0.75); flap(d, d * 0.42, -w / 2, 0, Math.PI / 2, -0.6);
    mesh(new THREE.BoxGeometry(w * 0.92, 0.04, 0.002), tape, P.whole, 0, h - 0.03, d / 2 + 0.002);
    // crumpled packing paper peeking out
    const pap = mat("#f3efe4", { roughness: 0.95 }), r = rng(S.seed ?? 3);
    if (!S.empty) for (let i = 0; i < 5; i++) { const c = mesh(new THREE.IcosahedronGeometry(0.06 + r() * 0.04, 0), pap, P.whole, (r() - 0.5) * (w - 0.18), h - 0.02, (r() - 0.5) * (d - 0.14)); c.rotation.set(r() * 3, r() * 3, r() * 3); }
    return { grip: h };
  },

  screwbag(P) {
    const s = P.spec.size ?? 1;
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.16 * s, 0.03 * s, 0.11 * s), new THREE.MeshStandardMaterial({ color: "#dfe9f2", roughness: 0.15, transparent: true, opacity: 0.55 }));
    bag.position.y = 0.015 * s; P.whole.add(bag);
    const metal = mat("#aeb5bd", { roughness: 0.3, metalness: 0.6 }), dowel = mat("#d9b57a", { roughness: 0.7 }), r = rng(7);
    for (let i = 0; i < 9; i++) { const sc = mesh(new THREE.CylinderGeometry(0.005 * s, 0.005 * s, 0.035 * s, 6), i % 3 ? metal : dowel, P.whole, (r() - 0.5) * 0.12 * s, 0.015 * s, (r() - 0.5) * 0.07 * s); sc.rotation.set(Math.PI / 2, 0, r() * 3); sc.castShadow = false; }
    return { grip: 0.02 };
  },

  bubblewrap(P) {
    const S = P.spec, w = S.w ?? 0.7, d = S.d ?? 0.45;
    const tex = canvasTex(256, 256, (g, ww, hh) => { g.fillStyle = "#dfeef6"; g.fillRect(0, 0, ww, hh); for (let y = 8; y < hh; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < ww; x += 16) { g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill(); g.fillStyle = "#b9d4e3"; g.beginPath(); g.arc(x + 1.5, y + 1.5, 2, 0, 7); g.fill(); } });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 1.4);
    const g = new THREE.PlaneGeometry(w, d, 16, 10), p = g.attributes.position, r = rng(S.seed ?? 2);
    for (let i = 0; i < p.count; i++) p.setZ(i, 0.03 * Math.sin(p.getX(i) * 9 + r()) * Math.cos(p.getY(i) * 7) + 0.02 * r());
    g.computeVertexNormals();
    const m = mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, transparent: true, opacity: 0.85, side: THREE.DoubleSide }), P.whole, 0, 0.03, 0); m.rotation.x = -Math.PI / 2;
    return { grip: 0 };
  },

  manual(P) {
    const S = P.spec, w = S.w ?? 0.34, h = S.h ?? 0.24;
    const tex = canvasTex(340, 240, (g, ww, hh) => {
      g.fillStyle = "#fbfaf5"; g.fillRect(0, 0, ww, hh); g.strokeStyle = "#2b2b2b"; g.lineWidth = 3;
      // four step boxes with a wardrobe outline in different states, arrows between them (no words)
      for (let i = 0; i < 4; i++) {
        const x0 = 14 + (i % 2) * 165, y0 = 12 + Math.floor(i / 2) * 114;
        g.strokeRect(x0, y0, 150, 102);
        g.fillStyle = "#2b2b2b"; g.font = "900 22px sans-serif"; g.fillText(String(i + 1), x0 + 8, y0 + 24);
        g.strokeRect(x0 + 55, y0 + 18, 50 - i * 4, 72);
        if (i > 0) { g.beginPath(); g.moveTo(x0 + 80, y0 + 18); g.lineTo(x0 + 80, y0 + 90); g.stroke(); }
        if (i === 3) { g.beginPath(); g.moveTo(x0 + 115, y0 + 50); g.lineTo(x0 + 140, y0 + 50); g.lineTo(x0 + 132, y0 + 42); g.moveTo(x0 + 140, y0 + 50); g.lineTo(x0 + 132, y0 + 58); g.stroke(); }
      }
    });
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide }));
    sheet.position.y = h / 2; sheet.castShadow = true; P.whole.add(sheet);
    // away: the drawings face -z (away from whoever holds it with the phone hold, toward a camera in front);
    // upside: the drawings upside down (the Wizard reads it the wrong way up)
    if (S.away) sheet.rotation.y = Math.PI;
    if (S.upside) sheet.rotation.z = Math.PI;
    return { grip: h * 0.5 };
  },
};
