import * as THREE from "three";
import { clamp, rng } from "./util.js";
import { mat, mesh, canvasTex, smooth } from "./props-trend.js";

// "My friend group trying to pitch one tent" (friends try to, episode 2, 5 Nov 2026). Jonny's brief: a dome tent on a
// windy lakeside meadow turns into a sail, then (the Wizard's spell) a round parachute canopy that lifts Viking off
// his feet on its guy rope, drops flat over him and the Wizard, snaps up taut round Reaper's scythe and folds down
// over the Wizard when Viking pulls the scythe out.
//   camptent   one cloth (cream, a red band round the hem, four seams) with two poles running over it and a guy rope.
//              Origin: the middle of its footprint on the ground; its door side faces +z. Its numbers ride on names
//              propState already tweens (use the TENT table: c.prop(t, "tent", { [TENT.dome]: 1, [TENT.flat]: 0 })).
//              The cloth's shape is a blend of four shapes weighted by their numbers (all 0 = flat):
//                dome 0..1     pitched: a taut dome (TENT_SIZE), peak 0..1 pulls the top up into a point (the scythe)
//                sail 0..1     half pitched in the wind (from +x): the left side bellies up and out like a sail
//                ball 0..1     the spell: a round parachute canopy, rise metres above the ground (in its own frame)
//                flat 0..1     lying on the ground in folds, with up to two lumps (spec.lumps [[x, z, r, h], ...] in its own
//                              frame, up to four, their heights times lumpA..lumpD): somebody under it
//              shift moves the cloth's middle along x (metres; the canopy drifts over Viking's rope),
//              flutter 0..1 ripples the cloth in the wind (on the clip clock), glow 0..1 the spell's gold sheen,
//              rope 0..1 lifts the guy rope's free end from the grass (spec.ropeGround [x, y, z]) to Viking's hand
//              (spec.ropeHand [x, y, z]): hold it with the arm part "rope" (props3d partPoint, TENT_PARTS).
//              The Wizard's hand on the sail's pole: the arm part "pole" (the pole along the cloth's left side).
//   tentpeg    a bent aluminium peg (spec.sink 0..1 how far it is in the ground; tween `drop` to hammer it in)
//   backpack   a worn canvas backpack with a leather flap and straps, standing on the ground, its front to +z
//   firering   a ring of grey stones round old ash (spec.r)
//   windleaves leaves blowing through the frame from +x to -x on the clip clock (spec.w, spec.h, spec.d, spec.n)
export const TENT_GRIPS = {};
export const TENT = { dome: "unfold", peak: "knot", sail: "flap", ball: "balloon", rise: "rise", flat: "drop", lumpA: "bump", lumpB: "big", lumpC: "tiny", lumpD: "stack", shift: "port", flutter: "wobble", glow: "magic", rope: "tug" };
export const TENT_SIZE = { w: 1.4, d: 1.0, h: 0.85, flat: 1.45 };   // a two-potato dome; flat: how much wider the cloth lies than the dome
export const ROPE_GROUND = [1.03, 0.02, 0.15], ROPE_HAND = [0.88, 0.6, 0.24];
const LUMPS = ["bump", "big", "tiny", "stack"];   // the lumps' heights ride on these names (TENT.lumpA..D)
const CREAM = "#eadcb8", RED = "#b8402c", POLE = "#5d6168", ROPE = "#d9c9a0";

