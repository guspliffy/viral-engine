import * as THREE from "three";
import { clamp, rng } from "./util.js";

// props-gravroom.js: fact what-if 02 "What if gravity got stronger every five seconds?" (19 Nov 2026): the living room's props
// (storyboards/series/facts/02-gravity/DESIGN.md §1, §5, §6, §7, §8). The room itself is the set "gravroom" (set-gravroom.js).
// World metres, y up, front +z, rot 0 faces +z (the camera side). Every frame is a pure function of the params and the seed 26031.
// Registry (already in props3d.js): Object.assign(KINDS, GRAVROOM_KINDS, ...).
// TWEENING: a param that props3d.js propState does not know (sink, damage, crumble, haze, density, r, feather, cx, cy) JUMPS at its
// first "prop" action unless it was seeded by an earlier one: put `c.prop(0, id, { sink: 0 }, 0)` first, as the Mona Lisa props do.
// `glow` (gtv) is a known key; this file makes its default 1. Scale 0 hides a prop (it costs nothing then).
//
//   gsofa    the teal two-seat sofa 2.04 (x) x .91 (z), seat top y .45, back top y .87, arms to y .62, legs .14 tall, with two pillows.
//            ORIGIN: the floor under the middle of the footprint, facing +z. Put it at (.20, 0, -1.61).
//            spec dip [dx, dz] ([.26, .01], in the sofa's own frame: Spud's spot (.46,-1.60) world when the sofa stands at (.20,-1.61));
//                 pillows true (false leaves both out).
//            params sink 0..0.17 (0) the seat top's depression in metres under the dip centre, bell exp(-(dx/.52)^2 - (dz/.34)^2)
//                       over both seat cushions (the cushion keeps >= 2 cm); sink .16 is Spud at 35 g.
//                   brk 0..1 (0) the Moon's room hit (v2, see props-gravmoon.js groomhit): = roomHit P(59.287, 60.5). The back drops .24 (.5) / .43 (1), the
//                       back panel splits in two, the back cushions and panel halves tip about their lower edge, the seat cushions flare outward .25 m
//                       at their outer ends (the inner edges stay under Spud), the arms splay 11 deg. 0 renders exactly as before. Seed it: c.prop(0,"sofa",{brk:0},0).
//                   damage 0..1 (0) DESIGN §7 "Legs and floor": the front legs splay from 4 to 12 degrees, the rear from 4 to 6 (outward,
//                       away from the middle), the whole frame drops .03 m (seat top .45 -> .42, legs shorten so the feet stay on the
//                       floor), 3 floor cracks per foot grow to .24 m (dark ribbons on the floor, y .003), wood splinters appear at the
//                       two front feet. Cracks and splinters are not solid; the sofa is (the cast lies on it, the director plans contact).
//            Legs (sofa frame): (-.82,-.34) (.82,-.34) rear, (-.82,.34) (.82,.34) front; world (-.62,-1.95) (1.02,-1.95) (-.62,-1.27) (1.02,-1.27).
//            Colours: upholstery #30595B (a seeded tweed canvas), welt/frame #234344, shadow #223A3E, legs #69462F, pillows #B16851
//            (left, x -.68 / z -.26, rolled toward the middle 16 deg) and #C2A17A (right, x +.78 / z -.29, 19 deg), .39 x .38 x .13, y .64.
//   gtv      a wooden cabinet (1.16 x .39 x .56, #9E633D, 2 drawers left, 2 doors, pulls #573D34, 4 legs) with a flat TV on it
//            (frame #23252A); the picture (DESIGN §6: Alps, 3 ridge layers, 5 front peaks of 10 facets, LIVE lower third) is a 1280 x 720
//            canvas on the .94 x .53 screen, centre (0, .88, +.036) in the prop's frame, surface z .0547. ORIGIN: the floor under the
//            cabinet's middle, facing +z at rot 0. Put it at (-1.52, 0, -.99) with rot 34 (screen centre then lands near (-1.50,.88,-.96)).
//            params crumble 0..1 (0): summits drop (.05 .23 .17 .20 .05 at 1), faces rotate alternately +-7 deg (.5) .. +-16 (1) about
//                       their bases, 3 avalanche lobes (.5) -> 8 merged lobes with base to y .86 (1), dust opacity .67 -> .86.
//                       Redrawn only when crumble changes (to 1/400).
//                   glow 0..1 (1) the picture's brightness (.45 .. 1) and a soft halo in front of the screen (additive, not solid).
//            Not solid: the picture and halo. Everything else is.
//   glamp    the floor lamp (look only): round base r .14 at the ORIGIN (floor, put at (1.45, 0, -2.12)), pole up, an arc topping at
//            y 2.31 and coming down onto a drum shade (r .24, height .32, centre (-.29, 2.01, 0) from the origin = world (1.16,2.01,-2.12),
//            #E8AC63, glowing, a bulb and a soft additive glow). The room's point light is in the SET, not here. Not solid.
//   gplant   a potted plant (look only): pot r .13 -> .18, .34 tall (#A08369), 11 stems with big leaves (#476039 / #81823C), foliage top
//            y 1.40, radius .28. ORIGIN: the floor under the pot (put it at (1.80, 0, -1.60)). Not solid.
//   grug     the round braided rug (look only): r 1.03, .018 thick, field #B39171, rings #65756C at r .87 and .92. ORIGIN: its centre on
//            the floor (put it at (.18, 0, .11)). Not solid.
//   gtunnel  a camera-attached black overlay for the tunnel vision (the pattern of eyelids in props-wakeup-fx.js): spec.cam =
//            { pos, look, fov, aspect } = the shot's camera (static shot, x/y/z/rot 0; aspect default 9/16). A card .5 m in front of it,
//            15 % larger than the frame, unlit, drawn over everything (renderOrder 1000, no depth test). Not solid, no shadow.
//            params r (2000) the clear hole's outer radius in px at 1080 x 1920 (beyond ~1700 the card is hidden); the black starts at r,
//                       the feather runs INSIDE it (clear up to r - feather); r 0 = full black.
//                   feather (84) px; cx, cy (545, 1450) the hole's centre in px from the upper left.
//   ghaze    DESIGN §5 haze: a room-filling veil + 5 soft billows (look only, never solid). ORIGIN: none, world space; leave x/y/z at 0.
//            The veil is 40 camera-facing slices (every .18 m of view depth, drawn where they are in front of what is behind them and
//            inside the room: z > -2.65, fading over .25 m), each tinted #97898B with alpha 1 - exp(-density * .18), so any surface
//            sees exp(-density * distance); the city and sky outside the window get the room's depth of haze only. It follows the
//            shot's camera by itself. 5 billows (#A79895, radius .35-.75, y .23-.94, z -1.0..+.15, soft sprites).
//            params haze 0..1 (0) the §5 table: density .020 / .105 / .215 m^-1 and billow opacity 0 / .13 / .22 at 0 / .5 / 1, billow
//                       offset (0,-.15) / (.11,0) / (.23,.15). density (none) overrides the table's density in m^-1 (.055 on shot D).
//            Cost: a veil of 40 full-frame layers; scale 0 hides it, or keep density under .004 (the veil is then skipped).

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8, ...o });
function mesh(geo, m, parent, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
function canvasTex(w, h, draw, repeat = false) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
const memo = new Map(), once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
const lerp = (a, b, t) => a + (b - a) * t, sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const flat = (o, solid = false) => { o.castShadow = false; o.receiveShadow = false; o.userData.solid = solid; o.userData.steam = true; return o; };

// a woven tweed: horizontal and vertical short strokes in tones round the base colour, a few speckles (tile = .5 m)
function fabricTex(base, seed) {
  return once("fab:" + base, () => canvasTex(256, 256, (g, w, h) => {
    const rnd = rng(seed), hex = parseInt(base.slice(1), 16), R = (hex >> 16) & 255, G = (hex >> 8) & 255, B = hex & 255;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const k = 0.82 + rnd() * 0.34, x = rnd() * w, y = rnd() * h, hor = rnd() < 0.5, len = 3 + rnd() * 5;
      g.fillStyle = `rgba(${Math.min(255, Math.round(R * k))},${Math.min(255, Math.round(G * k))},${Math.min(255, Math.round(B * k))},0.55)`;
      if (hor) g.fillRect(x, y, len, 1.6); else g.fillRect(x, y, 1.6, len);
    }
    for (let i = 0; i < 200; i++) { g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.10)"; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); }
  }, true));
}

