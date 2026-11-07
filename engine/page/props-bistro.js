import * as THREE from "three";
import { clamp, lerp, rng } from "./util.js";
import { mat, basic, mesh, canvasTex, smooth } from "./props-trend.js";
import { flameMesh, glowMesh } from "./props-candle.js";

// "My friend group trying to split one bill" (friends try to, episode 4, 5 Nov 2026): a cosy evening bistro, the bill
// and everything the four friends throw at it. Jonny's brief and eight panels: a long table with a red-striped cloth,
// the bill on a little tray, Viking's stack of empty plates, Phoenix's one glass of water, Viking's pouch of coins,
// buttons, a marble and a fish bone, the Wizard's glowing sum, the four strips, and the waiter's new, much longer bill.
//   bistrotable  a long low wooden table along x (spec.w, spec.d, spec.h) under a white cloth with red stripes that hangs
//                spec.drape metres over its front and ends. Origin: the floor under its middle. Grip: its top (h).
//   billtray     a little black bill tray (0.16 x 0.24) with a raised rim. Origin: its bottom centre.
//   receipt      the bill: a till receipt (spec.w 0.1 x spec.len 0.26) lying flat (its top edge toward -z), printed lines
//                and a TOTAL. `bend` 0..1 bows it up in the middle (a tug of war between two hands holding its ends).
//                Held up by one end with tip 90 it hangs down from its top edge (origin: its middle).
//   billstrip    one of the four strips Reaper cuts it into (spec.i 0..3 picks which quarter is printed on it). Origin:
//                its middle. `spin` turns it as it flutters (degrees).
//   longbill     the waiter's new bill: a fat paper roll that, as `unroll` goes 0..1, rolls along spec.path (points in
//                its own frame, the first at the origin: across the table, over its front edge, down to the floor and
//                along it), laying the paper out behind it. Before it unrolls it is only the roll (held in a hand).
//   sum          the Wizard's glowing calculator spell: four numbers float up out of the bill (spec.from, an offset from
//                the origin) and gather on a ring of light round the origin, with "= 1,249" in the middle. `rise` 0..1
//                lifts them in, `spin` (degrees) turns the ring and the numbers on it, `burst` 0..1 blows it apart (a
//                bright flash that fades; the confetti is a confetti prop).
//   waterglass   a plain tumbler of water (r 0.038, h 0.1). `fill` 0..1 its level, `count` 0..1 shows the confetti
//                flecks floating in it.
//   platestack   spec.n empty dinner plates stacked up, crumbs and a fork on top (Viking ate the most).
//   dinnerplate  one empty dinner plate with a few crumbs.
//   pouch        a leather coin pouch with a drawstring, lying on its side, its mouth toward +x. `open` 0..1 opens it.
//   spillpile    what falls out of the pouch: coins, buttons and one marble that slide out of spec.from (an offset from
//                the origin) and scatter over the table round the origin as `spill` goes 0..1.
//   fishbone     a cartoon fish skeleton (head, spine, ribs, tail), lying flat. Origin: its middle.
//   napkin       a white napkin tucked in at the neck (worn: spec.wear, in the body's frame), hanging down the chest.
//   waiterapron  a short white waiter's apron round the front of the body (worn: spec.wear), its tie band at the waist.
//   cardreader   a card machine: a dark handset with a little lit screen and keypad (0.078 x 0.155 x 0.03), held with
//                the phone hold, its screen toward the holder.
//   bottlecandle a candle stuck in a green wine bottle with wax run down its neck, lit (`lit`, default 1).
//   bistroplant  a leafy plant in a terracotta pot (foreground dressing).
export const BISTRO = { table: { h: 0.38 }, receipt: { w: 0.1, len: 0.26 }, glass: { r: 0.038, h: 0.1 }, roll: { r: 0.045, w: 0.11 } };
export const BISTRO_GRIPS = {};

const PAPER = "#fbf8ef", INK = "#3a3a44";

