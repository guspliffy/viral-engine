import * as THREE from "three";
import { rng } from "./util.js";
import { mat, basic, canvasTex } from "./props-trend.js";

// Kid vs Dad 08 "Dad's jokes come true" (design: storyboards/series/kid-vs-dad/08-dad-jokes-true/DESIGN.md section 9): moonview, plateshards (T3).
// Metres, y 0 = the floor, +x screen right, +z toward the camera. Deterministic: no Math.random, no clock, every "random" mark comes from a
// seeded table (engine/page/util.js rng) built once. No material opacity is ever tweened: the keys switch visibility. No letters or digits.
//
//   moonview     The moon in the kitchen window (panel 12). Origin = the kitchenroom's origin K: place it at the same x y z as the room.
//                { kind: "moonview", x: 0, y: 0, z: 0 }. An unlit card 1.60 x 1.15 at K (0, 2.05, -2.278), 0.012 in front of the window glass
//                (as episode 5's `daywindow`), one 1024 x 736 canvas, toneMapped false, no fog, no outline, casts no shadow:
//                  sky      #05070d at the top to #0b1020 at the horizon, 70 stars (54 of 2 px, 16 of 4 px, white at 0.5 to 1.0), none on the moon
//                  moon     the lower 42 % of the card: a limb arc of radius 2.4 card widths, highest at x 0.55 of the card, lit #c9ccd3 (upper right)
//                           through mid #9a9da6 to shade #63666f (lower left), a 6 px rim line #eef0f4 on the limb
//                  craters  9 ellipses flattened to 0.45, radius 0.04 to 0.16 card widths (floor #7e818a, shadow crescent #55575f upper left
//                           inside, lit rim arc #e3e5ea lower right), 14 small ones r 0.01 to 0.03, 3 boulders (#8d9099) with a shadow (#4a4c54)
//                  patch    an opaque floor parallelogram 1.2 wide x 1.8 long, #56628f, y 0.003, from the wall at z -2.278 toward the room,
//                           leaning +x by 0.30 over its length (the daywindow's lean); part of it is under the counter
//                Key `on` 0 or 1 (propState default 0; spec.on is NOT read, tween it or give a dur-0 `prop` set at time 0): shows or hides
//                card and patch together. Spec: patch (default 1; 0 leaves the floor patch out, the first cut of section 11), patchZ (-2.278,
//                where the patch starts), patchLean (0.30).
//                Light: none of its own (the unlit card and patch only). The room state ("lights" fx, "grade" keys, `moonlamp` 0.9) is the director's.
//
//   plateshards  16 china shards on the floor, where a plate landed (panel 13). { kind: "plateshards", x, y: 0, z, v: 0 }. Origin the floor
//                at the middle of the heap, y 0 = the floor; every shard inside r 0.32 of it. Shard 0.03 to 0.09 long (the bounding length), 0.006
//                thick, #f7f5ef (the `plate` kind's china); 5 of them are rim pieces cut from the plate's own rim (outer radius 0.17) with a
//                curved blue strip #3d8fb0 0.012 wide on the outer arc; each lies 0 to 12 degrees tipped, turned about y from a table.
//                Spec v 0 or 1 (default 0): two tables, so two plates do not look alike; rot turns the heap. Key `on` 0 or 1 (default 0,
//                hidden): switch it on the impact frame under the dust poof. Not solid for the contact checks, casts no shadow.
//
//   HAND         none (neither is held). No grip entry.

const D2R = Math.PI / 180;

// ---------------------------------------------------------------- moonview
export const MOON = { W: 1024, H: 736, cardW: 1.6, cardH: 1.15, y: 2.05, z: -2.278, limbR: 2.4, limbX: 0.55, top: 0.58,
  patchW: 1.2, patchL: 1.8, patchY: 0.003, lean: 0.30, nStars: [54, 16], nCraters: 9, nSmall: 14, nBoulders: 3 };