// the cloth's point at (u 0 top .. 1 hem, a round the middle) for the tent's state (ps: propState) and spec, in the
// prop's own frame. t: the clip clock for the flutter (null: none, a hand's grip point)
function clothAt(u, a, ps, spec, t) {
  const { w, d, h } = TENT_SIZE, rx = w / 2, rz = d / 2;
  let wd = clamp(ps.unfold || 0), ws = clamp(ps.flap || 0), wb = clamp(ps.balloon || 0), wf = clamp(ps.drop || 0);
  const tot = wd + ws + wb + wf;
  if (tot < 1e-4) { wf = 1; } else { wd /= tot; ws /= tot; wb /= tot; wf /= tot; }
  const ca = Math.cos(a), sa = Math.sin(a), th = (u * Math.PI) / 2, st = Math.sin(th), ct = Math.cos(th);
  let x = 0, y = 0, z = 0;
  if (wd > 0) {   // pitched dome; peak pulls the crown up round the scythe's shaft
    const pk = clamp(ps.knot || 0), crown = Math.max(0, 1 - u * 2.6);
    x += wd * st * ca * rx; z += wd * st * sa * rz; y += wd * (ct * h + pk * 0.16 * crown * crown);
  }
  if (ws > 0) {   // half pitched, the wind from +x: the windward side pressed low, the lee side bellied out and up
    const s = st * ca, up = ct, lee = Math.max(0, -s);
    const sx = st * ca * rx * (1 + 0.32 * lee * up) - 0.3 * up * rx, sz = st * sa * rz * (1 + 0.18 * lee);
    const sy = ct * h * 0.95 * (1 - 0.5 * Math.max(0, s)) * (1 + 0.15 * lee);
    x += ws * sx; z += ws * sz; y += ws * sy;
  }
  if (wb > 0) {   // the spell: a round parachute canopy, its hem gathered a little, rise above the ground
    const R = 0.8, H = 0.66, tb = u * Math.PI * 0.5 * 0.97, g = 1 - 0.1 * u * u * u;
    x += wb * Math.sin(tb) * ca * R * g; z += wb * Math.sin(tb) * sa * R * g; y += wb * (Math.cos(tb) * H + 0.05 + (ps.rise || 0));
  }
  if (wf > 0) {   // lying on the ground in soft folds, lumps where somebody is under it
    const fx = u * ca * rx * TENT_SIZE.flat, fz = u * sa * rz * TENT_SIZE.flat;
    let fy = 0.02 + 0.022 * u * (0.5 + 0.5 * Math.sin(7 * a + 11 * u)) + 0.05 * (1 - u) * (1 - u);
    const L = spec.lumps || [];
    for (let i = 0; i < L.length; i++) {
      const k = ps[LUMPS[i]] || 0; if (k <= 0) continue;
      const [lx, lz, lr, lh] = L[i], dd = Math.hypot(fx + (ps.port || 0) - lx, fz - lz) / lr;
      const v = dd < 1 ? 0.85 * Math.sqrt(1 - dd * dd) + 0.15 : 0.15 * Math.exp(-((dd - 1) * (dd - 1)) / 0.35);
      fy = Math.max(fy, k * lh * v);
    }
    x += wf * fx; z += wf * fz; y += wf * fy;
  }
  x += ps.port || 0;
  if (t != null) {   // the wind's ripple: more at the hem, travelling round from the windward side
    const f = clamp(ps.wobble || 0) * u * (0.6 + 0.4 * (ws + wb)), r = f * 0.045 * Math.sin(9.5 * t + 4 * a - 5 * u) + f * 0.02 * Math.sin(15.3 * t + 9 * a);
    x += r * ca; z += r * sa; y += r * 0.6;
  }
  return [x, y, z];
}
const ropeEnd = (ps, spec) => { const g = spec.ropeGround || ROPE_GROUND, h = spec.ropeHand || ROPE_HAND, k = smooth(clamp(ps.tug || 0)); return g.map((v, i) => v + (h[i] - v) * k); };

// the parts a hand can hold (props3d partPoint): "rope" the guy rope's free end, "pole" the sail's pole on the left
export const TENT_PARTS = {
  camptent: (ps, part, p, dir) => {
    if (dir) return p;
    const o = part === "rope" ? ropeEnd(ps, {}) : clothAt(0.62, Math.PI, ps, {}, null);
    return [o[0] + p[0], o[1] + p[1], o[2] + p[2]];
  },
};