// the receipt's print, drawn once: a little shop name line, item lines with prices, a rule and TOTAL
function receiptTex(rows = 9, total = true, seed = 3) {
  return canvasTex(128, 336, (g, w, h) => {
    g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    g.fillStyle = INK;
    g.fillRect(28, 16, 72, 9); g.fillRect(40, 30, 48, 5);   // the bistro's name (a blur of print, nothing readable)
    for (let i = 0; i < rows; i++) {
      const y = 56 + i * 24;
      g.fillRect(12, y, 34 + r() * 34, 5);
      g.fillRect(w - 12 - (16 + r() * 8), y, 16 + r() * 8, 5);
    }
    if (total) {
      const y = 56 + rows * 24 + 4;
      g.fillRect(10, y, w - 20, 2);
      g.font = "900 22px sans-serif"; g.fillText("TOTAL", 10, y + 28); g.textAlign = "right"; g.fillText("1249", w - 10, y + 28);
    }
    // the zigzag tear at the bottom edge is in the mesh outline; a faint grey edge so it reads on the white cloth
    g.strokeStyle = "rgba(0,0,0,0.18)"; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}

// the plate's china (shared): white with a thin blue rim
function plateMesh(parent, y = 0, r = 0.15, crumbs = 0, seed = 1) {
  const china = mat("#f7f5ef", { roughness: 0.35 }), rim = mat("#3d8fb0", { roughness: 0.4 });
  const prof = [[0.001, 0], [r * 0.62, 0], [r * 0.66, 0.008], [r * 0.7, 0.008], [r, 0.02], [r - 0.006, 0.022], [r * 0.7, 0.012], [0.001, 0.012]].map(([x, yy]) => new THREE.Vector2(x, yy));
  const p = mesh(new THREE.LatheGeometry(prof, 40), china, parent, 0, y, 0); p.material.side = THREE.DoubleSide;
  const band = mesh(new THREE.TorusGeometry(r - 0.012, 0.0028, 6, 40), rim, parent, 0, y + 0.019, 0); band.rotation.x = Math.PI / 2; band.castShadow = false;
  if (crumbs) {
    const rr = rng(seed), cm = [mat("#c98b45", { roughness: 0.9 }), mat("#8f5a2a", { roughness: 0.9 }), mat("#d7b062", { roughness: 0.9 })];
    for (let i = 0; i < crumbs; i++) { const a = rr() * 6.28, d = Math.sqrt(rr()) * r * 0.55, c = mesh(new THREE.DodecahedronGeometry(0.005 + rr() * 0.006, 0), cm[i % 3], parent, Math.cos(a) * d, y + 0.014, Math.sin(a) * d); c.castShadow = false; c.scale.y = 0.6; }
    // a smear of sauce
    const s = mesh(new THREE.CircleGeometry(1, 20), mat("#b5502a", { roughness: 0.5 }), parent, r * 0.18 * (rr() - 0.5), y + 0.0125, r * 0.2 * (rr() - 0.5)); s.rotation.x = -Math.PI / 2; s.scale.set(r * 0.32, r * 0.16, 1); s.castShadow = false;
  }
  return p;
}

export const BISTRO_KINDS = {
  bistrotable(P) {
    const S = P.spec, W = S.w ?? 1.5, D = S.d ?? 0.8, H = S.h ?? BISTRO.table.h, DR = S.drape ?? 0.12;
    const wood = mat("#7a4a28", { roughness: 0.6 }); wood.userData.lookRole = "wood";
    // the cloth: white with red stripes running across the table (toward the camera), as in the panels
    const tex = canvasTex(512, 256, (g, w, h) => {
      g.fillStyle = "#f6f0e4"; g.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 64) { g.fillStyle = "#c8323a"; g.fillRect(x + 6, 0, 8, h); g.fillRect(x + 20, 0, 3, h); g.fillStyle = "rgba(200,50,58,0.25)"; g.fillRect(x + 30, 0, 14, h); }
      g.fillStyle = "rgba(0,0,0,0.03)"; for (let y = 0; y < h; y += 4) g.fillRect(0, y, w, 1);
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    const cloth = mat("#ffffff", { map: tex, roughness: 0.85 });
    const topTex = tex.clone(); topTex.needsUpdate = true; topTex.repeat.set(W / 1.2, 1);
    const top = mat("#ffffff", { map: topTex, roughness: 0.85 });
    mesh(new THREE.BoxGeometry(W, 0.04, D), wood, P.whole, 0, H - 0.03, 0);
    mesh(new THREE.BoxGeometry(W + 0.03, 0.006, D + 0.03), top, P.whole, 0, H - 0.007, 0).castShadow = false;
    // the drape: front and both ends, a soft wave along its hem
    const drape = (len, rotY, x, z) => {
      const geo = new THREE.PlaneGeometry(len, DR, Math.max(8, Math.round(len * 24)), 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); p.setZ(i, (0.5 - v / DR) * 0.012 * Math.sin(u * 23)); }
      geo.computeVertexNormals();
      const t2 = tex.clone(); t2.needsUpdate = true; t2.repeat.set(len / 1.2, DR / 0.6);
      const m = mesh(geo, mat("#ffffff", { map: t2, roughness: 0.85, side: THREE.DoubleSide }), P.whole, x, H - DR / 2 - 0.004, z); m.rotation.y = rotY;
      return m;
    };
    drape(W + 0.03, 0, 0, D / 2 + 0.016);
    drape(D + 0.03, Math.PI / 2, -W / 2 - 0.016, 0); drape(D + 0.03, -Math.PI / 2, W / 2 + 0.016, 0);
    for (const x of [-1, 1]) for (const z of [-1, 1]) mesh(new THREE.BoxGeometry(0.05, H - 0.05, 0.05), wood, P.whole, x * (W / 2 - 0.06), (H - 0.05) / 2, z * (D / 2 - 0.06));
    void cloth;
    return { grip: H };
  },

  billtray(P) {
    const blk = mat(P.spec.color ?? "#26222a", { roughness: 0.45 }), W = 0.16, L = 0.24, T = 0.008;
    mesh(new THREE.BoxGeometry(W, T, L), blk, P.whole, 0, T / 2, 0);
    for (const [x, z, w, l] of [[0, L / 2 - 0.004, W, 0.008], [0, -L / 2 + 0.004, W, 0.008], [W / 2 - 0.004, 0, 0.008, L], [-W / 2 + 0.004, 0, 0.008, L]]) mesh(new THREE.BoxGeometry(w, 0.018, l), blk, P.whole, x, 0.009, z);
    return { grip: 0.01 };
  },

  receipt(P) {
    const R = BISTRO.receipt, W = P.spec.w ?? R.w, L = P.spec.len ?? R.len;
    const m = new THREE.MeshStandardMaterial({ map: receiptTex(), roughness: 0.9, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(W, L, 2, 16); geo.rotateX(-Math.PI / 2);   // flat, its top edge toward -z
    const base = geo.attributes.position.array.slice();
    const o = mesh(geo, m, P.whole, 0, 0.002, 0); o.castShadow = false;
    let last = -1;
    return {
      grip: 0.002,
      apply(ps) {
        const b = clamp(ps.bend ?? 0);
        if (b === last) return; last = b;
        const p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const z = base[i * 3 + 2]; p.setY(i, base[i * 3 + 1] + b * 0.05 * Math.cos((z / L) * Math.PI)); }
        p.needsUpdate = true; geo.computeVertexNormals();
      },
    };
  },

  billstrip(P) {
    const R = BISTRO.receipt, W = R.w, L = R.len / 4, i = P.spec.i ?? 0;
    const tex = receiptTex(); tex.repeat.set(1, 0.25); tex.offset.set(0, 0.75 - 0.25 * i);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(W, L, 2, 2); geo.rotateX(-Math.PI / 2);
    const o = mesh(geo, m, P.whole, 0, 0.002, 0); o.castShadow = false;
    return { grip: 0.002, apply(ps) { o.rotation.y = ((ps.spin ?? 0) * Math.PI) / 180; } };
  },

  longbill(P) {
    const B = BISTRO.roll, W = P.spec.w ?? B.w, R0 = P.spec.r ?? B.r;
    const pts = (P.spec.path ?? [[0, 0, 0], [0, 0, 0.5], [0, -0.38, 0.62], [0, -0.38, 1.4]]).map(([x, y, z]) => new THREE.Vector3(x, y, z));
    // the path's arc length
    const segs = []; let L = 0;
    for (let i = 1; i < pts.length; i++) { const d = pts[i].distanceTo(pts[i - 1]); segs.push([L, d, pts[i - 1], pts[i]]); L += d; }
    const at = (s) => { for (const [s0, d, a, b] of segs) if (s <= s0 + d + 1e-9) return { p: a.clone().lerp(b, d ? (s - s0) / d : 0), dir: b.clone().sub(a).normalize() }; const [, , a, b] = segs[segs.length - 1]; return { p: b.clone(), dir: b.clone().sub(a).normalize() }; };
    const tex = receiptTex(12, false, 9); tex.wrapT = THREE.RepeatWrapping;
    const paperM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
    const N = 120, geo = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
    for (let i = 0; i < N; i++) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
    const strip = mesh(geo, paperM, P.whole); strip.castShadow = false; strip.frustumCulled = false;
    // the roll: a paper cylinder across the path (its axis along x), its end faces showing the spiral
    const rollG = new THREE.Group(); P.whole.add(rollG);
    const side = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "#efe9da"; g.fillRect(0, 0, w, h); g.strokeStyle = "#cfc6b0"; g.lineWidth = 2; for (let r = 6; r < 64; r += 5) { g.beginPath(); g.arc(64, 64, r, 0, Math.PI * 2); g.stroke(); } g.fillStyle = "#7a6a52"; g.beginPath(); g.arc(64, 64, 6, 0, Math.PI * 2); g.fill(); });
    const roll = mesh(new THREE.CylinderGeometry(1, 1, W, 32), [mat(PAPER, { roughness: 0.85 }), mat("#ffffff", { map: side, roughness: 0.9 }), mat("#ffffff", { map: side, roughness: 0.9 })], rollG); roll.rotation.z = Math.PI / 2;
    let last = -1;
    return {
      grip: 0,
      apply(ps) {
        const u = clamp(ps.unroll ?? 0);
        if (u === last) return; last = u;
        const s = u * L, r = R0 * Math.sqrt(1 - 0.8 * u);
        // the laid paper: from the start to s, lying on the path; the paper has a thickness of zero, lift it 2 mm
        for (let i = 0; i <= N; i++) {
          const q = at((s * i) / N), n = new THREE.Vector3(0, 1, 0);
          if (Math.abs(q.dir.y) > 0.5) n.set(0, 0, 1);   // going down the front: the paper's face looks at us
          const c = q.p.clone().addScaledVector(n, 0.002);
          pos.set([c.x - W / 2, c.y, c.z, c.x + W / 2, c.y, c.z], i * 6);
          const v = (s * i) / N / 0.26;   // one receipt's print every 26 cm
          uv.set([0, -v, 1, -v], i * 4);
        }
        geo.attributes.position.needsUpdate = true; geo.attributes.uv.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
        strip.visible = u > 0.002;
        // the roll sits on the paper at s (on top going across, in front going down)
        const q = at(s), n = Math.abs(q.dir.y) > 0.5 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
        rollG.position.copy(q.p).addScaledVector(n, r + 0.002);
        roll.scale.set(r, 1, r);
        roll.rotation.x = -s / Math.max(r, 0.01);   // it turns as it rolls
        rollG.visible = r > 0.004;
      },
    };
  },

  sum(P) {
    const S = P.spec, from = new THREE.Vector3(...(S.from ?? [0, -0.6, 0]));
    const gold = "#ffd75e";
    const label = (text, size, w = 256, h = 96) => {
      const t = canvasTex(w, h, (g) => {
        g.font = `900 ${size}px sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.shadowColor = "#ff9a1f"; g.shadowBlur = 18; g.lineWidth = 7; g.strokeStyle = "#b8560c"; g.strokeText(text, w / 2, h / 2);
        g.fillStyle = "#fff4c2"; g.fillText(text, w / 2, h / 2);
      });
      const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }); m.userData.noOutline = true;
      const sp = new THREE.Sprite(m); P.whole.add(sp); return sp;
    };
    const nums = ["328", "+456", "+189", "+276"].map((n) => label(n, 64));
    const total = label("= 1,249", 70, 384, 110);
    const slots = [[-0.17, 0.12], [0.17, 0.12], [-0.17, 0.0], [0.17, 0.0]];
    const ringM = new THREE.MeshBasicMaterial({ color: gold, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); ringM.userData.noOutline = true;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.006, 6, 64), ringM); ring.rotation.x = Math.PI / 2 - 0.35; P.whole.add(ring);
    const flashM = new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g, w) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,250,220,1)"); gr.addColorStop(0.35, "rgba(255,210,90,0.8)"); gr.addColorStop(1, "rgba(255,160,40,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, w); }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    flashM.userData.noOutline = true;
    const flash = new THREE.Sprite(flashM); P.whole.add(flash);
    return {
      grip: 0,
      apply(ps, t) {
        const r = clamp(ps.rise ?? 0), b = clamp(ps.burst ?? 0), spin = ((ps.spin ?? 0) * Math.PI) / 180;
        const on = r > 0.001 && b < 0.999;
        nums.forEach((sp, i) => {
          const k = smooth(clamp(r * 1.6 - i * 0.2));
          const [sx, sy] = slots[i], a = spin + i * 1.57;
          // from the bill up to its slot, then wobbling round on the ring as the spell speeds up
          const orbit = clamp((ps.spin ?? 0) / 360) * 0.06;
          sp.position.set(lerp(from.x, sx + Math.cos(a) * orbit, k), lerp(from.y, sy + Math.sin(a) * orbit * 0.6, k), lerp(from.z, Math.sin(a) * orbit, k));
          sp.scale.set(0.2, 0.075, 1).multiplyScalar(0.4 + 0.6 * k + b * 0.8);
          sp.material.opacity = clamp(k * 2) * (1 - b); sp.visible = on && k > 0.01;
        });
        const kt = smooth(clamp((r - 0.6) / 0.4));
        total.position.set(0, -0.13, 0.01); total.scale.set(0.34, 0.097, 1).multiplyScalar(0.6 + 0.4 * kt + b * 0.6);
        total.material.opacity = kt * (1 - b); total.visible = on && kt > 0.01;
        ring.visible = on && r > 0.3; ring.rotation.z = spin; ring.material.opacity = clamp((r - 0.3) * 2) * (1 - b) * 0.8; ring.scale.setScalar(1 + b * 0.8);
        // the burst: a flash that blooms and fades
        flash.visible = b > 0.001 && b < 0.999; flash.scale.setScalar(0.3 + 1.1 * Math.sqrt(b)); flash.material.opacity = Math.pow(1 - b, 1.5);
        void t;
      },
    };
  },

  waterglass(P) {
    const G = BISTRO.glass;
    const glass = new THREE.MeshPhysicalMaterial({ color: "#eef9ff", roughness: 0.05, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide });
    glass.userData.glass = true;
    const prof = [[0.001, 0], [G.r * 0.88, 0], [G.r * 0.9, 0.012], [G.r, G.h], [G.r - 0.003, G.h], [G.r * 0.86, 0.014], [0.001, 0.014]].map(([x, y]) => new THREE.Vector2(x, y));
    const sh = mesh(new THREE.LatheGeometry(prof, 32), glass, P.whole); sh.castShadow = false; sh.renderOrder = 3;
    const rim = mesh(new THREE.TorusGeometry(G.r - 0.0015, 0.0018, 6, 32), mat("#ffffff", { roughness: 0.2 }), P.whole, 0, G.h, 0); rim.rotation.x = Math.PI / 2; rim.castShadow = false;
    const waterM = new THREE.MeshStandardMaterial({ color: "#9fd4ef", transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false }); waterM.userData.liquid = true;
    const water = mesh(new THREE.CylinderGeometry(G.r * 0.94, G.r * 0.88, 1, 28), waterM, P.whole); water.renderOrder = 2; water.castShadow = false;
    const top = mesh(new THREE.CircleGeometry(G.r * 0.93, 28), mat("#c8ecff", { roughness: 0.1, emissive: new THREE.Color("#5fb6e6"), emissiveIntensity: 0.25 }), P.whole); top.rotation.x = -Math.PI / 2; top.castShadow = false;
    const r = rng(4), cols = ["#e0475b", "#ffd23f", "#3d8fb0", "#6cbf3a", "#f07fa6"], flecks = [];
    for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = Math.sqrt(r()) * G.r * 0.7, m = basic({ color: cols[i % 5], side: THREE.DoubleSide }); const f = mesh(new THREE.PlaneGeometry(0.014, 0.01), m, P.whole, Math.cos(a) * d, 0, Math.sin(a) * d); f.rotation.set(-Math.PI / 2, 0, r() * 3); f.castShadow = false; flecks.push(f); }
    return {
      grip: G.h / 2,
      apply(ps) {
        const f = clamp(ps.fill ?? 1), y1 = 0.014 + (G.h - 0.03) * f;
        water.visible = top.visible = f > 0.02; water.scale.y = y1 - 0.014; water.position.y = (y1 + 0.014) / 2; top.position.y = y1 + 0.001;
        const n = Math.round(clamp(ps.count ?? 0) * flecks.length);
        flecks.forEach((q, i) => { q.visible = i < n && f > 0.02; q.position.y = y1 + 0.002; });
      },
    };
  },

  platestack(P) {
    const n = P.spec.n ?? 5, r = rng(P.spec.seed ?? 2);
    for (let i = 0; i < n; i++) { const g = new THREE.Group(); g.position.set((r() - 0.5) * 0.02, i * 0.022, (r() - 0.5) * 0.02); g.rotation.y = r() * 6; P.whole.add(g); plateMesh(g, 0, 0.15, i === n - 1 ? 14 : 0, 7 + i); }
    // a fork left on top
    const steel = mat("#c9ced6", { roughness: 0.3, metalness: 0.7 }), fork = new THREE.Group(); fork.position.set(0.02, n * 0.022 + 0.004, 0.0); fork.rotation.y = 0.6; P.whole.add(fork);
    mesh(new THREE.BoxGeometry(0.012, 0.004, 0.13), steel, fork, 0, 0, 0.03);
    for (let k = -1; k <= 1; k++) mesh(new THREE.BoxGeometry(0.004, 0.004, 0.05), steel, fork, k * 0.008, 0, -0.06);
    mesh(new THREE.BoxGeometry(0.028, 0.004, 0.012), steel, fork, 0, 0, -0.035);
    return { grip: n * 0.022 };
  },

  dinnerplate(P) { plateMesh(P.whole, 0, P.spec.r ?? 0.14, P.spec.crumbs ?? 8, P.spec.seed ?? 3); return { grip: 0.012 }; },

  pouch(P) {
    const leather = mat("#8a5530", { roughness: 0.75 }), dark = mat("#5e3518", { roughness: 0.8 }), cord = mat("#d9b878", { roughness: 0.7 });
    // a soft bag on its side: a squashed sphere toward -x, the gathered neck toward +x
    const body = mesh(new THREE.SphereGeometry(0.085, 24, 16), leather, P.whole, -0.02, 0.07, 0); body.scale.set(1.15, 0.85, 1);
    const neck = mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.06, 18, 1, true), leather, P.whole, 0.085, 0.075, 0); neck.rotation.z = Math.PI / 2; neck.material.side = THREE.DoubleSide;
    const mouth = mesh(new THREE.CircleGeometry(0.03, 18), dark, P.whole, 0.115, 0.075, 0); mouth.rotation.y = Math.PI / 2;
    const tie = mesh(new THREE.TorusGeometry(0.034, 0.006, 6, 20), cord, P.whole, 0.075, 0.075, 0); tie.rotation.y = Math.PI / 2;
    const tail = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.09, 6), cord, P.whole, 0.08, 0.035, 0.03); tail.rotation.z = 0.3;
    return {
      grip: 0.07,
      apply(ps) { const o = clamp(ps.open ?? 0); neck.scale.set(1, 1 + 0.25 * o, 1 + 0.5 * o); mouth.scale.setScalar(1 + 0.6 * o); tie.scale.setScalar(1 + 0.4 * o); },
    };
  },

  spillpile(P) {
    const S = P.spec, r = rng(S.seed ?? 21), from = S.from ?? [0, 0.1, 0];
    const gold = mat("#f2c23a", { roughness: 0.3, metalness: 0.75, emissive: new THREE.Color("#7a5200"), emissiveIntensity: 0.25 });
    const btn = ["#d6453d", "#3d8fb0", "#6cbf3a", "#e8a33c"].map((c) => mat(c, { roughness: 0.5 }));
    const marble = new THREE.MeshPhysicalMaterial({ color: "#4fb3c8", roughness: 0.05, clearcoat: 1, emissive: new THREE.Color("#1d5e70"), emissiveIntensity: 0.3 });
    const items = [], n = S.n ?? 22;
    for (let i = 0; i < n; i++) {
      const kind = i === 3 ? "marble" : i % 5 === 1 ? "button" : "coin";
      const g = new THREE.Group(); P.whole.add(g);
      if (kind === "coin") { const c = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.007, 18), gold, g, 0, 0.0035, 0); c.castShadow = i % 3 === 0; }
      else if (kind === "button") { const m = btn[i % 4]; mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.006, 18), m, g, 0, 0.003, 0); for (const [x, z] of [[-0.005, -0.005], [0.005, -0.005], [-0.005, 0.005], [0.005, 0.005]]) mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.0062, 6), mat("#2a211c"), g, x, 0.003, z).castShadow = false; }
      else mesh(new THREE.SphereGeometry(0.02, 16, 12), marble, g, 0, 0.02, 0);
      // a heap near the pouch's mouth, a few strays further out (many small, few far: no rhythm)
      const a = (r() - 0.5) * 2.6, d = 0.04 + Math.pow(r(), 1.6) * (kind === "marble" ? 0.42 : 0.26);
      const land = [Math.cos(a) * d, Math.sin(a) * d * 0.8];
      items.push({ g, kind, land, delay: r() * 0.45, tilt: kind === "coin" ? (r() - 0.5) * 0.5 : 0, spin: r() * 6, stackY: kind === "coin" && d < 0.09 ? r() * 0.012 : 0 });
    }
    return {
      grip: 0,
      apply(ps) {
        const s = clamp(ps.spill ?? 0);
        for (const q of items) {
          const k = clamp((s - q.delay) / 0.55), on = k > 0.001;
          q.g.visible = on; if (!on) continue;
          const e = smooth(k), hop = Math.sin(Math.PI * Math.min(1, k * 1.25)) * 0.05 * (1 - k);
          q.g.position.set(lerp(from[0], q.land[0], e), lerp(from[1], q.stackY, Math.min(1, k * 1.4)) + hop, lerp(from[2], q.land[1], e));
          q.g.rotation.set(q.tilt * k, q.spin * e, q.tilt * (1 - k) * 2);
        }
      },
    };
  },

  fishbone(P) {
    const bone = mat("#f1ece0", { roughness: 0.6 }), g = P.whole;
    const sp = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 8), bone, g, 0, 0.008, 0); sp.rotation.z = Math.PI / 2;
    const head = mesh(new THREE.SphereGeometry(0.04, 16, 12), bone, g, -0.12, 0.016, 0); head.scale.set(1.2, 0.45, 0.95);
    const eye = mesh(new THREE.SphereGeometry(0.008, 8, 6), mat("#2a211c"), g, -0.135, 0.032, 0.015); eye.castShadow = false;
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const x = -0.06 + i * 0.026, L = 0.055 - i * 0.004; const rib = mesh(new THREE.CylinderGeometry(0.0035, 0.0035, L, 6), bone, g, x + 0.008, 0.008, s * L * 0.45); rib.rotation.set(Math.PI / 2 - s * 0.35, 0, 0); rib.rotation.order = "XYZ"; rib.rotateZ(0); }
    const tail = new THREE.Shape(); tail.moveTo(0, 0); tail.lineTo(0.055, 0.04); tail.quadraticCurveTo(0.04, 0, 0.055, -0.04); tail.closePath();
    const t = mesh(new THREE.ShapeGeometry(tail), bone, g, 0.1, 0.009, 0); t.rotation.x = -Math.PI / 2; t.material.side = THREE.DoubleSide;
    return { grip: 0.01 };
  },

  napkin(P) {
    // a triangle of white cloth, its tucked corner at the origin, hanging down and out over the chest (+z); slightly
    // cupped so it follows the round body
    const W = P.spec.w ?? 0.3, H = P.spec.h ?? 0.26;
    const geo = new THREE.BufferGeometry(), NX = 8, NY = 6, pos = [], idx = [];
    for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const v = j / NY, u = i / NX - 0.5, w = W * v;   // a triangle point-up: narrow at the neck, wide at the hem
      const x = u * w, y = -H * v, z = 0.02 + 0.09 * v * v - 0.08 * Math.pow(Math.abs(x) / (W / 2), 2) * v + 0.01 * Math.sin(i * 1.7) * v;
      pos.push(x, y, z);
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = mesh(geo, mat("#fbfaf6", { roughness: 0.9, side: THREE.DoubleSide }), P.whole); m.castShadow = false;
    // the knot at the neck
    mesh(new THREE.SphereGeometry(0.025, 12, 8), mat("#f1efe8", { roughness: 0.9 }), P.whole, 0, 0.005, 0.02).scale.set(1.4, 0.7, 0.8);
    return { grip: 0 };
  },

  waiterapron(P) {
    const S = P.spec, y0 = S.y0 ?? 0.4, y1 = S.y1 ?? 0.07, rx = S.rx ?? 0.44, rz = S.rz ?? 0.39, arc = ((S.arc ?? 130) * Math.PI) / 180;
    const cloth = mat(S.color ?? "#f4f1ea", { roughness: 0.85, side: THREE.DoubleSide }), band = mat("#2b2b33", { roughness: 0.6, side: THREE.DoubleSide });
    const skirt = new THREE.CylinderGeometry(1, 1.04, y0 - y1, 28, 1, true, Math.PI - arc / 2 + Math.PI, arc);
    const m = mesh(skirt, cloth, P.whole, 0, (y0 + y1) / 2, 0); m.scale.set(rx, 1, rz);
    const b = mesh(new THREE.CylinderGeometry(1.005, 1.005, 0.035, 28, 1, true, Math.PI - (arc * 1.3) / 2 + Math.PI, arc * 1.3), band, P.whole, 0, y0 - 0.01, 0); b.scale.set(rx, 1, rz);
    // a pocket on the front
    const pk = mesh(new THREE.PlaneGeometry(0.16, 0.08), mat("#e7e2d6", { roughness: 0.85, side: THREE.DoubleSide }), P.whole, 0.08, (y0 + y1) / 2 - 0.02, rz * 1.02 + 0.003); pk.castShadow = false;
    return { grip: 0 };
  },

  cardreader(P) {
    const body = mat("#2d2f36", { roughness: 0.45 }), W = 0.078, H = 0.155, T = 0.03;
    mesh(new THREE.BoxGeometry(W, H, T), body, P.whole, 0, H / 2, 0);
    const scr = canvasTex(64, 48, (g, w, h) => { g.fillStyle = "#9fe3c4"; g.fillRect(0, 0, w, h); g.fillStyle = "#1d4f3c"; g.font = "900 16px sans-serif"; g.textAlign = "center"; g.fillText("PAY", w / 2, 30); });
    const s = mesh(new THREE.PlaneGeometry(0.056, 0.042), new THREE.MeshBasicMaterial({ map: scr }), P.whole, 0, H * 0.74, -T / 2 - 0.001); s.rotation.y = Math.PI; s.castShadow = false;
    const keyM = mat("#d9dbe0", { roughness: 0.5 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const k = mesh(new THREE.BoxGeometry(0.014, 0.01, 0.004), keyM, P.whole, (j - 1) * 0.02, 0.025 + i * 0.016, -T / 2 - 0.002); k.castShadow = false; }
    return { grip: H / 2 };
  },

  bottlecandle(P) {
    const glass = mat("#2f6b3a", { roughness: 0.15, metalness: 0.1, emissive: new THREE.Color("#163a1d"), emissiveIntensity: 0.3 });
    const prof = [[0.001, 0], [0.036, 0], [0.038, 0.01], [0.038, 0.15], [0.03, 0.18], [0.014, 0.205], [0.013, 0.25], [0.001, 0.25]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 28), glass, P.whole);
    const wax = mat("#fbf3dc", { roughness: 0.5 });
    mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 16), wax, P.whole, 0, 0.29, 0);
    // wax run down the neck in a few drips of different lengths
    const r = rng(6);
    for (let i = 0; i < 5; i++) { const a = r() * 6.28, L = 0.02 + r() * 0.06, d = mesh(new THREE.CapsuleGeometry(0.005, L, 4, 8), wax, P.whole, Math.cos(a) * 0.016, 0.25 - L / 2, Math.sin(a) * 0.016); d.castShadow = false; }
    mesh(new THREE.TorusGeometry(0.016, 0.006, 8, 20), wax, P.whole, 0, 0.252, 0).rotation.x = Math.PI / 2;
    const top = 0.33, flame = flameMesh(P.whole, top), glow = glowMesh(P.whole, top + 0.02);
    const light = new THREE.PointLight("#ffb36b", 0, 1.6, 1.8); light.position.set(0, top + 0.04, 0.03); P.whole.add(light);
    return {
      grip: 0.12,
      apply(ps, t) {
        const l = clamp(ps.lit ?? 1), fl = 1 + 0.06 * Math.sin(t * 0.229) + 0.04 * Math.sin(t * 0.379 + 1), u = flame.material.uniforms;
        u.uTime.value = t; u.uH.value = 0.05 * fl * l; u.uW.value = 0.017 * l; u.uA.value = l; flame.visible = l > 0.01;
        const g = glow.material.uniforms; g.uR.value = 0.08; g.uA.value = 0.4 * l * fl; glow.visible = l > 0.01;
        light.intensity = 0.8 * l * fl;
      },
    };
  },

  bistroplant(P) {
    const pot = mat("#b8643a", { roughness: 0.8 }), soil = mat("#3a2a1e", { roughness: 1 });
    const greens = ["#3f7f3a", "#4f9a44", "#2f6a34", "#5aa84b"].map((c) => mat(c, { roughness: 0.7, side: THREE.DoubleSide }));
    const prof = [[0.001, 0], [0.11, 0], [0.14, 0.2], [0.155, 0.2], [0.155, 0.235], [0.001, 0.235]].map(([x, y]) => new THREE.Vector2(x, y));
    mesh(new THREE.LatheGeometry(prof, 28), pot, P.whole);
    mesh(new THREE.CircleGeometry(0.14, 24), soil, P.whole, 0, 0.225, 0).rotation.x = -Math.PI / 2;
    // stems of different ages: a few long arching ones, more short ones, leaning out toward the light (+z, +x a bit)
    const r = rng(P.spec.seed ?? 12), leafG = new THREE.CircleGeometry(1, 12);
    for (let i = 0; i < 26; i++) {
      const a = r() * 6.28, big = r() < 0.3, len = big ? 0.35 + r() * 0.25 : 0.14 + r() * 0.18;
      const out = 0.3 + r() * 0.8, bx = Math.cos(a) * out * len * 0.7 + 0.04, bz = Math.sin(a) * out * len * 0.7 + 0.05, by = 0.23 + len * (0.6 + r() * 0.4);
      const stem = mesh(new THREE.CylinderGeometry(0.004, 0.006, len, 5), greens[2], P.whole, bx / 2, (0.23 + by) / 2, bz / 2); stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(bx, by - 0.23, bz).normalize()); stem.scale.y = Math.hypot(bx, by - 0.23, bz) / len; stem.castShadow = false;
      const leaf = mesh(leafG, greens[i % 4], P.whole, bx, by, bz); const s = big ? 0.07 + r() * 0.04 : 0.04 + r() * 0.03;
      leaf.scale.set(s * 0.55, s, 1); leaf.rotation.set(-0.6 - r() * 0.8, a, (r() - 0.5) * 1.2);
    }
    return { grip: 0.235 };
  },
};

// one confetti square that stays put where it landed (worn: on Viking's nose, on the Wizard's hat). spec.color
BISTRO_KINDS.fleck = (P) => {
  const m = basic({ color: P.spec.color ?? "#ffd23f", side: THREE.DoubleSide });
  const o = mesh(new THREE.PlaneGeometry(0.035, 0.024), m, P.whole); o.castShadow = false; o.rotation.z = 0.4;
  return { grip: 0 };
};