function drawMoon(c, W, H) {
  const rnd = rng(8120), R = MOON.limbR * W, cx = MOON.limbX * W, topY = MOON.top * H, cy = topY + R;
  const limbY = (x) => cy - Math.sqrt(Math.max(0, R * R - (x - cx) * (x - cx)));
  // the sky
  const sky = c.createLinearGradient(0, 0, 0, topY + 40); sky.addColorStop(0, "#05070d"); sky.addColorStop(1, "#0b1020");
  c.fillStyle = sky; c.fillRect(0, 0, W, H);
  // 54 stars of 2 px and 16 of 4 px (placed once, none on the moon: 10 px clear of the limb), brightness 0.5 to 1.0
  const stars = [];
  for (const [n, s] of [[MOON.nStars[0], 2], [MOON.nStars[1], 4]]) {
    for (let k = 0; k < n; k++) {
      let x = 0, y = 0;
      for (let tries = 0; tries < 60; tries++) { x = 8 + rnd() * (W - 16); y = 8 + rnd() * (H - 16); if (y < limbY(x) - 10 - s) break; }
      stars.push([x, y, s, 0.5 + rnd() * 0.5]);
    }
  }
  for (const [x, y, s, b] of stars) { const v = Math.round(255 * b); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s); }
  // the moon: everything below the limb arc
  const surface = () => { c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); };
  c.save(); surface(); c.clip();
  const g = c.createLinearGradient(W, topY, 0, H); g.addColorStop(0, "#c9ccd3"); g.addColorStop(0.5, "#9a9da6"); g.addColorStop(1, "#63666f");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const crater = (x, y, rx, ry, k) => {
    c.save(); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#7e818a"; c.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    c.fillStyle = "#55575f"; c.fillRect(x - rx, y - ry, rx * 2, ry * 2);   // the shadow, then the floor drawn over it shifted lower right: a crescent upper left
    c.beginPath(); c.ellipse(x + rx * 0.22 * k, y + ry * 0.26 * k, rx * 0.86, ry * 0.86, 0, 0, Math.PI * 2); c.fillStyle = "#7e818a"; c.fill();
    c.restore();
    c.strokeStyle = "#e3e5ea"; c.lineWidth = Math.max(1.5, rx * 0.07); c.lineCap = "round";
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, -10 * D2R, 100 * D2R); c.stroke();   // the lit rim arc, lower right (y is down)
  };
  // 9 craters: radius 0.04 to 0.16 card widths, flattened to 0.45; the large ones lower (nearer), spread over x
  const big = [];
  for (let k = 0; k < MOON.nCraters; k++) {
    const r = (0.04 + 0.12 * (k / (MOON.nCraters - 1))) * W * (0.9 + 0.2 * rnd());   // 41 to ~164 px
    for (let tries = 0; tries < 80; tries++) {
      const x = 0.05 * W + rnd() * 0.9 * W, ry = r * 0.45, y = limbY(x) + ry + 12 + rnd() * (H - limbY(x) - 2 * ry - 14);
      if (y + ry > H + 0.3 * ry) continue;
      if (big.some(([bx, by, br]) => Math.hypot(bx - x, (by - y) * 2.2) < (br + r) * 0.95)) continue;
      big.push([x, y, Math.min(r, 0.16 * W)]); break;
    }
  }
  for (const [x, y, r] of big) crater(x, y, r, r * 0.45, 1);
  // 14 small ones r 0.01 to 0.03 card widths
  for (let k = 0; k < MOON.nSmall; k++) {
    for (let tries = 0; tries < 60; tries++) {
      const r = (0.01 + 0.02 * rnd()) * W, x = 0.03 * W + rnd() * 0.94 * W, ry = r * 0.45, y = limbY(x) + ry + 8 + rnd() * (H - limbY(x) - 2 * ry - 10);
      if (big.some(([bx, by, br]) => Math.hypot((bx - x) / br, (by - y) / (br * 0.45)) < 1.15)) continue;
      crater(x, y, r, ry, 0.8); break;
    }
  }
  // 3 boulders with a shadow toward the lower left (the light is upper right)
  for (let k = 0; k < MOON.nBoulders; k++) {
    const r = (0.012 + 0.008 * rnd()) * W, x = (0.15 + 0.7 * rnd()) * W, y = limbY(x) + 0.4 * (H - limbY(x)) + rnd() * 0.45 * (H - limbY(x));
    c.fillStyle = "#4a4c54"; c.beginPath(); c.ellipse(x - r * 0.9, y + r * 0.35, r * 1.3, r * 0.5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#8d9099"; c.beginPath(); c.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#c2c5cc"; c.beginPath(); c.ellipse(x + r * 0.25, y - r * 0.25, r * 0.4, r * 0.28, 0, 0, Math.PI * 2); c.fill();
  }
  c.restore();
  // the rim line on the limb, 6 px
  c.strokeStyle = "#eef0f4"; c.lineWidth = 6; surface(); c.stroke();
}