function leafTex() {
  return canvasTex(64, 64, (g) => {
    g.fillStyle = "#c9b23a"; g.beginPath(); g.ellipse(32, 32, 26, 12, 0.5, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(90,70,20,0.6)"; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 44); g.lineTo(54, 20); g.stroke();
  });
}

export const TENT_KINDS = {
  camptent(P) {
    const S = P.spec, NR = 22, NS = 56;
    const tex = canvasTex(512, 512, (g, cw, ch) => {
      g.fillStyle = CREAM; g.fillRect(0, 0, cw, ch);
      // soft brush wash so the cloth isn't flat colour
      const r = rng(17);
      for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${r() < 0.5 ? "120,95,60" : "255,250,235"},0.05)`; g.beginPath(); g.ellipse(r() * cw, r() * ch * 0.74, 20 + r() * 50, 6 + r() * 16, r() * 3, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = RED; g.fillRect(0, ch * 0.74, cw, ch * 0.26);
      g.fillStyle = "rgba(60,20,10,0.35)"; g.fillRect(0, ch * 0.74, cw, 5);
      // four seams from the crown to the hem, and the stitching above the band
      g.strokeStyle = "rgba(110,80,50,0.55)"; g.lineWidth = 4;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(((i + 0.5) * cw) / 4, 0); g.lineTo(((i + 0.5) * cw) / 4, ch); g.stroke(); }
      g.setLineDash([10, 8]); g.lineWidth = 2; g.beginPath(); g.moveTo(0, ch * 0.715); g.lineTo(cw, ch * 0.715); g.stroke();
    });
    const cloth = mat("#ffffff", { map: tex, roughness: 0.85, side: THREE.DoubleSide, emissive: new THREE.Color("#ffc94a"), emissiveIntensity: 0 });
    const geo = new THREE.BufferGeometry(), pos = new Float32Array((NR + 1) * (NS + 1) * 3), uv = new Float32Array((NR + 1) * (NS + 1) * 2), idx = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NS; j++) { const k = i * (NS + 1) + j; uv[k * 2] = j / NS; uv[k * 2 + 1] = 1 - Math.max(0.002, i / NR); }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + NS + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const cl = mesh(geo, cloth, P.whole); cl.frustumCulled = false;
    // the poles: two along the cloth over the crown, crossing; one up the sail's left side for the Wizard
    const poleM = mat(POLE, { roughness: 0.35, metalness: 0.5 }), ropeM = mat(ROPE, { roughness: 0.9 });
    const tubes = [0, 1, 2].map(() => { const m = mesh(new THREE.BufferGeometry(), poleM, P.whole); m.frustumCulled = false; return m; });
    const ropes = [0, 1].map(() => { const m = mesh(new THREE.BufferGeometry(), ropeM, P.whole); m.frustumCulled = false; return m; });
    let last = "";
    return {
      grip: 0,
      apply(ps, t) {
        const key = [ps.unfold, ps.knot, ps.flap, ps.balloon, ps.rise, ps.drop, ps.bump, ps.big, ps.tiny, ps.stack, ps.port, ps.wobble, ps.magic, ps.tug, ps.wobble > 0 ? t : 0].join("|");
        if (key === last) return; last = key;
        for (let i = 0; i <= NR; i++) for (let j = 0; j <= NS; j++) {
          const k = (i * (NS + 1) + j) * 3, p = clothAt(i / NR, (j / NS) * Math.PI * 2, ps, S, t);
          pos[k] = p[0]; pos[k + 1] = p[1]; pos[k + 2] = p[2];
        }
        geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere();
        cloth.emissiveIntensity = 0.55 * clamp(ps.magic || 0);
        // poles: just outside the cloth along two meridians over the crown (a and a + pi), and the left pole
        const lift = (p, a, u) => { const n = 0.012; return new THREE.Vector3(p[0] + Math.cos(a) * n * u, p[1] + n, p[2] + Math.sin(a) * n * u); };
        const meridian = (a0) => { const pts = []; for (let i = 16; i >= 0; i--) pts.push(lift(clothAt(i / 16, a0, ps, S, t), a0, i / 16)); for (let i = 1; i <= 16; i++) pts.push(lift(clothAt(i / 16, a0 + Math.PI, ps, S, t), a0 + Math.PI, i / 16)); return pts; };
        const set = (m, pts, r) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 2, r, 6, false); };
        set(tubes[0], meridian(Math.PI / 4), 0.011); set(tubes[1], meridian((3 * Math.PI) / 4), 0.011);
        const side = []; for (let i = 10; i <= 22; i++) side.push(lift(clothAt(i / 22, Math.PI, ps, S, t), Math.PI, i / 22));
        side.push(new THREE.Vector3(side[side.length - 1].x - 0.01, -0.02, side[side.length - 1].z));
        set(tubes[2], side, 0.012); tubes[2].visible = clamp(ps.flap || 0) > 0.02 || clamp(ps.unfold || 0) > 0.02;
        // the guy rope: from two points on the hem's right side to its free end, sagging while slack
        const e = ropeEnd(ps, S), taut = clamp((ps.balloon || 0) * 1.2);
        [-0.35, 0.35].forEach((da, n) => {
          const h0 = clothAt(1, da, ps, S, t), pts = [];
          for (let i = 0; i <= 12; i++) { const k = i / 12; pts.push(new THREE.Vector3(h0[0] + (e[0] - h0[0]) * k, h0[1] + (e[1] - h0[1]) * k - (1 - taut) * 0.12 * Math.sin(Math.PI * k) * (e[1] > 0.1 ? 1 : 0), h0[2] + (e[2] - h0[2]) * k)); }
          set(ropes[n], pts, 0.006);
        });
      },
    };
  },

  tentpeg(P) {
    const al = mat("#b9bec6", { roughness: 0.3, metalness: 0.75 });
    const g = new THREE.Group(); P.whole.add(g); g.rotation.z = 0.25;
    const rod = mesh(new THREE.CylinderGeometry(0.008, 0.005, 0.2, 8), al, g, 0, 0.1, 0);
    const hook = mesh(new THREE.TorusGeometry(0.02, 0.006, 6, 12, Math.PI), al, g, 0.02, 0.2, 0); hook.rotation.z = Math.PI / 2;
    return { grip: 0, apply(ps) { g.position.y = -0.17 * clamp((P.spec.sink ?? 0.3) + (ps.drop || 0)); } };
  },

  backpack(P) {
    const canvasM = mat(P.spec.color ?? "#4b5a7a", { roughness: 0.9 }), leather = mat("#6e4528", { roughness: 0.7 }), buckle = mat("#c8a24a", { roughness: 0.3, metalness: 0.7 });
    const body = mesh(new THREE.SphereGeometry(1, 24, 16), canvasM, P.whole, 0, 0.2, 0); body.scale.set(0.2, 0.22, 0.13);
    const flap = mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), leather, P.whole, 0, 0.3, 0.005); flap.scale.set(0.205, 0.14, 0.135);
    const pocket = mesh(new THREE.SphereGeometry(1, 16, 10), canvasM, P.whole, 0, 0.13, 0.11); pocket.scale.set(0.12, 0.08, 0.05);
    for (const s of [-1, 1]) { const st = mesh(new THREE.BoxGeometry(0.03, 0.2, 0.012), leather, P.whole, s * 0.07, 0.29, 0.125); st.rotation.x = -0.35; mesh(new THREE.BoxGeometry(0.035, 0.025, 0.012), buckle, P.whole, s * 0.07, 0.2, 0.15); }
    // a rolled mat strapped under it
    const roll = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.36, 16), mat("#5f8a4a", { roughness: 0.85 }), P.whole, 0, 0.055, 0.02); roll.rotation.z = Math.PI / 2;
    return { grip: 0 };
  },

  firering(P) {
    const R = P.spec.r ?? 0.32, r = rng(P.spec.seed ?? 4), stone = mat("#8f8a84", { roughness: 0.95 }), stone2 = mat("#a59d92", { roughness: 0.95 });
    const n = 11;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.2, s = 0.07 + r() * 0.03;
      const m = mesh(new THREE.DodecahedronGeometry(s, 1), i % 3 ? stone : stone2, P.whole, Math.cos(a) * R, s * 0.55, Math.sin(a) * R * 0.92);
      m.scale.set(1.2, 0.75, 1); m.rotation.set(r() * 2, r() * 3, r() * 2);
    }
    const ash = mesh(new THREE.CircleGeometry(R * 0.8, 24), mat("#3a3430", { roughness: 1 }), P.whole, 0, 0.006, 0); ash.rotation.x = -Math.PI / 2; ash.castShadow = false;
    for (let i = 0; i < 4; i++) { const l = mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.24, 8), mat("#2b211b", { roughness: 1 }), P.whole, (r() - 0.5) * R * 0.6, 0.025, (r() - 0.5) * R * 0.6); l.rotation.set(Math.PI / 2, r() * 3, 0); l.rotation.order = "YXZ"; }
    return { grip: 0 };
  },

  windleaves(P) {
    const S = P.spec, N = S.n ?? 14, W = S.w ?? 6, H = S.h ?? 2.2, D = S.d ?? 3, r = rng(S.seed ?? 9);
    const m = new THREE.MeshStandardMaterial({ map: leafTex(), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8 }); m.userData.noOutline = true;
    const leaves = Array.from({ length: N }, () => {
      const q = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), m); q.rotation.order = "YXZ"; P.whole.add(q);
      return { q, ph: r(), y: 0.4 + r() * H, z: (r() - 0.5) * D, sp: 1.2 + r() * 0.9, bob: 0.1 + r() * 0.15, spin: 4 + r() * 6 };
    });
    return {
      grip: 0,
      apply(ps, t) {
        for (const L of leaves) {
          // across the whole width from +x to -x and round again off screen
          const u = (L.ph + (t * L.sp) / W) % 1, x = W / 2 - u * W;
          L.q.position.set(x, L.y + L.bob * Math.sin(t * 3 + L.ph * 9), L.z);
          L.q.rotation.set(t * L.spin * 0.5 + L.ph * 6, t * L.spin * 0.3, t * L.spin * 0.2);
        }
      },
    };
  },
};