// a rounded box with a fine grid: vertices crowd into the rounded zone, then every one is projected onto the rounded surface.
// Returns the geometry; geo.userData.base holds the untouched positions and normals (for the seat dip). UVs: world-scale triplanar tile.
function roundBox(w, h, d, r, sx, sy, sz, tile = 0.5) {
  const g = new THREE.BoxGeometry(1, 1, 1, sx, sy, sz), p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  const hx = w / 2, hy = h / 2, hz = d / 2;
  const remap = (c, half) => { const t = Math.abs(c) * 2, s = Math.sign(c), inner = half - r; return s * (t <= 0.75 ? (t / 0.75) * inner : inner + ((t - 0.75) / 0.25) * r); };
  const v = new THREE.Vector3(), q = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(remap(p.getX(i), hx), remap(p.getY(i), hy), remap(p.getZ(i), hz));
    q.set(clamp(v.x, -(hx - r), hx - r), clamp(v.y, -(hy - r), hy - r), clamp(v.z, -(hz - r), hz - r));
    dir.copy(v).sub(q); const l = dir.length();
    if (l > 1e-7) { dir.divideScalar(l); v.copy(q).addScaledVector(dir, r); n.setXYZ(i, dir.x, dir.y, dir.z); }
    p.setXYZ(i, v.x, v.y, v.z);
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, v.x / tile, v.z / tile); else if (ax >= az) uv.setXY(i, v.z / tile, v.y / tile); else uv.setXY(i, v.x / tile, v.y / tile);
  }
  g.userData.base = { pos: p.array.slice(), nrm: n.array.slice(), w, h, d };
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}
// a soft pillow: a roundBox whose big faces are pushed out in the middle
function pillowGeo(w, h, d, r, puff) {
  const g = roundBox(w, h, d, r, 16, 16, 6, 0.5), p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const k = (1 - Math.pow(p.getX(i) / (w / 2), 2)) * (1 - Math.pow(p.getY(i) / (h / 2), 2)), nz = n.getZ(i);
    if (Math.abs(nz) > 0.5) p.setZ(i, p.getZ(i) + Math.sign(nz) * puff * Math.max(0, k));
  }
  g.computeVertexNormals(); return g;
}

// a thin dark ribbon on the floor along a polyline [[x,z],...], width w0 at the root to w1 at the tip; set(frac) shows the first
// part of it (the rest collapses onto the last visible point, so the geometry never changes size)
function ribbon(parent, pts, w0, w1, material, y = 0.003) {
  const N = pts.length, pos = new Float32Array(N * 6), idx = [], cum = [0];
  for (let i = 1; i < N; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[N - 1];
  for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const dirs = pts.map((_, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)]; const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; });
  const at = (s) => { for (let i = 1; i < N; i++) if (s <= cum[i] + 1e-9) { const t = (s - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-9); return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), lerp(dirs[i - 1][0], dirs[i][0], t), lerp(dirs[i - 1][1], dirs[i][1], t)]; } return [pts[N - 1][0], pts[N - 1][1], dirs[N - 1][0], dirs[N - 1][1]]; };
  const m = new THREE.Mesh(geo, material); m.frustumCulled = false; flat(m); m.renderOrder = 1; parent.add(m);
  m.userData.set = (frac) => {
    const s = clamp(frac) * total; m.visible = frac > 0.001;
    for (let i = 0; i < N; i++) {
      const [x, z, nx, nz] = at(Math.min(cum[i], s)), w = lerp(w0, w1, Math.min(cum[i], s) / total) * (s > 0 ? 1 : 0) / 2;
      pos.set([x + nx * w, y, z + nz * w, x - nx * w, y, z - nz * w], i * 6);
    }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere();
  };
  m.userData.set(0); return m;
}