function buildMoonview(P) {
  const S = P.spec, g = new THREE.Group(); P.whole.add(g);
  const tex = canvasTex(MOON.W, MOON.H, drawMoon); tex.anisotropy = 8;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(MOON.cardW, MOON.cardH), basic({ map: tex, toneMapped: false, fog: false }));
  card.position.set(0, MOON.y, MOON.z); card.castShadow = card.receiveShadow = false; card.userData.solid = false; card.userData.steam = true; g.add(card);   // steam: out of the look's ground-shadow oval (looks.js) and the light box
  if (S.patch !== 0 && S.patch !== false) {
    const z0 = S.patchZ ?? MOON.z, lean = S.patchLean ?? MOON.lean, hw = MOON.patchW / 2, L = MOON.patchL;
    const xs = (z, s) => lean * ((z - z0) / L) + s * hw;
    const poly = [[xs(z0, -1), z0], [xs(z0, 1), z0], [xs(z0 + L, 1), z0 + L], [xs(z0 + L, -1), z0 + L]];
    const geo = new THREE.ShapeGeometry(new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, z)))); geo.rotateX(Math.PI / 2); geo.translate(0, MOON.patchY, 0);
    const pm = basic({ color: "#56628f", toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, pm); m.castShadow = m.receiveShadow = false; m.userData.solid = false; m.userData.steam = true; g.add(m);   // else the oval under the prop's box paints over the patch
  }
  return { grip: 0, apply(ps) { g.visible = (ps.on ?? 0) >= 0.5; } };
}

// ---------------------------------------------------------------- plateshards
export const SHARDS = { n: 16, rim: 5, r: 0.32, thick: 0.006, lenMin: 0.03, lenMax: 0.09, plateR: 0.17, strip: 0.012, tiltMax: 12, seeds: [4021, 9137] };