// ================================================================================================= the sofa
const LEGS = [[-0.82, -0.34, 0], [0.82, -0.34, 0], [-0.82, 0.34, 1], [0.82, 0.34, 1]];   // x, z, front
function sofa(P) {
  const S = P.spec, dip = S.dip || [0.26, 0.01], G = P.whole;
  const fab = mat("#ffffff", { map: fabricTex("#30595B", 26031), roughness: 1 }), fabD = mat("#ffffff", { map: fabricTex("#234344", 26032), roughness: 1 });
  const body = new THREE.Group(); G.add(body);
  // frame, arms, back panel
  mesh(roundBox(2.0, 0.12, 0.86, 0.03, 20, 2, 8), fabD, body, 0, 0.2, 0);
  const arms = [-1, 1].map((s) => mesh(roundBox(0.22, 0.48, 0.91, 0.085, 6, 12, 14), fab, body, s * 0.91, 0.38, 0));
  const panel = mesh(roundBox(1.62, 0.54, 0.08, 0.03, 16, 6, 2), fabD, body, 0, 0.53, -0.415);
  // brk (the Moon's room hit): the back panel in two halves (hidden until brk > 0)
  const halves = [-1, 1].map((s) => { const h = mesh(roundBox(0.81, 0.54, 0.08, 0.03, 8, 6, 2), fabD, body, s * 0.405, 0.53, -0.415); h.visible = false; return h; });
  // back cushions, leaning back a little
  const backs = [-1, 1].map((s) => { const b = mesh(roundBox(0.79, 0.42, 0.13, 0.055, 16, 10, 4), fab, body, s * 0.4, 0.66, -0.31); b.rotation.x = -0.09; return b; });
  // seat cushions: a fine grid so the dip can bend the top
  const seats = [-1, 1].map((s) => {
    const geo = roundBox(0.795, 0.19, 0.71, 0.06, 28, 8, 22), m = mesh(geo, fab, body, s * 0.4025, 0.355, 0.1);
    const p = geo.attributes.position; geo.userData.wt = Float32Array.from({ length: p.count }, (_, i) => clamp((geo.userData.base.pos[i * 3 + 1] + 0.095) / 0.19));
    return m;
  });
  // pillows
  const pillows = [];
  if (S.pillows !== false) for (const [x, z, col, roll, seed] of [[-0.68, -0.26, "#B16851", -16, 11], [0.78, -0.29, "#C2A17A", 19, 12]]) {
    const pm = mesh(pillowGeo(0.39, 0.38, 0.13, 0.05, 0.03), mat("#ffffff", { map: fabricTex(col, seed), roughness: 1 }), body, x, 0.64, z);
    pm.rotation.set(-0.12, 0, (roll * Math.PI) / 180); pillows.push(pm);
  }
  // legs: tapered, pivoting at their top, outward by the rake
  const legM = mat("#69462F", { roughness: 0.55 });
  const legs = LEGS.map(([x, z, front]) => {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.14, z); G.add(pivot);
    const geo = new THREE.CylinderGeometry(0.03, 0.018, 1, 10); geo.translate(0, -0.5, 0);
    const m = mesh(geo, legM, pivot); return { pivot, m, front, out: new THREE.Vector2(Math.sign(x), Math.sign(z)).normalize() };
  });
  // floor cracks (3 per foot) and splinters (front feet)
  const rnd = rng(26031), crackM = new THREE.MeshBasicMaterial({ color: "#1b1210", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); crackM.userData.noOutline = true;
  const edgeM = new THREE.MeshBasicMaterial({ color: "#B88A58", side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }); edgeM.userData.noOutline = true;
  const cracks = [], splM = mat("#C79B66", { roughness: 0.7 }), splinters = [];
  LEGS.forEach(([x, z, front], li) => {
    const base = Math.atan2(Math.sign(z), Math.sign(x));
    for (let j = 0; j < 3; j++) {
      let a = base + (j - 1) * 1.05 + (rnd() - 0.5) * 0.4, px = x, pz = z; const L = 0.24 * (0.72 + 0.28 * rnd()), pts = [[px, pz]];
      for (let k = 0; k < 6; k++) { a += (rnd() - 0.5) * 0.7; px += (Math.cos(a) * L) / 6; pz += (Math.sin(a) * L) / 6; pts.push([px, pz]); }
      cracks.push(ribbon(G, pts, 0.026, 0.007, edgeM, 0.0025), ribbon(G, pts, 0.012, 0.0025, crackM));
    }
    if (front) for (let k = 0; k < 7; k++) {
      const len = 0.04 + rnd() * 0.06, a = rnd() * Math.PI * 2, rr = 0.03 + rnd() * 0.11, sp = flat(mesh(new THREE.BoxGeometry(len, 0.006 + rnd() * 0.006, 0.008 + rnd() * 0.008), splM, G));
      sp.position.set(x + Math.cos(a) * rr, 0.004 + (k < 2 ? 0.01 : 0), z + Math.sin(a) * rr); sp.rotation.set(0, rnd() * Math.PI, k < 2 ? 0.4 : (rnd() - 0.5) * 0.2); splinters.push([sp, 0.25 + 0.6 * (k / 7)]);
    }
  });
  let drawn = "";
  const apply = (ps) => {
    const sink = clamp(ps.sink ?? S.sink ?? 0, 0, 0.17), dmg = clamp(ps.damage ?? S.damage ?? 0), brk = clamp(ps.brk ?? S.brk ?? 0), key = `${sink.toFixed(4)}|${dmg.toFixed(4)}|${brk.toFixed(4)}`;
    if (key === drawn) return; drawn = key;
    // brk 0..1 = the room hit (gravmoon.js groomhit): back drops .24 / .43, panel halves and back cushions tip about their lower edge, seat cushions flare .25 m, arms splay
    const bdrop = brk < 0.5 ? 0.24 * (brk / 0.5) : 0.24 + 0.19 * ((brk - 0.5) / 0.5);
    panel.visible = brk <= 0; halves.forEach((h, i) => { h.visible = brk > 0; const s = i ? 1 : -1, th = (i ? 0.75 : 0.45) * brk, hh = 0.27; h.rotation.set(th, 0, -s * 0.1 * brk); h.position.set(s * (0.405 + 0.06 * brk), 0.26 - bdrop * 0.6 + hh * Math.cos(th), -0.415 + hh * Math.sin(th)); });
    backs.forEach((b, i) => {
      const s = i ? 1 : -1;
      if (brk <= 0) { b.rotation.set(-0.09, 0, 0); b.position.set(s * 0.4, 0.66, -0.31); return; }
      const th = -0.09 + (i ? 0.8 : 1.0) * brk, hh = 0.21; b.rotation.set(th, 0, -s * 0.12 * brk); b.position.set(s * (0.4 + 0.1 * brk), 0.4509 - bdrop * 0.25 + hh * Math.cos(th), -0.2911 + hh * Math.sin(th));
    });
    arms.forEach((a, i) => { const s = i ? 1 : -1, th = -s * 0.2 * brk; a.rotation.set(0, 0, th); a.position.set(s * 0.91 - 0.24 * Math.sin(th), 0.14 + 0.24 * Math.cos(th), 0); if (brk <= 0) a.position.set(s * 0.91, 0.38, 0); });
    // frame drop and legs (they pivot at the frame's underside and shorten, so the feet stay on the floor)
    const drop = 0.03 * dmg; body.position.y = -drop;
    for (const L of legs) {
      const deg = L.front ? lerp(4, 12, dmg) : lerp(4, 6, dmg), th = (deg * Math.PI) / 180, h = 0.14 - drop;
      L.pivot.position.y = h; L.pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(L.out.x * Math.sin(th), -Math.cos(th), L.out.y * Math.sin(th)));
      L.m.scale.y = h / Math.cos(th);
    }
    cracks.forEach((c) => c.userData.set(clamp(dmg * 1.15 - 0.05)));   // (each crack is a pale edge and a dark core)
    for (const [sp, at] of splinters) { const k = sstep(at * 0.8, at * 0.8 + 0.3, dmg); sp.visible = k > 0.01; sp.scale.setScalar(Math.max(0.01, k)); }
    // the seat dip: the top bends down by sink * bell, more the higher the vertex sits in the cushion; normals follow the slope
    seats.forEach((m) => {
      const geo = m.geometry, p = geo.attributes.position, n = geo.attributes.normal, b = geo.userData.base, wt = geo.userData.wt, ox = m.position.x, oz = m.position.z;
      for (let i = 0; i < p.count; i++) {
        const ex = (b.pos[i * 3] + ox - dip[0]) / 0.52, ez = (b.pos[i * 3 + 2] + oz - dip[1]) / 0.34, sh = Math.exp(-ex * ex - ez * ez), w = wt[i] * sink * sh;
        const wx = brk > 0 ? clamp(Math.abs(b.pos[i * 3] + ox) / 0.8) : 0, fx = Math.sign(ox) * 0.25 * brk * wx * wx, fy = 0.1 * brk * wx * wt[i];   // brk: the outer ends flare, the inner edge stays under Spud
        p.setXYZ(i, b.pos[i * 3] + fx, b.pos[i * 3 + 1] - w + fy, b.pos[i * 3 + 2]);
        const ny = Math.max(b.nrm[i * 3 + 1], 0), nx = b.nrm[i * 3] + (-2 * ex / 0.52) * w * ny, nz = b.nrm[i * 3 + 2] + (-2 * ez / 0.34) * w * ny, nyy = b.nrm[i * 3 + 1], l = Math.hypot(nx, nyy, nz) || 1;
        n.setXYZ(i, nx / l, nyy / l, nz / l);
      }
      p.needsUpdate = true; n.needsUpdate = true; geo.computeBoundingSphere();
    });
  };
  apply({});
  return { grip: 0, apply };
}