// the pieces of one heap: { x, z, yaw, tilt, lift, rim: bool, len, body: Shape, strip: Shape | null }, from the seed
export function shardTable(v) {
  const rnd = rng(SHARDS.seeds[v ? 1 : 0]), out = [], placed = [];
  for (let i = 0; i < SHARDS.n; i++) {
    const rim = i % 3 === 0 && i / 3 < SHARDS.rim, len = SHARDS.lenMin + (SHARDS.lenMax - SHARDS.lenMin) * (rim ? 0.35 + 0.65 * rnd() : rnd());
    let x = 0, z = 0;
    for (let tries = 0; tries < 60; tries++) {
      const a = rnd() * Math.PI * 2, rr = (SHARDS.r - len / 2 - 0.004) * Math.sqrt(rnd()); x = Math.cos(a) * rr; z = Math.sin(a) * rr;
      if (placed.every(([px, pz, pl]) => Math.hypot(px - x, pz - z) > (pl + len) * 0.42)) break;
    }
    placed.push([x, z, len]);
    const yaw = rnd() * 360, tilt = rnd() * SHARDS.tiltMax;
    let body, strip = null, depth;
    if (rim) {
      // a piece of the plate's rim: outer arc radius 0.17 (blue strip 0.012 wide), then a ragged inner edge 0.02 to 0.045 deep
      const Rp = SHARDS.plateR, Ri = Rp - SHARDS.strip, a = Math.asin(Math.min(0.99, len / (2 * Rp))), d = 0.022 + 0.022 * rnd();
      const P = (th, r) => new THREE.Vector2(r * Math.sin(th), r * Math.cos(th) - Rp), N = 6;
      const outer = [], inner = [];
      for (let k = 0; k <= N; k++) { const th = -a + (2 * a * k) / N; outer.push(P(th, Rp)); inner.push(P(th, Ri)); }
      strip = new THREE.Shape([...outer, ...inner.slice().reverse()]);
      const jag = [[a * 0.88, Ri - d * (0.55 + 0.2 * rnd())], [a * 0.35, Ri - d], [-a * 0.3, Ri - d * (0.7 + 0.2 * rnd())], [-a * 0.85, Ri - d * (0.5 + 0.2 * rnd())]].map(([th, r]) => P(th, r));
      body = new THREE.Shape([...inner, ...jag]); depth = d + SHARDS.strip + (Rp - Rp * Math.cos(a));
    } else {
      // an irregular piece: a star-shaped polygon of 4 to 5 vertices, elongated
      const nv = 4 + Math.floor(rnd() * 1.99), pts = [], wid = 0.35 + 0.3 * rnd();
      for (let k = 0; k < nv; k++) { const th = ((k + 0.5 * rnd() - 0.25) / nv) * Math.PI * 2, rr = 0.7 + 0.3 * rnd(); pts.push(new THREE.Vector2(Math.cos(th) * rr * len / 2, Math.sin(th) * rr * len * wid / 2)); }
      body = new THREE.Shape(pts); depth = len * wid;
    }
    out.push({ x, z, yaw, tilt, rim, len, body, strip, depth, lift: (depth / 2) * Math.sin(tilt * D2R) + 0.0006 });
  }
  return out;
}

function buildPlateshards(P) {
  const g = new THREE.Group(); P.whole.add(g);
  const china = mat("#f7f5ef", { roughness: 0.35 }), blue = mat("#3d8fb0", { roughness: 0.4 });   // the `plate` kind's own materials (a self-light was tried: it blooms)
  for (const s of shardTable(P.spec.v ? 1 : 0)) {
    const ex = { depth: SHARDS.thick, bevelEnabled: false, curveSegments: 6 };
    const bg = new THREE.ExtrudeGeometry(s.body, ex), parts = [[bg, china]];
    if (s.strip) parts.push([new THREE.ExtrudeGeometry(s.strip, ex), blue]);
    // centre the piece on its own bounding box so yaw and tilt turn it about its middle
    const box = new THREE.Box3(); for (const [geo] of parts) { geo.computeBoundingBox(); box.union(geo.boundingBox); }
    const cx = (box.min.x + box.max.x) / 2, cy = (box.min.y + box.max.y) / 2;
    const sh = new THREE.Group(); sh.rotation.order = "YXZ"; sh.rotation.set(s.tilt * D2R, s.yaw * D2R, 0); sh.position.set(s.x, s.lift + SHARDS.thick / 2, s.z); g.add(sh);
    for (const [geo, m] of parts) {
      geo.translate(-cx, -cy, -SHARDS.thick / 2); geo.rotateX(-Math.PI / 2);   // lying flat: the extrusion runs up, the shape's y runs to -z
      const mesh = new THREE.Mesh(geo, m); mesh.castShadow = false; mesh.receiveShadow = true; mesh.userData.solid = false; mesh.userData.steam = true; sh.add(mesh);
    }
  }
  return { grip: 0, apply(ps) { g.visible = (ps.on ?? 0) >= 0.5; } };
}

export const JOKESMOON_KINDS = { moonview: buildMoonview, plateshards: buildPlateshards };