// ================================================================================================= the TV and its picture
const PEAKS = { x: [0.16, 0.39, 0.54, 0.69, 0.84], y: [0.34, 0.17, 0.27, 0.21, 0.36], hw: [0.17, 0.22, 0.19, 0.20, 0.17] };
const DROP1 = [0.02, 0.10, 0.06, 0.08, 0.02], DROP2 = [0.05, 0.23, 0.17, 0.20, 0.05];
// ten fixed triangular facets per peak, in peak space (u across the half width, v 0 summit .. 1 base)
const FV = [[0, 0], [-0.28, 0.28], [-0.62, 0.62], [-1, 1], [0.30, 0.26], [0.64, 0.60], [1, 1], [0.02, 0.40], [-0.05, 0.72], [0, 1]];
const FT = [[0, 1, 7, "#E8EBEB"], [0, 7, 4, "#A2B1C6"], [1, 2, 7, "#E8EBEB"], [2, 8, 7, "#596275"], [2, 3, 8, "#4d5569"], [3, 9, 8, "#596275"],
  [4, 7, 5, "#A2B1C6"], [7, 8, 5, "#42495E"], [8, 9, 5, "#42495E"], [9, 6, 5, "#3a4157"]];
const LOBES = [[0.16, 0.5, 0.12, 0.13], [0.28, 0.5, 0.13, 0.13], [0.39, 0, 0.19, 0.16], [0.465, 0.5, 0.12, 0.13], [0.54, 0, 0.19, 0.16], [0.69, 0, 0.18, 0.16], [0.80, 0.5, 0.13, 0.13], [0.91, 0.5, 0.12, 0.13]];   // x, appears at (crumble), max rx, max ry

function drawTv(g, W, H, c) {
  const X = (f) => f * W, Y = (f) => f * H, H0 = 0.76;
  const sky = g.createLinearGradient(0, 0, 0, Y(H0)); sky.addColorStop(0, "#435A87"); sky.addColorStop(1, "#8098BC"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
  // back peaks (3), pale blue with a snow cap
  [[0.27, 0.24], [0.57, 0.19], [0.93, 0.29]].forEach(([x, y]) => {
    const hw = 0.22; g.fillStyle = "#7F91AD"; g.beginPath(); g.moveTo(X(x - hw), Y(H0)); g.lineTo(X(x), Y(y)); g.lineTo(X(x + hw), Y(H0)); g.fill();
    g.fillStyle = "#C1C9D5"; g.beginPath(); g.moveTo(X(x - hw * 0.36), Y(y + (H0 - y) * 0.36)); g.lineTo(X(x), Y(y)); g.lineTo(X(x + hw * 0.32), Y(y + (H0 - y) * 0.32)); g.lineTo(X(x + hw * 0.1), Y(y + (H0 - y) * 0.27)); g.lineTo(X(x - hw * 0.12), Y(y + (H0 - y) * 0.32)); g.fill();
  });
  // the middle ridge
  g.fillStyle = "#6B7B99"; g.beginPath(); g.moveTo(0, Y(H0));
  [[0, 0.62], [0.08, 0.56], [0.17, 0.5], [0.27, 0.57], [0.36, 0.52], [0.47, 0.58], [0.58, 0.52], [0.7, 0.56], [0.8, 0.5], [0.9, 0.55], [1, 0.5]].forEach(([x, y]) => g.lineTo(X(x), Y(y)));
  g.lineTo(W, Y(H0)); g.fill();
  // the front peaks
  const k1 = clamp(c / 0.5), k2 = clamp((c - 0.5) / 0.5), ang = (c <= 0.5 ? 7 * k1 : lerp(7, 16, k2)) * Math.PI / 180;
  for (const i of [0, 4, 1, 3, 2]) {
    const drop = c <= 0.5 ? lerp(0, DROP1[i], k1) : lerp(DROP1[i], DROP2[i], k2), sy = PEAKS.y[i] + drop, hw = PEAKS.hw[i];
    g.save(); g.translate(X(PEAKS.x[i]), Y(H0)); g.rotate(ang * (i % 2 ? -1 : 1));
    const pt = ([u, v]) => [u * hw * W, (sy - H0) * H * (1 - v)];
    for (const [a, b, d, col] of FT) { const A = pt(FV[a]), B = pt(FV[b]), C = pt(FV[d]); g.fillStyle = col; g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.lineTo(C[0], C[1]); g.closePath(); g.fill(); g.strokeStyle = col; g.lineWidth = 1; g.stroke(); }
    // loose snow on two rock facets
    g.fillStyle = "#CAC2C0"; for (const [a, b, d] of [[3, 8, 2], [6, 5, 9]]) { const A = pt(FV[a]), B = pt(FV[b]), C = pt(FV[d]); g.beginPath(); g.moveTo(lerp(A[0], B[0], 0.5), lerp(A[1], B[1], 0.5)); g.lineTo(lerp(B[0], C[0], 0.4), lerp(B[1], C[1], 0.4)); g.lineTo(lerp(A[0], C[0], 0.4), lerp(A[1], C[1], 0.4)); g.fill(); }
    g.restore();
  }
  // the valley: pale cloud and snow under the peaks
  const val = g.createLinearGradient(0, Y(H0), 0, H); val.addColorStop(0, "#B9C3D6"); val.addColorStop(1, "#E2E6EE"); g.fillStyle = val; g.fillRect(0, Y(H0), W, H - Y(H0));
  const rnd = rng(26031);
  for (let i = 0; i < 9; i++) { g.fillStyle = "rgba(255,255,255,0.45)"; g.beginPath(); g.ellipse(X(0.05 + i * 0.115 + rnd() * 0.04), Y(H0 + 0.015 + rnd() * 0.06), X(0.09), Y(0.03), 0, 0, Math.PI * 2); g.fill(); }
  // the avalanche: soft dust lobes (dark debris in the core), behind the lower third
  if (c > 0.004) {
    const alpha = c <= 0.5 ? 0.67 * sstep(0, 0.12, c) : lerp(0.67, 0.86, k2);
    for (const [lx, at, rxM, ryM] of LOBES) {
      let rx, ry, cy;   // fractions of the canvas width / height
      if (at === 0) {   // the three central lobes: from the peaks down to y .69 at .5, then out to their full size with the base at .86
        if (c <= 0.5) { rx = 0.10 * (0.3 + 0.7 * k1); ry = 0.13 * (0.3 + 0.7 * k1); cy = lerp(0.45, 0.69, 1 - Math.pow(1 - k1, 2)); }
        else { rx = lerp(0.10, rxM, k2); ry = lerp(0.13, ryM, k2); cy = lerp(0.69, 0.86 - ryM, k2); }
      } else { const s = sstep(0.5, 0.82, c); if (s < 0.01) continue; rx = rxM * s; ry = ryM * s; cy = 0.86 - ry; }
      g.save(); g.translate(X(lx), Y(cy)); g.scale(rx * W, ry * H);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(160,152,158,${alpha})`); gr.addColorStop(0.55, `rgba(202,194,192,${alpha * 0.9})`); gr.addColorStop(1, "rgba(202,194,192,0)");
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill(); g.restore();
    }
    const nd = Math.round(40 * c);
    for (let i = 0; i < nd; i++) { const x = 0.16 + rnd() * 0.75, y = 0.4 + rnd() * 0.42 * Math.min(1, c * 1.4), s = 0.004 + rnd() * 0.012; g.fillStyle = "#746D73"; g.beginPath(); g.moveTo(X(x), Y(y)); g.lineTo(X(x + s), Y(y + s * 0.4 * 1.8)); g.lineTo(X(x - s * 0.5), Y(y + s * 1.6)); g.fill(); }
  }
  // the lower third (only LIVE is readable text)
  g.fillStyle = "#243149"; g.fillRect(0, Y(0.866), W, H - Y(0.866));
  g.fillStyle = "#A43842"; g.fillRect(X(0.027), Y(0.888), X(0.139 - 0.027), Y(0.961 - 0.888)); g.fillRect(X(0.154), Y(0.901), X(0.80 - 0.154), Y(0.014));
  g.fillStyle = "#FFFFFF"; g.font = "bold 30px Arial, Helvetica, sans-serif"; g.textBaseline = "alphabetic"; g.fillText("LIVE", X(0.046), Y(0.938));
  g.fillStyle = "#D6DCE4"; g.fillRect(X(0.17), Y(0.928), X(0.43 - 0.17), Y(0.022)); g.fillRect(X(0.45), Y(0.928), X(0.68 - 0.45), Y(0.022));
}

function woodTex(base, seed) {
  return once("wood:" + base, () => canvasTex(256, 256, (g, w, h) => {
    const rnd = rng(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const y = rnd() * h; g.strokeStyle = rnd() < 0.5 ? "rgba(60,30,12,0.13)" : "rgba(255,200,150,0.07)"; g.lineWidth = 1 + rnd() * 1.4; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + (rnd() - 0.5) * 6, w * 0.7, y + (rnd() - 0.5) * 6, w, y + (rnd() - 0.5) * 4); g.stroke(); }
  }, true));
}

function tv(P) {
  const S = P.spec; if (S.glow == null) S.glow = 1;   // propState starts glow at spec.glow ?? 0: this makes the default 1
  const G = P.whole, wood = mat("#ffffff", { map: woodTex("#9E633D", 7), roughness: 0.55 }), woodD = mat("#7B4A2C", { roughness: 0.6 }), door = mat("#ffffff", { map: woodTex("#A86B43", 8), roughness: 0.5 }), pull = mat("#573D34", { roughness: 0.4, metalness: 0.3 });
  // cabinet 1.16 x .39 x .56: legs .12 tall, body .44
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const geo = new THREE.CylinderGeometry(0.024, 0.015, 0.13, 10); const l = mesh(geo, woodD, G, sx * 0.51, 0.065, sz * 0.14); l.rotation.set(sz * 0.1, 0, -sx * 0.1); }
  const rb = (w, h, d, r, m, x, y, z) => mesh(roundBox(w, h, d, r, 8, 6, 6, 0.6), m, G, x, y, z);
  rb(1.16, 0.44, 0.39, 0.02, wood, 0, 0.34, 0);
  // fronts: two drawers (left), two doors
  const fz = 0.195 + 0.004;
  for (const [x0, w] of [[-0.55, 0.36], [-0.17, 0.36], [0.21, 0.34]]) {
    if (x0 === -0.55) for (const y of [0.235, 0.435]) { box(G, w, 0.185, 0.008, door, x0 + w / 2, y, fz); box(G, 0.12, 0.014, 0.014, pull, x0 + w / 2, y + 0.04, fz + 0.011); }
    else { box(G, w, 0.385, 0.008, door, x0 + w / 2, 0.34, fz); box(G, 0.014, 0.1, 0.014, pull, x0 + (x0 < 0 ? 0.03 : 0.03), 0.34, fz + 0.011); }
  }
  // the TV: a stand, a thin frame, a thicker back
  const frame = mat("#23252A", { roughness: 0.35 }), zc = 0.036;
  mesh(new THREE.BoxGeometry(0.44, 0.01, 0.2), frame, G, 0, 0.565, 0.03);
  mesh(new THREE.BoxGeometry(0.07, 0.05, 0.03), frame, G, 0, 0.59, 0.02);
  mesh(new THREE.BoxGeometry(0.968, 0.57, 0.035), frame, G, 0, 0.874, zc);
  mesh(new THREE.BoxGeometry(0.62, 0.34, 0.03), frame, G, 0, 0.88, zc - 0.03);
  const cv = document.createElement("canvas"); cv.width = 1280; cv.height = 720; const g2 = cv.getContext("2d");
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sm = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, fog: false }); sm.userData.noOutline = true; sm.userData.solid = false;
  const screen = flat(new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.53), sm)); screen.position.set(0, 0.88, zc + 0.0187 + 0.0005); G.add(screen);
  const hc = document.createElement("canvas"); hc.width = hc.height = 64; const hg = hc.getContext("2d"), gr = hg.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, "rgba(255,255,255,0.9)"); gr.addColorStop(1, "rgba(255,255,255,0)"); hg.fillStyle = gr; hg.fillRect(0, 0, 64, 64);
  const ht = new THREE.CanvasTexture(hc), hm = new THREE.MeshBasicMaterial({ map: ht, color: "#8aa2cf", transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }); hm.userData.noOutline = true; hm.userData.glow = true;
  const halo = flat(new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0), hm)); halo.position.set(0, 0.88, zc + 0.03); halo.renderOrder = 2; G.add(halo);
  let key = "";
  return {
    grip: 0, apply(ps) {
      const c = Math.round(clamp(ps.crumble ?? S.crumble ?? 0) * 400) / 400, gl = clamp(ps.glow ?? S.glow ?? 1), k = `${c}`;
      if (k !== key) { key = k; drawTv(g2, 1280, 720, c); t.needsUpdate = true; }
      const b = 0.45 + 0.55 * gl; sm.color.setRGB(b, b, b); hm.opacity = 0.22 * gl; halo.visible = gl > 0.02;
    },
  };
}
function box(parent, w, h, d, m, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), m, parent, x, y, z); }

// ================================================================================================= lamp, plant, rug
function lamp(P) {
  const G = P.whole, metal = mat("#674724", { roughness: 0.4, metalness: 0.55 });
  const bs = mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.025, 32), metal, G, 0, 0.0125, 0); void bs;
  mesh(new THREE.CylinderGeometry(0.05, 0.12, 0.05, 24), metal, G, 0, 0.05, 0);
  const curve = new THREE.CatmullRomCurve3([[0, 0.06, 0], [0, 1.5, 0], [-0.015, 1.95, 0], [-0.08, 2.24, 0], [-0.19, 2.31, 0], [-0.27, 2.26, 0], [-0.29, 2.15, 0]].map((p) => new THREE.Vector3(...p)));
  mesh(new THREE.TubeGeometry(curve, 60, 0.0125, 8), metal, G);
  const shadeM = new THREE.MeshStandardMaterial({ color: "#E8AC63", emissive: "#E8AC63", emissiveIntensity: 0.6, roughness: 1, side: THREE.DoubleSide });
  const shade = mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.32, 40, 1, true), shadeM, G, -0.29, 2.01, 0); shade.castShadow = false;
  for (const y of [0.16, -0.16]) { const r = mesh(new THREE.TorusGeometry(y > 0 ? 0.22 : 0.24, 0.006, 6, 40), metal, G, -0.29, 2.01 + y, 0); r.rotation.x = Math.PI / 2; r.castShadow = false; }
  mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 8), metal, G, -0.29, 2.17, 0);
  const bm = new THREE.MeshBasicMaterial({ color: "#FFE9B8", fog: false }); bm.userData.noOutline = true;
  flat(mesh(new THREE.SphereGeometry(0.035, 12, 8), bm, G, -0.29, 1.9, 0));
  const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 2, 64, 64, 64);
  gr.addColorStop(0, "rgba(255,220,150,0.9)"); gr.addColorStop(0.4, "rgba(255,190,110,0.35)"); gr.addColorStop(1, "rgba(255,170,90,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sp.material.userData.noOutline = true; sp.position.set(-0.29, 1.98, 0.05); sp.scale.set(1.1, 1.1, 1); sp.userData.glow = true; G.add(sp);
  G.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
  return { grip: 0 };
}

function leafGeo(len, wid, curl) {
  const g = new THREE.PlaneGeometry(1, 1, 4, 10), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2, v = p.getY(i) + 0.5, prof = Math.pow(Math.sin(Math.PI * Math.pow(v, 0.72)), 0.85);
    p.setXYZ(i, (u * wid * prof) / 2, v * len, -curl * v * v * len - Math.abs(u) * wid * 0.1 * prof);
  }
  g.computeVertexNormals(); return g;
}
function plant(P) {
  const G = P.whole, rnd = rng(26031), potM = mat("#A08369", { roughness: 0.85 });
  const prof = [[0.12, 0], [0.13, 0.01], [0.16, 0.22], [0.18, 0.33], [0.19, 0.34], [0.175, 0.34]].map(([r, y]) => new THREE.Vector2(r, y));
  mesh(new THREE.LatheGeometry(prof, 32), potM, G);
  const bot = mesh(new THREE.CircleGeometry(0.12, 24), potM, G, 0, 0.001, 0); bot.rotation.x = Math.PI / 2;
  const soil = mesh(new THREE.CircleGeometry(0.175, 24), mat("#4a3628"), G, 0, 0.31, 0); soil.rotation.x = -Math.PI / 2;
  const rim = mesh(new THREE.TorusGeometry(0.182, 0.008, 6, 32), potM, G, 0, 0.337, 0); rim.rotation.x = Math.PI / 2;
  const stemM = mat("#5b6b3a", { roughness: 0.7 }), leafM = [mat("#476039", { roughness: 0.55, side: THREE.DoubleSide }), mat("#81823C", { roughness: 0.55, side: THREE.DoubleSide })];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = i * 2.39996 + rnd() * 0.3, rr = i === 0 ? 0.02 : 0.07 + rnd() * 0.15, th = i === 0 ? 1.13 : 0.74 + rnd() * 0.36 - rr * 0.8, tip = new THREE.Vector3(Math.cos(a) * rr, th, Math.sin(a) * rr);
    const cv = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.32, 0), new THREE.Vector3(tip.x * 0.25, th * 0.55, tip.z * 0.25), tip]);
    mesh(new THREE.TubeGeometry(cv, 10, 0.007, 5), stemM, G);
    const len = 0.30 + rnd() * 0.07, wid = 0.17 + rnd() * 0.03, out = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), d = i === 0 ? new THREE.Vector3(0.1, 1, 0.05).normalize() : out.multiplyScalar(0.75).add(new THREE.Vector3(0, 0.5 + rnd() * 0.25, 0)).normalize();
    const lf = new THREE.Group(); lf.position.copy(tip); lf.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); lf.rotateY(rnd() * Math.PI * 2 * 0.5); G.add(lf);
    const m = mesh(leafGeo(len, wid, 0.3 + rnd() * 0.25), leafM[i % 2 === 0 ? (rnd() < 0.7 ? 0 : 1) : (rnd() < 0.7 ? 1 : 0)], lf); m.rotation.x = -0.1;
  }
  G.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
  return { grip: 0 };
}

function rugTex() {
  return once("rug", () => canvasTex(1024, 1024, (g, w, h) => {
    const rnd = rng(26031), cx = w / 2, R = w / 2 - 2;
    g.fillStyle = "#B39171"; g.fillRect(0, 0, w, h);
    for (let r = R; r > 0; r -= 3.2) { const k = 0.93 + rnd() * 0.12; g.strokeStyle = `rgb(${Math.round(179 * k)},${Math.round(145 * k)},${Math.round(113 * k)})`; g.lineWidth = 2.4; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke(); }
    for (const [f, wd] of [[0.87, 7], [0.92, 7]]) { for (let r = f * R - wd; r <= f * R + wd; r += 2.6) { const k = 0.92 + rnd() * 0.14; g.strokeStyle = `rgb(${Math.round(101 * k)},${Math.round(117 * k)},${Math.round(108 * k)})`; g.lineWidth = 2.2; g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke(); } }
    for (let i = 0; i < 9000; i++) { const a = rnd() * 6.2832, r = Math.sqrt(rnd()) * R; g.fillStyle = rnd() < 0.5 ? "rgba(255,240,215,0.10)" : "rgba(60,40,25,0.10)"; g.fillRect(cx + Math.cos(a) * r, cx + Math.sin(a) * r, 2, 2); }
  }));
}
function rug(P) {
  const G = P.whole, R = 1.03, th = 0.018;
  const top = mesh(new THREE.CircleGeometry(R, 96), new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 }), G, 0, th, 0); top.rotation.x = -Math.PI / 2; top.castShadow = false;
  mesh(new THREE.CylinderGeometry(R, R, th, 96, 1, true), mat("#B39171", { roughness: 1 }), G, 0, th / 2, 0).castShadow = false;
  const rim = mesh(new THREE.TorusGeometry(R - 0.004, 0.012, 8, 96), mat("#A4845F", { roughness: 1 }), G, 0, th - 0.003, 0); rim.rotation.x = Math.PI / 2; rim.scale.z = 0.8; rim.castShadow = false;
  G.traverse((o) => { if (o.isMesh) o.userData.solid = false; });
  return { grip: 0 };
}

// ================================================================================================= tunnel vision overlay
function tunnel(P) {
  const S = P.spec, cam = S.cam || {}, pos = new THREE.Vector3(...(cam.pos || [0, 1.5, 0])), look = new THREE.Vector3(...(cam.look || [0, 1.5, -1])), fov = cam.fov ?? 40, asp = cam.aspect ?? 9 / 16;
  const f = look.clone().sub(pos).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f).normalize();
  const halfH = 0.5 * Math.tan((fov * Math.PI) / 360) * 1.15, halfW = halfH * asp;
  const m = new THREE.ShaderMaterial({
    uniforms: { uR: { value: 2000 }, uF: { value: 84 }, uC: { value: new THREE.Vector2(545, 1450) }, uSz: { value: new THREE.Vector2(1080, 1920) } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uR, uF; uniform vec2 uC, uSz; varying vec2 vUv;
      void main() {
        vec2 q = (vUv - 0.5) * 1.15 + 0.5, px = vec2(q.x * uSz.x, (1.0 - q.y) * uSz.y);
        float a = smoothstep(uR - max(uF, 1.0), uR, length(px - uC));
        if (a <= 0.0) discard;
        gl_FragColor = vec4(0.0, 0.0, 0.0, a);
      }`,
    transparent: true, depthTest: true, depthFunc: THREE.AlwaysDepth, depthWrite: true, side: THREE.DoubleSide,   // always passes, and writes the card's depth so the outline pass stays behind the black
  });
  m.userData.noOutline = true;
  const card = flat(new THREE.Mesh(new THREE.PlaneGeometry(2 * halfW, 2 * halfH), m)); card.frustumCulled = false; card.renderOrder = 1000;
  card.matrixAutoUpdate = false; card.matrix.makeBasis(r, u, f.clone().negate()).setPosition(pos.clone().addScaledVector(f, 0.5)); card.matrixWorldNeedsUpdate = true;
  P.whole.add(card);
  return {
    grip: 0, apply(ps) {
      const R = ps.r ?? S.r ?? 2000, F = Math.max(0, ps.feather ?? S.feather ?? 84);
      m.uniforms.uR.value = R; m.uniforms.uF.value = F; m.uniforms.uC.value.set(ps.cx ?? S.cx ?? 545, ps.cy ?? S.cy ?? 1450);
      card.visible = R < 1700;
    },
  };
}

// ================================================================================================= haze
const SLICES = 40, STEP = 0.18, D0 = 0.15;
const HAZE = { dens: [0.020, 0.105, 0.215], peak: [0, 0.13, 0.22], off: [[0, -0.15], [0.11, 0], [0.23, 0.15]] };
const hz = (arr, h) => (h <= 0.5 ? lerp(arr[0], arr[1], h / 0.5) : lerp(arr[1], arr[2], (h - 0.5) / 0.5));
function haze(P) {
  const S = P.spec, G = P.whole, tint = new THREE.Color("#97898B");
  // the veil: SLICES camera-aligned quads in one geometry; the vertex shader puts each at its view depth
  const pos = [], dep = [], idx = [];
  for (let k = 0; k < SLICES; k++) { const d = D0 + k * STEP; for (const [x, y] of [[-1.05, -1.05], [1.05, -1.05], [1.05, 1.05], [-1.05, 1.05]]) { pos.push(x, y, 0); dep.push(d); } idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute("aD", new THREE.Float32BufferAttribute(dep, 1)); geo.setIndex(idx);
  const vm = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Vector3(tint.r, tint.g, tint.b) }, uA: { value: 0 }, uZ0: { value: -2.65 } },
    vertexShader: `attribute float aD; varying vec3 vW;
      void main() {
        vec3 vp = vec3(position.x * aD / projectionMatrix[0][0], position.y * aD / projectionMatrix[1][1], -aD);
        vW = (inverse(viewMatrix) * vec4(vp, 1.0)).xyz; gl_Position = projectionMatrix * vec4(vp, 1.0);
      }`,
    fragmentShader: `uniform vec3 uCol; uniform float uA, uZ0; varying vec3 vW;
      void main() { float f = smoothstep(uZ0, uZ0 + 0.25, vW.z); if (f <= 0.0) discard; gl_FragColor = vec4(uCol, uA * f); }`,
    transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
  });
  vm.userData.noOutline = true;
  const veil = flat(new THREE.Mesh(geo, vm)); veil.frustumCulled = false; veil.renderOrder = 40; G.add(veil);
  // the billows: soft blobs
  const tx = [0, 1].map((v) => once("billow" + v, () => canvasTex(128, 128, (g) => {
    const rnd = rng(26031 + v); for (let i = 0; i < 7; i++) { const x = 64 + (rnd() - 0.5) * 50, y = 64 + (rnd() - 0.5) * 40, r = 26 + rnd() * 22, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(255,255,255,0.55)"); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }
  })));
  const rnd = rng(26031), B = [[0.55, 0.55, -1.0, 0.62], [-0.15, 0.94, -0.65, 0.45], [0.95, 0.23, -0.3, 0.75], [0.10, 0.70, -0.05, 0.35], [0.40, 0.40, 0.15, 0.55]];
  const sprites = B.map(([x, y, z, r], i) => {
    const m = new THREE.SpriteMaterial({ map: tx[i % 2], color: "#A79895", transparent: true, opacity: 0, depthWrite: false, fog: false }); m.userData.noOutline = true;
    const s = new THREE.Sprite(m); s.userData.steam = true; s.userData.solid = false; s.userData.base = [x + (rnd() - 0.5) * 0.2, y, z]; s.scale.set(2 * r, 2 * r, 1); s.renderOrder = 41; G.add(s); return s;
  });
  return {
    grip: 0, apply(ps) {
      const h = clamp(ps.haze ?? S.haze ?? 0), dens = ps.density ?? S.density ?? hz(HAZE.dens, h), op = hz(HAZE.peak, h);
      const ox = (h <= 0.5 ? lerp(HAZE.off[0][0], HAZE.off[1][0], h / 0.5) : lerp(HAZE.off[1][0], HAZE.off[2][0], (h - 0.5) / 0.5)), oy = h <= 0.5 ? lerp(HAZE.off[0][1], HAZE.off[1][1], h / 0.5) : lerp(HAZE.off[1][1], HAZE.off[2][1], (h - 0.5) / 0.5);
      veil.visible = dens >= 0.004; vm.uniforms.uA.value = 1 - Math.exp(-dens * STEP);
      for (const s of sprites) { const b = s.userData.base; s.position.set(b[0] + ox, b[1] + oy, b[2]); s.material.opacity = op; s.visible = op > 0.002; }
    },
  };
}

export const GRAVROOM_KINDS = {
  gsofa: sofa, gtv: tv, glamp: lamp, gplant: plant, grug: rug, gtunnel: tunnel, ghaze: haze,
};
